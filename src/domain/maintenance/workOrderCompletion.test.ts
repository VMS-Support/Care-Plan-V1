import assert from "node:assert/strict";
import test from "node:test";
import type { MaintenanceWorkOrder, UserProfile, WorkOrderAttachment, WorkOrderLabourEntry, WorkOrderMaterialEntry, WorkOrderNote } from "../../lib/care/types.ts";
import { buildWorkOrderTimeline } from "./workOrderExecution.ts";
import {
  WorkOrderCompletionError,
  createWorkOrderCompletionRecord,
  evaluateWorkOrderCompletionEligibility,
  workOrderCompletionAuditLog,
  type WorkOrderCompletionContext,
  type WorkOrderCompletionInput,
} from "./workOrderCompletion.ts";

const now = "2026-07-22T11:00:00.000Z";
const manager = user("U-MANAGER", "Morgan Manager", "don", ["home-1"]);
const worker = user("U-WORKER", "Wendy Worker", "maintenance", ["home-1"]);
const otherHomeWorker = user("U-OTHER", "Ollie Other", "maintenance", ["home-2"]);

const allCapabilities = ["maintenance.work_orders.complete", "maintenance.work_orders.complete_unassigned", "maintenance.work_orders.completion.view"];

test("completion eligibility blocks invalid status, missing permission, out-of-scope and stale versions", () => {
  assert.equal(evaluateWorkOrderCompletionEligibility({ workOrder: order({ status: "ASSIGNED" }), context: ctx(worker), related: related() }).blockers[0].code, "INVALID_STATUS");
  assert.equal(evaluateWorkOrderCompletionEligibility({ workOrder: order(), context: ctx(worker, []), related: related() }).blockers[0].code, "PERMISSION_DENIED");
  assert.equal(evaluateWorkOrderCompletionEligibility({ workOrder: order(), context: ctx(otherHomeWorker), related: related() }).blockers[0].code, "OUT_OF_SCOPE");
  assert.equal(evaluateWorkOrderCompletionEligibility({ workOrder: order(), context: ctx(worker), related: related(), completionRequest: { expectedVersion: 99 } }).blockers[0].code, "STALE_VERSION");
});

test("standard completion stores completion record without verification when rules are satisfied", () => {
  const record = order();
  const completion = createWorkOrderCompletionRecord({
    workOrder: record,
    input: input(record),
    context: ctx(worker),
    related: related(),
    id: "completion-1",
  });
  assert.equal(completion.resultingStatus, "COMPLETED");
  assert.equal(completion.verificationRequired, false);
  assert.equal(completion.verificationStatus, "NOT_REQUIRED");
  assert.equal(completion.workOrderVersionBefore, record.version);
  assert.equal(completion.workOrderVersionAfter, record.version + 1);
  assert.equal(completion.completedByUserId, worker.id);
  assert.equal(completion.checklist.every((item) => item.response === "CONFIRMED" || item.response === "YES"), true);
});

test("high-risk and safety completion requires evidence and routes to verification", () => {
  const record = order({ priority: "HIGH", riskLevel: "HIGH", category: "FIRE_SAFETY" });
  assertCompletionError(() => createWorkOrderCompletionRecord({ workOrder: record, input: { ...input(record), selectedEvidenceIds: [] }, context: ctx(worker), related: related(), id: "completion-1" }), "EVIDENCE_REQUIRED");

  const completion = createWorkOrderCompletionRecord({
    workOrder: record,
    input: input(record, { selectedEvidenceIds: ["file-1"] }),
    context: ctx(worker),
    related: related({ attachments: [evidence()] }),
    id: "completion-2",
  });
  assert.equal(completion.resultingStatus, "VERIFICATION_REQUIRED");
  assert.equal(completion.verificationStatus, "PENDING");
  assert.equal(completion.verificationReasons.some((reason) => reason.includes("High priority")), true);
  assert.equal(completion.verificationReasons.some((reason) => reason.includes("Fire safety")), true);
});

test("completion validation rejects missing content, declaration, follow-up detail and unsafe checklist responses", () => {
  const record = order();
  assertCompletionError(() => createWorkOrderCompletionRecord({ workOrder: record, input: input(record, { workCompleted: " " }), context: ctx(worker), related: related(), id: "completion-1" }), "WORK_COMPLETED_REQUIRED");
  assertCompletionError(() => createWorkOrderCompletionRecord({ workOrder: record, input: input(record, { declarationAccepted: false }), context: ctx(worker), related: related(), id: "completion-2" }), "DECLARATION_REQUIRED");
  assertCompletionError(() => createWorkOrderCompletionRecord({ workOrder: record, input: input(record, { followUpRequired: true, followUpDetails: "" }), context: ctx(worker), related: related(), id: "completion-3" }), "FOLLOW_UP_DETAILS_REQUIRED");
  assertCompletionError(
    () => createWorkOrderCompletionRecord({
      workOrder: record,
      input: input(record, { checklistResponses: checklist(record).map((item) => ({ itemKey: item.itemKey, response: item.itemKey === "WORK_AREA_SAFE" ? "NO" : item.response })) }),
      context: ctx(worker),
      related: related(),
      id: "completion-4",
    }),
    "CHECKLIST_INCOMPLETE",
  );
});

test("completion requires acknowledgement for material warnings and rejects unavailable evidence", () => {
  const record = order({ dueAt: "2026-07-21T10:00:00.000Z" });
  assertCompletionError(() => createWorkOrderCompletionRecord({ workOrder: record, input: input(record, { warningsAcknowledged: ["NO_LABOUR_RECORDED"] }), context: ctx(worker), related: related({ labour: [] }), id: "completion-1" }), "WARNING_ACKNOWLEDGEMENT_REQUIRED");
  assertCompletionError(() => createWorkOrderCompletionRecord({ workOrder: record, input: input(record, { selectedEvidenceIds: ["missing-file"] }), context: ctx(worker), related: related(), id: "completion-2" }), "EVIDENCE_INVALID");
});

test("completion audit and timeline expose a single completion event", () => {
  const record = order();
  const completion = createWorkOrderCompletionRecord({ workOrder: record, input: input(record), context: ctx(worker), related: related(), id: "completion-1" });
  const audit = workOrderCompletionAuditLog({ record, completion, user: worker, id: "audit-1", timestamp: now });
  assert.equal(audit.action, "WORK_ORDER_COMPLETED");
  assert.equal(audit.entityType, "work_order_completion");

  const timeline = buildWorkOrderTimeline({
    record,
    auditLogs: [audit, { ...audit, id: "audit-2", entity: record.id, entityType: "maintenance_work_order" }],
    notes: [],
    attachments: [],
    labour: [],
    materials: [],
    completions: [completion],
    users: [manager, worker],
  });
  assert.equal(timeline.filter((item) => item.title === "Work Order completed").length, 1);
  assert.equal(timeline.some((item) => item.sourceType === "audit" && item.title.includes("COMPLETED")), false);
});

function assertCompletionError(fn: () => unknown, code: string) {
  assert.throws(fn, (error) => error instanceof WorkOrderCompletionError && error.code === code);
}

function ctx(currentUser: UserProfile, capabilities = allCapabilities): WorkOrderCompletionContext {
  return {
    currentUser,
    users: [manager, worker, otherHomeWorker],
    canAccess: (capability) => capabilities.includes(capability),
    now,
  };
}

function input(record: MaintenanceWorkOrder, overrides: Partial<WorkOrderCompletionInput> = {}): WorkOrderCompletionInput {
  return {
    expectedVersion: record.version,
    workCompleted: "Completed the repair, tested the area and left it safe.",
    outcome: "REPAIRED",
    followUpRequired: false,
    checklistResponses: checklist(record),
    selectedEvidenceIds: [],
    labourReviewed: true,
    materialsReviewed: true,
    declarationAccepted: true,
    warningsAcknowledged: ["NO_LABOUR_RECORDED", "WORK_ORDER_OVERDUE"],
    ...overrides,
  };
}

function checklist(record: MaintenanceWorkOrder): WorkOrderCompletionInput["checklistResponses"] {
  return evaluateWorkOrderCompletionEligibility({ workOrder: record, context: ctx(worker), related: related(), completionRequest: { expectedVersion: record.version } }).checklist.map((item) => ({
    itemKey: item.key,
    response: item.responseType === "CONFIRMATION" ? "CONFIRMED" : "YES",
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
    title: "Repair bedroom door",
    description: "Bedroom door closer requires adjustment.",
    status: "IN_PROGRESS",
    type: "REACTIVE",
    source: "STAFF_REPORT",
    category: "BUILDING_FABRIC",
    locationType: "RESIDENT_ROOM",
    roomId: "room-1",
    reportedByUserId: manager.id,
    createdByUserId: manager.id,
    assignedUserId: worker.id,
    priority: "MEDIUM",
    riskLevel: "LOW",
    residentSafetyImpact: false,
    serviceDisruption: false,
    complianceImpact: false,
    immediateRisk: false,
    verificationRequired: false,
    createdAt: "2026-07-22T08:00:00.000Z",
    updatedAt: "2026-07-22T08:00:00.000Z",
    startedAt: "2026-07-22T09:00:00.000Z",
    activeWorkStartedAt: "2026-07-22T09:00:00.000Z",
    version: 4,
    ...overrides,
  } as MaintenanceWorkOrder;
}

function related(overrides: Partial<{ notes: WorkOrderNote[]; attachments: WorkOrderAttachment[]; labour: WorkOrderLabourEntry[]; materials: WorkOrderMaterialEntry[] }> = {}) {
  return {
    notes: [note()],
    attachments: [],
    labour: [labour()],
    materials: [material()],
    ...overrides,
  };
}

function note(): WorkOrderNote {
  return {
    id: "note-1",
    workOrderId: "WO-1",
    workOrderNumber: "WO-0001",
    homeId: "home-1",
    noteType: "PROGRESS_UPDATE",
    content: "Work completed.",
    createdByUserId: worker.id,
    createdAt: "2026-07-22T10:00:00.000Z",
    version: 1,
  };
}

function labour(): WorkOrderLabourEntry {
  return {
    id: "labour-1",
    workOrderId: "WO-1",
    workOrderNumber: "WO-0001",
    homeId: "home-1",
    userId: worker.id,
    workerDisplayName: worker.name,
    labourType: "INTERNAL",
    workDate: "2026-07-22",
    durationMinutes: 45,
    description: "Repair completed.",
    recordedByUserId: worker.id,
    createdAt: "2026-07-22T10:15:00.000Z",
    version: 1,
  };
}

function material(): WorkOrderMaterialEntry {
  return {
    id: "material-1",
    workOrderId: "WO-1",
    workOrderNumber: "WO-0001",
    homeId: "home-1",
    materialName: "Door hinge",
    quantity: 1,
    unit: "each",
    usedDate: "2026-07-22",
    recordedByUserId: worker.id,
    createdAt: "2026-07-22T10:20:00.000Z",
    version: 1,
  };
}

function evidence(): WorkOrderAttachment {
  return {
    id: "file-1",
    workOrderId: "WO-1",
    workOrderNumber: "WO-0001",
    homeId: "home-1",
    originalFileName: "completion-photo.jpg",
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
