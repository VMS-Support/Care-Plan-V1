import type { CarePlanProblem, DailyNote, ProblemEvaluation, ProblemReview, TimelineEvent } from "./types";
import type { DailyCareRecord } from "@/domain/dailyCare/dailyCareTypes";

export type ClinicalActivityKind =
  | "daily_note"
  | "daily_care"
  | "assessment"
  | "care_plan"
  | "vital"
  | "observation"
  | "incident"
  | "mdt";

export interface ClinicalActivityEntry {
  id: string;
  facilityId?: string;
  residentId: string;
  kind: ClinicalActivityKind;
  title: string;
  summary: string;
  occurredAt: string;
  /** Compatibility fields for existing Daily Notes rendering. */
  date: string;
  recordedBy?: string;
  staff: string;
  shift?: DailyNote["shift"];
  category: DailyNote["category"];
  observation: string;
  source: "daily_note" | "daily_care" | "automatic";
  careType?: string;
  outcome?: string;
  carePlanId?: string | null;
  sourceId: string;
  sourceKind: string;
  sourceRoute?: string;
  readOnly: boolean;
}

export interface ResidentHandoverActivity {
  eventId: string;
  residentId: string;
  occurredAt: string;
  eventType: ClinicalActivityKind;
  title: string;
  summary: string;
  recordedBy?: string;
  sourceModule: string;
  sourceRecordId: string;
  sourceRoute?: string;
}

/** A deliberately thin adapter over the existing clinical activity projection. */
export function getResidentHandoverActivity(input: {
  activity: ClinicalActivityEntry[];
  residentId: string;
  from: string;
  to: string;
}): ResidentHandoverActivity[] {
  const from = Date.parse(input.from);
  const to = Date.parse(input.to);
  return input.activity
    .filter((entry) => entry.residentId === input.residentId && Date.parse(entry.occurredAt) >= from && Date.parse(entry.occurredAt) <= to)
    .map((entry) => ({
      eventId: entry.id,
      residentId: entry.residentId,
      occurredAt: entry.occurredAt,
      eventType: entry.kind,
      title: entry.title,
      summary: entry.summary,
      recordedBy: entry.recordedBy,
      sourceModule: entry.source,
      sourceRecordId: entry.sourceId,
      sourceRoute: entry.sourceRoute,
    }))
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.eventId.localeCompare(right.eventId));
}

const titleCase = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function activityKindFor(event: TimelineEvent): ClinicalActivityKind | null {
  if (event.type.startsWith("assessment.")) return "assessment";
  if (event.type.startsWith("careplan.")) return "care_plan";
  if (event.type === "incident.created") return "incident";
  if (event.type === "mdt.created") return "mdt";
  if (event.type === "chart.observation") return event.linkedRecordKind === "vital" ? "vital" : "observation";
  return null;
}

function sourceRoute(event: TimelineEvent, kind: ClinicalActivityKind) {
  if (kind === "assessment" && event.linkedRecordId) return `/assessments/${event.linkedRecordId}`;
  if (kind === "care_plan" && event.linkedRecordId) return `/residents/${event.residentId}?carePlanProblemId=${event.linkedRecordId}`;
  if ((kind === "vital" || kind === "observation") && event.linkedRecordId) return `/residents/${event.residentId}?careSection=vitals&recordId=${event.linkedRecordId}`;
  if (kind === "incident" && event.linkedRecordId) return `/residents/${event.residentId}?careSection=incidents&recordId=${event.linkedRecordId}`;
  if (kind === "mdt" && event.linkedRecordId) return `/residents/${event.residentId}?careSection=mdt&recordId=${event.linkedRecordId}`;
  return undefined;
}

/**
 * Projects source records into the Daily Notes feed. It never persists a second
 * note: source IDs are retained so duplicate events collapse to one entry.
 */
export function projectClinicalActivityFeed(input: {
  notes: DailyNote[];
  dailyCareRecords: DailyCareRecord[];
  timelineEvents: TimelineEvent[];
  carePlanProblems?: CarePlanProblem[];
  problemEvaluations?: ProblemEvaluation[];
  problemReviews?: ProblemReview[];
  residentId?: string;
  facilityId?: string;
}): ClinicalActivityEntry[] {
  const inScope = (residentId: string, facilityId?: string) =>
    (!input.residentId || residentId === input.residentId) &&
    (!input.facilityId || !facilityId || facilityId === input.facilityId);
  // Earlier composite review submissions emitted both an evaluation and its
  // formal review. They remain separate source/audit records, but represent
  // one clinical action in this feed.
  const reviewSignatures = new Set(
    input.timelineEvents
      .filter((event) => event.type === "careplan.reviewed")
      .map((event) => `${event.residentId}:${event.createdAt.slice(0, 10)}:${event.createdBy}:${event.description || ""}`),
  );
  const carePlanIdForEvent = (event: TimelineEvent) => {
    if (event.linkedRecordKind === "care_plan_problem") return event.linkedRecordId || null;
    if (event.linkedRecordKind === "problem_evaluation") {
      return input.problemEvaluations?.find((item) => item.id === event.linkedRecordId)?.problemId || null;
    }
    if (event.linkedRecordKind === "problem_review") {
      return input.problemReviews?.find((item) => item.id === event.linkedRecordId)?.problemId || null;
    }
    return null;
  };
  const carePlanTitleForEvent = (event: TimelineEvent) => {
    const carePlanId = carePlanIdForEvent(event);
    const carePlan = input.carePlanProblems?.find((item) => item.id === carePlanId);
    if (!carePlan) return undefined;
    return carePlan.carePlanName?.trim() || carePlan.customCategoryLabel?.trim() || carePlan.problemStatement.trim();
  };
  const entries: ClinicalActivityEntry[] = [
    ...input.notes
      .filter((note) => inScope(note.residentId, note.facilityId))
      .map((note) => ({
        id: `daily-note:${note.id}`,
        facilityId: note.facilityId,
        residentId: note.residentId,
        kind: "daily_note" as const,
        title: "Daily Note",
        summary: note.observation || "Daily note recorded.",
        occurredAt: note.date,
        date: note.date,
        recordedBy: note.staff,
        staff: note.staff,
        shift: note.shift,
        category: note.category,
        observation: note.observation || "Daily note recorded.",
        source: "daily_note" as const,
        carePlanId: note.carePlanId || note.linkedProblemId || null,
        sourceId: note.id,
        sourceKind: "daily_note",
        readOnly: false,
      })),
    ...input.dailyCareRecords
      .filter((record) => record.status !== "entered_in_error" && inScope(record.residentId, record.nursingHomeId))
      .map((record) => ({
        id: `daily-care:${record.id}`,
        facilityId: record.nursingHomeId,
        residentId: record.residentId,
        kind: "daily_care" as const,
        title: `Daily Care · ${titleCase(record.careType)}`,
        summary: record.notes || record.outcomeSummary || "Daily care recorded.",
        occurredAt: record.occurredAt,
        date: record.occurredAt,
        recordedBy: record.recordedByStaffMemberId,
        staff: String(record.recordedByStaffMemberId || "Daily Care"),
        category: "general" as const,
        observation: record.notes || record.outcomeSummary || "Daily care recorded.",
        source: "daily_care" as const,
        careType: record.careType,
        outcome: record.outcome,
        sourceId: record.id,
        sourceKind: "daily_care_record",
        readOnly: true,
      })),
    ...input.timelineEvents
      .filter((event) => {
        if (!inScope(event.residentId, event.facilityId)) return false;
        const signature = `${event.residentId}:${event.createdAt.slice(0, 10)}:${event.createdBy}:${event.description || ""}`;
        return event.type !== "careplan.evaluated" || !reviewSignatures.has(signature);
      })
      .flatMap((event) => {
        const kind = activityKindFor(event);
        if (!kind) return [];
        const carePlanTitle = kind === "care_plan" ? carePlanTitleForEvent(event) : undefined;
        return [{
          id: `timeline-event:${event.id}`,
          facilityId: event.facilityId,
          residentId: event.residentId,
          kind,
          title: carePlanTitle ? `${carePlanTitle} — ${event.title}` : event.title,
          summary: event.description || "Clinical activity recorded.",
          occurredAt: event.createdAt,
          date: event.createdAt,
          recordedBy: event.createdBy,
          staff: event.createdBy || "System",
          category: "general" as const,
          observation: event.description || event.title,
          source: "automatic" as const,
          sourceId: event.linkedRecordId || event.id,
          sourceKind: event.linkedRecordKind || event.type,
          carePlanId: carePlanIdForEvent(event),
          sourceRoute: sourceRoute(event, kind),
          readOnly: true,
        }];
      }),
  ];

  return [...new Map(entries.map((entry) => [`${entry.kind}:${entry.sourceKind}:${entry.sourceId}`, entry])).values()]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || right.id.localeCompare(left.id));
}
