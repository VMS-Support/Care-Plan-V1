import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Clock3,
  FileBadge,
  GraduationCap,
  HeartPulse,
  Plane,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCare } from "@/lib/care/store";
import {
  WORKFORCE_CAPABILITIES,
  getActiveStaffMetric,
  getAuthorisedWorkforceScope,
  getExpiringProfessionalRegistrationsMetric,
  getProfessionalRegistrationAlerts,
  getProfessionalRegistrationComplianceMetric,
  getGardaVettingComplianceMetric,
  getMandatoryDocumentsExpiringMetric,
  getStaffBreakdownByRole,
  getVisaComplianceMetric,
  getResidencePermissionMetric,
  getEmploymentPermitValidMetric,
  getTotalFteMetric,
  getTotalStaffMetric,
} from "@/domain/workforce";

export const Route = createFileRoute("/staff-management")({
  head: () => ({ meta: [{ title: "Staff Management Dashboard - NuCare" }] }),
  component: StaffManagementDashboard,
});

function StaffManagementDashboard() {
  const care = useCare();
  const { currentRole } = care;
  const workforceCapabilities = WORKFORCE_CAPABILITIES.filter((capability) =>
    care.canAccess(capability, { nursingHomeId: care.activeFacilityId }),
  );
  const workforceScope = getAuthorisedWorkforceScope({ currentUser: care.currentUser, activeFacilityId: care.activeFacilityId, facilities: care.facilities });
  const workforceAuth = { user: care.currentUser, capabilities: workforceCapabilities, scope: workforceScope };
  const totalStaffMetric = getTotalStaffMetric(care, workforceAuth);
  const activeStaffMetric = getActiveStaffMetric(care, workforceAuth);
  const totalFteMetric = getTotalFteMetric(care.employmentRecords);
  const registrationCompliance = getProfessionalRegistrationComplianceMetric({ staffMembers: care.staffMembers, employmentRecords: care.employmentRecords, registrations: care.professionalRegistrations });
  const expiringRegistrations = getExpiringProfessionalRegistrationsMetric(care.professionalRegistrations);
  const registrationAlerts = getProfessionalRegistrationAlerts({ registrations: care.professionalRegistrations, staffMembers: care.staffMembers });
  const visaCompliance = getVisaComplianceMetric({ employmentRecords: care.employmentRecords, visaRecords: care.staffVisaRecords });
  const residencePermissionMetric = getResidencePermissionMetric({ employmentRecords: care.employmentRecords, residenceRecords: care.staffResidencePermissionRecords });
  const employmentPermitMetric = getEmploymentPermitValidMetric({ employmentRecords: care.employmentRecords, permitRecords: care.staffEmploymentPermitRecords });
  const mandatoryDocumentsExpiring = getMandatoryDocumentsExpiringMetric(care.staffDocuments);
  const gardaVettingMetric = getGardaVettingComplianceMetric({ documents: care.staffDocuments, documentTypes: care.staffDocumentTypes, employmentRecords: care.employmentRecords });
  const roleBreakdown = getStaffBreakdownByRole(care, workforceAuth);

  if (currentRole !== "don" && currentRole !== "group_owner") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Staff Management is available to DON users only.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f5f8fc] p-4 text-[#071832] md:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Staff Management Dashboard</h1>
          <p className="mt-1 text-sm text-[#536176]">Overview Across All Care Homes</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TopFilter icon={CalendarDays} label="20 May 2025" />
          <TopFilter label="All Care Homes" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <Bell className="h-5 w-5 text-[#071832]" />
            <span className="absolute -right-0.5 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#ef2e2e] text-[10px] font-bold text-white">5</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <div className="font-semibold">Brian O'Donnell</div>
              <div className="text-[#536176]">Area Manager</div>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#dce9f8] text-sm font-bold text-[#0b4f93]">BO</div>
          </div>
        </div>
      </div>

      <section className="mb-3 grid gap-3 md:grid-cols-2 xl:grid-cols-8">
        <StaffKpi icon={Users} title="Total Staff" value={String(totalStaffMetric.value)} sub="In scope" foot={totalStaffMetric.availability === "available" ? `FTE: ${totalFteMetric.value}` : "Restricted"} percent={72} tone="blue" />
        <StaffKpi icon={Users} title="Active Staff" value={String(activeStaffMetric.value)} sub="Active" foot={activeStaffMetric.availability === "available" ? "Active / on leave" : "Restricted"} percent={60} tone="green" />
        <StaffKpi icon={BriefcaseBusiness} title="Vacant Positions" value="18" sub="Open" foot="12% of Budgeted" percent={72} tone="orange" />
        <StaffKpi icon={UserPlus} title="Agency Staff Today" value="27" sub="9%" foot="vs 8% Last Month" percent={42} tone="purple" trend="up" />
        <StaffKpi icon={HeartPulse} title="Sick Leave Today" value="23" sub="7%" foot="vs 5% Last Month" percent={32} tone="red" trend="up" />
        <StaffKpi icon={Plane} title="On Annual Leave" value="31" sub="10%" foot="vs 9% Last Month" percent={48} tone="blue" trend="down" />
        <StaffKpi icon={FileBadge} title="Registration Compliance" value={registrationCompliance.percentage === undefined ? "N/A" : `${registrationCompliance.percentage}%`} sub="Compliant" foot={`Expiring: ${expiringRegistrations.value}`} percent={registrationCompliance.percentage ?? 0} tone="green" compact />
        <StaffKpi icon={GraduationCap} title="Training Compliance" value="92%" sub="Compliant" foot="Overdue: 15 Staff" percent={92} tone="purple" compact />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <Panel title="Staffing Summary" className="xl:col-span-1">
          <div className="grid gap-5 md:grid-cols-[150px_1fr]">
            <Donut value={totalStaffMetric.value} label="Total Staff" segments={["#1f70d6", "#23b3c7", "#6b3fd4", "#ff951b", "#f0bc22", "#064b95", "#b9c5d3"]} />
            <Legend rows={[
              ...roleBreakdown.slice(0, 7).map((item, index) => [
                item.roleLabel,
                String(item.staffCount),
                `${item.percentOfTotal}%`,
                ["#1f70d6", "#23b3c7", "#6b3fd4", "#ff951b", "#f0bc22", "#91a0b4", "#064b95"][index] || "#91a0b4",
              ] as [string, string, string, string]),
            ]} />
          </div>
        </Panel>
        <Panel title="Roster Overview" suffix="(This Week)">
          <div className="grid gap-5 md:grid-cols-[150px_1fr]">
            <Donut value={1856} label="Total Shifts" segments={["#2fab5f", "#ff7e16", "#9aa8b8"]} />
            <Legend rows={[["Filled", "1,672", "90%", "#2fab5f"], ["Vacant", "92", "5%", "#ff7e16"], ["To be Confirmed", "92", "5%", "#9aa8b8"]]} />
          </div>
        </Panel>
        <Panel title="Upcoming Leave" suffix="(Next 30 Days)">
          <div className="grid gap-5 md:grid-cols-[150px_1fr]">
            <Donut value={62} label="Staff" segments={["#2374df", "#ef3333", "#ff971a", "#28b6bf"]} />
            <Legend rows={[["Annual Leave", "42", "68%", "#2374df"], ["Sick Leave", "10", "16%", "#ef3333"], ["Unpaid Leave", "6", "10%", "#ff971a"], ["Other Leave", "4", "6%", "#28b6bf"]]} />
          </div>
        </Panel>

        <Panel title="Visa & Document Status">
          <div className="space-y-3">
            {[
              ["Visa Valid", visaCompliance.percentage === undefined ? "N/A" : `${visaCompliance.percentage}%`, String(visaCompliance.valid), "green"],
              ["Visa Expiring (30 Days)", String(visaCompliance.expiring), String(visaCompliance.expiring), "orange"],
              ["Visa Expired", String(visaCompliance.expired), String(visaCompliance.expired), "red"],
              ["Garda Vetting Valid", gardaVettingMetric.percentage === undefined ? "N/A" : `${gardaVettingMetric.percentage}%`, String(gardaVettingMetric.value), "green"],
              ["GNIB Registered", residencePermissionMetric.percentage === undefined ? "N/A" : `${residencePermissionMetric.percentage}%`, String(residencePermissionMetric.valid), "green"],
              ["Work Permit Valid", employmentPermitMetric.percentage === undefined ? "N/A" : `${employmentPermitMetric.percentage}%`, String(employmentPermitMetric.valid), "green"],
            ].map(([label, pct, count, tone]) => <StatusBar key={label} label={label} pct={pct} count={count} tone={tone} />)}
          </div>
        </Panel>
        <Panel title="Training Compliance">
          <div className="grid gap-5 md:grid-cols-[150px_1fr]">
            <Ring percent={92} tone="green" label="Compliant" />
            <div className="space-y-5">
              <Legend rows={[["Compliant", "287", "92%", "#2fab5f"], ["Overdue", "15", "5%", "#ff7e16"], ["Not Started", "10", "3%", "#9aa8b8"]]} />
              <Link to="/reports" className="inline-flex items-center gap-2 text-xs font-medium text-[#0b4f93]">View Training Matrix <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          </div>
        </Panel>
        <Panel title="Sick Leave" suffix="(This Month)">
          <div className="grid gap-5 md:grid-cols-[120px_1fr]">
            <div className="flex flex-col justify-center">
              <div className="text-[34px] font-bold text-[#0c2c5a]">6.4%</div>
              <div className="text-xs text-[#536176]">Sick Leave Rate</div>
              <div className="mt-4 flex items-center gap-1 text-xs">vs 5.1% Last Month <ArrowUp className="h-3.5 w-3.5 text-[#ef3333]" /></div>
            </div>
            <MiniLine />
          </div>
        </Panel>

        <Panel title="Expiring Documents & Visas">
          <SimpleTable headers={["Staff Member", "Document", "Expires", "Status"]} rows={[
            ["Aisha Khan", "Visa", "25 May 2025", "5 days"],
            ["Peter Okafor", "Visa", "02 Jun 2025", "13 days"],
            ["Maria Silva", "Garda Vetting", "05 Jun 2025", "16 days"],
            ["John Smith", "Work Permit", "12 Jun 2025", "23 days"],
          ]} footer="View All Expiring" />
        </Panel>
        <Panel title="Top Vacant Positions">
          <SimpleTable headers={["Position", "Vacant", "Urgency"]} rows={[
            ["Registered Nurse", "6", "High"],
            ["Healthcare Assistant", "7", "High"],
            ["CNM", "2", "Medium"],
            ["Housekeeping Assistant", "2", "Low"],
            ["Maintenance Assistant", "1", "Low"],
          ]} footer="View All Vacancies" urgency />
        </Panel>
        <Panel title="Key Alerts">
          <div className="space-y-4">
            {[
              ["Registrations Expiring", String(expiringRegistrations.value), "orange"],
              ["Registration Alerts", String(registrationAlerts.length), registrationAlerts.length ? "red" : "purple"],
              ["Training Overdue", "15", "red"],
              ["Mandatory Documents Expiring", String(mandatoryDocumentsExpiring.value), "orange"],
              ["Probation Reviews Due", "5", "purple"],
              ["Agency Spend High", "3", "red"],
            ].map(([label, count, tone]) => <AlertRow key={label} label={label} count={count} tone={tone} />)}
          </div>
          <Link to="/alerts" className="mt-8 flex items-center justify-between text-xs font-medium text-[#0b4f93]">View All Alerts <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Panel>
        <Panel title="Agency Spend" suffix="(This Month)">
          <div className="flex h-full items-center justify-between gap-4">
            <div>
              <div className="text-[30px] font-bold">€48,760</div>
              <div className="text-xs text-[#536176]">Total Spend</div>
              <div className="mt-5 text-xs">vs €41,250 Last Month <ArrowUp className="inline h-3.5 w-3.5 text-[#ef3333]" /></div>
              <div className="mt-1 text-sm font-bold">+18.2%</div>
            </div>
            <div className="grid h-20 w-20 place-items-center rounded-full bg-[#eef5ff] text-[#0b6ed8]">
              <Users className="h-9 w-9" />
            </div>
          </div>
          <Link to="/reports" className="mt-8 flex items-center justify-between text-xs font-medium text-[#0b4f93]">View Agency Report <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Panel>
      </section>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#536176]">
        <span>Data last refreshed: 20 May 2025 08:30</span>
        <span className="text-base">↻</span>
      </div>
    </div>
  );
}

function TopFilter({ icon: Icon, label }: { icon?: any; label: string }) {
  return (
    <button className="flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium shadow-sm">
      {Icon && <Icon className="h-4 w-4" />}
      {label}
      <span className="text-[#6d7788]">⌄</span>
    </button>
  );
}

function StaffKpi({ icon: Icon, title, value, sub, foot, percent, tone, trend, compact }: { icon: any; title: string; value: string; sub: string; foot: string; percent: number; tone: "blue" | "green" | "orange" | "purple" | "red"; trend?: "up" | "down"; compact?: boolean }) {
  const color = palette(tone);
  return (
    <Card className="rounded-[10px] border-0 shadow-[0_8px_18px_rgba(10,31,68,0.06)]">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full" style={{ backgroundColor: color.soft, color: color.main }}><Icon className="h-5 w-5" /></div>
          <div className="text-xs font-semibold">{title}</div>
        </div>
        <div className="mt-3 flex justify-center">
          <div className="grid h-24 w-24 place-items-center rounded-full" style={{ background: `conic-gradient(${color.main} ${percent * 3.6}deg, #e9eef5 0deg)` }}>
            <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-white text-center">
              <div>
                <div className="text-[28px] font-bold leading-none">{value}</div>
                <div className="mt-1 text-xs">{sub}</div>
              </div>
            </div>
          </div>
        </div>
        <div className={`mt-4 flex min-h-5 items-center justify-center gap-1 text-xs font-medium ${compact ? "text-[#536176]" : ""}`}>
          {foot}
          {trend === "up" && <ArrowUp className="h-3.5 w-3.5 text-[#ef3333]" />}
          {trend === "down" && <ArrowDown className="h-3.5 w-3.5 text-[#2fab5f]" />}
        </div>
      </CardContent>
    </Card>
  );
}

function Panel({ title, suffix, children, className = "" }: { title: string; suffix?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={`rounded-[10px] border-0 shadow-[0_8px_18px_rgba(10,31,68,0.06)] ${className}`}>
      <CardContent className="p-5">
        <h2 className="mb-5 text-base font-bold">{title} {suffix && <span className="ml-1 text-xs font-medium">{suffix}</span>}</h2>
        {children}
      </CardContent>
    </Card>
  );
}

function Donut({ value, label, segments }: { value: number; label: string; segments: string[] }) {
  const stops = segments.map((color, index) => `${color} ${index * (360 / segments.length)}deg ${(index + 1) * (360 / segments.length)}deg`).join(",");
  return (
    <div className="grid h-[150px] w-[150px] place-items-center rounded-full" style={{ background: `conic-gradient(${stops})` }}>
      <div className="grid h-[96px] w-[96px] place-items-center rounded-full bg-white text-center">
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs">{label}</div>
        </div>
      </div>
    </div>
  );
}

function Ring({ percent, tone, label }: { percent: number; tone: "green" | "blue" | "purple" | "orange" | "red"; label: string }) {
  const color = palette(tone).main;
  return (
    <div className="grid h-[150px] w-[150px] place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${percent * 3.6}deg, #e9eef5 0deg)` }}>
      <div className="grid h-[110px] w-[110px] place-items-center rounded-full bg-white text-center">
        <div>
          <div className="text-3xl font-bold">{percent}%</div>
          <div className="text-xs">{label}</div>
        </div>
      </div>
    </div>
  );
}

function Legend({ rows }: { rows: Array<[string, string, string, string]> }) {
  return <div className="space-y-3">{rows.map(([label, value, pct, color]) => <div key={label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span><span className="font-bold">{value}</span><span>({pct})</span></div>)}</div>;
}

function StatusBar({ label, pct, count, tone }: { label: string; pct: string; count: string; tone: string }) {
  const color = tone === "green" ? "#2fab5f" : tone === "orange" ? "#ff971a" : "#ef3333";
  return (
    <div className="grid grid-cols-[1fr_42px_1fr_32px] items-center gap-4 text-sm">
      <span>{label}</span>
      <span>{pct}</span>
      <span className="h-1.5 rounded bg-[#edf1f6]"><span className="block h-full rounded" style={{ width: pct, backgroundColor: color }} /></span>
      <span className={tone === "green" ? "" : "text-[#be2d2d]"}>{count}</span>
    </div>
  );
}

function MiniLine() {
  const points = "0,72 70,56 140,46 210,42 280,38 350,20";
  return (
    <svg viewBox="0 0 360 110" className="h-40 w-full">
      {[0, 35, 70, 105].map((y) => <line key={y} x1="0" x2="360" y1={y} y2={y} stroke="#edf1f6" />)}
      <polyline fill="none" stroke="#1f70d6" strokeWidth="3" points={points} />
      {points.split(" ").map((pair, index) => {
        const [x, y] = pair.split(",").map(Number);
        return <circle key={index} cx={x} cy={y} r="4" fill="#1f70d6" />;
      })}
      {["4.2%", "4.8%", "5.0%", "5.1%", "6.4%"].map((label, index) => <text key={label} x={index * 70 + 18} y={index === 4 ? 15 : 38 + index * 4} fontSize="11" fontWeight="700" fill="#071832">{label}</text>)}
    </svg>
  );
}

function SimpleTable({ headers, rows, footer, urgency }: { headers: string[]; rows: string[][]; footer: string; urgency?: boolean }) {
  return (
    <div>
      <table className="w-full text-left text-xs">
        <thead><tr className="text-[#536176]">{headers.map((header) => <th key={header} className="pb-3 font-medium">{header}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.join("-")} className="border-t border-[#edf1f6]">{row.map((cell, index) => <td key={index} className="py-3">{urgency && index === row.length - 1 ? <Urgency value={cell} /> : index === row.length - 1 && /days/.test(cell) ? <span className="text-[#be7a13]">◷ {cell}</span> : cell}</td>)}</tr>)}</tbody>
      </table>
      <Link to="/reports" className="mt-5 flex items-center justify-between text-xs font-medium text-[#0b4f93]">{footer}<ArrowRight className="h-3.5 w-3.5" /></Link>
    </div>
  );
}

function Urgency({ value }: { value: string }) {
  const cls = value === "High" ? "bg-[#ffe0df] text-[#b91c1c]" : value === "Medium" ? "bg-[#ffefd5] text-[#a86000]" : "bg-[#def5e7] text-[#18733b]";
  return <Badge className={`${cls} border-0`}>{value}</Badge>;
}

function AlertRow({ label, count, tone }: { label: string; count: string; tone: string }) {
  const color = palette(tone as "orange" | "red" | "purple");
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full" style={{ backgroundColor: color.soft, color: color.main }}><AlertTriangle className="h-3.5 w-3.5" /></span>{label}</span>
      <span className="grid h-6 min-w-6 place-items-center rounded-full px-2 text-xs font-bold text-white" style={{ backgroundColor: color.main }}>{count}</span>
    </div>
  );
}

function palette(tone: "blue" | "green" | "orange" | "purple" | "red") {
  return {
    blue: { main: "#1f70d6", soft: "#e5f0ff" },
    green: { main: "#2fab5f", soft: "#e6f7ed" },
    orange: { main: "#ff8a13", soft: "#fff1dd" },
    purple: { main: "#7d55d8", soft: "#f0ebff" },
    red: { main: "#ef3333", soft: "#ffe8e8" },
  }[tone];
}
