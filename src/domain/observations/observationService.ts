import type { VitalRecordType, VitalSign } from "@/lib/care/types";
import { calculateBmi, calculateNews2 } from "./observationCalculators";
import type {
  ConsciousnessLevel, ObservationComponent, ObservationSetType, ObservationType,
  ObservationUnit, ResidentObservationRecord,
} from "./observationTypes";

export interface RecordResidentObservationsInput extends Omit<ResidentObservationRecord, "id" | "createdAt" | "updatedAt" | "corrections" | "status" | "interpretation"> {
  id?: string;
  interpretation?: ResidentObservationRecord["interpretation"];
}

export function recordResidentObservations(input: RecordResidentObservationsInput, createId: () => string): ResidentObservationRecord {
  validate(input);
  const now = input.recordedAt;
  const news2 = ["full_vital_signs", "news2_set"].includes(input.observationSetType)
    ? calculateNews2(input.components, { calculatedAt: now }) : undefined;
  return {
    ...input, id: input.id ?? createId(), status: "completed", corrections: [], createdAt: now, updatedAt: now,
    interpretation: input.interpretation ?? {
      overall: input.components.some((item) => item.clinicallySignificant) ? "abnormal" : "not_interpreted",
      ...(news2 ? { news2 } : {}),
    },
  };
}

export function getResidentObservationById(records: ResidentObservationRecord[], id: string) {
  return records.find((record) => record.id === id);
}

export function getResidentObservationHistory(records: ResidentObservationRecord[], residentId: string, filters: { type?: ObservationType; setType?: ObservationSetType; from?: string; to?: string; includeInvalid?: boolean } = {}) {
  return records.filter((record) => record.residentId === residentId)
    .filter((record) => filters.includeInvalid || !["entered_in_error", "void"].includes(record.status))
    .filter((record) => !filters.type || record.components.some((item) => item.observationType === filters.type))
    .filter((record) => !filters.setType || record.observationSetType === filters.setType)
    .filter((record) => !filters.from || record.observedAt >= filters.from)
    .filter((record) => !filters.to || record.observedAt <= filters.to)
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt));
}

export function getLatestResidentObservations(records: ResidentObservationRecord[], residentId: string) {
  const latest = new Map<ObservationType, { record: ResidentObservationRecord; component: ObservationComponent }>();
  for (const record of getResidentObservationHistory(records, residentId)) {
    if (record.status !== "completed") continue;
    for (const item of record.components) if (!latest.has(item.observationType)) latest.set(item.observationType, { record, component: item });
  }
  return latest;
}

export function getResidentObservationTrend(records: ResidentObservationRecord[], residentId: string, type: ObservationType) {
  return getResidentObservationHistory(records, residentId, { type })
    .flatMap((record) => record.components.filter((item) => item.observationType === type && item.value !== undefined).map((item) => ({ observationRecordId: record.id, observedAt: record.observedAt, value: item.value!, secondaryValue: item.secondaryValue, unit: item.unit })))
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
}

export function correctResidentObservation(original: ResidentObservationRecord, replacement: RecordResidentObservationsInput, actorId: string, reason: string, createId: () => string) {
  if (!reason.trim()) throw new Error("A correction reason is required.");
  if (original.residentId !== replacement.residentId || original.nursingHomeId !== replacement.nursingHomeId) throw new Error("A correction must retain the resident and nursing home.");
  const corrected = recordResidentObservations({ ...replacement, correctionOfObservationRecordId: original.id }, createId);
  return {
    original: { ...original, status: "corrected" as const, updatedAt: replacement.recordedAt, corrections: [...original.corrections, { id: createId(), correctedAt: replacement.recordedAt, correctedByUserAccountId: actorId, reason, replacementObservationRecordId: corrected.id }] },
    corrected,
  };
}

export function markResidentObservationEnteredInError(record: ResidentObservationRecord, actorId: string, reason: string, at: string, createId: () => string) {
  if (!reason.trim()) throw new Error("A reason is required.");
  return { ...record, status: "entered_in_error" as const, updatedAt: at, corrections: [...record.corrections, { id: createId(), correctedAt: at, correctedByUserAccountId: actorId, reason }] };
}

function validate(input: RecordResidentObservationsInput) {
  if (!input.residentId || !input.nursingHomeId) throw new Error("Resident and nursing home are required.");
  if (!input.observedAt || !input.recordedAt) throw new Error("Observed and recorded times are required.");
  if (!input.components.length) throw new Error("At least one observation is required.");
  const bp = input.components.find((item) => item.observationType === "blood_pressure");
  if (bp && (bp.value === undefined || bp.secondaryValue === undefined || bp.unit !== "mmHg")) throw new Error("Blood pressure requires systolic and diastolic values in mmHg.");
  for (const item of input.components) {
    const expected = UNIT_BY_TYPE[item.observationType];
    if (item.unit && expected && !expected.includes(item.unit)) throw new Error(`Invalid unit for ${item.observationType}.`);
  }
}

const UNIT_BY_TYPE: Partial<Record<ObservationType, ObservationUnit[]>> = {
  temperature: ["celsius"], pulse: ["beats_per_minute"], respirations: ["breaths_per_minute"],
  blood_pressure: ["mmHg"], spo2: ["percent"], oxygen_delivery: ["litres_per_minute", "none"],
  consciousness: ["none"], news2: ["score"], pain: ["score", "none"], weight: ["kilograms"],
  bmi: ["kg_per_m2"], blood_glucose: ["mmol_per_litre"], neurological: ["score", "none"],
};

const legacyTypeMap: Record<VitalRecordType, ObservationSetType> = {
  full_news2: "news2_set", temperature: "single_observation", blood_pressure: "single_observation",
  oxygen_saturation: "single_observation", blood_glucose: "blood_glucose", weight_bmi: "weight_and_bmi",
  pain_score: "pain_assessment", fluid_balance: "custom", respiratory: "single_observation",
  neurological_observations: "neurological_observations",
};

export function canonicalObservationFromVital(vital: VitalSign, nursingHomeId = vital.facilityId ?? "unknown-home"): ResidentObservationRecord {
  if (vital.canonicalObservation) return vital.canonicalObservation;
  const components: ObservationComponent[] = [];
  const add = (observationType: ObservationType, value: number | undefined, unit: ObservationUnit, extra: Partial<ObservationComponent> = {}) => {
    if (value !== undefined) components.push({ id: `${vital.id}-${observationType}`, observationType, value, unit, clinicallySignificant: false, ...extra });
  };
  add("temperature", vital.temperature, "celsius"); add("pulse", vital.pulse, "beats_per_minute");
  add("respirations", vital.respiratoryRate, "breaths_per_minute");
  if (vital.systolicBP !== undefined || vital.diastolicBP !== undefined) add("blood_pressure", vital.systolicBP, "mmHg", { secondaryValue: vital.diastolicBP, secondaryUnit: "mmHg" });
  add("spo2", vital.spo2, "percent"); add("blood_glucose", vital.bloodGlucose, "mmol_per_litre");
  add("weight", vital.weight, "kilograms", vital.weight !== undefined ? {
    measurementMethod: typeof vital.observationDetails?.measurementMethod === "string" ? vital.observationDetails.measurementMethod : undefined,
    details: {
      measurementMethod: typeof vital.observationDetails?.measurementMethod === "string" ? vital.observationDetails.measurementMethod : undefined,
      estimated: vital.observationDetails?.estimated === true,
      clothing: typeof vital.observationDetails?.clothing === "string" ? vital.observationDetails.clothing : undefined,
      equipment: typeof vital.observationDetails?.equipment === "string" ? vital.observationDetails.equipment : undefined,
    },
  } : {});
  add("pain", vital.painScore, "score");
  if (vital.onOxygen !== undefined) components.push({ id: `${vital.id}-oxygen`, observationType: "oxygen_delivery", value: vital.oxygenLpm, codedValue: vital.onOxygen ? String(vital.observationDetails?.oxygenMethod ?? "other") : "room_air", unit: vital.onOxygen ? "litres_per_minute" : "none", clinicallySignificant: false, details: vital.observationDetails });
  if (vital.consciousness) components.push({ id: `${vital.id}-consciousness`, observationType: "consciousness", codedValue: ({ A: "alert", C: "new_confusion", V: "responds_to_voice", P: "responds_to_pain", U: "unresponsive" } as Record<string, ConsciousnessLevel>)[vital.consciousness], unit: "none", clinicallySignificant: false });
  if (vital.observationDetails?.neurological === true) components.push({ id: `${vital.id}-neurological`, observationType: "neurological", value: typeof vital.observationDetails.gcsTotal === "number" ? vital.observationDetails.gcsTotal : undefined, textValue: typeof vital.observationDetails.neurologicalSymptoms === "string" ? vital.observationDetails.neurologicalSymptoms : undefined, codedValue: typeof vital.observationDetails.neuroConsciousness === "string" ? vital.observationDetails.neuroConsciousness : undefined, unit: typeof vital.observationDetails.gcsTotal === "number" ? "score" : "none", clinicallySignificant: false, details: vital.observationDetails });
  if (vital.weight !== undefined && vital.height) {
    const bmi = calculateBmi({ weightKg: vital.weight, heightMetres: vital.height / 100, weightObservationId: vital.id, heightSourceId: vital.id, calculatedAt: vital.recordedAt });
    add("bmi", bmi.bmi, "kg_per_m2");
  }
  return {
    id: vital.id, residentId: vital.residentId, nursingHomeId, observationSetType: legacyTypeMap[vital.observationType ?? "full_news2"],
    observedAt: new Date(`${vital.date}T${vital.time || "00:00"}:00`).toISOString(), recordedAt: vital.recordedAt,
    recordedByUserAccountId: vital.recordedByUserId, recordedByDisplayName: vital.recordedByName, components,
    interpretation: { overall: "not_interpreted", ...(vital.news2Score !== undefined ? { news2: calculateNews2(components, { calculatedAt: vital.recordedAt }) } : {}) },
    source: vital.observationDetails?.sourceType ? { type: vital.observationDetails.sourceType === "work_item" ? "work_item" : "direct_entry", id: typeof vital.observationDetails.sourceEntityId === "string" ? vital.observationDetails.sourceEntityId : undefined, label: "Observation entry" } : { type: "legacy", id: vital.id, label: "Legacy vital-sign record", legacyMetadata: { originalId: vital.id, originalType: vital.observationType ?? "full_news2" } },
    relatedWorkItemId: typeof vital.observationDetails?.relatedWorkItemId === "string" ? vital.observationDetails.relatedWorkItemId : undefined,
    notes: vital.observationNotes, status: vital.deletedAt ? "entered_in_error" : "completed", corrections: [], createdAt: vital.createdAt, updatedAt: vital.modifiedAt ?? vital.createdAt,
  };
}

export function mapLegacyObservationType(value: string): ObservationType | undefined {
  const key = value.trim().toLowerCase().replace(/[ _-]+/g, " ");
  return ({ temp: "temperature", temperature: "temperature", "heart rate": "pulse", pulse: "pulse", "respiratory rate": "respirations", respirations: "respirations", bp: "blood_pressure", "blood pressure": "blood_pressure", "oxygen saturation": "spo2", sats: "spo2", spo2: "spo2", "blood sugar": "blood_glucose", "blood glucose": "blood_glucose", weight: "weight", bmi: "bmi", "neuro obs": "neurological" } as Record<string, ObservationType>)[key];
}
