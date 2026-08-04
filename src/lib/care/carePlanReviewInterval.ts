export type CarePlanReviewIntervalUnit = "days" | "weeks" | "months";

export function normalizedReviewInterval(input: {
  reviewIntervalValue?: number;
  reviewIntervalUnit?: CarePlanReviewIntervalUnit;
  reviewIntervalMonths?: number;
}) {
  return {
    value: input.reviewIntervalValue ?? input.reviewIntervalMonths ?? 3,
    unit: input.reviewIntervalUnit ?? ("months" as const),
  };
}

export function isValidReviewInterval(
  value: number,
  unit: string,
): unit is CarePlanReviewIntervalUnit {
  return Number.isInteger(value) && value > 0 && ["days", "weeks", "months"].includes(unit);
}

export function calculateCarePlanReviewDate(
  startDate: string,
  value: number,
  unit: CarePlanReviewIntervalUnit,
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !isValidReviewInterval(value, unit)) return "";
  const [year, month, day] = startDate.split("-").map(Number);
  const source = new Date(Date.UTC(year, month - 1, day));
  if (source.toISOString().slice(0, 10) !== startDate) return "";
  if (unit === "months") {
    const targetMonth = month - 1 + value;
    const targetYear = year + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;
    const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
    return new Date(Date.UTC(targetYear, normalizedMonth, Math.min(day, lastDay)))
      .toISOString()
      .slice(0, 10);
  }
  const date = source;
  date.setUTCDate(date.getUTCDate() + value * (unit === "weeks" ? 7 : 1));
  return date.toISOString().slice(0, 10);
}

export function formatReviewInterval(value: number, unit: CarePlanReviewIntervalUnit) {
  const singular = unit.slice(0, -1);
  return `Every ${value} ${value === 1 ? singular : unit}`;
}
