import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const vite = await createServer({
  configFile: false,
  plugins: [tsconfigPaths()],
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});
const work = await vite.ssrLoadModule("/src/domain/work/index.ts");
after(async () => vite.close());

const NOW = "2026-07-14T10:00:00.000Z";
const assignment = (patch = {}) => ({
  assignmentType: "ward",
  assignedWardId: "ward-1",
  assignmentStatus: "active",
  ...patch,
});
const item = (patch = {}) => ({
  id: "work-1",
  workType: "general_task",
  title: "Review resident record",
  source: {
    sourceType: "manual_task",
    sourceModule: "tasks",
    sourceEntityType: "task",
    sourceEntityId: "task-1",
    completionOwner: "task_service",
    recreationPolicy: "manual_only",
    createdAt: NOW,
  },
  nursingHomeId: "home-1",
  wardId: "ward-1",
  residentId: "resident-1",
  schedule: {
    scheduleType: "one_off",
    dueAt: "2026-07-14T11:00:00.000Z",
    effectiveDueAt: "2026-07-14T11:00:00.000Z",
    timeZone: "Europe/Dublin",
  },
  persistedStatus: "scheduled",
  assignment: assignment(),
  priority: "routine",
  createdAt: NOW,
  updatedAt: NOW,
  schemaVersion: 1,
  ...patch,
});
const state = (workItem = item()) => ({
  workItems: [workItem],
  workStatusTransitions: [],
  workAssignmentHistory: [],
  workExceptions: [],
  workAuditRecords: [],
  workEvents: [],
  workQueueInvalidationKeys: [],
});
const auth = (patch = {}) => ({
  userAccountId: "user-1",
  staffMemberId: "staff-1",
  roleKeys: ["NURSE"],
  authorisedNursingHomeIds: ["home-1"],
  authorisedWardIds: ["ward-1"],
  capabilities: [
    "work_item.view",
    "task.view",
    "work_assignment.assign_role",
    "work_assignment.assign_ward",
    "work_assignment.assign_person",
    "work_assignment.assign_team",
    "work_assignment.claim",
    "work_assignment.reassign",
    "work_assignment.release",
    "work_exception.defer",
    "work_exception.mark_missed",
    "work_exception.record_declined",
    "work_exception.mark_not_applicable",
    "work_exception.cancel",
    "work_exception.correct",
  ],
  sourceCapabilities: ["task.complete", "task.view"],
  ...patch,
});
const assignmentContext = (patch = {}) => ({
  auth: auth(),
  occurredAt: NOW,
  correlationId: "correlation-1",
  ...patch,
});
const exceptionContext = (patch = {}) => ({
  auth: auth(),
  recordedAt: NOW,
  correlationId: "correlation-1",
  ...patch,
});

test("legacy assignment values normalise into the canonical model", () => {
  const ward = work.normaliseLegacyWorkAssignment({
    type: "ward_queue",
    assignedWardId: "ward-1",
  });
  assert.equal(ward.assignmentType, "ward");
  assert.equal(ward.assignedWardId, "ward-1");
  assert.equal(ward.assignmentStatus, "active");
  assert.equal(
    work.normaliseLegacyWorkAssignment({ type: "self", assignedStaffMemberId: "staff-1" })
      .assignmentType,
    "person",
  );
});

test("role, ward, person and team assignments validate exactly one target", () => {
  for (const candidate of [
    assignment({ assignmentType: "role", assignedWardId: undefined, assignedRoleKey: "NURSE" }),
    assignment(),
    assignment({
      assignmentType: "person",
      assignedWardId: undefined,
      assignedStaffMemberId: "staff-1",
    }),
    assignment({ assignmentType: "team", assignedWardId: undefined, assignedTeamId: "team-1" }),
  ]) {
    const references =
      candidate.assignmentType === "team"
        ? {
            teams: [
              {
                id: "team-1",
                nursingHomeId: "home-1",
                name: "Day team",
                teamType: "clinical",
                active: true,
                memberStaffMemberIds: ["staff-1"],
                wardIds: ["ward-1"],
                createdAt: NOW,
                updatedAt: NOW,
              },
            ],
          }
        : {};
    assert.deepEqual(work.validateWorkAssignment(candidate, item(), references), []);
  }
  assert.ok(
    work
      .validateWorkAssignment(
        assignment({ assignmentType: "person", assignedStaffMemberId: "staff-1" }),
        item(),
      )
      .includes("assignment_must_have_one_target"),
  );
});

test("assignment commands append history, event, audit and queue invalidation", () => {
  const next = work.assignWorkItemToRole(state(), "work-1", "NURSE", assignmentContext(), {
    code: "clinical_allocation",
  });
  assert.equal(next.workItems[0].assignment.assignmentType, "role");
  assert.equal(next.workAssignmentHistory.length, 1);
  assert.equal(next.workEvents[0].eventType, "WorkItemAssigned");
  assert.equal(next.workAuditRecords[0].action, "assign");
  assert.deepEqual(next.workQueueInvalidationKeys, ["work-queue:home-1"]);
});

test("claim is idempotent for the claimant and rejects a concurrent claimant", () => {
  const claimed = work.claimWorkItem(state(), "work-1", assignmentContext());
  assert.equal(claimed.workItems[0].assignment.assignedStaffMemberId, "staff-1");
  assert.equal(work.claimWorkItem(claimed, "work-1", assignmentContext()), claimed);
  assert.throws(
    () =>
      work.claimWorkItem(
        claimed,
        "work-1",
        assignmentContext({
          auth: auth({ userAccountId: "user-2", staffMemberId: "staff-2" }),
        }),
      ),
    (error) => error.code === "already_assigned",
  );
});

test("releasing person-assigned or urgent work requires a reason", () => {
  const assigned = state(
    item({
      assignment: assignment({
        assignmentType: "person",
        assignedWardId: undefined,
        assignedStaffMemberId: "staff-1",
      }),
    }),
  );
  assert.throws(
    () => work.releaseWorkItem(assigned, "work-1", assignment(), assignmentContext()),
    (error) => error.code === "reason_required",
  );
  const released = work.releaseWorkItem(assigned, "work-1", assignment(), assignmentContext(), {
    code: "shift_ended",
  });
  assert.equal(released.workEvents[0].eventType, "WorkItemReleased");
});

test("assignment visibility honours role, person, team and management scope", () => {
  const context = {
    nursingHomeId: "home-1",
    wardSelectionMode: "multiple",
    wardIds: ["ward-1"],
    shiftId: "day",
    shiftStartAt: "2026-07-14T08:00:00.000Z",
    shiftEndAt: "2026-07-14T20:00:00.000Z",
    operationalDate: "2026-07-14",
    timezone: "Europe/Dublin",
    effectiveRoleKey: "NURSE",
  };
  const team = {
    id: "team-1",
    nursingHomeId: "home-1",
    name: "Day team",
    teamType: "clinical",
    active: true,
    memberStaffMemberIds: ["staff-1"],
    wardIds: ["ward-1"],
    createdAt: NOW,
    updatedAt: NOW,
  };
  const items = [
    item({
      id: "role",
      assignment: assignment({
        assignmentType: "role",
        assignedWardId: undefined,
        assignedRoleKey: "NURSE",
      }),
    }),
    item({
      id: "person",
      assignment: assignment({
        assignmentType: "person",
        assignedWardId: undefined,
        assignedStaffMemberId: "staff-1",
      }),
    }),
    item({
      id: "team",
      assignment: assignment({
        assignmentType: "team",
        assignedWardId: undefined,
        assignedTeamId: "team-1",
      }),
    }),
  ];
  const model = work.buildWorkQueueReadModel(context, auth(), {
    items,
    references: {
      residents: [
        {
          id: "resident-1",
          facilityId: "home-1",
          lifecycleStatus: "active",
          presenceStatus: "in_home",
          firstName: "A",
          lastName: "Resident",
        },
      ],
      wards: [{ id: "ward-1", nursingHomeId: "home-1", name: "Ward 1" }],
    },
    teams: [team],
    clock: { now: () => NOW },
  });
  assert.equal(model.summary.totalActive, 3);
  assert.equal(model.summary.assignedToMe, 1);
  assert.equal(model.summary.assignedToRole, 1);
  assert.equal(model.summary.assignedToTeam, 1);
});

test("unassigned work remains visible, due and claimable", () => {
  const unassigned = item({
    assignment: { assignmentType: "unassigned", assignmentStatus: "active" },
  });
  const claimed = work.claimWorkItem(state(unassigned), "work-1", assignmentContext());
  assert.equal(claimed.workItems[0].persistedStatus, "scheduled");
  assert.equal(claimed.workItems[0].assignment.assignmentType, "person");
});

test("non-matching role and team assignments cannot be claimed", () => {
  const roleState = state(
    item({
      assignment: assignment({
        assignmentType: "role",
        assignedWardId: undefined,
        assignedRoleKey: "DOCTOR",
      }),
    }),
  );
  assert.throws(
    () => work.claimWorkItem(roleState, "work-1", assignmentContext()),
    (error) => error.code === "claim_ineligible",
  );
  const teamState = state(
    item({
      assignment: assignment({
        assignmentType: "team",
        assignedWardId: undefined,
        assignedTeamId: "team-1",
      }),
    }),
  );
  assert.throws(
    () =>
      work.claimWorkItem(
        teamState,
        "work-1",
        assignmentContext({
          references: {
            teams: [
              {
                id: "team-1",
                nursingHomeId: "home-1",
                name: "Other team",
                teamType: "clinical",
                active: true,
                memberStaffMemberIds: ["staff-2"],
                createdAt: NOW,
                updatedAt: NOW,
              },
            ],
          },
        }),
      ),
    (error) => error.code === "claim_ineligible",
  );
});

test("staff access removal requeues active person work without deleting history", () => {
  const personState = state(
    item({
      assignment: assignment({
        assignmentType: "person",
        assignedWardId: undefined,
        assignedStaffMemberId: "staff-2",
      }),
    }),
  );
  const next = work.releaseInvalidPersonAssignments(
    personState,
    () =>
      assignmentContext({
        references: { personHasHomeAccess: () => false },
      }),
    () => assignment(),
  );
  assert.equal(next.workItems[0].assignment.assignmentType, "ward");
  assert.equal(next.workAssignmentHistory[0].transitionType, "expired");
  assert.equal(next.workItems[0].source.sourceEntityId, "task-1");
});

test("resident ward movement updates active projection and safely requeues invalid ownership", () => {
  const personState = state(
    item({
      assignment: assignment({
        assignmentType: "person",
        assignedWardId: undefined,
        assignedStaffMemberId: "staff-2",
      }),
    }),
  );
  const next = work.moveResidentWorkToWard(personState, "resident-1", "ward-2", () =>
    assignmentContext({
      auth: auth({ authorisedWardIds: ["ward-1", "ward-2"] }),
      references: {
        wardHomeById: new Map([["ward-2", "home-1"]]),
        personHasWardAccess: (_personId, wardId) => wardId !== "ward-2",
      },
    }),
  );
  assert.equal(next.workItems.length, 1);
  assert.equal(next.workItems[0].wardId, "ward-2");
  assert.equal(next.workItems[0].assignment.assignedWardId, "ward-2");
  assert.equal(next.workAssignmentHistory.length, 1);
});

test("deferral preserves original due time and records effective and recorded times", () => {
  const next = work.deferWorkItem(
    state(),
    "work-1",
    {
      reasonCode: "schedule_changed",
      effectiveAt: "2026-07-14T09:55:00.000Z",
      deferredUntil: "2026-07-14T12:00:00.000Z",
    },
    exceptionContext(),
  );
  assert.equal(next.workItems[0].schedule.originalDueAt, "2026-07-14T11:00:00.000Z");
  assert.equal(next.workItems[0].schedule.effectiveDueAt, "2026-07-14T12:00:00.000Z");
  assert.equal(next.workExceptions[0].recordedAt, NOW);
  assert.equal(next.workEvents[0].eventType, "WorkItemDeferred");
  assert.equal(next.workAuditRecords.length, 1);
});

test("missed work is explicit and carries follow-up and escalation details", () => {
  const next = work.markWorkItemMissed(
    state(),
    "work-1",
    {
      reasonCode: "resident_absent",
      effectiveMissedAt: "2026-07-14T09:45:00.000Z",
      followUpRequired: true,
      escalationRequired: true,
    },
    exceptionContext(),
  );
  assert.equal(next.workItems[0].persistedStatus, "missed");
  assert.equal(next.workExceptions[0].effectiveAt, "2026-07-14T09:45:00.000Z");
  assert.equal(next.workItems[0].missed.followUpRequired, true);
});

test("time passing creates overdue display only and never a missed outcome", () => {
  const overdue = item({
    schedule: {
      scheduleType: "one_off",
      dueAt: "2026-07-14T09:00:00.000Z",
      effectiveDueAt: "2026-07-14T09:00:00.000Z",
      timeZone: "Europe/Dublin",
    },
  });
  assert.equal(overdue.persistedStatus, "scheduled");
  assert.equal(overdue.latestException, undefined);
});

test("deferral without a valid date is rejected", () => {
  assert.throws(
    () =>
      work.deferWorkItem(
        state(),
        "work-1",
        {
          reasonCode: "schedule_changed",
          effectiveAt: NOW,
          deferredUntil: "",
        },
        exceptionContext(),
      ),
    (error) => error.code === "deferred_until_required",
  );
});

test("declined work records who declined and uses the work-type outcome", () => {
  const next = work.recordWorkDeclined(
    state(),
    "work-1",
    {
      reasonCode: "resident_declined",
      effectiveAt: NOW,
      declinedByType: "resident",
      declinedByName: "Resident",
      followUpRequired: true,
      escalationRequired: false,
    },
    exceptionContext(),
  );
  assert.equal(next.workItems[0].persistedStatus, "cancelled");
  assert.equal(next.workExceptions[0].exceptionType, "declined");
  assert.equal(next.workStatusTransitions[0].transitionType, "declined");
  assert.equal(next.workEvents[0].eventType, "WorkItemDeclined");
});

test("not-applicable and cancellation retain source evidence", () => {
  const notApplicable = work.markWorkItemNotApplicable(
    state(),
    "work-1",
    {
      reasonCode: "no_longer_required",
      effectiveAt: NOW,
      evidenceEntityType: "review",
      evidenceEntityId: "review-1",
    },
    exceptionContext(),
  );
  assert.equal(notApplicable.workExceptions[0].sourceEvidenceEntityId, "review-1");
  const cancelled = work.cancelWorkItem(
    state(),
    "work-1",
    {
      reasonCode: "source_cancelled",
      effectiveAt: NOW,
      sourceCancellationEntityType: "task",
      sourceCancellationEntityId: "task-1",
    },
    exceptionContext(),
  );
  assert.equal(cancelled.workExceptions[0].sourceEvidenceEntityId, "task-1");
});

test("reason catalogue requires text for other and rejects invalid work-type reasons", () => {
  assert.equal(
    work.validateWorkExceptionReason(item(), "missed", "other"),
    "other_reason_text_required",
  );
  assert.equal(
    work.validateWorkExceptionReason(
      item({ workType: "care_action" }),
      "cancelled",
      "appointment_cancelled",
    ),
    "reason_not_allowed_for_work_type",
  );
});

test("corrections are append-only and retain the original exception", () => {
  const missed = work.markWorkItemMissed(
    state(),
    "work-1",
    {
      reasonCode: "resident_absent",
      effectiveMissedAt: NOW,
      followUpRequired: false,
      escalationRequired: false,
    },
    exceptionContext(),
  );
  const corrected = work.correctWorkException(
    missed,
    missed.workExceptions[0].id,
    { correctionReason: "Corrected after review", reasonCode: "resident_asleep" },
    exceptionContext({ recordedAt: "2026-07-14T10:05:00.000Z" }),
  );
  assert.equal(corrected.workExceptions.length, 2);
  assert.equal(corrected.workExceptions[1].correctionOfExceptionId, missed.workExceptions[0].id);
  assert.equal(corrected.workAuditRecords.at(-1).action, "correct");
});

test("cross-home assignment and exception commands are rejected", () => {
  const outside = auth({ authorisedNursingHomeIds: ["home-2"] });
  assert.throws(
    () =>
      work.assignWorkItemToWard(state(), "work-1", "ward-1", assignmentContext({ auth: outside })),
    (error) => error.code === "cross_home",
  );
  assert.throws(
    () =>
      work.markWorkItemMissed(
        state(),
        "work-1",
        {
          reasonCode: "resident_absent",
          effectiveMissedAt: NOW,
          followUpRequired: false,
          escalationRequired: false,
        },
        exceptionContext({ auth: outside }),
      ),
    (error) => error.code === "cross_home",
  );
});
