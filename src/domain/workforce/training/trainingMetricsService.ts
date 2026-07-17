import type { StaffTrainingAssignment, StaffTrainingCompletion, StaffTrainingComplianceStatus, TrainingCourse } from "@/lib/care/types";
import { getTrainingComplianceStatus } from "./trainingService";

export function latestTrainingCompletion(completions: StaffTrainingCompletion[], assignment: StaffTrainingAssignment) {
  return completions
    .filter((completion) =>
      String(completion.staffMemberId) === String(assignment.staffMemberId) &&
      completion.trainingCourseId === assignment.trainingCourseId &&
      completion.status !== "entered_in_error" &&
      completion.status !== "superseded",
    )
    .sort((a, b) => String(b.completionDate).localeCompare(String(a.completionDate)))[0];
}

export type OperationalTrainingStatus = "not_started" | "in_progress" | "completed" | "overdue" | "cancelled" | "entered_in_error";

export function resolveTrainingAssignmentStatus(input: { assignment: StaffTrainingAssignment; completions: StaffTrainingCompletion[]; effectiveAt?: string }): OperationalTrainingStatus {
  const effectiveAt = input.effectiveAt || new Date().toISOString().slice(0, 10);
  const assignment = input.assignment;
  if (assignment.status === "cancelled") return "cancelled";
  if (assignment.status === "entered_in_error") return "entered_in_error";
  const completion = latestTrainingCompletion(input.completions, assignment);
  if (completion && completion.status !== "entered_in_error" && completion.status !== "superseded") return "completed";
  if (assignment.completedAt) return "completed";
  if (assignment.dueDate && assignment.dueDate < effectiveAt) return "overdue";
  if (assignment.startedAt || assignment.status === "in_progress") return "in_progress";
  return "not_started";
}

export function getTrainingComplianceMetric(input: { assignments: StaffTrainingAssignment[]; completions: StaffTrainingCompletion[]; courses: TrainingCourse[]; effectiveAt?: string }) {
  const active = input.assignments.filter((assignment) => {
    if (["cancelled", "entered_in_error", "exempt"].includes(assignment.status)) return false;
    const course = input.courses.find((item) => item.id === assignment.trainingCourseId);
    return assignment.mandatory ?? course?.mandatoryByDefault ?? false;
  });
  const buckets: Record<StaffTrainingComplianceStatus, StaffTrainingAssignment[]> = {
    compliant: [], due_soon: [], overdue: [], expired: [], not_started: [], in_progress: [], pending_verification: [], verification_failed: [], exempt: [], not_required: [], unable_to_determine: [],
  };
  for (const assignment of active) {
    const status = getTrainingComplianceStatus({ assignment, completion: latestTrainingCompletion(input.completions, assignment), course: input.courses.find((course) => course.id === assignment.trainingCourseId), effectiveAt: input.effectiveAt });
    buckets[status].push(assignment);
  }
  const numerator = buckets.compliant.length + buckets.due_soon.length;
  const denominator = active.length;
  return {
    numerator,
    denominator,
    percentage: denominator ? Math.round((numerator / denominator) * 100) : undefined,
    compliantAssignments: buckets.compliant,
    dueSoonAssignments: buckets.due_soon,
    overdueAssignments: buckets.overdue,
    expiredAssignments: buckets.expired,
    notStartedAssignments: buckets.not_started,
    inProgressAssignments: buckets.in_progress,
    pendingVerificationAssignments: buckets.pending_verification,
    affectedStaffCount: new Set(active.map((assignment) => String(assignment.staffMemberId))).size,
    explanation: denominator
      ? `${numerator} of ${denominator} mandatory Training assignments completed.`
      : "No mandatory Training assignments exist for the selected scope.",
    route: "/training-dashboard?status=all",
    generatedAt: new Date().toISOString(),
  };
}

export function getTrainingOverdueMetric(input: { assignments: StaffTrainingAssignment[]; completions: StaffTrainingCompletion[]; courses: TrainingCourse[]; effectiveAt?: string }) {
  const metric = getTrainingComplianceMetric(input);
  return { value: metric.overdueAssignments.length + metric.expiredAssignments.length, overdue: metric.overdueAssignments, expired: metric.expiredAssignments, route: "/training-dashboard?status=overdue", generatedAt: metric.generatedAt };
}

export function getTrainingNotStartedMetric(input: { assignments: StaffTrainingAssignment[]; completions: StaffTrainingCompletion[]; courses: TrainingCourse[]; effectiveAt?: string }) {
  const metric = getTrainingComplianceMetric(input);
  return { value: metric.notStartedAssignments.length, records: metric.notStartedAssignments, route: "/training-dashboard?status=not_started", generatedAt: metric.generatedAt };
}
