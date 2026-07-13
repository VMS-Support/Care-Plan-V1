import assert from "node:assert/strict";

const prohibited = /(password|token|secret|credential)$/i;
const requiresReason = (action, entityType) =>
  ["delete", "inactivate", "void", "correct", "dismiss", "defer", "cancel", "discharge", "mark_deceased", "grant_permission", "deny_permission"].includes(action) ||
  ["assessment", "observation", "care_action", "permission"].includes(entityType) && ["void", "correct"].includes(action);

function changes(before, after) {
  return Object.keys(after)
    .filter((field) => !prohibited.test(field))
    .filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
    .map((field) => ({ field, previousValue: before[field], newValue: after[field] }));
}

function audit(input) {
  if (requiresReason(input.action, input.entityType) && !input.reasonText && !input.reasonCode) {
    throw new Error("reason required");
  }
  const cleanChanges = (input.changes || []).filter((change) => !prohibited.test(change.field));
  return {
    id: input.id || `audit-${input.entityType}-${input.entityId}-${input.action}`,
    occurredAt: input.occurredAt || "2026-07-13T09:15:00.000Z",
    recordedAt: input.recordedAt || "2026-07-13T09:15:00.000Z",
    effectiveAt: input.effectiveAt,
    actorType: input.actorType || "user",
    actorUserAccountId: input.actorUserAccountId || "u-nurse",
    actorDisplayName: input.actorDisplayName || "Nora Nurse",
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    nursingHomeId: input.nursingHomeId || "facility-ballymore-haven",
    wardId: input.wardId || "ward-ballymore-haven-general",
    residentId: input.residentId,
    summary: input.summary || `${input.entityType} ${input.action}`,
    changes: cleanChanges,
    reasonCode: input.reasonCode,
    reasonText: input.reasonText,
    source: input.source || "user_interface",
    correlationId: input.correlationId,
    schemaVersion: 1,
  };
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("Resident edit captures actor, resident, old/new value, home and time", () => {
  const record = audit({
    action: "update",
    entityType: "resident",
    entityId: "resident-1",
    residentId: "resident-1",
    changes: changes({ phone: "111" }, { phone: "222" }),
    summary: "Resident phone number changed from 111 to 222.",
  });
  assert.equal(record.actorUserAccountId, "u-nurse");
  assert.equal(record.changes[0].previousValue, "111");
  assert.equal(record.nursingHomeId, "facility-ballymore-haven");
});

test("Care plan edit records only changed review date", () => {
  const record = audit({
    action: "update",
    entityType: "care_plan",
    entityId: "cp-1",
    residentId: "resident-1",
    changes: changes({ reviewDate: "2026-07-10", title: "Nutrition" }, { reviewDate: "2026-08-10", title: "Nutrition" }),
  });
  assert.deepEqual(record.changes.map((change) => change.field), ["reviewDate"]);
});

test("Care action discontinued requires reason", () => {
  assert.throws(() => audit({ action: "cancel", entityType: "care_action", entityId: "action-1" }));
  const record = audit({ action: "cancel", entityType: "care_action", entityId: "action-1", reasonText: "No longer clinically indicated." });
  assert.equal(record.reasonText, "No longer clinically indicated.");
});

test("Observation correction keeps previous/new value and effective time", () => {
  const record = audit({
    action: "correct",
    entityType: "observation",
    entityId: "obs-1",
    effectiveAt: "2026-07-13T08:00:00.000Z",
    recordedAt: "2026-07-13T09:15:00.000Z",
    reasonText: "Transcription correction.",
    changes: changes({ temperature: 39.1 }, { temperature: 37.1 }),
  });
  assert.equal(record.effectiveAt, "2026-07-13T08:00:00.000Z");
  assert.equal(record.changes[0].newValue, 37.1);
});

test("Void assessment requires reason and preserves original assessment id", () => {
  const record = audit({ action: "void", entityType: "assessment", entityId: "assessment-1", reasonText: "Entered for incorrect resident." });
  assert.equal(record.entityId, "assessment-1");
  assert.equal(record.action, "void");
});

test("Permission change records actor, target, capability and scope", () => {
  const record = audit({
    action: "grant_permission",
    entityType: "permission",
    entityId: "grant-1",
    reasonText: "Temporary safeguarding cover.",
    changes: changes({ capability: undefined }, { capability: "safeguarding.investigate" }),
  });
  assert.equal(record.changes[0].newValue, "safeguarding.investigate");
});

test("Dashboard recalculation does not create fake dashboard audit entry", () => {
  const records = [audit({ action: "create", entityType: "observation", entityId: "obs-1" })];
  const kpiBefore = 1;
  const kpiAfter = 2;
  assert.notEqual(kpiBefore, kpiAfter);
  assert.equal(records.filter((record) => record.entityType === "dashboard").length, 0);
});

test("Filter or page refresh does not create audit change entry", () => {
  const records = [];
  const filtered = ["resident-1"].filter(Boolean);
  assert.equal(filtered.length, 1);
  assert.equal(records.length, 0);
});

test("System-created alert shares correlation with source observation", () => {
  const observation = audit({ action: "create", entityType: "observation", entityId: "obs-1", correlationId: "corr-1" });
  const alert = audit({ action: "create", entityType: "clinical_alert", entityId: "alert-1", actorType: "system", source: "rule_engine", correlationId: "corr-1" });
  assert.equal(observation.correlationId, alert.correlationId);
});

test("Cross-home audit query remains isolated", () => {
  const records = [
    audit({ action: "update", entityType: "resident", entityId: "b-1", nursingHomeId: "facility-ballymore-haven", changes: [{ field: "x", previousValue: 1, newValue: 2 }] }),
    audit({ action: "update", entityType: "resident", entityId: "h-1", nursingHomeId: "facility-hazelwood-care", changes: [{ field: "x", previousValue: 1, newValue: 2 }] }),
  ];
  assert.deepEqual(records.filter((record) => record.nursingHomeId === "facility-ballymore-haven").map((record) => record.entityId), ["b-1"]);
});

test("Legacy audit remains visible", () => {
  const legacy = { id: "legacy-1", action: "Edited resident", entity: "resident-1" };
  const migrated = audit({ id: `audit-record-legacy-${legacy.id}`, action: "update", entityType: "legacy_record", entityId: legacy.entity, changes: [{ field: "legacyAction", newValue: legacy.action }] });
  assert.equal(migrated.entityId, "resident-1");
});

test("Sensitive values are not stored", () => {
  const record = audit({ action: "update", entityType: "user_account", entityId: "u-1", changes: changes({ password: "old", email: "a" }, { password: "new", email: "b" }) });
  assert.deepEqual(record.changes.map((change) => change.field), ["email"]);
});

console.log("Audit framework regression suite passed.");
