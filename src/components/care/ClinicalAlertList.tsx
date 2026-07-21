import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Check, X, MessageSquarePlus } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import type { ClinicalAlert } from "@/lib/care/types";
import { isActionableClinicalAlert } from "@/lib/care/alerts";

function severityCls(s: ClinicalAlert["severity"]) {
  if (s === "critical") return "border-destructive/40 text-destructive bg-destructive/5";
  if (s === "high") return "border-warning/60 text-warning-foreground bg-warning/10";
  if (s === "warning") return "border-warning/40 text-warning-foreground bg-warning/5";
  return "border-info/40 text-info bg-info/5";
}

function EscalationDialog({ alertId }: { alertId: string }) {
  const { addClinicalEscalationNote } = useCare();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 text-xs"><MessageSquarePlus className="h-3 w-3 mr-1" /> Add escalation note</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Action taken</DialogTitle></DialogHeader>
        <Label>What action was taken?</Label>
        <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="e.g. GP contacted; advised PRN paracetamol and review in 4 hours." />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!text.trim()} onClick={() => { addClinicalEscalationNote(alertId, text.trim()); setText(""); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClinicalAlertList({ residentId, alerts: alertsOverride }: { residentId?: string; alerts?: ClinicalAlert[] }) {
  const { clinicalAlerts, acknowledgeClinicalAlert, dismissClinicalAlert, currentRole } = useCare();
  const all = alertsOverride ?? clinicalAlerts;
  const items = all.filter(
    (a) =>
      isActionableClinicalAlert(a) &&
      !a.dismissedAt &&
      (!residentId || a.residentId === residentId),
  );
  const canEscalate = can(currentRole, "vital.escalate");

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-success" /> Active Clinical Alerts</CardTitle></CardHeader>
        <CardContent><p className="text-xs text-muted-foreground">No active alerts.</p></CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Active Clinical Alerts ({items.length})</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map(a => (
          <div key={a.id} className={`rounded-md border p-3 ${severityCls(a.severity)}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{a.title}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{a.severity}</Badge>
                  {a.acknowledged && <Badge variant="outline" className="text-[10px]">Acknowledged</Badge>}
                </div>
                <p className="text-xs mt-1 text-foreground/80">{a.message}</p>
                <p className="text-xs mt-1"><span className="font-medium">Recommendation:</span> {a.recommendation}</p>
                {a.escalations.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-foreground/10 pt-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Escalation notes</div>
                    {a.escalations.map(e => (
                      <div key={e.id} className="text-xs">
                        <span className="font-medium">{e.actionTaken}</span>
                        <span className="text-muted-foreground"> — {e.enteredByName} · {new Date(e.at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {!a.acknowledged && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => acknowledgeClinicalAlert(a.id)}><Check className="h-3 w-3 mr-1" /> Ack</Button>}
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => dismissClinicalAlert(a.id)}><X className="h-3 w-3 mr-1" /> Dismiss</Button>
              </div>
            </div>
            {canEscalate && <div className="mt-1"><EscalationDialog alertId={a.id} /></div>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
