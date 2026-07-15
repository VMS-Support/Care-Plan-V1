import type { StaffLeaveRecord } from "@/lib/care/types";

export interface CreateStaffLeaveRecordCommand {
  staffMemberId: string;
  employmentRecordId?: string;
  nursingHomeId: string;
  wardId?: string;
  leaveType: StaffLeaveRecord["leaveType"];
  status?: StaffLeaveRecord["status"];
  startAt: string;
  endAt: string;
  partialDay?: StaffLeaveRecord["partialDay"];
  expectedReturnDate?: string;
  rosterImpact?: StaffLeaveRecord["rosterImpact"];
  confidentialReason?: string;
  notes?: string;
}

const uuid = () => Math.random().toString(36).slice(2, 10);

export function hasLeaveOverlap(records: StaffLeaveRecord[], input: Pick<StaffLeaveRecord, "staffMemberId" | "startAt" | "endAt">, ignoreId?: string) {
  return records.some((record) =>
    record.id !== ignoreId &&
    record.staffMemberId === input.staffMemberId &&
    record.status !== "cancelled" &&
    record.status !== "rejected" &&
    record.status !== "entered_in_error" &&
    record.startAt < input.endAt &&
    record.endAt > input.startAt
  );
}

export function createStaffLeaveRecord(input: CreateStaffLeaveRecordCommand, actorUserAccountId: string, existingRecords: StaffLeaveRecord[] = []): StaffLeaveRecord {
  if (input.endAt < input.startAt) throw new Error("The Leave record could not be saved.");
  if (hasLeaveOverlap(existingRecords, { staffMemberId: input.staffMemberId as any, startAt: input.startAt, endAt: input.endAt })) throw new Error("This Leave overlaps an existing Leave record.");
  const now = new Date().toISOString();
  return {
    id: `staff-leave-${uuid()}`,
    staffMemberId: input.staffMemberId as any,
    employmentRecordId: input.employmentRecordId as any,
    nursingHomeId: input.nursingHomeId as any,
    wardId: input.wardId as any,
    leaveType: input.leaveType,
    status: input.status || "requested",
    startAt: input.startAt,
    endAt: input.endAt,
    startDate: input.startAt.slice(0, 10),
    endDate: input.endAt.slice(0, 10),
    partialDay: input.partialDay || "none",
    expectedReturnDate: input.expectedReturnDate,
    rosterImpact: input.rosterImpact,
    confidentialReason: input.confidentialReason,
    notes: input.notes,
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as any,
    updatedByUserAccountId: actorUserAccountId as any,
  };
}

export function approveStaffLeaveRecord(record: StaffLeaveRecord, actorUserAccountId: string): StaffLeaveRecord {
  const now = new Date().toISOString();
  return { ...record, status: "approved", approvedAt: now, approvedByUserAccountId: actorUserAccountId as any, updatedAt: now, updatedByUserAccountId: actorUserAccountId as any };
}

export function cancelStaffLeaveRecord(record: StaffLeaveRecord, actorUserAccountId: string): StaffLeaveRecord {
  const now = new Date().toISOString();
  return { ...record, status: "cancelled", cancelledAt: now, cancelledByUserAccountId: actorUserAccountId as any, updatedAt: now, updatedByUserAccountId: actorUserAccountId as any };
}
