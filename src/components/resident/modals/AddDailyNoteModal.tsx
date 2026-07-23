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
import { getRltDomainForCarePlanProblem } from "@/lib/care/rlt";
import { DAILY_NOTE_CATEGORY_OPTIONS } from "@/lib/care/types";
import type { DailyNote } from "@/lib/care/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  residentId: string;
}

const SHIFTS: Array<{ value: DailyNote["shift"]; label: string }> = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "night", label: "Night" },
];

const empty = (staff: string, residentId: string): Omit<DailyNote, "id"> => ({
  residentId,
  carePlanId: null,
  date: new Date().toISOString(),
  staff,
  shift: "morning",
  category: "general",
  observation: "",
  mood: "calm",
  foodIntake: "full",
  fluidIntake: "good",
  sleep: "good",
  behaviour: "",
});

export function AddDailyNoteModal({ open, onOpenChange, residentId }: Props) {
  const { addNote, currentUserName, residents, carePlanProblems } = useCare();
  const [form, setForm] = useState<Omit<DailyNote, "id">>(empty(currentUserName, residentId));

  useEffect(() => {
    if (open) setForm(empty(currentUserName, residentId));
  }, [open, residentId, currentUserName]);

  const resident = residents.find((r) => r.id === residentId);
  const currentCarePlans = carePlanProblems.filter(
    (plan) => plan.residentId === residentId && plan.status === "active",
  );

  function save() {
    if (!residentId) {
      toast.error("Resident is required");
      return;
    }
    if (!form.shift || !form.category) {
      toast.error("Shift and note category are required");
      return;
    }
    if (!form.observation.trim()) {
      toast.error("Observation is required");
      return;
    }

    addNote({
      ...form,
      residentId,
      date: new Date().toISOString(),
      carePlanId: form.carePlanId || null,
    });

    toast.success("Daily Note Added");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Daily Note</DialogTitle>
          <DialogDescription>
            {resident && `For ${resident.firstName} ${resident.lastName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Resident *</Label>
            <Input value={resident ? `${resident.firstName} ${resident.lastName}` : residentId} disabled />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label>Related Care Plan</Label>
            <Select
              value={form.carePlanId || "none"}
              onValueChange={(value) => setForm({ ...form, carePlanId: value === "none" ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {currentCarePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {getRltDomainForCarePlanProblem(plan)?.title || plan.category.replace(/_/g, " ")} - {plan.problemStatement}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Shift *</Label>
            <Select value={form.shift} onValueChange={(value) => setForm({ ...form, shift: value as DailyNote["shift"] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHIFTS.map((shift) => (
                  <SelectItem key={shift.value} value={shift.value}>
                    {shift.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Note Category *</Label>
            <Select value={form.category || "general"} onValueChange={(value) => setForm({ ...form, category: value as DailyNote["category"] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAILY_NOTE_CATEGORY_OPTIONS.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label>Observation *</Label>
            <Textarea
              rows={4}
              placeholder="Enter the main note, observation, care provided, concern or outcome..."
              value={form.observation}
              onChange={(event) => setForm({ ...form, observation: event.target.value })}
            />
          </div>

          <div className="col-span-2 border-t pt-3">
            <h3 className="text-sm font-medium">Additional Information</h3>
          </div>

          <div className="space-y-1.5">
            <Label>Mood</Label>
            <Select value={form.mood || "not_recorded"} onValueChange={(value) => setForm({ ...form, mood: value as DailyNote["mood"] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["not_recorded", "happy", "calm", "anxious", "withdrawn", "agitated"].map((mood) => (
                  <SelectItem key={mood} value={mood} className="capitalize">
                    {mood.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Food Intake</Label>
            <Select value={form.foodIntake || "not_recorded"} onValueChange={(value) => setForm({ ...form, foodIntake: value as DailyNote["foodIntake"] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["not_recorded", "full", "most", "half", "little", "none"].map((intake) => (
                  <SelectItem key={intake} value={intake} className="capitalize">
                    {intake.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Fluid Intake</Label>
            <Select value={form.fluidIntake || "not_recorded"} onValueChange={(value) => setForm({ ...form, fluidIntake: value as DailyNote["fluidIntake"] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["not_recorded", "good", "moderate", "poor"].map((intake) => (
                  <SelectItem key={intake} value={intake} className="capitalize">
                    {intake.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Sleep</Label>
            <Select value={form.sleep || "not_recorded"} onValueChange={(value) => setForm({ ...form, sleep: value as DailyNote["sleep"] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["not_recorded", "good", "broken", "poor"].map((sleep) => (
                  <SelectItem key={sleep} value={sleep} className="capitalize">
                    {sleep.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label>Behaviour</Label>
            <Textarea
              rows={2}
              placeholder="Enter any behaviour-related details..."
              value={form.behaviour || ""}
              onChange={(event) => setForm({ ...form, behaviour: event.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save Daily Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
