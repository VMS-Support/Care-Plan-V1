import { InterventionMetrics } from "@/hooks/use-intervention-metrics";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { getComplianceColorClasses } from "@/lib/care/intervention-metrics";

interface Props {
  metrics: InterventionMetrics;
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function ComplianceCard({ metrics }: Props) {
  const {
    intervention,
    expectedOccurrences,
    completedOccurrences,
    missedOccurrences,
    refusedOccurrences,
    compliancePercentage,
    complianceStatus,
    complianceLabel,
  } = metrics;

  const progressValue = Math.min(compliancePercentage, 100);
  const colorClasses = getComplianceColorClasses(complianceStatus);

  return (
    <Card
      className="border-l-4"
      style={{
        borderLeftColor:
          complianceStatus === "green"
            ? "#22c55e"
            : complianceStatus === "amber"
              ? "#f59e0b"
              : "#ef4444",
      }}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Intervention Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">{intervention.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {asText(intervention.frequencyType, "unspecified").replace(/_/g, " ")}
              </p>
            </div>
            <Badge variant="outline" className={`text-xs whitespace-nowrap ${colorClasses}`}>
              {compliancePercentage}% {complianceLabel}
            </Badge>
          </div>

          {/* Compliance Bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium">Compliance</span>
              <span className="text-xs text-muted-foreground">
                {completedOccurrences}/{expectedOccurrences}
              </span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="font-medium">{completedOccurrences}</span>
              </div>
              <p className="text-muted-foreground">Completed</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-warning">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="font-medium">{missedOccurrences}</span>
              </div>
              <p className="text-muted-foreground">Missed</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-destructive">
                <XCircle className="h-3.5 w-3.5" />
                <span className="font-medium">{refusedOccurrences}</span>
              </div>
              <p className="text-muted-foreground">Refused</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="font-medium">{expectedOccurrences}</span>
              </div>
              <p className="text-muted-foreground">Expected</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex gap-2 text-xs text-muted-foreground pt-2 border-t">
            <div>
              <span className="font-medium">Start:</span> {asText(intervention.startDate, "-")}
            </div>
            <div>
              <span className="font-medium">End:</span> {asText(intervention.endDate, "-")}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
