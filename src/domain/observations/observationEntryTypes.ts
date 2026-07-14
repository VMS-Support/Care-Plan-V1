import type { ObservationComponent, ObservationSetType, ObservationSourceReference, ObservationType } from "./observationTypes";

export type ObservationEntrySourceType = "resident_profile" | "work_item" | "care_plan" | "incident" | "hospital_return" | "doctor_request" | "clinical_rule" | "observation_schedule" | "manual";

export interface ObservationEntryLaunchContext {
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  roomId?: string;
  bedId?: string;
  observationSetType?: ObservationSetType;
  requestedObservationTypes?: ObservationType[];
  sourceType: ObservationEntrySourceType;
  sourceEntityType?: string;
  sourceEntityId?: string;
  sourceLabel?: string;
  requestReason?: string;
  workItemId?: string;
  observationScheduleId?: string;
  ruleIssueId?: string;
  ruleDecisionId?: string;
  requestedDueAt?: string;
  returnRoute?: string;
}

export type BackdatedEntryReason = "clinical_care_took_priority" | "system_unavailable" | "entered_from_paper_record" | "recorded_by_another_staff_member" | "late_information_received" | "correction" | "other";

export interface RecordResidentObservationsCommand {
  clientRequestId: string;
  launchContext: ObservationEntryLaunchContext;
  observedAt: string;
  recordedAt: string;
  timezone: string;
  observedByStaffMemberId?: string;
  recordedByStaffMemberId?: string;
  recordedByUserAccountId: string;
  observationSetType: ObservationSetType;
  components: ObservationComponent[];
  notes?: string;
  backdatedEntryReason?: BackdatedEntryReason;
  backdatedEntryOtherReason?: string;
  escalation?: ObservationEscalationInput;
}

export type ObservationEscalationStatus = "not_required" | "required" | "initiated" | "completed" | "declined_with_reason" | "unable_to_complete";
export type ObservationEscalationTarget = "nurse_in_charge" | "cnm" | "don" | "gp" | "out_of_hours_gp" | "emergency_services" | "palliative_care" | "other";

export interface ObservationEscalationInput {
  status: ObservationEscalationStatus;
  reason: string;
  recommendedTargets: ObservationEscalationTarget[];
  selectedTargets: ObservationEscalationTarget[];
  outcome?: string;
  followUpRequired: boolean;
  followUpAt?: string;
}

export interface ObservationEscalation extends ObservationEscalationInput {
  id: string;
  observationRecordId: string;
  initiatedAt?: string;
  completedAt?: string;
  initiatedByUserAccountId?: string;
  initiatedByStaffMemberId?: string;
  relatedWorkItemIds: string[];
  sourceRuleDecisionIds: string[];
  sourceRuleIssueIds: string[];
}

export interface ObservationEntrySaveResult {
  observationRecordId: string;
  duplicate: boolean;
  sourceWorkItemCompleted: boolean;
  followUpRequested: boolean;
  returnRoute?: string;
}

export function sourceReferenceFromLaunch(context: ObservationEntryLaunchContext): ObservationSourceReference {
  const type = context.sourceType === "work_item" || context.workItemId ? "work_item" : context.sourceType === "clinical_rule" ? "rule_issue" : context.sourceType === "manual" || context.sourceType === "resident_profile" ? "direct_entry" : context.sourceType === "care_plan" ? "care_plan" : context.sourceType === "incident" ? "incident" : "direct_entry";
  return { type, id: context.sourceEntityId ?? context.workItemId, label: context.sourceLabel, route: context.returnRoute };
}
