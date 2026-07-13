# Rule Issue Lifecycle

Rule decisions are one evaluation result. Rule issues are the ongoing condition managed across decisions. A matched decision opens or updates a RuleIssue through its deduplication key. Lifecycle states are `open`, `acknowledged`, `escalated`, `resolved` and `dismissed`.

Acknowledgement is not resolution. Dismissal is not deletion. Resolved or dismissed issues reopen through a new episode.
