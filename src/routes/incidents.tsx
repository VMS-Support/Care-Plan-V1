import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCare } from "@/lib/care/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { can } from "@/lib/care/permissions";
import { RecordActions } from "@/components/care/RecordActions";
import { OpsListToolbar } from "@/components/care/OpsListToolbar";
import { IncidentDialog } from "@/components/care/IncidentDialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { Incident } from "@/lib/care/types";

export const Route = createFileRoute("/incidents")({
  head: () => ({ meta: [{ title: "Incidents — CarePath" }] }),
  component: IncidentsPage,
});

function IncidentsPage() {
  const care = useCare();
  const { incidents, residents, filteredResidentIds, filter, currentRole } = care;
  const [statusTab, setStatusTab] = useState<"active" | "archived" | "deleted">("active");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [workflowStatus, setWorkflowStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; mode: "create" | "edit" | "view"; record?: Incident }>({ open: false, mode: "create" });

  const counts = useMemo(() => ({
    active: incidents.filter(i => (i.recordStatus || "active") === "active").length,
    archived: incidents.filter(i => i.recordStatus === "archived").length,
    deleted: incidents.filter(i => i.recordStatus === "deleted").length,
  }), [incidents]);

  const filtered = useMemo(() => {
    const filterIds = new Set(filteredResidentIds);
    const q = search.toLowerCase();
    let arr = incidents.filter(i => {
      const rs = i.recordStatus || "active";
      if (rs !== statusTab) return false;
      if ((filter.wingId || filter.residentId) && !filterIds.has(i.residentId)) return false;
      if (workflowStatus !== "all" && i.status !== workflowStatus) return false;
      if (dateFrom && i.date < dateFrom) return false;
      if (dateTo && i.date > dateTo) return false;
      if (q) {
        const r = residents.find(x => x.id === i.residentId);
        const hay = `${i.type} ${i.severity} ${i.description} ${i.reportedBy} ${r?.firstName} ${r?.lastName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    arr.sort((a, b) => {
      if (sort === "date-asc") return a.date.localeCompare(b.date);
      if (sort === "severity") {
        const order: any = { critical: 0, high: 1, moderate: 2, low: 3 };
        return order[a.severity] - order[b.severity];
      }
      return b.date.localeCompare(a.date);
    });
    return arr;
  }, [incidents, statusTab, filteredResidentIds, filter, residents, search, sort, workflowStatus, dateFrom, dateTo]);

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Incidents</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} shown · {counts.active} active · {counts.archived} archived · {counts.deleted} deleted</p>
        </div>
        {can(currentRole, "incident.create") && (
          <Button size="sm" onClick={() => setDialog({ open: true, mode: "create" })}><Plus className="h-4 w-4 mr-1" /> New Incident</Button>
        )}
      </div>

      <OpsListToolbar
        search={search} setSearch={setSearch}
        statusTab={statusTab} setStatusTab={setStatusTab}
        sort={sort} setSort={setSort}
        sortOptions={[
          { value: "date-desc", label: "Newest First" },
          { value: "date-asc", label: "Oldest First" },
          { value: "severity", label: "Severity" },
        ]}
        dateFrom={dateFrom} setDateFrom={setDateFrom}
        dateTo={dateTo} setDateTo={setDateTo}
        workflowStatus={workflowStatus} setWorkflowStatus={setWorkflowStatus}
        workflowOptions={[
          { value: "draft", label: "Draft" },
          { value: "open", label: "Open" },
          { value: "under_investigation", label: "Under Investigation" },
          { value: "closed", label: "Closed" },
        ]}
        counts={counts}
      />

      <div className="space-y-2">
        {filtered.map(i => {
          const r = residents.find(x => x.id === i.residentId);
          const rs = i.recordStatus || "active";
          return (
            <Card key={i.id} className={`hover:shadow-sm transition-shadow ${rs === "deleted" ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <Link to="/residents/$id" params={{ id: i.residentId }} className="font-medium capitalize hover:underline">
                      {i.type.replace("_", " ")} — {r?.firstName} {r?.lastName}
                    </Link>
                    <div className="text-xs text-muted-foreground">{i.date} · Room {r?.roomNumber} · Reported by {i.reportedBy}{i.createdBy && i.createdBy !== i.reportedBy ? ` · Created by ${i.createdBy}` : ""}</div>
                    <p className="text-sm mt-2 line-clamp-2">{i.description}</p>
                    {rs === "deleted" && <p className="text-xs text-destructive mt-1">Deleted by {i.deletedBy} — {i.deletedReason}</p>}
                  </div>
                  <div className="flex gap-1.5 items-center flex-wrap">
                    <Badge variant="outline" className="capitalize">{i.severity}</Badge>
                    <Badge variant="secondary" className="capitalize">{i.status.replace("_", " ")}</Badge>
                    {rs !== "active" && <Badge variant="outline" className="capitalize bg-muted">{rs}</Badge>}
                    <RecordActions
                      createdBy={i.createdBy}
                      recordStatus={rs}
                      recordLabel="incident"
                      onView={() => setDialog({ open: true, mode: "view", record: i })}
                      onEdit={() => setDialog({ open: true, mode: "edit", record: i })}
                      onArchive={() => { care.archiveIncident(i.id); toast.success("Archived"); }}
                      onRestore={() => { care.restoreIncident(i.id); toast.success("Restored"); }}
                      onDelete={(reason) => care.softDeleteIncident(i.id, reason)}
                      onDuplicate={() => { care.duplicateIncident(i.id); toast.success("Duplicated"); }}
                      extra={
                        <>
                          {i.status !== "closed" && rs === "active" && (
                            <DropdownMenuItem onClick={() => { care.closeIncident(i.id); toast.success("Closed"); }}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-2" />Close
                            </DropdownMenuItem>
                          )}
                          {i.status === "closed" && rs === "active" && (
                            <DropdownMenuItem onClick={() => { care.reopenIncident(i.id); toast.success("Reopened"); }}>
                              <RotateCcw className="h-3.5 w-3.5 mr-2" />Reopen
                            </DropdownMenuItem>
                          )}
                        </>
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-sm text-muted-foreground flex items-center gap-2 p-8 justify-center border rounded-lg">
            <AlertCircle className="h-4 w-4" /> No incidents match these filters.
          </div>
        )}
      </div>

      <IncidentDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog(d => ({ ...d, open: v }))}
        mode={dialog.mode}
        record={dialog.record}
      />
    </div>
  );
}
