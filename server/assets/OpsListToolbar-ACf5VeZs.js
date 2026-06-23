import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { u as useCare, o as canEditOpsRecord, a as can, p as DropdownMenu, q as DropdownMenuTrigger, f as Button, s as DropdownMenuContent, t as DropdownMenuLabel, D as DropdownMenuItem, v as DropdownMenuSeparator, I as Input, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem } from "./router-DLzRbDkQ.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, f as DialogDescription, e as DialogFooter } from "./dialog-Dtfzkh6H.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { L as Label } from "./label-6k_A62K1.js";
import { MoreVertical, Eye, Pencil, Copy, Archive, ArchiveRestore, Trash2, Search, ArrowUpDown, Printer } from "lucide-react";
import { toast } from "sonner";
import { T as Tabs, a as TabsList, b as TabsTrigger } from "./tabs-BZBuOn5G.js";
function RecordActions({
  createdBy,
  recordStatus = "active",
  onView,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onDuplicate,
  recordLabel = "record",
  extra
}) {
  const { currentRole, currentUserName } = useCare();
  const [delOpen, setDelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const canEdit = canEditOpsRecord(currentRole, currentUserName, createdBy);
  const canArchive = can(currentRole, "ops.archive");
  const canRestore = can(currentRole, "ops.restore");
  const canDelete = can(currentRole, "ops.delete");
  const canDup = can(currentRole, "ops.duplicate");
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(DropdownMenu, { children: [
      /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "h-8 w-8 p-0", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx(MoreVertical, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-48", onClick: (e) => e.stopPropagation(), children: [
        /* @__PURE__ */ jsx(DropdownMenuLabel, { className: "text-xs text-muted-foreground", children: "Actions" }),
        onView && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: onView, children: [
          /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5 mr-2" }),
          "View"
        ] }),
        onEdit && canEdit && recordStatus !== "deleted" && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: onEdit, children: [
          /* @__PURE__ */ jsx(Pencil, { className: "h-3.5 w-3.5 mr-2" }),
          "Edit"
        ] }),
        extra,
        onDuplicate && canDup && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: onDuplicate, children: [
          /* @__PURE__ */ jsx(Copy, { className: "h-3.5 w-3.5 mr-2" }),
          "Duplicate"
        ] }),
        /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
        recordStatus === "active" && onArchive && canArchive && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: onArchive, children: [
          /* @__PURE__ */ jsx(Archive, { className: "h-3.5 w-3.5 mr-2" }),
          "Archive"
        ] }),
        (recordStatus === "archived" || recordStatus === "deleted") && onRestore && canRestore && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: onRestore, children: [
          /* @__PURE__ */ jsx(ArchiveRestore, { className: "h-3.5 w-3.5 mr-2" }),
          "Restore"
        ] }),
        recordStatus !== "deleted" && onDelete && canDelete && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setDelOpen(true), className: "text-destructive focus:text-destructive", children: [
          /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5 mr-2" }),
          "Delete"
        ] }),
        !canEdit && !canArchive && !canDelete && !canDup && /* @__PURE__ */ jsx(DropdownMenuItem, { disabled: true, className: "text-xs text-muted-foreground", children: "Read-only for your role" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: delOpen, onOpenChange: setDelOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs(DialogTitle, { children: [
          "Delete ",
          recordLabel,
          "?"
        ] }),
        /* @__PURE__ */ jsxs(DialogDescription, { children: [
          "This is a soft delete. The record will be moved to ",
          /* @__PURE__ */ jsx("strong", { children: "Deleted Records" }),
          " and remain in the audit trail. It can be restored by a CNM or DON."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "del-reason", children: "Reason for deletion (required)" }),
        /* @__PURE__ */ jsx(Textarea, { id: "del-reason", value: reason, onChange: (e) => setReason(e.target.value), placeholder: "e.g. Duplicate entry, entered against wrong resident…", rows: 3 })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setDelOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "destructive",
            disabled: !reason.trim(),
            onClick: () => {
              onDelete?.(reason.trim());
              setDelOpen(false);
              setReason("");
              toast.success(`${recordLabel} deleted`);
            },
            children: "Delete"
          }
        )
      ] })
    ] }) })
  ] });
}
function OpsListToolbar({
  search,
  setSearch,
  statusTab,
  setStatusTab,
  sort,
  setSort,
  sortOptions,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  workflowStatus,
  setWorkflowStatus,
  workflowOptions,
  counts
}) {
  const { residents, wings, filter, setFilter } = useCare();
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2 print:hidden", children: [
    /* @__PURE__ */ jsx(Tabs, { value: statusTab, onValueChange: (v) => setStatusTab(v), children: /* @__PURE__ */ jsxs(TabsList, { children: [
      /* @__PURE__ */ jsxs(TabsTrigger, { value: "active", children: [
        "Active (",
        counts.active,
        ")"
      ] }),
      /* @__PURE__ */ jsxs(TabsTrigger, { value: "archived", children: [
        "Archived (",
        counts.archived,
        ")"
      ] }),
      /* @__PURE__ */ jsxs(TabsTrigger, { value: "deleted", children: [
        "Deleted (",
        counts.deleted,
        ")"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[200px]", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" }),
        /* @__PURE__ */ jsx(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search…", className: "pl-8 h-9" })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: filter.wingId || "all", onValueChange: (v) => setFilter({ ...filter, wingId: v === "all" ? void 0 : v, residentId: void 0 }), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 w-[140px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Wing" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Wings" }),
          wings.map((w) => /* @__PURE__ */ jsx(SelectItem, { value: w.id, children: w.name }, w.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: filter.residentId || "all", onValueChange: (v) => setFilter({ ...filter, residentId: v === "all" ? void 0 : v }), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 w-[160px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Resident" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Residents" }),
          residents.filter((r) => !filter.wingId || r.wingId === filter.wingId).map((r) => /* @__PURE__ */ jsxs(SelectItem, { value: r.id, children: [
            r.firstName,
            " ",
            r.lastName
          ] }, r.id))
        ] })
      ] }),
      /* @__PURE__ */ jsx(Input, { type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value), className: "h-9 w-[150px]" }),
      /* @__PURE__ */ jsx(Input, { type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value), className: "h-9 w-[150px]" }),
      workflowOptions && setWorkflowStatus && /* @__PURE__ */ jsxs(Select, { value: workflowStatus || "all", onValueChange: setWorkflowStatus, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 w-[140px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Status" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Statuses" }),
          workflowOptions.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o.value, children: o.label }, o.value))
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Select, { value: sort, onValueChange: setSort, children: [
        /* @__PURE__ */ jsxs(SelectTrigger, { className: "h-9 w-[160px]", children: [
          /* @__PURE__ */ jsx(ArrowUpDown, { className: "h-3.5 w-3.5 mr-1.5" }),
          /* @__PURE__ */ jsx(SelectValue, {})
        ] }),
        /* @__PURE__ */ jsx(SelectContent, { children: sortOptions.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o.value, children: o.label }, o.value)) })
      ] }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => window.print(), children: [
        /* @__PURE__ */ jsx(Printer, { className: "h-4 w-4 mr-1.5" }),
        " Print"
      ] })
    ] })
  ] });
}
export {
  OpsListToolbar as O,
  RecordActions as R
};
