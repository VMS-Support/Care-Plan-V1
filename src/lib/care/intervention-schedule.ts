import type { CarePlanProblem, ProblemIntervention, ProblemInterventionLog, UserProfile } from "./types";

export type ScheduledInterventionStatus =
  | "overdue"
  | "due_now"
  | "due_next_hour"
  | "due_today"
  | "upcoming"
  | "completed"
  | "cancelled";

export interface ScheduledIntervention {
  intervention: ProblemIntervention;
  problem?: CarePlanProblem;
  dueAt: Date | null;
  status: ScheduledInterventionStatus;
  completion?: ProblemInterventionLog;
}

export interface UpcomingScheduledInterventionScope {
  residentIds?: Set<string> | string[];
  currentUser?: UserProfile;
  until?: Date;
  includeUpcoming?: boolean;
  roleAppropriateOnly?: boolean;
}

export function interventionFrequencyMinutes(frequency: ProblemIntervention["frequencyType"]) {
  if (frequency === "hourly") return 60;
  if (frequency === "every_2_hours") return 120;
  if (frequency === "every_4_hours") return 240;
  if (frequency === "every_6_hours") return 360;
  if (frequency === "three_times_daily") return 480;
  if (frequency === "twice_daily") return 720;
  if (frequency === "daily") return 1440;
  if (frequency === "per_shift") return 480;
  if (frequency === "weekly") return 10080;
  if (frequency === "monthly") return 43200;
  return null;
}

export function endOfCurrentShift(now: Date) {
  const end = new Date(now);
  const hour = end.getHours();
  if (hour < 14) end.setHours(14, 0, 0, 0);
  else if (hour < 22) end.setHours(22, 0, 0, 0);
  else {
    end.setDate(end.getDate() + 1);
    end.setHours(6, 0, 0, 0);
  }
  return end;
}

export function scheduledInterventions(
  interventions: ProblemIntervention[],
  logs: ProblemInterventionLog[],
  problems: CarePlanProblem[],
  now: Date,
): ScheduledIntervention[] {
  const nowMs = now.getTime();
  const problemById = new Map(problems.map((problem) => [problem.id, problem]));
  const logsByIntervention = new Map<string, ProblemInterventionLog[]>();
  for (const log of logs) {
    const current = logsByIntervention.get(log.interventionId) || [];
    current.push(log);
    logsByIntervention.set(log.interventionId, current);
  }

  return interventions
    .filter((intervention) => {
      const problem = problemById.get(intervention.problemId);
      return problem?.status === "active" && intervention.status === "active";
    })
    .map((intervention): ScheduledIntervention => {
      const interventionLogs = (logsByIntervention.get(intervention.id) || []).sort((a, b) =>
        `${b.date}T${b.time || "00:00"}`.localeCompare(`${a.date}T${a.time || "00:00"}`),
      );
      const completion = interventionLogs[0];
      const intervalMinutes = interventionFrequencyMinutes(intervention.frequencyType);
      const baseTimestamp = completion
        ? new Date(`${completion.date}T${completion.time || "08:00"}`).getTime()
        : new Date(`${intervention.startDate}T08:00`).getTime();
      const dueTimestamp = completion && intervalMinutes
        ? baseTimestamp + intervalMinutes * 60000
        : baseTimestamp;
      const dueAt = Number.isFinite(dueTimestamp) ? new Date(dueTimestamp) : null;

      let status: ScheduledInterventionStatus = "upcoming";
      if (["cancelled", "discontinued", "superseded"].includes(intervention.status)) {
        status = "cancelled";
      } else if (intervention.status === "completed") {
        status = "completed";
      } else if (dueAt) {
        const minutesUntilDue = Math.floor((dueAt.getTime() - nowMs) / 60000);
        if (minutesUntilDue < 0) status = "overdue";
        else if (minutesUntilDue <= 30) status = "due_now";
        else if (minutesUntilDue <= 60) status = "due_next_hour";
        else if (dueAt.toDateString() === now.toDateString()) status = "due_today";
      }

      return { intervention, problem: problemById.get(intervention.problemId), dueAt, status, completion };
    })
    .sort((a, b) => {
      const rank: Record<ScheduledInterventionStatus, number> = {
        overdue: 0, due_now: 1, due_next_hour: 2, due_today: 3, upcoming: 4, completed: 5, cancelled: 6,
      };
      return rank[a.status] - rank[b.status] ||
        (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER);
    });
}

export function getUpcomingScheduledInterventions(
  interventions: ProblemIntervention[],
  logs: ProblemInterventionLog[],
  problems: CarePlanProblem[],
  now: Date,
  scope: UpcomingScheduledInterventionScope = {},
) {
  const residentIds = scope.residentIds
    ? scope.residentIds instanceof Set
      ? scope.residentIds
      : new Set(scope.residentIds)
    : null;
  const currentUser = scope.currentUser;
  const until = scope.until ?? endOfCurrentShift(now);

  return scheduledInterventions(interventions, logs, problems, now).filter((scheduled) => {
    const intervention = scheduled.intervention;
    if (!scheduled.dueAt) return false;
    if (["cancelled", "completed"].includes(scheduled.status)) return false;
    if (residentIds && !residentIds.has(intervention.residentId)) return false;
    if (scheduled.dueAt.getTime() > until.getTime() && !scope.includeUpcoming) return false;

    if (currentUser) {
      const assignedToOtherStaff =
        intervention.assignedStaffId &&
        intervention.assignedStaffId !== currentUser.id &&
        intervention.assignedStaffName !== currentUser.name;
      if (assignedToOtherStaff) return false;

      if (scope.roleAppropriateOnly && intervention.assignedRole && intervention.assignedRole !== currentUser.role) {
        return false;
      }
    }

    return true;
  });
}

export function scheduledInterventionLabel(status: ScheduledInterventionStatus) {
  if (status === "due_now") return "Due Now";
  if (status === "due_next_hour") return "Due in Next Hour";
  if (status === "due_today") return "Due Today";
  if (status === "overdue") return "Overdue";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Upcoming";
}
