import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { u as useCare, C as Card, e as CardContent, A as Avatar, m as AvatarFallback, B as Badge, r as roleLabels, b as CardHeader, d as CardTitle, I as Input, f as Button } from "./router-DLzRbDkQ.js";
import { L as Label } from "./label-6k_A62K1.js";
import { S as Switch } from "./switch-BrmJcFrV.js";
import { S as Separator } from "./separator-DA6AZJaG.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BZBuOn5G.js";
import { toast } from "sonner";
import "@tanstack/react-query";
import "lucide-react";
import "clsx";
import "tailwind-merge";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "@radix-ui/react-label";
import "@radix-ui/react-switch";
import "@radix-ui/react-separator";
import "@radix-ui/react-tabs";
function ProfilePage() {
  const {
    currentUser,
    updateUser,
    resetToDemoData,
    wings,
    residents,
    tasks,
    interventions,
    assessments,
    incidents,
    mdtNotes,
    carePlans
  } = useCare();
  const [draft, setDraft] = useState({
    email: currentUser.email,
    phone: currentUser.phone
  });
  const canResetDemoData = currentUser.role === "cnm" || currentUser.role === "don";
  const handleResetDemoData = () => {
    const confirmed = window.confirm("Reset all local care records to the demo dataset? This replaces your current browser-stored data.");
    if (!confirmed) return;
    resetToDemoData();
    toast.success("Demo data reset completed.");
  };
  const assignedWingNames = currentUser.assignedWings.length === 0 ? "Entire nursing home" : currentUser.assignedWings.map((id) => wings.find((w) => w.id === id)?.name || id).join(", ");
  const myResidentIds = currentUser.assignedWings.length === 0 ? residents.map((r) => r.id) : residents.filter((r) => currentUser.assignedWings.includes(r.wingId || "")).map((r) => r.id);
  const mySet = new Set(myResidentIds);
  const myStats = {
    residents: myResidentIds.length,
    tasks: tasks.filter((t) => t.status !== "deleted" && (!t.residentId || mySet.has(t.residentId))).length,
    interventions: interventions.filter((i) => mySet.has(i.residentId) && i.staff === currentUser.name).length,
    assessments: assessments.filter((a) => a.assessor === currentUser.name).length,
    incidents: incidents.filter((i) => mySet.has(i.residentId) && i.reportedBy.includes(currentUser.name.split(" ").pop() || "")).length,
    mdt: mdtNotes.filter((m) => m.authoredBy === currentUser.name).length,
    carePlans: carePlans.filter((c) => mySet.has(c.residentId) && c.createdBy === currentUser.name).length,
    reviews: carePlans.filter((c) => mySet.has(c.residentId) && new Date(c.reviewDate) <= new Date(Date.now() + 7 * 864e5)).length
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-5xl", children: [
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5 flex flex-col md:flex-row md:items-center gap-5", children: [
      /* @__PURE__ */ jsx(Avatar, { className: "h-20 w-20", children: /* @__PURE__ */ jsx(AvatarFallback, { className: "text-xl bg-accent text-accent-foreground", children: currentUser.name.split(" ").map((p) => p[0]).slice(0, 2).join("") }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: currentUser.name }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: roleLabels[currentUser.role] }),
          /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "capitalize", children: currentUser.status })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm", children: [
          /* @__PURE__ */ jsx(Info, { label: "Employee #", value: currentUser.employeeNumber }),
          /* @__PURE__ */ jsx(Info, { label: "Department", value: currentUser.department }),
          /* @__PURE__ */ jsx(Info, { label: "Start date", value: currentUser.startDate }),
          /* @__PURE__ */ jsx(Info, { label: "Last login", value: currentUser.lastLogin.slice(0, 10) })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "info", className: "space-y-4", children: [
      /* @__PURE__ */ jsxs(TabsList, { children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "info", children: "Profile Info" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "settings", children: "Settings" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "dashboard", children: "My Dashboard" })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "info", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5 grid md:grid-cols-2 gap-4 text-sm", children: [
        /* @__PURE__ */ jsx(Info, { label: "Full name", value: currentUser.name }),
        /* @__PURE__ */ jsx(Info, { label: "Role", value: roleLabels[currentUser.role] }),
        /* @__PURE__ */ jsx(Info, { label: "Email", value: currentUser.email }),
        /* @__PURE__ */ jsx(Info, { label: "Phone", value: currentUser.phone }),
        /* @__PURE__ */ jsx(Info, { label: "Department", value: currentUser.department }),
        /* @__PURE__ */ jsx(Info, { label: "Assigned wing(s)", value: assignedWingNames }),
        /* @__PURE__ */ jsx(Info, { label: "Employee number", value: currentUser.employeeNumber }),
        /* @__PURE__ */ jsx(Info, { label: "Start date", value: currentUser.startDate }),
        /* @__PURE__ */ jsx(Info, { label: "Last login", value: currentUser.lastLogin.slice(0, 16).replace("T", " ") }),
        /* @__PURE__ */ jsx(Info, { label: "Account status", value: currentUser.status })
      ] }) }) }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "settings", className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Contact details" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { children: "Email" }),
              /* @__PURE__ */ jsx(Input, { value: draft.email, onChange: (e) => setDraft({
                ...draft,
                email: e.target.value
              }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { children: "Phone" }),
              /* @__PURE__ */ jsx(Input, { value: draft.phone, onChange: (e) => setDraft({
                ...draft,
                phone: e.target.value
              }) })
            ] }),
            /* @__PURE__ */ jsx(Button, { onClick: () => {
              updateUser(currentUser.id, draft);
              toast.success("Profile updated");
            }, children: "Save changes" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Password" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx(Label, { children: "Current password" }),
              /* @__PURE__ */ jsx(Input, { type: "password", disabled: true, placeholder: "(demo: password change disabled)" })
            ] }),
            /* @__PURE__ */ jsx(Button, { variant: "outline", disabled: true, children: "Change password" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Real password management requires backend auth — enable Lovable Cloud to switch this on." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Notification preferences" }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "space-y-3", children: ["email", "sms", "inApp", "criticalAlertsOnly"].map((k) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx(Label, { className: "capitalize", children: k.replace(/([A-Z])/g, " $1").trim() }),
            /* @__PURE__ */ jsx(Switch, { checked: currentUser.notificationPrefs[k], onCheckedChange: (v) => updateUser(currentUser.id, {
              notificationPrefs: {
                ...currentUser.notificationPrefs,
                [k]: v
              }
            }) })
          ] }, k)) })
        ] }),
        canResetDemoData ? /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Developer Tools" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Reset all local browser data to the latest demo seed. Use for demos and workflow testing." }),
            /* @__PURE__ */ jsx(Button, { variant: "destructive", onClick: handleResetDemoData, children: "Reset data to Demo Data" })
          ] })
        ] }) : null
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "dashboard", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
          /* @__PURE__ */ jsx(Stat, { label: "My Residents", value: myStats.residents }),
          /* @__PURE__ */ jsx(Stat, { label: "My Tasks", value: myStats.tasks }),
          /* @__PURE__ */ jsx(Stat, { label: "My Interventions", value: myStats.interventions }),
          /* @__PURE__ */ jsx(Stat, { label: "My Assessments", value: myStats.assessments }),
          /* @__PURE__ */ jsx(Stat, { label: "My Incidents", value: myStats.incidents }),
          /* @__PURE__ */ jsx(Stat, { label: "My MDT Notes", value: myStats.mdt }),
          /* @__PURE__ */ jsx(Stat, { label: "My Care Plans", value: myStats.carePlans }),
          /* @__PURE__ */ jsx(Stat, { label: "Upcoming Reviews (7d)", value: myStats.reviews })
        ] }),
        /* @__PURE__ */ jsx(Separator, { className: "my-4" }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "My Residents" }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm", children: residents.filter((r) => mySet.has(r.id)).slice(0, 12).map((r) => /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
            id: r.id
          }, className: "border rounded p-2 hover:bg-accent", children: [
            /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
              r.firstName,
              " ",
              r.lastName
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
              "Room ",
              r.roomNumber,
              " · ",
              wings.find((w) => w.id === r.wingId)?.name || "—"
            ] })
          ] }, r.id)) })
        ] })
      ] })
    ] })
  ] });
}
function Info({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "text-sm capitalize", children: value })
  ] });
}
function Stat({
  label,
  value
}) {
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "text-2xl font-semibold tabular-nums mt-1", children: value })
  ] }) });
}
export {
  ProfilePage as component
};
