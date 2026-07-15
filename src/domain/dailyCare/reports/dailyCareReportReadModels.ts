import type {
  DailyCareAlternativeOffered,
  DailyCareDetails,
  FluidCareDetails,
  FoodCareDetails,
} from "../dailyCareDetails";
import {
  DAILY_CARE_LABELS,
  type DailyCareOutcome,
  type DailyCareRecord,
  type DailyCareType,
} from "../dailyCareTypes";
import type {
  AdlReportRow,
  BehaviourReportRow,
  DailyCareReportCommonRow,
  DailyCareReportFilters,
  DailyCareReportOptions,
  DailyCareReportResult,
  DailyCareReportRow,
  DailyCareReportSourceContext,
  DailyCareReportType,
  FluidReportRow,
  FoodReportRow,
  RefusalReportRow,
  RepositioningReportRow,
  SleepReportRow,
  ToiletingReportRow,
} from "./dailyCareReportTypes";

const ADL_CARE_TYPES: DailyCareType[] = [
  "personal_care",
  "dressing",
  "oral_care",
  "mobility",
  "toileting",
  "continence",
  "food",
  "fluids",
  "comfort",
  "sleep",
  "refusal",
];

const REPORT_CARE_TYPES: Record<DailyCareReportType, DailyCareType[]> = {
  food: ["food", "refusal"],
  fluids: ["fluids", "refusal"],
  toileting: ["toileting", "continence"],
  adl: ADL_CARE_TYPES,
  repositioning: ["repositioning", "refusal"],
  refusal: ["refusal"],
  behaviour: ["behaviour"],
  sleep: ["sleep"],
};

export function getFoodReport(records: DailyCareRecord[], options: DailyCareReportOptions = {}, context: DailyCareReportSourceContext = {}): DailyCareReportResult<FoodReportRow> {
  return buildReport("food", records, options, context, toFoodRow);
}

export function getFluidReport(records: DailyCareRecord[], options: DailyCareReportOptions = {}, context: DailyCareReportSourceContext = {}): DailyCareReportResult<FluidReportRow> {
  return buildReport("fluids", records, options, context, toFluidRow);
}

export function getToiletingReport(records: DailyCareRecord[], options: DailyCareReportOptions = {}, context: DailyCareReportSourceContext = {}): DailyCareReportResult<ToiletingReportRow> {
  return buildReport("toileting", records, options, context, toToiletingRow);
}

export function getAdlReport(records: DailyCareRecord[], options: DailyCareReportOptions = {}, context: DailyCareReportSourceContext = {}): DailyCareReportResult<AdlReportRow> {
  return buildReport("adl", records, options, context, toAdlRow);
}

export function getRepositioningReport(records: DailyCareRecord[], options: DailyCareReportOptions = {}, context: DailyCareReportSourceContext = {}): DailyCareReportResult<RepositioningReportRow> {
  return buildReport("repositioning", records, options, context, toRepositioningRow);
}

export function getRefusalReport(records: DailyCareRecord[], options: DailyCareReportOptions = {}, context: DailyCareReportSourceContext = {}): DailyCareReportResult<RefusalReportRow> {
  return buildReport("refusal", records, options, context, toRefusalRow, (record) => record.careType === "refusal" || record.outcome === "refused");
}

export function getBehaviourReport(records: DailyCareRecord[], options: DailyCareReportOptions = {}, context: DailyCareReportSourceContext = {}): DailyCareReportResult<BehaviourReportRow> {
  return buildReport("behaviour", records, options, context, toBehaviourRow);
}

export function getSleepReport(records: DailyCareRecord[], options: DailyCareReportOptions = {}, context: DailyCareReportSourceContext = {}): DailyCareReportResult<SleepReportRow> {
  return buildReport("sleep", records, options, context, toSleepRow);
}

export function getDailyCareReport(reportType: DailyCareReportType, records: DailyCareRecord[], options: DailyCareReportOptions = {}, context: DailyCareReportSourceContext = {}) {
  switch (reportType) {
    case "food":
      return getFoodReport(records, options, context);
    case "fluids":
      return getFluidReport(records, options, context);
    case "toileting":
      return getToiletingReport(records, options, context);
    case "adl":
      return getAdlReport(records, options, context);
    case "repositioning":
      return getRepositioningReport(records, options, context);
    case "refusal":
      return getRefusalReport(records, options, context);
    case "behaviour":
      return getBehaviourReport(records, options, context);
    case "sleep":
      return getSleepReport(records, options, context);
  }
}

export function exportDailyCareReportCsv(result: DailyCareReportResult): string {
  const headers = [
    "Resident",
    "Room",
    "Ward",
    "Occurred At",
    "Recorded At",
    "Care Type",
    "Outcome",
    "Participation",
    "Delivered By",
    "Notes",
    "Escalation",
    "Follow Up",
    "Linked Work",
    "RLT Domains",
    "Structured Details",
  ];
  return [
    headers.join(","),
    ...result.rows.map((row) =>
      [
        row.resident,
        row.room ?? "",
        row.ward ?? "",
        row.occurredAt,
        row.recordedAt,
        row.careTypeLabel,
        row.outcome,
        row.participation,
        row.deliveredBy ?? row.recordedBy ?? "",
        row.hasNotes ? "Yes" : "No",
        row.hasEscalation ? "Yes" : "No",
        row.followUpRequired ? "Yes" : "No",
        row.hasLinkedWorkItem ? "Yes" : "No",
        row.rltDomainIds.join("; "),
        describeStructuredFields(row),
      ].map(csvValue).join(","),
    ),
  ].join("\n");
}

function buildReport<TRow extends DailyCareReportRow>(
  reportType: DailyCareReportType,
  records: DailyCareRecord[],
  options: DailyCareReportOptions,
  context: DailyCareReportSourceContext,
  mapRow: (record: DailyCareRecord, context: ProjectionContext) => TRow | undefined,
  customMatch?: (record: DailyCareRecord) => boolean,
): DailyCareReportResult<TRow> {
  const projectionContext = createProjectionContext(context);
  const allowedCareTypes = REPORT_CARE_TYPES[reportType];
  const filtered = applyFilters(records, allowedCareTypes, options.filters, projectionContext, customMatch);
  const rows = filtered.map((record) => mapRow(record, projectionContext)).filter((row): row is TRow => Boolean(row));
  const sorted = sortRows(rows, options);
  const pageSize = Math.max(1, options.pagination?.pageSize ?? 25);
  const pageIndex = Math.max(0, options.pagination?.pageIndex ?? 0);
  const start = pageIndex * pageSize;
  return {
    reportType,
    rows: sorted.slice(start, start + pageSize),
    total: sorted.length,
    pageIndex,
    pageSize,
    groups: buildGroups(sorted, options.groupBy ?? []),
  };
}

interface ProjectionContext {
  residentById: Map<string, NonNullable<DailyCareReportSourceContext["residents"]>[number]>;
  wardById: Map<string, NonNullable<DailyCareReportSourceContext["wards"]>[number]>;
  roomById: Map<string, NonNullable<DailyCareReportSourceContext["rooms"]>[number]>;
  bedById: Map<string, NonNullable<DailyCareReportSourceContext["beds"]>[number]>;
  staffById: Map<string, NonNullable<DailyCareReportSourceContext["staffMembers"]>[number]>;
  escalatedRecordIds: Set<string>;
  trendByRecordId: Map<string, string[]>;
}

function createProjectionContext(context: DailyCareReportSourceContext): ProjectionContext {
  const trendByRecordId = new Map<string, string[]>();
  for (const trend of context.trendEvaluations ?? []) {
    if (trend.status !== "matched") continue;
    for (const recordId of trend.evidenceRecordIds) {
      trendByRecordId.set(recordId, [...(trendByRecordId.get(recordId) ?? []), trend.trendType]);
    }
  }

  return {
    residentById: new Map((context.residents ?? []).map((item) => [item.residentId, item])),
    wardById: new Map((context.wards ?? []).map((item) => [item.wardId, item])),
    roomById: new Map((context.rooms ?? []).map((item) => [item.roomId, item])),
    bedById: new Map((context.beds ?? []).map((item) => [item.bedId, item])),
    staffById: new Map((context.staffMembers ?? []).map((item) => [item.staffMemberId, item])),
    escalatedRecordIds: new Set((context.escalations ?? []).flatMap((item) => item.sourceDailyCareRecordIds)),
    trendByRecordId,
  };
}

function applyFilters(
  records: DailyCareRecord[],
  allowedCareTypes: DailyCareType[],
  filters: DailyCareReportFilters = {},
  context: ProjectionContext,
  customMatch?: (record: DailyCareRecord) => boolean,
) {
  return records
    .filter((record) => (customMatch ? customMatch(record) : allowedCareTypes.includes(record.careType)))
    .filter((record) => !filters.careTypes?.length || filters.careTypes.includes(record.careType))
    .filter((record) => filters.includeEnteredInError || record.status !== "entered_in_error")
    .filter((record) => filters.includeCorrectedRecords || record.status !== "corrected")
    .filter((record) => matchList(record.nursingHomeId, filters.nursingHomeIds))
    .filter((record) => matchList(record.wardId, filters.wardIds))
    .filter((record) => matchList(record.residentId, filters.residentIds))
    .filter((record) => matchList(record.roomId, filters.roomIds))
    .filter((record) => matchList(record.bedId, filters.bedIds))
    .filter((record) => matchList(record.shiftId, filters.shiftIds))
    .filter((record) => !filters.outcomes?.length || filters.outcomes.includes(record.outcome))
    .filter((record) => filters.followUpRequired === undefined || record.followUpRequired === filters.followUpRequired)
    .filter((record) => filters.escalationPresent === undefined || context.escalatedRecordIds.has(record.id) === filters.escalationPresent)
    .filter((record) => !filters.rltDomainIds?.length || filters.rltDomainIds.some((id) => record.rltDomainIds.includes(id)))
    .filter((record) => !filters.staffMemberIds?.length || filters.staffMemberIds.includes(String(record.deliveredByStaffMemberId ?? "")) || filters.staffMemberIds.includes(String(record.recordedByStaffMemberId ?? "")))
    .filter((record) => !filters.dateFrom || record.occurredAt >= filters.dateFrom)
    .filter((record) => !filters.dateTo || record.occurredAt <= filters.dateTo);
}

function commonRow(record: DailyCareRecord, context: ProjectionContext): DailyCareReportCommonRow {
  const resident = context.residentById.get(String(record.residentId));
  const ward = context.wardById.get(String(record.wardId));
  const room = context.roomById.get(String(record.roomId));
  const bed = context.bedById.get(String(record.bedId));
  const deliveredBy = context.staffById.get(String(record.deliveredByStaffMemberId));
  const recordedBy = context.staffById.get(String(record.recordedByStaffMemberId));

  return {
    id: record.id,
    residentId: String(record.residentId),
    resident: resident?.displayName ?? String(record.residentId),
    nursingHomeId: String(record.nursingHomeId),
    wardId: record.wardId ? String(record.wardId) : resident?.wardId,
    ward: ward?.name,
    roomId: record.roomId ? String(record.roomId) : resident?.roomId,
    room: room?.label ?? resident?.roomNumber,
    bedId: record.bedId ? String(record.bedId) : resident?.bedId,
    bed: bed?.label,
    occurredAt: record.occurredAt,
    recordedAt: record.recordedAt,
    shiftId: record.shiftId ? String(record.shiftId) : undefined,
    careType: record.careType,
    careTypeLabel: DAILY_CARE_LABELS[record.careType],
    outcome: record.outcome,
    participation: record.participationLevel,
    deliveredByStaffMemberId: record.deliveredByStaffMemberId ? String(record.deliveredByStaffMemberId) : undefined,
    deliveredBy: deliveredBy?.displayName,
    recordedByStaffMemberId: record.recordedByStaffMemberId ? String(record.recordedByStaffMemberId) : undefined,
    recordedBy: recordedBy?.displayName,
    hasNotes: Boolean(record.notes || record.outcomeSummary || record.residentResponse),
    hasEscalation: context.escalatedRecordIds.has(record.id) || record.outcome === "escalated",
    followUpRequired: record.followUpRequired,
    hasLinkedWorkItem: Boolean(record.relatedWorkItemId || record.followUpWorkItemIds.length),
    rltDomainIds: record.rltDomainIds,
    status: record.status,
  };
}

function toFoodRow(record: DailyCareRecord, context: ProjectionContext): FoodReportRow | undefined {
  const details = record.details;
  if (details.type === "refusal" && details.refusedCareType !== "food") return undefined;
  const food = details.type === "food" ? details : undefined;
  return {
    ...commonRow(record, context),
    reportType: "food",
    mealType: food?.mealType,
    intake: food?.intake,
    assistance: food?.assistance,
    swallowingConcern: food?.swallowingConcernObserved,
    reducedIntake: isReducedFoodIntake(food),
    refusal: record.outcome === "refused" || details.type === "refusal",
  };
}

function toFluidRow(record: DailyCareRecord, context: ProjectionContext): FluidReportRow | undefined {
  const details = record.details;
  if (details.type === "refusal" && details.refusedCareType !== "fluids") return undefined;
  const fluids = details.type === "fluids" ? details : undefined;
  return {
    ...commonRow(record, context),
    reportType: "fluids",
    drinkType: fluids?.drinkType,
    amountOfferedMl: fluids?.amountOfferedMl,
    amountTakenMl: fluids?.amountTakenMl,
    intakeEstimate: fluids?.intakeEstimate,
    consistency: fluids?.consistencyProvided,
    assistance: fluids?.assistance,
    swallowingConcern: fluids?.swallowingConcernObserved,
    reducedIntake: isReducedFluidIntake(fluids),
    measuredTotalMl: fluids?.intakeEstimate === "measured" ? fluids.amountTakenMl : undefined,
  };
}

function toToiletingRow(record: DailyCareRecord, context: ProjectionContext): ToiletingReportRow | undefined {
  const details = record.details;
  if (details.type !== "toileting" && details.type !== "continence") return undefined;
  const toileting = details.type === "toileting" ? details : undefined;
  const continence = details.type === "continence" ? details : undefined;
  return {
    ...commonRow(record, context),
    reportType: "toileting",
    toiletingMethod: toileting?.toiletingMethod,
    urine: toileting ? ["urine", "both"].includes(toileting.outcome) : undefined,
    bowelMotion: toileting ? ["bowel_motion", "both"].includes(toileting.outcome) : undefined,
    assistance: toileting?.assistanceProvided,
    continenceState: continence?.continenceState,
    productChanged: continence?.productChanged,
    skinCareProvided: continence?.skinCareProvided,
    discomfortObserved: toileting?.discomfortObserved,
  };
}

function toAdlRow(record: DailyCareRecord, context: ProjectionContext): AdlReportRow {
  const details = record.details;
  return {
    ...commonRow(record, context),
    reportType: "adl",
    completionStatus: record.outcome,
    assistance: extractAssistance(details),
    refusal: record.outcome === "refused" || details.type === "refusal",
    trendIndicators: context.trendByRecordId.get(record.id) ?? [],
  };
}

function toRepositioningRow(record: DailyCareRecord, context: ProjectionContext): RepositioningReportRow | undefined {
  const details = record.details;
  if (details.type === "refusal" && details.refusedCareType !== "repositioning") return undefined;
  const repositioning = details.type === "repositioning" ? details : undefined;
  return {
    ...commonRow(record, context),
    reportType: "repositioning",
    fromPosition: repositioning?.fromPosition,
    toPosition: repositioning?.toPosition,
    equipmentUsed: repositioning?.equipmentUsed,
    comfortAfter: repositioning?.residentComfortAfter,
    skinConcern: repositioning?.skinConcernObserved,
    missed: record.outcome === "unable" || record.outcome === "not_required",
    partial: record.outcome === "partially_completed",
  };
}

function toRefusalRow(record: DailyCareRecord, context: ProjectionContext): RefusalReportRow {
  const refusal = record.details.type === "refusal" ? record.details : undefined;
  return {
    ...commonRow(record, context),
    reportType: "refusal",
    careOffered: refusal?.careOffered?.title ?? DAILY_CARE_LABELS[record.careType],
    refusedCareType: refusal?.refusedCareType ?? record.careType,
    reason: refusal?.refusalReasonText ?? refusal?.refusalReason ?? record.outcomeReasonCode,
    alternativesOffered: refusal?.alternativesOffered.map(describeAlternative),
    acceptedAlternative: refusal?.alternativesOffered.some((item) => item.accepted === "yes"),
    nurseInformed: refusal?.nurseInformed,
    escalationRequired: refusal?.escalationRequired || record.outcome === "escalated",
    retryAt: refusal?.retryAt,
  };
}

function toBehaviourRow(record: DailyCareRecord, context: ProjectionContext): BehaviourReportRow | undefined {
  if (record.details.type !== "behaviour") return undefined;
  const details = record.details;
  return {
    ...commonRow(record, context),
    reportType: "behaviour",
    behaviourObserved: details.behaviourObserved,
    triggers: details.possibleTriggers,
    interventions: details.responseProvided,
    response: details.outcome,
    riskIndicators: details.riskToSelfOrOthers || details.behaviourIncidentRequired,
    restrictivePractice: details.restrictivePracticeUsed,
  };
}

function toSleepRow(record: DailyCareRecord, context: ProjectionContext): SleepReportRow | undefined {
  if (record.details.type !== "sleep") return undefined;
  const details = record.details;
  return {
    ...commonRow(record, context),
    reportType: "sleep",
    sleepState: details.state,
    durationMinutes: details.estimatedSleepDurationMinutes,
    wakingEpisodes: details.nightChecksCompleted,
    interventions: details.interventionsProvided,
    distressIndicator: details.state === "distressed" || details.state === "restless" || details.state === "frequently_waking",
    alteredSleepTrend: (context.trendByRecordId.get(record.id) ?? []).includes("altered_sleep"),
  };
}

function sortRows<TRow extends DailyCareReportRow>(rows: TRow[], options: DailyCareReportOptions) {
  const field = options.sorting?.field ?? "occurredAt";
  const direction = options.sorting?.direction ?? "desc";
  return [...rows].sort((a, b) => {
    const left = sortableValue(a, field);
    const right = sortableValue(b, field);
    const result = left.localeCompare(right);
    return direction === "asc" ? result : -result;
  });
}

function sortableValue(row: DailyCareReportRow, field: string) {
  if (field === "resident") return row.resident;
  if (field === "ward") return row.ward ?? "";
  if (field === "staffMember") return row.deliveredBy ?? row.recordedBy ?? "";
  return String(row[field as keyof DailyCareReportRow] ?? "");
}

function buildGroups(rows: DailyCareReportRow[], groupBy: string[]) {
  if (!groupBy.length) return [];
  const groups = new Map<string, { label: string; rows: DailyCareReportRow[] }>();
  for (const row of rows) {
    const parts = groupBy.map((key) => groupValue(row, key));
    const key = parts.join("|");
    groups.set(key, { label: parts.join(" / "), rows: [...(groups.get(key)?.rows ?? []), row] });
  }
  return [...groups.entries()].map(([key, group]) => ({
    key,
    label: group.label,
    count: group.rows.length,
    followUpCount: group.rows.filter((row) => row.followUpRequired).length,
    escalationCount: group.rows.filter((row) => row.hasEscalation).length,
  }));
}

function groupValue(row: DailyCareReportRow, key: string) {
  if (key === "date") return row.occurredAt.slice(0, 10);
  if (key === "resident") return row.resident;
  if (key === "ward") return row.ward ?? row.wardId ?? "No ward";
  if (key === "shift") return row.shiftId ?? "No shift";
  if (key === "meal") return row.reportType === "food" ? row.mealType ?? "No meal" : "Not applicable";
  if (key === "rlt") return row.rltDomainIds.join("; ") || "No RLT";
  return String(row[key as keyof DailyCareReportRow] ?? "Not recorded");
}

function matchList(value: unknown, list?: string[]) {
  return !list?.length || list.includes(String(value ?? ""));
}

function extractAssistance(details: DailyCareDetails) {
  if ("assistance" in details) return details.assistance;
  if ("assistanceProvided" in details) return details.assistanceProvided;
  if ("assistanceAreas" in details) return details.assistanceAreas;
  if ("careProvided" in details) return details.careProvided;
  return undefined;
}

function isReducedFoodIntake(details?: FoodCareDetails) {
  return Boolean(details && (["none", "quarter", "half"].includes(details.intake) || details.reasonForReducedIntake));
}

function isReducedFluidIntake(details?: FluidCareDetails) {
  return Boolean(details && (["none", "small_amount", "half"].includes(details.intakeEstimate) || details.reasonForReducedIntake));
}

function describeAlternative(alternative: DailyCareAlternativeOffered) {
  return [alternative.alternativeType.replaceAll("_", " "), alternative.description].filter(Boolean).join(": ");
}

function describeStructuredFields(row: DailyCareReportRow): string {
  if (row.reportType === "food") return compact([row.mealType, row.intake, row.assistance, row.swallowingConcern ? "swallowing concern" : "", row.reducedIntake ? "reduced intake" : "", row.refusal ? "refusal" : ""]);
  if (row.reportType === "fluids") return compact([row.drinkType, row.amountTakenMl === undefined ? "" : `${row.amountTakenMl}ml taken`, row.intakeEstimate, row.consistency, row.assistance, row.swallowingConcern ? "swallowing concern" : ""]);
  if (row.reportType === "toileting") return compact([row.toiletingMethod, row.urine ? "urine" : "", row.bowelMotion ? "bowel" : "", row.continenceState, row.productChanged ? "product changed" : "", row.skinCareProvided ? "skin care" : "", row.discomfortObserved ? "discomfort" : ""]);
  if (row.reportType === "adl") return compact([row.completionStatus, Array.isArray(row.assistance) ? row.assistance.join("; ") : row.assistance, row.refusal ? "refusal" : "", row.trendIndicators.join("; ")]);
  if (row.reportType === "repositioning") return compact([row.fromPosition ? `from ${row.fromPosition}` : "", row.toPosition ? `to ${row.toPosition}` : "", row.equipmentUsed?.join("; "), row.skinConcern ? "skin concern" : "", row.partial ? "partial" : "", row.missed ? "missed" : ""]);
  if (row.reportType === "refusal") return compact([row.careOffered, row.refusedCareType, row.reason, row.alternativesOffered?.join("; "), row.nurseInformed ? "nurse informed" : "", row.retryAt ? `retry ${row.retryAt}` : ""]);
  if (row.reportType === "behaviour") return compact([row.behaviourObserved?.join("; "), row.triggers?.join("; "), row.interventions?.join("; "), row.response, row.riskIndicators ? "risk indicator" : "", row.restrictivePractice ? "restrictive practice" : ""]);
  return compact([row.sleepState, row.durationMinutes === undefined ? "" : `${row.durationMinutes} minutes`, row.interventions?.join("; "), row.distressIndicator ? "distress/settling concern" : "", row.alteredSleepTrend ? "altered sleep trend" : ""]);
}

function compact(values: Array<string | number | undefined | null | false>) {
  return values.filter((value) => value !== undefined && value !== null && value !== false && String(value).trim() !== "").join(" | ");
}

function csvValue(value: unknown) {
  return JSON.stringify(value ?? "");
}
