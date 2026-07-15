import type { Facility, HomeAssignment, StaffMember, UserAccount, UserProfile } from "@/lib/care/types";
import { STAFF_MEMBER_STATUS_LABELS, normaliseStaffStatus, staffStatusIsActive } from "./staffMemberStatus";
import { resolveStaffRoleSummary, type StaffRoleSummary } from "./staffRoleSummaryResolver";
import type { WorkforceAuthorizationContext } from "../workforceScope";

export interface StaffDirectoryRow {
  staffMemberId: string;
  staffNumber: string;
  displayName: string;
  preferredName?: string;
  initials: string;
  photoUrl?: string;
  primaryRole?: { key?: string; label: string; source: StaffRoleSummary["source"] };
  primaryHome?: { nursingHomeId: string; name: string };
  status: ReturnType<typeof normaliseStaffStatus>;
  statusLabel: string;
  active: boolean;
  workEmail?: string;
  workPhone?: string;
  linkedUserAccount: boolean;
  createdAt: string;
  updatedAt: string;
  route: string;
}

export interface StaffDirectoryReadModelState {
  facilities: Facility[];
  staffMembers: StaffMember[];
  employmentRecords: Parameters<typeof resolveStaffRoleSummary>[0]["employmentRecords"];
  roleAssignments: Parameters<typeof resolveStaffRoleSummary>[0]["roleAssignments"];
  userAccounts: UserAccount[];
  users: UserProfile[];
  homeAssignments: HomeAssignment[];
}

export function getStaffMemberDisplayName(staff: Pick<StaffMember, "firstName" | "lastName" | "surname" | "preferredName" | "displayName">) {
  const surname = staff.surname || staff.lastName;
  return staff.preferredName ? `${staff.preferredName} ${surname}`.trim() : (staff.displayName || `${staff.firstName} ${surname}`.trim());
}

export function getStaffInitials(staff: Pick<StaffMember, "firstName" | "lastName" | "surname" | "preferredName" | "displayName">) {
  const display = getStaffMemberDisplayName(staff);
  return display
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SM";
}

export function staffDirectoryRowFor(
  staff: StaffMember,
  state: StaffDirectoryReadModelState,
  auth: WorkforceAuthorizationContext,
): StaffDirectoryRow {
  const status = normaliseStaffStatus(staff.status, staff.active);
  const primaryHomeId = staff.primaryNursingHomeId || state.homeAssignments.find((assignment) => assignment.staffMemberId === staff.id && assignment.assignmentType === "primary")?.nursingHomeId;
  const home = state.facilities.find((facility) => primaryHomeId && facility.id === String(primaryHomeId));
  const role = resolveStaffRoleSummary({ staff, employmentRecords: state.employmentRecords, roleAssignments: state.roleAssignments, userAccounts: state.userAccounts, users: state.users });
  const canViewContact = auth.capabilities.includes("staff_directory.view_contact_details") || auth.capabilities.includes("staff_directory.edit_contact_details");
  const linked = Boolean(staff.linkedUserAccountId || state.userAccounts.some((account) => account.staffMemberId === staff.id));

  return {
    staffMemberId: String(staff.id),
    staffNumber: staff.staffNumber || "Not Recorded",
    displayName: getStaffMemberDisplayName(staff),
    preferredName: staff.preferredName,
    initials: getStaffInitials(staff),
    photoUrl: staff.photoUrl,
    primaryRole: { key: role.primaryRoleKey, label: role.primaryRoleLabel || "Role Not Recorded", source: role.source },
    primaryHome: home ? { nursingHomeId: home.id, name: home.name } : undefined,
    status,
    statusLabel: STAFF_MEMBER_STATUS_LABELS[status],
    active: staffStatusIsActive(status),
    workEmail: canViewContact ? staff.contactDetails?.workEmail || staff.email : undefined,
    workPhone: canViewContact ? staff.contactDetails?.workPhone || staff.phone : undefined,
    linkedUserAccount: linked,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
    route: `/workforce/staff/${staff.id}`,
  };
}
