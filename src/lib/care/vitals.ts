import type {
  VitalSign, ObservationPlan, ObservationPlanItem, ObservationFrequency,
  ClinicalAlert, ClinicalAlertType, ClinicalAlertSeverity, Resident, VitalObservationType,
} from "./types";

// ---------------- BMI ----------------

export function calcBMI(weightKg?: number, heightCm?: number): number | undefined {
  if (!weightKg || !heightCm) return undefined;
  const m = heightCm / 100;
  if (m <= 0) return undefined;
  return +(weightKg / (m * m)).toFixed(1);
}

export type BMICategory = "underweight" | "normal" | "overweight" | "obese";

export function bmiCategory(bmi?: number): BMICategory | undefined {
  if (bmi === undefined) return undefined;
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

/** Returns the height applicable for a resident on a given date — most recent height
 *  recorded at or before that date, else the resident.heightCm default. */
export function heightAtDate(residentId: string, dateISO: string, allVitals: VitalSign[], resident?: Resident): number | undefined {
  const candidates = allVitals
    .filter(v => v.residentId === residentId && !v.deletedAt && v.height && v.date <= dateISO)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (candidates.length > 0) return candidates[0].height;
  return resident?.heightCm;
}

export interface BMIPoint { date: string; weight: number; height?: number; bmi?: number; category?: BMICategory; }

export function bmiHistory(residentId: string, allVitals: VitalSign[], resident?: Resident): BMIPoint[] {
  return allVitals
    .filter(v => v.residentId === residentId && !v.deletedAt && v.weight)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(v => {
      const h = v.height ?? heightAtDate(residentId, v.date, allVitals, resident);
      const bmi = calcBMI(v.weight, h);
      return { date: v.date, weight: v.weight!, height: h, bmi, category: bmiCategory(bmi) };
    });
}

// ---------------- NEWS2 ----------------

export interface NEWS2Result {
  total: number;
  risk: "low" | "low-medium" | "medium" | "high";
  breakdown: Record<string, number>;
  complete: boolean;
}

function rrScore(rr?: number) {
  if (rr === undefined) return undefined;
  if (rr <= 8) return 3;
  if (rr <= 11) return 1;
  if (rr <= 20) return 0;
  if (rr <= 24) return 2;
  return 3;
}
function spo2Score(s?: number) {
  if (s === undefined) return undefined;
  if (s <= 91) return 3;
  if (s <= 93) return 2;
  if (s <= 95) return 1;
  return 0;
}
function tempScore(t?: number) {
  if (t === undefined) return undefined;
  if (t <= 35) return 3;
  if (t <= 36) return 1;
  if (t <= 38) return 0;
  if (t <= 39) return 1;
  return 2;
}
function sbpScore(s?: number) {
  if (s === undefined) return undefined;
  if (s <= 90) return 3;
  if (s <= 100) return 2;
  if (s <= 110) return 1;
  if (s <= 219) return 0;
  return 3;
}
function pulseScore(p?: number) {
  if (p === undefined) return undefined;
  if (p <= 40) return 3;
  if (p <= 50) return 1;
  if (p <= 90) return 0;
  if (p <= 110) return 1;
  if (p <= 130) return 2;
  return 3;
}
function consciousnessScore(c?: string) {
  if (!c) return undefined;
  return c === "A" ? 0 : 3;
}

export function calcNEWS2(v: Partial<VitalSign>): NEWS2Result {
  const breakdown: Record<string, number> = {};
  let total = 0;
  let complete = true;
  const add = (key: string, val: number | undefined) => {
    if (val === undefined) { complete = false; return; }
    breakdown[key] = val;
    total += val;
  };
  add("respiratoryRate", rrScore(v.respiratoryRate));
  add("spo2", spo2Score(v.spo2));
  breakdown["supplementalO2"] = v.onOxygen ? 2 : 0;
  total += breakdown["supplementalO2"];
  add("temperature", tempScore(v.temperature));
  add("systolicBP", sbpScore(v.systolicBP));
  add("pulse", pulseScore(v.pulse));
  add("consciousness", consciousnessScore(v.consciousness));

  let risk: NEWS2Result["risk"] = "low";
  const anyThree = Object.values(breakdown).some(x => x >= 3);
  if (total >= 7) risk = "high";
  else if (total >= 5) risk = "medium";
  else if (anyThree) risk = "low-medium";
  else risk = "low";

  return { total, risk, breakdown, complete };
}

// ---------------- Weight trends ----------------

export interface WeightTrend {
  current?: number;
  previous?: number;
  deltaKg?: number;
  deltaPct?: number;
  windowDays: number;
}

export function weightTrend(residentVitals: VitalSign[], windowDays: number): WeightTrend {
  const ws = residentVitals
    .filter(v => !v.deletedAt && v.weight)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (ws.length === 0) return { windowDays };
  const current = ws[0].weight!;
  const cutoff = new Date(Date.now() - windowDays * 86400000).toISOString().slice(0, 10);
  const prior = ws.find(v => v.date <= cutoff) ?? ws[ws.length - 1];
  if (!prior || prior.id === ws[0].id) return { current, windowDays };
  const previous = prior.weight!;
  const deltaKg = +(current - previous).toFixed(1);
  const deltaPct = +(((current - previous) / previous) * 100).toFixed(1);
  return { current, previous, deltaKg, deltaPct, windowDays };
}

// ---------------- Fluid balance ----------------

export interface FluidDay { date: string; intakeMl: number; outputMl: number; balanceMl: number; }

export function fluidBalanceForDay(residentVitals: VitalSign[], dateISO: string): FluidDay {
  const entries = residentVitals.filter(v => !v.deletedAt && v.date === dateISO);
  const intake = entries.reduce((s, v) => s + (v.fluidIntakeMl ?? 0), 0);
  const output = entries.reduce((s, v) => s + (v.fluidOutputMl ?? 0), 0);
  return { date: dateISO, intakeMl: intake, outputMl: output, balanceMl: intake - output };
}

export function fluidBalance7Day(residentVitals: VitalSign[], endDateISO?: string): FluidDay[] {
  const end = endDateISO ? new Date(endDateISO) : new Date();
  const out: FluidDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    out.push(fluidBalanceForDay(residentVitals, d.toISOString().slice(0, 10)));
  }
  return out;
}

// ---------------- Glucose ----------------

export interface GlucoseSummary { readings: { date: string; time: string; value: number }[]; highCount: number; lowCount: number; }

export function glucoseTrend(residentVitals: VitalSign[]): GlucoseSummary {
  const readings = residentVitals
    .filter(v => !v.deletedAt && v.bloodGlucose !== undefined)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .map(v => ({ date: v.date, time: v.time, value: v.bloodGlucose! }));
  return {
    readings,
    highCount: readings.filter(r => r.value > 11).length,
    lowCount: readings.filter(r => r.value < 4).length,
  };
}

// ---------------- Alert derivation (informational only) ----------------

interface AlertSeed { type: ClinicalAlertType; severity: ClinicalAlertSeverity; title: string; message: string; recommendation: string; sourceVitalId?: string; }

export function derivedAlertsForResident(residentVitals: VitalSign[], resident?: Resident): AlertSeed[] {
  const out: AlertSeed[] = [];
  const sorted = residentVitals.filter(v => !v.deletedAt).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  if (sorted.length === 0) return out;
  const latest = sorted[0];

  // Temp
  if (latest.temperature !== undefined) {
    if (latest.temperature >= 38.5 || latest.temperature < 35) {
      out.push({ type: "abnormal_temp", severity: latest.temperature >= 39.5 || latest.temperature < 35 ? "critical" : "warning",
        title: `Temperature ${latest.temperature}°C`, message: "Temperature outside expected range.",
        recommendation: "Monitor resident and consider clinical review.", sourceVitalId: latest.id });
    }
  }
  // SpO2
  if (latest.spo2 !== undefined && latest.spo2 < 92) {
    out.push({ type: "low_spo2", severity: latest.spo2 < 88 ? "critical" : "warning",
      title: `SpO2 ${latest.spo2}%`, message: "Low oxygen saturation recorded.",
      recommendation: "Review respiratory status and escalate per local policy.", sourceVitalId: latest.id });
  }
  // BP
  if (latest.systolicBP !== undefined) {
    if (latest.systolicBP < 90 || latest.systolicBP > 180 || (latest.diastolicBP ?? 0) > 110) {
      out.push({ type: "abnormal_bp", severity: latest.systolicBP < 80 || latest.systolicBP > 200 ? "critical" : "warning",
        title: `BP ${latest.systolicBP}/${latest.diastolicBP ?? "?"}`, message: "Blood pressure outside expected range.",
        recommendation: "Monitor and consider nursing review.", sourceVitalId: latest.id });
    }
  }
  // Pain
  if (latest.painScore !== undefined && latest.painScore >= 7) {
    out.push({ type: "high_pain", severity: "warning",
      title: `Pain score ${latest.painScore}/10`, message: "Severe pain recorded.",
      recommendation: "Review pain management interventions.", sourceVitalId: latest.id });
  }
  // Glucose
  if (latest.bloodGlucose !== undefined) {
    if (latest.bloodGlucose < 4) {
      out.push({ type: "hypoglycaemia", severity: latest.bloodGlucose < 3 ? "critical" : "warning",
        title: `BGL ${latest.bloodGlucose} mmol/L`, message: "Hypoglycaemia risk.",
        recommendation: "Review per hypoglycaemia protocol.", sourceVitalId: latest.id });
    } else if (latest.bloodGlucose > 11) {
      out.push({ type: "hyperglycaemia", severity: latest.bloodGlucose > 20 ? "critical" : "warning",
        title: `BGL ${latest.bloodGlucose} mmol/L`, message: "Hyperglycaemia risk.",
        recommendation: "Review per hyperglycaemia protocol.", sourceVitalId: latest.id });
    }
  }
  // NEWS2
  const news = calcNEWS2(latest);
  if (news.complete && news.total >= 5) {
    out.push({ type: "high_news2", severity: news.total >= 7 ? "critical" : "warning",
      title: `NEWS2 ${news.total} (${news.risk})`, message: "Elevated NEWS2 score.",
      recommendation: "Follow local escalation protocol.", sourceVitalId: latest.id });
  }
  // BMI
  const h = heightAtDate(latest.residentId, latest.date, residentVitals, resident);
  const bmi = calcBMI(latest.weight, h);
  if (bmi !== undefined) {
    if (bmi < 18.5) out.push({ type: "bmi_low", severity: bmi < 16 ? "critical" : "warning",
      title: `BMI ${bmi}`, message: "Underweight BMI.", recommendation: "Review nutritional care plan.", sourceVitalId: latest.id });
    if (bmi >= 30) out.push({ type: "bmi_high", severity: "info",
      title: `BMI ${bmi}`, message: "Obese BMI category.", recommendation: "Consider dietetic review.", sourceVitalId: latest.id });
  }
  // Weight loss
  const wt = weightTrend(residentVitals, 90);
  if (wt.deltaPct !== undefined && wt.deltaPct <= -5) {
    const sev: ClinicalAlertSeverity = wt.deltaPct <= -15 ? "critical" : wt.deltaPct <= -10 ? "warning" : "warning";
    out.push({ type: "weight_loss", severity: sev,
      title: `Weight loss ${Math.abs(wt.deltaPct)}% (90d)`,
      message: `Down ${Math.abs(wt.deltaKg ?? 0)}kg from ${wt.previous}kg to ${wt.current}kg.`,
      recommendation: wt.deltaPct <= -15 ? "Urgent nutritional review recommended." : "Review nutritional status.",
      sourceVitalId: latest.id });
  }
  return out;
}

// ---------------- Compliance ----------------

export const FREQUENCY_HOURS: Record<ObservationFrequency, number | null> = {
  "4_hourly": 4, "8_hourly": 8, "12_hourly": 12, daily: 24, weekly: 24 * 7, monthly: 24 * 30, prn: null,
};

export const FREQUENCY_LABEL: Record<ObservationFrequency, string> = {
  "4_hourly": "4 hourly", "8_hourly": "8 hourly", "12_hourly": "12 hourly",
  daily: "Daily", weekly: "Weekly", monthly: "Monthly", prn: "PRN",
};

export const OBS_TYPE_LABEL: Record<VitalObservationType, string> = {
  temperature: "Temperature", pulse: "Pulse", respiratoryRate: "Respiratory Rate",
  bloodPressure: "Blood Pressure", spo2: "SpO2", bloodGlucose: "Blood Glucose",
  weight: "Weight", painScore: "Pain Score", news2: "NEWS2", fluidBalance: "Fluid Balance",
};

function lastRecordedFor(type: VitalObservationType, vitals: VitalSign[]): string | undefined {
  const has = (v: VitalSign) => {
    switch (type) {
      case "temperature": return v.temperature !== undefined;
      case "pulse": return v.pulse !== undefined;
      case "respiratoryRate": return v.respiratoryRate !== undefined;
      case "bloodPressure": return v.systolicBP !== undefined;
      case "spo2": return v.spo2 !== undefined;
      case "bloodGlucose": return v.bloodGlucose !== undefined;
      case "weight": return v.weight !== undefined;
      case "painScore": return v.painScore !== undefined;
      case "news2": return calcNEWS2(v).complete;
      case "fluidBalance": return v.fluidIntakeMl !== undefined || v.fluidOutputMl !== undefined;
    }
  };
  const matches = vitals.filter(v => !v.deletedAt && has(v)).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  return matches[0]?.recordedAt;
}

export type ComplianceStatus = "on_time" | "due_today" | "overdue" | "missed" | "prn";

export interface ComplianceItem {
  item: ObservationPlanItem;
  lastRecordedAt?: string;
  nextDueAt?: string;
  hoursOverdue?: number;
  status: ComplianceStatus;
}

export interface ComplianceForResident {
  items: ComplianceItem[];
  compliancePct: number;
  dueTodayCount: number;
  overdueCount: number;
  missedCount: number;
}

export function complianceForResident(plan: ObservationPlan | undefined, vitals: VitalSign[], asOf = new Date()): ComplianceForResident {
  if (!plan) return { items: [], compliancePct: 100, dueTodayCount: 0, overdueCount: 0, missedCount: 0 };
  const items: ComplianceItem[] = plan.items.map(it => {
    const hours = FREQUENCY_HOURS[it.frequency];
    const lastRecordedAt = lastRecordedFor(it.type, vitals);
    if (hours === null) return { item: it, lastRecordedAt, status: "prn" as ComplianceStatus };
    if (!lastRecordedAt) {
      return { item: it, status: "missed" as ComplianceStatus };
    }
    const nextDue = new Date(new Date(lastRecordedAt).getTime() + hours * 3600_000);
    const diffH = (asOf.getTime() - nextDue.getTime()) / 3600_000;
    let status: ComplianceStatus;
    if (diffH < -2) status = "on_time";
    else if (diffH < 0) status = "due_today";
    else if (diffH < hours) status = "overdue";
    else status = "missed";
    return { item: it, lastRecordedAt, nextDueAt: nextDue.toISOString(), hoursOverdue: diffH > 0 ? +diffH.toFixed(1) : undefined, status };
  });
  const counted = items.filter(i => i.status !== "prn");
  const onTime = counted.filter(i => i.status === "on_time" || i.status === "due_today").length;
  const compliancePct = counted.length === 0 ? 100 : Math.round((onTime / counted.length) * 100);
  return {
    items,
    compliancePct,
    dueTodayCount: items.filter(i => i.status === "due_today").length,
    overdueCount: items.filter(i => i.status === "overdue").length,
    missedCount: items.filter(i => i.status === "missed").length,
  };
}

// ---------------- Deterioration signals ----------------

export type Direction = "up" | "down" | "flat";

export interface DeteriorationSignals {
  weight: Direction;
  news2: Direction;
  pain: Direction;
  mobility: Direction;
  falls: Direction;
}

function trend(values: number[]): Direction {
  if (values.length < 2) return "flat";
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;
  const rel = Math.abs(first) > 0 ? Math.abs(delta) / Math.abs(first) : Math.abs(delta);
  if (rel < 0.03) return "flat";
  return delta > 0 ? "up" : "down";
}

export function deteriorationSignals(
  residentVitals: VitalSign[],
  opts: { barthelScores?: number[]; fallsLast30?: number; fallsPrev30?: number },
): DeteriorationSignals {
  const sorted = residentVitals.filter(v => !v.deletedAt).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const weights = sorted.filter(v => v.weight !== undefined).map(v => v.weight!);
  const pains = sorted.filter(v => v.painScore !== undefined).map(v => v.painScore!);
  const news = sorted.map(v => calcNEWS2(v)).filter(n => n.complete).map(n => n.total);
  const mobility: Direction = opts.barthelScores && opts.barthelScores.length >= 2
    ? trend(opts.barthelScores) === "up" ? "down" : trend(opts.barthelScores) === "down" ? "up" : "flat" // higher Barthel = better; invert for "deterioration up = mobility down"
    : "flat";
  const falls: Direction = opts.fallsLast30 !== undefined && opts.fallsPrev30 !== undefined
    ? opts.fallsLast30 > opts.fallsPrev30 ? "up" : opts.fallsLast30 < opts.fallsPrev30 ? "down" : "flat"
    : "flat";
  // For weight, "down" = concerning. We expose raw direction.
  return {
    weight: trend(weights),
    news2: trend(news),
    pain: trend(pains),
    mobility,
    falls,
  };
}

// ---------------- Recharts helpers ----------------

export function vitalsSeries(residentVitals: VitalSign[], metric: keyof VitalSign | "bmi" | "news2"): { date: string; value: number }[] {
  const sorted = residentVitals.filter(v => !v.deletedAt).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  return sorted.map(v => {
    let value: number | undefined;
    if (metric === "bmi") value = calcBMI(v.weight, v.height);
    else if (metric === "news2") { const n = calcNEWS2(v); value = n.complete ? n.total : undefined; }
    else value = v[metric] as any;
    return { date: v.date, value: value as number };
  }).filter(p => p.value !== undefined && !Number.isNaN(p.value));
}
