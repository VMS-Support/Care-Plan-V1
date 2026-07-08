import { useState } from "react";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { CATEGORY_LABELS } from "@/lib/care/problems";
import { CATEGORY_TO_RLT_DOMAIN, RLT_DOMAINS } from "@/lib/care/rlt";
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
  buttonLabel = "New Nursing Care Plan",
  onCreated,
}: Props) {
  const { residents, addProblem, addGoal } = useCare();
  const [open, setOpen] = useState(false);
  const [residentId, setResidentId] = useState(fixedResidentId || "");
  const [category, setCategory] = useState<ProblemCategory>("pressure");
  const [rltDomainId, setRltDomainId] = useState<RltDomainId | "auto">(CATEGORY_TO_RLT_DOMAIN.pressure);
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
    setRltDomainId(CATEGORY_TO_RLT_DOMAIN.pressure);
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
      toast.error("Resident, care need, plan, review of outcome and care plan review date required");
      return;
    }

    const problem = addProblem({
      residentId: targetResidentId,
      category,
      rltDomainId: rltDomainId === "auto" ? undefined : rltDomainId,
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
          <DialogTitle>Create Nursing Care Plan</DialogTitle>
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
              <Label>Activity / Care Area</Label>
              <Select
                value={category}
                onValueChange={(value) => {
                  const nextCategory = value as ProblemCategory;
                  setCategory(nextCategory);
                  setRltDomainId(CATEGORY_TO_RLT_DOMAIN[nextCategory]);
                }}
              >
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
            <Label>Activity of Living</Label>
            <Select value={rltDomainId} onValueChange={(value) => setRltDomainId(value as RltDomainId | "auto")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Use care area mapping</SelectItem>
                {RLT_DOMAINS.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Care Need</Label>
            <Textarea
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              rows={3}
              placeholder="Describe the resident's care need"
            />
          </div>

          <div>
            <Label>Plan</Label>
            <Textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={2}
              placeholder="Describe the nursing plan"
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
          <Button onClick={handleCreate}>Create Care Plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
