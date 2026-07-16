import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useCare } from "@/lib/care/store";
import {
  getRecruitmentPipelineSummary,
  getStaffingEstablishmentWorkspace,
  type CreateRecruitmentOfferCommand,
  type CreateRecruitmentVacancyCommand,
} from "@/domain/workforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/workforce/recruitment")({
  head: () => ({ meta: [{ title: "Vacancies & Recruitment - NuCare" }] }),
  component: RecruitmentWorkspace,
});

const ALL = "all";
const roleOptions = ["NURSE", "CNM", "HCA", "DOCTOR", "ALLIED_HEALTH", "HOUSEKEEPING", "KITCHEN", "MAINTENANCE", "ADMINISTRATION", "FINANCE", "OPERATIONS", "OTHER"];
const vacancyStatuses = ["draft", "approval_required", "approved", "open", "advertising", "applications_open", "shortlisting", "interviewing", "offer_pending", "offer_sent", "offer_accepted", "pre_employment_checks", "start_scheduled", "filled", "on_hold", "cancelled", "closed_unfilled", "entered_in_error"];
const stageOptions = ["not_started", "applications_received", "initial_screening", "shortlisted", "interview_scheduled", "first_interview", "second_interview", "reference_check", "preferred_candidate", "offer_preparation", "completed"];

function RecruitmentWorkspace() {
  const care = useCare();
  const [homeId, setHomeId] = useState(care.activeFacilityId);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [vacancyOpen, setVacancyOpen] = useState(false);
  const [candidateFor, setCandidateFor] = useState<string | undefined>();
  const [offerFor, setOfferFor] = useState<string | undefined>();
  const can = (capability: string) => care.canAccess(capability, { nursingHomeId: homeId });
  const establishment = useMemo(() => getStaffingEstablishmentWorkspace({
    versions: care.staffingEstablishmentVersions,
    lines: care.staffingEstablishmentLines,
    employmentRecords: care.employmentRecords,
    homeAssignments: care.employmentHomeAssignments,
    recruitmentVacancies: care.recruitmentVacancies,
    nursingHomeId: homeId,
  }), [care, homeId]);
  const pipeline = getRecruitmentPipelineSummary({ vacancies: care.recruitmentVacancies, offers: care.recruitmentOffers });
  const rows = care.recruitmentVacancies
    .filter((vacancy) => String(vacancy.nursingHomeId) === homeId)
    .filter((vacancy) => status === ALL || vacancy.status === status)
    .filter((vacancy) => {
      const q = search.trim().toLowerCase();
      return !q || [vacancy.jobTitle, vacancy.roleKey, vacancy.status, vacancy.currentInterviewStage].some((value) => String(value || "").toLowerCase().includes(q));
    });
  const selectedVacancy = care.recruitmentVacancies.find((vacancy) => vacancy.id === (candidateFor || offerFor));

  if (!can("recruitment.view")) {
    return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have access to Vacancies & Recruitment.</CardContent></Card></div>;
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vacancies & Recruitment</h1>
          <p className="text-sm text-muted-foreground">Manage recruitment activity separately from approved Staffing Establishment shortages.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={homeId} onValueChange={setHomeId}><SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger><SelectContent>{care.facilities.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select>
          <Button variant="outline" asChild><Link to="/workforce/establishment">Open Establishment Shortages</Link></Button>
          {can("recruitment.create_vacancy") && <Button onClick={() => setVacancyOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Vacancy</Button>}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Metric title="Establishment Shortages" value={String(establishment.vacancySummary.length)} detail="Approved shortages from Establishment." />
        <Metric title="Active Recruitment" value={String(pipeline.activeVacancies)} detail="Vacancies currently being progressed." />
        <Metric title="Advertising" value={String(pipeline.inAdvertising)} detail="Advertising or applications open." />
        <Metric title="Offers" value={String(pipeline.offersPending)} detail="Offer workflow in progress." />
        <Metric title="Starts Scheduled" value={String(pipeline.startsScheduled)} detail="Accepted starts awaiting hire." />
      </div>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Vacancy List</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-[240px] pl-8" placeholder="Search vacancies" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All statuses</SelectItem>{vacancyStatuses.map((item) => <SelectItem key={item} value={item}>{title(item)}</SelectItem>)}</SelectContent></Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Job Title</th>
                  <th className="px-4 py-3 font-medium">Canonical Role</th>
                  <th className="px-4 py-3 font-medium">Required</th>
                  <th className="px-4 py-3 font-medium">Filled</th>
                  <th className="px-4 py-3 font-medium">Establishment Shortage</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Advertising Source</th>
                  <th className="px-4 py-3 font-medium">Planned Start</th>
                  <th className="px-4 py-3 font-medium">Urgency</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((vacancy) => {
                  const sources = vacancy.advertisingSourceIds.map((id) => care.recruitmentAdvertisingSources.find((source) => source.id === id)?.name).filter(Boolean).join(", ");
                  return (
                    <tr key={vacancy.id} className="border-t align-top">
                      <td className="px-4 py-3 font-medium">{vacancy.jobTitle}</td>
                      <td className="px-4 py-3">{vacancy.roleKey}</td>
                      <td className="px-4 py-3">{vacancy.positionsRequired ?? vacancy.fteRequired ?? vacancy.hoursPerWeekRequired}</td>
                      <td className="px-4 py-3">{vacancy.positionsFilled}</td>
                      <td className="px-4 py-3">{vacancy.establishmentLineId ? "Linked" : "Unavailable"}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{title(vacancy.status)}</Badge></td>
                      <td className="px-4 py-3">{title(vacancy.currentInterviewStage || "not_started")}</td>
                      <td className="px-4 py-3">{sources || "Not recorded"}</td>
                      <td className="px-4 py-3">{vacancy.plannedStartDate || vacancy.targetStartDate || "Not scheduled"}</td>
                      <td className="px-4 py-3"><Badge>{title(vacancy.priority)}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {can("recruitment.manage_candidates") && <Button size="sm" variant="outline" onClick={() => setCandidateFor(vacancy.id)}>Add Candidate</Button>}
                          {can("recruitment.create_offer") && <Button size="sm" variant="outline" onClick={() => setOfferFor(vacancy.id)}>Record Offer</Button>}
                          {can("recruitment.open_vacancy") && <StatusButton label="Open" status="open" vacancyId={vacancy.id} />}
                          {can("recruitment.place_on_hold") && <StatusButton label="Hold" status="on_hold" vacancyId={vacancy.id} />}
                          {can("recruitment.enter_in_error") && <StatusButton label="Error" status="entered_in_error" vacancyId={vacancy.id} />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && <tr><td colSpan={11} className="px-4 py-10 text-center text-sm text-muted-foreground">No Recruitment Vacancies have been created for the selected scope.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recruitment Pipeline</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stageOptions.map((stage) => <Metric key={stage} title={title(stage)} value={String(care.recruitmentCandidates.filter((candidate) => candidate.currentStage === stage).length)} detail="Candidate stage count." />)}
        </CardContent>
      </Card>

      <VacancyDialog open={vacancyOpen} homeId={homeId} onOpenChange={setVacancyOpen} onSave={(input) => {
        try {
          care.createRecruitmentVacancy(input);
          toast.success("Recruitment Vacancy created.");
          setVacancyOpen(false);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "The Recruitment Vacancy could not be saved.");
        }
      }} />
      {selectedVacancy && <CandidateDialog open={Boolean(candidateFor)} vacancyId={selectedVacancy.id} onOpenChange={(open) => !open && setCandidateFor(undefined)} onSave={(input) => {
        try {
          care.addRecruitmentCandidate(input);
          toast.success("Candidate added.");
          setCandidateFor(undefined);
        } catch {
          toast.error("The candidate could not be moved to the selected stage.");
        }
      }} />}
      {selectedVacancy && <OfferDialog open={Boolean(offerFor)} vacancy={selectedVacancy} onOpenChange={(open) => !open && setOfferFor(undefined)} onSave={(input) => {
        try {
          care.createRecruitmentOffer(input);
          toast.success("Offer recorded.");
          setOfferFor(undefined);
        } catch {
          toast.error("The hire could not be completed.");
        }
      }} />}
    </div>
  );
}

function StatusButton({ vacancyId, status, label }: { vacancyId: string; status: string; label: string }) {
  const care = useCare();
  return <Button size="sm" variant="ghost" onClick={() => care.updateRecruitmentVacancyStatus(vacancyId, status as any)}>{label}</Button>;
}

function VacancyDialog({ open, homeId, onOpenChange, onSave }: { open: boolean; homeId: string; onOpenChange: (open: boolean) => void; onSave: (input: CreateRecruitmentVacancyCommand) => void }) {
  const care = useCare();
  const [form, setForm] = useState<CreateRecruitmentVacancyCommand>({ nursingHomeId: homeId, jobTitle: "Registered Nurse", roleKey: "NURSE", employmentBasis: "headcount", positionsRequired: 1, fteRequired: 1, priority: "medium", sourceReason: "establishment_vacancy", advertisingSourceIds: [], clientRequestId: `recruitment-${Date.now()}` });
  const shortages = getStaffingEstablishmentWorkspace({ versions: care.staffingEstablishmentVersions, lines: care.staffingEstablishmentLines, employmentRecords: care.employmentRecords, homeAssignments: care.employmentHomeAssignments, recruitmentVacancies: care.recruitmentVacancies, nursingHomeId: homeId }).vacancySummary;
  const set = (key: keyof CreateRecruitmentVacancyCommand, value: any) => setForm((current) => ({ ...current, nursingHomeId: homeId, [key]: ["positionsRequired", "fteRequired", "hoursPerWeekRequired"].includes(key) ? Number(value) || undefined : value || undefined }));
  const linkShortage = (lineId: string) => {
    const line = care.staffingEstablishmentLines.find((item) => item.id === lineId);
    const version = line ? care.staffingEstablishmentVersions.find((item) => item.id === line.establishmentVersionId) : undefined;
    if (line && version) setForm((current) => ({ ...current, establishmentLine: line, establishmentVersion: version, roleKey: line.roleKey, positionsRequired: line.budgetedHeadcount || current.positionsRequired, fteRequired: line.budgetedFte || current.fteRequired }));
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Add Vacancy</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nursing Home"><Select value={form.nursingHomeId} onValueChange={(value) => set("nursingHomeId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.facilities.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Establishment Shortage"><Select value={String(form.establishmentLine?.id || "")} onValueChange={linkShortage}><SelectTrigger><SelectValue placeholder="Optional linkage" /></SelectTrigger><SelectContent>{shortages.length ? shortages.map((item) => <SelectItem key={item.establishmentLineId} value={item.establishmentLineId!}>{item.roleLabel} - {item.vacantHeadcount ?? 0} HC / {item.vacantFte ?? 0} WTE</SelectItem>) : <SelectItem value="none" disabled>No approved shortages</SelectItem>}</SelectContent></Select></Field>
        <Field label="Job Title"><Input value={form.jobTitle} onChange={(event) => set("jobTitle", event.target.value)} /></Field>
        <Field label="Canonical Role"><Select value={form.roleKey} onValueChange={(value) => set("roleKey", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roleOptions.map((role) => <SelectItem key={role} value={role}>{title(role)}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Employment Basis"><Select value={form.employmentBasis} onValueChange={(value) => set("employmentBasis", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="headcount">Headcount</SelectItem><SelectItem value="fte">WTE/FTE</SelectItem><SelectItem value="hours">Hours</SelectItem></SelectContent></Select></Field>
        <Field label="Required Headcount"><Input type="number" value={form.positionsRequired ?? ""} onChange={(event) => set("positionsRequired", event.target.value)} /></Field>
        <Field label="Required WTE"><Input type="number" step="0.1" value={form.fteRequired ?? ""} onChange={(event) => set("fteRequired", event.target.value)} /></Field>
        <Field label="Required Weekly Hours"><Input type="number" step="0.5" value={form.hoursPerWeekRequired ?? ""} onChange={(event) => set("hoursPerWeekRequired", event.target.value)} /></Field>
        <Field label="Source Reason"><Select value={form.sourceReason} onValueChange={(value) => set("sourceReason", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["establishment_vacancy", "replacement", "new_service", "temporary_cover", "leave_cover", "growth", "other"].map((item) => <SelectItem key={item} value={item}>{title(item)}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Urgency"><Select value={form.priority} onValueChange={(value) => set("priority", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["low", "medium", "high", "critical"].map((item) => <SelectItem key={item} value={item}>{title(item)}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Target Start Date"><Input type="date" value={form.targetStartDate || ""} onChange={(event) => set("targetStartDate", event.target.value)} /></Field>
        <Field label="Notes"><Input value={form.notes || ""} onChange={(event) => set("notes", event.target.value)} /></Field>
      </div>
      <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave({ ...form, nursingHomeId: homeId, clientRequestId: form.clientRequestId || `recruitment-${Date.now()}` })}>Save Vacancy</Button></div>
    </DialogContent></Dialog>
  );
}

function CandidateDialog({ open, vacancyId, onOpenChange, onSave }: { open: boolean; vacancyId: string; onOpenChange: (open: boolean) => void; onSave: (input: any) => void }) {
  const [form, setForm] = useState({ recruitmentVacancyId: vacancyId, firstName: "", surname: "", applicationDate: new Date().toISOString().slice(0, 10), plannedStartDate: "" });
  const set = (key: string, value: string) => setForm((current) => ({ ...current, recruitmentVacancyId: vacancyId, [key]: value }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add Candidate</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="First Name"><Input value={form.firstName} onChange={(event) => set("firstName", event.target.value)} /></Field><Field label="Surname"><Input value={form.surname} onChange={(event) => set("surname", event.target.value)} /></Field><Field label="Application Date"><Input type="date" value={form.applicationDate} onChange={(event) => set("applicationDate", event.target.value)} /></Field><Field label="Planned Start Date"><Input type="date" value={form.plannedStartDate} onChange={(event) => set("plannedStartDate", event.target.value)} /></Field></div><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave(form)}>Add Candidate</Button></div></DialogContent></Dialog>;
}

function OfferDialog({ open, vacancy, onOpenChange, onSave }: { open: boolean; vacancy: any; onOpenChange: (open: boolean) => void; onSave: (input: CreateRecruitmentOfferCommand) => void }) {
  const care = useCare();
  const candidates = care.recruitmentCandidates.filter((candidate) => candidate.recruitmentVacancyId === vacancy.id);
  const [form, setForm] = useState<CreateRecruitmentOfferCommand>({ recruitmentVacancyId: vacancy.id, candidateId: candidates[0]?.id || "", proposedRoleKey: vacancy.roleKey, proposedNursingHomeId: String(vacancy.nursingHomeId), proposedFte: vacancy.fteRequired, proposedHoursPerWeek: vacancy.hoursPerWeekRequired, proposedStartDate: vacancy.plannedStartDate });
  const set = (key: keyof CreateRecruitmentOfferCommand, value: string) => setForm((current) => ({ ...current, recruitmentVacancyId: vacancy.id, [key]: ["proposedFte", "proposedHoursPerWeek"].includes(key) ? Number(value) || undefined : value || undefined }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Record Offer</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Candidate"><Select value={form.candidateId} onValueChange={(value) => set("candidateId", value)}><SelectTrigger><SelectValue placeholder="Select candidate" /></SelectTrigger><SelectContent>{candidates.map((candidate) => <SelectItem key={candidate.id} value={candidate.id}>{candidate.firstName} {candidate.surname}</SelectItem>)}</SelectContent></Select></Field><Field label="Proposed Role"><Select value={form.proposedRoleKey} onValueChange={(value) => set("proposedRoleKey", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roleOptions.map((role) => <SelectItem key={role} value={role}>{title(role)}</SelectItem>)}</SelectContent></Select></Field><Field label="Proposed WTE"><Input type="number" step="0.1" value={form.proposedFte ?? ""} onChange={(event) => set("proposedFte", event.target.value)} /></Field><Field label="Start Date"><Input type="date" value={form.proposedStartDate || ""} onChange={(event) => set("proposedStartDate", event.target.value)} /></Field><Field label="Notes"><Input value={form.notes || ""} onChange={(event) => set("notes", event.target.value)} /></Field></div><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!form.candidateId} onClick={() => onSave(form)}>Create Offer</Button></div></DialogContent></Dialog>;
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
