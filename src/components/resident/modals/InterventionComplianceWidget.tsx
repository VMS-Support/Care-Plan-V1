import { useResidentInterventionMetrics } from "@/hooks/use-intervention-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComplianceCard } from "./ComplianceCard";
import { AlertCircle } from "lucide-react";

interface Props {
  residentId: string;
}

function formatCompletedDate(value: unknown) {
  return typeof value === "string" && value.includes("T") ? value.split("T")[0] : "-";
}

export function InterventionComplianceWidget({ residentId }: Props) {
  const metrics = useResidentInterventionMetrics(residentId);

  // Separate by status
  const activeMetrics = metrics.filter(
    (m) => m.intervention.status === "active" || m.intervention.status === "review_due",
  );
  const completedMetrics = metrics.filter((m) => m.intervention.status === "completed");

  // Calculate overall compliance
  const totalExpected = activeMetrics.reduce((sum, m) => sum + m.expectedOccurrences, 0);
  const totalCompleted = activeMetrics.reduce((sum, m) => sum + m.completedOccurrences, 0);
  const overallCompliance =
    totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

  // Find interventions at risk (compliance < 75%)
  const atRiskInterventions = activeMetrics.filter((m) => m.compliancePercentage < 75);

  if (metrics.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          No interventions recorded.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Intervention Compliance Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Overall Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{overallCompliance}%</div>
              <p className="text-xs text-muted-foreground mt-1">Overall Compliance</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{activeMetrics.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active Interventions</p>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${atRiskInterventions.length > 0 ? "text-destructive" : "text-muted-foreground"}`}
              >
                {atRiskInterventions.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">At Risk (&lt;75%)</p>
            </div>
          </div>

          {/* Risk Alert */}
          {atRiskInterventions.length > 0 && (
            <div className="flex gap-2 p-2 bg-destructive/10 rounded-md text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">
                  {atRiskInterventions.length} interventions below 75% compliance
                </p>
                <p className="text-xs mt-1">
                  {atRiskInterventions.map((m) => m.intervention.name).join(", ")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Interventions Compliance Cards */}
      {activeMetrics.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-2">Active Interventions Compliance</h3>
          <div className="space-y-2">
            {activeMetrics.map((metric) => (
              <ComplianceCard key={metric.intervention.id} metrics={metric} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Interventions */}
      {completedMetrics.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-2">Completed Interventions</h3>
          <div className="space-y-2">
            {completedMetrics.map((metric) => (
              <Card key={metric.intervention.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{metric.intervention.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Completed on {formatCompletedDate(metric.intervention.completedAt)}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-success">100%</div>
                      <p className="text-xs text-muted-foreground">Complete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
