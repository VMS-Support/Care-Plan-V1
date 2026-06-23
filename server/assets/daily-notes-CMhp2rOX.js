import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { u as useCare, C as Card, e as CardContent, B as Badge, f as Button, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem } from "./router-DLzRbDkQ.js";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-Dtfzkh6H.js";
import { L as Label } from "./label-6k_A62K1.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { toast } from "sonner";
import { Activity, Mic } from "lucide-react";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "clsx";
import "tailwind-merge";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
function NewNote() {
  const {
    residents,
    addNote
  } = useCare();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    residentId: "",
    shift: "morning",
    observation: "",
    mood: "calm",
    foodIntake: "most",
    fluidIntake: "good",
    sleep: "good",
    behaviour: "",
    additionalNotes: ""
  });
  const startVoice = () => {
    const SR = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SR) {
      toast.error("Voice not supported in this browser");
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => setF((s) => ({
      ...s,
      observation: (s.observation + " " + e.results[0][0].transcript).trim()
    }));
    rec.start();
    toast.info("Listening…");
  };
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { children: "New Daily Note" }) }),
    /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Daily Note" }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Resident" }),
          /* @__PURE__ */ jsxs(Select, { value: f.residentId, onValueChange: (v) => setF({
            ...f,
            residentId: v
          }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Choose resident" }) }),
            /* @__PURE__ */ jsx(SelectContent, { children: residents.map((r) => /* @__PURE__ */ jsxs(SelectItem, { value: r.id, children: [
              r.firstName,
              " ",
              r.lastName
            ] }, r.id)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Shift" }),
          /* @__PURE__ */ jsxs(Select, { value: f.shift, onValueChange: (v) => setF({
            ...f,
            shift: v
          }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: ["morning", "afternoon", "night"].map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, children: s }, s)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Mood" }),
          /* @__PURE__ */ jsxs(Select, { value: f.mood, onValueChange: (v) => setF({
            ...f,
            mood: v
          }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: ["happy", "calm", "anxious", "withdrawn", "agitated"].map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, children: s }, s)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Food intake" }),
          /* @__PURE__ */ jsxs(Select, { value: f.foodIntake, onValueChange: (v) => setF({
            ...f,
            foodIntake: v
          }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: ["full", "most", "half", "little", "none"].map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, children: s }, s)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Fluid intake" }),
          /* @__PURE__ */ jsxs(Select, { value: f.fluidIntake, onValueChange: (v) => setF({
            ...f,
            fluidIntake: v
          }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: ["good", "moderate", "poor"].map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, children: s }, s)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Sleep" }),
          /* @__PURE__ */ jsxs(Select, { value: f.sleep, onValueChange: (v) => setF({
            ...f,
            sleep: v
          }), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: ["good", "broken", "poor"].map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, children: s }, s)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx(Label, { children: "Observation" }),
            /* @__PURE__ */ jsxs(Button, { type: "button", size: "sm", variant: "ghost", onClick: startVoice, children: [
              /* @__PURE__ */ jsx(Mic, { className: "h-4 w-4 mr-1" }),
              " Voice"
            ] })
          ] }),
          /* @__PURE__ */ jsx(Textarea, { rows: 3, value: f.observation, onChange: (e) => setF({
            ...f,
            observation: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Behaviour" }),
          /* @__PURE__ */ jsx(Textarea, { rows: 2, value: f.behaviour, onChange: (e) => setF({
            ...f,
            behaviour: e.target.value
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => {
          if (!f.residentId) {
            toast.error("Choose a resident");
            return;
          }
          addNote({
            ...f,
            date: (/* @__PURE__ */ new Date()).toISOString(),
            staff: "J. Roberts"
          });
          toast.success("Note saved");
          setOpen(false);
        }, children: "Save" })
      ] })
    ] })
  ] });
}
function DailyNotesPage() {
  const {
    notes,
    residents
  } = useCare();
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Daily Notes" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
          notes.length,
          " notes recorded"
        ] })
      ] }),
      /* @__PURE__ */ jsx(NewNote, {})
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: notes.map((n) => {
      const r = residents.find((x) => x.id === n.residentId);
      return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm flex-wrap", children: [
          /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
            r?.firstName,
            " ",
            r?.lastName
          ] }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] capitalize", children: n.shift }),
          n.linkedInterventionId && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] bg-info/10 text-info border-info/30 gap-1", children: [
            /* @__PURE__ */ jsx(Activity, { className: "h-2.5 w-2.5" }),
            " From intervention"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            n.date.slice(0, 10),
            " · ",
            n.staff
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: n.observation }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground mt-2", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            "Mood: ",
            n.mood
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Food: ",
            n.foodIntake
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Fluids: ",
            n.fluidIntake
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Sleep: ",
            n.sleep
          ] })
        ] })
      ] }) }, n.id);
    }) })
  ] });
}
export {
  DailyNotesPage as component
};
