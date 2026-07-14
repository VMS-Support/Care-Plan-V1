export type ResidentDocumentStatus =
  | "draft"
  | "active"
  | "superseded"
  | "expired"
  | "revoked"
  | "entered_in_error"
  | "archived";
export type ResidentDocumentSensitivity = "standard" | "sensitive" | "highly_sensitive";
export type ResidentDocumentSource =
  | "resident_upload"
  | "staff_upload"
  | "external_provider"
  | "hospital"
  | "gp"
  | "pharmacy"
  | "family"
  | "nominated_representative"
  | "pre_admission"
  | "system_generated"
  | "legacy_import"
  | "other";
export type ResidentDocumentCategory =
  | "clinical"
  | "care_planning"
  | "medical"
  | "medication"
  | "hospital"
  | "legal_and_consent"
  | "identity"
  | "insurance_and_funding"
  | "administrative"
  | "contacts_and_representatives"
  | "safeguarding"
  | "property"
  | "correspondence"
  | "other";
export type ResidentDocumentType =
  | "identity_document"
  | "medical_card"
  | "gp_visit_card"
  | "health_insurance"
  | "contract"
  | "consent"
  | "advance_directive"
  | "dnar"
  | "treatment_escalation_plan"
  | "hospital_discharge_summary"
  | "hospital_transfer_document"
  | "medication_record"
  | "prescription"
  | "assessment"
  | "care_plan"
  | "care_plan_review"
  | "clinical_letter"
  | "gp_letter"
  | "consultant_letter"
  | "referral"
  | "laboratory_result"
  | "imaging_result"
  | "appointment_document"
  | "insurance_document"
  | "funding_document"
  | "legal_document"
  | "representative_authority"
  | "power_of_attorney"
  | "decision_support_arrangement"
  | "guardianship_document"
  | "safeguarding_document"
  | "complaint_document"
  | "property_document"
  | "photograph"
  | "other";
export interface ResidentDocument {
  id: string;
  residentId: string;
  nursingHomeId: string;
  documentType: ResidentDocumentType;
  category: ResidentDocumentCategory;
  title: string;
  description?: string;
  sensitivity: ResidentDocumentSensitivity;
  status: ResidentDocumentStatus;
  currentVersionId: string;
  source: ResidentDocumentSource;
  sourceOrganisation?: string;
  sourcePerson?: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  sourceRoute?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  reviewDate?: string;
  expiryDate?: string;
  documentDate?: string;
  receivedDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: string;
  createdByStaffMemberId?: string;
}
export interface ResidentDocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileId: string;
  storageReference: string;
  originalFileName: string;
  displayFileName: string;
  mimeType: string;
  fileExtension?: string;
  fileSizeBytes: number;
  uploadedAt: string;
  uploadedByUserAccountId: string;
  uploadedByStaffMemberId?: string;
  changeReasonCode:
    | "initial_upload"
    | "updated_document"
    | "corrected_copy"
    | "renewed_document"
    | "replacement"
    | "better_quality_copy"
    | "redacted_copy"
    | "other";
  changeReasonText?: string;
  supersedesVersionId?: string;
  virusScanStatus: "not_available";
  processingStatus: "ready";
  createdAt: string;
}
export interface ResidentDocumentAudit {
  id: string;
  documentId: string;
  residentId: string;
  nursingHomeId: string;
  action: string;
  actorUserAccountId: string;
  occurredAt: string;
  previousValue?: unknown;
  newValue?: unknown;
}
export interface ResidentDocumentEvent {
  id: string;
  eventType:
    | "ResidentDocumentUploaded"
    | "ResidentDocumentVersionUploaded"
    | "ResidentDocumentMetadataChanged"
    | "ResidentDocumentStatusChanged";
  documentId: string;
  residentId: string;
  nursingHomeId: string;
  actorUserAccountId: string;
  occurredAt: string;
  safeSummary: string;
}
export interface ResidentDocumentState {
  documents: ResidentDocument[];
  versions: ResidentDocumentVersion[];
  audit: ResidentDocumentAudit[];
  events: ResidentDocumentEvent[];
}
export const EMPTY_RESIDENT_DOCUMENT_STATE: ResidentDocumentState = {
  documents: [],
  versions: [],
  audit: [],
  events: [],
};
export const RESIDENT_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const RESIDENT_DOCUMENT_ALLOWED_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "doc",
  "docx",
  "txt",
] as const;
const categoryRules: Partial<Record<ResidentDocumentType, ResidentDocumentCategory[]>> = {
  dnar: ["clinical", "legal_and_consent"],
  advance_directive: ["clinical", "legal_and_consent"],
  hospital_discharge_summary: ["hospital"],
  consultant_letter: ["medical", "correspondence"],
  power_of_attorney: ["legal_and_consent", "contacts_and_representatives"],
  representative_authority: ["legal_and_consent", "contacts_and_representatives"],
  medication_record: ["medication"],
  prescription: ["medication"],
};
export interface DocumentContext {
  nursingHomeId: string;
  userAccountId: string;
  staffMemberId?: string;
  capabilities: string[];
  occurredAt: string;
  residentExists: (id: string) => boolean;
  residentBelongsToHome: (id: string, home: string) => boolean;
  storeFile: (file: File, fileId: string) => Promise<string>;
}
export interface UploadDocumentMetadata {
  title: string;
  documentType: ResidentDocumentType;
  category: ResidentDocumentCategory;
  sensitivity: ResidentDocumentSensitivity;
  source: ResidentDocumentSource;
  description?: string;
  documentDate?: string;
  reviewDate?: string;
  expiryDate?: string;
  sourceOrganisation?: string;
  sourcePerson?: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  sourceRoute?: string;
  tags?: string[];
}
const stableId = () => crypto.randomUUID();
const requireCapability = (context: DocumentContext, capability: string) => {
  if (!context.capabilities.includes(capability))
    throw new Error(`Missing capability: ${capability}`);
};
const validateFile = (file: File) => {
  if (!file?.size) throw new Error("A file is required.");
  if (file.size > RESIDENT_DOCUMENT_MAX_BYTES)
    throw new Error("This file is larger than the permitted upload size.");
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!RESIDENT_DOCUMENT_ALLOWED_EXTENSIONS.includes(ext as never))
    throw new Error("This file type is not permitted.");
  return ext;
};
const validateMetadata = (metadata: UploadDocumentMetadata) => {
  if (!metadata.title.trim()) throw new Error("Document title is required.");
  const allowed = categoryRules[metadata.documentType];
  if (allowed && !allowed.includes(metadata.category))
    throw new Error("Document category is not valid for this document type.");
};
export async function uploadResidentDocument(
  state: ResidentDocumentState,
  residentId: string,
  metadata: UploadDocumentMetadata,
  file: File,
  context: DocumentContext,
) {
  requireCapability(context, "resident_documents.upload");
  if (
    !context.residentExists(residentId) ||
    !context.residentBelongsToHome(residentId, context.nursingHomeId)
  )
    throw new Error("Resident is outside the authorised nursing home.");
  validateMetadata(metadata);
  const extension = validateFile(file);
  const documentId = `resident-document:${stableId()}`;
  const versionId = `resident-document-version:${stableId()}`;
  const fileId = `resident-file:${stableId()}`;
  const storageReference = await context.storeFile(file, fileId);
  const version: ResidentDocumentVersion = {
    id: versionId,
    documentId,
    versionNumber: 1,
    fileId,
    storageReference,
    originalFileName: file.name,
    displayFileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileExtension: extension,
    fileSizeBytes: file.size,
    uploadedAt: context.occurredAt,
    uploadedByUserAccountId: context.userAccountId,
    uploadedByStaffMemberId: context.staffMemberId,
    changeReasonCode: "initial_upload",
    virusScanStatus: "not_available",
    processingStatus: "ready",
    createdAt: context.occurredAt,
  };
  const document: ResidentDocument = {
    ...metadata,
    id: documentId,
    residentId,
    nursingHomeId: context.nursingHomeId,
    title: metadata.title.trim(),
    status: "active",
    currentVersionId: versionId,
    tags: metadata.tags || [],
    createdAt: context.occurredAt,
    updatedAt: context.occurredAt,
    createdByUserAccountId: context.userAccountId,
    createdByStaffMemberId: context.staffMemberId,
  };
  state.documents.push(document);
  state.versions.push(version);
  state.audit.push({
    id: `document-audit:${stableId()}`,
    documentId,
    residentId,
    nursingHomeId: context.nursingHomeId,
    action: "uploaded",
    actorUserAccountId: context.userAccountId,
    occurredAt: context.occurredAt,
    newValue: {
      title: document.title,
      type: document.documentType,
      category: document.category,
      sensitivity: document.sensitivity,
    },
  });
  state.events.push({
    id: `document-event:${stableId()}`,
    eventType: "ResidentDocumentUploaded",
    documentId,
    residentId,
    nursingHomeId: context.nursingHomeId,
    actorUserAccountId: context.userAccountId,
    occurredAt: context.occurredAt,
    safeSummary: "Resident document uploaded.",
  });
  return document;
}
export async function uploadNewResidentDocumentVersion(
  state: ResidentDocumentState,
  documentId: string,
  file: File,
  reason: ResidentDocumentVersion["changeReasonCode"],
  reasonText: string | undefined,
  context: DocumentContext,
) {
  requireCapability(context, "resident_documents.upload_version");
  const document = state.documents.find(
    (item) => item.id === documentId && item.nursingHomeId === context.nursingHomeId,
  );
  if (!document || !["active", "draft", "expired"].includes(document.status))
    throw new Error("Document is not available for versioning.");
  const extension = validateFile(file);
  const previous = state.versions.find((item) => item.id === document.currentVersionId);
  const number =
    Math.max(
      0,
      ...state.versions
        .filter((item) => item.documentId === documentId)
        .map((item) => item.versionNumber),
    ) + 1;
  const fileId = `resident-file:${stableId()}`;
  const version: ResidentDocumentVersion = {
    id: `resident-document-version:${stableId()}`,
    documentId,
    versionNumber: number,
    fileId,
    storageReference: await context.storeFile(file, fileId),
    originalFileName: file.name,
    displayFileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileExtension: extension,
    fileSizeBytes: file.size,
    uploadedAt: context.occurredAt,
    uploadedByUserAccountId: context.userAccountId,
    uploadedByStaffMemberId: context.staffMemberId,
    changeReasonCode: reason,
    changeReasonText: reasonText,
    supersedesVersionId: previous?.id,
    virusScanStatus: "not_available",
    processingStatus: "ready",
    createdAt: context.occurredAt,
  };
  state.versions.push(version);
  document.currentVersionId = version.id;
  document.updatedAt = context.occurredAt;
  document.status = "active";
  state.audit.push({
    id: `document-audit:${stableId()}`,
    documentId,
    residentId: document.residentId,
    nursingHomeId: document.nursingHomeId,
    action: "version_uploaded",
    actorUserAccountId: context.userAccountId,
    occurredAt: context.occurredAt,
    previousValue: { version: previous?.versionNumber },
    newValue: { version: number, reason },
  });
  state.events.push({
    id: `document-event:${stableId()}`,
    eventType: "ResidentDocumentVersionUploaded",
    documentId,
    residentId: document.residentId,
    nursingHomeId: document.nursingHomeId,
    actorUserAccountId: context.userAccountId,
    occurredAt: context.occurredAt,
    safeSummary: `Resident document version ${number} uploaded.`,
  });
  return version;
}
export function changeResidentDocumentStatus(
  state: ResidentDocumentState,
  documentId: string,
  status: ResidentDocumentStatus,
  context: DocumentContext,
) {
  requireCapability(context, "resident_documents.change_status");
  const document = state.documents.find(
    (item) => item.id === documentId && item.nursingHomeId === context.nursingHomeId,
  );
  if (!document) throw new Error("Document not found.");
  const previous = document.status;
  document.status = status;
  document.updatedAt = context.occurredAt;
  state.audit.push({
    id: `document-audit:${stableId()}`,
    documentId,
    residentId: document.residentId,
    nursingHomeId: document.nursingHomeId,
    action: "status_changed",
    actorUserAccountId: context.userAccountId,
    occurredAt: context.occurredAt,
    previousValue: { status: previous },
    newValue: { status },
  });
  state.events.push({
    id: `document-event:${stableId()}`,
    eventType: "ResidentDocumentStatusChanged",
    documentId,
    residentId: document.residentId,
    nursingHomeId: document.nursingHomeId,
    actorUserAccountId: context.userAccountId,
    occurredAt: context.occurredAt,
    safeSummary: `Resident document status changed to ${status.replace(/_/g, " ")}.`,
  });
  return document;
}
const typeAllowed = (document: ResidentDocument, capabilities: string[]) =>
  ![
    "dnar",
    "advance_directive",
    "treatment_escalation_plan",
    "legal_document",
    "representative_authority",
    "power_of_attorney",
    "decision_support_arrangement",
    "guardianship_document",
  ].includes(document.documentType) ||
  capabilities.includes("resident_documents.view_legal") ||
  capabilities.includes("advance_care.view") ||
  capabilities.includes("resident_contacts.manage_authority");
export function canViewResidentDocument(document: ResidentDocument, capabilities: string[]) {
  if (!capabilities.includes("resident_documents.view")) return false;
  if (
    document.sensitivity === "sensitive" &&
    !capabilities.includes("resident_documents.view_sensitive")
  )
    return false;
  if (
    document.sensitivity === "highly_sensitive" &&
    !capabilities.includes("resident_documents.view_highly_sensitive")
  )
    return false;
  if (
    document.category === "safeguarding" &&
    !capabilities.includes("resident_documents.view_safeguarding")
  )
    return false;
  if (
    document.category === "medication" &&
    !capabilities.includes("resident_documents.view_medication")
  )
    return false;
  return typeAllowed(document, capabilities);
}
export interface ResidentDocumentListItem {
  document: ResidentDocument;
  currentVersion: Pick<
    ResidentDocumentVersion,
    | "versionNumber"
    | "originalFileName"
    | "mimeType"
    | "fileSizeBytes"
    | "uploadedAt"
    | "virusScanStatus"
  >;
  attention?: "expired" | "review_overdue" | "expiring_soon";
}
export function getResidentDocuments(
  state: ResidentDocumentState,
  residentId: string,
  nursingHomeId: string,
  capabilities: string[],
  filters: {
    category?: ResidentDocumentCategory | "all";
    search?: string;
    includeHistory?: boolean;
  } = { category: "all" },
  pagination = { offset: 0, limit: 20 },
) {
  let docs = state.documents.filter(
    (item) =>
      item.residentId === residentId &&
      item.nursingHomeId === nursingHomeId &&
      canViewResidentDocument(item, capabilities) &&
      (filters.includeHistory ||
        !["archived", "entered_in_error", "superseded"].includes(item.status)),
  );
  if (filters.category && filters.category !== "all")
    docs = docs.filter((item) => item.category === filters.category);
  if (filters.search)
    docs = docs.filter((item) =>
      `${item.title} ${item.documentType}`.toLowerCase().includes(filters.search!.toLowerCase()),
    );
  const now = Date.now();
  const rows = docs
    .map((document) => {
      const version = state.versions.find((item) => item.id === document.currentVersionId)!;
      const attention =
        document.status === "expired" ||
        (document.expiryDate && Date.parse(document.expiryDate) < now)
          ? "expired"
          : document.reviewDate && Date.parse(document.reviewDate) < now
            ? "review_overdue"
            : document.expiryDate && Date.parse(document.expiryDate) < now + 30 * 86400000
              ? "expiring_soon"
              : undefined;
      return {
        document,
        currentVersion: {
          versionNumber: version.versionNumber,
          originalFileName: version.originalFileName,
          mimeType: version.mimeType,
          fileSizeBytes: version.fileSizeBytes,
          uploadedAt: version.uploadedAt,
          virusScanStatus: version.virusScanStatus,
        },
        attention,
      } as ResidentDocumentListItem;
    })
    .sort(
      (a, b) =>
        Number(Boolean(b.attention)) - Number(Boolean(a.attention)) ||
        b.document.updatedAt.localeCompare(a.document.updatedAt),
    );
  return {
    residentId,
    nursingHomeId,
    generatedAt: new Date().toISOString(),
    cacheKey: JSON.stringify([
      "resident-documents",
      1,
      residentId,
      nursingHomeId,
      filters,
      pagination,
      "capabilities-v1",
    ]),
    items: rows.slice(pagination.offset, pagination.offset + pagination.limit),
    total: rows.length,
    hasMore: pagination.offset + pagination.limit < rows.length,
  };
}
export const getResidentDocumentVersions = (
  state: ResidentDocumentState,
  documentId: string,
  capabilities: string[],
) => {
  if (!capabilities.includes("resident_documents.view_history"))
    throw new Error("Missing capability: resident_documents.view_history");
  return state.versions
    .filter((item) => item.documentId === documentId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
};
