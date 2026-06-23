import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { u as useCare, a as can, I as Input, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem, f as Button, C as Card, e as CardContent, B as Badge } from "./router-DLzRbDkQ.js";
import { ArrowLeft, History } from "lucide-react";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "sonner";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
function VitalsAuditReport() {
  const {
    vitals,
    residents,
    currentRole
  } = useCare();
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  if (!can(currentRole, "vital.audit")) {
    return /* @__PURE__ */ jsx("div", { className: "p-8", children: /* @__PURE__ */ jsx("p", { children: "You do not have permission to view audit records." }) });
  }
  const entries = useMemo(() => {
    const out = [];
    for (const v of vitals) {
      const r = residents.find((x) => x.id === v.residentId);
      const rn = r ? `${r.firstName} ${r.lastName}` : v.residentId;
      for (const a of v.auditTrail) {
        out.push({
          vitalId: v.id,
          residentId: v.residentId,
          residentName: rn,
          action: a.action,
          byUserName: a.byUserName,
          byRole: a.byRole,
          at: a.at,
          reason: a.reason,
          patchSummary: a.patchSummary
        });
      }
    }
    return out.filter((e) => action === "all" || e.action === action).filter((e) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return e.residentName.toLowerCase().includes(q) || e.byUserName.toLowerCase().includes(q);
    }).sort((a, b) => b.at.localeCompare(a.at));
  }, [vitals, residents, search, action]);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-4 max-w-7xl", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/vitals", className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      " Vital Signs"
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-semibold tracking-tight flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(History, { className: "h-6 w-6 text-primary" }),
        " Observation Audit Report"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Full audit trail for all vital sign entries. Records are retained for compliance." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap", children: [
      /* @__PURE__ */ jsx(Input, { className: "max-w-sm", placeholder: "Search resident or staff…", value: search, onChange: (e) => setSearch(e.target.value) }),
      /* @__PURE__ */ jsxs(Select, { value: action, onValueChange: setAction, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-40", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All actions" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "created", children: "Created" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "edited", children: "Edited" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "deleted", children: "Deleted" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "restored", children: "Restored" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => window.print(), children: "Print" })
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-0 overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "When" }),
        /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Action" }),
        /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Resident" }),
        /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Staff" }),
        /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Role" }),
        /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Reason / Changes" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { className: "divide-y", children: [
        entries.map((e, i) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: new Date(e.at).toLocaleString() }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] capitalize", children: e.action }) }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsx(Link, { to: "/residents/$id", params: {
            id: e.residentId
          }, className: "text-primary hover:underline", children: e.residentName }) }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: e.byUserName }),
          /* @__PURE__ */ jsx("td", { className: "p-2 capitalize text-xs", children: e.byRole }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-xs text-muted-foreground", children: e.reason || e.patchSummary || "—" })
        ] }, `${e.vitalId}-${i}`)),
        entries.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-6 text-center text-muted-foreground text-sm", children: "No audit entries." }) })
      ] })
    ] }) }) })
  ] });
}
export {
  VitalsAuditReport as component
};
