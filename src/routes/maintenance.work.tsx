import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, ClipboardCheck, Clock, Plus, Search, Wrench } from "lucide-react";
import { useCare } from "@/lib/care/store";
import {
  projectUnifiedWork,
  sortUnifiedWork,
  unifiedWorkCounts,
  type UnifiedWorkItem,
  type UnifiedWorkType,
} from "@/domain/maintenance/unifiedWork";
import { workOrderRegisterFilters } from "@/domain/maintenance/quickIssue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type Tab =
  | "all"
  | "work-orders"
  | "my-work"
  | "unassigned"
  | "overdue"
  | "waiting"
  | "verification"
  | "completed";
interface WorkSearch {
  tab: Tab;
  search?: string;
  homeId?: string;
  workType?: UnifiedWorkType;
  dueState?: string;
  assignedTo?: string;
  priority?: string;
}
const tabs: Array<[Tab, string]> = [
  ["all", "All Work"],
  ["work-orders", "Work Orders"],
  ["my-work", "My Work"],
  ["unassigned", "Unassigned"],
  ["overdue", "Overdue"],
  ["waiting", "Waiting"],
  ["verification", "Verification"],
  ["completed", "Completed"],
];
export const Route = createFileRoute("/maintenance/work")({
  head: () => ({ meta: [{ title: "Maintenance Work - ORITAS" }] }),
  validateSearch: (s: Record<string, unknown>): WorkSearch => ({
    tab: tabs.some(([x]) => x === s.tab) ? (s.tab as Tab) : "all",
    search: typeof s.search === "string" ? s.search : undefined,
    homeId: typeof s.homeId === "string" ? s.homeId : undefined,
    workType: typeof s.workType === "string" ? (s.workType as UnifiedWorkType) : undefined,
    dueState: typeof s.dueState === "string" ? s.dueState : undefined,
    assignedTo: typeof s.assignedTo === "string" ? s.assignedTo : undefined,
    priority: typeof s.priority === "string" ? s.priority : undefined,
  }),
  component: WorkPage,
});

function WorkPage() {
  const care = useCare();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const homeIds = care.facilities
    .filter(
      (home) =>
        care.canAccess("permission.manage", { nursingHomeId: home.id }) ||
        care.canAccess("maintenance.work_orders.view", { nursingHomeId: home.id }),
    )
    .map((home) => home.id);
  const all = useMemo(
    () => projectUnifiedWork(care, homeIds, new Date()),
    [care, homeIds.join("|")],
  );
  const counts = useMemo(() => unifiedWorkCounts(all), [all]);
  const rows = useMemo(
    () => sortUnifiedWork(all.filter((item) => filterItem(item, search, care.currentUser.id))),
    [all, search, care.currentUser.id],
  );
  const update = (patch: Partial<WorkSearch>) =>
    navigate({ search: (old) => ({ ...old, ...patch }) as WorkSearch, replace: true });
  const next = sortUnifiedWork(
    all.filter(
      (item) =>
        (item.assignedUserId === care.currentUser.id || item.assignedTeamId) &&
        !["COMPLETED", "CANCELLED", "ARCHIVED"].includes(item.status),
    ),
  )[0];
  const registerHref = workOrderHref(
    workOrderRegisterFilters({
      homeId: search.homeId,
      dueState: search.dueState,
      assignedTo: search.assignedTo,
      priority: search.priority,
    }),
  );
  return (
    <main className="space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Maintenance / Work</div>
          <h1 className="text-3xl font-semibold">Work</h1>
          <p className="mt-1 max-w-3xl text-base text-muted-foreground">
            See, assign and complete maintenance, safety, housekeeping and follow-up work from one
            place.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="lg" asChild>
            <Link to="/maintenance/work-orders/new">
              <Plus className="mr-2 h-5 w-5" />
              Create Work Order
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/maintenance/report-issue">Report an Issue</Link>
          </Button>
        </div>
      </header>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(([value, caption]) =>
          value === "work-orders" ? (
            <Button key={value} size="lg" variant="outline" asChild>
              <a href={registerHref} title="Open the complete Work Order Register">
                {caption}
              </a>
            </Button>
          ) : (
            <Button
              key={value}
              size="lg"
              variant={search.tab === value ? "default" : "outline"}
              onClick={() => update({ tab: value })}
            >
              {caption}
            </Button>
          ),
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Work Orders opens the complete authoritative register directly, preserving compatible
        Nursing Home, due, assignee and priority filters.
      </p>
      <WorkOrderCards all={all} />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          label="Critical"
          value={counts.critical}
          icon={<AlertTriangle />}
          onClick={() => update({ tab: "all", priority: "CRITICAL" })}
        />
        <Metric
          label="Overdue"
          value={counts.overdue}
          icon={<Clock />}
          onClick={() => update({ tab: "overdue" })}
        />
        <Metric
          label="Unassigned"
          value={counts.unassigned}
          icon={<Wrench />}
          onClick={() => update({ tab: "unassigned" })}
        />
        <Metric
          label="Waiting"
          value={counts.waiting}
          icon={<Clock />}
          onClick={() => update({ tab: "waiting" })}
        />
        <Metric
          label="Awaiting Verification"
          value={counts.verification}
          icon={<ClipboardCheck />}
          onClick={() => update({ tab: "verification" })}
        />
      </section>
      {search.tab === "my-work" && (
        <div>
          <Button size="lg" disabled={!next} asChild={Boolean(next)}>
            {next ? (
              <a href={next.sourceRoute}>Start Next</a>
            ) : (
              "No work is currently assigned to you."
            )}
          </Button>
        </div>
      )}
      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              className="h-11 pl-10 text-base"
              placeholder="Search reference, issue, location or assignee"
              value={search.search || ""}
              onChange={(e) => update({ search: e.target.value || undefined })}
            />
          </div>
          <select
            className="h-11 rounded-md border bg-background px-3"
            value={search.homeId || ""}
            onChange={(e) => update({ homeId: e.target.value || undefined })}
          >
            <option value="">All Nursing Homes</option>
            {care.facilities
              .filter((x) => homeIds.includes(x.id))
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
          </select>
          <select
            className="h-11 rounded-md border bg-background px-3"
            value={search.workType || ""}
            onChange={(e) =>
              update({ workType: (e.target.value || undefined) as UnifiedWorkType | undefined })
            }
          >
            <option value="">All work types</option>
            {[...new Map(all.map((x) => [x.sourceType, x.workType])).entries()].map(
              ([value, caption]) => (
                <option key={value} value={value}>
                  {caption}
                </option>
              ),
            )}
          </select>
          <select
            className="h-11 rounded-md border bg-background px-3"
            value={search.dueState || ""}
            onChange={(e) => update({ dueState: e.target.value || undefined })}
          >
            <option value="">All due states</option>
            {["DUE_NOW", "DUE_TODAY", "DUE_SOON", "OVERDUE", "FUTURE", "NO_DUE_DATE"].map((x) => (
              <option key={x} value={x}>
                {label(x)}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>
      <div className="text-sm text-muted-foreground">
        {rows.length} work item{rows.length === 1 ? "" : "s"}
      </div>
      <section className="grid gap-3">
        {rows.length ? (
          rows.map((item) => <WorkCard key={item.id} item={item} />)
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-base text-muted-foreground">
              {empty(search.tab)}
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
function filterItem(item: UnifiedWorkItem, s: WorkSearch, userId: string) {
  if (s.tab === "all" && ["COMPLETED", "CANCELLED", "ARCHIVED"].includes(item.status)) return false;
  if (s.tab === "work-orders" && item.sourceType !== "WORK_ORDER") return false;
  if (s.tab === "my-work" && item.assignedUserId !== userId && !item.assignedTeamId) return false;
  if (
    s.tab === "unassigned" &&
    (item.assignedUserId ||
      item.assignedTeamId ||
      item.contractorId ||
      ["COMPLETED", "CANCELLED", "ARCHIVED"].includes(item.status))
  )
    return false;
  if (s.tab === "overdue" && item.dueState !== "OVERDUE") return false;
  if (s.tab === "waiting" && !["WAITING", "AWAITING_EVIDENCE"].includes(item.status)) return false;
  if (
    s.tab === "verification" &&
    !["AWAITING_VERIFICATION", "REINSPECTION_REQUIRED"].includes(item.status)
  )
    return false;
  if (s.tab === "completed" && item.status !== "COMPLETED") return false;
  if (s.homeId && item.nursingHomeId !== s.homeId) return false;
  if (s.workType && item.sourceType !== s.workType) return false;
  if (s.dueState && item.dueState !== s.dueState) return false;
  if (s.priority && item.priority !== s.priority) return false;
  if (
    s.search &&
    !`${item.reference} ${item.title} ${item.shortDescription || ""} ${item.nursingHomeName} ${item.location || ""} ${item.assignedUserName || ""}`
      .toLowerCase()
      .includes(s.search.toLowerCase())
  )
    return false;
  return true;
}
function WorkCard({ item }: { item: UnifiedWorkItem }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{item.priority}</Badge>
            <Badge>{item.workType}</Badge>
            <Badge variant="outline">{label(item.sourceStatus)}</Badge>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="text-sm text-muted-foreground">
              {item.reference} · {item.nursingHomeName}
              {item.location ? ` · ${item.location}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span>
              {item.assignedUserName || item.assignedUserId || item.assignedTeamId || "Unassigned"}
            </span>
            <span>
              {item.dueAt
                ? `Due ${new Date(item.dueAt.length === 10 ? `${item.dueAt}T12:00:00` : item.dueAt).toLocaleString()}`
                : "No due date"}
            </span>
            {item.overdueDays > 0 && (
              <strong className="text-red-700">
                Overdue by {item.overdueDays} day{item.overdueDays === 1 ? "" : "s"}
              </strong>
            )}
          </div>
          {item.hasBlocker && (
            <p className="text-sm font-medium text-amber-800">
              Blocked: {item.blockerSummary || "Action required"}
            </p>
          )}
        </div>
        <Button size="lg" asChild>
          <a href={item.sourceRoute}>{item.primaryAction}</a>
        </Button>
      </CardContent>
    </Card>
  );
}
function Metric({
  label: caption,
  value,
  icon,
  onClick,
}: {
  label: string;
  value: number;
  icon: any;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border bg-card p-4 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {caption}
      </span>
      <strong className="mt-2 block text-3xl">{value}</strong>
    </button>
  );
}
function WorkOrderCards({ all }: { all: UnifiedWorkItem[] }) {
  const work = all.filter((x) => x.sourceType === "WORK_ORDER"),
    today = new Date().toISOString().slice(0, 10);
  const cards = [
    [
      "Active",
      work.filter((x) => !["COMPLETED", "CANCELLED", "ARCHIVED"].includes(x.status)).length,
      "active",
    ],
    [
      "Unassigned",
      work.filter((x) => !x.assignedUserId && !x.assignedTeamId && !x.contractorId).length,
      "unassigned",
    ],
    ["Critical", work.filter((x) => x.priority === "CRITICAL").length, "critical"],
    [
      "Due Today",
      work.filter((x) => ["DUE_NOW", "DUE_TODAY"].includes(x.dueState)).length,
      "due_today",
    ],
    ["Overdue", work.filter((x) => x.dueState === "OVERDUE").length, "overdue"],
    ["Waiting", work.filter((x) => x.status === "WAITING").length, "waiting"],
    [
      "Awaiting Verification",
      work.filter((x) => x.status === "AWAITING_VERIFICATION").length,
      "verification",
    ],
    ["Completed Today", work.filter((x) => x.completedAt?.startsWith(today)).length, "completed"],
  ] as const;
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold">Work Order Register</h2>
      <div className="grid gap-2 grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
        {cards.map(([caption, count, preset]) => (
          <a
            key={caption}
            href={`/maintenance/work-orders?preset=${preset}`}
            className="rounded-lg border bg-card p-3 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <strong className="block text-2xl">{count}</strong>
            <span className="text-sm">{caption}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
function workOrderHref(filters: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((item) => params.append(key, String(item)));
    else params.set(key, String(value));
  }
  return `/maintenance/work-orders${params.size ? `?${params}` : ""}`;
}
function label(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (x) => x.toUpperCase());
}
function empty(tab: Tab) {
  return {
    all: "No active work matches these filters.",
    "work-orders": "No Work Orders match these filters.",
    "my-work": "No work is currently assigned to you.",
    unassigned: "All active work is currently assigned.",
    overdue: "No overdue work.",
    waiting: "No work is currently waiting.",
    verification: "No work is awaiting your verification.",
    completed: "No completed work matches these filters.",
  }[tab];
}
