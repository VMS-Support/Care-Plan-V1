import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Thermometer, Heart, Wind, Droplets, Weight, Gauge } from "lucide-react";
import type { VitalSign, Resident } from "@/lib/care/types";
import { calcBMI, bmiCategory, calcNEWS2, heightAtDate } from "@/lib/care/vitals";

function Stat({ icon: Icon, label, value, unit, tone }: { icon: any; label: string; value: string | number | undefined; unit?: string; tone?: string }) {
  return (
    <div className="rounded-md border p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={`mt-0.5 text-base font-semibold tabular-nums ${tone || ""}`}>
        {value ?? "—"}{value !== undefined && unit && <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}

export function LatestVitalsCard({ vitals, resident, compact }: { vitals: VitalSign[]; resident?: Resident; compact?: boolean }) {
  const v = vitals.filter(x => !x.deletedAt).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
  if (!v) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Latest Vitals</CardTitle></CardHeader>
        <CardContent><p className="text-xs text-muted-foreground">No observations recorded yet.</p></CardContent>
      </Card>
    );
  }
  const h = v.height ?? heightAtDate(v.residentId, v.date, vitals, resident);
  const bmi = calcBMI(v.weight, h);
  const cat = bmiCategory(bmi);
  const news = calcNEWS2(v);
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Latest Vitals</CardTitle>
        <span className="text-[10px] text-muted-foreground">{v.date} {v.time} · {v.recordedByName}</span>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-3 ${compact ? "md:grid-cols-5" : "md:grid-cols-5 lg:grid-cols-6"} gap-2`}>
          <Stat icon={Thermometer} label="Temp" value={v.temperature} unit="°C" />
          <Stat icon={Heart} label="Pulse" value={v.pulse} unit="bpm" />
          <Stat icon={Wind} label="Resp" value={v.respiratoryRate} unit="/min" />
          <Stat icon={Gauge} label="BP" value={v.systolicBP ? `${v.systolicBP}/${v.diastolicBP ?? "?"}` : undefined} unit="mmHg" />
          <Stat icon={Droplets} label="SpO2" value={v.spo2} unit="%" />
          <Stat icon={Droplets} label="BGL" value={v.bloodGlucose} unit="mmol/L" />
          <Stat icon={Weight} label="Weight" value={v.weight} unit="kg" />
          <Stat icon={Activity} label="BMI" value={bmi} />
          <Stat icon={Activity} label="Pain" value={v.painScore} unit="/10" />
          <div className="rounded-md border p-2.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Activity className="h-3 w-3" /> NEWS2</div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-base font-semibold tabular-nums">{news.complete ? news.total : "—"}</span>
              {news.complete && <Badge variant="outline" className={`text-[9px] capitalize ${news.risk === "high" ? "border-destructive/40 text-destructive" : news.risk === "medium" ? "border-warning/40 text-warning-foreground" : ""}`}>{news.risk}</Badge>}
            </div>
          </div>
          {cat && <div className="col-span-2 text-[10px] text-muted-foreground self-center">BMI category: <span className="capitalize font-medium text-foreground">{cat}</span></div>}
        </div>
      </CardContent>
    </Card>
  );
}
