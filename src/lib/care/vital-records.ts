import type { Resident, VitalRecordType, VitalSign } from "./types";
import { calcBMI, calcNEWS2, heightAtDate } from "./vitals";

export const VITAL_TYPE_LABELS: Record<VitalRecordType, string> = {
  full_news2: "Full Vital Signs / NEWS2",
  temperature: "Temperature",
  blood_pressure: "Blood Pressure",
  oxygen_saturation: "Oxygen Saturation",
  blood_glucose: "Blood Glucose",
  weight_bmi: "Weight / BMI",
  pain_score: "Pain Score",
  fluid_balance: "Fluid Balance",
  respiratory: "Respiratory Observation",
  neurological_observations: "Neurological Observations",
};

export function inferVitalRecordType(vital: VitalSign): VitalRecordType {
  if (vital.observationType) return vital.observationType;
  const coreCount = [vital.temperature, vital.pulse, vital.respiratoryRate, vital.spo2, vital.systolicBP]
    .filter((value) => value !== undefined).length;
  if (coreCount >= 4) return "full_news2";
  if (vital.temperature !== undefined) return "temperature";
  if (vital.systolicBP !== undefined) return "blood_pressure";
  if (vital.spo2 !== undefined) return "oxygen_saturation";
  if (vital.bloodGlucose !== undefined) return "blood_glucose";
  if (vital.weight !== undefined) return "weight_bmi";
  if (vital.painScore !== undefined) return "pain_score";
  if (vital.fluidIntakeMl !== undefined || vital.fluidOutputMl !== undefined) return "fluid_balance";
  if (vital.observationDetails?.neurological === true) return "neurological_observations";
  return "respiratory";
}

export function formatVitalValues(vital: VitalSign, allVitals: VitalSign[], resident?: Resident) {
  const type = inferVitalRecordType(vital);
  if (type === "temperature") return `${vital.temperature}°C`;
  if (type === "blood_pressure") return `${vital.systolicBP}/${vital.diastolicBP ?? "?"} mmHg${vital.pulse !== undefined ? ` · Pulse ${vital.pulse}` : ""}`;
  if (type === "oxygen_saturation") return `${vital.spo2}%${vital.onOxygen ? ` · O2 ${vital.oxygenLpm ?? "?"} L/min` : " · Room air"}${vital.respiratoryRate !== undefined ? ` · RR ${vital.respiratoryRate}` : ""}`;
  if (type === "blood_glucose") return `${vital.bloodGlucose} mmol/L${vital.glucoseContext ? ` · ${vital.glucoseContext.replace("_", " ")}` : ""}`;
  if (type === "weight_bmi") {
    const height = vital.height ?? heightAtDate(vital.residentId, vital.date, allVitals, resident);
    const bmi = calcBMI(vital.weight, height);
    return `${vital.weight} kg${bmi !== undefined ? ` · BMI ${bmi}` : ""}`;
  }
  if (type === "pain_score") return `${vital.painScore}/10${vital.painLocation ? ` · ${vital.painLocation}` : ""}`;
  if (type === "fluid_balance") {
    const intake = vital.fluidIntakeMl ?? 0;
    const output = vital.fluidOutputMl ?? 0;
    return `In ${intake} ml · Out ${output} ml · Balance ${intake - output} ml`;
  }
  if (type === "respiratory") return `RR ${vital.respiratoryRate}${vital.spo2 !== undefined ? ` · SpO2 ${vital.spo2}%` : ""}${vital.onOxygen ? ` · O2 ${vital.oxygenLpm ?? "?"} L/min` : ""}`;
  if (type === "neurological_observations") {
    const consciousness = String(vital.observationDetails?.neuroConsciousness ?? "not recorded").replaceAll("_", " ");
    return `Consciousness ${consciousness}${vital.observationDetails?.gcsTotal ? ` · GCS ${vital.observationDetails.gcsTotal}` : ""}`;
  }
  const news = calcNEWS2(vital);
  return [
    vital.temperature !== undefined ? `${vital.temperature}°C` : null,
    vital.systolicBP !== undefined ? `BP ${vital.systolicBP}/${vital.diastolicBP ?? "?"}` : null,
    vital.spo2 !== undefined ? `SpO2 ${vital.spo2}%` : null,
    news.complete ? `NEWS2 ${news.total} · ${news.risk} risk` : null,
  ].filter(Boolean).join(" · ");
}

export function isAbnormalVital(vital: VitalSign) {
  const news = calcNEWS2(vital);
  return (
    (vital.temperature !== undefined && (vital.temperature > 38 || vital.temperature < 35.5)) ||
    (vital.systolicBP !== undefined && (vital.systolicBP < 90 || vital.systolicBP > 180)) ||
    (vital.diastolicBP !== undefined && vital.diastolicBP > 110) ||
    (vital.spo2 !== undefined && vital.spo2 < 92) ||
    (vital.bloodGlucose !== undefined && (vital.bloodGlucose < 4 || vital.bloodGlucose > 15)) ||
    (vital.painScore !== undefined && vital.painScore >= 7) ||
    (news.complete && news.total >= 5)
  );
}
