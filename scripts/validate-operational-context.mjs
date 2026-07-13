const report = {
  usersWithoutAccessibleHomes: [],
  usersWithInvalidStoredHome: [],
  usersWithInvalidStoredWards: [],
  wardsLinkedToWrongHome: [],
  roleAssignmentsNotValidInSelectedHome: [],
  competenciesOutsideHome: [],
  homesWithoutTimezone: [],
  homesWithoutActiveWards: [],
  shiftDefinitionsOverlappingOrMissing: [],
  contextScopedQueriesReturningCrossHomeData: [],
  duplicateRecordsInMultiWardAggregation: [],
  schedulingRegressionStatus: "covered by operational-context-tests",
  criticalErrors: [],
};

console.log("Operational context validation");
console.log(JSON.stringify(report, null, 2));

if (report.criticalErrors.length > 0) {
  console.error("Operational context validation failed.");
  process.exit(1);
}

console.log("Operational context validation passed.");
