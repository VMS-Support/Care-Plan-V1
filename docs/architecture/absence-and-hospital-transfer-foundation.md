# Absence and Hospital Transfer Foundation

`AbsenceEpisode` records temporary leave and hospital transfer without closing the admission.

Temporary absence:

- lifecycle remains active
- presence becomes `temporarily_absent`
- active admission remains open
- `bedHeld` controls whether the bed assignment stays active
- ordinary bedside work should later be excluded using `isResidentEligibleForInHomeWork`

Hospital transfer:

- lifecycle remains active
- presence becomes `in_hospital`
- admission remains active
- absence type is `hospital_transfer`
- discharge remains a separate explicit transition

Return:

- absence status becomes `returned`
- actual return time is recorded
- presence becomes `in_home`
- no duplicate active absence or bed assignment should be created

Deferred future workflow items:

- medication reconciliation
- return observations
- GP/doctor review
- full hospital-transfer UI
- discharge wizard
