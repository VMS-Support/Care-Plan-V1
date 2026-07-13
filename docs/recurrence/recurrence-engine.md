# Recurrence Engine

`src/domain/recurrence` is the canonical scheduling contract. It supports hourly, daily, weekly, monthly, custom interval, selected days, each shift, PRN, triggered, and one-off rules. Every rule is scoped to a nursing home and source record, carries an explicit IANA timezone, and has a bounded generation horizon (30 days by default).

Duration schedules—hourly and custom minutes/hours/days—advance by elapsed time. Calendar schedules retain the nursing-home wall time. Weekly rules accept selected weekdays (`0` Sunday through `6` Saturday). Monthly rules support a day, last day (`-1`), or weekday ordinal including last Monday. Each-shift rules use active home Shift Definitions and optional selected Shift IDs.

`generateOccurrences` is pure and deterministic. The requested end is capped by the rule horizon, end date, and maximum occurrence count. Existing occurrences are merged by deterministic ID so completed/cancelled history wins over replay. PRN and triggered rules generate nothing in the horizon worker; their explicit trigger functions create one occurrence.

## Migration

Current scheduling code remains behind compatibility adapters during parallel run. No Care Action, assessment, observation, Task, dashboard, or completion workflow is replaced in this phase. After parity, modules should persist canonical rules and call this engine rather than maintaining module-specific recurrence calculations.
