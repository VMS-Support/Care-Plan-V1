import type { EmploymentRecord, EmploymentRecordStatus } from "@/lib/care/types";

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentRecordStatus, string> = {
  draft: "Draft",
  pre_employment: "Pre-Employment",
  active: "Active",
  on_leave: "On Leave",
  suspended: "Suspended",
  notice_period: "Notice Period",
  ended: "Ended",
  cancelled: "Cancelled",
  entered_in_error: "Entered in Error",
};

export const EMPLOYMENT_CONTRACT_TYPE_LABELS = {
  permanent_full_time: "Permanent - Full Time",
  permanent_part_time: "Permanent - Part Time",
  fixed_term_full_time: "Fixed Term - Full Time",
  fixed_term_part_time: "Fixed Term - Part Time",
  casual: "Casual",
  zero_hours: "Zero Hours",
  temporary: "Temporary",
  relief: "Relief",
  agency: "Agency",
  secondment: "Secondment",
  locum: "Locum",
  volunteer: "Volunteer",
  other: "Other",
} as const;

export type EffectiveEmploymentState = "not_started" | "current" | "temporarily_not_working" | "ending" | "ended" | "invalid";

export function normaliseEmploymentRecordStatus(record: EmploymentRecord): EmploymentRecordStatus {
  if (record.status) return record.status;
  if (record.employmentStatus === "planned") return "pre_employment";
  if (record.employmentStatus === "active") return "active";
  if (record.employmentStatus === "on_leave") return "on_leave";
  if (record.employmentStatus === "suspended") return "suspended";
  return "ended";
}

export function getEffectiveEmploymentStatus(record: EmploymentRecord, effectiveAt = new Date().toISOString().slice(0, 10)): EffectiveEmploymentState {
  const status = normaliseEmploymentRecordStatus(record);
  if (status === "entered_in_error" || status === "cancelled") return "invalid";
  if (record.startDate && record.startDate > effectiveAt) return "not_started";
  if (record.endDate && record.endDate < effectiveAt) return "ended";
  if (status === "ended") return "ended";
  if (status === "on_leave" || status === "suspended") return "temporarily_not_working";
  if (status === "notice_period") return "ending";
  if (status === "active") return "current";
  if (status === "pre_employment") return "not_started";
  return "invalid";
}

export function isCurrentEmployment(record: EmploymentRecord, effectiveAt?: string) {
  return ["current", "temporarily_not_working", "ending"].includes(getEffectiveEmploymentStatus(record, effectiveAt));
}

export function getEmploymentFteAt(record: EmploymentRecord, effectiveAt?: string) {
  return isCurrentEmployment(record, effectiveAt) ? Number(record.fteValue || 0) : 0;
}

export function normaliseContractedHoursPerWeek(record: EmploymentRecord) {
  if (record.contractedHoursPerWeek !== undefined) return record.contractedHoursPerWeek;
  if (record.contractedHoursPerPeriod === undefined) return undefined;
  if (record.contractedHoursPeriod === "fortnight") return record.contractedHoursPerPeriod / 2;
  if (record.contractedHoursPeriod === "month") return undefined;
  return record.contractedHoursPerPeriod;
}
