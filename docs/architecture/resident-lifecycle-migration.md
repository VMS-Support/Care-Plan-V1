# Resident Lifecycle Migration

Version: `2026-07-13-resident-lifecycle`

The migration is additive and deterministic.

## Mapping

- `status = active` and not inactive respite -> `lifecycleStatus = active`
- `status = discharged` -> `lifecycleStatus = discharged`
- `status = deceased` -> `lifecycleStatus = deceased`
- `status = deleted` or inactive legacy type -> `lifecycleStatus = inactive`
- `residentType = active_respite/inactive_respite` -> `admissionType = respite`
- otherwise `admissionType = long_term`
- active records default to `presenceStatus = in_home`
- inactive/discharged/deceased records default to `presenceStatus = unknown`

Active residents receive deterministic admission IDs:

```text
admission-${residentId}-initial
```

Existing active bed assignments are linked to the active admission where possible.

## Manual Review

`inactive_respite` without a reliable discharge date is reported as ambiguous and should be reviewed before being treated as completed respite.

Free-text hospital/transfer mentions are not migrated to absence episodes.
