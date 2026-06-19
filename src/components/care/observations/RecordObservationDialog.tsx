import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCare } from "@/lib/care/store";
import { getModule } from "@/lib/care/observations";
import { calcBMI, bmiCategory, calcNEWS2 } from "@/lib/care/vitals";
import type { ObservationKind } from "@/lib/care/types";

interface Props {
  kind: ObservationKind;
  residentId?: string;        // when undefined, user must select
  trigger?: React.ReactNode;
}

export function RecordObservationDialog({ kind, residentId: forcedRid, trigger }: Props) {
  const { residents, recordObservation } = useCare();
  const mod = getModule(kind);
  const [open, setOpen] = useState(false);
  const [residentId, setResidentId] = useState(forcedRid ?? "");
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [time, setTime] = useState(now.toTimeString().slice(0, 5));
  const [data, setData] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState("");

  const rid = forcedRid ?? residentId;
  const set = (k: string, v: any) => setData(d => ({ ...d, [k]: v }));

  // Live derived values
  const live = useMemo(() => {
    if (kind === "weight") {
      const w = +data.weight; const h = +data.height;
      const bmi = calcBMI(isNaN(w) ? undefined : w, isNaN(h) ? undefined : h);
      return bmi ? `BMI ${bmi} (${bmiCategory(bmi)})` : null;
    }
    if (kind === "news2") {
      const n = calcNEWS2(data as any);
      return n.complete ? `NEWS2 ${n.total} · ${n.risk}` : "Enter all vitals for NEWS2";
    }
    if (kind === "fluid") {
      const i = (+data.oralMl || 0) + (+data.pegMl || 0) + (+data.otherInMl || 0);
      const o = (+data.urineMl || 0) + (+data.vomitMl || 0) + (+data.drainageMl || 0) + (+data.otherOutMl || 0);
      return `In ${i}ml · Out ${o}ml · Balance ${i - o}ml`;
    }
    return null;
  }, [kind, data]);

  const reset = () => { setData({}); setNotes(""); };
  const submit = () => {
    if (!rid) return toast.error("Select a resident");
    // basic required check
    const missing = mod.fields.filter(f => f.required && (data[f.key] === undefined || data[f.key] === ""));
    if (missing.length) return toast.error(`Missing: ${missing.map(m => m.label).join(", ")}`);
    recordObservation({ residentId: rid, kind, date, time, data, notes: notes || undefined });
    toast.success(`${mod.shortLabel} observation recorded`);
    reset(); setOpen(false);
  };

  const groups = useMemo(() => {
    const g: Record<string, typeof mod.fields> = {};
    mod.fields.forEach(f => {
      const k = f.group ?? "Fields";
      (g[k] ||= []).push(f);
    });
    return g;
  }, [mod]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Record {mod.shortLabel}</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><mod.icon className={`h-5 w-5 ${mod.color}`} /> Record {mod.label}</DialogTitle></DialogHeader>
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
          {Object.entries(groups).map(([group, fields]) => (
            <div key={group} className="space-y-2">
              {Object.keys(groups).length > 1 && <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">{group}</div>}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {fields.map(f => (
                  <div key={f.key} className={f.type === "textarea" ? "col-span-2 md:col-span-3" : ""}>
                    <Label className="text-xs">{f.label}{f.required && <span className="text-destructive">*</span>}</Label>
                    {f.type === "number" && (
                      <Input type="number" step={f.step} min={f.min} max={f.max}
                        value={data[f.key] ?? ""} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
                    )}
                    {f.type === "text" && (
                      <Input value={data[f.key] ?? ""} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
                    )}
                    {f.type === "textarea" && (
                      <Textarea value={data[f.key] ?? ""} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
                    )}
                    {f.type === "select" && (
                      <Select value={data[f.key] ?? ""} onValueChange={v => set(f.key, v)}>
                        <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent>
                          {f.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    {f.type === "switch" && (
                      <div className="flex items-center h-9 gap-2">
                        <Switch checked={!!data[f.key]} onCheckedChange={v => set(f.key, v)} />
                        <span className="text-xs text-muted-foreground">{data[f.key] ? "Yes" : "No"}</span>
                      </div>
                    )}
                    {f.helper && <p className="text-[10px] text-muted-foreground mt-1">{f.helper}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {live && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <span className="text-xs uppercase text-muted-foreground mr-2">Live</span>
              <Badge variant="outline">{live}</Badge>
            </div>
          )}
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
