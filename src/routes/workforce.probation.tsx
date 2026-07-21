import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCare } from "@/lib/care/store";
import type { StaffProbation, StaffProbationReview } from "@/lib/care/types";
import { getProbationReviewsDueMetric, type CreateStaffProbationCommand } from "@/domain/workforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/workforce/probation")({
  head: () => ({ meta: [{ title: "Probation - NuCare" }] }),
  component: ProbationWorkspace,
});

function ProbationWorkspace() {
  const care = useCare();
  const [homeId, setHomeId] = useState(care.activeFacilityId);
  const [createOpen, setCreateOpen] = useState(false);
  const [extendTarget, setExtendTarget] = useState<StaffProbation | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const dueBy = addDays(today, 14);
  const can = (capability: string) => care.canAccess(capability, { nursingHomeId: homeId });
  const probations = care.staffProbations.filter((probation) => probation.nursingHomeId === homeId && probation.status !== "entered_in_error");
  const reviews = care.staffProbationReviews.filter((review) => review.nursingHomeId === homeId && review.status !== "entered_in_error");
  const active = probations.filter((probation) => ["active", "extended"].includes(probation.status));
  const due = reviews.filter((review) => review.status !== "completed" && review.scheduledDate >= today && review.scheduledDate <= dueBy);
  const overdue = reviews.filter((review) => review.status !== "completed" && review.scheduledDate < today);
  const completed = reviews.filter((review) => review.status === "completed").slice(0, 12);
  const history = probations.filter((probation) => ["completed", "failed", "cancelled"].includes(probation.status)).slice(0, 12);
  const dueMetric = getProbationReviewsDueMetric({ reviews: care.staffProbationReviews, policies: care.probationReviewSchedulePolicies, nursingHomeId: homeId, dueBy, date: today });

  if (!can("probation.view")) {
    return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have access to Probation.</CardContent></Card></div>;
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Probation</h1>
          <p className="text-sm text-muted-foreground">Active probation, scheduled reviews, overdue follow-up, extensions and final outcomes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={homeId} onValueChange={setHomeId}><SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger><SelectContent>{care.facilities.map((home) => <SelectItem key={home.id} value={home.id}>{home.name}</SelectItem>)}</SelectContent></Select>
          {can("probation.create") && <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Probation</Button>}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric title="Active Probation" value={active.length} detail="Staff currently in probation or extended probation." />
        <Metric title="Reviews Due" value={dueMetric.value ?? due.length} detail={dueMetric.explanation} />
        <Metric title="Overdue Reviews" value={overdue.length} detail="Scheduled reviews before today that are not complete." />
        <Metric title="Completed Reviews" value={completed.length} detail="Completed probation reviews in history." />
      </div>

      <ProbationTable title="Active Probation" rows={active} empty="No active probation records." action={(probation) => <div className="flex justify-end gap-2">{can("probation.extend") && <Button size="sm" variant="outline" onClick={() => setExtendTarget(probation)}>Extend</Button>}{can("probation.complete") && <Button size="sm" variant="outline" onClick={() => completeProbation(care, probation.id, "completed")}>Pass</Button>}{can("probation.complete") && <Button size="sm" variant="outline" onClick={() => completeProbation(care, probation.id, "failed")}>Fail</Button>}</div>} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ReviewTable title="Reviews Due" rows={due} empty="No probation reviews are due in the next 14 days." action={(review) => can("probation.complete_review") && <Button size="sm" variant="outline" onClick={() => completeReview(care, review.id, "continue")}>Complete</Button>} />
        <ReviewTable title="Overdue Reviews" rows={overdue} empty="No probation reviews are overdue." action={(review) => can("probation.complete_review") && <Button size="sm" variant="outline" onClick={() => completeReview(care, review.id, "continue")}>Complete</Button>} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ReviewTable title="Completed Review History" rows={completed} empty="No completed probation reviews." />
        <ProbationTable title="Probation History" rows={history} empty="No closed probation records." />
      </div>

      <CreateProbationDialog open={createOpen} homeId={homeId} onOpenChange={setCreateOpen} onSave={(input) => {
        try {
          care.createStaffProbation(input);
          toast.success("Probation record created and reviews scheduled.");
          setCreateOpen(false);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "The Probation could not be saved.");
        }
      }} />
      {extendTarget && <ExtendDialog probation={extendTarget} onOpenChange={(open) => !open && setExtendTarget(null)} onSave={(date, reason) => {
        try {
          care.extendStaffProbation(extendTarget.id, date, reason);
          toast.success("Probation extended.");
          setExtendTarget(null);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "The Probation could not be saved.");
        }
      }} />}
    </div>
  );
}

function CreateProbationDialog({ open, homeId, onOpenChange, onSave }: { open: boolean; homeId: string; onOpenChange: (open: boolean) => void; onSave: (input: CreateStaffProbationCommand) => void }) {
  const care = useCare();
  const firstEmployment = care.employmentRecords[0];
  const [form, setForm] = useState<CreateStaffProbationCommand>({ staffMemberId: firstEmployment?.staffMemberId || care.staffMembers[0]?.id || "", employmentRecordId: firstEmployment?.id || "", nursingHomeId: homeId, probationStartDate: new Date().toISOString().slice(0, 10), expectedEndDate: addDays(new Date().toISOString().slice(0, 10), 90), notes: "" });
  const set = (key: keyof CreateStaffProbationCommand, value: string) => setForm((current) => ({ ...current, nursingHomeId: homeId, [key]: value || undefined }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Probation</DialogTitle></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Employment Record"><Select value={form.employmentRecordId} onValueChange={(value) => { const employment = care.employmentRecords.find((record) => record.id === value); setForm((current) => ({ ...current, employmentRecordId: value, staffMemberId: employment?.staffMemberId || current.staffMemberId, nursingHomeId: homeId })); }}><SelectTrigger><SelectValue placeholder="Select employment" /></SelectTrigger><SelectContent>{care.employmentRecords.map((record) => <SelectItem key={record.id} value={record.id}>{staffName(care, record.staffMemberId)} - {record.jobTitle || record.primaryRoleKey}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Start Date"><Input type="date" value={form.probationStartDate} onChange={(event) => set("probationStartDate", event.target.value)} /></Field>
          <Field label="Expected End"><Input type="date" value={form.expectedEndDate} onChange={(event) => set("expectedEndDate", event.target.value)} /></Field>
        </div>
        <Field label="Notes"><Textarea value={form.notes || ""} onChange={(event) => set("notes", event.target.value)} /></Field>
        <div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!form.staffMemberId || !form.employmentRecordId} onClick={() => onSave({ ...form, nursingHomeId: homeId })}>Save</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function ExtendDialog({ probation, onOpenChange, onSave }: { probation: StaffProbation; onOpenChange: (open: boolean) => void; onSave: (date: string, reason: string) => void }) {
  const [date, setDate] = useState(addDays(probation.currentExpectedEndDate, 30));
  const [reason, setReason] = useState("");
  return <Dialog open onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Extend Probation</DialogTitle></DialogHeader><Field label="New Expected End"><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field><Field label="Reason"><Textarea value={reason} onChange={(event) => setReason(event.target.value)} /></Field><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!reason.trim()} onClick={() => onSave(date, reason)}>Extend</Button></div></DialogContent></Dialog>;
}

function ProbationTable({ title: tableTitle, rows, empty, action }: { title: string; rows: StaffProbation[]; empty: string; action?: (probation: StaffProbation) => ReactNode }) {
  const care = useCare();
  return <Card><CardHeader><CardTitle>{tableTitle}</CardTitle></CardHeader><CardContent><div className="overflow-hidden rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Staff</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="px-4 py-3 font-medium"><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: String(row.staffMemberId) }} aria-label={`Open Staff Profile for ${staffName(care, row.staffMemberId)}`} className="hover:underline">{staffName(care, row.staffMemberId)}</Link></td><td className="px-4 py-3 text-muted-foreground">{row.probationStartDate} to {row.currentExpectedEndDate}</td><td className="px-4 py-3"><Badge variant="outline">{title(row.status)}</Badge></td><td className="px-4 py-3 text-right">{action?.(row)}</td></tr>)}{rows.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">{empty}</td></tr>}</tbody></table></div></CardContent></Card>;
}

function ReviewTable({ title: tableTitle, rows, empty, action }: { title: string; rows: StaffProbationReview[]; empty: string; action?: (review: StaffProbationReview) => ReactNode }) {
  const care = useCare();
  return <Card><CardHeader><CardTitle>{tableTitle}</CardTitle></CardHeader><CardContent><div className="overflow-hidden rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Staff</th><th className="px-4 py-3">Review</th><th className="px-4 py-3">Scheduled</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="px-4 py-3 font-medium"><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: String(row.staffMemberId) }} aria-label={`Open Staff Profile for ${staffName(care, row.staffMemberId)}`} className="hover:underline">{staffName(care, row.staffMemberId)}</Link></td><td className="px-4 py-3">Review {row.reviewNumber}</td><td className="px-4 py-3 text-muted-foreground">{row.scheduledDate}</td><td className="px-4 py-3"><Badge variant="outline">{title(row.status)}</Badge></td><td className="px-4 py-3 text-right">{action?.(row)}</td></tr>)}{rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">{empty}</td></tr>}</tbody></table></div></CardContent></Card>;
}

function Metric({ title: metricTitle, value, detail }: { title: string; value: number; detail: string }) {
  return <Card><CardContent className="p-4"><div className="text-xs font-medium text-muted-foreground">{metricTitle}</div><div className="mt-2 text-2xl font-semibold">{value}</div><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function completeReview(care: ReturnType<typeof useCare>, id: string, outcome: StaffProbationReview["outcome"]) {
  try {
    care.completeProbationReview(id, outcome);
    toast.success("Probation review completed.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "The Probation Review could not be saved.");
  }
}

function completeProbation(care: ReturnType<typeof useCare>, id: string, status: "completed" | "failed" | "cancelled") {
  try {
    care.completeStaffProbation(id, status);
    toast.success("Probation outcome recorded.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "The Probation could not be saved.");
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
