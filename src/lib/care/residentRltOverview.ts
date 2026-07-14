import type { WorkItem } from "@/domain/work/workTypes";
import type { ResidentRltClinicalOverview, RltClinicalOverviewDomain } from "./rltClinicalOverview";
import type { RltDomainId, RltDomainKey } from "./rlt";

export const RESIDENT_RLT_OVERVIEW_VERSION = 1;
export type ResidentRltAttentionSeverity = "information" | "low" | "medium" | "high" | "critical";

export interface ResidentRltOverviewDomain {
  rltDomainId: RltDomainId;
  rltDomainKey: RltDomainKey;
  displayName: string;
  displayOrder: number;
  currentNeed: { status: RltClinicalOverviewDomain["currentNeed"]["status"]; title?: string; conciseSummary?: string; additionalNeedCount?: number };
  dependency: { level: RltClinicalOverviewDomain["dependency"]["level"]; label: string; reviewDue: boolean; reviewOverdue: boolean };
  highestRelatedRisk?: { riskId: string; label: string; level: "low" | "moderate" | "high" | "critical" | "unknown"; additionalRiskCount: number; route?: string };
  carePlan: { status: RltClinicalOverviewDomain["carePlanStatus"]["status"]; activeCount: number };
  review: { status: RltClinicalOverviewDomain["reviewStatus"]["state"]; nearestReviewDate?: string; daysOverdue?: number };
  currentCareFocus?: { headline: string };
  strengthsCount: number;
  preferencesCount: number;
  attention: { required: boolean; severity: ResidentRltAttentionSeverity; label?: string };
  linkedWork: { due: number; overdue: number };
  route: string;
  primaryAction: { label: string; route: string };
}

export interface ResidentRltOverviewViewModel {
  residentId: string;
  nursingHomeId: string;
  generatedAt: string;
  cacheKey: string;
  summary: { domainsWithCurrentNeed: number; domainsWithActivePlan: number; domainsWithHighRisk: number; domainsWithReviewDue: number; domainsWithReviewOverdue: number; domainsRequiringAttention: number };
  domains: ResidentRltOverviewDomain[];
}

const severityRank: Record<ResidentRltAttentionSeverity, number> = { information: 0, low: 1, medium: 2, high: 3, critical: 4 };
const activeWorkStatuses = new Set(["scheduled", "in_progress", "deferred"]);

function actionFor(domain: RltClinicalOverviewDomain, highestRisk: ResidentRltOverviewDomain["highestRelatedRisk"]) {
  if (domain.reviewStatus.state === "overdue" || domain.reviewStatus.state === "due_today") return { label: "Review Nursing Care Plan", route: domain.routes.reviewCarePlan || domain.routes.openDomain };
  if (highestRisk && ["high", "critical"].includes(highestRisk.level)) return { label: "Open Related Risk", route: highestRisk.route || domain.routes.viewRisks || domain.routes.openDomain };
  if (domain.carePlanStatus.activeCount > 1) return { label: "View Active Nursing Care Plans", route: domain.routes.viewActiveCarePlans || domain.routes.openDomain };
  if (domain.carePlanStatus.activeCount === 1) return { label: "Open Nursing Care Plan", route: domain.carePlanStatus.activePlans[0]?.route || domain.routes.openDomain };
  if (domain.reviewStatus.assessmentTriggeredReview) return { label: "Consider Nursing Care Plan", route: domain.routes.addCarePlan || domain.routes.openDomain };
  if (!domain.dependency.level) return { label: "Record Dependency", route: domain.routes.viewDependency || domain.routes.openDomain };
  return { label: "Open", route: domain.routes.openDomain };
}

export function getResidentRltOverview(clinical: ResidentRltClinicalOverview, capabilities: string[], workItems: WorkItem[] = []): ResidentRltOverviewViewModel {
  if (!capabilities.includes("resident_rlt_overview.view")) throw new Error("Missing capability: resident_rlt_overview.view");
  const canRisk = capabilities.includes("resident_rlt_overview.view_risks");
  const canPlans = capabilities.includes("resident_rlt_overview.view_care_plans");
  const domains = clinical.domains.map((domain): ResidentRltOverviewDomain => {
    const relatedRisks = canRisk ? domain.relatedRisks : [];
    const highest = relatedRisks[0];
    const highestRisk = highest ? { riskId: highest.riskId, label: highest.displayName, level: highest.level, additionalRiskCount: Math.max(0, relatedRisks.length - 1), route: highest.route } : undefined;
    const linked = workItems.filter((item) => item.residentId === clinical.residentId && item.careContext?.rltDomainId === domain.rltDomainId && activeWorkStatuses.has(item.persistedStatus));
    const now = Date.parse(clinical.generatedAt);
    const overdue = linked.filter((item) => { const due = item.schedule.effectiveDueAt || item.deferral?.deferredUntil || item.schedule.dueAt; return Boolean(due && Date.parse(due) < now); }).length;
    const candidates: Array<{ severity: ResidentRltAttentionSeverity; label: string }> = [];
    if (highest?.level === "critical") candidates.push({ severity: "critical", label: highest.displayName });
    else if (highest?.level === "high") candidates.push({ severity: "high", label: highest.displayName });
    if (domain.reviewStatus.state === "overdue") candidates.push({ severity: "high", label: "Review overdue" });
    if (domain.reviewStatus.state === "due_today") candidates.push({ severity: "medium", label: "Review due today" });
    if (domain.reviewStatus.assessmentTriggeredReview) candidates.push({ severity: "medium", label: "Care planning guidance open" });
    if (domain.dependency.reviewOverdue) candidates.push({ severity: "medium", label: "Dependency review overdue" });
    if (domain.preferences.some((item) => item.safetyReviewRequired)) candidates.push({ severity: "medium", label: "Preference safety review pending" });
    if (domain.currentNeed.status === "high_priority_need" || domain.currentNeed.status === "end_of_life_focus") candidates.push({ severity: "high", label: "High-priority current need" });
    if (domain.recentChange?.direction === "deteriorated") candidates.push({ severity: "high", label: "Recent deterioration" });
    if (overdue) candidates.push({ severity: linked.some((item) => item.priority === "critical") ? "critical" : linked.some((item) => item.priority === "urgent") ? "high" : "medium", label: `${overdue} overdue work item${overdue === 1 ? "" : "s"}` });
    const attention = candidates.sort((a, b) => severityRank[b.severity] - severityRank[a.severity])[0];
    const carePlanStatus = canPlans ? domain.carePlanStatus.status : "no_active_plan";
    const activeCount = canPlans ? domain.carePlanStatus.activeCount : 0;
    return {
      rltDomainId: domain.rltDomainId, rltDomainKey: domain.rltDomainKey, displayName: domain.displayName, displayOrder: domain.displayOrder,
      currentNeed: { status: domain.currentNeed.status, title: domain.currentNeed.title, conciseSummary: domain.currentNeed.summary, additionalNeedCount: domain.currentNeed.additionalNeedCount },
      dependency: { level: domain.dependency.level, label: capabilities.includes("resident_rlt_overview.view_dependency") ? domain.dependency.displayLabel : "Restricted", reviewDue: domain.dependency.reviewDue, reviewOverdue: domain.dependency.reviewOverdue },
      highestRelatedRisk: highestRisk,
      carePlan: { status: carePlanStatus, activeCount }, review: { status: domain.reviewStatus.state, nearestReviewDate: domain.reviewStatus.nearestReviewDate, daysOverdue: domain.reviewStatus.daysOverdue },
      currentCareFocus: domain.currentCareFocus.headline ? { headline: domain.currentCareFocus.headline } : undefined,
      strengthsCount: domain.strengths.length, preferencesCount: capabilities.includes("resident_rlt_overview.view_preferences") ? domain.preferences.length : 0,
      attention: { required: Boolean(attention), severity: attention?.severity || "information", label: attention?.label }, linkedWork: { due: linked.length, overdue },
      route: domain.routes.openDomain, primaryAction: actionFor(domain, highestRisk),
    };
  }).sort((a, b) => a.displayOrder - b.displayOrder);
  return { residentId: clinical.residentId, nursingHomeId: clinical.nursingHomeId, generatedAt: clinical.generatedAt, cacheKey: JSON.stringify(["resident-rlt-overview", RESIDENT_RLT_OVERVIEW_VERSION, clinical.residentId, clinical.nursingHomeId, "resident-rlt-capabilities-v1"]), summary: { domainsWithCurrentNeed: domains.filter((d) => d.currentNeed.status !== "no_current_need_recorded").length, domainsWithActivePlan: domains.filter((d) => d.carePlan.activeCount > 0).length, domainsWithHighRisk: domains.filter((d) => d.highestRelatedRisk && ["high", "critical"].includes(d.highestRelatedRisk.level)).length, domainsWithReviewDue: domains.filter((d) => ["due_soon", "due_today"].includes(d.review.status)).length, domainsWithReviewOverdue: domains.filter((d) => d.review.status === "overdue").length, domainsRequiringAttention: domains.filter((d) => d.attention.required).length }, domains };
}
