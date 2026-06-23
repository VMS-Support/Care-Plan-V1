import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { H as Route, u as useCare, f as Button, B as Badge, C as Card, b as CardHeader, d as CardTitle, e as CardContent } from "./router-DLzRbDkQ.js";
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";
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
function Section({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs(Card, { className: "break-inside-avoid", children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm uppercase tracking-wide text-muted-foreground", children: title }) }),
    /* @__PURE__ */ jsx(CardContent, { className: "space-y-2 text-sm", children })
  ] });
}
function InspectionMode() {
  const {
    residentId
  } = Route.useParams();
  const {
    residents,
    assessments,
    carePlans,
    carePlanEvaluations,
    carePlanReviews,
    interventions,
    interventionLogs,
    tasks,
    notes,
    mdtNotes,
    incidents,
    auditLogs
  } = useCare();
  const r = residents.find((x) => x.id === residentId);
  if (!r) return /* @__PURE__ */ jsx("div", { className: "p-8", children: "Resident not found." });
  const rAssessments = assessments.filter((a) => a.residentId === r.id);
  const rPlans = carePlans.filter((c) => c.residentId === r.id).sort((a, b) => (b.version || 1) - (a.version || 1));
  const rEvals = carePlanEvaluations.filter((e) => rPlans.some((p) => p.id === e.carePlanId));
  const rReviews = carePlanReviews.filter((rv) => rPlans.some((p) => p.id === rv.carePlanId));
  const rInterv = interventions.filter((i) => i.residentId === r.id);
  const rLogs = interventionLogs.filter((l) => l.residentId === r.id);
  const rTasks = tasks.filter((t) => t.residentId === r.id);
  const rNotes = notes.filter((n) => n.residentId === r.id).slice(0, 20);
  const rMdt = mdtNotes.filter((m) => m.residentId === r.id);
  const rIncidents = incidents.filter((i) => i.residentId === r.id);
  const rAudits = auditLogs.filter((a) => a.entity === r.id || rPlans.some((p) => p.id === a.entity) || rAssessments.some((x) => x.id === a.entity));
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-4 max-w-6xl print:max-w-none print:p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between flex-wrap gap-3 print:hidden", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
        id: r.id
      }, className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back"
      ] }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => window.print(), children: [
        /* @__PURE__ */ jsx(Printer, { className: "h-3.5 w-3.5 mr-1.5" }),
        " Print / Export PDF"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border-b pb-3", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-semibold tracking-tight flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { className: "h-7 w-7 text-success" }),
        " Inspection Pack"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-base mt-1", children: [
        /* @__PURE__ */ jsxs("strong", { children: [
          r.firstName,
          " ",
          r.lastName
        ] }),
        " · Room ",
        r.roomNumber,
        " · Admitted ",
        r.admissionDate,
        " · Diagnosis: ",
        r.primaryDiagnosis
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
        "Generated ",
        (/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " "),
        " · Full nursing-process pack for regulator review."
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Section, { title: "Assessments", children: [
      rAssessments.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No assessments recorded." }),
      rAssessments.map((a) => /* @__PURE__ */ jsxs("div", { className: "border-b last:border-b-0 py-1.5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium capitalize", children: a.type.replace("_", " ") }),
          /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px]", children: [
            a.totalScore,
            " · ",
            a.interpretation
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          a.date,
          " · ",
          a.assessor,
          " (",
          a.assessorRole,
          ") · v",
          a.version || 1,
          " · ",
          a.status
        ] })
      ] }, a.id))
    ] }),
    /* @__PURE__ */ jsxs(Section, { title: "Care Plans (all versions)", children: [
      rPlans.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No care plans recorded." }),
      rPlans.map((p) => /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-2.5 mb-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
            p.title,
            " ",
            /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "ml-1 text-[10px]", children: [
              "v",
              p.version || 1
            ] })
          ] }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] capitalize", children: p.status.replace("_", " ") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          "Created ",
          p.createdAt.slice(0, 10),
          " by ",
          p.createdBy,
          " · Review ",
          p.reviewDate
        ] }),
        p.problemStatement && /* @__PURE__ */ jsxs("p", { className: "text-xs mt-1", children: [
          /* @__PURE__ */ jsx("strong", { children: "Problem:" }),
          " ",
          p.problemStatement
        ] }),
        p.assessmentScoreSnapshot && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Linked assessment snapshot: ",
          p.assessmentScoreSnapshot.type,
          " = ",
          p.assessmentScoreSnapshot.totalScore,
          " (",
          p.assessmentScoreSnapshot.interpretation,
          ")"
        ] }),
        p.goals && p.goals.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-1.5", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold", children: "Goals:" }),
          /* @__PURE__ */ jsx("ul", { className: "list-disc pl-5 text-xs", children: p.goals.map((g) => /* @__PURE__ */ jsxs("li", { children: [
            g.title,
            " ",
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              "— ",
              g.status
            ] })
          ] }, g.id)) })
        ] }),
        p.revisionReason && /* @__PURE__ */ jsxs("p", { className: "text-xs italic mt-1", children: [
          "Revision reason: ",
          p.revisionReason
        ] })
      ] }, p.id))
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Section, { title: `Evaluations (${rEvals.length})`, children: rEvals.map((e) => /* @__PURE__ */ jsxs("div", { className: "border-b last:border-b-0 py-1.5 text-xs", children: [
        /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
          e.date.slice(0, 10),
          " · ",
          e.evaluatedBy,
          " (",
          e.role,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Goals ",
          e.goalsMet,
          " · ",
          e.outcomeRating
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: e.summary }),
        e.locked && /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-[10px] mt-1", children: [
          "Signed: ",
          e.signature
        ] })
      ] }, e.id)) }),
      /* @__PURE__ */ jsx(Section, { title: `Reviews (${rReviews.length})`, children: rReviews.map((rv) => /* @__PURE__ */ jsxs("div", { className: "border-b last:border-b-0 py-1.5 text-xs", children: [
        /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
          rv.date.slice(0, 10),
          " · ",
          rv.reviewer
        ] }),
        /* @__PURE__ */ jsx("div", { className: "capitalize", children: rv.outcome.replace(/_/g, " ") }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: rv.notes })
      ] }, rv.id)) }),
      /* @__PURE__ */ jsxs(Section, { title: `Interventions Logged (${rLogs.length + rInterv.length})`, children: [
        rLogs.slice(0, 10).map((l) => /* @__PURE__ */ jsxs("div", { className: "border-b py-1 text-xs", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            l.date,
            " ",
            l.time,
            " · ",
            /* @__PURE__ */ jsx("span", { className: "capitalize", children: l.outcome.replace("_", " ") }),
            " · ",
            l.staff
          ] }),
          l.comments && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: l.comments })
        ] }, l.id)),
        rInterv.slice(0, 5).map((i) => /* @__PURE__ */ jsx("div", { className: "border-b py-1 text-xs", children: /* @__PURE__ */ jsxs("div", { children: [
          i.date,
          " · ",
          i.intervention,
          " · ",
          i.staff
        ] }) }, i.id))
      ] }),
      /* @__PURE__ */ jsxs(Section, { title: `MDT & Incidents (${rMdt.length + rIncidents.length})`, children: [
        rMdt.map((m) => /* @__PURE__ */ jsxs("div", { className: "border-b py-1 text-xs", children: [
          /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
            "MDT — ",
            m.date.slice(0, 10),
            " · ",
            m.authoredBy
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: m.discussion.slice(0, 140) })
        ] }, m.id)),
        rIncidents.map((i) => /* @__PURE__ */ jsxs("div", { className: "border-b py-1 text-xs", children: [
          /* @__PURE__ */ jsxs("div", { className: "font-medium capitalize", children: [
            "Incident — ",
            i.type,
            " (",
            i.severity,
            ") — ",
            i.date
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: i.description })
        ] }, i.id))
      ] }),
      /* @__PURE__ */ jsx(Section, { title: `Tasks (${rTasks.length})`, children: rTasks.map((t) => /* @__PURE__ */ jsxs("div", { className: "text-xs flex justify-between border-b py-1", children: [
        /* @__PURE__ */ jsx("span", { children: t.title }),
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground capitalize", children: [
          t.status,
          " · due ",
          t.dueDate
        ] })
      ] }, t.id)) }),
      /* @__PURE__ */ jsx(Section, { title: `Daily Notes — latest (${rNotes.length})`, children: rNotes.map((n) => /* @__PURE__ */ jsxs("div", { className: "text-xs border-b py-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
          n.date,
          " · ",
          n.shift,
          " · ",
          n.staff
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: n.observation })
      ] }, n.id)) })
    ] }),
    /* @__PURE__ */ jsxs(Section, { title: `Audit Trail (${rAudits.length})`, children: [
      rAudits.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: "No audit entries." }),
      rAudits.slice(0, 50).map((a) => /* @__PURE__ */ jsxs("div", { className: "text-xs border-b py-1", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium", children: a.action }),
        /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground", children: [
          a.user,
          " (",
          a.role,
          ") · ",
          a.timestamp.slice(0, 16).replace("T", " ")
        ] }),
        a.reason && /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground italic", children: [
          "Reason: ",
          a.reason
        ] })
      ] }, a.id))
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground border-t pt-3", children: "Inspection pack generated by CarePath. All records retained immutably; care plan versions and signed evaluations are read-only and cannot be deleted." })
  ] });
}
export {
  InspectionMode as component
};
