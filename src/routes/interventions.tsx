import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCare } from "@/lib/care/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/interventions")({
  head: () => ({ meta: [{ title: "Interventions — CarePath" }] }),
  component: InterventionsPage,
});

function NewIntervention() {
  const { residents, addIntervention } = useCare();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ residentId: "", intervention: "", outcome: "", residentResponse: "", followUpRequired: false });
  const presets = ["Resident repositioned", "Pain relief administered", "Hydration encouraged", "Mobility exercise completed", "Pressure area checked", "Food intake monitored"];
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Record Intervention</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Intervention</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Resident</Label>
            <Select value={f.residentId} onValueChange={v => setF({ ...f, residentId: v })}>
              <SelectTrigger><SelectValue placeholder="Choose resident" /></SelectTrigger>
              <SelectContent>{residents.map(r => <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Intervention</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {presets.map(p => <Button key={p} type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setF({ ...f, intervention: p })}>{p}</Button>)}
            </div>
            <Input value={f.intervention} onChange={e => setF({ ...f, intervention: e.target.value })} />
          </div>
          <div><Label>Outcome</Label><Textarea value={f.outcome} onChange={e => setF({ ...f, outcome: e.target.value })} /></div>
          <div><Label>Resident response</Label><Input value={f.residentResponse} onChange={e => setF({ ...f, residentResponse: e.target.value })} /></div>
          <div className="flex items-center justify-between"><Label>Follow-up required</Label><Switch checked={f.followUpRequired} onCheckedChange={v => setF({ ...f, followUpRequired: v })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!f.residentId || !f.intervention) { toast.error("Resident and intervention required"); return; }
            addIntervention({ ...f, date: new Date().toISOString(), staff: "J. Roberts" });
            toast.success("Intervention recorded");
            setOpen(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InterventionsPage() {
  const { interventions, residents } = useCare();
  return (
    <div className="p-4 md:p-8 space-y-5">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Interventions</h1>
          <p className="text-sm text-muted-foreground mt-1">{interventions.length} interventions logged</p>
        </div>
        <NewIntervention />
      </div>
      <div className="space-y-2">
        {interventions.map(i => {
          const r = residents.find(x => x.id === i.residentId);
          return (
            <Card key={i.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{i.intervention}</div>
                    <div className="text-xs text-muted-foreground">{r?.firstName} {r?.lastName} · {i.date.slice(0, 10)} · {i.staff}</div>
                  </div>
                  {i.followUpRequired && <span className="text-xs bg-warning/15 text-warning-foreground px-2 py-0.5 rounded">Follow-up</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-2">Outcome: {i.outcome}</p>
                <p className="text-xs text-muted-foreground">Response: {i.residentResponse}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
