# Maintenance Phase 2 integration review

## Shared rules and services

- Bed assignability: `src/domain/maintenance/bedOccupancy.ts` — `canAssignBed` / `bedBlockers`.
  This is the only eligibility predicate used by accommodation selection, direct assignment,
  internal transfer, reservation, available-bed totals and room availability. The store revalidates
  this predicate at confirmation time.
- Occupancy: `src/domain/maintenance/bedOccupancy.ts` — `calculateBedOccupancy`. The DON dashboard,
  occupancy details and Bed Management summaries consume this projection. It is also the structured
  projection intended for future reporting.
- Release: `src/lib/care/residentLifecycle.ts` — `releaseResidentBed`. The effective timestamp and
  assignment ID form its idempotency boundary: repeating an event cannot end a later assignment.
- Return to Service: `src/routes/maintenance.beds.$bedId.tsx` — `ReturnDialog`. Approval is blocked
  until critical work, cleaning, inspection, evidence, supervisor verification and room checks pass.

## Resident lifecycle UI integration

The domain transitions already call `releaseResidentBed`. Future UI commands must call the existing
transition, not mutate resident/bed arrays directly:

- Discharge UI → `dischargeResident(...)`
- Record deceased UI → `markResidentDeceased(...)`
- Transfer-out UI → discharge/transfer lifecycle command with destination and effective timestamp
- Hospital/temporary absence → `startTemporaryAbsence(...)`; the bed is held by default. Only an
  authorised explicit `bedHeld=false` policy decision releases it.

## Housekeeping integration point

Current release behaviour preserves assignment history, sets the bed to `temporarily_unavailable`,
sets readiness to `cleaning_required`, and records a non-clinical cleaning reason (terminal,
discharge or transfer clean). The bed cannot be selected until it is Ready again.

Phase 4 should consume the release event to generate the appropriate cleaning task, link it to the
Nursing Home, Room, Bed and release event (and previous resident only where permitted), then make the
bed available only after cleaning and readiness inspection pass. Do not place clinical details in a
housekeeping task.

## Validation status

- Production build passes.
- The syntax corruption in `src/lib/care/observations.tsx` is fixed.
- Full `tsc --noEmit` now parses the repository but remains blocked by unrelated legacy type errors
  across existing routing, workforce, certificates and store code. Phase 2 does not claim repository-
  wide TypeScript cleanliness.
