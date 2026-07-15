import type { EmploymentHomeAssignment, EmploymentRecord, EmploymentRoleAssignment, Facility } from "@/lib/care/types";
import { EMPLOYMENT_CONTRACT_TYPE_LABELS, EMPLOYMENT_STATUS_LABELS, getEffectiveEmploymentStatus, normaliseContractedHoursPerWeek, normaliseEmploymentRecordStatus } from "./employmentStatus";
import { roleLabelForKey } from "../staffDirectory/staffRoleSummaryResolver";

export interface EmploymentRecordCardModel {
  id: string;
  employeeNumber: string;
  contractType: string;
  status: string;
  effectiveState: string;
  startDate: string;
  endDate?: string;
  fte?: number;
  contractedHoursPerWeek?: number;
  primaryHome: string;
  primaryRole: string;
  additionalHomes: string[];
  additionalRoles: string[];
  payrollLinked: boolean;
}

export function employmentRecordCardModel(record: EmploymentRecord, input: { facilities: Facility[]; homeAssignments: EmploymentHomeAssignment[]; roleAssignments: EmploymentRoleAssignment[]; canViewPayroll: boolean }): EmploymentRecordCardModel {
  const homes = input.homeAssignments.filter((assignment) => assignment.employmentRecordId === record.id && assignment.status === "active");
  const roles = input.roleAssignments.filter((assignment) => assignment.employmentRecordId === record.id && assignment.status === "active");
  const primaryHomeId = record.primaryNursingHomeId || homes.find((assignment) => assignment.isPrimary)?.nursingHomeId || record.nursingHomeId;
  const primaryRoleKey = record.primaryRoleKey || roles.find((assignment) => assignment.isPrimary)?.roleKey;
  return {
    id: String(record.id),
    employeeNumber: record.employeeNumber || "Not Recorded",
    contractType: record.contractType ? EMPLOYMENT_CONTRACT_TYPE_LABELS[record.contractType] : record.employmentType.replaceAll("_", " "),
    status: EMPLOYMENT_STATUS_LABELS[normaliseEmploymentRecordStatus(record)],
    effectiveState: getEffectiveEmploymentStatus(record).replaceAll("_", " "),
    startDate: record.startDate,
    endDate: record.endDate,
    fte: record.fteValue,
    contractedHoursPerWeek: normaliseContractedHoursPerWeek(record),
    primaryHome: input.facilities.find((home) => home.id === String(primaryHomeId))?.name || "Primary Home Not Recorded",
    primaryRole: roleLabelForKey(primaryRoleKey),
    additionalHomes: homes.filter((assignment) => !assignment.isPrimary).map((assignment) => input.facilities.find((home) => home.id === String(assignment.nursingHomeId))?.name || String(assignment.nursingHomeId)),
    additionalRoles: roles.filter((assignment) => !assignment.isPrimary).map((assignment) => roleLabelForKey(assignment.roleKey)),
    payrollLinked: input.canViewPayroll && Boolean(record.payrollId),
  };
}
