export interface DeteriorationClinicalReview {
  id: string;
  deteriorationIssueId: string;
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  reviewedAt: string;
  reviewedByUserAccountId: string;
  reviewedByStaffMemberId?: string;
  clinicalAssessmentSummary: string;
  decision: "continue_monitoring" | "repeat_observations" | "escalate" | "resolve" | "dismiss" | "transfer_considered" | "other";
  followUpRequired: boolean;
  followUpDueAt?: string;
  linkedEscalationRecordId?: string;
  createdAt: string;
}

export interface DeteriorationClinicalReviewRepository {
  deteriorationClinicalReviews: DeteriorationClinicalReview[];
}
