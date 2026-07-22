import type {
  MaintenanceAsset,
  MaintenanceWorkOrder,
  PlannedMaintenanceFrequencyType,
  SafetyCategory,
  SafetyCategoryCode,
  SafetyCertificate,
  SafetyInspection,
  SafetyInspectionEvidence,
  SafetyInspectionObservation,
  SafetyInspectionOccurrence,
  SafetyInspectionResponse,
  SafetyInspectionSchedule,
  SafetyInspectionTemplate,
  SafetyInspectionTemplateEvidenceRequirement,
  SafetyInspectionTemplateItem,
  SafetyResponseResult,
  SafetySeverity,
} from "@/lib/care/types";
import { ACTIVE_WORK_ORDER_STATUSES } from "./workOrders.ts";

export const SAFETY_CATEGORY_CODES: SafetyCategoryCode[] = [
  "FIRE_SAFETY",
  "WATER_SAFETY",
  "ELECTRICAL",
  "HEATING",
  "NURSE_CALL",
  "KITCHEN_EQUIPMENT",
  "LAUNDRY_EQUIPMENT",
  "SLUICE_EQUIPMENT",
  "RESIDENT_EQUIPMENT",
];

export const DEFAULT_SAFETY_CATEGORIES: Array<Omit<SafetyCategory, "createdBy" | "createdAt" | "updatedBy" | "updatedAt">> = [
  category("FIRE_SAFETY", "Fire Safety", "Fire alarms, fire doors, emergency lighting, exits and extinguishers.", "#dc2626", "shield", "weekly", 1, "HIGH", true, true, 1),
  category("WATER_SAFETY", "Water Safety", "Water temperatures, flushing, TMV and legionella control checks.", "#0ea5e9", "droplet", "monthly", 1, "HIGH", true, true, 2),
  category("ELECTRICAL", "Electrical", "PAT, distribution board and portable electrical safety checks.", "#f59e0b", "zap", "annual", 1, "HIGH", true, true, 3),
  category("HEATING", "Heating", "Boiler, radiator, pipework and heating safety checks.", "#ea580c", "flame", "annual", 1, "MEDIUM", true, true, 4),
  category("NURSE_CALL", "Nurse Call", "Nurse call points, indicators and response equipment.", "#2563eb", "bell", "weekly", 1, "HIGH", false, false, 5),
  category("KITCHEN_EQUIPMENT", "Kitchen Equipment", "Kitchen equipment safety, guards, hygiene condition and servicing.", "#fb923c", "utensils", "monthly", 1, "MEDIUM", false, false, 6),
  category("LAUNDRY_EQUIPMENT", "Laundry Equipment", "Laundry machines, lint controls, heat and electrical condition.", "#06b6d4", "shirt", "monthly", 1, "MEDIUM", false, false, 7),
  category("SLUICE_EQUIPMENT", "Sluice Equipment", "Bedpan washer, sluice room and waste equipment checks.", "#14b8a6", "sparkles", "monthly", 1, "MEDIUM", false, false, 8),
  category("RESIDENT_EQUIPMENT", "Resident Equipment", "Resident-use equipment safety excluding lifts, hoists and slings.", "#8b5cf6", "heart-pulse", "monthly", 1, "HIGH", false, false, 9),
];

export const SAFETY_RESPONSE_TYPES = ["PASS_FAIL", "PASS_FAIL_NA", "YES_NO", "YES_NO_NA", "TEXT", "NUMBER", "TEMPERATURE", "READING", "DATE", "PHOTO_CONFIRMATION", "CERTIFICATE_CONFIRMATION", "SIGNATURE_CONFIRMATION"] as const;
export const SAFETY_EVIDENCE_TYPES = ["PHOTO", "DOCUMENT", "CERTIFICATE", "READING", "SIGNATURE", "VIDEO", "OTHER"] as const;

export function safetyCategoryLabel(code: SafetyCategoryCode) {
  return DEFAULT_SAFETY_CATEGORIES.find((item) => item.code === code)?.name || code.replaceAll("_", " ");
}

export function validateSafetyCategory(input: Partial<SafetyCategory>, categories: SafetyCategory[]) {
  const fieldErrors: Record<string, string> = {};
  if (!input.code) fieldErrors.code = "Select a safety category code.";
  if (!input.name?.trim()) fieldErrors.name = "Enter a category name.";
  if (input.code && categories.some((item) => item.id !== input.id && item.code === input.code)) fieldErrors.code = "Category code already exists.";
  if (!input.defaultFrequencyType) fieldErrors.defaultFrequencyType = "Select a default frequency.";
  if (!Number(input.defaultFrequencyInterval || 0) || Number(input.defaultFrequencyInterval) < 1) fieldErrors.defaultFrequencyInterval = "Frequency interval must be at least 1.";
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export function validateSafetyTemplate(input: Partial<SafetyInspectionTemplate>, categories: SafetyCategory[]) {
  const fieldErrors: Record<string, string> = {};
  if (!input.name?.trim()) fieldErrors.name = "Enter a template name.";
  if (!input.categoryId || !categories.some((item) => item.id === input.categoryId && item.active)) fieldErrors.categoryId = "Select an active category.";
  if (!input.defaultFrequencyType) fieldErrors.defaultFrequencyType = "Select a frequency.";
  if (!Number(input.defaultFrequencyInterval || 0) || Number(input.defaultFrequencyInterval) < 1) fieldErrors.defaultFrequencyInterval = "Frequency interval must be at least 1.";
  if (!Number(input.estimatedDurationMinutes || 0) || Number(input.estimatedDurationMinutes) < 1) fieldErrors.estimatedDurationMinutes = "Estimated duration is required.";
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export function validateSafetySchedule(input: Partial<SafetyInspectionSchedule>, source: { categories: SafetyCategory[]; templates: SafetyInspectionTemplate[]; assets: MaintenanceAsset[] }) {
  const fieldErrors: Record<string, string> = {};
  const template = source.templates.find((item) => item.id === input.templateId);
  if (!input.homeId) fieldErrors.homeId = "Select a Home.";
  if (!input.categoryId || !source.categories.some((item) => item.id === input.categoryId && item.active)) fieldErrors.categoryId = "Select an active category.";
  if (!template || !template.active || template.status === "ARCHIVED") fieldErrors.templateId = "Select an active inspection template.";
  if (template?.homeId && input.homeId && template.homeId !== input.homeId) fieldErrors.templateId = "Template belongs to a different Home.";
  if (!input.assetId && !input.locationId && !input.locationLabel) fieldErrors.subject = "Select an asset, location or Home-level inspection subject.";
  const asset = input.assetId ? source.assets.find((item) => item.id === input.assetId) : undefined;
  if (input.assetId && (!asset || asset.homeId !== input.homeId || !asset.active)) fieldErrors.assetId = "Select an active asset in this Home.";
  if (input.endDate && input.startDate && input.endDate < input.startDate) fieldErrors.endDate = "End date cannot be before start date.";
  if (!input.nextDueDate) fieldErrors.nextDueDate = "Enter the next due date.";
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export function safetyPresentationStatus(occurrence: SafetyInspectionOccurrence, today = new Date()): SafetyInspectionOccurrence["status"] {
  if (!["SCHEDULED", "DUE_SOON", "DUE_TODAY", "OVERDUE"].includes(occurrence.status)) return occurrence.status;
  const days = daysBetween(dateOnly(today), occurrence.dueDate);
  if (days < 0) return "OVERDUE";
  if (days === 0) return "DUE_TODAY";
  if (days <= 7) return "DUE_SOON";
  return "SCHEDULED";
}

export function nextSafetyDueDate(date: string, frequencyType: PlannedMaintenanceFrequencyType, interval: number) {
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

export function createSafetyResponsesFromTemplate(inspectionId: string, items: SafetyInspectionTemplateItem[], user: string, now: string): SafetyInspectionResponse[] {
  return items
    .filter((item) => item.active)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((item) => ({
      id: `safety-response-${inspectionId}-${item.itemCode}`,
      inspectionId,
      templateItemId: item.id,
      templateItemCode: item.itemCode,
      sectionName: item.sectionName,
      questionLabelSnapshot: item.label,
      responseType: item.responseType,
      result: "UNANSWERED",
      mandatory: item.mandatory,
      failureSeverity: item.failureSeverity,
      correctiveActionRequired: item.failureTriggersCorrectiveAction,
      evidenceRequired: item.failureRequiresEvidence || item.failureRequiresPhoto,
      answeredBy: undefined,
      answeredAt: undefined,
      displayOrder: item.displayOrder,
    }));
}

export function evaluateSafetyInspection(params: {
  inspection: SafetyInspection;
  responses: SafetyInspectionResponse[];
  observations: SafetyInspectionObservation[];
  evidence: SafetyInspectionEvidence[];
  requirements: SafetyInspectionTemplateEvidenceRequirement[];
  certificate?: SafetyCertificate;
}) {
  const activeEvidence = params.evidence.filter((item) => item.active && !item.deletedAt);
  const failedResponses = params.responses.filter((item) => item.result === "FAIL");
  const unansweredMandatory = params.responses.filter((item) => item.mandatory && item.result === "UNANSWERED");
  const missingObservation = params.responses.filter((item) => item.result === "FAIL" && item.correctiveActionRequired && !params.observations.some((obs) => obs.responseId === item.id));
  const missingEvidence = params.requirements.filter((req) => req.mandatory && activeEvidence.filter((item) => item.evidenceType === req.evidenceType).length < req.minimumCount);
  const criticalObservation = params.observations.some((item) => item.severity === "CRITICAL");
  const missingCertificate = params.inspection.certificateRequired && !params.certificate;
  const blockers = [
    ...unansweredMandatory.map((item) => `Answer mandatory item: ${item.questionLabelSnapshot}`),
    ...missingObservation.map((item) => `Record observation for failed item: ${item.questionLabelSnapshot}`),
    ...missingEvidence.map((item) => `Attach required evidence: ${item.label}`),
    ...(missingCertificate ? ["Attach the required certificate."] : []),
  ];
  const result = failedResponses.length || criticalObservation ? "FAIL" : params.observations.length ? "PASS_WITH_OBSERVATIONS" : "PASS";
  return {
    canComplete: blockers.length === 0 && params.inspection.declarationAccepted,
    blockers: params.inspection.declarationAccepted ? blockers : [...blockers, "Accept the inspection declaration."],
    failedResponses,
    missingEvidence,
    overallResult: result as SafetyInspection["overallResult"],
    nextStatus: result === "FAIL" ? "FAILED" as const : params.inspection.verificationRequired ? "AWAITING_VERIFICATION" as const : "COMPLETED" as const,
  };
}

export function safetyDashboardMetrics(params: {
  categories: SafetyCategory[];
  templates: SafetyInspectionTemplate[];
  schedules: SafetyInspectionSchedule[];
  occurrences: SafetyInspectionOccurrence[];
  inspections: SafetyInspection[];
  certificates: SafetyCertificate[];
  workOrders: MaintenanceWorkOrder[];
  today?: Date;
}) {
  const today = params.today || new Date();
  const statuses = params.occurrences.map((item) => safetyPresentationStatus(item, today));
  return {
    totalCategories: params.categories.filter((item) => item.active).length,
    activeTemplates: params.templates.filter((item) => item.active && item.status === "ACTIVE").length,
    activeSchedules: params.schedules.filter((item) => item.active && !item.paused).length,
    upcoming: statuses.filter((status) => status === "SCHEDULED").length,
    dueSoon: statuses.filter((status) => status === "DUE_SOON" || status === "DUE_TODAY").length,
    overdue: statuses.filter((status) => status === "OVERDUE").length,
    failed: params.inspections.filter((item) => item.status === "FAILED" || item.overallResult === "FAIL").length,
    awaitingVerification: params.inspections.filter((item) => item.verificationStatus === "PENDING").length,
    certificatesExpiring: params.certificates.filter((item) => daysBetween(dateOnly(today), item.expiryDate) >= 0 && daysBetween(dateOnly(today), item.expiryDate) <= 90 && !["REVOKED", "SUPERSEDED"].includes(item.status)).length,
    currentCorrectiveWorkOrders: params.workOrders.filter((item) => item.category && ACTIVE_WORK_ORDER_STATUSES.includes(item.status) && item.complianceImpact).length,
    byCategory: params.categories.map((category) => ({
      category,
      inspections: params.inspections.filter((item) => item.categoryId === category.id).length,
      failed: params.inspections.filter((item) => item.categoryId === category.id && item.overallResult === "FAIL").length,
      overdue: params.occurrences.filter((item) => item.categoryId === category.id && safetyPresentationStatus(item, today) === "OVERDUE").length,
    })),
  };
}

export function safetyTimeline(params: { inspection: SafetyInspection; observations: SafetyInspectionObservation[]; evidence: SafetyInspectionEvidence[]; certificates: SafetyCertificate[] }) {
  return [
    { at: params.inspection.createdAt, user: params.inspection.startedBy || params.inspection.completedBy || "System", summary: "Inspection created", reference: params.inspection.inspectionNumber },
    params.inspection.startedAt ? { at: params.inspection.startedAt, user: params.inspection.startedBy || "System", summary: "Inspection started", reference: params.inspection.status } : undefined,
    ...params.observations.map((item) => ({ at: item.createdAt, user: item.createdBy, summary: `${item.severity} ${item.observationType.toLowerCase().replaceAll("_", " ")}`, reference: item.description })),
    ...params.evidence.filter((item) => item.active && !item.deletedAt).map((item) => ({ at: item.uploadedAt, user: item.uploadedBy, summary: `${item.evidenceType} evidence uploaded`, reference: item.fileName })),
    ...params.certificates.map((item) => ({ at: item.createdAt, user: item.createdBy, summary: `${item.certificateType} certificate attached`, reference: item.certificateNumber })),
    params.inspection.completedAt ? { at: params.inspection.completedAt, user: params.inspection.completedBy || "System", summary: `Inspection ${params.inspection.overallResult.toLowerCase().replaceAll("_", " ")}`, reference: params.inspection.status } : undefined,
    params.inspection.verifiedAt ? { at: params.inspection.verifiedAt, user: params.inspection.verifiedBy || "System", summary: `Verification ${params.inspection.verificationStatus.toLowerCase()}`, reference: params.inspection.rejectionReason } : undefined,
  ].filter(Boolean).sort((a, b) => b!.at.localeCompare(a!.at)) as Array<{ at: string; user: string; summary: string; reference?: string }>;
}

function category(code: SafetyCategoryCode, name: string, description: string, colour: string, icon: string, frequency: PlannedMaintenanceFrequencyType, interval: number, priority: SafetyCategory["defaultPriority"], verification: boolean, certificate: boolean, displayOrder: number) {
  return {
    id: `safety-category-${code.toLowerCase().replaceAll("_", "-")}`,
    tenantId: "tenant-oritas-demo",
    code,
    name,
    description,
    colour,
    icon,
    active: true,
    displayOrder,
    defaultFrequencyType: frequency,
    defaultFrequencyInterval: interval,
    defaultPriority: priority,
    defaultVerificationRequired: verification,
    defaultCertificateRequired: certificate,
  };
}

export function dateOnly(input: string | Date) {
  return new Date(input).toISOString().slice(0, 10);
}

export function daysBetween(a: string | Date, b: string | Date) {
  const start = new Date(dateOnly(a)).getTime();
  const end = new Date(dateOnly(b)).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function responseResultFromValue(value: string): SafetyResponseResult {
  const normal = value.trim().toLowerCase();
  if (["pass", "yes", "within range", "confirmed"].includes(normal)) return "PASS";
  if (["fail", "no", "out of range"].includes(normal)) return "FAIL";
  if (["na", "n/a", "not applicable"].includes(normal)) return "NOT_APPLICABLE";
  if (!normal) return "UNANSWERED";
  return "INFORMATION_ONLY";
}
