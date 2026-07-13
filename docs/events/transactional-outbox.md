# Transactional Outbox

`EventStoreRecord` stores the envelope, status, retry count, timestamps and last error.

Statuses:

- `pending`
- `published`
- `failed`
- `dead_letter`

The local implementation is an additive foundation. A future backend migration should add indexes for event ID, event type, recorded time, correlation ID, subject entity, resident and nursing home.
