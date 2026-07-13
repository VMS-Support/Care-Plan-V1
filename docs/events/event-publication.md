# Event Publication

Events are appended to both event store and outbox after the source mutation has been prepared. In the current local-store app this is one state update. In a backend implementation it should be a single database transaction.

Publication failure after commit leaves the event pending or failed for retry. One failing consumer must not require rolling back a valid clinical source record after commit.
