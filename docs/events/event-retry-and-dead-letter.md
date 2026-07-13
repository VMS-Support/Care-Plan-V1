# Event Retry And Dead Letter

Failed handlers leave the event in `failed` status. Invalid envelopes or unsupported versions go to `dead_letter`.

Manual replay in a future admin surface must preserve event ID and correlation ID, increment attempts, require a reason and be audited.
