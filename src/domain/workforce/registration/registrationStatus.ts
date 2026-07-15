import type { ProfessionalRegistration, ProfessionalRegistrationStatus, ProfessionalRegistrationVerificationStatus } from "@/lib/care/types";

export const PROFESSIONAL_REGISTRATION_STATUS_LABELS: Record<ProfessionalRegistrationStatus, string> = {
  draft: "Draft",
  current: "Current",
  expired: "Expired",
  suspended: "Suspended",
  revoked: "Revoked",
  entered_in_error: "Entered in Error",
};

export const REGISTRATION_VERIFICATION_STATUS_LABELS: Record<ProfessionalRegistrationVerificationStatus, string> = {
  not_submitted: "Not Submitted",
  submitted: "Submitted",
  verified: "Verified",
  failed: "Failed",
  unable_to_verify: "Unable To Verify",
  stale: "Stale",
};

export function normaliseRegistrationStatus(record: ProfessionalRegistration, at = new Date().toISOString().slice(0, 10)): ProfessionalRegistrationStatus {
  if (record.status === "entered_in_error" || record.status === "revoked" || record.status === "suspended") return record.status;
  if (record.expiryDate && record.expiryDate < at) return "expired";
  if (record.status) return record.status;
  if (record.registrationStatus === "expired") return "expired";
  if (record.registrationStatus === "suspended") return "suspended";
  return "current";
}

export function registrationIsCompliant(record: ProfessionalRegistration, at?: string) {
  return normaliseRegistrationStatus(record, at) === "current" && record.verificationStatus === "verified";
}
