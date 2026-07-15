import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCare, age } from "@/lib/care/store";
import { isActionableClinicalAlert, isActionRequiredAlert } from "@/lib/care/alerts";
import { complianceForResident } from "@/lib/care/vitals";
import {
  endOfCurrentShift,
  getUpcomingScheduledInterventions,
  scheduledInterventionLabel,
  type ScheduledIntervention,
  type ScheduledInterventionStatus,
} from "@/lib/care/intervention-schedule";
import type { Resident, UserProfile } from "@/lib/care/types";
import { OperationsHub } from "@/components/operations/OperationsHub";
import { RecordDailyCareDialog } from "@/components/dailyCare/RecordDailyCareDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Bed,
  CalendarClock,
  CheckCircle2,
  Gauge,
  Home,
  ShieldAlert,
  UserCheck,
  TrendingDown,
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
  if (role === "don") return <DonDashboard />;
  if (role === "cnm") return <CnmDashboard />;
  if (role === "doctor") return <DoctorDashboard />;
  if (role === "nurse") return <NurseDashboard />;
  return <HcaDashboard />;
}

function useRoleDashboardData(scope: "home" | "assigned" = "home") {
  const care = useCare();
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const residents = care.residents.filter((r) => r.status !== "deleted");
  const assignedWings = care.currentUser.assignedWings || [];
  const scopedResidents =
    scope === "home" || care.currentUser.role === "don" || assignedWings.length === 0
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
  const now = new Date();
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

function DonDashboard() {
  const d = useRoleDashboardData("home");
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const active = d.residents.filter((r) => r.status === "active" && (!r.residentType || r.residentType === "active"));
  const inactive = d.residents.filter((r) => r.status !== "active" && (!r.residentType || r.residentType === "inactive"));
  const activeRespite = d.residents.filter((r) => r.residentType === "active_respite");
  const inactiveRespite = d.residents.filter((r) => r.residentType === "inactive_respite");
  const rooms = d.care.rooms.length;
  const occupancy = rdPct(d.activeResidents.length, rooms);
  const avgAge = d.activeResidents.length ? Math.round(d.activeResidents.reduce((sum, r) => sum + age(r.dob), 0) / d.activeResidents.length) : 0;
  const avgStay = d.activeResidents.length
    ? Math.round(d.activeResidents.reduce((sum, r) => sum + Math.max(0, Math.floor((Date.now() - new Date(r.admissionDate).getTime()) / 86400000)), 0) / d.activeResidents.length)
    : 0;
  const admissionsToday = d.residents.filter((r) => r.admissionDate === d.today);
  const admissionsWeek = d.residents.filter((r) => r.admissionDate >= d.weekStart);
  const discharges = d.residents.filter((r) => r.status === "discharged");
  const hospitalTransfers = d.incidents.filter((i) => /hospital|transfer/i.test(`${i.description} ${i.immediateAction}`));
  const respite = d.residents.filter((r) => r.residentType === "active_respite" || r.residentType === "inactive_respite");
  const nurses = d.care.users.filter((u) => u.role === "nurse" && u.status === "active");
  const dailyAdherence = rdPct(d.completedToday, d.completedToday + d.scheduledDue.length);
  const weeklyAdherence = rdPct(d.completedWeek, d.completedWeek + d.scheduledDue.length);
  const carePlanCompliance = rdPct(d.activeProblems.length - d.dueCarePlans.length, d.activeProblems.length);
  const assessmentCompliance = rdPct(d.assessments.length - d.dueAssessments.length, d.assessments.length);
  const governance = Math.round((occupancy + dailyAdherence + carePlanCompliance + assessmentCompliance) / 4);
  const visits = d.visitors.filter((v) => v.date >= d.today).map((v) => ({ title: rdName(d.residentFor(v.residentId)), meta: `${v.date} ${v.arrivalTime} - ${v.visitorName}`, href: "/visitors" }));
  const outings = d.outings.filter((o) => o.date >= d.today).map((o) => ({ title: rdName(d.residentFor(o.residentId)), meta: `${o.date} ${o.departureTime} - ${o.destination}`, href: "/outings" }));

  return (
    <RolePage title="DON dashboard" subtitle="whole-home overview and governance">
      <RoleDetails detail={detail} onClose={() => setDetail(null)} />
      <RoleSection title="Home Overview">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <RoleMetric icon={Users} label="Total Residents" value={d.residents.length} onClick={() => setDetail({ title: "Resident breakdown", items: [...d.residentItems(active), ...d.residentItems(inactive), ...d.residentItems(activeRespite), ...d.residentItems(inactiveRespite)] })} />
          <RoleMetric icon={Bed} label="Bed Occupancy" value={`${occupancy}%`} hint={`${d.activeResidents.length}/${rooms} occupied`} onClick={() => setDetail({ title: "Bed occupancy", items: [{ title: "Occupied beds", meta: String(d.activeResidents.length) }, { title: "Total beds", meta: String(rooms) }, { title: "Available beds", meta: String(Math.max(rooms - d.activeResidents.length, 0)) }, { title: "Occupancy", meta: `${occupancy}%` }] })} />
          <RoleMetric icon={UserCheck} label="Active Residents" value={active.length} href="/residents" tone="good" />
          <RoleMetric icon={Users} label="Inactive Residents" value={inactive.length} href="/residents" />
          <RoleMetric icon={Home} label="Active Respite" value={activeRespite.length} href="/residents" tone="info" />
          <RoleMetric icon={Home} label="Inactive Respite" value={inactiveRespite.length} href="/residents" />
          <RoleMetric icon={Gauge} label="Average Age" value={avgAge || "-"} />
          <RoleMetric icon={CalendarClock} label="Average Stay" value={`${avgStay}d`} />
        </div>
      </RoleSection>

      <RoleSection title="Admissions / Movement">
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
          <RoleMetric icon={UserCheck} label="Admissions Today" value={admissionsToday.length} onClick={() => setDetail({ title: "Admissions today", items: d.residentItems(admissionsToday) })} />
          <RoleMetric icon={Users} label="Admissions Week" value={admissionsWeek.length} onClick={() => setDetail({ title: "Admissions this week", items: d.residentItems(admissionsWeek) })} />
          <RoleMetric icon={HeartPulse} label="Hospital Transfers" value={hospitalTransfers.length} href="/incidents" tone="warn" />
          <RoleMetric icon={ArrowRight} label="Discharges" value={discharges.length} onClick={() => setDetail({ title: "Discharges", items: d.residentItems(discharges) })} />
          <RoleMetric icon={Home} label="Respite Admissions" value={respite.length} onClick={() => setDetail({ title: "Respite residents", items: d.residentItems(respite) })} />
        </div>
      </RoleSection>

      <RoleSection title="Staffing Overview">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <RoleMetric icon={Stethoscope} label="Nurses on Duty" value={nurses.length} onClick={() => setDetail({ title: "Nurses on duty", items: rdGroupedStaff(nurses) })} />
          <RoleMetric icon={Users} label="Total Nurses" value={nurses.length} onClick={() => setDetail({ title: "All nurses", items: rdGroupedStaff(nurses) })} />
          <RoleMetric icon={AlertTriangle} label="Staff Shortages" value={Math.max(0, 6 - nurses.length)} tone={nurses.length < 6 ? "warn" : "good"} />
          <RoleMetric icon={UserCheck} label="Agency Staff" value={d.care.users.filter((u) => /agency/i.test(`${u.name} ${u.department}`)).length} />
        </div>
      </RoleSection>

      <div className="grid xl:grid-cols-2 gap-4">
        <RoleSection title="Clinical Governance">
          <div className="grid grid-cols-2 gap-3">
            <RoleMetric icon={ClipboardList} label="Care Plans Due" value={d.dueCarePlans.length} href="/care-plans" tone={d.dueCarePlans.length ? "warn" : "good"} />
            <RoleMetric icon={Stethoscope} label="Assessments Due" value={d.dueAssessments.length} href="/assessments" tone={d.dueAssessments.length ? "warn" : "good"} />
            <RoleMetric icon={AlertTriangle} label="High Risk Residents" value={d.highRiskResidents.length} href="/risks" tone="warn" />
            <RoleMetric icon={ShieldAlert} label="Clinical Alerts" value={d.clinicalAlerts.length + d.alerts.length} href="/alerts" tone="danger" />
            <RoleMetric icon={HeartPulse} label="NEWS2 Review" value={d.vitals.filter((v: any) => (v.news2Score || v.news2Total || 0) >= 5).length} href="/vitals" tone="danger" />
            <RoleMetric icon={TrendingDown} label="Weight Alerts" value={d.clinicalAlerts.filter((a) => /weight|nutrition/i.test(a.title)).length} href="/alerts" tone="warn" />
            <RoleMetric icon={ShieldAlert} label="Falls 24h" value={d.incidents.filter((i) => i.type === "fall" && i.date >= d.today).length} href="/incidents" tone="danger" />
            <RoleMetric icon={Activity} label="Pressure Alerts" value={[...d.clinicalAlerts, ...d.alerts].filter((a) => /pressure|skin|waterlow/i.test(a.title)).length} href="/alerts" tone="warn" />
          </div>
        </RoleSection>
        <RoleSection title="Interventions / Care Delivery">
          <div className="grid grid-cols-2 gap-3">
            <RoleMetric icon={Activity} label="Due Today" value={d.scheduledDue.length} href="/operations" tone={d.scheduledDue.length ? "warn" : "good"} />
            <RoleMetric icon={CheckCircle2} label="Completed Today" value={d.completedToday} href="/operations" tone="good" />
            <KpiCard label="Daily Adherence" value={dailyAdherence} />
            <KpiCard label="Weekly Adherence" value={weeklyAdherence} />
          </div>
        </RoleSection>
      </div>

      <div className="grid xl:grid-cols-3 gap-4">
        <RoleList title="Upcoming Visits" empty="No scheduled visits today." items={visits} href="/visitors" />
        <RoleList title="Upcoming Outings" empty="No upcoming outings." items={outings} href="/outings" />
        <Card>
          <CardHeader><CardTitle className="text-base">Executive KPI Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <KpiRow label="Occupancy" value={occupancy} />
            <KpiRow label="Care plan compliance" value={carePlanCompliance} />
            <KpiRow label="Assessment compliance" value={assessmentCompliance} />
            <KpiRow label="Intervention adherence" value={dailyAdherence} />
            <KpiRow label="Governance score" value={governance} />
          </CardContent>
        </Card>
      </div>

      <RoleSection title="Weekly / Monthly Activity">
        <div className="grid md:grid-cols-2 gap-3">
          <ActivityBand title="This Week" data={d.activitySince(d.weekStart)} />
          <ActivityBand title="This Month" data={d.activitySince(d.monthStart)} />
        </div>
      </RoleSection>
    </RolePage>
  );
}

function CnmDashboard() {
  const d = useRoleDashboardData("assigned");
  const incidentsOpen = d.incidents.filter((i) => i.status !== "closed" || i.followUpRequired);
  return (
    <RolePage title="CNM dashboard" subtitle="unit workload and shift oversight">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
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
  href: string;
  tone: "danger" | "warn" | "info" | "default";
};

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
      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
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

function NurseDashboard() {
  return <OperationsHub />;
}

function HcaDashboard() {
  const { recordDailyCare, operationalContext } = useCare();
  const d = useRoleDashboardData("assigned");
  const [selectedDailyCareResident, setSelectedDailyCareResident] = useState<Resident | null>(null);
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
          {residents.slice(0, 8).map((r) => <ResidentCard key={r.id} resident={r} hca compact onRecordDailyCare={setSelectedDailyCareResident} />)}
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
    </RolePage>
  );
}

function buildShiftWorkQueue(
  d: ReturnType<typeof useRoleDashboardData>,
  residentIds: Set<string>,
  hcaOnly: boolean,
): WorkQueueItem[] {
  const now = new Date();
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
    .forEach((scheduled) => {
      addResidentItem(scheduled.intervention.residentId, {
        id: `intervention-${scheduled.intervention.id}`,
        workType: "Care intervention",
        title: scheduled.intervention.name,
        dueLabel: scheduledInterventionDueLabel(scheduled, now),
        dueAt: scheduled.dueAt || undefined,
        status: scheduled.status,
        tone: scheduled.status === "overdue" ? "danger" : scheduled.status === "due_now" ? "warn" : "info",
      });
    });

  if (!hcaOnly) {
    d.tasks
      .filter((task) => task.status !== "completed" && task.status !== "deleted" && (!task.residentId || residentIds.has(task.residentId)))
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
          tone: status === "overdue" ? "danger" : "warn",
        });
      });

    d.dueAssessments
      .filter((assessment) => residentIds.has(assessment.residentId))
      .slice(0, 20)
      .forEach((assessment) => {
        addResidentItem(assessment.residentId, {
          id: `assessment-${assessment.id}`,
          workType: "Assessment",
          title: `${assessment.type.replace("_", " ")} assessment due`,
          dueLabel: assessment.status === "review_due" ? "Review due" : "Due today",
          status: "due_today",
          tone: "info",
        });
      });
  }

  d.observationPlans.forEach((plan) => {
    if (!residentIds.has(plan.residentId)) return;
    const compliance = complianceForResident(plan, d.vitals.filter((v) => v.residentId === plan.residentId), now);
    compliance.items
      .filter((item) => item.status === "missed" || item.status === "overdue" || item.status === "due_today")
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

  if (!hcaOnly) {
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

function ResidentCard({ resident, hca = false, compact = false, onRecordDailyCare }: { resident: Resident; hca?: boolean; compact?: boolean; onRecordDailyCare?: (resident: Resident) => void }) {
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
          {onRecordDailyCare && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button size="sm" variant="outline" asChild><Link to="/residents/$id" params={{ id: resident.id }}>Open</Link></Button>
              <Button size="sm" onClick={() => onRecordDailyCare(resident)}>Record Care</Button>
            </div>
          )}
        </CardContent>
      </Card>
  );
  if (onRecordDailyCare) return content;
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

  const { residents, assessments, carePlans, alerts, notes, tasks, currentUser } = useCare();
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
