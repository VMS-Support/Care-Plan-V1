import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, UserRound, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { useCare } from "@/lib/care/store";
import type { StaffMember, StaffMemberStatus } from "@/lib/care/types";
import {
  WORKFORCE_CAPABILITIES,
  getAuthorisedWorkforceScope,
  getStaffDirectory,
  STAFF_MEMBER_STATUS_LABELS,
  type SaveStaffMemberInput,
  type StaffDirectorySortKey,
} from "@/domain/workforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export const Route = createFileRoute("/workforce/staff")({
  head: () => ({ meta: [{ title: "Staff Directory - NuCare" }] }),
  component: StaffDirectoryPage,
});

const ALL = "__all__";
const pageSize = 10;

function StaffDirectoryPage() {
  const care = useCare();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [homeId, setHomeId] = useState<string>(ALL);
  const [linked, setLinked] = useState<string>(ALL);
  const [sortKey, setSortKey] = useState<StaffDirectorySortKey>("surname");
  const [page, setPage] = useState(0);
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; staff?: StaffMember } | null>(null);
  const capabilities = WORKFORCE_CAPABILITIES.filter((capability) =>
    care.canAccess(capability, { nursingHomeId: care.activeFacilityId }),
  );
  const scope = getAuthorisedWorkforceScope({ currentUser: care.currentUser, activeFacilityId: care.activeFacilityId, facilities: care.facilities });
  const selectedHomeIds = homeId === ALL ? scope.nursingHomeIds : [homeId];
  const directory = useMemo(
    () =>
      getStaffDirectory(
        care,
        {
          nursingHomeIds: selectedHomeIds,
          statuses: status === ALL ? undefined : [status as StaffMemberStatus],
          linkedUserAccount: linked === ALL ? undefined : linked as "linked" | "not_linked",
          search,
        },
        { page, pageSize },
        { key: sortKey, direction: "asc" },
        { user: care.currentUser, capabilities, scope },
      ),
    [care, selectedHomeIds.join(","), status, linked, search, page, sortKey, capabilities.join(","), scope.nursingHomeIds.join(",")],
  );
  const canCreate = capabilities.includes("staff_directory.create");
  const homeOptions = care.facilities.filter((facility) => scope.nursingHomeIds.includes(facility.id));

  if (!capabilities.includes("staff_directory.view") && !capabilities.includes("workforce.view")) {
    return (
      <div className="p-6">
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have access to the Staff Directory.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff Directory</h1>
          <p className="text-sm text-muted-foreground">Manage staff identity, contact details, home assignment and account linkage.</p>
        </div>
        {canCreate && <Button onClick={() => setDialog({ mode: "create" })}><Plus className="mr-2 h-4 w-4" /> Add Staff Member</Button>}
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search name, staff number or work email" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} />
            </div>
            <Select value={status} onValueChange={(value) => { setStatus(value); setPage(0); }}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All statuses</SelectItem>{Object.entries(STAFF_MEMBER_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={homeId} onValueChange={(value) => { setHomeId(value); setPage(0); }}>
              <SelectTrigger><SelectValue placeholder="Home" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All authorised homes</SelectItem>{homeOptions.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={linked} onValueChange={(value) => { setLinked(value); setPage(0); }}>
              <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All accounts</SelectItem><SelectItem value="linked">Linked</SelectItem><SelectItem value="not_linked">No User Account Linked</SelectItem></SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(value) => setSortKey(value as StaffDirectorySortKey)}>
              <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="surname">Surname</SelectItem>
                <SelectItem value="firstName">First name</SelectItem>
                <SelectItem value="staffNumber">Staff number</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="primaryRole">Primary role</SelectItem>
                <SelectItem value="primaryHome">Primary home</SelectItem>
                <SelectItem value="updatedAt">Updated date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Staff Member</th>
                  <th className="px-4 py-3 font-medium">Staff Number</th>
                  <th className="px-4 py-3 font-medium">Primary Role</th>
                  <th className="px-4 py-3 font-medium">Primary Home</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Work Contact</th>
                  <th className="px-4 py-3 font-medium">User Account</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {directory.rows.map((row) => (
                  <tr key={row.staffMemberId} className="border-t">
                    <td className="px-4 py-3">
                      <Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: row.staffMemberId }} className="flex items-center gap-3 font-medium">
                        <Avatar className="h-9 w-9"><AvatarImage src={row.photoUrl} /><AvatarFallback>{row.initials}</AvatarFallback></Avatar>
                        <span>{row.displayName}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">{row.staffNumber}</td>
                    <td className="px-4 py-3">{row.primaryRole?.label || "Role Not Recorded"}</td>
                    <td className="px-4 py-3">{row.primaryHome?.name || "Primary Home Not Recorded"}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.statusLabel} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{row.workEmail || row.workPhone || "Not recorded"}</td>
                    <td className="px-4 py-3">{row.linkedUserAccount ? <Badge variant="outline">Linked</Badge> : <span className="text-muted-foreground">No User Account Linked</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: row.staffMemberId }}>Open</Link></Button>
                        {capabilities.includes("staff_directory.edit") && <Button variant="ghost" size="icon" onClick={() => setDialog({ mode: "edit", staff: care.staffMembers.find((staff) => String(staff.id) === row.staffMemberId) })}><Pencil className="h-4 w-4" /></Button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {directory.rows.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">{search || status !== ALL || homeId !== ALL || linked !== ALL ? "No Staff Members match the selected filters." : "No Staff Members have been added for the selected scope."}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{directory.totalMatching} Staff Member{directory.totalMatching === 1 ? "" : "s"}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft className="h-4 w-4" /> Previous</Button>
              <Button variant="outline" size="sm" disabled={(page + 1) * pageSize >= directory.totalMatching} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <StaffMemberDialog
        open={Boolean(dialog)}
        mode={dialog?.mode || "create"}
        staff={dialog?.staff}
        homeOptions={homeOptions}
        onOpenChange={(open) => !open && setDialog(null)}
        onSave={(input) => {
          try {
            if (dialog?.mode === "edit" && dialog.staff) {
              care.updateStaffMember(String(dialog.staff.id), input);
              toast.success("Staff Member saved.");
            } else {
              care.createStaffMember(input);
              toast.success("Staff Member added.");
            }
            setDialog(null);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "The Staff Member could not be saved.");
          }
        }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "Active" ? "bg-emerald-50 text-emerald-700" : status === "Suspended" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700";
  return <Badge className={`${cls} border-0`}>{status}</Badge>;
}

function StaffMemberDialog({ open, mode, staff, homeOptions, onOpenChange, onSave }: { open: boolean; mode: "create" | "edit"; staff?: StaffMember; homeOptions: { id: string; name: string }[]; onOpenChange: (open: boolean) => void; onSave: (input: SaveStaffMemberInput) => void }) {
  const [form, setForm] = useState<SaveStaffMemberInput>(() => draftFromStaff(staff, homeOptions[0]?.id));
  useEffect(() => setForm(draftFromStaff(staff, homeOptions[0]?.id)), [staff, homeOptions[0]?.id, open]);
  const set = (key: keyof SaveStaffMemberInput, value: string) => setForm((current) => ({ ...current, [key]: value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{mode === "edit" ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Staff Number"><Input value={form.staffNumber} onChange={(event) => set("staffNumber", event.target.value)} disabled={mode === "edit"} /></Field>
          <Field label="Primary Home"><Select value={form.primaryNursingHomeId || homeOptions[0]?.id} onValueChange={(value) => set("primaryNursingHomeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{homeOptions.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="First Name"><Input value={form.firstName} onChange={(event) => set("firstName", event.target.value)} /></Field>
          <Field label="Surname"><Input value={form.surname} onChange={(event) => set("surname", event.target.value)} /></Field>
          <Field label="Preferred Name"><Input value={form.preferredName || ""} onChange={(event) => set("preferredName", event.target.value)} /></Field>
          <Field label="Status"><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STAFF_MEMBER_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Work Email"><Input value={form.workEmail || ""} onChange={(event) => set("workEmail", event.target.value)} /></Field>
          <Field label="Work Phone"><Input value={form.workPhone || ""} onChange={(event) => set("workPhone", event.target.value)} /></Field>
          <Field label="Photo URL"><Input value={form.photoUrl || ""} onChange={(event) => set("photoUrl", event.target.value)} /></Field>
          <Field label="Date of Birth"><Input type="date" value={form.dateOfBirth || ""} onChange={(event) => set("dateOfBirth", event.target.value)} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(form)}>{mode === "edit" ? "Save Staff Member" : "Add Staff Member"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function draftFromStaff(staff: StaffMember | undefined, fallbackHomeId?: string): SaveStaffMemberInput {
  return {
    staffNumber: staff?.staffNumber || "",
    firstName: staff?.firstName || "",
    surname: staff?.surname || staff?.lastName || "",
    preferredName: staff?.preferredName || "",
    status: staff?.status || (staff?.active ? "active" : "inactive"),
    primaryNursingHomeId: staff?.primaryNursingHomeId ? String(staff.primaryNursingHomeId) : fallbackHomeId,
    workEmail: staff?.contactDetails?.workEmail || staff?.email || "",
    workPhone: staff?.contactDetails?.workPhone || staff?.phone || "",
    photoUrl: staff?.photoUrl || "",
    dateOfBirth: staff?.dateOfBirth || "",
  };
}
