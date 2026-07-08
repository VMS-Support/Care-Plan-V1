import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Copy,
  ExternalLink,
  Filter,
  Hospital,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { can } from "@/lib/care/permissions";
import { useCare } from "@/lib/care/store";
import type { Resident, Role, Task } from "@/lib/care/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type TaskCategory = NonNullable<Task["category"]>;
type TaskPriority = NonNullable<Task["priority"]>;
type TaskTab = "active" | "due_today" | "overdue" | "appointments" | "completed" | "all" | "deleted";

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  clinical: "Clinical",
  operational: "Operational",
  administrative: "Administrative",
  resident: "Resident",
  general: "General",
};

const TASK_TYPES: Record<TaskCategory, string[]> = {
  clinical: [
    "GP Request",
    "Hospital Appointment",
    "Blood Test",
    "Consultant Review",
    "Medication Review",
    "Wound Review",
    "Family Meeting",
    "MDT Follow-up",
  ],
  operational: [
    "Transport Booking",
    "Escort Required",
    "Equipment Check",
    "Maintenance",
    "Laundry",
    "Room Transfer",
    "Stock Request",
  ],
  administrative: ["Documentation", "Policy Review", "Audit Action", "Insurance", "Consent Required"],
  resident: [
    "Appointment",
    "Hairdresser",
    "Chiropodist",
    "Optician",
    "Dentist",
    "Family Leave",
    "Outing",
    "Activity",
  ],
  general: ["Custom Task"],
};

const PRIORITIES: TaskPriority[] = ["critical", "high", "normal", "low"];
const ROLES: Role[] = ["don", "cnm", "nurse", "hca", "gp"];

function blankForm() {
  return {
    title: "",
    residentId: "none",
    category: "clinical" as TaskCategory,
    taskType: "GP Request",
    priority: "normal" as TaskPriority,
    assignedToType: "staff" as NonNullable<Task["assignedToType"]>,
    assignedTo: "Care team",
    assignedRole: "nurse" as Role,
    assignedWingId: "none",
    dueDate: `${new Date().toISOString().slice(0, 10)}T14:00`,
    reminderAt: "",
    recurrence: "none" as NonNullable<Task["recurrence"]>,
    recurrenceNotes: "",
    appointmentLocation: "",
    transportRequired: false,
    escortRequired: false,
    escortStaff: "",
    description: "",
  };
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function taskDate(value: string) {
  return new Date(value.includes("T") ? value : `${value}T23:59:00`);
}

function taskTime(value: string) {
  return value.includes("T") && value.length >= 16 ? value.slice(11, 16) : undefined;
}

function formatDue(value: string) {
  const parsed = taskDate(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function residentName(resident?: Resident) {
  return resident ? `${resident.firstName} ${resident.lastName}` : "No resident linked";
}

function taskKind(task: Pick<Task, "taskType" | "appointmentType">) {
  return task.taskType || task.appointmentType || "General Task";
}

function isAppointmentTask(task: Pick<Task, "taskType" | "category" | "appointmentLocation">) {
  return (
    !!task.appointmentLocation ||
    /appointment|consultant|gp request|blood test|review|dentist|optician|chiropodist/i.test(task.taskType || "") ||
    task.category === "resident"
  );
}

function priorityClass(priority?: Task["priority"]) {
  if (priority === "critical") return "border-destructive/30 bg-destructive/10 text-destructive";
  if (priority === "high") return "border-warning/30 bg-warning/20 text-warning-foreground";
  if (priority === "low") return "border-muted bg-muted/40 text-muted-foreground";
  return "border-primary/30 bg-primary/5 text-primary";
}

function statusMeta(task: Task, todayKey: string) {
  if (task.status === "completed") return ["Completed", "border-success/30 bg-success/10 text-success"];
  if (task.status === "deleted") return ["Deleted", "border-destructive/30 bg-destructive/10 text-destructive"];
  if (task.status === "overdue" || dateKey(task.dueDate) < todayKey) {
    return ["Overdue", "border-destructive/30 bg-destructive/10 text-destructive"];
  }
  if (task.status === "in_progress") return ["In Progress", "border-primary/30 bg-primary/10 text-primary"];
  if (dateKey(task.dueDate) === todayKey) return ["Due Today", "border-warning/30 bg-warning/20 text-warning-foreground"];
  return ["Scheduled", "border-border bg-muted/30 text-muted-foreground"];
}

function NewTaskDialog() {
  const { residents, wings, addTask, currentUserName } = useCare();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const showAppointment = isAppointmentTask(form);
  const taskTypes = TASK_TYPES[form.category];

  const assignedTo =
    form.assignedToType === "unassigned"
      ? "Unassigned"
      : form.assignedToType === "role"
        ? form.assignedRole.toUpperCase()
        : form.assignedToType === "wing"
          ? `${wings.find((wing) => wing.id === form.assignedWingId)?.name || "Wing"} team`
          : form.assignedTo.trim() || "Care team";

  const create = () => {
    if (!form.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    addTask({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      residentId: form.residentId === "none" ? undefined : form.residentId,
      category: form.category,
      taskType: form.taskType,
      priority: form.priority,
      assignedTo,
      assignedToType: form.assignedToType,
      assignedRole: form.assignedToType === "role" ? form.assignedRole : undefined,
      assignedWingId: form.assignedToType === "wing" && form.assignedWingId !== "none" ? form.assignedWingId : undefined,
      dueDate: form.dueDate,
      reminderAt: form.reminderAt || undefined,
      recurrence: form.recurrence,
      recurrenceNotes: form.recurrenceNotes.trim() || undefined,
      status: "pending",
      appointmentType: showAppointment ? form.taskType : undefined,
      appointmentLocation: showAppointment ? form.appointmentLocation.trim() || undefined : undefined,
      appointmentTime: showAppointment ? taskTime(form.dueDate) : undefined,
      transportRequired: showAppointment ? form.transportRequired : undefined,
      escortRequired: showAppointment ? form.escortRequired : undefined,
      escortStaff: showAppointment ? form.escortStaff.trim() || undefined : undefined,
      appointmentNotes: showAppointment ? form.description.trim() || undefined : undefined,
      followUpRequired: false,
      createdAt: new Date().toISOString(),
      createdBy: currentUserName,
    });
    toast.success("Task created");
    setForm(blankForm());
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Task</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Resident</Label>
            <Select value={form.residentId} onValueChange={(residentId) => setForm({ ...form, residentId })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No resident linked</SelectItem>
                {residents.map((resident) => (
                  <SelectItem key={resident.id} value={resident.id}>
                    {resident.firstName} {resident.lastName} - Room {resident.roomNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(value) =>
                setForm({ ...form, category: value as TaskCategory, taskType: TASK_TYPES[value as TaskCategory][0] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Task type</Label>
            <Select value={form.taskType} onValueChange={(taskType) => setForm({ ...form, taskType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {taskTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(priority) => setForm({ ...form, priority: priority as TaskPriority })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Due date and time</Label>
            <Input type="datetime-local" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Reminder</Label>
            <Input type="datetime-local" value={form.reminderAt} onChange={(event) => setForm({ ...form, reminderAt: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Assign by</Label>
            <Select
              value={form.assignedToType}
              onValueChange={(assignedToType) =>
                setForm({ ...form, assignedToType: assignedToType as typeof form.assignedToType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="wing">Wing</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.assignedToType === "staff" && (
            <div className="space-y-2">
              <Label>Assigned to</Label>
              <Input value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })} />
            </div>
          )}
          {form.assignedToType === "role" && (
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.assignedRole} onValueChange={(assignedRole) => setForm({ ...form, assignedRole: assignedRole as Role })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {form.assignedToType === "wing" && (
            <div className="space-y-2">
              <Label>Wing</Label>
              <Select value={form.assignedWingId} onValueChange={(assignedWingId) => setForm({ ...form, assignedWingId })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Wing team</SelectItem>
                  {wings.map((wing) => (
                    <SelectItem key={wing.id} value={wing.id}>
                      {wing.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Repeat</Label>
            <Select value={form.recurrence} onValueChange={(recurrence) => setForm({ ...form, recurrence: recurrence as typeof form.recurrence })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.recurrence === "custom" && (
            <div className="space-y-2">
              <Label>Repeat details</Label>
              <Input value={form.recurrenceNotes} onChange={(event) => setForm({ ...form, recurrenceNotes: event.target.value })} />
            </div>
          )}
          {showAppointment && (
            <>
              <div className="space-y-2">
                <Label>Appointment location</Label>
                <Input value={form.appointmentLocation} onChange={(event) => setForm({ ...form, appointmentLocation: event.target.value })} />
              </div>
              <div className="space-y-3 rounded-md border p-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.transportRequired} onCheckedChange={(checked) => setForm({ ...form, transportRequired: checked === true })} />
                  Transport required
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.escortRequired} onCheckedChange={(checked) => setForm({ ...form, escortRequired: checked === true })} />
                  Escort required
                </label>
                {form.escortRequired && (
                  <Input placeholder="Escort staff" value={form.escortStaff} onChange={(event) => setForm({ ...form, escortStaff: event.target.value })} />
                )}
              </div>
            </>
          )}
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={create}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TaskWorkflowEngine() {
  const {
    tasks: allTasks,
    residents,
    wings,
    updateTask,
    softDeleteTask,
    addTask,
    filteredResidentIds,
    filter: globalFilter,
    currentUserName,
    currentRole,
  } = useCare();
  const [tab, setTab] = useState<TaskTab>("active");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [bulkDueDate, setBulkDueDate] = useState("");
  const [bulkPriority, setBulkPriority] = useState<TaskPriority>("normal");
  const [filters, setFilters] = useState({
    residentId: "all",
    wingId: "all",
    assignedTo: "all",
    category: "all",
    taskType: "all",
    priority: "all",
    status: "all",
    from: "",
    to: "",
    search: "",
  });

  const todayKey = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndKey = weekEnd.toISOString().slice(0, 10);
  const allowed = new Set(filteredResidentIds);
  const globalActive = !!(globalFilter.wingId || globalFilter.roomId || globalFilter.residentId);
  const canDeleteTasks = can(currentRole, "ops.delete");
  const residentById = useMemo(() => new Map(residents.map((resident) => [resident.id, resident])), [residents]);

  const scopedTasks = useMemo(
    () => (globalActive ? allTasks.filter((task) => !task.residentId || allowed.has(task.residentId)) : allTasks),
    [allTasks, allowed, globalActive],
  );
  const activeTasks = useMemo(() => scopedTasks.filter((task) => task.status !== "deleted"), [scopedTasks]);
  const deletedTasks = useMemo(() => scopedTasks.filter((task) => task.status === "deleted"), [scopedTasks]);
  const assignedOptions = useMemo(
    () => Array.from(new Set(activeTasks.map((task) => task.assignedTo).filter(Boolean))).sort(),
    [activeTasks],
  );
  const typeOptions = useMemo(
    () => Array.from(new Set(activeTasks.map((task) => taskKind(task)).filter(Boolean))).sort(),
    [activeTasks],
  );

  const visibleTasks = useMemo(() => {
    const source = tab === "deleted" && canDeleteTasks ? deletedTasks : activeTasks;
    return source
      .filter((task) => {
        const resident = task.residentId ? residentById.get(task.residentId) : undefined;
        const due = dateKey(task.dueDate);
        if (tab === "active" && task.status === "completed") return false;
        if (tab === "due_today" && (task.status === "completed" || due !== todayKey)) return false;
        if (tab === "overdue" && (task.status === "completed" || due >= todayKey)) return false;
        if (tab === "appointments" && !isAppointmentTask(task)) return false;
        if (tab === "completed" && task.status !== "completed") return false;
        if (filters.residentId !== "all" && task.residentId !== filters.residentId) return false;
        if (filters.wingId !== "all" && resident?.wingId !== filters.wingId) return false;
        if (filters.assignedTo !== "all" && task.assignedTo !== filters.assignedTo) return false;
        if (filters.category !== "all" && task.category !== filters.category) return false;
        if (filters.taskType !== "all" && taskKind(task) !== filters.taskType) return false;
        if (filters.priority !== "all" && (task.priority || "normal") !== filters.priority) return false;
        if (filters.status !== "all" && task.status !== filters.status) return false;
        if (filters.from && due < filters.from) return false;
        if (filters.to && due > filters.to) return false;
        if (filters.search.trim()) {
          const text = [
            task.title,
            task.description,
            task.taskType,
            task.appointmentLocation,
            task.assignedTo,
            residentName(resident),
          ]
            .join(" ")
            .toLowerCase();
          if (!text.includes(filters.search.trim().toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const doneA = a.status === "completed" ? 1 : 0;
        const doneB = b.status === "completed" ? 1 : 0;
        if (doneA !== doneB) return doneA - doneB;
        return taskDate(a.dueDate).getTime() - taskDate(b.dueDate).getTime();
      });
  }, [activeTasks, canDeleteTasks, deletedTasks, filters, residentById, tab, todayKey]);

  const stats = useMemo(() => {
    const completedToday = activeTasks.filter((task) => task.status === "completed" && dateKey(task.completedAt || task.dueDate) === todayKey);
    const overdue = activeTasks.filter((task) => task.status !== "completed" && dateKey(task.dueDate) < todayKey);
    const appointmentsThisWeek = activeTasks.filter((task) => isAppointmentTask(task) && dateKey(task.dueDate) >= todayKey && dateKey(task.dueDate) <= weekEndKey);
    const transportBookings = activeTasks.filter((task) => task.transportRequired && task.status !== "completed");
    const completeWithTimes = activeTasks.filter((task) => task.status === "completed" && task.createdAt && task.completedAt);
    const averageHours = completeWithTimes.length
      ? Math.round(
          completeWithTimes.reduce(
            (total, task) => total + Math.max(0, taskDate(task.completedAt || "").getTime() - taskDate(task.createdAt || "").getTime()) / 36e5,
            0,
          ) / completeWithTimes.length,
        )
      : 0;
    return { completedToday, overdue, appointmentsThisWeek, transportBookings, averageHours };
  }, [activeTasks, todayKey, weekEndKey]);

  const selectedTask = openTaskId ? scopedTasks.find((task) => task.id === openTaskId) || null : null;
  const taskToComplete = completeTaskId ? scopedTasks.find((task) => task.id === completeTaskId) || null : null;
  const taskPendingDelete = deleteTaskId ? activeTasks.find((task) => task.id === deleteTaskId) || null : null;
  const selectedTasks = selectedIds
    .map((id) => activeTasks.find((task) => task.id === id))
    .filter((task): task is Task => !!task);

  const completeTask = (task: Task, notes = outcome) => {
    updateTask(task.id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      completedBy: currentUserName,
      outcome: notes.trim() || task.outcome,
      followUpRequired,
    });
    toast.success("Task completed");
    setCompleteTaskId(null);
    setOpenTaskId(null);
    setOutcome("");
    setFollowUpRequired(false);
  };

  const duplicateTask = (task: Task) => {
    const { id: _id, deletedAt: _deletedAt, deletedBy: _deletedBy, deleteReason: _deleteReason, ...copy } = task;
    addTask({
      ...copy,
      title: `${task.title} (copy)`,
      status: "pending",
      completedAt: undefined,
      completedBy: undefined,
      outcome: undefined,
      createdAt: new Date().toISOString(),
      createdBy: currentUserName,
    });
    toast.success("Task duplicated");
  };

  const clearFilters = () => {
    setTab("active");
    setFilters({
      residentId: "all",
      wingId: "all",
      assignedTo: "all",
      category: "all",
      taskType: "all",
      priority: "all",
      status: "all",
      from: "",
      to: "",
      search: "",
    });
  };

  const selectTask = (taskId: string, checked: boolean) => {
    setSelectedIds((current) => (checked ? [...new Set([...current, taskId])] : current.filter((id) => id !== taskId)));
  };

  const bulkComplete = () => {
    selectedTasks.forEach((task) =>
      updateTask(task.id, { status: "completed", completedAt: new Date().toISOString(), completedBy: currentUserName }),
    );
    setSelectedIds([]);
    toast.success("Selected tasks completed");
  };

  return (
    <div className="p-4 md:p-8 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Clinical, operational and appointment work queue</p>
        </div>
        <NewTaskDialog />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric icon={CheckCircle2} label="Completed Today" value={stats.completedToday.length} tone="text-success" />
        <Metric icon={ClipboardList} label="Overdue" value={stats.overdue.length} tone="text-destructive" />
        <Metric icon={Hospital} label="Appointments This Week" value={stats.appointmentsThisWeek.length} />
        <Metric icon={CalendarClock} label="Transport Bookings" value={stats.transportBookings.length} />
        <Metric icon={CheckCircle2} label="Avg Completion" value={stats.averageHours ? `${stats.averageHours}h` : "N/A"} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
            <Select value={filters.residentId} onValueChange={(residentId) => setFilters({ ...filters, residentId })}>
              <SelectTrigger><SelectValue placeholder="Resident" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All residents</SelectItem>
                {residents.map((resident) => (
                  <SelectItem key={resident.id} value={resident.id}>{resident.firstName} {resident.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.wingId} onValueChange={(wingId) => setFilters({ ...filters, wingId })}>
              <SelectTrigger><SelectValue placeholder="Wing" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All wings</SelectItem>
                {wings.map((wing) => <SelectItem key={wing.id} value={wing.id}>{wing.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.assignedTo} onValueChange={(assignedTo) => setFilters({ ...filters, assignedTo })}>
              <SelectTrigger><SelectValue placeholder="Assigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignees</SelectItem>
                <SelectItem value={currentUserName}>My tasks</SelectItem>
                {assignedOptions.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={(category) => setFilters({ ...filters, category })}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.taskType} onValueChange={(taskType) => setFilters({ ...filters, taskType })}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {typeOptions.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.priority} onValueChange={(priority) => setFilters({ ...filters, priority })}>
              <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {PRIORITIES.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
            <Input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search task, resident, location or notes"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              />
            </div>
            <Button variant="outline" onClick={() => { setTab("due_today"); setFilters({ ...filters, from: todayKey, to: todayKey }); }}>Today</Button>
            <Button variant="outline" onClick={() => setTab("overdue")}>Overdue</Button>
            <Button variant="outline" onClick={() => { setTab("active"); setFilters({ ...filters, from: todayKey, to: weekEndKey }); }}>This Week</Button>
            <Button variant="outline" onClick={() => setFilters({ ...filters, assignedTo: currentUserName })}>My Tasks</Button>
            <Button variant="ghost" onClick={clearFilters}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TaskTab)}>
        <TabsList className="h-auto flex flex-wrap">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="due_today">Due Today</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          {canDeleteTasks && <TabsTrigger value="deleted">Deleted</TabsTrigger>}
        </TabsList>
      </Tabs>

      {selectedTasks.length > 0 && (
        <Card className="border-primary/30">
          <CardContent className="p-3 flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="text-sm font-medium">{selectedTasks.length} selected</div>
            <div className="flex flex-1 flex-wrap gap-2">
              <Button size="sm" onClick={bulkComplete}>Complete</Button>
              <Input className="h-9 w-44" placeholder="Assign to" value={bulkAssignee} onChange={(event) => setBulkAssignee(event.target.value)} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  selectedTasks.forEach((task) => updateTask(task.id, { assignedTo: bulkAssignee.trim(), assignedToType: "staff" }));
                  setBulkAssignee("");
                  toast.success("Selected tasks assigned");
                }}
                disabled={!bulkAssignee.trim()}
              >
                Assign
              </Button>
              <Input className="h-9 w-52" type="datetime-local" value={bulkDueDate} onChange={(event) => setBulkDueDate(event.target.value)} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  selectedTasks.forEach((task) => updateTask(task.id, { dueDate: bulkDueDate }));
                  setBulkDueDate("");
                  toast.success("Selected due dates updated");
                }}
                disabled={!bulkDueDate}
              >
                Move Due Date
              </Button>
              <Select value={bulkPriority} onValueChange={(priority) => setBulkPriority(priority as TaskPriority)}>
                <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  selectedTasks.forEach((task) => updateTask(task.id, { priority: bulkPriority }));
                  toast.success("Selected priorities updated");
                }}
              >
                Set Priority
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {visibleTasks.map((task) => {
          const resident = task.residentId ? residentById.get(task.residentId) : undefined;
          const [statusLabel, statusClass] = statusMeta(task, todayKey);
          return (
            <Card key={task.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-3">
                    {task.status !== "deleted" && task.status !== "completed" && (
                      <Checkbox
                        checked={selectedIds.includes(task.id)}
                        onCheckedChange={(checked) => selectTask(task.id, checked === true)}
                        aria-label={`Select ${task.title}`}
                      />
                    )}
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold leading-tight">{task.title}</h3>
                        <Badge variant="outline" className={statusClass}>{statusLabel}</Badge>
                        <Badge variant="outline" className={priorityClass(task.priority)}>{task.priority || "normal"}</Badge>
                        <Badge variant="outline">{taskKind(task)}</Badge>
                      </div>
                      <div className="grid gap-1 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                        <span>{residentName(resident)}</span>
                        <span>Room {resident?.roomNumber || "N/A"}</span>
                        <span>Due {formatDue(task.dueDate)}</span>
                        <span>Assigned: {task.assignedTo || "Unassigned"}</span>
                      </div>
                      {(task.appointmentLocation || task.transportRequired || task.escortRequired) && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {task.appointmentLocation && <Badge variant="outline">Location: {task.appointmentLocation}</Badge>}
                          {task.transportRequired && <Badge variant="outline">Transport</Badge>}
                          {task.escortRequired && <Badge variant="outline">Escort{task.escortStaff ? `: ${task.escortStaff}` : ""}</Badge>}
                        </div>
                      )}
                      {task.description && <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>}
                      {task.outcome && <p className="line-clamp-2 text-sm"><span className="text-muted-foreground">Outcome:</span> {task.outcome}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button size="sm" variant="outline" onClick={() => setOpenTaskId(task.id)}>Open</Button>
                    {task.residentId && (
                      <Link to="/residents/$id" params={{ id: task.residentId }}>
                        <Button size="sm" variant="outline"><ExternalLink className="mr-1 h-3.5 w-3.5" />Resident</Button>
                      </Link>
                    )}
                    {task.status !== "completed" && task.status !== "deleted" && (
                      <>
                        <Button size="sm" onClick={() => setCompleteTaskId(task.id)}>Complete</Button>
                        <Button size="sm" variant="outline" onClick={() => updateTask(task.id, { status: "in_progress" })}>Start</Button>
                        <Button size="sm" variant="outline" onClick={() => duplicateTask(task)}><Copy className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                    {canDeleteTasks && task.status !== "deleted" && (
                      <Button size="sm" variant="outline" onClick={() => setDeleteTaskId(task.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {visibleTasks.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-3 font-semibold">No tasks in this view.</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Adjust the filters or create a new task for clinical, operational or resident follow-up work.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setOpenTaskId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedTask?.title}</DialogTitle></DialogHeader>
          {selectedTask && <TaskDetails task={selectedTask} resident={selectedTask.residentId ? residentById.get(selectedTask.residentId) : undefined} todayKey={todayKey} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTaskId(null)}>Close</Button>
            {selectedTask && selectedTask.status !== "completed" && selectedTask.status !== "deleted" && (
              <Button onClick={() => setCompleteTaskId(selectedTask.id)}>Complete</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!taskToComplete} onOpenChange={(open) => !open && setCompleteTaskId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Complete Task</DialogTitle></DialogHeader>
          {taskToComplete && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{taskToComplete.title}</p>
              <div className="space-y-2">
                <Label>Outcome</Label>
                <Textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder="Record outcome, appointment result, action taken or next step" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={followUpRequired} onCheckedChange={(checked) => setFollowUpRequired(checked === true)} />
                Follow-up required
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteTaskId(null)}>Cancel</Button>
            {taskToComplete && <Button onClick={() => completeTask(taskToComplete)}>Complete Task</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!taskPendingDelete} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Task</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            This task will be removed from active task lists but retained for audit purposes.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTaskId(null)}>Cancel</Button>
            {taskPendingDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  softDeleteTask(taskPendingDelete.id);
                  setDeleteTaskId(null);
                  toast.success("Task removed from active lists");
                }}
              >
                Delete Task
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = "",
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Icon className="h-4 w-4" />
          {label}
        </div>
        <div className={`text-2xl font-semibold mt-1 tabular-nums ${tone}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function TaskDetails({ task, resident, todayKey }: { task: Task; resident?: Resident; todayKey: string }) {
  const [statusLabel, statusClass] = statusMeta(task, todayKey);
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{CATEGORY_LABELS[task.category || "general"]}</Badge>
        <Badge variant="outline">{taskKind(task)}</Badge>
        <Badge variant="outline" className={priorityClass(task.priority)}>{task.priority || "normal"}</Badge>
        <Badge variant="outline" className={statusClass}>{statusLabel}</Badge>
      </div>
      <div><span className="text-muted-foreground">Resident:</span> {residentName(resident)}</div>
      <div><span className="text-muted-foreground">Due:</span> {formatDue(task.dueDate)}</div>
      <div><span className="text-muted-foreground">Assigned:</span> {task.assignedTo || "Unassigned"}</div>
      {task.reminderAt && <div><span className="text-muted-foreground">Reminder:</span> {formatDue(task.reminderAt)}</div>}
      {task.recurrence && task.recurrence !== "none" && <div><span className="text-muted-foreground">Repeat:</span> {task.recurrence}</div>}
      {task.appointmentLocation && <div><span className="text-muted-foreground">Location:</span> {task.appointmentLocation}</div>}
      {(task.transportRequired || task.escortRequired) && (
        <div>
          <span className="text-muted-foreground">Appointment support:</span>{" "}
          {task.transportRequired ? "Transport required" : ""}
          {task.transportRequired && task.escortRequired ? ", " : ""}
          {task.escortRequired ? `Escort required${task.escortStaff ? ` (${task.escortStaff})` : ""}` : ""}
        </div>
      )}
      {task.description && <div><span className="text-muted-foreground">Notes:</span> {task.description}</div>}
      {task.outcome && <div><span className="text-muted-foreground">Outcome:</span> {task.outcome}</div>}
      {task.completedBy && <div><span className="text-muted-foreground">Completed by:</span> {task.completedBy}</div>}
    </div>
  );
}
