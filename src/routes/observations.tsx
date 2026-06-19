import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { ALL_KINDS, getModule, complianceFor } from "@/lib/care/observations";

export const Route = createFileRoute("/observations")({
  head: () => ({ meta: [{ title: "Clinical Observations — CarePath" }] }),
  component: ObservationsDashboard,
});

function ObservationsDashboard() {
  const { clinicalObservations, residents, observationSchedules } = useCare();

  const stats = ALL_KINDS.map(kind => {
    const mod = getModule(kind);
    const ofKind = clinicalObservations.filter(o => o.kind === kind && !o.deletedAt);
    let alertCount = 0;
    let overdue = 0;
    let dueToday = 0;
    let needingReview = 0;
    residents.forEach(r => {
      const rObs = ofKind.filter(o => o.residentId === r.id);
      if (rObs.length === 0) return;
      const alerts = mod.deriveAlerts(rObs, r);
      if (alerts.length > 0) needingReview++;
      alertCount += alerts.length;
      const sched = observationSchedules.find(s => s.residentId === r.id);
      const item = sched?.items.find(i => i.kind === kind);
      if (item) {
        const c = complianceFor(kind, item.frequency, rObs);
        if (c.status === "overdue" || c.status === "missed") overdue++;
        if (c.status === "due_today") dueToday++;
      }
    });
    return { kind, mod, total: ofKind.length, alertCount, overdue, dueToday, needingReview };
  });

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clinical Observations</h1>
        <p className="text-sm text-muted-foreground">Dedicated modules for each observation type. Each module has its own form, history, trends, alerts, and audit trail.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/observations/audit" className="text-xs text-primary hover:underline">View unified Observation Audit Report →</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {stats.map(s => {
          const Icon = s.mod.icon;
          return (
            <Link key={s.kind} to="/observations/$kind" params={{ kind: s.kind }}>
              <Card className="hover:border-primary transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-9 w-9 rounded-md ${s.mod.bg} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${s.mod.color}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{s.mod.label}</div>
                        <div className="text-[10px] text-muted-foreground">{s.total} record{s.total === 1 ? "" : "s"}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{s.mod.description}</p>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="border rounded p-1">
                      <div className="text-[9px] uppercase text-muted-foreground">Review</div>
                      <div className="text-sm font-semibold">{s.needingReview}</div>
                    </div>
                    <div className="border rounded p-1">
                      <div className="text-[9px] uppercase text-muted-foreground">Alerts</div>
                      <div className={`text-sm font-semibold ${s.alertCount > 0 ? "text-warning-foreground" : ""}`}>{s.alertCount}</div>
                    </div>
                    <div className="border rounded p-1">
                      <div className="text-[9px] uppercase text-muted-foreground">Overdue</div>
                      <div className={`text-sm font-semibold ${s.overdue > 0 ? "text-destructive" : ""}`}>{s.overdue}</div>
                    </div>
                  </div>
                  {s.dueToday > 0 && <Badge variant="outline" className="text-[10px]">{s.dueToday} due today</Badge>}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
