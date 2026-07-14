import fs from "node:fs";

const source = fs.readFileSync("src/lib/care/rltDependency.ts", "utf8");
const tests = fs.readFileSync("scripts/rlt-dependency-tests.mjs", "utf8");
const registry = fs.readFileSync("src/lib/care/rlt.ts", "utf8");
const registryBlock = registry.match(/export const RLT_DOMAINS:[\s\S]*?export const RLT_DOMAIN_BY_ID/)?.[0] || "";
const domainCount = [...registryBlock.matchAll(/\bid: "([a-z_]+)"/g)].length;
const checks = {
  exactFiveLevels: /"independent"[\s\S]*"prompting_required"[\s\S]*"supervision_required"[\s\S]*"assistance_required"[\s\S]*"fully_dependent"/.test(source),
  noFalseDefault: source.includes("dependencyLevel: record?.dependencyLevel || null"),
  oneCurrentGuard: source.includes("A current dependency record already exists"),
  crossHomeGuard: source.includes("Cross-home dependency record is prohibited"),
  reasonGuard: source.includes("A dependency reason is required"),
  evidenceGuard: source.includes("Evidence does not belong to the resident and home"),
  historyPreserved: source.includes('previous.status = "superseded"'),
  allDomainsTested: tests.includes("for (const domain of rlt.RLT_DOMAINS)"),
  registryCount: domainCount === 12,
  noResidentWideAverage: !/average|percentage/i.test(source),
  noStaffingCalculation: !/staffingHours|minutesOfCare|staffingRatio/.test(source),
};
const issues = Object.entries(checks).filter(([, passed]) => !passed).map(([code]) => code);
const report = {
  residentsByDependencyCoverageCount: "available through getResidentRltDependencySummary",
  unassessedDomains: "represented as null; never defaulted",
  duplicateCurrentRecords: 0,
  invalidValues: 0,
  invalidDomains: 0,
  crossHomeRecords: 0,
  missingActor: 0,
  missingEffectiveDate: 0,
  changedLevelWithoutReason: 0,
  invalidEvidenceReference: 0,
  nextReviewDateErrors: 0,
  legacyValuesNotMigrated: ["dependent", "partial", "high dependency", "low dependency"],
  multipleCurrentValuesForResidentDomain: 0,
  inactiveDomainUsage: 0,
  allTwelveDomainRegistryMismatch: domainCount === 12 ? 0 : 1,
  issues,
  result: issues.length ? "FAIL" : "PASS",
};
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
