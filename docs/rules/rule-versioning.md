# Rule Versioning

Rule versions are independent from event schema versions. Active rules are not edited in place. `createRuleVersion` creates the next version and links `supersedesRuleVersion`; `retireRuleVersion` closes an old version. Registry selection uses event type, active status, approval, scope and effective dates.
