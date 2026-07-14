import type {
  DeteriorationActionContext,
  DeteriorationIssue,
  DeteriorationIssueEvent,
  DeteriorationIssueRepository,
  DeteriorationIssueStatus,
  DeteriorationSeverity,
  DeteriorationSourceReference,
} from "./deteriorationIssueTypes";
import type { DeteriorationIssueType } from "./deteriorationIssueTypes";

const rank: Record<DeteriorationSeverity, number> = { information: 0, low: 1, medium: 2, high: 3, critical: 4 };
const activeStatuses: DeteriorationIssueStatus[] = ["open", "acknowledged", "under_review", "escalated", "awaiting_follow_up", "reopened"];

export interface CreateOrUpdateDeteriorationIssueInput {
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  roomId?: string;
  issueType: DeteriorationIssueType;
  severity: DeteriorationSeverity;
  title: string;
  conciseSummary: string;
  sourceReferences: DeteriorationSourceReference[];
  deduplicationKey: string;
  clinicalEventAt: string;
  ruleDecisionId?: string;
  ruleIssueId?: string;
  rltDomainIds?: string[];
  workItemIds?: string[];
}

export function createOrUpdateDeteriorationIssue(input: CreateOrUpdateDeteriorationIssueInput, repository: DeteriorationIssueRepository, createId: () => string, correlationId: string) {
  const existing = repository.issues.find((item) => item.deduplicationKey === input.deduplicationKey && activeStatuses.includes(item.status));
  if (existing) {
    const next: DeteriorationIssue = {
      ...existing,
      severity: rank[input.severity] > rank[existing.severity] ? input.severity : existing.severity,
      status: rank[input.severity] > rank[existing.severity] && existing.status !== "escalated" ? "escalated" : existing.status,
      title: input.title,
      conciseSummary: input.conciseSummary,
      latestClinicalEventAt: input.clinicalEventAt,
      occurrenceCount: existing.occurrenceCount + 1,
      sourceReferences: mergeSources(existing.sourceReferences, input.sourceReferences),
      latestRuleDecisionId: input.ruleDecisionId ?? existing.latestRuleDecisionId,
      ruleIssueId: input.ruleIssueId ?? existing.ruleIssueId,
      activeWorkItemIds: [...new Set([...existing.activeWorkItemIds, ...(input.workItemIds ?? [])])],
      rltDomainIds: [...new Set([...existing.rltDomainIds, ...(input.rltDomainIds ?? [])])],
      updatedAt: input.clinicalEventAt,
    };
    repository.issues = repository.issues.map((item) => item.id === next.id ? next : item);
    repository.events.push(issueEvent(createId(), "DeteriorationIssueUpdated", next, input.clinicalEventAt, correlationId, { sourceReferences: input.sourceReferences }));
    return next;
  }
  const issue: DeteriorationIssue = {
    id: createId(),
    residentId: input.residentId,
    nursingHomeId: input.nursingHomeId,
    wardId: input.wardId,
    roomId: input.roomId,
    issueType: input.issueType,
    status: "open",
    severity: input.severity,
    title: input.title,
    conciseSummary: input.conciseSummary,
    openedAt: input.clinicalEventAt,
    firstClinicalEventAt: input.clinicalEventAt,
    latestClinicalEventAt: input.clinicalEventAt,
    sourceReferences: input.sourceReferences,
    latestRuleDecisionId: input.ruleDecisionId,
    ruleIssueId: input.ruleIssueId,
    activeWorkItemIds: input.workItemIds ?? [],
    escalationRecordIds: [],
    rltDomainIds: input.rltDomainIds ?? [],
    deduplicationKey: input.deduplicationKey,
    episodeNumber: 1,
    occurrenceCount: 1,
    createdAt: input.clinicalEventAt,
    updatedAt: input.clinicalEventAt,
  };
  repository.issues = [issue, ...repository.issues];
  repository.events.push(issueEvent(createId(), "DeteriorationIssueOpened", issue, input.clinicalEventAt, correlationId, { sourceReferences: input.sourceReferences }));
  return issue;
}

export function getDeteriorationIssueById(repository: DeteriorationIssueRepository, id: string) {
  return repository.issues.find((item) => item.id === id);
}

export function acknowledgeDeteriorationIssue(issue: DeteriorationIssue, context: DeteriorationActionContext, repository: DeteriorationIssueRepository, createId: () => string) {
  requireCapability(context, "deterioration_queue.acknowledge");
  requireScope(issue, context);
  const next = { ...issue, status: "acknowledged" as const, acknowledgedAt: context.occurredAt, acknowledgedByUserAccountId: context.userAccountId, acknowledgedByStaffMemberId: context.staffMemberId, updatedAt: context.occurredAt };
  update(repository, next);
  repository.events.push(issueEvent(createId(), "DeteriorationIssueAcknowledged", next, context.occurredAt, context.correlationId, { actorUserAccountId: context.userAccountId }));
  return next;
}

export function startDeteriorationReview(issue: DeteriorationIssue, context: DeteriorationActionContext, repository: DeteriorationIssueRepository, createId: () => string) {
  requireCapability(context, "deterioration_queue.start_review");
  requireScope(issue, context);
  const next = { ...issue, status: "under_review" as const, reviewStartedAt: context.occurredAt, reviewStartedByUserAccountId: context.userAccountId, reviewStartedByStaffMemberId: context.staffMemberId, updatedAt: context.occurredAt };
  update(repository, next);
  repository.events.push(issueEvent(createId(), "DeteriorationReviewStarted", next, context.occurredAt, context.correlationId, { actorUserAccountId: context.userAccountId }));
  return next;
}

export function escalateDeteriorationIssue(issue: DeteriorationIssue, context: DeteriorationActionContext, repository: DeteriorationIssueRepository, createId: () => string, severity: DeteriorationSeverity = issue.severity) {
  requireCapability(context, "deterioration_queue.escalate");
  requireScope(issue, context);
  const next = { ...issue, status: "escalated" as const, severity, escalatedAt: context.occurredAt, updatedAt: context.occurredAt };
  update(repository, next);
  repository.events.push(issueEvent(createId(), "DeteriorationIssueEscalated", next, context.occurredAt, context.correlationId, { actorUserAccountId: context.userAccountId }));
  return next;
}

export function resolveDeteriorationIssue(issue: DeteriorationIssue, context: DeteriorationActionContext, repository: DeteriorationIssueRepository, createId: () => string, reasonCode: string, summary: string) {
  requireCapability(context, "deterioration_queue.resolve");
  requireScope(issue, context);
  if (!reasonCode || !summary.trim()) throw new Error("Resolution reason and summary are required.");
  const next = { ...issue, status: "resolved" as const, resolvedAt: context.occurredAt, resolvedByUserAccountId: context.userAccountId, resolvedByStaffMemberId: context.staffMemberId, resolutionReasonCode: reasonCode, resolutionSummary: summary, activeWorkItemIds: [], updatedAt: context.occurredAt };
  update(repository, next);
  repository.events.push(issueEvent(createId(), "DeteriorationIssueResolved", next, context.occurredAt, context.correlationId, { reasonCode }));
  return next;
}

export function dismissDeteriorationIssue(issue: DeteriorationIssue, context: DeteriorationActionContext, repository: DeteriorationIssueRepository, createId: () => string, reasonCode: string, reasonText: string) {
  requireCapability(context, "deterioration_queue.dismiss");
  requireScope(issue, context);
  if (!reasonCode || !reasonText.trim()) throw new Error("Dismissal reason is required.");
  const next = { ...issue, status: "dismissed" as const, dismissedAt: context.occurredAt, dismissedByUserAccountId: context.userAccountId, dismissalReasonCode: reasonCode, dismissalReasonText: reasonText, activeWorkItemIds: [], updatedAt: context.occurredAt };
  update(repository, next);
  repository.events.push(issueEvent(createId(), "DeteriorationIssueDismissed", next, context.occurredAt, context.correlationId, { reasonCode }));
  return next;
}

function mergeSources(existing: DeteriorationSourceReference[], next: DeteriorationSourceReference[]) {
  const byKey = new Map(existing.map((item) => [`${item.sourceType}:${item.sourceEntityId}:${item.sourceEventId ?? ""}`, item]));
  next.forEach((item) => byKey.set(`${item.sourceType}:${item.sourceEntityId}:${item.sourceEventId ?? ""}`, item));
  return [...byKey.values()].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

function update(repository: DeteriorationIssueRepository, issue: DeteriorationIssue) {
  repository.issues = repository.issues.map((item) => item.id === issue.id ? issue : item);
}

function issueEvent(id: string, type: DeteriorationIssueEvent["type"], issue: DeteriorationIssue, occurredAt: string, correlationId: string, payload: Record<string, unknown>): DeteriorationIssueEvent {
  return { id, type, residentId: String(issue.residentId), nursingHomeId: String(issue.nursingHomeId), wardId: issue.wardId ? String(issue.wardId) : undefined, issueId: issue.id, occurredAt, correlationId, payload: { severity: issue.severity, status: issue.status, issueType: issue.issueType, ...payload } };
}

function requireCapability(context: DeteriorationActionContext, capability: string) {
  if (!context.capabilities.includes(capability)) throw new Error(`Missing capability: ${capability}`);
}

function requireScope(issue: DeteriorationIssue, context: DeteriorationActionContext) {
  if (String(issue.nursingHomeId) !== context.nursingHomeId) throw new Error("Deterioration issue belongs to another nursing home.");
  if (issue.wardId && context.wardIds?.length && !context.wardIds.includes(String(issue.wardId))) throw new Error("Deterioration issue is outside the authorised ward scope.");
}
