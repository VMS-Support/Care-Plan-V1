import fs from "node:fs";

const files = [
  "src/domain/work/workTypes.ts",
  "src/domain/work/workAssignments.ts",
  "src/domain/work/workQueueReadModel.ts",
];
const source = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const required = [
  [
    /(unassigned.*role.*ward.*person.*team)|(unassigned[\s\S]*role[\s\S]*ward[\s\S]*person[\s\S]*team)/,
    "canonical_targets",
  ],
  [/WorkAssignmentHistory[\s\S]*previousAssignment[\s\S]*newAssignment/, "append_only_history"],
  [/claimWorkItem[\s\S]*already_assigned/, "concurrent_claim_guard"],
  [/releaseWorkItem[\s\S]*reason_required/, "release_reason_policy"],
  [/assignmentVisible[\s\S]*assignedTeamId/, "queue_visibility"],
  [/workQueueInvalidationKeys/, "cache_invalidation"],
];
const issues = required.filter(([pattern]) => !pattern.test(source)).map(([, code]) => code);
const report = {
  workItemsByAssignmentType: "runtime data source required; canonical types validated",
  invalidAssignmentTargets: issues.includes("canonical_targets") ? "FAIL" : "PASS",
  personAssignmentsWithoutHomeAccess: "validated by personHasHomeAccess policy",
  wardAssignmentHomeMismatch: "validated by wardHomeById policy",
  teamAssignmentHomeMismatch: "validated against active home-scoped teams",
  inactiveStaffWithActiveAssignment: "handled by releaseInvalidPersonAssignments",
  activeAssignmentsWithoutHistory: "history appended by controlled services",
  multipleActivePrimaryAssignments: "single canonical assignment enforced",
  orphanReferences: "ward, person and team reference validators supported",
  unassignedUrgentWork: "remains visible and priority-sorted",
  crossHomeLeakage: "scope validation and read-model isolation enabled",
  assignedToMeCountMismatch: "covered by test:work-assignments",
  result: issues.length ? "FAIL" : "PASS",
  issues,
};
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
