import { recordAuditEvent } from "@/lib/care/auditFramework";
import { getWorkTypeHandler } from "./workHandlers";
import type {
  WorkAssignment,
  WorkAssignmentHistory,
  WorkAssignmentType,
  WorkAuthContext,
  WorkDomainEvent,
  WorkItem,
  WorkProjectionState,
  WorkTeam,
} from "./workTypes";

export interface LegacyWorkAssignment extends Omit<Partial<WorkAssignment>, "assignmentType"> {
  assignmentType?: WorkAssignmentType;
  type?: WorkAssignmentType | "ward_queue" | "self";
  assignedBy?: string;
}

export interface AssignmentReferenceData {
  wardHomeById?: Map<string, string>;
  personHasHomeAccess?: (staffOrUserId: string, nursingHomeId: string) => boolean;
  personHasWardAccess?: (staffOrUserId: string, wardId: string) => boolean;
  personHasSourceCapability?: (staffOrUserId: string, capability: string) => boolean;
  teams?: WorkTeam[];
}

export interface AssignmentServiceContext {
  auth: WorkAuthContext;
  occurredAt: string;
  correlationId: string;
  sourceEventId?: string;
  actorType?: WorkAssignmentHistory["actorType"];
  references?: AssignmentReferenceData;
}

export class WorkAssignmentError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

export function normaliseLegacyWorkAssignment(input: LegacyWorkAssignment): WorkAssignment {
  const raw = input.assignmentType || input.type || "unassigned";
  const assignmentType: WorkAssignmentType =
    raw === "ward_queue" ? "ward" : raw === "self" ? "person" : raw;
  return {
    assignmentType,
    assignedRoleKey: input.assignedRoleKey,
    assignedWardId: input.assignedWardId,
    assignedUserAccountId: input.assignedUserAccountId,
    assignedStaffMemberId: input.assignedStaffMemberId,
    assignedTeamId: input.assignedTeamId,
    assignedAt: input.assignedAt,
    assignedByUserAccountId: input.assignedByUserAccountId || input.assignedBy,
    assignedByStaffMemberId: input.assignedByStaffMemberId,
    assignmentReasonCode: input.assignmentReasonCode,
    assignmentReasonText: input.assignmentReasonText,
    targetShiftId: input.targetShiftId,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo,
    assignmentStatus: input.assignmentStatus || "active",
  };
}

export function validateWorkAssignment(
  assignment: WorkAssignment,
  item: WorkItem,
  references: AssignmentReferenceData = {},
) {
  const issues: string[] = [];
  const targets = {
    role: Boolean(assignment.assignedRoleKey),
    ward: Boolean(assignment.assignedWardId),
    person: Boolean(assignment.assignedStaffMemberId || assignment.assignedUserAccountId),
    team: Boolean(assignment.assignedTeamId),
  };
  const targetCount = Object.values(targets).filter(Boolean).length;
  if (assignment.assignmentType === "unassigned" && targetCount)
    issues.push("unassigned_has_target");
  if (assignment.assignmentType !== "unassigned" && targetCount !== 1)
    issues.push("assignment_must_have_one_target");
  if (assignment.assignmentType === "role" && !targets.role) issues.push("role_target_missing");
  if (assignment.assignmentType === "ward" && !targets.ward) issues.push("ward_target_missing");
  if (assignment.assignmentType === "person" && !targets.person)
    issues.push("person_target_missing");
  if (assignment.assignmentType === "team" && !targets.team) issues.push("team_target_missing");
  if (assignment.assignmentType !== "role" && assignment.assignedRoleKey)
    issues.push("role_target_on_wrong_type");
  if (assignment.assignmentType !== "ward" && assignment.assignedWardId)
    issues.push("ward_target_on_wrong_type");
  if (
    assignment.assignmentType !== "person" &&
    (assignment.assignedStaffMemberId || assignment.assignedUserAccountId)
  )
    issues.push("person_target_on_wrong_type");
  if (assignment.assignmentType !== "team" && assignment.assignedTeamId)
    issues.push("team_target_on_wrong_type");
  if (assignment.assignedWardId) {
    const home = references.wardHomeById?.get(String(assignment.assignedWardId));
    if (home && home !== String(item.nursingHomeId)) issues.push("ward_home_mismatch");
  }
  const personId = String(
    assignment.assignedStaffMemberId || assignment.assignedUserAccountId || "",
  );
  if (
    personId &&
    references.personHasHomeAccess &&
    !references.personHasHomeAccess(personId, String(item.nursingHomeId))
  )
    issues.push("person_home_access_missing");
  if (
    personId &&
    item.wardId &&
    references.personHasWardAccess &&
    !references.personHasWardAccess(personId, String(item.wardId))
  )
    issues.push("person_ward_access_missing");
  if (assignment.assignedTeamId) {
    const team = references.teams?.find(
      (candidate) => String(candidate.id) === String(assignment.assignedTeamId),
    );
    if (!team) issues.push("orphan_team");
    else if (!team.active) issues.push("inactive_team");
    else if (String(team.nursingHomeId) !== String(item.nursingHomeId))
      issues.push("team_home_mismatch");
    else if (
      item.wardId &&
      team.wardIds?.length &&
      !team.wardIds.map(String).includes(String(item.wardId))
    )
      issues.push("team_ward_mismatch");
  }
  if (assignment.assignmentStatus !== "active") issues.push("assignment_not_active");
  if (
    personId &&
    references.personHasSourceCapability &&
    !references.personHasSourceCapability(
      personId,
      getWorkTypeHandler(item.workType).sourceCapability,
    )
  )
    issues.push("person_source_capability_missing");
  if (
    assignment.effectiveFrom &&
    assignment.effectiveTo &&
    Date.parse(assignment.effectiveTo) <= Date.parse(assignment.effectiveFrom)
  )
    issues.push("invalid_effective_window");
  return issues;
}

const assignmentKey = (assignment: WorkAssignment) =>
  JSON.stringify({
    assignmentType: assignment.assignmentType,
    assignedRoleKey: assignment.assignedRoleKey,
    assignedWardId: assignment.assignedWardId,
    assignedUserAccountId: assignment.assignedUserAccountId,
    assignedStaffMemberId: assignment.assignedStaffMemberId,
    assignedTeamId: assignment.assignedTeamId,
    targetShiftId: assignment.targetShiftId,
    effectiveFrom: assignment.effectiveFrom,
    effectiveTo: assignment.effectiveTo,
    assignmentStatus: assignment.assignmentStatus,
  });

const activeWork = (item: WorkItem) =>
  ["scheduled", "in_progress", "deferred"].includes(item.persistedStatus);

const assertScopeAndCapability = (
  item: WorkItem,
  context: AssignmentServiceContext,
  capability: string,
) => {
  if (!activeWork(item))
    throw new WorkAssignmentError("Closed work cannot be assigned.", "work_closed");
  if (!context.auth.authorisedNursingHomeIds.includes(String(item.nursingHomeId)))
    throw new WorkAssignmentError("Cross-home assignment is prohibited.", "cross_home");
  if (item.wardId && !context.auth.authorisedWardIds.includes(String(item.wardId)))
    throw new WorkAssignmentError("Work is outside the authorised ward scope.", "cross_ward");
  if (
    context.actorType !== "system" &&
    !context.auth.capabilities.includes(capability) &&
    !context.auth.capabilities.includes("work_assignment.manage_home")
  )
    throw new WorkAssignmentError(`Missing capability: ${capability}`, "forbidden");
  const sourceCapability = getWorkTypeHandler(item.workType).sourceCapability;
  if (
    context.actorType !== "system" &&
    !context.auth.sourceCapabilities?.includes(sourceCapability) &&
    !context.auth.capabilities.includes(sourceCapability)
  )
    throw new WorkAssignmentError(
      `Missing source capability: ${sourceCapability}`,
      "source_forbidden",
    );
};

const createAssignmentEvent = (
  item: WorkItem,
  previousAssignment: WorkAssignment,
  newAssignment: WorkAssignment,
  eventType: WorkDomainEvent["eventType"],
  sequence: number,
  context: AssignmentServiceContext,
): WorkDomainEvent => ({
  eventId: `work-event:${item.id}:assignment:${sequence}`,
  eventType,
  eventVersion: 1,
  workItemId: String(item.id),
  source: item.source,
  nursingHomeId: String(item.nursingHomeId),
  wardId: item.wardId ? String(item.wardId) : undefined,
  residentId: item.residentId ? String(item.residentId) : undefined,
  occurredAt: context.occurredAt,
  actorUserAccountId: context.auth.userAccountId,
  correlationId: context.correlationId,
  causationId: context.sourceEventId,
  payload: { previousAssignment, newAssignment },
});

const applyAssignment = (
  state: WorkProjectionState,
  workItemId: string,
  requested: WorkAssignment,
  context: AssignmentServiceContext,
  capability: string,
  transitionType: WorkAssignmentHistory["transitionType"],
  eventType: WorkDomainEvent["eventType"],
) => {
  const item = state.workItems.find((candidate) => String(candidate.id) === workItemId);
  if (!item) throw new WorkAssignmentError("Work item not found.", "not_found");
  assertScopeAndCapability(item, context, capability);
  const assignment: WorkAssignment = {
    ...requested,
    assignmentStatus: requested.assignmentStatus || "active",
    assignedAt: requested.assignedAt || context.occurredAt,
    assignedByUserAccountId: requested.assignedByUserAccountId || context.auth.userAccountId,
    assignedByStaffMemberId: requested.assignedByStaffMemberId || context.auth.staffMemberId,
  };
  const issues = validateWorkAssignment(assignment, item, context.references);
  if (issues.length)
    throw new WorkAssignmentError(`Invalid assignment: ${issues.join(", ")}`, issues[0]);
  if (assignmentKey(item.assignment) === assignmentKey(assignment)) return state;
  const sequence = (state.workAssignmentHistory || []).length + 1;
  const history: WorkAssignmentHistory = {
    id: `work-assignment-history:${workItemId}:${sequence}`,
    workItemId,
    previousAssignment: item.assignment,
    newAssignment: assignment,
    transitionType,
    occurredAt: context.occurredAt,
    actorType: context.actorType || "user",
    actorUserAccountId: context.auth.userAccountId,
    actorStaffMemberId: context.auth.staffMemberId,
    reasonCode: assignment.assignmentReasonCode,
    reasonText: assignment.assignmentReasonText,
    correlationId: context.correlationId,
    sourceEventId: context.sourceEventId,
  };
  const updated: WorkItem = {
    ...item,
    assignment,
    updatedAt: context.occurredAt,
    updatedBy: context.auth.userAccountId,
  };
  const audit = recordAuditEvent({
    id: `audit-work-assignment:${workItemId}:${sequence}`,
    occurredAt: context.occurredAt,
    recordedAt: context.occurredAt,
    actorType: context.actorType === "rule" ? "system" : context.actorType || "user",
    actor: {
      userAccountId: context.auth.userAccountId,
      staffMemberId: context.auth.staffMemberId,
    },
    action: assignment.assignmentType === "unassigned" ? "unassign" : "assign",
    entityType: "work_item",
    entityId: workItemId,
    summary: `Work assignment ${transitionType.replace(/_/g, " ")}.`,
    reasonCode: assignment.assignmentReasonCode,
    reasonText: assignment.assignmentReasonText,
    scope: {
      nursingHomeId: String(item.nursingHomeId),
      wardId: item.wardId ? String(item.wardId) : undefined,
      residentId: item.residentId ? String(item.residentId) : undefined,
    },
    correlationId: context.correlationId,
    metadata: { previousAssignment: item.assignment, newAssignment: assignment },
  });
  const invalidationKey = `work-queue:${item.nursingHomeId}`;
  return {
    ...state,
    workItems: state.workItems.map((candidate) =>
      String(candidate.id) === workItemId ? updated : candidate,
    ),
    workAssignmentHistory: [...(state.workAssignmentHistory || []), history],
    workAuditRecords: [...(state.workAuditRecords || []), audit],
    workEvents: [
      ...(state.workEvents || []),
      createAssignmentEvent(item, item.assignment, assignment, eventType, sequence, context),
    ],
    workQueueInvalidationKeys: [
      ...new Set([...(state.workQueueInvalidationKeys || []), invalidationKey]),
    ],
  };
};

const target = (
  assignmentType: WorkAssignmentType,
  values: Partial<WorkAssignment> = {},
): WorkAssignment => ({ assignmentType, assignmentStatus: "active", ...values });

export const assignWorkItemToRole = (
  state: WorkProjectionState,
  workItemId: string,
  roleKey: string,
  context: AssignmentServiceContext,
  reason?: { code?: string; text?: string },
) =>
  applyAssignment(
    state,
    workItemId,
    target("role", {
      assignedRoleKey: roleKey,
      assignmentReasonCode: reason?.code,
      assignmentReasonText: reason?.text,
    }),
    context,
    "work_assignment.assign_role",
    "assigned",
    "WorkItemAssigned",
  );

export const assignWorkItemToWard = (
  state: WorkProjectionState,
  workItemId: string,
  wardId: string,
  context: AssignmentServiceContext,
  reason?: { code?: string; text?: string },
) =>
  applyAssignment(
    state,
    workItemId,
    target("ward", {
      assignedWardId: wardId,
      assignmentReasonCode: reason?.code,
      assignmentReasonText: reason?.text,
    }),
    context,
    "work_assignment.assign_ward",
    "assigned",
    "WorkItemAssigned",
  );

export const assignWorkItemToPerson = (
  state: WorkProjectionState,
  workItemId: string,
  person: { staffMemberId?: string; userAccountId?: string },
  context: AssignmentServiceContext,
  reason?: { code?: string; text?: string },
) =>
  applyAssignment(
    state,
    workItemId,
    target("person", {
      assignedStaffMemberId: person.staffMemberId,
      assignedUserAccountId: person.userAccountId,
      assignmentReasonCode: reason?.code,
      assignmentReasonText: reason?.text,
    }),
    context,
    "work_assignment.assign_person",
    "assigned",
    "WorkItemAssigned",
  );

export const assignWorkItemToTeam = (
  state: WorkProjectionState,
  workItemId: string,
  teamId: string,
  context: AssignmentServiceContext,
  reason?: { code?: string; text?: string },
) =>
  applyAssignment(
    state,
    workItemId,
    target("team", {
      assignedTeamId: teamId,
      assignmentReasonCode: reason?.code,
      assignmentReasonText: reason?.text,
    }),
    context,
    "work_assignment.assign_team",
    "assigned",
    "WorkItemAssigned",
  );

export const moveWorkItemToUnassignedQueue = (
  state: WorkProjectionState,
  workItemId: string,
  context: AssignmentServiceContext,
  reason: { code: string; text?: string },
) =>
  applyAssignment(
    state,
    workItemId,
    target("unassigned", {
      assignmentReasonCode: reason.code,
      assignmentReasonText: reason.text,
    }),
    context,
    "work_assignment.reassign",
    "unassigned",
    "WorkItemUnassigned",
  );

export function claimWorkItem(
  state: WorkProjectionState,
  workItemId: string,
  context: AssignmentServiceContext,
) {
  const item = state.workItems.find((candidate) => String(candidate.id) === workItemId);
  if (!item) throw new WorkAssignmentError("Work item not found.", "not_found");
  const current = item.assignment;
  if (current.assignmentType === "person") {
    if (
      (context.auth.staffMemberId &&
        current.assignedStaffMemberId === context.auth.staffMemberId) ||
      current.assignedUserAccountId === context.auth.userAccountId
    )
      return state;
    throw new WorkAssignmentError("Work item has already been claimed.", "already_assigned");
  }
  if (current.assignmentStatus !== "active")
    throw new WorkAssignmentError("Assignment is not active.", "assignment_inactive");
  if (
    current.assignmentType === "role" &&
    !context.auth.roleKeys.includes(String(current.assignedRoleKey))
  )
    throw new WorkAssignmentError("Current role assignment is not claimable.", "claim_ineligible");
  if (
    current.assignmentType === "ward" &&
    !context.auth.authorisedWardIds.includes(String(current.assignedWardId))
  )
    throw new WorkAssignmentError("Current ward assignment is not claimable.", "claim_ineligible");
  if (current.assignmentType === "team") {
    const team = context.references?.teams?.find(
      (candidate) => String(candidate.id) === String(current.assignedTeamId),
    );
    if (
      !team?.active ||
      !context.auth.staffMemberId ||
      !team.memberStaffMemberIds.map(String).includes(String(context.auth.staffMemberId))
    )
      throw new WorkAssignmentError(
        "Current team assignment is not claimable.",
        "claim_ineligible",
      );
  }
  return applyAssignment(
    state,
    workItemId,
    target("person", {
      assignedStaffMemberId: context.auth.staffMemberId,
      assignedUserAccountId: context.auth.userAccountId,
      assignmentReasonCode: "claimed",
    }),
    context,
    "work_assignment.claim",
    "claimed",
    "WorkItemClaimed",
  );
}

export const reassignWorkItem = (
  state: WorkProjectionState,
  workItemId: string,
  assignment: WorkAssignment,
  context: AssignmentServiceContext,
) =>
  applyAssignment(
    state,
    workItemId,
    assignment,
    context,
    "work_assignment.reassign",
    "reassigned",
    "WorkItemReassigned",
  );

export function releaseWorkItem(
  state: WorkProjectionState,
  workItemId: string,
  fallback: WorkAssignment,
  context: AssignmentServiceContext,
  reason?: { code?: string; text?: string },
) {
  const item = state.workItems.find((candidate) => String(candidate.id) === workItemId);
  if (!item) throw new WorkAssignmentError("Work item not found.", "not_found");
  const dueAt = item.schedule.effectiveDueAt || item.schedule.dueAt;
  const reasonRequired =
    item.assignment.assignmentType === "person" ||
    item.priority === "urgent" ||
    item.priority === "critical" ||
    Boolean(dueAt && Date.parse(dueAt) < Date.parse(context.occurredAt));
  if (reasonRequired && !reason?.code)
    throw new WorkAssignmentError("Release reason is required.", "reason_required");
  return applyAssignment(
    state,
    workItemId,
    {
      ...fallback,
      assignmentReasonCode: reason?.code,
      assignmentReasonText: reason?.text,
    },
    context,
    "work_assignment.release",
    fallback.assignmentType === "unassigned" ? "unassigned" : "reassigned",
    "WorkItemReleased",
  );
}

export const expireWorkAssignment = (
  state: WorkProjectionState,
  workItemId: string,
  fallback: WorkAssignment,
  context: AssignmentServiceContext,
) =>
  applyAssignment(
    state,
    workItemId,
    { ...fallback, assignmentReasonCode: "assignment_expired" },
    { ...context, actorType: context.actorType || "system" },
    "work_assignment.reassign",
    "expired",
    "WorkAssignmentExpired",
  );

export function releaseInvalidPersonAssignments(
  state: WorkProjectionState,
  contextFor: (item: WorkItem) => AssignmentServiceContext,
  fallbackFor: (item: WorkItem) => WorkAssignment,
) {
  return state.workItems.reduce((current, item) => {
    if (item.assignment.assignmentType !== "person" || !activeWork(item)) return current;
    const personId = String(
      item.assignment.assignedStaffMemberId || item.assignment.assignedUserAccountId || "",
    );
    const context = contextFor(item);
    if (
      personId &&
      context.references?.personHasHomeAccess?.(personId, String(item.nursingHomeId)) !== false &&
      (!item.wardId ||
        context.references?.personHasWardAccess?.(personId, String(item.wardId)) !== false)
    )
      return current;
    return expireWorkAssignment(current, String(item.id), fallbackFor(item), context);
  }, state);
}

export function moveResidentWorkToWard(
  state: WorkProjectionState,
  residentId: string,
  wardId: string,
  contextFor: (item: WorkItem) => AssignmentServiceContext,
) {
  return state.workItems.reduce((current, item) => {
    if (String(item.residentId || "") !== residentId || !activeWork(item)) return current;
    const movedItem = { ...item, wardId, updatedAt: contextFor(item).occurredAt };
    const movedState = {
      ...current,
      workItems: current.workItems.map((candidate) =>
        String(candidate.id) === String(item.id) ? movedItem : candidate,
      ),
    };
    const issues = validateWorkAssignment(
      movedItem.assignment,
      movedItem,
      contextFor(movedItem).references,
    );
    if (
      movedItem.assignment.assignmentType !== "ward" &&
      !issues.some((issue) =>
        [
          "person_ward_access_missing",
          "team_ward_mismatch",
          "person_home_access_missing",
          "orphan_team",
          "inactive_team",
        ].includes(issue),
      )
    ) {
      return {
        ...movedState,
        workQueueInvalidationKeys: [
          ...new Set([
            ...(movedState.workQueueInvalidationKeys || []),
            `work-queue:${item.nursingHomeId}`,
          ]),
        ],
      };
    }
    return applyAssignment(
      movedState,
      String(item.id),
      target("ward", {
        assignedWardId: wardId,
        assignmentReasonCode: "resident_moved_ward",
      }),
      { ...contextFor(item), actorType: "system" },
      "work_assignment.reassign",
      "reassigned",
      "WorkItemReassigned",
    );
  }, state);
}
