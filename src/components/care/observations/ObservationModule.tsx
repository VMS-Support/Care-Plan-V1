import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, History as HistoryIcon, TrendingUp, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { getModule } from "@/lib/care/observations";
import { RecordObservationDialog } from "./RecordObservationDialog";
import type { ObservationKind } from "@/lib/care/types";

function DeleteDialog({ id }: { id: string }) {
  const { softDeleteObservation } = useCare();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="ghost"><Trash2 className="h-3 w-3 text-destructive" /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Delete observation (audited)</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">Soft-deleted and retained for audit.</p>
        <Textarea placeholder="Reason…" value={reason} onChange={e => setReason(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" disabled={!reason.trim()} onClick={() => { softDeleteObservation(id, reason); setOpen(false); }}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const sevCls: Record<string, string> = {
  info: "border-info/40 text-info",
  warning: "border-warning/40 text-warning-foreground",
  critical: "border-destructive/40 text-destructive",
};

interface Props { residentId: string; kind: ObservationKind; }

export function ObservationModule({ residentId, kind }: Props) {
  const { clinicalObservations, residents, currentRole } = useCare();
  const mod = getModule(kind);
  const Icon = mod.icon;
  const resident = residents.find(r => r.id === residentId);
  const obs = clinicalObservations.filter(o => o.residentId === residentId && o.kind === kind);
  const active = obs.filter(o => !o.deletedAt).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  const latest = active[0];
  const alerts = mod.deriveAlerts(obs, resident);

  const [metric, setMetric] = useState(mod.trends[0]?.key);
  const series = useMemo(() => {
    const m = mod.trends.find(t => t.key === metric) ?? mod.trends[0];
    if (!m) return [];
    return [...active].reverse().map(o => ({ date: o.date, value: m.extract(o, resident, active) })).filter(p => p.value !== undefined && !Number.isNaN(p.value));
  }, [active, metric, mod, resident]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className={`h-8 w-8 rounded-md ${mod.bg} flex items-center justify-center`}><Icon className={`h-4 w-4 ${mod.color}`} /></span>
            {mod.label}
          </CardTitle>
          {can(currentRole, "observation.record") && <RecordObservationDialog kind={kind} residentId={residentId} />}
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-2">{mod.description}</p>
          {latest ? (
            <div className="space-y-1">
              <div className="text-sm font-medium">{mod.summarize(latest, resident, active)}</div>
              <div className="text-[11px] text-muted-foreground">Last recorded {latest.date} {latest.time} by {latest.recordedByName}</div>
            </div>
          ) : <p className="text-sm text-muted-foreground">No observations recorded yet.</p>}
          {mod.relatedAssessments && mod.relatedAssessments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {mod.relatedAssessments.map(a => <Badge key={a} variant="outline" className="text-[10px]">Related: {a}</Badge>)}
            </div>
          )}
        </CardContent>
      </Card>

      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="border rounded-md p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className={`text-[10px] mr-2 ${sevCls[a.severity]}`}>{a.severity}</Badge>
                    <span className="font-medium text-sm">{a.title}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
                    <p className="text-xs mt-1"><strong>Recommendation:</strong> {a.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {mod.trends.length > 0 && active.length > 1 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Trend</CardTitle>
            {mod.trends.length > 1 && (
              <div className="flex gap-1">
                {mod.trends.map(t => (
                  <Button key={t.key} size="sm" variant={metric === t.key ? "default" : "outline"} className="h-6 text-[10px] px-2"
                    onClick={() => setMetric(t.key)}>{t.label}</Button>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><HistoryIcon className="h-4 w-4 text-primary" /> History ({active.length})</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left p-2">When</th>
                {mod.columns.map(c => <th key={c.key} className="text-left p-2">{c.label}</th>)}
                <th className="text-left p-2">By</th>
                <th className="text-right p-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {active.map(o => (
                <tr key={o.id}>
                  <td className="p-2 text-xs whitespace-nowrap">{o.date} {o.time}</td>
                  {mod.columns.map(c => <td key={c.key} className="p-2 text-xs">{c.render ? c.render(o, resident, active) : (o.data[c.key] ?? "—")}</td>)}
                  <td className="p-2 text-[11px]">{o.recordedByName}</td>
                  <td className="p-2 text-right">
                    {can(currentRole, "observation.delete") && <DeleteDialog id={o.id} />}
                  </td>
                </tr>
              ))}
              {active.length === 0 && <tr><td colSpan={mod.columns.length + 3} className="p-6 text-center text-muted-foreground text-xs">No entries yet.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
