import type {
  DomainEventId,
  NursingHomeId,
  ResidentId,
  RoomId,
  StaffMemberId,
  UserAccountId,
  WardId,
  WorkItemId,
} from "@/types/entityIds";

export type DeteriorationIssueType =
  | "news2"
  | "observation_deterioration"
  | "temperature_trend"
  | "post_fall"
  | "infection_concern"
  | "diabetes_concern"
  | "post_hospital_return"
  | "clinician_request"
  | "stop_and_watch"
  | "weight_concern"
  | "neurological_concern"
  | "pain_concern"
  | "other";

export type DeteriorationIssueStatus =
  | "open"
  | "acknowledged"
  | "under_review"
  | "escalated"
  | "awaiting_follow_up"
  | "resolved"
  | "dismissed"
  | "reopened";

export type DeteriorationSeverity = "information" | "low" | "medium" | "high" | "critical";
export type DeteriorationSourceType =
  | "observation"
  | "news2"
  | "incident"
  | "fall"
  | "infection_monitoring"
  | "blood_glucose"
  | "hospital_return"
  | "clinician_request"
  | "stop_and_watch"
  | "assessment"
  | "care_plan"
  | "rule_decision"
  | "other";

export interface DeteriorationSourceReference {
  sourceType: DeteriorationSourceType;
  sourceEntityId: string;
  sourceEventId?: DomainEventId | string;
  occurredAt: string;
  route?: string;
  safeDisplayLabel?: string;
}

export interface DeteriorationIssue {
  id: string;
  residentId: ResidentId | string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  roomId?: RoomId | string;
  issueType: DeteriorationIssueType;
  status: DeteriorationIssueStatus;
  severity: DeteriorationSeverity;
  title: string;
  conciseSummary: string;
  openedAt: string;
  firstClinicalEventAt: string;
  latestClinicalEventAt: string;
  acknowledgedAt?: string;
  acknowledgedByUserAccountId?: UserAccountId | string;
  acknowledgedByStaffMemberId?: StaffMemberId | string;
  reviewStartedAt?: string;
  reviewStartedByUserAccountId?: UserAccountId | string;
  reviewStartedByStaffMemberId?: StaffMemberId | string;
  escalatedAt?: string;
  resolvedAt?: string;
  resolvedByUserAccountId?: UserAccountId | string;
  resolvedByStaffMemberId?: StaffMemberId | string;
  resolutionReasonCode?: string;
  resolutionSummary?: string;
  dismissedAt?: string;
  dismissedByUserAccountId?: UserAccountId | string;
  dismissalReasonCode?: string;
  dismissalReasonText?: string;
  sourceReferences: DeteriorationSourceReference[];
  latestRuleDecisionId?: string;
  ruleIssueId?: string;
  activeWorkItemIds: (WorkItemId | string)[];
  escalationRecordIds: string[];
  rltDomainIds: string[];
  deduplicationKey: string;
  episodeNumber: number;
  occurrenceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeteriorationIssueEvent {
  id: string;
  type:
    | "DeteriorationIssueOpened"
    | "DeteriorationIssueUpdated"
    | "DeteriorationIssueAcknowledged"
    | "DeteriorationReviewStarted"
    | "DeteriorationIssueEscalated"
    | "DeteriorationIssueResolved"
    | "DeteriorationIssueDismissed";
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  issueId: string;
  occurredAt: string;
  actorUserAccountId?: string;
  correlationId: string;
  payload: Record<string, unknown>;
}

export interface DeteriorationIssueRepository {
  issues: DeteriorationIssue[];
  events: DeteriorationIssueEvent[];
}

export interface DeteriorationActionContext {
  userAccountId: string;
  staffMemberId?: string;
  nursingHomeId: string;
  wardIds?: string[];
  capabilities: string[];
  occurredAt: string;
  correlationId: string;
}
