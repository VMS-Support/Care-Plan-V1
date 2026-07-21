import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, ClipboardList, LayoutGrid, List, Plus, Search, Wrench } from "lucide-react";
import { useCare } from "@/lib/care/store";
import type { MaintenanceWorkOrderPriority, MaintenanceWorkOrderStatus } from "@/lib/care/types";
import {
  ACTIVE_WORK_ORDER_STATUSES,
  WAITING_WORK_ORDER_STATUSES,
  WORK_ORDER_CATEGORIES,
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUSES,
  isWorkOrderOverdue,
  queryWorkOrders,
  workOrderAssigneeLabel,
  workOrderCategoryLabel,
  workOrderLocationLabel,
  workOrderPriorityLabel,
  workOrderStatusLabel,
  type WorkOrderPreset,
  type WorkOrderQuery,
  type WorkOrderSortBy,
  type WorkOrderView,
} from "@/domain/maintenance/workOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/maintenance/work-orders")({
  head: () => ({ meta: [{ title: "Maintenance Work Orders - NuCare" }] }),
  validateSearch: (search: Record<string, unknown>) => parseWorkOrderSearch(search),
  component: WorkOrdersRoute,
});

const PRESETS: Array<{ value: WorkOrderPreset; label: string }> = [
  { value: "active", label: "Active" },
  { value: "unassigned", label: "Unassigned" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High Priority" },
  { value: "due_today", label: "Due Today" },
  { value: "overdue", label: "Overdue" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "verification", label: "Verification" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

function WorkOrdersRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname.replace(/\/+$/, "") });
  if (pathname !== "/maintenance/work-orders") return <Outlet />;
  return <WorkOrdersPage />;
}

function WorkOrdersPage() {
  const care = useCare();
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch() as WorkOrderQuery;

  if (!care.canAccess("maintenance.work_orders.view")) {
    return <PermissionState />;
  }

  const scopedSource = useMemo(
    () => ({
      ...care,
      workOrders: care.maintenanceWorkOrders.filter((record) => canViewWorkOrderRecord(care, record)),
    }),
    [care],
  );
  const result = useMemo(() => queryWorkOrders(scopedSource, search), [scopedSource, search]);
  const activeFilterCount = [
    search.search,
    search.homeId,
    search.status?.length,
    search.priority?.length,
    search.category?.length,
    search.assignedUserId,
    search.unassignedOnly,
    search.overdueOnly,
    search.residentSafetyImpact,
    search.serviceDisruption,
    search.complianceImpact,
    search.archived,
  ].filter(Boolean).length;

  const updateSearch = (patch: Partial<WorkOrderQuery>) => {
    navigate({
      search: (current) => parseWorkOrderSearch({ ...current, ...patch, page: patch.page || 1 }),
      replace: true,
    });
  };
  const clearFilters = () => navigate({ search: () => parseWorkOrderSearch({ view: search.view }) });

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/maintenance" className="hover:text-foreground">Maintenance</Link>
            <ArrowRight className="h-3.5 w-3.5" />
            <span>Work Orders</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Work Orders</h1>
          <p className="text-sm text-muted-foreground">Reactive, corrective, emergency and housekeeping maintenance issues.</p>
        </div>
        <Button asChild>
          <Link to="/maintenance/work-orders/new"><Plus className="mr-2 h-4 w-4" />Create Work Order</Link>
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {PRESETS.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            variant={search.preset === preset.value ? "default" : "outline"}
            size="sm"
            className="shrink-0"
            onClick={() => updateSearch({ preset: preset.value, status: undefined, priority: undefined, overdueOnly: undefined, unassignedOnly: undefined })}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-6 lg:grid-cols-[1.5fr_repeat(5,minmax(130px,1fr))_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={search.search || ""} onChange={(event) => updateSearch({ search: event.target.value })} placeholder="Search number, issue, room, Care Home or assignee" className="pl-9" />
          </div>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={search.homeId || ""} onChange={(event) => updateSearch({ homeId: event.target.value || undefined, roomId: undefined })}>
            <option value="">All Care Homes</option>
            {care.facilities.map((home) => <option key={home.id} value={home.id}>{home.name}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={single(search.priority)} onChange={(event) => updateSearch({ priority: event.target.value ? [event.target.value as MaintenanceWorkOrderPriority] : undefined })}>
            <option value="">All priorities</option>
            {WORK_ORDER_PRIORITIES.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={single(search.status)} onChange={(event) => updateSearch({ status: event.target.value ? [event.target.value as MaintenanceWorkOrderStatus] : undefined, preset: "all" })}>
            <option value="">All statuses</option>
            {WORK_ORDER_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={single(search.category)} onChange={(event) => updateSearch({ category: event.target.value ? [event.target.value as any] : undefined })}>
            <option value="">All categories</option>
            {WORK_ORDER_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={search.sortBy} onChange={(event) => updateSearch({ sortBy: event.target.value as WorkOrderSortBy })}>
            <option value="dueAt">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="status">Sort by Status</option>
            <option value="createdAt">Sort by Created Date</option>
            <option value="updatedAt">Sort by Updated Date</option>
            <option value="workOrderNumber">Sort by Number</option>
            <option value="home">Sort by Care Home</option>
            <option value="assignee">Sort by Assignee</option>
          </select>
          <Button type="button" variant="outline" onClick={clearFilters}>
            Clear {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {result.total === 0 ? "No results" : `Showing ${(result.page - 1) * result.pageSize + 1}-${Math.min(result.page * result.pageSize, result.total)} of ${result.total}`}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant={search.view === "list" ? "default" : "outline"} size="sm" onClick={() => updateSearch({ view: "list" })}><List className="mr-2 h-4 w-4" />List</Button>
          <Button type="button" variant={search.view === "board" ? "default" : "outline"} size="sm" onClick={() => updateSearch({ view: "board" })}><LayoutGrid className="mr-2 h-4 w-4" />Board</Button>
        </div>
      </div>

      {result.total === 0 ? (
        <EmptyState filtered={activeFilterCount > 0 || search.preset !== "active"} clearFilters={clearFilters} />
      ) : search.view === "board" ? (
        <BoardView records={result.allFiltered} />
      ) : (
        <ListView records={result.records} sort={search} updateSearch={updateSearch} />
      )}

      {search.view === "list" && result.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={search.pageSize} onChange={(event) => updateSearch({ pageSize: Number(event.target.value), page: 1 })}>
            {[25, 50, 100].map((size) => <option key={size} value={size}>{size} per page</option>)}
          </select>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={result.page <= 1} onClick={() => updateSearch({ page: result.page - 1 })}><ChevronLeft className="mr-2 h-4 w-4" />Previous</Button>
            <span className="text-sm text-muted-foreground">Page {result.page} of {result.pageCount}</span>
            <Button variant="outline" disabled={result.page >= result.pageCount} onClick={() => updateSearch({ page: result.page + 1 })}>Next<ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ListView({ records }: { records: ReturnType<typeof queryWorkOrders>["records"]; sort: WorkOrderQuery; updateSearch: (patch: Partial<WorkOrderQuery>) => void }) {
  const care = useCare();
  return (
    <Card>
      <CardContent className="p-0">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Work Order</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{record.title}</div>
                    <div className="text-xs text-muted-foreground">{record.workOrderNumber} - {workOrderCategoryLabel(record.category)}</div>
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={record.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                  <td className="px-4 py-3">{workOrderLocationLabel(record, care)}</td>
                  <td className="px-4 py-3"><DueLabel record={record} /></td>
                  <td className="px-4 py-3">{workOrderAssigneeLabel(record, care.users)}</td>
                  <td className="px-4 py-3 text-right"><Button asChild size="sm" variant="outline"><Link to="/maintenance/work-orders/$workOrderId" params={{ workOrderId: record.id }}>Open</Link></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 p-3 md:hidden">
          {records.map((record) => <WorkOrderCard key={record.id} record={record} />)}
        </div>
      </CardContent>
    </Card>
  );
}

function BoardView({ records }: { records: ReturnType<typeof queryWorkOrders>["allFiltered"] }) {
  const columns = [
    { label: "Open", statuses: ["OPEN", "ASSIGNED", "ACCEPTED"] as MaintenanceWorkOrderStatus[] },
    { label: "In Progress", statuses: ["IN_PROGRESS"] as MaintenanceWorkOrderStatus[] },
    { label: "Waiting", statuses: WAITING_WORK_ORDER_STATUSES },
    { label: "Verification", statuses: ["VERIFICATION_REQUIRED"] as MaintenanceWorkOrderStatus[] },
    { label: "Completed", statuses: ["COMPLETED", "VERIFIED", "CLOSED"] as MaintenanceWorkOrderStatus[] },
    { label: "Cancelled", statuses: ["CANCELLED", "ENTERED_IN_ERROR"] as MaintenanceWorkOrderStatus[] },
  ];
  return (
    <div className="grid gap-3 overflow-x-auto pb-2 lg:grid-cols-3 2xl:grid-cols-6">
      {columns.map((column) => {
        const columnRecords = records.filter((record) => column.statuses.includes(record.status));
        return (
          <Card key={column.label} className="min-w-[280px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                {column.label}
                <Badge variant="secondary">{columnRecords.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {columnRecords.length === 0 && <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No Work Orders.</div>}
              {columnRecords.map((record) => <WorkOrderCard key={record.id} record={record} />)}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function WorkOrderCard({ record }: { record: ReturnType<typeof queryWorkOrders>["records"][number] }) {
  const care = useCare();
  return (
    <Link to="/maintenance/work-orders/$workOrderId" params={{ workOrderId: record.id }} className="block rounded-lg border bg-card p-4 text-sm shadow-sm transition-colors hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{record.title}</div>
          <div className="text-xs text-muted-foreground">{record.workOrderNumber}</div>
        </div>
        <PriorityBadge priority={record.priority} />
      </div>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <div>{workOrderLocationLabel(record, care)}</div>
        <div>{workOrderAssigneeLabel(record, care.users)}</div>
        <DueLabel record={record} />
      </div>
      <div className="mt-3"><StatusBadge status={record.status} /></div>
    </Link>
  );
}

function PriorityBadge({ priority }: { priority: MaintenanceWorkOrderPriority }) {
  return <Badge className={cn("whitespace-nowrap", priorityClass(priority))}>{workOrderPriorityLabel(priority)}</Badge>;
}

function StatusBadge({ status }: { status: MaintenanceWorkOrderStatus }) {
  return <Badge variant={ACTIVE_WORK_ORDER_STATUSES.includes(status) ? "secondary" : "outline"}>{workOrderStatusLabel(status)}</Badge>;
}

function DueLabel({ record }: { record: ReturnType<typeof queryWorkOrders>["records"][number] }) {
  if (!record.dueAt) return <span className="text-muted-foreground">No due date</span>;
  const overdue = isWorkOrderOverdue(record);
  return (
    <span className={cn("inline-flex items-center gap-1", overdue && "font-semibold text-destructive")}>
      {overdue && <AlertTriangle className="h-3.5 w-3.5" />}
      {new Date(record.dueAt).toLocaleString()}
    </span>
  );
}

function EmptyState({ filtered, clearFilters }: { filtered: boolean; clearFilters: () => void }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted">
          <ClipboardList className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">{filtered ? "No Matching Work Orders" : "No Work Orders Yet"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{filtered ? "No Work Orders match the selected search and filters." : "No maintenance Work Orders have been recorded for this Care Home."}</p>
        <div className="mt-4 flex justify-center gap-2">
          {filtered && <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>}
          <Button asChild><Link to="/maintenance/work-orders/new">Create Work Order</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PermissionState() {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          <Wrench className="mx-auto mb-3 h-8 w-8" />
          <h1 className="text-base font-semibold text-foreground">Work Orders Not Available</h1>
          <p className="mt-1">You do not have permission to view Work Orders for this area.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function parseWorkOrderSearch(search: Record<string, unknown>): WorkOrderQuery {
  const view = search.view === "board" ? "board" : "list";
  const preset = PRESETS.some((item) => item.value === search.preset) ? search.preset as WorkOrderPreset : "active";
  const page = positiveNumber(search.page, 1);
  const pageSize = [25, 50, 100].includes(Number(search.pageSize)) ? Number(search.pageSize) : 25;
  return {
    view: view as WorkOrderView,
    preset,
    search: stringValue(search.search),
    homeId: stringValue(search.homeId),
    roomId: stringValue(search.roomId),
    priority: enumArray(search.priority, WORK_ORDER_PRIORITIES.map((item) => item.value)),
    status: enumArray(search.status, WORK_ORDER_STATUSES.map((item) => item.value)),
    category: enumArray(search.category, WORK_ORDER_CATEGORIES.map((item) => item.value)) as any,
    overdueOnly: boolValue(search.overdue) || boolValue(search.overdueOnly),
    unassignedOnly: boolValue(search.unassignedOnly),
    residentSafetyImpact: boolValue(search.residentSafetyImpact),
    serviceDisruption: boolValue(search.serviceDisruption),
    complianceImpact: boolValue(search.complianceImpact),
    archived: boolValue(search.archived),
    sortBy: ["workOrderNumber", "priority", "status", "createdAt", "dueAt", "home", "assignee", "updatedAt"].includes(String(search.sortBy)) ? search.sortBy as WorkOrderSortBy : "dueAt",
    sortDirection: search.sortDirection === "desc" ? "desc" : "asc",
    page,
    pageSize,
  };
}

function single<T>(value?: T[]) {
  return value?.[0] ? String(value[0]) : "";
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function boolValue(value: unknown) {
  return value === true || value === "true";
}

function positiveNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function enumArray<T extends string>(value: unknown, allowed: T[]) {
  const values = (Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [])
    .map((item) => String(item).trim())
    .filter((item): item is T => allowed.includes(item as T));
  return values.length ? values : undefined;
}

function priorityClass(priority: MaintenanceWorkOrderPriority) {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case "HIGH":
      return "bg-orange-100 text-orange-800 hover:bg-orange-100";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-900 hover:bg-yellow-100";
    case "LOW":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "ROUTINE":
      return "bg-slate-100 text-slate-700 hover:bg-slate-100";
  }
}

function canViewWorkOrderRecord(care: ReturnType<typeof useCare>, record: ReturnType<typeof queryWorkOrders>["records"][number]) {
  if (care.canAccess("maintenance.work_orders.view_all_for_home", { nursingHomeId: record.homeId })) return true;
  if (record.assignedUserId === care.currentUser.id && care.canAccess("maintenance.work_orders.view_assigned", { nursingHomeId: record.homeId })) return true;
  if (record.reportedByUserId === care.currentUser.id && care.canAccess("maintenance.work_orders.view_reported_own", { nursingHomeId: record.homeId })) return true;
  return false;
}

export function WorkOrdersLoadingState() {
  return (
    <div className="p-6 space-y-3">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
