export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

export type EnterpriseId = Brand<string, "EnterpriseId">;
export type NursingHomeId = Brand<string, "NursingHomeId">;
export type WardId = Brand<string, "WardId">;
export type RoomId = Brand<string, "RoomId">;
export type BedId = Brand<string, "BedId">;
export type BedAssignmentId = Brand<string, "BedAssignmentId">;
export type AdmissionId = Brand<string, "AdmissionId">;
export type AbsenceEpisodeId = Brand<string, "AbsenceEpisodeId">;
export type ResidentId = Brand<string, "ResidentId">;
export type StaffMemberId = Brand<string, "StaffMemberId">;
export type UserAccountId = Brand<string, "UserAccountId">;
export type EmploymentRecordId = Brand<string, "EmploymentRecordId">;
export type RoleAssignmentId = Brand<string, "RoleAssignmentId">;
export type ProfessionalRegistrationId = Brand<string, "ProfessionalRegistrationId">;
export type HomeAssignmentId = Brand<string, "HomeAssignmentId">;
export type WardCompetencyId = Brand<string, "WardCompetencyId">;
export type RosterAssignmentId = Brand<string, "RosterAssignmentId">;
export type PermissionGrantId = Brand<string, "PermissionGrantId">;
export type RoleTemplateId = Brand<string, "RoleTemplateId">;
export type AuditRecordId = Brand<string, "AuditRecordId">;
export type OperationalContextId = Brand<string, "OperationalContextId">;
export type ShiftId = Brand<string, "ShiftId">;
export type AssessmentId = Brand<string, "AssessmentId">;
export type ObservationId = Brand<string, "ObservationId">;
export type CarePlanId = Brand<string, "CarePlanId">;
export type CarePlanItemId = Brand<string, "CarePlanItemId">;
export type CareActionId = Brand<string, "CareActionId">;
export type ReviewId = Brand<string, "ReviewId">;
export type TaskId = Brand<string, "TaskId">;
export type AlertId = Brand<string, "AlertId">;
export type RiskId = Brand<string, "RiskId">;
export type IncidentId = Brand<string, "IncidentId">;
export type HandoverId = Brand<string, "HandoverId">;
export type DomainEventId = Brand<string, "DomainEventId">;
export type WorkItemId = Brand<string, "WorkItemId">;
export type WorkStatusTransitionId = Brand<string, "WorkStatusTransitionId">;
export type RecurrenceRuleId = Brand<string, "RecurrenceRuleId">;
export type OccurrenceId = Brand<string, "OccurrenceId">;

export type EntityIdPrefix =
  | "enterprise"
  | "nursing-home"
  | "ward"
  | "room"
  | "bed"
  | "bed-assignment"
  | "admission"
  | "absence-episode"
  | "resident"
  | "staff-member"
  | "user-account"
  | "employment-record"
  | "role-assignment"
  | "professional-registration"
  | "home-assignment"
  | "ward-competency"
  | "roster-assignment"
  | "permission-grant"
  | "role-template"
  | "audit-record"
  | "operational-context"
  | "shift"
  | "assessment"
  | "observation"
  | "care-plan"
  | "care-plan-item"
  | "care-action"
  | "review"
  | "task"
  | "alert"
  | "risk"
  | "incident"
  | "handover";
// Domain events intentionally use a hyphenated prefix outside clinical entity IDs.

const randomSegment = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  const values = new Uint32Array(4);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(values);
  } else {
    values.forEach((_, index) => {
      values[index] = Math.floor((Date.now() + index) * 2654435761) >>> 0;
    });
  }
  return Array.from(values, (value) => value.toString(36).padStart(7, "0")).join("-");
};

export function createEntityId(entityType: EntityIdPrefix): string {
  return `${entityType}-${randomSegment()}`;
}

export const asEnterpriseId = (value: string) => value as EnterpriseId;
export const asNursingHomeId = (value: string) => value as NursingHomeId;
export const asWardId = (value: string) => value as WardId;
export const asRoomId = (value: string) => value as RoomId;
export const asBedId = (value: string) => value as BedId;
export const asBedAssignmentId = (value: string) => value as BedAssignmentId;
export const asAdmissionId = (value: string) => value as AdmissionId;
export const asAbsenceEpisodeId = (value: string) => value as AbsenceEpisodeId;
export const asStaffMemberId = (value: string) => value as StaffMemberId;
export const asUserAccountId = (value: string) => value as UserAccountId;
export const asEmploymentRecordId = (value: string) => value as EmploymentRecordId;
export const asRoleAssignmentId = (value: string) => value as RoleAssignmentId;
export const asProfessionalRegistrationId = (value: string) => value as ProfessionalRegistrationId;
export const asHomeAssignmentId = (value: string) => value as HomeAssignmentId;
export const asWardCompetencyId = (value: string) => value as WardCompetencyId;
export const asRosterAssignmentId = (value: string) => value as RosterAssignmentId;
export const asPermissionGrantId = (value: string) => value as PermissionGrantId;
export const asRoleTemplateId = (value: string) => value as RoleTemplateId;
export const asAuditRecordId = (value: string) => value as AuditRecordId;
export const asOperationalContextId = (value: string) => value as OperationalContextId;
export const asShiftId = (value: string) => value as ShiftId;
export const asDomainEventId = (value: string) => value as DomainEventId;

export const createEnterpriseId = () => createEntityId("enterprise") as EnterpriseId;
export const createNursingHomeId = () => createEntityId("nursing-home") as NursingHomeId;
export const createWardId = () => createEntityId("ward") as WardId;
export const createRoomId = () => createEntityId("room") as RoomId;
export const createBedId = () => createEntityId("bed") as BedId;
export const createBedAssignmentId = () => createEntityId("bed-assignment") as BedAssignmentId;
export const createAdmissionId = () => createEntityId("admission") as AdmissionId;
export const createAbsenceEpisodeId = () => createEntityId("absence-episode") as AbsenceEpisodeId;
export const createStaffMemberId = () => createEntityId("staff-member") as StaffMemberId;
export const createUserAccountId = () => createEntityId("user-account") as UserAccountId;
export const createEmploymentRecordId = () => createEntityId("employment-record") as EmploymentRecordId;
export const createRoleAssignmentId = () => createEntityId("role-assignment") as RoleAssignmentId;
export const createProfessionalRegistrationId = () => createEntityId("professional-registration") as ProfessionalRegistrationId;
export const createHomeAssignmentId = () => createEntityId("home-assignment") as HomeAssignmentId;
export const createWardCompetencyId = () => createEntityId("ward-competency") as WardCompetencyId;
export const createRosterAssignmentId = () => createEntityId("roster-assignment") as RosterAssignmentId;
export const createPermissionGrantId = () => createEntityId("permission-grant") as PermissionGrantId;
export const createRoleTemplateId = () => createEntityId("role-template") as RoleTemplateId;
export const createAuditRecordId = () => createEntityId("audit-record") as AuditRecordId;
export const createOperationalContextId = () => createEntityId("operational-context") as OperationalContextId;
export const createShiftId = () => createEntityId("shift") as ShiftId;
export const createDomainEventId = () => `domain-event-${randomSegment()}` as DomainEventId;
