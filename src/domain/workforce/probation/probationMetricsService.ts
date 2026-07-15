import type { ProbationReviewSchedulePolicy, StaffProbationReview } from "@/lib/care/types";

export function getProbationReviewsDueMetric(input: { reviews: StaffProbationReview[]; policies: ProbationReviewSchedulePolicy[]; nursingHomeId?: string; dueBy: string; date: string }) {
  const policy = input.policies.find((item) => item.status === "approved" && item.effectiveFrom <= input.date && (!item.effectiveTo || item.effectiveTo >= input.date) && (!item.nursingHomeId || item.nursingHomeId === input.nursingHomeId));
  if (!policy) {
    return { value: undefined, availability: "not_configured" as const, explanation: "Not configured - no approved Probation Review Schedule policy exists.", route: "/staff-management?metric=probation-reviews-due", records: [], generatedAt: new Date().toISOString() };
  }
  const records = input.reviews.filter((review) =>
    review.status !== "completed" &&
    review.status !== "cancelled" &&
    review.status !== "entered_in_error" &&
    (!input.nursingHomeId || review.nursingHomeId === input.nursingHomeId) &&
    review.scheduledDate <= input.dueBy
  );
  return {
    value: records.length,
    availability: "available" as const,
    explanation: records.length ? "Probation reviews due or overdue in the selected scope." : "No Probation Reviews are due within the selected period.",
    route: "/staff-management?metric=probation-reviews-due",
    records,
    generatedAt: new Date().toISOString(),
  };
}
