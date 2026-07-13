export interface LegacyQueueReference {
  key: string;
  position: number;
  residentId?: string;
  wardId?: string;
  dueAt?: string;
  completed?: boolean;
}

export interface ProjectedQueueReference extends LegacyQueueReference {
  workItemId: string;
}

export interface WorkQueueParityReport {
  queue: string;
  legacyCount: number;
  projectedCount: number;
  missingFromProjection: string[];
  unexpectedInProjection: string[];
  duplicateProjectionKeys: string[];
  orderDifferences: { key: string; legacyPosition: number; projectedPosition: number }[];
  fieldDifferences: {
    key: string;
    field: "residentId" | "wardId" | "dueAt" | "completed";
    legacy: unknown;
    projected: unknown;
  }[];
  matches: boolean;
}

/** Compare stable source-occurrence keys. Display titles are deliberately excluded. */
export function compareWorkQueueParity(
  queue: string,
  legacy: LegacyQueueReference[],
  projected: ProjectedQueueReference[],
): WorkQueueParityReport {
  const legacyByKey = new Map(legacy.map((item) => [item.key, item]));
  const projectedByKey = new Map(projected.map((item) => [item.key, item]));
  const counts = new Map<string, number>();
  for (const item of projected) counts.set(item.key, (counts.get(item.key) || 0) + 1);
  const duplicateProjectionKeys = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => key)
    .sort();
  const missingFromProjection = [...legacyByKey.keys()]
    .filter((key) => !projectedByKey.has(key))
    .sort();
  const unexpectedInProjection = [...projectedByKey.keys()]
    .filter((key) => !legacyByKey.has(key))
    .sort();
  const orderDifferences: WorkQueueParityReport["orderDifferences"] = [];
  const fieldDifferences: WorkQueueParityReport["fieldDifferences"] = [];
  for (const [key, oldItem] of legacyByKey) {
    const nextItem = projectedByKey.get(key);
    if (!nextItem) continue;
    if (oldItem.position !== nextItem.position)
      orderDifferences.push({
        key,
        legacyPosition: oldItem.position,
        projectedPosition: nextItem.position,
      });
    for (const field of ["residentId", "wardId", "dueAt", "completed"] as const) {
      if (oldItem[field] !== nextItem[field])
        fieldDifferences.push({ key, field, legacy: oldItem[field], projected: nextItem[field] });
    }
  }
  const matches =
    legacy.length === projected.length &&
    !missingFromProjection.length &&
    !unexpectedInProjection.length &&
    !duplicateProjectionKeys.length &&
    !orderDifferences.length &&
    !fieldDifferences.length;
  return {
    queue,
    legacyCount: legacy.length,
    projectedCount: projected.length,
    missingFromProjection,
    unexpectedInProjection,
    duplicateProjectionKeys,
    orderDifferences,
    fieldDifferences,
    matches,
  };
}
