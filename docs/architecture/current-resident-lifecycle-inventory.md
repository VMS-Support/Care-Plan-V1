# Current Resident Lifecycle Inventory

Discovery source: `src/lib/care/types.ts`, `src/lib/care/store.tsx`, `src/routes/residents.index.tsx`, `src/routes/residents.$id.tsx`, `src/routes/index.tsx`, and scheduling helpers.

| Field | Path/model | Current meaning/use | Values seen | Persisted | Displayed | Occupancy impact | Scheduling impact | Migration strategy |
|---|---|---|---|---|---|---|---|---|
| `Resident.status` | `src/lib/care/types.ts` | lifecycle/delete-ish state used for active, discharged, deceased, deleted | `active`, `discharged`, `deceased`, `deleted` | yes | indirectly | dashboards count `active` | resident filtering indirectly controls work queues | preserve; map to `lifecycleStatus` |
| `Resident.residentType` | `src/lib/care/types.ts` | active/inactive plus respite label | `active`, `inactive`, `active_respite`, `inactive_respite` | yes | residents list/profile | dashboards split respite and active | resident filters | preserve; map respite to `admissionType` |
| `Resident.admissionDate` | `src/lib/care/types.ts` | displayed admission date and dashboard admissions | ISO date | yes | profile/admission form | no direct bed logic | no direct scheduling | preserve; seed active `Admission.admissionDate` |
| `Resident.admissionSource` | `src/lib/care/types.ts` | admission form source | `home`, `hospital`, `another_care_home`, `other`, empty | yes | form | no | no | map to `Admission.admittedFrom` when reliable |
| `Resident.facilityId` | `src/lib/care/types.ts` | nursing-home scope | facility IDs | yes | via facility switch | scopes occupancy | scopes resident lists/work | preserve; canonical `nursingHomeId` alias |
| `Resident.roomId` | `src/lib/care/types.ts` | current room selection | room IDs | yes | form/profile | current placement fallback | resident filtering | preserve; fallback after active bed assignment |
| `Resident.roomNumber` | `src/lib/care/types.ts` | display room label | room number text | yes | many screens | legacy placement fallback | labels only | preserve; never identity |
| `Resident.wingId` / `unitId` | `src/lib/care/types.ts` | operational filters | wing/unit IDs | yes | filters | no direct canonical occupancy | work queue scoping | preserve until ward context |
| `Resident.deletedAt/deletedBy/deletedReason` | `src/lib/care/types.ts` | deletion audit | ISO/user/text | yes | audit views | excludes records when `status=deleted` | stops normal lists | preserve |
| `Resident.bed` | `src/lib/care/types.ts` | bed/mattress metadata on resident | bed/mattress fields | yes | profile | not authoritative occupancy | no | preserve; copy to migrated `Bed` metadata |
| `BedAssignment` | `src/lib/care/types.ts` | Phase 9 active placement foundation | active/ended | yes | not yet broad UI | authoritative new occupancy source | future scheduling eligibility | extend with admission/ward/room/time/reason fields |
| `activeFacilityId` | `src/lib/care/store.tsx` | nursing-home switch | facility ID | localStorage | header/user menu | scopes rooms/residents | scopes work queues | preserve |
| Dashboard occupancy | `src/routes/index.tsx` | active resident count divided by rooms | derived | no | DON dashboard | current legacy metric | no | leave unchanged this phase; add trusted occupancy service |
| Resident list filters | `src/routes/residents.index.tsx` | `residentType` filter | active/inactive/respite variants | no | yes | no | filters visible residents | future migration to central lifecycle filters |
| Scheduled work | `src/lib/care/intervention-schedule.ts` | care-plan intervention due calculation | problem/intervention/log state | no | operations/resident screens | no | yes | unchanged; add `isResidentEligibleForInHomeWork` for future integration |

No reliable structured discharge date, temporary absence, hospital-transfer episode, or deceased detail field existed before this phase. Free-text incident transfer mentions are not migrated to hospital-transfer episodes.
