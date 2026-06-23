import { useCare } from "@/lib/care/store";
import { ProblemIntervention } from "@/lib/care/types";
import {
  calculateExpectedOccurrences,
  calculateCompliancePercentage,
  getComplianceStatus,
} from "@/lib/care/intervention-metrics";

export interface InterventionMetrics {
  intervention: ProblemIntervention;
  expectedOccurrences: number;
  completedOccurrences: number;
  missedOccurrences: number;
  refusedOccurrences: number;
  compliancePercentage: number;
  complianceStatus: "green" | "amber" | "red";
  complianceLabel: string;
}

function safeDateText(value: unknown) {
  return typeof value === "string" ? value : "";
}

/**
 * Hook to calculate intervention metrics for a single intervention
 * Calculates expected occurrences, compliance percentage, and status
 */
export function useInterventionMetrics(interventionId: string): InterventionMetrics | null {
  const { problemInterventions, problemInterventionLogs } = useCare();

  const intervention = problemInterventions.find((i) => i.id === interventionId);
  if (!intervention) {
    return null;
  }

  // Get all logs for this intervention
  const logs = problemInterventionLogs.filter((log) => log.interventionId === interventionId);

  // Calculate expected occurrences
  const expectedOccurrences = calculateExpectedOccurrences(
    intervention.frequencyType,
    intervention.startDate,
    intervention.endDate,
  );

  // Count outcomes
  const completedOccurrences = logs.filter((log) => log.outcome === "completed").length;
  const partiallyCompletedOccurrences = logs.filter(
    (log) => log.outcome === "partially_completed",
  ).length;
  const missedOccurrences = logs.filter((log) => log.outcome === "missed").length;
  const refusedOccurrences = logs.filter((log) => log.outcome === "refused").length;

  // For compliance calculation, count completed and partially_completed as successful
  const successfulOccurrences = completedOccurrences + partiallyCompletedOccurrences;

  // Calculate compliance
  const compliancePercentage = calculateCompliancePercentage(
    successfulOccurrences,
    expectedOccurrences,
  );
  const complianceMetrics = getComplianceStatus(compliancePercentage);

  return {
    intervention,
    expectedOccurrences,
    completedOccurrences,
    missedOccurrences,
    refusedOccurrences,
    compliancePercentage,
    complianceStatus: complianceMetrics.status,
    complianceLabel: complianceMetrics.label,
  };
}

/**
 * Hook to calculate metrics for all interventions of a resident
 */
export function useResidentInterventionMetrics(residentId: string): InterventionMetrics[] {
  const { problemInterventions, problemInterventionLogs } = useCare();

  const interventions = problemInterventions.filter((i) => i.residentId === residentId);

  return interventions
    .map((intervention) => {
      // Get all logs for this intervention
      const logs = problemInterventionLogs.filter((log) => log.interventionId === intervention.id);

      // Calculate expected occurrences
      const expectedOccurrences = calculateExpectedOccurrences(
        intervention.frequencyType,
        intervention.startDate,
        intervention.endDate,
      );

      // Count outcomes
      const completedOccurrences = logs.filter((log) => log.outcome === "completed").length;
      const partiallyCompletedOccurrences = logs.filter(
        (log) => log.outcome === "partially_completed",
      ).length;
      const missedOccurrences = logs.filter((log) => log.outcome === "missed").length;
      const refusedOccurrences = logs.filter((log) => log.outcome === "refused").length;

      // For compliance calculation, count completed and partially_completed as successful
      const successfulOccurrences = completedOccurrences + partiallyCompletedOccurrences;

      // Calculate compliance
      const compliancePercentage = calculateCompliancePercentage(
        successfulOccurrences,
        expectedOccurrences,
      );
      const complianceMetrics = getComplianceStatus(compliancePercentage);

      return {
        intervention,
        expectedOccurrences,
        completedOccurrences,
        missedOccurrences,
        refusedOccurrences,
        compliancePercentage,
        complianceStatus: complianceMetrics.status,
        complianceLabel: complianceMetrics.label,
      };
    })
    .sort((a, b) =>
      safeDateText(b.intervention.startDate).localeCompare(safeDateText(a.intervention.startDate)),
    );
}
