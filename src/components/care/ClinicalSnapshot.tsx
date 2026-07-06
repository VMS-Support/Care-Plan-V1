import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useCare } from "@/lib/care/store";
import { assessmentMeta } from "@/lib/care/scoring";
import { deriveStatus, riskBadgeCls, statusBadgeCls } from "@/lib/care/assessments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, Lock, AlertTriangle, Plus } from "lucide-react";
import type { Assessment, AssessmentType } from "@/lib/care/types";
import { LatestVitalsCard } from "@/components/care/LatestVitalsCard";
import { isActionableClinicalAlert } from "@/lib/care/alerts";

const SNAPSHOT_TYPES: AssessmentType[] = [
  "waterlow",
  "barthel",
  "abbey_pain",
  "must",
  "mna",
  "falls",
  "mmse",
  "four_at",
  "continence",
];

export function ClinicalSnapshot({
  residentId,
  showLatestVitals = true,
}: {
  residentId: string;
  showLatestVitals?: boolean;
}) {
  const { assessments, vitals, residents, clinicalAlerts } = useCare();
  const resident = residents.find((r) => r.id === residentId);
  const rv = vitals.filter((v) => v.residentId === residentId);
  const activeAlerts = clinicalAlerts.filter(
    (a) =>
      a.residentId === residentId &&
      isActionableClinicalAlert(a) &&
      !a.dismissedAt,
  );

  const latest = useMemo(() => {
    const map = new Map<AssessmentType, Assessment>();
    for (const a of assessments) {
      if (a.residentId !== residentId) continue;
      if (a.status === "deleted" || a.status === "archived" || a.status === "superseded") continue;
      if (a.status !== "completed") continue;
      const cur = map.get(a.type);
      if (!cur || a.date > cur.date) map.set(a.type, a);
    }
    return SNAPSHOT_TYPES.map((t) => ({ type: t, a: map.get(t) })).filter((x) => x.a) as {
      type: AssessmentType;
      a: Assessment;
    }[];
  }, [assessments, residentId]);

  return (
    <div className="space-y-3">
      {showLatestVitals && <LatestVitalsCard vitals={rv} resident={resident} compact />}
      {activeAlerts.length > 0 && (
        <Card className="border-warning/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Active Clinical Alerts (
              {activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {activeAlerts.slice(0, 6).map((a) => (
              <Badge
                key={a.id}
                variant="outline"
                className={`text-[10px] ${a.severity === "critical" ? "border-destructive/40 text-destructive" : "border-warning/40 text-warning-foreground"}`}
                title={a.recommendation}
              >
                {a.title}
              </Badge>
            ))}
            <Link
              to="/residents/$id/vitals"
              params={{ id: residentId }}
              className="text-[10px] text-primary hover:underline ml-1 self-center"
            >
              View all →
            </Link>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Clinical Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latest.length === 0 ? (
            <div className="rounded-md border p-4 space-y-3">
              <p className="text-sm text-muted-foreground">No completed assessments yet.</p>
              <Button asChild size="sm">
                <Link
                  to="/assessments/new/$residentId"
                  params={{ residentId }}
                  search={{ type: "waterlow" } as any}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Initial Assessment
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {latest.map(({ type, a }) => {
                const ds = deriveStatus(a);
                return (
                  <Link
                    key={type}
                    to="/assessments/$assessmentId"
                    params={{ assessmentId: a.id }}
                    className="rounded-md border p-3 hover:bg-accent/40 transition block"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="text-[11px] font-medium text-muted-foreground truncate">
                        {assessmentMeta[type].name}
                      </div>
                      {a.locked && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-xl font-semibold tabular-nums">{a.totalScore}</span>
                      {assessmentMeta[type].max && (
                        <span className="text-[10px] text-muted-foreground">
                          /{assessmentMeta[type].max}
                        </span>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] mt-1 capitalize ${riskBadgeCls(a.riskLevel)}`}
                    >
                      {a.interpretation}
                    </Badge>
                    <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px]">
                      <Badge
                        variant="outline"
                        className={`text-[9px] capitalize ${statusBadgeCls(ds)}`}
                      >
                        {ds}
                      </Badge>
                      {a.nextReassessmentDate && (
                        <span
                          className="text-muted-foreground truncate"
                          title={`Due ${a.nextReassessmentDate}`}
                        >
                          <RefreshCw className="h-2.5 w-2.5 inline mr-0.5" />
                          {a.nextReassessmentDate.slice(5, 10)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
