import type { DomainEvent } from "@/domain/events/eventTypes";
import { DEFAULT_RULE_DEFINITIONS } from "./ruleCatalog";
import { evaluateRule } from "./ruleEngine";
import { getRuleSourceRecords } from "./ruleDataProviders";
import type {
  RuleDefinition,
  RuleEngineState,
  RuleEvaluationResult,
  RuleRecalculationItem,
  RuleRecalculationRequest,
  RuleRecalculationSummary,
} from "./ruleTypes";

export const RULES_ENGINE_VERSION = "rules-engine-2026-07-13-phase-27";

export function stableRuleHash(rules: RuleDefinition[]) {
  return rules.map((rule) => `${rule.id}:v${rule.version}:${rule.status}:${JSON.stringify(rule.configuration)}`).sort().join("|");
}

export function stableSourceHash(events: DomainEvent<string, unknown>[]) {
  return events.map((event) => `${event.eventId}:${event.eventType}:v${event.eventVersion}:${event.occurredAt}:${event.scope.nursingHomeId}`).sort().join("|");
}

export function emptyRecalculationSummary(requestId: string): RuleRecalculationSummary {
  return {
    requestId,
    totalItems: 0,
    evaluated: 0,
    skipped: 0,
    failed: 0,
    issueOpened: 0,
    issueUpdated: 0,
    issueEscalated: 0,
    issueResolved: 0,
    issueReopened: 0,
    dismissalPreserved: 0,
    noChange: 0,
    insufficientData: 0,
    byRule: {},
    byNursingHome: {},
    warnings: [],
  };
}

export function createRuleRecalculationRequest(input: {
  id: string;
  mode: "dry_run" | "apply";
  reasonCode: string;
  reasonText: string;
  nursingHomeId: string;
  residentId?: string;
  ruleId?: string;
  ruleVersion?: number;
  requestedByUserAccountId: string;
  sourceEvents: DomainEvent<string, unknown>[];
  rules?: RuleDefinition[];
  now: string;
  dryRunRequestId?: string;
  approvedByUserAccountId?: string;
}) {
  const rules = input.rules || DEFAULT_RULE_DEFINITIONS;
  const request: RuleRecalculationRequest = {
    id: input.id,
    status: "queued",
    mode: input.mode,
    reasonCode: input.reasonCode,
    reasonText: input.reasonText,
    nursingHomeId: input.nursingHomeId,
    residentId: input.residentId,
    ruleId: input.ruleId,
    ruleVersion: input.ruleVersion,
    sourceEventIds: input.sourceEvents.map((event) => event.eventId),
    requestedAt: input.now,
    requestedByUserAccountId: input.requestedByUserAccountId,
    approvedAt: input.approvedByUserAccountId ? input.now : undefined,
    approvedByUserAccountId: input.approvedByUserAccountId,
    correlationId: `rule-recalc-${input.id}`,
    dryRunRequired: input.mode === "apply",
    dryRunRequestId: input.dryRunRequestId,
    ruleConfigurationHash: stableRuleHash(rules),
    sourceDataHash: stableSourceHash(input.sourceEvents),
    summary: emptyRecalculationSummary(input.id),
  };
  return request;
}

export function buildRecalculationItems(request: RuleRecalculationRequest, events: DomainEvent<string, unknown>[], rules: RuleDefinition[] = DEFAULT_RULE_DEFINITIONS): RuleRecalculationItem[] {
  const items: RuleRecalculationItem[] = [];
  for (const event of events.filter((item) => item.scope.nursingHomeId === request.nursingHomeId)) {
    for (const rule of rules.filter((candidate) => (!request.ruleId || candidate.id === request.ruleId) && (!request.ruleVersion || candidate.version === request.ruleVersion) && candidate.triggerEventTypes.includes(event.eventType as never))) {
      items.push({
        id: `${request.id}:${rule.id}:v${rule.version}:${event.eventId}`,
        requestId: request.id,
        ruleId: rule.id,
        ruleVersion: rule.version,
        sourceEventId: event.eventId,
        residentId: String(event.subject.residentId || (event.payload as Record<string, unknown>)?.residentId || ""),
        nursingHomeId: event.scope.nursingHomeId,
        eventSchemaVersion: event.eventVersion,
        rulesEngineVersion: RULES_ENGINE_VERSION,
        sourceDataHash: stableSourceHash([event]),
        status: "queued",
      });
    }
  }
  return items.filter((item, index, arr) => arr.findIndex((candidate) => candidate.id === item.id) === index);
}

export function runRecalculationDryRun(state: RuleEngineState, request: RuleRecalculationRequest, items: RuleRecalculationItem[], now: string) {
  const rules = state.ruleDefinitions || DEFAULT_RULE_DEFINITIONS;
  const decisions: RuleEvaluationResult[] = [];
  const nextItems = items.map((item) => {
    const event = (state.eventStore || []).find((record) => record.eventId === item.sourceEventId)?.event;
    const rule = rules.find((candidate) => candidate.id === item.ruleId && candidate.version === item.ruleVersion);
    if (!event || !rule) return { ...item, status: "failed" as const, error: "Missing event or rule for recalculation item." };
    try {
      const decision = evaluateRule({
        event,
        rule,
        sourceRecords: getRuleSourceRecords(rule.requiredData, event, state),
        evaluatedAt: now,
        simulation: true,
        context: {
          nursingHomeId: event.scope.nursingHomeId,
          wardId: event.scope.wardId,
          residentId: item.residentId,
          timezone: event.scope.timezone,
        },
      });
      decisions.push(decision);
      return { ...item, status: "evaluated" as const, evaluatedAt: now, decisionId: decision.decisionId };
    } catch (error) {
      return { ...item, status: "failed" as const, evaluatedAt: now, error: error instanceof Error ? error.message : String(error) };
    }
  });
  const summary = emptyRecalculationSummary(request.id);
  summary.totalItems = nextItems.length;
  summary.evaluated = nextItems.filter((item) => item.status === "evaluated").length;
  summary.failed = nextItems.filter((item) => item.status === "failed").length;
  summary.insufficientData = decisions.filter((decision) => decision.status === "insufficient_data").length;
  summary.noChange = decisions.filter((decision) => decision.status === "not_matched").length;
  summary.issueOpened = decisions.filter((decision) => decision.status === "matched").length;
  for (const decision of decisions) {
    const current = summary.byRule[decision.ruleId] || { evaluated: 0, matched: 0, failed: 0 };
    summary.byRule[decision.ruleId] = { evaluated: current.evaluated + 1, matched: current.matched + (decision.status === "matched" ? 1 : 0), failed: current.failed };
    summary.byNursingHome![decision.nursingHomeId] = (summary.byNursingHome![decision.nursingHomeId] || 0) + 1;
  }
  return { request: { ...request, status: "dry_run_completed" as const, summary }, items: nextItems, decisions };
}

export function assertApplyRequestIsFresh(applyRequest: RuleRecalculationRequest, dryRunRequest: RuleRecalculationRequest, currentRules: RuleDefinition[], currentEvents: DomainEvent<string, unknown>[]) {
  if (applyRequest.mode !== "apply") throw new Error("Only apply requests require dry-run freshness checks.");
  if (!applyRequest.approvedByUserAccountId) throw new Error("Apply request requires explicit approval.");
  if (applyRequest.dryRunRequestId !== dryRunRequest.id) throw new Error("Apply request is not linked to the reviewed dry run.");
  if (dryRunRequest.ruleConfigurationHash !== stableRuleHash(currentRules)) throw new Error("Rule configuration changed after dry run.");
  if (dryRunRequest.sourceDataHash !== stableSourceHash(currentEvents)) throw new Error("Source data changed after dry run.");
}
