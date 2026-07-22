import type {
  Assessment,
  AssessmentSuggestion,
  FrequencyType,
  ProblemCategory,
  ProblemRiskLevel,
} from "./types";

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

export function suggestionsForAssessment(
  assessment: Assessment,
): Omit<AssessmentSuggestion, "id" | "createdAt" | "status">[] {
  const suggestions: Omit<AssessmentSuggestion, "id" | "createdAt" | "status">[] = [];
  const base = {
    assessmentId: assessment.id,
    residentId: assessment.residentId,
    assessmentType: assessment.type,
  };

  switch (assessment.type) {
    case "waterlow":
      if (assessment.riskLevel === "high" || assessment.riskLevel === "very_high") {
        suggestions.push({
          ...base,
          category: "pressure",
          problemStatement: `Resident is at ${assessment.interpretation.toLowerCase()} of pressure ulcer development (Waterlow ${assessment.totalScore}).`,
          riskLevel: assessment.riskLevel as ProblemRiskLevel,
        });
      }
      break;
    case "must":
    case "mna":
    case "nutrition":
      if (["moderate", "high", "very_high"].includes(assessment.riskLevel)) {
        suggestions.push({
          ...base,
          category: "nutrition",
          problemStatement: `Resident is at risk of malnutrition (${assessment.type.toUpperCase()} score ${assessment.totalScore}).`,
          riskLevel: assessment.riskLevel as ProblemRiskLevel,
        });
      }
      break;
    case "falls":
      if (["moderate", "high", "very_high"].includes(assessment.riskLevel)) {
        suggestions.push({
          ...base,
          category: "falls",
          problemStatement: `Resident is at increased risk of falls (Falls assessment ${assessment.interpretation}).`,
          riskLevel: assessment.riskLevel as ProblemRiskLevel,
        });
      }
      break;
    case "abbey_pain":
    case "pain_chart":
      if (assessment.totalScore >= 8) {
        suggestions.push({
          ...base,
          category: "pain",
          problemStatement: `Resident is experiencing pain requiring active management (Abbey Pain ${assessment.totalScore}).`,
          riskLevel: assessment.totalScore >= 14 ? "very_high" : "high",
        });
      }
      break;
    case "cornell":
    case "gds15":
      if (assessment.riskLevel === "high" || assessment.riskLevel === "very_high") {
        suggestions.push({
          ...base,
          category: "mental_health",
          problemStatement: `Resident shows signs of depression / low mood (${assessment.type.toUpperCase()} ${assessment.totalScore}).`,
          riskLevel: assessment.riskLevel as ProblemRiskLevel,
        });
      }
      break;
    case "four_at":
    case "mmse":
      if (["moderate", "high", "very_high"].includes(assessment.riskLevel)) {
        suggestions.push({
          ...base,
          category: "cognition",
          problemStatement: `Cognitive impairment identified (${assessment.type.toUpperCase()} ${assessment.totalScore}).`,
          riskLevel: assessment.riskLevel as ProblemRiskLevel,
        });
      }
      break;
    case "continence":
      if (assessment.riskLevel !== "none" && assessment.riskLevel !== "low") {
        suggestions.push({
          ...base,
          category: "continence",
          problemStatement: `Continence support required (${assessment.interpretation}).`,
          riskLevel: assessment.riskLevel as ProblemRiskLevel,
        });
      }
      break;
    case "barthel":
      if (assessment.totalScore < 60) {
        suggestions.push({
          ...base,
          category: "mobility",
          problemStatement: `Reduced functional independence - high dependency for personal care (Barthel ${assessment.totalScore}).`,
          riskLevel: assessment.totalScore < 40 ? "high" : "moderate",
        });
      }
      break;
    case "abc":
    case "abs":
      suggestions.push({
        ...base,
        category: "behaviour",
        problemStatement: "Behavioural support required.",
        riskLevel: "moderate",
      });
      break;
  }

  return suggestions;
}

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
    const n = m[1] ? +m[1] : t.includes("twice") ? 2 : t.includes("three") ? 3 : 4;
    return { type: "daily", value: n, instructions: s };
  }
  if (/daily|each day/.test(t)) return { type: "daily", value: 1, instructions: s };
  return { type: "custom", instructions: s };
}

export function frequencyLabel(type: FrequencyType, value?: number, instructions?: string): string {
  if (instructions && type === "custom") return instructions;
  if (type === "hourly") return value && value > 1 ? `Every ${value} hours` : "Hourly";
  if (type === "daily") return !value || value === 1 ? "Daily" : `${value}x daily`;
  if (type === "weekly") return value && value > 1 ? `Every ${value} weeks` : "Weekly";
  if (type === "monthly") return value && value > 1 ? `Every ${value} months` : "Monthly";
  if (type === "prn") return "PRN (as needed)";
  return instructions || "Custom schedule";
}

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

export function newId(prefix: string) {
  return uid(prefix);
}

export const todayISO = today;
export const inDaysISO = inDays;
