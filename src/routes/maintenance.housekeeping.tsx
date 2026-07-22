import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, ClipboardList, DoorOpen, FileText, Plus, RotateCcw, Sparkles } from "lucide-react";
import { useCare } from "@/lib/care/store";
import type { HousekeepingCleaningType, HousekeepingTask, HousekeepingTemplate } from "@/lib/care/types";
import { cleaningTypeLabel, housekeepingDashboardMetrics, housekeepingDueStatus, housekeepingStatusLabel, roomReadinessBlockers } from "@/domain/maintenance/housekeeping";
import { frequencyLabel } from "@/domain/maintenance/plannedMaintenance";
import { workOrderPriorityLabel } from "@/domain/maintenance/workOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/maintenance/housekeeping")({
  head: () => ({ meta: [{ title: "Housekeeping - NuCare" }] }),
  component: HousekeepingRoute,
});

type Tab = "overview" | "schedule" | "tasks" | "readiness" | "audits" | "inspections" | "exceptions" | "reinspection" | "completed" | "reports" | "settings";

const tabs: Array<{ value: Tab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "schedule", label: "Cleaning Schedule" },
  { value: "tasks", label: "Cleaning Tasks" },
  { value: "readiness", label: "Room Readiness" },
  { value: "audits", label: "Cleaning Audits" },
  { value: "inspections", label: "Quality Inspections" },
  { value: "exceptions", label: "Exceptions" },
  { value: "reinspection", label: "Reinspection" },
  { value: "completed", label: "Completed Cleaning" },
  { value: "reports", label: "Reports" },
  { value: "settings", label: "Settings" },
];

function HousekeepingRoute() {
  const care = useCare();
  const [tab, setTab] = useState<Tab>("overview");
  const [cleaningType, setCleaningType] = useState<"" | HousekeepingCleaningType>("");
  const [search, setSearch] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const [taskDialog, setTaskDialog] = useState(false);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [exceptionDialog, setExceptionDialog] = useState<{ open: boolean; taskId?: string }>({ open: false });
  const [message, setMessage] = useState("");

  const metrics = useMemo(() => housekeepingDashboardMetrics({
    templates: care.housekeepingTemplates,
    schedules: care.housekeepingSchedules,
    tasks: care.housekeepingTasks,
    exceptions: care.housekeepingExceptions,
    inspections: care.housekeepingQualityInspections,
    audits: care.housekeepingCleaningAudits,
    readiness: care.housekeepingRoomReadiness,
    today: new Date("2026-07-22T09:00:00.000Z"),
  }), [care.housekeepingTemplates, care.housekeepingSchedules, care.housekeepingTasks, care.housekeepingExceptions, care.housekeepingQualityInspections, care.housekeepingCleaningAudits, care.housekeepingRoomReadiness]);

  const filteredTasks = care.housekeepingTasks
    .filter((task) => !cleaningType || task.cleaningType === cleaningType)
    .filter((task) => searchable([task.title, task.taskNumber, task.locationLabel, task.status], search))
    .sort((a, b) => `${a.dueDate} ${a.dueTime || ""}`.localeCompare(`${b.dueDate} ${b.dueTime || ""}`));
  const activeTasks = filteredTasks.filter((task) => !["COMPLETED", "CANCELLED", "SKIPPED"].includes(task.status));
  const completedTasks = filteredTasks.filter((task) => task.status === "COMPLETED");
  const selectedTask = care.housekeepingTasks.find((task) => task.id === selectedTaskId);

  const action = (fn: () => void, success: string) => {
    try { fn(); setMessage(success); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Action failed."); }
  };

  return (
    <main className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Maintenance &gt; Housekeeping</div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Housekeeping</h1>
          <p className="text-sm text-muted-foreground">Cleaning schedules, task execution, evidence, exceptions, quality inspections and room readiness.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setTaskDialog(true)}><Plus className="mr-2 h-4 w-4" />Ad Hoc Task</Button>
          <Button size="sm" variant="outline" onClick={() => setScheduleDialog(true)}>Create Schedule</Button>
          <Button size="sm" variant="outline" onClick={() => setTemplateDialog(true)}>New Template</Button>
        </div>
      </div>

      {message && <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">{message}</div>}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Metric icon={<ClipboardList />} label="Tasks Due Today" value={metrics.dueToday} tone="blue" />
        <Metric icon={<AlertTriangle />} label="Overdue" value={metrics.overdue} tone="red" />
        <Metric icon={<Sparkles />} label="In Progress" value={metrics.inProgress} tone="amber" />
        <Metric icon={<ClipboardCheck />} label="Awaiting Inspection" value={metrics.awaitingInspection} tone="purple" />
        <Metric icon={<DoorOpen />} label="Rooms Blocked" value={metrics.roomBlocked} tone="red" />
        <Metric icon={<CheckCircle2 />} label="Completion Rate" value={`${metrics.completionRate}%`} tone="green" />
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button key={item.value} onClick={() => setTab(item.value)} className={cn("whitespace-nowrap rounded-md border px-3 py-2 text-sm", tab === item.value ? "border-blue-600 bg-blue-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50")}>{item.label}</button>
        ))}
      </div>

      <div className="flex flex-col gap-2 md:flex-row">
        <Input placeholder="Search room, location, task or status" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={cleaningType} onChange={(event) => setCleaningType(event.target.value as "" | HousekeepingCleaningType)} className="h-10 rounded-md border bg-white px-3 text-sm">
          <option value="">All cleaning types</option>
          <option value="ROUTINE">Routine Cleaning</option>
          <option value="DEEP">Deep Cleaning</option>
          <option value="ENHANCED">Enhanced Cleaning</option>
          <option value="TERMINAL">Terminal Cleaning</option>
        </select>
      </div>

      {tab === "overview" && <Overview metrics={metrics} tasks={activeTasks} onSelect={setSelectedTaskId} />}
      {tab === "schedule" && <SchedulePanel care={care} action={action} />}
      {tab === "tasks" && <TasksPanel tasks={activeTasks} selectedTask={selectedTask} care={care} onSelect={setSelectedTaskId} action={action} onException={(taskId) => setExceptionDialog({ open: true, taskId })} />}
      {tab === "readiness" && <ReadinessPanel care={care} action={action} />}
      {tab === "audits" && <AuditsPanel care={care} />}
      {tab === "inspections" && <InspectionsPanel care={care} action={action} />}
      {tab === "exceptions" && <ExceptionsPanel care={care} action={action} />}
      {tab === "reinspection" && <ReinspectionPanel care={care} action={action} />}
      {tab === "completed" && <TaskList title="Completed Cleaning History" tasks={completedTasks} onSelect={setSelectedTaskId} empty="No completed cleaning matches the selected filters." />}
      {tab === "reports" && <ReportsPanel metrics={metrics} care={care} />}
      {tab === "settings" && <SettingsPanel care={care} action={action} />}

      <TaskDialog open={taskDialog} onOpenChange={setTaskDialog} care={care} action={action} />
      <TemplateDialog open={templateDialog} onOpenChange={setTemplateDialog} care={care} action={action} />
      <ScheduleDialog open={scheduleDialog} onOpenChange={setScheduleDialog} care={care} action={action} />
      <ExceptionDialog state={exceptionDialog} setState={setExceptionDialog} care={care} action={action} />
    </main>
  );
}

function Overview({ metrics, tasks, onSelect }: { metrics: ReturnType<typeof housekeepingDashboardMetrics>; tasks: HousekeepingTask[]; onSelect: (id: string) => void }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      <Card><CardHeader><CardTitle>Cleaning Workload</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-4">{metrics.byCleaningType.map((item) => <div key={item.type} className="rounded-lg border p-3"><div className="text-sm font-semibold">{item.label}</div><div className="mt-2 text-2xl font-bold">{item.open}</div><div className="text-xs text-muted-foreground">{item.completed} completed - {item.failed} failed</div></div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Operational Queues</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><Info label="Open Exceptions" value={metrics.openExceptions} /><Info label="Quality Failures" value={metrics.qualityFailures} /><Info label="Audit Failures" value={metrics.auditFailures} /><Info label="Completed Today" value={metrics.completedToday} /></CardContent></Card>
      <TaskList title="Active Cleaning Tasks" tasks={tasks.slice(0, 8)} onSelect={onSelect} empty="No housekeeping tasks match the selected filters." />
    </div>
  );
}

function SchedulePanel({ care, action }: { care: ReturnType<typeof useCare>; action: (fn: () => void, success: string) => void }) {
  return <Card><CardHeader><CardTitle>Cleaning Schedule</CardTitle></CardHeader><CardContent className="space-y-2">{care.housekeepingSchedules.length === 0 ? <Empty text="No cleaning schedules have been configured for this Home." /> : care.housekeepingSchedules.map((schedule) => <Row key={schedule.id}><div><div className="font-medium">{schedule.scheduleName}</div><div className="text-xs text-muted-foreground">{cleaningTypeLabel(schedule.cleaningType)} - {schedule.locationLabel || schedule.locationId} - {frequencyLabel(schedule.frequencyType, schedule.frequencyInterval)}</div></div><div className="flex items-center gap-2"><Badge>{schedule.paused ? "Paused" : schedule.active ? "Active" : "Inactive"}</Badge><span className="text-sm">Next {schedule.nextDueDate} {schedule.preferredTime}</span><Button size="sm" variant="outline" onClick={() => action(() => care.generateHousekeepingTask(schedule.id), "Cleaning task generated.")}>Generate Next</Button>{schedule.paused ? <Button size="sm" variant="outline" onClick={() => action(() => care.resumeHousekeepingSchedule(schedule.id), "Schedule resumed.")}>Resume</Button> : <Button size="sm" variant="outline" onClick={() => action(() => care.pauseHousekeepingSchedule(schedule.id, "Operational pause"), "Schedule paused.")}>Pause</Button>}</div></Row>)}</CardContent></Card>;
}

function TasksPanel({ tasks, selectedTask, care, onSelect, action, onException }: { tasks: HousekeepingTask[]; selectedTask?: HousekeepingTask; care: ReturnType<typeof useCare>; onSelect: (id: string) => void; action: (fn: () => void, success: string) => void; onException: (taskId: string) => void }) {
  const responses = selectedTask ? care.housekeepingTaskResponses.filter((item) => item.taskId === selectedTask.id).sort((a, b) => a.displayOrder - b.displayOrder) : [];
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
      <TaskList title="Cleaning Tasks" tasks={tasks} onSelect={onSelect} empty="No housekeeping tasks match the selected filters." />
      <Card><CardHeader><CardTitle>{selectedTask ? selectedTask.taskNumber : "Task Detail"}</CardTitle></CardHeader><CardContent>{!selectedTask ? <Empty text="Select a cleaning task to view checklist, evidence and workflow actions." /> : <div className="space-y-4"><div><div className="text-lg font-semibold">{selectedTask.title}</div><div className="text-sm text-muted-foreground">{selectedTask.locationLabel} - due {selectedTask.dueDate} {selectedTask.dueTime}</div><div className="mt-2 flex flex-wrap gap-2"><Badge className={statusClass(selectedTask.status)}>{housekeepingStatusLabel(selectedTask.status)}</Badge><Badge>{cleaningTypeLabel(selectedTask.cleaningType)}</Badge><Badge>{workOrderPriorityLabel(selectedTask.priority)}</Badge></div></div><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => action(() => care.startHousekeepingTask(selectedTask.id), "Task started.")}>Start</Button><Button size="sm" variant="outline" onClick={() => action(() => care.completeHousekeepingTask(selectedTask.id, { cleanerDeclarationAccepted: true, completionNotes: "Cleaning completed." }), "Task completed or moved to inspection.")}>Complete</Button><Button size="sm" variant="outline" onClick={() => onException(selectedTask.id)}>Add Exception</Button><Button size="sm" variant="outline" onClick={() => action(() => care.failHousekeepingTask(selectedTask.id, "Failed during cleaning execution."), "Task marked failed.")}>Fail</Button></div><div className="space-y-2">{responses.map((response) => <div key={response.id} className="rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><div className="font-medium">{response.questionLabelSnapshot}</div><div className="text-xs text-muted-foreground">{response.sectionNameSnapshot}</div></div><select value={response.result} onChange={(event) => action(() => care.updateHousekeepingTaskResponse(response.id, { result: event.target.value as typeof response.result, responseValue: event.target.value }), "Checklist response saved.")} className="h-9 rounded-md border px-2 text-sm"><option value="UNANSWERED">Unanswered</option><option value="PASS">Pass</option><option value="FAIL">Fail</option><option value="NOT_APPLICABLE">N/A</option></select></div>{response.result === "FAIL" && <Textarea className="mt-2" placeholder="Observation for failure" value={response.observation || ""} onChange={(event) => care.updateHousekeepingTaskResponse(response.id, { observation: event.target.value })} />}</div>)}</div></div>}</CardContent></Card>
    </div>
  );
}

function ReadinessPanel({ care, action }: { care: ReturnType<typeof useCare>; action: (fn: () => void, success: string) => void }) {
  return <Card><CardHeader><CardTitle>Room Readiness</CardTitle></CardHeader><CardContent className="space-y-2">{care.housekeepingRoomReadiness.length === 0 ? <Empty text="All applicable rooms are currently ready or have no housekeeping blockers." /> : care.housekeepingRoomReadiness.map((room) => { const blockers = roomReadinessBlockers({ readiness: room, tasks: care.housekeepingTasks, inspections: care.housekeepingQualityInspections, exceptions: care.housekeepingExceptions, workOrders: care.maintenanceWorkOrders }); return <Row key={room.id}><div><div className="font-medium">{room.roomId}</div><div className="text-xs text-muted-foreground">{room.readinessNotes}</div>{blockers.length > 0 && <div className="mt-1 text-xs text-red-700">{blockers.join(" ")}</div>}</div><div className="flex items-center gap-2"><Badge className={readinessClass(room.readinessStatus)}>{housekeepingStatusLabel(room.readinessStatus)}</Badge><Button size="sm" variant="outline" onClick={() => action(() => care.markRoomReady(room.roomId, "Housekeeping checks completed."), "Room marked ready.")}>Mark Ready</Button><Button size="sm" variant="outline" onClick={() => action(() => care.markRoomUnavailable(room.roomId, "Room unavailable from housekeeping review."), "Room marked unavailable.")}>Unavailable</Button></div></Row>; })}</CardContent></Card>;
}

function InspectionsPanel({ care, action }: { care: ReturnType<typeof useCare>; action: (fn: () => void, success: string) => void }) {
  return <Card><CardHeader><CardTitle>Quality Inspections</CardTitle></CardHeader><CardContent className="space-y-2">{care.housekeepingQualityInspections.length === 0 ? <Empty text="No quality inspections are pending." /> : care.housekeepingQualityInspections.map((inspection) => <Row key={inspection.id}><div><div className="font-medium">{care.housekeepingTasks.find((task) => task.id === inspection.taskId)?.title || inspection.taskId}</div><div className="text-xs text-muted-foreground">{inspection.locationLabel} - score {inspection.score ?? "not recorded"}</div></div><div className="flex gap-2"><Badge className={statusClass(inspection.status)}>{housekeepingStatusLabel(inspection.status)}</Badge><Button size="sm" variant="outline" onClick={() => action(() => care.startHousekeepingQualityInspection(inspection.id), "Inspection started.")}>Start</Button><Button size="sm" variant="outline" onClick={() => action(() => care.completeHousekeepingQualityInspection(inspection.id, { result: "PASS", score: 95, notes: "Passed quality inspection." }), "Inspection passed.")}>Pass</Button><Button size="sm" variant="outline" onClick={() => action(() => care.completeHousekeepingQualityInspection(inspection.id, { result: "FAIL", score: 60, notes: "Failed quality inspection." }), "Inspection failed.")}>Fail</Button></div></Row>)}</CardContent></Card>;
}

function ExceptionsPanel({ care, action }: { care: ReturnType<typeof useCare>; action: (fn: () => void, success: string) => void }) {
  return <Card><CardHeader><CardTitle>Cleaning, Waste and Linen Exceptions</CardTitle></CardHeader><CardContent className="space-y-2">{care.housekeepingExceptions.length === 0 ? <Empty text="No open housekeeping exceptions match the selected filters." /> : care.housekeepingExceptions.map((exception) => <Row key={exception.id}><div><div className="font-medium">{exception.category}</div><div className="text-xs text-muted-foreground">{exception.exceptionType} - {exception.locationLabel} - {exception.description}</div></div><div className="flex gap-2"><Badge className={severityClass(exception.severity)}>{exception.severity}</Badge><Badge>{housekeepingStatusLabel(exception.status)}</Badge><Button size="sm" variant="outline" onClick={() => action(() => care.resolveHousekeepingException(exception.id, "Resolved by housekeeping."), "Exception resolved.")}>Resolve</Button>{exception.requiresMaintenanceWorkOrder && <Button size="sm" variant="outline" onClick={() => action(() => care.createHousekeepingExceptionWorkOrder(exception.id), "Work Order created or opened.")}>Create Work Order</Button>}</div></Row>)}</CardContent></Card>;
}

function ReinspectionPanel({ care, action }: { care: ReturnType<typeof useCare>; action: (fn: () => void, success: string) => void }) {
  return <Card><CardHeader><CardTitle>Reinspection Queue</CardTitle></CardHeader><CardContent className="space-y-2">{care.housekeepingReinspections.length === 0 ? <Empty text="No housekeeping reinspections are currently required." /> : care.housekeepingReinspections.map((item) => <Row key={item.id}><div><div className="font-medium">{item.reason}</div><div className="text-xs text-muted-foreground">Due {item.dueDate} - task {item.originalTaskId}</div></div><div className="flex gap-2"><Badge>{housekeepingStatusLabel(item.status)}</Badge><Button size="sm" variant="outline" onClick={() => action(() => care.completeHousekeepingReinspection(item.id, "PASS", "Reinspection passed."), "Reinspection passed.")}>Pass</Button><Button size="sm" variant="outline" onClick={() => action(() => care.completeHousekeepingReinspection(item.id, "FAIL", "Reinspection failed."), "Reinspection failed.")}>Fail</Button></div></Row>)}</CardContent></Card>;
}

function AuditsPanel({ care }: { care: ReturnType<typeof useCare> }) {
  return <Card><CardHeader><CardTitle>Cleaning Audits</CardTitle></CardHeader><CardContent className="space-y-2">{care.housekeepingCleaningAudits.length === 0 ? <Empty text="No housekeeping audits have been recorded." /> : care.housekeepingCleaningAudits.map((audit) => <Row key={audit.id}><div><div className="font-medium">{audit.auditNumber}</div><div className="text-xs text-muted-foreground">{housekeepingStatusLabel(audit.auditType)} - {audit.locationLabel || audit.roomId} - {audit.auditDate}</div></div><div className="flex gap-2"><Badge className={statusClass(audit.status)}>{housekeepingStatusLabel(audit.status)}</Badge><span className="text-sm">{audit.score ?? "-"}%</span></div></Row>)}</CardContent></Card>;
}

function ReportsPanel({ metrics, care }: { metrics: ReturnType<typeof housekeepingDashboardMetrics>; care: ReturnType<typeof useCare> }) {
  return <div className="grid gap-4 md:grid-cols-3"><Report title="Cleaning Completion" value={`${metrics.completionRate}%`} detail={`${care.housekeepingTasks.length} total cleaning tasks`} /><Report title="Failed Cleaning" value={metrics.failed} detail="Tasks requiring corrective workflow" /><Report title="Room Readiness" value={metrics.roomBlocked} detail="Rooms with housekeeping blockers" /><Report title="Quality" value={metrics.qualityFailures} detail="Failed quality inspections" /><Report title="Exceptions" value={metrics.openExceptions} detail="Open waste, linen and cleaning exceptions" /><Report title="Audits" value={care.housekeepingCleaningAudits.length} detail="Operational cleaning audits" /></div>;
}

function SettingsPanel({ care, action }: { care: ReturnType<typeof useCare>; action: (fn: () => void, success: string) => void }) {
  return <Card><CardHeader><CardTitle>Cleaning Templates</CardTitle></CardHeader><CardContent className="space-y-2">{care.housekeepingTemplates.map((template) => <Row key={template.id}><div><div className="font-medium">{template.name}</div><div className="text-xs text-muted-foreground">{template.code} - {cleaningTypeLabel(template.cleaningType)} - {frequencyLabel(template.defaultFrequencyType, template.defaultFrequencyInterval)} - {care.housekeepingTemplateItems.filter((item) => item.templateId === template.id).length} checklist items</div></div><div className="flex gap-2"><Badge>{housekeepingStatusLabel(template.status)}</Badge><Button size="sm" variant="outline" onClick={() => action(() => care.duplicateHousekeepingTemplate(template.id), "Template duplicated.")}>Duplicate</Button>{template.active ? <Button size="sm" variant="outline" onClick={() => action(() => care.deactivateHousekeepingTemplate(template.id), "Template deactivated.")}>Deactivate</Button> : <Button size="sm" variant="outline" onClick={() => action(() => care.activateHousekeepingTemplate(template.id), "Template activated.")}>Activate</Button>}</div></Row>)}</CardContent></Card>;
}

function TaskList({ title, tasks, onSelect, empty }: { title: string; tasks: HousekeepingTask[]; onSelect: (id: string) => void; empty: string }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-2">{tasks.length === 0 ? <Empty text={empty} /> : tasks.map((task) => <button key={task.id} onClick={() => onSelect(task.id)} className="w-full rounded-lg border bg-white p-3 text-left hover:bg-slate-50"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-medium">{task.title}</div><div className="text-xs text-muted-foreground">{task.taskNumber} - {task.locationLabel || task.roomId} - {task.dueDate} {task.dueTime}</div></div><div className="flex gap-2"><Badge>{cleaningTypeLabel(task.cleaningType)}</Badge><Badge className={statusClass(housekeepingDueStatus(task, new Date("2026-07-22T09:00:00.000Z")))}>{housekeepingStatusLabel(housekeepingDueStatus(task, new Date("2026-07-22T09:00:00.000Z")))}</Badge></div></div></button>)}</CardContent></Card>;
}

function TaskDialog({ open, onOpenChange, care, action }: { open: boolean; onOpenChange: (open: boolean) => void; care: ReturnType<typeof useCare>; action: (fn: () => void, success: string) => void }) {
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("2026-07-22");
  const [locationLabel, setLocationLabel] = useState("");
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Create Housekeeping Task</DialogTitle><DialogDescription>Create an authorised one-off cleaning task.</DialogDescription></DialogHeader><div className="space-y-3"><Select value={templateId} onChange={setTemplateId} options={care.housekeepingTemplates.filter((item) => item.active).map((item) => [item.id, item.name])} placeholder="Select template" /><Input placeholder="Task title" value={title} onChange={(event) => setTitle(event.target.value)} /><Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /><Input placeholder="Room or location" value={locationLabel} onChange={(event) => setLocationLabel(event.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => action(() => { care.createAdHocHousekeepingTask({ templateId, title, dueDate, locationLabel }); onOpenChange(false); }, "Housekeeping task created.")}>Create</Button></DialogFooter></DialogContent></Dialog>;
}

function TemplateDialog({ open, onOpenChange, care, action }: { open: boolean; onOpenChange: (open: boolean) => void; care: ReturnType<typeof useCare>; action: (fn: () => void, success: string) => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<HousekeepingCleaningType>("ROUTINE");
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Create Cleaning Template</DialogTitle><DialogDescription>Build a reusable cleaning definition and starter checklist.</DialogDescription></DialogHeader><div className="space-y-3"><Input placeholder="Template name" value={name} onChange={(event) => setName(event.target.value)} /><Input placeholder="Template code" value={code} onChange={(event) => setCode(event.target.value)} /><Select value={type} onChange={(value) => setType(value as HousekeepingCleaningType)} options={[["ROUTINE", "Routine Cleaning"], ["DEEP", "Deep Cleaning"], ["ENHANCED", "Enhanced Cleaning"], ["TERMINAL", "Terminal Cleaning"]]} /></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => action(() => { care.createHousekeepingTemplate({ name, code, cleaningType: type, status: "ACTIVE", active: true }); onOpenChange(false); }, "Template created.")}>Create</Button></DialogFooter></DialogContent></Dialog>;
}

function ScheduleDialog({ open, onOpenChange, care, action }: { open: boolean; onOpenChange: (open: boolean) => void; care: ReturnType<typeof useCare>; action: (fn: () => void, success: string) => void }) {
  const [templateId, setTemplateId] = useState("");
  const [name, setName] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [nextDueDate, setNextDueDate] = useState("2026-07-22");
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Create Cleaning Schedule</DialogTitle><DialogDescription>Configure recurring room or location cleaning.</DialogDescription></DialogHeader><div className="space-y-3"><Select value={templateId} onChange={setTemplateId} options={care.housekeepingTemplates.filter((item) => item.active).map((item) => [item.id, item.name])} placeholder="Select template" /><Input placeholder="Schedule name" value={name} onChange={(event) => setName(event.target.value)} /><Input placeholder="Room or location" value={locationLabel} onChange={(event) => setLocationLabel(event.target.value)} /><Input type="date" value={nextDueDate} onChange={(event) => setNextDueDate(event.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => action(() => { care.createHousekeepingSchedule({ templateId, scheduleName: name, locationLabel, nextDueDate }); onOpenChange(false); }, "Schedule created.")}>Create</Button></DialogFooter></DialogContent></Dialog>;
}

function ExceptionDialog({ state, setState, care, action }: { state: { open: boolean; taskId?: string }; setState: (state: { open: boolean; taskId?: string }) => void; care: ReturnType<typeof useCare>; action: (fn: () => void, success: string) => void }) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  return <Dialog open={state.open} onOpenChange={(open) => setState({ open, taskId: state.taskId })}><DialogContent><DialogHeader><DialogTitle>Add Housekeeping Exception</DialogTitle><DialogDescription>Record cleaning, waste, linen, room or maintenance issues without losing task history.</DialogDescription></DialogHeader><div className="space-y-3"><Input placeholder="Category" value={category} onChange={(event) => setCategory(event.target.value)} /><Textarea placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => setState({ open: false })}>Cancel</Button><Button onClick={() => action(() => { care.createHousekeepingException({ taskId: state.taskId!, exceptionType: "CLEANING", category, description, severity: "MEDIUM" }); setState({ open: false }); }, "Exception recorded.")}>Save</Button></DialogFooter></DialogContent></Dialog>;
}

function Metric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: ReactNode; tone: "blue" | "red" | "amber" | "purple" | "green" }) {
  return <Card><CardContent className="flex items-center gap-3 p-4"><div className={cn("rounded-full p-2 [&>svg]:h-5 [&>svg]:w-5", tone === "red" ? "bg-red-50 text-red-700" : tone === "amber" ? "bg-amber-50 text-amber-700" : tone === "purple" ? "bg-purple-50 text-purple-700" : tone === "green" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700")}>{icon}</div><div><div className="text-2xl font-semibold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div></CardContent></Card>;
}
function Row({ children }: { children: ReactNode }) { return <div className="flex flex-col justify-between gap-3 rounded-lg border p-3 md:flex-row md:items-center">{children}</div>; }
function Info({ label, value }: { label: string; value: ReactNode }) { return <div className="flex justify-between border-b py-2 last:border-0"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div>; }
function Report({ title, value, detail }: { title: string; value: ReactNode; detail: string }) { return <Card><CardContent className="p-4"><div className="text-sm font-semibold">{title}</div><div className="mt-2 text-3xl font-bold">{value}</div><div className="mt-1 text-xs text-muted-foreground">{detail}</div><Button className="mt-3" size="sm" variant="outline">View Report <ArrowRight className="ml-2 h-4 w-4" /></Button></CardContent></Card>; }
function Empty({ text }: { text: string }) { return <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</div>; }
function Select({ value, onChange, options, placeholder = "Select" }: { value: string; onChange: (value: string) => void; options: Array<[string, string]>; placeholder?: string }) { return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border bg-white px-3 text-sm"><option value="">{placeholder}</option>{options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}</select>; }
function searchable(values: Array<string | undefined>, query: string) { if (!query.trim()) return true; const haystack = values.filter(Boolean).join(" ").toLowerCase(); return haystack.includes(query.trim().toLowerCase()); }
function statusClass(status: string) { if (["FAILED", "OVERDUE", "CANCELLED"].includes(status)) return "bg-red-100 text-red-800"; if (["IN_PROGRESS", "AWAITING_INSPECTION", "AWAITING_REINSPECTION", "PENDING"].includes(status)) return "bg-amber-100 text-amber-800"; if (["COMPLETED", "PASSED", "READY"].includes(status)) return "bg-green-100 text-green-800"; return "bg-slate-100 text-slate-700"; }
function severityClass(severity: string) { return severity === "CRITICAL" || severity === "HIGH" ? "bg-red-100 text-red-800" : severity === "MEDIUM" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"; }
function readinessClass(status: string) { return status === "READY" || status === "OCCUPIED" ? "bg-green-100 text-green-800" : status.includes("BLOCKED") || status.includes("FAILED") || status === "UNAVAILABLE" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"; }
