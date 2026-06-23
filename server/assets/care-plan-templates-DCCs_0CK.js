import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { u as useCare, a as can, I as Input, C as Card, b as CardHeader, d as CardTitle, B as Badge, e as CardContent, f as Button } from "./router-DLzRbDkQ.js";
import { L as Label } from "./label-6k_A62K1.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-Dtfzkh6H.js";
import { Library, Trash2, Edit, Plus } from "lucide-react";
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
function TemplatesLibrary() {
  const {
    carePlanTemplates,
    saveCarePlanTemplate,
    deleteCarePlanTemplate,
    currentRole
  } = useCare();
  const canEdit = can(currentRole, "settings.manage") || can(currentRole, "careplan.approve");
  const [search, setSearch] = useState("");
  const filtered = carePlanTemplates.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-7xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-semibold tracking-tight flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Library, { className: "h-6 w-6" }),
          " Care Plan Template Library"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
          "Built-in templates pre-loaded with problem statement, SMART goals, interventions, and outcome measures. ",
          canEdit && "CNM and DON can create or revise templates."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Input, { placeholder: "Search templates…", value: search, onChange: (e) => setSearch(e.target.value), className: "w-56" }),
        canEdit && /* @__PURE__ */ jsx(TemplateEditor, { onSave: saveCarePlanTemplate })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-3", children: filtered.map((t) => /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: t.title }),
          /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "mt-1 text-[10px]", children: t.category })
        ] }),
        t.builtIn && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: "Built-in" })
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "flex-1 text-sm space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground line-clamp-3", children: t.problemStatement }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: t.identifiedNeeds.slice(0, 4).map((n) => /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: n }, n)) }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            t.smartGoals.length,
            " goals"
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            t.interventions.length,
            " intervs"
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            t.outcomeMeasures.length,
            " outcomes"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          "Review every ",
          t.reviewFrequencyDays,
          "d · Eval every ",
          t.evaluationFrequencyDays,
          "d"
        ] }),
        canEdit && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 pt-2", children: [
          /* @__PURE__ */ jsx(TemplateEditor, { template: t, onSave: saveCarePlanTemplate }),
          !t.builtIn && /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => {
            deleteCarePlanTemplate(t.id);
            toast.success("Template removed");
          }, children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
        ] })
      ] })
    ] }, t.id)) }),
    /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
      "Templates are applied from the ",
      /* @__PURE__ */ jsx(Link, { to: "/assessments", className: "text-primary underline", children: "Assessment Centre" }),
      ' via "Suggest Care Plan", or from the ',
      /* @__PURE__ */ jsx(Link, { to: "/care-plans", className: "text-primary underline", children: "Care Plans" }),
      " page when creating a new plan."
    ] })
  ] });
}
function TemplateEditor({
  template,
  onSave
}) {
  const [open, setOpen] = useState(false);
  const blank = {
    id: "tpl-custom-" + Date.now().toString(36),
    category: "Custom",
    title: "New Custom Template",
    problemStatement: "",
    identifiedNeeds: [],
    smartGoals: [],
    interventions: [],
    outcomeMeasures: [],
    reviewFrequencyDays: 14,
    evaluationFrequencyDays: 28,
    builtIn: false,
    editable: true
  };
  const [t, setT] = useState(template || blank);
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: (o) => {
    setOpen(o);
    if (o) setT(template || blank);
  }, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: template ? "outline" : "default", children: template ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5 mr-1.5" }),
      " Edit"
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5 mr-1.5" }),
      " New Template"
    ] }) }) }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: template ? "Edit Template" : "Create Template" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Title" }),
            /* @__PURE__ */ jsx(Input, { value: t.title, onChange: (e) => setT({
              ...t,
              title: e.target.value
            }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Category" }),
            /* @__PURE__ */ jsx(Input, { value: t.category, onChange: (e) => setT({
              ...t,
              category: e.target.value
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Problem Statement" }),
          /* @__PURE__ */ jsx(Textarea, { value: t.problemStatement, onChange: (e) => setT({
            ...t,
            problemStatement: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Identified Needs (comma-separated)" }),
          /* @__PURE__ */ jsx(Input, { value: t.identifiedNeeds.join(", "), onChange: (e) => setT({
            ...t,
            identifiedNeeds: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Review frequency (days)" }),
            /* @__PURE__ */ jsx(Input, { type: "number", value: t.reviewFrequencyDays, onChange: (e) => setT({
              ...t,
              reviewFrequencyDays: Number(e.target.value)
            }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Evaluation frequency (days)" }),
            /* @__PURE__ */ jsx(Input, { type: "number", value: t.evaluationFrequencyDays, onChange: (e) => setT({
              ...t,
              evaluationFrequencyDays: Number(e.target.value)
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-3 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx("strong", { children: t.smartGoals.length }),
          " SMART goals · ",
          /* @__PURE__ */ jsx("strong", { children: t.interventions.length }),
          " interventions · ",
          /* @__PURE__ */ jsx("strong", { children: t.outcomeMeasures.length }),
          " outcome measures.",
          /* @__PURE__ */ jsx("br", {}),
          "Detailed SMART goal/intervention editing inherits from the existing template content. Use the care plan editor on each created plan to fine-tune."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => {
          onSave(t);
          toast.success("Template saved");
          setOpen(false);
        }, children: "Save" })
      ] })
    ] })
  ] });
}
export {
  TemplatesLibrary as component
};
