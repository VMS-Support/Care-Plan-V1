# Rule Replay

`replayRuleForEvent` evaluates a historical event and rule version in simulation mode. Replay is safe because decisions retain source event, rule version and source-record references, and output handlers use dedupe keys.
