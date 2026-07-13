# Shift Recurrence

Each-shift rules consume active `ShiftDefinition` records for the rule's nursing home. They never hard-code Early/Late/Night hours. A rule may target all configured shifts or selected stable Shift IDs. Each occurrence records the Shift ID and operational date; overnight shift completion remains associated with its start date.

Shift start wall time is resolved in the nursing-home timezone. Missing, inactive, other-home, or non-selected shifts generate nothing and are detected during configuration/parallel-run validation. Existing handover and ward/shift context behaviour remains unchanged until parity is proven.
