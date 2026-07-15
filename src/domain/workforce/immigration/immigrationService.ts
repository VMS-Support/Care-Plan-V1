import type {
  EmploymentRecord,
  StaffDocumentVerificationStatus,
  StaffEmploymentPermitRecord,
  StaffEmploymentPermitType,
  StaffImmigrationRecordStatus,
  StaffResidencePermissionRecord,
  StaffVisaRecord,
  StaffVisaType,
} from "@/lib/care/types";
import type { EmploymentRecordId, NursingHomeId, StaffMemberId, UserAccountId } from "@/types/entityIds";
import { normaliseSensitiveNumber } from "./immigrationTypes";

interface ImmigrationState {
  staffMembers: { id: StaffMemberId | string }[];
  employmentRecords: EmploymentRecord[];
  staffVisaTypes: StaffVisaType[];
  staffEmploymentPermitTypes: StaffEmploymentPermitType[];
  staffVisaRecords: StaffVisaRecord[];
  staffResidencePermissionRecords: StaffResidencePermissionRecord[];
  staffEmploymentPermitRecords: StaffEmploymentPermitRecord[];
}

export interface CreateStaffVisaRecordCommand {
  staffMemberId: string;
  employmentRecordId?: string;
  visaTypeId: string;
  visaReferenceNumber?: string;
  issuingCountryCode?: string;
  issuingAuthority?: string;
  issueDate?: string;
  validFrom?: string;
  expiryDate?: string;
  reviewDate?: string;
  evidenceFileId?: string;
  verificationReference?: string;
  restrictionsOrConditionsPresent?: boolean;
  restrictionsSummary?: string;
  notes?: string;
  clientRequestId: string;
}

export interface CreateResidencePermissionRecordCommand {
  staffMemberId: string;
  employmentRecordId?: string;
  registrationNumber: string;
  permissionTypeOrStamp?: string;
  issueDate?: string;
  expiryDate?: string;
  reviewDate?: string;
  evidenceFileId?: string;
  verificationReference?: string;
  notes?: string;
  clientRequestId: string;
}

export interface CreateEmploymentPermitRecordCommand {
  staffMemberId: string;
  employmentRecordId?: string;
  permitTypeId: string;
  permitNumber?: string;
  employerName?: string;
  employerReferenceId?: string;
  roleKey?: string;
  issueDate?: string;
  validFrom?: string;
  expiryDate?: string;
  reviewDate?: string;
  evidenceFileId?: string;
  verificationReference?: string;
  restrictionsOrConditionsPresent?: boolean;
  restrictionsSummary?: string;
  notes?: string;
  clientRequestId: string;
}

export function getEffectiveImmigrationStatus(record: { status: StaffImmigrationRecordStatus; verificationStatus: StaffDocumentVerificationStatus; validFrom?: string; expiryDate?: string; reviewDate?: string }, effectiveAt = new Date().toISOString().slice(0, 10), warningWindow = 30): StaffImmigrationRecordStatus {
  if (["entered_in_error", "revoked", "suspended", "not_required"].includes(record.status)) return record.status;
  if (record.verificationStatus === "failed" || record.status === "verification_failed") return "verification_failed";
  if (record.verificationStatus === "pending" || record.status === "pending_verification") return "pending_verification";
  if (record.validFrom && record.validFrom > effectiveAt) return "draft";
  if (record.expiryDate) {
    const days = Math.ceil((Date.parse(record.expiryDate) - Date.parse(effectiveAt)) / 86400000);
    if (days < 0) return "expired";
    if (days <= warningWindow) return "expiring_soon";
  }
  return record.verificationStatus === "verified" ? "valid" : record.status;
}

function validateBase(state: ImmigrationState, command: { staffMemberId: string; employmentRecordId?: string; issueDate?: string; validFrom?: string; expiryDate?: string }) {
  const errors: string[] = [];
  if (!state.staffMembers.some((staff) => String(staff.id) === command.staffMemberId)) errors.push("Staff Member is required.");
  if (command.employmentRecordId && !state.employmentRecords.some((record) => String(record.id) === command.employmentRecordId && String(record.staffMemberId) === command.staffMemberId)) errors.push("Employment Record must belong to this Staff Member.");
  if (command.issueDate && command.expiryDate && command.expiryDate < command.issueDate) errors.push("This expiry date is earlier than the issue date.");
  if (command.validFrom && command.expiryDate && command.expiryDate < command.validFrom) errors.push("This expiry date is earlier than the valid-from date.");
  return errors;
}

export function createStaffVisaRecord(state: ImmigrationState, command: CreateStaffVisaRecordCommand, actorUserAccountId: string) {
  const errors = validateBase(state, command);
  if (!state.staffVisaTypes.some((type) => type.id === command.visaTypeId && type.active)) errors.push("Visa Type is required.");
  if (errors.length) throw new Error(errors[0]);
  const now = new Date().toISOString();
  const record: StaffVisaRecord = {
    id: `staff-visa-${command.clientRequestId || Date.now()}`,
    staffMemberId: command.staffMemberId as StaffMemberId,
    employmentRecordId: command.employmentRecordId as EmploymentRecordId | undefined,
    visaTypeId: command.visaTypeId,
    visaReferenceNumber: command.visaReferenceNumber?.trim(),
    issuingCountryCode: command.issuingCountryCode,
    issuingAuthority: command.issuingAuthority,
    issueDate: command.issueDate,
    validFrom: command.validFrom,
    expiryDate: command.expiryDate,
    reviewDate: command.reviewDate,
    status: "pending_verification",
    verificationStatus: "pending",
    evidenceFileId: command.evidenceFileId,
    verificationReference: command.verificationReference,
    restrictionsOrConditionsPresent: Boolean(command.restrictionsOrConditionsPresent),
    restrictionsSummary: command.restrictionsSummary,
    notes: command.notes,
    versionNumber: 1,
    versionChainId: `staff-visa-chain-${command.clientRequestId || Date.now()}`,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as UserAccountId,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  };
  return record;
}

export function createResidencePermissionRecord(state: ImmigrationState, command: CreateResidencePermissionRecordCommand, actorUserAccountId: string) {
  const errors = validateBase(state, command);
  if (!command.registrationNumber.trim()) errors.push("Registration Number is required.");
  const normalised = normaliseSensitiveNumber(command.registrationNumber);
  if (state.staffResidencePermissionRecords.some((record) => record.normalisedRegistrationNumber === normalised && record.status !== "entered_in_error")) errors.push("This Residence Permission registration number is already recorded.");
  if (errors.length) throw new Error(errors[0]);
  const now = new Date().toISOString();
  const record: StaffResidencePermissionRecord = {
    id: `staff-residence-permission-${command.clientRequestId || Date.now()}`,
    staffMemberId: command.staffMemberId as StaffMemberId,
    employmentRecordId: command.employmentRecordId as EmploymentRecordId | undefined,
    registrationNumber: command.registrationNumber.trim(),
    normalisedRegistrationNumber: normalised,
    permissionTypeOrStamp: command.permissionTypeOrStamp,
    issueDate: command.issueDate,
    expiryDate: command.expiryDate,
    reviewDate: command.reviewDate,
    status: "pending_verification",
    verificationStatus: "pending",
    evidenceFileId: command.evidenceFileId,
    verificationReference: command.verificationReference,
    notes: command.notes,
    versionNumber: 1,
    versionChainId: `staff-residence-permission-chain-${command.clientRequestId || Date.now()}`,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as UserAccountId,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  };
  return record;
}

export function createEmploymentPermitRecord(state: ImmigrationState, command: CreateEmploymentPermitRecordCommand, actorUserAccountId: string) {
  const errors = validateBase(state, command);
  if (!state.staffEmploymentPermitTypes.some((type) => type.id === command.permitTypeId && type.active)) errors.push("Employment Permit Type is required.");
  if (errors.length) throw new Error(errors[0]);
  const now = new Date().toISOString();
  const record: StaffEmploymentPermitRecord = {
    id: `staff-employment-permit-${command.clientRequestId || Date.now()}`,
    staffMemberId: command.staffMemberId as StaffMemberId,
    employmentRecordId: command.employmentRecordId as EmploymentRecordId | undefined,
    permitTypeId: command.permitTypeId,
    permitNumber: command.permitNumber?.trim(),
    employerName: command.employerName,
    employerReferenceId: command.employerReferenceId as NursingHomeId | undefined,
    roleKey: command.roleKey,
    issueDate: command.issueDate,
    validFrom: command.validFrom,
    expiryDate: command.expiryDate,
    reviewDate: command.reviewDate,
    status: "pending_verification",
    verificationStatus: "pending",
    evidenceFileId: command.evidenceFileId,
    verificationReference: command.verificationReference,
    restrictionsOrConditionsPresent: Boolean(command.restrictionsOrConditionsPresent),
    restrictionsSummary: command.restrictionsSummary,
    notes: command.notes,
    versionNumber: 1,
    versionChainId: `staff-employment-permit-chain-${command.clientRequestId || Date.now()}`,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as UserAccountId,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  };
  return record;
}

export function verifyImmigrationRecord<T extends StaffVisaRecord | StaffResidencePermissionRecord | StaffEmploymentPermitRecord>(record: T, actorUserAccountId: string, status: StaffDocumentVerificationStatus = "verified") {
  const now = new Date().toISOString();
  const next = {
    ...record,
    verificationStatus: status,
    status: status === "verified" ? "valid" : status === "failed" || status === "unable_to_verify" ? "verification_failed" : "pending_verification",
    lastVerifiedAt: status === "verified" ? now : record.lastVerifiedAt,
    verifiedByUserAccountId: status === "verified" ? actorUserAccountId as UserAccountId : record.verifiedByUserAccountId,
    updatedAt: now,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  };
  return { ...next, status: getEffectiveImmigrationStatus(next) } as T;
}

function isCurrentCandidate(record: { status: StaffImmigrationRecordStatus; validFrom?: string; issueDate?: string; expiryDate?: string; versionNumber: number; versionChainId: string }, effectiveAt: string) {
  if (record.status === "entered_in_error" || record.status === "revoked") return false;
  if ((record.validFrom || record.issueDate) && (record.validFrom || record.issueDate)! > effectiveAt) return false;
  return getEffectiveImmigrationStatus(record as any, effectiveAt) !== "expired";
}

export function getCurrentVisaRecord(records: StaffVisaRecord[], staffMemberId: string, effectiveAt = new Date().toISOString().slice(0, 10)) {
  return records
    .filter((record) => String(record.staffMemberId) === staffMemberId && isCurrentCandidate(record, effectiveAt))
    .sort((a, b) => b.versionNumber - a.versionNumber || String(b.issueDate || "").localeCompare(String(a.issueDate || "")))[0];
}

export function getCurrentResidencePermissionRecord(records: StaffResidencePermissionRecord[], staffMemberId: string, effectiveAt = new Date().toISOString().slice(0, 10)) {
  return records
    .filter((record) => String(record.staffMemberId) === staffMemberId && isCurrentCandidate(record, effectiveAt))
    .sort((a, b) => b.versionNumber - a.versionNumber || String(b.issueDate || "").localeCompare(String(a.issueDate || "")))[0];
}

export function getCurrentEmploymentPermitRecords(records: StaffEmploymentPermitRecord[], staffMemberId: string, employmentContext?: { employmentRecordId?: string; roleKey?: string; employerReferenceId?: string }, effectiveAt = new Date().toISOString().slice(0, 10)) {
  return records
    .filter((record) =>
      String(record.staffMemberId) === staffMemberId &&
      isCurrentCandidate(record, effectiveAt) &&
      (!employmentContext?.employmentRecordId || String(record.employmentRecordId || "") === employmentContext.employmentRecordId) &&
      (!employmentContext?.roleKey || !record.roleKey || record.roleKey === employmentContext.roleKey) &&
      (!employmentContext?.employerReferenceId || !record.employerReferenceId || String(record.employerReferenceId) === employmentContext.employerReferenceId),
    )
    .sort((a, b) => b.versionNumber - a.versionNumber || String(b.issueDate || "").localeCompare(String(a.issueDate || "")));
}
