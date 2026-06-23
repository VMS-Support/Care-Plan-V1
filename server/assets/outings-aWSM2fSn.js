import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { u as useCare, a as can, f as Button, C as Card, e as CardContent, B as Badge, D as DropdownMenuItem } from "./router-DLzRbDkQ.js";
import { Plus, LogOut, LogIn, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { O as OpsListToolbar, R as RecordActions } from "./OpsListToolbar-ACf5VeZs.js";
import { O as OutingDialog } from "./OutingDialog-Cxy38_pD.js";
import { toast } from "sonner";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "./dialog-Dtfzkh6H.js";
import "@radix-ui/react-dialog";
import "./textarea-DNkrzgM4.js";
import "./label-6k_A62K1.js";
import "@radix-ui/react-label";
import "./tabs-BZBuOn5G.js";
import "@radix-ui/react-tabs";
import "./switch-BrmJcFrV.js";
import "@radix-ui/react-switch";
function OutingsPage() {
  const care = useCare();
  const {
    outings,
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
    active: outings.filter((o) => (o.recordStatus || "active") === "active").length,
    archived: outings.filter((o) => o.recordStatus === "archived").length,
    deleted: outings.filter((o) => o.recordStatus === "deleted").length
  }), [outings]);
  const filtered = useMemo(() => {
    const filterIds = new Set(filteredResidentIds);
    const q = search.toLowerCase();
    let arr = outings.filter((o) => {
      const rs = o.recordStatus || "active";
      if (rs !== statusTab) return false;
      if ((filter.wingId || filter.residentId) && !filterIds.has(o.residentId)) return false;
      if (workflowStatus !== "all" && o.status !== workflowStatus) return false;
      if (dateFrom && o.date < dateFrom) return false;
      if (dateTo && o.date > dateTo) return false;
      if (q) {
        const r = residents.find((x) => x.id === o.residentId);
        const hay = `${o.destination} ${o.accompaniedBy} ${r?.firstName} ${r?.lastName} ${o.notes || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    arr.sort((a, b) => sort === "date-asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return arr;
  }, [outings, statusTab, filteredResidentIds, filter, residents, search, sort, workflowStatus, dateFrom, dateTo]);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-4 max-w-6xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2 print:hidden", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Resident Outings" }),
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
      can(currentRole, "outing.create") && /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: () => setDialog({
        open: true,
        mode: "create"
      }), children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
        " Add Outing"
      ] })
    ] }),
    /* @__PURE__ */ jsx(OpsListToolbar, { search, setSearch, statusTab, setStatusTab, sort, setSort, sortOptions: [{
      value: "date-desc",
      label: "Newest First"
    }, {
      value: "date-asc",
      label: "Oldest First"
    }], dateFrom, setDateFrom, dateTo, setDateTo, workflowStatus, setWorkflowStatus, workflowOptions: [{
      value: "planned",
      label: "Planned"
    }, {
      value: "departed",
      label: "Departed"
    }, {
      value: "returned",
      label: "Returned"
    }, {
      value: "cancelled",
      label: "Cancelled"
    }, {
      value: "closed",
      label: "Closed"
    }], counts }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      filtered.map((o) => {
        const r = residents.find((x) => x.id === o.residentId);
        const rs = o.recordStatus || "active";
        return /* @__PURE__ */ jsx(Card, { className: `hover:shadow-sm ${rs === "deleted" ? "opacity-60" : ""}`, children: /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
              /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
                id: o.residentId
              }, className: "hover:underline", children: [
                r?.firstName,
                " ",
                r?.lastName
              ] }),
              " ",
              "→ ",
              o.destination
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
              o.date,
              " · ",
              o.departureTime,
              "–",
              o.returnTime,
              " · ",
              o.transportMethod,
              " · With ",
              o.accompaniedBy
            ] }),
            o.notes && /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: o.notes }),
            o.outcomeNotes && /* @__PURE__ */ jsxs("p", { className: "text-xs mt-1", children: [
              /* @__PURE__ */ jsx("strong", { children: "Outcome:" }),
              " ",
              o.outcomeNotes
            ] }),
            o.status === "cancelled" && o.cancelledReason && /* @__PURE__ */ jsxs("p", { className: "text-xs text-destructive mt-1", children: [
              "Cancelled: ",
              o.cancelledReason
            ] }),
            rs === "deleted" && /* @__PURE__ */ jsxs("p", { className: "text-xs text-destructive mt-1", children: [
              "Deleted by ",
              o.deletedBy,
              " — ",
              o.deletedReason
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5 items-center flex-wrap", children: [
            o.riskAssessmentCompleted && /* @__PURE__ */ jsx(Badge, { variant: "outline", children: "Risk Assessed" }),
            o.status && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "capitalize", children: o.status }),
            rs !== "active" && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize bg-muted", children: rs }),
            /* @__PURE__ */ jsx(RecordActions, { createdBy: o.createdBy, recordStatus: rs, recordLabel: "outing", onView: () => setDialog({
              open: true,
              mode: "view",
              record: o
            }), onEdit: () => setDialog({
              open: true,
              mode: "edit",
              record: o
            }), onArchive: () => {
              care.archiveOuting(o.id);
              toast.success("Archived");
            }, onRestore: () => {
              care.restoreOuting(o.id);
              toast.success("Restored");
            }, onDelete: (reason) => care.softDeleteOuting(o.id, reason), extra: rs === "active" ? /* @__PURE__ */ jsxs(Fragment, { children: [
              o.status !== "departed" && o.status !== "returned" && o.status !== "closed" && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => {
                const t = prompt("Departure time (HH:MM)", (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5));
                if (t) {
                  care.recordOutingDeparture(o.id, t);
                  toast.success("Departure recorded");
                }
              }, children: [
                /* @__PURE__ */ jsx(LogOut, { className: "h-3.5 w-3.5 mr-2" }),
                "Record Departure"
              ] }),
              o.status !== "returned" && o.status !== "closed" && o.status !== "cancelled" && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => {
                const t = prompt("Return time (HH:MM)", (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5));
                if (!t) return;
                const notes = prompt("Outcome notes (optional)") || void 0;
                care.recordOutingReturn(o.id, t, notes);
                toast.success("Return recorded");
              }, children: [
                /* @__PURE__ */ jsx(LogIn, { className: "h-3.5 w-3.5 mr-2" }),
                "Record Return"
              ] }),
              o.status !== "closed" && o.status !== "cancelled" && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => {
                care.closeOuting(o.id);
                toast.success("Closed");
              }, children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3.5 w-3.5 mr-2" }),
                "Close"
              ] }),
              o.status !== "cancelled" && o.status !== "closed" && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => {
                const reason = prompt("Reason for cancellation?");
                if (reason?.trim()) {
                  care.cancelOuting(o.id, reason.trim());
                  toast.success("Cancelled");
                }
              }, children: [
                /* @__PURE__ */ jsx(XCircle, { className: "h-3.5 w-3.5 mr-2" }),
                "Cancel"
              ] })
            ] }) : void 0 })
          ] })
        ] }) }) }, o.id);
      }),
      filtered.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground flex items-center gap-2 p-8 justify-center border rounded-lg", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
        " No outings match these filters."
      ] })
    ] }),
    /* @__PURE__ */ jsx(OutingDialog, { open: dialog.open, onOpenChange: (v) => setDialog((d) => ({
      ...d,
      open: v
    })), mode: dialog.mode, record: dialog.record })
  ] });
}
export {
  OutingsPage as component
};
