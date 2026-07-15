import type {
  PlannedShift,
  RecruitmentOffer,
  RecruitmentVacancy,
  RosterPeriod,
  RosterShiftRequirement,
  StaffLeaveRecord,
  StaffingEstablishmentLine,
  StaffingEstablishmentVersion,
  EmploymentRecord,
  EmploymentHomeAssignment,
} from "@/lib/care/types";
import { getStaffingEstablishmentComparison, getVacantPositionsMetric } from "../establishment/staffingVacancyMetricsService";
import { getWorkforceVacancySummary } from "../recruitment/recruitmentMetricsService";
import { getRosterOverviewMetrics } from "../rostering/rosterMetricsService";
import { getLeaveOverviewMetrics } from "../leave/staffLeaveMetricsService";

export function getWorkforceRecruitmentRosterLeaveDashboardSummary(input: {
  establishmentVersion?: StaffingEstablishmentVersion;
  establishmentLines: StaffingEstablishmentLine[];
  employmentRecords: EmploymentRecord[];
  homeAssignments: EmploymentHomeAssignment[];
  recruitmentVacancies: RecruitmentVacancy[];
  recruitmentOffers: RecruitmentOffer[];
  rosterPeriods: RosterPeriod[];
  rosterShiftRequirements: RosterShiftRequirement[];
  plannedShifts: PlannedShift[];
  staffLeaveRecords: StaffLeaveRecord[];
  nursingHomeId?: string;
  date: string;
  weekFrom: string;
  weekTo: string;
}) {
  const establishmentComparison = getStaffingEstablishmentComparison({
    version: input.establishmentVersion,
    lines: input.establishmentLines,
    employmentRecords: input.employmentRecords,
    homeAssignments: input.homeAssignments,
    effectiveAt: input.date,
  });
  const vacancySummary = getWorkforceVacancySummary({
    establishmentLines: establishmentComparison.lines,
    recruitmentVacancies: input.recruitmentVacancies,
  });
  return {
    vacantPositions: getVacantPositionsMetric({
      version: input.establishmentVersion,
      lines: input.establishmentLines,
      employmentRecords: input.employmentRecords,
      homeAssignments: input.homeAssignments,
      effectiveAt: input.date,
    }),
    topVacantPositions: vacancySummary
      .filter((item) => (item.vacantHeadcount || 0) > 0 || (item.vacantFte || 0) > 0)
      .sort((a, b) => urgencyRank(b.urgency) - urgencyRank(a.urgency) || (b.vacantHeadcount || 0) - (a.vacantHeadcount || 0)),
    rosterOverview: getRosterOverviewMetrics({
      periods: input.rosterPeriods,
      requirements: input.rosterShiftRequirements,
      plannedShifts: input.plannedShifts,
      nursingHomeId: input.nursingHomeId,
      dateFrom: input.weekFrom,
      dateTo: input.weekTo,
    }),
    leaveOverview: getLeaveOverviewMetrics({
      records: input.staffLeaveRecords,
      nursingHomeId: input.nursingHomeId,
      date: input.date,
      upcomingDays: 30,
    }),
    generatedAt: new Date().toISOString(),
    sourceFreshness: [
      { source: "staffing_establishment", availability: establishmentComparison.availability },
      { source: "recruitment", availability: input.recruitmentVacancies.length ? "available" : "not_configured" },
      { source: "rostering", availability: input.rosterPeriods.length ? "available" : "not_configured" },
      { source: "leave", availability: "available" },
    ],
  };
}

function urgencyRank(value: "low" | "medium" | "high" | "critical") {
  return { low: 1, medium: 2, high: 3, critical: 4 }[value];
}
