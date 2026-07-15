import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCare } from "@/lib/care/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { can } from "@/lib/care/permissions";
import { RecordActions } from "@/components/care/RecordActions";
import { OpsListToolbar } from "@/components/care/OpsListToolbar";
import { VisitorDialog } from "@/components/care/VisitorDialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { Visitor } from "@/lib/care/types";

export const Route = createFileRoute("/visitors")({
  head: () => ({ meta: [{ title: "Visitors — CarePath" }] }),
  component: VisitorsPage,
});

function VisitorsPage() {
  const care = useCare();
  const { visitors, residents, filteredResidentIds, filter, currentRole } = care;
  const [statusTab, setStatusTab] = useState<"active" | "archived" | "deleted">("active");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [workflowStatus, setWorkflowStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; mode: "create" | "edit" | "view"; record?: Visitor }>({ open: false, mode: "create" });

  const counts = useMemo(() => ({
    active: visitors.filter(v => (v.recordStatus || "active") === "active").length,
    archived: visitors.filter(v => v.recordStatus === "archived").length,
    deleted: visitors.filter(v => v.recordStatus === "deleted").length,
  }), [visitors]);

  const filtered = useMemo(() => {
    const filterIds = new Set(filteredResidentIds);
    const q = search.toLowerCase();
    let arr = visitors.filter(v => {
      const rs = v.recordStatus || "active";
      if (rs !== statusTab) return false;
      if ((filter.wingId || filter.residentId) && !filterIds.has(v.residentId)) return false;
      if (workflowStatus !== "all" && v.status !== workflowStatus) return false;
      if (dateFrom && v.date < dateFrom) return false;
      if (dateTo && v.date > dateTo) return false;
      if (q) {
        const r = residents.find(x => x.id === v.residentId);
        const hay = `${v.visitorName} ${v.relationship} ${r?.firstName} ${r?.lastName} ${v.notes || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    arr.sort((a, b) => sort === "date-asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return arr;
  }, [visitors, statusTab, filteredResidentIds, filter, residents, search, sort, workflowStatus, dateFrom, dateTo]);

  if (currentRole === "group_owner") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Visitors is not available for Group Owner users.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visitors</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} shown · {counts.active} active · {counts.archived} archived · {counts.deleted} deleted</p>
        </div>
        {can(currentRole, "visitor.create") && (
          <Button size="sm" onClick={() => setDialog({ open: true, mode: "create" })}><Plus className="h-4 w-4 mr-1" /> Add Visitor</Button>
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
          { value: "scheduled", label: "Scheduled" },
          { value: "checked_in", label: "Checked In" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
        ]}
        counts={counts}
      />

      <div className="space-y-2">
        {filtered.map(v => {
          const r = residents.find(x => x.id === v.residentId);
          const rs = v.recordStatus || "active";
          return (
            <Card key={v.id} className={`hover:shadow-sm ${rs === "deleted" ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{v.visitorName} <span className="text-xs text-muted-foreground">({v.relationship})</span></div>
                    <p className="text-xs text-muted-foreground">
                      Visiting <Link to="/residents/$id" params={{ id: v.residentId }} className="hover:underline">{r?.firstName} {r?.lastName}</Link>
                      {" "}· {v.date} · {v.arrivalTime}{v.departureTime ? `–${v.departureTime}` : " (in)"}
                    </p>
                    {v.notes && <p className="text-sm mt-1">{v.notes}</p>}
                    {v.status === "cancelled" && v.cancelledReason && <p className="text-xs text-destructive mt-1">Cancelled: {v.cancelledReason}</p>}
                    {rs === "deleted" && <p className="text-xs text-destructive mt-1">Deleted by {v.deletedBy} — {v.deletedReason}</p>}
                  </div>
                  <div className="flex gap-1.5 items-center flex-wrap">
                    {v.status && <Badge variant="secondary" className="capitalize">{v.status.replace("_", " ")}</Badge>}
                    {rs !== "active" && <Badge variant="outline" className="capitalize bg-muted">{rs}</Badge>}
                    <RecordActions
                      createdBy={v.createdBy}
                      recordStatus={rs}
                      recordLabel="visitor"
                      onView={() => setDialog({ open: true, mode: "view", record: v })}
                      onEdit={() => setDialog({ open: true, mode: "edit", record: v })}
                      onArchive={() => { care.archiveVisitor(v.id); toast.success("Archived"); }}
                      onRestore={() => { care.restoreVisitor(v.id); toast.success("Restored"); }}
                      onDelete={(reason) => care.softDeleteVisitor(v.id, reason)}
                      extra={
                        rs === "active" && v.status !== "completed" && v.status !== "cancelled" ? (
                          <>
                            <DropdownMenuItem onClick={() => { care.completeVisitor(v.id); toast.success("Visit completed"); }}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-2" />Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const reason = prompt("Reason for cancellation?");
                              if (reason?.trim()) { care.cancelVisitor(v.id, reason.trim()); toast.success("Cancelled"); }
                            }}>
                              <XCircle className="h-3.5 w-3.5 mr-2" />Cancel
                            </DropdownMenuItem>
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
            <AlertCircle className="h-4 w-4" /> No visitors match these filters.
          </div>
        )}
      </div>

      <VisitorDialog
        open={dialog.open}
        onOpenChange={(v) => setDialog(d => ({ ...d, open: v }))}
        mode={dialog.mode}
        record={dialog.record}
      />
    </div>
  );
}
