import type { ClinicalObservation, ObservationKind, Resident, ObservationFrequency } from "./types";
import { calcBMI, bmiCategory, calcNEWS2, FREQUENCY_HOURS, FREQUENCY_LABEL, heightAtDate } from "./vitals";
import {
  Scale, HeartPulse, Droplets, Activity, GlassWater, CircleDot, Toilet, Bandage,
} from "lucide-react";

export type FieldType = "number" | "text" | "textarea" | "select" | "switch";

export interface ObsField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  step?: string;
  min?: number;
  max?: number;
  unit?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
  helper?: string;
  group?: string;
}

export interface ObsAlert {
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  recommendation: string;
  sourceId?: string;
}

export interface ModuleSpec {
  kind: ObservationKind;
  label: string;
  shortLabel: string;
  icon: any;
  color: string;        // tailwind text-* class
  bg: string;           // tailwind bg-* class
  description: string;
  fields: ObsField[];
  /** Summary line shown in latest card / dashboards */
  summarize: (obs: ClinicalObservation, resident?: Resident, allOfKind?: ClinicalObservation[]) => string;
  /** History table columns */
  columns: { key: string; label: string; render?: (obs: ClinicalObservation, resident?: Resident, allOfKind?: ClinicalObservation[]) => string }[];
  /** Trend chart metrics */
  trends: { key: string; label: string; unit?: string; extract: (obs: ClinicalObservation, resident?: Resident, allOfKind?: ClinicalObservation[]) => number | undefined }[];
  /** Alert derivation, evaluates against the resident's history of this kind */
  deriveAlerts: (obs: ClinicalObservation[], resident?: Resident) => ObsAlert[];
  /** Related assessment types displayed for context */
  relatedAssessments?: string[];
  defaultFrequency: ObservationFrequency;
}

// ============= Helpers =============
const num = (x: any) => (x === undefined || x === null || x === "" || Number.isNaN(+x) ? undefined : +x);
const sum = (xs: (number | undefined)[]) => xs.reduce((a: number, b) => a + (b ?? 0), 0);
const daysBetween = (a: string, b: string) => Math.round((+new Date(b) - +new Date(a)) / 86400000);

// ============= Module specs =============

const WEIGHT: ModuleSpec = {
  kind: "weight", label: "Weight & Nutrition", shortLabel: "Weight",
  icon: Scale, color: "text-emerald-600", bg: "bg-emerald-500/10",
  description: "Nutritional status tracking with BMI and weight-trend analysis.",
  defaultFrequency: "weekly",
  fields: [
    { key: "weight", label: "Weight (kg)", type: "number", step: "0.1", required: true, unit: "kg" },
    { key: "height", label: "Height (cm)", type: "number", step: "0.1", unit: "cm", helper: "Optional — uses most recent if blank" },
    { key: "muac", label: "Mid Upper Arm Circumference (cm)", type: "number", step: "0.1", unit: "cm" },
    { key: "appetite", label: "Appetite", type: "select", options: [
      { value: "good", label: "Good" }, { value: "fair", label: "Fair" }, { value: "poor", label: "Poor" },
    ] },
    { key: "nutritionNotes", label: "Nutrition Notes", type: "textarea" },
  ],
  summarize: (o, r, all) => {
    const w = num(o.data.weight);
    const h = num(o.data.height) ?? heightAtDateFromObs(o.residentId, o.date, all || [], r);
    const bmi = calcBMI(w, h);
    return `${w ?? "—"} kg · BMI ${bmi ?? "—"}${bmi ? ` (${bmiCategory(bmi)})` : ""}`;
  },
  columns: [
    { key: "weight", label: "Weight (kg)", render: o => o.data.weight ?? "—" },
    { key: "bmi", label: "BMI", render: (o, r, all) => {
      const h = num(o.data.height) ?? heightAtDateFromObs(o.residentId, o.date, all || [], r);
      const b = calcBMI(num(o.data.weight), h);
      return b ? `${b} (${bmiCategory(b)})` : "—";
    } },
    { key: "appetite", label: "Appetite", render: o => o.data.appetite ?? "—" },
    { key: "muac", label: "MUAC", render: o => o.data.muac ?? "—" },
  ],
  trends: [
    { key: "weight", label: "Weight", unit: "kg", extract: o => num(o.data.weight) },
    { key: "bmi", label: "BMI", extract: (o, r, all) => {
      const h = num(o.data.height) ?? heightAtDateFromObs(o.residentId, o.date, all || [], r);
      return calcBMI(num(o.data.weight), h);
    } },
  ],
  deriveAlerts: (obs, r) => {
    const out: ObsAlert[] = [];
    const sorted = obs.filter(o => !o.deletedAt && o.data.weight).sort((a, b) => b.date.localeCompare(a.date));
    if (sorted.length === 0) return out;
    const latest = sorted[0];
    const w = num(latest.data.weight)!;
    const h = num(latest.data.height) ?? heightAtDateFromObs(latest.residentId, latest.date, sorted, r);
    const bmi = calcBMI(w, h);
    if (bmi !== undefined && bmi < 18.5) out.push({ severity: bmi < 16 ? "critical" : "warning", title: `Low BMI ${bmi}`, message: "Underweight category.", recommendation: "Refer to dietitian / review MUST.", sourceId: latest.id });
    if (bmi !== undefined && bmi >= 30) out.push({ severity: "info", title: `High BMI ${bmi}`, message: "Obese category.", recommendation: "Dietetic review recommended.", sourceId: latest.id });
    // weight loss against 30/90 day baseline
    for (const days of [30, 90]) {
      const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      const prior = sorted.find(o => o.date <= cutoff);
      if (!prior || prior.id === latest.id) continue;
      const pw = num(prior.data.weight)!;
      const pct = ((w - pw) / pw) * 100;
      if (pct <= -5) {
        const sev = pct <= -15 ? "critical" : pct <= -10 ? "warning" : "warning";
        out.push({ severity: sev, title: `Weight loss ${Math.abs(pct).toFixed(1)}% (${days}d)`, message: `Down ${(pw - w).toFixed(1)}kg from ${pw}kg.`, recommendation: pct <= -15 ? "Urgent nutritional review." : "Review nutritional care plan.", sourceId: latest.id });
        break;
      }
    }
    return out;
  },
  relatedAssessments: ["MUST", "MNA", "Nutrition Care Plan"],
};

const NEWS2: ModuleSpec = {
  kind: "news2", label: "NEWS2 / Clinical Observations", shortLabel: "NEWS2",
  icon: HeartPulse, color: "text-rose-600", bg: "bg-rose-500/10",
  description: "Full nursing observations with NEWS2 risk scoring.",
  defaultFrequency: "daily",
  fields: [
    { key: "temperature", label: "Temperature (°C)", type: "number", step: "0.1", required: true, group: "Vitals" },
    { key: "pulse", label: "Pulse (bpm)", type: "number", required: true, group: "Vitals" },
    { key: "respiratoryRate", label: "Respiratory Rate", type: "number", required: true, group: "Vitals" },
    { key: "systolicBP", label: "Systolic BP", type: "number", required: true, group: "Vitals" },
    { key: "diastolicBP", label: "Diastolic BP", type: "number", group: "Vitals" },
    { key: "spo2", label: "SpO2 (%)", type: "number", required: true, group: "Vitals" },
    { key: "onOxygen", label: "Oxygen Therapy", type: "switch", group: "Oxygen" },
    { key: "oxygenLpm", label: "Oxygen (L/min)", type: "number", step: "0.5", group: "Oxygen" },
    { key: "consciousness", label: "Consciousness (ACVPU)", type: "select", required: true, options: [
      { value: "A", label: "A — Alert" }, { value: "C", label: "C — Confused" },
      { value: "V", label: "V — Voice" }, { value: "P", label: "P — Pain" }, { value: "U", label: "U — Unresponsive" },
    ] },
  ],
  summarize: o => {
    const n = calcNEWS2(o.data as any);
    return `T ${o.data.temperature ?? "—"} · P ${o.data.pulse ?? "—"} · RR ${o.data.respiratoryRate ?? "—"} · BP ${o.data.systolicBP ?? "—"}/${o.data.diastolicBP ?? "?"} · SpO2 ${o.data.spo2 ?? "—"}% · NEWS2 ${n.complete ? n.total : "—"}`;
  },
  columns: [
    { key: "temp", label: "Temp", render: o => o.data.temperature ?? "—" },
    { key: "pulse", label: "Pulse", render: o => o.data.pulse ?? "—" },
    { key: "rr", label: "RR", render: o => o.data.respiratoryRate ?? "—" },
    { key: "bp", label: "BP", render: o => o.data.systolicBP ? `${o.data.systolicBP}/${o.data.diastolicBP ?? "?"}` : "—" },
    { key: "spo2", label: "SpO2", render: o => o.data.spo2 ?? "—" },
    { key: "acvpu", label: "ACVPU", render: o => o.data.consciousness ?? "—" },
    { key: "news2", label: "NEWS2", render: o => { const n = calcNEWS2(o.data as any); return n.complete ? `${n.total} (${n.risk})` : "—"; } },
  ],
  trends: [
    { key: "news2", label: "NEWS2", extract: o => { const n = calcNEWS2(o.data as any); return n.complete ? n.total : undefined; } },
    { key: "temperature", label: "Temperature", unit: "°C", extract: o => num(o.data.temperature) },
    { key: "pulse", label: "Pulse", unit: "bpm", extract: o => num(o.data.pulse) },
    { key: "systolicBP", label: "Systolic BP", unit: "mmHg", extract: o => num(o.data.systolicBP) },
    { key: "spo2", label: "SpO2", unit: "%", extract: o => num(o.data.spo2) },
  ],
  deriveAlerts: obs => {
    const out: ObsAlert[] = [];
    const latest = obs.filter(o => !o.deletedAt).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
    if (!latest) return out;
    const n = calcNEWS2(latest.data as any);
    if (n.complete && n.total >= 5) out.push({ severity: n.total >= 7 ? "critical" : "warning", title: `NEWS2 ${n.total} (${n.risk} risk)`, message: "Elevated NEWS2 score.", recommendation: n.total >= 7 ? "Escalate to GP / 999 per protocol." : "Increase observation frequency, inform nurse-in-charge.", sourceId: latest.id });
    const t = num(latest.data.temperature);
    if (t !== undefined && (t >= 38.5 || t < 35)) out.push({ severity: t >= 39.5 || t < 35 ? "critical" : "warning", title: `Temperature ${t}°C`, message: "Outside expected range.", recommendation: "Clinical review.", sourceId: latest.id });
    const sp = num(latest.data.spo2);
    if (sp !== undefined && sp < 92) out.push({ severity: sp < 88 ? "critical" : "warning", title: `SpO2 ${sp}%`, message: "Low oxygen saturation.", recommendation: "Review respiratory status.", sourceId: latest.id });
    return out;
  },
};

const GLUCOSE: ModuleSpec = {
  kind: "glucose", label: "Blood Glucose Monitoring", shortLabel: "Glucose",
  icon: Droplets, color: "text-blue-600", bg: "bg-blue-500/10",
  description: "Diabetic monitoring with hypo/hyper alerts.",
  defaultFrequency: "4_hourly",
  fields: [
    { key: "value", label: "Blood Glucose (mmol/L)", type: "number", step: "0.1", required: true, unit: "mmol/L" },
    { key: "mealContext", label: "Context", type: "select", options: [
      { value: "before_meal", label: "Before Meal" }, { value: "after_meal", label: "After Meal" }, { value: "fasting", label: "Fasting" }, { value: "bedtime", label: "Bedtime" }, { value: "other", label: "Other" },
    ] },
    { key: "insulinUnits", label: "Insulin Administered (units)", type: "number", step: "0.5" },
    { key: "insulinType", label: "Insulin Type", type: "text", placeholder: "e.g. Novorapid 6 units" },
  ],
  summarize: o => `${o.data.value ?? "—"} mmol/L${o.data.mealContext ? ` · ${String(o.data.mealContext).replace("_", " ")}` : ""}`,
  columns: [
    { key: "value", label: "Glucose", render: o => `${o.data.value ?? "—"} mmol/L` },
    { key: "context", label: "Context", render: o => String(o.data.mealContext ?? "—").replace("_", " ") },
    { key: "insulin", label: "Insulin", render: o => o.data.insulinUnits ? `${o.data.insulinUnits}u ${o.data.insulinType ?? ""}` : "—" },
  ],
  trends: [{ key: "glucose", label: "Glucose", unit: "mmol/L", extract: o => num(o.data.value) }],
  deriveAlerts: obs => {
    const out: ObsAlert[] = [];
    const latest = obs.filter(o => !o.deletedAt).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
    if (!latest) return out;
    const v = num(latest.data.value);
    if (v !== undefined && v < 4) out.push({ severity: v < 3 ? "critical" : "warning", title: `Hypoglycaemia ${v} mmol/L`, message: "Below safe range.", recommendation: "Treat per hypo protocol immediately.", sourceId: latest.id });
    if (v !== undefined && v > 11) out.push({ severity: v > 20 ? "critical" : "warning", title: `Hyperglycaemia ${v} mmol/L`, message: "Above target range.", recommendation: "Review per hyperglycaemia protocol.", sourceId: latest.id });
    return out;
  },
};

const PAIN: ModuleSpec = {
  kind: "pain", label: "Pain Monitoring", shortLabel: "Pain",
  icon: Activity, color: "text-orange-600", bg: "bg-orange-500/10",
  description: "Ongoing pain review with intervention outcomes.",
  defaultFrequency: "daily",
  fields: [
    { key: "score", label: "Pain Score (0–10)", type: "number", min: 0, max: 10, required: true },
    { key: "location", label: "Pain Location", type: "text" },
    { key: "type", label: "Pain Type", type: "select", options: [
      { value: "sharp", label: "Sharp" }, { value: "dull", label: "Dull" }, { value: "burning", label: "Burning" },
      { value: "throbbing", label: "Throbbing" }, { value: "aching", label: "Aching" }, { value: "other", label: "Other" },
    ] },
    { key: "duration", label: "Duration", type: "text", placeholder: "e.g. 30 minutes / ongoing" },
    { key: "intervention", label: "Intervention Given", type: "textarea" },
    { key: "outcome", label: "Outcome", type: "textarea" },
  ],
  summarize: o => `Score ${o.data.score ?? "—"}/10${o.data.location ? ` · ${o.data.location}` : ""}`,
  columns: [
    { key: "score", label: "Score", render: o => `${o.data.score ?? "—"}/10` },
    { key: "location", label: "Location", render: o => o.data.location ?? "—" },
    { key: "type", label: "Type", render: o => o.data.type ?? "—" },
    { key: "intervention", label: "Intervention", render: o => o.data.intervention ?? "—" },
  ],
  trends: [{ key: "score", label: "Pain Score", unit: "/10", extract: o => num(o.data.score) }],
  deriveAlerts: obs => {
    const out: ObsAlert[] = [];
    const recent = obs.filter(o => !o.deletedAt).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)).slice(0, 3);
    if (recent.length === 0) return out;
    if (recent.length >= 2 && recent.every(o => (num(o.data.score) ?? 0) >= 7)) {
      out.push({ severity: "critical", title: "Persistent severe pain", message: "≥2 consecutive scores ≥7/10.", recommendation: "Urgent pain review — escalate to GP.", sourceId: recent[0].id });
    } else if ((num(recent[0].data.score) ?? 0) >= 7) {
      out.push({ severity: "warning", title: `Pain score ${recent[0].data.score}/10`, message: "Severe pain recorded.", recommendation: "Review pain management plan.", sourceId: recent[0].id });
    }
    return out;
  },
  relatedAssessments: ["Abbey Pain Scale", "Pain Chart"],
};

const FLUID: ModuleSpec = {
  kind: "fluid", label: "Fluid Balance Monitoring", shortLabel: "Fluid",
  icon: GlassWater, color: "text-cyan-600", bg: "bg-cyan-500/10",
  description: "Hydration monitoring with 24-hour balance calculation.",
  defaultFrequency: "4_hourly",
  fields: [
    { key: "oralMl", label: "Oral Intake (ml)", type: "number", group: "Intake" },
    { key: "pegMl", label: "PEG Intake (ml)", type: "number", group: "Intake" },
    { key: "otherInMl", label: "Other Intake (ml)", type: "number", group: "Intake" },
    { key: "urineMl", label: "Urine Output (ml)", type: "number", group: "Output" },
    { key: "vomitMl", label: "Vomit (ml)", type: "number", group: "Output" },
    { key: "drainageMl", label: "Drainage (ml)", type: "number", group: "Output" },
    { key: "otherOutMl", label: "Other Output (ml)", type: "number", group: "Output" },
  ],
  summarize: o => {
    const inMl = sum([o.data.oralMl, o.data.pegMl, o.data.otherInMl].map(num));
    const outMl = sum([o.data.urineMl, o.data.vomitMl, o.data.drainageMl, o.data.otherOutMl].map(num));
    return `In ${inMl}ml · Out ${outMl}ml · Bal ${inMl - outMl}ml`;
  },
  columns: [
    { key: "in", label: "Intake (ml)", render: o => String(sum([o.data.oralMl, o.data.pegMl, o.data.otherInMl].map(num))) },
    { key: "out", label: "Output (ml)", render: o => String(sum([o.data.urineMl, o.data.vomitMl, o.data.drainageMl, o.data.otherOutMl].map(num))) },
    { key: "bal", label: "Balance (ml)", render: o => {
      const i = sum([o.data.oralMl, o.data.pegMl, o.data.otherInMl].map(num));
      const out = sum([o.data.urineMl, o.data.vomitMl, o.data.drainageMl, o.data.otherOutMl].map(num));
      return String(i - out);
    } },
  ],
  trends: [
    { key: "intake", label: "Intake", unit: "ml", extract: o => sum([o.data.oralMl, o.data.pegMl, o.data.otherInMl].map(num)) },
    { key: "balance", label: "Balance", unit: "ml", extract: o => {
      const i = sum([o.data.oralMl, o.data.pegMl, o.data.otherInMl].map(num));
      const out = sum([o.data.urineMl, o.data.vomitMl, o.data.drainageMl, o.data.otherOutMl].map(num));
      return i - out;
    } },
  ],
  deriveAlerts: obs => {
    const out: ObsAlert[] = [];
    // Sum today's entries
    const today = new Date().toISOString().slice(0, 10);
    const todays = obs.filter(o => !o.deletedAt && o.date === today);
    if (todays.length === 0) return out;
    const intake = sum(todays.flatMap(o => [o.data.oralMl, o.data.pegMl, o.data.otherInMl].map(num)));
    const output = sum(todays.flatMap(o => [o.data.urineMl, o.data.vomitMl, o.data.drainageMl, o.data.otherOutMl].map(num)));
    const bal = intake - output;
    const latest = todays[todays.length - 1];
    if (intake < 1000 && new Date().getHours() >= 18) {
      out.push({ severity: "warning", title: `Poor intake (${intake}ml today)`, message: "Below recommended daily intake.", recommendation: "Encourage fluids and review hydration plan.", sourceId: latest.id });
    }
    if (bal < -500) {
      out.push({ severity: bal < -1000 ? "critical" : "warning", title: `Negative balance ${bal}ml`, message: "Output significantly exceeds intake.", recommendation: "Clinical review for dehydration risk.", sourceId: latest.id });
    }
    return out;
  },
};

const BOWEL: ModuleSpec = {
  kind: "bowel", label: "Bowel Monitoring", shortLabel: "Bowel",
  icon: CircleDot, color: "text-amber-700", bg: "bg-amber-500/10",
  description: "Track bowel activity and Bristol stool scale.",
  defaultFrequency: "daily",
  fields: [
    { key: "opened", label: "Bowels Opened", type: "switch", required: true },
    { key: "bristol", label: "Bristol Stool Scale (1–7)", type: "number", min: 1, max: 7 },
    { key: "amount", label: "Amount", type: "select", options: [
      { value: "small", label: "Small" }, { value: "moderate", label: "Moderate" }, { value: "large", label: "Large" },
    ] },
    { key: "continent", label: "Continent", type: "switch" },
  ],
  summarize: o => o.data.opened ? `Opened · Bristol ${o.data.bristol ?? "—"} · ${o.data.amount ?? "—"}` : "No bowel motion",
  columns: [
    { key: "opened", label: "Opened", render: o => o.data.opened ? "Yes" : "No" },
    { key: "bristol", label: "Bristol", render: o => o.data.bristol ?? "—" },
    { key: "amount", label: "Amount", render: o => o.data.amount ?? "—" },
    { key: "continent", label: "Continent", render: o => o.data.continent ? "Yes" : "No" },
  ],
  trends: [{ key: "bristol", label: "Bristol Scale", extract: o => num(o.data.bristol) }],
  deriveAlerts: obs => {
    const out: ObsAlert[] = [];
    const opened = obs.filter(o => !o.deletedAt && o.data.opened).sort((a, b) => b.date.localeCompare(a.date));
    const latest = opened[0];
    const today = new Date().toISOString().slice(0, 10);
    const days = latest ? daysBetween(latest.date, today) : 999;
    if (days > 3) out.push({ severity: days > 5 ? "critical" : "warning", title: `No bowel motion ${days}d`, message: "Constipation risk.", recommendation: "Review aperient regime and inform GP.", sourceId: latest?.id });
    const recent = obs.filter(o => !o.deletedAt && o.data.opened && num(o.data.bristol) && (num(o.data.bristol)! >= 6)).slice(0, 4);
    if (recent.length >= 3) out.push({ severity: "warning", title: "Diarrhoea pattern", message: "Multiple Bristol 6–7 entries.", recommendation: "Consider infection screening / hydration review.", sourceId: recent[0].id });
    return out;
  },
  relatedAssessments: ["Continence Assessment"],
};

const URINARY: ModuleSpec = {
  kind: "urinary", label: "Urinary Monitoring", shortLabel: "Urinary",
  icon: Toilet, color: "text-yellow-600", bg: "bg-yellow-500/10",
  description: "Urinary pattern tracking.",
  defaultFrequency: "daily",
  fields: [
    { key: "voided", label: "Voided", type: "switch" },
    { key: "incontinent", label: "Incontinent Episode", type: "switch" },
    { key: "catheterMl", label: "Catheter Output (ml)", type: "number" },
    { key: "colour", label: "Colour", type: "select", options: [
      { value: "pale_yellow", label: "Pale yellow" }, { value: "yellow", label: "Yellow" },
      { value: "dark_yellow", label: "Dark yellow" }, { value: "amber", label: "Amber" }, { value: "blood_stained", label: "Blood-stained" }, { value: "cloudy", label: "Cloudy" },
    ] },
    { key: "odour", label: "Odour", type: "select", options: [
      { value: "normal", label: "Normal" }, { value: "strong", label: "Strong" }, { value: "offensive", label: "Offensive" },
    ] },
  ],
  summarize: o => `${o.data.voided ? "Voided" : ""}${o.data.catheterMl ? ` · Cath ${o.data.catheterMl}ml` : ""}${o.data.incontinent ? " · Incontinent" : ""}`,
  columns: [
    { key: "voided", label: "Voided", render: o => o.data.voided ? "Yes" : "—" },
    { key: "incontinent", label: "Incont.", render: o => o.data.incontinent ? "Yes" : "—" },
    { key: "catheter", label: "Catheter (ml)", render: o => o.data.catheterMl ?? "—" },
    { key: "colour", label: "Colour", render: o => String(o.data.colour ?? "—").replace("_", " ") },
    { key: "odour", label: "Odour", render: o => o.data.odour ?? "—" },
  ],
  trends: [{ key: "catheter", label: "Catheter Output", unit: "ml", extract: o => num(o.data.catheterMl) }],
  deriveAlerts: obs => {
    const out: ObsAlert[] = [];
    const today = new Date().toISOString().slice(0, 10);
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const tCath = sum(obs.filter(o => !o.deletedAt && o.date === today).map(o => num(o.data.catheterMl)));
    const yCath = sum(obs.filter(o => !o.deletedAt && o.date === yest).map(o => num(o.data.catheterMl)));
    if (yCath > 0 && tCath < yCath * 0.5) out.push({ severity: "warning", title: "Reduced urinary output", message: `Today ${tCath}ml vs yesterday ${yCath}ml.`, recommendation: "Review fluid balance and inform nurse." });
    const incontToday = obs.filter(o => !o.deletedAt && o.date === today && o.data.incontinent).length;
    if (incontToday >= 3) out.push({ severity: "info", title: `Increased incontinence (${incontToday} today)`, message: "Pattern change.", recommendation: "Review continence plan." });
    return out;
  },
  relatedAssessments: ["Continence Assessment", "Baseline Continence"],
};

const WOUND: ModuleSpec = {
  kind: "wound", label: "Wound Monitoring", shortLabel: "Wounds",
  icon: Bandage, color: "text-fuchsia-600", bg: "bg-fuchsia-500/10",
  description: "Track wounds and pressure damage with healing trend.",
  defaultFrequency: "weekly",
  fields: [
    { key: "woundType", label: "Wound Type", type: "select", required: true, options: [
      { value: "pressure_ulcer", label: "Pressure Ulcer" }, { value: "skin_tear", label: "Skin Tear" },
      { value: "surgical", label: "Surgical" }, { value: "leg_ulcer", label: "Leg Ulcer" },
      { value: "diabetic_foot", label: "Diabetic Foot" }, { value: "other", label: "Other" },
    ] },
    { key: "location", label: "Location", type: "text", required: true, placeholder: "e.g. Left heel" },
    { key: "length", label: "Length (cm)", type: "number", step: "0.1" },
    { key: "width", label: "Width (cm)", type: "number", step: "0.1" },
    { key: "depth", label: "Depth (cm)", type: "number", step: "0.1" },
    { key: "exudate", label: "Exudate", type: "select", options: [
      { value: "none", label: "None" }, { value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" },
    ] },
    { key: "dressing", label: "Dressing Applied", type: "text" },
    { key: "photoUrl", label: "Photo URL (optional)", type: "text", helper: "Paste a hosted image URL — local upload requires Cloud" },
  ],
  summarize: o => `${String(o.data.woundType ?? "wound").replace("_", " ")} · ${o.data.location ?? "—"} · ${o.data.length ?? "?"}×${o.data.width ?? "?"}×${o.data.depth ?? "?"}cm`,
  columns: [
    { key: "type", label: "Type", render: o => String(o.data.woundType ?? "—").replace("_", " ") },
    { key: "location", label: "Location", render: o => o.data.location ?? "—" },
    { key: "size", label: "Size (L×W×D)", render: o => `${o.data.length ?? "?"}×${o.data.width ?? "?"}×${o.data.depth ?? "?"}` },
    { key: "exudate", label: "Exudate", render: o => o.data.exudate ?? "—" },
    { key: "dressing", label: "Dressing", render: o => o.data.dressing ?? "—" },
  ],
  trends: [
    { key: "area", label: "Wound Area", unit: "cm²", extract: o => {
      const l = num(o.data.length); const w = num(o.data.width);
      return l && w ? +(l * w).toFixed(2) : undefined;
    } },
  ],
  deriveAlerts: obs => {
    const out: ObsAlert[] = [];
    // Group by location, check deterioration of area
    const byLoc: Record<string, ClinicalObservation[]> = {};
    obs.filter(o => !o.deletedAt && o.data.location).forEach(o => {
      const k = String(o.data.location).toLowerCase();
      (byLoc[k] ||= []).push(o);
    });
    Object.entries(byLoc).forEach(([loc, list]) => {
      const sorted = list.sort((a, b) => a.date.localeCompare(b.date));
      if (sorted.length < 2) return;
      const first = sorted[0], last = sorted[sorted.length - 1];
      const aFirst = (num(first.data.length) ?? 0) * (num(first.data.width) ?? 0);
      const aLast = (num(last.data.length) ?? 0) * (num(last.data.width) ?? 0);
      if (aFirst > 0 && aLast > aFirst * 1.2) {
        out.push({ severity: "warning", title: `Deteriorating wound (${loc})`, message: `Area ${aFirst.toFixed(1)}→${aLast.toFixed(1)} cm².`, recommendation: "Review wound care plan / tissue viability referral.", sourceId: last.id });
      }
    });
    // New pressure area in last 7 days
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const newPressure = obs.find(o => !o.deletedAt && o.data.woundType === "pressure_ulcer" && o.date >= cutoff);
    if (newPressure) {
      const existing = obs.find(o => o.id !== newPressure.id && !o.deletedAt && o.data.woundType === "pressure_ulcer" && o.data.location === newPressure.data.location && o.date < newPressure.date);
      if (!existing) out.push({ severity: "critical", title: `New pressure area: ${newPressure.data.location}`, message: "Pressure damage recorded.", recommendation: "Incident report + tissue viability referral.", sourceId: newPressure.id });
    }
    return out;
  },
  relatedAssessments: ["Waterlow", "Norton"],
};

export const MODULES: Record<ObservationKind, ModuleSpec> = {
  weight: WEIGHT, news2: NEWS2, glucose: GLUCOSE, pain: PAIN,
  fluid: FLUID, bowel: BOWEL, urinary: URINARY, wound: WOUND,
};

export const ALL_KINDS: ObservationKind[] = ["weight", "news2", "glucose", "pain", "fluid", "bowel", "urinary", "wound"];

export function getModule(kind: ObservationKind): ModuleSpec {
  return MODULES[kind];
}

// Resolve "applicable height" from prior weight observations for BMI
function heightAtDateFromObs(residentId: string, dateISO: string, obs: ClinicalObservation[], resident?: Resident): number | undefined {
  const cand = obs
    .filter(o => o.kind === "weight" && o.residentId === residentId && !o.deletedAt && o.data.height && o.date <= dateISO)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (cand.length) return num(cand[0].data.height);
  return resident?.heightCm;
}

// ============= Scheduling / compliance =============
export type ScheduleStatus = "on_time" | "due_today" | "overdue" | "missed" | "prn" | "never";

export interface ComplianceResult {
  kind: ObservationKind;
  frequency: ObservationFrequency;
  lastRecordedAt?: string;
  nextDueAt?: string;
  status: ScheduleStatus;
}

export function complianceFor(
  kind: ObservationKind,
  frequency: ObservationFrequency,
  obs: ClinicalObservation[],
  asOf = new Date(),
): ComplianceResult {
  const last = obs.filter(o => o.kind === kind && !o.deletedAt).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
  const hours = FREQUENCY_HOURS[frequency];
  if (hours === null) return { kind, frequency, lastRecordedAt: last?.recordedAt, status: "prn" };
  if (!last) return { kind, frequency, status: "never" };
  const next = new Date(new Date(last.recordedAt).getTime() + hours * 3600_000);
  const diffH = (asOf.getTime() - next.getTime()) / 3600_000;
  let status: ScheduleStatus;
  if (diffH < -2) status = "on_time";
  else if (diffH < 0) status = "due_today";
  else if (diffH < hours) status = "overdue";
  else status = "missed";
  return { kind, frequency, lastRecordedAt: last.recordedAt, nextDueAt: next.toISOString(), status };
}

export { FREQUENCY_LABEL };
