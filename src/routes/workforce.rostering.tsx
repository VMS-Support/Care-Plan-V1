import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Copy, FileText, Lock, Plus, Send, ShieldCheck, Users, Wand2 } from "lucide-react";
import { useCare } from "@/lib/care/store";
import type { PlannedShift, RosterPeriod, RosterShiftRequirement, StaffMember } from "@/lib/care/types";
import {
  getRosterOverviewMetrics,
  type AddRosterShiftRequirementCommand,
  type AssignPlannedShiftCommand,
  type CreateRosterPeriodCommand,
} from "@/domain/workforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/workforce/rostering")({
  head: () => ({ meta: [{ title: "Rostering - NuCare" }] }),
  component: RosteringWorkspace,
});

type RosterView =
  | "overview"
  | "current"
  | "periods"
  | "templates"
  | "requirements"
  | "vacant"
  | "pending"
  | "agency"
  | "conflicts"
  | "availability"
  | "changes"
  | "reports"
  | "settings";

const roleOptions = ["NURSE", "CNM", "HCA", "DOCTOR", "ALLIED_HEALTH", "HOUSEKEEPING", "KITCHEN", "MAINTENANCE", "ADMINISTRATION", "OPERATIONS", "OTHER"];
const viewLinks: Array<{ view: RosterView; label: string; to: string }> = [
  { view: "overview", label: "Roster Overview", to: "/workforce/rostering" },
  { view: "current", label: "Current Roster", to: "/workforce/rostering/current" },
  { view: "periods", label: "Roster Periods", to: "/workforce/rostering/periods" },
  { view: "templates", label: "Roster Templates", to: "/workforce/rostering/templates" },
  { view: "requirements", label: "Staffing Requirements", to: "/workforce/rostering/requirements" },
  { view: "vacant", label: "Vacant Shifts", to: "/workforce/rostering/vacant" },
  { view: "pending", label: "Pending Confirmation", to: "/workforce/rostering/pending" },
  { view: "agency", label: "Agency Cover", to: "/workforce/rostering/agency" },
  { view: "conflicts", label: "Roster Conflicts", to: "/workforce/rostering/conflicts" },
  { view: "availability", label: "Staff Availability", to: "/workforce/rostering/availability" },
  { view: "changes", label: "Roster Changes", to: "/workforce/rostering/changes" },
  { view: "reports", label: "Roster Reports", to: "/workforce/rostering/reports" },
  { view: "settings", label: "Rostering Settings", to: "/workforce/rostering/settings" },
];

export function RosteringWorkspace() {
  const care = useCare();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const view = viewFromPath(pathname);
  const [homeId, setHomeId] = useState(care.activeFacilityId);
  const [periodId, setPeriodId] = useState<string>("");
  const [wardId, setWardId] = useState<string>("all");
  const [role, setRole] = useState<string>("all");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [requirementOpen, setRequirementOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const can = (capability: string) => care.canAccess(capability, { nursingHomeId: homeId });

  const homePeriods = care.rosterPeriods.filter((period) => String(period.nursingHomeId) === homeId && period.status !== "entered_in_error");
  const selectedPeriod = homePeriods.find((period) => period.id === periodId) || homePeriods[0];
  const dateFrom = selectedPeriod?.dateFrom || weekStart();
  const dateTo = selectedPeriod?.dateTo || addDays(dateFrom, 6);
  const metrics = getRosterOverviewMetrics({
    periods: care.rosterPeriods,
    requirements: care.rosterShiftRequirements,
    plannedShifts: care.plannedShifts,
    nursingHomeId: homeId,
    dateFrom,
    dateTo,
  });

  const periodIds = new Set(selectedPeriod ? [selectedPeriod.id] : metrics.periodIds);
  const requirements = care.rosterShiftRequirements
    .filter((requirement) => periodIds.has(requirement.rosterPeriodId) && requirement.status !== "entered_in_error")
    .filter((requirement) => wardId === "all" || String(requirement.wardId || "") === wardId)
    .filter((requirement) => role === "all" || requirement.roleKey === role);
  const planned = care.plannedShifts
    .filter((shift) => periodIds.has(shift.rosterPeriodId) && !["entered_in_error", "cancelled", "replaced"].includes(shift.status))
    .filter((shift) => wardId === "all" || String(shift.wardId || "") === wardId)
    .filter((shift) => role === "all" || shift.roleKey === role);
  const rows = buildRosterRows(requirements, planned);
  const vacantRows = rows.filter((row) => row.vacant > 0 || row.status === "vacant");
  const pending = planned.filter((shift) => shift.status === "to_be_confirmed" || (shift.confirmationRequired && shift.status === "assigned"));
  const agency = planned.filter((shift: any) => shift.agencyCoverRequired || shift.agencyAssignmentId || shift.source === "agency_cover");
  const rosteredNow = planned.filter((shift) => ["confirmed", "published"].includes(shift.status) && shift.startAt <= new Date().toISOString() && shift.endAt >= new Date().toISOString());
  const conflicts = planned.flatMap((shift) => rosterConflicts(care, shift));
  const coverage = requirements.reduce((sum, requirement) => sum + requirement.requiredCount, 0);
  const filled = planned.filter((shift) => shift.assignedStaffMemberId && ["assigned", "to_be_confirmed", "confirmed", "published"].includes(shift.status)).length;
  const coveragePercent = coverage ? Math.min(100, Math.round((filled / coverage) * 100)) : undefined;

  if (!can("rostering.view")) {
    return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have access to Rostering.</CardContent></Card></div>;
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rostering</h1>
          <p className="text-sm text-muted-foreground">Professional planned staffing workspace. Rostered shifts are not attendance or on-duty confirmation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={homeId} onValueChange={(value) => { setHomeId(value); setPeriodId(""); }}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>{care.facilities.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent>
          </Select>
          {selectedPeriod && (
            <Select value={selectedPeriod.id} onValueChange={setPeriodId}>
              <SelectTrigger className="w-[230px]"><SelectValue /></SelectTrigger>
              <SelectContent>{homePeriods.map((period) => <SelectItem key={period.id} value={period.id}>{period.name} · {period.dateFrom}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {can("rostering.create_period") && <Button variant="outline" onClick={() => setPeriodOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create Period</Button>}
          {selectedPeriod && can("rostering.add_requirement") && <Button variant="outline" onClick={() => setRequirementOpen(true)}>Add Required Shift</Button>}
          {selectedPeriod && can("rostering.assign_shift") && <Button onClick={() => setShiftOpen(true)}>Assign Shift</Button>}
        </div>
      </div>

      <Tabs value={view} className="overflow-x-auto">
        <TabsList className="h-auto flex-wrap justify-start">
          {viewLinks.map((item) => (
            <TabsTrigger key={item.view} value={item.view} asChild>
              <Link to={item.to as any}>{item.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        <Metric title="Total Required Positions" value={metrics.totalShifts.value} availability={metrics.totalShifts.availability} explanation={metricExplanation(metrics.totalShifts.explanation)} icon={CalendarDays} />
        <Metric title="Filled Shifts" value={metrics.filledShifts.value} availability={metrics.filledShifts.availability} explanation="Exact confirmed, published or assigned planned shifts with a Staff Member." icon={CheckCircle2} />
        <Metric title="Vacant Shifts" value={metrics.vacantShifts.value} availability={metrics.vacantShifts.availability} explanation="Exact uncovered required positions and explicitly vacant planned shifts." icon={AlertTriangle} tone="warn" />
        <Metric title="To Be Confirmed" value={metrics.toBeConfirmed.value} availability={metrics.toBeConfirmed.availability} explanation="Exact provisional assignments awaiting confirmation." icon={Clock3} tone="warn" />
        <Metric title="Rostered Now" value={selectedPeriod ? rosteredNow.length : undefined} availability={selectedPeriod ? "available" : "not_configured"} explanation="Confirmed or published planned shifts overlapping the current time. Not attendance." icon={Users} />
        <Metric title="Agency Cover" value={selectedPeriod ? agency.length : undefined} availability={selectedPeriod ? "available" : "not_configured"} explanation="Planned assignments linked to agency cover or marked agency required." icon={ShieldCheck} />
        <Metric title="Planned Coverage" value={coveragePercent} suffix={coveragePercent === undefined ? "" : "%"} availability={selectedPeriod ? "available" : "not_configured"} explanation={selectedPeriod ? "Filled planned positions divided by required positions." : "No Roster Period exists for the selected period."} icon={FileText} />
      </div>

      {!selectedPeriod ? (
        <EmptyRoster onCreate={() => setPeriodOpen(true)} canCreate={can("rostering.create_period")} />
      ) : (
        <>
          <RosterFilters care={care} wardId={wardId} setWardId={setWardId} role={role} setRole={setRole} />
          {view === "overview" && <Overview period={selectedPeriod} rows={rows} planned={planned} conflicts={conflicts} />}
          {view === "current" && <CurrentRoster rows={rows} />}
          {view === "periods" && <PeriodList periods={homePeriods} />}
          {view === "templates" && <ConfiguredState title="Roster Templates" message="Reusable roster templates are ready for configuration. Use Generate from Template once template lines are configured." />}
          {view === "requirements" && <RequirementView requirements={requirements} />}
          {view === "vacant" && <VacantView rows={vacantRows} />}
          {view === "pending" && <ShiftTable title="Pending Confirmation" shifts={pending} care={care} empty="No Shift Confirmations are outstanding." />}
          {view === "agency" && <ShiftTable title="Agency Cover" shifts={agency} care={care} empty="No Agency Cover requests exist for the selected period." />}
          {view === "conflicts" && <ConflictView conflicts={conflicts} />}
          {view === "availability" && <AvailabilityView care={care} planned={planned} />}
          {view === "changes" && <ChangesView events={care.rosterEvents.filter((event) => event.rosterPeriodId === selectedPeriod.id)} />}
          {view === "reports" && <ReportsView rows={rows} planned={planned} conflicts={conflicts} />}
          {view === "settings" && <SettingsView />}
        </>
      )}

      <PeriodDialog open={periodOpen} homeId={homeId} onOpenChange={setPeriodOpen} onSave={(input) => { try { const period = care.createRosterPeriod(input); setPeriodId(period.id); toast.success("Roster Period created."); setPeriodOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Roster Period could not be saved."); } }} />
      {selectedPeriod && <RequirementDialog open={requirementOpen} period={selectedPeriod} wards={care.wards} onOpenChange={setRequirementOpen} onSave={(input) => { try { care.addRosterShiftRequirement(input); toast.success("Required shift added."); setRequirementOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Roster Period could not be saved."); } }} />}
      {selectedPeriod && <ShiftDialog open={shiftOpen} period={selectedPeriod} requirements={requirements} planned={planned} onOpenChange={setShiftOpen} onSave={(input) => { try { care.assignPlannedShift(input); toast.success("Shift assignment saved."); setShiftOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Shift could not be assigned."); } }} />}
    </div>
  );
}

function EmptyRoster({ onCreate, canCreate }: { onCreate: () => void; canCreate: boolean }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">No Roster Period exists for the selected period.</h2>
        <p className="mt-1 text-sm text-muted-foreground">Create a Roster Period for this week before adding requirements or planned shifts.</p>
        {canCreate && <Button className="mt-4" onClick={onCreate}><Plus className="mr-2 h-4 w-4" /> Create Roster Period</Button>}
      </CardContent>
    </Card>
  );
}

function Overview({ period, rows, planned, conflicts }: { period: RosterPeriod; rows: RosterRow[]; planned: PlannedShift[]; conflicts: RosterConflict[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader><CardTitle>Coverage Summary · {period.name}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {rows.slice(0, 8).map((row) => <ShiftCard key={row.id} row={row} />)}
          {rows.length === 0 && <p className="text-sm text-muted-foreground">No Staffing Requirements have been added.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Operational Boundaries</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Rostering is planned staffing only. It does not confirm check-in, check-out, attendance, payroll or actual on-duty status.</p>
          <p>{planned.length} planned shift record{planned.length === 1 ? "" : "s"} in this period.</p>
          <p>{conflicts.length} unresolved readiness warning{conflicts.length === 1 ? "" : "s"} detected from configured source modules.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function CurrentRoster({ rows }: { rows: RosterRow[] }) {
  return <RosterRowsTable title="Current Roster - Week by Ward / Role" rows={rows} empty="No Planned Shifts match the selected filters." />;
}

function PeriodList({ periods }: { periods: RosterPeriod[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Roster Periods</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {periods.map((period) => (
          <div key={period.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <div><div className="font-medium">{period.name}</div><div className="text-muted-foreground">{period.dateFrom} - {period.dateTo} · Version {period.versionNumber}</div></div>
            <div className="flex flex-wrap gap-2"><Badge variant="outline">{title(period.status)}</Badge><Button size="sm" variant="outline"><Copy className="mr-1 h-3.5 w-3.5" /> Copy Previous</Button><Button size="sm" variant="outline"><Send className="mr-1 h-3.5 w-3.5" /> Submit</Button><Button size="sm" variant="outline"><Lock className="mr-1 h-3.5 w-3.5" /> Lock</Button></div>
          </div>
        ))}
        {periods.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No Roster Period exists for the selected period.</p>}
      </CardContent>
    </Card>
  );
}

function RequirementView({ requirements }: { requirements: RosterShiftRequirement[] }) {
  return <RequirementTable title="Staffing Requirements" requirements={requirements} empty="No Staffing Requirements have been added." />;
}

function VacantView({ rows }: { rows: RosterRow[] }) {
  return <RosterRowsTable title="Vacant and Partially Filled Shifts" rows={rows} empty="No Vacant Shifts remain for the selected period." />;
}

function AvailabilityView({ care, planned }: { care: ReturnType<typeof useCare>; planned: PlannedShift[] }) {
  const staffIds = new Set(planned.map((shift) => String(shift.assignedStaffMemberId || "")).filter(Boolean));
  const staff = care.staffMembers.filter((member) => staffIds.has(String(member.id)));
  return (
    <Card>
      <CardHeader><CardTitle>Staff Availability</CardTitle></CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((member) => {
          const memberShifts = planned.filter((shift) => shift.assignedStaffMemberId === member.id);
          const leave = care.staffLeaveRecords.filter((record) => record.staffMemberId === member.id && record.status === "approved");
          return <div key={member.id} className="rounded-lg border p-3 text-sm"><div className="font-medium">{member.displayName}</div><div className="text-muted-foreground">{memberShifts.length} planned shift(s)</div><div className={leave.length ? "text-amber-700" : "text-muted-foreground"}>{leave.length ? "Approved leave exists in source module" : "No approved leave conflicts found"}</div></div>;
        })}
        {staff.length === 0 && <p className="text-sm text-muted-foreground">No Staff Members are assigned in the selected period.</p>}
      </CardContent>
    </Card>
  );
}

function ConflictView({ conflicts }: { conflicts: RosterConflict[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Roster Conflicts</CardTitle></CardHeader>
      <CardContent><SimpleTable columns={["Staff Member", "Shift", "Conflict Type", "Severity", "Action"]} rows={conflicts.map((item) => [item.staffName, item.shiftLabel, item.type, item.severity, item.action])} empty="No Roster conflicts are currently unresolved." /></CardContent>
    </Card>
  );
}

function ChangesView({ events }: { events: any[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Roster Changes</CardTitle></CardHeader>
      <CardContent><SimpleTable columns={["Date/Time", "Event", "Status", "Record"]} rows={events.map((event) => [formatDateTime(event.occurredAt), title(event.type), event.status ? title(event.status) : "-", event.plannedShiftId || event.rosterShiftRequirementId || event.rosterPeriodId])} empty="No roster changes are recorded for this period." /></CardContent>
    </Card>
  );
}

function ReportsView({ rows, planned, conflicts }: { rows: RosterRow[]; planned: PlannedShift[]; conflicts: RosterConflict[] }) {
  const reports = [
    ["Roster Coverage", rows.length],
    ["Vacant Shifts", rows.filter((row) => row.vacant > 0).length],
    ["Partially Filled Shifts", rows.filter((row) => row.filled > 0 && row.vacant > 0).length],
    ["Pending Confirmation", planned.filter((shift) => shift.confirmationRequired && shift.status === "assigned").length],
    ["Roster Conflicts", conflicts.length],
    ["Agency Cover", planned.filter((shift: any) => shift.agencyCoverRequired || shift.agencyAssignmentId).length],
  ];
  return <Card><CardHeader><CardTitle>Roster Reports</CardTitle></CardHeader><CardContent><SimpleTable columns={["Report", "Records"]} rows={reports.map(([label, count]) => [String(label), String(count)])} empty="No roster report records match the selected filters." /></CardContent></Card>;
}

function SettingsView() {
  return (
    <Card>
      <CardHeader><CardTitle>Rostering Settings</CardTitle></CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {["Week Start Day", "Default Roster Period Length", "Confirmation Required Policy", "Approval Requirement", "Roster Lock Timing", "Planned Hours Warning Thresholds", "Leave Conflict Policy", "Training Conflict Policy", "Registration Conflict Policy", "Competency Conflict Policy"].map((label) => (
          <div key={label} className="rounded-lg border p-3 text-sm"><div className="font-medium">{label}</div><div className="text-muted-foreground">Not Configured</div></div>
        ))}
      </CardContent>
    </Card>
  );
}

function ConfiguredState({ title: tableTitle, message }: { title: string; message: string }) {
  return <Card><CardHeader><CardTitle>{tableTitle}</CardTitle></CardHeader><CardContent className="py-8 text-sm text-muted-foreground">{message}</CardContent></Card>;
}

function PeriodDialog({ open, homeId, onOpenChange, onSave }: { open: boolean; homeId: string; onOpenChange: (open: boolean) => void; onSave: (input: CreateRosterPeriodCommand) => void }) {
  const [form, setForm] = useState<CreateRosterPeriodCommand>({ nursingHomeId: homeId, name: "Weekly Roster", dateFrom: weekStart(), dateTo: addDays(weekStart(), 6), status: "draft" });
  const set = (key: keyof CreateRosterPeriodCommand, value: string) => setForm((current) => ({ ...current, nursingHomeId: homeId, [key]: value || undefined }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Create Roster Period</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Name"><Input value={form.name} onChange={(event) => set("name", event.target.value)} /></Field><Field label="Start Date"><Input type="date" value={form.dateFrom} onChange={(event) => set("dateFrom", event.target.value)} /></Field><Field label="End Date"><Input type="date" value={form.dateTo} onChange={(event) => set("dateTo", event.target.value)} /></Field><Field label="Status"><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["draft", "open_for_planning", "pending_approval", "approved", "published"].map((item) => <SelectItem key={item} value={item}>{title(item)}</SelectItem>)}</SelectContent></Select></Field><Field label="Notes"><Input value={form.notes || ""} onChange={(event) => set("notes", event.target.value)} /></Field></div><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave({ ...form, nursingHomeId: homeId })}>Create</Button></div></DialogContent></Dialog>;
}

function RequirementDialog({ open, period, wards, onOpenChange, onSave }: { open: boolean; period: RosterPeriod; wards: any[]; onOpenChange: (open: boolean) => void; onSave: (input: AddRosterShiftRequirementCommand) => void }) {
  const [form, setForm] = useState<AddRosterShiftRequirementCommand>({ rosterPeriodId: period.id, nursingHomeId: String(period.nursingHomeId), shiftDate: period.dateFrom, startAt: `${period.dateFrom}T08:00`, endAt: `${period.dateFrom}T20:00`, roleKey: "NURSE", requiredCount: 1 });
  const set = (key: keyof AddRosterShiftRequirementCommand, value: string) => setForm((current) => ({ ...current, rosterPeriodId: period.id, nursingHomeId: String(period.nursingHomeId), [key]: key === "requiredCount" ? Number(value) || 1 : value || undefined }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Required Shift</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Date"><Input type="date" value={form.shiftDate} onChange={(event) => { const date = event.target.value; setForm((current) => ({ ...current, shiftDate: date, startAt: `${date}T08:00`, endAt: `${date}T20:00` })); }} /></Field><Field label="Ward"><Select value={form.wardId || "none"} onValueChange={(value) => set("wardId", value === "none" ? "" : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Whole Home</SelectItem>{wards.map((ward) => <SelectItem key={ward.id} value={ward.id}>{ward.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Role"><Select value={form.roleKey} onValueChange={(value) => set("roleKey", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roleOptions.map((item) => <SelectItem key={item} value={item}>{title(item)}</SelectItem>)}</SelectContent></Select></Field><Field label="Start"><Input type="datetime-local" value={form.startAt} onChange={(event) => set("startAt", event.target.value)} /></Field><Field label="End"><Input type="datetime-local" value={form.endAt} onChange={(event) => set("endAt", event.target.value)} /></Field><Field label="Required Count"><Input type="number" min={1} value={form.requiredCount} onChange={(event) => set("requiredCount", event.target.value)} /></Field></div><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Save</Button></div></DialogContent></Dialog>;
}

function ShiftDialog({ open, period, requirements, planned, onOpenChange, onSave }: { open: boolean; period: RosterPeriod; requirements: RosterShiftRequirement[]; planned: PlannedShift[]; onOpenChange: (open: boolean) => void; onSave: (input: AssignPlannedShiftCommand) => void }) {
  const care = useCare();
  const firstReq = requirements[0];
  const [form, setForm] = useState<AssignPlannedShiftCommand>({ rosterPeriodId: period.id, requirementId: firstReq?.id, nursingHomeId: String(period.nursingHomeId), roleKey: firstReq?.roleKey || "NURSE", startAt: firstReq?.startAt || `${period.dateFrom}T08:00`, endAt: firstReq?.endAt || `${period.dateFrom}T20:00`, status: "assigned", confirmationRequired: true });
  const set = (key: keyof AssignPlannedShiftCommand, value: string | boolean) => setForm((current) => ({ ...current, rosterPeriodId: period.id, nursingHomeId: String(period.nursingHomeId), [key]: value || undefined }));
  const candidates = care.staffMembers.filter((staff) => staff.active !== false && staff.status !== "inactive").map((staff) => evaluateCandidate(care, staff, form, planned));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Assign Staff to Planned Shift</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Requirement"><Select value={form.requirementId || "none"} onValueChange={(value) => { const req = requirements.find((item) => item.id === value); setForm((current) => ({ ...current, requirementId: value === "none" ? undefined : value, roleKey: req?.roleKey || current.roleKey, wardId: req?.wardId || current.wardId, startAt: req?.startAt || current.startAt, endAt: req?.endAt || current.endAt })); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No linked requirement</SelectItem>{requirements.map((req) => <SelectItem key={req.id} value={req.id}>{req.shiftDate} · {title(req.roleKey)} · {req.requiredCount}</SelectItem>)}</SelectContent></Select></Field><Field label="Staff Member"><Select value={form.assignedStaffMemberId || "vacant"} onValueChange={(value) => set("assignedStaffMemberId", value === "vacant" ? "" : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="vacant">Vacant</SelectItem>{candidates.map((candidate) => <SelectItem key={candidate.staff.id} value={candidate.staff.id}>{candidate.staff.displayName} · {candidate.eligible ? "Eligible" : "Blocked"}</SelectItem>)}</SelectContent></Select></Field><Field label="Role"><Select value={form.roleKey} onValueChange={(value) => set("roleKey", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roleOptions.map((item) => <SelectItem key={item} value={item}>{title(item)}</SelectItem>)}</SelectContent></Select></Field><Field label="Start"><Input type="datetime-local" value={form.startAt} onChange={(event) => set("startAt", event.target.value)} /></Field><Field label="End"><Input type="datetime-local" value={form.endAt} onChange={(event) => set("endAt", event.target.value)} /></Field><Field label="Status"><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["assigned", "to_be_confirmed", "confirmed", "published", "vacant"].map((item) => <SelectItem key={item} value={item}>{title(item)}</SelectItem>)}</SelectContent></Select></Field></div><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.confirmationRequired)} onChange={(event) => set("confirmationRequired", event.target.checked)} /> Confirmation required</label><div className="mt-4 rounded-lg border"><div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">Eligible Staff and Readiness</div><div className="max-h-56 divide-y overflow-auto">{candidates.map((candidate) => <div key={candidate.staff.id} className="flex items-start justify-between gap-3 px-3 py-2 text-sm"><div><div className="font-medium">{candidate.staff.displayName}</div><div className="text-xs text-muted-foreground">{candidate.issues.length ? candidate.issues.join(" · ") : "Ready from configured sources"}</div></div><Badge variant={candidate.eligible ? "default" : "destructive"}>{candidate.eligible ? "Eligible" : "Blocked"}</Badge></div>)}</div></div><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Save Shift</Button></div></DialogContent></Dialog>;
}

type RosterRow = { id: string; date: string; role: string; ward: string; start: string; end: string; required: number; filled: number; vacant: number; pending: number; staff: string[]; status: string; agency: number; warnings: string[] };
type RosterConflict = { staffName: string; shiftLabel: string; type: string; severity: string; action: string };

function buildRosterRows(requirements: RosterShiftRequirement[], planned: PlannedShift[]): RosterRow[] {
  const requirementRows = requirements.map((requirement) => {
    const shifts = planned.filter((shift) => shift.requirementId === requirement.id);
    const filled = shifts.filter((shift) => shift.assignedStaffMemberId && ["assigned", "to_be_confirmed", "confirmed", "published"].includes(shift.status)).length;
    const pending = shifts.filter((shift) => shift.status === "to_be_confirmed" || (shift.confirmationRequired && shift.status === "assigned")).length;
    const explicitVacant = shifts.filter((shift) => shift.status === "vacant").length;
    const vacant = Math.max(0, requirement.requiredCount - filled) + explicitVacant;
    return { id: requirement.id, date: requirement.shiftDate, role: requirement.roleKey, ward: String(requirement.wardId || "Whole Home"), start: requirement.startAt, end: requirement.endAt, required: requirement.requiredCount, filled, vacant, pending, staff: shifts.map((shift) => String(shift.assignedStaffMemberId || "Vacant")), status: vacant ? (filled ? "partially_filled" : "vacant") : "filled", agency: shifts.filter((shift: any) => shift.agencyCoverRequired || shift.agencyAssignmentId).length, warnings: shifts.flatMap((shift: any) => shift.readinessIssues || []) };
  });
  const standalone = planned.filter((shift) => !shift.requirementId).map((shift) => ({ id: shift.id, date: shift.startAt.slice(0, 10), role: shift.roleKey, ward: String(shift.wardId || "Whole Home"), start: shift.startAt, end: shift.endAt, required: 1, filled: shift.assignedStaffMemberId ? 1 : 0, vacant: shift.assignedStaffMemberId ? 0 : 1, pending: shift.confirmationRequired ? 1 : 0, staff: [String(shift.assignedStaffMemberId || "Vacant")], status: shift.status, agency: (shift as any).agencyCoverRequired ? 1 : 0, warnings: [] }));
  return [...requirementRows, ...standalone].sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
}

function rosterConflicts(care: ReturnType<typeof useCare>, shift: PlannedShift): RosterConflict[] {
  if (!shift.assignedStaffMemberId) return [];
  const staffNameValue = staffName(care, String(shift.assignedStaffMemberId));
  const label = `${shift.startAt.slice(0, 10)} ${shift.startAt.slice(11, 16)}-${shift.endAt.slice(11, 16)}`;
  const conflicts: RosterConflict[] = [];
  if (care.staffLeaveRecords.some((leave) => leave.staffMemberId === shift.assignedStaffMemberId && leave.status === "approved" && leave.startAt < shift.endAt && leave.endAt > shift.startAt)) conflicts.push({ staffName: staffNameValue, shiftLabel: label, type: "Approved Leave", severity: "blocking", action: "Replace Staff" });
  if (care.plannedShifts.some((other) => other.id !== shift.id && other.assignedStaffMemberId === shift.assignedStaffMemberId && !["cancelled", "entered_in_error", "replaced"].includes(other.status) && other.startAt < shift.endAt && other.endAt > shift.startAt)) conflicts.push({ staffName: staffNameValue, shiftLabel: label, type: "Shift Overlap", severity: "blocking", action: "Replace Staff" });
  if (!care.employmentRecords.some((record) => record.staffMemberId === shift.assignedStaffMemberId && ["active", "on_leave"].includes(record.status) && record.startDate <= shift.startAt.slice(0, 10) && (!record.endDate || record.endDate >= shift.startAt.slice(0, 10)))) conflicts.push({ staffName: staffNameValue, shiftLabel: label, type: "Employment inactive", severity: "blocking", action: "Resolve Data Issue" });
  return conflicts;
}

function evaluateCandidate(care: ReturnType<typeof useCare>, staff: StaffMember, shift: AssignPlannedShiftCommand, planned: PlannedShift[]) {
  const issues: string[] = [];
  const day = shift.startAt.slice(0, 10);
  const employment = care.employmentRecords.some((record) => record.staffMemberId === staff.id && ["active", "on_leave"].includes(record.status) && record.startDate <= day && (!record.endDate || record.endDate >= day));
  if (!employment) issues.push("Employment inactive or missing");
  const leave = care.staffLeaveRecords.some((record) => record.staffMemberId === staff.id && record.status === "approved" && record.startAt < shift.endAt && record.endAt > shift.startAt);
  if (leave) issues.push("Approved Leave conflict");
  const overlap = planned.some((existing) => existing.assignedStaffMemberId === staff.id && !["cancelled", "entered_in_error", "replaced"].includes(existing.status) && existing.startAt < shift.endAt && existing.endAt > shift.startAt);
  if (overlap) issues.push("Shift overlap");
  if (!care.staffTrainingAssignments.length) issues.push("Training source not configured");
  if (!care.professionalRegistrations.length) issues.push("Registration source not configured");
  return { staff, eligible: employment && !leave && !overlap, issues };
}

function RosterFilters({ care, wardId, setWardId, role, setRole }: { care: ReturnType<typeof useCare>; wardId: string; setWardId: (value: string) => void; role: string; setRole: (value: string) => void }) {
  return <div className="flex flex-wrap gap-2"><Select value={wardId} onValueChange={setWardId}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Wards</SelectItem>{care.wards.map((ward) => <SelectItem key={ward.id} value={ward.id}>{ward.name}</SelectItem>)}</SelectContent></Select><Select value={role} onValueChange={setRole}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Roles</SelectItem>{roleOptions.map((item) => <SelectItem key={item} value={item}>{title(item)}</SelectItem>)}</SelectContent></Select></div>;
}

function Metric({ title: label, value, suffix = "", availability, explanation, icon: Icon, tone = "default" }: { title: string; value?: number; suffix?: string; availability: string; explanation: string; icon: any; tone?: "default" | "warn" }) {
  const unavailable = availability !== "available";
  return <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Icon className={tone === "warn" ? "h-4 w-4 text-amber-600" : "h-4 w-4 text-primary"} />{label}</div><div className="mt-2 text-2xl font-semibold">{unavailable ? "No Roster Available" : `${value ?? 0}${suffix}`}</div><p className="mt-1 text-xs text-muted-foreground">{unavailable ? explanation : explanation}</p></CardContent></Card>;
}

function ShiftCard({ row }: { row: RosterRow }) {
  return <div className="rounded-lg border p-3 text-sm"><div className="flex items-start justify-between gap-2"><div><div className="font-semibold">{title(row.role)}</div><div className="text-xs text-muted-foreground">{row.date} · {row.start.slice(11, 16)}-{row.end.slice(11, 16)}</div></div><Badge variant={row.vacant ? "destructive" : row.pending ? "secondary" : "default"}>{title(row.status)}</Badge></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><span>Req {row.required}</span><span>Filled {row.filled}</span><span>Vacant {row.vacant}</span></div></div>;
}

function RosterRowsTable({ title: tableTitle, rows, empty }: { title: string; rows: RosterRow[]; empty: string }) {
  return <Card><CardHeader><CardTitle>{tableTitle}</CardTitle></CardHeader><CardContent><SimpleTable columns={["Date", "Ward", "Role", "Required", "Filled", "Vacant", "Pending", "Status"]} rows={rows.map((row) => [row.date, row.ward, title(row.role), String(row.required), String(row.filled), String(row.vacant), String(row.pending), title(row.status)])} empty={empty} /></CardContent></Card>;
}

function RequirementTable({ title: tableTitle, requirements, empty }: { title: string; requirements: RosterShiftRequirement[]; empty: string }) {
  return <Card><CardHeader><CardTitle>{tableTitle}</CardTitle></CardHeader><CardContent><SimpleTable columns={["Date", "Ward", "Role", "Required", "Time", "Status"]} rows={requirements.map((row) => [row.shiftDate, String(row.wardId || "Whole Home"), title(row.roleKey), String(row.requiredCount), `${row.startAt.slice(11, 16)}-${row.endAt.slice(11, 16)}`, title(row.status)])} empty={empty} /></CardContent></Card>;
}

function ShiftTable({ title: tableTitle, shifts, care, empty }: { title: string; shifts: PlannedShift[]; care: ReturnType<typeof useCare>; empty: string }) {
  return <Card><CardHeader><CardTitle>{tableTitle}</CardTitle></CardHeader><CardContent><SimpleTable columns={["Date", "Staff", "Role", "Time", "Status"]} rows={shifts.map((shift) => [shift.startAt.slice(0, 10), staffName(care, String(shift.assignedStaffMemberId || "")), title(shift.roleKey), `${shift.startAt.slice(11, 16)}-${shift.endAt.slice(11, 16)}`, title(shift.status)])} empty={empty} /></CardContent></Card>;
}

function SimpleTable({ columns, rows, empty }: { columns: string[]; rows: string[][]; empty: string }) {
  return <div className="overflow-hidden rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr>{columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-t">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3">{cell}</td>)}</tr>)}{rows.length === 0 && <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted-foreground">{empty}</td></tr>}</tbody></table></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function staffName(care: ReturnType<typeof useCare>, id: string) {
  return care.staffMembers.find((staff) => String(staff.id) === id)?.displayName || "Vacant";
}

function viewFromPath(pathname: string): RosterView {
  const last = pathname.split("/").filter(Boolean).at(-1);
  if (!last || last === "rostering") return "overview";
  return (viewLinks.some((item) => item.view === last) ? last : "overview") as RosterView;
}

function weekStart() {
  const date = new Date();
  const day = date.getDay();
  date.setDate(date.getDate() - ((day + 6) % 7));
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function metricExplanation(explanation: string) {
  return explanation.replace("published or approved roster", "approved, published, locked or closed roster");
}
