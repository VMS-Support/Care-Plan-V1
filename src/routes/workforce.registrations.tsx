import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useCare } from "@/lib/care/store";
import {
  getExpiringProfessionalRegistrationsMetric,
  getProfessionalRegistrationComplianceMetric,
  professionalRegistrationRow,
  type CreateProfessionalRegistrationCommand,
} from "@/domain/workforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/workforce/registrations")({
  head: () => ({ meta: [{ title: "Professional Registration - NuCare" }] }),
  component: ProfessionalRegistrationWorkspace,
});

const ALL = "all";
const professions = ["nurse", "doctor", "allied_health", "social_care", "other"];

function ProfessionalRegistrationWorkspace() {
  const care = useCare();
  const [search, setSearch] = useState("");
  const [view, setView] = useState(ALL);
  const [dialogOpen, setDialogOpen] = useState(false);
  const can = (capability: string) => care.canAccess(capability, { nursingHomeId: care.activeFacilityId });
  const compliance = getProfessionalRegistrationComplianceMetric({ staffMembers: care.staffMembers, employmentRecords: care.employmentRecords, registrations: care.professionalRegistrations });
  const expiringMetric = getExpiringProfessionalRegistrationsMetric(care.professionalRegistrations);
  const rows = care.professionalRegistrations
    .map((record) => professionalRegistrationRow(record, { staffMembers: care.staffMembers, facilities: care.facilities, canViewNumber: can("professional_registration.view_number") }))
    .filter((row) => view === ALL || row.status === view.replaceAll("_", " ") || row.verificationStatus.toLowerCase().replaceAll(" ", "_") === view)
    .filter((row) => {
      const q = search.trim().toLowerCase();
      return !q || [row.staffName, row.registrationBody, row.profession, row.registrationNumber, row.status, row.verificationStatus].some((value) => String(value || "").toLowerCase().includes(q));
    });

  if (!can("professional_registration.view")) {
    return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have access to Professional Registration.</CardContent></Card></div>;
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Professional Registration</h1>
          <p className="text-sm text-muted-foreground">Organisation-level view of regulated worker registrations, verification and expiry.</p>
        </div>
        {can("professional_registration.create") && <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Registration</Button>}
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Metric title="Compliance" value={compliance.percentage === undefined ? "Not Configured" : `${compliance.percentage}%`} detail={compliance.explanation} />
        <Metric title="Compliant" value={String(compliance.compliantCount)} detail="Current verified registrations." />
        <Metric title="Expiring Soon" value={String(expiringMetric.value)} detail="Registrations expiring within 30 days." />
        <Metric title="Expired" value={String(compliance.expiredCount)} detail="Expired registrations." />
        <Metric title="Pending Verification" value={String(compliance.pendingVerificationCount)} detail="Records requiring verification." />
      </div>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>All Registrations</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-[240px] pl-8" placeholder="Search registrations" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <Select value={view} onValueChange={setView}><SelectTrigger className="w-[210px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All views</SelectItem><SelectItem value="current">Current</SelectItem><SelectItem value="expired">Expired</SelectItem><SelectItem value="submitted">Pending Verification</SelectItem><SelectItem value="failed">Verification Failed</SelectItem><SelectItem value="suspended">Suspended or Revoked</SelectItem></SelectContent></Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Staff Member</th>
                  <th className="px-4 py-3 font-medium">Registration Body</th>
                  <th className="px-4 py-3 font-medium">Profession</th>
                  <th className="px-4 py-3 font-medium">Registration Number</th>
                  <th className="px-4 py-3 font-medium">Expiry / Review</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Verification</th>
                  <th className="px-4 py-3 font-medium">Restrictions</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{row.staffName}</td>
                    <td className="px-4 py-3">{row.registrationBody}</td>
                    <td className="px-4 py-3">{title(row.profession)}</td>
                    <td className="px-4 py-3">{row.registrationNumber || "Not recorded"}</td>
                    <td className="px-4 py-3">{row.expiryDate || "No expiry"}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{title(row.status)}</Badge></td>
                    <td className="px-4 py-3">{row.verificationStatus}</td>
                    <td className="px-4 py-3">{row.restrictionsOrConditionsPresent ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline" asChild><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: row.staffMemberId }}>Staff Profile</Link></Button>
                        {can("professional_registration.verify") && <Button size="sm" variant="ghost" onClick={() => { care.verifyProfessionalRegistration(row.id); toast.success("Registration verified."); }}>Verify</Button>}
                        {can("professional_registration.fail_verification") && <Button size="sm" variant="ghost" onClick={() => { care.failProfessionalRegistrationVerification(row.id); toast.success("Verification failed."); }}>Fail</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">No Professional Registrations have been recorded.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Registration Bodies & Requirements</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Panel title="Registration Bodies" empty="No Registration Bodies have been configured." items={care.professionalRegistrationBodies.map((body) => `${body.name} - ${body.active ? "Active" : "Inactive"}`)} />
          <Panel title="Registration Requirements" empty="No Registration Requirements have been configured." items={care.professionalRegistrationRequirements.map((requirement) => `${requirement.roleKey || "Role"} - ${requirement.registrationBodyId || "Body"} - ${requirement.active ? "Active" : "Inactive"}`)} />
        </CardContent>
      </Card>

      <RegistrationDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={(input) => {
        try {
          care.createProfessionalRegistration(input);
          toast.success("Professional Registration saved.");
          setDialogOpen(false);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "The Professional Registration could not be saved.");
        }
      }} />
    </div>
  );
}

function RegistrationDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (input: CreateProfessionalRegistrationCommand) => void }) {
  const care = useCare();
  const firstStaff = care.staffMembers[0];
  const [form, setForm] = useState<CreateProfessionalRegistrationCommand>({ staffMemberId: firstStaff?.id || "", registrationBody: "Nursing and Midwifery Board of Ireland", registrationBodyId: "nmbi", profession: "nurse", professionKey: "nurse", registrationType: "General", registrationNumber: "", status: "draft", verificationStatus: "not_submitted" });
  const set = (key: keyof CreateProfessionalRegistrationCommand, value: string | boolean) => setForm((current) => ({ ...current, [key]: value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Add Registration</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Staff Member"><Select value={form.staffMemberId} onValueChange={(value) => set("staffMemberId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.staffMembers.map((staff) => <SelectItem key={staff.id} value={staff.id}>{staff.displayName}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Registration Body"><Select value={form.registrationBodyId || ""} onValueChange={(value) => { const body = care.professionalRegistrationBodies.find((item) => item.id === value); setForm((current) => ({ ...current, registrationBodyId: value, registrationBody: body?.name || current.registrationBody })); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.professionalRegistrationBodies.map((body) => <SelectItem key={body.id} value={body.id}>{body.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Profession"><Select value={form.profession} onValueChange={(value) => setForm((current) => ({ ...current, profession: value as any, professionKey: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{professions.map((item) => <SelectItem key={item} value={item}>{title(item)}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Registration Type"><Input value={form.registrationType || ""} onChange={(event) => set("registrationType", event.target.value)} /></Field>
        <Field label="Registration Number"><Input value={form.registrationNumber || ""} onChange={(event) => set("registrationNumber", event.target.value)} /></Field>
        <Field label="Issue Date"><Input type="date" value={form.issueDate || ""} onChange={(event) => set("issueDate", event.target.value)} /></Field>
        <Field label="Expiry Date"><Input type="date" value={form.expiryDate || ""} onChange={(event) => set("expiryDate", event.target.value)} /></Field>
        <Field label="Review Date"><Input type="date" value={form.reviewDate || ""} onChange={(event) => set("reviewDate", event.target.value)} /></Field>
        <Field label="Verification Method"><Input value={form.notes || ""} onChange={(event) => set("notes", event.target.value)} placeholder="Online register, evidence file, employer check" /></Field>
        <Field label="Restrictions Summary"><Input value={form.restrictedSummary || ""} onChange={(event) => set("restrictedSummary", event.target.value)} /></Field>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.restrictionsOrConditionsPresent)} onChange={(event) => set("restrictionsOrConditionsPresent", event.target.checked)} /> Restrictions or conditions present</label>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Save Registration</Button></div>
    </DialogContent></Dialog>
  );
}

function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <Card><CardContent className="p-4"><div className="text-xs font-medium text-muted-foreground">{title}</div><div className="mt-2 text-2xl font-semibold">{value}</div><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function Panel({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div className="rounded-lg border p-4"><div className="font-medium">{title}</div><div className="mt-3 space-y-2 text-sm">{items.length ? items.map((item) => <div key={item} className="rounded-md bg-muted/50 px-3 py-2">{item}</div>) : <p className="text-muted-foreground">{empty}</p>}</div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
