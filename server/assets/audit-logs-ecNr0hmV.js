import { jsx, jsxs } from "react/jsx-runtime";
import { u as useCare, a as can, C as Card, e as CardContent, B as Badge } from "./router-DLzRbDkQ.js";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "react";
import "lucide-react";
import "clsx";
import "tailwind-merge";
import "sonner";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
function AuditLogsPage() {
  const {
    auditLogs,
    currentRole
  } = useCare();
  if (!can(currentRole, "audit.view")) {
    return /* @__PURE__ */ jsx("div", { className: "p-8 text-sm text-muted-foreground", children: "Audit logs are only visible to the Director of Nursing." });
  }
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-4 max-w-5xl", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Audit Logs" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Chronological record of changes made in this session. Deleted records are retained for full traceability." }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
      auditLogs.map((l) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 flex items-center gap-3 text-sm", children: [
        /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize text-[10px]", children: l.role || "user" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: l.user }),
            " — ",
            l.action
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            "Entity: ",
            l.entity,
            l.reason ? ` · Reason: ${l.reason}` : ""
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground whitespace-nowrap", children: new Date(l.timestamp).toLocaleString() })
      ] }) }, l.id)),
      auditLogs.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No activity yet — actions you take will be logged here." })
    ] })
  ] });
}
export {
  AuditLogsPage as component
};
