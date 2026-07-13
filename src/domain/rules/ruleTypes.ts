import type {
  DomainEventId,
  EnterpriseId,
  NursingHomeId,
  ResidentId,
  StaffMemberId,
  UserAccountId,
  WardId,
} from "@/types/entityIds";
import type { DomainEvent, DomainEventType } from "@/domain/events/eventTypes";

export type RuleStatus = "draft" | "pending_clinical_approval" | "active" | "suspended" | "retired";
export type RuleSeverity = "information" | "low" | "medium" | "high" | "critical";
export type RuleCategory =
  | "observation"
  | "deterioration"
  | "weight"
  | "assessment"
  | "care_plan"
  | "care_action"
  | "medication"
  | "incident"
  | "daily_care"
  | "handover"
  | "admission"
  | "other";

export type RuleDataProvider =
  | "resident"
  | "observations"
  | "weights"
  | "assessments"
  | "care_plans"
  | "care_actions"
  | "medication_events"
  | "incidents"
  | "daily_care"
  | "tasks"
  | "other";

export type RuleOutputType =
  | "clinical_alert"
  | "recommendation"
  | "review_requirement"
  | "follow_up_task"
  | "risk_create_or_update"
  | "care_plan_coverage_gap"
  | "dashboard_signal"
  | "report_flag";

export type RuleDecisionStatus = "matched" | "not_matched" | "insufficient_data" | "suppressed" | "error";
export type RuleProcessingStatus = "completed" | "failed" | "skipped_duplicate" | "dead_letter";
export type RuleGeneratedOutputStatus = "active" | "resolved" | "dismissed" | "superseded";
export type RuleIssueStatus = "open" | "acknowledged" | "escalated" | "resolved" | "dismissed";
export type RuleIssueEpisodeStatus = "active" | "closed";
export type RuleIssueTransitionType = "opened" | "acknowledged" | "escalated" | "resolved" | "dismissed" | "reopened";
export type RuleResolutionMode = "manual_only" | "automatic_when_not_matched" | "automatic_on_specific_event" | "hybrid";
export type RuleRecalculationStatus = "queued" | "dry_run_completed" | "applying" | "completed" | "completed_with_errors" | "cancelled" | "failed";
export type RuleRecalculationItemStatus = "queued" | "evaluated" | "applied" | "skipped" | "failed";

export interface RuleDataRequirement {
  key: string;
  provider: RuleDataProvider;
  timeWindow?: {
    amount: number;
    unit: "minutes" | "hours" | "days" | "weeks" | "months";
  };
  required: boolean;
}

export interface RuleOutputDefinition {
  outputType: RuleOutputType;
  outputCode: string;
  requiresHumanConfirmation: boolean;
  deduplicationScope: RuleDeduplicationStrategy["scope"];
  clinicalJudgementRequired: boolean;
  resolutionPolicy?: RuleResolutionPolicy;
  requiresReacknowledgementOnEscalation?: boolean;
}

export interface RuleResolutionPolicy {
  mode: RuleResolutionMode;
  resolutionEventTypes?: string[];
  requireEvidenceCodes?: string[];
  approvedAutomaticResolution?: boolean;
}

export interface RuleClinicalApproval {
  status: "not_required" | "pending" | "approved" | "rejected";
  approvedByStaffMemberId?: StaffMemberId | string;
  approvedAt?: string;
  approvalReference?: string;
  notes?: string;
}

export interface RuleDefinition<TConfig = unknown> {
  id: string;
  version: number;
  name: string;
  description: string;
  status: RuleStatus;
  category: RuleCategory;
  triggerEventTypes: DomainEventType[];
  nursingHomeId?: NursingHomeId | string;
  severity: RuleSeverity;
  configuration: TConfig;
  requiredData: RuleDataRequirement[];
  outputDefinitions: RuleOutputDefinition[];
  effectiveFrom?: string;
  effectiveTo?: string;
  clinicalApproval?: RuleClinicalApproval;
  explanationTemplate: RuleExplanationTemplate;
  createdAt: string;
  createdBy?: UserAccountId | string;
  activatedAt?: string;
  retiredAt?: string;
  supersedesRuleVersion?: number;
  baseRuleId?: string;
  exclusiveScope?: "global" | "nursing_home";
}

export interface RuleExplanationTemplate {
  whatHappened: string;
  threshold: string;
  sourceRecords: string;
  recommendedAction: string;
}

export interface RuleEvaluationInput<TEvent = DomainEvent<string, unknown>> {
  event: TEvent;
  rule: RuleDefinition;
  context: {
    enterpriseId?: EnterpriseId | string;
    nursingHomeId: NursingHomeId | string;
    wardId?: WardId | string;
    residentId?: ResidentId | string;
    timezone: string;
  };
  sourceRecords: RuleSourceRecord[];
  evaluatedAt: string;
  simulation?: boolean;
}

export interface RuleSourceRecord<TRecord = unknown> {
  key: string;
  provider: RuleDataProvider;
  recordType: string;
  recordId: string;
  nursingHomeId: NursingHomeId | string;
  residentId?: ResidentId | string;
  observedAt?: string;
  effectiveAt?: string;
  record: TRecord;
  missing?: boolean;
  missingReason?: string;
}

export interface RuleSourceReference {
  key: string;
  provider: RuleDataProvider;
  recordType: string;
  recordId: string;
  nursingHomeId: NursingHomeId | string;
  residentId?: ResidentId | string;
  observedAt?: string;
  effectiveAt?: string;
}

export interface RuleConditionResult {
  conditionId: string;
  description: string;
  actualValue?: unknown;
  operator?:
    | "equals"
    | "not_equals"
    | "greater_than"
    | "greater_than_or_equal"
    | "less_than"
    | "less_than_or_equal"
    | "within"
    | "outside"
    | "count_at_least"
    | "changed"
    | "exists"
    | "missing";
  thresholdValue?: unknown;
  unit?: string;
  matched: boolean;
}

export interface RuleDeduplicationStrategy {
  strategy: "none" | "source_event" | "active_issue";
  scope: "event" | "resident" | "resident_and_code" | "resident_domain" | "home";
  includeRuleId?: boolean;
  episodePolicy?: "update_active" | "new_after_resolved" | "merge_by_precedence";
}

export interface ProposedRuleOutput {
  outputType: RuleOutputType;
  outputCode: string;
  severity: RuleSeverity;
  title: string;
  summary: string;
  recommendedActionCodes?: string[];
  requiresHumanConfirmation: boolean;
  deduplicationStrategy: RuleDeduplicationStrategy;
  deduplicationKey: string;
  expiresAfter?: {
    amount: number;
    unit: "minutes" | "hours" | "days";
  };
}

export interface RuleExplanation {
  whatHappened: string;
  thresholdOrCondition: string;
  sourceSummary: string;
  recommendedAction: string;
  clinicalSummary: string;
  technicalTrace: {
    ruleId: string;
    ruleVersion: number;
    sourceEventId: DomainEventId | string;
    correlationId?: string;
    deduplicationKeys: string[];
  };
  permissionRestrictedTechnical: boolean;
}

export interface RuleEvaluationResult {
  decisionId: string;
  ruleId: string;
  ruleVersion: number;
  sourceEventId: DomainEventId | string;
  status: RuleDecisionStatus;
  severity?: RuleSeverity;
  evaluatedAt: string;
  residentId?: ResidentId | string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  matchedConditions: RuleConditionResult[];
  sourceRecordReferences: RuleSourceReference[];
  proposedOutputs: ProposedRuleOutput[];
  explanation: RuleExplanation;
  suppressionReason?: string;
  errorCode?: string;
}

export interface RuleProcessingReceipt {
  id: string;
  ruleId: string;
  ruleVersion: number;
  sourceEventId: DomainEventId | string;
  status: RuleProcessingStatus;
  startedAt: string;
  completedAt?: string;
  attempt: number;
  error?: string;
}

export interface RuleGeneratedOutput {
  id: string;
  ruleId: string;
  ruleVersion: number;
  decisionId: string;
  sourceEventId: DomainEventId | string;
  outputType: RuleOutputType;
  outputCode: string;
  title: string;
  summary: string;
  severity: RuleSeverity;
  nursingHomeId: NursingHomeId | string;
  residentId?: ResidentId | string;
  wardId?: WardId | string;
  deduplicationKey: string;
  status: RuleGeneratedOutputStatus;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  sourceRecordReferences: RuleSourceReference[];
  explanation: RuleExplanation;
  occurrenceCount: number;
}

export interface RuleOverride {
  id: string;
  ruleId: string;
  ruleVersion?: number;
  nursingHomeId: NursingHomeId | string;
  residentId?: ResidentId | string;
  reason: string;
  createdAt: string;
  createdBy: UserAccountId | string;
  expiresAt?: string;
}

export interface RuleSuppression {
  id: string;
  ruleId: string;
  ruleVersion?: number;
  sourceEventId?: DomainEventId | string;
  nursingHomeId: NursingHomeId | string;
  residentId?: ResidentId | string;
  reason: string;
  createdAt: string;
  createdBy: UserAccountId | string;
  expiresAt?: string;
}

export interface RuleIssue {
  id: string;
  issueCode: string;
  outputType: RuleOutputType | "risk";
  residentId?: ResidentId | string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  ruleId: string;
  currentRuleVersion: number;
  deduplicationKey: string;
  status: RuleIssueStatus;
  episodeStatus: RuleIssueEpisodeStatus;
  severity: RuleSeverity;
  title: string;
  summary: string;
  firstOpenedAt: string;
  lastMatchedAt: string;
  lastEvaluatedAt: string;
  occurrenceCount: number;
  acknowledgedAt?: string;
  acknowledgedByUserAccountId?: UserAccountId | string;
  acknowledgedByStaffMemberId?: StaffMemberId | string;
  acknowledgementNote?: string;
  escalatedAt?: string;
  escalatedByUserAccountId?: UserAccountId | string;
  escalationLevel?: number;
  escalationReason?: string;
  previousSeverity?: RuleSeverity;
  resolvedAt?: string;
  resolvedByUserAccountId?: UserAccountId | string;
  resolvedByStaffMemberId?: StaffMemberId | string;
  resolutionCode?: string;
  resolutionReason?: string;
  dismissedAt?: string;
  dismissedByUserAccountId?: UserAccountId | string;
  dismissedByStaffMemberId?: StaffMemberId | string;
  dismissalCode?: string;
  dismissalReason?: string;
  dismissalExpiresAt?: string;
  dismissalScope?: "current_event_only" | "current_episode" | "until_date" | "until_source_changes" | "permanent_for_rule_version";
  reopenedAt?: string;
  reopenedReason?: string;
  currentEpisodeId: string;
  previousIssueEpisodeId?: string;
  currentExplanation: RuleExplanation;
  sourceEventIds: (DomainEventId | string)[];
  sourceRecordReferences: RuleSourceReference[];
  latestRuleDecisionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleIssueEpisode {
  id: string;
  ruleIssueId: string;
  episodeNumber: number;
  episodeStatus: RuleIssueEpisodeStatus;
  openedAt: string;
  closedAt?: string;
  openingDecisionId: string;
  closingDecisionId?: string;
  closingStatus?: "resolved" | "dismissed";
  previousEpisodeId?: string;
}

export interface RuleIssueTransition {
  id: string;
  ruleIssueId: string;
  episodeId?: string;
  fromStatus?: RuleIssueStatus;
  toStatus: RuleIssueStatus;
  transitionType: RuleIssueTransitionType;
  occurredAt: string;
  actorType: "user" | "system" | "rule" | "migration";
  userAccountId?: UserAccountId | string;
  staffMemberId?: StaffMemberId | string;
  ruleDecisionId?: string;
  sourceEventId?: DomainEventId | string;
  reasonCode?: string;
  reasonText?: string;
  metadata?: Record<string, unknown>;
}

export interface RuleIssueActionContext {
  userAccountId: UserAccountId | string;
  staffMemberId?: StaffMemberId | string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  capabilities: string[];
  occurredAt: string;
}

export interface RuleRecalculationRequest {
  id: string;
  status: RuleRecalculationStatus;
  mode: "dry_run" | "apply";
  reasonCode: string;
  reasonText: string;
  nursingHomeId: NursingHomeId | string;
  residentId?: ResidentId | string;
  ruleId?: string;
  ruleVersion?: number;
  sourceEventIds?: (DomainEventId | string)[];
  dateRange?: { from: string; to: string };
  requestedAt: string;
  requestedByUserAccountId: UserAccountId | string;
  approvedAt?: string;
  approvedByUserAccountId?: UserAccountId | string;
  correlationId: string;
  dryRunRequired: boolean;
  dryRunRequestId?: string;
  ruleConfigurationHash: string;
  sourceDataHash: string;
  summary: RuleRecalculationSummary;
}

export interface RuleRecalculationItem {
  id: string;
  requestId: string;
  ruleId: string;
  ruleVersion: number;
  sourceEventId?: DomainEventId | string;
  syntheticInputId?: string;
  residentId?: ResidentId | string;
  nursingHomeId: NursingHomeId | string;
  eventSchemaVersion?: number;
  rulesEngineVersion: string;
  sourceDataHash: string;
  status: RuleRecalculationItemStatus;
  evaluatedAt?: string;
  decisionId?: string;
  error?: string;
}

export interface RuleRecalculationSummary {
  requestId: string;
  totalItems: number;
  evaluated: number;
  skipped: number;
  failed: number;
  issueOpened: number;
  issueUpdated: number;
  issueEscalated: number;
  issueResolved: number;
  issueReopened: number;
  dismissalPreserved: number;
  noChange: number;
  insufficientData: number;
  byRule: Record<string, { evaluated: number; matched: number; failed: number }>;
  byNursingHome?: Record<string, number>;
  warnings: string[];
}

export interface RuleEngineState {
  ruleDefinitions?: RuleDefinition[];
  ruleDecisions?: RuleEvaluationResult[];
  ruleProcessingReceipts?: RuleProcessingReceipt[];
  ruleGeneratedOutputs?: RuleGeneratedOutput[];
  ruleIssues?: RuleIssue[];
  ruleIssueEpisodes?: RuleIssueEpisode[];
  ruleIssueTransitions?: RuleIssueTransition[];
  ruleRecalculationRequests?: RuleRecalculationRequest[];
  ruleRecalculationItems?: RuleRecalculationItem[];
  ruleOverrides?: RuleOverride[];
  ruleSuppressions?: RuleSuppression[];
  eventStore?: { eventId: DomainEventId | string; event: DomainEvent<string, unknown> }[];
  [key: string]: unknown;
}
