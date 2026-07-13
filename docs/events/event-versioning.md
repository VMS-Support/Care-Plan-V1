# Event Versioning

All initial events are version `1`.

Increment the version when a required payload field is removed, renamed or reinterpreted. Adding optional fields normally does not require a new version. Old stored event payloads must remain readable and must not be silently rewritten.
