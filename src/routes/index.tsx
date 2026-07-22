import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCare, age } from "@/lib/care/store";
import { isActionableClinicalAlert, isActionRequiredAlert } from "@/lib/care/alerts";
import { complianceForResident } from "@/lib/care/vitals";
import { getDonDashboard, type DonDashboardMetric } from "@/domain/dashboards/don/donDashboardReadModel";
import {
  endOfCurrentShift,
  getUpcomingScheduledInterventions,
  scheduledInterventionLabel,
  type ScheduledIntervention,
  type ScheduledInterventionStatus,
} from "@/lib/care/intervention-schedule";
import type { CarePlanProblem, Resident, UserProfile } from "@/lib/care/types";
import type { Role, Task } from "@/lib/care/types";
import { RecordObservationFlow } from "@/components/care/RecordObservationFlow";
import { IncidentDialog } from "@/components/care/IncidentDialog";
import { CreateCarePlanDialog } from "@/components/care/CreateCarePlanDialog";
import { RecordDailyCareDialog } from "@/components/dailyCare/RecordDailyCareDialog";
import { HcaEscalateToNurseDialog } from "@/components/dailyCare/HcaEscalateToNurse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Users,
  AlertTriangle,
  ClipboardList,
  Stethoscope,
  Activity,
  HeartPulse,
  NotebookPen,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Plus,
  FileText,
  TrendingUp,
  Bed,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Home,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  TrendingDown,
  Bell,
  CalendarDays,
  Clock,
  Euro,
  GraduationCap,
  MessageCircle,
  Pill,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  Wrench,
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
import { toast } from "sonner";

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

type DetailItem = { title: string; meta?: string; href?: string };
type DetailPayload = { title: string; description?: string; items: DetailItem[] };

function RoleSpecificDashboard({ role }: { role: UserProfile["role"] }) {
  if (role === "group_owner") return <EnterpriseOverviewDashboard />;
  if (role === "don") return <DonDashboard />;
  if (role === "cnm") return <CnmDashboard />;
  if (role === "doctor") return <DoctorDashboard />;
  if (role === "nurse") return <NurseDashboard />;
  return <HcaDashboard />;
}

function useRoleDashboardData(
  scope: "home" | "assigned" = "home",
  options: { date?: string; now?: Date; wingId?: string } = {},
) {
  const care = useCare();
  const now = options.now || new Date();
  const today = options.date || now.toISOString().slice(0, 10);
  const selectedDay = new Date(`${today}T12:00:00`);
  const weekStartDate = new Date(selectedDay);
  weekStartDate.setDate(weekStartDate.getDate() - 6);
  const weekStart = weekStartDate.toISOString().slice(0, 10);
  const monthStart = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), 1).toISOString().slice(0, 10);
  const residents = care.residents.filter((r) => r.status !== "deleted" && (!options.wingId || r.wingId === options.wingId));
  const assignedWings = care.currentUser.assignedWings || [];
  const scopedResidents =
    scope === "home" || care.currentUser.role === "don" || care.currentUser.role === "group_owner" || assignedWings.length === 0
      ? residents
      : residents.filter((r) => r.wingId && assignedWings.includes(r.wingId));
  const residentIds = new Set(scopedResidents.map((r) => r.id));
  const activeResidents = scopedResidents.filter((r) => r.status === "active");
  const activeResidentIds = new Set(activeResidents.map((r) => r.id));
  const myName = care.currentUser.name.toLowerCase();
  const myResidents = activeResidents.filter((r) => {
    const workers = [r.keyWorkers?.namedNurse, r.keyWorkers?.namedCarer, r.keyWorkers?.keyWorker]
      .filter(Boolean)
      .map((name) => String(name).toLowerCase());
    return workers.includes(myName) || assignedWings.length === 0;
  });
  const myResidentIds = new Set(myResidents.map((r) => r.id));
  const assessments = care.assessments.filter((a) => residentIds.has(a.residentId));
  const dueAssessments = assessments.filter((a) => ["draft", "in_progress", "review_due"].includes(a.status));
  const problems = care.carePlanProblems.filter((p) => residentIds.has(p.residentId));
  const activeProblems = problems.filter((p) => p.status === "active");
  const dueCarePlans = activeProblems.filter((p) => p.reviewDate <= today || p.evaluationDate <= today);
  const interventions = care.problemInterventions.filter((i) => residentIds.has(i.residentId));
  const logs = care.problemInterventionLogs.filter((l) => residentIds.has(l.residentId));
  const scheduled = getUpcomingScheduledInterventions(interventions, logs, problems, now, {
    residentIds,
    currentUser: care.currentUser,
    until: endOfCurrentShift(now),
  });
  const scheduledDue = scheduled.filter((s) =>
    ["overdue", "due_now", "due_next_hour", "due_today"].includes(s.status),
  );
  const completedToday = logs.filter((l) => l.date === today && l.outcome === "completed").length;
  const completedWeek = logs.filter((l) => l.date >= weekStart && l.outcome === "completed").length;
  const alerts = care.alerts.filter(
    (a) => residentIds.has(a.residentId) && isActionRequiredAlert(a) && !a.acknowledged && !a.resolvedAt,
  );
  const clinicalAlerts = care.clinicalAlerts.filter(
    (a) => residentIds.has(a.residentId) && !a.dismissedAt && !a.resolvedAt,
  );
  const incidents = care.incidents.filter((i) => residentIds.has(i.residentId));
  const visitors = care.visitors.filter((v) => residentIds.has(v.residentId));
  const outings = care.outings.filter((o) => residentIds.has(o.residentId));
  const handovers = care.handovers.filter((h) => residentIds.has(h.residentId));
  const tasks = care.tasks.filter((t) => (!t.residentId || residentIds.has(t.residentId)) && t.status !== "deleted");
  const vitals = care.vitals.filter((v) => residentIds.has(v.residentId));
  const observationPlans = care.observationPlans.filter((p) => residentIds.has(p.residentId));
  const highRiskResidents = scopedResidents.filter((r) =>
    assessments.some((a) => a.residentId === r.id && (a.riskLevel === "high" || a.riskLevel === "very_high")),
  );
  const residentFor = (id?: string) => residents.find((r) => r.id === id);
  const residentItems = (items: Resident[]) =>
    items.map((r) => ({ title: rdName(r), meta: `Room ${r.roomNumber}`, href: `/residents/${r.id}` }));
  const activitySince = (start: string) => ({
    admissions: scopedResidents.filter((r) => r.admissionDate >= start).length,
    discharges: scopedResidents.filter((r) => r.status === "discharged").length,
    assessments: assessments.filter((a) => a.date.slice(0, 10) >= start && a.status === "completed").length,
    carePlans: problems.filter((p) => p.createdAt.slice(0, 10) >= start).length,
    incidents: incidents.filter((i) => i.date >= start).length,
    interventions: logs.filter((l) => l.date >= start && l.outcome === "completed").length,
    vitals: vitals.filter((v) => v.date >= start).length,
  });
  return {
    care,
    today,
    weekStart,
    monthStart,
    residents: scopedResidents,
    allResidents: residents,
    activeResidents,
    activeResidentIds,
    myResidents,
    myResidentIds,
    assessments,
    dueAssessments,
    problems,
    activeProblems,
    dueCarePlans,
    scheduled,
    scheduledDue,
    completedToday,
    completedWeek,
    alerts,
    clinicalAlerts,
    incidents,
    visitors,
    outings,
    handovers,
    tasks,
    vitals,
    observationPlans,
    highRiskResidents,
    residentFor,
    residentItems,
    activitySince,
  };
}

function RolePage({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { currentUser, activeFacility } = useCare();
  return (
    <div className="p-4 md:p-8 space-y-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Good day, {currentUser.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{title} - {subtitle}</p>
        </div>
        <Badge variant="outline" className="w-fit">{activeFacility.name}</Badge>
      </div>
      {children}
    </div>
  );
}

function RoleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function RoleMetric({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
  href,
  onClick,
}: {
  icon: any;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warn" | "danger" | "good" | "info";
  href?: string;
  onClick?: () => void;
}) {
  const toneCls = {
    default: "bg-secondary text-secondary-foreground",
    warn: "bg-warning/15 text-warning-foreground",
    danger: "bg-destructive/10 text-destructive",
    good: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
  }[tone];
  const card = (
    <Card className="h-full hover:border-primary/40 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
            <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
            {hint && <div className="text-xs text-muted-foreground mt-1 truncate">{hint}</div>}
          </div>
          <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${toneCls}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  if (href) return <Link to={href as any}>{card}</Link>;
  return <button type="button" className="text-left w-full h-full" onClick={onClick}>{card}</button>;
}

function RoleDetails({ detail, onClose }: { detail: DetailPayload | null; onClose: () => void }) {
  return (
    <Dialog open={!!detail} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{detail?.title}</DialogTitle>
          {detail?.description && <DialogDescription>{detail.description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {detail?.items.length === 0 && <p className="text-sm text-muted-foreground">No records to show.</p>}
          {detail?.items.map((item, index) => {
            const body = (
              <div className="rounded-md border p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{item.title}</div>
                  {item.meta && <div className="text-xs text-muted-foreground mt-0.5">{item.meta}</div>}
                </div>
                {item.href && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              </div>
            );
            return item.href ? <Link key={index} to={item.href as any}>{body}</Link> : <div key={index}>{body}</div>;
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RoleList({ title, empty, items, href }: { title: string; empty: string; items: DetailItem[]; href?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          {title}
          {href && <Link to={href as any} className="text-xs text-primary hover:underline">Open</Link>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">{empty}</p>}
        {items.slice(0, 6).map((item, index) => (
          <Link key={index} to={(item.href || href || "/") as any} className="block rounded-md border p-2.5 hover:bg-muted/40">
            <div className="text-sm font-medium">{item.title}</div>
            {item.meta && <div className="text-xs text-muted-foreground mt-0.5">{item.meta}</div>}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function EnterpriseOverviewDashboard() {
  return (
    <div className="min-h-full bg-[#f5f8fc] p-4 text-[#071832] md:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-[28px] font-bold tracking-tight">Enterprise Overview</h1>
            <div className="h-7 w-px bg-slate-300" />
            <span className="text-sm font-semibold">All Care Homes</span>
          </div>
          <div className="mt-7">
            <p className="text-base font-bold">Good morning, Brian</p>
            <p className="mt-1 text-sm text-[#536176]">Here is your enterprise overview summary.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button className="flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold shadow-sm">
            <CalendarDays className="h-4 w-4" />
            20 May 2025
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span>Compare to:</span>
            <button className="h-10 rounded-lg bg-white px-4 font-semibold shadow-sm">Last Month</button>
          </div>
          <button className="flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold shadow-sm">
            <Gauge className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7">
        <EnterpriseMetric icon={Home} title="Care Homes" value="8" sub="Active Homes" tone="purple" />
        <EnterpriseMetric icon={Users} title="Occupancy" value="92.3%" sub="vs 91.0% last month" tone="blue" trend />
        <EnterpriseMetric icon={ShieldCheck} title="Clinical Quality Score" value="91%" sub="vs 88% last month" tone="green" trend />
        <EnterpriseMetric icon={Pill} title="Medication Compliance" value="98.6%" sub="vs 97.2% last month" tone="purple" trend />
        <EnterpriseMetric icon={Users} title="Staffing (Safe)" value="89%" sub="vs 86% last month" tone="orange" trend />
        <EnterpriseMetric icon={Shield} title="HIQA Readiness" value="93%" sub="vs 91% last month" tone="teal" trend />
        <EnterpriseMetric icon={Bell} title="Group Alerts" value="12" sub="Require Attention" tone="red" danger />
      </section>

      <section className="mb-4 grid gap-3 2xl:grid-cols-[1fr_320px]">
        <EnterprisePanel title="Performance Overview" action="View All Metrics">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            <EnterpriseRing title="Occupancy" value="92%" label="Group Average" tone="blue" percent={92} />
            <EnterpriseRing title="Clinical Quality" value="91%" label="Group Average" tone="green" percent={91} />
            <EnterpriseRing title="Medication Compliance" value="99%" label="Group Average" tone="purple" percent={99} />
            <EnterpriseRing title="Staffing (Safe)" value="89%" label="Group Average" tone="orange" percent={89} />
            <EnterpriseRing title="Care Plan Completion" value="93%" label="Group Average" tone="teal" percent={93} />
            <EnterpriseRing title="Incident Rate" value="1.2" label="Per 1000 Bed Days" tone="red" percent={76} />
          </div>
        </EnterprisePanel>
        <EnterprisePanel title="Alerts Summary" action="View All">
          <div className="space-y-3">
            <EnterpriseAlert icon={AlertTriangle} label="High Priority" value="5" tone="red" />
            <EnterpriseAlert icon={Pill} label="Medication Alerts" value="3" tone="purple" />
            <EnterpriseAlert icon={Users} label="Staffing Alerts" value="2" tone="orange" />
            <EnterpriseAlert icon={Shield} label="Compliance Alerts" value="1" tone="teal" />
            <EnterpriseAlert icon={Wrench} label="Maintenance Alerts" value="1" tone="blue" />
          </div>
          <div className="mt-4 flex justify-between border-t pt-3 text-sm font-bold">
            <span>Total Alerts</span>
            <span className="text-[#e22d35]">12</span>
          </div>
        </EnterprisePanel>
      </section>

      <section className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-[1.35fr_0.75fr_1.15fr]">
        <EnterprisePanel title="Care Homes Performance" action="View All">
          <EnterpriseCareHomeTable />
        </EnterprisePanel>

        <div className="space-y-3">
          <EnterprisePanel title="Top Alert Categories" action="View All">
            <div className="grid gap-4 md:grid-cols-[150px_1fr]">
              <EnterpriseDonut value="12" label="Total" colors={["#7b3fd6", "#f59b21", "#e22d35", "#1aa6b0", "#1f70d6"]} />
              <div className="space-y-3 text-sm">
                <EnterpriseLegend label="Medication" value="3" tone="purple" />
                <EnterpriseLegend label="Staffing" value="2" tone="orange" />
                <EnterpriseLegend label="Clinical" value="5" tone="red" />
                <EnterpriseLegend label="Compliance" value="1" tone="teal" />
                <EnterpriseLegend label="Maintenance" value="1" tone="blue" />
              </div>
            </div>
          </EnterprisePanel>
          <EnterprisePanel title="Incident Rate" subtitle="(Per 1000 Bed Days)" action="View Report">
            <EnterpriseIncidentBars />
          </EnterprisePanel>
        </div>

        <div className="space-y-3">
          <EnterprisePanel title="Financial Overview (MTD)" action="View Report">
            <EnterpriseFinancialGrid />
          </EnterprisePanel>
          <EnterprisePanel title="Trend Summary" subtitle="(vs Last Month)">
            <EnterpriseTrendSummary />
          </EnterprisePanel>
        </div>
      </section>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#536176]">
        <span>Data last refreshed: 20 May 2025 08:30</span>
        <span className="text-base">↻</span>
      </div>
    </div>
  );
}

function EnterpriseMetric({
  icon: Icon,
  title,
  value,
  sub,
  tone,
  trend,
  danger,
}: {
  icon: any;
  title: string;
  value: string;
  sub: string;
  tone: string;
  trend?: boolean;
  danger?: boolean;
}) {
  const color = enterpriseTone(tone);
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-full" style={{ backgroundColor: `${color}12`, color }}>
          <Icon className="h-8 w-8" />
        </div>
        <div>
          <div className="text-xs font-bold">{title}</div>
          <div className="mt-1 text-2xl font-bold">{value}</div>
          <div className={`mt-2 text-xs ${danger ? "font-semibold text-[#e22d35]" : "text-[#536176]"}`}>
            {sub} {trend && <ArrowUp className="inline h-3 w-3 text-[#1f9d55]" />}
          </div>
        </div>
      </div>
    </div>
  );
}

function EnterprisePanel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <h2 className="text-base font-bold">
          {title} {subtitle && <span className="text-xs font-medium text-[#536176]">{subtitle}</span>}
        </h2>
        {action && (
          <button className="flex items-center gap-1 text-xs font-semibold text-[#0b4f93]">
            {action} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function EnterpriseRing({ title, value, label, tone, percent }: { title: string; value: string; label: string; tone: string; percent: number }) {
  const color = enterpriseTone(tone);
  return (
    <div className="border-r last:border-r-0">
      <div className="mb-4 text-center text-sm font-semibold">{title}</div>
      <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full" style={{ background: `conic-gradient(${color} ${percent * 3.6}deg, #e8edf3 0deg)` }}>
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-2xl font-bold">{value}</div>
      </div>
      <div className="mt-3 text-center text-xs text-[#536176]">{label}</div>
    </div>
  );
}

function EnterpriseAlert({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) {
  const color = enterpriseTone(tone);
  return (
    <div className="flex items-center justify-between border-b pb-3 text-sm last:border-b-0">
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4" style={{ color }} />
        {label}
      </span>
      <span className="text-lg font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

function EnterpriseCareHomeTable() {
  const rows = [
    ["Orchard House", "96%", "94%", "99%", "92%", "2", "red"],
    ["Riverside Lodge", "91%", "90%", "98%", "88%", "1", "orange"],
    ["Greenfield Manor", "94%", "93%", "99%", "91%", "0", "slate"],
    ["Sunset Care Centre", "88%", "86%", "97%", "82%", "3", "red"],
    ["Meadow View", "93%", "92%", "99%", "90%", "1", "orange"],
    ["Maple House", "90%", "89%", "98%", "87%", "2", "red"],
    ["Briarwood House", "95%", "93%", "100%", "93%", "1", "orange"],
    ["Oakridge Care Home", "87%", "84%", "96%", "81%", "2", "red"],
  ];
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[760px] grid-cols-[1.6fr_repeat(5,0.7fr)] border-b pb-2 text-xs font-semibold text-[#536176]">
        <span>Care Home</span>
        <span>Occupancy</span>
        <span>Clinical Quality</span>
        <span>Med. Compliance</span>
        <span>Staffing (Safe)</span>
        <span>Alerts</span>
      </div>
      {rows.map(([home, occupancy, quality, med, staffing, alerts, tone], index) => (
        <div key={home} className="grid min-w-[760px] grid-cols-[1.6fr_repeat(5,0.7fr)] items-center border-b py-2 text-sm last:border-b-0">
          <span className="flex items-center gap-3">
            <Avatar className="h-8 w-8"><AvatarFallback className="bg-blue-100 text-[10px] text-blue-700">{index + 1}</AvatarFallback></Avatar>
            {home}
          </span>
          <Score value={occupancy} tone={Number.parseInt(occupancy) < 90 ? "orange" : "green"} />
          <Score value={quality} tone={Number.parseInt(quality) < 88 ? "red" : "green"} />
          <Score value={med} tone="green" />
          <Score value={staffing} tone={Number.parseInt(staffing) < 85 ? "red" : Number.parseInt(staffing) < 89 ? "orange" : "green"} />
          <span><Badge className={`${tone === "red" ? "bg-red-500" : tone === "orange" ? "bg-orange-400" : "bg-slate-100 text-slate-600"} hover:bg-current`}>{alerts}</Badge></span>
        </div>
      ))}
    </div>
  );
}

function Score({ value, tone }: { value: string; tone: string }) {
  const color = enterpriseTone(tone);
  return (
    <span className="flex items-center gap-2">
      <span className="h-4 w-4 rounded-full border-2" style={{ borderColor: color }} />
      <span className={tone === "red" ? "text-[#e22d35]" : tone === "orange" ? "text-[#f59b21]" : ""}>{value}</span>
    </span>
  );
}

function EnterpriseDonut({ value, label, colors }: { value: string; label: string; colors: string[] }) {
  const span = 360 / colors.length;
  const stops = colors.map((color, index) => `${color} ${index * span}deg ${(index + 1) * span}deg`).join(", ");
  return (
    <div className="flex justify-center">
      <div className="flex h-36 w-36 items-center justify-center rounded-full" style={{ background: `conic-gradient(${stops})` }}>
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs">{label}</div>
        </div>
      </div>
    </div>
  );
}

function EnterpriseLegend({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: enterpriseTone(tone) }} />{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function EnterpriseFinancialGrid() {
  const items = [
    [Euro, "Total Revenue", "€2.48M", "vs €2.32M last month", "green"],
    [Euro, "EBITDA", "€682K", "vs €612K last month", "green"],
    [TrendingUp, "Agency Spend", "€145K", "vs €132K last month", "red"],
    [Euro, "Occupancy Income", "€2.24M", "vs €1.68M last month", "green"],
    [Euro, "Operating Cost", "€1.80M", "vs €1.68M last month", "red"],
    [Users, "Net Profit", "€324K", "vs €287K last month", "green"],
  ] as const;
  return (
    <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(([Icon, label, value, meta, tone], index) => (
        <div key={label} className={`p-4 ${index < 3 ? "border-b" : ""} ${index % 3 !== 2 ? "border-r" : ""}`}>
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full" style={{ backgroundColor: `${enterpriseTone(tone)}14`, color: enterpriseTone(tone) }}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs">{label}</div>
              <div className="mt-1 text-xl font-bold">{value}</div>
              <div className="mt-1 text-[11px] text-[#536176]">{meta} {tone === "green" ? <ArrowUp className="inline h-3 w-3 text-[#1f9d55]" /> : <ArrowUp className="inline h-3 w-3 text-[#e22d35]" />}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EnterpriseIncidentBars() {
  const data = [
    ["Dec", 1.6],
    ["Jan", 1.5],
    ["Feb", 1.4],
    ["Mar", 1.3],
    ["Apr", 1.1],
    ["May", 1.2],
  ] as const;
  return (
    <div className="flex h-36 items-end justify-between gap-3 border-b px-3">
      {data.map(([label, value]) => (
        <div key={label} className="flex flex-1 flex-col items-center gap-2">
          <div className="text-xs font-bold">{value}</div>
          <div className="w-8 rounded-t bg-[#1f70d6]" style={{ height: `${value * 48}px` }} />
          <div className="text-xs text-[#536176]">{label}</div>
        </div>
      ))}
    </div>
  );
}

function EnterpriseTrendSummary() {
  const items = [
    [TrendingUp, "Occupancy", "+1.3%", "green"],
    [TrendingUp, "Clinical Quality", "+3%", "green"],
    [Pill, "Med. Compliance", "+1.4%", "purple"],
    [Users, "Staffing (Safe)", "+3%", "orange"],
    [TrendingDown, "Incident Rate", "-0.1", "red"],
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
      {items.map(([Icon, label, value, tone]) => (
        <div key={label} className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ backgroundColor: `${enterpriseTone(tone)}12`, color: enterpriseTone(tone) }}>
            <Icon className="h-7 w-7" />
          </div>
          <div className="mt-3 text-xs">{label}</div>
          <div className={`mt-3 text-lg font-bold ${tone === "red" ? "text-[#e22d35]" : "text-[#1f9d55]"}`}>
            {tone === "red" ? <ArrowDown className="inline h-4 w-4" /> : <ArrowUp className="inline h-4 w-4" />} {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function enterpriseTone(tone: string) {
  const tones: Record<string, string> = {
    blue: "#1f70d6",
    green: "#2ea85b",
    purple: "#7b3fd6",
    orange: "#f59b21",
    teal: "#18a6b0",
    red: "#e22d35",
    slate: "#e8edf3",
  };
  return tones[tone] || tones.blue;
}

function DonDashboard() {
  const care = useCare();
  const { currentUser, activeFacility, setActiveFacilityId } = care;
  const [reportingDate, setReportingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clock, setClock] = useState(() => new Date());
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const dashboard = useMemo(
    () => getDonDashboard({ care, reportingDate, generatedAt: lastRefreshedAt.toISOString() }),
    [care, reportingDate, lastRefreshedAt],
  );
  const firstName = currentUser.name.split(" ")[0] || "there";
  const dateLabel = formatDonDate(reportingDate);
  const timeLabel = clock.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
  const refresh = () => {
    setRefreshing(true);
    setLastRefreshedAt(new Date());
    window.setTimeout(() => setRefreshing(false), 250);
  };
  return (
    <div className="min-h-full bg-[#eef3f8] text-[#061a34]">
      <div className="bg-[#062a55] px-4 py-4 text-white md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-5">
            <h1 className="text-[24px] font-semibold tracking-tight">Director of Nursing Overview</h1>
            <div className="h-6 w-px bg-white/20" />
            <div className="flex items-center gap-2 text-sm">
              <span>{greetingFor(clock)}, {firstName}</span>
              <Sun className="h-7 w-7 text-[#ffb324]" strokeWidth={1.7} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Select value={activeFacility.id} onValueChange={setActiveFacilityId}>
              <SelectTrigger className="h-9 w-[190px] border-white/20 bg-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {care.facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>{facility.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex h-9 items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3">
              <CalendarDays className="h-4 w-4" />
              <input
                type="date"
                value={reportingDate}
                onChange={(event) => setReportingDate(event.target.value)}
                className="w-[132px] bg-transparent text-white outline-none [color-scheme:dark]"
                aria-label="Reporting date"
              />
            </label>
            <div className="h-6 w-px bg-white/20" />
            <div className="flex items-center gap-2"><Clock className="h-4 w-4" />{timeLabel}</div>
            <Button variant="ghost" size="sm" onClick={refresh} className="h-9 text-white hover:bg-white/10 hover:text-white">
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-3 md:p-4">
        <section className="rounded-[9px] bg-white shadow-[0_8px_18px_rgba(10,31,68,0.12)]">
          <div className="grid grid-cols-1 divide-y divide-[#e4e8ee] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-3 2xl:grid-cols-6">
            <DonTopMetric icon={Users} metric={dashboard.topMetrics.residents} />
            <DonTopMetric icon={Shield} metric={dashboard.topMetrics.clinicalRisk} />
            <DonTopMetric icon={Bell} metric={dashboard.topMetrics.outstandingAlerts} />
            <DonTopMetric icon={UserCheck} metric={dashboard.topMetrics.staffOnDuty} />
            <DonTopMetric icon={ShieldCheck} metric={dashboard.topMetrics.readiness} />
            <DonTopMetric icon={Activity} metric={dashboard.topMetrics.infectionStatus} />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <DonGaugeCard icon={Pill} metric={dashboard.complianceCards[0]} link="View Medication" />
          <DonGaugeCard icon={ClipboardList} metric={dashboard.complianceCards[1]} link="View Care Plans" />
          <DonGaugeCard icon={ShieldCheck} metric={dashboard.complianceCards[2]} link="View Assessments" />
          <DonGaugeCard icon={Users} metric={dashboard.complianceCards[3]} link="View Staffing" />
          <DonGaugeCard icon={GraduationCap} metric={dashboard.complianceCards[4]} link="View Training" />
          <DonGaugeCard icon={AlertTriangle} metric={dashboard.complianceCards[5]} link="View Incidents" />
          <DonGaugeCard icon={Wrench} metric={dashboard.complianceCards[6]} link="View Maintenance" />
          <DonGaugeCard icon={Activity} metric={dashboard.complianceCards[7]} link="View Infection Control" />
          <DonGaugeCard icon={FileText} metric={dashboard.complianceCards[8]} link="View Documentation" />
          <DonGaugeCard icon={Euro} metric={dashboard.complianceCards[9]} link="View Financials" />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <DonListCard icon={ClipboardList} title="Today's Priorities" rows={dashboard.priorities} />
          <DonListCard icon={AlertTriangle} title={`Incidents (${dateLabel})`} rows={dashboard.incidentsToday} />
          <DonListCard icon={UserCheck} title="Residents Requiring Attention" rows={dashboard.residentsRequiringAttention} />
          <DonListCard icon={MessageCircle} title="Communication" rows={dashboard.communication} />
          <div className="rounded-[8px] bg-white p-5 shadow-[0_8px_18px_rgba(10,31,68,0.08)]">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4edff] text-[#7c3aed]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-semibold">Operational Summary</h2>
            </div>
            <p className="text-sm leading-6 text-[#1f2f46]">{dashboard.briefing.status}</p>
            <p className="mt-2 text-sm leading-6 text-[#1f2f46]">{dashboard.briefing.attentionCount} item{dashboard.briefing.attentionCount === 1 ? "" : "s"} require review from configured sources.</p>
            <p className="mt-2 text-xs leading-5 text-[#66758a]">{dashboard.briefing.sourceNote}</p>
            <Link to="/reports" className="mt-10 flex items-center justify-between border-t border-[#edf0f4] pt-4 text-sm font-medium text-[#0b4f93]">
              View Full Briefing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <div className="flex items-center justify-center gap-2 pb-1 text-xs text-[#566477]">
          <span>Data refreshed: {formatDonDate(lastRefreshedAt.toISOString().slice(0, 10))} {lastRefreshedAt.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" })}</span>
          <RefreshCw className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

function DonTopMetric({
  icon: Icon,
  metric,
}: {
  icon: any;
  metric: DonDashboardMetric;
}) {
  const color = metric.tone === "green" ? "text-[#158a34]" : metric.tone === "red" ? "text-[#df2f32]" : metric.tone === "orange" ? "text-[#d97706]" : "text-[#174f91]";
  return (
    <Link to={metric.route as any} className="flex min-h-[130px] items-center gap-5 px-8 py-5 hover:bg-[#f8fbff]">
      <Icon className={`h-10 w-10 shrink-0 ${color}`} strokeWidth={metric.tone === "green" ? 2.8 : 2.4} />
      <div>
        <div className="text-xs font-medium text-[#061a34]">{metric.label}</div>
        <div className={`mt-2 text-[27px] font-bold leading-none ${color}`}>{metric.value}</div>
        <div className="mt-4 text-xs text-[#1f2f46]">{metric.helper}</div>
      </div>
    </Link>
  );
}

function DonGaugeCard({
  icon: Icon,
  metric,
  link,
}: {
  icon: any;
  metric: DonDashboardMetric;
  link: string;
}) {
  const color = metric.tone === "green" ? "#2fb064" : metric.tone === "orange" ? "#ff9815" : metric.tone === "red" ? "#e43737" : "#2e7bd2";
  const pale = metric.tone === "green" ? "#ddecdf" : metric.tone === "orange" ? "#f5dfc4" : metric.tone === "red" ? "#f0d5d5" : "#d7e5f4";
  const degrees = (metric.percentage ?? 0) * 3.6;
  return (
    <div className="rounded-[8px] bg-white shadow-[0_8px_18px_rgba(10,31,68,0.08)]">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-4">
          <Icon className="h-5 w-5 text-[#174f91]" />
          <h2 className="text-sm font-semibold">{metric.label}</h2>
        </div>
        <div className="mx-auto mt-6 flex h-32 w-32 items-center justify-center rounded-full" style={{ background: `conic-gradient(${color} ${degrees}deg, ${pale} 0deg)` }}>
          <div className={`flex h-[104px] w-[104px] items-center justify-center rounded-full bg-white px-3 text-center font-bold leading-tight text-[#0c1c36] ${metric.percentage === undefined ? "text-sm" : "text-[31px]"}`}>{metric.value}</div>
        </div>
        <div className={`mt-4 text-center text-xs ${metric.tone === "red" ? "text-[#b91c1c]" : "text-[#061a34]"}`}>{metric.helper}</div>
      </div>
      <Link to={metric.route as any} className="flex items-center justify-between border-t border-[#edf0f4] px-6 py-3 text-xs font-medium text-[#0b4f93]">
        {link} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function DonListCard({
  icon: Icon,
  title,
  rows,
}: {
  icon: any;
  title: string;
  rows: Array<{ label: string; value: string; tone?: "orange" | "red"; route: string; availability: string }>;
}) {
  return (
    <div className="rounded-[8px] bg-white p-5 shadow-[0_8px_18px_rgba(10,31,68,0.08)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eff6ff] text-[#174f91]">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <Link key={row.label} to={row.route as any} className="flex items-center justify-between gap-3 text-sm hover:text-[#0b4f93]">
            <span className="text-[#1f2f46]">{row.label}</span>
            {row.tone ? (
              <span className={`min-w-7 rounded px-2 py-0.5 text-center text-xs font-bold text-white ${row.tone === "red" ? "bg-[#e64242]" : "bg-[#ff9c1a]"}`}>{row.value}</span>
            ) : (
              <span className={`text-right font-bold ${row.availability === "available" ? "text-[#071832]" : "text-[#8a6470]"}`}>{row.value}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDonDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CnmDashboard() {
  const d = useRoleDashboardData("assigned");
  const incidentsOpen = d.incidents.filter((i) => i.status !== "closed" || i.followUpRequired);
  return (
    <RolePage title="CNM dashboard" subtitle="unit workload and shift oversight">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <RoleMetric icon={Users} label="Residents in My Unit" value={d.activeResidents.length} href="/residents" />
        <RoleMetric icon={UserCheck} label="Admissions Today" value={d.residents.filter((r) => r.admissionDate === d.today).length} href="/residents" tone="info" />
        <RoleMetric icon={ArrowRight} label="Discharges / Returns" value={d.residents.filter((r) => r.status === "discharged").length} href="/incidents" tone="warn" />
        <RoleMetric icon={ClipboardList} label="Care Plans Due" value={d.dueCarePlans.length} href="/care-plans" tone={d.dueCarePlans.length ? "warn" : "good"} />
        <RoleMetric icon={Stethoscope} label="Assessments Due" value={d.dueAssessments.length} href="/assessments" tone={d.dueAssessments.length ? "warn" : "good"} />
        <RoleMetric icon={Activity} label="Wounds Review" value={[...d.clinicalAlerts, ...d.alerts].filter((a) => /wound|pressure|skin/i.test(a.title)).length} href="/alerts" tone="warn" />
        <RoleMetric icon={HeartPulse} label="Deteriorating NEWS2" value={d.vitals.filter((v: any) => (v.news2Score || v.news2Total || 0) >= 5).length} href="/vitals" tone="danger" />
        <RoleMetric icon={ShieldAlert} label="Incident Follow-Up" value={incidentsOpen.length} href="/incidents" tone="warn" />
        <RoleMetric icon={Users} label="Staff Allocated" value={d.care.users.filter((u) => u.status === "active").length} />
        <RoleMetric icon={NotebookPen} label="Documentation" value={d.tasks.filter((t) => t.status !== "completed").length} href="/tasks" tone="warn" />
        <RoleMetric icon={FileText} label="Family Requests" value={d.visitors.filter((v) => v.date >= d.today).length} href="/visitors" />
        <RoleMetric icon={CheckCircle2} label="Task Completion" value={`${rdPct(d.tasks.filter((t) => t.status === "completed").length, d.tasks.length)}%`} href="/tasks" tone="good" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <RoleList title="Handover Alerts" empty="No handover alerts for this unit." href="/handovers" items={d.handovers.filter((h) => h.date >= d.today && h.status !== "closed").map((h) => ({ title: rdName(d.residentFor(h.residentId)), meta: `${h.shift} - ${h.summary}`, href: "/handovers" }))} />
        <RoleList title="Care Plans Due" empty="No care plans due today." href="/care-plans" items={d.dueCarePlans.map((p) => ({ title: rdName(d.residentFor(p.residentId)), meta: `${p.problemStatement} - review ${p.reviewDate}`, href: `/residents/${p.residentId}` }))} />
        <RoleList title="Falls Requiring Investigation" empty="No falls requiring investigation." href="/incidents" items={d.incidents.filter((i) => i.type === "fall" && i.status !== "closed").map((i) => ({ title: rdName(d.residentFor(i.residentId)), meta: `${i.date} - ${i.severity}`, href: "/incidents" }))} />
      </div>
    </RolePage>
  );
}

type WorkQueueFilter = "all" | "overdue" | "due_now" | "due_next_hour" | "due_today" | "alerts" | "documentation";
type WorkQueueItem = {
  id: string;
  residentId?: string;
  residentName: string;
  room: string;
  workType: string;
  title: string;
  dueLabel: string;
  dueAt?: Date;
  status: WorkQueueFilter;
  assignment?: string;
  href: string;
  tone: "danger" | "warn" | "info" | "default";
};

type NurseScheduleItem = {
  id: string;
  time: string;
  sortAt: number;
  windowStartAt?: number;
  title: string;
  meta: string;
  residentName: string;
  room: string;
  kind: string;
  icon: typeof Users;
  tone: string;
  href: string;
  details?: string[];
  status?: string;
  assignment?: string;
  count?: number;
  children?: NurseScheduleItem[];
  dismissRequiresReason?: boolean;
};

const NURSE_SCHEDULE_GROUPING_WINDOW_MINUTES = 30;

function DoctorDashboard() {
  const d = useRoleDashboardData("assigned");
  const residentIds = d.activeResidentIds;
  const reviewAlerts = d.clinicalAlerts.filter((a) =>
    isActionableClinicalAlert(a) && /news|oxygen|spo2|temp|temperature|pain|weight|deteriorat|glucose/i.test(a.title),
  );
  const abnormalVitals = d.vitals
    .filter((v: any) => residentIds.has(v.residentId) && ((v.news2Score || v.news2Total || 0) >= 5 || (v.painScore || 0) >= 7 || (v.spo2 || 100) < 92 || (v.temperature || 36) >= 38))
    .slice(0, 8);
  const doctorTasks = d.tasks.filter((t) =>
    t.status !== "completed" &&
    (/doctor|medical|medication|treatment|review|pain|prn/i.test(`${t.title} ${t.description || ""}`) ||
      t.assignedTo === d.care.currentUser.name),
  );
  const medicalProblems = d.activeProblems.filter((p) =>
    /medical|doctor|medication|pain|infection|wound|deteriorat|diabetes|respiratory|cardiac/i.test(`${p.problemStatement} ${p.notes || ""}`),
  );
  const mdtReview = d.care.mdtNotes
    .filter((n: any) => !n.deletedAt && (!n.residentId || residentIds.has(n.residentId)) && /doctor|medical|review|gp/i.test(`${n.note || n.content || n.summary || ""}`))
    .slice(0, 6);

  return (
    <RolePage title="Doctor dashboard" subtitle="clinical review and medical follow-up">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <RoleMetric icon={HeartPulse} label="Clinical Reviews" value={reviewAlerts.length + abnormalVitals.length} href="/alerts" tone="danger" />
        <RoleMetric icon={Activity} label="Abnormal Vitals" value={abnormalVitals.length} href="/vitals" tone="warn" />
        <RoleMetric icon={ClipboardList} label="Treatment Reviews" value={medicalProblems.length} href="/care-plans" tone="info" />
        <RoleMetric icon={NotebookPen} label="MDT" value={mdtReview.length} href="/mdt-notes" />
        <RoleMetric icon={CheckCircle2} label="Assigned Tasks" value={doctorTasks.length} href="/tasks" tone={doctorTasks.length ? "warn" : "good"} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <RoleList title="Residents Awaiting Clinical Review" empty="No residents awaiting clinical review." href="/alerts" items={[
          ...reviewAlerts.map((a) => ({ title: rdName(d.residentFor(a.residentId)), meta: a.title, href: `/residents/${a.residentId}` })),
          ...abnormalVitals.map((v: any) => ({ title: rdName(d.residentFor(v.residentId)), meta: `NEWS2 ${v.news2Score || v.news2Total || 0} - ${v.date} ${v.time}`, href: `/residents/${v.residentId}` })),
        ]} />
        <RoleList title="Medication / Treatment Review" empty="No medication or treatment reviews due." href="/care-plans" items={medicalProblems.map((p) => ({ title: rdName(d.residentFor(p.residentId)), meta: p.problemStatement, href: `/residents/${p.residentId}` }))} />
        <RoleList title="MDT" empty="No doctor review meetings." href="/mdt-notes" items={mdtReview.map((n: any) => ({ title: rdName(d.residentFor(n.residentId)), meta: n.date || n.createdAt || "Recent meeting", href: "/mdt-notes" }))} />
        <RoleList title="Assigned / Follow-up Tasks" empty="No doctor-specific tasks assigned." href="/tasks" items={doctorTasks.map((t) => ({ title: t.title, meta: t.dueDate, href: t.residentId ? `/residents/${t.residentId}` : "/tasks" }))} />
      </div>
    </RolePage>
  );
}

function scheduleDateTime(date: string, time?: string) {
  const cleanTime = time?.trim();
  if (cleanTime && /^\d{1,2}:\d{2}/.test(cleanTime)) {
    const [hour = "00", minute = "00"] = cleanTime.split(":");
    return new Date(`${date}T${hour.padStart(2, "0")}:${minute.slice(0, 2)}`);
  }
  return new Date(`${date}T23:59:00`);
}

function formatScheduleTime(value?: Date | string) {
  if (!value) return "Today";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Today";
  return date.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
}

function linkedAlertVital(alert: any, vitals: any[]) {
  return alert.sourceVitalId
    ? vitals.find((vital) => vital.id === alert.sourceVitalId || vital.canonicalObservation?.id === alert.sourceVitalId)
    : undefined;
}

function alertNotificationSortTime(alert: any, vitals: any[]) {
  const vital = linkedAlertVital(alert, vitals);
  if (vital?.date && vital?.time) {
    const date = scheduleDateTime(vital.date, vital.time);
    if (!Number.isNaN(date.getTime())) return date.getTime();
  }
  const timestamp = alert.updatedAt || alert.createdAt;
  const date = timestamp ? new Date(timestamp) : undefined;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

function formatAlertNotificationTime(alert: any, vitals: any[]) {
  const vital = linkedAlertVital(alert, vitals);
  if (typeof vital?.time === "string" && vital.time.trim()) return vital.time.slice(0, 5);
  if (typeof alert.time === "string" && alert.time.trim()) return alert.time.slice(0, 5);
  const timestamp = alert.updatedAt || alert.createdAt;
  if (timestamp) return formatScheduleTime(timestamp);
  return "Recent";
}

function scheduleDateKey(value?: Date | string) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function workQueueScheduleKind(item: WorkQueueItem) {
  if (item.workType === "Care intervention") return { kind: "Care Action", icon: ClipboardCheck, tone: "orange" };
  if (item.workType === "Observation") return { kind: "Observation", icon: HeartPulse, tone: "purple" };
  if (item.workType === "Assessment") return { kind: "Assessment", icon: ClipboardList, tone: "blue" };
  if (item.workType === "Clinical alert") return { kind: "Alert", icon: AlertTriangle, tone: "red" };
  if (item.workType === "Documentation") return { kind: "Documentation", icon: FileText, tone: "teal" };
  return { kind: "Task", icon: ClipboardList, tone: "blue" };
}

function pluralScheduleKind(kind: string, count: number) {
  if (count === 1) return kind;
  if (kind === "Care Action") return "Care Actions";
  if (kind === "Care Plan Review") return "Care Plan Reviews";
  return `${kind}s`;
}

function schedulePreviewDetails(details: string[] = [], limit = 3) {
  const visible = details.slice(0, limit);
  const remaining = details.length - visible.length;
  return remaining > 0 ? [...visible, `+${remaining} more`] : visible;
}

function groupNurseScheduleItems(items: NurseScheduleItem[]) {
  const windowMs = NURSE_SCHEDULE_GROUPING_WINDOW_MINUTES * 60 * 1000;
  const sorted = [...items].sort(
    (left, right) => left.sortAt - right.sortAt || left.id.localeCompare(right.id),
  );
  const groups: NurseScheduleItem[][] = [];

  for (const item of sorted) {
    const lastGroup = groups[groups.length - 1];
    const first = lastGroup?.[0];
    const canJoin =
      first &&
      first.kind === item.kind &&
      first.residentName === item.residentName &&
      first.room === item.room &&
      (first.status || "") === (item.status || "") &&
      (first.assignment || "") === (item.assignment || "") &&
      item.sortAt - first.sortAt <= windowMs;

    if (canJoin && lastGroup) {
      lastGroup.push(item);
    } else {
      groups.push([item]);
    }
  }

  return groups.map((group) => {
    if (group.length === 1) return { ...group[0], count: 1, children: undefined };
    const first = group[0];
    const details = group.flatMap((item) => item.details?.length ? item.details : [item.title]);
    return {
      ...first,
      id: `schedule-group-${first.kind}-${first.residentName}-${first.room}-${first.sortAt}`,
      title: `${group.length} ${pluralScheduleKind(first.kind, group.length)}`,
      meta: `${first.residentName} · Room ${first.room}`,
      details,
      count: group.length,
      children: group,
      dismissRequiresReason: group.some((item) => item.dismissRequiresReason),
    };
  });
}

function buildNurseScheduleItems(
  d: ReturnType<typeof useRoleDashboardData>,
  residentIds: Set<string>,
  workQueue: WorkQueueItem[],
  selectedDate: string,
): NurseScheduleItem[] {
  const items: NurseScheduleItem[] = [];
  const add = (item: NurseScheduleItem) => items.push(item);
  const residentFor = (residentId?: string) => d.residentFor(residentId);
  const residentName = (residentId?: string) => rdName(residentFor(residentId));
  const room = (residentId?: string) => residentFor(residentId)?.roomNumber || "-";

  workQueue.forEach((item) => {
    const classified = workQueueScheduleKind(item);
    const taskId = item.id.startsWith("task-") ? item.id.replace("task-", "") : "";
    const task = taskId ? d.tasks.find((candidate) => candidate.id === taskId) : undefined;
    const isAppointment = Boolean(task?.appointmentType || task?.appointmentTime || /appointment|clinic|hospital|gp|review/i.test(`${task?.title || ""} ${task?.description || ""}`));
    const at = task
      ? scheduleDateTime(task.dueDate.slice(0, 10), task.appointmentTime)
      : item.dueAt || new Date(`${selectedDate}T12:00:00`);
    add({
      id: item.id,
      time: formatScheduleTime(at),
      sortAt: at.getTime(),
      title: item.title,
      meta: task?.appointmentLocation
        ? `${residentName(item.residentId)} · ${task.appointmentLocation}`
        : `${item.residentName} · Room ${item.room}`,
      residentName: item.residentName,
      room: item.room,
      kind: isAppointment ? "Appointment" : classified.kind,
      icon: isAppointment ? CalendarClock : classified.icon,
      tone: isAppointment ? "green" : classified.tone,
      href: item.href,
      details: item.workType === "Observation" ? [item.title] : undefined,
      status: item.status,
      assignment: item.assignment || task?.assignedTo || task?.assignedRole || task?.assignedWingId || "",
      dismissRequiresReason: ["Observation", "Assessment", "Clinical alert"].includes(item.workType) || isAppointment,
    });
  });

  d.dueCarePlans
    .filter((plan) => residentIds.has(plan.residentId) && (plan.reviewDate === selectedDate || plan.evaluationDate === selectedDate))
    .forEach((plan) => {
      const at = new Date(`${selectedDate}T12:00:00`);
      add({
        id: `care-plan-${plan.id}`,
        time: "Review",
        sortAt: at.getTime(),
        title: plan.problemStatement,
        meta: `${residentName(plan.residentId)} · Care plan review due`,
        residentName: residentName(plan.residentId),
        room: room(plan.residentId),
        kind: "Care Plan Review",
        icon: FileText,
        tone: "teal",
        href: `/residents/${plan.residentId}`,
        status: plan.status,
        assignment: "",
        dismissRequiresReason: true,
      });
    });

  d.visitors
    .filter((visit: any) => residentIds.has(visit.residentId) && visit.date === selectedDate && !["completed", "cancelled", "deleted", "archived"].includes(visit.status))
    .forEach((visit: any) => {
      const at = scheduleDateTime(visit.date, visit.arrivalTime);
      add({
        id: `visit-${visit.id}`,
        time: formatScheduleTime(at),
        sortAt: at.getTime(),
        title: `${visit.visitorName} visiting`,
        meta: `${residentName(visit.residentId)} · ${visit.relationship}`,
        residentName: residentName(visit.residentId),
        room: room(visit.residentId),
        kind: "Visit",
        icon: Users,
        tone: "green",
        href: "/visitors",
        status: visit.status || "scheduled",
        assignment: "",
        dismissRequiresReason: false,
      });
    });

  d.outings
    .filter((outing: any) => residentIds.has(outing.residentId) && outing.date === selectedDate && !["returned", "cancelled", "closed", "deleted", "archived"].includes(outing.status))
    .forEach((outing: any) => {
      const at = scheduleDateTime(outing.date, outing.departureTime);
      add({
        id: `outing-${outing.id}`,
        time: formatScheduleTime(at),
        sortAt: at.getTime(),
        title: outing.destination,
        meta: `${residentName(outing.residentId)} · Resident outing`,
        residentName: residentName(outing.residentId),
        room: room(outing.residentId),
        kind: "Outing",
        icon: CalendarDays,
        tone: "green",
        href: "/outings",
        status: outing.status || "planned",
        assignment: "",
        dismissRequiresReason: true,
      });
    });

  return groupNurseScheduleItems(items)
    .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((left, right) => left.sortAt - right.sortAt || left.title.localeCompare(right.title));
}

function NurseDashboard() {
  const care = useCare();
  const [clockNow, setClockNow] = useState(() => new Date());
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [dismissedScheduleItems, setDismissedScheduleItems] = useState<Record<string, { reason?: string; dismissedAt: string }>>({});
  const [scheduleDismissItem, setScheduleDismissItem] = useState<NurseScheduleItem | null>(null);
  const [scheduleDismissReason, setScheduleDismissReason] = useState("");
  const [expandedScheduleItems, setExpandedScheduleItems] = useState<Record<string, boolean>>({});
  const [scheduleAnnouncement, setScheduleAnnouncement] = useState("");
  const [incidentQuickActionOpen, setIncidentQuickActionOpen] = useState(false);
  const [medicationQuickActionOpen, setMedicationQuickActionOpen] = useState(false);
  const [taskQuickActionOpen, setTaskQuickActionOpen] = useState(false);
  const [carePlansQuickActionOpen, setCarePlansQuickActionOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    () => care.operationalContext.operationalDate || new Date().toISOString().slice(0, 10),
  );
  const authorisedWingIds = care.currentUser.assignedWings || [];
  const availableWings = care.wings.filter((wing) =>
    authorisedWingIds.length ? authorisedWingIds.includes(wing.id) : true,
  );
  const [selectedWingId, setSelectedWingId] = useState(() => availableWings[0]?.id || "all");
  const selectedReferenceTime = useMemo(() => {
    const time = clockNow.toTimeString().slice(0, 8);
    return new Date(`${selectedDate}T${time}`);
  }, [clockNow, selectedDate]);
  const d = useRoleDashboardData("assigned", {
    date: selectedDate,
    now: selectedReferenceTime,
    wingId: selectedWingId === "all" ? undefined : selectedWingId,
  });

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedWingId !== "all" && !availableWings.some((wing) => wing.id === selectedWingId)) {
      setSelectedWingId(availableWings[0]?.id || "all");
    }
  }, [availableWings, selectedWingId]);

  const residents = (d.myResidents.length ? d.myResidents : d.activeResidents).slice(0, 22);
  const residentIds = new Set(residents.map((resident) => resident.id));
  const workQueue = buildShiftWorkQueue(d, residentIds, false, selectedReferenceTime, {
    exactDate: selectedDate,
  });
  const careActions = d.scheduledDue.filter((item) => residentIds.has(item.intervention.residentId));
  const observationsDue = workQueue.filter((item) => item.workType === "Observation");
  const assessmentsDue = d.dueAssessments.filter((assessment) => residentIds.has(assessment.residentId));
  const carePlansDue = d.dueCarePlans.filter((plan) => residentIds.has(plan.residentId) && plan.rltDomainId !== "dying");
  const totalCarePlansInScope = d.problems.filter(
    (plan) => residentIds.has(plan.residentId) && plan.rltDomainId !== "dying" && plan.status === "active",
  ).length;
  const alerts = [...d.clinicalAlerts, ...d.alerts]
    .filter((alert: any) => residentIds.has(alert.residentId))
    .sort((left: any, right: any) => alertNotificationSortTime(right, d.vitals) - alertNotificationSortTime(left, d.vitals));
  const dueTasks = d.tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.status !== "deleted" &&
      (!task.residentId || residentIds.has(task.residentId)),
  );
  const highlightedResidents = residents.slice(0, 5);
  const next4Hours = workQueue
    .filter((item) => item.dueAt && item.dueAt.getTime() <= selectedReferenceTime.getTime() + 4 * 60 * 60 * 1000)
    .slice(0, 8);

  const upcomingCareActions = careActions.slice(0, 8);
  const dashboardTime = clockNow.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
  const selectedWing = availableWings.find((wing) => wing.id === selectedWingId);
  const metricTotal = Math.max(residents.length, 1);
  const schedule = useMemo(
    () => buildNurseScheduleItems(d, residentIds, workQueue, selectedDate),
    [d, residentIds, selectedDate, workQueue],
  );
  const scheduleDismissKeyFor = (item: NurseScheduleItem) => `${selectedDate}:${selectedWingId}:${item.id}`;
  const visibleSchedule = schedule.filter((item) => !dismissedScheduleItems[scheduleDismissKeyFor(item)]);
  const schedulePreview = visibleSchedule.slice(0, 5);
  const openDismissScheduleItem = (item: NurseScheduleItem) => {
    setScheduleDismissItem(item);
    setScheduleDismissReason("");
    setScheduleDialogOpen(false);
  };
  const toggleScheduleItem = (item: NurseScheduleItem) => {
    if (!item.children?.length) return;
    setExpandedScheduleItems((expanded) => {
      const nextOpen = !expanded[item.id];
      setScheduleAnnouncement(
        `${item.count || item.children?.length || 1} ${pluralScheduleKind(item.kind, item.count || item.children.length).toLowerCase()} ${nextOpen ? "expanded" : "collapsed"}`,
      );
      return { ...expanded, [item.id]: nextOpen };
    });
  };
  const confirmDismissScheduleItem = () => {
    if (!scheduleDismissItem) return;
    if (scheduleDismissItem.dismissRequiresReason && !scheduleDismissReason.trim()) {
      toast.error("Reason is required to dismiss this schedule item");
      return;
    }
    setDismissedScheduleItems((items) => ({
      ...items,
      [scheduleDismissKeyFor(scheduleDismissItem)]: {
        reason: scheduleDismissReason.trim() || undefined,
        dismissedAt: new Date().toISOString(),
      },
    }));
    toast.success("Schedule item dismissed");
    setScheduleDismissItem(null);
    setScheduleDismissReason("");
  };

  return (
    <div className="min-h-screen bg-[#f4f8fd] p-4 md:p-6 xl:p-8">
      <div className="mx-auto max-w-[1680px] space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <h1 className="text-2xl font-bold tracking-tight text-[#071a3d] md:text-3xl">
              Nurse Dashboard
            </h1>
            <div className="hidden h-7 w-px bg-slate-300 md:block" />
            <div className="flex items-center gap-3 text-sm font-medium text-[#071a3d]">
              <span>Good morning, {d.care.currentUser.name.split(" ")[0]}</span>
              <Sun className="h-7 w-7 text-amber-400" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#071a3d]">
            <div className="flex min-w-[180px] items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Switch Ward/Wing</span>
              <Select
                value={selectedWingId}
                onValueChange={(value) => {
                  setSelectedWingId(value);
                  if (value !== "all") {
                    try {
                      care.selectSingleWard(value);
                    } catch {
                      // Legacy wing selections are still valid for resident filtering.
                    }
                  }
                }}
              >
                <SelectTrigger className="h-10 min-w-[150px] border-slate-200 bg-white">
                  <SelectValue placeholder="Select wing" />
                </SelectTrigger>
                <SelectContent>
                  {!authorisedWingIds.length && <SelectItem value="all">All Wings</SelectItem>}
                  {availableWings.map((wing) => (
                    <SelectItem key={wing.id} value={wing.id}>
                      {wing.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="h-6 w-px bg-slate-300" />
            <label className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  care.setOperationalDate(event.target.value);
                }}
                className="h-10 w-[150px] border-slate-200 bg-white font-semibold"
              />
            </label>
            <div className="h-6 w-px bg-slate-300" />
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {dashboardTime}
            </div>
            <div className="h-6 w-px bg-slate-300" />
            <button
              type="button"
              className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white"
              onClick={() => {
                setClockNow(new Date());
                toast.success(`Dashboard refreshed for ${selectedWing?.name || "selected wing"}`);
              }}
            >
              <RefreshCw className="h-5 w-5" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <NurseGaugeCard icon={Users} label="My Patients" value={residents.length} total={metricTotal} caption={selectedWing?.name || "Assigned to Me"} color="#1f70d6" />
          <NurseGaugeCard icon={Pill} label="Medications Due" value={5} total={metricTotal} caption="Due Today" color="#22a453" />
          <NurseGaugeCard icon={ClipboardList} label="Care Tasks" value={dueTasks.length} total={metricTotal} caption="Due Today" color="#f59b21" />
          <NurseGaugeCard icon={HeartPulse} label="Observations Due" value={observationsDue.length} total={metricTotal} caption="Due Today" color="#6f42c1" />
          <NurseGaugeCard icon={FileText} label="Care Plans Due" value={carePlansDue.length} total={totalCarePlansInScope} caption="Due Today" color="#24aaa5" />
          <NurseGaugeCard icon={Bell} label="Alerts" value={alerts.length} total={0} caption="Require Attention" color="#ef4444" simple />
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1fr_1.08fr]">
          <NursePanel title="My Patients - At a Glance" action="View All" href="/residents">
            <div className="overflow-hidden">
              <div className="grid grid-cols-[1.4fr_0.45fr_0.65fr_0.55fr_0.45fr_0.2fr] border-b px-2 pb-2 text-xs font-semibold text-slate-500">
                <span>Patient</span>
                <span>Room</span>
                <span>Status</span>
                <span>Tasks Due</span>
                <span>Alerts</span>
                <span />
              </div>
              {highlightedResidents.map((resident, index) => {
                const patientTasks = dueTasks.filter((task) => task.residentId === resident.id).length || [1, 0, 2, 1, 2][index] || 0;
                const patientAlerts = alerts.filter((alert: any) => alert.residentId === resident.id).length || (index === 2 || index === 4 ? 1 : 0);
                const atRisk = patientAlerts > 0 || index === 2 || index === 4;
                return (
                  <Link
                    key={resident.id}
                    to="/residents/$id"
                    params={{ id: resident.id }}
                    className="grid grid-cols-[1.4fr_0.45fr_0.65fr_0.55fr_0.45fr_0.2fr] items-center border-b px-2 py-2 text-sm last:border-b-0 hover:bg-blue-50/60"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-blue-100 text-blue-800">
                          {resident.firstName[0]}{resident.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-[#071a3d]">{rdName(resident)}</div>
                        <div className="text-xs text-slate-500">DOB: {resident.dob.split("-").reverse().join("/")}</div>
                      </div>
                    </div>
                    <span className="font-semibold text-[#071a3d]">{resident.roomNumber}</span>
                    <span>
                      <Badge className={atRisk ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"}>
                        {atRisk ? "At Risk" : "Stable"}
                      </Badge>
                    </span>
                    <span>
                      <NurseBubble value={patientTasks} tone={patientTasks > 0 ? "orange" : "slate"} />
                    </span>
                    <span>
                      <NurseBubble value={patientAlerts} tone={patientAlerts > 0 ? "red" : "slate"} />
                    </span>
                    <ArrowRight className="h-4 w-4 text-blue-700" />
                  </Link>
                );
              })}
            </div>
            <NursePanelFooter href="/residents" label="View All My Patients" />
          </NursePanel>

          <NursePanel title="Today's Schedule" action="View All" onAction={() => setScheduleDialogOpen(true)}>
            <div className="sr-only" aria-live="polite">{scheduleAnnouncement}</div>
            <div className="space-y-0">
              {schedulePreview.length === 0 ? (
                <div className="rounded-lg border p-8 text-center text-sm text-slate-500">
                  No scheduled work for today.
                </div>
              ) : (
                schedulePreview.map((item) => (
                  <div key={item.id} className="border-b last:border-b-0">
                    <div className="grid grid-cols-[82px_36px_1fr_auto_auto_auto] items-center gap-3 py-3">
                      <div className="flex items-center gap-3 text-sm font-medium text-[#071a3d]">
                        <span className={`h-2.5 w-2.5 rounded-full ${nurseToneDot(item.tone)}`} />
                        {item.time}
                      </div>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${nurseToneBg(item.tone)}`}>
                        <item.icon className={`h-5 w-5 ${nurseToneText(item.tone)}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-[#071a3d]">{item.title}</div>
                        <div className="truncate text-xs text-slate-500">{item.meta}</div>
                        {item.details && item.details.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {schedulePreviewDetails(item.details).map((detail, detailIndex) => (
                              <span key={`${detail}-${detailIndex}`} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                {detail}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Badge className={`${nurseToneBadge(item.tone)} min-w-[112px] justify-center rounded-lg px-3 py-1`}>
                        {item.kind} ({item.count || 1})
                      </Badge>
                      {item.children?.length ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          aria-expanded={Boolean(expandedScheduleItems[item.id])}
                          aria-label={`${expandedScheduleItems[item.id] ? "Collapse" : "Expand"} ${item.title}`}
                          onClick={() => toggleScheduleItem(item)}
                        >
                          {expandedScheduleItems[item.id] ? "Collapse" : "Open"}
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="outline" className="h-8">
                          <Link to={item.href as any}>Open</Link>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs text-slate-500 hover:text-[#071a3d]"
                        onClick={() => openDismissScheduleItem(item)}
                      >
                        Dismiss
                      </Button>
                    </div>
                    {expandedScheduleItems[item.id] && item.children?.length && (
                      <div className="mb-3 ml-[118px] space-y-2 rounded-lg bg-slate-50 p-3">
                        {item.children.map((child) => (
                          <div key={child.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md bg-white px-3 py-2 text-sm">
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-[#071a3d]">{child.title}</div>
                              <div className="text-xs text-slate-500">{child.status?.replace(/_/g, " ") || "Open"}</div>
                            </div>
                            <Badge variant="outline">{child.kind}</Badge>
                            <Button asChild size="sm" variant="ghost" className="h-8">
                              <Link to={child.href as any}>Open</Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <NursePanelFooter label="View Full Schedule" onClick={() => setScheduleDialogOpen(true)} />
          </NursePanel>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1fr_1.08fr]">
          <NursePanel title="Alerts & Notifications" action="View All" href="/alerts">
            <div className="space-y-3">
              {(alerts.length ? alerts.slice(0, 2) : [
                { id: "demo-bp", residentId: highlightedResidents[2]?.id, title: "Bridie Walsh - Blood Pressure High", message: "Last reading: 168/92", time: "08:15" },
                { id: "demo-care-plan", residentId: highlightedResidents[4]?.id, title: "Eileen Byrne - Care Plan Review Due", message: "Review due today", time: "07:45" },
              ] as any[]).map((alert: any, index: number) => {
                const displayTime = formatAlertNotificationTime(alert, d.vitals);
                const content = (
                  <>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${index === 0 ? "bg-red-100" : "bg-amber-100"}`}>
                      <AlertTriangle className={`h-4 w-4 ${index === 0 ? "text-red-500" : "text-amber-500"}`} />
                    </div>
                    <div>
                      <div className="font-semibold text-[#071a3d]">{alert.title}</div>
                      <div className="text-sm text-slate-500">{alert.message || alert.description || "Requires nursing review"}</div>
                    </div>
                    <span className="text-sm font-medium text-[#071a3d]">{displayTime}</span>
                    <ArrowRight className="h-4 w-4 text-blue-700" />
                  </>
                );
                const className = "grid grid-cols-[34px_1fr_auto_20px] items-center gap-3 rounded-lg px-2 py-2 hover:bg-blue-50/60";
                return alert.residentId ? (
                  <Link key={alert.id || `${alert.title}-${index}`} to="/residents/$id" params={{ id: alert.residentId }} className={className}>
                    {content}
                  </Link>
                ) : (
                  <Link key={alert.id || `${alert.title}-${index}`} to="/alerts" className={className}>
                    {content}
                  </Link>
                );
              })}
            </div>
            <NursePanelFooter href="/alerts" label="View All Alerts" />
          </NursePanel>

          <NursePanel title="Quick Actions">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <RecordObservationFlow
                trigger={<NurseAction icon={Users} label="Record Observation" tone="blue" />}
                onRecorded={() => toast.success("Dashboard updated")}
              />
              <NurseAction icon={Pill} label="Administer Medication" tone="green" onClick={() => setMedicationQuickActionOpen(true)} />
              <NurseAction icon={ClipboardList} label="Create Task" tone="purple" onClick={() => setTaskQuickActionOpen(true)} />
              <NurseAction icon={AlertTriangle} label="Report Incident" tone="red" onClick={() => setIncidentQuickActionOpen(true)} />
              <NurseAction icon={FileText} label="View Care Plans" tone="teal" onClick={() => setCarePlansQuickActionOpen(true)} />
            </div>
          </NursePanel>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-[#071a3d]">Upcoming Care Actions</CardTitle>
                {careActions.length > 0 && (
                  <span className="text-xs text-slate-500">{careActions.length} scheduled</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingCareActions.length === 0 ? (
                <div className="rounded-lg border p-8 text-center text-sm text-slate-500">
                  No upcoming scheduled care actions for your assigned residents.
                </div>
              ) : (
                upcomingCareActions.map((item) => {
                  const resident = d.residentFor(item.intervention.residentId);
                  return (
                    <Link
                      key={item.intervention.id}
                      to="/residents/$id"
                      params={{ id: item.intervention.residentId }}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-blue-50/60"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#071a3d]">{rdName(resident)}</div>
                        <div className="text-slate-500">
                          Room {resident?.roomNumber || "-"} · {item.intervention.name}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">{scheduledInterventionDueLabel(item, new Date())}</Badge>
                      <ArrowRight className="h-4 w-4 text-blue-700" />
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[#071a3d]">Next 4 Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {next4Hours.length === 0 ? (
                <div className="rounded-lg border p-8 text-center text-sm text-slate-500">
                  No scheduled work in the next 4 hours.
                </div>
              ) : (
                next4Hours.map((item) => (
                  <Link
                    key={item.id}
                    to="/residents/$id"
                    params={{ id: item.residentId }}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-blue-50/60"
                  >
                    <div className="w-20 shrink-0 text-xs font-semibold tabular-nums text-slate-500">
                      {item.dueAt?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) || "Today"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#071a3d]">{item.residentName}</div>
                      <div className="text-slate-500">Room {item.room} · {item.title}</div>
                    </div>
                    <Badge variant="outline">{item.workType}</Badge>
                    <ArrowRight className="h-4 w-4 text-blue-700" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[86vh] overflow-y-auto border-0 bg-[#f4f8fd] p-0">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#071a3d]">Full Schedule</DialogTitle>
              <DialogDescription>
                {formatDonDate(selectedDate)} · {selectedWing?.name || "All Wings"} · upcoming resident work, appointments and actions.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-1">
              {visibleSchedule.length === 0 ? (
                <div className="rounded-lg border p-8 text-center text-sm text-slate-500">
                  No scheduled work for today.
                </div>
              ) : (
                visibleSchedule.map((item) => (
                  <NurseScheduleDialogRow
                    key={item.id}
                    item={item}
                    expanded={Boolean(expandedScheduleItems[item.id])}
                    onToggle={() => toggleScheduleItem(item)}
                    onDismiss={() => openDismissScheduleItem(item)}
                    onOpen={() => setScheduleDialogOpen(false)}
                  />
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(scheduleDismissItem)}
        onOpenChange={(open) => {
          if (!open) {
            setScheduleDismissItem(null);
            setScheduleDismissReason("");
          }
        }}
      >
        <DialogContent className="max-w-lg border-0 bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#071a3d]">Dismiss Schedule Item</DialogTitle>
            <DialogDescription>
              {scheduleDismissItem
                ? `${scheduleDismissItem.title} · ${scheduleDismissItem.residentName}`
                : "Confirm this schedule item should be hidden from the dashboard."}
            </DialogDescription>
          </DialogHeader>
          {scheduleDismissItem?.details && scheduleDismissItem.details.length > 1 && (
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Grouped observations</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {scheduleDismissItem.details.map((detail, detailIndex) => (
                  <span key={`${detail}-${detailIndex}`} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600">
                    {detail}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-[#071a3d]">
              Reason {scheduleDismissItem?.dismissRequiresReason ? "*" : "(optional)"}
            </div>
            <Textarea
              value={scheduleDismissReason}
              onChange={(event) => setScheduleDismissReason(event.target.value)}
              placeholder="Enter reason for dismissing this item"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setScheduleDismissItem(null);
                setScheduleDismissReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDismissScheduleItem}
              disabled={Boolean(scheduleDismissItem?.dismissRequiresReason && !scheduleDismissReason.trim())}
            >
              Dismiss
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <NurseMedicationDialog
        open={medicationQuickActionOpen}
        onOpenChange={setMedicationQuickActionOpen}
        residents={residents}
      />
      <NurseTaskDialog
        open={taskQuickActionOpen}
        onOpenChange={setTaskQuickActionOpen}
        residents={residents}
        selectedWingId={selectedWingId === "all" ? undefined : selectedWingId}
      />
      <IncidentDialog
        open={incidentQuickActionOpen}
        onOpenChange={setIncidentQuickActionOpen}
        mode="create"
      />
      <NurseCarePlansDialog
        open={carePlansQuickActionOpen}
        onOpenChange={setCarePlansQuickActionOpen}
        residents={residents}
        carePlans={d.activeProblems.filter((plan) => residentIds.has(plan.residentId))}
        residentFor={d.residentFor}
      />
    </div>
  );
}

function NurseScheduleDialogRow({
  item,
  expanded,
  onToggle,
  onDismiss,
  onOpen,
}: {
  item: NurseScheduleItem;
  expanded: boolean;
  onToggle: () => void;
  onDismiss: () => void;
  onOpen: () => void;
}) {
  const isGrouped = Boolean(item.children?.length);

  return (
    <div className="rounded-lg hover:bg-blue-50/60">
      <div className="grid grid-cols-[92px_40px_1fr_auto_auto_auto] items-center gap-3 px-3 py-3">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#071a3d]">
          <span className={`h-2.5 w-2.5 rounded-full ${nurseToneDot(item.tone)}`} />
          {item.time}
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${nurseToneBg(item.tone)}`}>
          <item.icon className={`h-5 w-5 ${nurseToneText(item.tone)}`} />
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold text-[#071a3d]">{item.title}</div>
          <div className="truncate text-xs text-slate-500">{item.meta}</div>
          {item.details && item.details.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {schedulePreviewDetails(item.details).map((detail, detailIndex) => (
                <span key={`${detail}-${detailIndex}`} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {detail}
                </span>
              ))}
            </div>
          )}
        </div>
        <Badge className={`${nurseToneBadge(item.tone)} min-w-[116px] justify-center rounded-lg px-3 py-1`}>
          {item.kind} ({item.count || 1})
        </Badge>
        {isGrouped ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            aria-expanded={expanded}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${item.title}`}
            onClick={onToggle}
          >
            {expanded ? "Collapse" : "Open"}
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline" className="h-8">
            <Link to={item.href as any} onClick={onOpen}>
              Open
            </Link>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs text-slate-500 hover:text-[#071a3d]"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      </div>
      {expanded && item.children?.length && (
        <div className="mx-3 mb-3 ml-[132px] space-y-2 rounded-lg bg-slate-50 p-3">
          {item.children.map((child) => (
            <div key={child.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md bg-white px-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate font-semibold text-[#071a3d]">{child.title}</div>
                <div className="text-xs capitalize text-slate-500">
                  {child.time} Â· {child.status?.replace(/_/g, " ") || "Open"}
                </div>
              </div>
              <Badge variant="outline">{child.kind}</Badge>
              <Button asChild size="sm" variant="ghost" className="h-8">
                <Link to={child.href as any} onClick={onOpen}>
                  Open
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type NurseQuickTaskForm = {
  residentId: string;
  title: string;
  description: string;
  category: NonNullable<Task["category"]>;
  taskType: string;
  priority: NonNullable<Task["priority"]>;
  dueDate: string;
  assignedToType: NonNullable<Task["assignedToType"]>;
  assignedRole: Role;
};

const NURSE_QUICK_TASK_TYPES: Record<NonNullable<Task["category"]>, string[]> = {
  clinical: ["GP Request", "Medication Review", "Wound Review", "Observation Follow-up", "MDT Follow-up"],
  operational: ["Equipment Check", "Transport Booking", "Stock Request", "Room Support"],
  administrative: ["Documentation", "Consent Required", "Family Update", "Audit Action"],
  resident: ["Appointment", "Chiropodist", "Optician", "Dentist", "Activity"],
  general: ["Custom Action"],
};

function nurseQuickDueTime() {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function NurseTaskDialog({
  open,
  onOpenChange,
  residents,
  selectedWingId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residents: Resident[];
  selectedWingId?: string;
}) {
  const { addTask, currentUserName } = useCare();
  const blank = (): NurseQuickTaskForm => ({
    residentId: residents[0]?.id || "none",
    title: "",
    description: "",
    category: "clinical",
    taskType: "GP Request",
    priority: "normal",
    dueDate: nurseQuickDueTime(),
    assignedToType: selectedWingId ? "wing" : "staff",
    assignedRole: "nurse",
  });
  const [form, setForm] = useState<NurseQuickTaskForm>(blank);

  useEffect(() => {
    if (open) setForm(blank());
  }, [open, residents, selectedWingId]);

  const save = () => {
    if (!form.title.trim()) return toast.error("Task title is required");
    addTask({
      residentId: form.residentId === "none" ? undefined : form.residentId,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      taskType: form.taskType,
      priority: form.priority,
      assignedTo: form.assignedToType === "role" ? "NURSE" : form.assignedToType === "wing" ? "Wing team" : currentUserName,
      assignedToType: form.assignedToType,
      assignedRole: form.assignedToType === "role" ? form.assignedRole : undefined,
      assignedWingId: form.assignedToType === "wing" ? selectedWingId : undefined,
      dueDate: form.dueDate,
      recurrence: "none",
      status: "pending",
      followUpRequired: false,
      createdAt: new Date().toISOString(),
      createdBy: currentUserName,
    });
    toast.success("Task created");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>Create a resident-linked or ward task without leaving the dashboard.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Resident</Label>
            <Select value={form.residentId} onValueChange={(residentId) => setForm({ ...form, residentId })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No resident linked</SelectItem>
                {residents.map((resident) => (
                  <SelectItem key={resident.id} value={resident.id}>
                    {rdName(resident)} - Room {resident.roomNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Due date and time</Label>
            <Input type="datetime-local" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(category) => setForm({
                ...form,
                category: category as NurseQuickTaskForm["category"],
                taskType: NURSE_QUICK_TASK_TYPES[category as NurseQuickTaskForm["category"]][0],
              })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="clinical">Clinical</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
                <SelectItem value="resident">Resident</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Task type</Label>
            <Select value={form.taskType} onValueChange={(taskType) => setForm({ ...form, taskType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {NURSE_QUICK_TASK_TYPES[form.category].map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(priority) => setForm({ ...form, priority: priority as NurseQuickTaskForm["priority"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["critical", "high", "normal", "low"].map((priority) => <SelectItem key={priority} value={priority} className="capitalize">{priority}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assign to</Label>
            <Select value={form.assignedToType} onValueChange={(assignedToType) => setForm({ ...form, assignedToType: assignedToType as NurseQuickTaskForm["assignedToType"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Me</SelectItem>
                <SelectItem value="role">Nurse role</SelectItem>
                {selectedWingId && <SelectItem value="wing">Selected ward/wing</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Details</Label>
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NurseMedicationDialog({ open, onOpenChange, residents }: { open: boolean; onOpenChange: (open: boolean) => void; residents: Resident[] }) {
  const { addTask, currentUserName } = useCare();
  const [residentId, setResidentId] = useState(residents[0]?.id || "");
  const [medication, setMedication] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState(nurseQuickDueTime());

  useEffect(() => {
    if (open) {
      setResidentId(residents[0]?.id || "");
      setMedication("");
      setNotes("");
      setDueDate(nurseQuickDueTime());
    }
  }, [open, residents]);

  const save = () => {
    if (!residentId) return toast.error("Select resident");
    if (!medication.trim()) return toast.error("Medication details are required");
    addTask({
      residentId,
      title: `Administer medication: ${medication.trim()}`,
      description: notes.trim() || undefined,
      category: "clinical",
      taskType: "Medication Administration",
      priority: "normal",
      assignedTo: currentUserName,
      assignedToType: "staff",
      dueDate,
      recurrence: "none",
      status: "pending",
      createdAt: new Date().toISOString(),
      createdBy: currentUserName,
    });
    toast.success("Medication task created");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Administer Medication</DialogTitle>
          <DialogDescription>Record the medication action as a task for follow-up and audit.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Resident *</Label>
            <Select value={residentId} onValueChange={setResidentId}>
              <SelectTrigger><SelectValue placeholder="Select resident" /></SelectTrigger>
              <SelectContent>
                {residents.map((resident) => <SelectItem key={resident.id} value={resident.id}>{rdName(resident)} - Room {resident.roomNumber}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Medication / dose *</Label>
            <Input value={medication} onChange={(event) => setMedication(event.target.value)} placeholder="Medication name and dose" />
          </div>
          <div className="space-y-2">
            <Label>Due date and time</Label>
            <Input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional administration notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save Medication Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NurseCarePlansDialog({
  open,
  onOpenChange,
  residents,
  carePlans,
  residentFor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residents: Resident[];
  carePlans: CarePlanProblem[];
  residentFor: (id?: string) => Resident | undefined;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[86vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Care Plans</DialogTitle>
          <DialogDescription>Active nursing care plans for the selected dashboard residents.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <CreateCarePlanDialog
            trigger={<Button size="sm"><Plus className="mr-2 h-4 w-4" /> Create Care Plan</Button>}
            onCreated={() => toast.success("Care plan list updated")}
          />
        </div>
        <div className="space-y-2">
          {carePlans.length === 0 ? (
            <div className="rounded-lg border p-8 text-center text-sm text-slate-500">No active care plans for these residents.</div>
          ) : (
            carePlans.map((plan) => {
              const resident = residentFor(plan.residentId);
              return (
                <div key={plan.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-[#071a3d]">{plan.problemStatement}</div>
                      <div className="text-xs text-slate-500">
                        {rdName(resident)} - Room {resident?.roomNumber || "-"}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">{plan.riskLevel.replace("_", " ")}</Badge>
                  </div>
                  <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    <span>Review: {plan.reviewDate}</span>
                    <span>Outcome review: {plan.evaluationDate}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button asChild>
            <Link to="/care-plans">Open Care Plans Page</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NurseGaugeCard({
  icon: Icon,
  label,
  value,
  total,
  caption,
  color,
  simple = false,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  total: number;
  caption: string;
  color: string;
  simple?: boolean;
}) {
  const pct = simple ? 0 : Math.min(100, Math.max(8, Math.round((value / Math.max(total, 1)) * 100)));
  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div className="font-semibold text-[#071a3d]">{label}</div>
        </div>
        <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full"
          style={{
            background: simple
              ? "conic-gradient(#e7ebf1 0deg, #e7ebf1 360deg)"
              : `conic-gradient(${color} ${pct * 3.6}deg, #e7ebf1 0deg)`,
          }}
        >
          <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white text-center">
            <div className="text-3xl font-bold tabular-nums text-[#071a3d]">{value}</div>
            {!simple && <div className="text-sm font-semibold text-[#071a3d]">of {total}</div>}
          </div>
        </div>
        <div className="mt-4 text-center text-sm font-semibold text-[#071a3d]">{caption}</div>
      </CardContent>
    </Card>
  );
}

function NursePanel({
  title,
  action,
  href,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  href?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-bold text-[#071a3d]">{title}</CardTitle>
        {action && href && (
          <Link to={href} className="text-sm font-semibold text-blue-700">
            {action}
          </Link>
        )}
        {action && !href && onAction && (
          <button type="button" onClick={onAction} className="text-sm font-semibold text-blue-700">
            {action}
          </button>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function NursePanelFooter({ href, label, onClick }: { href?: string; label: string; onClick?: () => void }) {
  const className = "mt-3 flex w-full items-center justify-between border-t pt-4 text-sm font-semibold text-blue-700";
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {label}
        <ArrowRight className="h-5 w-5" />
      </button>
    );
  }
  if (!href) return null;
  return (
    <Link to={href} className={className}>
      {label}
      <ArrowRight className="h-5 w-5" />
    </Link>
  );
}

function NurseBubble({ value, tone }: { value: number; tone: "orange" | "red" | "slate" }) {
  const cls =
    tone === "orange"
      ? "bg-orange-400 text-white"
      : tone === "red"
        ? "bg-red-500 text-white"
        : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${cls}`}>{value}</span>;
}

function NurseAction({ icon: Icon, label, tone, onClick }: { icon: typeof Users; label: string; tone: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border bg-white p-3 text-center hover:bg-blue-50/60"
    >
      <Icon className={`h-9 w-9 ${nurseToneText(tone)}`} />
      <span className="text-sm font-semibold leading-snug text-[#071a3d]">{label}</span>
    </button>
  );
}

function nurseToneBg(tone: string) {
  const tones: Record<string, string> = {
    green: "bg-emerald-100",
    blue: "bg-blue-100",
    purple: "bg-violet-100",
    orange: "bg-orange-100",
    teal: "bg-teal-100",
    red: "bg-red-100",
  };
  return tones[tone] || "bg-slate-100";
}

function nurseToneText(tone: string) {
  const tones: Record<string, string> = {
    green: "text-emerald-600",
    blue: "text-blue-600",
    purple: "text-violet-600",
    orange: "text-orange-500",
    teal: "text-teal-600",
    red: "text-red-500",
  };
  return tones[tone] || "text-slate-600";
}

function nurseToneDot(tone: string) {
  const tones: Record<string, string> = {
    green: "bg-emerald-500",
    blue: "bg-blue-500",
    purple: "bg-violet-500",
    orange: "bg-orange-400",
    teal: "bg-teal-500",
    red: "bg-red-500",
  };
  return tones[tone] || "bg-slate-400";
}

function nurseToneBadge(tone: string) {
  const tones: Record<string, string> = {
    green: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    blue: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    purple: "bg-violet-100 text-violet-700 hover:bg-violet-100",
    orange: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    teal: "bg-teal-100 text-teal-700 hover:bg-teal-100",
    red: "bg-red-100 text-red-700 hover:bg-red-100",
  };
  return tones[tone] || "bg-slate-100 text-slate-700 hover:bg-slate-100";
}

function HcaDashboard() {
  const { recordDailyCare, submitHcaNurseEscalation, operationalContext } = useCare();
  const d = useRoleDashboardData("assigned");
  const [selectedDailyCareResident, setSelectedDailyCareResident] = useState<Resident | null>(null);
  const [selectedEscalationResident, setSelectedEscalationResident] = useState<Resident | null>(null);
  const residents = d.myResidents.length ? d.myResidents : d.activeResidents;
  const residentIds = d.myResidentIds.size ? d.myResidentIds : d.activeResidentIds;
  const careTasks = buildShiftWorkQueue(d, residentIds, true).filter((item) =>
    item.workType === "Care intervention" || item.workType === "Observation",
  );
  const reminders = [...d.clinicalAlerts, ...d.alerts]
    .filter((a: any) => residentIds.has(a.residentId) && /fall|infection|skin|pressure|comfort|nutrition|fluid/i.test(a.title))
    .map((a: any) => ({ title: a.title, meta: rdName(d.residentFor(a.residentId)), href: "/alerts" }));
  return (
    <RolePage title="HCA dashboard" subtitle="today's care, reminders, and assigned residents">
      <WorkQueue title="Today's Care" items={careTasks} empty="No care tasks due right now." />
      <RoleSection title="My Residents">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          {residents.length === 0 && <EmptyPanel message="No residents assigned." />}
          {residents.slice(0, 8).map((r) => <ResidentCard key={r.id} resident={r} hca compact onRecordDailyCare={setSelectedDailyCareResident} onEscalateToNurse={setSelectedEscalationResident} />)}
        </div>
      </RoleSection>
      <RoleList title="Care Reminders" empty="No care reminders at the moment." items={reminders} href="/alerts" />
      {selectedDailyCareResident && (
        <RecordDailyCareDialog
          open={Boolean(selectedDailyCareResident)}
          onOpenChange={(open) => !open && setSelectedDailyCareResident(null)}
          residentId={selectedDailyCareResident.id}
          nursingHomeId={selectedDailyCareResident.facilityId || operationalContext.nursingHomeId}
          wardId={operationalContext.wardIds[0]}
          roomId={selectedDailyCareResident.roomNumber}
          onSave={(command) => {
            recordDailyCare(command);
            toast.success("Daily Care recorded");
          }}
        />
      )}
      {selectedEscalationResident && (
        <HcaEscalateToNurseDialog
          open={Boolean(selectedEscalationResident)}
          onOpenChange={(open) => !open && setSelectedEscalationResident(null)}
          resident={selectedEscalationResident}
          nursingHomeId={selectedEscalationResident.facilityId || operationalContext.nursingHomeId}
          wardId={operationalContext.wardIds[0]}
          roomId={selectedEscalationResident.roomNumber}
          onSubmit={(command) => {
            submitHcaNurseEscalation(command);
            toast.success("Escalation sent to Nurse");
          }}
        />
      )}
    </RolePage>
  );
}

function buildShiftWorkQueue(
  d: ReturnType<typeof useRoleDashboardData>,
  residentIds: Set<string>,
  hcaOnly: boolean,
  referenceTime: Date = new Date(),
  options: { exactDate?: string } = {},
): WorkQueueItem[] {
  const now = referenceTime;
  const exactDate = options.exactDate;
  const items: WorkQueueItem[] = [];
  const addResidentItem = (
    residentId: string,
    source: Omit<WorkQueueItem, "residentId" | "residentName" | "room" | "href"> & { href?: string },
  ) => {
    const resident = d.residentFor(residentId);
    if (!resident) return;
    items.push({
      ...source,
      residentId,
      residentName: rdName(resident),
      room: resident.roomNumber,
      href: source.href || `/residents/${residentId}`,
    });
  };

  d.scheduledDue
    .filter((scheduled) => residentIds.has(scheduled.intervention.residentId))
    .filter((scheduled) => !hcaOnly || isHcaAppropriateIntervention(scheduled))
    .filter((scheduled) => !exactDate || scheduleDateKey(scheduled.dueAt || undefined) === exactDate)
    .forEach((scheduled) => {
      addResidentItem(scheduled.intervention.residentId, {
        id: `intervention-${scheduled.intervention.id}`,
        workType: "Care intervention",
        title: scheduled.intervention.name,
        dueLabel: scheduledInterventionDueLabel(scheduled, now),
        dueAt: scheduled.dueAt || undefined,
        status: scheduled.status,
        assignment: [
          scheduled.intervention.assignedTo,
          scheduled.intervention.assignedRole,
          scheduled.intervention.assignedWingId,
          scheduled.intervention.assignedTeamId,
        ].filter(Boolean).join("|"),
        tone: scheduled.status === "overdue" ? "danger" : scheduled.status === "due_now" ? "warn" : "info",
      });
    });

  if (!hcaOnly) {
    d.tasks
      .filter((task) => {
        const taskDate = task.dueDate.slice(0, 10);
        const selectedDate = exactDate || scheduleDateKey(now);
        return (
          task.status !== "completed" &&
          task.status !== "deleted" &&
          (exactDate ? taskDate === selectedDate : taskDate <= selectedDate) &&
          (!task.residentId || residentIds.has(task.residentId))
        );
      })
      .forEach((task) => {
        const dueAt = new Date(`${task.dueDate.slice(0, 10)}T23:59`);
        const status = taskStatusForDueDate(task.dueDate, now);
        if (!task.residentId) {
          items.push({
            id: `task-${task.id}`,
            residentName: "Facility task",
            room: "-",
            workType: "Task",
            title: task.title,
            dueLabel: status === "overdue" ? "Overdue" : "Due today",
            dueAt,
            status,
            assignment: [task.assignedTo, task.assignedRole, task.assignedWingId, task.assignedUnitId].filter(Boolean).join("|"),
            href: "/tasks",
            tone: status === "overdue" ? "danger" : "warn",
          });
          return;
        }
        addResidentItem(task.residentId, {
          id: `task-${task.id}`,
          workType: /note|document|handover|incident/i.test(task.title) ? "Documentation" : "Task",
          title: task.title,
          dueLabel: status === "overdue" ? "Overdue" : "Due today",
          dueAt,
          status: /note|document|handover|incident/i.test(task.title) ? "documentation" : status,
          assignment: [task.assignedTo, task.assignedRole, task.assignedWingId, task.assignedUnitId].filter(Boolean).join("|"),
          tone: status === "overdue" ? "danger" : "warn",
        });
      });

    d.dueAssessments
      .filter((assessment: any) => {
        const dueDate = assessment.dueDate || assessment.reviewDate || assessment.nextDueDate || assessment.date;
        return residentIds.has(assessment.residentId) && (!exactDate || String(dueDate || "").slice(0, 10) === exactDate);
      })
      .slice(0, 20)
      .forEach((assessment) => {
        addResidentItem(assessment.residentId, {
          id: `assessment-${assessment.id}`,
          workType: "Assessment",
          title: `${assessment.type.replace("_", " ")} assessment due`,
          dueLabel: assessment.status === "review_due" ? "Review due" : "Due today",
          status: "due_today",
          assignment: [assessment.assignedTo, assessment.assignedToName, assessment.assignedRole].filter(Boolean).join("|"),
          tone: "info",
        });
      });
  }

  d.observationPlans.forEach((plan) => {
    if (!residentIds.has(plan.residentId)) return;
    const compliance = complianceForResident(plan, d.vitals.filter((v) => v.residentId === plan.residentId), now);
    compliance.items
      .filter((item) => item.status === "missed" || item.status === "overdue" || item.status === "due_today")
      .filter((item) => !exactDate || scheduleDateKey(item.nextDueAt) === exactDate)
      .forEach((item) => {
        const dueAt = item.nextDueAt ? new Date(item.nextDueAt) : undefined;
        addResidentItem(plan.residentId, {
          id: `observation-${plan.residentId}-${item.item.id}`,
          workType: "Observation",
          title: `${item.item.type.replace("_", " ")} due`,
          dueLabel: item.status === "missed" ? "Missed" : item.status === "overdue" ? "Overdue" : "Due today",
          dueAt,
          status: item.status === "due_today" ? "due_today" : "overdue",
          tone: item.status === "due_today" ? "info" : "danger",
        });
      });
  });

  if (!hcaOnly && !exactDate) {
    [...d.clinicalAlerts.filter(isActionableClinicalAlert), ...d.alerts.filter(isActionRequiredAlert)]
      .filter((alert: any) => residentIds.has(alert.residentId))
      .forEach((alert: any) => {
        addResidentItem(alert.residentId, {
          id: `alert-${alert.id}`,
          workType: "Clinical alert",
          title: alert.title,
          dueLabel: "Requires review",
          status: "alerts",
          tone: "danger",
        });
      });
  }

  return items.sort((a, b) => queueRank(a.status) - queueRank(b.status) || (a.dueAt?.getTime() ?? 0) - (b.dueAt?.getTime() ?? 0));
}

function ShiftSummary({
  filter,
  setFilter,
  counts,
}: {
  filter: WorkQueueFilter;
  setFilter: (value: WorkQueueFilter) => void;
  counts: Record<WorkQueueFilter | "residents", number>;
}) {
  const cards: { key: WorkQueueFilter; label: string; value: number; icon: any; tone?: "warn" | "danger" | "info" | "good" }[] = [
    { key: "all", label: "Residents Assigned", value: counts.residents, icon: Users, tone: "info" },
    { key: "due_now", label: "Due Now", value: counts.due_now, icon: Activity, tone: counts.due_now ? "warn" : "good" },
    { key: "overdue", label: "Overdue", value: counts.overdue, icon: AlertTriangle, tone: counts.overdue ? "danger" : "good" },
    { key: "alerts", label: "Clinical Alerts", value: counts.alerts, icon: ShieldAlert, tone: counts.alerts ? "danger" : "good" },
    { key: "documentation", label: "Documentation Due", value: counts.documentation, icon: NotebookPen, tone: counts.documentation ? "warn" : "good" },
  ];
  return (
    <RoleSection title="Shift Summary">
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {cards.map((card) => (
          <button key={card.key} type="button" className="text-left" onClick={() => setFilter(filter === card.key ? "all" : card.key)}>
            <RoleMetric icon={card.icon} label={card.label} value={card.value} tone={filter === card.key ? "info" : card.tone} />
          </button>
        ))}
      </div>
    </RoleSection>
  );
}

function WorkQueue({ title, items, empty }: { title: string; items: WorkQueueItem[]; empty: string }) {
  const groups: { key: WorkQueueFilter; label: string }[] = [
    { key: "overdue", label: "Overdue" },
    { key: "due_now", label: "Due Now" },
    { key: "due_next_hour", label: "Due in Next Hour" },
    { key: "due_today", label: "Due Today" },
    { key: "alerts", label: "Clinical Alerts" },
    { key: "documentation", label: "Documentation" },
  ];
  return (
    <RoleSection title={title}>
      <Card>
        <CardContent className="p-3 space-y-3">
          {items.length === 0 && <div className="rounded-md border p-6 text-sm text-muted-foreground">{empty}</div>}
          {groups.map((group) => {
            const rows = items.filter((item) => item.status === group.key);
            if (!rows.length) return null;
            return (
              <div key={group.key} className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</div>
                {rows.map((item) => <WorkQueueRow key={item.id} item={item} />)}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </RoleSection>
  );
}

function WorkQueueRow({ item }: { item: WorkQueueItem }) {
  const toneClass = {
    danger: "border-destructive/40 bg-destructive/5",
    warn: "border-warning/50 bg-warning/10",
    info: "border-info/30 bg-info/5",
    default: "",
  }[item.tone];
  return (
    <div className={`rounded-md border p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${toneClass}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{item.residentName}</span>
          <span className="text-xs text-muted-foreground">Room {item.room}</span>
          <Badge variant="outline" className="text-[10px]">{item.workType}</Badge>
        </div>
        <div className="text-sm mt-1">{item.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{item.dueLabel}</div>
      </div>
      <Link to={item.href as any} className="shrink-0">
        <Button size="sm" variant="outline">Open Resident</Button>
      </Link>
    </div>
  );
}

function ResidentCard({ resident, hca = false, compact = false, onRecordDailyCare, onEscalateToNurse }: { resident: Resident; hca?: boolean; compact?: boolean; onRecordDailyCare?: (resident: Resident) => void; onEscalateToNurse?: (resident: Resident) => void }) {
  const flags = hca
    ? [
        resident.aKeyToMe?.mobility ? `Mobility: ${resident.aKeyToMe.mobility}` : "Mobility not recorded",
        resident.aKeyToMe?.nutrition ? `Nutrition: ${resident.aKeyToMe.nutrition}` : resident.communicationNeeds || "Communication not recorded",
        resident.otherPreferences || "",
      ]
    : compact
      ? [
        resident.allergies ? `Allergies: ${resident.allergies}` : "",
        resident.dnarStatus ? `DNAR: ${resident.dnarStatus}` : "",
      ]
      : [
        resident.allergies ? `Allergies: ${resident.allergies}` : "No allergies recorded",
        `DNAR: ${resident.dnarStatus || "not recorded"}`,
        resident.primaryDiagnosis || "Diagnosis not recorded",
        resident.endOfLife ? "End of life care" : "Active care",
      ];
  const visibleFlags = flags.filter(Boolean).slice(0, compact ? 2 : 4);
  const content = (
      <Card className="h-full hover:border-primary/40 transition-colors">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium text-sm">{rdName(resident)}</div>
            <Badge variant="outline" className="text-[10px]">Room {resident.roomNumber}</Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {visibleFlags.map((flag) => <Badge key={flag} variant="secondary" className="text-[10px] max-w-full truncate">{flag}</Badge>)}
          </div>
          {(onRecordDailyCare || onEscalateToNurse) && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Button size="sm" variant="outline" asChild><Link to="/residents/$id" params={{ id: resident.id }}>Open</Link></Button>
              {onRecordDailyCare && <Button size="sm" onClick={() => onRecordDailyCare(resident)}>Record Care</Button>}
              {onEscalateToNurse && <Button size="sm" variant="secondary" onClick={() => onEscalateToNurse(resident)}>Escalate</Button>}
            </div>
          )}
        </CardContent>
      </Card>
  );
  if (onRecordDailyCare || onEscalateToNurse) return content;
  return (
    <Link to="/residents/$id" params={{ id: resident.id }}>
      {content}
    </Link>
  );
}

function scheduledInterventionDueLabel(scheduled: ScheduledIntervention, now: Date) {
  if (scheduled.status === "overdue" && scheduled.dueAt) {
    return `Overdue ${Math.max(1, Math.round((now.getTime() - scheduled.dueAt.getTime()) / 60000))} min`;
  }
  if (scheduled.status === "due_now") return "Due now";
  if (scheduled.status === "due_next_hour") return "Due in next hour";
  if (scheduled.dueAt) return scheduled.dueAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return scheduledInterventionLabel(scheduled.status);
}

function isHcaAppropriateIntervention(scheduled: ScheduledIntervention) {
  const role = scheduled.intervention.assignedRole;
  return !role || role === "carer" || /personal|reposition|turn|food|fluid|toilet|comfort|activity|skin|pressure/i.test(scheduled.intervention.name);
}

function taskStatusForDueDate(dueDate: string, now: Date): WorkQueueFilter {
  const today = now.toISOString().slice(0, 10);
  const key = dueDate.slice(0, 10);
  if (key < today) return "overdue";
  return "due_today";
}

function queueRank(status: WorkQueueFilter) {
  const ranks: Record<WorkQueueFilter, number> = {
    overdue: 0,
    due_now: 1,
    due_next_hour: 2,
    due_today: 3,
    alerts: 4,
    documentation: 5,
    all: 6,
  };
  return ranks[status];
}

function queueCounts(items: WorkQueueItem[], residents: number): Record<WorkQueueFilter | "residents", number> {
  return {
    residents,
    all: items.length,
    overdue: items.filter((item) => item.status === "overdue").length,
    due_now: items.filter((item) => item.status === "due_now").length,
    due_next_hour: items.filter((item) => item.status === "due_next_hour").length,
    due_today: items.filter((item) => item.status === "due_today").length,
    alerts: items.filter((item) => item.status === "alerts").length,
    documentation: items.filter((item) => item.status === "documentation").length,
  };
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
        <div className="text-2xl font-semibold">{value}%</div>
        <Progress value={value} />
      </CardContent>
    </Card>
  );
}

function KpiRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm"><span>{label}</span><span className="font-medium">{value}%</span></div>
      <Progress value={value} />
    </div>
  );
}

function ActivityBand({ title, data }: { title: string; data: Record<string, number> }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="rounded-md border p-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{key}</div>
            <div className="text-lg font-semibold tabular-nums">{value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return <div className="rounded-md border p-6 text-sm text-muted-foreground">{message}</div>;
}

function rdName(r?: Resident) {
  return r ? `${r.firstName} ${r.lastName}` : "Resident";
}

function rdPct(value: number, total: number) {
  return total <= 0 ? 0 : Math.round((value / total) * 100);
}

function rdGroupedStaff(users: UserProfile[]): DetailItem[] {
  const shifts = ["Morning Shift", "Evening Shift", "Night Shift", "Off duty"];
  return users.map((u, index) => ({ title: u.name, meta: `${shifts[index % shifts.length]} - ${u.department}`, href: "/profile" }));
}

function Dashboard() {
  const { currentUser: dashboardUser } = useCare();
  return <RoleSpecificDashboard role={dashboardUser.role} />;

  const { residents, assessments, carePlanProblems, alerts, notes, tasks, currentUser } = useCare();
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
  const dueReviews = carePlanProblems.filter(
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
            Good day, {currentUser.name}
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
              <ClipboardList className="h-4 w-4 mr-1.5" /> New Nursing Care Plan
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
