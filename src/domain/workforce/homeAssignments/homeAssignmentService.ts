import type { EffectiveHomeAssignmentState, EmploymentHomeAssignment, EmploymentRecord, Facility, StaffMember } from "@/lib/care/types";
import type { EmploymentRecordId, NursingHomeId, StaffMemberId, UserAccountId } from "@/types/entityIds";
import { isCurrentEmployment } from "../employment/employmentStatus";

export const STAFF_HOME_ASSIGNMENT_TYPE_LABELS = {
  primary: "Primary Home",
  secondary: "Secondary Home",
  temporary: "Temporary Assignment",
  temporary_cover: "Temporary Assignment",
  agency_cover: "Agency Cover",
  floating: "Floating Assignment",
  secondment: "Secondment",
  other: "Other",
} as const;

export const STAFF_HOME_ASSIGNMENT_STATUS_LABELS = {
  planned: "Planned",
  active: "Active",
  suspended: "Suspended",
  ended: "Ended",
  cancelled: "Cancelled",
  entered_in_error: "Entered in Error",
} as const;

export interface CreateStaffHomeAssignmentCommand {
  staffMemberId: string;
  employmentRecordId?: string;
  nursingHomeId: string;
  assignmentType: EmploymentHomeAssignment["assignmentType"];
  effectiveFrom: string;
  effectiveTo?: string;
  isPrimary: boolean;
  roleKeys?: string[];
  fteAtHome?: number;
  contractedHoursPerWeekAtHome?: number;
  agencyProviderId?: string;
  reason?: string;
  notes?: string;
  clientRequestId: string;
}

export interface HomeAssignmentState {
  staffMembers: StaffMember[];
  employmentRecords: EmploymentRecord[];
  facilities: Facility[];
  employmentHomeAssignments: EmploymentHomeAssignment[];
}

export function getEffectiveHomeAssignmentState(assignment: EmploymentHomeAssignment, input?: { employmentRecord?: EmploymentRecord; effectiveAt?: string }): EffectiveHomeAssignmentState {
  const effectiveAt = input?.effectiveAt || new Date().toISOString().slice(0, 10);
  if (assignment.status === "entered_in_error" || assignment.status === "cancelled") return "invalid";
  if (assignment.status === "suspended") return "temporarily_suspended";
  if (assignment.status === "ended" || (assignment.effectiveTo && assignment.effectiveTo < effectiveAt)) return "ended";
  if (assignment.effectiveFrom > effectiveAt) return "future";
  if (input?.employmentRecord && !isCurrentEmployment(input.employmentRecord, effectiveAt)) return "ended";
  return assignment.status === "active" ? "current" : "future";
}

export function getCurrentStaffHomeAssignments(state: Pick<HomeAssignmentState, "employmentHomeAssignments" | "employmentRecords">, staffMemberId: string, effectiveAt = new Date().toISOString().slice(0, 10)) {
  return state.employmentHomeAssignments.filter((assignment) => {
    const employment = state.employmentRecords.find((record) => record.id === assignment.employmentRecordId);
    return String(assignment.staffMemberId) === staffMemberId && getEffectiveHomeAssignmentState(assignment, { employmentRecord: employment, effectiveAt }) === "current";
  });
}

export function getCurrentPrimaryHomeAssignment(state: Pick<HomeAssignmentState, "employmentHomeAssignments" | "employmentRecords">, staffMemberId: string, employmentRecordId?: string, effectiveAt = new Date().toISOString().slice(0, 10)) {
  return getCurrentStaffHomeAssignments(state, staffMemberId, effectiveAt)
    .filter((assignment) => assignment.isPrimary && (!employmentRecordId || String(assignment.employmentRecordId) === employmentRecordId))
    .sort((a, b) => String(b.effectiveFrom).localeCompare(String(a.effectiveFrom)))[0];
}

export function createStaffHomeAssignment(state: HomeAssignmentState, command: CreateStaffHomeAssignmentCommand, actorUserAccountId: string) {
  const staff = state.staffMembers.find((item) => String(item.id) === command.staffMemberId);
  if (!staff) throw new Error("The Home Assignment could not be saved.");
  const home = state.facilities.find((item) => item.id === command.nursingHomeId);
  if (!home) throw new Error("The Home Assignment could not be saved.");
  const employment = command.employmentRecordId
    ? state.employmentRecords.find((record) => String(record.id) === command.employmentRecordId && String(record.staffMemberId) === command.staffMemberId)
    : state.employmentRecords.find((record) => String(record.staffMemberId) === command.staffMemberId && isCurrentEmployment(record));
  if (!employment) throw new Error("The Home Assignment could not be saved.");
  if (command.effectiveTo && command.effectiveTo < command.effectiveFrom) throw new Error("The Home Assignment could not be saved.");
  if ((command.fteAtHome ?? 0) < 0 || (command.contractedHoursPerWeekAtHome ?? 0) < 0) throw new Error("The Home Assignment could not be saved.");
  if (command.assignmentType === "other" && !command.reason?.trim()) throw new Error("The Home Assignment could not be saved.");
  if (command.isPrimary && getCurrentPrimaryHomeAssignment(state, command.staffMemberId, String(employment.id), command.effectiveFrom)) {
    throw new Error("This Staff Member already has a Primary Home assignment for this scope.");
  }
  const now = new Date().toISOString();
  return {
    id: `employment-home-assignment-${command.clientRequestId || Date.now()}`,
    employmentRecordId: employment.id as EmploymentRecordId,
    staffMemberId: command.staffMemberId as StaffMemberId,
    enterpriseId: employment.enterpriseId || home.enterpriseId,
    nursingHomeId: command.nursingHomeId as NursingHomeId,
    assignmentType: command.assignmentType,
    status: command.effectiveFrom > now.slice(0, 10) ? "planned" : "active",
    effectiveFrom: command.effectiveFrom,
    effectiveTo: command.effectiveTo,
    isPrimary: command.isPrimary,
    roleKeys: command.roleKeys,
    employmentCategory: employment.employmentCategory,
    fteAtHome: command.fteAtHome,
    contractedHoursPerWeekAtHome: command.contractedHoursPerWeekAtHome,
    agencyProviderId: command.agencyProviderId,
    reason: command.reason,
    notes: command.notes,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as UserAccountId,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  } satisfies EmploymentHomeAssignment;
}

export function endStaffHomeAssignment(assignment: EmploymentHomeAssignment, actorUserAccountId: string, endDate = new Date().toISOString().slice(0, 10)) {
  return { ...assignment, status: "ended" as const, effectiveTo: endDate, updatedAt: new Date().toISOString(), updatedByUserAccountId: actorUserAccountId as UserAccountId };
}
