# DST and Timezone Policy

Every rule uses an explicit IANA nursing-home timezone; browser timezone is never consulted. Calendar recurrence preserves local wall time. When spring change removes a requested local time, the occurrence moves to the first valid local minute after the gap. When autumn change duplicates a wall time, the earliest matching instant is selected. These policies are deterministic and documented rather than depending on browser parsing.

Elapsed-duration recurrence remains elapsed duration across clock changes, so a two-hourly schedule stays two real hours apart even if local labels jump or repeat. Each-shift schedules resolve each configured shift start as a local wall time. Tests cover Europe/Dublin spring gaps, autumn ambiguity, daily wall-time continuity, and overnight shift identity.
