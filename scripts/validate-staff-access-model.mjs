import { createStaffAccessFixture, validateStaffAccessFixture } from "./staff-access-fixture.mjs";

const report = validateStaffAccessFixture(createStaffAccessFixture());

console.log("Staff access model validation");
console.log(JSON.stringify(report, null, 2));

if (report.criticalErrors.length > 0) {
  console.error("Staff access model validation failed.");
  process.exit(1);
}

console.log("Staff access model validation passed.");
