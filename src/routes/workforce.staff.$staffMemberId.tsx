import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail, Phone, UserRound, Home, ShieldCheck, Plus, CheckCircle2 } from "lucide-react";
import { useCare } from "@/lib/care/store";
import {
  WORKFORCE_CAPABILITIES,
  EMPLOYMENT_CONTRACT_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  employmentRecordCardModel,
  getAuthorisedWorkforceScope,
  professionalRegistrationRow,
  getStaffProfile,
  type CreateEmploymentRecordCommand,
  type CreateProfessionalRegistrationCommand,
  STAFF_MEMBER_STATUS_LABELS,
} from "@/domain/workforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export const Route = createFileRoute("/workforce/staff/$staffMemberId")({
  head: () => ({ meta: [{ title: "Staff Profile - NuCare" }] }),
  component: StaffProfilePage,
});

function StaffProfilePage() {
  const { staffMemberId } = Route.useParams();
  const care = useCare();
  const capabilities = WORKFORCE_CAPABILITIES.filter((capability) =>
    care.canAccess(capability, { nursingHomeId: care.activeFacilityId }),
  );
  const scope = getAuthorisedWorkforceScope({ currentUser: care.currentUser, activeFacilityId: care.activeFacilityId, facilities: care.facilities });
  const profile = getStaffProfile(care, staffMemberId, { user: care.currentUser, capabilities, scope });

  if (!profile) {
    return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">The Staff Member could not be loaded.</CardContent></Card></div>;
  }

  const { staff, row, role } = profile;
  const contacts = care.staffEmergencyContacts
    .filter((contact) => String(contact.staffMemberId) === String(staff.id) && contact.active)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.priority - b.priority);
  const canPersonal = capabilities.includes("staff_directory.view_personal_details");
  const canAddress = capabilities.includes("staff_directory.view_address");
  const canContacts = capabilities.includes("staff_directory.view_emergency_contacts");
  const canAccount = capabilities.includes("staff_directory.view_account_link");
  const canViewPayroll = capabilities.includes("employment_record.view_payroll");
  const canCreateEmployment = capabilities.includes("employment_record.create");
  const canCreateRegistration = capabilities.includes("professional_registration.create");
  const canVerifyRegistration = capabilities.includes("professional_registration.verify");
  const [employmentOpen, setEmploymentOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const employmentCards = care.employmentRecords
    .filter((record) => String(record.staffMemberId) === String(staff.id))
    .map((record) => employmentRecordCardModel(record, {
      facilities: care.facilities,
      homeAssignments: care.employmentHomeAssignments,
      roleAssignments: care.employmentRoleAssignments,
      canViewPayroll,
    }))
    .sort((a, b) => (a.status === "Active" ? -1 : b.status === "Active" ? 1 : a.startDate.localeCompare(b.startDate)));
  const registrationRows = care.professionalRegistrations
    .filter((record) => String(record.staffMemberId) === String(staff.id))
    .map((record) => professionalRegistrationRow(record, {
      staffMembers: care.staffMembers,
      facilities: care.facilities,
      canViewNumber: capabilities.includes("professional_registration.view_number"),
    }));

  return (
    <div className="space-y-4 p-4 md:p-8">
      <Button variant="ghost" asChild className="pl-0"><Link to="/workforce/staff"><ArrowLeft className="mr-2 h-4 w-4" /> Staff Directory</Link></Button>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          <Avatar className="h-20 w-20"><AvatarImage src={row.photoUrl} /><AvatarFallback className="text-xl">{row.initials}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{row.displayName}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{row.staffNumber}</Badge>
              <Badge>{STAFF_MEMBER_STATUS_LABELS[row.status]}</Badge>
              <Badge variant="secondary">{role.primaryRoleLabel || "Role Not Recorded"}</Badge>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Home className="h-4 w-4" /> {row.primaryHome?.name || "Primary Home Not Recorded"}</div>
            <div className="mt-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {row.linkedUserAccount ? "User Account Linked" : "No User Account Linked"}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Work Contact">
          <Detail icon={Mail} label="Work Email" value={row.workEmail || "Not recorded"} />
          <Detail icon={Phone} label="Work Phone" value={row.workPhone || "Not recorded"} />
        </Section>

        <Section title="Personal Details">
          {canPersonal ? (
            <>
              <Detail label="Date of Birth" value={staff.dateOfBirth || "Not recorded"} />
              <Detail label="Gender" value={staff.gender ? staff.gender.replaceAll("_", " ") : "Not recorded"} />
              <Detail label="Nationality" value={staff.nationalityDisplayName || staff.nationalityCode || "Not recorded"} />
            </>
          ) : <p className="text-sm text-muted-foreground">Personal details are restricted.</p>}
        </Section>

        <Section title="Address">
          {canAddress ? (
            <p className="text-sm">{[staff.address?.line1, staff.address?.line2, staff.address?.townCity, staff.address?.countyRegion, staff.address?.postcode, staff.address?.country].filter(Boolean).join(", ") || "Not recorded"}</p>
          ) : <p className="text-sm text-muted-foreground">Address details are restricted.</p>}
        </Section>

        <Section title="Emergency Contacts">
          {canContacts ? (
            contacts.length ? contacts.map((contact) => (
              <div key={contact.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between"><strong>{contact.fullName}</strong>{contact.isPrimary && <Badge variant="outline">Primary</Badge>}</div>
                <div className="mt-1 text-muted-foreground">{contact.relationship || "Relationship not recorded"} · {contact.phoneNumber}</div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No active emergency contacts recorded.</p>
          ) : <p className="text-sm text-muted-foreground">Emergency contacts are restricted.</p>}
        </Section>

        <Section title="Account Link">
          {canAccount ? (
            <p className="text-sm">{row.linkedUserAccount ? "This Staff Member is linked to a User Account." : "No User Account Linked"}</p>
          ) : <p className="text-sm text-muted-foreground">Account link details are restricted.</p>}
        </Section>
      </div>

      <Section
        title="Employment Records"
        action={canCreateEmployment ? <Button size="sm" onClick={() => setEmploymentOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Employment Record</Button> : undefined}
      >
        <p className="text-sm text-muted-foreground">Contracts, roles, home assignments and payroll references for this Staff Member.</p>
        <div className="grid gap-3 xl:grid-cols-2">
          {employmentCards.map((record) => (
            <div key={record.id} className="rounded-lg border p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div><div className="font-semibold">{record.employeeNumber}</div><div className="text-muted-foreground">{record.contractType}</div></div>
                <Badge>{record.status}</Badge>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <span>Start: {record.startDate}</span>
                <span>End: {record.endDate || "Open"}</span>
                <span>FTE: {record.fte ?? "Not recorded"}</span>
                <span>Hours: {record.contractedHoursPerWeek ?? "Not recorded"}</span>
                <span>Home: {record.primaryHome}</span>
                <span>Role: {record.primaryRole}</span>
              </div>
              {record.additionalHomes.length > 0 && <p className="mt-2 text-muted-foreground">Additional homes: {record.additionalHomes.join(", ")}</p>}
              {record.additionalRoles.length > 0 && <p className="mt-2 text-muted-foreground">Additional roles: {record.additionalRoles.join(", ")}</p>}
              {canViewPayroll && <p className="mt-2 text-muted-foreground">Payroll link: {record.payrollLinked ? "Linked" : "Not recorded"}</p>}
            </div>
          ))}
          {employmentCards.length === 0 && <p className="text-sm text-muted-foreground">No Employment Records have been added for this Staff Member.</p>}
        </div>
      </Section>

      <Section
        title="Professional Registrations"
        action={canCreateRegistration ? <Button size="sm" onClick={() => setRegistrationOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Registration</Button> : undefined}
      >
        <div className="grid gap-3 xl:grid-cols-2">
          {registrationRows.map((record) => (
            <div key={record.id} className="rounded-lg border p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div><div className="font-semibold">{record.registrationBody}</div><div className="text-muted-foreground">{record.profession}</div></div>
                <Badge variant="outline">{record.status}</Badge>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <span>Number: {record.registrationNumber || "Restricted"}</span>
                <span>Expiry: {record.expiryDate || "Not recorded"}</span>
                <span>Verification: {record.verificationStatus}</span>
                <span>Document: {record.documentLinked ? "Linked" : "Not linked"}</span>
              </div>
              {record.restrictionsOrConditionsPresent && capabilities.includes("professional_registration.view_conditions") && <p className="mt-2 text-amber-700">Restrictions or conditions present.</p>}
              {canVerifyRegistration && <Button className="mt-3" size="sm" variant="outline" onClick={() => { care.verifyProfessionalRegistration(record.id); toast.success("Registration verified."); }}><CheckCircle2 className="mr-2 h-4 w-4" /> Verify</Button>}
            </div>
          ))}
          {registrationRows.length === 0 && <p className="text-sm text-muted-foreground">No Professional Registrations have been recorded.</p>}
        </div>
      </Section>

      <AddEmploymentDialog open={employmentOpen} staffMemberId={String(staff.id)} homes={care.facilities} onOpenChange={setEmploymentOpen} onSave={(input) => { try { care.createEmploymentRecord(input); toast.success("Employment Record saved."); setEmploymentOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Employment Record could not be saved."); } }} />
      <AddRegistrationDialog open={registrationOpen} staffMemberId={String(staff.id)} onOpenChange={setRegistrationOpen} onSave={(input) => { try { care.createProfessionalRegistration(input); toast.success("Professional Registration saved."); setRegistrationOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Professional Registration could not be saved."); } }} />
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between gap-3"><CardTitle className="text-base">{title}</CardTitle>{action}</CardHeader><CardContent className="space-y-3">{children}</CardContent></Card>;
}

function Detail({ icon: Icon = UserRound, label, value }: { icon?: any; label: string; value: string }) {
  return <div className="flex items-center gap-3 text-sm"><Icon className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">{label}:</span><span>{value}</span></div>;
}

function AddEmploymentDialog({ open, staffMemberId, homes, onOpenChange, onSave }: { open: boolean; staffMemberId: string; homes: { id: string; name: string }[]; onOpenChange: (open: boolean) => void; onSave: (input: CreateEmploymentRecordCommand) => void }) {
  const [form, setForm] = useState<CreateEmploymentRecordCommand>({ staffMemberId, employeeNumber: "", contractType: "permanent_full_time", status: "active", startDate: new Date().toISOString().slice(0, 10), primaryNursingHomeId: homes[0]?.id, primaryRoleKey: "NURSE", fteValue: 1, contractedHoursPerWeek: 37.5, isPrimaryEmployment: true });
  const set = (key: keyof CreateEmploymentRecordCommand, value: string) => setForm((current) => ({ ...current, staffMemberId, [key]: key === "fteValue" || key === "contractedHoursPerWeek" ? Number(value) : value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Employment Record</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Employee Number"><Input value={form.employeeNumber} onChange={(event) => set("employeeNumber", event.target.value)} /></Field>
        <Field label="Contract Type"><Select value={form.contractType} onValueChange={(value) => set("contractType", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EMPLOYMENT_CONTRACT_TYPE_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Status"><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EMPLOYMENT_STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Start Date"><Input type="date" value={form.startDate} onChange={(event) => set("startDate", event.target.value)} /></Field>
        <Field label="FTE"><Input type="number" step="0.1" value={form.fteValue ?? ""} onChange={(event) => set("fteValue", event.target.value)} /></Field>
        <Field label="Hours / Week"><Input type="number" step="0.5" value={form.contractedHoursPerWeek ?? ""} onChange={(event) => set("contractedHoursPerWeek", event.target.value)} /></Field>
        <Field label="Primary Home"><Select value={form.primaryNursingHomeId} onValueChange={(value) => set("primaryNursingHomeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{homes.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Primary Role"><Select value={form.primaryRoleKey} onValueChange={(value) => set("primaryRoleKey", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["NURSE", "CNM", "HCA", "DOCTOR", "ADMINISTRATION", "HOUSEKEEPING", "MAINTENANCE"].map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select></Field>
      </div>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Save Employment Record</Button></div>
    </DialogContent></Dialog>
  );
}

function AddRegistrationDialog({ open, staffMemberId, onOpenChange, onSave }: { open: boolean; staffMemberId: string; onOpenChange: (open: boolean) => void; onSave: (input: CreateProfessionalRegistrationCommand) => void }) {
  const [form, setForm] = useState<CreateProfessionalRegistrationCommand>({ staffMemberId, registrationBody: "Nursing and Midwifery Board of Ireland", registrationBodyId: "nmbi", profession: "nurse", registrationNumber: "", status: "draft", verificationStatus: "not_submitted" });
  const set = (key: keyof CreateProfessionalRegistrationCommand, value: string) => setForm((current) => ({ ...current, staffMemberId, [key]: value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Professional Registration</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Registration Body"><Input value={form.registrationBody} onChange={(event) => set("registrationBody", event.target.value)} /></Field>
        <Field label="Profession"><Select value={form.profession} onValueChange={(value) => set("profession", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nurse">Nurse</SelectItem><SelectItem value="doctor">Doctor</SelectItem><SelectItem value="allied_health">Allied Health</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></Field>
        <Field label="Registration Number"><Input value={form.registrationNumber || ""} onChange={(event) => set("registrationNumber", event.target.value)} /></Field>
        <Field label="Issue Date"><Input type="date" value={form.issueDate || ""} onChange={(event) => set("issueDate", event.target.value)} /></Field>
        <Field label="Expiry Date"><Input type="date" value={form.expiryDate || ""} onChange={(event) => set("expiryDate", event.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Save Registration</Button></div>
    </DialogContent></Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
