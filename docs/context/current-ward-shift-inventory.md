# Current Ward and Shift Inventory

| Mechanism | File path | Current behaviour | Source of truth | Scope | Role restrictions | Persistence | Known bugs / gaps | Migration risk |
|---|---|---|---|---|---|---|---|---|
| Nursing-home selector | `src/components/care/UserMenu.tsx`, `src/lib/care/store.tsx` | Switches active facility for multi-home users. | Legacy `facilityIds`, now backed by `HomeAssignment`. | Nursing home | Active home assignment | Local storage key `carepath-pro-active-facility` | No ward/shift coupling before context engine | Low; retained and adapted |
| Operational context switcher | `src/components/care/OperationalContextSwitcher.tsx` | Shows home, ward(s), shift, date and effective role. | `OperationalContext` | Home, wards, shift | Home assignment, ward competency, management role | `operationalContexts` in store | Compact top-bar only | Low; additive |
| Operations filters | `src/components/operations/OperationsHub.tsx` | Wing, room, resident and assigned-to filters. | Component state and context residents | Legacy wing/room plus context resident base | Role-based legacy checks remain | Component state only | Wing filter is compatibility layer, not canonical ward context | Medium |
| Dashboard work queues | `src/components/operations/OperationsHub.tsx` | Upcoming Care Actions, Next 4 Hours, observations, tasks, alerts, handovers. | Store arrays plus schedule helper | Home/ward/shift context | Legacy assignment filters remain | None | Some module-specific filters remain local | Medium |
| Shift labels | `src/lib/care/intervention-schedule.ts`, `src/lib/care/operationalContext.ts` | Day/Late/Night preserved. | Central `ShiftDefinition` | Per nursing home | Shift viewing context | `shiftDefinitions` | Legacy helper retained for compatibility | Low |
| Handover shift | `src/components/operations/OperationsHub.tsx`, handover routes | Legacy morning/afternoon/night values. | Handover record strings | Current context residents | Read/acknowledge actions | Handover state | Needs future shift-ID migration | Medium |

Appointments, admission/return operational queues, pre-admission forms and hospital-return workflows are not implemented as modules. This phase adds future-compatible query contracts only.
