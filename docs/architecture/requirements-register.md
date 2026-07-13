# Requirements Register

| Requirement | Statement | Verification |
|---|---|---|
| REQ-DATA-ENTITY-001 | Core entities have stable canonical IDs. | `npm run test:entity-hierarchy`, `npm run validate:entity-hierarchy` |
| REQ-ENTERPRISE-STRUCTURE-001 | Enterprise owns nursing homes. | Enterprise migration test |
| REQ-HOME-001 | Nursing home is the site-level clinical scope. | Nursing-home isolation test |
| REQ-WARD-001 | Ward/Unit belongs to one nursing home. | Default ward migration test |
| REQ-ROOM-001 | Room belongs to one ward. | Default ward migration test and validation report |
| REQ-BED-001 | Bed belongs to one room. | Default bed migration test and validation report |
| REQ-BED-ASSIGNMENT-001 | Resident placement supports historical and active bed assignments. | Default bed, multi-occupancy, placement selector tests |
| REQ-ID-001 | IDs are immutable and never based on display values. | Stable IDs test and `src/types/entityIds.ts` |
| REQ-MIGRATION-002 | Existing IDs and clinical records are preserved. | Existing RLT/scheduling/stable IDs regression test |
| REQ-DATA-ISOLATION-001 | No cross-home data leakage. | Nursing-home isolation test and facility-scoped selectors |
| REQ-LIFECYCLE-001 | Resident lifecycle uses explicit canonical statuses. | `npm run test:resident-lifecycle`, lifecycle validation |
| REQ-ADMISSION-001 | Admission type is separate from lifecycle status. | Active respite test |
| REQ-PRESENCE-001 | Physical presence is separate from lifecycle status. | Temporary absence and hospital transfer tests |
| REQ-OCCUPANCY-001 | Occupancy derives from beds and active assignments. | Occupancy policy and lifecycle validation |
| REQ-OCCUPANCY-002 | Previous bed assignments remain historically available. | Room move test |
| REQ-ABSENCE-001 | Temporary absence does not discharge the resident. | Temporary absence tests |
| REQ-TRANSFER-001 | Hospital transfer does not close the active admission. | Hospital transfer and return tests |
| REQ-RESPITE-001 | Respite is an admission type. | Active respite test |
| REQ-DISCHARGE-001 | Discharge ends the admission without deleting history. | Discharge test |
| REQ-DECEASED-001 | Deceased is a distinct lifecycle outcome. | Deceased test |
| REQ-INACTIVE-001 | Inactive is administrative and requires a reason. | Inactive administrative record test |
| REQ-SCHEDULE-ABSENCE-001 | Residents not physically in home are excluded from ordinary bedside work. | Absence eligibility tests |
| REQ-DATA-MIGRATION-003 | Existing resident and clinical record IDs remain unchanged. | Migration counts and RLT/scheduling regression tests |
| REQ-STAFF-IDENTITY-001 | Login account is separate from staff identity. | `npm run test:staff-access-model` |
| REQ-EMPLOYMENT-001 | Employment records are home-specific and historical. | `npm run test:staff-access-model`, `npm run validate:staff-access-model` |
| REQ-ROLE-001 | Clinical role assignment is scope-specific. | Different roles in different homes test |
| REQ-REGISTRATION-001 | Professional registration is independently tracked. | Registration expiry test |
| REQ-HOME-ASSIGNMENT-001 | Staff home access is explicitly assigned. | Multi-home user and home-scope tests |
| REQ-WARD-COMPETENCY-001 | Ward competency is separate from current ward selection. | Ward competency test |
| REQ-ROSTER-001 | Roster assignment is separate from role and competency. | Roster foundation validation test |
| REQ-PERMISSION-001 | Authorization uses capabilities, not role strings alone. | Permission tests and migrated route guards |
| REQ-PERMISSION-SCOPE-001 | Permissions are scoped to ward/home/enterprise as applicable. | Cross-home and ward-scope tests |
| REQ-PERMISSION-DENY-001 | Explicit deny overrides allow. | Explicit deny test |
| REQ-SAFEGUARD-ACCESS-001 | Safeguarding access is restricted and audited-ready. | Safeguarding restriction test |
| REQ-FINANCE-ACCESS-001 | Finance access requires explicit capability. | Finance explicit grant test |
| REQ-MULTIHOME-ACCESS-001 | Multi-home access requires valid assignment or enterprise permission. | Multi-home switching test |
| REQ-ACCOUNT-LIFECYCLE-001 | Disabling an account preserves staff and clinical history. | Disabled account test |
| REQ-AUDIT-001 | Meaningful persisted changes create audit records. | `npm run test:audit-framework` |
| REQ-AUDIT-002 | Audit records capture actor, action, target, previous/new values, time and scope. | Audit resident/care-plan/observation tests |
| REQ-AUDIT-003 | High-impact actions require a reason. | Care action, void assessment and permission tests |
| REQ-AUDIT-004 | Calculated dashboard changes do not create fake audit entries. | Dashboard recalculation audit test |
| REQ-AUDIT-005 | Audit records are append-only and immutable. | Audit framework docs and validation |
| REQ-AUDIT-006 | System-generated persisted entities are auditable and correlated to source events. | System-created alert correlation test |
| REQ-AUDIT-007 | Sensitive audit data is permission-restricted. | Sensitive values test and audit permissions docs |
| REQ-CONTEXT-001 | Operational context contains current home, ward selection, shift, role and date. | `npm run test:operational-context` |
| REQ-CONTEXT-002 | Stored context is revalidated against current permissions. | Invalid persisted context test |
| REQ-CONTEXT-003 | Ward switching refreshes all relevant operational data. | Single ward switch test |
| REQ-CONTEXT-004 | No old-home or old-ward data remains visible after a context switch. | No wrong-ward and multi-home tests |
| REQ-CONTEXT-005 | All Wards means all authorised wards only. | DON all wards and multi-ward tests |
| REQ-CONTEXT-006 | Home timezone drives due-date and shift calculations. | Night shift test and shift docs |
| REQ-CONTEXT-007 | Nurses are ward-context based, not restricted to assigned residents. | Initial nurse context test |
| REQ-CONTEXT-008 | Context changes do not create clinical audit entries. | Home-switching docs and no filter/page audit test |
| REQ-CONTEXT-009 | Denied or overridden context access may create security audit events. | Context permission docs |
| REQ-SCHEDULE-CONTEXT-001 | Upcoming Care Interventions and Next 4 Hours respect ward context without changing approved behaviour. | Operational context regression tests |
| REQ-WARD-SWITCH-001 | Switching ward refreshes all current operational data. | `npm run test:ward-shift-context` |
| REQ-WARD-SWITCH-002 | Old-ward data must not remain visible after a switch. | Single ward and wrong-ward tests |
| REQ-WARD-SWITCH-003 | Ward switching is permission-aware. | Unauthorised ward test |
| REQ-WARD-SWITCH-004 | Ward switching does not permanently assign residents to the user. | Ward switcher docs and tests |
| REQ-MULTIWARD-001 | Authorised users can select multiple wards. | CNM and night nurse tests |
| REQ-MULTIWARD-002 | Multi-ward aggregation must not duplicate records. | Multi-ward deduplication test |
| REQ-MULTIWARD-003 | All Wards means all authorised wards only. | DON all wards test |
| REQ-MULTIWARD-004 | Ward labels are visible when multi-ward context creates ambiguity. | Switcher component and docs |
| REQ-SHIFT-001 | Every nursing home has central shift definitions. | `npm run validate:shift-definitions` |
| REQ-SHIFT-002 | Shift labels are preserved, including Late Shift where established. | Shift resolution tests |
| REQ-SHIFT-003 | Night shifts crossing midnight are resolved correctly. | Night shift test |
| REQ-SHIFT-004 | Home timezone drives shift boundaries. | Shift definition validation |
| REQ-SHIFT-005 | Operational date for cross-midnight shift uses the documented policy. | Night shift boundaries docs |
| REQ-SHIFT-006 | Manual shift view does not alter roster or work records. | Manual shift view test |
| REQ-SCHEDULE-WARD-001 | Upcoming Care Interventions respects ward selection without changing approved behaviour. | Upcoming Care Interventions ward test |
| REQ-SCHEDULE-WARD-002 | Next 4 Hours respects ward selection and central time windows. | Next 4 Hours ward test |
| REQ-HANDOVER-WARD-001 | Handover follows selected ward(s) and shift. | Handover ward switch test |
| REQ-DUE-001 | All migrated scheduled work uses one due-time classification service. | `npm run test:due-time` |
| REQ-DUE-002 | Due-time calculations use the nursing-home timezone. | `npm run validate:due-time` |
| REQ-DUE-003 | Overdue is distinct from missed. | Due-time overdue/missed tests |
| REQ-DUE-004 | Completed late uses effective completion time where available. | Completed late test |
| REQ-DUE-005 | Next Hour is centrally defined. | Next hour boundary test |
| REQ-DUE-006 | Next 4 Hours is centrally defined and preserves current behaviour. | Next four hours test |
| REQ-DUE-007 | Due This Shift uses configured shift boundaries. | Due this shift test |
| REQ-DUE-008 | Due Today uses the nursing-home local day. | Due-time docs and validator |
| REQ-DUE-009 | Derived time changes do not create audit entries. | Due-time classifier docs |
| REQ-DUE-010 | Missed status requires an approved transition and reason. | Missed status test and docs |
| REQ-HANDOVER-001 | Handover visibility follows nursing home, ward and shift context. | `npm run test:handover-context` |
| REQ-HANDOVER-002 | Opening a handover does not acknowledge it. | Opening page test |
| REQ-HANDOVER-003 | Acknowledgement is user-specific. | Current-user and another-nurse acknowledgement tests |
| REQ-HANDOVER-004 | Resident and ward handovers are distinct. | Handover model docs and tests |
| REQ-HANDOVER-005 | Unresolved important handovers may be carried forward without duplication. | Carry-forward dedupe tests |
| REQ-HANDOVER-006 | Resolved handovers remain historically available. | Resolved/history validation |
| REQ-HANDOVER-007 | Multi-ward handover counts are deduplicated. | Multi-ward count test |
| REQ-HANDOVER-008 | Cross-home and cross-ward handover leakage is prohibited. | Cross-home and ward visibility tests |
| REQ-HANDOVER-009 | Shift targeting uses stable shift IDs. | Day/Late/Night target tests |
| REQ-HANDOVER-010 | Handover actions are audited but visibility recalculation is not. | Handover audit docs |
| REQ-EVENT-001 | Meaningful persisted changes create canonical domain events. | `npm run test:event-architecture` |
| REQ-EVENT-002 | Events use immutable unique event IDs. | Unique event ID test |
| REQ-EVENT-003 | Events are versioned. | Unsupported version test |
| REQ-EVENT-004 | Every event includes nursing-home scope. | Missing home scope test |
| REQ-EVENT-005 | Resident clinical events include resident ID. | Envelope and payload validation |
| REQ-EVENT-006 | Every event includes occurredAt and recordedAt. | occurredAt/recordedAt test |
| REQ-EVENT-007 | Every event includes actor and source module. | Envelope validation |
| REQ-EVENT-008 | Every event includes correlation ID. | Missing correlation test |
| REQ-EVENT-009 | Downstream events may include causation ID. | Causation ID test |
| REQ-EVENT-010 | Rule-generated events include rule ID and rule version. | Event envelope schema |
| REQ-EVENT-011 | Events minimise sensitive clinical data. | Sensitive field rejection test |
| REQ-EVENT-012 | Event consumers are idempotent. | Duplicate delivery test |
| REQ-EVENT-013 | Publication uses a durable outbox where supported. | Outbox commit/publish tests |
| REQ-EVENT-014 | Event-processing failures are retryable and observable. | Publication failure test |
| REQ-EVENT-015 | Dead-letter events can be diagnosed and safely replayed. | Invalid event dead-letter test |
| REQ-EVENT-016 | Clinical events are distinct from audit records. | Event/audit correlation docs |
| REQ-EVENT-017 | Calculated dashboard changes do not produce domain events. | Dashboard refresh no-event test |
| REQ-EVENT-018 | Existing clinical IDs and records remain unchanged. | Existing regression suites |
| REQ-EVENT-019 | Cross-home event processing is prohibited. | Multi-home isolation test |
| REQ-EVENT-020 | Historical backfill requires an explicit approved strategy. | Event migration docs |
| REQ-RULE-001 | Rules are central and not embedded independently in dashboard components. | `npm run validate:rules-engine`; current rule inventory |
| REQ-RULE-002 | Rules are versioned and historical decisions retain the evaluated version. | `npm run test:rules-engine` |
| REQ-RULE-003 | Clinical-threshold rules require clinical approval before activation. | `npm run validate:rules-engine`; `npm run test:rules-engine` |
| REQ-RULE-004 | Rules are configurable and support nursing-home scope. | Rule catalogue and multi-home test |
| REQ-RULE-005 | Rule evaluation is deterministic and event-driven. | Rule engine tests and store event integration |
| REQ-RULE-006 | Rules declare required supporting data. | Rule definition model and provider validation |
| REQ-RULE-007 | Missing required data produces an insufficient-data result. | Rule explanation and validation tests |
| REQ-RULE-008 | Rules do not automatically diagnose residents. | Explanation wording tests |
| REQ-RULE-009 | Recommendations requiring clinical judgement do not auto-complete clinical decisions. | Reference rule docs and inactive clinical rules |
| REQ-EXPLAIN-001 | Every generated alert/recommendation explains what happened. | `npm run test:rules-engine` |
| REQ-EXPLAIN-002 | Every generated alert/recommendation identifies the threshold or condition met. | `npm run test:rules-engine` |
| REQ-EXPLAIN-003 | Every generated alert/recommendation identifies the source records used. | `npm run test:rules-engine` |
| REQ-EXPLAIN-004 | Every generated alert/recommendation provides recommended action. | `npm run test:rules-engine` |
| REQ-EXPLAIN-005 | Explanations use professional nursing-home terminology. | Rule explanations docs |
| REQ-EXPLAIN-006 | Technical rule trace is permission-restricted. | Explanation model test |
| REQ-DEDUPE-001 | The same rule and event are processed idempotently. | Duplicate event test |
| REQ-DEDUPE-002 | Rule-generated outputs use deterministic deduplication keys. | Dedupe key tests |
| REQ-DEDUPE-003 | Page loads and dashboard refreshes never generate duplicate alerts/tasks. | Page refresh test |
| REQ-DEDUPE-004 | Concurrent rule processing cannot create duplicate active issues. | Dedupe docs; future DB unique constraints |
| REQ-DEDUPE-005 | Repeated matching events update one active issue where configured. | Output dedupe test |
| REQ-DEDUPE-006 | Resolved recurring issues preserve episode history. | Recurrence test |
| REQ-DEDUPE-007 | Different output codes are not incorrectly merged. | Different output-code test |
| REQ-RULE-AUDIT-001 | Rule lifecycle, overrides and persisted outputs are auditable. | Rule audit/security docs |
| REQ-RULE-SCOPE-001 | Rules and source records cannot cross nursing-home boundaries. | Multi-home isolation test |
