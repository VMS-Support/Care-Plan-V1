import type { WorkItem } from "@/domain/work";
import type { DeteriorationIssue } from "./deteriorationIssueTypes";
import type { DeteriorationQueueAuthContext, DeteriorationQueueFilters, DeteriorationQueueItem, DeteriorationQueueReferences, DeteriorationReviewQueue } from "./deteriorationQueueTypes";

const severityRank = { information: 0, low: 1, medium: 2, high: 3, critical: 4 };
const unresolved = new Set(["open", "acknowledged", "under_review", "escalated", "awaiting_follow_up", "reopened"]);

export function getDeteriorationReviewQueue(issues: DeteriorationIssue[], auth: DeteriorationQueueAuthContext, refs: DeteriorationQueueReferences, filters: DeteriorationQueueFilters = {}): DeteriorationReviewQueue {
  if (!auth.capabilities.includes("deterioration_queue.view")) throw new Error("Missing capability: deterioration_queue.view");
  const rows = issues
    .filter((issue) => String(issue.nursingHomeId) === auth.nursingHomeId)
    .filter((issue) => !auth.wardIds?.length || !issue.wardId || auth.wardIds.includes(String(issue.wardId)) || auth.capabilities.includes("deterioration_queue.view_multi_ward"))
    .filter((issue) => !auth.residentIds?.length || auth.residentIds.includes(String(issue.residentId)))
    .filter((issue) => filters.includeResolved || unresolved.has(issue.status))
    .filter((issue) => !filters.statuses?.length || filters.statuses.includes(issue.status))
    .filter((issue) => !filters.severities?.length || filters.severities.includes(issue.severity))
    .filter((issue) => !filters.issueTypes?.length || filters.issueTypes.includes(issue.issueType))
    .map((issue) => toQueueItem(issue, refs))
    .sort(sortQueue);
  return {
    items: rows,
    sections: {
      newConcerns: rows.filter((item) => item.status === "open"),
      unacknowledged: rows.filter((item) => item.unacknowledged),
      urgent: rows.filter((item) => item.urgent),
      overdueFollowUp: rows.filter((item) => item.overdueFollowUp),
      unresolvedEscalation: rows.filter((item) => item.escalationOpen),
      allUnresolved: rows,
    },
    counts: {
      total: rows.length,
      critical: rows.filter((item) => item.severity === "critical").length,
      unacknowledged: rows.filter((item) => item.unacknowledged).length,
      overdueFollowUp: rows.filter((item) => item.overdueFollowUp).length,
      unresolvedEscalation: rows.filter((item) => item.escalationOpen).length,
    },
  };
}

export function getWardDeteriorationSummary(issues: DeteriorationIssue[], auth: DeteriorationQueueAuthContext, refs: DeteriorationQueueReferences) {
  const queue = getDeteriorationReviewQueue(issues, auth, refs);
  return queue.counts;
}

export function getHomeDeteriorationAttentionSummary(issues: DeteriorationIssue[], auth: DeteriorationQueueAuthContext, refs: DeteriorationQueueReferences) {
  const queue = getDeteriorationReviewQueue(issues, { ...auth, wardIds: undefined, capabilities: [...new Set([...auth.capabilities, "deterioration_queue.view_multi_ward"])] }, refs);
  return queue.counts;
}

function toQueueItem(issue: DeteriorationIssue, refs: DeteriorationQueueReferences): DeteriorationQueueItem {
  const work = (refs.workItems ?? []).filter((item) => issue.activeWorkItemIds.includes(String(item.id)));
  const activeWork = work.filter((item) => !["completed", "cancelled", "not_applicable"].includes(item.persistedStatus));
  const overdueFollowUp = activeWork.some((item) => isOverdue(item, refs.now));
  const nextWork = activeWork.sort((a, b) => (a.schedule.effectiveDueAt ?? a.schedule.dueAt ?? "").localeCompare(b.schedule.effectiveDueAt ?? b.schedule.dueAt ?? ""))[0];
  return {
    issueId: issue.id,
    residentId: String(issue.residentId),
    nursingHomeId: String(issue.nursingHomeId),
    wardId: issue.wardId ? String(issue.wardId) : undefined,
    issueType: issue.issueType,
    status: issue.status,
    severity: issue.severity,
    title: issue.title,
    conciseSummary: issue.conciseSummary,
    openedAt: issue.openedAt,
    latestClinicalEventAt: issue.latestClinicalEventAt,
    unacknowledged: !issue.acknowledgedAt && issue.status === "open",
    overdueFollowUp,
    urgent: issue.severity === "critical" || issue.severity === "high" || overdueFollowUp,
    outstandingWorkCount: activeWork.length,
    escalationOpen: refs.openEscalationIssueIds?.has(issue.id) ?? false,
    nextRequiredAction: nextWork?.title,
    route: `/residents/${issue.residentId}?careSection=deterioration&issue=${issue.id}`,
  };
}

function isOverdue(item: WorkItem, now: string) {
  const due = item.schedule.effectiveDueAt ?? item.schedule.dueAt;
  return Boolean(due && due < now && !["completed", "cancelled", "not_applicable"].includes(item.persistedStatus));
}

function sortQueue(a: DeteriorationQueueItem, b: DeteriorationQueueItem) {
  return Number(b.overdueFollowUp) - Number(a.overdueFollowUp)
    || severityRank[b.severity] - severityRank[a.severity]
    || Number(b.unacknowledged) - Number(a.unacknowledged)
    || b.latestClinicalEventAt.localeCompare(a.latestClinicalEventAt);
}
