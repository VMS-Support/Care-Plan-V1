import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { K as Route, u as useCare, C as Card, e as CardContent, B as Badge, f as Button, a as can, b as CardHeader, d as CardTitle, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem, I as Input } from "./router-DLzRbDkQ.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BZBuOn5G.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter, a as DialogTrigger } from "./dialog-Dtfzkh6H.js";
import { L as Label } from "./label-6k_A62K1.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { P as Progress } from "./progress-CEouM73W.js";
import { ArrowLeft, Printer, AlertTriangle, Eye, ClipboardCheck, FileCheck2, GitBranch } from "lucide-react";
import { toast } from "sonner";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "@radix-ui/react-tabs";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "@radix-ui/react-progress";
function statusCls(status) {
  if (status === "active") return "bg-success/10 text-success border-success/30";
  if (status === "superseded") return "bg-muted text-muted-foreground";
  if (status === "completed") return "bg-info/10 text-info border-info/30";
  if (status.includes("overdue")) return "bg-destructive/10 text-destructive border-destructive/30";
  return "bg-warning/15 text-warning-foreground border-warning/40";
}
function EvaluateDialog({
  carePlanId,
  onRevisePrompt
}) {
  const {
    addCarePlanEvaluation,
    updateCarePlan,
    currentUserName,
    currentRole
  } = useCare();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    summary: "",
    goalsMet: "partially",
    outcomeRating: "good",
    residentFeedback: "",
    familyFeedback: "",
    recommendations: "",
    reviseRequired: false,
    signature: ""
  });
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", children: [
      /* @__PURE__ */ jsx(FileCheck2, { className: "h-3.5 w-3.5 mr-1.5" }),
      " Evaluate"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Evaluate Care Plan" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Evaluation summary" }),
          /* @__PURE__ */ jsx(Textarea, { value: form.summary, onChange: (event) => setForm({
            ...form,
            summary: event.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Goals met?" }),
            /* @__PURE__ */ jsxs(Select, { value: form.goalsMet, onValueChange: (value) => setForm({
              ...form,
              goalsMet: value
            }), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "yes", children: "Yes" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "partially", children: "Partially" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "no", children: "No" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Outcome" }),
            /* @__PURE__ */ jsxs(Select, { value: form.outcomeRating, onValueChange: (value) => setForm({
              ...form,
              outcomeRating: value
            }), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "excellent", children: "Excellent" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "good", children: "Good" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "some", children: "Some improvement" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "no", children: "No change" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "deterioration", children: "Deterioration" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Resident feedback" }),
            /* @__PURE__ */ jsx(Textarea, { rows: 2, value: form.residentFeedback, onChange: (event) => setForm({
              ...form,
              residentFeedback: event.target.value
            }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Family feedback" }),
            /* @__PURE__ */ jsx(Textarea, { rows: 2, value: form.familyFeedback, onChange: (event) => setForm({
              ...form,
              familyFeedback: event.target.value
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Recommendations" }),
          /* @__PURE__ */ jsx(Textarea, { value: form.recommendations, onChange: (event) => setForm({
            ...form,
            recommendations: event.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.reviseRequired, onChange: (event) => setForm({
            ...form,
            reviseRequired: event.target.checked
          }) }),
          "Revise care plan (creates new version, supersedes this one)"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Electronic signature (type your full name)" }),
          /* @__PURE__ */ jsx(Input, { value: form.signature, onChange: (event) => setForm({
            ...form,
            signature: event.target.value
          }), placeholder: currentUserName })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { disabled: !form.summary || !form.signature, onClick: () => {
          addCarePlanEvaluation({
            carePlanId,
            date: (/* @__PURE__ */ new Date()).toISOString(),
            evaluatedBy: currentUserName,
            role: currentRole,
            ...form,
            signature: form.signature || currentUserName,
            locked: true,
            nextEvaluationDate: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10)
          });
          if (form.reviseRequired) {
            updateCarePlan(carePlanId, {
              status: "review_due"
            });
          }
          toast.success("Evaluation locked and signed");
          setOpen(false);
          setTimeout(onRevisePrompt, 250);
        }, children: "Sign & Save" })
      ] })
    ] })
  ] });
}
function LogInterventionDialog({
  carePlanId,
  residentId,
  interventionsSpec
}) {
  const {
    addInterventionLog,
    currentUserName,
    currentRole
  } = useCare();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    interventionSpecId: interventionsSpec[0]?.id || "",
    outcome: "completed",
    residentResponse: "",
    comments: "",
    followUpRequired: false,
    signature: ""
  });
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", children: [
      /* @__PURE__ */ jsx(ClipboardCheck, { className: "h-3.5 w-3.5 mr-1.5" }),
      " Log Intervention"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-lg", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Log intervention delivery" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        interventionsSpec.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Intervention" }),
          /* @__PURE__ */ jsxs(Select, { value: form.interventionSpecId, onValueChange: (value) => setForm({
            ...form,
            interventionSpecId: value
          }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: interventionsSpec.map((item) => /* @__PURE__ */ jsxs(SelectItem, { value: item.id, children: [
              item.name,
              " (",
              item.frequency,
              ")"
            ] }, item.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Outcome" }),
          /* @__PURE__ */ jsxs(Select, { value: form.outcome, onValueChange: (value) => setForm({
            ...form,
            outcome: value
          }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "completed", children: "Completed" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "partially_completed", children: "Partially completed" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "missed", children: "Missed" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "refused", children: "Refused by resident" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "escalated", children: "Escalated" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "cancelled", children: "Cancelled" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Resident response" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: form.residentResponse, onChange: (event) => setForm({
            ...form,
            residentResponse: event.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Comments" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: form.comments, onChange: (event) => setForm({
            ...form,
            comments: event.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.followUpRequired, onChange: (event) => setForm({
            ...form,
            followUpRequired: event.target.checked
          }) }),
          "Follow-up required"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Signature" }),
          /* @__PURE__ */ jsx(Input, { value: form.signature, onChange: (event) => setForm({
            ...form,
            signature: event.target.value
          }), placeholder: currentUserName })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => {
          const now = /* @__PURE__ */ new Date();
          addInterventionLog({
            carePlanId,
            residentId,
            interventionSpecId: form.interventionSpecId || void 0,
            date: now.toISOString().slice(0, 10),
            time: now.toISOString().slice(11, 16),
            staff: currentUserName,
            role: currentRole,
            outcome: form.outcome,
            residentResponse: form.residentResponse,
            comments: form.comments,
            followUpRequired: form.followUpRequired,
            signature: form.signature || currentUserName
          });
          toast.success("Intervention logged");
          setOpen(false);
        }, children: "Save" })
      ] })
    ] })
  ] });
}
function ReviseDialog({
  carePlanId
}) {
  const {
    reviseCarePlan
  } = useCare();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", children: [
      /* @__PURE__ */ jsx(GitBranch, { className: "h-3.5 w-3.5 mr-1.5" }),
      " Revise"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Revise care plan" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "A new version will be created and this one will be marked as superseded." }),
      /* @__PURE__ */ jsx(Textarea, { placeholder: "Reason for revision…", value: reason, onChange: (event) => setReason(event.target.value) }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { disabled: !reason.trim(), onClick: () => {
          reviseCarePlan(carePlanId, reason);
          toast.success("New care plan version created");
          setOpen(false);
        }, children: "Revise" })
      ] })
    ] })
  ] });
}
function CarePlanDetail() {
  const {
    id
  } = Route.useParams();
  const {
    carePlans,
    residents,
    carePlanEvaluations,
    carePlanReviews,
    interventions,
    notes,
    tasks,
    currentRole,
    interventionLogs,
    readReceipts,
    recordReadReceipt,
    reviseCarePlan,
    incidents,
    mdtNotes,
    assessments
  } = useCare();
  const plan = carePlans.find((item) => item.id === id);
  const [revisePromptOpen, setRevisePromptOpen] = useState(false);
  const [reviseReason, setReviseReason] = useState("");
  useEffect(() => {
    if (plan) {
      recordReadReceipt("care_plan", plan.id);
    }
  }, [plan, recordReadReceipt]);
  if (!plan) {
    return /* @__PURE__ */ jsxs("div", { className: "p-8", children: [
      "Care plan not found.",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/care-plans", className: "text-primary underline", children: "Back" })
    ] });
  }
  const resident = residents.find((item) => item.id === plan.residentId);
  const evals = carePlanEvaluations.filter((item) => item.carePlanId === id).sort((a, b) => b.date.localeCompare(a.date));
  const reviews = carePlanReviews.filter((item) => item.carePlanId === id).sort((a, b) => b.date.localeCompare(a.date));
  const linkedInterventions = interventions.filter((item) => item.carePlanId === id);
  const linkedNotes = notes.filter((item) => item.residentId === plan.residentId).slice(0, 10);
  const linkedTasks = tasks.filter((item) => item.linkedCarePlanId === id && item.status !== "deleted");
  const planLogs = interventionLogs.filter((item) => item.carePlanId === id);
  const linkedIncidents = incidents.filter((item) => item.linkedCarePlanId === id || item.residentId === plan.residentId).slice(0, 10);
  const linkedMDT = mdtNotes.filter((item) => item.linkedCarePlanId === id || item.residentId === plan.residentId).slice(0, 10);
  const linkedDaily = notes.filter((item) => item.linkedCarePlanId === id).slice(0, 10);
  const linkedAssessment = plan.linkedAssessmentId ? assessments.find((item) => item.id === plan.linkedAssessmentId) : null;
  const linkedAssessments = assessments.filter((item) => item.residentId === plan.residentId).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const planReceipts = readReceipts.filter((item) => item.entityId === id);
  const versions = carePlans.filter((item) => item.id === id || item.supersedesId === id || item.id === plan.supersedesId).sort((a, b) => (b.version || 1) - (a.version || 1));
  const governanceView = currentRole === "cnm" || currentRole === "don";
  const scheduledInterventions = (plan.interventionsSpec || []).filter((item) => item.status !== "cancelled");
  const overdueReview = plan.status === "active" && new Date(plan.reviewDate) < /* @__PURE__ */ new Date();
  const overdueEvaluation = plan.status === "active" && !!plan.evaluationDate && new Date(plan.evaluationDate) < /* @__PURE__ */ new Date();
  const compliance = useMemo(() => {
    const total = planLogs.length;
    const completed = planLogs.filter((item) => item.outcome === "completed").length;
    const partial = planLogs.filter((item) => item.outcome === "partially_completed").length;
    const missed = planLogs.filter((item) => item.outcome === "missed").length;
    const refused = planLogs.filter((item) => item.outcome === "refused").length;
    const late = planLogs.filter((item) => item.late).length;
    const pct = total === 0 ? 0 : Math.round((completed + partial * 0.5) / total * 100);
    return {
      total,
      completed,
      partial,
      missed,
      refused,
      late,
      pct
    };
  }, [planLogs]);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-7xl", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/care-plans", className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      " All care plans"
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: plan.title }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `capitalize ${statusCls(plan.status)}`, children: plan.status.replace("_", " ") }),
            plan.priority && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: plan.priority }),
            /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-[10px]", children: [
              "v",
              plan.version || 1
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground mt-1", children: resident ? `${resident.firstName} ${resident.lastName} · Room ${resident.roomNumber}` : "Resident unavailable" }),
          plan.category && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "Category: ",
            plan.category
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap", children: [
          resident && /* @__PURE__ */ jsx(Link, { to: "/residents/$id", params: {
            id: resident.id
          }, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", children: "Open Resident" }) }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => window.print(), children: [
            /* @__PURE__ */ jsx(Printer, { className: "h-3.5 w-3.5 mr-1.5" }),
            " Print / PDF"
          ] }),
          can(currentRole, "intervention.create") && plan.status === "active" && /* @__PURE__ */ jsx(LogInterventionDialog, { carePlanId: plan.id, residentId: plan.residentId, interventionsSpec: plan.interventionsSpec || [] }),
          can(currentRole, "careplan.evaluate") && plan.status === "active" && /* @__PURE__ */ jsx(EvaluateDialog, { carePlanId: plan.id, onRevisePrompt: () => setRevisePromptOpen(true) }),
          can(currentRole, "careplan.revise") && plan.status === "active" && /* @__PURE__ */ jsx(ReviseDialog, { carePlanId: plan.id })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-5 mt-4", children: [
        /* @__PURE__ */ jsx(HeaderMeta, { label: "Status", value: plan.status.replace("_", " ") }),
        /* @__PURE__ */ jsx(HeaderMeta, { label: "Created Date", value: plan.createdAt.slice(0, 10) }),
        /* @__PURE__ */ jsx(HeaderMeta, { label: "Next Review Date", value: plan.reviewDate }),
        /* @__PURE__ */ jsx(HeaderMeta, { label: "Next Evaluation Date", value: plan.evaluationDate || "—" }),
        /* @__PURE__ */ jsx(HeaderMeta, { label: "Last Updated", value: (plan.updatedAt || plan.createdAt).slice(0, 10) })
      ] }),
      overdueReview && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 text-destructive p-2 text-sm", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
        " Review overdue (was due ",
        plan.reviewDate,
        ")"
      ] }),
      overdueEvaluation && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 text-destructive p-2 text-sm", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
        " Evaluation overdue (was due",
        " ",
        plan.evaluationDate,
        ")"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "care", className: "space-y-4", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "flex-wrap h-auto", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "care", children: "Care Plan" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "timeline", children: "Timelines" }),
        governanceView && /* @__PURE__ */ jsx(TabsTrigger, { value: "governance", children: "Governance" })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "care", className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 xl:grid-cols-2", children: [
          /* @__PURE__ */ jsxs(DetailCard, { title: "Problem Statement", children: [
            /* @__PURE__ */ jsx("p", { children: plan.problemStatement || plan.problem }),
            plan.identifiedNeeds && plan.identifiedNeeds.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 pt-3", children: plan.identifiedNeeds.map((need) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px]", children: need }, need)) })
          ] }),
          /* @__PURE__ */ jsx(DetailCard, { title: "Goals", children: plan.goals && plan.goals.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: plan.goals.map((goal) => /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium", children: goal.title }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize text-[10px]", children: goal.status.replace("_", " ") }),
                /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "capitalize text-[10px]", children: goal.priority })
              ] })
            ] }),
            goal.description && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: goal.description }),
            goal.targetDate && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-2", children: [
              "Target date: ",
              goal.targetDate
            ] })
          ] }, goal.id)) }) : /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { children: plan.goal }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-2", children: "No structured SMART goals recorded yet." })
          ] }) }),
          /* @__PURE__ */ jsx(DetailCard, { title: "Interventions", children: /* @__PURE__ */ jsx("ul", { className: "list-disc pl-5 space-y-1", children: plan.interventions.map((intervention, index) => /* @__PURE__ */ jsx("li", { children: intervention }, index)) }) }),
          /* @__PURE__ */ jsx(DetailCard, { title: "Scheduled Interventions", children: scheduledInterventions.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: scheduledInterventions.map((item) => /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium", children: item.name }),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize text-[10px]", children: item.status.replace("_", " ") })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground mt-1", children: item.frequency }),
            (item.assignedUser || item.assignedRole) && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
              "Assigned: ",
              item.assignedUser || item.assignedRole
            ] }),
            item.description && /* @__PURE__ */ jsx("p", { className: "text-sm mt-2", children: item.description })
          ] }, item.id)) }) : linkedTasks.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: linkedTasks.map((task) => /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: task.title }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
              "Due ",
              task.dueDate || "not scheduled",
              " · ",
              task.assignedTo,
              " · ",
              task.status
            ] })
          ] }, task.id)) }) : /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No scheduled interventions recorded yet." }) })
        ] }),
        /* @__PURE__ */ jsx(DetailCard, { title: "Linked Assessments", children: linkedAssessments.length > 0 ? /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3", children: linkedAssessments.map((assessment) => /* @__PURE__ */ jsxs(Link, { to: "/assessments/$assessmentId", params: {
          assessmentId: assessment.id
        }, className: "rounded-md border p-3 hover:bg-muted/50", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium uppercase", children: assessment.type.replace("_", " ") }),
            assessment.id === linkedAssessment?.id && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px]", children: "Primary Link" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground mt-2", children: [
            assessment.date.slice(0, 10),
            " · Score ",
            assessment.totalScore
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-sm mt-1", children: assessment.interpretation })
        ] }, assessment.id)) }) : /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No linked assessments." }) })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "timeline", className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 xl:grid-cols-2", children: [
          /* @__PURE__ */ jsxs(DetailCard, { title: `Evaluations Timeline (${evals.length})`, children: [
            evals.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No evaluations recorded." }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3", children: evals.map((evaluation) => /* @__PURE__ */ jsxs(TimelineCard, { title: `${evaluation.date.slice(0, 10)} · ${evaluation.evaluatedBy}`, badge: evaluation.outcomeRating, subtitle: evaluation.role ? `Role: ${evaluation.role}` : void 0, children: [
              /* @__PURE__ */ jsx("p", { children: evaluation.summary }),
              evaluation.recommendations && /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground mt-2", children: [
                /* @__PURE__ */ jsx("strong", { children: "Recommendations:" }),
                " ",
                evaluation.recommendations
              ] })
            ] }, evaluation.id)) })
          ] }),
          /* @__PURE__ */ jsxs(DetailCard, { title: `Reviews Timeline (${reviews.length})`, children: [
            reviews.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No multidisciplinary reviews recorded." }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3", children: reviews.map((review) => /* @__PURE__ */ jsx(TimelineCard, { title: `${review.date.slice(0, 10)} · ${review.reviewer}`, badge: review.outcome.replace("_", " "), subtitle: review.role ? `Role: ${review.role}` : void 0, children: /* @__PURE__ */ jsx("p", { children: review.notes }) }, review.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(DetailCard, { title: `Recent Delivery Log (${planLogs.length})`, children: [
          planLogs.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No intervention deliveries logged yet." }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3", children: planLogs.map((log) => {
            const spec = plan.interventionsSpec?.find((item) => item.id === log.interventionSpecId);
            return /* @__PURE__ */ jsxs(TimelineCard, { title: `${log.date} ${log.time} · ${spec?.name || "Intervention"}`, badge: log.outcome.replace("_", " "), subtitle: `${log.staff}${log.role ? ` · ${log.role}` : ""}`, children: [
              log.residentResponse && /* @__PURE__ */ jsxs("p", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Resident:" }),
                " ",
                log.residentResponse
              ] }),
              log.comments && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: log.comments }),
              log.followUpRequired && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "mt-2 text-[10px]", children: "Follow-up required" })
            ] }, log.id);
          }) })
        ] })
      ] }),
      governanceView && /* @__PURE__ */ jsxs(TabsContent, { value: "governance", className: "space-y-4", children: [
        compliance.total > 0 && /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Intervention Compliance" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm gap-3 flex-wrap", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                compliance.pct,
                "% compliance across ",
                compliance.total,
                " delivery log",
                compliance.total !== 1 ? "s" : ""
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground", children: [
                "Late: ",
                compliance.late
              ] })
            ] }),
            /* @__PURE__ */ jsx(Progress, { value: compliance.pct, className: "h-2" }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { className: "text-success", children: compliance.completed }),
                " completed"
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { children: compliance.partial }),
                " partial"
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { className: "text-destructive", children: compliance.missed }),
                " missed"
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { children: compliance.refused }),
                " refused"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 xl:grid-cols-2", children: [
          /* @__PURE__ */ jsx(DetailCard, { title: `Versions (${versions.length})`, children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: versions.map((version) => /* @__PURE__ */ jsxs("div", { className: `rounded-md border p-3 ${version.id === plan.id ? "border-primary/50" : ""}`, children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                  "v",
                  version.version || 1
                ] }),
                " ·",
                " ",
                version.title,
                version.id === plan.id && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-2 text-[10px]", children: "Current" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `capitalize text-[10px] ${statusCls(version.status)}`, children: version.status.replace("_", " ") }),
                version.id !== plan.id && /* @__PURE__ */ jsx(Link, { to: "/care-plans/$id", params: {
                  id: version.id
                }, className: "text-xs text-primary hover:underline", children: "View" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
              "Created ",
              version.createdAt.slice(0, 10),
              " by ",
              version.createdBy
            ] }),
            version.revisionReason && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground italic mt-1", children: [
              "Reason: ",
              version.revisionReason
            ] })
          ] }, version.id)) }) }),
          /* @__PURE__ */ jsxs(DetailCard, { title: `Read Receipts (${planReceipts.length})`, children: [
            planReceipts.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No reads recorded yet." }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3", children: planReceipts.map((receipt) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-md border p-3 text-sm gap-3 flex-wrap", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4 text-muted-foreground" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: receipt.userName }),
                /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] capitalize", children: receipt.role })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: receipt.timestamp.slice(0, 16).replace("T", " ") })
            ] }, receipt.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 xl:grid-cols-2", children: [
          /* @__PURE__ */ jsx(EvidenceSection, { title: `Linked Tasks (${linkedTasks.length})`, items: linkedTasks.map((task) => ({
            id: task.id,
            title: task.title,
            sub: `Due ${task.dueDate} · ${task.status}`
          })) }),
          /* @__PURE__ */ jsx(EvidenceSection, { title: `Linked Daily Notes (${linkedDaily.length})`, items: linkedDaily.map((note) => ({
            id: note.id,
            title: note.date.slice(0, 10),
            sub: `${note.staff} · ${note.observation}`
          })) }),
          /* @__PURE__ */ jsx(EvidenceSection, { title: `Linked Incidents (${linkedIncidents.length})`, items: linkedIncidents.map((incident) => ({
            id: incident.id,
            title: incident.type,
            sub: `${incident.date} · ${incident.severity}`
          })) }),
          /* @__PURE__ */ jsx(EvidenceSection, { title: `Linked MDT Notes (${linkedMDT.length})`, items: linkedMDT.map((note) => ({
            id: note.id,
            title: note.discussion.slice(0, 60),
            sub: `${note.date} · ${note.authoredBy}`
          })) }),
          /* @__PURE__ */ jsx(EvidenceSection, { title: `Recent Resident Notes (${linkedNotes.length})`, items: linkedNotes.map((note) => ({
            id: note.id,
            title: note.date.slice(0, 10),
            sub: `${note.staff} · ${note.observation.slice(0, 80)}`
          })) }),
          /* @__PURE__ */ jsx(EvidenceSection, { title: `Logged Interventions (${linkedInterventions.length})`, items: linkedInterventions.map((item) => ({
            id: item.id,
            title: item.intervention,
            sub: `${item.date.slice(0, 10)} · ${item.outcome} · ${item.staff}`
          })) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: revisePromptOpen, onOpenChange: setRevisePromptOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Revise this care plan?" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "An evaluation has been signed. Would you like to revise this care plan now? A new version will be created and this one will be superseded." }),
      /* @__PURE__ */ jsx(Textarea, { placeholder: "Reason for revision…", value: reviseReason, onChange: (event) => setReviseReason(event.target.value) }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => {
          setRevisePromptOpen(false);
          setReviseReason("");
        }, children: "Not now" }),
        /* @__PURE__ */ jsx(Button, { disabled: !reviseReason.trim(), onClick: () => {
          reviseCarePlan(plan.id, reviseReason);
          toast.success("New care plan version created");
          setRevisePromptOpen(false);
          setReviseReason("");
        }, children: "Revise" })
      ] })
    ] }) })
  ] });
}
function HeaderMeta({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border px-3 py-2", children: [
    /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "font-medium mt-1 capitalize", children: value })
  ] });
}
function DetailCard({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: title }) }),
    /* @__PURE__ */ jsx(CardContent, { className: "text-sm space-y-2", children })
  ] });
}
function TimelineCard({
  title,
  subtitle,
  badge,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium", children: title }),
        subtitle && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: subtitle })
      ] }),
      badge && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize text-[10px]", children: badge })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-2 text-sm", children })
  ] });
}
function EvidenceSection({
  title,
  items,
  emptyText
}) {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: title }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "divide-y text-sm", children: [
      items.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: emptyText ?? "None." }),
      items.map((item) => /* @__PURE__ */ jsxs("div", { className: "py-1.5", children: [
        item.to ? /* @__PURE__ */ jsx(Link, { to: item.to.route, params: item.to.params, className: "font-medium text-primary hover:underline", children: item.title }) : /* @__PURE__ */ jsx("div", { className: "font-medium", children: item.title }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: item.sub })
      ] }, item.id))
    ] })
  ] });
}
export {
  CarePlanDetail as component
};
