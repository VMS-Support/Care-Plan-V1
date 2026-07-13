# Clinical Event Catalogue

The canonical catalogue lives in `src/domain/events/eventCatalog.ts`.

Implemented catalogue entries:

- `ResidentAdmitted`
- `ResidentReturnedFromHospital`
- `ObservationRecorded`
- `WeightRecorded`
- `AssessmentCompleted`
- `AssessmentRiskChanged`
- `CarePlanCreated`
- `CarePlanReviewed`
- `CareActionCompleted`
- `CareActionMissed`
- `MedicationRefused`
- `IncidentRecorded`
- `HandoverCreated`
- `DailyCareRecorded`

Every supported event currently has version `1` and a matching `PayloadV1` interface in `src/domain/events/eventTypes.ts`.
