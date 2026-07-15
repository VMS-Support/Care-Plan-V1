import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useCare } from "@/lib/care/store";
import {
  EMPLOYMENT_CONTRACT_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  WORKFORCE_CAPABILITIES,
  getAuthorisedWorkforceScope,
  getEmploymentRecordsWorkspace,
  type CreateEmploymentRecordCommand,
} from "@/domain/workforce";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/workforce/employment")({
  head: () => ({ meta: [{ title: "Employment Records - NuCare" }] }),
  component: EmploymentRecordsWorkspace,
});

const ALL = "__all__";
const roles = ["NURSE", "CNM", "HCA", "DOCTOR", "ALLIED_HEALTH", "HOUSEKEEPING", "KITCHEN", "MAINTENANCE", "ADMINISTRATION", "FINANCE", "TRAINING", "OPERATIONS", "OTHER"];

function EmploymentRecordsWorkspace() {
  const care = useCare();
  const [search, setSearch] = useState("");
  const [homeId, setHomeId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [state, setState] = useState(ALL);
  const [role, setRole] = useState(ALL);
  const [missing, setMissing] = useState(ALL);
  const [open, setOpen] = useState(false);
  const capabilities = WORKFORCE_CAPABILITIES.filter((capability) => care.canAccess(capability, { nursingHomeId: care.activeFacilityId }));
  const scope = getAuthorisedWorkforceScope({ currentUser: care.currentUser, activeFacilityId: care.activeFacilityId, facilities: care.facilities });
  const homeOptions = care.facilities.filter((facility) => scope.nursingHomeIds.includes(facility.id));
  const workspace = useMemo(() => getEmploymentRecordsWorkspace({
    facilities: care.facilities,
    staffMembers: care.staffMembers,
    employmentRecords: care.employmentRecords,
    employmentHomeAssignments: care.employmentHomeAssignments,
    employmentRoleAssignments: care.employmentRoleAssignments,
    filters: {
      search,
      nursingHomeId: homeId === ALL ? undefined : homeId,
      status: status === ALL ? undefined : status,
      currentState: state === ALL ? undefined : state as any,
      primaryRoleKey: role === ALL ? undefined : role,
      missingWte: missing === "wte",
      missingHours: missing === "hours",
    },
    authorization: { user: care.currentUser, capabilities, scope },
  }), [care, search, homeId, status, state, role, missing, capabilities.join(","), scope.nursingHomeIds.join(",")]);

  if (!capabilities.includes("employment_record.view") && !capabilities.includes("workforce.view")) {
    return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have access to Employment Records.</CardContent></Card></div>;
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employment Records</h1>
          <p className="text-sm text-muted-foreground">Manage staff contracts, employment status, WTE, contracted hours, Homes and role assignments.</p>
        </div>
        {capabilities.includes("employment_record.create") && <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Employment Record</Button>}
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_160px_160px_160px]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search staff, employee number, home or role" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Select value={homeId} onValueChange={setHomeId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All Homes</SelectItem>{homeOptions.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select>
            <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All Statuses</SelectItem>{Object.entries(EMPLOYMENT_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>
            <Select value={state} onValueChange={setState}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All Dates</SelectItem><SelectItem value="current">Current</SelectItem><SelectItem value="future">Future</SelectItem><SelectItem value="ended">Ended</SelectItem></SelectContent></Select>
            <Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All Roles</SelectItem>{roles.map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select>
            <Select value={missing} onValueChange={setMissing}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All Values</SelectItem><SelectItem value="wte">WTE missing</SelectItem><SelectItem value="hours">Hours missing</SelectItem></SelectContent></Select>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Staff Member</th>
                  <th className="px-4 py-3 font-medium">Employee Number</th>
                  <th className="px-4 py-3 font-medium">Contract Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Primary Role</th>
                  <th className="px-4 py-3 font-medium">Primary Home</th>
                  <th className="px-4 py-3 font-medium">WTE/FTE</th>
                  <th className="px-4 py-3 font-medium">Hours</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspace.rows.map((record) => (
                  <tr key={record.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{record.staffMemberName}</td>
                    <td className="px-4 py-3">{record.employeeNumber}</td>
                    <td className="px-4 py-3">{record.contractType}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{record.status}</Badge></td>
                    <td className="px-4 py-3">{record.primaryRole}</td>
                    <td className="px-4 py-3">{record.primaryHome}</td>
                    <td className="px-4 py-3">{record.fte ?? "Not Recorded"}</td>
                    <td className="px-4 py-3">{record.contractedHoursPerWeek ?? "Not Recorded"}</td>
                    <td className="px-4 py-3 text-xs">{record.startDate} - {record.endDate || "Open"}</td>
                    <td className="px-4 py-3"><Button variant="outline" size="sm" asChild><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: record.staffMemberId }}>Open Profile</Link></Button></td>
                  </tr>
                ))}
                {workspace.rows.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">{care.employmentRecords.length ? "No Employment Records match the selected filters." : "No Employment Records have been created for the selected scope."}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-muted-foreground">{workspace.total} Employment Record{workspace.total === 1 ? "" : "s"}</div>
        </CardContent>
      </Card>

      <EmploymentRecordDialog
        open={open}
        staffMembers={care.staffMembers}
        homes={homeOptions}
        onOpenChange={setOpen}
        onSave={(input) => {
          try {
            care.createEmploymentRecord(input);
            toast.success("Employment Record saved.");
            setOpen(false);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "The Employment Record could not be saved.");
          }
        }}
      />
    </div>
  );
}

function EmploymentRecordDialog({ open, staffMembers, homes, onOpenChange, onSave }: { open: boolean; staffMembers: { id: string; displayName: string; staffNumber?: string }[]; homes: { id: string; name: string }[]; onOpenChange: (open: boolean) => void; onSave: (input: CreateEmploymentRecordCommand) => void }) {
  const [form, setForm] = useState<CreateEmploymentRecordCommand>({
    staffMemberId: staffMembers[0]?.id || "",
    employeeNumber: "",
    contractType: "permanent_full_time",
    status: "active",
    startDate: new Date().toISOString().slice(0, 10),
    primaryNursingHomeId: homes[0]?.id,
    primaryRoleKey: "NURSE",
    isPrimaryEmployment: true,
  });
  const set = (key: keyof CreateEmploymentRecordCommand, value: string | boolean) => setForm((current) => ({ ...current, [key]: key === "fteValue" || key === "contractedHoursPerWeek" ? Number(value) : value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Add Employment Record</DialogTitle></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Staff Member"><Select value={form.staffMemberId} onValueChange={(value) => set("staffMemberId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{staffMembers.map((staff) => <SelectItem key={staff.id} value={staff.id}>{staff.displayName} {staff.staffNumber ? `(${staff.staffNumber})` : ""}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Employee Number"><Input value={form.employeeNumber} onChange={(event) => set("employeeNumber", event.target.value)} /></Field>
          <Field label="Contract Type"><Select value={form.contractType} onValueChange={(value) => set("contractType", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EMPLOYMENT_CONTRACT_TYPE_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Status"><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EMPLOYMENT_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Start Date"><Input type="date" value={form.startDate} onChange={(event) => set("startDate", event.target.value)} /></Field>
          <Field label="End Date"><Input type="date" value={form.endDate || ""} onChange={(event) => set("endDate", event.target.value)} /></Field>
          <Field label="WTE/FTE"><Input type="number" step="0.1" value={form.fteValue ?? ""} onChange={(event) => set("fteValue", event.target.value)} /></Field>
          <Field label="Contracted Hours"><Input type="number" step="0.5" value={form.contractedHoursPerWeek ?? ""} onChange={(event) => set("contractedHoursPerWeek", event.target.value)} /></Field>
          <Field label="Primary Home"><Select value={form.primaryNursingHomeId || homes[0]?.id} onValueChange={(value) => set("primaryNursingHomeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{homes.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Primary Role"><Select value={form.primaryRoleKey} onValueChange={(value) => set("primaryRoleKey", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roles.map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Salary Grade"><Input value={form.salaryGradeLabel || ""} onChange={(event) => set("salaryGradeLabel", event.target.value)} /></Field>
          <Field label="Payroll ID"><Input value={form.payrollId || ""} onChange={(event) => set("payrollId", event.target.value)} /></Field>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.isPrimaryEmployment)} onChange={(event) => set("isPrimaryEmployment", event.target.checked)} /> Primary Employment Record</label>
        <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Save Employment Record</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
