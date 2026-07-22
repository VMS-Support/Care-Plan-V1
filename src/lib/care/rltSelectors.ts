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

export type CarePlanDomainCoverageAssessment =
  | "no_active_plan"
  | "active_plan_current"
  | "active_plan_review_due"
  | "active_plan_overdue"
  | "multiple_active_plans"
  | "manual_review_required";

export interface CarePlanDomainCoverage {
  residentId: string;
  nursingHomeId: string;
  rltDomainId: RltDomainId;
  activeCarePlanItems: Array<{
    carePlanId: string;
    carePlanItemId: string;
    title: string;
    riskLevel?: string;
    reviewDate?: string;
    lastReviewedAt?: string;
    status: string;
  }>;
  activeCount: number;
  hasActivePlan: boolean;
  hasPlanDueForReview: boolean;
  hasOverdueReview: boolean;
  nearestReviewDate?: string;
  coverageAssessment: CarePlanDomainCoverageAssessment;
}

export function getActiveCarePlanCoverageForDomain(
  data: CarePlanSelectorData,
  residentId: string,
  rltDomainId: RltDomainId,
  assessmentContext: { nursingHomeId: string; evaluatedAt: string },
): CarePlanDomainCoverage {
  const date = assessmentContext.evaluatedAt.slice(0, 10);
  const items = getCarePlanItemsByRltDomain(data, residentId, rltDomainId).filter(
    (item) => item.facilityId === assessmentContext.nursingHomeId,
  );
  const activeCarePlanItems = items.map((item) => {
    const reviews = getReviewsForCarePlanItem(data, item.id)
      .filter((review) => !review.facilityId || review.facilityId === assessmentContext.nursingHomeId)
      .sort((left, right) => right.reviewDate.localeCompare(left.reviewDate));
    return {
      carePlanId: item.residentCarePlanId,
      carePlanItemId: item.id,
      title: item.problemStatement,
      riskLevel: item.riskLevel,
      reviewDate: item.reviewDate,
      lastReviewedAt: reviews[0]?.reviewDate,
      status: item.status,
    };
  });
  const reviewDates = activeCarePlanItems.map((item) => item.reviewDate).filter(Boolean) as string[];
  const hasOverdueReview = reviewDates.some((reviewDate) => reviewDate < date);
  const hasPlanDueForReview = reviewDates.some((reviewDate) => reviewDate === date);
  let coverageAssessment: CarePlanDomainCoverageAssessment = "active_plan_current";
  if (activeCarePlanItems.length === 0) coverageAssessment = "no_active_plan";
  else if (activeCarePlanItems.length > 1) coverageAssessment = "multiple_active_plans";
  else if (hasOverdueReview) coverageAssessment = "active_plan_overdue";
  else if (hasPlanDueForReview) coverageAssessment = "active_plan_review_due";
  return {
    residentId,
    nursingHomeId: assessmentContext.nursingHomeId,
    rltDomainId,
    activeCarePlanItems,
    activeCount: activeCarePlanItems.length,
    hasActivePlan: activeCarePlanItems.length > 0,
    hasPlanDueForReview,
    hasOverdueReview,
    nearestReviewDate: reviewDates.sort()[0],
    coverageAssessment,
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
