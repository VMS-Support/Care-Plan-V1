import type { PlannedShift, RosterPeriod, RosterShiftRequirement, StaffLeaveRecord } from "@/lib/care/types";

export interface CreateRosterPeriodCommand {
  nursingHomeId: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  status?: RosterPeriod["status"];
  notes?: string;
}

export interface AddRosterShiftRequirementCommand {
  rosterPeriodId: string;
  nursingHomeId: string;
  wardId?: string;
  shiftDefinitionId?: string;
  shiftDate: string;
  startAt: string;
  endAt: string;
  roleKey: string;
  requiredCount: number;
  competencyRequirementIds?: string[];
  notes?: string;
}

export interface AssignPlannedShiftCommand {
  rosterPeriodId: string;
  requirementId?: string;
  nursingHomeId: string;
  wardId?: string;
  assignedStaffMemberId?: string;
  employmentRecordId?: string;
  roleKey: string;
  startAt: string;
  endAt: string;
  status?: PlannedShift["status"];
  confirmationRequired?: boolean;
  notes?: string;
}

const uuid = () => Math.random().toString(36).slice(2, 10);

export function createRosterPeriod(input: CreateRosterPeriodCommand, actorUserAccountId: string, versionNumber = 1): RosterPeriod {
  if (input.dateTo < input.dateFrom) throw new Error("The Roster could not be loaded.");
  const now = new Date().toISOString();
  return {
    id: `roster-period-${uuid()}`,
    nursingHomeId: input.nursingHomeId as any,
    name: input.name,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
    status: input.status || "draft",
    versionNumber,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as any,
    updatedByUserAccountId: actorUserAccountId as any,
  };
}

export function addRosterShiftRequirement(input: AddRosterShiftRequirementCommand): RosterShiftRequirement {
  if (input.requiredCount <= 0) throw new Error("Required shift count must be greater than zero.");
  if (input.endAt <= input.startAt) throw new Error("Shift end is after shift start.");
  const now = new Date().toISOString();
  return {
    id: `roster-requirement-${uuid()}`,
    rosterPeriodId: input.rosterPeriodId as any,
    nursingHomeId: input.nursingHomeId as any,
    wardId: input.wardId as any,
    shiftDefinitionId: input.shiftDefinitionId as any,
    shiftDate: input.shiftDate,
    startAt: input.startAt,
    endAt: input.endAt,
    roleKey: input.roleKey,
    requiredCount: input.requiredCount,
    status: "required",
    competencyRequirementIds: input.competencyRequirementIds as any,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
}

export function assignPlannedShift(input: AssignPlannedShiftCommand, actorUserAccountId: string, leaveRecords: StaffLeaveRecord[] = []): PlannedShift {
  if (input.endAt <= input.startAt) throw new Error("This shift overlaps another assignment.");
  const leaveConflict = Boolean(input.assignedStaffMemberId && leaveRecords.some((leave) =>
    leave.staffMemberId === input.assignedStaffMemberId &&
    leave.status === "approved" &&
    leave.startAt < input.endAt &&
    leave.endAt > input.startAt
  ));
  if (leaveConflict) throw new Error("This Staff Member has approved Leave during the selected shift.");
  const now = new Date().toISOString();
  return {
    id: `planned-shift-${uuid()}`,
    rosterPeriodId: input.rosterPeriodId as any,
    requirementId: input.requirementId as any,
    nursingHomeId: input.nursingHomeId as any,
    wardId: input.wardId as any,
    assignedStaffMemberId: input.assignedStaffMemberId as any,
    employmentRecordId: input.employmentRecordId as any,
    roleKey: input.roleKey,
    startAt: input.startAt,
    endAt: input.endAt,
    status: input.status || (input.assignedStaffMemberId ? "assigned" : "vacant"),
    confirmationRequired: input.confirmationRequired ?? true,
    readiness: { homeAssignment: "ok", professionalRegistration: "unknown" as any, competency: "unknown", leaveConflict },
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as any,
    updatedByUserAccountId: actorUserAccountId as any,
  };
}

export function publishRosterPeriod(period: RosterPeriod, actorUserAccountId: string): RosterPeriod {
  const now = new Date().toISOString();
  return { ...period, status: "published", publishedAt: now, publishedByUserAccountId: actorUserAccountId as any, updatedAt: now, updatedByUserAccountId: actorUserAccountId as any };
}
