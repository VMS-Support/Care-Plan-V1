import assert from "node:assert/strict";
import { appendComplianceReview, archiveServiceTrade, contractorReviewPresentation, linkCorrectiveAction, scheduleExpiryReminder, triggerExpiryEscalation, uploadDocumentVersion, type ContractorComplianceReview, type MaintenanceDocumentRecord, type ServiceTrade } from "./phase5aGovernance.ts";

const service: ServiceTrade = { id: "electrical", tenantId: "tenant", name: "Electrical", category: "Engineering", active: true, displayOrder: 1, approvalRequired: true, requiredInsuranceTypes: ["PUBLIC_LIABILITY"], requiredCertificateTypeIds: ["electrical-qualification"], requiredDocumentTypes: [], nursingHomeApprovalRequired: true, internalVerificationRequired: true, assignmentOverridePermitted: false, riskClassification: "HIGH", updatedAt: "2026-08-06" };
const archived = archiveServiceTrade([service], service.id, "2026-08-06");
assert.equal(archived[0].name, "Electrical");
assert.equal(archived[0].active, false);

const review: ContractorComplianceReview = { id: "review-1", tenantId: "tenant", contractorId: "contractor-1", reviewScope: "GLOBAL", reviewedByUserId: "user-1", reviewedByNameSnapshot: "Reviewer", reviewedAt: "2026-08-06", decision: "APPROVED_WITH_CONDITIONS", complianceStatusSnapshot: "DUE_SOON", serviceIdsReviewed: [service.id], insuranceFindings: [], certificateFindings: [], missingRequirements: [], conditions: "Renew insurance", nextReviewDate: "2026-09-01", evidenceReferences: [], createdAt: "2026-08-06", updatedAt: "2026-08-06" };
assert.equal(appendComplianceReview(appendComplianceReview([], review), review).length, 1);
assert.equal(contractorReviewPresentation(review), "Approved with Conditions");

const document: MaintenanceDocumentRecord = { id: "doc-1", tenantId: "tenant", homeId: "home-1", reference: "DOC-1", title: "Risk Assessment", documentType: "RISK_ASSESSMENT", currentVersionId: "v1", versions: [{ id: "v1", versionNumber: 1, fileName: "old.pdf", uploadedBy: "User", uploadedAt: "2026-01-01", status: "CURRENT", current: true }] };
const renewed = uploadDocumentVersion(document, { idempotencyKey: "v2", fileName: "new.pdf", uploadedBy: "User 2", uploadedAt: "2026-08-06", expiryDate: "2027-08-06" }, new Date("2026-08-06"));
assert.equal(renewed.currentVersionId, "v2");
assert.equal(renewed.versions.find((item) => item.id === "v1")?.status, "SUPERSEDED");
assert.equal(renewed.versions.length, 2);

const reminder = { sourceId: "cert-1", sourceVersionId: "v1", expiryDate: "2026-09-01", thresholdDays: 30, recipient: "manager" };
assert.equal(scheduleExpiryReminder(scheduleExpiryReminder([], reminder), reminder).length, 1);
let escalations = triggerExpiryEscalation([], { sourceKey: "cert-1:v1", ruleId: "critical-expiry", severity: "HIGH", actionsApplied: ["NOTIFY_MANAGER"] });
escalations = triggerExpiryEscalation(escalations, { sourceKey: "cert-1:v1", ruleId: "critical-expiry", severity: "HIGH", actionsApplied: ["NOTIFY_MANAGER"] });
assert.equal(escalations.length, 1);
assert.equal(linkCorrectiveAction(linkCorrectiveAction(escalations, escalations[0].id, "ca-1"), escalations[0].id, "ca-2")[0].correctiveActionId, "ca-1");
console.log("phase 5A governance tests passed");
