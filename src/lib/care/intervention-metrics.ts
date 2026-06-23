import { FrequencyType } from "@/lib/care/types";

/**
 * Calculate expected occurrences of an intervention based on frequency type and date range
 * @param frequencyType - The frequency of the intervention
 * @param startDate - Start date (ISO string or Date)
 * @param endDate - End date (ISO string or Date)
 * @returns Expected number of occurrences
 */
export function calculateExpectedOccurrences(
  frequencyType: FrequencyType,
  startDate: string | Date,
  endDate: string | Date,
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate number of days
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Map frequency types to occurrences per day
  const frequencyMap: Record<FrequencyType, number> = {
    daily: 1,
    twice_daily: 2,
    three_times_daily: 3,
    four_times_daily: 4,
    six_times_daily: 6,
    every_2_hours: 12,
    every_4_hours: 6,
    every_6_hours: 4,
    every_8_hours: 3,
    every_12_hours: 2,
    weekly: 1 / 7,
    fortnightly: 1 / 14,
    monthly: 1 / 30,
    as_needed: 0, // Cannot calculate for as_needed
    per_shift: 1, // Assume 1 per shift = 1 per day
  };

  const occurrencesPerDay = frequencyMap[frequencyType];

  if (occurrencesPerDay === 0) {
    return 0; // Cannot calculate for as_needed
  }

  return Math.ceil(daysDiff * occurrencesPerDay);
}

/**
 * Calculate compliance percentage based on completed vs expected occurrences
 * @param completed - Number of completed occurrences
 * @param expected - Expected number of occurrences
 * @returns Compliance percentage (0-100)
 */
export function calculateCompliancePercentage(completed: number, expected: number): number {
  if (expected === 0) {
    return 0;
  }
  return Math.round((completed / expected) * 100);
}

/**
 * Get compliance status and color based on percentage
 * @param percentage - Compliance percentage (0-100)
 * @returns { status: string, color: string }
 */
export function getComplianceStatus(percentage: number): {
  status: "green" | "amber" | "red";
  label: string;
} {
  if (percentage >= 90) {
    return { status: "green", label: "Excellent" };
  }
  if (percentage >= 75) {
    return { status: "amber", label: "Acceptable" };
  }
  return { status: "red", label: "Poor" };
}

/**
 * Get CSS classes for compliance indicator
 * @param status - Compliance status
 * @returns CSS class string
 */
export function getComplianceColorClasses(status: "green" | "amber" | "red"): string {
  if (status === "green") return "bg-success/10 text-success border-success/30";
  if (status === "amber") return "bg-warning/15 text-warning-foreground border-warning/40";
  return "bg-destructive/10 text-destructive border-destructive/30";
}
