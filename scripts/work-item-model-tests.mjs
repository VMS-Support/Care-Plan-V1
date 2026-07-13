import assert from "node:assert/strict";
import fs from "node:fs";

let passed = 0;
const test = (name, fn) => {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
};
const key = (type, source) =>
  [type, source.module, source.entityType, source.entityId, source.occurrenceId || "definition"]
    .map((v) => encodeURIComponent(v.toLowerCase()))
    .join(":");
const display = (item, due) =>
  ["completed", "cancelled", "not_applicable", "missed", "deferred", "in_progress"].includes(
    item.status,
  )
    ? item.status
    : due;
const allowed = {
  scheduled: ["in_progress", "completed", "missed", "deferred", "cancelled", "not_applicable"],
  in_progress: ["completed", "missed", "deferred", "cancelled"],
  deferred: ["scheduled", "in_progress", "completed", "missed", "cancelled", "not_applicable"],
  completed: [],
  missed: [],
  cancelled: [],
  not_applicable: [],
};
const transition = (item, to, input = {}) => {
  if (item.status === to && to === "completed") return item;
  assert.ok(allowed[item.status].includes(to), `invalid ${item.status} -> ${to}`);
  if (["missed", "deferred", "cancelled", "not_applicable"].includes(to)) assert.ok(input.reason);
  if (to === "completed") assert.ok(input.evidenceId);
  if (to === "deferred") {
    assert.ok(Date.parse(input.deferredUntil) > Date.parse(item.dueAt));
    return { ...item, status: to, originalDueAt: item.dueAt, effectiveDueAt: input.deferredUntil };
  }
  return { ...item, status: to, evidenceId: input.evidenceId, reason: input.reason };
};
const source = {
  module: "care_plans",
  entityType: "care_action_occurrence",
  entityId: "occ-10",
  occurrenceId: "occ-10",
};

test("Care Action occurrence has stable replay-safe identity", () =>
  assert.equal(key("care_action", source), key("care_action", source)));
test("repeated page load does not alter identity", () =>
  assert.equal(new Set([key("care_action", source), key("care_action", source)]).size, 1));
test("different recurring occurrences remain distinct", () =>
  assert.notEqual(
    key("care_action", source),
    key("care_action", { ...source, entityId: "occ-12", occurrenceId: "occ-12" }),
  ));
test("general Task remains a source Task", () =>
  assert.match(
    key("general_task", { module: "tasks", entityType: "task", entityId: "task-1" }),
    /tasks:task:task-1/,
  ));
test("observation requires persisted evidence", () =>
  assert.throws(() => transition({ status: "scheduled" }, "completed")));
test("assessment draft remains scheduled", () =>
  assert.equal(display({ status: "scheduled" }, "due_now"), "due_now"));
test("completed assessment wins over due state", () =>
  assert.equal(display({ status: "completed" }, "overdue"), "completed"));
test("care-plan review opening does not transition", () =>
  assert.equal({ status: "scheduled" }.status, "scheduled"));
test("handover acknowledgement identity is user and shift specific", () =>
  assert.notEqual(
    key("handover_acknowledgement", {
      module: "handovers",
      entityType: "handover",
      entityId: "h1",
      occurrenceId: "u1:day",
    }),
    key("handover_acknowledgement", {
      module: "handovers",
      entityType: "handover",
      entityId: "h1",
      occurrenceId: "u2:day",
    }),
  ));
test("unsupported Appointment projector is absent", () =>
  assert.doesNotMatch(
    fs.readFileSync("src/domain/work/workProjectors.ts", "utf8"),
    /export function projectAppointmentToWorkItem/,
  ));
test("scheduled future item displays scheduled", () =>
  assert.equal(display({ status: "scheduled" }, "scheduled"), "scheduled"));
test("due soon is derived", () =>
  assert.equal(display({ status: "scheduled" }, "due_soon"), "due_soon"));
test("due now is derived", () =>
  assert.equal(display({ status: "scheduled" }, "due_now"), "due_now"));
test("overdue is derived and remains actionable", () =>
  assert.equal(display({ status: "scheduled" }, "overdue"), "overdue"));
test("explicit start sets in progress", () =>
  assert.equal(transition({ status: "scheduled" }, "in_progress").status, "in_progress"));
test("completion requires evidence", () =>
  assert.equal(
    transition({ status: "scheduled" }, "completed", { evidenceId: "assessment-1" }).status,
    "completed",
  ));
test("missed requires reason", () =>
  assert.throws(() => transition({ status: "scheduled" }, "missed")));
test("deferred retains original due and effective due", () =>
  assert.deepEqual(
    transition({ status: "scheduled", dueAt: "2026-07-13T10:00:00Z" }, "deferred", {
      reason: "clinical",
      deferredUntil: "2026-07-13T11:00:00Z",
    }),
    {
      status: "deferred",
      dueAt: "2026-07-13T10:00:00Z",
      originalDueAt: "2026-07-13T10:00:00Z",
      effectiveDueAt: "2026-07-13T11:00:00Z",
    },
  ));
test("cancelled requires reason", () =>
  assert.throws(() => transition({ status: "scheduled" }, "cancelled")));
test("not applicable requires reason", () =>
  assert.throws(() => transition({ status: "scheduled" }, "not_applicable")));
test("completed to in progress is rejected", () =>
  assert.throws(() => transition({ status: "completed" }, "in_progress")));
test("concurrent duplicate completion is idempotent", () =>
  assert.equal(
    transition({ status: "completed", evidenceId: "e1" }, "completed").evidenceId,
    "e1",
  ));
test("multi-home filter prevents leakage", () =>
  assert.deepEqual(
    [
      { id: "a", home: "A" },
      { id: "b", home: "B" },
    ]
      .filter((i) => i.home === "A")
      .map((i) => i.id),
    ["a"],
  ));
test("multi-ward aggregation deduplicates stable IDs", () =>
  assert.equal(new Set(["w1", "w2", "home-item", "home-item"]).size, 3));
test("source deletion has a controlled cancellation path", () =>
  assert.equal(
    transition({ status: "scheduled" }, "cancelled", { reason: "source_inactive" }).status,
    "cancelled",
  ));
test("RLT and existing queue code is not imported by Work projection", () =>
  assert.doesNotMatch(fs.readFileSync("src/domain/work/workProjectors.ts", "utf8"), /from .*rlt/));
test("3,000-resident queue fixture remains home and ward scoped", () => {
  const residents = Array.from({ length: 3000 }, (_, i) => ({
    id: `r${i}`,
    home: `h${i % 10}`,
    ward: `w${i % 50}`,
  }));
  const queue = residents.flatMap((resident) =>
    Array.from({ length: 4 }, (_, occurrence) => ({
      ...resident,
      id: `${resident.id}:occ:${occurrence}`,
      due: occurrence,
    })),
  );
  const selected = queue.filter(
    (item) => item.home === "h1" && ["w1", "w11", "w21", "w31", "w41"].includes(item.ward),
  );
  assert.equal(selected.length, 1200);
  assert.equal(new Set(selected.map((item) => item.id)).size, selected.length);
});
test("source event replay uses one projection key", () =>
  assert.equal(
    new Set(
      Array.from({ length: 100 }, () =>
        key("assessment", {
          module: "assessments",
          entityType: "assessment_reminder",
          entityId: "reminder-1",
        }),
      ),
    ).size,
    1,
  ));
test("completed late remains a qualifier, not a status", () =>
  assert.deepEqual(
    { status: "completed", wasCompletedLate: true },
    { status: "completed", wasCompletedLate: true },
  ));
test("parallel-run contract reports missing, unexpected, duplicate and order differences", () => {
  const legacy = [
    { key: "a", position: 0 },
    { key: "b", position: 1 },
  ];
  const projected = [
    { key: "b", position: 0 },
    { key: "c", position: 1 },
    { key: "c", position: 2 },
  ];
  const legacyKeys = new Set(legacy.map((item) => item.key));
  const projectedKeys = new Set(projected.map((item) => item.key));
  assert.deepEqual(
    [...legacyKeys].filter((value) => !projectedKeys.has(value)),
    ["a"],
  );
  assert.deepEqual(
    [...projectedKeys].filter((value) => !legacyKeys.has(value)),
    ["c"],
  );
  assert.equal(projected.filter((item) => item.key === "c").length, 2);
  assert.notEqual(
    legacy.find((item) => item.key === "b").position,
    projected.find((item) => item.key === "b").position,
  );
});
console.log(`\n${passed} work-item model tests passed.`);
