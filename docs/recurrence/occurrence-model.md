# Occurrence Model

`WorkOccurrence` represents one scheduled instance. Its ID is derived from source entity ID, recurrence rule ID, and due timestamp; triggered and PRN occurrences substitute the immutable event/trigger ID. Random values and generation time are excluded.

Occurrences retain planned and effective due time, occurrence number, generated time, timezone, home/resident/ward scope, shift/operational date where relevant, completion, cancellation, suspension, and trigger linkage. Replaying a window produces the same IDs. Existing persisted occurrences are retained, so replay cannot erase completion or cancellation.

Source inactivation cancels future occurrences. Discharge, death, or inactive lifecycle cancels future work. Hospital/temporary absence suspends future bedside work; return to the home resumes non-cancelled future work. Completed and past history is never rewritten by eligibility reconciliation.
