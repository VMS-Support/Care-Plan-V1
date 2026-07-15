import { createOrUpdateDeteriorationIssue } from "@/domain/deterioration/deteriorationIssueService";
import type { DeteriorationIssueRepository } from "@/domain/deterioration/deteriorationIssueTypes";
import type { WorkItem, WorkProjectionState } from "@/domain/work";
import type { DailyCareRecord } from "../dailyCareTypes";
import {
  evaluateAlteredSleep,
  evaluateBehaviouralChange,
  evaluateIncreasedAssistance,
  evaluateNoBowelMovement,
  evaluateReducedFluidIntake,
  evaluateReducedFoodIntake,
  evaluateRepeatedRefusal,
} from "./dailyCareTrendEvaluators";
import { DAILY_CARE_TREND_TITLES, type DailyCareTrendEvaluationResult, type DailyCareTrendPolicy, type DailyCareTrendRepository, type DailyCareTrendType, validTrendRecords } from "./dailyCareTrendTypes";

export interface DailyCareTrendOperationalContext {
  nursingHomeId: string;
  wardId?: string;
  timezone: string;
  occurredAt: string;
  correlationId: string;
}

export interface DailyCareTrendAuthorizationContext {
  userAccountId: string;
  staffMemberId?: string;
  capabilities: string[];
}

export interface DailyCareTrendOrchestratorRepository extends DailyCareTrendRepository, DeteriorationIssueRepository, WorkProjectionState {
  dailyCareRecords: DailyCareRecord[];
}

export function handleDailyCareRecordedForTrends(record: DailyCareRecord, repository: DailyCareTrendOrchestratorRepository, context: DailyCareTrendOperationalContext, authorization: DailyCareTrendAuthorizationContext, createId: () => string) {
  if (!authorization.capabilities.includes("daily_care_trends.evaluate")) return { evaluations: [] as DailyCareTrendEvaluationResult[] };
  const routedTypes = trendTypesForRecord(record);
  const policies = repository.dailyCareTrendPolicies.filter((policy) => routedTypes.includes(policy.trendType) && policy.status === "approved" && policy.effectiveFrom <= record.occurredAt && (!policy.effectiveTo || policy.effectiveTo >= record.occurredAt) && (!policy.nursingHomeId || String(policy.nursingHomeId) === String(record.nursingHomeId)));
  if (!policies.length) return { evaluations: routedTypes.map((trendType) => policyUnavailable(record, trendType, context.occurredAt)) };

  const source = validTrendRecords(repository.dailyCareRecords, String(record.residentId), String(record.nursingHomeId));
  const evaluations = policies.map((policy) => evaluate(policy, source, record.occurredAt));
  repository.dailyCareTrendEvaluations = [...evaluations, ...repository.dailyCareTrendEvaluations];

  const matched = evaluations.filter((evaluation) => evaluation.status === "matched");
  const workItems = matched.flatMap((evaluation) => {
    const issue = evaluation.createDeteriorationIssue ? createOrUpdateDeteriorationIssue({
      residentId: String(record.residentId),
      nursingHomeId: String(record.nursingHomeId),
      wardId: record.wardId ? String(record.wardId) : context.wardId,
      roomId: record.roomId ? String(record.roomId) : undefined,
      issueType: "observation_deterioration",
      severity: evaluation.severity,
      title: DAILY_CARE_TREND_TITLES[evaluation.trendType],
      conciseSummary: evaluation.currentPatternSummary || evaluation.explanation.summary,
      sourceReferences: evaluation.evidenceRecordIds.map((id) => ({
        sourceType: "other" as const,
        sourceEntityId: id,
        occurredAt: source.find((item) => item.id === id)?.occurredAt || record.occurredAt,
        route: `/residents/${record.residentId}`,
        safeDisplayLabel: "Daily Care",
      })),
      deduplicationKey: trendDeduplicationKey(evaluation),
      clinicalEventAt: record.occurredAt,
      ruleIssueId: trendDeduplicationKey(evaluation),
      rltDomainIds: evaluation.rltDomainIds,
    }, repository, createId, context.correlationId) : undefined;
    if (!issue || !evaluation.createNurseReviewWorkItem) return [];
    const work = createOrUpdateTrendWorkItem(evaluation, issue.id, record, repository, context, createId);
    issue.activeWorkItemIds = [...new Set([...issue.activeWorkItemIds, String(work.id)])];
    repository.issues = repository.issues.map((item) => item.id === issue.id ? issue : item);
    return [work];
  });
  return { evaluations, workItems };
}

export function trendTypesForRecord(record: DailyCareRecord): DailyCareTrendType[] {
  const trends: DailyCareTrendType[] = [];
  if (record.careType === "food") trends.push("reduced_food_intake");
  if (record.careType === "fluids") trends.push("reduced_fluid_intake");
  if (record.careType === "toileting" || record.careType === "continence") trends.push("no_bowel_movement");
  if (record.careType === "refusal" || record.outcome === "refused") trends.push("repeated_refusal");
  if (["personal_care", "dressing", "oral_care", "toileting", "continence", "repositioning", "food", "fluids", "mobility"].includes(record.careType)) trends.push("increased_assistance");
  if (record.careType === "sleep") trends.push("altered_sleep");
  if (record.careType === "behaviour" || record.careType === "mood") trends.push("behavioural_change");
  return [...new Set(trends)];
}

function evaluate(policy: DailyCareTrendPolicy, records: DailyCareRecord[], dateTo: string) {
  if (policy.trendType === "reduced_food_intake") return evaluateReducedFoodIntake(records, policy, dateTo);
  if (policy.trendType === "reduced_fluid_intake") return evaluateReducedFluidIntake(records, policy, dateTo);
  if (policy.trendType === "no_bowel_movement") return evaluateNoBowelMovement(records, policy, dateTo);
  if (policy.trendType === "repeated_refusal") return evaluateRepeatedRefusal(records, policy, dateTo);
  if (policy.trendType === "increased_assistance") return evaluateIncreasedAssistance(records, policy, dateTo);
  if (policy.trendType === "altered_sleep") return evaluateAlteredSleep(records, policy, dateTo);
  return evaluateBehaviouralChange(records, policy, dateTo);
}

function createOrUpdateTrendWorkItem(evaluation: DailyCareTrendEvaluationResult, issueId: string, record: DailyCareRecord, repository: WorkProjectionState, context: DailyCareTrendOperationalContext, createId: () => string): WorkItem {
  const key = `${trendDeduplicationKey(evaluation)}:nurse-review`;
  const existing = repository.workItems.find((item) => item.source.sourceOccurrenceId === key && !["completed", "cancelled", "not_applicable"].includes(item.persistedStatus));
  if (existing) return existing;
  const work: WorkItem = {
    id: createId(),
    workType: "care_action",
    title: `Review ${DAILY_CARE_TREND_TITLES[evaluation.trendType]}`,
    summary: evaluation.currentPatternSummary,
    source: {
      sourceType: "clinical_rule",
      sourceModule: "rules",
      sourceEntityType: "deterioration_issue",
      sourceEntityId: issueId,
      sourceOccurrenceId: key,
      parentEntityType: "daily_care_trend",
      parentEntityId: evaluation.policyId,
      correlationId: context.correlationId,
      route: `/residents/${record.residentId}?careSection=deterioration&issue=${issueId}`,
      completionOwner: "daily_care_trends",
      recreationPolicy: "deterministic",
      createdAt: context.occurredAt,
    },
    nursingHomeId: record.nursingHomeId,
    wardId: record.wardId,
    roomId: record.roomId,
    residentId: record.residentId,
    schedule: { scheduleType: "triggered", dueAt: evaluation.dueAt || context.occurredAt, effectiveDueAt: evaluation.dueAt || context.occurredAt, timeZone: context.timezone },
    persistedStatus: "scheduled",
    assignment: { assignmentType: "ward", assignedWardId: record.wardId, assignedAt: context.occurredAt, assignmentStatus: "active", assignmentReasonCode: "daily_care_trend" },
    priority: evaluation.severity === "critical" ? "critical" : evaluation.severity === "high" ? "urgent" : evaluation.severity === "medium" ? "important" : "routine",
    clinicalUrgency: evaluation.severity === "critical" ? "immediate" : evaluation.severity === "high" ? "urgent_review" : "time_sensitive",
    recommendedActions: [{ code: "review_daily_care_trend", label: `Review ${DAILY_CARE_TREND_TITLES[evaluation.trendType]}`, route: `/residents/${record.residentId}` }],
    ruleContext: { ruleIssueId: trendDeduplicationKey(evaluation), ruleId: evaluation.trendType, ruleVersion: evaluation.policyVersion },
    correlationId: context.correlationId,
    createdAt: context.occurredAt,
    updatedAt: context.occurredAt,
    schemaVersion: 1,
  };
  repository.workItems = [work, ...repository.workItems];
  return work;
}

function trendDeduplicationKey(evaluation: DailyCareTrendEvaluationResult) {
  return `daily_care_trend:${evaluation.nursingHomeId}:${evaluation.residentId}:${evaluation.trendType}:${evaluation.policyId}:v${evaluation.policyVersion}`;
}

function policyUnavailable(record: DailyCareRecord, trendType: DailyCareTrendType, at: string): DailyCareTrendEvaluationResult {
  return {
    status: "policy_unavailable",
    trendType,
    residentId: record.residentId,
    nursingHomeId: record.nursingHomeId,
    wardId: record.wardId,
    dateFrom: at,
    dateTo: at,
    evidenceRecordIds: [],
    evidenceCount: 0,
    severity: "information",
    createDeteriorationIssue: false,
    createNurseReviewWorkItem: false,
    rltDomainIds: [],
    policyId: "none",
    policyVersion: 0,
    explanation: { summary: "No approved Daily Care trend policy is active.", reasons: ["Policy unavailable."], evidence: [] },
  };
}
