# Sensitive Capabilities

Sensitive capabilities require narrower policy than ordinary clinical viewing.

| Area | Capability examples | Current policy |
|---|---|---|
| Finance | `finance.view`, `finance.manage` | Explicit grant required. No current role template grants finance access. |
| Safeguarding | `safeguarding.investigate`, `safeguarding.close` | Investigation and closure require explicit grants. Limited safeguarding visibility may be added later for governance roles. |
| Staff records | `staff.manage`, `staff.registration_manage`, `staff.assignment_manage` | Foundations only; no Staff Management dashboard in this phase. |
| Audit | `audit.view` | DON template and scoped route guard. |
| Professional registration numbers | Registration data fields | Treated as sensitive staff information and not invented during migration. |

Future field-level restrictions should separate operational care information from HR, finance, safeguarding investigation detail and staff registration data.
