import { calcNEWS2 } from "@/lib/care/vitals";
import type { ConsciousnessLevel as LegacyConsciousness, VitalSign } from "@/lib/care/types";
import type { BmiResult, News2Result, ObservationComponent } from "./observationTypes";

export const NEWS2_CALCULATION_VERSION = "carepath-news2-1";

const component = (components: ObservationComponent[], type: ObservationComponent["observationType"]) =>
  components.find((item) => item.observationType === type);

const legacyConsciousness = (value?: string): LegacyConsciousness | undefined => ({
  alert: "A", new_confusion: "C", responds_to_voice: "V", responds_to_pain: "P", unresponsive: "U",
} as const)[value as "alert"];

export function calculateNews2(
  components: ObservationComponent[],
  configuration: { scale?: "scale_1" | "scale_2"; calculatedAt?: string; news2Enabled?: boolean } = {},
): News2Result {
  const scale = configuration.scale ?? "scale_1";
  const calculatedAt = configuration.calculatedAt ?? new Date().toISOString();
  if (configuration.news2Enabled === false) return incomplete(scale, calculatedAt, "NEWS2 is not enabled for this clinical configuration.");
  if (scale === "scale_2") return incomplete(scale, calculatedAt, "NEWS2 Scale 2 requires the authorised Scale 2 calculator configuration.");
  const oxygen = component(components, "oxygen_delivery");
  const values: Partial<VitalSign> = {
    respiratoryRate: component(components, "respirations")?.value,
    spo2: component(components, "spo2")?.value,
    onOxygen: oxygen ? oxygen.codedValue !== "room_air" : undefined,
    systolicBP: component(components, "blood_pressure")?.value,
    pulse: component(components, "pulse")?.value,
    consciousness: legacyConsciousness(component(components, "consciousness")?.codedValue),
    temperature: component(components, "temperature")?.value,
  };
  const missing = [
    ["respirations", values.respiratoryRate], ["SpO₂", values.spo2], ["blood pressure", values.systolicBP],
    ["pulse", values.pulse], ["consciousness", values.consciousness], ["temperature", values.temperature],
    ["oxygen status", values.onOxygen],
  ].filter(([, value]) => value === undefined).map(([label]) => label);
  if (missing.length) return incomplete(scale, calculatedAt, `Missing: ${missing.join(", ")}.`);
  const result = calcNEWS2(values);
  return {
    totalScore: result.total,
    componentScores: {
      respirations: result.breakdown.RR, spo2: result.breakdown.SpO2,
      oxygenSupplementation: result.breakdown.Oxygen, systolicBloodPressure: result.breakdown.BP,
      pulse: result.breakdown.Pulse, consciousness: result.breakdown.Consciousness,
      temperature: result.breakdown.Temp,
    },
    scale, interpretation: result.risk === "low-medium" ? "low_single_parameter" : result.risk,
    calculatedAt, calculationVersion: NEWS2_CALCULATION_VERSION,
  };
}

function incomplete(scale: News2Result["scale"], calculatedAt: string, reason: string): News2Result {
  return { componentScores: {}, scale, interpretation: "incomplete", incompleteReason: reason, calculatedAt, calculationVersion: NEWS2_CALCULATION_VERSION };
}

export function calculateBmi(input: { weightKg?: number; heightMetres?: number; weightObservationId?: string; heightSourceId?: string; calculatedAt?: string }): BmiResult {
  const calculatedAt = input.calculatedAt ?? new Date().toISOString();
  if (input.weightKg === undefined) return { calculatedAt, status: "weight_missing" };
  if (input.heightMetres === undefined) return { weightKg: input.weightKg, weightObservationId: input.weightObservationId, calculatedAt, status: "height_missing" };
  if (input.weightKg <= 0 || input.heightMetres <= 0) return { ...input, calculatedAt, status: "invalid_measurement" };
  return { ...input, bmi: Math.round((input.weightKg / (input.heightMetres ** 2)) * 10) / 10, calculatedAt, status: "calculated" };
}
