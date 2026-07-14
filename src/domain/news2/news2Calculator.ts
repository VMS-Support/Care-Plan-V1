import type { ObservationComponent } from "@/domain/observations/observationTypes";
import type { News2NumericScoreBand, News2Policy, News2ResidentConfiguration, PolicyNews2Result } from "./news2PolicyTypes";

export function getEffectiveNews2Policy(policies: News2Policy[], context: { nursingHomeId: string; enterpriseId?: string; effectiveAt: string }) {
  return policies.filter((policy) => policy.status === "approved" && Boolean(policy.approvedAt) && policy.effectiveFrom <= context.effectiveAt && (!policy.effectiveTo || policy.effectiveTo > context.effectiveAt) && (policy.nursingHomeId === context.nursingHomeId || (!policy.nursingHomeId && policy.enterpriseId === context.enterpriseId))).sort((a, b) => b.version - a.version)[0];
}

export function calculatePolicyNews2(components: ObservationComponent[], policy: News2Policy | undefined, configuration: News2ResidentConfiguration, calculatedAt: string): PolicyNews2Result {
  if (!policy) return result("unavailable", calculatedAt, "NEWS2 policy is not configured for this nursing home.");
  const scale = configuration.requestedScale;
  if (scale === "scale_2" && !validScale2(configuration, policy, calculatedAt)) return { ...result("scale_not_authorised", calculatedAt, "NEWS2 Scale 2 is not authorised for this resident."), policyId: policy.id, policyVersion: policy.version };
  const value = (type: ObservationComponent["observationType"]) => components.find((item) => item.observationType === type);
  const oxygen = value("oxygen_delivery");
  const inputs = { respirations: value("respirations")?.value, spo2: value("spo2")?.value, oxygenSupplementation: oxygen ? oxygen.codedValue !== "room_air" : undefined, systolicBloodPressure: value("blood_pressure")?.value, pulse: value("pulse")?.value, consciousness: value("consciousness")?.codedValue, temperature: value("temperature")?.value };
  const missing = Object.entries(inputs).filter(([, item]) => item === undefined).map(([key]) => key);
  if (missing.length) return { ...result("incomplete", calculatedAt, `Missing: ${missing.join(", ")}.`), scale, missingComponents: missing, policyId: policy.id, policyVersion: policy.version };
  const scoring = policy.scoringPolicy;
  const scores = {
    respirations: scoreNumber(inputs.respirations as number, scoring.respiratoryRateBands),
    spo2: scoreNumber(inputs.spo2 as number, scale === "scale_2" ? scoring.scale2Spo2Bands : scoring.scale1Spo2Bands),
    oxygenSupplementation: inputs.oxygenSupplementation ? scoring.oxygenSupplementationScore : 0,
    systolicBloodPressure: scoreNumber(inputs.systolicBloodPressure as number, scoring.systolicBloodPressureBands),
    pulse: scoreNumber(inputs.pulse as number, scoring.pulseBands),
    consciousness: scoring.consciousnessScores.find((item) => item.consciousnessLevel === inputs.consciousness)?.score,
    temperature: scoreNumber(inputs.temperature as number, scoring.temperatureBands),
  };
  const unscored = Object.entries(scores).filter(([, score]) => score === undefined).map(([key]) => key);
  if (unscored.length) return { ...result("incomplete", calculatedAt, `Policy has no matching score band for: ${unscored.join(", ")}.`), scale, missingComponents: unscored, componentScores: scores, policyId: policy.id, policyVersion: policy.version };
  const totalScore = Object.values(scores).reduce<number>((sum, score) => sum + (score ?? 0), 0);
  const totalRule = policy.escalationPolicy.totalScoreRules.find((rule) => (rule.minimumScore === undefined || totalScore >= rule.minimumScore) && (rule.maximumScore === undefined || totalScore <= rule.maximumScore));
  const single = Object.values(scores).some((score) => score === 3) ? policy.escalationPolicy.singleParameterRules.find((rule) => rule.componentScore === 3) : undefined;
  const interpretation = single?.interpretation ?? totalRule?.interpretation;
  return { status: "calculated", totalScore, componentScores: scores, scale, interpretation, missingComponents: [], calculatedAt, policyId: policy.id, policyVersion: policy.version, calculationVersion: `policy-${policy.id}-v${policy.version}`, explanation: [totalRule?.explanation, single?.explanation].filter(Boolean).join(" ") || `Calculated from approved policy ${policy.name} version ${policy.version}.` };
}

export function evaluateNews2Escalation(news2: PolicyNews2Result, policy: News2Policy) { if (news2.status !== "calculated" || news2.totalScore === undefined) return { required: false, reason: news2.explanation, targets: [], repeatObservationAfterMinutes: undefined }; const total = policy.escalationPolicy.totalScoreRules.find((rule) => (rule.minimumScore === undefined || news2.totalScore! >= rule.minimumScore) && (rule.maximumScore === undefined || news2.totalScore! <= rule.maximumScore)); const single = Object.values(news2.componentScores).some((score) => score === 3) ? policy.escalationPolicy.singleParameterRules.find((rule) => rule.componentScore === 3) : undefined; return { required: Boolean(total?.escalationRequired || single?.escalationRequired), reason: [total?.explanation, single?.explanation].filter(Boolean).join(" "), targets: [...new Set([...(total?.targetKeys ?? []), ...(single?.targetKeys ?? [])])], repeatObservationAfterMinutes: single?.repeatObservationAfterMinutes ?? total?.repeatObservationAfterMinutes, policyId: policy.id, policyVersion: policy.version }; }
function scoreNumber(value: number, bands: News2NumericScoreBand[]) { return bands.find((band) => (band.minimum === undefined || (band.minimumInclusive === false ? value > band.minimum : value >= band.minimum)) && (band.maximum === undefined || (band.maximumInclusive === false ? value < band.maximum : value <= band.maximum)))?.score; }
function validScale2(configuration: News2ResidentConfiguration, policy: News2Policy, at: string) { const auth = configuration.scale2Authorisation; return Boolean(auth?.authorised && policy.scale2EligibilityPolicy.acceptedSourceTypes.includes(auth.sourceType) && auth.effectiveFrom <= at && (!auth.effectiveTo || auth.effectiveTo > at)); }
function result(status: PolicyNews2Result["status"], calculatedAt: string, explanation: string): PolicyNews2Result { return { status, componentScores: {}, missingComponents: [], calculatedAt, calculationVersion: "policy-engine-1", explanation }; }
