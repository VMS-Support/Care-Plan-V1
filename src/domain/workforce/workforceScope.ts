import type { Facility, StaffMember, UserProfile } from "@/lib/care/types";
import type { NursingHomeId } from "@/types/entityIds";

export interface WorkforceScope {
  enterpriseId?: string;
  nursingHomeIds: string[];
}

export interface WorkforceAuthorizationContext {
  user: UserProfile;
  capabilities: string[];
  scope: WorkforceScope;
}

export function getAuthorisedWorkforceScope(input: {
  currentUser: UserProfile;
  activeFacilityId: string;
  facilities: Facility[];
}): WorkforceScope {
  const userHomeIds = input.currentUser.facilityIds?.length
    ? input.currentUser.facilityIds
    : [input.currentUser.facilityId || input.activeFacilityId];
  const nursingHomeIds =
    input.currentUser.role === "group_owner" ? input.facilities.map((facility) => facility.id) : userHomeIds;
  const enterpriseIds = new Set(
    input.facilities
      .filter((facility) => nursingHomeIds.includes(facility.id))
      .map((facility) => String(facility.enterpriseId || "")),
  );
  return {
    enterpriseId: enterpriseIds.size === 1 ? Array.from(enterpriseIds)[0] || undefined : undefined,
    nursingHomeIds,
  };
}

export function staffInWorkforceScope(staff: StaffMember, scope: WorkforceScope, homeAssignments: { staffMemberId: unknown; nursingHomeId: NursingHomeId | string; status: string }[]) {
  if (!scope.nursingHomeIds.length) return true;
  if (staff.primaryNursingHomeId && scope.nursingHomeIds.includes(String(staff.primaryNursingHomeId))) return true;
  return homeAssignments.some(
    (assignment) =>
      String(assignment.staffMemberId) === String(staff.id) &&
      assignment.status === "active" &&
      scope.nursingHomeIds.includes(String(assignment.nursingHomeId)),
  );
}
