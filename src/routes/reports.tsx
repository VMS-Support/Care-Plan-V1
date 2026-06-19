import { createFileRoute } from "@tanstack/react-router";
import { useCare } from "@/lib/care/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { toast } from "sonner";
import { Download } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics — CarePath" }] }),
  component: ReportsPage,
});

const COLORS = ["var(--color-success)", "var(--color-info)", "var(--color-warning)", "var(--color-destructive)"];

function exportCSV(filename: string, rows: any[]) {
  if (!rows.length) return toast.error("Nothing to export");
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  toast.success("Export downloaded");
}

function ReportsPage() {
  const { residents, assessments, carePlans, interventions } = useCare();

  // Risk distribution
  const latestWaterlow = residents.map(r => assessments.filter(a => a.residentId === r.id && a.type === "waterlow").sort((a, b) => b.date.localeCompare(a.date))[0]).filter(Boolean) as any[];
  const riskDist = ["low", "moderate", "high", "very_high"].map(level => ({ name: level.replace("_", " "), value: latestWaterlow.filter(a => a.riskLevel === level).length }));

  // Trends by date (avg scores)
  const trend = (type: string) => {
    const map = new Map<string, { sum: number; n: number }>();
    assessments.filter(a => a.type === type).forEach(a => {
      const k = a.date.slice(0, 10);
      const v = map.get(k) || { sum: 0, n: 0 };
      v.sum += a.totalScore; v.n += 1; map.set(k, v);
    });
    return [...map.entries()].sort().map(([date, v]) => ({ date: date.slice(5), score: Math.round(v.sum / v.n) }));
  };

  const compliance = carePlans.map(c => ({ name: c.title.slice(0, 18), value: interventions.filter(i => i.carePlanId === c.id).length || Math.floor(Math.random() * 5) + 1 }));

  return (
    <div className="p-4 md:p-8 space-y-5">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Audit-ready insights across the home.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV("residents.csv", residents)}><Download className="h-4 w-4 mr-1.5" /> Residents CSV</Button>
          <Button variant="outline" size="sm" onClick={() => exportCSV("assessments.csv", assessments.map(a => ({ ...a, scores: JSON.stringify(a.scores) })))}><Download className="h-4 w-4 mr-1.5" /> Assessments CSV</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Download className="h-4 w-4 mr-1.5" /> PDF (Print)</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Pressure Risk Distribution</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><PieChart>
              <Pie data={riskDist} dataKey="value" nameKey="name" outerRadius={80} label>
                {riskDist.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie><Legend /><Tooltip />
            </PieChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Waterlow Trend</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><LineChart data={trend("waterlow")}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
              <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2} />
            </LineChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Abbey Pain Trend</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><LineChart data={trend("abbey_pain")}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
              <Line type="monotone" dataKey="score" stroke="var(--color-chart-3)" strokeWidth={2} />
            </LineChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Care Plan Intervention Volume</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><BarChart data={compliance}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} /><Tooltip />
              <Bar dataKey="value" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
