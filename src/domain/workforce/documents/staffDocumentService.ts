import type {
  StaffDocument,
  StaffDocumentStatus,
  StaffDocumentType,
  StaffDocumentVerificationRecord,
  StaffDocumentVerificationStatus,
} from "@/lib/care/types";
import type { EmploymentRecordId, StaffMemberId, UserAccountId } from "@/types/entityIds";

export interface CreateStaffDocumentCommand {
  staffMemberId: string;
  employmentRecordId?: string;
  documentTypeId: string;
  title?: string;
  referenceNumber?: string;
  issuingAuthority?: string;
  issuingCountryCode?: string;
  issueDate?: string;
  expiryDate?: string;
  reviewDate?: string;
  fileId: string;
  notes?: string;
  linkedProfessionalRegistrationId?: string;
  linkedVisaRecordId?: string;
  linkedResidencePermissionRecordId?: string;
  linkedEmploymentPermitRecordId?: string;
  clientRequestId: string;
}

export interface StaffDocumentState {
  staffMembers: { id: StaffMemberId | string }[];
  employmentRecords: { id: EmploymentRecordId | string; staffMemberId: StaffMemberId | string }[];
  staffDocumentTypes: StaffDocumentType[];
  staffDocuments: StaffDocument[];
}

export function getEffectiveStaffDocumentStatus(document: StaffDocument, effectiveAt = new Date().toISOString().slice(0, 10), warningWindow = 30): StaffDocumentStatus {
  if (["entered_in_error", "revoked", "superseded", "not_required"].includes(document.status)) return document.status;
  if (document.verificationStatus === "failed" || document.status === "verification_failed") return "verification_failed";
  if (document.verificationStatus === "pending" || document.status === "pending_verification") return "pending_verification";
  if (document.expiryDate) {
    const days = Math.ceil((Date.parse(document.expiryDate) - Date.parse(effectiveAt)) / 86400000);
    if (days < 0) return "expired";
    if (days <= warningWindow) return "expiring_soon";
  }
  return document.verificationStatus === "verified" ? "valid" : document.status;
}

export function validateStaffDocumentCommand(state: StaffDocumentState, command: CreateStaffDocumentCommand, existingId?: string) {
  const errors: string[] = [];
  if (!command.staffMemberId || !state.staffMembers.some((staff) => String(staff.id) === command.staffMemberId)) errors.push("Staff Member is required.");
  const type = state.staffDocumentTypes.find((item) => item.id === command.documentTypeId && item.active);
  if (!type) errors.push("Document Type is required.");
  if (!command.fileId?.trim()) errors.push("The uploaded file could not be linked.");
  if (command.employmentRecordId && !state.employmentRecords.some((record) => String(record.id) === command.employmentRecordId && String(record.staffMemberId) === command.staffMemberId)) {
    errors.push("Employment Record must belong to this Staff Member.");
  }
  if (command.issueDate && command.expiryDate && command.expiryDate < command.issueDate) errors.push("This expiry date is earlier than the issue date.");
  if (command.referenceNumber?.trim() && type) {
    const duplicate = state.staffDocuments.some((document) =>
      String(document.id) !== existingId &&
      document.documentTypeId === type.id &&
      document.referenceNumber?.trim().toLowerCase() === command.referenceNumber?.trim().toLowerCase() &&
      document.status !== "entered_in_error",
    );
    if (duplicate) errors.push("This document reference is already recorded.");
  }
  return errors;
}

export function createStaffDocument(state: StaffDocumentState, command: CreateStaffDocumentCommand, actorUserAccountId: string) {
  const errors = validateStaffDocumentCommand(state, command);
  if (errors.length) throw new Error(errors[0]);
  const type = state.staffDocumentTypes.find((item) => item.id === command.documentTypeId)!;
  const now = new Date().toISOString();
  const document: StaffDocument = {
    id: `staff-document-${command.clientRequestId || Date.now()}`,
    staffMemberId: command.staffMemberId as StaffMemberId,
    employmentRecordId: command.employmentRecordId as EmploymentRecordId | undefined,
    documentTypeId: command.documentTypeId,
    title: command.title?.trim() || type.name,
    referenceNumber: command.referenceNumber?.trim(),
    issuingAuthority: command.issuingAuthority?.trim(),
    issuingCountryCode: command.issuingCountryCode?.trim(),
    issueDate: command.issueDate,
    expiryDate: command.expiryDate,
    reviewDate: command.reviewDate,
    status: type.requiresVerification ? "pending_verification" : "valid",
    verificationStatus: type.requiresVerification ? "pending" : "not_verified",
    fileId: command.fileId.trim(),
    linkedProfessionalRegistrationId: command.linkedProfessionalRegistrationId as StaffDocument["linkedProfessionalRegistrationId"],
    linkedVisaRecordId: command.linkedVisaRecordId,
    linkedResidencePermissionRecordId: command.linkedResidencePermissionRecordId,
    linkedEmploymentPermitRecordId: command.linkedEmploymentPermitRecordId,
    notes: command.notes,
    versionNumber: 1,
    versionChainId: `staff-document-chain-${command.clientRequestId || Date.now()}`,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as UserAccountId,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  };
  return { ...document, status: getEffectiveStaffDocumentStatus(document) } satisfies StaffDocument;
}

export function updateStaffDocument(state: StaffDocumentState, current: StaffDocument, patch: Partial<CreateStaffDocumentCommand>, actorUserAccountId: string) {
  const command: CreateStaffDocumentCommand = {
    staffMemberId: String(current.staffMemberId),
    employmentRecordId: patch.employmentRecordId ?? (current.employmentRecordId ? String(current.employmentRecordId) : undefined),
    documentTypeId: patch.documentTypeId ?? current.documentTypeId,
    title: patch.title ?? current.title,
    referenceNumber: patch.referenceNumber ?? current.referenceNumber,
    issuingAuthority: patch.issuingAuthority ?? current.issuingAuthority,
    issuingCountryCode: patch.issuingCountryCode ?? current.issuingCountryCode,
    issueDate: patch.issueDate ?? current.issueDate,
    expiryDate: patch.expiryDate ?? current.expiryDate,
    reviewDate: patch.reviewDate ?? current.reviewDate,
    fileId: patch.fileId ?? current.fileId,
    notes: patch.notes ?? current.notes,
    clientRequestId: patch.clientRequestId || String(current.id),
  };
  const errors = validateStaffDocumentCommand(state, command, String(current.id));
  if (errors.length) throw new Error(errors[0]);
  const next = { ...current, ...patch, updatedAt: new Date().toISOString(), updatedByUserAccountId: actorUserAccountId as UserAccountId } as StaffDocument;
  return { ...next, status: getEffectiveStaffDocumentStatus(next) } satisfies StaffDocument;
}

export function verifyStaffDocument(document: StaffDocument, status: StaffDocumentVerificationStatus, actorUserAccountId: string, notes?: string, method: StaffDocument["verificationMethod"] = "manual_review") {
  const now = new Date().toISOString();
  const verification: StaffDocumentVerificationRecord = {
    id: `staff-document-verification-${document.id}-${now}`,
    staffDocumentId: document.id,
    status,
    method,
    notes,
    actorUserAccountId: actorUserAccountId as UserAccountId,
    occurredAt: now,
  };
  const next: StaffDocument = {
    ...document,
    verificationStatus: status,
    status: status === "verified" ? "valid" : status === "failed" ? "verification_failed" : status === "unable_to_verify" ? "verification_failed" : "pending_verification",
    lastVerifiedAt: status === "verified" ? now : document.lastVerifiedAt,
    verifiedByUserAccountId: status === "verified" ? actorUserAccountId as UserAccountId : document.verifiedByUserAccountId,
    verificationMethod: method,
    updatedAt: now,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  };
  return { document: { ...next, status: getEffectiveStaffDocumentStatus(next) }, verification };
}

export function replaceStaffDocument(current: StaffDocument, command: CreateStaffDocumentCommand, actorUserAccountId: string) {
  const now = new Date().toISOString();
  const replacement: StaffDocument = {
    ...current,
    id: `staff-document-${command.clientRequestId || Date.now()}`,
    fileId: command.fileId,
    title: command.title ?? current.title,
    referenceNumber: command.referenceNumber ?? current.referenceNumber,
    issuingAuthority: command.issuingAuthority ?? current.issuingAuthority,
    issuingCountryCode: command.issuingCountryCode ?? current.issuingCountryCode,
    issueDate: command.issueDate ?? current.issueDate,
    expiryDate: command.expiryDate ?? current.expiryDate,
    reviewDate: command.reviewDate ?? current.reviewDate,
    status: "pending_verification",
    verificationStatus: "pending",
    lastVerifiedAt: undefined,
    verifiedByUserAccountId: undefined,
    versionNumber: current.versionNumber + 1,
    supersedesDocumentId: current.id,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as UserAccountId,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  };
  return {
    superseded: { ...current, status: "superseded" as const, updatedAt: now, updatedByUserAccountId: actorUserAccountId as UserAccountId },
    replacement,
  };
}
