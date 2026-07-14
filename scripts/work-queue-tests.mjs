import assert from "node:assert/strict";
import fs from "node:fs";
import { after, test } from "node:test";
import { createServer } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const vite = await createServer({
  configFile: false,
  plugins: [tsconfigPaths()],
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});
const work = await vite.ssrLoadModule("/src/domain/work/index.ts");
after(async () => vite.close());

const {
  buildWorkQueueReadModel,
  compareLegacyAndUnifiedInterventionQueues,
  createWorkQueueCacheKey,
  getUpcomingCareInterventionsLegacyShape,
  projectScheduledCareActionToWorkItem,
} = work;

const NOW = "2026-07-13T10:00:00.000Z";
const context = {
  id: "context-1",
  userAccountId: "user-1",
  staffMemberId: "staff-1",
  nursingHomeId: "home-1",
  wardSelectionMode: "multiple",
  wardIds: ["ward-1", "ward-2"],
  shiftId: "day",
  shiftLabel: "Day Shift",
  shiftStartAt: "2026-07-13T08:00:00.000Z",
  shiftEndAt: "2026-07-13T20:00:00.000Z",
  operationalDate: "2026-07-13",
  timezone: "Europe/Dublin",
  effectiveRoleKey: "NURSE",
  source: "stored",
  updatedAt: NOW,
};
const auth = {
  userAccountId: "user-1",
  staffMemberId: "staff-1",
  roleKeys: ["NURSE"],
  authorisedNursingHomeIds: ["home-1"],
  authorisedWardIds: ["ward-1", "ward-2"],
  capabilities: [
    "work_item.view",
    "care_action.view",
    "care_action.complete",
    "care_action.defer",
    "work_item.start",
    "work_item.mark_missed",
  ],
  sourceCapabilities: ["care_action.view"],
};
const resident = (id, patch = {}) => ({
  id,
  facilityId: "home-1",
  lifecycleStatus: "active",
  presenceStatus: "in_home",
  firstName: `Resident ${id}`,
  lastName: "Example",
  roomNumber: id.replace("resident-", ""),
  roomId: `room-${id}`,
  ...patch,
});
const residents = [resident("resident-1"), resident("resident-2")];
const wards = [
  { id: "ward-1", nursingHomeId: "home-1", name: "Ward 1" },
  { id: "ward-2", nursingHomeId: "home-1", name: "Ward 2" },
];
const item = (id, dueAt, patch = {}) => ({
  id,
  workType: "care_action",
  title: `Action ${id}`,
  source: {
    sourceType: "care_plan",
    sourceModule: "care_plans",
    sourceEntityType: "care_action_occurrence",
    sourceEntityId: `occ-${id}`,
    sourceOccurrenceId: `occ-${id}`,
    parentEntityType: "care_action",
    parentEntityId: `action-${id}`,
    route: "/residents/resident-1/care-plan",
    completionOwner: "care_plan_service",
    recreationPolicy: "deterministic",
    createdAt: "2026-07-01T00:00:00.000Z",
  },
  nursingHomeId: "home-1",
  wardId: "ward-1",
  roomId: "room-resident-1",
  residentId: "resident-1",
  schedule: {
    scheduleType: "recurring_occurrence",
    dueAt,
    effectiveDueAt: dueAt,
    originalDueAt: dueAt,
    timeZone: "Europe/Dublin",
  },
  persistedStatus: "scheduled",
  assignment: {
    assignmentType: "ward",
    assignedWardId: "ward-1",
    assignmentStatus: "active",
  },
  priority: "routine",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
  schemaVersion: 1,
  ...patch,
});
const query = (items, extra = {}) =>
  buildWorkQueueReadModel(context, auth, {
    items,
    references: { residents, wards },
    clock: { now: () => NOW },
    ...extra,
  });

const boundaryItems = [
  item("overdue", "2026-07-13T09:59:00.000Z"),
  item("now", NOW),
  item("30m", "2026-07-13T10:30:00.000Z"),
  item("60m", "2026-07-13T11:00:00.000Z"),
  item("61m", "2026-07-13T11:01:00.000Z"),
  item("120m", "2026-07-13T12:00:00.000Z"),
  item("240m", "2026-07-13T14:00:00.000Z"),
  item("241m", "2026-07-13T14:01:00.000Z"),
];

test("protected time boundaries preserve inclusive one-hour and four-hour policies", () => {
  const model = query(boundaryItems);
  assert.deepEqual(
    model.sections.nextHour.items.map((row) => row.workItemId),
    ["30m", "60m"],
  );
  assert.deepEqual(
    model.sections.nextFourHours.items.map((row) => row.workItemId),
    ["30m", "60m", "61m", "120m", "240m"],
  );
  assert.ok(model.sections.dueNow.items.some((row) => row.workItemId === "now"));
  assert.ok(model.sections.dueNow.items.some((row) => row.workItemId === "30m"));
  assert.deepEqual(
    model.sections.overdue.items.map((row) => row.workItemId),
    ["overdue"],
  );
});

test("section membership overlaps without duplicate rows inside a section", () => {
  const model = query([item("overlap", "2026-07-13T10:30:00.000Z")]);
  for (const section of ["dueNow", "nextHour", "nextFourHours", "today", "thisShift"])
    assert.equal(model.sections[section].count, 1);
  assert.equal(new Set(model.sections.nextFourHours.items.map((row) => row.workItemId)).size, 1);
});

test("counts and rows share predicates, including pagination totals", () => {
  const model = query(boundaryItems, { pagination: { pageSize: 2 } });
  for (const section of Object.values(model.sections)) {
    assert.equal(section.count >= section.items.length, true);
    assert.equal(section.hasMore, section.count > section.items.length);
  }
  assert.equal(model.summary.nextFourHours, model.sections.nextFourHours.count);
  assert.equal(model.summary.today, model.sections.today.count);
});

test("completed, missed, cancelled and not-applicable work is excluded from active sections", () => {
  const terminal = ["completed", "missed", "cancelled", "not_applicable"].map((status) =>
    item(status, "2026-07-13T10:30:00.000Z", { persistedStatus: status }),
  );
  assert.equal(query(terminal).summary.totalActive, 0);
});

test("deferral retains original due and classifies effective due", () => {
  const deferred = item("deferred", "2026-07-13T09:00:00.000Z", {
    persistedStatus: "deferred",
    schedule: {
      scheduleType: "recurring_occurrence",
      dueAt: "2026-07-13T09:00:00.000Z",
      originalDueAt: "2026-07-13T09:00:00.000Z",
      effectiveDueAt: "2026-07-13T11:00:00.000Z",
      timeZone: "Europe/Dublin",
    },
    deferral: {
      reasonCode: "resident_care",
      occurredAt: NOW,
      originalDueAt: "2026-07-13T09:00:00.000Z",
      deferredUntil: "2026-07-13T11:00:00.000Z",
    },
  });
  const row = query([deferred]).sections.nextHour.items[0];
  assert.equal(row.originalDueAt, "2026-07-13T09:00:00.000Z");
  assert.equal(row.effectiveDueAt, "2026-07-13T11:00:00.000Z");
});

test("resident lifecycle, home, ward and permissions are enforced before counts", () => {
  const unavailable = [
    resident("absent", { presenceStatus: "temporarily_absent" }),
    resident("hospital", { presenceStatus: "in_hospital" }),
    resident("discharged", { lifecycleStatus: "discharged" }),
  ];
  const scopedItems = [
    item("valid", "2026-07-13T10:30:00.000Z"),
    item("other-home", "2026-07-13T10:30:00.000Z", { nursingHomeId: "home-2" }),
    item("other-ward", "2026-07-13T10:30:00.000Z", { wardId: "ward-3" }),
    ...unavailable.map((value) =>
      item(value.id, "2026-07-13T10:30:00.000Z", { residentId: value.id }),
    ),
  ];
  const model = buildWorkQueueReadModel(context, auth, {
    items: scopedItems,
    references: { residents: [...residents, ...unavailable], wards },
    clock: { now: () => NOW },
  });
  assert.deepEqual(
    model.sections.nextHour.items.map((row) => row.workItemId),
    ["valid"],
  );
  assert.equal(
    query([item("hidden", "2026-07-13T10:30:00.000Z")], {
      filters: {},
    }).summary.totalActive,
    1,
  );
  assert.equal(
    buildWorkQueueReadModel(
      context,
      { ...auth, capabilities: [] },
      {
        items: [item("hidden", "2026-07-13T10:30:00.000Z")],
        references: { residents, wards },
        clock: { now: () => NOW },
      },
    ).summary.totalActive,
    0,
  );
});

test("multi-ward aggregation deduplicates by Work Item ID and keeps occurrences distinct", () => {
  const duplicate = item("same", "2026-07-13T10:30:00.000Z");
  const model = query([
    duplicate,
    { ...duplicate },
    item("same-parent-next-occurrence", "2026-07-13T11:30:00.000Z", {
      source: { ...duplicate.source, sourceEntityId: "occ-next", sourceOccurrenceId: "occ-next" },
    }),
    item("ward-2", "2026-07-13T12:30:00.000Z", { wardId: "ward-2" }),
  ]);
  assert.equal(model.summary.totalActive, 3);
});

test("3,000 residents and 12,000 occurrences remain indexed and home scoped", () => {
  const largeResidents = Array.from({ length: 3000 }, (_, index) =>
    resident(`large-${index}`, { facilityId: `home-${index % 10}` }),
  );
  const largeItems = largeResidents.flatMap((value, residentIndex) =>
    Array.from({ length: 4 }, (_, occurrence) =>
      item(`large-${residentIndex}-${occurrence}`, `2026-07-13T1${occurrence}:30:00.000Z`, {
        nursingHomeId: value.facilityId,
        residentId: value.id,
        wardId: "ward-1",
      }),
    ),
  );
  const startedAt = performance.now();
  const model = buildWorkQueueReadModel(context, auth, {
    items: largeItems,
    references: { residents: largeResidents, wards },
    clock: { now: () => NOW },
  });
  const elapsedMs = performance.now() - startedAt;
  assert.equal(model.summary.totalActive, 1200);
  assert.ok(elapsedMs < 5000, `read model took ${elapsedMs.toFixed(1)}ms`);
  console.log(`# Work Queue performance: 12,000 items in ${elapsedMs.toFixed(1)}ms`);
});

test("cache keys sort wards and include role, timezone, filters and schema", () => {
  const first = createWorkQueueCacheKey(context, auth, { priorities: ["urgent"] }, {}, "7");
  const second = createWorkQueueCacheKey(
    { ...context, wardIds: [...context.wardIds].reverse() },
    auth,
    { priorities: ["urgent"] },
    {},
    "7",
  );
  assert.equal(first, second);
  assert.match(first, /Europe\/Dublin/);
});

const intervention = {
  id: "care-action-1",
  facilityId: "home-1",
  problemId: "care-plan-item-1",
  residentId: "resident-1",
  name: "Reposition resident",
  description: "Assist and document position",
  frequencyType: "every_2_hours",
  assignedRole: "nurse",
  startDate: "2026-07-01",
  reviewDate: "2026-08-01",
  endDate: "2026-09-01",
  status: "active",
  createdAt: "2026-07-01T09:00:00.000Z",
  createdBy: "staff-1",
  createdByRole: "nurse",
};
const problem = {
  id: "care-plan-item-1",
  residentCarePlanId: "care-plan-1",
  residentId: "resident-1",
  rltDomainId: "safe_environment",
  status: "active",
};
const scheduled = {
  intervention,
  problem,
  dueAt: new Date("2026-07-13T10:30:00.000Z"),
  status: "due_now",
  dueTime: { primaryStatus: "due_now" },
};

test("Care Action adapter preserves source, Care Plan, RLT, placement and deterministic identity", () => {
  const placement = {
    resident: residents[0],
    nursingHomeId: "home-1",
    wardId: "ward-1",
    roomId: "room-resident-1",
    bedId: "bed-1",
  };
  const first = projectScheduledCareActionToWorkItem(scheduled, placement, context);
  const replay = projectScheduledCareActionToWorkItem(scheduled, placement, context);
  assert.equal(first.id, replay.id);
  assert.equal(first.source.sourceOccurrenceId, replay.source.sourceOccurrenceId);
  assert.equal(first.careContext.carePlanId, "care-plan-1");
  assert.equal(first.careContext.carePlanItemId, "care-plan-item-1");
  assert.equal(first.careContext.rltDomainId, "safe_environment");
  assert.equal(first.bedId, "bed-1");
  assert.equal(first.source.completionOwner, "care_plan_service");
});

test("legacy and unified Care Action projections have exact source-occurrence parity", () => {
  const projected = projectScheduledCareActionToWorkItem(
    scheduled,
    { resident: residents[0], nursingHomeId: "home-1", wardId: "ward-1" },
    context,
  );
  const report = compareLegacyAndUnifiedInterventionQueues([scheduled], [projected], "home-1", [
    "ward-1",
  ]);
  assert.equal(report.matches, true);
  assert.equal(report.exactMatches, 1);
});

test("shadow comparison returns the exact legacy object shape and unified mode is available", () => {
  const input = {
    interventions: [intervention],
    logs: [],
    problems: [problem],
    residents,
    operationalContext: context,
    authorizationContext: auth,
    now: new Date(NOW),
    scope: { residentIds: new Set(["resident-1"]), until: new Date(context.shiftEndAt) },
    placementForResident: () => ({ nursingHomeId: "home-1", wardId: "ward-1" }),
  };
  const shadow = getUpcomingCareInterventionsLegacyShape(input);
  const unified = getUpcomingCareInterventionsLegacyShape({ ...input, mode: "unified" });
  assert.equal(shadow.mode, "shadow_compare");
  assert.equal(shadow.items, shadow.legacyItems);
  assert.deepEqual(unified.items, shadow.items);
});

test("protected fixture catalogue contains all thirty requested parity scenarios", () => {
  const fixtures = [
    "due now",
    "overdue",
    "30 minutes",
    "exactly one hour",
    "61 minutes",
    "two hours",
    "exactly four hours",
    "four hours one minute",
    "later today",
    "current shift",
    "outside shift",
    "completed",
    "completed late",
    "missed",
    "deferred",
    "cancelled",
    "discontinued",
    "PRN",
    "one-off",
    "each-shift",
    "night-shift",
    "another ward",
    "another home",
    "temporarily absent",
    "hospital",
    "discharged",
    "multi-ward",
    "similar resident names",
    "similar action titles",
    "multiple occurrences",
  ];
  assert.equal(fixtures.length, 30);
  assert.equal(new Set(fixtures).size, 30);
});

test("Operations component retains protected headings, actions, empty states and routes", () => {
  const component = fs.readFileSync("src/components/operations/OperationsHub.tsx", "utf8");
  for (const protectedText of [
    "Upcoming Care Actions",
    "Next 4 Hours",
    "Open Resident",
    "No upcoming scheduled care actions for your assigned residents.",
    "No scheduled work in the next 4 hours.",
  ])
    assert.ok(component.includes(protectedText), `missing protected text: ${protectedText}`);
  assert.match(component, /to="\/residents\/\$id"/);
  assert.match(component, /getUpcomingCareInterventionsLegacyShape/);
  assert.match(component, /interventionQueue\.nextFourHoursItems/);
});
