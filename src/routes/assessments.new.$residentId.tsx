import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Check, CircleCheck, Search } from "lucide-react";
import { assessmentMeta, assessmentItems, isAssessmentActive, uniformScale, scoreAssessment } from "@/lib/care/scoring";
import { ASSESSMENT_CATEGORIES } from "@/lib/care/assessments";
import { toast } from "sonner";
import type { AssessmentType } from "@/lib/care/types";

const TYPES = (Object.keys(assessmentItems) as AssessmentType[]).filter(isAssessmentActive);

export const Route = createFileRoute("/assessments/new/$residentId")({
  validateSearch: (s: Record<string, unknown>) => ({ type: (s.type as AssessmentType) ?? "barthel" }),
  head: () => ({ meta: [{ title: "New Assessment — CarePath" }] }),
  component: NewAssessment,
});

function NewAssessment() {
  const { residentId } = Route.useParams();
  const { type } = Route.useSearch() as { type: AssessmentType };
  const { residents, assessments, addAssessment, currentRole, currentUserName, canAccess } = useCare();
  const resident = residents.find(r => r.id === residentId);

  const items = assessmentItems[type] as any[] | undefined;
  const scale = uniformScale(type);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [reviewDate, setReviewDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [nextReassessmentDate, setNextReassessmentDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerCategory, setPickerCategory] = useState("all");
  const [submittedAssessmentName, setSubmittedAssessmentName] = useState<string | null>(null);
  const [furtherClinicalReviewRequired, setFurtherClinicalReviewRequired] = useState<"yes" | "no">("no");
  const [reviewAction, setReviewAction] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [clinicalReviewTargetDate, setClinicalReviewTargetDate] = useState("");

  // Keep this workspace ready for the next selected assessment instead of sending
  // the user back through the resident's Quick Actions flow.
  useEffect(() => {
    setScores({});
    setNotes("");
    setRecommendations("");
    setFurtherClinicalReviewRequired("no");
    setReviewAction("");
    setResponsiblePerson("");
    setClinicalReviewTargetDate("");
  }, [type]);

  const result = useMemo(() => scoreAssessment(type, scores), [type, scores]);
  const currentAssessments = useMemo(
    () => assessments
      .filter((assessment) => assessment.residentId === residentId && assessment.status === "completed")
      .sort((a, b) => b.date.localeCompare(a.date)),
    [assessments, residentId],
  );
  const availableAssessments = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase();
    const categoryTypes = pickerCategory === "all"
      ? TYPES
      : ASSESSMENT_CATEGORIES.find((category) => category.id === pickerCategory)?.types ?? [];
    return categoryTypes.filter(isAssessmentActive).filter((assessmentType) => {
      const meta = assessmentMeta[assessmentType];
      return !query || `${meta.name} ${meta.description}`.toLowerCase().includes(query);
    });
  }, [pickerCategory, pickerQuery]);

  if (!resident) return <div className="p-8">Resident not found.</div>;
  if (!isAssessmentActive(type) || !items) return <div className="p-8"><p className="font-medium">This assessment is not active.</p><p className="mt-1 text-sm text-muted-foreground">{assessmentMeta[type]?.template.clinicalConfigurationNote || "A clinically approved source configuration is required before this assessment can be used."}</p><Link to="/residents/$id" params={{ id: residentId }} className="mt-4 inline-block text-primary underline text-sm">Back to resident</Link></div>;
  if (!canAccess("assessment.create", { nursingHomeId: resident.facilityId, wardId: resident.wardId, residentId })) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Access denied. You cannot create assessments for this resident in the current scope.</p>
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
      reviewDate, nextReassessmentDate,
      templateMetadata: { ...assessmentMeta[type].template },
      payload: type === "gds15" ? {
        furtherClinicalReviewRequired: furtherClinicalReviewRequired === "yes",
        reviewAction: furtherClinicalReviewRequired === "yes" ? reviewAction : undefined,
        responsiblePerson: furtherClinicalReviewRequired === "yes" ? responsiblePerson : undefined,
        targetDate: furtherClinicalReviewRequired === "yes" ? clinicalReviewTargetDate : undefined,
      } : undefined,
    });
    if (draft) toast.success("Draft saved. Select another assessment when ready.");
    else setSubmittedAssessmentName(assessmentMeta[type].name);
    setScores({});
    setNotes("");
    setRecommendations("");
  }

  function createAnotherAssessment() {
    setSubmittedAssessmentName(null);
    setPickerQuery("");
    setPickerCategory("all");
    setPickerOpen(true);
  }

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-5xl">
      <Link to="/residents/$id" params={{ id: residentId }} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> {resident.firstName} {resident.lastName}
      </Link>

      <Dialog open={Boolean(submittedAssessmentName)} onOpenChange={(open) => !open && setSubmittedAssessmentName(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Assessment submitted <CircleCheck className="h-5 w-5 text-emerald-600" aria-label="Submitted successfully" />
            </DialogTitle>
            <DialogDescription>
              {submittedAssessmentName} has been submitted for {resident.firstName} {resident.lastName}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" asChild>
              <Link to="/residents/$id" params={{ id: residentId }}>Back to resident profile</Link>
            </Button>
            <Button onClick={createAnotherAssessment}>Create another assessment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{assessmentMeta[type].name}</h1>
          <p className="text-sm text-muted-foreground">{assessmentMeta[type].description}</p>
          {type === "gds15" && <p className="mt-1 text-sm text-muted-foreground">Choose the answer that best describes how the resident has felt over the past week.</p>}
        </div>
        <div className="hidden">
          {TYPES.map(t => (
            <Link key={t} to="/assessments/new/$residentId" params={{ residentId }} search={{ type: t } as any}>
              <Button variant={type === t ? "default" : "outline"} size="sm" className="capitalize">
                {assessmentMeta[t].name.split(" ")[0].replace("—", "")}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <section className="rounded-xl border bg-muted/30 px-4 py-3" aria-label="Resident being assessed">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 shrink-0 border">
            <AvatarImage src={resident.photoUrl} alt={`${resident.firstName} ${resident.lastName}`} className="object-cover" />
            <AvatarFallback>{`${resident.firstName[0] || ""}${resident.lastName[0] || ""}`.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assessing resident</p>
            <p className="font-semibold truncate">{resident.firstName} {resident.lastName}</p>
            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {resident.roomNumber && <span>Room {resident.roomNumber}</span>}
              {resident.dob && <span>DOB {new Date(resident.dob).toLocaleDateString()}</span>}
              {(resident.residentNumber || resident.externalResidentId) && <span>ID {resident.residentNumber || resident.externalResidentId}</span>}
            </div>
          </div>
          <Link to="/residents/$id" params={{ id: residentId }} className="text-xs font-medium text-primary hover:underline shrink-0">View profile</Link>
        </div>
      </section>

      <div className="flex justify-end">
        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogTrigger asChild><Button variant="outline">Change assessment</Button></DialogTrigger>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Select an assessment</DialogTitle>
            <DialogDescription>Search or browse by clinical area to continue this assessment for {resident.firstName} {resident.lastName}.</DialogDescription>
            <div className="relative pt-3">
              <Search className="absolute left-3 top-6 h-4 w-4 text-muted-foreground" />
              <Input autoFocus value={pickerQuery} onChange={(event) => setPickerQuery(event.target.value)} placeholder="Search assessments, e.g. pressure, falls or cognition" className="pl-9" />
            </div>
          </DialogHeader>
          <div className="grid md:grid-cols-[11rem_1fr] min-h-[22rem]">
            <nav className="border-b md:border-b-0 md:border-r bg-muted/30 p-3 flex md:flex-col gap-1 overflow-x-auto" aria-label="Assessment categories">
              <Button size="sm" variant={pickerCategory === "all" ? "secondary" : "ghost"} className="justify-start shrink-0" onClick={() => setPickerCategory("all")}>All assessments</Button>
              {ASSESSMENT_CATEGORIES.map((category) => <Button key={category.id} size="sm" variant={pickerCategory === category.id ? "secondary" : "ghost"} className="justify-start shrink-0" onClick={() => setPickerCategory(category.id)}>{category.label}</Button>)}
            </nav>
            <div className="p-4 max-h-[30rem] overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-3">{availableAssessments.length} assessment{availableAssessments.length === 1 ? "" : "s"} available</p>
              {availableAssessments.length ? <div className="grid sm:grid-cols-2 gap-2">
                {availableAssessments.map((assessmentType) => <Link key={assessmentType} to="/assessments/new/$residentId" params={{ residentId }} search={{ type: assessmentType } as any} onClick={() => setPickerOpen(false)} className={`group relative rounded-lg border p-3 pr-9 transition-colors hover:border-primary hover:bg-primary/5 ${type === assessmentType ? "border-primary bg-primary/5" : "bg-background"}`}>
                  <div className="font-medium text-sm">{assessmentMeta[assessmentType].name}</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{assessmentMeta[assessmentType].description}</p>
                  {type === assessmentType && <Check className="absolute right-3 top-3 h-4 w-4 text-primary" aria-label="Current assessment" />}
                </Link>)}
              </div> : <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No assessments match your search.</div>}
            </div>
          </div>
        </DialogContent>
        </Dialog>
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
                          {type !== "gds15" && <span className="font-semibold tabular-nums mr-1.5">{val}</span>}{lab}
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
              {type === "gds15" && <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50/60 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
                <p>The GDS-15 is a screening instrument and is not a diagnosis of depression. Scores or responses causing concern require appropriate clinical review.</p>
                <div>
                  <Label htmlFor="gds-clinical-review">Further clinical review required?</Label>
                  <select id="gds-clinical-review" value={furtherClinicalReviewRequired} onChange={(event) => setFurtherClinicalReviewRequired(event.target.value as "yes" | "no")} className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="no">No</option><option value="yes">Yes</option>
                  </select>
                </div>
                {furtherClinicalReviewRequired === "yes" && <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Label>Review action</Label><Textarea value={reviewAction} onChange={(event) => setReviewAction(event.target.value)} className="mt-1" placeholder="Record the agreed clinical review action" /></div>
                  <div><Label>Responsible person</Label><Input value={responsiblePerson} onChange={(event) => setResponsiblePerson(event.target.value)} className="mt-1" /></div>
                  <div><Label>Target date</Label><Input type="date" value={clinicalReviewTargetDate} onChange={(event) => setClinicalReviewTargetDate(event.target.value)} className="mt-1" /></div>
                </div>}
              </div>}
              <div>
                <Label className="text-sm">{type === "gds15" ? "Clinical recommendations" : "Clinical Recommendations"}</Label>
                <Textarea value={recommendations} onChange={e => setRecommendations(e.target.value)} placeholder="Recommended actions, referrals, care plan items…" className="mt-2" />
              </div>
              <div>
                <Label className="text-sm">{type === "gds15" ? "Assessor note (optional)" : "Notes"}</Label>
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
              {allAnswered ? <><div className="text-5xl font-semibold tabular-nums">{result.totalScore}</div><Badge variant="outline" className="mt-2 capitalize">{result.interpretation}</Badge></> : <p className="text-sm text-muted-foreground">Complete all mandatory questions to calculate the final score.</p>}
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
                  <strong>On submit:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li>Alert raised ({result.riskLevel === "very_high" ? "Critical" : "High"})</li>
                    <li>Assessment findings remain available for RLT care planning</li>
                    <li>Review scheduled</li>
                  </ul>
                </div>
              )}
              <div className="mt-5 border-t pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-sm">Current assessments</h2>
                    <p className="text-xs text-muted-foreground">Completed for this resident</p>
                  </div>
                  <Badge variant="secondary">{currentAssessments.length}</Badge>
                </div>
                {currentAssessments.length ? (
                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
                    {currentAssessments.map((assessment) => (
                      <Link key={assessment.id} to="/assessments/$assessmentId" params={{ assessmentId: assessment.id }} className="block rounded-md border p-2.5 transition-colors hover:bg-muted/60">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium leading-tight">{assessmentMeta[assessment.type].name}</span>
                          {(() => {
                            const overdue = Boolean(assessment.nextReassessmentDate && assessment.nextReassessmentDate < new Date().toISOString().slice(0, 10));
                            return <Badge className={`shrink-0 text-[10px] ${overdue ? "bg-destructive text-destructive-foreground hover:bg-destructive" : "bg-emerald-600 text-white hover:bg-emerald-600"}`}>{overdue ? "Overdue" : "Active"}</Badge>;
                          })()}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(assessment.date).toLocaleDateString()} · Score {assessment.totalScore}{assessment.nextReassessmentDate ? ` · Review ${assessment.nextReassessmentDate}` : ""}</p>
                      </Link>
                    ))}
                  </div>
                ) : <p className="mt-3 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">No completed assessments yet. Submitted assessments will appear here immediately.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
