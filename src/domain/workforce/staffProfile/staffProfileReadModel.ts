import type { EmploymentHomeAssignment, EmploymentRecord, EmploymentRoleAssignment, StaffMember, WorkforceEmploymentEvent } from "@/lib/care/types";
import type { WorkforceAuthorizationContext } from "../workforceScope";
import { employmentRecordCardModel } from "../employment/employmentReadModel";
import { getEffectiveEmploymentStatus, isCurrentEmployment } from "../employment/employmentStatus";
import { staffHomeAssignmentCardModel } from "../homeAssignments/homeAssignmentReadModel";
import { roleLabelForKey } from "../staffDirectory/staffRoleSummaryResolver";
import { getStaffProfile, type WorkforceDirectoryState } from "../staffDirectory/staffDirectoryService";

export interface StaffProfileAllowedActions {
  editProfile: boolean;
  addEmploymentRecord: boolean;
  addHomeAssignment: boolean;
  addRoleAssignment: boolean;
}

export function getStaffProfileWorkspace(state: WorkforceDirectoryState, staffMemberId: string, authorization: WorkforceAuthorizationContext) {
  const base = getStaffProfile(state, staffMemberId, authorization);
  if (!base) return undefined;
  const canViewPayroll = authorization.capabilities.includes("employment_record.view_payroll");
  const canViewHomeFte = authorization.capabilities.includes("home_assignments.view_fte");
  const canViewPersonal = authorization.capabilities.includes("staff_directory.view_personal_details");
  const staff = base.staff;
  const employmentRecords = state.employmentRecords
    .filter((record) => String(record.staffMemberId) === staffMemberId)
    .sort((a, b) => Number(isCurrentEmployment(b)) - Number(isCurrentEmployment(a)) || b.startDate.localeCompare(a.startDate));
  const activeRecordIds = new Set(employmentRecords.filter((record) => isCurrentEmployment(record)).map((record) => String(record.id)));
  const homeAssignments = state.employmentHomeAssignments.filter((assignment) => String(assignment.staffMemberId) === staffMemberId);
  const roleAssignments = state.employmentRoleAssignments.filter((assignment) => String(assignment.staffMemberId) === staffMemberId);
  const activeHomeAssignments = homeAssignments.filter((assignment) => activeRecordIds.has(String(assignment.employmentRecordId)) && assignment.status === "active");
  const activeRoleAssignments = roleAssignments.filter((assignment) => activeRecordIds.has(String(assignment.employmentRecordId)) && assignment.status === "active");
  const primaryEmployment = employmentRecords.find((record) => record.isPrimaryEmployment && isCurrentEmployment(record)) || employmentRecords.find((record) => isCurrentEmployment(record));

  return {
    header: {
      staffMemberId,
      displayName: base.row.displayName,
      initials: base.row.initials,
      photoUrl: base.row.photoUrl,
      staffNumber: base.row.staffNumber,
      primaryRole: base.row.primaryRole,
      primaryHome: base.row.primaryHome,
      status: base.row.status,
      statusLabel: base.row.statusLabel,
      linkedUserAccount: base.row.linkedUserAccount,
    },
    staff,
    overview: {
      employmentSummary: primaryEmployment ? employmentRecordCardModel(primaryEmployment, { facilities: state.facilities, homeAssignments: state.employmentHomeAssignments, roleAssignments: state.employmentRoleAssignments, canViewPayroll }) : undefined,
      activeHomeAssignments: activeHomeAssignments.map((assignment) => staffHomeAssignmentCardModel(assignment, { facilities: state.facilities, employmentRecords: state.employmentRecords, canViewFte: canViewHomeFte })),
      activeRoleAssignments: activeRoleAssignments.map(roleAssignmentSummary),
      dataQualityWarnings: getStaffProfileDataQualityWarnings(staff, employmentRecords, homeAssignments, roleAssignments),
    },
    personalDetails: canViewPersonal ? {
      firstName: staff.firstName,
      surname: staff.surname || staff.lastName,
      preferredName: staff.preferredName,
      dateOfBirth: staff.dateOfBirth,
      gender: staff.gender,
      nationality: staff.nationalityDisplayName || staff.nationalityCode,
      workEmail: staff.contactDetails?.workEmail || staff.email,
      personalEmail: staff.contactDetails?.personalEmail,
      workPhone: staff.contactDetails?.workPhone || staff.phone,
      personalPhone: staff.contactDetails?.personalPhone,
      address: staff.address,
    } : undefined,
    employmentRecords: employmentRecords.map((record) => employmentRecordCardModel(record, { facilities: state.facilities, homeAssignments: state.employmentHomeAssignments, roleAssignments: state.employmentRoleAssignments, canViewPayroll })),
    homeAssignments: homeAssignments.map((assignment) => staffHomeAssignmentCardModel(assignment, { facilities: state.facilities, employmentRecords: state.employmentRecords, canViewFte: canViewHomeFte })),
    roleAssignments: roleAssignments.map(roleAssignmentSummary),
    history: buildStaffHistory(staff, state.workforceEmploymentEvents || []),
    allowedActions: {
      editProfile: authorization.capabilities.includes("staff_directory.edit"),
      addEmploymentRecord: authorization.capabilities.includes("employment_record.create"),
      addHomeAssignment: authorization.capabilities.includes("home_assignments.create"),
      addRoleAssignment: authorization.capabilities.includes("employment_record.manage_assignments"),
    } satisfies StaffProfileAllowedActions,
  };
}

function roleAssignmentSummary(assignment: EmploymentRoleAssignment) {
  return {
    id: assignment.id,
    role: roleLabelForKey(assignment.roleKey),
    roleKey: assignment.roleKey,
    nursingHomeId: assignment.nursingHomeId ? String(assignment.nursingHomeId) : undefined,
    wardId: assignment.wardId ? String(assignment.wardId) : undefined,
    type: assignment.assignmentType.replaceAll("_", " "),
    status: assignment.status,
    isPrimary: assignment.isPrimary,
    effectiveFrom: assignment.effectiveFrom,
    effectiveTo: assignment.effectiveTo,
    fteForRole: assignment.fteForRole,
    contractedHoursPerWeekForRole: assignment.contractedHoursPerWeekForRole,
  };
}

function getStaffProfileDataQualityWarnings(staff: StaffMember, records: EmploymentRecord[], homes: EmploymentHomeAssignment[], roles: EmploymentRoleAssignment[]) {
  const warnings: string[] = [];
  const current = records.filter((record) => getEffectiveEmploymentStatus(record) !== "ended");
  if (!current.length) warnings.push("No current Employment Record");
  if (current.some((record) => !record.employeeNumber)) warnings.push("Employee Number missing");
  if (!staff.primaryNursingHomeId && !homes.some((assignment) => assignment.isPrimary && assignment.status === "active")) warnings.push("Primary Home missing");
  if (!current.some((record) => record.primaryRoleKey) && !roles.some((assignment) => assignment.isPrimary && assignment.status === "active")) warnings.push("Primary Role missing");
  if (current.some((record) => record.fteValue === undefined)) warnings.push("WTE/FTE not recorded");
  if (current.some((record) => record.contractedHoursPerWeek === undefined)) warnings.push("Contracted Hours not recorded");
  if (homes.filter((assignment) => assignment.isPrimary && assignment.status === "active").length > 1) warnings.push("Multiple active Primary Home assignments");
  if (roles.filter((assignment) => assignment.isPrimary && assignment.status === "active").length > 1) warnings.push("Multiple active Primary Role assignments");
  const endedRecordIds = new Set(records.filter((record) => getEffectiveEmploymentStatus(record) === "ended").map((record) => String(record.id)));
  if (homes.some((assignment) => endedRecordIds.has(String(assignment.employmentRecordId)) && assignment.status === "active")) warnings.push("Employment Record ended but assignment remains active");
  return warnings;
}

function buildStaffHistory(staff: StaffMember, events: WorkforceEmploymentEvent[]) {
  return events
    .filter((event) => String(event.staffMemberId) === String(staff.id))
    .slice(0, 20)
    .map((event) => ({
      id: event.id,
      title: event.type.replace(/([A-Z])/g, " $1").trim(),
      occurredAt: event.occurredAt,
      actor: event.actorUserAccountId ? String(event.actorUserAccountId) : "System",
      summary: event.changedFields?.length ? `Changed: ${event.changedFields.join(", ")}` : "Workforce record changed",
      sourceRecordId: String(event.employmentRecordId),
    }));
}
