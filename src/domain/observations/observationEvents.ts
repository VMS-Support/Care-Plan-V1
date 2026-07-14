import type { ObservationSetType, ObservationType } from "./observationTypes";

export type ObservationEventName =
  | "ObservationRecorded" | "ObservationSetCompleted" | "ObservationCorrected"
  | "ObservationEnteredInError" | "ObservationRiskChanged" | "News2Calculated"
  | "News2RiskChanged" | "WeightRecorded" | "WeightChanged" | "BloodGlucoseRecorded"
  | "NeurologicalObservationRecorded" | "ObservationFollowUpRequested";

export interface ObservationEvent {
  eventId: string;
  eventName: ObservationEventName;
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  observationRecordId: string;
  observationSetType: ObservationSetType;
  values: Array<{ observationType: ObservationType; value?: number; secondaryValue?: number; codedValue?: string; unit?: string }>;
  observedAt: string;
  recordedAt: string;
  actor: { userAccountId: string; staffMemberId?: string };
  sourceWorkItemId?: string;
  correlationId: string;
  ruleVersion?: string;
  rltDomainTags: string[];
}

export const observationRltDomains = (types: ObservationType[]) => {
  const domains = new Set<string>();
  if (types.some((type) => ["respirations", "spo2", "oxygen_delivery", "news2"].includes(type))) domains.add("breathing");
  if (types.some((type) => ["weight", "bmi", "blood_glucose"].includes(type))) domains.add("eating_and_drinking");
  if (types.includes("temperature")) domains.add("controlling_body_temperature");
  if (types.some((type) => ["consciousness", "neurological"].includes(type))) {
    domains.add("communication");
    domains.add("maintaining_a_safe_environment");
  }
  return [...domains];
};
