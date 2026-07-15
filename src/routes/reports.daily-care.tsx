import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import {
  DAILY_CARE_REPORT_LABELS,
  exportDailyCareReportCsv,
  getDailyCareReport,
  type DailyCareOutcome,
  type DailyCareReportFilters,
  type DailyCareReportRow,
  type DailyCareReportType,
} from "@/domain/dailyCare";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/reports/daily-care")({
  head: () => ({ meta: [{ title: "Daily Care Reports - CarePath" }] }),
  component: DailyCareReportsPage,
});

const REPORT_TYPES: DailyCareReportType[] = ["food", "fluids", "toileting", "adl", "repositioning", "refusal", "behaviour", "sleep"];
const PAGE_SIZE = 25;

function DailyCareReportsPage() {
  const {
    currentRole,
    operationalContext,
    dailyCareRecords,
    dailyCareTrendEvaluations,
    hcaNurseEscalations,
    residents,
    wards,
    rooms,
    beds,
    staffMembers,
  } = useCare();
  const [reportType, setReportType] = useState<DailyCareReportType>("food");
  const [residentId, setResidentId] = useState("__all");
  const [wardId, setWardId] = useState("__all");
  const [outcome, setOutcome] = useState("__all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [followUpOnly, setFollowUpOnly] = useState(false);
  const [escalationOnly, setEscalationOnly] = useState(false);
  const [includeEnteredInError, setIncludeEnteredInError] = useState(false);
  const [includeCorrectedRecords, setIncludeCorrectedRecords] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  const availableReportTypes = REPORT_TYPES.filter((type) => {
    if (type === "behaviour") return can(currentRole, "daily_care_reports.view_behaviour");
    if (type === "refusal") return can(currentRole, "daily_care_reports.view_refusals");
    if (type === "sleep") return can(currentRole, "daily_care_reports.view_sleep");
    return can(currentRole, "daily_care_reports.view");
  });

  const filters: DailyCareReportFilters = {
    nursingHomeIds: [String(operationalContext.nursingHomeId)],
    wardIds: wardId !== "__all" ? [wardId] : can(currentRole, "daily_care_reports.view_all_wards") ? undefined : operationalContext.wardIds.map(String),
    residentIds: residentId !== "__all" ? [residentId] : undefined,
    dateFrom: dateFrom ? `${dateFrom}T00:00:00` : undefined,
    dateTo: dateTo ? `${dateTo}T23:59:59` : undefined,
    outcomes: outcome !== "__all" ? [outcome as DailyCareOutcome] : undefined,
    followUpRequired: followUpOnly ? true : undefined,
    escalationPresent: escalationOnly ? true : undefined,
    includeEnteredInError,
    includeCorrectedRecords,
  };

  const reportContext = useMemo(
    () => ({
      residents: residents.map((resident) => ({
        residentId: resident.id,
        displayName: `${resident.firstName} ${resident.lastName}`,
        roomNumber: resident.roomNumber,
        nursingHomeId: resident.facilityId,
        wardId: (resident as { wardId?: string }).wardId,
        roomId: resident.roomId,
      })),
      wards: wards.map((ward) => ({ wardId: String(ward.id), name: ward.name })),
      rooms: rooms.map((room) => ({ roomId: String(room.id), label: room.name ?? room.roomNumber ?? room.number })),
      beds: beds.map((bed) => ({ bedId: String(bed.id), label: bed.label })),
      staffMembers: staffMembers.map((staff) => ({ staffMemberId: String(staff.id), displayName: staff.displayName })),
      escalations: hcaNurseEscalations.map((escalation) => ({
        id: escalation.id,
        sourceDailyCareRecordIds: escalation.sourceDailyCareRecordIds,
        status: escalation.status,
      })),
      trendEvaluations: dailyCareTrendEvaluations,
    }),
    [residents, wards, rooms, beds, staffMembers, hcaNurseEscalations, dailyCareTrendEvaluations],
  );

  const report = useMemo(
    () =>
      getDailyCareReport(
        reportType,
        dailyCareRecords,
        {
          filters,
          pagination: { pageIndex, pageSize: PAGE_SIZE },
          sorting: { field: "occurredAt", direction: "desc" },
          groupBy: groupingFor(reportType),
        },
        reportContext,
      ),
    [dailyCareRecords, filters, pageIndex, reportContext, reportType],
  );

  if (!can(currentRole, "daily_care_reports.view")) {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have permission to view Daily Care reports.</CardContent>
        </Card>
      </div>
    );
  }

  const exportCsv = () => {
    if (!can(currentRole, "daily_care_reports.export")) {
      toast.error("You do not have permission to export Daily Care reports.");
      return;
    }
    if (!report.rows.length) {
      toast.error("Nothing to export.");
      return;
    }
    const csv = exportDailyCareReportCsv(report);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `daily-care-${reportType}-report.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Daily Care report exported.");
  };

  return (
    <div className="p-4 md:p-8 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Daily Care Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Structured operational views over recorded Daily Care.</p>
        </div>
        {can(currentRole, "daily_care_reports.export") && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Report">
            <Select value={reportType} onValueChange={(value) => { setReportType(value as DailyCareReportType); setPageIndex(0); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableReportTypes.map((type) => <SelectItem key={type} value={type}>{DAILY_CARE_REPORT_LABELS[type]}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Resident">
            <Select value={residentId} onValueChange={(value) => { setResidentId(value); setPageIndex(0); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All residents</SelectItem>
                {residents.map((resident) => <SelectItem key={resident.id} value={resident.id}>{resident.firstName} {resident.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Ward">
            <Select value={wardId} onValueChange={(value) => { setWardId(value); setPageIndex(0); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Current ward context</SelectItem>
                {wards.map((ward) => <SelectItem key={String(ward.id)} value={String(ward.id)}>{ward.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Outcome">
            <Select value={outcome} onValueChange={(value) => { setOutcome(value); setPageIndex(0); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All outcomes</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="partially_completed">Partially completed</SelectItem>
                <SelectItem value="refused">Refused</SelectItem>
                <SelectItem value="unable">Unable</SelectItem>
                <SelectItem value="not_required">Not required</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="From">
            <Input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPageIndex(0); }} />
          </Field>
          <Field label="To">
            <Input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPageIndex(0); }} />
          </Field>
          <Flag checked={followUpOnly} label="Follow-up required" onCheckedChange={(checked) => { setFollowUpOnly(Boolean(checked)); setPageIndex(0); }} />
          <Flag checked={escalationOnly} label="Escalation present" onCheckedChange={(checked) => { setEscalationOnly(Boolean(checked)); setPageIndex(0); }} />
          <Flag checked={includeEnteredInError} label="Include entered in error" onCheckedChange={(checked) => { setIncludeEnteredInError(Boolean(checked)); setPageIndex(0); }} />
          <Flag checked={includeCorrectedRecords} label="Include corrected records" onCheckedChange={(checked) => { setIncludeCorrectedRecords(Boolean(checked)); setPageIndex(0); }} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">{DAILY_CARE_REPORT_LABELS[reportType]}</CardTitle>
            <Badge variant="outline">{report.total} record{report.total === 1 ? "" : "s"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resident</TableHead>
                <TableHead>Occurred</TableHead>
                <TableHead>Care</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Structured Details</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>RLT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium">{row.resident}</div>
                    <div className="text-xs text-muted-foreground">{[row.room, row.ward].filter(Boolean).join(" · ") || "Location not recorded"}</div>
                  </TableCell>
                  <TableCell>
                    <div>{formatDate(row.occurredAt)}</div>
                    <div className="text-xs text-muted-foreground">Recorded {formatDate(row.recordedAt)}</div>
                  </TableCell>
                  <TableCell>{row.careTypeLabel}</TableCell>
                  <TableCell><Badge variant="secondary">{row.outcome.replaceAll("_", " ")}</Badge></TableCell>
                  <TableCell className="max-w-md">{formatRowDetails(row) || <span className="text-muted-foreground">No structured details</span>}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.hasNotes && <Badge variant="outline">Notes</Badge>}
                      {row.hasEscalation && <Badge variant="destructive">Escalation</Badge>}
                      {row.followUpRequired && <Badge variant="outline">Follow-up</Badge>}
                      {row.hasLinkedWorkItem && <Badge variant="outline">Work item</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.rltDomainIds.join(", ") || "None"}</TableCell>
                </TableRow>
              ))}
              {report.rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No Daily Care records match the selected report filters.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">Page {pageIndex + 1} of {Math.max(1, Math.ceil(report.total / PAGE_SIZE))}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((value) => Math.max(0, value - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={(pageIndex + 1) * PAGE_SIZE >= report.total} onClick={() => setPageIndex((value) => value + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Flag({ checked, label, onCheckedChange }: { checked: boolean; label: string; onCheckedChange: (checked: boolean | "indeterminate") => void }) {
  return (
    <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      <span>{label}</span>
    </label>
  );
}

function groupingFor(type: DailyCareReportType) {
  if (type === "food") return ["resident", "meal", "date", "shift"];
  if (type === "adl") return ["resident", "rlt", "date", "shift"];
  return ["resident", "date", "shift"];
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatRowDetails(row: DailyCareReportRow) {
  if (row.reportType === "food") return join([row.mealType, row.intake, row.assistance, row.swallowingConcern ? "swallowing concern" : "", row.reducedIntake ? "reduced intake" : "", row.refusal ? "refusal" : ""]);
  if (row.reportType === "fluids") return join([row.drinkType, row.amountTakenMl === undefined ? "" : `${row.amountTakenMl}ml taken`, row.amountOfferedMl === undefined ? "" : `${row.amountOfferedMl}ml offered`, row.intakeEstimate, row.consistency, row.swallowingConcern ? "swallowing concern" : ""]);
  if (row.reportType === "toileting") return join([row.toiletingMethod, row.urine ? "urine" : "", row.bowelMotion ? "bowel" : "", row.continenceState, row.productChanged ? "product changed" : "", row.skinCareProvided ? "skin care" : "", row.discomfortObserved ? "discomfort" : ""]);
  if (row.reportType === "adl") return join([row.completionStatus, Array.isArray(row.assistance) ? row.assistance.join(", ") : row.assistance, row.refusal ? "refusal" : "", row.trendIndicators.join(", ")]);
  if (row.reportType === "repositioning") return join([row.fromPosition ? `from ${row.fromPosition}` : "", row.toPosition ? `to ${row.toPosition}` : "", row.equipmentUsed?.join(", "), row.skinConcern ? "skin concern" : "", row.partial ? "partial" : "", row.missed ? "missed" : ""]);
  if (row.reportType === "refusal") return join([row.careOffered, row.refusedCareType, row.reason, row.alternativesOffered?.join(", "), row.nurseInformed ? "nurse informed" : "", row.retryAt ? `retry ${row.retryAt}` : ""]);
  if (row.reportType === "behaviour") return join([row.behaviourObserved?.join(", "), row.triggers?.join(", "), row.interventions?.join(", "), row.response, row.riskIndicators ? "risk indicator" : "", row.restrictivePractice ? "restrictive practice" : ""]);
  return join([row.sleepState, row.durationMinutes === undefined ? "" : `${row.durationMinutes} minutes`, row.interventions?.join(", "), row.distressIndicator ? "distress/settling concern" : "", row.alteredSleepTrend ? "altered sleep trend" : ""]);
}

function join(values: Array<string | number | undefined | null | false>) {
  return values.filter((value) => value !== undefined && value !== null && value !== false && String(value).trim() !== "").join(" · ");
}
