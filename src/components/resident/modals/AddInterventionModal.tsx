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
import type { ProblemIntervention, FrequencyType } from "@/lib/care/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  residentId: string;
  initialProblemId?: string;
  lockProblemSelection?: boolean;
}

const FREQUENCY_OPTIONS: { label: string; value: FrequencyType }[] = [
  { label: "Once", value: "once" },
  { label: "Per Shift", value: "per_shift" },
  { label: "Every 2 Hours", value: "every_2_hours" },
  { label: "Every 4 Hours", value: "every_4_hours" },
  { label: "Every 6 Hours", value: "every_6_hours" },
  { label: "Hourly", value: "hourly" },
  { label: "Daily", value: "daily" },
  { label: "Twice Daily", value: "twice_daily" },
  { label: "Three Times Daily", value: "three_times_daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "PRN (As Needed)", value: "prn" },
  { label: "Custom", value: "custom" },
];

const ASSIGNED_ROLES = ["Carer", "Nurse", "Physiotherapist", "Occupational Therapist"];

const empty = (residentId: string): Omit<ProblemIntervention, "id"> => ({
  residentId,
  problemId: "",
  name: "",
  description: "",
  frequencyType: "daily",
  frequencyValue: undefined,
  frequencyInstructions: "",
  assignedRole: "Nurse",
  assignedStaffId: undefined,
  assignedStaffName: "",
  startDate: new Date().toISOString().slice(0, 10),
  reviewDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  status: "active",
  notes: "",
  createdAt: new Date().toISOString(),
  createdBy: "",
  createdByRole: "nurse",
});

export function AddInterventionModal({
  open,
  onOpenChange,
  residentId,
  initialProblemId,
  lockProblemSelection,
}: Props) {
  const { carePlanProblems, residents, currentUserName, currentRole, addProblemIntervention } =
    useCare();
  const [form, setForm] = useState<Omit<ProblemIntervention, "id">>(empty(residentId));
  const [frequency, setFrequency] = useState<FrequencyType>("daily");

  useEffect(() => {
    if (open) {
      const newForm = empty(residentId);
      if (initialProblemId) {
        newForm.problemId = initialProblemId;
      }
      setForm(newForm);
      setFrequency("daily");
    }
  }, [open, residentId, initialProblemId]);

  const resident = residents.find((r) => r.id === residentId);
  const problems = carePlanProblems.filter(
    (p) => p.residentId === residentId && p.status === "active",
  );

  function validateForm() {
    if (!form.problemId.trim()) {
      toast.error("Please select a care plan problem");
      return false;
    }
    if (!form.name.trim()) {
      toast.error("Intervention name is required");
      return false;
    }
    if (!form.startDate) {
      toast.error("Start date is required");
      return false;
    }
    if (!form.endDate) {
      toast.error("End date is required");
      return false;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error("End date must be after start date");
      return false;
    }
    return true;
  }

  function save() {
    if (!validateForm()) return;

    try {
      addProblemIntervention({
        ...form,
        frequencyType: frequency,
        createdBy: currentUserName,
        createdByRole: currentRole,
      });

      toast.success("Care action scheduled successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule care action");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Care Action</DialogTitle>
          <DialogDescription>
            {resident &&
              `For ${resident.firstName} ${resident.lastName} â€” Define and schedule the care action`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 space-y-3">
          {/* Care Plan Problem Selection */}
          <div className="col-span-2 space-y-1.5">
            <Label>Related Nursing Care Plan *</Label>
            <Select
              value={form.problemId}
              onValueChange={(v) => setForm({ ...form, problemId: v })}
              disabled={lockProblemSelection}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a nursing care plan..." />
              </SelectTrigger>
              <SelectContent>
                {problems.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {`${p.problemStatement} â€¢ ${p.category.replace(/_/g, " ")} â€¢ ${p.riskLevel.replace(/_/g, " ")} â€¢ ${p.status}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {problems.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No active nursing care plans. Create one first.
              </p>
            )}
          </div>

          {/* Care Action Name */}
          <div className="col-span-2 space-y-1.5">
            <Label>Care Action Name *</Label>
            <Input
              placeholder="e.g., Daily skin inspection, reposition every 2 hours"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="col-span-2 space-y-1.5">
            <Label>Description</Label>
            <Textarea
              rows={2}
              placeholder="Detailed description of the care action..."
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-1.5">
            <Label>Frequency *</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as FrequencyType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={form.assignedRole || "Nurse"}
              onValueChange={(v) => setForm({ ...form, assignedRole: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNED_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned Staff */}
          <div className="space-y-1.5">
            <Label>Assigned To</Label>
            <Input
              placeholder="e.g., J. Roberts (RN)"
              value={form.assignedStaffName || ""}
              onChange={(e) => setForm({ ...form, assignedStaffName: e.target.value })}
            />
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <Label>Start Date *</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>

          {/* Review Date */}
          <div className="space-y-1.5">
            <Label>Review Date *</Label>
            <Input
              type="date"
              value={form.reviewDate}
              onChange={(e) => setForm({ ...form, reviewDate: e.target.value })}
              title="Intervention status will be set to 'Review Due' on this date"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <Label>End Date *</Label>
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              title="Intervention will complete or require review on this date"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="review_due">Review Due</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="col-span-2 space-y-1.5">
            <Label>Additional Notes</Label>
            <Textarea
              rows={2}
              placeholder="Clinical notes, special instructions, precautions..."
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Schedule Intervention</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

