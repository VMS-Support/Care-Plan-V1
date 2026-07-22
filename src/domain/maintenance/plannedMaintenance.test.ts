import assert from "node:assert/strict";
import test from "node:test";
import type { MaintenanceTemplate, PlannedMaintenanceOccurrence, PlannedMaintenanceSchedule } from "../../lib/care/types.ts";
import {
  addFrequency,
  buildGeneratedWorkOrderInput,
  generateOccurrencesForSchedule,
  occurrenceStatus,
  validateScheduleInput,
  validateTemplateInput,
} from "./plannedMaintenance.ts";

test("recurrence supports standard and custom frequencies", () => {
  assert.equal(addFrequency("2026-07-22", "daily", 1), "2026-07-23");
  assert.equal(addFrequency("2026-07-22", "weekly", 1), "2026-07-29");
  assert.equal(addFrequency("2026-07-22", "quarterly", 1), "2026-10-22");
  assert.equal(addFrequency("2026-07-22", "six_monthly", 1), "2027-01-22");
  assert.equal(addFrequency("2026-07-22", "custom_weeks", 3), "2026-08-12");
});

test("schedule generation avoids duplicate occurrences and respects end date", () => {
  const schedule = scheduleRecord({ startDate: "2026-07-01", nextDueDate: "2026-07-01", endDate: "2026-07-15", frequencyType: "weekly" });
  const existing: PlannedMaintenanceOccurrence[] = [{ id: "occ-1", scheduleId: schedule.id, dueDate: "2026-07-01", status: "Scheduled" }];
  const generated = generateOccurrencesForSchedule({ schedule, existing, until: "2026-08-31" });
  assert.deepEqual(generated.map((item) => item.dueDate), ["2026-07-08", "2026-07-15"]);
});

test("paused or inactive schedules do not generate occurrences", () => {
  assert.equal(generateOccurrencesForSchedule({ schedule: scheduleRecord({ active: false }), existing: [], until: "2026-08-31" }).length, 0);
  assert.equal(generateOccurrencesForSchedule({ schedule: scheduleRecord({ pausedAt: "2026-07-20T00:00:00.000Z" }), existing: [], until: "2026-08-31" }).length, 0);
});

test("validation blocks incomplete templates and inactive template schedule selection", () => {
  assert.equal(validateTemplateInput({ name: "", category: "FIRE_SAFETY", frequencyType: "weekly", frequencyValue: 1 }).valid, false);
  const template = templateRecord({ active: false });
  const asset = { id: "asset-1", name: "Room 1", homeId: "home-1", locationLabel: "Room 1", category: "Room" as const, active: true };
  const result = validateScheduleInput(scheduleRecord({ templateId: template.id, assetId: asset.id }), [asset], [template]);
  assert.equal(result.valid, false);
  assert.equal(result.fieldErrors.templateId, "Inactive templates cannot be selected.");
});

test("generated Work Order input carries planned maintenance references", () => {
  const template = templateRecord();
  const schedule = scheduleRecord({ templateId: template.id });
  const occurrence: PlannedMaintenanceOccurrence = { id: "occ-1", scheduleId: schedule.id, dueDate: "2026-07-22", status: "Scheduled" };
  const input = buildGeneratedWorkOrderInput({ schedule, template, occurrence, checklist: [{ id: "c1", templateId: template.id, displayOrder: 1, item: "Check panel", mandatory: true }], evidence: [{ id: "e1", templateId: template.id, evidenceType: "Reading" }] });
  assert.equal(input.source, "PLANNED_MAINTENANCE");
  assert.equal(input.type, "PREVENTIVE");
  assert.equal(input.plannedMaintenanceOccurrenceId, occurrence.id);
  assert.equal(input.verificationRequired, true);
});

test("occurrence status separates due soon, due today and overdue", () => {
  assert.equal(occurrenceStatus({ id: "a", scheduleId: "s", dueDate: "2026-07-22", status: "Scheduled" }, new Date("2026-07-22T09:00:00.000Z")), "Due Today");
  assert.equal(occurrenceStatus({ id: "b", scheduleId: "s", dueDate: "2026-07-23", status: "Scheduled" }, new Date("2026-07-22T09:00:00.000Z")), "Due Soon");
  assert.equal(occurrenceStatus({ id: "c", scheduleId: "s", dueDate: "2026-07-21", status: "Scheduled" }, new Date("2026-07-22T09:00:00.000Z")), "Overdue");
});

function templateRecord(patch: Partial<MaintenanceTemplate> = {}): MaintenanceTemplate {
  return {
    id: "template-1",
    tenantId: "tenant",
    homeId: "home-1",
    facilityId: "home-1",
    name: "Weekly Fire Alarm Test",
    description: "Test the fire alarm.",
    category: "FIRE_SAFETY",
    active: true,
    estimatedDurationMinutes: 30,
    verificationRequired: true,
    safetyPrecautions: "Notify staff before test.",
    skillsRequired: "Competent maintenance staff.",
    frequencyType: "weekly",
    frequencyValue: 1,
    colour: "#ef4444",
    createdBy: "Tester",
    createdAt: "2026-07-22T09:00:00.000Z",
    ...patch,
  };
}

function scheduleRecord(patch: Partial<PlannedMaintenanceSchedule> = {}): PlannedMaintenanceSchedule {
  return {
    id: "schedule-1",
    tenantId: "tenant",
    homeId: "home-1",
    facilityId: "home-1",
    assetId: "asset-1",
    assetName: "Room 1",
    locationLabel: "Room 1",
    templateId: "template-1",
    responsibleTeamId: "maintenance-team",
    startDate: "2026-07-22",
    nextDueDate: "2026-07-22",
    active: true,
    frequencyType: "weekly",
    frequencyValue: 1,
    generateDaysBeforeDue: 7,
    createdBy: "Tester",
    createdAt: "2026-07-22T09:00:00.000Z",
    ...patch,
  };
}
