import type {
  CarePlanProblem,
  ProblemIntervention,
  ProblemReview,
  ResidentCarePlan,
} from "./types";
import {
  RLT_DOMAINS,
  RLT_DOMAIN_BY_ID,
  getRltDomainForCarePlanProblem,
  resolveCarePlanRltDomain,
  type RltDomainId,
} from "./rlt";

export interface CarePlanSelectorData {
  carePlanItems: CarePlanProblem[];
  reviews?: ProblemReview[];
  careActions?: ProblemIntervention[];
  carePlans?: ResidentCarePlan[];
}

export const getResidentCarePlanItems = (data: CarePlanSelectorData, residentId: string) =>
  data.carePlanItems.filter((item) => item.residentId === residentId);

export const getActiveCarePlanItems = (data: CarePlanSelectorData, residentId: string) =>
  getResidentCarePlanItems(data, residentId).filter((item) => item.status === "active");

export const getInactiveCarePlanItems = (data: CarePlanSelectorData, residentId: string) =>
  getResidentCarePlanItems(data, residentId).filter((item) => item.status !== "active");

export const getCarePlanItemsByRltDomain = (
  data: CarePlanSelectorData,
  residentId: string,
  domainId: RltDomainId,
  mode: "active" | "history" | "all" = "active",
) => {
  const items = getResidentCarePlanItems(data, residentId);
  return items.filter((item) => {
    if (mode === "active" && item.status !== "active") return false;
    if (mode === "history" && item.status === "active") return false;
    return getRltDomainForCarePlanProblem(item)?.id === domainId;
  });
};

export function getCarePlanItemById(
  data: CarePlanSelectorData,
  carePlanItemId: string,
  scope: { residentId?: string; nursingHomeId?: string } = {},
) {
  const item = data.carePlanItems.find((candidate) => candidate.id === carePlanItemId);
  if (!item) return undefined;
  if (scope.residentId && item.residentId !== scope.residentId) return undefined;
  if (scope.nursingHomeId && item.facilityId !== scope.nursingHomeId) return undefined;
  return item;
}

export const getReviewsForCarePlanItem = (data: CarePlanSelectorData, carePlanItemId: string) =>
  (data.reviews || []).filter((review) => review.problemId === carePlanItemId);

export const getCareActionsForCarePlanItem = (data: CarePlanSelectorData, carePlanItemId: string) =>
  (data.careActions || []).filter((action) => action.problemId === carePlanItemId);

export function getActiveCarePlanCountByDomain(data: CarePlanSelectorData, residentId: string) {
  return Object.fromEntries(
    RLT_DOMAINS.map((domain) => [
      domain.id,
      getCarePlanItemsByRltDomain(data, residentId, domain.id).length,
    ]),
  ) as Record<RltDomainId, number>;
}

export function getNextReviewDateForDomain(
  data: CarePlanSelectorData,
  residentId: string,
  domainId: RltDomainId,
) {
  return getCarePlanItemsByRltDomain(data, residentId, domainId)
    .map((item) => item.reviewDate)
    .filter(Boolean)
    .sort()[0];
}

export function getAllRltDomainSummaries(data: CarePlanSelectorData, residentId: string) {
  return RLT_DOMAINS.map((domain) => {
    const carePlanItems = getCarePlanItemsByRltDomain(data, residentId, domain.id);
    return {
      domain,
      carePlanItems,
      activeCount: carePlanItems.length,
      nextReviewDate: getNextReviewDateForDomain(data, residentId, domain.id),
    };
  });
}

export interface LegacyChildRecord {
  problemId?: string;
  carePlanItemId?: string;
  carePlanId?: string;
  residentId?: string;
  facilityId?: string;
}

export interface LegacyRelationResolution {
  carePlanItemId?: string;
  source: "explicit_item_id" | "legacy_parent_id" | "ambiguous" | "orphan";
  requiresManualReview: boolean;
}

export function resolveLegacyCarePlanItemRelation(
  record: LegacyChildRecord,
  data: CarePlanSelectorData,
): LegacyRelationResolution {
  const explicitId = record.carePlanItemId || record.problemId;
  if (explicitId && getCarePlanItemById(data, explicitId)) {
    return {
      carePlanItemId: explicitId,
      source: "explicit_item_id",
      requiresManualReview: false,
    };
  }
  if (!record.carePlanId) return { source: "orphan", requiresManualReview: true };
  const candidates = data.carePlanItems.filter(
    (item) =>
      item.residentCarePlanId === record.carePlanId &&
      (!record.residentId || item.residentId === record.residentId) &&
      (!record.facilityId || item.facilityId === record.facilityId),
  );
  if (candidates.length !== 1)
    return {
      source: candidates.length ? "ambiguous" : "orphan",
      requiresManualReview: true,
    };
  return {
    carePlanItemId: candidates[0].id,
    source: "legacy_parent_id",
    requiresManualReview: false,
  };
}

export interface RltIntegrityReport {
  issues: { code: string; entityId?: string }[];
  activeCounts: Record<RltDomainId, number>;
  inactiveCount: number;
  manualMappingRequired: string[];
}

export function validateRltCarePlanIntegrity(
  data: CarePlanSelectorData,
  residentId: string,
): RltIntegrityReport {
  const issues: RltIntegrityReport["issues"] = [];
  const ids = new Set<string>();
  for (const item of data.carePlanItems) {
    if (ids.has(item.id)) issues.push({ code: "duplicate_care_plan_item_id", entityId: item.id });
    ids.add(item.id);
    if (item.rltDomainId && !RLT_DOMAIN_BY_ID[item.rltDomainId])
      issues.push({ code: "invalid_rlt_domain", entityId: item.id });
    if (item.status === "active" && !getRltDomainForCarePlanProblem(item))
      issues.push({ code: "active_item_requires_mapping", entityId: item.id });
  }
  for (const review of data.reviews || [])
    if (!ids.has(review.problemId)) issues.push({ code: "orphan_review", entityId: review.id });
  for (const action of data.careActions || []) {
    const parent = data.carePlanItems.find((item) => item.id === action.problemId);
    if (!parent) issues.push({ code: "orphan_care_action", entityId: action.id });
    else if (parent.residentId !== action.residentId)
      issues.push({ code: "cross_resident_care_action", entityId: action.id });
    else if (parent.facilityId && action.facilityId && parent.facilityId !== action.facilityId)
      issues.push({ code: "cross_home_care_action", entityId: action.id });
  }
  return {
    issues,
    activeCounts: getActiveCarePlanCountByDomain(data, residentId),
    inactiveCount: getInactiveCarePlanItems(data, residentId).length,
    manualMappingRequired: data.carePlanItems
      .filter((item) => resolveCarePlanRltDomain(item).requiresManualReview)
      .map((item) => item.id),
  };
}
