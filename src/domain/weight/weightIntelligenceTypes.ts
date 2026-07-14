export type WeightMeasurementMethod =
  | "standing_scale"
  | "chair_scale"
  | "hoist_scale"
  | "bed_scale"
  | "estimated"
  | "other";

export interface WeightMeasurementContext {
  measurementMethod: WeightMeasurementMethod;
  estimated: boolean;
  equipmentId?: string;
  clothingContext?: string;
  notes?: string;
}

export interface WeightMeasurementSummary {
  observationRecordId: string;
  weightKg: number;
  observedAt: string;
  recordedAt: string;
  measurementMethod?: WeightMeasurementMethod;
  estimated: boolean;
  recordedByStaffMemberId?: string;
  route: string;
}

export type WeightComparisonWarning =
  | "current_weight_estimated"
  | "comparison_weight_estimated"
  | "measurement_methods_differ"
  | "comparison_outside_preferred_window"
  | "long_gap_between_measurements"
  | "possible_duplicate_measurement"
  | "height_missing_for_bmi"
  | "limited_weight_history";

export type WeightComparisonQuality = "high" | "acceptable" | "limited";
export type WeightComparisonPeriod = "previous" | "thirty_days" | "three_months" | "six_months";

export interface WeightComparisonWindowPolicy {
  thirtyDayWindow: { beforeDays: number; afterDays: number };
  threeMonthWindow: { beforeDays: number; afterDays: number };
  sixMonthWindow: { beforeDays: number; afterDays: number };
  selectionStrategy: "closest_to_target" | "closest_before_target" | "latest_inside_window";
  allowEstimatedComparison: boolean;
  preferSameMeasurementMethod: boolean;
}

export interface WeightChangeResult {
  currentObservationRecordId: string;
  comparisonObservationRecordId: string;
  currentWeightKg: number;
  comparisonWeightKg: number;
  changeKg: number;
  changePercent: number;
  lossPercent: number;
  direction: "loss" | "gain" | "no_change";
  currentObservedAt: string;
  comparisonObservedAt: string;
  elapsedDays: number;
  comparisonQuality: WeightComparisonQuality;
  warnings: WeightComparisonWarning[];
}

export interface WeightPeriodChangeResult {
  period: WeightComparisonPeriod;
  currentObservationRecordId: string;
  comparisonObservationRecordId?: string;
  currentWeightKg: number;
  comparisonWeightKg?: number;
  changeKg?: number;
  changePercent?: number;
  lossPercent?: number;
  direction?: "loss" | "gain" | "no_change";
  targetDate: string;
  comparisonObservedAt?: string;
  distanceFromTargetDays?: number;
  elapsedDays?: number;
  status: "calculated" | "comparison_not_available" | "insufficient_history" | "invalid_measurement" | "comparison_not_permitted";
  comparisonQuality?: WeightComparisonQuality;
  warnings: WeightComparisonWarning[];
}

export interface ResidentWeightScheduleSummary {
  scheduleId?: string;
  active: boolean;
  frequencyLabel?: string;
  scheduleType?: "weekly" | "fortnightly" | "monthly" | "custom" | "one_off" | "triggered";
  lastDueAt?: string;
  nextDueAt?: string;
  gracePeriodMinutes?: number;
  sourceType?: string;
  sourceEntityId?: string;
  assignmentLabel?: string;
  route?: string;
}

export type WeightDueStatusCode =
  | "not_scheduled"
  | "not_yet_due"
  | "due_soon"
  | "due_now"
  | "overdue"
  | "missing_initial_weight"
  | "schedule_error";

export interface WeightDueStatus {
  status: WeightDueStatusCode;
  lastValidWeightAt?: string;
  expectedDueAt?: string;
  overdueMinutes?: number;
  overdueDays?: number;
  sourceScheduleId?: string;
  relatedWorkItemId?: string;
  explanation: string;
}

export interface WeightConcernSummary {
  id: string;
  status: "open" | "acknowledged" | "escalated" | "resolved" | "dismissed";
  severity: "low" | "medium" | "high" | "critical";
  openedAt: string;
  latestDetectedAt: string;
  lossPercent: number;
  route: string;
}

export interface WeightMustAssessmentSummary {
  latestAssessmentId?: string;
  latestAssessmentDate?: string;
  status: "not_found" | "current" | "reassessment_due" | "reassessment_recommended";
  route?: string;
}

export interface WeightCarePlanCoverageSummary {
  hasActiveEatingAndDrinkingPlan: boolean;
  status: "active" | "review_due" | "overdue" | "not_found";
  route?: string;
}

export interface WeightWorkSummary {
  activeCount: number;
  overdueCount: number;
  items: Array<{ id: string; title: string; dueAt?: string; route?: string }>;
}

export interface WeightDataQualitySummary {
  warnings: WeightComparisonWarning[];
  validMeasurementCount: number;
  estimatedMeasurementCount: number;
}

export interface ResidentWeightIntelligence {
  residentId: string;
  nursingHomeId: string;
  generatedAt: string;
  latestWeight?: WeightMeasurementSummary;
  previousWeight?: WeightMeasurementSummary;
  changeFromPrevious?: WeightChangeResult;
  thirtyDayChange?: WeightPeriodChangeResult;
  threeMonthChange?: WeightPeriodChangeResult;
  sixMonthChange?: WeightPeriodChangeResult;
  schedule: ResidentWeightScheduleSummary;
  missingOrOverdue: WeightDueStatus;
  currentConcern?: WeightConcernSummary;
  mustAssessment: WeightMustAssessmentSummary;
  eatingAndDrinkingCarePlan: WeightCarePlanCoverageSummary;
  activeWork: WeightWorkSummary;
  dataQuality: WeightDataQualitySummary;
}

export const DEFAULT_WEIGHT_COMPARISON_POLICY: WeightComparisonWindowPolicy = {
  thirtyDayWindow: { beforeDays: 14, afterDays: 14 },
  threeMonthWindow: { beforeDays: 30, afterDays: 30 },
  sixMonthWindow: { beforeDays: 45, afterDays: 45 },
  selectionStrategy: "closest_to_target",
  allowEstimatedComparison: false,
  preferSameMeasurementMethod: true,
};
