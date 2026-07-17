import type { TrainingCourse } from "@/lib/care/types";

export const TRAINING_STATUS_LABELS = {
  compliant: "Compliant",
  due_soon: "Due Soon",
  overdue: "Overdue",
  expired: "Expired",
  not_started: "Not Started",
  in_progress: "In Progress",
  pending_verification: "Pending Verification",
  verification_failed: "Verification Failed",
  exempt: "Exempt",
  not_required: "Not Required",
  unable_to_determine: "Unable to Determine",
} as const;

export const DEFAULT_TRAINING_COURSES: TrainingCourse[] = [];
