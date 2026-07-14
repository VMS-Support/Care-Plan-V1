import type { WorkItem } from "@/domain/work/workTypes";
import type { RltTimelineItem } from "./rltTimeline";
import type { Alert } from "./types";

export const RESIDENT_RECENT_CHANGES_VERSION = 1;
export type ResidentClinicalDirection = "deteriorating" | "improving" | "new_issue" | "resolved" | "changed" | "stable";
export interface ResidentClinicalChange {
  id: string; changeType: string; direction: ResidentClinicalDirection; title: string; conciseSummary: string;
  severity: "information" | "low" | "medium" | "high" | "critical"; occurredAt: string; recordedAt?: string;
  source: RltTimelineItem["source"]; rltDomains: Array<{ rltDomainId: string; displayName: string }>;
  followUp: { required: boolean; completed: boolean; workItemIds: string[] }; actor?: RltTimelineItem["actor"];
  sensitivity: RltTimelineItem["sensitivity"];
}
export interface ResidentRecentClinicalChangesViewModel {
  residentId: string; nursingHomeId: string; generatedAt: string; cacheKey: string;
  period: { dateFrom: string; dateTo: string };
  summary: { deteriorating: number; improving: number; newIssues: number; resolved: number; requiringAction: number };
  changes: ResidentClinicalChange[];
}
export interface RecentChangesFilters { period: "24h" | "7d" | "30d"; direction?: "all" | ResidentClinicalDirection; }

export function decideResidentClinicalChangeInclusion(item: RltTimelineItem) {
  if (item.importance === "routine") return { include: false, importance: "routine" as const, reason: "Routine source event." };
  if (["clinical_deterioration", "clinical_improvement", "risk_opened", "risk_escalated", "risk_resolved", "incident_recorded", "hospital_return", "hospital_transfer", "assessment_risk_changed", "dependency_changed", "care_plan_reviewed"].includes(item.eventType)) return { include: true, importance: item.importance === "high" ? "high" as const : "important" as const, reason: "Meaningful clinical change." };
  return { include: false, importance: "routine" as const, reason: "Not a recent-change event type." };
}
const direction = (value?: string): ResidentClinicalDirection => value === "deteriorated" ? "deteriorating" : value === "improved" ? "improving" : value === "new_issue" ? "new_issue" : value === "resolved" ? "resolved" : value === "unchanged" ? "stable" : "changed";
const changeType = (eventType: string) => eventType === "clinical_deterioration" ? "observation_deterioration" : eventType === "clinical_improvement" ? "observation_improvement" : eventType === "risk_opened" ? "new_risk" : eventType === "incident_recorded" ? "incident" : eventType;

export function getResidentRecentClinicalChanges(input: { residentId: string; nursingHomeId: string; timeline: RltTimelineItem[]; workItems: WorkItem[]; alerts?: Alert[]; capabilities: string[]; filters: RecentChangesFilters; now?: string }): ResidentRecentClinicalChangesViewModel {
  if (!input.capabilities.includes("resident_recent_changes.view")) throw new Error("Missing capability: resident_recent_changes.view");
  const generatedAt = input.now || new Date().toISOString(); const days = input.filters.period === "24h" ? 1 : input.filters.period === "30d" ? 30 : 7;
  const dateFrom = new Date(Date.parse(generatedAt) - days * 86400000).toISOString();
  let changes = input.timeline.filter((item) => item.residentId === input.residentId && Date.parse(item.occurredAt) >= Date.parse(dateFrom) && decideResidentClinicalChangeInclusion(item).include).map((item): ResidentClinicalChange => {
    const linked = input.workItems.filter((work) => work.residentId === input.residentId && work.source.sourceEntityId === item.source.sourceEntityId && ["scheduled", "in_progress", "deferred"].includes(work.persistedStatus));
    return { id: `recent-change:${item.id}`, changeType: changeType(item.eventType), direction: direction(item.clinicalDirection), title: item.title, conciseSummary: item.summary, severity: item.severity || "information", occurredAt: item.occurredAt, recordedAt: item.recordedAt, source: item.source, rltDomains: item.rltDomains.map((tag) => ({ rltDomainId: tag.rltDomainId, displayName: tag.displayName })), followUp: { required: linked.length > 0 || item.eventType === "clinical_deterioration" || item.eventType === "incident_recorded", completed: linked.length === 0, workItemIds: linked.map((work) => String(work.id)) }, actor: item.actor, sensitivity: item.sensitivity };
  });
  for (const alert of (input.alerts || []).filter((item) => item.residentId === input.residentId && Date.parse(item.createdAt) >= Date.parse(dateFrom) && /^weight (loss|gain)/i.test(item.title))) changes.push({ id: `recent-change:weight:${alert.id}`, changeType: /loss/i.test(alert.title) ? "weight_loss" : "weight_gain", direction: /loss/i.test(alert.title) ? "deteriorating" : "improving", title: /loss/i.test(alert.title) ? "Significant Weight Loss" : "Clinically Significant Weight Gain", conciseSummary: alert.description, severity: alert.priority === "critical" ? "critical" : alert.priority === "high" ? "high" : "medium", occurredAt: alert.createdAt, source: { sourceModule: "charts", sourceEntityType: "weight_alert", sourceEntityId: alert.id, route: `/charts/${input.residentId}` }, rltDomains: [{ rltDomainId: "eating_drinking", displayName: "Eating and Drinking" }], followUp: { required: !alert.resolvedAt, completed: Boolean(alert.resolvedAt), workItemIds: [] }, sensitivity: "standard" });
  if (input.filters.direction && input.filters.direction !== "all") changes = changes.filter((item) => item.direction === input.filters.direction);
  const rank = { critical: 0, high: 1, medium: 2, low: 3, information: 4 }; changes.sort((a, b) => rank[a.severity] - rank[b.severity] || b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id));
  return { residentId: input.residentId, nursingHomeId: input.nursingHomeId, generatedAt, cacheKey: JSON.stringify(["resident-recent-changes", RESIDENT_RECENT_CHANGES_VERSION, input.residentId, input.nursingHomeId, dateFrom, generatedAt, input.filters, "capabilities-v1"]), period: { dateFrom, dateTo: generatedAt }, summary: { deteriorating: changes.filter((c) => c.direction === "deteriorating").length, improving: changes.filter((c) => c.direction === "improving").length, newIssues: changes.filter((c) => c.direction === "new_issue").length, resolved: changes.filter((c) => c.direction === "resolved").length, requiringAction: changes.filter((c) => c.followUp.required && !c.followUp.completed).length }, changes };
}
