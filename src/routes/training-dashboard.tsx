import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCare } from "@/lib/care/store";
import { getTrainingDashboard, type TrainingDashboardMetric } from "@/domain/workforce";

export const Route = createFileRoute("/training-dashboard")({
  head: () => ({ meta: [{ title: "Training Dashboard - NuCare" }] }),
  component: TrainingDashboard,
});

const ALL = "all";

function TrainingDashboard() {
  const care = useCare();
  const [homeId, setHomeId] = useState(ALL);
  const [reportingDate, setReportingDate] = useState(new Date().toISOString().slice(0, 10));
  const [refreshedAt, setRefreshedAt] = useState(new Date().toISOString());
  const canView = care.canAccess("training.view") || care.canAccess("training.view_compliance") || care.canAccess("assessment.reports");
  const period = { from: `${reportingDate.slice(0, 7)}-01`, to: reportingDate };
  const dashboard = getTrainingDashboard({
    reportingDate,
    reportingPeriod: period,
    facilities: care.facilities,
    staffMembers: care.staffMembers,
    trainingCourses: care.trainingCourses,
    trainingRequirements: care.trainingRequirements,
    staffTrainingAssignments: care.staffTrainingAssignments,
    staffTrainingCompletions: care.staffTrainingCompletions,
    nursingHomeId: homeId === ALL ? undefined : homeId,
  });

  if (!canView) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Training dashboard access is restricted.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f5f8fc] p-4 text-[#071832] md:p-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Training Dashboard</h1>
          <p className="mt-1 text-sm text-[#536176]">Live overview of training compliance, completions and verification.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 items-center gap-2 rounded-lg bg-white px-3 text-sm font-medium shadow-sm">
            <CalendarDays className="h-4 w-4" />
            <input className="bg-transparent outline-none" type="date" value={reportingDate} onChange={(event) => setReportingDate(event.target.value)} />
          </div>
          <Select value={homeId} onValueChange={setHomeId}>
            <SelectTrigger className="h-11 w-[190px] border-0 bg-white shadow-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{dashboard.homeLabel}</SelectItem>
              {care.facilities.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <HeaderButton icon={Filter} label="Filters" disabled />
          <div className="relative grid h-10 w-10 place-items-center rounded-lg bg-white shadow-sm">
            <Bell className="h-5 w-5" />
            {dashboard.alerts.reduce((sum, alert) => sum + alert.count, 0) > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#ef3333] text-[10px] font-bold text-white">{dashboard.alerts.reduce((sum, alert) => sum + alert.count, 0)}</span>}
          </div>
          <HeaderButton icon={Download} label="Export" disabled={!care.canAccess("training.export")} />
          <Button className="h-11 bg-white text-[#071832] shadow-sm hover:bg-white" variant="ghost" onClick={() => setRefreshedAt(new Date().toISOString())}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
        </div>
      </header>

      <section className="mb-3 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <TrainingKpi icon={ShieldCheck} title="Overall Compliance" metric={dashboard.metrics.overallCompliance} tone="green" />
        <TrainingKpi icon={GraduationCap} title="Mandatory Training" metric={dashboard.metrics.mandatoryCompliance} tone="purple" />
        <TrainingKpi icon={Clock3} title="Overdue Training" metric={dashboard.metrics.overdueTraining} tone="red" />
        <TrainingKpi icon={Users} title="Training In Progress" metric={dashboard.metrics.trainingInProgress} tone="orange" />
        <TrainingKpi icon={CheckCircle2} title="Courses Completed" metric={dashboard.metrics.coursesCompleted} tone="blue" />
        <TrainingKpi icon={Clock3} title="Total Training Hours" metric={dashboard.metrics.totalTrainingHours} tone="teal" />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <Panel title="Mandatory Training Compliance by Category">
          {dashboard.mandatoryComplianceByCategory.length ? dashboard.mandatoryComplianceByCategory.map((item) => <CategoryRow key={item.category} label={title(item.category)} pct={item.compliancePercentage} target={item.targetPercentage} overdue={item.overdue} route={item.route} />) : <Empty text="No Training Requirements apply to the selected scope." />}
          <PanelLink to="/workforce/training?view=category-home" label="View Compliance by Home" />
        </Panel>

        <Panel title="Training Status Overview">
          <div className="grid gap-5 md:grid-cols-[160px_1fr]">
            <Donut value={String(dashboard.trainingStatusOverview.total)} label="Total Mandatory Assignments" percent={dashboard.trainingStatusOverview.total ? Math.round((dashboard.trainingStatusOverview.compliant / dashboard.trainingStatusOverview.total) * 100) : 0} />
            <div className="space-y-3 text-sm">
              <LegendRow label="Compliant" value={dashboard.trainingStatusOverview.compliant} color="#25a95a" />
              <LegendRow label="In Progress" value={dashboard.trainingStatusOverview.inProgress} color="#ff8a13" />
              <LegendRow label="Overdue" value={dashboard.trainingStatusOverview.overdue} color="#ef3333" />
              <LegendRow label="Not Started" value={dashboard.trainingStatusOverview.notStarted} color="#9aa8b8" />
              <LegendRow label="Pending Verification" value={dashboard.trainingStatusOverview.pendingVerification} color="#0f6ed8" />
            </div>
          </div>
          <p className="mt-4 text-xs text-[#536176]">{dashboard.trainingStatusOverview.explanation}</p>
        </Panel>

        <Panel title="Overdue Training" suffix="(By Days Overdue)" action="View All" actionTo="/workforce/training?status=overdue">
          {dashboard.overdueByAge.length ? dashboard.overdueByAge.map((item) => <OverdueRow key={item.label} item={item} />) : <Empty text="No Training Assignments match the selected filters." />}
        </Panel>

        <Panel title="Training Completion Trend">
          <Trend rows={dashboard.completionTrend} />
          <div className="mt-5 rounded-lg bg-[#f8fafc] p-3 text-xs text-[#536176]">No completion target configured. Target series hidden.</div>
        </Panel>

        <Panel title="Categories Needing Attention" action="View Report" actionTo="/workforce/training?view=attention">
          {dashboard.categoriesNeedingAttention.length ? dashboard.categoriesNeedingAttention.map((item) => <AttentionRow key={item.category} item={item} />) : <Empty text="No Training data is available for the selected Home." positive />}
        </Panel>

        <Panel title="Upcoming Training" suffix="(Next 7 Days)" action="View Calendar" actionTo="/workforce/training?view=calendar">
          {dashboard.upcomingSessions.length ? dashboard.upcomingSessions.map((item) => <div key={item.title}>{item.title}</div>) : <Empty text="No Training Sessions are scheduled within the selected period." />}
        </Panel>

        <Panel title="Training by Delivery Method">
          {dashboard.deliveryMethodBreakdown.length ? dashboard.deliveryMethodBreakdown.map((item) => <DeliveryRow key={item.deliveryMethod} item={item} />) : <Empty text="No Training Completions have been recorded." />}
          {dashboard.popularElearningCourses.length > 0 && <div className="mt-5 rounded-lg bg-[#f3faf4] p-3"><h3 className="mb-2 text-xs font-bold text-[#1c7f42]">Most Popular eLearning Courses</h3>{dashboard.popularElearningCourses.map((course, index) => <div key={course.courseTitle} className="text-xs">{index + 1}. {course.courseTitle}<span className="float-right">{course.completions} completions</span></div>)}</div>}
        </Panel>

        <Panel title="Staff Training Compliance" className="xl:col-span-2" action="View All" actionTo="/workforce/training?view=homes">
          {dashboard.homeCompliance.length ? <HomeTable rows={dashboard.homeCompliance} /> : <Empty text="No Training data is available for the selected Home." />}
        </Panel>

        <Panel title="Competency & Certification Summary" action="View Matrix" actionTo="/workforce/competencies">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryCard title="Active Certifications" metric={dashboard.certificationAndCompetencySummary.activeCertificates} />
            <SummaryCard title="Expiring Soon" metric={dashboard.certificationAndCompetencySummary.expiringSoon} />
            <SummaryCard title="Expired" metric={dashboard.certificationAndCompetencySummary.expired} />
            <SummaryCard title="Competencies Met" metric={dashboard.certificationAndCompetencySummary.competenciesMet} />
          </div>
        </Panel>

        <Panel title="Alerts & Notifications">
          {dashboard.alerts.filter((alert) => alert.count > 0).length ? dashboard.alerts.filter((alert) => alert.count > 0).map((alert) => <Link key={alert.label} to={alert.route as any} className="flex items-center justify-between rounded-lg border border-[#edf1f6] p-3 text-sm"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[#ef3333]" />{alert.label}</span><Badge className="bg-[#ef3333] text-white">{alert.count}</Badge></Link>) : <Empty text="No Training alerts require attention." positive />}
        </Panel>
      </section>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#536176]">
        <span>Data last refreshed: {formatDateTime(refreshedAt)}</span>
        <RefreshCw className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

function HeaderButton({ icon: Icon, label, disabled }: { icon: any; label: string; disabled?: boolean }) {
  return <button disabled={disabled} className="flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium shadow-sm disabled:opacity-60"><Icon className="h-4 w-4" />{label}</button>;
}

function TrainingKpi({ icon: Icon, title: kpiTitle, metric, tone }: { icon: any; title: string; metric: TrainingDashboardMetric; tone: Tone }) {
  const color = palette(tone);
  const percent = metric.percentage ?? 0;
  return (
    <Link to={metric.route as any}>
      <Card className="h-full rounded-[10px] border-0 shadow-[0_8px_18px_rgba(10,31,68,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(10,31,68,0.1)]">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-full" style={{ backgroundColor: color.soft, color: color.main }}><Icon className="h-5 w-5" /></div>
            <div className="text-xs font-bold">{kpiTitle}</div>
          </div>
          <div className="flex justify-center">
            <div className="grid h-[108px] w-[108px] place-items-center rounded-full" style={{ background: metric.percentage === undefined ? "#e9eef5" : `conic-gradient(${color.main} ${percent * 3.6}deg, #e9eef5 0deg)` }}>
              <div className="grid h-[82px] w-[82px] place-items-center rounded-full bg-white text-center">
                <div>
                  <div className="text-[22px] font-bold leading-none">{metric.value}</div>
                  <div className="mt-1 text-[11px] text-[#536176]">{metric.availability === "available" ? "Live" : title(metric.availability)}</div>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 min-h-8 text-center text-xs text-[#536176]">{metric.explanation}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function Panel({ title: panelTitle, suffix, action, actionTo, children, className = "" }: { title: string; suffix?: string; action?: string; actionTo?: string; children: React.ReactNode; className?: string }) {
  return <Card className={`rounded-[10px] border-0 shadow-[0_8px_18px_rgba(10,31,68,0.06)] ${className}`}><CardContent className="p-5"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-base font-bold">{panelTitle} {suffix && <span className="ml-1 text-xs font-medium">{suffix}</span>}</h2>{action && actionTo && <Link to={actionTo as any} className="text-xs font-medium text-[#0b4f93]">{action}</Link>}</div>{children}</CardContent></Card>;
}

function CategoryRow({ label, pct, target, overdue, route }: { label: string; pct?: number; target?: number; overdue: number; route: string }) {
  return <Link to={route as any} className="mb-3 grid grid-cols-[1fr_1.3fr_52px_80px] items-center gap-3 text-xs"><span>{label}</span><span className="h-2 rounded bg-[#edf1f6]"><span className="block h-full rounded bg-[#25a95a]" style={{ width: `${pct ?? 0}%` }} /></span><span>{pct === undefined ? "N/A" : `${pct}%`}</span><span className={overdue ? "text-[#ef3333]" : "text-[#536176]"}>{overdue ? `${overdue} overdue` : `target ${target}%`}</span></Link>;
}

function Donut({ value, label, percent }: { value: string; label: string; percent: number }) {
  return <div className="grid h-[150px] w-[150px] place-items-center rounded-full" style={{ background: `conic-gradient(#25a95a ${percent * 3.6}deg, #e9eef5 0deg)` }}><div className="grid h-[98px] w-[98px] place-items-center rounded-full bg-white text-center"><div><div className="text-2xl font-bold">{value}</div><div className="text-[11px]">{label}</div></div></div></div>;
}

function LegendRow({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span><span className="font-bold">{value}</span></div>;
}

function OverdueRow({ item }: { item: { label: string; staffCount: number; assignmentCount: number; oldestDueDate?: string; route: string } }) {
  return <Link to={item.route as any} className="mb-3 grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm"><span className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-[#ef3333]" />{item.label}</span><span>{item.staffCount} Staff</span><span className="text-[#ef3333]">{item.assignmentCount} assignments</span></Link>;
}

function Trend({ rows }: { rows: Array<{ label: string; verified: number; pendingVerification: number; failed: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.verified + row.pendingVerification + row.failed));
  return <div className="h-48"><div className="grid h-36 grid-cols-6 items-end gap-5 border-b border-l border-[#edf1f6] px-4">{rows.map((row) => <div key={row.label} className="flex h-full flex-col justify-end"><span className="rounded-t bg-[#25a95a]" style={{ height: `${(row.verified / max) * 100}%` }} /><span className="bg-[#ff8a13]" style={{ height: `${(row.pendingVerification / max) * 100}%` }} /><span className="bg-[#ef3333]" style={{ height: `${(row.failed / max) * 100}%` }} /></div>)}</div><div className="grid grid-cols-6 gap-5 px-4 pt-2 text-center text-xs text-[#536176]">{rows.map((row) => <span key={row.label}>{row.label.slice(5)}</span>)}</div></div>;
}

function AttentionRow({ item }: { item: { category: string; compliancePercentage?: number; overdue: number; reason: string; route: string } }) {
  return <Link to={item.route as any} className="mb-3 grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm"><span>{title(item.category)}</span><span className="font-bold">{item.compliancePercentage === undefined ? "N/A" : `${item.compliancePercentage}%`}</span><span className="text-[#ef3333]">{item.reason}</span></Link>;
}

function DeliveryRow({ item }: { item: { deliveryMethod: string; count: number; percentage?: number; route: string } }) {
  return <Link to={item.route as any} className="mb-3 grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm"><span>{title(item.deliveryMethod)}</span><span>{item.count}</span><span>{item.percentage ?? 0}%</span></Link>;
}

function HomeTable({ rows }: { rows: Array<{ homeName: string; totalAssignments: number; compliant: number; inProgress: number; overdue: number; compliancePercentage?: number; route: string }> }) {
  return <table className="w-full text-left text-xs"><thead><tr className="text-[#536176]">{["Home", "Assignments", "Compliant", "In Progress", "Overdue", "Compliance %"].map((header) => <th key={header} className="pb-3 font-medium">{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.homeName} className="border-t border-[#edf1f6]"><td className="py-3 font-medium"><Link to={row.route as any}>{row.homeName}</Link></td><td>{row.totalAssignments}</td><td>{row.compliant}</td><td>{row.inProgress}</td><td className={row.overdue ? "text-[#ef3333]" : ""}>{row.overdue}</td><td><span className="flex items-center gap-3">{row.compliancePercentage === undefined ? "N/A" : `${row.compliancePercentage}%`}<span className="h-1.5 flex-1 rounded bg-[#edf1f6]"><span className="block h-full rounded bg-[#25a95a]" style={{ width: `${row.compliancePercentage ?? 0}%` }} /></span></span></td></tr>)}</tbody></table>;
}

function SummaryCard({ title: cardTitle, metric }: { title: string; metric: TrainingDashboardMetric }) {
  return <Link to={metric.route as any} className="rounded-lg border border-[#edf1f6] p-4 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#e5f0ff] text-[#0f6ed8]"><GraduationCap className="h-5 w-5" /></div><div className="mt-3 text-xs text-[#536176]">{cardTitle}</div><div className="mt-1 text-xl font-bold">{metric.value}</div><div className="mt-1 text-[11px] text-[#536176]">{metric.availability === "available" ? "Live source" : title(metric.availability)}</div></Link>;
}

function Empty({ text, positive }: { text: string; positive?: boolean }) {
  return <div className="rounded-lg border border-dashed border-[#d8e0ea] bg-[#f8fafc] p-6 text-center text-sm text-[#536176]">{positive ? "Good news: " : ""}{text}</div>;
}

function PanelLink({ to, label }: { to: string; label: string }) {
  return <Link to={to as any} className="mt-5 inline-flex text-xs font-medium text-[#0b4f93]">{label}</Link>;
}

type Tone = "green" | "purple" | "red" | "orange" | "blue" | "teal";

function palette(tone: Tone) {
  return {
    green: { main: "#25a95a", soft: "#e6f7ed" },
    purple: { main: "#7438d5", soft: "#f0ebff" },
    red: { main: "#ef3333", soft: "#ffe8e8" },
    orange: { main: "#ff8a13", soft: "#fff1dd" },
    blue: { main: "#0f6ed8", soft: "#e5f0ff" },
    teal: { main: "#28a9ad", soft: "#e1f7f6" },
  }[tone];
}

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
