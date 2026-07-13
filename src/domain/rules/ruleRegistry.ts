import { SUPPORTED_EVENT_VERSIONS } from "@/domain/events/eventCatalog";
import type { DomainEvent } from "@/domain/events/eventTypes";
import type { RuleDefinition, RuleStatus } from "./ruleTypes";

const hasClinicalApprovalToRun = (rule: RuleDefinition) =>
  rule.clinicalApproval?.status === "approved" || rule.clinicalApproval?.status === "not_required";

export function isRuleEffective(rule: RuleDefinition, occurredAt: string) {
  const at = Date.parse(occurredAt);
  if (rule.effectiveFrom && at < Date.parse(rule.effectiveFrom)) return false;
  if (rule.effectiveTo && at >= Date.parse(rule.effectiveTo)) return false;
  return true;
}

export function canRuleBecomeActive(rule: RuleDefinition) {
  if (!hasClinicalApprovalToRun(rule)) return false;
  if (!rule.effectiveFrom) return false;
  if (!rule.explanationTemplate) return false;
  if (!rule.outputDefinitions.length) return false;
  return rule.outputDefinitions.every((output) => output.deduplicationScope);
}

export function getApplicableRules(
  rules: RuleDefinition[],
  event: Pick<DomainEvent<string, unknown>, "eventType" | "eventVersion" | "occurredAt" | "scope">,
) {
  const supportedVersions = SUPPORTED_EVENT_VERSIONS[event.eventType as keyof typeof SUPPORTED_EVENT_VERSIONS] || [];
  return rules
    .filter((rule) => rule.status === "active")
    .filter((rule) => rule.triggerEventTypes.includes(event.eventType as never))
    .filter((rule) => supportedVersions.includes(event.eventVersion))
    .filter((rule) => !rule.nursingHomeId || rule.nursingHomeId === event.scope.nursingHomeId)
    .filter((rule) => hasClinicalApprovalToRun(rule))
    .filter((rule) => isRuleEffective(rule, event.occurredAt))
    .sort((left, right) => {
      if (left.nursingHomeId && !right.nursingHomeId) return -1;
      if (!left.nursingHomeId && right.nursingHomeId) return 1;
      return right.version - left.version;
    });
}

export function createRuleVersion<TConfig>(
  rule: RuleDefinition<TConfig>,
  patch: Partial<Omit<RuleDefinition<TConfig>, "id" | "version" | "createdAt" | "supersedesRuleVersion">>,
  createdAt: string,
): RuleDefinition<TConfig> {
  if (rule.status === "active" && patch.configuration && patch.configuration === rule.configuration) {
    throw new Error("Rule configuration object was not changed.");
  }
  return {
    ...rule,
    ...patch,
    version: rule.version + 1,
    status: patch.status || ("draft" as RuleStatus),
    createdAt,
    activatedAt: undefined,
    retiredAt: undefined,
    supersedesRuleVersion: rule.version,
  };
}

export function retireRuleVersion<TConfig>(rule: RuleDefinition<TConfig>, retiredAt: string): RuleDefinition<TConfig> {
  return {
    ...rule,
    status: "retired",
    retiredAt,
    effectiveTo: rule.effectiveTo || retiredAt,
  };
}
