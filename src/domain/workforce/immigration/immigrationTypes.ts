import type { StaffEmploymentPermitType, StaffVisaType } from "@/lib/care/types";

export const IMMIGRATION_STATUS_LABELS = {
  draft: "Draft",
  pending_verification: "Pending Verification",
  valid: "Valid",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
  verification_failed: "Verification Failed",
  suspended: "Suspended",
  revoked: "Revoked",
  not_required: "Not Required",
  entered_in_error: "Entered in Error",
} as const;

export const DEFAULT_STAFF_VISA_TYPES: StaffVisaType[] = [
  { id: "visa-type-general-employment", code: "GENERAL_EMPLOYMENT", name: "Employment Visa", countryCode: "IE", permitsEmployment: "conditional", requiresEmploymentPermit: true, active: true },
  { id: "visa-type-critical-skills", code: "CRITICAL_SKILLS", name: "Critical Skills Visa", countryCode: "IE", permitsEmployment: "conditional", requiresEmploymentPermit: true, active: true },
  { id: "visa-type-right-to-work-confirmed", code: "RIGHT_TO_WORK_CONFIRMED", name: "Right to Work Confirmed", countryCode: "IE", permitsEmployment: "yes", requiresEmploymentPermit: false, active: true },
];

export const DEFAULT_STAFF_EMPLOYMENT_PERMIT_TYPES: StaffEmploymentPermitType[] = [
  { id: "permit-type-general", code: "GENERAL", name: "General Employment Permit", active: true },
  { id: "permit-type-critical-skills", code: "CRITICAL_SKILLS", name: "Critical Skills Employment Permit", active: true },
  { id: "permit-type-intra-company-transfer", code: "INTRA_COMPANY_TRANSFER", name: "Intra-Company Transfer Permit", active: true },
];

export const normaliseSensitiveNumber = (value?: string) => value?.trim().toUpperCase().replace(/\s+/g, "") || undefined;
