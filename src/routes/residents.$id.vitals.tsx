import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { LatestVitalsCard } from "@/components/care/LatestVitalsCard";
import { RecordVitalDialog } from "@/components/care/RecordVitalDialog";
import { ClinicalAlertList } from "@/components/care/ClinicalAlertList";
import { VitalsTrendChart } from "@/components/care/VitalsTrendChart";
import { ObservationPlanEditor } from "@/components/care/ObservationPlanEditor";
import { ObservationComplianceTable } from "@/components/care/ObservationComplianceTable";
import { DeteriorationPanel } from "@/components/care/DeteriorationPanel";
import { FluidBalanceChart } from "@/components/care/FluidBalanceChart";
import { BloodGlucoseChart } from "@/components/care/BloodGlucoseChart";
import { calcNEWS2 } from "@/lib/care/vitals";

export const Route = createFileRoute("/residents/$id/vitals")({
  head: ({ params }) => ({ meta: [{ title: `Vitals — Resident ${params.id} — CarePath` }] }),
  component: ResidentVitals,
});

function DeleteVitalDialog({ id }: { id: string }) {
  const { softDeleteVital } = useCare();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="ghost"><Trash2 className="h-3 w-3 text-destructive" /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Delete vital signs entry (audited)</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">Soft-deleted and retained for audit.</p>
        <Textarea placeholder="Reason…" value={reason} onChange={e => setReason(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" disabled={!reason.trim()} onClick={() => { softDeleteVital(id, reason); setOpen(false); }}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResidentVitals() {
  const { id } = Route.useParams();
  const { residents, vitals, currentRole } = useCare();
  const r = residents.find(x => x.id === id);
  if (!r) return <div className="p-8">Resident not found.</div>;
  const rv = vitals.filter(v => v.residentId === id);
  const active = rv.filter(v => !v.deletedAt).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/residents/$id" params={{ id }} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Back to {r.firstName} {r.lastName}</Link>
        {can(currentRole, "vital.record") && <RecordVitalDialog residentId={id} />}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Vital Signs & Observations</h1>

      <LatestVitalsCard vitals={rv} resident={r} />
      <ClinicalAlertList residentId={id} />

      <div className="grid md:grid-cols-2 gap-4">
        <ObservationPlanEditor residentId={id} />
        <ObservationComplianceTable residentId={id} />
      </div>

      <DeteriorationPanel residentId={id} />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        <VitalsTrendChart title="Temperature" vitals={rv} metric="temperature" unit="°C" />
        <VitalsTrendChart title="Pulse" vitals={rv} metric="pulse" unit="bpm" />
        <VitalsTrendChart title="Respiratory rate" vitals={rv} metric="respiratoryRate" unit="/min" />
        <VitalsTrendChart title="Systolic BP" vitals={rv} metric="systolicBP" unit="mmHg" />
        <VitalsTrendChart title="SpO2" vitals={rv} metric="spo2" unit="%" />
        <VitalsTrendChart title="Pain score" vitals={rv} metric="painScore" unit="/10" />
        <VitalsTrendChart title="Weight" vitals={rv} metric="weight" unit="kg" />
        <VitalsTrendChart title="BMI (derived)" vitals={rv} metric="bmi" />
        <VitalsTrendChart title="NEWS2" vitals={rv} metric="news2" />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <FluidBalanceChart vitals={rv} />
        <BloodGlucoseChart vitals={rv} />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left p-2">When</th>
                <th className="text-left p-2">Temp</th>
                <th className="text-left p-2">Pulse</th>
                <th className="text-left p-2">BP</th>
                <th className="text-left p-2">SpO2</th>
                <th className="text-left p-2">Pain</th>
                <th className="text-left p-2">Weight</th>
                <th className="text-left p-2">NEWS2</th>
                <th className="text-left p-2">By</th>
                <th className="text-right p-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {active.map(v => {
                const n = calcNEWS2(v);
                return (
                  <tr key={v.id}>
                    <td className="p-2 text-xs">{v.date} {v.time}</td>
                    <td className="p-2 tabular-nums">{v.temperature ?? "—"}</td>
                    <td className="p-2 tabular-nums">{v.pulse ?? "—"}</td>
                    <td className="p-2 tabular-nums">{v.systolicBP ? `${v.systolicBP}/${v.diastolicBP ?? "?"}` : "—"}</td>
                    <td className="p-2 tabular-nums">{v.spo2 ?? "—"}</td>
                    <td className="p-2 tabular-nums">{v.painScore ?? "—"}</td>
                    <td className="p-2 tabular-nums">{v.weight ?? "—"}</td>
                    <td className="p-2">{n.complete ? <Badge variant="outline" className="text-[10px]">{n.total}</Badge> : "—"}</td>
                    <td className="p-2 text-xs">{v.recordedByName}</td>
                    <td className="p-2 text-right">
                      {can(currentRole, "vital.delete") && <DeleteVitalDialog id={v.id} />}
                    </td>
                  </tr>
                );
              })}
              {active.length === 0 && <tr><td colSpan={10} className="p-6 text-center text-muted-foreground text-sm">No vital sign entries yet.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
