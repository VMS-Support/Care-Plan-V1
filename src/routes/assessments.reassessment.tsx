import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useCare } from "@/lib/care/store";
import { assessmentMeta } from "@/lib/care/scoring";
import { deriveStatus, riskBadgeCls, statusBadgeCls } from "@/lib/care/assessments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, RefreshCw, AlertTriangle, Clock, Users, Zap } from "lucide-react";
import type { AssessmentType } from "@/lib/care/types";

export const Route = createFileRoute("/assessments/reassessment")({
  head: () => ({ meta: [{ title: "Reassessment Queue — CarePath" }] }),
  component: ReassessmentQueue,
});

const CORE_TYPES: AssessmentType[] = ["waterlow", "barthel", "abbey_pain", "must", "falls", "mmse"];

function ReassessmentQueue() {
  const { assessments, residents, assessmentTriggerEvents } = useCare();
  const today = new Date();
  const in7 = new Date(today.getTime() + 7 * 86400000);

  const queue = useMemo(() => {
    const items = assessments
      .filter(a => a.status === "completed" && !a.supersededById && a.nextReassessmentDate)
      .map(a => ({ a, ds: deriveStatus(a) }))
      .filter(x => x.ds === "due" || x.ds === "overdue");
    return items;
  }, [assessments]);

  const overdue = queue.filter(x => x.ds === "overdue");
  const dueToday = queue.filter(x => x.a.nextReassessmentDate === today.toISOString().slice(0, 10));
  const dueWeek = queue.filter(x => x.ds === "due");

  const residentsMissing = useMemo(() => {
    const hasByResident: Record<string, Set<AssessmentType>> = {};
    for (const a of assessments) {
      if (a.status !== "completed") continue;
      (hasByResident[a.residentId] ??= new Set()).add(a.type);
    }
    return residents.flatMap(r => {
      const has = hasByResident[r.id] || new Set();
      const missing = CORE_TYPES.filter(t => !has.has(t));
      return missing.map(t => ({ resident: r, type: t }));
    });
  }, [assessments, residents]);

  const triggered = useMemo(() => assessmentTriggerEvents.slice(0, 20), [assessmentTriggerEvents]);

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-[1400px]">
      <Link to="/assessments" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Assessment Centre
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reassessment Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">Scheduled and triggered reassessments across all residents.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={AlertTriangle} label="Overdue" value={overdue.length} tone={overdue.length ? "destructive" : "default"} />
        <Stat icon={Clock} label="Due Today" value={dueToday.length} tone="warning" />
        <Stat icon={RefreshCw} label="Due This Week" value={dueWeek.length} tone="warning" />
        <Stat icon={Users} label="Residents Missing Core" value={residentsMissing.length} />
      </div>

      <Tabs defaultValue="overdue">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overdue">Overdue ({overdue.length})</TabsTrigger>
          <TabsTrigger value="today">Due Today ({dueToday.length})</TabsTrigger>
          <TabsTrigger value="week">Due This Week ({dueWeek.length})</TabsTrigger>
          <TabsTrigger value="missing">Missing Core ({residentsMissing.length})</TabsTrigger>
          <TabsTrigger value="triggered">Triggered ({triggered.length})</TabsTrigger>
        </TabsList>

        {(["overdue", "today", "week"] as const).map(k => {
          const list = k === "overdue" ? overdue : k === "today" ? dueToday : dueWeek;
          return (
            <TabsContent key={k} value={k} className="mt-4">
              <QueueTable list={list} residents={residents} />
            </TabsContent>
          );
        })}

        <TabsContent value="missing" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr><th className="text-left p-3">Resident</th><th className="text-left p-3">Missing Assessment</th><th className="text-right p-3">Action</th></tr>
                </thead>
                <tbody className="divide-y">
                  {residentsMissing.map(({ resident, type }) => (
                    <tr key={resident.id + type}>
                      <td className="p-3">
                        <Link to="/residents/$id/assessments" params={{ id: resident.id }} className="font-medium hover:text-primary">
                          {resident.firstName} {resident.lastName}
                        </Link>
                        <div className="text-xs text-muted-foreground">Room {resident.roomNumber}</div>
                      </td>
                      <td className="p-3">{assessmentMeta[type].name}</td>
                      <td className="p-3 text-right">
                        <Link to="/assessments/new/$residentId" params={{ residentId: resident.id }} search={{ type } as any}>
                          <Button size="sm">Start</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {residentsMissing.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-sm text-muted-foreground">All residents have core assessments.</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggered" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left p-3">When</th>
                    <th className="text-left p-3">Resident</th>
                    <th className="text-left p-3">Trigger</th>
                    <th className="text-left p-3">Source</th>
                    <th className="text-left p-3">Affected</th>
                    <th className="text-left p-3">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {triggered.map(t => {
                    const r = residents.find(x => x.id === t.residentId);
                    return (
                      <tr key={t.id}>
                        <td className="p-3 text-xs">{t.at.slice(0, 16).replace("T", " ")}</td>
                        <td className="p-3"><Link to="/residents/$id/assessments" params={{ id: t.residentId }} className="hover:text-primary">{r?.firstName} {r?.lastName}</Link></td>
                        <td className="p-3"><Badge variant="outline" className="capitalize text-[10px]"><Zap className="h-3 w-3 mr-1" />{t.trigger.replace(/_/g, " ")}</Badge></td>
                        <td className="p-3 text-xs capitalize">{t.sourceModule}</td>
                        <td className="p-3 text-xs">{t.affectedAssessmentTypes.map(x => assessmentMeta[x].name).join(", ") || "—"}</td>
                        <td className="p-3 text-xs">{t.byUserName || "—"}</td>
                      </tr>
                    );
                  })}
                  {triggered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No triggered reassessments yet.</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QueueTable({ list, residents }: { list: { a: any; ds: string }[]; residents: any[] }) {
  if (list.length === 0) return <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Nothing here. 🎉</CardContent></Card>;
  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3">Resident</th>
              <th className="text-left p-3">Assessment</th>
              <th className="text-left p-3">Last Score</th>
              <th className="text-left p-3">Risk</th>
              <th className="text-left p-3">Due</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.map(({ a, ds }) => {
              const r = residents.find(x => x.id === a.residentId);
              return (
                <tr key={a.id}>
                  <td className="p-3"><Link to="/residents/$id/assessments" params={{ id: a.residentId }} className="font-medium hover:text-primary">{r?.firstName} {r?.lastName}</Link>
                    <div className="text-xs text-muted-foreground">Room {r?.roomNumber}</div>
                  </td>
                  <td className="p-3">{assessmentMeta[a.type as AssessmentType].name}</td>
                  <td className="p-3 tabular-nums font-semibold">{a.totalScore}</td>
                  <td className="p-3"><Badge variant="outline" className={`text-[10px] ${riskBadgeCls(a.riskLevel)}`}>{a.interpretation}</Badge></td>
                  <td className="p-3 text-xs">{a.nextReassessmentDate}</td>
                  <td className="p-3"><Badge variant="outline" className={`text-[10px] capitalize ${statusBadgeCls(ds as any)}`}>{ds}</Badge></td>
                  <td className="p-3 text-right">
                    <Link to="/assessments/new/$residentId" params={{ residentId: a.residentId }} search={{ type: a.type } as any}>
                      <Button size="sm"><RefreshCw className="h-3 w-3 mr-1" /> Reassess</Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function Stat({ icon: Icon, label, value, tone = "default" }: { icon: any; label: string; value: number; tone?: "default" | "warning" | "destructive" }) {
  const tones = {
    default: "border-border",
    warning: "border-warning/40 bg-warning/5",
    destructive: "border-destructive/40 bg-destructive/5",
  };
  return (
    <Card className={tones[tone]}>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
          <div className="text-[11px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
