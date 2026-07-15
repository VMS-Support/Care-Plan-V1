import type { DailyCareOutcome, DailyCareStatus } from "./dailyCareTypes";

export function normalizeDailyCareOutcome(status: DailyCareStatus): DailyCareOutcome {
  if (status === "declined") return "refused";
  if (status === "unable_to_complete") return "unable";
  if (status === "entered_in_error" || status === "corrected") return "completed";
  return status;
}
