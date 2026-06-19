import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets } from "lucide-react";
import type { VitalSign } from "@/lib/care/types";
import { glucoseTrend } from "@/lib/care/vitals";

export function BloodGlucoseChart({ vitals }: { vitals: VitalSign[] }) {
  const g = glucoseTrend(vitals);
  const data = g.readings.map(r => ({ x: `${r.date.slice(5)} ${r.time}`, value: r.value }));
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2"><Droplets className="h-4 w-4 text-warning" /> Blood Glucose</CardTitle>
        <div className="flex gap-1">
          {g.highCount > 0 && <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">High ×{g.highCount}</Badge>}
          {g.lowCount > 0 && <Badge variant="outline" className="text-[10px] border-warning/40 text-warning-foreground">Low ×{g.lowCount}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="h-44">
        {data.length === 0
          ? <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No glucose readings</div>
          : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="x" fontSize={9} />
                <YAxis fontSize={10} domain={[2, 'auto']} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => `${v} mmol/L`} />
                <ReferenceLine y={4} stroke="hsl(var(--warning))" strokeDasharray="3 3" />
                <ReferenceLine y={11} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
      </CardContent>
    </Card>
  );
}
