# Event Architecture

Domain events describe meaningful persisted facts. They are not clinical records and they are not audit records.

```text
User records observation
  -> domain service mutation
  -> source entity persisted
  -> audit record written where required
  -> domain event envelope written to event store/outbox
  -> outbox publisher
  -> idempotent handlers
  -> read models, rule engine, dashboards, reports
```

This repository currently has local-store persistence, so the outbox is an additive in-process foundation. It preserves the contract needed for a future durable backend outbox without changing existing clinical IDs or records.
