# Context Initialisation

Initial context is resolved from the active user account, active home and any stored context. Stored values are revalidated against active `HomeAssignment`, `WardCompetency` and `RoleAssignment` records.

Invalid stored home or ward selections are discarded. The fallback is the first authorised home and first authorised ward, never all homes or all residents.
