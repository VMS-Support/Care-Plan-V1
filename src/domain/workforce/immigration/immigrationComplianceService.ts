import type {
  EmploymentRecord,
  StaffEmploymentPermitRecord,
  StaffImmigrationRequirementProfile,
  StaffResidencePermissionRecord,
  StaffVisaRecord,
} from "@/lib/care/types";
import { isCurrentEmployment } from "../employment/employmentStatus";
import { getEffectiveImmigrationStatus } from "./immigrationService";

const isValid = (record: { status: any; verificationStatus: any; expiryDate?: string; validFrom?: string }) =>
  record.verificationStatus === "verified" && ["valid", "expiring_soon"].includes(getEffectiveImmigrationStatus(record as any));

function currentStaffIds(employmentRecords: EmploymentRecord[]) {
  return new Set(employmentRecords.filter((record) => isCurrentEmployment(record)).map((record) => String(record.staffMemberId)));
}

export function getVisaComplianceMetric(input: { employmentRecords: EmploymentRecord[]; visaRecords: StaffVisaRecord[] }) {
  const staffIds = currentStaffIds(input.employmentRecords);
  let valid = 0;
  let expiring = 0;
  let expired = 0;
  for (const staffId of staffIds) {
    const records = input.visaRecords.filter((record) => String(record.staffMemberId) === staffId && record.status !== "entered_in_error");
    if (records.some(isValid)) valid += 1;
    if (records.some((record) => getEffectiveImmigrationStatus(record) === "expiring_soon")) expiring += 1;
    if (records.some((record) => getEffectiveImmigrationStatus(record) === "expired")) expired += 1;
  }
  return { denominator: staffIds.size, valid, expiring, expired, percentage: staffIds.size ? Math.round((valid / staffIds.size) * 100) : undefined, generatedAt: new Date().toISOString() };
}

export function getResidencePermissionMetric(input: { employmentRecords: EmploymentRecord[]; residenceRecords: StaffResidencePermissionRecord[] }) {
  const staffIds = currentStaffIds(input.employmentRecords);
  let valid = 0;
  for (const staffId of staffIds) {
    if (input.residenceRecords.some((record) => String(record.staffMemberId) === staffId && isValid(record))) valid += 1;
  }
  return { denominator: staffIds.size, valid, percentage: staffIds.size ? Math.round((valid / staffIds.size) * 100) : undefined, generatedAt: new Date().toISOString() };
}

export function getEmploymentPermitValidMetric(input: { employmentRecords: EmploymentRecord[]; permitRecords: StaffEmploymentPermitRecord[] }) {
  const staffIds = currentStaffIds(input.employmentRecords);
  let valid = 0;
  for (const staffId of staffIds) {
    if (input.permitRecords.some((record) => String(record.staffMemberId) === staffId && isValid(record))) valid += 1;
  }
  return { denominator: staffIds.size, valid, percentage: staffIds.size ? Math.round((valid / staffIds.size) * 100) : undefined, generatedAt: new Date().toISOString() };
}

export function evaluateStaffImmigrationCompliance(input: {
  staffMemberId: string;
  requirementProfiles: StaffImmigrationRequirementProfile[];
  visaRecords: StaffVisaRecord[];
  residenceRecords: StaffResidencePermissionRecord[];
  permitRecords: StaffEmploymentPermitRecord[];
}) {
  const profile = input.requirementProfiles.find((item) => String(item.staffMemberId) === input.staffMemberId && item.active);
  if (!profile) return "not_assessed" as const;
  const missingVisa = profile.visaRequired && !input.visaRecords.some((record) => String(record.staffMemberId) === input.staffMemberId && isValid(record));
  const missingResidence = profile.residencePermissionRequired && !input.residenceRecords.some((record) => String(record.staffMemberId) === input.staffMemberId && isValid(record));
  const missingPermit = profile.employmentPermitRequired && !input.permitRecords.some((record) => String(record.staffMemberId) === input.staffMemberId && isValid(record));
  return missingVisa || missingResidence || missingPermit ? "missing_required" as const : "compliant" as const;
}
