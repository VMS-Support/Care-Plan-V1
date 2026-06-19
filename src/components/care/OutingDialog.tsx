import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCare } from "@/lib/care/store";
import type { Outing } from "@/lib/care/types";
import { toast } from "sonner";

type Mode = "create" | "edit" | "view";
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: Mode;
  record?: Outing;
  defaultResidentId?: string;
}

const empty = (residentId: string): Outing => ({
  id: "", residentId, date: new Date().toISOString().slice(0, 10),
  destination: "", accompaniedBy: "",
  departureTime: "10:00", returnTime: "12:00",
  transportMethod: "Walking", notes: "",
  riskAssessmentCompleted: false, status: "planned", recordStatus: "active",
});

export function OutingDialog({ open, onOpenChange, mode, record, defaultResidentId }: Props) {
  const { residents, addOuting, updateOuting } = useCare();
  const [form, setForm] = useState<Outing>(empty(defaultResidentId || residents[0]?.id || ""));

  useEffect(() => {
    if (open) setForm(record ? { ...record } : empty(defaultResidentId || residents[0]?.id || ""));
  }, [open, record, defaultResidentId, residents]);

  const readOnly = mode === "view";
  function save() {
    if (!form.destination.trim()) { toast.error("Destination required"); return; }
    if (mode === "create") { addOuting(form); toast.success("Outing recorded"); }
    else if (record) { updateOuting(record.id, form); toast.success("Outing updated"); }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Outing" : mode === "edit" ? "Edit Outing" : "Outing"}</DialogTitle>
          <DialogDescription>All changes are audited and shown in the resident timeline.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Resident *</Label>
            <Select value={form.residentId} onValueChange={v => setForm({ ...form, residentId: v })} disabled={readOnly}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{residents.map(r => <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName} — Room {r.roomNumber}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Destination *</Label><Input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} disabled={readOnly} /></div>
          <div className="space-y-1.5"><Label>Accompanied By</Label><Input value={form.accompaniedBy} onChange={e => setForm({ ...form, accompaniedBy: e.target.value })} disabled={readOnly} /></div>
          <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} disabled={readOnly} /></div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status || "planned"} onValueChange={v => setForm({ ...form, status: v as any })} disabled={readOnly}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["planned","departed","returned","cancelled","closed"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Departure</Label><Input type="time" value={form.departureTime} onChange={e => setForm({ ...form, departureTime: e.target.value })} disabled={readOnly} /></div>
          <div className="space-y-1.5"><Label>Return</Label><Input type="time" value={form.returnTime} onChange={e => setForm({ ...form, returnTime: e.target.value })} disabled={readOnly} /></div>
          <div className="col-span-2 space-y-1.5"><Label>Transport</Label><Input value={form.transportMethod} onChange={e => setForm({ ...form, transportMethod: e.target.value })} disabled={readOnly} /></div>
          <div className="col-span-2 space-y-1.5"><Label>Notes / Outcome</Label><Textarea rows={2} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} disabled={readOnly} /></div>
          <div className="col-span-2 flex items-center gap-2">
            <Switch checked={form.riskAssessmentCompleted} onCheckedChange={v => setForm({ ...form, riskAssessmentCompleted: v })} disabled={readOnly} />
            <Label>Risk assessment completed</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{readOnly ? "Close" : "Cancel"}</Button>
          {!readOnly && <Button onClick={save}>{mode === "create" ? "Create" : "Save"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
