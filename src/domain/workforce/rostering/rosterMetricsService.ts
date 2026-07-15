import type { PlannedShift, RosterPeriod, RosterShiftRequirement } from "@/lib/care/types";

export interface WorkforceDashboardMetric {
  value?: number;
  availability: "available" | "partially_available" | "not_configured" | "source_module_unavailable" | "permission_restricted" | "error";
  explanation: string;
  route: string;
}

export function getRosterOverviewMetrics(input: {
  periods: RosterPeriod[];
  requirements: RosterShiftRequirement[];
  plannedShifts: PlannedShift[];
  nursingHomeId?: string;
  dateFrom: string;
  dateTo: string;
}) {
  const periods = input.periods.filter((period) =>
    (!input.nursingHomeId || period.nursingHomeId === input.nursingHomeId) &&
    period.dateFrom <= input.dateTo &&
    period.dateTo >= input.dateFrom &&
    ["approved", "published", "locked", "closed"].includes(period.status)
  );
  if (!periods.length) {
    const metric = (label: string): WorkforceDashboardMetric => ({ availability: "not_configured", explanation: `Not configured - no published or approved roster exists for this week.`, route: `/staff-management?metric=${label}` });
    return { totalShifts: metric("total-shifts"), filledShifts: metric("filled-shifts"), vacantShifts: metric("vacant-shifts"), toBeConfirmed: metric("to-be-confirmed"), periodIds: [] as string[] };
  }
  const periodIds = new Set(periods.map((period) => period.id));
  const requirements = input.requirements.filter((requirement) => periodIds.has(requirement.rosterPeriodId) && requirement.status !== "entered_in_error" && requirement.status !== "cancelled");
  const planned = input.plannedShifts.filter((shift) => periodIds.has(shift.rosterPeriodId) && shift.status !== "entered_in_error" && shift.status !== "cancelled" && shift.status !== "replaced");
  const total = requirements.reduce((sum, requirement) => sum + requirement.requiredCount, 0);
  const filled = planned.filter((shift) => ["assigned", "confirmed", "published"].includes(shift.status) && shift.assignedStaffMemberId).length;
  const toBeConfirmed = planned.filter((shift) => shift.status === "to_be_confirmed" || (shift.confirmationRequired && shift.status === "assigned")).length;
  const explicitlyVacant = planned.filter((shift) => shift.status === "vacant").length;
  const uncovered = Math.max(0, total - filled - toBeConfirmed);
  const vacant = explicitlyVacant + uncovered;
  const metric = (value: number, label: string): WorkforceDashboardMetric => ({ value, availability: "available", explanation: "Calculated from required shift positions and planned roster assignments for the selected week.", route: `/staff-management?metric=${label}` });
  return {
    totalShifts: metric(total, "total-shifts"),
    filledShifts: metric(filled, "filled-shifts"),
    vacantShifts: metric(vacant, "vacant-shifts"),
    toBeConfirmed: metric(toBeConfirmed, "to-be-confirmed"),
    periodIds: [...periodIds],
  };
}
