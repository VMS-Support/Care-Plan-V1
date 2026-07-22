import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCare } from "@/lib/care/store";
import { getRltDomainForCarePlanProblem } from "@/lib/care/rlt";
import type { Incident } from "@/lib/care/types";
import { toast } from "sonner";

type Mode = "create" | "edit" | "view";
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: Mode;
  record?: Incident;
  defaultResidentId?: string;
}

const empty = (uid: string, residentId: string): Incident => ({
  id: "", residentId, date: new Date().toISOString().slice(0, 10),
  type: "fall", severity: "moderate",
  description: "", immediateAction: "",
  reportedBy: uid, followUpRequired: false, status: "draft", recordStatus: "active",
});

export function IncidentDialog({ open, onOpenChange, mode, record, defaultResidentId }: Props) {
  const { residents, carePlanProblems, addIncident, updateIncident, submitIncident, currentUserName } = useCare();
  const [form, setForm] = useState<Incident>(empty(currentUserName, defaultResidentId || residents[0]?.id || ""));

  useEffect(() => {
    if (open) setForm(record ? { ...record } : empty(currentUserName, defaultResidentId || residents[0]?.id || ""));
  }, [open, record, currentUserName, defaultResidentId, residents]);

  const readOnly = mode === "view";
  const linkedPlans = carePlanProblems.filter(c => c.residentId === form.residentId && c.status === "active");

  function save(submit: boolean) {
    if (!form.description.trim()) { toast.error("Description required"); return; }
    if (mode === "create") {
      const item = addIncident({ ...form, status: submit ? "open" : "draft" });
      toast.success(submit ? "Incident submitted" : "Draft saved");
      onOpenChange(false);
      return item;
    } else if (record) {
      updateIncident(record.id, form);
      if (submit && record.status === "draft") submitIncident(record.id);
      toast.success("Incident updated");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Incident" : mode === "edit" ? "Edit Incident" : "Incident"}</DialogTitle>
          <DialogDescription>All changes are audited and linked to the resident timeline.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Resident *</Label>
            <Select value={form.residentId} onValueChange={v => setForm({ ...form, residentId: v })} disabled={readOnly}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{residents.map(r => <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName} — Room {r.roomNumber}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} disabled={readOnly} />
          </div>
          <div className="space-y-1.5">
            <Label>Type *</Label>
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as any })} disabled={readOnly}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["fall","medication_error","injury","behaviour","near_miss","other"].map(t => (
                  <SelectItem key={t} value={t} className="capitalize">{t.replace("_"," ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Severity *</Label>
            <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v as any })} disabled={readOnly}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["low","moderate","high","critical"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Reported By</Label>
            <Input value={form.reportedBy} onChange={e => setForm({ ...form, reportedBy: e.target.value })} disabled={readOnly} />
          </div>
          <div className="space-y-1.5">
            <Label>Witnessed By</Label>
            <Input value={form.witnessedBy || ""} onChange={e => setForm({ ...form, witnessedBy: e.target.value })} disabled={readOnly} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Description *</Label>
            <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} disabled={readOnly} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Immediate Action Taken</Label>
            <Textarea rows={2} value={form.immediateAction} onChange={e => setForm({ ...form, immediateAction: e.target.value })} disabled={readOnly} />
          </div>
          {linkedPlans.length > 0 && (
            <div className="col-span-2 space-y-1.5">
              <Label>Link to Care Plan</Label>
              <Select value={form.linkedCarePlanId || "none"} onValueChange={v => setForm({ ...form, linkedCarePlanId: v === "none" ? undefined : v })} disabled={readOnly}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {linkedPlans.map((p) => {
                    const domain = getRltDomainForCarePlanProblem(p);
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        {domain?.title || p.category.replace(/_/g, " ")} - {p.problemStatement}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="col-span-2 flex items-center gap-2">
            <Switch checked={form.followUpRequired} onCheckedChange={v => setForm({ ...form, followUpRequired: v })} disabled={readOnly} />
            <Label>Follow-up required</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{readOnly ? "Close" : "Cancel"}</Button>
          {!readOnly && mode === "create" && <Button variant="secondary" onClick={() => save(false)}>Save Draft</Button>}
          {!readOnly && <Button onClick={() => save(true)}>{mode === "create" ? "Submit" : "Save"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
