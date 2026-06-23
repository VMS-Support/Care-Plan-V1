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
import type { MDTNote } from "@/lib/care/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  residentId: string;
}

const PROFESSIONAL_TYPES = [
  "GP",
  "Nurse",
  "Physiotherapist",
  "Occupational Therapist",
  "Dietitian",
  "Speech & Language",
  "Family Representative",
  "Social Worker",
  "Other",
];

const empty = (staff: string, residentId: string): Omit<MDTNote, "id"> => ({
  residentId,
  date: new Date().toISOString().slice(0, 10),
  attendees: "",
  discussion: "",
  recommendations: "",
  followUpDate: "",
  authoredBy: staff,
  role: "nurse",
});

export function AddMDTNoteModal({ open, onOpenChange, residentId }: Props) {
  const { addMdtNote, currentUserName, residents } = useCare();
  const [form, setForm] = useState<Omit<MDTNote, "id">>(empty(currentUserName, residentId));
  const [professional, setProfessional] = useState("Nurse");

  useEffect(() => {
    if (open) {
      setForm(empty(currentUserName, residentId));
      setProfessional("Nurse");
    }
  }, [open, residentId, currentUserName]);

  const resident = residents.find((r) => r.id === residentId);

  function save() {
    if (!form.discussion.trim()) {
      toast.error("Discussion summary required");
      return;
    }

    const item = addMdtNote({
      ...form,
      role: professional.toLowerCase() === "gp" ? "doctor" : "nurse",
    } as any);

    toast.success("MDT Note Added");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add MDT Note</DialogTitle>
          <DialogDescription>
            {resident && `For ${resident.firstName} ${resident.lastName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Professional Type</Label>
            <Select value={professional} onValueChange={setProfessional}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROFESSIONAL_TYPES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label>Attendees</Label>
            <Input
              placeholder="e.g., Dr. Patel (GP), J. Roberts (RN), Family"
              value={form.attendees}
              onChange={(e) => setForm({ ...form, attendees: e.target.value })}
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label>Discussion Summary *</Label>
            <Textarea
              rows={3}
              placeholder="Summary of MDT discussion..."
              value={form.discussion}
              onChange={(e) => setForm({ ...form, discussion: e.target.value })}
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label>Recommendations</Label>
            <Textarea
              rows={3}
              placeholder="Recommendations from MDT..."
              value={form.recommendations}
              onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Authored By</Label>
            <Input
              value={form.authoredBy}
              onChange={(e) => setForm({ ...form, authoredBy: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Follow-up Date</Label>
            <Input
              type="date"
              value={form.followUpDate}
              onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save MDT Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
