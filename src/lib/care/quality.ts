import type {
  Assessment,
  CarePlanProblem,
  ProblemEvaluation,
  ProblemGoal,
  ProblemIntervention,
} from "./types";
import {
  getRltDomainForAssessment,
  getRltDomainForCarePlanProblem,
  RLT_DOMAIN_BY_ID,
  type RltDomain,
  type RltDomainId,
} from "./rlt";

export type CarePlanQualityStatus =
  | "complete"
  | "needs_attention"
  | "incomplete"
  | "review_overdue";

export interface CarePlanQualityItem {
  label: string;
  ok: boolean;
  detail?: string;
  tone?: "ok" | "attention" | "overdue";
}

export interface CarePlanQualityResult {
  status: CarePlanQualityStatus;
  label: string;
  issues: string[];
  items: CarePlanQualityItem[];
}

export interface ResidentCoverageGap {
  id: string;
  assessmentId: string;
  assessmentName: string;
  message: string;
  primaryDomainId: RltDomainId;
  acceptedDomainIds: RltDomainId[];
  domains: RltDomain[];
}

export const CARE_PLAN_QUALITY_LABELS: Record<CarePlanQualityStatus, string> = {
  complete: "Complete",
  needs_attention: "Needs attention",
  incomplete: "Incomplete",
  review_overdue: "Review overdue",
};

export const CARE_PLAN_QUALITY_RANK: Record<CarePlanQualityStatus, number> = {
  review_overdue: 0,
  incomplete: 1,
  needs_attention: 2,
  complete: 3,
};

export function carePlanQualityClass(status: CarePlanQualityStatus) {
  if (status === "complete") return "bg-success/10 text-success border-success/30";
  if (status === "needs_attention") {
    return "bg-warning/10 text-warning-foreground border-warning/35";
  }
  if (status === "review_overdue") return "bg-destructive/10 text-destructive border-destructive/35";
  return "bg-muted text-muted-foreground border-border";
}

function todayKey(today: Date | string = new Date()) {
  return typeof today === "string" ? today.slice(0, 10) : today.toISOString().slice(0, 10);
}

function isBlank(value?: string) {
  return !value || value.trim().length === 0;
}

function isActiveIntervention(intervention: ProblemIntervention) {
  return intervention.status === "active";
}

export function getCarePlanQualityStatus({
  problem,
  goals,
  interventions,
  evaluations,
  today,
}: {
  problem: CarePlanProblem;
  goals: ProblemGoal[];
  interventions: ProblemIntervention[];
  evaluations: ProblemEvaluation[];
  today?: Date | string;
}): CarePlanQualityResult {
  const key = todayKey(today);
  const domain = getRltDomainForCarePlanProblem(problem);
  const hasCareNeed = !isBlank(problem.problemStatement);
  const hasPlan = goals.some((goal) => goal.status !== "discontinued" && !isBlank(goal.statement));
  const hasActiveActions = interventions.some(isActiveIntervention);
  const hasReviewDate = !isBlank(problem.reviewDate);
  const reviewOverdue = hasReviewDate && problem.reviewDate < key;
  const hasOutcomeReviewScheduled = !isBlank(problem.evaluationDate);
  const outcomeReviewOverdue = hasOutcomeReviewScheduled && problem.evaluationDate < key;
  const hasOutcomeReview = evaluations.length > 0;
  const hasRiskLevel = !!problem.riskLevel;

  const items: CarePlanQualityItem[] = [
    {
      label: "Care Need recorded",
      ok: hasCareNeed,
      detail: hasCareNeed ? undefined : "Add the resident's care need.",
    },
    {
      label: "Plan recorded",
      ok: hasPlan,
      detail: hasPlan ? undefined : "Add at least one plan or goal.",
    },
    {
      label: "Active Care Actions",
      ok: hasActiveActions,
      detail: hasActiveActions ? undefined : "Add at least one active care action.",
    },
    {
      label: "Care Plan Review Date",
      ok: hasReviewDate && !reviewOverdue,
      detail: !hasReviewDate
        ? "Set a care plan review date."
        : reviewOverdue
          ? "Care plan review is overdue."
          : undefined,
      tone: reviewOverdue ? "overdue" : undefined,
    },
    {
      label: "Review of Outcome",
      ok: hasOutcomeReview || (hasOutcomeReviewScheduled && !outcomeReviewOverdue),
      detail: !hasOutcomeReview && !hasOutcomeReviewScheduled
        ? "Record or schedule a review of outcome."
        : outcomeReviewOverdue
          ? "Review of outcome is overdue."
          : !hasOutcomeReview
            ? "Review of outcome is scheduled."
            : undefined,
      tone: outcomeReviewOverdue ? "overdue" : hasOutcomeReview ? undefined : "attention",
    },
    {
      label: "Activity of Living mapped",
      ok: !!domain,
      detail: domain ? domain.title : "Select an Activity of Living.",
    },
    {
      label: "Risk level recorded",
      ok: hasRiskLevel,
      detail: hasRiskLevel ? undefined : "Record the risk level.",
    },
  ];

  const issues = items.filter((item) => !item.ok).map((item) => item.label);
  const hasOverdue = reviewOverdue || outcomeReviewOverdue;
  const missingCore = !hasCareNeed || !hasPlan || !hasActiveActions || !domain || !hasRiskLevel;

  const status: CarePlanQualityStatus = hasOverdue
    ? "review_overdue"
    : missingCore
      ? "incomplete"
      : issues.length > 0
        ? "needs_attention"
        : "complete";

  return {
    status,
    label: CARE_PLAN_QUALITY_LABELS[status],
    issues,
    items,
  };
}

const HIGH_RISK_ASSESSMENT_COVERAGE: Partial<
  Record<
    Assessment["type"],
    {
      label: string;
      acceptedDomainIds: RltDomainId[];
      primaryDomainId: RltDomainId;
      message: string;
    }
  >
> = {
  must: {
    label: "MUST",
    primaryDomainId: "eating_drinking",
    acceptedDomainIds: ["eating_drinking"],
    message: "High nutrition risk identified. No Eating and Drinking nursing care plan found.",
  },
  mna: {
    label: "MNA",
    primaryDomainId: "eating_drinking",
    acceptedDomainIds: ["eating_drinking"],
    message: "High nutrition risk identified. No Eating and Drinking nursing care plan found.",
  },
  nutrition: {
    label: "Nutrition",
    primaryDomainId: "eating_drinking",
    acceptedDomainIds: ["eating_drinking"],
    message: "High nutrition risk identified. No Eating and Drinking nursing care plan found.",
  },
  waterlow: {
    label: "Waterlow",
    primaryDomainId: "personal_cleansing_dressing",
    acceptedDomainIds: ["personal_cleansing_dressing"],
    message: "High pressure risk identified. No Personal Cleansing and Dressing nursing care plan found.",
  },
  norton: {
    label: "Norton",
    primaryDomainId: "personal_cleansing_dressing",
    acceptedDomainIds: ["personal_cleansing_dressing"],
    message: "High pressure risk identified. No Personal Cleansing and Dressing nursing care plan found.",
  },
  falls: {
    label: "Falls",
    primaryDomainId: "safe_environment",
    acceptedDomainIds: ["safe_environment", "mobilisation"],
    message: "High falls risk identified. No related nursing care plan found.",
  },
  barthel: {
    label: "Barthel",
    primaryDomainId: "mobilisation",
    acceptedDomainIds: ["mobilisation", "personal_cleansing_dressing"],
    message: "High mobility or dependency risk identified. No related nursing care plan found.",
  },
  abbey_pain: {
    label: "Abbey Pain",
    primaryDomainId: "personal_cleansing_dressing",
    acceptedDomainIds: ["personal_cleansing_dressing", "mobilisation"],
    message: "High pain risk identified. No related nursing care plan found.",
  },
  pain_chart: {
    label: "Pain Chart",
    primaryDomainId: "personal_cleansing_dressing",
    acceptedDomainIds: ["personal_cleansing_dressing", "mobilisation"],
    message: "High pain risk identified. No related nursing care plan found.",
  },
};

function isHighRiskAssessment(assessment: Assessment) {
  return assessment.riskLevel === "high" || assessment.riskLevel === "very_high";
}

export function getResidentRltCoverageChecks(
  residentId: string,
  {
    assessments,
    carePlanProblems,
  }: {
    assessments: Assessment[];
    carePlanProblems: CarePlanProblem[];
  },
) {
  const activeDomainIds = new Set(
    carePlanProblems
      .filter((problem) => problem.residentId === residentId && problem.status === "active")
      .map((problem) => getRltDomainForCarePlanProblem(problem)?.id)
      .filter((domainId): domainId is RltDomainId => !!domainId),
  );

  return assessments
    .filter(
      (assessment) =>
        assessment.residentId === residentId &&
        isHighRiskAssessment(assessment) &&
        assessment.status !== "deleted" &&
        assessment.status !== "archived" &&
        assessment.status !== "superseded",
    )
    .map((assessment) => {
      const coverage = HIGH_RISK_ASSESSMENT_COVERAGE[assessment.type];
      if (!coverage) {
        const domain = getRltDomainForAssessment(assessment.type);
        if (!domain || activeDomainIds.has(domain.id)) return null;
        return {
          id: `${assessment.id}-${domain.id}`,
          assessmentId: assessment.id,
          assessmentName: domain.title,
          message: `High ${domain.shortLabel.toLowerCase()} risk identified. No related nursing care plan found.`,
          primaryDomainId: domain.id,
          acceptedDomainIds: [domain.id],
          domains: [domain],
        };
      }
      if (coverage.acceptedDomainIds.some((domainId) => activeDomainIds.has(domainId))) return null;
      return {
        id: `${assessment.id}-${coverage.primaryDomainId}`,
        assessmentId: assessment.id,
        assessmentName: coverage.label,
        message: coverage.message,
        primaryDomainId: coverage.primaryDomainId,
        acceptedDomainIds: coverage.acceptedDomainIds,
        domains: coverage.acceptedDomainIds.map((domainId) => RLT_DOMAIN_BY_ID[domainId]),
      };
    })
    .filter((gap): gap is ResidentCoverageGap => !!gap);
}
