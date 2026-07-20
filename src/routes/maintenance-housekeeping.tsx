import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bed,
  Box,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Droplets,
  FileText,
  Flame,
  Home,
  Package,
  RefreshCw,
  Settings,
  ShieldCheck,
  Siren,
  Thermometer,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCare } from "@/lib/care/store";

export const Route = createFileRoute("/maintenance-housekeeping")({
  head: () => ({ meta: [{ title: "Maintenance & Housekeeping Dashboard - NuCare" }] }),
  component: MaintenanceHousekeepingDashboard,
});

function MaintenanceHousekeepingDashboard() {
  const { currentRole } = useCare();

  if (currentRole !== "don" && currentRole !== "group_owner") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Maintenance & Housekeeping is available to DON users only.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f5f8fc] p-4 text-[#071832] md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">
            Maintenance & Housekeeping Dashboard
          </h1>
          <p className="mt-1 text-sm text-[#536176]">Overview Across All Care Homes</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TopFilter icon={CalendarDays} label="20 May 2025" />
          <TopFilter label="All Care Homes" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <Bell className="h-5 w-5 text-[#071832]" />
            <span className="absolute -right-0.5 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#ef2e2e] text-[10px] font-bold text-white">
              8
            </span>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-slate-500">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <div className="font-semibold">Brian O'Donnell</div>
              <div className="text-[#536176]">Area Manager</div>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#dce9f8] text-sm font-bold text-[#0b4f93]">
              BO
            </div>
          </div>
          <button className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-[#0b4f93] shadow-sm">
            Export Report
          </button>
        </div>
      </div>

      <section className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7">
        <MaintKpi icon={Wrench} title="Open Work Orders" value="42" foot="High Priority: 7" percent={42} tone="red" />
        <MaintKpi icon={CalendarDays} title="Planned Maintenance Due This Month" value="68" foot="78% Completed" percent={68} tone="orange" />
        <MaintKpi icon={ShieldCheck} title="Preventive Maintenance Compliance" value="92%" foot="vs 89% last month" percent={92} tone="green" trend />
        <MaintKpi icon={ShieldCheck} title="Safety & Compliance Score" value="94%" foot="vs 91% last month" percent={94} tone="teal" trend />
        <MaintKpi icon={ClipboardList} title="Overdue Inspections" value="9" foot="Require Attention" percent={0} tone="red" simple />
        <MaintKpi icon={Box} title="Total Assets" value="1,248" foot="Operational: 1,102" percent={74} tone="purple" />
        <MaintKpi icon={Home} title="Housekeeping Score" value="91%" foot="vs 88% last month" percent={91} tone="green" trend />
      </section>

      <section className="mb-3 grid gap-3 xl:grid-cols-2 2xl:grid-cols-[1fr_1fr_1.12fr]">
        <Panel title="Work Orders Summary" action="View All">
          <div className="grid gap-4 md:grid-cols-[1fr_150px]">
            <StatusList rows={[
              ["Open", "42", "red", Wrench],
              ["In Progress", "18", "orange", Settings],
              ["On Hold", "6", "yellow", Package],
              ["Completed This Month", "156", "green", CheckCircle2],
              ["Cancelled", "3", "slate", AlertTriangle],
            ]} />
            <Donut value={225} label="Total" colors={["#ef3434", "#f78f1e", "#f6c344", "#35a85a", "#9aa4b2"]} />
          </div>
        </Panel>

        <Panel title="Work Orders by Priority" action="View All">
          <div className="grid gap-4 md:grid-cols-[1fr_150px]">
            <PlainRows rows={[
              ["Critical", "7", "16%", "red"],
              ["High", "35", "78%", "orange"],
              ["Medium", "52", "23%", "yellow"],
              ["Low", "95", "42%", "green"],
              ["Routine", "36", "16%", "slate"],
            ]} />
            <Donut value={225} label="Total" colors={["#ef3434", "#f78f1e", "#f6c344", "#35a85a", "#9aa4b2"]} />
          </div>
        </Panel>

        <Panel title="Compliance & Safety Overview" action="View All">
          <div className="overflow-x-auto">
          <div className="grid min-w-[520px] grid-cols-[1fr_80px_120px_120px] border-b pb-2 text-xs font-semibold text-[#536176]">
            <span>Area</span><span>Status</span><span>Due / Last Test</span><span>Next Due</span>
          </div>
          {[
            ["Fire Alarm Test", "ok", "12 May 2025", "12 Jun 2025"],
            ["Fire Door Checks", "due", "05 May 2025", "05 Jun 2025"],
            ["Emergency Lighting", "ok", "28 Apr 2025", "28 May 2025"],
            ["Legionella Testing", "ok", "30 Apr 2025", "30 Jul 2025"],
            ["Water Temperature Checks", "ok", "19 May 2025", "26 May 2025"],
            ["Lift Safety Inspection", "ok", "15 May 2025", "15 Aug 2025"],
            ["Gas Safety Check", "ok", "02 May 2025", "02 Nov 2025"],
            ["PAT Testing", "due", "10 May 2025", "10 Jun 2025"],
          ].map(([area, status, last, next]) => (
            <div key={area} className="grid min-w-[520px] grid-cols-[1fr_80px_120px_120px] border-b py-2 text-xs last:border-b-0">
              <span>{area}</span>
              <span>{status === "ok" ? <CheckCircle2 className="h-4 w-4 text-[#28a956]" /> : <AlertTriangle className="h-4 w-4 text-[#f59b21]" />}</span>
              <span>{last}</span>
              <span>{next}</span>
            </div>
          ))}
          </div>
          <div className="mt-5 flex gap-5 text-xs">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-[#28a956]" /> Compliant</span>
            <span className="flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-[#f59b21]" /> Overdue / Due Soon</span>
          </div>
        </Panel>
      </section>

      <section className="mb-3 grid gap-3 xl:grid-cols-2 2xl:grid-cols-[1fr_1fr_1.12fr]">
        <Panel title="Planned Maintenance Calendar" subtitle="(Next 7 Days)" action="View Calendar">
          <div className="grid grid-cols-7 overflow-hidden rounded-lg border text-center">
            {[
              ["Tue", "20 May", "8"],
              ["Wed", "21 May", "12"],
              ["Thu", "22 May", "9"],
              ["Fri", "23 May", "11"],
              ["Sat", "24 May", "5"],
              ["Sun", "25 May", "3"],
              ["Mon", "26 May", "10"],
            ].map(([day, date, total]) => (
              <div key={day} className="border-r bg-white p-3 last:border-r-0 first:bg-[#f4f8ff]">
                <div className="text-xs font-semibold">{day}</div>
                <div className="mt-1 text-[10px] text-[#536176]">{date}</div>
                <div className="mt-4 text-lg font-bold text-[#0b3b78]">{total}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-5 text-xs font-semibold">
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Total Scheduled: 58</span>
            <Legend dot="green" label="Completed: 32" />
            <Legend dot="orange" label="In Progress: 8" />
            <Legend dot="slate" label="Pending: 18" />
          </div>
        </Panel>

        <Panel title="Asset Condition Overview" action="View Assets">
          <div className="grid gap-4 md:grid-cols-[1fr_150px]">
            <PlainRows rows={[
              ["Excellent", "612", "49%", "green"],
              ["Good", "398", "32%", "blue"],
              ["Fair", "168", "13%", "orange"],
              ["Poor", "52", "4%", "red"],
              ["Out of Service", "18", "2%", "slate"],
            ]} />
            <Donut value="1,248" label="Total Assets" colors={["#32a95c", "#1f70d6", "#f78f1e", "#e33a3a", "#9aa4b2"]} />
          </div>
        </Panel>
      </section>

      <section className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-4">
        <Panel title="Critical Safety Items Requiring Attention">
          <IssueRows rows={[
            ["Fire Doors Need Checking", "12", Flame],
            ["Fire Extinguishers Due Service", "8", Siren],
            ["Emergency Lighting Faults", "6", ClipboardCheck],
            ["Handrails / Grab Rails Loose", "4", Settings],
            ["Nurse Call System Faults", "3", Bell],
          ]} footer="View All Safety Issues" />
        </Panel>

        <Panel title="Equipment & Assets Requiring Attention">
          <IssueRows rows={[
            ["Beds Need Replacing", "14", Bed],
            ["Mattresses Due Replacement", "22", Briefcase],
            ["Wheelchairs Due Service", "9", Settings],
            ["Hoists Due Service", "6", Wrench],
            ["TVs / Remotes Faulty", "7", FileText],
          ]} footer="View All Assets" />
        </Panel>

        <Panel title="Housekeeping Overview" action="View All">
          <div className="flex flex-col items-center">
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-[conic-gradient(#2ea85b_0deg,#2ea85b_328deg,#e9edf2_328deg,#e9edf2_360deg)]">
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                <div className="text-3xl font-bold">91%</div>
                <div className="text-[11px] font-semibold">Housekeeping Score</div>
              </div>
            </div>
            <div className="mt-4 grid w-full grid-cols-4 gap-2 text-center text-xs">
              <HouseItem icon={ShieldCheck} label="Cleanliness" value="92%" tone="green" />
              <HouseItem icon={Package} label="Laundry" value="90%" tone="purple" />
              <HouseItem icon={Trash2} label="Waste Mgmt" value="93%" tone="blue" />
              <HouseItem icon={Droplets} label="Supplies" value="89%" tone="orange" />
            </div>
          </div>
        </Panel>

        <Panel title="Inventory & Supplies" action="View All">
          <StatusList rows={[
            ["Low Stock Items", "15", "orange", Package],
            ["Out of Stock Items", "4", "red", AlertTriangle],
            ["Orders Pending", "8", "blue", ClipboardList],
            ["Supplies On Order", "23", "green", FileText],
          ]} />
          <PanelFooter label="View Inventory Report" />
        </Panel>
      </section>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#536176]">
        <span>Data last refreshed: 20 May 2025 08:30</span>
        <RefreshCw className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

function TopFilter({ icon: Icon, label }: { icon?: typeof CalendarDays; label: string }) {
  return (
    <button className="flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold shadow-sm">
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}

function MaintKpi({
  icon: Icon,
  title,
  value,
  foot,
  percent,
  tone,
  trend,
  simple,
}: {
  icon: typeof Wrench;
  title: string;
  value: string;
  foot: string;
  percent: number;
  tone: "red" | "orange" | "green" | "teal" | "purple";
  trend?: boolean;
  simple?: boolean;
}) {
  const color = toneColor(tone);
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#f2f6fb]">
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="text-xs font-bold leading-tight">{title}</div>
      </div>
      <div className="mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-full"
        style={{ background: simple ? "#fff" : `conic-gradient(${color} ${percent * 3.6}deg, #e8edf3 0deg)` }}
      >
        <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white text-2xl font-bold" style={{ color: simple ? color : "#071832" }}>
          {value}
        </div>
      </div>
      <div className="mt-3 text-center text-xs font-semibold" style={{ color: tone === "red" ? "#d9272e" : "#536176" }}>
        {foot} {trend && <span className="ml-1 text-[#26a956]">↑</span>}
      </div>
    </div>
  );
}

function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-base font-bold">
          {title} {subtitle && <span className="text-xs font-medium text-[#536176]">{subtitle}</span>}
        </h2>
        {action && <button className="text-xs font-semibold text-[#0b4f93]">{action}</button>}
      </div>
      {children}
    </div>
  );
}

function StatusList({ rows }: { rows: Array<[string, string, string, typeof Wrench]> }) {
  return (
    <div className="space-y-1">
      {rows.map(([label, value, tone, Icon]) => (
        <div key={label} className="flex items-center justify-between border-b py-2 text-sm last:border-b-0">
          <span className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full" style={{ backgroundColor: `${toneColor(tone)}18`, color: toneColor(tone) }}>
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </span>
          <span className="font-bold" style={{ color: toneColor(tone) }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function PlainRows({ rows }: { rows: Array<[string, string, string, string]> }) {
  return (
    <div className="space-y-1">
      {rows.map(([label, value, pct, tone]) => (
        <div key={label} className="grid grid-cols-[1fr_50px_50px] items-center border-b py-2 text-sm last:border-b-0">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: toneColor(tone) }} />{label}</span>
          <span className="font-bold">{value}</span>
          <span>{pct}</span>
        </div>
      ))}
    </div>
  );
}

function Donut({ value, label, colors }: { value: string | number; label: string; colors: string[] }) {
  const stops = colors
    .map((color, index) => `${color} ${index * 72}deg ${(index + 1) * 72}deg`)
    .join(", ");
  return (
    <div className="flex items-center justify-center">
      <div className="flex h-32 w-32 items-center justify-center rounded-full" style={{ background: `conic-gradient(${stops})` }}>
        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white">
          <div className="text-xl font-bold">{value}</div>
          <div className="text-xs">{label}</div>
        </div>
      </div>
    </div>
  );
}

function IssueRows({ rows, footer }: { rows: Array<[string, string, typeof Wrench]>; footer: string }) {
  return (
    <>
      <div className="space-y-1">
        {rows.map(([label, value, Icon]) => (
          <div key={label} className="flex items-center justify-between border-b py-2 text-sm last:border-b-0">
            <span className="flex items-center gap-3"><Icon className="h-4 w-4 text-[#0b3b78]" />{label}</span>
            <span className="font-bold text-[#e22d35]">{value}</span>
          </div>
        ))}
      </div>
      <PanelFooter label={footer} />
    </>
  );
}

function PanelFooter({ label }: { label: string }) {
  return (
    <Link to="/tasks" className="mt-5 flex items-center justify-between text-xs font-semibold text-[#0b4f93]">
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: toneColor(dot) }} />{label}</span>;
}

function HouseItem({ icon: Icon, label, value, tone }: { icon: typeof Wrench; label: string; value: string; tone: string }) {
  return (
    <div>
      <div className="mx-auto grid h-9 w-9 place-items-center rounded-full" style={{ backgroundColor: `${toneColor(tone)}18`, color: toneColor(tone) }}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-1 font-semibold">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function toneColor(tone: string) {
  const colors: Record<string, string> = {
    red: "#e22d35",
    orange: "#f78f1e",
    yellow: "#f6c344",
    green: "#2ea85b",
    teal: "#1399a5",
    purple: "#7b3fd6",
    blue: "#1f70d6",
    slate: "#9aa4b2",
  };
  return colors[tone] || colors.slate;
}
