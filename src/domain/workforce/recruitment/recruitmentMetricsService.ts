import type { RecruitmentOffer, RecruitmentVacancy, StaffingEstablishmentLine } from "@/lib/care/types";

export interface WorkforceVacancySummaryItem {
  nursingHomeId: string;
  wardId?: string;
  roleKey: string;
  roleLabel: string;
  establishmentLineId?: string;
  vacantHeadcount?: number;
  vacantFte?: number;
  recruitmentOpenHeadcount?: number;
  recruitmentOpenFte?: number;
  unadvertisedHeadcount?: number;
  unadvertisedFte?: number;
  vacancyStatus: "not_recruiting" | "recruiting" | "offer_stage" | "start_scheduled" | "partially_filled" | "filled" | "unavailable";
  urgency: "low" | "medium" | "high" | "critical";
  route: string;
}

const recruitingStatuses = new Set<RecruitmentVacancy["status"]>(["open", "advertising", "applications_open", "shortlisting", "interviewing", "offer_pending", "offer_sent", "offer_accepted", "pre_employment_checks", "start_scheduled"]);
const offerStatuses = new Set<RecruitmentVacancy["status"]>(["offer_pending", "offer_sent", "offer_accepted", "pre_employment_checks"]);

export function getRecruitmentVacancyStatus(vacancies: RecruitmentVacancy[]) {
  const active = vacancies.filter((vacancy) => recruitingStatuses.has(vacancy.status) && vacancy.status !== "entered_in_error");
  if (!active.length) return "not_recruiting" as const;
  if (active.some((vacancy) => vacancy.status === "start_scheduled")) return "start_scheduled" as const;
  if (active.some((vacancy) => offerStatuses.has(vacancy.status))) return "offer_stage" as const;
  if (active.some((vacancy) => vacancy.positionsFilled > 0 || (vacancy.fteFilled || 0) > 0)) return "partially_filled" as const;
  return "recruiting" as const;
}

export function getWorkforceVacancySummary(input: {
  establishmentLines: Array<{ line: StaffingEstablishmentLine; vacantHeadcount: number; vacantFte: number }>;
  recruitmentVacancies: RecruitmentVacancy[];
}): WorkforceVacancySummaryItem[] {
  return input.establishmentLines.map(({ line, vacantHeadcount, vacantFte }) => {
    const matchingVacancies = input.recruitmentVacancies.filter((vacancy) =>
      vacancy.status !== "entered_in_error" &&
      vacancy.nursingHomeId === line.nursingHomeId &&
      vacancy.roleKey === line.roleKey &&
      (!line.wardId || vacancy.wardId === line.wardId) &&
      (!vacancy.establishmentLineId || vacancy.establishmentLineId === line.id)
    );
    const recruitmentOpenHeadcount = matchingVacancies.reduce((sum, vacancy) => sum + Math.max(0, (vacancy.positionsRequired || 0) - vacancy.positionsFilled), 0);
    const recruitmentOpenFte = matchingVacancies.reduce((sum, vacancy) => sum + Math.max(0, (vacancy.fteRequired || 0) - (vacancy.fteFilled || 0)), 0);
    return {
      nursingHomeId: line.nursingHomeId,
      wardId: line.wardId,
      roleKey: line.roleKey,
      roleLabel: line.roleKey,
      establishmentLineId: line.id,
      vacantHeadcount,
      vacantFte,
      recruitmentOpenHeadcount,
      recruitmentOpenFte,
      unadvertisedHeadcount: Math.max(0, vacantHeadcount - recruitmentOpenHeadcount),
      unadvertisedFte: Math.max(0, vacantFte - recruitmentOpenFte),
      vacancyStatus: getRecruitmentVacancyStatus(matchingVacancies),
      urgency: matchingVacancies.sort((a, b) => urgencyRank(b.priority) - urgencyRank(a.priority))[0]?.priority || (vacantHeadcount >= 5 ? "high" : vacantHeadcount >= 2 ? "medium" : "low"),
      route: `/staff-management?establishmentLineId=${line.id}`,
    };
  });
}

export function getRecruitmentPipelineSummary(input: { vacancies: RecruitmentVacancy[]; offers: RecruitmentOffer[] }) {
  const activeVacancies = input.vacancies.filter((vacancy) => recruitingStatuses.has(vacancy.status));
  return {
    activeVacancies: activeVacancies.length,
    inAdvertising: activeVacancies.filter((vacancy) => vacancy.status === "advertising" || vacancy.status === "applications_open").length,
    interviewing: activeVacancies.filter((vacancy) => vacancy.status === "interviewing" || vacancy.currentInterviewStage?.includes("interview")).length,
    offersPending: input.offers.filter((offer) => offer.status === "sent" || offer.status === "approval_required").length,
    startsScheduled: activeVacancies.filter((vacancy) => vacancy.status === "start_scheduled").length,
  };
}

function urgencyRank(value: RecruitmentVacancy["priority"]) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[value];
}
