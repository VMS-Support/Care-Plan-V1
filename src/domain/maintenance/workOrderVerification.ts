import type {
  AuditLog,
  MaintenanceWorkOrder,
  UserProfile,
  WorkOrderAttachment,
  WorkOrderCompletionRecord,
  WorkOrderVerificationChecklistResponse,
  WorkOrderVerificationChecklistSnapshot,
  WorkOrderVerificationRecord,
  WorkOrderVerificationRejectionReason,
} from "@/lib/care/types";
import { can } from "../../lib/care/permissions.ts";

export type WorkOrderVerificationErrorCode =
  | "WORK_ORDER_NOT_FOUND"
  | "COMPLETION_NOT_FOUND"
  | "PERMISSION_DENIED"
  | "OUT_OF_SCOPE"
  | "INVALID_STATUS"
  | "STALE_VERSION"
  | "INVALID_VERIFIER"
  | "ASSIGNMENT_CONFLICT"
  | "SEPARATION_OF_DUTIES"
  | "VERIFICATION_NOT_PENDING"
  | "CHECKLIST_INCOMPLETE"
  | "CHECKLIST_INVALID"
  | "EVIDENCE_REQUIRED"
  | "EVIDENCE_INVALID"
  | "NOTES_REQUIRED"
  | "REJECTION_REASON_REQUIRED"
  | "CORRECTIVE_ACTION_REQUIRED"
  | "DECLARATION_REQUIRED"
  | "DUPLICATE_REQUEST";

export class WorkOrderVerificationError extends Error {
  code: WorkOrderVerificationErrorCode;
  fieldErrors: Record<string, string>;

  constructor(code: WorkOrderVerificationErrorCode, message: string, field?: string) {
    super(message);
    this.name = "WorkOrderVerificationError";
    this.code = code;
    this.fieldErrors = field ? { [field]: message } : {};
  }
}

export interface WorkOrderVerificationContext {
  currentUser: UserProfile;
  users: UserProfile[];
  canAccess: (capability: string, resource?: { nursingHomeId?: string; wardId?: string }) => boolean;
  now?: string;
  organisationId?: string;
  homeId?: string;
}

export interface WorkOrderVerificationRelatedData {
  attachments: WorkOrderAttachment[];
}

export interface WorkOrderVerificationChecklistItem {
  key: string;
  label: string;
  required: boolean;
  responseType: "YES_NO" | "YES_NO_NOT_APPLICABLE" | "CONFIRMATION";
  order: number;
  source: string;
  critical?: boolean;
  commentRequiredOnNo?: boolean;
}

export interface WorkOrderVerificationChecklistResponseInput {
  itemKey: string;
  response: WorkOrderVerificationChecklistResponse;
  comment?: string;
}

export interface VerificationAssignmentInput {
  expectedWorkOrderVersion: number;
  expectedCompletionVersion: number;
  verifierUserId?: string;
  reason?: string;
  idempotencyKey?: string;
}

export interface WorkOrderVerifyInput {
  expectedWorkOrderVersion: number;
  expectedCompletionVersion: number;
  verificationNotes: string;
  checklistResponses: WorkOrderVerificationChecklistResponseInput[];
  verificationEvidenceIds: string[];
  declarationAccepted: boolean;
  warningsAcknowledged: string[];
  idempotencyKey?: string;
}

export interface WorkOrderRejectVerificationInput {
  expectedWorkOrderVersion: number;
  expectedCompletionVersion: number;
  rejectionReasons: WorkOrderVerificationRejectionReason[];
  rejectionNotes: string;
  correctiveActionRequired: string;
  safetyInstructions?: string;
  evidenceRequiredForResubmission: boolean;
  evidenceInstructions?: string;
  verificationEvidenceIds: string[];
  declarationAccepted: boolean;
  idempotencyKey?: string;
}

export interface WorkOrderVerificationEligibility {
  allowed: boolean;
  blockers: Array<{ code: WorkOrderVerificationErrorCode | string; message: string; field?: string }>;
  warnings: Array<{ code: string; message: string; acknowledgementRequired: boolean }>;
  verificationRequired: boolean;
  verificationReasons: string[];
  assignedVerifier: UserProfile | null;
  canClaim: boolean;
  canAssign: boolean;
  canRelease: boolean;
  canVerify: boolean;
  canReject: boolean;
  separationOfDutiesSatisfied: boolean;
  requiredChecklistItems: WorkOrderVerificationChecklistItem[];
  requiredEvidenceRules: string[];
  availableEvidence: WorkOrderAttachment[];
  eligibleVerifiers: UserProfile[];
  expectedWorkOrderVersion: number;
  expectedCompletionVersion: number;
}

export const WORK_ORDER_VERIFICATION_REJECTION_REASONS: Array<{ value: WorkOrderVerificationRejectionReason; label: string }> = [
  { value: "WORK_INCOMPLETE", label: "Work incomplete" },
  { value: "EVIDENCE_INSUFFICIENT", label: "Evidence insufficient" },
  { value: "CHECKLIST_CONCERN", label: "Checklist concern" },
  { value: "SAFETY_CONCERN", label: "Safety concern" },
  { value: "QUALITY_CONCERN", label: "Quality concern" },
  { value: "FOLLOW_UP_REQUIRED", label: "Follow-up required" },
  { value: "OTHER", label: "Other" },
];

const REJECTION_REASON_VALUES = new Set(WORK_ORDER_VERIFICATION_REJECTION_REASONS.map((item) => item.value));
const VERIFICATION_RULE_VERSION = "maintenance-verification-v1";

export function evaluateVerificationEligibility(params: {
  workOrder?: MaintenanceWorkOrder;
  completion?: WorkOrderCompletionRecord;
  context: WorkOrderVerificationContext;
  relatedData: WorkOrderVerificationRelatedData;
  verificationRequest?: Partial<WorkOrderVerifyInput | WorkOrderRejectVerificationInput | VerificationAssignmentInput>;
}): WorkOrderVerificationEligibility {
  const record = params.workOrder;
  const completion = params.completion;
  const blockers: WorkOrderVerificationEligibility["blockers"] = [];
  const warnings: WorkOrderVerificationEligibility["warnings"] = [];
  if (!record) return emptyEligibility([{ code: "WORK_ORDER_NOT_FOUND", message: "The Work Order could not be found.", field: "workOrder" }]);
  if (!completion) return emptyEligibility([{ code: "COMPLETION_NOT_FOUND", message: "A pending completion record could not be found.", field: "completion" }], record.version);

  const homeScope = userInHome(params.context.currentUser, record.homeId) || params.context.currentUser.role === "group_owner";
  if (!homeScope || (params.context.homeId && params.context.homeId !== record.homeId)) blockers.push({ code: "OUT_OF_SCOPE", message: "This Work Order is outside your authorised Care Home scope.", field: "workOrder" });
  if (record.status !== "VERIFICATION_REQUIRED") blockers.push({ code: "INVALID_STATUS", message: "This Work Order is not awaiting verification.", field: "status" });
  if (!completion.verificationRequired || completion.verificationStatus !== "PENDING") blockers.push({ code: "VERIFICATION_NOT_PENDING", message: "This completion is not pending verification.", field: "completion" });
  if (params.verificationRequest?.expectedWorkOrderVersion !== undefined && params.verificationRequest.expectedWorkOrderVersion !== record.version) {
    blockers.push({ code: "STALE_VERSION", message: "This Work Order changed while verification was open. Review the latest details and try again.", field: "expectedWorkOrderVersion" });
  }
  if (params.verificationRequest?.expectedCompletionVersion !== undefined && params.verificationRequest.expectedCompletionVersion !== completion.version) {
    blockers.push({ code: "STALE_VERSION", message: "This completion changed while verification was open. Review the latest details and try again.", field: "expectedCompletionVersion" });
  }

  const canAssign = params.context.canAccess("maintenance.work_orders.verification.assign", { nursingHomeId: record.homeId });
  const canClaimCapability = params.context.canAccess("maintenance.work_orders.verification.claim", { nursingHomeId: record.homeId });
  const canVerifyCapability = params.context.canAccess("maintenance.work_orders.verification.verify", { nursingHomeId: record.homeId });
  const canRejectCapability = params.context.canAccess("maintenance.work_orders.verification.reject", { nursingHomeId: record.homeId });
  const assignedVerifier = completion.verifierUserId ? params.context.users.find((user) => user.id === completion.verifierUserId) || null : null;
  const assignedToMe = completion.verifierUserId === params.context.currentUser.id;
  const unassigned = !completion.verifierUserId || completion.verificationAssignmentStatus === "UNASSIGNED" || completion.verificationAssignmentStatus === "RELEASED";
  const separationOfDutiesSatisfied = completion.completedByUserId !== params.context.currentUser.id;
  const currentUserEligible = isEligibleVerifier(params.context.currentUser, record, completion, params.context);
  const canClaim = canClaimCapability && unassigned && currentUserEligible;
  const canActOnAssignment = assignedToMe || unassigned || canAssign;
  const canVerify = canVerifyCapability && currentUserEligible && canActOnAssignment;
  const canReject = canRejectCapability && currentUserEligible && canActOnAssignment;

  if ((canVerifyCapability || canRejectCapability || canClaimCapability) && !separationOfDutiesSatisfied) {
    warnings.push({ code: "SEPARATION_OF_DUTIES", message: "The completing user cannot verify their own Work Order.", acknowledgementRequired: false });
  }
  if (completion.followUpRequired) warnings.push({ code: "FOLLOW_UP_RECORDED", message: "The completion recorded follow-up requirements.", acknowledgementRequired: true });
  if (completion.outcome === "TEMPORARY_REPAIR") warnings.push({ code: "TEMPORARY_REPAIR", message: "The completion outcome was a temporary repair.", acknowledgementRequired: true });
  if (unassigned) warnings.push({ code: "UNASSIGNED_VERIFICATION", message: "No verifier is currently assigned.", acknowledgementRequired: false });
  if (assignedVerifier && assignedVerifier.status !== "active") warnings.push({ code: "ASSIGNED_VERIFIER_INACTIVE", message: "The assigned verifier is no longer active.", acknowledgementRequired: false });

  const availableEvidence = params.relatedData.attachments.filter((item) => item.workOrderId === record.id && !item.deletedAt && ["CLEAN", "NOT_AVAILABLE"].includes(item.scanStatus));
  const requiredEvidenceRules = verificationEvidenceRules(record, completion);

  return {
    allowed: blockers.length === 0,
    blockers,
    warnings,
    verificationRequired: completion.verificationRequired,
    verificationReasons: completion.verificationReasons,
    assignedVerifier,
    canClaim,
    canAssign,
    canRelease: canAssign && Boolean(completion.verifierUserId),
    canVerify,
    canReject,
    separationOfDutiesSatisfied,
    requiredChecklistItems: verificationChecklistFor(record, completion),
    requiredEvidenceRules,
    availableEvidence,
    eligibleVerifiers: params.context.users.filter((user) => isEligibleVerifier(user, record, completion, params.context)),
    expectedWorkOrderVersion: record.version,
    expectedCompletionVersion: completion.version,
  };
}

export function assignWorkOrderVerification(params: {
  workOrder: MaintenanceWorkOrder;
  completion: WorkOrderCompletionRecord;
  input: VerificationAssignmentInput;
  context: WorkOrderVerificationContext;
  id: string;
}) {
  const eligibility = evaluateVerificationEligibility({ workOrder: params.workOrder, completion: params.completion, context: params.context, relatedData: { attachments: [] }, verificationRequest: params.input });
  if (eligibility.blockers.length) throw verificationIssue(eligibility.blockers[0]);
  if (!eligibility.canAssign) throw new WorkOrderVerificationError("PERMISSION_DENIED", "You do not have permission to assign verification.", "permission");
  const verifier = params.context.users.find((user) => user.id === params.input.verifierUserId);
  if (!verifier || !isEligibleVerifier(verifier, params.workOrder, params.completion, params.context)) throw new WorkOrderVerificationError("INVALID_VERIFIER", "Select an eligible verifier for this Work Order.", "verifierUserId");
  if (params.completion.verifierUserId === verifier.id) throw new WorkOrderVerificationError("ASSIGNMENT_CONFLICT", "This verifier is already assigned.", "verifierUserId");
  const now = params.context.now || new Date().toISOString();
  return {
    ...params.completion,
    verifierUserId: verifier.id,
    verificationAssignedAt: now,
    verificationAssignedByUserId: params.context.currentUser.id,
    verificationAssignmentStatus: "ASSIGNED" as const,
    version: params.completion.version + 1,
    lastRequestId: params.input.idempotencyKey,
  };
}

export function claimWorkOrderVerification(params: {
  workOrder: MaintenanceWorkOrder;
  completion: WorkOrderCompletionRecord;
  input: VerificationAssignmentInput;
  context: WorkOrderVerificationContext;
}) {
  const eligibility = evaluateVerificationEligibility({ workOrder: params.workOrder, completion: params.completion, context: params.context, relatedData: { attachments: [] }, verificationRequest: params.input });
  if (eligibility.blockers.length) throw verificationIssue(eligibility.blockers[0]);
  if (!eligibility.canClaim) throw new WorkOrderVerificationError("ASSIGNMENT_CONFLICT", "This verification cannot be claimed by the current user.", "assignment");
  const now = params.context.now || new Date().toISOString();
  return {
    ...params.completion,
    verifierUserId: params.context.currentUser.id,
    verificationAssignedAt: params.completion.verificationAssignedAt || now,
    verificationAssignedByUserId: params.completion.verificationAssignedByUserId || params.context.currentUser.id,
    verificationAcceptedAt: now,
    verificationAssignmentStatus: "CLAIMED" as const,
    version: params.completion.version + 1,
    lastRequestId: params.input.idempotencyKey,
  };
}

export function releaseWorkOrderVerification(params: {
  workOrder: MaintenanceWorkOrder;
  completion: WorkOrderCompletionRecord;
  input: VerificationAssignmentInput;
  context: WorkOrderVerificationContext;
}) {
  const eligibility = evaluateVerificationEligibility({ workOrder: params.workOrder, completion: params.completion, context: params.context, relatedData: { attachments: [] }, verificationRequest: params.input });
  if (eligibility.blockers.length) throw verificationIssue(eligibility.blockers[0]);
  if (!eligibility.canRelease) throw new WorkOrderVerificationError("PERMISSION_DENIED", "You do not have permission to release verification assignment.", "permission");
  return {
    ...params.completion,
    verifierUserId: undefined,
    verificationAssignmentStatus: "RELEASED" as const,
    version: params.completion.version + 1,
    lastRequestId: params.input.idempotencyKey,
  };
}

export function createWorkOrderVerificationRecord(params: {
  workOrder: MaintenanceWorkOrder;
  completion: WorkOrderCompletionRecord;
  input: WorkOrderVerifyInput;
  context: WorkOrderVerificationContext;
  relatedData: WorkOrderVerificationRelatedData;
  id: string;
}) {
  const eligibility = evaluateVerificationEligibility({ workOrder: params.workOrder, completion: params.completion, context: params.context, relatedData: params.relatedData, verificationRequest: params.input });
  if (eligibility.blockers.length) throw verificationIssue(eligibility.blockers[0]);
  if (!eligibility.separationOfDutiesSatisfied) throw new WorkOrderVerificationError("SEPARATION_OF_DUTIES", "The completing user cannot verify their own Work Order.", "verifiedByUserId");
  if (!eligibility.canVerify) throw new WorkOrderVerificationError("PERMISSION_DENIED", "You do not have permission to verify this Work Order.", "permission");
  const notes = safeText(params.input.verificationNotes, 5, 2000, "NOTES_REQUIRED", "Enter verification notes.", "verificationNotes");
  if (!params.input.declarationAccepted) throw new WorkOrderVerificationError("DECLARATION_REQUIRED", "Accept the verification declaration.", "declarationAccepted");
  const checklist = validateChecklist(eligibility.requiredChecklistItems, params.input.checklistResponses, true);
  const evidence = validateEvidence(params.input.verificationEvidenceIds, eligibility.availableEvidence);
  if (eligibility.requiredEvidenceRules.length > 0 && evidence.length === 0) throw new WorkOrderVerificationError("EVIDENCE_REQUIRED", "Select verification evidence before verifying this Work Order.", "verificationEvidenceIds");
  const missingWarning = eligibility.warnings.find((warning) => warning.acknowledgementRequired && !params.input.warningsAcknowledged.includes(warning.code));
  if (missingWarning) throw new WorkOrderVerificationError("CHECKLIST_INVALID", `Acknowledge warning: ${missingWarning.message}`, "warningsAcknowledged");
  const now = params.context.now || new Date().toISOString();
  return {
    id: params.id,
    workOrderId: params.workOrder.id,
    workOrderNumber: params.workOrder.workOrderNumber,
    completionId: params.completion.id,
    completionVersion: params.completion.version,
    organisationId: organisationId(params.workOrder),
    homeId: params.workOrder.homeId,
    result: "VERIFIED",
    reviewedByUserId: params.context.currentUser.id,
    reviewedAt: now,
    verificationNotes: notes,
    checklist,
    verificationEvidenceIds: evidence.map((item) => item.id),
    declarationAccepted: true,
    previousWorkOrderStatus: params.workOrder.status,
    resultingWorkOrderStatus: "VERIFIED",
    workOrderVersionBefore: params.workOrder.version,
    workOrderVersionAfter: params.workOrder.version + 1,
    completionVersionBefore: params.completion.version,
    completionVersionAfter: params.completion.version + 1,
    version: 1,
    lastRequestId: params.input.idempotencyKey,
  } satisfies WorkOrderVerificationRecord;
}

export function createWorkOrderVerificationRejectionRecord(params: {
  workOrder: MaintenanceWorkOrder;
  completion: WorkOrderCompletionRecord;
  input: WorkOrderRejectVerificationInput;
  context: WorkOrderVerificationContext;
  relatedData: WorkOrderVerificationRelatedData;
  id: string;
}) {
  const eligibility = evaluateVerificationEligibility({ workOrder: params.workOrder, completion: params.completion, context: params.context, relatedData: params.relatedData, verificationRequest: params.input });
  if (eligibility.blockers.length) throw verificationIssue(eligibility.blockers[0]);
  if (!eligibility.separationOfDutiesSatisfied) throw new WorkOrderVerificationError("SEPARATION_OF_DUTIES", "The completing user cannot reject their own completion.", "rejectedByUserId");
  if (!eligibility.canReject) throw new WorkOrderVerificationError("PERMISSION_DENIED", "You do not have permission to reject verification.", "permission");
  const reasons = Array.from(new Set(params.input.rejectionReasons || []));
  if (reasons.length === 0 || reasons.some((reason) => !REJECTION_REASON_VALUES.has(reason))) throw new WorkOrderVerificationError("REJECTION_REASON_REQUIRED", "Select at least one valid rejection reason.", "rejectionReasons");
  if (reasons.includes("OTHER") && !params.input.rejectionNotes.trim()) throw new WorkOrderVerificationError("NOTES_REQUIRED", "Explain the other rejection reason.", "rejectionNotes");
  const rejectionNotes = safeText(params.input.rejectionNotes, 5, 2000, "NOTES_REQUIRED", "Enter rejection notes.", "rejectionNotes");
  const correctiveAction = safeText(params.input.correctiveActionRequired, 5, 2000, "CORRECTIVE_ACTION_REQUIRED", "Enter the corrective action required.", "correctiveActionRequired");
  if (reasons.includes("SAFETY_CONCERN") && !params.input.safetyInstructions?.trim()) throw new WorkOrderVerificationError("CORRECTIVE_ACTION_REQUIRED", "Enter safety instructions for this rejection.", "safetyInstructions");
  if (params.input.evidenceRequiredForResubmission && !params.input.evidenceInstructions?.trim()) throw new WorkOrderVerificationError("EVIDENCE_REQUIRED", "Enter evidence instructions for resubmission.", "evidenceInstructions");
  if (!params.input.declarationAccepted) throw new WorkOrderVerificationError("DECLARATION_REQUIRED", "Accept the rejection declaration.", "declarationAccepted");
  const evidence = validateEvidence(params.input.verificationEvidenceIds, eligibility.availableEvidence);
  const now = params.context.now || new Date().toISOString();
  return {
    id: params.id,
    workOrderId: params.workOrder.id,
    workOrderNumber: params.workOrder.workOrderNumber,
    completionId: params.completion.id,
    completionVersion: params.completion.version,
    organisationId: organisationId(params.workOrder),
    homeId: params.workOrder.homeId,
    result: "REJECTED",
    reviewedByUserId: params.context.currentUser.id,
    reviewedAt: now,
    rejectionReasons: reasons,
    rejectionNotes,
    correctiveActionRequired: correctiveAction,
    safetyInstructions: clean(params.input.safetyInstructions),
    evidenceRequiredForResubmission: Boolean(params.input.evidenceRequiredForResubmission),
    evidenceInstructions: clean(params.input.evidenceInstructions),
    checklist: [],
    verificationEvidenceIds: evidence.map((item) => item.id),
    declarationAccepted: true,
    previousWorkOrderStatus: params.workOrder.status,
    resultingWorkOrderStatus: "IN_PROGRESS",
    workOrderVersionBefore: params.workOrder.version,
    workOrderVersionAfter: params.workOrder.version + 1,
    completionVersionBefore: params.completion.version,
    completionVersionAfter: params.completion.version + 1,
    version: 1,
    lastRequestId: params.input.idempotencyKey,
  } satisfies WorkOrderVerificationRecord;
}

export function applyVerificationResultToCompletion(completion: WorkOrderCompletionRecord, verification: WorkOrderVerificationRecord) {
  return {
    ...completion,
    verificationStatus: verification.result,
    verificationAssignmentStatus: "COMPLETED" as const,
    verifiedAt: verification.result === "VERIFIED" ? verification.reviewedAt : completion.verifiedAt,
    verifiedByUserId: verification.result === "VERIFIED" ? verification.reviewedByUserId : completion.verifiedByUserId,
    rejectedAt: verification.result === "REJECTED" ? verification.reviewedAt : completion.rejectedAt,
    rejectedByUserId: verification.result === "REJECTED" ? verification.reviewedByUserId : completion.rejectedByUserId,
    latestVerificationId: verification.id,
    version: verification.completionVersionAfter,
    workOrderVersionAfter: verification.workOrderVersionAfter,
    resultingStatus: verification.resultingWorkOrderStatus,
    lastRequestId: verification.lastRequestId,
  } satisfies WorkOrderCompletionRecord;
}

export function workOrderVerificationAuditLog(params: {
  action: string;
  record: MaintenanceWorkOrder;
  completion: WorkOrderCompletionRecord;
  verification?: WorkOrderVerificationRecord;
  previousVerifierUserId?: string;
  nextVerifierUserId?: string;
  user: UserProfile;
  id: string;
  timestamp: string;
  reason?: string;
}) {
  return {
    id: params.id,
    facilityId: params.record.homeId,
    user: params.user.name,
    role: params.user.role,
    action: params.action,
    entity: params.verification?.id || params.completion.id,
    entityType: params.verification ? "work_order_verification" : "work_order_completion",
    timestamp: params.timestamp,
    before: JSON.stringify({ status: params.record.status, completionVersion: params.completion.version, verifierUserId: params.previousVerifierUserId }),
    after: JSON.stringify({
      workOrderId: params.record.id,
      workOrderNumber: params.record.workOrderNumber,
      completionId: params.completion.id,
      verificationId: params.verification?.id,
      result: params.verification?.result,
      verifierUserId: params.nextVerifierUserId || params.verification?.reviewedByUserId,
      completionVersion: params.verification?.completionVersionAfter || params.completion.version,
      workOrderVersion: params.verification?.workOrderVersionAfter || params.record.version,
      evidenceIds: params.verification?.verificationEvidenceIds,
    }),
    reason: params.reason,
  } satisfies AuditLog;
}

export function verificationReasonLabel(reason: string) {
  const map: Record<string, string> = {
    HIGH_RISK_WORK: "This Work Order requires verification because it was classified as high risk.",
    CRITICAL_RISK_WORK: "This Work Order requires verification because it was classified as critical risk.",
    HIGH_PRIORITY: "High priority Work Orders require verification.",
    CRITICAL_PRIORITY: "Critical priority Work Orders require verification.",
    FIRE_SAFETY_WORK: "Fire safety work requires verification.",
    ELECTRICAL_WORK: "Electrical work requires verification.",
    WATER_SAFETY_WORK: "Water safety work requires verification.",
    NURSE_CALL_WORK: "Nurse call work requires verification.",
    RESIDENT_SAFETY_IMPACT: "Work affecting resident safety requires verification.",
    RESIDENT_ROOM_WORK: "Work in a resident room requires verification.",
    COMPLIANCE_IMPACT: "Compliance-related work requires verification.",
    TEMPORARY_REPAIR: "Temporary repairs require verification.",
    FOLLOW_UP_REQUIRED: "Completion recorded follow-up requirements.",
    MANUAL_VERIFICATION_REQUEST: "Verification was requested when the Work Order was created.",
  };
  return map[reason] || reason;
}

function verificationChecklistFor(record: MaintenanceWorkOrder, completion: WorkOrderCompletionRecord): WorkOrderVerificationChecklistItem[] {
  const items: WorkOrderVerificationChecklistItem[] = [
    item("COMPLETION_NOTES_REVIEWED", "Completion notes have been reviewed.", true, 1),
    item("COMPLETION_CHECKLIST_REVIEWED", "Completion checklist responses have been reviewed.", true, 2),
    item("COMPLETION_EVIDENCE_REVIEWED", "Required completion evidence has been reviewed.", completion.selectedEvidenceIds.length > 0, 3),
    item("WORK_APPEARS_COMPLETE", "The reported work appears complete.", true, 4, "YES_NO", true),
    item("AREA_SAFE", "The work area or equipment is safe for use.", true, 5, "YES_NO", true),
    item("FOLLOW_UP_ACCEPTED", "Follow-up requirements are understood and acceptable.", completion.followUpRequired, 6, "YES_NO_NOT_APPLICABLE"),
  ];
  if (record.category === "FIRE_SAFETY") items.push(item("FIRE_SAFETY_CONFIRMED", "Fire safety function has been checked.", true, 20, "YES_NO", true, "category:FIRE_SAFETY"));
  if (record.category === "ELECTRICAL") items.push(item("ELECTRICAL_SAFETY_CONFIRMED", "Electrical safety has been checked.", true, 20, "YES_NO", true, "category:ELECTRICAL"));
  if (record.category === "NURSE_CALL") items.push(item("NURSE_CALL_CONFIRMED", "Nurse call function has been checked.", true, 20, "YES_NO", true, "category:NURSE_CALL"));
  return items.sort((a, b) => a.order - b.order);
}

function validateChecklist(definitions: WorkOrderVerificationChecklistItem[], responses: WorkOrderVerificationChecklistResponseInput[], requirePassing: boolean) {
  const byKey = new Map(responses.map((response) => [response.itemKey, response]));
  responses.forEach((response) => {
    if (!definitions.some((definition) => definition.key === response.itemKey)) throw new WorkOrderVerificationError("CHECKLIST_INVALID", "A checklist response is not valid for this Work Order.", "checklistResponses");
  });
  return definitions.map((definition) => {
    const response = byKey.get(definition.key);
    if (definition.required && !response) throw new WorkOrderVerificationError("CHECKLIST_INCOMPLETE", `Complete checklist item: ${definition.label}`, definition.key);
    const value = response?.response;
    if (definition.required && !value) throw new WorkOrderVerificationError("CHECKLIST_INCOMPLETE", `Complete checklist item: ${definition.label}`, definition.key);
    if (value === "NOT_APPLICABLE" && definition.responseType !== "YES_NO_NOT_APPLICABLE") throw new WorkOrderVerificationError("CHECKLIST_INVALID", "Not applicable is not allowed for this checklist item.", definition.key);
    if (requirePassing && definition.critical && value === "NO") throw new WorkOrderVerificationError("CHECKLIST_INCOMPLETE", `${definition.label} must pass before verification. Reject the verification if this cannot be confirmed.`, definition.key);
    if (definition.commentRequiredOnNo && value === "NO" && !response?.comment?.trim()) throw new WorkOrderVerificationError("CHECKLIST_INCOMPLETE", "Explain the negative checklist response.", definition.key);
    return {
      itemKey: definition.key,
      label: definition.label,
      required: definition.required,
      response: value || "NOT_APPLICABLE",
      comment: clean(response?.comment),
      source: definition.source,
      order: definition.order,
    } satisfies WorkOrderVerificationChecklistSnapshot;
  });
}

function validateEvidence(ids: string[], available: WorkOrderAttachment[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const selected = unique.map((id) => available.find((item) => item.id === id));
  if (selected.some((item) => !item)) throw new WorkOrderVerificationError("EVIDENCE_INVALID", "Selected evidence is not available for this Work Order.", "verificationEvidenceIds");
  return selected as WorkOrderAttachment[];
}

function verificationEvidenceRules(record: MaintenanceWorkOrder, completion: WorkOrderCompletionRecord) {
  const rules: string[] = [];
  if (record.priority === "CRITICAL" || effectiveRisk(record) === "CRITICAL") rules.push("Critical Work Orders require verification evidence.");
  if (record.category === "FIRE_SAFETY" || record.category === "ELECTRICAL" || record.category === "NURSE_CALL") rules.push("This category requires verification evidence.");
  if (completion.outcome === "TEMPORARY_REPAIR") rules.push("Temporary repairs require verification evidence.");
  return rules;
}

function isEligibleVerifier(user: UserProfile, record: MaintenanceWorkOrder, completion: WorkOrderCompletionRecord, context: WorkOrderVerificationContext) {
  if (!user || user.status !== "active") return false;
  if (!userInHome(user, record.homeId) && user.role !== "group_owner") return false;
  if (user.id === completion.completedByUserId) return false;
  return can(user.role, "maintenance.work_orders.verification.verify");
}

function item(key: string, label: string, required: boolean, order: number, responseType: WorkOrderVerificationChecklistItem["responseType"] = "CONFIRMATION", critical = false, source = "universal"): WorkOrderVerificationChecklistItem {
  return { key, label, required, order, responseType, critical, source, commentRequiredOnNo: critical };
}

function emptyEligibility(blockers: WorkOrderVerificationEligibility["blockers"], version = 0): WorkOrderVerificationEligibility {
  return {
    allowed: false,
    blockers,
    warnings: [],
    verificationRequired: false,
    verificationReasons: [],
    assignedVerifier: null,
    canClaim: false,
    canAssign: false,
    canRelease: false,
    canVerify: false,
    canReject: false,
    separationOfDutiesSatisfied: false,
    requiredChecklistItems: [],
    requiredEvidenceRules: [],
    availableEvidence: [],
    eligibleVerifiers: [],
    expectedWorkOrderVersion: version,
    expectedCompletionVersion: 0,
  };
}

function verificationIssue(issue: WorkOrderVerificationEligibility["blockers"][number]) {
  return new WorkOrderVerificationError(issue.code as WorkOrderVerificationErrorCode, issue.message, issue.field);
}

function userInHome(user: UserProfile, homeId: string) {
  const homes = user.facilityIds || (user.facilityId ? [user.facilityId] : []);
  return homes.length === 0 || homes.includes(homeId);
}

function effectiveRisk(record: MaintenanceWorkOrder) {
  return record.riskAssessment?.manualOverrideLevel || record.riskAssessment?.calculatedLevel || record.riskLevel;
}

function organisationId(record: MaintenanceWorkOrder) {
  return record.organisationId || record.providerId || String(record.enterpriseId || "");
}

function safeText(value: string | undefined, min: number, max: number, code: WorkOrderVerificationErrorCode, message: string, field: string) {
  const text = clean(value);
  if (!text || text.length < min) throw new WorkOrderVerificationError(code, message, field);
  if (text.length > max) throw new WorkOrderVerificationError("CHECKLIST_INVALID", `Keep this field under ${max} characters.`, field);
  return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function verificationRuleVersion() {
  return VERIFICATION_RULE_VERSION;
}
