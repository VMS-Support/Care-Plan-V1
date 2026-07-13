# Work Type Catalogue

| Work type                | Current source                           | Completion evidence                                        | Action route       | Delivery                               |
| ------------------------ | ---------------------------------------- | ---------------------------------------------------------- | ------------------ | -------------------------------------- |
| care_action              | ProblemIntervention occurrence           | ProblemInterventionLog / CareActionCompleted               | resident care plan | Implemented projector                  |
| general_task             | Task                                     | completed Task record                                      | Tasks              | Implemented projector                  |
| observation              | explicit observation reminder occurrence | persisted ClinicalObservation satisfying the requested set | Vitals             | Implemented projector contract         |
| assessment               | assessment due/reassessment reminder     | completed/approved Assessment; draft is insufficient       | Assessment         | Implemented projector                  |
| appointment              | standalone Appointment                   | attendance/outcome record                                  | future             | Contract only; module absent           |
| care_plan_review         | CarePlanProblem review requirement       | ProblemReview                                              | resident care plan | Implemented projector                  |
| referral                 | standalone referral episode              | source-specific referral outcome                           | future             | Contract only; module absent           |
| documentation            | explicit policy-created requirement      | required typed record                                      | source route       | Projector contract; no automatic seeds |
| handover_acknowledgement | Handover + target user + shift           | HandoverAcknowledgement                                    | Handovers          | Implemented projector                  |

Appointment fields embedded in a Task remain `general_task`. Rules may create typed work only when they provide stable RuleIssue/decision/source references and a replay-safe key.
