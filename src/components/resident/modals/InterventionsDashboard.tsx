import { useCare } from "@/lib/care/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface Props {
  residentId: string;
  onRecordCompletion: (intervention: any) => void;
  onReview?: (intervention: any, action: "extend" | "complete" | "cancel") => void;
}

export function InterventionsDashboard({ residentId, onRecordCompletion, onReview }: Props) {
  const { problemInterventions, carePlanProblems } = useCare();
  const [expandedInterventions, setExpandedInterventions] = useState<Set<string>>(new Set());

  const activeInterventions = problemInterventions.filter(
    (i) => i.residentId === residentId && (i.status === "active" || i.status === "review_due"),
  );

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedInterventions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedInterventions(newSet);
  };

  const getStatusColor = (status: string) => {
    if (status === "active") return "bg-success/10 text-success border-success/30";
    if (status === "review_due") return "bg-warning/15 text-warning-foreground border-warning/40";
    return "bg-muted text-muted-foreground";
  };

  if (activeInterventions.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          No active interventions scheduled.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <CardTitle className="text-base">Active Interventions</CardTitle>
      {activeInterventions.map((intervention) => {
        const problem = carePlanProblems.find((p) => p.id === intervention.problemId);
        const isExpanded = expandedInterventions.has(intervention.id);

        return (
          <Card key={intervention.id} className="overflow-hidden">
            <button
              onClick={() => toggleExpanded(intervention.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium">{intervention.name}</h3>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(intervention.status)}`}
                  >
                    {intervention.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {problem?.problemStatement} • {intervention.frequencyType}
                  {intervention.assignedStaffName &&
                    ` • Assigned: ${intervention.assignedStaffName}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {intervention.startDate} to {intervention.endDate}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
              />
            </button>

            {isExpanded && (
              <CardContent className="p-4 border-t space-y-3">
                {/* Description */}
                {intervention.description && (
                  <div className="text-sm">
                    <p className="text-xs text-muted-foreground font-medium">Description</p>
                    <p className="text-sm text-foreground">{intervention.description}</p>
                  </div>
                )}

                {/* Review Information */}
                <div className="bg-muted/50 p-3 rounded-md text-sm">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Timeline</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Start:</span>
                      <p className="font-medium">{intervention.startDate}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Review:</span>
                      <p className="font-medium">{intervention.reviewDate}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">End:</span>
                      <p className="font-medium">{intervention.endDate}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {intervention.notes && (
                  <div className="text-sm">
                    <p className="text-xs text-muted-foreground font-medium">Clinical Notes</p>
                    <p className="text-sm">{intervention.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {/* Always show record completion option */}
                  <Button
                    size="sm"
                    onClick={() => onRecordCompletion(intervention)}
                    className="bg-success hover:bg-success/90 text-white"
                  >
                    Record Completion
                  </Button>

                  {/* Show review actions if intervention is due for review */}
                  {intervention.status === "review_due" && onReview && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReview(intervention, "extend")}
                      >
                        Extend / Reschedule
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReview(intervention, "complete")}
                      >
                        Complete / Stop
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onReview(intervention, "cancel")}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
