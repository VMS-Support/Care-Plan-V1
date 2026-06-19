import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { assessmentMeta } from "@/lib/care/scoring";
import { ASSESSMENT_CATEGORIES, deriveStatus, riskBadgeCls, statusBadgeCls } from "@/lib/care/assessments";
import { can } from "@/lib/care/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, Users, Search,
  TrendingUp, ShieldAlert, UserPlus, Lock, RefreshCw,
} from "lucide-react";
import type { AssessmentType, AssessmentCategory } from "@/lib/care/types";

export const Route = createFileRoute("/assessments/")({
  head: () => ({ meta: [{ title: "Assessment Centre — CarePath" }] }),
  component: AssessmentsList,
});

const ALL_TYPES: AssessmentType[] = [
  "abbey_pain", "waterlow", "barthel", "must", "mna", "mmse", "four_at",
  "falls", "continence", "pain_chart", "cornell", "gds15", "abc", "abs",
  "norton", "nutrition", "pinch_me",
];

function Stat({ icon: Icon, label, value, tone = "default", to }: {
  icon: any; label: string; value: number | string; tone?: "default" | "warning" | "destructive" | "success" | "info"; to?: any;
}) {
  const tones = {
    default: "border-border",
    warning: "border-warning/40 bg-warning/5",
    destructive: "border-destructive/40 bg-destructive/5",
    success: "border-success/40 bg-success/5",
    info: "border-info/40 bg-info/5",
  };
  const body = (
    <Card className={`${tones[tone]} hover:shadow-sm transition`}>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
          <div className="text-[11px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function AssessmentsList() {
  const { assessments, residents, currentRole, currentUserName } = useCare();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<AssessmentCategory | "all">("all");
  const [typeF, setTypeF] = useState<AssessmentType | "all">("all");
  const [statusF, setStatusF] = useState<"all" | "active" | "due" | "overdue" | "draft" | "archived" | "deleted">("active");

  const todayISO = new Date().toISOString().slice(0, 10);

  const dashboard = useMemo(() => {
    const live = assessments.filter(a => a.status !== "deleted" && a.status !== "archived");
    const completed = live.filter(a => a.status === "completed");
    const todayCount = completed.filter(a => a.date.slice(0, 10) === todayISO).length;
    let due = 0, overdue = 0, highRisk = 0;
    const residentsWithAssessment = new Set<string>();
    for (const a of completed) {
      if (a.supersededById) continue;
      const ds = deriveStatus(a);
      if (ds === "due") due++;
      if (ds === "overdue") overdue++;
      if (a.riskLevel === "high" || a.riskLevel === "very_high") highRisk++;
      residentsWithAssessment.add(a.residentId);
    }
    const mine = live.filter(a => a.assignedToName === currentUserName || a.assessor === currentUserName).length;
    const missing = residents.filter(r => !residentsWithAssessment.has(r.id)).length;
    const total = completed.length;
    const compliance = total === 0 ? 100 : Math.round(((total - overdue) / total) * 100);
    return { total, todayCount, due, overdue, highRisk, mine, missing, compliance };
  }, [assessments, residents, currentUserName, todayISO]);

  const filtered = useMemo(() => {
    return assessments.filter(a => {
      if (typeF !== "all" && a.type !== typeF) return false;
      if (cat !== "all") {
        const ts = ASSESSMENT_CATEGORIES.find(c => c.id === cat)?.types || [];
        if (!ts.includes(a.type)) return false;
      }
      if (statusF === "active" && !(a.status === "completed" && !a.supersededById)) return false;
      if (statusF === "due") { if (a.status !== "completed" || deriveStatus(a) !== "due") return false; }
      if (statusF === "overdue") { if (a.status !== "completed" || deriveStatus(a) !== "overdue") return false; }
      if (statusF === "draft" && a.status !== "draft" && a.status !== "in_progress") return false;
      if (statusF === "archived" && a.status !== "archived") return false;
      if (statusF === "deleted" && a.status !== "deleted") return false;
      if (search) {
        const s = search.toLowerCase();
        const r = residents.find(x => x.id === a.residentId);
        const name = r ? `${r.firstName} ${r.lastName}`.toLowerCase() : "";
        if (!name.includes(s) && !a.assessor.toLowerCase().includes(s) &&
            !assessmentMeta[a.type].name.toLowerCase().includes(s)) return false;
      }
      return true;
    }).sort((x, y) => y.date.localeCompare(x.date));
  }, [assessments, residents, typeF, cat, statusF, search]);

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-[1400px]">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assessment Centre</h1>
          <p className="text-sm text-muted-foreground mt-1">Cross-resident clinical assessment governance, triage and compliance.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/assessments/reassessment"><Button variant="outline"><RefreshCw className="h-4 w-4 mr-1.5" /> Reassessment Queue</Button></Link>
        </div>
      </div>

      {/* Dashboard widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
        <Stat icon={Activity} label="Total Assessments" value={dashboard.total} />
        <Stat icon={CheckCircle2} label="Completed Today" value={dashboard.todayCount} tone="success" />
        <Stat icon={Clock} label="Due (next 7d)" value={dashboard.due} tone="warning" />
        <Stat icon={AlertTriangle} label="Overdue" value={dashboard.overdue} tone={dashboard.overdue > 0 ? "destructive" : "default"} />
        <Stat icon={ShieldAlert} label="High Risk" value={dashboard.highRisk} tone={dashboard.highRisk > 0 ? "warning" : "default"} />
        <Stat icon={Users} label="Residents Missing" value={dashboard.missing} tone={dashboard.missing > 0 ? "warning" : "default"} />
        <Stat icon={UserPlus} label="My Assessments" value={dashboard.mine} tone="info" />
        <Stat icon={TrendingUp} label="Compliance %" value={`${dashboard.compliance}%`} tone={dashboard.compliance >= 90 ? "success" : "warning"} />
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input className="pl-8 h-9" placeholder="Search resident, assessor, or assessment type…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground mr-1">Status:</span>
            {(["active", "due", "overdue", "draft", "archived", "deleted", "all"] as const).map(s => (
              <Button key={s} size="sm" variant={statusF === s ? "default" : "outline"} className="capitalize" onClick={() => setStatusF(s)}>{s}</Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground mr-1">Category:</span>
            <Button size="sm" variant={cat === "all" ? "default" : "outline"} onClick={() => setCat("all")}>All</Button>
            {ASSESSMENT_CATEGORIES.map(c => (
              <Button key={c.id} size="sm" variant={cat === c.id ? "default" : "outline"} onClick={() => setCat(c.id)}>{c.label}</Button>
            ))}
          </div>
          {cat !== "all" && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-muted-foreground mr-1">Type:</span>
              <Button size="sm" variant={typeF === "all" ? "default" : "outline"} onClick={() => setTypeF("all")}>All</Button>
              {(ASSESSMENT_CATEGORIES.find(c2 => c2.id === cat)?.types || []).map(t => (
                <Button key={t} size="sm" variant={typeF === t ? "default" : "outline"} onClick={() => setTypeF(t)}>{assessmentMeta[t].name}</Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{filtered.length} assessment{filtered.length !== 1 ? "s" : ""}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Resident</th>
                  <th className="text-left p-3">Assessment</th>
                  <th className="text-left p-3">Score</th>
                  <th className="text-left p-3">Risk</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Completed By</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Next</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.slice(0, 200).map(a => {
                  const r = residents.find(x => x.id === a.residentId);
                  const ds = deriveStatus(a);
                  return (
                    <tr key={a.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <Link to="/residents/$id/assessments" params={{ id: a.residentId }} className="font-medium hover:text-primary">
                          {r?.firstName} {r?.lastName}
                        </Link>
                        <div className="text-xs text-muted-foreground">Room {r?.roomNumber}</div>
                      </td>
                      <td className="p-3">
                        <Link to="/assessments/$assessmentId" params={{ assessmentId: a.id }} className="font-medium hover:text-primary inline-flex items-center gap-1.5">
                          {a.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                          {assessmentMeta[a.type].name}
                        </Link>
                      </td>
                      <td className="p-3 tabular-nums font-semibold">{a.totalScore}</td>
                      <td className="p-3"><Badge variant="outline" className={`text-[10px] ${riskBadgeCls(a.riskLevel)}`}>{a.interpretation}</Badge></td>
                      <td className="p-3"><Badge variant="outline" className={`text-[10px] capitalize ${statusBadgeCls(ds)}`}>{ds}</Badge></td>
                      <td className="p-3 text-xs">{a.assessor}<br /><span className="text-muted-foreground capitalize">{a.assessorRole}</span></td>
                      <td className="p-3 text-xs">{a.date.slice(0, 10)}</td>
                      <td className="p-3 text-xs">{a.nextReassessmentDate || "—"}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">No assessments match.</td></tr>
                )}
              </tbody>
            </table>
            {filtered.length > 200 && (
              <div className="p-3 text-xs text-muted-foreground text-center">Showing first 200 of {filtered.length}. Refine filters to narrow.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {can(currentRole, "assessment.create") && (
        <Card>
          <CardHeader><CardTitle className="text-base">Start a New Assessment</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Pick a resident to begin:</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {residents.map(r => (
                <Link key={r.id} to="/residents/$id/assessments" params={{ id: r.id }} className="border rounded-lg p-3 hover:bg-accent/40 transition">
                  <div className="font-medium text-sm">{r.firstName} {r.lastName}</div>
                  <div className="text-xs text-muted-foreground">Room {r.roomNumber}</div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
