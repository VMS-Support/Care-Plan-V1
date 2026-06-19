import { createFileRoute, Link } from "@tanstack/react-router";
import { useCare } from "@/lib/care/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/inspection/$residentId")({
  head: () => ({ meta: [{ title: "Inspection Mode — CarePath" }] }),
  component: InspectionMode,
});

function Section({ title, children }: { title: string; children: any }) {
  return (
    <Card className="break-inside-avoid">
      <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">{children}</CardContent>
    </Card>
  );
}

function InspectionMode() {
  const { residentId } = Route.useParams();
  const {
    residents, assessments, carePlans, carePlanEvaluations, carePlanReviews,
    interventions, interventionLogs, tasks, notes, mdtNotes, incidents, auditLogs,
  } = useCare();
  const r = residents.find(x => x.id === residentId);
  if (!r) return <div className="p-8">Resident not found.</div>;

  const rAssessments = assessments.filter(a => a.residentId === r.id);
  const rPlans = carePlans.filter(c => c.residentId === r.id).sort((a, b) => (b.version || 1) - (a.version || 1));
  const rEvals = carePlanEvaluations.filter(e => rPlans.some(p => p.id === e.carePlanId));
  const rReviews = carePlanReviews.filter(rv => rPlans.some(p => p.id === rv.carePlanId));
  const rInterv = interventions.filter(i => i.residentId === r.id);
  const rLogs = interventionLogs.filter(l => l.residentId === r.id);
  const rTasks = tasks.filter(t => t.residentId === r.id);
  const rNotes = notes.filter(n => n.residentId === r.id).slice(0, 20);
  const rMdt = mdtNotes.filter(m => m.residentId === r.id);
  const rIncidents = incidents.filter(i => i.residentId === r.id);
  const rAudits = auditLogs.filter(a => a.entity === r.id || rPlans.some(p => p.id === a.entity) || rAssessments.some(x => x.id === a.entity));

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-6xl print:max-w-none print:p-4">
      <div className="flex items-end justify-between flex-wrap gap-3 print:hidden">
        <Link to="/residents/$id" params={{ id: r.id }} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1.5" /> Print / Export PDF</Button>
      </div>

      <div className="border-b pb-3">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2"><ShieldCheck className="h-7 w-7 text-success" /> Inspection Pack</h1>
        <p className="text-base mt-1">
          <strong>{r.firstName} {r.lastName}</strong> · Room {r.roomNumber} · Admitted {r.admissionDate} · Diagnosis: {r.primaryDiagnosis}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Generated {new Date().toISOString().slice(0, 16).replace("T", " ")} · Full nursing-process pack for regulator review.</p>
      </div>

      <Section title="Assessments">
        {rAssessments.length === 0 && <p className="text-muted-foreground">No assessments recorded.</p>}
        {rAssessments.map(a => (
          <div key={a.id} className="border-b last:border-b-0 py-1.5">
            <div className="flex justify-between gap-2">
              <span className="font-medium capitalize">{a.type.replace("_", " ")}</span>
              <Badge variant="outline" className="text-[10px]">{a.totalScore} · {a.interpretation}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">{a.date} · {a.assessor} ({a.assessorRole}) · v{a.version || 1} · {a.status}</div>
          </div>
        ))}
      </Section>

      <Section title="Care Plans (all versions)">
        {rPlans.length === 0 && <p className="text-muted-foreground">No care plans recorded.</p>}
        {rPlans.map(p => (
          <div key={p.id} className="border rounded-md p-2.5 mb-2">
            <div className="flex justify-between flex-wrap gap-2">
              <div className="font-medium">{p.title} <Badge variant="secondary" className="ml-1 text-[10px]">v{p.version || 1}</Badge></div>
              <Badge variant="outline" className="text-[10px] capitalize">{p.status.replace("_", " ")}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">Created {p.createdAt.slice(0, 10)} by {p.createdBy} · Review {p.reviewDate}</div>
            {p.problemStatement && <p className="text-xs mt-1"><strong>Problem:</strong> {p.problemStatement}</p>}
            {p.assessmentScoreSnapshot && <p className="text-xs text-muted-foreground">Linked assessment snapshot: {p.assessmentScoreSnapshot.type} = {p.assessmentScoreSnapshot.totalScore} ({p.assessmentScoreSnapshot.interpretation})</p>}
            {p.goals && p.goals.length > 0 && (
              <div className="mt-1.5">
                <div className="text-xs font-semibold">Goals:</div>
                <ul className="list-disc pl-5 text-xs">{p.goals.map(g => <li key={g.id}>{g.title} <span className="text-muted-foreground">— {g.status}</span></li>)}</ul>
              </div>
            )}
            {p.revisionReason && <p className="text-xs italic mt-1">Revision reason: {p.revisionReason}</p>}
          </div>
        ))}
      </Section>

      <div className="grid md:grid-cols-2 gap-3">
        <Section title={`Evaluations (${rEvals.length})`}>
          {rEvals.map(e => (
            <div key={e.id} className="border-b last:border-b-0 py-1.5 text-xs">
              <div className="font-medium">{e.date.slice(0, 10)} · {e.evaluatedBy} ({e.role})</div>
              <div>Goals {e.goalsMet} · {e.outcomeRating}</div>
              <p className="text-muted-foreground">{e.summary}</p>
              {e.locked && <Badge variant="secondary" className="text-[10px] mt-1">Signed: {e.signature}</Badge>}
            </div>
          ))}
        </Section>
        <Section title={`Reviews (${rReviews.length})`}>
          {rReviews.map(rv => (
            <div key={rv.id} className="border-b last:border-b-0 py-1.5 text-xs">
              <div className="font-medium">{rv.date.slice(0, 10)} · {rv.reviewer}</div>
              <div className="capitalize">{rv.outcome.replace(/_/g, " ")}</div>
              <p className="text-muted-foreground">{rv.notes}</p>
            </div>
          ))}
        </Section>
        <Section title={`Interventions Logged (${rLogs.length + rInterv.length})`}>
          {rLogs.slice(0, 10).map(l => (
            <div key={l.id} className="border-b py-1 text-xs">
              <div>{l.date} {l.time} · <span className="capitalize">{l.outcome.replace("_", " ")}</span> · {l.staff}</div>
              {l.comments && <p className="text-muted-foreground">{l.comments}</p>}
            </div>
          ))}
          {rInterv.slice(0, 5).map(i => (
            <div key={i.id} className="border-b py-1 text-xs">
              <div>{i.date} · {i.intervention} · {i.staff}</div>
            </div>
          ))}
        </Section>
        <Section title={`MDT & Incidents (${rMdt.length + rIncidents.length})`}>
          {rMdt.map(m => (
            <div key={m.id} className="border-b py-1 text-xs">
              <div className="font-medium">MDT — {m.date.slice(0, 10)} · {m.authoredBy}</div>
              <p className="text-muted-foreground">{m.discussion.slice(0, 140)}</p>
            </div>
          ))}
          {rIncidents.map(i => (
            <div key={i.id} className="border-b py-1 text-xs">
              <div className="font-medium capitalize">Incident — {i.type} ({i.severity}) — {i.date}</div>
              <p className="text-muted-foreground">{i.description}</p>
            </div>
          ))}
        </Section>
        <Section title={`Tasks (${rTasks.length})`}>
          {rTasks.map(t => (
            <div key={t.id} className="text-xs flex justify-between border-b py-1">
              <span>{t.title}</span>
              <span className="text-muted-foreground capitalize">{t.status} · due {t.dueDate}</span>
            </div>
          ))}
        </Section>
        <Section title={`Daily Notes — latest (${rNotes.length})`}>
          {rNotes.map(n => (
            <div key={n.id} className="text-xs border-b py-1">
              <div className="font-medium">{n.date} · {n.shift} · {n.staff}</div>
              <p className="text-muted-foreground">{n.observation}</p>
            </div>
          ))}
        </Section>
      </div>

      <Section title={`Audit Trail (${rAudits.length})`}>
        {rAudits.length === 0 && <p className="text-muted-foreground text-xs">No audit entries.</p>}
        {rAudits.slice(0, 50).map(a => (
          <div key={a.id} className="text-xs border-b py-1">
            <div className="font-medium">{a.action}</div>
            <div className="text-muted-foreground">{a.user} ({a.role}) · {a.timestamp.slice(0, 16).replace("T", " ")}</div>
            {a.reason && <div className="text-muted-foreground italic">Reason: {a.reason}</div>}
          </div>
        ))}
      </Section>

      <p className="text-xs text-muted-foreground border-t pt-3">
        Inspection pack generated by CarePath. All records retained immutably; care plan versions and signed evaluations are read-only and cannot be deleted.
      </p>
    </div>
  );
}
