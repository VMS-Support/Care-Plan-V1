import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Filter,
  MessageCircle,
  Search,
  Shield,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCare } from "@/lib/care/store";

export const Route = createFileRoute("/quality-governance")({
  head: () => ({ meta: [{ title: "Quality & Governance Dashboard - NuCare" }] }),
  component: QualityGovernanceDashboard,
});

function QualityGovernanceDashboard() {
  const { currentRole, activeFacility } = useCare();
  const isGroupOwner = currentRole === "group_owner";
  const isDon = currentRole === "don";
  const scopeLabel = isGroupOwner ? "All Care Homes" : activeFacility?.name || "Current Nursing Home";

  if (!isGroupOwner && !isDon) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Quality & Governance is available to Group Owner and DON users only.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f5f8fc] p-4 text-[#071832] md:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Quality & Governance Dashboard</h1>
          <p className="mt-1 text-sm text-[#536176]">
            {isGroupOwner
              ? "Real-time overview of quality, compliance and governance across all care homes."
              : `Real-time overview of quality, compliance and governance for ${scopeLabel}.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TopButton icon={CalendarDays} label="20 May 2025" />
          <TopButton label={scopeLabel} />
          <TopButton icon={Filter} label="Filters" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#ef2e2e] text-[10px] font-bold text-white">
              5
            </span>
          </div>
          <TopButton icon={Download} label="Export" />
        </div>
      </div>

      <section className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <GovernanceKpi icon={Shield} title="Overall Quality Score" value="84%" sub="Good" foot="vs last month" trend="up" delta="6%" tone="blue" percent={84} />
        <GovernanceKpi icon={ShieldCheck} title="Compliance Score" value="91%" sub="Compliant" foot="vs last month" trend="up" delta="4%" tone="green" percent={91} />
        <GovernanceKpi icon={AlertTriangle} title="Open Incidents" value="23" sub="Open" foot="vs last month" trend="down" delta="3" tone="red" percent={70} />
        <GovernanceKpi icon={ClipboardList} title="Overdue CAPAs" value="7" sub="Overdue" foot="vs last month" trend="down" delta="2" tone="orange" percent={52} />
        <GovernanceKpi icon={Search} title="Upcoming Inspections" value="4" sub="Next 30 Days" foot="vs last month" trend="flat" delta="" tone="purple" percent={18} />
        <GovernanceKpi icon={FileText} title="Policies Up to Date" value="88%" sub="Up to Date" foot="vs last month" trend="up" delta="5%" tone="teal" percent={88} />
      </section>

      <section className="mb-3 grid gap-3 xl:grid-cols-2 2xl:grid-cols-[1.1fr_1fr_1.1fr]">
        <Panel title="Clinical Quality Indicators" subtitle="(This Month)" action="View All">
          <div className="overflow-x-auto">
          <div className="grid min-w-[560px] grid-cols-[1fr_80px_80px_90px] border-b pb-2 text-xs font-bold text-[#536176]">
            <span>Indicator</span><span>Result</span><span>Target</span><span>vs Last Month</span>
          </div>
          {[
            ["Medication Administration Accuracy", "96.2%", ">= 95%", "up", "1.8%"],
            ["Falls Rate (per 1,000 bed days)", "5.6", "<= 6.0", "down", "0.7"],
            ["Pressure Ulcer Prevalence", "2.1%", "<= 2.5%", "down", "0.4%"],
            ["Infection Control Compliance", "94.1%", ">= 90%", "up", "2.3%"],
            ["Resident Satisfaction", "86.3%", ">= 85%", "up", "3.1%"],
            ["Complaints Upheld Rate", "4.2%", "<= 5%", "down", "1.1%"],
          ].map(([label, result, target, trend, delta]) => (
            <div key={label} className="grid min-w-[560px] grid-cols-[1fr_80px_80px_90px] border-b py-2 text-xs last:border-b-0">
              <span>{label}</span>
              <span className="font-bold">{result}</span>
              <span>{target}</span>
              <span className={trend === "up" ? "text-[#27a557]" : "text-[#27a557]"}>
                {trend === "up" ? <ArrowUp className="mr-1 inline h-3 w-3" /> : <ArrowDown className="mr-1 inline h-3 w-3" />}
                {delta}
              </span>
            </div>
          ))}
          </div>
          <PanelFooter label="View All Indicators" />
        </Panel>

        <Panel title="Incidents by Type" subtitle="(This Month)" action="View All">
          <div className="grid gap-4 md:grid-cols-[170px_1fr]">
            <Donut value="23" label="Total" colors={["#ef3434", "#f78f1e", "#7b3fd6", "#18a999", "#1f70d6", "#9aa4b2"]} />
            <PlainRows rows={[
              ["Falls", "8", "(35%)", "red"],
              ["Medication", "5", "(22%)", "orange"],
              ["Skin Integrity", "4", "(17%)", "purple"],
              ["Infection Control", "3", "(13%)", "teal"],
              ["Behaviour", "2", "(9%)", "blue"],
              ["Other", "1", "(4%)", "slate"],
            ]} />
          </div>
          <div className="mt-4 grid grid-cols-4 rounded-lg bg-[#f7f9fc] text-center text-xs">
            <MiniMetric label="Open" value="23" tone="red" />
            <MiniMetric label="Under Review" value="7" tone="orange" />
            <MiniMetric label="Closed This Month" value="18" tone="green" />
            <MiniMetric label="Avg. Days to Close" value="6.2" />
          </div>
        </Panel>

        <Panel title="CAPA Overview" action="View All">
          <div className="grid gap-4 md:grid-cols-[190px_1fr]">
            <Donut value="42" label="Total" colors={["#2ea85b", "#2ea85b", "#f78f1e", "#ef3434"]} />
            <PlainRows rows={[
              ["Completed", "28", "(67%)", "green"],
              ["In Progress", "7", "(17%)", "orange"],
              ["Overdue", "7", "(17%)", "red"],
            ]} />
          </div>
          <div className="mt-5 rounded-lg border border-green-100 bg-green-50 p-4 text-sm">
            <div className="font-bold text-[#21864a]">Overdue CAPAs require attention</div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span>7 actions overdue by 1-30 days</span>
              <Link to="/tasks" className="font-semibold text-[#0b4f93]">View Overdue</Link>
            </div>
          </div>
        </Panel>
      </section>

      <section className="mb-3 grid gap-3 xl:grid-cols-2 2xl:grid-cols-[1fr_1fr_1.12fr]">
        <Panel title="Upcoming Inspections & Audits" action="View Calendar">
          <DataRows columns="grid-cols-[1fr_1fr_1fr_95px_55px]" headers={["Type", "Home", "Regulator / Auditor", "Date", "Days"]} rows={isGroupOwner ? [
            ["HIQA Inspection", "Riverside Lodge", "HIQA", "28 May 2025", "8"],
            ["Fire Safety Audit", "Oakview Care Home", "Fire Authority", "02 Jun 2025", "13"],
            ["Medication Audit", "Lakeside Manor", "Internal", "05 Jun 2025", "16"],
            ["HIQA Inspection", "Greenfield House", "HIQA", "12 Jun 2025", "23"],
          ] : [
            ["HIQA Inspection", scopeLabel, "HIQA", "28 May 2025", "8"],
            ["Fire Safety Audit", scopeLabel, "Fire Authority", "02 Jun 2025", "13"],
            ["Medication Audit", scopeLabel, "Internal", "05 Jun 2025", "16"],
            ["Governance Audit", scopeLabel, "Internal", "12 Jun 2025", "23"],
          ]} />
          <PanelFooter label="View All Inspections & Audits" />
        </Panel>

        <Panel title="Compliance by Domain" action="View Report">
          {[
            ["Clinical Care", 92],
            ["Medication Management", 91],
            ["Infection Prevention", 89],
            ["Governance & Leadership", 87],
            ["Health & Safety", 85],
            ["Environment & Facilities", 83],
            ["Residents' Rights", 95],
          ].map(([label, value]) => (
            <div key={label} className="mb-3 grid grid-cols-[170px_1fr_42px] items-center gap-3 text-sm">
              <span>{label}</span>
              <div className="h-2 rounded-full bg-[#e7edf4]"><div className="h-2 rounded-full bg-[#2ea85b]" style={{ width: `${value}%` }} /></div>
              <span className="font-bold">{value}%</span>
            </div>
          ))}
          <div className="grid grid-cols-[170px_1fr_42px] text-xs text-[#536176]">
            <span /><div className="flex justify-between"><span>0%</span><span>50%</span><span>100%</span></div><span />
          </div>
        </Panel>

        <Panel title="Document & Policy Status" action="View All">
          <div className="mb-4 grid grid-cols-4 gap-3">
            <DocStat title="Up to Date" value="248" sub="88%" tone="green" />
            <DocStat title="Due for Review" value="22" sub="8%" tone="orange" />
            <DocStat title="Overdue" value="11" sub="4%" tone="red" />
            <DocStat title="Total Documents" value="281" sub="" tone="blue" />
          </div>
          <div className="text-xs font-semibold text-[#536176]">Recently Updated Documents</div>
          {[
            ["Medication Management Policy", "19 May 2025"],
            ["Infection Prevention & Control Policy", "18 May 2025"],
            ["Complaints Management Procedure", "16 May 2025"],
          ].map(([doc, date]) => (
            <div key={doc} className="flex justify-between border-b py-2 text-xs last:border-b-0">
              <span>{doc}</span><span>{date}</span>
            </div>
          ))}
          <PanelFooter label="View All Documents" />
        </Panel>
      </section>

      <section className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
        <Panel title="Complaints Overview" subtitle="(This Month)" action="View All">
          <div className="grid grid-cols-2 items-center gap-2 text-center text-xs xl:grid-cols-[100px_repeat(4,1fr)]">
            <div className="flex items-center gap-3 text-left">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-purple-100 text-purple-700"><MessageCircle className="h-6 w-6" /></div>
              <div><div className="text-2xl font-bold">12</div><div>Total Complaints</div></div>
            </div>
            <MiniMetric label="Received" value="12" />
            <MiniMetric label="Under Review" value="5" />
            <MiniMetric label="Upheld" value="2" sub="(16.7%)" />
            <MiniMetric label="Not Upheld" value="10" sub="(83.3%)" />
          </div>
        </Panel>

        <Panel title="Risk Register Summary" action="View Register">
          <div className="grid grid-cols-2 gap-3 text-center xl:grid-cols-4">
            <DocStat title="High Risks" value="6" sub="" tone="red" />
            <DocStat title="Medium Risks" value="13" sub="" tone="orange" />
            <DocStat title="Low Risks" value="21" sub="" tone="green" />
            <DocStat title="Total Risks" value="40" sub="" tone="blue" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-[#f7f9fc] p-3">Risks reviewed this month <strong className="float-right">7</strong></div>
            <div className="rounded-lg bg-[#f7f9fc] p-3">Next review due <strong className="float-right">27 May 2025</strong></div>
          </div>
        </Panel>

        <Panel title="Governance Meetings" action="View Calendar">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-4 text-sm">
              <CalendarDays className="mb-2 h-6 w-6 text-[#1f70d6]" />
              <div className="text-xs text-[#536176]">Next Meeting</div>
              <div className="font-bold">Quality & Safety Committee</div>
              <div className="mt-2">27 May 2025</div>
              <div className="text-xs">10:00 AM</div>
            </div>
            <div className="rounded-lg border p-4 text-sm">
              <div className="text-xs text-[#536176]">Recent Meeting Summary</div>
              <div className="font-bold">Board Meeting</div>
              <div className="mt-1 text-xs">13 May 2025</div>
              <div className="mt-5 flex items-center justify-between">
                <span>Actions Arising</span><strong className="text-2xl text-[#1f70d6]">5</strong>
              </div>
            </div>
          </div>
        </Panel>
      </section>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#536176]">
        <span>Data last refreshed: 20 May 2025 08:30</span>
        <span className="text-base">↻</span>
      </div>
    </div>
  );
}

function TopButton({ icon: Icon, label }: { icon?: typeof CalendarDays; label: string }) {
  return <button className="flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold shadow-sm">{Icon && <Icon className="h-4 w-4" />}{label}</button>;
}

function GovernanceKpi({ icon: Icon, title, value, sub, foot, trend, delta, tone, percent }: { icon: typeof Shield; title: string; value: string; sub: string; foot: string; trend: "up" | "down" | "flat"; delta: string; tone: string; percent: number }) {
  const color = toneColor(tone);
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full" style={{ backgroundColor: `${color}16`, color }}><Icon className="h-5 w-5" /></div>
        <div className="text-xs font-bold">{title}</div>
      </div>
      <div className="mx-auto mt-4 flex h-28 w-28 items-center justify-center rounded-full" style={{ background: `conic-gradient(${color} ${percent * 3.6}deg, #e8edf3 0deg)` }}>
        <div className="flex h-[84px] w-[84px] flex-col items-center justify-center rounded-full bg-white">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs">{sub}</div>
        </div>
      </div>
      <div className="mt-3 text-center text-xs">
        {foot}{" "}
        {trend === "up" && <span className="font-bold text-[#27a557]"><ArrowUp className="inline h-3 w-3" /> {delta}</span>}
        {trend === "down" && <span className="font-bold text-[#ef3434]"><ArrowDown className="inline h-3 w-3" /> {delta}</span>}
        {trend === "flat" && <span className="font-bold text-[#536176]">-</span>}
      </div>
    </div>
  );
}

function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-base font-bold">{title} {subtitle && <span className="text-xs font-medium text-[#536176]">{subtitle}</span>}</h2>
        {action && <button className="text-xs font-semibold text-[#0b4f93]">{action}</button>}
      </div>
      {children}
    </div>
  );
}

function Donut({ value, label, colors }: { value: string; label: string; colors: string[] }) {
  const span = 360 / colors.length;
  const stops = colors.map((color, index) => `${color} ${index * span}deg ${(index + 1) * span}deg`).join(", ");
  return (
    <div className="flex items-center justify-center">
      <div className="flex h-36 w-36 items-center justify-center rounded-full" style={{ background: `conic-gradient(${stops})` }}>
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs">{label}</div>
        </div>
      </div>
    </div>
  );
}

function PlainRows({ rows }: { rows: Array<[string, string, string, string]> }) {
  return (
    <div className="space-y-1">
      {rows.map(([label, value, pct, tone]) => (
        <div key={label} className="grid grid-cols-[1fr_45px_50px] items-center py-2 text-sm">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: toneColor(tone) }} />{label}</span>
          <span className="font-bold">{value}</span>
          <span>{pct}</span>
        </div>
      ))}
    </div>
  );
}

function MiniMetric({ label, value, tone, sub }: { label: string; value: string; tone?: string; sub?: string }) {
  return <div className="border-r p-3 last:border-r-0"><div>{label}</div><div className="text-lg font-bold" style={{ color: tone ? toneColor(tone) : "#071832" }}>{value}</div>{sub && <div>{sub}</div>}</div>;
}

function DataRows({ columns, headers, rows }: { columns: string; headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <div className={`grid min-w-[620px] ${columns} border-b pb-2 text-xs font-bold text-[#536176]`}>{headers.map((header) => <span key={header}>{header}</span>)}</div>
      {rows.map((row) => (
        <div key={row.join("-")} className={`grid min-w-[620px] ${columns} border-b py-2 text-xs last:border-b-0`}>
          {row.map((cell, index) => <span key={`${cell}-${index}`} className={index === row.length - 1 ? "rounded-md bg-red-50 px-2 py-1 text-center font-bold text-red-600" : ""}>{cell}</span>)}
        </div>
      ))}
    </div>
  );
}

function DocStat({ title, value, sub, tone }: { title: string; value: string; sub: string; tone: string }) {
  const color = toneColor(tone);
  return <div className="rounded-lg border p-3 text-center" style={{ backgroundColor: `${color}10`, borderColor: `${color}24` }}><div className="text-xs font-semibold" style={{ color }}>{title}</div><div className="text-2xl font-bold" style={{ color }}>{value}</div>{sub && <div className="text-xs">{sub}</div>}</div>;
}

function PanelFooter({ label }: { label: string }) {
  return <Link to="/reports" className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#0b4f93]">{label}<ArrowRight className="h-4 w-4" /></Link>;
}

function toneColor(tone: string) {
  const colors: Record<string, string> = {
    blue: "#1f70d6",
    green: "#2ea85b",
    red: "#ef3434",
    orange: "#f78f1e",
    purple: "#7b3fd6",
    teal: "#18a999",
    slate: "#9aa4b2",
  };
  return colors[tone] || colors.slate;
}
