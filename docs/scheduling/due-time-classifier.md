# Due-Time Classifier

`classifyDueTime(workItem, context, policy, clock)` is the canonical service for derived scheduled-work time state.

Inputs:

- scheduled work reference;
- operational context;
- due-time policy;
- deterministic clock.

The classifier returns primary status, independent window flags, lateness minutes, operational date and timezone. Derived time-state changes do not create audit records because no persisted workflow transition occurs.
