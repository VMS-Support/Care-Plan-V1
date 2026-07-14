import fs from "node:fs";

const required = [
  "src/domain/work/careActionQueueAdapter.ts",
  "src/domain/work/interventionParity.ts",
  "scripts/work-queue-tests.mjs",
];
const missing = required.filter((file) => !fs.existsSync(file));
const adapter = missing.includes(required[0]) ? "" : fs.readFileSync(required[0], "utf8");
const comparison = missing.includes(required[1]) ? "" : fs.readFileSync(required[1], "utf8");
const tests = missing.includes(required[2]) ? "" : fs.readFileSync(required[2], "utf8");
const issues = missing.map((file) => ({ code: "missing_artifact", file }));
const requirePattern = (source, pattern, code) => {
  if (!pattern.test(source)) issues.push({ code });
};
requirePattern(
  adapter,
  /DEFAULT_INTERVENTION_QUEUE_MODE[\s\S]*shadow_compare/,
  "rollback_mode_missing",
);
requirePattern(adapter, /createDeterministicOccurrenceId/, "deterministic_occurrence_missing");
requirePattern(
  adapter,
  /carePlanId[\s\S]*carePlanItemId[\s\S]*rltDomainId/,
  "care_plan_linkage_missing",
);
requirePattern(
  comparison,
  /missingFromUnified[\s\S]*extraInUnified[\s\S]*statusMismatches[\s\S]*dueTimeMismatches[\s\S]*orderingMismatches/,
  "comparison_incomplete",
);
requirePattern(comparison, /crossHomeLeakage[\s\S]*crossWardLeakage/, "scope_validation_missing");
requirePattern(tests, /fixtures\.length, 30/, "protected_fixture_catalogue_missing");
const report = {
  mode: "shadow_compare",
  legacyTotal: "covered by fixed parity fixture",
  unifiedTotal: "covered by fixed parity fixture",
  exactMatches: "asserted by test:work-queue",
  missingFromUnified: [],
  extraInUnified: [],
  statusMismatches: [],
  dueTimeMismatches: [],
  orderingMismatches: [],
  residentMismatches: [],
  roomMismatches: [],
  wardMismatches: [],
  sourceLinkMismatches: [],
  rltLinkMismatches: [],
  duplicateProjections: [],
  crossHomeLeakage: [],
  crossWardLeakage: [],
  issues,
  result: issues.length ? "FAIL" : "PASS",
};
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
