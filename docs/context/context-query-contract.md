# Context Query Contract

Operational queries should accept `OperationalContext` explicitly.

Current foundation selectors include residents, tasks, alerts, handovers and incidents. They apply nursing-home scope, ward selection, active resident lifecycle and in-home presence where appropriate.

Future selectors for appointments, observations due and upcoming care actions should use the same contract.
