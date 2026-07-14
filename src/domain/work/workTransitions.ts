import type {
  WorkAuthContext,
  WorkDomainEvent,
  WorkDomainEventType,
  WorkItem,
  WorkPersistedStatus,
  WorkProjectionState,
  WorkStatusTransition,
  WorkTransitionType,
} from "./workTypes";
import { getWorkTypeHandler } from "./workHandlers";

const allowed: Record<WorkPersistedStatus, WorkPersistedStatus[]> = {
  scheduled: ["in_progress", "completed", "missed", "deferred", "cancelled", "not_applicable"],
  in_progress: ["completed", "missed", "deferred", "cancelled"],
  deferred: ["scheduled", "in_progress", "completed", "missed", "cancelled", "not_applicable"],
  completed: [],
  missed: [],
  cancelled: [],
  not_applicable: [],
};
export class WorkTransitionError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}
export interface TransitionRequest {
  actorType?: WorkStatusTransition["actorType"];
  reasonCode?: string;
  reasonText?: string;
  occurredAt?: string;
  effectiveAt?: string;
  evidenceEntityType?: string;
  evidenceEntityId?: string;
  sourceEventId?: string;
  correlationId?: string;
  deferredUntil?: string;
  followUpRequired?: boolean;
  escalationRequired?: boolean;
}

function assertScope(item: WorkItem, auth: WorkAuthContext, capability: string) {
  if (!auth.authorisedNursingHomeIds.includes(String(item.nursingHomeId)))
    throw new WorkTransitionError(
      "Work item is outside the authorised nursing home scope.",
      "cross_home",
    );
  if (item.wardId && !auth.authorisedWardIds.includes(String(item.wardId)))
    throw new WorkTransitionError("Work item is outside the authorised ward scope.", "cross_ward");
  if (!auth.capabilities.includes(capability))
    throw new WorkTransitionError(`Missing capability: ${capability}`, "forbidden");
  const sourceCapability = getWorkTypeHandler(item.workType).sourceCapability;
  if (!auth.sourceCapabilities?.includes(sourceCapability))
    throw new WorkTransitionError(
      `Missing source capability: ${sourceCapability}`,
      "source_forbidden",
    );
}
function transition(
  state: WorkProjectionState,
  id: string,
  toStatus: WorkPersistedStatus,
  type: WorkTransitionType,
  auth: WorkAuthContext,
  request: TransitionRequest,
  capability: string,
) {
  const item = state.workItems.find((candidate) => candidate.id === id);
  if (!item) throw new WorkTransitionError("Work item not found.", "not_found");
  if (item.persistedStatus === toStatus && toStatus === "completed") return state;
  assertScope(item, auth, capability);
  const handler = getWorkTypeHandler(item.workType);
  if (toStatus === "in_progress" && !handler.supportsStart(item))
    throw new WorkTransitionError(
      `${item.workType} does not support In Progress.`,
      "unsupported_transition",
    );
  if (toStatus === "deferred" && !handler.supportsDeferral(item))
    throw new WorkTransitionError(
      `${item.workType} does not support deferral.`,
      "unsupported_transition",
    );
  if (toStatus === "missed" && !handler.supportsMissed(item))
    throw new WorkTransitionError(
      `${item.workType} does not support Missed.`,
      "unsupported_transition",
    );
  if (toStatus === "cancelled" && !handler.supportsCancellation(item))
    throw new WorkTransitionError(
      `${item.workType} cancellation must be source-driven.`,
      "unsupported_transition",
    );
  if (toStatus === "not_applicable" && !handler.supportsNotApplicable(item))
    throw new WorkTransitionError(
      `${item.workType} does not support Not Applicable.`,
      "unsupported_transition",
    );
  if (!allowed[item.persistedStatus].includes(toStatus))
    throw new WorkTransitionError(
      `Invalid transition: ${item.persistedStatus} -> ${toStatus}`,
      "invalid_transition",
    );
  const occurredAt = request.occurredAt || new Date().toISOString();
  if (
    ["missed", "deferred", "cancelled", "not_applicable"].includes(toStatus) &&
    !request.reasonCode
  )
    throw new WorkTransitionError(`${toStatus} requires a reason code.`, "reason_required");
  if (toStatus === "completed" && (!request.evidenceEntityType || !request.evidenceEntityId))
    throw new WorkTransitionError("Completion requires source evidence.", "evidence_required");
  if (
    toStatus === "deferred" &&
    (!request.deferredUntil ||
      Date.parse(request.deferredUntil) <=
        Date.parse(item.schedule.effectiveDueAt || item.schedule.dueAt || occurredAt))
  )
    throw new WorkTransitionError(
      "Deferral must provide a later deferredUntil.",
      "invalid_deferral",
    );
  const updated: WorkItem = {
    ...item,
    persistedStatus: toStatus,
    updatedAt: occurredAt,
    updatedBy: auth.userAccountId,
  };
  if (toStatus === "completed")
    updated.completion = {
      effectiveCompletedAt: request.effectiveAt || occurredAt,
      recordedAt: occurredAt,
      completedByUserAccountId: auth.userAccountId,
      completedByStaffMemberId: auth.staffMemberId,
      wasCompletedLate:
        !!item.schedule.effectiveDueAt &&
        Date.parse(request.effectiveAt || occurredAt) > Date.parse(item.schedule.effectiveDueAt),
      evidenceEntityType: request.evidenceEntityType!,
      evidenceEntityId: request.evidenceEntityId!,
    };
  if (toStatus === "missed")
    updated.missed = {
      reasonCode: request.reasonCode!,
      reasonText: request.reasonText,
      occurredAt,
      actorId: auth.userAccountId,
      followUpRequired: !!request.followUpRequired,
      escalationRequired: !!request.escalationRequired,
    };
  if (toStatus === "deferred") {
    updated.deferral = {
      reasonCode: request.reasonCode!,
      reasonText: request.reasonText,
      occurredAt,
      actorId: auth.userAccountId,
      originalDueAt: item.schedule.originalDueAt || item.schedule.dueAt!,
      deferredUntil: request.deferredUntil!,
    };
    updated.schedule = {
      ...item.schedule,
      originalDueAt: item.schedule.originalDueAt || item.schedule.dueAt,
      effectiveDueAt: request.deferredUntil,
    };
  }
  if (toStatus === "cancelled")
    updated.cancellation = {
      reasonCode: request.reasonCode!,
      reasonText: request.reasonText,
      occurredAt,
      actorId: auth.userAccountId,
    };
  if (toStatus === "not_applicable")
    updated.notApplicable = {
      reasonCode: request.reasonCode!,
      reasonText: request.reasonText,
      occurredAt,
      actorId: auth.userAccountId,
    };
  const history: WorkStatusTransition = {
    id: `work-transition:${id}:${state.workStatusTransitions.length + 1}`,
    workItemId: id,
    fromStatus: item.persistedStatus,
    toStatus,
    transitionType: type,
    occurredAt,
    actorType: request.actorType || "user",
    userAccountId: auth.userAccountId,
    staffMemberId: auth.staffMemberId,
    reasonCode: request.reasonCode,
    reasonText: request.reasonText,
    effectiveAt: request.effectiveAt,
    sourceEventId: request.sourceEventId,
    correlationId: request.correlationId,
  };
  const eventTypes: Record<
    Exclude<WorkTransitionType, "created" | "restored" | "declined">,
    WorkDomainEventType
  > = {
    started: "WorkItemStarted",
    completed: "WorkItemCompleted",
    missed: "WorkItemMissed",
    deferred: "WorkItemDeferred",
    cancelled: "WorkItemCancelled",
    not_applicable: "WorkItemMarkedNotApplicable",
  };
  const correlationId = request.correlationId || `work-correlation:${id}:${occurredAt}`;
  const event: WorkDomainEvent = {
    eventId: `work-event:${id}:${state.workStatusTransitions.length + 1}`,
    eventType: eventTypes[type as Exclude<WorkTransitionType, "created" | "restored" | "declined">],
    eventVersion: 1,
    workItemId: id,
    source: item.source,
    nursingHomeId: String(item.nursingHomeId),
    wardId: item.wardId ? String(item.wardId) : undefined,
    residentId: item.residentId ? String(item.residentId) : undefined,
    occurredAt,
    actorUserAccountId: auth.userAccountId,
    correlationId,
    causationId: request.sourceEventId,
    payload: {
      fromStatus: item.persistedStatus,
      toStatus,
      reasonCode: request.reasonCode,
      evidenceEntityType: request.evidenceEntityType,
      evidenceEntityId: request.evidenceEntityId,
    },
  };
  return {
    ...state,
    workItems: state.workItems.map((candidate) => (candidate.id === id ? updated : candidate)),
    workStatusTransitions: [...state.workStatusTransitions, history],
    workEvents: [...(state.workEvents || []), event],
  };
}
export const startWorkItem = (
  state: WorkProjectionState,
  id: string,
  auth: WorkAuthContext,
  request: TransitionRequest = {},
) => transition(state, id, "in_progress", "started", auth, request, "work_item.start");
export const completeWorkItem = (
  state: WorkProjectionState,
  id: string,
  auth: WorkAuthContext,
  request: TransitionRequest,
) => transition(state, id, "completed", "completed", auth, request, "work_item.complete");
export const legacyMarkWorkItemMissed = (
  state: WorkProjectionState,
  id: string,
  auth: WorkAuthContext,
  request: TransitionRequest,
) => transition(state, id, "missed", "missed", auth, request, "work_item.mark_missed");
export const legacyDeferWorkItem = (
  state: WorkProjectionState,
  id: string,
  auth: WorkAuthContext,
  request: TransitionRequest,
) => transition(state, id, "deferred", "deferred", auth, request, "work_item.defer");
export const legacyCancelWorkItem = (
  state: WorkProjectionState,
  id: string,
  auth: WorkAuthContext,
  request: TransitionRequest,
) => transition(state, id, "cancelled", "cancelled", auth, request, "work_item.cancel");
export const legacyMarkWorkItemNotApplicable = (
  state: WorkProjectionState,
  id: string,
  auth: WorkAuthContext,
  request: TransitionRequest,
) =>
  transition(
    state,
    id,
    "not_applicable",
    "not_applicable",
    auth,
    request,
    "work_item.mark_not_applicable",
  );
