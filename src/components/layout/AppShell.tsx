import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { CareProvider, useCare } from "@/lib/care/store";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  HeartPulse,
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
  Gauge,
  GraduationCap,
  IdCard,
  Landmark,
  Shield,
  Wrench,
  UserRoundCog,
  ChevronDown,
  BriefcaseBusiness,
  FileText,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RoleSwitcher } from "@/components/care/RoleSwitcher";
import { UserMenu } from "@/components/care/UserMenu";
import { GlobalFilter } from "@/components/care/GlobalFilter";
import { OperationalContextSwitcher } from "@/components/care/OperationalContextSwitcher";

type CapabilityCheck = (capability: string, resource?: { nursingHomeId?: string; wardId?: string; residentId?: string; sensitive?: boolean }) => boolean;
type NavItem = { to: any; label: string; icon: any; exact?: boolean; capability?: string; visible?: (canAccess: CapabilityCheck) => boolean };

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
    to: "/workforce/training",
    label: "Training",
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
];

const nav: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    to: "/operations",
    label: "Operations",
    icon: Building2,
    // TODO: Re-enable Operations for Nurse if Operations and Dashboard become separate workflows again.
    visible: (canAccess) => canAccess("ops.edit") || canAccess("ops.edit_own"),
  },
  { to: "/residents", label: "Residents", icon: Users, capability: "resident.view" },
  {
    to: "/quality-governance",
    label: "Quality Governance",
    icon: Shield,
    capability: "permission.manage",
  },
  {
    to: "/accounts-dashboard",
    label: "Accounts",
    icon: Landmark,
    capability: "finance.view",
  },
  {
    to: "/maintenance-housekeeping",
    label: "Maintenance",
    icon: Wrench,
    capability: "permission.manage",
  },
  {
    to: "/training-dashboard",
    label: "Training",
    icon: GraduationCap,
    capability: "assessment.reports",
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
  {
    to: "/compliance",
    label: "Compliance",
    icon: ShieldCheck,
    capability: "compliance.view",
  },
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

function SidebarInner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { tasks, canAccess, currentRole } = useCare();
  const [workforceOpen, setWorkforceOpen] = useState(pathname.startsWith("/workforce") || pathname.startsWith("/staff-management"));
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
  const groupOwnerHidden = new Set([
    "/daily-notes",
    "/operations",
    "/outings",
    "/risks",
    "/alerts",
    "/handovers",
    "/care-plans",
    "/assessments",
    "/tasks",
    "/visitors",
  ]);
  const visible = nav
    .filter((i) => !i.capability || canAccess(i.capability))
    .filter((i) => !i.visible || i.visible(canAccess))
    .filter((i) => currentRole !== "group_owner" || !groupOwnerHidden.has(i.to));
  const visibleWorkforce = workforceNav
    .filter((i) => !i.capability || canAccess(i.capability))
    .filter((i) => !i.visible || i.visible(canAccess));

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
        <img
          src={`${import.meta.env.BASE_URL}nucare-logo.png`}
          alt="NuCare"
          className="h-9 w-9 rounded-lg object-cover"
        />
        <div>
          <div className="font-semibold tracking-tight">NuCare</div>
          <div className="text-xs text-sidebar-foreground/60">Care Planning System</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {visible.map((item) => {
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
            </Link>
          );
        })}
        {visibleWorkforce.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setWorkforceOpen((open) => !open)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname.startsWith("/workforce") || pathname.startsWith("/staff-management")
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <UserRoundCog className="h-4 w-4" />
              <span className="flex-1 text-left">Workforce Management</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", workforceOpen && "rotate-180")} />
            </button>
            {workforceOpen && (
              <div className="mt-1 space-y-0.5 pl-5">
                {visibleWorkforce.map((item) => {
                  const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>
    </aside>
  );
}

function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = [...nav, ...workforceNav].find((n) => (n.exact ? pathname === n.to : pathname.startsWith(n.to)));
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b">
      <div className="flex items-center gap-3 px-4 md:px-6 h-14">
        <div className="font-semibold text-sm md:text-base">{current?.label ?? "NuCare"}</div>
        <Badge variant="outline" className="hidden sm:inline-flex text-[10px]">
          Demo Data
        </Badge>
        <div className="flex-1" />
        <GlobalFilter />
        <OperationalContextSwitcher />
        <div className="relative w-full max-w-[200px] hidden xl:block">
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input placeholder="Search…" className="pl-8 h-9" />
        </div>
        <RoleSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}

function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { tasks, canAccess, currentRole } = useCare();
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
  const groupOwnerHidden = new Set([
    "/daily-notes",
    "/operations",
    "/outings",
    "/risks",
    "/alerts",
    "/handovers",
    "/care-plans",
    "/assessments",
    "/tasks",
    "/visitors",
  ]);
  const visible = nav
    .filter((i) => !i.capability || canAccess(i.capability))
    .filter((i) => !i.visible || i.visible(canAccess))
    .filter((i) => currentRole !== "group_owner" || !groupOwnerHidden.has(i.to))
  const workforceVisible = workforceNav
    .filter((i) => !i.capability || canAccess(i.capability))
    .filter((i) => !i.visible || i.visible(canAccess));
  const visibleMobile = [...visible, ...workforceVisible].slice(0, 5);
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
          <main className="flex-1 pb-20 md:pb-8">
            <Outlet />
          </main>
        </div>
        <MobileNav />
        <Toaster richColors position="top-right" />
      </div>
    </CareProvider>
  );
}
