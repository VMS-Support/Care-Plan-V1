# ID Policy

Canonical IDs must be immutable, URL safe, independent from display names, independent from room numbers and email addresses, not based on array index or sort order, and never reused.

The project already has durable seeded IDs and generated opaque IDs. This phase preserves stable existing IDs rather than renaming every model.

New canonical branded ID types live in `src/types/entityIds.ts`.

New generated entity IDs must use `createEntityId(entityType)` or a typed helper from `src/types/entityIds.ts`. The helper uses `crypto.randomUUID()` where available and falls back to `crypto.getRandomValues()`.

Deterministic migration IDs:

- Enterprise: `enterprise-default`
- Default ward: `ward-default-${nursingHomeId}`
- Default bed: `bed-${roomId}-${index}`
- Initial bed assignment: `bed-assignment-${residentId}`

These deterministic IDs make the additive localStorage migration idempotent and avoid regenerating relationships on reload.
