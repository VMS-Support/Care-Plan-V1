import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCare, age } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { assessmentMeta } from "@/lib/care/scoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft, Calendar, Phone, User2, Pill, AlertTriangle, Plus, Bed, UserCog,
  Activity, ClipboardList, ListChecks, FileWarning, Trash2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { QuickActions } from "@/components/care/QuickActions";
import { ClinicalSnapshot } from "@/components/care/ClinicalSnapshot";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/residents/$id")({
  head: ({ params }) => ({ meta: [{ title: `Resident ${params.id} — CarePath` }] }),
  component: ResidentDetail,
});

function riskColor(level: string) {
  if (level === "very_high") return "bg-destructive/10 text-destructive border-destructive/30";
  if (level === "high") return "bg-warning/15 text-warning-foreground border-warning/40";
  if (level === "moderate") return "bg-info/10 text-info border-info/20";
  return "bg-success/10 text-success border-success/20";
}

function DeleteAssessmentDialog({ id, onConfirm }: { id: string; onConfirm: (reason: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Delete assessment (audited)</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          Assessments are soft-deleted and retained for audit. Provide a reason.
        </p>
        <Textarea placeholder="Reason for deletion…" value={reason} onChange={e => setReason(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" disabled={!reason.trim()} onClick={() => { onConfirm(reason); setOpen(false); }}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResidentDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const {
    residents, assessments, carePlans, notes, interventions, alerts, tasks,
    incidents, mdtNotes, visitors, outings, handovers,
    currentRole, softDeleteAssessment, addNextOfKin,
  } = useCare();
  const r = residents.find(x => x.id === id);
  const [nokOpen, setNokOpen] = useState(false);
  const [newNok, setNewNok] = useState({
    name: "", relationship: "", phone: "", mobile: "", email: "", address: "", notes: "",
    primaryContact: false, emergencyContact: false, powerOfAttorney: false, legalRepresentative: false,
  });

  if (!r) return <div className="p-8">Resident not found. <Link to="/residents" className="text-primary underline">Back</Link></div>;

  const rA = assessments.filter(a => a.residentId === id && a.status !== "deleted").sort((a, b) => b.date.localeCompare(a.date));
  const rADeleted = assessments.filter(a => a.residentId === id && a.status === "deleted");
  const rP = carePlans.filter(c => c.residentId === id);
  const rN = notes.filter(n => n.residentId === id);
  const rI = interventions.filter(i => i.residentId === id);
  const rAlerts = alerts.filter(a => a.residentId === id);
  const rTasks = tasks.filter(t => t.residentId === id);
  const rIncidents = incidents.filter(x => x.residentId === id);
  const rMDT = mdtNotes.filter(x => x.residentId === id);
  const rVisitors = visitors.filter(x => x.residentId === id);
  const rOutings = outings.filter(x => x.residentId === id);
  const rHandovers = handovers.filter(x => x.residentId === id);

  const activePlans = rP.filter(p => p.status === "active");
  const today = new Date();
  const outstandingReviews = rP.filter(p => p.status === "active" && new Date(p.reviewDate) <= today);
  const openTasks = rTasks.filter(t => t.status !== "completed");
  const nextReassessment = rA
    .filter(a => a.nextReassessmentDate)
    .map(a => a.nextReassessmentDate!)
    .sort()[0];
  const openAlertCount = rAlerts.filter(a => !a.acknowledged).length;

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <Link to="/residents" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> All residents</Link>

      <Card>
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-5">
          <Avatar className="h-20 w-20"><AvatarFallback className="text-xl bg-accent text-accent-foreground">{r.firstName[0]}{r.lastName[0]}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{r.firstName} {r.lastName}</h1>
              <Badge variant="outline" className="capitalize">{(r.residentType || r.status).replace("_", " ")}</Badge>
              {r.endOfLife && <Badge variant="outline" className="border-destructive/40 text-destructive">End of Life</Badge>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-sm">
              <div><div className="text-xs text-muted-foreground">Resident ID</div>{r.id}</div>
              <div><div className="text-xs text-muted-foreground">Age</div>{age(r.dob)} ({r.dob})</div>
              <div><div className="text-xs text-muted-foreground">Room</div>{r.roomNumber}</div>
              <div><div className="text-xs text-muted-foreground">Bed</div><span className="capitalize">{r.bed?.bedType?.replace("_", " ") || "—"}</span></div>
              <div><div className="text-xs text-muted-foreground">Admitted</div>{r.admissionDate}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <QuickActions residentId={r.id} />

      <ClinicalSnapshot residentId={r.id} />

      {/* Resident Dashboard widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DashStat label="Active Care Plans" value={activePlans.length} icon={ClipboardList} />
        <DashStat label="Active Assessments" value={rA.filter(a => a.status !== "archived" && a.status !== "superseded").length} icon={Activity} />
        <DashStat label="Open Tasks" value={openTasks.length} icon={ListChecks} />
        <DashStat label="Outstanding Reviews" value={outstandingReviews.length} icon={Calendar} tone="warning" />
        <DashStat label="Open Alerts" value={openAlertCount} icon={AlertTriangle} tone={openAlertCount > 0 ? "destructive" : "default"} />
        <DashStat label="Last GP Review" value={r.lastGpReview || "—"} icon={User2} small />
        <DashStat label="Last MDT Review" value={r.lastMdtReview || "—"} icon={UserCog} small />
        <DashStat label="Next Reassessment" value={nextReassessment?.slice(0, 10) || "—"} icon={Activity} small />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="observations" asChild>
            <Link to="/residents/$id/observations" params={{ id: r.id }} search={{ tab: "news2" } as any}>Observations</Link>
          </TabsTrigger>
          <TabsTrigger value="vitals" asChild>
            <Link to="/residents/$id/vitals" params={{ id: r.id }}>Vitals (Legacy)</Link>
          </TabsTrigger>
          <TabsTrigger value="assessments">Assessments ({rA.length})</TabsTrigger>
          <TabsTrigger value="careplans">Care Plans ({rP.length})</TabsTrigger>
          <TabsTrigger value="notes">Daily Notes ({rN.length})</TabsTrigger>
          <TabsTrigger value="interventions">Interventions ({rI.length})</TabsTrigger>
          <TabsTrigger value="incidents">Incidents ({rIncidents.length})</TabsTrigger>
          <TabsTrigger value="mdt">MDT ({rMDT.length})</TabsTrigger>
          <TabsTrigger value="visitors">Visitors ({rVisitors.length})</TabsTrigger>
          <TabsTrigger value="outings">Outings ({rOutings.length})</TabsTrigger>
          <TabsTrigger value="handovers">Handovers ({rHandovers.length})</TabsTrigger>
          <TabsTrigger value="nok">Next of Kin ({r.nextOfKinList?.length || 0})</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({rAlerts.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({rTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><User2 className="h-4 w-4" /> Clinical</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Primary diagnosis" value={r.primaryDiagnosis} />
                <Row label="Medical history" value={r.medicalHistory} />
                <Row label="Allergies" value={r.allergies} />
                <Row label="Mental capacity" value={r.mentalCapacity.replace("_", " ")} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Pill className="h-4 w-4" /> Medication</CardTitle></CardHeader>
              <CardContent className="text-sm"><p>{r.currentMedication}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bed className="h-4 w-4" /> Bed Management</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Bed type" value={r.bed?.bedType?.replace("_", " ") || "—"} />
                <Row label="Mattress" value={r.bed?.mattressType?.replace("_", " ") || "—"} />
                <Row label="Installed" value={r.bed?.installationDate || "—"} />
                <Row label="Review date" value={r.bed?.reviewDate || "—"} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCog className="h-4 w-4" /> Key Workers</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Named Nurse" value={r.keyWorkers?.namedNurse || "—"} />
                <Row label="Named Carer" value={r.keyWorkers?.namedCarer || "—"} />
                <Row label="Key Worker" value={r.keyWorkers?.keyWorker || "—"} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4" /> GP / Consultant</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="GP" value={r.gp} />
                <Row label="Consultant" value={r.consultant} />
                <Row label="Emergency contact" value={r.emergencyContact} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Communication" value={r.communicationNeeds} />
                <Row label="Religion" value={r.religion} />
                <Row label="Preferred language" value={r.preferredLanguage} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Link to="/residents/$id/assessments" params={{ id: r.id }}>
              <Button size="sm"><Activity className="h-3 w-3 mr-1" /> Assessment Centre</Button>
            </Link>
            <Link to="/residents/$id/quality-of-life" params={{ id: r.id }}>
              <Button size="sm" variant="outline">Quality of Life</Button>
            </Link>
            <Separator orientation="vertical" className="h-6 mx-1" />
            {(["barthel", "waterlow", "abbey_pain", "mna", "norton", "nutrition", "pinch_me"] as const).map(t => (
              <Link key={t} to="/assessments/new/$residentId" params={{ residentId: r.id }} search={{ type: t } as any}>
                <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> {assessmentMeta[t].name}</Button>
              </Link>
            ))}
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Assessment</th>
                      <th className="text-left p-3">Score</th>
                      <th className="text-left p-3">Risk</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Completed By</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Next</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rA.map(a => (
                      <tr key={a.id} className="hover:bg-muted/30">
                        <td className="p-3">
                          <Link to="/assessments/$assessmentId" params={{ assessmentId: a.id }} className="font-medium hover:text-primary">
                            {assessmentMeta[a.type].name}
                          </Link>
                        </td>
                        <td className="p-3 tabular-nums font-semibold">{a.totalScore}</td>
                        <td className="p-3"><Badge variant="outline" className={`text-[10px] ${riskColor(a.riskLevel)}`}>{a.interpretation}</Badge></td>
                        <td className="p-3"><Badge variant="outline" className="text-[10px] capitalize">{a.status}</Badge></td>
                        <td className="p-3 text-xs">{a.assessor}<br /><span className="text-muted-foreground capitalize">{a.assessorRole}</span></td>
                        <td className="p-3 text-xs">{a.date.slice(0, 10)}</td>
                        <td className="p-3 text-xs">{a.nextReassessmentDate || "—"}</td>
                        <td className="p-3 text-right">
                          <div className="inline-flex gap-1 items-center">
                            <Link to="/assessments/$assessmentId" params={{ assessmentId: a.id }}>
                              <Button size="sm" variant="ghost" className="h-7 text-[11px]">View</Button>
                            </Link>
                            {a.status === "completed" && !a.supersededById && can(currentRole, "assessment.create") && (
                              <Link to="/assessments/new/$residentId" params={{ residentId: r.id }} search={{ type: a.type } as any}>
                                <Button size="sm" variant="outline" className="h-7 text-[11px]">
                                  <Plus className="h-3 w-3 mr-1" /> Reassess
                                </Button>
                              </Link>
                            )}
                            {can(currentRole, "assessment.delete") && (
                              <DeleteAssessmentDialog id={a.id} onConfirm={(reason) => { softDeleteAssessment(a.id, reason); toast.success("Assessment soft-deleted (audited)"); }} />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rA.length === 0 && (
                      <tr><td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">No assessments yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {rADeleted.length > 0 && (
            <details className="border rounded-md p-3 text-sm">
              <summary className="cursor-pointer font-medium">Deleted assessments ({rADeleted.length}) — audit trail</summary>
              <div className="mt-2 space-y-2">
                {rADeleted.map(a => (
                  <div key={a.id} className="text-xs text-muted-foreground border-l-2 border-destructive/40 pl-3">
                    <strong>{assessmentMeta[a.type].name}</strong> · {a.date.slice(0, 10)}<br />
                    Deleted by {a.deletedBy} on {a.deletedAt?.slice(0, 10)} — {a.deletedReason}
                  </div>
                ))}
              </div>
            </details>
          )}
          
        </TabsContent>

        <TabsContent value="careplans" className="space-y-3">
          <Link to="/residents/$id/care-plan" params={{ id: r.id }}>
            <Button size="sm"><ClipboardList className="h-3 w-3 mr-1" /> Open Unified Care Plan</Button>
          </Link>
          {rP.map(c => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Link to="/care-plans/$id" params={{ id: c.id }} className="font-medium hover:text-primary hover:underline">{c.title}</Link>
                  <Badge variant="outline" className="capitalize">{c.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1"><strong>Problem:</strong> {c.problem}</p>
                <p className="text-sm text-muted-foreground"><strong>Goal:</strong> {c.goal}</p>
                <ul className="text-sm mt-2 list-disc pl-5 space-y-0.5">{c.interventions.map((i, k) => <li key={k}>{i}</li>)}</ul>
                <Separator className="my-3" />
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground items-center">
                  <span><Calendar className="h-3 w-3 inline mr-1" /> Review {c.reviewDate}</span>
                  <span>Frequency: {c.frequency}</span>
                  <span>Assigned: {c.assignedStaff}</span>
                  <div className="flex-1" />
                  <Link to="/care-plans/$id" params={{ id: c.id }} className="text-primary hover:underline">Open plan →</Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {rP.length === 0 && <p className="text-sm text-muted-foreground">No active care plans.</p>}
        </TabsContent>

        <TabsContent value="notes" className="space-y-2">
          {rN.map(n => (
            <Card key={n.id}><CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{n.date.slice(0, 10)}</span>
                <Badge variant="outline" className="text-[10px] capitalize">{n.shift}</Badge>
                <span className="text-xs text-muted-foreground">{n.staff}</span>
              </div>
              <p className="text-sm mt-1">{n.observation}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground mt-2">
                <span>Mood: {n.mood}</span><span>Food: {n.foodIntake}</span>
                <span>Fluids: {n.fluidIntake}</span><span>Sleep: {n.sleep}</span>
              </div>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="interventions" className="space-y-2">
          {rI.map(i => (
            <Card key={i.id}><CardContent className="p-4">
              <div className="flex items-center justify-between"><div className="font-medium">{i.intervention}</div><div className="text-xs text-muted-foreground">{i.date.slice(0, 10)}</div></div>
              <p className="text-sm text-muted-foreground mt-1">Outcome: {i.outcome}</p>
              <p className="text-xs text-muted-foreground">Response: {i.residentResponse} · {i.staff}</p>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="incidents" className="space-y-2">
          {rIncidents.map(i => (
            <Card key={i.id}><CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="font-medium capitalize">{i.type.replace("_", " ")} — {i.date}</div>
                <div className="flex gap-1.5"><Badge variant="outline" className="capitalize">{i.severity}</Badge><Badge variant="secondary" className="capitalize">{i.status.replace("_", " ")}</Badge></div>
              </div>
              <p className="text-sm mt-1">{i.description}</p>
              <p className="text-xs text-muted-foreground mt-1">Action: {i.immediateAction} · Reported by {i.reportedBy}</p>
            </CardContent></Card>
          ))}
          {rIncidents.length === 0 && <p className="text-sm text-muted-foreground">No incidents recorded.</p>}
        </TabsContent>

        <TabsContent value="mdt" className="space-y-2">
          {rMDT.map(m => (
            <Card key={m.id}><CardContent className="p-4">
              <div className="text-sm font-medium">{m.date} · {m.authoredBy}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Attendees: {m.attendees}</p>
              <p className="text-sm mt-2"><strong>Discussion:</strong> {m.discussion}</p>
              <p className="text-sm"><strong>Recommendations:</strong> {m.recommendations}</p>
              {m.followUpDate && <p className="text-xs text-muted-foreground mt-1">Follow-up: {m.followUpDate}</p>}
            </CardContent></Card>
          ))}
          {rMDT.length === 0 && <p className="text-sm text-muted-foreground">No MDT notes recorded.</p>}
        </TabsContent>

        <TabsContent value="visitors" className="space-y-2">
          {rVisitors.map(v => (
            <Card key={v.id}><CardContent className="p-4">
              <div className="text-sm font-medium">{v.visitorName} <span className="text-xs text-muted-foreground">({v.relationship})</span></div>
              <p className="text-xs text-muted-foreground">{v.date} · {v.arrivalTime}–{v.departureTime} · Signed in by {v.signedInBy}</p>
              {v.notes && <p className="text-sm mt-1">{v.notes}</p>}
            </CardContent></Card>
          ))}
          {rVisitors.length === 0 && <p className="text-sm text-muted-foreground">No visitor records.</p>}
        </TabsContent>

        <TabsContent value="outings" className="space-y-2">
          {rOutings.map(o => (
            <Card key={o.id}><CardContent className="p-4">
              <div className="text-sm font-medium">{o.destination} — {o.date}</div>
              <p className="text-xs text-muted-foreground">{o.departureTime}–{o.returnTime} · {o.transportMethod} · With {o.accompaniedBy}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Risk assessment: {o.riskAssessmentCompleted ? "Completed" : "Not completed"}</p>
              {o.notes && <p className="text-sm mt-1">{o.notes}</p>}
            </CardContent></Card>
          ))}
          {rOutings.length === 0 && <p className="text-sm text-muted-foreground">No outings recorded.</p>}
        </TabsContent>

        <TabsContent value="handovers" className="space-y-2">
          {rHandovers.map(h => (
            <Card key={h.id}><CardContent className="p-4">
              <div className="text-sm font-medium capitalize">{h.shift} shift — {h.date}</div>
              <p className="text-xs text-muted-foreground">{h.staff}</p>
              <p className="text-sm mt-1">{h.summary}</p>
              <p className="text-xs text-muted-foreground mt-1"><strong>Outstanding:</strong> {h.outstandingActions}</p>
            </CardContent></Card>
          ))}
          {rHandovers.length === 0 && <p className="text-sm text-muted-foreground">No handover notes.</p>}
        </TabsContent>

        <TabsContent value="nok" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={nokOpen} onOpenChange={setNokOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Add Next of Kin</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Add Next of Kin</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Label>Name</Label><Input value={newNok.name} onChange={e => setNewNok({ ...newNok, name: e.target.value })} /></div>
                  <div><Label>Relationship</Label><Input value={newNok.relationship} onChange={e => setNewNok({ ...newNok, relationship: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={newNok.phone} onChange={e => setNewNok({ ...newNok, phone: e.target.value })} /></div>
                  <div><Label>Mobile</Label><Input value={newNok.mobile} onChange={e => setNewNok({ ...newNok, mobile: e.target.value })} /></div>
                  <div><Label>Email</Label><Input value={newNok.email} onChange={e => setNewNok({ ...newNok, email: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Address</Label><Input value={newNok.address} onChange={e => setNewNok({ ...newNok, address: e.target.value })} /></div>
                  <div className="col-span-2 grid grid-cols-2 gap-2 text-sm">
                    <label className="flex gap-2 items-center"><input type="checkbox" checked={newNok.primaryContact} onChange={e => setNewNok({ ...newNok, primaryContact: e.target.checked })} /> Primary contact</label>
                    <label className="flex gap-2 items-center"><input type="checkbox" checked={newNok.emergencyContact} onChange={e => setNewNok({ ...newNok, emergencyContact: e.target.checked })} /> Emergency contact</label>
                    <label className="flex gap-2 items-center"><input type="checkbox" checked={newNok.powerOfAttorney} onChange={e => setNewNok({ ...newNok, powerOfAttorney: e.target.checked })} /> Power of attorney</label>
                    <label className="flex gap-2 items-center"><input type="checkbox" checked={newNok.legalRepresentative} onChange={e => setNewNok({ ...newNok, legalRepresentative: e.target.checked })} /> Legal representative</label>
                  </div>
                  <div className="col-span-2"><Label>Notes</Label><Textarea value={newNok.notes} onChange={e => setNewNok({ ...newNok, notes: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNokOpen(false)}>Cancel</Button>
                  <Button onClick={() => {
                    if (!newNok.name) { toast.error("Name required"); return; }
                    addNextOfKin(r.id, newNok);
                    setNewNok({ name: "", relationship: "", phone: "", mobile: "", email: "", address: "", notes: "", primaryContact: false, emergencyContact: false, powerOfAttorney: false, legalRepresentative: false });
                    setNokOpen(false);
                    toast.success("Next of kin added");
                  }}>Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {(r.nextOfKinList || []).map(n => (
            <Card key={n.id}><CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-medium">{n.name} <span className="text-xs text-muted-foreground">({n.relationship})</span></div>
                  <div className="text-xs text-muted-foreground">{n.phone || n.mobile} · {n.email}</div>
                  {n.address && <div className="text-xs text-muted-foreground">{n.address}</div>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {n.primaryContact && <Badge variant="default" className="text-[10px]">Primary</Badge>}
                  {n.emergencyContact && <Badge variant="outline" className="text-[10px]">Emergency</Badge>}
                  {n.powerOfAttorney && <Badge variant="outline" className="text-[10px]">PoA</Badge>}
                  {n.legalRepresentative && <Badge variant="outline" className="text-[10px]">Legal Rep</Badge>}
                </div>
              </div>
              {n.notes && <p className="text-sm mt-2 text-muted-foreground">{n.notes}</p>}
            </CardContent></Card>
          ))}
          {(!r.nextOfKinList || r.nextOfKinList.length === 0) && <p className="text-sm text-muted-foreground">No next of kin recorded.</p>}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-2">
          {rAlerts.map(a => (
            <Card key={a.id}><CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning-foreground" />
              <div className="flex-1"><div className="font-medium">{a.title}</div><p className="text-sm text-muted-foreground">{a.description}</p></div>
              <Badge variant="outline" className="capitalize">{a.priority}</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-2">
          {rTasks.map(t => (
            <Card key={t.id}><CardContent className="p-4 flex items-center justify-between">
              <div><div className="font-medium">{t.title}</div><div className="text-xs text-muted-foreground">Due {t.dueDate} · {t.assignedTo}</div></div>
              <Badge variant="outline" className="capitalize">{t.status}</Badge>
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashStat({ label, value, icon: Icon, tone = "default", small }: { label: string; value: any; icon: any; tone?: "default" | "warning" | "destructive"; small?: boolean }) {
  const tones: Record<string, string> = {
    default: "bg-secondary text-secondary-foreground",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <Card><CardContent className="p-4 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-md flex items-center justify-center ${tones[tone]}`}><Icon className="h-4 w-4" /></div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={small ? "text-sm font-medium truncate" : "text-xl font-semibold tabular-nums"}>{value}</div>
      </div>
    </CardContent></Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-xs text-muted-foreground capitalize">{label}</div>
      <div className="col-span-2 capitalize">{value || "—"}</div>
    </div>
  );
}
