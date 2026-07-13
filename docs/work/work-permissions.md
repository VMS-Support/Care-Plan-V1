# Work Permissions

Canonical capabilities are `work_item.view`, `view_history`, `assign`, `reassign`, `start`, `complete`, `mark_missed`, `defer`, `cancel`, `mark_not_applicable`, and `manage_home_queue`. Every mutation also checks authorised home/ward scope and the handler's source capability, such as `assessment.complete`, `care_action.complete`, `observation.record`, or `handover.acknowledge`.

Generic Work Item permission never bypasses source permission. Cross-home assignment is invalid. Query visibility respects person, role, ward-queue, and unassigned semantics.
