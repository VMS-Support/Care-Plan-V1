import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCare } from "@/lib/care/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Plus, AlertCircle, Lock } from "lucide-react";
import { can } from "@/lib/care/permissions";
import { RecordActions } from "@/components/care/RecordActions";
import { OpsListToolbar } from "@/components/care/OpsListToolbar";
import { HandoverDialog } from "@/components/care/HandoverDialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { HandoverNote } from "@/lib/care/types";

export const Route = createFileRoute("/handovers")({
  head: () => ({ meta: [{ title: "Handovers — CarePath" }] }),
  component: HandoversPage,
});

function HandoversPage() {
  const care = useCare();
  const { handovers, residents, filteredResidentIds, filter, currentRole, getHandoversForOperationalContext } = care;
  const [statusTab, setStatusTab] = useState<"active" | "archived" | "deleted">("active");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [workflowStatus, setWorkflowStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; mode: "create" | "edit" | "view"; record?: HandoverNote }>({ open: false, mode: "create" });

  const contextHandovers = useMemo(
    () => getHandoversForOperationalContext({ mode: statusTab === "active" ? "active" : "history" }).map((row) => row.handover),
    [getHandoversForOperationalContext, statusTab],
  );

  const counts = useMemo(() => ({
    active: getHandoversForOperationalContext({ mode: "active" }).length,
    archived: handovers.filter(h => h.recordStatus === "archived").length,
    deleted: handovers.filter(h => h.recordStatus === "deleted").length,
  }), [getHandoversForOperationalContext, handovers]);

  const filtered = useMemo(() => {
    const filterIds = new Set(filteredResidentIds);
    const q = search.toLowerCase();
    let arr = contextHandovers.filter(h => {
      const rs = h.recordStatus || "active";
      if (rs !== statusTab) return false;
      if ((filter.wingId || filter.residentId) && !filterIds.has(h.residentId)) return false;
      if (workflowStatus !== "all" && h.status !== workflowStatus) return false;
      if (dateFrom && h.date < dateFrom) return false;
      if (dateTo && h.date > dateTo) return false;
      if (q) {
        const r = residents.find(x => x.id === h.residentId);
        const hay = `${h.shift} ${h.staff} ${h.summary} ${h.outstandingActions} ${r?.firstName} ${r?.lastName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    arr.sort((a, b) => sort === "date-asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return arr;
  }, [contextHandovers, statusTab, filteredResidentIds, filter, residents, search, sort, workflowStatus, dateFrom, dateTo]);

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shift Handovers</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} shown · {counts.active} active · {counts.archived} archived · {counts.deleted} deleted</p>
        </div>
        {can(currentRole, "handover.create") && (
          <Button size="sm" onClick={() => setDialog({ open: true, mode: "create" })}><Plus className="h-4 w-4 mr-1" /> New Handover</Button>
        )}
      </div>

      <OpsListToolbar
        search={search} setSearch={setSearch}
        statusTab={statusTab} setStatusTab={setStatusTab}
        sort={sort} setSort={setSort}
        sortOptions={[{ value: "date-desc", label: "Newest First" }, { value: "date-asc", label: "Oldest First" }]}
        dateFrom={dateFrom} setDateFrom={setDateFrom}
        dateTo={dateTo} setDateTo={setDateTo}
        workflowStatus={workflowStatus} setWorkflowStatus={setWorkflowStatus}
        workflowOptions={[
          { value: "open", label: "Open" },
          { value: "acknowledged", label: "Acknowledged" },
          { value: "completed", label: "Completed" },
          { value: "closed", label: "Closed" },
        ]}
        counts={counts}
      />

      <div className="space-y-2">
        {filtered.map(h => {
          const r = residents.find(x => x.id === h.residentId);
          const rs = h.recordStatus || "active";
          return (
            <Card key={h.id} className={`hover:shadow-sm ${rs === "deleted" ? "opacity-60" : h.status === "acknowledged" || h.status === "completed" || h.status === "closed" ? "opacity-90" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      <Link to="/residents/$id" params={{ id: h.residentId }} className="hover:underline">{r?.firstName} {r?.lastName}</Link>
                      {" "}— Room {r?.roomNumber}
                    </div>
                    <p className="text-xs text-muted-foreground">{h.date} · {h.staff}{h.acknowledgedBy ? ` · ack by ${h.acknowledgedBy} at ${h.acknowledgedAt?.slice(11, 16)}` : ""}{h.completedBy ? ` · completed by ${h.completedBy}` : ""}{h.closedBy ? ` · closed by ${h.closedBy}` : ""}</p>
                    <p className="text-sm mt-1">{h.summary}</p>
                    {h.outstandingActions && <p className="text-xs text-muted-foreground mt-1"><strong>Outstanding:</strong> {h.outstandingActions}</p>}
                    {rs === "deleted" && <p className="text-xs text-destructive mt-1">Deleted by {h.deletedBy} — {h.deletedReason}</p>}
                  </div>
                  <div className="flex gap-1.5 items-center flex-wrap">
                    {h.priority && <Badge variant="outline" className="capitalize">{h.priority}</Badge>}
                    <Badge variant="outline" className="capitalize">{h.shift}</Badge>
                    <Badge variant="secondary" className="capitalize">{h.status || "open"}</Badge>
                    {rs !== "active" && <Badge variant="outline" className="capitalize bg-muted">{rs}</Badge>}
                    {rs === "active" && h.status === "open" && (
                      <Button size="sm" variant="outline" onClick={() => { care.acknowledgeHandover(h.id); toast.success("Acknowledged"); }}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Acknowledge
                      </Button>
                    )}
                    <RecordActions
                      createdBy={h.createdBy}
                      recordStatus={rs}
                      recordLabel="handover"
                      onView={() => setDialog({ open: true, mode: "view", record: h })}
                      onEdit={() => setDialog({ open: true, mode: "edit", record: h })}
                      onArchive={() => { care.archiveHandover(h.id); toast.success("Archived"); }}
                      onRestore={() => { care.restoreHandover(h.id); toast.success("Restored"); }}
                      onDelete={(reason) => care.softDeleteHandover(h.id, reason)}
                      onDuplicate={() => { care.duplicateHandover(h.id); toast.success("Duplicated"); }}
                      extra={
                        rs === "active" ? (
                          <>
                            {h.status === "acknowledged" && (
                              <DropdownMenuItem onClick={() => { care.completeHandover(h.id); toast.success("Completed"); }}>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />Mark Complete
                              </DropdownMenuItem>
                            )}
                            {h.status !== "closed" && (
                              <DropdownMenuItem onClick={() => { care.closeHandover(h.id); toast.success("Closed"); }}>
                                <Lock className="h-3.5 w-3.5 mr-2" />Close
                              </DropdownMenuItem>
                            )}
                          </>
                        ) : undefined
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
            <AlertCircle className="h-4 w-4" /> No handovers match these filters.
          </div>
        )}
      </div>

      <HandoverDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog(d => ({ ...d, open: v }))}
        mode={dialog.mode}
        record={dialog.record}
      />
    </div>
  );
}
