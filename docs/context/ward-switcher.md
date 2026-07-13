# Ward Switcher

`OperationalContextSwitcher` is the reusable ward switcher. It displays the current nursing home, selected ward or wards, shift label, operational date and effective role.

Switching ward calls the canonical context service, validates the ward against the current home and authorised ward list, persists only valid choices and does not create a clinical audit entry. The selected ward controls viewing/work scope only; it does not permanently assign residents to a user.
