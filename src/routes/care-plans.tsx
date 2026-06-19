import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCare } from "@/lib/care/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export const Route = createFileRoute("/care-plans")({
  head: () => ({ meta: [{ title: "Care Plans — CarePath" }] }),
  component: CarePlansPage,
});

function EvaluateDialog({ carePlanId }: { carePlanId: string }) {
  const { addEvaluation, updateCarePlan } = useCare();
  const [open, setOpen] = useState(false);
  const [achieve, setAchieve] = useState<"achieved" | "partial" | "not_achieved">("partial");
  const [outcome, setOutcome] = useState<"continue" | "modify" | "close">("continue");
  const [notes, setNotes] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm">Evaluate</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Evaluate Care Plan</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Goal achievement</Label>
            <Select value={achieve} onValueChange={v => setAchieve(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="achieved">Achieved</SelectItem>
                <SelectItem value="partial">Partially achieved</SelectItem>
                <SelectItem value="not_achieved">Not achieved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Outcome</Label>
            <Select value={outcome} onValueChange={v => setOutcome(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="continue">Continue care plan</SelectItem>
                <SelectItem value="modify">Modify care plan</SelectItem>
                <SelectItem value="close">Close care plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Evaluation notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            addEvaluation({
              carePlanId, date: new Date().toISOString(), reviewer: "J. Roberts (RN)",
              goalAchievement: achieve, notes, outcome,
              nextReviewDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
            });
            if (outcome === "close") updateCarePlan(carePlanId, { status: "completed" });
            toast.success("Evaluation recorded");
            setOpen(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewPlanDialog() {
  const { residents, addCarePlan } = useCare();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ residentId: "", title: "", problem: "", goal: "", interventions: "", frequency: "Daily", assignedStaff: "Care team", reviewDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10) });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>New Care Plan</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>New Care Plan</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Resident</Label>
            <Select value={f.residentId} onValueChange={v => setF({ ...f, residentId: v })}>
              <SelectTrigger><SelectValue placeholder="Choose resident" /></SelectTrigger>
              <SelectContent>{residents.map(r => <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName} ({r.roomNumber})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Title</Label><Input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></div>
          <div className="col-span-2"><Label>Problem</Label><Textarea value={f.problem} onChange={e => setF({ ...f, problem: e.target.value })} /></div>
          <div className="col-span-2"><Label>Goal</Label><Textarea value={f.goal} onChange={e => setF({ ...f, goal: e.target.value })} /></div>
          <div className="col-span-2"><Label>Interventions (one per line)</Label><Textarea rows={4} value={f.interventions} onChange={e => setF({ ...f, interventions: e.target.value })} /></div>
          <div><Label>Frequency</Label><Input value={f.frequency} onChange={e => setF({ ...f, frequency: e.target.value })} /></div>
          <div><Label>Assigned staff</Label><Input value={f.assignedStaff} onChange={e => setF({ ...f, assignedStaff: e.target.value })} /></div>
          <div className="col-span-2"><Label>Review date</Label><Input type="date" value={f.reviewDate} onChange={e => setF({ ...f, reviewDate: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!f.residentId || !f.title) { toast.error("Resident and title required"); return; }
            addCarePlan({ ...f, interventions: f.interventions.split("\n").filter(Boolean), status: "active" });
            toast.success("Care plan created");
            setOpen(false);
          }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CarePlansPage() {
  const {
    carePlans, residents, residentCarePlans, carePlanProblems,
    problemInterventions, problemEvaluations,
  } = useCare();
  const [status, setStatus] = useState<"all" | "active" | "completed" | "archived">("active");
  const list = carePlans.filter(c => status === "all" || c.status === status);

  const today = new Date().toISOString().slice(0, 10);
  const planResidents = residentCarePlans
    .filter(p => p.status === "active")
    .map(p => {
      const resident = residents.find(r => r.id === p.residentId);
      const problems = carePlanProblems.filter(x => x.residentId === p.residentId);
      const active = problems.filter(x => x.status === "active");
      const overdueReview = active.filter(x => x.reviewDate <= today).length;
      const overdueEval = active.filter(x => x.evaluationDate <= today).length;
      const interventions = problemInterventions.filter(i => i.status === "active" && problems.some(pr => pr.id === i.problemId)).length;
      return { plan: p, resident, active: active.length, overdueReview, overdueEval, interventions };
    })
    .filter(x => x.resident);

  return (
    <div className="p-4 md:p-8 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Care Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">{planResidents.length} residents with active care plan</p>
        </div>
        <NewPlanDialog />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Resident Care Plans</h2>
        {planResidents.length === 0 && (
          <p className="text-sm text-muted-foreground">No active resident care plans yet.</p>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {planResidents.map(x => (
            <Card key={x.plan.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to="/residents/$id/care-plan" params={{ id: x.resident!.id }} className="font-medium hover:text-primary hover:underline">
                      {x.resident!.firstName} {x.resident!.lastName}
                    </Link>
                    <div className="text-xs text-muted-foreground">Room {x.resident!.roomNumber}</div>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                  <Stat label="Problems" value={x.active} />
                  <Stat label="Interv." value={x.interventions} />
                  <Stat label="Review" value={x.overdueReview} warn={x.overdueReview > 0} />
                  <Stat label="Eval" value={x.overdueEval} warn={x.overdueEval > 0} />
                </div>
                <Link to="/residents/$id/care-plan" params={{ id: x.resident!.id }}>
                  <Button size="sm" variant="outline" className="w-full mt-3">Open care plan →</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Legacy Plans</h2>
        <div className="flex gap-1">
          {(["all", "active", "completed", "archived"] as const).map(s => (
            <Button key={s} size="sm" variant={status === s ? "default" : "outline"} className="capitalize" onClick={() => setStatus(s)}>{s}</Button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {list.map(c => {
            const r = residents.find(x => x.id === c.residentId);
            return (
              <Card key={c.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to="/care-plans/$id" params={{ id: c.id }} className="font-medium hover:text-primary hover:underline">{c.title}</Link>
                      <div className="text-xs">
                        <Link to="/residents/$id" params={{ id: c.residentId }} className="text-primary hover:underline">{r?.firstName} {r?.lastName} · Room {r?.roomNumber}</Link>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">{c.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2"><strong>Problem:</strong> {c.problem}</p>
                  <p className="text-sm text-muted-foreground"><strong>Goal:</strong> {c.goal}</p>
                  <ul className="text-sm mt-2 list-disc pl-5 space-y-0.5">{c.interventions.slice(0, 4).map((i, k) => <li key={k}>{i}</li>)}</ul>
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>Review: {c.reviewDate} · {c.frequency}</span>
                    <div className="flex gap-2">
                      <Link to="/care-plans/$id" params={{ id: c.id }}><Button size="sm" variant="ghost">Open</Button></Link>
                      <EvaluateDialog carePlanId={c.id} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="border rounded-md p-1.5">
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-base font-semibold tabular-nums ${warn && value > 0 ? "text-warning-foreground" : ""}`}>{value}</div>
    </div>
  );
}
