# Shift Resolution Policy

Central helpers include `resolveCurrentShift()`, `resolveShiftForOperationalDate()`, `getShiftWindow()`, `getNextShift()`, `getPreviousShift()`, `getShiftsForHome()` and `getOperationalTimeWindows()`.

Shift resolution uses the nursing home's configured timezone and shift definitions. If no configured current shift exists, validation reports the gap rather than silently choosing an unrelated shift.
