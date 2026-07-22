import assert from "node:assert/strict";
import test from "node:test";
import type { HousekeepingException, HousekeepingTask, HousekeepingTaskResponse, HousekeepingTemplate, MaintenanceAsset, RoomReadinessRecord } from "../../lib/care/types.ts";
import {
  cleaningTypeLabel,
  evaluateHousekeepingTask,
  housekeepingDashboardMetrics,
  housekeepingDueStatus,
  nextHousekeepingDueDate,
  roomReadinessBlockers,
  validateHousekeepingSchedule,
  validateHousekeepingTemplate,
} from "./housekeeping.ts";

test("housekeeping labels and recurrence are stable", () => {
  assert.equal(cleaningTypeLabel("TERMINAL"), "Terminal Cleaning");
  assert.equal(nextHousekeepingDueDate("2026-07-22", "daily", 1), "2026-07-23");
  assert.equal(nextHousekeepingDueDate("2026-07-22", "weekly", 2), "2026-08-05");
});

test("template and schedule validation blocks incomplete setup", () => {
  assert.equal(validateHousekeepingTemplate({ name: "", code: "", cleaningType: "ROUTINE" }).valid, false);
  const inactiveTemplate = template({ active: false, status: "INACTIVE" });
  const result = validateHousekeepingSchedule({ homeId: "home-1", templateId: inactiveTemplate.id, locationLabel: "Room 1", frequencyType: "daily", frequencyInterval: 1, nextDueDate: "2026-07-22" }, { templates: [inactiveTemplate], assets: [] });
  assert.equal(result.valid, false);
  assert.equal(result.fieldErrors.templateId, "Select an active cleaning template.");
});

test("task completion enforces mandatory checklist, evidence, exceptions and declaration", () => {
  const task = housekeepingTask({ photoEvidenceRequired: true, minimumPhotoCount: 1, cleanerDeclarationAccepted: false });
  const blocked = evaluateHousekeepingTask({
    task,
    responses: [response({ mandatory: true, result: "UNANSWERED" }), response({ id: "r2", result: "FAIL", failureRequiresObservation: true, failureRequiresException: true })],
    evidence: [],
    exceptions: [],
  });
  assert.equal(blocked.canComplete, false);
  assert.ok(blocked.blockers.some((item) => item.includes("Complete mandatory item")));
  assert.ok(blocked.blockers.some((item) => item.includes("Create exception")));
  assert.ok(blocked.blockers.includes("Accept the cleaner declaration."));
});

test("failed checklist with recorded exception produces failed outcome", () => {
  const task = housekeepingTask({ cleanerDeclarationAccepted: true });
  const failed = evaluateHousekeepingTask({
    task,
    responses: [response({ result: "FAIL", observation: "Damaged bin", failureRequiresObservation: true, failureRequiresException: true })],
    evidence: [],
    exceptions: [exception({ severity: "LOW", status: "RESOLVED" })],
  });
  assert.equal(failed.canComplete, true);
  assert.equal(failed.overallResult, "FAIL");
  assert.equal(failed.nextStatus, "FAILED");
});

test("room readiness blocks ready state when operational blockers remain", () => {
  const blockers = roomReadinessBlockers({
    readiness: readiness({ cleaningRequired: true, cleaningCompleted: false, linenReady: false }),
    tasks: [],
    inspections: [],
    exceptions: [exception({ roomId: "room-1", status: "OPEN" })],
    workOrders: [],
  });
  assert.ok(blockers.includes("Cleaning is not complete."));
  assert.ok(blockers.includes("Linen is not ready."));
  assert.ok(blockers.includes("Open housekeeping exceptions remain."));
});

test("dashboard metrics count active, failed and completed housekeeping work", () => {
  assert.equal(housekeepingDueStatus(housekeepingTask({ dueDate: "2026-07-21", dueTime: "09:00", status: "ASSIGNED" }), new Date("2026-07-22T09:00:00.000Z")), "OVERDUE");
  const metrics = housekeepingDashboardMetrics({
    templates: [template()],
    schedules: [{ id: "s1", tenantId: "tenant", homeId: "home-1", templateId: "t1", scheduleName: "Daily room cleaning", cleaningType: "ROUTINE", frequencyType: "daily", frequencyInterval: 1, startDate: "2026-07-22", nextDueDate: "2026-07-22", assignedTeamId: "housekeeping", priority: "MEDIUM", generateDaysBeforeDue: 1, dueSoonHours: 4, active: true, paused: false, createdBy: "Test", createdAt: "2026-07-22T08:00:00.000Z" }],
    tasks: [housekeepingTask({ status: "COMPLETED", completedAt: "2026-07-22T10:00:00.000Z" }), housekeepingTask({ id: "task-2", status: "FAILED" })],
    exceptions: [exception({ status: "OPEN", severity: "HIGH" })],
    inspections: [{ id: "qi-1", tenantId: "tenant", homeId: "home-1", taskId: "task-2", status: "FAILED", failedItemCount: 1, photoEvidenceRequired: true, reinspectionRequired: true, createdAt: "2026-07-22T08:00:00.000Z", updatedAt: "2026-07-22T08:00:00.000Z", version: 1 }],
    audits: [],
    readiness: [readiness({ readinessStatus: "FAILED_INSPECTION" })],
    today: new Date("2026-07-22T09:00:00.000Z"),
  });
  assert.equal(metrics.activeTemplates, 1);
  assert.equal(metrics.failed, 1);
  assert.equal(metrics.completedToday, 1);
  assert.equal(metrics.openExceptions, 1);
  assert.equal(metrics.roomBlocked, 1);
});

function template(overrides: Partial<HousekeepingTemplate> = {}): HousekeepingTemplate {
  return {
    id: "t1",
    tenantId: "tenant",
    homeId: "home-1",
    name: "Daily bedroom clean",
    code: "HK-001",
    cleaningType: "ROUTINE",
    estimatedDurationMinutes: 30,
    defaultFrequencyType: "daily",
    defaultFrequencyInterval: 1,
    defaultPriority: "MEDIUM",
    photoEvidenceRequired: false,
    minimumPhotoCount: 0,
    qualityInspectionRequired: false,
    roomReadinessRequired: false,
    verificationRequired: false,
    supervisorSignOffRequired: false,
    active: true,
    status: "ACTIVE",
    version: 1,
    createdBy: "Test",
    createdAt: "2026-07-22T08:00:00.000Z",
    ...overrides,
  };
}

function housekeepingTask(overrides: Partial<HousekeepingTask> = {}): HousekeepingTask {
  return {
    id: "task-1",
    tenantId: "tenant",
    homeId: "home-1",
    templateId: "t1",
    templateVersion: 1,
    taskNumber: "HK-2026-0001",
    cleaningType: "ROUTINE",
    title: "Room clean",
    plannedDate: "2026-07-22",
    dueDate: "2026-07-22",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    qualityInspectionRequired: false,
    roomReadinessRequired: false,
    photoEvidenceRequired: false,
    minimumPhotoCount: 0,
    verificationRequired: false,
    overallResult: "NOT_COMPLETED",
    version: 1,
    createdBy: "Test",
    createdAt: "2026-07-22T08:00:00.000Z",
    ...overrides,
  };
}

function response(overrides: Partial<HousekeepingTaskResponse> = {}): HousekeepingTaskResponse {
  return {
    id: "r1",
    taskId: "task-1",
    templateItemId: "i1",
    sectionNameSnapshot: "Cleaning",
    questionLabelSnapshot: "Waste removed",
    responseType: "PASS_FAIL_NA",
    result: "PASS",
    failureSeverity: "MEDIUM",
    displayOrder: 1,
    mandatory: true,
    failureRequiresObservation: false,
    failureRequiresPhoto: false,
    failureRequiresException: false,
    notApplicableReasonRequired: false,
    ...overrides,
  };
}

function exception(overrides: Partial<HousekeepingException> = {}): HousekeepingException {
  return {
    id: "ex-1",
    tenantId: "tenant",
    homeId: "home-1",
    taskId: "task-1",
    roomId: "room-1",
    exceptionType: "CLEANING",
    category: "Cleaning issue",
    description: "Issue",
    severity: "MEDIUM",
    status: "OPEN",
    requiresSupervisorReview: false,
    requiresMaintenanceWorkOrder: false,
    requiresReinspection: false,
    reportedBy: "Test",
    reportedAt: "2026-07-22T08:00:00.000Z",
    createdAt: "2026-07-22T08:00:00.000Z",
    updatedAt: "2026-07-22T08:00:00.000Z",
    ...overrides,
  };
}

function readiness(overrides: Partial<RoomReadinessRecord> = {}): RoomReadinessRecord {
  return {
    id: "rr-1",
    tenantId: "tenant",
    homeId: "home-1",
    roomId: "room-1",
    readinessStatus: "CLEANING_REQUIRED",
    triggerType: "test",
    cleaningRequired: true,
    cleaningCompleted: false,
    qualityInspectionRequired: false,
    qualityInspectionPassed: false,
    maintenanceIssueOpen: false,
    linenReady: true,
    wasteCleared: true,
    suppliesReady: true,
    lastUpdatedBy: "Test",
    lastUpdatedAt: "2026-07-22T08:00:00.000Z",
    ...overrides,
  };
}

void assert;
