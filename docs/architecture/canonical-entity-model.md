# Canonical Entity Model

## Enterprise

Purpose: structural parent for one or more nursing homes. It is not a dashboard, billing account, role model, or finance module.

ID: `enterpriseId` (`EnterpriseId`). Default record: `enterprise-default`, displayed as `NuCare Organisation`.

Migration: create one default enterprise and link existing facilities through `enterpriseId`.

## Nursing Home

Purpose: regulated care-home site and clinical data scope.

ID: existing `Facility.id`, canonical alias `nursingHomeId` (`NursingHomeId`). Legacy field name `facilityId` remains in current models.

Migration: preserve existing IDs (`facility-ballymore-haven`, `facility-hazelwood-care`) and add `enterpriseId`.

## Ward / Unit

Purpose: operational grouping of rooms and residents.

ID: `wardId` (`WardId`). Parent: `nursingHomeId`.

Migration: create one default active ward named `Main Unit` for each nursing home that has no wards. Existing `Wing`/`Unit` remains for compatibility.

## Room

Purpose: physical room in one ward.

ID: existing `Room.id`, branded as `RoomId` in canonical helpers. Parent: `wardId`.

Display identifier: `roomNumber` / `number`. Room number is not identity.

Migration: add `wardId`, `nursingHomeId`, `facilityId`, `roomNumber`, `active`, timestamps.

## Bed

Purpose: occupiable bed space within a room.

ID: `bedId` (`BedId`). Parent: `roomId`.

Migration: create at least one bed per room. If multiple active residents share a room, create enough beds and active assignments to preserve distinct placement.

## Bed Assignment

Purpose: placement history foundation.

ID: `bedAssignmentId` (`BedAssignmentId`). Relationships: `bedId`, `residentId`, `nursingHomeId`.

Rules: one active resident per bed and one active bed assignment per resident. Historical assignments are retained.

## Resident

ID: existing `Resident.id`. Placement resolves through active bed assignment first, then `roomId`, then legacy `roomNumber`.

## Staff Member and User Account

`UserProfile` currently represents login plus staff details. Canonical model separates `staffMemberId` from `userAccountId` in documentation and ID types, but no runtime staff table is created in this phase.

## Clinical and Workflow Entities

Existing IDs are preserved:

- Assessment: `Assessment.id`
- Observation: `VitalSign.id`, `ClinicalObservation.id`, chart record IDs
- Care Plan: `CarePlan.id` and `ResidentCarePlan.id`
- Care Plan Item: `CarePlanProblem.id`
- Care Action: `ProblemIntervention.id`, `Intervention.id`
- Review: `ProblemReview.id`, `CarePlanReview.id`
- Evaluation: `ProblemEvaluation.id`, legacy evaluation IDs
- Task: `Task.id`
- Alert: `Alert.id`, `ClinicalAlert.id`
- Incident: `Incident.id`
- Handover: `HandoverNote.id`

Future-only entities such as transfer and document are documented but not materialized.
