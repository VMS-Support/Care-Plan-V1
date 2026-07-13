# Roster Assignment Foundation

`RosterAssignment` is structurally separate from employment, role assignment and ward competency. It means a staff member is scheduled for a shift at a home and optionally a ward.

This phase does not build a rostering UI or create fake roster records. `getStaffOnDuty()` returns an unavailable signal when no roster data exists. Validation flags roster assignments outside approved ward competency so future rostering can enforce the model safely.
