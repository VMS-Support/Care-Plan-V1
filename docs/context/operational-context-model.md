# Operational Context Model

`OperationalContext` contains:

- nursing home;
- ward selection mode and selected ward IDs;
- shift ID, label, start and end;
- effective role key;
- operational date;
- timezone;
- source.

It is resolved centrally in `src/lib/care/operationalContext.ts` and exposed through `useCare()`.
