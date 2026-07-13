# Current Rule-Like Logic Inventory

| Area | File path | Trigger | Input data | Threshold or condition | Output | Active | Clinical approval | Frontend-only | Duplicate risk | Migration priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Assessment scoring | `src/lib/care/scoring.ts` | Assessment answer scoring | Assessment scores | Multiple scale-specific score bands and risk mappings | Interpretation and risk level | Yes | Existing app logic, approval not evidenced here | No | Medium | High |
| Assessment completion alert | `src/routes/assessments.new.$residentId.tsx` | Saving completed high/very-high assessment | Assessment score result | `riskLevel === high/very_high` | UI states alert/suggestion | Yes | Not documented | Yes | Medium | High |
| Assessment work queue | `src/routes/assessments.index.tsx`, `src/routes/assessments.reassessment.tsx` | Page render | Assessments and dates | Due/overdue date comparison, risk sorting | Dashboard queues and badges | Yes | Operational | Yes | Low | Medium |
| Care-plan quality | `src/lib/care/quality.ts`, `src/routes/care-plans.tsx`, `src/routes/care-plans.$id.tsx` | Page render | Care-plan problems, reviews, evaluations | Missing plans, review/evaluation overdue, high risk | Quality status and warnings | Yes | Operational | Mixed | Medium | Medium |
| Compliance dashboard | `src/routes/compliance.tsx` | Page render | Care plans and assessments | Overdue review/evaluation and high-risk no-plan logic | Compliance statistics | Yes | Not documented | Yes | Medium | Medium |
| Alerts work queue | `src/components/care/AlertsWorkQueue.tsx` | Page render | Assessments and care plans | Overdue days, review/evaluation status | Derived alert cards | Yes | Not documented | Yes | High | High |
| Vitals derived alerts | `src/lib/care/vitals.ts`, `src/lib/care/vital-records.ts` | Observation/vital recording | Vitals and observation plans | NEWS2 and hard-coded temperature thresholds | Clinical alert seeds/compliance | Yes | Policy source not captured here | No | High | High |
| Pain score alert | `src/lib/care/store.tsx` | Pain record add | Pain scores | Score >= 7 or rising by >2 | Alert | Yes | Not documented | No | High | High |
| Intervention due time | `src/lib/care/dueTime.ts`, `src/lib/care/intervention-schedule.ts` | Schedule projection | Intervention frequency/logs/context | Due now/overdue/missed classification | Upcoming Care Interventions and Next 4 Hours | Yes | Operational | No | Low | Protected |
| Care-action event producer | `src/lib/care/store.tsx` | Intervention log | Problem intervention log | Completed/partially completed/missed outcome | Canonical event | Yes | Operational | No | Low | Protected |
| Template escalation wording | `src/lib/care/templates.ts` | Template selection | Assessment type and risk | High/moderate risk mapping and text | Suggested care-plan templates | Yes | Not documented | No | Medium | Medium |

The new rules engine does not remove any existing logic in this phase. Existing logic remains legacy/manual until equivalent central rule behavior is clinically approved, tested and migrated.
