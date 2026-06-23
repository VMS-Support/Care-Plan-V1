import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Z as Route, u as useCare, _ as ASSESSMENT_CATEGORIES, n as deriveStatus, x as assessmentMeta, a as can, C as Card, e as CardContent, I as Input, f as Button, b as CardHeader, d as CardTitle, B as Badge, y as riskBadgeCls, G as statusBadgeCls } from "./router-DLzRbDkQ.js";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle } from "./dialog-Dtfzkh6H.js";
import { ArrowLeft, Search, Lock, RefreshCw, Plus } from "lucide-react";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "sonner";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "@radix-ui/react-dialog";
const ALL_TYPES = ["abbey_pain", "waterlow", "barthel", "must", "mna", "mmse", "four_at", "falls", "continence", "pain_chart", "cornell", "gds15", "abc", "abs", "norton", "nutrition", "pinch_me"];
function NewAssessmentDialog({
  residentId
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const list = ALL_TYPES.filter((t) => {
    if (cat !== "all" && !ASSESSMENT_CATEGORIES.find((c) => c.id === cat)?.types.includes(t)) return false;
    const m = assessmentMeta[t];
    return !q || m.name.toLowerCase().includes(q.toLowerCase()) || m.category.toLowerCase().includes(q.toLowerCase());
  });
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1.5" }),
      " New Assessment"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-3xl", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Select Assessment Type" }) }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" }),
        /* @__PURE__ */ jsx(Input, { className: "pl-8", placeholder: "Search by name or category…", value: q, onChange: (e) => setQ(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: cat === "all" ? "default" : "outline", onClick: () => setCat("all"), children: "All" }),
        ASSESSMENT_CATEGORIES.map((c) => /* @__PURE__ */ jsx(Button, { size: "sm", variant: cat === c.id ? "default" : "outline", onClick: () => setCat(c.id), children: c.label }, c.id))
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2 max-h-[28rem] overflow-y-auto", children: list.map((t) => /* @__PURE__ */ jsxs(Link, { to: "/assessments/new/$residentId", params: {
        residentId
      }, search: {
        type: t
      }, onClick: () => setOpen(false), className: "border rounded-lg p-3 hover:bg-accent hover:border-accent transition", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: assessmentMeta[t].name }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: assessmentMeta[t].category })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: assessmentMeta[t].description })
      ] }, t)) })
    ] })
  ] });
}
function ResidentAssessments() {
  const {
    id
  } = Route.useParams();
  const {
    residents,
    assessments,
    currentRole
  } = useCare();
  const resident = residents.find((r) => r.id === id);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [typeF, setTypeF] = useState("all");
  const [statusF, setStatusF] = useState("active");
  const filtered = useMemo(() => {
    return assessments.filter((a) => {
      if (a.residentId !== id) return false;
      if (typeF !== "all" && a.type !== typeF) return false;
      if (cat !== "all") {
        const ts = ASSESSMENT_CATEGORIES.find((c) => c.id === cat)?.types || [];
        if (!ts.includes(a.type)) return false;
      }
      if (statusF === "active" && !(a.status === "completed" && !a.supersededById)) return false;
      if (statusF === "due") {
        if (a.status !== "completed" || deriveStatus(a) !== "due") return false;
      }
      if (statusF === "overdue") {
        if (a.status !== "completed" || deriveStatus(a) !== "overdue") return false;
      }
      if (statusF === "draft" && a.status !== "draft" && a.status !== "in_progress") return false;
      if (statusF === "archived" && a.status !== "archived") return false;
      if (statusF === "deleted" && a.status !== "deleted") return false;
      if (search) {
        const s = search.toLowerCase();
        if (!a.assessor.toLowerCase().includes(s) && !assessmentMeta[a.type].name.toLowerCase().includes(s)) return false;
      }
      return true;
    }).sort((x, y) => y.date.localeCompare(x.date));
  }, [assessments, id, typeF, cat, statusF, search]);
  if (!resident) return /* @__PURE__ */ jsx("div", { className: "p-8", children: "Resident not found." });
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-[1400px]", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
      id
    }, className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      " ",
      resident.firstName,
      " ",
      resident.lastName
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Assessment Centre" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
          resident.firstName,
          " ",
          resident.lastName,
          " · Room ",
          resident.roomNumber
        ] })
      ] }),
      can(currentRole, "assessment.create") && /* @__PURE__ */ jsx(NewAssessmentDialog, { residentId: id })
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3 space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" }),
        /* @__PURE__ */ jsx(Input, { className: "pl-8 h-9", placeholder: "Search assessor or assessment type…", value: search, onChange: (e) => setSearch(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5 items-center", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground mr-1", children: "Status:" }),
        ["active", "due", "overdue", "draft", "archived", "deleted", "all"].map((s) => /* @__PURE__ */ jsx(Button, { size: "sm", variant: statusF === s ? "default" : "outline", className: "capitalize", onClick: () => setStatusF(s), children: s }, s))
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5 items-center", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground mr-1", children: "Category:" }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: cat === "all" ? "default" : "outline", onClick: () => setCat("all"), children: "All" }),
        ASSESSMENT_CATEGORIES.map((c) => /* @__PURE__ */ jsx(Button, { size: "sm", variant: cat === c.id ? "default" : "outline", onClick: () => setCat(c.id), children: c.label }, c.id))
      ] }),
      cat !== "all" && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5 items-center", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground mr-1", children: "Type:" }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: typeF === "all" ? "default" : "outline", onClick: () => setTypeF("all"), children: "All" }),
        (ASSESSMENT_CATEGORIES.find((c2) => c2.id === cat)?.types || []).map((t) => /* @__PURE__ */ jsx(Button, { size: "sm", variant: typeF === t ? "default" : "outline", onClick: () => setTypeF(t), children: assessmentMeta[t].name }, t))
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base", children: [
        filtered.length,
        " assessment",
        filtered.length !== 1 ? "s" : ""
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxs("div", { className: "overflow-x-auto", children: [
        /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Assessment" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Score" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Risk" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Completed By" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Date" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Next" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { className: "divide-y", children: [
            filtered.slice(0, 200).map((a) => {
              const ds = deriveStatus(a);
              const canReassess = a.status === "completed" && !a.supersededById && can(currentRole, "assessment.create");
              return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30", children: [
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs(Link, { to: "/assessments/$assessmentId", params: {
                  assessmentId: a.id
                }, className: "font-medium hover:text-primary inline-flex items-center gap-1.5", children: [
                  a.locked && /* @__PURE__ */ jsx(Lock, { className: "h-3 w-3 text-muted-foreground" }),
                  assessmentMeta[a.type].name
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 tabular-nums font-semibold", children: a.totalScore }),
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `text-[10px] ${riskBadgeCls(a.riskLevel)}`, children: a.interpretation }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `text-[10px] capitalize ${statusBadgeCls(ds)}`, children: ds }) }),
                /* @__PURE__ */ jsxs("td", { className: "p-3 text-xs", children: [
                  a.assessor,
                  /* @__PURE__ */ jsx("br", {}),
                  /* @__PURE__ */ jsx("span", { className: "text-muted-foreground capitalize", children: a.assessorRole })
                ] }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: a.date.slice(0, 10) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: a.nextReassessmentDate || "—" }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: canReassess && /* @__PURE__ */ jsx(Link, { to: "/assessments/new/$residentId", params: {
                  residentId: id
                }, search: {
                  type: a.type
                }, children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "h-7 text-[11px]", children: [
                  /* @__PURE__ */ jsx(RefreshCw, { className: "h-3 w-3 mr-1" }),
                  " Reassess"
                ] }) }) })
              ] }, a.id);
            }),
            filtered.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "p-8 text-center text-sm text-muted-foreground", children: "No assessments match." }) })
          ] })
        ] }),
        filtered.length > 200 && /* @__PURE__ */ jsxs("div", { className: "p-3 text-xs text-muted-foreground text-center", children: [
          "Showing first 200 of ",
          filtered.length,
          ". Refine filters to narrow."
        ] })
      ] }) })
    ] })
  ] });
}
export {
  ResidentAssessments as component
};
