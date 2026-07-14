import { getApprovedRltDomainsForAssessmentRecord } from "./assessmentRltMappings";
import type { AssessmentCarePlanningGuidance } from "./assessmentCareGuidance";
import { RLT_DEPENDENCY_LABELS, type RltDependencyLevel, type RltDependencyState } from "./rltDependency";
import { RLT_DOMAINS, RLT_DOMAIN_BY_ID, getRltDomainForCarePlanProblem, getRltDomainsForRisk, type RltDomainId, type RltDomainKey } from "./rlt";
import { getCurrentResidentPreferences, getCurrentResidentStrengths, type PreferenceAccommodationStatus, type PreferenceImportance, type PreferenceSensitivity, type ResidentAbilityLevel, type StrengthPreferenceState } from "./residentStrengthPreferences";
import type { Alert, Assessment, CarePlanProblem, ClinicalAlert, ProblemEvaluation, ProblemIntervention, ProblemReview, Resident, Task } from "./types";

export type RltNeedStatus = "no_current_need_recorded" | "current_need" | "needs_review" | "high_priority_need" | "end_of_life_focus";
export type RltReviewState = "not_required" | "no_review_date" | "current" | "due_soon" | "due_today" | "overdue" | "review_recommended";
export type RltCarePlanCoverageStatus = "no_active_plan" | "one_active_plan" | "multiple_active_plans" | "active_plan_due_review" | "active_plan_overdue" | "inactive_history_only";

export interface RltCurrentNeedSummary { status: RltNeedStatus; title?: string; summary?: string; additionalNeedCount?: number; priority?: "routine" | "important" | "urgent" | "critical"; sourceType?: "care_plan" | "assessment" | "risk" | "clinical_review" | "manual_clinical_entry"; sourceEntityId?: string; recordedAt?: string; lastUpdatedAt?: string; }
export interface RltStrengthSummary { id: string; title: string; conciseDescription: string; abilityLevel: ResidentAbilityLevel; supportThatHelps: string[]; }
export interface RltPreferenceSummary { id: string; title: string; concisePreference: string; importance: PreferenceImportance; accommodationStatus: PreferenceAccommodationStatus; safetyReviewRequired: boolean; sensitivity: PreferenceSensitivity; }
export interface RltDependencySummary { level: RltDependencyLevel | null; displayLabel: string; effectiveFrom?: string; lastReviewedAt?: string; nextReviewDate?: string; reviewDue: boolean; reviewOverdue: boolean; }
export interface RltRiskSummary { riskId: string; riskType: string; displayName: string; level: "low" | "moderate" | "high" | "critical" | "unknown"; status: "active" | "under_review" | "controlled"; sourceType: "assessment" | "incident" | "observation" | "clinical_rule" | "manual"; sourceEntityId?: string; lastChangedAt?: string; route?: string; }
export interface RltCarePlanStatusSummary { status: RltCarePlanCoverageStatus; activeCount: number; inactiveCount: number; activePlans: Array<{ carePlanId: string; carePlanItemId: string; title: string; priority?: string; riskLevel?: string; createdAt: string; reviewDate?: string; route: string }>; hasActivePlan: boolean; hasInactiveHistory: boolean; }
export interface RltReviewStatusSummary { state: RltReviewState; nearestReviewDate?: string; daysUntilReview?: number; daysOverdue?: number; lastReviewedAt?: string; affectedCarePlanItemIds: string[]; assessmentTriggeredReview: boolean; riskTriggeredReview: boolean; dependencyReviewDue: boolean; route?: string; }
export interface RltCurrentCareFocusSummary { headline: string; keyActions: string[]; sourceCarePlanItemIds: string[]; updatedAt?: string; }
export interface RltRecentChangeSummary { direction: "improved" | "deteriorated" | "changed" | "new_issue" | "resolved"; label: string; occurredAt: string; sourceEntityType: string; sourceEntityId: string; route?: string; }
export type RltClinicalOverviewAlertType = "high_risk" | "critical_risk" | "no_active_care_plan" | "review_due" | "review_overdue" | "dependency_review_due" | "assessment_guidance_open" | "preference_safety_review" | "preference_not_accommodated" | "recent_deterioration" | "recent_improvement" | "work_overdue";
export interface RltClinicalOverviewAlert { type: RltClinicalOverviewAlertType; severity: "information" | "low" | "medium" | "high" | "critical"; label: string; explanation?: string; route?: string; }
export interface RltClinicalOverviewRoutes { openDomain: string; addCarePlan?: string; viewActiveCarePlans?: string; reviewCarePlan?: string; viewAssessments?: string; viewRisks?: string; viewDependency?: string; viewStrengths?: string; viewPreferences?: string; viewTimeline?: string; }
export interface RltClinicalOverviewDomain { rltDomainId: RltDomainId; rltDomainKey: RltDomainKey; displayName: string; displayOrder: number; currentNeed: RltCurrentNeedSummary; strengths: RltStrengthSummary[]; preferences: RltPreferenceSummary[]; dependency: RltDependencySummary; relatedRisks: RltRiskSummary[]; carePlanStatus: RltCarePlanStatusSummary; reviewStatus: RltReviewStatusSummary; currentCareFocus: RltCurrentCareFocusSummary; recentChange?: RltRecentChangeSummary; alerts: RltClinicalOverviewAlert[]; routes: RltClinicalOverviewRoutes; }
export interface ResidentRltClinicalOverview { residentId: string; nursingHomeId: string; generatedAt: string; overallSummary: { activeCarePlanCount: number; domainsWithActiveNeeds: number; domainsWithHighRisk: number; domainsWithReviewsDue: number; domainsWithOverdueReview: number; domainsWithoutActivePlan: number; domainsRequiringClinicalReview: number }; domains: RltClinicalOverviewDomain[]; }

export interface RltClinicalOverviewData {
  residents: Resident[];
  dependencyState: RltDependencyState;
  strengthPreferenceState: StrengthPreferenceState;
  carePlanProblems: CarePlanProblem[];
  interventions: ProblemIntervention[];
  evaluations: ProblemEvaluation[];
  reviews: ProblemReview[];
  assessments: Assessment[];
  alerts?: Alert[];
  clinicalAlerts?: ClinicalAlert[];
  guidance?: AssessmentCarePlanningGuidance[];
  tasks?: Task[];
  recentChanges?: RltRecentChangeSummary[];
}
export interface RltOverviewAuthorizationContext { nursingHomeId: string; capabilities: string[]; generatedAt?: string; }

const dateOnly = (value: string) => value.slice(0, 10);
const dayDelta = (date: string, now: string) => Math.ceil((Date.parse(`${dateOnly(date)}T00:00:00Z`) - Date.parse(`${dateOnly(now)}T00:00:00Z`)) / 86400000);
const riskRank: Record<string, number> = { critical: 5, very_high: 5, high: 4, moderate: 3, low: 2, unknown: 1, none: 0, resolved: 0 };
const riskLevel = (value?: string): RltRiskSummary["level"] => value === "very_high" || value === "critical" ? "critical" : value === "high" ? "high" : value === "moderate" ? "moderate" : value === "low" ? "low" : "unknown";
const priorityForPlan = (plan: CarePlanProblem): NonNullable<RltCurrentNeedSummary["priority"]> => plan.riskLevel === "very_high" ? "critical" : plan.riskLevel === "high" ? "urgent" : plan.riskLevel === "moderate" ? "important" : "routine";
const titleCase = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
const concise = (value: string, length = 180) => value.length > length ? `${value.slice(0, length - 1).trim()}…` : value;

function dependencyFor(data: RltClinicalOverviewData, residentId: string, homeId: string, domainId: RltDomainId, now: string): RltDependencySummary {
  const record = data.dependencyState.records.find((item) => item.residentId === residentId && item.nursingHomeId === homeId && item.rltDomainId === domainId && item.status === "current");
  const days = record?.nextReviewDate ? dayDelta(record.nextReviewDate, now) : undefined;
  return { level: record?.dependencyLevel || null, displayLabel: record ? RLT_DEPENDENCY_LABELS[record.dependencyLevel] : "Not Yet Recorded", effectiveFrom: record?.effectiveFrom, lastReviewedAt: record?.reviewedAt || record?.recordedAt, nextReviewDate: record?.nextReviewDate, reviewDue: days !== undefined && days >= 0 && days <= 7, reviewOverdue: days !== undefined && days < 0 };
}

function risksFor(data: RltClinicalOverviewData, residentId: string, homeId: string, domainId: RltDomainId, capabilities: string[]): RltRiskSummary[] {
  if (!capabilities.includes("rlt_overview.view_risks")) return [];
  const risks: RltRiskSummary[] = [];
  for (const assessment of data.assessments) {
    if (assessment.residentId !== residentId || assessment.facilityId && assessment.facilityId !== homeId || ["deleted", "archived", "superseded"].includes(assessment.status || "")) continue;
    if (!getApprovedRltDomainsForAssessmentRecord(assessment).some((domain) => domain.id === domainId)) continue;
    if (!assessment.riskLevel || ["none", "resolved", "low"].includes(assessment.riskLevel)) continue;
    risks.push({ riskId: `assessment-risk:${assessment.id}`, riskType: assessment.type, displayName: `${titleCase(assessment.type)} Risk`, level: riskLevel(assessment.riskLevel), status: "active", sourceType: "assessment", sourceEntityId: assessment.id, lastChangedAt: assessment.date, route: `/assessments/${assessment.id}` });
  }
  for (const alert of data.clinicalAlerts || []) {
    if (alert.residentId !== residentId || alert.facilityId && alert.facilityId !== homeId || alert.resolvedAt || alert.dismissedAt) continue;
    if (!getRltDomainsForRisk(alert.type).some((domain) => domain.id === domainId)) continue;
    risks.push({ riskId: alert.id, riskType: alert.type, displayName: alert.title, level: alert.severity === "critical" ? "critical" : "high", status: alert.acknowledged ? "under_review" : "active", sourceType: "clinical_rule", sourceEntityId: alert.sourceVitalId, lastChangedAt: alert.updatedAt || alert.createdAt, route: `/residents/${residentId}?careSection=vitals` });
  }
  return risks.sort((left, right) => riskRank[right.level] - riskRank[left.level] || `${right.lastChangedAt}`.localeCompare(`${left.lastChangedAt}`)).slice(0, 4);
}

function reviewFor(active: CarePlanProblem[], evaluations: ProblemEvaluation[], reviews: ProblemReview[], guidanceOpen: boolean, riskReview: boolean, dependency: RltDependencySummary, residentId: string, domainId: RltDomainId, now: string): RltReviewStatusSummary {
  const dates = active.map((plan) => plan.reviewDate).filter(Boolean).sort(); const nearest = dates[0]; const days = nearest ? dayDelta(nearest, now) : undefined;
  let state: RltReviewState = "not_required";
  if (!active.length && guidanceOpen) state = "review_recommended";
  else if (active.length && !nearest) state = "no_review_date";
  else if (days !== undefined && days < 0) state = "overdue";
  else if (days === 0) state = "due_today";
  else if (days !== undefined && days <= 7) state = "due_soon";
  else if (active.length) state = "current";
  const planIds = new Set(active.map((item) => item.id)); const lastReviewedAt = [...evaluations.filter((item) => planIds.has(item.problemId)).map((item) => item.date), ...reviews.filter((item) => planIds.has(item.problemId)).map((item) => item.reviewDate)].sort().at(-1);
  return { state, nearestReviewDate: nearest, daysUntilReview: days !== undefined && days >= 0 ? days : undefined, daysOverdue: days !== undefined && days < 0 ? Math.abs(days) : undefined, lastReviewedAt, affectedCarePlanItemIds: active.map((item) => item.id), assessmentTriggeredReview: guidanceOpen, riskTriggeredReview: riskReview, dependencyReviewDue: dependency.reviewDue || dependency.reviewOverdue, route: active.length ? `/residents/${residentId}?carePlanProblemId=${active[0].id}` : `/residents/${residentId}?rltDomainId=${domainId}` };
}

export function getResidentRltClinicalOverview(data: RltClinicalOverviewData, residentId: string, authorization: RltOverviewAuthorizationContext): ResidentRltClinicalOverview {
  if (!authorization.capabilities.includes("rlt_overview.view")) throw new Error("Missing capability: rlt_overview.view");
  const resident = data.residents.find((item) => item.id === residentId); if (!resident) throw new Error("Resident not found.");
  const residentHome = resident.facilityId || authorization.nursingHomeId; if (residentHome !== authorization.nursingHomeId) throw new Error("Resident is outside the authorised nursing home.");
  const now = authorization.generatedAt || new Date().toISOString();
  const preferenceCapabilities = ["resident_preference.view", authorization.capabilities.includes("rlt_overview.view_sensitive_preferences") ? "resident_preference.view_sensitive" : "", authorization.capabilities.includes("resident_preference.view_highly_sensitive") ? "resident_preference.view_highly_sensitive" : ""].filter(Boolean);
  const currentStrengths = getCurrentResidentStrengths(data.strengthPreferenceState, residentId, { nursingHomeId: residentHome, at: now });
  const currentPreferences = authorization.capabilities.includes("rlt_overview.view_preferences") ? getCurrentResidentPreferences(data.strengthPreferenceState, residentId, { nursingHomeId: residentHome, capabilities: ["resident_preference.view", ...preferenceCapabilities], at: now }) : [];
  const residentPlans = data.carePlanProblems.filter((item) => item.residentId === residentId && (!item.facilityId || item.facilityId === residentHome));
  const openGuidance = (data.guidance || []).filter((item) => item.residentId === residentId && item.nursingHomeId === residentHome && ["open", "acknowledged"].includes(item.status));
  const domains = RLT_DOMAINS.map((domain): RltClinicalOverviewDomain => {
    const active = authorization.capabilities.includes("rlt_overview.view_care_plans") ? residentPlans.filter((item) => item.status === "active" && getRltDomainForCarePlanProblem(item)?.id === domain.id).sort((left, right) => riskRank[right.riskLevel] - riskRank[left.riskLevel] || left.reviewDate.localeCompare(right.reviewDate) || left.id.localeCompare(right.id)) : [];
    const inactive = residentPlans.filter((item) => item.status !== "active" && getRltDomainForCarePlanProblem(item)?.id === domain.id);
    const dependency = dependencyFor(data, residentId, residentHome, domain.id, now);
    const strengths = currentStrengths.filter((item) => item.rltDomainId === domain.id).sort((left, right) => Number(right.abilityLevel === "independent") - Number(left.abilityLevel === "independent") || `${right.lastReviewedAt}`.localeCompare(`${left.lastReviewedAt}`)).slice(0, 3).map((item) => ({ id: item.id, title: item.title, conciseDescription: concise(item.description, 100), abilityLevel: item.abilityLevel, supportThatHelps: item.supportThatHelps.slice(0, 2) }));
    const preferences = currentPreferences.filter((item) => item.rltDomainId === domain.id).slice(0, 3).map((item) => ({ id: item.id, title: item.title, concisePreference: concise(item.preference, 100), importance: item.importance, accommodationStatus: item.accommodationStatus, safetyReviewRequired: item.safetyReviewStatus === "pending", sensitivity: item.sensitivity }));
    const relatedRisks = risksFor(data, residentId, residentHome, domain.id, authorization.capabilities);
    const guidance = openGuidance.filter((item) => item.rltDomainId === domain.id).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    const reviewStatus = reviewFor(active, data.evaluations, data.reviews, guidance.length > 0, relatedRisks.some((risk) => risk.level === "high" || risk.level === "critical"), dependency, residentId, domain.id, now);
    const carePlanStatusValue: RltCarePlanCoverageStatus = !active.length ? (inactive.length ? "inactive_history_only" : "no_active_plan") : reviewStatus.state === "overdue" ? "active_plan_overdue" : ["due_soon", "due_today"].includes(reviewStatus.state) ? "active_plan_due_review" : active.length > 1 ? "multiple_active_plans" : "one_active_plan";
    const carePlanStatus: RltCarePlanStatusSummary = { status: carePlanStatusValue, activeCount: active.length, inactiveCount: inactive.length, activePlans: active.map((item) => ({ carePlanId: item.residentCarePlanId, carePlanItemId: item.id, title: concise(item.problemStatement, 100), priority: priorityForPlan(item), riskLevel: item.riskLevel, createdAt: item.createdAt, reviewDate: item.reviewDate, route: `/residents/${residentId}?carePlanProblemId=${item.id}` })), hasActivePlan: active.length > 0, hasInactiveHistory: inactive.length > 0 };
    const highestPlan = active[0]; const highestRisk = relatedRisks[0]; const guidanceItem = guidance[0];
    const currentNeed: RltCurrentNeedSummary = highestPlan ? { status: domain.id === "dying" ? "end_of_life_focus" : ["high", "very_high"].includes(highestPlan.riskLevel) ? "high_priority_need" : reviewStatus.state === "overdue" ? "needs_review" : "current_need", title: concise(highestPlan.problemStatement, 100), summary: concise(highestPlan.problemStatement), additionalNeedCount: Math.max(0, active.length - 1), priority: priorityForPlan(highestPlan), sourceType: "care_plan", sourceEntityId: highestPlan.id, recordedAt: highestPlan.createdAt, lastUpdatedAt: highestPlan.createdAt } : guidanceItem ? { status: "needs_review", title: guidanceItem.title, summary: concise(guidanceItem.summary), priority: "important", sourceType: "assessment", sourceEntityId: guidanceItem.assessmentId, recordedAt: guidanceItem.createdAt, lastUpdatedAt: guidanceItem.updatedAt } : highestRisk ? { status: "needs_review", title: highestRisk.displayName, summary: "Active related risk requires clinical review; this is not a confirmed Care Need.", priority: highestRisk.level === "critical" ? "critical" : "urgent", sourceType: "risk", sourceEntityId: highestRisk.riskId, lastUpdatedAt: highestRisk.lastChangedAt } : { status: "no_current_need_recorded" };
    const actions = highestPlan ? data.interventions.filter((item) => item.problemId === highestPlan.id && ["active", "review_due"].includes(item.status)).sort((left, right) => left.id.localeCompare(right.id)).slice(0, 3).map((item) => concise(item.name, 90)) : [];
    const preference = preferences.find((item) => item.importance !== "routine" && item.accommodationStatus !== "cannot_accommodate");
    if (preference && actions.length < 4) actions.push(`Preference: ${preference.concisePreference}`);
    const currentCareFocus: RltCurrentCareFocusSummary = { headline: highestPlan ? concise(highestPlan.problemStatement, 140) : guidanceItem ? concise(guidanceItem.summary, 140) : "No current care focus recorded.", keyActions: actions, sourceCarePlanItemIds: highestPlan ? [highestPlan.id] : [], updatedAt: highestPlan?.createdAt || guidanceItem?.updatedAt };
    const alerts: RltClinicalOverviewAlert[] = [];
    if (highestRisk?.level === "critical") alerts.push({ type: "critical_risk", severity: "critical", label: highestRisk.displayName, route: highestRisk.route }); else if (highestRisk?.level === "high") alerts.push({ type: "high_risk", severity: "high", label: highestRisk.displayName, route: highestRisk.route });
    if (!active.length && (highestRisk || guidanceItem)) alerts.push({ type: "no_active_care_plan", severity: "medium", label: "No Active Nursing Care Plan", explanation: "Clinical review recommended.", route: `/residents/${residentId}?rltDomainId=${domain.id}` });
    if (reviewStatus.state === "overdue") alerts.push({ type: "review_overdue", severity: "high", label: `Review overdue by ${reviewStatus.daysOverdue} day${reviewStatus.daysOverdue === 1 ? "" : "s"}`, route: reviewStatus.route }); else if (["due_today", "due_soon"].includes(reviewStatus.state)) alerts.push({ type: "review_due", severity: "medium", label: reviewStatus.state === "due_today" ? "Review Due Today" : `Review due in ${reviewStatus.daysUntilReview} days`, route: reviewStatus.route });
    if (dependency.reviewDue || dependency.reviewOverdue) alerts.push({ type: "dependency_review_due", severity: dependency.reviewOverdue ? "high" : "medium", label: dependency.reviewOverdue ? "Dependency review overdue" : "Dependency review due", route: `/residents/${residentId}?rltDomainId=${domain.id}` });
    if (guidanceItem) alerts.push({ type: "assessment_guidance_open", severity: "medium", label: "Assessment Guidance Open", route: `/assessments/${guidanceItem.assessmentId}` });
    if (preferences.some((item) => item.safetyReviewRequired)) alerts.push({ type: "preference_safety_review", severity: "high", label: "Preference Safety Review Required", route: `/residents/${residentId}?rltDomainId=${domain.id}` });
    if (preferences.some((item) => item.accommodationStatus === "cannot_accommodate")) alerts.push({ type: "preference_not_accommodated", severity: "high", label: "Preference Cannot Be Accommodated", route: `/residents/${residentId}?rltDomainId=${domain.id}` });
    const recentChange = (data.recentChanges || []).filter((item) => Date.parse(item.occurredAt) >= Date.parse(now) - 7 * 86400000).find((item) => item.sourceEntityId && ([...active, ...inactive].some((plan) => plan.id === item.sourceEntityId) || data.dependencyState.records.some((record) => record.id === item.sourceEntityId && record.rltDomainId === domain.id)));
    const base = `/residents/${residentId}?rltDomainId=${domain.id}`;
    return { rltDomainId: domain.id, rltDomainKey: domain.key, displayName: domain.title, displayOrder: domain.displayOrder, currentNeed, strengths, preferences, dependency, relatedRisks, carePlanStatus, reviewStatus, currentCareFocus, recentChange, alerts, routes: { openDomain: base, addCarePlan: base, viewActiveCarePlans: active[0] ? `/residents/${residentId}?carePlanProblemId=${active[0].id}` : undefined, reviewCarePlan: reviewStatus.route, viewAssessments: `/residents/${residentId}/assessments?rltDomainId=${domain.id}`, viewRisks: base, viewDependency: base, viewStrengths: base, viewPreferences: base, viewTimeline: `${base}&rltTimelineDomain=${domain.id}` } };
  });
  return { residentId, nursingHomeId: residentHome, generatedAt: now, overallSummary: { activeCarePlanCount: domains.reduce((sum, item) => sum + item.carePlanStatus.activeCount, 0), domainsWithActiveNeeds: domains.filter((item) => item.currentNeed.status !== "no_current_need_recorded").length, domainsWithHighRisk: domains.filter((item) => item.relatedRisks.some((risk) => risk.level === "high" || risk.level === "critical")).length, domainsWithReviewsDue: domains.filter((item) => ["due_soon", "due_today"].includes(item.reviewStatus.state)).length, domainsWithOverdueReview: domains.filter((item) => item.reviewStatus.state === "overdue").length, domainsWithoutActivePlan: domains.filter((item) => !item.carePlanStatus.hasActivePlan).length, domainsRequiringClinicalReview: domains.filter((item) => item.reviewStatus.state === "review_recommended" || item.alerts.some((alert) => ["preference_safety_review", "critical_risk"].includes(alert.type))).length }, domains };
}
