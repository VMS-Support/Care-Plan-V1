import { useMemo, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCare } from "@/lib/care/store";
import type { VitalRecordType, VitalSign } from "@/lib/care/types";
import { calcBMI, calcNEWS2, heightAtDate } from "@/lib/care/vitals";
import { VITAL_TYPE_LABELS } from "@/lib/care/vital-records";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Props { residentId?: string; trigger?: React.ReactNode; onRecorded?: () => void }
type Values = Record<string, string | boolean>;

const TYPES = Object.keys(VITAL_TYPE_LABELS) as VitalRecordType[];
const numberValue = (value: string | boolean | undefined) => typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : undefined;

export function RecordObservationFlow({ residentId: fixedResidentId, trigger, onRecorded }: Props) {
  const { residents, vitals, recordVital } = useCare();
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<VitalRecordType>();
  const [residentId, setResidentId] = useState(fixedResidentId ?? "");
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [time, setTime] = useState(now.toTimeString().slice(0, 5));
  const [values, setValues] = useState<Values>({ onOxygen: false, consciousness: "A" });
  const selectedResidentId = fixedResidentId ?? residentId;
  const resident = residents.find((candidate) => candidate.id === selectedResidentId);
  const set = (key: string, value: string | boolean) => setValues((current) => ({ ...current, [key]: value }));

  const bmi = useMemo(() => calcBMI(
    numberValue(values.weight),
    numberValue(values.height) ?? heightAtDate(selectedResidentId, date, vitals, resident),
  ), [values.weight, values.height, selectedResidentId, date, vitals, resident]);
  const news = calcNEWS2({
    temperature: numberValue(values.temperature), pulse: numberValue(values.pulse),
    respiratoryRate: numberValue(values.respiratoryRate), spo2: numberValue(values.spo2),
    systolicBP: numberValue(values.systolicBP), onOxygen: !!values.onOxygen,
    consciousness: values.consciousness as VitalSign["consciousness"],
  });

  const close = () => {
    setOpen(false);
    setType(undefined);
    setValues({ onOxygen: false, consciousness: "A" });
  };

  const requireFields = (fields: string[]) => {
    const missing = fields.filter((field) => values[field] === undefined || values[field] === "");
    if (missing.length) {
      toast.error(`Complete: ${missing.map(fieldLabel).join(", ")}`);
      return false;
    }
    return true;
  };

  const submit = () => {
    if (!type || !selectedResidentId) return toast.error("Select a resident and observation type");
    const required: Partial<Record<VitalRecordType, string[]>> = {
      full_news2: ["temperature", "pulse", "respiratoryRate", "spo2", "systolicBP", "diastolicBP", "consciousness"],
      temperature: ["temperature"], blood_pressure: ["systolicBP", "diastolicBP"],
      oxygen_saturation: ["spo2"], blood_glucose: ["bloodGlucose", "glucoseContext"],
      weight_bmi: ["weight"], pain_score: ["painScore"], fluid_balance: [],
      respiratory: ["respiratoryRate"],
    };
    if (!requireFields(required[type] || [])) return;
    if (type === "fluid_balance" && numberValue(values.fluidIntakeMl) === undefined && numberValue(values.fluidOutputMl) === undefined) {
      return toast.error("Enter intake, output, or both");
    }
    if (["full_news2", "oxygen_saturation", "respiratory"].includes(type) && values.onOxygen && !values.oxygenLpm) {
      return toast.error("Complete: Oxygen L/min");
    }

    const payload: Record<string, unknown> = {
      residentId: selectedResidentId,
      observationType: type,
      date,
      time,
      recordedAt: new Date(`${date}T${time}:00`).toISOString(),
    };
    const addNumber = (key: string) => { const value = numberValue(values[key]); if (value !== undefined) payload[key] = value; };
    const addText = (key: string) => { const value = values[key]; if (typeof value === "string" && value.trim()) payload[key] = value.trim(); };

    const numericByType: Record<VitalRecordType, string[]> = {
      full_news2: ["temperature", "pulse", "respiratoryRate", "spo2", "systolicBP", "diastolicBP", "oxygenLpm"],
      temperature: ["temperature"], blood_pressure: ["systolicBP", "diastolicBP", "pulse"],
      oxygen_saturation: ["spo2", "oxygenLpm", "respiratoryRate"], blood_glucose: ["bloodGlucose"],
      weight_bmi: ["weight", "height"], pain_score: ["painScore"],
      fluid_balance: ["fluidIntakeMl", "fluidOutputMl"], respiratory: ["respiratoryRate", "spo2", "oxygenLpm"],
    };
    numericByType[type].forEach(addNumber);
    if (["full_news2", "oxygen_saturation", "respiratory"].includes(type)) payload.onOxygen = !!values.onOxygen;
    if (type === "full_news2") addText("consciousness");
    if (type === "blood_glucose") { addText("glucoseContext"); addText("insulinGiven"); }
    if (type === "pain_score") { addText("painLocation"); addText("painIntervention"); addText("painOutcome"); }
    if (type === "fluid_balance") addText("fluidRoute");
    addText("observationNotes");
    if (!["weight_bmi", "pain_score", "fluid_balance"].includes(type)) addText("deviceUsed");

    recordVital(payload as Parameters<typeof recordVital>[0]);
    toast.success(`${VITAL_TYPE_LABELS[type]} recorded`);
    close();
    onRecorded?.();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => next ? setOpen(true) : close()}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Record Observation</Button>}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {!type ? (
          <>
            <DialogHeader><DialogTitle>Choose Observation Type</DialogTitle></DialogHeader>
            <div className="grid sm:grid-cols-2 gap-2">
              {TYPES.map((item) => (
                <Button key={item} variant="outline" className="h-auto min-h-12 justify-start whitespace-normal text-left" onClick={() => setType(item)}>
                  {VITAL_TYPE_LABELS[item]}
                </Button>
              ))}
            </div>
            <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button></DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <button type="button" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 w-fit" onClick={() => setType(undefined)}><ArrowLeft className="h-3.5 w-3.5" /> Observation types</button>
              <DialogTitle>{VITAL_TYPE_LABELS[type]}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!fixedResidentId && <Field label="Resident"><Select value={residentId} onValueChange={setResidentId}><SelectTrigger><SelectValue placeholder="Select resident" /></SelectTrigger><SelectContent>{residents.map((item) => <SelectItem key={item.id} value={item.id}>{item.firstName} {item.lastName} · Room {item.roomNumber}</SelectItem>)}</SelectContent></Select></Field>}
              <div className="grid grid-cols-2 gap-3"><Field label="Date"><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field><Field label="Time"><Input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></Field></div>
              <ObservationFields type={type} values={values} set={set} bmi={bmi} news={news} />
              <Field label="Notes"><Textarea value={String(values.observationNotes ?? "")} onChange={(event) => set("observationNotes", event.target.value)} /></Field>
              {!(["weight_bmi", "pain_score", "fluid_balance"] as VitalRecordType[]).includes(type) && <Field label="Device Used"><Input value={String(values.deviceUsed ?? "")} onChange={(event) => set("deviceUsed", event.target.value)} placeholder="Optional" /></Field>}
            </div>
            <DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={submit}>Record Observation</Button></DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ObservationFields({ type, values, set, bmi, news }: { type: VitalRecordType; values: Values; set: (key: string, value: string | boolean) => void; bmi?: number; news: ReturnType<typeof calcNEWS2> }) {
  const input = (key: string, label: string, options?: { required?: boolean; step?: string; min?: number; max?: number }) => <Field label={label} required={options?.required}><Input type="number" step={options?.step} min={options?.min} max={options?.max} value={String(values[key] ?? "")} onChange={(event) => set(key, event.target.value)} /></Field>;
  const oxygen = <><Field label="Supplemental Oxygen"><Select value={values.onOxygen ? "yes" : "no"} onValueChange={(value) => set("onOxygen", value === "yes")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="no">No - room air</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent></Select></Field>{values.onOxygen && input("oxygenLpm", "Oxygen L/min", { step: "0.5", required: true })}</>;
  if (type === "full_news2") return <><div className="grid sm:grid-cols-3 gap-3">{input("temperature", "Temperature °C", { required: true, step: "0.1" })}{input("pulse", "Pulse bpm", { required: true })}{input("respiratoryRate", "Respiratory Rate", { required: true })}{input("spo2", "SpO2 %", { required: true })}{input("systolicBP", "Systolic BP", { required: true })}{input("diastolicBP", "Diastolic BP", { required: true })}{oxygen}<Field label="Consciousness ACVPU" required><Select value={String(values.consciousness)} onValueChange={(value) => set("consciousness", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["A", "C", "V", "P", "U"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></Field></div><NEWS2Live news={news} /></>;
  if (type === "temperature") return <div className="grid sm:grid-cols-2 gap-3">{input("temperature", "Temperature °C", { required: true, step: "0.1" })}</div>;
  if (type === "blood_pressure") return <div className="grid sm:grid-cols-3 gap-3">{input("systolicBP", "Systolic BP", { required: true })}{input("diastolicBP", "Diastolic BP", { required: true })}{input("pulse", "Pulse optional")}</div>;
  if (type === "oxygen_saturation") return <div className="grid sm:grid-cols-2 gap-3">{input("spo2", "SpO2 %", { required: true })}{oxygen}{input("respiratoryRate", "Respiratory Rate optional")}</div>;
  if (type === "blood_glucose") return <div className="grid sm:grid-cols-2 gap-3">{input("bloodGlucose", "Blood Glucose mmol/L", { required: true, step: "0.1" })}<Field label="Meal Context" required><Select value={String(values.glucoseContext ?? "")} onValueChange={(value) => set("glucoseContext", value)}><SelectTrigger><SelectValue placeholder="Select context" /></SelectTrigger><SelectContent><SelectItem value="before_meal">Before meal</SelectItem><SelectItem value="after_meal">After meal</SelectItem><SelectItem value="random">Random</SelectItem><SelectItem value="fasting">Fasting</SelectItem></SelectContent></Select></Field><Field label="Insulin Given"><Input value={String(values.insulinGiven ?? "")} onChange={(event) => set("insulinGiven", event.target.value)} placeholder="Optional dose/type" /></Field></div>;
  if (type === "weight_bmi") return <><div className="grid sm:grid-cols-2 gap-3">{input("weight", "Weight kg", { required: true, step: "0.1" })}{input("height", "Height cm optional", { step: "0.1" })}</div><Derived label="BMI" value={bmi !== undefined ? String(bmi) : "Enter weight; stored resident height is used when available"} /></>;
  if (type === "pain_score") return <div className="grid sm:grid-cols-2 gap-3">{input("painScore", "Pain Score 0-10", { required: true, min: 0, max: 10 })}<Field label="Location"><Input value={String(values.painLocation ?? "")} onChange={(event) => set("painLocation", event.target.value)} /></Field><Field label="Intervention Given"><Textarea value={String(values.painIntervention ?? "")} onChange={(event) => set("painIntervention", event.target.value)} /></Field><Field label="Outcome"><Textarea value={String(values.painOutcome ?? "")} onChange={(event) => set("painOutcome", event.target.value)} /></Field></div>;
  if (type === "fluid_balance") return <><div className="grid sm:grid-cols-3 gap-3">{input("fluidIntakeMl", "Intake ml")}{input("fluidOutputMl", "Output ml")}<Field label="Route / Type"><Input value={String(values.fluidRoute ?? "")} onChange={(event) => set("fluidRoute", event.target.value)} placeholder="Optional" /></Field></div><Derived label="Balance" value={`${(numberValue(values.fluidIntakeMl) ?? 0) - (numberValue(values.fluidOutputMl) ?? 0)} ml`} /></>;
  return <div className="grid sm:grid-cols-2 gap-3">{input("respiratoryRate", "Respiratory Rate", { required: true })}{input("spo2", "SpO2 optional")}{oxygen}</div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>{children}</div>; }
function Derived({ label, value }: { label: string; value: string }) { return <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm"><span className="text-xs text-muted-foreground mr-2">{label}</span><Badge variant="outline">{value}</Badge></div>; }
function NEWS2Live({ news }: { news: ReturnType<typeof calcNEWS2> }) {
  if (!news.complete) return <Derived label="NEWS2" value="Complete full observations to calculate NEWS2" />;
  return <div className="rounded-md border bg-muted/30 p-3 space-y-2"><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">NEWS2 Live</span><span className="text-xl font-semibold tabular-nums">{news.total}</span><Badge variant="outline" className="capitalize">{news.risk}</Badge></div><div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">{Object.entries(news.breakdown).map(([label, score]) => <span key={label}><span className="text-muted-foreground">{label}</span> +{score}</span>)}</div></div>;
}
function fieldLabel(key: string) { return ({ respiratoryRate: "Respiratory Rate", systolicBP: "Systolic BP", diastolicBP: "Diastolic BP", bloodGlucose: "Blood Glucose", glucoseContext: "Meal Context", painScore: "Pain Score", fluidIntakeMl: "Intake", fluidOutputMl: "Output", consciousness: "Consciousness" } as Record<string, string>)[key] || key[0].toUpperCase() + key.slice(1); }
