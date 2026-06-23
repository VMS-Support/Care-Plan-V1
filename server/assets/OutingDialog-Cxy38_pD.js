import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, f as DialogDescription, e as DialogFooter } from "./dialog-Dtfzkh6H.js";
import { u as useCare, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem, I as Input, f as Button } from "./router-DLzRbDkQ.js";
import { L as Label } from "./label-6k_A62K1.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { S as Switch } from "./switch-BrmJcFrV.js";
import { toast } from "sonner";
const empty = (residentId) => ({
  id: "",
  residentId,
  date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
  destination: "",
  accompaniedBy: "",
  departureTime: "10:00",
  returnTime: "12:00",
  transportMethod: "Walking",
  notes: "",
  riskAssessmentCompleted: false,
  status: "planned",
  recordStatus: "active"
});
function OutingDialog({ open, onOpenChange, mode, record, defaultResidentId }) {
  const { residents, addOuting, updateOuting } = useCare();
  const [form, setForm] = useState(empty(defaultResidentId || residents[0]?.id || ""));
  useEffect(() => {
    if (open) setForm(record ? { ...record } : empty(defaultResidentId || residents[0]?.id || ""));
  }, [open, record, defaultResidentId, residents]);
  const readOnly = mode === "view";
  function save() {
    if (!form.destination.trim()) {
      toast.error("Destination required");
      return;
    }
    if (mode === "create") {
      addOuting(form);
      toast.success("Outing recorded");
    } else if (record) {
      updateOuting(record.id, form);
      toast.success("Outing updated");
    }
    onOpenChange(false);
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-xl", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: mode === "create" ? "New Outing" : mode === "edit" ? "Edit Outing" : "Outing" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "All changes are audited and shown in the resident timeline." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Resident *" }),
        /* @__PURE__ */ jsxs(Select, { value: form.residentId, onValueChange: (v) => setForm({ ...form, residentId: v }), disabled: readOnly, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: residents.map((r) => /* @__PURE__ */ jsxs(SelectItem, { value: r.id, children: [
            r.firstName,
            " ",
            r.lastName,
            " — Room ",
            r.roomNumber
          ] }, r.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Destination *" }),
        /* @__PURE__ */ jsx(Input, { value: form.destination, onChange: (e) => setForm({ ...form, destination: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Accompanied By" }),
        /* @__PURE__ */ jsx(Input, { value: form.accompaniedBy, onChange: (e) => setForm({ ...form, accompaniedBy: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Date" }),
        /* @__PURE__ */ jsx(Input, { type: "date", value: form.date, onChange: (e) => setForm({ ...form, date: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Status" }),
        /* @__PURE__ */ jsxs(Select, { value: form.status || "planned", onValueChange: (v) => setForm({ ...form, status: v }), disabled: readOnly, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: ["planned", "departed", "returned", "cancelled", "closed"].map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, className: "capitalize", children: s }, s)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Departure" }),
        /* @__PURE__ */ jsx(Input, { type: "time", value: form.departureTime, onChange: (e) => setForm({ ...form, departureTime: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Return" }),
        /* @__PURE__ */ jsx(Input, { type: "time", value: form.returnTime, onChange: (e) => setForm({ ...form, returnTime: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Transport" }),
        /* @__PURE__ */ jsx(Input, { value: form.transportMethod, onChange: (e) => setForm({ ...form, transportMethod: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Notes / Outcome" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, value: form.notes || "", onChange: (e) => setForm({ ...form, notes: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Switch, { checked: form.riskAssessmentCompleted, onCheckedChange: (v) => setForm({ ...form, riskAssessmentCompleted: v }), disabled: readOnly }),
        /* @__PURE__ */ jsx(Label, { children: "Risk assessment completed" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: readOnly ? "Close" : "Cancel" }),
      !readOnly && /* @__PURE__ */ jsx(Button, { onClick: save, children: mode === "create" ? "Create" : "Save" })
    ] })
  ] }) });
}
export {
  OutingDialog as O
};
