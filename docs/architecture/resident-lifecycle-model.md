# Resident Lifecycle Model

Resident lifecycle is split into independent dimensions:

- `lifecycleStatus`: `pre_admission`, `admission_scheduled`, `active`, `discharged`, `deceased`, `inactive`
- `admissionType`: `long_term`, `respite`, `short_stay`, `other`
- `presenceStatus`: `in_home`, `temporarily_absent`, `in_hospital`, `unknown`
- active placement: derived from active `BedAssignment`

User-facing labels are calculated by `getResidentDisplayStatus(resident)`.

Examples:

- `active + long_term + in_home` -> Active Long-Term
- `active + respite + in_home` -> Active Respite
- `active + any + temporarily_absent` -> Temporarily Absent
- `active + any + in_hospital` -> Hospital Transfer

Legacy fields remain:

- `status`
- `residentType`
- `admissionDate`
- `admissionSource`
- `roomId`
- `roomNumber`

Compatibility selectors live in `src/lib/care/residentLifecycle.ts`.
