import type { EmploymentHomeAssignment, EmploymentRecord, EmploymentRoleAssignment, Facility, StaffMember } from "@/lib/care/types";
import type { WorkforceAuthorizationContext } from "../workforceScope";
import { employmentRecordCardModel } from "./employmentReadModel";
import { isCurrentEmployment } from "./employmentStatus";
import { getStaffMemberDisplayName } from "../staffDirectory/staffDirectoryReadModel";

export interface EmploymentWorkspaceFilters {
  search?: string;
  nursingHomeId?: string;
  status?: string;
  currentState?: "current" | "future" | "ended";
  primaryRoleKey?: string;
  missingWte?: boolean;
  missingHours?: boolean;
}

export function getEmploymentRecordsWorkspace(input: {
  facilities: Facility[];
  staffMembers: StaffMember[];
  employmentRecords: EmploymentRecord[];
  employmentHomeAssignments: EmploymentHomeAssignment[];
  employmentRoleAssignments: EmploymentRoleAssignment[];
  filters: EmploymentWorkspaceFilters;
  authorization: WorkforceAuthorizationContext;
}) {
  if (!input.authorization.capabilities.includes("employment_record.view") && !input.authorization.capabilities.includes("workforce.view")) {
    return { rows: [], total: 0, availability: "permission_restricted" as const };
  }
  const canViewPayroll = input.authorization.capabilities.includes("employment_record.view_payroll");
  const canViewWte = input.authorization.capabilities.includes("employment_record.view_metrics") || input.authorization.capabilities.includes("staffing_wte.view_actual");
  const rows = input.employmentRecords
    .filter((record) => !input.filters.nursingHomeId || String(record.primaryNursingHomeId || record.nursingHomeId) === input.filters.nursingHomeId)
    .filter((record) => !input.filters.status || record.status === input.filters.status)
    .filter((record) => !input.filters.primaryRoleKey || record.primaryRoleKey === input.filters.primaryRoleKey)
    .filter((record) => !input.filters.missingWte || record.fteValue === undefined)
    .filter((record) => !input.filters.missingHours || record.contractedHoursPerWeek === undefined)
    .filter((record) => {
      const state = isCurrentEmployment(record) ? "current" : record.startDate > new Date().toISOString().slice(0, 10) ? "future" : "ended";
      return !input.filters.currentState || state === input.filters.currentState;
    })
    .map((record) => {
      const staff = input.staffMembers.find((item) => String(item.id) === String(record.staffMemberId));
      return {
        staffMemberName: staff ? getStaffMemberDisplayName(staff) : "Staff Member Not Found",
        staffMemberId: String(record.staffMemberId),
        ...employmentRecordCardModel(record, {
          facilities: input.facilities,
          homeAssignments: input.employmentHomeAssignments,
          roleAssignments: input.employmentRoleAssignments,
          canViewPayroll,
        }),
        fte: canViewWte ? record.fteValue : undefined,
        contractedHoursPerWeek: canViewWte ? record.contractedHoursPerWeek : undefined,
        salaryGrade: input.authorization.capabilities.includes("employment_record.view_salary") ? record.salaryGradeLabel : undefined,
      };
    })
    .filter((row) => {
      const q = input.filters.search?.trim().toLowerCase();
      if (!q) return true;
      return [row.staffMemberName, row.employeeNumber, row.primaryRole, row.primaryHome].some((value) => value.toLowerCase().includes(q));
    });
  return { rows, total: rows.length, availability: "available" as const };
}
