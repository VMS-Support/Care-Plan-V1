import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCare } from "@/lib/care/store";
import { assessmentMeta, isAssessmentActive } from "@/lib/care/scoring";
import { ASSESSMENT_CATEGORIES } from "@/lib/care/assessments";
import { Search } from "lucide-react";
import type { AssessmentType } from "@/lib/care/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  residentId: string;
}

const ALL_TYPES = (Object.keys(assessmentMeta) as AssessmentType[]).filter(isAssessmentActive);

export function AddAssessmentModal({ open, onOpenChange, residentId }: Props) {
  const { residents, assessments } = useCare();
  const navigate = useNavigate();
  const [step, setStep] = useState<"select" | "review">("select");
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentType | null>(null);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [confirmRepeat, setConfirmRepeat] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("select");
      setSelectedAssessment(null);
      setCategory("all");
      setQuery("");
      setConfirmRepeat(false);
    }
  }, [open]);

  const resident = residents.find((r) => r.id === residentId);
  const assessmentsInCategory = (category === "all"
    ? ALL_TYPES
    : ASSESSMENT_CATEGORIES.find((item) => item.id === category)?.types || [])
    .filter(isAssessmentActive)
    .filter((type) => `${assessmentMeta[type].name} ${assessmentMeta[type].description}`.toLowerCase().includes(query.toLowerCase()));

  function handleSelect(assessmentType: AssessmentType) {
    setSelectedAssessment(assessmentType);
    setStep("review");
  }

  function launchAssessment() {
    if (!selectedAssessment) return;
    onOpenChange(false);
    navigate({
      to: "/assessments/new/$residentId",
      params: { residentId },
      search: { type: selectedAssessment } as any,
    });
  }

  if (step === "select") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Step 1: Select Assessment</DialogTitle>
            <DialogDescription>
              {resident && `For ${resident.firstName} ${resident.lastName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
              <Label>Assessment category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {ASSESSMENT_CATEGORIES.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="assessment-search">Search assessments</Label>
                <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="assessment-search" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="e.g. Waterlow, falls, cognition" /></div>
              </div>
            </div>

            <div className="flex items-center justify-between"><p className="text-sm font-medium">Choose an assessment</p><span className="text-sm text-muted-foreground">{assessmentsInCategory.length} available</span></div>
            <div className="grid sm:grid-cols-2 gap-2 max-h-[22rem] overflow-y-auto pr-1">
              {assessmentsInCategory.map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  className="h-auto min-h-20 py-3 flex flex-col items-start text-left whitespace-normal"
                  onClick={() => handleSelect(type)}
                >
                  <div className="font-medium">{assessmentMeta[type].name}</div>
                  <div className="text-xs text-muted-foreground">
                    {assessmentMeta[type].description}
                  </div>
                </Button>
              ))}
              {!assessmentsInCategory.length && <div className="col-span-full rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No assessments match your search.</div>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === "review" && selectedAssessment) {
    const meta = assessmentMeta[selectedAssessment];
    const activeSameAssessment = assessments
      .filter(
        (assessment) =>
          assessment.residentId === residentId &&
          assessment.type === selectedAssessment &&
          assessment.status === "completed" &&
          !assessment.deletedAt &&
          !assessment.archivedAt &&
          !assessment.supersededById,
      )
      .sort((left, right) => `${right.lockedAt || right.date}`.localeCompare(`${left.lockedAt || left.date}`))[0];
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{confirmRepeat ? "Assessment Already Exists" : "Step 2: Review Assessment Details"}</DialogTitle>
            <DialogDescription>{confirmRepeat ? "Please confirm before creating another assessment of this type." : "Confirm the assessment details before proceeding"}</DialogDescription>
          </DialogHeader>

          {confirmRepeat && activeSameAssessment ? (
            <div className="space-y-3">
              <p className="text-sm">Are you sure you want to do this? There is already an active {meta.name} assessment for this resident.</p>
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
                <div className="font-medium">Most recent {meta.name}</div>
                <div className="mt-1 text-muted-foreground">Score {activeSameAssessment.totalScore}{meta.max ? `/${meta.max}` : ""} · {activeSameAssessment.interpretation} · completed {activeSameAssessment.date.slice(0, 10)}</div>
              </div>
              <p className="text-xs text-muted-foreground">This confirmation helps prevent the same assessment being added accidentally several times in a short period. Continuing will create a revised assessment.</p>
            </div>
          ) : <div className="space-y-3">
            <div className="bg-muted p-3 rounded-md">
              <div className="text-sm font-medium">{meta.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{meta.description}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Assessment Type</div>
                <div className="font-medium">{selectedAssessment}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Assessor</div>
                <div className="font-medium">You</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Date</div>
                <div className="font-medium">{new Date().toISOString().slice(0, 10)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Resident</div>
                <div className="font-medium">
                  {resident?.firstName} {resident?.lastName}
                </div>
              </div>
            </div>
          </div>}

          <DialogFooter>
            <Button variant="outline" onClick={() => confirmRepeat ? setConfirmRepeat(false) : setStep("select")}>
              {confirmRepeat ? "Cancel" : "Back"}
            </Button>
            <Button onClick={() => activeSameAssessment && !confirmRepeat ? setConfirmRepeat(true) : launchAssessment()}>
              {confirmRepeat ? "Yes, Create Revised Assessment" : "Continue to Assessment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
