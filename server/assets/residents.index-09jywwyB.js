import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { u as useCare, C as Card, e as CardContent, I as Input, f as Button, A as Avatar, m as AvatarFallback, w as age, B as Badge } from "./router-DLzRbDkQ.js";
import { a as isActionRequiredAlert } from "./alerts-DlzPJRcw.js";
import { Search, Plus } from "lucide-react";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-Dtfzkh6H.js";
import { L as Label } from "./label-6k_A62K1.js";
import { toast } from "sonner";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
const FILTERS = [{
  value: "all",
  label: "All"
}, {
  value: "active",
  label: "Active"
}, {
  value: "inactive",
  label: "Inactive"
}, {
  value: "active_respite",
  label: "Active Respite"
}, {
  value: "inactive_respite",
  label: "Inactive Respite"
}];
function NewResidentDialog() {
  const {
    addResident
  } = useCare();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "1940-01-01",
    roomNumber: "",
    primaryDiagnosis: ""
  });
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1.5" }),
      " New Resident"
    ] }) }),
    /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Admit New Resident" }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "First name" }),
          /* @__PURE__ */ jsx(Input, { value: form.firstName, onChange: (e) => setForm({
            ...form,
            firstName: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Last name" }),
          /* @__PURE__ */ jsx(Input, { value: form.lastName, onChange: (e) => setForm({
            ...form,
            lastName: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Date of birth" }),
          /* @__PURE__ */ jsx(Input, { type: "date", value: form.dob, onChange: (e) => setForm({
            ...form,
            dob: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Room number" }),
          /* @__PURE__ */ jsx(Input, { value: form.roomNumber, onChange: (e) => setForm({
            ...form,
            roomNumber: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Primary diagnosis" }),
          /* @__PURE__ */ jsx(Input, { value: form.primaryDiagnosis, onChange: (e) => setForm({
            ...form,
            primaryDiagnosis: e.target.value
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => {
          if (!form.firstName || !form.lastName) {
            toast.error("Name required");
            return;
          }
          addResident({
            ...form,
            gender: "female",
            admissionDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
            medicalHistory: "",
            allergies: "No known drug allergies",
            gp: "",
            consultant: "",
            nextOfKin: "",
            emergencyContact: "",
            communicationNeeds: "",
            religion: "",
            preferredLanguage: "English",
            mentalCapacity: "has_capacity",
            endOfLife: false,
            currentMedication: "",
            status: "active",
            residentType: "active"
          });
          toast.success("Resident admitted");
          setOpen(false);
        }, children: "Admit" })
      ] })
    ] })
  ] });
}
function ResidentsList() {
  const {
    residents,
    assessments,
    alerts,
    filteredResidentIds,
    filter: globalFilter
  } = useCare();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const globalActive = !!(globalFilter.wingId || globalFilter.roomId || globalFilter.residentId);
  const allowed = new Set(filteredResidentIds);
  const filtered = residents.filter((r) => {
    if (globalActive && !allowed.has(r.id)) return false;
    if (filter !== "all" && (r.residentType || "active") !== filter) return false;
    const t = (r.firstName + " " + r.lastName + " " + r.roomNumber + " " + r.id).toLowerCase();
    return t.includes(q.toLowerCase());
  });
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Residents" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
          filtered.length,
          " of ",
          residents.length,
          " residents"
        ] })
      ] }),
      /* @__PURE__ */ jsx(NewResidentDialog, {})
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex flex-col sm:flex-row gap-2 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[200px]", children: [
        /* @__PURE__ */ jsx(Search, { className: "h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" }),
        /* @__PURE__ */ jsx(Input, { className: "pl-8", placeholder: "Search by name, room, ID…", value: q, onChange: (e) => setQ(e.target.value) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-1 flex-wrap", children: FILTERS.map((f) => /* @__PURE__ */ jsx(Button, { size: "sm", variant: filter === f.value ? "default" : "outline", onClick: () => setFilter(f.value), children: f.label }, f.value)) })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: filtered.map((r) => {
      const rAlerts = alerts.filter((a) => a.residentId === r.id && isActionRequiredAlert(a) && !a.acknowledged && !a.resolvedAt);
      const highest = assessments.filter((a) => a.residentId === r.id && a.status !== "deleted").sort((a, b) => b.date.localeCompare(a.date))[0];
      return /* @__PURE__ */ jsx(Link, { to: "/residents/$id", params: {
        id: r.id
      }, children: /* @__PURE__ */ jsx(Card, { className: "hover:shadow-md transition-shadow cursor-pointer", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx(Avatar, { className: "h-12 w-12", children: /* @__PURE__ */ jsxs(AvatarFallback, { className: "bg-accent text-accent-foreground font-semibold", children: [
            r.firstName[0],
            r.lastName[0]
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "font-semibold truncate", children: [
              r.firstName,
              " ",
              r.lastName
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
              r.id,
              " · Age ",
              age(r.dob),
              " · Room ",
              r.roomNumber
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1 truncate", children: r.primaryDiagnosis })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1.5 mt-3", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px] capitalize", children: (r.residentType || "active").replace("_", " ") }),
          r.bed && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] capitalize", children: r.bed.bedType.replace("_", " ") }),
          r.endOfLife && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] border-destructive/40 text-destructive", children: "EoL" }),
          highest && (highest.riskLevel === "high" || highest.riskLevel === "very_high") && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] border-warning/50 text-warning-foreground bg-warning/10", children: "High risk" }),
          rAlerts.length > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] border-destructive/40 text-destructive", children: [
            rAlerts.length,
            " alert",
            rAlerts.length > 1 ? "s" : ""
          ] })
        ] })
      ] }) }) }, r.id);
    }) })
  ] });
}
export {
  ResidentsList as component
};
