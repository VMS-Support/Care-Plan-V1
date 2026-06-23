import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Q as Route, u as useCare, a as can, C as Card, b as CardHeader, d as CardTitle, e as CardContent, I as Input, f as Button, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem } from "./router-DLzRbDkQ.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { L as Label } from "./label-6k_A62K1.js";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "@radix-ui/react-label";
const kindMeta = {
  note: {
    title: "Daily Note",
    perm: "note.create"
  },
  intervention: {
    title: "Intervention",
    perm: "intervention.create"
  },
  task: {
    title: "Task",
    perm: "task.create"
  },
  incident: {
    title: "Incident",
    perm: "incident.create"
  },
  mdt: {
    title: "MDT Note",
    perm: "mdt.create"
  },
  visitor: {
    title: "Visitor Record",
    perm: "visitor.create"
  },
  outing: {
    title: "Resident Outing",
    perm: "outing.create"
  }
};
function RecordPage() {
  const {
    id
  } = Route.useParams();
  const {
    kind
  } = Route.useSearch();
  const {
    residents,
    currentRole,
    currentUserName,
    addNote,
    addIntervention,
    addTask,
    addIncident,
    addMDTNote,
    addVisitor,
    addOuting
  } = useCare();
  const navigate = useNavigate();
  const r = residents.find((x) => x.id === id);
  const meta = kindMeta[kind];
  const allowed = can(currentRole, meta.perm);
  if (!r) return /* @__PURE__ */ jsx("div", { className: "p-8", children: "Resident not found." });
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 max-w-2xl space-y-4", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/residents/$id", params: {
      id
    }, className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      " ",
      r.firstName,
      " ",
      r.lastName
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: meta.title }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Resident: ",
          /* @__PURE__ */ jsxs("strong", { className: "text-foreground", children: [
            r.firstName,
            " ",
            r.lastName
          ] }),
          " · Room ",
          r.roomNumber
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: !allowed ? /* @__PURE__ */ jsxs("p", { className: "text-sm text-destructive", children: [
        "Your current role (",
        currentRole,
        ") cannot create ",
        meta.title.toLowerCase(),
        "."
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        kind === "note" && /* @__PURE__ */ jsx(NoteForm, { onSubmit: (data) => {
          addNote({
            ...data,
            residentId: id,
            staff: currentUserName,
            date: (/* @__PURE__ */ new Date()).toISOString()
          });
          done();
        } }),
        kind === "intervention" && /* @__PURE__ */ jsx(InterventionForm, { onSubmit: (data) => {
          addIntervention({
            ...data,
            residentId: id,
            staff: currentUserName,
            date: (/* @__PURE__ */ new Date()).toISOString()
          });
          done();
        } }),
        kind === "task" && /* @__PURE__ */ jsx(TaskForm, { onSubmit: (data) => {
          addTask({
            ...data,
            residentId: id
          });
          done();
        } }),
        kind === "incident" && /* @__PURE__ */ jsx(IncidentForm, { onSubmit: (data) => {
          addIncident({
            ...data,
            residentId: id,
            reportedBy: currentUserName,
            date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
          });
          done();
        } }),
        kind === "mdt" && /* @__PURE__ */ jsx(MDTForm, { onSubmit: (data) => {
          addMDTNote({
            ...data,
            residentId: id,
            authoredBy: currentUserName,
            role: currentRole,
            date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
          });
          done();
        } }),
        kind === "visitor" && /* @__PURE__ */ jsx(VisitorForm, { onSubmit: (data) => {
          addVisitor({
            ...data,
            residentId: id,
            signedInBy: currentUserName,
            date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
          });
          done();
        } }),
        kind === "outing" && /* @__PURE__ */ jsx(OutingForm, { onSubmit: (data) => {
          addOuting({
            ...data,
            residentId: id,
            date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
          });
          done();
        } })
      ] }) })
    ] })
  ] });
  function done() {
    toast.success(`${meta.title} saved`);
    navigate({
      to: "/residents/$id",
      params: {
        id
      }
    });
  }
}
function NoteForm({
  onSubmit
}) {
  const [d, set] = useState({
    shift: "morning",
    observation: "",
    mood: "calm",
    foodIntake: "most",
    fluidIntake: "good",
    sleep: "good",
    behaviour: ""
  });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx(SelectField, { label: "Shift", value: d.shift, onChange: (v) => set({
      ...d,
      shift: v
    }), options: ["morning", "afternoon", "night"] }),
    /* @__PURE__ */ jsx(Field, { label: "Observation", children: /* @__PURE__ */ jsx(Textarea, { value: d.observation, onChange: (e) => set({
      ...d,
      observation: e.target.value
    }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(SelectField, { label: "Mood", value: d.mood, onChange: (v) => set({
        ...d,
        mood: v
      }), options: ["happy", "calm", "anxious", "withdrawn", "agitated"] }),
      /* @__PURE__ */ jsx(SelectField, { label: "Food intake", value: d.foodIntake, onChange: (v) => set({
        ...d,
        foodIntake: v
      }), options: ["full", "most", "half", "little", "none"] }),
      /* @__PURE__ */ jsx(SelectField, { label: "Fluid intake", value: d.fluidIntake, onChange: (v) => set({
        ...d,
        fluidIntake: v
      }), options: ["good", "moderate", "poor"] }),
      /* @__PURE__ */ jsx(SelectField, { label: "Sleep", value: d.sleep, onChange: (v) => set({
        ...d,
        sleep: v
      }), options: ["good", "broken", "poor"] })
    ] }),
    /* @__PURE__ */ jsx(Field, { label: "Behaviour", children: /* @__PURE__ */ jsx(Input, { value: d.behaviour, onChange: (e) => set({
      ...d,
      behaviour: e.target.value
    }) }) }),
    /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(d), children: "Save Note" })
  ] });
}
function InterventionForm({
  onSubmit
}) {
  const [d, set] = useState({
    intervention: "",
    outcome: "",
    residentResponse: "",
    followUpRequired: false
  });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx(Field, { label: "Intervention", children: /* @__PURE__ */ jsx(Input, { value: d.intervention, onChange: (e) => set({
      ...d,
      intervention: e.target.value
    }) }) }),
    /* @__PURE__ */ jsx(Field, { label: "Outcome", children: /* @__PURE__ */ jsx(Textarea, { value: d.outcome, onChange: (e) => set({
      ...d,
      outcome: e.target.value
    }) }) }),
    /* @__PURE__ */ jsx(Field, { label: "Resident response", children: /* @__PURE__ */ jsx(Input, { value: d.residentResponse, onChange: (e) => set({
      ...d,
      residentResponse: e.target.value
    }) }) }),
    /* @__PURE__ */ jsxs("label", { className: "flex gap-2 items-center text-sm", children: [
      /* @__PURE__ */ jsx("input", { type: "checkbox", checked: d.followUpRequired, onChange: (e) => set({
        ...d,
        followUpRequired: e.target.checked
      }) }),
      " Follow-up required"
    ] }),
    /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(d), children: "Save Intervention" })
  ] });
}
function TaskForm({
  onSubmit
}) {
  const [d, set] = useState({
    title: "",
    description: "",
    assignedTo: "Care team",
    dueDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    status: "pending"
  });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx(Field, { label: "Title", children: /* @__PURE__ */ jsx(Input, { value: d.title, onChange: (e) => set({
      ...d,
      title: e.target.value
    }) }) }),
    /* @__PURE__ */ jsx(Field, { label: "Description", children: /* @__PURE__ */ jsx(Textarea, { value: d.description, onChange: (e) => set({
      ...d,
      description: e.target.value
    }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: "Assigned to", children: /* @__PURE__ */ jsx(Input, { value: d.assignedTo, onChange: (e) => set({
        ...d,
        assignedTo: e.target.value
      }) }) }),
      /* @__PURE__ */ jsx(Field, { label: "Due date", children: /* @__PURE__ */ jsx(Input, { type: "date", value: d.dueDate, onChange: (e) => set({
        ...d,
        dueDate: e.target.value
      }) }) })
    ] }),
    /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(d), children: "Save Task" })
  ] });
}
function IncidentForm({
  onSubmit
}) {
  const [d, set] = useState({
    type: "fall",
    severity: "moderate",
    description: "",
    immediateAction: "",
    witnessedBy: "",
    followUpRequired: true,
    status: "open"
  });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(SelectField, { label: "Type", value: d.type, onChange: (v) => set({
        ...d,
        type: v
      }), options: ["fall", "medication_error", "injury", "behaviour", "near_miss", "other"] }),
      /* @__PURE__ */ jsx(SelectField, { label: "Severity", value: d.severity, onChange: (v) => set({
        ...d,
        severity: v
      }), options: ["low", "moderate", "high", "critical"] })
    ] }),
    /* @__PURE__ */ jsx(Field, { label: "Description", children: /* @__PURE__ */ jsx(Textarea, { value: d.description, onChange: (e) => set({
      ...d,
      description: e.target.value
    }) }) }),
    /* @__PURE__ */ jsx(Field, { label: "Immediate action", children: /* @__PURE__ */ jsx(Textarea, { value: d.immediateAction, onChange: (e) => set({
      ...d,
      immediateAction: e.target.value
    }) }) }),
    /* @__PURE__ */ jsx(Field, { label: "Witnessed by", children: /* @__PURE__ */ jsx(Input, { value: d.witnessedBy, onChange: (e) => set({
      ...d,
      witnessedBy: e.target.value
    }) }) }),
    /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(d), children: "Save Incident" })
  ] });
}
function MDTForm({
  onSubmit
}) {
  const [d, set] = useState({
    attendees: "",
    discussion: "",
    recommendations: "",
    followUpDate: ""
  });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx(Field, { label: "Attendees", children: /* @__PURE__ */ jsx(Input, { value: d.attendees, onChange: (e) => set({
      ...d,
      attendees: e.target.value
    }) }) }),
    /* @__PURE__ */ jsx(Field, { label: "Discussion", children: /* @__PURE__ */ jsx(Textarea, { value: d.discussion, onChange: (e) => set({
      ...d,
      discussion: e.target.value
    }) }) }),
    /* @__PURE__ */ jsx(Field, { label: "Recommendations", children: /* @__PURE__ */ jsx(Textarea, { value: d.recommendations, onChange: (e) => set({
      ...d,
      recommendations: e.target.value
    }) }) }),
    /* @__PURE__ */ jsx(Field, { label: "Follow-up date", children: /* @__PURE__ */ jsx(Input, { type: "date", value: d.followUpDate, onChange: (e) => set({
      ...d,
      followUpDate: e.target.value
    }) }) }),
    /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(d), children: "Save MDT Note" })
  ] });
}
function VisitorForm({
  onSubmit
}) {
  const [d, set] = useState({
    visitorName: "",
    relationship: "",
    arrivalTime: "",
    departureTime: "",
    notes: ""
  });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: "Visitor name", children: /* @__PURE__ */ jsx(Input, { value: d.visitorName, onChange: (e) => set({
        ...d,
        visitorName: e.target.value
      }) }) }),
      /* @__PURE__ */ jsx(Field, { label: "Relationship", children: /* @__PURE__ */ jsx(Input, { value: d.relationship, onChange: (e) => set({
        ...d,
        relationship: e.target.value
      }) }) }),
      /* @__PURE__ */ jsx(Field, { label: "Arrival", children: /* @__PURE__ */ jsx(Input, { type: "time", value: d.arrivalTime, onChange: (e) => set({
        ...d,
        arrivalTime: e.target.value
      }) }) }),
      /* @__PURE__ */ jsx(Field, { label: "Departure", children: /* @__PURE__ */ jsx(Input, { type: "time", value: d.departureTime, onChange: (e) => set({
        ...d,
        departureTime: e.target.value
      }) }) })
    ] }),
    /* @__PURE__ */ jsx(Field, { label: "Notes", children: /* @__PURE__ */ jsx(Textarea, { value: d.notes, onChange: (e) => set({
      ...d,
      notes: e.target.value
    }) }) }),
    /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(d), children: "Save Visitor" })
  ] });
}
function OutingForm({
  onSubmit
}) {
  const [d, set] = useState({
    destination: "",
    accompaniedBy: "",
    departureTime: "",
    returnTime: "",
    transportMethod: "",
    notes: "",
    riskAssessmentCompleted: false
  });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx(Field, { label: "Destination", children: /* @__PURE__ */ jsx(Input, { value: d.destination, onChange: (e) => set({
      ...d,
      destination: e.target.value
    }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: "Accompanied by", children: /* @__PURE__ */ jsx(Input, { value: d.accompaniedBy, onChange: (e) => set({
        ...d,
        accompaniedBy: e.target.value
      }) }) }),
      /* @__PURE__ */ jsx(Field, { label: "Transport", children: /* @__PURE__ */ jsx(Input, { value: d.transportMethod, onChange: (e) => set({
        ...d,
        transportMethod: e.target.value
      }) }) }),
      /* @__PURE__ */ jsx(Field, { label: "Departure", children: /* @__PURE__ */ jsx(Input, { type: "time", value: d.departureTime, onChange: (e) => set({
        ...d,
        departureTime: e.target.value
      }) }) }),
      /* @__PURE__ */ jsx(Field, { label: "Return", children: /* @__PURE__ */ jsx(Input, { type: "time", value: d.returnTime, onChange: (e) => set({
        ...d,
        returnTime: e.target.value
      }) }) })
    ] }),
    /* @__PURE__ */ jsx(Field, { label: "Notes", children: /* @__PURE__ */ jsx(Textarea, { value: d.notes, onChange: (e) => set({
      ...d,
      notes: e.target.value
    }) }) }),
    /* @__PURE__ */ jsxs("label", { className: "flex gap-2 items-center text-sm", children: [
      /* @__PURE__ */ jsx("input", { type: "checkbox", checked: d.riskAssessmentCompleted, onChange: (e) => set({
        ...d,
        riskAssessmentCompleted: e.target.checked
      }) }),
      " Risk assessment completed"
    ] }),
    /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(d), children: "Save Outing" })
  ] });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Label, { className: "text-sm", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-1.5", children })
  ] });
}
function SelectField({
  label,
  value,
  onChange,
  options
}) {
  return /* @__PURE__ */ jsx(Field, { label, children: /* @__PURE__ */ jsxs(Select, { value, onValueChange: onChange, children: [
    /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
    /* @__PURE__ */ jsx(SelectContent, { children: options.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o, className: "capitalize", children: o.replace("_", " ") }, o)) })
  ] }) });
}
export {
  RecordPage as component
};
