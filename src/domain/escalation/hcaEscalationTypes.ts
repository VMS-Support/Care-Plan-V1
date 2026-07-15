import type { DeteriorationIssueRepository } from "@/domain/deterioration/deteriorationIssueTypes";
import type { WorkProjectionState } from "@/domain/work";
import type { AuditRecord } from "@/lib/care/types";
import type { NursingHomeId, ResidentId, RoomId, StaffMemberId, UserAccountId, WardId, WorkItemId } from "@/types/entityIds";
import type { DailyCareTrendType } from "@/domain/dailyCare/trends";

export type HcaEscalationReasonCode =
  | "resident_seems_different"
  | "reduced_food_intake"
  | "reduced_fluid_intake"
  | "no_bowel_movement"
  | "repeated_refusal"
  | "increased_assistance"
  | "sleep_change"
  | "behaviour_change"
  | "pain_or_discomfort"
  | "skin_concern"
  | "mobility_or_safety_concern"
  | "breathing_concern"
  | "immediate_safety_concern"
  | "other";

export interface HcaNurseEscalation {
  id: string;
  residentId: ResidentId | string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  roomId?: RoomId | string;
  reasonCode: HcaEscalationReasonCode;
  conciseConcern: string;
  shortNote?: string;
  observedAt: string;
  escalatedAt: string;
  immediateSafetyConcern: boolean;
  sourceDailyCareRecordIds: string[];
  sourceTrendType?: DailyCareTrendType;
  sourceDeteriorationIssueId?: string;
  escalatedByUserAccountId: UserAccountId | string;
  escalatedByStaffMemberId?: StaffMemberId | string;
  targetAssignment: "ward_nurse_queue" | "nurse_role_queue" | "cnm_queue" | "named_nurse";
  targetStaffMemberId?: StaffMemberId | string;
  status: "submitted" | "acknowledged" | "under_review" | "completed" | "dismissed";
  nurseReviewWorkItemId?: WorkItemId | string;
  clientRequestId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitHcaNurseEscalationCommand {
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  roomId?: string;
  reasonCode: HcaEscalationReasonCode;
  conciseConcern?: string;
  shortNote?: string;
  observedAt: string;
  immediateSafetyConcern: boolean;
  sourceDailyCareRecordIds?: string[];
  sourceTrendType?: DailyCareTrendType;
  sourceDeteriorationIssueId?: string;
  targetAssignment?: HcaNurseEscalation["targetAssignment"];
  targetStaffMemberId?: string;
  clientRequestId: string;
}

export interface HcaEscalationOperationalContext {
  nursingHomeId: string;
  wardId?: string;
  timezone: string;
  occurredAt: string;
  correlationId: string;
}

export interface HcaEscalationAuthorizationContext {
  userAccountId: string;
  staffMemberId?: string;
  residentIds?: string[];
  authorisedNursingHomeIds: string[];
  authorisedWardIds?: string[];
  capabilities: string[];
}

export interface HcaEscalationEvent {
  id: string;
  type: "HcaEscalationSubmitted" | "HcaEscalationAcknowledged" | "HcaEscalationReviewStarted" | "HcaEscalationCompleted" | "HcaEscalationDismissed";
  escalationId: string;
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  occurredAt: string;
  actorUserAccountId?: string;
  correlationId: string;
  payload: Record<string, unknown>;
}

export interface HcaEscalationRepository extends DeteriorationIssueRepository, WorkProjectionState {
  hcaNurseEscalations: HcaNurseEscalation[];
  hcaEscalationEvents: HcaEscalationEvent[];
  hcaEscalationAuditRecords: AuditRecord[];
  dailyCareRecords: Array<{ id: string; residentId: string | ResidentId; nursingHomeId: string | NursingHomeId; careType: string; outcome?: string; occurredAt: string; rltDomainIds?: string[] }>;
}

export const HCA_ESCALATION_REASON_LABELS: Record<HcaEscalationReasonCode, string> = {
  resident_seems_different: "Resident seems different",
  reduced_food_intake: "Reduced food intake",
  reduced_fluid_intake: "Reduced fluid intake",
  no_bowel_movement: "No bowel movement",
  repeated_refusal: "Repeated refusal",
  increased_assistance: "Increased assistance",
  sleep_change: "Sleep change",
  behaviour_change: "Behaviour change",
  pain_or_discomfort: "Pain or discomfort",
  skin_concern: "Skin concern",
  mobility_or_safety_concern: "Mobility or safety concern",
  breathing_concern: "Breathing concern",
  immediate_safety_concern: "Immediate safety concern",
  other: "Other concern",
};
