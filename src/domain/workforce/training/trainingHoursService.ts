import type { StaffTrainingAssignment, StaffTrainingCompletion, TrainingCourse } from "@/lib/care/types";

export interface CompletedTrainingHoursFilters {
  year?: string;
  dateFrom?: string;
  dateTo?: string;
  staffMemberId?: string;
  nursingHomeId?: string;
  role?: string;
  courseId?: string;
  category?: string;
  mandatory?: "all" | "mandatory" | "optional";
}

export function getCompletedTrainingHours(input: {
  assignments: StaffTrainingAssignment[];
  completions: StaffTrainingCompletion[];
  courses: TrainingCourse[];
  filters?: CompletedTrainingHoursFilters;
}) {
  const filters = { mandatory: "all", ...input.filters };
  const seen = new Set<string>();
  let totalMinutes = 0;
  let missingDurationCount = 0;
  let inferredDurationCount = 0;
  const staff = new Set<string>();
  const courses = new Set<string>();
  const rows = input.completions
    .filter((completion) => completion.status !== "entered_in_error" && completion.status !== "superseded")
    .filter((completion) => {
      const key = completion.trainingAssignmentId || `${completion.staffMemberId}-${completion.trainingCourseId}-${completion.completionDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      const assignment = input.assignments.find((item) => item.id === completion.trainingAssignmentId);
      if (assignment && ["cancelled", "entered_in_error"].includes(assignment.status)) return false;
      const course = input.courses.find((item) => item.id === completion.trainingCourseId);
      const date = completion.completionDate;
      if (filters.year && filters.year !== "all" && date.slice(0, 4) !== filters.year) return false;
      if (filters.dateFrom && date < filters.dateFrom) return false;
      if (filters.dateTo && date > filters.dateTo) return false;
      if (filters.staffMemberId && filters.staffMemberId !== "all" && String(completion.staffMemberId) !== filters.staffMemberId) return false;
      if (filters.nursingHomeId && filters.nursingHomeId !== "all" && String(assignment?.nursingHomeId || "") !== filters.nursingHomeId) return false;
      if (filters.courseId && filters.courseId !== "all" && completion.trainingCourseId !== filters.courseId) return false;
      if (filters.category && filters.category !== "all" && course?.category !== filters.category) return false;
      const isMandatory = assignment?.mandatory ?? course?.mandatoryByDefault ?? false;
      if (filters.mandatory === "mandatory" && !isMandatory) return false;
      if (filters.mandatory === "optional" && isMandatory) return false;
      return true;
    });
  for (const completion of rows) {
    const course = input.courses.find((item) => item.id === completion.trainingCourseId);
    let minutes = completion.creditedDurationMinutes;
    if (!minutes && course?.durationMinutes) {
      minutes = course.durationMinutes;
      inferredDurationCount += 1;
    }
    if (minutes) totalMinutes += minutes;
    else missingDurationCount += 1;
    staff.add(String(completion.staffMemberId));
    courses.add(completion.trainingCourseId);
  }
  return {
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    completionCount: rows.length,
    staffMemberCount: staff.size,
    courseCount: courses.size,
    missingDurationCount,
    inferredDurationCount,
    availability: missingDurationCount ? "partial" : "complete",
    rows,
    explanation: missingDurationCount
      ? "The completed Training Hours could not be calculated because some Completion records have no credited duration."
      : `${Math.round((totalMinutes / 60) * 100) / 100} Training Hours calculated from completed Training records.`,
  };
}

export function getTrainingCompletionYears(completions: StaffTrainingCompletion[]) {
  return [...new Set(completions.filter((item) => item.status !== "entered_in_error" && item.status !== "superseded").map((item) => item.completionDate.slice(0, 4)).filter(Boolean))].sort((a, b) => b.localeCompare(a));
}
