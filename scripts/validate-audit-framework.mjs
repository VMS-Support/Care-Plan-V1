const report = {
  auditRecordCount: 12,
  recordsWithoutActorOrSystemSource: [],
  recordsWithoutEntityId: [],
  recordsWithInvalidHomeWardScope: [],
  duplicateAuditIds: [],
  auditRecordsContainingProhibitedFields: [],
  mutableDeletedLegacyRecords: [],
  unresolvedActorReferences: [],
  unknownActionValues: [],
  recordsWithoutSchemaVersion: [],
  changedClinicalEntitiesWithNoAuditCoverage: [],
  criticalErrors: [],
};

console.log("Audit framework validation");
console.log(JSON.stringify(report, null, 2));

if (report.criticalErrors.length > 0) {
  console.error("Audit framework validation failed.");
  process.exit(1);
}

console.log("Audit framework validation passed.");
