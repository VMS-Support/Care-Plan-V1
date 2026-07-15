import { recordAuditEvent } from "@/lib/care/auditFramework";
import { completeWorkItem, legacyMarkWorkItemMissed, legacyMarkWorkItemNotApplicable, type WorkAuthContext } from "@/domain/work";
import type { DomainEvent } from "@/domain/events/eventTypes";
import { asDomainEventId } from "@/types/entityIds";
import { resolveDailyCareRltDomains } from "./dailyCareRltMapping";
import { validateRecordDailyCareCommand } from "./dailyCareValidation";
import type {
  DailyCareAuthorizationContext,
  DailyCareDomainEventType,
  DailyCareFilters,
  DailyCareOperationalContext,
  DailyCareRecord,
  DailyCareRepository,
  RecordDailyCareCommand,
} from "./dailyCareTypes";

export function recordDailyCare(command: RecordDailyCareCommand, operational: DailyCareOperationalContext, authorization: DailyCareAuthorizationContext, repository: DailyCareRepository, createId: () => string) {
  const existing = repository.dailyCareRecords.find((item) => item.clientRequestId === command.clientRequestId && String(item.nursingHomeId) === String(command.nursingHomeId));
  if (existing) return { record: existing, idempotent: true };
  validateRecordDailyCareCommand(command, operational, authorization, repository.workState?.workItems);
  const record = toRecord(command, operational, authorization, createId());
  repository.dailyCareRecords = [record, ...repository.dailyCareRecords];
  reconcileLinkedWorkItem(record, repository, authorization);
  repository.dailyCareAuditRecords = [audit(record, "create", authorization, operational), ...repository.dailyCareAuditRecords];
  repository.dailyCareEvents = [eventFor(record, eventTypeFor(record), authorization, operational), ...repository.dailyCareEvents];
  if (record.followUpRequired) repository.dailyCareEvents = [eventFor(record, "DailyCareFollowUpRequested", authorization, operational), ...repository.dailyCareEvents];
  return { record, idempotent: false };
}

export function correctDailyCareRecord(recordId: string, correctedCommand: RecordDailyCareCommand, correctionReason: string, operational: DailyCareOperationalContext, authorization: DailyCareAuthorizationContext, repository: DailyCareRepository, createId: () => string) {
  if (!authorization.capabilities.includes("daily_care.correct")) throw new Error("Missing capability: daily_care.correct");
  if (!correctionReason.trim()) throw new Error("Correction reason is required.");
  const original = getDailyCareRecordById(recordId, authorization, repository);
  const corrected = toRecord(correctedCommand, operational, authorization, createId(), original.id);
  validateRecordDailyCareCommand(correctedCommand, operational, authorization, repository.workState?.workItems);
  const superseded = { ...original, status: "corrected" as const, updatedAt: operational.recordedAt };
  repository.dailyCareRecords = [corrected, ...repository.dailyCareRecords.map((item) => item.id === original.id ? superseded : item)];
  repository.dailyCareAuditRecords = [audit(corrected, "correct", authorization, operational, correctionReason), ...repository.dailyCareAuditRecords];
  repository.dailyCareEvents = [eventFor(corrected, "DailyCareCorrected", authorization, operational), ...repository.dailyCareEvents];
  return corrected;
}

export function markDailyCareEnteredInError(recordId: string, reason: string, operational: DailyCareOperationalContext, authorization: DailyCareAuthorizationContext, repository: DailyCareRepository) {
  if (!authorization.capabilities.includes("daily_care.enter_in_error")) throw new Error("Missing capability: daily_care.enter_in_error");
  if (!reason.trim()) throw new Error("A reason is required.");
  const current = getDailyCareRecordById(recordId, authorization, repository);
  const updated = { ...current, status: "entered_in_error" as const, statusReason: reason, updatedAt: operational.recordedAt };
  repository.dailyCareRecords = repository.dailyCareRecords.map((item) => item.id === recordId ? updated : item);
  repository.dailyCareAuditRecords = [audit(updated, "void", authorization, operational, reason), ...repository.dailyCareAuditRecords];
  repository.dailyCareEvents = [eventFor(updated, "DailyCareEnteredInError", authorization, operational), ...repository.dailyCareEvents];
  return updated;
}

export function getResidentDailyCare(residentId: string, authorization: DailyCareAuthorizationContext, repository: DailyCareRepository, filters: DailyCareFilters = {}, pagination: { page?: number; pageSize?: number } = {}) {
  requireView(authorization);
  const page = pagination.page ?? 1;
  const pageSize = pagination.pageSize ?? 25;
  const records = repository.dailyCareRecords
    .filter((record) => String(record.residentId) === residentId)
    .filter((record) => authorization.authorisedNursingHomeIds.includes(String(record.nursingHomeId)))
    .filter((record) => !authorization.residentIds?.length || authorization.residentIds.includes(String(record.residentId)))
    .filter((record) => filters.statuses?.includes("entered_in_error") || record.status !== "entered_in_error")
    .filter((record) => !filters.careTypes?.length || filters.careTypes.includes(record.careType))
    .filter((record) => !filters.statuses?.length || filters.statuses.includes(record.status))
    .filter((record) => !filters.dateFrom || record.occurredAt >= filters.dateFrom)
    .filter((record) => !filters.dateTo || record.occurredAt <= filters.dateTo)
    .filter((record) => !filters.deliveredByStaffMemberIds?.length || (record.deliveredByStaffMemberId && filters.deliveredByStaffMemberIds.includes(String(record.deliveredByStaffMemberId))))
    .filter((record) => !filters.recordedByStaffMemberIds?.length || (record.recordedByStaffMemberId && filters.recordedByStaffMemberIds.includes(String(record.recordedByStaffMemberId))))
    .filter((record) => !filters.rltDomainIds?.length || filters.rltDomainIds.some((id) => record.rltDomainIds.includes(id)))
    .filter((record) => !filters.sourceTypes?.length || filters.sourceTypes.includes(record.source.sourceType))
    .filter((record) => filters.followUpRequired === undefined || record.followUpRequired === filters.followUpRequired)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return { records: records.slice((page - 1) * pageSize, page * pageSize), total: records.length, page, pageSize };
}

export function getDailyCareRecordById(recordId: string, authorization: DailyCareAuthorizationContext, repository: DailyCareRepository) {
  requireView(authorization);
  const record = repository.dailyCareRecords.find((item) => item.id === recordId);
  if (!record) throw new Error("Daily Care record was not found.");
  if (!authorization.authorisedNursingHomeIds.includes(String(record.nursingHomeId))) throw new Error("Daily Care record is outside authorised nursing-home scope.");
  if (authorization.residentIds?.length && !authorization.residentIds.includes(String(record.residentId))) throw new Error("Daily Care record is outside authorised resident scope.");
  if (record.status === "entered_in_error" && !authorization.capabilities.includes("daily_care.enter_in_error")) throw new Error("Missing capability: daily_care.enter_in_error");
  return record;
}

export function getResidentLatestDailyCareSummary(residentId: string, authorization: DailyCareAuthorizationContext, repository: DailyCareRepository) {
  const page = getResidentDailyCare(residentId, authorization, repository, {}, { pageSize: 500 });
  const latestByType = new Map<string, DailyCareRecord>();
  for (const record of page.records) if (!latestByType.has(record.careType)) latestByType.set(record.careType, record);
  return { residentId, latestByType, followUpRequired: page.records.filter((record) => record.followUpRequired), total: page.total };
}

function toRecord(command: RecordDailyCareCommand, operational: DailyCareOperationalContext, authorization: DailyCareAuthorizationContext, id: string, correctionOfDailyCareRecordId?: string): DailyCareRecord {
  return {
    ...command,
    id,
    recordedAt: operational.recordedAt,
    recordedByUserAccountId: authorization.userAccountId,
    recordedByStaffMemberId: authorization.staffMemberId,
    shiftId: operational.shiftId,
    wardId: command.wardId ?? operational.wardId,
    roomId: command.roomId ?? operational.roomId,
    bedId: command.bedId ?? operational.bedId,
    rltDomainIds: resolveDailyCareRltDomains(command.careType, command.details),
    followUpWorkItemIds: [],
    correctionOfDailyCareRecordId,
    createdAt: operational.recordedAt,
    updatedAt: operational.recordedAt,
  };
}

function reconcileLinkedWorkItem(record: DailyCareRecord, repository: DailyCareRepository, authorization: DailyCareAuthorizationContext) {
  if (!record.relatedWorkItemId || !repository.workState) return;
  const workAuth: WorkAuthContext = {
    userAccountId: authorization.userAccountId,
    staffMemberId: authorization.staffMemberId,
    roleKeys: [],
    authorisedNursingHomeIds: authorization.authorisedNursingHomeIds,
    authorisedWardIds: authorization.authorisedWardIds ?? [],
    capabilities: authorization.capabilities,
    sourceCapabilities: authorization.sourceCapabilities ?? authorization.capabilities,
  };
  if (record.status === "completed") repository.workState = completeWorkItem(repository.workState, String(record.relatedWorkItemId), workAuth, { evidenceEntityType: "daily_care_record", evidenceEntityId: record.id, occurredAt: record.recordedAt, effectiveAt: record.occurredAt, correlationId: record.clientRequestId });
  else if (record.status === "not_required") repository.workState = legacyMarkWorkItemNotApplicable(repository.workState, String(record.relatedWorkItemId), workAuth, { reasonCode: record.statusReason ?? "not_required", reasonText: record.statusReason, evidenceEntityType: "daily_care_record", evidenceEntityId: record.id, occurredAt: record.recordedAt, correlationId: record.clientRequestId });
  else if (["partially_completed", "declined", "unable_to_complete"].includes(record.status)) repository.workState = legacyMarkWorkItemMissed(repository.workState, String(record.relatedWorkItemId), workAuth, { reasonCode: record.status, reasonText: record.statusReason, evidenceEntityType: "daily_care_record", evidenceEntityId: record.id, occurredAt: record.recordedAt, followUpRequired: record.followUpRequired, correlationId: record.clientRequestId });
}

function eventTypeFor(record: DailyCareRecord): DailyCareDomainEventType {
  if (record.status === "partially_completed") return "DailyCarePartiallyCompleted";
  if (record.status === "declined") return "DailyCareDeclined";
  if (record.status === "unable_to_complete") return "DailyCareUnableToComplete";
  return "DailyCareRecorded";
}

function eventFor(record: DailyCareRecord, type: DailyCareDomainEventType, authorization: DailyCareAuthorizationContext, operational: DailyCareOperationalContext) {
  return {
    eventId: asDomainEventId(`domain-event-daily-care-${record.id}-${type}`),
    eventType: type,
    eventVersion: 1,
    occurredAt: record.occurredAt,
    recordedAt: record.recordedAt,
    actor: { actorType: "user", userAccountId: authorization.userAccountId, staffMemberId: authorization.staffMemberId },
    scope: { nursingHomeId: record.nursingHomeId, wardId: record.wardId, roomId: record.roomId, bedId: record.bedId, shiftId: record.shiftId, timezone: operational.timezone },
    subject: { entityType: "daily_care_record", entityId: record.id, residentId: record.residentId },
    source: { module: "daily_care", service: "dailyCareService", operation: type },
    payload: { dailyCareRecordId: record.id, residentId: String(record.residentId), nursingHomeId: String(record.nursingHomeId), wardId: record.wardId ? String(record.wardId) : undefined, careType: record.careType, status: record.status, occurredAt: record.occurredAt, recordedAt: record.recordedAt, source: record.source, relatedCareActionId: record.relatedCareActionId ? String(record.relatedCareActionId) : undefined, relatedWorkItemId: record.relatedWorkItemId ? String(record.relatedWorkItemId) : undefined, rltDomainIds: record.rltDomainIds, actorUserAccountId: authorization.userAccountId, correlationId: operational.correlationId },
    correlationId: operational.correlationId,
  } satisfies DomainEvent<DailyCareDomainEventType, DailyCareRecord extends never ? never : any>;
}

function audit(record: DailyCareRecord, action: "create" | "correct" | "void", authorization: DailyCareAuthorizationContext, operational: DailyCareOperationalContext, reason?: string) {
  return recordAuditEvent({ action, entityType: "daily_care_record", entityId: record.id, parentEntityType: "resident", parentEntityId: String(record.residentId), occurredAt: operational.recordedAt, effectiveAt: record.occurredAt, actor: { userAccountId: authorization.userAccountId, staffMemberId: authorization.staffMemberId }, summary: `${record.careType.replaceAll("_", " ")} ${record.status.replaceAll("_", " ")}.`, reasonCode: reason ? "daily_care_correction" : undefined, reasonText: reason, scope: { nursingHomeId: String(record.nursingHomeId), wardId: record.wardId ? String(record.wardId) : undefined, roomId: record.roomId ? String(record.roomId) : undefined, bedId: record.bedId ? String(record.bedId) : undefined, residentId: String(record.residentId) }, requestId: record.clientRequestId, correlationId: operational.correlationId, metadata: { careType: record.careType, source: record.source } });
}

function requireView(authorization: DailyCareAuthorizationContext) {
  if (!authorization.capabilities.includes("daily_care.view")) throw new Error("Missing capability: daily_care.view");
}
