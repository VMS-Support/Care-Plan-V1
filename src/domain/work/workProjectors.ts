import type {
  Assessment,
  CarePlanProblem,
  HandoverNote,
  ProblemIntervention,
  ProblemInterventionLog,
  Resident,
  Task,
} from "@/lib/care/types";
import { createDeterministicWorkItemId } from "./workIdentity";
import type { WorkAssignment, WorkItem, WorkPriority, WorkSourceReference } from "./workTypes";

export interface ProjectionContext {
  now: string;
  timeZone: string;
  resident?: Resident;
  wardId?: string;
  roomId?: string;
}
export interface CareActionOccurrence {
  id: string;
  dueAt: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  occurrenceIndex?: number;
  operationalDate?: string;
}
export interface ObservationReminder {
  id: string;
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  observationType: string;
  dueAt: string;
  scheduleId?: string;
  occurrenceIndex?: number;
  priority?: WorkPriority;
  completedObservationId?: string;
  completedAt?: string;
  sourceEventId?: string;
  correlationId?: string;
  createdByRuleId?: string;
  createdByRuleVersion?: number;
}
export interface AssessmentReminder {
  id: string;
  assessment: Assessment;
  dueAt: string;
  assessmentTypeLabel?: string;
}
export interface CarePlanReviewRequirement {
  id: string;
  problem: CarePlanProblem;
  dueAt: string;
  lastReviewId?: string;
  completedReviewId?: string;
  completedAt?: string;
}
export interface DocumentationRequirement {
  id: string;
  nursingHomeId: string;
  wardId?: string;
  residentId?: string;
  documentType: string;
  sourceReason: string;
  dueAt: string;
  evidenceEntityType?: string;
  evidenceEntityId?: string;
  completedAt?: string;
  sourceEventId?: string;
  correlationId?: string;
  createdByRuleId?: string;
  createdByRuleVersion?: number;
}
export interface HandoverAcknowledgementRequirement {
  handover: HandoverNote;
  userAccountId: string;
  staffMemberId?: string;
  nursingHomeId: string;
  wardId: string;
  targetShiftId: string;
  dueAt: string;
}

const priority = (value?: string): WorkPriority =>
  value === "critical"
    ? "critical"
    : value === "high" || value === "urgent"
      ? "urgent"
      : value === "medium" || value === "important"
        ? "important"
        : "routine";
const base = (
  workType: WorkItem["workType"],
  title: string,
  source: WorkSourceReference,
  nursingHomeId: string,
  context: ProjectionContext,
): WorkItem => ({
  id: createDeterministicWorkItemId(workType, source),
  workType,
  title,
  source,
  nursingHomeId,
  schedule: { scheduleType: "one_off", timeZone: context.timeZone },
  persistedStatus: "scheduled",
  assignment: { assignmentType: "unassigned", assignmentStatus: "active" },
  priority: "routine",
  createdAt: context.now,
  updatedAt: context.now,
  schemaVersion: 1,
});
const residentScope = (
  item: WorkItem,
  resident: Resident | undefined,
  context?: ProjectionContext,
) => ({
  ...item,
  residentId: resident?.id,
  nursingHomeId: resident?.facilityId || item.nursingHomeId,
  wardId: context?.wardId,
  roomId: context?.roomId || resident?.roomId,
});
const roleAssignment = (role?: string, staffId?: string): WorkAssignment =>
  staffId
    ? { assignmentType: "person", assignedStaffMemberId: staffId, assignmentStatus: "active" }
    : role
      ? {
          assignmentType: "role",
          assignedRoleKey: role.trim().replace(/[\s-]+/g, "_").toUpperCase(),
          assignmentStatus: "active",
        }
      : { assignmentType: "unassigned", assignmentStatus: "active" };

export function projectCareActionOccurrenceToWorkItem(
  intervention: ProblemIntervention,
  occurrence: CareActionOccurrence,
  context: ProjectionContext,
  completion?: ProblemInterventionLog,
): WorkItem {
  const source: WorkSourceReference = {
    sourceType: "care_plan",
    sourceModule: "care_plans",
    sourceEntityType: "care_action_occurrence",
    sourceEntityId: occurrence.id,
    sourceOccurrenceId: occurrence.id,
    parentEntityType: "care_action",
    parentEntityId: intervention.id,
    route: `/residents/${intervention.residentId}/care-plan`,
    completionOwner: "care_plan_service",
    recreationPolicy: "deterministic",
    createdAt: intervention.createdAt,
  };
  const item = residentScope(
    base(
      "care_action",
      intervention.name,
      source,
      intervention.facilityId || context.resident?.facilityId || "",
      context,
    ),
    context.resident,
    context,
  );
  const completedAt = completion ? `${completion.date}T${completion.time}:00.000` : undefined;
  return {
    ...item,
    residentId: intervention.residentId,
    operationalDate: occurrence.operationalDate,
    schedule: {
      scheduleType: intervention.frequencyType === "once" ? "one_off" : "recurring_occurrence",
      scheduledStart: occurrence.scheduledStart,
      dueAt: occurrence.dueAt,
      effectiveDueAt: occurrence.dueAt,
      originalDueAt: occurrence.dueAt,
      scheduledEnd: occurrence.scheduledEnd,
      recurrenceId: intervention.id,
      occurrenceIndex: occurrence.occurrenceIndex,
      timeZone: context.timeZone,
    },
    persistedStatus: completion
      ? completion.outcome === "missed" || completion.outcome === "refused"
        ? "missed"
        : "completed"
      : intervention.status === "cancelled" || intervention.status === "discontinued"
        ? "cancelled"
        : "scheduled",
    assignment: roleAssignment(intervention.assignedRole, intervention.assignedStaffId),
    priority: priority(undefined),
    completion:
      completedAt && completion && !["missed", "refused"].includes(completion.outcome)
        ? {
            effectiveCompletedAt: completedAt,
            recordedAt: completion.createdAt,
            completedByStaffMemberId: completion.staffId,
            outcomeCode: completion.outcome,
            response: completion.residentResponse,
            wasCompletedLate: Date.parse(completedAt) > Date.parse(occurrence.dueAt),
            minutesCompletedLate: Math.max(
              0,
              Math.floor((Date.parse(completedAt) - Date.parse(occurrence.dueAt)) / 60000),
            ),
            evidenceEntityType: "ProblemInterventionLog",
            evidenceEntityId: completion.id,
          }
        : undefined,
    missed:
      completion && ["missed", "refused"].includes(completion.outcome)
        ? {
            reasonCode:
              completion.outcome === "refused" ? "resident_refused" : "unable_to_complete",
            reasonText: completion.comments,
            occurredAt: completion.createdAt,
            actorId: completion.staffId,
            followUpRequired: completion.followUpRequired,
            escalationRequired: completion.followUpRequired,
          }
        : undefined,
  };
}

export function projectTaskToWorkItem(task: Task, context: ProjectionContext): WorkItem {
  const source: WorkSourceReference = {
    sourceType: "manual_task",
    sourceModule: "tasks",
    sourceEntityType: "task",
    sourceEntityId: task.id,
    route: "/tasks",
    completionOwner: "task_service",
    recreationPolicy: "manual_only",
    createdAt: task.createdAt || context.now,
  };
  const item = residentScope(
    base(
      "general_task",
      task.title,
      source,
      task.facilityId || context.resident?.facilityId || "",
      context,
    ),
    context.resident,
    context,
  );
  const persistedStatus =
    task.status === "completed"
      ? "completed"
      : task.status === "deleted" || task.cancelledAt
        ? "cancelled"
        : task.status === "in_progress"
          ? "in_progress"
          : "scheduled";
  return {
    ...item,
    residentId: task.residentId,
    summary: task.description,
    schedule: {
      scheduleType:
        task.recurrence && task.recurrence !== "none" ? "recurring_occurrence" : "one_off",
      dueAt: task.dueDate,
      effectiveDueAt: task.dueDate,
      originalDueAt: task.dueDate,
      recurrenceId: task.recurrence && task.recurrence !== "none" ? task.id : undefined,
      timeZone: context.timeZone,
    },
    persistedStatus,
    assignment:
      task.assignedToType === "role"
        ? roleAssignment(task.assignedRole)
        : task.assignedToType === "unassigned"
          ? { assignmentType: "unassigned", assignmentStatus: "active" }
          : {
              assignmentType: "person",
              assignedStaffMemberId: task.assignedTo,
              assignmentStatus: "active",
            },
    priority: priority(task.priority),
    completion: task.completedAt
      ? {
          effectiveCompletedAt: task.completedAt,
          recordedAt: task.completedAt,
          response: task.outcome,
          wasCompletedLate: Date.parse(task.completedAt) > Date.parse(task.dueDate),
          evidenceEntityType: "Task",
          evidenceEntityId: task.id,
        }
      : undefined,
    cancellation:
      persistedStatus === "cancelled"
        ? {
            reasonCode: task.deleteReason ? "deleted" : "cancelled",
            reasonText: task.cancellationReason || task.deleteReason,
            occurredAt: task.cancelledAt || task.deletedAt || context.now,
            actorId: task.cancelledBy || task.deletedBy,
          }
        : undefined,
  };
}

export function projectObservationReminderToWorkItem(
  reminder: ObservationReminder,
  context: ProjectionContext,
): WorkItem {
  const source: WorkSourceReference = {
    sourceType: "observation_schedule",
    sourceModule: "observations",
    sourceEntityType: "observation_reminder",
    sourceEntityId: reminder.id,
    sourceOccurrenceId: reminder.id,
    parentEntityType: "observation_schedule",
    parentEntityId: reminder.scheduleId,
    createdByRuleId: reminder.createdByRuleId,
    createdByRuleVersion: reminder.createdByRuleVersion,
    sourceEventId: reminder.sourceEventId,
    createdFromEventId: reminder.sourceEventId,
    correlationId: reminder.correlationId,
    route: `/vitals?residentId=${reminder.residentId}`,
    completionOwner: "observation_service",
    recreationPolicy: reminder.sourceEventId ? "event_replay" : "deterministic",
    createdAt: context.now,
  };
  const item = residentScope(
    base(
      "observation",
      `Record ${reminder.observationType}`,
      source,
      reminder.nursingHomeId,
      context,
    ),
    context.resident,
    context,
  );
  return {
    ...item,
    residentId: reminder.residentId,
    wardId: reminder.wardId || item.wardId,
    schedule: {
      scheduleType: reminder.scheduleId ? "recurring_occurrence" : "triggered",
      dueAt: reminder.dueAt,
      effectiveDueAt: reminder.dueAt,
      originalDueAt: reminder.dueAt,
      recurrenceId: reminder.scheduleId,
      occurrenceIndex: reminder.occurrenceIndex,
      timeZone: context.timeZone,
    },
    persistedStatus: reminder.completedObservationId ? "completed" : "scheduled",
    priority: reminder.priority || "routine",
    completion:
      reminder.completedObservationId && reminder.completedAt
        ? {
            effectiveCompletedAt: reminder.completedAt,
            recordedAt: reminder.completedAt,
            wasCompletedLate: Date.parse(reminder.completedAt) > Date.parse(reminder.dueAt),
            evidenceEntityType: "ClinicalObservation",
            evidenceEntityId: reminder.completedObservationId,
          }
        : undefined,
  };
}

export function projectAssessmentReminderToWorkItem(
  reminder: AssessmentReminder,
  context: ProjectionContext,
): WorkItem {
  const assessment = reminder.assessment;
  const source: WorkSourceReference = {
    sourceType: "assessment",
    sourceModule: "assessments",
    sourceEntityType: "assessment_reminder",
    sourceEntityId: reminder.id,
    parentEntityType: "assessment",
    parentEntityId: assessment.id,
    route: `/assessments/${assessment.id}`,
    completionOwner: "assessment_service",
    recreationPolicy: "deterministic",
    createdAt: context.now,
  };
  const item = residentScope(
    base(
      "assessment",
      `${reminder.assessmentTypeLabel || assessment.type} assessment`,
      source,
      assessment.facilityId || context.resident?.facilityId || "",
      context,
    ),
    context.resident,
    context,
  );
  const completed = assessment.status === "completed";
  return {
    ...item,
    residentId: assessment.residentId,
    schedule: {
      scheduleType: "triggered",
      dueAt: reminder.dueAt,
      effectiveDueAt: reminder.dueAt,
      originalDueAt: reminder.dueAt,
      timeZone: context.timeZone,
    },
    persistedStatus: completed
      ? "completed"
      : assessment.status === "archived" || assessment.deletedAt
        ? "cancelled"
        : "scheduled",
    assignment: roleAssignment(assessment.assignedToRole, assessment.assignedToUserId),
    priority: priority(assessment.riskLevel),
    completion: completed
      ? {
          effectiveCompletedAt: assessment.date,
          recordedAt: assessment.date,
          completedByUserAccountId: assessment.assignedToUserId,
          wasCompletedLate: Date.parse(assessment.date) > Date.parse(reminder.dueAt),
          evidenceEntityType: "Assessment",
          evidenceEntityId: assessment.id,
        }
      : undefined,
  };
}

export function projectCarePlanReviewToWorkItem(
  requirement: CarePlanReviewRequirement,
  context: ProjectionContext,
): WorkItem {
  const problem = requirement.problem;
  const source: WorkSourceReference = {
    sourceType: "care_plan",
    sourceModule: "care_plans",
    sourceEntityType: "care_plan_review_requirement",
    sourceEntityId: requirement.id,
    parentEntityType: "care_plan_problem",
    parentEntityId: problem.id,
    route: `/residents/${problem.residentId}/care-plan`,
    completionOwner: "care_plan_service",
    recreationPolicy: "deterministic",
    createdAt: context.now,
  };
  const item = residentScope(
    base(
      "care_plan_review",
      `Review care plan: ${problem.problemStatement}`,
      source,
      problem.facilityId || context.resident?.facilityId || "",
      context,
    ),
    context.resident,
    context,
  );
  return {
    ...item,
    residentId: problem.residentId,
    schedule: {
      scheduleType: "triggered",
      dueAt: requirement.dueAt,
      effectiveDueAt: requirement.dueAt,
      originalDueAt: requirement.dueAt,
      timeZone: context.timeZone,
    },
    persistedStatus: requirement.completedReviewId
      ? "completed"
      : problem.status !== "active"
        ? "cancelled"
        : "scheduled",
    priority: priority(problem.riskLevel),
    completion:
      requirement.completedReviewId && requirement.completedAt
        ? {
            effectiveCompletedAt: requirement.completedAt,
            recordedAt: requirement.completedAt,
            wasCompletedLate: Date.parse(requirement.completedAt) > Date.parse(requirement.dueAt),
            evidenceEntityType: "ProblemReview",
            evidenceEntityId: requirement.completedReviewId,
          }
        : undefined,
  };
}

export function projectDocumentationRequirementToWorkItem(
  requirement: DocumentationRequirement,
  context: ProjectionContext,
): WorkItem {
  const source: WorkSourceReference = {
    sourceType: requirement.createdByRuleId ? "clinical_rule" : "documentation_requirement",
    sourceModule: "documentation",
    sourceEntityType: "documentation_requirement",
    sourceEntityId: requirement.id,
    createdByRuleId: requirement.createdByRuleId,
    createdByRuleVersion: requirement.createdByRuleVersion,
    sourceEventId: requirement.sourceEventId,
    createdFromEventId: requirement.sourceEventId,
    correlationId: requirement.correlationId,
    route: requirement.residentId ? `/residents/${requirement.residentId}/record` : "/daily-notes",
    completionOwner: "documentation_service",
    recreationPolicy: requirement.sourceEventId ? "event_replay" : "deterministic",
    createdAt: context.now,
  };
  const item = residentScope(
    base(
      "documentation",
      `Complete ${requirement.documentType}`,
      source,
      requirement.nursingHomeId,
      context,
    ),
    context.resident,
    context,
  );
  return {
    ...item,
    summary: requirement.sourceReason,
    residentId: requirement.residentId,
    wardId: requirement.wardId || item.wardId,
    schedule: {
      scheduleType: "triggered",
      dueAt: requirement.dueAt,
      effectiveDueAt: requirement.dueAt,
      originalDueAt: requirement.dueAt,
      timeZone: context.timeZone,
    },
    persistedStatus: requirement.evidenceEntityId ? "completed" : "scheduled",
    completion:
      requirement.evidenceEntityId && requirement.evidenceEntityType && requirement.completedAt
        ? {
            effectiveCompletedAt: requirement.completedAt,
            recordedAt: requirement.completedAt,
            wasCompletedLate: Date.parse(requirement.completedAt) > Date.parse(requirement.dueAt),
            evidenceEntityType: requirement.evidenceEntityType,
            evidenceEntityId: requirement.evidenceEntityId,
          }
        : undefined,
  };
}

export function projectHandoverAcknowledgementToWorkItem(
  requirement: HandoverAcknowledgementRequirement,
  context: ProjectionContext,
): WorkItem {
  const h = requirement.handover;
  const occurrence = `${requirement.userAccountId}:${requirement.targetShiftId}`;
  const source: WorkSourceReference = {
    sourceType: "handover",
    sourceModule: "handovers",
    sourceEntityType: "handover_acknowledgement_requirement",
    sourceEntityId: h.id,
    sourceOccurrenceId: occurrence,
    route: "/handovers",
    completionOwner: "handover_service",
    recreationPolicy: "deterministic",
    createdAt: h.createdAt || context.now,
  };
  const item = residentScope(
    base(
      "handover_acknowledgement",
      "Acknowledge handover",
      source,
      requirement.nursingHomeId,
      context,
    ),
    context.resident,
    context,
  );
  const acknowledgement = h.handoverAcknowledgements?.find(
    (ack) =>
      ack.userAccountId === requirement.userAccountId && ack.shiftId === requirement.targetShiftId,
  );
  const inactive =
    h.recordStatus === "deleted" || !!h.resolvedAt || !!h.closedAt || !!h.completedAt;
  return {
    ...item,
    residentId: h.residentId || undefined,
    wardId: requirement.wardId,
    shiftId: requirement.targetShiftId,
    operationalDate: h.operationalDate,
    summary: h.summary,
    schedule: {
      scheduleType: "triggered",
      scheduledStart: h.effectiveFrom,
      dueAt: requirement.dueAt,
      effectiveDueAt: requirement.dueAt,
      originalDueAt: requirement.dueAt,
      scheduledEnd: h.expiresAt,
      timeZone: context.timeZone,
    },
    assignment: {
      assignmentType: "person",
      assignedUserAccountId: requirement.userAccountId,
      assignedStaffMemberId: requirement.staffMemberId,
      assignmentStatus: "active",
    },
    priority: priority(h.handoverPriority || h.priority),
    persistedStatus: acknowledgement ? "completed" : inactive ? "not_applicable" : "scheduled",
    completion: acknowledgement
      ? {
          effectiveCompletedAt: acknowledgement.acknowledgedAt,
          recordedAt: acknowledgement.acknowledgedAt,
          completedByUserAccountId: acknowledgement.userAccountId,
          completedByStaffMemberId: acknowledgement.staffMemberId,
          wasCompletedLate: false,
          evidenceEntityType: "HandoverAcknowledgement",
          evidenceEntityId: acknowledgement.id,
        }
      : undefined,
    notApplicable:
      !acknowledgement && inactive
        ? {
            reasonCode: "handover_resolved",
            reasonText: "Handover resolved before acknowledgement",
            occurredAt: h.resolvedAt || h.closedAt || h.completedAt || context.now,
          }
        : undefined,
  };
}

// Appointments and referrals intentionally have no projector until standalone source modules exist.
