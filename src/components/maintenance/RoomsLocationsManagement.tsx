import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Building2, CircleAlert, ClipboardList, MapPin, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useCare } from "@/lib/care/store";
import type { Room } from "@/lib/care/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { canAssignBed } from "@/domain/maintenance/bedOccupancy";
import { Textarea } from "@/components/ui/textarea";

const stateClass = (value?: string) =>
  value === "READY" || value === "OCCUPIED"
    ? "bg-emerald-100 text-emerald-800"
    : value === "UNAVAILABLE"
      ? "bg-red-100 text-red-800"
      : "bg-amber-100 text-amber-800";
const title = (room: Room) => room.name || `Room ${room.roomNumber || room.number}`;

export function RoomsLocationsManagement() {
  const care = useCare();
  const [search, setSearch] = useState("");
  const [wing, setWing] = useState("");
  const [editor, setEditor] = useState<Room | "new" | null>(null);
  const [statusChange, setStatusChange] = useState<{ room: Room; available: boolean } | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusError, setStatusError] = useState("");
  const rooms = useMemo(
    () =>
      care.rooms
        .filter(
          (room) =>
            String(room.facilityId || room.nursingHomeId || care.activeFacilityId) ===
            care.activeFacilityId,
        )
        .filter((room) => !wing || room.wingId === wing)
        .filter(
          (room) =>
            !search ||
            `${title(room)} ${room.number} ${room.notes || ""}`
              .toLowerCase()
              .includes(search.trim().toLowerCase()),
        ),
    [care, wing, search],
  );
  const readiness = (id: string) =>
    care.housekeepingRoomReadiness.find((item) => item.roomId === id);
  const openOrders = (id: string) =>
    care.maintenanceWorkOrders.filter(
      (item) =>
        String(item.roomId) === id && !["COMPLETED", "CANCELLED", "CLOSED"].includes(item.status),
    ).length;
  const mark = (room: Room, available: boolean) => {
    setStatusReason("");
    setStatusError("");
    setStatusChange({ room, available });
  };
  const confirmStatusChange = () => {
    if (!statusChange) return;
    const reason = statusReason.trim();
    if (!reason) {
      setStatusError("Please provide a reason for this status change.");
      return;
    }
    try {
      statusChange.available
        ? care.markRoomReady(String(statusChange.room.id), reason)
        : care.markRoomUnavailable(String(statusChange.room.id), reason);
      toast.success(`Room marked ${statusChange.available ? "ready" : "unavailable"}.`);
      setStatusChange(null);
      setStatusReason("");
      setStatusError("");
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Unable to update room status.");
    }
  };
  const total = rooms.length,
    blocked = rooms.filter((room) => {
      const status = readiness(String(room.id))?.readinessStatus;
      return status && !["READY", "OCCUPIED"].includes(status);
    }).length,
    alerts = rooms.filter((room) => openOrders(String(room.id)) > 0).length;
  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Maintenance / Rooms & Locations</div>
          <h1 className="text-2xl font-semibold">Rooms & Locations</h1>
          <p className="text-sm text-muted-foreground">
            Maintain room records and see live readiness and maintenance blockers.
          </p>
        </div>
        <Button onClick={() => setEditor("new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add room
        </Button>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric icon={Building2} label="Rooms in scope" value={total} />
        <Metric icon={CircleAlert} label="Readiness blocked" value={blocked} tone="red" />
        <Metric icon={ClipboardList} label="Open maintenance issues" value={alerts} tone="amber" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="relative min-w-60 flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search room number, name or notes"
              />
            </div>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={wing}
              onChange={(event) => setWing(event.target.value)}
            >
              <option value="">All wings</option>
              {care.wings.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  {[
                    "Room / location",
                    "Wing",
                    "Type",
                    "Readiness",
                    "Open work orders",
                    "Notes",
                    "Actions",
                  ].map((x) => (
                    <th key={x} className="p-3">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => {
                  const state = readiness(String(room.id));
                  const roomBeds = care.beds.filter(
                    (bed) => String(bed.roomId) === String(room.id) && bed.active,
                  );
                  const occupiedBeds = roomBeds.filter((bed) =>
                    care.bedAssignments.some(
                      (assignment) =>
                        String(assignment.bedId) === String(bed.id) &&
                        assignment.status === "active" &&
                        !assignment.endDate &&
                        !assignment.endDateTime,
                    ),
                  );
                  const availableBeds = roomBeds.filter((bed) =>
                    canAssignBed(bed, room, care.bedAssignments, care.maintenanceWorkOrders, care.safetyInspections),
                  );
                  return (
                    <tr key={String(room.id)} className="border-b last:border-0">
                      <td className="p-3">
                        <div className="font-medium">{title(room)}</div>
                        <div className="text-xs text-muted-foreground">#{room.number}</div>
                        <div className="mt-2 text-xs">
                          Capacity {room.maximumBedSpaces ?? "Not set"} · Active {roomBeds.length} ·
                          Occupied {occupiedBeds.length} · Available {availableBeds.length}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {roomBeds.map((bed) => (
                            <Link
                              key={String(bed.id)}
                              to="/maintenance/beds/$bedId"
                              params={{ bedId: String(bed.id) }}
                              className="rounded border px-2 py-1 text-xs text-primary focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              {bed.identifier || bed.label}
                            </Link>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        {care.wings.find((item) => item.id === room.wingId)?.name || "Unassigned"}
                      </td>
                      <td className="p-3">{room.roomType || "Standard"}</td>
                      <td className="p-3">
                        <Badge className={stateClass(state?.readinessStatus)}>
                          {state?.readinessStatus?.replaceAll("_", " ") ||
                            (room.active === false ? "INACTIVE" : "NOT TRACKED")}
                        </Badge>
                        {state?.readinessNotes && (
                          <div className="mt-1 max-w-56 text-xs text-muted-foreground">
                            {state.readinessNotes}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {openOrders(String(room.id)) ? (
                          <span className="font-medium text-amber-700">
                            {openOrders(String(room.id))} open
                          </span>
                        ) : (
                          "None"
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{room.notes || "—"}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setEditor(room)}>
                            Edit
                          </Button>
                          {state?.readinessStatus !== "READY" && (
                            <Button size="sm" variant="outline" onClick={() => mark(room, true)}>
                              Mark ready
                            </Button>
                          )}
                          {state?.readinessStatus !== "UNAVAILABLE" && (
                            <Button size="sm" variant="ghost" onClick={() => mark(room, false)}>
                              Unavailable
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!rooms.length && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No rooms match the current filters.
            </div>
          )}
        </CardContent>
      </Card>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Location intelligence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">One shared location source</div>
                <p className="text-muted-foreground">
                  Rooms are used by Work Orders, Housekeeping and readiness records, so maintenance
                  context stays consistent.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ClipboardList className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Operational blockers surfaced</div>
                <p className="text-muted-foreground">
                  Open maintenance issues and readiness state are visible before a room is released.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent readiness activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {care.housekeepingRoomStatusHistory
              .filter((item) => item.homeId === care.activeFacilityId)
              .slice(0, 4)
              .map((item) => (
                <div key={item.id} className="border-b pb-3 text-sm last:border-0">
                  <div className="font-medium">
                    {care.rooms.find((room) => String(room.id) === item.roomId)
                      ? title(care.rooms.find((room) => String(room.id) === item.roomId)!)
                      : item.roomId}{" "}
                    · {item.newStatus.replaceAll("_", " ")}
                  </div>
                  <div className="text-muted-foreground">
                    {item.reason} · {new Date(item.changedAt).toLocaleString()}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </section>
      <RoomEditor
        room={editor === "new" ? undefined : editor || undefined}
        open={Boolean(editor)}
        onOpenChange={(open) => !open && setEditor(null)}
      />
      <Dialog
        open={Boolean(statusChange)}
        onOpenChange={(open) => {
          if (!open) {
            setStatusChange(null);
            setStatusReason("");
            setStatusError("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {statusChange?.available ? "Mark room as ready" : "Mark room as unavailable"}
            </DialogTitle>
            <DialogDescription>
              {statusChange && (
                <>
                  Update <span className="font-medium text-foreground">{title(statusChange.room)}</span>. This
                  change is recorded in the room readiness history.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              {statusChange?.available
                ? "The room will only become ready if its maintenance, cleaning and safety requirements allow it."
                : "The room and its beds will not be offered for new resident assignment while it is unavailable."}
            </div>
            <label className="block text-sm font-medium">
              Reason <span className="text-destructive">*</span>
              <Textarea
                className="mt-1 min-h-24"
                value={statusReason}
                onChange={(event) => {
                  setStatusReason(event.target.value);
                  if (statusError) setStatusError("");
                }}
                placeholder={
                  statusChange?.available
                    ? "For example: cleaning and final checks completed"
                    : "For example: maintenance repair required"
                }
              />
            </label>
            {statusError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                <div className="font-medium">Status could not be changed</div>
                <div className="mt-1">{statusError}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusChange(null)}>
              Cancel
            </Button>
            <Button
              variant={statusChange?.available ? "default" : "destructive"}
              onClick={confirmStatusChange}
            >
              {statusChange?.available ? "Confirm ready" : "Confirm unavailable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoomEditor({
  room,
  open,
  onOpenChange,
}: {
  room?: Room;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const care = useCare();
  const [form, setForm] = useState({
    number: room?.number || "",
    name: room?.name || "",
    wingId: room?.wingId || care.wings[0]?.id || "",
    roomType: room?.roomType || "Single",
    notes: room?.notes || "",
    active: room?.active ?? true,
    maximumBedSpaces: room?.maximumBedSpaces ?? 1,
    operationalStatus: room?.operationalStatus || "ready",
  });
  const update = (key: keyof typeof form, value: string | boolean | number) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = () => {
    try {
      if (room) care.updateMaintenanceRoom(String(room.id), form);
      else care.createMaintenanceRoom(form);
      toast.success(room ? "Room updated." : "Room created.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save room.");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{room ? "Edit room" : "Add room"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field
            label="Room number"
            value={form.number}
            onChange={(value) => update("number", value)}
          />
          <Field
            label="Display name"
            value={form.name}
            onChange={(value) => update("name", value)}
          />
          <label className="block text-sm font-medium">
            Wing
            <select
              className="mt-1 h-9 w-full rounded-md border bg-background px-3"
              value={form.wingId}
              onChange={(event) => update("wingId", event.target.value)}
            >
              {care.wings.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Room type"
            value={form.roomType}
            onChange={(value) => update("roomType", value)}
          />
          <label className="block text-sm font-medium">
            Maximum bed spaces
            <Input className="mt-1" type="number" min="0" value={form.maximumBedSpaces} onChange={(event)=>update("maximumBedSpaces",Number(event.target.value))}/>
          </label>
          <label className="block text-sm font-medium">Operational status<select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={form.operationalStatus} onChange={(event)=>update("operationalStatus",event.target.value)}><option value="ready">Ready</option><option value="blocked">Blocked</option><option value="out_of_service">Out of Service</option><option value="temporarily_unavailable">Temporarily Unavailable</option></select></label>
          <label className="block text-sm font-medium">
            Notes
            <Textarea
              className="mt-1"
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => update("active", event.target.checked)}
            />
            Active room
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Save room</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <Input className="mt-1" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
  tone?: "red" | "amber";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-5">
        <Icon
          className={
            tone === "red"
              ? "h-5 w-5 text-red-600"
              : tone === "amber"
                ? "h-5 w-5 text-amber-600"
                : "h-5 w-5 text-primary"
          }
        />
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
