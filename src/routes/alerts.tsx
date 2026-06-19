import { createFileRoute, Link } from "@tanstack/react-router";
import { useCare } from "@/lib/care/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Alerts — CarePath" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const { alerts, residents, acknowledgeAlert } = useCare();
  const open = alerts.filter(a => !a.acknowledged);
  const closed = alerts.filter(a => a.acknowledged);
  return (
    <div className="p-4 md:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
        <p className="text-sm text-muted-foreground mt-1">{open.length} open · {closed.length} acknowledged</p>
      </div>
      <div className="space-y-2">
        {open.map(a => {
          const r = residents.find(x => x.id === a.residentId);
          const tone = a.priority === "critical" ? "border-destructive/40 bg-destructive/5" :
            a.priority === "high" ? "border-warning/40 bg-warning/5" :
            a.priority === "medium" ? "border-info/30 bg-info/5" : "border-border";
          return (
            <Card key={a.id} className={tone}>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{a.title}</span>
                    <Badge variant="outline" className="capitalize text-[10px]">{a.priority}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{a.description}</p>
                  {r && <Link to="/residents/$id" params={{ id: r.id }} className="text-xs text-primary hover:underline">{r.firstName} {r.lastName} · Room {r.roomNumber}</Link>}
                </div>
                <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(a.id)}><CheckCircle2 className="h-4 w-4 mr-1" /> Acknowledge</Button>
              </CardContent>
            </Card>
          );
        })}
        {open.length === 0 && <p className="text-sm text-muted-foreground">No open alerts.</p>}
      </div>
      {closed.length > 0 && <>
        <h2 className="text-sm font-semibold mt-6">Acknowledged</h2>
        <div className="space-y-2 opacity-70">
          {closed.map(a => (
            <Card key={a.id}><CardContent className="p-3 text-sm flex justify-between"><span>{a.title}</span><Badge variant="outline">{a.priority}</Badge></CardContent></Card>
          ))}
        </div>
      </>}
    </div>
  );
}
