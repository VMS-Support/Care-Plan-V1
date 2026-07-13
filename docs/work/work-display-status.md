# Work Display Status

Labels are Scheduled, Due Soon, Due Now, Overdue, In Progress, Completed, Missed, Deferred, Cancelled, and Not Applicable. Descriptions may add `42m overdue`, `Completed · 18m late`, `Deferred · Due <time>`, or a reason. `getWorkStatusLabel`, `getWorkStatusDescription`, `getWorkStatusBadge`, and `getWorkStatusSortRank` are the shared presentation contract; source pages should not recalculate dates in cards.
