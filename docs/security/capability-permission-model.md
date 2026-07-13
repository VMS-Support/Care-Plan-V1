# Capability Permission Model

```text
UserAccount
  `-- Effective Capabilities
       derived from:
       - Role Templates
       - Scope
       - Explicit Grants/Denies
       - Home Assignment
       - Ward Competency
       - Roster/Override
```

Authorization uses `canAccess(context, capability, resource)` rather than direct role-string checks in migrated areas.

Capabilities use `resource.action` names such as `resident.view`, `assessment.create`, `careplan.review`, `observation.record`, `audit.view`, `finance.view` and `safeguarding.investigate`.

`PermissionGrant` supports `allow` and `deny`, with scopes such as `ward`, `nursing_home`, `multiple_homes`, `enterprise` and `global_system`. Explicit deny overrides role-template or explicit allow access.

Finance capabilities require explicit grants even if a future role template includes them.
