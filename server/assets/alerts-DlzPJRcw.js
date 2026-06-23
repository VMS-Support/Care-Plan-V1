function isActionRequiredAlert(alert) {
  const value = alert.title.toLowerCase();
  return !(value.includes("pressure risk escalation") || value.includes("waterlow") || value.includes("falls risk") || value.includes("mna risk") || value.includes("mmse risk") || value.includes("abbey pain risk"));
}
function isActionableClinicalAlert(alert) {
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
    "fluid_imbalance"
  ].includes(alert.type);
}
export {
  isActionRequiredAlert as a,
  isActionableClinicalAlert as i
};
