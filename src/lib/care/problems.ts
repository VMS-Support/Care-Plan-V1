import type {
  Assessment, AssessmentSuggestion, CarePlan, CarePlanProblem,
  FrequencyType, ProblemCategory, ProblemGoal, ProblemHistoryEntry,
  ProblemIntervention, ProblemRiskLevel, ResidentCarePlan,
  ProblemEvaluation, ProblemReview, CarePlanEvaluation, CarePlanReview,
  InterventionLog, ProblemInterventionLog,
} from "./types";
import { CATEGORY_TO_RLT_DOMAIN, getRltDomainForAssessment } from "./rlt";

let _seq = 0;
const uid = (p: string) => `${p}-${(++_seq).toString(36).padStart(5, "0")}`;
const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export const CATEGORY_LABELS: Record<ProblemCategory, string> = {
  pressure: "Pressure / Skin Integrity",
  falls: "Falls Risk",
  nutrition: "Nutrition",
  pain: "Pain Management",
  behaviour: "Behaviour",
  continence: "Continence",
  mobility: "Mobility",
  cognition: "Cognition",
  communication: "Communication",
  personal_care: "Personal Care",
  mental_health: "Mental Health",
  social: "Social / Wellbeing",
  sleep: "Sleep",
  medication: "Medication",
  end_of_life: "End of Life",
  skin: "Skin",
  safeguarding: "Safeguarding",
  custom: "Other",
};

export const RISK_COLORS: Record<ProblemRiskLevel, string> = {
  none: "bg-muted text-muted-foreground border-border",
  low: "bg-success/10 text-success border-success/20",
  moderate: "bg-info/10 text-info border-info/20",
  high: "bg-warning/15 text-warning-foreground border-warning/40",
  very_high: "bg-destructive/10 text-destructive border-destructive/30",
  resolved: "bg-success/15 text-success border-success/30",
};

export const PREDEFINED_GOALS: Record<ProblemCategory, string[]> = {
  pressure: ["Maintain skin integrity", "Prevent pressure ulcer development", "Improve repositioning compliance", "Monitor existing redness"],
  falls: ["Remain free from falls", "Reduce falls risk factors", "Improve safe transfers"],
  nutrition: ["Maintain adequate nutrition", "Prevent weight loss", "Achieve target oral intake"],
  pain: ["Maintain pain score within acceptable limits", "Improve comfort during care"],
  behaviour: ["Reduce frequency of distress behaviours", "Identify and reduce triggers"],
  continence: ["Maintain dignity in continence care", "Reduce episodes of incontinence"],
  mobility: ["Maintain safe mobility", "Improve transfer independence"],
  cognition: ["Optimise orientation and engagement"],
  communication: ["Support effective communication"],
  personal_care: ["Maintain personal hygiene to resident's preference"],
  mental_health: ["Support mental wellbeing", "Reduce low mood episodes"],
  social: ["Engage in meaningful social activity"],
  sleep: ["Improve sleep quality"],
  medication: ["Safe medication administration"],
  end_of_life: ["Maintain comfort and dignity", "Honour advance care wishes"],
  skin: ["Maintain skin integrity"],
  safeguarding: ["Ensure resident is safe from harm"],
  custom: [],
};

// -------- Suggestion mapping --------

export function suggestionsForAssessment(a: Assessment): Omit<AssessmentSuggestion, "id" | "createdAt" | "status">[] {
  const out: Omit<AssessmentSuggestion, "id" | "createdAt" | "status">[] = [];
  const base = { assessmentId: a.id, residentId: a.residentId, assessmentType: a.type };
  switch (a.type) {
    case "waterlow":
      if (a.riskLevel === "high" || a.riskLevel === "very_high") {
        out.push({ ...base, category: "pressure", problemStatement: `Resident is at ${a.interpretation.toLowerCase()} of pressure ulcer development (Waterlow ${a.totalScore}).`, riskLevel: a.riskLevel as ProblemRiskLevel });
      }
      break;
    case "must":
    case "mna":
    case "nutrition":
      if (a.riskLevel === "moderate" || a.riskLevel === "high" || a.riskLevel === "very_high") {
        out.push({ ...base, category: "nutrition", problemStatement: `Resident is at risk of malnutrition (${a.type.toUpperCase()} score ${a.totalScore}).`, riskLevel: a.riskLevel as ProblemRiskLevel });
      }
      break;
    case "falls":
      if (a.riskLevel === "high" || a.riskLevel === "very_high" || a.riskLevel === "moderate") {
        out.push({ ...base, category: "falls", problemStatement: `Resident is at increased risk of falls (Falls assessment ${a.interpretation}).`, riskLevel: a.riskLevel as ProblemRiskLevel });
      }
      break;
    case "abbey_pain":
    case "pain_chart":
      if (a.totalScore >= 8) {
        out.push({ ...base, category: "pain", problemStatement: `Resident is experiencing pain requiring active management (Abbey Pain ${a.totalScore}).`, riskLevel: a.totalScore >= 14 ? "very_high" : "high" });
      }
      break;
    case "cornell":
    case "gds15":
      if (a.riskLevel === "high" || a.riskLevel === "very_high") {
        out.push({ ...base, category: "mental_health", problemStatement: `Resident shows signs of depression / low mood (${a.type.toUpperCase()} ${a.totalScore}).`, riskLevel: a.riskLevel as ProblemRiskLevel });
      }
      break;
    case "four_at":
    case "mmse":
      if (a.riskLevel === "high" || a.riskLevel === "very_high" || a.riskLevel === "moderate") {
        out.push({ ...base, category: "cognition", problemStatement: `Cognitive impairment identified (${a.type.toUpperCase()} ${a.totalScore}).`, riskLevel: a.riskLevel as ProblemRiskLevel });
      }
      break;
    case "continence":
      if (a.riskLevel !== "none" && a.riskLevel !== "low") {
        out.push({ ...base, category: "continence", problemStatement: `Continence support required (${a.interpretation}).`, riskLevel: a.riskLevel as ProblemRiskLevel });
      }
      break;
    case "barthel":
      if (a.totalScore < 60) {
        out.push({ ...base, category: "mobility", problemStatement: `Reduced functional independence — high dependency for personal care (Barthel ${a.totalScore}).`, riskLevel: a.totalScore < 40 ? "high" : "moderate" });
      }
      break;
    case "abc":
    case "abs":
      out.push({ ...base, category: "behaviour", problemStatement: `Behavioural support required.`, riskLevel: "moderate" });
      break;
  }
  return out;
}

// -------- Frequency parsing for migration --------

export function parseFrequency(s?: string): { type: FrequencyType; value?: number; instructions?: string } {
  if (!s) return { type: "daily" };
  const t = s.toLowerCase().trim();
  let m = t.match(/every\s+(\d+)\s*hour/);
  if (m) return { type: "hourly", value: +m[1], instructions: s };
  m = t.match(/(\d+)\s*-?\s*hourly/);
  if (m) return { type: "hourly", value: +m[1], instructions: s };
  if (/prn|as required|as needed/.test(t)) return { type: "prn", instructions: s };
  if (/weekly|every week|once a week/.test(t)) return { type: "weekly", value: 1, instructions: s };
  if (/monthly|every month/.test(t)) return { type: "monthly", value: 1, instructions: s };
  m = t.match(/(\d+)\s*(?:x|times)\s*(?:per\s*)?day|(?:twice|three|four)\s+daily/);
  if (m) {
    const n = m[1] ? +m[1] : (t.includes("twice") ? 2 : t.includes("three") ? 3 : 4);
    return { type: "daily", value: n, instructions: s };
  }
  if (/daily|each day/.test(t)) return { type: "daily", value: 1, instructions: s };
  return { type: "custom", instructions: s };
}

export function frequencyLabel(type: FrequencyType, value?: number, instructions?: string): string {
  if (instructions && type === "custom") return instructions;
  if (type === "hourly") return value && value > 1 ? `Every ${value} hours` : "Hourly";
  if (type === "daily") return !value || value === 1 ? "Daily" : `${value}× daily`;
  if (type === "weekly") return value && value > 1 ? `Every ${value} weeks` : "Weekly";
  if (type === "monthly") return value && value > 1 ? `Every ${value} months` : "Monthly";
  if (type === "prn") return "PRN (as needed)";
  return instructions || "Custom schedule";
}

// -------- Category inference --------

export function inferCategory(titleOrCat?: string): ProblemCategory {
  const s = (titleOrCat || "").toLowerCase();
  if (/pressure|skin|waterlow/.test(s)) return "pressure";
  if (/fall/.test(s)) return "falls";
  if (/nutrition|weight|must|mna|food/.test(s)) return "nutrition";
  if (/pain/.test(s)) return "pain";
  if (/behav|distress|agitat/.test(s)) return "behaviour";
  if (/contin|bowel|bladder/.test(s)) return "continence";
  if (/mobil|transfer/.test(s)) return "mobility";
  if (/cogn|dement|memory/.test(s)) return "cognition";
  if (/communic/.test(s)) return "communication";
  if (/personal care|hygiene|wash/.test(s)) return "personal_care";
  if (/depress|mood|anxi|mental/.test(s)) return "mental_health";
  if (/social|engag/.test(s)) return "social";
  if (/sleep/.test(s)) return "sleep";
  if (/medic/.test(s)) return "medication";
  if (/end of life|palliat/.test(s)) return "end_of_life";
  if (/safeguard/.test(s)) return "safeguarding";
  return "custom";
}

function priorityToRisk(p?: string): ProblemRiskLevel {
  if (p === "critical") return "very_high";
  if (p === "high") return "high";
  if (p === "medium") return "moderate";
  if (p === "low") return "low";
  return "moderate";
}

// -------- Migration --------

export interface MigrationOutput {
  residentCarePlans: ResidentCarePlan[];
  carePlanProblems: CarePlanProblem[];
  problemGoals: ProblemGoal[];
  problemInterventions: ProblemIntervention[];
  problemEvaluations: ProblemEvaluation[];
  problemReviews: ProblemReview[];
  problemInterventionLogs: ProblemInterventionLog[];
  problemHistory: ProblemHistoryEntry[];
  legacyCarePlanIdToProblemId: Record<string, string>;
}

export function migrateLegacy(
  legacyPlans: CarePlan[],
  legacyEvaluations: CarePlanEvaluation[],
  legacyReviews: CarePlanReview[],
  legacyLogs: InterventionLog[],
  systemUser = "System (migration)",
): MigrationOutput {
  const residentCarePlans: ResidentCarePlan[] = [];
  const carePlanProblems: CarePlanProblem[] = [];
  const problemGoals: ProblemGoal[] = [];
  const problemInterventions: ProblemIntervention[] = [];
  const problemEvaluations: ProblemEvaluation[] = [];
  const problemReviews: ProblemReview[] = [];
  const problemInterventionLogs: ProblemInterventionLog[] = [];
  const problemHistory: ProblemHistoryEntry[] = [];
  const legacyCarePlanIdToProblemId: Record<string, string> = {};
  const residentToPlanId = new Map<string, string>();

  for (const plan of legacyPlans) {
    let rcpId = residentToPlanId.get(plan.residentId);
    if (!rcpId) {
      rcpId = uid("rcp");
      residentToPlanId.set(plan.residentId, rcpId);
      residentCarePlans.push({
        id: rcpId, residentId: plan.residentId, status: "active",
        createdAt: plan.createdAt || new Date().toISOString(),
        createdBy: plan.createdBy || systemUser,
      });
    }
    const problemId = uid("prob");
    legacyCarePlanIdToProblemId[plan.id] = problemId;
    const isActive = plan.status === "active" || plan.status === "draft" || plan.status === "review_due" || plan.status === "evaluation_due";
    const problem: CarePlanProblem = {
      id: problemId, residentCarePlanId: rcpId, residentId: plan.residentId,
      category: inferCategory(plan.category || plan.title),
      rltDomainId:
        getRltDomainForAssessment(plan.assessmentScoreSnapshot?.type)?.id ||
        CATEGORY_TO_RLT_DOMAIN[inferCategory(plan.category || plan.title)],
      problemStatement: plan.problemStatement || plan.problem || plan.title,
      riskLevel: priorityToRisk(plan.priority),
      sourceAssessmentId: plan.linkedAssessmentId,
      sourceAssessmentType: plan.assessmentScoreSnapshot?.type as any,
      createdBy: plan.createdBy || systemUser,
      createdAt: plan.createdAt || new Date().toISOString(),
      evaluationDate: plan.evaluationDate || inDays(14),
      reviewDate: plan.reviewDate || inDays(30),
      status: isActive ? "active" : plan.status === "completed" ? "resolved" : "archived",
      resolvedAt: plan.status === "completed" ? plan.updatedAt : undefined,
      resolvedBy: plan.status === "completed" ? plan.updatedBy : undefined,
    };
    carePlanProblems.push(problem);

    // Goals
    if (plan.goals && plan.goals.length) {
      for (const g of plan.goals) {
        problemGoals.push({
          id: uid("goal"), problemId, statement: g.title,
          targetDate: g.targetDate,
          status: g.status === "achieved" ? "achieved"
                : g.status === "partially_achieved" ? "partially_achieved"
                : g.status === "not_achieved" ? "not_achieved"
                : g.status === "discontinued" ? "discontinued"
                : "active",
          createdAt: problem.createdAt, createdBy: problem.createdBy,
        });
      }
    } else if (plan.goal) {
      problemGoals.push({
        id: uid("goal"), problemId, statement: plan.goal,
        status: "active", createdAt: problem.createdAt, createdBy: problem.createdBy,
      });
    }

    // Interventions
    if (plan.interventionsSpec && plan.interventionsSpec.length) {
      for (const it of plan.interventionsSpec) {
        const f = parseFrequency(it.frequency);
        problemInterventions.push({
          id: uid("int"), problemId, residentId: plan.residentId,
          name: it.name, description: it.description,
          frequencyType: f.type, frequencyValue: f.value, frequencyInstructions: f.instructions,
          assignedRole: it.assignedRole,
          assignedStaffName: it.assignedUser,
          status: it.status === "cancelled" ? "discontinued" : "active",
          createdAt: problem.createdAt, createdBy: problem.createdBy,
        });
      }
    } else if (plan.interventions && plan.interventions.length) {
      for (const name of plan.interventions) {
        const f = parseFrequency(plan.frequency);
        problemInterventions.push({
          id: uid("int"), problemId, residentId: plan.residentId,
          name, frequencyType: f.type, frequencyValue: f.value, frequencyInstructions: f.instructions,
          status: "active", createdAt: problem.createdAt, createdBy: problem.createdBy,
        });
      }
    }

    // Eval / Review
    for (const e of legacyEvaluations.filter(x => x.carePlanId === plan.id)) {
      problemEvaluations.push({
        id: uid("eval"), problemId, date: e.date,
        evaluatorId: "legacy", evaluatorName: e.evaluatedBy, role: e.role || "nurse",
        summary: e.summary,
        goalsMet: e.goalsMet === "yes" ? "yes" : e.goalsMet === "no" ? "no" : "partial",
        progress: e.outcomeRating === "excellent" || e.outcomeRating === "good" ? "improved"
                : e.outcomeRating === "deterioration" ? "deteriorated"
                : e.outcomeRating === "no" ? "requires_revision" : "stable",
        recommendations: e.recommendations, nextEvaluationDate: e.nextEvaluationDate,
      });
    }
    for (const rv of legacyReviews.filter(x => x.carePlanId === plan.id)) {
      problemReviews.push({
        id: uid("rev"), problemId, reviewDate: rv.date,
        reviewedById: "legacy", reviewedByName: rv.reviewer, role: rv.role || "nurse",
        outcome: rv.outcome === "close" ? "resolve"
               : rv.outcome === "modify" ? "modify"
               : rv.outcome === "continue" ? "continue"
               : rv.outcome.startsWith("refer") ? "refer" : "escalate",
        comments: rv.notes,
      });
    }

    // Logs — attach to first intervention if any, otherwise to problem only (use first intervention id placeholder)
    const interventionsForPlan = problemInterventions.filter(i => i.problemId === problemId);
    for (const l of legacyLogs.filter(x => x.carePlanId === plan.id)) {
      const match = interventionsForPlan[0];
      if (!match) continue;
      problemInterventionLogs.push({
        id: uid("log"), interventionId: match.id, problemId, residentId: l.residentId,
        date: l.date, time: l.time, staffId: "legacy", staffName: l.staff, role: l.role || "carer",
        outcome: l.outcome === "cancelled" ? "missed" : l.outcome,
        residentResponse: l.residentResponse, comments: l.comments,
      });
    }

    problemHistory.push({
      id: uid("hist"), problemId, timestamp: problem.createdAt,
      userId: "system", userName: systemUser, role: "cnm",
      action: "created", reason: "Migrated from legacy care plan",
    });
  }

  return {
    residentCarePlans, carePlanProblems, problemGoals, problemInterventions,
    problemEvaluations, problemReviews, problemInterventionLogs, problemHistory,
    legacyCarePlanIdToProblemId,
  };
}

export function newId(prefix: string) { return uid(prefix); }
export const todayISO = today;
export const inDaysISO = inDays;
