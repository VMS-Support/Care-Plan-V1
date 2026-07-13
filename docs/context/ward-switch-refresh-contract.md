# Ward Switch Refresh Contract

On ward switch:

1. Validate account, home and ward access.
2. Update `OperationalContext`.
3. Persist the valid preference.
4. Recompute context selectors.
5. Keep safe global UI state.
6. Do not acknowledge handovers.
7. Do not alter roster assignments.
8. Do not write a clinical audit entry.
