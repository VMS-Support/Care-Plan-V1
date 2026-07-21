import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCare } from "@/lib/care/store";
import type { StaffLeaveRecord } from "@/lib/care/types";
import { getLeaveOverviewMetrics, type CreateStaffLeaveRecordCommand } from "@/domain/workforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/workforce/leave")({
  head: () => ({ meta: [{ title: "Leave Management - NuCare" }] }),
  component: LeaveManagementWorkspace,
});

const leaveTypes = ["annual_leave", "sick_leave", "unpaid_leave", "other"] as const;

function LeaveManagementWorkspace() {
  const care = useCare();
  const [homeId, setHomeId] = useState(care.activeFacilityId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const can = (capability: string) => care.canAccess(capability, { nursingHomeId: homeId });
  const records = care.staffLeaveRecords.filter((record) => record.nursingHomeId === homeId && record.status !== "entered_in_error");
  const metrics = getLeaveOverviewMetrics({ records: care.staffLeaveRecords, nursingHomeId: homeId, date: today });
  const pending = records.filter((record) => record.status === "requested");
  const todayRecords = records.filter((record) => record.status === "approved" && record.startDate <= today && record.endDate >= today);
  const upcoming = records.filter((record) => record.status === "approved" && record.startDate > today).sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 8);
  const returnDue = records.filter((record) => record.status === "approved" && record.expectedReturnDate && record.expectedReturnDate <= today && !record.actualReturnDate);
  const conflicts = records.filter((record) => record.rosterImpact?.createsVacantShift);
  const history = records.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 12);
  const sickTrend = useMemo(() => records.filter((record) => record.leaveType === "sick_leave" && record.startDate >= addDays(today, -30)).length, [records, today]);

  if (!can("leave.view")) {
    return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have access to Leave Management.</CardContent></Card></div>;
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leave Management</h1>
          <p className="text-sm text-muted-foreground">Staff leave, sick leave, approvals, roster impact and return-to-work visibility.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={homeId} onValueChange={setHomeId}><SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger><SelectContent>{care.facilities.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select>
          {can("leave.create") && <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Leave</Button>}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric title="Annual Leave Today" value={metrics.annualLeaveToday.value} detail={metrics.annualLeaveToday.explanation} />
        <Metric title="Sick Leave Today" value={metrics.sickLeaveToday.value} detail={metrics.sickLeaveToday.explanation} />
        <Metric title="Upcoming Leave" value={metrics.upcomingLeave.value} detail="Approved leave in the next 30 days." />
        <Metric title="Sick Trend" value={sickTrend} detail="Sick leave records started in the last 30 days." />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <LeaveTable title="Pending Approval" records={pending} empty="No leave requests are pending approval." action={(record) => can("leave.create") && <Button size="sm" variant="outline" onClick={() => approve(care, record.id)}>Approve</Button>} />
        <LeaveTable title="Today" records={todayRecords} empty="No staff leave is active today." />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <LeaveTable title="Upcoming Leave" records={upcoming} empty="No upcoming leave is scheduled." />
        <LeaveTable title="Return Due" records={returnDue} empty="No return-to-work follow-up is due." />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <LeaveTable title="Roster Conflicts" records={conflicts} empty="No roster conflicts are linked to leave." />
        <LeaveTable title="History" records={history} empty="No leave history has been recorded." />
      </div>

      <Card>
        <CardHeader><CardTitle>Boundaries</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Leave records remain distinct from roster shifts and payroll. This workspace records availability impact and approval status without creating duplicate roster or finance records.</CardContent>
      </Card>

      <LeaveDialog open={dialogOpen} homeId={homeId} onOpenChange={setDialogOpen} onSave={(input) => {
        try {
          care.createStaffLeaveRecord(input);
          toast.success(input.leaveType === "sick_leave" ? "Sick leave recorded." : "Leave request recorded.");
          setDialogOpen(false);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "The Leave record could not be saved.");
        }
      }} />
    </div>
  );
}

function LeaveDialog({ open, homeId, onOpenChange, onSave }: { open: boolean; homeId: string; onOpenChange: (open: boolean) => void; onSave: (input: CreateStaffLeaveRecordCommand) => void }) {
  const care = useCare();
  const staff = care.staffMembers[0];
  const [form, setForm] = useState<CreateStaffLeaveRecordCommand>({ staffMemberId: staff?.id || "", employmentRecordId: "", nursingHomeId: homeId, leaveType: "annual_leave", status: "requested", startAt: `${new Date().toISOString().slice(0, 10)}T09:00`, endAt: `${new Date().toISOString().slice(0, 10)}T17:00`, partialDay: "none", expectedReturnDate: new Date().toISOString().slice(0, 10), notes: "" });
  const employment = care.employmentRecords.find((record) => record.staffMemberId === form.staffMemberId);
  const set = (key: keyof CreateStaffLeaveRecordCommand, value: string) => setForm((current) => ({ ...current, nursingHomeId: homeId, employmentRecordId: key === "staffMemberId" ? care.employmentRecords.find((record) => record.staffMemberId === value)?.id : current.employmentRecordId, [key]: value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Leave</DialogTitle></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Staff Member"><Select value={form.staffMemberId} onValueChange={(value) => set("staffMemberId", value)}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{care.staffMembers.map((item) => <SelectItem key={item.id} value={item.id}>{item.displayName}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Leave Type"><Select value={form.leaveType} onValueChange={(value) => set("leaveType", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{leaveTypes.map((item) => <SelectItem key={item} value={item}>{title(item)}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Start"><Input type="datetime-local" value={form.startAt} onChange={(event) => set("startAt", event.target.value)} /></Field>
          <Field label="End"><Input type="datetime-local" value={form.endAt} onChange={(event) => set("endAt", event.target.value)} /></Field>
          <Field label="Expected Return"><Input type="date" value={form.expectedReturnDate || ""} onChange={(event) => set("expectedReturnDate", event.target.value)} /></Field>
          <Field label="Status"><Select value={form.status || "requested"} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["requested", "approved"].map((item) => <SelectItem key={item} value={item}>{title(item)}</SelectItem>)}</SelectContent></Select></Field>
        </div>
        <Field label="Notes"><Textarea value={form.notes || ""} onChange={(event) => set("notes", event.target.value)} /></Field>
        <div className="text-xs text-muted-foreground">Linked employment record: {employment?.id || "not selected"}</div>
        <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!form.staffMemberId} onClick={() => onSave({ ...form, nursingHomeId: homeId, employmentRecordId: employment?.id })}>Save</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function LeaveTable({ title: tableTitle, records, empty, action }: { title: string; records: StaffLeaveRecord[]; empty: string; action?: (record: StaffLeaveRecord) => React.ReactNode }) {
  const care = useCare();
  return <Card><CardHeader><CardTitle>{tableTitle}</CardTitle></CardHeader><CardContent><div className="overflow-hidden rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Staff</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead><tbody>{records.map((record) => <tr key={record.id} className="border-t"><td className="px-4 py-3 font-medium"><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: String(record.staffMemberId) }} aria-label={`Open Staff Profile for ${staffName(care, record.staffMemberId)}`} className="hover:underline">{staffName(care, record.staffMemberId)}</Link></td><td className="px-4 py-3">{title(record.leaveType)}</td><td className="px-4 py-3 text-muted-foreground">{record.startDate} to {record.endDate}</td><td className="px-4 py-3"><Badge variant="outline">{title(record.status)}</Badge></td><td className="px-4 py-3 text-right">{action?.(record)}</td></tr>)}{records.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">{empty}</td></tr>}</tbody></table></div></CardContent></Card>;
}

function Metric({ title: metricTitle, value, detail }: { title: string; value?: number; detail: string }) {
  return <Card><CardContent className="p-4"><div className="text-xs font-medium text-muted-foreground">{metricTitle}</div><div className="mt-2 text-2xl font-semibold">{value ?? 0}</div><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function approve(care: ReturnType<typeof useCare>, id: string) {
  try {
    care.approveStaffLeaveRecord(id);
    toast.success("Leave approved.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "This Leave request could not be approved.");
  }
}

function staffName(care: ReturnType<typeof useCare>, id: string) {
  return care.staffMembers.find((staff) => String(staff.id) === String(id))?.displayName || "Unknown staff";
}

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}
