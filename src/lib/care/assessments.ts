import type {
  Assessment, AssessmentType, AssessmentCategory, ReviewFrequency, ReviewTriggerType,
} from "./types";

// Category grouping for the picker (clinical taxonomy, separate from scoring meta)
export const ASSESSMENT_CATEGORIES: { id: AssessmentCategory; label: string; types: AssessmentType[] }[] = [
  { id: "mobility",       label: "Mobility",       types: ["barthel"] },
  { id: "pressure_care",  label: "Pressure Care",  types: ["waterlow", "norton"] },
  { id: "pain",           label: "Pain",           types: ["abbey_pain", "pain_chart"] },
  { id: "nutrition",      label: "Nutrition",      types: ["must", "mna", "nutrition"] },
  { id: "cognition",      label: "Cognition",      types: ["mmse", "four_at"] },
  { id: "continence",     label: "Continence",     types: ["continence"] },
  { id: "behaviour",      label: "Behaviour",      types: ["abc", "abs", "cornell", "gds15"] },
  { id: "safety",         label: "Safety",         types: ["falls"] },
  { id: "person_centred", label: "Person Centred", types: ["pinch_me"] },
];

export function categoryFor(type: AssessmentType): AssessmentCategory {
  for (const c of ASSESSMENT_CATEGORIES) if (c.types.includes(type)) return c.id;
  return "person_centred";
}

export const REVIEW_FREQ_DAYS: Record<ReviewFrequency, number> = {
  weekly: 7, monthly: 30, quarterly: 90, six_monthly: 182, annually: 365, custom: 30,
};

export function computeNextReviewDate(freq: ReviewFrequency, customDays?: number, from = new Date()): string {
  const days = freq === "custom" ? (customDays ?? 30) : REVIEW_FREQ_DAYS[freq];
  return new Date(from.getTime() + days * 86400000).toISOString().slice(0, 10);
}

export type DerivedStatus = "draft" | "in_progress" | "completed" | "due" | "overdue" | "superseded" | "archived" | "deleted";

export function deriveStatus(a: Assessment, today = new Date()): DerivedStatus {
  const s = a.status || "completed";
  if (s === "deleted" || s === "archived" || s === "superseded" || s === "draft" || s === "in_progress") return s as DerivedStatus;
  // completed → derive due/overdue from nextReassessmentDate
  if (a.nextReassessmentDate) {
    const due = new Date(a.nextReassessmentDate);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0) return "overdue";
    if (diffDays <= 7) return "due";
  }
  return "completed";
}

// Map trigger types → assessment types that should be reassessed
export const TRIGGER_TO_TYPES: Record<ReviewTriggerType, AssessmentType[]> = {
  post_fall: ["falls", "barthel"],
  post_hospital_return: ["waterlow", "barthel", "must", "abbey_pain", "mmse"],
  post_incident: ["falls", "abbey_pain"],
  medication_change: ["pinch_me", "falls"],
  condition_change: ["waterlow", "abbey_pain", "must", "mmse"],
  gp_request: [],
  mdt_request: [],
  family_concern: [],
  routine: [],
  manual: [],
};

export function statusBadgeCls(s: DerivedStatus): string {
  switch (s) {
    case "overdue":     return "bg-destructive/10 text-destructive border-destructive/30";
    case "due":         return "bg-warning/15 text-warning-foreground border-warning/40";
    case "completed":   return "bg-success/10 text-success border-success/20";
    case "draft":       return "bg-muted text-muted-foreground border-border";
    case "in_progress": return "bg-info/10 text-info border-info/20";
    case "archived":    return "bg-muted text-muted-foreground border-border";
    case "deleted":     return "bg-destructive/10 text-destructive border-destructive/30";
    case "superseded":  return "bg-muted text-muted-foreground border-border";
  }
}

export function riskBadgeCls(level: string): string {
  if (level === "very_high") return "bg-destructive/10 text-destructive border-destructive/30";
  if (level === "high")      return "bg-warning/15 text-warning-foreground border-warning/40";
  if (level === "moderate")  return "bg-info/10 text-info border-info/20";
  return "bg-success/10 text-success border-success/20";
}
