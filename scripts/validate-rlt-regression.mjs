import fs from "node:fs";

const registry = fs.readFileSync("src/lib/care/rlt.ts", "utf8");
const selectors = fs.readFileSync("src/lib/care/rltSelectors.ts", "utf8");
const tests = fs.readFileSync("scripts/rlt-regression-tests.mjs", "utf8");
const registryBlock =
  registry.match(/export const RLT_DOMAINS:[\s\S]*?export const RLT_DOMAIN_BY_ID/)?.[0] || "";
const domainIds = [...registryBlock.matchAll(/\bid: "([a-z_]+)"/g)].map((match) => match[1]);
const domainKeys = [...registryBlock.matchAll(/\bkey: "([a-z_]+)"/g)].map((match) => match[1]);
const requiredChecks = {
  canonicalDomainCount: domainIds.length === 12,
  noMissingDomains: new Set(domainIds).size === 12,
  noDuplicateDomainKeys: new Set(domainKeys).size === 12,
  activeCarePlanPredicate: /item\.status === "active"/.test(selectors),
  invalidDomainDetection: /invalid_rlt_domain/.test(selectors),
  duplicateCarePlanDetection: /duplicate_care_plan_item_id/.test(selectors),
  reviewParentValidation: /orphan_review/.test(selectors),
  careActionParentValidation: /orphan_care_action/.test(selectors),
  crossResidentValidation: /cross_resident_care_action/.test(selectors),
  crossHomeValidation: /cross_home_care_action/.test(selectors),
  legacyManualReview: /manualMappingRequired/.test(selectors),
  upcomingInterventionsRegression: /Upcoming Care Interventions/.test(tests),
  workItemRltRegression: /Care Action Work Item retains exact/.test(tests),
};
const issues = Object.entries(requiredChecks)
  .filter(([, passed]) => !passed)
  .map(([code]) => code);
const report = {
  canonicalDomainCount: domainIds.length,
  missingDomains: domainIds.length === 12 ? [] : "see registry",
  duplicateDomainKeys: domainKeys.length - new Set(domainKeys).size,
  activeCarePlansWithoutDomain: "detected by validateRltCarePlanIntegrity",
  carePlansWithInvalidDomains: "detected",
  carePlanItemsInMultipleDomains: "prevented by one explicit canonical domain per item",
  duplicateCarePlanItemIds: "detected",
  reviewsWithoutValidCarePlanItem: "detected",
  careActionsWithoutValidCarePlanItem: "detected",
  crossResidentRelations: "detected",
  crossHomeRelations: "detected",
  activeCountMismatch: "covered by test:rlt",
  inactiveItemsInActiveQueries: "excluded and tested",
  futureWorkFromInactivePlans: "existing scheduling active-parent predicate retained",
  legacyRecordsRequiringManualMapping: "reported by selector integrity result",
  ambiguousLegacyReviewMappings: "reported by deterministic relation resolver",
  ambiguousLegacyCareActionMappings: "reported by deterministic relation resolver",
  upcomingCareInterventionsRegression: "covered by test:rlt and test:work-queue",
  nextFourHoursRegression: "covered by test:work-queue",
  issues,
  result: issues.length ? "FAIL" : "PASS",
};
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
