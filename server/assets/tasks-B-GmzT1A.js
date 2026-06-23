import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { u as useCare, a as can, C as Card, e as CardContent, f as Button, I as Input, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem } from "./router-DLzRbDkQ.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter, a as DialogTrigger } from "./dialog-Dtfzkh6H.js";
import { L as Label } from "./label-6k_A62K1.js";
import { T as Tabs, a as TabsList, b as TabsTrigger } from "./tabs-BZBuOn5G.js";
import { toast } from "sonner";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "lucide-react";
import "clsx";
import "tailwind-merge";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "@radix-ui/react-tabs";
function NewTask() {
  const {
    residents,
    addTask
  } = useCare();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    title: "",
    residentId: "none",
    assignedTo: "Care team",
    dueDate: `${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}T14:00`
  });
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { children: "New Task" }) }),
    /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "New Task" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Title" }),
          /* @__PURE__ */ jsx(Input, { value: f.title, onChange: (e) => setF({
            ...f,
            title: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Resident (optional)" }),
          /* @__PURE__ */ jsxs(Select, { value: f.residentId, onValueChange: (v) => setF({
            ...f,
            residentId: v
          }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "None" }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "none", children: "None" }),
              residents.map((r) => /* @__PURE__ */ jsxs(SelectItem, { value: r.id, children: [
                r.firstName,
                " ",
                r.lastName
              ] }, r.id))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Assigned to" }),
          /* @__PURE__ */ jsx(Input, { value: f.assignedTo, onChange: (e) => setF({
            ...f,
            assignedTo: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Due date and time" }),
          /* @__PURE__ */ jsx(Input, { type: "datetime-local", value: f.dueDate, onChange: (e) => setF({
            ...f,
            dueDate: e.target.value
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => {
          if (!f.title) {
            toast.error("Title required");
            return;
          }
          addTask({
            ...f,
            residentId: f.residentId === "none" ? void 0 : f.residentId,
            status: "pending"
          });
          toast.success("Task created");
          setOpen(false);
        }, children: "Create" })
      ] })
    ] })
  ] });
}
function dueDateKey(dueDate) {
  return dueDate.slice(0, 10);
}
function dueTime(dueDate) {
  if (!dueDate.includes("T") || dueDate.length < 16) return null;
  return dueDate.slice(11, 16);
}
function shortDate(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short"
  });
}
function statusMeta(task, todayKey, tomorrowKey) {
  const key = dueDateKey(task.dueDate);
  if (task.status === "completed") {
    return {
      label: "Completed",
      className: "border-success/30 bg-success/10 text-success",
      dueText: `Completed · Due ${shortDate(key)}${dueTime(task.dueDate) ? ` ${dueTime(task.dueDate)}` : ""}`
    };
  }
  if (task.status === "deleted") {
    return {
      label: "Deleted",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
      dueText: `Deleted · Due ${shortDate(key)}${dueTime(task.dueDate) ? ` ${dueTime(task.dueDate)}` : ""}`
    };
  }
  if (key < todayKey || task.status === "overdue") {
    return {
      label: "Overdue",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
      dueText: `Overdue · ${shortDate(key)}${dueTime(task.dueDate) ? ` ${dueTime(task.dueDate)}` : ""}`
    };
  }
  if (key === todayKey) {
    return {
      label: "Due Today",
      className: "border-warning/30 bg-warning/20 text-warning-foreground",
      dueText: `Due Today${dueTime(task.dueDate) ? ` ${dueTime(task.dueDate)}` : ""}`
    };
  }
  return {
    label: "Scheduled",
    className: "border-border bg-muted/30 text-muted-foreground",
    dueText: `${key === tomorrowKey ? "Due Tomorrow" : `Due ${shortDate(key)}`}${dueTime(task.dueDate) ? ` ${dueTime(task.dueDate)}` : ""}`
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
    currentRole
  } = useCare();
  const [tab, setTab] = useState("my");
  const [openTaskId, setOpenTaskId] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const todayKey = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const tomorrow = /* @__PURE__ */ new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);
  const globalActive = !!(globalFilter.wingId || globalFilter.roomId || globalFilter.residentId);
  const allowed = new Set(filteredResidentIds);
  const scopedTasks = useMemo(() => globalActive ? allTasks.filter((t) => !t.residentId || allowed.has(t.residentId)) : allTasks, [allTasks, allowed, globalActive]);
  const tasks = useMemo(() => scopedTasks.filter((t) => t.status !== "deleted"), [scopedTasks]);
  const deletedTasks = useMemo(() => scopedTasks.filter((t) => t.status === "deleted"), [scopedTasks]);
  const canDeleteTasks = can(currentRole, "ops.delete");
  const myTasks = useMemo(() => tasks.filter((t) => {
    const assigned = (t.assignedTo || "").toLowerCase();
    const me = currentUserName.toLowerCase();
    return assigned.includes(me) || assigned.includes("care team") || assigned.trim() === "";
  }), [currentUserName, tasks]);
  const overdueTasks = useMemo(() => tasks.filter((t) => t.status !== "completed" && dueDateKey(t.dueDate) < todayKey), [tasks, todayKey]);
  const dueTodayTasks = useMemo(() => tasks.filter((t) => t.status !== "completed" && dueDateKey(t.dueDate) === todayKey), [tasks, todayKey]);
  const completedTodayTasks = useMemo(() => tasks.filter((t) => t.status === "completed" && dueDateKey(t.dueDate) === todayKey), [tasks, todayKey]);
  const myTasksToday = useMemo(() => myTasks.filter((t) => t.status !== "completed" && dueDateKey(t.dueDate) <= todayKey), [myTasks, todayKey]);
  const visibleTasks = useMemo(() => {
    if (tab === "my") return myTasks;
    if (tab === "due_today") return dueTodayTasks;
    if (tab === "overdue") return overdueTasks;
    if (tab === "completed") return tasks.filter((t) => t.status === "completed");
    if (tab === "deleted" && canDeleteTasks) return deletedTasks;
    return tasks;
  }, [canDeleteTasks, deletedTasks, dueTodayTasks, myTasks, overdueTasks, tab, tasks]);
  const sortedVisibleTasks = useMemo(() => [...visibleTasks].sort((a, b) => {
    const aCompleted = a.status === "completed" ? 1 : 0;
    const bCompleted = b.status === "completed" ? 1 : 0;
    if (aCompleted !== bCompleted) return aCompleted - bCompleted;
    return a.dueDate.localeCompare(b.dueDate);
  }), [visibleTasks]);
  const selectedTask = openTaskId ? scopedTasks.find((t) => t.id === openTaskId) || null : null;
  const taskPendingDelete = deleteTaskId ? tasks.find((t) => t.id === deleteTaskId) || null : null;
  const completeTask = (taskId) => {
    updateTask(taskId, {
      status: "completed"
    });
    toast.success("Task completed");
  };
  const deleteTask = (taskId) => {
    softDeleteTask(taskId);
    toast.success("Task removed from active lists");
    setDeleteTaskId(null);
    if (openTaskId === taskId) setOpenTaskId(null);
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Tasks" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Focused on outstanding nursing and operational work" })
      ] }),
      /* @__PURE__ */ jsx(NewTask, {})
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "My Tasks Today" }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold mt-1 tabular-nums", children: myTasksToday.length })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Overdue" }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold mt-1 tabular-nums text-destructive", children: overdueTasks.length })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Due Today" }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold mt-1 tabular-nums text-warning-foreground", children: dueTodayTasks.length })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Completed Today" }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold mt-1 tabular-nums text-success", children: completedTodayTasks.length })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(Tabs, { value: tab, onValueChange: (value) => setTab(value), children: /* @__PURE__ */ jsxs(TabsList, { className: "h-auto flex flex-wrap", children: [
      /* @__PURE__ */ jsx(TabsTrigger, { value: "my", children: "My Tasks" }),
      /* @__PURE__ */ jsx(TabsTrigger, { value: "due_today", children: "Due Today" }),
      /* @__PURE__ */ jsx(TabsTrigger, { value: "overdue", children: "Overdue" }),
      /* @__PURE__ */ jsx(TabsTrigger, { value: "completed", children: "Completed" }),
      /* @__PURE__ */ jsx(TabsTrigger, { value: "all", children: "All Tasks" }),
      canDeleteTasks && /* @__PURE__ */ jsx(TabsTrigger, { value: "deleted", children: "Deleted" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      sortedVisibleTasks.map((t) => {
        const resident = residents.find((x) => x.id === t.residentId);
        const meta = statusMeta(t, todayKey, tomorrowKey);
        return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 md:flex-row md:items-start md:justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 min-w-0", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base leading-tight", children: t.title }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: resident ? `${resident.firstName} ${resident.lastName}` : "No resident linked" }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
              "Room ",
              resident?.roomNumber || "N/A"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-sm", children: meta.dueText }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
              "Assigned: ",
              t.assignedTo || "Unassigned"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-xs", children: /* @__PURE__ */ jsx("span", { className: `inline-flex items-center rounded-md border px-2 py-0.5 font-medium ${meta.className}`, children: meta.label }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 md:pl-4", children: [
            /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => setOpenTaskId(t.id), children: "Open" }),
            canDeleteTasks && t.status !== "deleted" && /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => setDeleteTaskId(t.id), children: "Delete Task" }),
            /* @__PURE__ */ jsx(Button, { size: "sm", onClick: () => completeTask(t.id), disabled: t.status === "completed" || t.status === "deleted", children: "Complete" })
          ] })
        ] }) }) }, t.id);
      }),
      sortedVisibleTasks.length === 0 && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-6 text-sm text-muted-foreground text-center", children: "No tasks in this view." }) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: !!selectedTask, onOpenChange: (open) => !open && setOpenTaskId(null), children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: selectedTask?.title }) }),
      selectedTask && /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Resident:" }),
          " ",
          (() => {
            const resident = residents.find((x) => x.id === selectedTask.residentId);
            return resident ? `${resident.firstName} ${resident.lastName}` : "No resident linked";
          })()
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Assigned:" }),
          " ",
          selectedTask.assignedTo || "Unassigned"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Due:" }),
          " ",
          selectedTask.dueDate
        ] }),
        selectedTask.description && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Notes:" }),
          " ",
          selectedTask.description
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpenTaskId(null), children: "Close" }),
        selectedTask && canDeleteTasks && selectedTask.status !== "deleted" && /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setDeleteTaskId(selectedTask.id), children: "Delete Task" }),
        selectedTask && /* @__PURE__ */ jsx(Button, { onClick: () => {
          completeTask(selectedTask.id);
          setOpenTaskId(null);
        }, disabled: selectedTask.status === "completed" || selectedTask.status === "deleted", children: "Complete" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: !!taskPendingDelete, onOpenChange: (open) => !open && setDeleteTaskId(null), children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Delete Task" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "This task will be removed from active task lists but retained for audit purposes." }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setDeleteTaskId(null), children: "Cancel" }),
        taskPendingDelete && /* @__PURE__ */ jsx(Button, { variant: "destructive", onClick: () => deleteTask(taskPendingDelete.id), children: "Delete Task" })
      ] })
    ] }) })
  ] });
}
export {
  TasksPage as component
};
