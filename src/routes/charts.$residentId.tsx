import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useCare } from "@/lib/care/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Printer } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/charts/$residentId")({
  head: () => ({ meta: [{ title: "Charts — CarePath" }] }),
  component: ChartsPage,
});

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toTimeString().slice(0, 5);

function ChartsPage() {
  const { residentId } = Route.useParams();
  const c = useCare();
  const r = c.residents.find(x => x.id === residentId);
  if (!r) return <div className="p-8">Resident not found.</div>;

  const rWeights = useMemo(() => c.weights.filter(w => w.residentId === residentId).slice().sort((a, b) => a.date.localeCompare(b.date)), [c.weights, residentId]);
  const rFluids = c.fluids.filter(f => f.residentId === residentId);
  const rFoods = c.foods.filter(f => f.residentId === residentId);
  const rPains = useMemo(() => c.pains.filter(p => p.residentId === residentId).slice().sort((a, b) => a.date.localeCompare(b.date)), [c.pains, residentId]);
  const rSleeps = useMemo(() => c.sleeps.filter(s => s.residentId === residentId).slice().sort((a, b) => a.date.localeCompare(b.date)), [c.sleeps, residentId]);
  const rBowels = c.bowels.filter(b => b.residentId === residentId);
  const rBehaviour = c.behaviours.filter(b => b.residentId === residentId);
  const rObs = c.observations.filter(o => o.residentId === residentId);

  const todayFluidTotal = rFluids.filter(f => f.date === today()).reduce((s, f) => s + f.amountMl, 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap print:hidden">
        <Link to="/residents/$id" params={{ id: r.id }} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to {r.firstName} {r.lastName}
        </Link>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1.5" /> Print / PDF
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clinical Charts</h1>
        <p className="text-sm text-muted-foreground">{r.firstName} {r.lastName} · Room {r.roomNumber}</p>
      </div>

      <Tabs defaultValue="weight">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="fluid">Fluids</TabsTrigger>
          <TabsTrigger value="food">Food</TabsTrigger>
          <TabsTrigger value="pain">Pain</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
          <TabsTrigger value="bowel">Bowel</TabsTrigger>
          <TabsTrigger value="behaviour">Behaviour</TabsTrigger>
          <TabsTrigger value="observation">Observations</TabsTrigger>
        </TabsList>

        <TabsContent value="weight" className="space-y-4 pt-3">
          <div className="flex justify-between items-center"><h2 className="font-medium">Weight trend</h2><AddWeight residentId={residentId} /></div>
          <Card><CardContent className="h-64 p-4">
            <ResponsiveContainer><LineChart data={rWeights.map(w => ({ date: w.date.slice(5), kg: w.weightKg }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", fontSize: 12 }} />
              <Line type="monotone" dataKey="kg" stroke="var(--color-primary)" strokeWidth={2} />
            </LineChart></ResponsiveContainer>
          </CardContent></Card>
          <RecordTable rows={rWeights.slice().reverse()} cols={["date", "weightKg", "staff", "notes"]} />
        </TabsContent>

        <TabsContent value="fluid" className="space-y-4 pt-3">
          <div className="flex justify-between items-center">
            <div><h2 className="font-medium">Fluid intake</h2><p className="text-xs text-muted-foreground">Today: <span className="font-medium">{todayFluidTotal} ml</span> · target 1500ml</p></div>
            <AddFluid residentId={residentId} />
          </div>
          <RecordTable rows={rFluids} cols={["date", "time", "amountMl", "type", "route", "staff"]} />
        </TabsContent>

        <TabsContent value="food" className="space-y-4 pt-3">
          <div className="flex justify-between items-center"><h2 className="font-medium">Food intake</h2><AddFood residentId={residentId} /></div>
          <RecordTable rows={rFoods} cols={["date", "meal", "intake", "description", "staff"]} />
        </TabsContent>

        <TabsContent value="pain" className="space-y-4 pt-3">
          <div className="flex justify-between items-center"><h2 className="font-medium">Pain score (0–10)</h2><AddPain residentId={residentId} /></div>
          <Card><CardContent className="h-64 p-4">
            <ResponsiveContainer><BarChart data={rPains.map(p => ({ date: p.date.slice(5), score: p.score }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", fontSize: 12 }} />
              <Bar dataKey="score" fill="var(--color-destructive)" />
            </BarChart></ResponsiveContainer>
          </CardContent></Card>
          <RecordTable rows={rPains.slice().reverse()} cols={["date", "time", "score", "location", "intervention", "staff"]} />
        </TabsContent>

        <TabsContent value="sleep" className="space-y-4 pt-3">
          <div className="flex justify-between items-center"><h2 className="font-medium">Sleep</h2><AddSleep residentId={residentId} /></div>
          <Card><CardContent className="h-64 p-4">
            <ResponsiveContainer><BarChart data={rSleeps.map(s => ({ date: s.date.slice(5), hours: s.hoursSlept }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", fontSize: 12 }} />
              <Bar dataKey="hours" fill="var(--color-info)" />
            </BarChart></ResponsiveContainer>
          </CardContent></Card>
          <RecordTable rows={rSleeps.slice().reverse()} cols={["date", "hoursSlept", "quality", "disturbances", "staff"]} />
        </TabsContent>

        <TabsContent value="bowel" className="space-y-4 pt-3">
          <div className="flex justify-between items-center"><h2 className="font-medium">Bowel chart</h2><AddBowel residentId={residentId} /></div>
          <RecordTable rows={rBowels} cols={["date", "time", "bristolType", "continent", "notes", "staff"]} />
        </TabsContent>

        <TabsContent value="behaviour" className="space-y-4 pt-3">
          <div className="flex justify-between items-center"><h2 className="font-medium">Behaviour log</h2><AddBehaviour residentId={residentId} /></div>
          <RecordTable rows={rBehaviour} cols={["date", "time", "behaviour", "trigger", "intervention", "outcome", "staff"]} />
        </TabsContent>

        <TabsContent value="observation" className="space-y-4 pt-3">
          <div className="flex justify-between items-center"><h2 className="font-medium">Observations</h2><AddObservation residentId={residentId} /></div>
          <RecordTable rows={rObs} cols={["date", "time", "mood", "mobility", "pain", "appetite", "hydration", "staff"]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RecordTable({ rows, cols }: { rows: any[]; cols: string[] }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">No records yet.</p>;
  return (
    <Card><CardContent className="p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40"><tr>{cols.map(c => <th key={c} className="text-left px-3 py-2 font-medium capitalize text-xs">{c.replace(/([A-Z])/g, " $1")}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i} className="border-t">
            {cols.map(c => <td key={c} className="px-3 py-2 text-xs">{String(r[c] ?? "—")}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </CardContent></Card>
  );
}

// ------- Add dialogs -------

function AddDialog({ label, children, onSubmit }: { label: string; children: React.ReactNode; onSubmit: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button></DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{label}</DialogTitle></DialogHeader>
        <div className="space-y-3">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => { onSubmit(); setOpen(false); toast.success("Saved"); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddWeight({ residentId }: { residentId: string }) {
  const { addWeight, currentUserName } = useCare();
  const [w, setW] = useState({ date: today(), weightKg: 65, notes: "" });
  return <AddDialog label="Record weight" onSubmit={() => addWeight({ ...w, residentId, staff: currentUserName })}>
    <div><Label>Date</Label><Input type="date" value={w.date} onChange={e => setW({ ...w, date: e.target.value })} /></div>
    <div><Label>Weight (kg)</Label><Input type="number" step="0.1" value={w.weightKg} onChange={e => setW({ ...w, weightKg: +e.target.value })} /></div>
    <div><Label>Notes</Label><Textarea value={w.notes} onChange={e => setW({ ...w, notes: e.target.value })} /></div>
  </AddDialog>;
}
function AddFluid({ residentId }: { residentId: string }) {
  const { addFluid, currentUserName } = useCare();
  const [f, setF] = useState<any>({ date: today(), time: now(), amountMl: 200, type: "Water", route: "oral" });
  return <AddDialog label="Record fluid intake" onSubmit={() => addFluid({ ...f, residentId, staff: currentUserName })}>
    <div className="grid grid-cols-2 gap-2">
      <div><Label>Date</Label><Input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div>
      <div><Label>Time</Label><Input type="time" value={f.time} onChange={e => setF({ ...f, time: e.target.value })} /></div>
    </div>
    <div><Label>Amount (ml)</Label><Input type="number" value={f.amountMl} onChange={e => setF({ ...f, amountMl: +e.target.value })} /></div>
    <div><Label>Type</Label><Input value={f.type} onChange={e => setF({ ...f, type: e.target.value })} /></div>
    <div><Label>Route</Label><Select value={f.route} onValueChange={v => setF({ ...f, route: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["oral", "iv", "ng", "peg"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
  </AddDialog>;
}
function AddFood({ residentId }: { residentId: string }) {
  const { addFood, currentUserName } = useCare();
  const [f, setF] = useState<any>({ date: today(), meal: "lunch", intake: "most", description: "" });
  return <AddDialog label="Record meal" onSubmit={() => addFood({ ...f, residentId, staff: currentUserName })}>
    <div><Label>Date</Label><Input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div>
    <div><Label>Meal</Label><Select value={f.meal} onValueChange={v => setF({ ...f, meal: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["breakfast", "lunch", "dinner", "snack"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
    <div><Label>Intake</Label><Select value={f.intake} onValueChange={v => setF({ ...f, intake: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["full", "most", "half", "little", "none"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
    <div><Label>Description</Label><Input value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
  </AddDialog>;
}
function AddPain({ residentId }: { residentId: string }) {
  const { addPain, currentUserName } = useCare();
  const [p, setP] = useState<any>({ date: today(), time: now(), score: 3, location: "", intervention: "" });
  return <AddDialog label="Record pain" onSubmit={() => addPain({ ...p, residentId, staff: currentUserName })}>
    <div className="grid grid-cols-2 gap-2">
      <div><Label>Date</Label><Input type="date" value={p.date} onChange={e => setP({ ...p, date: e.target.value })} /></div>
      <div><Label>Time</Label><Input type="time" value={p.time} onChange={e => setP({ ...p, time: e.target.value })} /></div>
    </div>
    <div><Label>Pain score (0–10)</Label><Input type="number" min={0} max={10} value={p.score} onChange={e => setP({ ...p, score: +e.target.value })} /></div>
    <div><Label>Location</Label><Input value={p.location} onChange={e => setP({ ...p, location: e.target.value })} /></div>
    <div><Label>Intervention</Label><Input value={p.intervention} onChange={e => setP({ ...p, intervention: e.target.value })} /></div>
  </AddDialog>;
}
function AddSleep({ residentId }: { residentId: string }) {
  const { addSleep, currentUserName } = useCare();
  const [s, setS] = useState<any>({ date: today(), hoursSlept: 7, quality: "good", disturbances: "" });
  return <AddDialog label="Record sleep" onSubmit={() => addSleep({ ...s, residentId, staff: currentUserName })}>
    <div><Label>Date</Label><Input type="date" value={s.date} onChange={e => setS({ ...s, date: e.target.value })} /></div>
    <div><Label>Hours slept</Label><Input type="number" step="0.5" value={s.hoursSlept} onChange={e => setS({ ...s, hoursSlept: +e.target.value })} /></div>
    <div><Label>Quality</Label><Select value={s.quality} onValueChange={v => setS({ ...s, quality: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["good", "broken", "poor"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
    <div><Label>Disturbances</Label><Input value={s.disturbances} onChange={e => setS({ ...s, disturbances: e.target.value })} /></div>
  </AddDialog>;
}
function AddBowel({ residentId }: { residentId: string }) {
  const { addBowel, currentUserName } = useCare();
  const [b, setB] = useState<any>({ date: today(), time: now(), bristolType: 4, continent: true, notes: "" });
  return <AddDialog label="Record bowel movement" onSubmit={() => addBowel({ ...b, residentId, staff: currentUserName })}>
    <div className="grid grid-cols-2 gap-2">
      <div><Label>Date</Label><Input type="date" value={b.date} onChange={e => setB({ ...b, date: e.target.value })} /></div>
      <div><Label>Time</Label><Input type="time" value={b.time} onChange={e => setB({ ...b, time: e.target.value })} /></div>
    </div>
    <div><Label>Bristol type (1–7)</Label><Input type="number" min={1} max={7} value={b.bristolType} onChange={e => setB({ ...b, bristolType: +e.target.value })} /></div>
    <div><Label>Continent</Label><Select value={String(b.continent)} onValueChange={v => setB({ ...b, continent: v === "true" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Yes</SelectItem><SelectItem value="false">No</SelectItem></SelectContent></Select></div>
    <div><Label>Notes</Label><Input value={b.notes} onChange={e => setB({ ...b, notes: e.target.value })} /></div>
  </AddDialog>;
}
function AddBehaviour({ residentId }: { residentId: string }) {
  const { addBehaviour, currentUserName } = useCare();
  const [b, setB] = useState<any>({ date: today(), time: now(), behaviour: "", trigger: "", intervention: "", outcome: "" });
  return <AddDialog label="Record behaviour" onSubmit={() => addBehaviour({ ...b, residentId, staff: currentUserName })}>
    <div className="grid grid-cols-2 gap-2">
      <div><Label>Date</Label><Input type="date" value={b.date} onChange={e => setB({ ...b, date: e.target.value })} /></div>
      <div><Label>Time</Label><Input type="time" value={b.time} onChange={e => setB({ ...b, time: e.target.value })} /></div>
    </div>
    <div><Label>Behaviour</Label><Input value={b.behaviour} onChange={e => setB({ ...b, behaviour: e.target.value })} /></div>
    <div><Label>Trigger</Label><Input value={b.trigger} onChange={e => setB({ ...b, trigger: e.target.value })} /></div>
    <div><Label>Intervention</Label><Input value={b.intervention} onChange={e => setB({ ...b, intervention: e.target.value })} /></div>
    <div><Label>Outcome</Label><Input value={b.outcome} onChange={e => setB({ ...b, outcome: e.target.value })} /></div>
  </AddDialog>;
}
function AddObservation({ residentId }: { residentId: string }) {
  const { addObservation, currentUserName, currentRole } = useCare();
  const [o, setO] = useState<any>({ date: today(), time: now(), mood: "calm", mobility: "assistance", pain: 0, sleep: "good", appetite: "most", hydration: "good", comments: "" });
  return <AddDialog label="Record observation" onSubmit={() => addObservation({ ...o, residentId, staff: currentUserName, role: currentRole })}>
    <div className="grid grid-cols-2 gap-2">
      <div><Label>Date</Label><Input type="date" value={o.date} onChange={e => setO({ ...o, date: e.target.value })} /></div>
      <div><Label>Time</Label><Input type="time" value={o.time} onChange={e => setO({ ...o, time: e.target.value })} /></div>
    </div>
    {[["mood", ["happy", "calm", "anxious", "withdrawn", "agitated"]], ["mobility", ["independent", "assistance", "hoist", "bedbound"]], ["sleep", ["good", "broken", "poor"]], ["appetite", ["full", "most", "half", "little", "none"]], ["hydration", ["good", "moderate", "poor"]]].map(([key, opts]: any) => (
      <div key={key}><Label className="capitalize">{key}</Label><Select value={o[key]} onValueChange={v => setO({ ...o, [key]: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{opts.map((x: string) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
    ))}
    <div><Label>Pain (0–10)</Label><Input type="number" min={0} max={10} value={o.pain} onChange={e => setO({ ...o, pain: +e.target.value })} /></div>
    <div><Label>Comments</Label><Textarea value={o.comments} onChange={e => setO({ ...o, comments: e.target.value })} /></div>
  </AddDialog>;
}
