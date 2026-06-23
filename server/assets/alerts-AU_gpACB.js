import { jsxs, jsx } from "react/jsx-runtime";
import { u as useCare, C as Card, e as CardContent, B as Badge, f as Button, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem } from "./router-DLzRbDkQ.js";
import { Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { TriangleAlert, HeartPulse, Scale, Activity, CheckCircle2 } from "lucide-react";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-Dtfzkh6H.js";
import { L as Label } from "./label-6k_A62K1.js";
import { T as Tabs, a as TabsList, b as TabsTrigger } from "./tabs-BZBuOn5G.js";
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
import "@radix-ui/react-tabs";
const CLINICAL_TYPES = /* @__PURE__ */ new Set([
  "weight_loss",
  "weight_gain",
  "high_news2",
  "abnormal_bp",
  "abnormal_temp",
  "low_spo2",
  "high_pain",
  "hypoglycaemia",
  "hyperglycaemia",
  "fluid_imbalance"
]);
const WEIGHT_TYPES = /* @__PURE__ */ new Set(["weight_loss", "weight_gain"]);
const DISMISS_REASONS = ["Resolved", "Reviewed", "Expected Change", "Entered In Error", "Other"];
function scopeLabel(role) {
  if (role === "don") return "Facility-wide clinical changes";
  if (role === "cnm") return "Wing-level clinical changes";
  return "Clinical changes for residents assigned to you";
}
function isResolved(alert) {
  return !!alert.resolvedAt || alert.dismissedReason === "Resolved";
}
function alertGroup(alert) {
  if (WEIGHT_TYPES.has(alert.type)) return "weight";
  if (alert.type === "high_pain") return "pain";
  return "vitals";
}
function ClinicalChangesQueue() {
  const { clinicalAlerts, residents, vitals, currentRole, currentUser, dismissClinicalAlert } = useCare();
  const [focus, setFocus] = useState("all");
  const [queueState, setQueueState] = useState("open");
  const [dismissTarget, setDismissTarget] = useState(null);
  const [dismissReason, setDismissReason] = useState("Reviewed");
  const residentMap = useMemo(() => new Map(residents.map((resident) => [resident.id, resident])), [residents]);
  const vitalMap = useMemo(() => new Map(vitals.map((vital) => [vital.id, vital])), [vitals]);
  const scopedResidents = useMemo(() => {
    if (currentRole === "don") return new Set(residents.map((resident) => resident.id));
    if (currentRole === "nurse") {
      const assigned = residents.filter((resident) => resident.keyWorkers?.namedNurse?.includes(currentUser.name));
      if (assigned.length > 0) return new Set(assigned.map((resident) => resident.id));
    }
    if (currentUser.assignedWings.length === 0) return new Set(residents.map((resident) => resident.id));
    return new Set(residents.filter((resident) => currentUser.assignedWings.includes(resident.wingId || "")).map((resident) => resident.id));
  }, [currentRole, currentUser.assignedWings, residents]);
  const alerts = useMemo(
    () => clinicalAlerts.filter((alert) => CLINICAL_TYPES.has(alert.type) && scopedResidents.has(alert.residentId)).sort((a, b) => Number(b.severity === "critical") - Number(a.severity === "critical") || b.createdAt.localeCompare(a.createdAt)),
    [clinicalAlerts, scopedResidents]
  );
  const counts = {
    open: alerts.filter((alert) => !alert.dismissedAt && !isResolved(alert)).length,
    critical: alerts.filter((alert) => alert.severity === "critical" && !alert.dismissedAt && !isResolved(alert)).length,
    weight: alerts.filter((alert) => WEIGHT_TYPES.has(alert.type) && !alert.dismissedAt && !isResolved(alert)).length,
    observations: alerts.filter((alert) => !WEIGHT_TYPES.has(alert.type) && alert.type !== "high_pain" && !alert.dismissedAt && !isResolved(alert)).length,
    resolved: alerts.filter(isResolved).length
  };
  const filtered = alerts.filter((alert) => {
    const resolved = isResolved(alert);
    if (focus !== "all" && focus !== "resolved" && alertGroup(alert) !== focus) return false;
    if (focus === "resolved" && !resolved) return false;
    if (queueState === "open" && (alert.dismissedAt || resolved)) return false;
    if (queueState === "dismissed" && (!alert.dismissedAt || resolved)) return false;
    if (queueState === "resolved" && !resolved) return false;
    return true;
  });
  const selectSummary = (nextFocus, nextState = "open") => {
    setFocus(nextFocus);
    setQueueState(nextState);
  };
  const submitDismissal = () => {
    if (!dismissTarget) return;
    dismissClinicalAlert(dismissTarget.id, dismissReason);
    setDismissTarget(null);
    setDismissReason("Reviewed");
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-7xl", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold", children: "Alerts" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium mt-1", children: "Clinical Changes Requiring Review" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: scopeLabel(currentRole) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-5 gap-3", children: [
      /* @__PURE__ */ jsx(SummaryCard, { label: "Open Alerts", value: counts.open, icon: TriangleAlert, onClick: () => selectSummary("all") }),
      /* @__PURE__ */ jsx(SummaryCard, { label: "Critical", value: counts.critical, icon: HeartPulse, onClick: () => selectSummary("all"), critical: true }),
      /* @__PURE__ */ jsx(SummaryCard, { label: "Weight Changes", value: counts.weight, icon: Scale, onClick: () => selectSummary("weight") }),
      /* @__PURE__ */ jsx(SummaryCard, { label: "Abnormal Observations", value: counts.observations, icon: Activity, onClick: () => selectSummary("vitals") }),
      /* @__PURE__ */ jsx(SummaryCard, { label: "Resolved", value: counts.resolved, icon: CheckCircle2, onClick: () => selectSummary("resolved", "resolved") })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx(Tabs, { value: focus, onValueChange: (value) => {
        const next = value;
        setFocus(next);
        if (next === "resolved") setQueueState("resolved");
      }, children: /* @__PURE__ */ jsxs(TabsList, { className: "h-auto flex flex-wrap", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "all", children: "All" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "vitals", children: "Vitals" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "weight", children: "Weight" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "pain", children: "Pain" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "resolved", children: "Resolved" })
      ] }) }),
      /* @__PURE__ */ jsx(Tabs, { value: queueState, onValueChange: (value) => setQueueState(value), children: /* @__PURE__ */ jsxs(TabsList, { children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "open", children: "Open" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "dismissed", children: "Dismissed" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "resolved", children: "Resolved" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "all", children: "All" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      filtered.map((alert) => {
        const resident = residentMap.get(alert.residentId);
        const sourceVital = alert.sourceVitalId ? vitalMap.get(alert.sourceVitalId) : void 0;
        const resolved = isResolved(alert);
        return /* @__PURE__ */ jsx(Card, { className: alert.severity === "critical" ? "border-destructive/50" : "border-warning/40", children: /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsx(Badge, { variant: "outline", children: alertGroup(alert) === "vitals" ? "Vitals" : alertGroup(alert) === "weight" ? "Weight" : "Pain" }),
              /* @__PURE__ */ jsx(Badge, { variant: alert.severity === "critical" ? "destructive" : "outline", className: "capitalize", children: alert.severity }),
              resolved && /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: "Resolved" }),
              !resolved && alert.dismissedAt && /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: "Dismissed" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: alert.title }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: resident ? `${resident.firstName} ${resident.lastName} · Room ${resident.roomNumber}` : "Resident" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-3 text-sm", children: [
              /* @__PURE__ */ jsx(Value, { label: "Current Value", value: alert.currentValue || alert.message, strong: true }),
              /* @__PURE__ */ jsx(Value, { label: "Previous Value", value: alert.previousValue || "Not available" }),
              /* @__PURE__ */ jsx(Value, { label: "Date", value: new Date(sourceVital?.recordedAt || alert.updatedAt || alert.createdAt).toLocaleString() }),
              /* @__PURE__ */ jsx(Value, { label: "Severity", value: alert.severity, capitalize: true })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border-l-2 border-primary pl-3", children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Recommended Action" }),
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium mt-0.5", children: alert.recommendation })
            ] }),
            alert.dismissedAt && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
              resolved ? "Resolved" : "Dismissed",
              " by ",
              alert.dismissedBy || alert.resolvedBy || "Staff",
              " on ",
              new Date(alert.dismissedAt).toLocaleString(),
              " · ",
              alert.dismissedReason || "Reviewed"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap lg:flex-col gap-2 lg:w-44", children: [
            /* @__PURE__ */ jsx(Button, { asChild: true, size: "sm", variant: "outline", children: /* @__PURE__ */ jsx(Link, { to: "/residents/$id", params: { id: alert.residentId }, children: "Open Resident" }) }),
            /* @__PURE__ */ jsx(Button, { asChild: true, size: "sm", children: /* @__PURE__ */ jsx(Link, { to: "/residents/$id/vitals", params: { id: alert.residentId }, children: "Record Observation" }) }),
            !alert.dismissedAt && !resolved && /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => setDismissTarget(alert), children: "Dismiss" })
          ] })
        ] }) }) }, alert.id);
      }),
      filtered.length === 0 && /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-10 text-center", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "h-9 w-9 mx-auto text-success mb-3" }),
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: "No active clinical changes requiring review." }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Everything appears clinically stable." })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: !!dismissTarget, onOpenChange: (open) => !open && setDismissTarget(null), children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Dismiss Alert" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "This removes the alert from the active queue and retains the full clinical history." }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { children: "Reason" }),
        /* @__PURE__ */ jsxs(Select, { value: dismissReason, onValueChange: (value) => setDismissReason(value), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: DISMISS_REASONS.map((reason) => /* @__PURE__ */ jsx(SelectItem, { value: reason, children: reason }, reason)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setDismissTarget(null), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: submitDismissal, children: "Dismiss" })
      ] })
    ] }) })
  ] });
}
function SummaryCard({ label, value, icon: Icon, onClick, critical }) {
  return /* @__PURE__ */ jsx("button", { type: "button", onClick, className: "text-left", children: /* @__PURE__ */ jsx(Card, { className: "hover:bg-accent/40 transition-colors h-full", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between gap-3", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums mt-1", children: value })
    ] }),
    /* @__PURE__ */ jsx(Icon, { className: `h-5 w-5 ${critical ? "text-destructive" : "text-muted-foreground"}` })
  ] }) }) });
}
function Value({ label, value, strong, capitalize }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: `${strong ? "font-semibold" : "font-medium"} mt-0.5 ${capitalize ? "capitalize" : ""}`, children: value })
  ] });
}
const SplitComponent = ClinicalChangesQueue;
export {
  SplitComponent as component
};
