# Current Recalculation Inventory

| Mechanism | File path | Queue/replay behavior | Late/corrected data handling | Duplicate risk | Deficiency |
| --- | --- | --- | --- | --- | --- |
| Event outbox | `src/domain/events/eventBus.ts` | Pending/published/failed/dead-letter outbox | Replays same event ID idempotently | Low | Event replay only, not rule issue reconciliation. |
| Rule replay | `src/domain/rules/ruleEngine.ts` | `replayRuleForEvent` simulation | Uses stored event and current source providers | Low | No request/item model before Phase 27. |
| Due-time projections | `src/lib/care/dueTime.ts` | Derived at read time | Uses current time/context | No persisted output | Not a rule recalculation queue. |
| Manual correction flows | Store update/delete methods | Direct record mutation with audit | No central affected-rule queue | Medium | Needs future correction events. |

Phase 27 adds dry-run/apply request and item models, source/rule hashes, deterministic item IDs and stale-plan blocking.
