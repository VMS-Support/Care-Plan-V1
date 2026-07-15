import type { AuditRecord } from "@/lib/care/types";
import type { DomainEvent } from "@/domain/events/eventTypes";
import type { WorkProjectionState } from "@/domain/work";
import type { BedId, CareActionId, CarePlanId, CarePlanItemId, NursingHomeId, ResidentId, RoomId, ShiftId, StaffMemberId, UserAccountId, WardId, WorkItemId } from "@/types/entityIds";
import type { RltDomainId } from "@/lib/care/rlt";
import type { DailyCareDetails } from "./dailyCareDetails";

export type DailyCareType =
  | "personal_care" | "dressing" | "oral_care" | "toileting" | "continence"
  | "repositioning" | "food" | "fluids" | "mobility" | "comfort" | "sleep"
  | "mood" | "behaviour" | "activity" | "refusal" | "skin_observation";

export type DailyCareStatus = "completed" | "partially_completed" | "declined" | "not_required" | "unable_to_complete" | "entered_in_error" | "corrected";
export type DailyCareParticipationLevel = "independent" | "with_prompting" | "with_supervision" | "with_assistance" | "fully_supported" | "not_applicable" | "not_recorded";
export type DailyCareSourceType = "manual" | "care_plan" | "care_action" | "work_item" | "daily_routine" | "handover" | "hospital_return" | "clinical_rule" | "other";

export interface DailyCareSourceReference {
  sourceType: DailyCareSourceType;
  sourceEntityType?: string;
  sourceEntityId?: string;
  sourceOccurrenceId?: string;
  route?: string;
}

export interface DailyCareRecord {
  id: string;
  clientRequestId: string;
  residentId: ResidentId | string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  roomId?: RoomId | string;
  bedId?: BedId | string;
  careType: DailyCareType;
  occurredAt: string;
  recordedAt: string;
  deliveredByStaffMemberId?: StaffMemberId | string;
  recordedByStaffMemberId?: StaffMemberId | string;
  recordedByUserAccountId: UserAccountId | string;
  shiftId?: ShiftId | string;
  status: DailyCareStatus;
  participationLevel: DailyCareParticipationLevel;
  statusReason?: string;
  supportProvided?: string[];
  residentResponse?: string;
  outcomeSummary?: string;
  notes?: string;
  details: DailyCareDetails;
  rltDomainIds: RltDomainId[];
  source: DailyCareSourceReference;
  relatedCarePlanId?: CarePlanId | string;
  relatedCarePlanItemId?: CarePlanItemId | string;
  relatedCareActionId?: CareActionId | string;
  relatedWorkItemId?: WorkItemId | string;
  followUpRequired: boolean;
  followUpReason?: string;
  followUpWorkItemIds: (WorkItemId | string)[];
  correctionOfDailyCareRecordId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordDailyCareCommand {
  residentId: ResidentId | string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  roomId?: RoomId | string;
  bedId?: BedId | string;
  careType: DailyCareType;
  occurredAt: string;
  deliveredByStaffMemberId?: StaffMemberId | string;
  status: DailyCareStatus;
  statusReason?: string;
  participationLevel: DailyCareParticipationLevel;
  supportProvided?: string[];
  residentResponse?: string;
  outcomeSummary?: string;
  notes?: string;
  details: DailyCareDetails;
  source: DailyCareSourceReference;
  relatedCarePlanId?: CarePlanId | string;
  relatedCarePlanItemId?: CarePlanItemId | string;
  relatedCareActionId?: CareActionId | string;
  relatedWorkItemId?: WorkItemId | string;
  followUpRequired: boolean;
  followUpReason?: string;
  clientRequestId: string;
}

export interface DailyCareOperationalContext {
  nursingHomeId: string;
  wardId?: string;
  roomId?: string;
  bedId?: string;
  shiftId?: string;
  timezone: string;
  recordedAt: string;
  correlationId: string;
}

export interface DailyCareAuthorizationContext {
  userAccountId: string;
  staffMemberId?: string;
  residentIds?: string[];
  authorisedNursingHomeIds: string[];
  authorisedWardIds?: string[];
  capabilities: string[];
  sourceCapabilities?: string[];
}

export interface DailyCareRepository {
  dailyCareRecords: DailyCareRecord[];
  dailyCareEvents: DailyCareDomainEvent[];
  dailyCareAuditRecords: AuditRecord[];
  workState?: WorkProjectionState;
}

export type DailyCareDomainEventType =
  | "DailyCareRecorded"
  | "DailyCarePartiallyCompleted"
  | "DailyCareDeclined"
  | "DailyCareUnableToComplete"
  | "DailyCareFollowUpRequested"
  | "DailyCareEnteredInError"
  | "DailyCareCorrected";

export interface DailyCareEventPayload {
  dailyCareRecordId: string;
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  careType: DailyCareType;
  status: DailyCareStatus;
  occurredAt: string;
  recordedAt: string;
  source: DailyCareSourceReference;
  relatedCareActionId?: string;
  relatedWorkItemId?: string;
  rltDomainIds: RltDomainId[];
  actorUserAccountId: string;
  correlationId: string;
}

export type DailyCareDomainEvent = DomainEvent<DailyCareDomainEventType, DailyCareEventPayload>;

export interface DailyCareFilters {
  careTypes?: DailyCareType[];
  statuses?: DailyCareStatus[];
  dateFrom?: string;
  dateTo?: string;
  deliveredByStaffMemberIds?: string[];
  recordedByStaffMemberIds?: string[];
  rltDomainIds?: RltDomainId[];
  sourceTypes?: DailyCareSourceType[];
  followUpRequired?: boolean;
}

export const DAILY_CARE_LABELS: Record<DailyCareType, string> = {
  personal_care: "Personal Care",
  dressing: "Dressing",
  oral_care: "Oral Care",
  toileting: "Toileting",
  continence: "Continence Care",
  repositioning: "Repositioning",
  food: "Food Intake",
  fluids: "Fluid Intake",
  mobility: "Mobility",
  comfort: "Comfort",
  sleep: "Sleep",
  mood: "Mood",
  behaviour: "Behaviour",
  activity: "Activity",
  refusal: "Care Declined",
  skin_observation: "Skin Observation",
};

export const DAILY_CARE_TYPES = Object.keys(DAILY_CARE_LABELS) as DailyCareType[];
