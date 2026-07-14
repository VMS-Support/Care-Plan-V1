import type { ScheduledIntervention } from "@/lib/care/intervention-schedule";
import type { WorkItem } from "./workTypes";

export interface InterventionParityDifference {
  key: string;
  legacy?: unknown;
  unified?: unknown;
}

export interface InterventionParityReport {
  legacyTotal: number;
  unifiedTotal: number;
  exactMatches: number;
  missingFromUnified: string[];
  extraInUnified: string[];
  statusMismatches: InterventionParityDifference[];
  dueTimeMismatches: InterventionParityDifference[];
  orderingMismatches: InterventionParityDifference[];
  residentMismatches: InterventionParityDifference[];
  roomMismatches: InterventionParityDifference[];
  wardMismatches: InterventionParityDifference[];
  sourceLinkMismatches: InterventionParityDifference[];
  rltLinkMismatches: InterventionParityDifference[];
  completionStateMismatches: InterventionParityDifference[];
  duplicateProjections: string[];
  crossHomeLeakage: string[];
  crossWardLeakage: string[];
  matches: boolean;
}

const legacyStatus = (status: ScheduledIntervention["status"]) =>
  status === "due_next_hour"
    ? "due_soon"
    : status === "due_today" || status === "upcoming"
      ? "scheduled"
      : status;
const unifiedStatus = (item: WorkItem) => {
  if (item.persistedStatus !== "scheduled") return item.persistedStatus;
  const status = item.dueTimeClassification?.primaryStatus;
  if (status === "next_hour") return "due_soon";
  if (status === "due_now" || status === "overdue") return status;
  return "scheduled";
};

export function compareLegacyAndUnifiedInterventionQueues(
  legacy: ScheduledIntervention[],
  unified: WorkItem[],
  selectedNursingHomeId?: string,
  selectedWardIds: string[] = [],
): InterventionParityReport {
  const keyForLegacy = (item: ScheduledIntervention) =>
    `${item.intervention.id}|${item.dueAt?.toISOString() || "unscheduled"}|${item.intervention.residentId}`;
  const keyForUnified = (item: WorkItem) =>
    `${item.source.parentEntityId}|${item.schedule.originalDueAt || item.schedule.dueAt || "unscheduled"}|${item.residentId}`;
  const legacyByKey = new Map(legacy.map((item) => [keyForLegacy(item), item]));
  const unifiedByKey = new Map(unified.map((item) => [keyForUnified(item), item]));
  const counts = new Map<string, number>();
  for (const item of unified) {
    const key = keyForUnified(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const duplicateProjections = [...counts]
    .filter(([, count]) => count > 1)
    .map(([key]) => key)
    .sort();
  const missingFromUnified = [...legacyByKey.keys()].filter((key) => !unifiedByKey.has(key)).sort();
  const extraInUnified = [...unifiedByKey.keys()].filter((key) => !legacyByKey.has(key)).sort();
  const statusMismatches: InterventionParityDifference[] = [];
  const dueTimeMismatches: InterventionParityDifference[] = [];
  const orderingMismatches: InterventionParityDifference[] = [];
  const residentMismatches: InterventionParityDifference[] = [];
  const roomMismatches: InterventionParityDifference[] = [];
  const wardMismatches: InterventionParityDifference[] = [];
  const sourceLinkMismatches: InterventionParityDifference[] = [];
  const rltLinkMismatches: InterventionParityDifference[] = [];
  const completionStateMismatches: InterventionParityDifference[] = [];
  let exactMatches = 0;
  for (const [key, oldItem] of legacyByKey) {
    const item = unifiedByKey.get(key);
    if (!item) continue;
    let differs = false;
    const add = (
      collection: InterventionParityDifference[],
      legacyValue: unknown,
      unifiedValue: unknown,
    ) => {
      if (legacyValue === unifiedValue) return;
      differs = true;
      collection.push({ key, legacy: legacyValue, unified: unifiedValue });
    };
    add(statusMismatches, legacyStatus(oldItem.status), unifiedStatus(item));
    add(
      dueTimeMismatches,
      oldItem.dueAt?.toISOString(),
      item.schedule.effectiveDueAt || item.schedule.dueAt,
    );
    add(residentMismatches, oldItem.intervention.residentId, String(item.residentId));
    add(sourceLinkMismatches, oldItem.intervention.id, item.source.parentEntityId);
    add(rltLinkMismatches, oldItem.problem?.rltDomainId, item.careContext?.rltDomainId);
    add(
      completionStateMismatches,
      Boolean(oldItem.completion && oldItem.status === "completed"),
      item.persistedStatus === "completed",
    );
    const legacyIndex = legacy.findIndex((candidate) => keyForLegacy(candidate) === key);
    const unifiedIndex = unified.findIndex((candidate) => keyForUnified(candidate) === key);
    add(orderingMismatches, legacyIndex, unifiedIndex);
    if (!differs) exactMatches += 1;
  }
  const crossHomeLeakage = selectedNursingHomeId
    ? unified
        .filter((item) => String(item.nursingHomeId) !== selectedNursingHomeId)
        .map((item) => String(item.id))
    : [];
  const crossWardLeakage = selectedWardIds.length
    ? unified
        .filter((item) => item.wardId && !selectedWardIds.includes(String(item.wardId)))
        .map((item) => String(item.id))
    : [];
  const matches = ![
    missingFromUnified,
    extraInUnified,
    statusMismatches,
    dueTimeMismatches,
    orderingMismatches,
    residentMismatches,
    roomMismatches,
    wardMismatches,
    sourceLinkMismatches,
    rltLinkMismatches,
    completionStateMismatches,
    duplicateProjections,
    crossHomeLeakage,
    crossWardLeakage,
  ].some((values) => values.length);
  return {
    legacyTotal: legacy.length,
    unifiedTotal: unified.length,
    exactMatches,
    missingFromUnified,
    extraInUnified,
    statusMismatches,
    dueTimeMismatches,
    orderingMismatches,
    residentMismatches,
    roomMismatches,
    wardMismatches,
    sourceLinkMismatches,
    rltLinkMismatches,
    completionStateMismatches,
    duplicateProjections,
    crossHomeLeakage,
    crossWardLeakage,
    matches,
  };
}
