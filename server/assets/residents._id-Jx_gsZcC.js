import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link, useNavigate } from "@tanstack/react-router";
import { C as Card, b as CardHeader, d as CardTitle, e as CardContent, z as heightAtDate, E as calcBMI, g as calcNEWS2, B as Badge, F as bmiCategory, u as useCare, n as deriveStatus, x as assessmentMeta, y as riskBadgeCls, G as statusBadgeCls, f as Button, S as Select, i as SelectTrigger, j as SelectValue, k as SelectContent, l as SelectItem, I as Input, R as Route, A as Avatar, m as AvatarFallback, p as DropdownMenu, q as DropdownMenuTrigger, s as DropdownMenuContent, D as DropdownMenuItem, w as age, a as can } from "./router-DLzRbDkQ.js";
import { i as isActionableClinicalAlert, a as isActionRequiredAlert } from "./alerts-DlzPJRcw.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BZBuOn5G.js";
import { Activity, Thermometer, Heart, Wind, Gauge, Droplets, Weight, AlertTriangle, Lock, RefreshCw, Plus, ArrowLeft, MoreVertical, User2, Pill, Bed, UserCog, Phone, ClipboardList, Calendar, Ban, Archive, Trash2 } from "lucide-react";
import { S as Separator } from "./separator-DA6AZJaG.js";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter, f as DialogDescription } from "./dialog-Dtfzkh6H.js";
import { T as Textarea } from "./textarea-DNkrzgM4.js";
import { L as Label } from "./label-6k_A62K1.js";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { V as VITAL_TYPE_LABELS, i as inferVitalRecordType, f as formatVitalValues } from "./vital-records-utXoyB6O.js";
import { I as IncidentDialog } from "./IncidentDialog-68IPLqb5.js";
import { V as VisitorDialog } from "./VisitorDialog-DicyranS.js";
import { O as OutingDialog } from "./OutingDialog-Cxy38_pD.js";
import { s as scheduledInterventions, a as scheduledInterventionLabel } from "./intervention-schedule-BIGQTR8s.js";
import "@tanstack/react-query";
import "clsx";
import "tailwind-merge";
import "class-variance-authority";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-slot";
import "@radix-ui/react-avatar";
import "@radix-ui/react-select";
import "@radix-ui/react-tabs";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "./switch-BrmJcFrV.js";
import "@radix-ui/react-switch";
function Stat({ icon: Icon, label, value, unit, tone }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-2.5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide", children: [
      /* @__PURE__ */ jsx(Icon, { className: "h-3 w-3" }),
      " ",
      label
    ] }),
    /* @__PURE__ */ jsxs("div", { className: `mt-0.5 text-base font-semibold tabular-nums ${tone || ""}`, children: [
      value ?? "—",
      value !== void 0 && unit && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-normal text-muted-foreground ml-0.5", children: unit })
    ] })
  ] });
}
function LatestVitalsCard({ vitals, resident, compact }) {
  const v = vitals.filter((x) => !x.deletedAt).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
  if (!v) {
    return /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Activity, { className: "h-4 w-4" }),
        " Latest Vitals"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "No observations recorded yet." }) })
    ] });
  }
  const h = v.height ?? heightAtDate(v.residentId, v.date, vitals, resident);
  const bmi = calcBMI(v.weight, h);
  const cat = bmiCategory(bmi);
  const news = calcNEWS2(v);
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2 flex flex-row items-center justify-between", children: [
      /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Activity, { className: "h-4 w-4 text-primary" }),
        " Latest Vitals"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground", children: [
        v.date,
        " ",
        v.time,
        " · ",
        v.recordedByName
      ] })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-3 ${compact ? "md:grid-cols-5" : "md:grid-cols-5 lg:grid-cols-6"} gap-2`, children: [
      /* @__PURE__ */ jsx(Stat, { icon: Thermometer, label: "Temp", value: v.temperature, unit: "°C" }),
      /* @__PURE__ */ jsx(Stat, { icon: Heart, label: "Pulse", value: v.pulse, unit: "bpm" }),
      /* @__PURE__ */ jsx(Stat, { icon: Wind, label: "Resp", value: v.respiratoryRate, unit: "/min" }),
      /* @__PURE__ */ jsx(Stat, { icon: Gauge, label: "BP", value: v.systolicBP ? `${v.systolicBP}/${v.diastolicBP ?? "?"}` : void 0, unit: "mmHg" }),
      /* @__PURE__ */ jsx(Stat, { icon: Droplets, label: "SpO2", value: v.spo2, unit: "%" }),
      /* @__PURE__ */ jsx(Stat, { icon: Droplets, label: "BGL", value: v.bloodGlucose, unit: "mmol/L" }),
      /* @__PURE__ */ jsx(Stat, { icon: Weight, label: "Weight", value: v.weight, unit: "kg" }),
      /* @__PURE__ */ jsx(Stat, { icon: Activity, label: "BMI", value: bmi }),
      /* @__PURE__ */ jsx(Stat, { icon: Activity, label: "Pain", value: v.painScore, unit: "/10" }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-2.5", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Activity, { className: "h-3 w-3" }),
          " NEWS2"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-0.5 flex items-baseline gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-base font-semibold tabular-nums", children: news.complete ? news.total : "—" }),
          news.complete && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `text-[9px] capitalize ${news.risk === "high" ? "border-destructive/40 text-destructive" : news.risk === "medium" ? "border-warning/40 text-warning-foreground" : ""}`, children: news.risk })
        ] })
      ] }),
      cat && /* @__PURE__ */ jsxs("div", { className: "col-span-2 text-[10px] text-muted-foreground self-center", children: [
        "BMI category: ",
        /* @__PURE__ */ jsx("span", { className: "capitalize font-medium text-foreground", children: cat })
      ] })
    ] }) })
  ] });
}
const SNAPSHOT_TYPES = [
  "waterlow",
  "barthel",
  "abbey_pain",
  "must",
  "mna",
  "falls",
  "mmse",
  "four_at",
  "continence"
];
function ClinicalSnapshot({
  residentId,
  showLatestVitals = true
}) {
  const { assessments, vitals, residents, clinicalAlerts } = useCare();
  const resident = residents.find((r) => r.id === residentId);
  const rv = vitals.filter((v) => v.residentId === residentId);
  const activeAlerts = clinicalAlerts.filter(
    (a) => a.residentId === residentId && isActionableClinicalAlert(a) && !a.dismissedAt
  );
  const latest = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const a of assessments) {
      if (a.residentId !== residentId) continue;
      if (a.status === "deleted" || a.status === "archived" || a.status === "superseded") continue;
      if (a.status !== "completed") continue;
      const cur = map.get(a.type);
      if (!cur || a.date > cur.date) map.set(a.type, a);
    }
    return SNAPSHOT_TYPES.map((t) => ({ type: t, a: map.get(t) })).filter((x) => x.a);
  }, [assessments, residentId]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    showLatestVitals && /* @__PURE__ */ jsx(LatestVitalsCard, { vitals: rv, resident, compact: true }),
    activeAlerts.length > 0 && /* @__PURE__ */ jsxs(Card, { className: "border-warning/40", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-warning" }),
        " Active Clinical Alerts (",
        activeAlerts.length,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-wrap gap-1.5", children: [
        activeAlerts.slice(0, 6).map((a) => /* @__PURE__ */ jsx(
          Badge,
          {
            variant: "outline",
            className: `text-[10px] ${a.severity === "critical" ? "border-destructive/40 text-destructive" : "border-warning/40 text-warning-foreground"}`,
            title: a.recommendation,
            children: a.title
          },
          a.id
        )),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/residents/$id/vitals",
            params: { id: residentId },
            className: "text-[10px] text-primary hover:underline ml-1 self-center",
            children: "View all →"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Activity, { className: "h-4 w-4 text-primary" }),
        " Clinical Snapshot"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: latest.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No completed assessments yet." }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2", children: latest.map(({ type, a }) => {
        const ds = deriveStatus(a);
        return /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/assessments/$assessmentId",
            params: { assessmentId: a.id },
            className: "rounded-md border p-3 hover:bg-accent/40 transition block",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-1.5", children: [
                /* @__PURE__ */ jsx("div", { className: "text-[11px] font-medium text-muted-foreground truncate", children: assessmentMeta[type].name }),
                a.locked && /* @__PURE__ */ jsx(Lock, { className: "h-3 w-3 text-muted-foreground shrink-0" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-baseline gap-1.5", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xl font-semibold tabular-nums", children: a.totalScore }),
                assessmentMeta[type].max && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground", children: [
                  "/",
                  assessmentMeta[type].max
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                Badge,
                {
                  variant: "outline",
                  className: `text-[9px] mt-1 capitalize ${riskBadgeCls(a.riskLevel)}`,
                  children: a.interpretation
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-center justify-between gap-1 text-[10px]", children: [
                /* @__PURE__ */ jsx(
                  Badge,
                  {
                    variant: "outline",
                    className: `text-[9px] capitalize ${statusBadgeCls(ds)}`,
                    children: ds
                  }
                ),
                a.nextReassessmentDate && /* @__PURE__ */ jsxs(
                  "span",
                  {
                    className: "text-muted-foreground truncate",
                    title: `Due ${a.nextReassessmentDate}`,
                    children: [
                      /* @__PURE__ */ jsx(RefreshCw, { className: "h-2.5 w-2.5 inline mr-0.5" }),
                      a.nextReassessmentDate.slice(5, 10)
                    ]
                  }
                )
              ] })
            ]
          },
          type
        );
      }) }) })
    ] })
  ] });
}
const TYPES = Object.keys(VITAL_TYPE_LABELS);
const numberValue = (value) => typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : void 0;
function RecordObservationFlow({ residentId: fixedResidentId, trigger, onRecorded }) {
  const { residents, vitals, recordVital } = useCare();
  const now = /* @__PURE__ */ new Date();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState();
  const [residentId, setResidentId] = useState(fixedResidentId ?? "");
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [time, setTime] = useState(now.toTimeString().slice(0, 5));
  const [values, setValues] = useState({ onOxygen: false, consciousness: "A" });
  const selectedResidentId = fixedResidentId ?? residentId;
  const resident = residents.find((candidate) => candidate.id === selectedResidentId);
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const bmi = useMemo(() => calcBMI(
    numberValue(values.weight),
    numberValue(values.height) ?? heightAtDate(selectedResidentId, date, vitals, resident)
  ), [values.weight, values.height, selectedResidentId, date, vitals, resident]);
  const news = calcNEWS2({
    temperature: numberValue(values.temperature),
    pulse: numberValue(values.pulse),
    respiratoryRate: numberValue(values.respiratoryRate),
    spo2: numberValue(values.spo2),
    systolicBP: numberValue(values.systolicBP),
    onOxygen: !!values.onOxygen,
    consciousness: values.consciousness
  });
  const close = () => {
    setOpen(false);
    setType(void 0);
    setValues({ onOxygen: false, consciousness: "A" });
  };
  const requireFields = (fields) => {
    const missing = fields.filter((field) => values[field] === void 0 || values[field] === "");
    if (missing.length) {
      toast.error(`Complete: ${missing.map(fieldLabel).join(", ")}`);
      return false;
    }
    return true;
  };
  const submit = () => {
    if (!type || !selectedResidentId) return toast.error("Select a resident and observation type");
    const required = {
      full_news2: ["temperature", "pulse", "respiratoryRate", "spo2", "systolicBP", "diastolicBP", "consciousness"],
      temperature: ["temperature"],
      blood_pressure: ["systolicBP", "diastolicBP"],
      oxygen_saturation: ["spo2"],
      blood_glucose: ["bloodGlucose", "glucoseContext"],
      weight_bmi: ["weight"],
      pain_score: ["painScore"],
      fluid_balance: [],
      respiratory: ["respiratoryRate"]
    };
    if (!requireFields(required[type] || [])) return;
    if (type === "fluid_balance" && numberValue(values.fluidIntakeMl) === void 0 && numberValue(values.fluidOutputMl) === void 0) {
      return toast.error("Enter intake, output, or both");
    }
    if (["full_news2", "oxygen_saturation", "respiratory"].includes(type) && values.onOxygen && !values.oxygenLpm) {
      return toast.error("Complete: Oxygen L/min");
    }
    const payload = {
      residentId: selectedResidentId,
      observationType: type,
      date,
      time,
      recordedAt: (/* @__PURE__ */ new Date(`${date}T${time}:00`)).toISOString()
    };
    const addNumber = (key) => {
      const value = numberValue(values[key]);
      if (value !== void 0) payload[key] = value;
    };
    const addText = (key) => {
      const value = values[key];
      if (typeof value === "string" && value.trim()) payload[key] = value.trim();
    };
    const numericByType = {
      full_news2: ["temperature", "pulse", "respiratoryRate", "spo2", "systolicBP", "diastolicBP", "oxygenLpm"],
      temperature: ["temperature"],
      blood_pressure: ["systolicBP", "diastolicBP", "pulse"],
      oxygen_saturation: ["spo2", "oxygenLpm", "respiratoryRate"],
      blood_glucose: ["bloodGlucose"],
      weight_bmi: ["weight", "height"],
      pain_score: ["painScore"],
      fluid_balance: ["fluidIntakeMl", "fluidOutputMl"],
      respiratory: ["respiratoryRate", "spo2", "oxygenLpm"]
    };
    numericByType[type].forEach(addNumber);
    if (["full_news2", "oxygen_saturation", "respiratory"].includes(type)) payload.onOxygen = !!values.onOxygen;
    if (type === "full_news2") addText("consciousness");
    if (type === "blood_glucose") {
      addText("glucoseContext");
      addText("insulinGiven");
    }
    if (type === "pain_score") {
      addText("painLocation");
      addText("painIntervention");
      addText("painOutcome");
    }
    if (type === "fluid_balance") addText("fluidRoute");
    addText("observationNotes");
    if (!["weight_bmi", "pain_score", "fluid_balance"].includes(type)) addText("deviceUsed");
    recordVital(payload);
    toast.success(`${VITAL_TYPE_LABELS[type]} recorded`);
    close();
    onRecorded?.();
  };
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: (next) => next ? setOpen(true) : close(), children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: trigger ?? /* @__PURE__ */ jsxs(Button, { size: "sm", children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
      " Record Observation"
    ] }) }),
    /* @__PURE__ */ jsx(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: !type ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Choose Observation Type" }) }),
      /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 gap-2", children: TYPES.map((item) => /* @__PURE__ */ jsx(Button, { variant: "outline", className: "h-auto min-h-12 justify-start whitespace-normal text-left", onClick: () => setType(item), children: VITAL_TYPE_LABELS[item] }, item)) }),
      /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: close, children: "Cancel" }) })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs("button", { type: "button", className: "text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 w-fit", onClick: () => setType(void 0), children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "h-3.5 w-3.5" }),
          " Observation types"
        ] }),
        /* @__PURE__ */ jsx(DialogTitle, { children: VITAL_TYPE_LABELS[type] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        !fixedResidentId && /* @__PURE__ */ jsx(Field, { label: "Resident", children: /* @__PURE__ */ jsxs(Select, { value: residentId, onValueChange: setResidentId, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select resident" }) }),
          /* @__PURE__ */ jsx(SelectContent, { children: residents.map((item) => /* @__PURE__ */ jsxs(SelectItem, { value: item.id, children: [
            item.firstName,
            " ",
            item.lastName,
            " · Room ",
            item.roomNumber
          ] }, item.id)) })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsx(Field, { label: "Date", children: /* @__PURE__ */ jsx(Input, { type: "date", value: date, onChange: (event) => setDate(event.target.value) }) }),
          /* @__PURE__ */ jsx(Field, { label: "Time", children: /* @__PURE__ */ jsx(Input, { type: "time", value: time, onChange: (event) => setTime(event.target.value) }) })
        ] }),
        /* @__PURE__ */ jsx(ObservationFields, { type, values, set, bmi, news }),
        /* @__PURE__ */ jsx(Field, { label: "Notes", children: /* @__PURE__ */ jsx(Textarea, { value: String(values.observationNotes ?? ""), onChange: (event) => set("observationNotes", event.target.value) }) }),
        !["weight_bmi", "pain_score", "fluid_balance"].includes(type) && /* @__PURE__ */ jsx(Field, { label: "Device Used", children: /* @__PURE__ */ jsx(Input, { value: String(values.deviceUsed ?? ""), onChange: (event) => set("deviceUsed", event.target.value), placeholder: "Optional" }) })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: close, children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: submit, children: "Record Observation" })
      ] })
    ] }) })
  ] });
}
function ObservationFields({ type, values, set, bmi, news }) {
  const input = (key, label, options) => /* @__PURE__ */ jsx(Field, { label, required: options?.required, children: /* @__PURE__ */ jsx(Input, { type: "number", step: options?.step, min: options?.min, max: options?.max, value: String(values[key] ?? ""), onChange: (event) => set(key, event.target.value) }) });
  const oxygen = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Field, { label: "Supplemental Oxygen", children: /* @__PURE__ */ jsxs(Select, { value: values.onOxygen ? "yes" : "no", onValueChange: (value) => set("onOxygen", value === "yes"), children: [
      /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
      /* @__PURE__ */ jsxs(SelectContent, { children: [
        /* @__PURE__ */ jsx(SelectItem, { value: "no", children: "No - room air" }),
        /* @__PURE__ */ jsx(SelectItem, { value: "yes", children: "Yes" })
      ] })
    ] }) }),
    values.onOxygen && input("oxygenLpm", "Oxygen L/min", { step: "0.5", required: true })
  ] });
  if (type === "full_news2") return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-3 gap-3", children: [
      input("temperature", "Temperature °C", { required: true, step: "0.1" }),
      input("pulse", "Pulse bpm", { required: true }),
      input("respiratoryRate", "Respiratory Rate", { required: true }),
      input("spo2", "SpO2 %", { required: true }),
      input("systolicBP", "Systolic BP", { required: true }),
      input("diastolicBP", "Diastolic BP", { required: true }),
      oxygen,
      /* @__PURE__ */ jsx(Field, { label: "Consciousness ACVPU", required: true, children: /* @__PURE__ */ jsxs(Select, { value: String(values.consciousness), onValueChange: (value) => set("consciousness", value), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsx(SelectContent, { children: ["A", "C", "V", "P", "U"].map((value) => /* @__PURE__ */ jsx(SelectItem, { value, children: value }, value)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(NEWS2Live, { news })
  ] });
  if (type === "temperature") return /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 gap-3", children: input("temperature", "Temperature °C", { required: true, step: "0.1" }) });
  if (type === "blood_pressure") return /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-3 gap-3", children: [
    input("systolicBP", "Systolic BP", { required: true }),
    input("diastolicBP", "Diastolic BP", { required: true }),
    input("pulse", "Pulse optional")
  ] });
  if (type === "oxygen_saturation") return /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-3", children: [
    input("spo2", "SpO2 %", { required: true }),
    oxygen,
    input("respiratoryRate", "Respiratory Rate optional")
  ] });
  if (type === "blood_glucose") return /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-3", children: [
    input("bloodGlucose", "Blood Glucose mmol/L", { required: true, step: "0.1" }),
    /* @__PURE__ */ jsx(Field, { label: "Meal Context", required: true, children: /* @__PURE__ */ jsxs(Select, { value: String(values.glucoseContext ?? ""), onValueChange: (value) => set("glucoseContext", value), children: [
      /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select context" }) }),
      /* @__PURE__ */ jsxs(SelectContent, { children: [
        /* @__PURE__ */ jsx(SelectItem, { value: "before_meal", children: "Before meal" }),
        /* @__PURE__ */ jsx(SelectItem, { value: "after_meal", children: "After meal" }),
        /* @__PURE__ */ jsx(SelectItem, { value: "random", children: "Random" }),
        /* @__PURE__ */ jsx(SelectItem, { value: "fasting", children: "Fasting" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Field, { label: "Insulin Given", children: /* @__PURE__ */ jsx(Input, { value: String(values.insulinGiven ?? ""), onChange: (event) => set("insulinGiven", event.target.value), placeholder: "Optional dose/type" }) })
  ] });
  if (type === "weight_bmi") return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-3", children: [
      input("weight", "Weight kg", { required: true, step: "0.1" }),
      input("height", "Height cm optional", { step: "0.1" })
    ] }),
    /* @__PURE__ */ jsx(Derived, { label: "BMI", value: bmi !== void 0 ? String(bmi) : "Enter weight; stored resident height is used when available" })
  ] });
  if (type === "pain_score") return /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-3", children: [
    input("painScore", "Pain Score 0-10", { required: true, min: 0, max: 10 }),
    /* @__PURE__ */ jsx(Field, { label: "Location", children: /* @__PURE__ */ jsx(Input, { value: String(values.painLocation ?? ""), onChange: (event) => set("painLocation", event.target.value) }) }),
    /* @__PURE__ */ jsx(Field, { label: "Intervention Given", children: /* @__PURE__ */ jsx(Textarea, { value: String(values.painIntervention ?? ""), onChange: (event) => set("painIntervention", event.target.value) }) }),
    /* @__PURE__ */ jsx(Field, { label: "Outcome", children: /* @__PURE__ */ jsx(Textarea, { value: String(values.painOutcome ?? ""), onChange: (event) => set("painOutcome", event.target.value) }) })
  ] });
  if (type === "fluid_balance") return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-3 gap-3", children: [
      input("fluidIntakeMl", "Intake ml"),
      input("fluidOutputMl", "Output ml"),
      /* @__PURE__ */ jsx(Field, { label: "Route / Type", children: /* @__PURE__ */ jsx(Input, { value: String(values.fluidRoute ?? ""), onChange: (event) => set("fluidRoute", event.target.value), placeholder: "Optional" }) })
    ] }),
    /* @__PURE__ */ jsx(Derived, { label: "Balance", value: `${(numberValue(values.fluidIntakeMl) ?? 0) - (numberValue(values.fluidOutputMl) ?? 0)} ml` })
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-3", children: [
    input("respiratoryRate", "Respiratory Rate", { required: true }),
    input("spo2", "SpO2 optional"),
    oxygen
  ] });
}
function Field({ label, required, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsxs(Label, { children: [
      label,
      required && /* @__PURE__ */ jsx("span", { className: "text-destructive ml-0.5", children: "*" })
    ] }),
    children
  ] });
}
function Derived({ label, value }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-muted/30 px-3 py-2 text-sm", children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground mr-2", children: label }),
    /* @__PURE__ */ jsx(Badge, { variant: "outline", children: value })
  ] });
}
function NEWS2Live({ news }) {
  if (!news.complete) return /* @__PURE__ */ jsx(Derived, { label: "NEWS2", value: "Complete full observations to calculate NEWS2" });
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-muted/30 p-3 space-y-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "NEWS2 Live" }),
      /* @__PURE__ */ jsx("span", { className: "text-xl font-semibold tabular-nums", children: news.total }),
      /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: news.risk })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-x-4 gap-y-1 text-xs", children: Object.entries(news.breakdown).map(([label, score]) => /* @__PURE__ */ jsxs("span", { children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: label }),
      " +",
      score
    ] }, label)) })
  ] });
}
function fieldLabel(key) {
  return { respiratoryRate: "Respiratory Rate", systolicBP: "Systolic BP", diastolicBP: "Diastolic BP", bloodGlucose: "Blood Glucose", glucoseContext: "Meal Context", painScore: "Pain Score", fluidIntakeMl: "Intake", fluidOutputMl: "Output", consciousness: "Consciousness" }[key] || key[0].toUpperCase() + key.slice(1);
}
const NOTE_CATEGORIES = [
  "General",
  "Clinical",
  "Behaviour",
  "Nutrition",
  "Hydration",
  "Skin",
  "Mobility",
  "Family Communication",
  "Medication",
  "Other"
];
const SHIFTS = ["Day", "Evening", "Night"];
const empty$4 = (staff, residentId) => ({
  residentId,
  date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
  staff,
  shift: "Day",
  observation: "",
  mood: "calm",
  foodIntake: "full",
  fluidIntake: "good",
  sleep: "good",
  behaviour: ""
});
function AddDailyNoteModal({ open, onOpenChange, residentId }) {
  const { addNote, currentUserName, residents } = useCare();
  const [form, setForm] = useState(empty$4(currentUserName, residentId));
  const [category, setCategory] = useState("General");
  useEffect(() => {
    if (open) {
      setForm(empty$4(currentUserName, residentId));
      setCategory("General");
    }
  }, [open, residentId, currentUserName]);
  const resident = residents.find((r) => r.id === residentId);
  function save() {
    if (!form.observation.trim()) {
      toast.error("Note details required");
      return;
    }
    addNote({
      ...form
    });
    toast.success("Daily Note Added");
    onOpenChange(false);
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Add Daily Note" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: resident && `For ${resident.firstName} ${resident.lastName}` })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Date *" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "date",
            value: form.date,
            onChange: (e) => setForm({ ...form, date: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Shift *" }),
        /* @__PURE__ */ jsxs(Select, { value: form.shift, onValueChange: (v) => setForm({ ...form, shift: v }), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: SHIFTS.map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, children: s }, s)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Note Category" }),
        /* @__PURE__ */ jsxs(Select, { value: category, onValueChange: setCategory, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: NOTE_CATEGORIES.map((cat) => /* @__PURE__ */ jsx(SelectItem, { value: cat, children: cat }, cat)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Note Details *" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            rows: 4,
            placeholder: "Enter your observation...",
            value: form.observation,
            onChange: (e) => setForm({ ...form, observation: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Mood" }),
        /* @__PURE__ */ jsxs(Select, { value: form.mood, onValueChange: (v) => setForm({ ...form, mood: v }), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: ["happy", "calm", "anxious", "withdrawn"].map((m) => /* @__PURE__ */ jsx(SelectItem, { value: m, className: "capitalize", children: m }, m)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Food Intake" }),
        /* @__PURE__ */ jsxs(
          Select,
          {
            value: form.foodIntake,
            onValueChange: (v) => setForm({ ...form, foodIntake: v }),
            children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsx(SelectContent, { children: ["full", "most", "half", "little"].map((f) => /* @__PURE__ */ jsx(SelectItem, { value: f, className: "capitalize", children: f }, f)) })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Fluid Intake" }),
        /* @__PURE__ */ jsxs(
          Select,
          {
            value: form.fluidIntake,
            onValueChange: (v) => setForm({ ...form, fluidIntake: v }),
            children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsx(SelectContent, { children: ["good", "moderate", "poor"].map((f) => /* @__PURE__ */ jsx(SelectItem, { value: f, className: "capitalize", children: f }, f)) })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Sleep" }),
        /* @__PURE__ */ jsxs(Select, { value: form.sleep, onValueChange: (v) => setForm({ ...form, sleep: v }), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: ["good", "broken", "poor"].map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s, className: "capitalize", children: s }, s)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Behaviour" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            rows: 2,
            placeholder: "Note any behaviour...",
            value: form.behaviour,
            onChange: (e) => setForm({ ...form, behaviour: e.target.value })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }),
      /* @__PURE__ */ jsx(Button, { onClick: save, children: "Save Daily Note" })
    ] })
  ] }) });
}
const FREQUENCY_OPTIONS = [
  { label: "Once", value: "once" },
  { label: "Per Shift", value: "per_shift" },
  { label: "Every 2 Hours", value: "every_2_hours" },
  { label: "Every 4 Hours", value: "every_4_hours" },
  { label: "Every 6 Hours", value: "every_6_hours" },
  { label: "Hourly", value: "hourly" },
  { label: "Daily", value: "daily" },
  { label: "Twice Daily", value: "twice_daily" },
  { label: "Three Times Daily", value: "three_times_daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "PRN (As Needed)", value: "prn" },
  { label: "Custom", value: "custom" }
];
const ASSIGNED_ROLES = ["Carer", "Nurse", "Physiotherapist", "Occupational Therapist"];
const empty$3 = (residentId) => ({
  residentId,
  problemId: "",
  name: "",
  description: "",
  frequencyType: "daily",
  frequencyValue: void 0,
  frequencyInstructions: "",
  assignedRole: "Nurse",
  assignedStaffId: void 0,
  assignedStaffName: "",
  startDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
  reviewDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
  status: "active",
  notes: "",
  createdAt: (/* @__PURE__ */ new Date()).toISOString(),
  createdBy: "",
  createdByRole: "nurse"
});
function AddInterventionModal({
  open,
  onOpenChange,
  residentId,
  initialProblemId,
  lockProblemSelection
}) {
  const { carePlanProblems, residents, currentUserName, currentRole, addProblemIntervention } = useCare();
  const [form, setForm] = useState(empty$3(residentId));
  const [frequency, setFrequency] = useState("daily");
  useEffect(() => {
    if (open) {
      const newForm = empty$3(residentId);
      if (initialProblemId) {
        newForm.problemId = initialProblemId;
      }
      setForm(newForm);
      setFrequency("daily");
    }
  }, [open, residentId, initialProblemId]);
  const resident = residents.find((r) => r.id === residentId);
  const problems = carePlanProblems.filter(
    (p) => p.residentId === residentId && p.status === "active"
  );
  function validateForm() {
    if (!form.problemId.trim()) {
      toast.error("Please select a care plan problem");
      return false;
    }
    if (!form.name.trim()) {
      toast.error("Intervention name is required");
      return false;
    }
    if (!form.startDate) {
      toast.error("Start date is required");
      return false;
    }
    if (!form.endDate) {
      toast.error("End date is required");
      return false;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error("End date must be after start date");
      return false;
    }
    return true;
  }
  function save() {
    if (!validateForm()) return;
    try {
      addProblemIntervention({
        ...form,
        frequencyType: frequency,
        createdBy: currentUserName,
        createdByRole: currentRole
      });
      toast.success("Intervention scheduled successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule intervention");
    }
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Add Intervention" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: resident && `For ${resident.firstName} ${resident.lastName} — Define and schedule the intervention` })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Related Care Plan Problem *" }),
        /* @__PURE__ */ jsxs(
          Select,
          {
            value: form.problemId,
            onValueChange: (v) => setForm({ ...form, problemId: v }),
            disabled: lockProblemSelection,
            children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a problem..." }) }),
              /* @__PURE__ */ jsx(SelectContent, { children: problems.map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p.id, children: `${p.problemStatement} • ${p.category.replace(/_/g, " ")} • ${p.riskLevel.replace(/_/g, " ")} • ${p.status}` }, p.id)) })
            ]
          }
        ),
        problems.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "No active care plan problems. Create one first." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Intervention Name *" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "e.g., Daily Skin Inspection, Reposition Every 2 Hours",
            value: form.name,
            onChange: (e) => setForm({ ...form, name: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Description" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            rows: 2,
            placeholder: "Detailed description of the intervention...",
            value: form.description || "",
            onChange: (e) => setForm({ ...form, description: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Frequency *" }),
        /* @__PURE__ */ jsxs(Select, { value: frequency, onValueChange: (v) => setFrequency(v), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: FREQUENCY_OPTIONS.map((f) => /* @__PURE__ */ jsx(SelectItem, { value: f.value, children: f.label }, f.value)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Assigned Role" }),
        /* @__PURE__ */ jsxs(
          Select,
          {
            value: form.assignedRole || "Nurse",
            onValueChange: (v) => setForm({ ...form, assignedRole: v }),
            children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsx(SelectContent, { children: ASSIGNED_ROLES.map((r) => /* @__PURE__ */ jsx(SelectItem, { value: r, children: r }, r)) })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Assigned Staff Name" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "e.g., J. Roberts (RN)",
            value: form.assignedStaffName || "",
            onChange: (e) => setForm({ ...form, assignedStaffName: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Start Date *" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "date",
            value: form.startDate,
            onChange: (e) => setForm({ ...form, startDate: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Review Date *" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "date",
            value: form.reviewDate,
            onChange: (e) => setForm({ ...form, reviewDate: e.target.value }),
            title: "Intervention status will be set to 'Review Due' on this date"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "End Date *" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "date",
            value: form.endDate,
            onChange: (e) => setForm({ ...form, endDate: e.target.value }),
            title: "Intervention will complete or require review on this date"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Status" }),
        /* @__PURE__ */ jsxs(
          Select,
          {
            value: form.status,
            onValueChange: (v) => setForm({ ...form, status: v }),
            children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "active", children: "Active" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "review_due", children: "Review Due" })
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Additional Notes" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            rows: 2,
            placeholder: "Clinical notes, special instructions, precautions...",
            value: form.notes || "",
            onChange: (e) => setForm({ ...form, notes: e.target.value })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }),
      /* @__PURE__ */ jsx(Button, { onClick: save, children: "Schedule Intervention" })
    ] })
  ] }) });
}
const OUTCOMES = [
  { label: "Completed", value: "completed" },
  { label: "Partially Completed", value: "partially_completed" },
  { label: "Missed", value: "missed" },
  { label: "Refused", value: "refused" },
  { label: "Escalated", value: "escalated" }
];
const empty$2 = (interventionId, residentId, problemId, staffName) => ({
  interventionId,
  problemId,
  residentId,
  date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
  time: (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5),
  staffId: "",
  staffName,
  role: "nurse",
  outcome: "completed",
  residentResponse: "",
  followUpRequired: false,
  followUpDetails: "",
  comments: "",
  createdAt: (/* @__PURE__ */ new Date()).toISOString()
});
function AddInterventionCompletionModal({
  open,
  onOpenChange,
  intervention,
  residentId
}) {
  const { addProblemInterventionLog, residents, currentUserName, currentRole } = useCare();
  const [form, setForm] = useState(
    empty$2(intervention?.id || "", residentId, intervention?.problemId || "", currentUserName)
  );
  useEffect(() => {
    if (open && intervention) {
      setForm(empty$2(intervention.id, residentId, intervention.problemId, currentUserName));
    }
  }, [open, intervention, residentId, currentUserName]);
  const resident = residents.find((r) => r.id === residentId);
  function validateForm() {
    if (!form.outcome) {
      toast.error("Please select an outcome");
      return false;
    }
    return true;
  }
  function save() {
    if (!validateForm()) return;
    addProblemInterventionLog({
      ...form,
      staffName: currentUserName,
      role: currentRole
    });
    toast.success("Intervention completion recorded");
    onOpenChange(false);
  }
  if (!intervention) return null;
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Record Intervention Completion" }),
      /* @__PURE__ */ jsxs(DialogDescription, { children: [
        resident && `${resident.firstName} ${resident.lastName}`,
        " · ",
        intervention.name
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Date *" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "date",
            value: form.date,
            onChange: (e) => setForm({ ...form, date: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Time *" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "time",
            value: form.time,
            onChange: (e) => setForm({ ...form, time: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Outcome *" }),
        /* @__PURE__ */ jsxs(
          Select,
          {
            value: form.outcome,
            onValueChange: (v) => setForm({ ...form, outcome: v }),
            children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsx(SelectContent, { children: OUTCOMES.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o.value, children: o.label }, o.value)) })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Resident Response" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            rows: 2,
            placeholder: "How did the resident respond? e.g., Comfortable, cooperative, settled",
            value: form.residentResponse || "",
            onChange: (e) => setForm({ ...form, residentResponse: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "col-span-2 space-y-1.5", children: /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: form.followUpRequired,
            onChange: (e) => setForm({ ...form, followUpRequired: e.target.checked })
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Follow-up Required" })
      ] }) }),
      form.followUpRequired && /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Follow-up Details" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            rows: 2,
            placeholder: "Describe what follow-up action is needed...",
            value: form.followUpDetails || "",
            onChange: (e) => setForm({ ...form, followUpDetails: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Additional Comments" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            rows: 2,
            placeholder: "Any additional notes about this completion...",
            value: form.comments || "",
            onChange: (e) => setForm({ ...form, comments: e.target.value })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }),
      /* @__PURE__ */ jsx(Button, { onClick: save, children: "Record Completion" })
    ] })
  ] }) });
}
function InterventionReviewModal({
  open,
  onOpenChange,
  intervention,
  action,
  onSuccess
}) {
  const { updateProblemIntervention, currentUserName, currentRole } = useCare();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    newReviewDate: "",
    reason: "",
    notes: ""
  });
  const resetForm = () => {
    setFormData({ newReviewDate: "", reason: "", notes: "" });
  };
  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };
  const handleExtendOrReschedule = async () => {
    if (!intervention || !formData.newReviewDate) {
      toast.error("Please select a new review date");
      return;
    }
    if (new Date(formData.newReviewDate) <= /* @__PURE__ */ new Date()) {
      toast.error("Review date must be in the future");
      return;
    }
    if (new Date(formData.newReviewDate) >= new Date(intervention.endDate)) {
      toast.error("Review date must be before intervention end date");
      return;
    }
    setIsLoading(true);
    try {
      await updateProblemIntervention(intervention.id, {
        reviewDate: formData.newReviewDate,
        status: "active",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedBy: currentUserName,
        updatedByRole: currentRole
      });
      toast.success("Intervention rescheduled successfully");
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to reschedule intervention");
    } finally {
      setIsLoading(false);
    }
  };
  const handleCompleteOrStop = async () => {
    if (!intervention || !formData.reason) {
      toast.error("Please provide a completion reason");
      return;
    }
    setIsLoading(true);
    try {
      await updateProblemIntervention(intervention.id, {
        status: "completed",
        completedAt: (/* @__PURE__ */ new Date()).toISOString(),
        completedBy: currentUserName,
        completedByRole: currentRole,
        completionReason: formData.reason,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedBy: currentUserName,
        updatedByRole: currentRole
      });
      toast.success("Intervention marked as completed");
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to complete intervention");
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancel = async () => {
    if (!intervention || !formData.reason) {
      toast.error("Please provide a cancellation reason");
      return;
    }
    setIsLoading(true);
    try {
      await updateProblemIntervention(intervention.id, {
        status: "cancelled",
        cancelledAt: (/* @__PURE__ */ new Date()).toISOString(),
        cancelledBy: currentUserName,
        cancelledByRole: currentRole,
        cancellationReason: formData.reason,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedBy: currentUserName,
        updatedByRole: currentRole
      });
      toast.success("Intervention cancelled");
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to cancel intervention");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSave = async () => {
    if (action === "extend") {
      await handleExtendOrReschedule();
    } else if (action === "complete") {
      await handleCompleteOrStop();
    } else if (action === "cancel") {
      await handleCancel();
    }
  };
  if (!intervention) return null;
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { children: [
      action === "extend" && "Reschedule Intervention",
      action === "complete" && "Complete Intervention",
      action === "cancel" && "Cancel Intervention"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-muted p-3 rounded-md", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: intervention.name }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
          "Currently reviewed on: ",
          intervention.reviewDate
        ] })
      ] }),
      action === "extend" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "newReviewDate", className: "text-sm", children: "New Review Date" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "newReviewDate",
            type: "date",
            value: formData.newReviewDate,
            onChange: (e) => setFormData({ ...formData, newReviewDate: e.target.value }),
            min: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            max: intervention.endDate
          }
        )
      ] }),
      action === "complete" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "reason", className: "text-sm", children: "Completion Reason" }),
        /* @__PURE__ */ jsxs(
          Select,
          {
            value: formData.reason,
            onValueChange: (value) => setFormData({ ...formData, reason: value }),
            children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select reason" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "goal_achieved", children: "Goal Achieved" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "clinical_improvement", children: "Clinical Improvement" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "resident_request", children: "Resident Request" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "medical_contraindication", children: "Medical Contraindication" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "other", children: "Other" })
              ] })
            ]
          }
        )
      ] }),
      action === "cancel" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "reason", className: "text-sm", children: "Cancellation Reason" }),
        /* @__PURE__ */ jsxs(
          Select,
          {
            value: formData.reason,
            onValueChange: (value) => setFormData({ ...formData, reason: value }),
            children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select reason" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "no_longer_clinically_appropriate", children: "No Longer Clinically Appropriate" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "resident_preference", children: "Resident Preference" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "resource_constraints", children: "Resource Constraints" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "duplicate_intervention", children: "Duplicate Intervention" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "other", children: "Other" })
              ] })
            ]
          }
        )
      ] }),
      (action === "complete" || action === "cancel") && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "notes", className: "text-sm", children: "Additional Notes (Optional)" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            id: "notes",
            placeholder: "Add any additional clinical notes...",
            value: formData.notes,
            onChange: (e) => setFormData({ ...formData, notes: e.target.value }),
            className: "min-h-24"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => handleOpenChange(false), disabled: isLoading, children: "Cancel" }),
      /* @__PURE__ */ jsx(Button, { onClick: handleSave, disabled: isLoading, children: isLoading ? "Saving..." : "Confirm" })
    ] })
  ] }) });
}
const PRIORITIES = ["Low", "Medium", "High"];
const empty$1 = (residentId) => ({
  residentId,
  title: "",
  assignedTo: "",
  dueDate: new Date(Date.now() + 864e5).toISOString().slice(0, 10),
  status: "pending"
});
function AddTaskModal({ open, onOpenChange, residentId }) {
  const { addTask, residents } = useCare();
  const [form, setForm] = useState(empty$1(residentId));
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  useEffect(() => {
    if (open) {
      setForm(empty$1(residentId));
      setPriority("Medium");
      setDescription("");
    }
  }, [open, residentId]);
  const resident = residents.find((r) => r.id === residentId);
  function save() {
    if (!form.title.trim()) {
      toast.error("Task name required");
      return;
    }
    addTask(form);
    toast.success("Task Created");
    onOpenChange(false);
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-xl", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Add Task" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: resident && `For ${resident.firstName} ${resident.lastName}` })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Task Name *" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Enter task name...",
            value: form.title,
            onChange: (e) => setForm({ ...form, title: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Description" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            rows: 3,
            placeholder: "Add task details...",
            value: description,
            onChange: (e) => setDescription(e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { children: "Priority" }),
          /* @__PURE__ */ jsxs(Select, { value: priority, onValueChange: setPriority, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: PRIORITIES.map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p, children: p }, p)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { children: "Assigned To" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Staff name",
              value: form.assignedTo,
              onChange: (e) => setForm({ ...form, assignedTo: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { children: "Due Date" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "date",
              value: form.dueDate,
              onChange: (e) => setForm({ ...form, dueDate: e.target.value })
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }),
      /* @__PURE__ */ jsx(Button, { onClick: save, children: "Create Task" })
    ] })
  ] }) });
}
const PROFESSIONAL_TYPES = [
  "GP",
  "Nurse",
  "Physiotherapist",
  "Occupational Therapist",
  "Dietitian",
  "Speech & Language",
  "Family Representative",
  "Social Worker",
  "Other"
];
const empty = (staff, residentId) => ({
  residentId,
  date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
  attendees: "",
  discussion: "",
  recommendations: "",
  followUpDate: "",
  authoredBy: staff,
  role: "nurse"
});
function AddMDTNoteModal({ open, onOpenChange, residentId }) {
  const { addMdtNote, currentUserName, residents } = useCare();
  const [form, setForm] = useState(empty(currentUserName, residentId));
  const [professional, setProfessional] = useState("Nurse");
  useEffect(() => {
    if (open) {
      setForm(empty(currentUserName, residentId));
      setProfessional("Nurse");
    }
  }, [open, residentId, currentUserName]);
  const resident = residents.find((r) => r.id === residentId);
  function save() {
    if (!form.discussion.trim()) {
      toast.error("Discussion summary required");
      return;
    }
    addMdtNote({
      ...form,
      role: professional.toLowerCase() === "gp" ? "doctor" : "nurse"
    });
    toast.success("MDT Note Added");
    onOpenChange(false);
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Add MDT Note" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: resident && `For ${resident.firstName} ${resident.lastName}` })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Professional Type" }),
        /* @__PURE__ */ jsxs(Select, { value: professional, onValueChange: setProfessional, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: PROFESSIONAL_TYPES.map((p) => /* @__PURE__ */ jsx(SelectItem, { value: p, children: p }, p)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Date" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "date",
            value: form.date,
            onChange: (e) => setForm({ ...form, date: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Attendees" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "e.g., Dr. Patel (GP), J. Roberts (RN), Family",
            value: form.attendees,
            onChange: (e) => setForm({ ...form, attendees: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Discussion Summary *" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            rows: 3,
            placeholder: "Summary of MDT discussion...",
            value: form.discussion,
            onChange: (e) => setForm({ ...form, discussion: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Recommendations" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            rows: 3,
            placeholder: "Recommendations from MDT...",
            value: form.recommendations,
            onChange: (e) => setForm({ ...form, recommendations: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Authored By" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: form.authoredBy,
            onChange: (e) => setForm({ ...form, authoredBy: e.target.value })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: "Follow-up Date" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            type: "date",
            value: form.followUpDate,
            onChange: (e) => setForm({ ...form, followUpDate: e.target.value })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }),
      /* @__PURE__ */ jsx(Button, { onClick: save, children: "Save MDT Note" })
    ] })
  ] }) });
}
const ASSESSMENT_CATEGORIES = {
  "Mobility & Function": ["barthel"],
  "Pressure & Skin": ["waterlow", "norton"],
  Pain: ["abbey_pain", "pain_chart"],
  Nutrition: ["mna", "nutrition", "must"],
  Cognition: ["mmse", "four_at", "gds15", "cornell"],
  Continence: ["continence"],
  Behaviour: ["abc", "abs"],
  Safety: ["falls"],
  "Person-Centred": ["pinch_me"]
};
function AddAssessmentModal({ open, onOpenChange, residentId }) {
  const { residents } = useCare();
  const [step, setStep] = useState("select");
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [category, setCategory] = useState("Mobility & Function");
  useEffect(() => {
    if (open) {
      setStep("select");
      setSelectedAssessment(null);
      setCategory("Mobility & Function");
    }
  }, [open]);
  const resident = residents.find((r) => r.id === residentId);
  const assessmentsInCategory = ASSESSMENT_CATEGORIES[category] || [];
  function handleSelect(assessmentType) {
    setSelectedAssessment(assessmentType);
    setStep("review");
  }
  function handleLaunchAssessment() {
    if (!selectedAssessment) return;
    setStep("form");
    toast.info(`Assessment form for ${assessmentMeta[selectedAssessment].name} would open here`);
  }
  if (step === "select") {
    return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Step 1: Select Assessment" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: resident && `For ${resident.firstName} ${resident.lastName}` })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { children: "Assessment Category" }),
          /* @__PURE__ */ jsxs(Select, { value: category, onValueChange: setCategory, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsx(SelectContent, { children: Object.keys(ASSESSMENT_CATEGORIES).map((cat) => /* @__PURE__ */ jsx(SelectItem, { value: cat, children: cat }, cat)) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: assessmentsInCategory.map((type) => /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            className: "h-auto py-3 flex flex-col items-start",
            onClick: () => handleSelect(type),
            children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium", children: assessmentMeta[type].name }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: assessmentMeta[type].description })
            ]
          },
          type
        )) })
      ] }),
      /* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }) })
    ] }) });
  }
  if (step === "review" && selectedAssessment) {
    const meta = assessmentMeta[selectedAssessment];
    return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-xl", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Step 2: Review Assessment Details" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Confirm the assessment details before proceeding" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-muted p-3 rounded-md", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: meta.name }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: meta.description })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Assessment Type" }),
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: selectedAssessment })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Assessor" }),
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: "You" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Date" }),
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Resident" }),
            /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
              resident?.firstName,
              " ",
              resident?.lastName
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setStep("select"), children: "Back" }),
        /* @__PURE__ */ jsx(Button, { onClick: handleLaunchAssessment, children: "Continue to Assessment" })
      ] })
    ] }) });
  }
  if (step === "form" && selectedAssessment) {
    const meta = assessmentMeta[selectedAssessment];
    return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs(DialogTitle, { children: [
          "Step 3: ",
          meta.name,
          " Assessment Form"
        ] }),
        /* @__PURE__ */ jsxs(DialogDescription, { children: [
          "Complete the assessment for ",
          resident?.firstName,
          " ",
          resident?.lastName
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-muted/50 p-4 rounded-md text-center text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          "Assessment form placeholder for: ",
          selectedAssessment
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs mt-1", children: "In a real implementation, the full assessment form would render here" })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setStep("review"), children: "Back" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: () => {
              toast.success("Assessment submitted successfully");
              onOpenChange(false);
            },
            children: "Complete Assessment"
          }
        )
      ] })
    ] }) });
  }
  return null;
}
function riskColor(level) {
  if (level === "very_high") return "bg-destructive/10 text-destructive border-destructive/30";
  if (level === "high") return "bg-warning/15 text-warning-foreground border-warning/40";
  if (level === "moderate") return "bg-info/10 text-info border-info/20";
  return "bg-success/10 text-success border-success/20";
}
function statusBadgeClass(status) {
  if (status === "overdue") return "bg-destructive/10 text-destructive border-destructive/30";
  if (status === "due_now") return "bg-warning/15 text-warning-foreground border-warning/40";
  if (status === "due_today") return "bg-warning/10 text-warning-foreground border-warning/30";
  if (status === "upcoming") return "bg-info/10 text-info border-info/30";
  if (status === "completed") return "bg-success/10 text-success border-success/20";
  return "bg-muted text-muted-foreground";
}
function statusLabel(status) {
  return scheduledInterventionLabel(status);
}
function activeVitalRows(vitals) {
  return vitals.filter((vital) => !vital.deletedAt).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}
function trendStatus(values, mode = "stable") {
  if (values.length < 2) return null;
  const [latest, previous] = values;
  const delta = latest - previous;
  if (Math.abs(delta) < 0.5) return "Stable";
  if (mode === "lowerBetter") return delta < 0 ? "Improving" : "Requires Review";
  return "Requires Review";
}
function trendTone(status) {
  if (status === "Improving") return "border-success/30 text-success";
  if (status === "Requires Review") return "border-warning/40 text-warning-foreground";
  return "border-muted-foreground/20 text-muted-foreground";
}
function TrendCard({
  title,
  status,
  detail
}) {
  if (!status) return null;
  return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 space-y-2", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: title }),
    /* @__PURE__ */ jsx(Badge, { variant: "outline", className: trendTone(status), children: status }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: detail })
  ] }) });
}
function DeleteAssessmentDialog({
  id,
  onConfirm
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return /* @__PURE__ */ jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "text-destructive hover:text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) }) }),
    /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Delete assessment (audited)" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Assessments are soft-deleted and retained for audit. Provide a reason." }),
      /* @__PURE__ */ jsx(Textarea, { placeholder: "Reason for deletion…", value: reason, onChange: (e) => setReason(e.target.value) }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { variant: "destructive", disabled: !reason.trim(), onClick: () => {
          onConfirm(reason);
          setOpen(false);
        }, children: "Delete" })
      ] })
    ] })
  ] });
}
function ResidentDetail() {
  const {
    id
  } = Route.useParams();
  useNavigate();
  const {
    residents,
    assessments,
    carePlans,
    carePlanProblems,
    problemInterventions,
    problemInterventionLogs,
    problemGoals,
    problemEvaluations,
    problemReviews,
    problemHistory,
    timelineEvents,
    auditLogs,
    notes,
    alerts,
    tasks,
    incidents,
    mdtNotes,
    visitors,
    outings,
    vitals,
    handovers,
    currentRole,
    currentUserName,
    softDeleteAssessment,
    addNextOfKin,
    addGoal,
    updateGoal,
    removeGoal,
    addProblemEvaluation,
    addProblemReview,
    addProblemIntervention,
    discontinueProblemIntervention,
    updateProblem,
    updateProblemIntervention
  } = useCare();
  const r = residents.find((x) => x.id === id);
  const [nokOpen, setNokOpen] = useState(false);
  const [modalState, setModalState] = useState({
    note: false,
    intervention: false,
    interventionCompletion: false,
    interventionReview: false,
    assessment: false,
    task: false,
    incident: false,
    mdt: false,
    visitor: false,
    outing: false
  });
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [selectedReviewAction, setSelectedReviewAction] = useState(null);
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [problemDetailOpen, setProblemDetailOpen] = useState(false);
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [latestVitalsDialogOpen, setLatestVitalsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [presetInterventionProblemId, setPresetInterventionProblemId] = useState(void 0);
  const [goalDraft, setGoalDraft] = useState({
    statement: "",
    targetDate: ""
  });
  const [evaluationDraft, setEvaluationDraft] = useState({
    date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    summary: "",
    goalsMet: "partial",
    progress: "stable",
    recommendations: "",
    nextEvaluationDate: "",
    revisionRequired: "no",
    revisionReason: "",
    revisionAddIntervention: "",
    revisionDiscontinueInterventionId: "",
    revisionChangeInterventionId: "",
    revisionFrequencyType: "daily",
    revisionUpdateGoalId: "",
    revisionGoalText: "",
    revisionReviewDate: ""
  });
  const handleOpenModal = (kind) => {
    setModalState((prev) => ({
      ...prev,
      [kind]: true
    }));
  };
  const handleCloseModal = (kind) => {
    setModalState((prev) => ({
      ...prev,
      [kind]: false
    }));
  };
  const handleRecordCompletion = (intervention) => {
    setSelectedIntervention(intervention);
    setModalState((prev) => ({
      ...prev,
      interventionCompletion: true
    }));
  };
  const handleReviewIntervention = (intervention, action) => {
    setSelectedIntervention(intervention);
    setSelectedReviewAction(action);
    setModalState((prev) => ({
      ...prev,
      interventionReview: true
    }));
  };
  const [newNok, setNewNok] = useState({
    name: "",
    relationship: "",
    phone: "",
    mobile: "",
    email: "",
    address: "",
    notes: "",
    primaryContact: false,
    emergencyContact: false,
    powerOfAttorney: false,
    legalRepresentative: false
  });
  if (!r) return /* @__PURE__ */ jsxs("div", { className: "p-8", children: [
    "Resident not found.",
    " ",
    /* @__PURE__ */ jsx(Link, { to: "/residents", className: "text-primary underline", children: "Back" })
  ] });
  const rA = assessments.filter((a) => a.residentId === id && a.status !== "deleted").sort((a, b) => b.date.localeCompare(a.date));
  const rADeleted = assessments.filter((a) => a.residentId === id && a.status === "deleted");
  const rP = carePlans.filter((c) => c.residentId === id);
  const rN = notes.filter((n) => n.residentId === id);
  const rAlerts = alerts.filter((a) => a.residentId === id && isActionRequiredAlert(a) && !a.resolvedAt);
  const rTasks = tasks.filter((t) => t.residentId === id && t.status !== "deleted");
  const rIncidents = incidents.filter((x) => x.residentId === id);
  const rMDT = mdtNotes.filter((x) => x.residentId === id);
  const rVisitors = visitors.filter((x) => x.residentId === id);
  const rOutings = outings.filter((x) => x.residentId === id);
  const rVitals = vitals.filter((v) => v.residentId === id);
  const rHandovers = handovers.filter((x) => x.residentId === id);
  const rProblems = carePlanProblems.filter((p) => p.residentId === id);
  const activeProblems = rProblems.filter((p) => p.status === "active");
  const rProblemInterventions = problemInterventions.filter((i) => i.residentId === id);
  const rProblemLogs = problemInterventionLogs.filter((l) => l.residentId === id);
  const rProblemEvaluations = problemEvaluations.filter((e) => rProblems.some((p) => p.id === e.problemId));
  const rProblemReviews = problemReviews.filter((rev) => rProblems.some((p) => p.id === rev.problemId));
  const today = /* @__PURE__ */ new Date();
  const overdueAssessments = rA.filter((a) => !!a.nextReassessmentDate && a.status !== "archived" && a.status !== "superseded" && new Date(a.nextReassessmentDate) <= today);
  const overdueProblemReviews = activeProblems.filter((p) => new Date(p.reviewDate) <= today);
  const highRiskFlags = activeProblems.filter((p) => p.riskLevel === "high" || p.riskLevel === "very_high");
  const openIncidents = rIncidents.filter((i) => i.status !== "closed");
  const openTasks = rTasks.filter((t) => t.status !== "completed");
  const openAlertCount = rAlerts.filter((a) => !a.acknowledged).length;
  const todayKey = today.toISOString().slice(0, 10);
  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowKey = tomorrowDate.toISOString().slice(0, 10);
  const selectedProblem = selectedProblemId ? rProblems.find((p) => p.id === selectedProblemId) || null : null;
  const selectedProblemGoals = selectedProblem ? problemGoals.filter((g) => g.problemId === selectedProblem.id) : [];
  const selectedProblemInterventions = selectedProblem ? rProblemInterventions.filter((i) => i.problemId === selectedProblem.id) : [];
  selectedProblem ? rProblemLogs.filter((l) => l.problemId === selectedProblem.id) : [];
  const selectedProblemEvaluations = selectedProblem ? rProblemEvaluations.filter((e) => e.problemId === selectedProblem.id) : [];
  selectedProblem ? rProblemReviews.filter((rev) => rev.problemId === selectedProblem.id) : [];
  selectedProblem ? rN.filter((n) => n.linkedProblemId === selectedProblem.id) : [];
  selectedProblem ? rMDT.filter((m) => m.linkedCarePlanId === selectedProblem.residentCarePlanId) : [];
  selectedProblem ? rIncidents.filter((i) => i.linkedCarePlanId === selectedProblem.residentCarePlanId) : [];
  selectedProblem ? rTasks.filter((t) => t.linkedCarePlanId === selectedProblem.residentCarePlanId) : [];
  selectedProblem ? rA.filter((a) => a.id === selectedProblem.sourceAssessmentId || (a.linkedProblemIds || []).includes(selectedProblem.id)) : [];
  selectedProblem ? problemHistory.filter((h) => h.problemId === selectedProblem.id).sort((a, b) => b.timestamp.localeCompare(a.timestamp)) : [];
  const now = /* @__PURE__ */ new Date();
  const upcomingInterventionTasks = useMemo(() => {
    return scheduledInterventions(rProblemInterventions, rProblemLogs, rProblems, now);
  }, [now, rProblemInterventions, rProblemLogs, rProblems]);
  const taskOps = useMemo(() => {
    const completedToday = rTasks.filter((t) => t.status === "completed" && t.dueDate === now.toISOString().slice(0, 10));
    const overdue = rTasks.filter((t) => t.status !== "completed" && new Date(t.dueDate) < now);
    const upcoming = rTasks.filter((t) => t.status !== "completed" && new Date(t.dueDate) >= new Date(now.toISOString().slice(0, 10)));
    return {
      completedToday,
      overdue,
      upcoming
    };
  }, [rTasks]);
  const residentVitals = useMemo(() => activeVitalRows(rVitals), [rVitals]);
  const latestVital = residentVitals[0];
  const weightValues = residentVitals.filter((vital) => vital.weight !== void 0).map((vital) => vital.weight);
  const temperatureValues = residentVitals.filter((vital) => vital.temperature !== void 0).map((vital) => vital.temperature);
  const painValues = residentVitals.filter((vital) => vital.painScore !== void 0).map((vital) => vital.painScore);
  const glucoseValues = residentVitals.filter((vital) => vital.bloodGlucose !== void 0).map((vital) => vital.bloodGlucose);
  const weightStatus = trendStatus(weightValues);
  const temperatureStatus = trendStatus(temperatureValues);
  const painStatus = trendStatus(painValues, "lowerBetter");
  const glucoseStatus = trendStatus(glucoseValues);
  const residentTimelineEntries = useMemo(() => {
    const items = [...rA.map((a) => ({
      id: `assess-${a.id}`,
      module: "assessments",
      at: a.date,
      title: `${assessmentMeta[a.type]?.name || a.type} assessment`,
      summary: `Score ${a.totalScore} (${a.interpretation})`,
      by: a.assessor
    })), ...rProblems.map((p) => ({
      id: `cp-${p.id}`,
      module: "careplans",
      at: p.createdAt,
      title: "Care plan problem updated",
      summary: p.problemStatement,
      by: p.createdBy
    })), ...rProblemInterventions.map((i) => ({
      id: `int-${i.id}`,
      module: "interventions",
      at: i.updatedAt || i.createdAt,
      title: i.name,
      summary: `${i.frequencyType.replace(/_/g, " ")} · ${i.status.replace(/_/g, " ")}`,
      by: i.updatedBy || i.createdBy
    })), ...rProblemEvaluations.map((e) => ({
      id: `eval-${e.id}`,
      module: "evaluations",
      at: e.date,
      title: "Problem evaluation",
      summary: `${e.progress.replace(/_/g, " ")} · goals met: ${e.goalsMet}`,
      by: e.evaluatorName
    })), ...rProblemReviews.map((rev) => ({
      id: `rev-${rev.id}`,
      module: "careplans",
      at: rev.reviewDate,
      title: "Care plan review",
      summary: `${rev.outcome} · ${rev.comments || ""}`,
      by: rev.reviewedByName
    })), ...rTasks.map((t) => ({
      id: `task-${t.id}`,
      module: "tasks",
      at: t.dueDate,
      title: t.title,
      summary: t.status,
      by: t.assignedTo
    })), ...rIncidents.map((i) => ({
      id: `inc-${i.id}`,
      module: "incidents",
      at: i.date,
      title: `${i.type.replace(/_/g, " ")} incident`,
      summary: i.description,
      by: i.reportedBy
    })), ...rMDT.map((m) => ({
      id: `mdt-${m.id}`,
      module: "mdt",
      at: m.date,
      title: "MDT note",
      summary: m.discussion,
      by: m.authoredBy
    })), ...rVisitors.map((v) => ({
      id: `vis-${v.id}`,
      module: "visitors",
      at: v.date,
      title: "Visitor recorded",
      summary: `${v.visitorName} (${v.relationship})`,
      by: v.signedInBy
    })), ...rOutings.map((o) => ({
      id: `out-${o.id}`,
      module: "outings",
      at: o.date,
      title: `Outing: ${o.destination}`,
      summary: `${o.departureTime}-${o.returnTime}`,
      by: o.accompaniedBy
    })), ...rVitals.map((v) => ({
      id: `vital-${v.id}`,
      module: "vitals",
      at: v.recordedAt || `${v.date}T${v.time}`,
      title: "Vitals recorded",
      summary: `${v.date} ${v.time}`,
      by: v.recordedByName || "Unknown"
    })), ...rAlerts.map((a) => ({
      id: `alert-${a.id}`,
      module: "careplans",
      at: a.createdAt,
      title: `Alert: ${a.title}`,
      summary: a.description,
      by: "System"
    })), ...timelineEvents.filter((e) => e.residentId === id).map((e) => ({
      id: `tle-${e.id}`,
      module: e.type.startsWith("assessment") ? "assessments" : e.type.startsWith("intervention") ? "interventions" : e.type.startsWith("careplan") ? "careplans" : e.type.startsWith("task") ? "tasks" : e.type.startsWith("incident") ? "incidents" : "careplans",
      at: e.createdAt,
      title: e.title,
      summary: e.description || e.type,
      by: e.createdBy
    }))];
    return items.sort((a, b) => `${b.at}`.localeCompare(`${a.at}`));
  }, [rA, rProblems, rProblemInterventions, rProblemEvaluations, rProblemReviews, rTasks, rIncidents, rMDT, rVisitors, rOutings, rVitals, rAlerts, timelineEvents, id]);
  const filteredTimelineEntries = timelineFilter === "all" ? residentTimelineEntries : residentTimelineEntries.filter((x) => x.module === timelineFilter);
  const residentAuditRows = useMemo(() => {
    const entityModuleMap = /* @__PURE__ */ new Map();
    rA.forEach((a) => entityModuleMap.set(a.id, "Assessments"));
    rProblems.forEach((p) => entityModuleMap.set(p.id, "Care Plan Problems"));
    rProblemInterventions.forEach((i) => entityModuleMap.set(i.id, "Interventions"));
    rProblemEvaluations.forEach((e) => entityModuleMap.set(e.id, "Evaluations"));
    rTasks.forEach((t) => entityModuleMap.set(t.id, "Tasks"));
    rIncidents.forEach((i) => entityModuleMap.set(i.id, "Incidents"));
    rMDT.forEach((m) => entityModuleMap.set(m.id, "MDT Notes"));
    rVisitors.forEach((v) => entityModuleMap.set(v.id, "Visitors"));
    rOutings.forEach((o) => entityModuleMap.set(o.id, "Outings"));
    rVitals.forEach((v) => entityModuleMap.set(v.id, "Vitals"));
    return auditLogs.filter((a) => entityModuleMap.has(a.entity)).map((a) => ({
      ...a,
      module: entityModuleMap.get(a.entity) || "Other"
    })).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [auditLogs, rA, rProblems, rProblemInterventions, rProblemEvaluations, rTasks, rIncidents, rMDT, rVisitors, rOutings, rVitals]);
  const residentVersionRows = useMemo(() => {
    const assessmentRows = rA.map((a) => ({
      key: `assess-${a.id}`,
      module: "Assessment Versions",
      name: assessmentMeta[a.type]?.name || a.type,
      version: a.version || 1,
      createdBy: a.assessor,
      date: a.date,
      reason: a.revisionReason || "Initial",
      supersededBy: a.supersededById || "—"
    }));
    const carePlanRows = rProblems.map((p) => {
      const versions = problemHistory.filter((h) => h.problemId === p.id).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      return versions.map((h, idx) => ({
        key: `cp-${h.id}`,
        module: "Care Plan Versions",
        name: p.problemStatement,
        version: idx + 1,
        createdBy: h.userName,
        date: h.timestamp,
        reason: h.reason || h.action.replace(/_/g, " "),
        supersededBy: idx < versions.length - 1 ? `v${idx + 2}` : "Current"
      }));
    });
    const evaluationRows = rProblemEvaluations.slice().sort((a, b) => a.date.localeCompare(b.date)).map((e, idx) => ({
      key: `eval-${e.id}`,
      module: "Evaluation Versions",
      name: rProblems.find((p) => p.id === e.problemId)?.problemStatement || "Problem evaluation",
      version: idx + 1,
      createdBy: e.evaluatorName,
      date: e.date,
      reason: e.summary || e.progress,
      supersededBy: idx < rProblemEvaluations.length - 1 ? `v${idx + 2}` : "Current"
    }));
    const interventionRows = rProblemInterventions.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((i, idx) => ({
      key: `int-${i.id}`,
      module: "Intervention Versions",
      name: i.name,
      version: idx + 1,
      createdBy: i.createdBy,
      date: i.createdAt,
      reason: i.notes || "Intervention created",
      supersededBy: i.status === "superseded" ? "Superseded" : "Current"
    }));
    return [...assessmentRows, ...carePlanRows.flat(), ...evaluationRows, ...interventionRows].sort((a, b) => `${b.date}`.localeCompare(`${a.date}`));
  }, [rA, rProblems, problemHistory, rProblemEvaluations, rProblemInterventions]);
  const rolePermissions = {
    canComplete: ["carer", "nurse", "cnm", "don"].includes(currentRole),
    canEdit: ["nurse", "cnm", "don"].includes(currentRole),
    canDisable: ["cnm", "don"].includes(currentRole),
    canArchiveDelete: ["don"].includes(currentRole)
  };
  const applyInterventionStatus = (intv, status, reason) => {
    updateProblemIntervention(intv.id, {
      status,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: "System"
    }, reason);
    toast.success(`Intervention ${status}`);
  };
  const openProblemDetail = (problemId) => {
    setSelectedProblemId(problemId);
    setProblemDetailOpen(true);
  };
  const openAddInterventionForProblem = (problemId) => {
    setSelectedProblemId(problemId);
    setPresetInterventionProblemId(problemId);
    setModalState((prev) => ({
      ...prev,
      intervention: true
    }));
  };
  const openAddEvaluationForProblem = (problemId) => {
    setSelectedProblemId(problemId);
    setEvaluationDraft((prev) => ({
      ...prev,
      date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      nextEvaluationDate: "",
      summary: "",
      recommendations: "",
      revisionRequired: "no",
      revisionReason: "",
      revisionAddIntervention: "",
      revisionDiscontinueInterventionId: "",
      revisionChangeInterventionId: "",
      revisionFrequencyType: "daily",
      revisionUpdateGoalId: "",
      revisionGoalText: "",
      revisionReviewDate: ""
    }));
    setEvaluationOpen(true);
  };
  const submitAddGoal = () => {
    if (!selectedProblem || !goalDraft.statement.trim()) {
      toast.error("Goal statement is required");
      return;
    }
    addGoal(selectedProblem.id, goalDraft.statement.trim(), goalDraft.targetDate || void 0);
    setGoalDraft({
      statement: "",
      targetDate: ""
    });
    toast.success("Goal added");
  };
  const submitEvaluation = () => {
    if (!selectedProblem) {
      toast.error("No care plan problem selected");
      return;
    }
    if (!evaluationDraft.summary.trim()) {
      toast.error("Evaluation summary is required");
      return;
    }
    addProblemEvaluation({
      problemId: selectedProblem.id,
      date: evaluationDraft.date,
      summary: evaluationDraft.summary,
      goalsMet: evaluationDraft.goalsMet,
      progress: evaluationDraft.progress,
      recommendations: evaluationDraft.recommendations || void 0,
      nextEvaluationDate: evaluationDraft.nextEvaluationDate || void 0
    });
    if (evaluationDraft.revisionRequired === "yes") {
      if (evaluationDraft.revisionAddIntervention.trim()) {
        addProblemIntervention({
          problemId: selectedProblem.id,
          name: evaluationDraft.revisionAddIntervention.trim(),
          frequencyType: "daily",
          assignedRole: currentRole,
          assignedStaffName: currentUserName,
          startDate: evaluationDraft.date,
          reviewDate: evaluationDraft.revisionReviewDate || selectedProblem.reviewDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          endDate: evaluationDraft.nextEvaluationDate || new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
          notes: `Revision workflow intervention. ${evaluationDraft.revisionReason || ""}`.trim()
        });
      }
      if (evaluationDraft.revisionDiscontinueInterventionId) {
        discontinueProblemIntervention(evaluationDraft.revisionDiscontinueInterventionId, evaluationDraft.revisionReason || "Revision required");
      }
      if (evaluationDraft.revisionChangeInterventionId) {
        updateProblemIntervention(evaluationDraft.revisionChangeInterventionId, {
          frequencyType: evaluationDraft.revisionFrequencyType
        }, evaluationDraft.revisionReason || "Revision frequency update");
      }
      if (evaluationDraft.revisionUpdateGoalId && evaluationDraft.revisionGoalText.trim()) {
        updateGoal(evaluationDraft.revisionUpdateGoalId, {
          statement: evaluationDraft.revisionGoalText.trim()
        });
      }
      if (evaluationDraft.revisionReviewDate) {
        updateProblem(selectedProblem.id, {
          reviewDate: evaluationDraft.revisionReviewDate
        }, evaluationDraft.revisionReason || "Revision updated review date");
      }
      addProblemReview({
        problemId: selectedProblem.id,
        reviewDate: evaluationDraft.date,
        outcome: "modify",
        comments: evaluationDraft.revisionReason || "Revision required from evaluation",
        nextReviewDate: evaluationDraft.revisionReviewDate || selectedProblem.reviewDate
      });
    }
    setEvaluationOpen(false);
    toast.success("Evaluation saved");
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8 space-y-5 max-w-7xl", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/residents", className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      " All residents"
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-5 flex flex-col md:flex-row md:items-center gap-5", children: [
      /* @__PURE__ */ jsx(Avatar, { className: "h-20 w-20", children: /* @__PURE__ */ jsxs(AvatarFallback, { className: "text-xl bg-accent text-accent-foreground", children: [
        r.firstName[0],
        r.lastName[0]
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-semibold tracking-tight", children: [
            r.firstName,
            " ",
            r.lastName
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", children: "Quick Actions" }) }),
              /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
                /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => handleOpenModal("note"), children: "Daily Note" }),
                /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => handleOpenModal("intervention"), children: "Intervention" }),
                /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => handleOpenModal("assessment"), children: "Assessment" }),
                /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => handleOpenModal("task"), children: "Task" }),
                /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => handleOpenModal("incident"), children: "Incident" }),
                /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => handleOpenModal("mdt"), children: "MDT Note" }),
                /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => handleOpenModal("visitor"), children: "Visitor Record" }),
                /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => handleOpenModal("outing"), children: "Resident Outing" }),
                /* @__PURE__ */ jsx(RecordObservationFlow, { residentId: r.id, onRecorded: () => setActiveTab("vitals"), trigger: /* @__PURE__ */ jsx(DropdownMenuItem, { onSelect: (event) => event.preventDefault(), children: "Record Vitals" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", "aria-label": "Resident actions", children: /* @__PURE__ */ jsx(MoreVertical, { className: "h-4 w-4" }) }) }),
              /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "start", children: [
                /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => setLatestVitalsDialogOpen(true), children: "Latest Vitals" }),
                /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => setTimelineDialogOpen(true), children: "Clinical Timeline" }),
                /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => setAuditDialogOpen(true), children: "Audit History" }),
                /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => setVersionDialogOpen(true), children: "Version History" }),
                /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => {
                  if (typeof window !== "undefined") window.print();
                }, children: "Print Summary" }),
                /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => {
                  toast.info("Export PDF is queued for next release");
                }, children: "Export PDF" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: (r.residentType || r.status).replace("_", " ") }),
          r.endOfLife && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "border-destructive/40 text-destructive", children: "End of Life" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Resident ID" }),
            r.id
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Age" }),
            age(r.dob),
            " (",
            r.dob,
            ")"
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Room" }),
            r.roomNumber
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Bed" }),
            /* @__PURE__ */ jsx("span", { className: "capitalize", children: r.bed?.bedType?.replace("_", " ") || "—" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Admitted" }),
            r.admissionDate
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mt-3", children: [
          activeProblems.filter((p) => p.riskLevel === "high" || p.riskLevel === "very_high").map((p) => /* @__PURE__ */ jsxs(Badge, { className: "bg-destructive/10 text-destructive border border-destructive/30", children: [
            "HIGH ",
            p.category.replace(/_/g, " "),
            " RISK"
          ] }, p.id)),
          activeProblems.filter((p) => p.category === "pain").map((p) => /* @__PURE__ */ jsx(Badge, { className: "bg-warning/15 text-warning-foreground border border-warning/40", children: "PAIN MONITORING" }, p.id)),
          activeProblems.filter((p) => p.category === "nutrition" && new Date(p.reviewDate) <= now).map((p) => /* @__PURE__ */ jsx(Badge, { className: "bg-info/10 text-info border border-info/30", children: "NUTRITION REVIEW DUE" }, p.id))
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(ClinicalSnapshot, { residentId: r.id, showLatestVitals: false }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Active Care Plan Problems" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        activeProblems.slice(0, 8).map((problem) => {
          const goalsCount = problemGoals.filter((g) => g.problemId === problem.id).length;
          const interventionsCount = rProblemInterventions.filter((i) => i.problemId === problem.id).length;
          const evaluationsCount = rProblemEvaluations.filter((e) => e.problemId === problem.id).length;
          const reviewsCount = rProblemReviews.filter((rev) => rev.problemId === problem.id).length;
          const linkedAssessmentsCount = rA.filter((a) => a.id === problem.sourceAssessmentId || (a.linkedProblemIds || []).includes(problem.id)).length;
          const linkedNotesCount = rN.filter((n) => n.linkedProblemId === problem.id).length;
          return /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-3 space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: problem.problemStatement }),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `text-[10px] ${riskColor(problem.riskLevel)}`, children: problem.riskLevel.replace(/_/g, " ") })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
              "Status: ",
              problem.status,
              " · Review: ",
              problem.reviewDate,
              " · Evaluation:",
              " ",
              problem.evaluationDate
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-1 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                "Goals: ",
                goalsCount
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                "Interventions: ",
                interventionsCount
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                "Evaluations: ",
                evaluationsCount
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                "Reviews: ",
                reviewsCount
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                "Linked Assessments: ",
                linkedAssessmentsCount
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                "Linked Notes: ",
                linkedNotesCount
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
              /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => openProblemDetail(problem.id), children: "Open Problem" }),
              /* @__PURE__ */ jsx(Button, { size: "sm", onClick: () => openAddInterventionForProblem(problem.id), children: "Add Intervention" }),
              /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => openAddEvaluationForProblem(problem.id), children: "Add Evaluation" })
            ] })
          ] }, problem.id);
        }),
        activeProblems.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No active care plan problems." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Upcoming Tasks" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        upcomingInterventionTasks.map((task) => /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-3 space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium", children: task.intervention.name }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: task.problem?.problemStatement || "Unlinked care plan problem" })
            ] }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: statusBadgeClass(task.status), children: statusLabel(task.status) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-2 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              "Due: ",
              task.dueAt ? task.dueAt.toLocaleString("en-GB") : "Not scheduled"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              "Assigned Role: ",
              task.intervention.assignedRole || "Unassigned"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              "Assigned Staff: ",
              task.intervention.assignedStaffName || "Unassigned"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              "Status: ",
              statusLabel(task.status)
            ] })
          ] }),
          (task.status === "completed" || task.completion) && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "Completed by",
            " ",
            task.completion?.staffName || task.intervention.completedBy || "Unknown",
            task.completion?.role ? ` ${task.completion.role.toUpperCase()}` : ""
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: task.status === "completed" ? /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => handleRecordCompletion(task.intervention), children: "View Completion" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Button, { size: "sm", onClick: () => handleRecordCompletion(task.intervention), disabled: !rolePermissions.canComplete, children: "Mark Complete" }),
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => openProblemDetail(task.intervention.problemId), children: "Open Intervention" })
          ] }) })
        ] }, task.intervention.id)),
        upcomingInterventionTasks.length === 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-md border p-6 text-center space-y-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No upcoming intervention tasks." }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", size: "sm", children: /* @__PURE__ */ jsx(Link, { to: "/residents/$id/care-plan", params: {
            id: r.id
          }, children: "Open Care Plans" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: (value) => setActiveTab(value), className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxs(TabsList, { className: "flex-wrap h-auto", children: [
          /* @__PURE__ */ jsx(TabsTrigger, { value: "overview", children: "Overview" }),
          /* @__PURE__ */ jsxs(TabsTrigger, { value: "vitals", children: [
            "Vitals (",
            activeVitalRows(rVitals).length,
            ")"
          ] }),
          /* @__PURE__ */ jsxs(TabsTrigger, { value: "assessments", children: [
            "Assessments (",
            rA.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxs(TabsTrigger, { value: "notes", children: [
            "Daily Notes (",
            rN.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxs(TabsTrigger, { value: "incidents", children: [
            "Incidents (",
            rIncidents.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxs(TabsTrigger, { value: "mdt", children: [
            "MDT (",
            rMDT.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxs(TabsTrigger, { value: "alerts", children: [
            "Alerts (",
            openAlertCount,
            ")"
          ] }),
          /* @__PURE__ */ jsxs(TabsTrigger, { value: "tasks", children: [
            "Tasks (",
            rTasks.length,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsxs(DropdownMenu, { children: [
          /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", children: "More" }) }),
          /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "start", children: [
            /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setActiveTab("interventions"), children: [
              "Interventions (",
              rProblemInterventions.length,
              ")"
            ] }),
            /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setActiveTab("visitors"), children: [
              "Visitors (",
              rVisitors.length,
              ")"
            ] }),
            /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setActiveTab("outings"), children: [
              "Outings (",
              rOutings.length,
              ")"
            ] }),
            /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setActiveTab("handovers"), children: [
              "Handovers (",
              rHandovers.length,
              ")"
            ] }),
            /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setActiveTab("nok"), children: [
              "Next of Kin (",
              r.nextOfKinList?.length || 0,
              ")"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "overview", className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(User2, { className: "h-4 w-4" }),
            " Clinical"
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsx(Row, { label: "Primary diagnosis", value: r.primaryDiagnosis }),
            /* @__PURE__ */ jsx(Row, { label: "Medical history", value: r.medicalHistory }),
            /* @__PURE__ */ jsx(Row, { label: "Allergies", value: r.allergies }),
            /* @__PURE__ */ jsx(Row, { label: "Mental capacity", value: r.mentalCapacity.replace("_", " ") })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Pill, { className: "h-4 w-4" }),
            " Medication"
          ] }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "text-sm", children: /* @__PURE__ */ jsx("p", { children: r.currentMedication }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Bed, { className: "h-4 w-4" }),
            " Bed Management"
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsx(Row, { label: "Bed type", value: r.bed?.bedType?.replace("_", " ") || "—" }),
            /* @__PURE__ */ jsx(Row, { label: "Mattress", value: r.bed?.mattressType?.replace("_", " ") || "—" }),
            /* @__PURE__ */ jsx(Row, { label: "Installed", value: r.bed?.installationDate || "—" }),
            /* @__PURE__ */ jsx(Row, { label: "Review date", value: r.bed?.reviewDate || "—" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(UserCog, { className: "h-4 w-4" }),
            " Key Workers"
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsx(Row, { label: "Named Nurse", value: r.keyWorkers?.namedNurse || "—" }),
            /* @__PURE__ */ jsx(Row, { label: "Named Carer", value: r.keyWorkers?.namedCarer || "—" }),
            /* @__PURE__ */ jsx(Row, { label: "Key Worker", value: r.keyWorkers?.keyWorker || "—" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Phone, { className: "h-4 w-4" }),
            " GP / Consultant"
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsx(Row, { label: "GP", value: r.gp }),
            /* @__PURE__ */ jsx(Row, { label: "Consultant", value: r.consultant }),
            /* @__PURE__ */ jsx(Row, { label: "Emergency contact", value: r.emergencyContact })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Preferences" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsx(Row, { label: "Communication", value: r.communicationNeeds }),
            /* @__PURE__ */ jsx(Row, { label: "Religion", value: r.religion }),
            /* @__PURE__ */ jsx(Row, { label: "Preferred language", value: r.preferredLanguage })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "vitals", className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold", children: "Latest Recorded" }),
            latestVital && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Recorded ",
              latestVital.date,
              " ",
              latestVital.time,
              " by",
              " ",
              latestVital.recordedByName || "Unknown"
            ] })
          ] }),
          /* @__PURE__ */ jsx(RecordObservationFlow, { residentId: r.id, onRecorded: () => setActiveTab("vitals"), trigger: /* @__PURE__ */ jsx(Button, { size: "sm", children: "Record New" }) })
        ] }),
        /* @__PURE__ */ jsx(LatestVitalsCard, { vitals: residentVitals, resident: r }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Actions" }) }),
          /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(RecordObservationFlow, { residentId: r.id, onRecorded: () => setActiveTab("vitals"), trigger: /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Record New Observation" }) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-[1.5fr_1fr] gap-4", children: [
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Vitals Timeline" }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2", children: [
              residentVitals.slice(0, 12).map((vital) => {
                const news = calcNEWS2(vital);
                const type = inferVitalRecordType(vital);
                return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 rounded-md border p-3 text-sm", children: [
                  /* @__PURE__ */ jsxs("div", { className: "w-20 shrink-0 text-xs text-muted-foreground tabular-nums", children: [
                    /* @__PURE__ */ jsx("div", { children: (/* @__PURE__ */ new Date(`${vital.date}T00:00:00`)).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short"
                    }) }),
                    /* @__PURE__ */ jsx("div", { children: vital.time })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                    /* @__PURE__ */ jsx("div", { className: "font-medium", children: VITAL_TYPE_LABELS[type] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                      formatVitalValues(vital, residentVitals, r),
                      news.complete ? ` · NEWS2 ${news.total}` : ""
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] shrink-0", children: "Open" })
                ] }, vital.id);
              }),
              residentVitals.length === 0 && /* @__PURE__ */ jsx("div", { className: "rounded-md border p-8 text-center text-sm text-muted-foreground", children: "No observations recorded for this resident yet." })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Trends" }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "grid gap-3", children: [
              /* @__PURE__ */ jsx(TrendCard, { title: "Weight Trend", status: weightStatus, detail: weightValues.length >= 2 ? `${weightValues[0]}kg from ${weightValues[1]}kg` : "More weight records needed" }),
              /* @__PURE__ */ jsx(TrendCard, { title: "Temperature Trend", status: temperatureStatus, detail: temperatureValues.length >= 2 ? `${temperatureValues[0]}°C from ${temperatureValues[1]}°C` : "More temperature records needed" }),
              /* @__PURE__ */ jsx(TrendCard, { title: "Pain Trend", status: painStatus, detail: painValues.length >= 2 ? `${painValues[0]}/10 from ${painValues[1]}/10` : "More pain records needed" }),
              /* @__PURE__ */ jsx(TrendCard, { title: "Blood Glucose Trend", status: glucoseStatus, detail: glucoseValues.length >= 2 ? `${glucoseValues[0]} mmol/L from ${glucoseValues[1]} mmol/L` : "More glucose records needed" }),
              !weightStatus && !temperatureStatus && !painStatus && !glucoseStatus && /* @__PURE__ */ jsx("div", { className: "rounded-md border p-4 text-sm text-muted-foreground", children: "Trends appear when two or more readings exist for the same observation type." })
            ] })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "assessments", className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [
          /* @__PURE__ */ jsx(Link, { to: "/residents/$id/assessments", params: {
            id: r.id
          }, children: /* @__PURE__ */ jsxs(Button, { size: "sm", children: [
            /* @__PURE__ */ jsx(Activity, { className: "h-3 w-3 mr-1" }),
            " Assessment Centre"
          ] }) }),
          /* @__PURE__ */ jsx(Link, { to: "/residents/$id/quality-of-life", params: {
            id: r.id
          }, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", children: "Quality of Life" }) }),
          /* @__PURE__ */ jsx(Separator, { orientation: "vertical", className: "h-6 mx-1" }),
          ["barthel", "waterlow", "abbey_pain", "mna", "norton", "nutrition", "pinch_me"].map((t) => /* @__PURE__ */ jsx(Link, { to: "/assessments/new/$residentId", params: {
            residentId: r.id
          }, search: {
            type: t
          }, children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", children: [
            /* @__PURE__ */ jsx(Plus, { className: "h-3 w-3 mr-1" }),
            " ",
            assessmentMeta[t].name
          ] }) }, t))
        ] }),
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
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
            rA.map((a) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30", children: [
              /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx(Link, { to: "/assessments/$assessmentId", params: {
                assessmentId: a.id
              }, className: "font-medium hover:text-primary", children: assessmentMeta[a.type].name }) }),
              /* @__PURE__ */ jsx("td", { className: "p-3 tabular-nums font-semibold", children: a.totalScore }),
              /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: `text-[10px] ${riskColor(a.riskLevel)}`, children: a.interpretation }) }),
              /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] capitalize", children: a.status }) }),
              /* @__PURE__ */ jsxs("td", { className: "p-3 text-xs", children: [
                a.assessor,
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground capitalize", children: a.assessorRole })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: a.date.slice(0, 10) }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: a.nextReassessmentDate || "—" }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex gap-1 items-center", children: [
                /* @__PURE__ */ jsx(Link, { to: "/assessments/$assessmentId", params: {
                  assessmentId: a.id
                }, children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "h-7 text-[11px]", children: "View" }) }),
                a.status === "completed" && !a.supersededById && can(currentRole, "assessment.create") && /* @__PURE__ */ jsx(Link, { to: "/assessments/new/$residentId", params: {
                  residentId: r.id
                }, search: {
                  type: a.type
                }, children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "h-7 text-[11px]", children: [
                  /* @__PURE__ */ jsx(Plus, { className: "h-3 w-3 mr-1" }),
                  " Reassess"
                ] }) }),
                can(currentRole, "assessment.delete") && /* @__PURE__ */ jsx(DeleteAssessmentDialog, { id: a.id, onConfirm: (reason) => {
                  softDeleteAssessment(a.id, reason);
                  toast.success("Assessment soft-deleted (audited)");
                } })
              ] }) })
            ] }, a.id)),
            rA.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "p-8 text-center text-sm text-muted-foreground", children: "No assessments yet." }) })
          ] })
        ] }) }) }) }),
        rADeleted.length > 0 && /* @__PURE__ */ jsxs("details", { className: "border rounded-md p-3 text-sm", children: [
          /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer font-medium", children: [
            "Deleted assessments (",
            rADeleted.length,
            ") — audit trail"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 space-y-2", children: rADeleted.map((a) => /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground border-l-2 border-destructive/40 pl-3", children: [
            /* @__PURE__ */ jsx("strong", { children: assessmentMeta[a.type].name }),
            " · ",
            a.date.slice(0, 10),
            /* @__PURE__ */ jsx("br", {}),
            "Deleted by ",
            a.deletedBy,
            " on ",
            a.deletedAt?.slice(0, 10),
            " — ",
            a.deletedReason
          ] }, a.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "careplans", className: "hidden", children: [
        /* @__PURE__ */ jsx(Link, { to: "/residents/$id/care-plan", params: {
          id: r.id
        }, children: /* @__PURE__ */ jsxs(Button, { size: "sm", children: [
          /* @__PURE__ */ jsx(ClipboardList, { className: "h-3 w-3 mr-1" }),
          " Open Unified Care Plan"
        ] }) }),
        rP.map((c) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx(Link, { to: "/care-plans/$id", params: {
              id: c.id
            }, className: "font-medium hover:text-primary hover:underline", children: c.title }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: c.status })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
            /* @__PURE__ */ jsx("strong", { children: "Problem:" }),
            " ",
            c.problem
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsx("strong", { children: "Goal:" }),
            " ",
            c.goal
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "text-sm mt-2 list-disc pl-5 space-y-0.5", children: c.interventions.map((i, k) => /* @__PURE__ */ jsx("li", { children: i }, k)) }),
          /* @__PURE__ */ jsx(Separator, { className: "my-3" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 text-xs text-muted-foreground items-center", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx(Calendar, { className: "h-3 w-3 inline mr-1" }),
              " Review ",
              c.reviewDate
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Frequency: ",
              c.frequency
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Assigned: ",
              c.assignedStaff
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1" }),
            /* @__PURE__ */ jsx(Link, { to: "/care-plans/$id", params: {
              id: c.id
            }, className: "text-primary hover:underline", children: "Open plan →" })
          ] })
        ] }) }, c.id)),
        rP.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No active care plans." })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "notes", className: "space-y-2", children: rN.map((n) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: n.date.slice(0, 10) }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] capitalize", children: n.shift }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: n.staff })
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
      ] }) }, n.id)) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "interventions", className: "space-y-4", children: /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Intervention Operations" }) }),
        /* @__PURE__ */ jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Intervention" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Problem" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Frequency" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Assigned To" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Start" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Review" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "End" }),
            /* @__PURE__ */ jsx("th", { className: "text-left p-3", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { className: "divide-y", children: [
            rProblemInterventions.map((intv) => {
              const problem = rProblems.find((p) => p.id === intv.problemId);
              return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30", children: [
                /* @__PURE__ */ jsx("td", { className: "p-3 font-medium", children: intv.name }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: problem?.problemStatement || "—" }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: intv.frequencyType.replace(/_/g, " ") }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: intv.assignedStaffName || intv.assignedRole || "—" }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: intv.startDate }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: intv.reviewDate }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: intv.endDate }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-xs capitalize", children: intv.status.replace(/_/g, " ") }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex gap-1", children: [
                  /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "h-7 text-[11px]", onClick: () => handleRecordCompletion(intv), disabled: !rolePermissions.canComplete, children: "View" }),
                  /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "h-7 text-[11px]", onClick: () => handleReviewIntervention(intv, "extend"), disabled: !rolePermissions.canEdit, children: "Edit" }),
                  /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "h-7 text-[11px]", onClick: () => applyInterventionStatus(intv, "discontinued", "Disabled by role action"), disabled: !rolePermissions.canDisable, children: [
                    /* @__PURE__ */ jsx(Ban, { className: "h-3 w-3 mr-1" }),
                    "Disable"
                  ] }),
                  /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "h-7 text-[11px]", onClick: () => applyInterventionStatus(intv, "superseded", "Archived"), disabled: !rolePermissions.canArchiveDelete, children: [
                    /* @__PURE__ */ jsx(Archive, { className: "h-3 w-3 mr-1" }),
                    "Archive"
                  ] }),
                  /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", className: "h-7 text-[11px] text-destructive", onClick: () => applyInterventionStatus(intv, "cancelled", "Soft deleted"), disabled: !rolePermissions.canArchiveDelete, children: "Delete" })
                ] }) })
              ] }, intv.id);
            }),
            rProblemInterventions.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 9, className: "p-8 text-center text-sm text-muted-foreground", children: "No interventions defined for this resident." }) })
          ] })
        ] }) }) })
      ] }) }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "incidents", className: "space-y-2", children: [
        rIncidents.map((i) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "font-medium capitalize", children: [
              i.type.replace("_", " "),
              " — ",
              i.date
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5", children: [
              /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: i.severity }),
              /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "capitalize", children: i.status.replace("_", " ") })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: i.description }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "Action: ",
            i.immediateAction,
            " · Reported by ",
            i.reportedBy
          ] })
        ] }) }, i.id)),
        rIncidents.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No incidents recorded." })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "mdt", className: "space-y-2", children: [
        rMDT.map((m) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium", children: [
            m.date,
            " · ",
            m.authoredBy
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
            "Attendees: ",
            m.attendees
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm mt-2", children: [
            /* @__PURE__ */ jsx("strong", { children: "Discussion:" }),
            " ",
            m.discussion
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
            /* @__PURE__ */ jsx("strong", { children: "Recommendations:" }),
            " ",
            m.recommendations
          ] }),
          m.followUpDate && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "Follow-up: ",
            m.followUpDate
          ] })
        ] }) }, m.id)),
        rMDT.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No MDT notes recorded." })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "visitors", className: "space-y-2", children: [
        rVisitors.map((v) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium", children: [
            v.visitorName,
            " ",
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
              "(",
              v.relationship,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            v.date,
            " · ",
            v.arrivalTime,
            "–",
            v.departureTime,
            " · Signed in by ",
            v.signedInBy
          ] }),
          v.notes && /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: v.notes })
        ] }) }, v.id)),
        rVisitors.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No visitor records." })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "outings", className: "space-y-2", children: [
        rOutings.map((o) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium", children: [
            o.destination,
            " — ",
            o.date
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            o.departureTime,
            "–",
            o.returnTime,
            " · ",
            o.transportMethod,
            " · With ",
            o.accompaniedBy
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
            "Risk assessment: ",
            o.riskAssessmentCompleted ? "Completed" : "Not completed"
          ] }),
          o.notes && /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: o.notes })
        ] }) }, o.id)),
        rOutings.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No outings recorded." })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "handovers", className: "space-y-2", children: [
        rHandovers.map((h) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium capitalize", children: [
            h.shift,
            " shift — ",
            h.date
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: h.staff }),
          /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: h.summary }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            /* @__PURE__ */ jsx("strong", { children: "Outstanding:" }),
            " ",
            h.outstandingActions
          ] })
        ] }) }, h.id)),
        rHandovers.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No handover notes." })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "nok", className: "space-y-3", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(Dialog, { open: nokOpen, onOpenChange: setNokOpen, children: [
          /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { size: "sm", children: [
            /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5 mr-1" }),
            " Add Next of Kin"
          ] }) }),
          /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-lg", children: [
            /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Add Next of Kin" }) }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Name" }),
                /* @__PURE__ */ jsx(Input, { value: newNok.name, onChange: (e) => setNewNok({
                  ...newNok,
                  name: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Label, { children: "Relationship" }),
                /* @__PURE__ */ jsx(Input, { value: newNok.relationship, onChange: (e) => setNewNok({
                  ...newNok,
                  relationship: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Label, { children: "Phone" }),
                /* @__PURE__ */ jsx(Input, { value: newNok.phone, onChange: (e) => setNewNok({
                  ...newNok,
                  phone: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Label, { children: "Mobile" }),
                /* @__PURE__ */ jsx(Input, { value: newNok.mobile, onChange: (e) => setNewNok({
                  ...newNok,
                  mobile: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Label, { children: "Email" }),
                /* @__PURE__ */ jsx(Input, { value: newNok.email, onChange: (e) => setNewNok({
                  ...newNok,
                  email: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Address" }),
                /* @__PURE__ */ jsx(Input, { value: newNok.address, onChange: (e) => setNewNok({
                  ...newNok,
                  address: e.target.value
                }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-2 grid grid-cols-2 gap-2 text-sm", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex gap-2 items-center", children: [
                  /* @__PURE__ */ jsx("input", { type: "checkbox", checked: newNok.primaryContact, onChange: (e) => setNewNok({
                    ...newNok,
                    primaryContact: e.target.checked
                  }) }),
                  " ",
                  "Primary contact"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex gap-2 items-center", children: [
                  /* @__PURE__ */ jsx("input", { type: "checkbox", checked: newNok.emergencyContact, onChange: (e) => setNewNok({
                    ...newNok,
                    emergencyContact: e.target.checked
                  }) }),
                  " ",
                  "Emergency contact"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex gap-2 items-center", children: [
                  /* @__PURE__ */ jsx("input", { type: "checkbox", checked: newNok.powerOfAttorney, onChange: (e) => setNewNok({
                    ...newNok,
                    powerOfAttorney: e.target.checked
                  }) }),
                  " ",
                  "Power of attorney"
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex gap-2 items-center", children: [
                  /* @__PURE__ */ jsx("input", { type: "checkbox", checked: newNok.legalRepresentative, onChange: (e) => setNewNok({
                    ...newNok,
                    legalRepresentative: e.target.checked
                  }) }),
                  " ",
                  "Legal representative"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Notes" }),
                /* @__PURE__ */ jsx(Textarea, { value: newNok.notes, onChange: (e) => setNewNok({
                  ...newNok,
                  notes: e.target.value
                }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(DialogFooter, { children: [
              /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setNokOpen(false), children: "Cancel" }),
              /* @__PURE__ */ jsx(Button, { onClick: () => {
                if (!newNok.name) {
                  toast.error("Name required");
                  return;
                }
                addNextOfKin(r.id, newNok);
                setNewNok({
                  name: "",
                  relationship: "",
                  phone: "",
                  mobile: "",
                  email: "",
                  address: "",
                  notes: "",
                  primaryContact: false,
                  emergencyContact: false,
                  powerOfAttorney: false,
                  legalRepresentative: false
                });
                setNokOpen(false);
                toast.success("Next of kin added");
              }, children: "Add" })
            ] })
          ] })
        ] }) }),
        (r.nextOfKinList || []).map((n) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                n.name,
                " ",
                /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                  "(",
                  n.relationship,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                n.phone || n.mobile,
                " · ",
                n.email
              ] }),
              n.address && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: n.address })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1", children: [
              n.primaryContact && /* @__PURE__ */ jsx(Badge, { variant: "default", className: "text-[10px]", children: "Primary" }),
              n.emergencyContact && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: "Emergency" }),
              n.powerOfAttorney && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: "PoA" }),
              n.legalRepresentative && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: "Legal Rep" })
            ] })
          ] }),
          n.notes && /* @__PURE__ */ jsx("p", { className: "text-sm mt-2 text-muted-foreground", children: n.notes })
        ] }) }, n.id)),
        (!r.nextOfKinList || r.nextOfKinList.length === 0) && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No next of kin recorded." })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "alerts", className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Alerts & Risks" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border rounded-md p-2", children: [
              /* @__PURE__ */ jsx("span", { children: "High Risk Resident Flags" }),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", children: highRiskFlags.length })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border rounded-md p-2", children: [
              /* @__PURE__ */ jsx("span", { children: "Overdue Assessments" }),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", children: overdueAssessments.length })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border rounded-md p-2", children: [
              /* @__PURE__ */ jsx("span", { children: "Overdue Reviews" }),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", children: overdueProblemReviews.length })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border rounded-md p-2", children: [
              /* @__PURE__ */ jsx("span", { children: "Open Incidents" }),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", children: openIncidents.length })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border rounded-md p-2", children: [
              /* @__PURE__ */ jsx("span", { children: "Clinical Alerts" }),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", children: openAlertCount })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-2 space-y-2", children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: "Outstanding Tasks" }),
              openTasks.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                openTasks.slice(0, 3).map((task) => {
                  const taskDate = task.dueDate.slice(0, 10);
                  let dueLabel = `Due ${taskDate}`;
                  if (taskDate < todayKey) dueLabel = "Overdue";
                  else if (taskDate === todayKey) dueLabel = "Due Today";
                  else if (taskDate === tomorrowKey) dueLabel = "Due Tomorrow";
                  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 text-xs", children: [
                    /* @__PURE__ */ jsx("span", { className: "truncate", children: task.title }),
                    /* @__PURE__ */ jsx("span", { className: "text-muted-foreground whitespace-nowrap", children: dueLabel })
                  ] }, task.id);
                }),
                openTasks.length > 3 && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  "+",
                  openTasks.length - 3,
                  " more"
                ] })
              ] }) : /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "No Outstanding Tasks" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Clinical Alerts" }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "space-y-2", children: rAlerts.length > 0 ? rAlerts.map((a) => /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-3 flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "h-5 w-5 text-warning-foreground" }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: a.title }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: a.description })
            ] }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: a.priority })
          ] }, a.id)) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No clinical alerts recorded." }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "tasks", className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-3 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-2 text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Upcoming Tasks" }),
            /* @__PURE__ */ jsx("div", { className: "font-semibold tabular-nums", children: taskOps.upcoming.length })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-2 text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Overdue Tasks" }),
            /* @__PURE__ */ jsx("div", { className: "font-semibold tabular-nums text-destructive", children: taskOps.overdue.length })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-2 text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Completed Today" }),
            /* @__PURE__ */ jsx("div", { className: "font-semibold tabular-nums", children: taskOps.completedToday.length })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Overdue Tasks" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2", children: [
            taskOps.overdue.map((t) => /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-3 flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: t.title }),
                /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  "Assigned to ",
                  t.assignedTo,
                  " · Due ",
                  t.dueDate
                ] })
              ] }),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "bg-destructive/10 text-destructive border-destructive/30", children: "Overdue" })
            ] }, t.id)),
            taskOps.overdue.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No overdue tasks." })
          ] })
        ] }),
        rTasks.map((t) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: t.title }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
              "Due ",
              t.dueDate,
              " · ",
              t.assignedTo
            ] })
          ] }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: t.status })
        ] }) }, t.id)),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Task History" }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "space-y-2", children: rTasks.slice().sort((a, b) => b.dueDate.localeCompare(a.dueDate)).map((t) => /* @__PURE__ */ jsxs("div", { className: "text-xs border rounded-md p-2", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: t.title }),
            /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground", children: [
              "Status: ",
              t.status,
              " · Due: ",
              t.dueDate,
              " · Assigned: ",
              t.assignedTo
            ] })
          ] }, t.id)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: latestVitalsDialogOpen, onOpenChange: setLatestVitalsDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-3xl", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Latest Vitals" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Most recent recorded vital signs for this resident." })
      ] }),
      /* @__PURE__ */ jsx(LatestVitalsCard, { vitals: rVitals, resident: r })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: timelineDialogOpen, onOpenChange: setTimelineDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-5xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Clinical Timeline" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Newest first, filter by clinical module." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 mb-3", children: [["all", "All"], ["assessments", "Assessments"], ["careplans", "Care Plans"], ["interventions", "Interventions"], ["evaluations", "Evaluations"], ["incidents", "Incidents"], ["mdt", "MDT"], ["tasks", "Tasks"], ["vitals", "Vitals"], ["visitors", "Visitors"], ["outings", "Outings"]].map(([key, label]) => /* @__PURE__ */ jsx(Button, { size: "sm", variant: timelineFilter === key ? "default" : "outline", onClick: () => setTimelineFilter(key), children: label }, key)) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        filteredTimelineEntries.map((e) => /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: `${e.at}`.slice(0, 16).replace("T", " ") }),
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: e.title }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground capitalize", children: [
            e.module,
            " · ",
            e.summary || "—",
            " · ",
            e.by || "System"
          ] })
        ] }, e.id)),
        filteredTimelineEntries.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No timeline records for this filter." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: auditDialogOpen, onOpenChange: setAuditDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-6xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Resident Audit History" }) }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Date" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Time" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "User" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Role" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Module" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Action" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Old Value" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "New Value" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Reason" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y", children: [
          residentAuditRows.map((row) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: row.timestamp.slice(0, 10) }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: row.timestamp.slice(11, 16) }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: row.user }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs capitalize", children: row.role || "—" }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: row.module }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: row.action }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs truncate max-w-40", children: row.before || "—" }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs truncate max-w-40", children: row.after || "—" }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: row.reason || "—" })
          ] }, row.id)),
          residentAuditRows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 9, className: "p-6 text-center text-sm text-muted-foreground", children: "No resident audit entries found." }) })
        ] })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: versionDialogOpen, onOpenChange: setVersionDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-6xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Version History" }) }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Module" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Record" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Version" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Created By" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Date" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Reason" }),
          /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Superseded By" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y", children: [
          residentVersionRows.map((row) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: row.module }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: row.name }),
            /* @__PURE__ */ jsxs("td", { className: "p-2 text-xs", children: [
              "v",
              row.version
            ] }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: row.createdBy }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: `${row.date}`.slice(0, 16).replace("T", " ") }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: row.reason || "—" }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: row.supersededBy || "—" })
          ] }, row.key)),
          residentVersionRows.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "p-6 text-center text-sm text-muted-foreground", children: "No version history entries." }) })
        ] })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx(AddDailyNoteModal, { open: modalState.note, onOpenChange: (open) => handleCloseModal("note"), residentId: r.id }),
    /* @__PURE__ */ jsx(AddInterventionModal, { open: modalState.intervention, onOpenChange: (open) => {
      handleCloseModal("intervention");
      if (!open) setPresetInterventionProblemId(void 0);
    }, residentId: r.id, initialProblemId: presetInterventionProblemId, lockProblemSelection: !!presetInterventionProblemId }),
    /* @__PURE__ */ jsx(AddInterventionCompletionModal, { open: modalState.interventionCompletion, onOpenChange: (open) => handleCloseModal("interventionCompletion"), intervention: selectedIntervention, residentId: r.id }),
    /* @__PURE__ */ jsx(InterventionReviewModal, { open: modalState.interventionReview, onOpenChange: (open) => handleCloseModal("interventionReview"), intervention: selectedIntervention, action: selectedReviewAction, onSuccess: () => {
      handleCloseModal("interventionReview");
      setSelectedIntervention(null);
      setSelectedReviewAction(null);
    } }),
    /* @__PURE__ */ jsx(AddAssessmentModal, { open: modalState.assessment, onOpenChange: (open) => handleCloseModal("assessment"), residentId: r.id }),
    /* @__PURE__ */ jsx(AddTaskModal, { open: modalState.task, onOpenChange: (open) => handleCloseModal("task"), residentId: r.id }),
    /* @__PURE__ */ jsx(IncidentDialog, { open: modalState.incident, onOpenChange: (open) => handleCloseModal("incident"), mode: "create", defaultResidentId: r.id }),
    /* @__PURE__ */ jsx(AddMDTNoteModal, { open: modalState.mdt, onOpenChange: (open) => handleCloseModal("mdt"), residentId: r.id }),
    /* @__PURE__ */ jsx(VisitorDialog, { open: modalState.visitor, onOpenChange: (open) => handleCloseModal("visitor"), mode: "create", defaultResidentId: r.id }),
    /* @__PURE__ */ jsx(OutingDialog, { open: modalState.outing, onOpenChange: (open) => handleCloseModal("outing"), mode: "create", defaultResidentId: r.id }),
    /* @__PURE__ */ jsx(Dialog, { open: problemDetailOpen, onOpenChange: setProblemDetailOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-6xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Care Plan Problem Detail" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: selectedProblem ? `${selectedProblem.problemStatement}` : "Select a problem from Active Care Plan Problems." })
      ] }),
      selectedProblem && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Problem Information" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "grid md:grid-cols-2 gap-2 text-sm", children: [
            /* @__PURE__ */ jsx(Row, { label: "Problem statement", value: selectedProblem.problemStatement }),
            /* @__PURE__ */ jsx(Row, { label: "Category", value: selectedProblem.category.replace(/_/g, " ") }),
            /* @__PURE__ */ jsx(Row, { label: "Risk level", value: selectedProblem.riskLevel.replace(/_/g, " ") }),
            /* @__PURE__ */ jsx(Row, { label: "Created date", value: selectedProblem.createdAt.slice(0, 10) }),
            /* @__PURE__ */ jsx(Row, { label: "Created by", value: selectedProblem.createdBy }),
            /* @__PURE__ */ jsx(Row, { label: "Status", value: selectedProblem.status }),
            /* @__PURE__ */ jsx(Row, { label: "Review date", value: selectedProblem.reviewDate }),
            /* @__PURE__ */ jsx(Row, { label: "Evaluation date", value: selectedProblem.evaluationDate }),
            /* @__PURE__ */ jsx(Row, { label: "Source assessment", value: selectedProblem.sourceAssessmentType || selectedProblem.sourceAssessmentId || "—" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Goals" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-3 gap-2", children: [
              /* @__PURE__ */ jsx(Input, { placeholder: "Add goal", value: goalDraft.statement, onChange: (e) => setGoalDraft((s) => ({
                ...s,
                statement: e.target.value
              })) }),
              /* @__PURE__ */ jsx(Input, { type: "date", value: goalDraft.targetDate, onChange: (e) => setGoalDraft((s) => ({
                ...s,
                targetDate: e.target.value
              })) }),
              /* @__PURE__ */ jsx(Button, { onClick: submitAddGoal, children: "Add Goal" })
            ] }),
            selectedProblemGoals.map((goal) => /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-2 grid md:grid-cols-5 gap-2 items-center text-sm", children: [
              /* @__PURE__ */ jsx("div", { className: "md:col-span-2", children: goal.statement }),
              /* @__PURE__ */ jsx("div", { className: "text-xs", children: goal.targetDate || "—" }),
              /* @__PURE__ */ jsx("div", { className: "text-xs capitalize", children: goal.status.replace(/_/g, " ") }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-1 justify-end", children: [
                /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => updateGoal(goal.id, {
                  status: "achieved"
                }), children: "Edit" }),
                /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => updateGoal(goal.id, {
                  status: "discontinued"
                }), children: "Archive" }),
                /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => removeGoal(goal.id), children: "Remove" })
              ] })
            ] }, goal.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Interventions" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { size: "sm", onClick: () => openAddInterventionForProblem(selectedProblem.id), children: "Add Intervention" }) }),
            /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Intervention" }),
                /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Frequency" }),
                /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Assigned" }),
                /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Status" }),
                /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Start" }),
                /* @__PURE__ */ jsx("th", { className: "text-left p-2", children: "Review" }),
                /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "Actions" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y", children: selectedProblemInterventions.map((intv) => {
                return /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("td", { className: "p-2", children: intv.name }),
                  /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: intv.frequencyType.replace(/_/g, " ") }),
                  /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: intv.assignedStaffName || intv.assignedRole || "—" }),
                  /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: intv.status.replace(/_/g, " ") }),
                  /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: intv.startDate }),
                  /* @__PURE__ */ jsx("td", { className: "p-2 text-xs", children: intv.reviewDate }),
                  /* @__PURE__ */ jsx("td", { className: "p-2 text-right", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex gap-1", children: [
                    /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleRecordCompletion(intv), children: "Open" }),
                    /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => handleReviewIntervention(intv, "extend"), children: "Edit" }),
                    /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => discontinueProblemIntervention(intv.id, "Discontinued from problem detail"), children: "Discontinue" })
                  ] }) })
                ] }, intv.id);
              }) })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Evaluations" }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { size: "sm", onClick: () => openAddEvaluationForProblem(selectedProblem.id), children: "Add Evaluation" }) }),
            selectedProblemEvaluations.map((evl) => /* @__PURE__ */ jsxs("div", { className: "border rounded-md p-2 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                evl.date.slice(0, 10),
                " · ",
                evl.evaluatorName
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                "Progress: ",
                evl.progress.replace(/_/g, " "),
                " · Goals Met: ",
                evl.goalsMet
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs", children: [
                "Outcome: ",
                evl.recommendations || "—"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                "Next Evaluation: ",
                evl.nextEvaluationDate || "—"
              ] })
            ] }, evl.id))
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: evaluationOpen, onOpenChange: setEvaluationOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Add Evaluation" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: selectedProblem ? `Resident and problem are pre-linked: ${selectedProblem.problemStatement}` : "Select a problem first." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Evaluation Date" }),
          /* @__PURE__ */ jsx(Input, { type: "date", value: evaluationDraft.date, onChange: (e) => setEvaluationDraft((s) => ({
            ...s,
            date: e.target.value
          })) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Evaluator" }),
          /* @__PURE__ */ jsx(Input, { value: currentUserName, disabled: true })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Summary" }),
          /* @__PURE__ */ jsx(Textarea, { value: evaluationDraft.summary, onChange: (e) => setEvaluationDraft((s) => ({
            ...s,
            summary: e.target.value
          })) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Goals Met" }),
          /* @__PURE__ */ jsxs(Select, { value: evaluationDraft.goalsMet, onValueChange: (v) => setEvaluationDraft((s) => ({
            ...s,
            goalsMet: v
          })), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "yes", children: "Yes" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "partial", children: "Partial" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "no", children: "No" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Progress" }),
          /* @__PURE__ */ jsxs(Select, { value: evaluationDraft.progress, onValueChange: (v) => setEvaluationDraft((s) => ({
            ...s,
            progress: v
          })), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "improved", children: "Improved" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "stable", children: "Stable" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "deteriorated", children: "Deteriorated" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "resolved", children: "Resolved" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "requires_revision", children: "Requires Revision" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Evidence / Review Outcome" }),
          /* @__PURE__ */ jsx(Textarea, { value: evaluationDraft.recommendations, onChange: (e) => setEvaluationDraft((s) => ({
            ...s,
            recommendations: e.target.value
          })) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Next Evaluation Date" }),
          /* @__PURE__ */ jsx(Input, { type: "date", value: evaluationDraft.nextEvaluationDate, onChange: (e) => setEvaluationDraft((s) => ({
            ...s,
            nextEvaluationDate: e.target.value
          })) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Revision Required?" }),
          /* @__PURE__ */ jsxs(Select, { value: evaluationDraft.revisionRequired, onValueChange: (v) => setEvaluationDraft((s) => ({
            ...s,
            revisionRequired: v
          })), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "no", children: "No" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "yes", children: "Yes" })
            ] })
          ] })
        ] }),
        evaluationDraft.revisionRequired === "yes" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Revision Reason" }),
            /* @__PURE__ */ jsx(Textarea, { value: evaluationDraft.revisionReason, onChange: (e) => setEvaluationDraft((s) => ({
              ...s,
              revisionReason: e.target.value
            })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Add Intervention (optional)" }),
            /* @__PURE__ */ jsx(Input, { value: evaluationDraft.revisionAddIntervention, onChange: (e) => setEvaluationDraft((s) => ({
              ...s,
              revisionAddIntervention: e.target.value
            })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Remove Intervention" }),
            /* @__PURE__ */ jsxs(Select, { value: evaluationDraft.revisionDiscontinueInterventionId, onValueChange: (v) => setEvaluationDraft((s) => ({
              ...s,
              revisionDiscontinueInterventionId: v
            })), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select intervention" }) }),
              /* @__PURE__ */ jsx(SelectContent, { children: selectedProblemInterventions.map((intv) => /* @__PURE__ */ jsx(SelectItem, { value: intv.id, children: intv.name }, intv.id)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Change Frequency For" }),
            /* @__PURE__ */ jsxs(Select, { value: evaluationDraft.revisionChangeInterventionId, onValueChange: (v) => setEvaluationDraft((s) => ({
              ...s,
              revisionChangeInterventionId: v
            })), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select intervention" }) }),
              /* @__PURE__ */ jsx(SelectContent, { children: selectedProblemInterventions.map((intv) => /* @__PURE__ */ jsx(SelectItem, { value: intv.id, children: intv.name }, intv.id)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "New Frequency" }),
            /* @__PURE__ */ jsxs(Select, { value: evaluationDraft.revisionFrequencyType, onValueChange: (v) => setEvaluationDraft((s) => ({
              ...s,
              revisionFrequencyType: v
            })), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "hourly", children: "Hourly" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "every_2_hours", children: "Every 2 Hours" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "every_4_hours", children: "Every 4 Hours" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "every_6_hours", children: "Every 6 Hours" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "daily", children: "Daily" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "twice_daily", children: "Twice Daily" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "three_times_daily", children: "Three Times Daily" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "weekly", children: "Weekly" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "monthly", children: "Monthly" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Update Goal" }),
            /* @__PURE__ */ jsxs(Select, { value: evaluationDraft.revisionUpdateGoalId, onValueChange: (v) => setEvaluationDraft((s) => ({
              ...s,
              revisionUpdateGoalId: v
            })), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select goal" }) }),
              /* @__PURE__ */ jsx(SelectContent, { children: selectedProblemGoals.map((goal) => /* @__PURE__ */ jsx(SelectItem, { value: goal.id, children: goal.statement }, goal.id)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Updated Goal Text" }),
            /* @__PURE__ */ jsx(Input, { value: evaluationDraft.revisionGoalText, onChange: (e) => setEvaluationDraft((s) => ({
              ...s,
              revisionGoalText: e.target.value
            })) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { children: "Update Review Date" }),
            /* @__PURE__ */ jsx(Input, { type: "date", value: evaluationDraft.revisionReviewDate, onChange: (e) => setEvaluationDraft((s) => ({
              ...s,
              revisionReviewDate: e.target.value
            })) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setEvaluationOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: submitEvaluation, children: "Save Evaluation" })
      ] })
    ] }) })
  ] });
}
function Row({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground capitalize", children: label }),
    /* @__PURE__ */ jsx("div", { className: "col-span-2 capitalize", children: value || "—" })
  ] });
}
export {
  ResidentDetail as component
};
