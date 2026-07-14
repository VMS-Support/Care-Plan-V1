import type {
  CarePlanProblem,
  ProblemIntervention,
  ProblemReview,
  ResidentCarePlan,
} from "../../src/lib/care/types";
import type { RltDomainId } from "../../src/lib/care/rlt";

export const RLT_TEST_NOW = "2026-07-14T10:00:00.000Z";

export const createTestCarePlan = (input: {
  id: string;
  residentId: string;
  nursingHomeId: string;
  status: ResidentCarePlan["status"];
}): ResidentCarePlan => ({
  id: input.id,
  facilityId: input.nursingHomeId,
  residentId: input.residentId,
  status: input.status,
  createdAt: RLT_TEST_NOW,
  createdBy: "staff-fixture",
});

export const createTestCarePlanItem = (input: {
  residentId: string;
  carePlanId: string;
  carePlanItemId: string;
  domainId: RltDomainId;
  nursingHomeId: string;
  status: CarePlanProblem["status"];
  title?: string;
  reviewDate?: string;
}): CarePlanProblem => ({
  id: input.carePlanItemId,
  facilityId: input.nursingHomeId,
  residentCarePlanId: input.carePlanId,
  residentId: input.residentId,
  category: "custom",
  rltDomainId: input.domainId,
  problemStatement: input.title || `Care need ${input.carePlanItemId}`,
  riskLevel: "medium",
  createdBy: "staff-fixture",
  createdAt: RLT_TEST_NOW,
  evaluationDate: "2026-08-01",
  reviewDate: input.reviewDate || "2026-08-14",
  status: input.status,
});

export const createTestCareAction = (input: {
  id: string;
  residentId: string;
  carePlanItemId: string;
  nursingHomeId: string;
  status: ProblemIntervention["status"];
  frequencyType?: ProblemIntervention["frequencyType"];
}): ProblemIntervention => ({
  id: input.id,
  facilityId: input.nursingHomeId,
  problemId: input.carePlanItemId,
  residentId: input.residentId,
  name: `Action ${input.id}`,
  frequencyType: input.frequencyType || "daily",
  assignedRole: "nurse",
  startDate: "2026-07-01",
  reviewDate: "2026-08-01",
  endDate: "2026-09-01",
  status: input.status,
  createdAt: RLT_TEST_NOW,
  createdBy: "staff-fixture",
  createdByRole: "nurse",
});

export const createTestCarePlanReview = (input: {
  id: string;
  carePlanItemId: string;
  reviewDate: string;
  nursingHomeId: string;
}): ProblemReview => ({
  id: input.id,
  facilityId: input.nursingHomeId,
  problemId: input.carePlanItemId,
  reviewDate: input.reviewDate,
  reviewedById: "staff-reviewer",
  reviewedByName: "Nurse Reviewer",
  role: "nurse",
  outcome: "continue",
});

export const createLegacyCarePlanFixture = (input: {
  id: string;
  residentId: string;
  carePlanId: string;
  nursingHomeId: string;
  category: CarePlanProblem["category"];
  title: string;
}): CarePlanProblem => ({
  id: input.id,
  facilityId: input.nursingHomeId,
  residentCarePlanId: input.carePlanId,
  residentId: input.residentId,
  category: input.category,
  problemStatement: input.title,
  riskLevel: "medium",
  createdBy: "legacy-import",
  createdAt: "2020-01-01T00:00:00.000Z",
  evaluationDate: "2020-02-01",
  reviewDate: "2020-02-01",
  status: "active",
});
