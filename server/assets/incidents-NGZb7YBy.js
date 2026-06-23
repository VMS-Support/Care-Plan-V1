import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { u as useCare, a as can, f as Button, C as Card, e as CardContent, B as Badge, D as DropdownMenuItem } from "./router-DLzRbDkQ.js";
import { Plus, CheckCircle2, RotateCcw, AlertCircle } from "lucide-react";
import { O as OpsListToolbar, R as RecordActions } from "./OpsListToolbar-ACf5VeZs.js";
import { I as IncidentDialog } from "./IncidentDialog-68IPLqb5.js";
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
function IncidentsPage() {
  const care = useCare();
  const {
    incidents,
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
    active: incidents.filter((i) => (i.recordStatus || "active") === "active").length,
    archived: incidents.filter((i) => i.recordStatus === "archived").length,
    deleted: incidents.filter((i) => i.recordStatus === "deleted").length
  }), [incidents]);
  const filtered = useMemo(() => {
    const filterIds = new Set(filteredResidentIds);
    const q = search.toLowerCase();
    let arr = incidents.filter((i) => {
      const rs = i.recordStatus || "active";
      if (rs !== statusTab) return false;
      if ((filter.wingId || filter.residentId) && !filterIds.has(i.residentId)) return false;
      if (workflowStatus !== "all" && i.status !== workflowStatus) return false;
      if (dateFrom && i.date < dateFrom) return false;
      if (dateTo && i.date > dateTo) return false;
      if (q) {
        const r = residents.find((x) => x.id === i.residentId);
        const hay = `${i.type} ${i.severity} ${i.description} ${i.reportedBy} ${r?.firstName} ${r?.lastName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    arr.sort((a, b) => {
      if (sort === "date-asc") return a.date.localeCompare(b.date);
      if (sort === "severity") {
        const order = {
          critical: 0,
          high: 1,
          moderate: 2,
          low: 3
        };
        return order[a.severity] - order[b.severity];
      }
      return b.date.localeCompare(a.date);
    });
    return arr;
  }, [incidents, statusTab, filteredResidentIds, filter, residents, search, sort, workflowStatus, dateFrom, dateTo]);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-4 max-w-6xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2 print:hidden", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Incidents" }),
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
      can(currentRole, "incident.create") && /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: () => setDialog({
        open: true,
        mode: "create"
      }), children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
        " New Incident"
      ] })
    ] }),
    /* @__PURE__ */ jsx(OpsListToolbar, { search, setSearch, statusTab, setStatusTab, sort, setSort, sortOptions: [{
      value: "date-desc",
      label: "Newest First"
    }, {
      value: "date-asc",
      label: "Oldest First"
    }, {
      value: "severity",
      label: "Severity"
    }], dateFrom, setDateFrom, dateTo, setDateTo, workflowStatus, setWorkflowStatus, workflowOptions: [{
      value: "draft",
      label: "Draft"
    }, {
      value: "open",
      label: "Open"
    }, {
      value: "under_investigation",
      label: "Under Investigation"
    }, {
      value: "closed",
      label: "Closed"
    }], counts }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      filtered.map((i) => {
        const r = residents.find((x) => x.id === i.residentId);
        const rs = i.recordStatus || "active";
        return /* @__PURE__ */ jsx(Card, { className: `hover:shadow-sm transition-shadow ${rs === "deleted" ? "opacity-60" : ""}`, children: /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
              id: i.residentId
            }, className: "font-medium capitalize hover:underline", children: [
              i.type.replace("_", " "),
              " — ",
              r?.firstName,
              " ",
              r?.lastName
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
              i.date,
              " · Room ",
              r?.roomNumber,
              " · Reported by ",
              i.reportedBy,
              i.createdBy && i.createdBy !== i.reportedBy ? ` · Created by ${i.createdBy}` : ""
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm mt-2 line-clamp-2", children: i.description }),
            rs === "deleted" && /* @__PURE__ */ jsxs("p", { className: "text-xs text-destructive mt-1", children: [
              "Deleted by ",
              i.deletedBy,
              " — ",
              i.deletedReason
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5 items-center flex-wrap", children: [
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: i.severity }),
            /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "capitalize", children: i.status.replace("_", " ") }),
            rs !== "active" && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize bg-muted", children: rs }),
            /* @__PURE__ */ jsx(RecordActions, { createdBy: i.createdBy, recordStatus: rs, recordLabel: "incident", onView: () => setDialog({
              open: true,
              mode: "view",
              record: i
            }), onEdit: () => setDialog({
              open: true,
              mode: "edit",
              record: i
            }), onArchive: () => {
              care.archiveIncident(i.id);
              toast.success("Archived");
            }, onRestore: () => {
              care.restoreIncident(i.id);
              toast.success("Restored");
            }, onDelete: (reason) => care.softDeleteIncident(i.id, reason), onDuplicate: () => {
              care.duplicateIncident(i.id);
              toast.success("Duplicated");
            }, extra: /* @__PURE__ */ jsxs(Fragment, { children: [
              i.status !== "closed" && rs === "active" && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => {
                care.closeIncident(i.id);
                toast.success("Closed");
              }, children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3.5 w-3.5 mr-2" }),
                "Close"
              ] }),
              i.status === "closed" && rs === "active" && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => {
                care.reopenIncident(i.id);
                toast.success("Reopened");
              }, children: [
                /* @__PURE__ */ jsx(RotateCcw, { className: "h-3.5 w-3.5 mr-2" }),
                "Reopen"
              ] })
            ] }) })
          ] })
        ] }) }) }, i.id);
      }),
      filtered.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground flex items-center gap-2 p-8 justify-center border rounded-lg", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
        " No incidents match these filters."
      ] })
    ] }),
    /* @__PURE__ */ jsx(IncidentDialog, { open: dialog.open, onOpenChange: (v) => setDialog((d) => ({
      ...d,
      open: v
    })), mode: dialog.mode, record: dialog.record })
  ] });
}
export {
  IncidentsPage as component
};
