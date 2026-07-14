import {
  getUpcomingScheduledInterventions,
  type ScheduledIntervention,
  type UpcomingScheduledInterventionScope,
} from "@/lib/care/intervention-schedule";
import type {
  CarePlanProblem,
  OperationalContext,
  ProblemIntervention,
  ProblemInterventionLog,
  Resident,
} from "@/lib/care/types";
import { createDeterministicOccurrenceId } from "@/domain/recurrence";
import { projectCareActionOccurrenceToWorkItem } from "./workProjectors";
import { buildWorkQueueReadModel } from "./workQueueReadModel";
import type { WorkAuthContext, WorkDeferral, WorkItem, WorkPersistedStatus } from "./workTypes";

export type InterventionQueueMode = "legacy" | "shadow_compare" | "unified";
export const DEFAULT_INTERVENTION_QUEUE_MODE: InterventionQueueMode = "shadow_compare";

export interface CareActionPlacement {
  resident: Resident;
  nursingHomeId: string;
  wardId?: string;
  roomId?: string;
  bedId?: string;
}

export interface CareActionProjectionOverrides {
  occurrenceId?: string;
  recurrenceRuleId?: string;
  recurrenceRuleVersion?: number;
  originalDueAt?: string;
  effectiveDueAt?: string;
  persistedStatus?: WorkPersistedStatus;
  deferral?: WorkDeferral;
  correlationId?: string;
  sourceEventId?: string;
}

const statusFromLegacy = (scheduled: ScheduledIntervention): WorkPersistedStatus => {
  if (scheduled.status === "completed") return "completed";
  if (scheduled.status === "cancelled") return "cancelled";
  return "scheduled";
};

export function projectScheduledCareActionToWorkItem(
  scheduled: ScheduledIntervention,
  placement: CareActionPlacement,
  operationalContext: OperationalContext,
  overrides: CareActionProjectionOverrides = {},
): WorkItem {
  if (!scheduled.dueAt) throw new Error("A scheduled Care Action occurrence requires dueAt.");
  const dueAt = scheduled.dueAt.toISOString();
  const recurrenceRuleId = overrides.recurrenceRuleId || scheduled.intervention.id;
  const occurrenceId =
    overrides.occurrenceId ||
    createDeterministicOccurrenceId(scheduled.intervention.id, recurrenceRuleId, dueAt);
  const persistedStatus = overrides.persistedStatus || statusFromLegacy(scheduled);
  const completion =
    persistedStatus === "completed" || persistedStatus === "missed"
      ? scheduled.completion
      : undefined;
  const projected = projectCareActionOccurrenceToWorkItem(
    scheduled.intervention,
    {
      id: occurrenceId,
      dueAt,
      operationalDate: operationalContext.operationalDate,
    },
    {
      now: operationalContext.updatedAt,
      timeZone: operationalContext.timezone,
      resident: placement.resident,
      wardId: placement.wardId,
      roomId: placement.roomId,
    },
    completion,
  );
  const effectiveDueAt = overrides.effectiveDueAt || overrides.deferral?.deferredUntil || dueAt;
  const problem = scheduled.problem;
  return {
    ...projected,
    nursingHomeId: placement.nursingHomeId,
    wardId: placement.wardId,
    roomId: placement.roomId,
    bedId: placement.bedId,
    summary: scheduled.intervention.description || scheduled.intervention.frequencyInstructions,
    source: {
      ...projected.source,
      createdByRuleId: recurrenceRuleId,
      createdByRuleVersion: overrides.recurrenceRuleVersion,
      sourceEventId: overrides.sourceEventId,
      correlationId: overrides.correlationId,
      route: `/residents/${scheduled.intervention.residentId}/care-plan`,
    },
    schedule: {
      ...projected.schedule,
      scheduleType:
        scheduled.intervention.frequencyType === "once" ? "one_off" : "recurring_occurrence",
      originalDueAt: overrides.originalDueAt || dueAt,
      effectiveDueAt,
      recurrenceId: recurrenceRuleId,
    },
    persistedStatus,
    deferral: overrides.deferral,
    dueTimeClassification: scheduled.dueTime,
    cancellation:
      persistedStatus === "cancelled"
        ? {
            reasonCode:
              scheduled.intervention.status === "discontinued"
                ? "care_action_discontinued"
                : "care_action_cancelled",
            reasonText:
              scheduled.intervention.discontinuedReason ||
              scheduled.intervention.cancellationReason,
            occurredAt:
              scheduled.intervention.discontinuedAt ||
              scheduled.intervention.cancelledAt ||
              scheduled.intervention.updatedAt ||
              scheduled.intervention.createdAt,
            actorId: scheduled.intervention.discontinuedBy || scheduled.intervention.cancelledBy,
          }
        : projected.cancellation,
    careContext: {
      carePlanId: problem?.residentCarePlanId,
      carePlanItemId: problem?.id,
      rltDomainId: problem?.rltDomainId,
    },
    correlationId: overrides.correlationId,
    createdAt: scheduled.intervention.createdAt,
    updatedAt: scheduled.intervention.updatedAt || scheduled.intervention.createdAt,
  };
}

export interface UpcomingCareInterventionAdapterInput {
  interventions: ProblemIntervention[];
  logs: ProblemInterventionLog[];
  problems: CarePlanProblem[];
  residents: Resident[];
  operationalContext: OperationalContext;
  authorizationContext: WorkAuthContext;
  now: Date;
  scope?: UpcomingScheduledInterventionScope;
  mode?: InterventionQueueMode;
  placementForResident?: (resident: Resident) => Omit<CareActionPlacement, "resident">;
}

export interface UpcomingCareInterventionAdapterResult {
  items: ScheduledIntervention[];
  nextFourHoursItems: ScheduledIntervention[];
  legacyItems: ScheduledIntervention[];
  workItems: WorkItem[];
  mode: InterventionQueueMode;
  unifiedCandidateIds: string[];
}

export function getUpcomingCareInterventionsLegacyShape(
  input: UpcomingCareInterventionAdapterInput,
): UpcomingCareInterventionAdapterResult {
  const mode = input.mode || DEFAULT_INTERVENTION_QUEUE_MODE;
  const legacyItems = getUpcomingScheduledInterventions(
    input.interventions,
    input.logs,
    input.problems,
    input.now,
    { ...input.scope, operationalContext: input.operationalContext },
  );
  const residents = new Map(input.residents.map((resident) => [resident.id, resident]));
  const workItems = legacyItems.flatMap((scheduled) => {
    const resident = residents.get(scheduled.intervention.residentId);
    if (!resident || !scheduled.dueAt) return [];
    const placement = input.placementForResident?.(resident) || {
      nursingHomeId: resident.facilityId || String(input.operationalContext.nursingHomeId),
      roomId: resident.roomId,
    };
    return [
      projectScheduledCareActionToWorkItem(
        scheduled,
        { resident, ...placement },
        input.operationalContext,
      ),
    ];
  });
  const readModel = buildWorkQueueReadModel(input.operationalContext, input.authorizationContext, {
    items: workItems,
    references: { residents: input.residents, wards: [] },
    clock: { now: () => input.now.toISOString() },
  });
  const unifiedCandidateIds = [
    ...readModel.sections.overdue.items,
    ...readModel.sections.dueNow.items,
    ...readModel.sections.nextHour.items,
    ...readModel.sections.nextFourHours.items,
    ...readModel.sections.thisShift.items,
  ].map((item) => item.workItemId);
  const allowed = new Set(unifiedCandidateIds);
  const unifiedItems = legacyItems.filter((_, index) => allowed.has(String(workItems[index]?.id)));
  const nextFourHourWorkIds = new Set(
    [...readModel.sections.overdue.items, ...readModel.sections.nextFourHours.items].map(
      (item) => item.workItemId,
    ),
  );
  const legacyNextFourHoursEnd = input.now.getTime() + 240 * 60_000;
  const legacyNextFourHoursItems = legacyItems.filter(
    (item) =>
      item.status === "overdue" ||
      Boolean(item.dueAt && item.dueAt.getTime() <= legacyNextFourHoursEnd),
  );
  return {
    items: mode === "unified" ? unifiedItems : legacyItems,
    nextFourHoursItems:
      mode === "unified"
        ? legacyItems.filter((_, index) => nextFourHourWorkIds.has(String(workItems[index]?.id)))
        : legacyNextFourHoursItems,
    legacyItems,
    workItems,
    mode,
    unifiedCandidateIds: [...new Set(unifiedCandidateIds)],
  };
}
