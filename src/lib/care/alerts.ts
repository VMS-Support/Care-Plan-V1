import type { Alert, ClinicalAlert } from "./types";

const PHYSIOLOGICAL_LEGACY_ALERT_PATTERNS = [
  /weight\s+(loss|reduced|decrease|gain|increase)/i,
  /significant\s+weight/i,
  /temperature|pyrexia|hypothermia/i,
  /blood\s+pressure|\bbp\b/i,
  /spo2|oxygen\s+saturation|oxygen/i,
  /news2/i,
  /blood\s+glucose|hypoglycaemia|hyperglycaemia/i,
  /pain/i,
  /fluid\s+balance|hydration/i,
];

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

export function isPhysiologicalLegacyAlert(alert: Alert) {
  const text = `${alert.title} ${alert.description}`.trim();
  return PHYSIOLOGICAL_LEGACY_ALERT_PATTERNS.some((pattern) => pattern.test(text));
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
