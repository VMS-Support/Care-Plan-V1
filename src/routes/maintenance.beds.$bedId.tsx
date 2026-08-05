import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { bedBlockers, bedLabel, canAssignBed } from "@/domain/maintenance/bedOccupancy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
export const Route = createFileRoute("/maintenance/beds/$bedId")({ component: BedProfile });
function BedProfile() {
  const { bedId } = Route.useParams();
  const care = useCare();
  const bed = care.beds.find((b) => String(b.id) === bedId);
  const [tab, setTab] = useState("overview");
  const [returning, setReturning] = useState(false);
  if (!bed) return <main className="p-8">Bed not found.</main>;
  const room = care.rooms.find((r) => String(r.id) === String(bed.roomId));
  const wing = care.wings.find((w) => w.id === room?.wingId);
  const assignment = care.bedAssignments.find(
    (a) => String(a.bedId) === bedId && a.status === "active",
  );
  const resident = care.residents.find((r) => r.id === assignment?.residentId);
  const orders = care.maintenanceWorkOrders.filter(
    (order) => String(order.assetId) === String(bed.assetId || bed.id),
  );
  const documents = care.maintenanceAssetDocuments.filter(
    (document) => String(document.assetId) === String(bed.assetId || bed.id) && !document.deletedAt,
  );
  const photos = care.maintenanceAssetPhotos.filter(
    (photo) => String(photo.assetId) === String(bed.assetId || bed.id) && !photo.deletedAt,
  );
  const blockers = bedBlockers(bed, room, orders, care.safetyInspections);
  const timeline = useMemo(() => {
    const events: any[] = [];
    care.auditLogs
      .filter((a) => a.entity === bedId || a.entity === String(bed.id))
      .forEach((a) =>
        events.push({ id: `audit:${a.id}`, at: a.timestamp, title: a.action, detail: a.user }),
      );
    care.bedAssignments
      .filter((a) => String(a.bedId) === bedId)
      .forEach((a) => {
        events.push({
          id: `assignment:start:${a.id}`,
          at: a.startDateTime || a.startDate,
          title: "Resident assigned",
          detail: care.residents.find((r) => r.id === a.residentId)?.firstName || a.residentId,
        });
        if (a.endDateTime || a.endDate)
          events.push({
            id: `assignment:end:${a.id}`,
            at: a.endDateTime || a.endDate,
            title: "Resident released or transferred",
            detail: a.endedReason || "Assignment ended",
          });
      });
    orders.forEach((o) =>
      events.push({
        id: `work-order:${o.id}:${o.status}`,
        at: o.reportedAt,
        title: `Work Order ${o.status}`,
        detail: o.title,
      }),
    );
    return [...new Map(events.map((e) => [e.id, e])).values()].sort((a, b) =>
      String(b.at).localeCompare(String(a.at)),
    );
  }, [care, bedId]);
  const tabs = ["overview", "occupancy history", "maintenance"];
  return (
    <main className="space-y-5 p-4 md:p-8">
      <div>
        <Link to="/maintenance/assets-rooms-beds" className="text-sm text-primary">
          ← Bed Management
        </Link>
        <h1 className="mt-2 text-3xl font-semibold">{bed.identifier || bed.label}</h1>
        <p className="text-base text-muted-foreground">
          {wing?.name} · Room {room?.number} · {bed.label}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
            {bedLabel(t)}
          </Button>
        ))}
      </div>
      {blockers.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <strong>Assignment blocked</strong>
          <ul className="mt-2 list-disc pl-5">
            {blockers.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}
      {tab === "overview" && (
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Bed identifier", bed.identifier],
                ["Nursing Home", care.facilities.find((f) => f.id === care.activeFacilityId)?.name],
                ["Wing", wing?.name],
                ["Room", room?.name || `Room ${room?.number}`],
                ["Bed space", bed.label],
                ["Bed type", bedLabel(String(bed.bedType))],
                ["Mattress type", bedLabel(String(bed.mattressType))],
                ["Operational status", bedLabel(bed.operationalStatus)],
                ["Occupancy status", bedLabel(bed.occupancyStatus || bed.status)],
                ["Readiness status", bedLabel(bed.readinessStatus)],
                ["Condition", bedLabel(bed.condition)],
                [
                  "Assigned resident",
                  resident ? `${resident.firstName} ${resident.lastName}` : "Bed not yet assigned",
                ],
                [
                  "Assignment date",
                  assignment
                    ? new Date(assignment.startDateTime || assignment.startDate).toLocaleString()
                    : "—",
                ],
                [
                  "Open Work Orders",
                  orders.filter((o) => !["COMPLETED", "CANCELLED", "CLOSED"].includes(o.status))
                    .length,
                ],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">{k}</div>
                  <div className="mt-1 font-medium">{v || "Not recorded"}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {["blocked", "under_maintenance", "out_of_service"].includes(
                bed.operationalStatus || "",
              ) || bed.readinessStatus === "failed" ? (
                <Button onClick={() => setReturning(true)}>Return to Service</Button>
              ) : null}
              <Button variant="outline" asChild>
                <Link to="/maintenance/work-orders/new" search={{} as any}>Create Work Order</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {tab === "legacy occupancy history" && (
        <List
          rows={care.bedAssignments
            .filter((a) => String(a.bedId) === bedId)
            .map((a) => ({
              title: care.residents.find((r) => r.id === a.residentId)
                ? `${care.residents.find((r) => r.id === a.residentId)!.firstName} ${care.residents.find((r) => r.id === a.residentId)!.lastName}`
                : a.residentId,
              detail: `${a.startDateTime || a.startDate} — ${a.endDateTime || a.endDate || "Current"}`,
            }))}
        />
      )}{" "}
      {tab === "legacy maintenance" && (
        <List
          rows={orders.map((o) => ({ title: o.title, detail: `${o.status} · ${o.priority}` }))}
        />
      )}{" "}
      {tab === "cleaning & readiness" && (
        <List
          rows={[
            {
              title: `Readiness: ${bedLabel(bed.readinessStatus)}`,
              detail: bed.restrictionReason || "No readiness note recorded.",
            },
          ]}
        />
      )}{" "}
      {tab === "documents & photos" && (
        <List
          rows={[
            ...care.maintenanceAssetDocuments
              .filter((d) => String(d.assetId) === String(bed.assetId || bed.id))
              .map((d) => ({ title: d.fileName || "Document", detail: "Document" })),
            ...care.maintenanceAssetPhotos
              .filter((p) => String(p.assetId) === String(bed.assetId || bed.id))
              .map((p) => ({ title: p.caption || "Photograph", detail: "Photo" })),
          ]}
        />
      )}{" "}
      {tab === "timeline" && (
        <List
          rows={timeline.map((e) => ({
            title: e.title,
            detail: `${new Date(e.at).toLocaleString()} · ${e.detail}`,
          }))}
        />
      )}
      {tab === "occupancy history" && <OccupancyHistoryPanel bedId={bedId} />}
      {tab === "maintenance" && (
        <BedMaintenancePanel bed={bed} orders={orders} documents={documents} photos={photos} timeline={timeline} />
      )}
      <ReturnDialog
        open={returning}
        bed={bed}
        blockers={blockers}
        orders={orders}
        onClose={() => setReturning(false)}
      />
    </main>
  );
}
function OccupancyHistoryPanel({ bedId }: { bedId: string }) {
  const care = useCare();
  const records = care.bedAssignments
    .filter((record) => String(record.bedId) === bedId)
    .sort((a, b) => String(b.startDateTime || b.startDate).localeCompare(String(a.startDateTime || a.startDate)));
  return (
    <Card>
      <CardHeader><CardTitle>Occupancy History</CardTitle></CardHeader>
      <CardContent>
        {records.length ? (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Resident</th><th className="p-3">Assigned</th><th className="p-3">Released</th><th className="p-3">Status</th><th className="p-3">Assignment reason</th><th className="p-3">Release / transfer details</th></tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const resident = care.residents.find((item) => item.id === record.residentId);
                  const endedAt = record.endDateTime || record.endDate;
                  return (
                    <tr key={String(record.id)} className="border-b last:border-0">
                      <td className="p-3 font-medium">{resident ? `${resident.firstName} ${resident.lastName}` : "Resident record unavailable"}</td>
                      <td className="p-3">{new Date(record.startDateTime || record.startDate).toLocaleString()}</td>
                      <td className="p-3">{endedAt ? new Date(endedAt).toLocaleString() : "Current"}</td>
                      <td className="p-3"><Badge>{bedLabel(record.status)}</Badge></td>
                      <td className="p-3">{bedLabel(record.assignmentReason || record.reason || "not_recorded")}</td>
                      <td className="p-3">{bedLabel(record.endedReason || (record.status === "active" ? "current_assignment" : "not_recorded"))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="py-8 text-center text-muted-foreground">No occupancy history recorded.</div>}
      </CardContent>
    </Card>
  );
}

function BedMaintenancePanel({ bed, orders, documents, photos, timeline }: { bed: any; orders: any[]; documents: any[]; photos: any[]; timeline: any[] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Bed Maintenance</CardTitle></CardHeader>
        <CardContent>
          {orders.length ? <div className="divide-y">{orders.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div><div className="font-medium">{order.workOrderNumber} · {order.title}</div><div className="text-sm text-muted-foreground">Reported {new Date(order.reportedAt).toLocaleString()} · Priority {bedLabel(order.priority)}</div></div>
              <Badge>{bedLabel(order.status)}</Badge>
            </div>
          ))}</div> : <div className="py-6 text-center text-muted-foreground">No Work Orders are linked directly to this bed.</div>}
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Cleaning & Readiness</CardTitle></CardHeader><CardContent><div className="font-medium">{bedLabel(bed.readinessStatus)}</div><p className="mt-1 text-sm text-muted-foreground">{bed.restrictionReason || "No readiness restriction recorded."}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Evidence</CardTitle></CardHeader><CardContent>{documents.length || photos.length ? <div className="divide-y">{documents.map((document) => <div key={document.id} className="py-2"><div className="font-medium">{document.fileName}</div><div className="text-xs text-muted-foreground">Document · {bedLabel(document.documentType)}</div></div>)}{photos.map((photo) => <div key={photo.id} className="py-2"><div className="font-medium">{photo.caption || "Bed photograph"}</div><div className="text-xs text-muted-foreground">Photo evidence</div></div>)}</div> : <div className="py-4 text-center text-muted-foreground">No documents or photographs linked to this bed.</div>}</CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Recent Bed Activity</CardTitle></CardHeader><CardContent>{timeline.length ? <div className="divide-y">{timeline.slice(0, 10).map((event) => <div key={event.id} className="py-2"><div className="font-medium">{event.title}</div><div className="text-sm text-muted-foreground">{new Date(event.at).toLocaleString()} · {event.detail}</div></div>)}</div> : <div className="py-4 text-center text-muted-foreground">No activity recorded.</div>}</CardContent></Card>
    </div>
  );
}

function List({ rows }: { rows: { title: string; detail: string }[] }) {
  return (
    <Card>
      <CardContent className="divide-y pt-6">
        {rows.length ? (
          rows.map((r, i) => (
            <div key={`${r.title}-${i}`} className="py-3">
              <div className="font-medium">{r.title}</div>
              <div className="text-sm text-muted-foreground">{r.detail}</div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-muted-foreground">No records.</div>
        )}
      </CardContent>
    </Card>
  );
}
function TransferDialog({
  open,
  oldBedId,
  residentId,
  onClose,
}: {
  open: boolean;
  oldBedId: string;
  residentId?: string;
  onClose: () => void;
}) {
  const care = useCare();
  const [newBedId, setNewBedId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const beds = care.beds.filter((b) => {
    const room = care.rooms.find((r) => String(r.id) === String(b.roomId));
    return (
      String(b.id) !== oldBedId &&
      canAssignBed(b, room, care.bedAssignments, care.maintenanceWorkOrders, care.safetyInspections)
    );
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Resident</DialogTitle>
        </DialogHeader>
        <label>
          New Wing / Room / Bed
          <select
            className="mt-1 h-12 w-full rounded-md border px-3"
            value={newBedId}
            onChange={(e) => setNewBedId(e.target.value)}
          >
            <option value="">Select available and ready bed</option>
            {beds.map((b) => {
              const r = care.rooms.find((x) => String(x.id) === String(b.roomId));
              return (
                <option key={String(b.id)} value={String(b.id)}>
                  {care.wings.find((w) => w.id === r?.wingId)?.name} · Room {r?.number} ·{" "}
                  {b.identifier || b.label} · {bedLabel(String(b.bedType))} ·{" "}
                  {bedLabel(String(b.mattressType))}
                </option>
              );
            })}
          </select>
        </label>
        <label>
          Transfer date and time
          <Input type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} />
        </label>
        <label>
          Transfer reason
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <label>
          Notes
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!newBedId || !reason || !residentId}
            onClick={() => {
              try {
                care.releaseMaintenanceBed(
                  oldBedId,
                  `Transfer: ${reason}${notes ? ` — ${notes}` : ""}`,
                  new Date().toISOString(),
                );
                care.assignResidentToMaintenanceBed(
                  newBedId,
                  residentId!,
                  new Date().toISOString(),
                );
                toast.success("Resident transferred; previous bed requires cleaning.");
                onClose();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Transfer failed.");
              }
            }}
          >
            Confirm Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function ReturnDialog({ open, bed, blockers, orders, onClose }: any) {
  const care = useCare();
  const [comment, setComment] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");
  const [cleaningComplete, setCleaningComplete] = useState(false);
  const [inspectionPassed, setInspectionPassed] = useState(false);
  const [supervisorVerified, setSupervisorVerified] = useState(false);
  const completedOrders = orders.filter((o: any) => ["COMPLETED", "CLOSED"].includes(o.status));
  const selectedOrder = completedOrders.find((o: any) => o.id === workOrderId);
  const documents = care.maintenanceAssetDocuments.filter((d: any) => String(d.assetId) === String(bed.assetId || bed.id));
  const photos = care.maintenanceAssetPhotos.filter((p: any) => String(p.assetId) === String(bed.assetId || bed.id));
  const room = care.rooms.find((r: any) => String(r.id) === String(bed.roomId));
  const blockingOrders = orders.filter(
    (o: any) =>
      o.priority === "CRITICAL" && !["COMPLETED", "CANCELLED", "CLOSED"].includes(o.status),
  );
  const missing = [
    blockingOrders.length > 0 && "Critical blocking Work Order remains open",
    !workOrderId && ["under_maintenance", "out_of_service"].includes(bed.operationalStatus) && "Completed repair Work Order is required",
    !inspectionPassed && "Readiness inspection has not passed",
    !cleaningComplete && "Required cleaning is not complete",
    !supervisorVerified && "Supervisor verification is required",
    !comment.trim() && "Approval comment is required",
    !documents.length && !photos.length && "Photograph or document evidence is required",
    ["blocked", "out_of_service"].includes(room?.operationalStatus || "") && "Room is blocked or out of service",
    selectedOrder?.completedByUserId === care.currentUser.id && "Repair completer cannot approve Return to Service",
    !care.canAccess("maintenance.work_orders.verification.verify", { nursingHomeId: care.activeFacilityId }) && "Current user is not authorised to approve Return to Service",
  ].filter(Boolean) as string[];
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Controlled Return to Service</DialogTitle>
        </DialogHeader>
        <p className="text-sm">
          Confirm repair evidence, safety inspection, cleaning, readiness inspection and supervisor
          verification are complete.
        </p>
        {missing.length > 0 && <div className="rounded border border-red-300 bg-red-50 p-3"><strong>Return to Service cannot be completed</strong><div className="mt-1">Missing:</div><ul className="list-disc pl-5">{missing.map(item=><li key={item}>{item}</li>)}</ul></div>}
        <label>Linked completed Work Order<select className="mt-1 h-11 w-full rounded-md border px-3" value={workOrderId} onChange={e=>setWorkOrderId(e.target.value)}><option value="">Select completed repair</option>{completedOrders.map((o:any)=><option key={o.id} value={o.id}>{o.workOrderNumber} · {o.title}</option>)}</select></label>
        <div className="rounded border p-3 text-sm">Evidence linked: {documents.length} document(s) · {photos.length} photograph(s). <Link to="/maintenance/assets">Manage evidence in the existing Asset register.</Link></div>
        <label className="flex gap-2"><input type="checkbox" checked={cleaningComplete} onChange={e=>setCleaningComplete(e.target.checked)}/>Required cleaning task completed</label>
        <label className="flex gap-2"><input type="checkbox" checked={inspectionPassed} onChange={e=>setInspectionPassed(e.target.checked)}/>Readiness / safety inspection passed</label>
        <label className="flex gap-2"><input type="checkbox" checked={supervisorVerified} onChange={e=>setSupervisorVerified(e.target.checked)}/>Independent supervisor verification completed</label>
        <label>
          Supervisor return-to-service comment
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} />
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={missing.length > 0}
            onClick={() => {
              care.updateMaintenanceBed(
                String(bed.id),
                {
                  operationalStatus: "operational",
                  readinessStatus: "ready",
                  occupancyStatus: "available",
                  status: "available",
                  restrictionReason: undefined,
                  returnToService: { requestedBy: care.currentUserName, requestedAt: new Date().toISOString(), workCompletedBy: selectedOrder?.completedByUserId, approvedBy: care.currentUserName, approvedAt: new Date().toISOString(), approvalComment: comment, workOrderId: workOrderId || undefined, photoIds: photos.map((p:any)=>p.id), documentIds: documents.map((d:any)=>d.id), supervisorVerified: true },
                },
                bed.version,
              );
              toast.success("Bed returned to service with supervisor verification recorded.");
              onClose();
            }}
          >
            Approve Return to Service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
