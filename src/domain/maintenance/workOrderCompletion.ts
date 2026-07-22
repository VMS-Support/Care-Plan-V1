import type {
  AuditLog,
  MaintenanceWorkOrder,
  MaintenanceWorkOrderCategory,
  UserProfile,
  WorkOrderAttachment,
  WorkOrderCompletionChecklistResponse,
  WorkOrderCompletionChecklistSnapshot,
  WorkOrderCompletionOutcome,
  WorkOrderCompletionRecord,
  WorkOrderLabourEntry,
  WorkOrderMaterialEntry,
  WorkOrderNote,
} from "@/lib/care/types";
import { isWorkOrderOverdue } from "./workOrders.ts";

export type WorkOrderCompletionErrorCode =
  | "WORK_ORDER_NOT_FOUND"
  | "PERMISSION_DENIED"
  | "OUT_OF_SCOPE"
  | "INVALID_STATUS"
  | "STALE_VERSION"
  | "WORK_COMPLETED_REQUIRED"
  | "OUTCOME_DETAILS_REQUIRED"
  | "FOLLOW_UP_DETAILS_REQUIRED"
  | "CHECKLIST_INCOMPLETE"
  | "CHECKLIST_INVALID"
  | "EVIDENCE_REQUIRED"
  | "EVIDENCE_INVALID"
  | "DECLARATION_REQUIRED"
  | "WARNING_ACKNOWLEDGEMENT_REQUIRED"
  | "DUPLICATE_REQUEST";

export class WorkOrderCompletionError extends Error {
  code: WorkOrderCompletionErrorCode;
  fieldErrors: Record<string, string>;

  constructor(code: WorkOrderCompletionErrorCode, message: string, field?: string) {
    super(message);
    this.name = "WorkOrderCompletionError";
    this.code = code;
    this.fieldErrors = field ? { [field]: message } : {};
  }
}

export interface WorkOrderCompletionContext {
  currentUser: UserProfile;
  users: UserProfile[];
  canAccess: (capability: string, resource?: { nursingHomeId?: string; wardId?: string }) => boolean;
  now?: string;
  organisationId?: string;
  homeId?: string;
}

export interface WorkOrderCompletionRelatedData {
  notes: WorkOrderNote[];
  attachments: WorkOrderAttachment[];
  labour: WorkOrderLabourEntry[];
  materials: WorkOrderMaterialEntry[];
}

export interface WorkOrderCompletionChecklistItem {
  key: string;
  label: string;
  description?: string;
  required: boolean;
  responseType: "YES_NO" | "YES_NO_NOT_APPLICABLE" | "CONFIRMATION";
  order: number;
  source: string;
  critical?: boolean;
  commentRequiredOnNo?: boolean;
}

export interface WorkOrderCompletionChecklistResponseInput {
  itemKey: string;
  response: WorkOrderCompletionChecklistResponse;
  comment?: string;
}

export interface WorkOrderCompletionInput {
  expectedVersion: number;
  workCompleted: string;
  outcome: WorkOrderCompletionOutcome;
  outcomeDetails?: string;
  outstandingIssues?: string;
  followUpRequired: boolean;
  followUpDetails?: string;
  checklistResponses: WorkOrderCompletionChecklistResponseInput[];
  selectedEvidenceIds: string[];
  labourReviewed: boolean;
  materialsReviewed: boolean;
  declarationAccepted: boolean;
  warningsAcknowledged: string[];
  idempotencyKey?: string;
}

export interface WorkOrderCompletionEligibility {
  allowed: boolean;
  blockers: Array<{ code: WorkOrderCompletionErrorCode | string; message: string; field?: string }>;
  warnings: Array<{ code: string; message: string; acknowledgementRequired: boolean }>;
  checklist: WorkOrderCompletionChecklistItem[];
  verificationRequired: boolean;
  verificationReasons: string[];
  verificationReasonCodes: string[];
  evidenceRequired: boolean;
  evidenceRequirementReason?: string;
  availableEvidence: WorkOrderAttachment[];
  workOrderVersion: number;
  totals: {
    labourMinutes: number;
    materialsCount: number;
    attachmentsCount: number;
    evidenceCount: number;
    progressNotesCount: number;
  };
}

export const WORK_ORDER_COMPLETION_OUTCOMES: Array<{ value: WorkOrderCompletionOutcome; label: string }> = [
  { value: "RESOLVED", label: "Resolved" },
  { value: "REPAIRED", label: "Repaired" },
  { value: "REPLACED", label: "Replaced" },
  { value: "TESTED_AND_WORKING", label: "Tested and Working" },
  { value: "TEMPORARY_REPAIR", label: "Temporary Repair" },
  { value: "NO_FAULT_FOUND", label: "No Fault Found" },
  { value: "REFERRED_FOR_FURTHER_WORK", label: "Referred for Further Work" },
  { value: "OTHER", label: "Other" },
];

const OUTCOMES = new Set(WORK_ORDER_COMPLETION_OUTCOMES.map((item) => item.value));
const DETAIL_OUTCOMES: WorkOrderCompletionOutcome[] = ["TEMPORARY_REPAIR", "REFERRED_FOR_FURTHER_WORK", "OTHER"];
const EVIDENCE_CATEGORIES: MaintenanceWorkOrderCategory[] = ["FIRE_SAFETY", "ELECTRICAL", "NURSE_CALL"];

export function evaluateWorkOrderCompletionEligibility(params: {
  workOrder?: MaintenanceWorkOrder;
  context: WorkOrderCompletionContext;
  related: WorkOrderCompletionRelatedData;
  completionRequest?: Partial<WorkOrderCompletionInput>;
}): WorkOrderCompletionEligibility {
  const record = params.workOrder;
  const blockers: WorkOrderCompletionEligibility["blockers"] = [];
  const warnings: WorkOrderCompletionEligibility["warnings"] = [];
  if (!record) {
    return emptyEligibility([{ code: "WORK_ORDER_NOT_FOUND", message: "The Work Order could not be found.", field: "workOrder" }]);
  }

  const userHomes = params.context.currentUser.facilityIds || (params.context.currentUser.facilityId ? [params.context.currentUser.facilityId] : []);
  const inHome = params.context.currentUser.role === "group_owner" || userHomes.length === 0 || userHomes.includes(record.homeId);
  if (!inHome || (params.context.homeId && params.context.homeId !== record.homeId)) blockers.push({ code: "OUT_OF_SCOPE", message: "This Work Order is outside your authorised Care Home scope.", field: "workOrder" });
  if (!params.context.canAccess("maintenance.work_orders.complete", { nursingHomeId: record.homeId, wardId: String(record.wardId || "") || undefined })) {
    blockers.push({ code: "PERMISSION_DENIED", message: "You do not have permission to complete this Work Order.", field: "permission" });
  }
  if (record.status !== "IN_PROGRESS") blockers.push({ code: "INVALID_STATUS", message: "Start the Work Order before completing it.", field: "status" });
  if (params.completionRequest?.expectedVersion !== undefined && params.completionRequest.expectedVersion !== record.version) {
    blockers.push({ code: "STALE_VERSION", message: "This Work Order changed while you were completing it. Review the latest details and try again.", field: "expectedVersion" });
  }

  const checklist = completionChecklistFor(record);
  const activeAttachments = params.related.attachments.filter((item) => !item.deletedAt && ["CLEAN", "NOT_AVAILABLE"].includes(item.scanStatus));
  const activeLabour = params.related.labour.filter((item) => !item.deletedAt);
  const activeMaterials = params.related.materials.filter((item) => !item.deletedAt);
  const risk = effectiveRisk(record);
  const verificationReasons = verificationReasonsFor(record, params.completionRequest);
  const verificationReasonCodes = verificationReasonCodesFor(record, params.completionRequest);
  const evidenceReason = evidenceRequirementReason(record, params.completionRequest);
  const requiredWarningCodes = warningList(record, activeLabour, activeMaterials, activeAttachments, params.related.notes);
  warnings.push(...requiredWarningCodes);

  return {
    allowed: blockers.length === 0,
    blockers,
    warnings,
    checklist,
    verificationRequired: verificationReasons.length > 0 || record.verificationRequired || risk === "HIGH" || risk === "CRITICAL",
    verificationReasons,
    verificationReasonCodes,
    evidenceRequired: Boolean(evidenceReason),
    evidenceRequirementReason: evidenceReason,
    availableEvidence: activeAttachments,
    workOrderVersion: record.version,
    totals: {
      labourMinutes: activeLabour.reduce((sum, item) => sum + item.durationMinutes, 0),
      materialsCount: activeMaterials.length,
      attachmentsCount: activeAttachments.length,
      evidenceCount: activeAttachments.filter((item) => item.isEvidence).length,
      progressNotesCount: params.related.notes.filter((item) => !item.deletedAt).length,
    },
  };
}

export function createWorkOrderCompletionRecord(params: {
  workOrder: MaintenanceWorkOrder;
  input: WorkOrderCompletionInput;
  context: WorkOrderCompletionContext;
  related: WorkOrderCompletionRelatedData;
  id: string;
}) {
  const now = params.context.now || new Date().toISOString();
  const eligibility = evaluateWorkOrderCompletionEligibility({
    workOrder: params.workOrder,
    context: params.context,
    related: params.related,
    completionRequest: params.input,
  });
  if (eligibility.blockers.length) throw completionIssue(eligibility.blockers[0]);

  const workCompleted = safeText(params.input.workCompleted, 5, 3000, "WORK_COMPLETED_REQUIRED", "Describe the work completed.", "workCompleted");
  if (!OUTCOMES.has(params.input.outcome)) throw new WorkOrderCompletionError("CHECKLIST_INVALID", "Select a valid completion outcome.", "outcome");
  if (DETAIL_OUTCOMES.includes(params.input.outcome) && !params.input.outcomeDetails?.trim()) {
    throw new WorkOrderCompletionError("OUTCOME_DETAILS_REQUIRED", "Explain this completion outcome.", "outcomeDetails");
  }
  if (params.input.followUpRequired && !params.input.followUpDetails?.trim()) {
    throw new WorkOrderCompletionError("FOLLOW_UP_DETAILS_REQUIRED", "Enter follow-up details before completing.", "followUpDetails");
  }
  if (!params.input.declarationAccepted) throw new WorkOrderCompletionError("DECLARATION_REQUIRED", "Accept the completion declaration.", "declarationAccepted");

  const snapshot = validateChecklist(eligibility.checklist, params.input.checklistResponses);
  const selectedEvidence = validateEvidence(params.input.selectedEvidenceIds, eligibility.availableEvidence);
  if (eligibility.evidenceRequired && selectedEvidence.length === 0) {
    throw new WorkOrderCompletionError("EVIDENCE_REQUIRED", eligibility.evidenceRequirementReason || "Select completion evidence before submitting.", "selectedEvidenceIds");
  }
  const missingWarning = eligibility.warnings.find((warning) => warning.acknowledgementRequired && !params.input.warningsAcknowledged.includes(warning.code));
  if (missingWarning) throw new WorkOrderCompletionError("WARNING_ACKNOWLEDGEMENT_REQUIRED", `Acknowledge warning: ${missingWarning.message}`, "warningsAcknowledged");

  const resultingStatus = eligibility.verificationRequired ? "VERIFICATION_REQUIRED" : "COMPLETED";
  return {
    id: params.id,
    workOrderId: params.workOrder.id,
    workOrderNumber: params.workOrder.workOrderNumber,
    organisationId: organisationId(params.workOrder),
    homeId: params.workOrder.homeId,
    completedByUserId: params.context.currentUser.id,
    completedAt: now,
    workCompleted,
    outcome: params.input.outcome,
    outcomeDetails: clean(params.input.outcomeDetails),
    outstandingIssues: clean(params.input.outstandingIssues),
    followUpRequired: Boolean(params.input.followUpRequired),
    followUpDetails: clean(params.input.followUpDetails),
    checklist: snapshot,
    selectedEvidenceIds: selectedEvidence.map((item) => item.id),
    labourReviewed: Boolean(params.input.labourReviewed),
    materialsReviewed: Boolean(params.input.materialsReviewed),
    declarationAccepted: true,
    verificationRequired: eligibility.verificationRequired,
    verificationStatus: eligibility.verificationRequired ? "PENDING" : "NOT_REQUIRED",
    verificationReasons: eligibility.verificationReasons,
    verificationRequiredSnapshot: eligibility.verificationRequired,
    verificationReasonCodes: eligibility.verificationReasonCodes,
    verificationRuleVersion: "maintenance-verification-v1",
    verificationEvaluatedAt: now,
    verificationAssignmentStatus: eligibility.verificationRequired ? "UNASSIGNED" : "COMPLETED",
    warningsAcknowledged: params.input.warningsAcknowledged,
    previousStatus: params.workOrder.status,
    resultingStatus,
    workOrderVersionBefore: params.workOrder.version,
    workOrderVersionAfter: params.workOrder.version + 1,
    version: 1,
    lastRequestId: params.input.idempotencyKey,
  } satisfies WorkOrderCompletionRecord;
}

export function workOrderCompletionAuditLog(params: {
  record: MaintenanceWorkOrder;
  completion: WorkOrderCompletionRecord;
  user: UserProfile;
  id: string;
  timestamp: string;
}) {
  return {
    id: params.id,
    facilityId: params.record.homeId,
    user: params.user.name,
    role: params.user.role,
    action: params.completion.verificationRequired ? "WORK_ORDER_SUBMITTED_FOR_VERIFICATION" : "WORK_ORDER_COMPLETED",
    entity: params.completion.id,
    entityType: "work_order_completion",
    timestamp: params.timestamp,
    before: JSON.stringify({ status: params.completion.previousStatus, version: params.completion.workOrderVersionBefore }),
    after: JSON.stringify({
      status: params.completion.resultingStatus,
      version: params.completion.workOrderVersionAfter,
      outcome: params.completion.outcome,
      evidenceCount: params.completion.selectedEvidenceIds.length,
      checklistCount: params.completion.checklist.length,
      verificationRequired: params.completion.verificationRequired,
      verificationReasons: params.completion.verificationReasons,
    }),
    reason: params.completion.workCompleted,
  } satisfies AuditLog;
}

export function completionOutcomeLabel(value?: WorkOrderCompletionOutcome) {
  return WORK_ORDER_COMPLETION_OUTCOMES.find((item) => item.value === value)?.label || value || "Not recorded";
}

function completionChecklistFor(record: MaintenanceWorkOrder): WorkOrderCompletionChecklistItem[] {
  const items: WorkOrderCompletionChecklistItem[] = [
    item("WORK_COMPLETED", "The requested work has been completed.", true, 1, "universal", "CONFIRMATION"),
    item("WORK_AREA_SAFE", "The work area has been left safe.", true, 2, "universal", "YES_NO", true),
    item("TOOLS_REMOVED", "Tools and temporary equipment have been removed.", true, 3),
    item("WASTE_REMOVED", "Waste and debris have been removed.", true, 4),
    item("TESTED_WHERE_APPLICABLE", "The affected equipment or area has been tested where applicable.", false, 5, "universal", "YES_NO_NOT_APPLICABLE"),
    item("SAFETY_CONTROLS_RESTORED", "Safety controls or isolations have been restored where applicable.", true, 6, "universal", "YES_NO_NOT_APPLICABLE", true),
    item("STAFF_INFORMED", "Relevant staff have been informed where required.", false, 7, "universal", "YES_NO_NOT_APPLICABLE"),
    item("LABOUR_REVIEWED", "Labour used has been reviewed.", true, 8),
    item("MATERIALS_REVIEWED", "Materials used have been reviewed.", true, 9),
    item("OUTSTANDING_RECORDED", "Outstanding issues and follow-up requirements have been recorded.", true, 10),
  ];
  if (record.category === "ELECTRICAL") items.push(item("ELECTRICAL_TESTED", "Electrical supply and equipment have been restored and tested safely.", true, 20, "category:ELECTRICAL", "YES_NO", true));
  if (record.category === "FIRE_SAFETY") items.push(item("FIRE_SYSTEM_RETESTED", "Fire safety system, door or alarm has been retested and impairment removed.", true, 20, "category:FIRE_SAFETY", "YES_NO", true));
  if (record.category === "NURSE_CALL") items.push(item("NURSE_CALL_TESTED", "Call point and reset function have been tested with nursing staff informed.", true, 20, "category:NURSE_CALL", "YES_NO", true));
  if (record.category === "WATER_SAFETY" || record.category === "PLUMBING") items.push(item("WATER_SAFE", "Leaks checked, supply restored and affected area left dry.", true, 20, "category:WATER", "YES_NO", true));
  return items.sort((a, b) => a.order - b.order);
}

function validateChecklist(definitions: WorkOrderCompletionChecklistItem[], responses: WorkOrderCompletionChecklistResponseInput[]) {
  const byKey = new Map(responses.map((response) => [response.itemKey, response]));
  responses.forEach((response) => {
    if (!definitions.some((definition) => definition.key === response.itemKey)) {
      throw new WorkOrderCompletionError("CHECKLIST_INVALID", "A checklist response is not valid for this Work Order.", "checklistResponses");
    }
  });
  return definitions.map((definition) => {
    const response = byKey.get(definition.key);
    if (definition.required && !response) throw new WorkOrderCompletionError("CHECKLIST_INCOMPLETE", `Complete checklist item: ${definition.label}`, definition.key);
    const value = response?.response;
    if (definition.required && !value) throw new WorkOrderCompletionError("CHECKLIST_INCOMPLETE", `Complete checklist item: ${definition.label}`, definition.key);
    if (value === "NOT_APPLICABLE" && definition.responseType !== "YES_NO_NOT_APPLICABLE") throw new WorkOrderCompletionError("CHECKLIST_INVALID", "Not applicable is not allowed for this checklist item.", definition.key);
    if (definition.critical && value === "NO") throw new WorkOrderCompletionError("CHECKLIST_INCOMPLETE", `${definition.label} must be confirmed before completion.`, definition.key);
    if (definition.commentRequiredOnNo && value === "NO" && !response?.comment?.trim()) throw new WorkOrderCompletionError("CHECKLIST_INCOMPLETE", "Explain the negative checklist response.", definition.key);
    return {
      itemKey: definition.key,
      label: definition.label,
      required: definition.required,
      response: value || "NOT_APPLICABLE",
      comment: clean(response?.comment),
      source: definition.source,
      order: definition.order,
    } satisfies WorkOrderCompletionChecklistSnapshot;
  });
}

function validateEvidence(ids: string[], available: WorkOrderAttachment[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const selected = unique.map((id) => available.find((item) => item.id === id));
  if (selected.some((item) => !item)) throw new WorkOrderCompletionError("EVIDENCE_INVALID", "Selected evidence is not available for this Work Order.", "selectedEvidenceIds");
  return selected as WorkOrderAttachment[];
}

function evidenceRequirementReason(record: MaintenanceWorkOrder, input?: Partial<WorkOrderCompletionInput>) {
  if (record.priority === "CRITICAL" || record.priority === "HIGH") return "High priority Work Orders require completion evidence.";
  const risk = effectiveRisk(record);
  if (risk === "CRITICAL" || risk === "HIGH") return "High risk Work Orders require completion evidence.";
  if (EVIDENCE_CATEGORIES.includes(record.category)) return "This Work Order category requires completion evidence.";
  if (input?.outcome === "TEMPORARY_REPAIR") return "Temporary repairs require completion evidence.";
  return undefined;
}

function verificationReasonsFor(record: MaintenanceWorkOrder, input?: Partial<WorkOrderCompletionInput>) {
  const reasons: string[] = [];
  const risk = effectiveRisk(record);
  if (record.verificationRequired) reasons.push("Verification was required when the Work Order was created.");
  if (record.priority === "CRITICAL" || record.priority === "HIGH") reasons.push("High priority Work Order.");
  if (risk === "CRITICAL" || risk === "HIGH") reasons.push("High risk Work Order.");
  if (record.category === "FIRE_SAFETY") reasons.push("Fire safety work requires review.");
  if (input?.outcome === "TEMPORARY_REPAIR") reasons.push("Temporary repair requires follow-up review.");
  if (input?.followUpRequired) reasons.push("Follow-up has been indicated.");
  return Array.from(new Set(reasons));
}

function verificationReasonCodesFor(record: MaintenanceWorkOrder, input?: Partial<WorkOrderCompletionInput>) {
  const codes: string[] = [];
  const risk = effectiveRisk(record);
  if (record.verificationRequired) codes.push("MANUAL_VERIFICATION_REQUEST");
  if (record.priority === "CRITICAL") codes.push("CRITICAL_PRIORITY");
  if (record.priority === "HIGH") codes.push("HIGH_PRIORITY");
  if (risk === "CRITICAL") codes.push("CRITICAL_RISK_WORK");
  if (risk === "HIGH") codes.push("HIGH_RISK_WORK");
  if (record.category === "FIRE_SAFETY") codes.push("FIRE_SAFETY_WORK");
  if (record.category === "ELECTRICAL") codes.push("ELECTRICAL_WORK");
  if (record.category === "WATER_SAFETY" || record.category === "PLUMBING") codes.push("WATER_SAFETY_WORK");
  if (record.category === "NURSE_CALL") codes.push("NURSE_CALL_WORK");
  if (record.residentSafetyImpact) codes.push("RESIDENT_SAFETY_IMPACT");
  if (record.locationType === "RESIDENT_ROOM") codes.push("RESIDENT_ROOM_WORK");
  if (record.complianceImpact) codes.push("COMPLIANCE_IMPACT");
  if (input?.outcome === "TEMPORARY_REPAIR") codes.push("TEMPORARY_REPAIR");
  if (input?.followUpRequired) codes.push("FOLLOW_UP_REQUIRED");
  return Array.from(new Set(codes));
}

function warningList(record: MaintenanceWorkOrder, labour: WorkOrderLabourEntry[], materials: WorkOrderMaterialEntry[], attachments: WorkOrderAttachment[], notes: WorkOrderNote[]) {
  const warnings: WorkOrderCompletionEligibility["warnings"] = [];
  if (labour.length === 0) warnings.push({ code: "NO_LABOUR_RECORDED", message: "No labour has been recorded.", acknowledgementRequired: true });
  if (materials.length === 0) warnings.push({ code: "NO_MATERIALS_RECORDED", message: "No materials have been recorded.", acknowledgementRequired: false });
  if (attachments.length === 0) warnings.push({ code: "NO_ATTACHMENTS", message: "No files or photos have been attached.", acknowledgementRequired: false });
  if (notes.filter((item) => !item.deletedAt).length === 0) warnings.push({ code: "NO_PROGRESS_NOTES", message: "No work notes have been recorded.", acknowledgementRequired: false });
  if (isWorkOrderOverdue(record)) warnings.push({ code: "WORK_ORDER_OVERDUE", message: "This Work Order is overdue.", acknowledgementRequired: true });
  return warnings;
}

function item(key: string, label: string, required: boolean, order: number, source = "universal", responseType: WorkOrderCompletionChecklistItem["responseType"] = "CONFIRMATION", critical = false): WorkOrderCompletionChecklistItem {
  return { key, label, required, order, source, responseType, critical, commentRequiredOnNo: critical };
}

function emptyEligibility(blockers: WorkOrderCompletionEligibility["blockers"]): WorkOrderCompletionEligibility {
  return { allowed: false, blockers, warnings: [], checklist: [], verificationRequired: false, verificationReasons: [], verificationReasonCodes: [], evidenceRequired: false, availableEvidence: [], workOrderVersion: 0, totals: { labourMinutes: 0, materialsCount: 0, attachmentsCount: 0, evidenceCount: 0, progressNotesCount: 0 } };
}

function completionIssue(issue: WorkOrderCompletionEligibility["blockers"][number]) {
  return new WorkOrderCompletionError(issue.code as WorkOrderCompletionErrorCode, issue.message, issue.field);
}

function effectiveRisk(record: MaintenanceWorkOrder) {
  return record.riskAssessment?.manualOverrideLevel || record.riskAssessment?.calculatedLevel || record.riskLevel;
}

function organisationId(record: MaintenanceWorkOrder) {
  return record.organisationId || record.providerId || String(record.enterpriseId || "");
}

function safeText(value: string | undefined, min: number, max: number, code: WorkOrderCompletionErrorCode, message: string, field: string) {
  const text = clean(value);
  if (!text || text.length < min) throw new WorkOrderCompletionError(code, message, field);
  if (text.length > max) throw new WorkOrderCompletionError("CHECKLIST_INVALID", `Keep this field under ${max} characters.`, field);
  return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
