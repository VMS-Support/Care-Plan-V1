import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCare } from "@/lib/care/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { can, type Permission } from "@/lib/care/permissions";

type Kind = "note" | "intervention" | "task" | "incident" | "mdt" | "visitor" | "outing";

export const Route = createFileRoute("/residents/$id/record")({
  validateSearch: (s: Record<string, unknown>) => ({ kind: (s.kind as Kind) ?? "note" }),
  head: () => ({ meta: [{ title: "Quick Record — CarePath" }] }),
  component: RecordPage,
});

const kindMeta: Record<Kind, { title: string; perm: Permission }> = {
  note: { title: "Daily Note", perm: "note.create" },
  intervention: { title: "Intervention", perm: "intervention.create" },
  task: { title: "Task", perm: "task.create" },
  incident: { title: "Incident", perm: "incident.create" },
  mdt: { title: "MDT Meeting", perm: "mdt.create" },
  visitor: { title: "Visitor Record", perm: "visitor.create" },
  outing: { title: "Resident Outing", perm: "outing.create" },
};

function RecordPage() {
  const { id } = Route.useParams();
  const { kind } = Route.useSearch() as { kind: Kind };
  const {
    residents, currentRole, currentUserName,
    addNote, addIntervention, addTask, addIncident, addMDTNote, addVisitor, addOuting,
  } = useCare();
  const navigate = useNavigate();
  const r = residents.find(x => x.id === id);
  const meta = kindMeta[kind];
  const allowed = can(currentRole, meta.perm);

  if (!r) return <div className="p-8">Resident not found.</div>;

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-4">
      <Link to="/residents/$id" params={{ id }} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> {r.firstName} {r.lastName}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{meta.title}</CardTitle>
          <p className="text-xs text-muted-foreground">Resident: <strong className="text-foreground">{r.firstName} {r.lastName}</strong> · Room {r.roomNumber}</p>
        </CardHeader>
        <CardContent>
          {!allowed ? (
            <p className="text-sm text-destructive">Your current role ({currentRole}) cannot create {meta.title.toLowerCase()}.</p>
          ) : (
            <>
              {kind === "note" && <NoteForm onSubmit={(data) => { addNote({ ...data, residentId: id, staff: currentUserName, date: new Date().toISOString() } as any); done(); }} />}
              {kind === "intervention" && <InterventionForm onSubmit={(data) => { addIntervention({ ...data, residentId: id, staff: currentUserName, date: new Date().toISOString() } as any); done(); }} />}
              {kind === "task" && <TaskForm onSubmit={(data) => { addTask({ ...data, residentId: id } as any); done(); }} />}
              {kind === "incident" && <IncidentForm onSubmit={(data) => { addIncident({ ...data, residentId: id, reportedBy: currentUserName, date: new Date().toISOString().slice(0, 10) } as any); done(); }} />}
              {kind === "mdt" && <MDTForm onSubmit={(data) => { addMDTNote({ ...data, residentId: id, authoredBy: currentUserName, role: currentRole, date: new Date().toISOString().slice(0, 10) } as any); done(); }} />}
              {kind === "visitor" && <VisitorForm onSubmit={(data) => { addVisitor({ ...data, residentId: id, signedInBy: currentUserName, date: new Date().toISOString().slice(0, 10) } as any); done(); }} />}
              {kind === "outing" && <OutingForm onSubmit={(data) => { addOuting({ ...data, residentId: id, date: new Date().toISOString().slice(0, 10) } as any); done(); }} />}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  function done() {
    toast.success(`${meta.title} saved`);
    navigate({ to: "/residents/$id", params: { id } });
  }
}

function NoteForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [d, set] = useState({ shift: "morning", observation: "", mood: "calm", foodIntake: "most", fluidIntake: "good", sleep: "good", behaviour: "" });
  return (
    <div className="space-y-3">
      <SelectField label="Shift" value={d.shift} onChange={v => set({ ...d, shift: v })} options={["morning", "afternoon", "night"]} />
      <Field label="Observation"><Textarea value={d.observation} onChange={e => set({ ...d, observation: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Mood" value={d.mood} onChange={v => set({ ...d, mood: v })} options={["happy", "calm", "anxious", "withdrawn", "agitated"]} />
        <SelectField label="Food intake" value={d.foodIntake} onChange={v => set({ ...d, foodIntake: v })} options={["full", "most", "half", "little", "none"]} />
        <SelectField label="Fluid intake" value={d.fluidIntake} onChange={v => set({ ...d, fluidIntake: v })} options={["good", "moderate", "poor"]} />
        <SelectField label="Sleep" value={d.sleep} onChange={v => set({ ...d, sleep: v })} options={["good", "broken", "poor"]} />
      </div>
      <Field label="Behaviour"><Input value={d.behaviour} onChange={e => set({ ...d, behaviour: e.target.value })} /></Field>
      <Button onClick={() => onSubmit(d)}>Save Note</Button>
    </div>
  );
}

function InterventionForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [d, set] = useState({ intervention: "", outcome: "", residentResponse: "", followUpRequired: false });
  return (
    <div className="space-y-3">
      <Field label="Intervention"><Input value={d.intervention} onChange={e => set({ ...d, intervention: e.target.value })} /></Field>
      <Field label="Outcome"><Textarea value={d.outcome} onChange={e => set({ ...d, outcome: e.target.value })} /></Field>
      <Field label="Resident response"><Input value={d.residentResponse} onChange={e => set({ ...d, residentResponse: e.target.value })} /></Field>
      <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={d.followUpRequired} onChange={e => set({ ...d, followUpRequired: e.target.checked })} /> Follow-up required</label>
      <Button onClick={() => onSubmit(d)}>Save Intervention</Button>
    </div>
  );
}

function TaskForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [d, set] = useState({ title: "", description: "", assignedTo: "Care team", dueDate: new Date().toISOString().slice(0, 10), status: "pending" as const });
  return (
    <div className="space-y-3">
      <Field label="Title"><Input value={d.title} onChange={e => set({ ...d, title: e.target.value })} /></Field>
      <Field label="Description"><Textarea value={d.description} onChange={e => set({ ...d, description: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Assigned to"><Input value={d.assignedTo} onChange={e => set({ ...d, assignedTo: e.target.value })} /></Field>
        <Field label="Due date"><Input type="date" value={d.dueDate} onChange={e => set({ ...d, dueDate: e.target.value })} /></Field>
      </div>
      <Button onClick={() => onSubmit(d)}>Save Task</Button>
    </div>
  );
}

function IncidentForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [d, set] = useState({ type: "fall", severity: "moderate", description: "", immediateAction: "", witnessedBy: "", followUpRequired: true, status: "open" });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Type" value={d.type} onChange={v => set({ ...d, type: v })} options={["fall", "medication_error", "injury", "behaviour", "near_miss", "other"]} />
        <SelectField label="Severity" value={d.severity} onChange={v => set({ ...d, severity: v })} options={["low", "moderate", "high", "critical"]} />
      </div>
      <Field label="Description"><Textarea value={d.description} onChange={e => set({ ...d, description: e.target.value })} /></Field>
      <Field label="Immediate action"><Textarea value={d.immediateAction} onChange={e => set({ ...d, immediateAction: e.target.value })} /></Field>
      <Field label="Witnessed by"><Input value={d.witnessedBy} onChange={e => set({ ...d, witnessedBy: e.target.value })} /></Field>
      <Button onClick={() => onSubmit(d)}>Save Incident</Button>
    </div>
  );
}

function MDTForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [d, set] = useState({ attendees: "", discussion: "", recommendations: "", followUpDate: "" });
  return (
    <div className="space-y-3">
      <Field label="Attendees"><Input value={d.attendees} onChange={e => set({ ...d, attendees: e.target.value })} /></Field>
      <Field label="Discussion"><Textarea value={d.discussion} onChange={e => set({ ...d, discussion: e.target.value })} /></Field>
      <Field label="Recommendations"><Textarea value={d.recommendations} onChange={e => set({ ...d, recommendations: e.target.value })} /></Field>
      <Field label="Follow-up date"><Input type="date" value={d.followUpDate} onChange={e => set({ ...d, followUpDate: e.target.value })} /></Field>
      <Button onClick={() => onSubmit(d)}>Save MDT Meeting</Button>
    </div>
  );
}

function VisitorForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [d, set] = useState({ visitorName: "", relationship: "", arrivalTime: "", departureTime: "", notes: "" });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Visitor name"><Input value={d.visitorName} onChange={e => set({ ...d, visitorName: e.target.value })} /></Field>
        <Field label="Relationship"><Input value={d.relationship} onChange={e => set({ ...d, relationship: e.target.value })} /></Field>
        <Field label="Arrival"><Input type="time" value={d.arrivalTime} onChange={e => set({ ...d, arrivalTime: e.target.value })} /></Field>
        <Field label="Departure"><Input type="time" value={d.departureTime} onChange={e => set({ ...d, departureTime: e.target.value })} /></Field>
      </div>
      <Field label="Notes"><Textarea value={d.notes} onChange={e => set({ ...d, notes: e.target.value })} /></Field>
      <Button onClick={() => onSubmit(d)}>Save Visitor</Button>
    </div>
  );
}

function OutingForm({ onSubmit }: { onSubmit: (d: any) => void }) {
  const [d, set] = useState({ destination: "", accompaniedBy: "", departureTime: "", returnTime: "", transportMethod: "", notes: "", riskAssessmentCompleted: false });
  return (
    <div className="space-y-3">
      <Field label="Destination"><Input value={d.destination} onChange={e => set({ ...d, destination: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Accompanied by"><Input value={d.accompaniedBy} onChange={e => set({ ...d, accompaniedBy: e.target.value })} /></Field>
        <Field label="Transport"><Input value={d.transportMethod} onChange={e => set({ ...d, transportMethod: e.target.value })} /></Field>
        <Field label="Departure"><Input type="time" value={d.departureTime} onChange={e => set({ ...d, departureTime: e.target.value })} /></Field>
        <Field label="Return"><Input type="time" value={d.returnTime} onChange={e => set({ ...d, returnTime: e.target.value })} /></Field>
      </div>
      <Field label="Notes"><Textarea value={d.notes} onChange={e => set({ ...d, notes: e.target.value })} /></Field>
      <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={d.riskAssessmentCompleted} onChange={e => set({ ...d, riskAssessmentCompleted: e.target.checked })} /> Risk assessment completed</label>
      <Button onClick={() => onSubmit(d)}>Save Outing</Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: any }) {
  return <div><Label className="text-sm">{label}</Label><div className="mt-1.5">{children}</div></div>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{options.map(o => <SelectItem key={o} value={o} className="capitalize">{o.replace("_", " ")}</SelectItem>)}</SelectContent>
      </Select>
    </Field>
  );
}
