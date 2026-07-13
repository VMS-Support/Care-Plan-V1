import type { DueTimeClassification } from "@/lib/care/dueTime";
import type { OperationalContext } from "@/lib/care/types";
import type {
  DomainEventId,
  EnterpriseId,
  NursingHomeId,
  ResidentId,
  RoomId,
  ShiftId,
  StaffMemberId,
  UserAccountId,
  WardId,
  WorkItemId,
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
export type WorkAssignmentType = "unassigned" | "person" | "role" | "ward_queue" | "team" | "self";

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
  type: WorkAssignmentType;
  assignedUserAccountId?: UserAccountId | string;
  assignedStaffMemberId?: StaffMemberId | string;
  assignedRoleKey?: string;
  assignedWardId?: WardId | string;
  assignedTeamId?: string;
  assignedAt?: string;
  assignedBy?: UserAccountId | string;
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
  residentId?: ResidentId | string;
  shiftId?: ShiftId | string;
  operationalDate?: string;
  schedule: WorkSchedule;
  persistedStatus: WorkPersistedStatus;
  assignment: WorkAssignment;
  priority: WorkPriority;
  clinicalUrgency?: ClinicalUrgency;
  completion?: WorkCompletion;
  deferral?: WorkDeferral;
  cancellation?: WorkCancellation;
  notApplicable?: WorkNotApplicable;
  missed?: WorkMissedDetails;
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
  id: string;
  workItemId: string;
  previousAssignment?: WorkAssignment;
  assignment: WorkAssignment;
  assignedAt: string;
  assignedBy: string;
  correlationId?: string;
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
  wardIds?: string[];
  residentId?: string;
  assignment?: "mine" | "role" | "ward" | "unassigned" | "all";
  dueFrom?: string;
  dueTo?: string;
  sourceModules?: WorkSourceReference["sourceModule"][];
  mode?: "active" | "history";
  now?: string;
}

export interface WorkQueueItem {
  workItemId: string;
  workType: WorkType;
  title: string;
  summary?: string;
  resident?: { id: string; name: string; preferredName?: string };
  ward?: { id: string; name: string };
  room?: { id?: string; label?: string };
  dueAt?: string;
  displayStatus: WorkDisplayStatus;
  dueDescription?: string;
  priority: WorkPriority;
  assignmentLabel?: string;
  route: string;
  allowedActions: {
    open: boolean;
    start: boolean;
    complete: boolean;
    defer: boolean;
    miss: boolean;
    cancel: boolean;
    markNotApplicable: boolean;
  };
}

export type WorkDomainEventType =
  | "WorkItemCreated"
  | "WorkItemAssigned"
  | "WorkItemStarted"
  | "WorkItemCompleted"
  | "WorkItemMissed"
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
  };
}
export interface WorkProjectionState {
  workItems: WorkItem[];
  workStatusTransitions: WorkStatusTransition[];
  workAssignmentHistory?: WorkAssignmentHistory[];
  workEvents?: WorkDomainEvent[];
}
export interface WorkOperationalQuery {
  context: OperationalContext;
  auth: WorkAuthContext;
  filters?: WorkQueueFilters;
}
