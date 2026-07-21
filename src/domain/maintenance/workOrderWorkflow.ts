import type { MaintenanceWorkOrder, MaintenanceWorkOrderStatus, UserProfile } from "@/lib/care/types";
import { HISTORICAL_WORK_ORDER_STATUSES, WAITING_WORK_ORDER_STATUSES, workOrderAssigneeLabel } from "./workOrders";

export type WorkOrderWorkflowAction =
  | "ASSIGN"
  | "REASSIGN"
  | "UNASSIGN"
  | "SELF_ASSIGN"
  | "ACCEPT"
  | "START"
  | "PAUSE"
  | "AWAIT_PARTS"
  | "AWAIT_CONTRACTOR"
  | "AWAIT_ACCESS"
  | "RESUME";

export type WorkOrderHoldReason = "safety" | "access" | "resident_need" | "staffing" | "other";
export type WorkOrderAccessIssue = "resident_unavailable" | "room_in_use" | "infection_control" | "restricted_area" | "other";

export interface MaintenanceTeam {
  id: string;
  name: string;
  homeIds?: string[];
}

export const MAINTENANCE_TEAMS: MaintenanceTeam[] = [
  { id: "maintenance", name: "Maintenance Team" },
  { id: "housekeeping", name: "Housekeeping Team" },
  { id: "facilities", name: "Facilities Team" },
  { id: "external-contractor", name: "External Contractor Queue" },
];

export const WORK_ORDER_TRANSITIONS: Record<MaintenanceWorkOrderStatus, WorkOrderWorkflowAction[]> = {
  DRAFT: [],
  OPEN: ["ASSIGN", "SELF_ASSIGN"],
  ASSIGNED: ["REASSIGN", "UNASSIGN", "ACCEPT"],
  ACCEPTED: ["REASSIGN", "START"],
  IN_PROGRESS: ["PAUSE", "AWAIT_PARTS", "AWAIT_CONTRACTOR", "AWAIT_ACCESS"],
  ON_HOLD: ["REASSIGN", "RESUME"],
  AWAITING_ACCESS: ["REASSIGN", "RESUME"],
  AWAITING_PARTS: ["REASSIGN", "RESUME"],
  AWAITING_CONTRACTOR: ["REASSIGN", "RESUME"],
  COMPLETED: [],
  VERIFICATION_REQUIRED: [],
  VERIFIED: [],
  CLOSED: [],
  CANCELLED: [],
  ENTERED_IN_ERROR: [],
};

export interface WorkOrderWorkflowInput {
  action: WorkOrderWorkflowAction;
  expectedVersion: number;
  idempotencyKey?: string;
  assignedUserId?: string;
  assignedTeamId?: string;
  supervisorUserId?: string;
  reason?: string;
  note?: string;
  holdReason?: WorkOrderHoldReason;
  partsSummary?: string;
  expectedAvailabilityAt?: string;
  contractorDetails?: string;
  expectedAttendanceAt?: string;
  accessIssue?: WorkOrderAccessIssue;
  nextAccessAttemptAt?: string;
}

export interface WorkOrderWorkflowContext {
  currentUser: UserProfile;
  users: UserProfile[];
  canAccess: (capability: string, resource?: { nursingHomeId?: string; wardId?: string }) => boolean;
  now?: string;
}

export interface WorkOrderWorkflowResult {
  record: MaintenanceWorkOrder;
  auditAction: string;
  reason?: string;
  before: unknown;
  after: unknown;
}

export function availableWorkOrderActions(record: MaintenanceWorkOrder, context: WorkOrderWorkflowContext) {
  return WORK_ORDER_TRANSITIONS[record.status].filter((action) => {
    try {
      assertActionPermission(action, record, context);
      if (action === "ACCEPT") assertCanAccept(record, context, false);
      if (action === "START") assertCanStart(record, context, false);
      if (action === "RESUME") assertAssigned(record, context.users);
      return true;
    } catch {
      return false;
    }
  });
}

export function applyWorkOrderWorkflow(
  record: MaintenanceWorkOrder,
  input: WorkOrderWorkflowInput,
  context: WorkOrderWorkflowContext,
): WorkOrderWorkflowResult | undefined {
  const now = context.now || new Date().toISOString();
  assertNotLocked(record);
  if (input.idempotencyKey && record.lastWorkflowIdempotencyKey === input.idempotencyKey) return undefined;
  if (input.expectedVersion !== record.version) throw workflowError("WORKFLOW_CONFLICT");
  if (!WORK_ORDER_TRANSITIONS[record.status].includes(input.action)) throw workflowError("INVALID_TRANSITION");
  assertActionPermission(input.action, record, context);

  const before = workflowSnapshot(record, context.users);
  let next: MaintenanceWorkOrder = { ...record };
  let auditAction = "";
  let reason = input.reason?.trim() || input.note?.trim() || undefined;

  switch (input.action) {
    case "ASSIGN":
      next = assign(record, input, context, now);
      auditAction = "WORK_ORDER_ASSIGNED";
      reason = input.note?.trim() || undefined;
      break;
    case "SELF_ASSIGN":
      next = assign(record, { ...input, assignedUserId: context.currentUser.id }, context, now);
      auditAction = "WORK_ORDER_ASSIGNED";
      reason = "Self assigned";
      break;
    case "REASSIGN":
      next = reassign(record, input, context, now);
      auditAction = "WORK_ORDER_REASSIGNED";
      break;
    case "UNASSIGN":
      next = unassign(record, input, context, now);
      auditAction = "WORK_ORDER_UNASSIGNED";
      break;
    case "ACCEPT":
      next = accept(record, context, now);
      auditAction = "WORK_ORDER_ACCEPTED";
      break;
    case "START":
      next = start(record, context, now);
      auditAction = "WORK_ORDER_STARTED";
      break;
    case "PAUSE":
      next = wait(record, input, context, now, "ON_HOLD");
      auditAction = "WORK_ORDER_PAUSED";
      break;
    case "AWAIT_PARTS":
      next = wait(record, input, context, now, "AWAITING_PARTS");
      auditAction = "WORK_ORDER_AWAITING_PARTS";
      break;
    case "AWAIT_CONTRACTOR":
      next = wait(record, input, context, now, "AWAITING_CONTRACTOR");
      auditAction = "WORK_ORDER_AWAITING_CONTRACTOR";
      break;
    case "AWAIT_ACCESS":
      next = wait(record, input, context, now, "AWAITING_ACCESS");
      auditAction = "WORK_ORDER_AWAITING_ACCESS";
      break;
    case "RESUME":
      next = resume(record, input, context, now);
      auditAction = "WORK_ORDER_RESUMED";
      break;
  }

  next.updatedAt = now;
  next.updatedByUserId = context.currentUser.id;
  next.version = record.version + 1;
  next.lastWorkflowAction = input.action;
  next.lastWorkflowIdempotencyKey = input.idempotencyKey;

  return {
    record: next,
    auditAction,
    reason,
    before,
    after: workflowSnapshot(next, context.users),
  };
}

function assign(record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput, context: WorkOrderWorkflowContext, now: string) {
  const assignedUserId = input.assignedUserId?.trim() || undefined;
  const assignedTeamId = input.assignedTeamId?.trim() || undefined;
  if (!assignedUserId && !assignedTeamId) throw workflowError("ASSIGNMENT_REQUIRED");
  validateAssignment(record, context, assignedUserId, assignedTeamId, input.supervisorUserId);
  return {
    ...record,
    status: "ASSIGNED" as MaintenanceWorkOrderStatus,
    assignedUserId,
    assignedTeamId,
    supervisorUserId: input.supervisorUserId || undefined,
    assignedAt: now,
    assignedByUserId: context.currentUser.id,
  };
}

function reassign(record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput, context: WorkOrderWorkflowContext, now: string) {
  const assignedUserId = input.assignedUserId?.trim() || undefined;
  const assignedTeamId = input.assignedTeamId?.trim() || undefined;
  const supervisorUserId = input.supervisorUserId?.trim() || undefined;
  const changed =
    assignedUserId !== record.assignedUserId ||
    assignedTeamId !== record.assignedTeamId ||
    supervisorUserId !== record.supervisorUserId;
  if (!changed) throw new Error("Choose a different person, team or supervisor before reassigning.");
  if (!assignedUserId && !assignedTeamId) throw workflowError("ASSIGNMENT_REQUIRED");
  if (requiresReason(record) && !hasReason(input.reason, 10)) throw workflowError("REASON_REQUIRED");
  validateAssignment(record, context, assignedUserId, assignedTeamId, supervisorUserId);
  if (["IN_PROGRESS", ...WAITING_WORK_ORDER_STATUSES].includes(record.status) && !record.waitingSince) {
    throw new Error("Place the Work Order on hold before changing ownership after work has started.");
  }
  return {
    ...record,
    status: "ASSIGNED" as MaintenanceWorkOrderStatus,
    assignedUserId,
    assignedTeamId,
    supervisorUserId,
    assignedAt: now,
    assignedByUserId: context.currentUser.id,
    acceptedAt: undefined,
    acceptedByUserId: undefined,
    activeWorkStartedAt: undefined,
  };
}

function unassign(record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput, context: WorkOrderWorkflowContext, now: string) {
  if (!hasReason(input.reason, 10)) throw workflowError("REASON_REQUIRED");
  if (record.priority === "CRITICAL" && !context.canAccess("maintenance.work_orders.reassign", { nursingHomeId: record.homeId })) {
    throw new Error("Critical Work Orders require manager permission before unassignment.");
  }
  return {
    ...record,
    status: "OPEN" as MaintenanceWorkOrderStatus,
    assignedUserId: undefined,
    assignedTeamId: undefined,
    supervisorUserId: undefined,
    assignedAt: undefined,
    assignedByUserId: undefined,
  };
}

function accept(record: MaintenanceWorkOrder, context: WorkOrderWorkflowContext, now: string) {
  assertAssigned(record, context.users);
  assertCanAccept(record, context, true);
  const teamOnly = !record.assignedUserId && record.assignedTeamId;
  return {
    ...record,
    status: "ACCEPTED" as MaintenanceWorkOrderStatus,
    assignedUserId: teamOnly ? context.currentUser.id : record.assignedUserId,
    acceptedAt: now,
    acceptedByUserId: context.currentUser.id,
    responseAchievedAt: now,
  };
}

function start(record: MaintenanceWorkOrder, context: WorkOrderWorkflowContext, now: string) {
  assertAssigned(record, context.users);
  assertCanStart(record, context, true);
  return {
    ...record,
    status: "IN_PROGRESS" as MaintenanceWorkOrderStatus,
    startedAt: record.startedAt || now,
    activeWorkStartedAt: now,
  };
}

function wait(
  record: MaintenanceWorkOrder,
  input: WorkOrderWorkflowInput,
  context: WorkOrderWorkflowContext,
  now: string,
  target: Extract<MaintenanceWorkOrderStatus, "ON_HOLD" | "AWAITING_PARTS" | "AWAITING_CONTRACTOR" | "AWAITING_ACCESS">,
) {
  if (!hasReason(input.reason, 10)) throw workflowError("REASON_REQUIRED");
  assertWorkerOrSupervisor(record, context);
  if (target === "ON_HOLD" && !input.holdReason) throw new Error("Select a hold reason before continuing.");
  if (target === "AWAITING_PARTS" && !input.partsSummary?.trim()) throw new Error("Enter the parts required before continuing.");
  if (target === "AWAITING_ACCESS" && !input.accessIssue) throw new Error("Select the access issue before continuing.");
  return {
    ...record,
    status: target,
    activeWorkStartedAt: undefined,
    totalActiveWorkMs: elapsedTotal(record.totalActiveWorkMs, record.activeWorkStartedAt, now),
    waitingSince: now,
    waitingReasonCategory: target === "ON_HOLD" ? input.holdReason : target,
    waitingReasonText: input.reason?.trim(),
    partsSummary: input.partsSummary?.trim() || undefined,
    expectedAvailabilityAt: input.expectedAvailabilityAt || undefined,
    contractorDetails: input.contractorDetails?.trim() || undefined,
    expectedAttendanceAt: input.expectedAttendanceAt || undefined,
    accessIssue: input.accessIssue,
    nextAccessAttemptAt: input.nextAccessAttemptAt || undefined,
  };
}

function resume(record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput, context: WorkOrderWorkflowContext, now: string) {
  assertAssigned(record, context.users);
  assertWorkerOrSupervisor(record, context);
  if (!hasReason(input.reason || input.note, 5)) throw workflowError("REASON_REQUIRED");
  return {
    ...record,
    status: "IN_PROGRESS" as MaintenanceWorkOrderStatus,
    waitingSince: undefined,
    totalWaitingMs: elapsedTotal(record.totalWaitingMs, record.waitingSince, now),
    resumedAt: now,
    activeWorkStartedAt: now,
    waitingResolutionNote: (input.reason || input.note)?.trim(),
  };
}

function assertNotLocked(record: MaintenanceWorkOrder) {
  if (record.archivedAt || HISTORICAL_WORK_ORDER_STATUSES.includes(record.status)) throw workflowError("WORK_ORDER_LOCKED");
}

function assertActionPermission(action: WorkOrderWorkflowAction, record: MaintenanceWorkOrder, context: WorkOrderWorkflowContext) {
  const capability = workflowCapability(action);
  if (!context.canAccess(capability, { nursingHomeId: record.homeId, wardId: String(record.wardId || "") || undefined })) {
    throw new Error("You do not have permission to perform this Work Order action.");
  }
}

function workflowCapability(action: WorkOrderWorkflowAction) {
  switch (action) {
    case "ASSIGN":
      return "maintenance.work_orders.assign";
    case "REASSIGN":
      return "maintenance.work_orders.reassign";
    case "UNASSIGN":
      return "maintenance.work_orders.unassign";
    case "SELF_ASSIGN":
      return "maintenance.work_orders.assign_self";
    case "ACCEPT":
      return "maintenance.work_orders.accept";
    case "START":
      return "maintenance.work_orders.start";
    case "PAUSE":
      return "maintenance.work_orders.pause";
    case "AWAIT_PARTS":
      return "maintenance.work_orders.await_parts";
    case "AWAIT_CONTRACTOR":
      return "maintenance.work_orders.await_contractor";
    case "AWAIT_ACCESS":
      return "maintenance.work_orders.await_access";
    case "RESUME":
      return "maintenance.work_orders.resume";
  }
}

function validateAssignment(record: MaintenanceWorkOrder, context: WorkOrderWorkflowContext, assignedUserId?: string, assignedTeamId?: string, supervisorUserId?: string) {
  if (assignedTeamId && !MAINTENANCE_TEAMS.some((team) => team.id === assignedTeamId)) throw workflowError("INVALID_TEAM");
  if (assignedUserId) validateUser(record, context.users, assignedUserId);
  if (supervisorUserId) validateUser(record, context.users, supervisorUserId);
}

function validateUser(record: MaintenanceWorkOrder, users: UserProfile[], userId: string) {
  const user = users.find((item) => item.id === userId);
  if (!user) throw new Error("The selected person is not available for this Care Home.");
  if (user.status !== "active") throw workflowError("ASSIGNEE_INACTIVE");
  const homes = user.facilityIds || (user.facilityId ? [user.facilityId] : []);
  if (homes.length > 0 && !homes.includes(record.homeId)) throw new Error("The selected person is outside this Care Home.");
}

function assertAssigned(record: MaintenanceWorkOrder, users: UserProfile[]) {
  if (!record.assignedUserId && !record.assignedTeamId) throw workflowError("NOT_ASSIGNED");
  if (record.assignedUserId) {
    const user = users.find((item) => item.id === record.assignedUserId);
    if (!user || user.status !== "active") throw workflowError("ASSIGNEE_INACTIVE");
  }
}

function assertCanAccept(record: MaintenanceWorkOrder, context: WorkOrderWorkflowContext, throwSpecific: boolean) {
  if (record.assignedUserId === context.currentUser.id) return;
  if (!record.assignedUserId && record.assignedTeamId && context.canAccess("maintenance.work_orders.accept_team_work", { nursingHomeId: record.homeId })) return;
  if (context.canAccess("maintenance.work_orders.accept_on_behalf", { nursingHomeId: record.homeId })) return;
  if (throwSpecific) throw workflowError("NOT_CURRENT_ASSIGNEE");
  throw new Error("Unavailable");
}

function assertCanStart(record: MaintenanceWorkOrder, context: WorkOrderWorkflowContext, throwSpecific: boolean) {
  if (!record.acceptedAt) {
    if (throwSpecific) throw workflowError("NOT_ACCEPTED");
    throw new Error("Unavailable");
  }
  assertWorkerOrSupervisor(record, context);
  if ((record.immediateRisk || record.riskAssessment?.requiresImmediateAction) && !record.immediateControlSummary?.trim() && !record.riskAssessment?.controlMeasures?.trim()) {
    if (throwSpecific) throw workflowError("CONTROLS_REQUIRED");
    throw new Error("Unavailable");
  }
}

function assertWorkerOrSupervisor(record: MaintenanceWorkOrder, context: WorkOrderWorkflowContext) {
  if (record.assignedUserId === context.currentUser.id) return;
  if (record.supervisorUserId === context.currentUser.id) return;
  if (context.canAccess("maintenance.work_orders.reassign", { nursingHomeId: record.homeId })) return;
  throw workflowError("NOT_CURRENT_ASSIGNEE");
}

function requiresReason(record: MaintenanceWorkOrder) {
  return record.status !== "OPEN" || record.priority === "HIGH" || record.priority === "CRITICAL";
}

function hasReason(value: string | undefined, min: number) {
  return Boolean(value?.trim() && value.trim().length >= min);
}

function elapsedTotal(current: number | undefined, start: string | undefined, now: string) {
  if (!start) return current || 0;
  return (current || 0) + Math.max(0, new Date(now).getTime() - new Date(start).getTime());
}

function workflowSnapshot(record: MaintenanceWorkOrder, users: UserProfile[]) {
  return {
    workOrderNumber: record.workOrderNumber,
    status: record.status,
    assignedUserId: record.assignedUserId,
    assignedTeamId: record.assignedTeamId,
    supervisorUserId: record.supervisorUserId,
    assignedTo: workOrderAssigneeLabel(record, users),
    assignedAt: record.assignedAt,
    acceptedAt: record.acceptedAt,
    startedAt: record.startedAt,
    waitingSince: record.waitingSince,
    waitingReasonCategory: record.waitingReasonCategory,
    version: record.version,
  };
}

function workflowError(code: string) {
  const messages: Record<string, string> = {
    INVALID_TRANSITION: "This action is not available from the current Work Order status.",
    NOT_ASSIGNED: "Assign the Work Order before accepting it.",
    NOT_ACCEPTED: "Accept the Work Order before starting work.",
    NOT_CURRENT_ASSIGNEE: "This Work Order is assigned to another person.",
    ASSIGNEE_INACTIVE: "The assigned person is no longer active.",
    INVALID_TEAM: "The selected team is not available for this Care Home.",
    REASON_REQUIRED: "Enter a reason before continuing.",
    CONTROLS_REQUIRED: "Record the required safety controls before starting work.",
    WORKFLOW_CONFLICT: "The Work Order changed while this action was being completed.",
    WORK_ORDER_LOCKED: "This Work Order is read-only in its current status.",
    ASSIGNMENT_REQUIRED: "Select a maintenance team or assigned person before continuing.",
  };
  return new Error(messages[code] || "Unable to complete this Work Order action.");
}
