import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { u as useCare, C as Card, e as CardContent } from "./router-DLzRbDkQ.js";
import "@tanstack/react-query";
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
const SplitComponent = () => {
  const {
    mdtNotes,
    residents
  } = useCare();
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-4 max-w-5xl", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "MDT Notes" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      mdtNotes.map((m) => {
        const r = residents.find((x) => x.id === m.residentId);
        return /* @__PURE__ */ jsx(Link, { to: "/residents/$id", params: {
          id: m.residentId
        }, children: /* @__PURE__ */ jsx(Card, { className: "hover:shadow-sm", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
            r?.firstName,
            " ",
            r?.lastName,
            " — ",
            m.date
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            m.authoredBy,
            " · Attendees: ",
            m.attendees
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm mt-1", children: [
            /* @__PURE__ */ jsx("strong", { children: "Discussion:" }),
            " ",
            m.discussion
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
            /* @__PURE__ */ jsx("strong", { children: "Recommendations:" }),
            " ",
            m.recommendations
          ] })
        ] }) }) }, m.id);
      }),
      mdtNotes.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No MDT notes recorded." })
    ] })
  ] });
};
export {
  SplitComponent as component
};
