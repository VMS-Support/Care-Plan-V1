import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { u as useCare, a as can, C as Card, e as CardContent, b as CardHeader, d as CardTitle, B as Badge } from "./router-DLzRbDkQ.js";
import { P as Progress } from "./progress-CEouM73W.js";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Activity, FileWarning } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "sonner";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "@radix-ui/react-progress";
function ComplianceDashboard() {
  const {
    currentRole,
    residents,
    carePlans,
    carePlanEvaluations,
    assessments,
    interventionLogs
  } = useCare();
  const hasAccess = can(currentRole, "compliance.view");
  const today = /* @__PURE__ */ new Date();
  const stats = useMemo(() => {
    const active = carePlans.filter((c) => c.status === "active");
    const overdueReviews = active.filter((c) => new Date(c.reviewDate) < today);
    const overdueEvals = active.filter((c) => c.evaluationDate && new Date(c.evaluationDate) < today);
    const noPlan = residents.filter((r) => !carePlans.some((c) => c.residentId === r.id && c.status === "active"));
    const highRisk = residents.filter((r) => carePlans.some((c) => c.residentId === r.id && c.status === "active" && (c.priority === "high" || c.priority === "critical")));
    const critical = residents.filter((r) => carePlans.some((c) => c.residentId === r.id && c.status === "active" && c.priority === "critical"));
    const compliantPct = active.length === 0 ? 100 : Math.round((active.length - overdueReviews.length) / active.length * 100);
    const completedAssessments = assessments.filter((a) => a.status === "completed" && (a.riskLevel === "high" || a.riskLevel === "very_high"));
    const converted = completedAssessments.filter((a) => carePlans.some((c) => c.linkedAssessmentId === a.id || c.residentId === a.residentId));
    const conversionRate = completedAssessments.length === 0 ? 100 : Math.round(converted.length / completedAssessments.length * 100);
    const goalsMet = carePlanEvaluations.filter((e) => e.goalsMet === "yes").length;
    const goalsPartial = carePlanEvaluations.filter((e) => e.goalsMet === "partially").length;
    const goalsNo = carePlanEvaluations.filter((e) => e.goalsMet === "no").length;
    const totalEvals = goalsMet + goalsPartial + goalsNo;
    const goalAchievementRate = totalEvals === 0 ? 0 : Math.round(goalsMet / totalEvals * 100);
    const logsCompleted = interventionLogs.filter((l) => l.outcome === "completed").length;
    const logsPartial = interventionLogs.filter((l) => l.outcome === "partially_completed").length;
    const logsMissed = interventionLogs.filter((l) => l.outcome === "missed").length;
    const logsRefused = interventionLogs.filter((l) => l.outcome === "refused").length;
    const interventionCompliancePct = interventionLogs.length === 0 ? 0 : Math.round((logsCompleted + logsPartial * 0.5) / interventionLogs.length * 100);
    return {
      active,
      overdueReviews,
      overdueEvals,
      noPlan,
      highRisk,
      critical,
      compliantPct,
      conversionRate,
      goalAchievementRate,
      goalsMet,
      goalsPartial,
      goalsNo,
      interventionCompliancePct,
      logsTotal: interventionLogs.length,
      logsCompleted,
      logsPartial,
      logsMissed,
      logsRefused
    };
  }, [carePlans, residents, carePlanEvaluations, assessments, interventionLogs]);
  if (!hasAccess) {
    return /* @__PURE__ */ jsx("div", { className: "p-8", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-8 text-center text-muted-foreground", children: "You don't have access to the compliance dashboard." }) }) });
  }
  const goalData = [{
    name: "Achieved",
    value: stats.goalsMet,
    color: "hsl(142 70% 45%)"
  }, {
    name: "Partial",
    value: stats.goalsPartial,
    color: "hsl(45 90% 55%)"
  }, {
    name: "Not met",
    value: stats.goalsNo,
    color: "hsl(0 75% 55%)"
  }].filter((d) => d.value > 0);
  const planCategoryData = Object.entries(stats.active.reduce((acc, p) => {
    const k = p.category || "Other";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {})).map(([name, value]) => ({
    name,
    value
  }));
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-7xl", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Care Plan Compliance" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Governance overview for CNMs and DON" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Active Care Plans" }),
        /* @__PURE__ */ jsx("div", { className: "text-3xl font-semibold mt-1 tabular-nums", children: stats.active.length })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-xs uppercase text-muted-foreground flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3 text-destructive" }),
          " Overdue Reviews"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-3xl font-semibold mt-1 tabular-nums text-destructive", children: stats.overdueReviews.length })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Overdue Evaluations" }),
        /* @__PURE__ */ jsx("div", { className: "text-3xl font-semibold mt-1 tabular-nums text-warning-foreground", children: stats.overdueEvals.length })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs uppercase text-muted-foreground", children: "Residents without Plan" }),
        /* @__PURE__ */ jsx("div", { className: "text-3xl font-semibold mt-1 tabular-nums", children: stats.noPlan.length })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 lg:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4" }),
          " Care Plan Compliance"
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxs("div", { className: "text-4xl font-semibold tabular-nums", children: [
            stats.compliantPct,
            "%"
          ] }),
          /* @__PURE__ */ jsx(Progress, { value: stats.compliantPct, className: "mt-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-2", children: "Active plans within review window" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(ClipboardCheck, { className: "h-4 w-4" }),
          " Assessment → Care Plan"
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxs("div", { className: "text-4xl font-semibold tabular-nums", children: [
            stats.conversionRate,
            "%"
          ] }),
          /* @__PURE__ */ jsx(Progress, { value: stats.conversionRate, className: "mt-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-2", children: "High-risk assessments converted to plans" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Activity, { className: "h-4 w-4" }),
          " Goal Achievement"
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxs("div", { className: "text-4xl font-semibold tabular-nums", children: [
            stats.goalAchievementRate,
            "%"
          ] }),
          /* @__PURE__ */ jsx(Progress, { value: stats.goalAchievementRate, className: "mt-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-2", children: "Goals fully met in evaluations" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(ClipboardCheck, { className: "h-4 w-4" }),
          " Intervention Delivery"
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxs("div", { className: "text-4xl font-semibold tabular-nums", children: [
            stats.interventionCompliancePct,
            "%"
          ] }),
          /* @__PURE__ */ jsx(Progress, { value: stats.interventionCompliancePct, className: "mt-2" }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-2", children: [
            stats.logsCompleted,
            " done · ",
            stats.logsPartial,
            " partial · ",
            stats.logsMissed,
            " missed · ",
            stats.logsRefused,
            " refused",
            stats.logsTotal === 0 && " (no logs yet)"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Goal Outcomes" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "h-64", children: goalData.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No evaluations recorded yet." }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(Pie, { data: goalData, dataKey: "value", nameKey: "name", cx: "50%", cy: "50%", outerRadius: 80, label: true, children: goalData.map((d, i) => /* @__PURE__ */ jsx(Cell, { fill: d.color }, i)) }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Legend, {})
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Active Plans by Category" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: planCategoryData, layout: "vertical", children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(XAxis, { type: "number", tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(YAxis, { type: "category", dataKey: "name", tick: {
            fontSize: 11
          }, width: 120 }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Bar, { dataKey: "value", fill: "hsl(var(--chart-1))", radius: [0, 4, 4, 0] })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FileWarning, { className: "h-4 w-4 text-destructive" }),
        " Action Required"
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "grid md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h4", { className: "text-sm font-semibold mb-2", children: [
            "Overdue Reviews (",
            stats.overdueReviews.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 max-h-72 overflow-y-auto", children: [
            stats.overdueReviews.map((p) => {
              const r = residents.find((x) => x.id === p.residentId);
              return /* @__PURE__ */ jsxs(Link, { to: "/care-plans/$id", params: {
                id: p.id
              }, className: "block border rounded-md p-2 text-sm hover:bg-muted/50", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: p.title }),
                  /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] text-destructive border-destructive/30", children: [
                    "Due ",
                    p.reviewDate
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                  r?.firstName,
                  " ",
                  r?.lastName
                ] })
              ] }, p.id);
            }),
            stats.overdueReviews.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "None." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h4", { className: "text-sm font-semibold mb-2", children: [
            "Residents without Active Care Plan (",
            stats.noPlan.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 max-h-72 overflow-y-auto", children: [
            stats.noPlan.map((r) => /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
              id: r.id
            }, className: "block border rounded-md p-2 text-sm hover:bg-muted/50", children: [
              /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                r.firstName,
                " ",
                r.lastName
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "Room ",
                r.roomNumber,
                " · ",
                r.primaryDiagnosis
              ] })
            ] }, r.id)),
            stats.noPlan.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "All residents have an active plan." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h4", { className: "text-sm font-semibold mb-2", children: [
            "High-Risk Care Plans (",
            stats.highRisk.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-1.5 max-h-72 overflow-y-auto", children: stats.highRisk.map((r) => /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
            id: r.id
          }, className: "block border rounded-md p-2 text-sm hover:bg-muted/50", children: [
            /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
              r.firstName,
              " ",
              r.lastName
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
              "Room ",
              r.roomNumber
            ] })
          ] }, r.id)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h4", { className: "text-sm font-semibold mb-2", children: [
            "Critical Risks (",
            stats.critical.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 max-h-72 overflow-y-auto", children: [
            stats.critical.map((r) => /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
              id: r.id
            }, className: "block border rounded-md p-2 text-sm hover:bg-muted/50 border-destructive/30", children: [
              /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                r.firstName,
                " ",
                r.lastName
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "Room ",
                r.roomNumber
              ] })
            ] }, r.id)),
            stats.critical.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "No critical-priority plans." })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  ComplianceDashboard as component
};
