# Audit Migration

Legacy `AuditLog` records are preserved and adapted to canonical `AuditRecord` values.

Migration rules:

- preserve legacy ID by deriving `audit-record-legacy-{legacyId}`;
- preserve timestamp, actor display name, action text and entity ID;
- map legacy `before`/`after` when available;
- retain raw legacy payload in metadata;
- do not fabricate missing previous values;
- keep legacy page compatibility.
