# Audit Permissions

Audit access uses capabilities:

- `audit.view`
- `audit.view_sensitive`
- `audit.export`
- `audit.manage_retention`

Navigation hiding is not enough. Query helpers are scoped by entity, resident, user, nursing home and ward. DON/CNM access remains scoped to authorised homes and wards; safeguarding and finance audit events should require separate restricted capabilities.
