import type {
  Assessment,
  ObservationScheduleItem,
  ProblemIntervention,
  Task,
} from "@/lib/care/types";
import type { RecurrenceRule, RecurrenceType } from "./recurrenceTypes";

export interface LegacyScheduleContext {
  nursingHomeId: string;
  timezone: string;
  residentId?: string;
  wardId?: string;
  now: string;
}

const base = (
  id: string,
  sourceEntityId: string,
  recurrenceType: RecurrenceType,
  startsAt: string,
  context: LegacyScheduleContext,
): RecurrenceRule => ({
  id,
  sourceEntityId,
  recurrenceType,
  active: true,
  nursingHomeId: context.nursingHomeId,
  residentId: context.residentId,
  wardId: context.wardId,
  startsAt,
  timezone: context.timezone,
  generatedHorizonDays: 30,
  createdAt: context.now,
  updatedAt: context.now,
});

export function adaptCareActionRecurrence(
  intervention: ProblemIntervention,
  context: LegacyScheduleContext,
) {
  const startsAt = `${intervention.startDate}T08:00:00.000Z`;
  const rule = base(
    `recurrence:care-action:${intervention.id}`,
    intervention.id,
    "one_off",
    startsAt,
    { ...context, residentId: intervention.residentId },
  );
  rule.active = intervention.status === "active";
  rule.endsAt = intervention.endDate ? `${intervention.endDate}T23:59:59.999Z` : undefined;
  rule.bedsideCare = true;
  const map: Partial<Record<ProblemIntervention["frequencyType"], Partial<RecurrenceRule>>> = {
    once: { recurrenceType: "one_off" },
    hourly: { recurrenceType: "hourly", interval: 1 },
    every_2_hours: { recurrenceType: "hourly", interval: 2 },
    every_4_hours: { recurrenceType: "hourly", interval: 4 },
    every_6_hours: { recurrenceType: "hourly", interval: 6 },
    twice_daily: { recurrenceType: "custom_interval", customHours: 12 },
    three_times_daily: { recurrenceType: "custom_interval", customHours: 8 },
    daily: { recurrenceType: "daily", interval: 1 },
    weekly: { recurrenceType: "weekly", interval: 1 },
    monthly: { recurrenceType: "monthly", monthlyDay: new Date(startsAt).getUTCDate() },
    per_shift: { recurrenceType: "each_shift" },
    prn: { recurrenceType: "prn", prnReasonRequired: true },
    custom: { recurrenceType: "custom_interval", customMinutes: intervention.frequencyValue },
  };
  return { ...rule, ...(map[intervention.frequencyType] || {}) };
}

export function adaptTaskRecurrence(task: Task, context: LegacyScheduleContext) {
  const startsAt = task.dueDate.includes("T")
    ? task.dueDate
    : `${task.dueDate}T${task.appointmentTime || "09:00"}:00.000Z`;
  const mapping: Record<NonNullable<Task["recurrence"]>, Partial<RecurrenceRule>> = {
    none: { recurrenceType: "one_off" },
    daily: { recurrenceType: "daily", interval: 1 },
    weekly: { recurrenceType: "weekly", interval: 1 },
    monthly: { recurrenceType: "monthly", monthlyDay: new Date(startsAt).getUTCDate() },
    custom: { recurrenceType: "custom_interval" },
  };
  return {
    ...base(`recurrence:task:${task.id}`, task.id, "one_off", startsAt, {
      ...context,
      nursingHomeId: task.facilityId || context.nursingHomeId,
      residentId: task.residentId,
    }),
    ...mapping[task.recurrence || "none"],
    active: !["completed", "deleted"].includes(task.status),
  };
}

export function adaptAssessmentRecurrence(assessment: Assessment, context: LegacyScheduleContext) {
  const startsAt = assessment.nextReassessmentDate || assessment.dueDate || assessment.reviewDate;
  if (!startsAt) return undefined;
  const frequency: Partial<
    Record<NonNullable<Assessment["reviewFrequency"]>, Partial<RecurrenceRule>>
  > = {
    weekly: { recurrenceType: "weekly", interval: 1 },
    monthly: { recurrenceType: "monthly", monthlyDay: new Date(startsAt).getUTCDate() },
    quarterly: {
      recurrenceType: "monthly",
      interval: 3,
      monthlyDay: new Date(startsAt).getUTCDate(),
    },
    six_monthly: {
      recurrenceType: "monthly",
      interval: 6,
      monthlyDay: new Date(startsAt).getUTCDate(),
    },
    annually: {
      recurrenceType: "monthly",
      interval: 12,
      monthlyDay: new Date(startsAt).getUTCDate(),
    },
    custom: { recurrenceType: "custom_interval", customDays: assessment.customReviewDays },
  };
  return {
    ...base(`recurrence:assessment:${assessment.id}`, assessment.id, "one_off", startsAt, {
      ...context,
      nursingHomeId: assessment.facilityId || context.nursingHomeId,
      residentId: assessment.residentId,
    }),
    ...(assessment.reviewFrequency ? frequency[assessment.reviewFrequency] : {}),
    active: !["completed", "archived", "deleted", "superseded"].includes(
      assessment.status || "draft",
    ),
  };
}

export function adaptObservationScheduleItem(
  scheduleId: string,
  item: ObservationScheduleItem,
  context: LegacyScheduleContext,
  startsAt: string,
) {
  const frequency: Record<ObservationScheduleItem["frequency"], Partial<RecurrenceRule>> = {
    "4_hourly": { recurrenceType: "hourly", interval: 4 },
    "8_hourly": { recurrenceType: "hourly", interval: 8 },
    "12_hourly": { recurrenceType: "hourly", interval: 12 },
    daily: { recurrenceType: "daily", interval: 1 },
    weekly: { recurrenceType: "weekly", interval: 1 },
    monthly: { recurrenceType: "monthly", monthlyDay: new Date(startsAt).getUTCDate() },
    prn: { recurrenceType: "prn", prnReasonRequired: true },
  };
  return {
    ...base(
      `recurrence:observation:${scheduleId}:${item.id}`,
      item.id,
      "one_off",
      startsAt,
      context,
    ),
    ...frequency[item.frequency],
    active: item.required,
    bedsideCare: true,
  };
}
