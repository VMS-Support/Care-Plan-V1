# Auditable Actions Matrix

| Area | Auditable actions | Notes |
|---|---|---|
| Residents | create, update, move, discharge, mark deceased, inactivate | Room/bed moves should include previous/new placement. |
| Assessments | create, complete, void, correct, archive, restore | Void/correct require a reason. |
| Observations and vitals | create, correct, void/delete, restore | Effective time and recorded time are distinct. |
| Care plans/actions | create, update, review, inactivate, complete, discontinue | Review-date changes capture only changed fields. |
| Risks/alerts | create, update, acknowledge, resolve, dismiss | Derived count changes are not audited. |
| Tasks/handovers | create, update, complete, defer, cancel, acknowledge | Opening a handover does not acknowledge it. |
| Incidents | create, update, investigate, close, reopen | Restricted safeguarding details require capability controls. |
| Staff/access | role change, permission grant/deny, account suspend/disable, home/ward assignment | Reasons required for permission and role changes. |
| Security/export | login/logout where available, access denied, export, sensitive access | Separate security audit category/source. |
| Migrations/imports | migrate, import | Actor type is migration/integration/system. |
