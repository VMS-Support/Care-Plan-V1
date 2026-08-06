import assert from "node:assert/strict";
import {
  canTransitionContractorStatus,
  contractorDashboardMetrics,
  contractorCompliance,
  contractorProfileCompleteness,
  nextContractorReference,
  potentialContractorDuplicates,
  validateContractorInput,
} from "./contractors.ts";
import type { MaintenanceContractor } from "@/lib/care/types";

const base: MaintenanceContractor = {
  id: "contractor-1",
  tenantId: "tenant-1",
  contractorReference: "CON-000001",
  legalName: "Safe Build Limited",
  tradingName: "Safe Build",
  businessType: "LIMITED_COMPANY",
  generalEmail: "hello@safebuild.ie",
  mainPhone: "+353 1 555 0100",
  primaryContactName: "Aisling Byrne",
  primaryContactEmail: "aisling@safebuild.ie",
  addressLine1: "1 Main Street",
  townCity: "Dublin",
  countryCode: "IE",
  status: "DRAFT",
  approvalStatus: "NOT_REVIEWED",
  restrictionStatus: "NONE",
  active: false,
  archived: false,
  createdBy: "Tester",
  createdAt: "2026-07-22T08:00:00.000Z",
  version: 1,
};

assert.equal(nextContractorReference([base, { ...base, id: "contractor-2", contractorReference: "CON-000009" }]), "CON-000010");

assert.equal(validateContractorInput({ ...base, legalName: "" }).valid, false);
assert.equal(validateContractorInput({ ...base, status: "ACTIVE", generalEmail: "", mainPhone: "", emergencyPhone: "" }).fieldErrors.contact, "Active contractors require at least one company contact method.");
assert.equal(validateContractorInput({ ...base, website: "example.com" }).fieldErrors.website, "Enter a valid website URL starting with http:// or https://.");
assert.equal(validateContractorInput({ ...base, status: "ACTIVE" }).valid, true);

assert.equal(potentialContractorDuplicates({ legalName: " safe   build limited " }, [base]).length, 1);
assert.equal(potentialContractorDuplicates({ companyRegistrationNumber: "12345" }, [{ ...base, companyRegistrationNumber: "12345" }]).length, 1);

assert.equal(canTransitionContractorStatus("DRAFT", "ACTIVE"), true);
assert.equal(canTransitionContractorStatus("DRAFT", "INACTIVE"), false);
assert.equal(canTransitionContractorStatus("ARCHIVED", "ACTIVE"), false);
assert.equal(canTransitionContractorStatus("ARCHIVED", "DRAFT"), false);
assert.equal(canTransitionContractorStatus("ARCHIVED", "INACTIVE"), true);
assert.equal(canTransitionContractorStatus("SUSPENDED", "INACTIVE"), true);

assert.equal(contractorProfileCompleteness(base), 100);
assert.ok(contractorProfileCompleteness({ ...base, primaryContactName: undefined, addressLine1: undefined }) < 100);

const metrics = contractorDashboardMetrics([
  { ...base, id: "draft", status: "DRAFT", active: false },
  { ...base, id: "active", contractorReference: "CON-000002", status: "ACTIVE", active: true },
  { ...base, id: "archived", contractorReference: "CON-000003", status: "ARCHIVED", active: false, archived: true },
], [{ id: "assoc-1", tenantId: "tenant-1", contractorId: "active", homeId: "home-1", associationStatus: "ACTIVE", relationshipType: "HOME_PROVIDER", active: true, effectiveFrom: "2026-07-22", createdBy: "Tester", createdAt: "2026-07-22T08:00:00.000Z" }]);
assert.equal(metrics.total, 2);
assert.equal(metrics.active, 1);
assert.equal(metrics.archived, 1);
assert.equal(metrics.withHomeAssociation, 1);

const approved = { ...base, status: "ACTIVE" as const, active: true, approvalStatus: "APPROVED" as const };
const activeHome = { id: "assoc-approved", tenantId: "tenant-1", contractorId: approved.id, homeId: "home-1", associationStatus: "ACTIVE" as const, relationshipType: "HOME_PROVIDER" as const, accessLevel: "FULL_ACCESS" as const, active: true, effectiveFrom: "2026-01-01", createdBy: "Tester", createdAt: "2026-01-01" };
assert.equal(contractorCompliance({ contractor: approved, association: activeHome, tenantId: "tenant-1", homeId: "home-1", today: new Date("2026-08-05") }).assignable, true);
assert.equal(contractorCompliance({ contractor: approved, association: { ...activeHome, associationStatus: "SUSPENDED" }, tenantId: "tenant-1", homeId: "home-1" }).state, "SUSPENDED");
assert.equal(contractorCompliance({ contractor: approved, association: undefined, tenantId: "tenant-1", homeId: "home-1" }).blockers.includes("Contractor is not approved for this Nursing Home."), true);

console.log("maintenance contractor domain tests passed");
