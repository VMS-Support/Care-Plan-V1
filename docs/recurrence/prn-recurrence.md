# PRN Recurrence

## Definition

PRN (`pro re nata`, or "as needed") work records permission and readiness to perform an action when a clinical or operational need arises. A PRN rule is an active instruction, not a clock-based schedule and not evidence that the action has occurred.

## Difference from scheduled recurrence

Hourly, daily, weekly, monthly, selected-day, custom-interval, each-shift, and one-off rules generate occurrences from dates or shift boundaries within a bounded horizon. A PRN rule generates no occurrence merely because time passes. `generateOccurrences` therefore returns an empty collection for `recurrenceType: "prn"`.

An occurrence exists only after an authorised workflow explicitly invokes `createPrnOccurrence`. This prevents an unused PRN instruction from creating speculative Work Items or distorting workload and compliance counts.

## Triggering PRN work

The triggering workflow supplies:

- the active PRN rule and its owning source;
- an immutable trigger ID, normally the source command, clinical record, or event ID;
- the trigger time;
- the reason when `requirePrnReason` is enabled.

The engine rejects non-PRN rules and missing required reasons. The occurrence ID is deterministically derived from the source, rule, and trigger ID. Replaying the same trigger therefore resolves to the same occurrence instead of creating duplicate work.

Example: a resident reports breakthrough pain, an authorised nurse records the request and reason, and that workflow creates one PRN occurrence. Opening a dashboard or running the horizon generator does not create another occurrence.

## Due and overdue behaviour

Untriggered PRN work has no due time and must never become Due Soon, Due Now, or Overdue automatically. The shared Work display classifier returns no time-based due classification when `scheduleType` is `prn`.

Once triggered, clinical source policy owns the action and its completion rules. The occurrence may carry the trigger time as its effective action time, but elapsed time alone must not reinterpret the underlying PRN instruction as overdue.

## Source linkage

Every triggered occurrence links to its parent source and PRN rule through `WorkOccurrence` and `WorkSourceReference`. The linkage retains the nursing-home and resident scope, source type/module/entity, recurrence rule ID and version, occurrence/trigger ID, creating event and correlation IDs where applicable, direct route, completion owner, recreation policy, and creation time.

The source workflow remains authoritative. Completing a projected Work Item must execute or record completion in that source workflow; dismissing a queue row alone is not clinical evidence.

## Audit behaviour

Audit history must distinguish the standing PRN instruction from each use of it. For every trigger, retain who initiated it, when it was initiated, the immutable trigger/event ID, the reason when required, rule version, source linkage, and resulting lifecycle transitions. Completion, cancellation, missed, and not-applicable outcomes retain their normal evidence or reason requirements. Replay reuses the deterministic occurrence identity and must not duplicate audit side effects.

## Work Item behaviour

A triggered PRN occurrence may project one Work Item with `scheduleType: "prn"`. The Work Item:

- remains scoped to the same nursing home and resident as its source;
- opens the owning source route;
- delegates completion to the declared source service;
- is deduplicated by its occurrence/source key;
- retains terminal history during replay;
- is cancelled if its source is withdrawn or the resident is discharged, deceased, or inactive;
- follows the configured bedside-work suspension policy while the resident is in hospital or temporarily absent.

The standing PRN rule itself is not a Work Item and contributes no overdue count.

## Tests

`npm run test:recurrence` covers the following examples:

- horizon generation creates no PRN occurrence;
- an explicit trigger creates exactly one occurrence;
- a configured reason is mandatory;
- replaying the same trigger produces the same deterministic ID;
- the Work due classifier does not derive overdue for PRN schedules;
- source traceability detects missing routes, parents, scope, and provenance;
- resident and source eligibility transitions preserve completed history and control future work.

`npm run validate:recurrence` verifies that this document, the canonical PRN type, explicit trigger path, deterministic identity, and validation contracts remain present.
