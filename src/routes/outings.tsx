import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCare } from "@/lib/care/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, LogOut, LogIn, XCircle, CheckCircle2 } from "lucide-react";
import { can } from "@/lib/care/permissions";
import { RecordActions } from "@/components/care/RecordActions";
import { OpsListToolbar } from "@/components/care/OpsListToolbar";
import { OutingDialog } from "@/components/care/OutingDialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { Outing } from "@/lib/care/types";

export const Route = createFileRoute("/outings")({
  head: () => ({ meta: [{ title: "Outings — CarePath" }] }),
  component: OutingsPage,
});

function OutingsPage() {
  const care = useCare();
  const { outings, residents, filteredResidentIds, filter, currentRole } = care;
  const [statusTab, setStatusTab] = useState<"active" | "archived" | "deleted">("active");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [workflowStatus, setWorkflowStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; mode: "create" | "edit" | "view"; record?: Outing }>({ open: false, mode: "create" });

  const counts = useMemo(() => ({
    active: outings.filter(o => (o.recordStatus || "active") === "active").length,
    archived: outings.filter(o => o.recordStatus === "archived").length,
    deleted: outings.filter(o => o.recordStatus === "deleted").length,
  }), [outings]);

  const filtered = useMemo(() => {
    const filterIds = new Set(filteredResidentIds);
    const q = search.toLowerCase();
    let arr = outings.filter(o => {
      const rs = o.recordStatus || "active";
      if (rs !== statusTab) return false;
      if ((filter.wingId || filter.residentId) && !filterIds.has(o.residentId)) return false;
      if (workflowStatus !== "all" && o.status !== workflowStatus) return false;
      if (dateFrom && o.date < dateFrom) return false;
      if (dateTo && o.date > dateTo) return false;
      if (q) {
        const r = residents.find(x => x.id === o.residentId);
        const hay = `${o.destination} ${o.accompaniedBy} ${r?.firstName} ${r?.lastName} ${o.notes || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    arr.sort((a, b) => sort === "date-asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return arr;
  }, [outings, statusTab, filteredResidentIds, filter, residents, search, sort, workflowStatus, dateFrom, dateTo]);

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resident Outings</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} shown · {counts.active} active · {counts.archived} archived · {counts.deleted} deleted</p>
        </div>
        {can(currentRole, "outing.create") && (
          <Button size="sm" onClick={() => setDialog({ open: true, mode: "create" })}><Plus className="h-4 w-4 mr-1" /> Add Outing</Button>
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
          { value: "planned", label: "Planned" },
          { value: "departed", label: "Departed" },
          { value: "returned", label: "Returned" },
          { value: "cancelled", label: "Cancelled" },
          { value: "closed", label: "Closed" },
        ]}
        counts={counts}
      />

      <div className="space-y-2">
        {filtered.map(o => {
          const r = residents.find(x => x.id === o.residentId);
          const rs = o.recordStatus || "active";
          return (
            <Card key={o.id} className={`hover:shadow-sm ${rs === "deleted" ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      <Link to="/residents/$id" params={{ id: o.residentId }} className="hover:underline">{r?.firstName} {r?.lastName}</Link>
                      {" "}→ {o.destination}
                    </div>
                    <p className="text-xs text-muted-foreground">{o.date} · {o.departureTime}–{o.returnTime} · {o.transportMethod} · With {o.accompaniedBy}</p>
                    {o.notes && <p className="text-sm mt-1">{o.notes}</p>}
                    {o.outcomeNotes && <p className="text-xs mt-1"><strong>Outcome:</strong> {o.outcomeNotes}</p>}
                    {o.status === "cancelled" && o.cancelledReason && <p className="text-xs text-destructive mt-1">Cancelled: {o.cancelledReason}</p>}
                    {rs === "deleted" && <p className="text-xs text-destructive mt-1">Deleted by {o.deletedBy} — {o.deletedReason}</p>}
                  </div>
                  <div className="flex gap-1.5 items-center flex-wrap">
                    {o.riskAssessmentCompleted && <Badge variant="outline">Risk Assessed</Badge>}
                    {o.status && <Badge variant="secondary" className="capitalize">{o.status}</Badge>}
                    {rs !== "active" && <Badge variant="outline" className="capitalize bg-muted">{rs}</Badge>}
                    <RecordActions
                      createdBy={o.createdBy}
                      recordStatus={rs}
                      recordLabel="outing"
                      onView={() => setDialog({ open: true, mode: "view", record: o })}
                      onEdit={() => setDialog({ open: true, mode: "edit", record: o })}
                      onArchive={() => { care.archiveOuting(o.id); toast.success("Archived"); }}
                      onRestore={() => { care.restoreOuting(o.id); toast.success("Restored"); }}
                      onDelete={(reason) => care.softDeleteOuting(o.id, reason)}
                      extra={
                        rs === "active" ? (
                          <>
                            {o.status !== "departed" && o.status !== "returned" && o.status !== "closed" && (
                              <DropdownMenuItem onClick={() => {
                                const t = prompt("Departure time (HH:MM)", new Date().toTimeString().slice(0, 5));
                                if (t) { care.recordOutingDeparture(o.id, t); toast.success("Departure recorded"); }
                              }}>
                                <LogOut className="h-3.5 w-3.5 mr-2" />Record Departure
                              </DropdownMenuItem>
                            )}
                            {o.status !== "returned" && o.status !== "closed" && o.status !== "cancelled" && (
                              <DropdownMenuItem onClick={() => {
                                const t = prompt("Return time (HH:MM)", new Date().toTimeString().slice(0, 5));
                                if (!t) return;
                                const notes = prompt("Outcome notes (optional)") || undefined;
                                care.recordOutingReturn(o.id, t, notes); toast.success("Return recorded");
                              }}>
                                <LogIn className="h-3.5 w-3.5 mr-2" />Record Return
                              </DropdownMenuItem>
                            )}
                            {o.status !== "closed" && o.status !== "cancelled" && (
                              <DropdownMenuItem onClick={() => { care.closeOuting(o.id); toast.success("Closed"); }}>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />Close
                              </DropdownMenuItem>
                            )}
                            {o.status !== "cancelled" && o.status !== "closed" && (
                              <DropdownMenuItem onClick={() => {
                                const reason = prompt("Reason for cancellation?");
                                if (reason?.trim()) { care.cancelOuting(o.id, reason.trim()); toast.success("Cancelled"); }
                              }}>
                                <XCircle className="h-3.5 w-3.5 mr-2" />Cancel
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
            <AlertCircle className="h-4 w-4" /> No outings match these filters.
          </div>
        )}
      </div>

      <OutingDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog(d => ({ ...d, open: v }))}
        mode={dialog.mode}
        record={dialog.record}
      />
    </div>
  );
}
