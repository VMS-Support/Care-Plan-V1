# Rule Catalogue

Stable IDs use `RULE-[AREA]-[NUMBER]`.

| Rule | Version | Status | Trigger | Output | Notes |
| --- | --- | --- | --- | --- | --- |
| `RULE-CAREPLAN-COVERAGE-001` | 1 | `pending_clinical_approval` | `AssessmentCompleted`, `AssessmentRiskChanged` | Care-plan coverage gap | Fixture-ready; inactive until RLT mapping/risk policy approved. |
| `RULE-WEIGHT-001` | 1 | `pending_clinical_approval` | `WeightRecorded` | Recommendation | Example 5%/30 days config is fixture-only. |
| `RULE-CAREACTION-MISSED-001` | 1 | `pending_clinical_approval` | `CareActionMissed` | Recommendation | Threshold inactive until approved. |
| `RULE-TEST-DEDUPE-001` | 1 | `active` | `HandoverCreated` | Dashboard signal | Non-clinical infrastructure test only. |
