# Entity Relationship Diagram

```text
Enterprise
  1 -> many Nursing Homes

Nursing Home
  1 -> many Wards / Units
  1 -> many Residents
  1 -> many Clinical Records

Ward / Unit
  1 -> many Rooms

Room
  1 -> many Beds

Bed
  1 -> many historical Bed Assignments

Resident
  1 -> many historical Bed Assignments
  0 or 1 active Bed Assignment
  -> Assessments
  -> Observations
  -> Care Plan
      -> Care Plan Items / Problems
          -> Care Actions / Interventions
          -> Reviews
          -> Evaluations
  -> Tasks
  -> Alerts
  -> Risks derived from assessments
  -> Incidents
  -> Handovers
```

Legacy compatibility:

```text
Facility.id == canonical nursingHomeId
Facility-scoped record.facilityId == canonical nursingHomeId reference
Wing/Unit remain operational filters until ward context replaces them
```
