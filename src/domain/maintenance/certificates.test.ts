import assert from "node:assert/strict";
import {
  certificateComplianceStatus,
  certificateDashboardMetrics,
  missingCertificateRequirements,
  validateCertificateInput,
} from "./certificates.ts";
import type {
  MaintenanceAsset,
  MaintenanceCertificate,
  MaintenanceCertificateAttachment,
  MaintenanceCertificateRequirement,
  MaintenanceCertificateType,
  MaintenanceCertificateVersion,
} from "../../lib/care/types.ts";

const tests: Array<[string, () => void]> = [];
function test(name: string, fn: () => void) {
  tests.push([name, fn]);
}

test("valid certificates remain valid outside warning window", () => {
  const type = certType({ warningDays: 30 });
  const certificate = cert();
  const version = certVersion({ expiryDate: "2026-12-31" });
  assert.equal(certificateComplianceStatus({ certificate, version, type, attachments: [attachment()], today: new Date("2026-07-22") }), "VALID");
});

test("expiry warning and expired status are derived from current version date", () => {
  const type = certType({ warningDays: 90 });
  assert.equal(certificateComplianceStatus({ certificate: cert(), version: certVersion({ expiryDate: "2026-08-15" }), type, attachments: [attachment()], today: new Date("2026-07-22") }), "EXPIRING_SOON");
  assert.equal(certificateComplianceStatus({ certificate: cert(), version: certVersion({ expiryDate: "2026-07-01" }), type, attachments: [attachment()], today: new Date("2026-07-22") }), "EXPIRED");
});

test("required attachments can make a certificate incomplete", () => {
  assert.equal(certificateComplianceStatus({ certificate: cert(), version: certVersion(), type: certType({ attachmentRequired: true }), attachments: [], today: new Date("2026-07-22") }), "MISSING");
});

test("validation rejects invalid date sequence", () => {
  const result = validateCertificateInput({ ...cert(), ...certVersion({ validFromDate: "2026-09-01", expiryDate: "2026-08-01" }) }, { types: [certType()] });
  assert.equal(result.valid, false);
  assert.equal(result.fieldErrors.expiryDate, "Expiry date cannot be before the valid-from date.");
});

test("missing requirements are calculated from active mandatory rules", () => {
  const type = certType();
  const requirement = certRequirement({ certificateTypeId: type.id, subjectType: "ASSET", subjectId: "asset-1" });
  const missing = missingCertificateRequirements({ requirements: [requirement], certificates: [], versions: [], types: [type], assets: [asset()], attachments: [] });
  assert.equal(missing.length, 1);
});

test("matching valid certificate satisfies a requirement", () => {
  const type = certType();
  const certificate = cert({ certificateTypeId: type.id, subjectType: "ASSET", primarySubjectId: "asset-1" });
  const version = certVersion();
  const missing = missingCertificateRequirements({ requirements: [certRequirement({ certificateTypeId: type.id, subjectType: "ASSET", subjectId: "asset-1" })], certificates: [certificate], versions: [version], types: [type], assets: [asset()], attachments: [attachment()] });
  assert.equal(missing.length, 0);
});

test("dashboard counts current compliance bands", () => {
  const type = certType({ warningDays: 90 });
  const metrics = certificateDashboardMetrics({ certificates: [cert()], versions: [certVersion({ expiryDate: "2026-08-15" })], types: [type], attachments: [attachment()], requirements: [], assets: [], today: new Date("2026-07-22") });
  assert.equal(metrics.total, 1);
  assert.equal(metrics.dueSoon, 1);
});

for (const [name, fn] of tests) {
  fn();
  console.log(`ok - ${name}`);
}

function certType(overrides: Partial<MaintenanceCertificateType> = {}): MaintenanceCertificateType {
  return { id: "type-1", tenantId: "tenant", code: "TEST", name: "Test Certificate", category: "SAFETY", defaultValidityMonths: 12, expiryRequired: true, certificateNumberRequired: true, issuingOrganisationRequired: true, attachmentRequired: true, renewalAllowed: true, warningDays: 90, criticalWarningDays: 30, applicableSubjectTypes: ["ASSET"], complianceCritical: true, active: true, systemType: false, displayOrder: 1, createdBy: "System", createdAt: "2026-07-22T00:00:00.000Z", ...overrides };
}

function cert(overrides: Partial<MaintenanceCertificate> = {}): MaintenanceCertificate {
  return { id: "cert-1", tenantId: "tenant", homeId: "home-1", certificateTypeId: "type-1", certificateNumber: "CERT-001", title: "Certificate", issuingOrganisation: "Issuer", subjectType: "ASSET", primarySubjectId: "asset-1", currentVersionId: "version-1", lifecycleStatus: "ACTIVE", complianceStatus: "VALID", active: true, archived: false, createdBy: "User", createdAt: "2026-07-22T00:00:00.000Z", version: 1, ...overrides };
}

function certVersion(overrides: Partial<MaintenanceCertificateVersion> = {}): MaintenanceCertificateVersion {
  return { id: "version-1", tenantId: "tenant", homeId: "home-1", certificateId: "cert-1", versionNumber: 1, certificateNumberSnapshot: "CERT-001", issuedDate: "2026-07-01", validFromDate: "2026-07-01", expiryDate: "2027-07-01", issuingOrganisation: "Issuer", status: "ACTIVE", isCurrent: true, recordedBy: "User", recordedAt: "2026-07-01T00:00:00.000Z", version: 1, ...overrides };
}

function attachment(overrides: Partial<MaintenanceCertificateAttachment> = {}): MaintenanceCertificateAttachment {
  return { id: "attachment-1", tenantId: "tenant", homeId: "home-1", certificateId: "cert-1", certificateVersionId: "version-1", fileReference: "safe/ref", fileName: "certificate.pdf", originalFileName: "certificate.pdf", mimeType: "application/pdf", fileSize: 100, documentType: "CERTIFICATE_FILE", title: "certificate", primaryAttachment: true, uploadedBy: "User", uploadedAt: "2026-07-01T00:00:00.000Z", active: true, ...overrides };
}

function certRequirement(overrides: Partial<MaintenanceCertificateRequirement> = {}): MaintenanceCertificateRequirement {
  return { id: "req-1", tenantId: "tenant", homeId: "home-1", certificateTypeId: "type-1", requirementName: "Requirement", subjectType: "ASSET", mandatory: true, warningDays: 90, graceDays: 0, active: true, effectiveFrom: "2026-07-01", createdBy: "System", createdAt: "2026-07-01T00:00:00.000Z", ...overrides };
}

function asset(overrides: Partial<MaintenanceAsset> = {}): MaintenanceAsset {
  return { id: "asset-1", tenantId: "tenant", homeId: "home-1", assetNumber: "AST-1", assetName: "Asset", categoryId: "category-1", assetStatus: "Active", operationalStatus: "Operational", condition: "Good", criticality: "Medium", active: true, createdBy: "System", createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z", version: 1, ...overrides };
}
