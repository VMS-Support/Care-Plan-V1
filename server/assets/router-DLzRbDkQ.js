import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Link, Outlet, useRouterState, createRootRouteWithContext, useRouter, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useState, useEffect, useMemo, useCallback, useContext, createContext } from "react";
import { ChevronRight, Check, Circle, Shield, User, Settings, LogOut, ChevronDown, ChevronUp, Filter, X, LayoutDashboard, Building2, Users, Stethoscope, HeartPulse, ClipboardList, LibraryBig, ShieldCheck, NotebookPen, UserCheck, ShieldAlert, UsersRound, Plane, AlertTriangle, Gauge, CheckSquare, BarChart3, History, Search } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Toaster as Toaster$1 } from "sonner";
import { cva } from "class-variance-authority";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Slot } from "@radix-ui/react-slot";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as SelectPrimitive from "@radix-ui/react-select";
const appCss = "/assets/styles-C608Hp74.css";
function reportLovableError(error, context = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error"
    }
  );
}
function calcBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return void 0;
  const m = heightCm / 100;
  if (m <= 0) return void 0;
  return +(weightKg / (m * m)).toFixed(1);
}
function bmiCategory(bmi) {
  if (bmi === void 0) return void 0;
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}
function heightAtDate(residentId, dateISO, allVitals, resident) {
  const candidates = allVitals.filter((v) => v.residentId === residentId && !v.deletedAt && v.height && v.date <= dateISO).sort((a, b) => b.date.localeCompare(a.date));
  if (candidates.length > 0) return candidates[0].height;
  return resident?.heightCm;
}
function rrScore(rr) {
  if (rr === void 0) return void 0;
  if (rr <= 8) return 3;
  if (rr <= 11) return 1;
  if (rr <= 20) return 0;
  if (rr <= 24) return 2;
  return 3;
}
function spo2Score(s) {
  if (s === void 0) return void 0;
  if (s <= 91) return 3;
  if (s <= 93) return 2;
  if (s <= 95) return 1;
  return 0;
}
function tempScore(t) {
  if (t === void 0) return void 0;
  if (t <= 35) return 3;
  if (t <= 36) return 1;
  if (t <= 38) return 0;
  if (t <= 39) return 1;
  return 2;
}
function sbpScore(s) {
  if (s === void 0) return void 0;
  if (s <= 90) return 3;
  if (s <= 100) return 2;
  if (s <= 110) return 1;
  if (s <= 219) return 0;
  return 3;
}
function pulseScore(p) {
  if (p === void 0) return void 0;
  if (p <= 40) return 3;
  if (p <= 50) return 1;
  if (p <= 90) return 0;
  if (p <= 110) return 1;
  if (p <= 130) return 2;
  return 3;
}
function consciousnessScore(c) {
  if (!c || !["A", "C", "V", "P", "U"].includes(c)) return void 0;
  return c === "A" ? 0 : 3;
}
function calcNEWS2(v) {
  const breakdown = {};
  let total = 0;
  let complete = true;
  const add = (key, val) => {
    if (val === void 0) {
      complete = false;
      return;
    }
    breakdown[key] = val;
    total += val;
  };
  add("RR", rrScore(v.respiratoryRate));
  add("SpO2", spo2Score(v.spo2));
  breakdown.Oxygen = v.onOxygen ? 2 : 0;
  total += breakdown.Oxygen;
  add("Temp", tempScore(v.temperature));
  add("BP", sbpScore(v.systolicBP));
  add("Pulse", pulseScore(v.pulse));
  add("Consciousness", consciousnessScore(v.consciousness));
  let risk = "low";
  const anyThree = Object.values(breakdown).some((x) => x >= 3);
  if (total >= 7) risk = "high";
  else if (total >= 5) risk = "medium";
  else if (anyThree) risk = "low-medium";
  else risk = "low";
  return { total, risk, breakdown, complete };
}
function derivedAlertsForResident(residentVitals, _resident) {
  const out = [];
  const sorted = residentVitals.filter((v) => !v.deletedAt).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  if (sorted.length === 0) return out;
  const readingsWith = (key) => sorted.filter((v) => v[key] !== void 0);
  const [currentTemp, previousTemp] = readingsWith("temperature");
  if (currentTemp?.temperature !== void 0 && (currentTemp.temperature > 38 || currentTemp.temperature < 35.5)) {
    out.push({
      type: "abnormal_temp",
      severity: currentTemp.temperature >= 39 || currentTemp.temperature < 35.5 ? "critical" : "warning",
      title: currentTemp.temperature < 35.5 ? "Low Temperature" : "High Temperature",
      message: "Temperature is outside the expected clinical range.",
      recommendation: "Repeat observations and review resident.",
      currentValue: `${currentTemp.temperature}°C`,
      previousValue: previousTemp?.temperature !== void 0 ? `${previousTemp.temperature}°C` : void 0,
      sourceVitalId: currentTemp.id
    });
  }
  const [currentSpo2, previousSpo2] = readingsWith("spo2");
  if (currentSpo2?.spo2 !== void 0 && currentSpo2.spo2 < 92) {
    out.push({
      type: "low_spo2",
      severity: currentSpo2.spo2 < 90 ? "critical" : "warning",
      title: "Low Oxygen Saturation",
      message: "Oxygen saturation is below the expected clinical range.",
      recommendation: "Repeat observations and review respiratory status.",
      currentValue: `${currentSpo2.spo2}%`,
      previousValue: previousSpo2?.spo2 !== void 0 ? `${previousSpo2.spo2}%` : void 0,
      sourceVitalId: currentSpo2.id
    });
  }
  const [currentBp, previousBp] = readingsWith("systolicBP");
  if (currentBp?.systolicBP !== void 0 && (currentBp.systolicBP < 90 || currentBp.systolicBP > 180 || (currentBp.diastolicBP ?? 0) > 110)) {
    out.push({
      type: "abnormal_bp",
      severity: currentBp.systolicBP < 90 || currentBp.systolicBP > 180 ? "critical" : "warning",
      title: "Abnormal Blood Pressure",
      message: "Blood pressure is outside the expected clinical range.",
      recommendation: "Repeat observations and review resident.",
      currentValue: `${currentBp.systolicBP}/${currentBp.diastolicBP ?? "?"} mmHg`,
      previousValue: previousBp?.systolicBP !== void 0 ? `${previousBp.systolicBP}/${previousBp.diastolicBP ?? "?"} mmHg` : void 0,
      sourceVitalId: currentBp.id
    });
  }
  const [currentPain, previousPain] = readingsWith("painScore");
  const significantPainIncrease = currentPain?.painScore !== void 0 && previousPain?.painScore !== void 0 && currentPain.painScore - previousPain.painScore >= 3;
  const sustainedHighPain = currentPain?.painScore !== void 0 && currentPain.painScore >= 7 && (previousPain?.painScore ?? 0) >= 7;
  if (currentPain?.painScore !== void 0 && (significantPainIncrease || sustainedHighPain)) {
    out.push({
      type: "high_pain",
      severity: "warning",
      title: "Pain Escalation",
      message: sustainedHighPain ? "High pain score remains sustained." : "Pain has increased significantly.",
      recommendation: "Review pain management.",
      currentValue: `${currentPain.painScore}/10`,
      previousValue: previousPain?.painScore !== void 0 ? `${previousPain.painScore}/10` : void 0,
      sourceVitalId: currentPain.id
    });
  }
  const [currentGlucose, previousGlucose] = readingsWith("bloodGlucose");
  if (currentGlucose?.bloodGlucose !== void 0 && (currentGlucose.bloodGlucose < 4 || currentGlucose.bloodGlucose > 15)) {
    const low = currentGlucose.bloodGlucose < 4;
    out.push({
      type: low ? "hypoglycaemia" : "hyperglycaemia",
      severity: "warning",
      title: low ? "Low Blood Glucose" : "High Blood Glucose",
      message: `Blood glucose is ${low ? "below 4" : "above 15"} mmol/L.`,
      recommendation: "Review resident and follow the local glucose protocol.",
      currentValue: `${currentGlucose.bloodGlucose} mmol/L`,
      previousValue: previousGlucose?.bloodGlucose !== void 0 ? `${previousGlucose.bloodGlucose} mmol/L` : void 0,
      sourceVitalId: currentGlucose.id
    });
  }
  const newsReadings = sorted.map((vital) => ({ vital, score: calcNEWS2(vital) })).filter(({ score }) => score.complete);
  const currentNews = newsReadings[0];
  const news = currentNews?.score;
  if (news?.complete && news.total >= 5) {
    const previousNews = newsReadings[1]?.score;
    out.push({
      type: "high_news2",
      severity: news.total >= 7 ? "critical" : "warning",
      title: "Elevated NEWS2",
      message: "NEWS2 indicates possible clinical deterioration.",
      recommendation: "Repeat observations and follow the local escalation protocol.",
      currentValue: `${news.total}`,
      previousValue: previousNews ? `${previousNews.total}` : void 0,
      sourceVitalId: currentNews.vital.id
    });
  }
  const weights = sorted.filter((v) => v.weight !== void 0);
  const currentWeight = weights[0];
  if (currentWeight?.weight !== void 0) {
    const currentAt = new Date(currentWeight.recordedAt).getTime();
    const readingsWithin = (days) => weights.filter((v) => currentAt - new Date(v.recordedAt).getTime() <= days * 864e5);
    const previous30 = readingsWithin(30).at(-1);
    const previous3 = readingsWithin(3).at(-1);
    if (previous30?.weight !== void 0 && previous30.id !== currentWeight.id) {
      const lossPct = (previous30.weight - currentWeight.weight) / previous30.weight * 100;
      if (lossPct > 5) out.push({
        type: "weight_loss",
        severity: lossPct > 10 ? "critical" : "warning",
        title: "Significant Weight Loss",
        message: `Weight reduced by ${lossPct.toFixed(1)}% within 30 days.`,
        recommendation: lossPct > 10 ? "Escalate nutritional review." : "Review nutrition and hydration.",
        currentValue: `${currentWeight.weight} kg`,
        previousValue: `${previous30.weight} kg`,
        sourceVitalId: currentWeight.id
      });
    }
    if (previous3?.weight !== void 0 && previous3.id !== currentWeight.id && currentWeight.weight - previous3.weight > 2) {
      out.push({
        type: "weight_gain",
        severity: "warning",
        title: "Rapid Weight Gain",
        message: `Weight increased by ${(currentWeight.weight - previous3.weight).toFixed(1)} kg within 3 days.`,
        recommendation: "Assess fluid retention.",
        currentValue: `${currentWeight.weight} kg`,
        previousValue: `${previous3.weight} kg`,
        sourceVitalId: currentWeight.id
      });
    }
  }
  const latestFluid = sorted.find((v) => v.fluidIntakeMl !== void 0 || v.fluidOutputMl !== void 0);
  const dayVitals = latestFluid ? sorted.filter((v) => v.date === latestFluid.date) : [];
  const intake = dayVitals.reduce((total, v) => total + (v.fluidIntakeMl ?? 0), 0);
  const output = dayVitals.reduce((total, v) => total + (v.fluidOutputMl ?? 0), 0);
  const balance = intake - output;
  if (output > 0 && balance <= -1e3) {
    out.push({
      type: "fluid_imbalance",
      severity: "warning",
      title: "Negative Fluid Balance",
      message: "A significant negative fluid balance has been recorded.",
      recommendation: "Review hydration status.",
      currentValue: `${balance} ml`,
      previousValue: `Intake ${intake} ml / output ${output} ml`,
      sourceVitalId: latestFluid?.id
    });
  }
  return out;
}
const FREQUENCY_HOURS = {
  "4_hourly": 4,
  "8_hourly": 8,
  "12_hourly": 12,
  daily: 24,
  weekly: 24 * 7,
  monthly: 24 * 30,
  prn: null
};
function lastRecordedFor(type, vitals) {
  const has = (v) => {
    switch (type) {
      case "temperature":
        return v.temperature !== void 0;
      case "pulse":
        return v.pulse !== void 0;
      case "respiratoryRate":
        return v.respiratoryRate !== void 0;
      case "bloodPressure":
        return v.systolicBP !== void 0;
      case "spo2":
        return v.spo2 !== void 0;
      case "bloodGlucose":
        return v.bloodGlucose !== void 0;
      case "weight":
        return v.weight !== void 0;
      case "painScore":
        return v.painScore !== void 0;
      case "news2":
        return calcNEWS2(v).complete;
      case "fluidBalance":
        return v.fluidIntakeMl !== void 0 || v.fluidOutputMl !== void 0;
    }
  };
  const matches = vitals.filter((v) => !v.deletedAt && has(v)).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  return matches[0]?.recordedAt;
}
function complianceForResident(plan, vitals, asOf = /* @__PURE__ */ new Date()) {
  if (!plan) return { items: [], compliancePct: 100, dueTodayCount: 0, overdueCount: 0, missedCount: 0 };
  const items = plan.items.map((it) => {
    const hours = FREQUENCY_HOURS[it.frequency];
    const lastRecordedAt = lastRecordedFor(it.type, vitals);
    if (hours === null) return { item: it, lastRecordedAt, status: "prn" };
    if (!lastRecordedAt) {
      return { item: it, status: "missed" };
    }
    const nextDue = new Date(new Date(lastRecordedAt).getTime() + hours * 36e5);
    const diffH = (asOf.getTime() - nextDue.getTime()) / 36e5;
    let status;
    if (diffH < -2) status = "on_time";
    else if (diffH < 0) status = "due_today";
    else if (diffH < hours) status = "overdue";
    else status = "missed";
    return { item: it, lastRecordedAt, nextDueAt: nextDue.toISOString(), hoursOverdue: diffH > 0 ? +diffH.toFixed(1) : void 0, status };
  });
  const counted = items.filter((i) => i.status !== "prn");
  const onTime = counted.filter((i) => i.status === "on_time" || i.status === "due_today").length;
  const compliancePct = counted.length === 0 ? 100 : Math.round(onTime / counted.length * 100);
  return {
    items,
    compliancePct,
    dueTodayCount: items.filter((i) => i.status === "due_today").length,
    overdueCount: items.filter((i) => i.status === "overdue").length,
    missedCount: items.filter((i) => i.status === "missed").length
  };
}
function sumScores(scores) {
  return Object.values(scores).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}
const barthelItems = [
  { key: "feeding", label: "Feeding", options: [[0, "Unable"], [5, "Needs help"], [10, "Independent"]] },
  { key: "bathing", label: "Bathing", options: [[0, "Dependent"], [5, "Independent"]] },
  { key: "grooming", label: "Grooming", options: [[0, "Needs help"], [5, "Independent"]] },
  { key: "dressing", label: "Dressing", options: [[0, "Dependent"], [5, "Needs help"], [10, "Independent"]] },
  { key: "bowels", label: "Bowels", options: [[0, "Incontinent"], [5, "Occasional accident"], [10, "Continent"]] },
  { key: "bladder", label: "Bladder", options: [[0, "Incontinent"], [5, "Occasional"], [10, "Continent"]] },
  { key: "toilet", label: "Toilet Use", options: [[0, "Dependent"], [5, "Needs help"], [10, "Independent"]] },
  { key: "transfers", label: "Transfers", options: [[0, "Unable"], [5, "Major help"], [10, "Minor help"], [15, "Independent"]] },
  { key: "mobility", label: "Mobility", options: [[0, "Immobile"], [5, "Wheelchair"], [10, "Walks with help"], [15, "Independent"]] },
  { key: "stairs", label: "Stairs", options: [[0, "Unable"], [5, "Needs help"], [10, "Independent"]] }
];
function scoreBarthel(s) {
  const total = sumScores(s);
  let interpretation = "Independent";
  let riskLevel = "low";
  if (total <= 4) {
    interpretation = "Total Dependency";
    riskLevel = "very_high";
  } else if (total <= 8) {
    interpretation = "Severe Dependency";
    riskLevel = "high";
  } else if (total <= 11) {
    interpretation = "Moderate Dependency";
    riskLevel = "moderate";
  } else if (total <= 19) {
    interpretation = "Mild Dependency";
    riskLevel = "low";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const waterlowItems = [
  { key: "build", label: "Build / Weight for Height", options: [[0, "Average"], [1, "Above average"], [2, "Obese"], [3, "Below average"]] },
  { key: "skin", label: "Skin Type", options: [[0, "Healthy"], [1, "Tissue paper / dry"], [2, "Oedematous / clammy"], [3, "Discoloured / broken"]] },
  { key: "age", label: "Age", options: [[1, "14-49"], [2, "50-64"], [3, "65-74"], [4, "75-80"], [5, "81+"]] },
  { key: "sex", label: "Sex", options: [[1, "Male"], [2, "Female"]] },
  { key: "continence", label: "Continence", options: [[0, "Complete / catheterised"], [1, "Occasional incontinence"], [2, "Cath / incontinent faeces"], [3, "Doubly incontinent"]] },
  { key: "mobility", label: "Mobility", options: [[0, "Fully mobile"], [1, "Restless / fidgety"], [2, "Apathetic"], [3, "Restricted"], [4, "Bedbound / chairbound"], [5, "Inert / traction"]] },
  { key: "nutrition", label: "Nutrition / Appetite", options: [[0, "Average"], [1, "Poor"], [2, "NG tube / fluids only"], [3, "NBM / anorexic"]] },
  { key: "neuro", label: "Neurological Deficit", options: [[0, "None"], [4, "Diabetes / MS / CVA"], [5, "Motor / sensory"], [6, "Paraplegia"]] },
  { key: "specialRisk", label: "Special Risks (tissue malnutrition)", options: [[0, "None"], [5, "Smoking"], [8, "Cardiac failure / anaemia"], [8, "Terminal cachexia"]] },
  { key: "medication", label: "Medication", options: [[0, "None"], [4, "Steroids / cytotoxics / anti-inflammatory"]] }
];
function scoreWaterlow(s) {
  const total = sumScores(s);
  let interpretation = "Low Risk";
  let riskLevel = "low";
  if (total >= 20) {
    interpretation = "Very High Risk";
    riskLevel = "very_high";
  } else if (total >= 15) {
    interpretation = "High Risk";
    riskLevel = "high";
  } else if (total >= 10) {
    interpretation = "At Risk";
    riskLevel = "moderate";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const abbeyItems = [
  { key: "vocalisation", label: "Vocalisation (whimpering, groaning, crying)" },
  { key: "facial", label: "Facial Expression (tense, frowning, grimacing)" },
  { key: "bodyLanguage", label: "Body Language (fidgeting, rocking, guarding)" },
  { key: "behavioural", label: "Behavioural Change (confusion, refusing food)" },
  { key: "physiological", label: "Physiological Change (temp, pulse, BP)" },
  { key: "physical", label: "Physical Change (skin tears, contractures)" }
];
const abbeyScale = [[0, "Absent"], [1, "Mild"], [2, "Moderate"], [3, "Severe"]];
function scoreAbbey(s) {
  const total = sumScores(s);
  let interpretation = "No Pain";
  let riskLevel = "low";
  if (total >= 14) {
    interpretation = "Severe Pain";
    riskLevel = "very_high";
  } else if (total >= 8) {
    interpretation = "Moderate Pain";
    riskLevel = "high";
  } else if (total >= 3) {
    interpretation = "Mild Pain";
    riskLevel = "moderate";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const mnaItems = [
  { key: "foodIntake", label: "Food intake decline (3 months)", options: [[0, "Severe"], [1, "Moderate"], [2, "No decline"]] },
  { key: "weightLoss", label: "Weight loss (3 months)", options: [[0, ">3 kg"], [1, "Unknown"], [2, "1–3 kg"], [3, "No loss"]] },
  { key: "mobility", label: "Mobility", options: [[0, "Bed/chair bound"], [1, "Out of bed but no outings"], [2, "Goes out"]] },
  { key: "stress", label: "Psychological stress / acute disease", options: [[0, "Yes"], [2, "No"]] },
  { key: "neuro", label: "Neuropsychological problems", options: [[0, "Severe dementia/depression"], [1, "Mild dementia"], [2, "None"]] },
  { key: "bmi", label: "BMI", options: [[0, "<19"], [1, "19–<21"], [2, "21–<23"], [3, "≥23"]] }
];
function scoreMNA(s) {
  const total = sumScores(s);
  let interpretation = "Normal nutritional status";
  let riskLevel = "low";
  if (total < 17) {
    interpretation = "Malnourished";
    riskLevel = "very_high";
  } else if (total <= 23.5) {
    interpretation = "At risk of malnutrition";
    riskLevel = "high";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const nortonItems = [
  { key: "physical", label: "Physical Condition", options: [[1, "Very bad"], [2, "Poor"], [3, "Fair"], [4, "Good"]] },
  { key: "mental", label: "Mental State", options: [[1, "Stuporous"], [2, "Confused"], [3, "Apathetic"], [4, "Alert"]] },
  { key: "activity", label: "Activity", options: [[1, "Bedfast"], [2, "Chairfast"], [3, "Walks with help"], [4, "Ambulant"]] },
  { key: "mobility", label: "Mobility", options: [[1, "Immobile"], [2, "Very limited"], [3, "Slightly limited"], [4, "Full"]] },
  { key: "incontinence", label: "Incontinence", options: [[1, "Doubly incontinent"], [2, "Usually urinary"], [3, "Occasional"], [4, "Continent"]] }
];
function scoreNorton(s) {
  const total = sumScores(s);
  let interpretation = "Low risk";
  let riskLevel = "low";
  if (total <= 12) {
    interpretation = "Very high risk";
    riskLevel = "very_high";
  } else if (total <= 14) {
    interpretation = "High risk";
    riskLevel = "high";
  } else if (total <= 17) {
    interpretation = "Medium risk";
    riskLevel = "moderate";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const nutritionItems = [
  { key: "weightTrend", label: "Weight trend (3 months)", options: [[0, "Stable / gaining"], [1, "Minor loss"], [2, "Moderate loss"], [3, "Significant loss"]] },
  { key: "bmi", label: "BMI", options: [[0, "≥23"], [1, "21–<23"], [2, "19–<21"], [3, "<19"]] },
  { key: "diet", label: "Diet texture", options: [[0, "Normal"], [1, "Soft"], [2, "Pureed"], [3, "NBM"]] },
  { key: "fluidIntake", label: "Fluid intake", options: [[0, "Adequate"], [1, "Moderate"], [2, "Poor"], [3, "Very poor"]] },
  { key: "swallowing", label: "Swallowing", options: [[0, "No difficulty"], [1, "Mild"], [2, "Moderate"], [3, "Severe / SLT"]] },
  { key: "preferences", label: "Food preferences honoured", options: [[0, "Yes"], [1, "Partially"], [2, "No"]] }
];
function scoreNutrition(s) {
  const total = sumScores(s);
  let interpretation = "Adequate nutrition";
  let riskLevel = "low";
  if (total >= 12) {
    interpretation = "Critical — dietitian referral";
    riskLevel = "very_high";
  } else if (total >= 8) {
    interpretation = "High nutritional risk";
    riskLevel = "high";
  } else if (total >= 4) {
    interpretation = "Moderate nutritional risk";
    riskLevel = "moderate";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const pinchMeItems = [
  { key: "pain", label: "Pain" },
  { key: "infection", label: "Infection" },
  { key: "nutrition", label: "Nutrition" },
  { key: "constipation", label: "Constipation" },
  { key: "hydration", label: "Hydration" },
  { key: "medication", label: "Medication" },
  { key: "environment", label: "Environment" }
];
const pinchMeScale = [[0, "No concern"], [1, "Possible"], [2, "Likely"], [3, "Confirmed"]];
function scorePinchMe(s) {
  const total = sumScores(s);
  let interpretation = "Stable";
  let riskLevel = "low";
  if (total >= 12) {
    interpretation = "Acute deterioration — escalate";
    riskLevel = "very_high";
  } else if (total >= 7) {
    interpretation = "Significant concerns";
    riskLevel = "high";
  } else if (total >= 3) {
    interpretation = "Monitor closely";
    riskLevel = "moderate";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const mmseItems = [
  { key: "orientationTime", label: "Orientation to Time (year, season, date, day, month)", options: [[0, "0/5"], [1, "1/5"], [2, "2/5"], [3, "3/5"], [4, "4/5"], [5, "5/5"]] },
  { key: "orientationPlace", label: "Orientation to Place (country, county, town, building, floor)", options: [[0, "0/5"], [1, "1/5"], [2, "2/5"], [3, "3/5"], [4, "4/5"], [5, "5/5"]] },
  { key: "registration", label: "Registration (3 objects)", options: [[0, "0/3"], [1, "1/3"], [2, "2/3"], [3, "3/3"]] },
  { key: "attention", label: "Attention/Calculation (serial 7s or WORLD backwards)", options: [[0, "0/5"], [1, "1/5"], [2, "2/5"], [3, "3/5"], [4, "4/5"], [5, "5/5"]] },
  { key: "recall", label: "Recall (3 objects)", options: [[0, "0/3"], [1, "1/3"], [2, "2/3"], [3, "3/3"]] },
  { key: "naming", label: "Naming (pen, watch)", options: [[0, "0/2"], [1, "1/2"], [2, "2/2"]] },
  { key: "repetition", label: "Repetition (no ifs, ands, or buts)", options: [[0, "Unable"], [1, "Correct"]] },
  { key: "command", label: "3-stage command", options: [[0, "0/3"], [1, "1/3"], [2, "2/3"], [3, "3/3"]] },
  { key: "reading", label: "Reading & follow (close your eyes)", options: [[0, "Unable"], [1, "Correct"]] },
  { key: "writing", label: "Writing a sentence", options: [[0, "Unable"], [1, "Correct"]] },
  { key: "copying", label: "Copying design (intersecting pentagons)", options: [[0, "Unable"], [1, "Correct"]] }
];
function scoreMMSE(s) {
  const total = sumScores(s);
  let interpretation = "Normal cognitive function";
  let riskLevel = "low";
  if (total <= 9) {
    interpretation = "Severe cognitive impairment";
    riskLevel = "very_high";
  } else if (total <= 17) {
    interpretation = "Moderate cognitive impairment";
    riskLevel = "high";
  } else if (total <= 23) {
    interpretation = "Mild cognitive impairment";
    riskLevel = "moderate";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const fourATItems = [
  { key: "alertness", label: "Alertness", options: [[0, "Normal"], [4, "Abnormal (drowsy/agitated)"]] },
  { key: "amt4", label: "AMT4 (age, DOB, place, year)", options: [[0, "No mistakes"], [1, "1 mistake"], [2, "2+ mistakes / untestable"]] },
  { key: "attention", label: "Attention (months backwards from December)", options: [[0, "≥7 correct"], [1, "<7 / refuses"], [2, "Untestable"]] },
  { key: "acuteChange", label: "Acute change or fluctuating course", options: [[0, "No"], [4, "Yes"]] }
];
function scoreFourAT(s) {
  const total = sumScores(s);
  let interpretation = "Delirium unlikely";
  let riskLevel = "low";
  if (total >= 4) {
    interpretation = "Possible delirium ± cognitive impairment — urgent review";
    riskLevel = "very_high";
  } else if (total >= 1) {
    interpretation = "Possible cognitive impairment";
    riskLevel = "moderate";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const gds15Items = [
  { key: "q1", label: "Are you basically satisfied with your life?", inverted: true },
  { key: "q2", label: "Have you dropped many of your activities & interests?" },
  { key: "q3", label: "Do you feel your life is empty?" },
  { key: "q4", label: "Do you often get bored?" },
  { key: "q5", label: "Are you in good spirits most of the time?", inverted: true },
  { key: "q6", label: "Are you afraid something bad will happen to you?" },
  { key: "q7", label: "Do you feel happy most of the time?", inverted: true },
  { key: "q8", label: "Do you often feel helpless?" },
  { key: "q9", label: "Do you prefer to stay in rather than going out?" },
  { key: "q10", label: "Do you feel you have more memory problems than most?" },
  { key: "q11", label: "Do you think it's wonderful to be alive now?", inverted: true },
  { key: "q12", label: "Do you feel worthless the way you are now?" },
  { key: "q13", label: "Do you feel full of energy?", inverted: true },
  { key: "q14", label: "Do you feel your situation is hopeless?" },
  { key: "q15", label: "Do you think most people are better off than you?" }
];
function scoreGDS15(s) {
  const total = sumScores(s);
  let interpretation = "Normal";
  let riskLevel = "low";
  if (total >= 12) {
    interpretation = "Severe depression";
    riskLevel = "very_high";
  } else if (total >= 9) {
    interpretation = "Moderate depression";
    riskLevel = "high";
  } else if (total >= 5) {
    interpretation = "Mild depression";
    riskLevel = "moderate";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const cornellItems = [
  { key: "anxiety", label: "Anxiety (anxious expression, worrying)" },
  { key: "sadness", label: "Sadness (sad expression, tearfulness)" },
  { key: "lackReactivity", label: "Lack of reactivity to pleasant events" },
  { key: "irritability", label: "Irritability" },
  { key: "agitation", label: "Agitation (restlessness, hand-wringing)" },
  { key: "retardation", label: "Retardation (slow movement, speech, reaction)" },
  { key: "physicalComplaints", label: "Multiple physical complaints" },
  { key: "lossInterest", label: "Loss of interest in usual activities" },
  { key: "appetiteLoss", label: "Appetite loss" },
  { key: "weightLoss", label: "Weight loss" },
  { key: "lackEnergy", label: "Lack of energy" },
  { key: "diurnal", label: "Diurnal variation (worse in morning)" },
  { key: "earlyWaking", label: "Early-morning waking" },
  { key: "multipleAwakenings", label: "Multiple awakenings during sleep" },
  { key: "suicidal", label: "Suicidal ideation" },
  { key: "lowSelfEsteem", label: "Poor self-esteem" },
  { key: "pessimism", label: "Pessimism" },
  { key: "moodDelusions", label: "Mood-congruent delusions" }
];
const cornellScale = [[0, "Absent"], [1, "Mild/intermittent"], [2, "Severe"]];
function scoreCornell(s) {
  const total = sumScores(s);
  let interpretation = "No depression";
  let riskLevel = "low";
  if (total >= 13) {
    interpretation = "Definite depression";
    riskLevel = "very_high";
  } else if (total >= 8) {
    interpretation = "Probable depression";
    riskLevel = "high";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const mustItems = [
  { key: "bmi", label: "BMI score", options: [[0, ">20"], [1, "18.5–20"], [2, "<18.5"]] },
  { key: "weightLoss", label: "Unplanned weight loss in past 3–6 months", options: [[0, "<5%"], [1, "5–10%"], [2, ">10%"]] },
  { key: "acuteDisease", label: "Acutely ill & no nutritional intake >5 days", options: [[0, "No"], [2, "Yes"]] }
];
function scoreMUST(s) {
  const total = sumScores(s);
  let interpretation = "Low risk";
  let riskLevel = "low";
  if (total >= 2) {
    interpretation = "High risk — refer dietitian";
    riskLevel = "high";
  } else if (total === 1) {
    interpretation = "Medium risk — observe & document intake";
    riskLevel = "moderate";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const continenceItems = [
  { key: "urinary", label: "Urinary continence", options: [[0, "Continent"], [1, "Occasional"], [2, "Frequent"], [3, "Total"]] },
  { key: "bowel", label: "Bowel continence", options: [[0, "Continent"], [1, "Occasional"], [2, "Frequent"], [3, "Total"]] },
  { key: "frequency", label: "Frequency of episodes", options: [[0, "Rare"], [1, "Weekly"], [2, "Daily"], [3, "Multiple daily"]] },
  { key: "nocturia", label: "Nocturia", options: [[0, "None"], [1, "1x"], [2, "2x"], [3, "3+ per night"]] },
  { key: "skin", label: "Perineal skin condition", options: [[0, "Intact"], [1, "Reddened"], [2, "Excoriated"], [3, "Broken"]] },
  { key: "mobility", label: "Mobility impact on toileting", options: [[0, "Independent"], [1, "Supervised"], [2, "Assisted"], [3, "Dependent"]] },
  { key: "cognition", label: "Cognitive impact on toileting", options: [[0, "Intact"], [1, "Mild"], [2, "Moderate"], [3, "Severe"]] }
];
function scoreContinence(s) {
  const total = sumScores(s);
  let interpretation = "Continent / low risk";
  let riskLevel = "low";
  if (total >= 16) {
    interpretation = "Complex continence needs";
    riskLevel = "very_high";
  } else if (total >= 10) {
    interpretation = "High continence risk";
    riskLevel = "high";
  } else if (total >= 5) {
    interpretation = "Moderate continence risk";
    riskLevel = "moderate";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const painChartItems = [
  { key: "severity", label: "Pain severity (0–10)", options: Array.from({ length: 11 }, (_, i) => [i, String(i)]) },
  { key: "frequency", label: "Frequency", options: [[0, "Never"], [1, "Occasional"], [2, "Frequent"], [3, "Constant"]] },
  { key: "effectiveness", label: "Pain relief effectiveness", options: [[0, "Full relief"], [1, "Partial"], [2, "Minimal"], [3, "No relief"]] }
];
function scorePainChart(s) {
  const sev = s.severity || 0;
  const total = sev + (s.frequency || 0) + (s.effectiveness || 0);
  let interpretation = "Pain controlled";
  let riskLevel = "low";
  if (sev >= 7 || total >= 10) {
    interpretation = "Severe pain — escalate";
    riskLevel = "very_high";
  } else if (sev >= 4 || total >= 6) {
    interpretation = "Moderate pain";
    riskLevel = "high";
  } else if (sev >= 1) {
    interpretation = "Mild pain";
    riskLevel = "moderate";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const fallsItems = [
  { key: "history", label: "Previous fall in last 12 months", options: [[0, "No"], [3, "Yes"]] },
  { key: "medication", label: "Sedatives / antihypertensives / 4+ meds", options: [[0, "No"], [2, "Yes"]] },
  { key: "vision", label: "Visual impairment", options: [[0, "None"], [2, "Significant"]] },
  { key: "mobility", label: "Mobility/gait/balance impaired", options: [[0, "Stable"], [3, "Unsteady"]] },
  { key: "cognition", label: "Cognitive impairment", options: [[0, "None"], [2, "Yes"]] },
  { key: "continence", label: "Urinary urgency/incontinence", options: [[0, "No"], [2, "Yes"]] },
  { key: "footwear", label: "Inappropriate footwear/foot problems", options: [[0, "No"], [1, "Yes"]] },
  { key: "environment", label: "Environmental hazards", options: [[0, "None"], [2, "Present"]] }
];
function scoreFalls(s) {
  const total = sumScores(s);
  let interpretation = "Low falls risk";
  let riskLevel = "low";
  if (total >= 10) {
    interpretation = "Very high falls risk";
    riskLevel = "very_high";
  } else if (total >= 6) {
    interpretation = "High falls risk";
    riskLevel = "high";
  } else if (total >= 3) {
    interpretation = "Moderate falls risk";
    riskLevel = "moderate";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const absItems = [
  { key: "shortAttention", label: "Short attention span / distractibility" },
  { key: "impulsive", label: "Impulsive / impatient" },
  { key: "uncooperative", label: "Uncooperative / resistive to care" },
  { key: "violentSelf", label: "Violent/threatening to self" },
  { key: "violentOther", label: "Violent/threatening to others or property" },
  { key: "explosive", label: "Explosive/unpredictable anger" },
  { key: "rocking", label: "Rocking, rubbing, moaning, repetitive behaviour" },
  { key: "pulling", label: "Pulling at tubes/restraints" },
  { key: "wandering", label: "Wandering" },
  { key: "restless", label: "Restlessness, pacing, excessive movement" },
  { key: "repetitive", label: "Repetitive speech" },
  { key: "rapidSpeech", label: "Rapid, loud or excessive speech" },
  { key: "moodSwings", label: "Sudden mood changes" },
  { key: "crying", label: "Easily initiated / prolonged crying or laughing" }
];
const absScale = [[1, "Absent"], [2, "Slight"], [3, "Moderate"], [4, "Extreme"]];
function scoreABS(s) {
  const total = sumScores(s);
  let interpretation = "Normal";
  let riskLevel = "low";
  if (total >= 35) {
    interpretation = "Severe agitation";
    riskLevel = "very_high";
  } else if (total >= 28) {
    interpretation = "Moderate agitation";
    riskLevel = "high";
  } else if (total >= 22) {
    interpretation = "Mild agitation";
    riskLevel = "moderate";
  }
  return { totalScore: total, interpretation, riskLevel };
}
const abcItems = [
  { key: "severity", label: "Severity", options: [[1, "Mild"], [2, "Moderate"], [3, "Severe"], [4, "Critical"]] },
  { key: "duration", label: "Duration", options: [[1, "<5 min"], [2, "5–15 min"], [3, "15–60 min"], [4, ">60 min"]] }
];
function scoreABC(s) {
  const total = sumScores(s);
  let riskLevel = "low";
  let interpretation = "Recorded";
  if ((s.severity || 0) >= 3) {
    interpretation = "Significant behavioural episode";
    riskLevel = "high";
  }
  if ((s.severity || 0) === 4) {
    interpretation = "Critical behavioural episode";
    riskLevel = "very_high";
  }
  return { totalScore: total, interpretation, riskLevel };
}
function scoreAssessment(type, scores) {
  switch (type) {
    case "barthel":
      return scoreBarthel(scores);
    case "waterlow":
      return scoreWaterlow(scores);
    case "abbey_pain":
      return scoreAbbey(scores);
    case "mna":
      return scoreMNA(scores);
    case "norton":
      return scoreNorton(scores);
    case "nutrition":
      return scoreNutrition(scores);
    case "pinch_me":
      return scorePinchMe(scores);
    case "mmse":
      return scoreMMSE(scores);
    case "four_at":
      return scoreFourAT(scores);
    case "gds15":
      return scoreGDS15(scores);
    case "cornell":
      return scoreCornell(scores);
    case "must":
      return scoreMUST(scores);
    case "continence":
      return scoreContinence(scores);
    case "pain_chart":
      return scorePainChart(scores);
    case "falls":
      return scoreFalls(scores);
    case "abs":
      return scoreABS(scores);
    case "abc":
      return scoreABC(scores);
  }
}
const assessmentMeta = {
  barthel: { name: "Barthel Index", description: "Activities of daily living", category: "Functional", max: 100 },
  waterlow: { name: "Waterlow", description: "Pressure ulcer risk", category: "Skin", max: 60 },
  abbey_pain: { name: "Abbey Pain Scale", description: "Pain in non-verbal residents", category: "Pain", max: 18 },
  mna: { name: "MNA", description: "Mini Nutritional Assessment", category: "Nutrition", max: 14 },
  norton: { name: "Norton", description: "Pressure ulcer risk (Norton)", category: "Skin", max: 20 },
  nutrition: { name: "Nutrition Care Plan", description: "Composite nutritional review", category: "Nutrition" },
  pinch_me: { name: "PINCH ME", description: "Acute deterioration screen", category: "Clinical" },
  mmse: { name: "MMSE", description: "Mini-Mental State Examination", category: "Cognition", max: 30 },
  four_at: { name: "4AT", description: "Delirium screening", category: "Cognition", max: 12 },
  gds15: { name: "GDS-15", description: "Geriatric Depression Scale", category: "Mental Health", max: 15 },
  cornell: { name: "Cornell Scale", description: "Depression in dementia", category: "Mental Health", max: 38 },
  must: { name: "MUST", description: "Malnutrition Universal Screening Tool", category: "Nutrition", max: 6 },
  continence: { name: "Continence", description: "Urinary & bowel continence", category: "Continence" },
  pain_chart: { name: "Pain Chart", description: "0–10 pain monitoring", category: "Pain" },
  falls: { name: "Falls Risk", description: "Multifactorial falls assessment", category: "Safety" },
  abs: { name: "Agitated Behaviour Scale", description: "Behavioural agitation", category: "Behaviour", max: 56 },
  abc: { name: "ABC Tool", description: "Antecedent / Behaviour / Consequence log", category: "Behaviour" }
};
const assessmentItems = {
  barthel: barthelItems,
  waterlow: waterlowItems,
  abbey_pain: abbeyItems,
  mna: mnaItems,
  norton: nortonItems,
  nutrition: nutritionItems,
  pinch_me: pinchMeItems,
  mmse: mmseItems,
  four_at: fourATItems,
  gds15: gds15Items,
  cornell: cornellItems,
  must: mustItems,
  continence: continenceItems,
  pain_chart: painChartItems,
  falls: fallsItems,
  abs: absItems,
  abc: abcItems
};
function uniformScale(type) {
  if (type === "abbey_pain") return abbeyScale;
  if (type === "pinch_me") return pinchMeScale;
  if (type === "cornell") return cornellScale;
  if (type === "abs") return absScale;
  if (type === "gds15") return [[0, "No"], [1, "Yes"]];
  return null;
}
const BUILT_IN_TEMPLATES = [
  {
    id: "tpl-pressure",
    category: "Pressure Area Care",
    title: "Pressure Area Care Plan",
    problemStatement: "Resident is at risk of pressure ulcer development due to reduced mobility, continence and nutritional status.",
    identifiedNeeds: ["Pressure Relief", "Skin Monitoring", "Repositioning", "Nutrition Support"],
    smartGoals: [
      { title: "Maintain skin integrity", description: "Resident will remain free from new pressure damage for 30 days, evidenced by daily skin checks.", targetDays: 30, priority: "high" },
      { title: "Repositioning compliance", description: "Achieve 90%+ compliance with 2-hourly repositioning schedule.", targetDays: 14, priority: "high" }
    ],
    interventions: [
      { name: "Reposition 2-hourly", description: "Alternating left lateral, supine, right lateral. Document on turn chart.", frequency: "2 Hourly", assignedRole: "carer", priority: "high" },
      { name: "Daily skin inspection", description: "Full skin check at personal care. Photograph any concerns.", frequency: "Daily", assignedRole: "nurse", priority: "high" },
      { name: "Pressure-relieving mattress in use", description: "Confirm mattress setting matches weight and risk.", frequency: "Per Shift", assignedRole: "nurse", priority: "medium" },
      { name: "Nutrition & hydration support", description: "Encourage fluids and protein-rich meals.", frequency: "Daily", assignedRole: "carer", priority: "medium" }
    ],
    outcomeMeasures: [
      { name: "Waterlow Score", target: "Reduce by ≥2 at review" },
      { name: "Skin Integrity", target: "No new damage" }
    ],
    reviewFrequencyDays: 7,
    evaluationFrequencyDays: 14,
    builtIn: true
  },
  {
    id: "tpl-pain",
    category: "Pain Management",
    title: "Pain Management Care Plan",
    problemStatement: "Resident experiences pain that requires monitoring and structured analgesia management.",
    identifiedNeeds: ["Pain Management", "Comfort", "Monitoring"],
    smartGoals: [
      { title: "Reduce pain score", description: "Reduce Abbey Pain Scale to ≤3 within 7 days.", targetDays: 7, priority: "high" },
      { title: "Maintain comfort", description: "Resident reports/displays comfort during personal care episodes.", targetDays: 14, priority: "high" }
    ],
    interventions: [
      { name: "Administer prescribed analgesia", description: "Per MAR chart; document effect.", frequency: "4 Hourly", assignedRole: "nurse", priority: "high" },
      { name: "Reassess pain", description: "Use Abbey Pain Scale; record score & response.", frequency: "4 Hourly", assignedRole: "nurse", priority: "high" },
      { name: "Non-pharmacological comfort", description: "Repositioning, warmth, distraction, family presence.", frequency: "Per Shift", assignedRole: "carer", priority: "medium" },
      { name: "Escalate if uncontrolled", description: "Notify GP if pain remains ≥6 after two analgesic doses.", frequency: "Custom", assignedRole: "nurse", priority: "high" }
    ],
    outcomeMeasures: [
      { name: "Abbey Score", target: "≤3" },
      { name: "Pain Score (0–10)", target: "≤3" }
    ],
    reviewFrequencyDays: 5,
    evaluationFrequencyDays: 10,
    builtIn: true
  },
  {
    id: "tpl-falls",
    category: "Falls Prevention",
    title: "Falls Prevention Care Plan",
    problemStatement: "Resident is at high risk of falls due to impaired mobility, cognition and/or medication side effects.",
    identifiedNeeds: ["Mobility Assistance", "Safety Monitoring", "Environmental Safety"],
    smartGoals: [
      { title: "Zero unwitnessed falls", description: "No unwitnessed falls within next 30 days.", targetDays: 30, priority: "critical" },
      { title: "Safe transfers", description: "All transfers performed with documented technique.", targetDays: 14, priority: "high" }
    ],
    interventions: [
      { name: "Hourly safety rounds", description: "Check on resident; offer toilet, drink, reposition.", frequency: "Hourly", assignedRole: "carer", priority: "high" },
      { name: "Sensor mat in use", description: "Confirm mat operational at start of every shift.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
      { name: "Footwear & environment check", description: "Non-slip footwear; clear walkways; call bell in reach.", frequency: "Daily", assignedRole: "carer", priority: "medium" },
      { name: "Medication review", description: "Review sedating / hypotensive medications with GP.", frequency: "Monthly", assignedRole: "nurse", priority: "medium" }
    ],
    outcomeMeasures: [
      { name: "Falls Count (30 days)", target: "0" },
      { name: "Falls Risk Score", target: "<6" }
    ],
    reviewFrequencyDays: 7,
    evaluationFrequencyDays: 14,
    builtIn: true
  },
  {
    id: "tpl-nutrition",
    category: "Nutrition",
    title: "Nutrition Care Plan",
    problemStatement: "Resident is at risk of malnutrition based on weight loss and reduced oral intake.",
    identifiedNeeds: ["Nutrition Support", "Weight Monitoring"],
    smartGoals: [
      { title: "Stabilise weight", description: "Maintain or gain weight over next 4 weeks.", targetDays: 28, priority: "high" },
      { title: "Adequate intake", description: "Achieve ≥75% meal intake on 5 of 7 days.", targetDays: 14, priority: "high" }
    ],
    interventions: [
      { name: "Fortified diet", description: "Offer fortified meals + snacks; respect preferences.", frequency: "Daily", assignedRole: "carer", priority: "high" },
      { name: "Food & fluid chart", description: "Record every meal, snack and fluid intake.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
      { name: "Weekly weight", description: "Weigh same time, same scales, document.", frequency: "Weekly", assignedRole: "nurse", priority: "medium" },
      { name: "Dietitian referral", description: "Refer if MUST ≥2 or weight loss continues.", frequency: "Custom", assignedRole: "nurse", priority: "high" }
    ],
    outcomeMeasures: [
      { name: "Weight (kg)", target: "Stable or +" },
      { name: "MUST Score", target: "≤1" },
      { name: "BMI", target: "≥20" }
    ],
    reviewFrequencyDays: 14,
    evaluationFrequencyDays: 28,
    builtIn: true
  },
  {
    id: "tpl-hydration",
    category: "Hydration",
    title: "Hydration Care Plan",
    problemStatement: "Resident at risk of dehydration due to reduced oral fluid intake.",
    identifiedNeeds: ["Hydration Support", "Monitoring"],
    smartGoals: [
      { title: "Adequate fluids", description: "Achieve ≥1.5L oral intake daily for 7 consecutive days.", targetDays: 7, priority: "high" }
    ],
    interventions: [
      { name: "Offer fluids hourly", description: "Preferred drinks at reach; assist as needed.", frequency: "Hourly", assignedRole: "carer", priority: "high" },
      { name: "Fluid balance chart", description: "Document intake & output.", frequency: "Per Shift", assignedRole: "carer", priority: "high" }
    ],
    outcomeMeasures: [{ name: "Daily fluid intake (ml)", target: "≥1500" }],
    reviewFrequencyDays: 7,
    evaluationFrequencyDays: 14,
    builtIn: true
  },
  {
    id: "tpl-continence",
    category: "Continence",
    title: "Continence Care Plan",
    problemStatement: "Resident requires structured continence support to maintain dignity and skin integrity.",
    identifiedNeeds: ["Continence Support", "Skin Monitoring", "Toileting"],
    smartGoals: [
      { title: "Reduce episodes", description: "Reduce incontinence episodes by 50% within 4 weeks.", targetDays: 28, priority: "medium" },
      { title: "Skin intact", description: "Maintain intact perineal skin.", targetDays: 30, priority: "high" }
    ],
    interventions: [
      { name: "Scheduled toileting", description: "Offer toilet every 2 hours and after meals.", frequency: "2 Hourly", assignedRole: "carer", priority: "high" },
      { name: "Barrier cream", description: "Apply at every pad change.", frequency: "Per Shift", assignedRole: "carer", priority: "medium" },
      { name: "Continence product fit check", description: "Confirm correct product & size weekly.", frequency: "Weekly", assignedRole: "nurse", priority: "medium" }
    ],
    outcomeMeasures: [
      { name: "Continence Episodes/day", target: "≤2" },
      { name: "Skin Integrity", target: "Intact" }
    ],
    reviewFrequencyDays: 14,
    evaluationFrequencyDays: 28,
    builtIn: true
  },
  {
    id: "tpl-behaviour",
    category: "Behaviour Support",
    title: "Behaviour Support Plan",
    problemStatement: "Resident displays behaviours of distress that require structured, person-centred support.",
    identifiedNeeds: ["Behaviour Support", "Communication Support", "Safety Monitoring"],
    smartGoals: [
      { title: "Reduce distress episodes", description: "Reduce severe ABS episodes by 50% within 4 weeks.", targetDays: 28, priority: "high" }
    ],
    interventions: [
      { name: "Identify triggers", description: "Use ABC chart for every episode.", frequency: "Custom", assignedRole: "carer", priority: "high" },
      { name: "Person-centred distraction", description: "Use 'A Key To Me' preferred items / music / reminiscence.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
      { name: "MDT review", description: "Discuss at next MDT; consider psychiatry referral.", frequency: "Monthly", assignedRole: "nurse", priority: "medium" }
    ],
    outcomeMeasures: [
      { name: "ABS Score", target: "<22" },
      { name: "Behaviour Frequency", target: "↓" }
    ],
    reviewFrequencyDays: 14,
    evaluationFrequencyDays: 28,
    builtIn: true
  },
  {
    id: "tpl-mental-health",
    category: "Mental Health",
    title: "Mental Health Support Plan",
    problemStatement: "Resident shows symptoms of low mood / depression requiring monitoring and support.",
    identifiedNeeds: ["Mental Health", "Social Engagement"],
    smartGoals: [
      { title: "Improve mood", description: "GDS-15 reduced by ≥3 points over 4 weeks.", targetDays: 28, priority: "medium" }
    ],
    interventions: [
      { name: "1:1 supportive conversation", description: "Daily check-in by named carer.", frequency: "Daily", assignedRole: "carer", priority: "medium" },
      { name: "Activity participation", description: "Encourage 2+ meaningful activities per week.", frequency: "Weekly", assignedRole: "carer", priority: "medium" },
      { name: "GP review", description: "If GDS-15 ≥9 escalate to GP.", frequency: "Custom", assignedRole: "nurse", priority: "high" }
    ],
    outcomeMeasures: [{ name: "GDS-15 Score", target: "<5" }],
    reviewFrequencyDays: 14,
    evaluationFrequencyDays: 28,
    builtIn: true
  },
  {
    id: "tpl-dementia",
    category: "Dementia Care",
    title: "Dementia Care Plan",
    problemStatement: "Resident has cognitive impairment requiring person-centred dementia care.",
    identifiedNeeds: ["Cognitive Support", "Communication Support", "Safety Monitoring"],
    smartGoals: [
      { title: "Maintain orientation", description: "Use reality orientation cues; resident calm at handovers.", targetDays: 28, priority: "medium" }
    ],
    interventions: [
      { name: "Consistent staff allocation", description: "Named carer leads personal care where possible.", frequency: "Daily", assignedRole: "carer", priority: "high" },
      { name: "Reminiscence & sensory activities", description: "Use 'A Key To Me' preferences.", frequency: "Daily", assignedRole: "carer", priority: "medium" },
      { name: "Cognitive reassessment", description: "Repeat MMSE / 4AT at review.", frequency: "Monthly", assignedRole: "nurse", priority: "medium" }
    ],
    outcomeMeasures: [{ name: "MMSE Score", target: "Stable" }, { name: "4AT", target: "<4" }],
    reviewFrequencyDays: 28,
    evaluationFrequencyDays: 56,
    builtIn: true
  },
  {
    id: "tpl-communication",
    category: "Communication",
    title: "Communication Support Plan",
    problemStatement: "Resident has communication needs that require structured support to maintain dignity and choice.",
    identifiedNeeds: ["Communication Support"],
    smartGoals: [{ title: "Effective communication", description: "Resident expresses needs/choices at every personal care episode.", targetDays: 14, priority: "medium" }],
    interventions: [
      { name: "Use preferred communication method", description: "Hearing aid in/checked; large print; pictures.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
      { name: "Speak slowly, offer choices", description: "Allow processing time.", frequency: "Daily", assignedRole: "carer", priority: "medium" }
    ],
    outcomeMeasures: [{ name: "Communication effectiveness", target: "Resident responds appropriately" }],
    reviewFrequencyDays: 28,
    evaluationFrequencyDays: 56,
    builtIn: true
  },
  {
    id: "tpl-mobility",
    category: "Mobility",
    title: "Mobility Care Plan",
    problemStatement: "Resident requires structured mobility support to maintain function and prevent deterioration.",
    identifiedNeeds: ["Mobility Assistance", "Falls Prevention"],
    smartGoals: [{ title: "Maintain mobility", description: "Resident continues current level of mobility for 4 weeks.", targetDays: 28, priority: "medium" }],
    interventions: [
      { name: "Walking practice", description: "Walk to dining room with 1 assist twice daily.", frequency: "Twice Daily", assignedRole: "carer", priority: "medium" },
      { name: "Physiotherapy programme", description: "Per physio recommendations.", frequency: "Weekly", assignedRole: "nurse", priority: "medium" }
    ],
    outcomeMeasures: [{ name: "Barthel Score", target: "Stable or +" }],
    reviewFrequencyDays: 28,
    evaluationFrequencyDays: 56,
    builtIn: true
  },
  {
    id: "tpl-transfer",
    category: "Transfer Assistance",
    title: "Safe Transfer Plan",
    problemStatement: "Resident requires assistance with transfers; safe technique required to prevent injury.",
    identifiedNeeds: ["Transfer Assistance", "Safety Monitoring"],
    smartGoals: [{ title: "Safe transfers", description: "All transfers performed with hoist/2-assist as prescribed.", targetDays: 14, priority: "high" }],
    interventions: [
      { name: "2-assist transfers with hoist", description: "Full sling check before each use.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
      { name: "Manual handling review", description: "Reassess if condition changes.", frequency: "Monthly", assignedRole: "nurse", priority: "medium" }
    ],
    outcomeMeasures: [{ name: "Transfer incidents", target: "0" }],
    reviewFrequencyDays: 14,
    evaluationFrequencyDays: 28,
    builtIn: true
  },
  {
    id: "tpl-wheelchair",
    category: "Wheelchair Safety",
    title: "Wheelchair Safety Plan",
    problemStatement: "Resident uses a wheelchair and requires safety assessment to prevent injury and pressure damage.",
    identifiedNeeds: ["Wheelchair Safety", "Pressure Relief"],
    smartGoals: [{ title: "Safe wheelchair use", description: "No wheelchair-related incidents over 4 weeks.", targetDays: 28, priority: "high" }],
    interventions: [
      { name: "Cushion in use & in date", description: "Check pressure-relief cushion at start of every shift.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
      { name: "Brake & footplate check", description: "Confirm before every transfer.", frequency: "Per Shift", assignedRole: "carer", priority: "high" }
    ],
    outcomeMeasures: [{ name: "Wheelchair incidents", target: "0" }],
    reviewFrequencyDays: 28,
    evaluationFrequencyDays: 56,
    builtIn: true
  },
  {
    id: "tpl-bedrail",
    category: "Bed Rail Safety",
    title: "Bed Rail Safety Plan",
    problemStatement: "Bed rails in use; risk/benefit assessment required to ensure safe usage.",
    identifiedNeeds: ["Bed Rail Safety", "Safety Monitoring"],
    smartGoals: [{ title: "Safe rail usage", description: "Bed rails reviewed weekly; no entrapment incidents.", targetDays: 28, priority: "high" }],
    interventions: [
      { name: "Visual rail check", description: "Confirm bumpers in place; gaps within tolerance.", frequency: "Per Shift", assignedRole: "carer", priority: "high" },
      { name: "Documented consent / best-interest", description: "Reaffirm at every review.", frequency: "Monthly", assignedRole: "nurse", priority: "high" }
    ],
    outcomeMeasures: [{ name: "Entrapment incidents", target: "0" }],
    reviewFrequencyDays: 28,
    evaluationFrequencyDays: 56,
    builtIn: true
  },
  {
    id: "tpl-peep",
    category: "PEEP",
    title: "Personal Emergency Evacuation Plan",
    problemStatement: "Resident requires individual evacuation plan in event of fire/emergency.",
    identifiedNeeds: ["Safety Monitoring"],
    smartGoals: [{ title: "Plan readiness", description: "PEEP rehearsed and known to all staff on shift.", targetDays: 14, priority: "critical" }],
    interventions: [
      { name: "Display PEEP at handover", description: "Refer to PEEP poster at every shift start.", frequency: "Per Shift", assignedRole: "nurse", priority: "high" },
      { name: "Annual rehearsal", description: "Practice evacuation route with resident.", frequency: "Custom", assignedRole: "cnm", priority: "high" }
    ],
    outcomeMeasures: [{ name: "Drill completion", target: "Annual" }],
    reviewFrequencyDays: 90,
    evaluationFrequencyDays: 180,
    builtIn: true
  },
  {
    id: "tpl-eol",
    category: "End Of Life",
    title: "End of Life Care Plan",
    problemStatement: "Resident is in the last days/weeks of life; comfort and dignity are the priority.",
    identifiedNeeds: ["Pain Management", "Comfort", "Family Communication", "Spiritual Support"],
    smartGoals: [
      { title: "Comfortable, dignified death", description: "Resident remains comfortable; family well-supported.", targetDays: 30, priority: "critical" }
    ],
    interventions: [
      { name: "Anticipatory medications available", description: "Confirm in MAR & stock; review daily.", frequency: "Daily", assignedRole: "nurse", priority: "critical" },
      { name: "Mouth & pressure care", description: "2-hourly mouth care; gentle repositioning.", frequency: "2 Hourly", assignedRole: "carer", priority: "high" },
      { name: "Family present & supported", description: "Open visiting; offer chaplain & refreshments.", frequency: "Daily", assignedRole: "carer", priority: "high" }
    ],
    outcomeMeasures: [{ name: "Comfort", target: "Resident appears comfortable" }],
    reviewFrequencyDays: 1,
    evaluationFrequencyDays: 3,
    builtIn: true
  },
  {
    id: "tpl-post-fall",
    category: "Post Fall Monitoring",
    title: "Post-Fall Monitoring Plan",
    problemStatement: "Resident has recently fallen; structured monitoring required to detect deterioration.",
    identifiedNeeds: ["Safety Monitoring", "Neurological Observation"],
    smartGoals: [{ title: "Detect deterioration early", description: "Neuro obs completed per schedule; any change escalated immediately.", targetDays: 3, priority: "high" }],
    interventions: [
      { name: "Neurological observations", description: "GCS / pupils / limb power.", frequency: "Hourly", assignedRole: "nurse", priority: "high" },
      { name: "Pain & mobility review", description: "Assess for occult injury at every shift.", frequency: "Per Shift", assignedRole: "nurse", priority: "high" }
    ],
    outcomeMeasures: [{ name: "GCS", target: "Stable" }],
    reviewFrequencyDays: 3,
    evaluationFrequencyDays: 7,
    builtIn: true
  },
  {
    id: "tpl-skin",
    category: "Skin Integrity",
    title: "Skin Integrity Care Plan",
    problemStatement: "Resident has compromised skin integrity requiring active wound and skin management.",
    identifiedNeeds: ["Skin Monitoring", "Wound Care"],
    smartGoals: [{ title: "Heal / prevent progression", description: "Wound shows healing trend at weekly review.", targetDays: 28, priority: "high" }],
    interventions: [
      { name: "Wound dressing per regime", description: "As per TVN/dressing plan; photograph weekly.", frequency: "Custom", assignedRole: "nurse", priority: "high" },
      { name: "Skin inspection", description: "Daily inspection; document.", frequency: "Daily", assignedRole: "nurse", priority: "high" }
    ],
    outcomeMeasures: [{ name: "Wound size (cm)", target: "↓" }, { name: "Tissue type", target: "Granulating" }],
    reviewFrequencyDays: 7,
    evaluationFrequencyDays: 14,
    builtIn: true
  }
];
function suggestTemplatesFor(type, riskLevel) {
  const highRisk = riskLevel === "high" || riskLevel === "very_high";
  const moderatePlus = highRisk || riskLevel === "moderate";
  switch (type) {
    case "waterlow":
    case "norton":
      return highRisk ? ["tpl-pressure", "tpl-skin"] : moderatePlus ? ["tpl-pressure"] : [];
    case "abbey_pain":
    case "pain_chart":
      return moderatePlus ? ["tpl-pain"] : [];
    case "must":
    case "mna":
    case "nutrition":
      return highRisk ? ["tpl-nutrition", "tpl-hydration"] : moderatePlus ? ["tpl-nutrition"] : [];
    case "falls":
      return highRisk ? ["tpl-falls", "tpl-post-fall"] : moderatePlus ? ["tpl-falls"] : [];
    case "mmse":
    case "four_at":
      return moderatePlus ? ["tpl-dementia", "tpl-communication"] : [];
    case "continence":
      return moderatePlus ? ["tpl-continence", "tpl-skin"] : [];
    case "abs":
    case "abc":
      return moderatePlus ? ["tpl-behaviour"] : [];
    case "gds15":
    case "cornell":
      return moderatePlus ? ["tpl-mental-health"] : [];
    case "barthel":
      return highRisk ? ["tpl-mobility", "tpl-transfer"] : [];
    default:
      return [];
  }
}
let _seq = 0;
const uid$1 = (p) => `${p}-${(++_seq).toString(36).padStart(5, "0")}`;
const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const CATEGORY_LABELS = {
  pressure: "Pressure / Skin Integrity",
  falls: "Falls Risk",
  nutrition: "Nutrition",
  pain: "Pain Management",
  behaviour: "Behaviour",
  continence: "Continence",
  mobility: "Mobility",
  cognition: "Cognition",
  communication: "Communication",
  personal_care: "Personal Care",
  mental_health: "Mental Health",
  social: "Social / Wellbeing",
  sleep: "Sleep",
  medication: "Medication",
  end_of_life: "End of Life",
  skin: "Skin",
  safeguarding: "Safeguarding",
  custom: "Other"
};
const RISK_COLORS = {
  none: "bg-muted text-muted-foreground border-border",
  low: "bg-success/10 text-success border-success/20",
  moderate: "bg-info/10 text-info border-info/20",
  high: "bg-warning/15 text-warning-foreground border-warning/40",
  very_high: "bg-destructive/10 text-destructive border-destructive/30",
  resolved: "bg-success/15 text-success border-success/30"
};
const PREDEFINED_GOALS = {
  pressure: ["Maintain skin integrity", "Prevent pressure ulcer development", "Improve repositioning compliance", "Monitor existing redness"],
  falls: ["Remain free from falls", "Reduce falls risk factors", "Improve safe transfers"],
  nutrition: ["Maintain adequate nutrition", "Prevent weight loss", "Achieve target oral intake"],
  pain: ["Maintain pain score within acceptable limits", "Improve comfort during care"],
  behaviour: ["Reduce frequency of distress behaviours", "Identify and reduce triggers"],
  continence: ["Maintain dignity in continence care", "Reduce episodes of incontinence"],
  mobility: ["Maintain safe mobility", "Improve transfer independence"],
  cognition: ["Optimise orientation and engagement"],
  communication: ["Support effective communication"],
  personal_care: ["Maintain personal hygiene to resident's preference"],
  mental_health: ["Support mental wellbeing", "Reduce low mood episodes"],
  social: ["Engage in meaningful social activity"],
  sleep: ["Improve sleep quality"],
  medication: ["Safe medication administration"],
  end_of_life: ["Maintain comfort and dignity", "Honour advance care wishes"],
  skin: ["Maintain skin integrity"],
  safeguarding: ["Ensure resident is safe from harm"],
  custom: []
};
function suggestionsForAssessment(a) {
  const out = [];
  const base = { assessmentId: a.id, residentId: a.residentId, assessmentType: a.type };
  switch (a.type) {
    case "waterlow":
      if (a.riskLevel === "high" || a.riskLevel === "very_high") {
        out.push({ ...base, category: "pressure", problemStatement: `Resident is at ${a.interpretation.toLowerCase()} of pressure ulcer development (Waterlow ${a.totalScore}).`, riskLevel: a.riskLevel });
      }
      break;
    case "must":
    case "mna":
    case "nutrition":
      if (a.riskLevel === "moderate" || a.riskLevel === "high" || a.riskLevel === "very_high") {
        out.push({ ...base, category: "nutrition", problemStatement: `Resident is at risk of malnutrition (${a.type.toUpperCase()} score ${a.totalScore}).`, riskLevel: a.riskLevel });
      }
      break;
    case "falls":
      if (a.riskLevel === "high" || a.riskLevel === "very_high" || a.riskLevel === "moderate") {
        out.push({ ...base, category: "falls", problemStatement: `Resident is at increased risk of falls (Falls assessment ${a.interpretation}).`, riskLevel: a.riskLevel });
      }
      break;
    case "abbey_pain":
    case "pain_chart":
      if (a.totalScore >= 8) {
        out.push({ ...base, category: "pain", problemStatement: `Resident is experiencing pain requiring active management (Abbey Pain ${a.totalScore}).`, riskLevel: a.totalScore >= 14 ? "very_high" : "high" });
      }
      break;
    case "cornell":
    case "gds15":
      if (a.riskLevel === "high" || a.riskLevel === "very_high") {
        out.push({ ...base, category: "mental_health", problemStatement: `Resident shows signs of depression / low mood (${a.type.toUpperCase()} ${a.totalScore}).`, riskLevel: a.riskLevel });
      }
      break;
    case "four_at":
    case "mmse":
      if (a.riskLevel === "high" || a.riskLevel === "very_high" || a.riskLevel === "moderate") {
        out.push({ ...base, category: "cognition", problemStatement: `Cognitive impairment identified (${a.type.toUpperCase()} ${a.totalScore}).`, riskLevel: a.riskLevel });
      }
      break;
    case "continence":
      if (a.riskLevel !== "none" && a.riskLevel !== "low") {
        out.push({ ...base, category: "continence", problemStatement: `Continence support required (${a.interpretation}).`, riskLevel: a.riskLevel });
      }
      break;
    case "barthel":
      if (a.totalScore < 60) {
        out.push({ ...base, category: "mobility", problemStatement: `Reduced functional independence — high dependency for personal care (Barthel ${a.totalScore}).`, riskLevel: a.totalScore < 40 ? "high" : "moderate" });
      }
      break;
    case "abc":
    case "abs":
      out.push({ ...base, category: "behaviour", problemStatement: `Behavioural support required.`, riskLevel: "moderate" });
      break;
  }
  return out;
}
function parseFrequency(s) {
  if (!s) return { type: "daily" };
  const t = s.toLowerCase().trim();
  let m = t.match(/every\s+(\d+)\s*hour/);
  if (m) return { type: "hourly", value: +m[1], instructions: s };
  m = t.match(/(\d+)\s*-?\s*hourly/);
  if (m) return { type: "hourly", value: +m[1], instructions: s };
  if (/prn|as required|as needed/.test(t)) return { type: "prn", instructions: s };
  if (/weekly|every week|once a week/.test(t)) return { type: "weekly", value: 1, instructions: s };
  if (/monthly|every month/.test(t)) return { type: "monthly", value: 1, instructions: s };
  m = t.match(/(\d+)\s*(?:x|times)\s*(?:per\s*)?day|(?:twice|three|four)\s+daily/);
  if (m) {
    const n = m[1] ? +m[1] : t.includes("twice") ? 2 : t.includes("three") ? 3 : 4;
    return { type: "daily", value: n, instructions: s };
  }
  if (/daily|each day/.test(t)) return { type: "daily", value: 1, instructions: s };
  return { type: "custom", instructions: s };
}
function frequencyLabel(type, value, instructions) {
  if (instructions && type === "custom") return instructions;
  if (type === "hourly") return value && value > 1 ? `Every ${value} hours` : "Hourly";
  if (type === "daily") return !value || value === 1 ? "Daily" : `${value}× daily`;
  if (type === "weekly") return value && value > 1 ? `Every ${value} weeks` : "Weekly";
  if (type === "monthly") return value && value > 1 ? `Every ${value} months` : "Monthly";
  if (type === "prn") return "PRN (as needed)";
  return instructions || "Custom schedule";
}
function inferCategory(titleOrCat) {
  const s = (titleOrCat || "").toLowerCase();
  if (/pressure|skin|waterlow/.test(s)) return "pressure";
  if (/fall/.test(s)) return "falls";
  if (/nutrition|weight|must|mna|food/.test(s)) return "nutrition";
  if (/pain/.test(s)) return "pain";
  if (/behav|distress|agitat/.test(s)) return "behaviour";
  if (/contin|bowel|bladder/.test(s)) return "continence";
  if (/mobil|transfer/.test(s)) return "mobility";
  if (/cogn|dement|memory/.test(s)) return "cognition";
  if (/communic/.test(s)) return "communication";
  if (/personal care|hygiene|wash/.test(s)) return "personal_care";
  if (/depress|mood|anxi|mental/.test(s)) return "mental_health";
  if (/social|engag/.test(s)) return "social";
  if (/sleep/.test(s)) return "sleep";
  if (/medic/.test(s)) return "medication";
  if (/end of life|palliat/.test(s)) return "end_of_life";
  if (/safeguard/.test(s)) return "safeguarding";
  return "custom";
}
function priorityToRisk(p) {
  if (p === "critical") return "very_high";
  if (p === "high") return "high";
  if (p === "medium") return "moderate";
  if (p === "low") return "low";
  return "moderate";
}
function migrateLegacy(legacyPlans, legacyEvaluations, legacyReviews, legacyLogs, systemUser = "System (migration)") {
  const residentCarePlans = [];
  const carePlanProblems = [];
  const problemGoals = [];
  const problemInterventions = [];
  const problemEvaluations = [];
  const problemReviews = [];
  const problemInterventionLogs = [];
  const problemHistory = [];
  const legacyCarePlanIdToProblemId = {};
  const residentToPlanId = /* @__PURE__ */ new Map();
  for (const plan of legacyPlans) {
    let rcpId = residentToPlanId.get(plan.residentId);
    if (!rcpId) {
      rcpId = uid$1("rcp");
      residentToPlanId.set(plan.residentId, rcpId);
      residentCarePlans.push({
        id: rcpId,
        residentId: plan.residentId,
        status: "active",
        createdAt: plan.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        createdBy: plan.createdBy || systemUser
      });
    }
    const problemId = uid$1("prob");
    legacyCarePlanIdToProblemId[plan.id] = problemId;
    const isActive = plan.status === "active" || plan.status === "draft" || plan.status === "review_due" || plan.status === "evaluation_due";
    const problem = {
      id: problemId,
      residentCarePlanId: rcpId,
      residentId: plan.residentId,
      category: inferCategory(plan.category || plan.title),
      problemStatement: plan.problemStatement || plan.problem || plan.title,
      riskLevel: priorityToRisk(plan.priority),
      sourceAssessmentId: plan.linkedAssessmentId,
      sourceAssessmentType: plan.assessmentScoreSnapshot?.type,
      createdBy: plan.createdBy || systemUser,
      createdAt: plan.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      evaluationDate: plan.evaluationDate || inDays(14),
      reviewDate: plan.reviewDate || inDays(30),
      status: isActive ? "active" : plan.status === "completed" ? "resolved" : "archived",
      resolvedAt: plan.status === "completed" ? plan.updatedAt : void 0,
      resolvedBy: plan.status === "completed" ? plan.updatedBy : void 0
    };
    carePlanProblems.push(problem);
    if (plan.goals && plan.goals.length) {
      for (const g of plan.goals) {
        problemGoals.push({
          id: uid$1("goal"),
          problemId,
          statement: g.title,
          targetDate: g.targetDate,
          status: g.status === "achieved" ? "achieved" : g.status === "partially_achieved" ? "partially_achieved" : g.status === "not_achieved" ? "not_achieved" : g.status === "discontinued" ? "discontinued" : "active",
          createdAt: problem.createdAt,
          createdBy: problem.createdBy
        });
      }
    } else if (plan.goal) {
      problemGoals.push({
        id: uid$1("goal"),
        problemId,
        statement: plan.goal,
        status: "active",
        createdAt: problem.createdAt,
        createdBy: problem.createdBy
      });
    }
    if (plan.interventionsSpec && plan.interventionsSpec.length) {
      for (const it of plan.interventionsSpec) {
        const f = parseFrequency(it.frequency);
        problemInterventions.push({
          id: uid$1("int"),
          problemId,
          residentId: plan.residentId,
          name: it.name,
          description: it.description,
          frequencyType: f.type,
          frequencyValue: f.value,
          frequencyInstructions: f.instructions,
          assignedRole: it.assignedRole,
          assignedStaffName: it.assignedUser,
          status: it.status === "cancelled" ? "discontinued" : "active",
          createdAt: problem.createdAt,
          createdBy: problem.createdBy
        });
      }
    } else if (plan.interventions && plan.interventions.length) {
      for (const name of plan.interventions) {
        const f = parseFrequency(plan.frequency);
        problemInterventions.push({
          id: uid$1("int"),
          problemId,
          residentId: plan.residentId,
          name,
          frequencyType: f.type,
          frequencyValue: f.value,
          frequencyInstructions: f.instructions,
          status: "active",
          createdAt: problem.createdAt,
          createdBy: problem.createdBy
        });
      }
    }
    for (const e of legacyEvaluations.filter((x) => x.carePlanId === plan.id)) {
      problemEvaluations.push({
        id: uid$1("eval"),
        problemId,
        date: e.date,
        evaluatorId: "legacy",
        evaluatorName: e.evaluatedBy,
        role: e.role || "nurse",
        summary: e.summary,
        goalsMet: e.goalsMet === "yes" ? "yes" : e.goalsMet === "no" ? "no" : "partial",
        progress: e.outcomeRating === "excellent" || e.outcomeRating === "good" ? "improved" : e.outcomeRating === "deterioration" ? "deteriorated" : e.outcomeRating === "no" ? "requires_revision" : "stable",
        recommendations: e.recommendations,
        nextEvaluationDate: e.nextEvaluationDate
      });
    }
    for (const rv of legacyReviews.filter((x) => x.carePlanId === plan.id)) {
      problemReviews.push({
        id: uid$1("rev"),
        problemId,
        reviewDate: rv.date,
        reviewedById: "legacy",
        reviewedByName: rv.reviewer,
        role: rv.role || "nurse",
        outcome: rv.outcome === "close" ? "resolve" : rv.outcome === "modify" ? "modify" : rv.outcome === "continue" ? "continue" : rv.outcome.startsWith("refer") ? "refer" : "escalate",
        comments: rv.notes
      });
    }
    const interventionsForPlan = problemInterventions.filter((i) => i.problemId === problemId);
    for (const l of legacyLogs.filter((x) => x.carePlanId === plan.id)) {
      const match = interventionsForPlan[0];
      if (!match) continue;
      problemInterventionLogs.push({
        id: uid$1("log"),
        interventionId: match.id,
        problemId,
        residentId: l.residentId,
        date: l.date,
        time: l.time,
        staffId: "legacy",
        staffName: l.staff,
        role: l.role || "carer",
        outcome: l.outcome === "cancelled" ? "missed" : l.outcome,
        residentResponse: l.residentResponse,
        comments: l.comments
      });
    }
    problemHistory.push({
      id: uid$1("hist"),
      problemId,
      timestamp: problem.createdAt,
      userId: "system",
      userName: systemUser,
      role: "cnm",
      action: "created",
      reason: "Migrated from legacy care plan"
    });
  }
  return {
    residentCarePlans,
    carePlanProblems,
    problemGoals,
    problemInterventions,
    problemEvaluations,
    problemReviews,
    problemInterventionLogs,
    problemHistory,
    legacyCarePlanIdToProblemId
  };
}
function newId(prefix) {
  return uid$1(prefix);
}
const ASSESSMENT_CATEGORIES = [
  { id: "mobility", label: "Mobility", types: ["barthel"] },
  { id: "pressure_care", label: "Pressure Care", types: ["waterlow", "norton"] },
  { id: "pain", label: "Pain", types: ["abbey_pain", "pain_chart"] },
  { id: "nutrition", label: "Nutrition", types: ["must", "mna", "nutrition"] },
  { id: "cognition", label: "Cognition", types: ["mmse", "four_at"] },
  { id: "continence", label: "Continence", types: ["continence"] },
  { id: "behaviour", label: "Behaviour", types: ["abc", "abs", "cornell", "gds15"] },
  { id: "safety", label: "Safety", types: ["falls"] },
  { id: "person_centred", label: "Person Centred", types: ["pinch_me"] }
];
function categoryFor(type) {
  for (const c of ASSESSMENT_CATEGORIES) if (c.types.includes(type)) return c.id;
  return "person_centred";
}
const REVIEW_FREQ_DAYS = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  six_monthly: 182,
  annually: 365,
  custom: 30
};
function computeNextReviewDate(freq, customDays, from = /* @__PURE__ */ new Date()) {
  const days = freq === "custom" ? customDays ?? 30 : REVIEW_FREQ_DAYS[freq];
  return new Date(from.getTime() + days * 864e5).toISOString().slice(0, 10);
}
function deriveStatus(a, today = /* @__PURE__ */ new Date()) {
  const s = a.status || "completed";
  if (s === "deleted" || s === "archived" || s === "superseded" || s === "draft" || s === "in_progress") return s;
  if (a.nextReassessmentDate) {
    const due = new Date(a.nextReassessmentDate);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / 864e5);
    if (diffDays < 0) return "overdue";
    if (diffDays <= 7) return "due";
  }
  return "completed";
}
const TRIGGER_TO_TYPES = {
  post_fall: ["falls", "barthel"],
  post_hospital_return: ["waterlow", "barthel", "must", "abbey_pain", "mmse"],
  post_incident: ["falls", "abbey_pain"],
  medication_change: ["pinch_me", "falls"],
  condition_change: ["waterlow", "abbey_pain", "must", "mmse"],
  gp_request: [],
  mdt_request: [],
  family_concern: [],
  routine: [],
  manual: []
};
function statusBadgeCls(s) {
  switch (s) {
    case "overdue":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "due":
      return "bg-warning/15 text-warning-foreground border-warning/40";
    case "completed":
      return "bg-success/10 text-success border-success/20";
    case "draft":
      return "bg-muted text-muted-foreground border-border";
    case "in_progress":
      return "bg-info/10 text-info border-info/20";
    case "archived":
      return "bg-muted text-muted-foreground border-border";
    case "deleted":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "superseded":
      return "bg-muted text-muted-foreground border-border";
  }
}
function riskBadgeCls(level) {
  if (level === "very_high") return "bg-destructive/10 text-destructive border-destructive/30";
  if (level === "high") return "bg-warning/15 text-warning-foreground border-warning/40";
  if (level === "moderate") return "bg-info/10 text-info border-info/20";
  return "bg-success/10 text-success border-success/20";
}
let _uidSeq = 0;
const uid = () => `id-${(++_uidSeq).toString(36).padStart(6, "0")}`;
const STORE_STORAGE_KEY = "carepath-pro-data";
const LEGACY_STORE_STORAGE_KEY = "carepath-pro-store";
const daysAgo = (d) => new Date(Date.now() - d * 864e5).toISOString();
const daysAhead = (d) => new Date(Date.now() + d * 864e5).toISOString();
const phoneFor = (seed) => `07${String(1e8 + seed * 2654435761 % 9e8).padStart(9, "0")}`;
const REMOVED_DEMO_TASK_TITLES = /* @__PURE__ */ new Set([
  "Reposition at scheduled times (10am, 12pm, 2pm, 4pm, 6pm, 8pm, 10pm, 12am)",
  "Daily skin inspection (pressure areas, buttocks, heels, sacrum)",
  "Record fluid and food intake daily",
  "Assist with all transfers using 2-person protocol",
  "Complete daily safety checks",
  "Family communication update"
]);
function removeRemovedDemoTasks(tasks = []) {
  return tasks.filter((task) => !REMOVED_DEMO_TASK_TITLES.has(task.title));
}
const PHYSIOLOGICAL_ALERT_TYPES = /* @__PURE__ */ new Set([
  "weight_loss",
  "weight_gain",
  "high_news2",
  "abnormal_bp",
  "abnormal_temp",
  "low_spo2",
  "high_pain",
  "hypoglycaemia",
  "hyperglycaemia",
  "fluid_imbalance"
]);
function reconcileClinicalAlerts(existing, residentId, seeds, now) {
  const next = [...existing];
  const activeForResident = next.filter(
    (alert) => alert.residentId === residentId && PHYSIOLOGICAL_ALERT_TYPES.has(alert.type) && !alert.dismissedAt && !alert.resolvedAt
  );
  const generatedTypes = new Set(seeds.map((seed) => seed.type));
  for (const alert of activeForResident) {
    if (!generatedTypes.has(alert.type)) {
      const index = next.findIndex((candidate) => candidate.id === alert.id);
      next[index] = { ...alert, resolvedAt: now, resolvedBy: "System", updatedAt: now };
    }
  }
  for (const seed of seeds) {
    const active = activeForResident.find((alert) => alert.type === seed.type);
    if (active) {
      const index = next.findIndex((candidate) => candidate.id === active.id);
      next[index] = { ...active, ...seed, updatedAt: now };
    } else {
      next.unshift({
        id: uid(),
        residentId,
        ...seed,
        createdAt: now,
        acknowledged: false,
        escalations: []
      });
    }
  }
  return next;
}
function observationAsVital(observation) {
  if (!["weight", "news2", "glucose", "pain", "fluid"].includes(observation.kind)) return void 0;
  const numberValue = (value) => value === void 0 || value === "" ? void 0 : Number(value);
  const data = observation.data;
  const intake = observation.kind === "fluid" ? [data.oralMl, data.pegMl, data.otherInMl].reduce((sum, value) => sum + (numberValue(value) ?? 0), 0) : void 0;
  const output = observation.kind === "fluid" ? [data.urineMl, data.vomitMl, data.drainageMl, data.otherOutMl].reduce((sum, value) => sum + (numberValue(value) ?? 0), 0) : void 0;
  return {
    id: observation.id,
    residentId: observation.residentId,
    date: observation.date,
    time: observation.time,
    recordedAt: observation.recordedAt,
    temperature: observation.kind === "news2" ? numberValue(data.temperature) : void 0,
    pulse: observation.kind === "news2" ? numberValue(data.pulse) : void 0,
    respiratoryRate: observation.kind === "news2" ? numberValue(data.respiratoryRate) : void 0,
    systolicBP: observation.kind === "news2" ? numberValue(data.systolicBP) : void 0,
    diastolicBP: observation.kind === "news2" ? numberValue(data.diastolicBP) : void 0,
    spo2: observation.kind === "news2" ? numberValue(data.spo2) : void 0,
    onOxygen: observation.kind === "news2" ? !!data.onOxygen : void 0,
    oxygenLpm: observation.kind === "news2" ? numberValue(data.oxygenLpm) : void 0,
    consciousness: observation.kind === "news2" ? data.consciousness : void 0,
    bloodGlucose: observation.kind === "glucose" ? numberValue(data.value) : void 0,
    weight: observation.kind === "weight" ? numberValue(data.weight) : void 0,
    height: observation.kind === "weight" ? numberValue(data.height) : void 0,
    painScore: observation.kind === "pain" ? numberValue(data.score) : void 0,
    fluidIntakeMl: intake,
    fluidOutputMl: output,
    recordedByUserId: observation.recordedByUserId,
    recordedByName: observation.recordedByName,
    recordedByRole: observation.recordedByRole,
    createdAt: observation.createdAt,
    deletedAt: observation.deletedAt,
    auditTrail: []
  };
}
function alertVitalsForResident(vitals, observations, residentId) {
  return [
    ...vitals.filter((vital) => vital.residentId === residentId),
    ...observations.filter((observation) => observation.residentId === residentId).map(observationAsVital).filter((vital) => !!vital)
  ];
}
function observationDataWithNEWS2(kind, source) {
  const { news2Score: _score, news2Risk: _risk, news2Breakdown: _breakdown, ...data } = source;
  if (kind !== "news2") return data;
  const news2 = calcNEWS2(data);
  return news2.complete ? { ...data, news2Score: news2.total, news2Risk: news2.risk, news2Breakdown: news2.breakdown } : data;
}
function vitalWithCalculatedNEWS2(source) {
  const { news2Score: _score, news2Risk: _risk, news2Breakdown: _breakdown, ...vital } = source;
  const news2 = calcNEWS2(vital);
  return news2.complete ? { ...vital, news2Score: news2.total, news2Risk: news2.risk, news2Breakdown: news2.breakdown } : vital;
}
function syncUidSequence(snapshot) {
  const text = JSON.stringify(snapshot);
  const matches = text.matchAll(/"id":"id-([0-9a-z]+)"/g);
  let maxSeq = 0;
  for (const match of matches) {
    const seq = parseInt(match[1], 36);
    if (!Number.isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }
  _uidSeq = Math.max(_uidSeq, maxSeq);
}
const WINGS_SEED = [
  { id: "w-oak", name: "Oak Wing", floor: "Ground", kind: "wing" },
  { id: "w-maple", name: "Maple Wing", floor: "Ground", kind: "wing" },
  { id: "w-ash", name: "Ash Wing", floor: "First", kind: "wing" },
  { id: "w-willow", name: "Willow Wing", floor: "First", kind: "wing" },
  { id: "w-memory", name: "Memory Care Unit", floor: "Ground", kind: "unit" },
  { id: "w-respite", name: "Respite Unit", floor: "First", kind: "unit" }
];
const UNITS_SEED = WINGS_SEED.map((w) => ({ id: `u-${w.id}`, wingId: w.id, name: w.name }));
function seedRooms() {
  const rooms = [];
  WINGS_SEED.forEach((w, wi) => {
    const start = wi * 10 + 1;
    for (let i = 0; i < 12; i++) {
      const num = String(start + i);
      rooms.push({ id: `r-${w.id}-${num}`, wingId: w.id, unitId: `u-${w.id}`, number: num });
    }
  });
  return rooms;
}
function seedUsers() {
  return [
    {
      id: "u-1",
      name: "C. Adeyemi",
      role: "carer",
      email: "c.adeyemi@carepath.org",
      phone: "07700 900101",
      department: "Care",
      assignedWings: ["w-oak"],
      employeeNumber: "EMP-1001",
      startDate: "2021-03-14",
      lastLogin: daysAgo(0),
      status: "active",
      avatarSeed: "CarerAde",
      notificationPrefs: { email: true, sms: false, inApp: true, criticalAlertsOnly: false }
    },
    {
      id: "u-2",
      name: "T. Brooks",
      role: "carer",
      email: "t.brooks@carepath.org",
      phone: "07700 900102",
      department: "Care",
      assignedWings: ["w-maple"],
      employeeNumber: "EMP-1002",
      startDate: "2022-08-02",
      lastLogin: daysAgo(1),
      status: "active",
      avatarSeed: "CarerBro",
      notificationPrefs: { email: true, sms: false, inApp: true, criticalAlertsOnly: false }
    },
    {
      id: "u-3",
      name: "J. Roberts",
      role: "nurse",
      email: "j.roberts@carepath.org",
      phone: "07700 900103",
      department: "Nursing",
      assignedWings: ["w-oak", "w-maple"],
      employeeNumber: "EMP-2001",
      startDate: "2019-01-10",
      lastLogin: daysAgo(0),
      status: "active",
      avatarSeed: "NurseRob",
      notificationPrefs: { email: true, sms: true, inApp: true, criticalAlertsOnly: false }
    },
    {
      id: "u-4",
      name: "L. Mensah",
      role: "nurse",
      email: "l.mensah@carepath.org",
      phone: "07700 900104",
      department: "Nursing",
      assignedWings: ["w-ash", "w-willow"],
      employeeNumber: "EMP-2002",
      startDate: "2020-06-22",
      lastLogin: daysAgo(0),
      status: "active",
      avatarSeed: "NurseMen",
      notificationPrefs: { email: true, sms: true, inApp: true, criticalAlertsOnly: false }
    },
    {
      id: "u-5",
      name: "Dr. S. Patel",
      role: "doctor",
      email: "s.patel@nhs.uk",
      phone: "0207 555 0100",
      department: "Medical",
      assignedWings: [],
      employeeNumber: "MED-3001",
      startDate: "2015-09-01",
      lastLogin: daysAgo(2),
      status: "active",
      avatarSeed: "DocPatel",
      notificationPrefs: { email: true, sms: false, inApp: true, criticalAlertsOnly: true }
    },
    {
      id: "u-6",
      name: "M. O'Brien",
      role: "cnm",
      email: "m.obrien@carepath.org",
      phone: "07700 900201",
      department: "Management",
      assignedWings: [],
      employeeNumber: "EMP-3001",
      startDate: "2018-04-19",
      lastLogin: daysAgo(0),
      status: "active",
      avatarSeed: "CnmObrien",
      notificationPrefs: { email: true, sms: true, inApp: true, criticalAlertsOnly: false }
    },
    {
      id: "u-7",
      name: "L. Hartley",
      role: "don",
      email: "l.hartley@carepath.org",
      phone: "07700 900301",
      department: "Executive",
      assignedWings: [],
      employeeNumber: "EMP-4001",
      startDate: "2014-11-30",
      lastLogin: daysAgo(0),
      status: "active",
      avatarSeed: "DonHart",
      notificationPrefs: { email: true, sms: true, inApp: true, criticalAlertsOnly: false }
    }
  ];
}
const firstNames = [
  "Margaret",
  "Patrick",
  "Eileen",
  "Noel",
  "Brigid",
  "Seamus",
  "Irene",
  "Thomas",
  "Maureen",
  "Declan",
  "Nora",
  "Joseph"
];
const lastNames = [
  "Byrne",
  "Walsh",
  "Kavanagh",
  "Doyle",
  "Murphy",
  "Lynch",
  "Keane",
  "Nolan",
  "Farrell",
  "Donovan",
  "McCarthy",
  "Roche"
];
const diagnoses = [
  "Mixed dementia with frailty syndrome and recurrent delirium",
  "Type 2 diabetes mellitus with peripheral neuropathy and CKD stage 3",
  "Post-stroke left sided weakness with dysphagia risk",
  "COPD with chronic hypoxia and exertional breathlessness",
  "Advanced Parkinson's disease with postural instability",
  "Severe osteoarthritis and chronic pain with reduced mobility",
  "Heart failure (HFpEF) with lower limb oedema",
  "Alzheimer's disease with wandering risk and nighttime agitation",
  "Multiple sclerosis with progressive mobility decline",
  "Recurrent falls with orthostatic hypotension",
  "Lewy body dementia with fluctuating cognition",
  "Frailty, malnutrition risk and recurrent urinary infection"
];
const medications = [
  "Donepezil 10mg ON, Amlodipine 5mg OD, Paracetamol 1g QDS PRN",
  "Metformin 500mg BD, Gliclazide 80mg OD, Atorvastatin 20mg ON",
  "Apixaban 5mg BD, Bisoprolol 2.5mg OD, Omeprazole 20mg OD",
  "Tiotropium inhaler OD, Salbutamol PRN, Prednisolone rescue pack PRN",
  "Co-careldopa 25/100mg QDS, Mirtazapine 15mg ON",
  "Paracetamol 1g QDS, Codeine 30mg PRN, Senna 7.5mg ON",
  "Furosemide 40mg OD, Ramipril 5mg OD, Spironolactone 25mg OD",
  "Memantine 20mg OD, Sertraline 50mg OD, Melatonin 2mg ON",
  "Baclofen 10mg TDS, Pregabalin 75mg BD, Vitamin D 800iu OD",
  "Midodrine 2.5mg TDS, Fludrocortisone 100mcg OD",
  "Rivastigmine patch 9.5mg/24h, Levothyroxine 75mcg OD",
  "Fortisip BD, Nitrofurantoin prophylaxis, Folic acid 5mg OD"
];
const residentTypes = [
  "active",
  "active",
  "active",
  "active_respite",
  "active",
  "active",
  "inactive_respite",
  "active",
  "active_respite",
  "active",
  "active",
  "active"
];
const bedTypesSeed = [
  "standard",
  "profiling",
  "pressure_relief",
  "low",
  "standard",
  "air_mattress",
  "specialist",
  "standard",
  "profiling",
  "pressure_relief",
  "profiling",
  "standard"
];
const mattressSeed = [
  "foam",
  "alternating_air",
  "low_air_loss",
  "foam",
  "standard",
  "alternating_air",
  "gel",
  "foam",
  "alternating_air",
  "low_air_loss",
  "alternating_air",
  "foam"
];
function seedNok(lastName, idx) {
  return [
    {
      id: `nok-${idx}-1`,
      name: `${["Sarah", "James", "Emily", "Robert"][idx % 4]} ${lastName}`,
      relationship: "Daughter",
      phone: "0207 555 0100",
      mobile: phoneFor(idx * 7 + 1),
      email: `${lastName.toLowerCase()}.family@example.com`,
      address: "12 Oak Lane, London",
      primaryContact: true,
      emergencyContact: true,
      powerOfAttorney: idx % 2 === 0,
      legalRepresentative: false,
      notes: "Primary point of contact for care decisions."
    }
  ];
}
function seedResidents(rooms) {
  return firstNames.map((fn, i) => {
    const room = rooms[i % rooms.length];
    return {
      id: `R-${String(i + 1).padStart(4, "0")}`,
      firstName: fn,
      lastName: lastNames[i],
      dob: new Date(1935 + i, i * 3 % 12, i * 7 % 27 + 1).toISOString().slice(0, 10),
      gender: i % 3 === 0 ? "male" : "female",
      roomNumber: room.number,
      wingId: room.wingId,
      unitId: room.unitId,
      roomId: room.id,
      admissionDate: daysAgo(60 + i * 30).slice(0, 10),
      primaryDiagnosis: diagnoses[i],
      medicalHistory: "Hypertension, previous hip replacement (2019), cataract surgery.",
      allergies: i % 4 === 0 ? "Penicillin" : "No known drug allergies",
      gp: ["Dr. S. Patel", "Dr. M. Khan", "Dr. R. Evans", "Dr. C. Hughes"][i % 4],
      consultant: [
        "Dr. J. Mitchell (Geriatrics)",
        "Dr. A. Sharma (Cardiology)",
        "Dr. P. O'Neill (Neurology)"
      ][i % 3],
      nextOfKin: `${["Sarah", "James", "Emily", "Robert"][i % 4]} ${lastNames[i]} (daughter)`,
      nextOfKinList: seedNok(lastNames[i], i),
      emergencyContact: phoneFor(i * 13 + 3),
      communicationNeeds: i % 3 === 0 ? "Hearing aid (right ear), speak clearly" : "No additional needs",
      religion: ["Church of England", "Catholic", "None", "Methodist"][i % 4],
      preferredLanguage: "English",
      mentalCapacity: i % 3 === 0 ? "lacks_capacity" : i % 3 === 1 ? "fluctuating" : "has_capacity",
      endOfLife: i === 9,
      currentMedication: medications[i],
      status: "active",
      residentType: residentTypes[i],
      bed: {
        bedType: bedTypesSeed[i],
        mattressType: mattressSeed[i],
        installationDate: daysAgo(180 - i * 10).slice(0, 10),
        reviewDate: daysAhead(90 + i * 5).slice(0, 10)
      },
      keyWorkers: {
        namedNurse: ["J. Roberts (RN)", "L. Mensah (RN)"][i % 2],
        namedCarer: ["C. Adeyemi", "T. Brooks"][i % 2],
        keyWorker: ["A. Garcia", "S. Williams", "D. Foster"][i % 3]
      },
      lastGpReview: daysAgo(20 + i * 3).slice(0, 10),
      lastMdtReview: daysAgo(40 + i * 4).slice(0, 10),
      photoSeed: `${fn}${lastNames[i]}`,
      aKeyToMe: i % 2 === 0 ? {
        lifeHistory: `Born and raised in ${["Manchester", "Liverpool", "Cardiff"][i % 3]}. Worked as a ${["teacher", "nurse", "engineer", "shopkeeper"][i % 4]} for 35 years.`,
        occupation: [
          "Retired teacher",
          "Retired nurse",
          "Retired engineer",
          "Retired shopkeeper"
        ][i % 4],
        family: "Two children, four grandchildren. Family visit weekly.",
        hobbies: "Reading, gardening, jigsaw puzzles, classical music.",
        likes: "Tea with two sugars, classical music, sunny days, family photos.",
        dislikes: "Loud noises, being rushed, cold rooms.",
        foodPreferences: "Light meals, prefers fish, dislikes strong cheese.",
        dailyRoutine: "Likes a quiet morning, reads paper, afternoon nap after lunch.",
        comfortItems: "Photograph album, knitted blanket from her mother.",
        triggers: "Being told what to do without explanation.",
        whatMakesMeHappy: "Family visits, classical music on the radio.",
        whatUpsetsMe: "Loud arguments, missing my afternoon tea.",
        bestWayToSupport: "Speak slowly, give choices, allow time to respond. Use her name often."
      } : void 0
    };
  });
}
function seedData() {
  const wings = WINGS_SEED;
  const units = UNITS_SEED;
  const rooms = seedRooms();
  const users = seedUsers();
  const residents = seedResidents(rooms);
  const assessments = [];
  const carePlans = [];
  const interventions = [];
  const notes = [];
  const evaluations = [];
  const carePlanEvaluations = [];
  const carePlanReviews = [];
  const alerts = [];
  const tasks = [];
  const incidents = [];
  const mdtNotes = [];
  const visitors = [];
  const outings = [];
  const handovers = [];
  const scenarioBlueprints = [
    {
      title: "Cognitive Support and Delirium Prevention",
      category: "Cognition",
      problem: "Fluctuating cognition and evening confusion increase distress and care refusal.",
      goal: "Resident remains oriented to person/place with fewer episodes of evening agitation.",
      interventions: [
        "Use orientation board each shift",
        "Maintain calm low-stimulus evening routine",
        "Offer reassurance before personal care",
        "Escalate acute change in behaviour to nurse"
      ],
      frequency: "Each shift",
      priority: "high"
    },
    {
      title: "Diabetes and Foot Care",
      category: "Medication",
      problem: "Variable blood glucose and peripheral neuropathy increase risk of foot injury.",
      goal: "Maintain blood glucose in target range and prevent skin breakdown.",
      interventions: [
        "Pre-meal blood glucose monitoring",
        "Daily foot and skin check",
        "Escalate readings outside agreed range"
      ],
      frequency: "Before meals and at bedtime",
      priority: "high"
    },
    {
      title: "Post-Stroke Mobility and Swallow Safety",
      category: "Mobility",
      problem: "Reduced left-sided strength and fatigue increase transfer risk.",
      goal: "Safe assisted transfers and no aspiration signs.",
      interventions: [
        "Two-person assist for transfers",
        "Position upright for meals and medications",
        "Prompt swallow strategies at mealtimes"
      ],
      frequency: "At each transfer and meal",
      priority: "high"
    },
    {
      title: "Respiratory Optimisation",
      category: "Respiratory",
      problem: "COPD exacerbation risk with intermittent low oxygen saturation.",
      goal: "Maintain oxygenation and reduce breathlessness episodes.",
      interventions: [
        "Monitor SpO2 as per plan",
        "Support inhaler technique",
        "Position for maximal chest expansion"
      ],
      frequency: "Twice daily and PRN",
      priority: "high"
    },
    {
      title: "Falls and Postural Stability",
      category: "Falls Prevention",
      problem: "Postural instability and freezing episodes increase fall risk.",
      goal: "No unwitnessed falls over next review period.",
      interventions: [
        "Supervised mobilising with frame",
        "Call bell and essentials within reach",
        "Toileting schedule during daytime"
      ],
      frequency: "Each shift",
      priority: "critical"
    },
    {
      title: "Chronic Pain and Function",
      category: "Pain Management",
      problem: "Persistent musculoskeletal pain limits movement and activity.",
      goal: "Keep pain score <= 3 and maintain participation in ADLs.",
      interventions: [
        "Scheduled analgesia and PRN review",
        "Heat therapy and guided movement",
        "Pain score reassessment after intervention"
      ],
      frequency: "4-hourly review",
      priority: "high"
    },
    {
      title: "Fluid Management and Oedema",
      category: "Cardiac",
      problem: "Heart failure with fluctuating oedema and fluid overload risk.",
      goal: "Stable weight and reduced lower-limb swelling.",
      interventions: [
        "Daily weight monitoring",
        "Fluid balance chart completion",
        "Escalate rapid weight gain >2kg in 3 days"
      ],
      frequency: "Daily",
      priority: "high"
    },
    {
      title: "Wandering and Night Safety",
      category: "Behaviour",
      problem: "Night wandering episodes increase fall and exit-seeking risk.",
      goal: "Reduce unsafe night wandering and preserve sleep.",
      interventions: [
        "Hourly night checks",
        "Personalised calming bedtime routine",
        "Sensor alert checks and environmental safety"
      ],
      frequency: "Night shift",
      priority: "high"
    },
    {
      title: "Progressive Mobility Decline",
      category: "Mobility",
      problem: "Progressive weakness causing reduced transfer tolerance.",
      goal: "Safe transfer routine and skin integrity preserved.",
      interventions: [
        "Hoist transfer protocol",
        "Passive range-of-motion exercises",
        "Repositioning schedule adherence"
      ],
      frequency: "Each shift",
      priority: "high"
    },
    {
      title: "Falls Risk and Orthostatic Monitoring",
      category: "Falls Prevention",
      problem: "Orthostatic hypotension with recurrent near-falls.",
      goal: "Reduce dizziness episodes and prevent falls.",
      interventions: [
        "Lying and standing blood pressure checks",
        "Slow position changes with supervision",
        "Hydration encouragement plan"
      ],
      frequency: "Twice daily",
      priority: "critical"
    },
    {
      title: "Cognition and Distress Response",
      category: "Mental Health",
      problem: "Fluctuating cognition with distress during unfamiliar care.",
      goal: "Improve engagement and reduce distress behaviours.",
      interventions: [
        "Consistent staff introductions",
        "Stepwise explanations before interventions",
        "Document effective de-escalation methods"
      ],
      frequency: "Each contact",
      priority: "high"
    },
    {
      title: "Nutrition and Infection Prevention",
      category: "Nutrition",
      problem: "Low oral intake and recurrent urinary infection history.",
      goal: "Improve intake and reduce infection indicators.",
      interventions: [
        "Food and fluid fortification",
        "Monitor urine characteristics and symptoms",
        "Weekly MUST and weight trend review"
      ],
      frequency: "Daily",
      priority: "high"
    }
  ];
  residents.forEach((r, i) => {
    const baseAssessment = (extra) => {
      const type = extra.type;
      const cat = type ? categoryFor(type) : void 0;
      const offset = (i + (type?.length ?? 3)) % 50 - 20;
      return {
        assessor: "J. Roberts (RN)",
        assessorRole: "nurse",
        status: "completed",
        version: 1,
        locked: true,
        category: cat,
        reviewFrequency: "monthly",
        reviewTriggers: ["routine"],
        reviewDate: daysAhead(7 + offset).slice(0, 10),
        nextReassessmentDate: daysAhead(offset).slice(0, 10),
        lockedBy: "J. Roberts (RN)",
        lockedAt: daysAgo(5).toString(),
        auditTrail: [
          {
            id: `aud-${i}-c-${type ?? "x"}`,
            action: "created",
            byUserId: "u-3",
            byUserName: "J. Roberts (RN)",
            byRole: "nurse",
            at: daysAgo(10).toString()
          },
          {
            id: `aud-${i}-d-${type ?? "x"}`,
            action: "completed",
            byUserId: "u-3",
            byUserName: "J. Roberts (RN)",
            byRole: "nurse",
            at: daysAgo(10).toString()
          },
          {
            id: `aud-${i}-l-${type ?? "x"}`,
            action: "locked",
            byUserId: "u-3",
            byUserName: "J. Roberts (RN)",
            byRole: "nurse",
            at: daysAgo(10).toString()
          }
        ],
        clinicalComments: [],
        linkedProblemIds: [],
        ...extra
      };
    };
    const bScores = {
      feeding: [10, 5, 0, 10, 5, 0, 5, 10, 5, 0, 5, 10][i],
      bathing: [5, 0, 0, 5, 0, 0, 5, 0, 5, 0, 5, 5][i],
      grooming: [5, 0, 5, 5, 0, 5, 0, 5, 0, 0, 5, 5][i],
      dressing: [10, 5, 0, 10, 0, 5, 5, 0, 5, 0, 5, 10][i],
      bowels: [10, 5, 0, 10, 5, 5, 5, 0, 5, 0, 5, 10][i],
      bladder: [10, 5, 0, 5, 0, 5, 5, 0, 5, 0, 5, 10][i],
      toilet: [10, 5, 0, 5, 0, 5, 5, 0, 5, 0, 5, 10][i],
      transfers: [15, 5, 0, 10, 5, 10, 5, 0, 5, 0, 10, 15][i],
      mobility: [15, 5, 0, 10, 0, 10, 5, 0, 5, 0, 10, 15][i],
      stairs: [10, 0, 0, 5, 0, 5, 0, 0, 0, 0, 5, 10][i]
    };
    const b = scoreAssessment("barthel", bScores);
    assessments.push({
      id: uid(),
      residentId: r.id,
      type: "barthel",
      date: daysAgo(20 - i % 10).slice(0, 10),
      scores: bScores,
      ...b,
      ...baseAssessment({ type: "barthel" })
    });
    const wScores = {
      build: i % 3,
      skin: i % 4,
      age: i < 5 ? 3 : 5,
      sex: 2,
      continence: i % 4,
      mobility: i % 5,
      nutrition: i % 3,
      neuro: i % 2 === 0 ? 4 : 0,
      specialRisk: i === 9 ? 8 : 0,
      medication: i % 3 === 0 ? 4 : 0
    };
    const w = scoreAssessment("waterlow", wScores);
    assessments.push({
      id: uid(),
      residentId: r.id,
      type: "waterlow",
      date: daysAgo(15 - i % 5).slice(0, 10),
      scores: wScores,
      ...w,
      ...baseAssessment({ type: "waterlow" })
    });
    const aScores = {
      vocalisation: [0, 1, 2, 0, 3, 1, 0, 2, 1, 3, 1, 0][i],
      facial: [1, 1, 2, 0, 3, 2, 0, 2, 1, 3, 1, 0][i],
      bodyLanguage: [0, 2, 1, 0, 2, 1, 1, 2, 0, 3, 1, 0][i],
      behavioural: [0, 1, 2, 0, 2, 1, 0, 1, 1, 2, 0, 0][i],
      physiological: [0, 1, 1, 0, 2, 0, 0, 1, 1, 2, 0, 0][i],
      physical: [0, 0, 1, 0, 2, 1, 0, 1, 0, 2, 0, 0][i]
    };
    const a = scoreAssessment("abbey_pain", aScores);
    assessments.push({
      id: uid(),
      residentId: r.id,
      type: "abbey_pain",
      date: daysAgo(10 - i % 5).slice(0, 10),
      scores: aScores,
      ...a,
      ...baseAssessment({ type: "abbey_pain", assessor: "L. Mensah (RN)" })
    });
    if (i % 2 === 0) {
      const mScores = {
        foodIntake: i % 3,
        weightLoss: (i + 1) % 4,
        mobility: i % 3,
        stress: i % 2 === 0 ? 0 : 2,
        neuro: i % 3,
        bmi: i % 4
      };
      const m = scoreAssessment("mna", mScores);
      assessments.push({
        id: uid(),
        residentId: r.id,
        type: "mna",
        date: daysAgo(12).slice(0, 10),
        scores: mScores,
        ...m,
        ...baseAssessment({ type: "mna" })
      });
    }
    if (i % 3 === 0) {
      const mmseScores = {
        orientationTime: 3,
        orientationPlace: 4,
        registration: 2,
        attention: 2,
        recall: 1,
        naming: 2,
        repetition: 1,
        command: 2,
        reading: 1,
        writing: 0,
        copying: 0
      };
      const mmseR = scoreAssessment("mmse", mmseScores);
      assessments.push({
        id: uid(),
        residentId: r.id,
        type: "mmse",
        date: daysAgo(18).slice(0, 10),
        scores: mmseScores,
        ...mmseR,
        ...baseAssessment({ type: "mmse" })
      });
    }
    if (i % 4 === 0) {
      const fallsScores = {
        history: 3,
        medication: 2,
        vision: 0,
        mobility: 3,
        cognition: 2,
        continence: 0,
        footwear: 0,
        environment: 0
      };
      const fR = scoreAssessment("falls", fallsScores);
      assessments.push({
        id: uid(),
        residentId: r.id,
        type: "falls",
        date: daysAgo(9).slice(0, 10),
        scores: fallsScores,
        ...fR,
        ...baseAssessment({ type: "falls" })
      });
    }
    if (i === 0) {
      const margaretCarePlan = {
        id: uid(),
        residentId: r.id,
        title: "Comprehensive Multidomain Care Plan",
        category: "Complex Care",
        problem: "Multiple concurrent care needs: Waterlow 32 (very high pressure risk), Falls risk (17), MNA nutrition risk, MMSE cognitive impairment (11/30), moderate pain",
        goal: "Holistic management across all domains: maintain skin integrity, prevent falls, optimize nutrition, support cognition, manage pain",
        identifiedNeeds: [
          "Pressure Area Care",
          "Falls Prevention",
          "Nutrition Support",
          "Cognition Support",
          "Pain Management",
          "ADL Assistance",
          "Safety",
          "Holistic Care Coordination"
        ],
        interventions: [
          "2-hourly repositioning & pressure area care bundle",
          "Multidomain safety & support plan (falls + cognition + nutrition support + ADL assistance)"
        ],
        assignedStaff: "Nursing team (primary: J. Roberts RN)",
        frequency: "Continuous monitoring; repositioning 2-hourly; meals & hydration 3x daily; cognition support each interaction",
        reviewDate: daysAhead(5).slice(0, 10),
        evaluationDate: daysAhead(14).slice(0, 10),
        status: "active",
        priority: "critical",
        createdAt: daysAgo(20),
        createdBy: "J. Roberts (RN)",
        version: 1
      };
      carePlans.push(margaretCarePlan);
      carePlanReviews.push({
        id: uid(),
        carePlanId: margaretCarePlan.id,
        date: daysAgo(3).slice(0, 10),
        reviewer: "J. Roberts (RN)",
        role: "nurse",
        notes: "Comprehensive plan reviewed across all domains. Repositioning compliance good. Skin integrity maintained. Fall prevention protocol adhered to. Nutrition supplementation accepted. Cognition support strategies effective. Continue current unified approach.",
        outcome: "continue"
      });
      carePlanEvaluations.push({
        id: uid(),
        carePlanId: margaretCarePlan.id,
        date: daysAgo(1).slice(0, 10),
        evaluatedBy: "L. Mensah (RN)",
        role: "nurse",
        summary: "All care plan goals progressing. Skin intact, no pressure damage. Falls prevented with 2-person assist protocol. Nutrition stable with supplement acceptance. Cognition support reducing distress episodes. Pain levels acceptable. Overall good progress across all domains.",
        goalsMet: "yes",
        outcomeRating: "good",
        recommendations: "Maintain current unified approach. Re-assess all domains at 4-week review. Continue 2-person assists and 2-hourly repositioning.",
        reviseRequired: false,
        nextEvaluationDate: daysAhead(28).slice(0, 10)
      });
    } else {
      const scenario = scenarioBlueprints[i % scenarioBlueprints.length];
      const primaryCarePlan = {
        id: uid(),
        residentId: r.id,
        title: scenario.title,
        category: scenario.category,
        problem: scenario.problem,
        goal: scenario.goal,
        identifiedNeeds: [scenario.category, "Safety", "Person-centred care"],
        interventions: scenario.interventions,
        assignedStaff: i % 2 === 0 ? "Nursing team" : "Care team",
        frequency: scenario.frequency,
        reviewDate: daysAhead(6 + i % 5).slice(0, 10),
        evaluationDate: daysAhead(12 + i % 6).slice(0, 10),
        status: i % 5 === 0 ? "review_due" : "active",
        priority: scenario.priority,
        createdAt: daysAgo(20 + i % 8),
        createdBy: i % 2 === 0 ? "J. Roberts (RN)" : "L. Mensah (RN)",
        version: 1
      };
      carePlans.push(primaryCarePlan);
      if (i % 3 !== 2) {
        carePlanReviews.push({
          id: uid(),
          carePlanId: primaryCarePlan.id,
          date: daysAgo(4 + i % 4).slice(0, 10),
          reviewer: i % 2 === 0 ? "J. Roberts (RN)" : "M. O'Brien (CNM)",
          role: i % 2 === 0 ? "nurse" : "cnm",
          notes: "Plan reviewed with frontline staff; interventions remain clinically appropriate.",
          outcome: i % 4 === 0 ? "modify" : "continue"
        });
      }
      if (i % 4 === 0) {
        carePlanEvaluations.push({
          id: uid(),
          carePlanId: primaryCarePlan.id,
          date: daysAgo(2).slice(0, 10),
          evaluatedBy: "J. Roberts (RN)",
          role: "nurse",
          summary: "Resident response improving; continue current interventions with close monitoring.",
          goalsMet: "partially",
          outcomeRating: "good",
          recommendations: "Re-evaluate at next MDT and maintain daily monitoring.",
          reviseRequired: false,
          nextEvaluationDate: daysAhead(14).slice(0, 10)
        });
      }
    }
    if (i > 0 && (w.riskLevel === "high" || w.riskLevel === "very_high")) {
      const pressurePlan = {
        id: uid(),
        residentId: r.id,
        title: "Pressure Area Care",
        category: "Pressure Care",
        problem: `Waterlow ${w.totalScore} indicates ${w.interpretation.toLowerCase()}.`,
        goal: "Maintain intact skin with no avoidable pressure damage.",
        identifiedNeeds: ["Skin Integrity", "Repositioning", "Nutrition"],
        interventions: [
          "Reposition at prescribed interval",
          "Document skin inspection every shift",
          "Use pressure-relieving surface",
          "Escalate category >=1 skin damage immediately"
        ],
        assignedStaff: "Care and nursing team",
        frequency: w.riskLevel === "very_high" ? "2-hourly" : "3-hourly",
        reviewDate: daysAhead(5).slice(0, 10),
        evaluationDate: daysAhead(10).slice(0, 10),
        status: "active",
        priority: w.riskLevel === "very_high" ? "critical" : "high",
        createdAt: daysAgo(12),
        createdBy: "J. Roberts (RN)",
        version: 1
      };
      carePlans.push(pressurePlan);
    }
    if (i > 0 && a.totalScore >= 8) {
      carePlans.push({
        id: uid(),
        residentId: r.id,
        title: "Acute Pain Control",
        category: "Pain Management",
        problem: `Abbey Pain score ${a.totalScore}: ${a.interpretation}.`,
        goal: "Pain reduced to acceptable level within 72 hours.",
        identifiedNeeds: ["Pain Monitoring", "Comfort Measures"],
        interventions: [
          "Administer prescribed analgesia",
          "Re-assess pain within 60 minutes",
          "Document non-pharmacological strategies"
        ],
        assignedStaff: "Nurse in charge",
        frequency: "4-hourly",
        reviewDate: daysAhead(3).slice(0, 10),
        evaluationDate: daysAhead(7).slice(0, 10),
        status: "active",
        priority: a.totalScore >= 14 ? "critical" : "high",
        createdAt: daysAgo(6),
        createdBy: "L. Mensah (RN)",
        version: 1
      });
    }
    if (i === 0) {
      const margaretInterventions = [
        {
          name: "2-hourly repositioning & pressure area care bundle",
          outcome: "Completed",
          residentResponse: "Settled appropriately",
          date: daysAgo(0)
        },
        {
          name: "Multidomain safety & support plan (falls + cognition + nutrition support + ADL assistance)",
          outcome: "Completed",
          residentResponse: "Accepted all interventions with reassurance",
          date: daysAgo(1)
        }
      ];
      margaretInterventions.forEach((interv, k) => {
        interventions.push({
          id: uid(),
          residentId: r.id,
          date: interv.date.slice(0, 10),
          staff: k === 0 ? "J. Roberts (RN)" : "C. Adeyemi",
          intervention: interv.name,
          outcome: interv.outcome,
          residentResponse: interv.residentResponse,
          followUpRequired: false
        });
      });
    } else {
      const scenario = scenarioBlueprints[i % scenarioBlueprints.length];
      const interventionTemplates = [
        {
          name: scenario.interventions[0],
          outcome: "Completed as planned",
          residentResponse: "Accepted intervention with reassurance"
        },
        {
          name: scenario.interventions[1] || "Clinical monitoring completed",
          outcome: i % 4 === 0 ? "Partially completed due to resident fatigue" : "Completed and documented",
          residentResponse: i % 4 === 0 ? "Tired but cooperative" : "Tolerated well"
        },
        {
          name: scenario.interventions[2] || "Hydration and comfort round",
          outcome: "Completed",
          residentResponse: "Comfort maintained"
        }
      ];
      interventionTemplates.forEach((template, k) => {
        interventions.push({
          id: uid(),
          residentId: r.id,
          date: daysAgo(k).slice(0, 10),
          staff: ["C. Adeyemi", "T. Brooks", "J. Roberts (RN)"][k % 3],
          intervention: template.name,
          outcome: template.outcome,
          residentResponse: template.residentResponse,
          followUpRequired: k === 1 && i % 3 === 0
        });
      });
    }
    for (let k = 0; k < 3; k++) {
      notes.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(k).slice(0, 10),
        staff: ["C. Adeyemi", "T. Brooks", "J. Roberts (RN)"][k % 3],
        shift: ["morning", "afternoon", "night"][k % 3],
        observation: k === 0 ? "Baseline observations completed and care plan actions delivered." : k === 1 ? "Resident engaged with support; no acute deterioration observed." : "Night settled with routine checks and repositioning as required.",
        mood: ["calm", "happy", "anxious", "withdrawn", "agitated"][(i + k) % 5],
        foodIntake: ["full", "most", "half", "little"][(i + k) % 4],
        fluidIntake: ["good", "moderate", "poor"][(i + k) % 3],
        sleep: ["good", "broken", "poor"][(i + k + 1) % 3],
        behaviour: i % 3 === 1 && k === 2 ? "Required reassurance during personal care." : "No safeguarding concerns noted."
      });
    }
    if (i === 0) {
      incidents.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(7).slice(0, 10),
        type: "near_miss",
        severity: "moderate",
        description: "During assisted transfer to commode, resident's knee buckled. Staff prevented fall by firm hold and lowering gently to chair.",
        immediateAction: "Post-incident observations completed. Neurological check normal. Falls protocol reviewed. Switched to 2-person assists for all transfers.",
        reportedBy: "C. Adeyemi",
        witnessedBy: "T. Brooks",
        followUpRequired: true,
        status: "closed",
        closedAt: daysAgo(6),
        closedBy: "J. Roberts (RN)"
      });
      mdtNotes.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(14).slice(0, 10),
        attendees: "Dr. S. Patel (GP), J. Roberts (RN), M. O'Brien (CNM), Sarah (daughter/POA)",
        discussion: "Reviewed comprehensive assessment results. Margaret remains suitable for nursing home care with current support. Discussed pressure risk, falls risk, and nutrition. Family expressed satisfaction with unified care plan.",
        recommendations: "Continue current unified care plan approach. Repeat Waterlow in 4 weeks. Trial OT assessment for ROM exercises. Review pain medication if needed.",
        followUpDate: daysAhead(28).slice(0, 10),
        authoredBy: "Dr. S. Patel",
        role: "doctor"
      });
      handovers.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(0).slice(0, 10),
        shift: "morning",
        staff: "J. Roberts (RN)",
        summary: "Margaret settled. Morning skin check completed—no concerns. Ate breakfast. 10am repositioning completed. Monitor for any discomfort.",
        outstandingActions: "Daily skin inspection due today. Fluid chart must be updated. Ensure 2-person assist protocol for all transfers.",
        priority: "high"
      });
    } else {
      if (i % 3 === 0) {
        incidents.push({
          id: uid(),
          residentId: r.id,
          date: daysAgo(3 + i).slice(0, 10),
          type: i % 2 === 0 ? "fall" : "near_miss",
          severity: i % 4 === 0 ? "high" : "moderate",
          description: i % 2 === 0 ? "Resident found seated on floor beside bed; no apparent injury." : "Resident became unsteady during transfer; staff prevented full fall.",
          immediateAction: "Post-incident observations completed, family informed, falls protocol followed.",
          reportedBy: "J. Roberts (RN)",
          witnessedBy: "C. Adeyemi",
          followUpRequired: true,
          status: i % 4 === 0 ? "under_investigation" : "open"
        });
      }
      if (i % 2 === 0) {
        mdtNotes.push({
          id: uid(),
          residentId: r.id,
          date: daysAgo(10 + i).slice(0, 10),
          attendees: "Dr. S. Patel, J. Roberts (RN), M. O'Brien (CNM), Family representative",
          discussion: "Reviewed risk trends, medication tolerance and current care plan outcomes.",
          recommendations: "Continue current interventions and escalate if NEWS2 threshold breached.",
          followUpDate: daysAhead(21).slice(0, 10),
          authoredBy: "Dr. S. Patel",
          role: "doctor"
        });
      }
      if (i % 2 === 1) {
        visitors.push({
          id: uid(),
          residentId: r.id,
          date: daysAgo(1).slice(0, 10),
          visitorName: `${["Aoife", "Liam", "Siobhan"][i % 3]} ${r.lastName}`,
          relationship: i % 3 === 0 ? "Son" : "Daughter",
          arrivalTime: "14:00",
          departureTime: "15:20",
          notes: "Discussed current mobility support and encouraged social engagement.",
          signedInBy: "Reception",
          status: "completed"
        });
      }
      if (i % 4 === 0) {
        outings.push({
          id: uid(),
          residentId: r.id,
          date: daysAgo(6).slice(0, 10),
          destination: "Community sensory garden",
          accompaniedBy: "Activities coordinator and family",
          departureTime: "10:30",
          returnTime: "12:00",
          transportMethod: "Wheelchair accessible vehicle",
          notes: "Short supervised outing completed with positive mood impact.",
          riskAssessmentCompleted: true,
          status: "returned"
        });
      }
      handovers.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(0).slice(0, 10),
        shift: "morning",
        staff: "J. Roberts (RN)",
        summary: "Priority care actions completed; monitor trend data and escalation triggers.",
        outstandingActions: i % 3 === 0 ? "Complete post-incident review documentation before end of day." : "Confirm family update after afternoon medication round.",
        priority: i % 3 === 0 ? "high" : "medium",
        status: i % 5 === 0 ? "acknowledged" : "open"
      });
    }
  });
  const observations = [];
  const weights = [];
  const fluids = [];
  const foods = [];
  const pains = [];
  const sleeps = [];
  const bowels = [];
  const behaviours = [];
  const incidentActions = [];
  const shiftSummaries = [];
  const timelineEvents = [];
  residents.forEach((r, i) => {
    for (let w = 5; w >= 0; w--) {
      const base = 62 + i % 5 * 3;
      weights.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(w * 14).slice(0, 10),
        weightKg: +(base - w * 0.4 + i % 3 * 0.2).toFixed(1),
        staff: "J. Roberts (RN)"
      });
    }
    for (let k = 0; k < 3; k++) {
      fluids.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(0).slice(0, 10),
        time: ["08:00", "12:30", "17:00"][k],
        amountMl: [200, 250, 180][k],
        type: ["Water", "Tea", "Juice"][k],
        route: "oral",
        staff: ["C. Adeyemi", "T. Brooks", "C. Adeyemi"][k]
      });
    }
    ["breakfast", "lunch", "dinner"].forEach((meal, mi) => {
      foods.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(0).slice(0, 10),
        meal,
        intake: ["full", "most", "half", "little"][(i + mi) % 4],
        staff: "C. Adeyemi"
      });
    });
    for (let p = 4; p >= 0; p--) {
      pains.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(p).slice(0, 10),
        time: "10:00",
        score: (i + p) % 6,
        staff: "J. Roberts (RN)"
      });
    }
    for (let s = 4; s >= 0; s--) {
      sleeps.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(s).slice(0, 10),
        hoursSlept: 5 + (i + s) % 4,
        quality: ["good", "broken", "poor"][(i + s) % 3],
        staff: "Night Team"
      });
    }
    observations.push({
      id: uid(),
      residentId: r.id,
      date: daysAgo(0).slice(0, 10),
      time: "09:30",
      staff: "C. Adeyemi",
      role: "carer",
      mood: ["happy", "calm", "anxious"][i % 3],
      mobility: ["independent", "assistance", "hoist"][i % 3],
      pain: i % 4,
      sleep: "good",
      appetite: "most",
      hydration: "good",
      behaviour: "Settled."
    });
  });
  const vitals = [];
  const observationPlans = [];
  const clinicalAlerts = [];
  residents.forEach((r, i) => {
    r.heightCm = 158 + i % 7 * 4;
    observationPlans.push({
      residentId: r.id,
      updatedAt: daysAgo(30),
      updatedByName: "M. O'Brien (CNM)",
      items: [
        { id: `op-${r.id}-1`, type: "temperature", frequency: "daily", required: true },
        { id: `op-${r.id}-2`, type: "bloodPressure", frequency: "weekly", required: true },
        { id: `op-${r.id}-3`, type: "weight", frequency: "weekly", required: true },
        { id: `op-${r.id}-4`, type: "pulse", frequency: "daily", required: true },
        { id: `op-${r.id}-5`, type: "spo2", frequency: "daily", required: false },
        { id: `op-${r.id}-6`, type: "news2", frequency: "prn", required: true },
        ...i % 3 === 0 ? [
          {
            id: `op-${r.id}-7`,
            type: "bloodGlucose",
            frequency: "daily",
            required: true
          }
        ] : [],
        ...i % 4 === 0 ? [
          {
            id: `op-${r.id}-8`,
            type: "fluidBalance",
            frequency: "daily",
            required: true
          }
        ] : [],
        { id: `op-${r.id}-9`, type: "painScore", frequency: "daily", required: false }
      ]
    });
  });
  const demoVital = (id, residentId, observationType, time, values) => {
    const recordedAt = `2026-06-23T${time}:00.000Z`;
    const item = {
      id,
      residentId,
      observationType,
      date: "2026-06-23",
      time,
      recordedAt,
      ...values,
      recordedByUserId: "u-3",
      recordedByName: "J. Roberts (RN)",
      recordedByRole: "nurse",
      createdAt: recordedAt,
      auditTrail: [{
        id: `audit-${id}`,
        action: "created",
        byUserId: "u-3",
        byUserName: "J. Roberts (RN)",
        byRole: "nurse",
        at: recordedAt
      }]
    };
    const news2 = calcNEWS2(item);
    return news2.complete ? { ...item, news2Score: news2.total, news2Risk: news2.risk, news2Breakdown: news2.breakdown } : item;
  };
  vitals.push(
    demoVital("demo-vital-news2", "R-0001", "full_news2", "08:30", {
      temperature: 36.7,
      pulse: 78,
      respiratoryRate: 18,
      spo2: 96,
      systolicBP: 124,
      diastolicBP: 76,
      onOxygen: false,
      consciousness: "A"
    }),
    demoVital("demo-vital-temperature", "R-0002", "temperature", "09:15", {
      temperature: 38.6,
      observationNotes: "Mild pyrexia noted. Fluids encouraged and nurse informed."
    }),
    demoVital("demo-vital-weight", "R-0001", "weight_bmi", "10:00", {
      weight: 61.2,
      observationNotes: "Weekly weight recorded."
    }),
    demoVital("demo-vital-spo2", "R-0003", "oxygen_saturation", "11:00", {
      spo2: 90,
      onOxygen: false,
      respiratoryRate: 24,
      observationNotes: "Low oxygen saturation recorded. Resident comfortable but for nursing review."
    })
  );
  residents.forEach((r) => {
    const rv = vitals.filter((v) => v.residentId === r.id);
    const seeds = derivedAlertsForResident(rv);
    seeds.forEach((s, idx) => {
      clinicalAlerts.push({
        id: `ca-${r.id}-${idx}`,
        residentId: r.id,
        type: s.type,
        severity: s.severity,
        title: s.title,
        message: s.message,
        recommendation: s.recommendation,
        currentValue: s.currentValue,
        previousValue: s.previousValue,
        sourceVitalId: s.sourceVitalId,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        acknowledged: false,
        escalations: []
      });
    });
  });
  const migrated = migrateLegacy(
    carePlans,
    carePlanEvaluations,
    carePlanReviews,
    []
  );
  const assessmentSuggestions = [];
  for (const a of assessments) {
    if (a.status === "deleted" || a.status === "archived") continue;
    const sugs = suggestionsForAssessment(a);
    for (const s of sugs) {
      if (migrated.carePlanProblems.some(
        (p) => p.residentId === a.residentId && p.category === s.category && p.sourceAssessmentId === a.id
      ))
        continue;
      assessmentSuggestions.push({
        ...s,
        id: newId("sug"),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "pending"
      });
    }
  }
  return {
    wings,
    units,
    rooms,
    users,
    residents,
    assessments,
    carePlans,
    interventions,
    notes,
    evaluations,
    carePlanEvaluations,
    carePlanReviews,
    alerts,
    alertWorkflow: {},
    tasks,
    auditLogs: [],
    incidents,
    mdtNotes,
    visitors,
    outings,
    handovers,
    interventionLogs: [],
    readReceipts: [],
    carePlanTemplates: BUILT_IN_TEMPLATES.map((t) => ({
      ...t,
      editable: true
    })),
    observations,
    weights,
    fluids,
    foods,
    pains,
    sleeps,
    bowels,
    behaviours,
    incidentActions,
    shiftSummaries,
    timelineEvents,
    // unified model
    residentCarePlans: migrated.residentCarePlans,
    carePlanProblems: migrated.carePlanProblems,
    problemGoals: migrated.problemGoals,
    problemInterventions: migrated.problemInterventions,
    problemInterventionLogs: migrated.problemInterventionLogs,
    problemEvaluations: migrated.problemEvaluations,
    problemReviews: migrated.problemReviews,
    problemHistory: migrated.problemHistory,
    assessmentSuggestions,
    legacyCarePlanIdToProblemId: migrated.legacyCarePlanIdToProblemId,
    assessmentTriggerEvents: [],
    vitals,
    observationPlans,
    clinicalAlerts,
    clinicalObservations: [],
    observationSchedules: []
  };
}
function loadInitialStore() {
  const base = seedData();
  if (typeof window === "undefined") {
    syncUidSequence(base);
    return base;
  }
  try {
    const raw = window.localStorage.getItem(STORE_STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORE_STORAGE_KEY);
    if (!raw) {
      syncUidSequence(base);
      return base;
    }
    const parsed = JSON.parse(raw);
    const hasLegacyGeneratedVitals = parsed.vitals?.some((vital) => /^v-R-\d{4}-\d+$/.test(vital.id));
    if (hasLegacyGeneratedVitals) {
      const retainedVitals = (parsed.vitals || []).filter(
        (vital) => !/^v-R-\d{4}-\d+$/.test(vital.id) && !vital.id.startsWith("demo-vital-")
      );
      const retainedAlerts = (parsed.clinicalAlerts || []).filter(
        (alert) => !/^ca-R-\d{4}-\d+$/.test(alert.id)
      );
      parsed.vitals = [...base.vitals, ...retainedVitals];
      parsed.clinicalAlerts = [...base.clinicalAlerts, ...retainedAlerts];
    }
    const merged = { ...base, ...parsed };
    merged.tasks = removeRemovedDemoTasks(merged.tasks);
    merged.vitals = merged.vitals.map(vitalWithCalculatedNEWS2);
    merged.clinicalObservations = merged.clinicalObservations.map((observation) => ({
      ...observation,
      data: observationDataWithNEWS2(observation.kind, observation.data)
    }));
    syncUidSequence(merged);
    return merged;
  } catch (error) {
    console.warn("Failed to load persisted care store, using seeded data.", error);
    syncUidSequence(base);
    return base;
  }
}
const Ctx = createContext(null);
function CareProvider({ children }) {
  const [store, setStore] = useState(() => loadInitialStore());
  const [currentUserId, setCurrentUserId] = useState("u-3");
  const [filter, setFilter] = useState({});
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      console.error("Failed to persist care store.", error);
    }
  }, [store]);
  const currentUser = useMemo(
    () => store.users.find((u) => u.id === currentUserId) || store.users[0],
    [store.users, currentUserId]
  );
  const currentRole = currentUser.role;
  const currentUserName = currentUser.name;
  const setCurrentRole = useCallback(
    (r) => {
      const user = store.users.find((u) => u.role === r);
      if (user) setCurrentUserId(user.id);
    },
    [store.users]
  );
  const resetToDemoData = useCallback(() => {
    const nextStore = seedData();
    syncUidSequence(nextStore);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORE_STORAGE_KEY);
        window.localStorage.removeItem(LEGACY_STORE_STORAGE_KEY);
      } catch (error) {
        console.warn("Failed to clear persisted store during demo reset.", error);
      }
    }
    setStore(nextStore);
    setCurrentUserId("u-3");
  }, []);
  const logAudit = useCallback((a) => {
    setStore((s) => ({
      ...s,
      auditLogs: [{ ...a, id: uid(), timestamp: (/* @__PURE__ */ new Date()).toISOString() }, ...s.auditLogs].slice(
        0,
        500
      )
    }));
  }, []);
  const filteredResidentIds = useMemo(() => {
    return store.residents.filter((r) => {
      if (filter.residentId && r.id !== filter.residentId) return false;
      if (filter.roomId && r.roomId !== filter.roomId) return false;
      if (filter.unitId && r.unitId !== filter.unitId) return false;
      if (filter.wingId && r.wingId !== filter.wingId) return false;
      if (filter.status && (r.residentType || r.status) !== filter.status) return false;
      return true;
    }).map((r) => r.id);
  }, [store.residents, filter]);
  const api = useMemo(
    () => ({
      ...store,
      currentRole,
      setCurrentRole,
      resetToDemoData,
      currentUserName,
      currentUser,
      setCurrentUserId,
      filter,
      setFilter,
      filteredResidentIds,
      updateUser: (id, patch) => setStore((s) => ({
        ...s,
        users: s.users.map((u) => u.id === id ? { ...u, ...patch } : u)
      })),
      addResident: (r) => {
        const id = `R-${String(store.residents.length + 1).padStart(4, "0")}`;
        const resident = { ...r, id, photoSeed: r.firstName + r.lastName };
        setStore((s) => ({ ...s, residents: [...s.residents, resident] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created resident",
          entity: id
        });
        return resident;
      },
      updateResident: (id, patch) => {
        setStore((s) => ({
          ...s,
          residents: s.residents.map((r) => r.id === id ? { ...r, ...patch } : r)
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated resident",
          entity: id
        });
      },
      addNextOfKin: (residentId, nok) => setStore((s) => ({
        ...s,
        residents: s.residents.map(
          (r) => r.id === residentId ? { ...r, nextOfKinList: [...r.nextOfKinList || [], { ...nok, id: uid() }] } : r
        )
      })),
      updateNextOfKin: (residentId, id, patch) => setStore((s) => ({
        ...s,
        residents: s.residents.map(
          (r) => r.id === residentId ? {
            ...r,
            nextOfKinList: (r.nextOfKinList || []).map(
              (n) => n.id === id ? { ...n, ...patch } : n
            )
          } : r
        )
      })),
      removeNextOfKin: (residentId, id) => setStore((s) => ({
        ...s,
        residents: s.residents.map(
          (r) => r.id === residentId ? { ...r, nextOfKinList: (r.nextOfKinList || []).filter((n) => n.id !== id) } : r
        )
      })),
      addAssessment: (a) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const isCompleted = (a.status || "completed") === "completed";
        const audit = [
          ...a.auditTrail || [],
          {
            id: uid(),
            action: "created",
            byUserId: currentUser.id,
            byUserName: currentUserName,
            byRole: currentRole,
            at: now
          }
        ];
        if (isCompleted) {
          audit.push({
            id: uid(),
            action: "completed",
            byUserId: currentUser.id,
            byUserName: currentUserName,
            byRole: currentRole,
            at: now
          });
          audit.push({
            id: uid(),
            action: "locked",
            byUserId: currentUser.id,
            byUserName: currentUserName,
            byRole: currentRole,
            at: now
          });
        }
        const item = {
          ...a,
          id: uid(),
          status: a.status || "completed",
          version: a.version || 1,
          category: a.category || (a.type ? categoryFor(a.type) : void 0),
          reviewFrequency: a.reviewFrequency || "monthly",
          reviewTriggers: a.reviewTriggers || ["routine"],
          locked: isCompleted ? true : !!a.locked,
          lockedAt: isCompleted ? now : a.lockedAt,
          lockedBy: isCompleted ? currentUserName : a.lockedBy,
          nextReassessmentDate: a.nextReassessmentDate || (a.reviewFrequency ? computeNextReviewDate(a.reviewFrequency, a.customReviewDays) : void 0),
          auditTrail: audit,
          clinicalComments: a.clinicalComments || [],
          linkedProblemIds: a.linkedProblemIds || []
        };
        setStore((s) => ({ ...s, assessments: [item, ...s.assessments] }));
        const ev = {
          id: uid(),
          residentId: a.residentId,
          type: "assessment.created",
          title: `${a.type.replace("_", " ")} assessment ${isCompleted ? "completed" : "started"}`,
          description: isCompleted ? `Score ${a.totalScore} · ${a.interpretation}` : "Draft saved",
          linkedRecordId: item.id,
          linkedRecordKind: "assessment",
          createdAt: now,
          createdBy: currentUserName,
          role: currentRole
        };
        setStore((s) => ({ ...s, timelineEvents: [ev, ...s.timelineEvents] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Created ${a.type} assessment`,
          entity: a.residentId
        });
        return item;
      },
      updateAssessment: (id, patch) => {
        const existing = store.assessments.find((x) => x.id === id);
        if (existing?.locked && !patch.status && !patch.linkedProblemIds && !patch.clinicalComments && !patch.linkedIncidentIds) {
          logAudit({
            user: currentUserName,
            role: currentRole,
            action: "Blocked edit on locked assessment",
            entity: id,
            reason: "Assessment is locked; create a revision"
          });
          return;
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => ({
          ...s,
          assessments: s.assessments.map((a) => {
            if (a.id !== id) return a;
            const audit = [
              ...a.auditTrail || [],
              {
                id: uid(),
                action: "edited",
                byUserId: currentUser.id,
                byUserName: currentUserName,
                byRole: currentRole,
                at: now
              }
            ];
            return { ...a, ...patch, auditTrail: audit };
          })
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated assessment",
          entity: id
        });
      },
      completeAssessment: (id) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => ({
          ...s,
          assessments: s.assessments.map((a) => {
            if (a.id !== id) return a;
            const audit = [
              ...a.auditTrail || [],
              {
                id: uid(),
                action: "completed",
                byUserId: currentUser.id,
                byUserName: currentUserName,
                byRole: currentRole,
                at: now
              },
              {
                id: uid(),
                action: "locked",
                byUserId: currentUser.id,
                byUserName: currentUserName,
                byRole: currentRole,
                at: now
              }
            ];
            return {
              ...a,
              status: "completed",
              locked: true,
              lockedAt: now,
              lockedBy: currentUserName,
              nextReassessmentDate: a.nextReassessmentDate || (a.reviewFrequency ? computeNextReviewDate(a.reviewFrequency, a.customReviewDays) : void 0),
              auditTrail: audit
            };
          })
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Completed & locked assessment",
          entity: id
        });
      },
      createAssessmentRevision: (id, reason) => {
        const prior = store.assessments.find((a) => a.id === id);
        if (!prior) return void 0;
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const newId2 = uid();
        const revision = {
          ...prior,
          id: newId2,
          status: "draft",
          locked: false,
          version: (prior.version || 1) + 1,
          previousVersionId: prior.id,
          supersedesId: prior.id,
          revisionReason: reason,
          date: now,
          assessor: currentUserName,
          assessorRole: currentRole,
          lockedAt: void 0,
          lockedBy: void 0,
          auditTrail: [
            {
              id: uid(),
              action: "created",
              byUserId: currentUser.id,
              byUserName: currentUserName,
              byRole: currentRole,
              at: now,
              reason,
              fromVersionId: prior.id
            }
          ],
          clinicalComments: []
        };
        setStore((s) => ({
          ...s,
          assessments: [
            revision,
            ...s.assessments.map(
              (a) => a.id === id ? {
                ...a,
                supersededById: newId2,
                auditTrail: [
                  ...a.auditTrail || [],
                  {
                    id: uid(),
                    action: "revised",
                    byUserId: currentUser.id,
                    byUserName: currentUserName,
                    byRole: currentRole,
                    at: now,
                    reason
                  },
                  {
                    id: uid(),
                    action: "superseded",
                    byUserId: currentUser.id,
                    byUserName: currentUserName,
                    byRole: currentRole,
                    at: now
                  }
                ]
              } : a
            )
          ]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created assessment revision",
          entity: newId2,
          reason
        });
        return revision;
      },
      assignAssessment: (id, input) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => ({
          ...s,
          assessments: s.assessments.map(
            (a) => a.id === id ? {
              ...a,
              assignedToUserId: input.userId,
              assignedToName: input.userName,
              assignedToRole: input.role,
              assignedAt: now,
              assignedBy: currentUserName,
              dueDate: input.dueDate,
              auditTrail: [
                ...a.auditTrail || [],
                {
                  id: uid(),
                  action: "assigned",
                  byUserId: currentUser.id,
                  byUserName: currentUserName,
                  byRole: currentRole,
                  at: now,
                  reason: `Assigned to ${input.userName} (${input.role}), due ${input.dueDate}`
                }
              ]
            } : a
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Assigned assessment to ${input.userName}`,
          entity: id
        });
      },
      archiveAssessment: (id, reason) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => ({
          ...s,
          assessments: s.assessments.map(
            (a) => a.id === id ? {
              ...a,
              status: "archived",
              archivedBy: currentUserName,
              archivedAt: now,
              archivedReason: reason,
              auditTrail: [
                ...a.auditTrail || [],
                {
                  id: uid(),
                  action: "archived",
                  byUserId: currentUser.id,
                  byUserName: currentUserName,
                  byRole: currentRole,
                  at: now,
                  reason
                }
              ]
            } : a
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Archived assessment",
          entity: id,
          reason
        });
      },
      restoreAssessment: (id) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => ({
          ...s,
          assessments: s.assessments.map(
            (a) => a.id === id ? {
              ...a,
              status: "completed",
              restoredBy: currentUserName,
              restoredAt: now,
              archivedAt: void 0,
              archivedBy: void 0,
              deletedAt: void 0,
              deletedBy: void 0,
              deletedReason: void 0,
              auditTrail: [
                ...a.auditTrail || [],
                {
                  id: uid(),
                  action: "restored",
                  byUserId: currentUser.id,
                  byUserName: currentUserName,
                  byRole: currentRole,
                  at: now
                }
              ]
            } : a
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Restored assessment",
          entity: id
        });
      },
      softDeleteAssessment: (id, reason) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => ({
          ...s,
          assessments: s.assessments.map(
            (a) => a.id === id ? {
              ...a,
              status: "deleted",
              deletedBy: currentUserName,
              deletedAt: now,
              deletedReason: reason,
              auditTrail: [
                ...a.auditTrail || [],
                {
                  id: uid(),
                  action: "deleted",
                  byUserId: currentUser.id,
                  byUserName: currentUserName,
                  byRole: currentRole,
                  at: now,
                  reason
                }
              ]
            } : a
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted assessment (soft)",
          entity: id,
          reason
        });
      },
      addAssessmentComment: (id, body) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const comment = {
          id: uid(),
          authorId: currentUser.id,
          authorName: currentUserName,
          role: currentRole,
          at: now,
          body
        };
        setStore((s) => ({
          ...s,
          assessments: s.assessments.map(
            (a) => a.id === id ? {
              ...a,
              clinicalComments: [...a.clinicalComments || [], comment],
              auditTrail: [
                ...a.auditTrail || [],
                {
                  id: uid(),
                  action: "commented",
                  byUserId: currentUser.id,
                  byUserName: currentUserName,
                  byRole: currentRole,
                  at: now
                }
              ]
            } : a
          )
        }));
      },
      fireReviewTrigger: (input) => {
        const affected = TRIGGER_TO_TYPES[input.trigger] || [];
        const ev = {
          id: uid(),
          residentId: input.residentId,
          trigger: input.trigger,
          sourceModule: input.sourceModule,
          sourceRecordId: input.sourceRecordId,
          at: (/* @__PURE__ */ new Date()).toISOString(),
          byUserName: currentUserName,
          affectedAssessmentTypes: affected,
          note: input.note
        };
        setStore((s) => ({ ...s, assessmentTriggerEvents: [ev, ...s.assessmentTriggerEvents] }));
        const resident = store.residents.find((r) => r.id === input.residentId);
        const residentName = resident ? `${resident.firstName} ${resident.lastName}` : "Resident";
        for (const t of affected) {
          const latest = store.assessments.find(
            (a) => a.residentId === input.residentId && a.type === t && a.status === "completed"
          );
          if (latest) {
            setStore((s) => ({
              ...s,
              alerts: [
                {
                  id: uid(),
                  residentId: input.residentId,
                  title: `${t.replace("_", " ")} reassessment required`,
                  description: `${input.trigger.replace(/_/g, " ")} → reassess ${t.replace("_", " ")} for ${residentName}`,
                  priority: "high",
                  createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                  acknowledged: false,
                  linkedAssessmentId: latest.id
                },
                ...s.alerts
              ]
            }));
          }
        }
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Triggered reassessment: ${input.trigger}`,
          entity: input.residentId,
          reason: input.note
        });
      },
      addCarePlan: (c) => {
        const item = {
          ...c,
          id: uid(),
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName,
          version: c.version || 1,
          status: c.status || "active"
        };
        setStore((s) => ({ ...s, carePlans: [item, ...s.carePlans] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created care plan",
          entity: item.id
        });
        return item;
      },
      updateCarePlan: (id, patch) => {
        setStore((s) => ({
          ...s,
          carePlans: s.carePlans.map(
            (c) => c.id === id ? { ...c, ...patch, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), updatedBy: currentUserName } : c
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated care plan",
          entity: id
        });
      },
      reviseCarePlan: (id, reason) => {
        const prior = store.carePlans.find((c) => c.id === id);
        if (!prior) return void 0;
        const newPlan = {
          ...prior,
          id: uid(),
          version: (prior.version || 1) + 1,
          supersedesId: prior.id,
          revisionReason: reason,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName,
          status: "active"
        };
        setStore((s) => ({
          ...s,
          carePlans: [
            newPlan,
            ...s.carePlans.map((c) => c.id === id ? { ...c, status: "superseded" } : c)
          ]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Revised care plan",
          entity: id,
          reason
        });
        return newPlan;
      },
      addCarePlanEvaluation: (e) => {
        const item = { ...e, id: uid() };
        setStore((s) => ({ ...s, carePlanEvaluations: [item, ...s.carePlanEvaluations] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Care plan evaluation",
          entity: e.carePlanId
        });
        return item;
      },
      addCarePlanReview: (r) => {
        const item = { ...r, id: uid() };
        setStore((s) => ({ ...s, carePlanReviews: [item, ...s.carePlanReviews] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Care plan review",
          entity: r.carePlanId
        });
        return item;
      },
      addCarePlanFromTemplate: (templateId, residentId, assessment) => {
        const t = store.carePlanTemplates.find((x) => x.id === templateId);
        if (!t) return void 0;
        const now = /* @__PURE__ */ new Date();
        const dayStr = (d) => new Date(now.getTime() + d * 864e5).toISOString().slice(0, 10);
        const goals = t.smartGoals.map((g, i) => ({
          id: `g-${uid()}-${i}`,
          title: g.title,
          description: g.description,
          priority: g.priority,
          status: "not_started",
          targetDate: dayStr(g.targetDays),
          expectedOutcome: g.description
        }));
        const interventionsSpec = t.interventions.map((it, i) => ({
          id: `i-${uid()}-${i}`,
          name: it.name,
          description: it.description,
          frequency: it.frequency,
          assignedRole: it.assignedRole,
          startDate: dayStr(0),
          reviewDate: dayStr(t.reviewFrequencyDays),
          priority: it.priority,
          status: "pending"
        }));
        const outcomeMeasures = t.outcomeMeasures.map((o, i) => ({
          id: `o-${uid()}-${i}`,
          name: o.name,
          target: o.target,
          dateMeasured: dayStr(0),
          trend: "stable"
        }));
        const newPlan = {
          id: uid(),
          residentId,
          title: t.title,
          category: t.category,
          problem: t.problemStatement,
          problemStatement: t.problemStatement,
          goal: t.smartGoals[0]?.description || "Address identified needs.",
          identifiedNeeds: t.identifiedNeeds,
          interventions: t.interventions.map((i) => `${i.name} (${i.frequency})`),
          goals,
          interventionsSpec,
          outcomeMeasures,
          assignedStaff: "Care team",
          frequency: t.interventions[0]?.frequency || "Per care plan",
          reviewDate: dayStr(t.reviewFrequencyDays),
          evaluationDate: dayStr(t.evaluationFrequencyDays),
          status: "active",
          priority: assessment?.riskLevel === "very_high" ? "critical" : assessment?.riskLevel === "high" ? "high" : "medium",
          createdAt: now.toISOString(),
          createdBy: currentUserName,
          version: 1,
          templateId,
          linkedAssessmentId: assessment?.id,
          assessmentScoreSnapshot: assessment ? {
            type: assessment.type,
            totalScore: assessment.totalScore,
            riskLevel: assessment.riskLevel,
            date: assessment.date,
            interpretation: assessment.interpretation
          } : void 0
        };
        setStore((s) => ({ ...s, carePlans: [newPlan, ...s.carePlans] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Created care plan from template '${t.title}'`,
          entity: newPlan.id
        });
        return newPlan;
      },
      saveCarePlanTemplate: (t) => {
        setStore((s) => ({
          ...s,
          carePlanTemplates: s.carePlanTemplates.some((x) => x.id === t.id) ? s.carePlanTemplates.map((x) => x.id === t.id ? t : x) : [...s.carePlanTemplates, t]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Saved template '${t.title}'`,
          entity: t.id
        });
      },
      deleteCarePlanTemplate: (id) => {
        setStore((s) => ({
          ...s,
          carePlanTemplates: s.carePlanTemplates.filter((t) => t.id !== id || t.builtIn)
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted template",
          entity: id
        });
      },
      addInterventionLog: (l) => {
        const item = { ...l, id: uid() };
        setStore((s) => ({ ...s, interventionLogs: [item, ...s.interventionLogs] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Logged intervention: ${l.outcome}`,
          entity: l.carePlanId
        });
        return item;
      },
      recordReadReceipt: (entityType, entityId) => {
        setStore((s) => {
          const exists = s.readReceipts.find(
            (r) => r.entityId === entityId && r.userId === currentUser.id
          );
          if (exists) return s;
          const item = {
            id: uid(),
            entityType,
            entityId,
            userId: currentUser.id,
            userName: currentUserName,
            role: currentRole,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
          return { ...s, readReceipts: [item, ...s.readReceipts] };
        });
      },
      addIntervention: (i) => {
        const item = { ...i, id: uid() };
        const ev = {
          id: uid(),
          residentId: i.residentId,
          type: "intervention.created",
          title: `Intervention created: ${i.intervention}`,
          description: `${i.outcome}${i.notes ? ` · ${i.notes}` : ""}`,
          createdAt: i.date,
          createdBy: i.staff,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "intervention"
        };
        setStore((s) => ({
          ...s,
          interventions: [item, ...s.interventions],
          timelineEvents: [ev, ...s.timelineEvents]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Created intervention: ${i.intervention}`,
          entity: item.id
        });
        return item;
      },
      addNote: (n) => {
        const item = { ...n, id: uid() };
        const ev = {
          id: uid(),
          residentId: n.residentId,
          type: "note.created",
          title: `Daily note (${n.shift})`,
          description: n.observation,
          createdAt: n.date,
          createdBy: n.staff,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "daily_note"
        };
        setStore((s) => ({
          ...s,
          notes: [item, ...s.notes],
          timelineEvents: [ev, ...s.timelineEvents]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created daily note",
          entity: item.id
        });
        return item;
      },
      addEvaluation: (e) => {
        const item = { ...e, id: uid() };
        const ev = {
          id: uid(),
          residentId: e.residentId,
          type: "careplan.evaluated",
          title: `Care plan evaluation: ${e.outcomeRating}`,
          description: e.summary,
          createdAt: e.date,
          createdBy: e.evaluatedBy,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "evaluation"
        };
        setStore((s) => ({
          ...s,
          evaluations: [item, ...s.evaluations],
          timelineEvents: [ev, ...s.timelineEvents]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created evaluation",
          entity: item.id
        });
        return item;
      },
      acknowledgeAlert: (id) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => ({
          ...s,
          alerts: s.alerts.map(
            (a) => a.id === id ? { ...a, acknowledged: true, acknowledgedBy: currentUserName, acknowledgedAt: now } : a
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Acknowledged alert",
          entity: id
        });
      },
      resolveAlert: (id) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => ({
          ...s,
          alerts: s.alerts.map(
            (a) => a.id === id ? { ...a, resolvedBy: currentUserName, resolvedAt: now } : a
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Resolved alert",
          entity: id
        });
      },
      acknowledgeActionAlert: (input) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => ({
          ...s,
          alertWorkflow: {
            ...s.alertWorkflow,
            [input.id]: {
              ...input,
              acknowledgedBy: currentUserName,
              acknowledgedAt: now
            }
          }
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Acknowledged action alert",
          entity: input.id
        });
      },
      addAlert: (a) => setStore((s) => ({
        ...s,
        alerts: [
          { ...a, id: uid(), createdAt: (/* @__PURE__ */ new Date()).toISOString(), acknowledged: false },
          ...s.alerts
        ]
      })),
      updateTask: (id, patch) => setStore((s) => ({
        ...s,
        tasks: s.tasks.map((t) => t.id === id ? { ...t, ...patch } : t)
      })),
      softDeleteTask: (id, reason) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const task = store.tasks.find((t) => t.id === id);
        setStore((s) => ({
          ...s,
          tasks: s.tasks.map(
            (t) => t.id === id ? {
              ...t,
              status: "deleted",
              deletedBy: currentUserName,
              deletedAt: now,
              deleteReason: reason?.trim() || void 0
            } : t
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Deleted task: ${task?.title || id}`,
          entity: id,
          reason: reason?.trim() || void 0
        });
      },
      addTask: (t) => {
        const item = { ...t, id: uid() };
        const ev = {
          id: uid(),
          residentId: t.residentId,
          type: "task.created",
          title: `Task created: ${t.title}`,
          description: t.description,
          createdAt: t.dueDate,
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "task"
        };
        setStore((s) => ({
          ...s,
          tasks: [item, ...s.tasks],
          timelineEvents: [ev, ...s.timelineEvents]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Created task: ${t.title}`,
          entity: item.id
        });
        return item;
      },
      // -------------------- INCIDENTS --------------------
      addIncident: (i) => {
        const item = {
          ...i,
          id: uid(),
          recordStatus: i.recordStatus || "active",
          createdAt: i.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: i.createdBy || currentUserName,
          createdByRole: i.createdByRole || currentRole,
          status: i.status || "open"
        };
        const ev = {
          id: uid(),
          residentId: i.residentId,
          type: "incident.created",
          title: `Incident: ${i.type.replace("_", " ")} (${i.severity})`,
          description: i.description,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "incident",
          priority: i.severity === "critical" ? "critical" : i.severity === "high" ? "high" : "medium"
        };
        setStore((s) => ({
          ...s,
          incidents: [item, ...s.incidents],
          timelineEvents: [ev, ...s.timelineEvents]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Created incident (${item.status})`,
          entity: item.id,
          after: JSON.stringify({ type: i.type, severity: i.severity })
        });
        return item;
      },
      updateIncident: (id, patch) => {
        setStore((s) => ({
          ...s,
          incidents: s.incidents.map(
            (i) => i.id === id ? { ...i, ...patch, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), updatedBy: currentUserName } : i
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated incident",
          entity: id,
          after: JSON.stringify(patch)
        });
      },
      archiveIncident: (id) => {
        setStore((s) => ({
          ...s,
          incidents: s.incidents.map(
            (i) => i.id === id ? {
              ...i,
              recordStatus: "archived",
              archivedAt: (/* @__PURE__ */ new Date()).toISOString(),
              archivedBy: currentUserName
            } : i
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Archived incident",
          entity: id
        });
      },
      restoreIncident: (id) => {
        setStore((s) => ({
          ...s,
          incidents: s.incidents.map(
            (i) => i.id === id ? {
              ...i,
              recordStatus: "active",
              archivedAt: void 0,
              archivedBy: void 0,
              deletedAt: void 0,
              deletedBy: void 0,
              deletedReason: void 0
            } : i
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Restored incident",
          entity: id
        });
      },
      softDeleteIncident: (id, reason) => {
        setStore((s) => ({
          ...s,
          incidents: s.incidents.map(
            (i) => i.id === id ? {
              ...i,
              recordStatus: "deleted",
              deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
              deletedBy: currentUserName,
              deletedReason: reason
            } : i
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted incident (soft)",
          entity: id,
          reason
        });
      },
      duplicateIncident: (id) => {
        const src = store.incidents.find((i) => i.id === id);
        if (!src) return void 0;
        const copy = {
          ...src,
          id: uid(),
          date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          status: "draft",
          recordStatus: "active",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName,
          createdByRole: currentRole,
          updatedAt: void 0,
          updatedBy: void 0,
          archivedAt: void 0,
          archivedBy: void 0,
          deletedAt: void 0,
          deletedBy: void 0,
          deletedReason: void 0,
          closedAt: void 0,
          closedBy: void 0,
          reopenedAt: void 0,
          reopenedBy: void 0
        };
        setStore((s) => ({ ...s, incidents: [copy, ...s.incidents] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Duplicated incident",
          entity: copy.id,
          reason: `Copied from ${id}`
        });
        return copy;
      },
      closeIncident: (id) => {
        setStore((s) => ({
          ...s,
          incidents: s.incidents.map(
            (i) => i.id === id ? {
              ...i,
              status: "closed",
              closedAt: (/* @__PURE__ */ new Date()).toISOString(),
              closedBy: currentUserName
            } : i
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Closed incident",
          entity: id
        });
      },
      reopenIncident: (id) => {
        setStore((s) => ({
          ...s,
          incidents: s.incidents.map(
            (i) => i.id === id ? {
              ...i,
              status: "open",
              reopenedAt: (/* @__PURE__ */ new Date()).toISOString(),
              reopenedBy: currentUserName,
              closedAt: void 0,
              closedBy: void 0
            } : i
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Reopened incident",
          entity: id
        });
      },
      submitIncident: (id) => {
        setStore((s) => ({
          ...s,
          incidents: s.incidents.map(
            (i) => i.id === id ? {
              ...i,
              status: "open",
              updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
              updatedBy: currentUserName
            } : i
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Submitted incident draft",
          entity: id
        });
      },
      addMDTNote: (m) => {
        const item = { ...m, id: uid() };
        const ev = {
          id: uid(),
          residentId: m.residentId,
          type: "mdt.created",
          title: "MDT note created",
          description: m.discussion,
          createdAt: m.date,
          createdBy: m.authoredBy,
          role: m.role,
          linkedRecordId: item.id,
          linkedRecordKind: "mdt_note"
        };
        setStore((s) => ({
          ...s,
          mdtNotes: [item, ...s.mdtNotes],
          timelineEvents: [ev, ...s.timelineEvents]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created MDT note",
          entity: item.id
        });
        return item;
      },
      // -------------------- VISITORS --------------------
      addVisitor: (v) => {
        const item = {
          ...v,
          id: uid(),
          recordStatus: v.recordStatus || "active",
          status: v.status || "checked_in",
          createdAt: v.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: v.createdBy || currentUserName,
          createdByRole: v.createdByRole || currentRole
        };
        const ev = {
          id: uid(),
          residentId: v.residentId,
          type: "visitor.logged",
          title: `Visitor: ${v.visitorName} (${v.relationship})`,
          description: v.notes,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "visitor"
        };
        setStore((s) => ({
          ...s,
          visitors: [item, ...s.visitors],
          timelineEvents: [ev, ...s.timelineEvents]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created visitor",
          entity: item.id,
          after: JSON.stringify({ visitor: v.visitorName })
        });
        return item;
      },
      updateVisitor: (id, patch) => {
        setStore((s) => ({
          ...s,
          visitors: s.visitors.map(
            (v) => v.id === id ? { ...v, ...patch, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), updatedBy: currentUserName } : v
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated visitor",
          entity: id,
          after: JSON.stringify(patch)
        });
      },
      archiveVisitor: (id) => {
        setStore((s) => ({
          ...s,
          visitors: s.visitors.map(
            (v) => v.id === id ? {
              ...v,
              recordStatus: "archived",
              archivedAt: (/* @__PURE__ */ new Date()).toISOString(),
              archivedBy: currentUserName
            } : v
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Archived visitor",
          entity: id
        });
      },
      restoreVisitor: (id) => {
        setStore((s) => ({
          ...s,
          visitors: s.visitors.map(
            (v) => v.id === id ? {
              ...v,
              recordStatus: "active",
              archivedAt: void 0,
              archivedBy: void 0,
              deletedAt: void 0,
              deletedBy: void 0,
              deletedReason: void 0
            } : v
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Restored visitor",
          entity: id
        });
      },
      softDeleteVisitor: (id, reason) => {
        setStore((s) => ({
          ...s,
          visitors: s.visitors.map(
            (v) => v.id === id ? {
              ...v,
              recordStatus: "deleted",
              deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
              deletedBy: currentUserName,
              deletedReason: reason
            } : v
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted visitor (soft)",
          entity: id,
          reason
        });
      },
      cancelVisitor: (id, reason) => {
        setStore((s) => ({
          ...s,
          visitors: s.visitors.map(
            (v) => v.id === id ? {
              ...v,
              status: "cancelled",
              cancelledReason: reason,
              updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
              updatedBy: currentUserName
            } : v
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Cancelled visit",
          entity: id,
          reason
        });
      },
      completeVisitor: (id) => {
        setStore((s) => ({
          ...s,
          visitors: s.visitors.map(
            (v) => v.id === id ? {
              ...v,
              status: "completed",
              updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
              updatedBy: currentUserName
            } : v
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Completed visit",
          entity: id
        });
      },
      // -------------------- OUTINGS --------------------
      addOuting: (o) => {
        const item = {
          ...o,
          id: uid(),
          recordStatus: o.recordStatus || "active",
          status: o.status || "planned",
          createdAt: o.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: o.createdBy || currentUserName,
          createdByRole: o.createdByRole || currentRole
        };
        const ev = {
          id: uid(),
          residentId: o.residentId,
          type: "outing.started",
          title: `Outing: ${o.destination}`,
          description: o.notes,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "outing"
        };
        setStore((s) => ({
          ...s,
          outings: [item, ...s.outings],
          timelineEvents: [ev, ...s.timelineEvents]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created outing",
          entity: item.id,
          after: JSON.stringify({ destination: o.destination })
        });
        return item;
      },
      updateOuting: (id, patch) => {
        setStore((s) => ({
          ...s,
          outings: s.outings.map(
            (o) => o.id === id ? { ...o, ...patch, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), updatedBy: currentUserName } : o
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated outing",
          entity: id,
          after: JSON.stringify(patch)
        });
      },
      archiveOuting: (id) => {
        setStore((s) => ({
          ...s,
          outings: s.outings.map(
            (o) => o.id === id ? {
              ...o,
              recordStatus: "archived",
              archivedAt: (/* @__PURE__ */ new Date()).toISOString(),
              archivedBy: currentUserName
            } : o
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Archived outing",
          entity: id
        });
      },
      restoreOuting: (id) => {
        setStore((s) => ({
          ...s,
          outings: s.outings.map(
            (o) => o.id === id ? {
              ...o,
              recordStatus: "active",
              archivedAt: void 0,
              archivedBy: void 0,
              deletedAt: void 0,
              deletedBy: void 0,
              deletedReason: void 0
            } : o
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Restored outing",
          entity: id
        });
      },
      softDeleteOuting: (id, reason) => {
        setStore((s) => ({
          ...s,
          outings: s.outings.map(
            (o) => o.id === id ? {
              ...o,
              recordStatus: "deleted",
              deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
              deletedBy: currentUserName,
              deletedReason: reason
            } : o
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted outing (soft)",
          entity: id,
          reason
        });
      },
      recordOutingDeparture: (id, time) => {
        setStore((s) => ({
          ...s,
          outings: s.outings.map(
            (o) => o.id === id ? {
              ...o,
              departureTime: time,
              status: "departed",
              updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
              updatedBy: currentUserName
            } : o
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Outing departure recorded (${time})`,
          entity: id
        });
      },
      recordOutingReturn: (id, time, outcome) => {
        setStore((s) => {
          const o = s.outings.find((x) => x.id === id);
          const ev = o ? {
            id: uid(),
            residentId: o.residentId,
            type: "outing.returned",
            title: `Outing return: ${o.destination}`,
            description: outcome,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            createdBy: currentUserName,
            role: currentRole,
            linkedRecordId: id,
            linkedRecordKind: "outing"
          } : null;
          return {
            ...s,
            outings: s.outings.map(
              (x) => x.id === id ? {
                ...x,
                returnTime: time,
                outcomeNotes: outcome ?? x.outcomeNotes,
                status: "returned",
                updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
                updatedBy: currentUserName
              } : x
            ),
            timelineEvents: ev ? [ev, ...s.timelineEvents] : s.timelineEvents
          };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Outing return recorded (${time})`,
          entity: id
        });
      },
      cancelOuting: (id, reason) => {
        setStore((s) => ({
          ...s,
          outings: s.outings.map(
            (o) => o.id === id ? {
              ...o,
              status: "cancelled",
              cancelledReason: reason,
              updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
              updatedBy: currentUserName
            } : o
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Cancelled outing",
          entity: id,
          reason
        });
      },
      closeOuting: (id) => {
        setStore((s) => ({
          ...s,
          outings: s.outings.map(
            (o) => o.id === id ? {
              ...o,
              status: "closed",
              updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
              updatedBy: currentUserName
            } : o
          )
        }));
        logAudit({ user: currentUserName, role: currentRole, action: "Closed outing", entity: id });
      },
      // -------------------- HANDOVERS --------------------
      addHandover: (h) => {
        const item = {
          ...h,
          id: uid(),
          recordStatus: h.recordStatus || "active",
          status: h.status || "active",
          createdAt: h.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: h.createdBy || currentUserName,
          createdByRole: h.createdByRole || currentRole
        };
        const ev = {
          id: uid(),
          residentId: h.residentId,
          type: "handover.created",
          title: `Handover (${h.shift})`,
          description: h.summary,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "handover",
          priority: h.priority
        };
        setStore((s) => ({
          ...s,
          handovers: [item, ...s.handovers],
          timelineEvents: [ev, ...s.timelineEvents]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Created handover (${item.shift})`,
          entity: item.id
        });
        return item;
      },
      updateHandover: (id, patch) => {
        setStore((s) => ({
          ...s,
          handovers: s.handovers.map(
            (h) => h.id === id ? { ...h, ...patch, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), updatedBy: currentUserName } : h
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated handover",
          entity: id,
          after: JSON.stringify(patch)
        });
      },
      archiveHandover: (id) => {
        setStore((s) => ({
          ...s,
          handovers: s.handovers.map(
            (h) => h.id === id ? {
              ...h,
              recordStatus: "archived",
              archivedAt: (/* @__PURE__ */ new Date()).toISOString(),
              archivedBy: currentUserName
            } : h
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Archived handover",
          entity: id
        });
      },
      restoreHandover: (id) => {
        setStore((s) => ({
          ...s,
          handovers: s.handovers.map(
            (h) => h.id === id ? {
              ...h,
              recordStatus: "active",
              archivedAt: void 0,
              archivedBy: void 0,
              deletedAt: void 0,
              deletedBy: void 0,
              deletedReason: void 0
            } : h
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Restored handover",
          entity: id
        });
      },
      softDeleteHandover: (id, reason) => {
        setStore((s) => ({
          ...s,
          handovers: s.handovers.map(
            (h) => h.id === id ? {
              ...h,
              recordStatus: "deleted",
              deletedAt: (/* @__PURE__ */ new Date()).toISOString(),
              deletedBy: currentUserName,
              deletedReason: reason
            } : h
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted handover (soft)",
          entity: id,
          reason
        });
      },
      markHandoverRead: (id) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => {
          const h = s.handovers.find((x) => x.id === id);
          const alreadyRead = Array.isArray(h?.readBy) && h?.readBy.includes(currentUserName);
          return {
            ...s,
            handovers: s.handovers.map(
              (x) => x.id === id ? {
                ...x,
                status: x.status === "acknowledged" ? x.status : "read",
                readBy: alreadyRead ? x.readBy : [...x.readBy || [], currentUserName],
                readAt: now,
                readReceipts: alreadyRead ? x.readReceipts : [
                  ...x.readReceipts || [],
                  { user: currentUserName, role: currentRole, at: now }
                ]
              } : x
            )
          };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Read handover",
          entity: id
        });
      },
      acknowledgeHandover: (id) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => {
          const h = s.handovers.find((x) => x.id === id);
          const existingAcknowledgedBy = Array.isArray(h?.acknowledgedBy) ? h?.acknowledgedBy || [] : h?.acknowledgedBy ? [h.acknowledgedBy] : [];
          const alreadyAcknowledged = existingAcknowledgedBy.includes(currentUserName);
          const existingReadBy = Array.isArray(h?.readBy) ? h?.readBy || [] : h?.readBy ? [String(h.readBy)] : [];
          const alreadyRead = existingReadBy.includes(currentUserName);
          const ev = h ? {
            id: uid(),
            residentId: h.residentId,
            type: "handover.acknowledged",
            title: `Handover acknowledged (${h.shift})`,
            createdAt: now,
            createdBy: currentUserName,
            role: currentRole,
            linkedRecordId: id,
            linkedRecordKind: "handover"
          } : null;
          return {
            ...s,
            handovers: s.handovers.map(
              (x) => x.id === id ? {
                ...x,
                readBy: alreadyRead ? existingReadBy : [...existingReadBy, currentUserName],
                readAt: now,
                readReceipts: alreadyRead ? x.readReceipts : [
                  ...x.readReceipts || [],
                  { user: currentUserName, role: currentRole, at: now }
                ],
                acknowledgedBy: alreadyAcknowledged ? existingAcknowledgedBy : [...existingAcknowledgedBy, currentUserName],
                acknowledgedAt: now,
                acknowledgements: alreadyAcknowledged ? x.acknowledgements : [
                  ...x.acknowledgements || [],
                  { user: currentUserName, role: currentRole, at: now }
                ],
                status: "acknowledged"
              } : x
            ),
            timelineEvents: ev ? [ev, ...s.timelineEvents] : s.timelineEvents
          };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Acknowledged handover",
          entity: id
        });
      },
      completeHandover: (id) => {
        setStore((s) => ({
          ...s,
          handovers: s.handovers.map(
            (h) => h.id === id ? {
              ...h,
              status: "completed",
              completedAt: (/* @__PURE__ */ new Date()).toISOString(),
              completedBy: currentUserName
            } : h
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Completed handover",
          entity: id
        });
      },
      closeHandover: (id) => {
        setStore((s) => ({
          ...s,
          handovers: s.handovers.map(
            (h) => h.id === id ? {
              ...h,
              status: "closed",
              closedAt: (/* @__PURE__ */ new Date()).toISOString(),
              closedBy: currentUserName
            } : h
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Closed handover",
          entity: id
        });
      },
      duplicateHandover: (id) => {
        const src = store.handovers.find((h) => h.id === id);
        if (!src) return void 0;
        const copy = {
          ...src,
          id: uid(),
          date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          status: "open",
          recordStatus: "active",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName,
          createdByRole: currentRole,
          acknowledgedAt: void 0,
          acknowledgedBy: void 0,
          completedAt: void 0,
          completedBy: void 0,
          closedAt: void 0,
          closedBy: void 0,
          archivedAt: void 0,
          archivedBy: void 0,
          deletedAt: void 0,
          deletedBy: void 0,
          deletedReason: void 0,
          updatedAt: void 0,
          updatedBy: void 0
        };
        setStore((s) => ({ ...s, handovers: [copy, ...s.handovers] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Duplicated handover",
          entity: copy.id,
          reason: `Copied from ${id}`
        });
        return copy;
      },
      addObservation: (o) => {
        const item = { ...o, id: uid() };
        const ev = {
          id: uid(),
          residentId: o.residentId,
          type: "chart.observation",
          title: "Observation recorded",
          description: o.comments || o.behaviour,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "observation"
        };
        setStore((s) => ({
          ...s,
          observations: [item, ...s.observations],
          timelineEvents: [ev, ...s.timelineEvents]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Recorded observation",
          entity: o.residentId
        });
        return item;
      },
      addWeight: (w) => {
        const item = { ...w, id: uid() };
        const ev = {
          id: uid(),
          residentId: w.residentId,
          type: "chart.weight",
          title: `Weight ${w.weightKg} kg`,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "weight"
        };
        const prior = store.weights.filter((x) => x.residentId === w.residentId);
        const baseline = prior.length ? prior[prior.length - 1].weightKg : w.weightKg;
        const pct = baseline ? (baseline - w.weightKg) / baseline * 100 : 0;
        let newAlerts = [];
        if (pct >= 5)
          newAlerts.push({
            id: uid(),
            residentId: w.residentId,
            title: `Weight loss ${pct.toFixed(1)}%`,
            description: `From ${baseline}kg → ${w.weightKg}kg`,
            priority: pct >= 10 ? "critical" : "high",
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            acknowledged: false
          });
        setStore((s) => ({
          ...s,
          weights: [item, ...s.weights],
          timelineEvents: [ev, ...s.timelineEvents],
          alerts: [...newAlerts, ...s.alerts]
        }));
        return item;
      },
      addFluid: (f) => {
        const item = { ...f, id: uid() };
        setStore((s) => {
          const totalToday = [item, ...s.fluids].filter((x) => x.residentId === f.residentId && x.date === f.date).reduce((sum, x) => sum + x.amountMl, 0);
          let newAlerts = [];
          const dayDone = new Date(f.date).getTime() < (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0);
          if (dayDone && totalToday < 1200 && !s.alerts.some(
            (a) => a.residentId === f.residentId && a.title.includes("Hydration") && !a.acknowledged
          )) {
            newAlerts.push({
              id: uid(),
              residentId: f.residentId,
              title: "Hydration below target",
              description: `${totalToday}ml on ${f.date}`,
              priority: "high",
              createdAt: (/* @__PURE__ */ new Date()).toISOString(),
              acknowledged: false
            });
          }
          const ev = {
            id: uid(),
            residentId: f.residentId,
            type: "chart.fluid",
            title: `Fluid ${f.amountMl}ml ${f.type}`,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            createdBy: currentUserName,
            role: currentRole,
            linkedRecordId: item.id,
            linkedRecordKind: "fluid"
          };
          return {
            ...s,
            fluids: [item, ...s.fluids],
            timelineEvents: [ev, ...s.timelineEvents],
            alerts: [...newAlerts, ...s.alerts]
          };
        });
        return item;
      },
      addFood: (f) => {
        const item = { ...f, id: uid() };
        setStore((s) => {
          const recent = [item, ...s.foods].filter((x) => x.residentId === f.residentId).slice(0, 3);
          const allPoor = recent.length >= 3 && recent.every((x) => x.intake === "little" || x.intake === "none");
          let newAlerts = [];
          if (allPoor && !s.alerts.some(
            (a) => a.residentId === f.residentId && a.title.includes("Nutrition") && !a.acknowledged
          )) {
            newAlerts.push({
              id: uid(),
              residentId: f.residentId,
              title: "Nutrition concern",
              description: "3 consecutive poor intakes",
              priority: "high",
              createdAt: (/* @__PURE__ */ new Date()).toISOString(),
              acknowledged: false
            });
          }
          const ev = {
            id: uid(),
            residentId: f.residentId,
            type: "chart.food",
            title: `${f.meal}: ${f.intake}`,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            createdBy: currentUserName,
            role: currentRole,
            linkedRecordId: item.id,
            linkedRecordKind: "food"
          };
          return {
            ...s,
            foods: [item, ...s.foods],
            timelineEvents: [ev, ...s.timelineEvents],
            alerts: [...newAlerts, ...s.alerts]
          };
        });
        return item;
      },
      addPain: (p) => {
        const item = { ...p, id: uid() };
        setStore((s) => {
          const last = s.pains.filter((x) => x.residentId === p.residentId).slice(0, 2);
          let newAlerts = [];
          if (p.score >= 7 || last[0] && p.score > last[0].score + 2) {
            newAlerts.push({
              id: uid(),
              residentId: p.residentId,
              title: `Pain ${p.score}/10`,
              description: p.location ? `Location: ${p.location}` : "Pain escalation",
              priority: p.score >= 8 ? "critical" : "high",
              createdAt: (/* @__PURE__ */ new Date()).toISOString(),
              acknowledged: false
            });
          }
          const ev = {
            id: uid(),
            residentId: p.residentId,
            type: "chart.pain",
            title: `Pain ${p.score}/10`,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            createdBy: currentUserName,
            role: currentRole,
            linkedRecordId: item.id,
            linkedRecordKind: "pain"
          };
          return {
            ...s,
            pains: [item, ...s.pains],
            timelineEvents: [ev, ...s.timelineEvents],
            alerts: [...newAlerts, ...s.alerts]
          };
        });
        return item;
      },
      addSleep: (sl) => {
        const item = { ...sl, id: uid() };
        const ev = {
          id: uid(),
          residentId: sl.residentId,
          type: "chart.sleep",
          title: `Sleep ${sl.hoursSlept}h (${sl.quality})`,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "sleep"
        };
        setStore((s) => ({
          ...s,
          sleeps: [item, ...s.sleeps],
          timelineEvents: [ev, ...s.timelineEvents]
        }));
        return item;
      },
      addBowel: (b) => {
        const item = { ...b, id: uid() };
        const ev = {
          id: uid(),
          residentId: b.residentId,
          type: "chart.bowel",
          title: `Bowel (Bristol ${b.bristolType})`,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "bowel"
        };
        setStore((s) => ({
          ...s,
          bowels: [item, ...s.bowels],
          timelineEvents: [ev, ...s.timelineEvents]
        }));
        return item;
      },
      addBehaviour: (b) => {
        const item = { ...b, id: uid() };
        const ev = {
          id: uid(),
          residentId: b.residentId,
          type: "chart.behaviour",
          title: b.behaviour,
          description: b.intervention,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "behaviour"
        };
        setStore((s) => ({
          ...s,
          behaviours: [item, ...s.behaviours],
          timelineEvents: [ev, ...s.timelineEvents]
        }));
        return item;
      },
      addIncidentAction: (a) => {
        const item = { ...a, id: uid() };
        setStore((s) => ({ ...s, incidentActions: [item, ...s.incidentActions] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Incident follow-up action",
          entity: a.incidentId
        });
        return item;
      },
      generateShiftSummary: (date, shift) => {
        const dayNotes = store.notes.filter(
          (n) => n.date.slice(0, 10) === date && n.shift === shift
        );
        const dayInter = store.interventionLogs.filter(
          (l) => l.date === date && l.outcome === "completed"
        );
        const dayTasks = store.tasks.filter(
          (t) => t.dueDate.slice(0, 10) === date && t.status === "completed"
        );
        const dayInc = store.incidents.filter((i) => i.date.slice(0, 10) === date);
        const dayAlerts = store.alerts.filter((a) => a.createdAt.slice(0, 10) === date);
        const outstandingTasks = store.tasks.filter(
          (t) => t.status !== "completed" && t.status !== "deleted"
        ).length;
        const outstandingHandovers = store.handovers.filter(
          (h) => h.status !== "acknowledged" && h.status !== "closed"
        ).length;
        const residentsSeen = new Set(dayNotes.map((n) => n.residentId)).size;
        const item = {
          id: uid(),
          date,
          shift,
          generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          generatedBy: currentUserName,
          residentsSeen,
          notesAdded: dayNotes.length,
          interventionsCompleted: dayInter.length,
          tasksCompleted: dayTasks.length,
          incidents: dayInc.length,
          alerts: dayAlerts.length,
          outstandingTasks,
          outstandingHandovers
        };
        setStore((s) => ({ ...s, shiftSummaries: [item, ...s.shiftSummaries] }));
        return item;
      },
      logAudit,
      // ============ Unified Care Plan / Problems ============
      ensureResidentCarePlan: (residentId) => {
        const existing = store.residentCarePlans.find(
          (p) => p.residentId === residentId && p.status === "active"
        );
        if (existing) return existing;
        const item = {
          id: newId("rcp"),
          residentId,
          status: "active",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName
        };
        setStore((s) => ({ ...s, residentCarePlans: [item, ...s.residentCarePlans] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created resident care plan",
          entity: item.id
        });
        return item;
      },
      addProblem: (input) => {
        let rcp = store.residentCarePlans.find(
          (p) => p.residentId === input.residentId && p.status === "active"
        );
        let rcpId = rcp?.id;
        const newRcp = !rcp ? {
          id: newId("rcp"),
          residentId: input.residentId,
          status: "active",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName
        } : null;
        if (newRcp) rcpId = newRcp.id;
        const item = {
          id: newId("prob"),
          residentCarePlanId: rcpId,
          residentId: input.residentId,
          category: input.category,
          customCategoryLabel: input.customCategoryLabel,
          problemStatement: input.problemStatement,
          riskLevel: input.riskLevel,
          sourceAssessmentId: input.sourceAssessmentId,
          sourceAssessmentType: input.sourceAssessmentType,
          createdBy: currentUserName,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          evaluationDate: input.evaluationDate || new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
          reviewDate: input.reviewDate || new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10),
          status: "active"
        };
        const hist = {
          id: newId("hist"),
          problemId: item.id,
          timestamp: item.createdAt,
          userId: currentUser.id,
          userName: currentUserName,
          role: currentRole,
          action: "created"
        };
        const ev = {
          id: newId("tle"),
          residentId: input.residentId,
          type: "careplan.created",
          title: `Care plan problem added: ${input.problemStatement.slice(0, 60)}`,
          createdAt: item.createdAt,
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "care_plan_problem"
        };
        setStore((s) => ({
          ...s,
          residentCarePlans: newRcp ? [newRcp, ...s.residentCarePlans] : s.residentCarePlans,
          carePlanProblems: [item, ...s.carePlanProblems],
          problemHistory: [hist, ...s.problemHistory],
          timelineEvents: [ev, ...s.timelineEvents]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Added care plan problem",
          entity: item.id
        });
        return item;
      },
      updateProblem: (id, patch, reason) => {
        const before = store.carePlanProblems.find((p) => p.id === id);
        setStore((s) => ({
          ...s,
          carePlanProblems: s.carePlanProblems.map((p) => p.id === id ? { ...p, ...patch } : p),
          problemHistory: [
            {
              id: newId("hist"),
              problemId: id,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "updated",
              reason,
              oldValue: before ? JSON.stringify({
                riskLevel: before.riskLevel,
                evaluationDate: before.evaluationDate,
                reviewDate: before.reviewDate
              }) : void 0,
              newValue: JSON.stringify(patch)
            },
            ...s.problemHistory
          ]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated care plan problem",
          entity: id,
          reason
        });
      },
      resolveProblem: (id, reason) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const prob = store.carePlanProblems.find((p) => p.id === id);
        setStore((s) => ({
          ...s,
          carePlanProblems: s.carePlanProblems.map(
            (p) => p.id === id ? {
              ...p,
              status: "resolved",
              resolvedAt: now,
              resolvedBy: currentUserName,
              resolvedReason: reason,
              riskLevel: "resolved"
            } : p
          ),
          problemHistory: [
            {
              id: newId("hist"),
              problemId: id,
              timestamp: now,
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "resolved",
              reason
            },
            ...s.problemHistory
          ],
          timelineEvents: prob ? [
            {
              id: newId("tle"),
              residentId: prob.residentId,
              type: "careplan.reviewed",
              title: `Problem resolved: ${prob.problemStatement.slice(0, 60)}`,
              createdAt: now,
              createdBy: currentUserName,
              role: currentRole,
              linkedRecordId: id,
              linkedRecordKind: "care_plan_problem"
            },
            ...s.timelineEvents
          ] : s.timelineEvents
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Resolved problem",
          entity: id,
          reason
        });
      },
      reopenProblem: (id, reason) => {
        setStore((s) => ({
          ...s,
          carePlanProblems: s.carePlanProblems.map(
            (p) => p.id === id ? {
              ...p,
              status: "active",
              resolvedAt: void 0,
              resolvedBy: void 0,
              resolvedReason: void 0
            } : p
          ),
          problemHistory: [
            {
              id: newId("hist"),
              problemId: id,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "reopened",
              reason
            },
            ...s.problemHistory
          ]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Reopened problem",
          entity: id,
          reason
        });
      },
      archiveProblem: (id, reason) => {
        setStore((s) => ({
          ...s,
          carePlanProblems: s.carePlanProblems.map(
            (p) => p.id === id ? { ...p, status: "archived" } : p
          ),
          problemHistory: [
            {
              id: newId("hist"),
              problemId: id,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "archived",
              reason
            },
            ...s.problemHistory
          ]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Archived problem",
          entity: id,
          reason
        });
      },
      addGoal: (problemId, statement, targetDate) => {
        const item = {
          id: newId("goal"),
          problemId,
          statement,
          targetDate,
          status: "active",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName
        };
        setStore((s) => ({
          ...s,
          problemGoals: [item, ...s.problemGoals],
          timelineEvents: [
            {
              id: newId("tle"),
              residentId: store.carePlanProblems.find((p) => p.id === problemId)?.residentId || "",
              type: "careplan.updated",
              title: `Goal added: ${statement.slice(0, 60)}`,
              createdAt: item.createdAt,
              createdBy: currentUserName,
              role: currentRole,
              linkedRecordId: item.id,
              linkedRecordKind: "problem_goal"
            },
            ...s.timelineEvents
          ],
          problemHistory: [
            {
              id: newId("hist"),
              problemId,
              timestamp: item.createdAt,
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "goal_added",
              newValue: statement
            },
            ...s.problemHistory
          ]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Added goal",
          entity: item.id
        });
        return item;
      },
      updateGoal: (id, patch) => {
        setStore((s) => ({
          ...s,
          problemGoals: s.problemGoals.map((g2) => g2.id === id ? { ...g2, ...patch } : g2)
        }));
        const g = store.problemGoals.find((x) => x.id === id);
        if (g) {
          setStore((s) => ({
            ...s,
            problemHistory: [
              {
                id: newId("hist"),
                problemId: g.problemId,
                timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                userId: currentUser.id,
                userName: currentUserName,
                role: currentRole,
                action: "goal_edited",
                newValue: JSON.stringify(patch)
              },
              ...s.problemHistory
            ]
          }));
        }
      },
      removeGoal: (id) => {
        const g = store.problemGoals.find((x) => x.id === id);
        setStore((s) => ({
          ...s,
          problemGoals: s.problemGoals.filter((x) => x.id !== id),
          problemHistory: g ? [
            {
              id: newId("hist"),
              problemId: g.problemId,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "goal_removed",
              oldValue: g.statement
            },
            ...s.problemHistory
          ] : s.problemHistory
        }));
      },
      addProblemIntervention: (input) => {
        const prob = store.carePlanProblems.find((p) => p.id === input.problemId);
        if (!prob || prob.status !== "active") {
          throw new Error("Active care plan problem not found for intervention");
        }
        const item = {
          id: newId("int"),
          problemId: input.problemId,
          residentId: prob.residentId,
          name: input.name,
          description: input.description,
          frequencyType: input.frequencyType,
          frequencyValue: input.frequencyValue,
          frequencyInstructions: input.frequencyInstructions,
          assignedRole: input.assignedRole,
          assignedStaffId: input.assignedStaffId,
          assignedStaffName: input.assignedStaffName,
          startDate: input.startDate,
          reviewDate: input.reviewDate,
          endDate: input.endDate,
          status: input.status || "active",
          notes: input.notes,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: input.createdBy || currentUserName,
          createdByRole: input.createdByRole || currentRole
        };
        const ev = {
          id: newId("tle"),
          residentId: prob.residentId,
          type: "intervention.created",
          title: `Intervention Created: ${input.name}`,
          description: `${prob.problemStatement} · ${input.frequencyType} starting ${input.startDate}, review ${input.reviewDate}`,
          createdAt: item.createdAt,
          createdBy: item.createdBy,
          role: item.createdByRole,
          linkedRecordId: item.id,
          linkedRecordKind: "problem_intervention"
        };
        setStore((s) => ({
          ...s,
          problemInterventions: [item, ...s.problemInterventions],
          timelineEvents: [ev, ...s.timelineEvents],
          problemHistory: [
            {
              id: newId("hist"),
              problemId: input.problemId,
              timestamp: item.createdAt,
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "intervention_added",
              newValue: input.name
            },
            ...s.problemHistory
          ]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Added intervention: ${input.name}`,
          entity: item.id,
          after: JSON.stringify({
            residentId: item.residentId,
            problemId: item.problemId,
            assignedRole: item.assignedRole,
            assignedStaffName: item.assignedStaffName,
            startDate: item.startDate,
            reviewDate: item.reviewDate,
            endDate: item.endDate,
            status: item.status,
            notes: item.notes
          })
        });
        return item;
      },
      updateProblemIntervention: (id, patch, reason) => {
        const before = store.problemInterventions.find((i) => i.id === id);
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => ({
          ...s,
          problemInterventions: s.problemInterventions.map(
            (i) => i.id === id ? { ...i, ...patch } : i
          ),
          timelineEvents: before ? [
            {
              id: newId("tle"),
              residentId: before.residentId,
              type: "intervention.updated",
              title: `Intervention updated: ${before.name}`,
              description: reason || JSON.stringify(patch),
              createdAt: now,
              createdBy: currentUserName,
              role: currentRole,
              linkedRecordId: id,
              linkedRecordKind: "problem_intervention"
            },
            ...s.timelineEvents
          ] : s.timelineEvents,
          problemHistory: before ? [
            {
              id: newId("hist"),
              problemId: before.problemId,
              timestamp: now,
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: patch.frequencyType || patch.frequencyValue || patch.frequencyInstructions ? "frequency_changed" : "updated",
              reason,
              newValue: JSON.stringify(patch)
            },
            ...s.problemHistory
          ] : s.problemHistory
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Updated intervention${before ? `: ${before.name}` : ""}`,
          entity: id,
          reason,
          after: JSON.stringify(patch)
        });
      },
      discontinueProblemIntervention: (id, reason) => {
        const before = store.problemInterventions.find((i) => i.id === id);
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => ({
          ...s,
          problemInterventions: s.problemInterventions.map(
            (i) => i.id === id ? { ...i, status: "discontinued" } : i
          ),
          timelineEvents: before ? [
            {
              id: newId("tle"),
              residentId: before.residentId,
              type: "intervention.updated",
              title: `Intervention discontinued: ${before.name}`,
              description: reason,
              createdAt: now,
              createdBy: currentUserName,
              role: currentRole,
              linkedRecordId: id,
              linkedRecordKind: "problem_intervention"
            },
            ...s.timelineEvents
          ] : s.timelineEvents,
          problemHistory: before ? [
            {
              id: newId("hist"),
              problemId: before.problemId,
              timestamp: now,
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "intervention_removed",
              reason,
              oldValue: before.name
            },
            ...s.problemHistory
          ] : s.problemHistory
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Discontinued intervention",
          entity: id,
          reason
        });
      },
      // CHANGE 7 — fan-out to timeline + daily notes + audit
      logProblemIntervention: (input) => {
        const intv = store.problemInterventions.find((i) => i.id === input.interventionId);
        if (!intv) throw new Error("Intervention not found");
        const now = /* @__PURE__ */ new Date();
        const date = now.toISOString().slice(0, 10);
        const time = now.toTimeString().slice(0, 5);
        const hour = now.getHours();
        const shift = hour < 14 ? "morning" : hour < 22 ? "afternoon" : "night";
        const noteId = newId("note");
        const logId = newId("plog");
        const note = {
          id: noteId,
          residentId: intv.residentId,
          date,
          staff: currentUserName,
          shift,
          observation: `${intv.name}: ${input.outcome.replace("_", " ")}${input.comments ? " — " + input.comments : ""}`,
          mood: "calm",
          foodIntake: "most",
          fluidIntake: "good",
          sleep: "good",
          behaviour: input.residentResponse || "",
          linkedCarePlanId: intv.problemId,
          linkedProblemId: intv.problemId,
          linkedInterventionId: intv.id,
          linkedInterventionLogId: logId
        };
        const log = {
          id: logId,
          interventionId: intv.id,
          problemId: intv.problemId,
          residentId: intv.residentId,
          date,
          time,
          staffId: currentUser.id,
          staffName: currentUserName,
          role: currentRole,
          outcome: input.outcome,
          residentResponse: input.residentResponse,
          comments: input.comments,
          linkedDailyNoteId: noteId
        };
        const ev = {
          id: newId("tle"),
          residentId: intv.residentId,
          type: "intervention.logged",
          title: `${intv.name} — ${input.outcome.replace("_", " ")}`,
          description: input.comments,
          createdAt: now.toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: log.id,
          linkedRecordKind: "problem_intervention_log"
        };
        const hist = {
          id: newId("hist"),
          problemId: intv.problemId,
          timestamp: now.toISOString(),
          userId: currentUser.id,
          userName: currentUserName,
          role: currentRole,
          action: "intervention_logged",
          newValue: `${intv.name}: ${input.outcome}`
        };
        setStore((s) => ({
          ...s,
          problemInterventionLogs: [log, ...s.problemInterventionLogs],
          notes: [note, ...s.notes],
          timelineEvents: [ev, ...s.timelineEvents],
          problemHistory: [hist, ...s.problemHistory]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Logged intervention: ${input.outcome}`,
          entity: log.id
        });
        return log;
      },
      addProblemInterventionLog: (input) => {
        const log = {
          id: newId("plog"),
          ...input,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        const intv = store.problemInterventions.find((i) => i.id === input.interventionId);
        const ev = intv ? {
          id: newId("tle"),
          residentId: input.residentId,
          type: "intervention.logged",
          title: `${intv.name} — ${input.outcome.replace("_", " ")}`,
          description: input.comments,
          createdAt: log.createdAt,
          createdBy: input.staffName,
          role: input.role,
          linkedRecordId: log.id,
          linkedRecordKind: "problem_intervention_log"
        } : null;
        setStore((s) => ({
          ...s,
          problemInterventionLogs: [log, ...s.problemInterventionLogs],
          timelineEvents: ev ? [ev, ...s.timelineEvents] : s.timelineEvents
        }));
        logAudit({
          user: input.staffName,
          role: input.role,
          action: `Logged intervention: ${input.outcome}`,
          entity: log.id
        });
        return log;
      },
      addProblemEvaluation: (input) => {
        const item = {
          ...input,
          id: newId("eval"),
          date: input.date || (/* @__PURE__ */ new Date()).toISOString(),
          evaluatorId: currentUser.id,
          evaluatorName: currentUserName,
          role: currentRole
        };
        const prob = store.carePlanProblems.find((p) => p.id === input.problemId);
        const ev = prob ? {
          id: newId("tle"),
          residentId: prob.residentId,
          type: "careplan.evaluated",
          title: `Evaluation: ${input.progress}`,
          description: input.summary,
          createdAt: item.date,
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "problem_evaluation"
        } : null;
        setStore((s) => ({
          ...s,
          problemEvaluations: [item, ...s.problemEvaluations],
          timelineEvents: ev ? [ev, ...s.timelineEvents] : s.timelineEvents,
          problemHistory: [
            {
              id: newId("hist"),
              problemId: input.problemId,
              timestamp: item.date,
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "evaluation_added",
              newValue: input.progress
            },
            ...s.problemHistory
          ],
          // bump evaluation date
          carePlanProblems: input.nextEvaluationDate ? s.carePlanProblems.map(
            (p) => p.id === input.problemId ? { ...p, evaluationDate: input.nextEvaluationDate } : p
          ) : s.carePlanProblems
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Added evaluation",
          entity: input.problemId
        });
        return item;
      },
      addProblemReview: (input) => {
        const item = {
          ...input,
          id: newId("rev"),
          reviewedById: currentUser.id,
          reviewedByName: currentUserName,
          role: currentRole
        };
        const prob = store.carePlanProblems.find((p) => p.id === input.problemId);
        const ev = prob ? {
          id: newId("tle"),
          residentId: prob.residentId,
          type: "careplan.reviewed",
          title: `Review: ${input.outcome}`,
          description: input.comments,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "problem_review"
        } : null;
        setStore((s) => ({
          ...s,
          problemReviews: [item, ...s.problemReviews],
          timelineEvents: ev ? [ev, ...s.timelineEvents] : s.timelineEvents,
          problemHistory: [
            {
              id: newId("hist"),
              problemId: input.problemId,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "review_added",
              newValue: input.outcome
            },
            ...s.problemHistory
          ],
          carePlanProblems: input.nextReviewDate ? s.carePlanProblems.map(
            (p) => p.id === input.problemId ? { ...p, reviewDate: input.nextReviewDate } : p
          ) : s.carePlanProblems
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Added formal review",
          entity: input.problemId
        });
        return item;
      },
      acceptSuggestion: (id, edits) => {
        const sug = store.assessmentSuggestions.find((s) => s.id === id);
        if (!sug) return void 0;
        const rcp = store.residentCarePlans.find(
          (p) => p.residentId === sug.residentId && p.status === "active"
        );
        let rcpId = rcp?.id;
        const newRcp = !rcp ? {
          id: newId("rcp"),
          residentId: sug.residentId,
          status: "active",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          createdBy: currentUserName
        } : null;
        if (newRcp) rcpId = newRcp.id;
        const problem = {
          id: newId("prob"),
          residentCarePlanId: rcpId,
          residentId: sug.residentId,
          category: edits?.category || sug.category,
          problemStatement: edits?.problemStatement || sug.problemStatement,
          riskLevel: edits?.riskLevel || sug.riskLevel,
          sourceAssessmentId: sug.assessmentId,
          sourceAssessmentType: sug.assessmentType,
          createdBy: currentUserName,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          evaluationDate: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
          reviewDate: new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10),
          status: "active"
        };
        setStore((s) => ({
          ...s,
          residentCarePlans: newRcp ? [newRcp, ...s.residentCarePlans] : s.residentCarePlans,
          carePlanProblems: [problem, ...s.carePlanProblems],
          assessmentSuggestions: s.assessmentSuggestions.map(
            (x) => x.id === id ? {
              ...x,
              status: edits ? "edited" : "accepted",
              acceptedAsProblemId: problem.id
            } : x
          ),
          problemHistory: [
            {
              id: newId("hist"),
              problemId: problem.id,
              timestamp: problem.createdAt,
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "created",
              reason: `Accepted from ${sug.assessmentType} assessment suggestion`
            },
            ...s.problemHistory
          ]
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Accepted assessment suggestion",
          entity: problem.id
        });
        return problem;
      },
      rejectSuggestion: (id, reason) => {
        setStore((s) => ({
          ...s,
          assessmentSuggestions: s.assessmentSuggestions.map(
            (x) => x.id === id ? { ...x, status: "rejected", rejectedReason: reason } : x
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Rejected assessment suggestion",
          entity: id,
          reason
        });
      },
      // ---------------- Vital Signs ----------------
      recordVital: (input) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const recordedAt = input.recordedAt || now;
        const {
          news2Score: _ignoredScore,
          news2Risk: _ignoredRisk,
          news2Breakdown: _ignoredBreakdown,
          ...enteredValues
        } = input;
        const calculatedNews2 = calcNEWS2(enteredValues);
        const item = {
          ...enteredValues,
          ...calculatedNews2.complete ? {
            news2Score: calculatedNews2.total,
            news2Risk: calculatedNews2.risk,
            news2Breakdown: calculatedNews2.breakdown
          } : {},
          id: uid(),
          recordedByUserId: currentUser.id,
          recordedByName: currentUserName,
          recordedByRole: currentRole,
          createdAt: now,
          recordedAt,
          auditTrail: [
            {
              id: uid(),
              action: "created",
              byUserId: currentUser.id,
              byUserName: currentUserName,
              byRole: currentRole,
              at: now
            }
          ]
        };
        const ev = {
          id: uid(),
          residentId: input.residentId,
          type: "intervention.logged",
          title: `Vital signs recorded`,
          description: `By ${currentUserName}`,
          linkedRecordId: item.id,
          linkedRecordKind: "observation",
          createdAt: now,
          createdBy: currentUserName,
          role: currentRole
        };
        setStore((s) => {
          const vitals = [item, ...s.vitals];
          s.residents.find((candidate) => candidate.id === input.residentId);
          const seeds = derivedAlertsForResident(alertVitalsForResident(vitals, s.clinicalObservations, input.residentId));
          return { ...s, vitals, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, input.residentId, seeds, now), timelineEvents: [ev, ...s.timelineEvents] };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Recorded vital signs",
          entity: item.id
        });
        return item;
      },
      updateVital: (id, patch, reason) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => {
          const vitals = s.vitals.map(
            (v) => v.id === id ? (() => {
              const {
                news2Score: _ignoredScore,
                news2Risk: _ignoredRisk,
                news2Breakdown: _ignoredBreakdown,
                ...safePatch
              } = patch;
              const {
                news2Score: _oldScore,
                news2Risk: _oldRisk,
                news2Breakdown: _oldBreakdown,
                ...merged
              } = { ...v, ...safePatch };
              const news2 = calcNEWS2(merged);
              return {
                ...merged,
                ...news2.complete ? { news2Score: news2.total, news2Risk: news2.risk, news2Breakdown: news2.breakdown } : {},
                modifiedAt: now,
                modifiedByUserId: currentUser.id,
                modifiedByName: currentUserName,
                modifiedReason: reason,
                auditTrail: [
                  ...v.auditTrail,
                  {
                    id: uid(),
                    action: "edited",
                    byUserId: currentUser.id,
                    byUserName: currentUserName,
                    byRole: currentRole,
                    at: now,
                    reason,
                    patchSummary: Object.keys(patch).join(", ")
                  }
                ]
              };
            })() : v
          );
          const changed = vitals.find((v) => v.id === id);
          if (!changed) return s;
          s.residents.find((r) => r.id === changed.residentId);
          return { ...s, vitals, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, changed.residentId, derivedAlertsForResident(alertVitalsForResident(vitals, s.clinicalObservations, changed.residentId)), now) };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Edited vital signs",
          entity: id,
          reason
        });
      },
      softDeleteVital: (id, reason) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => {
          const vitals = s.vitals.map(
            (v) => v.id === id ? {
              ...v,
              deletedAt: now,
              deletedByUserId: currentUser.id,
              deletedByName: currentUserName,
              deletedReason: reason,
              auditTrail: [
                ...v.auditTrail,
                {
                  id: uid(),
                  action: "deleted",
                  byUserId: currentUser.id,
                  byUserName: currentUserName,
                  byRole: currentRole,
                  at: now,
                  reason
                }
              ]
            } : v
          );
          const changed = vitals.find((v) => v.id === id);
          if (!changed) return s;
          s.residents.find((r) => r.id === changed.residentId);
          return { ...s, vitals, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, changed.residentId, derivedAlertsForResident(alertVitalsForResident(vitals, s.clinicalObservations, changed.residentId)), now) };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted vital signs",
          entity: id,
          reason
        });
      },
      setObservationPlan: (residentId, items) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => {
          const exists = s.observationPlans.some((p) => p.residentId === residentId);
          const plan = {
            residentId,
            items,
            updatedAt: now,
            updatedByName: currentUserName
          };
          return {
            ...s,
            observationPlans: exists ? s.observationPlans.map((p) => p.residentId === residentId ? plan : p) : [...s.observationPlans, plan]
          };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated observation plan",
          entity: residentId
        });
      },
      acknowledgeClinicalAlert: (id) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => ({
          ...s,
          clinicalAlerts: s.clinicalAlerts.map(
            (a) => a.id === id ? { ...a, acknowledged: true, acknowledgedBy: currentUserName, acknowledgedAt: now } : a
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Acknowledged clinical alert",
          entity: id
        });
      },
      dismissClinicalAlert: (id, reason = "Reviewed") => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => ({
          ...s,
          clinicalAlerts: s.clinicalAlerts.map(
            (a) => a.id === id ? {
              ...a,
              dismissedAt: now,
              dismissedBy: currentUserName,
              dismissedReason: reason,
              ...reason === "Resolved" ? { resolvedAt: now, resolvedBy: currentUserName } : {}
            } : a
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Dismissed clinical alert",
          entity: id,
          reason
        });
      },
      addClinicalEscalationNote: (alertId, actionTaken) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const note = {
          id: uid(),
          alertId,
          actionTaken,
          enteredByUserId: currentUser.id,
          enteredByName: currentUserName,
          enteredByRole: currentRole,
          at: now
        };
        setStore((s) => ({
          ...s,
          clinicalAlerts: s.clinicalAlerts.map(
            (a) => a.id === alertId ? { ...a, escalations: [...a.escalations, note] } : a
          )
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Added escalation note",
          entity: alertId
        });
      },
      regenerateClinicalAlertsForResident: (residentId) => {
        store.residents.find((r) => r.id === residentId);
        const seeds = derivedAlertsForResident(alertVitalsForResident(store.vitals, store.clinicalObservations, residentId));
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => ({ ...s, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, residentId, seeds, now) }));
      },
      // ---- Phase 7: Modular Clinical Observations ----
      recordObservation: (input) => {
        const now = /* @__PURE__ */ new Date();
        const date = input.date ?? now.toISOString().slice(0, 10);
        const time = input.time ?? now.toTimeString().slice(0, 5);
        const recordedAt = (/* @__PURE__ */ new Date(`${date}T${time}:00`)).toISOString();
        const item = {
          id: uid(),
          residentId: input.residentId,
          kind: input.kind,
          date,
          time,
          recordedAt,
          data: observationDataWithNEWS2(input.kind, input.data),
          notes: input.notes,
          recordedByUserId: currentUser.id,
          recordedByName: currentUserName,
          recordedByRole: currentRole,
          createdAt: now.toISOString(),
          auditTrail: [
            {
              id: uid(),
              action: "created",
              byUserId: currentUser.id,
              byUserName: currentUserName,
              byRole: currentRole,
              at: now.toISOString()
            }
          ]
        };
        setStore((s) => {
          const clinicalObservations = [item, ...s.clinicalObservations];
          s.residents.find((candidate) => candidate.id === input.residentId);
          const seeds = derivedAlertsForResident(
            alertVitalsForResident(s.vitals, clinicalObservations, input.residentId)
          );
          return {
            ...s,
            clinicalObservations,
            clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, input.residentId, seeds, now.toISOString())
          };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Recorded ${input.kind} observation`,
          entity: input.residentId
        });
        return item;
      },
      updateObservation: (id, patch, reason) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => {
          const clinicalObservations = s.clinicalObservations.map(
            (o) => o.id === id ? {
              ...o,
              data: observationDataWithNEWS2(o.kind, patch.data ?? o.data),
              notes: patch.notes ?? o.notes,
              modificationReason: reason,
              modifiedAt: now,
              modifiedByName: currentUserName,
              auditTrail: [
                ...o.auditTrail,
                {
                  id: uid(),
                  action: "edited",
                  byUserId: currentUser.id,
                  byUserName: currentUserName,
                  byRole: currentRole,
                  at: now,
                  reason
                }
              ]
            } : o
          );
          const changed = clinicalObservations.find((observation) => observation.id === id);
          if (!changed) return s;
          s.residents.find((candidate) => candidate.id === changed.residentId);
          const seeds = derivedAlertsForResident(alertVitalsForResident(s.vitals, clinicalObservations, changed.residentId));
          return { ...s, clinicalObservations, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, changed.residentId, seeds, now) };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Edited observation",
          entity: id,
          reason
        });
      },
      softDeleteObservation: (id, reason) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => {
          const clinicalObservations = s.clinicalObservations.map(
            (o) => o.id === id ? {
              ...o,
              deletedAt: now,
              deletedByName: currentUserName,
              deletedReason: reason,
              auditTrail: [
                ...o.auditTrail,
                {
                  id: uid(),
                  action: "deleted",
                  byUserId: currentUser.id,
                  byUserName: currentUserName,
                  byRole: currentRole,
                  at: now,
                  reason
                }
              ]
            } : o
          );
          const changed = clinicalObservations.find((observation) => observation.id === id);
          if (!changed) return s;
          s.residents.find((candidate) => candidate.id === changed.residentId);
          const seeds = derivedAlertsForResident(alertVitalsForResident(s.vitals, clinicalObservations, changed.residentId));
          return { ...s, clinicalObservations, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, changed.residentId, seeds, now) };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted observation",
          entity: id,
          reason
        });
      },
      setObservationSchedule: (residentId, items) => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        setStore((s) => {
          const exists = s.observationSchedules.some((p) => p.residentId === residentId);
          const sched = {
            residentId,
            items,
            updatedAt: now,
            updatedByName: currentUserName
          };
          return {
            ...s,
            observationSchedules: exists ? s.observationSchedules.map((p) => p.residentId === residentId ? sched : p) : [...s.observationSchedules, sched]
          };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated observation schedule",
          entity: residentId
        });
      }
    }),
    [
      store,
      logAudit,
      currentRole,
      currentUserName,
      currentUser,
      filter,
      filteredResidentIds,
      setCurrentRole,
      resetToDemoData
    ]
  );
  return /* @__PURE__ */ jsx(Ctx.Provider, { value: api, children });
}
function useCare() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCare must be used within CareProvider");
  return ctx;
}
function age(dob) {
  const d = new Date(dob);
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 864e5));
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
const roleLabels = {
  carer: "Carer",
  nurse: "Nurse",
  doctor: "Doctor",
  cnm: "Clinical Nurse Manager",
  don: "Director of Nursing"
};
const matrix = {
  carer: [
    "resident.view",
    "note.create",
    "intervention.create",
    "handover.create",
    "visitor.create",
    "outing.create",
    "task.create",
    "assessment.view",
    "careplan.view",
    "vital.view",
    "vital.record",
    "observation.view",
    "observation.record",
    "ops.edit_own",
    "ops.duplicate"
  ],
  nurse: [
    "resident.view",
    "resident.edit",
    "note.create",
    "intervention.create",
    "handover.create",
    "visitor.create",
    "outing.create",
    "task.create",
    "assessment.view",
    "assessment.create",
    "assessment.edit",
    "assessment.review",
    "assessment.create_revision",
    "assessment.comment",
    "assessment.archive",
    "careplan.view",
    "careplan.create",
    "careplan.edit",
    "careplan.review",
    "careplan.evaluate",
    "evaluation.create",
    "incident.view",
    "incident.create",
    "vital.view",
    "vital.record",
    "vital.edit",
    "vital.comment",
    "vital.plan.edit",
    "vital.escalate",
    "observation.view",
    "observation.record",
    "observation.edit",
    "observation.plan.edit",
    "observation.escalate",
    "ops.edit",
    "ops.archive",
    "ops.restore",
    "ops.duplicate"
  ],
  doctor: [
    "resident.view",
    "clinical.view",
    "mdt.create",
    "medical_review.create",
    "recommendation.create",
    "treatment_note.create",
    "assessment.view",
    "assessment.comment",
    "careplan.view",
    "vital.view",
    "vital.comment",
    "vital.escalate",
    "observation.view",
    "observation.escalate",
    "ops.edit_own"
  ],
  cnm: [
    "resident.view",
    "resident.create",
    "resident.edit",
    "note.create",
    "intervention.create",
    "handover.create",
    "visitor.create",
    "outing.create",
    "task.create",
    "assessment.view",
    "assessment.create",
    "assessment.edit",
    "assessment.review",
    "assessment.approve",
    "assessment.archive",
    "assessment.assign",
    "assessment.create_revision",
    "assessment.comment",
    "assessment.delete",
    "assessment.restore",
    "assessment.audit_access",
    "assessment.reports",
    "careplan.view",
    "careplan.create",
    "careplan.edit",
    "careplan.review",
    "careplan.approve",
    "careplan.evaluate",
    "careplan.revise",
    "evaluation.create",
    "incident.view",
    "incident.create",
    "incident.manage",
    "report.view",
    "user.manage",
    "clinical.view",
    "mdt.create",
    "compliance.view",
    "vital.view",
    "vital.record",
    "vital.edit",
    "vital.delete",
    "vital.comment",
    "vital.plan.edit",
    "vital.escalate",
    "vital.report",
    "vital.audit",
    "observation.view",
    "observation.record",
    "observation.edit",
    "observation.delete",
    "observation.plan.edit",
    "observation.escalate",
    "observation.audit",
    "ops.edit",
    "ops.archive",
    "ops.restore",
    "ops.delete",
    "ops.duplicate"
  ],
  don: [
    "resident.view",
    "resident.create",
    "resident.edit",
    "resident.discharge",
    "note.create",
    "intervention.create",
    "handover.create",
    "visitor.create",
    "outing.create",
    "task.create",
    "assessment.view",
    "assessment.create",
    "assessment.edit",
    "assessment.review",
    "assessment.approve",
    "assessment.delete",
    "assessment.archive",
    "assessment.assign",
    "assessment.create_revision",
    "assessment.comment",
    "assessment.restore",
    "assessment.audit_access",
    "assessment.reports",
    "careplan.view",
    "careplan.create",
    "careplan.edit",
    "careplan.review",
    "careplan.approve",
    "careplan.delete",
    "careplan.evaluate",
    "careplan.revise",
    "evaluation.create",
    "incident.view",
    "incident.create",
    "incident.manage",
    "clinical.view",
    "mdt.create",
    "medical_review.create",
    "recommendation.create",
    "treatment_note.create",
    "report.view",
    "report.manage",
    "user.manage",
    "permission.manage",
    "settings.manage",
    "audit.view",
    "record.delete_with_audit",
    "compliance.view",
    "vital.view",
    "vital.record",
    "vital.edit",
    "vital.delete",
    "vital.comment",
    "vital.plan.edit",
    "vital.escalate",
    "vital.report",
    "vital.audit",
    "observation.view",
    "observation.record",
    "observation.edit",
    "observation.delete",
    "observation.plan.edit",
    "observation.escalate",
    "observation.audit",
    "ops.edit",
    "ops.archive",
    "ops.restore",
    "ops.delete",
    "ops.duplicate"
  ]
};
function can(role, perm) {
  return matrix[role].includes(perm);
}
function canEditOpsRecord(role, currentUserName, createdBy) {
  if (can(role, "ops.edit")) return true;
  if (can(role, "ops.edit_own") && createdBy === currentUserName) return true;
  return false;
}
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(ChevronRight, { className: "ml-auto" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
const DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.SubContent,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
const DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
const DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
    ...props
  }
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
const roles = ["carer", "nurse", "doctor", "cnm", "don"];
function RoleSwitcher() {
  const { currentRole, setCurrentRole, currentUserName } = useCare();
  return /* @__PURE__ */ jsxs(DropdownMenu, { children: [
    /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", children: [
      /* @__PURE__ */ jsx(Shield, { className: "h-3.5 w-3.5" }),
      /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: currentUserName }),
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground hidden md:inline", children: [
        "· ",
        roleLabels[currentRole]
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-56", children: [
      /* @__PURE__ */ jsx(DropdownMenuLabel, { children: "Switch active role" }),
      /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
      roles.map((r) => /* @__PURE__ */ jsx(DropdownMenuItem, { onSelect: () => setCurrentRole(r), children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: roleLabels[r] }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: r === currentRole ? "Active" : "" })
      ] }) }, r))
    ] })
  ] });
}
const Avatar = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AvatarPrimitive.Root,
  {
    ref,
    className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
    ...props
  }
));
Avatar.displayName = AvatarPrimitive.Root.displayName;
const AvatarImage = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AvatarPrimitive.Image,
  {
    ref,
    className: cn("aspect-square h-full w-full", className),
    ...props
  }
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;
const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AvatarPrimitive.Fallback,
  {
    ref,
    className: cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    ),
    ...props
  }
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;
function UserMenu() {
  const { currentUser } = useCare();
  const initials = currentUser.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return /* @__PURE__ */ jsxs(DropdownMenu, { children: [
    /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "h-9 gap-2 px-2", children: [
      /* @__PURE__ */ jsx(Avatar, { className: "h-7 w-7", children: /* @__PURE__ */ jsx(AvatarFallback, { className: "text-[10px] bg-primary/15 text-primary font-semibold", children: initials }) }),
      /* @__PURE__ */ jsxs("div", { className: "hidden md:flex flex-col items-start leading-tight", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium", children: currentUser.name }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: roleLabels[currentUser.role] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-56", children: [
      /* @__PURE__ */ jsx(DropdownMenuLabel, { children: currentUser.name }),
      /* @__PURE__ */ jsx(DropdownMenuLabel, { className: "text-xs font-normal text-muted-foreground -mt-1", children: currentUser.email }),
      /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
      /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/profile", children: [
        /* @__PURE__ */ jsx(User, { className: "h-4 w-4 mr-2" }),
        " My Profile"
      ] }) }),
      /* @__PURE__ */ jsxs(DropdownMenuItem, { disabled: true, children: [
        /* @__PURE__ */ jsx(Settings, { className: "h-4 w-4 mr-2" }),
        " Preferences"
      ] }),
      /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
      /* @__PURE__ */ jsxs(DropdownMenuItem, { disabled: true, className: "text-muted-foreground", children: [
        /* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4 mr-2" }),
        " Sign out (demo)"
      ] })
    ] })
  ] });
}
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  SelectPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs(
  SelectPrimitive.Content,
  {
    ref,
    className: cn(
      "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ jsx(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsx(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsx(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
const SelectLabel = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
function GlobalFilter() {
  const { wings, rooms, residents, filter, setFilter } = useCare();
  const wingRooms = filter.wingId ? rooms.filter((r) => r.wingId === filter.wingId) : [];
  const wingResidents = filter.wingId ? residents.filter((r) => r.wingId === filter.wingId) : residents;
  const active = !!(filter.wingId || filter.roomId || filter.residentId || filter.status);
  return /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex items-center gap-1.5", children: [
    /* @__PURE__ */ jsx(Filter, { className: "h-3.5 w-3.5 text-muted-foreground" }),
    /* @__PURE__ */ jsxs(
      Select,
      {
        value: filter.wingId || "all",
        onValueChange: (v) => setFilter({ ...filter, wingId: v === "all" ? void 0 : v, roomId: void 0, residentId: void 0 }),
        children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8 w-[140px] text-xs", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "All Wings" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxs(SelectItem, { value: "all", children: [
              "All Wings (",
              residents.length,
              ")"
            ] }),
            wings.map((w) => {
              const count = residents.filter((r) => r.wingId === w.id).length;
              return /* @__PURE__ */ jsxs(SelectItem, { value: w.id, children: [
                w.name,
                " (",
                count,
                ")"
              ] }, w.id);
            })
          ] })
        ]
      }
    ),
    filter.wingId && /* @__PURE__ */ jsxs(Select, { value: filter.roomId || "all", onValueChange: (v) => setFilter({ ...filter, roomId: v === "all" ? void 0 : v, residentId: void 0 }), children: [
      /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8 w-[120px] text-xs", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "All Rooms" }) }),
      /* @__PURE__ */ jsxs(SelectContent, { children: [
        /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Rooms" }),
        wingRooms.map((r) => /* @__PURE__ */ jsxs(SelectItem, { value: r.id, children: [
          "Room ",
          r.number
        ] }, r.id))
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Select, { value: filter.residentId || "all", onValueChange: (v) => setFilter({ ...filter, residentId: v === "all" ? void 0 : v }), children: [
      /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8 w-[160px] text-xs", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "All Residents" }) }),
      /* @__PURE__ */ jsxs(SelectContent, { children: [
        /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Residents" }),
        wingResidents.map((r) => /* @__PURE__ */ jsxs(SelectItem, { value: r.id, children: [
          r.firstName,
          " ",
          r.lastName
        ] }, r.id))
      ] })
    ] }),
    active && /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", className: "h-8 px-2", onClick: () => setFilter({}), children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5" }) })
  ] });
}
const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    to: "/operations",
    label: "Operations",
    icon: Building2,
    perm: (r) => can(r, "ops.edit") || can(r, "ops.edit_own")
  },
  { to: "/residents", label: "Residents", icon: Users, perm: (r) => can(r, "resident.view") },
  {
    to: "/assessments",
    label: "Assessments",
    icon: Stethoscope,
    perm: (r) => can(r, "assessment.view")
  },
  {
    to: "/vitals",
    label: "Vitals",
    icon: HeartPulse,
    perm: (r) => r === "cnm" || r === "don"
  },
  {
    to: "/care-plans",
    label: "Care Plans",
    icon: ClipboardList,
    perm: (r) => can(r, "careplan.view")
  },
  {
    to: "/care-plan-templates",
    label: "Care Templates",
    icon: LibraryBig,
    perm: (r) => can(r, "careplan.create")
  },
  {
    to: "/compliance",
    label: "Compliance",
    icon: ShieldCheck,
    perm: (r) => can(r, "compliance.view")
  },
  { to: "/daily-notes", label: "Daily Notes", icon: NotebookPen },
  { to: "/interventions", label: "Interventions", icon: HeartPulse },
  { to: "/handovers", label: "Handovers", icon: UserCheck },
  {
    to: "/incidents",
    label: "Incidents",
    icon: ShieldAlert,
    perm: (r) => can(r, "incident.view") || can(r, "incident.create")
  },
  {
    to: "/mdt-notes",
    label: "MDT Notes",
    icon: UserCheck,
    perm: (r) => can(r, "mdt.create") || can(r, "clinical.view")
  },
  { to: "/visitors", label: "Visitors", icon: UsersRound },
  { to: "/outings", label: "Outings", icon: Plane },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/risks", label: "Risks", icon: Gauge },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/reports", label: "Reports", icon: BarChart3, perm: (r) => can(r, "report.view") },
  { to: "/audit-logs", label: "Audit Logs", icon: History, perm: (r) => can(r, "audit.view") }
];
function SidebarInner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { tasks, currentRole } = useCare();
  const todayKey = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "deleted" && t.dueDate.slice(0, 10) < todayKey
  ).length;
  const dueTodayTasks = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "deleted" && t.dueDate.slice(0, 10) === todayKey
  ).length;
  const tasksAttentionCount = overdueTasks + dueTodayTasks;
  const tasksBadgeClass = overdueTasks > 0 ? "bg-destructive text-destructive-foreground" : "bg-warning/20 text-warning-foreground";
  const visible = nav.filter((i) => !i.perm || i.perm(currentRole));
  return /* @__PURE__ */ jsxs("aside", { className: "hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-5 py-5 border-b border-sidebar-border", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: `${"/"}nucare-logo.png`,
          alt: "NuCare",
          className: "h-9 w-9 rounded-lg object-cover"
        }
      ),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold tracking-tight", children: "NuCare" }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-sidebar-foreground/60", children: "Care Planning System" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("nav", { className: "flex-1 px-3 py-3 space-y-0.5 overflow-y-auto", children: visible.map((item) => {
      const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
      const Icon = item.icon;
      return /* @__PURE__ */ jsxs(
        Link,
        {
          to: item.to,
          className: cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          ),
          children: [
            /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { className: "flex-1", children: item.label }),
            item.to === "/tasks" && tasksAttentionCount > 0 && /* @__PURE__ */ jsx(
              "span",
              {
                className: cn(
                  "text-[10px] rounded-full px-1.5 py-0.5 font-semibold",
                  tasksBadgeClass
                ),
                children: tasksAttentionCount
              }
            )
          ]
        },
        item.to
      );
    }) })
  ] });
}
function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = nav.find((n) => n.exact ? pathname === n.to : pathname.startsWith(n.to));
  return /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-30 bg-background/80 backdrop-blur border-b", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-4 md:px-6 h-14", children: [
    /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm md:text-base", children: current?.label ?? "NuCare" }),
    /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "hidden sm:inline-flex text-[10px]", children: "Demo Data" }),
    /* @__PURE__ */ jsx("div", { className: "flex-1" }),
    /* @__PURE__ */ jsx(GlobalFilter, {}),
    /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-[200px] hidden xl:block", children: [
      /* @__PURE__ */ jsx(Search, { className: "h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" }),
      /* @__PURE__ */ jsx(Input, { placeholder: "Search…", className: "pl-8 h-9" })
    ] }),
    /* @__PURE__ */ jsx(RoleSwitcher, {}),
    /* @__PURE__ */ jsx(UserMenu, {})
  ] }) });
}
function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { currentRole, tasks } = useCare();
  const todayKey = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "deleted" && t.dueDate.slice(0, 10) < todayKey
  ).length;
  const dueTodayTasks = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "deleted" && t.dueDate.slice(0, 10) === todayKey
  ).length;
  const tasksAttentionCount = overdueTasks + dueTodayTasks;
  const tasksBadgeClass = overdueTasks > 0 ? "bg-destructive text-destructive-foreground" : "bg-warning/20 text-warning-foreground";
  const visible = nav.filter((i) => !i.perm || i.perm(currentRole)).slice(0, 5);
  return /* @__PURE__ */ jsx("nav", { className: "md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar text-sidebar-foreground border-t border-sidebar-border flex justify-around py-1.5", children: visible.map((item) => {
    const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
    const Icon = item.icon;
    return /* @__PURE__ */ jsxs(
      Link,
      {
        to: item.to,
        className: cn(
          "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px]",
          active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70"
        ),
        children: [
          /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5" }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("span", { children: item.label }),
            item.to === "/tasks" && tasksAttentionCount > 0 && /* @__PURE__ */ jsx(
              "span",
              {
                className: cn(
                  "text-[9px] rounded-full px-1 py-0.5 font-semibold",
                  tasksBadgeClass
                ),
                children: tasksAttentionCount
              }
            )
          ] })
        ]
      },
      item.to
    );
  }) });
}
function AppShell() {
  return /* @__PURE__ */ jsx(CareProvider, { children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex bg-background", children: [
    /* @__PURE__ */ jsx(SidebarInner, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
      /* @__PURE__ */ jsx(TopBar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1 pb-20 md:pb-8", children: /* @__PURE__ */ jsx(Outlet, {}) })
    ] }),
    /* @__PURE__ */ jsx(MobileNav, {}),
    /* @__PURE__ */ jsx(Toaster, { richColors: true, position: "top-right" })
  ] }) });
}
const publicAsset = (name) => `${"/"}${name}`.replace(/\/+/g, "/");
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$A = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NuCare" },
      { name: "description", content: "NuCare is a healthcare-grade system for managing resident care plans and daily activities in care facilities." },
      { name: "author", content: "NuCare" },
      { property: "og:title", content: "NuCare" },
      { property: "og:description", content: "NuCare is a healthcare-grade system for managing resident care plans and daily activities in care facilities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "NuCare" },
      { name: "twitter:description", content: "NuCare is a healthcare-grade system for managing resident care plans and daily activities in care facilities." },
      { property: "og:image", content: publicAsset("nucare-logo.png") },
      { name: "twitter:image", content: publicAsset("nucare-logo.png") }
    ],
    links: [
      { rel: "icon", type: "image/png", href: publicAsset("favicon.png") },
      { rel: "apple-touch-icon", href: publicAsset("nucare-logo.png") },
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$A.useRouteContext();
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(AppShell, {}) });
}
const $$splitComponentImporter$z = () => import("./vitals-IZ6VBJ1m.js");
const Route$z = createFileRoute("/vitals")({
  head: () => ({
    meta: [{
      title: "Vital Signs — CarePath"
    }, {
      name: "description",
      content: "Clinical observations and vital signs monitoring"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$z, "component")
});
const $$splitComponentImporter$y = () => import("./visitors-D5HTUvUx.js");
const Route$y = createFileRoute("/visitors")({
  head: () => ({
    meta: [{
      title: "Visitors — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$y, "component")
});
const $$splitComponentImporter$x = () => import("./tasks-B-GmzT1A.js");
const Route$x = createFileRoute("/tasks")({
  head: () => ({
    meta: [{
      title: "Tasks — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$x, "component")
});
const $$splitComponentImporter$w = () => import("./risks-C_WOWS9i.js");
const Route$w = createFileRoute("/risks")({
  head: () => ({
    meta: [{
      title: "Risks - CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$w, "component")
});
const $$splitComponentImporter$v = () => import("./residents-BFsOu0JM.js");
const Route$v = createFileRoute("/residents")({
  component: lazyRouteComponent($$splitComponentImporter$v, "component")
});
const $$splitComponentImporter$u = () => import("./reports-msQAJ_4n.js");
const Route$u = createFileRoute("/reports")({
  head: () => ({
    meta: [{
      title: "Reports & Analytics — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$u, "component")
});
const $$splitComponentImporter$t = () => import("./profile-hkhHGQmA.js");
const Route$t = createFileRoute("/profile")({
  head: () => ({
    meta: [{
      title: "My Profile — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$t, "component")
});
const $$splitComponentImporter$s = () => import("./outings-aWSM2fSn.js");
const Route$s = createFileRoute("/outings")({
  head: () => ({
    meta: [{
      title: "Outings — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$s, "component")
});
const $$splitComponentImporter$r = () => import("./operations-BIvDgAQY.js");
const Route$r = createFileRoute("/operations")({
  head: () => ({
    meta: [{
      title: "Operations — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$r, "component")
});
const $$splitComponentImporter$q = () => import("./mdt-notes-DDU6gJN-.js");
const Route$q = createFileRoute("/mdt-notes")({
  head: () => ({
    meta: [{
      title: "MDT Notes — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$q, "component")
});
const $$splitComponentImporter$p = () => import("./interventions-Cir8wNVs.js");
const Route$p = createFileRoute("/interventions")({
  head: () => ({
    meta: [{
      title: "Interventions — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$p, "component")
});
const $$splitComponentImporter$o = () => import("./incidents-NGZb7YBy.js");
const Route$o = createFileRoute("/incidents")({
  head: () => ({
    meta: [{
      title: "Incidents — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$o, "component")
});
const $$splitComponentImporter$n = () => import("./handovers-BRxlOPld.js");
const Route$n = createFileRoute("/handovers")({
  head: () => ({
    meta: [{
      title: "Handovers — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$n, "component")
});
const $$splitComponentImporter$m = () => import("./daily-notes-CMhp2rOX.js");
const Route$m = createFileRoute("/daily-notes")({
  head: () => ({
    meta: [{
      title: "Daily Notes — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$m, "component")
});
const $$splitComponentImporter$l = () => import("./compliance-DpI7y0Bj.js");
const Route$l = createFileRoute("/compliance")({
  head: () => ({
    meta: [{
      title: "Care Plan Compliance — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$l, "component")
});
const $$splitComponentImporter$k = () => import("./care-plans-BjXWC-LL.js");
const Route$k = createFileRoute("/care-plans")({
  head: () => ({
    meta: [{
      title: "Care Plans — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const $$splitComponentImporter$j = () => import("./care-plan-templates-DCCs_0CK.js");
const Route$j = createFileRoute("/care-plan-templates")({
  head: () => ({
    meta: [{
      title: "Care Plan Templates — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$j, "component")
});
const $$splitComponentImporter$i = () => import("./audit-logs-ecNr0hmV.js");
const Route$i = createFileRoute("/audit-logs")({
  head: () => ({
    meta: [{
      title: "Audit Logs — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$i, "component")
});
const $$splitComponentImporter$h = () => import("./assessments-BFsOu0JM.js");
const Route$h = createFileRoute("/assessments")({
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
const Card = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: cn("rounded-xl border bg-card text-card-foreground shadow", className),
      ...props
    }
  )
);
Card.displayName = "Card";
const CardHeader = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex flex-col space-y-1.5 p-6", className), ...props })
);
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: cn("font-semibold leading-none tracking-tight", className),
      ...props
    }
  )
);
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("text-sm text-muted-foreground", className), ...props })
);
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("p-6 pt-0", className), ...props })
);
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex items-center p-6 pt-0", className), ...props })
);
CardFooter.displayName = "CardFooter";
const $$splitComponentImporter$g = () => import("./alerts-AU_gpACB.js");
const Route$g = createFileRoute("/alerts")({
  head: () => ({
    meta: [{
      title: "Alerts — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitComponentImporter$f = () => import("./index-CrE4irJL.js");
const Route$f = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "Dashboard — NuCare"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./residents.index-09jywwyB.js");
const Route$e = createFileRoute("/residents/")({
  head: () => ({
    meta: [{
      title: "Residents — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./assessments.index-BkNpDNPd.js");
const Route$d = createFileRoute("/assessments/")({
  head: () => ({
    meta: [{
      title: "Assessment Centre — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./vitals.audit-YQgQQbDa.js");
const Route$c = createFileRoute("/vitals/audit")({
  head: () => ({
    meta: [{
      title: "Observation Audit Report — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./residents._id-Jx_gsZcC.js");
const Route$b = createFileRoute("/residents/$id")({
  head: ({
    params
  }) => ({
    meta: [{
      title: `Resident ${params.id} — CarePath`
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./inspection._residentId-CIy35kSu.js");
const Route$a = createFileRoute("/inspection/$residentId")({
  head: () => ({
    meta: [{
      title: "Inspection Mode — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./charts._residentId-6S--mBQF.js");
const Route$9 = createFileRoute("/charts/$residentId")({
  head: () => ({
    meta: [{
      title: "Charts — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./care-plans._id-B5o3Hge7.js");
const Route$8 = createFileRoute("/care-plans/$id")({
  head: ({
    params
  }) => ({
    meta: [{
      title: `Care Plan ${params.id} — CarePath`
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./assessments.reassessment-BYu9CKr4.js");
const Route$7 = createFileRoute("/assessments/reassessment")({
  head: () => ({
    meta: [{
      title: "Reassessment Queue — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./assessments._assessmentId-DLvKDvGH.js");
const Route$6 = createFileRoute("/assessments/$assessmentId")({
  head: () => ({
    meta: [{
      title: "Assessment Detail — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./residents._id.timeline-BlloFntH.js");
const Route$5 = createFileRoute("/residents/$id/timeline")({
  head: () => ({
    meta: [{
      title: "Resident Timeline — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./residents._id.record-CdVMCBoj.js");
const Route$4 = createFileRoute("/residents/$id/record")({
  validateSearch: (s) => ({
    kind: s.kind ?? "note"
  }),
  head: () => ({
    meta: [{
      title: "Quick Record — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./residents._id.quality-of-life-MYkxjm5c.js");
const Route$3 = createFileRoute("/residents/$id/quality-of-life")({
  head: () => ({
    meta: [{
      title: "Quality of Life — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./residents._id.care-plan-DYAolN8M.js");
const Route$2 = createFileRoute("/residents/$id/care-plan")({
  head: ({
    params
  }) => ({
    meta: [{
      title: `Care Plan — ${params.id} — CarePath`
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./residents._id.assessments-XhFUXgNC.js");
const Route$1 = createFileRoute("/residents/$id/assessments")({
  head: () => ({
    meta: [{
      title: "Assessment Centre — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./assessments.new._residentId-CRb-P1eK.js");
const Route = createFileRoute("/assessments/new/$residentId")({
  validateSearch: (s) => ({
    type: s.type ?? "barthel"
  }),
  head: () => ({
    meta: [{
      title: "New Assessment — CarePath"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const VitalsRoute = Route$z.update({
  id: "/vitals",
  path: "/vitals",
  getParentRoute: () => Route$A
});
const VisitorsRoute = Route$y.update({
  id: "/visitors",
  path: "/visitors",
  getParentRoute: () => Route$A
});
const TasksRoute = Route$x.update({
  id: "/tasks",
  path: "/tasks",
  getParentRoute: () => Route$A
});
const RisksRoute = Route$w.update({
  id: "/risks",
  path: "/risks",
  getParentRoute: () => Route$A
});
const ResidentsRoute = Route$v.update({
  id: "/residents",
  path: "/residents",
  getParentRoute: () => Route$A
});
const ReportsRoute = Route$u.update({
  id: "/reports",
  path: "/reports",
  getParentRoute: () => Route$A
});
const ProfileRoute = Route$t.update({
  id: "/profile",
  path: "/profile",
  getParentRoute: () => Route$A
});
const OutingsRoute = Route$s.update({
  id: "/outings",
  path: "/outings",
  getParentRoute: () => Route$A
});
const OperationsRoute = Route$r.update({
  id: "/operations",
  path: "/operations",
  getParentRoute: () => Route$A
});
const MdtNotesRoute = Route$q.update({
  id: "/mdt-notes",
  path: "/mdt-notes",
  getParentRoute: () => Route$A
});
const InterventionsRoute = Route$p.update({
  id: "/interventions",
  path: "/interventions",
  getParentRoute: () => Route$A
});
const IncidentsRoute = Route$o.update({
  id: "/incidents",
  path: "/incidents",
  getParentRoute: () => Route$A
});
const HandoversRoute = Route$n.update({
  id: "/handovers",
  path: "/handovers",
  getParentRoute: () => Route$A
});
const DailyNotesRoute = Route$m.update({
  id: "/daily-notes",
  path: "/daily-notes",
  getParentRoute: () => Route$A
});
const ComplianceRoute = Route$l.update({
  id: "/compliance",
  path: "/compliance",
  getParentRoute: () => Route$A
});
const CarePlansRoute = Route$k.update({
  id: "/care-plans",
  path: "/care-plans",
  getParentRoute: () => Route$A
});
const CarePlanTemplatesRoute = Route$j.update({
  id: "/care-plan-templates",
  path: "/care-plan-templates",
  getParentRoute: () => Route$A
});
const AuditLogsRoute = Route$i.update({
  id: "/audit-logs",
  path: "/audit-logs",
  getParentRoute: () => Route$A
});
const AssessmentsRoute = Route$h.update({
  id: "/assessments",
  path: "/assessments",
  getParentRoute: () => Route$A
});
const AlertsRoute = Route$g.update({
  id: "/alerts",
  path: "/alerts",
  getParentRoute: () => Route$A
});
const IndexRoute = Route$f.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$A
});
const ResidentsIndexRoute = Route$e.update({
  id: "/",
  path: "/",
  getParentRoute: () => ResidentsRoute
});
const AssessmentsIndexRoute = Route$d.update({
  id: "/",
  path: "/",
  getParentRoute: () => AssessmentsRoute
});
const VitalsAuditRoute = Route$c.update({
  id: "/audit",
  path: "/audit",
  getParentRoute: () => VitalsRoute
});
const ResidentsIdRoute = Route$b.update({
  id: "/$id",
  path: "/$id",
  getParentRoute: () => ResidentsRoute
});
const InspectionResidentIdRoute = Route$a.update({
  id: "/inspection/$residentId",
  path: "/inspection/$residentId",
  getParentRoute: () => Route$A
});
const ChartsResidentIdRoute = Route$9.update({
  id: "/charts/$residentId",
  path: "/charts/$residentId",
  getParentRoute: () => Route$A
});
const CarePlansIdRoute = Route$8.update({
  id: "/$id",
  path: "/$id",
  getParentRoute: () => CarePlansRoute
});
const AssessmentsReassessmentRoute = Route$7.update({
  id: "/reassessment",
  path: "/reassessment",
  getParentRoute: () => AssessmentsRoute
});
const AssessmentsAssessmentIdRoute = Route$6.update({
  id: "/$assessmentId",
  path: "/$assessmentId",
  getParentRoute: () => AssessmentsRoute
});
const ResidentsIdTimelineRoute = Route$5.update({
  id: "/timeline",
  path: "/timeline",
  getParentRoute: () => ResidentsIdRoute
});
const ResidentsIdRecordRoute = Route$4.update({
  id: "/record",
  path: "/record",
  getParentRoute: () => ResidentsIdRoute
});
const ResidentsIdQualityOfLifeRoute = Route$3.update({
  id: "/quality-of-life",
  path: "/quality-of-life",
  getParentRoute: () => ResidentsIdRoute
});
const ResidentsIdCarePlanRoute = Route$2.update({
  id: "/care-plan",
  path: "/care-plan",
  getParentRoute: () => ResidentsIdRoute
});
const ResidentsIdAssessmentsRoute = Route$1.update({
  id: "/assessments",
  path: "/assessments",
  getParentRoute: () => ResidentsIdRoute
});
const AssessmentsNewResidentIdRoute = Route.update({
  id: "/new/$residentId",
  path: "/new/$residentId",
  getParentRoute: () => AssessmentsRoute
});
const AssessmentsRouteChildren = {
  AssessmentsAssessmentIdRoute,
  AssessmentsReassessmentRoute,
  AssessmentsIndexRoute,
  AssessmentsNewResidentIdRoute
};
const AssessmentsRouteWithChildren = AssessmentsRoute._addFileChildren(
  AssessmentsRouteChildren
);
const CarePlansRouteChildren = {
  CarePlansIdRoute
};
const CarePlansRouteWithChildren = CarePlansRoute._addFileChildren(
  CarePlansRouteChildren
);
const ResidentsIdRouteChildren = {
  ResidentsIdAssessmentsRoute,
  ResidentsIdCarePlanRoute,
  ResidentsIdQualityOfLifeRoute,
  ResidentsIdRecordRoute,
  ResidentsIdTimelineRoute
};
const ResidentsIdRouteWithChildren = ResidentsIdRoute._addFileChildren(
  ResidentsIdRouteChildren
);
const ResidentsRouteChildren = {
  ResidentsIdRoute: ResidentsIdRouteWithChildren,
  ResidentsIndexRoute
};
const ResidentsRouteWithChildren = ResidentsRoute._addFileChildren(
  ResidentsRouteChildren
);
const VitalsRouteChildren = {
  VitalsAuditRoute
};
const VitalsRouteWithChildren = VitalsRoute._addFileChildren(VitalsRouteChildren);
const rootRouteChildren = {
  IndexRoute,
  AlertsRoute,
  AssessmentsRoute: AssessmentsRouteWithChildren,
  AuditLogsRoute,
  CarePlanTemplatesRoute,
  CarePlansRoute: CarePlansRouteWithChildren,
  ComplianceRoute,
  DailyNotesRoute,
  HandoversRoute,
  IncidentsRoute,
  InterventionsRoute,
  MdtNotesRoute,
  OperationsRoute,
  OutingsRoute,
  ProfileRoute,
  ReportsRoute,
  ResidentsRoute: ResidentsRouteWithChildren,
  RisksRoute,
  TasksRoute,
  VisitorsRoute,
  VitalsRoute: VitalsRouteWithChildren,
  ChartsResidentIdRoute,
  InspectionResidentIdRoute
};
const routeTree = Route$A._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    basepath: "/",
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route as $,
  Avatar as A,
  Badge as B,
  Card as C,
  DropdownMenuItem as D,
  calcBMI as E,
  bmiCategory as F,
  statusBadgeCls as G,
  Route$a as H,
  Input as I,
  Route$9 as J,
  Route$8 as K,
  Route$6 as L,
  assessmentItems as M,
  uniformScale as N,
  suggestTemplatesFor as O,
  Route$5 as P,
  Route$4 as Q,
  Route$b as R,
  Select as S,
  Route$3 as T,
  Route$2 as U,
  CATEGORY_LABELS as V,
  RISK_COLORS as W,
  frequencyLabel as X,
  PREDEFINED_GOALS as Y,
  Route$1 as Z,
  ASSESSMENT_CATEGORIES as _,
  can as a,
  scoreAssessment as a0,
  router as a1,
  CardHeader as b,
  cn as c,
  CardTitle as d,
  CardContent as e,
  Button as f,
  calcNEWS2 as g,
  complianceForResident as h,
  SelectTrigger as i,
  SelectValue as j,
  SelectContent as k,
  SelectItem as l,
  AvatarFallback as m,
  deriveStatus as n,
  canEditOpsRecord as o,
  DropdownMenu as p,
  DropdownMenuTrigger as q,
  roleLabels as r,
  DropdownMenuContent as s,
  DropdownMenuLabel as t,
  useCare as u,
  DropdownMenuSeparator as v,
  age as w,
  assessmentMeta as x,
  riskBadgeCls as y,
  heightAtDate as z
};
