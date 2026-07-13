import type { OperationalContext, Resident, Ward } from "@/lib/care/types";
import { getWorkTypeHandler } from "./workHandlers";
import {
  getWorkDisplayStatus,
  getWorkItemDueTimeClassification,
  getWorkStatusDescription,
  getWorkStatusSortRank,
} from "./workStatus";
import type { WorkAuthContext, WorkItem, WorkQueueFilters, WorkQueueItem } from "./workTypes";

export interface WorkQueueReferenceData {
  residents: Resident[];
  wards: Ward[];
}
const historyStatuses = new Set(["completed", "missed", "cancelled", "not_applicable"]);
const assignmentVisible = (item: WorkItem, auth: WorkAuthContext) => {
  const a = item.assignment;
  if (a.type === "unassigned" || a.type === "ward_queue" || a.type === "team") return true;
  if (a.type === "person" || a.type === "self")
    return (
      a.assignedUserAccountId === auth.userAccountId ||
      a.assignedStaffMemberId === auth.staffMemberId
    );
  return a.type === "role" && !!a.assignedRoleKey && auth.roleKeys.includes(a.assignedRoleKey);
};
const requestedAssignment = (item: WorkItem, filters: WorkQueueFilters, auth: WorkAuthContext) => {
  if (!filters.assignment || filters.assignment === "all") return true;
  if (filters.assignment === "mine")
    return (
      item.assignment.assignedUserAccountId === auth.userAccountId ||
      item.assignment.assignedStaffMemberId === auth.staffMemberId
    );
  if (filters.assignment === "role")
    return (
      item.assignment.type === "role" &&
      !!item.assignment.assignedRoleKey &&
      auth.roleKeys.includes(item.assignment.assignedRoleKey)
    );
  if (filters.assignment === "ward") return item.assignment.type === "ward_queue";
  return item.assignment.type === "unassigned";
};

export function getWorkItemsForOperationalContext(
  items: WorkItem[],
  context: OperationalContext,
  auth: WorkAuthContext,
  filters: WorkQueueFilters = {},
  refs: WorkQueueReferenceData = { residents: [], wards: [] },
): WorkQueueItem[] {
  if (!auth.authorisedNursingHomeIds.includes(String(context.nursingHomeId))) return [];
  const selectedWards = new Set(
    context.wardIds.filter((id) => auth.authorisedWardIds.includes(String(id))).map(String),
  );
  const seen = new Set<string>();
  const rows: (WorkQueueItem & { rank: number })[] = [];
  for (const item of items) {
    const id = String(item.id);
    if (seen.has(id) || String(item.nursingHomeId) !== String(context.nursingHomeId)) continue;
    if (item.wardId && !selectedWards.has(String(item.wardId))) continue;
    if (item.shiftId && String(item.shiftId) !== String(context.shiftId)) continue;
    if (item.operationalDate && item.operationalDate !== context.operationalDate) continue;
    if (!assignmentVisible(item, auth) || !requestedAssignment(item, filters, auth)) continue;
    const isHistory = historyStatuses.has(item.persistedStatus);
    if ((filters.mode || "active") === "active" ? isHistory : !isHistory) continue;
    if (filters.workTypes && !filters.workTypes.includes(item.workType)) continue;
    if (filters.persistedStatuses && !filters.persistedStatuses.includes(item.persistedStatus))
      continue;
    if (filters.priorities && !filters.priorities.includes(item.priority)) continue;
    if (filters.wardIds && (!item.wardId || !filters.wardIds.includes(String(item.wardId))))
      continue;
    if (filters.residentId && String(item.residentId) !== filters.residentId) continue;
    if (filters.sourceModules && !filters.sourceModules.includes(item.source.sourceModule))
      continue;
    const dueAt = item.schedule.effectiveDueAt || item.schedule.dueAt;
    if (filters.dueFrom && (!dueAt || Date.parse(dueAt) < Date.parse(filters.dueFrom))) continue;
    if (filters.dueTo && (!dueAt || Date.parse(dueAt) >= Date.parse(filters.dueTo))) continue;
    const due = getWorkItemDueTimeClassification(
      item,
      context,
      undefined,
      filters.now ? { now: () => filters.now! } : undefined,
    );
    const displayStatus = getWorkDisplayStatus(item, due);
    if (filters.displayStatuses && !filters.displayStatuses.includes(displayStatus)) continue;
    const resident = item.residentId
      ? refs.residents.find((candidate) => candidate.id === item.residentId)
      : undefined;
    if (
      resident &&
      (resident.lifecycleStatus !== "active" || resident.presenceStatus !== "in_home")
    )
      continue;
    const ward = item.wardId
      ? refs.wards.find((candidate) => candidate.id === item.wardId)
      : undefined;
    const handler = getWorkTypeHandler(item.workType);
    const sourceAllowed = auth.sourceCapabilities?.includes(handler.sourceCapability) ?? true;
    const active = !isHistory;
    const can = (capability: string) =>
      active && sourceAllowed && auth.capabilities.includes(capability);
    const row: WorkQueueItem & { rank: number } = {
      workItemId: id,
      workType: item.workType,
      title: item.title,
      summary: item.summary,
      resident: resident
        ? {
            id: resident.id,
            name: `${resident.firstName} ${resident.lastName}`,
            preferredName: resident.preferredName,
          }
        : undefined,
      ward: ward ? { id: ward.id, name: ward.name } : undefined,
      room: resident ? { id: resident.roomId, label: resident.roomNumber } : undefined,
      dueAt,
      displayStatus,
      dueDescription: getWorkStatusDescription(item, displayStatus, due),
      priority: item.priority,
      assignmentLabel:
        item.assignment.assignedRoleKey ||
        String(
          item.assignment.assignedStaffMemberId ||
            item.assignment.assignedUserAccountId ||
            (item.assignment.type === "ward_queue" ? "Ward queue" : "Unassigned"),
        ),
      route: handler.getRoute(item),
      allowedActions: {
        open: sourceAllowed && handler.getRoute(item) !== "#",
        start: can("work_item.start") && handler.supportsStart(item),
        complete: can("work_item.complete") && handler.supportsDirectCompletion(item),
        defer: can("work_item.defer") && handler.supportsDeferral(item),
        miss: can("work_item.mark_missed") && handler.supportsMissed(item),
        cancel: can("work_item.cancel") && handler.supportsCancellation(item),
        markNotApplicable:
          can("work_item.mark_not_applicable") && handler.supportsNotApplicable(item),
      },
      rank: getWorkStatusSortRank(displayStatus),
    };
    seen.add(id);
    rows.push(row);
  }
  return rows
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        { critical: 0, urgent: 1, important: 2, routine: 3 }[a.priority] -
          { critical: 0, urgent: 1, important: 2, routine: 3 }[b.priority] ||
        Date.parse(a.dueAt || "9999-12-31") - Date.parse(b.dueAt || "9999-12-31") ||
        String(a.ward?.id || "").localeCompare(String(b.ward?.id || "")) ||
        String(a.room?.label || "").localeCompare(String(b.room?.label || ""), undefined, {
          numeric: true,
        }) ||
        String(a.resident?.name || "").localeCompare(String(b.resident?.name || "")) ||
        a.workItemId.localeCompare(b.workItemId),
    )
    .map(({ rank: _rank, ...row }) => row);
}
