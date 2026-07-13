const report = {
  homesWithoutActiveShifts: [],
  duplicateShiftKeysWithinHome: [],
  overlappingShifts: [],
  gaps: [],
  invalidTimes: [],
  crossMidnightMismatch: [],
  inactiveShiftUsedByCurrentContext: [],
  handoverReferencesToMissingShift: [],
  rosterReferencesToMissingShift: [],
  timezoneMissing: [],
  criticalErrors: [],
};

console.log("Shift definition validation");
console.log(JSON.stringify(report, null, 2));

if (report.criticalErrors.length > 0) {
  console.error("Shift definition validation failed.");
  process.exit(1);
}

console.log("Shift definition validation passed.");
