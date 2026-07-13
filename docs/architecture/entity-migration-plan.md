# Entity Migration Plan

Version: `2026-07-13-entity-hierarchy`

## Preconditions

- Existing store may have facilities, rooms, residents, clinical records, and no enterprises/wards/beds.
- Existing resident IDs and care-plan IDs must remain unchanged.
- Existing RLT and scheduling records must remain unchanged.

## Forward Operation

1. Create `enterprise-default` if no enterprise exists.
2. Add `enterpriseId` to every facility.
3. Create one default `Main Unit` ward per facility that has no wards.
4. Add `wardId`, `nursingHomeId`, active flag, display name, and timestamps to rooms.
5. Create one `Bed 1` per room when no bed exists.
6. If active residents share a room, create enough `Bed n` records.
7. Create one active bed assignment per active resident with a room.
8. Preserve legacy room and bed metadata on resident records.

## Rollback

Because this is additive, rollback is logical:

- Stop reading `enterprises`, `wards`, `beds`, and `bedAssignments`.
- Keep persisted legacy fields: `facilityId`, `roomId`, `roomNumber`, `wingId`, `unitId`.
- Do not delete migrated arrays automatically.

## Validation

Run:

```bash
npm run validate:entity-hierarchy
```

The report checks counts, orphan rooms/beds, residents without nursing-home scope, multiple active assignments, duplicate room numbers in ward, orphan clinical records, and unchanged protected clinical counts.
