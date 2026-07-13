# Location Hierarchy

Canonical hierarchy:

```text
Enterprise
  1 -> many Nursing Homes
Nursing Home
  1 -> many Wards / Units
Ward / Unit
  1 -> many Rooms
Room
  1 -> many Beds
Bed
  1 -> many historical Bed Assignments
Resident
  1 -> many historical Bed Assignments
  0 or 1 active Bed Assignment
```

Compatibility hierarchy:

```text
Facility.id remains the current nursingHomeId alias.
Wing and Unit remain available for existing filters and workflows.
Resident.roomId, roomNumber, wingId, unitId remain readable and writable.
```

Placement resolution:

1. Active `BedAssignment`.
2. Resident `roomId`.
3. Legacy resident `roomNumber`.
4. Never infer ward from room text.
