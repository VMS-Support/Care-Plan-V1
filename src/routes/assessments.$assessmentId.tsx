import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { assessmentMeta, assessmentItems, uniformScale } from "@/lib/care/scoring";
import { suggestTemplatesFor } from "@/lib/care/templates";
import { can } from "@/lib/care/permissions";
import { deriveStatus, riskBadgeCls, statusBadgeCls } from "@/lib/care/assessments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  ArrowLeft, Printer, FileDown, ClipboardPlus, ListChecks, CalendarPlus, Archive,
  TrendingUp, TrendingDown, Minus, Sparkles, Lock, GitBranch, MessageSquare, History, RotateCcw, Trash2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/assessments/$assessmentId")({
  head: () => ({ meta: [{ title: "Assessment Detail — CarePath" }] }),
  component: AssessmentDetail,
});

function ReasonDialog({ trigger, title, label, variant = "default", onConfirm }: {
  trigger: React.ReactNode; title: string; label: string;
  variant?: "default" | "destructive"; onConfirm: (reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setReason(""); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <Textarea placeholder={`Reason…`} value={reason} onChange={e => setReason(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant={variant} disabled={!reason.trim()} onClick={() => { onConfirm(reason); setOpen(false); }}>{label}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssessmentDetail() {
  const { assessmentId } = Route.useParams();
  const navigate = useNavigate();
  const {
    assessments, residents, carePlans, interventions, tasks, incidents, mdtNotes,
    currentRole, addCarePlan, addTask,
    carePlanTemplates, addCarePlanFromTemplate,
    addAssessmentComment, archiveAssessment, restoreAssessment,
    softDeleteAssessment, createAssessmentRevision,
  } = useCare();
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [comment, setComment] = useState("");
  const a = assessments.find(x => x.id === assessmentId);
  const r = a ? residents.find(x => x.id === a.residentId) : null;

  const items = a ? (assessmentItems[a.type] as any[]) : [];
  const scale = a ? uniformScale(a.type) : null;

  const versionChain = useMemo(() => {
    if (!a) return [];
    return assessments.filter(x => x.residentId === a.residentId && x.type === a.type)
      .sort((x, y) => (y.version || 1) - (x.version || 1));
  }, [assessments, a]);

  const history = useMemo(() => {
    if (!a) return [];
    return assessments.filter(x => x.residentId === a.residentId && x.type === a.type && x.status === "completed")
      .sort((x, y) => y.date.localeCompare(x.date));
  }, [assessments, a]);
  const prev = history.find(x => x.id !== a?.id && x.date < (a?.date || ""));
  const delta = a && prev ? a.totalScore - prev.totalScore : null;
  const trend: "Improved" | "Stable" | "Deteriorated" | null = delta === null ? null : delta === 0 ? "Stable" : delta > 0 ? "Deteriorated" : "Improved";

  const linkedCP = a ? carePlans.filter(c => c.linkedAssessmentId === a.id) : [];
  const linkedI = a ? interventions.filter(i => i.linkedAssessmentId === a.id) : [];
  const linkedT = a ? tasks.filter(t => t.linkedAssessmentId === a.id) : [];
  const linkedIn = a ? incidents.filter(i => i.linkedAssessmentId === a.id) : [];
  const linkedM = a ? mdtNotes.filter(m => m.linkedAssessmentId === a.id) : [];

  if (!a || !r) return <div className="p-8">Assessment not found.</div>;
  const meta = assessmentMeta[a.type];
  const ds = deriveStatus(a);
  const audit = a.auditTrail || [];
  const comments = a.clinicalComments || [];

  function createCarePlanFromAssessment() {
    if (!a || !r) return;
    addCarePlan({
      residentId: r.id, title: `Care Plan from ${meta.name}`,
      category: meta.category,
      problem: `${meta.name} ${a.totalScore} — ${a.interpretation}`,
      goal: a.recommendations || "Address risks identified in assessment.",
      identifiedNeeds: [meta.category],
      interventions: ["Initial review", "Targeted interventions", "Reassess at review date"],
      assignedStaff: "Nursing team", frequency: "Per care plan",
      reviewDate: a.reviewDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: "active", priority: a.riskLevel === "very_high" ? "critical" : a.riskLevel === "high" ? "high" : "medium",
      linkedAssessmentId: a.id,
    });
    toast.success("Care plan created");
  }
  function scheduleReassessment() {
    if (!a || !r) return;
    addTask({
      residentId: r.id,
      title: `Reassessment due: ${meta.name}`,
      assignedTo: "Nursing team",
      dueDate: a.nextReassessmentDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      status: "pending",
      linkedAssessmentId: a.id,
    });
    toast.success("Reassessment scheduled");
  }

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-6xl print:p-0">
      <Link to="/residents/$id/assessments" params={{ id: r.id }} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 print:hidden">
        <ArrowLeft className="h-4 w-4" /> Back to Assessment Centre
      </Link>

      {/* Lock banner */}
      {a.locked && (
        <div className="rounded-md border border-success/30 bg-success/5 p-3 flex items-start gap-2 text-sm print:hidden">
          <Lock className="h-4 w-4 text-success mt-0.5" />
          <div className="flex-1">
            <div className="font-medium">This assessment is locked</div>
            <div className="text-xs text-muted-foreground">
              Locked by {a.lockedBy || a.assessor} on {(a.lockedAt || a.date).slice(0, 16).replace("T", " ")}.
              Content cannot be edited — create a revision to update.
            </div>
          </div>
          {can(currentRole, "assessment.create_revision") && !a.supersededById && (
            <ReasonDialog
              trigger={<Button size="sm" variant="outline"><GitBranch className="h-3.5 w-3.5 mr-1.5" /> Create Revision</Button>}
              title="Create assessment revision" label="Revise"
              onConfirm={(reason) => { const rev = createAssessmentRevision(a.id, reason); if (rev) { toast.success("Revision created"); navigate({ to: "/assessments/$assessmentId", params: { assessmentId: rev.id } }); } }} />
          )}
        </div>
      )}

      {a.supersededById && (
        <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm print:hidden">
          This version has been superseded by a newer revision.{" "}
          <Link to="/assessments/$assessmentId" params={{ assessmentId: a.supersededById }} className="text-primary underline">View latest →</Link>
        </div>
      )}

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold">{meta.name}</h1>
                <Badge variant="outline" className={`capitalize ${statusBadgeCls(ds)}`}>{ds}</Badge>
                {a.version && a.version > 1 && <Badge variant="secondary" className="text-[10px]">v{a.version}</Badge>}
                {a.locked && <Badge variant="outline" className="text-[10px]"><Lock className="h-2.5 w-2.5 mr-1" />Locked</Badge>}
              </div>
              <Link to="/residents/$id" params={{ id: r.id }} className="text-sm text-primary hover:underline">
                {r.firstName} {r.lastName} · Room {r.roomNumber}
              </Link>
              <p className="text-xs text-muted-foreground mt-1">{meta.description}</p>
              {a.revisionReason && <p className="text-xs italic mt-1 text-muted-foreground"><strong>Revision reason:</strong> {a.revisionReason}</p>}
            </div>
            <div className="text-right">
              <div className="text-4xl font-semibold tabular-nums">{a.totalScore}{meta.max ? <span className="text-base text-muted-foreground">/{meta.max}</span> : null}</div>
              <Badge variant="outline" className={`mt-1 ${riskBadgeCls(a.riskLevel)}`}>{a.interpretation}</Badge>
            </div>
          </div>

          <Separator className="my-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Info label="Completed By" value={a.assessor} />
            <Info label="Role" value={a.assessorRole || "—"} />
            <Info label="Date" value={a.date.slice(0, 10)} />
            <Info label="Category" value={a.category || meta.category} />
            <Info label="Review Frequency" value={a.reviewFrequency || "—"} />
            <Info label="Next Reassessment" value={a.nextReassessmentDate || "—"} />
            <Info label="Version" value={String(a.version || 1)} />
            <Info label="Risk Level" value={a.riskLevel} />
          </div>

          <div className="flex flex-wrap gap-2 mt-4 print:hidden">
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1.5" /> Print</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}><FileDown className="h-3.5 w-3.5 mr-1.5" /> Export PDF</Button>
            {can(currentRole, "careplan.create") && (
              <>
                <Button variant="default" size="sm" onClick={() => setSuggestOpen(true)}>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Suggest Care Plan
                </Button>
                <Button variant="outline" size="sm" onClick={createCarePlanFromAssessment}>
                  <ClipboardPlus className="h-3.5 w-3.5 mr-1.5" /> Blank Care Plan
                </Button>
              </>
            )}
            {can(currentRole, "task.create") && <Button variant="outline" size="sm" onClick={scheduleReassessment}><CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> Schedule Reassessment</Button>}
            {a.status === "completed" && !a.supersededById && can(currentRole, "assessment.archive") && (
              <ReasonDialog
                trigger={<Button variant="outline" size="sm"><Archive className="h-3.5 w-3.5 mr-1.5" /> Archive</Button>}
                title="Archive assessment" label="Archive"
                onConfirm={(reason) => { archiveAssessment(a.id, reason); toast.success("Archived"); }} />
            )}
            {(a.status === "archived" || a.status === "deleted") && can(currentRole, "assessment.restore") && (
              <Button variant="outline" size="sm" onClick={() => { restoreAssessment(a.id); toast.success("Restored"); }}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Restore
              </Button>
            )}
            {a.status !== "deleted" && can(currentRole, "assessment.delete") && (
              <ReasonDialog
                trigger={<Button variant="outline" size="sm" className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete</Button>}
                title="Delete assessment (audited)" label="Delete" variant="destructive"
                onConfirm={(reason) => { softDeleteAssessment(a.id, reason); toast.success("Deleted (audited)"); }} />
            )}
          </div>
        </CardContent>
      </Card>

      {(a.interpretation || a.recommendations || a.notes) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Assessment Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Outcome" value={a.interpretation} />
            <Row label="Risk Category" value={a.riskLevel} />
            {a.recommendations && <Row label="Clinical Recommendations" value={a.recommendations} />}
            {a.notes && <Row label="Notes" value={a.notes} />}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Questions &amp; Answers</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr><th className="text-left p-2">Category</th><th className="text-left p-2">Selected</th><th className="text-right p-2">Score</th></tr>
            </thead>
            <tbody className="divide-y">
              {items.map((it: any) => {
                const val = a.scores[it.key];
                const options: any[] = scale ? (scale as any) : (it.options || []);
                const opt = options.find(o => o[0] === val);
                return (
                  <tr key={it.key}>
                    <td className="p-2">{it.label}</td>
                    <td className="p-2 text-muted-foreground">{opt ? opt[1] : (val === undefined ? "—" : String(val))}</td>
                    <td className="p-2 text-right font-medium tabular-nums">{val ?? "—"}</td>
                  </tr>
                );
              })}
              <tr className="bg-muted/50 font-semibold">
                <td className="p-2">Total</td><td className="p-2"></td>
                <td className="p-2 text-right tabular-nums">{a.totalScore}{meta.max ? `/${meta.max}` : ""}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score History &amp; Trend</CardTitle>
          {trend && (
            <p className="text-xs text-muted-foreground">
              Previous: <strong>{prev?.totalScore}</strong> · Δ <strong>{delta! > 0 ? "+" : ""}{delta}</strong> · {" "}
              <span className="inline-flex items-center gap-1 font-medium">
                {trend === "Improved" && <TrendingDown className="h-3 w-3 text-success" />}
                {trend === "Deteriorated" && <TrendingUp className="h-3 w-3 text-destructive" />}
                {trend === "Stable" && <Minus className="h-3 w-3" />}
                {trend}
              </span>
            </p>
          )}
        </CardHeader>
        <CardContent>
          {history.length === 0 ? <p className="text-sm text-muted-foreground">No prior records.</p> : (
            <div className="divide-y text-sm">
              {history.map(h => (
                <Link key={h.id} to="/assessments/$assessmentId" params={{ assessmentId: h.id }}
                  className="flex items-center justify-between py-2 hover:bg-muted/40 px-2 -mx-2 rounded">
                  <div>
                    <span className="font-medium tabular-nums">{h.totalScore}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{h.interpretation}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">v{h.version || 1} · {h.date.slice(0, 10)} · {h.assessor}</div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version chain */}
      {versionChain.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><GitBranch className="h-4 w-4" /> Version History</CardTitle></CardHeader>
          <CardContent className="divide-y text-sm">
            {versionChain.map(v => (
              <Link key={v.id} to="/assessments/$assessmentId" params={{ assessmentId: v.id }} className={`flex items-center gap-2 py-2 hover:bg-muted/40 px-2 -mx-2 rounded ${v.id === a.id ? "bg-accent/30" : ""}`}>
                <Badge variant="outline" className="text-[10px]">v{v.version || 1}</Badge>
                <span className="font-medium tabular-nums">{v.totalScore}</span>
                <Badge variant="outline" className={`text-[10px] capitalize ${statusBadgeCls(deriveStatus(v))}`}>{deriveStatus(v)}</Badge>
                <span className="text-xs text-muted-foreground flex-1">{v.date.slice(0, 10)} · {v.assessor}</span>
                {v.revisionReason && <span className="text-xs text-muted-foreground italic truncate max-w-[14rem]">"{v.revisionReason}"</span>}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Clinical Comments */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Clinical Comments ({comments.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {comments.length === 0 && <p className="text-xs text-muted-foreground">No clinical comments yet.</p>}
          {comments.map(c => (
            <div key={c.id} className="border-l-2 border-primary/30 pl-3">
              <div className="text-xs text-muted-foreground">
                <strong className="text-foreground">{c.authorName}</strong> ({c.role}) · {c.at.slice(0, 16).replace("T", " ")}
              </div>
              <div className="text-sm mt-1 whitespace-pre-wrap">{c.body}</div>
            </div>
          ))}
          {can(currentRole, "assessment.comment") && (
            <div className="pt-2 border-t print:hidden">
              <Textarea placeholder="Add clinical comment (visible to all authorised staff, audited)…" value={comment} onChange={e => setComment(e.target.value)} />
              <div className="flex justify-end mt-2">
                <Button size="sm" disabled={!comment.trim()} onClick={() => { addAssessmentComment(a.id, comment.trim()); setComment(""); toast.success("Comment added"); }}>
                  Post Comment
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked records */}
      <div className="grid md:grid-cols-2 gap-4">
        <LinkedList title={`Linked Care Plans (${linkedCP.length})`} items={linkedCP.map(c => ({ id: c.id, title: c.title, sub: `${c.status} · Review ${c.reviewDate}` }))} />
        <LinkedList title={`Linked Interventions (${linkedI.length})`} items={linkedI.map(i => ({ id: i.id, title: i.intervention, sub: `${i.date.slice(0,10)} · ${i.staff}` }))} />
        <LinkedList title={`Linked Tasks (${linkedT.length})`} items={linkedT.map(t => ({ id: t.id, title: t.title, sub: `Due ${t.dueDate} · ${t.status}` }))} />
        <LinkedList title={`Linked Incidents (${linkedIn.length})`} items={linkedIn.map(i => ({ id: i.id, title: i.type, sub: `${i.date} · ${i.severity}` }))} />
        <LinkedList title={`Linked MDT Notes (${linkedM.length})`} items={linkedM.map(m => ({ id: m.id, title: m.discussion.slice(0, 60), sub: `${m.date} · ${m.authoredBy}` }))} />
      </div>

      {/* Audit Trail */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Audit Trail ({audit.length})</CardTitle></CardHeader>
        <CardContent>
          {audit.length === 0 ? <p className="text-xs text-muted-foreground">No audit entries.</p> : (
            <ol className="space-y-2 text-xs">
              {audit.slice().reverse().map(e => (
                <li key={e.id} className="border-l-2 border-border pl-3">
                  <div className="font-medium capitalize">{e.action.replace(/_/g, " ")}</div>
                  <div className="text-muted-foreground">{e.byUserName} ({e.byRole}) · {e.at.slice(0, 16).replace("T", " ")}</div>
                  {e.reason && <div className="text-muted-foreground italic">"{e.reason}"</div>}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Suggested Care Plan Templates</DialogTitle></DialogHeader>
          {(() => {
            const ids = suggestTemplatesFor(a.type, a.riskLevel);
            const suggested = carePlanTemplates.filter(t => ids.includes(t.id));
            const others = carePlanTemplates.filter(t => !ids.includes(t.id));
            if (suggested.length === 0 && others.length === 0) return <p className="text-sm text-muted-foreground">No templates available.</p>;
            return (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {suggested.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Recommended</div>
                    <div className="space-y-2">
                      {suggested.map(t => (
                        <TemplateRow key={t.id} t={t} onUse={() => {
                          const plan = addCarePlanFromTemplate(t.id, r.id, a);
                          if (plan) { toast.success(`Care plan created from '${t.title}'`); setSuggestOpen(false); navigate({ to: "/care-plans/$id", params: { id: plan.id } }); }
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">All templates</div>
                  <div className="space-y-2">
                    {others.map(t => (
                      <TemplateRow key={t.id} t={t} onUse={() => {
                        const plan = addCarePlanFromTemplate(t.id, r.id, a);
                        if (plan) { toast.success(`Care plan created from '${t.title}'`); setSuggestOpen(false); navigate({ to: "/care-plans/$id", params: { id: plan.id } }); }
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter><Button variant="outline" onClick={() => setSuggestOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateRow({ t, onUse }: { t: any; onUse: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-medium text-sm">{t.title}</div>
          <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
          {t.builtIn && <Badge variant="outline" className="text-[10px]">Built-in</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{t.problemStatement}</p>
      </div>
      <Button size="sm" onClick={onUse}>Use</Button>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="text-sm capitalize">{value}</div></div>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs text-muted-foreground">{label}</div><div className="capitalize">{value}</div></div>;
}
function LinkedList({ title, items }: { title: string; items: { id: string; title: string; sub: string }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="divide-y text-sm">
        {items.length === 0 && <p className="text-xs text-muted-foreground">None.</p>}
        {items.map(i => (
          <div key={i.id} className="py-1.5">
            <div className="font-medium truncate">{i.title}</div>
            <div className="text-xs text-muted-foreground">{i.sub}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
