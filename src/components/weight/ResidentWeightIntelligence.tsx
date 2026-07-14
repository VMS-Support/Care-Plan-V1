import { useMemo } from "react";
import { AlertTriangle, CalendarClock, Scale } from "lucide-react";
import { canonicalObservationFromVital } from "@/domain/observations/observationService";
import { calculateResidentWeightIntelligence } from "@/domain/weight/weightIntelligenceCalculator";
import type { WeightPeriodChangeResult } from "@/domain/weight/weightIntelligenceTypes";
import { can } from "@/lib/care/permissions";
import { useCare } from "@/lib/care/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ResidentWeightIntelligence({ residentId }: { residentId: string }) {
  const { vitals, currentRole, operationalContext } = useCare();
  const homeId = operationalContext.nursingHomeId;
  const intelligence = useMemo(() => {
    const records = vitals
      .filter((item) => item.residentId === residentId)
      .map((item) => canonicalObservationFromVital(item, item.facilityId ?? homeId));
    return calculateResidentWeightIntelligence({
      residentId,
      nursingHomeId: homeId,
      records,
      generatedAt: new Date().toISOString(),
    });
  }, [homeId, residentId, vitals]);

  if (!can(currentRole, "weight_intelligence.view")) return null;

  const latest = intelligence.latestWeight;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4" /> Weight Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!latest ? (
          <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">No valid structured weight is recorded for this resident.</div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <Metric label="Latest valid weight" value={`${latest.weightKg.toFixed(1)} kg`} detail={formatDate(latest.observedAt)} />
              <Metric label="Previous change" value={formatChange(intelligence.changeFromPrevious)} detail={formatComparisonDate(intelligence.changeFromPrevious?.comparisonObservedAt)} />
              <Metric label="30-day change" value={formatPeriod(intelligence.thirtyDayChange)} detail={periodDetail(intelligence.thirtyDayChange)} tone={lossTone(intelligence.thirtyDayChange)} />
              <Metric label="Measurement" value={latest.estimated ? "Estimated" : "Measured"} detail={latest.measurementMethod?.replaceAll("_", " ") ?? "Method not recorded"} />
            </div>
            {can(currentRole, "weight_intelligence.view_comparisons") && (
              <div className="grid gap-3 md:grid-cols-3">
                <Period label="Approx. 30 days" period={intelligence.thirtyDayChange} />
                <Period label="Approx. 3 months" period={intelligence.threeMonthChange} />
                <Period label="Approx. 6 months" period={intelligence.sixMonthChange} />
              </div>
            )}
          </>
        )}
        <div className="flex flex-wrap gap-2">
          <Badge variant={intelligence.missingOrOverdue.status === "overdue" || intelligence.missingOrOverdue.status === "missing_initial_weight" ? "destructive" : "outline"} className="gap-1">
            <CalendarClock className="h-3.5 w-3.5" /> {intelligence.missingOrOverdue.status.replaceAll("_", " ")}
          </Badge>
          {intelligence.dataQuality.warnings.map((warning) => (
            <Badge key={warning} variant="secondary" className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> {warning.replaceAll("_", " ")}
            </Badge>
          ))}
          <Badge variant="outline">{intelligence.dataQuality.validMeasurementCount} valid weight record{intelligence.dataQuality.validMeasurementCount === 1 ? "" : "s"}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail?: string; tone?: "warning" | "neutral" }) {
  return (
    <div className={`rounded-md border p-3 ${tone === "warning" ? "border-amber-300 bg-amber-50/70" : "bg-muted/20"}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
      {detail && <div className="mt-1 text-xs text-muted-foreground capitalize">{detail}</div>}
    </div>
  );
}

function Period({ label, period }: { label: string; period?: WeightPeriodChangeResult }) {
  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold mt-1">{formatPeriod(period)}</div>
      <div className="text-xs text-muted-foreground mt-1">{periodDetail(period)}</div>
      {period?.warnings?.length ? <div className="text-xs text-amber-700 mt-2">{period.warnings.map((item) => item.replaceAll("_", " ")).join(" · ")}</div> : null}
    </div>
  );
}

function formatChange(change?: { changeKg: number; changePercent: number; direction: string }) {
  if (!change) return "No comparison";
  const sign = change.changeKg > 0 ? "+" : "";
  return `${sign}${change.changeKg.toFixed(1)} kg (${sign}${change.changePercent.toFixed(1)}%)`;
}

function formatPeriod(period?: WeightPeriodChangeResult) {
  if (!period || period.status !== "calculated") return "No valid comparison";
  return formatChange(period);
}

function periodDetail(period?: WeightPeriodChangeResult) {
  if (!period) return undefined;
  if (period.status !== "calculated") return period.status.replaceAll("_", " ");
  return `${period.direction.replaceAll("_", " ")} · ${period.elapsedDays ?? "?"} days · ${period.comparisonQuality ?? "comparison"} quality`;
}

function lossTone(period?: WeightPeriodChangeResult) {
  return period?.status === "calculated" && (period.lossPercent ?? 0) >= 5 ? "warning" : "neutral";
}

function formatComparisonDate(value?: string) {
  return value ? `Compared with ${formatDate(value)}` : undefined;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
