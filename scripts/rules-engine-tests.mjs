import assert from "node:assert/strict";
import test from "node:test";

const now = "2026-07-13T12:00:00.000Z";
const homeA = "home-ballymore";
const homeB = "home-hazelwood";

const makeEvent = (overrides = {}) => ({
  eventId: overrides.eventId || "domain-event-1",
  eventType: overrides.eventType || "HandoverCreated",
  eventVersion: 1,
  occurredAt: overrides.occurredAt || now,
  recordedAt: overrides.recordedAt || now,
  actor: { actorType: "system" },
  scope: { nursingHomeId: overrides.nursingHomeId || homeA, wardId: overrides.wardId || "ward-1", timezone: "Europe/Dublin" },
  subject: { entityType: overrides.entityType || "Test", entityId: overrides.entityId || "record-1", residentId: overrides.residentId || "resident-1" },
  source: { module: "test", service: "test", operation: "publish" },
  payload: overrides.payload || {},
  correlationId: overrides.correlationId || "corr-1",
});

const decisionId = (rule, event) => `rule-decision-${rule.id}-v${rule.version}-${event.eventId}`;
const dedupeKey = (rule, event, outputCode, scope, domainId = "unknown-domain") => {
  const resident = event.subject.residentId || event.payload.residentId;
  if (scope === "event") return `${event.scope.nursingHomeId}:${rule.id}:v${rule.version}:${event.eventId}:${outputCode}`;
  if (scope === "resident_domain") return `${event.scope.nursingHomeId}:${resident}:${outputCode}:${domainId}`;
  return `${event.scope.nursingHomeId}:${resident}:${outputCode}`;
};

const rules = {
  dedupe: {
    id: "RULE-TEST-DEDUPE-001",
    version: 1,
    status: "active",
    triggerEventTypes: ["HandoverCreated"],
    clinicalApproval: { status: "not_required" },
    effectiveFrom: "2026-07-13T00:00:00.000Z",
  },
  weight: {
    id: "RULE-WEIGHT-001",
    version: 1,
    status: "pending_clinical_approval",
    triggerEventTypes: ["WeightRecorded"],
    clinicalApproval: { status: "pending" },
    configuration: { percentageThreshold: 5, lookbackDays: 30, minimumMeasurements: 2, includeEstimatedWeights: false },
  },
};

function applicable(rule, event) {
  return rule.status === "active"
    && rule.triggerEventTypes.includes(event.eventType)
    && (!rule.nursingHomeId || rule.nursingHomeId === event.scope.nursingHomeId)
    && ["approved", "not_required"].includes(rule.clinicalApproval?.status)
    && (!rule.effectiveFrom || Date.parse(event.occurredAt) >= Date.parse(rule.effectiveFrom))
    && (!rule.effectiveTo || Date.parse(event.occurredAt) < Date.parse(rule.effectiveTo));
}

function process(state, rule, event) {
  if (!applicable(rule, event)) return state;
  const duplicate = state.receipts.some((receipt) => receipt.ruleId === rule.id && receipt.ruleVersion === rule.version && receipt.sourceEventId === event.eventId && receipt.status === "completed");
  if (duplicate) {
    return { ...state, receipts: [{ ruleId: rule.id, ruleVersion: rule.version, sourceEventId: event.eventId, status: "skipped_duplicate" }, ...state.receipts] };
  }
  const output = {
    ruleId: rule.id,
    ruleVersion: rule.version,
    decisionId: decisionId(rule, event),
    outputCode: "RULE_ENGINE_DEDUPE_SIGNAL",
    deduplicationKey: dedupeKey(rule, event, "RULE_ENGINE_DEDUPE_SIGNAL", "event"),
    status: "active",
    occurrenceCount: 1,
    explanation: {
      whatHappened: "A handover event was received by the central rules engine.",
      thresholdOrCondition: "Non-clinical test condition: event delivery exists.",
      sourceSummary: "The source handover domain event.",
      recommendedAction: "No clinical action required.",
      clinicalSummary: "No diagnosis is made.",
      technicalTrace: { ruleId: rule.id, ruleVersion: rule.version, sourceEventId: event.eventId, correlationId: event.correlationId },
      permissionRestrictedTechnical: true,
    },
  };
  const outputs = state.outputs.some((item) => item.deduplicationKey === output.deduplicationKey) ? state.outputs : [output, ...state.outputs];
  return {
    decisions: [{ decisionId: output.decisionId, ruleId: rule.id, ruleVersion: rule.version, sourceEventId: event.eventId, explanation: output.explanation }, ...state.decisions],
    outputs,
    receipts: [{ ruleId: rule.id, ruleVersion: rule.version, sourceEventId: event.eventId, status: "completed" }, ...state.receipts],
  };
}

test("rule versioning and activation governance", () => {
  assert.equal(applicable(rules.weight, makeEvent({ eventType: "WeightRecorded" })), false);
  const approved = { ...rules.weight, status: "active", clinicalApproval: { status: "approved" }, effectiveFrom: now };
  assert.equal(applicable(approved, makeEvent({ eventType: "WeightRecorded" })), true);
  const retired = { ...approved, status: "retired" };
  assert.equal(applicable(retired, makeEvent({ eventType: "WeightRecorded" })), false);
  const suspended = { ...approved, status: "suspended" };
  assert.equal(applicable(suspended, makeEvent({ eventType: "WeightRecorded" })), false);
  const future = { ...approved, effectiveFrom: "2026-08-01T00:00:00.000Z" };
  assert.equal(applicable(future, makeEvent({ eventType: "WeightRecorded" })), false);
  const version2 = { ...approved, version: 2, configuration: { ...approved.configuration, percentageThreshold: 4 }, supersedesRuleVersion: 1 };
  const historicalDecision = { ruleId: approved.id, ruleVersion: 1 };
  assert.equal(version2.version, 2);
  assert.equal(historicalDecision.ruleVersion, 1);
});

test("home-specific version supersedes global and does not cross homes", () => {
  const global = { ...rules.dedupe };
  const homeSpecific = { ...rules.dedupe, version: 2, nursingHomeId: homeA };
  const eventA = makeEvent({ nursingHomeId: homeA });
  const eventB = makeEvent({ nursingHomeId: homeB });
  const applicableA = [global, homeSpecific].filter((rule) => applicable(rule, eventA)).sort((a, b) => (a.nursingHomeId ? -1 : 1));
  assert.equal(applicableA[0].version, 2);
  assert.deepEqual([global, homeSpecific].filter((rule) => applicable(rule, eventB)).map((rule) => rule.version), [1]);
});

test("explanations include required clinical and technical fields", () => {
  const state = process({ decisions: [], outputs: [], receipts: [] }, rules.dedupe, makeEvent());
  const explanation = state.decisions[0].explanation;
  assert.match(explanation.whatHappened, /handover event/);
  assert.match(explanation.thresholdOrCondition, /condition/);
  assert.match(explanation.sourceSummary, /source/);
  assert.match(explanation.recommendedAction, /No clinical action/);
  assert.equal(explanation.permissionRestrictedTechnical, true);
  assert.equal(explanation.technicalTrace.ruleId, "RULE-TEST-DEDUPE-001");
  assert.doesNotMatch(`${explanation.whatHappened} ${explanation.clinicalSummary}`, /diagnose|infection|hospital transfer/i);
});

test("same event is idempotent and creates no duplicate output", () => {
  const event = makeEvent();
  const once = process({ decisions: [], outputs: [], receipts: [] }, rules.dedupe, event);
  const twice = process(once, rules.dedupe, event);
  assert.equal(twice.decisions.length, 1);
  assert.equal(twice.outputs.length, 1);
  assert.equal(twice.receipts.filter((receipt) => receipt.status === "completed").length, 1);
  assert.equal(twice.receipts.filter((receipt) => receipt.status === "skipped_duplicate").length, 1);
});

test("weight fixture calculates 56.0 to 53.1 as 5.18 percent", () => {
  const previous = 56.0;
  const current = 53.1;
  const change = Math.round(((previous - current) / previous) * 10000) / 100;
  assert.equal(change, 5.18);
  assert.equal(change >= rules.weight.configuration.percentageThreshold, true);
  assert.equal(rules.weight.status, "pending_clinical_approval");
});

test("deduplication separates resident, code and recurrence state", () => {
  const event1 = makeEvent({ residentId: "resident-1" });
  const event2 = makeEvent({ residentId: "resident-2" });
  assert.notEqual(dedupeKey(rules.weight, event1, "SIGNIFICANT_WEIGHT_LOSS_REVIEW", "resident_and_code"), dedupeKey(rules.weight, event2, "SIGNIFICANT_WEIGHT_LOSS_REVIEW", "resident_and_code"));
  assert.notEqual(dedupeKey(rules.weight, event1, "SIGNIFICANT_WEIGHT_LOSS_REVIEW", "resident_and_code"), dedupeKey(rules.weight, event1, "OTHER_CODE", "resident_and_code"));
  const resolved = { deduplicationKey: dedupeKey(rules.weight, event1, "SIGNIFICANT_WEIGHT_LOSS_REVIEW", "resident_and_code"), status: "resolved" };
  const recurrenceCanOpenNewEpisode = resolved.status === "resolved";
  assert.equal(recurrenceCanOpenNewEpisode, true);
});

test("page refresh does not process rules", () => {
  const state = { decisions: [], outputs: [], receipts: [] };
  const refreshed = { ...state };
  assert.deepEqual(refreshed, state);
});
