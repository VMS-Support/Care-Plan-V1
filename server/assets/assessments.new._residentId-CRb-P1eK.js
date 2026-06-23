import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { $ as Route, u as useCare, a0 as scoreAssessment, a as can, M as assessmentItems, x as assessmentMeta, f as Button, C as Card, e as CardContent, I as Input, b as CardHeader, d as CardTitle, B as Badge, N as uniformScale } from "./router-DLzRbDkQ.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { L as Label } from "./label-6k_A62K1.js";
import { ArrowLeft } from "lucide-react";
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
const TYPES = ["barthel", "waterlow", "abbey_pain", "mna", "norton", "nutrition", "pinch_me"];
function NewAssessment() {
  const {
    residentId
  } = Route.useParams();
  const {
    type
  } = Route.useSearch();
  const {
    residents,
    addAssessment,
    addCarePlan,
    currentRole,
    currentUserName
  } = useCare();
  const navigate = useNavigate();
  const resident = residents.find((r) => r.id === residentId);
  const items = assessmentItems[type];
  const scale = uniformScale(type);
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [reviewDate, setReviewDate] = useState(new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10));
  const [nextReassessmentDate, setNextReassessmentDate] = useState(new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10));
  const result = useMemo(() => scoreAssessment(type, scores), [type, scores]);
  if (!resident) return /* @__PURE__ */ jsx("div", { className: "p-8", children: "Resident not found." });
  if (!can(currentRole, "assessment.create")) {
    return /* @__PURE__ */ jsxs("div", { className: "p-8", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "Your current role (",
        currentRole,
        ") cannot create assessments."
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/residents/$id", params: {
        id: residentId
      }, className: "text-primary underline text-sm", children: "Back to resident" })
    ] });
  }
  const allAnswered = items.every((it) => scores[it.key] !== void 0);
  function submit(draft) {
    if (!draft && !allAnswered) {
      toast.error("Please answer every category");
      return;
    }
    const a = addAssessment({
      residentId,
      type,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      assessor: currentUserName,
      assessorRole: currentRole,
      scores,
      totalScore: result.totalScore,
      interpretation: result.interpretation,
      riskLevel: result.riskLevel,
      notes,
      recommendations,
      status: draft ? "draft" : "completed",
      reviewDate,
      nextReassessmentDate,
      version: 1
    });
    if (!draft && (result.riskLevel === "high" || result.riskLevel === "very_high")) {
      if (type === "waterlow" || type === "norton") {
        addCarePlan({
          residentId,
          title: "Pressure Area Care Plan",
          problem: `Pressure ulcer risk: ${result.interpretation} (${assessmentMeta[type].name} ${result.totalScore})`,
          goal: "Maintain skin integrity; no new pressure damage at next review.",
          interventions: ["Reposition 2-hourly", "Daily skin inspection", "Pressure-relieving mattress", "Nutritional support"],
          assignedStaff: "Care team",
          frequency: "Every 2 hours",
          reviewDate,
          status: "active",
          linkedAssessmentId: a.id
        });
      }
      if (type === "abbey_pain") {
        addCarePlan({
          residentId,
          title: "Pain Management Care Plan",
          problem: `Pain: ${result.interpretation} (Abbey ${result.totalScore})`,
          goal: "Reduce pain to mild/none within 7 days.",
          interventions: ["Administer analgesia as prescribed", "Reassess 4-hourly", "Non-pharmacological comfort", "GP review if no improvement in 48h"],
          assignedStaff: "Nursing team",
          frequency: "4-hourly",
          reviewDate,
          status: "active",
          linkedAssessmentId: a.id
        });
      }
      if (type === "mna" || type === "nutrition") {
        addCarePlan({
          residentId,
          title: "Nutrition Care Plan",
          problem: `${result.interpretation} (${assessmentMeta[type].name} ${result.totalScore})`,
          goal: "Improve nutritional intake; stabilise weight within 4 weeks.",
          interventions: ["Food chart commenced", "Fortified diet", "Dietitian referral", "Weekly weight"],
          assignedStaff: "Nursing team",
          frequency: "Daily",
          reviewDate,
          status: "active",
          linkedAssessmentId: a.id
        });
      }
    }
    toast.success(draft ? "Draft saved" : "Assessment submitted");
    navigate({
      to: "/residents/$id",
      params: {
        id: residentId
      }
    });
  }
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-5xl", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
      id: residentId
    }, className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      " ",
      resident.firstName,
      " ",
      resident.lastName
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: assessmentMeta[type].name }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: assessmentMeta[type].description })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: TYPES.map((t) => /* @__PURE__ */ jsx(Link, { to: "/assessments/new/$residentId", params: {
        residentId
      }, search: {
        type: t
      }, children: /* @__PURE__ */ jsx(Button, { variant: type === t ? "default" : "outline", size: "sm", className: "capitalize", children: assessmentMeta[t].name.split(" ")[0].replace("—", "") }) }, t)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-3", children: [
        items.map((it) => {
          const options = scale ? scale : it.options;
          return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium mb-2 text-sm", children: it.label }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: options.map(([val, lab]) => {
              const active = scores[it.key] === val;
              return /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setScores((s) => ({
                ...s,
                [it.key]: val
              })), className: `px-3 py-1.5 rounded-md border text-sm transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`, children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold tabular-nums mr-1.5", children: val }),
                lab
              ] }, String(val) + lab);
            }) })
          ] }) }, it.key);
        }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-sm", children: "Clinical Recommendations" }),
            /* @__PURE__ */ jsx(Textarea, { value: recommendations, onChange: (e) => setRecommendations(e.target.value), placeholder: "Recommended actions, referrals, care plan items…", className: "mt-2" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { className: "text-sm", children: "Notes" }),
            /* @__PURE__ */ jsx(Textarea, { value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Clinical observations, follow-up…", className: "mt-2" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { className: "text-sm", children: "Review Date" }),
              /* @__PURE__ */ jsx(Input, { type: "date", value: reviewDate, onChange: (e) => setReviewDate(e.target.value), className: "mt-2" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { className: "text-sm", children: "Next Reassessment Date" }),
              /* @__PURE__ */ jsx(Input, { type: "date", value: nextReassessmentDate, onChange: (e) => setNextReassessmentDate(e.target.value), className: "mt-2" })
            ] })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsxs(Card, { className: "sticky top-20", children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Live Score" }) }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "text-5xl font-semibold tabular-nums", children: result.totalScore }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "mt-2 capitalize", children: result.interpretation }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-3", children: [
            Object.keys(scores).length,
            " of ",
            items.length,
            " answered"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-2 bg-muted rounded-full mt-2 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-primary transition-all", style: {
            width: `${Object.keys(scores).length / items.length * 100}%`
          } }) }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-3", children: [
            "Completed by ",
            /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: currentUserName }),
            /* @__PURE__ */ jsx("br", {}),
            "Role: ",
            /* @__PURE__ */ jsx("strong", { className: "text-foreground capitalize", children: currentRole })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 mt-4", children: [
            /* @__PURE__ */ jsx(Button, { onClick: () => submit(false), disabled: !allAnswered, children: "Submit Assessment" }),
            /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => submit(true), children: "Save Draft" })
          ] }),
          (result.riskLevel === "high" || result.riskLevel === "very_high") && allAnswered && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-3 rounded-md bg-warning/10 border border-warning/30 text-xs", children: [
            /* @__PURE__ */ jsx("strong", { children: "Auto-actions on submit:" }),
            /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-4 mt-1 space-y-0.5", children: [
              /* @__PURE__ */ jsxs("li", { children: [
                "Alert raised (",
                result.riskLevel === "very_high" ? "Critical" : "High",
                ")"
              ] }),
              (type === "waterlow" || type === "norton") && /* @__PURE__ */ jsx("li", { children: "Pressure Area Care Plan" }),
              type === "abbey_pain" && /* @__PURE__ */ jsx("li", { children: "Pain Management Care Plan" }),
              (type === "mna" || type === "nutrition") && /* @__PURE__ */ jsx("li", { children: "Nutrition Care Plan" }),
              /* @__PURE__ */ jsx("li", { children: "Review scheduled" })
            ] })
          ] })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  NewAssessment as component
};
