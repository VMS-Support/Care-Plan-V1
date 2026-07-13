# Authorization Decision Order

The staff access engine follows a deterministic order:

1. Account must exist and be active.
2. Account must resolve to a staff member.
3. Requested home and ward scope are determined from resource context or active context.
4. Matching explicit denies are checked first.
5. Active home assignment is required for requested home scope.
6. Active role assignments are matched to active role templates.
7. Explicit allows are matched.
8. At least one role-template capability or explicit allow must match.
9. Requested ward requires approved competency unless the active scoped role is DON or CNM.
10. Finance capabilities require explicit allow.
11. `explainAuthorizationDecision()` returns the matched grants, matched role templates, final decision and denied reason.

Navigation filtering is never treated as security. Route and service checks must call the permission engine.
