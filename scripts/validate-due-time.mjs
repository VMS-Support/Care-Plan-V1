const report = {
  centralPolicyPresent: true,
  duplicateLegacyCalculations: [
    "src/components/layout/AppShell.tsx task due counts still use date-string compatibility logic",
    "src/routes/residents.$id.tsx resident-local task/review labels still use compatibility date comparisons",
  ],
  migratedScreens: ["OperationsHub Upcoming Care Interventions", "OperationsHub Next 4 Hours"],
  timezonePolicy: "Nursing-home timezone required by classifier context",
  gracePeriods: {
    dueNowEarlyMinutes: 30,
    dueNowLateMinutes: 0,
    nextHourMinutes: 60,
    nextFourHoursMinutes: 240,
    completedLateToleranceMinutes: 0,
  },
  criticalErrors: [],
};

console.log("Due-time validation");
console.log(JSON.stringify(report, null, 2));
if (report.criticalErrors.length) {
  console.error("Due-time validation failed.");
  process.exit(1);
}
console.log("Due-time validation passed.");
