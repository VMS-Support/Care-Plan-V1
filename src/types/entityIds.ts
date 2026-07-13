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

export const createEnterpriseId = () => createEntityId("enterprise") as EnterpriseId;
export const createNursingHomeId = () => createEntityId("nursing-home") as NursingHomeId;
export const createWardId = () => createEntityId("ward") as WardId;
export const createRoomId = () => createEntityId("room") as RoomId;
export const createBedId = () => createEntityId("bed") as BedId;
export const createBedAssignmentId = () => createEntityId("bed-assignment") as BedAssignmentId;
export const createAdmissionId = () => createEntityId("admission") as AdmissionId;
export const createAbsenceEpisodeId = () => createEntityId("absence-episode") as AbsenceEpisodeId;
