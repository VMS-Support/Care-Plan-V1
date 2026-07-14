import type { WeightPeriodChangeResult } from "./weightIntelligenceTypes";

export interface WeightLossRuleConfiguration {
  id: string;
  version: number;
  status: "draft" | "pending_approval" | "approved" | "retired";
  nursingHomeId?: string;
  enterpriseId?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  lossThresholdPercent: number;
  comparisonPeriod: "thirty_days";
  severity: "medium" | "high" | "critical";
  createWeightConcern: boolean;
  requestMustReassessment: boolean;
  requestEatingAndDrinkingCarePlanReview: boolean;
  repeatWeightAfterDays?: number;
  approvedAt?: string;
  sourcePolicyReference?: string;
  explanationTemplate: string;
}

export interface WeightLossRuleEvaluation {
  status: "matched" | "not_matched" | "unavailable";
  residentId: string;
  nursingHomeId: string;
  evaluatedAt: string;
  ruleConfigurationId?: string;
  ruleVersion?: number;
  thresholdPercent?: number;
  periodResult?: WeightPeriodChangeResult;
  explanation: string;
}

export interface WeightConcernProjection {
  id: string;
  deduplicationKey: string;
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  status: "open" | "acknowledged" | "escalated" | "resolved" | "dismissed";
  severity: WeightLossRuleConfiguration["severity"];
  currentObservationRecordId: string;
  comparisonObservationRecordId: string;
  lossPercent: number;
  openedAt: string;
  latestDetectedAt: string;
  explanation: string;
  ruleConfigurationId: string;
  ruleVersion: number;
  mustGuidanceRequired: boolean;
  eatingAndDrinkingCarePlanReviewRequired: boolean;
  repeatWeightDueAt?: string;
}

export interface WeightConcernRepository {
  concerns: WeightConcernProjection[];
  events: Array<{ id: string; type: string; residentId: string; nursingHomeId: string; occurredAt: string; correlationId: string; payload: Record<string, unknown> }>;
}

export const DEFAULT_FIVE_PERCENT_WEIGHT_LOSS_RULE: WeightLossRuleConfiguration = {
  id: "weight-loss-5-percent-30-days",
  version: 1,
  status: "approved",
  effectiveFrom: "2026-01-01T00:00:00.000Z",
  lossThresholdPercent: 5,
  comparisonPeriod: "thirty_days",
  severity: "high",
  createWeightConcern: true,
  requestMustReassessment: true,
  requestEatingAndDrinkingCarePlanReview: true,
  repeatWeightAfterDays: 7,
  approvedAt: "2026-01-01T00:00:00.000Z",
  sourcePolicyReference: "Local Weight Monitoring Policy",
  explanationTemplate: "Weight loss threshold met using the approved 30-day comparison policy.",
};
