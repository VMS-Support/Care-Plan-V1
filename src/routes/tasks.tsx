import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import type { Task } from "@/lib/care/types";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks — CarePath" }] }),
  component: TasksPage,
});

function NewTask() {
  const { residents, addTask } = useCare();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    title: "",
    residentId: "none",
    assignedTo: "Care team",
    dueDate: `${new Date().toISOString().slice(0, 10)}T14:00`,
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          </div>
          <div>
            <Label>Resident (optional)</Label>
            <Select value={f.residentId} onValueChange={(v) => setF({ ...f, residentId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {residents.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.firstName} {r.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assigned to</Label>
            <Input
              value={f.assignedTo}
              onChange={(e) => setF({ ...f, assignedTo: e.target.value })}
            />
          </div>
          <div>
            <Label>Due date and time</Label>
            <Input
              type="datetime-local"
              value={f.dueDate}
              onChange={(e) => setF({ ...f, dueDate: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!f.title) {
                toast.error("Title required");
                return;
              }
              addTask({
                ...f,
                residentId: f.residentId === "none" ? undefined : f.residentId,
                status: "pending",
              });
              toast.success("Task created");
              setOpen(false);
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type TaskTab = "my" | "due_today" | "overdue" | "completed" | "all" | "deleted";

function dueDateKey(dueDate: string) {
  return dueDate.slice(0, 10);
}

function dueTime(dueDate: string) {
  if (!dueDate.includes("T") || dueDate.length < 16) return null;
  return dueDate.slice(11, 16);
}

function shortDate(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function statusMeta(task: Task, todayKey: string, tomorrowKey: string) {
  const key = dueDateKey(task.dueDate);
  if (task.status === "completed") {
    return {
      label: "Completed",
      className: "border-success/30 bg-success/10 text-success",
      dueText: `Completed · Due ${shortDate(key)}${dueTime(task.dueDate) ? ` ${dueTime(task.dueDate)}` : ""}`,
    };
  }

  if (task.status === "deleted") {
    return {
      label: "Deleted",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
      dueText: `Deleted · Due ${shortDate(key)}${dueTime(task.dueDate) ? ` ${dueTime(task.dueDate)}` : ""}`,
    };
  }

  if (key < todayKey || task.status === "overdue") {
    return {
      label: "Overdue",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
      dueText: `Overdue · ${shortDate(key)}${dueTime(task.dueDate) ? ` ${dueTime(task.dueDate)}` : ""}`,
    };
  }

  if (key === todayKey) {
    return {
      label: "Due Today",
      className: "border-warning/30 bg-warning/20 text-warning-foreground",
      dueText: `Due Today${dueTime(task.dueDate) ? ` ${dueTime(task.dueDate)}` : ""}`,
    };
  }

  return {
    label: "Scheduled",
    className: "border-border bg-muted/30 text-muted-foreground",
    dueText: `${key === tomorrowKey ? "Due Tomorrow" : `Due ${shortDate(key)}`}${dueTime(task.dueDate) ? ` ${dueTime(task.dueDate)}` : ""}`,
  };
}

function TasksPage() {
  const {
    tasks: allTasks,
    residents,
    updateTask,
    softDeleteTask,
    filteredResidentIds,
    filter: globalFilter,
    currentUserName,
    currentRole,
  } = useCare();
  const [tab, setTab] = useState<TaskTab>("my");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const todayKey = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);

  const globalActive = !!(globalFilter.wingId || globalFilter.roomId || globalFilter.residentId);
  const allowed = new Set(filteredResidentIds);
  const scopedTasks = useMemo(
    () =>
      globalActive ? allTasks.filter((t) => !t.residentId || allowed.has(t.residentId)) : allTasks,
    [allTasks, allowed, globalActive],
  );
  const tasks = useMemo(() => scopedTasks.filter((t) => t.status !== "deleted"), [scopedTasks]);
  const deletedTasks = useMemo(
    () => scopedTasks.filter((t) => t.status === "deleted"),
    [scopedTasks],
  );
  const canDeleteTasks = can(currentRole, "ops.delete");

  const myTasks = useMemo(
    () =>
      tasks.filter((t) => {
        const assigned = (t.assignedTo || "").toLowerCase();
        const me = currentUserName.toLowerCase();
        return assigned.includes(me) || assigned.includes("care team") || assigned.trim() === "";
      }),
    [currentUserName, tasks],
  );

  const overdueTasks = useMemo(
    () => tasks.filter((t) => t.status !== "completed" && dueDateKey(t.dueDate) < todayKey),
    [tasks, todayKey],
  );
  const dueTodayTasks = useMemo(
    () => tasks.filter((t) => t.status !== "completed" && dueDateKey(t.dueDate) === todayKey),
    [tasks, todayKey],
  );
  const completedTodayTasks = useMemo(
    () => tasks.filter((t) => t.status === "completed" && dueDateKey(t.dueDate) === todayKey),
    [tasks, todayKey],
  );
  const myTasksToday = useMemo(
    () => myTasks.filter((t) => t.status !== "completed" && dueDateKey(t.dueDate) <= todayKey),
    [myTasks, todayKey],
  );

  const visibleTasks = useMemo(() => {
    if (tab === "my") return myTasks;
    if (tab === "due_today") return dueTodayTasks;
    if (tab === "overdue") return overdueTasks;
    if (tab === "completed") return tasks.filter((t) => t.status === "completed");
    if (tab === "deleted" && canDeleteTasks) return deletedTasks;
    return tasks;
  }, [canDeleteTasks, deletedTasks, dueTodayTasks, myTasks, overdueTasks, tab, tasks]);

  const sortedVisibleTasks = useMemo(
    () =>
      [...visibleTasks].sort((a, b) => {
        const aCompleted = a.status === "completed" ? 1 : 0;
        const bCompleted = b.status === "completed" ? 1 : 0;
        if (aCompleted !== bCompleted) return aCompleted - bCompleted;
        return a.dueDate.localeCompare(b.dueDate);
      }),
    [visibleTasks],
  );

  const selectedTask = openTaskId ? scopedTasks.find((t) => t.id === openTaskId) || null : null;
  const taskPendingDelete = deleteTaskId
    ? tasks.find((t) => t.id === deleteTaskId) || null
    : null;

  const completeTask = (taskId: string) => {
    updateTask(taskId, { status: "completed" });
    toast.success("Task completed");
  };

  const deleteTask = (taskId: string) => {
    softDeleteTask(taskId);
    toast.success("Task removed from active lists");
    setDeleteTaskId(null);
    if (openTaskId === taskId) setOpenTaskId(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-5">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Focused on outstanding nursing and operational work
          </p>
        </div>
        <NewTask />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              My Tasks Today
            </div>
            <div className="text-2xl font-semibold mt-1 tabular-nums">{myTasksToday.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Overdue</div>
            <div className="text-2xl font-semibold mt-1 tabular-nums text-destructive">
              {overdueTasks.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Due Today</div>
            <div className="text-2xl font-semibold mt-1 tabular-nums text-warning-foreground">
              {dueTodayTasks.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Completed Today
            </div>
            <div className="text-2xl font-semibold mt-1 tabular-nums text-success">
              {completedTodayTasks.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TaskTab)}>
        <TabsList className="h-auto flex flex-wrap">
          <TabsTrigger value="my">My Tasks</TabsTrigger>
          <TabsTrigger value="due_today">Due Today</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          {canDeleteTasks && <TabsTrigger value="deleted">Deleted</TabsTrigger>}
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {sortedVisibleTasks.map((t) => {
          const resident = residents.find((x) => x.id === t.residentId);
          const meta = statusMeta(t, todayKey, tomorrowKey);
          return (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2 min-w-0">
                    <h3 className="font-semibold text-base leading-tight">{t.title}</h3>
                    <div className="text-sm text-muted-foreground">
                      {resident
                        ? `${resident.firstName} ${resident.lastName}`
                        : "No resident linked"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Room {resident?.roomNumber || "N/A"}
                    </div>
                    <div className="text-sm">{meta.dueText}</div>
                    <div className="text-sm text-muted-foreground">
                      Assigned: {t.assignedTo || "Unassigned"}
                    </div>
                    <div className="text-xs">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 font-medium ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 md:pl-4">
                    <Button variant="outline" size="sm" onClick={() => setOpenTaskId(t.id)}>
                      Open
                    </Button>
                    {canDeleteTasks && t.status !== "deleted" && (
                      <Button variant="outline" size="sm" onClick={() => setDeleteTaskId(t.id)}>
                        Delete Task
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => completeTask(t.id)}
                      disabled={t.status === "completed" || t.status === "deleted"}
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {sortedVisibleTasks.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground text-center">
              No tasks in this view.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setOpenTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Resident:</span>{" "}
                {(() => {
                  const resident = residents.find((x) => x.id === selectedTask.residentId);
                  return resident
                    ? `${resident.firstName} ${resident.lastName}`
                    : "No resident linked";
                })()}
              </div>
              <div>
                <span className="text-muted-foreground">Assigned:</span>{" "}
                {selectedTask.assignedTo || "Unassigned"}
              </div>
              <div>
                <span className="text-muted-foreground">Due:</span> {selectedTask.dueDate}
              </div>
              {selectedTask.description && (
                <div>
                  <span className="text-muted-foreground">Notes:</span> {selectedTask.description}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTaskId(null)}>
              Close
            </Button>
            {selectedTask && canDeleteTasks && selectedTask.status !== "deleted" && (
              <Button variant="outline" onClick={() => setDeleteTaskId(selectedTask.id)}>
                Delete Task
              </Button>
            )}
            {selectedTask && (
              <Button
                onClick={() => {
                  completeTask(selectedTask.id);
                  setOpenTaskId(null);
                }}
                disabled={selectedTask.status === "completed" || selectedTask.status === "deleted"}
              >
                Complete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!taskPendingDelete} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This task will be removed from active task lists but retained for audit purposes.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTaskId(null)}>
              Cancel
            </Button>
            {taskPendingDelete && (
              <Button variant="destructive" onClick={() => deleteTask(taskPendingDelete.id)}>
                Delete Task
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
