# Work Status Transition Matrix

| From           | Allowed persisted destinations                                       | Notes                                                             |
| -------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| scheduled      | in progress, completed, missed, deferred, cancelled, not applicable  | Completion requires source evidence; reason states require reason |
| in progress    | completed, missed, deferred, cancelled                               | Only source workflows that support start/partial progress         |
| deferred       | scheduled, in progress, completed, missed, cancelled, not applicable | Effective due time changes; deferral history remains              |
| completed      | none                                                                 | ordinary terminal state; duplicate completion is idempotent       |
| missed         | none                                                                 | follow-up is a new linked Work Item, not silent completion        |
| cancelled      | none                                                                 | restore requires a separately approved workflow                   |
| not applicable | none                                                                 | terminal for that occurrence                                      |

Due Soon, Due Now, and Overdue are not rows because they are derived. `workTransitions.ts` rejects arbitrary/direct status edits, cross-scope actions, missing capabilities, missing evidence, missing reasons, and invalid deferrals.
