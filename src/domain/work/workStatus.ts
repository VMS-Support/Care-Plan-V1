import {
  classifyDueTime,
  defaultDueTimePolicy,
  type Clock,
  type DueTimeClassification,
  type DueTimePolicy,
  type ScheduledWorkReference,
} from "@/lib/care/dueTime";
import type { OperationalContext } from "@/lib/care/types";
import type { WorkDisplayStatus, WorkItem } from "./workTypes";

const terminal = new Set(["completed", "cancelled", "not_applicable", "missed"]);

export function getWorkItemDueTimeClassification(
  item: WorkItem,
  context: OperationalContext,
  policy: DueTimePolicy = defaultDueTimePolicy,
  clock?: Clock,
) {
  const dueAt = item.schedule.effectiveDueAt || item.deferral?.deferredUntil || item.schedule.dueAt;
  if (!dueAt) return undefined;
  const scheduledWorkType: ScheduledWorkReference["workType"] =
    item.workType === "general_task"
      ? "task"
      : item.workType === "documentation" || item.workType === "referral"
        ? "other"
        : item.workType;
  const work: ScheduledWorkReference = {
    id: String(item.id),
    workType: scheduledWorkType,
    nursingHomeId: item.nursingHomeId,
    wardId: item.wardId,
    residentId: item.residentId,
    dueAt,
    persistedStatus: item.persistedStatus,
    completedAt: item.completion?.recordedAt,
    effectiveCompletedAt: item.completion?.effectiveCompletedAt,
    deferredUntil: item.deferral?.deferredUntil,
    sourceEntityType: item.source.sourceEntityType,
    sourceEntityId: item.source.sourceEntityId,
  };
  return classifyDueTime(work, context, policy, clock);
}

export function getWorkDisplayStatus(
  item: WorkItem,
  due?: DueTimeClassification,
): WorkDisplayStatus {
  if (
    terminal.has(item.persistedStatus) ||
    item.persistedStatus === "deferred" ||
    item.persistedStatus === "in_progress"
  )
    return item.persistedStatus;
  if (due?.isOverdue) return "overdue";
  if (due?.isDueNow) return "due_now";
  if (due && (due.isInNextHour || (due.minutesUntilDue !== undefined && due.minutesUntilDue <= 60)))
    return "due_soon";
  return "scheduled";
}

const labels: Record<WorkDisplayStatus, string> = {
  scheduled: "Scheduled",
  due_soon: "Due Soon",
  due_now: "Due Now",
  overdue: "Overdue",
  in_progress: "In Progress",
  completed: "Completed",
  missed: "Missed",
  deferred: "Deferred",
  cancelled: "Cancelled",
  not_applicable: "Not Applicable",
};
export const getWorkStatusLabel = (status: WorkDisplayStatus) => labels[status];
export function getWorkStatusDescription(
  item: WorkItem,
  status: WorkDisplayStatus,
  due?: DueTimeClassification,
) {
  if (status === "overdue") return `${due?.minutesOverdue || 0}m overdue`;
  if (status === "completed" && item.completion?.wasCompletedLate)
    return `Completed · ${item.completion.minutesCompletedLate || 0}m late`;
  if (status === "deferred")
    return `Deferred${item.deferral?.deferredUntil ? ` · Due ${item.deferral.deferredUntil}` : ""}`;
  const reason =
    item.missed?.reasonText || item.cancellation?.reasonText || item.notApplicable?.reasonText;
  return reason ? `${labels[status]} · ${reason}` : labels[status];
}
export const getWorkStatusBadge = (status: WorkDisplayStatus) =>
  status === "overdue" || status === "missed"
    ? "destructive"
    : status === "due_now" || status === "due_soon"
      ? "warning"
      : status === "completed"
        ? "secondary"
        : "outline";
export const getWorkStatusSortRank = (status: WorkDisplayStatus) =>
  ({
    missed: 0,
    overdue: 1,
    due_now: 2,
    due_soon: 3,
    in_progress: 4,
    scheduled: 5,
    deferred: 6,
    completed: 7,
    cancelled: 8,
    not_applicable: 9,
  })[status];
