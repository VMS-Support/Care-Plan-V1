# Future Event Catalogue

Documented future events, not runtime producers in this phase:

- Resident lifecycle: `ResidentPreAdmissionCreated`, `ResidentAdmissionScheduled`, `ResidentTransferredToHospital`, `ResidentDischarged`, `ResidentMarkedDeceased`, `ResidentMovedWard`, `ResidentMovedBed`
- Observations: `ObservationCorrected`, `ObservationVoided`, `NEWSScoreCalculated`, `ClinicalDeteriorationDetected`
- Assessments: `AssessmentStarted`, `AssessmentVoided`, `AssessmentReassessmentScheduled`
- Care planning: `CarePlanUpdated`, `CarePlanInactivated`, `CareActionCreated`, `CareActionDiscontinued`, `CareActionDeferred`, `CareReviewOverdue`
- Medication: `MedicationOmitted`, `PRNMedicationAdministered`, `MedicationIncidentRecorded`
- Alerts and risks: `AlertCreated`, `AlertAcknowledged`, `AlertResolved`, `RiskCreated`, `RiskEscalated`, `RiskResolved`
- Tasks: `TaskCreated`, `TaskCompleted`, `TaskMissed`
- Handovers: `HandoverAcknowledged`, `HandoverCarriedForward`, `HandoverResolved`
- Daily care: `DailyCareRefused`, `StopAndWatchSubmitted`

These require source workflows or explicit rule-engine phases before producers are added.
