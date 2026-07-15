import type { TrainingCourse } from "@/lib/care/types";

const now = "2026-07-15T00:00:00.000Z";
const systemUser = "user-account-system" as any;

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

export const DEFAULT_TRAINING_COURSES: TrainingCourse[] = [
  ["MANUAL_HANDLING", "Manual Handling", "safety", 24, true],
  ["FIRE_SAFETY", "Fire Safety", "safety", 12, true],
  ["INFECTION_PREVENTION", "Infection Prevention", "mandatory", 12, true],
  ["SAFEGUARDING", "Safeguarding", "governance", 24, true],
  ["CPR", "CPR", "clinical", 12, true],
  ["MEDICATION_MANAGEMENT", "Medication Management", "clinical", 12, true],
].map(([code, title, category, validity, certificateRequired], index) => ({
  id: `training-course-${String(code).toLowerCase().replaceAll("_", "-")}`,
  code,
  title,
  category,
  mandatoryByDefault: true,
  deliveryMethods: ["classroom", "online", "blended"],
  defaultRenewalFrequency: validity === 12 ? "annual" : "every_two_years",
  defaultValidityMonths: validity,
  certificateRequired,
  verificationRequired: true,
  status: "active",
  displayOrder: index + 1,
  createdAt: now,
  updatedAt: now,
  createdByUserAccountId: systemUser,
  updatedByUserAccountId: systemUser,
}) as TrainingCourse);
