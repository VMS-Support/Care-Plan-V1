import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { getRosterOverviewMetrics, type AddRosterShiftRequirementCommand, type AssignPlannedShiftCommand, type CreateRosterPeriodCommand } from "@/domain/workforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/workforce/rostering")({
  head: () => ({ meta: [{ title: "Rostering - NuCare" }] }),
  component: RosteringWorkspace,
});

const roleOptions = ["NURSE", "CNM", "HCA", "DOCTOR", "ALLIED_HEALTH", "HOUSEKEEPING", "KITCHEN", "MAINTENANCE", "ADMINISTRATION", "OPERATIONS", "OTHER"];

function RosteringWorkspace() {
  const care = useCare();
  const [homeId, setHomeId] = useState(care.activeFacilityId);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [requirementOpen, setRequirementOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const can = (capability: string) => care.canAccess(capability, { nursingHomeId: homeId });
  const selectedPeriod = care.rosterPeriods.find((period) => period.nursingHomeId === homeId) || care.rosterPeriods[0];
  const dateFrom = selectedPeriod?.dateFrom || new Date().toISOString().slice(0, 10);
  const dateTo = selectedPeriod?.dateTo || dateFrom;
  const metrics = getRosterOverviewMetrics({ periods: care.rosterPeriods, requirements: care.rosterShiftRequirements, plannedShifts: care.plannedShifts, nursingHomeId: homeId, dateFrom, dateTo });
  const periodIds = new Set(metrics.periodIds);
  const requirements = care.rosterShiftRequirements.filter((requirement) => periodIds.has(requirement.rosterPeriodId) || requirement.rosterPeriodId === selectedPeriod?.id);
  const planned = care.plannedShifts.filter((shift) => periodIds.has(shift.rosterPeriodId) || shift.rosterPeriodId === selectedPeriod?.id);
  const vacant = planned.filter((shift) => shift.status === "vacant");
  const pending = planned.filter((shift) => shift.status === "to_be_confirmed" || (shift.confirmationRequired && shift.status === "assigned"));
  const days = useMemo(() => {
    const unique = new Set([...requirements.map((item) => item.shiftDate), ...planned.map((shift) => shift.startAt.slice(0, 10))]);
    return [...unique].sort();
  }, [requirements, planned]);

  if (!can("rostering.view")) {
    return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have access to Rostering.</CardContent></Card></div>;
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rostering</h1>
          <p className="text-sm text-muted-foreground">Roster periods, required shifts, planned assignments, vacancies and confirmations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={homeId} onValueChange={setHomeId}><SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger><SelectContent>{care.facilities.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select>
          {can("rostering.create_period") && <Button variant="outline" onClick={() => setPeriodOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create Period</Button>}
          {selectedPeriod && can("rostering.add_requirement") && <Button variant="outline" onClick={() => setRequirementOpen(true)}>Add Required Shift</Button>}
          {selectedPeriod && can("rostering.assign_shift") && <Button onClick={() => setShiftOpen(true)}>Assign Shift</Button>}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric title="Total Shifts" metric={metrics.totalShifts} />
        <Metric title="Filled Shifts" metric={metrics.filledShifts} />
        <Metric title="Vacant Shifts" metric={metrics.vacantShifts} />
        <Metric title="To Be Confirmed" metric={metrics.toBeConfirmed} />
      </div>

      <Card>
        <CardHeader><CardTitle>Roster Periods</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {care.rosterPeriods.filter((period) => period.nursingHomeId === homeId).map((period) => <div key={period.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"><div><div className="font-medium">{period.name}</div><div className="text-muted-foreground">{period.dateFrom} - {period.dateTo} - Version {period.versionNumber}</div></div><Badge variant="outline">{title(period.status)}</Badge></div>)}
          {care.rosterPeriods.filter((period) => period.nursingHomeId === homeId).length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No Roster Period exists for the selected week.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Weekly View</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {days.map((day) => <div key={day} className="rounded-lg border p-3 text-sm"><div className="font-semibold">{day}</div><div className="mt-2 text-muted-foreground">Required: {requirements.filter((item) => item.shiftDate === day).reduce((sum, item) => sum + item.requiredCount, 0)}</div><div className="text-muted-foreground">Planned: {planned.filter((shift) => shift.startAt.startsWith(day)).length}</div><div className="text-muted-foreground">Vacant: {planned.filter((shift) => shift.startAt.startsWith(day) && shift.status === "vacant").length}</div></div>)}
          {days.length === 0 && <p className="text-sm text-muted-foreground">No Required Shifts have been added.</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <RosterTable title="Required Shifts" rows={requirements.map((item) => ({ id: item.id, date: item.shiftDate, role: item.roleKey, count: item.requiredCount, status: item.status, detail: `${item.startAt} - ${item.endAt}` }))} empty="No Required Shifts have been added." />
        <RosterTable title="Planned Shifts" rows={planned.map((shift) => ({ id: shift.id, date: shift.startAt.slice(0, 10), role: shift.roleKey, count: 1, status: shift.status, detail: `${shift.startAt.slice(11, 16)} - ${shift.endAt.slice(11, 16)} ${shift.assignedStaffMemberId ? staffName(care, String(shift.assignedStaffMemberId)) : "Vacant"}` }))} empty="No Vacant Shifts remain for the selected period." />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RosterTable title="Vacant Shifts" rows={vacant.map((shift) => ({ id: shift.id, date: shift.startAt.slice(0, 10), role: shift.roleKey, count: 1, status: shift.status, detail: `${shift.startAt.slice(11, 16)} - ${shift.endAt.slice(11, 16)}` }))} empty="No Vacant Shifts remain for the selected period." />
        <RosterTable title="Pending Confirmation" rows={pending.map((shift) => ({ id: shift.id, date: shift.startAt.slice(0, 10), role: shift.roleKey, count: 1, status: shift.status, detail: `${staffName(care, String(shift.assignedStaffMemberId || ""))} - confirmation outstanding` }))} empty="No Shift Confirmations are outstanding." />
      </div>

      <Card>
        <CardHeader><CardTitle>Readiness Boundaries</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Roster assignments store readiness flags for home assignment, professional registration, competency and leave conflicts. Attendance, payroll export, agency commercial management and final safe-staffing decisions are intentionally outside this workspace.</CardContent>
      </Card>

      <PeriodDialog open={periodOpen} homeId={homeId} onOpenChange={setPeriodOpen} onSave={(input) => { try { care.createRosterPeriod(input); toast.success("Roster Period created."); setPeriodOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Roster could not be loaded."); } }} />
      {selectedPeriod && <RequirementDialog open={requirementOpen} period={selectedPeriod} onOpenChange={setRequirementOpen} onSave={(input) => { try { care.addRosterShiftRequirement(input); toast.success("Required shift added."); setRequirementOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Shift could not be assigned."); } }} />}
      {selectedPeriod && <ShiftDialog open={shiftOpen} period={selectedPeriod} requirements={requirements} onOpenChange={setShiftOpen} onSave={(input) => { try { care.assignPlannedShift(input); toast.success("Shift assignment saved."); setShiftOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Shift could not be assigned."); } }} />}
    </div>
  );
}

function PeriodDialog({ open, homeId, onOpenChange, onSave }: { open: boolean; homeId: string; onOpenChange: (open: boolean) => void; onSave: (input: CreateRosterPeriodCommand) => void }) {
  const [form, setForm] = useState<CreateRosterPeriodCommand>({ nursingHomeId: homeId, name: "Weekly Roster", dateFrom: new Date().toISOString().slice(0, 10), dateTo: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10), status: "draft" });
  const set = (key: keyof CreateRosterPeriodCommand, value: string) => setForm((current) => ({ ...current, nursingHomeId: homeId, [key]: value || undefined }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Create Roster Period</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Name"><Input value={form.name} onChange={(event) => set("name", event.target.value)} /></Field><Field label="Date From"><Input type="date" value={form.dateFrom} onChange={(event) => set("dateFrom", event.target.value)} /></Field><Field label="Date To"><Input type="date" value={form.dateTo} onChange={(event) => set("dateTo", event.target.value)} /></Field><Field label="Status"><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["draft", "open_for_planning", "pending_approval", "approved", "published"].map((item) => <SelectItem key={item} value={item}>{title(item)}</SelectItem>)}</SelectContent></Select></Field></div><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave({ ...form, nursingHomeId: homeId })}>Create</Button></div></DialogContent></Dialog>;
}

function RequirementDialog({ open, period, onOpenChange, onSave }: { open: boolean; period: any; onOpenChange: (open: boolean) => void; onSave: (input: AddRosterShiftRequirementCommand) => void }) {
  const [form, setForm] = useState<AddRosterShiftRequirementCommand>({ rosterPeriodId: period.id, nursingHomeId: period.nursingHomeId, shiftDate: period.dateFrom, startAt: `${period.dateFrom}T08:00`, endAt: `${period.dateFrom}T20:00`, roleKey: "NURSE", requiredCount: 1 });
  const set = (key: keyof AddRosterShiftRequirementCommand, value: string) => setForm((current) => ({ ...current, rosterPeriodId: period.id, nursingHomeId: period.nursingHomeId, [key]: key === "requiredCount" ? Number(value) || 1 : value || undefined }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Required Shift</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Date"><Input type="date" value={form.shiftDate} onChange={(event) => { const date = event.target.value; setForm((current) => ({ ...current, shiftDate: date, startAt: `${date}T08:00`, endAt: `${date}T20:00` })); }} /></Field><Field label="Role"><Select value={form.roleKey} onValueChange={(value) => set("roleKey", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roleOptions.map((role) => <SelectItem key={role} value={role}>{title(role)}</SelectItem>)}</SelectContent></Select></Field><Field label="Start"><Input type="datetime-local" value={form.startAt} onChange={(event) => set("startAt", event.target.value)} /></Field><Field label="End"><Input type="datetime-local" value={form.endAt} onChange={(event) => set("endAt", event.target.value)} /></Field><Field label="Required Count"><Input type="number" value={form.requiredCount} onChange={(event) => set("requiredCount", event.target.value)} /></Field></div><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Save</Button></div></DialogContent></Dialog>;
}

function ShiftDialog({ open, period, requirements, onOpenChange, onSave }: { open: boolean; period: any; requirements: any[]; onOpenChange: (open: boolean) => void; onSave: (input: AssignPlannedShiftCommand) => void }) {
  const care = useCare();
  const firstReq = requirements[0];
  const [form, setForm] = useState<AssignPlannedShiftCommand>({ rosterPeriodId: period.id, requirementId: firstReq?.id, nursingHomeId: period.nursingHomeId, roleKey: firstReq?.roleKey || "NURSE", startAt: firstReq?.startAt || `${period.dateFrom}T08:00`, endAt: firstReq?.endAt || `${period.dateFrom}T20:00`, status: "assigned", confirmationRequired: true });
  const set = (key: keyof AssignPlannedShiftCommand, value: string | boolean) => setForm((current) => ({ ...current, rosterPeriodId: period.id, nursingHomeId: period.nursingHomeId, [key]: value || undefined }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Assign Shift</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Requirement"><Select value={form.requirementId || ""} onValueChange={(value) => { const req = requirements.find((item) => item.id === value); setForm((current) => ({ ...current, requirementId: value, roleKey: req?.roleKey || current.roleKey, startAt: req?.startAt || current.startAt, endAt: req?.endAt || current.endAt })); }}><SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger><SelectContent>{requirements.map((req) => <SelectItem key={req.id} value={req.id}>{req.shiftDate} {req.roleKey}</SelectItem>)}</SelectContent></Select></Field><Field label="Staff Member"><Select value={form.assignedStaffMemberId || "vacant"} onValueChange={(value) => set("assignedStaffMemberId", value === "vacant" ? "" : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="vacant">Vacant</SelectItem>{care.staffMembers.map((staff) => <SelectItem key={staff.id} value={staff.id}>{staff.displayName}</SelectItem>)}</SelectContent></Select></Field><Field label="Role"><Select value={form.roleKey} onValueChange={(value) => set("roleKey", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roleOptions.map((role) => <SelectItem key={role} value={role}>{title(role)}</SelectItem>)}</SelectContent></Select></Field><Field label="Start"><Input type="datetime-local" value={form.startAt} onChange={(event) => set("startAt", event.target.value)} /></Field><Field label="End"><Input type="datetime-local" value={form.endAt} onChange={(event) => set("endAt", event.target.value)} /></Field><Field label="Status"><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["assigned", "to_be_confirmed", "confirmed", "published", "vacant"].map((item) => <SelectItem key={item} value={item}>{title(item)}</SelectItem>)}</SelectContent></Select></Field></div><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.confirmationRequired)} onChange={(event) => set("confirmationRequired", event.target.checked)} /> Confirmation required</label><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Save Shift</Button></div></DialogContent></Dialog>;
}

function Metric({ title, metric }: { title: string; metric: { value?: number; availability: string; explanation: string } }) {
  return <Card><CardContent className="p-4"><div className="text-xs font-medium text-muted-foreground">{title}</div><div className="mt-2 text-2xl font-semibold">{metric.value ?? "No Roster Available"}</div><p className="mt-1 text-xs text-muted-foreground">{metric.explanation}</p></CardContent></Card>;
}

function RosterTable({ title: tableTitle, rows, empty }: { title: string; rows: { id: string; date: string; role: string; count: number; status: string; detail: string }[]; empty: string }) {
  return <Card><CardHeader><CardTitle>{tableTitle}</CardTitle></CardHeader><CardContent><div className="overflow-hidden rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Count</th><th className="px-4 py-3">Detail</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="px-4 py-3">{row.date}</td><td className="px-4 py-3">{row.role}</td><td className="px-4 py-3">{row.count}</td><td className="px-4 py-3">{row.detail}</td><td className="px-4 py-3"><Badge variant="outline">{title(row.status)}</Badge></td></tr>)}{rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">{empty}</td></tr>}</tbody></table></div></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function staffName(care: ReturnType<typeof useCare>, id: string) {
  return care.staffMembers.find((staff) => String(staff.id) === id)?.displayName || "Vacant";
}

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
