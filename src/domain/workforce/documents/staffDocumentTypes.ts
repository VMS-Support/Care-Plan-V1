import type { StaffDocumentType } from "@/lib/care/types";

export const STAFF_DOCUMENT_STATUS_LABELS = {
  draft: "Draft",
  pending_verification: "Pending Verification",
  valid: "Valid",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
  verification_failed: "Verification Failed",
  superseded: "Superseded",
  revoked: "Revoked",
  not_required: "Not Required",
  entered_in_error: "Entered in Error",
} as const;

export const STAFF_DOCUMENT_VERIFICATION_LABELS = {
  not_verified: "Not Verified",
  pending: "Pending",
  verified: "Verified",
  failed: "Failed",
  unable_to_verify: "Unable to Verify",
  verification_expired: "Verification Expired",
} as const;

export const DEFAULT_STAFF_DOCUMENT_TYPES: StaffDocumentType[] = [
  ["passport", "Passport", "identity", true, true, true, true, true],
  ["visa", "Visa", "immigration", true, true, true, true, true],
  ["employment_permit", "Employment Permit", "immigration", true, true, true, true, true],
  ["irish_residence_permission", "Irish Residence Permit / GNIB", "immigration", true, true, true, true, true],
  ["garda_vetting", "Garda Vetting", "vetting", true, true, true, true, true],
  ["manual_handling", "Manual Handling", "training", true, true, true, true, false],
  ["cpr", "CPR", "training", true, true, true, true, false],
  ["fire_training", "Fire Training", "training", true, true, true, true, false],
  ["professional_registration", "Professional Registration", "professional", true, true, true, true, true],
  ["reference", "Reference", "employment", true, false, true, true, true],
  ["qualification_certificate", "Qualification Certificate", "employment", true, true, true, true, false],
  ["induction_completion", "Induction Completion", "training", true, false, true, true, false],
  ["occupational_health", "Occupational Health", "occupational_health", true, false, true, true, true],
  ["vaccination_record", "Vaccination Record", "vaccination", true, false, true, true, true],
  ["other", "Other", "other", true, true, true, false, false],
].map(([key, name, category, supportsIssueDate, supportsExpiryDate, supportsReviewDate, requiresVerification, sensitive], index) => ({
  id: `staff-document-type-${key}`,
  key,
  name,
  category,
  supportsIssueDate,
  supportsExpiryDate,
  supportsReviewDate,
  requiresVerification,
  sensitive,
  active: true,
  displayOrder: index + 1,
}) as StaffDocumentType);

export function maskSensitiveReference(value?: string) {
  if (!value) return undefined;
  const compact = value.trim();
  if (compact.length <= 4) return "••••";
  return `•••• ${compact.slice(-4)}`;
}
