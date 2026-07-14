import { useMemo, useState } from "react";
import { Activity, Download, Eye } from "lucide-react";
import { canonicalObservationFromVital } from "@/domain/observations/observationService";
import { exportResidentObservationsCsv, getResidentObservationChartData, getResidentObservationHistoryPage, getResidentObservationSummary, observationExportFilename } from "@/domain/observations/observationHistoryService";
import { OBSERVATION_SET_LABELS, OBSERVATION_UNIT_LABELS, type ObservationType } from "@/domain/observations/observationTypes";
import { getResidentBaselineSummary } from "@/domain/baselines/residentBaselineService";
import type { ResidentBaselineType } from "@/domain/baselines/residentBaselineTypes";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TYPES: ObservationType[] = ["temperature", "pulse", "respirations", "blood_pressure", "spo2", "consciousness", "news2", "pain", "weight", "bmi", "blood_glucose", "neurological"];

export function ObservationHistory({ residentId }: { residentId: string }) {
  const { vitals, residents, currentRole, operationalContext, residentBaselines } = useCare();
  const [type, setType] = useState<ObservationType | "all">("all");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string>();
  const resident = residents.find((item) => item.id === residentId);
  const homeId = operationalContext.nursingHomeId;
  const records = useMemo(() => vitals.filter((item) => item.residentId === residentId).map((item) => canonicalObservationFromVital(item, item.facilityId ?? homeId)), [vitals, residentId, homeId]);
  const capabilities = ["observations.view_history", "observations.view_charts", "observations.view_summary", "observations.view_notes", "observations.view_corrections", "observations.export", "observations.export_notes", "observations.export_corrected", "observations.view_entered_in_error", "observations.export_entered_in_error"].filter((capability) => can(currentRole, capability as never));
  const auth = { nursingHomeId: homeId, residentIds: [residentId], capabilities };
  const baselineAuth = {
    nursingHomeId: homeId,
    residentIds: [residentId],
    capabilities: can(currentRole, "resident_baseline.view") ? ["resident_baseline.view"] : [],
    canViewSource: can(currentRole, "resident_baseline.view_source"),
  };
  const filtered = type === "all" ? {} : { observationTypes: [type] };
  const allPage = getResidentObservationHistoryPage(records, residentId, auth, filtered, { limit: 100 });
  const rows = allPage.records.slice(page * 10, page * 10 + 10);
  const summary = getResidentObservationSummary(records, residentId, auth);
  const chartType = type === "all" ? "temperature" : type;
  const chart = getResidentObservationChartData(records, residentId, chartType, auth);
  const baselineSummary = baselineAuth.capabilities.length ? getResidentBaselineSummary(residentBaselines, residentId, new Date().toISOString(), baselineAuth) : undefined;
  const chartBaselines = baselineSummary?.baselines.filter((baseline) => baselineTypesForObservation(chartType).includes(baseline.baselineType)) ?? [];
  const opened = records.find((record) => record.id === openId);

  const exportCsv = () => {
    const today = new Date().toISOString().slice(0, 10);
    const csv = exportResidentObservationsCsv(records, { residentId, nursingHomeId: homeId, format: "csv", filters: filtered, includeSummary: true, includeComponents: true, includeNotes: false, includeEscalation: false, includeCorrectedRecords: false, includeEnteredInError: false, timezone: operationalContext.timezone }, auth);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = observationExportFilename(`${resident?.firstName ?? "Resident"}_${resident?.lastName ?? ""}`, allPage.records.at(-1)?.observedAt.slice(0, 10) ?? today, allPage.records[0]?.observedAt.slice(0, 10) ?? today); anchor.click(); URL.revokeObjectURL(url);
  };

  if (!records.length) return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No completed observations are available for this resident.</CardContent></Card>;
  return <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[...summary.latest.entries()].slice(0, 4).map(([key, latest]) => <Card key={key}><CardContent className="p-3"><div className="text-xs text-muted-foreground capitalize">Latest {key.replaceAll("_", " ")}</div><div className="font-semibold mt-1">{formatComponent(latest.component)}</div><div className="text-xs text-muted-foreground">{formatDate(latest.record.observedAt)}</div></CardContent></Card>)}</div>
    <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> {chartType.replaceAll("_", " ")} trend</CardTitle></CardHeader><CardContent className="space-y-3">{chart.length < 2 ? <p className="text-sm text-muted-foreground">Not enough observations are available to show a trend.</p> : <div className="flex items-end gap-1 h-28" aria-label={`${chartType} trend`}>{chart.map((point) => { const values = chart.map((item) => item.value); const min = Math.min(...values); const max = Math.max(...values); const height = max === min ? 50 : 20 + ((point.value - min) / (max - min)) * 75; return <div key={point.id} className="flex-1 min-w-2 rounded-t bg-primary/70" style={{ height: `${height}%` }} title={`${point.value} · ${formatDate(point.observedAt)}`} />; })}</div>}{chartBaselines.length > 0 && <BaselineList baselines={chartBaselines} title="Current resident baseline for this trend" />}</CardContent></Card>
    <Card><CardHeader className="pb-3"><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base">Observation History</CardTitle><div className="flex gap-2"><Select value={type} onValueChange={(value) => { setType(value as typeof type); setPage(0); }}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All observations</SelectItem>{TYPES.map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select>{capabilities.includes("observations.export") && <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>}</div></div></CardHeader><CardContent className="space-y-2">{rows.map((record) => <div key={record.id} className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div><div className="flex flex-wrap gap-2 items-center"><span className="font-medium">{formatDate(record.observedAt)}</span><Badge variant="outline">{OBSERVATION_SET_LABELS[record.observationSetType]}</Badge>{record.status !== "completed" && <Badge variant="secondary">{record.status.replaceAll("_", " ")}</Badge>}</div><p className="text-sm mt-1">{record.components.slice(0, 4).map(formatComponent).join(" · ")}</p><p className="text-xs text-muted-foreground">Recorded {formatDate(record.recordedAt)} by {record.recordedByDisplayName ?? "staff member"} · {record.source.label ?? record.source.type.replaceAll("_", " ")}</p></div><Button variant="ghost" size="sm" onClick={() => setOpenId(record.id)}><Eye className="h-4 w-4 mr-1" /> Open</Button></div>)}{rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No observations match the selected filters.</p>}<div className="flex justify-between items-center pt-2"><span className="text-xs text-muted-foreground">{allPage.totalMatching} observation{allPage.totalMatching === 1 ? "" : "s"}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={(page + 1) * 10 >= allPage.totalMatching} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div></CardContent></Card>
    <Dialog open={Boolean(opened)} onOpenChange={(open) => !open && setOpenId(undefined)}><DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">{opened && <><DialogHeader><DialogTitle>{OBSERVATION_SET_LABELS[opened.observationSetType]}</DialogTitle></DialogHeader><div className="grid sm:grid-cols-2 gap-3 text-sm"><Detail label="Observed" value={formatDate(opened.observedAt)} /><Detail label="Recorded" value={formatDate(opened.recordedAt)} /><Detail label="Recorded by" value={opened.recordedByDisplayName ?? opened.recordedByStaffMemberId ?? "Not recorded"} /><Detail label="Source" value={opened.source.label ?? opened.source.type.replaceAll("_", " ")} /></div><div className="space-y-2">{opened.components.map((component) => <div key={component.id} className="border rounded-md p-3 flex justify-between"><span className="capitalize">{component.observationType.replaceAll("_", " ")}</span><span className="font-medium">{formatComponent(component)}</span></div>)}</div>{baselineSummary && <BaselineList baselines={baselineSummary.baselines.filter((baseline) => opened.components.some((component) => baselineTypesForObservation(component.observationType).includes(baseline.baselineType)))} title="Resident baseline at review" />}{opened.interpretation.news2 && <div className="border rounded-md p-3"><div className="font-medium">NEWS2 {opened.interpretation.news2.totalScore ?? "Incomplete"}</div><div className="text-sm capitalize">{opened.interpretation.news2.interpretation.replaceAll("_", " ")} · observed {formatDate(opened.observedAt)}</div>{opened.interpretation.news2.incompleteReason && <p className="text-sm text-muted-foreground">{opened.interpretation.news2.incompleteReason}</p>}</div>}{opened.notes && capabilities.includes("observations.view_notes") && <Detail label="Clinical Notes" value={opened.notes} />}{opened.corrections.length > 0 && capabilities.includes("observations.view_corrections") && <div><h4 className="font-medium text-sm">Correction history</h4>{opened.corrections.map((item) => <p key={item.id} className="text-sm text-muted-foreground">{formatDate(item.correctedAt)} · {item.reason}</p>)}</div>}</>}</DialogContent></Dialog>
  </div>;
}

function formatComponent(component: { observationType: ObservationType; value?: number; secondaryValue?: number; textValue?: string; codedValue?: string; unit?: keyof typeof OBSERVATION_UNIT_LABELS }) { const value = component.observationType === "blood_pressure" ? `${component.value ?? "?"}/${component.secondaryValue ?? "?"}` : component.value ?? component.textValue ?? component.codedValue ?? "Not recorded"; return `${component.observationType.replaceAll("_", " ")} ${value}${component.unit ? ` ${OBSERVATION_UNIT_LABELS[component.unit]}` : ""}`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function Detail({ label, value }: { label: string; value: string }) { return <div><div className="text-xs text-muted-foreground">{label}</div><div>{value}</div></div>; }
function baselineTypesForObservation(type: ObservationType): ResidentBaselineType[] {
  if (type === "blood_pressure") return ["systolic_blood_pressure", "diastolic_blood_pressure"];
  if (type === "respirations") return ["respirations"];
  if (type === "spo2") return ["spo2", "oxygen_delivery"];
  if (type === "consciousness") return ["consciousness", "neurological"];
  return [type as ResidentBaselineType];
}
function BaselineList({ baselines, title }: { baselines: Array<{ baselineId: string; baselineType: ResidentBaselineType; displayValue: string; sourceLabel: string; effectiveFrom: string; reviewDate: string; reviewState: string }>; title: string }) {
  if (!baselines.length) return null;
  return <div className="rounded-md border border-blue-200 bg-blue-50/40 p-3 text-sm">
    <div className="font-medium">{title}</div>
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      {baselines.map((baseline) => (
        <div key={baseline.baselineId} className="rounded border bg-background/70 p-2">
          <div className="text-xs text-muted-foreground capitalize">{baseline.baselineType.replaceAll("_", " ")}</div>
          <div className="font-medium">{baseline.displayValue}</div>
          <div className="text-xs text-muted-foreground">Source: {baseline.sourceLabel} · Effective {new Date(baseline.effectiveFrom).toLocaleDateString("en-IE")} · Review {new Date(baseline.reviewDate).toLocaleDateString("en-IE")}</div>
        </div>
      ))}
    </div>
    <p className="mt-2 text-xs text-muted-foreground">Baseline values are shown for context only and do not replace recorded observations.</p>
  </div>;
}
