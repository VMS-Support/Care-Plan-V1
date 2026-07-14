import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { assessmentMeta } from "@/lib/care/scoring";
import { RLT_DOMAINS, RLT_DOMAIN_TO_DEFAULT_CATEGORY } from "@/lib/care/rlt";
import { getApprovedRltDomainsForAssessmentRecord } from "@/lib/care/assessmentRltMappings";
import { RLT_DEPENDENCY_LABELS, type RltDependencyLevel } from "@/lib/care/rltDependency";
import { getResidentPreferencesByDomain, getResidentStrengthsByDomain } from "@/lib/care/residentStrengthPreferences";
import type { CarePlanProblem, ProblemCategory, ProblemRiskLevel, RltDomainId } from "@/lib/care/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const RISK_OPTIONS: ProblemRiskLevel[] = ["low", "moderate", "high", "very_high"];

function todayPlus(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

type Props = {
  residentId?: string;
  initialRltDomainId?: RltDomainId;
  currentDependencyLevel?: RltDependencyLevel | null;
  trigger?: ReactNode;
  buttonLabel?: string;
  onCreated?: (problem: CarePlanProblem) => void;
};

export function CreateCarePlanDialog({
  residentId: fixedResidentId,
  initialRltDomainId,
  currentDependencyLevel,
  trigger,
  buttonLabel = "New Nursing Care Plan",
  onCreated,
}: Props) {
  const { residents, assessments, addProblem, addGoal, strengthPreferenceState, currentUser, canAccess, activeFacilityId } = useCare();
  const [open, setOpen] = useState(false);
  const defaultRltDomainId = initialRltDomainId || "";
  const [residentId, setResidentId] = useState(fixedResidentId || "");
  const [rltDomainId, setRltDomainId] = useState<RltDomainId | "">(defaultRltDomainId);
  const [risk, setRisk] = useState<ProblemRiskLevel>("high");
  const [statement, setStatement] = useState("");
  const [goal, setGoal] = useState("");
  const [evalDate, setEvalDate] = useState(todayPlus(7));
  const [reviewDate, setReviewDate] = useState(todayPlus(90));
  const [notes, setNotes] = useState("");
  const [contextReferences, setContextReferences] = useState<NonNullable<CarePlanProblem["contextReferences"]>>([]);

  const selectedResident = residents.find((resident) => resident.id === (fixedResidentId || residentId));
  const relatedAssessments = useMemo(() => {
    const targetResidentId = fixedResidentId || residentId;
    if (!targetResidentId) return [];
    return assessments
      .filter((assessment) => {
        if (assessment.residentId !== targetResidentId) return false;
        if (assessment.status === "deleted" || assessment.status === "archived") return false;
        return getApprovedRltDomainsForAssessmentRecord(assessment).some((domain) => domain.id === rltDomainId);
      })
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 3);
  }, [assessments, fixedResidentId, residentId, rltDomainId]);
  const domainContext = useMemo(() => {
    const targetResidentId = fixedResidentId || residentId;
    if (!targetResidentId || !rltDomainId || !selectedResident) return { strengths: [], preferences: [] };
    const nursingHomeId = selectedResident.facilityId || activeFacilityId;
    const capabilities = ["resident_preference.view", "resident_preference.view_sensitive", "resident_preference.view_highly_sensitive"].filter((capability) => canAccess(capability as Parameters<typeof canAccess>[0], { nursingHomeId, residentId: targetResidentId }));
    return {
      strengths: getResidentStrengthsByDomain(strengthPreferenceState, targetResidentId, rltDomainId, nursingHomeId),
      preferences: getResidentPreferencesByDomain(strengthPreferenceState, targetResidentId, rltDomainId, nursingHomeId, capabilities),
    };
  }, [activeFacilityId, canAccess, fixedResidentId, residentId, rltDomainId, selectedResident, strengthPreferenceState]);

  const reset = () => {
    setResidentId(fixedResidentId || "");
    setRltDomainId(defaultRltDomainId);
    setRisk("high");
    setStatement("");
    setGoal("");
    setEvalDate(todayPlus(7));
    setReviewDate(todayPlus(90));
    setNotes("");
    setContextReferences([]);
  };

  useEffect(() => {
    if (open) {
      setRltDomainId(defaultRltDomainId);
      setResidentId(fixedResidentId || "");
    }
  }, [defaultRltDomainId, fixedResidentId, open]);

  const handleCreate = () => {
    const targetResidentId = fixedResidentId || residentId;
    if (!targetResidentId || !rltDomainId || !statement.trim() || !goal.trim() || !evalDate || !reviewDate) {
      toast.error("Resident, Activity of Living, care need, plan, review of outcome and care plan review date required");
      return;
    }

    const problem = addProblem({
      residentId: targetResidentId,
      category: RLT_DOMAIN_TO_DEFAULT_CATEGORY[rltDomainId] || ("custom" as ProblemCategory),
      rltDomainId,
      problemStatement: statement.trim(),
      riskLevel: risk,
      evaluationDate: evalDate,
      reviewDate,
      notes: notes.trim() || undefined,
      contextReferences,
    });

    addGoal(problem.id, goal.trim(), reviewDate);

    toast.success("Nursing care plan created");
    setOpen(false);
    reset();
    onCreated?.(problem);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-1" /> {buttonLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Nursing Care Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Activity of Living *</Label>
            <Select value={rltDomainId} onValueChange={(value) => setRltDomainId(value as RltDomainId)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose Activity of Living" />
              </SelectTrigger>
              <SelectContent>
                {RLT_DOMAINS.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Current dependency: {currentDependencyLevel ? RLT_DEPENDENCY_LABELS[currentDependencyLevel] : "Not yet recorded"}. Dependency does not determine risk or whether a Care Plan is required.
            </p>
          </div>

          <div>
            <Label>Resident</Label>
            {fixedResidentId ? (
              <Input
                value={selectedResident ? `${selectedResident.firstName} ${selectedResident.lastName}` : "Resident"}
                readOnly
              />
            ) : (
              <Select value={residentId} onValueChange={setResidentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose resident" />
                </SelectTrigger>
                <SelectContent>
                  {residents.map((resident) => (
                    <SelectItem key={resident.id} value={resident.id}>
                      {resident.firstName} {resident.lastName} ({resident.roomNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label>Risk Level</Label>
            <Select value={risk} onValueChange={(value) => setRisk(value as ProblemRiskLevel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RISK_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option} className="capitalize">
                    {option.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {relatedAssessments.length > 0 && (
            <div className="rounded-md border bg-muted/20 p-3 text-sm">
              <div className="font-medium">Related assessment context</div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {relatedAssessments.map((assessment) => (
                  <div key={assessment.id}>
                    {assessmentMeta[assessment.type].name}: {assessment.interpretation} · Last completed{" "}
                    {assessment.date.slice(0, 10)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(domainContext.strengths.length > 0 || domainContext.preferences.length > 0) && (
            <div className="rounded-md border bg-muted/20 p-3 text-sm">
              <div className="font-medium">Strengths and Preferences context</div>
              <p className="mt-1 text-xs text-muted-foreground">Read-only context. Content is inserted only when selected and remains linked to this source version.</p>
              <div className="mt-2 space-y-2">
                {domainContext.strengths.map((item) => <div key={item.id} className="flex items-start justify-between gap-2 rounded bg-background p-2"><div><div className="text-xs font-medium">Strength: {item.title}</div><div className="text-xs text-muted-foreground">{item.description}</div></div><Button type="button" size="sm" variant="outline" onClick={() => { setStatement((value) => value ? `${value}\n${item.description}` : item.description); setContextReferences((refs) => refs.some((ref) => ref.sourceId === item.id) ? refs : [...refs, { type: "resident_strength", sourceId: item.id, sourceVersion: item.versionNumber, insertedAt: new Date().toISOString(), insertedBy: currentUser.id }]); }}>Insert selected strength</Button></div>)}
                {domainContext.preferences.map((item) => <div key={item.id} className="flex items-start justify-between gap-2 rounded bg-background p-2"><div><div className="text-xs font-medium">Preference: {item.title}</div><div className="text-xs text-muted-foreground">{item.preference}</div></div><Button type="button" size="sm" variant="outline" onClick={() => { setGoal((value) => value ? `${value}\n${item.preference}` : item.preference); setContextReferences((refs) => refs.some((ref) => ref.sourceId === item.id) ? refs : [...refs, { type: "resident_preference", sourceId: item.id, sourceVersion: item.versionNumber, insertedAt: new Date().toISOString(), insertedBy: currentUser.id }]); }}>Insert selected preference</Button></div>)}
              </div>
            </div>
          )}

          <div>
            <Label>Care Need</Label>
            <Textarea
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              rows={3}
              placeholder="Describe the resident's care need in this Activity of Living."
            />
          </div>

          <div>
            <Label>Plan</Label>
            <Textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={2}
              placeholder="Describe the intended nursing plan or expected outcome."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Next Review of Outcome</Label>
              <Input type="date" value={evalDate} onChange={(event) => setEvalDate(event.target.value)} />
            </div>
            <div>
              <Label>Care Plan Review Date</Label>
              <Input type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Optional context for this nursing care plan"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Nursing Care Plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
