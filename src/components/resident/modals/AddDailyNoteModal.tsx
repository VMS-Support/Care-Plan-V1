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
import type { DailyNote } from "@/lib/care/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  residentId: string;
}

const NOTE_CATEGORIES = [
  "General",
  "Clinical",
  "Behaviour",
  "Nutrition",
  "Hydration",
  "Skin",
  "Mobility",
  "Family Communication",
  "Medication",
  "Other",
];

const SHIFTS = ["Day", "Evening", "Night"];

const empty = (staff: string, residentId: string): Omit<DailyNote, "id"> => ({
  residentId,
  carePlanId: null,
  date: new Date().toISOString().slice(0, 10),
  staff,
  shift: "Day" as const,
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
  const [category, setCategory] = useState("General");

  useEffect(() => {
    if (open) {
      setForm(empty(currentUserName, residentId));
      setCategory("General");
    }
  }, [open, residentId, currentUserName]);

  const resident = residents.find((r) => r.id === residentId);
  const currentCarePlans = carePlanProblems.filter(
    (plan) => plan.residentId === residentId && plan.status === "active",
  );

  function save() {
    if (!form.observation.trim()) {
      toast.error("Note details required");
      return;
    }

    const item = addNote({
      ...form,
    });

    toast.success("Daily Note Added");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Daily Note</DialogTitle>
          <DialogDescription>
            {resident && `For ${resident.firstName} ${resident.lastName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Shift *</Label>
            <Select value={form.shift} onValueChange={(v) => setForm({ ...form, shift: v as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHIFTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label>Note Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    {getRltDomainForCarePlanProblem(plan)?.title || plan.category.replace(/_/g, " ")} · {plan.problemStatement}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label>Note Details *</Label>
            <Textarea
              rows={4}
              placeholder="Enter your observation..."
              value={form.observation}
              onChange={(e) => setForm({ ...form, observation: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Mood</Label>
            <Select value={form.mood} onValueChange={(v) => setForm({ ...form, mood: v as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["happy", "calm", "anxious", "withdrawn"].map((m) => (
                  <SelectItem key={m} value={m} className="capitalize">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Food Intake</Label>
            <Select
              value={form.foodIntake}
              onValueChange={(v) => setForm({ ...form, foodIntake: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["full", "most", "half", "little"].map((f) => (
                  <SelectItem key={f} value={f} className="capitalize">
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Fluid Intake</Label>
            <Select
              value={form.fluidIntake}
              onValueChange={(v) => setForm({ ...form, fluidIntake: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["good", "moderate", "poor"].map((f) => (
                  <SelectItem key={f} value={f} className="capitalize">
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Sleep</Label>
            <Select value={form.sleep} onValueChange={(v) => setForm({ ...form, sleep: v as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["good", "broken", "poor"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Behaviour</Label>
            <Textarea
              rows={2}
              placeholder="Note any behaviour..."
              value={form.behaviour}
              onChange={(e) => setForm({ ...form, behaviour: e.target.value })}
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
