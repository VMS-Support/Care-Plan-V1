import type { WorkItem, WorkSourceReference, WorkType } from "./workTypes";

const normalise = (value: string) => encodeURIComponent(value.trim().toLowerCase());

export function getWorkSourceKey(
  workType: WorkType,
  source: WorkSourceReference,
  discriminator?: string,
) {
  const occurrence = source.sourceOccurrenceId || discriminator || "definition";
  return [workType, source.sourceModule, source.sourceEntityType, source.sourceEntityId, occurrence]
    .map(normalise)
    .join(":");
}

/** Stable, replay-safe projection ID. It contains no title, resident name, or clock value. */
export function createDeterministicWorkItemId(
  workType: WorkType,
  source: WorkSourceReference,
  discriminator?: string,
) {
  return `work-item:${getWorkSourceKey(workType, source, discriminator)}`;
}

export function upsertWorkProjection(items: WorkItem[], projected: WorkItem) {
  const key = getWorkSourceKey(projected.workType, projected.source);
  const index = items.findIndex((item) => getWorkSourceKey(item.workType, item.source) === key);
  if (index < 0) return [...items, projected];
  const next = [...items];
  next[index] = { ...projected, id: items[index].id, createdAt: items[index].createdAt };
  return next;
}
