import { getWorkSourceKey } from "./workIdentity";
import type {
  WorkAssignment,
  WorkAuthContext,
  WorkDomainEvent,
  WorkItem,
  WorkProjectionState,
  WorkStatusTransition,
} from "./workTypes";
import { reassignWorkItem } from "./workAssignments";

const event = (
  item: WorkItem,
  eventType: WorkDomainEvent["eventType"],
  eventId: string,
  occurredAt: string,
  actorUserAccountId: string | undefined,
  correlationId: string,
): WorkDomainEvent => ({
  eventId,
  eventType,
  eventVersion: 1,
  workItemId: String(item.id),
  source: item.source,
  nursingHomeId: String(item.nursingHomeId),
  wardId: item.wardId ? String(item.wardId) : undefined,
  residentId: item.residentId ? String(item.residentId) : undefined,
  occurredAt,
  actorUserAccountId,
  correlationId,
  payload: {},
});

/** Idempotent projection creation: a replay updates the projection but creates no second history/event. */
export function projectWorkItem(
  state: WorkProjectionState,
  projected: WorkItem,
  actorType: WorkStatusTransition["actorType"] = "system",
) {
  const sourceKey = getWorkSourceKey(projected.workType, projected.source);
  const existing = state.workItems.find(
    (item) => getWorkSourceKey(item.workType, item.source) === sourceKey,
  );
  if (existing)
    return {
      ...state,
      workItems: state.workItems.map((item) =>
        item.id === existing.id
          ? { ...projected, id: existing.id, createdAt: existing.createdAt }
          : item,
      ),
    };
  const sequence = state.workStatusTransitions.length + 1;
  const transition: WorkStatusTransition = {
    id: `work-transition:${projected.id}:${sequence}`,
    workItemId: projected.id,
    toStatus: projected.persistedStatus,
    transitionType: "created",
    occurredAt: projected.createdAt,
    actorType,
    userAccountId: projected.createdBy,
    correlationId: projected.correlationId,
  };
  const correlationId = projected.correlationId || `work-correlation:${projected.id}:created`;
  return {
    ...state,
    workItems: [...state.workItems, projected],
    workStatusTransitions: [...state.workStatusTransitions, transition],
    workEvents: [
      ...(state.workEvents || []),
      event(
        projected,
        "WorkItemCreated",
        `work-event:${projected.id}:${sequence}`,
        projected.createdAt,
        projected.createdBy ? String(projected.createdBy) : undefined,
        correlationId,
      ),
    ],
  };
}

export function assignWorkItem(
  state: WorkProjectionState,
  workItemId: string,
  assignment: WorkAssignment,
  auth: WorkAuthContext,
  occurredAt = new Date().toISOString(),
  correlationId?: string,
) {
  const hasLegacyCapability =
    auth.capabilities.includes("work_item.assign") ||
    auth.capabilities.includes("work_item.reassign");
  const compatibleAuth = {
    ...auth,
    capabilities:
      auth.capabilities.includes("work_assignment.reassign") || !hasLegacyCapability
        ? auth.capabilities
        : [...auth.capabilities, "work_assignment.reassign"],
  };
  return reassignWorkItem(state, workItemId, assignment, {
    auth: compatibleAuth,
    occurredAt,
    correlationId: correlationId || `work-correlation:${workItemId}:assignment:${occurredAt}`,
  });
}
