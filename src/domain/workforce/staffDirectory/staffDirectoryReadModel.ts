import type { EmploymentRecord, Facility, HomeAssignment, StaffMember, UserAccount, UserProfile } from "@/lib/care/types";
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
  employmentStatus?: string;
  employmentType?: string;
  department?: string;
  position?: string;
  serviceLength?: string;
  workEmail?: string;
  workPhone?: string;
  linkedUserAccount: boolean;
  userAccount?: {
    id: string;
    status: UserAccount["accountStatus"];
    label: string;
  };
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

export function userAccountLabel(status?: UserAccount["accountStatus"]) {
  if (status === "active") return "Active Login";
  if (status === "invited") return "Login Invited";
  if (status === "suspended") return "Login Suspended";
  if (status === "locked") return "Login Suspended";
  if (status === "disabled") return "Login Disabled";
  return "No User Account";
}

export function serviceLength(startDate?: string, endDate?: string) {
  if (!startDate || Number.isNaN(Date.parse(startDate))) return undefined;
  const start = new Date(`${startDate}T00:00:00`);
  const end = endDate && !Number.isNaN(Date.parse(endDate)) ? new Date(`${endDate}T00:00:00`) : new Date();
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += previousMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const parts = [
    years > 0 ? `${years} year${years === 1 ? "" : "s"}` : "",
    months > 0 ? `${months} month${months === 1 ? "" : "s"}` : "",
    years === 0 && months === 0 ? `${Math.max(0, days)} day${days === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  return parts.join(" ");
}

function currentEmploymentFor(staff: StaffMember, records: EmploymentRecord[]) {
  return records
    .filter((record) => String(record.staffMemberId) === String(staff.id))
    .sort((a, b) => {
      const aActive = a.employmentStatus === "active" || a.status === "active";
      const bActive = b.employmentStatus === "active" || b.status === "active";
      return Number(bActive) - Number(aActive) || (b.startDate || "").localeCompare(a.startDate || "");
    })[0];
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
  const employment = currentEmploymentFor(staff, state.employmentRecords as EmploymentRecord[]);
  const canViewContact = auth.capabilities.includes("staff_directory.view_contact_details") || auth.capabilities.includes("staff_directory.edit_contact_details");
  const account = state.userAccounts.find((item) => String(item.id) === String(staff.linkedUserAccountId || "") || String(item.staffMemberId || "") === String(staff.id));
  const linked = Boolean(account);

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
    employmentStatus: employment?.employmentStatus || employment?.status,
    employmentType: employment?.employmentType || employment?.contractType,
    department: employment?.department,
    position: role.primaryRoleLabel || employment?.jobTitle,
    serviceLength: serviceLength(employment?.startDate, employment?.endDate),
    workEmail: canViewContact ? staff.contactDetails?.workEmail || staff.email : undefined,
    workPhone: canViewContact ? staff.contactDetails?.workPhone || staff.phone : undefined,
    linkedUserAccount: linked,
    userAccount: account ? { id: String(account.id), status: account.accountStatus, label: userAccountLabel(account.accountStatus) } : undefined,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
    route: `/workforce/staff/${staff.id}`,
  };
}
