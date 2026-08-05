import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BedDouble, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCare } from "@/lib/care/store";
import type { Bed } from "@/lib/care/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bedBlockers, calculateBedOccupancy } from "@/domain/maintenance/bedOccupancy";
import { loadBedReferenceData } from "@/domain/maintenance/bedReferenceData";
import { BedTypeManagement } from "@/components/maintenance/BedTypeManagement";
const label = (value?: string) =>
  value ? value.replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase()) : "Not recorded";

export function BedManagement() {
  const care = useCare();
  const [search, setSearch] = useState("");
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const [occupancy, setOccupancy] = useState(params.get("occupancy") || "");
  const [operational, setOperational] = useState(params.get("operational") || "");
  const [wingFilter, setWingFilter] = useState(params.get("wing") || "");
  const [bedTypeFilter, setBedTypeFilter] = useState(params.get("bedType") || "");
  const [mattressFilter, setMattressFilter] = useState(params.get("mattressType") || "");
  const [editor, setEditor] = useState<Bed | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bed>();
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [releaseTarget, setReleaseTarget] = useState<{ bed: Bed; residentName: string }>();
  const [releaseReason, setReleaseReason] = useState("");
  const [releaseError, setReleaseError] = useState("");
  const [statusTarget, setStatusTarget] = useState<Bed>();
  const [statusForm, setStatusForm] = useState({ occupancyStatus: "available", operationalStatus: "operational", readinessStatus: "ready", condition: "good", reason: "" });
  const [statusError, setStatusError] = useState("");
  const [capacityOpen, setCapacityOpen] = useState(false);
  const [capacityValue, setCapacityValue] = useState("");
  const [showTypeManagement, setShowTypeManagement] = useState(false);
  const rooms = care.rooms.filter(
    (room) =>
      String(room.facilityId || room.nursingHomeId || care.activeFacilityId) ===
      care.activeFacilityId,
  );
  const roomIds = new Set(rooms.map((room) => String(room.id)));
  const allBeds = care.beds.filter((bed) => roomIds.has(String(bed.roomId)) && bed.active);
  const beds = allBeds
    .filter((bed) => !occupancy || (bed.occupancyStatus || bed.status) === occupancy)
    .filter((bed) => !operational || bed.operationalStatus === operational)
    .filter((bed) => !wingFilter || care.wings.find(w=>w.id===rooms.find(r=>String(r.id)===String(bed.roomId))?.wingId)?.name.toLowerCase()===wingFilter.toLowerCase())
    .filter((bed) => !bedTypeFilter || label(String(bed.bedType)).toLowerCase()===bedTypeFilter.toLowerCase())
    .filter((bed) => !mattressFilter || label(String(bed.mattressType)).toLowerCase()===mattressFilter.toLowerCase())
    .filter((bed) => {
      const room = rooms.find((item) => String(item.id) === String(bed.roomId));
      const resident = care.bedAssignments.find(
        (item) => String(item.bedId) === String(bed.id) && item.status === "active",
      );
      const name = resident
        ? care.residents.find((item) => item.id === resident.residentId)
        : undefined;
      return `${bed.identifier} ${bed.label} ${room?.number} ${care.wings.find((item) => item.id === room?.wingId)?.name} ${bed.bedType} ${bed.mattressType} ${name?.firstName} ${name?.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase());
    });
  const registered =
    care.facilities.find((item) => item.id === care.activeFacilityId)?.bedCapacity || 0;
  const occupancyMetrics = calculateBedOccupancy({ beds: care.beds, assignments: care.bedAssignments, rooms, residents: care.residents, wings: care.wings, workOrders: care.maintenanceWorkOrders, safetyInspections: care.safetyInspections, registeredCapacity: registered });
  const metrics = [
    ["Registered Capacity", registered > 0 ? registered : "Not configured", ""],
    ["Operational Beds", occupancyMetrics.operationalCapacity, ""],
    ["Occupied", occupancyMetrics.occupied, "occupied"],
    ["Available", occupancyMetrics.available, "available"],
    ["Reserved", occupancyMetrics.reserved, "reserved"],
    ["Blocked", occupancyMetrics.blocked, "blocked"],
    ["Under Maintenance", occupancyMetrics.underMaintenance, "under_maintenance"],
    ["Out of Service", occupancyMetrics.outOfService, "out_of_service"],
  ] as const;
  const activeAssignments = care.bedAssignments.filter(a=>a.status==="active"&&!a.endDate&&!a.endDateTime);
  const dataIssues = [
    care.residents.filter(r=>r.status==="active"&&r.roomId&&!activeAssignments.some(a=>a.residentId===r.id)).length > 0 && `${care.residents.filter(r=>r.status==="active"&&r.roomId&&!activeAssignments.some(a=>a.residentId===r.id)).length} residents have a room but no bed assignment`,
    rooms.filter(r=>!r.maximumBedSpaces).length > 0 && `${rooms.filter(r=>!r.maximumBedSpaces).length} rooms have no configured bed-space capacity`,
    new Set(care.beds.map(b=>b.identifier).filter(Boolean)).size !== care.beds.map(b=>b.identifier).filter(Boolean).length && "Duplicate bed identifiers require review",
    care.beds.filter(b=>b.active&&!care.rooms.some(r=>String(r.id)===String(b.roomId))).length > 0 && "Active beds without a managed room must be corrected or archived",
    care.residents.filter(r=>activeAssignments.filter(a=>a.residentId===r.id).length>1).length > 0 && "Residents with multiple active assignments require review",
    care.beds.filter(b=>activeAssignments.filter(a=>String(a.bedId)===String(b.id)).length>1).length > 0 && "Beds with multiple active assignments require review",
  ].filter(Boolean) as string[];
  const canViewDataQuality = care.currentRole === "group_owner" || care.currentRole === "don";
  const canSetCapacity = care.currentRole === "group_owner" || care.currentRole === "don";
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Bed Management</h2>
          <p className="text-base text-muted-foreground">
            Manage bed capacity, availability, room allocation and occupancy.
          </p>
        </div>
        <div className="flex gap-2">
          {canSetCapacity && (
            <Button variant="outline" onClick={() => setShowTypeManagement((current) => !current)}>
              {showTypeManagement ? "Close Type Management" : "Manage Bed & Mattress Types"}
            </Button>
          )}
          <Button onClick={() => setEditor("new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Bed
          </Button>
        </div>
      </header>
      {showTypeManagement && canSetCapacity && <BedTypeManagement />}
      {registered > 0 && registered !== allBeds.length && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-base">
          Registered capacity is {registered}, but {allBeds.length} active bed records currently exist.
        </div>
      )}
      {canViewDataQuality && dataIssues.length > 0 && (
        <details className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium text-muted-foreground">
            Data quality ({dataIssues.length})
          </summary>
          <p className="mt-2 text-xs text-muted-foreground">
            These records require administrator review and are never changed automatically.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {dataIssues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </details>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([title, value, filter]) => (
          <button
            key={title}
            onClick={() => {
              if (title === "Registered Capacity" && canSetCapacity) {
                setCapacityValue(registered > 0 ? String(registered) : "");
                setCapacityOpen(true);
                return;
              }
              if (filter)
                filter === "blocked" || filter === "under_maintenance" || filter === "out_of_service"
                  ? setOperational(filter)
                  : setOccupancy(filter);
            }}
            className="rounded-xl border bg-white p-4 text-left focus:ring-2 focus:ring-primary"
          >
            <div className="text-base text-muted-foreground">{title}</div>
            <div className="mt-2 text-3xl font-semibold">{value}</div>
            {title === "Registered Capacity" && canSetCapacity && (
              <div className="mt-2 text-xs font-medium text-primary">Set registered capacity</div>
            )}
          </button>
        ))}
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bed, room, wing, type or resident"
              />
            </div>
            <Select
              value={occupancy}
              onChange={setOccupancy}
              options={["available", "occupied", "reserved", "temporarily_unavailable"]}
              placeholder="All occupancy statuses"
            />
            <Select
              value={operational}
              onChange={setOperational}
              options={[
                "operational",
                "restricted_use",
                "under_maintenance",
                "blocked",
                "out_of_service",
                "replacement_due",
              ]}
              placeholder="All operational statuses"
            />
            <Select value={wingFilter} onChange={setWingFilter} options={care.wings.map(w=>w.name)} placeholder="All wings" />
            <Select value={bedTypeFilter} onChange={setBedTypeFilter} options={loadBedReferenceData().bedTypes.map(x=>x.name)} placeholder="All bed types" />
            <Select value={mattressFilter} onChange={setMattressFilter} options={loadBedReferenceData().mattressTypes.map(x=>x.name)} placeholder="All mattress types" />
          </div>
          <div className="divide-y overflow-hidden rounded-lg border">
            {beds.map((bed) => {
              const room = rooms.find((item) => String(item.id) === String(bed.roomId));
              const assignment = care.bedAssignments.find(
                (item) => String(item.bedId) === String(bed.id) && item.status === "active",
              );
              const resident = care.residents.find((item) => item.id === assignment?.residentId);
              const blockers = bedBlockers(bed, room, care.maintenanceWorkOrders);
              return (
                <div key={String(bed.id)} className="p-3 text-sm transition-colors hover:bg-muted/20">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{bed.identifier || bed.label}</div>
                      <div className="text-xs text-muted-foreground">
                        Room {room?.number} · {bed.label}
                      </div>
                    </div>
                    <Badge>{label(bed.occupancyStatus || bed.status)}</Badge>
                  </div>
                  <div className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-3 xl:grid-cols-6">
                    <span><span className="text-muted-foreground">Bed type:</span> {label(String(bed.bedType))}</span>
                    <span><span className="text-muted-foreground">Mattress:</span> {label(String(bed.mattressType))}</span>
                    <span><span className="text-muted-foreground">Operational:</span> {label(bed.operationalStatus)}</span>
                    <span><span className="text-muted-foreground">Readiness:</span> {label(bed.readinessStatus)}</span>
                    <span><span className="text-muted-foreground">Condition:</span> {label(bed.condition)}</span>
                    <span><span className="text-muted-foreground">Resident:</span> {resident ? `${resident.firstName} ${resident.lastName}` : "None"}</span>
                  </div>
                  <div className="mt-3 rounded-md border bg-muted/30 p-2.5">
                    <div className="mb-2 text-xs font-semibold text-foreground">
                      Actions for {bed.identifier || bed.label}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button size="sm" variant="outline" asChild><Link to="/maintenance/beds/$bedId" params={{bedId:String(bed.id)}}>Open profile</Link></Button>
                      <Button size="sm" variant="outline" onClick={() => setEditor(bed)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit details
                      </Button>
                      {canSetCapacity && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setStatusTarget(bed);
                            setStatusForm({
                              occupancyStatus: bed.occupancyStatus || bed.status || "available",
                              operationalStatus: bed.operationalStatus || "operational",
                              readinessStatus: bed.readinessStatus || "not_checked",
                              condition: bed.condition || "unknown",
                              reason: "",
                            });
                            setStatusError("");
                          }}
                        >
                          Change status
                        </Button>
                      )}
                      {assignment && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReleaseTarget({
                              bed,
                              residentName: resident ? `${resident.firstName} ${resident.lastName}` : "the current resident",
                            });
                            setReleaseReason("");
                            setReleaseError("");
                          }}
                        >
                          Release resident
                        </Button>
                      )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-auto border-red-200 text-destructive hover:bg-red-50 hover:text-destructive"
                      onClick={() => {
                        setDeleteTarget(bed);
                        setDeleteReason("");
                        setDeleteError("");
                      }}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete bed
                    </Button>
                    </div>
                  </div>
                  {blockers.length > 0 && <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm"><strong>Not assignable:</strong> {blockers.join(" · ")}</div>}
                </div>
              );
            })}
          </div>
          {!beds.length && (
            <div className="py-10 text-center text-base text-muted-foreground">
              No beds match the current filters. Add a bed to start the managed inventory.
            </div>
          )}
        </CardContent>
      </Card>
      <BedDialog
        open={Boolean(editor)}
        bed={editor === "new" ? undefined : editor || undefined}
        rooms={rooms}
        onOpenChange={(open) => !open && setEditor(null)}
      />
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete bed</DialogTitle>
            <DialogDescription>
              Remove {deleteTarget?.identifier || deleteTarget?.label} from active bed management. This action is recorded in the audit history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Reason for deletion *">
              <Input
                value={deleteReason}
                onChange={(event) => {
                  setDeleteReason(event.target.value);
                  setDeleteError("");
                }}
                placeholder="For example: bed permanently removed"
              />
            </Field>
            {deleteError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {deleteError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(undefined)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!deleteReason.trim()}
              onClick={() => {
                if (!deleteTarget) return;
                try {
                  care.deleteMaintenanceBed(String(deleteTarget.id), deleteReason);
                  toast.success("Bed deleted.");
                  setDeleteTarget(undefined);
                } catch (error) {
                  setDeleteError(error instanceof Error ? error.message : "Unable to delete bed.");
                }
              }}
            >
              Delete Bed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={capacityOpen} onOpenChange={setCapacityOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set registered capacity</DialogTitle>
            <DialogDescription>
              Enter the officially registered resident-bed capacity for this Nursing Home. This is kept separate from active and operational bed records.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="registered-capacity">Total registered resident beds</Label>
            <Input
              id="registered-capacity"
              className="mt-1"
              type="number"
              min="0"
              step="1"
              value={capacityValue}
              onChange={(event) => setCapacityValue(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCapacityOpen(false)}>Cancel</Button>
            <Button
              disabled={capacityValue === "" || Number(capacityValue) < 0}
              onClick={() => {
                try {
                  care.updateFacilityBedCapacity(care.activeFacilityId, Number(capacityValue));
                  toast.success("Registered capacity updated.");
                  setCapacityOpen(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to update capacity.");
                }
              }}
            >
              Save capacity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(releaseTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setReleaseTarget(undefined);
            setReleaseReason("");
            setReleaseError("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Release resident from bed</DialogTitle>
            <DialogDescription>
              End {releaseTarget?.residentName}&apos;s assignment to {releaseTarget?.bed.identifier || releaseTarget?.bed.label}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              The bed will become temporarily unavailable and its readiness status will change to Cleaning Required. It cannot be assigned again until cleaning and readiness checks pass.
            </div>
            <Field label="Reason for release *">
              <textarea
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={releaseReason}
                onChange={(event) => {
                  setReleaseReason(event.target.value);
                  setReleaseError("");
                }}
                placeholder="For example: internal transfer, discharge or bed taken out of service"
              />
            </Field>
            {releaseError && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{releaseError}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseTarget(undefined)}>Cancel</Button>
            <Button
              disabled={!releaseReason.trim()}
              onClick={() => {
                if (!releaseTarget) return;
                try {
                  care.releaseMaintenanceBed(String(releaseTarget.bed.id), releaseReason.trim(), new Date().toISOString());
                  toast.success("Resident released. Bed cleaning is now required.");
                  setReleaseTarget(undefined);
                } catch (error) {
                  setReleaseError(error instanceof Error ? error.message : "Unable to release resident from this bed.");
                }
              }}
            >
              Confirm release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(statusTarget)} onOpenChange={(open) => !open && setStatusTarget(undefined)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change bed status</DialogTitle>
            <DialogDescription>
              Update {statusTarget?.identifier || statusTarget?.label}. Unsafe combinations and changes that conflict with a resident assignment will be blocked.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Occupancy status">
              <Select value={statusForm.occupancyStatus} onChange={(occupancyStatus) => setStatusForm({ ...statusForm, occupancyStatus })} options={["available", "occupied", "reserved", "temporarily_unavailable"]} />
            </Field>
            <Field label="Operational status">
              <Select value={statusForm.operationalStatus} onChange={(operationalStatus) => setStatusForm({ ...statusForm, operationalStatus })} options={["operational", "restricted_use", "under_maintenance", "blocked", "out_of_service", "replacement_due"]} />
            </Field>
            <Field label="Readiness status">
              <Select value={statusForm.readinessStatus} onChange={(readinessStatus) => setStatusForm({ ...statusForm, readinessStatus })} options={["not_checked", "cleaning_required", "cleaning_in_progress", "awaiting_inspection", "ready", "failed", "reinspection_required"]} />
            </Field>
            <Field label="Condition">
              <Select value={statusForm.condition} onChange={(condition) => setStatusForm({ ...statusForm, condition })} options={["excellent", "good", "fair", "poor", "unserviceable", "unknown"]} />
            </Field>
          </div>
          <Field label="Reason for status change *">
            <textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={statusForm.reason} onChange={(event) => { setStatusForm({ ...statusForm, reason: event.target.value }); setStatusError(""); }} placeholder="Explain why this bed status is changing" />
          </Field>
          {statusForm.occupancyStatus === "available" && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">Available requires Operational status, Ready readiness, a serviceable condition, an operational room, and no maintenance, inspection, cleaning or verification blockers.</div>
          )}
          {statusError && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{statusError}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusTarget(undefined)}>Cancel</Button>
            <Button
              disabled={!statusForm.reason.trim()}
              onClick={() => {
                if (!statusTarget) return;
                try {
                  care.updateMaintenanceBed(String(statusTarget.id), {
                    occupancyStatus: statusForm.occupancyStatus as any,
                    status: (statusForm.occupancyStatus === "temporarily_unavailable" ? "out_of_service" : statusForm.occupancyStatus) as any,
                    operationalStatus: statusForm.operationalStatus as any,
                    readinessStatus: statusForm.readinessStatus as any,
                    condition: statusForm.condition as any,
                    restrictionReason: statusForm.occupancyStatus === "available" ? undefined : statusForm.reason.trim(),
                  }, statusTarget.version);
                  toast.success("Bed status updated.");
                  setStatusTarget(undefined);
                } catch (error) {
                  setStatusError(error instanceof Error ? error.message : "Unable to update bed status.");
                }
              }}
            >
              Save status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BedDialog({
  open,
  bed,
  rooms,
  onOpenChange,
}: {
  open: boolean;
  bed?: Bed;
  rooms: any[];
  onOpenChange: (open: boolean) => void;
}) {
  const care = useCare();
  const reference = loadBedReferenceData();
  const [form, setForm] = useState({
    roomId: "",
    label: "Bed A",
    identifier: "",
    bedType: "standard",
    mattressType: "foam",
  });
  useEffect(() => {
    if (!open) return;
    setForm({
      roomId: bed ? String(bed.roomId) : "",
      label: bed?.label || "Bed A",
      identifier: bed?.identifier || "",
      bedType: String(bed?.bedType || "standard"),
      mattressType: String(bed?.mattressType || "foam"),
    });
  }, [open, bed]);
  const save = () => {
    try {
      if (bed) care.updateMaintenanceBed(String(bed.id), { ...form, roomId: form.roomId as any }, bed.version);
      else care.createMaintenanceBed({ ...form, roomId: form.roomId as any });
      toast.success(bed ? "Bed updated." : "Bed created.");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to create bed.");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bed ? "Edit Bed" : "Add Bed"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Managed Room *">
            <Select
              value={form.roomId}
              onChange={(roomId) => setForm({ ...form, roomId })}
              options={rooms.map((r) => String(r.id))}
              labels={Object.fromEntries(rooms.map((r) => [String(r.id), `Room ${r.number}`]))}
            />
          </Field>
          <Field label="Bed Space Label *">
            <Input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </Field>
          <Field label="Bed Identifier">
            <Input
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              placeholder="Generated if left blank"
            />
          </Field>
          <Field label="Bed Type">
            <Select
              value={form.bedType}
              onChange={(bedType) => setForm({ ...form, bedType })}
              options={reference.bedTypes.filter(x=>x.active).sort((a,b)=>a.displayOrder-b.displayOrder).map(x=>x.id)}
              labels={Object.fromEntries(reference.bedTypes.map(x=>[x.id,x.name]))}
            />
          </Field>
          <Field label="Mattress Type">
            <Select
              value={form.mattressType}
              onChange={(mattressType) => setForm({ ...form, mattressType })}
              options={reference.mattressTypes.filter(x=>x.active).sort((a,b)=>a.displayOrder-b.displayOrder).map(x=>x.id)}
              labels={Object.fromEntries(reference.mattressTypes.map(x=>[x.id,x.name]))}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!form.roomId || !form.label.trim()} onClick={save}>
            {bed ? "Save Changes" : "Add Bed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-base font-medium">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
function Select({
  value,
  onChange,
  options,
  placeholder = "Select",
  labels = {},
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  labels?: Record<string, string>;
}) {
  return (
    <select
      className="h-11 w-full rounded-md border bg-background px-3 text-base"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((v) => (
        <option key={v} value={v}>
          {labels[v] || label(v)}
        </option>
      ))}
    </select>
  );
}
