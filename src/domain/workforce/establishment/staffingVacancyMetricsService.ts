import type { EmploymentHomeAssignment, EmploymentRecord, StaffingEstablishmentLine, StaffingEstablishmentVersion } from "@/lib/care/types";
import { getEffectiveHomeAssignmentState } from "../homeAssignments/homeAssignmentService";
import { isCurrentEmployment } from "../employment/employmentStatus";

export interface EstablishmentVacancyRequirement {
  nursingHomeId: string;
  wardId?: string;
  roleKey: string;
  vacantHeadcount?: number;
  vacantFte?: number;
  establishmentLineId: string;
  effectiveAt: string;
}

export interface SafeStaffingEstablishmentInput {
  nursingHomeId: string;
  wardId?: string;
  shiftId?: string;
  establishmentLines: Array<{ roleKey: string; minimumHeadcount?: number; minimumRegisteredStaff?: number; budgetedFte?: number }>;
  wardCompetencyRequirements: Array<{ competencyDefinitionId: string; minimumFullyCompetentStaffPerShift?: number }>;
}

export function getEffectiveStaffingEstablishment(input: { versions: StaffingEstablishmentVersion[]; nursingHomeId: string; effectiveAt?: string }) {
  const effectiveAt = input.effectiveAt || new Date().toISOString().slice(0, 10);
  return input.versions
    .filter((version) => version.nursingHomeId === input.nursingHomeId && version.status === "approved" && version.effectiveFrom <= effectiveAt && (!version.effectiveTo || version.effectiveTo >= effectiveAt))
    .sort((a, b) => b.versionNumber - a.versionNumber)[0];
}

export function getStaffingEstablishmentComparison(input: { version?: StaffingEstablishmentVersion; lines: StaffingEstablishmentLine[]; employmentRecords: EmploymentRecord[]; homeAssignments: EmploymentHomeAssignment[]; effectiveAt?: string }) {
  if (!input.version) return { availability: "not_configured" as const, explanation: "No approved Staffing Establishment exists for this Nursing Home.", lines: [], totalVacantHeadcount: undefined, totalVacantFte: undefined, vacancyPercentage: undefined };
  const lines = input.lines.filter((line) => line.establishmentVersionId === input.version!.id).map((line) => {
    const currentAssignments = input.homeAssignments.filter((assignment) => assignment.nursingHomeId === line.nursingHomeId && getEffectiveHomeAssignmentState(assignment, { employmentRecord: input.employmentRecords.find((record) => record.id === assignment.employmentRecordId), effectiveAt: input.effectiveAt }) === "current");
    const filledStaffIds = new Set(currentAssignments.filter((assignment) => {
      const employment = input.employmentRecords.find((record) => record.id === assignment.employmentRecordId);
      return employment && isCurrentEmployment(employment, input.effectiveAt) && (assignment.roleKeys?.includes(line.roleKey) || employment.primaryRoleKey === line.roleKey);
    }).map((assignment) => String(assignment.staffMemberId)));
    const actualHeadcount = filledStaffIds.size;
    const actualFte = currentAssignments.reduce((sum, assignment) => {
      const employment = input.employmentRecords.find((record) => record.id === assignment.employmentRecordId);
      if (!employment || !isCurrentEmployment(employment, input.effectiveAt)) return sum;
      if (!(assignment.roleKeys?.includes(line.roleKey) || employment.primaryRoleKey === line.roleKey)) return sum;
      return sum + (assignment.fteAtHome ?? (assignment.isPrimary ? employment.fteValue ?? 0 : 0));
    }, 0);
    return {
      line,
      actualHeadcount,
      actualFte,
      vacantHeadcount: Math.max(0, (line.budgetedHeadcount || 0) - actualHeadcount),
      vacantFte: Math.max(0, (line.budgetedFte || 0) - actualFte),
      overEstablishedHeadcount: Math.max(0, actualHeadcount - (line.budgetedHeadcount || 0)),
      overEstablishedFte: Math.max(0, actualFte - (line.budgetedFte || 0)),
    };
  });
  const totalBudgeted = lines.reduce((sum, line) => sum + (line.line.budgetedHeadcount || 0), 0);
  const totalVacantHeadcount = lines.reduce((sum, line) => sum + line.vacantHeadcount, 0);
  const totalVacantFte = lines.reduce((sum, line) => sum + line.vacantFte, 0);
  return {
    availability: "available" as const,
    explanation: "Approved Establishment compared with current qualifying Home Assignments.",
    lines,
    totalVacantHeadcount,
    totalVacantFte,
    vacancyPercentage: totalBudgeted ? Math.round((totalVacantHeadcount / totalBudgeted) * 100) : 0,
  };
}

export function getVacantPositionsMetric(input: Parameters<typeof getStaffingEstablishmentComparison>[0]) {
  const comparison = getStaffingEstablishmentComparison(input);
  return { value: comparison.totalVacantHeadcount, percentage: comparison.vacancyPercentage, availability: comparison.availability, explanation: comparison.explanation, lines: comparison.lines, route: "/staff-management?metric=vacancies", generatedAt: new Date().toISOString() };
}

export function getTopVacantPositions(input: Parameters<typeof getStaffingEstablishmentComparison>[0]) {
  return getStaffingEstablishmentComparison(input).lines
    .filter((line) => line.vacantHeadcount > 0 || line.vacantFte > 0)
    .sort((a, b) => b.vacantHeadcount - a.vacantHeadcount || b.vacantFte - a.vacantFte)
    .map((line) => ({ roleKey: line.line.roleKey, wardId: line.line.wardId, vacantHeadcount: line.vacantHeadcount, vacantFte: line.vacantFte, establishmentLineId: line.line.id, urgency: line.vacantHeadcount >= 5 ? "high" : line.vacantHeadcount >= 2 ? "medium" : "low", route: `/staff-management?establishmentLineId=${line.line.id}` }));
}
