import { staffInWorkforceScope, type WorkforceAuthorizationContext } from "../workforceScope";
import { getStaffProfile, type WorkforceDirectoryState } from "../staffDirectory/staffDirectoryService";

export type StaffProfileRouteStatus = "ready" | "malformed" | "forbidden" | "not_found";

export function getStaffProfileHref(staffMemberId: string) {
  return `/workforce/staff/${encodeURIComponent(staffMemberId)}`;
}

export function isValidStaffProfileRouteParam(staffMemberId: string) {
  const value = staffMemberId.trim();
  return Boolean(value) && !["undefined", "null", "[object Object]"].includes(value);
}

export function resolveStaffProfileRoute(
  state: WorkforceDirectoryState,
  staffMemberId: string,
  authorization: WorkforceAuthorizationContext,
) {
  if (!isValidStaffProfileRouteParam(staffMemberId)) {
    return { status: "malformed" as const };
  }
  if (!authorization.capabilities.includes("staff_directory.view") && !authorization.capabilities.includes("workforce.view")) {
    return { status: "forbidden" as const };
  }
  const staff = state.staffMembers.find((item) => String(item.id) === staffMemberId);
  if (!staff) return { status: "not_found" as const };
  if (!staffInWorkforceScope(staff, authorization.scope, state.homeAssignments)) {
    return { status: "forbidden" as const };
  }
  const profile = getStaffProfile(state, staffMemberId, authorization);
  return profile ? { status: "ready" as const, profile } : { status: "not_found" as const };
}
