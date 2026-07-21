import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import {
  CATEGORY_LABELS, RISK_COLORS, PREDEFINED_GOALS, frequencyLabel,
} from "@/lib/care/problems";
import { getRltDomainForCarePlanProblem } from "@/lib/care/rlt";
import type {
  CarePlanProblem, FrequencyType, ProblemCategory, ProblemRiskLevel, Role,
} from "@/lib/care/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Plus, CheckCircle2, History, Target, Activity,
  CalendarClock, FileCheck2, Sparkles, X, Trash2, PlayCircle,
} from "lucide-react";
import { toast } from "sonner";

const ASSIGNED_ROLES: Array<{ value: Role; label: string }> = [
  { value: "carer", label: "Carer" },
  { value: "nurse", label: "Nurse" },
  { value: "doctor", label: "Doctor" },
  { value: "cnm", label: "Clinical Nurse Manager" },
];

export const Route = createFileRoute("/residents/$id/care-plan")({
  head: ({ params }) => ({ meta: [{ title: `Care Plan â€” ${params.id} â€” CarePath` }] }),
  component: ResidentCarePlanPage,
});

const CATEGORY_OPTIONS: ProblemCategory[] = [
  "pressure", "falls", "nutrition", "pain", "behaviour", "continence",
  "mobility", "cognition", "communication", "personal_care", "mental_health",
  "social", "sleep", "medication", "end_of_life", "skin", "safeguarding", "custom",
];
const RISK_OPTIONS: ProblemRiskLevel[] = ["none", "low", "moderate", "high", "very_high", "resolved"];

function todayPlus(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

function ResidentCarePlanPage() {
  const { id } = Route.useParams();
  const {
    residents, residentCarePlans, carePlanProblems, problemPlans,
    problemInterventions, problemInterventionLogs, problemEvaluations,
    problemReviews, problemHistory, assessmentSuggestions, assessments,
  } = useCare();

  const r = residents.find(x => x.id === id);
  if (!r) return <div className="p-8">Resident not found.</div>;

  const rcp = residentCarePlans.find(p => p.residentId === id && p.status === "active");
  const problems = carePlanProblems.filter(p => p.residentId === id);
  const active = problems.filter(p => p.status === "active");
  const resolved = problems.filter(p => p.status === "resolved");
  const pendingSuggestions = assessmentSuggestions.filter(s => s.residentId === id && s.status === "pending");

  const today = new Date().toISOString().slice(0, 10);
  const dueReview = active.filter(p => p.reviewDate <= today).length;
  const dueEval = active.filter(p => p.evaluationDate <= today).length;
  const openInterventions = problemInterventions.filter(i => i.status === "active" && problems.some(p => p.id === i.problemId)).length;
  const completedRecent = problemInterventionLogs.filter(l => l.residentId === id && l.outcome === "completed" && l.date >= todayPlus(-7)).length;
  const recentEvals = problemEvaluations.filter(e => problems.some(p => p.id === e.problemId)).slice(0, 5);

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <Link to="/residents/$id" params={{ id: r.id }} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to {r.firstName} {r.lastName}
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resident Care Plan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {r.firstName} {r.lastName} Â· Room {r.roomNumber} Â·{" "}
            {rcp ? <>Plan created {rcp.createdAt.slice(0, 10)} by {rcp.createdBy}</> : "No active plan yet"}
          </p>
        </div>
        <AddProblemButton residentId={id} />
      </div>

      {/* Dashboard widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Stat label="Active Problems" value={active.length} />
        <Stat label="Resolved" value={resolved.length} />
        <Stat label="Due Review" value={dueReview} tone={dueReview > 0 ? "warn" : "default"} />
        <Stat label="Due Evaluation" value={dueEval} tone={dueEval > 0 ? "warn" : "default"} />
        <Stat label="Open Interventions" value={openInterventions} />
        <Stat label="Logged (7d)" value={completedRecent} />
        <Stat label="Recent Evals" value={recentEvals.length} />
      </div>

      {pendingSuggestions.length > 0 && (
        <Card className="border-info/30 bg-info/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-info" />
              {pendingSuggestions.length} suggested care plan problem{pendingSuggestions.length > 1 ? "s" : ""} from recent assessments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingSuggestions.map(s => <SuggestionRow key={s.id} suggestionId={s.id} />)}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Problems ({active.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolved.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-3">
          {active.length === 0 && (
            <p className="text-sm text-muted-foreground">No active problems. Add one or accept a suggestion above.</p>
          )}
          {active.map(p => <ProblemCard key={p.id} problem={p} />)}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-3 mt-3">
          {resolved.length === 0 && (
            <p className="text-sm text-muted-foreground">No resolved problems.</p>
          )}
          {resolved.map(p => <ProblemCard key={p.id} problem={p} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "warn" }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold tabular-nums ${tone === "warn" && value > 0 ? "text-warning-foreground" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

// ============ Suggestion row ============

function SuggestionRow({ suggestionId }: { suggestionId: string }) {
  const { assessmentSuggestions, acceptSuggestion, rejectSuggestion } = useCare();
  const s = assessmentSuggestions.find(x => x.id === suggestionId);
  const [editing, setEditing] = useState(false);
  const [statement, setStatement] = useState(s?.problemStatement || "");
  const [risk, setRisk] = useState<ProblemRiskLevel>(s?.riskLevel || "moderate");
  if (!s) return null;
  return (
    <div className="border rounded-md p-3 bg-background">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Badge variant="outline" className="capitalize">{CATEGORY_LABELS[s.category]}</Badge>
            <Badge variant="outline" className={RISK_COLORS[s.riskLevel]}>{s.riskLevel.replace("_", " ")}</Badge>
            <span className="text-muted-foreground">from {s.assessmentType.replace("_", " ")} assessment</span>
          </div>
          {editing ? (
            <div className="space-y-2 mt-2">
              <Textarea value={statement} onChange={e => setStatement(e.target.value)} rows={2} />
              <Select value={risk} onValueChange={v => setRisk(v as ProblemRiskLevel)}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>{RISK_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm mt-1">{s.problemStatement}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {editing ? (
            <>
              <Button size="sm" onClick={() => { acceptSuggestion(s.id, { problemStatement: statement, riskLevel: risk }); toast.success("Nursing care plan added to care plan"); }}>Save & Accept</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          ) : (
            <>
              <Button size="sm" onClick={() => { acceptSuggestion(s.id); toast.success("Nursing care plan added"); }}>Accept</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => { rejectSuggestion(s.id, "Not clinically indicated"); }}>Reject</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Problem card ============

function ProblemCard({ problem }: { problem: CarePlanProblem }) {
  const {
    problemPlans, problemInterventions, problemInterventionLogs,
    problemEvaluations, problemReviews, problemHistory,
  } = useCare();
  const [showHistory, setShowHistory] = useState(false);

  const goals = problemPlans.filter(g => g.problemId === problem.id);
  const interventions = problemInterventions.filter(i => i.problemId === problem.id && i.status === "active");
  const evals = problemEvaluations.filter(e => e.problemId === problem.id);
  const reviews = problemReviews.filter(r => r.problemId === problem.id);
  const logs = problemInterventionLogs.filter(l => l.problemId === problem.id).slice(0, 5);
  const history = problemHistory.filter(h => h.problemId === problem.id);

  const today = new Date().toISOString().slice(0, 10);
  const evalDue = problem.evaluationDate <= today;
  const reviewDue = problem.reviewDate <= today;
  const rltDomain = getRltDomainForCarePlanProblem(problem);

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className="capitalize">{CATEGORY_LABELS[problem.category]}</Badge>
              {rltDomain && <Badge variant="secondary">{rltDomain.shortLabel}</Badge>}
              <Badge variant="outline" className={RISK_COLORS[problem.riskLevel]}>{problem.riskLevel.replace("_", " ")}</Badge>
              <Badge variant="outline" className="capitalize">{problem.status}</Badge>
              {evalDue && problem.status === "active" && <Badge variant="outline" className="bg-warning/15 text-warning-foreground border-warning/40">Evaluation due</Badge>}
              {reviewDue && problem.status === "active" && <Badge variant="outline" className="bg-warning/15 text-warning-foreground border-warning/40">Review due</Badge>}
            </div>
            <p className="text-sm font-medium">{problem.problemStatement}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Created {problem.createdAt.slice(0, 10)} by {problem.createdBy} Â· Eval {problem.evaluationDate} Â· Review {problem.reviewDate}
            </p>
          </div>
          {problem.status === "active" && (
            <div className="flex flex-wrap gap-1">
              <ReviewDialog problemId={problem.id} />
              <FormalReviewDialog problemId={problem.id} />
              <ReviewUpdateDialog problem={problem} />
              <ResolveDialog problemId={problem.id} />
            </div>
          )}
        </div>

        <Separator />

        {/* Plans */}
        <Section icon={<Target className="h-3.5 w-3.5" />} label={`Plans (${goals.length})`}>
          <PlansEditor problemId={problem.id} />
        </Section>

        {/* Interventions */}
        <Section icon={<Activity className="h-3.5 w-3.5" />} label={`Interventions (${interventions.length})`}>
          {interventions.length === 0 && <p className="text-xs text-muted-foreground">No active interventions.</p>}
          <ul className="space-y-1.5">
            {interventions.map(i => (
              <li key={i.id} className="flex items-center justify-between gap-2 text-sm border rounded-md p-2">
                <div className="min-w-0">
                  <div className="font-medium">{i.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {frequencyLabel(i.frequencyType, i.frequencyValue, i.frequencyInstructions)}
                    {i.assignedRole && ` Â· ${i.assignedRole}`}
                    {i.assignedStaffName && ` Â· ${i.assignedStaffName}`}
                  </div>
                </div>
                <div className="flex gap-1">
                  <LogInterventionDialog interventionId={i.id} interventionName={i.name} />
                  <DiscontinueButton interventionId={i.id} />
                </div>
              </li>
            ))}
          </ul>
          <AddInterventionDialog problemId={problem.id} />
        </Section>

        {/* Recent logs */}
        {logs.length > 0 && (
          <Section icon={<FileCheck2 className="h-3.5 w-3.5" />} label={`Recent Completions (${logs.length})`}>
            <ul className="text-xs space-y-1">
              {logs.map(l => (
                <li key={l.id} className="text-muted-foreground">
                  {l.date} {l.time} Â· <span className="capitalize">{l.outcome.replace("_", " ")}</span> by {l.staffName} ({l.role})
                  {l.comments && ` â€” ${l.comments}`}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Evaluations / Reviews */}
        {(evals.length > 0 || reviews.length > 0) && (
          <div className="grid md:grid-cols-2 gap-3">
            {evals.length > 0 && (
              <div className="text-xs space-y-1">
                <div className="font-medium uppercase tracking-wide text-muted-foreground">Evaluations ({evals.length})</div>
                {evals.slice(0, 3).map(e => (
                  <div key={e.id} className="border rounded p-2">
                    <div className="font-medium">{e.date.slice(0, 10)} Â· <span className="capitalize">{e.progress.replace("_", " ")}</span></div>
                    <div className="text-muted-foreground">{e.evaluatorName} â€” {e.summary}</div>
                  </div>
                ))}
              </div>
            )}
            {reviews.length > 0 && (
              <div className="text-xs space-y-1">
                <div className="font-medium uppercase tracking-wide text-muted-foreground">Formal Reviews ({reviews.length})</div>
                {reviews.slice(0, 3).map(rv => (
                  <div key={rv.id} className="border rounded p-2">
                    <div className="font-medium">{rv.reviewDate.slice(0, 10)} Â· <span className="capitalize">{rv.outcome}</span></div>
                    <div className="text-muted-foreground">{rv.reviewedByName} â€” {rv.comments}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History */}
        <div className="pt-1">
          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowHistory(v => !v)}>
            <History className="h-3 w-3 mr-1" /> {showHistory ? "Hide" : "View"} History ({history.length})
          </Button>
          {showHistory && (
            <div className="mt-2 border rounded-md p-2 text-xs space-y-1 max-h-64 overflow-auto">
              {history.map(h => (
                <div key={h.id} className="border-b last:border-b-0 py-1">
                  <div className="font-medium">
                    {h.timestamp.slice(0, 16).replace("T", " ")} Â· {h.action.replace(/_/g, " ")}
                  </div>
                  <div className="text-muted-foreground">{h.userName} ({h.role}){h.reason ? ` â€” ${h.reason}` : ""}</div>
                  {h.newValue && <div className="text-muted-foreground italic">{h.newValue.slice(0, 200)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {problem.status === "resolved" && problem.resolvedReason && (
          <div className="text-xs text-muted-foreground italic border-t pt-2">
            Resolved {problem.resolvedAt?.slice(0, 10)} by {problem.resolvedBy} â€” {problem.resolvedReason}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">{icon} {label}</div>
      {children}
    </div>
  );
}

// ============ Plans ============

function PlansEditor({ problemId }: { problemId: string }) {
  const { problemPlans, addPlan, updatePlan, removePlan, carePlanProblems } = useCare();
  const goals = problemPlans.filter(g => g.problemId === problemId);
  const problem = carePlanProblems.find(p => p.id === problemId);
  const [newStatement, setNewStatement] = useState("");
  const suggestions = problem ? PREDEFINED_GOALS[problem.category] : [];

  return (
    <div className="space-y-1.5">
      {goals.length === 0 && <p className="text-xs text-muted-foreground">No goals yet.</p>}
      {goals.map(g => (
        <div key={g.id} className="flex items-center gap-2 text-sm border rounded-md p-2">
          <Select value={g.status} onValueChange={v => updatePlan(g.id, { status: v as any })}>
            <SelectTrigger className="w-40 h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["active", "achieved", "partially_achieved", "not_achieved", "discontinued"].map(s => (
                <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="flex-1">{g.statement}</span>
          <Button size="sm" variant="ghost" onClick={() => removePlan(g.id)}><X className="h-3 w-3" /></Button>
        </div>
      ))}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions.filter(s => !goals.some(g => g.statement === s)).map(s => (
            <Button key={s} size="sm" variant="outline" className="h-6 text-xs"
              onClick={() => { addPlan(problemId, s); }}>
              <Plus className="h-2.5 w-2.5 mr-1" /> {s}
            </Button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={newStatement} onChange={e => setNewStatement(e.target.value)}
          placeholder="Add custom goalâ€¦" className="h-8 text-sm"
        />
        <Button size="sm" disabled={!newStatement.trim()} onClick={() => {
          addPlan(problemId, newStatement.trim());
          setNewStatement("");
        }}><Plus className="h-3 w-3" /></Button>
      </div>
    </div>
  );
}

// ============ Add problem ============

function AddProblemButton({ residentId }: { residentId: string }) {
  const { addProblem } = useCare();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ProblemCategory>("pressure");
  const [statement, setStatement] = useState("");
  const [risk, setRisk] = useState<ProblemRiskLevel>("moderate");
  const [evalDate, setEvalDate] = useState(todayPlus(7));
  const [reviewDate, setReviewDate] = useState(todayPlus(90));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" /> Add Nursing Care Plan</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Add Nursing Care Plan</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={v => setCategory(v as ProblemCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Care Need</Label>
            <Textarea value={statement} onChange={e => setStatement(e.target.value)} rows={3}
              placeholder="Describe the resident care needâ€¦" />
          </div>
          <div>
            <Label>Risk Level</Label>
            <Select value={risk} onValueChange={v => setRisk(v as ProblemRiskLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RISK_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Next Review of Outcome</Label>
              <Input type="date" value={evalDate} onChange={e => setEvalDate(e.target.value)} />
            </div>
            <div>
              <Label>Care Plan Review Date</Label>
              <Input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!statement.trim()} onClick={() => {
            addProblem({ residentId, category, problemStatement: statement.trim(), riskLevel: risk, evaluationDate: evalDate, reviewDate });
            toast.success("Nursing care plan added");
            setOpen(false); setStatement("");
          }}>Add Nursing Care Plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Add care action ============

function AddInterventionDialog({ problemId }: { problemId: string }) {
  const { addProblemIntervention, users, currentUser } = useCare();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [freqType, setFreqType] = useState<FrequencyType>("daily");
  const [freqValue, setFreqValue] = useState<number>(1);
  const [freqInstr, setFreqInstr] = useState("");
  const [assignedRole, setAssignedRole] = useState<Role>("nurse");
  const [assignedStaff, setAssignedStaff] = useState("__unassigned");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("08:00");
  const roleUsers = users
    .filter((user) => user.role === assignedRole && user.status !== "inactive")
    .sort((left, right) => left.name.localeCompare(right.name));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 mt-1"><Plus className="h-3 w-3 mr-1" /> Add Care Action</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Care Action</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Care action name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Reposition resident" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Frequency type</Label>
              <Select value={freqType} onValueChange={v => setFreqType(v as FrequencyType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["hourly", "daily", "weekly", "monthly", "prn", "custom"] as FrequencyType[]).map(o => (
                    <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {freqType !== "prn" && freqType !== "custom" && (
              <div>
                <Label>Every N {freqType === "hourly" ? "hours" : freqType === "daily" ? "Ã— per day" : freqType}</Label>
                <Input type="number" min={1} value={freqValue} onChange={e => setFreqValue(+e.target.value)} />
              </div>
            )}
          </div>
          <div>
            <Label>Instructions (optional)</Label>
            <Input value={freqInstr} onChange={e => setFreqInstr(e.target.value)} placeholder="e.g. Every Monday 09:00" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Start time</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Role</Label>
            <Select value={assignedRole} onValueChange={(value) => { setAssignedRole(value as Role); setAssignedStaff("__unassigned"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASSIGNED_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assigned To</Label>
            <Select value={assignedStaff} onValueChange={setAssignedStaff}>
              <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned">Unassigned</SelectItem>
                {roleUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!name.trim()} onClick={() => {
            const staff = assignedStaff === "__unassigned" ? undefined : users.find(u => u.id === assignedStaff);
            addProblemIntervention({
              problemId, name: name.trim(),
              frequencyType: freqType,
              frequencyValue: freqType === "prn" || freqType === "custom" ? undefined : freqValue,
              frequencyInstructions: freqInstr || undefined,
              assignedRole,
              assignedStaffId: staff?.id,
              assignedStaffName: staff?.name,
              startDate,
              startTime,
              reviewDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
              endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
            });
            toast.success("Intervention added");
            setOpen(false); setName(""); setFreqInstr(""); setAssignedRole("nurse"); setAssignedStaff("__unassigned"); setStartDate(new Date().toISOString().slice(0, 10)); setStartTime("08:00");
          }}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiscontinueButton({ interventionId }: { interventionId: string }) {
  const { discontinueProblemIntervention } = useCare();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Trash2 className="h-3 w-3" /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Discontinue care action</DialogTitle></DialogHeader>
        <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reasonâ€¦" />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" disabled={!reason.trim()} onClick={() => {
            discontinueProblemIntervention(interventionId, reason); setOpen(false); toast.success("Discontinued");
          }}>Discontinue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Log care action ============

function LogInterventionDialog({ interventionId, interventionName }: { interventionId: string; interventionName: string }) {
  const { logProblemIntervention } = useCare();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<"completed" | "partially_completed" | "missed" | "refused" | "escalated">("completed");
  const [response, setResponse] = useState("");
  const [comments, setComments] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7"><PlayCircle className="h-3 w-3 mr-1" /> Log</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log care action: {interventionName}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Outcome</Label>
            <Select value={outcome} onValueChange={v => setOutcome(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["completed", "partially_completed", "missed", "refused", "escalated"].map(o => (
                  <SelectItem key={o} value={o} className="capitalize">{o.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Resident response</Label>
            <Input value={response} onChange={e => setResponse(e.target.value)} placeholder="e.g. Settled, accepted care" />
          </div>
          <div>
            <Label>Comments</Label>
            <Textarea value={comments} onChange={e => setComments(e.target.value)} rows={2} />
          </div>
          <p className="text-xs text-muted-foreground">
            Will appear under Problem, Timeline, Daily Notes, and the Compliance dashboard automatically.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            logProblemIntervention({ interventionId, outcome, residentResponse: response, comments });
            toast.success("Care action logged");
            setOpen(false); setResponse(""); setComments(""); setOutcome("completed");
          }}>Save Log</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Review / Review / Review & Update / Resolve ============

function ReviewDialog({ problemId }: { problemId: string }) {
  const { addProblemEvaluation } = useCare();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [goalsMet, setPlansMet] = useState<"yes" | "partial" | "no">("partial");
  const [progress, setProgress] = useState<"improved" | "stable" | "deteriorated" | "resolved" | "requires_revision">("stable");
  const [nextDate, setNextDate] = useState(todayPlus(7));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline">Review</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Care Plan Review</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Summary</Label>
            <Textarea value={summary} onChange={e => setSummary(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plan met?</Label>
              <Select value={goalsMet} onValueChange={v => setPlansMet(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["yes", "partial", "no"].map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Progress</Label>
              <Select value={progress} onValueChange={v => setProgress(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["improved", "stable", "deteriorated", "resolved", "requires_revision"].map(o => <SelectItem key={o} value={o} className="capitalize">{o.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Next Review of Outcome</Label>
            <Input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!summary.trim()} onClick={() => {
            addProblemEvaluation({ problemId, summary, goalsMet, progress, nextEvaluationDate: nextDate });
            toast.success("Evaluation recorded"); setOpen(false); setSummary("");
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormalReviewDialog({ problemId }: { problemId: string }) {
  const { addProblemReview } = useCare();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<"continue" | "modify" | "escalate" | "resolve" | "refer">("continue");
  const [comments, setComments] = useState("");
  const [nextReview, setNextReview] = useState(todayPlus(90));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline">Review</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Formal Review</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Outcome</Label>
            <Select value={outcome} onValueChange={v => setOutcome(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["continue", "modify", "escalate", "resolve", "refer"].map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Comments</Label>
            <Textarea value={comments} onChange={e => setComments(e.target.value)} />
          </div>
          <div>
            <Label>Next review date</Label>
            <Input type="date" value={nextReview} onChange={e => setNextReview(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            addProblemReview({ problemId, reviewDate: new Date().toISOString().slice(0, 10), outcome, comments, nextReviewDate: nextReview });
            toast.success("Review recorded"); setOpen(false); setComments("");
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewUpdateDialog({ problem }: { problem: CarePlanProblem }) {
  const { updateProblem } = useCare();
  const [open, setOpen] = useState(false);
  const [evalDate, setEvalDate] = useState(problem.evaluationDate);
  const [reviewDate, setReviewDate] = useState(problem.reviewDate);
  const [risk, setRisk] = useState<ProblemRiskLevel>(problem.riskLevel);
  const [statement, setStatement] = useState(problem.problemStatement);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm">Review & Update</Button></DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Review & Update Problem</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Problem statement</Label>
            <Textarea value={statement} onChange={e => setStatement(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Risk level</Label>
              <Select value={risk} onValueChange={v => setRisk(v as ProblemRiskLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RISK_OPTIONS.map(o => <SelectItem key={o} value={o} className="capitalize">{o.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Next evaluation</Label>
              <Input type="date" value={evalDate} onChange={e => setEvalDate(e.target.value)} />
            </div>
            <div>
              <Label>Next review</Label>
              <Input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Reason for change (audit)</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Reassessment shows reduced risk" />
          </div>
          <p className="text-xs text-muted-foreground">
            Problem ID and history are preserved. Add or remove interventions and goals directly on the card.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!reason.trim()} onClick={() => {
            updateProblem(problem.id, { problemStatement: statement, riskLevel: risk, evaluationDate: evalDate, reviewDate }, reason);
            toast.success("Problem updated"); setOpen(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResolveDialog({ problemId }: { problemId: string }) {
  const { resolveProblem } = useCare();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-success border-success/30">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Resolve Problem</DialogTitle></DialogHeader>
        <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Resolution reason (e.g. reassessment normal)â€¦" />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!reason.trim()} onClick={() => {
            resolveProblem(problemId, reason); toast.success("Problem resolved"); setOpen(false);
          }}>Resolve</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

