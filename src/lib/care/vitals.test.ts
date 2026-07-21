import assert from "node:assert/strict";
import test from "node:test";
import type { VitalSign } from "./types.ts";
import { calcNEWS2, derivedAlertsForResident } from "./vitals.ts";

const normal: Partial<VitalSign> = {
  temperature: 36.7,
  pulse: 78,
  respiratoryRate: 18,
  spo2: 96,
  systolicBP: 124,
  consciousness: "A",
  onOxygen: false,
};

test("normal observation scores NEWS2 0 low", () => {
  const result = calcNEWS2(normal);
  assert.equal(result.complete, true);
  assert.equal(result.total, 0);
  assert.equal(result.risk, "low");
  assert.deepEqual(result.breakdown, {
    RR: 0, SpO2: 0, Oxygen: 0, Temp: 0, BP: 0, Pulse: 0, Consciousness: 0,
  });
});

test("partial observation is incomplete", () => {
  const result = calcNEWS2({ temperature: 38.5, respiratoryRate: 26 });
  assert.equal(result.complete, false);
});

test("mild deterioration follows Scale 1 and scores 5 medium", () => {
  const result = calcNEWS2({
    temperature: 38.1, pulse: 102, respiratoryRate: 22, spo2: 94,
    systolicBP: 115, consciousness: "A", onOxygen: false,
  });
  assert.equal(result.total, 5);
  assert.equal(result.risk, "medium");
});

test("significant deterioration scores NEWS2 11 high", () => {
  const result = calcNEWS2({
    temperature: 38.5, pulse: 120, respiratoryRate: 26, spo2: 90,
    systolicBP: 95, consciousness: "A", onOxygen: false,
  });
  assert.equal(result.complete, true);
  assert.equal(result.total, 11);
  assert.equal(result.risk, "high");
  assert.deepEqual(result.breakdown, {
    RR: 3, SpO2: 3, Oxygen: 0, Temp: 1, BP: 2, Pulse: 2, Consciousness: 0,
  });
});

test("supplemental oxygen adds two points", () => {
  const result = calcNEWS2({ ...normal, onOxygen: true });
  assert.equal(result.total, 2);
  assert.equal(result.breakdown.Oxygen, 2);
});

for (const consciousness of ["C", "V", "P", "U"] as const) {
  test(`${consciousness} consciousness adds three points`, () => {
    const result = calcNEWS2({ ...normal, consciousness });
    assert.equal(result.total, 3);
    assert.equal(result.breakdown.Consciousness, 3);
    assert.equal(result.risk, "low-medium");
  });
}

const boundaries: Array<[string, keyof VitalSign, number, number]> = [
  ["RR 8", "respiratoryRate", 8, 3], ["RR 9", "respiratoryRate", 9, 1],
  ["RR 12", "respiratoryRate", 12, 0], ["RR 21", "respiratoryRate", 21, 2],
  ["RR 25", "respiratoryRate", 25, 3], ["SpO2 91", "spo2", 91, 3],
  ["SpO2 92", "spo2", 92, 2], ["SpO2 94", "spo2", 94, 1],
  ["SpO2 96", "spo2", 96, 0], ["Temp 35", "temperature", 35, 3],
  ["Temp 35.1", "temperature", 35.1, 1], ["Temp 36.1", "temperature", 36.1, 0],
  ["Temp 38.1", "temperature", 38.1, 1], ["Temp 39.1", "temperature", 39.1, 2],
  ["SBP 90", "systolicBP", 90, 3], ["SBP 91", "systolicBP", 91, 2],
  ["SBP 101", "systolicBP", 101, 1], ["SBP 111", "systolicBP", 111, 0],
  ["SBP 220", "systolicBP", 220, 3], ["Pulse 40", "pulse", 40, 3],
  ["Pulse 41", "pulse", 41, 1], ["Pulse 51", "pulse", 51, 0],
  ["Pulse 91", "pulse", 91, 1], ["Pulse 111", "pulse", 111, 2],
  ["Pulse 131", "pulse", 131, 3],
];

for (const [label, field, value, expected] of boundaries) {
  test(`${label} boundary scores ${expected}`, () => {
    const result = calcNEWS2({ ...normal, [field]: value });
    assert.equal(result.total, expected);
  });
}

function vital(id: string, recordedAt: string, fields: Partial<VitalSign>): VitalSign {
  return {
    id,
    residentId: "R-TEST",
    date: recordedAt.slice(0, 10),
    time: recordedAt.slice(11, 16),
    recordedAt,
    recordedByUserId: "U-TEST",
    recordedByName: "Tester",
    recordedByRole: "nurse",
    createdAt: recordedAt,
    auditTrail: [],
    ...fields,
  };
}

test("weight increase alert triggers at 4.5 percent inclusive", () => {
  const previous = vital("w-prev", "2026-07-01T09:00:00.000Z", { weight: 70 });
  const current = vital("w-current", "2026-07-20T09:00:00.000Z", { weight: 73.15 });
  const alerts = derivedAlertsForResident([current, previous], undefined, { sourceVitalId: current.id });
  const weightAlert = alerts.find((alert) => alert.type === "weight_gain");
  assert.equal(weightAlert?.severity, "warning");
  assert.equal(weightAlert?.sourceVitalId, current.id);
});

test("weight decrease alert triggers at 4.5 percent inclusive", () => {
  const previous = vital("w-prev", "2026-07-01T09:00:00.000Z", { weight: 70 });
  const current = vital("w-current", "2026-07-20T09:00:00.000Z", { weight: 66.85 });
  const alerts = derivedAlertsForResident([current, previous], undefined, { sourceVitalId: current.id });
  assert.equal(alerts.find((alert) => alert.type === "weight_loss")?.severity, "warning");
});

test("weight change below 4.5 percent does not alert", () => {
  const previous = vital("w-prev", "2026-07-01T09:00:00.000Z", { weight: 70 });
  const current = vital("w-current", "2026-07-20T09:00:00.000Z", { weight: 72.8 });
  const alerts = derivedAlertsForResident([current, previous], undefined, { sourceVitalId: current.id });
  assert.equal(alerts.some((alert) => alert.type === "weight_gain" || alert.type === "weight_loss"), false);
});

test("first valid weight reading does not alert", () => {
  const current = vital("w-current", "2026-07-20T09:00:00.000Z", { weight: 70 });
  const alerts = derivedAlertsForResident([current], undefined, { sourceVitalId: current.id });
  assert.equal(alerts.some((alert) => alert.type === "weight_gain" || alert.type === "weight_loss"), false);
});

test("temperature 37.9 C does not alert", () => {
  const current = vital("temp-current", "2026-07-20T09:00:00.000Z", { temperature: 37.9 });
  const alerts = derivedAlertsForResident([current], undefined, { sourceVitalId: current.id });
  assert.equal(alerts.some((alert) => alert.type === "abnormal_temp"), false);
});

test("temperature 38.0 C alerts as warning", () => {
  const current = vital("temp-current", "2026-07-20T09:00:00.000Z", { temperature: 38 });
  const alerts = derivedAlertsForResident([current], undefined, { sourceVitalId: current.id });
  assert.equal(alerts.find((alert) => alert.type === "abnormal_temp")?.severity, "warning");
});

test("temperature 39.2 C alerts as high", () => {
  const current = vital("temp-current", "2026-07-20T09:00:00.000Z", { temperature: 39.2 });
  const alerts = derivedAlertsForResident([current], undefined, { sourceVitalId: current.id });
  assert.equal(alerts.find((alert) => alert.type === "abnormal_temp")?.severity, "high");
});

test("temperature 40.0 C alerts as critical", () => {
  const current = vital("temp-current", "2026-07-20T09:00:00.000Z", { temperature: 40 });
  const alerts = derivedAlertsForResident([current], undefined, { sourceVitalId: current.id });
  assert.equal(alerts.find((alert) => alert.type === "abnormal_temp")?.severity, "critical");
});

test("temperature below 36.0 C alerts as high", () => {
  const current = vital("temp-current", "2026-07-20T09:00:00.000Z", { temperature: 35.9 });
  const alerts = derivedAlertsForResident([current], undefined, { sourceVitalId: current.id });
  const alert = alerts.find((item) => item.type === "abnormal_temp");
  assert.equal(alert?.severity, "high");
  assert.equal(alert?.title, "Low Temperature");
});

test("fahrenheit temperatures are normalised before alerting", () => {
  const current = vital("temp-current", "2026-07-20T09:00:00.000Z", {
    temperature: 100.4,
    observationDetails: { temperatureUnit: "F" },
  });
  const alerts = derivedAlertsForResident([current], undefined, { sourceVitalId: current.id });
  const alert = alerts.find((item) => item.type === "abnormal_temp");
  assert.equal(alert?.severity, "warning");
  assert.match(alert?.currentValue || "", /38\.0/);
});
