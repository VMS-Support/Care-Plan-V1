import type { EmploymentHomeAssignment, EmploymentRecord, RecruitmentVacancy, StaffingEstablishmentLine, StaffingEstablishmentVersion } from "@/lib/care/types";
import { getStaffingEstablishmentComparison } from "./staffingVacancyMetricsService";
import { getWorkforceVacancySummary } from "../recruitment/recruitmentMetricsService";
import { roleLabelForKey } from "../staffDirectory/staffRoleSummaryResolver";

export function getStaffingEstablishmentWorkspace(input: {
  versions: StaffingEstablishmentVersion[];
  lines: StaffingEstablishmentLine[];
  employmentRecords: EmploymentRecord[];
  homeAssignments: EmploymentHomeAssignment[];
  recruitmentVacancies: RecruitmentVacancy[];
  nursingHomeId: string;
  effectiveAt?: string;
}) {
  const versions = input.versions
    .filter((version) => String(version.nursingHomeId) === input.nursingHomeId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
  const effectiveAt = input.effectiveAt || new Date().toISOString().slice(0, 10);
  const approved = versions.find((version) => version.status === "approved" && version.effectiveFrom <= effectiveAt && (!version.effectiveTo || version.effectiveTo >= effectiveAt));
  const comparison = getStaffingEstablishmentComparison({
    version: approved,
    lines: input.lines,
    employmentRecords: input.employmentRecords,
    homeAssignments: input.homeAssignments,
    effectiveAt,
  });
  const vacancySummary = getWorkforceVacancySummary({ establishmentLines: comparison.lines, recruitmentVacancies: input.recruitmentVacancies });
  return {
    versions,
    effectiveVersion: approved,
    comparison,
    vacancySummary,
    rows: comparison.lines.map((line) => ({
      id: line.line.id,
      role: roleLabelForKey(line.line.roleKey),
      wardId: line.line.wardId ? String(line.line.wardId) : undefined,
      budgetedHeadcount: line.line.budgetedHeadcount,
      actualHeadcount: line.actualHeadcount,
      vacantHeadcount: line.vacantHeadcount,
      budgetedWte: line.line.budgetedFte,
      requiredWte: line.line.budgetedFte ?? line.line.minimumHeadcount,
      actualWte: line.actualFte,
      vacancyWte: line.vacantFte,
      vacancyPercent: line.line.budgetedFte ? Math.round((line.vacantFte / line.line.budgetedFte) * 100) : undefined,
      status: line.vacantHeadcount > 0 || line.vacantFte > 0 ? "Vacancy" : line.overEstablishedHeadcount > 0 || line.overEstablishedFte > 0 ? "Over Establishment" : "Fully Staffed",
    })),
  };
}
