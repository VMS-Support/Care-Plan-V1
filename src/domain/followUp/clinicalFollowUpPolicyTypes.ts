import type { ObservationSetType, ObservationType } from "@/domain/observations/observationTypes";
import type { RuleExplanation } from "@/domain/rules/ruleTypes";
import type { WorkPriority, WorkType } from "@/domain/work";
import type { EnterpriseId, NursingHomeId, StaffMemberId, TeamId, UserAccountId } from "@/types/entityIds";
import type { DeteriorationIssueType, DeteriorationSeverity, DeteriorationSourceReference } from "@/domain/deterioration/deteriorationIssueTypes";

export type FollowUpSourceType = "news2" | "post_fall" | "infection" | "diabetes" | "post_hospital_return" | "clinician_request" | "stop_and_watch";

export interface ClinicalFollowUpPolicy {
  id: string;
  name: string;
  version: number;
  sourceType: FollowUpSourceType;
  status: "draft" | "approved" | "retired";
  nursingHomeId?: NursingHomeId | string;
  enterpriseId?: EnterpriseId | string;
  effectiveFrom: string;
  effectiveTo?: string;
  triggerRules: ClinicalFollowUpTriggerRule[];
  workDefinitions: ClinicalFollowUpWorkDefinition[];
  escalationRules: ClinicalFollowUpEscalationRule[];
  resolutionPolicy: ClinicalFollowUpResolutionPolicy;
  sourcePolicyDocumentId?: string;
  approvedByUserAccountId?: UserAccountId | string;
  approvedByStaffMemberId?: StaffMemberId | string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalFollowUpTriggerRule {
  id: string;
  sourceEventTypes: string[];
  sourceConditionCode?: string;
  minimumSeverity?: DeteriorationSeverity;
  triggerRuleDecisionCodes?: string[];
  requiredSourceFields?: string[];
  issueType: DeteriorationIssueType;
  createOrUpdateIssue: boolean;
  issueSeverity: "inherit" | DeteriorationSeverity;
  deduplicationMode: "single_active_episode" | "per_source_event" | "time_window" | "per_protocol_occurrence";
  deduplicationWindowMinutes?: number;
}

export interface ClinicalFollowUpWorkDefinition {
  id: string;
  actionCode: string;
  titleTemplate: string;
  workType: WorkType;
  requiredObservationSetType?: ObservationSetType;
  requiredObservationTypes?: ObservationType[];
  dueOffsetMinutes?: number;
  dueFrom: "source_observed_time" | "source_recorded_time" | "issue_opened_time" | "manual_selected_time";
  priority: WorkPriority;
  assignmentPolicy: "ward_queue" | "role_queue" | "team" | "named_person" | "unassigned";
  assignedRoleKey?: string;
  assignedTeamId?: TeamId | string;
  completionEvidence: "observation_record" | "assessment_record" | "clinical_review" | "escalation_record" | "referral_record" | "hospital_transfer_record" | "manual_confirmation";
  deduplicationMode: "single_active_per_issue" | "single_active_per_action" | "per_protocol_step" | "per_source_event";
  requiredCapabilities?: string[];
  createWhenIssueSeverityAtLeast?: DeteriorationSeverity;
}

export interface ClinicalFollowUpEscalationRule {
  id: string;
  when: "on_match" | "when_overdue" | "after_acknowledgement_delay" | "manual";
  severityAtLeast?: DeteriorationSeverity;
  targetRoleKey?: string;
  requiredDocumentation: boolean;
}

export interface ClinicalFollowUpResolutionPolicy {
  mode: "manual_only" | "after_all_work_completed" | "after_evidence_and_review";
  requiredEvidence?: ClinicalFollowUpWorkDefinition["completionEvidence"][];
  allowDismissalWithReason: boolean;
}

export interface ClinicalFollowUpSourceEvent {
  id: string;
  sourceType: FollowUpSourceType;
  eventType: string;
  conditionCode?: string;
  ruleDecisionCodes?: string[];
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  roomId?: string;
  observedAt?: string;
  recordedAt: string;
  severity: DeteriorationSeverity;
  title: string;
  conciseSummary: string;
  sourceReference: DeteriorationSourceReference;
  ruleDecisionId?: string;
  ruleIssueId?: string;
  manualDueAt?: string;
  rltDomainIds?: string[];
  fields?: Record<string, unknown>;
}

export interface ClinicalFollowUpDecision {
  status: "matched" | "not_matched" | "policy_unavailable" | "insufficient_data" | "suppressed";
  issueDecision?: {
    create: boolean;
    updateExisting: boolean;
    issueType: DeteriorationIssueType;
    severity: DeteriorationSeverity;
    deduplicationKey: string;
  };
  workDecisions: Array<{
    actionCode: string;
    create: boolean;
    updateExisting: boolean;
    dueAt?: string;
    priority: WorkPriority;
    assignmentPolicy: ClinicalFollowUpWorkDefinition["assignmentPolicy"];
    workType: WorkType;
    completionEvidence: ClinicalFollowUpWorkDefinition["completionEvidence"];
    deduplicationKey: string;
    title: string;
    requiredObservationSetType?: ObservationSetType;
    requiredObservationTypes?: ObservationType[];
    assignedRoleKey?: string;
    assignedTeamId?: string;
  }>;
  escalationRecommended: boolean;
  explanation: RuleExplanation;
  policyId?: string;
  policyVersion?: number;
}
