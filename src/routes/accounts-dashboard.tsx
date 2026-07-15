import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BadgeEuro,
  Banknote,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  Landmark,
  LineChart,
  ReceiptText,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCare } from "@/lib/care/store";

const EUR = "\u20ac";

export const Route = createFileRoute("/accounts-dashboard")({
  head: () => ({ meta: [{ title: "Accounts Dashboard - NuCare" }] }),
  component: AccountsDashboard,
});

function AccountsDashboard() {
  const { currentRole } = useCare();

  if (currentRole !== "group_owner") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Accounts Dashboard is available to Group Owner users only.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f5f8fc] p-4 text-[#071832] md:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Accounts Dashboard</h1>
          <p className="mt-1 text-sm text-[#536176]">Overview across all care homes</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TopButton icon={CalendarDays} label="May 2025 (MTD)" />
          <TopButton label="All Care Homes" />
          <button className="flex h-10 items-center gap-2 rounded-lg bg-[#0b66d8] px-4 text-sm font-semibold text-white shadow-sm">
            + Quick Action
          </button>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#ef2e2e] text-[10px] font-bold text-white">
              6
            </span>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm">
            <Settings className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-slate-500">
              BO
            </div>
            <div className="text-xs">
              <div className="font-semibold">Brian O'Donnell</div>
              <div className="text-[#536176]">Group Owner</div>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-3 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        <FinanceKpi icon={BarChart3} title="Total Revenue (MTD)" value={`${EUR}2.48M`} foot="vs Apr: +8.6%" trend="up" tone="green" percent={72} />
        <FinanceKpi icon={BarChart3} title="Gross Profit (MTD)" value={`${EUR}1.48M`} sub="59.7% Margin" foot="vs Apr: +7.2%" trend="up" tone="purple" percent={64} />
        <FinanceKpi icon={BarChart3} title="Operating Expenses (MTD)" value={`${EUR}0.96M`} foot="vs Apr: +6.1%" trend="up" tone="orange" percent={68} />
        <FinanceKpi icon={BadgeEuro} title="Net Profit (MTD)" value={`${EUR}0.52M`} sub="20.9% Margin" foot="vs Apr: +12.3%" trend="up" tone="teal" percent={78} />
        <FinanceKpi icon={Landmark} title="Cash at Bank" value={`${EUR}3.67M`} foot="vs Apr: +5.4%" trend="up" tone="blue" percent={62} />
        <FinanceKpi icon={ReceiptText} title="Outstanding AR" value={`${EUR}1.12M`} sub="35 Days" foot="vs Apr: -4 Days" trend="downGood" tone="red" percent={74} />
        <FinanceKpi icon={WalletCards} title="Outstanding AP" value={`${EUR}0.68M`} sub="22 Days" foot="vs Apr: -2 Days" trend="downGood" tone="yellow" percent={72} />
      </section>

      <section className="mb-3 grid gap-3 xl:grid-cols-[1fr_1fr_1.1fr]">
        <Panel title="Cash Position" action="View Cash Flow">
          <CashChart />
          <div className="mt-4 grid grid-cols-3 rounded-lg bg-[#f7f9fc] text-center text-sm">
            <MiniMetric label="Current Balance" value={`${EUR}3.67M`} />
            <MiniMetric label="30 Day Forecast" value={`${EUR}3.28M`} />
            <MiniMetric label="Net Change" value={`+${EUR}0.39M`} tone="green" />
          </div>
        </Panel>

        <Panel title="Income & Expense Summary (MTD)" action="View P&L">
          <div className="grid gap-4 md:grid-cols-[180px_1fr]">
            <Donut value={`${EUR}2.48M`} label="Total Income" colors={["#1f70d6", "#1f70d6", "#22aaa6", "#f78f1e", "#7b3fd6"]} />
            <PlainRows rows={[
              ["Care Home Fees", `${EUR}1.62M`, "(65%)", "blue"],
              ["Resident Top Ups", `${EUR}0.38M`, "(15%)", "teal"],
              ["Grants & Funding", `${EUR}0.21M`, "(8%)", "orange"],
              ["Other Income", `${EUR}0.27M`, "(11%)", "purple"],
            ]} />
          </div>
          <div className="mt-4 grid grid-cols-3 rounded-lg bg-[#f7f9fc] text-center text-sm">
            <MiniMetric label="Total Expenses" value={`${EUR}1.96M`} />
            <MiniMetric label="Net Profit" value={`${EUR}0.52M`} tone="green" />
            <MiniMetric label="Profit Margin" value="20.9%" tone="green" />
          </div>
        </Panel>

        <Panel title="Bank Accounts" action="View All Accounts">
          <DataRows columns="grid-cols-[1.4fr_0.7fr_0.8fr_0.7fr]" headers={["Account", "Bank", "Balance", "vs Apr"]} rows={[
            ["Main Operating Account", "AIB", `${EUR}1.62M`, "+EUR125K"],
            ["Payroll Account", "AIB", `${EUR}0.45M`, "-EUR18K"],
            ["Trust Account", "AIB", `${EUR}0.38M`, "+EUR6K"],
            ["Deposit Account", "BOI", `${EUR}1.22M`, "+EUR42K"],
          ]} />
          <div className="mt-4 flex justify-between border-t pt-4 text-sm font-bold">
            <span>Total Cash at Bank</span><span>{EUR}3.67M</span><span className="text-[#1f9d55]">+EUR155K <ArrowUp className="inline h-3 w-3" /></span>
          </div>
        </Panel>
      </section>

      <section className="mb-3 grid gap-3 xl:grid-cols-[1fr_1fr_1.1fr]">
        <Panel title="Accounts Receivable (AR)" action="View AR Aging">
          <Aging value={`${EUR}1.12M`} label="Total AR" rows={[
            ["0 - 30 Days", `${EUR}0.62M`, "(55%)", "green"],
            ["31 - 60 Days", `${EUR}0.24M`, "(21%)", "orange"],
            ["61 - 90 Days", `${EUR}0.16M`, "(14%)", "red"],
            ["90+ Days", `${EUR}0.10M`, "(10%)", "purple"],
          ]} />
          <FooterMetric label="Average Days Outstanding" value="35 Days" foot="vs Apr: -4 Days" />
        </Panel>

        <Panel title="Accounts Payable (AP)" action="View AP Aging">
          <Aging value={`${EUR}0.68M`} label="Total AP" rows={[
            ["0 - 30 Days", `${EUR}0.32M`, "(47%)", "green"],
            ["31 - 60 Days", `${EUR}0.18M`, "(26%)", "orange"],
            ["61 - 90 Days", `${EUR}0.11M`, "(16%)", "red"],
            ["90+ Days", `${EUR}0.07M`, "(11%)", "purple"],
          ]} />
          <FooterMetric label="Average Days Payable" value="22 Days" foot="vs Apr: -2 Days" />
        </Panel>

        <Panel title="Payroll Summary (MTD)" action="View Payroll Report">
          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <div className="space-y-3 text-sm">
              <InfoRow label="Total Payroll Cost" value={`${EUR}1.18M`} />
              <InfoRow label="Employer Costs" value={`${EUR}0.26M`} />
              <InfoRow label="Total Employees" value="312" />
              <InfoRow label="Average Cost per Employee" value={`${EUR}3,795`} />
            </div>
            <div className="flex items-center justify-center">
              <div className="flex h-36 w-36 items-center justify-center rounded-full bg-[conic-gradient(#22aaa6_360deg,#e8edf3_0deg)]">
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                  <div className="text-sm font-bold">Paid</div>
                  <div className="text-2xl font-bold">{EUR}1.18M</div>
                  <div className="text-xs">100%</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-lg bg-[#f7f9fc] p-3 text-sm">
            <span>Last Payroll Run: 16 May 2025</span>
            <span className="flex items-center gap-1 font-semibold text-[#1f9d55]"><CheckCircle2 className="h-4 w-4" /> Successful</span>
          </div>
        </Panel>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1fr_1fr_0.9fr_0.9fr]">
        <Panel title="HR & People Overview" action="View HR Dashboard">
          <div className="grid grid-cols-4 gap-3 text-center">
            <PeopleStat icon={Users} label="Total Employees" value="312" tone="blue" />
            <PeopleStat icon={Users} label="On Leave Today" value="31" tone="green" />
            <PeopleStat icon={Users} label="New Starters (MTD)" value="8" tone="orange" />
            <PeopleStat icon={WalletCards} label="Open Positions" value="18" tone="purple" />
          </div>
        </Panel>

        <Panel title="Integration Status">
          <div className="space-y-2">
            {[
              ["Bank Feeds", "All accounts updated"],
              ["Payroll System", "Last sync: 16 May 2025 08:15"],
              ["HR System", "Last sync: 16 May 2025 08:10"],
              ["Time & Attendance", "Last sync: 16 May 2025 08:05"],
            ].map(([label, meta]) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><Building2 className="h-4 w-4" />{label}</span>
                <span className="text-xs text-[#536176]">{meta}</span>
                <CheckCircle2 className="h-4 w-4 text-[#1f9d55]" />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Alerts & Notifications" action="View All">
          <div className="space-y-2 text-sm">
            <AlertRow icon={AlertTriangle} label="Invoices Overdue" value="12" tone="red" />
            <AlertRow icon={ReceiptText} label="Bills to Approve" value="7" tone="orange" />
            <AlertRow icon={Users} label="Payroll Exceptions" value="3" tone="purple" />
            <AlertRow icon={CreditCard} label="Bank Transactions to Review" value="15" tone="blue" />
          </div>
        </Panel>

        <Panel title="Quick Actions">
          <div className="grid grid-cols-4 gap-2">
            <Action icon={FileText} label="Create Invoice" />
            <Action icon={ReceiptText} label="Pay Bills" />
            <Action icon={ClipboardList} label="Run Payroll" />
            <Action icon={CreditCard} label="Reconcile Bank" />
            <Action icon={LineChart} label="Budget vs Actual" />
            <Action icon={FileText} label="Financial Report" />
            <Action icon={Users} label="HR Dashboard" />
            <Action icon={Settings} label="System Settings" />
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

function FinanceKpi({ icon: Icon, title, value, sub, foot, trend, tone, percent }: { icon: typeof Banknote; title: string; value: string; sub?: string; foot: string; trend: "up" | "downGood"; tone: string; percent: number }) {
  const color = toneColor(tone);
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full" style={{ backgroundColor: `${color}16`, color }}><Icon className="h-5 w-5" /></div>
        <div className="text-xs font-bold">{title}</div>
      </div>
      <div className="mx-auto mt-4 flex h-28 w-28 items-center justify-center rounded-full" style={{ background: `conic-gradient(${color} ${percent * 3.6}deg, #e8edf3 0deg)` }}>
        <div className="flex h-[84px] w-[84px] flex-col items-center justify-center rounded-full bg-white text-center">
          <div className="text-xl font-bold">{value}</div>
          {sub && <div className="text-[11px]">{sub}</div>}
        </div>
      </div>
      <div className="mt-3 text-center text-xs">
        {foot} <span className="font-bold text-[#1f9d55]">{trend === "up" ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />}</span>
      </div>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-base font-bold">{title}</h2>
        {action && <button className="text-xs font-semibold text-[#0b4f93]">{action}</button>}
      </div>
      {children}
    </div>
  );
}

function CashChart() {
  const points = [62, 56, 64, 57, 65, 61, 67, 60, 52, 47, 51];
  return (
    <div>
      <div className="relative h-44 border-b border-l border-[#d7e0ea]">
        <div className="absolute inset-x-0 top-2 border-t border-dashed border-[#e5ebf2]" />
        <div className="absolute inset-x-0 top-14 border-t border-dashed border-[#e5ebf2]" />
        <div className="absolute inset-x-0 top-28 border-t border-dashed border-[#e5ebf2]" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 170" preserveAspectRatio="none">
          <polyline points={points.map((p, i) => `${i * 50},${170 - p * 1.8}`).join(" ")} fill="none" stroke="#1f70d6" strokeWidth="3" />
          <polyline points="350,65 400,55 450,70 500,50" fill="none" stroke="#2ea85b" strokeDasharray="8 7" strokeWidth="3" />
        </svg>
      </div>
      <div className="mt-2 flex justify-center gap-8 text-xs">
        <span className="text-[#1f70d6]">Current Balance</span>
        <span className="text-[#2ea85b]">30 Day Forecast</span>
      </div>
    </div>
  );
}

function Donut({ value, label, colors }: { value: string; label: string; colors: string[] }) {
  const span = 360 / colors.length;
  const stops = colors.map((color, index) => `${color} ${index * span}deg ${(index + 1) * span}deg`).join(", ");
  return <div className="flex items-center justify-center"><div className="flex h-36 w-36 items-center justify-center rounded-full" style={{ background: `conic-gradient(${stops})` }}><div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center"><div className="text-xl font-bold">{value}</div><div className="text-xs">{label}</div></div></div></div>;
}

function Aging({ value, label, rows }: { value: string; label: string; rows: Array<[string, string, string, string]> }) {
  return <div className="grid gap-4 md:grid-cols-[180px_1fr]"><Donut value={value} label={label} colors={["#2ea85b", "#2ea85b", "#f78f1e", "#ef3434", "#7b3fd6"]} /><PlainRows rows={rows} /></div>;
}

function PlainRows({ rows }: { rows: Array<[string, string, string, string]> }) {
  return <div className="space-y-1">{rows.map(([label, value, pct, tone]) => <div key={label} className="grid grid-cols-[1fr_80px_55px] items-center py-2 text-sm"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: toneColor(tone) }} />{label}</span><span className="font-bold">{value}</span><span>{pct}</span></div>)}</div>;
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return <div className="border-r p-3 last:border-r-0"><div className="text-xs">{label}</div><div className="font-bold" style={{ color: tone ? toneColor(tone) : "#071832" }}>{value}</div></div>;
}

function DataRows({ columns, headers, rows }: { columns: string; headers: string[]; rows: string[][] }) {
  return <><div className={`grid ${columns} border-b pb-2 text-xs font-bold text-[#536176]`}>{headers.map((header) => <span key={header}>{header}</span>)}</div>{rows.map((row) => <div key={row.join("-")} className={`grid ${columns} border-b py-3 text-sm last:border-b-0`}>{row.map((cell, index) => <span key={`${cell}-${index}`} className={index === row.length - 1 ? (cell.startsWith("-") ? "font-bold text-red-600" : "font-bold text-[#1f9d55]") : ""}>{cell}</span>)}</div>)}</>;
}

function FooterMetric({ label, value, foot }: { label: string; value: string; foot: string }) {
  return <div className="mt-4 flex items-center justify-between rounded-lg bg-[#f7f9fc] p-3 text-sm"><span>{label}</span><strong>{value}</strong><span className="text-xs">{foot} <ArrowDown className="inline h-3 w-3 text-[#1f9d55]" /></span></div>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span>{label}</span><strong>{value}</strong></div>;
}

function PeopleStat({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: string; tone: string }) {
  const color = toneColor(tone);
  return <div><div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ backgroundColor: `${color}12`, color }}><Icon className="h-6 w-6" /></div><div className="mt-3 text-xs">{label}</div><div className="mt-2 text-xl font-bold">{value}</div></div>;
}

function AlertRow({ icon: Icon, label, value, tone }: { icon: typeof AlertTriangle; label: string; value: string; tone: string }) {
  return <div className="flex items-center justify-between border-b py-2 last:border-b-0"><span className="flex items-center gap-2"><Icon className="h-4 w-4" style={{ color: toneColor(tone) }} />{label}</span><strong style={{ color: toneColor(tone) }}>{value}</strong></div>;
}

function Action({ icon: Icon, label }: { icon: typeof FileText; label: string }) {
  return <Link to="/reports" className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border p-2 text-center text-[11px] hover:bg-blue-50"><Icon className="h-5 w-5 text-[#0b4f93]" />{label}</Link>;
}

function toneColor(tone: string) {
  const colors: Record<string, string> = {
    blue: "#1f70d6",
    green: "#2ea85b",
    red: "#ef6b78",
    orange: "#f78f1e",
    yellow: "#f5c03d",
    purple: "#7b3fd6",
    teal: "#18a999",
  };
  return colors[tone] || "#9aa4b2";
}
