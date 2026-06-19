import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VitalSign } from "@/lib/care/types";
import { vitalsSeries } from "@/lib/care/vitals";

export function VitalsTrendChart({ title, vitals, metric, unit, color = "hsl(var(--primary))" }: {
  title: string;
  vitals: VitalSign[];
  metric: keyof VitalSign | "bmi" | "news2";
  unit?: string;
  color?: string;
}) {
  const data = vitalsSeries(vitals, metric);
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}{unit ? <span className="text-[10px] text-muted-foreground font-normal ml-1">({unit})</span> : null}</CardTitle></CardHeader>
      <CardContent className="h-40">
        {data.length === 0
          ? <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data</div>
          : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={10} tickFormatter={d => d.slice(5)} />
                <YAxis fontSize={10} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
      </CardContent>
    </Card>
  );
}
