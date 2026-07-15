import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, AlertTriangle, Scale, HeartPulse, History, ListChecks } from "lucide-react";
import { ClinicalAlertList } from "@/components/care/ClinicalAlertList";
import { calcNEWS2, complianceForResident } from "@/lib/care/vitals";
import { isActionableClinicalAlert } from "@/lib/care/alerts";
import {
  formatVitalValues,
  inferVitalRecordType,
  isAbnormalVital,
  VITAL_TYPE_LABELS,
} from "@/lib/care/vital-records";
import type { VitalRecordType } from "@/lib/care/types";

export const Route = createFileRoute("/vitals")({
  head: () => ({
    meta: [
      { title: "Vital Signs — CarePath" },
      { name: "description", content: "Clinical observations and vital signs monitoring" },
    ],
  }),
  component: VitalsDashboard,
});

function Stat({
  icon: Icon,
  label,
  value,
  tone,
  sub,
}: {
  icon: any;
  label: string;
  value: number | string;
  tone?: string;
  sub?: string;
}) {
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

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function VitalsDashboard() {
  const { vitals, residents, clinicalAlerts, observationPlans, currentRole, wings } = useCare();
  const [typeFilter, setTypeFilter] = useState("all");
  const [residentFilter, setResidentFilter] = useState("all");
  const [wingFilter, setWingFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [abnormalOnly, setAbnormalOnly] = useState(false);
  const [recordedByFilter, setRecordedByFilter] = useState("all");

  if (currentRole !== "cnm" && currentRole !== "don" && currentRole !== "group_owner") {
    return (
      <div className="p-4 md:p-8 max-w-3xl">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-xl font-semibold">Vitals Governance</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Facility-wide vitals reporting is available to CNM and DON roles. Record and review
              resident observations from the Resident Profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const activeVitals = vitals.filter((v) => !v.deletedAt);
  const todayCount = activeVitals.filter((v) => v.date === today).length;
  const activeAlerts = clinicalAlerts.filter(
    (a) => isActionableClinicalAlert(a) && !a.dismissedAt && !a.resolvedAt,
  );

  const latestPerResident = useMemo(() => {
    const m = new Map<string, (typeof activeVitals)[number]>();
    for (const v of activeVitals) {
      const cur = m.get(v.residentId);
      if (!cur || v.recordedAt > cur.recordedAt) m.set(v.residentId, v);
    }
    return m;
  }, [activeVitals]);

  const latestNewsPerResident = useMemo(() => {
    const map = new Map<string, (typeof activeVitals)[number]>();
    for (const vital of activeVitals) {
      if (!calcNEWS2(vital).complete) continue;
      const current = map.get(vital.residentId);
      if (!current || vital.recordedAt > current.recordedAt) map.set(vital.residentId, vital);
    }
    return map;
  }, [activeVitals]);
  const highNews2 = [...latestNewsPerResident.values()].filter(
    (v) => calcNEWS2(v).total >= 5,
  ).length;
  const weightAlerts = activeAlerts.filter(
    (a) => a.type === "weight_loss" || a.type === "weight_gain",
  ).length;

  // Compliance overview
  const compliance = useMemo(() => {
    let totalPct = 0,
      missed = 0,
      dueToday = 0,
      overdue = 0,
      residentsCounted = 0;
    for (const r of residents) {
      const plan = observationPlans.find((p) => p.residentId === r.id);
      if (!plan) continue;
      const rv = activeVitals.filter((v) => v.residentId === r.id);
      const c = complianceForResident(plan, rv);
      totalPct += c.compliancePct;
      missed += c.missedCount;
      dueToday += c.dueTodayCount;
      overdue += c.overdueCount;
      residentsCounted++;
    }
    return {
      compliancePct: residentsCounted === 0 ? 100 : Math.round(totalPct / residentsCounted),
      missed,
      dueToday,
      overdue,
    };
  }, [residents, observationPlans, activeVitals]);

  const recent = activeVitals
    .filter((v) => {
      const r = residents.find((x) => x.id === v.residentId);
      if (!r) return false;
      if (typeFilter !== "all" && inferVitalRecordType(v) !== typeFilter) return false;
      if (residentFilter !== "all" && v.residentId !== residentFilter) return false;
      if (wingFilter !== "all" && r.wingId !== wingFilter) return false;
      if (dateFrom && v.date < dateFrom) return false;
      if (dateTo && v.date > dateTo) return false;
      if (abnormalOnly && !isAbnormalVital(v)) return false;
      if (recordedByFilter !== "all" && v.recordedByName !== recordedByFilter) return false;
      return true;
    })
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    .slice(0, 100);

  const residentsMissing = residents.filter(
    (r) =>
      !latestPerResident.has(r.id) ||
      Date.now() - new Date(latestPerResident.get(r.id)!.recordedAt).getTime() > 24 * 3600_000,
  );
  const recordedByOptions = [...new Set(activeVitals.map((v) => v.recordedByName))].sort();
  const wingOptions = wings.filter((wing) =>
    residents.some((resident) => resident.wingId === wing.id),
  );

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-primary" /> Vital Signs & Clinical Observations
          </h1>
          <p className="text-sm text-muted-foreground">
            Alerts are informational only — clinical decisions remain with nursing staff.
          </p>
        </div>
        <div className="flex gap-2">
          {can(currentRole, "vital.audit") && (
            <Link to="/vitals/audit">
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-1" /> Audit Report
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <Stat icon={Activity} label="Observations Today" value={todayCount} tone="text-primary" />
        <Stat
          icon={AlertTriangle}
          label="Abnormal Observations"
          value={activeAlerts.length}
          tone={activeAlerts.length > 0 ? "text-warning" : ""}
        />
        <Stat
          icon={HeartPulse}
          label="High NEWS2"
          value={highNews2}
          tone={highNews2 > 0 ? "text-destructive" : ""}
        />
        <Stat
          icon={Scale}
          label="Weight Alerts"
          value={weightAlerts}
          tone={weightAlerts > 0 ? "text-warning" : ""}
        />
        <Stat
          icon={AlertTriangle}
          label="Missing Observations"
          value={residentsMissing.length}
          tone={residentsMissing.length > 0 ? "text-warning" : ""}
        />
        <Stat
          icon={ListChecks}
          label="Observation Compliance %"
          value={`${compliance.compliancePct}%`}
          tone={compliance.compliancePct < 80 ? "text-warning" : "text-success"}
        />
      </div>

      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">Recent Observations</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts ({activeAlerts.length})</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="missing">
            Missing Observations ({residentsMissing.length})
          </TabsTrigger>
          <TabsTrigger value="high_news2">High NEWS2 ({highNews2})</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-3">
          <Card>
            <CardContent className="p-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Filter label="Observation Type">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {(Object.keys(VITAL_TYPE_LABELS) as VitalRecordType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        {VITAL_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Filter>
              <Filter label="Resident">
                <Select value={residentFilter} onValueChange={setResidentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All residents</SelectItem>
                    {residents.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.firstName} {r.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Filter>
              <Filter label="Wing">
                <Select value={wingFilter} onValueChange={setWingFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All wings</SelectItem>
                    {wingOptions.map((wing) => (
                      <SelectItem key={wing.id} value={wing.id}>
                        {wing.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Filter>
              <Filter label="Recorded By">
                <Select value={recordedByFilter} onValueChange={setRecordedByFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All staff</SelectItem>
                    {recordedByOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Filter>
              <Filter label="From">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </Filter>
              <Filter label="To">
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </Filter>
              <label className="flex items-center gap-2 self-end h-9 text-sm">
                <Checkbox
                  checked={abnormalOnly}
                  onCheckedChange={(value) => setAbnormalOnly(value === true)}
                />{" "}
                Abnormal only
              </label>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left p-2">Resident</th>
                    <th className="text-left p-2">Date / Time</th>
                    <th className="text-left p-2">Observation Type</th>
                    <th className="text-left p-2">Recorded Values</th>
                    <th className="text-left p-2">NEWS2</th>
                    <th className="text-left p-2">Recorded By</th>
                    <th className="text-right p-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recent.map((v) => {
                    const r = residents.find((x) => x.id === v.residentId);
                    const n = calcNEWS2(v);
                    return (
                      <tr key={v.id} className="hover:bg-muted/30">
                        <td className="p-2">
                          <Link
                            to="/residents/$id"
                            params={{ id: v.residentId }}
                            className="text-primary hover:underline"
                          >
                            {r ? `${r.firstName} ${r.lastName}` : v.residentId}
                          </Link>
                          <div className="text-[10px] text-muted-foreground">{r?.roomNumber}</div>
                        </td>
                        <td className="p-2 text-xs">
                          {v.date} {v.time}
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">
                            {VITAL_TYPE_LABELS[inferVitalRecordType(v)]}
                          </Badge>
                        </td>
                        <td className="p-2 text-xs font-medium">
                          {formatVitalValues(v, activeVitals, r)}
                        </td>
                        <td className="p-2">
                          {n.complete ? (
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize ${n.risk === "high" ? "border-destructive/40 text-destructive" : n.risk === "medium" ? "border-warning/40" : ""}`}
                            >
                              {n.total} · {n.risk}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">{v.recordedByName}</td>
                        <td className="p-2 text-right">
                          <Button asChild size="sm" variant="ghost">
                            <Link to="/residents/$id" params={{ id: v.residentId }}>
                              Open
                            </Link>
                          </Button>
                        </td>
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
                  {residents.map((r) => {
                    const plan = observationPlans.find((p) => p.residentId === r.id);
                    const c = complianceForResident(
                      plan,
                      activeVitals.filter((v) => v.residentId === r.id),
                    );
                    return (
                      <tr key={r.id}>
                        <td className="p-2">
                          <Link
                            to="/residents/$id"
                            params={{ id: r.id }}
                            className="text-primary hover:underline"
                          >
                            {r.firstName} {r.lastName}
                          </Link>
                        </td>
                        <td className="p-2">
                          <Badge
                            variant="outline"
                            className={
                              c.compliancePct < 80
                                ? "border-warning/40 text-warning-foreground"
                                : "border-success/40 text-success"
                            }
                          >
                            {c.compliancePct}%
                          </Badge>
                        </td>
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
              {residentsMissing.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  All residents have observations within 24 hours.
                </p>
              ) : (
                residentsMissing.map((r) => {
                  const last = latestPerResident.get(r.id);
                  return (
                    <div key={r.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <Link
                          to="/residents/$id"
                          params={{ id: r.id }}
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          {r.firstName} {r.lastName}
                        </Link>
                        <div className="text-[10px] text-muted-foreground">
                          Room {r.roomNumber} · Last:{" "}
                          {last ? new Date(last.recordedAt).toLocaleString() : "Never"}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-warning/40 text-warning-foreground"
                      >
                        No obs in 24h
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high_news2">
          <Card>
            <CardContent className="p-4 space-y-2">
              {[...latestNewsPerResident.entries()]
                .map(([rid, v]) => ({ rid, v, n: calcNEWS2(v) }))
                .filter((x) => x.n.complete && x.n.total >= 5)
                .sort((a, b) => b.n.total - a.n.total)
                .map(({ rid, v, n }) => {
                  const r = residents.find((x) => x.id === rid);
                  return (
                    <div key={rid} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <Link
                          to="/residents/$id"
                          params={{ id: rid }}
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          {r ? `${r.firstName} ${r.lastName}` : rid}
                        </Link>
                        <div className="text-[10px] text-muted-foreground">
                          Recorded {new Date(v.recordedAt).toLocaleString()}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${n.risk === "high" ? "border-destructive/40 text-destructive" : "border-warning/40 text-warning-foreground"}`}
                      >
                        NEWS2 {n.total} · {n.risk}
                      </Badge>
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
