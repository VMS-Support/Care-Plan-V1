import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, GitBranch, FileCheck2, AlertTriangle, Calendar, Printer, ClipboardCheck, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/care-plans/$id")({
  head: ({ params }) => ({ meta: [{ title: `Care Plan ${params.id} — CarePath` }] }),
  component: CarePlanDetail,
});

function statusCls(s: string) {
  if (s === "active") return "bg-success/10 text-success border-success/30";
  if (s === "superseded") return "bg-muted text-muted-foreground";
  if (s === "completed") return "bg-info/10 text-info border-info/30";
  if (s.includes("overdue")) return "bg-destructive/10 text-destructive border-destructive/30";
  return "bg-warning/15 text-warning-foreground border-warning/40";
}

function EvaluateDialog({ carePlanId, residentId, onRevisePrompt }: { carePlanId: string; residentId: string; onRevisePrompt: () => void }) {
  const { addCarePlanEvaluation, updateCarePlan, currentUserName, currentRole } = useCare();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    summary: "", goalsMet: "partially" as const, outcomeRating: "good" as const,
    residentFeedback: "", familyFeedback: "", recommendations: "",
    reviseRequired: false, signature: "",
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><FileCheck2 className="h-3.5 w-3.5 mr-1.5" /> Evaluate</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Evaluate Care Plan</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Evaluation summary</Label><Textarea value={f.summary} onChange={e => setF({ ...f, summary: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Goals met?</Label>
              <Select value={f.goalsMet} onValueChange={v => setF({ ...f, goalsMet: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="partially">Partially</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Outcome</Label>
              <Select value={f.outcomeRating} onValueChange={v => setF({ ...f, outcomeRating: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="some">Some improvement</SelectItem>
                  <SelectItem value="no">No change</SelectItem>
                  <SelectItem value="deterioration">Deterioration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Resident feedback</Label><Textarea rows={2} value={f.residentFeedback} onChange={e => setF({ ...f, residentFeedback: e.target.value })} /></div>
            <div><Label>Family feedback</Label><Textarea rows={2} value={f.familyFeedback} onChange={e => setF({ ...f, familyFeedback: e.target.value })} /></div>
          </div>
          <div><Label>Recommendations</Label><Textarea value={f.recommendations} onChange={e => setF({ ...f, recommendations: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.reviseRequired} onChange={e => setF({ ...f, reviseRequired: e.target.checked })} />
            Revise care plan (creates new version, supersedes this one)
          </label>
          <div><Label>Electronic signature (type your full name)</Label><Input value={f.signature} onChange={e => setF({ ...f, signature: e.target.value })} placeholder={currentUserName} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!f.summary || !f.signature} onClick={() => {
            addCarePlanEvaluation({
              carePlanId, date: new Date().toISOString(), evaluatedBy: currentUserName, role: currentRole,
              ...f, signature: f.signature || currentUserName, locked: true,
              nextEvaluationDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
            });
            if (f.reviseRequired) updateCarePlan(carePlanId, { status: "review_due" });
            toast.success("Evaluation locked and signed");
            setOpen(false);
            // Always prompt: would you like to revise?
            setTimeout(onRevisePrompt, 250);
          }}>Sign &amp; Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LogInterventionDialog({ carePlanId, residentId, interventionsSpec }: { carePlanId: string; residentId: string; interventionsSpec: any[] }) {
  const { addInterventionLog, currentUserName, currentRole } = useCare();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    interventionSpecId: interventionsSpec[0]?.id || "",
    outcome: "completed" as const,
    residentResponse: "",
    comments: "",
    followUpRequired: false,
    signature: "",
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><ClipboardCheck className="h-3.5 w-3.5 mr-1.5" /> Log Intervention</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Log intervention delivery</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {interventionsSpec.length > 0 && (
            <div>
              <Label>Intervention</Label>
              <Select value={f.interventionSpecId} onValueChange={v => setF({ ...f, interventionSpecId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {interventionsSpec.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.frequency})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Outcome</Label>
            <Select value={f.outcome} onValueChange={v => setF({ ...f, outcome: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="partially_completed">Partially completed</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="refused">Refused by resident</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Resident response</Label><Textarea rows={2} value={f.residentResponse} onChange={e => setF({ ...f, residentResponse: e.target.value })} /></div>
          <div><Label>Comments</Label><Textarea rows={2} value={f.comments} onChange={e => setF({ ...f, comments: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.followUpRequired} onChange={e => setF({ ...f, followUpRequired: e.target.checked })} />
            Follow-up required
          </label>
          <div><Label>Signature</Label><Input value={f.signature} onChange={e => setF({ ...f, signature: e.target.value })} placeholder={currentUserName} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            const now = new Date();
            addInterventionLog({
              carePlanId, residentId,
              interventionSpecId: f.interventionSpecId || undefined,
              date: now.toISOString().slice(0, 10),
              time: now.toISOString().slice(11, 16),
              staff: currentUserName, role: currentRole,
              outcome: f.outcome, residentResponse: f.residentResponse, comments: f.comments,
              followUpRequired: f.followUpRequired, signature: f.signature || currentUserName,
            });
            toast.success("Intervention logged");
            setOpen(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviseDialog({ carePlanId }: { carePlanId: string }) {
  const { reviseCarePlan } = useCare();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><GitBranch className="h-3.5 w-3.5 mr-1.5" /> Revise</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Revise care plan</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">A new version will be created and this one will be marked as superseded.</p>
        <Textarea placeholder="Reason for revision…" value={reason} onChange={e => setReason(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!reason.trim()} onClick={() => {
            reviseCarePlan(carePlanId, reason);
            toast.success("New care plan version created");
            setOpen(false);
          }}>Revise</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CarePlanDetail() {
  const { id } = Route.useParams();
  const {
    carePlans, residents, carePlanEvaluations, carePlanReviews,
    interventions, notes, tasks, currentRole,
    interventionLogs, readReceipts, recordReadReceipt, reviseCarePlan,
    incidents, mdtNotes, assessments,
  } = useCare();
  const plan = carePlans.find(c => c.id === id);
  const [revisePromptOpen, setRevisePromptOpen] = useState(false);
  const [reviseReason, setReviseReason] = useState("");

  useEffect(() => {
    if (plan) recordReadReceipt("care_plan", plan.id);
  }, [plan?.id]);

  if (!plan) return <div className="p-8">Care plan not found. <Link to="/care-plans" className="text-primary underline">Back</Link></div>;

  const resident = residents.find(r => r.id === plan.residentId);
  const evals = carePlanEvaluations.filter(e => e.carePlanId === id).sort((a, b) => b.date.localeCompare(a.date));
  const reviews = carePlanReviews.filter(r => r.carePlanId === id).sort((a, b) => b.date.localeCompare(a.date));
  const linkedInterventions = interventions.filter(i => i.carePlanId === id);
  const linkedNotes = notes.filter(n => n.residentId === plan.residentId).slice(0, 10);
  const linkedTasks = tasks.filter(t => t.linkedCarePlanId === id);
  const planLogs = interventionLogs.filter(l => l.carePlanId === id);
  const linkedIncidents = incidents.filter(i => (i as any).linkedCarePlanId === id || i.residentId === plan.residentId).slice(0, 10);
  const linkedMDT = mdtNotes.filter(m => (m as any).linkedCarePlanId === id || m.residentId === plan.residentId).slice(0, 10);
  const linkedDaily = notes.filter(n => (n as any).linkedCarePlanId === id).slice(0, 10);
  const linkedAssessment = plan.linkedAssessmentId ? assessments.find(a => a.id === plan.linkedAssessmentId) : null;
  const planReceipts = readReceipts.filter(r => r.entityId === id);
  const versions = carePlans.filter(c => c.id === id || c.supersedesId === id || c.id === plan.supersedesId)
    .sort((a, b) => (b.version || 1) - (a.version || 1));

  const overdueReview = plan.status === "active" && new Date(plan.reviewDate) < new Date();

  const compliance = useMemo(() => {
    const total = planLogs.length;
    const completed = planLogs.filter(l => l.outcome === "completed").length;
    const partial = planLogs.filter(l => l.outcome === "partially_completed").length;
    const missed = planLogs.filter(l => l.outcome === "missed").length;
    const refused = planLogs.filter(l => l.outcome === "refused").length;
    const late = planLogs.filter(l => l.late).length;
    const pct = total === 0 ? 0 : Math.round(((completed + partial * 0.5) / total) * 100);
    return { total, completed, partial, missed, refused, late, pct };
  }, [planLogs]);

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <Link to="/care-plans" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> All care plans
      </Link>

      <Card className="border-info/40 bg-info/5">
        <CardContent className="p-3 text-sm flex items-center justify-between gap-3 flex-wrap">
          <div>
            <strong>Legacy care plan view.</strong> Clinical activity now flows through the unified Resident Care Plan (problems → goals → interventions).
          </div>
          <Link to="/residents/$id/care-plan" params={{ id: plan.residentId }}>
            <Button size="sm">Open unified care plan →</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight">{plan.title}</h1>
                <Badge variant="outline" className={`capitalize ${statusCls(plan.status)}`}>{plan.status.replace("_", " ")}</Badge>
                {plan.priority && <Badge variant="outline" className="capitalize">{plan.priority}</Badge>}
                <Badge variant="secondary" className="text-[10px]">v{plan.version || 1}</Badge>
              </div>
              {resident && (
                <Link to="/residents/$id" params={{ id: resident.id }} className="text-sm text-primary hover:underline mt-1 inline-block">
                  {resident.firstName} {resident.lastName} · Room {resident.roomNumber}
                </Link>
              )}
              {plan.category && <p className="text-xs text-muted-foreground mt-1">Category: {plan.category}</p>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1.5" /> Print / PDF</Button>
              {can(currentRole, "intervention.create") && plan.status === "active" && (
                <LogInterventionDialog carePlanId={plan.id} residentId={plan.residentId} interventionsSpec={plan.interventionsSpec || []} />
              )}
              {can(currentRole, "careplan.evaluate") && plan.status === "active" && (
                <EvaluateDialog carePlanId={plan.id} residentId={plan.residentId} onRevisePrompt={() => setRevisePromptOpen(true)} />
              )}
              {can(currentRole, "careplan.revise") && plan.status === "active" && <ReviseDialog carePlanId={plan.id} />}
            </div>
          </div>

          {/* Intervention compliance bar */}
          {compliance.total > 0 && (
            <div className="mt-4 rounded-md border p-3 bg-muted/30">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <div className="font-medium">Intervention Compliance</div>
                <div className="tabular-nums">{compliance.pct}% over {compliance.total} log{compliance.total !== 1 ? "s" : ""}</div>
              </div>
              <Progress value={compliance.pct} className="h-2" />
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                <span><strong className="text-success">{compliance.completed}</strong> completed</span>
                <span><strong>{compliance.partial}</strong> partial</span>
                <span><strong className="text-destructive">{compliance.missed}</strong> missed</span>
                <span><strong>{compliance.refused}</strong> refused</span>
                {compliance.late > 0 && <span><strong className="text-warning">{compliance.late}</strong> late</span>}
              </div>
            </div>
          )}

          {overdueReview && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 text-destructive p-2 text-sm">
              <AlertTriangle className="h-4 w-4" /> Review overdue (was due {plan.reviewDate})
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals ({plan.goals?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="interventions">Interventions ({linkedInterventions.length})</TabsTrigger>
          <TabsTrigger value="logs">Delivery Log ({planLogs.length})</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations ({evals.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="versions">Versions ({versions.length})</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="receipts">Read Receipts ({planReceipts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle className="text-base">Problem Statement</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>{plan.problemStatement || plan.problem}</p>
                {plan.identifiedNeeds && plan.identifiedNeeds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">{plan.identifiedNeeds.map(n => <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>)}</div>
                )}
              </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Goal</CardTitle></CardHeader>
              <CardContent className="text-sm">{plan.goal}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> Schedule</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <div><span className="text-muted-foreground">Frequency:</span> {plan.frequency}</div>
                <div><span className="text-muted-foreground">Assigned:</span> {plan.assignedStaff}</div>
                <div><span className="text-muted-foreground">Review:</span> {plan.reviewDate}</div>
                <div><span className="text-muted-foreground">Evaluation:</span> {plan.evaluationDate || "—"}</div>
                <Separator className="my-2" />
                <div className="text-xs text-muted-foreground">Created {plan.createdAt.slice(0, 10)} by {plan.createdBy}</div>
                {plan.updatedAt && <div className="text-xs text-muted-foreground">Updated {plan.updatedAt.slice(0, 10)} by {plan.updatedBy}</div>}
                {plan.revisionReason && <div className="text-xs text-muted-foreground italic">Revision: {plan.revisionReason}</div>}
              </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Interventions (Plan)</CardTitle></CardHeader>
              <CardContent><ul className="text-sm list-disc pl-5 space-y-1">{plan.interventions.map((i, k) => <li key={k}>{i}</li>)}</ul></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-2">
          {(plan.goals || []).map(g => (
            <Card key={g.id}><CardContent className="p-3">
              <div className="flex items-center justify-between"><div className="font-medium">{g.title}</div>
                <div className="flex gap-1"><Badge variant="outline" className="capitalize text-[10px]">{g.status.replace("_", " ")}</Badge><Badge variant="secondary" className="text-[10px] capitalize">{g.priority}</Badge></div>
              </div>
              {g.description && <p className="text-sm text-muted-foreground mt-1">{g.description}</p>}
              {g.targetDate && <div className="text-xs text-muted-foreground mt-1">Target: {g.targetDate}</div>}
            </CardContent></Card>
          ))}
          {(!plan.goals || plan.goals.length === 0) && <p className="text-sm text-muted-foreground">No SMART goals defined yet.</p>}
        </TabsContent>

        <TabsContent value="interventions" className="space-y-2">
          {linkedInterventions.length === 0 && <p className="text-sm text-muted-foreground">No interventions logged against this plan yet.</p>}
          {linkedInterventions.map(i => (
            <Card key={i.id}><CardContent className="p-3 text-sm">
              <div className="flex justify-between"><div className="font-medium">{i.intervention}</div><div className="text-xs text-muted-foreground">{i.date.slice(0, 10)}</div></div>
              <p className="text-muted-foreground">Outcome: {i.outcome}</p>
              <p className="text-xs text-muted-foreground">Response: {i.residentResponse} · {i.staff}</p>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-2">
          {evals.length === 0 && <p className="text-sm text-muted-foreground">No evaluations recorded.</p>}
          {evals.map(e => (
            <Card key={e.id}><CardContent className="p-4 text-sm">
              <div className="flex justify-between items-start gap-2 flex-wrap">
                <div>
                  <div className="font-medium">{e.date.slice(0, 10)} · {e.evaluatedBy} <span className="text-muted-foreground capitalize">({e.role})</span></div>
                  <div className="flex gap-1.5 mt-1">
                    <Badge variant="outline" className="capitalize text-[10px]">Goals: {e.goalsMet}</Badge>
                    <Badge variant="outline" className="capitalize text-[10px]">{e.outcomeRating}</Badge>
                    {e.locked && <Badge variant="secondary" className="text-[10px]">Signed &amp; Locked</Badge>}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground italic">Signed: {e.signature}</div>
              </div>
              <p className="mt-2">{e.summary}</p>
              {e.recommendations && <p className="mt-2 text-muted-foreground"><strong>Recommendations:</strong> {e.recommendations}</p>}
              {(e.residentFeedback || e.familyFeedback) && (
                <div className="grid grid-cols-2 gap-3 mt-2 text-xs text-muted-foreground">
                  {e.residentFeedback && <div><strong>Resident:</strong> {e.residentFeedback}</div>}
                  {e.familyFeedback && <div><strong>Family:</strong> {e.familyFeedback}</div>}
                </div>
              )}
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-2">
          {reviews.length === 0 && <p className="text-sm text-muted-foreground">No multidisciplinary reviews recorded.</p>}
          {reviews.map(r => (
            <Card key={r.id}><CardContent className="p-3 text-sm">
              <div className="flex justify-between"><div className="font-medium">{r.date.slice(0, 10)} · {r.reviewer}</div><Badge variant="outline" className="text-[10px] capitalize">{r.outcome.replace("_", " ")}</Badge></div>
              <p className="text-muted-foreground mt-1">{r.notes}</p>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="versions" className="space-y-2">
          {versions.map(v => (
            <Card key={v.id} className={v.id === plan.id ? "border-primary/50" : ""}>
              <CardContent className="p-3 text-sm">
                <div className="flex justify-between items-center gap-2">
                  <div>
                    <span className="font-medium">v{v.version || 1}</span> · {v.title}
                    {v.id === plan.id && <Badge variant="secondary" className="ml-2 text-[10px]">Current</Badge>}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline" className={`capitalize text-[10px] ${statusCls(v.status)}`}>{v.status.replace("_", " ")}</Badge>
                    {v.id !== plan.id && <Link to="/care-plans/$id" params={{ id: v.id }} className="text-xs text-primary hover:underline">View</Link>}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Created {v.createdAt.slice(0, 10)} by {v.createdBy}</div>
                {v.revisionReason && <div className="text-xs text-muted-foreground italic">Reason: {v.revisionReason}</div>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="logs" className="space-y-2">
          {planLogs.length === 0 && <p className="text-sm text-muted-foreground">No intervention deliveries logged yet. Use "Log Intervention" above.</p>}
          {planLogs.map(l => {
            const spec = plan.interventionsSpec?.find(i => i.id === l.interventionSpecId);
            return (
              <Card key={l.id}><CardContent className="p-3 text-sm">
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <div>
                    <div className="font-medium">{spec?.name || "Intervention"}</div>
                    <div className="text-xs text-muted-foreground">{l.date} {l.time} · {l.staff} {l.role && <>· <span className="capitalize">{l.role}</span></>}</div>
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px]">{l.outcome.replace("_", " ")}</Badge>
                </div>
                {l.residentResponse && <p className="mt-1.5 text-muted-foreground"><strong>Resident:</strong> {l.residentResponse}</p>}
                {l.comments && <p className="text-xs text-muted-foreground mt-1">{l.comments}</p>}
                {l.followUpRequired && <Badge variant="secondary" className="mt-1 text-[10px]">Follow-up required</Badge>}
              </CardContent></Card>
            );
          })}
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <EvidenceSection title="Source Assessment" items={linkedAssessment ? [{ id: linkedAssessment.id, title: linkedAssessment.type.toUpperCase(), sub: `Score ${linkedAssessment.totalScore} · ${linkedAssessment.interpretation} · ${linkedAssessment.date.slice(0,10)}`, to: { route: "/assessments/$assessmentId", params: { assessmentId: linkedAssessment.id } } }] : []} emptyText="No linked assessment." />
          <EvidenceSection title={`Linked Tasks (${linkedTasks.length})`} items={linkedTasks.map(t => ({ id: t.id, title: t.title, sub: `Due ${t.dueDate} · ${t.status}` }))} />
          <EvidenceSection title={`Linked Daily Notes (${linkedDaily.length})`} items={linkedDaily.map(n => ({ id: n.id, title: n.date.slice(0,10), sub: `${n.staff} · ${n.observation}` }))} />
          <EvidenceSection title={`Linked Incidents (${linkedIncidents.length})`} items={linkedIncidents.map(i => ({ id: i.id, title: i.type, sub: `${i.date} · ${i.severity}` }))} />
          <EvidenceSection title={`Linked MDT Notes (${linkedMDT.length})`} items={linkedMDT.map(m => ({ id: m.id, title: m.discussion.slice(0,60), sub: `${m.date} · ${m.authoredBy}` }))} />
          <EvidenceSection title={`Recent Resident Notes (${linkedNotes.length})`} items={linkedNotes.map(n => ({ id: n.id, title: n.date.slice(0,10), sub: `${n.staff} · ${n.observation.slice(0, 80)}` }))} />
        </TabsContent>

        <TabsContent value="receipts" className="space-y-2">
          {planReceipts.length === 0 && <p className="text-sm text-muted-foreground">No reads recorded yet.</p>}
          {planReceipts.map(r => (
            <Card key={r.id}><CardContent className="p-3 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{r.userName}</span><Badge variant="outline" className="text-[10px] capitalize">{r.role}</Badge></div>
              <div className="text-xs text-muted-foreground tabular-nums">{r.timestamp.slice(0, 16).replace("T", " ")}</div>
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={revisePromptOpen} onOpenChange={setRevisePromptOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Revise this care plan?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">An evaluation has been signed. Would you like to revise this care plan now? A new version will be created and this one will be superseded.</p>
          <Textarea placeholder="Reason for revision…" value={reviseReason} onChange={e => setReviseReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRevisePromptOpen(false); setReviseReason(""); }}>Not now</Button>
            <Button disabled={!reviseReason.trim()} onClick={() => {
              reviseCarePlan(plan.id, reviseReason);
              toast.success("New care plan version created");
              setRevisePromptOpen(false);
              setReviseReason("");
            }}>Revise</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EvidenceSection({ title, items, emptyText }: { title: string; items: { id: string; title: string; sub: string; to?: any }[]; emptyText?: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="divide-y text-sm">
        {items.length === 0 && <p className="text-xs text-muted-foreground">{emptyText ?? "None."}</p>}
        {items.map(i => (
          <div key={i.id} className="py-1.5">
            {i.to ? (
              <Link to={i.to.route} params={i.to.params} className="font-medium text-primary hover:underline">{i.title}</Link>
            ) : (
              <div className="font-medium">{i.title}</div>
            )}
            <div className="text-xs text-muted-foreground">{i.sub}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
