import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  GitBranch,
  FileCheck2,
  AlertTriangle,
  Printer,
  ClipboardCheck,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/care-plans/$id")({
  head: ({ params }) => ({ meta: [{ title: `Care Plan ${params.id} — CarePath` }] }),
  component: CarePlanDetail,
});

function statusCls(status: string) {
  if (status === "active") return "bg-success/10 text-success border-success/30";
  if (status === "superseded") return "bg-muted text-muted-foreground";
  if (status === "completed") return "bg-info/10 text-info border-info/30";
  if (status.includes("overdue")) return "bg-destructive/10 text-destructive border-destructive/30";
  return "bg-warning/15 text-warning-foreground border-warning/40";
}

function EvaluateDialog({
  carePlanId,
  onRevisePrompt,
}: {
  carePlanId: string;
  onRevisePrompt: () => void;
}) {
  const { addCarePlanEvaluation, updateCarePlan, currentUserName, currentRole } = useCare();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    summary: "",
    goalsMet: "partially" as const,
    outcomeRating: "good" as const,
    residentFeedback: "",
    familyFeedback: "",
    recommendations: "",
    reviseRequired: false,
    signature: "",
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileCheck2 className="h-3.5 w-3.5 mr-1.5" /> Evaluate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Evaluate Care Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Evaluation summary</Label>
            <Textarea
              value={form.summary}
              onChange={(event) => setForm({ ...form, summary: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Goals met?</Label>
              <Select
                value={form.goalsMet}
                onValueChange={(value) =>
                  setForm({ ...form, goalsMet: value as typeof form.goalsMet })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="partially">Partially</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Outcome</Label>
              <Select
                value={form.outcomeRating}
                onValueChange={(value) =>
                  setForm({ ...form, outcomeRating: value as typeof form.outcomeRating })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
            <div>
              <Label>Resident feedback</Label>
              <Textarea
                rows={2}
                value={form.residentFeedback}
                onChange={(event) => setForm({ ...form, residentFeedback: event.target.value })}
              />
            </div>
            <div>
              <Label>Family feedback</Label>
              <Textarea
                rows={2}
                value={form.familyFeedback}
                onChange={(event) => setForm({ ...form, familyFeedback: event.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Recommendations</Label>
            <Textarea
              value={form.recommendations}
              onChange={(event) => setForm({ ...form, recommendations: event.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.reviseRequired}
              onChange={(event) => setForm({ ...form, reviseRequired: event.target.checked })}
            />
            Revise care plan (creates new version, supersedes this one)
          </label>
          <div>
            <Label>Electronic signature (type your full name)</Label>
            <Input
              value={form.signature}
              onChange={(event) => setForm({ ...form, signature: event.target.value })}
              placeholder={currentUserName}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!form.summary || !form.signature}
            onClick={() => {
              addCarePlanEvaluation({
                carePlanId,
                date: new Date().toISOString(),
                evaluatedBy: currentUserName,
                role: currentRole,
                ...form,
                signature: form.signature || currentUserName,
                locked: true,
                nextEvaluationDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
              });
              if (form.reviseRequired) {
                updateCarePlan(carePlanId, { status: "review_due" });
              }
              toast.success("Evaluation locked and signed");
              setOpen(false);
              setTimeout(onRevisePrompt, 250);
            }}
          >
            Sign &amp; Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LogInterventionDialog({
  carePlanId,
  residentId,
  interventionsSpec,
}: {
  carePlanId: string;
  residentId: string;
  interventionsSpec: any[];
}) {
  const { addInterventionLog, currentUserName, currentRole } = useCare();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
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
        <Button size="sm" variant="outline">
          <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" /> Log Intervention
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log intervention delivery</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {interventionsSpec.length > 0 && (
            <div>
              <Label>Intervention</Label>
              <Select
                value={form.interventionSpecId}
                onValueChange={(value) => setForm({ ...form, interventionSpecId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interventionsSpec.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.frequency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Outcome</Label>
            <Select
              value={form.outcome}
              onValueChange={(value) => setForm({ ...form, outcome: value as typeof form.outcome })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
          <div>
            <Label>Resident response</Label>
            <Textarea
              rows={2}
              value={form.residentResponse}
              onChange={(event) => setForm({ ...form, residentResponse: event.target.value })}
            />
          </div>
          <div>
            <Label>Comments</Label>
            <Textarea
              rows={2}
              value={form.comments}
              onChange={(event) => setForm({ ...form, comments: event.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.followUpRequired}
              onChange={(event) => setForm({ ...form, followUpRequired: event.target.checked })}
            />
            Follow-up required
          </label>
          <div>
            <Label>Signature</Label>
            <Input
              value={form.signature}
              onChange={(event) => setForm({ ...form, signature: event.target.value })}
              placeholder={currentUserName}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const now = new Date();
              addInterventionLog({
                carePlanId,
                residentId,
                interventionSpecId: form.interventionSpecId || undefined,
                date: now.toISOString().slice(0, 10),
                time: now.toISOString().slice(11, 16),
                staff: currentUserName,
                role: currentRole,
                outcome: form.outcome,
                residentResponse: form.residentResponse,
                comments: form.comments,
                followUpRequired: form.followUpRequired,
                signature: form.signature || currentUserName,
              });
              toast.success("Intervention logged");
              setOpen(false);
            }}
          >
            Save
          </Button>
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
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <GitBranch className="h-3.5 w-3.5 mr-1.5" /> Revise
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revise care plan</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          A new version will be created and this one will be marked as superseded.
        </p>
        <Textarea
          placeholder="Reason for revision…"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!reason.trim()}
            onClick={() => {
              reviseCarePlan(carePlanId, reason);
              toast.success("New care plan version created");
              setOpen(false);
            }}
          >
            Revise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CarePlanDetail() {
  const { id } = Route.useParams();
  const {
    carePlans,
    residents,
    carePlanEvaluations,
    carePlanReviews,
    interventions,
    notes,
    tasks,
    currentRole,
    interventionLogs,
    readReceipts,
    recordReadReceipt,
    reviseCarePlan,
    incidents,
    mdtNotes,
    assessments,
  } = useCare();
  const plan = carePlans.find((item) => item.id === id);
  const [revisePromptOpen, setRevisePromptOpen] = useState(false);
  const [reviseReason, setReviseReason] = useState("");

  useEffect(() => {
    if (plan) {
      recordReadReceipt("care_plan", plan.id);
    }
  }, [plan, recordReadReceipt]);

  if (!plan) {
    return (
      <div className="p-8">
        Care plan not found.{" "}
        <Link to="/care-plans" className="text-primary underline">
          Back
        </Link>
      </div>
    );
  }

  const resident = residents.find((item) => item.id === plan.residentId);
  const evals = carePlanEvaluations
    .filter((item) => item.carePlanId === id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const reviews = carePlanReviews
    .filter((item) => item.carePlanId === id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const linkedInterventions = interventions.filter((item) => item.carePlanId === id);
  const linkedNotes = notes.filter((item) => item.residentId === plan.residentId).slice(0, 10);
  const linkedTasks = tasks.filter((item) => item.linkedCarePlanId === id && item.status !== "deleted");
  const planLogs = interventionLogs.filter((item) => item.carePlanId === id);
  const linkedIncidents = incidents
    .filter((item) => (item as any).linkedCarePlanId === id || item.residentId === plan.residentId)
    .slice(0, 10);
  const linkedMDT = mdtNotes
    .filter((item) => (item as any).linkedCarePlanId === id || item.residentId === plan.residentId)
    .slice(0, 10);
  const linkedDaily = notes.filter((item) => (item as any).linkedCarePlanId === id).slice(0, 10);
  const linkedAssessment = plan.linkedAssessmentId
    ? assessments.find((item) => item.id === plan.linkedAssessmentId)
    : null;
  const linkedAssessments = assessments
    .filter((item) => item.residentId === plan.residentId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  const planReceipts = readReceipts.filter((item) => item.entityId === id);
  const versions = carePlans
    .filter((item) => item.id === id || item.supersedesId === id || item.id === plan.supersedesId)
    .sort((a, b) => (b.version || 1) - (a.version || 1));
  const governanceView = currentRole === "cnm" || currentRole === "don";
  const scheduledInterventions = (plan.interventionsSpec || []).filter(
    (item) => item.status !== "cancelled",
  );

  const overdueReview = plan.status === "active" && new Date(plan.reviewDate) < new Date();
  const overdueEvaluation =
    plan.status === "active" && !!plan.evaluationDate && new Date(plan.evaluationDate) < new Date();

  const compliance = useMemo(() => {
    const total = planLogs.length;
    const completed = planLogs.filter((item) => item.outcome === "completed").length;
    const partial = planLogs.filter((item) => item.outcome === "partially_completed").length;
    const missed = planLogs.filter((item) => item.outcome === "missed").length;
    const refused = planLogs.filter((item) => item.outcome === "refused").length;
    const late = planLogs.filter((item) => item.late).length;
    const pct = total === 0 ? 0 : Math.round(((completed + partial * 0.5) / total) * 100);
    return { total, completed, partial, missed, refused, late, pct };
  }, [planLogs]);

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <Link
        to="/care-plans"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" /> All care plans
      </Link>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight">{plan.title}</h1>
                <Badge variant="outline" className={`capitalize ${statusCls(plan.status)}`}>
                  {plan.status.replace("_", " ")}
                </Badge>
                {plan.priority && (
                  <Badge variant="outline" className="capitalize">
                    {plan.priority}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[10px]">
                  v{plan.version || 1}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {resident
                  ? `${resident.firstName} ${resident.lastName} · Room ${resident.roomNumber}`
                  : "Resident unavailable"}
              </div>
              {plan.category && (
                <p className="text-xs text-muted-foreground mt-1">Category: {plan.category}</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {resident && (
                <Link to="/residents/$id" params={{ id: resident.id }}>
                  <Button size="sm" variant="outline">
                    Open Resident
                  </Button>
                </Link>
              )}
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / PDF
              </Button>
              {can(currentRole, "intervention.create") && plan.status === "active" && (
                <LogInterventionDialog
                  carePlanId={plan.id}
                  residentId={plan.residentId}
                  interventionsSpec={plan.interventionsSpec || []}
                />
              )}
              {can(currentRole, "careplan.evaluate") && plan.status === "active" && (
                <EvaluateDialog
                  carePlanId={plan.id}
                  onRevisePrompt={() => setRevisePromptOpen(true)}
                />
              )}
              {can(currentRole, "careplan.revise") && plan.status === "active" && (
                <ReviseDialog carePlanId={plan.id} />
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 mt-4">
            <HeaderMeta label="Status" value={plan.status.replace("_", " ")} />
            <HeaderMeta label="Created Date" value={plan.createdAt.slice(0, 10)} />
            <HeaderMeta label="Next Review Date" value={plan.reviewDate} />
            <HeaderMeta label="Next Evaluation Date" value={plan.evaluationDate || "—"} />
            <HeaderMeta
              label="Last Updated"
              value={(plan.updatedAt || plan.createdAt).slice(0, 10)}
            />
          </div>

          {overdueReview && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 text-destructive p-2 text-sm">
              <AlertTriangle className="h-4 w-4" /> Review overdue (was due {plan.reviewDate})
            </div>
          )}
          {overdueEvaluation && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 text-destructive p-2 text-sm">
              <AlertTriangle className="h-4 w-4" /> Evaluation overdue (was due{" "}
              {plan.evaluationDate})
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="care" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="care">Care Plan</TabsTrigger>
          <TabsTrigger value="timeline">Timelines</TabsTrigger>
          {governanceView && <TabsTrigger value="governance">Governance</TabsTrigger>}
        </TabsList>

        <TabsContent value="care" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <DetailCard title="Problem Statement">
              <p>{plan.problemStatement || plan.problem}</p>
              {plan.identifiedNeeds && plan.identifiedNeeds.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-3">
                  {plan.identifiedNeeds.map((need) => (
                    <Badge key={need} variant="secondary" className="text-[10px]">
                      {need}
                    </Badge>
                  ))}
                </div>
              )}
            </DetailCard>

            <DetailCard title="Goals">
              {plan.goals && plan.goals.length > 0 ? (
                <div className="space-y-3">
                  {plan.goals.map((goal) => (
                    <div key={goal.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="font-medium">{goal.title}</div>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {goal.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="secondary" className="capitalize text-[10px]">
                            {goal.priority}
                          </Badge>
                        </div>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                      )}
                      {goal.targetDate && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Target date: {goal.targetDate}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p>{plan.goal}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    No structured SMART goals recorded yet.
                  </p>
                </div>
              )}
            </DetailCard>

            <DetailCard title="Interventions">
              <ul className="list-disc pl-5 space-y-1">
                {plan.interventions.map((intervention, index) => (
                  <li key={index}>{intervention}</li>
                ))}
              </ul>
            </DetailCard>

            <DetailCard title="Scheduled Interventions">
              {scheduledInterventions.length > 0 ? (
                <div className="space-y-3">
                  {scheduledInterventions.map((item) => (
                    <div key={item.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="font-medium">{item.name}</div>
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {item.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{item.frequency}</div>
                      {(item.assignedUser || item.assignedRole) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Assigned: {item.assignedUser || item.assignedRole}
                        </div>
                      )}
                      {item.description && <p className="text-sm mt-2">{item.description}</p>}
                    </div>
                  ))}
                </div>
              ) : linkedTasks.length > 0 ? (
                <div className="space-y-3">
                  {linkedTasks.map((task) => (
                    <div key={task.id} className="rounded-md border p-3">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Due {task.dueDate || "not scheduled"} · {task.assignedTo} · {task.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No scheduled interventions recorded yet.</p>
              )}
            </DetailCard>
          </div>

          <DetailCard title="Linked Assessments">
            {linkedAssessments.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {linkedAssessments.map((assessment) => (
                  <Link
                    key={assessment.id}
                    to="/assessments/$assessmentId"
                    params={{ assessmentId: assessment.id }}
                    className="rounded-md border p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium uppercase">
                        {assessment.type.replace("_", " ")}
                      </div>
                      {assessment.id === linkedAssessment?.id && (
                        <Badge variant="secondary" className="text-[10px]">
                          Primary Link
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {assessment.date.slice(0, 10)} · Score {assessment.totalScore}
                    </div>
                    <div className="text-sm mt-1">{assessment.interpretation}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No linked assessments.</p>
            )}
          </DetailCard>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <DetailCard title={`Evaluations Timeline (${evals.length})`}>
              {evals.length === 0 && (
                <p className="text-muted-foreground">No evaluations recorded.</p>
              )}
              <div className="space-y-3">
                {evals.map((evaluation) => (
                  <TimelineCard
                    key={evaluation.id}
                    title={`${evaluation.date.slice(0, 10)} · ${evaluation.evaluatedBy}`}
                    badge={evaluation.outcomeRating}
                    subtitle={evaluation.role ? `Role: ${evaluation.role}` : undefined}
                  >
                    <p>{evaluation.summary}</p>
                    {evaluation.recommendations && (
                      <p className="text-muted-foreground mt-2">
                        <strong>Recommendations:</strong> {evaluation.recommendations}
                      </p>
                    )}
                  </TimelineCard>
                ))}
              </div>
            </DetailCard>

            <DetailCard title={`Reviews Timeline (${reviews.length})`}>
              {reviews.length === 0 && (
                <p className="text-muted-foreground">No multidisciplinary reviews recorded.</p>
              )}
              <div className="space-y-3">
                {reviews.map((review) => (
                  <TimelineCard
                    key={review.id}
                    title={`${review.date.slice(0, 10)} · ${review.reviewer}`}
                    badge={review.outcome.replace("_", " ")}
                    subtitle={review.role ? `Role: ${review.role}` : undefined}
                  >
                    <p>{review.notes}</p>
                  </TimelineCard>
                ))}
              </div>
            </DetailCard>
          </div>

          <DetailCard title={`Recent Delivery Log (${planLogs.length})`}>
            {planLogs.length === 0 && (
              <p className="text-muted-foreground">No intervention deliveries logged yet.</p>
            )}
            <div className="space-y-3">
              {planLogs.map((log) => {
                const spec = plan.interventionsSpec?.find(
                  (item) => item.id === log.interventionSpecId,
                );
                return (
                  <TimelineCard
                    key={log.id}
                    title={`${log.date} ${log.time} · ${spec?.name || "Intervention"}`}
                    badge={log.outcome.replace("_", " ")}
                    subtitle={`${log.staff}${log.role ? ` · ${log.role}` : ""}`}
                  >
                    {log.residentResponse && (
                      <p>
                        <strong>Resident:</strong> {log.residentResponse}
                      </p>
                    )}
                    {log.comments && <p className="text-muted-foreground mt-1">{log.comments}</p>}
                    {log.followUpRequired && (
                      <Badge variant="secondary" className="mt-2 text-[10px]">
                        Follow-up required
                      </Badge>
                    )}
                  </TimelineCard>
                );
              })}
            </div>
          </DetailCard>
        </TabsContent>

        {governanceView && (
          <TabsContent value="governance" className="space-y-4">
            {compliance.total > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Intervention Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm gap-3 flex-wrap">
                    <div>
                      {compliance.pct}% compliance across {compliance.total} delivery log
                      {compliance.total !== 1 ? "s" : ""}
                    </div>
                    <div className="text-muted-foreground">Late: {compliance.late}</div>
                  </div>
                  <Progress value={compliance.pct} className="h-2" />
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>
                      <strong className="text-success">{compliance.completed}</strong> completed
                    </span>
                    <span>
                      <strong>{compliance.partial}</strong> partial
                    </span>
                    <span>
                      <strong className="text-destructive">{compliance.missed}</strong> missed
                    </span>
                    <span>
                      <strong>{compliance.refused}</strong> refused
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 xl:grid-cols-2">
              <DetailCard title={`Versions (${versions.length})`}>
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`rounded-md border p-3 ${version.id === plan.id ? "border-primary/50" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <span className="font-medium">v{version.version || 1}</span> ·{" "}
                          {version.title}
                          {version.id === plan.id && (
                            <Badge variant="secondary" className="ml-2 text-[10px]">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`capitalize text-[10px] ${statusCls(version.status)}`}
                          >
                            {version.status.replace("_", " ")}
                          </Badge>
                          {version.id !== plan.id && (
                            <Link
                              to="/care-plans/$id"
                              params={{ id: version.id }}
                              className="text-xs text-primary hover:underline"
                            >
                              View
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Created {version.createdAt.slice(0, 10)} by {version.createdBy}
                      </div>
                      {version.revisionReason && (
                        <div className="text-xs text-muted-foreground italic mt-1">
                          Reason: {version.revisionReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </DetailCard>

              <DetailCard title={`Read Receipts (${planReceipts.length})`}>
                {planReceipts.length === 0 && (
                  <p className="text-muted-foreground">No reads recorded yet.</p>
                )}
                <div className="space-y-3">
                  {planReceipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex items-center justify-between rounded-md border p-3 text-sm gap-3 flex-wrap"
                    >
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{receipt.userName}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {receipt.role}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {receipt.timestamp.slice(0, 16).replace("T", " ")}
                      </div>
                    </div>
                  ))}
                </div>
              </DetailCard>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <EvidenceSection
                title={`Linked Tasks (${linkedTasks.length})`}
                items={linkedTasks.map((task) => ({
                  id: task.id,
                  title: task.title,
                  sub: `Due ${task.dueDate} · ${task.status}`,
                }))}
              />
              <EvidenceSection
                title={`Linked Daily Notes (${linkedDaily.length})`}
                items={linkedDaily.map((note) => ({
                  id: note.id,
                  title: note.date.slice(0, 10),
                  sub: `${note.staff} · ${note.observation}`,
                }))}
              />
              <EvidenceSection
                title={`Linked Incidents (${linkedIncidents.length})`}
                items={linkedIncidents.map((incident) => ({
                  id: incident.id,
                  title: incident.type,
                  sub: `${incident.date} · ${incident.severity}`,
                }))}
              />
              <EvidenceSection
                title={`Linked MDT Notes (${linkedMDT.length})`}
                items={linkedMDT.map((note) => ({
                  id: note.id,
                  title: note.discussion.slice(0, 60),
                  sub: `${note.date} · ${note.authoredBy}`,
                }))}
              />
              <EvidenceSection
                title={`Recent Resident Notes (${linkedNotes.length})`}
                items={linkedNotes.map((note) => ({
                  id: note.id,
                  title: note.date.slice(0, 10),
                  sub: `${note.staff} · ${note.observation.slice(0, 80)}`,
                }))}
              />
              <EvidenceSection
                title={`Logged Interventions (${linkedInterventions.length})`}
                items={linkedInterventions.map((item) => ({
                  id: item.id,
                  title: item.intervention,
                  sub: `${item.date.slice(0, 10)} · ${item.outcome} · ${item.staff}`,
                }))}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={revisePromptOpen} onOpenChange={setRevisePromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revise this care plan?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            An evaluation has been signed. Would you like to revise this care plan now? A new
            version will be created and this one will be superseded.
          </p>
          <Textarea
            placeholder="Reason for revision…"
            value={reviseReason}
            onChange={(event) => setReviseReason(event.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRevisePromptOpen(false);
                setReviseReason("");
              }}
            >
              Not now
            </Button>
            <Button
              disabled={!reviseReason.trim()}
              onClick={() => {
                reviseCarePlan(plan.id, reviseReason);
                toast.success("New care plan version created");
                setRevisePromptOpen(false);
                setReviseReason("");
              }}
            >
              Revise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HeaderMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium mt-1 capitalize">{value}</div>
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">{children}</CardContent>
    </Card>
  );
}

function TimelineCard({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="font-medium">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
        </div>
        {badge && (
          <Badge variant="outline" className="capitalize text-[10px]">
            {badge}
          </Badge>
        )}
      </div>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}

function EvidenceSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: {
    id: string;
    title: string;
    sub: string;
    to?: { route: "/assessments/$assessmentId"; params: { assessmentId: string } };
  }[];
  emptyText?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y text-sm">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground">{emptyText ?? "None."}</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="py-1.5">
            {item.to ? (
              <Link
                to={item.to.route}
                params={item.to.params}
                className="font-medium text-primary hover:underline"
              >
                {item.title}
              </Link>
            ) : (
              <div className="font-medium">{item.title}</div>
            )}
            <div className="text-xs text-muted-foreground">{item.sub}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
