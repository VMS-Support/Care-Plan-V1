import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  ListChecks,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Trash2,
  Wrench,
} from "lucide-react";
import { useCare } from "@/lib/care/store";
import type {
  MaintenanceTemplate,
  MaintenanceTemplateChecklist,
  MaintenanceTemplateEvidenceType,
  MaintenanceWorkOrderCategory,
  PlannedMaintenanceFrequencyType,
  PlannedMaintenanceOccurrence,
  PlannedMaintenanceSchedule,
} from "@/lib/care/types";
import {
  PLANNED_MAINTENANCE_EVIDENCE_TYPES,
  PLANNED_MAINTENANCE_FREQUENCIES,
  PLANNED_MAINTENANCE_TEAMS,
  buildPlannedMaintenanceAssets,
  dateOnly,
  daysBetween,
  frequencyLabel,
  occurrenceStatus,
  teamLabel,
} from "@/domain/maintenance/plannedMaintenance";
import { WORK_ORDER_CATEGORIES } from "@/domain/maintenance/workOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/maintenance/planned-maintenance")({
  head: () => ({ meta: [{ title: "Planned Maintenance - NuCare" }] }),
  component: PlannedMaintenanceRoute,
});

type Tab = "overview" | "templates" | "schedules" | "calendar" | "dueSoon" | "overdue" | "recurring";
const TABS: Array<{ value: Tab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "templates", label: "Maintenance Templates" },
  { value: "schedules", label: "Schedules" },
  { value: "calendar", label: "Calendar" },
  { value: "dueSoon", label: "Due Soon" },
  { value: "overdue", label: "Overdue" },
  { value: "recurring", label: "Recurring Tasks" },
];

function PlannedMaintenanceRoute() {
  const care = useCare();
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [templateModal, setTemplateModal] = useState<{ open: boolean; template?: MaintenanceTemplate }>({ open: false });
  const [scheduleModal, setScheduleModal] = useState<{ open: boolean; schedule?: PlannedMaintenanceSchedule }>({ open: false });
  const [message, setMessage] = useState<string>();
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month" | "agenda">("week");
  const [range, setRange] = useState(7);
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateStatus, setTemplateStatus] = useState("all");
  const [templateSort, setTemplateSort] = useState("name");
  const [templatePage, setTemplatePage] = useState(1);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  const assets = useMemo(() => buildPlannedMaintenanceAssets(care), [care]);
  const templates = care.maintenanceTemplates || [];
  const schedules = care.plannedMaintenanceSchedules || [];
  const occurrences = care.plannedMaintenanceOccurrences || [];
  const today = dateOnly(new Date());
  const enriched = useMemo(() => occurrences.map((occurrence) => enrichOccurrence(occurrence, schedules, templates, assets, today)), [occurrences, schedules, templates, assets, today]);
  const filteredTemplates = templates
    .filter((template) => searchable([template.name, template.description, template.category], search))
    .filter((template) => !templateCategory || template.category === templateCategory)
    .filter((template) => templateStatus === "all" || (templateStatus === "active" ? template.active && !template.archivedAt : templateStatus === "archived" ? template.archivedAt : !template.active && !template.archivedAt))
    .sort((a, b) => templateSortValue(a, templateSort).localeCompare(templateSortValue(b, templateSort)));
  const pagedTemplates = filteredTemplates.slice((templatePage - 1) * 10, templatePage * 10);
  const templatePageCount = Math.max(1, Math.ceil(filteredTemplates.length / 10));
  const filteredSchedules = schedules.filter((schedule) => {
    const template = templates.find((item) => item.id === schedule.templateId);
    return searchable([template?.name, schedule.assetName, schedule.locationLabel, schedule.responsibleTeamId], search);
  });
  const dueSoon = enriched.filter((item) => item.sortDays >= 0 && item.sortDays <= range && item.occurrence.status === "Scheduled").sort((a, b) => a.sortDays - b.sortDays);
  const overdue = enriched.filter((item) => item.sortDays < 0 && item.occurrence.status === "Scheduled").sort((a, b) => a.sortDays - b.sortDays);
  const completedThisMonth = enriched.filter((item) => item.occurrence.status === "Completed" && item.occurrence.completedAt?.slice(0, 7) === today.slice(0, 7)).length;
  const recentGenerated = care.maintenanceWorkOrders.filter((item) => item.plannedMaintenanceOccurrenceId).slice(0, 5);

  const run = (action: () => void, success: string) => {
    try {
      action();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete action.");
    }
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/maintenance" className="hover:text-foreground">Maintenance</Link>
            <ArrowRight className="h-3.5 w-3.5" />
            <span>Planned Maintenance</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Planned Maintenance</h1>
          <p className="text-sm text-muted-foreground">Templates, schedules, recurring tasks and generated preventive Work Orders.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => run(() => care.generatePlannedMaintenanceOccurrences(undefined, "2026-12-31"), "Occurrences generated.")}>
            <RotateCcw className="mr-2 h-4 w-4" />Generate Occurrences
          </Button>
          <Button onClick={() => setScheduleModal({ open: true })}><Plus className="mr-2 h-4 w-4" />Create Schedule</Button>
        </div>
      </div>

      {message && <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">{message}</div>}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => (
          <Button key={item.value} variant={tab === item.value ? "default" : "outline"} size="sm" className="shrink-0" onClick={() => setTab(item.value)}>
            {item.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric title="Upcoming Maintenance" value={dueSoon.length} icon={CalendarDays} tone="blue" onClick={() => setTab("dueSoon")} />
        <Metric title="Today's Maintenance" value={enriched.filter((item) => item.sortDays === 0 && item.occurrence.status === "Scheduled").length} icon={Clock} tone="amber" />
        <Metric title="Overdue" value={overdue.length} icon={Clock} tone="red" onClick={() => setTab("overdue")} />
        <Metric title="Completed This Month" value={completedThisMonth} icon={CheckCircle2} tone="green" />
        <Metric title="Active Schedules" value={schedules.filter((item) => item.active && !item.pausedAt).length} icon={RotateCcw} tone="slate" onClick={() => setTab("schedules")} />
        <Metric title="Templates" value={templates.length} icon={FileText} tone="purple" onClick={() => setTab("templates")} />
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <OccurrencePanel title="Upcoming Week" items={dueSoon.slice(0, 8)} onGenerate={(id) => run(() => care.generatePlannedMaintenanceWorkOrder(id), "Work Order generated.")} />
          <Card>
            <CardHeader><CardTitle>Recent Generated Work Orders</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {recentGenerated.length === 0 ? <Empty text="No planned Work Orders generated yet." /> : recentGenerated.map((workOrder) => (
                <Link key={workOrder.id} to="/maintenance/work-orders/$workOrderId" params={{ workOrderId: workOrder.id }} className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/50">
                  <span><strong>{workOrder.workOrderNumber}</strong><br />{workOrder.title}</span>
                  <Badge>{workOrder.status}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "templates" && (
        <Card>
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <div><CardTitle>Maintenance Templates</CardTitle><p className="text-sm text-muted-foreground">Reusable maintenance tasks with checklists and evidence requirements.</p></div>
            <Button onClick={() => setTemplateModal({ open: true })}><Plus className="mr-2 h-4 w-4" />Create Template</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <SearchBox value={search} onChange={setSearch} placeholder="Search templates" />
            <div className="flex flex-wrap items-center gap-2">
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={templateCategory} onChange={(event) => { setTemplateCategory(event.target.value); setTemplatePage(1); }}>
                <option value="">All categories</option>
                {WORK_ORDER_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
              </select>
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={templateStatus} onChange={(event) => { setTemplateStatus(event.target.value); setTemplatePage(1); }}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={templateSort} onChange={(event) => setTemplateSort(event.target.value)}>
                <option value="name">Sort by name</option>
                <option value="category">Sort by category</option>
                <option value="frequency">Sort by frequency</option>
                <option value="duration">Sort by duration</option>
              </select>
              <Button variant="outline" size="sm" disabled={selectedTemplateIds.length === 0} onClick={() => run(() => { selectedTemplateIds.forEach((id) => care.archiveMaintenanceTemplate(id, "Bulk archived from Planned Maintenance")); setSelectedTemplateIds([]); }, "Selected templates archived.")}>
                Archive Selected
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setTemplateCategory(""); setTemplateStatus("all"); setTemplateSort("name"); setTemplatePage(1); setSelectedTemplateIds([]); }}>Clear Filters</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="px-3 py-2"><input type="checkbox" checked={pagedTemplates.length > 0 && pagedTemplates.every((template) => selectedTemplateIds.includes(template.id))} onChange={(event) => setSelectedTemplateIds(event.target.checked ? Array.from(new Set([...selectedTemplateIds, ...pagedTemplates.map((template) => template.id)])) : selectedTemplateIds.filter((id) => !pagedTemplates.some((template) => template.id === id)))} /></th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Frequency</th><th className="px-3 py-2">Duration</th><th className="px-3 py-2">Verification</th><th className="px-3 py-2">Active</th><th className="px-3 py-2 text-right">Actions</th></tr>
                </thead>
                <tbody>{pagedTemplates.map((template) => (
                  <tr key={template.id} className="border-b last:border-0">
                    <td className="px-3 py-3"><input type="checkbox" checked={selectedTemplateIds.includes(template.id)} onChange={(event) => setSelectedTemplateIds(event.target.checked ? [...selectedTemplateIds, template.id] : selectedTemplateIds.filter((id) => id !== template.id))} /></td>
                    <td className="px-3 py-3"><div className="font-medium">{template.name}</div><div className="text-xs text-muted-foreground">{template.description}</div></td>
                    <td className="px-3 py-3">{categoryLabel(template.category)}</td>
                    <td className="px-3 py-3">{frequencyLabel(template.frequencyType, template.frequencyValue)}</td>
                    <td className="px-3 py-3">{template.estimatedDurationMinutes} min</td>
                    <td className="px-3 py-3">{template.verificationRequired ? "Required" : "No"}</td>
                    <td className="px-3 py-3"><Badge variant={template.active && !template.archivedAt ? "default" : "secondary"}>{template.archivedAt ? "Archived" : template.active ? "Active" : "Inactive"}</Badge></td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setTemplateModal({ open: true, template })}>Edit</Button>
                        <Button size="icon" variant="outline" title="Duplicate" onClick={() => run(() => care.duplicateMaintenanceTemplate(template.id), "Template duplicated.")}><Copy className="h-4 w-4" /></Button>
                        <Button size="icon" variant="outline" title="Archive" onClick={() => run(() => care.archiveMaintenanceTemplate(template.id, "Archived from Planned Maintenance"), "Template archived.")}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>Showing {filteredTemplates.length === 0 ? 0 : (templatePage - 1) * 10 + 1}-{Math.min(templatePage * 10, filteredTemplates.length)} of {filteredTemplates.length}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={templatePage <= 1} onClick={() => setTemplatePage(templatePage - 1)}>Previous</Button>
                <span>Page {templatePage} of {templatePageCount}</span>
                <Button variant="outline" size="sm" disabled={templatePage >= templatePageCount} onClick={() => setTemplatePage(templatePage + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "schedules" && (
        <Card>
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <div><CardTitle>Schedules</CardTitle><p className="text-sm text-muted-foreground">Recurring planned maintenance assigned to assets and teams.</p></div>
            <Button onClick={() => setScheduleModal({ open: true })}><Plus className="mr-2 h-4 w-4" />Create Schedule</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <SearchBox value={search} onChange={setSearch} placeholder="Search schedules" />
            <ScheduleTable schedules={filteredSchedules} templates={templates} onEdit={(schedule) => setScheduleModal({ open: true, schedule })} onPause={(schedule) => run(() => care.pausePlannedMaintenanceSchedule(schedule.id, "Paused from schedule list"), "Schedule paused.")} onResume={(schedule) => run(() => care.resumePlannedMaintenanceSchedule(schedule.id), "Schedule resumed.")} />
          </CardContent>
        </Card>
      )}

      {tab === "calendar" && (
        <Card>
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <div><CardTitle>Calendar</CardTitle><p className="text-sm text-muted-foreground">Day, week, month and agenda views of planned occurrences.</p></div>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={calendarView} onChange={(event) => setCalendarView(event.target.value as any)}>
              <option value="day">Day</option><option value="week">Week</option><option value="month">Month</option><option value="agenda">Agenda</option>
            </select>
          </CardHeader>
          <CardContent><CalendarView mode={calendarView} items={enriched} onGenerate={(id) => run(() => care.generatePlannedMaintenanceWorkOrder(id), "Work Order generated.")} /></CardContent>
        </Card>
      )}

      {tab === "dueSoon" && (
        <Card>
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <div><CardTitle>Due Soon</CardTitle><p className="text-sm text-muted-foreground">Upcoming planned maintenance requiring generation or review.</p></div>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={range} onChange={(event) => setRange(Number(event.target.value))}>
              <option value={7}>Next 7 days</option><option value={14}>Next 14 days</option><option value={30}>Next 30 days</option>
            </select>
          </CardHeader>
          <CardContent><OccurrencePanel items={dueSoon} onGenerate={(id) => run(() => care.generatePlannedMaintenanceWorkOrder(id), "Work Order generated.")} /></CardContent>
        </Card>
      )}

      {tab === "overdue" && <OccurrencePanel title="Overdue Maintenance" items={overdue} overdue onGenerate={(id) => run(() => care.generatePlannedMaintenanceWorkOrder(id), "Work Order generated.")} onComplete={(id) => run(() => care.completePlannedMaintenanceOccurrence(id), "Occurrence marked completed.")} />}
      {tab === "recurring" && <ScheduleTable schedules={schedules} templates={templates} recurringOnly onEdit={(schedule) => setScheduleModal({ open: true, schedule })} onPause={(schedule) => run(() => care.pausePlannedMaintenanceSchedule(schedule.id, "Paused from recurring tasks"), "Schedule paused.")} onResume={(schedule) => run(() => care.resumePlannedMaintenanceSchedule(schedule.id), "Schedule resumed.")} />}

      <TemplateDialog open={templateModal.open} template={templateModal.template} onOpenChange={(open) => setTemplateModal({ open })} />
      <ScheduleDialog open={scheduleModal.open} schedule={scheduleModal.schedule} assets={assets} templates={templates.filter((item) => item.active && !item.archivedAt)} onOpenChange={(open) => setScheduleModal({ open })} />
    </div>
  );
}

function Metric({ title, value, icon: Icon, tone, onClick }: { title: string; value: number; icon: any; tone: "blue" | "amber" | "red" | "green" | "slate" | "purple"; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("rounded-lg border bg-card p-4 text-left shadow-sm", onClick && "hover:bg-muted/50")}>
      <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{title}</span><Icon className={cn("h-5 w-5", toneClass(tone))} /></div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </button>
  );
}

function OccurrencePanel({ title, items, overdue, onGenerate, onComplete }: { title?: string; items: ReturnType<typeof enrichOccurrence>[]; overdue?: boolean; onGenerate: (id: string) => void; onComplete?: (id: string) => void }) {
  return (
    <Card>
      {title && <CardHeader><CardTitle>{title}</CardTitle></CardHeader>}
      <CardContent className="p-0">
        {items.length === 0 ? <Empty text={overdue ? "No overdue planned maintenance." : "No planned maintenance due in this period."} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Due Date</th><th className="px-3 py-2">Asset</th><th className="px-3 py-2">Template</th><th className="px-3 py-2">Home</th><th className="px-3 py-2">Priority</th><th className="px-3 py-2">Days</th><th className="px-3 py-2">Team</th><th className="px-3 py-2 text-right">Actions</th></tr></thead>
              <tbody>{items.map((item) => <tr key={item.occurrence.id} className="border-b last:border-0"><td className="px-3 py-3">{formatDate(item.occurrence.dueDate)}</td><td className="px-3 py-3">{item.schedule?.assetName || "Asset"}</td><td className="px-3 py-3">{item.template?.name || "Template"}</td><td className="px-3 py-3">{item.home}</td><td className="px-3 py-3"><Badge className={priorityClass(item.priority)}>{item.priority}</Badge></td><td className="px-3 py-3">{item.sortDays < 0 ? `${Math.abs(item.sortDays)} overdue` : `${item.sortDays} remaining`}</td><td className="px-3 py-3">{teamLabel(item.schedule?.responsibleTeamId)}</td><td className="px-3 py-3"><div className="flex justify-end gap-2">{item.occurrence.workOrderId ? <Button size="sm" asChild><Link to="/maintenance/work-orders/$workOrderId" params={{ workOrderId: item.occurrence.workOrderId }}>Open Work Order</Link></Button> : <Button size="sm" onClick={() => onGenerate(item.occurrence.id)}>Generate Work Order</Button>}{onComplete && <Button size="sm" variant="outline" onClick={() => onComplete(item.occurrence.id)}>Mark Completed</Button>}</div></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScheduleTable({ schedules, templates, recurringOnly, onEdit, onPause, onResume }: { schedules: PlannedMaintenanceSchedule[]; templates: MaintenanceTemplate[]; recurringOnly?: boolean; onEdit: (schedule: PlannedMaintenanceSchedule) => void; onPause: (schedule: PlannedMaintenanceSchedule) => void; onResume: (schedule: PlannedMaintenanceSchedule) => void }) {
  const rows = recurringOnly ? schedules.filter((item) => item.active) : schedules;
  return (
    <Card className={recurringOnly ? "" : "border-0 shadow-none"}>
      {recurringOnly && <CardHeader><CardTitle>Recurring Tasks</CardTitle></CardHeader>}
      <CardContent className="p-0">
        {rows.length === 0 ? <Empty text="No planned maintenance schedules." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Template</th><th className="px-3 py-2">Asset</th><th className="px-3 py-2">Location</th><th className="px-3 py-2">Responsible Team</th><th className="px-3 py-2">Frequency</th><th className="px-3 py-2">Next Due</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Actions</th></tr></thead>
              <tbody>{rows.map((schedule) => { const template = templates.find((item) => item.id === schedule.templateId); return <tr key={schedule.id} className="border-b last:border-0"><td className="px-3 py-3">{template?.name || "Template"}</td><td className="px-3 py-3">{schedule.assetName}</td><td className="px-3 py-3">{schedule.locationLabel}</td><td className="px-3 py-3">{teamLabel(schedule.responsibleTeamId)}</td><td className="px-3 py-3">{frequencyLabel(schedule.frequencyType, schedule.frequencyValue)}</td><td className="px-3 py-3">{formatDate(schedule.nextDueDate)}</td><td className="px-3 py-3"><Badge variant={schedule.active && !schedule.pausedAt ? "default" : "secondary"}>{schedule.pausedAt ? "Paused" : schedule.active ? "Active" : "Inactive"}</Badge></td><td className="px-3 py-3"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => onEdit(schedule)}>Edit</Button>{schedule.pausedAt || !schedule.active ? <Button size="icon" variant="outline" title="Resume" onClick={() => onResume(schedule)}><Play className="h-4 w-4" /></Button> : <Button size="icon" variant="outline" title="Pause" onClick={() => onPause(schedule)}><Pause className="h-4 w-4" /></Button>}</div></td></tr>; })}</tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CalendarView({ mode, items, onGenerate }: { mode: string; items: ReturnType<typeof enrichOccurrence>[]; onGenerate: (id: string) => void }) {
  const visible = items.slice().sort((a, b) => a.occurrence.dueDate.localeCompare(b.occurrence.dueDate)).slice(0, mode === "day" ? 8 : mode === "month" ? 35 : 14);
  if (mode === "agenda") return <OccurrencePanel items={visible} onGenerate={onGenerate} />;
  return (
    <div className={cn("grid gap-3", mode === "day" ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-7")}>
      {visible.map((item) => (
        <button key={item.occurrence.id} type="button" onClick={() => !item.occurrence.workOrderId && onGenerate(item.occurrence.id)} className={cn("rounded-md border p-3 text-left text-sm hover:bg-muted/50", statusBorder(item.status))}>
          <div className="font-semibold">{formatDate(item.occurrence.dueDate)}</div>
          <div className="mt-2">{item.template?.name}</div>
          <div className="text-xs text-muted-foreground">{item.schedule?.assetName}</div>
          <Badge className="mt-3" variant="outline">{item.status}</Badge>
        </button>
      ))}
    </div>
  );
}

function TemplateDialog({ open, template, onOpenChange }: { open: boolean; template?: MaintenanceTemplate; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [form, setForm] = useState(() => templateForm(template, care));
  useMemo(() => setForm(templateForm(template, care)), [template, care]);
  const submit = () => {
    if (template) care.updateMaintenanceTemplate(template.id, form);
    else care.createMaintenanceTemplate(form);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{template ? "Edit Template" : "Create Template"}</DialogTitle><DialogDescription>Build checklist, evidence and recurrence defaults.</DialogDescription></DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Name"><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Category"><Select value={form.category || "OTHER"} onChange={(value) => setForm({ ...form, category: value as MaintenanceWorkOrderCategory })} options={WORK_ORDER_CATEGORIES} /></Field>
          <Field label="Estimated Duration"><Input type="number" value={form.estimatedDurationMinutes || 30} onChange={(e) => setForm({ ...form, estimatedDurationMinutes: Number(e.target.value) })} /></Field>
          <Field label="Frequency"><FrequencyInputs form={form} setForm={setForm} /></Field>
          <Field label="Skills Required"><Input value={form.skillsRequired || ""} onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })} /></Field>
          <Field label="Colour"><Input type="color" value={form.colour || "#2563eb"} onChange={(e) => setForm({ ...form, colour: e.target.value })} /></Field>
          <Field label="Description" className="md:col-span-2"><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Safety Precautions" className="md:col-span-2"><Textarea value={form.safetyPrecautions || ""} onChange={(e) => setForm({ ...form, safetyPrecautions: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.verificationRequired)} onChange={(e) => setForm({ ...form, verificationRequired: e.target.checked })} />Verification required</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} />Active</label>
        </div>
        <Builder title="Checklist" items={form.checklist || []} setItems={(checklist) => setForm({ ...form, checklist })} />
        <div>
          <div className="mb-2 text-sm font-medium">Evidence Required</div>
          <div className="flex flex-wrap gap-2">{PLANNED_MAINTENANCE_EVIDENCE_TYPES.map((type) => <label key={type} className="rounded-md border px-3 py-2 text-sm"><input className="mr-2" type="checkbox" checked={(form.evidence || []).includes(type)} onChange={(e) => setForm({ ...form, evidence: e.target.checked ? [...(form.evidence || []), type] : (form.evidence || []).filter((item) => item !== type) })} />{type}</label>)}</div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>{template ? "Save Template" : "Create Template"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleDialog({ open, schedule, assets, templates, onOpenChange }: { open: boolean; schedule?: PlannedMaintenanceSchedule; assets: ReturnType<typeof buildPlannedMaintenanceAssets>; templates: MaintenanceTemplate[]; onOpenChange: (open: boolean) => void }) {
  const care = useCare();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Partial<PlannedMaintenanceSchedule>>(() => scheduleForm(schedule, templates));
  useMemo(() => { setStep(1); setForm(scheduleForm(schedule, templates)); }, [schedule, templates]);
  const selectedTemplate = templates.find((item) => item.id === form.templateId);
  const submit = () => {
    if (schedule) care.updatePlannedMaintenanceSchedule(schedule.id, form);
    else care.createPlannedMaintenanceSchedule(form);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{schedule ? "Edit Schedule" : "Schedule Builder"}</DialogTitle><DialogDescription>Step {step} of 6</DialogDescription></DialogHeader>
        <div className="flex gap-1">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className={cn("h-1 flex-1 rounded", item <= step ? "bg-blue-600" : "bg-muted")} />)}</div>
        {step === 1 && <Field label="Asset"><Select value={form.assetId || ""} onChange={(assetId) => setForm({ ...form, assetId })} options={assets.map((asset) => ({ value: asset.id, label: `${asset.name} - ${asset.locationLabel}` }))} /></Field>}
        {step === 2 && <Field label="Maintenance Template"><Select value={form.templateId || ""} onChange={(templateId) => { const template = templates.find((item) => item.id === templateId); setForm({ ...form, templateId, frequencyType: template?.frequencyType, frequencyValue: template?.frequencyValue }); }} options={templates.map((template) => ({ value: template.id, label: `${template.name} - ${frequencyLabel(template.frequencyType, template.frequencyValue)} - ${template.estimatedDurationMinutes} min${template.verificationRequired ? " - Verification" : ""}` }))} /></Field>}
        {step === 3 && <Field label="Frequency"><FrequencyInputs form={form} setForm={setForm} /></Field>}
        {step === 4 && <Field label="Responsible Team"><Select value={form.responsibleTeamId || ""} onChange={(responsibleTeamId) => setForm({ ...form, responsibleTeamId })} options={PLANNED_MAINTENANCE_TEAMS.map((team) => ({ value: team.id, label: team.name }))} /></Field>}
        {step === 5 && <div className="grid gap-3 md:grid-cols-3"><Field label="Start Date"><Input type="date" value={form.startDate || ""} onChange={(e) => setForm({ ...form, startDate: e.target.value, nextDueDate: e.target.value })} /></Field><Field label="End Date"><Input type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value || undefined })} /></Field><Field label="Generate Days Before Due"><Input type="number" value={form.generateDaysBeforeDue ?? 7} onChange={(e) => setForm({ ...form, generateDaysBeforeDue: Number(e.target.value) })} /></Field></div>}
        {step === 6 && <div className="rounded-md border p-4 text-sm"><div className="font-semibold">Review Schedule</div><p className="mt-2">Template: {selectedTemplate?.name}</p><p>Asset: {assets.find((item) => item.id === form.assetId)?.name}</p><p>Frequency: {frequencyLabel(form.frequencyType, form.frequencyValue)}</p><p>Team: {teamLabel(form.responsibleTeamId)}</p><p>Start: {form.startDate || "Not selected"}</p><p>Generate: {form.generateDaysBeforeDue ?? 7} days before due</p></div>}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="outline" disabled={step <= 1} onClick={() => setStep(step - 1)}>Back</Button>{step < 6 ? <Button onClick={() => setStep(step + 1)}>Next</Button> : <Button onClick={submit}>{schedule ? "Save Schedule" : "Create Schedule"}</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={cn("space-y-1 text-sm font-medium", className)}><span>{label}</span>{children}</label>;
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select...</option>{options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>;
}

function FrequencyInputs({ form, setForm }: { form: Partial<Pick<MaintenanceTemplate, "frequencyType" | "frequencyValue">>; setForm: (form: any) => void }) {
  return <div className="grid grid-cols-[1fr_100px] gap-2"><Select value={form.frequencyType || "monthly"} onChange={(frequencyType) => setForm({ ...form, frequencyType: frequencyType as PlannedMaintenanceFrequencyType })} options={PLANNED_MAINTENANCE_FREQUENCIES} /><Input type="number" min={1} value={form.frequencyValue || 1} onChange={(e) => setForm({ ...form, frequencyValue: Number(e.target.value) })} /></div>;
}

function Builder({ title, items, setItems }: { title: string; items: Partial<MaintenanceTemplateChecklist>[]; setItems: (items: Partial<MaintenanceTemplateChecklist>[]) => void }) {
  return <div className="space-y-2"><div className="text-sm font-medium">{title}</div>{items.map((item, index) => <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-2"><Input value={item.item || ""} onChange={(e) => setItems(items.map((candidate, itemIndex) => itemIndex === index ? { ...candidate, item: e.target.value } : candidate))} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.mandatory !== false} onChange={(e) => setItems(items.map((candidate, itemIndex) => itemIndex === index ? { ...candidate, mandatory: e.target.checked } : candidate))} />Mandatory</label><Button size="icon" variant="outline" onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button></div>)}<Button variant="outline" size="sm" onClick={() => setItems([...items, { item: "", mandatory: true }])}><Plus className="mr-2 h-4 w-4" />Add Item</Button></div>;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="relative max-w-xl"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pl-9" /></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function enrichOccurrence(occurrence: PlannedMaintenanceOccurrence, schedules: PlannedMaintenanceSchedule[], templates: MaintenanceTemplate[], assets: ReturnType<typeof buildPlannedMaintenanceAssets>, today: string) {
  const schedule = schedules.find((item) => item.id === occurrence.scheduleId);
  const template = templates.find((item) => item.id === schedule?.templateId);
  const asset = assets.find((item) => item.id === schedule?.assetId);
  const sortDays = daysBetween(today, occurrence.dueDate);
  const status = occurrenceStatus(occurrence);
  const priority = sortDays < 0 ? "High" : status === "Due Today" ? "Medium" : template?.verificationRequired ? "Medium" : "Routine";
  return { occurrence, schedule, template, asset, sortDays, status, priority, home: schedule?.locationLabel?.split(" - ")[0] || "Care Home" };
}

function templateForm(template: MaintenanceTemplate | undefined, care: ReturnType<typeof useCare>) {
  return {
    name: template?.name || "",
    description: template?.description || "",
    category: template?.category || "OTHER" as MaintenanceWorkOrderCategory,
    active: template?.active ?? true,
    estimatedDurationMinutes: template?.estimatedDurationMinutes || 30,
    verificationRequired: template?.verificationRequired || false,
    safetyPrecautions: template?.safetyPrecautions || "",
    skillsRequired: template?.skillsRequired || "",
    frequencyType: template?.frequencyType || "monthly" as PlannedMaintenanceFrequencyType,
    frequencyValue: template?.frequencyValue || 1,
    colour: template?.colour || "#2563eb",
    checklist: template ? care.maintenanceTemplateChecklists.filter((item) => item.templateId === template.id).sort((a, b) => a.displayOrder - b.displayOrder) : [{ item: "", mandatory: true }],
    evidence: template ? care.maintenanceTemplateEvidence.filter((item) => item.templateId === template.id).map((item) => item.evidenceType) : [] as MaintenanceTemplateEvidenceType[],
  };
}

function scheduleForm(schedule: PlannedMaintenanceSchedule | undefined, templates: MaintenanceTemplate[]): Partial<PlannedMaintenanceSchedule> {
  const template = templates[0];
  return schedule ? { ...schedule } : { templateId: template?.id, frequencyType: template?.frequencyType || "monthly", frequencyValue: template?.frequencyValue || 1, responsibleTeamId: "maintenance-team", startDate: dateOnly(new Date()), nextDueDate: dateOnly(new Date()), generateDaysBeforeDue: 7, active: true };
}

function searchable(values: unknown[], search: string) {
  if (!search.trim()) return true;
  const term = search.toLowerCase();
  return values.filter(Boolean).some((value) => String(value).toLowerCase().includes(term));
}

function templateSortValue(template: MaintenanceTemplate, sort: string) {
  if (sort === "category") return categoryLabel(template.category);
  if (sort === "frequency") return frequencyLabel(template.frequencyType, template.frequencyValue);
  if (sort === "duration") return String(template.estimatedDurationMinutes).padStart(5, "0");
  return template.name;
}

function categoryLabel(category?: MaintenanceWorkOrderCategory) {
  return WORK_ORDER_CATEGORIES.find((item) => item.value === category)?.label || category || "Other";
}

function formatDate(date?: string) {
  if (!date) return "-";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IE", { day: "2-digit", month: "short", year: "numeric" });
}

function toneClass(tone: string) {
  return ({ blue: "text-blue-600", amber: "text-amber-600", red: "text-red-600", green: "text-green-600", slate: "text-slate-600", purple: "text-purple-600" } as Record<string, string>)[tone] || "text-slate-600";
}

function priorityClass(priority: string) {
  if (priority === "High") return "bg-red-100 text-red-800 hover:bg-red-100";
  if (priority === "Medium") return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  return "bg-slate-100 text-slate-800 hover:bg-slate-100";
}

function statusBorder(status: string) {
  if (status === "Completed") return "border-green-300";
  if (status === "Due Today") return "border-amber-300";
  if (status === "Due Soon") return "border-blue-300";
  if (status === "Overdue") return "border-red-300";
  if (status === "Cancelled") return "border-slate-300";
  return "border-border";
}
