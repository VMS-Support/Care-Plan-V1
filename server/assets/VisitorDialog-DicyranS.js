import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, f as DialogDescription, e as DialogFooter } from "./dialog-Dtfzkh6H.js";
import { u as useCare, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem, I as Input, f as Button } from "./router-DLzRbDkQ.js";
import { L as Label } from "./label-6k_A62K1.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { toast } from "sonner";
const empty = (uid, residentId) => ({
  id: "",
  residentId,
  date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
  visitorName: "",
  relationship: "Family",
  arrivalTime: (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5),
  departureTime: "",
  notes: "",
  signedInBy: uid,
  status: "checked_in",
  recordStatus: "active"
});
function VisitorDialog({ open, onOpenChange, mode, record, defaultResidentId }) {
  const { residents, addVisitor, updateVisitor, currentUserName } = useCare();
  const [form, setForm] = useState(empty(currentUserName, defaultResidentId || residents[0]?.id || ""));
  useEffect(() => {
    if (open) setForm(record ? { ...record } : empty(currentUserName, defaultResidentId || residents[0]?.id || ""));
  }, [open, record, currentUserName, defaultResidentId, residents]);
  const readOnly = mode === "view";
  function save() {
    if (!form.visitorName.trim()) {
      toast.error("Visitor name required");
      return;
    }
    if (mode === "create") {
      addVisitor(form);
      toast.success("Visitor recorded");
    } else if (record) {
      updateVisitor(record.id, form);
      toast.success("Visitor updated");
    }
    onOpenChange(false);
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-xl", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: mode === "create" ? "New Visitor" : mode === "edit" ? "Edit Visitor" : "Visitor" }),
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
        /* @__PURE__ */ jsx(Label, { children: "Visitor Name *" }),
        /* @__PURE__ */ jsx(Input, { value: form.visitorName, onChange: (e) => setForm({ ...form, visitorName: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Relationship" }),
        /* @__PURE__ */ jsx(Input, { value: form.relationship, onChange: (e) => setForm({ ...form, relationship: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Date" }),
        /* @__PURE__ */ jsx(Input, { type: "date", value: form.date, onChange: (e) => setForm({ ...form, date: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Status" }),
        /* @__PURE__ */ jsxs(Select, { value: form.status || "checked_in", onValueChange: (v) => setForm({ ...form, status: v }), disabled: readOnly, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: ["scheduled", "checked_in", "completed", "cancelled"].map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, className: "capitalize", children: s.replace("_", " ") }, s)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Arrival Time" }),
        /* @__PURE__ */ jsx(Input, { type: "time", value: form.arrivalTime, onChange: (e) => setForm({ ...form, arrivalTime: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Departure Time" }),
        /* @__PURE__ */ jsx(Input, { type: "time", value: form.departureTime, onChange: (e) => setForm({ ...form, departureTime: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Notes" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, value: form.notes || "", onChange: (e) => setForm({ ...form, notes: e.target.value }), disabled: readOnly })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: readOnly ? "Close" : "Cancel" }),
      !readOnly && /* @__PURE__ */ jsx(Button, { onClick: save, children: mode === "create" ? "Create" : "Save" })
    ] })
  ] }) });
}
export {
  VisitorDialog as V
};
