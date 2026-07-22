import assert from "node:assert/strict";
import test from "node:test";
import type { MaintenanceWorkOrder, UserProfile } from "../../lib/care/types.ts";
import {
  WorkOrderWorkflowError,
  applyWorkOrderWorkflow,
  evaluateWorkOrderEscalations,
  validateWorkflowAction,
  type WorkOrderWorkflowAction,
  type WorkOrderWorkflowContext,
  type WorkOrderWorkflowInput,
} from "./workOrderWorkflow.ts";

const now = "2026-07-22T09:00:00.000Z";
const hourAgo = "2026-07-22T08:00:00.000Z";

const manager = user("U-MANAGER", "Morgan Manager", "don", ["home-1"]);
const worker = user("U-WORKER", "Wendy Worker", "maintenance", ["home-1"]);
const supervisor = user("U-SUPERVISOR", "Sam Supervisor", "maintenance", ["home-1"]);
const otherHomeWorker = user("U-OTHER", "Ollie Other", "maintenance", ["home-2"]);

const allCapabilities = [
  "maintenance.work_orders.assign",
  "maintenance.work_orders.assign_self",
  "maintenance.work_orders.reassign",
  "maintenance.work_orders.unassign",
  "maintenance.work_orders.accept",
  "maintenance.work_orders.accept_team_work",
  "maintenance.work_orders.accept_on_behalf",
  "maintenance.work_orders.start",
  "maintenance.work_orders.pause",
  "maintenance.work_orders.await_parts",
  "maintenance.work_orders.await_contractor",
  "maintenance.work_orders.await_access",
  "maintenance.work_orders.resume",
];

test("workflow progresses through assign, accept, start, pause and resume with audit snapshots", () => {
  const context = ctx(manager);
  const assigned = mustApply(openOrder(), { action: "ASSIGN", assignedUserId: worker.id }, context);
  assert.equal(assigned.record.status, "ASSIGNED");
  assert.equal(assigned.record.assignedUserId, worker.id);
  assert.equal(assigned.record.version, 2);
  assert.equal(assigned.auditAction, "WORK_ORDER_ASSIGNED");

  const accepted = mustApply(assigned.record, { action: "ACCEPT" }, ctx(worker));
  assert.equal(accepted.record.status, "ACCEPTED");
  assert.equal(accepted.record.acceptedByUserId, worker.id);
  assert.equal(accepted.record.responseAchievedAt, now);

  const started = mustApply(accepted.record, { action: "START" }, ctx(worker));
  assert.equal(started.record.status, "IN_PROGRESS");
  assert.equal(started.record.startedAt, now);
  assert.equal(started.record.activeWorkStartedAt, now);

  const paused = mustApply(
    { ...started.record, activeWorkStartedAt: hourAgo, version: started.record.version },
    { action: "PAUSE", holdReason: "safety", reason: "Resident area needs safety controls before continuing" },
    ctx(worker),
  );
  assert.equal(paused.record.status, "ON_HOLD");
  assert.equal(paused.record.activeWorkStartedAt, undefined);
  assert.equal(paused.record.totalActiveWorkMs, 3_600_000);
  assert.equal(paused.record.waitingReasonCategory, "safety");

  const resumed = mustApply(paused.record, { action: "RESUME", note: "Controls confirmed and work can resume" }, ctx(worker));
  assert.equal(resumed.record.status, "IN_PROGRESS");
  assert.equal(resumed.record.waitingResolutionNote, "Controls confirmed and work can resume");
  assert.equal(resumed.record.totalWaitingMs, 0);
});

test("assignment business rules reject missing, same, inactive and out-of-home assignees", () => {
  assertWorkflowError(openOrder(), { action: "ASSIGN" }, ctx(manager), "ASSIGNMENT_REQUIRED");
  const assigned = mustApply(openOrder(), { action: "ASSIGN", assignedUserId: worker.id }, ctx(manager)).record;
  assertWorkflowError(assigned, { action: "REASSIGN", assignedUserId: worker.id, reason: "same person" }, ctx(manager), "VALIDATION_ERROR");
  assertWorkflowError(openOrder(), { action: "ASSIGN", assignedUserId: otherHomeWorker.id }, ctx(manager), "OUT_OF_SCOPE");
  assertWorkflowError(openOrder(), { action: "ASSIGN", assignedUserId: "U-INACTIVE" }, ctx(manager), "INVALID_ASSIGNEE");
});

test("invalid transitions are blocked before data changes", () => {
  assertWorkflowError(openOrder(), { action: "START" }, ctx(worker), "INVALID_TRANSITION");
  const assigned = mustApply(openOrder(), { action: "ASSIGN", assignedUserId: worker.id }, ctx(manager)).record;
  assertWorkflowError(assigned, { action: "START" }, ctx(worker), "INVALID_TRANSITION");
  const inProgress = startedOrder();
  const awaitingParts = mustApply(inProgress, { action: "AWAIT_PARTS", partsSummary: "Replacement part", reason: "Waiting for ordered part" }, ctx(worker)).record;
  assertWorkflowError(awaitingParts, { action: "AWAIT_CONTRACTOR", contractorDetails: "External callout", reason: "Need contractor" }, ctx(worker), "INVALID_TRANSITION");
});

test("permission, home scope and version checks return stable error codes", () => {
  const assigned = assignedOrder(worker.id);
  assertWorkflowError(assigned, { action: "ACCEPT" }, ctx(supervisor, ["maintenance.work_orders.accept"]), "PERMISSION_DENIED");
  assertWorkflowError(assigned, { action: "ACCEPT" }, ctx(otherHomeWorker), "OUT_OF_SCOPE");
  assertWorkflowError(assigned, { action: "ACCEPT", expectedVersion: 99 }, ctx(worker), "STALE_VERSION", true);
});

test("risk and priority restrictions block unsafe start and waiting actions", () => {
  const medium = acceptedOrder({ priority: "MEDIUM", riskAssessment: undefined, riskLevel: undefined });
  assertWorkflowError(medium, { action: "START" }, ctx(worker), "RISK_ASSESSMENT_REQUIRED");

  const highNoControls = acceptedOrder({
    priority: "HIGH",
    riskLevel: "HIGH",
    riskAssessment: risk("HIGH", true, ""),
    immediateControlSummary: undefined,
  });
  assertWorkflowError(highNoControls, { action: "START" }, ctx(worker), "IMMEDIATE_CONTROLS_REQUIRED");

  const highWithControls = acceptedOrder({
    priority: "HIGH",
    riskLevel: "HIGH",
    riskAssessment: risk("HIGH", true, "Isolate area before work starts"),
    immediateControlSummary: "Area isolated",
  });
  assert.equal(mustApply(highWithControls, { action: "START" }, ctx(worker)).record.status, "IN_PROGRESS");

  const critical = startedOrder({
    priority: "CRITICAL",
    riskLevel: "CRITICAL",
    riskAssessment: risk("CRITICAL", true, ""),
    immediateControlSummary: undefined,
  });
  assertWorkflowError(critical, { action: "AWAIT_ACCESS", accessIssue: "room_in_use", reason: "Access not available" }, ctx(worker), "IMMEDIATE_CONTROLS_REQUIRED");
});

test("date validation prevents waiting targets in the past", () => {
  const record = startedOrder();
  assertWorkflowError(
    record,
    {
      action: "AWAIT_PARTS",
      partsSummary: "Replacement hinge",
      reason: "Waiting for replacement part",
      expectedAvailabilityAt: "2026-07-21T09:00:00.000Z",
    },
    ctx(worker),
    "DATE_INVALID",
  );
});

test("duplicate idempotency key is ignored without a second mutation", () => {
  const record = assignedOrder(worker.id, { lastWorkflowIdempotencyKey: "same-key" });
  const result = applyWorkOrderWorkflow(record, { action: "ACCEPT", expectedVersion: record.version, idempotencyKey: "same-key" }, ctx(worker));
  assert.equal(result, undefined);
});

test("validation result exposes calculated changes and field errors without throwing", () => {
  const record = openOrder();
  const validation = validateWorkflowAction({
    workOrder: record,
    payload: { action: "ASSIGN", expectedVersion: record.version, assignedTeamId: "maintenance" },
    context: ctx(manager),
  });
  assert.equal(validation.valid, true);
  assert.equal(validation.calculatedChanges.status, "ASSIGNED");
  assert.equal(validation.calculatedChanges.assignedTeamId, "maintenance");

  const invalid = validateWorkflowAction({
    workOrder: record,
    payload: { action: "ASSIGN", expectedVersion: record.version },
    context: ctx(manager),
  });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors[0].code, "ASSIGNMENT_REQUIRED");
});

test("escalation foundation returns triggers without side effects", () => {
  const critical = openOrder({
    priority: "CRITICAL",
    requiredResponseAt: "2026-07-22T08:30:00.000Z",
    dueAt: "2026-07-22T09:30:00.000Z",
  });
  const escalations = evaluateWorkOrderEscalations({ workOrder: critical, now });
  assert.equal(escalations.some((item) => item.escalationType === "WORK_ORDER_UNASSIGNED_CRITICAL"), true);
  assert.equal(escalations.some((item) => item.escalationType === "WORK_ORDER_RESPONSE_BREACHED"), true);
  assert.equal(escalations.some((item) => item.escalationType === "WORK_ORDER_COMPLETION_DUE_SOON"), true);
  assert.equal(critical.status, "OPEN");
});

function mustApply(
  record: MaintenanceWorkOrder,
  input: Omit<WorkOrderWorkflowInput, "expectedVersion">,
  context: WorkOrderWorkflowContext,
) {
  const result = applyWorkOrderWorkflow(record, { ...input, expectedVersion: record.version }, context);
  assert.ok(result);
  return result;
}

function assertWorkflowError(
  record: MaintenanceWorkOrder,
  input: Omit<WorkOrderWorkflowInput, "expectedVersion"> & { expectedVersion?: number },
  context: WorkOrderWorkflowContext,
  code: string,
  explicitVersion = false,
) {
  assert.throws(
    () => applyWorkOrderWorkflow(record, { ...input, expectedVersion: explicitVersion ? input.expectedVersion! : record.version }, context),
    (error) => error instanceof WorkOrderWorkflowError && error.code === code,
  );
}

function ctx(currentUser: UserProfile, capabilities = allCapabilities): WorkOrderWorkflowContext {
  return {
    currentUser,
    users: [manager, worker, supervisor, otherHomeWorker, user("U-INACTIVE", "Inactive Person", "maintenance", ["home-1"], "inactive")],
    canAccess: (capability) => capabilities.includes(capability),
    now,
  };
}

function user(id: string, name: string, role: string, facilityIds: string[], status: UserProfile["status"] = "active"): UserProfile {
  return {
    id,
    name,
    role: role as UserProfile["role"],
    email: `${id.toLowerCase()}@example.test`,
    phone: "",
    department: "Maintenance",
    assignedWings: [],
    employeeNumber: id,
    startDate: "2025-01-01",
    lastLogin: now,
    status,
    avatarSeed: id,
    facilityIds,
    notificationPrefs: { email: false, sms: false, inApp: true, criticalAlertsOnly: false },
  };
}

function openOrder(overrides: Partial<MaintenanceWorkOrder> = {}): MaintenanceWorkOrder {
  return {
    id: "WO-ID",
    workOrderNumber: "WO-2026-000001",
    title: "Loose handrail",
    description: "Handrail is loose near the main corridor.",
    type: "REACTIVE",
    source: "STAFF_REPORT",
    category: "GENERAL_EQUIPMENT",
    priority: "LOW",
    status: "OPEN",
    homeId: "home-1",
    nursingHomeId: "home-1",
    facilityId: "home-1",
    reportedByUserId: manager.id,
    reportedAt: "2026-07-22T07:45:00.000Z",
    residentSafetyImpact: false,
    serviceDisruption: false,
    complianceImpact: false,
    immediateRisk: false,
    verificationRequired: false,
    createdAt: "2026-07-22T07:45:00.000Z",
    createdByUserId: manager.id,
    updatedAt: "2026-07-22T07:45:00.000Z",
    updatedByUserId: manager.id,
    version: 1,
    ...overrides,
  };
}

function assignedOrder(assignedUserId: string, overrides: Partial<MaintenanceWorkOrder> = {}) {
  return openOrder({
    status: "ASSIGNED",
    assignedUserId,
    assignedAt: "2026-07-22T08:15:00.000Z",
    assignedByUserId: manager.id,
    version: 2,
    ...overrides,
  });
}

function acceptedOrder(overrides: Partial<MaintenanceWorkOrder> = {}) {
  return assignedOrder(worker.id, {
    status: "ACCEPTED",
    acceptedAt: "2026-07-22T08:30:00.000Z",
    acceptedByUserId: worker.id,
    responseAchievedAt: "2026-07-22T08:30:00.000Z",
    version: 3,
    ...overrides,
  });
}

function startedOrder(overrides: Partial<MaintenanceWorkOrder> = {}) {
  return acceptedOrder({
    status: "IN_PROGRESS",
    startedAt: "2026-07-22T08:45:00.000Z",
    activeWorkStartedAt: "2026-07-22T08:45:00.000Z",
    version: 4,
    ...overrides,
  });
}

function risk(level: "MEDIUM" | "HIGH" | "CRITICAL", requiresImmediateAction: boolean, controlMeasures: string | undefined) {
  return {
    likelihood: 4,
    consequence: level === "CRITICAL" ? 5 : level === "HIGH" ? 4 : 2,
    score: level === "CRITICAL" ? 20 : level === "HIGH" ? 16 : 8,
    calculatedLevel: level,
    requiresImmediateAction,
    vulnerablePersonAffected: true,
    essentialServiceAffected: false,
    areaRestricted: false,
    controlMeasures,
    assessedByUserId: manager.id,
    assessedAt: "2026-07-22T08:00:00.000Z",
  } satisfies MaintenanceWorkOrder["riskAssessment"];
}
