import {
  createFixture,
  migrateLifecycle,
  validateLifecycle,
} from "./resident-lifecycle-fixture.mjs";

const before = createFixture({
  assessments: [{ id: "assessment-1", residentId: "R-0001", facilityId: "facility-ballymore-haven" }],
  carePlans: [{ id: "care-plan-1", residentId: "R-0001", facilityId: "facility-ballymore-haven" }],
  carePlanProblems: [{ id: "prob-1", residentId: "R-0001", facilityId: "facility-ballymore-haven" }],
  problemInterventions: [{ id: "int-1", residentId: "R-0001" }],
  problemReviews: [{ id: "rev-1", problemId: "prob-1" }],
});
const after = migrateLifecycle(before);
const report = validateLifecycle(after, {
  residents: `${before.residents.length} -> ${after.residents.length}`,
  carePlans: `${before.carePlans.length} -> ${after.carePlans.length}`,
  assessments: `${before.assessments.length} -> ${after.assessments.length}`,
  careActions: `${before.problemInterventions.length} -> ${after.problemInterventions.length}`,
  reviews: `${before.problemReviews.length} -> ${after.problemReviews.length}`,
});

console.log(JSON.stringify(report, null, 2));

if (report.criticalErrors.length) {
  console.error("\nCritical resident lifecycle errors:");
  for (const error of report.criticalErrors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("\nResident lifecycle validation passed.");
