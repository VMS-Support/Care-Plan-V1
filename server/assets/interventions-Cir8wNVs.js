import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { u as useCare, C as Card, e as CardContent, f as Button, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem, I as Input } from "./router-DLzRbDkQ.js";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-Dtfzkh6H.js";
import { L as Label } from "./label-6k_A62K1.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { S as Switch } from "./switch-BrmJcFrV.js";
import { toast } from "sonner";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "lucide-react";
import "clsx";
import "tailwind-merge";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "@radix-ui/react-switch";
function NewIntervention() {
  const {
    residents,
    addIntervention
  } = useCare();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    residentId: "",
    intervention: "",
    outcome: "",
    residentResponse: "",
    followUpRequired: false
  });
  const presets = ["Resident repositioned", "Pain relief administered", "Hydration encouraged", "Mobility exercise completed", "Pressure area checked", "Food intake monitored"];
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { children: "Record Intervention" }) }),
    /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Record Intervention" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Resident" }),
          /* @__PURE__ */ jsxs(Select, { value: f.residentId, onValueChange: (v) => setF({
            ...f,
            residentId: v
          }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Choose resident" }) }),
            /* @__PURE__ */ jsx(SelectContent, { children: residents.map((r) => /* @__PURE__ */ jsxs(SelectItem, { value: r.id, children: [
              r.firstName,
              " ",
              r.lastName
            ] }, r.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Intervention" }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 mb-2", children: presets.map((p) => /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", variant: "outline", className: "h-7 text-xs", onClick: () => setF({
            ...f,
            intervention: p
          }), children: p }, p)) }),
          /* @__PURE__ */ jsx(Input, { value: f.intervention, onChange: (e) => setF({
            ...f,
            intervention: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Outcome" }),
          /* @__PURE__ */ jsx(Textarea, { value: f.outcome, onChange: (e) => setF({
            ...f,
            outcome: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Resident response" }),
          /* @__PURE__ */ jsx(Input, { value: f.residentResponse, onChange: (e) => setF({
            ...f,
            residentResponse: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(Label, { children: "Follow-up required" }),
          /* @__PURE__ */ jsx(Switch, { checked: f.followUpRequired, onCheckedChange: (v) => setF({
            ...f,
            followUpRequired: v
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => {
          if (!f.residentId || !f.intervention) {
            toast.error("Resident and intervention required");
            return;
          }
          addIntervention({
            ...f,
            date: (/* @__PURE__ */ new Date()).toISOString(),
            staff: "J. Roberts"
          });
          toast.success("Intervention recorded");
          setOpen(false);
        }, children: "Save" })
      ] })
    ] })
  ] });
}
function InterventionsPage() {
  const {
    interventions,
    residents
  } = useCare();
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Interventions" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
          interventions.length,
          " interventions logged"
        ] })
      ] }),
      /* @__PURE__ */ jsx(NewIntervention, {})
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: interventions.map((i) => {
      const r = residents.find((x) => x.id === i.residentId);
      return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: i.intervention }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
              r?.firstName,
              " ",
              r?.lastName,
              " · ",
              i.date.slice(0, 10),
              " · ",
              i.staff
            ] })
          ] }),
          i.followUpRequired && /* @__PURE__ */ jsx("span", { className: "text-xs bg-warning/15 text-warning-foreground px-2 py-0.5 rounded", children: "Follow-up" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-2", children: [
          "Outcome: ",
          i.outcome
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Response: ",
          i.residentResponse
        ] })
      ] }) }, i.id);
    }) })
  ] });
}
export {
  InterventionsPage as component
};
