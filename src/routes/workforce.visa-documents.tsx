import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useCare } from "@/lib/care/store";
import {
  getEmploymentPermitValidMetric,
  getGardaVettingComplianceMetric,
  getMandatoryDocumentsExpiringMetric,
  getResidencePermissionMetric,
  getStaffImmigrationSummary,
  getVisaComplianceMetric,
  staffDocumentViewModel,
  type CreateEmploymentPermitRecordCommand,
  type CreateResidencePermissionRecordCommand,
  type CreateStaffDocumentCommand,
  type CreateStaffVisaRecordCommand,
} from "@/domain/workforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/workforce/visa-documents")({
  head: () => ({ meta: [{ title: "Visa & Documents - NuCare" }] }),
  component: VisaDocumentsWorkspace,
});

const ALL = "all";

function VisaDocumentsWorkspace() {
  const care = useCare();
  const [search, setSearch] = useState("");
  const [view, setView] = useState(ALL);
  const [docOpen, setDocOpen] = useState(false);
  const [immigrationOpen, setImmigrationOpen] = useState<"visa" | "residence" | "permit" | undefined>();
  const capabilities = ["staff_document.view", "staff_document.view_sensitive", "staff_document.upload", "staff_document.verify", "staff_document.fail_verification", "staff_immigration.view", "staff_immigration.view_sensitive", "staff_immigration.create", "staff_immigration.verify"].filter((capability) => care.canAccess(capability, { nursingHomeId: care.activeFacilityId }));
  const can = (capability: string) => capabilities.includes(capability);
  const visa = getVisaComplianceMetric({ employmentRecords: care.employmentRecords, visaRecords: care.staffVisaRecords });
  const residence = getResidencePermissionMetric({ employmentRecords: care.employmentRecords, residenceRecords: care.staffResidencePermissionRecords });
  const permit = getEmploymentPermitValidMetric({ employmentRecords: care.employmentRecords, permitRecords: care.staffEmploymentPermitRecords });
  const garda = getGardaVettingComplianceMetric({ documents: care.staffDocuments, documentTypes: care.staffDocumentTypes, employmentRecords: care.employmentRecords });
  const mandatoryExpiring = getMandatoryDocumentsExpiringMetric(care.staffDocuments);
  const documentRows = care.staffDocuments.map((document) => staffDocumentViewModel(document, { staffMembers: care.staffMembers, documentTypes: care.staffDocumentTypes, capabilities }));
  const immigrationRows = care.staffMembers.map((staff) => getStaffImmigrationSummary({
    staffMemberId: String(staff.id),
    requirementProfiles: care.staffImmigrationRequirementProfiles,
    visaRecords: care.staffVisaRecords,
    residenceRecords: care.staffResidencePermissionRecords,
    permitRecords: care.staffEmploymentPermitRecords,
    visaTypes: care.staffVisaTypes,
    permitTypes: care.staffEmploymentPermitTypes,
    canViewSensitive: can("staff_immigration.view_sensitive"),
  }));
  const filteredDocuments = documentRows
    .filter((row) => view === ALL || row.effectiveStatus.replaceAll(" ", "_") === view || row.documentType.key === view)
    .filter((row) => {
      const q = search.trim().toLowerCase();
      return !q || [row.staffDisplayName, row.documentType.name, row.referenceNumberDisplay, row.effectiveStatus, row.verificationStatus].some((value) => String(value || "").toLowerCase().includes(q));
    });

  if (!can("staff_document.view") && !can("staff_immigration.view")) {
    return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have access to Visa & Documents.</CardContent></Card></div>;
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visa & Documents</h1>
          <p className="text-sm text-muted-foreground">Immigration, Garda vetting and mandatory staff document records from the live workforce data.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can("staff_immigration.create") && <Button variant="outline" onClick={() => setImmigrationOpen("visa")}><Plus className="mr-2 h-4 w-4" /> Add Visa</Button>}
          {can("staff_immigration.create") && <Button variant="outline" onClick={() => setImmigrationOpen("residence")}>Add Irish Residence Permission</Button>}
          {can("staff_immigration.create") && <Button variant="outline" onClick={() => setImmigrationOpen("permit")}>Add Employment Permit</Button>}
          {can("staff_document.upload") && <Button onClick={() => setDocOpen(true)}><Plus className="mr-2 h-4 w-4" /> Upload Document</Button>}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Metric title="Visa Valid" value={metricValue(visa.percentage)} detail={`${visa.valid} valid / ${visa.denominator} staff`} />
        <Metric title="Visa Expiring" value={String(visa.expiring)} detail="Current visa records expiring soon." />
        <Metric title="Visa Expired" value={String(visa.expired)} detail="Expired visa records." />
        <Metric title="GNIB / IRP Valid" value={metricValue(residence.percentage)} detail={`${residence.valid} valid / ${residence.denominator} staff`} />
        <Metric title="Work Permit Valid" value={metricValue(permit.percentage)} detail={`${permit.valid} valid / ${permit.denominator} staff`} />
        <Metric title="Garda Vetting Valid" value={metricValue(garda.percentage)} detail={`${garda.value} valid / ${garda.denominator} staff`} />
        <Metric title="Mandatory Documents Expiring" value={String(mandatoryExpiring.value)} detail="Documents expiring within 30 days." />
      </div>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Expiring Documents and Visas</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-[240px] pl-8" placeholder="Search documents" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <Select value={view} onValueChange={setView}><SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All records</SelectItem><SelectItem value="expiring_soon">Expiring</SelectItem><SelectItem value="expired">Expired</SelectItem><SelectItem value="pending_verification">Pending Verification</SelectItem><SelectItem value="garda_vetting">Garda Vetting</SelectItem><SelectItem value="passport">Passport</SelectItem></SelectContent></Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Staff Member</th>
                  <th className="px-4 py-3 font-medium">Document or Record</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Expiry / Review</th>
                  <th className="px-4 py-3 font-medium">Days Remaining</th>
                  <th className="px-4 py-3 font-medium">Verification</th>
                  <th className="px-4 py-3 font-medium">Compliance Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((row) => (
                  <tr key={row.staffDocumentId} className="border-t">
                    <td className="px-4 py-3 font-medium">{row.staffDisplayName}</td>
                    <td className="px-4 py-3">{row.documentType.name}</td>
                    <td className="px-4 py-3">{row.referenceNumberDisplay || "Not recorded"}</td>
                    <td className="px-4 py-3">{row.expiryDate || row.reviewDate || "No expiry"}</td>
                    <td className="px-4 py-3">{row.daysUntilExpiry ?? row.daysUntilReview ?? "N/A"}</td>
                    <td className="px-4 py-3">{title(row.verificationStatus)}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{title(row.effectiveStatus)}</Badge></td>
                    <td className="px-4 py-3"><div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" asChild><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: row.staffMemberId }}>Staff Profile</Link></Button>{can("staff_document.verify") && <Button size="sm" variant="ghost" onClick={() => { care.verifyStaffDocument(row.staffDocumentId); toast.success("Document verified."); }}>Verify</Button>}</div></td>
                  </tr>
                ))}
                {filteredDocuments.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">No mandatory documents or immigration records are expiring within the selected period.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Immigration Summary</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {immigrationRows.filter((row) => row.visa || row.residencePermission || row.employmentPermits.length || row.requirementProfile).map((row) => {
            const staff = care.staffMembers.find((item) => String(item.id) === row.staffMemberId);
            return (
              <div key={row.staffMemberId} className="rounded-lg border p-4 text-sm">
                <div className="flex items-start justify-between gap-3"><div className="font-semibold">{staff?.displayName || "Staff Member"}</div><Badge variant="outline">{title(row.overallCompliance)}</Badge></div>
                <div className="mt-3 space-y-1 text-muted-foreground">
                  <div>Visa: {row.visa?.label || "No current visa"}</div>
                  <div>IRP/GNIB: {row.residencePermission?.label || "No current record"}</div>
                  <div>Permits: {row.employmentPermits.length}</div>
                  <div>Next expiry: {row.nextExpiryDate || "Not recorded"}</div>
                </div>
                <Button className="mt-3" size="sm" variant="outline" asChild><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: row.staffMemberId }}>Open Staff Profile</Link></Button>
              </div>
            );
          })}
          {immigrationRows.every((row) => !row.visa && !row.residencePermission && !row.employmentPermits.length && !row.requirementProfile) && <p className="text-sm text-muted-foreground">No immigration records have been added for this Staff Member.</p>}
        </CardContent>
      </Card>

      <DocumentDialog open={docOpen} onOpenChange={setDocOpen} onSave={(input) => {
        try {
          care.createStaffDocument(input);
          toast.success("Staff Document saved.");
          setDocOpen(false);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "The Staff Document could not be saved.");
        }
      }} />
      {immigrationOpen && <ImmigrationDialog kind={immigrationOpen} open={Boolean(immigrationOpen)} onOpenChange={(open) => !open && setImmigrationOpen(undefined)} onSave={(kind, input) => {
        try {
          if (kind === "visa") care.createStaffVisaRecord(input as CreateStaffVisaRecordCommand);
          if (kind === "residence") care.createResidencePermissionRecord(input as CreateResidencePermissionRecordCommand);
          if (kind === "permit") care.createEmploymentPermitRecord(input as CreateEmploymentPermitRecordCommand);
          toast.success("Immigration record saved.");
          setImmigrationOpen(undefined);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "The immigration record could not be saved.");
        }
      }} />}
    </div>
  );
}

function DocumentDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (input: CreateStaffDocumentCommand) => void }) {
  const care = useCare();
  const [form, setForm] = useState<CreateStaffDocumentCommand>({ staffMemberId: care.staffMembers[0]?.id || "", documentTypeId: care.staffDocumentTypes[0]?.id || "", fileId: `demo-file-${Date.now()}`, clientRequestId: `staff-document-${Date.now()}` });
  const set = (key: keyof CreateStaffDocumentCommand, value: string) => setForm((current) => ({ ...current, [key]: value || undefined }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Upload Staff Document</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Staff Member"><Select value={form.staffMemberId} onValueChange={(value) => set("staffMemberId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.staffMembers.map((staff) => <SelectItem key={staff.id} value={staff.id}>{staff.displayName}</SelectItem>)}</SelectContent></Select></Field><Field label="Document Type"><Select value={form.documentTypeId} onValueChange={(value) => set("documentTypeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.staffDocumentTypes.map((type) => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Title"><Input value={form.title || ""} onChange={(event) => set("title", event.target.value)} /></Field><Field label="Reference"><Input value={form.referenceNumber || ""} onChange={(event) => set("referenceNumber", event.target.value)} /></Field><Field label="Issue Date"><Input type="date" value={form.issueDate || ""} onChange={(event) => set("issueDate", event.target.value)} /></Field><Field label="Expiry Date"><Input type="date" value={form.expiryDate || ""} onChange={(event) => set("expiryDate", event.target.value)} /></Field><Field label="Review Date"><Input type="date" value={form.reviewDate || ""} onChange={(event) => set("reviewDate", event.target.value)} /></Field><Field label="File ID"><Input value={form.fileId} onChange={(event) => set("fileId", event.target.value)} /></Field></div><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave({ ...form, clientRequestId: form.clientRequestId || `staff-document-${Date.now()}` })}>Save Document</Button></div></DialogContent></Dialog>;
}

function ImmigrationDialog({ kind, open, onOpenChange, onSave }: { kind: "visa" | "residence" | "permit"; open: boolean; onOpenChange: (open: boolean) => void; onSave: (kind: "visa" | "residence" | "permit", input: CreateStaffVisaRecordCommand | CreateResidencePermissionRecordCommand | CreateEmploymentPermitRecordCommand) => void }) {
  const care = useCare();
  const [form, setForm] = useState<any>({ staffMemberId: care.staffMembers[0]?.id || "", visaTypeId: care.staffVisaTypes[0]?.id, permitTypeId: care.staffEmploymentPermitTypes[0]?.id, registrationNumber: "", clientRequestId: `immigration-${Date.now()}` });
  const set = (key: string, value: string) => setForm((current: any) => ({ ...current, [key]: value || undefined }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{kind === "visa" ? "Add Visa" : kind === "residence" ? "Add Irish Residence Permission" : "Add Employment Permit"}</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Staff Member"><Select value={form.staffMemberId} onValueChange={(value) => set("staffMemberId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.staffMembers.map((staff) => <SelectItem key={staff.id} value={staff.id}>{staff.displayName}</SelectItem>)}</SelectContent></Select></Field>{kind === "visa" && <Field label="Visa Type"><Select value={form.visaTypeId} onValueChange={(value) => set("visaTypeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.staffVisaTypes.map((type) => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent></Select></Field>}{kind === "permit" && <Field label="Permit Type"><Select value={form.permitTypeId} onValueChange={(value) => set("permitTypeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.staffEmploymentPermitTypes.map((type) => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent></Select></Field>}<Field label={kind === "residence" ? "Registration Number" : "Reference Number"}><Input value={form.registrationNumber || form.visaReferenceNumber || form.permitNumber || ""} onChange={(event) => set(kind === "residence" ? "registrationNumber" : kind === "visa" ? "visaReferenceNumber" : "permitNumber", event.target.value)} /></Field><Field label="Issue Date"><Input type="date" value={form.issueDate || ""} onChange={(event) => set("issueDate", event.target.value)} /></Field><Field label="Expiry Date"><Input type="date" value={form.expiryDate || ""} onChange={(event) => set("expiryDate", event.target.value)} /></Field><Field label="Review Date"><Input type="date" value={form.reviewDate || ""} onChange={(event) => set("reviewDate", event.target.value)} /></Field><Field label="Evidence File ID"><Input value={form.evidenceFileId || ""} onChange={(event) => set("evidenceFileId", event.target.value)} /></Field></div><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(kind, { ...form, clientRequestId: form.clientRequestId || `immigration-${Date.now()}` })}>Save Record</Button></div></DialogContent></Dialog>;
}

function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <Card><CardContent className="p-4"><div className="text-xs font-medium text-muted-foreground">{title}</div><div className="mt-2 text-xl font-semibold">{value}</div><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function metricValue(value?: number) {
  return value === undefined ? "Not Configured" : `${value}%`;
}

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
