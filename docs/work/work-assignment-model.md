# Work Assignment Model

Assignments are unassigned, person, role, ward queue, team, or self. Named Nurse is unrelated to operational assignment. Unassigned and ward-queue work remains visible within authorised ward context; role work is visible to holders; person/self work is visible to the target. Home-wide work appears once in multi-ward views.

Reassignment must append history, retain actor/time, and reject cross-home targets. The current Task model's free-text assignee is preserved by compatibility mapping; migration to stable staff/user IDs needs reconciliation rather than guessing identities.
