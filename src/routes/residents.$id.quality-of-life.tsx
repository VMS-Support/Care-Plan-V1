import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useCare } from "@/lib/care/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Smile, Utensils, Droplet, Moon, Activity as ActivityIcon } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts";

export const Route = createFileRoute("/residents/$id/quality-of-life")({
  head: () => ({ meta: [{ title: "Quality of Life — CarePath" }] }),
  component: QoLPage,
});

const moodScore: Record<string, number> = { happy: 5, calm: 4, withdrawn: 3, anxious: 2, agitated: 1 };
const foodScore: Record<string, number> = { full: 5, most: 4, half: 3, little: 2, none: 1 };
const fluidScore: Record<string, number> = { good: 5, moderate: 3, poor: 1 };
const sleepScore: Record<string, number> = { good: 5, broken: 3, poor: 1 };

function QoLPage() {
  const { id } = Route.useParams();
  const { residents, notes, assessments, interventions } = useCare();
  const resident = residents.find(r => r.id === id);

  const rNotes = useMemo(() => notes.filter(n => n.residentId === id).sort((a, b) => a.date.localeCompare(b.date)), [notes, id]);
  const data = useMemo(() => rNotes.slice(-30).map(n => ({
    date: n.date.slice(5, 10),
    mood: moodScore[n.mood] ?? 3,
    food: foodScore[n.foodIntake] ?? 3,
    fluid: fluidScore[n.fluidIntake] ?? 3,
    sleep: sleepScore[n.sleep] ?? 3,
  })), [rNotes]);

  const painSeries = useMemo(() => assessments
    .filter(a => a.residentId === id && a.type === "abbey_pain" && a.status !== "deleted")
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(a => ({ date: a.date.slice(5, 10), score: a.totalScore })),
    [assessments, id]);

  const cognitionSeries = useMemo(() => assessments
    .filter(a => a.residentId === id && (a.type === "mmse" || a.type === "four_at") && a.status !== "deleted")
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(a => ({ date: a.date.slice(5, 10), score: a.totalScore, type: a.type })),
    [assessments, id]);

  const moodCounts = useMemo(() => {
    const c: Record<string, number> = { happy: 0, calm: 0, withdrawn: 0, anxious: 0, agitated: 0 };
    rNotes.forEach(n => { c[n.mood] = (c[n.mood] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [rNotes]);

  const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
  const stats = {
    mood: avg(data.map(d => d.mood)),
    food: avg(data.map(d => d.food)),
    fluid: avg(data.map(d => d.fluid)),
    sleep: avg(data.map(d => d.sleep)),
    interventions: interventions.filter(i => i.residentId === id).length,
  };

  if (!resident) return <div className="p-8">Resident not found.</div>;

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <Link to="/residents/$id" params={{ id }} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> {resident.firstName} {resident.lastName}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quality of Life</h1>
        <p className="text-sm text-muted-foreground mt-1">Trends from daily notes, pain charts and cognitive assessments</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat icon={Smile} label="Avg Mood" value={`${stats.mood}/5`} />
        <Stat icon={Utensils} label="Avg Food" value={`${stats.food}/5`} />
        <Stat icon={Droplet} label="Avg Fluid" value={`${stats.fluid}/5`} />
        <Stat icon={Moon} label="Avg Sleep" value={`${stats.sleep}/5`} />
        <Stat icon={ActivityIcon} label="Interventions" value={stats.interventions} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Wellbeing Trend (last 30 daily notes)</CardTitle></CardHeader>
        <CardContent className="h-72">
          {data.length === 0 ? <p className="text-sm text-muted-foreground">No daily notes yet.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="mood" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="food" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="fluid" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="sleep" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Pain (Abbey Pain Scale)</CardTitle></CardHeader>
          <CardContent className="h-56">
            {painSeries.length === 0 ? <p className="text-sm text-muted-foreground">No pain assessments.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={painSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="hsl(0 75% 55%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Cognition (MMSE / 4AT)</CardTitle></CardHeader>
          <CardContent className="h-56">
            {cognitionSeries.length === 0 ? <p className="text-sm text-muted-foreground">No cognitive assessments.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cognitionSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Mood Distribution</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moodCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="capitalize" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card><CardContent className="p-3">
      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">{label}</span></div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
    </CardContent></Card>
  );
}
