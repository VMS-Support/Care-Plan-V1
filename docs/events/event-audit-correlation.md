# Event Audit Correlation

Audit and events are related but distinct.

- Audit describes who changed what and why.
- Event announces the meaningful persisted result.

They should share actor, source entity, nursing-home scope and correlation ID where the mutation path supports both. Event ID and audit ID must not be the same.
