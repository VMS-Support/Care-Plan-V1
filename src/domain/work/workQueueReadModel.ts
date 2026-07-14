import type { Clock, DueTimeClassification, DueTimePolicy } from "@/lib/care/dueTime";
import { defaultDueTimePolicy, systemClock } from "@/lib/care/dueTime";
import type { OperationalContext } from "@/lib/care/types";
import { getWorkTypeHandler } from "./workHandlers";
import { getWorkExceptionReasonLabel } from "./workExceptionReasons";
import {
  getWorkDisplayStatus,
  getWorkItemDueTimeClassification,
  getWorkStatusDescription,
} from "./workStatus";
import type { WorkQueueReferenceData } from "./workQueue";
import type {
  WorkAuthContext,
  WorkItem,
  WorkPriority,
  WorkQueueFilters,
  WorkQueueItem,
  WorkTeam,
  WorkType,
} from "./workTypes";

export const WORK_QUEUE_READ_MODEL_VERSION = 1;
export type WorkQueueSectionKey =
  | "overdue"
  | "dueNow"
  | "nextHour"
  | "nextFourHours"
  | "today"
  | "thisShift";

export interface WorkQueueSummary {
  totalActive: number;
  overdue: number;
  dueNow: number;
  nextHour: number;
  nextFourHours: number;
  today: number;
  thisShift: number;
  inProgress: number;
  missed: number;
  deferred: number;
  unassigned: number;
  assignedToMe: number;
  assignedToRole: number;
  assignedToWard: number;
  assignedToTeam: number;
  declined: number;
  notApplicable: number;
  cancelled: number;
  followUpRequired: number;
  escalationRequired: number;
  byWorkType: Partial<Record<WorkType, number>>;
  byPriority: Partial<Record<WorkPriority, number>>;
  byWard: Record<string, number>;
}

export interface WorkQueueSection {
  count: number;
  items: WorkQueueItem[];
  hasMore: boolean;
  nextPageToken?: string;
}

export interface WorkQueueReadModel {
  generatedAt: string;
  schemaVersion: number;
  cacheKey: string;
  context: {
    nursingHomeId: string;
    wardSelectionMode: OperationalContext["wardSelectionMode"];
    wardIds: string[];
    shiftId?: string;
    shiftStart?: string;
    shiftEnd?: string;
    operationalDate: string;
    timezone: string;
    effectiveRoleKey: string;
  };
  summary: WorkQueueSummary;
  sections: Record<WorkQueueSectionKey, WorkQueueSection>;
}

export interface WorkQueuePagination {
  pageSize?: number;
  pageToken?: string;
}

export interface WorkQueueReadOptions {
  items: WorkItem[];
  references?: WorkQueueReferenceData;
  filters?: WorkQueueFilters;
  pagination?: WorkQueuePagination;
  policy?: DueTimePolicy;
  clock?: Clock;
  capabilityVersion?: string;
  sourceExists?: (item: WorkItem) => boolean;
  sourceIsActive?: (item: WorkItem) => boolean;
  residentAllowed?: (residentId: string, item: WorkItem) => boolean;
  sensitivityAllowed?: (item: WorkItem) => boolean;
  teams?: WorkTeam[];
  resolvePersonLabel?: (staffMemberId?: string, userAccountId?: string) => string | undefined;
}

interface ClassifiedRow {
  item: WorkItem;
  row: WorkQueueItem;
  due?: DueTimeClassification;
}

interface WorkQueueLookup {
  residents: Map<string, WorkQueueReferenceData["residents"][number]>;
  wards: Map<string, WorkQueueReferenceData["wards"][number]>;
  rooms: Map<string, NonNullable<WorkQueueReferenceData["rooms"]>[number]>;
  beds: Map<string, NonNullable<WorkQueueReferenceData["beds"]>[number]>;
}

const historyStatuses = new Set(["completed", "missed", "cancelled", "not_applicable"]);
const sourceViewCapability: Partial<Record<WorkType, string>> = {
  care_action: "care_action.view",
  assessment: "assessment.view",
  observation: "observation.view",
  appointment: "appointment.view",
  care_plan_review: "care_plan.view",
  referral: "referral.view",
  documentation: "documentation.view",
  handover_acknowledgement: "handover.view",
  general_task: "task.view",
};
const urgencyRank = { immediate: 0, urgent_review: 1, time_sensitive: 2, routine: 3 };
const priorityRank = { critical: 0, urgent: 1, important: 2, routine: 3 };

const requestedAssignment = (
  item: WorkItem,
  auth: WorkAuthContext,
  filter?: WorkQueueFilters["assignment"],
) => {
  if (!filter || filter === "all") return true;
  if (filter === "mine")
    return (
      (item.assignment.assignmentType === "person" &&
        item.assignment.assignmentStatus === "active" &&
        item.assignment.assignedUserAccountId === auth.userAccountId) ||
      (item.assignment.assignmentType === "person" &&
        item.assignment.assignmentStatus === "active" &&
        Boolean(auth.staffMemberId && item.assignment.assignedStaffMemberId === auth.staffMemberId))
    );
  if (filter === "role")
    return (
      !!item.assignment.assignedRoleKey && auth.roleKeys.includes(item.assignment.assignedRoleKey)
    );
  if (filter === "ward") return item.assignment.assignmentType === "ward";
  if (filter === "team") return item.assignment.assignmentType === "team";
  if (filter === "person") return item.assignment.assignmentType === "person";
  return item.assignment.assignmentType === "unassigned";
};

const assignmentVisible = (
  item: WorkItem,
  context: OperationalContext,
  auth: WorkAuthContext,
  options: WorkQueueReadOptions,
) => {
  const assignment = item.assignment;
  const manager = auth.capabilities.some((capability) =>
    ["work_assignment.view_all", "work_assignment.manage_home"].includes(capability),
  );
  const now = Date.parse(options.filters?.now || options.clock?.now() || new Date().toISOString());
  if (assignment.effectiveFrom && Date.parse(assignment.effectiveFrom) > now) return manager;
  if (assignment.effectiveTo && Date.parse(assignment.effectiveTo) <= now) return manager;
  if (assignment.targetShiftId && String(assignment.targetShiftId) !== String(context.shiftId))
    return manager;
  if (assignment.assignmentType === "unassigned") return true;
  if (assignment.assignmentType === "role")
    return (
      manager ||
      (auth.roleKeys.includes(String(assignment.assignedRoleKey)) &&
        String(context.effectiveRoleKey) === String(assignment.assignedRoleKey))
    );
  if (assignment.assignmentType === "ward")
    return manager || auth.authorisedWardIds.includes(String(assignment.assignedWardId));
  if (assignment.assignmentType === "person")
    return (
      manager ||
      assignment.assignedUserAccountId === auth.userAccountId ||
      Boolean(auth.staffMemberId && assignment.assignedStaffMemberId === auth.staffMemberId)
    );
  const team = options.teams?.find(
    (candidate) => String(candidate.id) === String(assignment.assignedTeamId),
  );
  return Boolean(
    manager ||
    (team?.active &&
      String(team.nursingHomeId) === String(context.nursingHomeId) &&
      (!item.wardId ||
        !team.wardIds?.length ||
        team.wardIds.map(String).includes(String(item.wardId))) &&
      auth.staffMemberId &&
      team.memberStaffMemberIds.map(String).includes(String(auth.staffMemberId))),
  );
};

const sourceAllowed = (item: WorkItem, auth: WorkAuthContext) => {
  if (!auth.capabilities.includes("work_item.view")) return false;
  const view = sourceViewCapability[item.workType];
  if (view && !auth.capabilities.includes(view) && !auth.sourceCapabilities?.includes(view))
    return false;
  return true;
};

export function isActiveActionableWork(
  item: WorkItem,
  context: OperationalContext,
  auth: WorkAuthContext,
  options: WorkQueueReadOptions,
  lookup?: WorkQueueLookup,
) {
  if (!isVisibleWork(item, context, auth, options, lookup)) return false;
  if (options.sourceIsActive && !options.sourceIsActive(item)) return false;
  if (!new Set(["scheduled", "in_progress", "deferred"]).has(item.persistedStatus)) return false;
  const resident = item.residentId
    ? lookup?.residents.get(String(item.residentId)) ||
      options.references?.residents.find(
        (candidate) => String(candidate.id) === String(item.residentId),
      )
    : undefined;
  if (resident && (resident.lifecycleStatus !== "active" || resident.presenceStatus !== "in_home"))
    return false;
  return true;
}

function isVisibleWork(
  item: WorkItem,
  context: OperationalContext,
  auth: WorkAuthContext,
  options: WorkQueueReadOptions,
  lookup?: WorkQueueLookup,
) {
  if (String(item.nursingHomeId) !== String(context.nursingHomeId)) return false;
  if (!auth.authorisedNursingHomeIds.includes(String(context.nursingHomeId))) return false;
  if (options.sourceExists && !options.sourceExists(item)) return false;
  if (!sourceAllowed(item, auth)) return false;
  if (options.sensitivityAllowed && !options.sensitivityAllowed(item)) return false;
  if (!assignmentVisible(item, context, auth, options)) return false;
  if (!requestedAssignment(item, auth, options.filters?.assignment)) return false;
  if (item.wardId) {
    const wardId = String(item.wardId);
    if (!context.wardIds.map(String).includes(wardId) || !auth.authorisedWardIds.includes(wardId))
      return false;
  }
  if (
    item.residentId &&
    options.residentAllowed &&
    !options.residentAllowed(String(item.residentId), item)
  )
    return false;
  const resident = item.residentId
    ? lookup?.residents.get(String(item.residentId)) ||
      options.references?.residents.find(
        (candidate) => String(candidate.id) === String(item.residentId),
      )
    : undefined;
  if (item.residentId && !resident) return false;
  if (resident?.facilityId && String(resident.facilityId) !== String(context.nursingHomeId))
    return false;
  if (item.wardId) {
    const ward = lookup?.wards.get(String(item.wardId));
    if (ward && String(ward.nursingHomeId) !== String(context.nursingHomeId)) return false;
  }
  if (item.roomId) {
    const room = lookup?.rooms.get(String(item.roomId));
    if (room?.nursingHomeId && String(room.nursingHomeId) !== String(context.nursingHomeId))
      return false;
    if (room?.wardId && item.wardId && String(room.wardId) !== String(item.wardId)) return false;
  }
  return true;
}

const matchesFilters = (item: WorkItem, filters: WorkQueueFilters = {}) => {
  const dueAt = item.schedule.effectiveDueAt || item.deferral?.deferredUntil || item.schedule.dueAt;
  if (filters.workTypes && !filters.workTypes.includes(item.workType)) return false;
  if (filters.persistedStatuses && !filters.persistedStatuses.includes(item.persistedStatus))
    return false;
  if (filters.priorities && !filters.priorities.includes(item.priority)) return false;
  if (
    filters.clinicalUrgencies &&
    (!item.clinicalUrgency || !filters.clinicalUrgencies.includes(item.clinicalUrgency))
  )
    return false;
  if (filters.wardIds && (!item.wardId || !filters.wardIds.includes(String(item.wardId))))
    return false;
  if (filters.residentId && String(item.residentId) !== filters.residentId) return false;
  if (filters.roomIds && (!item.roomId || !filters.roomIds.includes(String(item.roomId))))
    return false;
  if (filters.sourceModules && !filters.sourceModules.includes(item.source.sourceModule))
    return false;
  if (filters.sourceTypes && !filters.sourceTypes.includes(item.source.sourceType)) return false;
  if (
    filters.assignedRoleKeys &&
    (!item.assignment.assignedRoleKey ||
      !filters.assignedRoleKeys.includes(item.assignment.assignedRoleKey))
  )
    return false;
  if (
    filters.assignedWardIds &&
    (!item.assignment.assignedWardId ||
      !filters.assignedWardIds.includes(String(item.assignment.assignedWardId)))
  )
    return false;
  if (
    filters.assignedPersonIds &&
    ![item.assignment.assignedStaffMemberId, item.assignment.assignedUserAccountId]
      .filter(Boolean)
      .map(String)
      .some((value) => filters.assignedPersonIds!.includes(value))
  )
    return false;
  if (
    filters.assignedTeamIds &&
    (!item.assignment.assignedTeamId ||
      !filters.assignedTeamIds.includes(String(item.assignment.assignedTeamId)))
  )
    return false;
  if (
    filters.exceptionTypes &&
    (!item.latestException || !filters.exceptionTypes.includes(item.latestException.exceptionType))
  )
    return false;
  if (
    filters.followUpRequired !== undefined &&
    Boolean(item.latestException?.followUpRequired) !== filters.followUpRequired
  )
    return false;
  if (
    filters.escalationRequired !== undefined &&
    Boolean(item.latestException?.escalationRequired) !== filters.escalationRequired
  )
    return false;
  if (
    filters.origin &&
    (filters.origin === "rule_generated") !== Boolean(item.source.createdByRuleId)
  )
    return false;
  if (filters.dueFrom && (!dueAt || Date.parse(dueAt) < Date.parse(filters.dueFrom))) return false;
  if (filters.dueTo && (!dueAt || Date.parse(dueAt) >= Date.parse(filters.dueTo))) return false;
  return true;
};

const actionAllowed = (auth: WorkAuthContext, capability: string) =>
  auth.capabilities.includes(capability);

const toRow = (
  item: WorkItem,
  due: DueTimeClassification | undefined,
  auth: WorkAuthContext,
  lookup: WorkQueueLookup,
  options: WorkQueueReadOptions,
): WorkQueueItem => {
  const resident = item.residentId ? lookup.residents.get(String(item.residentId)) : undefined;
  const ward = item.wardId ? lookup.wards.get(String(item.wardId)) : undefined;
  const room = item.roomId ? lookup.rooms.get(String(item.roomId)) : undefined;
  const bed = item.bedId ? lookup.beds.get(String(item.bedId)) : undefined;
  const handler = getWorkTypeHandler(item.workType);
  const displayStatus = getWorkDisplayStatus(item, due);
  const effectiveDueAt =
    item.schedule.effectiveDueAt || item.deferral?.deferredUntil || item.schedule.dueAt;
  const active = !historyStatuses.has(item.persistedStatus);
  const can = (capability: string) => active && actionAllowed(auth, capability);
  const markMissed = can("work_item.mark_missed") && handler.supportsMissed(item);
  const team = options.teams?.find(
    (candidate) => String(candidate.id) === String(item.assignment.assignedTeamId),
  );
  const personLabel = options.resolvePersonLabel?.(
    item.assignment.assignedStaffMemberId && String(item.assignment.assignedStaffMemberId),
    item.assignment.assignedUserAccountId && String(item.assignment.assignedUserAccountId),
  );
  const roleLabel = item.assignment.assignedRoleKey
    ?.replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (value) => value.toUpperCase());
  const assignmentLabel =
    item.assignment.assignmentType === "role"
      ? `Role Queue · ${roleLabel || "Assigned role"}`
      : item.assignment.assignmentType === "ward"
        ? `Ward Queue · ${ward?.name || "Assigned ward"}`
        : item.assignment.assignmentType === "person"
          ? `Assigned to ${personLabel || "staff member"}`
          : item.assignment.assignmentType === "team"
            ? `Team · ${team?.name || "Assigned team"}`
            : "Unassigned";
  return {
    workItemId: String(item.id),
    workType: item.workType,
    title: item.title,
    summary: item.summary,
    resident: resident
      ? {
          id: resident.id,
          name: `${resident.firstName} ${resident.lastName}`,
          displayName: `${resident.firstName} ${resident.lastName}`,
          preferredName: resident.preferredName,
        }
      : undefined,
    nursingHomeId: String(item.nursingHomeId),
    ward: ward ? { id: String(ward.id), name: ward.name } : undefined,
    room: item.roomId
      ? { id: String(item.roomId), label: room?.label || resident?.roomNumber }
      : undefined,
    bed: item.bedId ? { id: String(item.bedId), label: bed?.label } : undefined,
    originalDueAt: item.schedule.originalDueAt,
    effectiveDueAt,
    dueAt: effectiveDueAt,
    displayStatus,
    dueDescription: getWorkStatusDescription(item, displayStatus, due),
    priority: item.priority,
    clinicalUrgency: item.clinicalUrgency,
    source: {
      sourceType: item.source.sourceType,
      sourceModule: item.source.sourceModule,
      sourceEntityType: item.source.sourceEntityType,
      sourceEntityId: item.source.sourceEntityId,
      sourceOccurrenceId: item.source.sourceOccurrenceId,
      parentEntityType: item.source.parentEntityType,
      parentEntityId: item.source.parentEntityId,
      route: item.source.route,
    },
    assignment: { assignmentType: item.assignment.assignmentType, label: assignmentLabel },
    exception: item.latestException
      ? {
          exceptionType: item.latestException.exceptionType,
          reasonCode: item.latestException.reasonCode,
          reasonLabel: getWorkExceptionReasonLabel(item.latestException.reasonCode),
          reasonText: item.latestException.reasonText,
          effectiveAt: item.latestException.effectiveAt,
          recordedAt: item.latestException.recordedAt,
          recordedByUserAccountId: item.latestException.recordedByUserAccountId
            ? String(item.latestException.recordedByUserAccountId)
            : undefined,
          recordedByStaffMemberId: item.latestException.recordedByStaffMemberId
            ? String(item.latestException.recordedByStaffMemberId)
            : undefined,
          followUpRequired: item.latestException.followUpRequired,
          escalationRequired: item.latestException.escalationRequired,
        }
      : undefined,
    assignmentLabel,
    route: handler.getRoute(item),
    allowedActions: {
      open: handler.getRoute(item) !== "#",
      start: can("work_item.start") && handler.supportsStart(item),
      complete:
        item.workType === "care_action"
          ? can("care_action.complete")
          : can("work_item.complete") && handler.supportsDirectCompletion(item),
      defer:
        item.workType === "care_action"
          ? can("care_action.defer")
          : can("work_item.defer") && handler.supportsDeferral(item),
      miss: markMissed,
      markMissed,
      cancel: can("work_item.cancel") && handler.supportsCancellation(item),
      markNotApplicable:
        can("work_item.mark_not_applicable") && handler.supportsNotApplicable(item),
    },
  };
};

const compareRows = (section: WorkQueueSectionKey) => (a: ClassifiedRow, b: ClassifiedRow) => {
  const urgency =
    urgencyRank[a.item.clinicalUrgency || "routine"] -
    urgencyRank[b.item.clinicalUrgency || "routine"];
  const priority = priorityRank[a.item.priority] - priorityRank[b.item.priority];
  const dueA = Date.parse(a.row.effectiveDueAt || "9999-12-31");
  const dueB = Date.parse(b.row.effectiveDueAt || "9999-12-31");
  return (
    urgency ||
    priority ||
    (section === "overdue" ? dueA - dueB : dueA - dueB) ||
    String(a.row.ward?.id || "").localeCompare(String(b.row.ward?.id || "")) ||
    String(a.row.room?.label || "").localeCompare(String(b.row.room?.label || ""), undefined, {
      numeric: true,
    }) ||
    String(a.row.resident?.displayName || "").localeCompare(
      String(b.row.resident?.displayName || ""),
    ) ||
    a.row.workItemId.localeCompare(b.row.workItemId)
  );
};

const sectionMatches = (section: WorkQueueSectionKey, value: ClassifiedRow) => {
  if (!value.due) return false;
  if (section === "overdue") return value.due.isOverdue;
  if (section === "dueNow") return value.due.isDueNow;
  if (section === "nextHour") return value.due.isInNextHour;
  if (section === "nextFourHours") return value.due.isInNextFourHours;
  if (section === "today") return value.due.isDueToday;
  return value.due.isDueThisShift;
};

const page = (rows: ClassifiedRow[], pagination: WorkQueuePagination = {}): WorkQueueSection => {
  const size = Math.min(Math.max(pagination.pageSize || 100, 1), 500);
  const match = /^v1:(\d+)$/.exec(pagination.pageToken || "v1:0");
  if (!match) throw new Error("Invalid Work Queue page token.");
  const offset = Number(match[1]);
  const items = rows.slice(offset, offset + size).map((value) => value.row);
  const next = offset + items.length;
  return {
    count: rows.length,
    items,
    hasMore: next < rows.length,
    nextPageToken: next < rows.length ? `v1:${next}` : undefined,
  };
};

export function createWorkQueueCacheKey(
  context: OperationalContext,
  auth: WorkAuthContext,
  filters: WorkQueueFilters = {},
  pagination: WorkQueuePagination = {},
  capabilityVersion = "1",
) {
  return JSON.stringify({
    schemaVersion: WORK_QUEUE_READ_MODEL_VERSION,
    nursingHomeId: String(context.nursingHomeId),
    wardIds: context.wardIds.map(String).sort(),
    wardSelectionMode: context.wardSelectionMode,
    shiftId: String(context.shiftId),
    operationalDate: context.operationalDate,
    timezone: context.timezone,
    effectiveRoleKey: context.effectiveRoleKey,
    capabilityVersion,
    filters,
    pagination,
    userAccountId: auth.userAccountId,
  });
}

export function buildWorkQueueReadModel(
  context: OperationalContext,
  auth: WorkAuthContext,
  options: WorkQueueReadOptions,
): WorkQueueReadModel {
  const clock = options.clock || systemClock;
  const policy = options.policy || defaultDueTimePolicy;
  const mode = options.filters?.mode || "active";
  const deduplicated = new Map<string, WorkItem>();
  for (const item of options.items)
    if (!deduplicated.has(String(item.id))) deduplicated.set(String(item.id), item);
  const lookup: WorkQueueLookup = {
    residents: new Map(
      (options.references?.residents || []).map((value) => [String(value.id), value]),
    ),
    wards: new Map((options.references?.wards || []).map((value) => [String(value.id), value])),
    rooms: new Map((options.references?.rooms || []).map((value) => [String(value.id), value])),
    beds: new Map((options.references?.beds || []).map((value) => [String(value.id), value])),
  };
  const classified: ClassifiedRow[] = [];
  const visible: WorkItem[] = [];
  for (const item of deduplicated.values()) {
    const isHistory = historyStatuses.has(item.persistedStatus);
    if (!isVisibleWork(item, context, auth, options, lookup)) continue;
    if (!matchesFilters(item, options.filters)) continue;
    visible.push(item);
    if (mode === "active" && !isActiveActionableWork(item, context, auth, options, lookup))
      continue;
    if (mode === "history" && !isHistory) continue;
    const due = getWorkItemDueTimeClassification(item, context, policy, clock);
    const displayStatus = getWorkDisplayStatus(item, due);
    if (
      options.filters?.displayStatuses &&
      !options.filters.displayStatuses.includes(displayStatus)
    )
      continue;
    classified.push({ item, due, row: toRow(item, due, auth, lookup, options) });
  }
  const sectionKeys: WorkQueueSectionKey[] = [
    "overdue",
    "dueNow",
    "nextHour",
    "nextFourHours",
    "today",
    "thisShift",
  ];
  const sectionRows = Object.fromEntries(
    sectionKeys.map((section) => [
      section,
      options.filters?.dueSections && !options.filters.dueSections.includes(section)
        ? []
        : classified.filter((value) => sectionMatches(section, value)).sort(compareRows(section)),
    ]),
  ) as Record<WorkQueueSectionKey, ClassifiedRow[]>;
  const sections = Object.fromEntries(
    sectionKeys.map((section) => [section, page(sectionRows[section], options.pagination)]),
  ) as Record<WorkQueueSectionKey, WorkQueueSection>;
  const countBy = <T extends string>(values: T[]) =>
    values.reduce<Partial<Record<T, number>>>((result, value) => {
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
  return {
    generatedAt: clock.now(),
    schemaVersion: WORK_QUEUE_READ_MODEL_VERSION,
    cacheKey: createWorkQueueCacheKey(
      context,
      auth,
      options.filters,
      options.pagination,
      options.capabilityVersion,
    ),
    context: {
      nursingHomeId: String(context.nursingHomeId),
      wardSelectionMode: context.wardSelectionMode,
      wardIds: context.wardIds.map(String),
      shiftId: String(context.shiftId),
      shiftStart: context.shiftStartAt,
      shiftEnd: context.shiftEndAt,
      operationalDate: context.operationalDate,
      timezone: context.timezone,
      effectiveRoleKey: context.effectiveRoleKey,
    },
    summary: {
      totalActive: classified.length,
      overdue: sections.overdue.count,
      dueNow: sections.dueNow.count,
      nextHour: sections.nextHour.count,
      nextFourHours: sections.nextFourHours.count,
      today: sections.today.count,
      thisShift: sections.thisShift.count,
      inProgress: classified.filter((value) => value.item.persistedStatus === "in_progress").length,
      missed: visible.filter((value) => value.persistedStatus === "missed").length,
      deferred: classified.filter((value) => value.item.persistedStatus === "deferred").length,
      unassigned: classified.filter(
        (value) => value.item.assignment.assignmentType === "unassigned",
      ).length,
      assignedToMe: classified.filter(
        (value) =>
          value.item.assignment.assignmentType === "person" &&
          value.item.assignment.assignmentStatus === "active" &&
          (value.item.assignment.assignedUserAccountId === auth.userAccountId ||
            Boolean(
              auth.staffMemberId &&
              value.item.assignment.assignedStaffMemberId === auth.staffMemberId,
            )),
      ).length,
      assignedToRole: classified.filter((value) => value.item.assignment.assignmentType === "role")
        .length,
      assignedToWard: classified.filter((value) => value.item.assignment.assignmentType === "ward")
        .length,
      assignedToTeam: classified.filter((value) => value.item.assignment.assignmentType === "team")
        .length,
      declined: visible.filter((value) => value.latestException?.exceptionType === "declined")
        .length,
      notApplicable: visible.filter((value) => value.persistedStatus === "not_applicable").length,
      cancelled: visible.filter((value) => value.persistedStatus === "cancelled").length,
      followUpRequired: visible.filter((value) => value.latestException?.followUpRequired).length,
      escalationRequired: visible.filter((value) => value.latestException?.escalationRequired)
        .length,
      byWorkType: countBy(classified.map((value) => value.item.workType)),
      byPriority: countBy(classified.map((value) => value.item.priority)),
      byWard: classified.reduce<Record<string, number>>((result, value) => {
        const ward = String(value.item.wardId || "home_wide");
        result[ward] = (result[ward] || 0) + 1;
        return result;
      }, {}),
    },
    sections,
  };
}

export async function getWorkQueueForOperationalContext(
  operationalContext: OperationalContext,
  authorizationContext: WorkAuthContext,
  options: WorkQueueReadOptions,
) {
  return buildWorkQueueReadModel(operationalContext, authorizationContext, options);
}

export async function getWorkQueueSection(
  section: WorkQueueSectionKey,
  operationalContext: OperationalContext,
  authorizationContext: WorkAuthContext,
  filters: WorkQueueFilters,
  pagination: WorkQueuePagination,
  options: Omit<WorkQueueReadOptions, "filters" | "pagination">,
) {
  return buildWorkQueueReadModel(operationalContext, authorizationContext, {
    ...options,
    filters,
    pagination,
  }).sections[section];
}
