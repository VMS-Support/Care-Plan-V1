import type { EmploymentRecord } from "@/lib/care/types";
import { getEmploymentFteAt, isCurrentEmployment } from "./employmentStatus";

export function getTotalFteMetric(records: EmploymentRecord[], effectiveAt = new Date().toISOString().slice(0, 10)) {
  const value = records.reduce((sum, record) => sum + getEmploymentFteAt(record, effectiveAt), 0);
  return {
    value: Number(value.toFixed(2)),
    availability: "available" as const,
    explanation: "Sum of current Employment Record FTE values in scope.",
    route: "/workforce/staff",
    generatedAt: new Date().toISOString(),
  };
}

export function getCurrentEmploymentRecords(records: EmploymentRecord[], effectiveAt?: string) {
  return records.filter((record) => isCurrentEmployment(record, effectiveAt));
}
