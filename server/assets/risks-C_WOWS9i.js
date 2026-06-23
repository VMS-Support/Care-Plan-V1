import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { u as useCare, f as Button, C as Card, b as CardHeader, d as CardTitle, B as Badge, e as CardContent } from "./router-DLzRbDkQ.js";
import { Shield, PersonStanding, Utensils, HeartPulse, Brain } from "lucide-react";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "sonner";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
const groups = [{
  title: "High Pressure Risk Residents",
  types: ["waterlow", "norton"],
  icon: Shield
}, {
  title: "High Falls Risk Residents",
  types: ["falls", "barthel"],
  icon: PersonStanding
}, {
  title: "Nutrition Risk Residents",
  types: ["mna", "must", "nutrition"],
  icon: Utensils
}, {
  title: "Pain Risk Residents",
  types: ["abbey_pain", "pain_chart"],
  icon: HeartPulse
}, {
  title: "Cognitive Risk Residents",
  types: ["mmse", "four_at"],
  icon: Brain
}];
function RisksPage() {
  const {
    assessments,
    residents,
    currentRole,
    currentUser
  } = useCare();
  const scopedResidents = useMemo(() => {
    if (currentRole === "don" || currentUser.assignedWings.length === 0) return residents;
    return residents.filter((resident) => currentUser.assignedWings.includes(resident.wingId || ""));
  }, [currentRole, currentUser.assignedWings, residents]);
  const residentIds = useMemo(() => new Set(scopedResidents.map((resident) => resident.id)), [scopedResidents]);
  const latestByResidentAndType = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const assessment of assessments) {
      if (!residentIds.has(assessment.residentId)) continue;
      if (assessment.status === "deleted" || assessment.status === "archived") continue;
      const key = `${assessment.residentId}:${assessment.type}`;
      const current = map.get(key);
      if (!current || assessment.date > current.date) map.set(key, assessment);
    }
    return map;
  }, [assessments, residentIds]);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-7xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Risks" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Awareness information from current assessments. Risks are not alert-queue items." })
      ] }),
      /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsx(Link, { to: "/alerts", children: "Back to Alerts" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid xl:grid-cols-2 gap-4", children: groups.map((group) => {
      const rows = scopedResidents.map((resident) => {
        const relevant = group.types.map((type) => latestByResidentAndType.get(`${resident.id}:${type}`)).filter((assessment) => !!assessment).filter((assessment) => assessment.riskLevel === "high" || assessment.riskLevel === "very_high").sort((a, b) => b.date.localeCompare(a.date));
        return {
          resident,
          assessment: relevant[0]
        };
      }).filter((row) => !!row.assessment);
      const Icon = group.icon;
      return /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4 text-muted-foreground" }),
          group.title,
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "ml-auto", children: rows.length })
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2", children: [
          rows.map(({
            resident,
            assessment
          }) => /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
            id: resident.id
          }, className: "flex items-center justify-between gap-3 rounded-md border p-3 hover:bg-accent/40", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                resident.firstName,
                " ",
                resident.lastName
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                "Room ",
                resident.roomNumber,
                " - ",
                assessment.type.replace(/_/g, " ")
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: assessment.riskLevel.replace("_", " ") }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
                "Score ",
                assessment.totalScore
              ] })
            ] })
          ] }, resident.id)),
          rows.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No high-risk residents." })
        ] })
      ] }, group.title);
    }) })
  ] });
}
export {
  RisksPage as component
};
