import { useState } from "react";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { CATEGORY_LABELS } from "@/lib/care/problems";
import type { CarePlanProblem, ProblemCategory, ProblemRiskLevel } from "@/lib/care/types";
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

const CATEGORY_OPTIONS: ProblemCategory[] = [
  "pressure",
  "falls",
  "nutrition",
  "pain",
  "cognition",
  "continence",
  "mobility",
  "behaviour",
  "custom",
];

const RISK_OPTIONS: ProblemRiskLevel[] = ["low", "moderate", "high", "very_high"];

function todayPlus(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

type Props = {
  residentId?: string;
  trigger?: ReactNode;
  buttonLabel?: string;
  onCreated?: (problem: CarePlanProblem) => void;
};

export function CreateCarePlanDialog({
  residentId: fixedResidentId,
  trigger,
  buttonLabel = "New Care Plan",
  onCreated,
}: Props) {
  const { residents, addProblem, addGoal } = useCare();
  const [open, setOpen] = useState(false);
  const [residentId, setResidentId] = useState(fixedResidentId || "");
  const [category, setCategory] = useState<ProblemCategory>("pressure");
  const [risk, setRisk] = useState<ProblemRiskLevel>("high");
  const [statement, setStatement] = useState("");
  const [goal, setGoal] = useState("");
  const [evalDate, setEvalDate] = useState(todayPlus(7));
  const [reviewDate, setReviewDate] = useState(todayPlus(90));
  const [notes, setNotes] = useState("");

  const selectedResident = residents.find((resident) => resident.id === (fixedResidentId || residentId));

  const reset = () => {
    setResidentId(fixedResidentId || "");
    setCategory("pressure");
    setRisk("high");
    setStatement("");
    setGoal("");
    setEvalDate(todayPlus(7));
    setReviewDate(todayPlus(90));
    setNotes("");
  };

  const handleCreate = () => {
    const targetResidentId = fixedResidentId || residentId;
    if (!targetResidentId || !statement.trim() || !goal.trim() || !evalDate || !reviewDate) {
      toast.error("Resident, problem statement, goal, evaluation date and review date required");
      return;
    }

    const problem = addProblem({
      residentId: targetResidentId,
      category,
      problemStatement: statement.trim(),
      riskLevel: risk,
      evaluationDate: evalDate,
      reviewDate,
      notes: notes.trim() || undefined,
    });

    addGoal(problem.id, goal.trim(), reviewDate);

    toast.success("Care plan created");
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
          <DialogTitle>Create Care Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Care Area</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as ProblemCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {CATEGORY_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>

          <div>
            <Label>Problem Statement</Label>
            <Textarea
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              rows={3}
              placeholder="Enter the resident's care plan problem"
            />
          </div>

          <div>
            <Label>Goal</Label>
            <Textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={2}
              placeholder="Enter the clinical goal"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Next Evaluation Date</Label>
              <Input type="date" value={evalDate} onChange={(event) => setEvalDate(event.target.value)} />
            </div>
            <div>
              <Label>Next Review Date</Label>
              <Input type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} />
            </div>
          </div>

          <div>
            <Label>Optional Notes</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Optional context for the care plan problem"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Care Plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
