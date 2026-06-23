import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import * as React from "react";
import { useState, useMemo } from "react";
import { c as cn, u as useCare, x as assessmentMeta, f as Button, C as Card, e as CardContent, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem, I as Input, b as CardHeader, d as CardTitle, n as deriveStatus, B as Badge, y as riskBadgeCls } from "./router-DLzRbDkQ.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BZBuOn5G.js";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown, ClipboardList, CalendarClock, AlertTriangle, ShieldAlert, Layers, UserCheck, Search, FileSpreadsheet, Printer } from "lucide-react";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "sonner";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "@radix-ui/react-tabs";
const Accordion = AccordionPrimitive.Root;
const AccordionItem = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(AccordionPrimitive.Item, { ref, className: cn("border-b", className), ...props }));
AccordionItem.displayName = "AccordionItem";
const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(AccordionPrimitive.Header, { className: "flex", children: /* @__PURE__ */ jsxs(
  AccordionPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex flex-1 items-center justify-between py-4 text-sm font-medium cursor-pointer transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" })
    ]
  }
) }));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;
const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsx(
  AccordionPrimitive.Content,
  {
    ref,
    className: "overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
    ...props,
    children: /* @__PURE__ */ jsx("div", { className: cn("pb-4 pt-0", className), children })
  }
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;
const ALL_TYPES = ["abbey_pain", "waterlow", "barthel", "must", "mna", "mmse", "four_at", "falls", "continence", "pain_chart", "cornell", "gds15", "abc", "abs", "norton", "nutrition", "pinch_me"];
const CORE_TYPES = ["waterlow", "barthel", "abbey_pain", "must", "falls", "mmse"];
const CATEGORY_FILTERS = [{
  id: "mobility",
  label: "Mobility",
  types: ["barthel"]
}, {
  id: "pressure_care",
  label: "Pressure Care",
  types: ["waterlow", "norton"]
}, {
  id: "nutrition",
  label: "Nutrition",
  types: ["must", "mna", "nutrition"]
}, {
  id: "cognition",
  label: "Cognition",
  types: ["mmse", "four_at"]
}, {
  id: "falls_risk",
  label: "Falls Risk",
  types: ["falls"]
}, {
  id: "pain",
  label: "Pain",
  types: ["abbey_pain", "pain_chart"]
}, {
  id: "behaviour",
  label: "Behaviour",
  types: ["abc", "abs", "cornell", "gds15"]
}, {
  id: "continence",
  label: "Continence",
  types: ["continence"]
}, {
  id: "safety",
  label: "Safety",
  types: ["four_at", "norton", "falls"]
}];
function toDateKey(value) {
  return value ? value.slice(0, 10) : "";
}
function getStatus(a) {
  const ds = deriveStatus(a);
  if (ds === "overdue") return "overdue";
  if (ds === "due") return "due";
  return "completed";
}
function riskOrder(level) {
  if (level === "very_high") return 4;
  if (level === "high") return 3;
  if (level === "moderate") return 2;
  if (level === "low") return 1;
  return 0;
}
function statusClass(status) {
  if (status === "overdue") return "bg-destructive/10 text-destructive border-destructive/30";
  if (status === "due") return "bg-warning/15 text-warning-foreground border-warning/40";
  return "bg-success/10 text-success border-success/25";
}
function statusLabel(status) {
  if (status === "overdue") return "Overdue";
  if (status === "due") return "Due";
  return "Completed";
}
function dueText(dueDate, status, todayKey) {
  if (!dueDate) return "No Due Date";
  if (status === "overdue") return `Overdue · ${dueDate}`;
  if (dueDate === todayKey) return "Due Today";
  return `Due ${dueDate}`;
}
function queueGroup(row, todayKey) {
  const highRisk = row.assessment.riskLevel === "high" || row.assessment.riskLevel === "very_high";
  if (row.status === "overdue") return "overdue_critical";
  if (highRisk && row.status === "due") return "high_risk_due_soon";
  if (row.status === "due") {
    const diff = row.dueDate ? Math.floor((new Date(row.dueDate).getTime() - new Date(todayKey).getTime()) / 864e5) : 999;
    if (diff <= 7) return "due_this_week";
  }
  return "routine_scheduled";
}
function QueueTable({
  rows,
  todayKey,
  onOpenAssessment
}) {
  return /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
    /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Resident" }),
      /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Assessment Type" }),
      /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Risk Level" }),
      /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Due Date" }),
      /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Assigned Staff" }),
      /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Status" }),
      /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "Actions" })
    ] }) }),
    /* @__PURE__ */ jsxs("tbody", { className: "divide-y", children: [
      rows.map((row) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 cursor-pointer", onClick: () => onOpenAssessment(row.assessment.id), title: "Open assessment details", children: [
        /* @__PURE__ */ jsxs("td", { className: "p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium text-foreground", children: row.residentName }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            "Room ",
            row.roomNumber || "-"
          ] })
        ] }),
        /* @__PURE__ */ jsx("td", { className: "p-3", children: assessmentMeta[row.assessment.type].name }),
        /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `text-[10px] capitalize ${riskBadgeCls(row.assessment.riskLevel)}`, children: row.assessment.riskLevel.replace("_", " ") }) }),
        /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: row.status === "overdue" ? "font-semibold text-destructive" : row.status === "due" ? "font-medium text-warning-foreground" : "text-muted-foreground", children: dueText(row.dueDate, row.status, todayKey) }) }),
        /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: row.assessment.assignedToName || "Unassigned" }),
        /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `text-[10px] ${statusClass(row.status)}`, children: statusLabel(row.status) }) }),
        /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Link, { to: "/residents/$id", params: {
            id: row.assessment.residentId
          }, className: "text-xs text-primary hover:underline", onClick: (e) => e.stopPropagation(), children: "Resident" }),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "•" }),
          /* @__PURE__ */ jsx(Link, { to: "/assessments/new/$residentId", params: {
            residentId: row.assessment.residentId
          }, search: {
            type: row.assessment.type
          }, className: "text-xs text-primary hover:underline", onClick: (e) => e.stopPropagation(), children: "Reassess" })
        ] }) })
      ] }, row.assessment.id)),
      rows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "p-8 text-center text-sm text-muted-foreground", children: "No assessments match this view and filter selection." }) })
    ] })
  ] }) });
}
function AssessmentsList() {
  const navigate = useNavigate();
  const {
    assessments,
    residents,
    users,
    currentRole,
    currentUserName
  } = useCare();
  const [roleView, setRoleView] = useState("nurse");
  const [viewMode, setViewMode] = useState("due_overdue");
  const [search, setSearch] = useState("");
  const [typeF, setTypeF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [riskF, setRiskF] = useState("all");
  const [categoryF, setCategoryF] = useState("all");
  const isGovernanceRole = currentRole === "cnm" || currentRole === "don";
  const todayKey = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const activeAssessments = useMemo(() => assessments.filter((a) => a.status !== "deleted" && a.status !== "archived"), [assessments]);
  const latestByResidentType = useMemo(() => {
    const sorted = [...activeAssessments].sort((a, b) => b.date.localeCompare(a.date));
    const map = /* @__PURE__ */ new Map();
    for (const a of sorted) {
      if (a.supersededById) continue;
      const key = `${a.residentId}:${a.type}`;
      if (!map.has(key)) map.set(key, a);
    }
    return map;
  }, [activeAssessments]);
  const latestRows = useMemo(() => {
    return Array.from(latestByResidentType.values()).map((assessment) => {
      const resident = residents.find((r) => r.id === assessment.residentId);
      return {
        assessment,
        residentName: resident ? `${resident.firstName} ${resident.lastName}` : "Unknown Resident",
        roomNumber: resident?.roomNumber || "",
        dueDate: toDateKey(assessment.nextReassessmentDate || assessment.dueDate),
        status: getStatus(assessment)
      };
    }).sort((a, b) => {
      if (a.status !== b.status) {
        const order = {
          overdue: 0,
          due: 1,
          completed: 2
        };
        return order[a.status] - order[b.status];
      }
      if (a.dueDate !== b.dueDate) return `${a.dueDate || "9999-12-31"}`.localeCompare(`${b.dueDate || "9999-12-31"}`);
      return riskOrder(b.assessment.riskLevel) - riskOrder(a.assessment.riskLevel);
    });
  }, [latestByResidentType, residents]);
  const allActiveRows = useMemo(() => {
    return [...activeAssessments].sort((a, b) => b.date.localeCompare(a.date)).map((assessment) => {
      const resident = residents.find((r) => r.id === assessment.residentId);
      return {
        assessment,
        residentName: resident ? `${resident.firstName} ${resident.lastName}` : "Unknown Resident",
        roomNumber: resident?.roomNumber || "",
        dueDate: toDateKey(assessment.nextReassessmentDate || assessment.dueDate),
        status: getStatus(assessment)
      };
    });
  }, [activeAssessments, residents]);
  const baseRowsForMode = useMemo(() => {
    if (viewMode === "all_active") return allActiveRows;
    if (viewMode === "completed") return allActiveRows.filter((r) => (r.assessment.status || "completed") === "completed");
    if (viewMode === "draft_in_progress") return allActiveRows.filter((r) => {
      const s = r.assessment.status || "completed";
      return s === "draft" || s === "in_progress";
    });
    if (viewMode === "high_risk") return latestRows.filter((r) => r.assessment.riskLevel === "high" || r.assessment.riskLevel === "very_high");
    if (viewMode === "my_assigned") return latestRows.filter((r) => {
      const assigned = (r.assessment.assignedToName || "").toLowerCase();
      const me = currentUserName.toLowerCase();
      return assigned === me || (r.assessment.assessor || "").toLowerCase() === me;
    });
    if (viewMode === "by_resident") return allActiveRows;
    if (viewMode === "by_assessment_type") return allActiveRows;
    return latestRows.filter((r) => r.status === "due" || r.status === "overdue");
  }, [allActiveRows, currentUserName, latestRows, viewMode]);
  const filteredRows = useMemo(() => {
    return baseRowsForMode.filter((row) => {
      if (search) {
        const s = search.toLowerCase();
        const residentText = `${row.residentName} room ${row.roomNumber}`.toLowerCase();
        if (!residentText.includes(s)) return false;
      }
      if (typeF !== "all" && row.assessment.type !== typeF) return false;
      if (statusF !== "all" && row.status !== statusF) return false;
      if (riskF !== "all" && row.assessment.riskLevel !== riskF) return false;
      if (categoryF !== "all") {
        const category = CATEGORY_FILTERS.find((c) => c.id === categoryF);
        if (!category || !category.types.includes(row.assessment.type)) return false;
      }
      return true;
    });
  }, [baseRowsForMode, categoryF, riskF, search, statusF, typeF]);
  const groupedPriorityRows = useMemo(() => {
    const grouped = {
      overdue_critical: [],
      high_risk_due_soon: [],
      due_this_week: [],
      routine_scheduled: []
    };
    for (const row of filteredRows) {
      grouped[queueGroup(row, todayKey)].push(row);
    }
    return grouped;
  }, [filteredRows, todayKey]);
  const byResident = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const row of filteredRows) {
      const key = `${row.assessment.residentId}:${row.residentName}`;
      const list = map.get(key) || [];
      list.push(row);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([key, rows]) => {
      const [residentId, residentName] = key.split(":");
      return {
        residentId,
        residentName,
        roomNumber: rows[0]?.roomNumber || "",
        rows: rows.sort((a, b) => `${a.dueDate || "9999-12-31"}`.localeCompare(`${b.dueDate || "9999-12-31"}`))
      };
    }).sort((a, b) => a.residentName.localeCompare(b.residentName));
  }, [filteredRows]);
  const byAssessmentType = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const row of filteredRows) {
      const list = map.get(row.assessment.type) || [];
      list.push(row);
      map.set(row.assessment.type, list);
    }
    return Array.from(map.entries()).map(([type, rows]) => ({
      type,
      rows: rows.sort((a, b) => `${a.dueDate || "9999-12-31"}`.localeCompare(`${b.dueDate || "9999-12-31"}`))
    })).sort((a, b) => assessmentMeta[a.type].name.localeCompare(assessmentMeta[b.type].name));
  }, [filteredRows]);
  const residentsMissingMandatory = useMemo(() => {
    return residents.map((resident) => {
      const missing = CORE_TYPES.filter((type) => !latestByResidentType.has(`${resident.id}:${type}`));
      return {
        resident,
        missing
      };
    }).filter((row) => row.missing.length > 0);
  }, [residents, latestByResidentType]);
  const summary = useMemo(() => {
    const dueToday = latestRows.filter((r) => (r.status === "due" || r.status === "overdue") && r.dueDate === todayKey).length;
    const overdue = latestRows.filter((r) => r.status === "overdue").length;
    const highRiskResidents = new Set(latestRows.filter((r) => r.assessment.riskLevel === "high" || r.assessment.riskLevel === "very_high").map((r) => r.assessment.residentId)).size;
    const myAssessments = latestRows.filter((r) => {
      const assigned = (r.assessment.assignedToName || "").toLowerCase();
      return (r.status === "due" || r.status === "overdue") && assigned === currentUserName.toLowerCase();
    }).length;
    return {
      dueToday,
      overdue,
      highRiskResidents,
      missingAssessments: residentsMissingMandatory.length,
      myAssessments
    };
  }, [currentUserName, latestRows, residentsMissingMandatory.length, todayKey]);
  const governance = useMemo(() => {
    const dueUniverse = latestRows.filter((r) => !!r.dueDate);
    const overdue = dueUniverse.filter((r) => r.status === "overdue").length;
    const compliancePct = dueUniverse.length ? Math.max(0, Math.round((dueUniverse.length - overdue) / dueUniverse.length * 100)) : 100;
    const coverageByType = ALL_TYPES.map((type) => {
      const rows = latestRows.filter((r) => r.assessment.type === type);
      return {
        type,
        completed: rows.filter((r) => r.status === "completed").length,
        due: rows.filter((r) => r.status === "due").length,
        overdue: rows.filter((r) => r.status === "overdue").length
      };
    }).filter((row) => row.completed + row.due + row.overdue > 0);
    const riskDistribution = ["very_high", "high", "moderate", "low", "none"].map((level) => ({
      level,
      count: latestRows.filter((r) => r.assessment.riskLevel === level).length
    }));
    const staffPerformance = users.map((u) => {
      const assigned = latestRows.filter((r) => (r.assessment.assignedToName || "") === u.name);
      return {
        name: u.name,
        role: u.role,
        due: assigned.filter((r) => r.status === "due").length,
        overdue: assigned.filter((r) => r.status === "overdue").length,
        completed: assigned.filter((r) => r.status === "completed").length
      };
    }).filter((r) => r.due + r.overdue + r.completed > 0).sort((a, b) => b.overdue - a.overdue || b.due - a.due);
    const completionTrends = Array.from({
      length: 7
    }).map((_, idx) => {
      const day = /* @__PURE__ */ new Date();
      day.setDate(day.getDate() - (6 - idx));
      const key = day.toISOString().slice(0, 10);
      const count = activeAssessments.filter((a) => (a.status || "completed") === "completed" && a.date.slice(0, 10) === key).length;
      return {
        day: key.slice(5),
        completed: count
      };
    });
    const auditRows = [...activeAssessments].filter((a) => (a.status || "completed") === "completed").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30).map((a) => {
      const resident = residents.find((r) => r.id === a.residentId);
      return {
        id: a.id,
        residentName: resident ? `${resident.firstName} ${resident.lastName}` : "Unknown Resident",
        assessmentName: assessmentMeta[a.type].name,
        assessor: a.assessor,
        completedDate: a.date.slice(0, 10)
      };
    });
    return {
      compliancePct,
      dueUniverse: dueUniverse.length,
      overdue,
      coverageByType,
      riskDistribution,
      staffPerformance,
      completionTrends,
      auditRows
    };
  }, [activeAssessments, latestRows, residents, users]);
  const exportGovernanceCsv = () => {
    const header = ["Resident", "Assessment", "Assessor", "Completed Date", "Due Date", "Status"];
    const body = filteredRows.map((row) => [row.residentName, assessmentMeta[row.assessment.type].name, row.assessment.assessor, row.assessment.date.slice(0, 10), row.dueDate || "", statusLabel(row.status)]);
    const csv = [header, ...body].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assessment-centre-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const openAssessment = (assessmentId) => {
    navigate({
      to: "/assessments/$assessmentId",
      params: {
        assessmentId
      }
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-[1500px]", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Assessment Centre" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Clinical assessment record system with a default task-focused nurse view." })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/assessments/reassessment", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", children: [
        /* @__PURE__ */ jsx(ClipboardList, { className: "h-4 w-4 mr-1.5" }),
        " Reassessment Workflow"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3", children: [
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(CalendarClock, { className: "h-5 w-5 text-warning-foreground" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums", children: summary.dueToday }),
          /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: "Due Today" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-5 w-5 text-destructive" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums", children: summary.overdue }),
          /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: "Overdue" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(ShieldAlert, { className: "h-5 w-5 text-warning-foreground" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums", children: summary.highRiskResidents }),
          /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: "High Risk Residents" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Layers, { className: "h-5 w-5 text-muted-foreground" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums", children: summary.missingAssessments }),
          /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: "Missing Assessments" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(UserCheck, { className: "h-5 w-5 text-info" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums", children: summary.myAssessments }),
          /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: "My Assessments" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4", children: isGovernanceRole ? /* @__PURE__ */ jsxs(Tabs, { value: roleView, onValueChange: (v) => setRoleView(v), children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "h-auto", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "nurse", children: "Nurse View" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "governance", children: "Governance View" })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "nurse", className: "space-y-4", children: [
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:grid-cols-2 xl:grid-cols-6", children: [
            /* @__PURE__ */ jsxs(Select, { value: viewMode, onValueChange: (value) => setViewMode(value), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "xl:col-span-2", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "View mode" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "due_overdue", children: "Due / Overdue" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "all_active", children: "All Active Assessments" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "completed", children: "Completed Assessments" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "draft_in_progress", children: "Draft / In Progress" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "high_risk", children: "High Risk Only" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "my_assigned", children: "My Assigned Assessments" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "by_resident", children: "By Resident" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "by_assessment_type", children: "By Assessment Type" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative xl:col-span-2", children: [
              /* @__PURE__ */ jsx(Search, { className: "h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" }),
              /* @__PURE__ */ jsx(Input, { className: "pl-8 h-9", placeholder: "Resident search", value: search, onChange: (e) => setSearch(e.target.value) })
            ] }),
            /* @__PURE__ */ jsxs(Select, { value: categoryF, onValueChange: (value) => {
              setCategoryF(value);
              setTypeF("all");
            }, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Category" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Category: All" }),
                CATEGORY_FILTERS.map((category) => /* @__PURE__ */ jsx(SelectItem, { value: category.id, children: category.label }, category.id))
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Select, { value: typeF, onValueChange: (value) => setTypeF(value), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Assessment Type" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Assessment Type: All" }),
                (categoryF === "all" ? ALL_TYPES : CATEGORY_FILTERS.find((c) => c.id === categoryF)?.types || []).map((type) => /* @__PURE__ */ jsx(SelectItem, { value: type, children: assessmentMeta[type].name }, type))
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:grid-cols-3", children: [
            /* @__PURE__ */ jsxs(Select, { value: statusF, onValueChange: (value) => setStatusF(value), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Status" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Status: All" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "due", children: "Due" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "overdue", children: "Overdue" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "completed", children: "Completed" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Select, { value: riskF, onValueChange: (value) => setRiskF(value), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Risk" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Risk: All" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "very_high", children: "Very High" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "high", children: "High" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "moderate", children: "Moderate" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "low", children: "Low" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "none", children: "None" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => {
              setViewMode("due_overdue");
              setSearch("");
              setCategoryF("all");
              setTypeF("all");
              setStatusF("all");
              setRiskF("all");
            }, children: "Reset Filters" })
          ] })
        ] }) }),
        viewMode === "due_overdue" ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxs(Accordion, { type: "multiple", defaultValue: ["overdue_critical", "high_risk_due_soon"], children: [
          /* @__PURE__ */ jsxs(AccordionItem, { value: "overdue_critical", children: [
            /* @__PURE__ */ jsx(AccordionTrigger, { children: /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
              "Overdue Critical (",
              groupedPriorityRows.overdue_critical.length,
              ")"
            ] }) }),
            /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx(QueueTable, { rows: groupedPriorityRows.overdue_critical, todayKey, onOpenAssessment: openAssessment }) })
          ] }),
          /* @__PURE__ */ jsxs(AccordionItem, { value: "high_risk_due_soon", children: [
            /* @__PURE__ */ jsx(AccordionTrigger, { children: /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
              "High Risk Due Soon (",
              groupedPriorityRows.high_risk_due_soon.length,
              ")"
            ] }) }),
            /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx(QueueTable, { rows: groupedPriorityRows.high_risk_due_soon, todayKey, onOpenAssessment: openAssessment }) })
          ] }),
          /* @__PURE__ */ jsxs(AccordionItem, { value: "due_this_week", children: [
            /* @__PURE__ */ jsx(AccordionTrigger, { children: /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
              "Due This Week (",
              groupedPriorityRows.due_this_week.length,
              ")"
            ] }) }),
            /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx(QueueTable, { rows: groupedPriorityRows.due_this_week, todayKey, onOpenAssessment: openAssessment }) })
          ] }),
          /* @__PURE__ */ jsxs(AccordionItem, { value: "routine_scheduled", children: [
            /* @__PURE__ */ jsx(AccordionTrigger, { children: /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
              "Routine / Scheduled (",
              groupedPriorityRows.routine_scheduled.length,
              ")"
            ] }) }),
            /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx(QueueTable, { rows: groupedPriorityRows.routine_scheduled, todayKey, onOpenAssessment: openAssessment }) })
          ] })
        ] }) }) }) : viewMode === "by_resident" ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          byResident.map((group) => /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base", children: [
              group.residentName,
              " · Room ",
              group.roomNumber || "-"
            ] }) }),
            /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx(QueueTable, { rows: group.rows, todayKey, onOpenAssessment: openAssessment }) })
          ] }, group.residentId)),
          byResident.length === 0 && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-8 text-center text-sm text-muted-foreground", children: "No resident groups match the current filter set." }) })
        ] }) : viewMode === "by_assessment_type" ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          byAssessmentType.map((group) => /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base", children: [
              assessmentMeta[group.type].name,
              " (",
              group.rows.length,
              ")"
            ] }) }),
            /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx(QueueTable, { rows: group.rows, todayKey, onOpenAssessment: openAssessment }) })
          ] }, group.type)),
          byAssessmentType.length === 0 && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-8 text-center text-sm text-muted-foreground", children: "No assessment-type groups match the current filter set." }) })
        ] }) : /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx(QueueTable, { rows: filteredRows, todayKey, onOpenAssessment: openAssessment }) }) })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "governance", className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: exportGovernanceCsv, children: [
            /* @__PURE__ */ jsx(FileSpreadsheet, { className: "h-3.5 w-3.5 mr-1" }),
            " Export"
          ] }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => window.print(), children: [
            /* @__PURE__ */ jsx(Printer, { className: "h-3.5 w-3.5 mr-1" }),
            " Print"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-4", children: [
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Compliance %" }) }),
            /* @__PURE__ */ jsxs(CardContent, { children: [
              /* @__PURE__ */ jsxs("div", { className: "text-2xl font-semibold tabular-nums", children: [
                governance.compliancePct,
                "%"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
                "Overdue: ",
                governance.overdue,
                " / Due Universe: ",
                governance.dueUniverse
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Missing Assessments" }) }),
            /* @__PURE__ */ jsxs(CardContent, { children: [
              /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums", children: residentsMissingMandatory.length }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: "Residents missing core assessments" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Staff Workload" }) }),
            /* @__PURE__ */ jsxs(CardContent, { children: [
              /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums", children: governance.staffPerformance.length }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: "Active staff with assessment assignments" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Trend Window" }) }),
            /* @__PURE__ */ jsxs(CardContent, { children: [
              /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums", children: "7 days" }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: "Completion trend interval" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Residents Missing Mandatory Assessments" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2", children: [
            residentsMissingMandatory.slice(0, 20).map((row) => /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-2 text-sm flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                  row.resident.firstName,
                  " ",
                  row.resident.lastName
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  "Missing (",
                  row.missing.length,
                  "):",
                  " ",
                  row.missing.map((m) => assessmentMeta[m].name).join(", ")
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Link, { to: "/residents/$id", params: {
                  id: row.resident.id
                }, className: "text-xs text-primary hover:underline", children: "Open Resident Profile" }),
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "•" }),
                /* @__PURE__ */ jsx(Link, { to: "/residents/$id/assessments", params: {
                  id: row.resident.id
                }, className: "text-xs text-primary hover:underline", children: "View Assessment Status" })
              ] })
            ] }, row.resident.id)),
            residentsMissingMandatory.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "All residents currently have mandatory assessments on record." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Assessment Coverage by Type" }) }),
            /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Assessment Type" }),
                /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Completed" }),
                /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Due" }),
                /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Overdue" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y", children: governance.coverageByType.map((row) => /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "p-3", children: assessmentMeta[row.type].name }),
                /* @__PURE__ */ jsx("td", { className: "p-3 tabular-nums", children: row.completed }),
                /* @__PURE__ */ jsx("td", { className: "p-3 tabular-nums", children: row.due }),
                /* @__PURE__ */ jsx("td", { className: "p-3 tabular-nums", children: row.overdue })
              ] }, row.type)) })
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Risk Distribution" }) }),
            /* @__PURE__ */ jsx(CardContent, { className: "space-y-2", children: governance.riskDistribution.map((row) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border rounded-md p-2 text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "capitalize", children: row.level.replace("_", " ") }),
              /* @__PURE__ */ jsx("span", { className: "font-semibold tabular-nums", children: row.count })
            ] }, row.level)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Staff Workload Distribution" }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Staff" }),
              /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Role" }),
              /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Due" }),
              /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Overdue" }),
              /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Completed" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { className: "divide-y", children: [
              governance.staffPerformance.map((row) => /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "p-3", children: row.name }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-xs uppercase", children: row.role }),
                /* @__PURE__ */ jsx("td", { className: "p-3 tabular-nums", children: row.due }),
                /* @__PURE__ */ jsx("td", { className: "p-3 tabular-nums", children: row.overdue }),
                /* @__PURE__ */ jsx("td", { className: "p-3 tabular-nums", children: row.completed })
              ] }, row.name)),
              governance.staffPerformance.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-6 text-center text-muted-foreground", children: "No staff workload data in current scope." }) })
            ] })
          ] }) }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Completion Trends (Last 7 Days)" }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "grid gap-2 md:grid-cols-7", children: governance.completionTrends.map((point) => /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-2 text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: point.day }),
            /* @__PURE__ */ jsx("div", { className: "text-lg font-semibold tabular-nums", children: point.completed })
          ] }, point.day)) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Recent Audit Reporting" }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Resident" }),
              /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Assessment" }),
              /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Completed By" }),
              /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Date" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y", children: governance.auditRows.map((row) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "p-3", children: row.residentName }),
              /* @__PURE__ */ jsx("td", { className: "p-3", children: row.assessmentName }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: row.assessor }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: row.completedDate })
            ] }, row.id)) })
          ] }) }) })
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:grid-cols-2 xl:grid-cols-6", children: [
          /* @__PURE__ */ jsxs(Select, { value: viewMode, onValueChange: (value) => setViewMode(value), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "xl:col-span-2", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "View mode" }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "due_overdue", children: "Due / Overdue" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "all_active", children: "All Active Assessments" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "completed", children: "Completed Assessments" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "draft_in_progress", children: "Draft / In Progress" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "high_risk", children: "High Risk Only" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "my_assigned", children: "My Assigned Assessments" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "by_resident", children: "By Resident" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "by_assessment_type", children: "By Assessment Type" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative xl:col-span-2", children: [
            /* @__PURE__ */ jsx(Search, { className: "h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" }),
            /* @__PURE__ */ jsx(Input, { className: "pl-8 h-9", placeholder: "Resident search", value: search, onChange: (e) => setSearch(e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs(Select, { value: categoryF, onValueChange: (value) => {
            setCategoryF(value);
            setTypeF("all");
          }, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Category" }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Category: All" }),
              CATEGORY_FILTERS.map((category) => /* @__PURE__ */ jsx(SelectItem, { value: category.id, children: category.label }, category.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Select, { value: typeF, onValueChange: (value) => setTypeF(value), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Assessment Type" }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Assessment Type: All" }),
              (categoryF === "all" ? ALL_TYPES : CATEGORY_FILTERS.find((c) => c.id === categoryF)?.types || []).map((type) => /* @__PURE__ */ jsx(SelectItem, { value: type, children: assessmentMeta[type].name }, type))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-2 md:grid-cols-3", children: [
          /* @__PURE__ */ jsxs(Select, { value: statusF, onValueChange: (value) => setStatusF(value), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Status" }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Status: All" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "due", children: "Due" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "overdue", children: "Overdue" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "completed", children: "Completed" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Select, { value: riskF, onValueChange: (value) => setRiskF(value), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Risk" }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "Risk: All" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "very_high", children: "Very High" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "high", children: "High" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "moderate", children: "Moderate" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "low", children: "Low" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "none", children: "None" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => {
            setViewMode("due_overdue");
            setSearch("");
            setCategoryF("all");
            setTypeF("all");
            setStatusF("all");
            setRiskF("all");
          }, children: "Reset Filters" })
        ] })
      ] }) }),
      viewMode === "due_overdue" ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxs(Accordion, { type: "multiple", defaultValue: ["overdue_critical", "high_risk_due_soon"], children: [
        /* @__PURE__ */ jsxs(AccordionItem, { value: "overdue_critical", children: [
          /* @__PURE__ */ jsx(AccordionTrigger, { children: /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
            "Overdue Critical (",
            groupedPriorityRows.overdue_critical.length,
            ")"
          ] }) }),
          /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx(QueueTable, { rows: groupedPriorityRows.overdue_critical, todayKey, onOpenAssessment: openAssessment }) })
        ] }),
        /* @__PURE__ */ jsxs(AccordionItem, { value: "high_risk_due_soon", children: [
          /* @__PURE__ */ jsx(AccordionTrigger, { children: /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
            "High Risk Due Soon (",
            groupedPriorityRows.high_risk_due_soon.length,
            ")"
          ] }) }),
          /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx(QueueTable, { rows: groupedPriorityRows.high_risk_due_soon, todayKey, onOpenAssessment: openAssessment }) })
        ] }),
        /* @__PURE__ */ jsxs(AccordionItem, { value: "due_this_week", children: [
          /* @__PURE__ */ jsx(AccordionTrigger, { children: /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
            "Due This Week (",
            groupedPriorityRows.due_this_week.length,
            ")"
          ] }) }),
          /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx(QueueTable, { rows: groupedPriorityRows.due_this_week, todayKey, onOpenAssessment: openAssessment }) })
        ] }),
        /* @__PURE__ */ jsxs(AccordionItem, { value: "routine_scheduled", children: [
          /* @__PURE__ */ jsx(AccordionTrigger, { children: /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
            "Routine / Scheduled (",
            groupedPriorityRows.routine_scheduled.length,
            ")"
          ] }) }),
          /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx(QueueTable, { rows: groupedPriorityRows.routine_scheduled, todayKey, onOpenAssessment: openAssessment }) })
        ] })
      ] }) }) }) : viewMode === "by_resident" ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        byResident.map((group) => /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base", children: [
            group.residentName,
            " · Room ",
            group.roomNumber || "-"
          ] }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx(QueueTable, { rows: group.rows, todayKey, onOpenAssessment: openAssessment }) })
        ] }, group.residentId)),
        byResident.length === 0 && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-8 text-center text-sm text-muted-foreground", children: "No resident groups match the current filter set." }) })
      ] }) : viewMode === "by_assessment_type" ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        byAssessmentType.map((group) => /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base", children: [
            assessmentMeta[group.type].name,
            " (",
            group.rows.length,
            ")"
          ] }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx(QueueTable, { rows: group.rows, todayKey, onOpenAssessment: openAssessment }) })
        ] }, group.type)),
        byAssessmentType.length === 0 && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-8 text-center text-sm text-muted-foreground", children: "No assessment-type groups match the current filter set." }) })
      ] }) : /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx(QueueTable, { rows: filteredRows, todayKey, onOpenAssessment: openAssessment }) }) })
    ] }) })
  ] });
}
export {
  AssessmentsList as component
};
