import { createDomainEventId, type DomainEventId } from "@/types/entityIds";
import { EVENT_CATALOGUE, SUPPORTED_EVENT_VERSIONS } from "./eventCatalog";
import type { AnyDomainEvent, DomainEvent, DomainEventPayloadMapV1, DomainEventType, EventActor, EventScope, EventSource, EventSubject } from "./eventTypes";

export type PublicationStatus = "pending" | "published" | "failed" | "dead_letter";
export type ProcessingStatus = "completed" | "failed" | "skipped_duplicate";

export interface EventStoreRecord {
  eventId: DomainEventId;
  eventType: string;
  eventVersion: number;
  event: DomainEvent<string, unknown>;
  storedAt: string;
  publicationStatus: PublicationStatus;
  availableAt?: string;
  lockedAt?: string;
  retryCount: number;
  lastError?: string;
}

export interface EventProcessingReceipt {
  id: string;
  eventId: DomainEventId | string;
  handlerId: string;
  status: ProcessingStatus;
  startedAt: string;
  completedAt?: string;
  attempt: number;
  durationMs?: number;
  error?: string;
}

export interface EventArchitectureState {
  eventStore?: EventStoreRecord[];
  eventOutbox?: EventStoreRecord[];
  eventProcessingReceipts?: EventProcessingReceipt[];
}

export type EventHandler = (event: AnyDomainEvent) => void;

export interface EventHandlerRegistration {
  handlerId: string;
  eventTypes: DomainEventType[];
  handle: EventHandler;
}

const safeObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const prohibitedKeys = new Set([
  "password",
  "fullCarePlan",
  "fullAssessmentAnswers",
  "freeTextNarrative",
  "description",
  "summary",
  "outstandingActions",
  "note",
  "notes",
  "comments",
]);

export function createCorrelationId(prefix = "corr") {
  return `${prefix}-${createDomainEventId().replace("domain-event-", "")}`;
}

export function createDomainEvent<TType extends DomainEventType>(
  input: {
    eventType: TType;
    occurredAt: string;
    recordedAt?: string;
    actor: EventActor;
    scope: EventScope;
    subject: EventSubject;
    source: EventSource;
    payload: DomainEventPayloadMapV1[TType];
    correlationId: string;
    causationId?: DomainEventId;
    requestId?: string;
    previousValues?: Record<string, unknown>;
    currentValues?: Record<string, unknown>;
    ruleContext?: DomainEvent<TType, DomainEventPayloadMapV1[TType]>["ruleContext"];
    metadata?: Record<string, unknown>;
  },
): DomainEvent<TType, DomainEventPayloadMapV1[TType]> {
  return {
    eventId: createDomainEventId(),
    eventType: input.eventType,
    eventVersion: 1,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt || new Date().toISOString(),
    actor: input.actor,
    scope: input.scope,
    subject: input.subject,
    source: input.source,
    payload: input.payload,
    previousValues: input.previousValues,
    currentValues: input.currentValues,
    correlationId: input.correlationId,
    causationId: input.causationId,
    requestId: input.requestId,
    ruleContext: input.ruleContext,
    metadata: input.metadata,
  };
}

export function validateEventEnvelope(event: DomainEvent<string, unknown>) {
  const errors: string[] = [];
  if (!event.eventId) errors.push("Event ID is required.");
  if (!event.eventType) errors.push("Event type is required.");
  if (!event.eventVersion) errors.push("Event version is required.");
  if (!event.occurredAt || Number.isNaN(Date.parse(event.occurredAt))) errors.push("occurredAt must be an ISO timestamp.");
  if (!event.recordedAt || Number.isNaN(Date.parse(event.recordedAt))) errors.push("recordedAt must be an ISO timestamp.");
  if (!event.actor?.actorType) errors.push("Actor type is required.");
  if (event.actor?.actorType === "user" && !event.actor.userAccountId) errors.push("User events require userAccountId.");
  if (!event.source?.module || !event.source?.service || !event.source?.operation) errors.push("Source module, service and operation are required.");
  if (!event.subject?.entityType || !event.subject?.entityId) errors.push("Subject entity is required.");
  if (!event.correlationId) errors.push("Correlation ID is required.");
  return errors;
}

export function validateEventPayload(event: DomainEvent<string, unknown>) {
  const errors: string[] = [];
  const catalogue = EVENT_CATALOGUE[event.eventType as DomainEventType];
  if (!catalogue) return [`Unsupported event type: ${event.eventType}`];
  if (!SUPPORTED_EVENT_VERSIONS[event.eventType as DomainEventType]?.includes(event.eventVersion)) {
    errors.push(`Unsupported event version: ${event.eventType} v${event.eventVersion}`);
  }
  const payload = safeObject(event.payload);
  for (const field of catalogue.requiredPayloadFields) {
    if (!(field in payload) || payload[field] === undefined || payload[field] === "") {
      errors.push(`Missing payload field: ${field}`);
    }
  }
  for (const key of prohibitedKeys) {
    if (key in payload) errors.push(`Prohibited payload field: ${key}`);
  }
  for (const fieldSet of [event.previousValues, event.currentValues]) {
    if (!fieldSet) continue;
    for (const key of Object.keys(fieldSet)) {
      if (prohibitedKeys.has(key)) errors.push(`Prohibited value field: ${key}`);
    }
  }
  return errors;
}

export function validateEventScope(event: DomainEvent<string, unknown>) {
  const errors: string[] = [];
  if (!event.scope?.nursingHomeId) errors.push("Nursing-home scope is required.");
  if (!event.scope?.timezone) errors.push("Scope timezone is required.");
  if (event.subject?.residentId && !event.scope.nursingHomeId) errors.push("Resident events require nursing-home scope.");
  return errors;
}

export function validateEventReferences(
  event: DomainEvent<string, unknown>,
  state?: {
    residents?: { id: string; facilityId?: string; wardId?: string }[];
    wards?: { id: string; nursingHomeId: string }[];
    facilities?: { id: string }[];
  },
) {
  const errors: string[] = [];
  if (!state) return errors;
  const residentId = event.subject.residentId || safeObject(event.payload).residentId;
  if (residentId) {
    const resident = state.residents?.find((item) => item.id === residentId);
    if (!resident) errors.push(`Referenced resident not found: ${residentId}`);
    if (resident?.facilityId && resident.facilityId !== event.scope.nursingHomeId) {
      errors.push(`Resident belongs to another nursing home: ${residentId}`);
    }
  }
  if (event.scope.wardId) {
    const ward = state.wards?.find((item) => item.id === event.scope.wardId);
    if (!ward) errors.push(`Referenced ward not found: ${event.scope.wardId}`);
    if (ward && ward.nursingHomeId !== event.scope.nursingHomeId) {
      errors.push(`Ward belongs to another nursing home: ${event.scope.wardId}`);
    }
  }
  return errors;
}

export function validateDomainEvent(event: DomainEvent<string, unknown>, state?: Parameters<typeof validateEventReferences>[1]) {
  const errors = [
    ...validateEventEnvelope(event),
    ...validateEventPayload(event),
    ...validateEventScope(event),
    ...validateEventReferences(event, state),
  ];
  return { valid: errors.length === 0, errors };
}

export function eventToStoreRecord(event: DomainEvent<string, unknown>, recordedAt = new Date().toISOString()): EventStoreRecord {
  return {
    eventId: event.eventId,
    eventType: event.eventType,
    eventVersion: event.eventVersion,
    event,
    storedAt: recordedAt,
    publicationStatus: "pending",
    retryCount: 0,
    availableAt: recordedAt,
  };
}

export function appendEventRecord<TState extends EventArchitectureState>(state: TState, event: DomainEvent<string, unknown>) {
  if ((state.eventStore || []).some((record) => record.eventId === event.eventId)) return state;
  const record = eventToStoreRecord(event, event.recordedAt);
  return {
    ...state,
    eventStore: [record, ...(state.eventStore || [])],
    eventOutbox: [record, ...(state.eventOutbox || [])],
  };
}

export function publishPendingEvents<TState extends EventArchitectureState>(
  state: TState,
  handlers: EventHandlerRegistration[] = [],
  now = new Date().toISOString(),
) {
  let receipts = [...(state.eventProcessingReceipts || [])];
  const eventOutbox = (state.eventOutbox || []).map((record) => {
    if (!["pending", "failed"].includes(record.publicationStatus)) return record;
    const validation = validateDomainEvent(record.event);
    if (!validation.valid) {
      return { ...record, publicationStatus: "dead_letter" as const, lastError: validation.errors.join("; "), retryCount: record.retryCount + 1 };
    }
    let status: PublicationStatus = "published";
    let lastError: string | undefined;
    for (const handler of handlers.filter((item) => item.eventTypes.includes(record.eventType as DomainEventType))) {
      const existing = receipts.find((receipt) => receipt.eventId === record.eventId && receipt.handlerId === handler.handlerId && receipt.status === "completed");
      if (existing) {
        receipts = [
          { id: `${record.eventId}-${handler.handlerId}-duplicate-${receipts.length}`, eventId: record.eventId, handlerId: handler.handlerId, status: "skipped_duplicate", startedAt: now, completedAt: now, attempt: record.retryCount + 1, durationMs: 0 },
          ...receipts,
        ];
        continue;
      }
      const started = Date.now();
      try {
        handler.handle(record.event as AnyDomainEvent);
        receipts = [
          { id: `${record.eventId}-${handler.handlerId}`, eventId: record.eventId, handlerId: handler.handlerId, status: "completed", startedAt: now, completedAt: now, attempt: record.retryCount + 1, durationMs: Date.now() - started },
          ...receipts,
        ];
      } catch (error) {
        status = "failed";
        lastError = error instanceof Error ? error.message : String(error);
        receipts = [
          { id: `${record.eventId}-${handler.handlerId}-failed-${record.retryCount + 1}`, eventId: record.eventId, handlerId: handler.handlerId, status: "failed", startedAt: now, completedAt: now, attempt: record.retryCount + 1, durationMs: Date.now() - started, error: lastError },
          ...receipts,
        ];
      }
    }
    return { ...record, publicationStatus: status, lastError, retryCount: record.retryCount + 1, lockedAt: undefined };
  });
  const eventStore = (state.eventStore || []).map((record) => {
    const outbox = eventOutbox.find((item) => item.eventId === record.eventId);
    return outbox ? { ...record, publicationStatus: outbox.publicationStatus, lastError: outbox.lastError, retryCount: outbox.retryCount } : record;
  });
  return { ...state, eventOutbox, eventStore, eventProcessingReceipts: receipts };
}

export const getEventById = (state: EventArchitectureState, eventId: string) =>
  (state.eventStore || []).find((record) => record.eventId === eventId);
export const getEventsByCorrelationId = (state: EventArchitectureState, correlationId: string) =>
  (state.eventStore || []).filter((record) => record.event.correlationId === correlationId);
export const getEventsForResident = (state: EventArchitectureState, residentId: string) =>
  (state.eventStore || []).filter((record) => record.event.subject.residentId === residentId || safeObject(record.event.payload).residentId === residentId);
export const getEventsForEntity = (state: EventArchitectureState, entityType: string, entityId: string) =>
  (state.eventStore || []).filter((record) => record.event.subject.entityType === entityType && record.event.subject.entityId === entityId);
export const getFailedEvents = (state: EventArchitectureState) =>
  (state.eventStore || []).filter((record) => record.publicationStatus === "failed");
export const getDeadLetterEvents = (state: EventArchitectureState) =>
  (state.eventStore || []).filter((record) => record.publicationStatus === "dead_letter");
export const getProcessingReceipts = (state: EventArchitectureState, eventId: string) =>
  (state.eventProcessingReceipts || []).filter((receipt) => receipt.eventId === eventId);
