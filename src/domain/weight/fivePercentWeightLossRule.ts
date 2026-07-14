import type { ResidentWeightIntelligence } from "./weightIntelligenceTypes";
import type {
  WeightConcernProjection,
  WeightConcernRepository,
  WeightLossRuleConfiguration,
  WeightLossRuleEvaluation,
} from "./weightLossRuleTypes";

export function getEffectiveWeightLossRule(configurations: WeightLossRuleConfiguration[], context: { nursingHomeId: string; enterpriseId?: string; effectiveAt: string }) {
  return configurations
    .filter((rule) => rule.status === "approved" && Boolean(rule.approvedAt) && rule.effectiveFrom <= context.effectiveAt && (!rule.effectiveTo || rule.effectiveTo > context.effectiveAt) && (rule.nursingHomeId === context.nursingHomeId || (!rule.nursingHomeId && (!rule.enterpriseId || rule.enterpriseId === context.enterpriseId))))
    .sort((a, b) => b.version - a.version)[0];
}

export function evaluateFivePercentWeightLossRule(intelligence: ResidentWeightIntelligence, rule: WeightLossRuleConfiguration | undefined): WeightLossRuleEvaluation {
  if (!rule) return { status: "unavailable", residentId: intelligence.residentId, nursingHomeId: intelligence.nursingHomeId, evaluatedAt: intelligence.generatedAt, explanation: "No approved weight-loss rule is configured." };
  const period = intelligence.thirtyDayChange;
  if (!period || period.status !== "calculated" || period.lossPercent === undefined) {
    return { status: "not_matched", residentId: intelligence.residentId, nursingHomeId: intelligence.nursingHomeId, evaluatedAt: intelligence.generatedAt, ruleConfigurationId: rule.id, ruleVersion: rule.version, thresholdPercent: rule.lossThresholdPercent, periodResult: period, explanation: "A valid 30-day weight comparison is not available." };
  }
  const matched = period.lossPercent >= rule.lossThresholdPercent;
  return {
    status: matched ? "matched" : "not_matched",
    residentId: intelligence.residentId,
    nursingHomeId: intelligence.nursingHomeId,
    evaluatedAt: intelligence.generatedAt,
    ruleConfigurationId: rule.id,
    ruleVersion: rule.version,
    thresholdPercent: rule.lossThresholdPercent,
    periodResult: period,
    explanation: matched
      ? `${rule.explanationTemplate} Weight reduced by ${period.lossPercent.toFixed(1)}% over ${period.elapsedDays ?? "the comparison period"} days.`
      : `30-day weight loss ${period.lossPercent.toFixed(1)}% is below the approved ${rule.lossThresholdPercent}% threshold.`,
  };
}

export function createOrUpdateWeightConcern(evaluation: WeightLossRuleEvaluation, rule: WeightLossRuleConfiguration, repository: WeightConcernRepository, createId: () => string, wardId?: string, correlationId = createId()) {
  if (evaluation.status !== "matched" || !evaluation.periodResult?.comparisonObservationRecordId) return undefined;
  const period = evaluation.periodResult;
  const key = `${evaluation.nursingHomeId}:${evaluation.residentId}:${rule.id}:v${rule.version}`;
  let concern = repository.concerns.find((item) => item.deduplicationKey === key && ["open", "acknowledged", "escalated"].includes(item.status));
  const due = rule.repeatWeightAfterDays !== undefined ? addDays(evaluation.evaluatedAt, rule.repeatWeightAfterDays) : undefined;
  if (concern) {
    concern = {
      ...concern,
      currentObservationRecordId: period.currentObservationRecordId,
      comparisonObservationRecordId: period.comparisonObservationRecordId,
      lossPercent: period.lossPercent ?? concern.lossPercent,
      latestDetectedAt: evaluation.evaluatedAt,
      explanation: evaluation.explanation,
      repeatWeightDueAt: due,
    };
    repository.concerns = repository.concerns.map((item) => item.id === concern!.id ? concern! : item);
    repository.events.push(event(createId(), "WeightLossConcernUpdated", evaluation, correlationId, { concernId: concern.id }));
    return concern;
  }
  concern = {
    id: createId(),
    deduplicationKey: key,
    residentId: evaluation.residentId,
    nursingHomeId: evaluation.nursingHomeId,
    wardId,
    status: "open",
    severity: rule.severity,
    currentObservationRecordId: period.currentObservationRecordId,
    comparisonObservationRecordId: period.comparisonObservationRecordId,
    lossPercent: period.lossPercent ?? 0,
    openedAt: evaluation.evaluatedAt,
    latestDetectedAt: evaluation.evaluatedAt,
    explanation: evaluation.explanation,
    ruleConfigurationId: rule.id,
    ruleVersion: rule.version,
    mustGuidanceRequired: rule.requestMustReassessment,
    eatingAndDrinkingCarePlanReviewRequired: rule.requestEatingAndDrinkingCarePlanReview,
    repeatWeightDueAt: due,
  };
  repository.concerns.push(concern);
  repository.events.push(event(createId(), "WeightLossConcernOpened", evaluation, correlationId, { concernId: concern.id }));
  return concern;
}

function event(id: string, type: string, evaluation: WeightLossRuleEvaluation, correlationId: string, extra: Record<string, unknown>) {
  const period = evaluation.periodResult;
  return {
    id,
    type,
    residentId: evaluation.residentId,
    nursingHomeId: evaluation.nursingHomeId,
    occurredAt: evaluation.evaluatedAt,
    correlationId,
    payload: {
      currentWeightObservationId: period?.currentObservationRecordId,
      comparisonWeightObservationId: period?.comparisonObservationRecordId,
      currentWeightKg: period?.currentWeightKg,
      comparisonWeightKg: period?.comparisonWeightKg,
      lossPercent: period?.lossPercent,
      elapsedDays: period?.elapsedDays,
      ruleConfigurationId: evaluation.ruleConfigurationId,
      ruleVersion: evaluation.ruleVersion,
      explanation: evaluation.explanation,
      ...extra,
    },
  };
}

function addDays(value: string, days: number) { const d = new Date(value); d.setDate(d.getDate() + days); return d.toISOString(); }
