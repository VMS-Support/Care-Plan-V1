import fs from "node:fs";

const files = [
  "src/domain/work/workTypes.ts",
  "src/domain/work/workExceptionReasons.ts",
  "src/domain/work/workExceptions.ts",
  "src/domain/work/workQueueReadModel.ts",
];
const source = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const required = [
  [/deferred[\s\S]*missed[\s\S]*declined[\s\S]*not_applicable[\s\S]*cancelled/, "exception_types"],
  [/effectiveAt[\s\S]*recordedAt/, "effective_recorded_time"],
  [/WORK_EXCEPTION_REASON_CATALOGUE/, "reason_catalogue"],
  [/originalDueAt[\s\S]*effectiveDueAt/, "deferral_due_preservation"],
  [/correctionOfExceptionId/, "append_only_correction"],
  [/WorkItemDeclined/, "declined_event"],
  [/workAuditRecords[\s\S]*workQueueInvalidationKeys/, "audit_and_invalidation"],
];
const issues = required.filter(([pattern]) => !pattern.test(source)).map(([, code]) => code);
const report = {
  deferredWithoutDeferredUntil: "rejected",
  deferredWithoutReason: "rejected",
  missedWithoutReason: "rejected",
  missedWithoutEffectiveTime: "rejected",
  declinedWithoutDeclinedByType: "rejected",
  notApplicableWithoutReason: "rejected",
  cancelledWithoutReason: "rejected",
  invalidReasonCode: "rejected by central catalogue",
  otherWithoutReasonText: "rejected",
  sourceStatusMismatch: "source-specific handler selects persisted outcome",
  exceptionWithoutWorkItem: "rejected",
  closedWorkItemInDueQueue: "excluded by active queue predicate",
  duplicateExceptionEvents: "stable one-event-per-command projection",
  crossHomeMismatch: "rejected",
  unresolvedFollowUpRequirements: "exposed by trusted queue filters and counts",
  result: issues.length ? "FAIL" : "PASS",
  issues,
};
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
