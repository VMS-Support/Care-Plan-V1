import type {
  StaffEmploymentPermitRecord,
  StaffEmploymentPermitType,
  StaffImmigrationComplianceStatus,
  StaffImmigrationRequirementProfile,
  StaffResidencePermissionRecord,
  StaffVisaRecord,
  StaffVisaType,
} from "@/lib/care/types";
import { maskSensitiveReference } from "../documents/staffDocumentTypes";
import { getCurrentEmploymentPermitRecords, getCurrentResidencePermissionRecord, getCurrentVisaRecord, getEffectiveImmigrationStatus } from "./immigrationService";

export interface ImmigrationRecordSummary {
  id: string;
  type: "visa" | "irish_residence_permission" | "employment_permit";
  label: string;
  referenceDisplay?: string;
  expiryDate?: string;
  reviewDate?: string;
  status: string;
  verificationStatus: string;
}

export interface StaffImmigrationSummary {
  staffMemberId: string;
  requirementProfile?: StaffImmigrationRequirementProfile;
  visa?: ImmigrationRecordSummary;
  residencePermission?: ImmigrationRecordSummary;
  employmentPermits: ImmigrationRecordSummary[];
  overallCompliance: StaffImmigrationComplianceStatus;
  nextExpiryDate?: string;
  nextReviewDate?: string;
  activeAlerts: { label: string; severity: "warning" | "critical"; recordId?: string }[];
  route: string;
}

export function visaSummary(record: StaffVisaRecord, visaTypes: StaffVisaType[], canViewSensitive: boolean): ImmigrationRecordSummary {
  const type = visaTypes.find((item) => item.id === record.visaTypeId);
  return {
    id: record.id,
    type: "visa",
    label: type?.name || "Visa",
    referenceDisplay: canViewSensitive ? record.visaReferenceNumber : maskSensitiveReference(record.visaReferenceNumber),
    expiryDate: record.expiryDate,
    reviewDate: record.reviewDate,
    status: getEffectiveImmigrationStatus(record).replaceAll("_", " "),
    verificationStatus: record.verificationStatus.replaceAll("_", " "),
  };
}

export function residencePermissionSummary(record: StaffResidencePermissionRecord, canViewSensitive: boolean): ImmigrationRecordSummary {
  return {
    id: record.id,
    type: "irish_residence_permission",
    label: "Irish Residence Permit / GNIB",
    referenceDisplay: canViewSensitive ? record.registrationNumber : maskSensitiveReference(record.registrationNumber),
    expiryDate: record.expiryDate,
    reviewDate: record.reviewDate,
    status: getEffectiveImmigrationStatus(record).replaceAll("_", " "),
    verificationStatus: record.verificationStatus.replaceAll("_", " "),
  };
}

export function employmentPermitSummary(record: StaffEmploymentPermitRecord, permitTypes: StaffEmploymentPermitType[], canViewSensitive: boolean): ImmigrationRecordSummary {
  const type = permitTypes.find((item) => item.id === record.permitTypeId);
  return {
    id: record.id,
    type: "employment_permit",
    label: type?.name || "Employment Permit",
    referenceDisplay: canViewSensitive ? record.permitNumber : maskSensitiveReference(record.permitNumber),
    expiryDate: record.expiryDate,
    reviewDate: record.reviewDate,
    status: getEffectiveImmigrationStatus(record).replaceAll("_", " "),
    verificationStatus: record.verificationStatus.replaceAll("_", " "),
  };
}

export function getStaffImmigrationSummary(input: {
  staffMemberId: string;
  requirementProfiles: StaffImmigrationRequirementProfile[];
  visaRecords: StaffVisaRecord[];
  residenceRecords: StaffResidencePermissionRecord[];
  permitRecords: StaffEmploymentPermitRecord[];
  visaTypes: StaffVisaType[];
  permitTypes: StaffEmploymentPermitType[];
  canViewSensitive: boolean;
  effectiveAt?: string;
}): StaffImmigrationSummary {
  const requirementProfile = input.requirementProfiles.find((profile) => String(profile.staffMemberId) === input.staffMemberId && profile.active);
  const visa = getCurrentVisaRecord(input.visaRecords, input.staffMemberId, input.effectiveAt);
  const residence = getCurrentResidencePermissionRecord(input.residenceRecords, input.staffMemberId, input.effectiveAt);
  const permits = getCurrentEmploymentPermitRecords(input.permitRecords, input.staffMemberId, undefined, input.effectiveAt);
  const summaries = [
    visa ? visaSummary(visa, input.visaTypes, input.canViewSensitive) : undefined,
    residence ? residencePermissionSummary(residence, input.canViewSensitive) : undefined,
    ...permits.map((permit) => employmentPermitSummary(permit, input.permitTypes, input.canViewSensitive)),
  ].filter(Boolean) as ImmigrationRecordSummary[];
  const alerts = summaries
    .filter((record) => record.status === "expired" || record.status === "expiring soon" || record.status === "pending verification" || record.status === "verification failed")
    .map((record) => ({ label: `${record.label} ${record.status}`, severity: record.status === "expired" || record.status === "verification failed" ? "critical" as const : "warning" as const, recordId: record.id }));
  const missingRequired =
    Boolean(requirementProfile?.visaRequired && !visa) ||
    Boolean(requirementProfile?.residencePermissionRequired && !residence) ||
    Boolean(requirementProfile?.employmentPermitRequired && permits.length === 0);
  const overallCompliance = !requirementProfile ? "not_assessed" : missingRequired ? "missing_required" : alerts.length ? "attention_required" : "compliant";
  const dates = summaries.flatMap((record) => [record.expiryDate, record.reviewDate]).filter(Boolean).sort() as string[];
  return {
    staffMemberId: input.staffMemberId,
    requirementProfile,
    visa: visa ? visaSummary(visa, input.visaTypes, input.canViewSensitive) : undefined,
    residencePermission: residence ? residencePermissionSummary(residence, input.canViewSensitive) : undefined,
    employmentPermits: permits.map((permit) => employmentPermitSummary(permit, input.permitTypes, input.canViewSensitive)),
    overallCompliance,
    nextExpiryDate: summaries.map((record) => record.expiryDate).filter(Boolean).sort()[0],
    nextReviewDate: summaries.map((record) => record.reviewDate).filter(Boolean).sort()[0],
    activeAlerts: alerts,
    route: `/workforce/staff/${input.staffMemberId}`,
  };
}
