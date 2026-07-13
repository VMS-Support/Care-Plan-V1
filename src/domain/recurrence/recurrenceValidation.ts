import type { RecurrenceRule, WorkOccurrence } from "./recurrenceTypes";
import { createDeterministicOccurrenceId } from "./recurrenceEngine";
import { isValidTimezone } from "./timezone";

export interface RecurrenceValidationReferences {
  nursingHomeIds: Set<string>;
  sourceExists: (sourceEntityId: string) => boolean;
  sourceNursingHomeId?: (sourceEntityId: string) => string | undefined;
}

export interface RecurrenceValidationIssue {
  severity: "critical" | "warning";
  code: string;
  entityId: string;
  message: string;
}

export function validateRecurrenceModel(
  rules: RecurrenceRule[],
  occurrences: WorkOccurrence[],
  references: RecurrenceValidationReferences,
) {
  const issues: RecurrenceValidationIssue[] = [];
  const add = (code: string, entityId: string, message: string) =>
    issues.push({ severity: "critical", code, entityId, message });
  const ruleIds = new Set<string>();
  for (const rule of rules) {
    const id = String(rule.id);
    if (ruleIds.has(id)) add("duplicate_rule_id", id, "Recurrence rule ID is duplicated.");
    ruleIds.add(id);
    if (!references.nursingHomeIds.has(String(rule.nursingHomeId)))
      add("unknown_home", id, "Recurrence rule nursing home does not exist.");
    if (!references.sourceExists(rule.sourceEntityId))
      add("orphan_rule", id, "Recurrence source does not exist.");
    const sourceHome = references.sourceNursingHomeId?.(rule.sourceEntityId);
    if (sourceHome && sourceHome !== String(rule.nursingHomeId))
      add("cross_home_rule", id, "Recurrence source belongs to another home.");
    if (!isValidTimezone(rule.timezone)) add("invalid_timezone", id, "Timezone is invalid.");
    if (!Number.isFinite(Date.parse(rule.startsAt)))
      add("invalid_start", id, "startsAt must be an ISO timestamp.");
    if (rule.endsAt && Date.parse(rule.endsAt) <= Date.parse(rule.startsAt))
      add("invalid_end", id, "endsAt must follow startsAt.");
    if ((rule.interval || 1) < 1) add("invalid_interval", id, "Interval must be at least one.");
    if (
      ["weekly", "selected_days"].includes(rule.recurrenceType) &&
      rule.selectedDays?.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
    )
      add("invalid_selected_day", id, "Selected days must use integers 0-6.");
    if (
      rule.recurrenceType === "selected_days" &&
      (!rule.selectedDays || rule.selectedDays.length === 0)
    )
      add("missing_selected_days", id, "Selected-days recurrence requires at least one day.");
    if (
      rule.recurrenceType === "monthly" &&
      rule.monthlyDay === undefined &&
      (rule.monthlyWeekday === undefined || rule.monthlyWeekOrdinal === undefined)
    )
      add("invalid_monthly_rule", id, "Monthly recurrence needs a day or weekday ordinal.");
    if (
      rule.recurrenceType === "custom_interval" &&
      (rule.customMinutes || 0) + (rule.customHours || 0) + (rule.customDays || 0) <= 0
    )
      add("invalid_custom_interval", id, "Custom interval must be greater than zero.");
    if (rule.recurrenceType === "triggered" && !rule.triggerEventTypes?.length)
      add("missing_trigger_types", id, "Triggered recurrence requires event types.");
  }
  const occurrenceIds = new Set<string>();
  for (const item of occurrences) {
    const id = String(item.id);
    if (occurrenceIds.has(id)) add("duplicate_occurrence", id, "Occurrence ID is duplicated.");
    occurrenceIds.add(id);
    if (item.recurrenceRuleId && !ruleIds.has(String(item.recurrenceRuleId)))
      add("orphan_occurrence", id, "Occurrence recurrence rule does not exist.");
    if (!references.sourceExists(item.sourceEntityId))
      add("orphan_occurrence_source", id, "Occurrence source does not exist.");
    if (!references.nursingHomeIds.has(String(item.nursingHomeId)))
      add("occurrence_unknown_home", id, "Occurrence nursing home does not exist.");
    if (!isValidTimezone(item.timezone))
      add("occurrence_invalid_timezone", id, "Timezone is invalid.");
    if (!item.triggerEventId && !item.triggerId && item.recurrenceRuleId) {
      const expected = createDeterministicOccurrenceId(
        item.sourceEntityId,
        String(item.recurrenceRuleId),
        item.dueAt,
      );
      if (id !== expected) add("non_deterministic_id", id, "Occurrence ID is not deterministic.");
    }
    if (item.effectiveDueAt && Number.isNaN(Date.parse(item.effectiveDueAt)))
      add("invalid_effective_due", id, "effectiveDueAt is invalid.");
  }
  return { valid: issues.length === 0, issues };
}
