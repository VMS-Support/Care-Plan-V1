import type { DomainEvent } from "@/domain/events/eventTypes";
import { DEFAULT_RULE_DEFINITIONS, type CarePlanCoverageGapConfig, type RepeatedMissedCareActionConfig, type WeightLossRuleConfig } from "./ruleCatalog";
import { getRuleSourceRecords } from "./ruleDataProviders";
import { canRuleBecomeActive, getApplicableRules } from "./ruleRegistry";
import type {
  ProposedRuleOutput,
  RuleConditionResult,
  RuleDefinition,
  RuleEngineState,
  RuleEvaluationInput,
  RuleEvaluationResult,
  RuleGeneratedOutput,
  RuleProcessingReceipt,
  RuleSourceRecord,
  RuleSourceReference,
} from "./ruleTypes";

const outputId = (key: string) => `rule-output-${key.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`;
const decisionId = (rule: RuleDefinition, event: DomainEvent<string, unknown>) => `rule-decision-${rule.id}-v${rule.version}-${event.eventId}`;
const receiptId = (rule: RuleDefinition, event: DomainEvent<string, unknown>, status: string) => `rule-receipt-${rule.id}-v${rule.version}-${event.eventId}-${status}`;
const payloadOf = (event: DomainEvent<string, unknown>) => event.payload && typeof event.payload === "object" ? (event.payload as Record<string, unknown>) : {};
const residentIdFor = (event: DomainEvent<string, unknown>) => String(event.subject?.residentId || payloadOf(event).residentId || "");

function sourceReferences(sourceRecords: RuleSourceRecord[]): RuleSourceReference[] {
  return sourceRecords
    .filter((record) => !record.missing)
    .map(({ key, provider, recordType, recordId, nursingHomeId, residentId, observedAt, effectiveAt }) => ({
      key,
      provider,
      recordType,
      recordId,
      nursingHomeId,
      residentId,
      observedAt,
      effectiveAt,
    }));
}

function buildDeduplicationKey(rule: RuleDefinition, event: DomainEvent<string, unknown>, outputCode: string, scope: ProposedRuleOutput["deduplicationStrategy"]["scope"], domainId?: string) {
  const home = event.scope.nursingHomeId;
  const resident = residentIdFor(event);
  if (scope === "event") return `${home}:${rule.id}:v${rule.version}:${event.eventId}:${outputCode}`;
  if (scope === "resident_domain") return `${home}:${resident}:${outputCode}:${domainId || "unknown-domain"}`;
  if (scope === "resident_and_code") return `${home}:${resident}:${outputCode}`;
  if (scope === "resident") return `${home}:${resident}:${rule.id}`;
  return `${home}:${outputCode}`;
}

function baseResult(input: RuleEvaluationInput, status: RuleEvaluationResult["status"], conditions: RuleConditionResult[], outputs: ProposedRuleOutput[], sourceRecords = input.sourceRecords): RuleEvaluationResult {
  const refs = sourceReferences(sourceRecords);
  return {
    decisionId: decisionId(input.rule, input.event),
    ruleId: input.rule.id,
    ruleVersion: input.rule.version,
    sourceEventId: input.event.eventId,
    status,
    severity: input.rule.severity,
    evaluatedAt: input.evaluatedAt,
    residentId: input.context.residentId,
    nursingHomeId: input.context.nursingHomeId,
    wardId: input.context.wardId,
    matchedConditions: conditions,
    sourceRecordReferences: refs,
    proposedOutputs: outputs,
    explanation: {
      whatHappened: input.rule.explanationTemplate.whatHappened,
      thresholdOrCondition: input.rule.explanationTemplate.threshold,
      sourceSummary: refs.length
        ? `${refs.length} source record(s): ${refs.map((ref) => `${ref.recordType}/${ref.recordId}`).join(", ")}.`
        : "No supporting source records were used.",
      recommendedAction: input.rule.explanationTemplate.recommendedAction,
      clinicalSummary: `${input.rule.explanationTemplate.whatHappened} ${input.rule.explanationTemplate.recommendedAction}`,
      technicalTrace: {
        ruleId: input.rule.id,
        ruleVersion: input.rule.version,
        sourceEventId: input.event.eventId,
        correlationId: input.event.correlationId,
        deduplicationKeys: outputs.map((output) => output.deduplicationKey),
      },
      permissionRestrictedTechnical: true,
    },
  };
}

function insufficientData(input: RuleEvaluationInput, missing: RuleSourceRecord[]) {
  return baseResult(input, "insufficient_data", missing.map((record) => ({
    conditionId: `missing-${record.key}`,
    description: record.missingReason || `Required ${record.key} data is missing.`,
    operator: "missing",
    matched: false,
  })), []);
}

function evaluateCarePlanCoverage(input: RuleEvaluationInput) {
  const config = input.rule.configuration as CarePlanCoverageGapConfig;
  const payload = payloadOf(input.event);
  const riskLevel = String(payload.riskLevel || payload.currentRiskLevel || "");
  const assessmentType = String(payload.assessmentType || "");
  const domainId = config.assessmentTypeToRltDomainId[assessmentType];
  const activePlans = input.sourceRecords.filter((record) => record.provider === "care_plans" && (record.record as Record<string, unknown>).rltDomainId === domainId);
  const conditions: RuleConditionResult[] = [
    {
      conditionId: "assessment-risk-level",
      description: "Assessment risk level is configured for care-plan coverage review.",
      actualValue: riskLevel,
      operator: "within",
      thresholdValue: config.qualifyingRiskLevels,
      matched: config.qualifyingRiskLevels.includes(riskLevel),
    },
    {
      conditionId: "assessment-domain-mapping",
      description: "Assessment type maps to an RLT domain.",
      actualValue: assessmentType,
      operator: "exists",
      thresholdValue: Object.keys(config.assessmentTypeToRltDomainId),
      matched: Boolean(domainId),
    },
    {
      conditionId: "active-care-plan-coverage",
      description: "No active care-plan problem currently covers the mapped RLT domain.",
      actualValue: activePlans.length,
      operator: "equals",
      thresholdValue: 0,
      matched: activePlans.length === 0,
    },
  ];
  const matched = conditions.every((condition) => condition.matched);
  const outputs = matched ? [{
    outputType: "care_plan_coverage_gap" as const,
    outputCode: "CARE_PLAN_COVERAGE_GAP",
    severity: input.rule.severity,
    title: "Care-plan coverage review recommended",
    summary: `Assessment ${assessmentType} has ${riskLevel} risk and no active plan coverage for ${domainId}.`,
    recommendedActionCodes: ["REVIEW_OR_CREATE_NURSING_CARE_PLAN"],
    requiresHumanConfirmation: true,
    deduplicationStrategy: { strategy: "active_issue" as const, scope: "resident_domain" as const, includeRuleId: false, episodePolicy: "update_active" as const },
    deduplicationKey: buildDeduplicationKey(input.rule, input.event, "CARE_PLAN_COVERAGE_GAP", "resident_domain", domainId),
  }] : [];
  return baseResult(input, matched ? "matched" : "not_matched", conditions, outputs);
}

function evaluateWeightLoss(input: RuleEvaluationInput) {
  const config = input.rule.configuration as WeightLossRuleConfig;
  const weights = input.sourceRecords
    .filter((record) => record.provider === "weights" && !record.missing)
    .map((record) => {
      const raw = record.record as Record<string, unknown>;
      return {
        id: record.recordId,
        kg: Number(raw.weightKg || raw.weightValue),
        at: Date.parse(String(raw.observedAt || raw.date || "")),
        reference: record,
      };
    })
    .filter((item) => Number.isFinite(item.kg) && Number.isFinite(item.at))
    .sort((left, right) => right.at - left.at);
  if (weights.length < config.minimumMeasurements) {
    return insufficientData(input, [{
      key: "weights",
      provider: "weights",
      recordType: "missing",
      recordId: `${input.event.eventId}:weights:insufficient`,
      nursingHomeId: input.context.nursingHomeId,
      residentId: input.context.residentId,
      missing: true,
      missingReason: "Insufficient previous weight records for the configured minimum measurement count.",
      record: {},
    }]);
  }
  const current = weights[0];
  const previous = weights.find((item) => item.id !== current.id) || weights[1];
  const changePercent = previous ? ((previous.kg - current.kg) / previous.kg) * 100 : 0;
  const rounded = Math.round(changePercent * 100) / 100;
  const condition: RuleConditionResult = {
    conditionId: "weight-loss-percentage",
    description: "Configured percentage weight loss within lookback period.",
    actualValue: rounded,
    operator: "greater_than_or_equal",
    thresholdValue: config.percentageThreshold,
    unit: "percent",
    matched: rounded >= config.percentageThreshold,
  };
  const outputs = condition.matched ? [{
    outputType: "recommendation" as const,
    outputCode: "SIGNIFICANT_WEIGHT_LOSS_REVIEW",
    severity: input.rule.severity,
    title: "Weight review recommended",
    summary: `Weight changed from ${previous.kg} kg to ${current.kg} kg (${rounded}%).`,
    recommendedActionCodes: config.recommendationCodes,
    requiresHumanConfirmation: true,
    deduplicationStrategy: { strategy: "active_issue" as const, scope: "resident_and_code" as const, includeRuleId: false, episodePolicy: "update_active" as const },
    deduplicationKey: buildDeduplicationKey(input.rule, input.event, "SIGNIFICANT_WEIGHT_LOSS_REVIEW", "resident_and_code"),
  }] : [];
  return baseResult(input, condition.matched ? "matched" : "not_matched", [condition], outputs, [current.reference, previous.reference]);
}

function evaluateRepeatedMissedCareAction(input: RuleEvaluationInput) {
  const config = input.rule.configuration as RepeatedMissedCareActionConfig;
  const payload = payloadOf(input.event);
  const missed = input.sourceRecords
    .filter((record) => record.provider === "care_actions" && !record.missing)
    .filter((record) => config.scope !== "same_care_action" || (record.record as Record<string, unknown>).interventionId === payload.careActionId);
  const condition: RuleConditionResult = {
    conditionId: "missed-care-action-count",
    description: "Repeated missed care actions reached the configured count.",
    actualValue: missed.length,
    operator: "count_at_least",
    thresholdValue: config.minimumMissedOccurrences,
    matched: missed.length >= config.minimumMissedOccurrences,
  };
  const outputs = condition.matched ? [{
    outputType: "recommendation" as const,
    outputCode: "REPEATED_MISSED_CARE_ACTION_REVIEW",
    severity: input.rule.severity,
    title: "Repeated missed care action review recommended",
    summary: `${missed.length} missed care-action record(s) met the configured review condition.`,
    recommendedActionCodes: ["REVIEW_CARE_ACTION_DELIVERY"],
    requiresHumanConfirmation: true,
    deduplicationStrategy: { strategy: "active_issue" as const, scope: "resident_and_code" as const, includeRuleId: false, episodePolicy: "update_active" as const },
    deduplicationKey: buildDeduplicationKey(input.rule, input.event, "REPEATED_MISSED_CARE_ACTION_REVIEW", "resident_and_code"),
  }] : [];
  return baseResult(input, condition.matched ? "matched" : "not_matched", [condition], outputs, missed);
}

function evaluateDuplicateTest(input: RuleEvaluationInput) {
  const condition: RuleConditionResult = {
    conditionId: "event-delivered",
    description: "A domain event was delivered to the rules engine.",
    actualValue: input.event.eventType,
    operator: "exists",
    matched: true,
  };
  const output: ProposedRuleOutput = {
    outputType: "dashboard_signal",
    outputCode: "RULE_ENGINE_DEDUPE_SIGNAL",
    severity: "information",
    title: "Rules engine duplicate-prevention signal",
    summary: "Non-clinical signal proving one event produces one deduplicated output.",
    requiresHumanConfirmation: false,
    deduplicationStrategy: { strategy: "source_event", scope: "event", includeRuleId: true, episodePolicy: "update_active" },
    deduplicationKey: buildDeduplicationKey(input.rule, input.event, "RULE_ENGINE_DEDUPE_SIGNAL", "event"),
  };
  return baseResult(input, "matched", [condition], [output]);
}

export function evaluateRule(input: RuleEvaluationInput): RuleEvaluationResult {
  const missingRequired = input.sourceRecords.filter((record) => record.missing && input.rule.requiredData.some((requirement) => requirement.key === record.key && requirement.required));
  if (missingRequired.length) return insufficientData(input, missingRequired);
  switch (input.rule.id) {
    case "RULE-CAREPLAN-COVERAGE-001":
      return evaluateCarePlanCoverage(input);
    case "RULE-WEIGHT-001":
      return evaluateWeightLoss(input);
    case "RULE-CAREACTION-MISSED-001":
      return evaluateRepeatedMissedCareAction(input);
    case "RULE-TEST-DEDUPE-001":
      return evaluateDuplicateTest(input);
    default:
      return baseResult(input, "not_matched", [{ conditionId: "rule-handler", description: "No executable handler exists for this rule.", matched: false }], []);
  }
}

export function evaluateRuleFixture(input: { rule: RuleDefinition; event: DomainEvent<string, unknown>; sourceRecords: RuleSourceRecord[]; now: string }) {
  return evaluateRule({
    rule: input.rule,
    event: input.event,
    sourceRecords: input.sourceRecords,
    evaluatedAt: input.now,
    simulation: true,
    context: {
      nursingHomeId: input.event.scope.nursingHomeId,
      wardId: input.event.scope.wardId,
      residentId: residentIdFor(input.event),
      timezone: input.event.scope.timezone,
    },
  });
}

export function executeRuleOutputs(decision: RuleEvaluationResult, existingOutputs: RuleGeneratedOutput[] = [], now = decision.evaluatedAt) {
  const outputs = [...existingOutputs];
  for (const proposed of decision.proposedOutputs) {
    const existing = outputs.find((output) => output.deduplicationKey === proposed.deduplicationKey && output.status === "active");
    if (existing) {
      existing.updatedAt = now;
      existing.occurrenceCount += 1;
      existing.sourceRecordReferences = [
        ...existing.sourceRecordReferences,
        ...decision.sourceRecordReferences.filter((ref) => !existing.sourceRecordReferences.some((existingRef) => existingRef.recordId === ref.recordId)),
      ];
      continue;
    }
    outputs.push({
      id: outputId(proposed.deduplicationKey),
      ruleId: decision.ruleId,
      ruleVersion: decision.ruleVersion,
      decisionId: decision.decisionId,
      sourceEventId: decision.sourceEventId,
      outputType: proposed.outputType,
      outputCode: proposed.outputCode,
      title: proposed.title,
      summary: proposed.summary,
      severity: proposed.severity,
      nursingHomeId: decision.nursingHomeId,
      residentId: decision.residentId,
      wardId: decision.wardId,
      deduplicationKey: proposed.deduplicationKey,
      status: "active",
      createdAt: now,
      sourceRecordReferences: decision.sourceRecordReferences,
      explanation: decision.explanation,
      occurrenceCount: 1,
    });
  }
  return outputs;
}

export function evaluateEventAgainstRules(event: DomainEvent<string, unknown>, state: RuleEngineState, now = new Date().toISOString()) {
  const rules = (state.ruleDefinitions || DEFAULT_RULE_DEFINITIONS).filter((rule) => canRuleBecomeActive(rule) || rule.status !== "active");
  return getApplicableRules(rules, event).map((rule) => evaluateRule({
    rule,
    event,
    sourceRecords: getRuleSourceRecords(rule.requiredData, event, state),
    evaluatedAt: now,
    context: {
      nursingHomeId: event.scope.nursingHomeId,
      wardId: event.scope.wardId,
      residentId: residentIdFor(event) || undefined,
      timezone: event.scope.timezone,
    },
  }));
}

export function processRulesForEvent<TState extends RuleEngineState>(state: TState, event: DomainEvent<string, unknown>, now = new Date().toISOString()): TState {
  const existingSuccess = (state.ruleProcessingReceipts || []).filter((receipt) => receipt.sourceEventId === event.eventId && receipt.status === "completed");
  let decisions = [...(state.ruleDecisions || [])];
  let receipts: RuleProcessingReceipt[] = [...(state.ruleProcessingReceipts || [])];
  let outputs = [...(state.ruleGeneratedOutputs || [])];
  const applicable = getApplicableRules(state.ruleDefinitions || DEFAULT_RULE_DEFINITIONS, event);
  for (const rule of applicable) {
    const already = existingSuccess.some((receipt) => receipt.ruleId === rule.id && receipt.ruleVersion === rule.version);
    if (already) {
      receipts = [{ id: receiptId(rule, event, "skipped-duplicate"), ruleId: rule.id, ruleVersion: rule.version, sourceEventId: event.eventId, status: "skipped_duplicate", startedAt: now, completedAt: now, attempt: 1 }, ...receipts];
      continue;
    }
    try {
      const decision = evaluateRule({
        rule,
        event,
        sourceRecords: getRuleSourceRecords(rule.requiredData, event, state),
        evaluatedAt: now,
        context: {
          nursingHomeId: event.scope.nursingHomeId,
          wardId: event.scope.wardId,
          residentId: residentIdFor(event) || undefined,
          timezone: event.scope.timezone,
        },
      });
      if (decision.status !== "not_matched") decisions = [decision, ...decisions.filter((item) => item.decisionId !== decision.decisionId)];
      if (decision.status === "matched") outputs = executeRuleOutputs(decision, outputs, now);
      receipts = [{ id: receiptId(rule, event, "completed"), ruleId: rule.id, ruleVersion: rule.version, sourceEventId: event.eventId, status: "completed", startedAt: now, completedAt: now, attempt: 1 }, ...receipts];
    } catch (error) {
      receipts = [{ id: receiptId(rule, event, "failed"), ruleId: rule.id, ruleVersion: rule.version, sourceEventId: event.eventId, status: "failed", startedAt: now, completedAt: now, attempt: 1, error: error instanceof Error ? error.message : String(error) }, ...receipts];
    }
  }
  return { ...state, ruleDecisions: decisions, ruleProcessingReceipts: receipts, ruleGeneratedOutputs: outputs };
}

export function replayRuleForEvent(state: RuleEngineState, ruleId: string, version: number, eventId: string, now = new Date().toISOString()) {
  const event = (state.eventStore || []).find((record) => record.eventId === eventId)?.event;
  const rule = (state.ruleDefinitions || DEFAULT_RULE_DEFINITIONS).find((candidate) => candidate.id === ruleId && candidate.version === version);
  if (!event || !rule) return undefined;
  return evaluateRule({
    rule,
    event,
    sourceRecords: getRuleSourceRecords(rule.requiredData, event, state),
    evaluatedAt: now,
    simulation: true,
    context: { nursingHomeId: event.scope.nursingHomeId, wardId: event.scope.wardId, residentId: residentIdFor(event), timezone: event.scope.timezone },
  });
}
