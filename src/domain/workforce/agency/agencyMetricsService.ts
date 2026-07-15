import type { AgencyShiftAssignment, AgencySpendAlertPolicy, AgencyTimesheet } from "@/lib/care/types";

export function getAgencyStaffTodayMetric(input: { assignments: AgencyShiftAssignment[]; nursingHomeId?: string; localDate: string }) {
  const dayStart = `${input.localDate}T00:00:00.000Z`;
  const dayEnd = `${input.localDate}T23:59:59.999Z`;
  const counted = input.assignments.filter((assignment) =>
    (!input.nursingHomeId || assignment.nursingHomeId === input.nursingHomeId) &&
    ["confirmed", "worked"].includes(assignment.status) &&
    assignment.startAt <= dayEnd &&
    assignment.endAt >= dayStart
  );
  const workerIds = new Set(counted.map((assignment) => String(assignment.agencyWorkerId)));
  const now = new Date().toISOString();
  return {
    value: workerIds.size,
    agencyShiftCount: counted.length,
    currentlyOnShiftCount: counted.filter((assignment) => assignment.startAt <= now && assignment.endAt >= now).length,
    availability: "available" as const,
    explanation: counted.length ? "Distinct Agency Workers with confirmed or worked agency shifts overlapping the selected date." : "No Agency Workers are assigned to the selected scope.",
    route: "/staff-management?metric=agency-staff-today",
    records: counted,
    generatedAt: now,
  };
}

export function getAgencySpendMetric(input: { timesheets: AgencyTimesheet[]; nursingHomeId?: string; dateFrom: string; dateTo: string; currencyCode?: string }) {
  const included = input.timesheets.filter((timesheet) =>
    (!input.nursingHomeId || timesheet.nursingHomeId === input.nursingHomeId) &&
    timesheet.status !== "rejected" &&
    timesheet.status !== "cancelled" &&
    timesheet.status !== "entered_in_error" &&
    timesheet.shiftStartAt.slice(0, 10) <= input.dateTo &&
    timesheet.shiftEndAt.slice(0, 10) >= input.dateFrom
  );
  const approved = included.filter((timesheet) => timesheet.status === "approved");
  const pending = included.filter((timesheet) => ["submitted", "pending_approval", "draft"].includes(timesheet.status));
  const disputed = included.filter((timesheet) => timesheet.status === "disputed");
  const currencyCode = approved[0]?.approvedCost?.currencyCode || input.currencyCode || "EUR";
  const approvedMinor = approved.reduce((sum, timesheet) => sum + (timesheet.approvedCost?.amountMinor ?? timesheet.calculatedCost.amountMinor), 0);
  return {
    approvedSpend: { amountMinor: approvedMinor, currencyCode },
    pendingSpend: { amountMinor: pending.reduce((sum, timesheet) => sum + timesheet.calculatedCost.amountMinor, 0), currencyCode },
    disputedSpend: { amountMinor: disputed.reduce((sum, timesheet) => sum + timesheet.calculatedCost.amountMinor, 0), currencyCode },
    value: approvedMinor,
    availability: approved.length ? "available" as const : pending.length ? "partially_available" as const : "not_configured" as const,
    explanation: approved.length ? "Approved Agency Timesheets included for the selected period." : pending.length ? `Partially available - ${pending.length} agency shifts have no approved timesheet.` : "No approved Agency Timesheets exist for the selected period.",
    route: "/staff-management?metric=agency-spend",
    records: approved,
    generatedAt: new Date().toISOString(),
  };
}

export function getAgencySpendHighMetric(input: { spendMinor: number; policies: AgencySpendAlertPolicy[]; nursingHomeId?: string; date: string }) {
  const policy = input.policies
    .filter((item) => item.status === "approved" && item.effectiveFrom <= input.date && (!item.effectiveTo || item.effectiveTo >= input.date) && (!item.nursingHomeId || item.nursingHomeId === input.nursingHomeId))
    .sort((a, b) => b.version - a.version)[0];
  if (!policy) {
    return { status: "not_configured" as const, availability: "not_configured" as const, actualValue: input.spendMinor, explanation: "Not configured - no Agency Spend threshold policy exists.", route: "/staff-management?metric=agency-spend-high", generatedAt: new Date().toISOString() };
  }
  const threshold = policy.basis === "absolute_amount" ? policy.highThreshold : undefined;
  const status = policy.criticalThreshold !== undefined && input.spendMinor >= policy.criticalThreshold ? "critical" : threshold !== undefined && input.spendMinor >= threshold ? "high" : policy.warningThreshold !== undefined && input.spendMinor >= policy.warningThreshold ? "attention" : "normal";
  return {
    status,
    availability: "available" as const,
    thresholdUsed: threshold,
    actualValue: input.spendMinor,
    variance: threshold !== undefined ? input.spendMinor - threshold : undefined,
    explanation: threshold !== undefined ? "Agency spend compared with approved threshold policy." : "Approved policy exists but does not define an absolute high threshold for this metric.",
    route: "/staff-management?metric=agency-spend-high",
    generatedAt: new Date().toISOString(),
  };
}

export function getAgencyWte(input: { timesheets: AgencyTimesheet[]; dateFrom: string; dateTo: string; nursingHomeId?: string; standardWeeklyHours: number }) {
  const approved = input.timesheets.filter((timesheet) =>
    timesheet.status === "approved" &&
    (!input.nursingHomeId || timesheet.nursingHomeId === input.nursingHomeId) &&
    timesheet.shiftStartAt.slice(0, 10) <= input.dateTo &&
    timesheet.shiftEndAt.slice(0, 10) >= input.dateFrom
  );
  const hours = approved.reduce((sum, timesheet) => sum + timesheet.hoursWorked, 0);
  return { value: input.standardWeeklyHours ? round2(hours / input.standardWeeklyHours) : undefined, hours, records: approved, missingAgencyTimesheetCount: 0 };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
