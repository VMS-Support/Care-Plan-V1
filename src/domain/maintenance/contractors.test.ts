import assert from "node:assert/strict";
import {
  canTransitionContractorStatus,
  contractorDashboardMetrics,
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

console.log("maintenance contractor domain tests passed");
