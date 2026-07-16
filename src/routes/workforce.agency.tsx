import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCare } from "@/lib/care/store";
import type { AgencyShiftAssignment, AgencyTimesheet } from "@/lib/care/types";
import { getAgencySpendHighMetric, getAgencySpendMetric, getAgencyStaffTodayMetric, getAgencyWte, type AssignAgencyWorkerToShiftCommand, type CreateAgencyCompanyCommand, type CreateAgencyWorkerCommand, type RecordAgencyTimesheetCommand } from "@/domain/workforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/workforce/agency")({
  head: () => ({ meta: [{ title: "Agency Management - NuCare" }] }),
  component: AgencyManagementWorkspace,
});

const roles = ["NURSE", "CNM", "HCA", "HOUSEKEEPING", "KITCHEN", "MAINTENANCE", "ADMINISTRATION", "OTHER"];

function AgencyManagementWorkspace() {
  const care = useCare();
  const [homeId, setHomeId] = useState(care.activeFacilityId);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [workerOpen, setWorkerOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [timesheetOpen, setTimesheetOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const monthFrom = `${today.slice(0, 7)}-01`;
  const can = (capability: string) => care.canAccess(capability, { nursingHomeId: homeId });
  const assignments = care.agencyShiftAssignments.filter((assignment) => assignment.nursingHomeId === homeId);
  const timesheets = care.agencyTimesheets.filter((timesheet) => timesheet.nursingHomeId === homeId);
  const staffToday = getAgencyStaffTodayMetric({ assignments: care.agencyShiftAssignments, nursingHomeId: homeId, localDate: today });
  const spend = getAgencySpendMetric({ timesheets: care.agencyTimesheets, nursingHomeId: homeId, dateFrom: monthFrom, dateTo: today });
  const high = getAgencySpendHighMetric({ spendMinor: spend.value, policies: care.agencySpendAlertPolicies, nursingHomeId: homeId, date: today });
  const wte = getAgencyWte({ timesheets: care.agencyTimesheets, nursingHomeId: homeId, dateFrom: monthFrom, dateTo: today, standardWeeklyHours: 39 });
  const pendingTimesheets = timesheets.filter((timesheet) => timesheet.status !== "approved" && timesheet.status !== "cancelled" && timesheet.status !== "entered_in_error");

  if (!can("agency.view")) {
    return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have access to Agency Management.</CardContent></Card></div>;
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agency Management</h1>
          <p className="text-sm text-muted-foreground">Approved suppliers, agency workers, assignments, timesheets, spend and WTE visibility.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={homeId} onValueChange={setHomeId}><SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger><SelectContent>{care.facilities.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select>
          {can("agency.manage_companies") && <Button variant="outline" onClick={() => setCompanyOpen(true)}><Plus className="mr-2 h-4 w-4" /> Company</Button>}
          {can("agency.manage_workers") && <Button variant="outline" onClick={() => setWorkerOpen(true)}>Worker</Button>}
          {can("agency.assign_worker") && <Button variant="outline" onClick={() => setAssignmentOpen(true)}>Assign</Button>}
          {can("agency.record_timesheet") && <Button onClick={() => setTimesheetOpen(true)}>Timesheet</Button>}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric title="Agency Staff Today" value={staffToday.value} detail={`${staffToday.agencyShiftCount} shifts, ${staffToday.currentlyOnShiftCount} currently on shift.`} />
        <Metric title="Approved Spend MTD" value={money(spend.approvedSpend.amountMinor, spend.approvedSpend.currencyCode)} detail={spend.explanation} />
        <Metric title="Spend Status" value={title(high.status)} detail={high.explanation} />
        <Metric title="Agency WTE MTD" value={wte.value ?? 0} detail={`${wte.hours} approved agency hours.`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SimpleList title="Agency Companies" empty="No agency companies have been recorded.">{care.agencyCompanies.map((company) => <Row key={company.id} title={company.name} detail={company.contactName || company.contactEmail || "Approved supplier"} badge={company.status} />)}</SimpleList>
        <SimpleList title="Agency Workers" empty="No agency workers have been recorded.">{care.agencyWorkers.map((worker) => <Row key={worker.id} title={staffName(care, worker.staffMemberId)} detail={`${companyName(care, worker.agencyCompanyId)} - ${worker.primaryRoleKey}`} badge={worker.complianceApproved ? "compliance approved" : "compliance pending"} />)}</SimpleList>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AssignmentTable title="Assignments" rows={assignments} empty="No agency assignments are scheduled for this home." />
        <TimesheetTable title="Timesheets" rows={pendingTimesheets} empty="No pending agency timesheets." action={(timesheet) => can("agency.approve_timesheet") && <Button size="sm" variant="outline" onClick={() => approveTimesheet(care, timesheet.id)}>Approve</Button>} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <TimesheetTable title="Approved Spend History" rows={timesheets.filter((timesheet) => timesheet.status === "approved")} empty="No approved agency spend has been recorded." />
        <SimpleList title="Disputes Boundary" empty="No disputed timesheets.">{timesheets.filter((timesheet) => timesheet.status === "disputed").map((timesheet) => <Row key={timesheet.id} title={staffName(care, timesheet.staffMemberId)} detail={timesheet.disputeReason || "Timesheet is disputed"} badge="disputed" />)}</SimpleList>
      </div>

      <CompanyDialog open={companyOpen} onOpenChange={setCompanyOpen} onSave={(input) => run(() => care.createAgencyCompany(input), "Agency company created.", setCompanyOpen)} />
      <WorkerDialog open={workerOpen} homeId={homeId} onOpenChange={setWorkerOpen} onSave={(input) => run(() => care.createAgencyWorker(input), "Agency worker created.", setWorkerOpen)} />
      <AssignmentDialog open={assignmentOpen} homeId={homeId} onOpenChange={setAssignmentOpen} onSave={(input) => run(() => care.assignAgencyWorkerToShift(input), "Agency assignment saved.", setAssignmentOpen)} />
      <TimesheetDialog open={timesheetOpen} assignments={assignments} onOpenChange={setTimesheetOpen} onSave={(input) => run(() => care.recordAgencyTimesheet(input), "Agency timesheet recorded.", setTimesheetOpen)} />
    </div>
  );
}

function CompanyDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (input: CreateAgencyCompanyCommand) => void }) {
  const [form, setForm] = useState<CreateAgencyCompanyCommand>({ name: "", contactName: "", contactEmail: "", status: "active", approvedSupplier: true, defaultCurrencyCode: "EUR" });
  const set = (key: keyof CreateAgencyCompanyCommand, value: string) => setForm((current) => ({ ...current, [key]: value || undefined }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Agency Company</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Name"><Input value={form.name} onChange={(event) => set("name", event.target.value)} /></Field><Field label="Contact Name"><Input value={form.contactName || ""} onChange={(event) => set("contactName", event.target.value)} /></Field><Field label="Contact Email"><Input value={form.contactEmail || ""} onChange={(event) => set("contactEmail", event.target.value)} /></Field><Field label="Supplier Ref"><Input value={form.supplierReference || ""} onChange={(event) => set("supplierReference", event.target.value)} /></Field></div><Field label="Notes"><Textarea value={form.notes || ""} onChange={(event) => set("notes", event.target.value)} /></Field><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!form.name} onClick={() => onSave(form)}>Save</Button></div></DialogContent></Dialog>;
}

function WorkerDialog({ open, homeId, onOpenChange, onSave }: { open: boolean; homeId: string; onOpenChange: (open: boolean) => void; onSave: (input: CreateAgencyWorkerCommand) => void }) {
  const care = useCare();
  const [form, setForm] = useState<CreateAgencyWorkerCommand>({ staffMemberId: care.staffMembers[0]?.id || "", agencyCompanyId: care.agencyCompanies[0]?.id || "", primaryRoleKey: "NURSE", approvedNursingHomeIds: [homeId] });
  const set = (key: keyof CreateAgencyWorkerCommand, value: string) => setForm((current) => ({ ...current, approvedNursingHomeIds: [homeId], [key]: value || undefined }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Agency Worker</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Staff Member"><Select value={form.staffMemberId} onValueChange={(value) => set("staffMemberId", value)}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{care.staffMembers.map((staff) => <SelectItem key={staff.id} value={staff.id}>{staff.displayName}</SelectItem>)}</SelectContent></Select></Field><Field label="Company"><Select value={form.agencyCompanyId} onValueChange={(value) => set("agencyCompanyId", value)}><SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger><SelectContent>{care.agencyCompanies.map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Role"><Select value={form.primaryRoleKey} onValueChange={(value) => set("primaryRoleKey", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select></Field><Field label="Reference"><Input value={form.agencyWorkerReference || ""} onChange={(event) => set("agencyWorkerReference", event.target.value)} /></Field></div><Field label="Notes"><Textarea value={form.notes || ""} onChange={(event) => set("notes", event.target.value)} /></Field><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!form.staffMemberId || !form.agencyCompanyId} onClick={() => onSave({ ...form, approvedNursingHomeIds: [homeId] })}>Save</Button></div></DialogContent></Dialog>;
}

function AssignmentDialog({ open, homeId, onOpenChange, onSave }: { open: boolean; homeId: string; onOpenChange: (open: boolean) => void; onSave: (input: AssignAgencyWorkerToShiftCommand) => void }) {
  const care = useCare();
  const firstWorker = care.agencyWorkers[0];
  const [form, setForm] = useState<AssignAgencyWorkerToShiftCommand>({ agencyCompanyId: firstWorker?.agencyCompanyId || "", agencyWorkerId: firstWorker?.id || "", staffMemberId: firstWorker?.staffMemberId || "", nursingHomeId: homeId, roleKey: firstWorker?.primaryRoleKey || "NURSE", startAt: `${new Date().toISOString().slice(0, 10)}T08:00`, endAt: `${new Date().toISOString().slice(0, 10)}T20:00`, plannedHours: 12 });
  const set = (key: keyof AssignAgencyWorkerToShiftCommand, value: string) => setForm((current) => ({ ...current, nursingHomeId: homeId, [key]: key === "plannedHours" ? Number(value) || undefined : value || undefined }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Assign Agency Worker</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Worker"><Select value={form.agencyWorkerId} onValueChange={(value) => { const worker = care.agencyWorkers.find((item) => item.id === value); setForm((current) => ({ ...current, agencyWorkerId: value, agencyCompanyId: worker?.agencyCompanyId || current.agencyCompanyId, staffMemberId: worker?.staffMemberId || current.staffMemberId, roleKey: worker?.primaryRoleKey || current.roleKey })); }}><SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger><SelectContent>{care.agencyWorkers.map((worker) => <SelectItem key={worker.id} value={worker.id}>{staffName(care, worker.staffMemberId)}</SelectItem>)}</SelectContent></Select></Field><Field label="Role"><Select value={form.roleKey} onValueChange={(value) => set("roleKey", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select></Field><Field label="Start"><Input type="datetime-local" value={form.startAt} onChange={(event) => set("startAt", event.target.value)} /></Field><Field label="End"><Input type="datetime-local" value={form.endAt} onChange={(event) => set("endAt", event.target.value)} /></Field><Field label="Planned Hours"><Input type="number" value={form.plannedHours || ""} onChange={(event) => set("plannedHours", event.target.value)} /></Field></div><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!form.agencyWorkerId || !form.agencyCompanyId} onClick={() => onSave({ ...form, nursingHomeId: homeId })}>Save</Button></div></DialogContent></Dialog>;
}

function TimesheetDialog({ open, assignments, onOpenChange, onSave }: { open: boolean; assignments: AgencyShiftAssignment[]; onOpenChange: (open: boolean) => void; onSave: (input: RecordAgencyTimesheetCommand) => void }) {
  const first = assignments[0];
  const [form, setForm] = useState<RecordAgencyTimesheetCommand>({ agencyShiftAssignmentId: first?.id || "", hoursWorked: first?.plannedHours || 12, unpaidBreakMinutes: 0, notes: "" });
  const set = (key: keyof RecordAgencyTimesheetCommand, value: string) => setForm((current) => ({ ...current, [key]: key === "hoursWorked" || key === "unpaidBreakMinutes" ? Number(value) || 0 : value || undefined }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Record Agency Timesheet</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Assignment"><Select value={form.agencyShiftAssignmentId} onValueChange={(value) => set("agencyShiftAssignmentId", value)}><SelectTrigger><SelectValue placeholder="Select assignment" /></SelectTrigger><SelectContent>{assignments.map((assignment) => <SelectItem key={assignment.id} value={assignment.id}>{assignment.startAt.slice(0, 10)} {assignment.roleKey}</SelectItem>)}</SelectContent></Select></Field><Field label="Hours Worked"><Input type="number" value={form.hoursWorked} onChange={(event) => set("hoursWorked", event.target.value)} /></Field><Field label="Break Minutes"><Input type="number" value={form.unpaidBreakMinutes || 0} onChange={(event) => set("unpaidBreakMinutes", event.target.value)} /></Field></div><Field label="Notes"><Textarea value={form.notes || ""} onChange={(event) => set("notes", event.target.value)} /></Field><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!form.agencyShiftAssignmentId} onClick={() => onSave(form)}>Save</Button></div></DialogContent></Dialog>;
}

function AssignmentTable({ title: tableTitle, rows, empty }: { title: string; rows: AgencyShiftAssignment[]; empty: string }) {
  const care = useCare();
  return <Card><CardHeader><CardTitle>{tableTitle}</CardTitle></CardHeader><CardContent><div className="overflow-hidden rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Worker</th><th className="px-4 py-3">Shift</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="px-4 py-3 font-medium">{staffName(care, row.staffMemberId)}</td><td className="px-4 py-3 text-muted-foreground">{row.startAt.slice(0, 16)} to {row.endAt.slice(11, 16)}</td><td className="px-4 py-3">{row.roleKey}</td><td className="px-4 py-3"><Badge variant="outline">{title(row.status)}</Badge></td></tr>)}{rows.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">{empty}</td></tr>}</tbody></table></div></CardContent></Card>;
}

function TimesheetTable({ title: tableTitle, rows, empty, action }: { title: string; rows: AgencyTimesheet[]; empty: string; action?: (timesheet: AgencyTimesheet) => ReactNode }) {
  const care = useCare();
  return <Card><CardHeader><CardTitle>{tableTitle}</CardTitle></CardHeader><CardContent><div className="overflow-hidden rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Worker</th><th className="px-4 py-3">Hours</th><th className="px-4 py-3">Cost</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="px-4 py-3 font-medium">{staffName(care, row.staffMemberId)}</td><td className="px-4 py-3">{row.hoursWorked}</td><td className="px-4 py-3">{money(row.approvedCost?.amountMinor ?? row.calculatedCost.amountMinor, row.approvedCost?.currencyCode ?? row.calculatedCost.currencyCode)}</td><td className="px-4 py-3"><Badge variant="outline">{title(row.status)}</Badge></td><td className="px-4 py-3 text-right">{action?.(row)}</td></tr>)}{rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">{empty}</td></tr>}</tbody></table></div></CardContent></Card>;
}

function SimpleList({ title: listTitle, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  return <Card><CardHeader><CardTitle>{listTitle}</CardTitle></CardHeader><CardContent className="space-y-2">{Array.isArray(items) && items.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p> : items}</CardContent></Card>;
}

function Row({ title: rowTitle, detail, badge }: { title: string; detail: string; badge: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><div><div className="font-medium">{rowTitle}</div><div className="text-muted-foreground">{detail}</div></div><Badge variant="outline">{title(badge)}</Badge></div>;
}

function Metric({ title: metricTitle, value, detail }: { title: string; value: string | number; detail: string }) {
  return <Card><CardContent className="p-4"><div className="text-xs font-medium text-muted-foreground">{metricTitle}</div><div className="mt-2 text-2xl font-semibold">{value}</div><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function run(action: () => unknown, message: string, close: (open: boolean) => void) {
  try {
    action();
    toast.success(message);
    close(false);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "The Agency record could not be saved.");
  }
}

function approveTimesheet(care: ReturnType<typeof useCare>, id: string) {
  run(() => care.approveAgencyTimesheet(id), "Agency timesheet approved.", () => undefined);
}

function staffName(care: ReturnType<typeof useCare>, id: string) {
  return care.staffMembers.find((staff) => String(staff.id) === String(id))?.displayName || "Unknown staff";
}

function companyName(care: ReturnType<typeof useCare>, id: string) {
  return care.agencyCompanies.find((company) => String(company.id) === String(id))?.name || "Unknown agency";
}

function money(amountMinor: number, currencyCode = "EUR") {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: currencyCode }).format(amountMinor / 100);
}

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
