import { createFixture, migrateFixture, validateFixture } from "./entity-hierarchy-fixture.mjs";

const before = createFixture({
  assessments: [{ id: "assessment-1", residentId: "R-0001", facilityId: "facility-ballymore-haven" }],
  carePlans: [{ id: "care-plan-1", residentId: "R-0001", facilityId: "facility-ballymore-haven" }],
  carePlanProblems: [{ id: "prob-1", residentId: "R-0001", facilityId: "facility-ballymore-haven" }],
  problemInterventions: [{ id: "int-1", residentId: "R-0001" }],
  problemReviews: [{ id: "rev-1", problemId: "prob-1" }],
});
const after = migrateFixture(before);
const report = validateFixture(after);

const counts = {
  enterpriseCount: report.enterpriseCount,
  nursingHomeCount: report.nursingHomeCount,
  wardsPerNursingHome: report.wardsPerNursingHome,
  roomCount: after.rooms.length,
  bedCount: after.beds.length,
  bedAssignmentCount: after.bedAssignments.length,
  roomsWithoutWard: report.roomsWithoutWard.length,
  bedsWithoutRoom: report.bedsWithoutRoom.length,
  residentsWithoutNursingHome: report.residentsWithoutNursingHome.length,
  activeResidentsWithoutRoomOrBed: report.activeResidentsWithoutRoomOrBed.length,
  multipleActiveBedAssignments: report.multipleActiveBedAssignments.length,
  duplicateRoomNumbersInWard: report.duplicateRoomNumbersInWard.length,
  orphanClinicalRecords: report.orphanClinicalRecords.length,
  mismatchedNursingHomeScope: report.mismatchedNursingHomeScope.length,
  unchangedCarePlanCounts: `${before.carePlans.length} -> ${after.carePlans.length}`,
  unchangedAssessmentCounts: `${before.assessments.length} -> ${after.assessments.length}`,
  unchangedCareActionCounts: `${before.problemInterventions.length} -> ${after.problemInterventions.length}`,
  unchangedReviewCounts: `${before.problemReviews.length} -> ${after.problemReviews.length}`,
};

console.log(JSON.stringify(counts, null, 2));

if (report.criticalErrors.length) {
  console.error("\nCritical entity hierarchy errors:");
  for (const error of report.criticalErrors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("\nEntity hierarchy validation passed.");
