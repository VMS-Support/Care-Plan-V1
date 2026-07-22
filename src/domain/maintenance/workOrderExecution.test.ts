import assert from "node:assert/strict";
import test from "node:test";
import type { MaintenanceWorkOrder, UserProfile, WorkOrderAttachment, WorkOrderLabourEntry, WorkOrderMaterialEntry, WorkOrderNote } from "../../lib/care/types.ts";
import {
  WorkOrderExecutionError,
  buildWorkOrderTimeline,
  classifyAttachmentEvidence,
  createWorkOrderAttachmentRecord,
  createWorkOrderLabourRecord,
  createWorkOrderMaterialRecord,
  createWorkOrderNoteRecord,
  editWorkOrderNoteRecord,
  softDeleteExecutionRecord,
  type WorkOrderExecutionContext,
} from "./workOrderExecution.ts";

const now = "2026-07-22T10:00:00.000Z";
const manager = user("U-MANAGER", "Morgan Manager", "don", ["home-1"]);
const worker = user("U-WORKER", "Wendy Worker", "maintenance", ["home-1"]);
const otherHomeWorker = user("U-OTHER", "Ollie Other", "maintenance", ["home-2"]);

const allCapabilities = [
  "maintenance.work_orders.execution.add_note",
  "maintenance.work_orders.execution.edit_note",
  "maintenance.work_orders.execution.remove_note",
  "maintenance.work_orders.execution.upload_file",
  "maintenance.work_orders.execution.remove_file",
  "maintenance.work_orders.execution.classify_evidence",
  "maintenance.work_orders.execution.add_labour",
  "maintenance.work_orders.execution.remove_labour",
  "maintenance.work_orders.execution.add_material",
  "maintenance.work_orders.execution.remove_material",
];

test("work notes validate content, trim text and preserve audit-friendly edit metadata", () => {
  assertExecutionError(
    () => createWorkOrderNoteRecord({ record: order(), input: { noteType: "PROGRESS_UPDATE", content: "   " }, context: ctx(worker), id: "note-1" }),
    "NOTE_REQUIRED",
  );

  const note = createWorkOrderNoteRecord({
    record: order(),
    input: { noteType: "PROGRESS_UPDATE", content: "  Replaced damaged hinge.  " },
    context: ctx(worker),
    id: "note-1",
  });
  assert.equal(note.content, "Replaced damaged hinge.");
  assert.equal(note.createdByUserId, worker.id);
  assert.equal(note.isEdited, false);

  const edited = editWorkOrderNoteRecord(note, { content: "Replaced hinge and checked door closure.", expectedVersion: 1 }, order(), ctx(worker));
  assert.equal(edited.version, 2);
  assert.equal(edited.isEdited, true);
  assert.equal(edited.updatedByUserId, worker.id);
});

test("note permission, home scope and stale version rules are enforced", () => {
  const note = createWorkOrderNoteRecord({ record: order(), input: { noteType: "GENERAL", content: "Access arranged with nurse." }, context: ctx(worker), id: "note-1" });
  assertExecutionError(() => editWorkOrderNoteRecord(note, { content: "Changed", expectedVersion: 99 }, order(), ctx(worker)), "STALE_VERSION");
  assertExecutionError(() => createWorkOrderNoteRecord({ record: order(), input: { noteType: "GENERAL", content: "Access arranged." }, context: ctx(worker, []) , id: "note-2" }), "PERMISSION_DENIED");
  assertExecutionError(() => createWorkOrderNoteRecord({ record: order(), input: { noteType: "GENERAL", content: "Access arranged." }, context: ctx(otherHomeWorker), id: "note-3" }), "WORK_ORDER_OUT_OF_SCOPE");
});

test("attachments validate safe upload metadata and mark photos without exposing storage paths", () => {
  const attachment = createWorkOrderAttachmentRecord({
    record: order(),
    input: { originalFileName: "after-repair.jpg", mimeType: "image/jpeg", size: 25_000, category: "PHOTO", description: "After repair" },
    context: ctx(worker),
    id: "file-1",
  });
  assert.equal(attachment.isPhoto, true);
  assert.equal(attachment.storageKey, "work-orders/home-1/WO-1/file-1.jpg");
  assert.equal(attachment.scanStatus, "NOT_AVAILABLE");

  assertExecutionError(
    () => createWorkOrderAttachmentRecord({ record: order(), input: { originalFileName: "run.exe", mimeType: "application/octet-stream", size: 20 }, context: ctx(worker), id: "file-2" }),
    "FILE_TYPE_NOT_ALLOWED",
  );
  assertExecutionError(
    () => createWorkOrderAttachmentRecord({ record: order(), input: { originalFileName: "../unsafe.pdf", mimeType: "application/pdf", size: 20 }, context: ctx(worker), id: "file-3" }),
    "FILE_NAME_INVALID",
  );
  assertExecutionError(
    () => createWorkOrderAttachmentRecord({ record: order(), input: { originalFileName: "huge.pdf", mimeType: "application/pdf", size: 11 * 1024 * 1024 }, context: ctx(worker), id: "file-4" }),
    "FILE_TOO_LARGE",
  );
});

test("evidence classification requires version accuracy", () => {
  const attachment = createWorkOrderAttachmentRecord({
    record: order(),
    input: { originalFileName: "check.pdf", mimeType: "application/pdf", size: 5_000 },
    context: ctx(worker),
    id: "file-1",
  });
  assertExecutionError(() => classifyAttachmentEvidence(attachment, { isEvidence: true, evidenceType: "TEST_RESULT", expectedVersion: 9 }, order(), ctx(manager)), "STALE_VERSION");
  const evidence = classifyAttachmentEvidence(attachment, { isEvidence: true, evidenceType: "TEST_RESULT", evidenceDescription: "Door closure test", expectedVersion: 1 }, order(), ctx(manager));
  assert.equal(evidence.isEvidence, true);
  assert.equal(evidence.category, "EVIDENCE");
  assert.equal(evidence.version, 2);
});

test("labour can be recorded by duration or start/end time only in execution statuses", () => {
  const byTime = createWorkOrderLabourRecord({
    record: order({ status: "IN_PROGRESS" }),
    input: { userId: worker.id, labourType: "INTERNAL", workDate: "2026-07-22", startTime: "09:00", endTime: "10:15", description: "Repaired door closer" },
    context: ctx(worker),
    id: "labour-1",
  });
  assert.equal(byTime.durationMinutes, 75);

  const byDuration = createWorkOrderLabourRecord({
    record: order({ status: "ACCEPTED" }),
    input: { userId: worker.id, labourType: "INTERNAL", workDate: "2026-07-22", durationMinutes: 30, description: "Collected parts" },
    context: ctx(worker),
    id: "labour-2",
  });
  assert.equal(byDuration.durationMinutes, 30);

  assertExecutionError(() => createWorkOrderLabourRecord({ record: order({ status: "OPEN" }), input: { userId: worker.id, labourType: "INTERNAL", workDate: "2026-07-22", durationMinutes: 20, description: "Started early" }, context: ctx(worker), id: "labour-3" }), "WORK_ORDER_LOCKED");
  assertExecutionError(() => createWorkOrderLabourRecord({ record: order({ status: "IN_PROGRESS" }), input: { userId: worker.id, labourType: "INTERNAL", workDate: "2026-07-22", startTime: "10:00", endTime: "09:00", description: "Bad time" }, context: ctx(worker), id: "labour-4" }), "LABOUR_TIME_INVALID");
});

test("materials validate positive quantities and do not create inventory side effects", () => {
  const material = createWorkOrderMaterialRecord({
    record: order({ status: "IN_PROGRESS" }),
    input: { materialName: "Door hinge", quantity: 2, unit: "each", usedDate: "2026-07-22", reference: "Stores-12" },
    context: ctx(worker),
    id: "material-1",
  });
  assert.equal(material.materialName, "Door hinge");
  assert.equal(material.quantity, 2);
  assertExecutionError(() => createWorkOrderMaterialRecord({ record: order({ status: "IN_PROGRESS" }), input: { materialName: "Screw", quantity: 0, unit: "each", usedDate: "2026-07-22" }, context: ctx(worker), id: "material-2" }), "MATERIAL_QUANTITY_INVALID");
});

test("soft deletion requires a reason and keeps audit-retained records", () => {
  const note = createWorkOrderNoteRecord({ record: order(), input: { noteType: "GENERAL", content: "Temporary access note." }, context: ctx(worker), id: "note-1" });
  assertExecutionError(() => softDeleteExecutionRecord(note, " ", ctx(manager)), "REASON_REQUIRED");
  const deleted = softDeleteExecutionRecord(note, "Duplicate entry", ctx(manager));
  assert.equal(deleted.deletedByUserId, manager.id);
  assert.equal(deleted.deletedReason, "Duplicate entry");
  assert.equal(deleted.version, 2);
});

test("timeline combines execution records with audit events newest first", () => {
  const record = order({ createdAt: "2026-07-22T08:00:00.000Z" });
  const note: WorkOrderNote = { ...createWorkOrderNoteRecord({ record, input: { noteType: "GENERAL", content: "Door inspected." }, context: ctx(worker, allCapabilities, "2026-07-22T09:00:00.000Z"), id: "note-1" }) };
  const attachment: WorkOrderAttachment = createWorkOrderAttachmentRecord({ record, input: { originalFileName: "photo.jpg", mimeType: "image/jpeg", size: 1000 }, context: ctx(worker, allCapabilities, "2026-07-22T09:30:00.000Z"), id: "file-1" });
  const labour: WorkOrderLabourEntry = createWorkOrderLabourRecord({ record: { ...record, status: "IN_PROGRESS" }, input: { userId: worker.id, labourType: "INTERNAL", workDate: "2026-07-22", durationMinutes: 45, description: "Repair" }, context: ctx(worker, allCapabilities, "2026-07-22T10:00:00.000Z"), id: "labour-1" });
  const material: WorkOrderMaterialEntry = createWorkOrderMaterialRecord({ record: { ...record, status: "IN_PROGRESS" }, input: { materialName: "Hinge", quantity: 1, unit: "each", usedDate: "2026-07-22" }, context: ctx(worker, allCapabilities, "2026-07-22T10:30:00.000Z"), id: "material-1" });

  const timeline = buildWorkOrderTimeline({
    record,
    auditLogs: [{ id: "audit-1", facilityId: "home-1", user: manager.name, role: manager.role, action: "WORK_ORDER_ASSIGNED", entity: record.id, entityType: "maintenance_work_order", timestamp: "2026-07-22T08:30:00.000Z" }],
    notes: [note],
    attachments: [attachment],
    labour: [labour],
    materials: [material],
    users: [manager, worker],
  });
  assert.deepEqual(timeline.slice(0, 3).map((item) => item.sourceType), ["material", "labour", "attachment"]);
  assert.equal(timeline.some((item) => item.sourceType === "audit" && item.title.includes("ASSIGNED")), true);
});

function assertExecutionError(fn: () => unknown, code: string) {
  assert.throws(fn, (error) => error instanceof WorkOrderExecutionError && error.code === code);
}

function ctx(currentUser: UserProfile, capabilities = allCapabilities, at = now): WorkOrderExecutionContext {
  return {
    currentUser,
    users: [manager, worker, otherHomeWorker],
    canAccess: (capability) => capabilities.includes(capability),
    now: at,
  };
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
    title: "Repair bedroom door",
    description: "Bedroom door closer requires adjustment.",
    status: "ASSIGNED",
    type: "REACTIVE",
    source: "STAFF_REPORTED",
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
    version: 1,
    ...overrides,
  } as MaintenanceWorkOrder;
}
