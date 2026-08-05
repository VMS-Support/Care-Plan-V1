import type { CareCtx } from "@/lib/care/store";

export type PlannedComplianceKind = "maintenance" | "safety";
export type PlannedComplianceDueStatus = "DUE_TODAY" | "DUE_SOON" | "OVERDUE" | "IN_PROGRESS" | "AWAITING_VERIFICATION" | "FAILED" | "REINSPECTION_REQUIRED" | "COMPLETED" | "SCHEDULED" | "CANCELLED";
export type PlannedComplianceWorkItem = {
  id: string;
  sourceId: string;
  kind: PlannedComplianceKind;
  typeLabel: string;
  title: string;
  templateName: string;
  assetOrLocation: string;
  homeName: string;
  assignedTo: string;
  dueDate: string;
  dueTime?: string;
  status: PlannedComplianceDueStatus;
  priority: string;
  workOrderId?: string;
  inspectionId?: string;
  scheduleId?: string;
  verificationRequired: boolean;
  completedAt?: string;
};
export type PlannedComplianceSettings = { dueSoonDays: number; generationLeadDays: number; defaultVerificationRequired: boolean; separationOfDuties: boolean; independentSafetyVerification: boolean; independentHighRiskVerification: boolean; differentReinspector: boolean; managementStatutoryVerification: boolean; sameUserLowRiskMaintenanceVerification: boolean; independentReturnToService: boolean };
export const DEFAULT_PLANNED_COMPLIANCE_SETTINGS: PlannedComplianceSettings = { dueSoonDays: 7, generationLeadDays: 7, defaultVerificationRequired: false, separationOfDuties: true, independentSafetyVerification: true, independentHighRiskVerification: true, differentReinspector: true, managementStatutoryVerification: true, sameUserLowRiskMaintenanceVerification: true, independentReturnToService: true };
const SETTINGS_KEY = "oritas-planned-compliance-settings";
export function loadPlannedComplianceSettings(): PlannedComplianceSettings {
  if (typeof window === "undefined") return DEFAULT_PLANNED_COMPLIANCE_SETTINGS;
  try { return { ...DEFAULT_PLANNED_COMPLIANCE_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; } catch { return DEFAULT_PLANNED_COMPLIANCE_SETTINGS; }
}
export function savePlannedComplianceSettings(settings: PlannedComplianceSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent("oritas-planned-compliance-settings"));
}

const day = (value: Date | string) => new Date(typeof value === "string" ? `${value.slice(0, 10)}T00:00:00` : new Date(value.getFullYear(), value.getMonth(), value.getDate()));
const daysFromToday = (date: string, now = new Date()) => Math.round((day(date).getTime() - day(now).getTime()) / 86400000);
const terminal = new Set(["COMPLETED", "CANCELLED", "SKIPPED"]);

export function plannedComplianceStatus(rawStatus: string, dueDate: string, dueSoonDays = 7, now = new Date()): PlannedComplianceDueStatus {
  const normalized = rawStatus.toUpperCase().replaceAll(" ", "_");
  if (normalized === "REJECTED") return "REINSPECTION_REQUIRED";
  if (["IN_PROGRESS", "AWAITING_VERIFICATION", "FAILED", "COMPLETED", "CANCELLED"].includes(normalized)) return normalized as PlannedComplianceDueStatus;
  if (terminal.has(normalized)) return normalized === "SKIPPED" ? "CANCELLED" : normalized as PlannedComplianceDueStatus;
  const remaining = daysFromToday(dueDate, now);
  if (remaining < 0) return "OVERDUE";
  if (remaining === 0) return "DUE_TODAY";
  if (remaining <= dueSoonDays) return "DUE_SOON";
  return "SCHEDULED";
}

export function buildPlannedComplianceWork(care: CareCtx, dueSoonDays = 7, now = new Date()): PlannedComplianceWorkItem[] {
  const homeName = care.facilities.find((home) => home.id === care.activeFacilityId)?.name || "Current Nursing Home";
  const maintenance = (care.plannedMaintenanceOccurrences || []).map((occurrence) => {
    const schedule = care.plannedMaintenanceSchedules.find((item) => item.id === occurrence.scheduleId);
    const template = care.maintenanceTemplates.find((item) => item.id === schedule?.templateId);
    const asset = care.maintenanceAssets.find((item) => item.id === schedule?.assetId);
    return {
      id: `maintenance:${occurrence.id}`,
      sourceId: occurrence.id,
      kind: "maintenance" as const,
      typeLabel: "Planned Maintenance",
      title: template?.name || "Planned maintenance task",
      templateName: template?.name || "Template unavailable",
      assetOrLocation: asset?.assetName || schedule?.assetName || schedule?.locationLabel || "Location not recorded",
      homeName,
      assignedTo: schedule?.responsibleTeamId || "Unassigned",
      dueDate: occurrence.dueDate,
      status: plannedComplianceStatus(occurrence.status, occurrence.dueDate, dueSoonDays, now),
      priority: "MEDIUM",
      workOrderId: occurrence.workOrderId,
      scheduleId: occurrence.scheduleId,
      verificationRequired: Boolean(template?.verificationRequired),
      completedAt: occurrence.completedAt,
    } satisfies PlannedComplianceWorkItem;
  });
  const safety = (care.safetyInspectionOccurrences || []).map((occurrence) => {
    const schedule = care.safetyInspectionSchedules.find((item) => item.id === occurrence.scheduleId);
    const template = care.safetyInspectionTemplates.find((item) => item.id === occurrence.templateId);
    const asset = care.maintenanceAssets.find((item) => item.id === occurrence.assetId);
    const inspection = care.safetyInspections.find((item) => item.id === occurrence.inspectionId);
    return {
      id: `safety:${occurrence.id}`,
      sourceId: occurrence.id,
      kind: "safety" as const,
      typeLabel: inspection?.inspectionType === "REINSPECTION" ? "Reinspection" : "Safety Inspection",
      title: template?.name || schedule?.scheduleName || "Safety inspection",
      templateName: template?.name || "Template unavailable",
      assetOrLocation: asset?.assetName || schedule?.locationLabel || "Nursing Home",
      homeName,
      assignedTo: occurrence.assignedUserId || occurrence.assignedTeamId || schedule?.responsibleUserId || schedule?.responsibleTeamId || "Unassigned",
      dueDate: occurrence.dueDate,
      dueTime: occurrence.dueTime,
      status: plannedComplianceStatus(inspection?.status || occurrence.status, occurrence.dueDate, dueSoonDays, now),
      priority: inspection?.riskLevel || occurrence.priority,
      workOrderId: occurrence.workOrderId || inspection?.correctiveWorkOrderId,
      inspectionId: occurrence.inspectionId,
      scheduleId: occurrence.scheduleId,
      verificationRequired: Boolean(template?.verificationRequired),
      completedAt: occurrence.completedAt || inspection?.completedAt,
    } satisfies PlannedComplianceWorkItem;
  });
  return [...maintenance, ...safety].sort((a, b) => `${a.dueDate}${a.dueTime || ""}`.localeCompare(`${b.dueDate}${b.dueTime || ""}`));
}

export function plannedComplianceDashboard(items: PlannedComplianceWorkItem[], currentUserId?: string) {
  const count = (kind: PlannedComplianceKind, status: PlannedComplianceDueStatus) => items.filter((item) => item.kind === kind && item.status === status).length;
  return {
    plannedDueToday: count("maintenance", "DUE_TODAY"),
    safetyDueToday: count("safety", "DUE_TODAY"),
    overduePlanned: count("maintenance", "OVERDUE"),
    overdueSafety: count("safety", "OVERDUE"),
    failedInspections: items.filter((item) => item.kind === "safety" && item.status === "FAILED").length,
    awaitingVerification: items.filter((item) => item.status === "AWAITING_VERIFICATION").length,
    reinspectionRequired: items.filter((item) => item.status === "REINSPECTION_REQUIRED").length,
    highRiskFailures: items.filter((item) => item.status === "FAILED" && ["HIGH", "CRITICAL"].includes(item.priority)).length,
    assignedToCurrentUser: currentUserId ? items.filter((item) => item.assignedTo === currentUserId && !terminal.has(item.status)).length : 0,
  };
}

export function plannedComplianceReporting(items: PlannedComplianceWorkItem[]) {
  return items.map((item) => ({ ...item, completedOnTime: Boolean(item.completedAt && item.completedAt.slice(0, 10) <= item.dueDate), daysOverdue: item.status === "OVERDUE" ? Math.max(1, -daysFromToday(item.dueDate)) : 0 }));
}

export function plannedComplianceDataReview(care: CareCtx, items: PlannedComplianceWorkItem[]) {
  const occurrenceKeys = [...(care.plannedMaintenanceOccurrences || []).map((item) => `m:${item.scheduleId}:${item.dueDate}`), ...(care.safetyInspectionOccurrences || []).map((item) => `s:${item.scheduleId}:${item.dueDate}`)];
  const duplicateCount = occurrenceKeys.length - new Set(occurrenceKeys).size;
  return [
    [...care.plannedMaintenanceSchedules, ...care.safetyInspectionSchedules].filter((schedule) => ![...care.maintenanceTemplates, ...care.safetyInspectionTemplates].some((template) => template.id === schedule.templateId)).length > 0 && "Schedules without a valid template",
    items.filter((item) => item.assetOrLocation === "Location not recorded").length > 0 && "Occurrences without an asset or managed location",
    duplicateCount > 0 && `${duplicateCount} duplicate generated occurrence${duplicateCount === 1 ? "" : "s"}`,
    care.safetyInspections.filter((inspection) => inspection.overallResult === "FAIL" && !inspection.correctiveWorkOrderId && !inspection.correctiveActionRequired).length > 0 && "Failed inspections without recorded follow-up",
    care.safetyInspections.filter((inspection) => inspection.verificationRequired && inspection.verificationStatus === "PENDING").length > 0 && "Verification-required inspections still awaiting verification",
    items.filter((item) => item.status === "OVERDUE" && item.assignedTo === "Unassigned").length > 0 && "Overdue work with no assignee",
    care.plannedMaintenanceSchedules.filter((schedule) => schedule.active && care.maintenanceTemplates.some((template) => template.id === schedule.templateId && Boolean(template.archivedAt))).length > 0 && "Archived maintenance templates used by active schedules",
    care.safetyInspectionSchedules.filter((schedule) => schedule.active && care.safetyInspectionTemplates.some((template) => template.id === schedule.templateId && Boolean(template.archivedAt))).length > 0 && "Archived safety templates used by active schedules",
  ].filter(Boolean) as string[];
}
