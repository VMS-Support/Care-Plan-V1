import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { U as Route, u as useCare, C as Card, b as CardHeader, d as CardTitle, e as CardContent, f as Button, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem, V as CATEGORY_LABELS, I as Input, B as Badge, W as RISK_COLORS, X as frequencyLabel, Y as PREDEFINED_GOALS } from "./router-DLzRbDkQ.js";
import { L as Label } from "./label-6k_A62K1.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-Dtfzkh6H.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BZBuOn5G.js";
import { S as Separator } from "./separator-DA6AZJaG.js";
import { ArrowLeft, Sparkles, Plus, Target, Activity, FileCheck2, History, CheckCircle2, X, PlayCircle, Trash2 } from "lucide-react";
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
import "@radix-ui/react-dialog";
import "@radix-ui/react-tabs";
import "@radix-ui/react-separator";
const CATEGORY_OPTIONS = ["pressure", "falls", "nutrition", "pain", "behaviour", "continence", "mobility", "cognition", "communication", "personal_care", "mental_health", "social", "sleep", "medication", "end_of_life", "skin", "safeguarding", "custom"];
const RISK_OPTIONS = ["none", "low", "moderate", "high", "very_high", "resolved"];
function todayPlus(days) {
  return new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
}
function ResidentCarePlanPage() {
  const {
    id
  } = Route.useParams();
  const {
    residents,
    residentCarePlans,
    carePlanProblems,
    problemGoals,
    problemInterventions,
    problemInterventionLogs,
    problemEvaluations,
    problemReviews,
    problemHistory,
    assessmentSuggestions,
    assessments
  } = useCare();
  const r = residents.find((x) => x.id === id);
  if (!r) return /* @__PURE__ */ jsx("div", { className: "p-8", children: "Resident not found." });
  const rcp = residentCarePlans.find((p) => p.residentId === id && p.status === "active");
  const problems = carePlanProblems.filter((p) => p.residentId === id);
  const active = problems.filter((p) => p.status === "active");
  const resolved = problems.filter((p) => p.status === "resolved");
  const pendingSuggestions = assessmentSuggestions.filter((s) => s.residentId === id && s.status === "pending");
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const dueReview = active.filter((p) => p.reviewDate <= today).length;
  const dueEval = active.filter((p) => p.evaluationDate <= today).length;
  const openInterventions = problemInterventions.filter((i) => i.status === "active" && problems.some((p) => p.id === i.problemId)).length;
  const completedRecent = problemInterventionLogs.filter((l) => l.residentId === id && l.outcome === "completed" && l.date >= todayPlus(-7)).length;
  const recentEvals = problemEvaluations.filter((e) => problems.some((p) => p.id === e.problemId)).slice(0, 5);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-7xl", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
      id: r.id
    }, className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      " Back to ",
      r.firstName,
      " ",
      r.lastName
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Resident Care Plan" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
          r.firstName,
          " ",
          r.lastName,
          " · Room ",
          r.roomNumber,
          " ·",
          " ",
          rcp ? /* @__PURE__ */ jsxs(Fragment, { children: [
            "Plan created ",
            rcp.createdAt.slice(0, 10),
            " by ",
            rcp.createdBy
          ] }) : "No active plan yet"
        ] })
      ] }),
      /* @__PURE__ */ jsx(AddProblemButton, { residentId: id })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3", children: [
      /* @__PURE__ */ jsx(Stat, { label: "Active Problems", value: active.length }),
      /* @__PURE__ */ jsx(Stat, { label: "Resolved", value: resolved.length }),
      /* @__PURE__ */ jsx(Stat, { label: "Due Review", value: dueReview, tone: dueReview > 0 ? "warn" : "default" }),
      /* @__PURE__ */ jsx(Stat, { label: "Due Evaluation", value: dueEval, tone: dueEval > 0 ? "warn" : "default" }),
      /* @__PURE__ */ jsx(Stat, { label: "Open Interventions", value: openInterventions }),
      /* @__PURE__ */ jsx(Stat, { label: "Logged (7d)", value: completedRecent }),
      /* @__PURE__ */ jsx(Stat, { label: "Recent Evals", value: recentEvals.length })
    ] }),
    pendingSuggestions.length > 0 && /* @__PURE__ */ jsxs(Card, { className: "border-info/30 bg-info/5", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-info" }),
        pendingSuggestions.length,
        " suggested care plan problem",
        pendingSuggestions.length > 1 ? "s" : "",
        " from recent assessments"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "space-y-2", children: pendingSuggestions.map((s) => /* @__PURE__ */ jsx(SuggestionRow, { suggestionId: s.id }, s.id)) })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "active", children: [
      /* @__PURE__ */ jsxs(TabsList, { children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "active", children: [
          "Active Problems (",
          active.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "resolved", children: [
          "Resolved (",
          resolved.length,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "active", className: "space-y-3 mt-3", children: [
        active.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No active problems. Add one or accept a suggestion above." }),
        active.map((p) => /* @__PURE__ */ jsx(ProblemCard, { problem: p }, p.id))
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "resolved", className: "space-y-3 mt-3", children: [
        resolved.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No resolved problems." }),
        resolved.map((p) => /* @__PURE__ */ jsx(ProblemCard, { problem: p }, p.id))
      ] })
    ] })
  ] });
}
function Stat({
  label,
  value,
  tone = "default"
}) {
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3", children: [
    /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: `text-2xl font-semibold tabular-nums ${tone === "warn" && value > 0 ? "text-warning-foreground" : ""}`, children: value })
  ] }) });
}
function SuggestionRow({
  suggestionId
}) {
  const {
    assessmentSuggestions,
    acceptSuggestion,
    rejectSuggestion
  } = useCare();
  const s = assessmentSuggestions.find((x) => x.id === suggestionId);
  const [editing, setEditing] = useState(false);
  const [statement, setStatement] = useState(s?.problemStatement || "");
  const [risk, setRisk] = useState(s?.riskLevel || "moderate");
  if (!s) return null;
  return /* @__PURE__ */ jsx("div", { className: "border rounded-md p-3 bg-background", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap text-xs", children: [
        /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: CATEGORY_LABELS[s.category] }),
        /* @__PURE__ */ jsx(Badge, { variant: "outline", className: RISK_COLORS[s.riskLevel], children: s.riskLevel.replace("_", " ") }),
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
          "from ",
          s.assessmentType.replace("_", " "),
          " assessment"
        ] })
      ] }),
      editing ? /* @__PURE__ */ jsxs("div", { className: "space-y-2 mt-2", children: [
        /* @__PURE__ */ jsx(Textarea, { value: statement, onChange: (e) => setStatement(e.target.value), rows: 2 }),
        /* @__PURE__ */ jsxs(Select, { value: risk, onValueChange: (v) => setRisk(v), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "w-48", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: RISK_OPTIONS.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o, className: "capitalize", children: o.replace("_", " ") }, o)) })
        ] })
      ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: s.problemStatement })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1", children: editing ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Button, { size: "sm", onClick: () => {
        acceptSuggestion(s.id, {
          problemStatement: statement,
          riskLevel: risk
        });
        toast.success("Problem added to care plan");
      }, children: "Save & Accept" }),
      /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => setEditing(false), children: "Cancel" })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Button, { size: "sm", onClick: () => {
        acceptSuggestion(s.id);
        toast.success("Problem added");
      }, children: "Accept" }),
      /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => setEditing(true), children: "Edit" }),
      /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => {
        rejectSuggestion(s.id, "Not clinically indicated");
      }, children: "Reject" })
    ] }) })
  ] }) });
}
function ProblemCard({
  problem
}) {
  const {
    problemGoals,
    problemInterventions,
    problemInterventionLogs,
    problemEvaluations,
    problemReviews,
    problemHistory
  } = useCare();
  const [showHistory, setShowHistory] = useState(false);
  const goals = problemGoals.filter((g) => g.problemId === problem.id);
  const interventions = problemInterventions.filter((i) => i.problemId === problem.id && i.status === "active");
  const evals = problemEvaluations.filter((e) => e.problemId === problem.id);
  const reviews = problemReviews.filter((r) => r.problemId === problem.id);
  const logs = problemInterventionLogs.filter((l) => l.problemId === problem.id).slice(0, 5);
  const history = problemHistory.filter((h) => h.problemId === problem.id);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const evalDue = problem.evaluationDate <= today;
  const reviewDue = problem.reviewDate <= today;
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap mb-1", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: CATEGORY_LABELS[problem.category] }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: RISK_COLORS[problem.riskLevel], children: problem.riskLevel.replace("_", " ") }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: problem.status }),
          evalDue && problem.status === "active" && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "bg-warning/15 text-warning-foreground border-warning/40", children: "Evaluation due" }),
          reviewDue && problem.status === "active" && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "bg-warning/15 text-warning-foreground border-warning/40", children: "Review due" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: problem.problemStatement }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
          "Created ",
          problem.createdAt.slice(0, 10),
          " by ",
          problem.createdBy,
          " · Eval ",
          problem.evaluationDate,
          " · Review ",
          problem.reviewDate
        ] })
      ] }),
      problem.status === "active" && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1", children: [
        /* @__PURE__ */ jsx(EvaluateDialog, { problemId: problem.id }),
        /* @__PURE__ */ jsx(FormalReviewDialog, { problemId: problem.id }),
        /* @__PURE__ */ jsx(ReviewUpdateDialog, { problem }),
        /* @__PURE__ */ jsx(ResolveDialog, { problemId: problem.id })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Separator, {}),
    /* @__PURE__ */ jsx(Section, { icon: /* @__PURE__ */ jsx(Target, { className: "h-3.5 w-3.5" }), label: `Goals (${goals.length})`, children: /* @__PURE__ */ jsx(GoalsEditor, { problemId: problem.id }) }),
    /* @__PURE__ */ jsxs(Section, { icon: /* @__PURE__ */ jsx(Activity, { className: "h-3.5 w-3.5" }), label: `Interventions (${interventions.length})`, children: [
      interventions.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "No active interventions." }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-1.5", children: interventions.map((i) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between gap-2 text-sm border rounded-md p-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium", children: i.name }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            frequencyLabel(i.frequencyType, i.frequencyValue, i.frequencyInstructions),
            i.assignedRole && ` · ${i.assignedRole}`,
            i.assignedStaffName && ` · ${i.assignedStaffName}`
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
          /* @__PURE__ */ jsx(LogInterventionDialog, { interventionId: i.id, interventionName: i.name }),
          /* @__PURE__ */ jsx(DiscontinueButton, { interventionId: i.id })
        ] })
      ] }, i.id)) }),
      /* @__PURE__ */ jsx(AddInterventionDialog, { problemId: problem.id })
    ] }),
    logs.length > 0 && /* @__PURE__ */ jsx(Section, { icon: /* @__PURE__ */ jsx(FileCheck2, { className: "h-3.5 w-3.5" }), label: `Recent Completions (${logs.length})`, children: /* @__PURE__ */ jsx("ul", { className: "text-xs space-y-1", children: logs.map((l) => /* @__PURE__ */ jsxs("li", { className: "text-muted-foreground", children: [
      l.date,
      " ",
      l.time,
      " · ",
      /* @__PURE__ */ jsx("span", { className: "capitalize", children: l.outcome.replace("_", " ") }),
      " by ",
      l.staffName,
      " (",
      l.role,
      ")",
      l.comments && ` — ${l.comments}`
    ] }, l.id)) }) }),
    (evals.length > 0 || reviews.length > 0) && /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
      evals.length > 0 && /* @__PURE__ */ jsxs("div", { className: "text-xs space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "font-medium uppercase tracking-wide text-muted-foreground", children: [
          "Evaluations (",
          evals.length,
          ")"
        ] }),
        evals.slice(0, 3).map((e) => /* @__PURE__ */ jsxs("div", { className: "border rounded p-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
            e.date.slice(0, 10),
            " · ",
            /* @__PURE__ */ jsx("span", { className: "capitalize", children: e.progress.replace("_", " ") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground", children: [
            e.evaluatorName,
            " — ",
            e.summary
          ] })
        ] }, e.id))
      ] }),
      reviews.length > 0 && /* @__PURE__ */ jsxs("div", { className: "text-xs space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "font-medium uppercase tracking-wide text-muted-foreground", children: [
          "Formal Reviews (",
          reviews.length,
          ")"
        ] }),
        reviews.slice(0, 3).map((rv) => /* @__PURE__ */ jsxs("div", { className: "border rounded p-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
            rv.reviewDate.slice(0, 10),
            " · ",
            /* @__PURE__ */ jsx("span", { className: "capitalize", children: rv.outcome })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground", children: [
            rv.reviewedByName,
            " — ",
            rv.comments
          ] })
        ] }, rv.id))
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "pt-1", children: [
      /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "ghost", className: "text-xs h-7", onClick: () => setShowHistory((v) => !v), children: [
        /* @__PURE__ */ jsx(History, { className: "h-3 w-3 mr-1" }),
        " ",
        showHistory ? "Hide" : "View",
        " History (",
        history.length,
        ")"
      ] }),
      showHistory && /* @__PURE__ */ jsx("div", { className: "mt-2 border rounded-md p-2 text-xs space-y-1 max-h-64 overflow-auto", children: history.map((h) => /* @__PURE__ */ jsxs("div", { className: "border-b last:border-b-0 py-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
          h.timestamp.slice(0, 16).replace("T", " "),
          " · ",
          h.action.replace(/_/g, " ")
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground", children: [
          h.userName,
          " (",
          h.role,
          ")",
          h.reason ? ` — ${h.reason}` : ""
        ] }),
        h.newValue && /* @__PURE__ */ jsx("div", { className: "text-muted-foreground italic", children: h.newValue.slice(0, 200) })
      ] }, h.id)) })
    ] }),
    problem.status === "resolved" && problem.resolvedReason && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground italic border-t pt-2", children: [
      "Resolved ",
      problem.resolvedAt?.slice(0, 10),
      " by ",
      problem.resolvedBy,
      " — ",
      problem.resolvedReason
    ] })
  ] }) });
}
function Section({
  icon,
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5", children: [
      icon,
      " ",
      label
    ] }),
    children
  ] });
}
function GoalsEditor({
  problemId
}) {
  const {
    problemGoals,
    addGoal,
    updateGoal,
    removeGoal,
    carePlanProblems
  } = useCare();
  const goals = problemGoals.filter((g) => g.problemId === problemId);
  const problem = carePlanProblems.find((p) => p.id === problemId);
  const [newStatement, setNewStatement] = useState("");
  const suggestions = problem ? PREDEFINED_GOALS[problem.category] : [];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
    goals.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "No goals yet." }),
    goals.map((g) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm border rounded-md p-2", children: [
      /* @__PURE__ */ jsxs(Select, { value: g.status, onValueChange: (v) => updateGoal(g.id, {
        status: v
      }), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-40 h-7 text-xs", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsx(SelectContent, { children: ["active", "achieved", "partially_achieved", "not_achieved", "discontinued"].map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, className: "capitalize", children: s.replace(/_/g, " ") }, s)) })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "flex-1", children: g.statement }),
      /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => removeGoal(g.id), children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" }) })
    ] }, g.id)),
    suggestions.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: suggestions.filter((s) => !goals.some((g) => g.statement === s)).map((s) => /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "h-6 text-xs", onClick: () => {
      addGoal(problemId, s);
    }, children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-2.5 w-2.5 mr-1" }),
      " ",
      s
    ] }, s)) }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx(Input, { value: newStatement, onChange: (e) => setNewStatement(e.target.value), placeholder: "Add custom goal…", className: "h-8 text-sm" }),
      /* @__PURE__ */ jsx(Button, { size: "sm", disabled: !newStatement.trim(), onClick: () => {
        addGoal(problemId, newStatement.trim());
        setNewStatement("");
      }, children: /* @__PURE__ */ jsx(Plus, { className: "h-3 w-3" }) })
    ] })
  ] });
}
function AddProblemButton({
  residentId
}) {
  const {
    addProblem
  } = useCare();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("pressure");
  const [statement, setStatement] = useState("");
  const [risk, setRisk] = useState("moderate");
  const [evalDate, setEvalDate] = useState(todayPlus(7));
  const [reviewDate, setReviewDate] = useState(todayPlus(90));
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
      " Add Problem"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-xl", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Add Care Plan Problem" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Category" }),
          /* @__PURE__ */ jsxs(Select, { value: category, onValueChange: (v) => setCategory(v), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: CATEGORY_OPTIONS.map((c) => /* @__PURE__ */ jsx(SelectItem, { value: c, children: CATEGORY_LABELS[c] }, c)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Problem Statement" }),
          /* @__PURE__ */ jsx(Textarea, { value: statement, onChange: (e) => setStatement(e.target.value), rows: 3, placeholder: "Resident is at risk of…" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Risk Level" }),
          /* @__PURE__ */ jsxs(Select, { value: risk, onValueChange: (v) => setRisk(v), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: RISK_OPTIONS.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o, className: "capitalize", children: o.replace("_", " ") }, o)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Next Evaluation Date" }),
            /* @__PURE__ */ jsx(Input, { type: "date", value: evalDate, onChange: (e) => setEvalDate(e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Next Review Date" }),
            /* @__PURE__ */ jsx(Input, { type: "date", value: reviewDate, onChange: (e) => setReviewDate(e.target.value) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { disabled: !statement.trim(), onClick: () => {
          addProblem({
            residentId,
            category,
            problemStatement: statement.trim(),
            riskLevel: risk,
            evaluationDate: evalDate,
            reviewDate
          });
          toast.success("Problem added");
          setOpen(false);
          setStatement("");
        }, children: "Add Problem" })
      ] })
    ] })
  ] });
}
function AddInterventionDialog({
  problemId
}) {
  const {
    addProblemIntervention,
    users,
    currentUser
  } = useCare();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [freqType, setFreqType] = useState("daily");
  const [freqValue, setFreqValue] = useState(1);
  const [freqInstr, setFreqInstr] = useState("");
  const [assignedStaff, setAssignedStaff] = useState("");
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "h-7 mt-1", children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-3 w-3 mr-1" }),
      " Add Intervention"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Add Intervention" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Intervention name" }),
          /* @__PURE__ */ jsx(Input, { value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g. Reposition resident" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Frequency type" }),
            /* @__PURE__ */ jsxs(Select, { value: freqType, onValueChange: (v) => setFreqType(v), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsx(SelectContent, { children: ["hourly", "daily", "weekly", "monthly", "prn", "custom"].map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o, className: "capitalize", children: o }, o)) })
            ] })
          ] }),
          freqType !== "prn" && freqType !== "custom" && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs(Label, { children: [
              "Every N ",
              freqType === "hourly" ? "hours" : freqType === "daily" ? "× per day" : freqType
            ] }),
            /* @__PURE__ */ jsx(Input, { type: "number", min: 1, value: freqValue, onChange: (e) => setFreqValue(+e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Instructions (optional)" }),
          /* @__PURE__ */ jsx(Input, { value: freqInstr, onChange: (e) => setFreqInstr(e.target.value), placeholder: "e.g. Every Monday 09:00" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Assigned staff" }),
          /* @__PURE__ */ jsxs(Select, { value: assignedStaff, onValueChange: setAssignedStaff, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Care team" }) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "", children: "Care team" }),
              users.map((u) => /* @__PURE__ */ jsxs(SelectItem, { value: u.id, children: [
                u.name,
                " (",
                u.role,
                ")"
              ] }, u.id))
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { disabled: !name.trim(), onClick: () => {
          const staff = users.find((u) => u.id === assignedStaff);
          addProblemIntervention({
            problemId,
            name: name.trim(),
            frequencyType: freqType,
            frequencyValue: freqType === "prn" || freqType === "custom" ? void 0 : freqValue,
            frequencyInstructions: freqInstr || void 0,
            assignedRole: staff?.role,
            assignedStaffId: staff?.id,
            assignedStaffName: staff?.name
          });
          toast.success("Intervention added");
          setOpen(false);
          setName("");
          setFreqInstr("");
        }, children: "Add" })
      ] })
    ] })
  ] });
}
function DiscontinueButton({
  interventionId
}) {
  const {
    discontinueProblemIntervention
  } = useCare();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "h-7 w-7 p-0", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" }) }) }),
    /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Discontinue intervention" }) }),
      /* @__PURE__ */ jsx(Textarea, { value: reason, onChange: (e) => setReason(e.target.value), placeholder: "Reason…" }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { variant: "destructive", disabled: !reason.trim(), onClick: () => {
          discontinueProblemIntervention(interventionId, reason);
          setOpen(false);
          toast.success("Discontinued");
        }, children: "Discontinue" })
      ] })
    ] })
  ] });
}
function LogInterventionDialog({
  interventionId,
  interventionName
}) {
  const {
    logProblemIntervention
  } = useCare();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState("completed");
  const [response, setResponse] = useState("");
  const [comments, setComments] = useState("");
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { size: "sm", className: "h-7", children: [
      /* @__PURE__ */ jsx(PlayCircle, { className: "h-3 w-3 mr-1" }),
      " Log"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { children: [
        "Log: ",
        interventionName
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Outcome" }),
          /* @__PURE__ */ jsxs(Select, { value: outcome, onValueChange: (v) => setOutcome(v), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: ["completed", "partially_completed", "missed", "refused", "escalated"].map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o, className: "capitalize", children: o.replace("_", " ") }, o)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Resident response" }),
          /* @__PURE__ */ jsx(Input, { value: response, onChange: (e) => setResponse(e.target.value), placeholder: "e.g. Settled, accepted care" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Comments" }),
          /* @__PURE__ */ jsx(Textarea, { value: comments, onChange: (e) => setComments(e.target.value), rows: 2 })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Will appear under Problem, Timeline, Daily Notes, and the Compliance dashboard automatically." })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => {
          logProblemIntervention({
            interventionId,
            outcome,
            residentResponse: response,
            comments
          });
          toast.success("Intervention logged");
          setOpen(false);
          setResponse("");
          setComments("");
          setOutcome("completed");
        }, children: "Save Log" })
      ] })
    ] })
  ] });
}
function EvaluateDialog({
  problemId
}) {
  const {
    addProblemEvaluation
  } = useCare();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [goalsMet, setGoalsMet] = useState("partial");
  const [progress, setProgress] = useState("stable");
  const [nextDate, setNextDate] = useState(todayPlus(7));
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", children: "Evaluate" }) }),
    /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Clinical Evaluation" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Summary" }),
          /* @__PURE__ */ jsx(Textarea, { value: summary, onChange: (e) => setSummary(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Goals met?" }),
            /* @__PURE__ */ jsxs(Select, { value: goalsMet, onValueChange: (v) => setGoalsMet(v), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsx(SelectContent, { children: ["yes", "partial", "no"].map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o, className: "capitalize", children: o }, o)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Progress" }),
            /* @__PURE__ */ jsxs(Select, { value: progress, onValueChange: (v) => setProgress(v), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsx(SelectContent, { children: ["improved", "stable", "deteriorated", "resolved", "requires_revision"].map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o, className: "capitalize", children: o.replace("_", " ") }, o)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Next evaluation date" }),
          /* @__PURE__ */ jsx(Input, { type: "date", value: nextDate, onChange: (e) => setNextDate(e.target.value) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { disabled: !summary.trim(), onClick: () => {
          addProblemEvaluation({
            problemId,
            summary,
            goalsMet,
            progress,
            nextEvaluationDate: nextDate
          });
          toast.success("Evaluation recorded");
          setOpen(false);
          setSummary("");
        }, children: "Save" })
      ] })
    ] })
  ] });
}
function FormalReviewDialog({
  problemId
}) {
  const {
    addProblemReview
  } = useCare();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState("continue");
  const [comments, setComments] = useState("");
  const [nextReview, setNextReview] = useState(todayPlus(90));
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", children: "Review" }) }),
    /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Formal Review" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Outcome" }),
          /* @__PURE__ */ jsxs(Select, { value: outcome, onValueChange: (v) => setOutcome(v), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: ["continue", "modify", "escalate", "resolve", "refer"].map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o, className: "capitalize", children: o }, o)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Comments" }),
          /* @__PURE__ */ jsx(Textarea, { value: comments, onChange: (e) => setComments(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Next review date" }),
          /* @__PURE__ */ jsx(Input, { type: "date", value: nextReview, onChange: (e) => setNextReview(e.target.value) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => {
          addProblemReview({
            problemId,
            reviewDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
            outcome,
            comments,
            nextReviewDate: nextReview
          });
          toast.success("Review recorded");
          setOpen(false);
          setComments("");
        }, children: "Save" })
      ] })
    ] })
  ] });
}
function ReviewUpdateDialog({
  problem
}) {
  const {
    updateProblem
  } = useCare();
  const [open, setOpen] = useState(false);
  const [evalDate, setEvalDate] = useState(problem.evaluationDate);
  const [reviewDate, setReviewDate] = useState(problem.reviewDate);
  const [risk, setRisk] = useState(problem.riskLevel);
  const [statement, setStatement] = useState(problem.problemStatement);
  const [reason, setReason] = useState("");
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { size: "sm", children: "Review & Update" }) }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-xl", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Review & Update Problem" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Problem statement" }),
          /* @__PURE__ */ jsx(Textarea, { value: statement, onChange: (e) => setStatement(e.target.value), rows: 2 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Risk level" }),
            /* @__PURE__ */ jsxs(Select, { value: risk, onValueChange: (v) => setRisk(v), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsx(SelectContent, { children: RISK_OPTIONS.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o, className: "capitalize", children: o.replace("_", " ") }, o)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Next evaluation" }),
            /* @__PURE__ */ jsx(Input, { type: "date", value: evalDate, onChange: (e) => setEvalDate(e.target.value) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Next review" }),
            /* @__PURE__ */ jsx(Input, { type: "date", value: reviewDate, onChange: (e) => setReviewDate(e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Reason for change (audit)" }),
          /* @__PURE__ */ jsx(Input, { value: reason, onChange: (e) => setReason(e.target.value), placeholder: "e.g. Reassessment shows reduced risk" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Problem ID and history are preserved. Add or remove interventions and goals directly on the card." })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { disabled: !reason.trim(), onClick: () => {
          updateProblem(problem.id, {
            problemStatement: statement,
            riskLevel: risk,
            evaluationDate: evalDate,
            reviewDate
          }, reason);
          toast.success("Problem updated");
          setOpen(false);
        }, children: "Save" })
      ] })
    ] })
  ] });
}
function ResolveDialog({
  problemId
}) {
  const {
    resolveProblem
  } = useCare();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "text-success border-success/30", children: [
      /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3 mr-1" }),
      " Resolve"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Resolve Problem" }) }),
      /* @__PURE__ */ jsx(Textarea, { value: reason, onChange: (e) => setReason(e.target.value), placeholder: "Resolution reason (e.g. reassessment normal)…" }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { disabled: !reason.trim(), onClick: () => {
          resolveProblem(problemId, reason);
          toast.success("Problem resolved");
          setOpen(false);
        }, children: "Resolve" })
      ] })
    ] })
  ] });
}
export {
  ResidentCarePlanPage as component
};
