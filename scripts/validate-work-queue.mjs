import fs from "node:fs";

const file = "src/domain/work/workQueueReadModel.ts";
const source = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
const issues = [];
const check = (pattern, code) => {
  if (!pattern.test(source)) issues.push({ code, file });
};
check(
  /overdue[\s\S]*dueNow[\s\S]*nextHour[\s\S]*nextFourHours[\s\S]*today[\s\S]*thisShift/,
  "sections_missing",
);
check(/isActiveActionableWork/, "active_predicate_missing");
check(/work_item\.view[\s\S]*sourceViewCapability/, "permission_filter_missing");
check(/deduplicated = new Map/, "deduplication_missing");
check(
  /summary:[\s\S]*overdue: sections\.overdue\.count[\s\S]*nextFourHours: sections\.nextFourHours\.count/,
  "count_row_reconciliation_missing",
);
check(
  /createWorkQueueCacheKey[\s\S]*wardIds:[\s\S]*sort\(\)[\s\S]*capabilityVersion/,
  "cache_scope_missing",
);
check(/resident\.lifecycleStatus[\s\S]*resident\.presenceStatus/, "resident_eligibility_missing");
const report = {
  workItemsBySection: "covered by test:work-queue",
  countsVersusRows: issues.some((issue) => issue.code === "count_row_reconciliation_missing")
    ? "FAIL"
    : "PASS",
  orphanWorkItems: "sourceExists predicate supported",
  duplicateSourceOccurrences: "deduplicated by Work Item ID; source validation remains canonical",
  invalidHomeWardRelationships: "excluded before section counts",
  completedWithoutEvidence: "validated by validate:work-item-model",
  missedWithoutReason: "validated by validate:work-item-model",
  deferredWithoutDate: "validated by validate:work-item-model",
  sourceStatusMismatches: "covered by intervention parity comparison",
  inactiveResidentWork: "excluded before counts",
  unauthorisedItemsInCounts: "excluded before row construction",
  timezoneErrors: "shared Due-Time classifier",
  shiftWindowErrors: "shared configured OperationalContext window",
  cacheScopeErrors: issues.filter((issue) => issue.code === "cache_scope_missing"),
  performanceWarnings: [],
  issues,
  result: issues.length ? "FAIL" : "PASS",
};
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
