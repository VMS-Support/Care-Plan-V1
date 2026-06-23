import { createFileRoute, Link } from "@tanstack/react-router";
import { useCare, age } from "@/lib/care/store";
import { isActionRequiredAlert } from "@/lib/care/alerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  AlertTriangle,
  ClipboardList,
  Stethoscope,
  Activity,
  HeartPulse,
  NotebookPen,
  ArrowRight,
  Plus,
  FileText,
  TrendingUp,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — NuCare" }] }),
  component: Dashboard,
});

function Stat({
  icon: Icon,
  label,
  value,
  tone = "default",
  hint,
}: {
  icon: any;
  label: string;
  value: string | number;
  tone?: "default" | "warning" | "destructive" | "success" | "info";
  hint?: string;
}) {
  const tones: Record<string, string> = {
    default: "bg-secondary text-secondary-foreground",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {label}
            </div>
            <div className="text-3xl font-semibold mt-2 tabular-nums">{value}</div>
            {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { residents, assessments, carePlans, alerts, notes, tasks } = useCare();
  const active = residents.filter((r) => r.status === "active");
  const highRisk = residents.filter((r) =>
    assessments.some(
      (a) => a.residentId === r.id && (a.riskLevel === "high" || a.riskLevel === "very_high"),
    ),
  );
  const openAlerts = alerts.filter(
    (a) => isActionRequiredAlert(a) && !a.acknowledged && !a.resolvedAt,
  );
  const today = new Date();
  const dueReviews = carePlans.filter(
    (c) =>
      c.status === "active" && new Date(c.reviewDate) <= new Date(today.getTime() + 7 * 86400000),
  );
  const todayKey = today.toISOString().slice(0, 10);
  const tasksOverdue = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "deleted" && t.dueDate.slice(0, 10) < todayKey,
  ).length;
  const tasksDueToday = tasks.filter(
    (t) =>
      t.status !== "completed" && t.status !== "deleted" && t.dueDate.slice(0, 10) === todayKey,
  ).length;

  // Trend chart: average Waterlow over time per assessment date
  const waterlowSorted = [...assessments]
    .filter((a) => a.type === "waterlow")
    .sort((a, b) => a.date.localeCompare(b.date));
  const trendData = waterlowSorted.map((a, i) => ({
    idx: i + 1,
    score: a.totalScore,
    date: a.date.slice(5, 10),
  }));

  const recentNotes = notes.slice(0, 5);
  const recentAlerts = openAlerts.slice(0, 5);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Good day, Nurse Roberts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of resident wellbeing across the home.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/residents">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1.5" /> New Resident
            </Button>
          </Link>
          <Link to="/assessments">
            <Button variant="outline" size="sm">
              <Stethoscope className="h-4 w-4 mr-1.5" /> New Assessment
            </Button>
          </Link>
          <Link to="/care-plans">
            <Button variant="outline" size="sm">
              <ClipboardList className="h-4 w-4 mr-1.5" /> New Care Plan
            </Button>
          </Link>
          <Link to="/daily-notes">
            <Button size="sm">
              <NotebookPen className="h-4 w-4 mr-1.5" /> Daily Note
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          icon={Users}
          label="Current Residents"
          value={active.length}
          hint={`${residents.length} total`}
        />
        <Stat
          icon={AlertTriangle}
          label="High Risk Residents"
          value={highRisk.length}
          tone="warning"
        />
        <Stat icon={ClipboardList} label="Reviews Due (7d)" value={dueReviews.length} tone="info" />
        <Stat
          icon={Activity}
          label="Open Alerts"
          value={openAlerts.length}
          tone="destructive"
          hint={`${openAlerts.filter((a) => a.priority === "critical").length} critical`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Waterlow Risk Trend</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pressure ulcer risk across recent assessments
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" /> Live
            </Badge>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="var(--color-muted-foreground)"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAlerts.length === 0 && (
              <p className="text-sm text-muted-foreground">No open alerts.</p>
            )}
            {recentAlerts.map((a) => {
              const r = residents.find((x) => x.id === a.residentId);
              const tone =
                a.priority === "critical"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : a.priority === "high"
                    ? "bg-warning/15 text-warning-foreground border-warning/30"
                    : "bg-info/10 text-info border-info/20";
              return (
                <div key={a.id} className={`rounded-md border p-2.5 text-sm ${tone}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{a.title}</div>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {a.priority}
                    </Badge>
                  </div>
                  <div className="text-xs opacity-80 mt-1">
                    {r?.firstName} {r?.lastName} · Room {r?.roomNumber}
                  </div>
                </div>
              );
            })}
            <Link
              to="/alerts"
              className="text-xs text-primary hover:underline inline-flex items-center"
            >
              View all <ArrowRight className="h-3 w-3 ml-0.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link to="/tasks" className="block lg:col-span-1">
          <Card className="h-full hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-base">Tasks Requiring Attention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md border p-2">
                <span>Overdue</span>
                <span className="font-semibold text-destructive tabular-nums">{tasksOverdue}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-2">
                <span>Due Today</span>
                <span className="font-semibold text-warning-foreground tabular-nums">
                  {tasksDueToday}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Daily Notes</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {recentNotes.map((n) => {
              const r = residents.find((x) => x.id === n.residentId);
              return (
                <div key={n.id} className="py-2.5 flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-secondary">
                      {r?.firstName[0]}
                      {r?.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {r?.firstName} {r?.lastName}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {n.shift}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{n.staff}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{n.observation}</p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {n.date.slice(0, 10)}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dueReviews.slice(0, 6).map((c) => {
              const r = residents.find((x) => x.id === c.residentId);
              return (
                <div key={c.id} className="rounded-md border p-2.5">
                  <div className="text-sm font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {r?.firstName} {r?.lastName} · Due {c.reviewDate}
                  </div>
                </div>
              );
            })}
            {dueReviews.length === 0 && (
              <p className="text-sm text-muted-foreground">No reviews due in the next 7 days.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
