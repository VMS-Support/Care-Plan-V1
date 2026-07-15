import type { StaffMember, StaffTrainingAssignment, StaffTrainingCompletion, TrainingCourse } from "@/lib/care/types";
import { latestTrainingCompletion } from "./trainingMetricsService";
import { getTrainingComplianceStatus } from "./trainingService";

export function getStaffTrainingProfile(input: { staffMemberId: string; courses: TrainingCourse[]; assignments: StaffTrainingAssignment[]; completions: StaffTrainingCompletion[] }) {
  return input.assignments
    .filter((assignment) => String(assignment.staffMemberId) === input.staffMemberId && assignment.status !== "entered_in_error")
    .map((assignment) => {
      const completion = latestTrainingCompletion(input.completions, assignment);
      const course = input.courses.find((item) => item.id === assignment.trainingCourseId);
      return {
        assignmentId: String(assignment.id),
        courseId: assignment.trainingCourseId,
        courseTitle: course?.title || "Training Course",
        mandatory: true,
        status: getTrainingComplianceStatus({ assignment, completion, course }),
        dueDate: assignment.dueDate,
        completionDate: completion?.completionDate,
        expiryDate: completion?.expiryDate,
        completionId: completion?.id,
        verificationStatus: completion?.verificationStatus,
        certificateLinked: Boolean(completion?.certificateDocumentId || completion?.certificateFileId),
      };
    });
}

export function getTrainingMatrixViewModel(input: { staffMembers: StaffMember[]; courses: TrainingCourse[]; assignments: StaffTrainingAssignment[]; completions: StaffTrainingCompletion[] }) {
  return {
    courses: input.courses.filter((course) => course.status === "active").map((course) => ({ trainingCourseId: course.id, code: course.code, title: course.title, mandatory: course.mandatoryByDefault })),
    rows: input.staffMembers.map((staff) => ({
      staffMemberId: staff.id,
      staffDisplayName: staff.displayName,
      cells: input.courses.filter((course) => course.status === "active").map((course) => {
        const assignment = input.assignments.find((item) => String(item.staffMemberId) === String(staff.id) && item.trainingCourseId === course.id);
        const completion = assignment ? latestTrainingCompletion(input.completions, assignment) : undefined;
        return {
          trainingCourseId: course.id,
          status: getTrainingComplianceStatus({ assignment, completion, course }),
          completionDate: completion?.completionDate,
          expiryDate: completion?.expiryDate,
          dueDate: assignment?.dueDate,
          assignmentId: assignment?.id,
          completionId: completion?.id,
          route: `/workforce/staff/${staff.id}`,
        };
      }),
    })),
    generatedAt: new Date().toISOString(),
  };
}
