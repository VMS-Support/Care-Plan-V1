import type { WorkSchedule, WorkSourceReference, WorkSourceType } from "@/domain/work/workTypes";
import type { RecurrenceRule, WorkOccurrence } from "./recurrenceTypes";

export interface OccurrenceSourceLinkInput {
  sourceType: WorkSourceType;
  sourceModule: WorkSourceReference["sourceModule"];
  sourceEntityType: string;
  parentEntityType: string;
  route: string;
  completionOwner: string;
  correlationId?: string;
}

export function createOccurrenceSourceReference(
  occurrence: WorkOccurrence,
  rule: RecurrenceRule,
  input: OccurrenceSourceLinkInput,
): WorkSourceReference {
  if (String(occurrence.recurrenceRuleId) !== String(rule.id))
    throw new Error("Occurrence and recurrence rule do not match.");
  return {
    sourceType: input.sourceType,
    sourceModule: input.sourceModule,
    sourceEntityType: input.sourceEntityType,
    sourceEntityId: String(occurrence.id),
    sourceOccurrenceId: String(occurrence.id),
    parentEntityType: input.parentEntityType,
    parentEntityId: rule.sourceEntityId,
    createdByRuleId: rule.createdByRuleId,
    createdByRuleVersion: rule.createdByRuleVersion,
    sourceEventId: occurrence.triggerEventId,
    createdFromEventId: occurrence.triggerEventId,
    correlationId: input.correlationId,
    route: input.route,
    completionOwner: input.completionOwner,
    recreationPolicy: occurrence.triggerEventId ? "event_replay" : "deterministic",
    createdAt: occurrence.generatedAt,
  };
}

export function occurrenceToWorkSchedule(
  occurrence: WorkOccurrence,
  rule: RecurrenceRule,
): WorkSchedule {
  const scheduleType: WorkSchedule["scheduleType"] =
    rule.recurrenceType === "prn"
      ? "prn"
      : rule.recurrenceType === "triggered"
        ? "triggered"
        : rule.recurrenceType === "one_off"
          ? "one_off"
          : "recurring_occurrence";
  return {
    scheduleType,
    dueAt: occurrence.dueAt,
    effectiveDueAt: occurrence.effectiveDueAt,
    originalDueAt: occurrence.dueAt,
    recurrenceId: String(rule.id),
    occurrenceIndex: occurrence.occurrenceNumber,
    timeZone: occurrence.timezone,
  };
}
