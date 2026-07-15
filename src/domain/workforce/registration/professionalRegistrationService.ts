import type { ProfessionalRegistration, ProfessionalRegistrationStatus, ProfessionalRegistrationVerification, ProfessionalRegistrationVerificationStatus } from "@/lib/care/types";
import { asProfessionalRegistrationId, type StaffMemberId, type UserAccountId } from "@/types/entityIds";

export interface CreateProfessionalRegistrationCommand {
  staffMemberId: string;
  employmentRecordId?: string;
  registrationBody: string;
  registrationBodyId?: string;
  profession: ProfessionalRegistration["profession"];
  professionKey?: string;
  registrationType?: string;
  registrationNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  reviewDate?: string;
  status?: ProfessionalRegistrationStatus;
  verificationStatus?: ProfessionalRegistrationVerificationStatus;
  restrictionsOrConditionsPresent?: boolean;
  restrictedSummary?: string;
  documentIds?: string[];
  notes?: string;
}

export interface ProfessionalRegistrationState {
  professionalRegistrations: ProfessionalRegistration[];
}

const normaliseNumber = (value?: string) => value?.trim().toUpperCase().replace(/\s+/g, "") || undefined;

export function validateProfessionalRegistrationCommand(state: ProfessionalRegistrationState, command: CreateProfessionalRegistrationCommand, existingId?: string) {
  const errors: string[] = [];
  if (!command.staffMemberId) errors.push("Staff Member is required.");
  if (!command.registrationBody.trim()) errors.push("Registration Body is required.");
  if (!command.profession) errors.push("Profession is required.");
  if (command.issueDate && command.expiryDate && command.expiryDate < command.issueDate) errors.push("Expiry date cannot be before issue date.");
  const normalised = normaliseNumber(command.registrationNumber);
  if (normalised && state.professionalRegistrations.some((record) => String(record.id) !== existingId && (record.registrationBodyId || record.registrationBody).toLowerCase() === (command.registrationBodyId || command.registrationBody).toLowerCase() && record.normalisedRegistrationNumber === normalised)) {
    errors.push("This Registration Number is already recorded for this Registration Body.");
  }
  return errors;
}

export function createProfessionalRegistration(state: ProfessionalRegistrationState, command: CreateProfessionalRegistrationCommand, actorUserAccountId: string) {
  const errors = validateProfessionalRegistrationCommand(state, command);
  if (errors.length) throw new Error(errors[0]);
  const now = new Date().toISOString();
  const registration: ProfessionalRegistration = {
    id: asProfessionalRegistrationId(`professional-registration-${crypto.randomUUID?.() || Date.now()}`),
    staffMemberId: command.staffMemberId as StaffMemberId,
    employmentRecordId: command.employmentRecordId as ProfessionalRegistration["employmentRecordId"],
    registrationBodyId: command.registrationBodyId,
    profession: command.profession,
    professionKey: command.professionKey || command.profession,
    registrationType: command.registrationType,
    registrationBody: command.registrationBody.trim(),
    registrationNumber: command.registrationNumber?.trim(),
    normalisedRegistrationNumber: normaliseNumber(command.registrationNumber),
    registrationStatus: command.status === "expired" ? "expired" : command.status === "suspended" ? "suspended" : "active",
    status: command.status || "draft",
    verificationStatus: command.verificationStatus || "not_submitted",
    issueDate: command.issueDate,
    expiryDate: command.expiryDate,
    reviewDate: command.reviewDate,
    restrictionsOrConditionsPresent: Boolean(command.restrictionsOrConditionsPresent),
    restrictedSummary: command.restrictedSummary,
    documentIds: command.documentIds || [],
    verificationHistory: [],
    notes: command.notes,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as UserAccountId,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  };
  return registration;
}

export function updateProfessionalRegistration(state: ProfessionalRegistrationState, current: ProfessionalRegistration, patch: Partial<CreateProfessionalRegistrationCommand>, actorUserAccountId: string) {
  const command: CreateProfessionalRegistrationCommand = {
    staffMemberId: String(current.staffMemberId),
    employmentRecordId: patch.employmentRecordId ?? (current.employmentRecordId ? String(current.employmentRecordId) : undefined),
    registrationBody: patch.registrationBody ?? current.registrationBody,
    registrationBodyId: patch.registrationBodyId ?? current.registrationBodyId,
    profession: patch.profession ?? current.profession,
    professionKey: patch.professionKey ?? current.professionKey,
    registrationType: patch.registrationType ?? current.registrationType,
    registrationNumber: patch.registrationNumber ?? current.registrationNumber,
    issueDate: patch.issueDate ?? current.issueDate,
    expiryDate: patch.expiryDate ?? current.expiryDate,
    reviewDate: patch.reviewDate ?? current.reviewDate,
    status: patch.status ?? current.status,
    verificationStatus: patch.verificationStatus ?? current.verificationStatus,
    restrictionsOrConditionsPresent: patch.restrictionsOrConditionsPresent ?? current.restrictionsOrConditionsPresent,
    restrictedSummary: patch.restrictedSummary ?? current.restrictedSummary,
    documentIds: patch.documentIds ?? current.documentIds,
    notes: patch.notes ?? current.notes,
  };
  const errors = validateProfessionalRegistrationCommand(state, command, String(current.id));
  if (errors.length) throw new Error(errors[0]);
  return {
    ...current,
    ...command,
    normalisedRegistrationNumber: normaliseNumber(command.registrationNumber),
    registrationStatus: command.status === "expired" ? "expired" : command.status === "suspended" ? "suspended" : "active",
    updatedAt: new Date().toISOString(),
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  } satisfies ProfessionalRegistration;
}

export function appendRegistrationVerification(record: ProfessionalRegistration, status: ProfessionalRegistrationVerificationStatus, actorUserAccountId: string, notes?: string) {
  const now = new Date().toISOString();
  const verification: ProfessionalRegistrationVerification = {
    id: `registration-verification-${record.id}-${now}`,
    registrationId: record.id,
    status,
    verifiedByUserAccountId: actorUserAccountId as UserAccountId,
    verifiedAt: ["verified", "failed", "unable_to_verify"].includes(status) ? now : undefined,
    notes,
    createdAt: now,
  };
  return {
    ...record,
    verificationStatus: status,
    verifiedAt: status === "verified" ? now : record.verifiedAt,
    verifiedBy: status === "verified" ? actorUserAccountId as UserAccountId : record.verifiedBy,
    verificationHistory: [verification, ...(record.verificationHistory || [])],
    updatedAt: now,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  } satisfies ProfessionalRegistration;
}
