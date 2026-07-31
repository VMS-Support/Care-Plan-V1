import { Link, useNavigate, useRouterState, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CareProvider, useCare } from "@/lib/care/store";
import { isActionableClinicalAlert, isActionRequiredAlert } from "@/lib/care/alerts";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  HeartPulse,
  HeartHandshake,
  NotebookPen,
  AlertTriangle,
  BarChart3,
  CheckSquare,
  Stethoscope,
  Search,
  ShieldAlert,
  UserCheck,
  History,
  UsersRound,
  Plane,
  ShieldCheck,
  Building2,
  Home,
  Gauge,
  GraduationCap,
  IdCard,
  Landmark,
  Shield,
  Wrench,
  Package,
  BadgeCheck,
  HardHat,
  ClipboardCheck,
  MapPin,
  Settings,
  UserRoundCog,
  ChevronDown,
  BriefcaseBusiness,
  FileText,
  CalendarDays,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/care/UserMenu";
import { OperationalContextSwitcher } from "@/components/care/OperationalContextSwitcher";

type CapabilityCheck = (capability: string, resource?: { nursingHomeId?: string; wardId?: string; residentId?: string; sensitive?: boolean }) => boolean;
type NavItem = {
  to: any;
  label: string;
  icon: any;
  exact?: boolean;
  capability?: string;
  visible?: (canAccess: CapabilityCheck, currentRole: ReturnType<typeof useCare>["currentRole"]) => boolean;
};
type AppModule = "care" | "maintenance" | "workforce";
const moduleForPath = (pathname: string): AppModule => pathname.startsWith("/maintenance") ? "maintenance" : pathname.startsWith("/workforce") || pathname.startsWith("/staff-management") || pathname.startsWith("/training-dashboard") ? "workforce" : "care";
const moduleLanding: Record<AppModule, string> = { care: "/", maintenance: "/maintenance", workforce: "/staff-management" };
const moduleLabels: Record<AppModule, string> = { care: "Care Planning", maintenance: "Maintenance", workforce: "Workforce Management" };

function openAlertCounts({
  alerts,
  clinicalAlerts,
}: {
  alerts: ReturnType<typeof useCare>["alerts"];
  clinicalAlerts: ReturnType<typeof useCare>["clinicalAlerts"];
}) {
  const openClinical = clinicalAlerts.filter(
    (alert) => isActionableClinicalAlert(alert) && !alert.dismissedAt && !alert.resolvedAt,
  );
  const openLegacy = alerts.filter(
    (alert) => isActionRequiredAlert(alert) && !alert.acknowledged && !alert.resolvedAt,
  );
  return {
    total: openClinical.length + openLegacy.length,
    critical:
      openClinical.filter((alert) => alert.severity === "critical").length +
      openLegacy.filter((alert) => alert.priority === "critical").length,
  };
}

const workforceNav: NavItem[] = [
  {
    to: "/staff-management",
    label: "Staff Management Overview",
    icon: IdCard,
    capability: "permission.manage",
  },
  {
    to: "/workforce/staff",
    label: "Staff Directory",
    icon: UserRoundCog,
    capability: "staff_directory.view",
  },
  {
    to: "/workforce/employment",
    label: "Employment Records",
    icon: ClipboardList,
    capability: "employment_record.view",
  },
  {
    to: "/workforce/establishment",
    label: "Staffing Establishment",
    icon: Building2,
    capability: "staffing_establishment.view",
  },
  {
    to: "/workforce/recruitment",
    label: "Vacancies & Recruitment",
    icon: BriefcaseBusiness,
    capability: "recruitment.view",
  },
  {
    to: "/workforce/registrations",
    label: "Professional Registration",
    icon: ShieldCheck,
    capability: "professional_registration.view",
  },
  {
    to: "/workforce/visa-documents",
    label: "Visa & Documents",
    icon: FileText,
    visible: (canAccess) => canAccess("staff_immigration.view") || canAccess("staff_document.view"),
  },
  {
    to: "/training-dashboard",
    label: "Training Dashboard",
    icon: GraduationCap,
    capability: "training.view",
  },
  {
    to: "/workforce/training",
    label: "Training Operations",
    icon: GraduationCap,
    capability: "training.view",
  },
  {
    to: "/workforce/competencies",
    label: "Competencies",
    icon: ShieldAlert,
    capability: "competency.view",
  },
  {
    to: "/workforce/rostering",
    label: "Rostering",
    icon: CalendarDays,
    capability: "rostering.view",
  },
  {
    to: "/workforce/rostering/current",
    label: "  Current Roster",
    icon: CalendarDays,
    capability: "rostering.view",
  },
  {
    to: "/workforce/rostering/periods",
    label: "  Roster Periods",
    icon: CalendarDays,
    capability: "rostering.view",
  },
  {
    to: "/workforce/rostering/templates",
    label: "  Roster Templates",
    icon: CalendarDays,
    capability: "rostering.view",
  },
  {
    to: "/workforce/rostering/requirements",
    label: "  Staffing Requirements",
    icon: CalendarDays,
    capability: "rostering.view",
  },
  {
    to: "/workforce/rostering/vacant",
    label: "  Vacant Shifts",
    icon: CalendarDays,
    capability: "rostering.view",
  },
  {
    to: "/workforce/rostering/pending",
    label: "  Pending Confirmation",
    icon: CalendarDays,
    capability: "rostering.view",
  },
  {
    to: "/workforce/rostering/agency",
    label: "  Agency Cover",
    icon: CalendarDays,
    capability: "rostering.view",
  },
  {
    to: "/workforce/rostering/conflicts",
    label: "  Roster Conflicts",
    icon: CalendarDays,
    capability: "rostering.view",
  },
  {
    to: "/workforce/rostering/availability",
    label: "  Staff Availability",
    icon: CalendarDays,
    capability: "rostering.view",
  },
  {
    to: "/workforce/rostering/changes",
    label: "  Roster Changes",
    icon: CalendarDays,
    capability: "rostering.view",
  },
  {
    to: "/workforce/rostering/reports",
    label: "  Roster Reports",
    icon: CalendarDays,
    capability: "rostering.view_reports",
  },
  {
    to: "/workforce/rostering/settings",
    label: "  Rostering Settings",
    icon: CalendarDays,
    capability: "rostering.view",
  },
  {
    to: "/workforce/leave",
    label: "Leave Management",
    icon: CalendarDays,
    capability: "leave.view",
  },
  {
    to: "/workforce/agency",
    label: "Agency Management",
    icon: UsersRound,
    capability: "agency.view",
  },
  {
    to: "/workforce/probation",
    label: "Probation",
    icon: ClipboardList,
    capability: "probation.view",
  },
];

const nav: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    to: "/fast-care",
    label: "Fast Care",
    icon: HeartPulse,
    visible: (canAccess) => canAccess("ops.edit") || canAccess("ops.edit_own"),
  },
  { to: "/residents", label: "Residents", icon: Users, capability: "resident.view" },
  {
    to: "/quality-governance",
    label: "Quality Governance",
    icon: Shield,
    visible: (_canAccess, currentRole) => currentRole === "group_owner" || currentRole === "don",
  },
  {
    to: "/accounts-dashboard",
    label: "Accounts",
    icon: Landmark,
    capability: "finance.view",
  },
  {
    to: "/assessments",
    label: "Assessments",
    icon: Stethoscope,
    capability: "assessment.view",
  },
  {
    to: "/vitals",
    label: "Vitals",
    icon: HeartPulse,
    visible: (canAccess) => canAccess("vital.report") || canAccess("vital.audit"),
  },
  {
    to: "/care-plans",
    label: "Care Plans",
    icon: ClipboardList,
    capability: "careplan.view",
  },
  { to: "/care-plan-templates", label: "Care Plan Templates", icon: ClipboardList, capability: "careplan.view" },
  { to: "/daily-notes", label: "Daily Notes", icon: NotebookPen },
  { to: "/handovers", label: "Handovers", icon: UserCheck },
  {
    to: "/incidents",
    label: "Incidents",
    icon: ShieldAlert,
    visible: (canAccess) => canAccess("incident.view") || canAccess("incident.create"),
  },
  {
    to: "/mdt-notes",
    label: "MDT",
    icon: UserCheck,
    visible: (canAccess) => canAccess("mdt.create") || canAccess("clinical.view"),
  },
  { to: "/visitors", label: "Visitors", icon: UsersRound },
  { to: "/outings", label: "Outings", icon: Plane },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/risks", label: "Risks", icon: Gauge },
  { to: "/tasks", label: "Actions", icon: CheckSquare },
  { to: "/reports", label: "Reports", icon: BarChart3, capability: "report.view" },
  { to: "/audit-logs", label: "Audit Trail", icon: History, capability: "audit.view" },
];

const maintenanceNav: NavItem[] = [
  { to: "/maintenance", label: "Overview", icon: Home, exact: true },
  { to: "/maintenance/work-orders", label: "Work Orders", icon: ClipboardList, capability: "maintenance.work_orders.view" },
  { to: "/maintenance/planned-maintenance", label: "Planned Jobs", icon: CalendarDays, capability: "permission.manage" },
  { to: "/maintenance/assets", label: "Equipment & Assets", icon: Package, capability: "permission.manage" },
  { to: "/maintenance/safety-compliance", label: "Safety Checks", icon: ShieldCheck, capability: "permission.manage" },
  { to: "/maintenance/housekeeping", label: "Cleaning & Housekeeping", icon: UsersRound, capability: "permission.manage" },
  { to: "/maintenance/certificates", label: "Certificates & Documents", icon: BadgeCheck, capability: "permission.manage" },
  { to: "/maintenance/contractors", label: "Contractors", icon: HardHat, capability: "maintenance.contractors.register.view" },
  { to: "/maintenance/corrective-actions", label: "Follow-up Actions", icon: ClipboardCheck, capability: "permission.manage" },
  { to: "/maintenance/rooms-locations", label: "Rooms & Locations", icon: MapPin, capability: "permission.manage" },
  { to: "/maintenance/reports", label: "Reports", icon: BarChart3, capability: "permission.manage" },
  { to: "/maintenance/settings", label: "Settings", icon: Settings, capability: "permission.manage" },
];

function SidebarInner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { tasks, alerts, clinicalAlerts, canAccess, currentRole } = useCare();
  const [activeModule, setActiveModule] = useState<AppModule>(() => moduleForPath(pathname));
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  useEffect(() => setActiveModule(moduleForPath(pathname)), [pathname]);
  const todayKey = new Date().toISOString().slice(0, 10);
  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "deleted" && t.dueDate.slice(0, 10) < todayKey,
  ).length;
  const dueTodayTasks = tasks.filter(
    (t) =>
      t.status !== "completed" && t.status !== "deleted" && t.dueDate.slice(0, 10) === todayKey,
  ).length;
  const tasksAttentionCount = overdueTasks + dueTodayTasks;
  const tasksBadgeClass =
    overdueTasks > 0
      ? "bg-destructive text-destructive-foreground"
      : "bg-warning/20 text-warning-foreground";
  const alertCounts = openAlertCounts({ alerts, clinicalAlerts });
  const alertsBadgeClass =
    alertCounts.critical > 0
      ? "bg-destructive text-destructive-foreground"
      : "bg-warning/20 text-warning-foreground";
  const groupOwnerHidden = new Set([
    "/daily-notes",
    "/fast-care",
    "/outings",
    "/risks",
    "/alerts",
    "/handovers",
    "/care-plans",
    "/assessments",
    "/tasks",
    "/visitors",
  ]);
  const donHidden = new Set<string>([]);
  const visible = nav
    .filter((i) => !i.capability || canAccess(i.capability))
    .filter((i) => !i.visible || i.visible(canAccess, currentRole))
    .filter((i) => currentRole !== "group_owner" || !groupOwnerHidden.has(i.to))
    .filter((i) => currentRole !== "don" || !donHidden.has(i.to));
  const visibleWorkforce = workforceNav
    .filter((i) => !i.capability || canAccess(i.capability))
    .filter((i) => !i.visible || i.visible(canAccess, currentRole));
  const canViewMaintenance = canAccess("permission.manage") || canAccess("maintenance.work_orders.view") || canAccess("maintenance.contractors.register.view");
  const visibleMaintenance = maintenanceNav
    .filter((i) => !i.capability || canAccess(i.capability))
    .filter((i) => !i.visible || i.visible(canAccess, currentRole));
  const moduleNav = activeModule === "maintenance" ? visibleMaintenance : activeModule === "workforce" ? visibleWorkforce : visible;
  const availableModules: AppModule[] = ["care", ...(canViewMaintenance && visibleMaintenance.length ? ["maintenance" as const] : []), ...(visibleWorkforce.length ? ["workforce" as const] : [])];
  const switchModule = (module: AppModule) => {
    setModuleMenuOpen(false);
    setActiveModule(module);
    navigate({ to: moduleLanding[module] });
  };

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5" aria-label="ORITAS Care Solutions">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16213f]">
            <HeartHandshake className="h-7 w-7 text-[#5372f3]" strokeWidth={2.3} aria-hidden="true" />
          </div>
          <div className="leading-none">
            <div className="text-xl font-bold tracking-[0.08em] text-white">ORITAS</div>
            <div className="mt-1 text-[8px] font-semibold tracking-[0.22em] text-sidebar-foreground/80">
              CARE SOLUTIONS
            </div>
          </div>
        </div>
        <div className="relative mt-4">
          <button type="button" onClick={() => setModuleMenuOpen((open) => !open)} aria-expanded={moduleMenuOpen} className="flex min-h-11 w-full items-center justify-between rounded-lg border border-sidebar-border bg-sidebar-accent/60 px-3 text-sm font-medium hover:bg-sidebar-accent">
            <span>{moduleLabels[activeModule]}</span><ChevronDown className={cn("h-4 w-4 transition-transform", moduleMenuOpen && "rotate-180")} />
          </button>
          {moduleMenuOpen && <div className="absolute left-0 right-0 top-12 z-50 rounded-lg border border-sidebar-border bg-sidebar p-1 shadow-lg">{availableModules.map((module) => <button key={module} type="button" onClick={() => switchModule(module)} className={cn("flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm", module === activeModule ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent")}>{moduleLabels[module]}</button>)}</div>}
        </div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {moduleNav.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.to === "/tasks" && tasksAttentionCount > 0 && (
                <span
                  className={cn(
                    "text-[10px] rounded-full px-1.5 py-0.5 font-semibold",
                    tasksBadgeClass,
                  )}
                >
                  {tasksAttentionCount}
                </span>
              )}
              {item.to === "/alerts" && alertCounts.total > 0 && (
                <span
                  className={cn(
                    "text-[10px] rounded-full px-1.5 py-0.5 font-semibold",
                    alertsBadgeClass,
                  )}
                >
                  {alertCounts.total}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = [...maintenanceNav, ...workforceNav, ...nav].find((n) => (n.exact ? pathname === n.to : pathname.startsWith(n.to)));
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b">
      <div className="flex min-h-14 items-center gap-3 px-4 py-2 md:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm md:text-base">{current?.label ?? "Dashboard"}</span>
          </div>
        </div>
        <div className="flex-1" />
        <OperationalContextSwitcher />
        <div className="relative w-full max-w-[200px] hidden xl:block">
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input placeholder="Search…" className="pl-8 h-9" />
        </div>
        <button className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}

function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { tasks, alerts, clinicalAlerts, canAccess, currentRole } = useCare();
  const todayKey = new Date().toISOString().slice(0, 10);
  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "deleted" && t.dueDate.slice(0, 10) < todayKey,
  ).length;
  const dueTodayTasks = tasks.filter(
    (t) =>
      t.status !== "completed" && t.status !== "deleted" && t.dueDate.slice(0, 10) === todayKey,
  ).length;
  const tasksAttentionCount = overdueTasks + dueTodayTasks;
  const tasksBadgeClass =
    overdueTasks > 0
      ? "bg-destructive text-destructive-foreground"
      : "bg-warning/20 text-warning-foreground";
  const alertCounts = openAlertCounts({ alerts, clinicalAlerts });
  const alertsBadgeClass =
    alertCounts.critical > 0
      ? "bg-destructive text-destructive-foreground"
      : "bg-warning/20 text-warning-foreground";
  const groupOwnerHidden = new Set([
    "/daily-notes",
    "/fast-care",
    "/outings",
    "/risks",
    "/alerts",
    "/handovers",
    "/care-plans",
    "/assessments",
    "/tasks",
    "/visitors",
  ]);
  const donHidden = new Set<string>([]);
  const visible = nav
    .filter((i) => !i.capability || canAccess(i.capability))
    .filter((i) => !i.visible || i.visible(canAccess, currentRole))
    .filter((i) => currentRole !== "group_owner" || !groupOwnerHidden.has(i.to))
    .filter((i) => currentRole !== "don" || !donHidden.has(i.to))
  const workforceVisible = workforceNav
    .filter((i) => !i.capability || canAccess(i.capability))
    .filter((i) => !i.visible || i.visible(canAccess, currentRole));
  const canViewMaintenance = canAccess("permission.manage") || canAccess("maintenance.work_orders.view") || canAccess("maintenance.contractors.register.view");
  const visibleMobile = [
    ...visible,
    ...(canViewMaintenance ? [{ to: "/maintenance", label: "Maintenance", icon: Wrench } as NavItem] : []),
    ...workforceVisible,
  ].slice(0, 5);
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar text-sidebar-foreground border-t border-sidebar-border flex justify-around py-1.5">
      {visibleMobile.map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px]",
              active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70",
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="flex items-center gap-1">
              <span>{item.label}</span>
              {item.to === "/tasks" && tasksAttentionCount > 0 && (
                <span
                  className={cn(
                    "text-[9px] rounded-full px-1 py-0.5 font-semibold",
                    tasksBadgeClass,
                  )}
                >
                  {tasksAttentionCount}
                </span>
              )}
              {item.to === "/alerts" && alertCounts.total > 0 && (
                <span
                  className={cn(
                    "text-[9px] rounded-full px-1 py-0.5 font-semibold",
                    alertsBadgeClass,
                  )}
                >
                  {alertCounts.total}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell() {
  return (
    <CareProvider>
      <div className="min-h-screen flex bg-background">
        <SidebarInner />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <ShellMain />
        </div>
        <MobileNav />
        <Toaster richColors position="top-right" />
      </div>
    </CareProvider>
  );
}

function ShellMain() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return <main className={cn("flex-1 pb-20 md:pb-8", pathname.startsWith("/maintenance") && "maintenance-experience")}><Outlet /></main>;
}
