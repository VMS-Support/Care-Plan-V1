# Work Completion Evidence

Completion is accepted only with `evidenceEntityType` and `evidenceEntityId`, effective completion time, recorded time, and actor where known. Care Actions use ProblemInterventionLog, general Tasks use Task, observations use ClinicalObservation, assessments use completed/approved Assessment, care-plan reviews use ProblemReview, documentation uses the required typed record, and handovers use HandoverAcknowledgement.

Effective time determines lateness; recorded time supports late-entry audit. Opening a form or ticking an unlinked free-text checkbox is not evidence. Source services remain responsible for clinical validation and events.
