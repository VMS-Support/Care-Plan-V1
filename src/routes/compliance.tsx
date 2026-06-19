import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, ClipboardCheck, FileWarning, CheckCircle2, Activity } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/compliance")({
  head: () => ({ meta: [{ title: "Care Plan Compliance — CarePath" }] }),
  component: ComplianceDashboard,
});

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

function ComplianceDashboard() {
  const { currentRole, residents, carePlans, carePlanEvaluations, assessments, interventionLogs } = useCare();

  const hasAccess = can(currentRole, "compliance.view");
  const today = new Date();

  const stats = useMemo(() => {
    const active = carePlans.filter(c => c.status === "active");
    const overdueReviews = active.filter(c => new Date(c.reviewDate) < today);
    const overdueEvals = active.filter(c => c.evaluationDate && new Date(c.evaluationDate) < today);
    const noPlan = residents.filter(r => !carePlans.some(c => c.residentId === r.id && c.status === "active"));
    const highRisk = residents.filter(r => carePlans.some(c => c.residentId === r.id && c.status === "active" && (c.priority === "high" || c.priority === "critical")));
    const critical = residents.filter(r => carePlans.some(c => c.residentId === r.id && c.status === "active" && c.priority === "critical"));
    const compliantPct = active.length === 0 ? 100 : Math.round(((active.length - overdueReviews.length) / active.length) * 100);

    // Assessment → Care plan conversion
    const completedAssessments = assessments.filter(a => a.status === "completed" && (a.riskLevel === "high" || a.riskLevel === "very_high"));
    const converted = completedAssessments.filter(a => carePlans.some(c => c.linkedAssessmentId === a.id || c.residentId === a.residentId));
    const conversionRate = completedAssessments.length === 0 ? 100 : Math.round((converted.length / completedAssessments.length) * 100);

    // Goal achievement
    const goalsMet = carePlanEvaluations.filter(e => e.goalsMet === "yes").length;
    const goalsPartial = carePlanEvaluations.filter(e => e.goalsMet === "partially").length;
    const goalsNo = carePlanEvaluations.filter(e => e.goalsMet === "no").length;
    const totalEvals = goalsMet + goalsPartial + goalsNo;
    const goalAchievementRate = totalEvals === 0 ? 0 : Math.round((goalsMet / totalEvals) * 100);

    // Intervention compliance across all logs
    const logsCompleted = interventionLogs.filter(l => l.outcome === "completed").length;
    const logsPartial = interventionLogs.filter(l => l.outcome === "partially_completed").length;
    const logsMissed = interventionLogs.filter(l => l.outcome === "missed").length;
    const logsRefused = interventionLogs.filter(l => l.outcome === "refused").length;
    const interventionCompliancePct = interventionLogs.length === 0 ? 0
      : Math.round(((logsCompleted + logsPartial * 0.5) / interventionLogs.length) * 100);

    return {
      active, overdueReviews, overdueEvals, noPlan, highRisk, critical,
      compliantPct, conversionRate, goalAchievementRate,
      goalsMet, goalsPartial, goalsNo,
      interventionCompliancePct, logsTotal: interventionLogs.length,
      logsCompleted, logsPartial, logsMissed, logsRefused,
    };
  }, [carePlans, residents, carePlanEvaluations, assessments, interventionLogs]);

  if (!hasAccess) {
    return <div className="p-8"><Card><CardContent className="p-8 text-center text-muted-foreground">You don't have access to the compliance dashboard.</CardContent></Card></div>;
  }

  const goalData = [
    { name: "Achieved", value: stats.goalsMet, color: "hsl(142 70% 45%)" },
    { name: "Partial", value: stats.goalsPartial, color: "hsl(45 90% 55%)" },
    { name: "Not met", value: stats.goalsNo, color: "hsl(0 75% 55%)" },
  ].filter(d => d.value > 0);

  const planCategoryData = Object.entries(
    stats.active.reduce<Record<string, number>>((acc, p) => { const k = p.category || "Other"; acc[k] = (acc[k] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Care Plan Compliance</h1>
        <p className="text-sm text-muted-foreground mt-1">Governance overview for CNMs and DON</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase text-muted-foreground">Active Care Plans</div>
          <div className="text-3xl font-semibold mt-1 tabular-nums">{stats.active.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-destructive" /> Overdue Reviews</div>
          <div className="text-3xl font-semibold mt-1 tabular-nums text-destructive">{stats.overdueReviews.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase text-muted-foreground">Overdue Evaluations</div>
          <div className="text-3xl font-semibold mt-1 tabular-nums text-warning-foreground">{stats.overdueEvals.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase text-muted-foreground">Residents without Plan</div>
          <div className="text-3xl font-semibold mt-1 tabular-nums">{stats.noPlan.length}</div>
        </CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Care Plan Compliance</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold tabular-nums">{stats.compliantPct}%</div>
            <Progress value={stats.compliantPct} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Active plans within review window</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Assessment → Care Plan</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold tabular-nums">{stats.conversionRate}%</div>
            <Progress value={stats.conversionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">High-risk assessments converted to plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> Goal Achievement</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold tabular-nums">{stats.goalAchievementRate}%</div>
            <Progress value={stats.goalAchievementRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Goals fully met in evaluations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Intervention Delivery</CardTitle></CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold tabular-nums">{stats.interventionCompliancePct}%</div>
            <Progress value={stats.interventionCompliancePct} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.logsCompleted} done · {stats.logsPartial} partial · {stats.logsMissed} missed · {stats.logsRefused} refused
              {stats.logsTotal === 0 && " (no logs yet)"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Goal Outcomes</CardTitle></CardHeader>
          <CardContent className="h-64">
            {goalData.length === 0 ? <p className="text-sm text-muted-foreground">No evaluations recorded yet.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={goalData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {goalData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Active Plans by Category</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planCategoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileWarning className="h-4 w-4 text-destructive" /> Action Required</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Overdue Reviews ({stats.overdueReviews.length})</h4>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {stats.overdueReviews.map(p => {
                const r = residents.find(x => x.id === p.residentId);
                return (
                  <Link key={p.id} to="/care-plans/$id" params={{ id: p.id }} className="block border rounded-md p-2 text-sm hover:bg-muted/50">
                    <div className="flex justify-between">
                      <span className="font-medium">{p.title}</span>
                      <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Due {p.reviewDate}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{r?.firstName} {r?.lastName}</span>
                  </Link>
                );
              })}
              {stats.overdueReviews.length === 0 && <p className="text-xs text-muted-foreground">None.</p>}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Residents without Active Care Plan ({stats.noPlan.length})</h4>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {stats.noPlan.map(r => (
                <Link key={r.id} to="/residents/$id" params={{ id: r.id }} className="block border rounded-md p-2 text-sm hover:bg-muted/50">
                  <div className="font-medium">{r.firstName} {r.lastName}</div>
                  <span className="text-xs text-muted-foreground">Room {r.roomNumber} · {r.primaryDiagnosis}</span>
                </Link>
              ))}
              {stats.noPlan.length === 0 && <p className="text-xs text-muted-foreground">All residents have an active plan.</p>}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">High-Risk Care Plans ({stats.highRisk.length})</h4>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {stats.highRisk.map(r => (
                <Link key={r.id} to="/residents/$id" params={{ id: r.id }} className="block border rounded-md p-2 text-sm hover:bg-muted/50">
                  <div className="font-medium">{r.firstName} {r.lastName}</div>
                  <span className="text-xs text-muted-foreground">Room {r.roomNumber}</span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Critical Risks ({stats.critical.length})</h4>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {stats.critical.map(r => (
                <Link key={r.id} to="/residents/$id" params={{ id: r.id }} className="block border rounded-md p-2 text-sm hover:bg-muted/50 border-destructive/30">
                  <div className="font-medium">{r.firstName} {r.lastName}</div>
                  <span className="text-xs text-muted-foreground">Room {r.roomNumber}</span>
                </Link>
              ))}
              {stats.critical.length === 0 && <p className="text-xs text-muted-foreground">No critical-priority plans.</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
