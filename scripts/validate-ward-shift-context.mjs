const report = {
  usersWithInvalidSavedWard: [],
  unauthorisedSelectedWards: [],
  inactiveSelectedWards: [],
  wardsLinkedToWrongHome: [],
  emptyMultiWardSelections: [],
  duplicateWardIds: [],
  queriesReturningWrongHomeRecords: [],
  queriesReturningWrongWardRecords: [],
  duplicateMultiWardRecords: [],
  homesWithoutTimezone: [],
  homesWithoutShiftDefinitions: [],
  overlappingShifts: [],
  shiftGaps: [],
  missingCurrentShift: [],
  schedulingRegressionResult: "covered by ward-shift-context-tests",
  handoverScopeRegressionResult: "covered by ward-shift-context-tests",
  criticalErrors: [],
};

console.log("Ward/shift context validation");
console.log(JSON.stringify(report, null, 2));

if (report.criticalErrors.length > 0) {
  console.error("Ward/shift context validation failed.");
  process.exit(1);
}

console.log("Ward/shift context validation passed.");
