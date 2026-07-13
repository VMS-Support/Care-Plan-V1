# Due-Time Policy

The default policy is centralised as `defaultDueTimePolicy`.

| Field | Value | Reason |
| --- | ---: | --- |
| `dueNowEarlyMinutes` | 30 | Preserves existing intervention behaviour. |
| `dueNowLateMinutes` | 0 | Existing overdue logic began immediately after due time. |
| `completedLateToleranceMinutes` | 0 | No prior tolerance was implemented. |
| `nextHourMinutes` | 60 | Existing and phase-defined boundary. |
| `nextFourHoursMinutes` | 240 | Existing and phase-defined boundary. |
| `useShiftBoundaryForMissed` | false | Missed is not automatic in this phase. |
| `useEndOfDayForMissed` | false | Missed is not automatic in this phase. |

Future home-specific policies should override this policy by nursing home without changing component logic.
