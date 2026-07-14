import { recordResidentObservations } from "./observationService";
import { sourceReferenceFromLaunch, type ObservationEntrySaveResult, type RecordResidentObservationsCommand } from "./observationEntryTypes";
import type { ResidentObservationRecord } from "./observationTypes";

export interface ObservationEntryRepository {
  records: ResidentObservationRecord[];
  clientRequestIds: Map<string, string>;
  save(record: ResidentObservationRecord): void;
  completeWorkItem?(workItemId: string, observationRecordId: string, residentId: string): boolean;
  createFollowUp?(input: { residentId: string; observationRecordId: string; dueAt: string; sourceWorkItemId?: string }): string;
}

export function saveObservationEntry(command: RecordResidentObservationsCommand, repository: ObservationEntryRepository, createId: () => string): ObservationEntrySaveResult {
  const context = command.launchContext;
  if (repository.clientRequestIds.has(command.clientRequestId)) return { observationRecordId: repository.clientRequestIds.get(command.clientRequestId)!, duplicate: true, sourceWorkItemCompleted: false, followUpRequested: false, returnRoute: context.returnRoute };
  if (context.residentId !== command.launchContext.residentId) throw new Error("Resident context does not match the observation request.");
  if (command.observedAt > command.recordedAt) throw new Error("Observed time cannot be after the recorded time.");
  if (command.backdatedEntryReason === "other" && !command.backdatedEntryOtherReason?.trim()) throw new Error("Enter the reason for the backdated observation.");
  const record = recordResidentObservations({
    residentId: context.residentId, nursingHomeId: context.nursingHomeId, wardId: context.wardId,
    roomId: context.roomId, bedId: context.bedId, observationSetType: command.observationSetType,
    observedAt: command.observedAt, recordedAt: command.recordedAt,
    recordedByUserAccountId: command.recordedByUserAccountId, recordedByStaffMemberId: command.recordedByStaffMemberId,
    observedByStaffMemberId: command.observedByStaffMemberId, timezone: command.timezone,
    clientRequestId: command.clientRequestId, components: command.components,
    source: sourceReferenceFromLaunch(context), relatedWorkItemId: context.workItemId,
    relatedRuleIssueId: context.ruleIssueId, notes: command.notes,
    backdatedEntryReason: command.backdatedEntryReason,
  }, createId);
  repository.save(record);
  repository.clientRequestIds.set(command.clientRequestId, record.id);
  const completed = context.workItemId ? repository.completeWorkItem?.(context.workItemId, record.id, context.residentId) === true : false;
  const followUp = command.escalation?.followUpRequired && command.escalation.followUpAt ? Boolean(repository.createFollowUp?.({ residentId: context.residentId, observationRecordId: record.id, dueAt: command.escalation.followUpAt, sourceWorkItemId: context.workItemId })) : false;
  return { observationRecordId: record.id, duplicate: false, sourceWorkItemCompleted: completed, followUpRequested: followUp, returnRoute: context.returnRoute };
}
