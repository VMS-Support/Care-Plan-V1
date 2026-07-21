import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, CheckCircle2, HeartPulse, Scale, TriangleAlert } from "lucide-react";
import { useCare } from "@/lib/care/store";
import type { ClinicalAlert, ClinicalAlertType, Role } from "@/lib/care/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isPhysiologicalLegacyAlert } from "@/lib/care/alerts";

type Focus = "all" | "vitals" | "weight" | "pain" | "resolved";
type QueueState = "open" | "dismissed" | "resolved" | "all";
type DismissReason = NonNullable<ClinicalAlert["dismissedReason"]>;
type QueueAlert = Pick<
  ClinicalAlert,
  | "residentId"
  | "type"
  | "severity"
  | "title"
  | "message"
  | "recommendation"
  | "currentValue"
  | "previousValue"
  | "sourceVitalId"
  | "createdAt"
  | "updatedAt"
  | "acknowledged"
  | "dismissedAt"
  | "dismissedBy"
  | "dismissedReason"
  | "resolvedAt"
  | "resolvedBy"
> & { id: string; source: "clinical" | "legacy" };

const CLINICAL_TYPES = new Set<ClinicalAlertType>([
  "weight_loss", "weight_gain", "high_news2", "abnormal_bp", "abnormal_temp", "low_spo2",
  "high_pain", "hypoglycaemia", "hyperglycaemia", "fluid_imbalance",
]);
const WEIGHT_TYPES = new Set<ClinicalAlertType>(["weight_loss", "weight_gain"]);
const DISMISS_REASONS: DismissReason[] = ["Resolved", "Reviewed", "Expected Change", "Entered In Error", "Other"];
const severityRank: Record<ClinicalAlert["severity"], number> = {
  critical: 0,
  high: 1,
  warning: 2,
  info: 3,
};

function scopeLabel(role: Role) {
  if (role === "don") return "Facility-wide clinical changes";
  if (role === "cnm") return "Wing-level clinical changes";
  return "Clinical changes for residents assigned to you";
}

function isResolved(alert: QueueAlert) {
  return !!alert.resolvedAt || alert.dismissedReason === "Resolved";
}

function alertGroup(alert: Pick<QueueAlert, "type">): Exclude<Focus, "all" | "resolved"> {
  if (WEIGHT_TYPES.has(alert.type)) return "weight";
  if (alert.type === "high_pain") return "pain";
  return "vitals";
}

function legacyAlertType(alert: { title: string; description: string }): ClinicalAlertType {
  const text = `${alert.title} ${alert.description}`.toLowerCase();
  if (text.includes("weight") && /(gain|increase)/.test(text)) return "weight_gain";
  if (text.includes("weight")) return "weight_loss";
  if (text.includes("pain")) return "high_pain";
  if (text.includes("spo2") || text.includes("oxygen")) return "low_spo2";
  if (text.includes("glucose") || text.includes("hypoglycaemia")) return "hypoglycaemia";
  if (text.includes("hyperglycaemia")) return "hyperglycaemia";
  if (text.includes("fluid") || text.includes("hydration")) return "fluid_imbalance";
  if (text.includes("news2")) return "high_news2";
  if (text.includes("blood pressure") || /\bbp\b/.test(text)) return "abnormal_bp";
  return "abnormal_temp";
}

function legacySeverity(priority: "low" | "medium" | "high" | "critical"): ClinicalAlert["severity"] {
  if (priority === "critical") return "critical";
  if (priority === "high") return "high";
  if (priority === "medium") return "warning";
  return "info";
}

export function ClinicalChangesQueue() {
  const { alerts: legacyAlerts, clinicalAlerts, residents, vitals, currentRole, currentUser, dismissClinicalAlert, resolveAlert } = useCare();
  const [focus, setFocus] = useState<Focus>("all");
  const [queueState, setQueueState] = useState<QueueState>("open");
  const [dismissTarget, setDismissTarget] = useState<QueueAlert | null>(null);
  const [dismissReason, setDismissReason] = useState<DismissReason>("Reviewed");

  const residentMap = useMemo(() => new Map(residents.map((resident) => [resident.id, resident])), [residents]);
  const vitalMap = useMemo(() => new Map(vitals.map((vital) => [vital.id, vital])), [vitals]);
  const scopedResidents = useMemo(() => {
    if (currentRole === "don") return new Set(residents.map((resident) => resident.id));
    if (currentRole === "nurse") {
      const assigned = residents.filter((resident) => resident.keyWorkers?.namedNurse?.includes(currentUser.name));
      if (assigned.length > 0) return new Set(assigned.map((resident) => resident.id));
    }
    if (currentUser.assignedWings.length === 0) return new Set(residents.map((resident) => resident.id));
    return new Set(residents.filter((resident) => currentUser.assignedWings.includes(resident.wingId || "")).map((resident) => resident.id));
  }, [currentRole, currentUser.assignedWings, residents]);

  const alerts = useMemo<QueueAlert[]>(() => {
    const clinical = clinicalAlerts
      .filter((alert) => CLINICAL_TYPES.has(alert.type) && scopedResidents.has(alert.residentId))
      .map((alert) => ({ ...alert, source: "clinical" as const }));
    const activeClinicalKeys = new Set(
      clinical
        .filter((alert) => !alert.dismissedAt && !isResolved(alert))
        .map((alert) => `${alert.residentId}:${alert.type}`),
    );
    const legacy = legacyAlerts
      .filter((alert) =>
        scopedResidents.has(alert.residentId) &&
        isPhysiologicalLegacyAlert(alert) &&
        !activeClinicalKeys.has(`${alert.residentId}:${legacyAlertType(alert)}`),
      )
      .map<QueueAlert>((alert) => ({
        id: alert.id,
        source: "legacy",
        residentId: alert.residentId,
        type: legacyAlertType(alert),
        severity: legacySeverity(alert.priority),
        title: alert.title,
        message: alert.description,
        recommendation: "Review resident and document any action taken.",
        createdAt: alert.createdAt,
        acknowledged: alert.acknowledged,
        acknowledgedBy: alert.acknowledgedBy,
        acknowledgedAt: alert.acknowledgedAt,
        resolvedAt: alert.resolvedAt,
        resolvedBy: alert.resolvedBy,
      }));
    return [...clinical, ...legacy].sort(
      (a, b) => severityRank[a.severity] - severityRank[b.severity] || b.createdAt.localeCompare(a.createdAt),
    );
  }, [clinicalAlerts, legacyAlerts, scopedResidents]);

  const counts = {
    open: alerts.filter((alert) => !alert.dismissedAt && !isResolved(alert)).length,
    critical: alerts.filter((alert) => alert.severity === "critical" && !alert.dismissedAt && !isResolved(alert)).length,
    weight: alerts.filter((alert) => WEIGHT_TYPES.has(alert.type) && !alert.dismissedAt && !isResolved(alert)).length,
    observations: alerts.filter((alert) => !WEIGHT_TYPES.has(alert.type) && alert.type !== "high_pain" && !alert.dismissedAt && !isResolved(alert)).length,
    resolved: alerts.filter(isResolved).length,
  };

  const filtered = alerts.filter((alert) => {
    const resolved = isResolved(alert);
    if (focus !== "all" && focus !== "resolved" && alertGroup(alert) !== focus) return false;
    if (focus === "resolved" && !resolved) return false;
    if (queueState === "open" && (alert.dismissedAt || resolved)) return false;
    if (queueState === "dismissed" && (!alert.dismissedAt || resolved)) return false;
    if (queueState === "resolved" && !resolved) return false;
    return true;
  });

  const selectSummary = (nextFocus: Focus, nextState: QueueState = "open") => {
    setFocus(nextFocus);
    setQueueState(nextState);
  };

  const submitDismissal = () => {
    if (!dismissTarget) return;
    if (dismissTarget.source === "clinical") dismissClinicalAlert(dismissTarget.id, dismissReason);
    else resolveAlert(dismissTarget.id);
    setDismissTarget(null);
    setDismissReason("Reviewed");
  };

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold">Alerts</h1>
        <p className="text-sm font-medium mt-1">Changes requiring nursing review.</p>
        <p className="text-xs text-muted-foreground mt-1">{scopeLabel(currentRole)}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <SummaryCard label="Open Alerts" value={counts.open} icon={TriangleAlert} onClick={() => selectSummary("all")} />
        <SummaryCard label="Critical" value={counts.critical} icon={HeartPulse} onClick={() => selectSummary("all")} critical />
        <SummaryCard label="Weight Changes" value={counts.weight} icon={Scale} onClick={() => selectSummary("weight")} />
        <SummaryCard label="Abnormal Observations" value={counts.observations} icon={Activity} onClick={() => selectSummary("vitals")} />
        <SummaryCard label="Resolved" value={counts.resolved} icon={CheckCircle2} onClick={() => selectSummary("resolved", "resolved")} />
      </div>

      <div className="space-y-3">
        <Tabs value={focus} onValueChange={(value) => {
          const next = value as Focus;
          setFocus(next);
          if (next === "resolved") setQueueState("resolved");
        }}>
          <TabsList className="h-auto flex flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="weight">Weight</TabsTrigger>
            <TabsTrigger value="pain">Pain</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={queueState} onValueChange={(value) => setQueueState(value as QueueState)}>
          <TabsList>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-3">
        {filtered.map((alert) => {
          const resident = residentMap.get(alert.residentId);
          const sourceVital = alert.sourceVitalId ? vitalMap.get(alert.sourceVitalId) : undefined;
          const resolved = isResolved(alert);
          return (
            <Card key={alert.id} className={alert.severity === "critical" ? "border-destructive/50" : alert.severity === "info" ? "border-border" : "border-warning/40"}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{alertGroup(alert) === "vitals" ? "Vitals" : alertGroup(alert) === "weight" ? "Weight" : "Pain"}</Badge>
                      <Badge variant={alert.severity === "critical" ? "destructive" : "outline"} className="capitalize">{alert.severity}</Badge>
                      {resolved && <Badge variant="secondary">Resolved</Badge>}
                      {!resolved && alert.dismissedAt && <Badge variant="secondary">Dismissed</Badge>}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{alert.title}</h2>
                      <p className="text-sm text-muted-foreground">{resident ? `${resident.firstName} ${resident.lastName} · Room ${resident.roomNumber}` : "Resident"}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-3 text-sm">
                      <Value label="Current Value" value={alert.currentValue || alert.message} strong />
                      <Value label="Previous Value" value={alert.previousValue || "Not available"} />
                      <Value label="Date" value={new Date(sourceVital?.recordedAt || alert.updatedAt || alert.createdAt).toLocaleString()} />
                      <Value label="Severity" value={alert.severity} capitalize />
                    </div>
                    <div className="border-l-2 border-primary pl-3">
                      <div className="text-xs text-muted-foreground">Recommended Action</div>
                      <div className="text-sm font-medium mt-0.5">{alert.recommendation}</div>
                    </div>
                    {alert.dismissedAt && (
                      <p className="text-xs text-muted-foreground">{resolved ? "Resolved" : "Dismissed"} by {alert.dismissedBy || alert.resolvedBy || "Staff"} on {new Date(alert.dismissedAt).toLocaleString()} · {alert.dismissedReason || "Reviewed"}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap lg:flex-col gap-2 lg:w-44">
                    <Button asChild size="sm" variant="outline"><Link to="/residents/$id" params={{ id: alert.residentId }}>Open Resident</Link></Button>
                    <Button asChild size="sm"><Link to="/residents/$id/vitals" params={{ id: alert.residentId }}>Record Observation</Link></Button>
                    {!alert.dismissedAt && !resolved && <Button size="sm" variant="ghost" onClick={() => setDismissTarget(alert)}>Dismiss</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="border rounded-md p-10 text-center">
            <CheckCircle2 className="h-9 w-9 mx-auto text-success mb-3" />
            <p className="font-medium">No active changes requiring review.</p>
            <p className="text-sm text-muted-foreground mt-1">Everything appears clinically stable.</p>
          </div>
        )}
      </div>

      <Dialog open={!!dismissTarget} onOpenChange={(open) => !open && setDismissTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dismiss Alert</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This removes the alert from the active queue and retains the full clinical history.</p>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={dismissReason} onValueChange={(value) => setDismissReason(value as DismissReason)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DISMISS_REASONS.map((reason) => <SelectItem key={reason} value={reason}>{reason}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDismissTarget(null)}>Cancel</Button>
            <Button onClick={submitDismissal}>Dismiss</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, onClick, critical }: { label: string; value: number; icon: typeof Activity; onClick: () => void; critical?: boolean }) {
  return <button type="button" onClick={onClick} className="text-left"><Card className="hover:bg-accent/40 transition-colors h-full"><CardContent className="p-4 flex items-center justify-between gap-3"><div><div className="text-xs text-muted-foreground">{label}</div><div className="text-2xl font-semibold tabular-nums mt-1">{value}</div></div><Icon className={`h-5 w-5 ${critical ? "text-destructive" : "text-muted-foreground"}`} /></CardContent></Card></button>;
}

function Value({ label, value, strong, capitalize }: { label: string; value: string; strong?: boolean; capitalize?: boolean }) {
  return <div><div className="text-xs text-muted-foreground">{label}</div><div className={`${strong ? "font-semibold" : "font-medium"} mt-0.5 ${capitalize ? "capitalize" : ""}`}>{value}</div></div>;
}
