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
