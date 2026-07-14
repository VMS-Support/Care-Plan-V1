import type {
  ClinicalEscalationActionContext,
  ClinicalEscalationContactAttempt,
  ClinicalEscalationEvent,
  ClinicalEscalationRecord,
  ClinicalEscalationRepository,
  ClinicalTransferDecision,
} from "./clinicalEscalationTypes";

export function recordClinicalEscalation(input: Omit<ClinicalEscalationRecord, "id" | "status" | "transferDecision" | "followUpRequired" | "createdAt" | "updatedAt"> & { transferDecision?: ClinicalTransferDecision; followUpRequired?: boolean }, repository: ClinicalEscalationRepository, context: ClinicalEscalationActionContext, createId: () => string) {
  requireCapability(context, "clinical_escalation.record");
  const record: ClinicalEscalationRecord = {
    ...input,
    id: createId(),
    status: "in_progress",
    transferDecision: input.transferDecision ?? "not_considered",
    followUpRequired: input.followUpRequired ?? false,
    createdAt: context.occurredAt,
    updatedAt: context.occurredAt,
  };
  repository.escalationRecords = [record, ...repository.escalationRecords];
  repository.escalationEvents.push(event(createId(), "ClinicalEscalationStarted", record, context, { reasonForContact: record.reasonForContact }));
  return record;
}

export function addClinicalEscalationContactAttempt(escalationRecordId: string, input: Omit<ClinicalEscalationContactAttempt, "id" | "escalationRecordId" | "recordedByUserAccountId" | "recordedByStaffMemberId">, repository: ClinicalEscalationRepository, context: ClinicalEscalationActionContext, createId: () => string) {
  requireCapability(context, "clinical_escalation.record");
  const record = getRecord(repository, escalationRecordId);
  const attempt: ClinicalEscalationContactAttempt = { ...input, id: createId(), escalationRecordId, recordedByUserAccountId: context.userAccountId, recordedByStaffMemberId: context.staffMemberId };
  repository.escalationContactAttempts = [...repository.escalationContactAttempts, attempt];
  repository.escalationEvents.push(event(createId(), "ClinicalEscalationContactAttempted", record, context, { targetType: attempt.targetType, method: attempt.method, outcome: attempt.outcome }));
  return attempt;
}

export function recordClinicalEscalationAdvice(escalationRecordId: string, adviceReceived: string, repository: ClinicalEscalationRepository, context: ClinicalEscalationActionContext, createId: () => string) {
  requireCapability(context, "clinical_escalation.record");
  const record = { ...getRecord(repository, escalationRecordId), adviceReceived, updatedAt: context.occurredAt };
  repository.escalationRecords = repository.escalationRecords.map((item) => item.id === record.id ? record : item);
  repository.escalationEvents.push(event(createId(), "ClinicalEscalationAdviceRecorded", record, context, { adviceRecorded: true }));
  return record;
}

export function recordClinicalEscalationDecision(escalationRecordId: string, decisionMade: string, repository: ClinicalEscalationRepository, context: ClinicalEscalationActionContext, createId: () => string) {
  requireCapability(context, "clinical_escalation.record");
  const record = { ...getRecord(repository, escalationRecordId), decisionMade, updatedAt: context.occurredAt };
  repository.escalationRecords = repository.escalationRecords.map((item) => item.id === record.id ? record : item);
  repository.escalationEvents.push(event(createId(), "ClinicalEscalationDecisionRecorded", record, context, { decisionRecorded: true }));
  return record;
}

export function recordClinicalTransferDecision(escalationRecordId: string, transferDecision: ClinicalTransferDecision, repository: ClinicalEscalationRepository, context: ClinicalEscalationActionContext, createId: () => string) {
  requireCapability(context, "clinical_transfer_decision.record");
  const record = { ...getRecord(repository, escalationRecordId), transferDecision, updatedAt: context.occurredAt };
  repository.escalationRecords = repository.escalationRecords.map((item) => item.id === record.id ? record : item);
  repository.escalationEvents.push(event(createId(), "ClinicalTransferDecisionRecorded", record, context, { transferDecision }));
  return record;
}

export function completeClinicalEscalation(escalationRecordId: string, outcomeSummary: string, repository: ClinicalEscalationRepository, context: ClinicalEscalationActionContext, createId: () => string) {
  requireCapability(context, "clinical_escalation.complete");
  const current = getRecord(repository, escalationRecordId);
  if (!current.decisionMade) throw new Error("Completed escalation requires a decision.");
  const record = { ...current, status: "completed" as const, outcomeSummary, completedAt: context.occurredAt, completedByUserAccountId: context.userAccountId, updatedAt: context.occurredAt };
  repository.escalationRecords = repository.escalationRecords.map((item) => item.id === record.id ? record : item);
  repository.escalationEvents.push(event(createId(), "ClinicalEscalationCompleted", record, context, { followUpRequired: record.followUpRequired, transferDecision: record.transferDecision }));
  return record;
}

function getRecord(repository: ClinicalEscalationRepository, id: string) {
  const record = repository.escalationRecords.find((item) => item.id === id);
  if (!record) throw new Error("Clinical escalation record was not found.");
  return record;
}

function requireCapability(context: ClinicalEscalationActionContext, capability: string) {
  if (!context.capabilities.includes(capability)) throw new Error(`Missing capability: ${capability}`);
}

function event(id: string, type: ClinicalEscalationEvent["type"], record: ClinicalEscalationRecord, context: ClinicalEscalationActionContext, payload: Record<string, unknown>): ClinicalEscalationEvent {
  return { id, type, residentId: record.residentId, nursingHomeId: record.nursingHomeId, wardId: record.wardId, issueId: record.deteriorationIssueId, escalationRecordId: record.id, occurredAt: context.occurredAt, actorUserAccountId: context.userAccountId, correlationId: context.correlationId, payload };
}
