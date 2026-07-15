import { createOrUpdateDeteriorationIssue } from "@/domain/deterioration/deteriorationIssueService";
import type { WorkItem } from "@/domain/work";
import { recordAuditEvent } from "@/lib/care/auditFramework";
import type {
  HcaEscalationAuthorizationContext,
  HcaEscalationEvent,
  HcaEscalationOperationalContext,
  HcaEscalationRepository,
  HcaNurseEscalation,
  SubmitHcaNurseEscalationCommand,
} from "./hcaEscalationTypes";
import { HCA_ESCALATION_REASON_LABELS } from "./hcaEscalationTypes";

export function submitHcaNurseEscalation(command: SubmitHcaNurseEscalationCommand, operational: HcaEscalationOperationalContext, authorization: HcaEscalationAuthorizationContext, repository: HcaEscalationRepository, createId: () => string) {
  const existing = repository.hcaNurseEscalations.find((item) => item.clientRequestId === command.clientRequestId && String(item.nursingHomeId) === command.nursingHomeId);
  if (existing) return { escalation: existing, idempotent: true };
  validate(command, operational, authorization, repository);
  const sourceRecords = (command.sourceDailyCareRecordIds || []).map((id) => repository.dailyCareRecords.find((record) => record.id === id)).filter(Boolean) as HcaEscalationRepository["dailyCareRecords"];
  const conciseConcern = command.conciseConcern?.trim() || summarizeEscalation(command, sourceRecords);
  const escalation: HcaNurseEscalation = {
    id: createId(),
    residentId: command.residentId,
    nursingHomeId: command.nursingHomeId,
    wardId: command.wardId || operational.wardId,
    roomId: command.roomId,
    reasonCode: command.reasonCode,
    conciseConcern,
    shortNote: command.shortNote?.slice(0, 240),
    observedAt: command.observedAt,
    escalatedAt: operational.occurredAt,
    immediateSafetyConcern: command.immediateSafetyConcern,
    sourceDailyCareRecordIds: command.sourceDailyCareRecordIds || [],
    sourceTrendType: command.sourceTrendType,
    sourceDeteriorationIssueId: command.sourceDeteriorationIssueId,
    escalatedByUserAccountId: authorization.userAccountId,
    escalatedByStaffMemberId: authorization.staffMemberId,
    targetAssignment: command.targetAssignment || "ward_nurse_queue",
    targetStaffMemberId: command.targetStaffMemberId,
    status: "submitted",
    clientRequestId: command.clientRequestId,
    createdAt: operational.occurredAt,
    updatedAt: operational.occurredAt,
  };

  repository.hcaNurseEscalations = [escalation, ...repository.hcaNurseEscalations];
  const issue = createOrUpdateDeteriorationIssue({
    residentId: command.residentId,
    nursingHomeId: command.nursingHomeId,
    wardId: escalation.wardId ? String(escalation.wardId) : undefined,
    roomId: escalation.roomId ? String(escalation.roomId) : undefined,
    issueType: "observation_deterioration",
    severity: command.immediateSafetyConcern ? "high" : "medium",
    title: "HCA Concern Escalated to Nurse",
    conciseSummary: conciseConcern,
    sourceReferences: [{
      sourceType: "other",
      sourceEntityId: escalation.id,
      occurredAt: operational.occurredAt,
      route: `/residents/${command.residentId}`,
      safeDisplayLabel: "HCA escalation",
    }],
    deduplicationKey: command.sourceDeteriorationIssueId || `hca_escalation:${command.nursingHomeId}:${command.residentId}:${command.reasonCode}`,
    clinicalEventAt: command.observedAt,
    rltDomainIds: Array.from(new Set(sourceRecords.flatMap((record) => record.rltDomainIds || []))),
  }, repository, createId, operational.correlationId);
  const workItem = createOrUpdateNurseReviewWorkItem(escalation, issue.id, operational, repository, createId);
  escalation.sourceDeteriorationIssueId = issue.id;
  escalation.nurseReviewWorkItemId = workItem.id;
  repository.hcaNurseEscalations = repository.hcaNurseEscalations.map((item) => item.id === escalation.id ? escalation : item);
  issue.escalationRecordIds = [...new Set([...issue.escalationRecordIds, escalation.id])];
  issue.activeWorkItemIds = [...new Set([...issue.activeWorkItemIds, String(workItem.id)])];
  repository.issues = repository.issues.map((item) => item.id === issue.id ? issue : item);
  repository.hcaEscalationEvents = [event(createId(), "HcaEscalationSubmitted", escalation, operational, { deteriorationIssueId: issue.id, nurseReviewWorkItemId: workItem.id }), ...repository.hcaEscalationEvents];
  repository.hcaEscalationAuditRecords = [recordAuditEvent({
    action: "create",
    entityType: "hca_nurse_escalation",
    entityId: escalation.id,
    parentEntityType: "resident",
    parentEntityId: command.residentId,
    occurredAt: operational.occurredAt,
    effectiveAt: command.observedAt,
    actor: { userAccountId: authorization.userAccountId, staffMemberId: authorization.staffMemberId },
    summary: `HCA escalation submitted: ${HCA_ESCALATION_REASON_LABELS[command.reasonCode]}.`,
    scope: { nursingHomeId: command.nursingHomeId, wardId: command.wardId, roomId: command.roomId, residentId: command.residentId },
    requestId: command.clientRequestId,
    correlationId: operational.correlationId,
    metadata: { reasonCode: command.reasonCode, immediateSafetyConcern: command.immediateSafetyConcern },
  }), ...repository.hcaEscalationAuditRecords];
  return { escalation, issue, workItem, idempotent: false };
}

export function summarizeEscalation(command: Pick<SubmitHcaNurseEscalationCommand, "reasonCode" | "sourceTrendType">, sourceRecords: HcaEscalationRepository["dailyCareRecords"] = []) {
  const latest = [...sourceRecords].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
  const base = HCA_ESCALATION_REASON_LABELS[command.reasonCode];
  if (!latest) return base;
  if (command.reasonCode === "reduced_food_intake") return `Food intake concern linked to ${sourceRecords.length} Daily Care record${sourceRecords.length === 1 ? "" : "s"}.`;
  if (command.reasonCode === "reduced_fluid_intake") return `Fluid intake concern linked to ${sourceRecords.length} Daily Care record${sourceRecords.length === 1 ? "" : "s"}.`;
  if (command.reasonCode === "repeated_refusal") return `Repeated care refusal concern linked to ${sourceRecords.length} Daily Care record${sourceRecords.length === 1 ? "" : "s"}.`;
  return `${base}. Latest source: ${latest.careType.replaceAll("_", " ")} recorded ${new Date(latest.occurredAt).toLocaleString()}.`;
}

function validate(command: SubmitHcaNurseEscalationCommand, operational: HcaEscalationOperationalContext, authorization: HcaEscalationAuthorizationContext, repository: HcaEscalationRepository) {
  if (!authorization.capabilities.includes("hca_escalation.submit")) throw new Error("Missing capability: hca_escalation.submit");
  if (!authorization.authorisedNursingHomeIds.includes(command.nursingHomeId) || command.nursingHomeId !== operational.nursingHomeId) throw new Error("Escalation is outside the authorised nursing home.");
  if (authorization.residentIds?.length && !authorization.residentIds.includes(command.residentId)) throw new Error("Resident is outside the authorised scope.");
  if (command.wardId && authorization.authorisedWardIds?.length && !authorization.authorisedWardIds.includes(command.wardId)) throw new Error("Ward is outside the authorised scope.");
  if (!Number.isFinite(Date.parse(command.observedAt))) throw new Error("Observed time is invalid.");
  for (const id of command.sourceDailyCareRecordIds || []) {
    const record = repository.dailyCareRecords.find((item) => item.id === id);
    if (!record) throw new Error("Source Daily Care record was not found.");
    if (String(record.residentId) !== command.residentId || String(record.nursingHomeId) !== command.nursingHomeId) throw new Error("Source Daily Care record does not belong to this resident.");
  }
  if (command.reasonCode === "other" && !command.conciseConcern?.trim()) throw new Error("Other concern requires a concise note.");
}

function createOrUpdateNurseReviewWorkItem(escalation: HcaNurseEscalation, issueId: string, operational: HcaEscalationOperationalContext, repository: HcaEscalationRepository, createId: () => string): WorkItem {
  const key = `hca_escalation:${escalation.id}:nurse-review`;
  const existing = repository.workItems.find((item) => item.source.sourceOccurrenceId === key && !["completed", "cancelled", "not_applicable"].includes(item.persistedStatus));
  if (existing) return existing;
  const work: WorkItem = {
    id: createId(),
    workType: "care_action",
    title: "Review HCA Escalation",
    summary: escalation.conciseConcern,
    source: {
      sourceType: "clinical_rule",
      sourceModule: "rules",
      sourceEntityType: "hca_nurse_escalation",
      sourceEntityId: escalation.id,
      sourceOccurrenceId: key,
      parentEntityType: "deterioration_issue",
      parentEntityId: issueId,
      correlationId: operational.correlationId,
      route: `/residents/${escalation.residentId}?careSection=deterioration&issue=${issueId}`,
      completionOwner: "hca_escalation",
      recreationPolicy: "manual_only",
      createdAt: operational.occurredAt,
    },
    nursingHomeId: escalation.nursingHomeId,
    wardId: escalation.wardId,
    roomId: escalation.roomId,
    residentId: escalation.residentId,
    schedule: { scheduleType: "triggered", dueAt: operational.occurredAt, effectiveDueAt: operational.occurredAt, timeZone: operational.timezone },
    persistedStatus: "scheduled",
    assignment: escalation.targetAssignment === "named_nurse" ? { assignmentType: "person", assignedStaffMemberId: escalation.targetStaffMemberId, assignedAt: operational.occurredAt, assignmentStatus: "active", assignmentReasonCode: "hca_escalation" } : escalation.targetAssignment === "cnm_queue" ? { assignmentType: "role", assignedRoleKey: "cnm", assignedWardId: escalation.wardId, assignedAt: operational.occurredAt, assignmentStatus: "active", assignmentReasonCode: "hca_escalation" } : { assignmentType: "ward", assignedWardId: escalation.wardId, assignedAt: operational.occurredAt, assignmentStatus: "active", assignmentReasonCode: "hca_escalation" },
    priority: escalation.immediateSafetyConcern ? "urgent" : "important",
    clinicalUrgency: escalation.immediateSafetyConcern ? "urgent_review" : "time_sensitive",
    recommendedActions: [{ code: "acknowledge_hca_escalation", label: "Acknowledge", route: `/residents/${escalation.residentId}` }],
    correlationId: operational.correlationId,
    createdAt: operational.occurredAt,
    updatedAt: operational.occurredAt,
    schemaVersion: 1,
  };
  repository.workItems = [work, ...repository.workItems];
  return work;
}

function event(id: string, type: HcaEscalationEvent["type"], escalation: HcaNurseEscalation, operational: HcaEscalationOperationalContext, payload: Record<string, unknown>): HcaEscalationEvent {
  return { id, type, escalationId: escalation.id, residentId: String(escalation.residentId), nursingHomeId: String(escalation.nursingHomeId), wardId: escalation.wardId ? String(escalation.wardId) : undefined, occurredAt: operational.occurredAt, actorUserAccountId: String(escalation.escalatedByUserAccountId), correlationId: operational.correlationId, payload: { reasonCode: escalation.reasonCode, immediateSafetyConcern: escalation.immediateSafetyConcern, sourceDailyCareRecordIds: escalation.sourceDailyCareRecordIds, sourceTrendType: escalation.sourceTrendType, ...payload } };
}
