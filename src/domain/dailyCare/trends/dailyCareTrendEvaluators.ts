import type { DailyCareRecord, DailyCareType } from "../dailyCareTypes";
import type {
  AlteredSleepTrendConfiguration,
  BehaviouralChangeTrendConfiguration,
  DailyCareTrendEvaluationResult,
  DailyCareTrendPolicy,
  IncreasedAssistanceTrendConfiguration,
  NoBowelMovementTrendConfiguration,
  ReducedFluidIntakeTrendConfiguration,
  ReducedFoodIntakeTrendConfiguration,
  RepeatedRefusalTrendConfiguration,
} from "./dailyCareTrendTypes";

const assistanceScale = {
  independent: 0,
  with_prompting: 1,
  prompting: 1,
  with_supervision: 2,
  supervision: 2,
  partial_assistance: 3,
  with_assistance: 3,
  one_person_assistance: 3,
  full_assistance: 4,
  fully_supported: 4,
  two_person_assistance: 4,
  full_support: 4,
};

export function evaluateReducedFoodIntake(records: DailyCareRecord[], policy: DailyCareTrendPolicy, dateTo: string): DailyCareTrendEvaluationResult {
  const config = policy.triggerConfiguration as ReducedFoodIntakeTrendConfiguration;
  const scoped = within(records, policy.lookbackMinutes, dateTo).filter((record) => record.careType === "food" || (config.includeRefusedMeals && isRefusedCare(record, "food")));
  const reduced = scoped.filter((record) => record.details.type === "food" && config.mealTypesIncluded.includes(record.details.mealType) && config.reducedIntakeValues.includes(record.details.intake as any));
  const distinctMeals = new Set(reduced.map((record) => record.details.type === "food" ? record.details.mealType : record.careType));
  return result(policy, records[0], scoped, reduced, dateTo, reduced.length >= config.minimumReducedMeals && distinctMeals.size >= (config.minimumDistinctMealPeriods ?? 1), `Reduced food intake detected in ${reduced.length} meal record${reduced.length === 1 ? "" : "s"}.`);
}

export function evaluateReducedFluidIntake(records: DailyCareRecord[], policy: DailyCareTrendPolicy, dateTo: string): DailyCareTrendEvaluationResult {
  const config = policy.triggerConfiguration as ReducedFluidIntakeTrendConfiguration;
  const scoped = within(records, policy.lookbackMinutes, dateTo).filter((record) => record.careType === "fluids" || (config.includeRefusedFluids && isRefusedCare(record, "fluids")));
  const measured = scoped.filter((record) => record.details.type === "fluids" && typeof record.details.amountTakenMl === "number");
  const total = measured.reduce((sum, record) => sum + (record.details.type === "fluids" ? record.details.amountTakenMl ?? 0 : 0), 0);
  const lowEstimate = scoped.filter((record) => record.details.type === "fluids" && (config.reducedIntakeValues || []).includes(record.details.intakeEstimate as any));
  const volumeMatched = config.minimumTotalIntakeMl !== undefined && (!config.requireMeasuredAmountsForVolumeRule || measured.length > 0) && total < config.minimumTotalIntakeMl;
  const estimateMatched = config.minimumReducedEntries !== undefined && lowEstimate.length >= config.minimumReducedEntries;
  const evidence = volumeMatched ? measured : lowEstimate;
  return result(policy, records[0], scoped, evidence, dateTo, volumeMatched || estimateMatched, volumeMatched ? `Measured fluid intake ${total} ml is below policy threshold.` : `Reduced fluid intake detected in ${lowEstimate.length} record${lowEstimate.length === 1 ? "" : "s"}.`);
}

export function evaluateNoBowelMovement(records: DailyCareRecord[], policy: DailyCareTrendPolicy, dateTo: string): DailyCareTrendEvaluationResult {
  const config = policy.triggerConfiguration as NoBowelMovementTrendConfiguration;
  const scoped = within(records, policy.lookbackMinutes, dateTo).filter((record) => record.careType === "toileting" || record.careType === "continence");
  const bowel = scoped.filter((record) => record.details.type === "toileting" && ["bowel_motion", "both"].includes(record.details.outcome));
  const last = bowel[bowel.length - 1];
  const hours = last ? (Date.parse(dateTo) - Date.parse(last.occurredAt)) / 3_600_000 : policy.lookbackMinutes / 60;
  return result(policy, records[0], scoped, last ? [last] : scoped.slice(-1), dateTo, hours >= config.maximumHoursWithoutRecordedBowelMovement, last ? `Last bowel movement was recorded ${Math.round(hours)} hours ago.` : "No bowel movement recorded in the configured lookback period.");
}

export function evaluateRepeatedRefusal(records: DailyCareRecord[], policy: DailyCareTrendPolicy, dateTo: string): DailyCareTrendEvaluationResult {
  const config = policy.triggerConfiguration as RepeatedRefusalTrendConfiguration;
  const scoped = within(records, config.lookbackMinutes, dateTo).filter((record) => record.outcome === "refused" || record.careType === "refusal");
  const candidates = config.requireNurseNotPreviouslyInformed ? scoped.filter((record) => record.details.type !== "refusal" || !record.details.nurseInformed) : scoped;
  const grouped = groupRefusals(candidates, config.groupBy);
  const evidence = grouped.sort((a, b) => b.length - a.length)[0] || [];
  return result(policy, records[0], scoped, evidence, dateTo, evidence.length >= config.minimumRefusalCount, `Repeated care refusal detected in ${evidence.length} source record${evidence.length === 1 ? "" : "s"}.`);
}

export function evaluateIncreasedAssistance(records: DailyCareRecord[], policy: DailyCareTrendPolicy, dateTo: string): DailyCareTrendEvaluationResult {
  const config = policy.triggerConfiguration as IncreasedAssistanceTrendConfiguration;
  const current = within(records, config.lookbackMinutes, dateTo).filter((record) => config.includedCareTypes.includes(record.careType));
  const previousEnd = new Date(Date.parse(dateTo) - config.lookbackMinutes * 60_000).toISOString();
  const previous = within(records, config.comparisonLookbackMinutes, previousEnd).filter((record) => config.includedCareTypes.includes(record.careType));
  const currentLevels = current.map(levelFor).filter((value): value is number => value !== undefined);
  const previousLevels = previous.map(levelFor).filter((value): value is number => value !== undefined);
  const currentTypical = mode(currentLevels);
  const previousTypical = mode(previousLevels);
  const higher = current.filter((record) => {
    const level = levelFor(record);
    return level !== undefined && previousTypical !== undefined && level >= previousTypical + config.minimumLevelIncrease;
  });
  const matched = current.length >= config.minimumCurrentRecordCount && previousTypical !== undefined && currentTypical !== undefined && currentTypical >= previousTypical + config.minimumLevelIncrease && higher.length >= config.minimumOccurrencesAtHigherLevel;
  return result(policy, records[0], current, higher, dateTo, matched, `Assistance increased from ${labelLevel(previousTypical)} to ${labelLevel(currentTypical)}.`);
}

export function evaluateAlteredSleep(records: DailyCareRecord[], policy: DailyCareTrendPolicy, dateTo: string): DailyCareTrendEvaluationResult {
  const config = policy.triggerConfiguration as AlteredSleepTrendConfiguration;
  const current = within(records, config.lookbackMinutes, dateTo).filter((record) => record.careType === "sleep");
  const concerning = current.filter((record) => record.details.type === "sleep" && config.concerningStates.includes(record.details.state as any));
  const matched = concerning.length >= config.minimumConcerningRecords;
  return result(policy, records[0], current, concerning, dateTo, matched, `Sleep pattern changed with ${concerning.length} concerning sleep record${concerning.length === 1 ? "" : "s"}.`);
}

export function evaluateBehaviouralChange(records: DailyCareRecord[], policy: DailyCareTrendPolicy, dateTo: string): DailyCareTrendEvaluationResult {
  const config = policy.triggerConfiguration as BehaviouralChangeTrendConfiguration;
  const current = within(records, config.lookbackMinutes, dateTo).filter((record) => record.careType === "behaviour");
  const evidence = current.filter((record) => record.details.type === "behaviour" && ((config.triggerOnRiskToSelfOrOthers && record.details.riskToSelfOrOthers) || (config.triggerOnNewBehaviourCode && record.details.behaviourObserved.length > 0) || config.triggerOnIncreasedFrequency));
  return result(policy, records[0], current, evidence, dateTo, current.length >= config.minimumBehaviourRecords && evidence.length > 0, `Behavioural change recorded in ${evidence.length} structured record${evidence.length === 1 ? "" : "s"}.`);
}

function result(policy: DailyCareTrendPolicy, first: DailyCareRecord | undefined, scoped: DailyCareRecord[], evidence: DailyCareRecord[], dateTo: string, matched: boolean, summary: string): DailyCareTrendEvaluationResult {
  const dateFrom = new Date(Date.parse(dateTo) - policy.lookbackMinutes * 60_000).toISOString();
  const insufficient = (policy.minimumRecordCount ?? 1) > scoped.length;
  return {
    status: insufficient ? "insufficient_data" : matched ? "matched" : "not_matched",
    trendType: policy.trendType,
    residentId: String(first?.residentId || ""),
    nursingHomeId: String(first?.nursingHomeId || ""),
    wardId: first?.wardId,
    dateFrom,
    dateTo,
    evidenceRecordIds: evidence.map((record) => record.id),
    evidenceCount: evidence.length,
    currentPatternSummary: summary,
    severity: policy.defaultSeverity,
    createDeteriorationIssue: policy.createDeteriorationIssue,
    createNurseReviewWorkItem: policy.createNurseReviewWorkItem,
    dueAt: policy.dueOffsetMinutes === undefined ? undefined : new Date(Date.parse(dateTo) + policy.dueOffsetMinutes * 60_000).toISOString(),
    rltDomainIds: Array.from(new Set(evidence.flatMap((record) => record.rltDomainIds))),
    policyId: policy.id,
    policyVersion: policy.version,
    explanation: {
      summary,
      reasons: insufficient ? ["Insufficient structured Daily Care records for policy threshold."] : matched ? ["Approved Daily Care trend policy matched."] : ["Approved Daily Care trend policy did not match."],
      evidence: evidence.map((record) => ({ dailyCareRecordId: record.id, occurredAt: record.occurredAt, label: record.careType.replaceAll("_", " ") })),
    },
  };
}

function within(records: DailyCareRecord[], lookbackMinutes: number, dateTo: string) {
  const to = Date.parse(dateTo);
  const from = to - lookbackMinutes * 60_000;
  return records.filter((record) => {
    const at = Date.parse(record.occurredAt);
    return at >= from && at <= to;
  });
}

function isRefusedCare(record: DailyCareRecord, type: DailyCareType) {
  return record.details.type === "refusal" && record.details.refusedCareType === type;
}

function groupRefusals(records: DailyCareRecord[], groupBy: RepeatedRefusalTrendConfiguration["groupBy"]) {
  const groups = new Map<string, DailyCareRecord[]>();
  for (const record of records) {
    const key = groupBy === "any_care" ? "any"
      : groupBy === "related_rlt_domain" ? record.rltDomainIds[0] || "unmapped"
      : groupBy === "same_source" && record.details.type === "refusal" ? `${record.details.refusedSourceEntityType || "source"}:${record.details.refusedSourceEntityId || record.details.refusedCareType}`
      : record.details.type === "refusal" ? String(record.details.refusedCareType)
      : record.careType;
    groups.set(key, [...(groups.get(key) || []), record]);
  }
  return [...groups.values()];
}

function levelFor(record: DailyCareRecord) {
  const value = record.details.type === "food" || record.details.type === "fluids" || record.details.type === "mobility"
    ? record.details.assistance
    : record.participationLevel;
  return assistanceScale[value as keyof typeof assistanceScale];
}

function mode(values: number[]) {
  if (!values.length) return undefined;
  const counts = new Map<number, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}

function labelLevel(value?: number) {
  return value === undefined ? "not enough data" : ["independent", "prompting", "supervision", "assistance", "full support"][value] || String(value);
}
