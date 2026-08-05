import assert from "node:assert/strict";
import test from "node:test";
import type { MaintenanceContractor, MaintenanceContractorHomeAssociation, SafetyInspection, SafetyInspectionResponse } from "../../lib/care/types.ts";
import { buildReinspectionResponses, failedResponsesForReinspection, maintenanceMarkAllEligibility, reinspectionCanBeCreated, validateContractorAssignment, validateIndependentActor } from "./phase3Workflow.ts";

test("reinspection is separate and preserves the original failed response", () => {
  const original = inspection();
  const failed = response();
  const next = buildReinspectionResponses({ inspectionId: "inspection-2", failedResponses: failedResponsesForReinspection([failed]) });
  assert.equal(reinspectionCanBeCreated(original), true);
  assert.equal(next[0].inspectionId, "inspection-2");
  assert.equal(next[0].result, "UNANSWERED");
  assert.equal(failed.result, "FAIL");
  assert.equal(failed.inspectionId, "inspection-1");
});

test("configured separation of duties blocks the same actor", () => {
  assert.equal(validateIndependentActor({ actor: "User A", originalActor: "User A", required: true, actionLabel: "Verification" }).valid, false);
  assert.equal(validateIndependentActor({ actor: "User A", originalActor: "User A", required: false, actionLabel: "Verification" }).valid, true);
});

test("contractor assignment reports expired insurance and facility restrictions", () => {
  const result = validateContractorAssignment({ contractor: contractor(), association: association({ associationStatus: "RESTRICTED" }), tenantId: "tenant", homeId: "home-1", requiredTrade: "Fire Safety", recordedTrades: ["Electrical"], insuranceExpiryDates: ["2026-07-31"], requiredCertificationValid: false, today: "2026-08-05" });
  assert.equal(result.valid, false);
  assert.ok(result.blockers.some((item) => item.includes("restricted")));
  assert.ok(result.blockers.some((item) => item.includes("insurance")));
  assert.ok(result.blockers.some((item) => item.includes("trade")));
  assert.ok(result.blockers.some((item) => item.includes("certification")));
});

test("maintenance Mark All excludes evidence templates and statutory categories", () => {
  const checklist = [{ id: "one", mandatory: true }, { id: "two", mandatory: true }];
  assert.equal(maintenanceMarkAllEligibility({ category: "PLUMBING", evidenceRequirements: [], checklist }).eligibleIds.length, 2);
  assert.equal(maintenanceMarkAllEligibility({ category: "PLUMBING", evidenceRequirements: ["Reading"], checklist }).eligibleIds.length, 0);
  assert.equal(maintenanceMarkAllEligibility({ category: "FIRE_SAFETY", evidenceRequirements: [], checklist }).allowed, false);
});

function inspection(): SafetyInspection {
  return { id: "inspection-1", tenantId: "tenant", homeId: "home-1", templateId: "template", templateVersion: 1, categoryId: "category", inspectionNumber: "SC-1", inspectionType: "SCHEDULED", status: "FAILED", overallResult: "FAIL", priority: "HIGH", inspectionDate: "2026-08-05", riskIdentified: true, correctiveActionRequired: true, certificateRequired: false, verificationRequired: true, verificationStatus: "REJECTED", declarationAccepted: true, createdAt: "2026-08-05T09:00:00Z", updatedAt: "2026-08-05T09:00:00Z", version: 1 };
}
function response(): SafetyInspectionResponse {
  return { id: "response-1", inspectionId: "inspection-1", templateItemId: "item", templateItemCode: "ITEM", sectionName: "Safety", questionLabelSnapshot: "Safe", responseType: "PASS_FAIL", result: "FAIL", mandatory: true, failureSeverity: "HIGH", correctiveActionRequired: true, evidenceRequired: true, displayOrder: 1, observation: "Failed" };
}
function contractor(): MaintenanceContractor {
  return { id: "contractor", tenantId: "tenant", contractorReference: "CTR-1", legalName: "Contractor", businessType: "LIMITED_COMPANY", status: "ACTIVE", approvalStatus: "APPROVED", restrictionStatus: "NONE", active: true, archived: false, createdBy: "Tester", createdAt: "2026-01-01", version: 1 };
}
function association(patch: Partial<MaintenanceContractorHomeAssociation> = {}): MaintenanceContractorHomeAssociation {
  return { id: "association", tenantId: "tenant", contractorId: "contractor", homeId: "home-1", associationStatus: "ACTIVE", relationshipType: "HOME_PROVIDER", active: true, effectiveFrom: "2026-01-01", createdBy: "Tester", createdAt: "2026-01-01", ...patch };
}
