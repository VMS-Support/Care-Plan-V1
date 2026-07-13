# Event Data Classification

Events minimise sensitive data. Prohibited payload fields include passwords, full care plans, full assessment answers, free-text narrative, full handover notes, and unrestricted comments.

Diagnostics should log event ID, event type, handler ID and correlation ID. Do not log full payloads in plain text.
