# Work Source Linkage

Every `WorkSourceReference` records source type, owning module, entity type/ID, optional occurrence and parent, rule ID/version, creating event, correlation, direct route, completion owner, recreation policy, and creation time. This answers why the item exists, who owns completion, how to open it, and whether replay is deterministic, event-driven, or manual-only.

Current source types are Care Plan, Assessment, Incident, Doctor Request, Admission, Hospital Return, Manual Task, Clinical Rule, Observation Schedule, Documentation Requirement, and Handover. Appointment, Referral, Maintenance, Medication, Training, Audit, and Family Request remain future contracts unless a real source module exists.

`validateWorkSourceTraceability` rejects missing type/ID/module/route/owner/recreation policy, missing required parents, orphan source/parent, missing clinical-rule identity, missing event for event replay, resident mismatch, cross-home linkage, and duplicate source occurrences. The source workflow always owns completion; Work Item only projects state.

Routes use stable IDs rather than display text. Event-created work copies the immutable event ID into `createdFromEventId/sourceEventId` and shares the correlation ID.
