import type {
  RecruitmentAdvertisingSource,
  RecruitmentCandidate,
  RecruitmentCandidateStatus,
  RecruitmentInterviewStageKey,
  RecruitmentOffer,
  RecruitmentVacancy,
  RecruitmentVacancyStatus,
  StaffingEstablishmentLine,
  StaffingEstablishmentVersion,
  UserAccount,
} from "@/lib/care/types";

export const DEFAULT_RECRUITMENT_ADVERTISING_SOURCES: RecruitmentAdvertisingSource[] = [
  { id: "recruitment-source-company-website", code: "company_website", name: "Company Website", category: "company_website", active: true, createdAt: "2026-07-15T00:00:00.000Z", updatedAt: "2026-07-15T00:00:00.000Z" },
  { id: "recruitment-source-jobs-ie", code: "jobs_ie", name: "Jobs.ie", category: "job_board", active: true, createdAt: "2026-07-15T00:00:00.000Z", updatedAt: "2026-07-15T00:00:00.000Z" },
  { id: "recruitment-source-indeed", code: "indeed", name: "Indeed", category: "job_board", active: true, createdAt: "2026-07-15T00:00:00.000Z", updatedAt: "2026-07-15T00:00:00.000Z" },
  { id: "recruitment-source-agency", code: "agency", name: "Recruitment Agency", category: "agency", active: true, createdAt: "2026-07-15T00:00:00.000Z", updatedAt: "2026-07-15T00:00:00.000Z" },
  { id: "recruitment-source-internal", code: "internal", name: "Internal Recruitment", category: "internal", active: true, createdAt: "2026-07-15T00:00:00.000Z", updatedAt: "2026-07-15T00:00:00.000Z" },
  { id: "recruitment-source-referral", code: "employee_referral", name: "Employee Referral", category: "referral", active: true, createdAt: "2026-07-15T00:00:00.000Z", updatedAt: "2026-07-15T00:00:00.000Z" },
];

export interface CreateRecruitmentVacancyCommand {
  nursingHomeId: string;
  wardId?: string;
  establishmentVersion?: StaffingEstablishmentVersion;
  establishmentLine?: StaffingEstablishmentLine;
  jobTitle: string;
  roleKey: string;
  employmentCategory?: string;
  contractType?: RecruitmentVacancy["contractType"];
  employmentBasis: RecruitmentVacancy["employmentBasis"];
  positionsRequired?: number;
  fteRequired?: number;
  hoursPerWeekRequired?: number;
  priority: RecruitmentVacancy["priority"];
  targetStartDate?: string;
  plannedStartDate?: string;
  advertisingSourceIds?: string[];
  hiringManagerStaffMemberId?: string;
  sourceReason: RecruitmentVacancy["sourceReason"];
  sourceReference?: string;
  notes?: string;
  clientRequestId?: string;
}

export interface AddRecruitmentCandidateCommand {
  recruitmentVacancyId: string;
  firstName: string;
  surname: string;
  email?: string;
  phone?: string;
  applicationDate?: string;
  plannedStartDate?: string;
}

export interface CreateRecruitmentOfferCommand {
  recruitmentVacancyId: string;
  candidateId: string;
  proposedRoleKey: string;
  proposedNursingHomeId: string;
  proposedWardId?: string;
  proposedContractType?: RecruitmentOffer["proposedContractType"];
  proposedFte?: number;
  proposedHoursPerWeek?: number;
  proposedStartDate?: string;
  notes?: string;
}

const uuid = () => Math.random().toString(36).slice(2, 10);

function assertPositive(value: number | undefined, label: string) {
  if (value !== undefined && value <= 0) throw new Error(`${label} must be greater than zero.`);
}

function requiredQuantity(input: Pick<RecruitmentVacancy, "employmentBasis" | "positionsRequired" | "fteRequired" | "hoursPerWeekRequired">) {
  if (input.employmentBasis === "headcount") return input.positionsRequired;
  if (input.employmentBasis === "fte") return input.fteRequired;
  return input.hoursPerWeekRequired;
}

export function createRecruitmentVacancy(input: CreateRecruitmentVacancyCommand, actorUserAccountId: UserAccount["id"] | string): RecruitmentVacancy {
  assertPositive(input.positionsRequired, "Positions required");
  assertPositive(input.fteRequired, "FTE required");
  assertPositive(input.hoursPerWeekRequired, "Hours required");
  if (!requiredQuantity(input)) throw new Error("A vacancy quantity is required for the selected basis.");
  const now = new Date().toISOString();
  return {
    id: `recruitment-vacancy-${uuid()}`,
    enterpriseId: input.establishmentVersion?.enterpriseId,
    nursingHomeId: input.nursingHomeId as any,
    wardId: input.wardId as any,
    establishmentLineId: input.establishmentLine?.id,
    establishmentSource: input.establishmentVersion && input.establishmentLine ? {
      establishmentVersionId: input.establishmentVersion.id,
      establishmentLineId: input.establishmentLine.id,
      authorisedVacantHeadcount: input.establishmentLine.budgetedHeadcount,
      authorisedVacantFte: input.establishmentLine.budgetedFte,
      vacancySnapshotAt: now,
    } : undefined,
    jobTitle: input.jobTitle,
    roleKey: input.roleKey,
    employmentCategory: input.employmentCategory,
    contractType: input.contractType,
    employmentBasis: input.employmentBasis,
    positionsRequired: input.positionsRequired,
    fteRequired: input.fteRequired,
    hoursPerWeekRequired: input.hoursPerWeekRequired,
    positionsFilled: 0,
    fteFilled: 0,
    status: "draft",
    priority: input.priority,
    requestedAt: now,
    targetStartDate: input.targetStartDate,
    plannedStartDate: input.plannedStartDate,
    advertisingSourceIds: input.advertisingSourceIds || [],
    currentInterviewStage: "not_started",
    hiringManagerStaffMemberId: input.hiringManagerStaffMemberId as any,
    sourceReason: input.sourceReason,
    sourceReference: input.sourceReference,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as any,
    updatedByUserAccountId: actorUserAccountId as any,
  };
}

export function transitionRecruitmentVacancy(vacancy: RecruitmentVacancy, status: RecruitmentVacancyStatus, actorUserAccountId: UserAccount["id"] | string): RecruitmentVacancy {
  const now = new Date().toISOString();
  return {
    ...vacancy,
    status,
    approvedAt: status === "approved" ? now : vacancy.approvedAt,
    updatedAt: now,
    updatedByUserAccountId: actorUserAccountId as any,
  };
}

export function addRecruitmentCandidate(input: AddRecruitmentCandidateCommand): RecruitmentCandidate {
  const now = new Date().toISOString();
  return {
    id: `recruitment-candidate-${uuid()}`,
    recruitmentVacancyId: input.recruitmentVacancyId as any,
    firstName: input.firstName,
    surname: input.surname,
    email: input.email,
    phone: input.phone,
    status: "applied",
    currentStage: "applications_received",
    applicationDate: input.applicationDate || now.slice(0, 10),
    plannedStartDate: input.plannedStartDate,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateCandidateStage(candidate: RecruitmentCandidate, stage: RecruitmentInterviewStageKey, status?: RecruitmentCandidateStatus): RecruitmentCandidate {
  return { ...candidate, currentStage: stage, status: status || candidate.status, updatedAt: new Date().toISOString() };
}

export function createRecruitmentOffer(input: CreateRecruitmentOfferCommand): RecruitmentOffer {
  const now = new Date().toISOString();
  return {
    id: `recruitment-offer-${uuid()}`,
    recruitmentVacancyId: input.recruitmentVacancyId as any,
    candidateId: input.candidateId as any,
    status: "draft",
    proposedRoleKey: input.proposedRoleKey,
    proposedNursingHomeId: input.proposedNursingHomeId as any,
    proposedWardId: input.proposedWardId as any,
    proposedContractType: input.proposedContractType,
    proposedFte: input.proposedFte,
    proposedHoursPerWeek: input.proposedHoursPerWeek,
    proposedStartDate: input.proposedStartDate,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
}

export function transitionRecruitmentOffer(offer: RecruitmentOffer, status: RecruitmentOffer["status"]): RecruitmentOffer {
  const now = new Date().toISOString();
  return {
    ...offer,
    status,
    sentAt: status === "sent" ? now : offer.sentAt,
    respondedAt: status === "accepted" || status === "declined" ? now : offer.respondedAt,
    updatedAt: now,
  };
}
