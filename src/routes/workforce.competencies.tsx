import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useCare } from "@/lib/care/store";
import {
  getCompetencyMatrixViewModel,
  getCompetencyMetrics,
  getCompetencyStatus,
  latestCompetencyValidation,
  type RecordCompetencyValidationCommand,
} from "@/domain/workforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/workforce/competencies")({
  head: () => ({ meta: [{ title: "Competencies - NuCare" }] }),
  component: CompetencyWorkspace,
});

const ALL = "all";

function CompetencyWorkspace() {
  const care = useCare();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [validationOpen, setValidationOpen] = useState(false);
  const can = (capability: string) => care.canAccess(capability, { nursingHomeId: care.activeFacilityId });
  const metrics = getCompetencyMetrics({ definitions: care.competencyDefinitions, validations: care.staffCompetencyValidations });
  const matrix = getCompetencyMatrixViewModel({ staffMembers: care.staffMembers.slice(0, 12), definitions: care.competencyDefinitions, validations: care.staffCompetencyValidations });
  const validationRows = care.staffCompetencyValidations
    .filter((validation) => status === ALL || getCompetencyStatus(validation) === status)
    .filter((validation) => {
      const staff = care.staffMembers.find((item) => String(item.id) === String(validation.staffMemberId));
      const definition = care.competencyDefinitions.find((item) => item.id === validation.competencyDefinitionId);
      const q = search.trim().toLowerCase();
      return !q || [staff?.displayName, definition?.title, validation.status, validation.roleKey].some((value) => String(value || "").toLowerCase().includes(q));
    });

  if (!can("competency.view")) {
    return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have access to Competencies.</CardContent></Card></div>;
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Competencies</h1>
          <p className="text-sm text-muted-foreground">Definitions, requirements, validations, staff competency matrix and ward readiness.</p>
        </div>
        {can("competency.validate") && <Button onClick={() => setValidationOpen(true)}><Plus className="mr-2 h-4 w-4" /> Validate Competency</Button>}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric title="Definitions" value={String(care.competencyDefinitions.length)} detail="Configured competency definitions." />
        <Metric title="Due Soon" value={String(metrics.dueSoon.length)} detail="Validations approaching expiry." />
        <Metric title="Expired" value={String(metrics.expired.length)} detail="Expired competency validations." />
        <Metric title="Supervision Required" value={String(metrics.supervision.length)} detail="Competent with supervision." />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Competency Definitions</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Training Prerequisite</th><th className="px-4 py-3">Supervision</th><th className="px-4 py-3">Status</th></tr></thead>
                <tbody>
                  {care.competencyDefinitions.map((definition) => <tr key={definition.id} className="border-t"><td className="px-4 py-3 font-medium">{definition.code}</td><td className="px-4 py-3">{definition.title}</td><td className="px-4 py-3">{title(definition.category)}</td><td className="px-4 py-3">{definition.requiresTrainingCourseIds?.length || 0}</td><td className="px-4 py-3">{definition.supervisionAllowed ? "Allowed" : "Not allowed"}</td><td className="px-4 py-3"><Badge variant="outline">{title(definition.status)}</Badge></td></tr>)}
                  {care.competencyDefinitions.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">No Competency Definitions have been configured.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Competency Requirements</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {care.competencyRequirements.map((requirement) => {
              const definition = care.competencyDefinitions.find((item) => item.id === requirement.competencyDefinitionId);
              return <div key={requirement.id} className="rounded-lg border p-3 text-sm"><div className="font-medium">{definition?.title || "Competency"}</div><div className="text-muted-foreground">{title(requirement.targetType)} - {requirement.roleKeys?.join(", ") || requirement.nursingHomeId || requirement.wardId || requirement.staffMemberId || "All Staff"} - {requirement.mandatory ? "Mandatory" : "Optional"}</div></div>;
            })}
            {care.competencyRequirements.length === 0 && <p className="text-sm text-muted-foreground">No Competency Requirements apply to the selected scope.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Validation Workflow</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-[240px] pl-8" placeholder="Search validations" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-[210px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All statuses</SelectItem>{["competent", "competent_with_supervision", "due_soon", "expired", "pending_validation", "not_yet_competent"].map((item) => <SelectItem key={item} value={item}>{title(item)}</SelectItem>)}</SelectContent></Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Staff Member</th><th className="px-4 py-3">Competency</th><th className="px-4 py-3">Scope</th><th className="px-4 py-3">Validation Date</th><th className="px-4 py-3">Expiry / Review</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Restrictions</th><th className="px-4 py-3">Actions</th></tr></thead>
              <tbody>
                {validationRows.map((validation) => {
                  const staff = care.staffMembers.find((item) => String(item.id) === String(validation.staffMemberId));
                  const definition = care.competencyDefinitions.find((item) => item.id === validation.competencyDefinitionId);
                  return <tr key={validation.id} className="border-t"><td className="px-4 py-3 font-medium">{staff?.displayName || "Staff Member"}</td><td className="px-4 py-3">{definition?.title || "Competency"}</td><td className="px-4 py-3">{title(validation.scopeType)}</td><td className="px-4 py-3">{validation.validationDate || "Not recorded"}</td><td className="px-4 py-3">{validation.expiryDate || validation.reviewDate || "Not recorded"}</td><td className="px-4 py-3"><Badge variant="outline">{title(getCompetencyStatus(validation))}</Badge></td><td className="px-4 py-3">{validation.restrictionsPresent ? "Yes" : "No"}</td><td className="px-4 py-3"><Button size="sm" variant="outline" asChild><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: String(validation.staffMemberId) }}>Profile</Link></Button></td></tr>;
                })}
                {validationRows.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">No Competency Validations have been recorded for this Staff Member.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Competency Matrix</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full min-w-[720px] text-left text-xs"><thead><tr><th className="px-3 py-2">Staff</th>{matrix.competencies.slice(0, 6).map((definition) => <th key={definition.competencyDefinitionId} className="px-3 py-2">{definition.code}</th>)}</tr></thead><tbody>{matrix.rows.map((row) => <tr key={String(row.staffMemberId)} className="border-t"><td className="px-3 py-2 font-medium">{row.staffDisplayName}</td>{row.cells.slice(0, 6).map((cell) => <td key={cell.competencyDefinitionId} className="px-3 py-2"><Badge variant="outline">{title(cell.status)}</Badge><div className="text-muted-foreground">{cell.expiryDate || cell.validationDate || ""}</div></td>)}</tr>)}</tbody></table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ward Readiness Boundary</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Roster readiness can consume competency validations, supervision flags and restrictions from this workspace. No final safe-staffing decision is made here.</CardContent>
      </Card>

      <ValidationDialog open={validationOpen} onOpenChange={setValidationOpen} onSave={(input) => { try { care.recordCompetencyValidation(input); toast.success("Competency validation recorded."); setValidationOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Competency Validation could not be saved."); } }} />
    </div>
  );
}

function ValidationDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (input: RecordCompetencyValidationCommand) => void }) {
  const care = useCare();
  const [form, setForm] = useState<RecordCompetencyValidationCommand>({ staffMemberId: care.staffMembers[0]?.id || "", competencyDefinitionId: care.competencyDefinitions.find((item) => item.status === "active")?.id || "", nursingHomeId: care.activeFacilityId, validationDate: new Date().toISOString().slice(0, 10), supervisionRequired: false, restrictionsPresent: false, clientRequestId: `competency-validation-${Date.now()}` });
  const set = (key: keyof RecordCompetencyValidationCommand, value: string | boolean) => setForm((current) => ({ ...current, [key]: value || undefined }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Validate Competency</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Staff Member"><Select value={form.staffMemberId} onValueChange={(value) => set("staffMemberId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.staffMembers.map((staff) => <SelectItem key={staff.id} value={staff.id}>{staff.displayName}</SelectItem>)}</SelectContent></Select></Field><Field label="Competency"><Select value={form.competencyDefinitionId} onValueChange={(value) => set("competencyDefinitionId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.competencyDefinitions.filter((definition) => definition.status === "active").map((definition) => <SelectItem key={definition.id} value={definition.id}>{definition.title}</SelectItem>)}</SelectContent></Select></Field><Field label="Home"><Select value={form.nursingHomeId || ""} onValueChange={(value) => set("nursingHomeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.facilities.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Role"><Input value={form.roleKey || ""} onChange={(event) => set("roleKey", event.target.value)} /></Field><Field label="Validation Date"><Input type="date" value={form.validationDate || ""} onChange={(event) => set("validationDate", event.target.value)} /></Field><Field label="Expiry Date"><Input type="date" value={form.expiryDate || ""} onChange={(event) => set("expiryDate", event.target.value)} /></Field><Field label="Evidence File ID"><Input value={form.evidenceFileId || ""} onChange={(event) => set("evidenceFileId", event.target.value)} /></Field><Field label="Assessment Summary"><Input value={form.assessmentSummary || ""} onChange={(event) => set("assessmentSummary", event.target.value)} /></Field></div><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.supervisionRequired)} onChange={(event) => set("supervisionRequired", event.target.checked)} /> Competent with supervision</label><label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.restrictionsPresent)} onChange={(event) => set("restrictionsPresent", event.target.checked)} /> Restrictions present</label><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave({ ...form, clientRequestId: form.clientRequestId || `competency-validation-${Date.now()}` })}>Record Validation</Button></div></DialogContent></Dialog>;
}

function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <Card><CardContent className="p-4"><div className="text-xs font-medium text-muted-foreground">{title}</div><div className="mt-2 text-2xl font-semibold">{value}</div><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
