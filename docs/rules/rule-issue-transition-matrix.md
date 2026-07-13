# Rule Issue Transition Matrix

| From | Allowed To | Notes |
| --- | --- | --- |
| open | acknowledged, escalated, resolved, dismissed | Opening is rule-driven. |
| acknowledged | escalated, resolved, dismissed | Acknowledged remains active. |
| escalated | acknowledged, resolved, dismissed | Escalation history is retained. |
| resolved | open | Reopen creates a new episode. |
| dismissed | open | Reopen requires policy/expiry/new match. |

Direct arbitrary status edits are not allowed.
