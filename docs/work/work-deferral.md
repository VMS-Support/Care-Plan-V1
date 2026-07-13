# Work Deferral

Deferral requires a reason and a `deferredUntil` later than the current effective due time. It preserves `originalDueAt`, updates `effectiveDueAt`, appends transition history, and remains visible as Deferred. The due engine uses the effective time. Work-type maximums, critical-work approval, and repeated-deferral approval are policy gaps and must not be guessed.
