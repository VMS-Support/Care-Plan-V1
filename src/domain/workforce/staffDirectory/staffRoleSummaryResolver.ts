import type { EmploymentRecord, RoleAssignment, StaffMember, UserAccount, UserProfile } from "@/lib/care/types";

export interface StaffRoleSummary {
  primaryRoleKey?: string;
  primaryRoleLabel?: string;
  additionalRoleLabels: string[];
  source: "employment_record" | "clinical_role_assignment" | "user_role" | "legacy" | "not_recorded";
}

export const WORKFORCE_ROLE_DISPLAY_GROUPS = [
  { key: "registered-nurse", label: "Registered Nurses", includedRoleKeys: ["NURSE"], displayOrder: 1 },
  { key: "cnm", label: "CNM", includedRoleKeys: ["CNM"], displayOrder: 2 },
  { key: "healthcare-assistant", label: "Healthcare Assistants", includedRoleKeys: ["HCA", "CARER"], displayOrder: 3 },
  { key: "doctor", label: "Doctors", includedRoleKeys: ["DOCTOR"], displayOrder: 4 },
  { key: "housekeeping", label: "Housekeeping", includedRoleKeys: ["HOUSEKEEPING"], displayOrder: 5 },
  { key: "kitchen", label: "Kitchen", includedRoleKeys: ["KITCHEN"], displayOrder: 6 },
  { key: "maintenance", label: "Maintenance", includedRoleKeys: ["MAINTENANCE"], displayOrder: 7 },
  { key: "administration", label: "Administration", includedRoleKeys: ["ADMINISTRATION", "DON", "GROUP_OWNER"], displayOrder: 8 },
] as const;

const ROLE_LABELS: Record<string, string> = {
  DON: "Director of Nursing",
  GROUP_OWNER: "Group Owner",
  CNM: "CNM",
  NURSE: "Registered Nurse",
  HCA: "Healthcare Assistant",
  CARER: "Healthcare Assistant",
  DOCTOR: "Doctor",
  HOUSEKEEPING: "Housekeeping",
  KITCHEN: "Kitchen",
  MAINTENANCE: "Maintenance",
  ADMINISTRATION: "Administration",
};

export function roleLabelForKey(key?: string) {
  if (!key) return "Role Not Recorded";
  return ROLE_LABELS[key] || key.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function keyFromEmployment(record?: EmploymentRecord) {
  if (!record) return undefined;
  const text = `${record.department || ""} ${record.jobTitle || ""}`.toLowerCase();
  if (text.includes("nurse")) return "NURSE";
  if (text.includes("cnm")) return "CNM";
  if (text.includes("doctor") || text.includes("medical")) return "DOCTOR";
  if (text.includes("care") || text.includes("hca")) return "HCA";
  if (text.includes("housekeeping")) return "HOUSEKEEPING";
  if (text.includes("kitchen")) return "KITCHEN";
  if (text.includes("maintenance")) return "MAINTENANCE";
  if (text.includes("executive") || text.includes("management") || text.includes("admin")) return "ADMINISTRATION";
  return undefined;
}

function keyFromUserRole(role?: UserProfile["role"]) {
  if (role === "don") return "DON";
  if (role === "group_owner") return "GROUP_OWNER";
  if (role === "cnm") return "CNM";
  if (role === "nurse") return "NURSE";
  if (role === "doctor") return "DOCTOR";
  if (role === "carer") return "HCA";
  return undefined;
}

export function resolveStaffRoleSummary(input: {
  staff: StaffMember;
  employmentRecords: EmploymentRecord[];
  roleAssignments: RoleAssignment[];
  userAccounts: UserAccount[];
  users: UserProfile[];
}): StaffRoleSummary {
  const employment = input.employmentRecords.find(
    (record) => record.staffMemberId === input.staff.id && record.employmentStatus === "active",
  );
  const employmentKey = keyFromEmployment(employment);
  if (employmentKey) {
    return { primaryRoleKey: employmentKey, primaryRoleLabel: roleLabelForKey(employmentKey), additionalRoleLabels: [], source: "employment_record" };
  }

  const assignment = input.roleAssignments.find(
    (record) => record.staffMemberId === input.staff.id && record.status === "active" && record.isPrimary,
  ) || input.roleAssignments.find((record) => record.staffMemberId === input.staff.id && record.status === "active");
  if (assignment?.roleKey) {
    return { primaryRoleKey: assignment.roleKey, primaryRoleLabel: roleLabelForKey(assignment.roleKey), additionalRoleLabels: [], source: "clinical_role_assignment" };
  }

  const account = input.userAccounts.find((record) => record.staffMemberId === input.staff.id);
  const user = input.users.find((record) => `user-account-${record.id}` === account?.id || record.id === account?.id);
  const userRoleKey = keyFromUserRole(user?.role);
  if (userRoleKey) {
    return { primaryRoleKey: userRoleKey, primaryRoleLabel: roleLabelForKey(userRoleKey), additionalRoleLabels: [], source: "user_role" };
  }

  return { primaryRoleLabel: "Role Not Recorded", additionalRoleLabels: [], source: "not_recorded" };
}

export function displayGroupForRoleKey(roleKey?: string) {
  return WORKFORCE_ROLE_DISPLAY_GROUPS.find((group) => roleKey && group.includedRoleKeys.includes(roleKey as never));
}
