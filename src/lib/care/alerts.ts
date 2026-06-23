import type { Alert, ClinicalAlert } from "./types";

export function isActionRequiredAlert(alert: Alert) {
  const value = alert.title.toLowerCase();
  return !(
    value.includes("pressure risk escalation") ||
    value.includes("waterlow") ||
    value.includes("falls risk") ||
    value.includes("mna risk") ||
    value.includes("mmse risk") ||
    value.includes("abbey pain risk")
  );
}

export function isActionableClinicalAlert(alert: ClinicalAlert) {
  return [
    "weight_loss",
    "weight_gain",
    "high_news2",
    "abnormal_bp",
    "abnormal_temp",
    "low_spo2",
    "high_pain",
    "hypoglycaemia",
    "hyperglycaemia",
    "fluid_imbalance",
  ].includes(alert.type);
}
