import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, f as DialogDescription, e as DialogFooter } from "./dialog-Dtfzkh6H.js";
import { u as useCare, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem, I as Input, f as Button } from "./router-DLzRbDkQ.js";
import { L as Label } from "./label-6k_A62K1.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { S as Switch } from "./switch-BrmJcFrV.js";
import { toast } from "sonner";
const empty = (uid, residentId) => ({
  id: "",
  residentId,
  date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
  type: "fall",
  severity: "moderate",
  description: "",
  immediateAction: "",
  reportedBy: uid,
  followUpRequired: false,
  status: "draft",
  recordStatus: "active"
});
function IncidentDialog({ open, onOpenChange, mode, record, defaultResidentId }) {
  const { residents, carePlans, addIncident, updateIncident, submitIncident, currentUserName } = useCare();
  const [form, setForm] = useState(empty(currentUserName, defaultResidentId || residents[0]?.id || ""));
  useEffect(() => {
    if (open) setForm(record ? { ...record } : empty(currentUserName, defaultResidentId || residents[0]?.id || ""));
  }, [open, record, currentUserName, defaultResidentId, residents]);
  const readOnly = mode === "view";
  const linkedPlans = carePlans.filter((c) => c.residentId === form.residentId && c.status !== "archived" && c.status !== "superseded");
  function save(submit) {
    if (!form.description.trim()) {
      toast.error("Description required");
      return;
    }
    if (mode === "create") {
      const item = addIncident({ ...form, status: submit ? "open" : "draft" });
      toast.success(submit ? "Incident submitted" : "Draft saved");
      onOpenChange(false);
      return item;
    } else if (record) {
      updateIncident(record.id, form);
      if (submit && record.status === "draft") submitIncident(record.id);
      toast.success("Incident updated");
      onOpenChange(false);
    }
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: mode === "create" ? "New Incident" : mode === "edit" ? "Edit Incident" : "Incident" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "All changes are audited and linked to the resident timeline." })
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
        /* @__PURE__ */ jsx(Label, { children: "Date *" }),
        /* @__PURE__ */ jsx(Input, { type: "date", value: form.date, onChange: (e) => setForm({ ...form, date: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Type *" }),
        /* @__PURE__ */ jsxs(Select, { value: form.type, onValueChange: (v) => setForm({ ...form, type: v }), disabled: readOnly, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: ["fall", "medication_error", "injury", "behaviour", "near_miss", "other"].map((t) => /* @__PURE__ */ jsx(SelectItem, { value: t, className: "capitalize", children: t.replace("_", " ") }, t)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Severity *" }),
        /* @__PURE__ */ jsxs(Select, { value: form.severity, onValueChange: (v) => setForm({ ...form, severity: v }), disabled: readOnly, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: ["low", "moderate", "high", "critical"].map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, className: "capitalize", children: s }, s)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Reported By" }),
        /* @__PURE__ */ jsx(Input, { value: form.reportedBy, onChange: (e) => setForm({ ...form, reportedBy: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Witnessed By" }),
        /* @__PURE__ */ jsx(Input, { value: form.witnessedBy || "", onChange: (e) => setForm({ ...form, witnessedBy: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Description *" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 3, value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Immediate Action Taken" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, value: form.immediateAction, onChange: (e) => setForm({ ...form, immediateAction: e.target.value }), disabled: readOnly })
      ] }),
      linkedPlans.length > 0 && /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Link to Care Plan" }),
        /* @__PURE__ */ jsxs(Select, { value: form.linkedCarePlanId || "none", onValueChange: (v) => setForm({ ...form, linkedCarePlanId: v === "none" ? void 0 : v }), disabled: readOnly, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "None" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "none", children: "None" }),
            linkedPlans.map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p.id, children: p.title }, p.id))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Switch, { checked: form.followUpRequired, onCheckedChange: (v) => setForm({ ...form, followUpRequired: v }), disabled: readOnly }),
        /* @__PURE__ */ jsx(Label, { children: "Follow-up required" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: readOnly ? "Close" : "Cancel" }),
      !readOnly && mode === "create" && /* @__PURE__ */ jsx(Button, { variant: "secondary", onClick: () => save(false), children: "Save Draft" }),
      !readOnly && /* @__PURE__ */ jsx(Button, { onClick: () => save(true), children: mode === "create" ? "Submit" : "Save" })
    ] })
  ] }) });
}
export {
  IncidentDialog as I
};
