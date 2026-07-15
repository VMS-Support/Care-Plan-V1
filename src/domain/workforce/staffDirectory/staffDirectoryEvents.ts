import type { Role, StaffDirectoryEvent, StaffMemberStatus } from "@/lib/care/types";

export function createStaffDirectoryEvent(input: {
  type: StaffDirectoryEvent["type"];
  staffMemberId: string;
  enterpriseId?: string;
  nursingHomeId?: string;
  actorUserAccountId: string;
  actorRole?: Role;
  changedFields?: string[];
  previousStatus?: StaffMemberStatus;
  newStatus?: StaffMemberStatus;
  occurredAt: string;
  correlationId?: string;
}): StaffDirectoryEvent {
  return {
    id: `staff-directory-event-${input.type}-${input.staffMemberId}-${input.occurredAt}`,
    type: input.type,
    staffMemberId: input.staffMemberId as StaffDirectoryEvent["staffMemberId"],
    enterpriseId: input.enterpriseId,
    nursingHomeId: input.nursingHomeId,
    actorUserAccountId: input.actorUserAccountId,
    actorRole: input.actorRole,
    changedFields: input.changedFields,
    previousStatus: input.previousStatus,
    newStatus: input.newStatus,
    occurredAt: input.occurredAt,
    correlationId: input.correlationId || `staff-directory:${input.type}:${input.staffMemberId}:${input.occurredAt}`,
  };
}
