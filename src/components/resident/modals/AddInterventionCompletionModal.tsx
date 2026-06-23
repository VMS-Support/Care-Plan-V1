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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCare } from "@/lib/care/store";
import type { ProblemInterventionLog, InterventionOutcome } from "@/lib/care/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  intervention: any; // ProblemIntervention
  residentId: string;
}

const OUTCOMES: { label: string; value: InterventionOutcome }[] = [
  { label: "Completed", value: "completed" },
  { label: "Partially Completed", value: "partially_completed" },
  { label: "Missed", value: "missed" },
  { label: "Refused", value: "refused" },
  { label: "Escalated", value: "escalated" },
];

const empty = (
  interventionId: string,
  residentId: string,
  problemId: string,
  staffName: string,
): Omit<ProblemInterventionLog, "id"> => ({
  interventionId,
  problemId,
  residentId,
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toTimeString().slice(0, 5),
  staffId: "",
  staffName,
  role: "nurse",
  outcome: "completed",
  residentResponse: "",
  followUpRequired: false,
  followUpDetails: "",
  comments: "",
  createdAt: new Date().toISOString(),
});

export function AddInterventionCompletionModal({
  open,
  onOpenChange,
  intervention,
  residentId,
}: Props) {
  const { addProblemInterventionLog, residents, currentUserName, currentRole } = useCare();
  const [form, setForm] = useState<Omit<ProblemInterventionLog, "id">>(
    empty(intervention?.id || "", residentId, intervention?.problemId || "", currentUserName),
  );

  useEffect(() => {
    if (open && intervention) {
      setForm(empty(intervention.id, residentId, intervention.problemId, currentUserName));
    }
  }, [open, intervention, residentId, currentUserName]);

  const resident = residents.find((r) => r.id === residentId);

  function validateForm() {
    if (!form.outcome) {
      toast.error("Please select an outcome");
      return false;
    }
    return true;
  }

  function save() {
    if (!validateForm()) return;

    const item = addProblemInterventionLog({
      ...form,
      staffName: currentUserName,
      role: currentRole,
    });

    toast.success("Intervention completion recorded");
    onOpenChange(false);
  }

  if (!intervention) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Intervention Completion</DialogTitle>
          <DialogDescription>
            {resident && `${resident.firstName} ${resident.lastName}`} · {intervention.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 space-y-3">
          {/* Date & Time */}
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Time *</Label>
            <Input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </div>

          {/* Outcome */}
          <div className="col-span-2 space-y-1.5">
            <Label>Outcome *</Label>
            <Select
              value={form.outcome}
              onValueChange={(v) => setForm({ ...form, outcome: v as InterventionOutcome })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTCOMES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resident Response */}
          <div className="col-span-2 space-y-1.5">
            <Label>Resident Response</Label>
            <Textarea
              rows={2}
              placeholder="How did the resident respond? e.g., Comfortable, cooperative, settled"
              value={form.residentResponse || ""}
              onChange={(e) => setForm({ ...form, residentResponse: e.target.value })}
            />
          </div>

          {/* Follow-up Required */}
          <div className="col-span-2 space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.followUpRequired}
                onChange={(e) => setForm({ ...form, followUpRequired: e.target.checked })}
              />
              <span className="text-sm font-medium">Follow-up Required</span>
            </label>
          </div>

          {/* Follow-up Details - Show only if required */}
          {form.followUpRequired && (
            <div className="col-span-2 space-y-1.5">
              <Label>Follow-up Details</Label>
              <Textarea
                rows={2}
                placeholder="Describe what follow-up action is needed..."
                value={form.followUpDetails || ""}
                onChange={(e) => setForm({ ...form, followUpDetails: e.target.value })}
              />
            </div>
          )}

          {/* Comments */}
          <div className="col-span-2 space-y-1.5">
            <Label>Additional Comments</Label>
            <Textarea
              rows={2}
              placeholder="Any additional notes about this completion..."
              value={form.comments || ""}
              onChange={(e) => setForm({ ...form, comments: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Record Completion</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
