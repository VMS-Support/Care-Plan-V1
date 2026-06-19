import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity, AlertTriangle, ThermometerSun, Gauge, Droplets, TrendingDown,
  HeartPulse, History, Users, ListChecks,
} from "lucide-react";
import { RecordVitalDialog } from "@/components/care/RecordVitalDialog";
import { ClinicalAlertList } from "@/components/care/ClinicalAlertList";
import { calcNEWS2, complianceForResident, weightTrend } from "@/lib/care/vitals";

export const Route = createFileRoute("/vitals")({
  head: () => ({ meta: [{ title: "Vital Signs — CarePath" }, { name: "description", content: "Clinical observations and vital signs monitoring" }] }),
  component: VitalsDashboard,
});

function Stat({ icon: Icon, label, value, tone, sub }: { icon: any; label: string; value: number | string; tone?: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
          <Icon className={`h-4 w-4 ${tone || "text-muted-foreground"}`} />
        </div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function VitalsDashboard() {
  const { vitals, residents, clinicalAlerts, observationPlans, currentRole } = useCare();
  const [search, setSearch] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const activeVitals = vitals.filter(v => !v.deletedAt);
  const todayCount = activeVitals.filter(v => v.date === today).length;
  const activeAlerts = clinicalAlerts.filter(a => !a.dismissedAt);
  const residentsWithAlerts = new Set(activeAlerts.map(a => a.residentId)).size;

  const latestPerResident = useMemo(() => {
    const m = new Map<string, typeof activeVitals[number]>();
    for (const v of activeVitals) {
      const cur = m.get(v.residentId);
      if (!cur || v.recordedAt > cur.recordedAt) m.set(v.residentId, v);
    }
    return m;
  }, [activeVitals]);

  const highNews2 = [...latestPerResident.values()].filter(v => { const n = calcNEWS2(v); return n.complete && n.total >= 5; }).length;
  const abnormalBP = [...latestPerResident.values()].filter(v => v.systolicBP !== undefined && (v.systolicBP < 90 || v.systolicBP > 180)).length;
  const abnormalTemp = [...latestPerResident.values()].filter(v => v.temperature !== undefined && (v.temperature < 35 || v.temperature >= 38)).length;
  const abnormalSpo2 = [...latestPerResident.values()].filter(v => v.spo2 !== undefined && v.spo2 < 92).length;
  const weightLoss = residents.filter(r => {
    const wt = weightTrend(activeVitals.filter(v => v.residentId === r.id), 90);
    return wt.deltaPct !== undefined && wt.deltaPct <= -5;
  }).length;

  // Compliance overview
  const compliance = useMemo(() => {
    let totalPct = 0, missed = 0, dueToday = 0, overdue = 0, residentsCounted = 0;
    for (const r of residents) {
      const plan = observationPlans.find(p => p.residentId === r.id);
      if (!plan) continue;
      const rv = activeVitals.filter(v => v.residentId === r.id);
      const c = complianceForResident(plan, rv);
      totalPct += c.compliancePct;
      missed += c.missedCount; dueToday += c.dueTodayCount; overdue += c.overdueCount;
      residentsCounted++;
    }
    return {
      compliancePct: residentsCounted === 0 ? 100 : Math.round(totalPct / residentsCounted),
      missed, dueToday, overdue,
    };
  }, [residents, observationPlans, activeVitals]);

  const recent = activeVitals
    .filter(v => {
      if (!search) return true;
      const r = residents.find(x => x.id === v.residentId);
      if (!r) return false;
      const q = search.toLowerCase();
      return `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) || r.roomNumber.includes(q) || r.id.toLowerCase().includes(q);
    })
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    .slice(0, 100);

  const residentsMissing = residents.filter(r => !latestPerResident.has(r.id) || (Date.now() - new Date(latestPerResident.get(r.id)!.recordedAt).getTime()) > 24 * 3600_000);

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><HeartPulse className="h-6 w-6 text-primary" /> Vital Signs & Clinical Observations</h1>
          <p className="text-sm text-muted-foreground">Alerts are informational only — clinical decisions remain with nursing staff.</p>
        </div>
        <div className="flex gap-2">
          {can(currentRole, "vital.audit") && (
            <Link to="/vitals/audit"><Button variant="outline" size="sm"><History className="h-4 w-4 mr-1" /> Audit Report</Button></Link>
          )}
          {can(currentRole, "vital.record") && <RecordVitalDialog />}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <Stat icon={Activity} label="Today's Observations" value={todayCount} tone="text-primary" />
        <Stat icon={AlertTriangle} label="Residents w/ Alerts" value={residentsWithAlerts} tone={residentsWithAlerts > 0 ? "text-warning" : ""} />
        <Stat icon={TrendingDown} label="Weight-Loss Alerts" value={weightLoss} tone={weightLoss > 0 ? "text-warning" : ""} />
        <Stat icon={HeartPulse} label="High NEWS2" value={highNews2} tone={highNews2 > 0 ? "text-destructive" : ""} />
        <Stat icon={Gauge} label="Abnormal BP" value={abnormalBP} />
        <Stat icon={ThermometerSun} label="Abnormal Temp" value={abnormalTemp} />
        <Stat icon={Droplets} label="Low SpO2" value={abnormalSpo2} />
        <Stat icon={Users} label="Residents Requiring Review" value={residentsWithAlerts} />
        <Stat icon={ListChecks} label="Observation Compliance %" value={`${compliance.compliancePct}%`} tone={compliance.compliancePct < 80 ? "text-warning" : "text-success"} />
        <Stat icon={AlertTriangle} label="Observations Missed" value={compliance.missed} />
        <Stat icon={ListChecks} label="Due Today" value={compliance.dueToday} />
        <Stat icon={AlertTriangle} label="Overdue Observations" value={compliance.overdue} tone={compliance.overdue > 0 ? "text-warning" : ""} />
      </div>

      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">Recent Observations</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts ({activeAlerts.length})</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="missing">Missing Observations ({residentsMissing.length})</TabsTrigger>
          <TabsTrigger value="high_news2">High NEWS2 ({highNews2})</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-3">
          <Input placeholder="Search resident, room or ID…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left p-2">Resident</th>
                    <th className="text-left p-2">When</th>
                    <th className="text-left p-2">Temp</th>
                    <th className="text-left p-2">Pulse</th>
                    <th className="text-left p-2">BP</th>
                    <th className="text-left p-2">SpO2</th>
                    <th className="text-left p-2">Pain</th>
                    <th className="text-left p-2">NEWS2</th>
                    <th className="text-left p-2">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recent.map(v => {
                    const r = residents.find(x => x.id === v.residentId);
                    const n = calcNEWS2(v);
                    return (
                      <tr key={v.id} className="hover:bg-muted/30">
                        <td className="p-2">
                          <Link to="/residents/$id" params={{ id: v.residentId }} className="text-primary hover:underline">
                            {r ? `${r.firstName} ${r.lastName}` : v.residentId}
                          </Link>
                          <div className="text-[10px] text-muted-foreground">{r?.roomNumber}</div>
                        </td>
                        <td className="p-2 text-xs">{v.date} {v.time}</td>
                        <td className="p-2 tabular-nums">{v.temperature ?? "—"}</td>
                        <td className="p-2 tabular-nums">{v.pulse ?? "—"}</td>
                        <td className="p-2 tabular-nums">{v.systolicBP ? `${v.systolicBP}/${v.diastolicBP ?? "?"}` : "—"}</td>
                        <td className="p-2 tabular-nums">{v.spo2 ?? "—"}</td>
                        <td className="p-2 tabular-nums">{v.painScore ?? "—"}</td>
                        <td className="p-2">{n.complete ? <Badge variant="outline" className={`text-[10px] capitalize ${n.risk === "high" ? "border-destructive/40 text-destructive" : n.risk === "medium" ? "border-warning/40" : ""}`}>{n.total} · {n.risk}</Badge> : "—"}</td>
                        <td className="p-2 text-xs text-muted-foreground">{v.recordedByName}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <ClinicalAlertList />
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left p-2">Resident</th>
                    <th className="text-left p-2">Compliance</th>
                    <th className="text-left p-2">Due Today</th>
                    <th className="text-left p-2">Overdue</th>
                    <th className="text-left p-2">Missed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {residents.map(r => {
                    const plan = observationPlans.find(p => p.residentId === r.id);
                    const c = complianceForResident(plan, activeVitals.filter(v => v.residentId === r.id));
                    return (
                      <tr key={r.id}>
                        <td className="p-2"><Link to="/residents/$id" params={{ id: r.id }} className="text-primary hover:underline">{r.firstName} {r.lastName}</Link></td>
                        <td className="p-2"><Badge variant="outline" className={c.compliancePct < 80 ? "border-warning/40 text-warning-foreground" : "border-success/40 text-success"}>{c.compliancePct}%</Badge></td>
                        <td className="p-2 tabular-nums">{c.dueTodayCount}</td>
                        <td className="p-2 tabular-nums">{c.overdueCount}</td>
                        <td className="p-2 tabular-nums">{c.missedCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missing">
          <Card>
            <CardContent className="p-4 space-y-2">
              {residentsMissing.length === 0
                ? <p className="text-sm text-muted-foreground">All residents have observations within 24 hours.</p>
                : residentsMissing.map(r => {
                  const last = latestPerResident.get(r.id);
                  return (
                    <div key={r.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <Link to="/residents/$id" params={{ id: r.id }} className="text-primary hover:underline text-sm font-medium">{r.firstName} {r.lastName}</Link>
                        <div className="text-[10px] text-muted-foreground">Room {r.roomNumber} · Last: {last ? new Date(last.recordedAt).toLocaleString() : "Never"}</div>
                      </div>
                      <Badge variant="outline" className="border-warning/40 text-warning-foreground">No obs in 24h</Badge>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high_news2">
          <Card>
            <CardContent className="p-4 space-y-2">
              {[...latestPerResident.entries()]
                .map(([rid, v]) => ({ rid, v, n: calcNEWS2(v) }))
                .filter(x => x.n.complete && x.n.total >= 5)
                .sort((a, b) => b.n.total - a.n.total)
                .map(({ rid, v, n }) => {
                  const r = residents.find(x => x.id === rid);
                  return (
                    <div key={rid} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <Link to="/residents/$id" params={{ id: rid }} className="text-primary hover:underline text-sm font-medium">{r ? `${r.firstName} ${r.lastName}` : rid}</Link>
                        <div className="text-[10px] text-muted-foreground">Recorded {new Date(v.recordedAt).toLocaleString()}</div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] capitalize ${n.risk === "high" ? "border-destructive/40 text-destructive" : "border-warning/40 text-warning-foreground"}`}>NEWS2 {n.total} · {n.risk}</Badge>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
