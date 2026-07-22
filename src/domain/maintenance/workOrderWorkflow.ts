import type { MaintenanceRiskLevel, MaintenanceWorkOrder, MaintenanceWorkOrderStatus, UserProfile } from "@/lib/care/types";
import { HISTORICAL_WORK_ORDER_STATUSES, WAITING_WORK_ORDER_STATUSES, workOrderAssigneeLabel } from "./workOrders.ts";

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
  | "RESUME"
  | "COMPLETE";

export type WorkOrderHoldReason = "safety" | "access" | "resident_need" | "staffing" | "other";
export type WorkOrderAccessIssue = "resident_unavailable" | "room_in_use" | "infection_control" | "restricted_area" | "other";
export type WorkOrderWorkflowErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_TRANSITION"
  | "PERMISSION_DENIED"
  | "OUT_OF_SCOPE"
  | "STALE_VERSION"
  | "ASSIGNMENT_REQUIRED"
  | "INVALID_ASSIGNEE"
  | "ACCEPTANCE_REQUIRED"
  | "RISK_ASSESSMENT_REQUIRED"
  | "IMMEDIATE_CONTROLS_REQUIRED"
  | "REASON_REQUIRED"
  | "DATE_INVALID"
  | "WORK_ORDER_LOCKED"
  | "DUPLICATE_ACTION"
  | "INVARIANT_VIOLATION";

export interface MaintenanceTeam {
  id: string;
  name: string;
  homeIds?: string[];
  disabled?: boolean;
}

export interface WorkflowValidationIssue {
  code: WorkOrderWorkflowErrorCode;
  field?: keyof WorkOrderWorkflowInput | "workOrder" | "assignment" | "risk" | "permission" | "invariant";
  message: string;
  severity: "ERROR" | "WARNING" | "INFO";
}

export interface WorkflowRuleResult {
  ruleId: string;
  passed: boolean;
  severity: "ERROR" | "WARNING" | "INFO";
  message: string;
  field?: WorkflowValidationIssue["field"];
  code?: WorkOrderWorkflowErrorCode;
}

export interface WorkOrderWorkflowValidationResult {
  valid: boolean;
  errors: WorkflowValidationIssue[];
  warnings: WorkflowValidationIssue[];
  info: WorkflowValidationIssue[];
  calculatedChanges: Partial<MaintenanceWorkOrder>;
  rules: WorkflowRuleResult[];
}

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
  completionId?: string;
  completionOutcome?: string;
  completionVerificationRequired?: boolean;
}

export interface WorkOrderWorkflowContext {
  currentUser: UserProfile;
  users: UserProfile[];
  canAccess: (capability: string, resource?: { nursingHomeId?: string; wardId?: string }) => boolean;
  now?: string;
  organisationId?: string;
  homeId?: string;
}

export interface WorkOrderWorkflowResult {
  record: MaintenanceWorkOrder;
  auditAction: string;
  reason?: string;
  before: unknown;
  after: unknown;
}

export interface WorkOrderEscalationResult {
  escalationType:
    | "WORK_ORDER_UNASSIGNED_CRITICAL"
    | "WORK_ORDER_RESPONSE_DUE_SOON"
    | "WORK_ORDER_RESPONSE_BREACHED"
    | "WORK_ORDER_COMPLETION_DUE_SOON"
    | "WORK_ORDER_COMPLETION_BREACHED"
    | "WORK_ORDER_HOLD_OVERDUE"
    | "WORK_ORDER_PARTS_OVERDUE"
    | "WORK_ORDER_CONTRACTOR_OVERDUE"
    | "WORK_ORDER_ACCESS_OVERDUE";
  severity: "INFO" | "WARNING" | "CRITICAL";
  triggered: boolean;
  triggerAt?: string;
  reason: string;
  workOrderId: string;
  organisationId?: string;
  homeId: string;
  metadata: Record<string, string | number | boolean | undefined>;
}

export class WorkOrderWorkflowError extends Error {
  code: WorkOrderWorkflowErrorCode;
  fieldErrors: Record<string, string>;
  details?: Record<string, unknown>;

  constructor(code: WorkOrderWorkflowErrorCode, message: string, issues: WorkflowValidationIssue[] = [], details?: Record<string, unknown>) {
    super(message);
    this.name = "WorkOrderWorkflowError";
    this.code = code;
    this.details = details;
    this.fieldErrors = issues.reduce((acc, issue) => {
      if (issue.field) acc[String(issue.field)] = issue.message;
      return acc;
    }, {} as Record<string, string>);
  }
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
  IN_PROGRESS: ["PAUSE", "AWAIT_PARTS", "AWAIT_CONTRACTOR", "AWAIT_ACCESS", "COMPLETE"],
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

const ACTIONS: WorkOrderWorkflowAction[] = [
  "ASSIGN",
  "REASSIGN",
  "UNASSIGN",
  "SELF_ASSIGN",
  "ACCEPT",
  "START",
  "PAUSE",
  "AWAIT_PARTS",
  "AWAIT_CONTRACTOR",
  "AWAIT_ACCESS",
  "RESUME",
  "COMPLETE",
];
const HOLD_REASONS: WorkOrderHoldReason[] = ["safety", "access", "resident_need", "staffing", "other"];
const ACCESS_ISSUES: WorkOrderAccessIssue[] = ["resident_unavailable", "room_in_use", "infection_control", "restricted_area", "other"];

export function availableWorkOrderActions(record: MaintenanceWorkOrder, context: WorkOrderWorkflowContext) {
  return WORK_ORDER_TRANSITIONS[record.status].filter((action) => validateWorkflowAction({ workOrder: record, payload: { action, expectedVersion: record.version }, context, skipVersion: true }).valid);
}

export function validateWorkflowAction({
  workOrder,
  payload,
  context,
  skipVersion = false,
}: {
  workOrder?: MaintenanceWorkOrder;
  payload: WorkOrderWorkflowInput;
  context: WorkOrderWorkflowContext;
  skipVersion?: boolean;
}): WorkOrderWorkflowValidationResult {
  const now = context.now || new Date().toISOString();
  const errors: WorkflowValidationIssue[] = [];
  const warnings: WorkflowValidationIssue[] = [];
  const info: WorkflowValidationIssue[] = [];
  const rules: WorkflowRuleResult[] = [];
  const add = (issue: WorkflowValidationIssue) => {
    if (issue.severity === "ERROR") errors.push(issue);
    else if (issue.severity === "WARNING") warnings.push(issue);
    else info.push(issue);
  };
  const rule = (result: WorkflowRuleResult) => {
    rules.push(result);
    if (!result.passed) {
      add({ code: result.code || "VALIDATION_ERROR", field: result.field, message: result.message, severity: result.severity });
    }
  };

  validateRequest(payload).forEach(add);
  if (!context.currentUser?.id) add(error("PERMISSION_DENIED", "permission", "A signed-in user is required."));
  if (!workOrder) {
    add(error("VALIDATION_ERROR", "workOrder", "Work Order not found."));
    return result(errors, warnings, info, rules);
  }

  validateRecordRules(workOrder, payload, context, skipVersion).forEach(rule);
  validateTransitionRules(workOrder, payload).forEach(rule);
  validatePermissionRules(workOrder, payload, context).forEach(rule);
  validateBusinessRules(workOrder, payload, context, now).forEach(rule);
  validateDateRules(workOrder, payload, now).forEach(rule);

  if (errors.length > 0) return result(errors, warnings, info, rules);

  const calculatedChanges = calculateAutomaticChanges(workOrder, payload, context, now);
  validateStatusInvariants({ ...workOrder, ...calculatedChanges }, context.users).forEach(rule);
  return result(errors, warnings, info, rules, calculatedChanges);
}

export function applyWorkOrderWorkflow(
  record: MaintenanceWorkOrder,
  input: WorkOrderWorkflowInput,
  context: WorkOrderWorkflowContext,
): WorkOrderWorkflowResult | undefined {
  const now = context.now || new Date().toISOString();
  if (input.idempotencyKey && record.lastWorkflowIdempotencyKey === input.idempotencyKey) return undefined;

  const validation = validateWorkflowAction({ workOrder: record, payload: input, context });
  if (!validation.valid) throw workflowValidationError(validation, record, input);

  const before = workflowSnapshot(record, context.users);
  const next: MaintenanceWorkOrder = {
    ...record,
    ...validation.calculatedChanges,
    updatedAt: now,
    updatedByUserId: context.currentUser.id,
    version: record.version + 1,
    lastWorkflowAction: input.action,
    lastWorkflowIdempotencyKey: input.idempotencyKey,
  };

  return {
    record: next,
    auditAction: auditAction(input.action),
    reason: reasonText(input) || (input.action === "SELF_ASSIGN" ? "Self assigned" : undefined),
    before,
    after: workflowSnapshot(next, context.users, input.action),
  };
}

export function evaluateWorkflowRules(workOrder: MaintenanceWorkOrder, payload: WorkOrderWorkflowInput, context: WorkOrderWorkflowContext) {
  return validateWorkflowAction({ workOrder, payload, context }).rules;
}

export function getBlockingRules(workOrder: MaintenanceWorkOrder, payload: WorkOrderWorkflowInput, context: WorkOrderWorkflowContext) {
  return evaluateWorkflowRules(workOrder, payload, context).filter((rule) => !rule.passed && rule.severity === "ERROR");
}

export function getWarnings(workOrder: MaintenanceWorkOrder, payload: WorkOrderWorkflowInput, context: WorkOrderWorkflowContext) {
  return evaluateWorkflowRules(workOrder, payload, context).filter((rule) => rule.severity === "WARNING");
}

export function getAvailableActions(workOrder: MaintenanceWorkOrder, context: WorkOrderWorkflowContext) {
  return availableWorkOrderActions(workOrder, context);
}

export function evaluateWorkOrderEscalations({
  workOrder,
  now = new Date().toISOString(),
  settings = {},
}: {
  workOrder: MaintenanceWorkOrder;
  now?: string;
  settings?: {
    dueSoonMinutes?: number;
    holdOverdueHours?: number;
  };
}): WorkOrderEscalationResult[] {
  const nowMs = new Date(now).getTime();
  const dueSoonMs = (settings.dueSoonMinutes ?? 60) * 60_000;
  const holdOverdueMs = (settings.holdOverdueHours ?? 24) * 60 * 60_000;
  const base = {
    workOrderId: workOrder.id,
    organisationId: workOrder.organisationId || workOrder.providerId || workOrder.enterpriseId ? String(workOrder.organisationId || workOrder.providerId || workOrder.enterpriseId) : undefined,
    homeId: workOrder.homeId,
  };
  const items: WorkOrderEscalationResult[] = [];
  const responseAt = dateMs(workOrder.requiredResponseAt);
  const dueAt = dateMs(workOrder.dueAt);
  const waitingAt = dateMs(workOrder.waitingSince);
  if (workOrder.priority === "CRITICAL" && workOrder.status === "OPEN" && !workOrder.assignedUserId && !workOrder.assignedTeamId) {
    items.push(escalation("WORK_ORDER_UNASSIGNED_CRITICAL", "CRITICAL", true, now, "Critical Work Order is unassigned.", workOrder, base));
  }
  if (responseAt && !workOrder.responseAchievedAt && responseAt > nowMs && responseAt - nowMs <= dueSoonMs) {
    items.push(escalation("WORK_ORDER_RESPONSE_DUE_SOON", "WARNING", true, workOrder.requiredResponseAt, "Response target is approaching.", workOrder, base));
  }
  if (responseAt && !workOrder.responseAchievedAt && responseAt < nowMs) {
    items.push(escalation("WORK_ORDER_RESPONSE_BREACHED", "CRITICAL", true, workOrder.requiredResponseAt, "Response target has been breached.", workOrder, base));
  }
  if (dueAt && dueAt > nowMs && dueAt - nowMs <= dueSoonMs) {
    items.push(escalation("WORK_ORDER_COMPLETION_DUE_SOON", "WARNING", true, workOrder.dueAt, "Completion target is approaching.", workOrder, base));
  }
  if (dueAt && dueAt < nowMs && !HISTORICAL_WORK_ORDER_STATUSES.includes(workOrder.status)) {
    items.push(escalation("WORK_ORDER_COMPLETION_BREACHED", "CRITICAL", true, workOrder.dueAt, "Completion target has been breached.", workOrder, base));
  }
  if (waitingAt && nowMs - waitingAt > holdOverdueMs) {
    const type =
      workOrder.status === "AWAITING_PARTS"
        ? "WORK_ORDER_PARTS_OVERDUE"
        : workOrder.status === "AWAITING_CONTRACTOR"
          ? "WORK_ORDER_CONTRACTOR_OVERDUE"
          : workOrder.status === "AWAITING_ACCESS"
            ? "WORK_ORDER_ACCESS_OVERDUE"
            : "WORK_ORDER_HOLD_OVERDUE";
    items.push(escalation(type, workOrder.priority === "CRITICAL" ? "CRITICAL" : "WARNING", true, workOrder.waitingSince, "Work Order has remained blocked beyond the expected window.", workOrder, base));
  }
  return items;
}

function validateRequest(input: WorkOrderWorkflowInput) {
  const issues: WorkflowValidationIssue[] = [];
  const allowed = new Set([
    "action",
    "expectedVersion",
    "idempotencyKey",
    "assignedUserId",
    "assignedTeamId",
    "supervisorUserId",
    "reason",
    "note",
    "holdReason",
    "partsSummary",
    "expectedAvailabilityAt",
    "contractorDetails",
    "expectedAttendanceAt",
    "accessIssue",
    "nextAccessAttemptAt",
    "completionId",
    "completionOutcome",
    "completionVerificationRequired",
  ]);
  Object.keys(input as Record<string, unknown>).forEach((key) => {
    if (!allowed.has(key)) issues.push(error("VALIDATION_ERROR", "workOrder", `Unexpected workflow field: ${key}.`));
  });
  if (!ACTIONS.includes(input.action)) issues.push(error("VALIDATION_ERROR", "action", "Select a valid workflow action."));
  if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) issues.push(error("VALIDATION_ERROR", "expectedVersion", "A valid Work Order version is required."));
  if (input.reason && input.reason.length > 1000) issues.push(error("VALIDATION_ERROR", "reason", "Keep the reason under 1,000 characters."));
  if (input.note && input.note.length > 1000) issues.push(error("VALIDATION_ERROR", "note", "Keep the note under 1,000 characters."));
  if (input.partsSummary && input.partsSummary.length > 500) issues.push(error("VALIDATION_ERROR", "partsSummary", "Keep the parts summary under 500 characters."));
  if (input.contractorDetails && input.contractorDetails.length > 500) issues.push(error("VALIDATION_ERROR", "contractorDetails", "Keep the contractor requirement under 500 characters."));
  if (input.holdReason && !HOLD_REASONS.includes(input.holdReason)) issues.push(error("VALIDATION_ERROR", "holdReason", "Select a valid hold reason."));
  if (input.accessIssue && !ACCESS_ISSUES.includes(input.accessIssue)) issues.push(error("VALIDATION_ERROR", "accessIssue", "Select a valid access issue."));
  ["expectedAvailabilityAt", "expectedAttendanceAt", "nextAccessAttemptAt"].forEach((field) => {
    const value = input[field as keyof WorkOrderWorkflowInput];
    if (typeof value === "string" && Number.isNaN(new Date(value).getTime())) {
      issues.push(error("DATE_INVALID", field as WorkflowValidationIssue["field"], "Enter a valid date and time."));
    }
  });
  return issues;
}

function validateRecordRules(record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput, context: WorkOrderWorkflowContext, skipVersion: boolean): WorkflowRuleResult[] {
  const rules: WorkflowRuleResult[] = [];
  rules.push(rule("WO_AUTHENTICATED_ACTOR", Boolean(context.currentUser?.id), "PERMISSION_DENIED", "permission", "A signed-in user is required."));
  const userHomes = context.currentUser.facilityIds || (context.currentUser.facilityId ? [context.currentUser.facilityId] : []);
  const inHomeScope = context.currentUser.role === "group_owner" || userHomes.length === 0 || userHomes.includes(record.homeId);
  rules.push(rule("WO_HOME_SCOPE", inHomeScope, "OUT_OF_SCOPE", "workOrder", "This Work Order is outside your authorised Care Home scope."));
  if (context.organisationId && record.organisationId) {
    rules.push(rule("WO_ORGANISATION_SCOPE", record.organisationId === context.organisationId, "OUT_OF_SCOPE", "workOrder", "This Work Order is outside your organisation scope."));
  }
  if (context.homeId) rules.push(rule("WO_CONTEXT_HOME_SCOPE", record.homeId === context.homeId, "OUT_OF_SCOPE", "workOrder", "This Work Order is outside the selected Care Home."));
  rules.push(rule("WO_NOT_ARCHIVED", !record.archivedAt, "WORK_ORDER_LOCKED", "workOrder", "Archived Work Orders cannot be changed."));
  rules.push(rule("WO_NOT_TERMINAL", !HISTORICAL_WORK_ORDER_STATUSES.includes(record.status), "WORK_ORDER_LOCKED", "workOrder", "This Work Order is read-only in its current status."));
  if (!skipVersion) rules.push(rule("WO_VERSION_MATCH", input.expectedVersion === record.version, "STALE_VERSION", "expectedVersion", "This Work Order changed while you were completing this action. Review the latest details and try again."));
  return rules;
}

function validateTransitionRules(record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput): WorkflowRuleResult[] {
  return [
    rule("WO_ACTION_SUPPORTED", ACTIONS.includes(input.action), "VALIDATION_ERROR", "action", "Select a valid workflow action."),
    rule("WO_TRANSITION_ALLOWED", WORK_ORDER_TRANSITIONS[record.status]?.includes(input.action), "INVALID_TRANSITION", "action", "This action is not available from the current Work Order status."),
  ];
}

function validatePermissionRules(record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput, context: WorkOrderWorkflowContext): WorkflowRuleResult[] {
  const capability = workflowCapability(input.action);
  const rules = [
    rule("WO_ACTION_CAPABILITY", context.canAccess(capability, { nursingHomeId: record.homeId, wardId: String(record.wardId || "") || undefined }), "PERMISSION_DENIED", "permission", "You do not have permission to perform this Work Order action."),
  ];
  if (input.action === "ACCEPT") {
    rules.push(rule("WO_ACCEPT_RELATIONSHIP", canAccept(record, context), "PERMISSION_DENIED", "assignment", "This Work Order is assigned to another person."));
  }
  if (["START", "PAUSE", "AWAIT_PARTS", "AWAIT_CONTRACTOR", "AWAIT_ACCESS", "RESUME"].includes(input.action)) {
    rules.push(rule("WO_WORKER_OR_SUPERVISOR", isWorkerOrSupervisor(record, context), "PERMISSION_DENIED", "assignment", "This Work Order is assigned to another person."));
  }
  if (input.action === "START" && record.priority === "CRITICAL") {
    rules.push(rule("WO_CRITICAL_START_AUTHORISED", context.canAccess("maintenance.work_orders.reassign", { nursingHomeId: record.homeId }) || record.assignedUserId === context.currentUser.id, "PERMISSION_DENIED", "permission", "Critical Work Orders can only be started by the assigned person or an authorised supervisor."));
  }
  if (input.action === "UNASSIGN" && record.priority === "CRITICAL") {
    rules.push(rule("WO_CRITICAL_UNASSIGN_MANAGER", context.canAccess("maintenance.work_orders.reassign", { nursingHomeId: record.homeId }), "PERMISSION_DENIED", "permission", "Critical Work Orders require manager permission before unassignment."));
  }
  if (input.action === "COMPLETE") {
    rules.push(rule("WO_COMPLETE_RELATIONSHIP", isWorkerOrSupervisor(record, context) || context.canAccess("maintenance.work_orders.complete_unassigned", { nursingHomeId: record.homeId }), "PERMISSION_DENIED", "assignment", "Only the assigned person or an authorised supervisor can complete this Work Order."));
  }
  return rules;
}

function validateBusinessRules(record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput, context: WorkOrderWorkflowContext, now: string): WorkflowRuleResult[] {
  const rules: WorkflowRuleResult[] = [];
  if (["ASSIGN", "REASSIGN"].includes(input.action)) {
    const assignedUserId = clean(input.assignedUserId);
    const assignedTeamId = clean(input.assignedTeamId);
    const supervisorUserId = clean(input.supervisorUserId);
    rules.push(rule("WO_ASSIGNMENT_REQUIRED", Boolean(assignedUserId || assignedTeamId), "ASSIGNMENT_REQUIRED", "assignment", "Select a maintenance team or assigned person before continuing."));
    validateAssignmentRules(record, context, assignedUserId, assignedTeamId, supervisorUserId).forEach((item) => rules.push(item));
    const changed = assignedUserId !== record.assignedUserId || assignedTeamId !== record.assignedTeamId || supervisorUserId !== record.supervisorUserId;
    if (input.action === "REASSIGN") rules.push(rule("WO_REASSIGN_CHANGED", changed, "VALIDATION_ERROR", "assignment", "Choose a different person, team or supervisor before reassigning."));
    if (requiresReason(record, input.action)) rules.push(rule("WO_REASSIGN_REASON", hasReason(input.reason, 10), "REASON_REQUIRED", "reason", "Enter a reason before continuing."));
    if (record.status === "IN_PROGRESS") rules.push(rule("WO_REASSIGN_NOT_ACTIVE", false, "INVALID_TRANSITION", "action", "Place the Work Order on hold before changing ownership after work has started."));
  }
  if (input.action === "UNASSIGN") rules.push(rule("WO_UNASSIGN_REASON", hasReason(input.reason, 10), "REASON_REQUIRED", "reason", "Enter a reason before continuing."));
  if (input.action === "ACCEPT") {
    rules.push(rule("WO_ACCEPT_ASSIGNED", hasAssignment(record), "ASSIGNMENT_REQUIRED", "assignment", "Assign the Work Order before accepting it."));
    validateCurrentAssignee(record, context.users).forEach((item) => rules.push(item));
  }
  if (input.action === "START") {
    rules.push(rule("WO_START_REQUIRES_ACCEPTANCE", Boolean(record.acceptedAt && record.acceptedByUserId), "ACCEPTANCE_REQUIRED", "workOrder", "Accept the Work Order before starting work."));
    rules.push(...validateRiskRules(record));
    rules.push(...validatePriorityRules(record, input));
    validateCurrentAssignee(record, context.users).forEach((item) => rules.push(item));
  }
  if (["PAUSE", "AWAIT_PARTS", "AWAIT_CONTRACTOR", "AWAIT_ACCESS"].includes(input.action)) {
    rules.push(rule("WO_WAIT_REASON", hasReason(input.reason, 10), "REASON_REQUIRED", "reason", "Enter a clear reason before continuing."));
    if (record.priority === "CRITICAL") rules.push(rule("WO_CRITICAL_WAIT_CONTROLS", hasImmediateControls(record), "IMMEDIATE_CONTROLS_REQUIRED", "risk", "Record temporary safety controls before blocking a Critical Work Order."));
  }
  if (input.action === "PAUSE") rules.push(rule("WO_HOLD_REASON", Boolean(input.holdReason), "VALIDATION_ERROR", "holdReason", "Select a hold reason before continuing."));
  if (input.action === "AWAIT_PARTS") rules.push(rule("WO_PARTS_SUMMARY", Boolean(clean(input.partsSummary)), "VALIDATION_ERROR", "partsSummary", "Enter the parts required before continuing."));
  if (input.action === "AWAIT_CONTRACTOR") rules.push(rule("WO_CONTRACTOR_DETAILS", Boolean(clean(input.contractorDetails)), "VALIDATION_ERROR", "contractorDetails", "Enter the contractor requirement before continuing."));
  if (input.action === "AWAIT_ACCESS") rules.push(rule("WO_ACCESS_ISSUE", Boolean(input.accessIssue), "VALIDATION_ERROR", "accessIssue", "Select the access issue before continuing."));
  if (input.action === "RESUME") {
    rules.push(rule("WO_RESUME_WAITING_STARTED", Boolean(record.waitingSince), "INVARIANT_VIOLATION", "workOrder", "This waiting state is missing its waiting start time."));
    rules.push(rule("WO_RESUME_REASON", hasReason(input.reason || input.note, 5), "REASON_REQUIRED", "reason", "Enter a resolution note before resuming work."));
    validateCurrentAssignee(record, context.users).forEach((item) => rules.push(item));
    if (record.waitingSince) rules.push(rule("WO_RESUME_AFTER_WAIT", new Date(now).getTime() >= new Date(record.waitingSince).getTime(), "DATE_INVALID", "workOrder", "Resume time cannot be before the waiting start time."));
  }
  return rules;
}

export function validateAssignmentRules(record: MaintenanceWorkOrder, context: WorkOrderWorkflowContext, assignedUserId?: string, assignedTeamId?: string, supervisorUserId?: string): WorkflowRuleResult[] {
  const rules: WorkflowRuleResult[] = [];
  const team = assignedTeamId ? MAINTENANCE_TEAMS.find((item) => item.id === assignedTeamId) : undefined;
  if (assignedTeamId) {
    rules.push(rule("WO_VALID_TEAM", Boolean(team), "INVALID_ASSIGNEE", "assignedTeamId", "The selected team is not available for this Care Home."));
    rules.push(rule("WO_TEAM_ENABLED", Boolean(team && !team.disabled), "INVALID_ASSIGNEE", "assignedTeamId", "The selected team is disabled."));
    rules.push(rule("WO_TEAM_HOME_SCOPE", Boolean(!team?.homeIds || team.homeIds.includes(record.homeId)), "OUT_OF_SCOPE", "assignedTeamId", "The selected team is outside this Care Home."));
  }
  if (assignedUserId) rules.push(...validateUserRules(record, context.users, assignedUserId, "assignedUserId"));
  if (supervisorUserId) rules.push(...validateUserRules(record, context.users, supervisorUserId, "supervisorUserId"));
  return rules;
}

export function validateRiskRules(record: MaintenanceWorkOrder): WorkflowRuleResult[] {
  const level = riskLevel(record);
  const rules: WorkflowRuleResult[] = [];
  if ((record.priority === "MEDIUM" || record.priority === "HIGH" || record.priority === "CRITICAL" || record.immediateRisk) && !record.riskAssessment) {
    rules.push(rule("WO_RISK_ASSESSMENT_COMPLETE", false, "RISK_ASSESSMENT_REQUIRED", "risk", "Complete the risk assessment before starting work."));
    return rules;
  }
  if (record.riskAssessment) {
    rules.push(rule("WO_RISK_VALUES_COMPLETE", Boolean(record.riskAssessment.likelihood && record.riskAssessment.consequence && record.riskAssessment.score), "RISK_ASSESSMENT_REQUIRED", "risk", "Risk data is incomplete. Review the risk assessment before starting work."));
  }
  if (level === "HIGH" || level === "CRITICAL" || record.immediateRisk || record.riskAssessment?.requiresImmediateAction) {
    rules.push(rule("WO_IMMEDIATE_CONTROLS_PRESENT", hasImmediateControls(record), "IMMEDIATE_CONTROLS_REQUIRED", "risk", "Record the immediate safety controls before starting work."));
  }
  return rules;
}

export function validatePriorityRules(record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput): WorkflowRuleResult[] {
  const rules: WorkflowRuleResult[] = [];
  if ((record.priority === "HIGH" || record.priority === "CRITICAL") && input.action === "REASSIGN") {
    rules.push(rule("WO_PRIORITY_REASSIGN_REASON", hasReason(input.reason, 10), "REASON_REQUIRED", "reason", "High and Critical Work Orders require a reassignment reason."));
  }
  return rules;
}

export function validateWaitingRules(record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput, now: string) {
  return validateDateRules(record, input, now);
}

export function validateResumeRules(record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput, context: WorkOrderWorkflowContext) {
  return validateBusinessRules(record, input, context, context.now || new Date().toISOString()).filter((item) => item.ruleId.startsWith("WO_RESUME"));
}

export function validateSlaRules(record: MaintenanceWorkOrder) {
  const rules: WorkflowRuleResult[] = [];
  if (record.requiredResponseAt && Number.isNaN(new Date(record.requiredResponseAt).getTime())) rules.push(rule("WO_RESPONSE_TARGET_VALID", false, "DATE_INVALID", "workOrder", "Response target is invalid."));
  if (record.dueAt && Number.isNaN(new Date(record.dueAt).getTime())) rules.push(rule("WO_DUE_TARGET_VALID", false, "DATE_INVALID", "workOrder", "Due date is invalid."));
  return rules;
}

export function validateStatusInvariants(record: MaintenanceWorkOrder, users: UserProfile[] = []): WorkflowRuleResult[] {
  const rules: WorkflowRuleResult[] = [];
  const userValid = !record.assignedUserId || users.length === 0 || users.some((user) => user.id === record.assignedUserId && user.status === "active" && userInHome(user, record.homeId));
  rules.push(rule("WO_ASSIGNEE_HOME_VALID", userValid, "INVARIANT_VIOLATION", "invariant", "The current assignee is not active in this Care Home."));
  if (record.status === "OPEN") {
    rules.push(rule("WO_OPEN_NO_ACCEPTANCE", !record.acceptedAt && !record.acceptedByUserId, "INVARIANT_VIOLATION", "invariant", "Open Work Orders cannot retain acceptance metadata."));
    rules.push(rule("WO_OPEN_NO_ACTIVE_TIME", !record.activeWorkStartedAt, "INVARIANT_VIOLATION", "invariant", "Open Work Orders cannot have an active work period."));
  }
  if (record.status === "ASSIGNED") {
    rules.push(rule("WO_ASSIGNED_HAS_ASSIGNMENT", hasAssignment(record), "INVARIANT_VIOLATION", "assignment", "Assigned Work Orders must have a person or team."));
    rules.push(rule("WO_ASSIGNED_HAS_TIMESTAMP", Boolean(record.assignedAt), "INVARIANT_VIOLATION", "invariant", "Assigned Work Orders must have an assignment timestamp."));
    rules.push(rule("WO_ASSIGNED_NO_ACCEPTANCE", !record.acceptedAt && !record.acceptedByUserId, "INVARIANT_VIOLATION", "invariant", "Assigned Work Orders cannot retain current acceptance metadata."));
  }
  if (record.status === "ACCEPTED") {
    rules.push(rule("WO_ACCEPTED_HAS_ASSIGNMENT", hasAssignment(record), "INVARIANT_VIOLATION", "assignment", "Accepted Work Orders must have an assignment."));
    rules.push(rule("WO_ACCEPTED_HAS_ACCEPTANCE", Boolean(record.acceptedAt && record.acceptedByUserId), "INVARIANT_VIOLATION", "invariant", "Accepted Work Orders must have acceptance metadata."));
    rules.push(rule("WO_ACCEPTED_NO_ACTIVE_TIME", !record.activeWorkStartedAt, "INVARIANT_VIOLATION", "invariant", "Accepted Work Orders cannot have a current active work period."));
  }
  if (record.status === "IN_PROGRESS") {
    rules.push(rule("WO_PROGRESS_HAS_ACCEPTANCE", Boolean(record.acceptedAt && record.acceptedByUserId), "INVARIANT_VIOLATION", "invariant", "In Progress Work Orders must have acceptance metadata."));
    rules.push(rule("WO_PROGRESS_HAS_START", Boolean(record.startedAt && record.activeWorkStartedAt), "INVARIANT_VIOLATION", "invariant", "In Progress Work Orders must have current active work timing."));
    rules.push(rule("WO_PROGRESS_HAS_ASSIGNEE", Boolean(record.assignedUserId), "INVARIANT_VIOLATION", "assignment", "In Progress Work Orders must have an assigned person."));
  }
  if (record.status === "ON_HOLD") {
    rules.push(rule("WO_HOLD_NO_ACTIVE_TIME", !record.activeWorkStartedAt, "INVARIANT_VIOLATION", "invariant", "On Hold Work Orders cannot have an active work period."));
    rules.push(rule("WO_HOLD_HAS_REASON", Boolean(record.waitingSince && record.waitingReasonCategory && record.waitingReasonText), "INVARIANT_VIOLATION", "invariant", "On Hold Work Orders must have waiting metadata."));
  }
  if (record.status === "AWAITING_PARTS") {
    rules.push(rule("WO_PARTS_HAS_METADATA", Boolean(record.waitingSince && record.waitingReasonText && record.partsSummary), "INVARIANT_VIOLATION", "invariant", "Awaiting Parts Work Orders must record parts and waiting reason."));
  }
  if (record.status === "AWAITING_CONTRACTOR") {
    rules.push(rule("WO_CONTRACTOR_HAS_METADATA", Boolean(record.waitingSince && record.waitingReasonText && record.contractorDetails), "INVARIANT_VIOLATION", "invariant", "Awaiting Contractor Work Orders must record contractor requirement and waiting reason."));
  }
  if (record.status === "AWAITING_ACCESS") {
    rules.push(rule("WO_ACCESS_HAS_METADATA", Boolean(record.waitingSince && record.waitingReasonText && record.accessIssue), "INVARIANT_VIOLATION", "invariant", "Awaiting Access Work Orders must record access issue and waiting reason."));
  }
  if (record.assignedAt && record.acceptedAt) rules.push(rule("WO_ACCEPTED_AFTER_ASSIGNED", dateMs(record.acceptedAt)! >= dateMs(record.assignedAt)!, "DATE_INVALID", "invariant", "Acceptance cannot be before assignment."));
  if (record.acceptedAt && record.startedAt) rules.push(rule("WO_STARTED_AFTER_ACCEPTED", dateMs(record.startedAt)! >= dateMs(record.acceptedAt)!, "DATE_INVALID", "invariant", "Start time cannot be before acceptance."));
  return rules;
}

export function calculateAutomaticChanges(record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput, context: WorkOrderWorkflowContext, now: string): Partial<MaintenanceWorkOrder> {
  switch (input.action) {
    case "ASSIGN":
      return assignmentChanges(record, input, context, now);
    case "SELF_ASSIGN":
      return assignmentChanges(record, { ...input, assignedUserId: context.currentUser.id }, context, now);
    case "REASSIGN":
      return {
        ...assignmentChanges(record, input, context, now),
        acceptedAt: undefined,
        acceptedByUserId: undefined,
        responseAchievedAt: record.responseAchievedAt,
        activeWorkStartedAt: undefined,
      };
    case "UNASSIGN":
      return {
        status: "OPEN",
        assignedUserId: undefined,
        assignedTeamId: undefined,
        supervisorUserId: undefined,
        assignedAt: undefined,
        assignedByUserId: undefined,
        acceptedAt: undefined,
        acceptedByUserId: undefined,
        activeWorkStartedAt: undefined,
      };
    case "ACCEPT": {
      const teamOnly = !record.assignedUserId && record.assignedTeamId;
      return {
        status: "ACCEPTED",
        assignedUserId: teamOnly ? context.currentUser.id : record.assignedUserId,
        acceptedAt: now,
        acceptedByUserId: context.currentUser.id,
        responseAchievedAt: record.responseAchievedAt || now,
      };
    }
    case "START":
      return {
        status: "IN_PROGRESS",
        startedAt: record.startedAt || now,
        activeWorkStartedAt: now,
      };
    case "PAUSE":
    case "AWAIT_PARTS":
    case "AWAIT_CONTRACTOR":
    case "AWAIT_ACCESS":
      return waitingChanges(record, input, now, targetStatus(input.action));
    case "RESUME":
      return {
        status: "IN_PROGRESS",
        waitingSince: undefined,
        totalWaitingMs: elapsedTotal(record.totalWaitingMs, record.waitingSince, now),
        resumedAt: now,
        activeWorkStartedAt: now,
        waitingResolutionNote: reasonText(input),
      };
    case "COMPLETE":
      return {
        status: input.completionVerificationRequired ? "VERIFICATION_REQUIRED" : "COMPLETED",
        completedAt: now,
        completedByUserId: context.currentUser.id,
        completionSummary: clean(input.reason),
        verificationRequired: Boolean(input.completionVerificationRequired || record.verificationRequired),
        activeWorkStartedAt: undefined,
        totalActiveWorkMs: elapsedTotal(record.totalActiveWorkMs, record.activeWorkStartedAt, now),
      };
  }
}

function validateDateRules(record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput, now: string): WorkflowRuleResult[] {
  const rules: WorkflowRuleResult[] = [];
  const nowMs = new Date(now).getTime();
  const waitingStart = record.waitingSince ? new Date(record.waitingSince).getTime() : nowMs;
  const expectedAvailability = dateMs(input.expectedAvailabilityAt);
  const expectedAttendance = dateMs(input.expectedAttendanceAt);
  const nextAccess = dateMs(input.nextAccessAttemptAt);
  if (expectedAvailability) rules.push(rule("WO_PARTS_DATE_FUTURE", expectedAvailability >= waitingStart, "DATE_INVALID", "expectedAvailabilityAt", "Expected parts availability cannot be before the waiting start time."));
  if (expectedAvailability) rules.push(rule("WO_PARTS_DATE_NOT_PAST", expectedAvailability >= nowMs - 60_000, "DATE_INVALID", "expectedAvailabilityAt", "Expected parts availability cannot be in the past."));
  if (expectedAttendance) rules.push(rule("WO_CONTRACTOR_DATE_FUTURE", expectedAttendance >= waitingStart, "DATE_INVALID", "expectedAttendanceAt", "Expected contractor attendance cannot be before the waiting start time."));
  if (expectedAttendance) rules.push(rule("WO_CONTRACTOR_DATE_NOT_PAST", expectedAttendance >= nowMs - 60_000, "DATE_INVALID", "expectedAttendanceAt", "Expected contractor attendance cannot be in the past."));
  if (nextAccess) rules.push(rule("WO_ACCESS_DATE_FUTURE", nextAccess >= waitingStart, "DATE_INVALID", "nextAccessAttemptAt", "Next access attempt cannot be before the waiting start time."));
  if (nextAccess) rules.push(rule("WO_ACCESS_DATE_NOT_PAST", nextAccess >= nowMs - 60_000, "DATE_INVALID", "nextAccessAttemptAt", "Next access attempt cannot be in the past."));
  return rules;
}

function assignmentChanges(_record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput, context: WorkOrderWorkflowContext, now: string): Partial<MaintenanceWorkOrder> {
  return {
    status: "ASSIGNED",
    assignedUserId: clean(input.assignedUserId),
    assignedTeamId: clean(input.assignedTeamId),
    supervisorUserId: clean(input.supervisorUserId),
    assignedAt: now,
    assignedByUserId: context.currentUser.id,
  };
}

function waitingChanges(record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput, now: string, status: Extract<MaintenanceWorkOrderStatus, "ON_HOLD" | "AWAITING_PARTS" | "AWAITING_CONTRACTOR" | "AWAITING_ACCESS">): Partial<MaintenanceWorkOrder> {
  return {
    status,
    activeWorkStartedAt: undefined,
    totalActiveWorkMs: elapsedTotal(record.totalActiveWorkMs, record.activeWorkStartedAt, now),
    pausedAt: status === "ON_HOLD" ? now : record.pausedAt,
    waitingSince: now,
    waitingReasonCategory: status === "ON_HOLD" ? input.holdReason : status,
    waitingReasonText: clean(input.reason),
    partsSummary: status === "AWAITING_PARTS" ? clean(input.partsSummary) : record.partsSummary,
    expectedAvailabilityAt: status === "AWAITING_PARTS" ? input.expectedAvailabilityAt : record.expectedAvailabilityAt,
    contractorDetails: status === "AWAITING_CONTRACTOR" ? clean(input.contractorDetails) : record.contractorDetails,
    expectedAttendanceAt: status === "AWAITING_CONTRACTOR" ? input.expectedAttendanceAt : record.expectedAttendanceAt,
    accessIssue: status === "AWAITING_ACCESS" ? input.accessIssue : record.accessIssue,
    nextAccessAttemptAt: status === "AWAITING_ACCESS" ? input.nextAccessAttemptAt : record.nextAccessAttemptAt,
  };
}

function workflowValidationError(validation: WorkOrderWorkflowValidationResult, record: MaintenanceWorkOrder, input: WorkOrderWorkflowInput) {
  const first = validation.errors[0];
  return new WorkOrderWorkflowError(first?.code || "VALIDATION_ERROR", first?.message || "Unable to complete this Work Order action.", validation.errors, {
    currentStatus: record.status,
    attemptedAction: input.action,
    workOrderId: record.id,
    version: record.version,
  });
}

function validateUserRules(record: MaintenanceWorkOrder, users: UserProfile[], userId: string, field: "assignedUserId" | "supervisorUserId"): WorkflowRuleResult[] {
  const user = users.find((item) => item.id === userId);
  return [
    rule(`WO_${field}_EXISTS`, Boolean(user), "INVALID_ASSIGNEE", field, "The selected person is not available for this Care Home."),
    rule(`WO_${field}_ACTIVE`, Boolean(user?.status === "active"), "INVALID_ASSIGNEE", field, "The selected person is no longer active."),
    rule(`WO_${field}_HOME_SCOPE`, Boolean(user && userInHome(user, record.homeId)), "OUT_OF_SCOPE", field, "The selected person is outside this Care Home."),
  ];
}

function validateCurrentAssignee(record: MaintenanceWorkOrder, users: UserProfile[]) {
  if (!record.assignedUserId) return [];
  return validateUserRules(record, users, record.assignedUserId, "assignedUserId");
}

function canAccept(record: MaintenanceWorkOrder, context: WorkOrderWorkflowContext) {
  if (record.assignedUserId === context.currentUser.id) return true;
  if (!record.assignedUserId && record.assignedTeamId && context.canAccess("maintenance.work_orders.accept_team_work", { nursingHomeId: record.homeId })) return true;
  return context.canAccess("maintenance.work_orders.accept_on_behalf", { nursingHomeId: record.homeId });
}

function isWorkerOrSupervisor(record: MaintenanceWorkOrder, context: WorkOrderWorkflowContext) {
  if (record.assignedUserId === context.currentUser.id) return true;
  if (record.supervisorUserId === context.currentUser.id) return true;
  return context.canAccess("maintenance.work_orders.reassign", { nursingHomeId: record.homeId });
}

function hasAssignment(record: MaintenanceWorkOrder) {
  return Boolean(record.assignedUserId || record.assignedTeamId);
}

function hasImmediateControls(record: MaintenanceWorkOrder) {
  return Boolean(record.immediateControlSummary?.trim() || record.riskAssessment?.controlMeasures?.trim());
}

function requiresReason(record: MaintenanceWorkOrder, action: WorkOrderWorkflowAction) {
  return action === "REASSIGN" && (record.status !== "OPEN" || record.priority === "HIGH" || record.priority === "CRITICAL");
}

function hasReason(value: string | undefined, min: number) {
  return Boolean(value?.trim() && value.trim().length >= min);
}

function elapsedTotal(current: number | undefined, start: string | undefined, now: string) {
  if (!start) return current || 0;
  return (current || 0) + Math.max(0, new Date(now).getTime() - new Date(start).getTime());
}

function workflowSnapshot(record: MaintenanceWorkOrder, users: UserProfile[], action?: WorkOrderWorkflowAction) {
  return {
    workOrderId: record.id,
    workOrderNumber: record.workOrderNumber,
    organisationId: record.organisationId || record.providerId || record.enterpriseId,
    homeId: record.homeId,
    action,
    status: record.status,
    priority: record.priority,
    riskLevel: riskLevel(record),
    assignedUserId: record.assignedUserId,
    assignedTeamId: record.assignedTeamId,
    supervisorUserId: record.supervisorUserId,
    assignedTo: workOrderAssigneeLabel(record, users),
    assignedAt: record.assignedAt,
    acceptedAt: record.acceptedAt,
    startedAt: record.startedAt,
    waitingSince: record.waitingSince,
    waitingReasonCategory: record.waitingReasonCategory,
    waitingReasonText: record.waitingReasonText,
    responseAchievedAt: record.responseAchievedAt,
    activeWorkStartedAt: record.activeWorkStartedAt,
    totalActiveWorkMs: record.totalActiveWorkMs,
    totalWaitingMs: record.totalWaitingMs,
    version: record.version,
    occurredAt: record.updatedAt,
  };
}

function auditAction(action: WorkOrderWorkflowAction) {
  const actions: Record<WorkOrderWorkflowAction, string> = {
    ASSIGN: "WORK_ORDER_ASSIGNED",
    REASSIGN: "WORK_ORDER_REASSIGNED",
    UNASSIGN: "WORK_ORDER_UNASSIGNED",
    SELF_ASSIGN: "WORK_ORDER_ASSIGNED",
    ACCEPT: "WORK_ORDER_ACCEPTED",
    START: "WORK_ORDER_STARTED",
    PAUSE: "WORK_ORDER_PAUSED",
    AWAIT_PARTS: "WORK_ORDER_AWAITING_PARTS",
    AWAIT_CONTRACTOR: "WORK_ORDER_AWAITING_CONTRACTOR",
    AWAIT_ACCESS: "WORK_ORDER_AWAITING_ACCESS",
    RESUME: "WORK_ORDER_RESUMED",
    COMPLETE: "WORK_ORDER_COMPLETED",
  };
  return actions[action];
}

function workflowCapability(action: WorkOrderWorkflowAction) {
  const capabilities: Record<WorkOrderWorkflowAction, string> = {
    ASSIGN: "maintenance.work_orders.assign",
    REASSIGN: "maintenance.work_orders.reassign",
    UNASSIGN: "maintenance.work_orders.unassign",
    SELF_ASSIGN: "maintenance.work_orders.assign_self",
    ACCEPT: "maintenance.work_orders.accept",
    START: "maintenance.work_orders.start",
    PAUSE: "maintenance.work_orders.pause",
    AWAIT_PARTS: "maintenance.work_orders.await_parts",
    AWAIT_CONTRACTOR: "maintenance.work_orders.await_contractor",
    AWAIT_ACCESS: "maintenance.work_orders.await_access",
    RESUME: "maintenance.work_orders.resume",
    COMPLETE: "maintenance.work_orders.complete",
  };
  return capabilities[action];
}

function targetStatus(action: WorkOrderWorkflowAction): Extract<MaintenanceWorkOrderStatus, "ON_HOLD" | "AWAITING_PARTS" | "AWAITING_CONTRACTOR" | "AWAITING_ACCESS"> {
  if (action === "AWAIT_PARTS") return "AWAITING_PARTS";
  if (action === "AWAIT_CONTRACTOR") return "AWAITING_CONTRACTOR";
  if (action === "AWAIT_ACCESS") return "AWAITING_ACCESS";
  return "ON_HOLD";
}

function riskLevel(record: MaintenanceWorkOrder): MaintenanceRiskLevel | undefined {
  return record.riskAssessment?.manualOverrideLevel || record.riskAssessment?.calculatedLevel || record.riskLevel;
}

function rule(ruleId: string, passed: boolean, code: WorkOrderWorkflowErrorCode, field: WorkflowRuleResult["field"], message: string, severity: WorkflowRuleResult["severity"] = "ERROR"): WorkflowRuleResult {
  return { ruleId, passed, code, field, message, severity };
}

function error(code: WorkOrderWorkflowErrorCode, field: WorkflowValidationIssue["field"], message: string): WorkflowValidationIssue {
  return { code, field, message, severity: "ERROR" };
}

function result(
  errors: WorkflowValidationIssue[],
  warnings: WorkflowValidationIssue[],
  info: WorkflowValidationIssue[],
  rules: WorkflowRuleResult[],
  calculatedChanges: Partial<MaintenanceWorkOrder> = {},
): WorkOrderWorkflowValidationResult {
  return { valid: errors.length === 0, errors, warnings, info, calculatedChanges, rules };
}

function reasonText(input: WorkOrderWorkflowInput) {
  return clean(input.reason) || clean(input.note);
}

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function userInHome(user: UserProfile, homeId: string) {
  const homes = user.facilityIds || (user.facilityId ? [user.facilityId] : []);
  return homes.length === 0 || homes.includes(homeId);
}

function dateMs(value?: string) {
  if (!value) return undefined;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? undefined : time;
}

function escalation(
  escalationType: WorkOrderEscalationResult["escalationType"],
  severity: WorkOrderEscalationResult["severity"],
  triggered: boolean,
  triggerAt: string | undefined,
  reason: string,
  workOrder: MaintenanceWorkOrder,
  base: Pick<WorkOrderEscalationResult, "workOrderId" | "organisationId" | "homeId">,
): WorkOrderEscalationResult {
  return {
    escalationType,
    severity,
    triggered,
    triggerAt,
    reason,
    ...base,
    metadata: {
      status: workOrder.status,
      priority: workOrder.priority,
      riskLevel: riskLevel(workOrder),
      assignedUserId: workOrder.assignedUserId,
      assignedTeamId: workOrder.assignedTeamId,
    },
  };
}
