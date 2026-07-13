# Professional Registration Model

`ProfessionalRegistration` tracks profession, registration body, optional registration number, status and expiry independently from employment and role assignment.

Nurse and doctor demo users receive registration records only where their current role requires it. Legacy demo data does not include registration numbers, so the migration uses `registrationStatus: "unknown"` and records a review note rather than inventing sensitive data.

Helpers expose current status, expiring registrations, expired registrations and staff missing required registrations. Expiry creates governance warnings; it does not automatically block clinical access unless a later approved policy enables that.
