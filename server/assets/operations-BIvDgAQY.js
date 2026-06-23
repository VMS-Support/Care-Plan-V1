import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { u as useCare, n as deriveStatus, h as complianceForResident, C as Card, e as CardContent, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem, B as Badge, f as Button, b as CardHeader, d as CardTitle, c as cn } from "./router-DLzRbDkQ.js";
import { i as isActionableClinicalAlert, a as isActionRequiredAlert } from "./alerts-DlzPJRcw.js";
import { e as endOfCurrentShift, s as scheduledInterventions } from "./intervention-schedule-BIGQTR8s.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, f as DialogDescription } from "./dialog-Dtfzkh6H.js";
import { L as Label } from "./label-6k_A62K1.js";
import { Users, ClipboardList, ClipboardCheck, HeartPulse, Stethoscope, BellRing, UserCheck, ShieldAlert } from "lucide-react";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "sonner";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
const roleLabels = {
  carer: "Carer",
  nurse: "Nurse",
  doctor: "Doctor",
  cnm: "Clinical Nurse Manager",
  don: "Director of Nursing"
};
function deriveShift(now) {
  const hour = now.getHours();
  if (hour < 14) return "Day Shift";
  if (hour < 22) return "Late Shift";
  return "Night Shift";
}
function formatDate(now) {
  return now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
function formatTime(now) {
  return now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function currentHandoverShift(now) {
  const hour = now.getHours();
  if (hour < 14) return "morning";
  if (hour < 22) return "afternoon";
  return "night";
}
function interventionStatusClass(status) {
  if (status === "overdue") return "border-destructive/40 text-destructive bg-destructive/5";
  if (status === "due_now") return "border-warning/50 text-warning-foreground bg-warning/10";
  if (status === "due_today") return "border-warning/30 text-warning-foreground";
  if (status === "completed") return "border-success/30 text-success";
  return "border-info/30 text-info";
}
function staffNameMatches(assignedName, currentName) {
  if (!assignedName) return false;
  const normalize = (value) => value.toLowerCase().replace(/\s*\([^)]*\)\s*$/, "").trim();
  return normalize(assignedName) === normalize(currentName);
}
function MetricCard({
  icon: Icon,
  label,
  value,
  sublabel,
  attention
}) {
  return /* @__PURE__ */ jsx(Card, { className: cn(attention && "border-warning/50 bg-warning/10"), children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [
    /* @__PURE__ */ jsx("div", { className: cn("rounded-lg border p-2", attention && "border-warning/50 bg-background"), children: /* @__PURE__ */ jsx(Icon, { className: cn("h-5 w-5 text-muted-foreground", attention && "text-warning-foreground") }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums", children: value }),
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
      sublabel && /* @__PURE__ */ jsx("div", { className: cn("text-[10px]", attention ? "text-warning-foreground" : "text-muted-foreground"), children: sublabel })
    ] })
  ] }) });
}
function OperationsHub() {
  const {
    wings,
    residents,
    tasks,
    assessments,
    vitals,
    alerts,
    clinicalAlerts,
    handovers,
    observationPlans,
    problemInterventions,
    problemInterventionLogs,
    carePlanProblems,
    currentRole,
    currentUser,
    currentUserName,
    markHandoverRead,
    acknowledgeHandover
  } = useCare();
  const isManagement = currentRole === "cnm" || currentRole === "don";
  const [now, setNow] = useState(() => /* @__PURE__ */ new Date());
  const [wingFilter, setWingFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [residentFilter, setResidentFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("me");
  const [showAllInterventions, setShowAllInterventions] = useState(false);
  const [handoverPanelOpen, setHandoverPanelOpen] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(/* @__PURE__ */ new Date()), 6e4);
    return () => window.clearInterval(timer);
  }, []);
  const shift = deriveShift(now);
  const myWings = useMemo(
    () => currentUser.assignedWings.length === 0 ? wings : wings.filter((wing) => currentUser.assignedWings.includes(wing.id)),
    [currentUser.assignedWings, wings]
  );
  const baseResidents = useMemo(() => {
    if (isManagement) return residents;
    return residents.filter(
      (resident) => !resident.wingId || myWings.some((wing) => wing.id === resident.wingId) || staffNameMatches(resident.keyWorkers?.namedNurse, currentUserName)
    );
  }, [currentUserName, isManagement, myWings, residents]);
  const rooms = useMemo(
    () => [...new Set(baseResidents.map((r) => r.roomNumber))].sort((a, b) => a.localeCompare(b)),
    [baseResidents]
  );
  const filteredResidents = useMemo(
    () => baseResidents.filter(
      (resident) => (wingFilter === "all" || resident.wingId === wingFilter) && (roomFilter === "all" || resident.roomNumber === roomFilter) && (residentFilter === "all" || resident.id === residentFilter)
    ),
    [baseResidents, residentFilter, roomFilter, wingFilter]
  );
  const filteredResidentIds = useMemo(
    () => new Set(filteredResidents.map((r) => r.id)),
    [filteredResidents]
  );
  const residentById = useMemo(() => new Map(residents.map((r) => [r.id, r])), [residents]);
  const dueTasks = useMemo(() => {
    const today = now.toISOString().slice(0, 10);
    return tasks.filter(
      (task) => task.residentId && filteredResidentIds.has(task.residentId) && task.status !== "completed" && task.status !== "deleted" && task.dueDate.slice(0, 10) <= today && (assignedFilter === "all" || task.assignedTo === currentUserName)
    );
  }, [assignedFilter, currentUserName, filteredResidentIds, now, tasks]);
  const dueAssessments = useMemo(
    () => assessments.filter((a) => {
      if (!filteredResidentIds.has(a.residentId)) return false;
      if (assignedFilter !== "all" && a.assignedToName && a.assignedToName !== currentUserName)
        return false;
      const s = deriveStatus(a);
      return s === "due" || s === "overdue";
    }),
    [assessments, assignedFilter, currentUserName, filteredResidentIds]
  );
  const dueObservations = useMemo(
    () => filteredResidents.flatMap((resident) => {
      const plan = observationPlans.find((item) => item.residentId === resident.id);
      const residentVitals = vitals.filter((item) => item.residentId === resident.id);
      const compliance = complianceForResident(plan, residentVitals);
      return compliance.items.filter(
        (item) => item.status === "due_today" || item.status === "overdue" || item.status === "missed"
      ).map(() => ({
        residentId: resident.id,
        assignedTo: resident.keyWorkers?.namedNurse || "Unassigned"
      }));
    }).filter(
      (row) => assignedFilter === "all" || row.assignedTo === currentUserName || row.assignedTo === "Unassigned"
    ),
    [assignedFilter, currentUserName, filteredResidents, observationPlans, vitals]
  );
  const dueInterventions = useMemo(() => {
    const shiftEnd = endOfCurrentShift(now);
    return scheduledInterventions(
      problemInterventions,
      problemInterventionLogs,
      carePlanProblems,
      now
    ).filter((scheduled) => {
      const iv = scheduled.intervention;
      if (!filteredResidentIds.has(iv.residentId)) return false;
      if (["cancelled", "completed"].includes(scheduled.status)) return false;
      if (!scheduled.dueAt) return false;
      return scheduled.status === "overdue" || scheduled.status === "due_now" || scheduled.status === "due_today" || scheduled.dueAt.getTime() <= shiftEnd.getTime();
    });
  }, [carePlanProblems, filteredResidentIds, now, problemInterventionLogs, problemInterventions]);
  const handoverRows = useMemo(() => {
    const today = now.toISOString().slice(0, 10);
    const currentShift = currentHandoverShift(now);
    return handovers.filter(
      (handover) => filteredResidentIds.has(handover.residentId) && handover.date.slice(0, 10) === today && handover.shift === currentShift && !["archived", "completed", "closed"].includes(handover.status || "active") && handover.recordStatus !== "deleted"
    );
  }, [filteredResidentIds, handovers, now]);
  const handoversNeedingAttention = useMemo(
    () => handoverRows.filter((handover) => {
      const readBy = Array.isArray(handover.readBy) ? handover.readBy : [];
      const acknowledgedBy = Array.isArray(handover.acknowledgedBy) ? handover.acknowledgedBy : [];
      return !readBy.includes(currentUserName) || !acknowledgedBy.includes(currentUserName);
    }),
    [currentUserName, handoverRows]
  );
  const alertRows = useMemo(
    () => [
      ...clinicalAlerts.filter(
        (a) => filteredResidentIds.has(a.residentId) && isActionableClinicalAlert(a) && !a.dismissedAt
      ),
      ...alerts.filter(
        (a) => filteredResidentIds.has(a.residentId) && isActionRequiredAlert(a) && !a.resolvedAt
      )
    ],
    [alerts, clinicalAlerts, filteredResidentIds]
  );
  const next4HoursItems = useMemo(() => {
    const cutoff = new Date(now.getTime() + 4 * 60 * 60 * 1e3);
    const items = [];
    for (const item of dueInterventions) {
      if (!item.dueAt) continue;
      if (item.status !== "overdue" && item.dueAt.getTime() > cutoff.getTime()) continue;
      const r = residentById.get(item.intervention.residentId);
      const overdueMin = item.status === "overdue" ? Math.round((now.getTime() - item.dueAt.getTime()) / 6e4) : null;
      items.push({
        id: `intv-${item.intervention.id}`,
        timeLabel: overdueMin !== null ? `${overdueMin}m late` : item.dueAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        sortKey: item.dueAt.getTime(),
        residentId: item.intervention.residentId,
        residentName: r ? `${r.firstName} ${r.lastName}` : "Unknown",
        room: r?.roomNumber || "—",
        label: item.intervention.name,
        isTask: false
      });
    }
    for (const task of dueTasks) {
      if (!task.residentId) continue;
      const r = residentById.get(task.residentId);
      items.push({
        id: `task-${task.id}`,
        timeLabel: "Today",
        sortKey: (/* @__PURE__ */ new Date(`${task.dueDate}T23:59`)).getTime(),
        residentId: task.residentId,
        residentName: r ? `${r.firstName} ${r.lastName}` : "Unknown",
        room: r?.roomNumber || "—",
        label: task.title,
        isTask: true
      });
    }
    return items.sort((a, b) => a.sortKey - b.sortKey);
  }, [dueInterventions, dueTasks, now, residentById]);
  const INTV_DISPLAY_LIMIT = 8;
  const INTV_GROUPS = [
    { status: "overdue", label: "Overdue", cls: "text-destructive" },
    { status: "due_now", label: "Due Now", cls: "text-warning-foreground" },
    { status: "due_today", label: "This Shift", cls: "text-primary" },
    { status: "upcoming", label: "Upcoming", cls: "text-muted-foreground" }
  ];
  const displayedInterventions = showAllInterventions ? dueInterventions : dueInterventions.slice(0, INTV_DISPLAY_LIMIT);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-[1800px] mx-auto", children: [
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground", children: "Operations Centre" }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-semibold tracking-tight mt-1", children: shift }),
        /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { children: formatDate(now) }),
          /* @__PURE__ */ jsx("span", { children: formatTime(now) }),
          /* @__PURE__ */ jsx("span", { children: currentUserName }),
          /* @__PURE__ */ jsx("span", { children: roleLabels[currentRole] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "What do I need to do next?" })
    ] }) }),
    /* @__PURE__ */ jsx(Card, { className: "sticky top-4 z-10 shadow-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 grid gap-3 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Wing" }),
        /* @__PURE__ */ jsxs(Select, { value: wingFilter, onValueChange: setWingFilter, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Wings" }),
            myWings.map((w) => /* @__PURE__ */ jsx(SelectItem, { value: w.id, children: w.name }, w.id))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Room" }),
        /* @__PURE__ */ jsxs(Select, { value: roomFilter, onValueChange: setRoomFilter, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Rooms" }),
            rooms.map((r) => /* @__PURE__ */ jsx(SelectItem, { value: r, children: r }, r))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Resident" }),
        /* @__PURE__ */ jsxs(Select, { value: residentFilter, onValueChange: setResidentFilter, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Residents" }),
            baseResidents.map((r) => /* @__PURE__ */ jsxs(SelectItem, { value: r.id, children: [
              r.firstName,
              " ",
              r.lastName
            ] }, r.id))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Assigned To" }),
        /* @__PURE__ */ jsxs(
          Select,
          {
            value: assignedFilter,
            onValueChange: (v) => setAssignedFilter(v),
            children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "me", children: "Me" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Staff" })
              ] })
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7", children: [
      /* @__PURE__ */ jsx(MetricCard, { label: "Residents Assigned", value: filteredResidents.length, icon: Users }),
      /* @__PURE__ */ jsx(MetricCard, { label: "Tasks Due", value: dueTasks.length, icon: ClipboardList }),
      /* @__PURE__ */ jsx(
        MetricCard,
        {
          label: "Interventions Due",
          value: dueInterventions.length,
          icon: ClipboardCheck
        }
      ),
      /* @__PURE__ */ jsx(MetricCard, { label: "Observations Due", value: dueObservations.length, icon: HeartPulse }),
      /* @__PURE__ */ jsx(MetricCard, { label: "Assessments Due", value: dueAssessments.length, icon: Stethoscope }),
      /* @__PURE__ */ jsx(MetricCard, { label: "Clinical Alerts", value: alertRows.length, icon: BellRing }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "text-left", onClick: () => setHandoverPanelOpen(true), children: /* @__PURE__ */ jsx(
        MetricCard,
        {
          label: "Handovers",
          value: handoversNeedingAttention.length,
          sublabel: handoversNeedingAttention.length > 0 ? `${handoversNeedingAttention.length} unread` : "No unread",
          icon: UserCheck,
          attention: handoversNeedingAttention.length > 0
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: handoverPanelOpen, onOpenChange: setHandoverPanelOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[85vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Handovers Requiring Review" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Current shift handovers for your residents, wing, or facility scope." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        handoversNeedingAttention.map((handover) => {
          const resident = residentById.get(handover.residentId);
          const wing = wings.find((item) => item.id === resident?.wingId);
          const readBy = Array.isArray(handover.readBy) ? handover.readBy : [];
          const acknowledgedBy = Array.isArray(handover.acknowledgedBy) ? handover.acknowledgedBy : [];
          const read = readBy.includes(currentUserName);
          const acknowledged = acknowledgedBy.includes(currentUserName);
          return /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-3 space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "font-medium capitalize", children: [
                  handover.shift,
                  " handover"
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  resident ? `${resident.firstName} ${resident.lastName} · Room ${resident.roomNumber}` : handover.residentId,
                  wing ? ` · ${wing.name}` : ""
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-1 flex-wrap justify-end", children: [
                handover.priority && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: handover.priority }),
                !read && /* @__PURE__ */ jsx(Badge, { className: "bg-warning text-warning-foreground", children: "Unread" }),
                read && !acknowledged && /* @__PURE__ */ jsx(Badge, { variant: "outline", children: "Read" }),
                acknowledged && /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: "Acknowledged" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                "Created by: ",
                handover.createdBy || handover.staff
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                "Created:",
                " ",
                handover.createdAt ? new Date(handover.createdAt).toLocaleString("en-GB") : handover.date
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Summary: " }),
                handover.summary
              ] }),
              handover.outstandingActions && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Notes: " }),
                handover.outstandingActions
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  size: "sm",
                  variant: "outline",
                  disabled: read,
                  onClick: () => markHandoverRead(handover.id),
                  children: "Mark as Read"
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  size: "sm",
                  disabled: acknowledged,
                  onClick: () => acknowledgeHandover(handover.id),
                  children: "Acknowledge"
                }
              ),
              /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", asChild: true, children: /* @__PURE__ */ jsx(Link, { to: "/handovers", children: "Open Full Handover" }) }),
              /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", asChild: true, children: /* @__PURE__ */ jsx(Link, { to: "/residents/$id", params: { id: handover.residentId }, children: "Open Resident" }) })
            ] })
          ] }, handover.id);
        }),
        handoversNeedingAttention.length === 0 && /* @__PURE__ */ jsx("div", { className: "rounded-md border p-8 text-center text-sm text-muted-foreground", children: "No unread handovers." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Upcoming Care Interventions" }),
        dueInterventions.length > 0 && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
          dueInterventions.length,
          " scheduled"
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "space-y-3", children: dueInterventions.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-8 text-center space-y-1 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx("div", { children: "No upcoming scheduled interventions for your assigned residents." }),
        /* @__PURE__ */ jsx("div", { className: "text-xs", children: "Try switching Assigned To to All Staff, or use Reset Demo Data." })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        INTV_GROUPS.map(({ status, label, cls }) => {
          const allInGroup = dueInterventions.filter((i) => i.status === status);
          const visibleInGroup = displayedInterventions.filter((i) => i.status === status);
          if (!visibleInGroup.length) return null;
          return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: cn(
                  "text-xs font-semibold uppercase tracking-wider px-1 pb-0.5",
                  cls
                ),
                children: [
                  label,
                  " · ",
                  allInGroup.length
                ]
              }
            ),
            visibleInGroup.map((item) => {
              const r = residentById.get(item.intervention.residentId);
              const overdueMins = item.status === "overdue" && item.dueAt ? Math.round((now.getTime() - item.dueAt.getTime()) / 6e4) : null;
              return /* @__PURE__ */ jsxs(
                "div",
                {
                  className: cn(
                    "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
                    interventionStatusClass(item.status)
                  ),
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-0.5", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-medium", children: r ? `${r.firstName} ${r.lastName}` : "Unknown" }),
                      /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                        "Room ",
                        r?.roomNumber || "—"
                      ] }),
                      /* @__PURE__ */ jsx("span", { children: item.intervention.name }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground tabular-nums", children: overdueMins !== null ? `${overdueMins}m overdue` : item.dueAt ? item.dueAt.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit"
                      }) : "—" })
                    ] }),
                    /* @__PURE__ */ jsx(
                      Link,
                      {
                        to: "/residents/$id",
                        params: { id: item.intervention.residentId },
                        className: "shrink-0",
                        children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", children: "Open Resident" })
                      }
                    )
                  ]
                },
                item.intervention.id
              );
            })
          ] }, status);
        }),
        dueInterventions.length > INTV_DISPLAY_LIMIT && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setShowAllInterventions((v) => !v),
            className: "text-xs text-primary hover:underline mt-1 px-1",
            children: showAllInterventions ? "Show fewer" : `View all ${dueInterventions.length} interventions`
          }
        )
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Next 4 Hours" }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "space-y-1", children: next4HoursItems.length === 0 ? /* @__PURE__ */ jsx("div", { className: "border rounded-md p-6 text-sm text-muted-foreground", children: "No scheduled work in the next 4 hours." }) : next4HoursItems.map((item) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 shrink-0 text-xs tabular-nums text-muted-foreground font-medium", children: item.timeLabel }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-0.5", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: item.residentName }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "Room ",
                item.room
              ] }),
              /* @__PURE__ */ jsx("span", { children: item.label }),
              item.isTask && /* @__PURE__ */ jsx(
                Badge,
                {
                  variant: "outline",
                  className: "text-[10px] shrink-0 border-primary/30 text-primary bg-primary/5",
                  children: "Task"
                }
              )
            ] }),
            /* @__PURE__ */ jsx(Link, { to: "/residents/$id", params: { id: item.residentId }, className: "shrink-0", children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", children: "Open Resident" }) })
          ]
        },
        item.id
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsx(Link, { to: "/assessments", children: /* @__PURE__ */ jsx(Card, { className: "hover:border-primary/50 transition-colors cursor-pointer h-full", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(Stethoscope, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: "Assessment Centre" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums", children: dueAssessments.length }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: "reassessments due" })
      ] }) }) }),
      /* @__PURE__ */ jsx(Link, { to: "/tasks", children: /* @__PURE__ */ jsx(Card, { className: "hover:border-primary/50 transition-colors cursor-pointer h-full", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(ClipboardList, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: "Tasks" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums", children: dueTasks.length }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: "tasks due today" })
      ] }) }) }),
      /* @__PURE__ */ jsx(Link, { to: "/incidents", children: /* @__PURE__ */ jsx(Card, { className: "hover:border-primary/50 transition-colors cursor-pointer h-full", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(ShieldAlert, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: "Incidents" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: "incident register" })
      ] }) }) }),
      /* @__PURE__ */ jsx(Link, { to: "/alerts", children: /* @__PURE__ */ jsx(Card, { className: "hover:border-primary/50 transition-colors cursor-pointer h-full", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(BellRing, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: "Clinical Alerts" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums", children: alertRows.length }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: "active alerts" })
      ] }) }) })
    ] })
  ] });
}
function OperationsPage() {
  return /* @__PURE__ */ jsx(OperationsHub, {});
}
export {
  OperationsPage as component
};
