import type { RuleExplanation } from "@/domain/rules/ruleTypes";
import type { DeteriorationSeverity } from "@/domain/deterioration/deteriorationIssueTypes";
import type {
  ClinicalFollowUpDecision,
  ClinicalFollowUpPolicy,
  ClinicalFollowUpSourceEvent,
  ClinicalFollowUpTriggerRule,
  ClinicalFollowUpWorkDefinition,
  FollowUpSourceType,
} from "./clinicalFollowUpPolicyTypes";

const severityRank: Record<DeteriorationSeverity, number> = { information: 0, low: 1, medium: 2, high: 3, critical: 4 };

export interface EffectiveClinicalFollowUpPolicyContext {
  sourceType: FollowUpSourceType;
  nursingHomeId: string;
  enterpriseId?: string;
  effectiveAt: string;
}

export interface ClinicalFollowUpResidentContext {
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  roomId?: string;
  lifecycleStatus?: "active" | "temporarily_absent" | "hospital_transfer" | "discharged" | "deceased";
}

export interface ClinicalFollowUpAuthorizationContext {
  capabilities: string[];
  userAccountId?: string;
  staffMemberId?: string;
}

export function getEffectiveClinicalFollowUpPolicy(policies: ClinicalFollowUpPolicy[], context: EffectiveClinicalFollowUpPolicyContext) {
  return policies
    .filter((policy) => policy.sourceType === context.sourceType)
    .filter((policy) => policy.status === "approved" && Boolean(policy.approvedAt))
    .filter((policy) => policy.effectiveFrom <= context.effectiveAt && (!policy.effectiveTo || policy.effectiveTo > context.effectiveAt))
    .filter((policy) => policy.nursingHomeId === context.nursingHomeId || (!policy.nursingHomeId && (!policy.enterpriseId || policy.enterpriseId === context.enterpriseId)))
    .sort((a, b) => b.version - a.version || b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
}

export function evaluateClinicalFollowUp(sourceEvent: ClinicalFollowUpSourceEvent, residentContext: ClinicalFollowUpResidentContext, policy: ClinicalFollowUpPolicy | undefined, authorizationContext: ClinicalFollowUpAuthorizationContext): ClinicalFollowUpDecision {
  if (!policy) return unavailable(sourceEvent, "No approved clinical follow-up policy is configured.");
  if (residentContext.nursingHomeId !== sourceEvent.nursingHomeId || residentContext.residentId !== sourceEvent.residentId) return insufficient(sourceEvent, policy, "Source event does not match resident context.");
  if (residentContext.lifecycleStatus === "discharged" || residentContext.lifecycleStatus === "deceased") return suppressed(sourceEvent, policy, "Resident lifecycle does not permit new bedside follow-up work.");

  const trigger = policy.triggerRules.find((rule) => triggerMatches(rule, sourceEvent));
  if (!trigger) return notMatched(sourceEvent, policy, "No trigger rule matched the source event.");
  const missing = (trigger.requiredSourceFields ?? []).filter((field) => sourceEvent.fields?.[field] === undefined);
  if (missing.length) return insufficient(sourceEvent, policy, `Missing required source fields: ${missing.join(", ")}.`);

  const issueSeverity = trigger.issueSeverity === "inherit" ? sourceEvent.severity : trigger.issueSeverity;
  const issueKey = issueDeduplicationKey(sourceEvent, trigger, policy);
  const workDefinitions = policy.workDefinitions
    .filter((definition) => !definition.createWhenIssueSeverityAtLeast || severityRank[issueSeverity] >= severityRank[definition.createWhenIssueSeverityAtLeast])
    .filter((definition) => (definition.requiredCapabilities ?? []).every((capability) => authorizationContext.capabilities.includes(capability)));
  const workDecisions = workDefinitions.map((definition) => workDecision(sourceEvent, definition, issueKey));
  const escalationRecommended = policy.escalationRules.some((rule) => {
    if (rule.when !== "on_match") return false;
    return !rule.severityAtLeast || severityRank[issueSeverity] >= severityRank[rule.severityAtLeast];
  });

  return {
    status: "matched",
    issueDecision: {
      create: trigger.createOrUpdateIssue,
      updateExisting: trigger.createOrUpdateIssue,
      issueType: trigger.issueType,
      severity: issueSeverity,
      deduplicationKey: issueKey,
    },
    workDecisions,
    escalationRecommended,
    explanation: explanation(sourceEvent, policy, `Matched ${trigger.id}; ${workDecisions.length} follow-up action${workDecisions.length === 1 ? "" : "s"} proposed.`),
    policyId: policy.id,
    policyVersion: policy.version,
  };
}

function triggerMatches(rule: ClinicalFollowUpTriggerRule, sourceEvent: ClinicalFollowUpSourceEvent) {
  if (!rule.sourceEventTypes.includes(sourceEvent.eventType)) return false;
  if (rule.sourceConditionCode && rule.sourceConditionCode !== sourceEvent.conditionCode) return false;
  if (rule.minimumSeverity && severityRank[sourceEvent.severity] < severityRank[rule.minimumSeverity]) return false;
  if (rule.triggerRuleDecisionCodes?.length && !rule.triggerRuleDecisionCodes.some((code) => sourceEvent.ruleDecisionCodes?.includes(code))) return false;
  return true;
}

function issueDeduplicationKey(sourceEvent: ClinicalFollowUpSourceEvent, trigger: ClinicalFollowUpTriggerRule, policy: ClinicalFollowUpPolicy) {
  const base = `${sourceEvent.nursingHomeId}:${sourceEvent.residentId}:${policy.id}:v${policy.version}:${trigger.issueType}`;
  if (trigger.deduplicationMode === "per_source_event") return `${base}:${sourceEvent.id}`;
  if (trigger.deduplicationMode === "time_window") {
    const minutes = trigger.deduplicationWindowMinutes ?? 60;
    const bucket = Math.floor(Date.parse(sourceEvent.observedAt ?? sourceEvent.recordedAt) / (minutes * 60_000));
    return `${base}:window:${bucket}`;
  }
  if (trigger.deduplicationMode === "per_protocol_occurrence") return `${base}:${sourceEvent.conditionCode ?? sourceEvent.eventType}`;
  return base;
}

function workDecision(sourceEvent: ClinicalFollowUpSourceEvent, definition: ClinicalFollowUpWorkDefinition, issueKey: string): ClinicalFollowUpDecision["workDecisions"][number] {
  const dueAt = calculateDueAt(sourceEvent, definition);
  const dedupe = definition.deduplicationMode === "per_source_event"
    ? `${issueKey}:${definition.actionCode}:${sourceEvent.id}`
    : definition.deduplicationMode === "single_active_per_issue"
      ? `${issueKey}:${definition.actionCode}`
      : `${issueKey}:${definition.id}`;
  return {
    actionCode: definition.actionCode,
    create: true,
    updateExisting: definition.deduplicationMode !== "per_source_event",
    dueAt,
    priority: definition.priority,
    assignmentPolicy: definition.assignmentPolicy,
    workType: definition.workType,
    completionEvidence: definition.completionEvidence,
    deduplicationKey: dedupe,
    title: template(definition.titleTemplate, sourceEvent),
    requiredObservationSetType: definition.requiredObservationSetType,
    requiredObservationTypes: definition.requiredObservationTypes,
    assignedRoleKey: definition.assignedRoleKey,
    assignedTeamId: definition.assignedTeamId ? String(definition.assignedTeamId) : undefined,
  };
}

function calculateDueAt(sourceEvent: ClinicalFollowUpSourceEvent, definition: ClinicalFollowUpWorkDefinition) {
  if (definition.dueFrom === "manual_selected_time") return sourceEvent.manualDueAt;
  const start = definition.dueFrom === "source_observed_time"
    ? sourceEvent.observedAt
    : definition.dueFrom === "source_recorded_time"
      ? sourceEvent.recordedAt
      : sourceEvent.recordedAt;
  if (!start || definition.dueOffsetMinutes === undefined) return start;
  return new Date(Date.parse(start) + definition.dueOffsetMinutes * 60_000).toISOString();
}

function template(value: string, sourceEvent: ClinicalFollowUpSourceEvent) {
  return value.replaceAll("{{residentId}}", sourceEvent.residentId).replaceAll("{{conditionCode}}", sourceEvent.conditionCode ?? sourceEvent.eventType);
}

function unavailable(sourceEvent: ClinicalFollowUpSourceEvent, reason: string): ClinicalFollowUpDecision {
  return { status: "policy_unavailable", workDecisions: [], escalationRecommended: false, explanation: fallbackExplanation(sourceEvent, reason) };
}
function notMatched(sourceEvent: ClinicalFollowUpSourceEvent, policy: ClinicalFollowUpPolicy, reason: string): ClinicalFollowUpDecision {
  return { status: "not_matched", workDecisions: [], escalationRecommended: false, explanation: explanation(sourceEvent, policy, reason), policyId: policy.id, policyVersion: policy.version };
}
function insufficient(sourceEvent: ClinicalFollowUpSourceEvent, policy: ClinicalFollowUpPolicy, reason: string): ClinicalFollowUpDecision {
  return { status: "insufficient_data", workDecisions: [], escalationRecommended: false, explanation: explanation(sourceEvent, policy, reason), policyId: policy.id, policyVersion: policy.version };
}
function suppressed(sourceEvent: ClinicalFollowUpSourceEvent, policy: ClinicalFollowUpPolicy, reason: string): ClinicalFollowUpDecision {
  return { status: "suppressed", workDecisions: [], escalationRecommended: false, explanation: explanation(sourceEvent, policy, reason), policyId: policy.id, policyVersion: policy.version };
}
function explanation(sourceEvent: ClinicalFollowUpSourceEvent, policy: ClinicalFollowUpPolicy, summary: string): RuleExplanation {
  return { whatHappened: sourceEvent.title, thresholdOrCondition: sourceEvent.conditionCode ?? sourceEvent.eventType, sourceSummary: sourceEvent.sourceReference.safeDisplayLabel ?? sourceEvent.conciseSummary, recommendedAction: summary, clinicalSummary: sourceEvent.conciseSummary, technicalTrace: { ruleId: policy.id, ruleVersion: policy.version, sourceEventId: sourceEvent.sourceReference.sourceEventId ?? sourceEvent.id, correlationId: sourceEvent.id, deduplicationKeys: [] }, permissionRestrictedTechnical: true };
}
function fallbackExplanation(sourceEvent: ClinicalFollowUpSourceEvent, reason: string): RuleExplanation {
  return { whatHappened: sourceEvent.title, thresholdOrCondition: sourceEvent.conditionCode ?? sourceEvent.eventType, sourceSummary: sourceEvent.sourceReference.safeDisplayLabel ?? sourceEvent.conciseSummary, recommendedAction: reason, clinicalSummary: sourceEvent.conciseSummary, technicalTrace: { ruleId: "clinical-follow-up-policy-unavailable", ruleVersion: 0, sourceEventId: sourceEvent.sourceReference.sourceEventId ?? sourceEvent.id, correlationId: sourceEvent.id, deduplicationKeys: [] }, permissionRestrictedTechnical: true };
}
