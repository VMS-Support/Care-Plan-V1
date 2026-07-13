# Current Entity Inventory

Discovery source: `src/lib/care/types.ts`, `src/lib/care/store.tsx`, route/component references, and package scripts.

## Persistence

The app currently uses browser `localStorage` under `carepath-pro-data`, with a legacy key of `carepath-pro-store`. Seed/demo data is generated in `src/lib/care/store.tsx`. There are no database tables, SQL migrations, or server-side schema migrations in the repository.

## Core Site Model

| Display name | Model | Path | ID field/type | Generation | Parent scope | Persisted | Risk / inconsistency |
|---|---|---|---|---|---|---|---|
| Nursing home / facility | `Facility` | `src/lib/care/types.ts` | `id: string` | deterministic seed (`facility-ballymore-haven`, `facility-hazelwood-care`) | new `enterpriseId` | yes | Current canonical site key is named `facilityId`; preserve as legacy alias. |
| Wing | `Wing` | `src/lib/care/types.ts` | `id: string` | deterministic seed (`w-oak`) | facility by normalization only | yes | Operational grouping overlaps future Ward/Unit. |
| Unit | `Unit` | `src/lib/care/types.ts` | `id: string` | deterministic seed (`u-${wingId}`) | wing | yes | Unit is derived from wing seed. |
| Room | `Room` | `src/lib/care/types.ts` | `id: string` | deterministic seed (`r-${wingId}-${number}`) | wing/unit, now ward | yes | Room number is display data and duplicated on residents. |
| Resident | `Resident` | `src/lib/care/types.ts` | `id: string` | deterministic seed (`R-0001`) or `uid()` for new records | facility | yes | Placement uses `roomId`, `roomNumber`, `wingId`, `unitId`, and resident-level `bed` metadata. |

## Users and Staff

| Display name | Model | Path | ID field/type | Generation | Parent scope | Persisted | Risk / inconsistency |
|---|---|---|---|---|---|---|---|
| User account | `UserProfile` | `src/lib/care/types.ts` | `id: string` | deterministic seed or `u-${facility}-${uid()}` | one or more facilities | yes | Staff member and login are currently one record. |
| Staff member | none separate | n/a | n/a | n/a | n/a | n/a | Future staff identity should be separated from `UserProfile`. |
| Shift | `shift` strings; `ShiftSummary` | `src/lib/care/types.ts` | summary `id: string` | `uid()` | facility/date | yes | Current shift is a display enum (`morning`, `afternoon`, `night`), not roster scheduling. |

## Clinical and Workflow Entities

| Display name | Model | Path | ID field/type | Generation | Relationships | Persisted | Risk |
|---|---|---|---|---|---|---|---|
| Assessment | `Assessment` | `src/lib/care/types.ts` | `id: string` | `uid()` and seeded audit IDs | `residentId`, optional `facilityId` | yes | Stable after creation; reassessment creates new ID. |
| Observation/vitals | `VitalSign`, `ClinicalObservation`, chart records | `src/lib/care/types.ts` | `id: string` | `uid()` or observation ID | `residentId`, optional `facilityId` | yes | Legacy/generated vital cleanup exists. |
| Legacy care plan | `CarePlan` | `src/lib/care/types.ts` | `id: string` | `uid()` | `residentId`, optional assessment links | yes | Preserved for compatibility. |
| Resident care plan | `ResidentCarePlan` | `src/lib/care/types.ts` | `id: string` | `newId("rcp")` | `residentId` | yes | Current unified container. |
| Care-plan problem/item | `CarePlanProblem` | `src/lib/care/types.ts` | `id: string` | `newId("prob")` | `residentCarePlanId`, `residentId`, `rltDomainId` | yes | Protected RLT relationships. |
| Care action/intervention | `ProblemIntervention`, `Intervention` | `src/lib/care/types.ts` | `id: string` | `newId("int")` / `uid()` | `problemId`, `residentId`, optional care-plan links | yes | Upcoming/Next 4 Hours depends on frequency fields. |
| Review/evaluation | `ProblemReview`, `ProblemEvaluation`, legacy review/evaluation | `src/lib/care/types.ts` | `id: string` | `newId("rev")`, `newId("eval")`, `uid()` | problem/care-plan IDs | yes | Preserve IDs and counts. |
| Task/action | `Task` | `src/lib/care/types.ts` | `id: string` | `uid()` | optional `residentId`, optional links | yes | Facility-scoped. |
| Alert | `Alert`, `ClinicalAlert`, `ActionAlertWorkflow` | `src/lib/care/types.ts` | `id: string` | `uid()` | `residentId`, source links | yes | `alertWorkflow` is a keyed object. |
| Risk | no standalone entity | routes derive from assessments | n/a | n/a | resident/assessment | derived | Do not create fake runtime risk records. |
| Incident | `Incident`, `IncidentAction` | `src/lib/care/types.ts` | `id: string` | `uid()` | `residentId`, optional assessment/care-plan links | yes | Facility-scoped. |
| Appointment | task appointment fields | `Task` | task ID | `uid()` | optional resident | yes | No separate appointment entity. |
| Handover | `HandoverNote`, `ShiftSummary` | `src/lib/care/types.ts` | `id: string` | `uid()` | `residentId`, shift | yes | Shift is enum, not roster ID. |
| Admission | resident admission fields | `Resident` | resident ID | n/a | facility/room | yes | No separate admission entity. |
| Transfer | none | n/a | n/a | n/a | n/a | n/a | Future-only. |
| Document | none | n/a | n/a | n/a | n/a | n/a | Future-only. |

## Current Facility Scoping

Most persisted arrays are normalized through `FACILITY_SCOPED_ARRAY_KEYS` in `src/lib/care/store.tsx`. Records without `facilityId` are treated as Ballymore Haven for backward compatibility. Nursing-home switching is controlled by `activeFacilityId` and persisted under `carepath-pro-active-facility`.
