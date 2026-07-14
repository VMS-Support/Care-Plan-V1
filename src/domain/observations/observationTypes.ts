export type ObservationType =
  | "temperature" | "pulse" | "respirations" | "blood_pressure" | "spo2"
  | "oxygen_delivery" | "consciousness" | "news2" | "pain" | "weight"
  | "bmi" | "blood_glucose" | "neurological";

export type ObservationSetType =
  | "full_vital_signs" | "news2_set" | "single_observation" | "weight_and_bmi"
  | "blood_glucose" | "neurological_observations" | "pain_assessment" | "custom";

export type ObservationUnit =
  | "celsius" | "beats_per_minute" | "breaths_per_minute" | "mmHg" | "percent"
  | "litres_per_minute" | "kilograms" | "centimetres" | "metres" | "kg_per_m2"
  | "mmol_per_litre" | "score" | "none";

export type ObservationComponentInterpretation =
  | "below_expected" | "within_expected_range" | "above_expected" | "abnormal"
  | "critical" | "not_interpreted";

export interface ObservationComponent {
  id: string;
  observationType: ObservationType;
  value?: number;
  textValue?: string;
  codedValue?: string;
  unit?: ObservationUnit;
  secondaryValue?: number;
  secondaryUnit?: ObservationUnit;
  measurementSite?: string;
  measurementMethod?: string;
  interpretation?: ObservationComponentInterpretation;
  clinicallySignificant: boolean;
  notes?: string;
  details?: Record<string, string | number | boolean | string[] | undefined>;
}

export type OxygenDeliveryMethod =
  | "room_air" | "nasal_cannula" | "simple_face_mask" | "venturi_mask"
  | "non_rebreather_mask" | "tracheostomy" | "cpap" | "bipap" | "other";

export interface OxygenDeliveryRecord {
  id: string;
  method: OxygenDeliveryMethod;
  flowRateLitresPerMinute?: number;
  venturiPercentage?: number;
  prescribed: boolean;
  prescriptionReferenceId?: string;
  notes?: string;
}

export type ConsciousnessLevel =
  | "alert" | "new_confusion" | "responds_to_voice" | "responds_to_pain" | "unresponsive";

export interface News2Result {
  totalScore?: number;
  componentScores: {
    respirations?: number; spo2?: number; oxygenSupplementation?: number;
    systolicBloodPressure?: number; pulse?: number; consciousness?: number; temperature?: number;
  };
  scale: "scale_1" | "scale_2";
  interpretation: "low" | "low_single_parameter" | "medium" | "high" | "incomplete";
  incompleteReason?: string;
  calculatedAt: string;
  calculationVersion: string;
}

export interface BmiResult {
  bmi?: number;
  weightKg?: number;
  heightMetres?: number;
  weightObservationId?: string;
  heightSourceId?: string;
  calculatedAt: string;
  status: "calculated" | "height_missing" | "weight_missing" | "invalid_measurement";
}

export interface ObservationInterpretation {
  overall: ObservationComponentInterpretation;
  news2?: News2Result;
  ruleIssueIds?: string[];
  ruleVersion?: string;
  explanation?: string;
  manualOverride?: { calculatedInterpretation: string; overriddenInterpretation: string; reason: string; recordedAt: string; recordedByUserAccountId: string };
}

export interface ObservationSourceReference {
  type: "direct_entry" | "work_item" | "care_plan" | "assessment" | "incident" | "rule_issue" | "legacy";
  id?: string;
  label?: string;
  route?: string;
  legacyMetadata?: Record<string, string>;
}

export interface ObservationCorrection {
  id: string;
  correctedAt: string;
  correctedByUserAccountId: string;
  reason: string;
  replacementObservationRecordId?: string;
}

export interface ResidentObservationRecord {
  id: string;
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  roomId?: string;
  bedId?: string;
  observationSetType: ObservationSetType;
  observedAt: string;
  recordedAt: string;
  recordedByUserAccountId: string;
  recordedByStaffMemberId?: string;
  observedByStaffMemberId?: string;
  recordedByDisplayName?: string;
  timezone?: string;
  clientRequestId?: string;
  components: ObservationComponent[];
  oxygenDelivery?: OxygenDeliveryRecord;
  interpretation: ObservationInterpretation;
  source: ObservationSourceReference;
  relatedWorkItemId?: string;
  relatedCarePlanItemId?: string;
  relatedAssessmentId?: string;
  relatedIncidentId?: string;
  relatedRuleIssueId?: string;
  clinicalContext?: string;
  notes?: string;
  backdatedEntryReason?: string;
  status: "completed" | "corrected" | "entered_in_error" | "void";
  correctionOfObservationRecordId?: string;
  corrections: ObservationCorrection[];
  createdAt: string;
  updatedAt: string;
}

/** References the shared recurrence/due-time engines; it does not implement scheduling itself. */
export interface ObservationSchedule {
  id: string;
  residentId: string;
  nursingHomeId: string;
  observationSetType: ObservationSetType;
  observationTypes: ObservationType[];
  recurrenceRuleId: string;
  startsAt: string;
  endsAt?: string;
  source: ObservationSourceReference;
  assignedRoleKey?: string;
  assignedStaffMemberId?: string;
  reviewAt?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const OBSERVATION_SET_LABELS: Record<ObservationSetType, string> = {
  full_vital_signs: "Full Observations", news2_set: "NEWS2 Observations",
  single_observation: "Single Observation", weight_and_bmi: "Weight and BMI",
  blood_glucose: "Blood Glucose", neurological_observations: "Neurological Observations",
  pain_assessment: "Pain Assessment", custom: "Selected Observations",
};

export const OBSERVATION_UNIT_LABELS: Record<ObservationUnit, string> = {
  celsius: "°C", beats_per_minute: "bpm", breaths_per_minute: "breaths/min",
  mmHg: "mmHg", percent: "%", litres_per_minute: "L/min", kilograms: "kg",
  centimetres: "cm", metres: "m", kg_per_m2: "kg/m²", mmol_per_litre: "mmol/L",
  score: "Score", none: "",
};
