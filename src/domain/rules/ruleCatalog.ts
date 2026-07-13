import type { RuleDefinition } from "./ruleTypes";

export const RULE_ENGINE_STARTED_AT = "2026-07-13T00:00:00.000Z";

export interface CarePlanCoverageGapConfig {
  qualifyingRiskLevels: string[];
  assessmentTypeToRltDomainId: Record<string, string>;
}

export interface WeightLossRuleConfig {
  percentageThreshold: number;
  lookbackDays: number;
  minimumMeasurements: number;
  includeEstimatedWeights: boolean;
  recommendationCodes: string[];
}

export interface RepeatedMissedCareActionConfig {
  minimumMissedOccurrences: number;
  lookbackDays: number;
  scope: "same_care_action" | "same_problem" | "any_care_action";
}

export const DEFAULT_RULE_DEFINITIONS: RuleDefinition[] = [
  {
    id: "RULE-CAREPLAN-COVERAGE-001",
    version: 1,
    name: "Care-plan coverage gap after high-risk assessment",
    description: "Fixture-ready rule that can recommend a care-plan coverage review when an assessment risk level maps to an RLT domain with no active plan.",
    status: "pending_clinical_approval",
    category: "care_plan",
    triggerEventTypes: ["AssessmentCompleted", "AssessmentRiskChanged"],
    severity: "medium",
    configuration: {
      qualifyingRiskLevels: ["high", "very_high"],
      assessmentTypeToRltDomainId: {
        nutrition: "eating_drinking",
        must: "eating_drinking",
        falls: "mobilising",
        moving_handling: "mobilising",
        pressure: "maintaining_safe_environment",
      },
    } satisfies CarePlanCoverageGapConfig,
    requiredData: [
      { key: "resident", provider: "resident", required: true },
      { key: "assessment", provider: "assessments", required: true },
      { key: "activeCarePlans", provider: "care_plans", required: true },
    ],
    outputDefinitions: [
      {
        outputType: "care_plan_coverage_gap",
        outputCode: "CARE_PLAN_COVERAGE_GAP",
        requiresHumanConfirmation: true,
        deduplicationScope: "resident_domain",
        clinicalJudgementRequired: true,
      },
    ],
    clinicalApproval: {
      status: "pending",
      notes: "Requires governance approval of qualifying assessment risk levels and RLT mapping before activation.",
    },
    explanationTemplate: {
      whatHappened: "A completed assessment met a configured risk level for care-plan coverage review.",
      threshold: "Configured assessment risk level and RLT-domain mapping.",
      sourceRecords: "Resident, assessment and active care-plan problem records.",
      recommendedAction: "Review whether a nursing care plan should be created or updated; do not auto-create one.",
    },
    createdAt: RULE_ENGINE_STARTED_AT,
  },
  {
    id: "RULE-WEIGHT-001",
    version: 1,
    name: "Significant weight-loss recommendation",
    description: "Disabled clinical-threshold reference rule for configurable weight-loss review. The example threshold is for fixture testing only.",
    status: "pending_clinical_approval",
    category: "weight",
    triggerEventTypes: ["WeightRecorded"],
    severity: "medium",
    configuration: {
      percentageThreshold: 5,
      lookbackDays: 30,
      minimumMeasurements: 2,
      includeEstimatedWeights: false,
      recommendationCodes: ["MUST_REASSESSMENT_REVIEW", "EATING_DRINKING_PLAN_REVIEW"],
    } satisfies WeightLossRuleConfig,
    requiredData: [
      { key: "resident", provider: "resident", required: true },
      { key: "weights", provider: "weights", required: true, timeWindow: { amount: 30, unit: "days" } },
    ],
    outputDefinitions: [
      {
        outputType: "recommendation",
        outputCode: "SIGNIFICANT_WEIGHT_LOSS_REVIEW",
        requiresHumanConfirmation: true,
        deduplicationScope: "resident_and_code",
        clinicalJudgementRequired: true,
      },
    ],
    clinicalApproval: {
      status: "pending",
      notes: "No approved NuCare policy threshold supplied. Rule remains inactive; config is available only in fixtures/simulation.",
    },
    explanationTemplate: {
      whatHappened: "A weight record was compared with previous valid weights.",
      threshold: "Configured percentage change and lookback period.",
      sourceRecords: "Current and previous weight records for the same resident and nursing home.",
      recommendedAction: "Consider MUST reassessment and Eating and Drinking care-plan review according to approved policy.",
    },
    createdAt: RULE_ENGINE_STARTED_AT,
  },
  {
    id: "RULE-CAREACTION-MISSED-001",
    version: 1,
    name: "Repeated missed care-action recommendation",
    description: "Fixture-ready rule for repeated missed care actions. It is inactive until the missed-occurrence threshold and action policy are approved.",
    status: "pending_clinical_approval",
    category: "care_action",
    triggerEventTypes: ["CareActionMissed"],
    severity: "medium",
    configuration: {
      minimumMissedOccurrences: 3,
      lookbackDays: 7,
      scope: "same_care_action",
    } satisfies RepeatedMissedCareActionConfig,
    requiredData: [
      { key: "resident", provider: "resident", required: true },
      { key: "missedCareActions", provider: "care_actions", required: true, timeWindow: { amount: 7, unit: "days" } },
    ],
    outputDefinitions: [
      {
        outputType: "recommendation",
        outputCode: "REPEATED_MISSED_CARE_ACTION_REVIEW",
        requiresHumanConfirmation: true,
        deduplicationScope: "resident_and_code",
        clinicalJudgementRequired: true,
      },
    ],
    clinicalApproval: {
      status: "pending",
      notes: "Threshold is not approved for live clinical use.",
    },
    explanationTemplate: {
      whatHappened: "A missed care-action event was compared with recent missed care-action records.",
      threshold: "Configured missed-occurrence count within the configured lookback period.",
      sourceRecords: "Problem-intervention logs for the same resident and home.",
      recommendedAction: "Review causes, staffing/equipment issues and whether the care plan needs update.",
    },
    createdAt: RULE_ENGINE_STARTED_AT,
  },
  {
    id: "RULE-TEST-DEDUPE-001",
    version: 1,
    name: "Duplicate-prevention test signal",
    description: "Non-clinical test rule used to prove event idempotency and output deduplication without altering live alerts, tasks or risks.",
    status: "active",
    category: "other",
    triggerEventTypes: ["HandoverCreated"],
    severity: "information",
    configuration: { outputCode: "RULE_ENGINE_DEDUPE_SIGNAL" },
    requiredData: [],
    outputDefinitions: [
      {
        outputType: "dashboard_signal",
        outputCode: "RULE_ENGINE_DEDUPE_SIGNAL",
        requiresHumanConfirmation: false,
        deduplicationScope: "event",
        clinicalJudgementRequired: false,
      },
    ],
    effectiveFrom: RULE_ENGINE_STARTED_AT,
    clinicalApproval: {
      status: "not_required",
      notes: "Non-clinical infrastructure signal for idempotency tests only.",
    },
    explanationTemplate: {
      whatHappened: "A handover event was received by the central rules engine.",
      threshold: "Non-clinical test condition: event delivery exists.",
      sourceRecords: "The source handover domain event.",
      recommendedAction: "No clinical action required.",
    },
    createdAt: RULE_ENGINE_STARTED_AT,
    activatedAt: RULE_ENGINE_STARTED_AT,
  },
];
