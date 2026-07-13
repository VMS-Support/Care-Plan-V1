# Work Occurrence Model

A definition is the continuing instruction, an occurrence is one scheduled instance, and a Work Item is the operational projection of that occurrence. Recurring Care Actions and observation schedules therefore produce separate stable items for 08:00, 10:00, and 12:00; completing 10:00 does not complete the definition.

Occurrence generation remains owned by `intervention-schedule.ts` and future observation scheduling infrastructure. It must be deterministic, timezone-aware, DST-safe, bounded by an approved horizon, and must preserve historical completed/missed occurrences. `WorkSchedule` retains `originalDueAt`, `effectiveDueAt`, recurrence ID, and occurrence index. PRN/unscheduled work can omit `dueAt`.
