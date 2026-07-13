# Employment Model

`EmploymentRecord` is the home-specific relationship between a staff member and a nursing home. A person can have multiple employment records, including permanent, temporary, agency, bank or contractor records.

Employment is not a permission by itself. Access also requires an active account, home assignment, role assignment and any relevant ward competency. Ended employment remains in history and should not delete authored clinical records.

Agency staff are distinguishable through `employmentType: "agency"` and optional `agencyName`.
