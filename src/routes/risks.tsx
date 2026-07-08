import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useCare } from "@/lib/care/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, HeartPulse, PersonStanding, Shield, Utensils } from "lucide-react";
import type { Assessment, AssessmentType } from "@/lib/care/types";

export const Route = createFileRoute("/risks")({
  head: () => ({ meta: [{ title: "Risk Register - CarePath" }] }),
  component: RisksPage,
});

type RiskGroup = {
  title: string;
  types: AssessmentType[];
  icon: typeof Shield;
};

const groups: RiskGroup[] = [
  { title: "High Pressure Risk Residents", types: ["waterlow", "norton"], icon: Shield },
  { title: "High Falls Risk Residents", types: ["falls", "barthel"], icon: PersonStanding },
  { title: "Nutrition Risk Residents", types: ["mna", "must", "nutrition"], icon: Utensils },
  { title: "Pain Risk Residents", types: ["abbey_pain", "pain_chart"], icon: HeartPulse },
  { title: "Cognitive Risk Residents", types: ["mmse", "four_at"], icon: Brain },
];

function RisksPage() {
  const { assessments, residents, currentRole, currentUser } = useCare();
  const scopedResidents = useMemo(() => {
    if (currentRole === "don" || currentUser.assignedWings.length === 0) return residents;
    return residents.filter((resident) =>
      currentUser.assignedWings.includes(resident.wingId || ""),
    );
  }, [currentRole, currentUser.assignedWings, residents]);
  const residentIds = useMemo(
    () => new Set(scopedResidents.map((resident) => resident.id)),
    [scopedResidents],
  );

  const latestByResidentAndType = useMemo(() => {
    const map = new Map<string, Assessment>();
    for (const assessment of assessments) {
      if (!residentIds.has(assessment.residentId)) continue;
      if (assessment.status === "deleted" || assessment.status === "archived") continue;
      const key = `${assessment.residentId}:${assessment.type}`;
      const current = map.get(key);
      if (!current || assessment.date > current.date) map.set(key, assessment);
    }
    return map;
  }, [assessments, residentIds]);

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Risk Register</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Risks identified from current assessments and resident information.
          </p>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        {groups.map((group) => {
          const rows = scopedResidents
            .map((resident) => {
              const relevant = group.types
                .map((type) => latestByResidentAndType.get(`${resident.id}:${type}`))
                .filter((assessment): assessment is Assessment => !!assessment)
                .filter(
                  (assessment) =>
                    assessment.riskLevel === "high" || assessment.riskLevel === "very_high",
                )
                .sort((a, b) => b.date.localeCompare(a.date));
              return { resident, assessment: relevant[0] };
            })
            .filter((row) => !!row.assessment);
          const Icon = group.icon;

          return (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {group.title}
                  <Badge variant="outline" className="ml-auto">
                    {rows.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rows.map(({ resident, assessment }) => (
                  <Link
                    key={resident.id}
                    to="/residents/$id"
                    params={{ id: resident.id }}
                    className="flex items-center justify-between gap-3 rounded-md border p-3 hover:bg-accent/40"
                  >
                    <div>
                      <div className="font-medium">
                        {resident.firstName} {resident.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Room {resident.roomNumber} - {assessment.type.replace(/_/g, " ")}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="capitalize">
                        {assessment.riskLevel.replace("_", " ")}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        Score {assessment.totalScore}
                      </div>
                    </div>
                  </Link>
                ))}
                {rows.length === 0 && (
                  <p className="text-sm text-muted-foreground">No high-risk residents.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
