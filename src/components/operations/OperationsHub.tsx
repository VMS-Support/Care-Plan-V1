import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { isActionableClinicalAlert, isActionRequiredAlert } from "@/lib/care/alerts";
import { deriveStatus } from "@/lib/care/assessments";
import { complianceForResident } from "@/lib/care/vitals";
import {
  endOfCurrentShift,
  scheduledInterventions,
  type ScheduledInterventionStatus,
} from "@/lib/care/intervention-schedule";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BellRing,
  ClipboardCheck,
  ClipboardList,
  HeartPulse,
  ShieldAlert,
  Stethoscope,
  UserCheck,
  Users,
} from "lucide-react";
import type { Role } from "@/lib/care/types";

type AssignedFilter = "me" | "all";

const roleLabels: Record<Role, string> = {
  carer: "Carer",
  nurse: "Nurse",
  doctor: "Doctor",
  cnm: "Clinical Nurse Manager",
  don: "Director of Nursing",
};

function deriveShift(now: Date) {
  const hour = now.getHours();
  if (hour < 14) return "Day Shift";
  if (hour < 22) return "Late Shift";
  return "Night Shift";
}

function formatDate(now: Date) {
  return now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(now: Date) {
  return now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function currentHandoverShift(now: Date) {
  const hour = now.getHours();
  if (hour < 14) return "morning";
  if (hour < 22) return "afternoon";
  return "night";
}

function interventionStatusClass(status: ScheduledInterventionStatus) {
  if (status === "overdue") return "border-destructive/40 text-destructive bg-destructive/5";
  if (status === "due_now") return "border-warning/50 text-warning-foreground bg-warning/10";
  if (status === "due_today") return "border-warning/30 text-warning-foreground";
  if (status === "completed") return "border-success/30 text-success";
  return "border-info/30 text-info";
}

function staffNameMatches(assignedName: string | undefined, currentName: string) {
  if (!assignedName) return false;
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/\s*\([^)]*\)\s*$/, "")
      .trim();
  return normalize(assignedName) === normalize(currentName);
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sublabel,
  attention,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  sublabel?: string;
  attention?: boolean;
}) {
  return (
    <Card className={cn(attention && "border-warning/50 bg-warning/10")}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("rounded-lg border p-2", attention && "border-warning/50 bg-background")}>
          <Icon className={cn("h-5 w-5 text-muted-foreground", attention && "text-warning-foreground")} />
        </div>
        <div>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
          {sublabel && (
            <div className={cn("text-[10px]", attention ? "text-warning-foreground" : "text-muted-foreground")}>
              {sublabel}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function OperationsHub() {
  const {
    wings,
    residents,
    tasks,
    assessments,
    vitals,
    alerts,
    clinicalAlerts,
    handovers,
    observationPlans,
    problemInterventions,
    problemInterventionLogs,
    carePlanProblems,
    currentRole,
    currentUser,
    currentUserName,
    markHandoverRead,
    acknowledgeHandover,
  } = useCare();

  const isManagement = currentRole === "cnm" || currentRole === "don";
  const [now, setNow] = useState(() => new Date());
  const [wingFilter, setWingFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [residentFilter, setResidentFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState<AssignedFilter>("me");
  const [showAllInterventions, setShowAllInterventions] = useState(false);
  const [handoverPanelOpen, setHandoverPanelOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const shift = deriveShift(now);

  const myWings = useMemo(
    () =>
      currentUser.assignedWings.length === 0
        ? wings
        : wings.filter((wing) => currentUser.assignedWings.includes(wing.id)),
    [currentUser.assignedWings, wings],
  );

  const baseResidents = useMemo(() => {
    if (isManagement) return residents;
    return residents.filter(
      (resident) =>
        !resident.wingId ||
        myWings.some((wing) => wing.id === resident.wingId) ||
        staffNameMatches(resident.keyWorkers?.namedNurse, currentUserName),
    );
  }, [currentUserName, isManagement, myWings, residents]);

  const rooms = useMemo(
    () => [...new Set(baseResidents.map((r) => r.roomNumber))].sort((a, b) => a.localeCompare(b)),
    [baseResidents],
  );

  const filteredResidents = useMemo(
    () =>
      baseResidents.filter(
        (resident) =>
          (wingFilter === "all" || resident.wingId === wingFilter) &&
          (roomFilter === "all" || resident.roomNumber === roomFilter) &&
          (residentFilter === "all" || resident.id === residentFilter),
      ),
    [baseResidents, residentFilter, roomFilter, wingFilter],
  );

  const filteredResidentIds = useMemo(
    () => new Set(filteredResidents.map((r) => r.id)),
    [filteredResidents],
  );

  const residentById = useMemo(() => new Map(residents.map((r) => [r.id, r])), [residents]);

  const dueTasks = useMemo(() => {
    const today = now.toISOString().slice(0, 10);
    return tasks.filter(
      (task) =>
        task.residentId &&
        filteredResidentIds.has(task.residentId) &&
        task.status !== "completed" &&
        task.status !== "deleted" &&
        task.dueDate.slice(0, 10) <= today &&
        (assignedFilter === "all" || task.assignedTo === currentUserName),
    );
  }, [assignedFilter, currentUserName, filteredResidentIds, now, tasks]);

  const dueAssessments = useMemo(
    () =>
      assessments.filter((a) => {
        if (!filteredResidentIds.has(a.residentId)) return false;
        if (assignedFilter !== "all" && a.assignedToName && a.assignedToName !== currentUserName)
          return false;
        const s = deriveStatus(a);
        return s === "due" || s === "overdue";
      }),
    [assessments, assignedFilter, currentUserName, filteredResidentIds],
  );

  const dueObservations = useMemo(
    () =>
      filteredResidents
        .flatMap((resident) => {
          const plan = observationPlans.find((item) => item.residentId === resident.id);
          const residentVitals = vitals.filter((item) => item.residentId === resident.id);
          const compliance = complianceForResident(plan, residentVitals);
          return compliance.items
            .filter(
              (item) =>
                item.status === "due_today" ||
                item.status === "overdue" ||
                item.status === "missed",
            )
            .map(() => ({
              residentId: resident.id,
              assignedTo: resident.keyWorkers?.namedNurse || "Unassigned",
            }));
        })
        .filter(
          (row) =>
            assignedFilter === "all" ||
            row.assignedTo === currentUserName ||
            row.assignedTo === "Unassigned",
        ),
    [assignedFilter, currentUserName, filteredResidents, observationPlans, vitals],
  );

  // Scheduled interventions for residents in scope — no extra staff filter
  // so all care work for the nurse's assigned residents is visible.
  const dueInterventions = useMemo(() => {
    const shiftEnd = endOfCurrentShift(now);
    return scheduledInterventions(
      problemInterventions,
      problemInterventionLogs,
      carePlanProblems,
      now,
    ).filter((scheduled) => {
      const iv = scheduled.intervention;
      if (!filteredResidentIds.has(iv.residentId)) return false;
      if (["cancelled", "completed"].includes(scheduled.status)) return false;
      if (!scheduled.dueAt) return false;
      return (
        scheduled.status === "overdue" ||
        scheduled.status === "due_now" ||
        scheduled.status === "due_today" ||
        scheduled.dueAt.getTime() <= shiftEnd.getTime()
      );
    });
  }, [carePlanProblems, filteredResidentIds, now, problemInterventionLogs, problemInterventions]);

  const handoverRows = useMemo(() => {
    const today = now.toISOString().slice(0, 10);
    const currentShift = currentHandoverShift(now);
    return handovers.filter(
      (handover) =>
        filteredResidentIds.has(handover.residentId) &&
        handover.date.slice(0, 10) === today &&
        handover.shift === currentShift &&
        !["archived", "completed", "closed"].includes(handover.status || "active") &&
        handover.recordStatus !== "deleted",
    );
  }, [filteredResidentIds, handovers, now]);

  const handoversNeedingAttention = useMemo(
    () =>
      handoverRows.filter((handover) => {
        const readBy = Array.isArray(handover.readBy) ? handover.readBy : [];
        const acknowledgedBy = Array.isArray(handover.acknowledgedBy) ? handover.acknowledgedBy : [];
        return !readBy.includes(currentUserName) || !acknowledgedBy.includes(currentUserName);
      }),
    [currentUserName, handoverRows],
  );

  const alertRows = useMemo(
    () => [
      ...clinicalAlerts.filter(
        (a) =>
          filteredResidentIds.has(a.residentId) && isActionableClinicalAlert(a) && !a.dismissedAt,
      ),
      ...alerts.filter(
        (a) => filteredResidentIds.has(a.residentId) && isActionRequiredAlert(a) && !a.resolvedAt,
      ),
    ],
    [alerts, clinicalAlerts, filteredResidentIds],
  );

  const next4HoursItems = useMemo(() => {
    const cutoff = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    type N4H = {
      id: string;
      timeLabel: string;
      sortKey: number;
      residentId: string;
      residentName: string;
      room: string;
      label: string;
      isTask: boolean;
    };
    const items: N4H[] = [];
    for (const item of dueInterventions) {
      if (!item.dueAt) continue;
      if (item.status !== "overdue" && item.dueAt.getTime() > cutoff.getTime()) continue;
      const r = residentById.get(item.intervention.residentId);
      const overdueMin =
        item.status === "overdue"
          ? Math.round((now.getTime() - item.dueAt.getTime()) / 60000)
          : null;
      items.push({
        id: `intv-${item.intervention.id}`,
        timeLabel:
          overdueMin !== null
            ? `${overdueMin}m late`
            : item.dueAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        sortKey: item.dueAt.getTime(),
        residentId: item.intervention.residentId,
        residentName: r ? `${r.firstName} ${r.lastName}` : "Unknown",
        room: r?.roomNumber || "—",
        label: item.intervention.name,
        isTask: false,
      });
    }
    for (const task of dueTasks) {
      if (!task.residentId) continue;
      const r = residentById.get(task.residentId);
      items.push({
        id: `task-${task.id}`,
        timeLabel: "Today",
        sortKey: new Date(`${task.dueDate}T23:59`).getTime(),
        residentId: task.residentId,
        residentName: r ? `${r.firstName} ${r.lastName}` : "Unknown",
        room: r?.roomNumber || "—",
        label: task.title,
        isTask: true,
      });
    }
    return items.sort((a, b) => a.sortKey - b.sortKey);
  }, [dueInterventions, dueTasks, now, residentById]);

  const INTV_DISPLAY_LIMIT = 8;
  const INTV_GROUPS: { status: ScheduledInterventionStatus; label: string; cls: string }[] = [
    { status: "overdue", label: "Overdue", cls: "text-destructive" },
    { status: "due_now", label: "Due Now", cls: "text-warning-foreground" },
    { status: "due_today", label: "This Shift", cls: "text-primary" },
    { status: "upcoming", label: "Upcoming", cls: "text-muted-foreground" },
  ];
  const displayedInterventions = showAllInterventions
    ? dueInterventions
    : dueInterventions.slice(0, INTV_DISPLAY_LIMIT);

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-[1800px] mx-auto">
      <Card>
        <CardContent className="p-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Operations Centre
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mt-1">{shift}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>{formatDate(now)}</span>
              <span>{formatTime(now)}</span>
              <span>{currentUserName}</span>
              <span>{roleLabels[currentRole]}</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">What do I need to do next?</div>
        </CardContent>
      </Card>

      <Card className="sticky top-4 z-10 shadow-sm">
        <CardContent className="p-4 grid gap-3 md:grid-cols-4">
          <div>
            <Label>Wing</Label>
            <Select value={wingFilter} onValueChange={setWingFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wings</SelectItem>
                {myWings.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Room</Label>
            <Select value={roomFilter} onValueChange={setRoomFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {rooms.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Resident</Label>
            <Select value={residentFilter} onValueChange={setResidentFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Residents</SelectItem>
                {baseResidents.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.firstName} {r.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assigned To</Label>
            <Select
              value={assignedFilter}
              onValueChange={(v) => setAssignedFilter(v as AssignedFilter)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">Me</SelectItem>
                <SelectItem value="all">All Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <MetricCard label="Residents Assigned" value={filteredResidents.length} icon={Users} />
        <MetricCard label="Tasks Due" value={dueTasks.length} icon={ClipboardList} />
        <MetricCard
          label="Interventions Due"
          value={dueInterventions.length}
          icon={ClipboardCheck}
        />
        <MetricCard label="Observations Due" value={dueObservations.length} icon={HeartPulse} />
        <MetricCard label="Assessments Due" value={dueAssessments.length} icon={Stethoscope} />
        <MetricCard label="Clinical Alerts" value={alertRows.length} icon={BellRing} />
        <button type="button" className="text-left" onClick={() => setHandoverPanelOpen(true)}>
          <MetricCard
            label="Handovers"
            value={handoversNeedingAttention.length}
            sublabel={
              handoversNeedingAttention.length > 0
                ? `${handoversNeedingAttention.length} unread`
                : "No unread"
            }
            icon={UserCheck}
            attention={handoversNeedingAttention.length > 0}
          />
        </button>
      </div>

      <Dialog open={handoverPanelOpen} onOpenChange={setHandoverPanelOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Handovers Requiring Review</DialogTitle>
            <DialogDescription>
              Current shift handovers for your residents, wing, or facility scope.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {handoversNeedingAttention.map((handover) => {
              const resident = residentById.get(handover.residentId);
              const wing = wings.find((item) => item.id === resident?.wingId);
              const readBy = Array.isArray(handover.readBy) ? handover.readBy : [];
              const acknowledgedBy = Array.isArray(handover.acknowledgedBy)
                ? handover.acknowledgedBy
                : [];
              const read = readBy.includes(currentUserName);
              const acknowledged = acknowledgedBy.includes(currentUserName);
              return (
                <div key={handover.id} className="rounded-md border p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium capitalize">
                        {handover.shift} handover
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {resident
                          ? `${resident.firstName} ${resident.lastName} · Room ${resident.roomNumber}`
                          : handover.residentId}
                        {wing ? ` · ${wing.name}` : ""}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {handover.priority && (
                        <Badge variant="outline" className="capitalize">
                          {handover.priority}
                        </Badge>
                      )}
                      {!read && <Badge className="bg-warning text-warning-foreground">Unread</Badge>}
                      {read && !acknowledged && <Badge variant="outline">Read</Badge>}
                      {acknowledged && <Badge variant="secondary">Acknowledged</Badge>}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Created by: {handover.createdBy || handover.staff}</div>
                    <div>
                      Created:{" "}
                      {handover.createdAt
                        ? new Date(handover.createdAt).toLocaleString("en-GB")
                        : handover.date}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Summary: </span>
                      {handover.summary}
                    </div>
                    {handover.outstandingActions && (
                      <div>
                        <span className="text-muted-foreground">Notes: </span>
                        {handover.outstandingActions}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={read}
                      onClick={() => markHandoverRead(handover.id)}
                    >
                      Mark as Read
                    </Button>
                    <Button
                      size="sm"
                      disabled={acknowledged}
                      onClick={() => acknowledgeHandover(handover.id)}
                    >
                      Acknowledge
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/handovers">Open Full Handover</Link>
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to="/residents/$id" params={{ id: handover.residentId }}>
                        Open Resident
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
            {handoversNeedingAttention.length === 0 && (
              <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                No unread handovers.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Upcoming Care Interventions</CardTitle>
            {dueInterventions.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {dueInterventions.length} scheduled
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {dueInterventions.length === 0 ? (
            <div className="border rounded-md p-8 text-center space-y-1 text-sm text-muted-foreground">
              <div>No upcoming scheduled interventions for your assigned residents.</div>
              <div className="text-xs">
                Try switching Assigned To to All Staff, or use Reset Demo Data.
              </div>
            </div>
          ) : (
            <>
              {INTV_GROUPS.map(({ status, label, cls }) => {
                const allInGroup = dueInterventions.filter((i) => i.status === status);
                const visibleInGroup = displayedInterventions.filter((i) => i.status === status);
                if (!visibleInGroup.length) return null;
                return (
                  <div key={status} className="space-y-1">
                    <div
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wider px-1 pb-0.5",
                        cls,
                      )}
                    >
                      {label} · {allInGroup.length}
                    </div>
                    {visibleInGroup.map((item) => {
                      const r = residentById.get(item.intervention.residentId);
                      const overdueMins =
                        item.status === "overdue" && item.dueAt
                          ? Math.round((now.getTime() - item.dueAt.getTime()) / 60000)
                          : null;
                      return (
                        <div
                          key={item.intervention.id}
                          className={cn(
                            "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
                            interventionStatusClass(item.status),
                          )}
                        >
                          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            <span className="font-medium">
                              {r ? `${r.firstName} ${r.lastName}` : "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Room {r?.roomNumber || "—"}
                            </span>
                            <span>{item.intervention.name}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {overdueMins !== null
                                ? `${overdueMins}m overdue`
                                : item.dueAt
                                  ? item.dueAt.toLocaleTimeString("en-GB", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "—"}
                            </span>
                          </div>
                          <Link
                            to="/residents/$id"
                            params={{ id: item.intervention.residentId }}
                            className="shrink-0"
                          >
                            <Button size="sm" variant="outline">
                              Open Resident
                            </Button>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {dueInterventions.length > INTV_DISPLAY_LIMIT && (
                <button
                  type="button"
                  onClick={() => setShowAllInterventions((v) => !v)}
                  className="text-xs text-primary hover:underline mt-1 px-1"
                >
                  {showAllInterventions
                    ? "Show fewer"
                    : `View all ${dueInterventions.length} interventions`}
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Next 4 Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {next4HoursItems.length === 0 ? (
            <div className="border rounded-md p-6 text-sm text-muted-foreground">
              No scheduled work in the next 4 hours.
            </div>
          ) : (
            next4HoursItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <div className="w-16 shrink-0 text-xs tabular-nums text-muted-foreground font-medium">
                  {item.timeLabel}
                </div>
                <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span className="font-medium">{item.residentName}</span>
                  <span className="text-xs text-muted-foreground">Room {item.room}</span>
                  <span>{item.label}</span>
                  {item.isTask && (
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0 border-primary/30 text-primary bg-primary/5"
                    >
                      Task
                    </Badge>
                  )}
                </div>
                <Link to="/residents/$id" params={{ id: item.residentId }} className="shrink-0">
                  <Button size="sm" variant="outline">
                    Open Resident
                  </Button>
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/assessments">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Assessment Centre</span>
              </div>
              <div className="text-2xl font-semibold tabular-nums">{dueAssessments.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">reassessments due</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/tasks">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Tasks</span>
              </div>
              <div className="text-2xl font-semibold tabular-nums">{dueTasks.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">tasks due today</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/incidents">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Incidents</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">incident register</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/alerts">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BellRing className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Clinical Alerts</span>
              </div>
              <div className="text-2xl font-semibold tabular-nums">{alertRows.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">active alerts</div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
