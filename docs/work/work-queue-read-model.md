# Work Queue Read Model

`getWorkItemsForOperationalContext` applies nursing-home isolation, authorised selected wards, optional target shift and operational date, active/history separation, resident presence, assignment visibility, filters, pagination-ready deterministic ordering, and Work Item ID deduplication. It returns resident/ward/room summaries, central display status, source route, assignment label, and source-aware allowed actions.

Default ordering is status urgency, clinical priority, effective due time, ward, room, resident, stable ID. Completed/history items are excluded from the default active view. Home-wide work appears once. “All Wards” means the intersection of selected and authorised wards.

Quick actions come from the handler registry. Care Action, Assessment, Observation, Review, and Handover completion remain source-specific; only suitable general Tasks support direct generic completion.
