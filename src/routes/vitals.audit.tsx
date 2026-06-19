import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/vitals/audit")({
  head: () => ({ meta: [{ title: "Observation Audit Report — CarePath" }] }),
  component: VitalsAuditReport,
});

function VitalsAuditReport() {
  const { vitals, residents, currentRole } = useCare();
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<string>("all");

  if (!can(currentRole, "vital.audit")) {
    return <div className="p-8"><p>You do not have permission to view audit records.</p></div>;
  }

  const entries = useMemo(() => {
    const out: {
      vitalId: string; residentId: string; residentName: string; action: string;
      byUserName: string; byRole: string; at: string; reason?: string; patchSummary?: string;
    }[] = [];
    for (const v of vitals) {
      const r = residents.find(x => x.id === v.residentId);
      const rn = r ? `${r.firstName} ${r.lastName}` : v.residentId;
      for (const a of v.auditTrail) {
        out.push({
          vitalId: v.id, residentId: v.residentId, residentName: rn,
          action: a.action, byUserName: a.byUserName, byRole: a.byRole, at: a.at,
          reason: a.reason, patchSummary: a.patchSummary,
        });
      }
    }
    return out
      .filter(e => action === "all" || e.action === action)
      .filter(e => {
        if (!search) return true;
        const q = search.toLowerCase();
        return e.residentName.toLowerCase().includes(q) || e.byUserName.toLowerCase().includes(q);
      })
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [vitals, residents, search, action]);

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-7xl">
      <Link to="/vitals" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Vital Signs</Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><History className="h-6 w-6 text-primary" /> Observation Audit Report</h1>
        <p className="text-sm text-muted-foreground">Full audit trail for all vital sign entries. Records are retained for compliance.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Input className="max-w-sm" placeholder="Search resident or staff…" value={search} onChange={e => setSearch(e.target.value)} />
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="edited">Edited</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
            <SelectItem value="restored">Restored</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => window.print()}>Print</Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left p-2">When</th>
                <th className="text-left p-2">Action</th>
                <th className="text-left p-2">Resident</th>
                <th className="text-left p-2">Staff</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Reason / Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((e, i) => (
                <tr key={`${e.vitalId}-${i}`}>
                  <td className="p-2 text-xs">{new Date(e.at).toLocaleString()}</td>
                  <td className="p-2"><Badge variant="outline" className="text-[10px] capitalize">{e.action}</Badge></td>
                  <td className="p-2"><Link to="/residents/$id" params={{ id: e.residentId }} className="text-primary hover:underline">{e.residentName}</Link></td>
                  <td className="p-2">{e.byUserName}</td>
                  <td className="p-2 capitalize text-xs">{e.byRole}</td>
                  <td className="p-2 text-xs text-muted-foreground">{e.reason || e.patchSummary || "—"}</td>
                </tr>
              ))}
              {entries.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground text-sm">No audit entries.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
