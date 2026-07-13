# Context Migration

The migration is additive:

- facilities receive a default timezone when missing;
- each nursing home receives default Day/Late/Night shift definitions;
- stored operational contexts are preserved where valid;
- invalid home or ward choices are repaired at runtime;
- existing resident, care-plan, schedule and audit data is not rewritten.
