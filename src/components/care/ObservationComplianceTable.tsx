import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListChecks } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { complianceForResident, FREQUENCY_LABEL, OBS_TYPE_LABEL, type ComplianceStatus } from "@/lib/care/vitals";

const cls: Record<ComplianceStatus, string> = {
  on_time: "border-success/40 text-success",
  due_today: "border-info/40 text-info",
  overdue: "border-warning/40 text-warning-foreground",
  missed: "border-destructive/40 text-destructive",
  prn: "border-muted-foreground/30 text-muted-foreground",
};

export function ObservationComplianceTable({ residentId }: { residentId: string }) {
  const { observationPlans, vitals } = useCare();
  const plan = observationPlans.find(p => p.residentId === residentId);
  const rv = vitals.filter(v => v.residentId === residentId);
  const comp = complianceForResident(plan, rv);
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> Observation Compliance</CardTitle>
        <Badge variant="outline">{comp.compliancePct}%</Badge>
      </CardHeader>
      <CardContent>
        {comp.items.length === 0
          ? <p className="text-xs text-muted-foreground">No plan items.</p>
          : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-2">Observation</th>
                  <th className="text-left p-2">Frequency</th>
                  <th className="text-left p-2">Last</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {comp.items.map(ci => (
                  <tr key={ci.item.id}>
                    <td className="p-2">{OBS_TYPE_LABEL[ci.item.type]}</td>
                    <td className="p-2 text-xs">{FREQUENCY_LABEL[ci.item.frequency]}</td>
                    <td className="p-2 text-xs text-muted-foreground">{ci.lastRecordedAt ? new Date(ci.lastRecordedAt).toLocaleString() : "Never"}</td>
                    <td className="p-2"><Badge variant="outline" className={`capitalize text-[10px] ${cls[ci.status]}`}>{ci.status.replace("_", " ")}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </CardContent>
    </Card>
  );
}
