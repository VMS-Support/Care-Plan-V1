# Rule Idempotency

Processing receipts are unique by rule ID, version and source event. Reprocessing the same event records `skipped_duplicate`, preserves one decision and does not create a second active output. Page loads never call the rules engine.
