# Context Permission Rules

Context is permission validated through active account status, home assignment, ward competency, scoped role assignment and capability checks.

Different roles in different homes are resolved when context changes. Role switching must not grant capabilities not present in active scoped `RoleAssignment` and role templates.
