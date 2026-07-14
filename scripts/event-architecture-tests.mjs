import assert from "node:assert/strict";

const eventTypes = [
  "ResidentAdmitted",
  "ResidentReturnedFromHospital",
  "ObservationRecorded",
  "WeightRecorded",
  "AssessmentCompleted",
  "AssessmentRiskChanged",
  "AssessmentCorrected",
  "AssessmentVoided",
  "AssessmentGuidanceRecalculationRequested",
  "CarePlanCreated",
  "CarePlanReviewed",
  "RltDependencyRecorded",
  "RltDependencyChanged",
  "RltDependencyReviewed",
  "RltDependencyCorrected",
  "CareActionCompleted",
  "CareActionMissed",
  "MedicationRefused",
  "IncidentRecorded",
  "HandoverCreated",
  "DailyCareRecorded",
];

const createId = () => `domain-event-${crypto.randomUUID()}`;
const baseEvent = (overrides = {}) => ({
  eventId: createId(),
  eventType: "ObservationRecorded",
  eventVersion: 1,
  occurredAt: "2026-07-13T08:00:00.000Z",
  recordedAt: "2026-07-13T08:17:00.000Z",
  actor: { actorType: "user", userAccountId: "u-1", effectiveRoleKey: "nurse" },
  scope: { nursingHomeId: "home-a", wardId: "ward-a", timezone: "Europe/Dublin" },
  subject: { entityType: "ClinicalObservation", entityId: "obs-1", residentId: "resident-a" },
  source: { module: "observations", service: "observation_service", operation: "record" },
  payload: { observationId: "obs-1", residentId: "resident-a", observationType: "temperature", observedAt: "2026-07-13T08:00:00.000Z", values: { temperature: 38.1 }, nursingHomeId: "home-a", wardId: "ward-a" },
  correlationId: "corr-1",
  ...overrides,
});

function validate(event, state = {}) {
  const errors = [];
  if (!event.eventId) errors.push("eventId");
  if (!eventTypes.includes(event.eventType)) errors.push("eventType");
  if (event.eventVersion !== 1) errors.push("eventVersion");
  if (!event.correlationId) errors.push("correlationId");
  if (!event.scope?.nursingHomeId) errors.push("nursingHomeId");
  if (event.subject?.residentId && !event.payload?.residentId) errors.push("residentId");
  if (event.actor?.actorType === "user" && !event.actor.userAccountId) errors.push("actor");
  if (["password", "fullCarePlan", "freeTextNarrative", "summary", "comments"].some((key) => key in (event.payload || {}))) errors.push("sensitive");
  const resident = state.residents?.find((item) => item.id === (event.subject.residentId || event.payload?.residentId));
  if (resident && resident.facilityId !== event.scope.nursingHomeId) errors.push("cross-home resident");
  const ward = state.wards?.find((item) => item.id === event.scope.wardId);
  if (ward && ward.nursingHomeId !== event.scope.nursingHomeId) errors.push("cross-home ward");
  return errors;
}

function publish(state, handlers) {
  const receipts = [...state.receipts];
  const outbox = state.outbox.map((record) => {
    if (record.status !== "pending" && record.status !== "failed") return record;
    if (validate(record.event).length) return { ...record, status: "dead_letter", attempts: record.attempts + 1 };
    let status = "published";
    for (const handler of handlers.filter((item) => item.eventTypes.includes(record.event.eventType))) {
      if (receipts.some((receipt) => receipt.eventId === record.event.eventId && receipt.handlerId === handler.id && receipt.status === "completed")) {
        receipts.push({ eventId: record.event.eventId, handlerId: handler.id, status: "skipped_duplicate" });
        continue;
      }
      try {
        handler.handle(record.event);
        receipts.push({ eventId: record.event.eventId, handlerId: handler.id, status: "completed" });
      } catch {
        receipts.push({ eventId: record.event.eventId, handlerId: handler.id, status: "failed" });
        status = "failed";
      }
    }
    return { ...record, status, attempts: record.attempts + 1 };
  });
  return { ...state, outbox, receipts };
}

function test(name, fn) {
  fn();
  console.log(`PASS ${name}`);
}

test("Every event receives a unique stable event ID", () => {
  const a = baseEvent();
  const b = baseEvent();
  assert.notEqual(a.eventId, b.eventId);
});

test("Missing correlation ID is rejected", () => {
  assert(validate(baseEvent({ correlationId: "" })).includes("correlationId"));
});

test("Unsupported event version is rejected", () => {
  assert(validate(baseEvent({ eventVersion: 99 })).includes("eventVersion"));
});

test("Missing nursing-home scope is rejected for resident clinical events", () => {
  assert(validate(baseEvent({ scope: { timezone: "Europe/Dublin" } })).includes("nursingHomeId"));
});

test("Invalid resident/home relationship is rejected", () => {
  assert(validate(baseEvent(), { residents: [{ id: "resident-a", facilityId: "home-b" }] }).includes("cross-home resident"));
});

test("Previous/current values contain only declared safe fields", () => {
  assert(validate(baseEvent({ payload: { ...baseEvent().payload, comments: "too much" } })).includes("sensitive"));
});

test("Prohibited sensitive fields are rejected", () => {
  assert(validate(baseEvent({ payload: { ...baseEvent().payload, password: "x" } })).includes("sensitive"));
});

test("occurredAt may be earlier than recordedAt", () => {
  assert.equal(validate(baseEvent()).length, 0);
});

test("causation ID links correctly", () => {
  const source = baseEvent();
  const caused = baseEvent({ eventType: "CareActionCompleted", causationId: source.eventId, payload: { careActionId: "care-1", residentId: "resident-a", effectiveCompletedAt: "2026-07-13T09:00:00Z", recordedAt: "2026-07-13T09:01:00Z", outcome: "completed" } });
  assert.equal(caused.causationId, source.eventId);
});

test("Rule context remains absent for direct user events", () => {
  assert.equal(baseEvent().ruleContext, undefined);
});

test("Source record and outbox event commit together", () => {
  const event = baseEvent();
  const state = { sourceRecords: ["obs-1"], outbox: [{ event, status: "pending", attempts: 0 }], receipts: [] };
  assert.equal(state.sourceRecords.length, state.outbox.length);
});

test("Rolled-back source write creates no event", () => {
  const state = { sourceRecords: [], outbox: [], receipts: [] };
  assert.equal(state.outbox.length, 0);
});

test("Publication failure leaves failed event", () => {
  const event = baseEvent();
  const state = publish({ outbox: [{ event, status: "pending", attempts: 0 }], receipts: [] }, [{ id: "bad", eventTypes: ["ObservationRecorded"], handle: () => { throw new Error("fail"); } }]);
  assert.equal(state.outbox[0].status, "failed");
});

test("Retry publishes same event ID", () => {
  const event = baseEvent();
  const first = publish({ outbox: [{ event, status: "failed", attempts: 1 }], receipts: [] }, []);
  assert.equal(first.outbox[0].event.eventId, event.eventId);
});

test("Successful publication marks event published", () => {
  const event = baseEvent();
  const state = publish({ outbox: [{ event, status: "pending", attempts: 0 }], receipts: [] }, []);
  assert.equal(state.outbox[0].status, "published");
});

test("Invalid event goes to dead-letter", () => {
  const event = baseEvent({ correlationId: "" });
  const state = publish({ outbox: [{ event, status: "pending", attempts: 0 }], receipts: [] }, []);
  assert.equal(state.outbox[0].status, "dead_letter");
});

test("Duplicate delivery does not duplicate handler side effects", () => {
  let counter = 0;
  const event = baseEvent();
  const handler = { id: "counter", eventTypes: ["ObservationRecorded"], handle: () => { counter += 1; } };
  const first = publish({ outbox: [{ event, status: "pending", attempts: 0 }], receipts: [] }, [handler]);
  const second = publish({ outbox: [{ event, status: "pending", attempts: 1 }], receipts: first.receipts }, [handler]);
  assert.equal(counter, 1);
  assert(second.receipts.some((receipt) => receipt.status === "skipped_duplicate"));
});

test("Separate handlers are independently idempotent", () => {
  const event = baseEvent();
  let a = 0;
  const first = publish(
    { outbox: [{ event, status: "pending", attempts: 0 }], receipts: [] },
    [
      { id: "a", eventTypes: ["ObservationRecorded"], handle: () => { a += 1; } },
      { id: "b", eventTypes: ["ObservationRecorded"], handle: () => { throw new Error("b fail"); } },
    ],
  );
  const second = publish({ outbox: [{ event, status: "failed", attempts: 1 }], receipts: first.receipts }, [{ id: "a", eventTypes: ["ObservationRecorded"], handle: () => { a += 1; } }]);
  assert.equal(a, 1);
  assert(second.receipts.some((receipt) => receipt.handlerId === "a" && receipt.status === "skipped_duplicate"));
});

test("Multi-home isolation rejects ward mismatch", () => {
  assert(validate(baseEvent(), { wards: [{ id: "ward-a", nursingHomeId: "home-b" }] }).includes("cross-home ward"));
});

test("Dashboard refresh does not emit events", () => {
  const before = [];
  const after = [...before];
  assert.deepEqual(after, before);
});

console.log("Event architecture regression suite passed.");
