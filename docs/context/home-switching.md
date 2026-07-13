# Home Switching

`switchNursingHome()` validates that the user has an active home assignment and a valid role in the target home. On success, previous ward selection is recalculated for the new home and operational queries are scoped to the new context.

Viewing-context switches do not create ordinary clinical audit entries. Denied or overridden context access can be recorded as security audit.
