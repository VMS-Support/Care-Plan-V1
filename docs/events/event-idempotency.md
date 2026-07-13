# Event Idempotency

Handlers record `EventProcessingReceipt` entries keyed by event ID and handler ID. A completed receipt prevents duplicate side effects when the same event is delivered again.

Separate handlers are independent. Handler A can complete once while Handler B fails and retries without causing Handler A to repeat.
