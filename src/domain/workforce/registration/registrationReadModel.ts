import type { Facility, ProfessionalRegistration, StaffMember } from "@/lib/care/types";
import { REGISTRATION_VERIFICATION_STATUS_LABELS, normaliseRegistrationStatus } from "./registrationStatus";

export interface ProfessionalRegistrationRow {
  id: string;
  staffMemberId: string;
  staffName: string;
  registrationBody: string;
  profession: string;
  registrationNumber?: string;
  expiryDate?: string;
  status: string;
  verificationStatus: string;
  restrictionsOrConditionsPresent: boolean;
  documentLinked: boolean;
  route: string;
}

export function professionalRegistrationRow(record: ProfessionalRegistration, input: { staffMembers: StaffMember[]; facilities: Facility[]; canViewNumber: boolean }): ProfessionalRegistrationRow {
  const staff = input.staffMembers.find((item) => item.id === record.staffMemberId);
  return {
    id: String(record.id),
    staffMemberId: String(record.staffMemberId),
    staffName: staff?.displayName || `${staff?.firstName || ""} ${staff?.lastName || ""}`.trim() || "Staff Member",
    registrationBody: record.registrationBody,
    profession: record.professionKey || record.profession,
    registrationNumber: input.canViewNumber ? record.registrationNumber : record.registrationNumber ? "••••" : undefined,
    expiryDate: record.expiryDate,
    status: normaliseRegistrationStatus(record).replaceAll("_", " "),
    verificationStatus: REGISTRATION_VERIFICATION_STATUS_LABELS[record.verificationStatus || "not_submitted"],
    restrictionsOrConditionsPresent: Boolean(record.restrictionsOrConditionsPresent),
    documentLinked: Boolean(record.documentIds?.length),
    route: `/workforce/staff/${record.staffMemberId}`,
  };
}
