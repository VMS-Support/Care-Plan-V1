# Home and Ward Assignment Model

`HomeAssignment` defines which nursing homes a staff member can work in or access. `WardCompetency` defines which wards or units the staff member is approved for. Neither record is the same as a role assignment.

A permission check must match the requested home and, when a ward is supplied, the requested ward. DON and CNM role assignments may provide broader management scope inside their assigned home. Ballymore Haven and Hazelwood Care remain isolated unless the staff member has active assignment in both.

Current ward switching can use `getStaffAccessibleWards()` and should treat roster-based temporary cover as a later override workflow with reason and audit.
