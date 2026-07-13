import type { DomainEvent } from "@/domain/events/eventTypes";
import type { RuleDataRequirement, RuleEngineState, RuleSourceRecord } from "./ruleTypes";

type RecordLike = Record<string, unknown>;

const asRecords = (value: unknown): RecordLike[] => (Array.isArray(value) ? (value as RecordLike[]) : []);
const payloadOf = (event: DomainEvent<string, unknown>): RecordLike =>
  event.payload && typeof event.payload === "object" ? (event.payload as RecordLike) : {};
const residentIdFor = (event: DomainEvent<string, unknown>) => String(event.subject?.residentId || payloadOf(event).residentId || "");
const nursingHomeIdFor = (event: DomainEvent<string, unknown>) => String(event.scope.nursingHomeId);
const eventTimeFor = (event: DomainEvent<string, unknown>) => Date.parse(String(payloadOf(event).observedAt || event.occurredAt));

const daysToMs = (days: number) => days * 24 * 60 * 60 * 1000;

function reference(key: string, provider: RuleSourceRecord["provider"], recordType: string, record: RecordLike, event: DomainEvent<string, unknown>): RuleSourceRecord {
  return {
    key,
    provider,
    recordType,
    recordId: String(record.id || record.assessmentId || record.weightRecordId || record.observationId || record.occurrenceId || event.eventId),
    nursingHomeId: String(record.facilityId || record.nursingHomeId || event.scope.nursingHomeId),
    residentId: record.residentId ? String(record.residentId) : residentIdFor(event) || undefined,
    observedAt: typeof record.date === "string" ? record.date : typeof record.observedAt === "string" ? record.observedAt : undefined,
    effectiveAt: typeof record.createdAt === "string" ? record.createdAt : typeof record.completedAt === "string" ? record.completedAt : undefined,
    record,
  };
}

const missing = (requirement: RuleDataRequirement, event: DomainEvent<string, unknown>, reason: string): RuleSourceRecord => ({
  key: requirement.key,
  provider: requirement.provider,
  recordType: "missing",
  recordId: `${event.eventId}:${requirement.key}:missing`,
  nursingHomeId: event.scope.nursingHomeId,
  residentId: residentIdFor(event) || undefined,
  missing: true,
  missingReason: reason,
  record: {},
});

export function getResidentRuleData(requirement: RuleDataRequirement, event: DomainEvent<string, unknown>, state: RuleEngineState) {
  const residentId = residentIdFor(event);
  const homeId = nursingHomeIdFor(event);
  const resident = asRecords(state.residents).find((item) => item.id === residentId && (!item.facilityId || item.facilityId === homeId));
  return resident ? [reference(requirement.key, "resident", "Resident", resident, event)] : [missing(requirement, event, "Resident was not available in the same nursing-home scope.")];
}

export function getWeightRuleData(requirement: RuleDataRequirement, event: DomainEvent<string, unknown>, state: RuleEngineState) {
  const residentId = residentIdFor(event);
  const homeId = nursingHomeIdFor(event);
  const windowMs = requirement.timeWindow?.unit === "days" ? daysToMs(requirement.timeWindow.amount) : Number.POSITIVE_INFINITY;
  const eventAt = eventTimeFor(event);
  const currentPayload = payloadOf(event);
  const currentWeight = currentPayload.weightValue || currentPayload.weightKg
    ? {
        id: currentPayload.weightRecordId || currentPayload.observationId || event.eventId,
        residentId,
        facilityId: homeId,
        date: String(currentPayload.observedAt || event.occurredAt).slice(0, 10),
        observedAt: currentPayload.observedAt || event.occurredAt,
        weightKg: Number(currentPayload.weightValue || currentPayload.weightKg),
      }
    : undefined;
  const history = asRecords(state.weights)
    .filter((item) => item.residentId === residentId && (!item.facilityId || item.facilityId === homeId))
    .filter((item) => {
      const observedAt = Date.parse(String(item.observedAt || item.date || ""));
      return Number.isFinite(observedAt) && observedAt <= eventAt && eventAt - observedAt <= windowMs;
    });
  const records = [...(currentWeight ? [currentWeight] : []), ...history].filter(
    (item, index, arr) => arr.findIndex((candidate) => String(candidate.id) === String(item.id)) === index,
  );
  return records.length ? records.map((item) => reference(requirement.key, "weights", "WeightRecord", item, event)) : [missing(requirement, event, "No weight records were available in the declared time window.")];
}

export function getAssessmentRuleData(requirement: RuleDataRequirement, event: DomainEvent<string, unknown>, state: RuleEngineState) {
  const payload = payloadOf(event);
  const residentId = residentIdFor(event);
  const homeId = nursingHomeIdFor(event);
  const assessmentId = String(payload.assessmentId || "");
  const records = asRecords(state.assessments).filter((item) => {
    if (assessmentId && item.id === assessmentId) return !item.facilityId || item.facilityId === homeId;
    return item.residentId === residentId && (!item.facilityId || item.facilityId === homeId);
  });
  const fallback = assessmentId
    ? [{
        id: assessmentId,
        residentId,
        facilityId: homeId,
        type: payload.assessmentType,
        date: payload.completedAt || event.occurredAt,
        totalScore: payload.score,
        riskLevel: payload.riskLevel || payload.currentRiskLevel,
      }]
    : [];
  const merged = records.length ? records : fallback;
  return merged.length ? merged.map((item) => reference(requirement.key, "assessments", "Assessment", item, event)) : [missing(requirement, event, "Assessment source record was not available.")];
}

export function getCarePlanCoverageData(requirement: RuleDataRequirement, event: DomainEvent<string, unknown>, state: RuleEngineState) {
  const residentId = residentIdFor(event);
  const homeId = nursingHomeIdFor(event);
  const records = asRecords(state.carePlanProblems).filter(
    (item) => item.residentId === residentId && item.status === "active" && (!item.facilityId || item.facilityId === homeId),
  );
  return records.map((item) => reference(requirement.key, "care_plans", "CarePlanProblem", item, event));
}

export function getCareActionRuleData(requirement: RuleDataRequirement, event: DomainEvent<string, unknown>, state: RuleEngineState) {
  const residentId = residentIdFor(event);
  const homeId = nursingHomeIdFor(event);
  const windowMs = requirement.timeWindow?.unit === "days" ? daysToMs(requirement.timeWindow.amount) : Number.POSITIVE_INFINITY;
  const eventAt = eventTimeFor(event);
  const records = asRecords(state.problemInterventionLogs)
    .filter((item) => item.residentId === residentId && (!item.facilityId || item.facilityId === homeId))
    .filter((item) => item.outcome === "missed")
    .filter((item) => {
      const observedAt = Date.parse(`${String(item.date)}T${String(item.time || "00:00")}:00`);
      return Number.isFinite(observedAt) && observedAt <= eventAt && eventAt - observedAt <= windowMs;
    });
  return records.length ? records.map((item) => reference(requirement.key, "care_actions", "ProblemInterventionLog", item, event)) : [missing(requirement, event, "No matching missed care-action records were available.")];
}

export function getRuleSourceRecords(requirements: RuleDataRequirement[], event: DomainEvent<string, unknown>, state: RuleEngineState) {
  return requirements.flatMap((requirement) => {
    switch (requirement.provider) {
      case "resident":
        return getResidentRuleData(requirement, event, state);
      case "weights":
        return getWeightRuleData(requirement, event, state);
      case "assessments":
        return getAssessmentRuleData(requirement, event, state);
      case "care_plans":
        return getCarePlanCoverageData(requirement, event, state);
      case "care_actions":
        return getCareActionRuleData(requirement, event, state);
      default:
        return requirement.required ? [missing(requirement, event, `${requirement.provider} provider is declared but not implemented in this phase.`)] : [];
    }
  });
}
