import { recordAuditEvent } from "@/lib/care/auditFramework";
import { getWorkTypeHandler } from "./workHandlers";
import { validateWorkExceptionReason } from "./workExceptionReasons";
import type {
  WorkAuthContext,
  WorkDomainEvent,
  WorkException,
  WorkExceptionType,
  WorkItem,
  WorkPersistedStatus,
  WorkProjectionState,
  WorkStatusTransition,
  WorkTransitionType,
} from "./workTypes";

export interface WorkExceptionContext {
  auth: WorkAuthContext;
  recordedAt: string;
  correlationId: string;
  sourceEventId?: string;
  actorType?: WorkStatusTransition["actorType"];
  maximumDeferralMinutes?: number;
  allowBackdatedCorrection?: boolean;
  sourceWorkflow?: (
    item: WorkItem,
    exception: WorkException,
    resultingStatus: WorkPersistedStatus,
  ) => { evidenceEntityType?: string; evidenceEntityId?: string } | void;
}

export interface BaseWorkExceptionInput {
  reasonCode: string;
  reasonText?: string;
  effectiveAt: string;
  followUpRequired?: boolean;
  escalationRequired?: boolean;
  sourceEvidenceEntityType?: string;
  sourceEvidenceEntityId?: string;
}
export interface DeferWorkItemInput extends BaseWorkExceptionInput {
  deferredUntil: string;
  approvalUserAccountId?: string;
}
export interface MarkWorkItemMissedInput extends Omit<BaseWorkExceptionInput, "effectiveAt"> {
  effectiveMissedAt: string;
  followUpRequired: boolean;
  escalationRequired: boolean;
  declinedByType?: WorkException["declinedByType"];
  declinedByName?: string;
}
export interface RecordWorkDeclinedInput extends BaseWorkExceptionInput {
  declinedByType: NonNullable<WorkException["declinedByType"]>;
  declinedByName?: string;
  followUpRequired: boolean;
  escalationRequired: boolean;
}
export interface MarkNotApplicableInput extends BaseWorkExceptionInput {
  evidenceEntityType?: string;
  evidenceEntityId?: string;
}
export interface CancelWorkItemInput extends BaseWorkExceptionInput {
  sourceCancellationEntityType?: string;
  sourceCancellationEntityId?: string;
}
export interface CorrectWorkExceptionInput {
  correctionReason: string;
  reasonCode?: string;
  reasonText?: string;
  effectiveAt?: string;
  deferredUntil?: string;
  reactivate?: boolean;
}

export class WorkExceptionError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

const activeStatuses = new Set<WorkPersistedStatus>(["scheduled", "in_progress", "deferred"]);
const capabilityByType: Record<WorkExceptionType, string> = {
  deferred: "work_exception.defer",
  missed: "work_exception.mark_missed",
  declined: "work_exception.record_declined",
  not_applicable: "work_exception.mark_not_applicable",
  cancelled: "work_exception.cancel",
};
const transitionTypeByException: Record<WorkExceptionType, WorkTransitionType> = {
  deferred: "deferred",
  missed: "missed",
  declined: "declined",
  not_applicable: "not_applicable",
  cancelled: "cancelled",
};
const eventTypeByException: Record<WorkExceptionType, WorkDomainEvent["eventType"]> = {
  deferred: "WorkItemDeferred",
  missed: "WorkItemMissed",
  declined: "WorkItemDeclined",
  not_applicable: "WorkItemMarkedNotApplicable",
  cancelled: "WorkItemCancelled",
};

const getItem = (state: WorkProjectionState, workItemId: string) => {
  const item = state.workItems.find((candidate) => String(candidate.id) === workItemId);
  if (!item) throw new WorkExceptionError("Work item not found.", "not_found");
  return item;
};

const assertScope = (
  item: WorkItem,
  exceptionType: WorkExceptionType,
  context: WorkExceptionContext,
) => {
  if (!context.auth.authorisedNursingHomeIds.includes(String(item.nursingHomeId)))
    throw new WorkExceptionError("Work item is outside the authorised home.", "cross_home");
  if (item.wardId && !context.auth.authorisedWardIds.includes(String(item.wardId)))
    throw new WorkExceptionError("Work item is outside the authorised ward.", "cross_ward");
  const capability = capabilityByType[exceptionType];
  if (!context.auth.capabilities.includes(capability))
    throw new WorkExceptionError(`Missing capability: ${capability}`, "forbidden");
  const sourceCapability = getWorkTypeHandler(item.workType).sourceCapability;
  if (
    !context.auth.sourceCapabilities?.includes(sourceCapability) &&
    !context.auth.capabilities.includes(sourceCapability)
  )
    throw new WorkExceptionError(
      `Missing source capability: ${sourceCapability}`,
      "source_forbidden",
    );
  if (!activeStatuses.has(item.persistedStatus))
    throw new WorkExceptionError("Closed work cannot receive a new exception.", "work_closed");
};

const assertSupported = (item: WorkItem, exceptionType: WorkExceptionType) => {
  const handler = getWorkTypeHandler(item.workType);
  const supported =
    exceptionType === "deferred"
      ? handler.supportsDeferral(item)
      : exceptionType === "missed"
        ? handler.supportsMissed(item)
        : exceptionType === "declined"
          ? handler.supportsDeclined(item)
          : exceptionType === "not_applicable"
            ? handler.supportsNotApplicable(item)
            : handler.supportsCancellation(item);
  if (!supported)
    throw new WorkExceptionError(
      `${item.workType} does not support ${exceptionType}.`,
      "unsupported_exception",
    );
};

const resultingStatus = (item: WorkItem, exceptionType: WorkExceptionType) =>
  exceptionType === "declined"
    ? getWorkTypeHandler(item.workType).declinedResultStatus(item)
    : (exceptionType as WorkPersistedStatus);

const applyException = (
  state: WorkProjectionState,
  workItemId: string,
  exceptionType: WorkExceptionType,
  input: BaseWorkExceptionInput & {
    deferredUntil?: string;
    declinedByType?: WorkException["declinedByType"];
    declinedByName?: string;
  },
  context: WorkExceptionContext,
) => {
  const item = getItem(state, workItemId);
  assertScope(item, exceptionType, context);
  assertSupported(item, exceptionType);
  const reasonIssue = validateWorkExceptionReason(
    item,
    exceptionType,
    input.reasonCode,
    input.reasonText,
  );
  if (reasonIssue) throw new WorkExceptionError("Invalid exception reason.", reasonIssue);
  if (!input.effectiveAt || !Number.isFinite(Date.parse(input.effectiveAt)))
    throw new WorkExceptionError("A valid effective time is required.", "effective_time_required");
  if (!Number.isFinite(Date.parse(context.recordedAt)))
    throw new WorkExceptionError("A valid recorded time is required.", "recorded_time_required");
  if (exceptionType === "declined" && !input.declinedByType)
    throw new WorkExceptionError("Declined by type is required.", "declined_by_required");
  if (exceptionType === "deferred") {
    if (!input.deferredUntil || !Number.isFinite(Date.parse(input.deferredUntil)))
      throw new WorkExceptionError("Deferred until is required.", "deferred_until_required");
    if (
      !context.allowBackdatedCorrection &&
      Date.parse(input.deferredUntil) <= Date.parse(context.recordedAt)
    )
      throw new WorkExceptionError("Deferred until must be in the future.", "invalid_deferral");
    if (
      context.maximumDeferralMinutes &&
      Date.parse(input.deferredUntil) - Date.parse(context.recordedAt) >
        context.maximumDeferralMinutes * 60_000
    )
      throw new WorkExceptionError("Deferral exceeds the configured maximum.", "deferral_too_long");
    if (
      (item.priority === "critical" || item.priority === "urgent") &&
      !context.auth.capabilities.includes("work_exception.defer_urgent")
    )
      throw new WorkExceptionError(
        "Urgent deferral requires approval.",
        "urgent_approval_required",
      );
  }
  const sequence = (state.workExceptions || []).length + 1;
  const exception: WorkException = {
    id: `work-exception:${workItemId}:${sequence}`,
    workItemId,
    exceptionType,
    reasonCode: input.reasonCode.trim(),
    reasonText: input.reasonText?.trim(),
    effectiveAt: input.effectiveAt,
    recordedAt: context.recordedAt,
    recordedByUserAccountId: context.auth.userAccountId,
    recordedByStaffMemberId: context.auth.staffMemberId,
    declinedByType: input.declinedByType,
    declinedByName: input.declinedByName,
    followUpRequired: Boolean(input.followUpRequired),
    escalationRequired: Boolean(input.escalationRequired),
    deferredUntil: input.deferredUntil,
    sourceEvidenceEntityType: input.sourceEvidenceEntityType,
    sourceEvidenceEntityId: input.sourceEvidenceEntityId,
    correlationId: context.correlationId,
    sourceEventId: context.sourceEventId,
  };
  const nextStatus = resultingStatus(item, exceptionType);
  const sourceEvidence = context.sourceWorkflow?.(item, exception, nextStatus);
  if (sourceEvidence) {
    exception.sourceEvidenceEntityType ||= sourceEvidence.evidenceEntityType;
    exception.sourceEvidenceEntityId ||= sourceEvidence.evidenceEntityId;
  }
  if (
    exceptionType === "cancelled" &&
    (!exception.sourceEvidenceEntityType || !exception.sourceEvidenceEntityId)
  )
    throw new WorkExceptionError(
      "Cancellation requires source authority evidence.",
      "source_authority_required",
    );
  const updated: WorkItem = {
    ...item,
    persistedStatus: nextStatus,
    latestException: exception,
    updatedAt: context.recordedAt,
    updatedBy: context.auth.userAccountId,
  };
  if (exceptionType === "deferred") {
    updated.schedule = {
      ...item.schedule,
      originalDueAt: item.schedule.originalDueAt || item.schedule.dueAt,
      effectiveDueAt: input.deferredUntil,
    };
    updated.deferral = {
      reasonCode: exception.reasonCode,
      reasonText: exception.reasonText,
      occurredAt: exception.effectiveAt,
      actorId: context.auth.userAccountId,
      originalDueAt: updated.schedule.originalDueAt || item.schedule.dueAt!,
      deferredUntil: input.deferredUntil!,
    };
  }
  if (nextStatus === "missed")
    updated.missed = {
      reasonCode: exception.reasonCode,
      reasonText: exception.reasonText,
      occurredAt: exception.effectiveAt,
      actorId: context.auth.userAccountId,
      followUpRequired: exception.followUpRequired,
      escalationRequired: exception.escalationRequired,
    };
  if (nextStatus === "cancelled")
    updated.cancellation = {
      reasonCode: exception.reasonCode,
      reasonText: exception.reasonText,
      occurredAt: exception.effectiveAt,
      actorId: context.auth.userAccountId,
    };
  if (nextStatus === "not_applicable")
    updated.notApplicable = {
      reasonCode: exception.reasonCode,
      reasonText: exception.reasonText,
      occurredAt: exception.effectiveAt,
      actorId: context.auth.userAccountId,
    };
  const transition: WorkStatusTransition = {
    id: `work-transition:${workItemId}:${state.workStatusTransitions.length + 1}`,
    workItemId,
    fromStatus: item.persistedStatus,
    toStatus: nextStatus,
    transitionType: transitionTypeByException[exceptionType],
    occurredAt: context.recordedAt,
    actorType: context.actorType || "user",
    userAccountId: context.auth.userAccountId,
    staffMemberId: context.auth.staffMemberId,
    reasonCode: exception.reasonCode,
    reasonText: exception.reasonText,
    effectiveAt: exception.effectiveAt,
    sourceEventId: context.sourceEventId,
    correlationId: context.correlationId,
  };
  const event: WorkDomainEvent = {
    eventId: `work-event:${workItemId}:exception:${sequence}`,
    eventType: eventTypeByException[exceptionType],
    eventVersion: 1,
    workItemId,
    source: item.source,
    nursingHomeId: String(item.nursingHomeId),
    wardId: item.wardId ? String(item.wardId) : undefined,
    residentId: item.residentId ? String(item.residentId) : undefined,
    occurredAt: context.recordedAt,
    actorUserAccountId: context.auth.userAccountId,
    correlationId: context.correlationId,
    causationId: context.sourceEventId,
    payload: {
      fromStatus: item.persistedStatus,
      toStatus: nextStatus,
      reasonCode: exception.reasonCode,
      effectiveAt: exception.effectiveAt,
      recordedAt: exception.recordedAt,
      followUpRequired: exception.followUpRequired,
      escalationRequired: exception.escalationRequired,
    },
  };
  const audit = recordAuditEvent({
    id: `audit-work-exception:${workItemId}:${sequence}`,
    occurredAt: context.recordedAt,
    recordedAt: context.recordedAt,
    effectiveAt: exception.effectiveAt,
    actorType: context.actorType === "rule" ? "system" : context.actorType || "user",
    actor: {
      userAccountId: context.auth.userAccountId,
      staffMemberId: context.auth.staffMemberId,
    },
    action:
      exceptionType === "deferred" ? "defer" : exceptionType === "cancelled" ? "cancel" : "update",
    entityType: "work_item",
    entityId: workItemId,
    summary: `Work item ${exceptionType.replace(/_/g, " ")}.`,
    changes: [
      {
        field: "persistedStatus",
        previousValue: item.persistedStatus,
        newValue: nextStatus,
        dataClassification: "standard",
      },
      ...(exceptionType === "deferred"
        ? [
            {
              field: "effectiveDueAt",
              previousValue: item.schedule.effectiveDueAt || item.schedule.dueAt,
              newValue: input.deferredUntil,
              dataClassification: "standard" as const,
            },
          ]
        : []),
    ],
    reasonCode: exception.reasonCode,
    reasonText: exception.reasonText,
    scope: {
      nursingHomeId: String(item.nursingHomeId),
      wardId: item.wardId ? String(item.wardId) : undefined,
      residentId: item.residentId ? String(item.residentId) : undefined,
    },
    correlationId: context.correlationId,
    metadata: { workExceptionId: exception.id, source: item.source },
  });
  return {
    ...state,
    workItems: state.workItems.map((candidate) =>
      String(candidate.id) === workItemId ? updated : candidate,
    ),
    workStatusTransitions: [...state.workStatusTransitions, transition],
    workExceptions: [...(state.workExceptions || []), exception],
    workEvents: [...(state.workEvents || []), event],
    workAuditRecords: [...(state.workAuditRecords || []), audit],
    workQueueInvalidationKeys: [
      ...new Set([...(state.workQueueInvalidationKeys || []), `work-queue:${item.nursingHomeId}`]),
    ],
  };
};

export const deferWorkItem = (
  state: WorkProjectionState,
  workItemId: string,
  input: DeferWorkItemInput,
  context: WorkExceptionContext,
) => applyException(state, workItemId, "deferred", input, context);

export const markWorkItemMissed = (
  state: WorkProjectionState,
  workItemId: string,
  input: MarkWorkItemMissedInput,
  context: WorkExceptionContext,
) =>
  applyException(
    state,
    workItemId,
    "missed",
    { ...input, effectiveAt: input.effectiveMissedAt },
    context,
  );

export const recordWorkDeclined = (
  state: WorkProjectionState,
  workItemId: string,
  input: RecordWorkDeclinedInput,
  context: WorkExceptionContext,
) => applyException(state, workItemId, "declined", input, context);

export const markWorkItemNotApplicable = (
  state: WorkProjectionState,
  workItemId: string,
  input: MarkNotApplicableInput,
  context: WorkExceptionContext,
) =>
  applyException(
    state,
    workItemId,
    "not_applicable",
    {
      ...input,
      sourceEvidenceEntityType: input.evidenceEntityType,
      sourceEvidenceEntityId: input.evidenceEntityId,
    },
    context,
  );

export const cancelWorkItem = (
  state: WorkProjectionState,
  workItemId: string,
  input: CancelWorkItemInput,
  context: WorkExceptionContext,
) =>
  applyException(
    state,
    workItemId,
    "cancelled",
    {
      ...input,
      sourceEvidenceEntityType: input.sourceCancellationEntityType,
      sourceEvidenceEntityId: input.sourceCancellationEntityId,
    },
    context,
  );

export function correctWorkException(
  state: WorkProjectionState,
  exceptionId: string,
  input: CorrectWorkExceptionInput,
  context: WorkExceptionContext,
) {
  if (!context.auth.capabilities.includes("work_exception.correct"))
    throw new WorkExceptionError("Missing correction capability.", "forbidden");
  if (!input.correctionReason.trim())
    throw new WorkExceptionError("Correction reason is required.", "correction_reason_required");
  const original = (state.workExceptions || []).find(
    (candidate) => String(candidate.id) === exceptionId,
  );
  if (!original) throw new WorkExceptionError("Work exception not found.", "not_found");
  const item = getItem(state, String(original.workItemId));
  if (!context.auth.authorisedNursingHomeIds.includes(String(item.nursingHomeId)))
    throw new WorkExceptionError("Correction is outside the authorised home.", "cross_home");
  const reasonCode = input.reasonCode || original.reasonCode;
  const reasonText = input.reasonText ?? original.reasonText;
  const reasonIssue = validateWorkExceptionReason(
    item,
    original.exceptionType,
    reasonCode,
    reasonText,
  );
  if (reasonIssue) throw new WorkExceptionError("Invalid correction reason.", reasonIssue);
  const sequence = (state.workExceptions || []).length + 1;
  const correction: WorkException = {
    ...original,
    id: `work-exception:${item.id}:${sequence}`,
    reasonCode,
    reasonText,
    effectiveAt: input.effectiveAt || original.effectiveAt,
    recordedAt: context.recordedAt,
    deferredUntil: input.deferredUntil || original.deferredUntil,
    recordedByUserAccountId: context.auth.userAccountId,
    recordedByStaffMemberId: context.auth.staffMemberId,
    correlationId: context.correlationId,
    correctionOfExceptionId: original.id,
    correctionReason: input.correctionReason.trim(),
  };
  const updated: WorkItem = {
    ...item,
    latestException: correction,
    persistedStatus: input.reactivate ? "scheduled" : item.persistedStatus,
    updatedAt: context.recordedAt,
    updatedBy: context.auth.userAccountId,
  };
  if (correction.exceptionType === "deferred" && correction.deferredUntil)
    updated.schedule = { ...item.schedule, effectiveDueAt: correction.deferredUntil };
  const audit = recordAuditEvent({
    id: `audit-work-exception-correction:${item.id}:${sequence}`,
    occurredAt: context.recordedAt,
    recordedAt: context.recordedAt,
    effectiveAt: correction.effectiveAt,
    actor: {
      userAccountId: context.auth.userAccountId,
      staffMemberId: context.auth.staffMemberId,
    },
    action: "correct",
    entityType: "work_exception",
    entityId: String(correction.id),
    parentEntityType: "work_item",
    parentEntityId: String(item.id),
    summary: "Work exception corrected.",
    reasonText: input.correctionReason,
    scope: {
      nursingHomeId: String(item.nursingHomeId),
      wardId: item.wardId ? String(item.wardId) : undefined,
      residentId: item.residentId ? String(item.residentId) : undefined,
    },
    correlationId: context.correlationId,
    metadata: { originalExceptionId: original.id },
  });
  return {
    ...state,
    workItems: state.workItems.map((candidate) =>
      String(candidate.id) === String(item.id) ? updated : candidate,
    ),
    workExceptions: [...(state.workExceptions || []), correction],
    workAuditRecords: [...(state.workAuditRecords || []), audit],
    workQueueInvalidationKeys: [
      ...new Set([...(state.workQueueInvalidationKeys || []), `work-queue:${item.nursingHomeId}`]),
    ],
  };
}
