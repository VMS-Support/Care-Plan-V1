import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer } from "vite";

const vite = await createServer({
  configFile: false,
  plugins: [],
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});
const recurrence = await vite.ssrLoadModule("/src/domain/recurrence/index.ts");
const work = await vite.ssrLoadModule("/src/domain/work/sourceTraceability.ts");
after(async () => vite.close());

const {
  createPrnOccurrence,
  createOccurrenceSourceReference,
  createTriggeredOccurrence,
  generateOccurrences,
  getLocalDateTimeParts,
  occurrenceToWorkSchedule,
  reconcileOccurrenceEligibility,
  validateRecurrenceModel,
} = recurrence;

const baseRule = (patch = {}) => ({
  id: "rule-1",
  recurrenceType: "daily",
  active: true,
  nursingHomeId: "home-1",
  sourceEntityId: "source-1",
  residentId: "resident-1",
  wardId: "ward-1",
  startsAt: "2026-07-13T08:00:00.000Z",
  timezone: "Europe/Dublin",
  generatedHorizonDays: 30,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
  ...patch,
});
const generate = (
  rule,
  windowStart = rule.startsAt,
  windowEnd = "2026-08-13T00:00:00.000Z",
  extra = {},
) =>
  generateOccurrences({
    rule,
    windowStart,
    windowEnd,
    generatedAt: "2026-07-13T00:00:00.000Z",
    ...extra,
  });

test("2-hourly Care Action produces deterministic occurrences", () => {
  const rows = generate(
    baseRule({ recurrenceType: "hourly", interval: 2, startsAt: "2026-07-13T00:00:00.000Z" }),
    "2026-07-13T00:00:00.000Z",
    "2026-07-13T07:00:00.000Z",
  );
  assert.deepEqual(
    rows.map((row) => row.dueAt),
    [
      "2026-07-13T00:00:00.000Z",
      "2026-07-13T02:00:00.000Z",
      "2026-07-13T04:00:00.000Z",
      "2026-07-13T06:00:00.000Z",
    ],
  );
  assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
});

test("daily assessment keeps nursing-home wall time across DST", () => {
  const rule = baseRule({ startsAt: "2026-03-28T09:00:00.000Z" });
  const rows = generate(rule, rule.startsAt, "2026-03-31T00:00:00.000Z");
  assert.deepEqual(
    rows.map((row) => getLocalDateTimeParts(row.dueAt, rule.timezone).hour),
    [9, 9, 9],
  );
  assert.deepEqual(
    rows.map((row) => row.dueAt),
    ["2026-03-28T09:00:00.000Z", "2026-03-29T08:00:00.000Z", "2026-03-30T08:00:00.000Z"],
  );
});

test("weekly and selected-days schedules use configured weekdays", () => {
  const weekly = generate(
    baseRule({
      recurrenceType: "weekly",
      startsAt: "2026-07-13T08:00:00.000Z",
      selectedDays: [1, 3, 5],
    }),
    "2026-07-13T00:00:00.000Z",
    "2026-07-20T00:00:00.000Z",
  );
  assert.deepEqual(
    weekly.map((row) => getLocalDateTimeParts(row.dueAt, "Europe/Dublin").day),
    [13, 15, 17],
  );
  const selected = generate(
    baseRule({ recurrenceType: "selected_days", selectedDays: [2, 4, 6] }),
    "2026-07-13T00:00:00.000Z",
    "2026-07-20T00:00:00.000Z",
  );
  assert.deepEqual(
    selected.map((row) => getLocalDateTimeParts(row.dueAt, "Europe/Dublin").day),
    [14, 16, 18],
  );
});

test("monthly day and last-Monday schedules are supported", () => {
  const monthly = generate(
    baseRule({
      recurrenceType: "monthly",
      startsAt: "2026-01-15T09:00:00.000Z",
      monthlyDay: 15,
      generatedHorizonDays: 100,
    }),
    "2026-01-01T00:00:00.000Z",
    "2026-04-01T00:00:00.000Z",
  );
  assert.deepEqual(
    monthly.map((row) => getLocalDateTimeParts(row.dueAt, "Europe/Dublin").day),
    [15, 15, 15],
  );
  const lastMonday = generate(
    baseRule({
      recurrenceType: "monthly",
      startsAt: "2026-01-01T09:00:00.000Z",
      monthlyWeekday: 1,
      monthlyWeekOrdinal: "last",
      generatedHorizonDays: 100,
    }),
    "2026-01-01T00:00:00.000Z",
    "2026-03-01T00:00:00.000Z",
  );
  assert.deepEqual(
    lastMonday.map((row) => getLocalDateTimeParts(row.dueAt, "Europe/Dublin").day),
    [26, 23],
  );
});

test("custom 90-minute schedule is supported", () => {
  const rows = generate(
    baseRule({
      recurrenceType: "custom_interval",
      customMinutes: 90,
      startsAt: "2026-07-13T00:00:00.000Z",
    }),
    "2026-07-13T00:00:00.000Z",
    "2026-07-13T05:00:00.000Z",
  );
  assert.deepEqual(
    rows.map((row) => row.dueAt),
    [
      "2026-07-13T00:00:00.000Z",
      "2026-07-13T01:30:00.000Z",
      "2026-07-13T03:00:00.000Z",
      "2026-07-13T04:30:00.000Z",
    ],
  );
});

test("each-shift recurrence uses configured shift definitions", () => {
  const shifts = [
    {
      id: "day",
      nursingHomeId: "home-1",
      label: "Day Shift",
      startsAt: "07:30",
      endsAt: "15:30",
      active: true,
      sortOrder: 0,
    },
    {
      id: "night",
      nursingHomeId: "home-1",
      label: "Night Shift",
      startsAt: "21:30",
      endsAt: "07:30",
      active: true,
      sortOrder: 1,
    },
  ];
  const rows = generate(
    baseRule({ recurrenceType: "each_shift", startsAt: "2026-07-13T00:00:00.000Z" }),
    "2026-07-13T00:00:00.000Z",
    "2026-07-15T00:00:00.000Z",
    { shifts },
  );
  assert.deepEqual(
    rows.map((row) => row.shiftId),
    ["day", "night", "day", "night"],
  );
  assert.deepEqual(
    rows.map((row) => row.operationalDate),
    ["2026-07-13", "2026-07-13", "2026-07-14", "2026-07-14"],
  );
});

test("PRN creates nothing until explicitly triggered and enforces reason", () => {
  const rule = baseRule({ recurrenceType: "prn", prnReasonRequired: true });
  assert.deepEqual(generate(rule), []);
  assert.throws(() => createPrnOccurrence(rule, { id: "prn-1", at: rule.startsAt }));
  const row = createPrnOccurrence(rule, {
    id: "prn-1",
    at: rule.startsAt,
    reason: "Pain reported",
  });
  assert.equal(row.triggerId, "prn-1");
});

test("triggered recurrence creates only from an allowed event", () => {
  const rule = baseRule({
    recurrenceType: "triggered",
    triggerEventTypes: ["ResidentReturnedFromHospital"],
  });
  assert.deepEqual(generate(rule), []);
  assert.throws(() =>
    createTriggeredOccurrence(rule, {
      eventId: "e1",
      occurredAt: rule.startsAt,
      eventType: "Other",
    }),
  );
  assert.equal(
    createTriggeredOccurrence(rule, {
      eventId: "e1",
      occurredAt: rule.startsAt,
      eventType: "ResidentReturnedFromHospital",
    }).triggerEventId,
    "e1",
  );
});

test("one-off recurrence generates exactly one item", () => {
  const rows = generate(baseRule({ recurrenceType: "one_off" }));
  assert.equal(rows.length, 1);
});

test("DST missing hour advances to first valid local time", () => {
  const rule = baseRule({ startsAt: "2026-03-28T01:30:00.000Z" });
  const rows = generate(rule, rule.startsAt, "2026-03-31T00:00:00.000Z");
  const local = getLocalDateTimeParts(rows[1].dueAt, rule.timezone);
  assert.equal(local.hour, 2);
  assert.equal(local.minute, 0);
});

test("DST duplicate hour and generator replay are deterministic", () => {
  const rule = baseRule({ startsAt: "2026-10-24T00:30:00.000Z" });
  const first = generate(rule, rule.startsAt, "2026-10-27T00:00:00.000Z");
  const replay = generate(rule, rule.startsAt, "2026-10-27T00:00:00.000Z");
  assert.deepEqual(
    first.map((row) => row.id),
    replay.map((row) => row.id),
  );
  assert.equal(new Set(first.map((row) => row.id)).size, first.length);
});

test("existing completion survives replay", () => {
  const rule = baseRule({ recurrenceType: "hourly", interval: 2 });
  const first = generate(rule, rule.startsAt, "2026-07-13T14:00:00.000Z");
  const existing = [{ ...first[0], completed: true, completedAt: "2026-07-13T08:01:00.000Z" }];
  const replay = generate(rule, rule.startsAt, "2026-07-13T14:00:00.000Z", {
    existingOccurrences: existing,
  });
  assert.equal(replay[0].completed, true);
  assert.equal(replay[0].completedAt, existing[0].completedAt);
});

test("hospital suspends future bedside work; return resumes it", () => {
  const rule = baseRule({ recurrenceType: "hourly", interval: 2, bedsideCare: true });
  const rows = generate(rule, rule.startsAt, "2026-07-13T14:00:00.000Z");
  const hospital = reconcileOccurrenceEligibility(rows, {
    sourceActive: true,
    resident: { lifecycleStatus: "active", presenceStatus: "in_hospital" },
    now: "2026-07-13T07:00:00.000Z",
  });
  assert.ok(hospital.every((row) => row.suspended));
  const returned = reconcileOccurrenceEligibility(hospital, {
    sourceActive: true,
    resident: { lifecycleStatus: "active", presenceStatus: "in_home" },
    now: "2026-07-13T07:00:00.000Z",
  });
  assert.ok(returned.every((row) => !row.suspended));
});

test("discharge and source inactivation cancel future but retain completed history", () => {
  const rows = generate(
    baseRule({ recurrenceType: "hourly" }),
    "2026-07-13T08:00:00.000Z",
    "2026-07-13T12:00:00.000Z",
  );
  rows[0] = { ...rows[0], completed: true };
  const discharged = reconcileOccurrenceEligibility(rows, {
    sourceActive: true,
    resident: { lifecycleStatus: "discharged" },
    now: "2026-07-13T07:00:00.000Z",
  });
  assert.equal(discharged[0].cancelled, false);
  assert.ok(discharged.slice(1).every((row) => row.cancelled));
  const inactive = reconcileOccurrenceEligibility(rows, {
    sourceActive: false,
    now: "2026-07-13T07:00:00.000Z",
  });
  assert.ok(inactive.slice(1).every((row) => row.cancellationReason === "source_inactive"));
});

test("generation horizon prevents years of future occurrences", () => {
  const rule = baseRule({ recurrenceType: "daily", generatedHorizonDays: 2 });
  assert.equal(generate(rule, rule.startsAt, "2027-01-01T00:00:00.000Z").length, 2);
});

test("validation detects duplicate, orphan, cross-home and timezone faults", () => {
  const rule = baseRule();
  const row = generate(rule, rule.startsAt, "2026-07-14T00:00:00.000Z")[0];
  const report = validateRecurrenceModel(
    [{ ...rule, timezone: "Invalid/Zone" }],
    [row, row, { ...row, recurrenceRuleId: "missing-rule" }],
    {
      nursingHomeIds: new Set(["home-1"]),
      sourceExists: () => false,
      sourceNursingHomeId: () => "home-2",
    },
  );
  assert.equal(report.valid, false);
  assert.ok(report.issues.some((issue) => issue.code === "duplicate_occurrence"));
  assert.ok(report.issues.some((issue) => issue.code === "invalid_timezone"));
  assert.ok(report.issues.some((issue) => issue.code === "orphan_occurrence"));
  assert.ok(report.issues.some((issue) => issue.code === "cross_home_rule"));
});

test("source traceability rejects orphan and missing route", () => {
  const item = {
    id: "work-1",
    workType: "general_task",
    title: "Follow up",
    nursingHomeId: "home-1",
    source: {
      sourceType: "manual_task",
      sourceModule: "tasks",
      sourceEntityType: "task",
      sourceEntityId: "task-1",
      completionOwner: "task_service",
      recreationPolicy: "manual_only",
      createdAt: "2026-07-13T08:00:00.000Z",
    },
    schedule: { scheduleType: "one_off", timeZone: "Europe/Dublin" },
    persistedStatus: "scheduled",
    assignment: { type: "unassigned" },
    priority: "routine",
    createdAt: "2026-07-13T08:00:00.000Z",
    updatedAt: "2026-07-13T08:00:00.000Z",
    schemaVersion: 1,
  };
  const report = work.validateWorkSourceTraceability([item], { sourceExists: () => false });
  assert.equal(report.valid, false);
  assert.ok(report.issues.some((issue) => issue.code === "orphan_source"));
  assert.ok(report.issues.some((issue) => issue.code === "missing_source_route"));
});

test("occurrence links directly to its parent source and Work schedule", () => {
  const rule = baseRule({ recurrenceType: "hourly", interval: 2 });
  const occurrence = generate(rule, rule.startsAt, "2026-07-13T10:00:00.000Z")[0];
  const source = createOccurrenceSourceReference(occurrence, rule, {
    sourceType: "care_plan",
    sourceModule: "care_plans",
    sourceEntityType: "care_action_occurrence",
    parentEntityType: "care_action",
    route: "/residents/resident-1/care-plan",
    completionOwner: "care_plan_service",
  });
  assert.equal(source.sourceOccurrenceId, occurrence.id);
  assert.equal(source.parentEntityId, rule.sourceEntityId);
  assert.equal(source.recreationPolicy, "deterministic");
  const schedule = occurrenceToWorkSchedule(occurrence, rule);
  assert.equal(schedule.recurrenceId, rule.id);
  assert.equal(schedule.scheduleType, "recurring_occurrence");
});
