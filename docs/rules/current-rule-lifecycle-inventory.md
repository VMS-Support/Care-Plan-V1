# Current Rule Lifecycle Inventory

| Mechanism | File path | Status values | Transition rules | Actor/reason/audit | Source linkage | Deficiencies and migration risk |
| --- | --- | --- | --- | --- | --- | --- |
| Legacy alerts | `src/lib/care/types.ts`, `src/lib/care/store.tsx` | acknowledged/resolved fields | Acknowledge and resolve mutate alert fields | Actor/time captured for some actions; audit log recorded | No rule ID/version | Manual behavior must stay compatible. |
| Clinical alerts | `src/lib/care/types.ts`, `src/lib/care/store.tsx` | active, acknowledged, dismissed/resolved by fields | Dismiss can also resolve | Actor/time/reason captured | Derived alert seeds, no RuleIssue | Needs rule issue linkage later. |
| Tasks | `src/components/care/TaskWorkflowEngine.tsx`, `src/lib/care/types.ts` | pending, in_progress, completed, overdue, deleted | User workflow driven | Delete reason/audit supported | No rule decision linkage | Do not replace manual tasks in this phase. |
| Handovers | `src/lib/care/store.tsx`, `src/routes/handovers.tsx` | active, acknowledged, completed, closed, archived | Explicit user actions | Audit exists | Domain event exists | Protected from rule lifecycle changes. |
| Rule generated outputs | `src/domain/rules/ruleTypes.ts` | active, resolved, dismissed, superseded | Previously output-level only | No transition history before Phase 26 | Rule decision and source event links exist | Migrated to RuleIssue lifecycle foundation. |

The new model keeps legacy records intact and adds `RuleIssue`, `RuleIssueEpisode` and `RuleIssueTransition` for rule-generated issues only.
