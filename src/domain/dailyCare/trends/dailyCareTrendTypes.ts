import type { RltDomainId } from "@/lib/care/rlt";
import type { NursingHomeId, ResidentId, StaffMemberId, UserAccountId, WardId } from "@/types/entityIds";
import type { DailyCareRecord, DailyCareType } from "../dailyCareTypes";

export type DailyCareTrendType =
  | "reduced_food_intake"
  | "reduced_fluid_intake"
  | "no_bowel_movement"
  | "repeated_refusal"
  | "increased_assistance"
  | "altered_sleep"
  | "behavioural_change";

export type DailyCareTrendSeverity = "information" | "low" | "medium" | "high" | "critical";
export type DailyCareTrendPolicyStatus = "draft" | "approved" | "retired";

export interface ReducedFoodIntakeTrendConfiguration {
  type: "reduced_food_intake";
  mealTypesIncluded: Array<"breakfast" | "morning_snack" | "lunch" | "afternoon_snack" | "evening_meal" | "supper" | "other">;
  reducedIntakeValues: Array<"none" | "quarter" | "half">;
  minimumReducedMeals: number;
  minimumDistinctMealPeriods?: number;
  compareWithRecentBaseline: boolean;
  baselineLookbackMinutes?: number;
  includeRefusedMeals: boolean;
}

export interface ReducedFluidIntakeTrendConfiguration {
  type: "reduced_fluid_intake";
  minimumExpectedRecords?: number;
  minimumTotalIntakeMl?: number;
  reducedIntakeValues?: Array<"none" | "small_amount" | "half">;
  minimumReducedEntries?: number;
  compareWithRecentBaseline: boolean;
  baselineLookbackMinutes?: number;
  includeRefusedFluids: boolean;
  requireMeasuredAmountsForVolumeRule: boolean;
}

export interface NoBowelMovementTrendConfiguration {
  type: "no_bowel_movement";
  maximumHoursWithoutRecordedBowelMovement: number;
  requireActiveBowelMonitoringPlan?: boolean;
  excludeResidentsWithApprovedAlternativePattern?: boolean;
  residentBaselineSourceRequired?: boolean;
}

export interface RepeatedRefusalTrendConfiguration {
  type: "repeated_refusal";
  lookbackMinutes: number;
  minimumRefusalCount: number;
  groupBy: "same_care_type" | "same_source" | "related_rlt_domain" | "any_care";
  requireNurseNotPreviouslyInformed?: boolean;
  excludeResolvedRefusalEpisode?: boolean;
}

export interface IncreasedAssistanceTrendConfiguration {
  type: "increased_assistance";
  includedCareTypes: DailyCareType[];
  lookbackMinutes: number;
  comparisonLookbackMinutes: number;
  minimumCurrentRecordCount: number;
  minimumLevelIncrease: number;
  minimumOccurrencesAtHigherLevel: number;
  compareBy: "care_type" | "rlt_domain" | "overall_selected_care";
}

export interface AlteredSleepTrendConfiguration {
  type: "altered_sleep";
  lookbackMinutes: number;
  comparisonLookbackMinutes: number;
  concerningStates: Array<"awake" | "restless" | "frequently_waking" | "distressed">;
  minimumConcerningRecords: number;
  minimumEstimatedSleepReductionMinutes?: number;
  compareWithRecentPattern: boolean;
}

export interface BehaviouralChangeTrendConfiguration {
  type: "behavioural_change";
  lookbackMinutes: number;
  comparisonLookbackMinutes: number;
  minimumBehaviourRecords: number;
  triggerOnSignificantChangeFlag: boolean;
  triggerOnRiskToSelfOrOthers: boolean;
  triggerOnNewBehaviourCode: boolean;
  triggerOnIncreasedFrequency: boolean;
}

export type DailyCareTrendTriggerConfiguration =
  | ReducedFoodIntakeTrendConfiguration
  | ReducedFluidIntakeTrendConfiguration
  | NoBowelMovementTrendConfiguration
  | RepeatedRefusalTrendConfiguration
  | IncreasedAssistanceTrendConfiguration
  | AlteredSleepTrendConfiguration
  | BehaviouralChangeTrendConfiguration;

export interface DailyCareTrendPolicy {
  id: string;
  name: string;
  version: number;
  trendType: DailyCareTrendType;
  status: DailyCareTrendPolicyStatus;
  nursingHomeId?: NursingHomeId | string;
  enterpriseId?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  lookbackMinutes: number;
  minimumRecordCount?: number;
  triggerConfiguration: DailyCareTrendTriggerConfiguration;
  createDeteriorationIssue: boolean;
  createNurseReviewWorkItem: boolean;
  defaultSeverity: DailyCareTrendSeverity;
  assignmentPolicy: "ward_queue" | "role_queue" | "team" | "unassigned";
  assignedRoleKey?: string;
  assignedTeamId?: string;
  dueOffsetMinutes?: number;
  sourcePolicyDocumentId?: string;
  approvedByUserAccountId?: UserAccountId | string;
  approvedByStaffMemberId?: StaffMemberId | string;
  approvedAt?: string;
}

export interface RuleExplanation {
  summary: string;
  reasons: string[];
  evidence: Array<{ dailyCareRecordId: string; occurredAt: string; label: string }>;
}

export interface DailyCareTrendEvaluationResult {
  status: "matched" | "not_matched" | "insufficient_data" | "policy_unavailable" | "suppressed";
  trendType: DailyCareTrendType;
  residentId: ResidentId | string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  dateFrom: string;
  dateTo: string;
  evidenceRecordIds: string[];
  evidenceCount: number;
  previousPatternSummary?: string;
  currentPatternSummary?: string;
  severity: DailyCareTrendSeverity;
  createDeteriorationIssue: boolean;
  createNurseReviewWorkItem: boolean;
  dueAt?: string;
  rltDomainIds: RltDomainId[];
  policyId: string;
  policyVersion: number;
  explanation: RuleExplanation;
}

export interface DailyCareTrendRepository {
  dailyCareTrendPolicies: DailyCareTrendPolicy[];
  dailyCareTrendEvaluations: DailyCareTrendEvaluationResult[];
}

export const DAILY_CARE_TREND_TITLES: Record<DailyCareTrendType, string> = {
  reduced_food_intake: "Reduced Food Intake",
  reduced_fluid_intake: "Reduced Fluid Intake",
  no_bowel_movement: "No Bowel Movement Recorded",
  repeated_refusal: "Repeated Care Refusal",
  increased_assistance: "Increased Assistance Recorded",
  altered_sleep: "Sleep Pattern Changed",
  behavioural_change: "Behavioural Change Recorded",
};

export function validTrendRecords(records: DailyCareRecord[], residentId: string, nursingHomeId: string) {
  return records
    .filter((record) => String(record.residentId) === residentId && String(record.nursingHomeId) === nursingHomeId)
    .filter((record) => record.status !== "entered_in_error" && record.status !== "corrected")
    .filter((record) => Number.isFinite(Date.parse(record.occurredAt)))
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}
