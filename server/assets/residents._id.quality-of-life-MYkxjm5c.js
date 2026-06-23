import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { T as Route, u as useCare, C as Card, b as CardHeader, d as CardTitle, e as CardContent } from "./router-DLzRbDkQ.js";
import { ArrowLeft, Smile, Utensils, Droplet, Moon, Activity } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar } from "recharts";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "sonner";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
const moodScore = {
  happy: 5,
  calm: 4,
  withdrawn: 3,
  anxious: 2,
  agitated: 1
};
const foodScore = {
  full: 5,
  most: 4,
  half: 3,
  little: 2,
  none: 1
};
const fluidScore = {
  good: 5,
  moderate: 3,
  poor: 1
};
const sleepScore = {
  good: 5,
  broken: 3,
  poor: 1
};
function QoLPage() {
  const {
    id
  } = Route.useParams();
  const {
    residents,
    notes,
    assessments,
    interventions
  } = useCare();
  const resident = residents.find((r) => r.id === id);
  const rNotes = useMemo(() => notes.filter((n) => n.residentId === id).sort((a, b) => a.date.localeCompare(b.date)), [notes, id]);
  const data = useMemo(() => rNotes.slice(-30).map((n) => ({
    date: n.date.slice(5, 10),
    mood: moodScore[n.mood] ?? 3,
    food: foodScore[n.foodIntake] ?? 3,
    fluid: fluidScore[n.fluidIntake] ?? 3,
    sleep: sleepScore[n.sleep] ?? 3
  })), [rNotes]);
  const painSeries = useMemo(() => assessments.filter((a) => a.residentId === id && a.type === "abbey_pain" && a.status !== "deleted").sort((a, b) => a.date.localeCompare(b.date)).map((a) => ({
    date: a.date.slice(5, 10),
    score: a.totalScore
  })), [assessments, id]);
  const cognitionSeries = useMemo(() => assessments.filter((a) => a.residentId === id && (a.type === "mmse" || a.type === "four_at") && a.status !== "deleted").sort((a, b) => a.date.localeCompare(b.date)).map((a) => ({
    date: a.date.slice(5, 10),
    score: a.totalScore,
    type: a.type
  })), [assessments, id]);
  const moodCounts = useMemo(() => {
    const c = {
      happy: 0,
      calm: 0,
      withdrawn: 0,
      anxious: 0,
      agitated: 0
    };
    rNotes.forEach((n) => {
      c[n.mood] = (c[n.mood] || 0) + 1;
    });
    return Object.entries(c).map(([name, value]) => ({
      name,
      value
    }));
  }, [rNotes]);
  const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0;
  const stats = {
    mood: avg(data.map((d) => d.mood)),
    food: avg(data.map((d) => d.food)),
    fluid: avg(data.map((d) => d.fluid)),
    sleep: avg(data.map((d) => d.sleep)),
    interventions: interventions.filter((i) => i.residentId === id).length
  };
  if (!resident) return /* @__PURE__ */ jsx("div", { className: "p-8", children: "Resident not found." });
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-7xl", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
      id
    }, className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      " ",
      resident.firstName,
      " ",
      resident.lastName
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Quality of Life" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Trends from daily notes, pain charts and cognitive assessments" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-3", children: [
      /* @__PURE__ */ jsx(Stat, { icon: Smile, label: "Avg Mood", value: `${stats.mood}/5` }),
      /* @__PURE__ */ jsx(Stat, { icon: Utensils, label: "Avg Food", value: `${stats.food}/5` }),
      /* @__PURE__ */ jsx(Stat, { icon: Droplet, label: "Avg Fluid", value: `${stats.fluid}/5` }),
      /* @__PURE__ */ jsx(Stat, { icon: Moon, label: "Avg Sleep", value: `${stats.sleep}/5` }),
      /* @__PURE__ */ jsx(Stat, { icon: Activity, label: "Interventions", value: stats.interventions })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Wellbeing Trend (last 30 daily notes)" }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "h-72", children: data.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No daily notes yet." }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: {
          fontSize: 11
        } }),
        /* @__PURE__ */ jsx(YAxis, { domain: [0, 5], tick: {
          fontSize: 11
        } }),
        /* @__PURE__ */ jsx(Tooltip, { contentStyle: {
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          fontSize: 12
        } }),
        /* @__PURE__ */ jsx(Legend, {}),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "mood", stroke: "hsl(var(--chart-1))", strokeWidth: 2, dot: {
          r: 2
        } }),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "food", stroke: "hsl(var(--chart-2))", strokeWidth: 2, dot: {
          r: 2
        } }),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "fluid", stroke: "hsl(var(--chart-3))", strokeWidth: 2, dot: {
          r: 2
        } }),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "sleep", stroke: "hsl(var(--chart-4))", strokeWidth: 2, dot: {
          r: 2
        } })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Pain (Abbey Pain Scale)" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "h-56", children: painSeries.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No pain assessments." }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: painSeries, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(YAxis, { tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "score", stroke: "hsl(0 75% 55%)", strokeWidth: 2, dot: {
            r: 3
          } })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Cognition (MMSE / 4AT)" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "h-56", children: cognitionSeries.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No cognitive assessments." }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: cognitionSeries, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(YAxis, { tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "score", stroke: "hsl(var(--chart-1))", strokeWidth: 2, dot: {
            r: 3
          } })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Mood Distribution" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "h-56", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: moodCounts, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "name", tick: {
            fontSize: 11
          }, className: "capitalize" }),
          /* @__PURE__ */ jsx(YAxis, { tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Bar, { dataKey: "value", fill: "hsl(var(--chart-2))", radius: [4, 4, 0, 0] })
        ] }) }) })
      ] })
    ] })
  ] });
}
function Stat({
  icon: Icon,
  label,
  value
}) {
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4 text-muted-foreground" }),
      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: label })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums mt-1", children: value })
  ] }) });
}
export {
  QoLPage as component
};
