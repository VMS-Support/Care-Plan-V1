import type { EmploymentContractType, EmploymentHomeAssignment, EmploymentRecord, EmploymentRecordStatus, EmploymentRoleAssignment, Facility } from "@/lib/care/types";
import { createEmploymentRecordId, type EmploymentRecordId, type StaffMemberId, type UserAccountId } from "@/types/entityIds";
import { getEffectiveEmploymentStatus, isCurrentEmployment } from "./employmentStatus";

export interface CreateEmploymentRecordCommand {
  staffMemberId: string;
  employeeNumber: string;
  contractType: EmploymentContractType;
  status: EmploymentRecordStatus;
  startDate: string;
  endDate?: string;
  probationEndDate?: string;
  fteValue?: number;
  contractedHoursPerWeek?: number;
  salaryGradeId?: string;
  salaryGradeLabel?: string;
  payrollId?: string;
  primaryNursingHomeId?: string;
  primaryRoleKey?: string;
  employmentCategory?: EmploymentRecord["employmentCategory"];
  isPrimaryEmployment?: boolean;
  notes?: string;
}

export interface EmploymentState {
  facilities: Facility[];
  employmentRecords: EmploymentRecord[];
  employmentHomeAssignments: EmploymentHomeAssignment[];
  employmentRoleAssignments: EmploymentRoleAssignment[];
}

export function validateEmploymentRecordCommand(state: EmploymentState, command: CreateEmploymentRecordCommand, existingId?: string) {
  const errors: string[] = [];
  if (!command.staffMemberId) errors.push("Staff Member is required.");
  if (!command.employeeNumber.trim()) errors.push("Employee Number is required.");
  if (!command.startDate) errors.push("Start date is required.");
  if (command.endDate && command.endDate < command.startDate) errors.push("End date cannot be before start date.");
  if (command.fteValue !== undefined && command.fteValue < 0) errors.push("FTE must be non-negative.");
  if (command.contractedHoursPerWeek !== undefined && command.contractedHoursPerWeek < 0) errors.push("Contracted hours must be non-negative.");
  if (command.primaryNursingHomeId && !state.facilities.some((home) => home.id === command.primaryNursingHomeId)) errors.push("Primary Home is not available.");
  const enterpriseId = command.primaryNursingHomeId ? state.facilities.find((home) => home.id === command.primaryNursingHomeId)?.enterpriseId : undefined;
  if (state.employmentRecords.some((record) => String(record.id) !== existingId && (record.employeeNumber || "").toLowerCase() === command.employeeNumber.trim().toLowerCase() && (!enterpriseId || !record.enterpriseId || record.enterpriseId === enterpriseId))) {
    errors.push("This Employee Number is already in use.");
  }
  if (command.isPrimaryEmployment && state.employmentRecords.some((record) => String(record.id) !== existingId && String(record.staffMemberId) === command.staffMemberId && record.isPrimaryEmployment && isCurrentEmployment(record))) {
    errors.push("This Staff Member already has a primary Employment Record for this scope.");
  }
  return errors;
}

export function createEmploymentRecord(state: EmploymentState, command: CreateEmploymentRecordCommand, actorUserAccountId: string) {
  const errors = validateEmploymentRecordCommand(state, command);
  if (errors.length) throw new Error(errors[0]);
  const now = new Date().toISOString();
  const primaryHome = state.facilities.find((home) => home.id === command.primaryNursingHomeId);
  const record: EmploymentRecord = {
    id: createEmploymentRecordId(),
    staffMemberId: command.staffMemberId as StaffMemberId,
    nursingHomeId: (command.primaryNursingHomeId || primaryHome?.id || state.facilities[0]?.id || "") as EmploymentRecord["nursingHomeId"],
    enterpriseId: primaryHome?.enterpriseId,
    employeeNumber: command.employeeNumber.trim(),
    contractType: command.contractType,
    status: command.status,
    employmentType: command.contractType.includes("agency") ? "agency" : command.contractType.includes("temporary") ? "temporary" : "permanent",
    employmentStatus: command.status === "pre_employment" ? "planned" : command.status === "ended" ? "ended" : command.status === "suspended" ? "suspended" : command.status === "on_leave" ? "on_leave" : "active",
    jobTitle: command.primaryRoleKey || "Role Not Recorded",
    startDate: command.startDate,
    endDate: command.endDate,
    probationEndDate: command.probationEndDate,
    fteValue: command.fteValue,
    contractedHoursPerWeek: command.contractedHoursPerWeek,
    salaryGradeId: command.salaryGradeId,
    salaryGradeLabel: command.salaryGradeLabel,
    payrollId: command.payrollId,
    primaryNursingHomeId: command.primaryNursingHomeId as EmploymentRecord["primaryNursingHomeId"],
    primaryRoleKey: command.primaryRoleKey,
    employmentCategory: command.employmentCategory,
    notes: command.notes,
    isPrimaryEmployment: Boolean(command.isPrimaryEmployment),
    createdAt: now,
    updatedAt: now,
    createdBy: actorUserAccountId as UserAccountId,
    updatedBy: actorUserAccountId as UserAccountId,
    createdByUserAccountId: actorUserAccountId as UserAccountId,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  };
  return record;
}

export function updateEmploymentRecord(state: EmploymentState, current: EmploymentRecord, patch: Partial<CreateEmploymentRecordCommand>, actorUserAccountId: string) {
  const command: CreateEmploymentRecordCommand = {
    staffMemberId: String(current.staffMemberId),
    employeeNumber: patch.employeeNumber ?? current.employeeNumber ?? "",
    contractType: patch.contractType ?? current.contractType ?? "permanent_full_time",
    status: patch.status ?? current.status ?? "active",
    startDate: patch.startDate ?? current.startDate,
    endDate: patch.endDate ?? current.endDate,
    probationEndDate: patch.probationEndDate ?? current.probationEndDate,
    fteValue: patch.fteValue ?? current.fteValue,
    contractedHoursPerWeek: patch.contractedHoursPerWeek ?? current.contractedHoursPerWeek,
    salaryGradeId: patch.salaryGradeId ?? current.salaryGradeId,
    salaryGradeLabel: patch.salaryGradeLabel ?? current.salaryGradeLabel,
    payrollId: patch.payrollId ?? current.payrollId,
    primaryNursingHomeId: patch.primaryNursingHomeId ?? (current.primaryNursingHomeId ? String(current.primaryNursingHomeId) : undefined),
    primaryRoleKey: patch.primaryRoleKey ?? current.primaryRoleKey,
    employmentCategory: patch.employmentCategory ?? current.employmentCategory,
    isPrimaryEmployment: patch.isPrimaryEmployment ?? current.isPrimaryEmployment,
    notes: patch.notes ?? current.notes,
  };
  const errors = validateEmploymentRecordCommand(state, command, String(current.id));
  if (errors.length) throw new Error(errors[0]);
  const primaryHome = state.facilities.find((home) => home.id === command.primaryNursingHomeId);
  return {
    ...current,
    ...command,
    enterpriseId: primaryHome?.enterpriseId || current.enterpriseId,
    nursingHomeId: (command.primaryNursingHomeId || current.nursingHomeId) as EmploymentRecord["nursingHomeId"],
    primaryNursingHomeId: command.primaryNursingHomeId as EmploymentRecord["primaryNursingHomeId"],
    employmentStatus: command.status === "pre_employment" ? "planned" : command.status === "ended" ? "ended" : command.status === "suspended" ? "suspended" : command.status === "on_leave" ? "on_leave" : "active",
    updatedAt: new Date().toISOString(),
    updatedBy: actorUserAccountId as UserAccountId,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  } satisfies EmploymentRecord;
}

export function getEffectiveStaffAssignments(state: EmploymentState, staffMemberId: string, effectiveAt = new Date().toISOString().slice(0, 10)) {
  const activeEmploymentRecords = state.employmentRecords.filter((record) => String(record.staffMemberId) === staffMemberId && getEffectiveEmploymentStatus(record, effectiveAt) !== "ended" && getEffectiveEmploymentStatus(record, effectiveAt) !== "invalid");
  const recordIds = new Set(activeEmploymentRecords.map((record) => String(record.id)));
  const homeAssignments = state.employmentHomeAssignments.filter((assignment) => recordIds.has(String(assignment.employmentRecordId)) && assignment.status === "active");
  const roleAssignments = state.employmentRoleAssignments.filter((assignment) => recordIds.has(String(assignment.employmentRecordId)) && assignment.status === "active");
  return {
    activeEmploymentRecords,
    homeAssignments,
    roleAssignments,
    primaryHome: homeAssignments.find((assignment) => assignment.isPrimary),
    primaryRole: roleAssignments.find((assignment) => assignment.isPrimary),
    temporaryActingRoles: roleAssignments.filter((assignment) => ["acting", "temporary_cover"].includes(assignment.assignmentType)),
  };
}
