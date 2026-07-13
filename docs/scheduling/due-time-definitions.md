# Due-Time Definitions

All scheduled work is classified by `src/lib/care/dueTime.ts`.

- Overdue: active actionable work due before the current effective time, after the due-now late tolerance, and not completed, cancelled, discontinued, not applicable, deferred into the future, or missed.
- Due Now: active work due from now through 30 minutes ahead. The preserved late tolerance is 0 minutes, so work due before now becomes overdue.
- Next Hour: active work due after now and within 60 minutes, inclusive.
- Next 4 Hours: active work due after now and within 240 minutes, inclusive, including across midnight.
- Due This Shift: active work due within the resolved `ShiftDefinition` start and end for the operational context.
- Due Today: active work due within the nursing home's local calendar day.
- Missed: a persisted workflow outcome. Time passing alone does not mark work missed.
- Completed Late: completed work whose effective clinical completion time is after due time plus the configured tolerance.
