import { RLT_DOMAINS, type RltDomainId } from "@/lib/care/rlt";
import type { CareActionId, CarePlanItemId } from "@/types/entityIds";
import type { DailyCareDetails } from "./dailyCareDetails";
import type { DailyCareRltMappingResult, DailyCareType } from "./dailyCareTypes";

export interface DailyCareRltMappingInput {
  careType: DailyCareType;
  details: DailyCareDetails;
  relatedCareActionId?: CareActionId | string;
  relatedCarePlanItemId?: CarePlanItemId | string;
  explicitRltDomainIds?: RltDomainId[];
  sourceDomainIds?: RltDomainId[];
  refusedSourceEntityType?: string;
  refusedSourceEntityId?: string;
}

const primaryByCareType: Partial<Record<DailyCareType, RltDomainId>> = {
  personal_care: "personal_cleansing_dressing",
  dressing: "personal_cleansing_dressing",
  oral_care: "personal_cleansing_dressing",
  toileting: "elimination",
  continence: "elimination",
  repositioning: "mobilisation",
  food: "eating_drinking",
  fluids: "eating_drinking",
  mobility: "mobilisation",
  sleep: "sleeping",
  mood: "communication",
  behaviour: "communication",
  activity: "meaningful_activity",
  skin_observation: "personal_cleansing_dressing",
};

const displayOrder = new Map<RltDomainId, number>(RLT_DOMAINS.map((domain) => [domain.id, domain.displayOrder]));

export function resolveDailyCareRltMapping(input: DailyCareRltMappingInput): DailyCareRltMappingResult {
  const mappings: DailyCareRltMappingResult["mappings"] = [];
  const add = (rltDomainId: RltDomainId | undefined, mappingSource: DailyCareRltMappingResult["mappings"][number]["mappingSource"], mappingRuleCode: string, confidence: DailyCareRltMappingResult["mappings"][number]["confidence"]) => {
    if (!rltDomainId) return;
    if (mappings.some((mapping) => mapping.rltDomainId === rltDomainId && mapping.mappingSource === mappingSource && mapping.mappingRuleCode === mappingRuleCode)) return;
    mappings.push({ rltDomainId, mappingSource, mappingRuleCode, confidence });
  };

  for (const domainId of input.sourceDomainIds || []) {
    add(domainId, input.relatedCareActionId ? "care_action" : "care_plan_item", "source_domain", "explicit");
  }
  for (const domainId of input.explicitRltDomainIds || []) {
    add(domainId, "explicit", "explicit_daily_care_domain", "explicit");
  }

  if (input.careType === "refusal") {
    const refusedType = input.details.type === "refusal" ? input.details.refusedCareType : undefined;
    if (isDailyCareType(refusedType)) add(primaryByCareType[refusedType], "daily_care_type", `refused_${refusedType}`, "deterministic");
  } else if (!input.sourceDomainIds?.length) {
    add(primaryByCareType[input.careType], "daily_care_type", `primary_${input.careType}`, "deterministic");
  }

  addStructuredDetailMappings(input.details, add);

  const domainIds = Array.from(new Set(mappings.map((mapping) => mapping.rltDomainId)))
    .sort((a, b) => (displayOrder.get(a) ?? 999) - (displayOrder.get(b) ?? 999));
  const sortedMappings = mappings.sort((a, b) => {
    const orderDelta = (displayOrder.get(a.rltDomainId) ?? 999) - (displayOrder.get(b.rltDomainId) ?? 999);
    if (orderDelta !== 0) return orderDelta;
    return a.mappingRuleCode.localeCompare(b.mappingRuleCode);
  });

  return {
    primaryDomainId: domainIds[0],
    domainIds,
    mappings: sortedMappings,
    status: domainIds.length ? "mapped" : "unmapped",
  };
}

export function resolveDailyCareRltDomains(careType: DailyCareType, details: DailyCareDetails, sourceDomainIds: RltDomainId[] = []): RltDomainId[] {
  return resolveDailyCareRltMapping({ careType, details, sourceDomainIds }).domainIds;
}

function addStructuredDetailMappings(
  details: DailyCareDetails,
  add: (domainId: RltDomainId | undefined, source: "structured_detail", ruleCode: string, confidence: "deterministic") => void,
) {
  if (details.type === "oral_care" && details.oralCondition?.includes("swallowing_concern")) add("eating_drinking", "structured_detail", "oral_swallowing_concern", "deterministic");
  if (details.type === "continence" && (details.skinCareProvided || details.odourOrAppearanceConcern)) add("personal_cleansing_dressing", "structured_detail", "continence_skin_care_or_concern", "deterministic");
  if (details.type === "repositioning" && (details.skinObserved || details.skinConcernObserved)) add("personal_cleansing_dressing", "structured_detail", "repositioning_skin_observed", "deterministic");
  if (details.type === "repositioning" && details.skinConcernObserved) add("safe_environment", "structured_detail", "repositioning_pressure_safety_concern", "deterministic");
  if (details.type === "mobility" && details.nearFallOrSafetyConcern) add("safe_environment", "structured_detail", "mobility_near_fall_or_safety_concern", "deterministic");
  if (details.type === "behaviour" && details.riskToSelfOrOthers) add("safe_environment", "structured_detail", "behaviour_risk_to_self_or_others", "deterministic");
  if (details.type === "skin_observation" && (details.skinState.includes("pressure_concern") || details.skinState.includes("broken_skin") || details.blanchingStatus === "non_blanching")) add("safe_environment", "structured_detail", "skin_pressure_or_broken_skin_concern", "deterministic");
}

function isDailyCareType(value: unknown): value is DailyCareType {
  return typeof value === "string" && value in primaryByCareType;
}
