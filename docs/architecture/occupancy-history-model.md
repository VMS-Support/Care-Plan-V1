# Occupancy History Model

```text
Resident
  -> Admissions
  -> Bed Assignments
  -> Absence Episodes
```

Example:

```text
Resident
  +- Admission 1 - completed respite
  |    +- Bed Assignment A
  |    +- Temporary Absence
  +- Admission 2 - active long-term
       +- Bed Assignment B
       +- Hospital Transfer Episode
```

`BedAssignment` is historical. Room and bed moves end the active assignment and create a new one. Routine moves must not overwrite or delete prior assignments.

History is retrievable with `getResidentBedAssignmentHistory(state, residentId)`, sorted newest first.
