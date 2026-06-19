import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCare } from "@/lib/care/store";
import { calcBMI, bmiCategory, calcNEWS2, heightAtDate } from "@/lib/care/vitals";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Props { residentId?: string; trigger?: React.ReactNode }

const num = (s: string) => (s === "" ? undefined : Number.isFinite(+s) ? +s : undefined);

export function RecordVitalDialog({ residentId: forcedRid, trigger }: Props) {
  const { residents, vitals, recordVital } = useCare();
  const [open, setOpen] = useState(false);
  const [residentId, setResidentId] = useState<string>(forcedRid ?? "");
  const today = new Date();
  const [date, setDate] = useState(today.toISOString().slice(0, 10));
  const [time, setTime] = useState(today.toTimeString().slice(0, 5));
  const [temperature, setTemperature] = useState("");
  const [pulse, setPulse] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [systolicBP, setSystolicBP] = useState("");
  const [diastolicBP, setDiastolicBP] = useState("");
  const [spo2, setSpo2] = useState("");
  const [onOxygen, setOnOxygen] = useState(false);
  const [bloodGlucose, setBloodGlucose] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [painScore, setPainScore] = useState("");
  const [consciousness, setConsciousness] = useState<"A" | "C" | "V" | "P" | "U">("A");
  const [fluidIntakeMl, setFluidIntakeMl] = useState("");
  const [fluidOutputMl, setFluidOutputMl] = useState("");
  const [observationNotes, setObservationNotes] = useState("");
  const [clinicalComments, setClinicalComments] = useState("");
  const [deviceUsed, setDeviceUsed] = useState("");

  const rid = forcedRid ?? residentId;
  const resident = residents.find(r => r.id === rid);
  const effHeight = useMemo(() => num(height) ?? heightAtDate(rid, date, vitals, resident), [height, rid, date, vitals, resident]);
  const liveBmi = calcBMI(num(weight), effHeight);
  const liveNews = calcNEWS2({
    temperature: num(temperature), pulse: num(pulse), respiratoryRate: num(respiratoryRate),
    systolicBP: num(systolicBP), spo2: num(spo2), onOxygen, consciousness,
  });

  const reset = () => {
    setTemperature(""); setPulse(""); setRespiratoryRate(""); setSystolicBP(""); setDiastolicBP("");
    setSpo2(""); setOnOxygen(false); setBloodGlucose(""); setWeight(""); setHeight("");
    setPainScore(""); setConsciousness("A"); setFluidIntakeMl(""); setFluidOutputMl("");
    setObservationNotes(""); setClinicalComments(""); setDeviceUsed("");
  };

  const submit = () => {
    if (!rid) return toast.error("Select a resident");
    const recordedAt = new Date(`${date}T${time}:00`).toISOString();
    recordVital({
      residentId: rid, date, time, recordedAt,
      temperature: num(temperature), pulse: num(pulse), respiratoryRate: num(respiratoryRate),
      systolicBP: num(systolicBP), diastolicBP: num(diastolicBP),
      spo2: num(spo2), onOxygen, bloodGlucose: num(bloodGlucose),
      weight: num(weight), height: num(height), painScore: num(painScore),
      consciousness, fluidIntakeMl: num(fluidIntakeMl), fluidOutputMl: num(fluidOutputMl),
      observationNotes: observationNotes || undefined, clinicalComments: clinicalComments || undefined,
      deviceUsed: deviceUsed || undefined,
    });
    toast.success("Observation recorded");
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Record Observation</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Record Vital Signs</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          {!forcedRid && (
            <div>
              <Label>Resident</Label>
              <Select value={residentId} onValueChange={setResidentId}>
                <SelectTrigger><SelectValue placeholder="Select resident…" /></SelectTrigger>
                <SelectContent>
                  {residents.map(r => <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName} · {r.roomNumber}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><Label>Time</Label><Input type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
          </div>

          <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wide pt-2">Core Observations</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label>Temp (°C)</Label><Input type="number" step="0.1" value={temperature} onChange={e => setTemperature(e.target.value)} /></div>
            <div><Label>Pulse (bpm)</Label><Input type="number" value={pulse} onChange={e => setPulse(e.target.value)} /></div>
            <div><Label>Resp rate</Label><Input type="number" value={respiratoryRate} onChange={e => setRespiratoryRate(e.target.value)} /></div>
            <div><Label>SpO2 (%)</Label><Input type="number" value={spo2} onChange={e => setSpo2(e.target.value)} /></div>
            <div><Label>Systolic BP</Label><Input type="number" value={systolicBP} onChange={e => setSystolicBP(e.target.value)} /></div>
            <div><Label>Diastolic BP</Label><Input type="number" value={diastolicBP} onChange={e => setDiastolicBP(e.target.value)} /></div>
            <div><Label>Blood glucose (mmol/L)</Label><Input type="number" step="0.1" value={bloodGlucose} onChange={e => setBloodGlucose(e.target.value)} /></div>
            <div className="flex flex-col gap-1">
              <Label>Supplemental O2</Label>
              <Select value={onOxygen ? "yes" : "no"} onValueChange={v => setOnOxygen(v === "yes")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Room air</SelectItem>
                  <SelectItem value="yes">On oxygen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wide pt-2">Nutrition</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><Label>Weight (kg)</Label><Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} /></div>
            <div><Label>Height (cm) <span className="text-[10px] text-muted-foreground">— optional, sticky</span></Label><Input type="number" placeholder={resident?.heightCm ? String(resident.heightCm) : ""} value={height} onChange={e => setHeight(e.target.value)} /></div>
            <div className="rounded-md border bg-muted/20 p-2.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Live BMI</div>
              <div className="text-base font-semibold tabular-nums">{liveBmi ?? "—"} <span className="text-xs text-muted-foreground capitalize">{bmiCategory(liveBmi) ?? ""}</span></div>
            </div>
          </div>

          <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wide pt-2">Clinical</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><Label>Pain score (0–10)</Label><Input type="number" min="0" max="10" value={painScore} onChange={e => setPainScore(e.target.value)} /></div>
            <div>
              <Label>Consciousness (ACVPU)</Label>
              <Select value={consciousness} onValueChange={(v: any) => setConsciousness(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A — Alert</SelectItem>
                  <SelectItem value="C">C — Confused</SelectItem>
                  <SelectItem value="V">V — Voice</SelectItem>
                  <SelectItem value="P">P — Pain</SelectItem>
                  <SelectItem value="U">U — Unresponsive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border bg-muted/20 p-2.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Live NEWS2</div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-semibold tabular-nums">{liveNews.complete ? liveNews.total : "—"}</span>
                {liveNews.complete && <Badge variant="outline" className="capitalize text-[10px]">{liveNews.risk}</Badge>}
              </div>
              {!liveNews.complete && <div className="text-[10px] text-muted-foreground">Complete RR, SpO2, Temp, BP, Pulse for full score</div>}
            </div>
          </div>

          <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wide pt-2">Hydration</div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Fluid intake (ml)</Label><Input type="number" value={fluidIntakeMl} onChange={e => setFluidIntakeMl(e.target.value)} /></div>
            <div><Label>Fluid output (ml)</Label><Input type="number" value={fluidOutputMl} onChange={e => setFluidOutputMl(e.target.value)} /></div>
          </div>

          <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wide pt-2">Notes</div>
          <div><Label>Observation notes</Label><Textarea value={observationNotes} onChange={e => setObservationNotes(e.target.value)} /></div>
          <div><Label>Clinical comments</Label><Textarea value={clinicalComments} onChange={e => setClinicalComments(e.target.value)} /></div>
          <div><Label>Device used (optional)</Label><Input value={deviceUsed} onChange={e => setDeviceUsed(e.target.value)} placeholder="e.g. Welch Allyn Connex" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
