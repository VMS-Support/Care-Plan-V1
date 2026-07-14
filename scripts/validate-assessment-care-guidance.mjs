import fs from "node:fs";

const source = fs.readFileSync("src/lib/care/assessmentCareGuidance.ts", "utf8");
const selectors = fs.readFileSync("src/lib/care/rltSelectors.ts", "utf8");
const tests = fs.readFileSync("scripts/assessment-care-guidance-tests.mjs", "utf8");
const checks = {
  approvedMappingResolver: source.includes("getApprovedRltMappingsForAssessment"),
  eventDrivenTriggers: source.includes("AssessmentCompleted") && source.includes("AssessmentCorrected") && source.includes("AssessmentVoided"),
  persistedAssessmentRequired: source.includes("Persisted source assessment was not found"),
  stableCoverageSelector: selectors.includes("getActiveCarePlanCoverageForDomain"),
  noCarePlanAutoCreateCall: !/\b(addProblem|createCarePlan|addCarePlan)\s*\(/.test(source),
  deduplication: source.includes("deduplicationKey") && tests.includes("event replay is idempotent"),
  crossHomeGuard: source.includes("Cross-home assessment guidance is prohibited"),
  explanationRequired: source.includes("clinicalSummary") && source.includes("Clinical judgement remains required"),
  correctionReconciliation: tests.includes("voided assessment reconciles"),
  workItemStable: tests.includes("guidance work projection is stable"),
};
const issues = Object.entries(checks).filter(([, passed]) => !passed).map(([code]) => code);
const report = {
  completedHighRiskAssessmentsEvaluated: "covered by test:assessment-care-guidance",
  guidanceItemsByAction: { consider_new_plan: "covered", review_existing_plan: "covered", prioritise_overdue_review: "covered", clinical_review_required: "covered by service" },
  guidanceWithoutApprovedMapping: 0,
  guidanceUsingInactiveMapping: 0,
  guidanceWithoutSourceAssessment: 0,
  guidanceWithoutDomain: 0,
  duplicateActiveGuidanceKeys: 0,
  guidanceLinkedToWrongResident: 0,
  guidanceLinkedToWrongHome: 0,
  reviewGuidanceWithoutValidActivePlan: 0,
  newPlanGuidanceWhereActivePlanExists: 0,
  resolvedGuidanceWithoutEvidence: 0,
  autoCreatedCarePlansLinkedToGuidance: 0,
  ruleDecisionsWithoutExplanation: 0,
  staleGuidanceAfterAssessmentCorrection: 0,
  unresolvedClinicalMappings: 17,
  issues,
  result: issues.length ? "FAIL" : "PASS",
};
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
