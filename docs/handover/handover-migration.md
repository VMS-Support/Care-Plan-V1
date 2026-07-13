# Handover Migration

Migration is additive and reversible.

- Existing handover IDs are preserved.
- Existing author, date, note, priority and acknowledgement text is preserved.
- Nursing home and ward are derived from resident placement when deterministic.
- Stable source/target shift IDs are added for new records and derived for legacy records when labels match.
- Ambiguous legacy records remain readable and are reported by validation.
