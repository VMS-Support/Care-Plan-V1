import type { ShiftDefinition } from "@/lib/care/types";
import type {
  GenerateOccurrencesInput,
  RecurrenceRule,
  ResidentSchedulingState,
  WorkOccurrence,
} from "./recurrenceTypes";
import {
  addLocalDays,
  getLocalDateTimeParts,
  localDateKey,
  localDaysBetween,
  localWeekday,
  zonedDateTimeToUtc,
} from "./timezone";

const DAY_MS = 86_400_000;
const encode = (value: string) => encodeURIComponent(value.trim().toLowerCase());
export const createDeterministicOccurrenceId = (
  sourceEntityId: string,
  recurrenceRuleId: string,
  dueAt: string,
) => `occurrence:${encode(sourceEntityId)}:${encode(recurrenceRuleId)}:${encode(dueAt)}`;

const occurrence = (
  rule: RecurrenceRule,
  dueAt: string,
  occurrenceNumber: number,
  generatedAt: string,
  extra: Partial<WorkOccurrence> = {},
): WorkOccurrence => ({
  id: createDeterministicOccurrenceId(rule.sourceEntityId, String(rule.id), dueAt),
  recurrenceRuleId: rule.id,
  nursingHomeId: rule.nursingHomeId,
  residentId: rule.residentId,
  wardId: rule.wardId,
  sourceEntityId: rule.sourceEntityId,
  dueAt,
  effectiveDueAt: dueAt,
  occurrenceNumber,
  generatedAt,
  cancelled: false,
  suspended: false,
  completed: false,
  timezone: rule.timezone,
  ...extra,
});

const customIntervalMinutes = (rule: RecurrenceRule) =>
  (rule.customMinutes || 0) + (rule.customHours || 0) * 60 + (rule.customDays || 0) * 1440;
const durationMinutes = (rule: RecurrenceRule) => {
  if (rule.recurrenceType === "hourly") return (rule.interval || 1) * 60;
  if (rule.recurrenceType === "custom_interval") return customIntervalMinutes(rule);
  return 0;
};
const endBoundary = (rule: RecurrenceRule, windowStart: number, requestedEnd?: string) => {
  const horizon = windowStart + (rule.generatedHorizonDays || 30) * DAY_MS;
  return Math.min(
    requestedEnd ? Date.parse(requestedEnd) : horizon,
    horizon,
    rule.endsAt ? Date.parse(rule.endsAt) : Number.POSITIVE_INFINITY,
  );
};
const dateAtAnchorTime = (
  date: Pick<ReturnType<typeof getLocalDateTimeParts>, "year" | "month" | "day">,
  anchor: ReturnType<typeof getLocalDateTimeParts>,
  timezone: string,
) =>
  zonedDateTimeToUtc(
    { ...date, hour: anchor.hour, minute: anchor.minute, second: anchor.second },
    timezone,
  );

const monthlyMatches = (
  rule: RecurrenceRule,
  date: Pick<ReturnType<typeof getLocalDateTimeParts>, "year" | "month" | "day">,
) => {
  const lastDay = new Date(Date.UTC(date.year, date.month, 0)).getUTCDate();
  if (rule.monthlyDay !== undefined)
    return date.day === (rule.monthlyDay === -1 ? lastDay : rule.monthlyDay);
  if (rule.monthlyWeekday === undefined || rule.monthlyWeekOrdinal === undefined) return false;
  if (localWeekday(date) !== rule.monthlyWeekday) return false;
  if (rule.monthlyWeekOrdinal === "last") return date.day + 7 > lastDay;
  return Math.ceil(date.day / 7) === rule.monthlyWeekOrdinal;
};

function generateDurationOccurrences(
  rule: RecurrenceRule,
  windowStart: number,
  end: number,
  generatedAt: string,
) {
  const intervalMs = durationMinutes(rule) * 60_000;
  const starts = Date.parse(rule.startsAt);
  const firstIndex = Math.max(0, Math.ceil((windowStart - starts) / intervalMs));
  const rows: WorkOccurrence[] = [];
  for (let index = firstIndex; ; index += 1) {
    const due = starts + index * intervalMs;
    if (due >= end || due < starts) break;
    const number = index + 1;
    if (rule.maxOccurrences && number > rule.maxOccurrences) break;
    rows.push(occurrence(rule, new Date(due).toISOString(), number, generatedAt));
  }
  return rows;
}

function generateCalendarOccurrences(
  rule: RecurrenceRule,
  windowStart: number,
  end: number,
  generatedAt: string,
) {
  const anchor = getLocalDateTimeParts(rule.startsAt, rule.timezone);
  const endLocal = getLocalDateTimeParts(new Date(end - 1), rule.timezone);
  const rows: WorkOccurrence[] = [];
  let number = 0;
  for (let dayOffset = 0; ; dayOffset += 1) {
    const date = addLocalDays(anchor, dayOffset);
    if (localDaysBetween(date, endLocal) < 0) break;
    const weekday = localWeekday(date);
    let matches = false;
    if (rule.recurrenceType === "daily") matches = dayOffset % (rule.interval || 1) === 0;
    if (rule.recurrenceType === "weekly") {
      const selected = rule.selectedDays?.length ? rule.selectedDays : [localWeekday(anchor)];
      matches =
        selected.includes(weekday) && Math.floor(dayOffset / 7) % (rule.interval || 1) === 0;
    }
    if (rule.recurrenceType === "selected_days") matches = !!rule.selectedDays?.includes(weekday);
    if (rule.recurrenceType === "monthly") {
      const monthsFromAnchor = (date.year - anchor.year) * 12 + (date.month - anchor.month);
      matches = monthsFromAnchor % (rule.interval || 1) === 0 && monthlyMatches(rule, date);
    }
    if (!matches) continue;
    number += 1;
    if (rule.maxOccurrences && number > rule.maxOccurrences) break;
    const dueAt = dateAtAnchorTime(date, anchor, rule.timezone);
    const due = Date.parse(dueAt);
    if (due >= windowStart && due < end && due >= Date.parse(rule.startsAt))
      rows.push(occurrence(rule, dueAt, number, generatedAt));
  }
  return rows;
}

function generateShiftOccurrences(
  rule: RecurrenceRule,
  windowStart: number,
  end: number,
  generatedAt: string,
  shifts: ShiftDefinition[],
) {
  const selected = shifts
    .filter(
      (shift) =>
        shift.active &&
        String(shift.nursingHomeId) === String(rule.nursingHomeId) &&
        (!rule.shiftIds?.length || rule.shiftIds.map(String).includes(String(shift.id))),
    )
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const anchor = getLocalDateTimeParts(rule.startsAt, rule.timezone);
  const endLocal = getLocalDateTimeParts(new Date(end - 1), rule.timezone);
  const rows: WorkOccurrence[] = [];
  let number = 0;
  for (let dayOffset = 0; ; dayOffset += 1) {
    const date = addLocalDays(anchor, dayOffset);
    if (localDaysBetween(date, endLocal) < 0) break;
    for (const shift of selected) {
      const [hour, minute] = shift.startsAt.split(":").map(Number);
      const dueAt = zonedDateTimeToUtc({ ...date, hour, minute, second: 0 }, rule.timezone);
      const due = Date.parse(dueAt);
      if (due < Date.parse(rule.startsAt)) continue;
      number += 1;
      if (rule.maxOccurrences && number > rule.maxOccurrences) return rows;
      if (due >= windowStart && due < end)
        rows.push(
          occurrence(rule, dueAt, number, generatedAt, {
            shiftId: shift.id,
            operationalDate: localDateKey(date),
          }),
        );
    }
  }
  return rows;
}

export function generateOccurrences(input: GenerateOccurrencesInput) {
  const { rule } = input;
  if (!rule.active || rule.recurrenceType === "prn" || rule.recurrenceType === "triggered")
    return [];
  const windowStart = Math.max(Date.parse(input.windowStart), Date.parse(rule.startsAt));
  const end = endBoundary(rule, windowStart, input.windowEnd);
  const generatedAt = input.generatedAt || new Date().toISOString();
  if (!Number.isFinite(windowStart) || !Number.isFinite(end) || end <= windowStart) return [];
  let generated: WorkOccurrence[];
  if (rule.recurrenceType === "one_off") {
    const due = Date.parse(rule.startsAt);
    generated =
      due >= windowStart && due < end ? [occurrence(rule, rule.startsAt, 1, generatedAt)] : [];
  } else if (["hourly", "custom_interval"].includes(rule.recurrenceType)) {
    generated = generateDurationOccurrences(rule, windowStart, end, generatedAt);
  } else if (rule.recurrenceType === "each_shift") {
    generated = generateShiftOccurrences(rule, windowStart, end, generatedAt, input.shifts || []);
  } else {
    generated = generateCalendarOccurrences(rule, windowStart, end, generatedAt);
  }
  const existing = new Map(
    (input.existingOccurrences || []).map((item) => [String(item.id), item]),
  );
  return generated.map((item) => existing.get(String(item.id)) || item);
}

export function createTriggeredOccurrence(
  rule: RecurrenceRule,
  event: { eventId: string; occurredAt: string; eventType: string; reason?: string },
  generatedAt = new Date().toISOString(),
) {
  if (rule.recurrenceType !== "triggered") throw new Error("Rule is not triggered recurrence.");
  if (!rule.active) throw new Error("Recurrence rule is inactive.");
  if (rule.triggerEventTypes?.length && !rule.triggerEventTypes.includes(event.eventType))
    throw new Error(`Event ${event.eventType} is not configured for this rule.`);
  const dueAt = event.occurredAt;
  return occurrence(rule, dueAt, 1, generatedAt, {
    id: `occurrence:${encode(rule.sourceEntityId)}:${encode(String(rule.id))}:event:${encode(event.eventId)}`,
    triggerEventId: event.eventId,
    triggerReason: event.reason,
  });
}

export function createPrnOccurrence(
  rule: RecurrenceRule,
  trigger: { id: string; at: string; reason?: string },
  generatedAt = new Date().toISOString(),
) {
  if (rule.recurrenceType !== "prn") throw new Error("Rule is not PRN recurrence.");
  if (!rule.active) throw new Error("Recurrence rule is inactive.");
  if (rule.prnReasonRequired && !trigger.reason?.trim())
    throw new Error("PRN trigger reason is required.");
  return occurrence(rule, trigger.at, 1, generatedAt, {
    id: `occurrence:${encode(rule.sourceEntityId)}:${encode(String(rule.id))}:prn:${encode(trigger.id)}`,
    triggerId: trigger.id,
    triggerReason: trigger.reason,
  });
}

export function reconcileOccurrenceEligibility(
  occurrences: WorkOccurrence[],
  input: { sourceActive: boolean; resident?: ResidentSchedulingState; now: string },
) {
  const now = Date.parse(input.now);
  return occurrences.map((item) => {
    if (item.completed || Date.parse(item.dueAt) < now) return item;
    if (!input.sourceActive)
      return { ...item, cancelled: true, cancellationReason: "source_inactive", suspended: false };
    if (
      input.resident &&
      ["discharged", "deceased", "inactive"].includes(input.resident.lifecycleStatus)
    )
      return {
        ...item,
        cancelled: true,
        cancellationReason: `resident_${input.resident.lifecycleStatus}`,
        suspended: false,
      };
    if (input.resident?.lifecycleStatus === "active" && input.resident.presenceStatus !== "in_home")
      return {
        ...item,
        suspended: true,
        suspensionReason: `resident_${input.resident.presenceStatus}`,
      };
    return item.cancelled ? item : { ...item, suspended: false, suspensionReason: undefined };
  });
}
