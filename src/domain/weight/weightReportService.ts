import type { ResidentObservationRecord } from "@/domain/observations/observationTypes";
import { calculateResidentWeightIntelligence } from "./weightIntelligenceCalculator";
import type { ResidentWeightIntelligence } from "./weightIntelligenceTypes";
import type { WeightConcernProjection } from "./weightLossRuleTypes";

export interface ResidentWeightReportRow {
  residentId: string;
  nursingHomeId: string;
  latestWeightKg?: number;
  latestWeightAt?: string;
  thirtyDayChangePercent?: number;
  threeMonthChangePercent?: number;
  sixMonthChangePercent?: number;
  dueStatus: string;
  activeConcernCount: number;
  recommendedAction: string;
}

export function getResidentWeightReport(records: ResidentObservationRecord[], residentIds: string[], nursingHomeId: string, concerns: WeightConcernProjection[] = [], generatedAt = new Date().toISOString()): ResidentWeightReportRow[] {
  return residentIds.map((residentId) => toReportRow(
    calculateResidentWeightIntelligence({ residentId, nursingHomeId, records, generatedAt }),
    concerns.filter((item) => item.residentId === residentId && item.nursingHomeId === nursingHomeId),
  ));
}

export function exportResidentWeightReportCsv(rows: ResidentWeightReportRow[]) {
  const header = ["Resident ID", "Latest Weight kg", "Latest Weight At", "30 Day Change %", "3 Month Change %", "6 Month Change %", "Due Status", "Active Concerns", "Recommended Action"];
  return [header, ...rows.map((row) => [
    row.residentId,
    row.latestWeightKg ?? "",
    row.latestWeightAt ?? "",
    row.thirtyDayChangePercent ?? "",
    row.threeMonthChangePercent ?? "",
    row.sixMonthChangePercent ?? "",
    row.dueStatus,
    row.activeConcernCount,
    row.recommendedAction,
  ])].map((line) => line.map(csv).join(",")).join("\n");
}

export function getWeightConcernAttentionList(concerns: WeightConcernProjection[], scope: { nursingHomeId: string; wardId?: string; includeResolved?: boolean }) {
  return concerns
    .filter((item) => item.nursingHomeId === scope.nursingHomeId)
    .filter((item) => !scope.wardId || item.wardId === scope.wardId)
    .filter((item) => scope.includeResolved || ["open", "acknowledged", "escalated"].includes(item.status))
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.latestDetectedAt.localeCompare(a.latestDetectedAt));
}

function toReportRow(intelligence: ResidentWeightIntelligence, concerns: WeightConcernProjection[]): ResidentWeightReportRow {
  const activeConcernCount = concerns.filter((item) => ["open", "acknowledged", "escalated"].includes(item.status)).length;
  return {
    residentId: intelligence.residentId,
    nursingHomeId: intelligence.nursingHomeId,
    latestWeightKg: intelligence.latestWeight?.weightKg,
    latestWeightAt: intelligence.latestWeight?.observedAt,
    thirtyDayChangePercent: intelligence.thirtyDayChange?.status === "calculated" ? intelligence.thirtyDayChange.changePercent : undefined,
    threeMonthChangePercent: intelligence.threeMonthChange?.status === "calculated" ? intelligence.threeMonthChange.changePercent : undefined,
    sixMonthChangePercent: intelligence.sixMonthChange?.status === "calculated" ? intelligence.sixMonthChange.changePercent : undefined,
    dueStatus: intelligence.missingOrOverdue.status,
    activeConcernCount,
    recommendedAction: recommendedAction(intelligence, activeConcernCount),
  };
}

function recommendedAction(intelligence: ResidentWeightIntelligence, activeConcernCount: number) {
  if (activeConcernCount > 0) return "Review open weight concern.";
  if (intelligence.missingOrOverdue.status === "overdue" || intelligence.missingOrOverdue.status === "missing_initial_weight") return "Record scheduled weight.";
  if (intelligence.thirtyDayChange?.status === "calculated" && (intelligence.thirtyDayChange.lossPercent ?? 0) >= 5) return "Review nutritional status and consider MUST reassessment.";
  return "Continue scheduled monitoring.";
}

function severityRank(value: WeightConcernProjection["severity"]) {
  return ({ critical: 4, high: 3, medium: 2 } as Record<WeightConcernProjection["severity"], number>)[value];
}

function csv(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
