import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { P as Route, u as useCare, C as Card, e as CardContent, B as Badge } from "./router-DLzRbDkQ.js";
import { Stethoscope, GitBranch, ClipboardList, Target, FileCheck2, HeartPulse, NotebookPen, CheckSquare, UserCheck, ShieldAlert, UsersRound, Plane, ArrowLeft } from "lucide-react";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "sonner";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
function asText(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}
function asTimestamp(value) {
  return typeof value === "string" && value.trim() ? value : (/* @__PURE__ */ new Date(0)).toISOString();
}
function tone(t) {
  switch (t) {
    case "success":
      return "bg-success/10 text-success border-success/30";
    case "warn":
      return "bg-warning/15 text-warning-foreground border-warning/40";
    case "critical":
      return "bg-destructive/10 text-destructive border-destructive/30";
    default:
      return "bg-muted/50 text-foreground border-border";
  }
}
function ResidentTimeline() {
  const {
    id
  } = Route.useParams();
  const {
    residents,
    assessments,
    carePlans,
    carePlanEvaluations,
    carePlanReviews,
    interventions,
    interventionLogs,
    notes,
    tasks,
    mdtNotes,
    incidents,
    visitors,
    outings,
    timelineEvents
  } = useCare();
  const r = residents.find((x) => x.id === id);
  const events = useMemo(() => {
    if (!r) return [];
    const list = [];
    assessments.filter((a) => a.residentId === r.id).forEach((a) => {
      list.push({
        ts: a.date,
        icon: Stethoscope,
        type: `${a.type.toUpperCase()} Assessment ${a.status === "completed" ? "Completed" : "Created"}`,
        summary: `${a.totalScore} — ${a.interpretation}`,
        user: a.assessor,
        role: a.assessorRole,
        tone: a.riskLevel === "very_high" ? "critical" : a.riskLevel === "high" ? "warn" : "default"
      });
    });
    carePlans.filter((c) => c.residentId === r.id).forEach((c) => {
      list.push({
        ts: c.createdAt,
        icon: c.supersedesId ? GitBranch : ClipboardList,
        type: c.supersedesId ? `Care Plan Revised (v${c.version})` : "Care Plan Created",
        summary: `${c.title}${c.revisionReason ? " — " + c.revisionReason : ""}`,
        user: c.createdBy,
        tone: c.priority === "critical" ? "critical" : "default"
      });
      (c.goals || []).forEach((g) => {
        list.push({
          ts: c.createdAt,
          icon: Target,
          type: "Goal Added",
          summary: g.title,
          tone: "default"
        });
      });
    });
    carePlanEvaluations.forEach((e) => {
      const cp = carePlans.find((c) => c.id === e.carePlanId);
      if (cp?.residentId !== r.id) return;
      list.push({
        ts: e.date,
        icon: FileCheck2,
        type: "Evaluation Completed",
        summary: `${cp.title}: goals ${e.goalsMet} · ${e.outcomeRating}`,
        user: e.evaluatedBy,
        role: e.role,
        tone: e.outcomeRating === "deterioration" ? "critical" : e.outcomeRating === "excellent" ? "success" : "default"
      });
    });
    carePlanReviews.forEach((rv) => {
      const cp = carePlans.find((c) => c.id === rv.carePlanId);
      if (cp?.residentId !== r.id) return;
      list.push({
        ts: rv.date,
        icon: ClipboardList,
        type: "Review Completed",
        summary: `${cp.title}: ${rv.outcome.replace(/_/g, " ")}`,
        user: rv.reviewer,
        role: rv.role
      });
    });
    interventions.filter((i) => i.residentId === r.id).forEach((i) => {
      list.push({
        ts: i.date,
        icon: HeartPulse,
        type: "Intervention Recorded",
        summary: `${i.intervention} — ${i.outcome}`,
        user: i.staff
      });
    });
    interventionLogs.filter((l) => l.residentId === r.id).forEach((l) => {
      list.push({
        ts: l.date + "T" + l.time,
        icon: HeartPulse,
        type: `Intervention ${l.outcome.replace(/_/g, " ")}`,
        summary: l.comments || l.residentResponse || "Intervention logged",
        user: l.staff,
        role: l.role,
        tone: l.outcome === "missed" || l.outcome === "escalated" ? "warn" : "success"
      });
    });
    notes.filter((n) => n.residentId === r.id).forEach((n) => {
      list.push({
        ts: n.date,
        icon: NotebookPen,
        type: `Daily Note (${n.shift})`,
        summary: n.observation,
        user: n.staff
      });
    });
    tasks.filter((t) => t.residentId === r.id && t.status === "completed").forEach((t) => {
      list.push({
        ts: t.dueDate,
        icon: CheckSquare,
        type: "Task Completed",
        summary: t.title,
        user: t.assignedTo,
        tone: "success"
      });
    });
    mdtNotes.filter((m) => m.residentId === r.id).forEach((m) => {
      list.push({
        ts: m.date,
        icon: UserCheck,
        type: "MDT Note",
        summary: m.discussion.slice(0, 120),
        user: m.authoredBy,
        role: m.role
      });
    });
    incidents.filter((i) => i.residentId === r.id).forEach((i) => {
      list.push({
        ts: i.date,
        icon: ShieldAlert,
        type: `Incident (${i.type})`,
        summary: i.description,
        user: i.reportedBy,
        tone: i.severity === "critical" ? "critical" : i.severity === "high" ? "warn" : "default"
      });
    });
    visitors.filter((v) => v.residentId === r.id).forEach((v) => {
      list.push({
        ts: v.date,
        icon: UsersRound,
        type: "Visitor",
        summary: `${v.visitorName} (${v.relationship})`,
        user: v.signedInBy
      });
    });
    outings.filter((o) => o.residentId === r.id).forEach((o) => {
      list.push({
        ts: o.date,
        icon: Plane,
        type: "Outing",
        summary: `${o.destination} · ${o.accompaniedBy}`,
        user: o.accompaniedBy
      });
    });
    timelineEvents.filter((e) => e.residentId === r.id).forEach((e) => {
      const eventType = asText(e.type);
      const icon = eventType.startsWith("intervention.") ? HeartPulse : eventType.startsWith("careplan.") ? ClipboardList : eventType.startsWith("assessment.") ? Stethoscope : eventType.startsWith("task.") ? CheckSquare : eventType.startsWith("mdt.") ? UserCheck : eventType.startsWith("incident.") ? ShieldAlert : eventType.startsWith("visitor.") ? UsersRound : eventType.startsWith("outing.") ? Plane : NotebookPen;
      list.push({
        ts: asTimestamp(e.createdAt),
        icon,
        type: asText(e.title, "Timeline Event"),
        summary: asText(e.description, eventType || "Timeline event"),
        user: asText(e.createdBy),
        role: e.role,
        tone: eventType === "intervention.created" || eventType === "intervention.logged" ? "success" : eventType === "incident.created" ? "warn" : "default"
      });
    });
    return list.sort((a, b) => asTimestamp(b.ts).localeCompare(asTimestamp(a.ts)));
  }, [r, assessments, carePlans, carePlanEvaluations, carePlanReviews, interventions, interventionLogs, notes, tasks, mdtNotes, incidents, visitors, outings, timelineEvents]);
  if (!r) return /* @__PURE__ */ jsx("div", { className: "p-8", children: "Resident not found." });
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 max-w-5xl space-y-5", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
      id: r.id
    }, className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      " Back to resident"
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Clinical Timeline" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        r.firstName,
        " ",
        r.lastName,
        " · Room ",
        r.roomNumber,
        " · ",
        events.length,
        " events"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative space-y-2 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border", children: [
      events.map((e, i) => {
        const Icon = e.icon;
        return /* @__PURE__ */ jsxs("div", { className: "flex gap-3 relative", children: [
          /* @__PURE__ */ jsx("div", { className: `relative z-10 h-8 w-8 rounded-full border-2 flex items-center justify-center bg-background shrink-0 ${tone(e.tone)}`, children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx(Card, { className: "flex-1", children: /* @__PURE__ */ jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: e.type }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: asText(e.summary, "No summary available") }),
              e.user && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
                e.user,
                e.role ? ` · ${e.role}` : ""
              ] })
            ] }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] tabular-nums", children: asTimestamp(e.ts).slice(0, 16).replace("T", " ") })
          ] }) }) })
        ] }, i);
      }),
      events.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No clinical events recorded." })
    ] })
  ] });
}
export {
  ResidentTimeline as component
};
