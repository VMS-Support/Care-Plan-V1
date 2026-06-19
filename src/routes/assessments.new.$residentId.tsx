import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { assessmentMeta, assessmentItems, uniformScale, scoreAssessment } from "@/lib/care/scoring";
import { can } from "@/lib/care/permissions";
import { toast } from "sonner";
import type { AssessmentType } from "@/lib/care/types";

const TYPES: AssessmentType[] = ["barthel", "waterlow", "abbey_pain", "mna", "norton", "nutrition", "pinch_me"];

export const Route = createFileRoute("/assessments/new/$residentId")({
  validateSearch: (s: Record<string, unknown>) => ({ type: (s.type as AssessmentType) ?? "barthel" }),
  head: () => ({ meta: [{ title: "New Assessment — CarePath" }] }),
  component: NewAssessment,
});

function NewAssessment() {
  const { residentId } = Route.useParams();
  const { type } = Route.useSearch() as { type: AssessmentType };
  const { residents, addAssessment, addAlert, addCarePlan, currentRole, currentUserName } = useCare();
  const navigate = useNavigate();
  const resident = residents.find(r => r.id === residentId);

  const items = assessmentItems[type] as any[];
  const scale = uniformScale(type);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [reviewDate, setReviewDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [nextReassessmentDate, setNextReassessmentDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));

  const result = useMemo(() => scoreAssessment(type, scores), [type, scores]);

  if (!resident) return <div className="p-8">Resident not found.</div>;
  if (!can(currentRole, "assessment.create")) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Your current role ({currentRole}) cannot create assessments.</p>
        <Link to="/residents/$id" params={{ id: residentId }} className="text-primary underline text-sm">Back to resident</Link>
      </div>
    );
  }

  const allAnswered = items.every((it: any) => scores[it.key] !== undefined);

  function submit(draft: boolean) {
    if (!draft && !allAnswered) { toast.error("Please answer every category"); return; }
    const a = addAssessment({
      residentId, type, date: new Date().toISOString(),
      assessor: currentUserName, assessorRole: currentRole,
      scores, totalScore: result.totalScore, interpretation: result.interpretation, riskLevel: result.riskLevel,
      notes, recommendations,
      status: draft ? "draft" : "completed",
      reviewDate, nextReassessmentDate, version: 1,
    });
    if (!draft && (result.riskLevel === "high" || result.riskLevel === "very_high")) {
      if (type === "waterlow" || type === "norton") {
        addCarePlan({
          residentId, title: "Pressure Area Care Plan",
          problem: `Pressure ulcer risk: ${result.interpretation} (${assessmentMeta[type].name} ${result.totalScore})`,
          goal: "Maintain skin integrity; no new pressure damage at next review.",
          interventions: ["Reposition 2-hourly", "Daily skin inspection", "Pressure-relieving mattress", "Nutritional support"],
          assignedStaff: "Care team", frequency: "Every 2 hours",
          reviewDate, status: "active", linkedAssessmentId: a.id,
        });
      }
      if (type === "abbey_pain") {
        addCarePlan({
          residentId, title: "Pain Management Care Plan",
          problem: `Pain: ${result.interpretation} (Abbey ${result.totalScore})`,
          goal: "Reduce pain to mild/none within 7 days.",
          interventions: ["Administer analgesia as prescribed", "Reassess 4-hourly", "Non-pharmacological comfort", "GP review if no improvement in 48h"],
          assignedStaff: "Nursing team", frequency: "4-hourly",
          reviewDate, status: "active", linkedAssessmentId: a.id,
        });
      }
      if (type === "mna" || type === "nutrition") {
        addCarePlan({
          residentId, title: "Nutrition Care Plan",
          problem: `${result.interpretation} (${assessmentMeta[type].name} ${result.totalScore})`,
          goal: "Improve nutritional intake; stabilise weight within 4 weeks.",
          interventions: ["Food chart commenced", "Fortified diet", "Dietitian referral", "Weekly weight"],
          assignedStaff: "Nursing team", frequency: "Daily",
          reviewDate, status: "active", linkedAssessmentId: a.id,
        });
      }
      addAlert({
        residentId,
        title: `${assessmentMeta[type].name} ${result.totalScore}`,
        description: `${result.interpretation} — review care plan.`,
        priority: result.riskLevel === "very_high" ? "critical" : "high",
      });
    }
    toast.success(draft ? "Draft saved" : "Assessment submitted");
    navigate({ to: "/residents/$id", params: { id: residentId } });
  }

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-5xl">
      <Link to="/residents/$id" params={{ id: residentId }} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> {resident.firstName} {resident.lastName}
      </Link>

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{assessmentMeta[type].name}</h1>
          <p className="text-sm text-muted-foreground">{assessmentMeta[type].description}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {TYPES.map(t => (
            <Link key={t} to="/assessments/new/$residentId" params={{ residentId }} search={{ type: t } as any}>
              <Button variant={type === t ? "default" : "outline"} size="sm" className="capitalize">
                {assessmentMeta[t].name.split(" ")[0].replace("—", "")}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {items.map((it: any) => {
            const options: any[] = scale ? (scale as any) : it.options;
            return (
              <Card key={it.key}>
                <CardContent className="p-4">
                  <div className="font-medium mb-2 text-sm">{it.label}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {options.map(([val, lab]: any) => {
                      const active = scores[it.key] === val;
                      return (
                        <button key={String(val) + lab} type="button"
                          onClick={() => setScores(s => ({ ...s, [it.key]: val }))}
                          className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
                          <span className="font-semibold tabular-nums mr-1.5">{val}</span>{lab}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-sm">Clinical Recommendations</Label>
                <Textarea value={recommendations} onChange={e => setRecommendations(e.target.value)} placeholder="Recommended actions, referrals, care plan items…" className="mt-2" />
              </div>
              <div>
                <Label className="text-sm">Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Clinical observations, follow-up…" className="mt-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Review Date</Label>
                  <Input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)} className="mt-2" />
                </div>
                <div>
                  <Label className="text-sm">Next Reassessment Date</Label>
                  <Input type="date" value={nextReassessmentDate} onChange={e => setNextReassessmentDate(e.target.value)} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card className="sticky top-20">
            <CardHeader><CardTitle className="text-base">Live Score</CardTitle></CardHeader>
            <CardContent>
              <div className="text-5xl font-semibold tabular-nums">{result.totalScore}</div>
              <Badge variant="outline" className="mt-2 capitalize">{result.interpretation}</Badge>
              <div className="text-xs text-muted-foreground mt-3">
                {Object.keys(scores).length} of {items.length} answered
              </div>
              <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${(Object.keys(scores).length / items.length) * 100}%` }} />
              </div>
              <div className="text-xs text-muted-foreground mt-3">
                Completed by <strong className="text-foreground">{currentUserName}</strong><br />
                Role: <strong className="text-foreground capitalize">{currentRole}</strong>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <Button onClick={() => submit(false)} disabled={!allAnswered}>Submit Assessment</Button>
                <Button variant="outline" onClick={() => submit(true)}>Save Draft</Button>
              </div>
              {(result.riskLevel === "high" || result.riskLevel === "very_high") && allAnswered && (
                <div className="mt-4 p-3 rounded-md bg-warning/10 border border-warning/30 text-xs">
                  <strong>Auto-actions on submit:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li>Alert raised ({result.riskLevel === "very_high" ? "Critical" : "High"})</li>
                    {(type === "waterlow" || type === "norton") && <li>Pressure Area Care Plan</li>}
                    {type === "abbey_pain" && <li>Pain Management Care Plan</li>}
                    {(type === "mna" || type === "nutrition") && <li>Nutrition Care Plan</li>}
                    <li>Review scheduled</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
