import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { ALL_KINDS, getModule } from "@/lib/care/observations";
import { RecordObservationDialog } from "@/components/care/observations/RecordObservationDialog";
import type { ObservationKind } from "@/lib/care/types";

export const Route = createFileRoute("/observations/$kind")({
  head: ({ params }) => ({ meta: [{ title: `${params.kind} observations — CarePath` }] }),
  component: KindDashboard,
});

function KindDashboard() {
  const { kind } = Route.useParams();
  if (!ALL_KINDS.includes(kind as ObservationKind)) throw notFound();
  const k = kind as ObservationKind;
  const mod = getModule(k);
  const Icon = mod.icon;
  const { clinicalObservations, residents, currentRole } = useCare();
  const obs = clinicalObservations.filter(o => o.kind === k && !o.deletedAt);

  const perResident = residents.map(r => {
    const r0bs = obs.filter(o => o.residentId === r.id).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
    const latest = r0bs[0];
    const alerts = mod.deriveAlerts(r0bs.length ? obs.filter(o => o.residentId === r.id) : [], r);
    return { resident: r, latest, count: r0bs.length, alerts };
  });

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-7xl">
      <Link to="/observations" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> All Observation Modules</Link>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-md ${mod.bg} flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${mod.color}`} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{mod.label}</h1>
            <p className="text-sm text-muted-foreground">{mod.description}</p>
          </div>
        </div>
        {can(currentRole, "observation.record") && <RecordObservationDialog kind={k} />}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">All residents — latest {mod.shortLabel}</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left p-2">Resident</th>
                <th className="text-left p-2">Room</th>
                <th className="text-left p-2">Latest</th>
                <th className="text-left p-2">Summary</th>
                <th className="text-left p-2">Records</th>
                <th className="text-left p-2">Alerts</th>
                <th className="text-right p-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {perResident.map(({ resident, latest, count, alerts }) => (
                <tr key={resident.id} className="hover:bg-muted/30">
                  <td className="p-2">{resident.firstName} {resident.lastName}</td>
                  <td className="p-2 text-xs">{resident.roomNumber}</td>
                  <td className="p-2 text-xs">{latest ? `${latest.date} ${latest.time}` : "—"}</td>
                  <td className="p-2 text-xs">{latest ? mod.summarize(latest, resident, obs.filter(o => o.residentId === resident.id)) : "—"}</td>
                  <td className="p-2 tabular-nums text-xs">{count}</td>
                  <td className="p-2">{alerts.length > 0 ? <Badge variant="outline" className="border-warning/40 text-warning-foreground text-[10px]">{alerts.length}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</td>
                  <td className="p-2 text-right">
                    <Link to="/residents/$id/observations" params={{ id: resident.id }} search={{ tab: k } as any}>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">Open</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
