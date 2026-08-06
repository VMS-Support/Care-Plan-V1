export type UnifiedWorkType =
  | "WORK_ORDER"
  | "PLANNED_MAINTENANCE"
  | "SAFETY_INSPECTION"
  | "CLEANING_TASK"
  | "QUALITY_INSPECTION"
  | "ROOM_READINESS"
  | "REINSPECTION"
  | "CORRECTIVE_ACTION";
export type UnifiedWorkGroup =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING"
  | "FAILED"
  | "AWAITING_EVIDENCE"
  | "AWAITING_VERIFICATION"
  | "REINSPECTION_REQUIRED"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";
export type UnifiedDueState =
  | "DUE_NOW"
  | "DUE_TODAY"
  | "DUE_SOON"
  | "OVERDUE"
  | "FUTURE"
  | "NO_DUE_DATE"
  | "COMPLETED";
export interface UnifiedWorkItem {
  id: string;
  sourceId: string;
  sourceType: UnifiedWorkType;
  reference: string;
  workType: string;
  title: string;
  shortDescription?: string;
  nursingHomeId: string;
  nursingHomeName: string;
  location?: string;
  roomId?: string;
  bedId?: string;
  assetId?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  assignedTeamId?: string;
  contractorId?: string;
  dueAt?: string;
  createdAt: string;
  completedAt?: string;
  priority: string;
  risk?: string;
  sourceStatus: string;
  status: UnifiedWorkGroup;
  dueState: UnifiedDueState;
  ageDays: number;
  overdueDays: number;
  progressCurrent?: number;
  progressTotal?: number;
  requiresEvidence: boolean;
  evidenceComplete: boolean;
  requiresVerification: boolean;
  verificationStatus?: string;
  requiresReinspection: boolean;
  reinspectionStatus?: string;
  hasBlocker: boolean;
  blockerSummary?: string;
  sourceRoute: string;
  primaryAction: string;
  lastUpdatedAt: string;
}
const terminal = new Set([
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
  "ARCHIVED",
  "PASSED",
  "READY",
  "SKIPPED",
]);
const waiting = new Set([
  "ON_HOLD",
  "AWAITING_PARTS",
  "AWAITING_CONTRACTOR",
  "AWAITING_ACCESS",
  "WAITING",
  "PAUSED",
]);
export function unifiedStatus(
  status: string,
  options: {
    assigned?: boolean;
    verification?: boolean;
    reinspection?: boolean;
    evidence?: boolean;
  } = {},
): UnifiedWorkGroup {
  const value = String(status || "OPEN").toUpperCase();
  if (["ARCHIVED"].includes(value)) return "ARCHIVED";
  if (["CANCELLED", "SKIPPED"].includes(value)) return "CANCELLED";
  if (["COMPLETED", "CLOSED", "PASSED", "READY"].includes(value) && !options.verification)
    return "COMPLETED";
  if (
    options.verification ||
    ["AWAITING_VERIFICATION", "VERIFICATION_REQUIRED", "AWAITING_SUPERVISOR_SIGN_OFF"].includes(
      value,
    )
  )
    return "AWAITING_VERIFICATION";
  if (options.reinspection || ["AWAITING_REINSPECTION", "REINSPECTION_REQUIRED"].includes(value))
    return "REINSPECTION_REQUIRED";
  if (options.evidence || value === "AWAITING_EVIDENCE") return "AWAITING_EVIDENCE";
  if (["FAILED", "REJECTED", "FAILED_INSPECTION"].includes(value)) return "FAILED";
  if (waiting.has(value)) return "WAITING";
  if (["IN_PROGRESS", "ACCEPTED", "STARTED", "REOPENED"].includes(value)) return "IN_PROGRESS";
  if (options.assigned || value === "ASSIGNED") return "ASSIGNED";
  return "OPEN";
}
export function unifiedDueState(
  dueAt: string | undefined,
  status: UnifiedWorkGroup,
  now = new Date(),
): UnifiedDueState {
  if (["COMPLETED", "CANCELLED", "ARCHIVED"].includes(status)) return "COMPLETED";
  if (!dueAt) return "NO_DUE_DATE";
  const due = new Date(dueAt.length === 10 ? `${dueAt}T23:59:59` : dueAt);
  if (due.getTime() < now.getTime()) return "OVERDUE";
  const today = now.toISOString().slice(0, 10),
    date = due.toISOString().slice(0, 10);
  if (date === today) return due.getTime() - now.getTime() <= 2 * 3600000 ? "DUE_NOW" : "DUE_TODAY";
  if (due.getTime() - now.getTime() <= 48 * 3600000) return "DUE_SOON";
  return "FUTURE";
}
const days = (from: string, to: Date) =>
  Math.max(0, Math.floor((to.getTime() - new Date(from).getTime()) / 86400000));
function make(
  raw: any,
  type: UnifiedWorkType,
  label: string,
  homeNames: Map<string, string>,
  now: Date,
): UnifiedWorkItem {
  const sourceStatus = String(raw.status || raw.readinessStatus || "OPEN");
  const verification =
    Boolean(
      raw.verificationRequired &&
      !["VERIFIED", "APPROVED"].includes(raw.verificationStatus || raw.supervisorSignOffResult),
    ) || Boolean(raw.supervisorSignOffRequired && raw.supervisorSignOffResult !== "APPROVED");
  const reinspection =
    Boolean(
      raw.reinspectionRequired && !["PASSED", "COMPLETED"].includes(raw.reinspectionStatus || ""),
    ) || ["AWAITING_REINSPECTION"].includes(sourceStatus);
  const status = unifiedStatus(sourceStatus, {
    assigned: Boolean(raw.assignedUserId || raw.assignedTeamId || raw.ownerUserId),
    verification,
    reinspection,
    evidence: sourceStatus === "AWAITING_EVIDENCE",
  });
  const dueAt = raw.dueAt || raw.dueDate || raw.scheduledDate || raw.inspectionDate;
  const dueState = unifiedDueState(dueAt, status, now);
  const homeId = String(raw.homeId || raw.facilityId || raw.nursingHomeId || "");
  const route = sourceRoute(type, raw);
  return {
    id: `${type}:${raw.id}`,
    sourceId: String(raw.id),
    sourceType: type,
    reference: String(
      raw.workOrderNumber ||
        raw.occurrenceNumber ||
        raw.inspectionNumber ||
        raw.taskNumber ||
        raw.referenceNumber ||
        raw.id,
    ),
    workType: label,
    title: String(raw.title || raw.name || raw.scheduleName || raw.triggerType || label),
    shortDescription: raw.description || raw.issueDescription,
    nursingHomeId: homeId,
    nursingHomeName: homeNames.get(homeId) || "Nursing Home",
    location: raw.locationLabel || raw.exactLocation || raw.roomName,
    roomId: raw.roomId,
    bedId: raw.bedId,
    assetId: raw.assetId,
    assignedUserId: raw.assignedUserId || raw.ownerUserId,
    assignedUserName: raw.assignedUserName || raw.ownerName,
    assignedTeamId: raw.assignedTeamId,
    contractorId: raw.contractorId,
    dueAt,
    createdAt: raw.createdAt || raw.reportedAt || dueAt || now.toISOString(),
    completedAt: raw.completedAt,
    priority: String(raw.priority || raw.riskLevel || raw.highestRisk || "MEDIUM"),
    risk: raw.riskLevel || raw.highestRisk,
    sourceStatus,
    status,
    dueState,
    ageDays: days(raw.createdAt || raw.reportedAt || now.toISOString(), now),
    overdueDays: dueState === "OVERDUE" ? days(dueAt!, now) : 0,
    requiresEvidence: Boolean(raw.photoEvidenceRequired || raw.evidenceRequired),
    evidenceComplete: !raw.evidenceRequired || Boolean(raw.evidenceComplete),
    requiresVerification: verification,
    verificationStatus: raw.verificationStatus || raw.supervisorSignOffResult,
    requiresReinspection: reinspection,
    reinspectionStatus: raw.reinspectionStatus,
    hasBlocker: Boolean(raw.blockerSummary || raw.maintenanceIssueOpen),
    blockerSummary: raw.blockerSummary,
    sourceRoute: route,
    primaryAction: primaryAction(status),
    lastUpdatedAt: raw.updatedAt || raw.createdAt || now.toISOString(),
  };
}
function sourceRoute(type: UnifiedWorkType, raw: any) {
  if (type === "WORK_ORDER") return `/maintenance/work-orders/${raw.id}`;
  if (type === "CORRECTIVE_ACTION") return `/maintenance/corrective-actions/${raw.id}`;
  if (type === "PLANNED_MAINTENANCE") return "/maintenance/planned-maintenance";
  if (type === "SAFETY_INSPECTION") return "/maintenance/planned-maintenance";
  if (
    type === "ROOM_READINESS" ||
    type === "CLEANING_TASK" ||
    type === "QUALITY_INSPECTION" ||
    type === "REINSPECTION"
  )
    return "/maintenance/housekeeping";
  return "/maintenance/work";
}
function primaryAction(status: UnifiedWorkGroup) {
  return (
    {
      OPEN: "Assign",
      ASSIGNED: "Start",
      IN_PROGRESS: "Continue",
      WAITING: "Review",
      FAILED: "Review Failure",
      AWAITING_EVIDENCE: "Add Evidence",
      AWAITING_VERIFICATION: "Review",
      REINSPECTION_REQUIRED: "Reinspect",
      COMPLETED: "View",
      CANCELLED: "View",
      ARCHIVED: "View",
    } as const
  )[status];
}
export function projectUnifiedWork(care: any, homeIds: string[], now = new Date()) {
  const names = new Map<string, string>(
    care.facilities.map((x: any) => [String(x.id), String(x.name)]),
  );
  const groups: Array<[any[], UnifiedWorkType, string]> = [
    [care.maintenanceWorkOrders || [], "WORK_ORDER", "Work Order"],
    [care.plannedMaintenanceOccurrences || [], "PLANNED_MAINTENANCE", "Planned Maintenance"],
    [care.safetyInspections || [], "SAFETY_INSPECTION", "Safety Inspection"],
    [care.housekeepingTasks || [], "CLEANING_TASK", "Cleaning Task"],
    [care.housekeepingQualityInspections || [], "QUALITY_INSPECTION", "Quality Inspection"],
    [care.housekeepingRoomReadiness || [], "ROOM_READINESS", "Room Readiness"],
    [care.housekeepingReinspections || [], "REINSPECTION", "Cleaning Reinspection"],
    [care.correctiveActions || [], "CORRECTIVE_ACTION", "Corrective Action"],
  ];
  return groups
    .flatMap(([rows, type, label]) => rows.map((row: any) => make(row, type, label, names, now)))
    .filter((item) => homeIds.includes(item.nursingHomeId));
}
const priorityRank: Record<string, number> = {
  CRITICAL: 0,
  EXTREME: 0,
  HIGH: 1,
  URGENT: 1,
  MEDIUM: 2,
  LOW: 3,
};
export function sortUnifiedWork(items: UnifiedWorkItem[]) {
  const dueRank: Record<UnifiedDueState, number> = {
    OVERDUE: 0,
    DUE_NOW: 1,
    DUE_TODAY: 2,
    DUE_SOON: 3,
    FUTURE: 4,
    NO_DUE_DATE: 5,
    COMPLETED: 6,
  };
  return [...items].sort(
    (a, b) =>
      (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2) ||
      dueRank[a.dueState] - dueRank[b.dueState] ||
      b.overdueDays - a.overdueDays,
  );
}
export function unifiedWorkCounts(
  items: UnifiedWorkItem[],
  today = new Date().toISOString().slice(0, 10),
) {
  return {
    critical: items.filter(
      (x) => ["CRITICAL", "EXTREME"].includes(x.priority) && !terminal.has(x.sourceStatus),
    ).length,
    overdue: items.filter((x) => x.dueState === "OVERDUE").length,
    dueToday: items.filter((x) => ["DUE_NOW", "DUE_TODAY"].includes(x.dueState)).length,
    unassigned: items.filter(
      (x) =>
        !["COMPLETED", "CANCELLED", "ARCHIVED"].includes(x.status) &&
        !x.assignedUserId &&
        !x.assignedTeamId &&
        !x.contractorId,
    ).length,
    waiting: items.filter((x) => x.status === "WAITING").length,
    verification: items.filter((x) => x.status === "AWAITING_VERIFICATION").length,
    failed: items.filter((x) => x.status === "FAILED").length,
    reinspection: items.filter((x) => x.status === "REINSPECTION_REQUIRED").length,
    completedToday: items.filter((x) => x.completedAt?.startsWith(today)).length,
  };
}
