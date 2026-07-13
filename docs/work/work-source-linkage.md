# Work Source Linkage

The source key is `workType + sourceType + sourceModule + sourceEntityType + sourceEntityId + sourceOccurrenceId-or-definition`. It excludes titles, resident names, and current timestamps. `createDeterministicWorkItemId` and `upsertWorkProjection` make page refresh, event replay, worker restart, and migration rerun idempotent.

Care Action occurrences use the occurrence as `sourceEntityId/sourceOccurrenceId` and the Care Action as parent. Assessment reminders link reminder to Assessment. Handover acknowledgement uses `handoverId + userAccountId + targetShiftId`. Routes are operational pointers, never identity.

Source changes are projected into Work Items. Work Item code must not mutate clinical sources independently. Source inactivation maps to cancellation or not-applicable according to source policy; completion maps only with evidence. Event causation/correlation IDs should be shared when a source event and generic Work event are both emitted, preventing loops.
