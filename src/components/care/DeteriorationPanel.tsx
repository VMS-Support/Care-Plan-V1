import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus, TrendingDown } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { useMemo } from "react";
import { deteriorationSignals, type Direction } from "@/lib/care/vitals";

function Arrow({ dir, badIsUp = true }: { dir: Direction; badIsUp?: boolean }) {
  if (dir === "flat") return <Minus className="h-4 w-4 text-muted-foreground" />;
  const bad = (badIsUp && dir === "up") || (!badIsUp && dir === "down");
  const cls = bad ? "text-destructive" : "text-success";
  return dir === "up" ? <ArrowUp className={`h-4 w-4 ${cls}`} /> : <ArrowDown className={`h-4 w-4 ${cls}`} />;
}

export function DeteriorationPanel({ residentId }: { residentId: string }) {
  const { vitals, assessments, incidents } = useCare();
  const rv = vitals.filter(v => v.residentId === residentId);

  const signals = useMemo(() => {
    const barthel = assessments
      .filter(a => a.residentId === residentId && a.type === "barthel" && !a.deletedAt)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(a => a.totalScore);
    const now = Date.now();
    const fallsLast30 = incidents.filter(i => i.residentId === residentId && (i.type as string)?.toLowerCase().includes("fall") && (now - new Date(i.date).getTime()) <= 30 * 86400000).length;
    const fallsPrev30 = incidents.filter(i => {
      if (i.residentId !== residentId) return false;
      if (!(i.type as string)?.toLowerCase().includes("fall")) return false;
      const t = now - new Date(i.date).getTime();
      return t > 30 * 86400000 && t <= 60 * 86400000;
    }).length;
    return deteriorationSignals(rv, { barthelScores: barthel, fallsLast30, fallsPrev30 });
  }, [rv, assessments, incidents, residentId]);

  const rows = [
    { label: "Weight", dir: signals.weight, badIsUp: false, hint: signals.weight === "down" ? "Trending down" : signals.weight === "up" ? "Trending up" : "Stable" },
    { label: "NEWS2", dir: signals.news2, badIsUp: true, hint: signals.news2 === "up" ? "Rising" : signals.news2 === "down" ? "Improving" : "Stable" },
    { label: "Pain", dir: signals.pain, badIsUp: true, hint: signals.pain === "up" ? "Increasing" : signals.pain === "down" ? "Decreasing" : "Stable" },
    { label: "Mobility", dir: signals.mobility, badIsUp: true, hint: signals.mobility === "up" ? "Declining" : signals.mobility === "down" ? "Improving" : "Stable" },
    { label: "Falls (30d)", dir: signals.falls, badIsUp: true, hint: signals.falls === "up" ? "More falls" : signals.falls === "down" ? "Fewer falls" : "Stable" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-primary" /> Clinical Deterioration Monitoring</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {rows.map(r => (
            <div key={r.label} className="rounded-md border p-3 flex flex-col items-center gap-1">
              <div className="text-[10px] uppercase text-muted-foreground tracking-wide">{r.label}</div>
              <Arrow dir={r.dir} badIsUp={r.badIsUp} />
              <div className="text-[10px] text-muted-foreground">{r.hint}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Informational only. Clinical decisions remain with nursing staff.</p>
      </CardContent>
    </Card>
  );
}
