import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { u as useCare, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem, I as Input, f as Button, a as can, C as Card, e as CardContent, B as Badge, D as DropdownMenuItem } from "./router-DLzRbDkQ.js";
import { Plus, CheckCircle2, Lock, AlertCircle } from "lucide-react";
import { O as OpsListToolbar, R as RecordActions } from "./OpsListToolbar-ACf5VeZs.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, f as DialogDescription, e as DialogFooter } from "./dialog-Dtfzkh6H.js";
import { L as Label } from "./label-6k_A62K1.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { toast } from "sonner";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "./tabs-BZBuOn5G.js";
import "@radix-ui/react-tabs";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
const empty = (uid, residentId) => ({
  id: "",
  residentId,
  date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
  shift: "morning",
  staff: uid,
  summary: "",
  outstandingActions: "",
  priority: "medium",
  status: "open",
  recordStatus: "active"
});
function HandoverDialog({ open, onOpenChange, mode, record, defaultResidentId }) {
  const { residents, addHandover, updateHandover, currentUserName } = useCare();
  const [form, setForm] = useState(empty(currentUserName, defaultResidentId || residents[0]?.id || ""));
  useEffect(() => {
    if (open) setForm(record ? { ...record } : empty(currentUserName, defaultResidentId || residents[0]?.id || ""));
  }, [open, record, currentUserName, defaultResidentId, residents]);
  const readOnly = mode === "view";
  function save() {
    if (!form.summary.trim()) {
      toast.error("Summary required");
      return;
    }
    if (mode === "create") {
      addHandover(form);
      toast.success("Handover created");
    } else if (record) {
      updateHandover(record.id, form);
      toast.success("Handover updated");
    }
    onOpenChange(false);
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-xl", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: mode === "create" ? "New Handover" : mode === "edit" ? "Edit Handover" : "Handover" }),
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
        /* @__PURE__ */ jsx(Label, { children: "Date" }),
        /* @__PURE__ */ jsx(Input, { type: "date", value: form.date, onChange: (e) => setForm({ ...form, date: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Shift *" }),
        /* @__PURE__ */ jsxs(Select, { value: form.shift, onValueChange: (v) => setForm({ ...form, shift: v }), disabled: readOnly, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: ["morning", "afternoon", "night"].map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, className: "capitalize", children: s }, s)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Staff" }),
        /* @__PURE__ */ jsx(Input, { value: form.staff, onChange: (e) => setForm({ ...form, staff: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Priority" }),
        /* @__PURE__ */ jsxs(Select, { value: form.priority || "medium", onValueChange: (v) => setForm({ ...form, priority: v }), disabled: readOnly, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: ["low", "medium", "high", "critical"].map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p, className: "capitalize", children: p }, p)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Summary *" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 3, value: form.summary, onChange: (e) => setForm({ ...form, summary: e.target.value }), disabled: readOnly })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Outstanding Actions" }),
        /* @__PURE__ */ jsx(Textarea, { rows: 2, value: form.outstandingActions, onChange: (e) => setForm({ ...form, outstandingActions: e.target.value }), disabled: readOnly })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: readOnly ? "Close" : "Cancel" }),
      !readOnly && /* @__PURE__ */ jsx(Button, { onClick: save, children: mode === "create" ? "Create" : "Save" })
    ] })
  ] }) });
}
function HandoversPage() {
  const care = useCare();
  const {
    handovers,
    residents,
    filteredResidentIds,
    filter,
    currentRole
  } = care;
  const [statusTab, setStatusTab] = useState("active");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [workflowStatus, setWorkflowStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dialog, setDialog] = useState({
    open: false,
    mode: "create"
  });
  const counts = useMemo(() => ({
    active: handovers.filter((h) => (h.recordStatus || "active") === "active").length,
    archived: handovers.filter((h) => h.recordStatus === "archived").length,
    deleted: handovers.filter((h) => h.recordStatus === "deleted").length
  }), [handovers]);
  const filtered = useMemo(() => {
    const filterIds = new Set(filteredResidentIds);
    const q = search.toLowerCase();
    let arr = handovers.filter((h) => {
      const rs = h.recordStatus || "active";
      if (rs !== statusTab) return false;
      if ((filter.wingId || filter.residentId) && !filterIds.has(h.residentId)) return false;
      if (workflowStatus !== "all" && h.status !== workflowStatus) return false;
      if (dateFrom && h.date < dateFrom) return false;
      if (dateTo && h.date > dateTo) return false;
      if (q) {
        const r = residents.find((x) => x.id === h.residentId);
        const hay = `${h.shift} ${h.staff} ${h.summary} ${h.outstandingActions} ${r?.firstName} ${r?.lastName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    arr.sort((a, b) => sort === "date-asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return arr;
  }, [handovers, statusTab, filteredResidentIds, filter, residents, search, sort, workflowStatus, dateFrom, dateTo]);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-4 max-w-6xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2 print:hidden", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Shift Handovers" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          filtered.length,
          " shown · ",
          counts.active,
          " active · ",
          counts.archived,
          " archived · ",
          counts.deleted,
          " deleted"
        ] })
      ] }),
      can(currentRole, "handover.create") && /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: () => setDialog({
        open: true,
        mode: "create"
      }), children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
        " New Handover"
      ] })
    ] }),
    /* @__PURE__ */ jsx(OpsListToolbar, { search, setSearch, statusTab, setStatusTab, sort, setSort, sortOptions: [{
      value: "date-desc",
      label: "Newest First"
    }, {
      value: "date-asc",
      label: "Oldest First"
    }], dateFrom, setDateFrom, dateTo, setDateTo, workflowStatus, setWorkflowStatus, workflowOptions: [{
      value: "open",
      label: "Open"
    }, {
      value: "acknowledged",
      label: "Acknowledged"
    }, {
      value: "completed",
      label: "Completed"
    }, {
      value: "closed",
      label: "Closed"
    }], counts }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      filtered.map((h) => {
        const r = residents.find((x) => x.id === h.residentId);
        const rs = h.recordStatus || "active";
        return /* @__PURE__ */ jsx(Card, { className: `hover:shadow-sm ${rs === "deleted" ? "opacity-60" : h.status === "acknowledged" || h.status === "completed" || h.status === "closed" ? "opacity-90" : ""}`, children: /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
              /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
                id: h.residentId
              }, className: "hover:underline", children: [
                r?.firstName,
                " ",
                r?.lastName
              ] }),
              " ",
              "— Room ",
              r?.roomNumber
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
              h.date,
              " · ",
              h.staff,
              h.acknowledgedBy ? ` · ack by ${h.acknowledgedBy} at ${h.acknowledgedAt?.slice(11, 16)}` : "",
              h.completedBy ? ` · completed by ${h.completedBy}` : "",
              h.closedBy ? ` · closed by ${h.closedBy}` : ""
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: h.summary }),
            h.outstandingActions && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
              /* @__PURE__ */ jsx("strong", { children: "Outstanding:" }),
              " ",
              h.outstandingActions
            ] }),
            rs === "deleted" && /* @__PURE__ */ jsxs("p", { className: "text-xs text-destructive mt-1", children: [
              "Deleted by ",
              h.deletedBy,
              " — ",
              h.deletedReason
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5 items-center flex-wrap", children: [
            h.priority && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: h.priority }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: h.shift }),
            /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "capitalize", children: h.status || "open" }),
            rs !== "active" && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize bg-muted", children: rs }),
            rs === "active" && h.status === "open" && /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => {
              care.acknowledgeHandover(h.id);
              toast.success("Acknowledged");
            }, children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3.5 w-3.5 mr-1" }),
              " Acknowledge"
            ] }),
            /* @__PURE__ */ jsx(RecordActions, { createdBy: h.createdBy, recordStatus: rs, recordLabel: "handover", onView: () => setDialog({
              open: true,
              mode: "view",
              record: h
            }), onEdit: () => setDialog({
              open: true,
              mode: "edit",
              record: h
            }), onArchive: () => {
              care.archiveHandover(h.id);
              toast.success("Archived");
            }, onRestore: () => {
              care.restoreHandover(h.id);
              toast.success("Restored");
            }, onDelete: (reason) => care.softDeleteHandover(h.id, reason), onDuplicate: () => {
              care.duplicateHandover(h.id);
              toast.success("Duplicated");
            }, extra: rs === "active" ? /* @__PURE__ */ jsxs(Fragment, { children: [
              h.status === "acknowledged" && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => {
                care.completeHandover(h.id);
                toast.success("Completed");
              }, children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3.5 w-3.5 mr-2" }),
                "Mark Complete"
              ] }),
              h.status !== "closed" && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => {
                care.closeHandover(h.id);
                toast.success("Closed");
              }, children: [
                /* @__PURE__ */ jsx(Lock, { className: "h-3.5 w-3.5 mr-2" }),
                "Close"
              ] })
            ] }) : void 0 })
          ] })
        ] }) }) }, h.id);
      }),
      filtered.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground flex items-center gap-2 p-8 justify-center border rounded-lg", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
        " No handovers match these filters."
      ] })
    ] }),
    /* @__PURE__ */ jsx(HandoverDialog, { open: dialog.open, onOpenChange: (v) => setDialog((d) => ({
      ...d,
      open: v
    })), mode: dialog.mode, record: dialog.record })
  ] });
}
export {
  HandoversPage as component
};
