import type {
  CleaningAudit,
  HousekeepingCleaningType,
  HousekeepingEvidence,
  HousekeepingException,
  HousekeepingResponseResult,
  HousekeepingSchedule,
  HousekeepingTask,
  HousekeepingTaskResponse,
  HousekeepingTemplate,
  HousekeepingTemplateItem,
  HousekeepingTemplateSection,
  MaintenanceAsset,
  MaintenanceWorkOrder,
  PlannedMaintenanceFrequencyType,
  QualityInspection,
  RoomReadinessRecord,
} from "@/lib/care/types";
import { ACTIVE_WORK_ORDER_STATUSES } from "./workOrders.ts";

export const HOUSEKEEPING_CLEANING_TYPES: HousekeepingCleaningType[] = ["ROUTINE", "DEEP", "ENHANCED", "TERMINAL"];

export const HOUSEKEEPING_RESPONSE_TYPES = [
  "PASS_FAIL",
  "PASS_FAIL_NA",
  "YES_NO",
  "YES_NO_NA",
  "TEXT",
  "NUMBER",
  "PHOTO_CONFIRMATION",
  "SIGNATURE_CONFIRMATION",
] as const;

export function cleaningTypeLabel(type: HousekeepingCleaningType) {
  return {
    ROUTINE: "Routine Cleaning",
    DEEP: "Deep Cleaning",
    ENHANCED: "Enhanced Cleaning",
    TERMINAL: "Terminal Cleaning",
  }[type];
}

export function housekeepingStatusLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function validateHousekeepingTemplate(input: Partial<HousekeepingTemplate>) {
  const fieldErrors: Record<string, string> = {};
  if (!input.name?.trim()) fieldErrors.name = "Enter a template name.";
  if (!input.code?.trim()) fieldErrors.code = "Enter a template code.";
  if (!input.cleaningType) fieldErrors.cleaningType = "Select a cleaning type.";
  if (!Number(input.estimatedDurationMinutes || 0) || Number(input.estimatedDurationMinutes) < 1) fieldErrors.estimatedDurationMinutes = "Estimated duration is required.";
  if (!input.defaultFrequencyType) fieldErrors.defaultFrequencyType = "Select a default frequency.";
  if (!Number(input.defaultFrequencyInterval || 0) || Number(input.defaultFrequencyInterval) < 1) fieldErrors.defaultFrequencyInterval = "Frequency interval must be at least 1.";
  if (input.effectiveTo && input.effectiveFrom && input.effectiveTo < input.effectiveFrom) fieldErrors.effectiveTo = "Effective to cannot be before effective from.";
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export function validateHousekeepingSchedule(input: Partial<HousekeepingSchedule>, source: { templates: HousekeepingTemplate[]; assets: MaintenanceAsset[] }) {
  const fieldErrors: Record<string, string> = {};
  const template = source.templates.find((item) => item.id === input.templateId);
  if (!input.homeId) fieldErrors.homeId = "Select a Home.";
  if (!template || !template.active || template.status !== "ACTIVE") fieldErrors.templateId = "Select an active cleaning template.";
  if (template?.homeId && input.homeId && template.homeId !== input.homeId) fieldErrors.templateId = "Template belongs to a different Home.";
  if (!input.locationId && !input.locationLabel && !input.roomId) fieldErrors.subject = "Select a room or location.";
  if (!input.frequencyType) fieldErrors.frequencyType = "Select a frequency.";
  if (!Number(input.frequencyInterval || 0) || Number(input.frequencyInterval) < 1) fieldErrors.frequencyInterval = "Frequency interval must be at least 1.";
  if (!input.nextDueDate) fieldErrors.nextDueDate = "Enter the next due date.";
  if (input.endDate && input.startDate && input.endDate < input.startDate) fieldErrors.endDate = "End date cannot be before start date.";
  const asset = input.locationId ? source.assets.find((item) => item.id === input.locationId) : undefined;
  if (input.locationId && asset && input.homeId && asset.homeId !== input.homeId) fieldErrors.locationId = "Location belongs to a different Home.";
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export function nextHousekeepingDueDate(date: string, frequencyType: PlannedMaintenanceFrequencyType, interval: number) {
  const d = new Date(`${date}T00:00:00.000Z`);
  const amount = Math.max(1, Number(interval || 1));
  if (frequencyType === "daily") d.setUTCDate(d.getUTCDate() + amount);
  else if (frequencyType === "weekly") d.setUTCDate(d.getUTCDate() + 7 * amount);
  else if (frequencyType === "monthly") d.setUTCMonth(d.getUTCMonth() + amount);
  else if (frequencyType === "quarterly") d.setUTCMonth(d.getUTCMonth() + 3 * amount);
  else if (frequencyType === "six_monthly") d.setUTCMonth(d.getUTCMonth() + 6 * amount);
  else if (frequencyType === "annual") d.setUTCFullYear(d.getUTCFullYear() + amount);
  else if (frequencyType === "custom_days") d.setUTCDate(d.getUTCDate() + amount);
  else if (frequencyType === "custom_weeks") d.setUTCDate(d.getUTCDate() + 7 * amount);
  else if (frequencyType === "custom_months") d.setUTCMonth(d.getUTCMonth() + amount);
  else d.setUTCFullYear(d.getUTCFullYear() + amount);
  return d.toISOString().slice(0, 10);
}

export function housekeepingDueStatus(task: HousekeepingTask, now = new Date()): HousekeepingTask["status"] {
  if (!["SCHEDULED", "UNASSIGNED", "ASSIGNED"].includes(task.status)) return task.status;
  const dueAt = new Date(`${task.dueDate}T${task.dueTime || "23:59"}:00.000Z`);
  return dueAt.getTime() < now.getTime() ? "OVERDUE" : task.status;
}

export function responseResultFromHousekeepingValue(value?: string): HousekeepingResponseResult {
  const normal = String(value || "").toLowerCase();
  if (["pass", "yes", "complete", "completed", "signed", "photo attached"].includes(normal)) return "PASS";
  if (["fail", "no", "failed"].includes(normal)) return "FAIL";
  if (["n/a", "na", "not applicable"].includes(normal)) return "NOT_APPLICABLE";
  if (normal.trim()) return "INFORMATION_ONLY";
  return "UNANSWERED";
}

export function createHousekeepingResponsesFromTemplate(taskId: string, sections: HousekeepingTemplateSection[], items: HousekeepingTemplateItem[], user: string, now: string): HousekeepingTaskResponse[] {
  const sectionNameById = new Map(sections.map((item) => [item.id, item.name]));
  return items
    .filter((item) => item.active)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((item) => ({
      id: `housekeeping-response-${taskId}-${item.code}`,
      taskId,
      templateItemId: item.id,
      sectionNameSnapshot: sectionNameById.get(item.sectionId) || "Checklist",
      questionLabelSnapshot: item.label,
      responseType: item.responseType,
      result: "UNANSWERED",
      failureSeverity: item.failureSeverity,
      displayOrder: item.displayOrder,
      mandatory: item.mandatory,
      failureRequiresObservation: item.failureRequiresObservation,
      failureRequiresPhoto: item.failureRequiresPhoto,
      failureRequiresException: item.failureRequiresException,
      notApplicableReasonRequired: item.notApplicableReasonRequired,
      answeredBy: user,
      answeredAt: now,
    }));
}

export function evaluateHousekeepingTask(params: {
  task: HousekeepingTask;
  responses: HousekeepingTaskResponse[];
  evidence: HousekeepingEvidence[];
  exceptions: HousekeepingException[];
}) {
  const activeEvidence = params.evidence.filter((item) => item.active && !item.deletedAt);
  const failedResponses = params.responses.filter((item) => item.result === "FAIL");
  const unansweredMandatory = params.responses.filter((item) => item.mandatory && item.result === "UNANSWERED");
  const missingNaReasons = params.responses.filter((item) => item.result === "NOT_APPLICABLE" && item.notApplicableReasonRequired && !item.notApplicableReason?.trim());
  const missingFailureObservation = params.responses.filter((item) => item.result === "FAIL" && item.failureRequiresObservation && !item.observation?.trim());
  const missingFailurePhoto = params.responses.filter((item) => item.result === "FAIL" && item.failureRequiresPhoto && !activeEvidence.some((evidence) => evidence.responseId === item.id && evidence.evidenceType === "PHOTO"));
  const missingFailureException = params.responses.filter((item) => item.result === "FAIL" && item.failureRequiresException && !params.exceptions.some((exception) => exception.taskId === params.task.id && exception.status !== "CLOSED"));
  const missingTaskPhotos = params.task.photoEvidenceRequired && activeEvidence.filter((item) => item.taskId === params.task.id && item.evidenceType === "PHOTO").length < params.task.minimumPhotoCount;
  const openBlockingExceptions = params.exceptions.filter((item) => ["OPEN", "IN_REVIEW", "ACTION_REQUIRED"].includes(item.status) && (item.severity === "HIGH" || item.severity === "CRITICAL" || item.requiresMaintenanceWorkOrder));
  const blockers = [
    ...unansweredMandatory.map((item) => `Complete mandatory item: ${item.questionLabelSnapshot}`),
    ...missingNaReasons.map((item) => `Add Not Applicable reason: ${item.questionLabelSnapshot}`),
    ...missingFailureObservation.map((item) => `Record observation for failed item: ${item.questionLabelSnapshot}`),
    ...missingFailurePhoto.map((item) => `Attach photo evidence for failed item: ${item.questionLabelSnapshot}`),
    ...missingFailureException.map((item) => `Create exception for failed item: ${item.questionLabelSnapshot}`),
    ...(missingTaskPhotos ? [`Attach at least ${params.task.minimumPhotoCount} photo(s).`] : []),
    ...openBlockingExceptions.map((item) => `Resolve blocking exception: ${item.category}`),
    ...(params.task.cleanerDeclarationAccepted ? [] : ["Accept the cleaner declaration."]),
  ];
  const result = failedResponses.length || openBlockingExceptions.length ? "FAIL" : params.responses.some((item) => item.observation) ? "PASS_WITH_OBSERVATIONS" : "PASS";
  return {
    canComplete: blockers.length === 0,
    blockers,
    failedResponses,
    openBlockingExceptions,
    overallResult: result as HousekeepingTask["overallResult"],
    nextStatus: result === "FAIL" ? "FAILED" as const : params.task.qualityInspectionRequired ? "AWAITING_INSPECTION" as const : "COMPLETED" as const,
  };
}

export function roomReadinessBlockers(params: {
  readiness: RoomReadinessRecord;
  tasks: HousekeepingTask[];
  inspections: QualityInspection[];
  exceptions: HousekeepingException[];
  workOrders: MaintenanceWorkOrder[];
}) {
  const blockers: string[] = [];
  if (params.readiness.cleaningRequired && !params.readiness.cleaningCompleted) blockers.push("Cleaning is not complete.");
  if (params.readiness.qualityInspectionRequired && !params.readiness.qualityInspectionPassed) blockers.push("Quality inspection has not passed.");
  if (!params.readiness.linenReady) blockers.push("Linen is not ready.");
  if (!params.readiness.wasteCleared) blockers.push("Waste has not been cleared.");
  if (!params.readiness.suppliesReady) blockers.push("Supplies are not ready.");
  if (params.exceptions.some((item) => item.roomId === params.readiness.roomId && ["OPEN", "IN_REVIEW", "ACTION_REQUIRED"].includes(item.status))) blockers.push("Open housekeeping exceptions remain.");
  if (params.workOrders.some((item) => String(item.roomId || "") === params.readiness.roomId && ACTIVE_WORK_ORDER_STATUSES.includes(item.status))) blockers.push("Open maintenance Work Order blocks readiness.");
  return blockers;
}

export function housekeepingDashboardMetrics(params: {
  templates: HousekeepingTemplate[];
  schedules: HousekeepingSchedule[];
  tasks: HousekeepingTask[];
  exceptions: HousekeepingException[];
  inspections: QualityInspection[];
  audits: CleaningAudit[];
  readiness: RoomReadinessRecord[];
  today?: Date;
}) {
  const today = (params.today || new Date()).toISOString().slice(0, 10);
  const activeTasks = params.tasks.filter((item) => !["COMPLETED", "CANCELLED", "SKIPPED"].includes(item.status));
  const completedToday = params.tasks.filter((item) => item.completedAt?.startsWith(today));
  return {
    activeTemplates: params.templates.filter((item) => item.active && item.status === "ACTIVE").length,
    activeSchedules: params.schedules.filter((item) => item.active && !item.paused && !item.archivedAt).length,
    dueToday: activeTasks.filter((item) => item.dueDate === today).length,
    overdue: activeTasks.filter((item) => housekeepingDueStatus(item, params.today) === "OVERDUE").length,
    inProgress: params.tasks.filter((item) => item.status === "IN_PROGRESS").length,
    failed: params.tasks.filter((item) => item.status === "FAILED").length,
    awaitingInspection: params.tasks.filter((item) => item.status === "AWAITING_INSPECTION").length,
    completedToday: completedToday.length,
    openExceptions: params.exceptions.filter((item) => ["OPEN", "IN_REVIEW", "ACTION_REQUIRED"].includes(item.status)).length,
    qualityFailures: params.inspections.filter((item) => item.status === "FAILED").length,
    roomBlocked: params.readiness.filter((item) => !["READY", "OCCUPIED"].includes(item.readinessStatus)).length,
    auditFailures: params.audits.filter((item) => item.status === "FAILED" || item.result === "FAIL").length,
    completionRate: params.tasks.length ? Math.round((params.tasks.filter((item) => item.status === "COMPLETED").length / params.tasks.length) * 100) : 0,
    byCleaningType: HOUSEKEEPING_CLEANING_TYPES.map((type) => ({
      type,
      label: cleaningTypeLabel(type),
      open: activeTasks.filter((item) => item.cleaningType === type).length,
      completed: params.tasks.filter((item) => item.cleaningType === type && item.status === "COMPLETED").length,
      failed: params.tasks.filter((item) => item.cleaningType === type && item.status === "FAILED").length,
    })),
  };
}
