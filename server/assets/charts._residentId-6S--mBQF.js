import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { J as Route, u as useCare, f as Button, C as Card, e as CardContent, I as Input, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem } from "./router-DLzRbDkQ.js";
import { L as Label } from "./label-6k_A62K1.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BZBuOn5G.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-Dtfzkh6H.js";
import { ArrowLeft, Printer, Plus } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, BarChart, Bar } from "recharts";
import { toast } from "sonner";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "@radix-ui/react-label";
import "@radix-ui/react-tabs";
import "@radix-ui/react-dialog";
const today = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
const now = () => (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5);
function ChartsPage() {
  const {
    residentId
  } = Route.useParams();
  const c = useCare();
  const r = c.residents.find((x) => x.id === residentId);
  if (!r) return /* @__PURE__ */ jsx("div", { className: "p-8", children: "Resident not found." });
  const rWeights = useMemo(() => c.weights.filter((w) => w.residentId === residentId).slice().sort((a, b) => a.date.localeCompare(b.date)), [c.weights, residentId]);
  const rFluids = c.fluids.filter((f) => f.residentId === residentId);
  const rFoods = c.foods.filter((f) => f.residentId === residentId);
  const rPains = useMemo(() => c.pains.filter((p) => p.residentId === residentId).slice().sort((a, b) => a.date.localeCompare(b.date)), [c.pains, residentId]);
  const rSleeps = useMemo(() => c.sleeps.filter((s) => s.residentId === residentId).slice().sort((a, b) => a.date.localeCompare(b.date)), [c.sleeps, residentId]);
  const rBowels = c.bowels.filter((b) => b.residentId === residentId);
  const rBehaviour = c.behaviours.filter((b) => b.residentId === residentId);
  const rObs = c.observations.filter((o) => o.residentId === residentId);
  const todayFluidTotal = rFluids.filter((f) => f.date === today()).reduce((s, f) => s + f.amountMl, 0);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 max-w-6xl space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap print:hidden", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
        id: r.id
      }, className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to ",
        r.firstName,
        " ",
        r.lastName
      ] }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => window.print(), children: [
        /* @__PURE__ */ jsx(Printer, { className: "h-4 w-4 mr-1.5" }),
        " Print / PDF"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Clinical Charts" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        r.firstName,
        " ",
        r.lastName,
        " · Room ",
        r.roomNumber
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "weight", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "flex-wrap h-auto", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "weight", children: "Weight" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "fluid", children: "Fluids" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "food", children: "Food" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "pain", children: "Pain" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "sleep", children: "Sleep" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "bowel", children: "Bowel" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "behaviour", children: "Behaviour" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "observation", children: "Observations" })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "weight", className: "space-y-4 pt-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-medium", children: "Weight trend" }),
          /* @__PURE__ */ jsx(AddWeight, { residentId })
        ] }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "h-64 p-4", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(LineChart, { data: rWeights.map((w) => ({
          date: w.date.slice(5),
          kg: w.weightKg
        })), children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(YAxis, { tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(Tooltip, { contentStyle: {
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            fontSize: 12
          } }),
          /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "kg", stroke: "var(--color-primary)", strokeWidth: 2 })
        ] }) }) }) }),
        /* @__PURE__ */ jsx(RecordTable, { rows: rWeights.slice().reverse(), cols: ["date", "weightKg", "staff", "notes"] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "fluid", className: "space-y-4 pt-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "font-medium", children: "Fluid intake" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Today: ",
              /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                todayFluidTotal,
                " ml"
              ] }),
              " · target 1500ml"
            ] })
          ] }),
          /* @__PURE__ */ jsx(AddFluid, { residentId })
        ] }),
        /* @__PURE__ */ jsx(RecordTable, { rows: rFluids, cols: ["date", "time", "amountMl", "type", "route", "staff"] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "food", className: "space-y-4 pt-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-medium", children: "Food intake" }),
          /* @__PURE__ */ jsx(AddFood, { residentId })
        ] }),
        /* @__PURE__ */ jsx(RecordTable, { rows: rFoods, cols: ["date", "meal", "intake", "description", "staff"] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "pain", className: "space-y-4 pt-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-medium", children: "Pain score (0–10)" }),
          /* @__PURE__ */ jsx(AddPain, { residentId })
        ] }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "h-64 p-4", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(BarChart, { data: rPains.map((p) => ({
          date: p.date.slice(5),
          score: p.score
        })), children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(YAxis, { domain: [0, 10], tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(Tooltip, { contentStyle: {
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            fontSize: 12
          } }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "score", fill: "var(--color-destructive)" })
        ] }) }) }) }),
        /* @__PURE__ */ jsx(RecordTable, { rows: rPains.slice().reverse(), cols: ["date", "time", "score", "location", "intervention", "staff"] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "sleep", className: "space-y-4 pt-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-medium", children: "Sleep" }),
          /* @__PURE__ */ jsx(AddSleep, { residentId })
        ] }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "h-64 p-4", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(BarChart, { data: rSleeps.map((s) => ({
          date: s.date.slice(5),
          hours: s.hoursSlept
        })), children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(YAxis, { tick: {
            fontSize: 11
          } }),
          /* @__PURE__ */ jsx(Tooltip, { contentStyle: {
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            fontSize: 12
          } }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "hours", fill: "var(--color-info)" })
        ] }) }) }) }),
        /* @__PURE__ */ jsx(RecordTable, { rows: rSleeps.slice().reverse(), cols: ["date", "hoursSlept", "quality", "disturbances", "staff"] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "bowel", className: "space-y-4 pt-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-medium", children: "Bowel chart" }),
          /* @__PURE__ */ jsx(AddBowel, { residentId })
        ] }),
        /* @__PURE__ */ jsx(RecordTable, { rows: rBowels, cols: ["date", "time", "bristolType", "continent", "notes", "staff"] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "behaviour", className: "space-y-4 pt-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-medium", children: "Behaviour log" }),
          /* @__PURE__ */ jsx(AddBehaviour, { residentId })
        ] }),
        /* @__PURE__ */ jsx(RecordTable, { rows: rBehaviour, cols: ["date", "time", "behaviour", "trigger", "intervention", "outcome", "staff"] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "observation", className: "space-y-4 pt-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-medium", children: "Observations" }),
          /* @__PURE__ */ jsx(AddObservation, { residentId })
        ] }),
        /* @__PURE__ */ jsx(RecordTable, { rows: rObs, cols: ["date", "time", "mood", "mobility", "pain", "appetite", "hydration", "staff"] })
      ] })
    ] })
  ] });
}
function RecordTable({
  rows,
  cols
}) {
  if (!rows.length) return /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No records yet." });
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-0 overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
    /* @__PURE__ */ jsx("thead", { className: "bg-muted/40", children: /* @__PURE__ */ jsx("tr", { children: cols.map((c) => /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2 font-medium capitalize text-xs", children: c.replace(/([A-Z])/g, " $1") }, c)) }) }),
    /* @__PURE__ */ jsx("tbody", { children: rows.map((r, i) => /* @__PURE__ */ jsx("tr", { className: "border-t", children: cols.map((c) => /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-xs", children: String(r[c] ?? "—") }, c)) }, i)) })
  ] }) }) });
}
function AddDialog({
  label,
  children,
  onSubmit
}) {
  const [open, setOpen] = useState(false);
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { size: "sm", children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
      " Add"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: label }) }),
      /* @__PURE__ */ jsx("div", { className: "space-y-3", children }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => {
          onSubmit();
          setOpen(false);
          toast.success("Saved");
        }, children: "Save" })
      ] })
    ] })
  ] });
}
function AddWeight({
  residentId
}) {
  const {
    addWeight,
    currentUserName
  } = useCare();
  const [w, setW] = useState({
    date: today(),
    weightKg: 65,
    notes: ""
  });
  return /* @__PURE__ */ jsxs(AddDialog, { label: "Record weight", onSubmit: () => addWeight({
    ...w,
    residentId,
    staff: currentUserName
  }), children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Date" }),
      /* @__PURE__ */ jsx(Input, { type: "date", value: w.date, onChange: (e) => setW({
        ...w,
        date: e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Weight (kg)" }),
      /* @__PURE__ */ jsx(Input, { type: "number", step: "0.1", value: w.weightKg, onChange: (e) => setW({
        ...w,
        weightKg: +e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Notes" }),
      /* @__PURE__ */ jsx(Textarea, { value: w.notes, onChange: (e) => setW({
        ...w,
        notes: e.target.value
      }) })
    ] })
  ] });
}
function AddFluid({
  residentId
}) {
  const {
    addFluid,
    currentUserName
  } = useCare();
  const [f, setF] = useState({
    date: today(),
    time: now(),
    amountMl: 200,
    type: "Water",
    route: "oral"
  });
  return /* @__PURE__ */ jsxs(AddDialog, { label: "Record fluid intake", onSubmit: () => addFluid({
    ...f,
    residentId,
    staff: currentUserName
  }), children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Date" }),
        /* @__PURE__ */ jsx(Input, { type: "date", value: f.date, onChange: (e) => setF({
          ...f,
          date: e.target.value
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Time" }),
        /* @__PURE__ */ jsx(Input, { type: "time", value: f.time, onChange: (e) => setF({
          ...f,
          time: e.target.value
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Amount (ml)" }),
      /* @__PURE__ */ jsx(Input, { type: "number", value: f.amountMl, onChange: (e) => setF({
        ...f,
        amountMl: +e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Type" }),
      /* @__PURE__ */ jsx(Input, { value: f.type, onChange: (e) => setF({
        ...f,
        type: e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Route" }),
      /* @__PURE__ */ jsxs(Select, { value: f.route, onValueChange: (v) => setF({
        ...f,
        route: v
      }), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsx(SelectContent, { children: ["oral", "iv", "ng", "peg"].map((x) => /* @__PURE__ */ jsx(SelectItem, { value: x, children: x }, x)) })
      ] })
    ] })
  ] });
}
function AddFood({
  residentId
}) {
  const {
    addFood,
    currentUserName
  } = useCare();
  const [f, setF] = useState({
    date: today(),
    meal: "lunch",
    intake: "most",
    description: ""
  });
  return /* @__PURE__ */ jsxs(AddDialog, { label: "Record meal", onSubmit: () => addFood({
    ...f,
    residentId,
    staff: currentUserName
  }), children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Date" }),
      /* @__PURE__ */ jsx(Input, { type: "date", value: f.date, onChange: (e) => setF({
        ...f,
        date: e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Meal" }),
      /* @__PURE__ */ jsxs(Select, { value: f.meal, onValueChange: (v) => setF({
        ...f,
        meal: v
      }), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsx(SelectContent, { children: ["breakfast", "lunch", "dinner", "snack"].map((x) => /* @__PURE__ */ jsx(SelectItem, { value: x, children: x }, x)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Intake" }),
      /* @__PURE__ */ jsxs(Select, { value: f.intake, onValueChange: (v) => setF({
        ...f,
        intake: v
      }), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsx(SelectContent, { children: ["full", "most", "half", "little", "none"].map((x) => /* @__PURE__ */ jsx(SelectItem, { value: x, children: x }, x)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Description" }),
      /* @__PURE__ */ jsx(Input, { value: f.description, onChange: (e) => setF({
        ...f,
        description: e.target.value
      }) })
    ] })
  ] });
}
function AddPain({
  residentId
}) {
  const {
    addPain,
    currentUserName
  } = useCare();
  const [p, setP] = useState({
    date: today(),
    time: now(),
    score: 3,
    location: "",
    intervention: ""
  });
  return /* @__PURE__ */ jsxs(AddDialog, { label: "Record pain", onSubmit: () => addPain({
    ...p,
    residentId,
    staff: currentUserName
  }), children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Date" }),
        /* @__PURE__ */ jsx(Input, { type: "date", value: p.date, onChange: (e) => setP({
          ...p,
          date: e.target.value
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Time" }),
        /* @__PURE__ */ jsx(Input, { type: "time", value: p.time, onChange: (e) => setP({
          ...p,
          time: e.target.value
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Pain score (0–10)" }),
      /* @__PURE__ */ jsx(Input, { type: "number", min: 0, max: 10, value: p.score, onChange: (e) => setP({
        ...p,
        score: +e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Location" }),
      /* @__PURE__ */ jsx(Input, { value: p.location, onChange: (e) => setP({
        ...p,
        location: e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Intervention" }),
      /* @__PURE__ */ jsx(Input, { value: p.intervention, onChange: (e) => setP({
        ...p,
        intervention: e.target.value
      }) })
    ] })
  ] });
}
function AddSleep({
  residentId
}) {
  const {
    addSleep,
    currentUserName
  } = useCare();
  const [s, setS] = useState({
    date: today(),
    hoursSlept: 7,
    quality: "good",
    disturbances: ""
  });
  return /* @__PURE__ */ jsxs(AddDialog, { label: "Record sleep", onSubmit: () => addSleep({
    ...s,
    residentId,
    staff: currentUserName
  }), children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Date" }),
      /* @__PURE__ */ jsx(Input, { type: "date", value: s.date, onChange: (e) => setS({
        ...s,
        date: e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Hours slept" }),
      /* @__PURE__ */ jsx(Input, { type: "number", step: "0.5", value: s.hoursSlept, onChange: (e) => setS({
        ...s,
        hoursSlept: +e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Quality" }),
      /* @__PURE__ */ jsxs(Select, { value: s.quality, onValueChange: (v) => setS({
        ...s,
        quality: v
      }), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsx(SelectContent, { children: ["good", "broken", "poor"].map((x) => /* @__PURE__ */ jsx(SelectItem, { value: x, children: x }, x)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Disturbances" }),
      /* @__PURE__ */ jsx(Input, { value: s.disturbances, onChange: (e) => setS({
        ...s,
        disturbances: e.target.value
      }) })
    ] })
  ] });
}
function AddBowel({
  residentId
}) {
  const {
    addBowel,
    currentUserName
  } = useCare();
  const [b, setB] = useState({
    date: today(),
    time: now(),
    bristolType: 4,
    continent: true,
    notes: ""
  });
  return /* @__PURE__ */ jsxs(AddDialog, { label: "Record bowel movement", onSubmit: () => addBowel({
    ...b,
    residentId,
    staff: currentUserName
  }), children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Date" }),
        /* @__PURE__ */ jsx(Input, { type: "date", value: b.date, onChange: (e) => setB({
          ...b,
          date: e.target.value
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Time" }),
        /* @__PURE__ */ jsx(Input, { type: "time", value: b.time, onChange: (e) => setB({
          ...b,
          time: e.target.value
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Bristol type (1–7)" }),
      /* @__PURE__ */ jsx(Input, { type: "number", min: 1, max: 7, value: b.bristolType, onChange: (e) => setB({
        ...b,
        bristolType: +e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Continent" }),
      /* @__PURE__ */ jsxs(Select, { value: String(b.continent), onValueChange: (v) => setB({
        ...b,
        continent: v === "true"
      }), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "true", children: "Yes" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "false", children: "No" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Notes" }),
      /* @__PURE__ */ jsx(Input, { value: b.notes, onChange: (e) => setB({
        ...b,
        notes: e.target.value
      }) })
    ] })
  ] });
}
function AddBehaviour({
  residentId
}) {
  const {
    addBehaviour,
    currentUserName
  } = useCare();
  const [b, setB] = useState({
    date: today(),
    time: now(),
    behaviour: "",
    trigger: "",
    intervention: "",
    outcome: ""
  });
  return /* @__PURE__ */ jsxs(AddDialog, { label: "Record behaviour", onSubmit: () => addBehaviour({
    ...b,
    residentId,
    staff: currentUserName
  }), children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Date" }),
        /* @__PURE__ */ jsx(Input, { type: "date", value: b.date, onChange: (e) => setB({
          ...b,
          date: e.target.value
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Time" }),
        /* @__PURE__ */ jsx(Input, { type: "time", value: b.time, onChange: (e) => setB({
          ...b,
          time: e.target.value
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Behaviour" }),
      /* @__PURE__ */ jsx(Input, { value: b.behaviour, onChange: (e) => setB({
        ...b,
        behaviour: e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Trigger" }),
      /* @__PURE__ */ jsx(Input, { value: b.trigger, onChange: (e) => setB({
        ...b,
        trigger: e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Intervention" }),
      /* @__PURE__ */ jsx(Input, { value: b.intervention, onChange: (e) => setB({
        ...b,
        intervention: e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Outcome" }),
      /* @__PURE__ */ jsx(Input, { value: b.outcome, onChange: (e) => setB({
        ...b,
        outcome: e.target.value
      }) })
    ] })
  ] });
}
function AddObservation({
  residentId
}) {
  const {
    addObservation,
    currentUserName,
    currentRole
  } = useCare();
  const [o, setO] = useState({
    date: today(),
    time: now(),
    mood: "calm",
    mobility: "assistance",
    pain: 0,
    sleep: "good",
    appetite: "most",
    hydration: "good",
    comments: ""
  });
  return /* @__PURE__ */ jsxs(AddDialog, { label: "Record observation", onSubmit: () => addObservation({
    ...o,
    residentId,
    staff: currentUserName,
    role: currentRole
  }), children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Date" }),
        /* @__PURE__ */ jsx(Input, { type: "date", value: o.date, onChange: (e) => setO({
          ...o,
          date: e.target.value
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Time" }),
        /* @__PURE__ */ jsx(Input, { type: "time", value: o.time, onChange: (e) => setO({
          ...o,
          time: e.target.value
        }) })
      ] })
    ] }),
    [["mood", ["happy", "calm", "anxious", "withdrawn", "agitated"]], ["mobility", ["independent", "assistance", "hoist", "bedbound"]], ["sleep", ["good", "broken", "poor"]], ["appetite", ["full", "most", "half", "little", "none"]], ["hydration", ["good", "moderate", "poor"]]].map(([key, opts]) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { className: "capitalize", children: key }),
      /* @__PURE__ */ jsxs(Select, { value: o[key], onValueChange: (v) => setO({
        ...o,
        [key]: v
      }), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsx(SelectContent, { children: opts.map((x) => /* @__PURE__ */ jsx(SelectItem, { value: x, children: x }, x)) })
      ] })
    ] }, key)),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Pain (0–10)" }),
      /* @__PURE__ */ jsx(Input, { type: "number", min: 0, max: 10, value: o.pain, onChange: (e) => setO({
        ...o,
        pain: +e.target.value
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Comments" }),
      /* @__PURE__ */ jsx(Textarea, { value: o.comments, onChange: (e) => setO({
        ...o,
        comments: e.target.value
      }) })
    ] })
  ] });
}
export {
  ChartsPage as component
};
