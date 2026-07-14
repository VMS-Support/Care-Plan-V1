import type { ResidentObservationRecord } from "@/domain/observations/observationTypes";
import type {
  ResidentWeightIntelligence,
  ResidentWeightScheduleSummary,
  WeightChangeResult,
  WeightComparisonQuality,
  WeightComparisonWarning,
  WeightComparisonWindowPolicy,
  WeightDueStatus,
  WeightMeasurementMethod,
  WeightMeasurementSummary,
  WeightPeriodChangeResult,
} from "./weightIntelligenceTypes";
import { DEFAULT_WEIGHT_COMPARISON_POLICY } from "./weightIntelligenceTypes";

export interface ResidentWeightIntelligenceCalculationInput {
  residentId: string;
  nursingHomeId: string;
  records: ResidentObservationRecord[];
  schedule?: ResidentWeightScheduleSummary;
  policy?: WeightComparisonWindowPolicy;
  generatedAt: string;
}

export function getValidResidentWeightObservations(records: ResidentObservationRecord[], residentId: string, nursingHomeId: string): WeightMeasurementSummary[] {
  return records
    .filter((record) => record.residentId === residentId && record.nursingHomeId === nursingHomeId && record.status === "completed")
    .filter((record) => !record.correctionOfObservationRecordId)
    .flatMap((record) => {
      const component = record.components.find((item) => item.observationType === "weight" && item.value !== undefined && item.unit === "kilograms");
      if (!component || component.value === undefined || component.value <= 0 || !record.observedAt) return [];
      const details = component.details ?? {};
      const method = typeof details.measurementMethod === "string" ? details.measurementMethod as WeightMeasurementMethod : undefined;
      const estimated = details.estimated === true || method === "estimated";
      return [{
        observationRecordId: record.id,
        weightKg: component.value,
        observedAt: record.observedAt,
        recordedAt: record.recordedAt,
        measurementMethod: method,
        estimated,
        recordedByStaffMemberId: record.recordedByStaffMemberId,
        route: `/residents/${record.residentId}?careSection=vitals&observation=${record.id}`,
      }];
    })
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt) || a.observationRecordId.localeCompare(b.observationRecordId));
}

export function calculateResidentWeightIntelligence(input: ResidentWeightIntelligenceCalculationInput): ResidentWeightIntelligence {
  const policy = input.policy ?? DEFAULT_WEIGHT_COMPARISON_POLICY;
  const measurements = getValidResidentWeightObservations(input.records, input.residentId, input.nursingHomeId);
  const latest = measurements.at(-1);
  const previous = latest ? selectPreviousComparable(latest, measurements.slice(0, -1), policy) : undefined;
  const schedule = input.schedule ?? { active: false };
  const dataWarnings: WeightComparisonWarning[] = [];
  if (measurements.length > 0 && measurements.length < 2) dataWarnings.push("limited_weight_history");

  const result: ResidentWeightIntelligence = {
    residentId: input.residentId,
    nursingHomeId: input.nursingHomeId,
    generatedAt: input.generatedAt,
    latestWeight: latest,
    previousWeight: previous,
    changeFromPrevious: latest && previous ? calculateWeightChange(latest, previous, policy) : undefined,
    thirtyDayChange: latest ? calculatePeriodChange("thirty_days", latest, measurements, addDays(latest.observedAt, -30), policy, input.generatedAt) : undefined,
    threeMonthChange: latest ? calculatePeriodChange("three_months", latest, measurements, addMonths(latest.observedAt, -3), policy, input.generatedAt) : undefined,
    sixMonthChange: latest ? calculatePeriodChange("six_months", latest, measurements, addMonths(latest.observedAt, -6), policy, input.generatedAt) : undefined,
    schedule,
    missingOrOverdue: getResidentWeightDueStatus(latest, schedule, input.generatedAt),
    mustAssessment: { status: "not_found" },
    eatingAndDrinkingCarePlan: { hasActiveEatingAndDrinkingPlan: false, status: "not_found" },
    activeWork: { activeCount: 0, overdueCount: 0, items: [] },
    dataQuality: {
      warnings: [...new Set(dataWarnings)],
      validMeasurementCount: measurements.length,
      estimatedMeasurementCount: measurements.filter((item) => item.estimated).length,
    },
  };

  return result;
}

export function selectWeightComparisonMeasurement(current: WeightMeasurementSummary, historical: WeightMeasurementSummary[], targetDate: string, policy: WeightComparisonWindowPolicy, period: "thirty_days" | "three_months" | "six_months") {
  const window = period === "thirty_days" ? policy.thirtyDayWindow : period === "three_months" ? policy.threeMonthWindow : policy.sixMonthWindow;
  const target = Date.parse(targetDate);
  const start = target - window.beforeDays * 86400000;
  const end = target + window.afterDays * 86400000;
  const candidates = historical
    .filter((item) => item.observedAt < current.observedAt)
    .filter((item) => policy.allowEstimatedComparison || !item.estimated)
    .map((item) => ({ item, distance: Math.abs(Date.parse(item.observedAt) - target), observed: Date.parse(item.observedAt) }))
    .filter(({ observed }) => observed >= start && observed <= end);
  if (!candidates.length) return undefined;
  return candidates.sort((a, b) => {
    if (policy.selectionStrategy === "closest_before_target") {
      const aBefore = a.observed <= target ? 0 : 1;
      const bBefore = b.observed <= target ? 0 : 1;
      if (aBefore !== bBefore) return aBefore - bBefore;
    }
    if (policy.selectionStrategy === "latest_inside_window" && a.observed !== b.observed) return b.observed - a.observed;
    if (a.distance !== b.distance) return a.distance - b.distance;
    if (a.item.estimated !== b.item.estimated) return a.item.estimated ? 1 : -1;
    if (policy.preferSameMeasurementMethod && a.item.measurementMethod !== b.item.measurementMethod) {
      if (a.item.measurementMethod === current.measurementMethod) return -1;
      if (b.item.measurementMethod === current.measurementMethod) return 1;
    }
    if (a.observed !== b.observed) return b.observed - a.observed;
    return a.item.observationRecordId.localeCompare(b.item.observationRecordId);
  })[0].item;
}

export function calculateWeightChange(current: WeightMeasurementSummary, comparison: WeightMeasurementSummary, policy: WeightComparisonWindowPolicy): WeightChangeResult {
  const changeKg = round(current.weightKg - comparison.weightKg);
  const changePercent = round((changeKg / comparison.weightKg) * 100);
  const lossPercent = round(Math.max(0, ((comparison.weightKg - current.weightKg) / comparison.weightKg) * 100));
  const warnings = comparisonWarnings(current, comparison);
  return {
    currentObservationRecordId: current.observationRecordId,
    comparisonObservationRecordId: comparison.observationRecordId,
    currentWeightKg: current.weightKg,
    comparisonWeightKg: comparison.weightKg,
    changeKg,
    changePercent,
    lossPercent,
    direction: changeKg < 0 ? "loss" : changeKg > 0 ? "gain" : "no_change",
    currentObservedAt: current.observedAt,
    comparisonObservedAt: comparison.observedAt,
    elapsedDays: elapsedDays(comparison.observedAt, current.observedAt),
    comparisonQuality: comparisonQuality(current, comparison, warnings, policy),
    warnings,
  };
}

function calculatePeriodChange(period: "thirty_days" | "three_months" | "six_months", current: WeightMeasurementSummary, measurements: WeightMeasurementSummary[], targetDate: string, policy: WeightComparisonWindowPolicy, generatedAt: string): WeightPeriodChangeResult {
  const historical = measurements.filter((item) => item.observationRecordId !== current.observationRecordId && item.observedAt < current.observedAt);
  if (!historical.length) return emptyPeriod(period, current, targetDate, "insufficient_history");
  const comparison = selectWeightComparisonMeasurement(current, historical, targetDate, policy, period);
  if (!comparison) {
    const onlyEstimated = historical.some((item) => item.estimated);
    return emptyPeriod(period, current, targetDate, onlyEstimated && !policy.allowEstimatedComparison ? "comparison_not_permitted" : "comparison_not_available");
  }
  const change = calculateWeightChange(current, comparison, policy);
  const distanceFromTargetDays = Math.round(Math.abs(Date.parse(comparison.observedAt) - Date.parse(targetDate)) / 86400000);
  const warnings = [...change.warnings, ...(outsidePreferredWindow(period, distanceFromTargetDays, policy) ? ["comparison_outside_preferred_window" as const] : [])];
  return {
    period,
    currentObservationRecordId: current.observationRecordId,
    comparisonObservationRecordId: comparison.observationRecordId,
    currentWeightKg: current.weightKg,
    comparisonWeightKg: comparison.weightKg,
    changeKg: change.changeKg,
    changePercent: change.changePercent,
    lossPercent: change.lossPercent,
    direction: change.direction,
    targetDate,
    comparisonObservedAt: comparison.observedAt,
    distanceFromTargetDays,
    elapsedDays: change.elapsedDays,
    status: "calculated",
    comparisonQuality: change.comparisonQuality,
    warnings,
  };
}

export function getResidentWeightDueStatus(latest: WeightMeasurementSummary | undefined, schedule: ResidentWeightScheduleSummary, now: string): WeightDueStatus {
  if (!latest && schedule.active) return { status: "missing_initial_weight", expectedDueAt: schedule.nextDueAt, sourceScheduleId: schedule.scheduleId, explanation: "No valid structured weight is recorded for this resident." };
  if (!schedule.active) return { status: "not_scheduled", lastValidWeightAt: latest?.observedAt, explanation: "No active weight schedule is configured." };
  const dueAt = schedule.nextDueAt || schedule.lastDueAt;
  if (!dueAt) return { status: "schedule_error", lastValidWeightAt: latest?.observedAt, sourceScheduleId: schedule.scheduleId, explanation: "The active schedule has no due time." };
  const grace = schedule.gracePeriodMinutes ?? 0;
  const diffMinutes = Math.floor((Date.parse(now) - Date.parse(dueAt)) / 60000);
  if (diffMinutes > grace) return { status: "overdue", lastValidWeightAt: latest?.observedAt, expectedDueAt: dueAt, overdueMinutes: diffMinutes - grace, overdueDays: Math.floor((diffMinutes - grace) / 1440), sourceScheduleId: schedule.scheduleId, explanation: "The resident's scheduled weight is overdue." };
  if (diffMinutes >= 0) return { status: "due_now", lastValidWeightAt: latest?.observedAt, expectedDueAt: dueAt, sourceScheduleId: schedule.scheduleId, explanation: "The resident's scheduled weight is due now." };
  if (diffMinutes >= -1440) return { status: "due_soon", lastValidWeightAt: latest?.observedAt, expectedDueAt: dueAt, sourceScheduleId: schedule.scheduleId, explanation: "The next scheduled weight is due within 24 hours." };
  return { status: "not_yet_due", lastValidWeightAt: latest?.observedAt, expectedDueAt: dueAt, sourceScheduleId: schedule.scheduleId, explanation: "The resident's scheduled weight is not yet due." };
}

function selectPreviousComparable(current: WeightMeasurementSummary, historical: WeightMeasurementSummary[], policy: WeightComparisonWindowPolicy) {
  return historical.filter((item) => policy.allowEstimatedComparison || !item.estimated).at(-1);
}

function emptyPeriod(period: WeightPeriodChangeResult["period"], current: WeightMeasurementSummary, targetDate: string, status: WeightPeriodChangeResult["status"]): WeightPeriodChangeResult {
  return { period, currentObservationRecordId: current.observationRecordId, currentWeightKg: current.weightKg, targetDate, status, warnings: ["limited_weight_history"] };
}

function comparisonWarnings(current: WeightMeasurementSummary, comparison: WeightMeasurementSummary): WeightComparisonWarning[] {
  const warnings: WeightComparisonWarning[] = [];
  if (current.estimated) warnings.push("current_weight_estimated");
  if (comparison.estimated) warnings.push("comparison_weight_estimated");
  if (current.measurementMethod && comparison.measurementMethod && current.measurementMethod !== comparison.measurementMethod) warnings.push("measurement_methods_differ");
  if (elapsedDays(comparison.observedAt, current.observedAt) > 210) warnings.push("long_gap_between_measurements");
  if (elapsedDays(comparison.observedAt, current.observedAt) === 0) warnings.push("possible_duplicate_measurement");
  return warnings;
}

function comparisonQuality(current: WeightMeasurementSummary, comparison: WeightMeasurementSummary, warnings: WeightComparisonWarning[], policy: WeightComparisonWindowPolicy): WeightComparisonQuality {
  if (!warnings.length && (!policy.preferSameMeasurementMethod || current.measurementMethod === comparison.measurementMethod)) return "high";
  if (warnings.some((item) => ["long_gap_between_measurements", "comparison_weight_estimated", "measurement_methods_differ"].includes(item))) return "limited";
  return "acceptable";
}

function outsidePreferredWindow(period: "thirty_days" | "three_months" | "six_months", distanceDays: number, policy: WeightComparisonWindowPolicy) {
  const window = period === "thirty_days" ? policy.thirtyDayWindow : period === "three_months" ? policy.threeMonthWindow : policy.sixMonthWindow;
  return distanceDays > Math.max(window.beforeDays, window.afterDays);
}

function elapsedDays(from: string, to: string) { return Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 86400000)); }
function addDays(value: string, days: number) { const d = new Date(value); d.setDate(d.getDate() + days); return d.toISOString(); }
function addMonths(value: string, months: number) { const d = new Date(value); d.setMonth(d.getMonth() + months); return d.toISOString(); }
function round(value: number) { return Math.round(value * 10) / 10; }
