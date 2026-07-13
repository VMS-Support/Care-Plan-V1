# Staff Access Migration

The migration is additive and compatibility-first.

- Existing `UserProfile.id` values are preserved as `UserAccount.id`.
- `StaffMember` records are generated deterministically from existing users.
- `EmploymentRecord`, `HomeAssignment` and `RoleAssignment` records are created per accessible nursing home.
- Current role strings are converted to current role-template keys.
- Ward competencies are created only where current access can be inferred from existing homes and wards.
- Professional registrations are created for nurse and doctor users without inventing registration numbers.
- No roster assignments are invented.
- Legacy user fields remain available during the compatibility period.

Ambiguous data, especially missing registration numbers and unresolved historical author strings, is reported for manual review.
