import type {
  Assessment,
  ClinicalObservation,
  OperationalContext,
  ProblemIntervention,
  ProblemInterventionLog,
  Resident,
  Task,
} from "./types";
import type { NursingHomeId, ResidentId, WardId } from "@/types/entityIds";
import { getShiftDateRange } from "./operationalContext";

export type PersistedWorkStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "missed"
  | "deferred"
  | "cancelled"
  | "not_applicable"
  | "discontinued";

export type ScheduledWorkType =
  | "care_action"
  | "task"
  | "observation"
  | "assessment"
  | "appointment"
  | "care_plan_review"
  | "handover_acknowledgement"
  | "incident_follow_up"
  | "other";

export interface ScheduledWorkReference {
  id: string;
  workType: ScheduledWorkType;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  residentId?: ResidentId | string;
  scheduledStart?: string;
  dueAt: string;
  scheduledEnd?: string;
  persistedStatus: PersistedWorkStatus;
  completedAt?: string;
  effectiveCompletedAt?: string;
  deferredUntil?: string;
  cancelledAt?: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  clinicalPriority?: "critical" | "high" | "normal" | "low" | string;
}

export interface DueTimePolicy {
  dueNowEarlyMinutes: number;
  dueNowLateMinutes: number;
  completedLateToleranceMinutes: number;
  missedAfterMinutes?: number;
  useShiftBoundaryForMissed: boolean;
  useEndOfDayForMissed: boolean;
  nextHourMinutes: number;
  nextFourHoursMinutes: number;
}

export type DueTimeStatus =
  | "not_scheduled"
  | "upcoming"
  | "next_hour"
  | "next_four_hours"
  | "due_this_shift"
  | "due_today"
  | "due_now"
  | "overdue"
  | "missed"
  | "completed_on_time"
  | "completed_late"
  | "deferred"
  | "cancelled"
  | "not_applicable"
  | "discontinued";

export interface DueTimeClassification {
  primaryStatus: DueTimeStatus;
  isOverdue: boolean;
  isDueNow: boolean;
  isInNextHour: boolean;
  isInNextFourHours: boolean;
  isDueThisShift: boolean;
  isDueToday: boolean;
  isMissed: boolean;
  isCompletedLate: boolean;
  minutesUntilDue?: number;
  minutesOverdue?: number;
  minutesCompletedLate?: number;
  shiftId?: string;
  operationalDate: string;
  timezone: string;
  explanation: string;
}

export interface Clock {
  now(): string;
}

export const systemClock: Clock = {
  now: () => new Date().toISOString(),
};

export const defaultDueTimePolicy: DueTimePolicy = {
  dueNowEarlyMinutes: 30,
  dueNowLateMinutes: 0,
  completedLateToleranceMinutes: 0,
  useShiftBoundaryForMissed: false,
  useEndOfDayForMissed: false,
  nextHourMinutes: 60,
  nextFourHoursMinutes: 240,
};

const inactiveStatuses = new Set<PersistedWorkStatus>(["completed", "cancelled", "not_applicable", "discontinued"]);

const minutesBetween = (fromMs: number, toMs: number) => Math.floor((toMs - fromMs) / 60000);

export function getLocalDateKey(instant: string | Date, timezone: string) {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function localDayRangeUtc(localDate: string, timezone: string) {
  const approximateNoon = new Date(`${localDate}T12:00:00.000Z`);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(approximateNoon);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offsetMs = asIfUtc - approximateNoon.getTime();
  const start = new Date(Date.parse(`${localDate}T00:00:00.000Z`) - offsetMs);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { startMs: start.getTime(), endMs: end.getTime() };
}

const isActive = (workItem: ScheduledWorkReference, dueMs: number, nowMs: number) => {
  if (inactiveStatuses.has(workItem.persistedStatus)) return false;
  if (workItem.persistedStatus === "deferred" && workItem.deferredUntil && Date.parse(workItem.deferredUntil) > nowMs) return true;
  return Number.isFinite(dueMs);
};

export function classifyDueTime(
  workItem: ScheduledWorkReference,
  context: OperationalContext,
  policy: DueTimePolicy = defaultDueTimePolicy,
  clock: Clock = systemClock,
): DueTimeClassification {
  const now = clock.now();
  const nowMs = Date.parse(now);
  const effectiveDueAt = workItem.deferredUntil && Date.parse(workItem.deferredUntil) > nowMs ? workItem.deferredUntil : workItem.dueAt;
  const dueMs = Date.parse(effectiveDueAt);
  const completedAt = workItem.effectiveCompletedAt || workItem.completedAt;
  const completedMs = completedAt ? Date.parse(completedAt) : Number.NaN;
  const shiftRange = getShiftDateRange(
    { id: context.shiftId as any, nursingHomeId: context.nursingHomeId, label: context.shiftLabel, startsAt: context.shiftStartAt.slice(11, 16), endsAt: context.shiftEndAt.slice(11, 16), active: true, sortOrder: 0 },
    context.operationalDate,
  );
  const shiftStartMs = Date.parse(context.shiftStartAt || shiftRange.start);
  const shiftEndMs = Date.parse(context.shiftEndAt || shiftRange.end);
  const day = localDayRangeUtc(context.operationalDate, context.timezone);
  const minutesUntilDue = Number.isFinite(dueMs) ? minutesBetween(nowMs, dueMs) : undefined;
  const minutesOverdue = Number.isFinite(dueMs) && dueMs < nowMs ? minutesBetween(dueMs, nowMs) : undefined;
  const isCompletedLate = workItem.persistedStatus === "completed" && Number.isFinite(completedMs) && completedMs > dueMs + policy.completedLateToleranceMinutes * 60000;
  const minutesCompletedLate = isCompletedLate ? minutesBetween(dueMs, completedMs) : undefined;
  const active = isActive(workItem, dueMs, nowMs);
  const isDeferred = workItem.persistedStatus === "deferred" && !!workItem.deferredUntil && Date.parse(workItem.deferredUntil) > nowMs;
  const isDueNow =
    active &&
    dueMs >= nowMs - policy.dueNowLateMinutes * 60000 &&
    dueMs <= nowMs + policy.dueNowEarlyMinutes * 60000;
  const isInNextHour = active && dueMs > nowMs && dueMs <= nowMs + policy.nextHourMinutes * 60000;
  const isInNextFourHours = active && dueMs > nowMs && dueMs <= nowMs + policy.nextFourHoursMinutes * 60000;
  const isDueThisShift = active && dueMs >= shiftStartMs && dueMs < shiftEndMs;
  const isDueToday = active && dueMs >= day.startMs && dueMs < day.endMs;
  const isMissed = workItem.persistedStatus === "missed";
  const isOverdue = active && !isMissed && !isDueNow && dueMs < nowMs;

  let primaryStatus: DueTimeStatus = "upcoming";
  if (!Number.isFinite(dueMs)) primaryStatus = "not_scheduled";
  else if (workItem.persistedStatus === "cancelled") primaryStatus = "cancelled";
  else if (workItem.persistedStatus === "not_applicable") primaryStatus = "not_applicable";
  else if (workItem.persistedStatus === "discontinued") primaryStatus = "discontinued";
  else if (isMissed) primaryStatus = "missed";
  else if (workItem.persistedStatus === "completed") primaryStatus = isCompletedLate ? "completed_late" : "completed_on_time";
  else if (isDeferred) primaryStatus = "deferred";
  else if (isOverdue) primaryStatus = "overdue";
  else if (isDueNow) primaryStatus = "due_now";
  else if (isInNextHour) primaryStatus = "next_hour";
  else if (isInNextFourHours) primaryStatus = "next_four_hours";
  else if (isDueThisShift) primaryStatus = "due_this_shift";
  else if (isDueToday) primaryStatus = "due_today";

  return {
    primaryStatus,
    isOverdue,
    isDueNow,
    isInNextHour,
    isInNextFourHours,
    isDueThisShift,
    isDueToday,
    isMissed,
    isCompletedLate,
    minutesUntilDue,
    minutesOverdue,
    minutesCompletedLate,
    shiftId: context.shiftId,
    operationalDate: context.operationalDate,
    timezone: context.timezone,
    explanation: getDueStatusDescription({
      primaryStatus,
      isOverdue,
      isDueNow,
      isInNextHour,
      isInNextFourHours,
      isDueThisShift,
      isDueToday,
      isMissed,
      isCompletedLate,
      minutesUntilDue,
      minutesOverdue,
      minutesCompletedLate,
      shiftId: context.shiftId,
      operationalDate: context.operationalDate,
      timezone: context.timezone,
      explanation: "",
    }),
  };
}

export const isOverdue = (classification: DueTimeClassification) => classification.isOverdue;
export const isDueNow = (classification: DueTimeClassification) => classification.isDueNow;
export const isWithinNextHour = (classification: DueTimeClassification) => classification.isInNextHour;
export const isWithinNextFourHours = (classification: DueTimeClassification) => classification.isInNextFourHours;
export const isDueThisShift = (classification: DueTimeClassification) => classification.isDueThisShift;
export const isDueToday = (classification: DueTimeClassification) => classification.isDueToday;
export const isMissed = (classification: DueTimeClassification) => classification.isMissed;
export const isCompletedLate = (classification: DueTimeClassification) => classification.isCompletedLate;

export function getDueStatusLabel(classification: DueTimeClassification) {
  if (classification.primaryStatus === "overdue") return `${classification.minutesOverdue ?? 0}m overdue`;
  if (classification.primaryStatus === "due_now") return "Due Now";
  if (classification.primaryStatus === "next_hour" || classification.primaryStatus === "next_four_hours") return `Due in ${classification.minutesUntilDue ?? 0}m`;
  if (classification.primaryStatus === "due_this_shift") return "Due This Shift";
  if (classification.primaryStatus === "due_today") return "Due Today";
  if (classification.primaryStatus === "missed") return "Missed";
  if (classification.primaryStatus === "completed_late") return `Completed ${classification.minutesCompletedLate ?? 0}m late`;
  if (classification.primaryStatus === "completed_on_time") return "Completed";
  if (classification.primaryStatus === "deferred") return "Deferred";
  if (classification.primaryStatus === "cancelled") return "Cancelled";
  if (classification.primaryStatus === "discontinued") return "Discontinued";
  return "Upcoming";
}

export function getDueStatusDescription(classification: DueTimeClassification) {
  if (classification.primaryStatus === "overdue") return `Overdue by ${classification.minutesOverdue ?? 0} minutes.`;
  if (classification.primaryStatus === "due_now") return classification.minutesUntilDue && classification.minutesUntilDue > 0 ? `Due in ${classification.minutesUntilDue} minutes.` : "Due now.";
  if (classification.primaryStatus === "completed_late") return `Completed ${classification.minutesCompletedLate ?? 0} minutes late.`;
  if (classification.primaryStatus === "missed") return "Missed by recorded workflow outcome.";
  return getDueStatusLabel(classification);
}

export function getDueStatusBadge(classification: DueTimeClassification) {
  if (classification.isOverdue || classification.isMissed) return "destructive";
  if (classification.isDueNow || classification.isInNextHour) return "warning";
  if (classification.isCompletedLate) return "secondary";
  return "outline";
}

const priorityRank: Record<string, number> = { critical: 0, high: 1, normal: 2, medium: 2, low: 3 };
const statusRank: Record<DueTimeStatus, number> = {
  missed: 0,
  overdue: 1,
  due_now: 2,
  next_hour: 3,
  next_four_hours: 4,
  due_this_shift: 5,
  due_today: 6,
  upcoming: 7,
  deferred: 8,
  completed_late: 9,
  completed_on_time: 10,
  cancelled: 11,
  discontinued: 12,
  not_applicable: 13,
  not_scheduled: 14,
};

export function sortScheduledWorkByUrgency<T extends { work: ScheduledWorkReference; classification: DueTimeClassification; resident?: Resident }>(items: T[]) {
  return [...items].sort((a, b) => {
    const status = statusRank[a.classification.primaryStatus] - statusRank[b.classification.primaryStatus];
    if (status) return status;
    const priority = (priorityRank[a.work.clinicalPriority || "normal"] ?? 2) - (priorityRank[b.work.clinicalPriority || "normal"] ?? 2);
    if (priority) return priority;
    const due = Date.parse(a.work.dueAt) - Date.parse(b.work.dueAt);
    if (due) return due;
    const ward = String(a.work.wardId || "").localeCompare(String(b.work.wardId || ""));
    if (ward) return ward;
    const room = String(a.resident?.roomNumber || "").localeCompare(String(b.resident?.roomNumber || ""), undefined, { numeric: true });
    if (room) return room;
    const name = `${a.resident?.lastName || ""} ${a.resident?.firstName || ""}`.localeCompare(`${b.resident?.lastName || ""} ${b.resident?.firstName || ""}`);
    return name || a.work.id.localeCompare(b.work.id);
  });
}

export function adaptTaskToScheduledWork(task: Task, resident?: Resident): ScheduledWorkReference {
  const dueAt = task.dueDate.includes("T") ? task.dueDate : `${task.dueDate}T${task.appointmentTime || "23:59"}:00.000`;
  return {
    id: task.id,
    workType: "task",
    nursingHomeId: task.facilityId || resident?.facilityId || "",
    wardId: resident?.wardId,
    residentId: task.residentId,
    dueAt,
    persistedStatus: task.status === "completed" ? "completed" : task.status === "deleted" ? "cancelled" : task.status === "overdue" ? "scheduled" : "scheduled",
    completedAt: task.completedAt,
    cancelledAt: task.cancelledAt || task.deletedAt,
    sourceEntityType: "Task",
    sourceEntityId: task.id,
    clinicalPriority: task.priority,
  };
}

export function adaptAssessmentToScheduledWork(assessment: Assessment, resident?: Resident): ScheduledWorkReference {
  return {
    id: assessment.id,
    workType: "assessment",
    nursingHomeId: assessment.facilityId || resident?.facilityId || "",
    wardId: resident?.wardId,
    residentId: assessment.residentId,
    dueAt: assessment.nextReassessmentDate || assessment.dueDate || assessment.createdAt,
    persistedStatus: assessment.status === "completed" || assessment.status === "approved" ? "completed" : assessment.status === "archived" ? "cancelled" : "scheduled",
    completedAt: assessment.completedAt || assessment.updatedAt,
    sourceEntityType: "Assessment",
    sourceEntityId: assessment.id,
    clinicalPriority: assessment.priority,
  };
}

export function adaptObservationToScheduledWork(observation: ClinicalObservation, resident?: Resident): ScheduledWorkReference {
  return {
    id: observation.id,
    workType: "observation",
    nursingHomeId: observation.facilityId || resident?.facilityId || "",
    wardId: resident?.wardId,
    residentId: observation.residentId,
    dueAt: observation.recordedAt || `${observation.date}T${observation.time}:00.000`,
    persistedStatus: observation.deletedAt ? "cancelled" : "completed",
    completedAt: observation.recordedAt,
    effectiveCompletedAt: observation.recordedAt,
    cancelledAt: observation.deletedAt,
    sourceEntityType: "ClinicalObservation",
    sourceEntityId: observation.id,
  };
}

export function adaptCareActionToScheduledWork(
  intervention: ProblemIntervention,
  dueAt: Date,
  resident?: Resident,
  completion?: ProblemInterventionLog,
): ScheduledWorkReference {
  return {
    id: intervention.id,
    workType: "care_action",
    nursingHomeId: intervention.facilityId || resident?.facilityId || "",
    wardId: resident?.wardId,
    residentId: intervention.residentId,
    scheduledStart: `${intervention.startDate}T08:00:00.000`,
    dueAt: dueAt.toISOString(),
    persistedStatus:
      intervention.status === "completed"
        ? "completed"
        : intervention.status === "cancelled"
          ? "cancelled"
          : intervention.status === "discontinued"
            ? "discontinued"
            : "scheduled",
    completedAt: intervention.completedAt || (completion ? `${completion.date}T${completion.time || "00:00"}:00.000` : undefined),
    effectiveCompletedAt: completion ? `${completion.date}T${completion.time || "00:00"}:00.000` : intervention.completedAt,
    cancelledAt: intervention.cancelledAt,
    sourceEntityType: "ProblemIntervention",
    sourceEntityId: intervention.id,
  };
}
