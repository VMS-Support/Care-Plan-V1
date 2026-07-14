import type { DeteriorationActionContext } from "./deteriorationIssueTypes";
import type { DeteriorationClinicalReview, DeteriorationClinicalReviewRepository } from "./deteriorationReviewTypes";

export function recordDeteriorationClinicalReview(input: Omit<DeteriorationClinicalReview, "id" | "reviewedAt" | "reviewedByUserAccountId" | "reviewedByStaffMemberId" | "createdAt">, repository: DeteriorationClinicalReviewRepository, context: DeteriorationActionContext, createId: () => string) {
  if (!context.capabilities.includes("deterioration_queue.start_review")) throw new Error("Missing capability: deterioration_queue.start_review");
  if (!input.clinicalAssessmentSummary.trim()) throw new Error("Clinical review summary is required.");
  const review: DeteriorationClinicalReview = {
    ...input,
    id: createId(),
    reviewedAt: context.occurredAt,
    reviewedByUserAccountId: context.userAccountId,
    reviewedByStaffMemberId: context.staffMemberId,
    createdAt: context.occurredAt,
  };
  repository.deteriorationClinicalReviews = [review, ...repository.deteriorationClinicalReviews];
  return review;
}
