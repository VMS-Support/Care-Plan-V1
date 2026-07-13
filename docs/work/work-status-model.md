# Work Status Model

Persisted workflow states are `scheduled`, `in_progress`, `completed`, `missed`, `deferred`, `cancelled`, and `not_applicable`. `due_soon`, `due_now`, and `overdue` are derived at query time through the central Phase 19 classifier; they never cause minute-by-minute writes or audits. Completed Late is a completion qualifier.

`workStatus.ts` adapts a Work Item to `dueTime.ts`, uses the item's effective due time and the operational context timezone/shift/date, and applies precedence: completed, cancelled, not applicable, missed, deferred, in progress, overdue, due now, due soon, scheduled. The existing 30-minute central due-now window is reused. Due Soon currently maps to the central next-hour signal; no work-type override is invented.

Opening a route changes nothing. Only explicit source-compatible start/complete actions can persist a transition.
