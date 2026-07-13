# Current User, Role, and Permission Inventory

## Authentication and Persistence

| Mechanism | Path | Purpose | ID field | Scope behaviour | Known gaps | Migration risk |
|---|---|---|---|---|---|---|
| `CareProvider` demo auth state | `src/lib/care/store.tsx` | Holds the active demo user, role switcher state, facility filter and local store persistence. | `UserProfile.id` | Uses `facilityId`, `facilityIds`, active facility filter and legacy `assignedWings`. | Login account, staff identity, employment and role were previously combined in one user record. | High if user IDs change; migration preserves user IDs as `UserAccount.id`. |
| Demo users | `src/lib/care/store.tsx` | Seeded DON, CNM, Nurse, Doctor and Carer/HCA users. | `id` | Home access through `facilityId` and `facilityIds`; ward scope through `assignedWings`. | Role is global per user, not home-specific. | Additive canonical records generated from existing users. |
| Browser persistence | `src/lib/care/store.tsx` | Persists user-created demo records. | Entity-specific IDs | Existing records keep legacy author names and role labels. | No server-side authorization. | New staff-access arrays are additive. |

## Role and Permission Checks

| Mechanism | Path | Purpose | Role values | Current checks | Navigation behaviour | Known gaps |
|---|---|---|---|---|---|---|
| Legacy permission helper | `src/lib/care/permissions.ts` | Maps `Role` to legacy permissions. | `carer`, `nurse`, `doctor`, `cnm`, `don` | `can(role, permission)` and `canEditOpsRecord`. | Used by many buttons and pages. | Role-only; no home, ward, account-status or deny semantics. |
| Canonical staff access engine | `src/lib/care/staffAccess.ts` | Adds capability checks with account, staff, home, ward, role template and grants. | `HCA`, `NURSE`, `DOCTOR`, `CNM`, `DON` | `canAccess(context, capability, resource)` and `explainAuthorizationDecision`. | `AppShell` navigation now filters migrated items by capability. | Some legacy component-level checks remain during compatibility period. |
| Route guards converted this phase | `src/routes/audit-logs.tsx`, `src/routes/vitals.audit.tsx`, `src/routes/assessments.new.$residentId.tsx`, `src/routes/residents.$id.record.tsx` | Protect audit, vitals audit, assessment creation and quick record creation. | Capability-based | Uses `canAccess`. | Access denied message, no redirect loop. | Other route guards are inventoried for phased conversion. |

## Staff Names and Authorship

Staff display names are currently stored on clinical records as strings such as `staff`, `assessor`, `authoredBy`, `reportedBy`, `recordedBy`, `createdByName`, `byUserName` and audit-log `user`. These occur across dashboards, care plans, assessments, observations, reviews, incidents, handovers and audit history. Phase 12/13 keeps those strings stable and adds `StaffMember` as the canonical identity for future resolution. Historical author text is not rewritten.

## Nursing Home and Ward Logic

Nursing-home switching currently uses the active facility filter and `UserProfile.facilityIds`. The canonical adapter now exposes `HomeAssignment` and `WardCompetency` selectors while retaining existing user fields. Ballymore Haven and Hazelwood Care remain separate home scopes. Ward access migrates only where existing ward linkage can be determined.

## Existing Profile and Administration Workflow

Current user creation is demo/local-store based in `src/lib/care/store.tsx`. There is no dedicated staff profile, staff-management dashboard, registration-renewal workflow or enterprise administration workflow in this phase. The new records are foundations for those later screens.

## Security Gaps Carried Forward

- Many legacy UI buttons still call `can(currentRole, ...)`.
- The app remains frontend/local-store demo software; backend enforcement is not present.
- Some historical records only contain display-name authorship and cannot yet resolve to a canonical staff ID.
- Professional registration numbers are not present in existing demo data and are flagged as unknown rather than invented.
