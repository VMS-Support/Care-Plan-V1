import type { DomainEvent } from "@/domain/events/eventTypes";
import type { RuleExplanation } from "@/domain/rules/ruleTypes";
import type { WorkItem } from "@/domain/work/workTypes";
import {
  getApprovedRltMappingsForAssessment,
  type AssessmentMappingEvaluationInput,
  type AssessmentRltMapping,
} from "./assessmentRltMappings";
import {
  getActiveCarePlanCoverageForDomain,
  type CarePlanDomainCoverage,
  type CarePlanDomainCoverageAssessment,
  type CarePlanSelectorData,
} from "./rltSelectors";
import { RLT_DOMAIN_BY_ID, type RltDomainId, type RltDomainKey } from "./rlt";
import type { Assessment, ProblemReview } from "./types";

export type CarePlanningGuidanceStatus =
  | "open"
  | "acknowledged"
  | "actioned"
  | "resolved"
  | "dismissed";
export type CarePlanningGuidanceAction =
  | "consider_new_plan"
  | "review_existing_plan"
  | "prioritise_overdue_review"
  | "clinical_review_required";
export type GuidanceDecisionStatus =
  | "matched"
  | "not_matched"
  | "insufficient_data"
  | "suppressed"
  | "error"
  | "clinical_mapping_review_required";
export type GuidanceDismissalReason =
  | "existing_plan_already_addresses_need"
  | "assessment_not_clinically_relevant_to_plan"
  | "resident_choice"
  | "duplicate_guidance"
  | "source_assessment_entered_in_error"
  | "resident_specific_exception"
  | "end_of_life_context"
  | "clinical_review_completed_no_change_required"
  | "other";

export interface AssessmentCarePlanningGuidance {
  id: string;
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  assessmentId: string;
  assessmentTypeId: string;
  sourceAssessmentIds: string[];
  sourceEventIds: string[];
  assessmentRiskLevel?: string;
  assessmentScore?: number;
  assessmentCompletedAt: string;
  assessmentRltMappingId: string;
  assessmentRltMappingVersion: number;
  rltDomainId: RltDomainId;
  rltDomainKey: RltDomainKey;
  currentDependencyLevel?: string | null;
  action: CarePlanningGuidanceAction;
  coverageState: CarePlanDomainCoverageAssessment;
  relatedCarePlanItemIds: string[];
  title: string;
  summary: string;
  explanation: RuleExplanation;
  recommendedActionCodes: string[];
  status: CarePlanningGuidanceStatus;
  ruleIssueId?: string;
  ruleDecisionId: string;
  deduplicationKey: string;
  occurrenceCount: number;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  actionedAt?: string;
  actionEvidenceEntityType?: string;
  actionEvidenceEntityId?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionReason?: string;
  dismissedAt?: string;
  dismissedBy?: string;
  dismissalReason?: GuidanceDismissalReason;
  dismissalReasonText?: string;
}

export interface GuidanceHistoryEntry {
  id: string;
  guidanceId: string;
  action: "created" | "updated" | "acknowledged" | "actioned" | "resolved" | "dismissed";
  occurredAt: string;
  actorId?: string;
  sourceEventId?: string;
  reason?: string;
}

export interface AssessmentCareGuidanceState {
  guidance: AssessmentCarePlanningGuidance[];
  history: GuidanceHistoryEntry[];
}

export interface GuidanceResidentContext {
  id: string;
  nursingHomeId: string;
  wardId?: string;
  lifecycleStatus: string;
  presenceStatus?: string;
}

export interface GuidanceEvaluationContext {
  event: DomainEvent<string, Record<string, unknown>>;
  assessment?: Assessment;
  resident?: GuidanceResidentContext;
  carePlans: CarePlanSelectorData;
  mappings?: AssessmentRltMapping[];
  currentDependencyByDomain?: Partial<Record<RltDomainId, string | null>>;
  existingState?: AssessmentCareGuidanceState;
  evaluatedAt: string;
  absentPolicy?: "suppress" | "guidance_only";
}

export interface GuidanceEvaluationResult {
  status: GuidanceDecisionStatus;
  reason: string;
  state: AssessmentCareGuidanceState;
  createdOrUpdated: AssessmentCarePlanningGuidance[];
  coverage: CarePlanDomainCoverage[];
  governanceReviewRequired: boolean;
  carePlansCreated: 0;
}

const allowedTriggers = new Set([
  "AssessmentCompleted",
  "AssessmentRiskChanged",
  "AssessmentCorrected",
  "AssessmentVoided",
  "AssessmentGuidanceRecalculationRequested",
]);
const inactiveResidentStates = new Set(["discharged", "deceased", "inactive", "cancelled"]);
const activeGuidanceStates = new Set<CarePlanningGuidanceStatus>(["open", "acknowledged", "actioned"]);
const idPart = (value: string) => value.replace(/[^a-zA-Z0-9_-]+/g, "-").toLowerCase();
const decisionId = (eventId: string, mappingId: string) => `guidance-decision:${eventId}:${mappingId}`;

function guidanceAction(coverage: CarePlanDomainCoverage, requested: string): CarePlanningGuidanceAction | undefined {
  if (requested === "no_automatic_action") return undefined;
  if (requested === "clinical_review_required") return "clinical_review_required";
  if (coverage.coverageAssessment === "no_active_plan") return "consider_new_plan";
  if (coverage.coverageAssessment === "active_plan_overdue") return "prioritise_overdue_review";
  return "review_existing_plan";
}

function actionCodes(action: CarePlanningGuidanceAction, coverage: CarePlanDomainCoverage) {
  const common = ["OPEN_RLT_DOMAIN", "OPEN_SOURCE_ASSESSMENT", "ACKNOWLEDGE_GUIDANCE", "DISMISS_GUIDANCE_WITH_REASON"];
  if (action === "consider_new_plan") return ["CONSIDER_NEW_CARE_PLAN", ...common];
  if (action === "prioritise_overdue_review") return ["PRIORITISE_CARE_PLAN_REVIEW", "OPEN_EXISTING_CARE_PLAN", ...common];
  if (action === "review_existing_plan") return ["REVIEW_EXISTING_CARE_PLAN", "OPEN_EXISTING_CARE_PLAN", ...common];
  return coverage.hasActivePlan ? ["OPEN_EXISTING_CARE_PLAN", ...common] : common;
}

function guidanceText(action: CarePlanningGuidanceAction, coverage: CarePlanDomainCoverage, domainTitle: string) {
  if (action === "consider_new_plan") return `Consider creating a Nursing Care Plan for ${domainTitle}.`;
  if (action === "prioritise_overdue_review") return `Prioritise review of the existing ${domainTitle} Nursing Care Plan. Its review is overdue.`;
  if (action === "clinical_review_required") return `Clinical review is required to determine whether the assessment affects care planning under ${domainTitle}.`;
  if (coverage.coverageAssessment === "multiple_active_plans") return `Review active Nursing Care Plans under ${domainTitle} and confirm the latest assessment is addressed.`;
  if (coverage.coverageAssessment === "active_plan_review_due") return `Review the existing ${domainTitle} Nursing Care Plan. Its review is due.`;
  return `Review the existing ${domainTitle} Nursing Care Plan to confirm it reflects the latest assessment.`;
}

function explanation(input: {
  event: DomainEvent<string, Record<string, unknown>>;
  assessment: Assessment;
  mappingId: string;
  mappingVersion: number;
  rationale: string;
  domainTitle: string;
  coverage: CarePlanDomainCoverage;
  summary: string;
  deduplicationKey: string;
}): RuleExplanation {
  const score = input.assessment.totalScore === undefined ? "" : ` with a score of ${input.assessment.totalScore}`;
  const risk = input.assessment.riskLevel ? ` and a ${input.assessment.riskLevel} risk level` : "";
  const plan = input.coverage.hasActivePlan
    ? `${input.coverage.activeCount} active Nursing Care Plan item(s) exist${input.coverage.nearestReviewDate ? `; the nearest review date is ${input.coverage.nearestReviewDate}` : ""}.`
    : "No active Nursing Care Plan exists in this domain.";
  return {
    whatHappened: `Assessment ${input.assessment.type} was completed on ${input.assessment.date.slice(0, 10)}${score}${risk}.`,
    thresholdOrCondition: `Approved mapping ${input.mappingId} v${input.mappingVersion} matched. ${input.rationale}`,
    sourceSummary: `${input.domainTitle} is relevant. ${plan}`,
    recommendedAction: `${input.summary} Clinical judgement remains required.`,
    clinicalSummary: `A persisted assessment matched an approved mapping to ${input.domainTitle}. ${plan} ${input.summary} Clinical judgement remains required.`,
    technicalTrace: {
      ruleId: "ASSESSMENT-CARE-PLANNING-GUIDANCE",
      ruleVersion: 1,
      sourceEventId: input.event.eventId,
      correlationId: input.event.correlationId,
      deduplicationKeys: [input.deduplicationKey],
    },
    permissionRestrictedTechnical: true,
  };
}

export function evaluateAssessmentCarePlanningGuidance(context: GuidanceEvaluationContext): GuidanceEvaluationResult {
  const state: AssessmentCareGuidanceState = context.existingState
    ? { guidance: [...context.existingState.guidance], history: [...context.existingState.history] }
    : { guidance: [], history: [] };
  const result = (status: GuidanceDecisionStatus, reason: string, createdOrUpdated: AssessmentCarePlanningGuidance[] = [], coverage: CarePlanDomainCoverage[] = [], governanceReviewRequired = false): GuidanceEvaluationResult => ({
    status,
    reason,
    state,
    createdOrUpdated,
    coverage,
    governanceReviewRequired,
    carePlansCreated: 0,
  });
  if (!allowedTriggers.has(context.event.eventType)) return result("suppressed", "Event is not an approved persisted assessment trigger.");
  if (!context.assessment) return result("insufficient_data", "Persisted source assessment was not found.");
  if (!context.resident || context.resident.id !== context.assessment.residentId) return result("insufficient_data", "Resident context does not match the source assessment.");
  if (context.resident.nursingHomeId !== context.event.scope.nursingHomeId) return result("error", "Cross-home assessment guidance is prohibited.");
  if (inactiveResidentStates.has(context.resident.lifecycleStatus)) return result("suppressed", "Resident lifecycle status suppresses active guidance.");
  if (["hospital", "temporarily_absent"].includes(context.resident.presenceStatus || "") && (context.absentPolicy || "suppress") === "suppress") return result("suppressed", "Resident absence policy suppresses active guidance and bedside work.");
  if (context.event.eventType === "AssessmentVoided" || context.assessment.status === "deleted") {
    const reconciled = reconcileAssessmentCarePlanningGuidance(state, {
      type: "assessment_voided",
      residentId: context.resident.id,
      assessmentId: context.assessment.id,
      occurredAt: context.evaluatedAt,
      evidenceEntityId: context.event.eventId,
    });
    return { ...result("not_matched", "Voided assessment guidance was reconciled."), state: reconciled };
  }
  const mappingInput: AssessmentMappingEvaluationInput = {
    assessmentId: context.assessment.id,
    status: context.assessment.status || "completed",
    riskLevel: context.assessment.riskLevel,
    totalScore: context.assessment.totalScore,
    scores: context.assessment.scores,
  };
  const mappings = getApprovedRltMappingsForAssessment(context.assessment.type, mappingInput, context.assessment.date, context.mappings);
  if (mappings.matches.length === 0) return result("clinical_mapping_review_required", "No approved effective mapping matched; no frontline recommendation was created.", [], [], true);
  const createdOrUpdated: AssessmentCarePlanningGuidance[] = [];
  const coverageResults: CarePlanDomainCoverage[] = [];
  for (const match of mappings.matches) {
    const domain = RLT_DOMAIN_BY_ID[match.rltDomainId];
    if (!domain?.active) continue;
    const coverage = getActiveCarePlanCoverageForDomain(context.carePlans, context.resident.id, match.rltDomainId, {
      nursingHomeId: context.resident.nursingHomeId,
      evaluatedAt: context.evaluatedAt,
    });
    coverageResults.push(coverage);
    const action = guidanceAction(coverage, match.suggestedCarePlanningAction);
    if (!action) continue;
    const deduplicationKey = ["assessment_care_planning_guidance", context.resident.id, context.assessment.type, domain.id, action].join(":");
    const summary = guidanceText(action, coverage, domain.title);
    const existing = state.guidance.find((item) => item.deduplicationKey === deduplicationKey && activeGuidanceStates.has(item.status));
    if (existing?.sourceEventIds.includes(String(context.event.eventId))) continue;
    const common = {
      assessmentId: context.assessment.id,
      assessmentRiskLevel: context.assessment.riskLevel,
      assessmentScore: context.assessment.totalScore,
      assessmentCompletedAt: context.assessment.date,
      coverageState: coverage.coverageAssessment,
      relatedCarePlanItemIds: coverage.activeCarePlanItems.map((item) => item.carePlanItemId),
      currentDependencyLevel: context.currentDependencyByDomain?.[domain.id],
      summary,
      explanation: explanation({ event: context.event, assessment: context.assessment, mappingId: match.mappingId, mappingVersion: match.mappingVersion, rationale: match.rationale, domainTitle: domain.title, coverage, summary, deduplicationKey }),
      recommendedActionCodes: actionCodes(action, coverage),
      updatedAt: context.evaluatedAt,
      ruleDecisionId: decisionId(String(context.event.eventId), match.mappingId),
    };
    if (existing) {
      Object.assign(existing, common, {
        sourceAssessmentIds: [...new Set([...existing.sourceAssessmentIds, context.assessment.id])],
        sourceEventIds: [...existing.sourceEventIds, String(context.event.eventId)],
        occurrenceCount: existing.occurrenceCount + 1,
      });
      state.history.push({ id: `${existing.id}:history:${state.history.length + 1}`, guidanceId: existing.id, action: "updated", occurredAt: context.evaluatedAt, sourceEventId: String(context.event.eventId) });
      createdOrUpdated.push(existing);
      continue;
    }
    const item: AssessmentCarePlanningGuidance = {
      id: `guidance:${idPart(deduplicationKey)}`,
      residentId: context.resident.id,
      nursingHomeId: context.resident.nursingHomeId,
      wardId: context.resident.wardId,
      assessmentId: context.assessment.id,
      assessmentTypeId: context.assessment.type,
      sourceAssessmentIds: [context.assessment.id],
      sourceEventIds: [String(context.event.eventId)],
      assessmentRiskLevel: context.assessment.riskLevel,
      assessmentScore: context.assessment.totalScore,
      assessmentCompletedAt: context.assessment.date,
      assessmentRltMappingId: match.mappingId,
      assessmentRltMappingVersion: match.mappingVersion,
      rltDomainId: domain.id,
      rltDomainKey: domain.key,
      currentDependencyLevel: context.currentDependencyByDomain?.[domain.id],
      action,
      coverageState: coverage.coverageAssessment,
      relatedCarePlanItemIds: coverage.activeCarePlanItems.map((plan) => plan.carePlanItemId),
      title: `${domain.title} care-planning guidance`,
      summary,
      explanation: common.explanation,
      recommendedActionCodes: common.recommendedActionCodes,
      status: "open",
      ruleDecisionId: common.ruleDecisionId,
      deduplicationKey,
      occurrenceCount: 1,
      createdAt: context.evaluatedAt,
      updatedAt: context.evaluatedAt,
    };
    state.guidance.push(item);
    state.history.push({ id: `${item.id}:history:1`, guidanceId: item.id, action: "created", occurredAt: context.evaluatedAt, sourceEventId: String(context.event.eventId) });
    createdOrUpdated.push(item);
  }
  return result(createdOrUpdated.length ? "matched" : "not_matched", createdOrUpdated.length ? "Approved mapping and guidance conditions matched." : "Approved mapping requested no automatic action.", createdOrUpdated, coverageResults);
}

export type GuidanceReconciliationTrigger =
  | { type: "care_plan_created"; residentId: string; rltDomainId: RltDomainId; carePlanItemId: string; occurredAt: string; evidenceEntityId: string }
  | { type: "care_plan_reviewed"; residentId: string; rltDomainId: RltDomainId; carePlanItemId: string; review: ProblemReview; occurredAt: string; evidenceEntityId: string }
  | { type: "assessment_voided" | "assessment_corrected_not_qualifying"; residentId: string; assessmentId: string; occurredAt: string; evidenceEntityId: string };

export function reconcileAssessmentCarePlanningGuidance(state: AssessmentCareGuidanceState, trigger: GuidanceReconciliationTrigger) {
  const next = { guidance: [...state.guidance], history: [...state.history] };
  for (const item of next.guidance) {
    if (item.residentId !== trigger.residentId || !activeGuidanceStates.has(item.status)) continue;
    let matches = false;
    if (trigger.type === "care_plan_created") matches = item.rltDomainId === trigger.rltDomainId && item.action === "consider_new_plan";
    else if (trigger.type === "care_plan_reviewed") matches = item.rltDomainId === trigger.rltDomainId && item.relatedCarePlanItemIds.includes(trigger.carePlanItemId) && trigger.review.reviewDate >= item.assessmentCompletedAt;
    else matches = item.sourceAssessmentIds.includes(trigger.assessmentId);
    if (!matches) continue;
    item.status = "resolved";
    item.resolvedAt = trigger.occurredAt;
    item.updatedAt = trigger.occurredAt;
    item.actionEvidenceEntityType = trigger.type;
    item.actionEvidenceEntityId = trigger.evidenceEntityId;
    item.resolutionReason = trigger.type;
    next.history.push({ id: `${item.id}:history:${next.history.length + 1}`, guidanceId: item.id, action: "resolved", occurredAt: trigger.occurredAt, reason: trigger.type });
  }
  return next;
}

function requireGuidanceCapability(capabilities: string[], capability: string) {
  if (!capabilities.includes(capability)) throw new Error(`Missing capability: ${capability}`);
}

export function acknowledgeAssessmentCareGuidance(state: AssessmentCareGuidanceState, guidanceId: string, context: { userAccountId: string; nursingHomeId: string; capabilities: string[]; occurredAt: string }) {
  requireGuidanceCapability(context.capabilities, "assessment_care_guidance.acknowledge");
  const item = state.guidance.find((candidate) => candidate.id === guidanceId && candidate.nursingHomeId === context.nursingHomeId);
  if (!item) throw new Error("Guidance not found in scope.");
  item.status = "acknowledged";
  item.acknowledgedAt = context.occurredAt;
  item.acknowledgedBy = context.userAccountId;
  item.updatedAt = context.occurredAt;
  state.history.push({ id: `${item.id}:history:${state.history.length + 1}`, guidanceId: item.id, action: "acknowledged", occurredAt: context.occurredAt, actorId: context.userAccountId });
  return item;
}

export function dismissAssessmentCareGuidance(state: AssessmentCareGuidanceState, guidanceId: string, dismissal: { reason: GuidanceDismissalReason; reasonText?: string }, context: { userAccountId: string; nursingHomeId: string; capabilities: string[]; occurredAt: string }) {
  requireGuidanceCapability(context.capabilities, "assessment_care_guidance.dismiss");
  if (dismissal.reason === "other" && !dismissal.reasonText?.trim()) throw new Error("A reason is required for other.");
  const item = state.guidance.find((candidate) => candidate.id === guidanceId && candidate.nursingHomeId === context.nursingHomeId);
  if (!item) throw new Error("Guidance not found in scope.");
  item.status = "dismissed";
  item.dismissedAt = context.occurredAt;
  item.dismissedBy = context.userAccountId;
  item.dismissalReason = dismissal.reason;
  item.dismissalReasonText = dismissal.reasonText;
  item.updatedAt = context.occurredAt;
  state.history.push({ id: `${item.id}:history:${state.history.length + 1}`, guidanceId: item.id, action: "dismissed", occurredAt: context.occurredAt, actorId: context.userAccountId, reason: dismissal.reason });
  return item;
}

export function projectAssessmentCareGuidanceToWorkItem(item: AssessmentCarePlanningGuidance, now: string, timeZone: string): WorkItem | undefined {
  if (!activeGuidanceStates.has(item.status) || item.action === "clinical_review_required" && !item.relatedCarePlanItemIds.length) return undefined;
  const carePlanItemId = item.relatedCarePlanItemIds[0];
  return {
    id: `work:${idPart(item.deduplicationKey)}`,
    workType: carePlanItemId ? "care_plan_review" : "general_task",
    title: item.title,
    summary: item.summary,
    source: {
      sourceType: "clinical_rule",
      sourceModule: "rules",
      sourceEntityType: "assessment_care_planning_guidance",
      sourceEntityId: item.id,
      parentEntityType: "assessment",
      parentEntityId: item.assessmentId,
      createdByRuleId: "ASSESSMENT-CARE-PLANNING-GUIDANCE",
      createdByRuleVersion: 1,
      sourceEventId: item.sourceEventIds.at(-1),
      route: carePlanItemId ? `/residents/${item.residentId}/care-plan?carePlanProblemId=${carePlanItemId}` : `/residents/${item.residentId}?rltDomainId=${item.rltDomainId}`,
      completionOwner: "assessment_care_guidance_service",
      recreationPolicy: "deterministic",
      createdAt: item.createdAt,
    },
    nursingHomeId: item.nursingHomeId,
    wardId: item.wardId,
    residentId: item.residentId,
    schedule: { scheduleType: "triggered", dueAt: now, effectiveDueAt: now, originalDueAt: now, timeZone },
    persistedStatus: "scheduled",
    assignment: { assignmentType: "role", assignedRoleKey: "nurse", assignedWardId: item.wardId, assignmentStatus: "active", assignedAt: now },
    priority: item.action === "prioritise_overdue_review" ? "urgent" : "important",
    careContext: { carePlanItemId, rltDomainId: item.rltDomainId },
    ruleContext: { ruleIssueId: item.ruleIssueId, ruleDecisionId: item.ruleDecisionId, ruleId: "ASSESSMENT-CARE-PLANNING-GUIDANCE", ruleVersion: 1 },
    correlationId: item.explanation.technicalTrace.correlationId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    schemaVersion: 1,
  };
}

export function validateAssessmentCareGuidance(state: AssessmentCareGuidanceState, input: { assessments: Assessment[]; carePlans: CarePlanSelectorData; mappings: AssessmentRltMapping[] }) {
  const issues: { code: string; guidanceId?: string }[] = [];
  const activeKeys = new Set<string>();
  for (const item of state.guidance) {
    const assessment = input.assessments.find((candidate) => candidate.id === item.assessmentId);
    if (!assessment) issues.push({ code: "guidance_without_source_assessment", guidanceId: item.id });
    if (!RLT_DOMAIN_BY_ID[item.rltDomainId]) issues.push({ code: "guidance_without_domain", guidanceId: item.id });
    if (assessment?.residentId !== item.residentId) issues.push({ code: "guidance_wrong_resident", guidanceId: item.id });
    const mapping = input.mappings.find((candidate) => candidate.id === item.assessmentRltMappingId && candidate.version === item.assessmentRltMappingVersion);
    if (!mapping || mapping.status !== "approved" || !mapping.donApprovedAt || mapping.reviewedByNurseStaffMemberIds.length === 0) issues.push({ code: "unapproved_mapping_usage", guidanceId: item.id });
    if (mapping && mapping.rltDomainId !== item.rltDomainId) issues.push({ code: "guidance_wrong_domain", guidanceId: item.id });
    if (activeGuidanceStates.has(item.status)) {
      if (activeKeys.has(item.deduplicationKey)) issues.push({ code: "duplicate_active_guidance_key", guidanceId: item.id });
      activeKeys.add(item.deduplicationKey);
    }
    const coverage = getActiveCarePlanCoverageForDomain(input.carePlans, item.residentId, item.rltDomainId, { nursingHomeId: item.nursingHomeId, evaluatedAt: item.updatedAt });
    if (item.action === "consider_new_plan" && coverage.hasActivePlan) issues.push({ code: "new_plan_guidance_with_active_plan", guidanceId: item.id });
    if ((item.action === "review_existing_plan" || item.action === "prioritise_overdue_review") && item.relatedCarePlanItemIds.length === 0) issues.push({ code: "review_guidance_without_plan", guidanceId: item.id });
    if (item.status === "resolved" && !item.actionEvidenceEntityId) issues.push({ code: "resolved_without_evidence", guidanceId: item.id });
    if (!item.explanation?.clinicalSummary) issues.push({ code: "missing_explanation", guidanceId: item.id });
  }
  return { issues, duplicateActiveGuidanceKeys: issues.filter((issue) => issue.code === "duplicate_active_guidance_key").length, autoCreatedCarePlans: 0 };
}
