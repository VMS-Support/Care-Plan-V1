import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  GraduationCap,
  Grid2X2,
  Medal,
  Plus,
  Send,
  ShieldCheck,
  UploadCloud,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCare } from "@/lib/care/store";
import { getTrainingComplianceMetric, getTrainingNotStartedMetric, getTrainingOverdueMetric } from "@/domain/workforce";

export const Route = createFileRoute("/training-dashboard")({
  head: () => ({ meta: [{ title: "Training Dashboard - NuCare" }] }),
  component: TrainingDashboard,
});

function TrainingDashboard() {
  const care = useCare();
  const { currentRole } = care;
  const allowed = currentRole === "cnm" || currentRole === "don" || currentRole === "group_owner";
  const trainingCompliance = getTrainingComplianceMetric({ assignments: care.staffTrainingAssignments, completions: care.staffTrainingCompletions, courses: care.trainingCourses });
  const trainingOverdue = getTrainingOverdueMetric({ assignments: care.staffTrainingAssignments, completions: care.staffTrainingCompletions, courses: care.trainingCourses });
  const trainingNotStarted = getTrainingNotStartedMetric({ assignments: care.staffTrainingAssignments, completions: care.staffTrainingCompletions, courses: care.trainingCourses });
  const inProgress = trainingCompliance.inProgressAssignments.length + trainingCompliance.pendingVerificationAssignments.length;
  const completedThisMonth = care.staffTrainingCompletions.filter((completion) => completion.completionDate?.startsWith("2026-07")).length;

  if (!allowed) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Training dashboard access is available to CNM and DON users.
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
          <p className="mt-1 text-sm text-[#536176]">
            Real-time overview of training compliance, learning activity and staff development.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <HeaderButton icon={CalendarDays} label="20 May 2025" />
          <HeaderButton label="All Care Homes" />
          <HeaderButton icon={Filter} label="Filters" />
          <div className="relative grid h-10 w-10 place-items-center rounded-lg bg-white shadow-sm">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#ef3333] text-[10px] font-bold text-white">6</span>
          </div>
          <HeaderButton icon={Download} label="Export" />
        </div>
      </header>

      <section className="mb-3 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <TrainingKpi icon={ShieldCheck} title="Overall Compliance" value={trainingCompliance.percentage === undefined ? "N/A" : `${trainingCompliance.percentage}%`} sub="Compliant" foot="live metric" change={`${trainingCompliance.numerator}`} trend="up" percent={trainingCompliance.percentage ?? 0} tone="green" />
        <TrainingKpi icon={GraduationCap} title="Mandatory Training" value={trainingCompliance.percentage === undefined ? "N/A" : `${trainingCompliance.percentage}%`} sub="Compliant" foot="mandatory assignments" change={`${trainingCompliance.denominator}`} trend="up" percent={trainingCompliance.percentage ?? 0} tone="purple" />
        <TrainingKpi icon={Clock3} title="Overdue Training" value={String(trainingOverdue.value)} sub="Overdue" foot="live metric" change={String(trainingOverdue.expired.length)} trend="upBad" percent={0} tone="red" noRing />
        <TrainingKpi icon={Users} title="Training In Progress" value={String(inProgress)} sub="In Progress" foot="pending or in progress" change={String(trainingCompliance.pendingVerificationAssignments.length)} trend="up" percent={trainingCompliance.denominator ? Math.round((inProgress / trainingCompliance.denominator) * 100) : 0} tone="orange" />
        <TrainingKpi icon={Medal} title="Courses Completed" value={String(completedThisMonth)} sub="This Month" foot="verified or pending" change={String(care.staffTrainingCompletions.length)} trend="up" percent={72} tone="blue" />
        <TrainingKpi icon={Clock3} title="Total Training Hours" value="2,356" sub="This Month" foot="vs last month" change="10%" trend="up" percent={74} tone="teal" />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <Panel title="Mandatory Training Compliance by Category">
          <div className="space-y-3">
            {[
              ["Health & Safety", "92%", "6%", "up"],
              ["Medication Management", "88%", "5%", "up"],
              ["Infection Prevention", "90%", "7%", "up"],
              ["Safeguarding Adults", "85%", "3%", "up"],
              ["Manual Handling", "78%", "2%", "down"],
              ["Fire Safety", "82%", "4%", "up"],
              ["Food Safety", "76%", "1%", "down"],
              ["Dementia Care", "80%", "6%", "up"],
            ].map(([label, pct, change, trend]) => (
              <CategoryRow key={label} label={label} pct={pct} change={change} trend={trend} />
            ))}
          </div>
          <PanelLink to="/reports" label="View Compliance by Home" />
        </Panel>

        <Panel title="Training Status Overview">
          <div className="grid gap-5 md:grid-cols-[170px_1fr]">
            <Donut value="1,568" label="Total Staff" segments={["#25a95a", "#ff8a13", "#ef3333", "#9aa8b8"]} />
            <Legend rows={[
              ["Compliant", String(trainingCompliance.numerator), trainingCompliance.percentage === undefined ? "N/A" : `${trainingCompliance.percentage}%`, "#25a95a"],
              ["In Progress", String(inProgress), "", "#ff8a13"],
              ["Overdue", String(trainingOverdue.value), "", "#ef3333"],
              ["Not Started", String(trainingNotStarted.value), "", "#9aa8b8"],
            ]} />
          </div>
          <div className="mt-5 grid grid-cols-4 rounded-lg bg-[#f8fafc] text-center text-xs">
            <StatusStat label="Compliant" value={String(trainingCompliance.numerator)} tone="green" />
            <StatusStat label="In Progress" value={String(inProgress)} tone="orange" />
            <StatusStat label="Overdue" value={String(trainingOverdue.value)} tone="red" />
            <StatusStat label="Not Started" value={String(trainingNotStarted.value)} tone="navy" />
          </div>
        </Panel>

        <Panel title="Overdue Training" suffix="(By Days Overdue)" action="View All">
          <div className="space-y-4">
            {[
              ["Basic Life Support", "25 Staff", "31+ days"],
              ["Medication Administration", "18 Staff", "31+ days"],
              ["Manual Handling", "22 Staff", "16 - 30 days"],
              ["Fire Safety Awareness", "15 Staff", "16 - 30 days"],
              ["Infection Prevention", "20 Staff", "8 - 15 days"],
            ].map(([label, staff, days]) => (
              <OverdueRow key={label} label={label} staff={staff} days={days} />
            ))}
          </div>
          <PanelLink to="/reports" label="View All Overdue" />
        </Panel>

        <Panel title="Training Completion Trend">
          <TrainingTrend />
          <div className="mt-5 grid grid-cols-3 rounded-lg bg-[#f8fafc] text-center text-sm">
            <StatusStat label="This Month" value="1,248" tone="navy" />
            <StatusStat label="Last Month" value="1,085" tone="navy" />
            <StatusStat label="% Change" value="15%" tone="green" />
          </div>
        </Panel>

        <Panel title="Categories Needing Attention" action="View Report">
          <div className="space-y-4">
            {[
              ["Food Safety", "76%", "1%", "down"],
              ["Safeguarding Adults", "85%", "3%", "up"],
              ["Fire Safety", "82%", "4%", "up"],
              ["Manual Handling", "78%", "2%", "down"],
            ].map(([label, pct, change, trend]) => (
              <AttentionRow key={label} label={label} pct={pct} change={change} trend={trend} />
            ))}
          </div>
          <PanelLink to="/reports" label="Focus on closing compliance gaps" />
        </Panel>

        <Panel title="Upcoming Training" suffix="(Next 7 Days)" action="View Calendar">
          <div className="space-y-3">
            <UpcomingTraining date="21 MAY" course="Dementia Awareness" home="Riverside Lodge" time="09:00 AM" seats="12 Seats" />
            <UpcomingTraining date="22 MAY" course="Moving & Handling Refresher" home="Meadow View" time="10:00 AM" seats="8 Seats" />
            <UpcomingTraining date="23 MAY" course="Medication Management Update" home="Oakview Care Home" time="02:00 PM" seats="15 Seats" />
          </div>
          <PanelLink to="/reports" label="View All Upcoming" />
        </Panel>

        <Panel title="Training by Delivery Method">
          <div className="grid gap-5 md:grid-cols-[150px_1fr]">
            <Donut value="" label="" segments={["#25a95a", "#0f6ed8", "#ff8a13", "#ef3333"]} />
            <Legend rows={[
              ["Classroom", "32%", "752", "#25a95a"],
              ["eLearning", "45%", "1,060", "#0f6ed8"],
              ["Blended", "15%", "353", "#ff8a13"],
              ["Webinar", "8%", "188", "#ef3333"],
            ]} />
          </div>
          <div className="mt-5 rounded-lg bg-[#f3faf4] p-3">
            <h3 className="mb-2 text-xs font-bold text-[#1c7f42]">Most Popular eLearning Courses</h3>
            <ol className="space-y-1 text-xs">
              <li>1&nbsp;&nbsp; Infection Prevention & Control <span className="float-right">428 Completions</span></li>
              <li>2&nbsp;&nbsp; Safeguarding Adults <span className="float-right">366 Completions</span></li>
              <li>3&nbsp;&nbsp; Medication Administration <span className="float-right">312 Completions</span></li>
            </ol>
          </div>
          <PanelLink to="/reports" label="View All Courses" />
        </Panel>

        <Panel title="Staff Training Compliance" className="xl:col-span-2" action="View All">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[#536176]">
                {["Home", "Total Staff", "Compliant", "In Progress", "Overdue", "Compliance %"].map((header) => <th key={header} className="pb-3 font-medium">{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ["Riverside Lodge", "124", "110", "8", "6", "89%"],
                ["Meadow View", "98", "81", "12", "5", "83%"],
                ["Oakview Care Home", "112", "95", "9", "8", "85%"],
                ["Greenfield House", "87", "72", "7", "8", "83%"],
                ["Lakeside Manor", "76", "66", "6", "4", "88%"],
              ].map((row) => (
                <tr key={row[0]} className="border-t border-[#edf1f6]">
                  {row.map((cell, index) => (
                    <td key={index} className={`py-3 ${index === 4 ? "text-[#ef3333]" : ""}`}>
                      {index === 5 ? <span className="flex items-center gap-3">{cell}<span className="h-1.5 flex-1 rounded bg-[#edf1f6]"><span className="block h-full rounded bg-[#25a95a]" style={{ width: cell }} /></span></span> : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <PanelLink to="/reports" label="View All Homes" />
        </Panel>

        <Panel title="Competency & Certification Summary" action="View Matrix">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Certification icon={Medal} title="Active Certifications" value="412" note="21 this month" tone="purple" />
            <Certification icon={Medal} title="Expiring Soon" value="37" note="Next 30 days" tone="green" />
            <Certification icon={Medal} title="Expired" value="15" note="Requires action" tone="orange" />
            <Certification icon={Medal} title="Competencies Met" value="78%" note="vs target 80%" tone="blue" />
          </div>
          <PanelLink to="/reports" label="View Competency Matrix" />
        </Panel>

        <Panel title="Quick Actions">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <QuickAction icon={Plus} label="Assign Training" />
            <QuickAction icon={Users} label="Bulk Enrolment" />
            <QuickAction icon={BookOpen} label="Add New Course" />
            <QuickAction icon={UploadCloud} label="Upload Content" />
            <QuickAction icon={Grid2X2} label="Generate Report" />
            <QuickAction icon={CalendarDays} label="Training Calendar" />
            <QuickAction icon={Send} label="Send Reminder" />
            <QuickAction icon={Grid2X2} label="Training Matrix" />
          </div>
        </Panel>
      </section>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#536176]">
        <span>Data last refreshed: 20 May 2025 08:30 AM</span>
        <span className="text-base">↻</span>
      </div>
    </div>
  );
}

function HeaderButton({ icon: Icon, label }: { icon?: any; label: string }) {
  return (
    <button className="flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium shadow-sm">
      {Icon && <Icon className="h-4 w-4" />}
      {label}
      {label !== "Filters" && label !== "Export" && <span className="text-[#6d7788]">⌄</span>}
    </button>
  );
}

function TrainingKpi({ icon: Icon, title, value, sub, foot, change, trend, percent, tone, noRing }: { icon: any; title: string; value: string; sub: string; foot: string; change: string; trend: "up" | "upBad"; percent: number; tone: Tone; noRing?: boolean }) {
  const color = palette(tone);
  return (
    <Card className="rounded-[10px] border-0 shadow-[0_8px_18px_rgba(10,31,68,0.06)]">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-4">
          <div className="grid h-10 w-10 place-items-center rounded-full" style={{ backgroundColor: color.soft, color: color.main }}><Icon className="h-5 w-5" /></div>
          <div className="text-xs font-bold">{title}</div>
        </div>
        <div className="flex justify-center">
          {noRing ? (
            <div className="grid h-[108px] place-items-center text-center">
              <div>
                <div className="text-[32px] font-bold">{value}</div>
                <div className="text-xs">{sub}</div>
              </div>
            </div>
          ) : (
            <div className="grid h-[108px] w-[108px] place-items-center rounded-full" style={{ background: `conic-gradient(${color.main} ${percent * 3.6}deg, #e9eef5 0deg)` }}>
              <div className="grid h-[82px] w-[82px] place-items-center rounded-full bg-white text-center">
                <div>
                  <div className="text-[28px] font-bold leading-none">{value}</div>
                  <div className="mt-1 text-xs">{sub}</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 text-xs">
          <span>{foot}</span>
          {trend === "up" ? <ArrowUp className="h-3.5 w-3.5 text-[#25a95a]" /> : <ArrowUp className="h-3.5 w-3.5 text-[#ef3333]" />}
          <span className={trend === "up" ? "text-[#25a95a]" : "text-[#ef3333]"}>{change}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Panel({ title, suffix, action, children, className = "" }: { title: string; suffix?: string; action?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={`rounded-[10px] border-0 shadow-[0_8px_18px_rgba(10,31,68,0.06)] ${className}`}>
      <CardContent className="p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold">{title} {suffix && <span className="ml-1 text-xs font-medium">{suffix}</span>}</h2>
          {action && <Link to="/reports" className="text-xs font-medium text-[#0b4f93]">{action}</Link>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function CategoryRow({ label, pct, change, trend }: { label: string; pct: string; change: string; trend: string }) {
  return (
    <div className="grid grid-cols-[1fr_1.3fr_42px_52px] items-center gap-3 text-xs">
      <span>{label}</span>
      <span className="h-2 rounded bg-[#edf1f6]"><span className="block h-full rounded bg-[#25a95a]" style={{ width: pct }} /></span>
      <span>{pct}</span>
      <span className={`flex items-center gap-1 ${trend === "up" ? "text-[#25a95a]" : "text-[#ef3333]"}`}>{trend === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{change}</span>
    </div>
  );
}

function Donut({ value, label, segments }: { value: string; label: string; segments: string[] }) {
  const stops = segments.map((color, index) => `${color} ${index * (360 / segments.length)}deg ${(index + 1) * (360 / segments.length)}deg`).join(",");
  return (
    <div className="grid h-[150px] w-[150px] place-items-center rounded-full" style={{ background: `conic-gradient(${stops})` }}>
      <div className="grid h-[98px] w-[98px] place-items-center rounded-full bg-white text-center">
        <div>
          {value && <div className="text-2xl font-bold">{value}</div>}
          {label && <div className="text-xs">{label}</div>}
        </div>
      </div>
    </div>
  );
}

function Legend({ rows }: { rows: Array<[string, string, string, string]> }) {
  return <div className="space-y-4">{rows.map(([label, value, pct, color]) => <div key={label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span><span className="font-bold">{value}</span><span>({pct})</span></div>)}</div>;
}

function StatusStat({ label, value, tone }: { label: string; value: string; tone: Tone | "navy" }) {
  const color = tone === "navy" ? "#071832" : palette(tone).main;
  return (
    <div className="border-r border-[#edf1f6] p-3 last:border-r-0">
      <div className="text-[11px] text-[#536176]">{label}</div>
      <div className="mt-1 text-lg font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function OverdueRow({ label, staff, days }: { label: string; staff: string; days: string }) {
  const severe = days.includes("31");
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm">
      <span className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-[#ef3333]" />{label}</span>
      <span>{staff}</span>
      <span className={severe ? "text-[#ef3333]" : "text-[#d97706]"}>{days}</span>
    </div>
  );
}

function TrainingTrend() {
  const bars = [890, 1040, 1030, 1090, 1180, 1340];
  const max = 1500;
  const months = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  return (
    <div className="h-48">
      <div className="mb-2 flex justify-end gap-5 text-xs"><span className="flex items-center gap-1"><span className="h-2 w-2 bg-[#25a95a]" />Completed</span><span className="flex items-center gap-1"><span className="h-2 w-2 bg-[#0f6ed8]" />Target</span></div>
      <div className="grid h-36 grid-cols-6 items-end gap-5 border-b border-l border-[#edf1f6] px-4">
        {bars.map((value, index) => (
          <div key={months[index]} className="flex h-full flex-col justify-end">
            <span className="mb-2 h-1 rounded border-t-2 border-dotted border-[#0f6ed8]" />
            <span className="rounded-t bg-[#25a95a]" style={{ height: `${(value / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-5 px-4 pt-2 text-center text-xs text-[#536176]">{months.map((month) => <span key={month}>{month}</span>)}</div>
    </div>
  );
}

function AttentionRow({ label, pct, change, trend }: { label: string; pct: string; change: string; trend: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm">
      <span className="flex items-center gap-3"><BookOpen className="h-4 w-4 text-[#7d55d8]" />{label}</span>
      <span className="font-bold">{pct}</span>
      <span className={`flex items-center gap-1 ${trend === "up" ? "text-[#25a95a]" : "text-[#ef3333]"}`}>{trend === "up" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}{change}</span>
    </div>
  );
}

function UpcomingTraining({ date, course, home, time, seats }: { date: string; course: string; home: string; time: string; seats: string }) {
  return (
    <div className="grid grid-cols-[52px_1fr_auto_auto] items-center gap-3 text-xs">
      <div className="rounded-lg bg-[#e9f8ee] p-2 text-center font-bold text-[#25a95a]">{date}</div>
      <div><div className="font-semibold">{course}</div><div className="mt-1 text-[#536176]">{home}</div></div>
      <span>{time}</span>
      <Badge className="border-0 bg-[#f0ebff] text-[#6f45cc]">{seats}</Badge>
    </div>
  );
}

function Certification({ icon: Icon, title, value, note, tone }: { icon: any; title: string; value: string; note: string; tone: Tone }) {
  const color = palette(tone);
  return (
    <div className="rounded-lg border border-[#edf1f6] p-4 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full" style={{ backgroundColor: color.soft, color: color.main }}><Icon className="h-6 w-6" /></div>
      <div className="mt-3 text-xs text-[#536176]">{title}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
      <div className="mt-1 text-[11px] text-[#536176]">{note}</div>
    </div>
  );
}

function QuickAction({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="rounded-lg border border-[#edf1f6] p-4 text-center text-xs font-medium transition-colors hover:bg-[#f8fafc]">
      <Icon className="mx-auto mb-2 h-6 w-6 text-[#0b4f93]" />
      {label}
    </button>
  );
}

function PanelLink({ to, label }: { to: string; label: string }) {
  return <Link to={to as any} className="mt-5 flex items-center gap-2 text-xs font-medium text-[#0b4f93]">{label}<ArrowRight className="h-3.5 w-3.5" /></Link>;
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
