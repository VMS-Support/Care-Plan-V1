# Event Migration

Migration is additive.

- Existing clinical IDs are preserved.
- Audit records are not replaced.
- Timeline records remain UI projections.
- Historical backfill is not automatic.
- New events apply to new mutations after deployment.

Backfill options for future phases: no backfill, baseline snapshot, targeted deterministic backfill, or rebuilding read models directly from source records.
