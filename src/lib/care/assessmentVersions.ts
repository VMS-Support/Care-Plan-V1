import type { Assessment } from "./types";

function recordedAt(assessment: Assessment) {
  return assessment.lockedAt || assessment.date || "";
}

/** Newest first. Store insertion order is retained as the final tie-breaker. */
export function sortAssessmentsByRecency(assessments: Assessment[]) {
  return [...assessments].sort((left, right) => {
    const versionDifference = (right.version || 1) - (left.version || 1);
    if (versionDifference) return versionDifference;
    return recordedAt(right).localeCompare(recordedAt(left));
  });
}

export function latestAssessmentsByType(assessments: Assessment[]) {
  const latest = new Map<string, Assessment>();
  for (const assessment of sortAssessmentsByRecency(assessments)) {
    if (assessment.supersededById) continue;
    if (!latest.has(assessment.type)) latest.set(assessment.type, assessment);
  }
  return Array.from(latest.values());
}

/** Calculates legacy display versions without changing stored assessment or audit history. */
export function displayAssessmentVersion(assessment: Assessment, allAssessments: Assessment[]) {
  const matching = allAssessments.filter(
    (candidate) => candidate.residentId === assessment.residentId && candidate.type === assessment.type && candidate.status !== "deleted" && !candidate.deletedAt,
  );
  const storedVersions = matching.map((candidate) => candidate.version || 1).sort((left, right) => left - right);
  const hasValidSequentialStoredVersions = storedVersions.every((version, index) => version === index + 1);
  if (hasValidSequentialStoredVersions) return assessment.version || 1;
  const newestFirst = sortAssessmentsByRecency(matching);
  const index = newestFirst.findIndex((candidate) => candidate.id === assessment.id);
  return index < 0 ? assessment.version || 1 : newestFirst.length - index;
}
