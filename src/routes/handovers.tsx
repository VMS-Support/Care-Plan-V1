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
import { generatedHandoverRepository } from "@/lib/care/generatedHandovers";

export const Route = createFileRoute("/handovers")({
  head: () => ({ meta: [{ title: "Handovers — CarePath" }] }),
  component: HandoversPage,
});

function HandoversPage() {
  const care = useCare();
  const { residents, filteredResidentIds, filter, currentRole, getHandoversForContext } = care;
  const [statusTab, setStatusTab] = useState<"active" | "archived" | "deleted">("active");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [workflowStatus, setWorkflowStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generatedStatus, setGeneratedStatus] = useState("all");
  const [generatedShift, setGeneratedShift] = useState("all");
  const [generatedSearch, setGeneratedSearch] = useState("");
  const [generatedDateFrom, setGeneratedDateFrom] = useState("");
  const [generatedDateTo, setGeneratedDateTo] = useState("");
  const [generatedArchive, setGeneratedArchive] = useState<"active" | "include" | "archived">(
    "active",
  );
  const [includeVersions, setIncludeVersions] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: "create" | "edit" | "view";
    record?: HandoverNote;
  }>({ open: false, mode: "create" });
  const allGeneratedHandovers = generatedHandoverRepository.list();
  const visibleGeneratedHandovers = allGeneratedHandovers.filter((handover) => {
    if (generatedArchive === "active" && handover.archived) return false;
    if (generatedArchive === "archived" && !handover.archived) return false;
    if (!includeVersions && generatedStatus !== "superseded" && handover.status === "superseded")
      return false;
    if (generatedStatus !== "all" && handover.status !== generatedStatus) return false;
    if (generatedShift !== "all" && handover.shiftType !== generatedShift) return false;
    if (
      generatedSearch &&
      !`${handover.referenceNumber} ${handover.nursingHomeName} ${handover.generatedByName} ${handover.sections.map((section) => section.residentName).join(" ")}`
        .toLowerCase()
        .includes(generatedSearch.toLowerCase())
    )
      return false;
    if (generatedDateFrom && handover.periodFrom.slice(0, 10) < generatedDateFrom) return false;
    if (generatedDateTo && handover.periodFrom.slice(0, 10) > generatedDateTo) return false;
    return true;
  });

  const contextHandovers = useMemo(() => getHandoversForContext(), [getHandoversForContext]);

  const counts = useMemo(
    () => ({
      active: contextHandovers.filter((h) => (h.recordStatus || "active") === "active").length,
      archived: contextHandovers.filter((h) => h.recordStatus === "archived").length,
      deleted: contextHandovers.filter((h) => h.recordStatus === "deleted").length,
    }),
    [contextHandovers],
  );

  const filtered = useMemo(() => {
    const filterIds = new Set(filteredResidentIds);
    const q = search.toLowerCase();
    const arr = contextHandovers.filter((h) => {
      const rs = h.recordStatus || "active";
      if (rs !== statusTab) return false;
      if ((filter.wingId || filter.residentId) && !filterIds.has(h.residentId)) return false;
      if (workflowStatus !== "all" && h.status !== workflowStatus) return false;
      if (dateFrom && h.date < dateFrom) return false;
      if (dateTo && h.date > dateTo) return false;
      if (q) {
        const r = residents.find((x) => x.id === h.residentId);
        const hay =
          `${h.shift} ${h.staff} ${h.summary} ${h.outstandingActions} ${r?.firstName} ${r?.lastName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    arr.sort((a, b) =>
      sort === "date-asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date),
    );
    return arr;
  }, [
    contextHandovers,
    statusTab,
    filteredResidentIds,
    filter,
    residents,
    search,
    sort,
    workflowStatus,
    dateFrom,
    dateTo,
  ]);

  return (
    <div className="p-4 md:p-8 flex flex-col gap-4 max-w-6xl">
      <div className="order-0 flex items-center justify-between flex-wrap gap-2 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shift Handovers</h1>
          <p className="text-sm text-muted-foreground">
            Manual notes: {filtered.length} shown · {counts.active} active · {counts.archived}{" "}
            archived · {counts.deleted} deleted
          </p>
        </div>
        {can(currentRole, "handover.create") && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialog({ open: true, mode: "create" })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Manual Handover Note
            </Button>
            <Button size="sm" asChild>
              <Link to="/handovers/generate">
                <Plus className="h-4 w-4 mr-1" /> Generate Handover
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="order-1">
        <p className="mb-2 text-sm font-medium">Manual Handover Note Filters</p>
        <OpsListToolbar
          search={search}
          setSearch={setSearch}
          statusTab={statusTab}
          setStatusTab={setStatusTab}
          sort={sort}
          setSort={setSort}
          sortOptions={[
            { value: "date-desc", label: "Newest First" },
            { value: "date-asc", label: "Oldest First" },
          ]}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          workflowStatus={workflowStatus}
          setWorkflowStatus={setWorkflowStatus}
          workflowOptions={[
            { value: "open", label: "Open" },
            { value: "acknowledged", label: "Acknowledged" },
            { value: "completed", label: "Completed" },
            { value: "closed", label: "Closed" },
          ]}
          counts={counts}
        />
      </div>

      <div className="order-2 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold">Generated Shift Handovers</h2>
          <div className="flex gap-2 flex-wrap">
            <input
              aria-label="Search generated handovers"
              placeholder="Search generated handovers"
              className="h-9 min-w-52 rounded-md border bg-background px-3 text-sm"
              value={generatedSearch}
              onChange={(event) => setGeneratedSearch(event.target.value)}
            />
            <input
              aria-label="Generated handovers from date"
              type="date"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={generatedDateFrom}
              onChange={(event) => setGeneratedDateFrom(event.target.value)}
            />
            <input
              aria-label="Generated handovers to date"
              type="date"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={generatedDateTo}
              onChange={(event) => setGeneratedDateTo(event.target.value)}
            />
            <select
              aria-label="Generated handover status"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={generatedStatus}
              onChange={(event) => setGeneratedStatus(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="finalised">Finalised</option>
              <option value="superseded">Superseded</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              aria-label="Generated handover shift"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={generatedShift}
              onChange={(event) => setGeneratedShift(event.target.value)}
            >
              <option value="all">All shifts</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="night">Night</option>
              <option value="custom">Custom</option>
            </select>
            <label className="flex items-center gap-2 text-sm border rounded-md px-3">
              <input
                type="checkbox"
                checked={includeVersions}
                onChange={(event) => setIncludeVersions(event.target.checked)}
              />
              All versions
            </label>
            <select
              aria-label="Generated handover archive filter"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={generatedArchive}
              onChange={(event) =>
                setGeneratedArchive(event.target.value as "active" | "include" | "archived")
              }
            >
              <option value="active">Active only</option>
              <option value="include">Include archived</option>
              <option value="archived">Archived only</option>
            </select>
          </div>
        </div>
        {visibleGeneratedHandovers.map((handover) => (
          <Card key={handover.id}>
            <CardContent className="p-4 flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="font-medium capitalize">
                  {handover.shiftType} Handover{" "}
                  <span className="text-muted-foreground">
                    · {handover.referenceNumber} · v{handover.versionNumber}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(handover.periodFrom).toLocaleDateString("en-IE", {
                    dateStyle: "medium",
                  })}{" "}
                  ·{" "}
                  {new Date(handover.periodFrom).toLocaleTimeString("en-IE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  –
                  {new Date(handover.periodTo).toLocaleTimeString("en-IE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {handover.nursingHomeName}
                  {handover.wingName ? ` · ${handover.wingName}` : ""}
                </p>
                <p className="text-sm mt-1">
                  Generated by {handover.generatedByName} · {handover.residentCount} resident
                  {handover.residentCount === 1 ? "" : "s"} · PDF available on demand
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <Badge
                  className="capitalize"
                  variant={handover.status === "finalised" ? "default" : "secondary"}
                >
                  {handover.status}
                </Badge>
                {handover.archived && <Badge variant="outline">Archived</Badge>}
                <Button size="sm" variant="outline" asChild>
                  <Link to="/handovers/generated/$handoverId" params={{ handoverId: handover.id }}>
                    {handover.status === "draft" ? "Continue Editing" : "View Handover"}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!visibleGeneratedHandovers.length && (
          <p className="text-sm text-muted-foreground border rounded-md p-6 text-center">
            No generated handovers match these filters.
          </p>
        )}
      </div>

      <div className="order-3 space-y-2">
        <h2 className="font-semibold">Manual Handover Notes</h2>
        {filtered.map((h) => {
          const r = residents.find((x) => x.id === h.residentId);
          const rs = h.recordStatus || "active";
          return (
            <Card
              key={h.id}
              className={`hover:shadow-sm ${rs === "deleted" ? "opacity-60" : h.status === "acknowledged" || h.status === "completed" || h.status === "closed" ? "opacity-90" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      <Link
                        to="/residents/$id"
                        params={{ id: h.residentId }}
                        className="hover:underline"
                      >
                        {r?.firstName} {r?.lastName}
                      </Link>{" "}
                      — Room {r?.roomNumber}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {h.date} · {h.staff}
                      {h.acknowledgedBy
                        ? ` · ack by ${h.acknowledgedBy} at ${h.acknowledgedAt?.slice(11, 16)}`
                        : ""}
                      {h.completedBy ? ` · completed by ${h.completedBy}` : ""}
                      {h.closedBy ? ` · closed by ${h.closedBy}` : ""}
                    </p>
                    <p className="text-sm mt-1">{h.summary}</p>
                    {h.outstandingActions && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <strong>Outstanding:</strong> {h.outstandingActions}
                      </p>
                    )}
                    {rs === "deleted" && (
                      <p className="text-xs text-destructive mt-1">
                        Deleted by {h.deletedBy} — {h.deletedReason}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 items-center flex-wrap">
                    {h.priority && (
                      <Badge variant="outline" className="capitalize">
                        {h.priority}
                      </Badge>
                    )}
                    <Badge variant="outline" className="capitalize">
                      {h.shift}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {h.status || "open"}
                    </Badge>
                    {rs !== "active" && (
                      <Badge variant="outline" className="capitalize bg-muted">
                        {rs}
                      </Badge>
                    )}
                    {rs === "active" && h.status === "open" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          care.acknowledgeHandover(h.id);
                          toast.success("Acknowledged");
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Acknowledge
                      </Button>
                    )}
                    <RecordActions
                      createdBy={h.createdBy}
                      recordStatus={rs}
                      recordLabel="handover"
                      onView={() => setDialog({ open: true, mode: "view", record: h })}
                      onEdit={() => setDialog({ open: true, mode: "edit", record: h })}
                      onArchive={() => {
                        care.archiveHandover(h.id);
                        toast.success("Archived");
                      }}
                      onRestore={() => {
                        care.restoreHandover(h.id);
                        toast.success("Restored");
                      }}
                      onDelete={(reason) => care.softDeleteHandover(h.id, reason)}
                      onDuplicate={() => {
                        care.duplicateHandover(h.id);
                        toast.success("Duplicated");
                      }}
                      extra={
                        rs === "active" ? (
                          <>
                            {h.status === "acknowledged" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  care.completeHandover(h.id);
                                  toast.success("Completed");
                                }}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                Mark Complete
                              </DropdownMenuItem>
                            )}
                            {h.status !== "closed" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  care.closeHandover(h.id);
                                  toast.success("Closed");
                                }}
                              >
                                <Lock className="h-3.5 w-3.5 mr-2" />
                                Close
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
        onOpenChange={(v) => setDialog((d) => ({ ...d, open: v }))}
        mode={dialog.mode}
        record={dialog.record}
      />
    </div>
  );
}
