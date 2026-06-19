import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets } from "lucide-react";
import type { VitalSign } from "@/lib/care/types";
import { fluidBalance7Day } from "@/lib/care/vitals";

export function FluidBalanceChart({ vitals }: { vitals: VitalSign[] }) {
  const data = fluidBalance7Day(vitals).map(d => ({ date: d.date.slice(5), balanceMl: d.balanceMl, intakeMl: d.intakeMl, outputMl: d.outputMl }));
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Droplets className="h-4 w-4 text-info" /> Fluid Balance (7-day)</CardTitle></CardHeader>
      <CardContent className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => `${v} ml`} />
            <Bar dataKey="balanceMl">
              {data.map((d, i) => <Cell key={i} fill={d.balanceMl >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
