import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { L as Route, u as useCare, M as assessmentItems, N as uniformScale, x as assessmentMeta, n as deriveStatus, a as can, f as Button, C as Card, e as CardContent, B as Badge, G as statusBadgeCls, y as riskBadgeCls, b as CardHeader, d as CardTitle, O as suggestTemplatesFor } from "./router-DLzRbDkQ.js";
import { S as Separator } from "./separator-DA6AZJaG.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter, a as DialogTrigger } from "./dialog-Dtfzkh6H.js";
import { ArrowLeft, Lock, GitBranch, Printer, FileDown, Sparkles, ClipboardPlus, CalendarPlus, Archive, RotateCcw, Trash2, TrendingDown, TrendingUp, Minus, MessageSquare, History } from "lucide-react";
import { toast } from "sonner";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
function ReasonDialog({
  trigger,
  title,
  label,
  variant = "default",
  onConfirm
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: (o) => {
    setOpen(o);
    if (!o) setReason("");
  }, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: title }) }),
      /* @__PURE__ */ jsx(Textarea, { placeholder: `Reason…`, value: reason, onChange: (e) => setReason(e.target.value) }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { variant, disabled: !reason.trim(), onClick: () => {
          onConfirm(reason);
          setOpen(false);
        }, children: label })
      ] })
    ] })
  ] });
}
function AssessmentDetail() {
  const {
    assessmentId
  } = Route.useParams();
  const navigate = useNavigate();
  const {
    assessments,
    residents,
    carePlans,
    interventions,
    tasks,
    incidents,
    mdtNotes,
    currentRole,
    addCarePlan,
    addTask,
    carePlanTemplates,
    addCarePlanFromTemplate,
    addAssessmentComment,
    archiveAssessment,
    restoreAssessment,
    softDeleteAssessment,
    createAssessmentRevision
  } = useCare();
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [comment, setComment] = useState("");
  const a = assessments.find((x) => x.id === assessmentId);
  const r = a ? residents.find((x) => x.id === a.residentId) : null;
  const items = a ? assessmentItems[a.type] : [];
  const scale = a ? uniformScale(a.type) : null;
  const versionChain = useMemo(() => {
    if (!a) return [];
    return assessments.filter((x) => x.residentId === a.residentId && x.type === a.type).sort((x, y) => (y.version || 1) - (x.version || 1));
  }, [assessments, a]);
  const history = useMemo(() => {
    if (!a) return [];
    return assessments.filter((x) => x.residentId === a.residentId && x.type === a.type && x.status === "completed").sort((x, y) => y.date.localeCompare(x.date));
  }, [assessments, a]);
  const prev = history.find((x) => x.id !== a?.id && x.date < (a?.date || ""));
  const delta = a && prev ? a.totalScore - prev.totalScore : null;
  const trend = delta === null ? null : delta === 0 ? "Stable" : delta > 0 ? "Deteriorated" : "Improved";
  const linkedCP = a ? carePlans.filter((c) => c.linkedAssessmentId === a.id) : [];
  const linkedI = a ? interventions.filter((i) => i.linkedAssessmentId === a.id) : [];
  const linkedT = a ? tasks.filter((t) => t.linkedAssessmentId === a.id && t.status !== "deleted") : [];
  const linkedIn = a ? incidents.filter((i) => i.linkedAssessmentId === a.id) : [];
  const linkedM = a ? mdtNotes.filter((m) => m.linkedAssessmentId === a.id) : [];
  if (!a || !r) return /* @__PURE__ */ jsx("div", { className: "p-8", children: "Assessment not found." });
  const meta = assessmentMeta[a.type];
  const ds = deriveStatus(a);
  const audit = a.auditTrail || [];
  const comments = a.clinicalComments || [];
  function createCarePlanFromAssessment() {
    if (!a || !r) return;
    addCarePlan({
      residentId: r.id,
      title: `Care Plan from ${meta.name}`,
      category: meta.category,
      problem: `${meta.name} ${a.totalScore} — ${a.interpretation}`,
      goal: a.recommendations || "Address risks identified in assessment.",
      identifiedNeeds: [meta.category],
      interventions: ["Initial review", "Targeted interventions", "Reassess at review date"],
      assignedStaff: "Nursing team",
      frequency: "Per care plan",
      reviewDate: a.reviewDate || new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
      status: "active",
      priority: a.riskLevel === "very_high" ? "critical" : a.riskLevel === "high" ? "high" : "medium",
      linkedAssessmentId: a.id
    });
    toast.success("Care plan created");
  }
  function scheduleReassessment() {
    if (!a || !r) return;
    addTask({
      residentId: r.id,
      title: `Reassessment due: ${meta.name}`,
      assignedTo: "Nursing team",
      dueDate: a.nextReassessmentDate || new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
      status: "pending",
      linkedAssessmentId: a.id
    });
    toast.success("Reassessment scheduled");
  }
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-6xl print:p-0", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/residents/$id/assessments", params: {
      id: r.id
    }, className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 print:hidden", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      " Back to Assessment Centre"
    ] }),
    a.locked && /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-success/30 bg-success/5 p-3 flex items-start gap-2 text-sm print:hidden", children: [
      /* @__PURE__ */ jsx(Lock, { className: "h-4 w-4 text-success mt-0.5" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium", children: "This assessment is locked" }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          "Locked by ",
          a.lockedBy || a.assessor,
          " on ",
          (a.lockedAt || a.date).slice(0, 16).replace("T", " "),
          ". Content cannot be edited — create a revision to update."
        ] })
      ] }),
      can(currentRole, "assessment.create_revision") && !a.supersededById && /* @__PURE__ */ jsx(ReasonDialog, { trigger: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", children: [
        /* @__PURE__ */ jsx(GitBranch, { className: "h-3.5 w-3.5 mr-1.5" }),
        " Create Revision"
      ] }), title: "Create assessment revision", label: "Revise", onConfirm: (reason) => {
        const rev = createAssessmentRevision(a.id, reason);
        if (rev) {
          toast.success("Revision created");
          navigate({
            to: "/assessments/$assessmentId",
            params: {
              assessmentId: rev.id
            }
          });
        }
      } })
    ] }),
    a.supersededById && /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-warning/30 bg-warning/5 p-3 text-sm print:hidden", children: [
      "This version has been superseded by a newer revision.",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/assessments/$assessmentId", params: {
        assessmentId: a.supersededById
      }, className: "text-primary underline", children: "View latest →" })
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold", children: meta.name }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `capitalize ${statusBadgeCls(ds)}`, children: ds }),
            a.version && a.version > 1 && /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-[10px]", children: [
              "v",
              a.version
            ] }),
            a.locked && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [
              /* @__PURE__ */ jsx(Lock, { className: "h-2.5 w-2.5 mr-1" }),
              "Locked"
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
            id: r.id
          }, className: "text-sm text-primary hover:underline", children: [
            r.firstName,
            " ",
            r.lastName,
            " · Room ",
            r.roomNumber
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: meta.description }),
          a.revisionReason && /* @__PURE__ */ jsxs("p", { className: "text-xs italic mt-1 text-muted-foreground", children: [
            /* @__PURE__ */ jsx("strong", { children: "Revision reason:" }),
            " ",
            a.revisionReason
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-4xl font-semibold tabular-nums", children: [
            a.totalScore,
            meta.max ? /* @__PURE__ */ jsxs("span", { className: "text-base text-muted-foreground", children: [
              "/",
              meta.max
            ] }) : null
          ] }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `mt-1 ${riskBadgeCls(a.riskLevel)}`, children: a.interpretation })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Separator, { className: "my-4" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 text-sm", children: [
        /* @__PURE__ */ jsx(Info, { label: "Completed By", value: a.assessor }),
        /* @__PURE__ */ jsx(Info, { label: "Role", value: a.assessorRole || "—" }),
        /* @__PURE__ */ jsx(Info, { label: "Date", value: a.date.slice(0, 10) }),
        /* @__PURE__ */ jsx(Info, { label: "Category", value: a.category || meta.category }),
        /* @__PURE__ */ jsx(Info, { label: "Review Frequency", value: a.reviewFrequency || "—" }),
        /* @__PURE__ */ jsx(Info, { label: "Next Reassessment", value: a.nextReassessmentDate || "—" }),
        /* @__PURE__ */ jsx(Info, { label: "Version", value: String(a.version || 1) }),
        /* @__PURE__ */ jsx(Info, { label: "Risk Level", value: a.riskLevel })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mt-4 print:hidden", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => window.print(), children: [
          /* @__PURE__ */ jsx(Printer, { className: "h-3.5 w-3.5 mr-1.5" }),
          " Print"
        ] }),
        /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => window.print(), children: [
          /* @__PURE__ */ jsx(FileDown, { className: "h-3.5 w-3.5 mr-1.5" }),
          " Export PDF"
        ] }),
        can(currentRole, "careplan.create") && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(Button, { variant: "default", size: "sm", onClick: () => setSuggestOpen(true), children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5 mr-1.5" }),
            " Suggest Care Plan"
          ] }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: createCarePlanFromAssessment, children: [
            /* @__PURE__ */ jsx(ClipboardPlus, { className: "h-3.5 w-3.5 mr-1.5" }),
            " Blank Care Plan"
          ] })
        ] }),
        can(currentRole, "task.create") && /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: scheduleReassessment, children: [
          /* @__PURE__ */ jsx(CalendarPlus, { className: "h-3.5 w-3.5 mr-1.5" }),
          " Schedule Reassessment"
        ] }),
        a.status === "completed" && !a.supersededById && can(currentRole, "assessment.archive") && /* @__PURE__ */ jsx(ReasonDialog, { trigger: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", children: [
          /* @__PURE__ */ jsx(Archive, { className: "h-3.5 w-3.5 mr-1.5" }),
          " Archive"
        ] }), title: "Archive assessment", label: "Archive", onConfirm: (reason) => {
          archiveAssessment(a.id, reason);
          toast.success("Archived");
        } }),
        (a.status === "archived" || a.status === "deleted") && can(currentRole, "assessment.restore") && /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
          restoreAssessment(a.id);
          toast.success("Restored");
        }, children: [
          /* @__PURE__ */ jsx(RotateCcw, { className: "h-3.5 w-3.5 mr-1.5" }),
          " Restore"
        ] }),
        a.status !== "deleted" && can(currentRole, "assessment.delete") && /* @__PURE__ */ jsx(ReasonDialog, { trigger: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", className: "text-destructive", children: [
          /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5 mr-1.5" }),
          " Delete"
        ] }), title: "Delete assessment (audited)", label: "Delete", variant: "destructive", onConfirm: (reason) => {
          softDeleteAssessment(a.id, reason);
          toast.success("Deleted (audited)");
        } })
      ] })
    ] }) }),
    (a.interpretation || a.recommendations || a.notes) && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Assessment Summary" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3 text-sm", children: [
        /* @__PURE__ */ jsx(Row, { label: "Outcome", value: a.interpretation }),
        /* @__PURE__ */ jsx(Row, { label: "Risk Category", value: a.riskLevel }),
        a.recommendations && /* @__PURE__ */ jsx(Row, { label: "Clinical Recommendations", value: a.recommendations }),
        a.notes && /* @__PURE__ */ jsx(Row, { label: "Notes", value: a.notes })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Questions & Answers" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "text-xs uppercase text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Category" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Selected" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "Score" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y", children: [
          items.map((it) => {
            const val = a.scores[it.key];
            const options = scale ? scale : it.options || [];
            const opt = options.find((o) => o[0] === val);
            return /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "p-2", children: it.label }),
              /* @__PURE__ */ jsx("td", { className: "p-2 text-muted-foreground", children: opt ? opt[1] : val === void 0 ? "—" : String(val) }),
              /* @__PURE__ */ jsx("td", { className: "p-2 text-right font-medium tabular-nums", children: val ?? "—" })
            ] }, it.key);
          }),
          /* @__PURE__ */ jsxs("tr", { className: "bg-muted/50 font-semibold", children: [
            /* @__PURE__ */ jsx("td", { className: "p-2", children: "Total" }),
            /* @__PURE__ */ jsx("td", { className: "p-2" }),
            /* @__PURE__ */ jsxs("td", { className: "p-2 text-right tabular-nums", children: [
              a.totalScore,
              meta.max ? `/${meta.max}` : ""
            ] })
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Score History & Trend" }),
        trend && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Previous: ",
          /* @__PURE__ */ jsx("strong", { children: prev?.totalScore }),
          " · Δ ",
          /* @__PURE__ */ jsxs("strong", { children: [
            delta > 0 ? "+" : "",
            delta
          ] }),
          " · ",
          " ",
          /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 font-medium", children: [
            trend === "Improved" && /* @__PURE__ */ jsx(TrendingDown, { className: "h-3 w-3 text-success" }),
            trend === "Deteriorated" && /* @__PURE__ */ jsx(TrendingUp, { className: "h-3 w-3 text-destructive" }),
            trend === "Stable" && /* @__PURE__ */ jsx(Minus, { className: "h-3 w-3" }),
            trend
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: history.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No prior records." }) : /* @__PURE__ */ jsx("div", { className: "divide-y text-sm", children: history.map((h) => /* @__PURE__ */ jsxs(Link, { to: "/assessments/$assessmentId", params: {
        assessmentId: h.id
      }, className: "flex items-center justify-between py-2 hover:bg-muted/40 px-2 -mx-2 rounded", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium tabular-nums", children: h.totalScore }),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground ml-2 text-xs", children: h.interpretation })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          "v",
          h.version || 1,
          " · ",
          h.date.slice(0, 10),
          " · ",
          h.assessor
        ] })
      ] }, h.id)) }) })
    ] }),
    versionChain.length > 1 && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(GitBranch, { className: "h-4 w-4" }),
        " Version History"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "divide-y text-sm", children: versionChain.map((v) => /* @__PURE__ */ jsxs(Link, { to: "/assessments/$assessmentId", params: {
        assessmentId: v.id
      }, className: `flex items-center gap-2 py-2 hover:bg-muted/40 px-2 -mx-2 rounded ${v.id === a.id ? "bg-accent/30" : ""}`, children: [
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [
          "v",
          v.version || 1
        ] }),
        /* @__PURE__ */ jsx("span", { className: "font-medium tabular-nums", children: v.totalScore }),
        /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `text-[10px] capitalize ${statusBadgeCls(deriveStatus(v))}`, children: deriveStatus(v) }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground flex-1", children: [
          v.date.slice(0, 10),
          " · ",
          v.assessor
        ] }),
        v.revisionReason && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground italic truncate max-w-[14rem]", children: [
          '"',
          v.revisionReason,
          '"'
        ] })
      ] }, v.id)) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(MessageSquare, { className: "h-4 w-4" }),
        " Clinical Comments (",
        comments.length,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        comments.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "No clinical comments yet." }),
        comments.map((c) => /* @__PURE__ */ jsxs("div", { className: "border-l-2 border-primary/30 pl-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: c.authorName }),
            " (",
            c.role,
            ") · ",
            c.at.slice(0, 16).replace("T", " ")
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-sm mt-1 whitespace-pre-wrap", children: c.body })
        ] }, c.id)),
        can(currentRole, "assessment.comment") && /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t print:hidden", children: [
          /* @__PURE__ */ jsx(Textarea, { placeholder: "Add clinical comment (visible to all authorised staff, audited)…", value: comment, onChange: (e) => setComment(e.target.value) }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end mt-2", children: /* @__PURE__ */ jsx(Button, { size: "sm", disabled: !comment.trim(), onClick: () => {
            addAssessmentComment(a.id, comment.trim());
            setComment("");
            toast.success("Comment added");
          }, children: "Post Comment" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsx(LinkedList, { title: `Linked Care Plans (${linkedCP.length})`, items: linkedCP.map((c) => ({
        id: c.id,
        title: c.title,
        sub: `${c.status} · Review ${c.reviewDate}`
      })) }),
      /* @__PURE__ */ jsx(LinkedList, { title: `Linked Interventions (${linkedI.length})`, items: linkedI.map((i) => ({
        id: i.id,
        title: i.intervention,
        sub: `${i.date.slice(0, 10)} · ${i.staff}`
      })) }),
      /* @__PURE__ */ jsx(LinkedList, { title: `Linked Tasks (${linkedT.length})`, items: linkedT.map((t) => ({
        id: t.id,
        title: t.title,
        sub: `Due ${t.dueDate} · ${t.status}`
      })) }),
      /* @__PURE__ */ jsx(LinkedList, { title: `Linked Incidents (${linkedIn.length})`, items: linkedIn.map((i) => ({
        id: i.id,
        title: i.type,
        sub: `${i.date} · ${i.severity}`
      })) }),
      /* @__PURE__ */ jsx(LinkedList, { title: `Linked MDT Notes (${linkedM.length})`, items: linkedM.map((m) => ({
        id: m.id,
        title: m.discussion.slice(0, 60),
        sub: `${m.date} · ${m.authoredBy}`
      })) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(History, { className: "h-4 w-4" }),
        " Audit Trail (",
        audit.length,
        ")"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: audit.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "No audit entries." }) : /* @__PURE__ */ jsx("ol", { className: "space-y-2 text-xs", children: audit.slice().reverse().map((e) => /* @__PURE__ */ jsxs("li", { className: "border-l-2 border-border pl-3", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium capitalize", children: e.action.replace(/_/g, " ") }),
        /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground", children: [
          e.byUserName,
          " (",
          e.byRole,
          ") · ",
          e.at.slice(0, 16).replace("T", " ")
        ] }),
        e.reason && /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground italic", children: [
          '"',
          e.reason,
          '"'
        ] })
      ] }, e.id)) }) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: suggestOpen, onOpenChange: setSuggestOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Suggested Care Plan Templates" }) }),
      (() => {
        const ids = suggestTemplatesFor(a.type, a.riskLevel);
        const suggested = carePlanTemplates.filter((t) => ids.includes(t.id));
        const others = carePlanTemplates.filter((t) => !ids.includes(t.id));
        if (suggested.length === 0 && others.length === 0) return /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No templates available." });
        return /* @__PURE__ */ jsxs("div", { className: "space-y-4 max-h-[60vh] overflow-y-auto", children: [
          suggested.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground mb-2", children: "Recommended" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: suggested.map((t) => /* @__PURE__ */ jsx(TemplateRow, { t, onUse: () => {
              const plan = addCarePlanFromTemplate(t.id, r.id, a);
              if (plan) {
                toast.success(`Care plan created from '${t.title}'`);
                setSuggestOpen(false);
                navigate({
                  to: "/care-plans/$id",
                  params: {
                    id: plan.id
                  }
                });
              }
            } }, t.id)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground mb-2", children: "All templates" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: others.map((t) => /* @__PURE__ */ jsx(TemplateRow, { t, onUse: () => {
              const plan = addCarePlanFromTemplate(t.id, r.id, a);
              if (plan) {
                toast.success(`Care plan created from '${t.title}'`);
                setSuggestOpen(false);
                navigate({
                  to: "/care-plans/$id",
                  params: {
                    id: plan.id
                  }
                });
              }
            } }, t.id)) })
          ] })
        ] });
      })(),
      /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setSuggestOpen(false), children: "Close" }) })
    ] }) })
  ] });
}
function TemplateRow({
  t,
  onUse
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 rounded-md border p-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: t.title }),
        /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px]", children: t.category }),
        t.builtIn && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: "Built-in" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: t.problemStatement })
    ] }),
    /* @__PURE__ */ jsx(Button, { size: "sm", onClick: onUse, children: "Use" })
  ] });
}
function Info({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "text-sm capitalize", children: value })
  ] });
}
function Row({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "capitalize", children: value })
  ] });
}
function LinkedList({
  title,
  items
}) {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: title }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "divide-y text-sm", children: [
      items.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "None." }),
      items.map((i) => /* @__PURE__ */ jsxs("div", { className: "py-1.5", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium truncate", children: i.title }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: i.sub })
      ] }, i.id))
    ] })
  ] });
}
export {
  AssessmentDetail as component
};
