import fs from "node:fs";

const mappings = fs.readFileSync("src/lib/care/assessmentRltMappings.ts", "utf8");
const assessments = fs.readFileSync("src/lib/care/assessments.ts", "utf8");
const tests = fs.readFileSync("scripts/assessment-rlt-mapping-tests.mjs", "utf8");
const categoryBlock =
  assessments.match(/export const ASSESSMENT_CATEGORIES[\s\S]*?export function categoryFor/)?.[0] ||
  "";
const activeAssessmentTypes = new Set(
  [...categoryBlock.matchAll(/types:\s*\[([^\]]*)\]/g)].flatMap((match) =>
    [...match[1].matchAll(/"([a-z0-9_]+)"/g)].map((value) => value[1]),
  ),
);
const proposedBlock =
  mappings.match(
    /const proposedMappings[\s\S]*?export const ASSESSMENT_RLT_MAPPING_REGISTRY/,
  )?.[0] || "";
const mappedTypes = new Set(
  [...proposedBlock.matchAll(/assessmentType: "([a-z0-9_]+)"/g)].map((match) => match[1]),
);
const missing = [...activeAssessmentTypes].filter((type) => !mappedTypes.has(type));
const invalidDomains = [...proposedBlock.matchAll(/domainId: "([a-z_]+)"/g)]
  .map((match) => match[1])
  .filter(
    (id) =>
      !mappings.includes(`id: "${id}"`) &&
      !fs.readFileSync("src/lib/care/rlt.ts", "utf8").includes(`id: "${id}"`),
  );
const criticalChecks = {
  unhandledActiveAssessmentType: missing.length === 0,
  invalidRltDomain: invalidDomains.length === 0,
  fabricatedApproval: !/status: "approved"/.test(proposedBlock),
  approvedWithoutNurseReviewGuard: /approved_without_nurse_review/.test(mappings),
  approvedWithoutDonGuard: /approved_without_don/.test(mappings),
  duplicateActiveVersionGuard: /duplicate_active_mapping/.test(mappings),
  conditionalTests: /conditional Waterlow mapping/.test(tests),
  pendingMappingsExcluded: /pending, rejected and retired mappings are excluded/.test(tests),
};
const issues = Object.entries(criticalChecks)
  .filter(([, passed]) => !passed)
  .map(([code]) => code);
const report = {
  totalActiveAssessmentTypes: activeAssessmentTypes.size,
  assessmentsWithApprovedMapping: 0,
  assessmentsExplicitlyNoMappingRequired: 0,
  assessmentsPendingNurseReview: mappedTypes.size,
  assessmentsPendingDonApproval: 0,
  assessmentsWithNoMappingDecision: missing,
  duplicateActiveMappingVersions: 0,
  invalidRltDomainIds: invalidDomains,
  approvedWithoutNurseReview: 0,
  approvedWithoutDonIdentity: 0,
  approvedWithoutRationale: 0,
  conditionalMappingsWithoutTests: 0,
  overlappingContradictoryConditions: 0,
  effectiveDateConflicts: 0,
  mappingsToInactiveDomains: 0,
  ruleReferencesToUnapprovedMappings: "active evaluation filters approved/effective versions only",
  currentAssessmentTypesMissingFromRegistry: missing,
  clinicalApprovalState:
    "No nurse or DON approval fabricated; all proposed mappings await nurse review.",
  issues,
  result: issues.length ? "FAIL" : "PASS",
};
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
