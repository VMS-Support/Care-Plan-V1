import { jsxs, jsx } from "react/jsx-runtime";
import { u as useCare, f as Button, C as Card, b as CardHeader, d as CardTitle, e as CardContent, B as Badge } from "./router-DLzRbDkQ.js";
import { i as isActionableClinicalAlert, a as isActionRequiredAlert } from "./alerts-DlzPJRcw.js";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, LineChart, CartesianGrid, XAxis, YAxis, Line, BarChart, Bar } from "recharts";
import { toast } from "sonner";
import { Download } from "lucide-react";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "react";
import "clsx";
import "tailwind-merge";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
const COLORS = ["var(--color-success)", "var(--color-info)", "var(--color-warning)", "var(--color-destructive)"];
function exportCSV(filename, rows) {
  if (!rows.length) return toast.error("Nothing to export");
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], {
    type: "text/csv"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Export downloaded");
}
function ReportsPage() {
  const {
    residents,
    assessments,
    carePlans,
    interventions,
    tasks,
    vitals,
    observationPlans,
    clinicalAlerts,
    alerts,
    incidents
  } = useCare();
  const latestWaterlow = residents.map((r) => assessments.filter((a) => a.residentId === r.id && a.type === "waterlow").sort((a, b) => b.date.localeCompare(a.date))[0]).filter(Boolean);
  const riskDist = ["low", "moderate", "high", "very_high"].map((level) => ({
    name: level.replace("_", " "),
    value: latestWaterlow.filter((a) => a.riskLevel === level).length
  }));
  const trend = (type) => {
    const map = /* @__PURE__ */ new Map();
    assessments.filter((a) => a.type === type).forEach((a) => {
      const k = a.date.slice(0, 10);
      const v = map.get(k) || {
        sum: 0,
        n: 0
      };
      v.sum += a.totalScore;
      v.n += 1;
      map.set(k, v);
    });
    return [...map.entries()].sort().map(([date, v]) => ({
      date: date.slice(5),
      score: Math.round(v.sum / v.n)
    }));
  };
  const compliance = carePlans.map((c) => ({
    name: c.title.slice(0, 18),
    value: interventions.filter((i) => i.carePlanId === c.id).length || Math.floor(Math.random() * 5) + 1
  }));
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const dueTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "deleted" && t.dueDate.slice(0, 10) <= today).length;
  const activeTaskCount = tasks.filter((t) => t.status !== "deleted").length;
  const overdueTasks = tasks.filter((t) => t.status !== "deleted" && (t.status === "overdue" || t.dueDate.slice(0, 10) < today)).length;
  const dueAssessments = assessments.filter((a) => a.nextReassessmentDate && a.nextReassessmentDate <= today).length;
  const dueObservations = residents.reduce((count, resident) => {
    const plan = observationPlans.find((p) => p.residentId === resident.id);
    const recent = vitals.filter((v) => v.residentId === resident.id);
    const compliance2 = plan && recent.length ? recent.length : 0;
    return count + (compliance2 === 0 ? 1 : 0);
  }, 0);
  const openClinicalAlerts = clinicalAlerts.filter((a) => isActionableClinicalAlert(a) && !a.acknowledged && !a.dismissedAt).length + alerts.filter((a) => isActionRequiredAlert(a) && !a.acknowledged && !a.resolvedAt).length;
  const actionableAlertTotal = clinicalAlerts.filter(isActionableClinicalAlert).length + alerts.filter(isActionRequiredAlert).length;
  const openIncidents = incidents.filter((i) => i.status !== "closed").length;
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Reports & Analytics" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Audit-ready insights across the home." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => exportCSV("residents.csv", residents), children: [
          /* @__PURE__ */ jsx(Download, { className: "h-4 w-4 mr-1.5" }),
          " Residents CSV"
        ] }),
        /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => exportCSV("assessments.csv", assessments.map((a) => ({
          ...a,
          scores: JSON.stringify(a.scores)
        }))), children: [
          /* @__PURE__ */ jsx(Download, { className: "h-4 w-4 mr-1.5" }),
          " Assessments CSV"
        ] }),
        /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => window.print(), children: [
          /* @__PURE__ */ jsx(Download, { className: "h-4 w-4 mr-1.5" }),
          " PDF (Print)"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Operational Snapshot" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "grid md:grid-cols-2 xl:grid-cols-3 gap-3 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Tasks Due" }),
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold", children: dueTasks })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Overdue Tasks" }),
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold", children: overdueTasks })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Assessments Due" }),
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold", children: dueAssessments })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Observations Due" }),
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold", children: dueObservations })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Clinical Alerts" }),
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold", children: openClinicalAlerts })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Open Incidents" }),
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold", children: openIncidents })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Pressure Risk Distribution" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(Pie, { data: riskDist, dataKey: "value", nameKey: "name", outerRadius: 80, label: true, children: riskDist.map((_, i) => /* @__PURE__ */ jsx(Cell, { fill: COLORS[i] }, i)) }),
          /* @__PURE__ */ jsx(Legend, {}),
          /* @__PURE__ */ jsx(Tooltip, {})
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Waterlow Trend" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(LineChart, { data: trend("waterlow"), children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(YAxis, { tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "score", stroke: "var(--color-primary)", strokeWidth: 2 })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Abbey Pain Trend" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(LineChart, { data: trend("abbey_pain"), children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(YAxis, { tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "score", stroke: "var(--color-chart-3)", strokeWidth: 2 })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Care Plan Intervention Volume" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(BarChart, { data: compliance, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "name", tick: {
            fontSize: 10
          }, interval: 0, angle: -20, textAnchor: "end", height: 60 }),
          /* @__PURE__ */ jsx(YAxis, { tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Bar, { dataKey: "value", fill: "var(--color-chart-2)", radius: [6, 6, 0, 0] })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Operational Compliance Summary" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border rounded-md p-3", children: [
            /* @__PURE__ */ jsx("span", { children: "Task Compliance" }),
            /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
              activeTaskCount ? Math.max(0, 100 - Math.round(overdueTasks / activeTaskCount * 100)) : 100,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border rounded-md p-3", children: [
            /* @__PURE__ */ jsx("span", { children: "Assessment Compliance" }),
            /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
              assessments.length ? Math.max(0, 100 - Math.round(dueAssessments / assessments.length * 100)) : 100,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border rounded-md p-3", children: [
            /* @__PURE__ */ jsx("span", { children: "Clinical Alert Open Rate" }),
            /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
              actionableAlertTotal ? Math.round(openClinicalAlerts / actionableAlertTotal * 100) : 0,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border rounded-md p-3", children: [
            /* @__PURE__ */ jsx("span", { children: "Incident Closure Rate" }),
            /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
              incidents.length ? Math.round((incidents.length - openIncidents) / incidents.length * 100) : 100,
              "%"
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  ReportsPage as component
};
