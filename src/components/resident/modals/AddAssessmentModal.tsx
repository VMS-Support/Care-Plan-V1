import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCare } from "@/lib/care/store";
import { assessmentMeta } from "@/lib/care/scoring";
import type { AssessmentType } from "@/lib/care/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  residentId: string;
}

const ASSESSMENT_CATEGORIES: Record<string, AssessmentType[]> = {
  "Mobility & Function": ["barthel"],
  "Pressure & Skin": ["waterlow", "norton"],
  Pain: ["abbey_pain", "pain_chart"],
  Nutrition: ["mna", "nutrition", "must"],
  Cognition: ["mmse", "four_at", "gds15", "cornell"],
  Continence: ["continence"],
  Behaviour: ["abc", "abs"],
  Safety: ["falls"],
  "Person-Centred": ["pinch_me"],
};

export function AddAssessmentModal({ open, onOpenChange, residentId }: Props) {
  const { residents } = useCare();
  const [step, setStep] = useState<"select" | "review" | "form">("select");
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentType | null>(null);
  const [category, setCategory] = useState("Mobility & Function");

  useEffect(() => {
    if (open) {
      setStep("select");
      setSelectedAssessment(null);
      setCategory("Mobility & Function");
    }
  }, [open]);

  const resident = residents.find((r) => r.id === residentId);
  const assessmentsInCategory = ASSESSMENT_CATEGORIES[category] || [];

  function handleSelect(assessmentType: AssessmentType) {
    setSelectedAssessment(assessmentType);
    setStep("review");
  }

  function handleLaunchAssessment() {
    if (!selectedAssessment) return;
    // In a real implementation, this would open an embedded assessment form
    // For now, we'll show a placeholder
    setStep("form");
    toast.info(`Assessment form for ${assessmentMeta[selectedAssessment].name} would open here`);
  }

  if (step === "select") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Step 1: Select Assessment</DialogTitle>
            <DialogDescription>
              {resident && `For ${resident.firstName} ${resident.lastName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Assessment Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(ASSESSMENT_CATEGORIES).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {assessmentsInCategory.map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-start"
                  onClick={() => handleSelect(type)}
                >
                  <div className="font-medium">{assessmentMeta[type].name}</div>
                  <div className="text-xs text-muted-foreground">
                    {assessmentMeta[type].description}
                  </div>
                </Button>
              ))}
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
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Step 2: Review Assessment Details</DialogTitle>
            <DialogDescription>Confirm the assessment details before proceeding</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStep("select")}>
              Back
            </Button>
            <Button onClick={handleLaunchAssessment}>Continue to Assessment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === "form" && selectedAssessment) {
    const meta = assessmentMeta[selectedAssessment];
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Step 3: {meta.name} Assessment Form</DialogTitle>
            <DialogDescription>
              Complete the assessment for {resident?.firstName} {resident?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 p-4 rounded-md text-center text-sm text-muted-foreground">
            <p>Assessment form placeholder for: {selectedAssessment}</p>
            <p className="text-xs mt-1">
              In a real implementation, the full assessment form would render here
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStep("review")}>
              Back
            </Button>
            <Button
              onClick={() => {
                toast.success("Assessment submitted successfully");
                onOpenChange(false);
              }}
            >
              Complete Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
