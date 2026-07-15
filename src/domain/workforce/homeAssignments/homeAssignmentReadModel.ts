import type { EmploymentHomeAssignment, EmploymentRecord, Facility, StaffMember } from "@/lib/care/types";
import { getEffectiveHomeAssignmentState, STAFF_HOME_ASSIGNMENT_STATUS_LABELS, STAFF_HOME_ASSIGNMENT_TYPE_LABELS } from "./homeAssignmentService";

export function staffHomeAssignmentCardModel(assignment: EmploymentHomeAssignment, input: { facilities: Facility[]; employmentRecords: EmploymentRecord[]; canViewFte: boolean }) {
  const home = input.facilities.find((facility) => facility.id === assignment.nursingHomeId);
  const employment = input.employmentRecords.find((record) => record.id === assignment.employmentRecordId);
  return {
    id: assignment.id,
    homeName: home?.name || String(assignment.nursingHomeId),
    type: STAFF_HOME_ASSIGNMENT_TYPE_LABELS[assignment.assignmentType as keyof typeof STAFF_HOME_ASSIGNMENT_TYPE_LABELS] || String(assignment.assignmentType),
    status: STAFF_HOME_ASSIGNMENT_STATUS_LABELS[assignment.status],
    effectiveState: getEffectiveHomeAssignmentState(assignment, { employmentRecord: employment }).replaceAll("_", " "),
    effectiveFrom: assignment.effectiveFrom,
    effectiveTo: assignment.effectiveTo,
    isPrimary: assignment.isPrimary,
    roleSummary: assignment.roleKeys?.join(", ") || employment?.primaryRoleKey || "Role not scoped",
    fteAtHome: input.canViewFte ? assignment.fteAtHome : undefined,
    hoursAtHome: input.canViewFte ? assignment.contractedHoursPerWeekAtHome : undefined,
    agencyProviderId: assignment.agencyProviderId,
  };
}

export function getStaffByHomeAssignment(input: { staffMembers: StaffMember[]; employmentRecords: EmploymentRecord[]; assignments: EmploymentHomeAssignment[]; nursingHomeId: string }) {
  const staffIds = new Set(input.assignments.filter((assignment) => String(assignment.nursingHomeId) === input.nursingHomeId && getEffectiveHomeAssignmentState(assignment, { employmentRecord: input.employmentRecords.find((record) => record.id === assignment.employmentRecordId) }) === "current").map((assignment) => String(assignment.staffMemberId)));
  return input.staffMembers.filter((staff) => staffIds.has(String(staff.id)));
}
