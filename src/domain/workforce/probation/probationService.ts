import type { ProbationReviewSchedulePolicy, StaffProbation, StaffProbationExtension, StaffProbationReview, StaffProbationStatus } from "@/lib/care/types";

const uuid = () => Math.random().toString(36).slice(2, 10);

export interface CreateStaffProbationCommand {
  staffMemberId: string;
  employmentRecordId: string;
  nursingHomeId: string;
  wardId?: string;
  probationStartDate: string;
  expectedEndDate: string;
  notes?: string;
}

export function createStaffProbation(input: CreateStaffProbationCommand, actorUserAccountId: string, existing: StaffProbation[] = []) {
  if (existing.some((item) => item.employmentRecordId === input.employmentRecordId && ["active", "extended"].includes(item.status))) throw new Error("This Employment Record already has an active Probation.");
  const now = new Date().toISOString();
  return {
    id: `staff-probation-${uuid()}`,
    staffMemberId: input.staffMemberId as any,
    employmentRecordId: input.employmentRecordId as any,
    nursingHomeId: input.nursingHomeId as any,
    wardId: input.wardId as any,
    probationStartDate: input.probationStartDate,
    originalExpectedEndDate: input.expectedEndDate,
    currentExpectedEndDate: input.expectedEndDate,
    status: "active",
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as any,
    updatedByUserAccountId: actorUserAccountId as any,
  } satisfies StaffProbation;
}

export function scheduleProbationReviews(probation: StaffProbation, policy?: ProbationReviewSchedulePolicy): StaffProbationReview[] {
  const offsets = policy?.status === "approved" ? policy.reviewOffsetsDays : [30, 60, 90];
  const start = new Date(`${probation.probationStartDate}T00:00:00.000Z`);
  const now = new Date().toISOString();
  return offsets.map((offset, index) => {
    const scheduled = new Date(start);
    scheduled.setUTCDate(scheduled.getUTCDate() + offset);
    return {
      id: `probation-review-${uuid()}`,
      probationId: probation.id,
      staffMemberId: probation.staffMemberId,
      employmentRecordId: probation.employmentRecordId,
      nursingHomeId: probation.nursingHomeId,
      scheduledDate: scheduled.toISOString().slice(0, 10),
      reviewNumber: index + 1,
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    } satisfies StaffProbationReview;
  });
}

export function completeProbationReview(review: StaffProbationReview, outcome: StaffProbationReview["outcome"], actorUserAccountId: string, reviewedByStaffMemberId?: string) {
  const now = new Date().toISOString();
  return { ...review, status: "completed", outcome, completedAt: now, reviewedByUserAccountId: actorUserAccountId as any, reviewedByStaffMemberId: reviewedByStaffMemberId as any, updatedAt: now };
}

export function extendStaffProbation(probation: StaffProbation, newExpectedEndDate: string, reason: string, actorUserAccountId: string): { probation: StaffProbation; extension: StaffProbationExtension } {
  if (newExpectedEndDate <= probation.currentExpectedEndDate) throw new Error("The extension date must be later than the current expected end date.");
  const now = new Date().toISOString();
  return {
    probation: { ...probation, currentExpectedEndDate: newExpectedEndDate, status: "extended", updatedAt: now, updatedByUserAccountId: actorUserAccountId as any },
    extension: { id: `probation-extension-${uuid()}`, probationId: probation.id, previousExpectedEndDate: probation.currentExpectedEndDate, newExpectedEndDate, reason, approvedAt: now, approvedByUserAccountId: actorUserAccountId as any, createdAt: now, updatedAt: now },
  };
}

export function completeStaffProbation(probation: StaffProbation, status: Extract<StaffProbationStatus, "completed" | "failed" | "cancelled">, actorUserAccountId: string): StaffProbation {
  const now = new Date().toISOString();
  return { ...probation, status, outcome: status === "completed" ? "complete_passed" : status === "failed" ? "complete_failed" : "cancel", completedAt: now, completedByUserAccountId: actorUserAccountId as any, updatedAt: now, updatedByUserAccountId: actorUserAccountId as any };
}
