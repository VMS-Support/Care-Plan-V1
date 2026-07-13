# Work Item Migration

This repository has no database. The additive migration artifact is the versioned `src/domain/work` projection contract. Existing Tasks, Care Actions, observations, assessments, care plans, handovers, IDs, audit, events, and UI queries are unchanged.

Production migration sequence:

1. Add durable WorkItem, WorkStatusTransition, WorkAssignmentHistory, and unique source-key storage.
2. Project active and approved-horizon future work; do not bulk-create all history.
3. Use deterministic upsert and event receipts for replay safety.
4. Reconcile orphan, duplicate, scope, evidence, and source-status validation.
5. Run legacy and shadow queues side-by-side.
6. Cut over one read contract only after zero unexplained differences; retain compatibility adapters and rollback switch.

No source IDs or due times are rewritten. Persisted Work data can be removed independently during rollback because sources remain authoritative.
