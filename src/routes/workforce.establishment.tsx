import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { getStaffingEstablishmentWorkspace, type AddStaffingEstablishmentLineCommand, type CreateStaffingEstablishmentDraftCommand } from "@/domain/workforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/workforce/establishment")({
  head: () => ({ meta: [{ title: "Staffing Establishment - NuCare" }] }),
  component: StaffingEstablishmentWorkspace,
});

const roleOptions = ["NURSE", "CNM", "DON", "HCA", "DOCTOR", "ALLIED_HEALTH", "HOUSEKEEPING", "KITCHEN", "MAINTENANCE", "ADMINISTRATION", "FINANCE", "TRAINING", "OPERATIONS", "OTHER"];

function StaffingEstablishmentWorkspace() {
  const care = useCare();
  const [homeId, setHomeId] = useState(care.activeFacilityId);
  const [draftOpen, setDraftOpen] = useState(false);
  const [lineOpen, setLineOpen] = useState(false);
  const capabilities = ["staffing_establishment.view", "staffing_establishment.create_draft", "staffing_establishment.approve", "staffing_establishment.view_actuals", "staffing_establishment.view_vacancies"].filter((capability) => care.canAccess(capability, { nursingHomeId: homeId }));
  const workspace = useMemo(() => getStaffingEstablishmentWorkspace({
    versions: care.staffingEstablishmentVersions,
    lines: care.staffingEstablishmentLines,
    employmentRecords: care.employmentRecords,
    homeAssignments: care.employmentHomeAssignments,
    recruitmentVacancies: care.recruitmentVacancies,
    nursingHomeId: homeId,
  }), [care, homeId]);
  const selectedHome = care.facilities.find((home) => home.id === homeId);
  const activeDraft = workspace.versions.find((version) => version.status === "draft" || version.status === "submitted_for_approval");

  if (!care.canAccess("staffing_establishment.view", { nursingHomeId: homeId })) {
    return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have access to Staffing Establishment.</CardContent></Card></div>;
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staffing Establishment</h1>
          <p className="text-sm text-muted-foreground">Manage budgeted staffing, required WTE and actual-versus-budgeted workforce coverage.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={homeId} onValueChange={setHomeId}><SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger><SelectContent>{care.facilities.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select>
          {capabilities.includes("staffing_establishment.create_draft") && <Button onClick={() => setDraftOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create Draft Establishment</Button>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Metric title="Current Version" value={workspace.effectiveVersion?.versionName || "Not Configured"} detail={workspace.effectiveVersion ? `Effective from ${workspace.effectiveVersion.effectiveFrom}` : "No approved Staffing Establishment exists for this Nursing Home."} />
        <Metric title="Vacant Positions" value={workspace.comparison.totalVacantHeadcount === undefined ? "N/A" : String(workspace.comparison.totalVacantHeadcount)} detail={workspace.comparison.explanation} />
        <Metric title="Vacancy WTE" value={workspace.comparison.totalVacantFte === undefined ? "N/A" : String(Math.round(workspace.comparison.totalVacantFte * 100) / 100)} detail="Budget vacancy WTE from actual assignments." />
        <Metric title="Vacancy Percentage" value={workspace.comparison.vacancyPercentage === undefined ? "N/A" : `${workspace.comparison.vacancyPercentage}%`} detail="Headcount vacancy percentage where configured." />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Establishment Versions</CardTitle>
          {activeDraft && <Button size="sm" onClick={() => setLineOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Role Line</Button>}
        </CardHeader>
        <CardContent className="space-y-3">
          {workspace.versions.map((version) => (
            <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <div>
                <div className="font-semibold">{version.versionName}</div>
                <div className="text-muted-foreground">Version {version.versionNumber} - {version.effectiveFrom} - {version.effectiveTo || "Open"}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{version.status.replaceAll("_", " ")}</Badge>
                {version.status === "draft" && capabilities.includes("staffing_establishment.approve") && <Button size="sm" variant="outline" onClick={() => { care.approveStaffingEstablishment(String(version.id)); toast.success("Staffing Establishment approved."); }}><ShieldCheck className="mr-2 h-4 w-4" /> Approve</Button>}
              </div>
            </div>
          ))}
          {workspace.versions.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No draft Establishment versions have been created.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Actual vs Budgeted</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Ward</th>
                  <th className="px-4 py-3 font-medium">Budgeted Headcount</th>
                  <th className="px-4 py-3 font-medium">Actual Headcount</th>
                  <th className="px-4 py-3 font-medium">Vacant Headcount</th>
                  <th className="px-4 py-3 font-medium">Budgeted WTE</th>
                  <th className="px-4 py-3 font-medium">Required WTE</th>
                  <th className="px-4 py-3 font-medium">Actual WTE</th>
                  <th className="px-4 py-3 font-medium">Vacancy WTE</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {workspace.rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{row.role}</td>
                    <td className="px-4 py-3">{row.wardId || "Home level"}</td>
                    <td className="px-4 py-3">{row.budgetedHeadcount ?? "Not Recorded"}</td>
                    <td className="px-4 py-3">{row.actualHeadcount}</td>
                    <td className="px-4 py-3">{row.vacantHeadcount}</td>
                    <td className="px-4 py-3">{row.budgetedWte ?? "Not Recorded"}</td>
                    <td className="px-4 py-3">{row.requiredWte ?? "Not Configured"}</td>
                    <td className="px-4 py-3">{Math.round(row.actualWte * 100) / 100}</td>
                    <td className="px-4 py-3">{Math.round(row.vacancyWte * 100) / 100}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{row.status}</Badge></td>
                  </tr>
                ))}
                {workspace.rows.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">No approved Staffing Establishment exists for this Nursing Home.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <DraftDialog open={draftOpen} homeId={homeId} homeName={selectedHome?.name || "Selected Home"} onOpenChange={setDraftOpen} onSave={(input) => {
        try {
          care.createStaffingEstablishmentDraft(input);
          toast.success("Draft Establishment created.");
          setDraftOpen(false);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "The Staffing Establishment could not be saved.");
        }
      }} />
      {activeDraft && <LineDialog open={lineOpen} versionId={String(activeDraft.id)} homeId={homeId} onOpenChange={setLineOpen} onSave={(input) => {
        try {
          care.addStaffingEstablishmentLine(input);
          toast.success("Role Line added.");
          setLineOpen(false);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "This role line duplicates an existing role and Ward combination.");
        }
      }} />}
    </div>
  );
}

function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <Card><CardContent className="p-4"><div className="text-xs font-medium text-muted-foreground">{title}</div><div className="mt-2 text-2xl font-semibold">{value}</div><p className="mt-2 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function DraftDialog({ open, homeId, homeName, onOpenChange, onSave }: { open: boolean; homeId: string; homeName: string; onOpenChange: (open: boolean) => void; onSave: (input: CreateStaffingEstablishmentDraftCommand) => void }) {
  const [form, setForm] = useState<CreateStaffingEstablishmentDraftCommand>({ nursingHomeId: homeId, versionName: `${homeName} Establishment`, effectiveFrom: new Date().toISOString().slice(0, 10), clientRequestId: `establishment-${Date.now()}` });
  const set = (key: keyof CreateStaffingEstablishmentDraftCommand, value: string) => setForm((current) => ({ ...current, nursingHomeId: homeId, [key]: value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Create Draft Establishment</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nursing Home"><Input value={homeName} disabled /></Field>
        <Field label="Version Name"><Input value={form.versionName} onChange={(event) => set("versionName", event.target.value)} /></Field>
        <Field label="Effective From"><Input type="date" value={form.effectiveFrom} onChange={(event) => set("effectiveFrom", event.target.value)} /></Field>
        <Field label="Effective To"><Input type="date" value={form.effectiveTo || ""} onChange={(event) => set("effectiveTo", event.target.value)} /></Field>
        <Field label="Source Budget Reference"><Input value={form.sourceBudgetReference || ""} onChange={(event) => set("sourceBudgetReference", event.target.value)} /></Field>
        <Field label="Notes"><Input value={form.notes || ""} onChange={(event) => set("notes", event.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave({ ...form, nursingHomeId: homeId, clientRequestId: form.clientRequestId || `establishment-${Date.now()}` })}>Create Draft</Button></div>
    </DialogContent></Dialog>
  );
}

function LineDialog({ open, versionId, homeId, onOpenChange, onSave }: { open: boolean; versionId: string; homeId: string; onOpenChange: (open: boolean) => void; onSave: (input: AddStaffingEstablishmentLineCommand) => void }) {
  const [form, setForm] = useState<AddStaffingEstablishmentLineCommand>({ establishmentVersionId: versionId, nursingHomeId: homeId, roleKey: "NURSE", budgetedHeadcount: 1, budgetedFte: 1, agencyAllowed: false, clientRequestId: `establishment-line-${Date.now()}` });
  const set = (key: keyof AddStaffingEstablishmentLineCommand, value: string | boolean) => setForm((current) => ({ ...current, establishmentVersionId: versionId, nursingHomeId: homeId, [key]: ["budgetedHeadcount", "budgetedFte", "budgetedHoursPerWeek", "minimumHeadcount", "minimumRegisteredStaff"].includes(key) ? Number(value) : value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Role Line</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Role"><Select value={form.roleKey} onValueChange={(value) => set("roleKey", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roleOptions.map((role) => <SelectItem key={role} value={role}>{role.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Budgeted Headcount"><Input type="number" value={form.budgetedHeadcount ?? ""} onChange={(event) => set("budgetedHeadcount", event.target.value)} /></Field>
        <Field label="Budgeted WTE"><Input type="number" step="0.1" value={form.budgetedFte ?? ""} onChange={(event) => set("budgetedFte", event.target.value)} /></Field>
        <Field label="Budgeted Hours / Week"><Input type="number" step="0.5" value={form.budgetedHoursPerWeek ?? ""} onChange={(event) => set("budgetedHoursPerWeek", event.target.value)} /></Field>
        <Field label="Required Headcount"><Input type="number" value={form.minimumHeadcount ?? ""} onChange={(event) => set("minimumHeadcount", event.target.value)} /></Field>
        <Field label="Minimum Registered Staff"><Input type="number" value={form.minimumRegisteredStaff ?? ""} onChange={(event) => set("minimumRegisteredStaff", event.target.value)} /></Field>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.agencyAllowed)} onChange={(event) => set("agencyAllowed", event.target.checked)} /> Agency cover allowed</label>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave({ ...form, establishmentVersionId: versionId, nursingHomeId: homeId, clientRequestId: form.clientRequestId || `establishment-line-${Date.now()}` })}>Add Role Line</Button></div>
    </DialogContent></Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
