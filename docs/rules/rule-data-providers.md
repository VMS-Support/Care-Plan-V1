# Rule Data Providers

Rules declare `RuleDataRequirement` entries. Providers return bounded, scoped records for residents, weights, assessments, care plans and care actions. Missing required data returns `insufficient_data`; rules do not run uncontrolled database queries or cross nursing-home boundaries.
