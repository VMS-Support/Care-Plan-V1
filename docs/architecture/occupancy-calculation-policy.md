# Occupancy Calculation Policy

Physical bed occupancy is counted from:

1. resident `lifecycleStatus = active`
2. resident `presenceStatus = in_home`
3. one active `BedAssignment`
4. bed and room belonging to the same nursing home scope

Temporary absence with `bedHeld = true` keeps the assignment active but the resident is not physically present. Management reports may count held/reserved beds separately later.

Hospital transfer is an active absence, not discharge. It does not count as physically in home.

Discharged, deceased, inactive, pre-admission, and admission-scheduled records do not count as occupied.

Services:

- `getOccupancyByNursingHome`
- `getOccupancyByWard`
- `isResidentOccupyingBed`
- `getCurrentResidents`
- `getActiveLongTermResidents`
- `getActiveRespiteResidents`
- `getTemporarilyAbsentResidents`
- `getHospitalTransferResidents`
