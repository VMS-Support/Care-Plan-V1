import { OBSERVATION_SET_LABELS, OBSERVATION_UNIT_LABELS, type ObservationType, type ResidentObservationRecord } from "./observationTypes";
import type { ObservationHistoryAuthorization, ObservationHistoryPage, ResidentObservationExportRequest, ResidentObservationHistoryFilters } from "./observationHistoryTypes";

const requireCapability = (auth: ObservationHistoryAuthorization, capability: string) => {
  if (!auth.capabilities.includes(capability)) throw new Error("Observation access is not authorised.");
};

export function getResidentObservationHistoryPage(records: ResidentObservationRecord[], residentId: string, auth: ObservationHistoryAuthorization, filters: ResidentObservationHistoryFilters = {}, page: { cursor?: string; limit?: number } = {}): ObservationHistoryPage {
  requireCapability(auth, "observations.view_history");
  if (!auth.residentIds.includes(residentId)) throw new Error("Resident access is not authorised.");
  const allowInvalid = auth.capabilities.includes("observations.view_entered_in_error");
  const filtered = records.filter((record) => record.residentId === residentId && record.nursingHomeId === auth.nursingHomeId)
    .filter((record) => auth.canAccessSource?.(record) !== false)
    .filter((record) => allowInvalid || record.status !== "entered_in_error")
    .filter((record) => !filters.recordStatuses?.length || filters.recordStatuses.includes(record.status))
    .filter((record) => !filters.observationSetTypes?.length || filters.observationSetTypes.includes(record.observationSetType))
    .filter((record) => !filters.observationTypes?.length || record.components.some((component) => filters.observationTypes!.includes(component.observationType)))
    .filter((record) => !filters.dateFrom || record.observedAt >= filters.dateFrom)
    .filter((record) => !filters.dateTo || record.observedAt <= filters.dateTo)
    .filter((record) => !filters.clinicallySignificantOnly || record.components.some((component) => component.clinicallySignificant))
    .filter((record) => !filters.observedByStaffMemberIds?.length || Boolean(record.observedByStaffMemberId && filters.observedByStaffMemberIds.includes(record.observedByStaffMemberId)))
    .filter((record) => !filters.recordedByStaffMemberIds?.length || Boolean(record.recordedByStaffMemberId && filters.recordedByStaffMemberIds.includes(record.recordedByStaffMemberId)))
    .filter((record) => !filters.sourceTypes?.length || filters.sourceTypes.includes(record.source.type))
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt) || b.id.localeCompare(a.id));
  const cursorIndex = page.cursor ? filtered.findIndex((record) => record.id === page.cursor) + 1 : 0;
  const start = Math.max(0, cursorIndex);
  const limit = Math.min(Math.max(page.limit ?? 20, 1), 100);
  const selected = filtered.slice(start, start + limit);
  return { records: selected, totalMatching: filtered.length, nextCursor: start + limit < filtered.length ? selected.at(-1)?.id : undefined };
}

export function getResidentObservationSummary(records: ResidentObservationRecord[], residentId: string, auth: ObservationHistoryAuthorization) {
  const page = getResidentObservationHistoryPage(records, residentId, auth, { recordStatuses: ["completed"] }, { limit: 100 });
  const latest = new Map<ObservationType, { record: ResidentObservationRecord; component: ResidentObservationRecord["components"][number] }>();
  page.records.forEach((record) => record.components.forEach((component) => { if (!latest.has(component.observationType)) latest.set(component.observationType, { record, component }); }));
  return { latest, latestNews2: page.records.find((record) => record.interpretation.news2?.interpretation !== "incomplete"), clinicallySignificantCount: page.records.filter((record) => record.components.some((component) => component.clinicallySignificant)).length };
}

export function getResidentObservationChartData(records: ResidentObservationRecord[], residentId: string, type: ObservationType, auth: ObservationHistoryAuthorization, filters: ResidentObservationHistoryFilters = {}) {
  requireCapability(auth, "observations.view_charts");
  return getResidentObservationHistoryPage(records, residentId, auth, { ...filters, observationTypes: [type], recordStatuses: ["completed"] }, { limit: 100 }).records
    .flatMap((record) => record.components.filter((component) => component.observationType === type && component.value !== undefined).map((component) => ({ id: `${record.id}:${component.id}`, observationRecordId: record.id, observedAt: record.observedAt, value: component.value!, secondaryValue: component.secondaryValue, unit: component.unit, oxygenMethod: record.oxygenDelivery?.method ?? record.components.find((item) => item.observationType === "oxygen_delivery")?.codedValue })))
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
}

export function exportResidentObservationsCsv(records: ResidentObservationRecord[], request: ResidentObservationExportRequest, auth: ObservationHistoryAuthorization) {
  requireCapability(auth, "observations.export");
  if (request.includeNotes) requireCapability(auth, "observations.export_notes");
  if (request.includeEnteredInError) requireCapability(auth, "observations.export_entered_in_error");
  if (request.includeCorrectedRecords) requireCapability(auth, "observations.export_corrected");
  const statuses: ResidentObservationRecord["status"][] = ["completed", ...(request.includeCorrectedRecords ? ["corrected" as const] : []), ...(request.includeEnteredInError ? ["entered_in_error" as const] : [])];
  const page = getResidentObservationHistoryPage(records, request.residentId, auth, { ...request.filters, recordStatuses: statuses }, { limit: 100 });
  if (!page.records.length) throw new Error("No observations are available to export with the selected filters.");
  const headers = ["Observation Record ID", "Date/Time Observed", "Date/Time Recorded", "Observation Set", "Observation Type", "Value", "Secondary Value", "Unit", "Interpretation", "NEWS2", "Oxygen Delivery", "Clinical Significance", "Observed By", "Recorded By", "Source", "Record Status", ...(request.includeNotes ? ["Clinical Notes"] : [])];
  const rows = page.records.flatMap((record) => record.components.map((component) => [record.id, record.observedAt, record.recordedAt, OBSERVATION_SET_LABELS[record.observationSetType], component.observationType, component.value ?? component.textValue ?? component.codedValue ?? "", component.secondaryValue ?? "", component.unit ? OBSERVATION_UNIT_LABELS[component.unit] : "", component.interpretation ?? record.interpretation.overall, record.interpretation.news2?.totalScore ?? "", record.oxygenDelivery?.method ?? "", component.clinicallySignificant ? "Yes" : "No", record.observedByStaffMemberId ?? "", record.recordedByDisplayName ?? record.recordedByStaffMemberId ?? "", record.source.label ?? record.source.type, record.status, ...(request.includeNotes ? [record.notes ?? ""] : [])]));
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
export function observationExportFilename(displayName: string, from: string, to: string) { return `NuCare_Observations_${displayName.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "")}_${from}_${to}.csv`; }
