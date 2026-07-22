import type {
  AuditLog,
  MaintenanceWorkOrder,
  MaintenanceWorkOrderStatus,
  UserProfile,
  WorkOrderAttachment,
  WorkOrderAttachmentCategory,
  WorkOrderEvidenceType,
  WorkOrderLabourEntry,
  WorkOrderLabourType,
  WorkOrderMaterialEntry,
  WorkOrderNote,
  WorkOrderNoteType,
  WorkOrderPhotoCategory,
} from "@/lib/care/types";
import { HISTORICAL_WORK_ORDER_STATUSES } from "./workOrders.ts";

export type WorkOrderExecutionErrorCode =
  | "WORK_ORDER_NOT_FOUND"
  | "PERMISSION_DENIED"
  | "WORK_ORDER_OUT_OF_SCOPE"
  | "WORK_ORDER_LOCKED"
  | "NOTE_REQUIRED"
  | "FILE_TYPE_NOT_ALLOWED"
  | "FILE_TOO_LARGE"
  | "FILE_NAME_INVALID"
  | "FILE_EMPTY"
  | "FILE_NOT_SAFE"
  | "LABOUR_DURATION_INVALID"
  | "LABOUR_TIME_INVALID"
  | "MATERIAL_QUANTITY_INVALID"
  | "REASON_REQUIRED"
  | "STALE_VERSION"
  | "DUPLICATE_REQUEST"
  | "VALIDATION_ERROR";

export class WorkOrderExecutionError extends Error {
  code: WorkOrderExecutionErrorCode;
  fieldErrors: Record<string, string>;

  constructor(code: WorkOrderExecutionErrorCode, message: string, field?: string) {
    super(message);
    this.name = "WorkOrderExecutionError";
    this.code = code;
    this.fieldErrors = field ? { [field]: message } : {};
  }
}

export interface WorkOrderExecutionContext {
  currentUser: UserProfile;
  users: UserProfile[];
  canAccess: (capability: string, resource?: { nursingHomeId?: string; wardId?: string }) => boolean;
  now?: string;
}

export interface WorkOrderTimelineItem {
  id: string;
  eventType: string;
  occurredAt: string;
  actor: { id?: string; displayName: string };
  title: string;
  description?: string;
  sourceType: "work_order" | "audit" | "note" | "attachment" | "labour" | "material";
  sourceId: string;
  metadata?: Record<string, string | number | boolean | undefined>;
}

export interface WorkOrderAttachmentUploadInput {
  originalFileName: string;
  mimeType: string;
  size: number;
  category?: WorkOrderAttachmentCategory;
  description?: string;
  photoCategory?: WorkOrderPhotoCategory;
  isEvidence?: boolean;
  evidenceType?: WorkOrderEvidenceType;
  evidenceDescription?: string;
  checksum?: string;
  clientRequestId?: string;
}

export interface WorkOrderLabourInput {
  userId?: string;
  workerDisplayName?: string;
  labourType: WorkOrderLabourType;
  workDate: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  description: string;
  clientRequestId?: string;
}

export interface WorkOrderMaterialInput {
  materialName: string;
  quantity: number;
  unit: string;
  reference?: string;
  usedDate: string;
  description?: string;
  clientRequestId?: string;
}

export const WORK_ORDER_NOTE_TYPES: Array<{ value: WorkOrderNoteType; label: string }> = [
  { value: "GENERAL", label: "General" },
  { value: "PROGRESS_UPDATE", label: "Progress Update" },
  { value: "SAFETY_NOTE", label: "Safety Note" },
  { value: "ACCESS_NOTE", label: "Access Note" },
  { value: "PARTS_NOTE", label: "Parts Note" },
  { value: "CONTRACTOR_NOTE", label: "Contractor Note" },
  { value: "HANDOVER_NOTE", label: "Handover Note" },
  { value: "INTERNAL_NOTE", label: "Internal Note" },
];

export const WORK_ORDER_ATTACHMENT_CATEGORIES: Array<{ value: WorkOrderAttachmentCategory; label: string }> = [
  { value: "GENERAL", label: "General" },
  { value: "DOCUMENT", label: "Document" },
  { value: "MANUAL", label: "Manual" },
  { value: "QUOTATION", label: "Quotation" },
  { value: "CONTRACTOR_DOCUMENT", label: "Contractor Document" },
  { value: "SAFETY_DOCUMENT", label: "Safety Document" },
  { value: "EVIDENCE", label: "Evidence" },
  { value: "PHOTO", label: "Photo" },
];

export const WORK_ORDER_EVIDENCE_TYPES: Array<{ value: WorkOrderEvidenceType; label: string }> = [
  { value: "BEFORE_WORK", label: "Before Work" },
  { value: "DURING_WORK", label: "During Work" },
  { value: "AFTER_WORK", label: "After Work" },
  { value: "REPAIR_EVIDENCE", label: "Repair Evidence" },
  { value: "SAFETY_CONTROL", label: "Safety Control" },
  { value: "TEST_RESULT", label: "Test Result" },
  { value: "CONTRACTOR_EVIDENCE", label: "Contractor Evidence" },
  { value: "OTHER", label: "Other" },
];

const NOTE_TYPES = new Set(WORK_ORDER_NOTE_TYPES.map((item) => item.value));
const FILE_CATEGORIES = new Set(WORK_ORDER_ATTACHMENT_CATEGORIES.map((item) => item.value));
const EVIDENCE_TYPES = new Set(WORK_ORDER_EVIDENCE_TYPES.map((item) => item.value));
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_TYPES = new Set(["application/pdf", "text/plain", "image/jpeg", "image/png", "image/webp"]);
const BLOCKED_EXTENSIONS = new Set(["exe", "bat", "cmd", "com", "ps1", "js", "vbs", "scr", "msi", "dll", "svg"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function assertWorkOrderExecutionAccess(record: MaintenanceWorkOrder | undefined, capability: string, context: WorkOrderExecutionContext) {
  if (!record) throw new WorkOrderExecutionError("WORK_ORDER_NOT_FOUND", "The Work Order could not be found.", "workOrder");
  const userHomes = context.currentUser.facilityIds || (context.currentUser.facilityId ? [context.currentUser.facilityId] : []);
  const inHome = context.currentUser.role === "group_owner" || userHomes.length === 0 || userHomes.includes(record.homeId);
  if (!inHome) throw new WorkOrderExecutionError("WORK_ORDER_OUT_OF_SCOPE", "You do not have access to this Work Order.", "workOrder");
  if (!context.canAccess(capability, { nursingHomeId: record.homeId, wardId: String(record.wardId || "") || undefined })) {
    throw new WorkOrderExecutionError("PERMISSION_DENIED", "You do not have permission to perform this action.", "permission");
  }
}

export function createWorkOrderNoteRecord(params: {
  record: MaintenanceWorkOrder;
  input: { noteType: WorkOrderNoteType; content: string; clientRequestId?: string };
  context: WorkOrderExecutionContext;
  id: string;
}) {
  assertWorkOrderExecutionAccess(params.record, "maintenance.work_orders.execution.add_note", params.context);
  ensureCanAddExecutionRecord(params.record, true);
  if (!NOTE_TYPES.has(params.input.noteType)) throw new WorkOrderExecutionError("VALIDATION_ERROR", "Select a valid note type.", "noteType");
  const content = safeText(params.input.content, 5, 3000, "NOTE_REQUIRED", "Enter a note before saving.", "content");
  const now = params.context.now || new Date().toISOString();
  return {
    id: params.id,
    workOrderId: params.record.id,
    workOrderNumber: params.record.workOrderNumber,
    organisationId: organisationId(params.record),
    homeId: params.record.homeId,
    noteType: params.input.noteType,
    content,
    createdByUserId: params.context.currentUser.id,
    createdAt: now,
    isEdited: false,
    version: 1,
    lastRequestId: params.input.clientRequestId,
  } satisfies WorkOrderNote;
}

export function editWorkOrderNoteRecord(note: WorkOrderNote, input: { content: string; expectedVersion: number; reason?: string }, record: MaintenanceWorkOrder, context: WorkOrderExecutionContext) {
  const own = note.createdByUserId === context.currentUser.id;
  const capability = own ? "maintenance.work_orders.execution.add_note" : "maintenance.work_orders.execution.edit_note";
  assertWorkOrderExecutionAccess(record, capability, context);
  if (note.version !== input.expectedVersion) throw new WorkOrderExecutionError("STALE_VERSION", "This record changed while you were editing it. Review the latest version and try again.", "expectedVersion");
  if (!own && !input.reason?.trim()) throw new WorkOrderExecutionError("REASON_REQUIRED", "Enter a reason before saving this correction.", "reason");
  const now = context.now || new Date().toISOString();
  return { ...note, content: safeText(input.content, 5, 3000, "NOTE_REQUIRED", "Enter a note before saving.", "content"), updatedAt: now, updatedByUserId: context.currentUser.id, isEdited: true, version: note.version + 1 } satisfies WorkOrderNote;
}

export function softDeleteExecutionRecord<T extends { deletedAt?: string; version: number }>(record: T, reason: string, context: WorkOrderExecutionContext) {
  if (!reason.trim()) throw new WorkOrderExecutionError("REASON_REQUIRED", "Enter a reason before removing this record.", "reason");
  return { ...record, deletedAt: context.now || new Date().toISOString(), deletedByUserId: context.currentUser.id, deletedReason: reason.trim(), version: record.version + 1 };
}

export function createWorkOrderAttachmentRecord(params: {
  record: MaintenanceWorkOrder;
  input: WorkOrderAttachmentUploadInput;
  context: WorkOrderExecutionContext;
  id: string;
}) {
  assertWorkOrderExecutionAccess(params.record, "maintenance.work_orders.execution.upload_file", params.context);
  ensureCanAddExecutionRecord(params.record, true);
  const meta = validateFileMetadata(params.input);
  const now = params.context.now || new Date().toISOString();
  const isPhoto = IMAGE_TYPES.has(meta.mimeType);
  const category = params.input.category || (isPhoto ? "PHOTO" : "GENERAL");
  if (!FILE_CATEGORIES.has(category)) throw new WorkOrderExecutionError("VALIDATION_ERROR", "Select a valid file category.", "category");
  if (params.input.isEvidence && params.input.evidenceType && !EVIDENCE_TYPES.has(params.input.evidenceType)) {
    throw new WorkOrderExecutionError("VALIDATION_ERROR", "Select a valid evidence type.", "evidenceType");
  }
  return {
    id: params.id,
    workOrderId: params.record.id,
    workOrderNumber: params.record.workOrderNumber,
    organisationId: organisationId(params.record),
    homeId: params.record.homeId,
    originalFileName: meta.originalFileName,
    storedFileName: `${params.id}.${meta.fileExtension}`,
    storageKey: `work-orders/${params.record.homeId}/${params.record.id}/${params.id}.${meta.fileExtension}`,
    mimeType: meta.mimeType,
    fileExtension: meta.fileExtension,
    size: meta.size,
    category,
    photoCategory: isPhoto ? params.input.photoCategory || "OTHER" : undefined,
    description: clean(params.input.description),
    isPhoto,
    isEvidence: Boolean(params.input.isEvidence || category === "EVIDENCE"),
    evidenceType: params.input.isEvidence || category === "EVIDENCE" ? params.input.evidenceType || "OTHER" : undefined,
    evidenceDescription: params.input.isEvidence || category === "EVIDENCE" ? clean(params.input.evidenceDescription || params.input.description) : undefined,
    uploadedByUserId: params.context.currentUser.id,
    uploadedAt: now,
    checksum: params.input.checksum,
    scanStatus: "NOT_AVAILABLE",
    version: 1,
    lastRequestId: params.input.clientRequestId,
  } satisfies WorkOrderAttachment;
}

export function classifyAttachmentEvidence(attachment: WorkOrderAttachment, input: { isEvidence: boolean; evidenceType?: WorkOrderEvidenceType; evidenceDescription?: string; expectedVersion: number }, record: MaintenanceWorkOrder, context: WorkOrderExecutionContext) {
  assertWorkOrderExecutionAccess(record, "maintenance.work_orders.execution.classify_evidence", context);
  if (attachment.version !== input.expectedVersion) throw new WorkOrderExecutionError("STALE_VERSION", "This record changed while you were editing it. Review the latest version and try again.", "expectedVersion");
  if (input.isEvidence && input.evidenceType && !EVIDENCE_TYPES.has(input.evidenceType)) throw new WorkOrderExecutionError("VALIDATION_ERROR", "Select a valid evidence type.", "evidenceType");
  return {
    ...attachment,
    isEvidence: input.isEvidence,
    evidenceType: input.isEvidence ? input.evidenceType || attachment.evidenceType || "OTHER" : undefined,
    evidenceDescription: input.isEvidence ? clean(input.evidenceDescription) || attachment.evidenceDescription : undefined,
    category: input.isEvidence ? "EVIDENCE" : attachment.isPhoto ? "PHOTO" : attachment.category === "EVIDENCE" ? "GENERAL" : attachment.category,
    version: attachment.version + 1,
  } satisfies WorkOrderAttachment;
}

export function createWorkOrderLabourRecord(params: {
  record: MaintenanceWorkOrder;
  input: WorkOrderLabourInput;
  context: WorkOrderExecutionContext;
  id: string;
}) {
  assertWorkOrderExecutionAccess(params.record, "maintenance.work_orders.execution.add_labour", params.context);
  ensureLabourStatus(params.record.status);
  const now = params.context.now || new Date().toISOString();
  const worker = params.input.userId ? params.context.users.find((user) => user.id === params.input.userId) : undefined;
  if (params.input.userId && !worker) throw new WorkOrderExecutionError("VALIDATION_ERROR", "Select a valid worker.", "userId");
  const duration = calculateLabourDuration(params.input);
  return {
    id: params.id,
    workOrderId: params.record.id,
    workOrderNumber: params.record.workOrderNumber,
    organisationId: organisationId(params.record),
    homeId: params.record.homeId,
    userId: params.input.userId,
    workerDisplayName: worker?.name || clean(params.input.workerDisplayName) || params.context.currentUser.name,
    labourType: params.input.labourType,
    workDate: validDate(params.input.workDate, "workDate"),
    startedAt: toDateTime(params.input.workDate, params.input.startTime),
    endedAt: toDateTime(params.input.workDate, params.input.endTime),
    durationMinutes: duration,
    description: safeText(params.input.description, 3, 1000, "VALIDATION_ERROR", "Describe the work carried out.", "description"),
    recordedByUserId: params.context.currentUser.id,
    createdAt: now,
    version: 1,
    lastRequestId: params.input.clientRequestId,
  } satisfies WorkOrderLabourEntry;
}

export function createWorkOrderMaterialRecord(params: {
  record: MaintenanceWorkOrder;
  input: WorkOrderMaterialInput;
  context: WorkOrderExecutionContext;
  id: string;
}) {
  assertWorkOrderExecutionAccess(params.record, "maintenance.work_orders.execution.add_material", params.context);
  ensureMaterialStatus(params.record.status);
  if (!Number.isFinite(params.input.quantity) || params.input.quantity <= 0) throw new WorkOrderExecutionError("MATERIAL_QUANTITY_INVALID", "Enter a quantity greater than zero.", "quantity");
  const now = params.context.now || new Date().toISOString();
  return {
    id: params.id,
    workOrderId: params.record.id,
    workOrderNumber: params.record.workOrderNumber,
    organisationId: organisationId(params.record),
    homeId: params.record.homeId,
    materialName: safeText(params.input.materialName, 2, 120, "VALIDATION_ERROR", "Enter a material name.", "materialName"),
    quantity: Number(params.input.quantity),
    unit: safeText(params.input.unit, 1, 30, "VALIDATION_ERROR", "Enter a unit.", "unit"),
    reference: clean(params.input.reference),
    usedDate: validDate(params.input.usedDate, "usedDate"),
    description: clean(params.input.description),
    recordedByUserId: params.context.currentUser.id,
    createdAt: now,
    version: 1,
    lastRequestId: params.input.clientRequestId,
  } satisfies WorkOrderMaterialEntry;
}

export function buildWorkOrderTimeline(input: {
  record: MaintenanceWorkOrder;
  auditLogs: AuditLog[];
  notes: WorkOrderNote[];
  attachments: WorkOrderAttachment[];
  labour: WorkOrderLabourEntry[];
  materials: WorkOrderMaterialEntry[];
  users: UserProfile[];
  limit?: number;
}) {
  const userName = (id?: string) => input.users.find((user) => user.id === id)?.name || "Staff member";
  const items: WorkOrderTimelineItem[] = [
    {
      id: `created:${input.record.id}`,
      eventType: "created",
      occurredAt: input.record.createdAt,
      actor: { id: input.record.createdByUserId, displayName: userName(input.record.createdByUserId) },
      title: "Work Order created",
      description: input.record.title,
      sourceType: "work_order",
      sourceId: input.record.id,
    },
    ...input.auditLogs
      .filter((audit) => audit.entity === input.record.id || audit.entity === input.record.workOrderNumber)
      .map((audit) => ({
        id: `audit:${audit.id}`,
        eventType: "audit",
        occurredAt: audit.timestamp,
        actor: { displayName: audit.user },
        title: plainAuditTitle(audit.action),
        description: audit.reason,
        sourceType: "audit" as const,
        sourceId: audit.id,
      })),
    ...input.notes.map((note) => ({
      id: `note:${note.id}`,
      eventType: "note",
      occurredAt: note.createdAt,
      actor: { id: note.createdByUserId, displayName: userName(note.createdByUserId) },
      title: note.deletedAt ? "Work note removed" : `${noteTypeLabel(note.noteType)} added`,
      description: note.deletedAt ? "Note removed for audit retention." : note.content,
      sourceType: "note" as const,
      sourceId: note.id,
    })),
    ...input.attachments.map((attachment) => ({
      id: `attachment:${attachment.id}`,
      eventType: attachment.isPhoto ? "photo" : attachment.isEvidence ? "evidence" : "attachment",
      occurredAt: attachment.uploadedAt,
      actor: { id: attachment.uploadedByUserId, displayName: userName(attachment.uploadedByUserId) },
      title: attachment.deletedAt ? "Attachment removed" : attachment.isEvidence ? "Evidence added" : attachment.isPhoto ? "Photo uploaded" : "Attachment uploaded",
      description: attachment.deletedAt ? "Attachment removed for audit retention." : attachment.originalFileName,
      sourceType: "attachment" as const,
      sourceId: attachment.id,
    })),
    ...input.labour.map((entry) => ({
      id: `labour:${entry.id}`,
      eventType: "labour",
      occurredAt: entry.createdAt,
      actor: { id: entry.recordedByUserId, displayName: userName(entry.recordedByUserId) },
      title: entry.deletedAt ? "Labour entry removed" : "Labour entry added",
      description: `${entry.workerDisplayName} - ${entry.durationMinutes} minutes`,
      sourceType: "labour" as const,
      sourceId: entry.id,
    })),
    ...input.materials.map((entry) => ({
      id: `material:${entry.id}`,
      eventType: "material",
      occurredAt: entry.createdAt,
      actor: { id: entry.recordedByUserId, displayName: userName(entry.recordedByUserId) },
      title: entry.deletedAt ? "Material record removed" : "Material recorded",
      description: `${entry.materialName} - ${entry.quantity} ${entry.unit}`,
      sourceType: "material" as const,
      sourceId: entry.id,
    })),
  ];
  return items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, input.limit || 50);
}

export function workOrderExecutionAuditLog(params: {
  action: string;
  record: MaintenanceWorkOrder;
  user: UserProfile;
  entityId: string;
  entityType: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  id: string;
  timestamp: string;
}) {
  return {
    id: params.id,
    facilityId: params.record.homeId,
    user: params.user.name,
    role: params.user.role,
    action: params.action,
    entity: params.entityId,
    entityType: params.entityType,
    timestamp: params.timestamp,
    before: params.before ? JSON.stringify(params.before) : undefined,
    after: params.after ? JSON.stringify(params.after) : undefined,
    reason: params.reason,
  } satisfies AuditLog;
}

export function noteTypeLabel(value: WorkOrderNoteType) {
  return WORK_ORDER_NOTE_TYPES.find((item) => item.value === value)?.label || value;
}

function ensureCanAddExecutionRecord(record: MaintenanceWorkOrder, allowOpen: boolean) {
  if (record.archivedAt || HISTORICAL_WORK_ORDER_STATUSES.includes(record.status)) throw new WorkOrderExecutionError("WORK_ORDER_LOCKED", "This Work Order is read-only in its current status.", "workOrder");
  if (!allowOpen && record.status === "OPEN") throw new WorkOrderExecutionError("WORK_ORDER_LOCKED", "Assign or accept the Work Order before recording this item.", "workOrder");
}

function ensureLabourStatus(status: MaintenanceWorkOrderStatus) {
  if (!["ACCEPTED", "IN_PROGRESS", "ON_HOLD", "AWAITING_PARTS", "AWAITING_CONTRACTOR", "AWAITING_ACCESS"].includes(status)) {
    throw new WorkOrderExecutionError("WORK_ORDER_LOCKED", "Labour can only be recorded once work has been accepted or started.", "workOrder");
  }
}

function ensureMaterialStatus(status: MaintenanceWorkOrderStatus) {
  if (!["ACCEPTED", "IN_PROGRESS", "ON_HOLD", "AWAITING_PARTS", "AWAITING_CONTRACTOR", "AWAITING_ACCESS"].includes(status)) {
    throw new WorkOrderExecutionError("WORK_ORDER_LOCKED", "Materials can only be recorded once work has been accepted or started.", "workOrder");
  }
}

function validateFileMetadata(input: WorkOrderAttachmentUploadInput) {
  const originalFileName = clean(input.originalFileName);
  if (!originalFileName || originalFileName.length > 160 || originalFileName.includes("..") || /[\\/<>:"|?*]/.test(originalFileName)) {
    throw new WorkOrderExecutionError("FILE_NAME_INVALID", "Use a safe file name.", "originalFileName");
  }
  if (!input.size || input.size <= 0) throw new WorkOrderExecutionError("FILE_EMPTY", "This file is empty.", "size");
  if (input.size > MAX_FILE_SIZE) throw new WorkOrderExecutionError("FILE_TOO_LARGE", "This file exceeds the allowed size.", "size");
  const extension = originalFileName.split(".").pop()?.toLowerCase() || "";
  if (!extension || BLOCKED_EXTENSIONS.has(extension)) throw new WorkOrderExecutionError("FILE_TYPE_NOT_ALLOWED", "This file type is not supported.", "originalFileName");
  const mimeType = input.mimeType.toLowerCase();
  if (!DOCUMENT_TYPES.has(mimeType)) throw new WorkOrderExecutionError("FILE_TYPE_NOT_ALLOWED", "This file type is not supported.", "mimeType");
  if (IMAGE_TYPES.has(mimeType) && !["jpg", "jpeg", "png", "webp"].includes(extension)) {
    throw new WorkOrderExecutionError("FILE_TYPE_NOT_ALLOWED", "The file extension does not match the image type.", "originalFileName");
  }
  if (mimeType === "application/pdf" && extension !== "pdf") throw new WorkOrderExecutionError("FILE_TYPE_NOT_ALLOWED", "The file extension does not match the document type.", "originalFileName");
  return { originalFileName, fileExtension: extension, mimeType, size: input.size };
}

function calculateLabourDuration(input: WorkOrderLabourInput) {
  const duration = Number(input.durationMinutes);
  if (input.startTime || input.endTime) {
    if (!input.startTime || !input.endTime) throw new WorkOrderExecutionError("LABOUR_TIME_INVALID", "Enter both start and end time, or enter duration only.", "endTime");
    const start = Date.parse(`${validDate(input.workDate, "workDate")}T${input.startTime}:00`);
    const end = Date.parse(`${validDate(input.workDate, "workDate")}T${input.endTime}:00`);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new WorkOrderExecutionError("LABOUR_TIME_INVALID", "The end time must be after the start time.", "endTime");
    return validateDuration(Math.round((end - start) / 60000));
  }
  return validateDuration(duration);
}

function validateDuration(value: number) {
  if (!Number.isFinite(value) || value <= 0 || value > 24 * 60) throw new WorkOrderExecutionError("LABOUR_DURATION_INVALID", "Enter a valid labour duration.", "durationMinutes");
  return Math.round(value);
}

function toDateTime(date: string, time?: string) {
  return time ? `${validDate(date, "workDate")}T${time}:00.000` : undefined;
}

function validDate(value: string, field: string) {
  if (!value || Number.isNaN(Date.parse(`${value}T00:00:00`))) throw new WorkOrderExecutionError("VALIDATION_ERROR", "Enter a valid date.", field);
  return value;
}

function safeText(value: string, min: number, max: number, code: WorkOrderExecutionErrorCode, message: string, field: string) {
  const text = clean(value);
  if (!text || text.length < min) throw new WorkOrderExecutionError(code, message, field);
  if (text.length > max) throw new WorkOrderExecutionError("VALIDATION_ERROR", `Keep this field under ${max} characters.`, field);
  return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

function clean(value?: string) {
  const text = value?.trim();
  return text || undefined;
}

function organisationId(record: MaintenanceWorkOrder) {
  return record.organisationId || record.providerId || String(record.enterpriseId || "");
}

function plainAuditTitle(action: string) {
  return action.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
