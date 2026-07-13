# Staff Identity Model

```text
StaffMember
  |-- UserAccount
  |-- EmploymentRecords
  |-- RoleAssignments
  |-- ProfessionalRegistrations
  |-- HomeAssignments
  |-- WardCompetencies
  `-- RosterAssignments
```

`UserAccount` represents application access. `StaffMember` represents the real person. The migration preserves existing user IDs as `UserAccount.id` and creates deterministic `StaffMember.id` values without using email, staff name or array position.

Disabling a `UserAccount` blocks access but does not delete `StaffMember`, employment, registration or historical authorship. Existing clinical records continue to show their original author strings until a later identity-resolution phase links historical author text to canonical staff IDs.
