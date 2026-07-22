import assert from "node:assert/strict";
import test from "node:test";
import type { MaintenanceWorkOrder, UserProfile, WorkOrderAttachment, WorkOrderCompletionRecord } from "../../lib/care/types.ts";
import { applyWorkOrderWorkflow } from "./workOrderWorkflow.ts";
import {
  WorkOrderVerificationError,
  applyVerificationResultToCompletion,
  assignWorkOrderVerification,
  claimWorkOrderVerification,
  createWorkOrderVerificationRecord,
  createWorkOrderVerificationRejectionRecord,
  evaluateVerificationEligibility,
  workOrderVerificationAuditLog,
  type WorkOrderVerificationContext,
  type WorkOrderVerifyInput,
} from "./workOrderVerification.ts";

const now = "2026-07-22T12:00:00.000Z";
const worker = user("U-WORKER", "Wendy Worker", "carer", ["home-1"]);
const verifier = user("U-VERIFY", "Victor Verifier", "don", ["home-1"]);
const cnm = user("U-CNM", "Clare CNM", "cnm", ["home-1"]);
const otherHomeVerifier = user("U-OTHER", "Ollie Other", "don", ["home-2"]);

const capabilities = [
  "maintenance.work_orders.verification.view",
  "maintenance.work_orders.verification.assign",
  "maintenance.work_orders.verification.claim",
  "maintenance.work_orders.verification.release",
  "maintenance.work_orders.verification.verify",
  "maintenance.work_orders.verification.reject",
];

test("verification eligibility exposes assignment options and blocks stale versions", () => {
  const result = evaluateVerificationEligibility({ workOrder: order(), completion: completion(), context: ctx(verifier), relatedData: related(), verificationRequest: { expectedWorkOrderVersion: 4, expectedCompletionVersion: 1 } });
  assert.equal(result.allowed, true);
  assert.equal(result.canClaim, true);
  assert.equal(result.canAssign, true);
  assert.equal(result.canVerify, true);
  assert.equal(result.separationOfDutiesSatisfied, true);

  const stale = evaluateVerificationEligibility({ workOrder: order(), completion: completion(), context: ctx(verifier), relatedData: related(), verificationRequest: { expectedWorkOrderVersion: 99, expectedCompletionVersion: 1 } });
  assert.equal(stale.blockers[0].code, "STALE_VERSION");
});

test("assignment validates verifier and claim prevents self-verification", () => {
  const assigned = assignWorkOrderVerification({ workOrder: order(), completion: completion(), input: { expectedWorkOrderVersion: 4, expectedCompletionVersion: 1, verifierUserId: cnm.id }, context: ctx(verifier), id: "assignment-1" });
  assert.equal(assigned.verifierUserId, cnm.id);
  assert.equal(assigned.verificationAssignmentStatus, "ASSIGNED");
  assertVerificationError(() => assignWorkOrderVerification({ workOrder: order(), completion: completion(), input: { expectedWorkOrderVersion: 4, expectedCompletionVersion: 1, verifierUserId: worker.id }, context: ctx(verifier), id: "assignment-2" }), "INVALID_VERIFIER");
  assertVerificationError(() => claimWorkOrderVerification({ workOrder: order(), completion: completion(), input: { expectedWorkOrderVersion: 4, expectedCompletionVersion: 1 }, context: ctx(worker) }), "ASSIGNMENT_CONFLICT");
});

test("valid verification creates record and workflow moves Work Order to verified", () => {
  const record = order();
  const sourceCompletion = completion({ verifierUserId: verifier.id, verificationAssignmentStatus: "ASSIGNED" });
  const verification = createWorkOrderVerificationRecord({ workOrder: record, completion: sourceCompletion, input: verifyInput(record, sourceCompletion), context: ctx(verifier), relatedData: related({ attachments: [evidence()] }), id: "verification-1" });
  assert.equal(verification.result, "VERIFIED");
  assert.equal(verification.reviewedByUserId, verifier.id);
  assert.equal(verification.verificationEvidenceIds[0], "file-1");

  const workflow = applyWorkOrderWorkflow(record, { action: "VERIFY", expectedVersion: record.version, reason: verification.verificationNotes, verificationId: verification.id }, ctx(verifier));
  assert.equal(workflow?.record.status, "VERIFIED");
  assert.equal(workflow?.record.verifiedByUserId, verifier.id);

  const updatedCompletion = applyVerificationResultToCompletion(sourceCompletion, { ...verification, workOrderVersionAfter: workflow!.record.version });
  assert.equal(updatedCompletion.verificationStatus, "VERIFIED");
  assert.equal(updatedCompletion.verifiedByUserId, verifier.id);
});

test("verification blocks self-review, missing notes, missing evidence and failed critical checklist", () => {
  const record = order({ priority: "CRITICAL" });
  const sourceCompletion = completion({ completedByUserId: verifier.id });
  assertVerificationError(() => createWorkOrderVerificationRecord({ workOrder: record, completion: sourceCompletion, input: verifyInput(record, sourceCompletion), context: ctx(verifier), relatedData: related({ attachments: [evidence()] }), id: "verification-1" }), "SEPARATION_OF_DUTIES");

  const normalCompletion = completion({ verifierUserId: verifier.id });
  assertVerificationError(() => createWorkOrderVerificationRecord({ workOrder: record, completion: normalCompletion, input: verifyInput(record, normalCompletion, { verificationNotes: " " }), context: ctx(verifier), relatedData: related({ attachments: [evidence()] }), id: "verification-2" }), "NOTES_REQUIRED");
  assertVerificationError(() => createWorkOrderVerificationRecord({ workOrder: record, completion: normalCompletion, input: verifyInput(record, normalCompletion, { verificationEvidenceIds: [] }), context: ctx(verifier), relatedData: related({ attachments: [evidence()] }), id: "verification-3" }), "EVIDENCE_REQUIRED");
  assertVerificationError(
    () => createWorkOrderVerificationRecord({ workOrder: record, completion: normalCompletion, input: verifyInput(record, normalCompletion, { checklistResponses: checklist(record, normalCompletion).map((item) => ({ itemKey: item.itemKey, response: item.itemKey === "WORK_APPEARS_COMPLETE" ? "NO" : item.response })) }), context: ctx(verifier), relatedData: related({ attachments: [evidence()] }), id: "verification-4" }),
    "CHECKLIST_INCOMPLETE",
  );
});

test("valid rejection creates immutable rejection record and returns Work Order to in progress", () => {
  const record = order();
  const sourceCompletion = completion({ verifierUserId: verifier.id, verificationAssignmentStatus: "ASSIGNED" });
  const rejection = createWorkOrderVerificationRejectionRecord({
    workOrder: record,
    completion: sourceCompletion,
    input: {
      expectedWorkOrderVersion: record.version,
      expectedCompletionVersion: sourceCompletion.version,
      rejectionReasons: ["EVIDENCE_INSUFFICIENT"],
      rejectionNotes: "The provided evidence does not show the completed repair.",
      correctiveActionRequired: "Upload evidence showing the repaired item and retest.",
      evidenceRequiredForResubmission: true,
      evidenceInstructions: "Add a completion photo before resubmitting.",
      verificationEvidenceIds: [],
      declarationAccepted: true,
    },
    context: ctx(verifier),
    relatedData: related(),
    id: "verification-rejection-1",
  });
  assert.equal(rejection.result, "REJECTED");
  assert.equal(rejection.resultingWorkOrderStatus, "IN_PROGRESS");
  const workflow = applyWorkOrderWorkflow(record, { action: "REJECT_VERIFICATION", expectedVersion: record.version, reason: rejection.correctiveActionRequired, verificationId: rejection.id }, ctx(verifier));
  assert.equal(workflow?.record.status, "IN_PROGRESS");
  const updatedCompletion = applyVerificationResultToCompletion(sourceCompletion, { ...rejection, workOrderVersionAfter: workflow!.record.version });
  assert.equal(updatedCompletion.verificationStatus, "REJECTED");
  assert.equal(updatedCompletion.rejectedByUserId, verifier.id);
});

test("rejection validation requires reason, corrective action and declaration", () => {
  assertVerificationError(() => createWorkOrderVerificationRejectionRecord({ workOrder: order(), completion: completion(), input: { expectedWorkOrderVersion: 4, expectedCompletionVersion: 1, rejectionReasons: [], rejectionNotes: "Not acceptable", correctiveActionRequired: "Repair again", evidenceRequiredForResubmission: false, verificationEvidenceIds: [], declarationAccepted: true }, context: ctx(verifier), relatedData: related(), id: "reject-1" }), "REJECTION_REASON_REQUIRED");
  assertVerificationError(() => createWorkOrderVerificationRejectionRecord({ workOrder: order(), completion: completion(), input: { expectedWorkOrderVersion: 4, expectedCompletionVersion: 1, rejectionReasons: ["SAFETY_CONCERN"], rejectionNotes: "Safety issue remains", correctiveActionRequired: "Repair again", evidenceRequiredForResubmission: false, verificationEvidenceIds: [], declarationAccepted: true }, context: ctx(verifier), relatedData: related(), id: "reject-2" }), "CORRECTIVE_ACTION_REQUIRED");
  assertVerificationError(() => createWorkOrderVerificationRejectionRecord({ workOrder: order(), completion: completion(), input: { expectedWorkOrderVersion: 4, expectedCompletionVersion: 1, rejectionReasons: ["QUALITY_CONCERN"], rejectionNotes: "Quality issue remains", correctiveActionRequired: "Repair again", evidenceRequiredForResubmission: false, verificationEvidenceIds: [], declarationAccepted: false }, context: ctx(verifier), relatedData: related(), id: "reject-3" }), "DECLARATION_REQUIRED");
});

test("verification audit stores safe metadata", () => {
  const record = order();
  const sourceCompletion = completion();
  const verification = createWorkOrderVerificationRecord({ workOrder: record, completion: sourceCompletion, input: verifyInput(record, sourceCompletion), context: ctx(verifier), relatedData: related({ attachments: [evidence()] }), id: "verification-1" });
  const audit = workOrderVerificationAuditLog({ id: "audit-1", action: "WORK_ORDER_VERIFIED", record, completion: sourceCompletion, verification, user: verifier, timestamp: now, reason: verification.verificationNotes });
  assert.equal(audit.action, "WORK_ORDER_VERIFIED");
  assert.equal(audit.entityType, "work_order_verification");
  assert.equal(audit.after?.includes("storageKey"), false);
});

function assertVerificationError(fn: () => unknown, code: string) {
  assert.throws(fn, (error) => error instanceof WorkOrderVerificationError && error.code === code);
}

function ctx(currentUser: UserProfile, caps = capabilities): WorkOrderVerificationContext {
  return {
    currentUser,
    users: [worker, verifier, cnm, otherHomeVerifier],
    canAccess: (capability) => caps.includes(capability),
    now,
  };
}

function verifyInput(record: MaintenanceWorkOrder, sourceCompletion: WorkOrderCompletionRecord, overrides: Partial<WorkOrderVerifyInput> = {}): WorkOrderVerifyInput {
  return {
    expectedWorkOrderVersion: record.version,
    expectedCompletionVersion: sourceCompletion.version,
    verificationNotes: "Reviewed completion details, evidence and safety checks.",
    checklistResponses: checklist(record, sourceCompletion),
    verificationEvidenceIds: ["file-1"],
    declarationAccepted: true,
    warningsAcknowledged: ["FOLLOW_UP_RECORDED", "TEMPORARY_REPAIR"],
    ...overrides,
  };
}

function checklist(record: MaintenanceWorkOrder, sourceCompletion: WorkOrderCompletionRecord) {
  return evaluateVerificationEligibility({ workOrder: record, completion: sourceCompletion, context: ctx(verifier), relatedData: related({ attachments: [evidence()] }) }).requiredChecklistItems.map((item) => ({
    itemKey: item.key,
    response: item.responseType === "CONFIRMATION" ? "CONFIRMED" as const : "YES" as const,
  }));
}

function user(id: string, name: string, role: string, facilityIds: string[]): UserProfile {
  return {
    id,
    name,
    role: role as UserProfile["role"],
    email: `${id.toLowerCase()}@example.test`,
    phone: "",
    department: "Maintenance",
    assignedWings: [],
    employeeNumber: id,
    status: "active",
    facilityId: facilityIds[0],
    facilityIds,
  };
}

function order(overrides: Partial<MaintenanceWorkOrder> = {}): MaintenanceWorkOrder {
  return {
    id: "WO-1",
    workOrderNumber: "WO-0001",
    homeId: "home-1",
    nursingHomeId: "home-1",
    facilityId: "home-1",
    title: "Repair fire door",
    description: "Fire door closer requires adjustment.",
    status: "VERIFICATION_REQUIRED",
    type: "REACTIVE",
    source: "STAFF_REPORT",
    category: "FIRE_SAFETY",
    locationType: "RESIDENT_ROOM",
    roomId: "room-1",
    reportedByUserId: worker.id,
    createdByUserId: worker.id,
    assignedUserId: worker.id,
    acceptedAt: "2026-07-22T09:00:00.000Z",
    acceptedByUserId: worker.id,
    startedAt: "2026-07-22T09:15:00.000Z",
    priority: "HIGH",
    riskLevel: "HIGH",
    residentSafetyImpact: true,
    serviceDisruption: false,
    complianceImpact: true,
    immediateRisk: false,
    verificationRequired: true,
    completedAt: "2026-07-22T10:00:00.000Z",
    completedByUserId: worker.id,
    createdAt: "2026-07-22T08:00:00.000Z",
    updatedAt: "2026-07-22T10:00:00.000Z",
    version: 4,
    ...overrides,
  } as MaintenanceWorkOrder;
}

function completion(overrides: Partial<WorkOrderCompletionRecord> = {}): WorkOrderCompletionRecord {
  return {
    id: "completion-1",
    workOrderId: "WO-1",
    workOrderNumber: "WO-0001",
    homeId: "home-1",
    completedByUserId: worker.id,
    completedAt: "2026-07-22T10:00:00.000Z",
    workCompleted: "Repaired and tested the fire door closer.",
    outcome: "REPAIRED",
    followUpRequired: false,
    checklist: [
      { itemKey: "WORK_COMPLETED", label: "The requested work has been completed.", required: true, response: "CONFIRMED", source: "universal", order: 1 },
      { itemKey: "WORK_AREA_SAFE", label: "The work area has been left safe.", required: true, response: "YES", source: "universal", order: 2 },
    ],
    selectedEvidenceIds: ["file-1"],
    labourReviewed: true,
    materialsReviewed: true,
    declarationAccepted: true,
    verificationRequired: true,
    verificationRequiredSnapshot: true,
    verificationStatus: "PENDING",
    verificationReasons: ["High priority Work Order.", "Fire safety work requires review."],
    verificationReasonCodes: ["HIGH_PRIORITY", "FIRE_SAFETY_WORK"],
    verificationRuleVersion: "maintenance-verification-v1",
    verificationEvaluatedAt: "2026-07-22T10:00:00.000Z",
    verificationAssignmentStatus: "UNASSIGNED",
    warningsAcknowledged: [],
    previousStatus: "IN_PROGRESS",
    resultingStatus: "VERIFICATION_REQUIRED",
    workOrderVersionBefore: 3,
    workOrderVersionAfter: 4,
    version: 1,
    ...overrides,
  };
}

function related(overrides: Partial<{ attachments: WorkOrderAttachment[] }> = {}) {
  return { attachments: [], ...overrides };
}

function evidence(): WorkOrderAttachment {
  return {
    id: "file-1",
    workOrderId: "WO-1",
    workOrderNumber: "WO-0001",
    homeId: "home-1",
    originalFileName: "verification-photo.jpg",
    mimeType: "image/jpeg",
    size: 1024,
    storageKey: "work-orders/home-1/WO-0001/file-1.jpg",
    category: "EVIDENCE",
    isPhoto: true,
    isEvidence: true,
    evidenceType: "COMPLETION_PHOTO",
    scanStatus: "CLEAN",
    uploadedByUserId: worker.id,
    uploadedAt: "2026-07-22T10:30:00.000Z",
    version: 1,
  };
}
