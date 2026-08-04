import { useEffect, useMemo, useState } from "react";
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
import type { HandoverNote } from "@/lib/care/types";
import { toast } from "sonner";

type Mode = "create" | "edit" | "view";
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: Mode;
  record?: HandoverNote;
  defaultResidentId?: string;
}

const shiftFromLabel = (label: string): HandoverNote["shift"] => {
  if (label.toLowerCase().includes("night")) return "night";
  if (label.toLowerCase().includes("late") || label.toLowerCase().includes("evening"))
    return "afternoon";
  return "morning";
};

const empty = (
  uid: string,
  residentId: string,
  context?: ReturnType<typeof useCare>["operationalContext"],
): HandoverNote => ({
  id: "",
  residentId,
  date: context?.operationalDate || new Date().toISOString().slice(0, 10),
  shift: context ? shiftFromLabel(context.shiftLabel) : "morning",
  staff: uid,
  summary: "",
  outstandingActions: "",
  nursingHomeId: context?.nursingHomeId,
  wardId: context?.wardIds[0],
  sourceShiftId: context?.shiftId,
  operationalDate: context?.operationalDate,
  priority: "medium",
  status: "open",
  recordStatus: "active",
});

export function HandoverDialog({ open, onOpenChange, mode, record, defaultResidentId }: Props) {
  const {
    addHandover,
    updateHandover,
    currentUserName,
    operationalContext,
    getResidentsForContext,
  } = useCare();
  const residents = useMemo(() => getResidentsForContext(), [getResidentsForContext]);
  const residentFallbackId = defaultResidentId || residents[0]?.id || "";
  const [form, setForm] = useState<HandoverNote>(
    empty(currentUserName, residentFallbackId, operationalContext),
  );

  useEffect(() => {
    if (open)
      setForm(
        record ? { ...record } : empty(currentUserName, residentFallbackId, operationalContext),
      );
  }, [open, record, currentUserName, residentFallbackId, operationalContext]);

  const readOnly = mode === "view";
  function save() {
    if (!form.residentId) {
      toast.error("Resident required");
      return;
    }
    if (!form.summary.trim()) {
      toast.error("Handover note required");
      return;
    }
    if (mode === "create") {
      addHandover(form);
      toast.success("Manual handover note created");
    } else if (record) {
      updateHandover(record.id, form);
      toast.success("Manual handover note updated");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "New Manual Handover Note"
              : mode === "edit"
                ? "Edit Manual Handover Note"
                : "Manual Handover Note"}
          </DialogTitle>
          <DialogDescription>
            Record a specific resident message that is not generated from clinical activity. Changes
            are audited and shown in the resident timeline.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Resident *</Label>
            <Select
              value={form.residentId || undefined}
              onValueChange={(v) => setForm({ ...form, residentId: v })}
              disabled={readOnly || residents.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    residents.length === 0 ? "No residents in current context" : "Select resident"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {residents.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.firstName} {r.lastName} — Room {r.roomNumber}
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
              disabled={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Shift *</Label>
            <Select
              value={form.shift}
              onValueChange={(v) => setForm({ ...form, shift: v as HandoverNote["shift"] })}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["morning", "afternoon", "night"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Recorded By</Label>
            <Input value={form.staff} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select
              value={form.priority || "medium"}
              onValueChange={(v) =>
                setForm({ ...form, priority: v as NonNullable<HandoverNote["priority"]> })
              }
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["low", "medium", "high", "critical"].map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Handover Note *</Label>
            <Textarea
              rows={4}
              placeholder="Enter the information the next shift needs to know"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              disabled={readOnly}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Outstanding Action</Label>
            <Textarea
              rows={2}
              placeholder="Describe any action or follow-up still required"
              value={form.outstandingActions}
              onChange={(e) => setForm({ ...form, outstandingActions: e.target.value })}
              disabled={readOnly}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button onClick={save}>{mode === "create" ? "Add Manual Note" : "Save Changes"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
