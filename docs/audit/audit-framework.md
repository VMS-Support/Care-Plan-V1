# Audit Framework

`AuditRecord` is the canonical append-only audit model. It records actor, action, target entity, previous/new values, time, home/ward scope, reason, source, correlation IDs and schema version.

Legacy `AuditLog` entries remain visible and are adapted into canonical audit records by `migrateLegacyAuditRecords()`. Existing IDs and clinical records are not rewritten.

The service lives in `src/lib/care/auditFramework.ts` and provides:

- `recordAuditEvent()`
- `recordCreateAudit()`
- `recordUpdateAudit()`
- `recordStateTransitionAudit()`
- `recordSecurityAudit()`
- `recordMigrationAudit()`
- `recordExportAudit()`
- audit query helpers and validation

Dashboard recalculations, page refreshes and filter changes are not normal audit events.
