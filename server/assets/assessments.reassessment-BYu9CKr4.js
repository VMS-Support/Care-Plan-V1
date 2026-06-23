import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { u as useCare, n as deriveStatus, C as Card, e as CardContent, x as assessmentMeta, f as Button, B as Badge, y as riskBadgeCls, G as statusBadgeCls } from "./router-DLzRbDkQ.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BZBuOn5G.js";
import { ArrowLeft, AlertTriangle, Clock, RefreshCw, Users, Zap } from "lucide-react";
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
const CORE_TYPES = ["waterlow", "barthel", "abbey_pain", "must", "falls", "mmse"];
function ReassessmentQueue() {
  const {
    assessments,
    residents,
    assessmentTriggerEvents
  } = useCare();
  const today = /* @__PURE__ */ new Date();
  new Date(today.getTime() + 7 * 864e5);
  const queue = useMemo(() => {
    const items = assessments.filter((a) => a.status === "completed" && !a.supersededById && a.nextReassessmentDate).map((a) => ({
      a,
      ds: deriveStatus(a)
    })).filter((x) => x.ds === "due" || x.ds === "overdue");
    return items;
  }, [assessments]);
  const overdue = queue.filter((x) => x.ds === "overdue");
  const dueToday = queue.filter((x) => x.a.nextReassessmentDate === today.toISOString().slice(0, 10));
  const dueWeek = queue.filter((x) => x.ds === "due");
  const residentsMissing = useMemo(() => {
    const hasByResident = {};
    for (const a of assessments) {
      if (a.status !== "completed") continue;
      (hasByResident[a.residentId] ??= /* @__PURE__ */ new Set()).add(a.type);
    }
    return residents.flatMap((r) => {
      const has = hasByResident[r.id] || /* @__PURE__ */ new Set();
      const missing = CORE_TYPES.filter((t) => !has.has(t));
      return missing.map((t) => ({
        resident: r,
        type: t
      }));
    });
  }, [assessments, residents]);
  const triggered = useMemo(() => assessmentTriggerEvents.slice(0, 20), [assessmentTriggerEvents]);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-[1400px]", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/assessments", className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      " Assessment Centre"
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Reassessment Queue" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Scheduled and triggered reassessments across all residents." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsx(Stat, { icon: AlertTriangle, label: "Overdue", value: overdue.length, tone: overdue.length ? "destructive" : "default" }),
      /* @__PURE__ */ jsx(Stat, { icon: Clock, label: "Due Today", value: dueToday.length, tone: "warning" }),
      /* @__PURE__ */ jsx(Stat, { icon: RefreshCw, label: "Due This Week", value: dueWeek.length, tone: "warning" }),
      /* @__PURE__ */ jsx(Stat, { icon: Users, label: "Residents Missing Core", value: residentsMissing.length })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "overdue", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "flex-wrap h-auto", children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "overdue", children: [
          "Overdue (",
          overdue.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "today", children: [
          "Due Today (",
          dueToday.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "week", children: [
          "Due This Week (",
          dueWeek.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "missing", children: [
          "Missing Core (",
          residentsMissing.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "triggered", children: [
          "Triggered (",
          triggered.length,
          ")"
        ] })
      ] }),
      ["overdue", "today", "week"].map((k) => {
        const list = k === "overdue" ? overdue : k === "today" ? dueToday : dueWeek;
        return /* @__PURE__ */ jsx(TabsContent, { value: k, className: "mt-4", children: /* @__PURE__ */ jsx(QueueTable, { list, residents }) }, k);
      }),
      /* @__PURE__ */ jsx(TabsContent, { value: "missing", className: "mt-4", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Resident" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Missing Assessment" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "Action" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y", children: [
          residentsMissing.map(({
            resident,
            type
          }) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsxs("td", { className: "p-3", children: [
              /* @__PURE__ */ jsxs(Link, { to: "/residents/$id/assessments", params: {
                id: resident.id
              }, className: "font-medium hover:text-primary", children: [
                resident.firstName,
                " ",
                resident.lastName
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                "Room ",
                resident.roomNumber
              ] })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "p-3", children: assessmentMeta[type].name }),
            /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsx(Link, { to: "/assessments/new/$residentId", params: {
              residentId: resident.id
            }, search: {
              type
            }, children: /* @__PURE__ */ jsx(Button, { size: "sm", children: "Start" }) }) })
          ] }, resident.id + type)),
          residentsMissing.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 3, className: "p-6 text-center text-sm text-muted-foreground", children: "All residents have core assessments." }) })
        ] })
      ] }) }) }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "triggered", className: "mt-4", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "When" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Resident" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Trigger" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Source" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Affected" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "By" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y", children: [
          triggered.map((t) => {
            const r = residents.find((x) => x.id === t.residentId);
            return /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: t.at.slice(0, 16).replace("T", " ") }),
              /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs(Link, { to: "/residents/$id/assessments", params: {
                id: t.residentId
              }, className: "hover:text-primary", children: [
                r?.firstName,
                " ",
                r?.lastName
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "capitalize text-[10px]", children: [
                /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3 mr-1" }),
                t.trigger.replace(/_/g, " ")
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-xs capitalize", children: t.sourceModule }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: t.affectedAssessmentTypes.map((x) => assessmentMeta[x].name).join(", ") || "—" }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: t.byUserName || "—" })
            ] }, t.id);
          }),
          triggered.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-6 text-center text-sm text-muted-foreground", children: "No triggered reassessments yet." }) })
        ] })
      ] }) }) }) })
    ] })
  ] });
}
function QueueTable({
  list,
  residents
}) {
  if (list.length === 0) return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-6 text-center text-sm text-muted-foreground", children: "Nothing here. 🎉" }) });
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
    /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Resident" }),
      /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Assessment" }),
      /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Last Score" }),
      /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Risk" }),
      /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Due" }),
      /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Status" }),
      /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "Action" })
    ] }) }),
    /* @__PURE__ */ jsx("tbody", { className: "divide-y", children: list.map(({
      a,
      ds
    }) => {
      const r = residents.find((x) => x.id === a.residentId);
      return /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsxs("td", { className: "p-3", children: [
          /* @__PURE__ */ jsxs(Link, { to: "/residents/$id/assessments", params: {
            id: a.residentId
          }, className: "font-medium hover:text-primary", children: [
            r?.firstName,
            " ",
            r?.lastName
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            "Room ",
            r?.roomNumber
          ] })
        ] }),
        /* @__PURE__ */ jsx("td", { className: "p-3", children: assessmentMeta[a.type].name }),
        /* @__PURE__ */ jsx("td", { className: "p-3 tabular-nums font-semibold", children: a.totalScore }),
        /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `text-[10px] ${riskBadgeCls(a.riskLevel)}`, children: a.interpretation }) }),
        /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: a.nextReassessmentDate }),
        /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `text-[10px] capitalize ${statusBadgeCls(ds)}`, children: ds }) }),
        /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsx(Link, { to: "/assessments/new/$residentId", params: {
          residentId: a.residentId
        }, search: {
          type: a.type
        }, children: /* @__PURE__ */ jsxs(Button, { size: "sm", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "h-3 w-3 mr-1" }),
          " Reassess"
        ] }) }) })
      ] }, a.id);
    }) })
  ] }) }) });
}
function Stat({
  icon: Icon,
  label,
  value,
  tone = "default"
}) {
  const tones = {
    default: "border-border",
    warning: "border-warning/40 bg-warning/5",
    destructive: "border-destructive/40 bg-destructive/5"
  };
  return /* @__PURE__ */ jsx(Card, { className: tones[tone], children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [
    /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5 text-muted-foreground" }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums", children: value }),
      /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: label })
    ] })
  ] }) });
}
export {
  ReassessmentQueue as component
};
