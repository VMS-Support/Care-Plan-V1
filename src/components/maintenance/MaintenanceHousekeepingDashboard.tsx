import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  DoorOpen,
  FileWarning,
  Plus,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useCare } from "@/lib/care/store";
import { maintenanceTodayProjection } from "@/domain/maintenance/maintenanceToday";
import type { UnifiedWorkItem } from "@/domain/maintenance/unifiedWork";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MaintenanceHousekeepingDashboard() {
  const care = useCare();
  const authorised = care.facilities.filter(
    (home) =>
      care.canAccess("maintenance.work_orders.view", { nursingHomeId: home.id }) ||
      care.canAccess("maintenance.work_orders.create", { nursingHomeId: home.id }) ||
      care.canAccess("permission.manage", { nursingHomeId: home.id }),
  );
  const [homeId, setHomeId] = useState(authorised.length === 1 ? authorised[0].id : "");
  const homes = homeId ? [homeId] : authorised.map((x) => x.id);
  const data = useMemo(
    () => maintenanceTodayProjection(care, homes, new Date()),
    [care, homes.join("|")],
  );
  const showManage = care.canAccess("maintenance.work_orders.create", {
    nursingHomeId: homeId || care.activeFacilityId,
  });
  const urgent = [
    {
      title: "Critical Work",
      count: data.workCounts.critical,
      detail: "Requires immediate review",
      href: `/maintenance/work?priority=CRITICAL${homeId ? `&homeId=${homeId}` : ""}`,
      always: true,
      icon: AlertTriangle,
    },
    {
      title: "Overdue Work",
      count: data.workCounts.overdue,
      detail: "Past the agreed due time",
      href: `/maintenance/work?tab=overdue${homeId ? `&homeId=${homeId}` : ""}`,
      always: true,
      icon: Clock,
    },
    {
      title: "Unassigned Work",
      count: data.workCounts.unassigned,
      detail: "Needs an owner",
      href: `/maintenance/work?tab=unassigned${homeId ? `&homeId=${homeId}` : ""}`,
      icon: Wrench,
    },
    {
      title: "Failed Inspections",
      count: data.plannedCompliance.failedInspections,
      detail: "Safety checks requiring action",
      href: "/maintenance/planned-maintenance",
      icon: ShieldAlert,
    },
    {
      title: "Failed Cleaning",
      count: data.housekeeping.failed,
      detail: "Cleaning requires follow-up",
      href: "/maintenance/housekeeping",
      icon: Sparkles,
    },
    {
      title: "Rooms Blocked",
      count: data.roomsBlocked,
      detail: "Cannot accept a new resident",
      href: "/maintenance/assets-rooms-beds",
      icon: DoorOpen,
    },
    {
      title: "Certificates Expired",
      count: data.certificates.expired,
      detail: "Compliance documents expired",
      href: "/maintenance/contractors-certificates?tab=certificates&status=expired",
      icon: FileWarning,
    },
    {
      title: "Corrective Actions Overdue",
      count: data.corrective.overdue,
      detail: "Actions need escalation",
      href: "/maintenance/corrective-actions?tab=overdue",
      icon: ClipboardCheck,
    },
  ].filter((x) => x.always || x.count > 0);
  const next = data.myWork[0];
  return (
    <main className="space-y-8 bg-slate-50/50 p-4 pb-12 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Maintenance</h1>
          <p className="mt-1 max-w-3xl text-base text-muted-foreground">
            See what needs attention today across maintenance, safety, housekeeping and compliance.
          </p>
          <p className="mt-3 text-base font-medium">
            {new Intl.DateTimeFormat("en-IE", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}{" "}
            ·{" "}
            {homeId
              ? authorised.find((x) => x.id === homeId)?.name
              : "All authorised Nursing Homes"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" asChild>
            <Link to="/maintenance/report-issue">Report an Issue</Link>
          </Button>
          {showManage && (
            <Button size="lg" variant="outline" asChild>
              <Link to="/maintenance/work-orders/new">
                <Plus className="mr-2 h-5 w-5" />
                Create Work Order
              </Link>
            </Button>
          )}
        </div>
      </header>
      {authorised.length > 1 && (
        <label className="block max-w-md">
          <span className="mb-2 block text-base font-semibold">Nursing Home</span>
          <select
            className="h-12 w-full rounded-md border bg-background px-3 text-base"
            value={homeId}
            onChange={(e) => setHomeId(e.target.value)}
          >
            <option value="">All Authorised Nursing Homes</option>
            {authorised.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <Section title="Immediate Attention">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {urgent.map((x) => (
            <Attention key={x.title} {...x} />
          ))}
        </div>
        {urgent.every((x) => x.count === 0) && (
          <Empty
            title="No urgent maintenance issues"
            text="There are no critical, overdue or failed items requiring immediate attention."
            href="/maintenance/work"
            action="View All Work"
          />
        )}
      </Section>
      <Section
        title="Today’s Work"
        action={
          <LinkText
            href={`/maintenance/work?dueState=DUE_TODAY${homeId ? `&homeId=${homeId}` : ""}`}
          >
            View All Today’s Work
          </LinkText>
        }
      >
        {data.todaysWork.length ? (
          <WorkList rows={data.todaysWork} />
        ) : (
          <Empty
            title="No work is due today."
            text="You can review work scheduled for the coming days."
            href="/maintenance/work?dueState=FUTURE"
            action="View Upcoming Work"
          />
        )}
      </Section>
      <Section
        title="My Work"
        action={<LinkText href="/maintenance/work?tab=my-work">View All My Work</LinkText>}
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Mini label="Active" value={data.myWorkCounts.active} />
          <Mini label="Overdue" value={data.myWorkCounts.overdue} />
          <Mini label="Due Today" value={data.myWorkCounts.dueToday} />
        </div>
        {next ? (
          <>
            <Button size="lg" className="mb-4" asChild>
              <a href={next.sourceRoute}>Start Next</a>
            </Button>
            <WorkList rows={data.myWork} />
          </>
        ) : (
          <p className="rounded-lg border bg-white p-5 text-base text-muted-foreground">
            No work is currently assigned to you.
          </p>
        )}
      </Section>
      <Section title="Rooms and Beds">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Info
            title="Bed Occupancy"
            value={`${data.occupancy.occupied} of ${data.occupancy.registeredCapacity || "Not configured"}`}
            detail={`${data.occupancy.registeredPercentage}% registered · ${data.occupancy.occupied} of ${data.occupancy.operationalCapacity} operational`}
            href="/maintenance/assets-rooms-beds"
            icon={BedDouble}
          />
          <Info
            title="Beds Available"
            value={data.occupancy.available}
            detail="Ready for assignment"
            href="/maintenance/assets-rooms-beds?tab=beds&status=available"
            icon={BedDouble}
          />
          <Info
            title="Beds Awaiting Cleaning"
            value={data.housekeeping.bedsAwaitingCleaning}
            detail="Cleaning or readiness required"
            href="/maintenance/housekeeping"
            icon={Sparkles}
          />
          <Info
            title="Rooms Blocked"
            value={data.roomsBlocked}
            detail="Cannot accept a new resident"
            href="/maintenance/assets-rooms-beds"
            icon={DoorOpen}
          />
          <Info
            title="Rooms Awaiting Readiness"
            value={data.roomsAwaitingReadiness}
            detail="Inspection or approval pending"
            href="/maintenance/housekeeping"
            icon={ClipboardCheck}
          />
        </div>
      </Section>
      <Section title="Compliance">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Info
            title="Planned Maintenance Overdue"
            value={data.plannedCompliance.plannedOverdue}
            detail="Planned work past due"
            href="/maintenance/planned-maintenance"
            icon={Clock}
          />
          <Info
            title="Safety Verification Outstanding"
            value={data.plannedCompliance.verificationOutstanding}
            detail="Checks require authorised review"
            href="/maintenance/planned-maintenance"
            icon={ShieldAlert}
          />
          <Info
            title="Certificates Due Soon"
            value={data.certificates.dueSoon}
            detail="Approaching configured expiry warning"
            href="/maintenance/contractors-certificates?tab=certificates&status=due-soon"
            icon={FileWarning}
          />
          <Info
            title="Certificates Expired"
            value={data.certificates.expired}
            detail="Renewal or replacement required"
            href="/maintenance/contractors-certificates?tab=certificates&status=expired"
            icon={FileWarning}
          />
          {data.contractorBlockers > 0 && (
            <Info
              title="Contractor Compliance Blockers"
              value={data.contractorBlockers}
              detail="Affecting new work assignment"
              href="/maintenance/contractors-certificates"
              icon={AlertTriangle}
            />
          )}
          <Info
            title="Corrective Actions Awaiting Verification"
            value={data.corrective.awaitingVerification}
            detail="Completed work requires review"
            href="/maintenance/corrective-actions?tab=verification"
            icon={ClipboardCheck}
          />
        </div>
      </Section>
      <Section
        title="Recently Completed"
        action={<LinkText href="/maintenance/work?tab=completed">View Completed Work</LinkText>}
      >
        {data.recentlyCompleted.length ? (
          <WorkList rows={data.recentlyCompleted} />
        ) : (
          <p className="text-base text-muted-foreground">No work has been completed recently.</p>
        )}
      </Section>
    </main>
  );
}
function Section({ title, action, children }: { title: string; action?: any; children: any }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
function Attention({ title, count, detail, href, icon: Icon }: any) {
  return (
    <a
      href={href}
      className="min-h-36 rounded-xl border bg-white p-5 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#248A9F]"
    >
      <div className="flex items-center gap-2 text-base font-semibold">
        <Icon className="h-5 w-5 text-red-700" />
        {title}
      </div>
      <strong className="mt-3 block text-4xl">{count}</strong>
      <span className="mt-1 block text-sm text-muted-foreground">{detail}</span>
    </a>
  );
}
function Info({ title, value, detail, href, icon: Icon }: any) {
  return (
    <a
      href={href}
      className="min-h-32 rounded-xl border bg-white p-4 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#248A9F]"
    >
      <div className="flex items-center gap-2 text-base font-semibold">
        <Icon className="h-5 w-5 text-[#248A9F]" />
        {title}
      </div>
      <strong className="mt-3 block text-3xl">{value}</strong>
      <span className="text-sm text-muted-foreground">{detail}</span>
    </a>
  );
}
function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <strong className="text-3xl">{value}</strong>
      <span className="ml-3 text-base text-muted-foreground">{label}</span>
    </div>
  );
}
function WorkList({ rows }: { rows: UnifiedWorkItem[] }) {
  return (
    <Card>
      <CardContent className="divide-y p-0">
        {rows.map((x) => (
          <a
            href={x.sourceRoute}
            key={x.id}
            className="flex flex-col gap-3 p-4 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#248A9F] md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="mb-1 flex flex-wrap gap-2">
                <Badge variant="outline">{x.workType}</Badge>
                <Badge variant="outline">{x.priority}</Badge>
              </div>
              <h3 className="text-base font-semibold">{x.title}</h3>
              <p className="text-sm text-muted-foreground">
                {x.reference} · {x.location || x.nursingHomeName} ·{" "}
                {x.assignedUserName || x.assignedUserId || x.assignedTeamId || "Unassigned"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">
                {x.dueAt
                  ? new Date(
                      x.dueAt.length === 10 ? `${x.dueAt}T12:00:00` : x.dueAt,
                    ).toLocaleString("en-IE")
                  : "No due date"}
              </span>
              <strong className="text-sm text-[#176979]">{x.primaryAction}</strong>
            </div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
function Empty({
  title,
  text,
  href,
  action,
}: {
  title: string;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-3 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-base text-muted-foreground">{text}</p>
        <Button className="mt-4" variant="outline" asChild>
          <a href={href}>{action}</a>
        </Button>
      </CardContent>
    </Card>
  );
}
function LinkText({ href, children }: { href: string; children: any }) {
  return (
    <a
      href={href}
      className="text-sm font-semibold text-[#176979] hover:underline focus:outline-none focus:ring-2 focus:ring-[#248A9F]"
    >
      {children}
    </a>
  );
}
