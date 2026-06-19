import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCare } from "@/lib/care/store";
import type { Visitor } from "@/lib/care/types";
import { toast } from "sonner";

type Mode = "create" | "edit" | "view";
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: Mode;
  record?: Visitor;
  defaultResidentId?: string;
}

const empty = (uid: string, residentId: string): Visitor => ({
  id: "", residentId, date: new Date().toISOString().slice(0, 10),
  visitorName: "", relationship: "Family",
  arrivalTime: new Date().toTimeString().slice(0, 5), departureTime: "",
  notes: "", signedInBy: uid, status: "checked_in", recordStatus: "active",
});

export function VisitorDialog({ open, onOpenChange, mode, record, defaultResidentId }: Props) {
  const { residents, addVisitor, updateVisitor, currentUserName } = useCare();
  const [form, setForm] = useState<Visitor>(empty(currentUserName, defaultResidentId || residents[0]?.id || ""));

  useEffect(() => {
    if (open) setForm(record ? { ...record } : empty(currentUserName, defaultResidentId || residents[0]?.id || ""));
  }, [open, record, currentUserName, defaultResidentId, residents]);

  const readOnly = mode === "view";

  function save() {
    if (!form.visitorName.trim()) { toast.error("Visitor name required"); return; }
    if (mode === "create") { addVisitor(form); toast.success("Visitor recorded"); }
    else if (record) { updateVisitor(record.id, form); toast.success("Visitor updated"); }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Visitor" : mode === "edit" ? "Edit Visitor" : "Visitor"}</DialogTitle>
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
          <div className="space-y-1.5"><Label>Visitor Name *</Label><Input value={form.visitorName} onChange={e => setForm({ ...form, visitorName: e.target.value })} disabled={readOnly} /></div>
          <div className="space-y-1.5"><Label>Relationship</Label><Input value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })} disabled={readOnly} /></div>
          <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} disabled={readOnly} /></div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status || "checked_in"} onValueChange={v => setForm({ ...form, status: v as any })} disabled={readOnly}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["scheduled","checked_in","completed","cancelled"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Arrival Time</Label><Input type="time" value={form.arrivalTime} onChange={e => setForm({ ...form, arrivalTime: e.target.value })} disabled={readOnly} /></div>
          <div className="space-y-1.5"><Label>Departure Time</Label><Input type="time" value={form.departureTime} onChange={e => setForm({ ...form, departureTime: e.target.value })} disabled={readOnly} /></div>
          <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} disabled={readOnly} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{readOnly ? "Close" : "Cancel"}</Button>
          {!readOnly && <Button onClick={save}>{mode === "create" ? "Create" : "Save"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
