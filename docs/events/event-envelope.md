# Event Envelope

All events use `DomainEvent<TType, TPayload>`.

Required envelope fields:

- `eventId`
- `eventType`
- `eventVersion`
- `occurredAt`
- `recordedAt`
- `actor`
- `scope`
- `subject`
- `source`
- `payload`
- `correlationId`

Optional fields include causation, request ID, rule context, previous/current values and metadata. `occurredAt` may be earlier than `recordedAt` for late entries.
