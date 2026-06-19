import { createFileRoute } from "@tanstack/react-router";
import { useCare } from "@/lib/care/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { can } from "@/lib/care/permissions";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — CarePath" }] }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const { auditLogs, currentRole } = useCare();
  if (!can(currentRole, "audit.view")) {
    return <div className="p-8 text-sm text-muted-foreground">Audit logs are only visible to the Director of Nursing.</div>;
  }
  return (
    <div className="p-4 md:p-8 space-y-4 max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
      <p className="text-sm text-muted-foreground">Chronological record of changes made in this session. Deleted records are retained for full traceability.</p>
      <div className="space-y-1.5">
        {auditLogs.map(l => (
          <Card key={l.id}><CardContent className="p-3 flex items-center gap-3 text-sm">
            <Badge variant="outline" className="capitalize text-[10px]">{l.role || "user"}</Badge>
            <div className="flex-1 min-w-0">
              <div><strong>{l.user}</strong> — {l.action}</div>
              <div className="text-xs text-muted-foreground">Entity: {l.entity}{l.reason ? ` · Reason: ${l.reason}` : ""}</div>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</div>
          </CardContent></Card>
        ))}
        {auditLogs.length === 0 && <p className="text-sm text-muted-foreground">No activity yet — actions you take will be logged here.</p>}
      </div>
    </div>
  );
}
