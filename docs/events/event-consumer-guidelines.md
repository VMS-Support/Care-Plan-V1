# Event Consumer Guidelines

Consumers must be idempotent, independently testable and scoped by nursing home. They should record processing receipts and avoid logging sensitive payloads.

Consumers must never apply a Ballymore event to a Hazelwood read model or vice versa.
