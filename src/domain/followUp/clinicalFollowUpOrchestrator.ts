import type { WorkAssignment, WorkItem, WorkProjectionState, WorkSourceReference } from "@/domain/work";
import { createOrUpdateDeteriorationIssue } from "@/domain/deterioration/deteriorationIssueService";
import type { DeteriorationIssueRepository } from "@/domain/deterioration/deteriorationIssueTypes";
import {
  evaluateClinicalFollowUp,
  getEffectiveClinicalFollowUpPolicy,
  type ClinicalFollowUpAuthorizationContext,
  type ClinicalFollowUpResidentContext,
} from "./clinicalFollowUpEngine";
import type { ClinicalFollowUpDecision, ClinicalFollowUpPolicy, ClinicalFollowUpSourceEvent } from "./clinicalFollowUpPolicyTypes";

export interface ClinicalFollowUpOperationalContext {
  nursingHomeId: string;
  enterpriseId?: string;
  timezone: string;
  correlationId: string;
}

export interface ClinicalFollowUpRepository extends DeteriorationIssueRepository, WorkProjectionState {
  followUpPolicies: ClinicalFollowUpPolicy[];
  followUpDecisions: ClinicalFollowUpDecision[];
}

export interface HandleClinicalFollowUpEventInput {
  event: ClinicalFollowUpSourceEvent;
  residentContext: ClinicalFollowUpResidentContext;
  operationalContext: ClinicalFollowUpOperationalContext;
  authorizationContext: ClinicalFollowUpAuthorizationContext;
}

export function handleClinicalFollowUpEvent(input: HandleClinicalFollowUpEventInput, repository: ClinicalFollowUpRepository, createId: () => string) {
  const policy = getEffectiveClinicalFollowUpPolicy(repository.followUpPolicies, {
    sourceType: input.event.sourceType,
    nursingHomeId: input.operationalContext.nursingHomeId,
    enterpriseId: input.operationalContext.enterpriseId,
    effectiveAt: input.event.observedAt ?? input.event.recordedAt,
  });
  const decision = evaluateClinicalFollowUp(input.event, input.residentContext, policy, input.authorizationContext);
  repository.followUpDecisions = [decision, ...(repository.followUpDecisions ?? [])];
  if (decision.status !== "matched" || !decision.issueDecision?.create) return { decision };

  const issue = createOrUpdateDeteriorationIssue({
    residentId: input.event.residentId,
    nursingHomeId: input.event.nursingHomeId,
    wardId: input.event.wardId,
    roomId: input.event.roomId,
    issueType: decision.issueDecision.issueType,
    severity: decision.issueDecision.severity,
    title: input.event.title,
    conciseSummary: input.event.conciseSummary,
    sourceReferences: [input.event.sourceReference],
    deduplicationKey: decision.issueDecision.deduplicationKey,
    clinicalEventAt: input.event.observedAt ?? input.event.recordedAt,
    ruleDecisionId: input.event.ruleDecisionId,
    ruleIssueId: input.event.ruleIssueId,
    rltDomainIds: input.event.rltDomainIds,
  }, repository, createId, input.operationalContext.correlationId);

  const workItems = decision.workDecisions.flatMap((workDecision) => {
    const existing = repository.workItems.find((item) => item.source.sourceOccurrenceId === workDecision.deduplicationKey && !["completed", "cancelled", "not_applicable"].includes(item.persistedStatus));
    if (existing && workDecision.updateExisting) {
      const updated = { ...existing, title: workDecision.title, priority: workDecision.priority, schedule: { ...existing.schedule, dueAt: workDecision.dueAt, effectiveDueAt: workDecision.dueAt }, updatedAt: input.event.recordedAt };
      repository.workItems = repository.workItems.map((item) => item.id === existing.id ? updated : item);
      return [updated];
    }
    if (existing) return [existing];
    const created = createFollowUpWorkItem(workDecision, issue.id, input, createId);
    repository.workItems = [created, ...(repository.workItems ?? [])];
    return [created];
  });
  if (workItems.length) {
    issue.activeWorkItemIds = [...new Set([...issue.activeWorkItemIds, ...workItems.map((item) => String(item.id))])];
    repository.issues = repository.issues.map((item) => item.id === issue.id ? issue : item);
  }
  return { decision, issue, workItems };
}

function createFollowUpWorkItem(workDecision: ClinicalFollowUpDecision["workDecisions"][number], issueId: string, input: HandleClinicalFollowUpEventInput, createId: () => string): WorkItem {
  const now = input.event.recordedAt;
  return {
    id: createId(),
    workType: workDecision.workType,
    title: workDecision.title,
    summary: input.event.conciseSummary,
    source: sourceReference(workDecision, issueId, input),
    nursingHomeId: input.event.nursingHomeId,
    wardId: input.event.wardId,
    roomId: input.event.roomId,
    residentId: input.event.residentId,
    schedule: { scheduleType: "triggered", dueAt: workDecision.dueAt, effectiveDueAt: workDecision.dueAt, timeZone: input.operationalContext.timezone },
    persistedStatus: "scheduled",
    assignment: assignment(workDecision, input),
    priority: workDecision.priority,
    clinicalUrgency: workDecision.priority === "critical" ? "immediate" : workDecision.priority === "urgent" ? "urgent_review" : workDecision.priority === "important" ? "time_sensitive" : "routine",
    recommendedActions: [{ code: workDecision.actionCode, label: workDecision.title, route: `/residents/${input.event.residentId}` }],
    ruleContext: { ruleIssueId: input.event.ruleIssueId, ruleDecisionId: input.event.ruleDecisionId, ruleId: input.event.sourceType, ruleVersion: undefined },
    correlationId: input.operationalContext.correlationId,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

function sourceReference(workDecision: ClinicalFollowUpDecision["workDecisions"][number], issueId: string, input: HandleClinicalFollowUpEventInput): WorkSourceReference {
  return {
    sourceType: "clinical_rule",
    sourceModule: "rules",
    sourceEntityType: "deterioration_issue",
    sourceEntityId: issueId,
    sourceOccurrenceId: workDecision.deduplicationKey,
    parentEntityType: input.event.sourceReference.sourceType,
    parentEntityId: input.event.sourceReference.sourceEntityId,
    createdByRuleId: input.event.sourceType,
    createdByRuleVersion: undefined,
    sourceEventId: input.event.sourceReference.sourceEventId,
    correlationId: input.operationalContext.correlationId,
    route: `/residents/${input.event.residentId}?careSection=vitals&issue=${issueId}`,
    completionOwner: workDecision.completionEvidence,
    recreationPolicy: "event_replay",
    createdAt: input.event.recordedAt,
  };
}

function assignment(workDecision: ClinicalFollowUpDecision["workDecisions"][number], input: HandleClinicalFollowUpEventInput): WorkAssignment {
  if (workDecision.assignmentPolicy === "ward_queue") return { assignmentType: "ward", assignedWardId: input.event.wardId, assignedAt: input.event.recordedAt, assignmentStatus: "active", assignmentReasonCode: "clinical_follow_up" };
  if (workDecision.assignmentPolicy === "role_queue") return { assignmentType: "role", assignedRoleKey: workDecision.assignedRoleKey ?? "nurse", assignedAt: input.event.recordedAt, assignmentStatus: "active", assignmentReasonCode: "clinical_follow_up" };
  if (workDecision.assignmentPolicy === "team") return { assignmentType: "team", assignedTeamId: workDecision.assignedTeamId, assignedAt: input.event.recordedAt, assignmentStatus: "active", assignmentReasonCode: "clinical_follow_up" };
  return { assignmentType: "unassigned", assignedAt: input.event.recordedAt, assignmentStatus: "active", assignmentReasonCode: "clinical_follow_up" };
}
