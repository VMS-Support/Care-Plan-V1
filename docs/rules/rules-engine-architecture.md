# Rules Engine Architecture

```
Domain Event
    |
Applicable Rule Registry
    |
Data Providers
    |
Rule Evaluator
    |
Rule Decision
    |
Deduplication
    |
Typed Output Handler
    |-- Alert
    |-- Recommendation
    |-- Task
    |-- Risk Update
    |-- Care-Plan Coverage Gap
```

The implementation lives in `src/domain/rules`. Rules are selected from canonical domain events, not page loads. Store integration is additive: event producers append the event, then call `processRulesForEvent`. Current active behavior is limited to a non-clinical dedupe signal.
