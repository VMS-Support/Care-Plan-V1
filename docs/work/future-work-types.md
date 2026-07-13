# Future Work Types

Standalone Appointment and Referral modules do not exist, so no fake source, route, seed, or Work Item is created. Future contracts require stable episode IDs, source statuses, due/assignment scope, source-specific outcomes, and evidence. Medication administration/review, maintenance, housekeeping, training, audit/safeguarding, finance, admission preparation, and hospital-return review are also non-goals until their source modules and clinical policies exist.

Adding a type requires a versioned `WorkType`, source projector, handler, source capability, transition policy, validation, parity test, and migration plan. Unrelated work must never be overloaded into `general_task` merely to avoid this process.
