import type { StaffLeaveRecord } from "@/lib/care/types";
import type { WorkforceDashboardMetric } from "../rostering/rosterMetricsService";

function activeOnDate(record: StaffLeaveRecord, date: string) {
  return record.status === "approved" && record.startDate <= date && record.endDate >= date;
}

function distinctStaff(records: StaffLeaveRecord[]) {
  return new Set(records.map((record) => String(record.staffMemberId))).size;
}

export function getLeaveOverviewMetrics(input: { records: StaffLeaveRecord[]; nursingHomeId?: string; date: string; upcomingDays?: number }) {
  const records = input.records.filter((record) =>
    record.status !== "entered_in_error" &&
    (!input.nursingHomeId || record.nursingHomeId === input.nursingHomeId)
  );
  const today = input.date;
  const upcomingTo = addDays(today, input.upcomingDays ?? 30);
  const annualTodayRecords = records.filter((record) => record.leaveType === "annual_leave" && activeOnDate(record, today));
  const sickTodayRecords = records.filter((record) => record.leaveType === "sick_leave" && activeOnDate(record, today));
  const upcomingRecords = records.filter((record) => record.status === "approved" && record.startDate > today && record.startDate <= upcomingTo);
  const metric = (value: number, label: string, empty: string): WorkforceDashboardMetric => ({
    value,
    availability: "available",
    explanation: value === 0 ? empty : "Calculated from approved leave records in scope.",
    route: `/staff-management?metric=${label}`,
  });
  return {
    annualLeaveToday: metric(distinctStaff(annualTodayRecords), "annual-leave-today", "No Staff Members are on Annual Leave today."),
    sickLeaveToday: metric(distinctStaff(sickTodayRecords), "sick-leave-today", "No active Sick Leave is recorded for today."),
    upcomingLeave: metric(distinctStaff(upcomingRecords), "upcoming-leave", "No approved Leave is scheduled within the selected period."),
    upcomingLeaveBreakdown: ["annual_leave", "sick_leave", "unpaid_leave", "other"].map((leaveType) => {
      const matching = upcomingRecords.filter((record) => record.leaveType === leaveType);
      return { leaveType, count: distinctStaff(matching), records: matching };
    }),
  };
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}
