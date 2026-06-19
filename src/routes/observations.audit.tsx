import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { ALL_KINDS, getModule } from "@/lib/care/observations";
import type { ObservationKind } from "@/lib/care/types";

export const Route = createFileRoute("/observations/audit")({
  head: () => ({ meta: [{ title: "Observation Audit Report — CarePath" }] }),
  component: AuditReport,
});

function AuditReport() {
  const { clinicalObservations, residents } = useCare();
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState("");

  const entries = useMemo(() => {
    const rows: { at: string; kind: ObservationKind; action: string; user: string; role: string; residentName: string; reason?: string; obsId: string }[] = [];
    for (const o of clinicalObservations) {
      if (kindFilter !== "all" && o.kind !== kindFilter) continue;
      const resident = residents.find(r => r.id === o.residentId);
      const residentName = resident ? `${resident.firstName} ${resident.lastName}` : o.residentId;
      for (const a of o.auditTrail) {
        if (userFilter && !a.byUserName.toLowerCase().includes(userFilter.toLowerCase())) continue;
        rows.push({ at: a.at, kind: o.kind, action: a.action, user: a.byUserName, role: a.byRole, residentName, reason: a.reason, obsId: o.id });
      }
    }
    return rows.sort((a, b) => b.at.localeCompare(a.at));
  }, [clinicalObservations, residents, kindFilter, userFilter]);

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-7xl">
      <Link to="/observations" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Observation Modules</Link>
      <h1 className="text-2xl font-semibold tracking-tight">Observation Audit Report</h1>
      <p className="text-sm text-muted-foreground">Complete trail of who recorded, edited, or deleted observations — with reason. Soft delete only; entries are retained for inspection.</p>

      <div className="flex flex-wrap gap-2">
        <Select value={kindFilter} onValueChange={setKindFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modules</SelectItem>
            {ALL_KINDS.map(k => <SelectItem key={k} value={k}>{getModule(k).label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Filter by user…" className="w-56" value={userFilter} onChange={e => setUserFilter(e.target.value)} />
        <div className="flex-1" />
        <Badge variant="outline" className="self-center">{entries.length} entries</Badge>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Time</th>
                <th className="text-left p-2">Module</th>
                <th className="text-left p-2">Action</th>
                <th className="text-left p-2">User</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Resident</th>
                <th className="text-left p-2">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((r, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="p-2 text-xs">{r.at.slice(0, 10)}</td>
                  <td className="p-2 text-xs">{r.at.slice(11, 16)}</td>
                  <td className="p-2 text-xs">{getModule(r.kind).shortLabel}</td>
                  <td className="p-2"><Badge variant="outline" className="text-[10px] capitalize">{r.action}</Badge></td>
                  <td className="p-2 text-xs">{r.user}</td>
                  <td className="p-2 text-xs capitalize">{r.role}</td>
                  <td className="p-2 text-xs">{r.residentName}</td>
                  <td className="p-2 text-xs text-muted-foreground">{r.reason ?? "—"}</td>
                </tr>
              ))}
              {entries.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">No audit entries yet. Record an observation to populate the trail.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
