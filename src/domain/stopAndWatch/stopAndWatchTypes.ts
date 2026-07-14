export type StopAndWatchConcernCode =
  | "seems_different"
  | "talks_or_communicates_less"
  | "overall_needs_more_help"
  | "pain_or_discomfort"
  | "ate_or_drank_less"
  | "toilet_pattern_changed"
  | "breathing_changed"
  | "skin_or_colour_changed"
  | "sleep_or_drowsiness_changed"
  | "walking_transfer_changed"
  | "confused_or_agitated"
  | "other";

export interface StopAndWatchSubmission {
  id: string;
  clientRequestId: string;
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  observedAt: string;
  submittedAt: string;
  submittedByUserAccountId: string;
  submittedByStaffMemberId?: string;
  concernCodes: StopAndWatchConcernCode[];
  immediateSafetyConcern: boolean;
  conciseFreeText?: string;
  status: "submitted" | "acknowledged" | "reviewed" | "escalated" | "resolved" | "dismissed";
  deteriorationIssueId?: string;
  rltDomainIds: string[];
  acknowledgedAt?: string;
  acknowledgedByUserAccountId?: string;
  reviewedAt?: string;
  reviewedByUserAccountId?: string;
  reviewOutcome?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StopAndWatchEvent {
  id: string;
  type: "StopAndWatchSubmitted" | "StopAndWatchAcknowledged" | "StopAndWatchReviewed" | "StopAndWatchEscalated" | "StopAndWatchResolved";
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  submissionId: string;
  issueId?: string;
  occurredAt: string;
  actorUserAccountId?: string;
  correlationId: string;
  payload: Record<string, unknown>;
}

export interface StopAndWatchRepository {
  stopAndWatchSubmissions: StopAndWatchSubmission[];
  stopAndWatchEvents: StopAndWatchEvent[];
}

export interface StopAndWatchActionContext {
  userAccountId: string;
  staffMemberId?: string;
  capabilities: string[];
  occurredAt: string;
  correlationId: string;
}
