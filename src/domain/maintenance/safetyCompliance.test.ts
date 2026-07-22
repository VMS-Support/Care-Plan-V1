import assert from "node:assert/strict";
import test from "node:test";
import type {
  MaintenanceAsset,
  SafetyCategory,
  SafetyCertificate,
  SafetyInspection,
  SafetyInspectionEvidence,
  SafetyInspectionObservation,
  SafetyInspectionOccurrence,
  SafetyInspectionResponse,
  SafetyInspectionSchedule,
  SafetyInspectionTemplate,
  SafetyInspectionTemplateEvidenceRequirement,
} from "../../lib/care/types.ts";
import {
  DEFAULT_SAFETY_CATEGORIES,
  evaluateSafetyInspection,
  nextSafetyDueDate,
  safetyDashboardMetrics,
  safetyPresentationStatus,
  validateSafetySchedule,
  validateSafetyTemplate,
} from "./safetyCompliance.ts";

test("default Safety & Compliance categories match Phase 4 scope", () => {
  assert.deepEqual(DEFAULT_SAFETY_CATEGORIES.map((item) => item.code), [
    "FIRE_SAFETY",
    "WATER_SAFETY",
    "ELECTRICAL",
    "HEATING",
    "NURSE_CALL",
    "KITCHEN_EQUIPMENT",
    "LAUNDRY_EQUIPMENT",
    "SLUICE_EQUIPMENT",
    "RESIDENT_EQUIPMENT",
  ]);
});

test("template and schedule validation blocks inactive and mismatched records", () => {
  const inactiveCategory = category({ active: false });
  assert.equal(validateSafetyTemplate(template({ categoryId: inactiveCategory.id }), [inactiveCategory]).valid, false);

  const activeCategory = category();
  const inactiveTemplate = template({ active: false });
  const assetInOtherHome = asset({ homeId: "home-2", facilityId: "home-2" });
  const result = validateSafetySchedule(schedule({ assetId: assetInOtherHome.id, templateId: inactiveTemplate.id }), {
    categories: [activeCategory],
    templates: [inactiveTemplate],
    assets: [assetInOtherHome],
  });

  assert.equal(result.valid, false);
  assert.equal(result.fieldErrors.templateId, "Select an active inspection template.");
  assert.equal(result.fieldErrors.assetId, "Select an active asset in this Home.");
});

test("due presentation separates scheduled, due soon, due today and overdue", () => {
  const today = new Date("2026-07-22T08:00:00.000Z");
  assert.equal(safetyPresentationStatus(occurrence({ dueDate: "2026-07-30" }), today), "SCHEDULED");
  assert.equal(safetyPresentationStatus(occurrence({ dueDate: "2026-07-25" }), today), "DUE_SOON");
  assert.equal(safetyPresentationStatus(occurrence({ dueDate: "2026-07-22" }), today), "DUE_TODAY");
  assert.equal(safetyPresentationStatus(occurrence({ dueDate: "2026-07-21" }), today), "OVERDUE");
});

test("completion evaluation blocks incomplete required inspection content", () => {
  const inspection = safetyInspection({ declarationAccepted: false, evidenceRequired: true });
  const result = evaluateSafetyInspection({
    inspection,
    responses: [response({ mandatory: true, result: "UNANSWERED" })],
    observations: [],
    evidence: [],
    requirements: [evidenceRequirement({ mandatory: true })],
  });

  assert.equal(result.canComplete, false);
  assert.ok(result.blockers.some((item) => item.includes("Answer mandatory item")));
  assert.ok(result.blockers.some((item) => item.includes("Attach required evidence")));
  assert.ok(result.blockers.includes("Accept the inspection declaration."));
});

test("failed responses produce failed inspection outcome and require observations when configured", () => {
  const inspection = safetyInspection({ declarationAccepted: true });
  const failed = response({ result: "FAIL", correctiveActionRequired: true });
  const blocked = evaluateSafetyInspection({ inspection, responses: [failed], observations: [], evidence: [], requirements: [] });
  assert.equal(blocked.canComplete, false);
  assert.ok(blocked.blockers.some((item) => item.includes("Record observation for failed item")));

  const completed = evaluateSafetyInspection({
    inspection,
    responses: [failed],
    observations: [observation({ responseId: failed.id })],
    evidence: [],
    requirements: [],
  });
  assert.equal(completed.canComplete, true);
  assert.equal(completed.overallResult, "FAIL");
  assert.equal(completed.nextStatus, "FAILED");
});

test("certificate-required inspections require a certificate before completion", () => {
  const inspection = safetyInspection({ declarationAccepted: true, certificateRequired: true });
  const missing = evaluateSafetyInspection({ inspection, responses: [response({ result: "PASS" })], observations: [], evidence: [], requirements: [] });
  assert.equal(missing.canComplete, false);
  assert.ok(missing.blockers.includes("Attach the required certificate."));

  const withCertificate = evaluateSafetyInspection({ inspection, responses: [response({ result: "PASS" })], observations: [], evidence: [], requirements: [], certificate: certificate() });
  assert.equal(withCertificate.canComplete, true);
});

test("dashboard metrics and next due dates use shared Safety & Compliance rules", () => {
  assert.equal(nextSafetyDueDate("2026-07-22", "weekly", 2), "2026-08-05");
  assert.equal(nextSafetyDueDate("2026-07-22", "monthly", 1), "2026-08-22");

  const metrics = safetyDashboardMetrics({
    categories: [category()],
    templates: [template()],
    schedules: [schedule()],
    occurrences: [occurrence({ dueDate: "2026-07-21" }), occurrence({ id: "occ-2", dueDate: "2026-07-22" })],
    inspections: [safetyInspection({ status: "FAILED", overallResult: "FAIL" })],
    certificates: [certificate({ expiryDate: "2026-08-01" })],
    workOrders: [],
    today: new Date("2026-07-22T08:00:00.000Z"),
  });
  assert.equal(metrics.activeTemplates, 1);
  assert.equal(metrics.activeSchedules, 1);
  assert.equal(metrics.overdue, 1);
  assert.equal(metrics.dueSoon, 1);
  assert.equal(metrics.failed, 1);
  assert.equal(metrics.certificatesExpiring, 1);
});

function category(overrides: Partial<SafetyCategory> = {}): SafetyCategory {
  return {
    ...DEFAULT_SAFETY_CATEGORIES[0],
    id: "cat-fire",
    tenantId: "tenant",
    createdBy: "Tester",
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedBy: "Tester",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function template(overrides: Partial<SafetyInspectionTemplate> = {}): SafetyInspectionTemplate {
  return {
    id: "template-1",
    tenantId: "tenant",
    homeId: "home-1",
    facilityId: "home-1",
    categoryId: "cat-fire",
    name: "Weekly Fire Alarm Test",
    description: "Test the fire alarm.",
    templateCode: "FIRE-001",
    version: 1,
    status: "ACTIVE",
    active: true,
    defaultFrequencyType: "weekly",
    defaultFrequencyInterval: 1,
    estimatedDurationMinutes: 30,
    defaultPriority: "HIGH",
    verificationRequired: true,
    certificateRequired: false,
    evidenceRequired: false,
    instructions: "Test panel.",
    safetyPrecautions: "Notify staff.",
    effectiveFrom: "2026-07-01",
    createdBy: "Tester",
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedBy: "Tester",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function asset(overrides: Partial<MaintenanceAsset> = {}): MaintenanceAsset {
  return {
    id: "asset-1",
    tenantId: "tenant",
    homeId: "home-1",
    facilityId: "home-1",
    assetNumber: "AST-00001",
    assetName: "Main Fire Panel",
    categoryId: "maintenance-asset-category-fire",
    locationLabel: "Reception",
    condition: "Good",
    operationalStatus: "Operational",
    assetStatus: "Active",
    criticality: "High",
    active: true,
    createdBy: "Tester",
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedBy: "Tester",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function schedule(overrides: Partial<SafetyInspectionSchedule> = {}): SafetyInspectionSchedule {
  return {
    id: "schedule-1",
    tenantId: "tenant",
    homeId: "home-1",
    facilityId: "home-1",
    categoryId: "cat-fire",
    templateId: "template-1",
    assetId: "asset-1",
    scheduleName: "Weekly Fire Alarm Test",
    frequencyType: "weekly",
    frequencyInterval: 1,
    startDate: "2026-07-22",
    nextDueDate: "2026-07-22",
    generateDaysBeforeDue: 7,
    dueSoonDays: 7,
    active: true,
    paused: false,
    priority: "HIGH",
    autoCreateInspection: true,
    autoCreateCorrectiveWorkOrder: true,
    createdBy: "Tester",
    createdAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function occurrence(overrides: Partial<SafetyInspectionOccurrence> = {}): SafetyInspectionOccurrence {
  return {
    id: "occ-1",
    scheduleId: "schedule-1",
    tenantId: "tenant",
    homeId: "home-1",
    facilityId: "home-1",
    categoryId: "cat-fire",
    templateId: "template-1",
    assetId: "asset-1",
    dueDate: "2026-07-22",
    windowStart: "2026-07-22",
    windowEnd: "2026-07-22",
    status: "SCHEDULED",
    priority: "HIGH",
    createdAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function safetyInspection(overrides: Partial<SafetyInspection> = {}): SafetyInspection {
  return {
    id: "inspection-1",
    tenantId: "tenant",
    homeId: "home-1",
    facilityId: "home-1",
    inspectionNumber: "SC-2026-0001",
    inspectionType: "SCHEDULED",
    categoryId: "cat-fire",
    templateId: "template-1",
    templateVersion: 1,
    assetId: "asset-1",
    title: "Weekly Fire Alarm Test",
    dueDate: "2026-07-22",
    status: "IN_PROGRESS",
    overallResult: "NOT_COMPLETED",
    verificationRequired: false,
    certificateRequired: false,
    evidenceRequired: false,
    declarationAccepted: true,
    startedBy: "Tester",
    startedAt: "2026-07-22T08:00:00.000Z",
    createdAt: "2026-07-22T08:00:00.000Z",
    updatedAt: "2026-07-22T08:00:00.000Z",
    ...overrides,
  };
}

function response(overrides: Partial<SafetyInspectionResponse> = {}): SafetyInspectionResponse {
  return {
    id: "response-1",
    inspectionId: "inspection-1",
    templateItemId: "item-1",
    templateItemCode: "ITEM-1",
    sectionName: "General",
    questionLabelSnapshot: "Panel activates correctly",
    responseType: "PASS_FAIL",
    result: "PASS",
    mandatory: true,
    failureSeverity: "HIGH",
    correctiveActionRequired: false,
    evidenceRequired: false,
    displayOrder: 1,
    ...overrides,
  };
}

function observation(overrides: Partial<SafetyInspectionObservation> = {}): SafetyInspectionObservation {
  return {
    id: "observation-1",
    inspectionId: "inspection-1",
    responseId: "response-1",
    observationType: "DEFECT",
    description: "Panel failed sounder test.",
    severity: "HIGH",
    immediateActionRequired: true,
    correctiveActionRequired: true,
    createdBy: "Tester",
    createdAt: "2026-07-22T08:10:00.000Z",
    updatedBy: "Tester",
    updatedAt: "2026-07-22T08:10:00.000Z",
    ...overrides,
  };
}

function evidenceRequirement(overrides: Partial<SafetyInspectionTemplateEvidenceRequirement> = {}): SafetyInspectionTemplateEvidenceRequirement {
  return {
    id: "evidence-req-1",
    templateId: "template-1",
    evidenceType: "PHOTO",
    label: "Panel photo",
    mandatory: true,
    minimumCount: 1,
    instructions: "Upload a clear photo.",
    ...overrides,
  };
}

function certificate(overrides: Partial<SafetyCertificate> = {}): SafetyCertificate {
  return {
    id: "certificate-1",
    tenantId: "tenant",
    homeId: "home-1",
    facilityId: "home-1",
    categoryId: "cat-fire",
    inspectionId: "inspection-1",
    certificateType: "Fire Alarm",
    certificateNumber: "CERT-001",
    issuedBy: "Tester",
    issuedDate: "2026-07-22",
    validFrom: "2026-07-22",
    expiryDate: "2026-08-22",
    status: "VALID",
    createdBy: "Tester",
    createdAt: "2026-07-22T08:00:00.000Z",
    updatedBy: "Tester",
    updatedAt: "2026-07-22T08:00:00.000Z",
    ...overrides,
  };
}

void assert;
