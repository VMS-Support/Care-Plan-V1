import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { u as useCare, f as Button, C as Card, b as CardHeader, d as CardTitle, B as Badge, e as CardContent, A as Avatar, m as AvatarFallback } from "./router-DLzRbDkQ.js";
import { a as isActionRequiredAlert } from "./alerts-DlzPJRcw.js";
import { Plus, Stethoscope, ClipboardList, NotebookPen, Users, AlertTriangle, Activity, TrendingUp, ArrowRight } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import "@tanstack/react-query";
import "react";
import "clsx";
import "tailwind-merge";
import "sonner";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
function Stat({
  icon: Icon,
  label,
  value,
  tone = "default",
  hint
}) {
  const tones = {
    default: "bg-secondary text-secondary-foreground",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info"
  };
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground font-medium uppercase tracking-wide", children: label }),
      /* @__PURE__ */ jsx("div", { className: "text-3xl font-semibold mt-2 tabular-nums", children: value }),
      hint && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: hint })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `h-10 w-10 rounded-lg flex items-center justify-center ${tones[tone]}`, children: /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5" }) })
  ] }) }) });
}
function Dashboard() {
  const {
    residents,
    assessments,
    carePlans,
    alerts,
    notes,
    tasks
  } = useCare();
  const active = residents.filter((r) => r.status === "active");
  const highRisk = residents.filter((r) => assessments.some((a) => a.residentId === r.id && (a.riskLevel === "high" || a.riskLevel === "very_high")));
  const openAlerts = alerts.filter((a) => isActionRequiredAlert(a) && !a.acknowledged && !a.resolvedAt);
  const today = /* @__PURE__ */ new Date();
  const dueReviews = carePlans.filter((c) => c.status === "active" && new Date(c.reviewDate) <= new Date(today.getTime() + 7 * 864e5));
  const todayKey = today.toISOString().slice(0, 10);
  const tasksOverdue = tasks.filter((t) => t.status !== "completed" && t.status !== "deleted" && t.dueDate.slice(0, 10) < todayKey).length;
  const tasksDueToday = tasks.filter((t) => t.status !== "completed" && t.status !== "deleted" && t.dueDate.slice(0, 10) === todayKey).length;
  const waterlowSorted = [...assessments].filter((a) => a.type === "waterlow").sort((a, b) => a.date.localeCompare(b.date));
  const trendData = waterlowSorted.map((a, i) => ({
    idx: i + 1,
    score: a.totalScore,
    date: a.date.slice(5, 10)
  }));
  const recentNotes = notes.slice(0, 5);
  const recentAlerts = openAlerts.slice(0, 5);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl md:text-3xl font-semibold tracking-tight", children: "Good day, Nurse Roberts" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm mt-1", children: "Overview of resident wellbeing across the home." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx(Link, { to: "/residents", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1.5" }),
          " New Resident"
        ] }) }),
        /* @__PURE__ */ jsx(Link, { to: "/assessments", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", children: [
          /* @__PURE__ */ jsx(Stethoscope, { className: "h-4 w-4 mr-1.5" }),
          " New Assessment"
        ] }) }),
        /* @__PURE__ */ jsx(Link, { to: "/care-plans", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", children: [
          /* @__PURE__ */ jsx(ClipboardList, { className: "h-4 w-4 mr-1.5" }),
          " New Care Plan"
        ] }) }),
        /* @__PURE__ */ jsx(Link, { to: "/daily-notes", children: /* @__PURE__ */ jsxs(Button, { size: "sm", children: [
          /* @__PURE__ */ jsx(NotebookPen, { className: "h-4 w-4 mr-1.5" }),
          " Daily Note"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(Stat, { icon: Users, label: "Current Residents", value: active.length, hint: `${residents.length} total` }),
      /* @__PURE__ */ jsx(Stat, { icon: AlertTriangle, label: "High Risk Residents", value: highRisk.length, tone: "warning" }),
      /* @__PURE__ */ jsx(Stat, { icon: ClipboardList, label: "Reviews Due (7d)", value: dueReviews.length, tone: "info" }),
      /* @__PURE__ */ jsx(Stat, { icon: Activity, label: "Open Alerts", value: openAlerts.length, tone: "destructive", hint: `${openAlerts.filter((a) => a.priority === "critical").length} critical` })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxs(Card, { className: "lg:col-span-2", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Waterlow Risk Trend" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Pressure ulcer risk across recent assessments" })
          ] }),
          /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs", children: [
            /* @__PURE__ */ jsx(TrendingUp, { className: "h-3 w-3 mr-1" }),
            " Live"
          ] })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: trendData, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: {
            fontSize: 11
          }, stroke: "var(--color-muted-foreground)" }),
          /* @__PURE__ */ jsx(YAxis, { tick: {
            fontSize: 11
          }, stroke: "var(--color-muted-foreground)" }),
          /* @__PURE__ */ jsx(Tooltip, { contentStyle: {
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12
          } }),
          /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "score", stroke: "var(--color-primary)", strokeWidth: 2, dot: {
            r: 3
          } })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Open Alerts" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
          recentAlerts.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No open alerts." }),
          recentAlerts.map((a) => {
            const r = residents.find((x) => x.id === a.residentId);
            const tone = a.priority === "critical" ? "bg-destructive/10 text-destructive border-destructive/20" : a.priority === "high" ? "bg-warning/15 text-warning-foreground border-warning/30" : "bg-info/10 text-info border-info/20";
            return /* @__PURE__ */ jsxs("div", { className: `rounded-md border p-2.5 text-sm ${tone}`, children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "font-medium", children: a.title }),
                /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] uppercase", children: a.priority })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs opacity-80 mt-1", children: [
                r?.firstName,
                " ",
                r?.lastName,
                " · Room ",
                r?.roomNumber
              ] })
            ] }, a.id);
          }),
          /* @__PURE__ */ jsxs(Link, { to: "/alerts", className: "text-xs text-primary hover:underline inline-flex items-center", children: [
            "View all ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-3 w-3 ml-0.5" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: /* @__PURE__ */ jsx(Link, { to: "/tasks", className: "block lg:col-span-1", children: /* @__PURE__ */ jsxs(Card, { className: "h-full hover:border-primary/50 transition-colors", children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Tasks Requiring Attention" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-md border p-2", children: [
          /* @__PURE__ */ jsx("span", { children: "Overdue" }),
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-destructive tabular-nums", children: tasksOverdue })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-md border p-2", children: [
          /* @__PURE__ */ jsx("span", { children: "Due Today" }),
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-warning-foreground tabular-nums", children: tasksDueToday })
        ] })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxs(Card, { className: "lg:col-span-2", children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Recent Daily Notes" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "divide-y", children: recentNotes.map((n) => {
          const r = residents.find((x) => x.id === n.residentId);
          return /* @__PURE__ */ jsxs("div", { className: "py-2.5 flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(Avatar, { className: "h-9 w-9", children: /* @__PURE__ */ jsxs(AvatarFallback, { className: "text-xs bg-secondary", children: [
              r?.firstName[0],
              r?.lastName[0]
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
                /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                  r?.firstName,
                  " ",
                  r?.lastName
                ] }),
                /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: n.shift }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: n.staff })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-0.5 truncate", children: n.observation })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground whitespace-nowrap", children: n.date.slice(0, 10) })
          ] }, n.id);
        }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Upcoming Reviews" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2", children: [
          dueReviews.slice(0, 6).map((c) => {
            const r = residents.find((x) => x.id === c.residentId);
            return /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-2.5", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: c.title }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                r?.firstName,
                " ",
                r?.lastName,
                " · Due ",
                c.reviewDate
              ] })
            ] }, c.id);
          }),
          dueReviews.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No reviews due in the next 7 days." })
        ] })
      ] })
    ] })
  ] });
}
export {
  Dashboard as component
};
