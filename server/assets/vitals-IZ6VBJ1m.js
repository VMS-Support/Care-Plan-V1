import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import * as React from "react";
import { useState, useMemo } from "react";
import { c as cn, u as useCare, a as can, C as Card, b as CardHeader, d as CardTitle, e as CardContent, B as Badge, f as Button, g as calcNEWS2, h as complianceForResident, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem, I as Input } from "./router-DLzRbDkQ.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BZBuOn5G.js";
import { L as Label } from "./label-6k_A62K1.js";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, AlertTriangle, X, MessageSquarePlus, HeartPulse, History, Activity, Scale, ListChecks } from "lucide-react";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-Dtfzkh6H.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { i as isActionableClinicalAlert } from "./alerts-DlzPJRcw.js";
import { i as inferVitalRecordType, a as isAbnormalVital, V as VITAL_TYPE_LABELS, f as formatVitalValues } from "./vital-records-utXoyB6O.js";
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
import "@radix-ui/react-label";
import "@radix-ui/react-dialog";
const Checkbox = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  CheckboxPrimitive.Root,
  {
    ref,
    className: cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(CheckboxPrimitive.Indicator, { className: cn("grid place-content-center text-current"), children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) })
  }
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
function severityCls(s) {
  if (s === "critical") return "border-destructive/40 text-destructive bg-destructive/5";
  if (s === "warning") return "border-warning/40 text-warning-foreground bg-warning/5";
  return "border-info/40 text-info bg-info/5";
}
function EscalationDialog({ alertId }) {
  const { addClinicalEscalationNote } = useCare();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "ghost", className: "h-7 text-xs", children: [
      /* @__PURE__ */ jsx(MessageSquarePlus, { className: "h-3 w-3 mr-1" }),
      " Add escalation note"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Action taken" }) }),
      /* @__PURE__ */ jsx(Label, { children: "What action was taken?" }),
      /* @__PURE__ */ jsx(Textarea, { value: text, onChange: (e) => setText(e.target.value), placeholder: "e.g. GP contacted; advised PRN paracetamol and review in 4 hours." }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { disabled: !text.trim(), onClick: () => {
          addClinicalEscalationNote(alertId, text.trim());
          setText("");
          setOpen(false);
        }, children: "Save" })
      ] })
    ] })
  ] });
}
function ClinicalAlertList({ residentId, alerts: alertsOverride }) {
  const { clinicalAlerts, acknowledgeClinicalAlert, dismissClinicalAlert, currentRole } = useCare();
  const all = alertsOverride ?? clinicalAlerts;
  const items = all.filter(
    (a) => isActionableClinicalAlert(a) && !a.dismissedAt && (!residentId || a.residentId === residentId)
  );
  const canEscalate = can(currentRole, "vital.escalate");
  if (items.length === 0) {
    return /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-success" }),
        " Active Clinical Alerts"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "No active alerts." }) })
    ] });
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-warning" }),
      " Active Clinical Alerts (",
      items.length,
      ")"
    ] }) }),
    /* @__PURE__ */ jsx(CardContent, { className: "space-y-2", children: items.map((a) => /* @__PURE__ */ jsxs("div", { className: `rounded-md border p-3 ${severityCls(a.severity)}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm", children: a.title }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] capitalize", children: a.severity }),
            a.acknowledged && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: "Acknowledged" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs mt-1 text-foreground/80", children: a.message }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs mt-1", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Recommendation:" }),
            " ",
            a.recommendation
          ] }),
          a.escalations.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-2 space-y-1 border-t border-foreground/10 pt-2", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground", children: "Escalation notes" }),
            a.escalations.map((e) => /* @__PURE__ */ jsxs("div", { className: "text-xs", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: e.actionTaken }),
              /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                " — ",
                e.enteredByName,
                " · ",
                new Date(e.at).toLocaleString()
              ] })
            ] }, e.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 shrink-0", children: [
          !a.acknowledged && /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "h-7 text-xs", onClick: () => acknowledgeClinicalAlert(a.id), children: [
            /* @__PURE__ */ jsx(Check, { className: "h-3 w-3 mr-1" }),
            " Ack"
          ] }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "ghost", className: "h-7 text-xs", onClick: () => dismissClinicalAlert(a.id), children: [
            /* @__PURE__ */ jsx(X, { className: "h-3 w-3 mr-1" }),
            " Dismiss"
          ] })
        ] })
      ] }),
      canEscalate && /* @__PURE__ */ jsx("div", { className: "mt-1", children: /* @__PURE__ */ jsx(EscalationDialog, { alertId: a.id }) })
    ] }, a.id)) })
  ] });
}
function Stat({
  icon: Icon,
  label,
  value,
  tone,
  sub
}) {
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx(Icon, { className: `h-4 w-4 ${tone || "text-muted-foreground"}` })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 text-2xl font-semibold tabular-nums", children: value }),
    sub && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: sub })
  ] }) });
}
function Filter({
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
    /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: label }),
    children
  ] });
}
function VitalsDashboard() {
  const {
    vitals,
    residents,
    clinicalAlerts,
    observationPlans,
    currentRole,
    wings
  } = useCare();
  const [typeFilter, setTypeFilter] = useState("all");
  const [residentFilter, setResidentFilter] = useState("all");
  const [wingFilter, setWingFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [abnormalOnly, setAbnormalOnly] = useState(false);
  const [recordedByFilter, setRecordedByFilter] = useState("all");
  if (currentRole !== "cnm" && currentRole !== "don") {
    return /* @__PURE__ */ jsx("div", { className: "p-4 md:p-8 max-w-3xl", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold", children: "Vitals Governance" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Facility-wide vitals reporting is available to CNM and DON roles. Record and review resident observations from the Resident Profile." })
    ] }) }) });
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const activeVitals = vitals.filter((v) => !v.deletedAt);
  const todayCount = activeVitals.filter((v) => v.date === today).length;
  const activeAlerts = clinicalAlerts.filter((a) => isActionableClinicalAlert(a) && !a.dismissedAt && !a.resolvedAt);
  const latestPerResident = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const v of activeVitals) {
      const cur = m.get(v.residentId);
      if (!cur || v.recordedAt > cur.recordedAt) m.set(v.residentId, v);
    }
    return m;
  }, [activeVitals]);
  const latestNewsPerResident = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const vital of activeVitals) {
      if (!calcNEWS2(vital).complete) continue;
      const current = map.get(vital.residentId);
      if (!current || vital.recordedAt > current.recordedAt) map.set(vital.residentId, vital);
    }
    return map;
  }, [activeVitals]);
  const highNews2 = [...latestNewsPerResident.values()].filter((v) => calcNEWS2(v).total >= 5).length;
  const weightAlerts = activeAlerts.filter((a) => a.type === "weight_loss" || a.type === "weight_gain").length;
  const compliance = useMemo(() => {
    let totalPct = 0, missed = 0, dueToday = 0, overdue = 0, residentsCounted = 0;
    for (const r of residents) {
      const plan = observationPlans.find((p) => p.residentId === r.id);
      if (!plan) continue;
      const rv = activeVitals.filter((v) => v.residentId === r.id);
      const c = complianceForResident(plan, rv);
      totalPct += c.compliancePct;
      missed += c.missedCount;
      dueToday += c.dueTodayCount;
      overdue += c.overdueCount;
      residentsCounted++;
    }
    return {
      compliancePct: residentsCounted === 0 ? 100 : Math.round(totalPct / residentsCounted),
      missed,
      dueToday,
      overdue
    };
  }, [residents, observationPlans, activeVitals]);
  const recent = activeVitals.filter((v) => {
    const r = residents.find((x) => x.id === v.residentId);
    if (!r) return false;
    if (typeFilter !== "all" && inferVitalRecordType(v) !== typeFilter) return false;
    if (residentFilter !== "all" && v.residentId !== residentFilter) return false;
    if (wingFilter !== "all" && r.wingId !== wingFilter) return false;
    if (dateFrom && v.date < dateFrom) return false;
    if (dateTo && v.date > dateTo) return false;
    if (abnormalOnly && !isAbnormalVital(v)) return false;
    if (recordedByFilter !== "all" && v.recordedByName !== recordedByFilter) return false;
    return true;
  }).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)).slice(0, 100);
  const residentsMissing = residents.filter((r) => !latestPerResident.has(r.id) || Date.now() - new Date(latestPerResident.get(r.id).recordedAt).getTime() > 24 * 36e5);
  const recordedByOptions = [...new Set(activeVitals.map((v) => v.recordedByName))].sort();
  const wingOptions = wings.filter((wing) => residents.some((resident) => resident.wingId === wing.id));
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-7xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-semibold tracking-tight flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(HeartPulse, { className: "h-6 w-6 text-primary" }),
          " Vital Signs & Clinical Observations"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Alerts are informational only — clinical decisions remain with nursing staff." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: can(currentRole, "vital.audit") && /* @__PURE__ */ jsx(Link, { to: "/vitals/audit", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", children: [
        /* @__PURE__ */ jsx(History, { className: "h-4 w-4 mr-1" }),
        " Audit Report"
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2", children: [
      /* @__PURE__ */ jsx(Stat, { icon: Activity, label: "Observations Today", value: todayCount, tone: "text-primary" }),
      /* @__PURE__ */ jsx(Stat, { icon: AlertTriangle, label: "Abnormal Observations", value: activeAlerts.length, tone: activeAlerts.length > 0 ? "text-warning" : "" }),
      /* @__PURE__ */ jsx(Stat, { icon: HeartPulse, label: "High NEWS2", value: highNews2, tone: highNews2 > 0 ? "text-destructive" : "" }),
      /* @__PURE__ */ jsx(Stat, { icon: Scale, label: "Weight Alerts", value: weightAlerts, tone: weightAlerts > 0 ? "text-warning" : "" }),
      /* @__PURE__ */ jsx(Stat, { icon: AlertTriangle, label: "Missing Observations", value: residentsMissing.length, tone: residentsMissing.length > 0 ? "text-warning" : "" }),
      /* @__PURE__ */ jsx(Stat, { icon: ListChecks, label: "Observation Compliance %", value: `${compliance.compliancePct}%`, tone: compliance.compliancePct < 80 ? "text-warning" : "text-success" })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "recent", children: [
      /* @__PURE__ */ jsxs(TabsList, { children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "recent", children: "Recent Observations" }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "alerts", children: [
          "Active Alerts (",
          activeAlerts.length,
          ")"
        ] }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "compliance", children: "Compliance" }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "missing", children: [
          "Missing Observations (",
          residentsMissing.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "high_news2", children: [
          "High NEWS2 (",
          highNews2,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "recent", className: "space-y-3", children: [
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-3", children: [
          /* @__PURE__ */ jsx(Filter, { label: "Observation Type", children: /* @__PURE__ */ jsxs(Select, { value: typeFilter, onValueChange: setTypeFilter, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All types" }),
              Object.keys(VITAL_TYPE_LABELS).map((type) => /* @__PURE__ */ jsx(SelectItem, { value: type, children: VITAL_TYPE_LABELS[type] }, type))
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(Filter, { label: "Resident", children: /* @__PURE__ */ jsxs(Select, { value: residentFilter, onValueChange: setResidentFilter, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All residents" }),
              residents.map((r) => /* @__PURE__ */ jsxs(SelectItem, { value: r.id, children: [
                r.firstName,
                " ",
                r.lastName
              ] }, r.id))
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(Filter, { label: "Wing", children: /* @__PURE__ */ jsxs(Select, { value: wingFilter, onValueChange: setWingFilter, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All wings" }),
              wingOptions.map((wing) => /* @__PURE__ */ jsx(SelectItem, { value: wing.id, children: wing.name }, wing.id))
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(Filter, { label: "Recorded By", children: /* @__PURE__ */ jsxs(Select, { value: recordedByFilter, onValueChange: setRecordedByFilter, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All staff" }),
              recordedByOptions.map((name) => /* @__PURE__ */ jsx(SelectItem, { value: name, children: name }, name))
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(Filter, { label: "From", children: /* @__PURE__ */ jsx(Input, { type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value) }) }),
          /* @__PURE__ */ jsx(Filter, { label: "To", children: /* @__PURE__ */ jsx(Input, { type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value) }) }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 self-end h-9 text-sm", children: [
            /* @__PURE__ */ jsx(Checkbox, { checked: abnormalOnly, onCheckedChange: (value) => setAbnormalOnly(value === true) }),
            " ",
            "Abnormal only"
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-0 overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Resident" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Date / Time" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Observation Type" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Recorded Values" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "NEWS2" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Recorded By" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y", children: recent.map((v) => {
            const r = residents.find((x) => x.id === v.residentId);
            const n = calcNEWS2(v);
            return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30", children: [
              /* @__PURE__ */ jsxs("td", { className: "p-2", children: [
                /* @__PURE__ */ jsx(Link, { to: "/residents/$id", params: {
                  id: v.residentId
                }, className: "text-primary hover:underline", children: r ? `${r.firstName} ${r.lastName}` : v.residentId }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: r?.roomNumber })
              ] }),
              /* @__PURE__ */ jsxs("td", { className: "p-2 text-xs", children: [
                v.date,
                " ",
                v.time
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", children: VITAL_TYPE_LABELS[inferVitalRecordType(v)] }) }),
              /* @__PURE__ */ jsx("td", { className: "p-2 text-xs font-medium", children: formatVitalValues(v, activeVitals, r) }),
              /* @__PURE__ */ jsx("td", { className: "p-2", children: n.complete ? /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: `text-[10px] capitalize ${n.risk === "high" ? "border-destructive/40 text-destructive" : n.risk === "medium" ? "border-warning/40" : ""}`, children: [
                n.total,
                " · ",
                n.risk
              ] }) : "—" }),
              /* @__PURE__ */ jsx("td", { className: "p-2 text-xs text-muted-foreground", children: v.recordedByName }),
              /* @__PURE__ */ jsx("td", { className: "p-2 text-right", children: /* @__PURE__ */ jsx(Button, { asChild: true, size: "sm", variant: "ghost", children: /* @__PURE__ */ jsx(Link, { to: "/residents/$id", params: {
                id: v.residentId
              }, children: "Open" }) }) })
            ] }, v.id);
          }) })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "alerts", children: /* @__PURE__ */ jsx(ClinicalAlertList, {}) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "compliance", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-0 overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Resident" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Compliance" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Due Today" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Overdue" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Missed" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y", children: residents.map((r) => {
          const plan = observationPlans.find((p) => p.residentId === r.id);
          const c = complianceForResident(plan, activeVitals.filter((v) => v.residentId === r.id));
          return /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
              id: r.id
            }, className: "text-primary hover:underline", children: [
              r.firstName,
              " ",
              r.lastName
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: c.compliancePct < 80 ? "border-warning/40 text-warning-foreground" : "border-success/40 text-success", children: [
              c.compliancePct,
              "%"
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "p-2 tabular-nums", children: c.dueTodayCount }),
            /* @__PURE__ */ jsx("td", { className: "p-2 tabular-nums", children: c.overdueCount }),
            /* @__PURE__ */ jsx("td", { className: "p-2 tabular-nums", children: c.missedCount })
          ] }, r.id);
        }) })
      ] }) }) }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "missing", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-4 space-y-2", children: residentsMissing.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "All residents have observations within 24 hours." }) : residentsMissing.map((r) => {
        const last = latestPerResident.get(r.id);
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b pb-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
              id: r.id
            }, className: "text-primary hover:underline text-sm font-medium", children: [
              r.firstName,
              " ",
              r.lastName
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
              "Room ",
              r.roomNumber,
              " · Last:",
              " ",
              last ? new Date(last.recordedAt).toLocaleString() : "Never"
            ] })
          ] }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "border-warning/40 text-warning-foreground", children: "No obs in 24h" })
        ] }, r.id);
      }) }) }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "high_news2", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-4 space-y-2", children: [...latestNewsPerResident.entries()].map(([rid, v]) => ({
        rid,
        v,
        n: calcNEWS2(v)
      })).filter((x) => x.n.complete && x.n.total >= 5).sort((a, b) => b.n.total - a.n.total).map(({
        rid,
        v,
        n
      }) => {
        const r = residents.find((x) => x.id === rid);
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b pb-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Link, { to: "/residents/$id", params: {
              id: rid
            }, className: "text-primary hover:underline text-sm font-medium", children: r ? `${r.firstName} ${r.lastName}` : rid }),
            /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
              "Recorded ",
              new Date(v.recordedAt).toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: `text-[10px] capitalize ${n.risk === "high" ? "border-destructive/40 text-destructive" : "border-warning/40 text-warning-foreground"}`, children: [
            "NEWS2 ",
            n.total,
            " · ",
            n.risk
          ] })
        ] }, rid);
      }) }) }) })
    ] })
  ] });
}
export {
  VitalsDashboard as component
};
