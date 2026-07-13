# Unified Work Item Model

`src/domain/work` is the additive canonical operational projection. `WorkItem` never replaces a Task, Care Action, Assessment, Observation, Care Plan Review, Handover, or future source record. It stores queue-safe metadata, scope, schedule, assignment, priority, status, evidence references, and a drill-down route—not clinical narrative.

```text
Clinical or operational source
  -> deterministic source occurrence
  -> WorkItem projection
  -> home / ward / shift / date / role query
  -> source-specific workflow
  -> source evidence + source event + audit
  -> WorkItem transition/history
```

The canonical types are in `workTypes.ts`; projectors in `workProjectors.ts`; status display in `workStatus.ts`; transition controls in `workTransitions.ts`; source action policy in `workHandlers.ts`; and query/read-model logic in `workQueue.ts`.

## Invariants

Every item has one stable primary source, a nursing-home scope, schema version, and deterministic source key. Resident and ward must belong to that home. One occurrence maps to at most one item. Completed work has typed source evidence. Missed, deferred, cancelled, and not-applicable states have reasons; deferral retains original and effective due dates. Historical terminal records are retained.

The current local-storage stack enforces uniqueness through `getWorkSourceKey` and `upsertWorkProjection`. A future database must add unique `id` and source-key constraints plus indexes on home, ward, resident, type, persisted status, effective due time, priority, assignment, operational date, and transition `(workItemId, occurredAt)`.

## Flow diagrams

```text
Care Action -> Care Action Occurrence -> Work Item -> Ward/Shift Work Queue
 -> Care Action Completion -> Source Record + Event + Audit -> Work Item Completed

Assessment Reminder -> Work Item -> Assessment Workflow
 -> Assessment Completed -> Work Item Completed
```

No existing queue has been switched in this phase. The projection is a shadow read model until the parallel-run gates are satisfied.
