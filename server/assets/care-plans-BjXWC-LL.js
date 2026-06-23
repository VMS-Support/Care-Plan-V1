import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import * as React from "react";
import { useState, useMemo } from "react";
import { c as cn, u as useCare, a as can, C as Card, e as CardContent, B as Badge, f as Button, b as CardHeader, d as CardTitle, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem, I as Input } from "./router-DLzRbDkQ.js";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-Dtfzkh6H.js";
import { L as Label } from "./label-6k_A62K1.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BZBuOn5G.js";
import { FileWarning, AlertTriangle, UserRound, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "@radix-ui/react-tabs";
const Table = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { className: "relative w-full overflow-auto", children: /* @__PURE__ */ jsx("table", { ref, className: cn("w-full caption-bottom text-sm", className), ...props }) })
);
Table.displayName = "Table";
const TableHeader = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("thead", { ref, className: cn("[&_tr]:border-b", className), ...props }));
TableHeader.displayName = "TableHeader";
const TableBody = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("tbody", { ref, className: cn("[&_tr:last-child]:border-0", className), ...props }));
TableBody.displayName = "TableBody";
const TableFooter = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "tfoot",
  {
    ref,
    className: cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className),
    ...props
  }
));
TableFooter.displayName = "TableFooter";
const TableRow = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "tr",
    {
      ref,
      className: cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      ),
      ...props
    }
  )
);
TableRow.displayName = "TableRow";
const TableHead = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "th",
  {
    ref,
    className: cn(
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    ),
    ...props
  }
));
TableHead.displayName = "TableHead";
const TableCell = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "td",
  {
    ref,
    className: cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    ),
    ...props
  }
));
TableCell.displayName = "TableCell";
const TableCaption = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("caption", { ref, className: cn("mt-4 text-sm text-muted-foreground", className), ...props }));
TableCaption.displayName = "TableCaption";
const DUE_SOON_DAYS = 7;
function startOfToday() {
  return /* @__PURE__ */ new Date(`${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}T00:00:00`);
}
function daysUntil(date) {
  if (!date) return null;
  const due = /* @__PURE__ */ new Date(`${date}T00:00:00`);
  const diffMs = due.getTime() - startOfToday().getTime();
  return Math.floor(diffMs / 864e5);
}
function formatDate(date) {
  if (!date) return "—";
  return (/* @__PURE__ */ new Date(`${date}T00:00:00`)).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}
function formatDateTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function statusMeta(plan) {
  const reviewDays = daysUntil(plan.reviewDate);
  const evaluationDays = daysUntil(plan.evaluationDate);
  if (plan.status === "completed") {
    return {
      label: "Completed",
      tone: "bg-muted text-muted-foreground border-border",
      dot: "bg-muted-foreground"
    };
  }
  if (plan.status === "archived" || plan.status === "superseded") {
    return {
      label: plan.status === "superseded" ? "Superseded" : "Archived",
      tone: "bg-muted text-muted-foreground border-border",
      dot: "bg-muted-foreground"
    };
  }
  if (evaluationDays !== null && evaluationDays < 0) {
    return {
      label: "Evaluation Overdue",
      tone: "bg-destructive/10 text-destructive border-destructive/30",
      dot: "bg-destructive"
    };
  }
  if (reviewDays !== null && reviewDays < 0) {
    return {
      label: "Review Overdue",
      tone: "bg-destructive/10 text-destructive border-destructive/30",
      dot: "bg-destructive"
    };
  }
  if (evaluationDays !== null && evaluationDays <= DUE_SOON_DAYS || reviewDays !== null && reviewDays <= DUE_SOON_DAYS) {
    return {
      label: "Review Due Soon",
      tone: "bg-amber-500/10 text-amber-700 border-amber-300",
      dot: "bg-amber-500"
    };
  }
  return {
    label: "On Track",
    tone: "bg-emerald-500/10 text-emerald-700 border-emerald-300",
    dot: "bg-emerald-500"
  };
}
function EvaluateDialog({
  carePlanId
}) {
  const {
    addEvaluation,
    updateCarePlan
  } = useCare();
  const [open, setOpen] = useState(false);
  const [achieve, setAchieve] = useState("partial");
  const [outcome, setOutcome] = useState("continue");
  const [notes, setNotes] = useState("");
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", children: "Evaluate" }) }),
    /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Evaluate Care Plan" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Goal achievement" }),
          /* @__PURE__ */ jsxs(Select, { value: achieve, onValueChange: (value) => setAchieve(value), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "achieved", children: "Achieved" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "partial", children: "Partially achieved" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "not_achieved", children: "Not achieved" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Outcome" }),
          /* @__PURE__ */ jsxs(Select, { value: outcome, onValueChange: (value) => setOutcome(value), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "continue", children: "Continue care plan" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "modify", children: "Modify care plan" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "close", children: "Close care plan" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Evaluation notes" }),
          /* @__PURE__ */ jsx(Textarea, { value: notes, onChange: (event) => setNotes(event.target.value) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => {
          addEvaluation({
            carePlanId,
            date: (/* @__PURE__ */ new Date()).toISOString(),
            reviewer: "J. Roberts (RN)",
            goalAchievement: achieve,
            notes,
            outcome,
            nextReviewDate: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10)
          });
          if (outcome === "close") {
            updateCarePlan(carePlanId, {
              status: "completed"
            });
          }
          toast.success("Evaluation recorded");
          setOpen(false);
        }, children: "Save" })
      ] })
    ] })
  ] });
}
function NewPlanDialog() {
  const {
    residents,
    addCarePlan
  } = useCare();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    residentId: "",
    title: "",
    problem: "",
    goal: "",
    interventions: "",
    frequency: "Daily",
    assignedStaff: "Care team",
    reviewDate: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10)
  });
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { children: "New Care Plan" }) }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "New Care Plan" }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Resident" }),
          /* @__PURE__ */ jsxs(Select, { value: form.residentId, onValueChange: (value) => setForm({
            ...form,
            residentId: value
          }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Choose resident" }) }),
            /* @__PURE__ */ jsx(SelectContent, { children: residents.map((resident) => /* @__PURE__ */ jsxs(SelectItem, { value: resident.id, children: [
              resident.firstName,
              " ",
              resident.lastName,
              " (",
              resident.roomNumber,
              ")"
            ] }, resident.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Title" }),
          /* @__PURE__ */ jsx(Input, { value: form.title, onChange: (event) => setForm({
            ...form,
            title: event.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Problem" }),
          /* @__PURE__ */ jsx(Textarea, { value: form.problem, onChange: (event) => setForm({
            ...form,
            problem: event.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Goal" }),
          /* @__PURE__ */ jsx(Textarea, { value: form.goal, onChange: (event) => setForm({
            ...form,
            goal: event.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Interventions (one per line)" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 4, value: form.interventions, onChange: (event) => setForm({
            ...form,
            interventions: event.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Frequency" }),
          /* @__PURE__ */ jsx(Input, { value: form.frequency, onChange: (event) => setForm({
            ...form,
            frequency: event.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Assigned staff" }),
          /* @__PURE__ */ jsx(Input, { value: form.assignedStaff, onChange: (event) => setForm({
            ...form,
            assignedStaff: event.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Review date" }),
          /* @__PURE__ */ jsx(Input, { type: "date", value: form.reviewDate, onChange: (event) => setForm({
            ...form,
            reviewDate: event.target.value
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => {
          if (!form.residentId || !form.title) {
            toast.error("Resident and title required");
            return;
          }
          addCarePlan({
            ...form,
            interventions: form.interventions.split("\n").filter(Boolean),
            status: "active"
          });
          toast.success("Care plan created");
          setOpen(false);
        }, children: "Create" })
      ] })
    ] })
  ] });
}
function CarePlansPage() {
  const {
    carePlans,
    residents,
    carePlanEvaluations,
    carePlanReviews,
    currentRole,
    currentUser,
    currentUserName,
    auditLogs
  } = useCare();
  const [tab, setTab] = useState("active");
  const [filter, setFilter] = useState("all");
  const governanceView = currentRole === "cnm" || currentRole === "don";
  const visibleTabs = governanceView ? ["active", "reviews", "evaluations", "completed", "archived", "governance"] : ["active", "reviews", "evaluations"];
  const rows = useMemo(() => {
    return carePlans.map((plan) => {
      const resident = residents.find((item) => item.id === plan.residentId);
      if (!resident) return null;
      const lastReview = carePlanReviews.filter((review) => review.carePlanId === plan.id).sort((left, right) => right.date.localeCompare(left.date))[0];
      const lastEvaluation = carePlanEvaluations.filter((evaluation) => evaluation.carePlanId === plan.id).sort((left, right) => right.date.localeCompare(left.date))[0];
      const lastUpdated = [plan.updatedAt, lastEvaluation?.date, lastReview?.date, plan.createdAt].filter(Boolean).sort().at(-1);
      const reviewDays = daysUntil(plan.reviewDate);
      const evaluationDays = daysUntil(plan.evaluationDate);
      const residentIsMine = resident.keyWorkers?.namedNurse === currentUserName || resident.keyWorkers?.keyWorker === currentUserName || plan.assignedStaff.includes(currentUserName) || currentUser.assignedWings.length > 0 && !!resident.wingId && currentUser.assignedWings.includes(resident.wingId);
      const isHighRisk = plan.priority === "high" || plan.priority === "critical";
      const hasOverdue = reviewDays !== null && reviewDays < 0 || evaluationDays !== null && evaluationDays < 0;
      const isReviewDue = reviewDays !== null && reviewDays <= DUE_SOON_DAYS;
      const isEvaluationDue = evaluationDays !== null && evaluationDays <= DUE_SOON_DAYS;
      return {
        plan,
        resident,
        lastUpdated,
        residentIsMine,
        isHighRisk,
        hasOverdue,
        isReviewDue,
        isEvaluationDue,
        reviewDays,
        evaluationDays,
        status: statusMeta(plan)
      };
    }).filter((item) => !!item).sort((left, right) => right.lastUpdated.localeCompare(left.lastUpdated));
  }, [carePlanEvaluations, carePlanReviews, carePlans, currentUser.assignedWings, currentUserName, residents]);
  const residentsWithoutActivePlan = useMemo(() => {
    const activeResidentIds = new Set(carePlans.filter((plan) => plan.status !== "completed" && plan.status !== "archived" && plan.status !== "superseded").map((plan) => plan.residentId));
    return residents.filter((resident) => !activeResidentIds.has(resident.id));
  }, [carePlans, residents]);
  const filteredRows = useMemo(() => {
    const tabFiltered = rows.filter((row) => {
      switch (tab) {
        case "active":
          return !["completed", "archived", "superseded"].includes(row.plan.status);
        case "reviews":
          return !["completed", "archived", "superseded"].includes(row.plan.status) && row.isReviewDue;
        case "evaluations":
          return !["completed", "archived", "superseded"].includes(row.plan.status) && row.isEvaluationDue;
        case "completed":
          return row.plan.status === "completed";
        case "archived":
          return row.plan.status === "archived" || row.plan.status === "superseded";
        case "governance":
          return true;
      }
    });
    return tabFiltered.filter((row) => {
      switch (filter) {
        case "all":
          return true;
        case "mine":
          return row.residentIsMine;
        case "high_risk":
          return row.isHighRisk;
        case "review_due":
          return row.isReviewDue;
        case "evaluation_due":
          return row.isEvaluationDue;
        case "overdue":
          return row.hasOverdue;
        case "completed":
          return row.plan.status === "completed";
      }
    });
  }, [filter, rows, tab]);
  const governance = useMemo(() => {
    const overdueReviews = rows.filter((row) => row.reviewDays !== null && row.reviewDays < 0 && row.plan.status !== "completed" && row.plan.status !== "archived" && row.plan.status !== "superseded");
    const overdueEvaluations = rows.filter((row) => row.evaluationDays !== null && row.evaluationDays < 0 && row.plan.status !== "completed" && row.plan.status !== "archived" && row.plan.status !== "superseded");
    const activeRows = rows.filter((row) => row.plan.status !== "completed" && row.plan.status !== "archived" && row.plan.status !== "superseded");
    const compliant = activeRows.filter((row) => !row.hasOverdue).length;
    const compliance = activeRows.length === 0 ? 100 : Math.round(compliant / activeRows.length * 100);
    const byWing = Object.values(rows.reduce((acc, row) => {
      const name = row.resident.wingId || "Unassigned";
      acc[name] = acc[name] || {
        name,
        count: 0
      };
      acc[name].count += 1;
      return acc;
    }, {})).sort((left, right) => right.count - left.count);
    const byNurse = Object.values(rows.reduce((acc, row) => {
      const name = row.resident.keyWorkers?.namedNurse || row.plan.assignedStaff || "Unassigned";
      acc[name] = acc[name] || {
        name,
        count: 0
      };
      acc[name].count += 1;
      return acc;
    }, {})).sort((left, right) => right.count - left.count);
    const carePlanAudit = auditLogs.filter((entry) => entry.entityType === "care_plan");
    return {
      overdueReviews,
      overdueEvaluations,
      missingCarePlans: residentsWithoutActivePlan,
      compliance,
      byWing,
      byNurse,
      auditStats: {
        total: carePlanAudit.length,
        archived: carePlanAudit.filter((entry) => entry.action.toLowerCase().includes("archiv")).length,
        revised: carePlanAudit.filter((entry) => entry.action.toLowerCase().includes("revis")).length,
        evaluations: carePlanEvaluations.length,
        reviews: carePlanReviews.length
      }
    };
  }, [auditLogs, carePlanEvaluations.length, carePlanReviews.length, residentsWithoutActivePlan, rows]);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Care Plans" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Faster access for frontline updates, with governance oversight preserved for CNMs and DONs." })
      ] }),
      can(currentRole, "careplan.create") && /* @__PURE__ */ jsx(NewPlanDialog, {})
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex flex-wrap items-center gap-3 text-sm", children: [
      /* @__PURE__ */ jsx(StatusLegend, { toneClass: "bg-emerald-500", label: "On Track" }),
      /* @__PURE__ */ jsx(StatusLegend, { toneClass: "bg-amber-500", label: "Review Due Soon" }),
      /* @__PURE__ */ jsx(StatusLegend, { toneClass: "bg-destructive", label: "Review Overdue" }),
      /* @__PURE__ */ jsx(StatusLegend, { toneClass: "bg-destructive", label: "Evaluation Overdue" })
    ] }) }),
    /* @__PURE__ */ jsxs(Tabs, { value: tab, onValueChange: (value) => setTab(value), className: "space-y-4", children: [
      /* @__PURE__ */ jsx(TabsList, { className: "flex-wrap h-auto", children: visibleTabs.map((value) => /* @__PURE__ */ jsxs(TabsTrigger, { value, children: [
        value === "active" && `Active Care Plans (${rows.filter((row) => !["completed", "archived", "superseded"].includes(row.plan.status)).length})`,
        value === "reviews" && `Reviews Due (${rows.filter((row) => !["completed", "archived", "superseded"].includes(row.plan.status) && row.isReviewDue).length})`,
        value === "evaluations" && `Evaluations Due (${rows.filter((row) => !["completed", "archived", "superseded"].includes(row.plan.status) && row.isEvaluationDue).length})`,
        value === "completed" && `Completed Care Plans (${rows.filter((row) => row.plan.status === "completed").length})`,
        value === "archived" && `Archived Care Plans (${rows.filter((row) => row.plan.status === "archived" || row.plan.status === "superseded").length})`,
        value === "governance" && "Governance"
      ] }, value)) }),
      /* @__PURE__ */ jsxs(TabsContent, { value: tab, className: "space-y-4", children: [
        tab !== "governance" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsx(QuickFilterButton, { active: filter === "all", onClick: () => setFilter("all"), children: "All Plans" }),
            /* @__PURE__ */ jsx(QuickFilterButton, { active: filter === "mine", onClick: () => setFilter("mine"), children: "My Residents" }),
            /* @__PURE__ */ jsx(QuickFilterButton, { active: filter === "high_risk", onClick: () => setFilter("high_risk"), children: "High Risk" }),
            /* @__PURE__ */ jsx(QuickFilterButton, { active: filter === "review_due", onClick: () => setFilter("review_due"), children: "Review Due" }),
            /* @__PURE__ */ jsx(QuickFilterButton, { active: filter === "evaluation_due", onClick: () => setFilter("evaluation_due"), children: "Evaluation Due" }),
            /* @__PURE__ */ jsx(QuickFilterButton, { active: filter === "overdue", onClick: () => setFilter("overdue"), children: "Overdue" }),
            governanceView && /* @__PURE__ */ jsx(QuickFilterButton, { active: filter === "completed", onClick: () => setFilter("completed"), children: "Completed" })
          ] }),
          /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxs(Table, { children: [
            /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableHead, { children: "Resident" }),
              /* @__PURE__ */ jsx(TableHead, { children: "Care Plan Name" }),
              /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
              /* @__PURE__ */ jsx(TableHead, { children: "Next Review Date" }),
              /* @__PURE__ */ jsx(TableHead, { children: "Next Evaluation Date" }),
              /* @__PURE__ */ jsx(TableHead, { children: "Last Updated" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Actions" })
            ] }) }),
            /* @__PURE__ */ jsxs(TableBody, { children: [
              filteredRows.map((row) => /* @__PURE__ */ jsxs(TableRow, { children: [
                /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "min-w-[180px]", children: [
                  /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                    row.resident.firstName,
                    " ",
                    row.resident.lastName
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                    "Room ",
                    row.resident.roomNumber,
                    row.resident.keyWorkers?.namedNurse ? ` · Named nurse ${row.resident.keyWorkers.namedNurse}` : ""
                  ] })
                ] }) }),
                /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "min-w-[220px]", children: [
                  /* @__PURE__ */ jsx(Link, { to: "/care-plans/$id", params: {
                    id: row.plan.id
                  }, className: "font-medium hover:text-primary hover:underline", children: row.plan.title }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground line-clamp-2 mt-1", children: row.plan.problem })
                ] }) }),
                /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: `gap-2 ${row.status.tone}`, children: [
                  /* @__PURE__ */ jsx("span", { className: `h-2 w-2 rounded-full ${row.status.dot}` }),
                  row.status.label
                ] }) }),
                /* @__PURE__ */ jsx(TableCell, { children: formatDate(row.plan.reviewDate) }),
                /* @__PURE__ */ jsx(TableCell, { children: formatDate(row.plan.evaluationDate) }),
                /* @__PURE__ */ jsx(TableCell, { children: formatDateTime(row.lastUpdated) }),
                /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
                  /* @__PURE__ */ jsx(Link, { to: "/care-plans/$id", params: {
                    id: row.plan.id
                  }, children: /* @__PURE__ */ jsx(Button, { size: "sm", children: "Open Care Plan" }) }),
                  /* @__PURE__ */ jsx(Link, { to: "/residents/$id", params: {
                    id: row.resident.id
                  }, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", children: "Open Resident" }) }),
                  can(currentRole, "careplan.evaluate") && row.plan.status !== "completed" && row.plan.status !== "archived" && row.plan.status !== "superseded" && /* @__PURE__ */ jsx(EvaluateDialog, { carePlanId: row.plan.id })
                ] }) })
              ] }, row.plan.id)),
              filteredRows.length === 0 && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 7, className: "py-10 text-center text-muted-foreground", children: "No care plans match the current workflow view." }) })
            ] })
          ] }) }) })
        ] }),
        tab === "governance" && governanceView && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-4", children: [
            /* @__PURE__ */ jsx(MetricCard, { title: "Overdue Reviews", value: governance.overdueReviews.length, icon: FileWarning, tone: "destructive" }),
            /* @__PURE__ */ jsx(MetricCard, { title: "Overdue Evaluations", value: governance.overdueEvaluations.length, icon: AlertTriangle, tone: "destructive" }),
            /* @__PURE__ */ jsx(MetricCard, { title: "Missing Care Plans", value: governance.missingCarePlans.length, icon: UserRound, tone: "warning" }),
            /* @__PURE__ */ jsx(MetricCard, { title: "Compliance %", value: `${governance.compliance}%`, icon: ClipboardCheck, tone: "success" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 xl:grid-cols-2", children: [
            /* @__PURE__ */ jsxs(Card, { children: [
              /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Action Required" }) }),
              /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
                /* @__PURE__ */ jsx(GovernanceList, { title: "Overdue Reviews", items: governance.overdueReviews.map((row) => ({
                  id: row.plan.id,
                  primary: row.plan.title,
                  secondary: `${row.resident.firstName} ${row.resident.lastName} · due ${formatDate(row.plan.reviewDate)}`
                })) }),
                /* @__PURE__ */ jsx(GovernanceList, { title: "Overdue Evaluations", items: governance.overdueEvaluations.map((row) => ({
                  id: row.plan.id,
                  primary: row.plan.title,
                  secondary: `${row.resident.firstName} ${row.resident.lastName} · due ${formatDate(row.plan.evaluationDate)}`
                })) }),
                /* @__PURE__ */ jsx(GovernanceResidentList, { title: "Missing Care Plans", residents: governance.missingCarePlans })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Card, { children: [
              /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Audit Statistics" }) }),
              /* @__PURE__ */ jsxs(CardContent, { className: "grid grid-cols-2 gap-3 text-sm", children: [
                /* @__PURE__ */ jsx(AuditStat, { label: "Care plan audit entries", value: governance.auditStats.total }),
                /* @__PURE__ */ jsx(AuditStat, { label: "Archived plans", value: governance.auditStats.archived }),
                /* @__PURE__ */ jsx(AuditStat, { label: "Revisions", value: governance.auditStats.revised }),
                /* @__PURE__ */ jsx(AuditStat, { label: "Evaluations logged", value: governance.auditStats.evaluations }),
                /* @__PURE__ */ jsx(AuditStat, { label: "Reviews logged", value: governance.auditStats.reviews })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 xl:grid-cols-2", children: [
            /* @__PURE__ */ jsx(DistributionCard, { title: "Care Plans by Wing", rows: governance.byWing }),
            /* @__PURE__ */ jsx(DistributionCard, { title: "Care Plans by Nurse", rows: governance.byNurse })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function QuickFilterButton({
  active,
  children,
  onClick
}) {
  return /* @__PURE__ */ jsx(Button, { size: "sm", variant: active ? "default" : "outline", onClick, children });
}
function StatusLegend({
  toneClass,
  label
}) {
  return /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2", children: [
    /* @__PURE__ */ jsx("span", { className: `h-2.5 w-2.5 rounded-full ${toneClass}` }),
    /* @__PURE__ */ jsx("span", { children: label })
  ] });
}
function MetricCard({
  title,
  value,
  icon: Icon,
  tone
}) {
  const toneClass = tone === "success" ? "text-emerald-700 bg-emerald-500/10" : tone === "warning" ? "text-amber-700 bg-amber-500/10" : "text-destructive bg-destructive/10";
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-start justify-between gap-3", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: title }),
      /* @__PURE__ */ jsx("div", { className: "text-3xl font-semibold mt-2", children: value })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `rounded-full p-2 ${toneClass}`, children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }) })
  ] }) });
}
function GovernanceList({
  title,
  items
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "text-sm font-semibold mb-2", children: [
      title,
      " (",
      items.length,
      ")"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      items.slice(0, 6).map((item) => /* @__PURE__ */ jsxs(Link, { to: "/care-plans/$id", params: {
        id: item.id
      }, className: "block rounded-md border p-3 hover:bg-muted/50", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: item.primary }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: item.secondary })
      ] }, item.id)),
      items.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "None." })
    ] })
  ] });
}
function GovernanceResidentList({
  title,
  residents
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "text-sm font-semibold mb-2", children: [
      title,
      " (",
      residents.length,
      ")"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      residents.slice(0, 6).map((resident) => /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
        id: resident.id
      }, className: "block rounded-md border p-3 hover:bg-muted/50", children: [
        /* @__PURE__ */ jsxs("div", { className: "font-medium text-sm", children: [
          resident.firstName,
          " ",
          resident.lastName
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
          "Room ",
          resident.roomNumber,
          " · ",
          resident.primaryDiagnosis
        ] })
      ] }, resident.id)),
      residents.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "All residents have an active care plan." })
    ] })
  ] });
}
function AuditStat({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-3", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold mt-1", children: value })
  ] });
}
function DistributionCard({
  title,
  rows
}) {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: title }) }),
    /* @__PURE__ */ jsx(CardContent, { className: "space-y-2", children: rows.map((row) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-md border px-3 py-2 text-sm", children: [
      /* @__PURE__ */ jsx("span", { children: row.name }),
      /* @__PURE__ */ jsx(Badge, { variant: "outline", children: row.count })
    ] }, row.name)) })
  ] });
}
export {
  CarePlansPage as component
};
