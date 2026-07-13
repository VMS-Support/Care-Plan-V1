# Event Producer Guidelines

Emit events only after meaningful persisted changes:

- entity created;
- meaningful state transition completed;
- clinical risk changed;
- explicit missed/refusal outcome recorded.

Do not emit for page render, list filter, dashboard refresh, validation failure, context switch, time-based derived status change or rolled-back mutation.
