# Current Event Architecture Inventory

| Mechanism | Path | Behaviour | Source entity | Consumer | Retry/failure | Duplicate risk | Transaction behaviour | Limitation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Legacy audit log | `src/lib/care/store.tsx` | Synchronous calls to `logAudit()` after mutations | Many clinical/workflow records | Audit logs page and audit docs | No retry; local state write only | Medium if mutation retried manually | Same React state update path, not database atomic | Audit is not a domain event stream |
| Canonical audit records | `src/lib/care/auditFramework.ts` | Append-only audit model and validators | Mutations with actor/action/scope | Audit queries | No background retry | Low | Local-store foundation contract | Built for compliance, not rule input |
| Timeline events | `src/lib/care/store.tsx`, resident timeline routes | Synchronous fan-out into resident timeline | Assessments, incidents, care actions, handovers | Resident timeline UI | No retry | Medium | Same store update | UI projection, not canonical event |
| Clinical alert derivation | `src/lib/care/vitals.ts`, `src/lib/care/store.tsx` | Derived alerts from observations/vitals | Vitals/observations | Alert lists/dashboards | Recomputed locally | Duplicate risk managed by source links | Not queued | Rule logic exists but no event bus |
| Context refresh | `src/lib/care/operationalContext.ts` | Derived queries recalculate by home/ward/shift | Store arrays | Dashboards/work queues | Not persisted | No event should be emitted | Read-only | Not meaningful clinical mutation |
| Local persistence | `src/lib/care/store.tsx` | Browser local storage | Whole care store | App reload | Browser only | User can retain stale local data | No database transactions | Foundation app has no backend queue |

No existing pub/sub, background job, queue, transactional database, or API mutation endpoint was found. Phase 21/22 therefore adds a canonical local event store/outbox foundation and leaves durable backend publication as a future infrastructure replacement.
