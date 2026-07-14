import type { DueTimeClassification } from "@/lib/care/dueTime";
import type { AuditRecord, OperationalContext } from "@/lib/care/types";
import type {
  DomainEventId,
  EnterpriseId,
  NursingHomeId,
  ResidentId,
  RoomId,
  ShiftId,
  StaffMemberId,
  TeamId,
  UserAccountId,
  WardId,
  WorkItemId,
  WorkAssignmentHistoryId,
  WorkExceptionId,
} from "@/types/entityIds";

export type WorkType =
  | "care_action"
  | "general_task"
  | "observation"
  | "assessment"
  | "appointment"
  | "care_plan_review"
  | "referral"
  | "documentation"
  | "handover_acknowledgement";

export type WorkPersistedStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "missed"
  | "deferred"
  | "cancelled"
  | "not_applicable";

export type WorkDisplayStatus = WorkPersistedStatus | "due_soon" | "due_now" | "overdue";
export type WorkPriority = "routine" | "important" | "urgent" | "critical";
export type ClinicalUrgency = "routine" | "time_sensitive" | "urgent_review" | "immediate";
export type WorkAssignmentType = "unassigned" | "role" | "ward" | "person" | "team";
export type WorkAssignmentStatus = "active" | "expired" | "replaced" | "cancelled";

export type WorkSourceType =
  | "care_plan"
  | "assessment"
  | "incident"
  | "doctor_request"
  | "admission"
  | "hospital_return"
  | "manual_task"
  | "clinical_rule"
  | "observation_schedule"
  | "documentation_requirement"
  | "handover"
  | "appointment"
  | "referral"
  | "maintenance"
  | "medication"
  | "training"
  | "audit"
  | "family_request";

export interface WorkSourceReference {
  sourceType: WorkSourceType;
  sourceModule:
    | "care_plans"
    | "tasks"
    | "observations"
    | "assessments"
    | "appointments"
    | "referrals"
    | "documentation"
    | "handovers"
    | "rules"
    | "other";
  sourceEntityType: string;
  sourceEntityId: string;
  sourceOccurrenceId?: string;
  parentEntityType?: string;
  parentEntityId?: string;
  createdByRuleId?: string;
  createdByRuleVersion?: number;
  sourceEventId?: DomainEventId | string;
  createdFromEventId?: DomainEventId | string;
  correlationId?: string;
  route?: string;
  completionOwner: string;
  recreationPolicy: "deterministic" | "event_replay" | "manual_only";
  createdAt: string;
}

export interface WorkSchedule {
  scheduleType: "one_off" | "recurring_occurrence" | "triggered" | "prn" | "unscheduled";
  scheduledStart?: string;
  dueAt?: string;
  scheduledEnd?: string;
  effectiveDueAt?: string;
  originalDueAt?: string;
  recurrenceId?: string;
  occurrenceIndex?: number;
  timeZone: string;
  gracePolicyId?: string;
}

export interface WorkAssignment {
  assignmentType: WorkAssignmentType;
  assignedUserAccountId?: UserAccountId | string;
  assignedStaffMemberId?: StaffMemberId | string;
  assignedRoleKey?: string;
  assignedWardId?: WardId | string;
  assignedTeamId?: TeamId | string;
  assignedAt?: string;
  assignedByUserAccountId?: UserAccountId | string;
  assignedByStaffMemberId?: StaffMemberId | string;
  assignmentReasonCode?: string;
  assignmentReasonText?: string;
  targetShiftId?: ShiftId | string;
  effectiveFrom?: string;
  effectiveTo?: string;
  assignmentStatus: WorkAssignmentStatus;
}

export interface WorkTeam {
  id: TeamId | string;
  nursingHomeId: NursingHomeId | string;
  name: string;
  teamType: "clinical" | "management" | "allied_health" | "operational" | "temporary" | "other";
  active: boolean;
  memberStaffMemberIds: (StaffMemberId | string)[];
  wardIds?: (WardId | string)[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkCompletion {
  effectiveCompletedAt: string;
  recordedAt: string;
  completedByUserAccountId?: UserAccountId | string;
  completedByStaffMemberId?: StaffMemberId | string;
  outcomeCode?: string;
  response?: string;
  wasCompletedLate: boolean;
  minutesCompletedLate?: number;
  evidenceEntityType: string;
  evidenceEntityId: string;
}

export interface WorkReasonDetails {
  reasonCode: string;
  reasonText?: string;
  occurredAt: string;
  actorId?: string;
}
export interface WorkDeferral extends WorkReasonDetails {
  originalDueAt: string;
  deferredUntil: string;
}
export type WorkCancellation = WorkReasonDetails;
export type WorkNotApplicable = WorkReasonDetails;
export interface WorkMissedDetails extends WorkReasonDetails {
  followUpRequired: boolean;
  escalationRequired: boolean;
}

export interface WorkItem {
  id: WorkItemId | string;
  workType: WorkType;
  title: string;
  summary?: string;
  source: WorkSourceReference;
  enterpriseId?: EnterpriseId | string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  roomId?: RoomId | string;
  bedId?: string;
  residentId?: ResidentId | string;
  shiftId?: ShiftId | string;
  operationalDate?: string;
  schedule: WorkSchedule;
  persistedStatus: WorkPersistedStatus;
  assignment: WorkAssignment;
  priority: WorkPriority;
  clinicalUrgency?: ClinicalUrgency;
  careContext?: {
    carePlanId?: string;
    carePlanItemId?: string;
    rltDomainId?: string;
  };
  completion?: WorkCompletion;
  deferral?: WorkDeferral;
  cancellation?: WorkCancellation;
  notApplicable?: WorkNotApplicable;
  missed?: WorkMissedDetails;
  latestException?: WorkException;
  dueTimeClassification?: DueTimeClassification;
  recommendedActions?: { code: string; label: string; route?: string }[];
  ruleContext?: {
    ruleIssueId?: string;
    ruleDecisionId?: string;
    ruleId?: string;
    ruleVersion?: number;
  };
  correlationId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserAccountId | string;
  updatedBy?: UserAccountId | string;
  schemaVersion: number;
}

export type WorkTransitionType =
  | "created"
  | "started"
  | "completed"
  | "missed"
  | "declined"
  | "deferred"
  | "cancelled"
  | "not_applicable"
  | "restored";
export interface WorkStatusTransition {
  id: string;
  workItemId: WorkItemId | string;
  fromStatus?: WorkPersistedStatus;
  toStatus: WorkPersistedStatus;
  transitionType: WorkTransitionType;
  occurredAt: string;
  actorType: "user" | "system" | "rule" | "migration";
  userAccountId?: UserAccountId | string;
  staffMemberId?: StaffMemberId | string;
  reasonCode?: string;
  reasonText?: string;
  effectiveAt?: string;
  sourceEventId?: DomainEventId | string;
  correlationId?: string;
}
export interface WorkAssignmentHistory {
  id: WorkAssignmentHistoryId | string;
  workItemId: string;
  previousAssignment?: WorkAssignment;
  newAssignment: WorkAssignment;
  transitionType:
    | "initial_assignment"
    | "assigned"
    | "claimed"
    | "reassigned"
    | "unassigned"
    | "expired"
    | "cancelled";
  occurredAt: string;
  actorType: "user" | "system" | "rule" | "migration";
  actorUserAccountId?: UserAccountId | string;
  actorStaffMemberId?: StaffMemberId | string;
  reasonCode?: string;
  reasonText?: string;
  correlationId?: string;
  sourceEventId?: DomainEventId | string;
}

export type WorkExceptionType = "deferred" | "missed" | "declined" | "not_applicable" | "cancelled";
export type WorkDeclinedByType =
  | "resident"
  | "family"
  | "staff"
  | "doctor"
  | "external_service"
  | "other";
export interface WorkException {
  id: WorkExceptionId | string;
  workItemId: WorkItemId | string;
  exceptionType: WorkExceptionType;
  reasonCode: string;
  reasonText?: string;
  effectiveAt: string;
  recordedAt: string;
  recordedByUserAccountId?: UserAccountId | string;
  recordedByStaffMemberId?: StaffMemberId | string;
  declinedByType?: WorkDeclinedByType;
  declinedByName?: string;
  followUpRequired: boolean;
  escalationRequired: boolean;
  deferredUntil?: string;
  sourceEvidenceEntityType?: string;
  sourceEvidenceEntityId?: string;
  correlationId?: string;
  sourceEventId?: DomainEventId | string;
  correctionOfExceptionId?: WorkExceptionId | string;
  correctionReason?: string;
}

export interface WorkAuthContext {
  userAccountId: string;
  staffMemberId?: string;
  roleKeys: string[];
  authorisedNursingHomeIds: string[];
  authorisedWardIds: string[];
  capabilities: string[];
  sourceCapabilities?: string[];
}

export interface WorkQueueFilters {
  workTypes?: WorkType[];
  displayStatuses?: WorkDisplayStatus[];
  persistedStatuses?: WorkPersistedStatus[];
  priorities?: WorkPriority[];
  clinicalUrgencies?: ClinicalUrgency[];
  wardIds?: string[];
  residentId?: string;
  roomIds?: string[];
  assignment?: "all" | "unassigned" | "mine" | "role" | "ward" | "team" | "person";
  assignedRoleKeys?: string[];
  assignedWardIds?: string[];
  assignedPersonIds?: string[];
  assignedTeamIds?: string[];
  exceptionTypes?: WorkExceptionType[];
  followUpRequired?: boolean;
  escalationRequired?: boolean;
  dueFrom?: string;
  dueTo?: string;
  sourceModules?: WorkSourceReference["sourceModule"][];
  sourceTypes?: WorkSourceType[];
  origin?: "rule_generated" | "manual";
  dueSections?: ("overdue" | "dueNow" | "nextHour" | "nextFourHours" | "today" | "thisShift")[];
  mode?: "active" | "history";
  now?: string;
}

export interface WorkQueueItem {
  workItemId: string;
  workType: WorkType;
  title: string;
  summary?: string;
  resident?: { id: string; name: string; displayName: string; preferredName?: string };
  nursingHomeId: string;
  ward?: { id: string; name: string };
  room?: { id?: string; label?: string };
  bed?: { id?: string; label?: string };
  originalDueAt?: string;
  effectiveDueAt?: string;
  dueAt?: string;
  displayStatus: WorkDisplayStatus;
  dueDescription?: string;
  priority: WorkPriority;
  clinicalUrgency?: ClinicalUrgency;
  source: Pick<
    WorkSourceReference,
    | "sourceType"
    | "sourceModule"
    | "sourceEntityType"
    | "sourceEntityId"
    | "sourceOccurrenceId"
    | "parentEntityType"
    | "parentEntityId"
    | "route"
  >;
  assignment: { assignmentType: WorkAssignmentType; label?: string };
  exception?: {
    exceptionType: WorkExceptionType;
    reasonCode: string;
    reasonLabel: string;
    reasonText?: string;
    effectiveAt: string;
    recordedAt: string;
    recordedByUserAccountId?: string;
    recordedByStaffMemberId?: string;
    followUpRequired: boolean;
    escalationRequired: boolean;
  };
  assignmentLabel?: string;
  route: string;
  allowedActions: {
    open: boolean;
    start: boolean;
    complete: boolean;
    defer: boolean;
    miss: boolean;
    markMissed: boolean;
    cancel: boolean;
    markNotApplicable: boolean;
  };
}

export type WorkDomainEventType =
  | "WorkItemCreated"
  | "WorkItemAssigned"
  | "WorkItemClaimed"
  | "WorkItemReassigned"
  | "WorkItemReleased"
  | "WorkItemUnassigned"
  | "WorkAssignmentExpired"
  | "WorkItemStarted"
  | "WorkItemCompleted"
  | "WorkItemMissed"
  | "WorkItemDeclined"
  | "WorkItemDeferred"
  | "WorkItemCancelled"
  | "WorkItemMarkedNotApplicable";
export interface WorkDomainEvent {
  eventId: string;
  eventType: WorkDomainEventType;
  eventVersion: 1;
  workItemId: string;
  source: WorkSourceReference;
  nursingHomeId: string;
  wardId?: string;
  residentId?: string;
  occurredAt: string;
  actorUserAccountId?: string;
  correlationId: string;
  causationId?: string;
  payload: {
    fromStatus?: WorkPersistedStatus;
    toStatus?: WorkPersistedStatus;
    reasonCode?: string;
    evidenceEntityType?: string;
    evidenceEntityId?: string;
    previousAssignment?: WorkAssignment;
    newAssignment?: WorkAssignment;
    effectiveAt?: string;
    recordedAt?: string;
    followUpRequired?: boolean;
    escalationRequired?: boolean;
  };
}
export interface WorkProjectionState {
  workItems: WorkItem[];
  workStatusTransitions: WorkStatusTransition[];
  workAssignmentHistory?: WorkAssignmentHistory[];
  workExceptions?: WorkException[];
  workAuditRecords?: AuditRecord[];
  workEvents?: WorkDomainEvent[];
  workQueueInvalidationKeys?: string[];
}
export interface WorkOperationalQuery {
  context: OperationalContext;
  auth: WorkAuthContext;
  filters?: WorkQueueFilters;
}
