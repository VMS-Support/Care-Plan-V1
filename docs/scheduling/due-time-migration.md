# Due-Time Migration

Migration is additive.

- Care interventions in Operations now use the central classifier through `intervention-schedule.ts`.
- Existing `ScheduledInterventionStatus` values remain as a compatibility adapter for approved UI labels.
- Task, observation, assessment, care-plan review and incident adapters exist or are documented for progressive migration.
- Existing completed intervention records are not rewritten.
- Legacy screens that still compare date strings are documented in the inventory and validation output.
