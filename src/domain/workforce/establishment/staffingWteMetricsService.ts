import type { AgencyTimesheet, EmploymentHomeAssignment, EmploymentRecord, StaffingEstablishmentLine, StaffingEstablishmentSummary, StaffingEstablishmentVersion, StaffingEstablishmentWtePolicy } from "@/lib/care/types";
import { getEffectiveHomeAssignmentState } from "../homeAssignments/homeAssignmentService";
import { isCurrentEmployment } from "../employment/employmentStatus";
import { getAgencyWte } from "../agency/agencyMetricsService";

export function getStaffingEstablishmentWteComparison(input: {
  version?: StaffingEstablishmentVersion;
  lines: StaffingEstablishmentLine[];
  employmentRecords: EmploymentRecord[];
  homeAssignments: EmploymentHomeAssignment[];
  agencyTimesheets: AgencyTimesheet[];
  wtePolicy?: StaffingEstablishmentWtePolicy;
  nursingHomeId: string;
  date: string;
  periodFrom: string;
  periodTo: string;
}): StaffingEstablishmentSummary {
  if (!input.version) return unavailable(input.nursingHomeId as any, "No approved Staffing Establishment exists for this Nursing Home.");
  if (!input.wtePolicy || input.wtePolicy.status !== "approved") return unavailable(input.nursingHomeId as any, "Required WTE cannot be calculated because no approved source is configured.");
  const lines = input.lines.filter((line) => line.establishmentVersionId === input.version!.id);
  const comparisonLines = lines.map((line) => {
    const assignments = input.homeAssignments.filter((assignment) => assignment.nursingHomeId === line.nursingHomeId && getEffectiveHomeAssignmentState(assignment, { employmentRecord: input.employmentRecords.find((record) => record.id === assignment.employmentRecordId), effectiveAt: input.date }) === "current");
    const actualPermanentWte = round2(assignments.reduce((sum, assignment) => {
      const employment = input.employmentRecords.find((record) => record.id === assignment.employmentRecordId);
      if (!employment || !isCurrentEmployment(employment, input.date)) return sum;
      if (!(assignment.roleKeys?.includes(line.roleKey) || employment.primaryRoleKey === line.roleKey)) return sum;
      return sum + (assignment.fteAtHome ?? (assignment.isPrimary ? employment.fteValue ?? 0 : 0));
    }, 0));
    const agency = getAgencyWte({
      timesheets: input.agencyTimesheets.filter((timesheet) => timesheet.roleKey === line.roleKey && (!line.wardId || timesheet.wardId === line.wardId)),
      nursingHomeId: line.nursingHomeId,
      dateFrom: input.periodFrom,
      dateTo: input.periodTo,
      standardWeeklyHours: input.wtePolicy.standardWeeklyHours,
    });
    const budgetedWte = line.budgetedFte;
    const requiredWte = line.budgetedFte ?? line.minimumHeadcount;
    const totalCoveredWte = round2(actualPermanentWte + (agency.value || 0));
    const budgetVacancyWte = budgetedWte === undefined ? undefined : round2(Math.max(0, budgetedWte - actualPermanentWte));
    const requiredCoverageGapWte = requiredWte === undefined ? undefined : round2(Math.max(0, requiredWte - totalCoveredWte));
    return {
      nursingHomeId: line.nursingHomeId,
      wardId: line.wardId,
      roleKey: line.roleKey,
      budgetedWte,
      requiredWte,
      actualPermanentWte,
      agencyWte: agency.value,
      totalCoveredWte,
      budgetVacancyWte,
      requiredCoverageGapWte,
      vacancyPercent: budgetedWte ? Math.round(((budgetVacancyWte || 0) / budgetedWte) * 100) : undefined,
      agencyPercent: totalCoveredWte ? Math.round(((agency.value || 0) / totalCoveredWte) * 100) : undefined,
      availability: "available" as const,
      explanation: "Budgeted, actual and agency WTE compared for the selected period.",
    };
  });
  const total = (field: keyof typeof comparisonLines[number]) => round2(comparisonLines.reduce((sum, line) => sum + (typeof line[field] === "number" ? line[field] as number : 0), 0));
  const budgetedWte = total("budgetedWte");
  const actualPermanentWte = total("actualPermanentWte");
  const agencyWte = total("agencyWte");
  const totalCoveredWte = round2(actualPermanentWte + agencyWte);
  const budgetVacancyWte = total("budgetVacancyWte");
  const requiredWte = total("requiredWte");
  const requiredCoverageGapWte = total("requiredCoverageGapWte");
  return {
    nursingHomeId: input.nursingHomeId as any,
    establishmentVersionId: input.version.id,
    budgetedWte,
    requiredWte,
    actualPermanentWte,
    agencyWte,
    totalCoveredWte,
    budgetVacancyWte,
    requiredCoverageGapWte,
    vacancyPercent: budgetedWte ? Math.round((budgetVacancyWte / budgetedWte) * 100) : undefined,
    agencyPercent: totalCoveredWte ? Math.round((agencyWte / totalCoveredWte) * 100) : undefined,
    safeStaffingCoveragePercent: requiredWte ? Math.round((totalCoveredWte / requiredWte) * 100) : undefined,
    safeStaffingStatus: requiredWte ? (totalCoveredWte >= requiredWte ? "safe" : "gap") : "unable_to_determine",
    missingEmploymentWteCount: input.employmentRecords.filter((record) => isCurrentEmployment(record, input.date) && record.fteValue === undefined).length,
    missingHomeAllocationCount: 0,
    missingAgencyTimesheetCount: input.agencyTimesheets.filter((timesheet) => timesheet.status !== "approved").length,
    lines: comparisonLines,
    availability: "available",
    explanation: "WTE comparison generated from approved Establishment, current Employment/Home Assignments and approved Agency Timesheets.",
    generatedAt: new Date().toISOString(),
  };
}

export function getWteMetric(summary: StaffingEstablishmentSummary, field: keyof Pick<StaffingEstablishmentSummary, "budgetedWte" | "requiredWte" | "actualPermanentWte" | "agencyWte" | "budgetVacancyWte" | "vacancyPercent" | "agencyPercent" | "safeStaffingCoveragePercent">, route: string) {
  return { value: summary[field] as number | undefined, availability: summary.availability, explanation: summary.explanation, source: "staffing_establishment_wte", route, generatedAt: summary.generatedAt };
}

function unavailable(nursingHomeId: StaffingEstablishmentSummary["nursingHomeId"], explanation: string): StaffingEstablishmentSummary {
  return { nursingHomeId, missingEmploymentWteCount: 0, missingHomeAllocationCount: 0, missingAgencyTimesheetCount: 0, lines: [], availability: "not_configured", explanation, generatedAt: new Date().toISOString() };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
