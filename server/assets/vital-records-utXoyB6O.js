import { g as calcNEWS2, z as heightAtDate, E as calcBMI } from "./router-DLzRbDkQ.js";
const VITAL_TYPE_LABELS = {
  full_news2: "Full Vital Signs / NEWS2",
  temperature: "Temperature",
  blood_pressure: "Blood Pressure",
  oxygen_saturation: "Oxygen Saturation",
  blood_glucose: "Blood Glucose",
  weight_bmi: "Weight / BMI",
  pain_score: "Pain Score",
  fluid_balance: "Fluid Balance",
  respiratory: "Respiratory Observation"
};
function inferVitalRecordType(vital) {
  if (vital.observationType) return vital.observationType;
  const coreCount = [vital.temperature, vital.pulse, vital.respiratoryRate, vital.spo2, vital.systolicBP].filter((value) => value !== void 0).length;
  if (coreCount >= 4) return "full_news2";
  if (vital.temperature !== void 0) return "temperature";
  if (vital.systolicBP !== void 0) return "blood_pressure";
  if (vital.spo2 !== void 0) return "oxygen_saturation";
  if (vital.bloodGlucose !== void 0) return "blood_glucose";
  if (vital.weight !== void 0) return "weight_bmi";
  if (vital.painScore !== void 0) return "pain_score";
  if (vital.fluidIntakeMl !== void 0 || vital.fluidOutputMl !== void 0) return "fluid_balance";
  return "respiratory";
}
function formatVitalValues(vital, allVitals, resident) {
  const type = inferVitalRecordType(vital);
  if (type === "temperature") return `${vital.temperature}°C`;
  if (type === "blood_pressure") return `${vital.systolicBP}/${vital.diastolicBP ?? "?"} mmHg${vital.pulse !== void 0 ? ` · Pulse ${vital.pulse}` : ""}`;
  if (type === "oxygen_saturation") return `${vital.spo2}%${vital.onOxygen ? ` · O2 ${vital.oxygenLpm ?? "?"} L/min` : " · Room air"}${vital.respiratoryRate !== void 0 ? ` · RR ${vital.respiratoryRate}` : ""}`;
  if (type === "blood_glucose") return `${vital.bloodGlucose} mmol/L${vital.glucoseContext ? ` · ${vital.glucoseContext.replace("_", " ")}` : ""}`;
  if (type === "weight_bmi") {
    const height = vital.height ?? heightAtDate(vital.residentId, vital.date, allVitals, resident);
    const bmi = calcBMI(vital.weight, height);
    return `${vital.weight} kg${bmi !== void 0 ? ` · BMI ${bmi}` : ""}`;
  }
  if (type === "pain_score") return `${vital.painScore}/10${vital.painLocation ? ` · ${vital.painLocation}` : ""}`;
  if (type === "fluid_balance") {
    const intake = vital.fluidIntakeMl ?? 0;
    const output = vital.fluidOutputMl ?? 0;
    return `In ${intake} ml · Out ${output} ml · Balance ${intake - output} ml`;
  }
  if (type === "respiratory") return `RR ${vital.respiratoryRate}${vital.spo2 !== void 0 ? ` · SpO2 ${vital.spo2}%` : ""}${vital.onOxygen ? ` · O2 ${vital.oxygenLpm ?? "?"} L/min` : ""}`;
  const news = calcNEWS2(vital);
  return [
    vital.temperature !== void 0 ? `${vital.temperature}°C` : null,
    vital.systolicBP !== void 0 ? `BP ${vital.systolicBP}/${vital.diastolicBP ?? "?"}` : null,
    vital.spo2 !== void 0 ? `SpO2 ${vital.spo2}%` : null,
    news.complete ? `NEWS2 ${news.total} · ${news.risk} risk` : null
  ].filter(Boolean).join(" · ");
}
function isAbnormalVital(vital) {
  const news = calcNEWS2(vital);
  return vital.temperature !== void 0 && (vital.temperature > 38 || vital.temperature < 35.5) || vital.systolicBP !== void 0 && (vital.systolicBP < 90 || vital.systolicBP > 180) || vital.diastolicBP !== void 0 && vital.diastolicBP > 110 || vital.spo2 !== void 0 && vital.spo2 < 92 || vital.bloodGlucose !== void 0 && (vital.bloodGlucose < 4 || vital.bloodGlucose > 15) || vital.painScore !== void 0 && vital.painScore >= 7 || news.complete && news.total >= 5;
}
export {
  VITAL_TYPE_LABELS as V,
  isAbnormalVital as a,
  formatVitalValues as f,
  inferVitalRecordType as i
};
