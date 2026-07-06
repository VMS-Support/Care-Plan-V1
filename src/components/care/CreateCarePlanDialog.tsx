import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { CATEGORY_LABELS, PREDEFINED_GOALS } from "@/lib/care/problems";
import type { FrequencyType, ProblemCategory, ProblemRiskLevel } from "@/lib/care/types";
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
  "behaviour",
  "continence",
  "mobility",
  "cognition",
  "communication",
  "personal_care",
  "mental_health",
  "social",
  "sleep",
  "medication",
  "end_of_life",
  "skin",
  "safeguarding",
  "custom",
];

const RISK_OPTIONS: ProblemRiskLevel[] = ["none", "low", "moderate", "high", "very_high"];
const FREQUENCY_OPTIONS: FrequencyType[] = ["daily", "per_shift", "weekly", "monthly", "prn", "custom"];
const CARE_TEAM_VALUE = "__care_team__";

function todayPlus(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

type Props = {
  residentId?: string;
  trigger?: ReactNode;
  buttonLabel?: string;
};

export function CreateCarePlanDialog({ residentId: fixedResidentId, trigger, buttonLabel = "New Care Plan" }: Props) {
  const { residents, addProblem, addGoal, addProblemIntervention, users } = useCare();
  const [open, setOpen] = useState(false);
  const [residentId, setResidentId] = useState(fixedResidentId || "");
  const [category, setCategory] = useState<ProblemCategory>("pressure");
  const [statement, setStatement] = useState("");
  const [risk, setRisk] = useState<ProblemRiskLevel>("moderate");
  const [goal, setGoal] = useState("");
  const [interventions, setInterventions] = useState("");
  const [frequencyType, setFrequencyType] = useState<FrequencyType>("daily");
  const [frequencyInstructions, setFrequencyInstructions] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState(CARE_TEAM_VALUE);
  const [evalDate, setEvalDate] = useState(todayPlus(7));
  const [reviewDate, setReviewDate] = useState(todayPlus(90));

  const selectedResident = residents.find((resident) => resident.id === (fixedResidentId || residentId));
  const goalSuggestions = useMemo(() => PREDEFINED_GOALS[category] || [], [category]);

  const reset = () => {
    setResidentId(fixedResidentId || "");
    setCategory("pressure");
    setStatement("");
    setRisk("moderate");
    setGoal("");
    setInterventions("");
    setFrequencyType("daily");
    setFrequencyInstructions("");
    setAssignedStaffId(CARE_TEAM_VALUE);
    setEvalDate(todayPlus(7));
    setReviewDate(todayPlus(90));
  };

  const handleCreate = () => {
    const targetResidentId = fixedResidentId || residentId;
    if (!targetResidentId || !statement.trim()) {
      toast.error("Resident and problem statement required");
      return;
    }

    const problem = addProblem({
      residentId: targetResidentId,
      category,
      problemStatement: statement.trim(),
      riskLevel: risk,
      evaluationDate: evalDate,
      reviewDate,
    });

    if (goal.trim()) {
      addGoal(problem.id, goal.trim(), reviewDate);
    }

    const staff = assignedStaffId === CARE_TEAM_VALUE ? undefined : users.find((user) => user.id === assignedStaffId);
    interventions
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((name) => {
        addProblemIntervention({
          problemId: problem.id,
          name,
          frequencyType,
          frequencyInstructions: frequencyInstructions.trim() || undefined,
          assignedRole: staff?.role,
          assignedStaffId: staff?.id,
          assignedStaffName: staff?.name,
        });
      });

    toast.success("Care plan problem added");
    setOpen(false);
    reset();
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
              <Label>Category</Label>
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
              placeholder="Resident is at risk of..."
            />
          </div>

          <div>
            <Label>Goal</Label>
            <Textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={2}
              placeholder="Goal or expected outcome"
            />
            {goalSuggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {goalSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setGoal(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Interventions (one per line)</Label>
            <Textarea
              value={interventions}
              onChange={(event) => setInterventions(event.target.value)}
              rows={4}
              placeholder="Add one or more interventions"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Schedule</Label>
              <Select value={frequencyType} onValueChange={(value) => setFrequencyType(value as FrequencyType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option} className="capitalize">
                      {option.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assigned Staff</Label>
              <Select value={assignedStaffId} onValueChange={setAssignedStaffId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CARE_TEAM_VALUE}>Care team</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Schedule Notes</Label>
            <Input
              value={frequencyInstructions}
              onChange={(event) => setFrequencyInstructions(event.target.value)}
              placeholder="Optional timing or instructions"
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
