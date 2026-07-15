import type { StaffMemberStatus } from "@/lib/care/types";

export const STAFF_MEMBER_STATUS_LABELS: Record<StaffMemberStatus, string> = {
  pre_employment: "Pre-Employment",
  active: "Active",
  on_leave: "On Leave",
  suspended: "Suspended",
  inactive: "Inactive",
  left_employment: "Left Employment",
  deceased: "Deceased",
};

export const STAFF_DIRECTORY_TOTAL_STATUSES: StaffMemberStatus[] = ["active", "on_leave", "suspended", "pre_employment"];
export const STAFF_DIRECTORY_ACTIVE_STATUSES: StaffMemberStatus[] = ["active", "on_leave"];

export function normaliseStaffStatus(status: StaffMemberStatus | undefined, active?: boolean): StaffMemberStatus {
  if (status) return status;
  return active ? "active" : "inactive";
}

export function staffStatusIsActive(status: StaffMemberStatus) {
  return STAFF_DIRECTORY_ACTIVE_STATUSES.includes(status);
}
