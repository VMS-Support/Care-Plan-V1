import type { EmploymentRecord, ProfessionalRegistration, StaffMember } from "@/lib/care/types";
import { isCurrentEmployment } from "../employment/employmentStatus";
import { registrationIsCompliant, normaliseRegistrationStatus } from "./registrationStatus";

const REQUIRED_ROLE_KEYS = new Set(["NURSE", "DOCTOR"]);

export function roleRequiresRegistration(roleKey?: string) {
  return Boolean(roleKey && REQUIRED_ROLE_KEYS.has(roleKey));
}

export function getProfessionalRegistrationComplianceMetric(input: {
  staffMembers: StaffMember[];
  employmentRecords: EmploymentRecord[];
  registrations: ProfessionalRegistration[];
  effectiveAt?: string;
}) {
  const requiredStaffIds = new Set(
    input.employmentRecords
      .filter((record) => isCurrentEmployment(record, input.effectiveAt) && roleRequiresRegistration(record.primaryRoleKey))
      .map((record) => String(record.staffMemberId)),
  );
  const denominator = requiredStaffIds.size;
  let compliant = 0;
  let expiringSoon = 0;
  let expired = 0;
  let pendingVerification = 0;
  for (const staffId of requiredStaffIds) {
    const regs = input.registrations.filter((registration) => String(registration.staffMemberId) === staffId && registration.status !== "entered_in_error");
    if (regs.some((registration) => registrationIsCompliant(registration, input.effectiveAt))) compliant += 1;
    if (regs.some((registration) => normaliseRegistrationStatus(registration, input.effectiveAt) === "expired")) expired += 1;
    if (regs.some((registration) => registration.verificationStatus !== "verified")) pendingVerification += 1;
    if (regs.some((registration) => {
      if (!registration.expiryDate) return false;
      const days = Math.ceil((Date.parse(registration.expiryDate) - Date.parse(input.effectiveAt || new Date().toISOString().slice(0, 10))) / 86400000);
      return days >= 0 && days <= 30;
    })) expiringSoon += 1;
  }
  return {
    numerator: compliant,
    denominator,
    percentage: denominator ? Math.round((compliant / denominator) * 100) : undefined,
    compliantCount: compliant,
    expiringSoonCount: expiringSoon,
    expiredCount: expired,
    missingCount: Math.max(0, denominator - compliant),
    pendingVerificationCount: pendingVerification,
    unavailableCount: 0,
    explanation: "Currently employed staff in roles requiring professional registration.",
    generatedAt: new Date().toISOString(),
  };
}

export function getExpiringProfessionalRegistrationsMetric(registrations: ProfessionalRegistration[], warningWindow = 30, effectiveAt = new Date().toISOString().slice(0, 10)) {
  const count = registrations.filter((registration) => {
    if (!registration.expiryDate || registration.status === "entered_in_error") return false;
    const days = Math.ceil((Date.parse(registration.expiryDate) - Date.parse(effectiveAt)) / 86400000);
    return days >= 0 && days <= warningWindow && normaliseRegistrationStatus(registration, effectiveAt) !== "expired";
  }).length;
  return { value: count, route: `/workforce/staff?registration=expiring&days=${warningWindow}`, generatedAt: new Date().toISOString() };
}
