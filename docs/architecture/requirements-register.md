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
