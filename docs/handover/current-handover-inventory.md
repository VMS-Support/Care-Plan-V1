# Current Handover Inventory

| Area | File path | Source entity | Current fields | Timezone | Status output | Known inconsistency | Migration risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Handover model | `src/lib/care/types.ts` | `HandoverNote` | resident, date, legacy `morning/afternoon/night`, staff, summary, outstanding actions, priority, read/ack arrays | Legacy local date string | `open`, `active`, `read`, `acknowledged`, `completed`, `closed` | Legacy shift labels are not stable shift IDs. | Medium. |
| Operations panel | `src/components/operations/OperationsHub.tsx` | `HandoverNote` | Unread current-shift handovers | Now uses operational context | unread count and cards | Opening page/card does not acknowledge. | Low. |
| Full page | `src/routes/handovers.tsx` | `HandoverNote` | Active/archive/delete tabs, search, status filters | Now uses operational context | active/history rows | Historical archived/deleted rows remain compatibility filtered. | Medium. |
| Dialog | `src/components/care/HandoverDialog.tsx` | `HandoverNote` | Resident, date, shift, staff, priority, summary, outstanding actions | Defaults to operational context | create/edit/view | Ward-level scope UI is future work. | Medium. |

Existing acknowledgements were arrays of names. Phase 20 preserves those arrays and adds user-specific acknowledgement records where the current user context is known.
