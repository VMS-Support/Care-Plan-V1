import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PlayCircle, Plus, Search } from "lucide-react";
import { useCare } from "@/lib/care/store";
import {
  getTrainingComplianceMetric,
  getTrainingMatrixViewModel,
  getTrainingNotStartedMetric,
  getTrainingOverdueMetric,
  latestTrainingCompletion,
  type AssignTrainingCommand,
  type RecordTrainingCompletionCommand,
} from "@/domain/workforce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/workforce/training")({
  head: () => ({ meta: [{ title: "Training - NuCare" }] }),
  component: TrainingWorkspace,
});

const ALL = "all";

function TrainingWorkspace() {
  const care = useCare();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [assignOpen, setAssignOpen] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const can = (capability: string) => care.canAccess(capability, { nursingHomeId: care.activeFacilityId });
  const metric = getTrainingComplianceMetric({ assignments: care.staffTrainingAssignments, completions: care.staffTrainingCompletions, courses: care.trainingCourses });
  const overdue = getTrainingOverdueMetric({ assignments: care.staffTrainingAssignments, completions: care.staffTrainingCompletions, courses: care.trainingCourses });
  const notStarted = getTrainingNotStartedMetric({ assignments: care.staffTrainingAssignments, completions: care.staffTrainingCompletions, courses: care.trainingCourses });
  const matrix = getTrainingMatrixViewModel({ staffMembers: care.staffMembers.slice(0, 12), courses: care.trainingCourses, assignments: care.staffTrainingAssignments, completions: care.staffTrainingCompletions });
  const assignmentRows = care.staffTrainingAssignments
    .filter((assignment) => status === ALL || assignment.status === status)
    .filter((assignment) => {
      const course = care.trainingCourses.find((item) => item.id === assignment.trainingCourseId);
      const staff = care.staffMembers.find((item) => String(item.id) === String(assignment.staffMemberId));
      const q = search.trim().toLowerCase();
      return !q || [course?.title, course?.code, staff?.displayName, assignment.status].some((value) => String(value || "").toLowerCase().includes(q));
    });

  if (!can("training.view")) {
    return <div className="p-6"><Card><CardContent className="py-10 text-center text-sm text-muted-foreground">You do not have access to Training.</CardContent></Card></div>;
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Training</h1>
          <p className="text-sm text-muted-foreground">Course catalogue, requirements, assignments, completions and verification.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can("training.assign") && <Button variant="outline" onClick={() => { const count = care.generateTrainingAssignments(); toast.success(count ? `${count} assignment(s) generated.` : "No missing assignments found."); }}><PlayCircle className="mr-2 h-4 w-4" /> Generate Assignments</Button>}
          {can("training.assign") && <Button variant="outline" onClick={() => setAssignOpen(true)}><Plus className="mr-2 h-4 w-4" /> Assign Training</Button>}
          {can("training.record_completion") && <Button onClick={() => setCompletionOpen(true)}>Record Completion</Button>}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Metric title="Training Compliance" value={metric.percentage === undefined ? "Not Configured" : `${metric.percentage}%`} detail={`${metric.numerator} of ${metric.denominator} active assignments.`} />
        <Metric title="Overdue" value={String(overdue.value)} detail="Overdue or expired mandatory assignments." />
        <Metric title="Not Started" value={String(notStarted.value)} detail="Assigned mandatory training not started." />
        <Metric title="Pending Verification" value={String(metric.pendingVerificationAssignments.length)} detail="Completions requiring verification." />
        <Metric title="Affected Staff" value={String(metric.affectedStaffCount)} detail={metric.explanation} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Course Catalogue</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Mandatory</th><th className="px-4 py-3">Renewal</th><th className="px-4 py-3">Certificate</th><th className="px-4 py-3">Status</th></tr></thead>
                <tbody>
                  {care.trainingCourses.map((course) => <tr key={course.id} className="border-t"><td className="px-4 py-3 font-medium">{course.code}</td><td className="px-4 py-3">{course.title}</td><td className="px-4 py-3">{title(course.category)}</td><td className="px-4 py-3">{course.mandatoryByDefault ? "Yes" : "No"}</td><td className="px-4 py-3">{title(course.defaultRenewalFrequency || "no_expiry")}</td><td className="px-4 py-3">{course.certificateRequired ? "Required" : "Not required"}</td><td className="px-4 py-3"><Badge variant="outline">{title(course.status)}</Badge></td></tr>)}
                  {care.trainingCourses.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No Training Courses have been configured.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Training Requirements</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {care.trainingRequirements.map((requirement) => {
              const course = care.trainingCourses.find((item) => item.id === requirement.trainingCourseId);
              return <div key={requirement.id} className="rounded-lg border p-3 text-sm"><div className="font-medium">{course?.title || "Training Course"}</div><div className="text-muted-foreground">{title(requirement.targetType)} - {requirement.roleKeys?.join(", ") || requirement.nursingHomeId || requirement.wardId || requirement.staffMemberId || "All Staff"} - {requirement.mandatory ? "Mandatory" : "Optional"}</div></div>;
            })}
            {care.trainingRequirements.length === 0 && <p className="text-sm text-muted-foreground">No Training Requirements apply to the selected scope.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Staff Assignments</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="w-[240px] pl-8" placeholder="Search assignments" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>All statuses</SelectItem>{["assigned", "in_progress", "completed", "overdue", "expired", "exempt", "cancelled"].map((item) => <SelectItem key={item} value={item}>{title(item)}</SelectItem>)}</SelectContent></Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Staff Member</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Due Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Latest Completion</th><th className="px-4 py-3">Expiry</th><th className="px-4 py-3">Verification</th><th className="px-4 py-3">Actions</th></tr></thead>
              <tbody>
                {assignmentRows.map((assignment) => {
                  const staff = care.staffMembers.find((item) => String(item.id) === String(assignment.staffMemberId));
                  const course = care.trainingCourses.find((item) => item.id === assignment.trainingCourseId);
                  const completion = latestTrainingCompletion(care.staffTrainingCompletions, assignment);
                  return <tr key={assignment.id} className="border-t"><td className="px-4 py-3 font-medium">{staff?.displayName || "Staff Member"}</td><td className="px-4 py-3">{course?.title || "Training Course"}</td><td className="px-4 py-3">{assignment.dueDate || "Not set"}</td><td className="px-4 py-3"><Badge variant="outline">{title(assignment.status)}</Badge></td><td className="px-4 py-3">{completion?.completionDate || "Not recorded"}</td><td className="px-4 py-3">{completion?.expiryDate || "No expiry"}</td><td className="px-4 py-3">{completion?.verificationStatus ? title(completion.verificationStatus) : "N/A"}</td><td className="px-4 py-3"><div className="flex gap-1"><Button size="sm" variant="outline" asChild><Link to="/workforce/staff/$staffMemberId" params={{ staffMemberId: String(assignment.staffMemberId) }}>Profile</Link></Button>{completion && can("training.verify") && <Button size="sm" variant="ghost" onClick={() => { care.verifyTrainingCompletion(String(completion.id)); toast.success("Training completion verified."); }}>Verify</Button>}</div></td></tr>;
                })}
                {assignmentRows.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">No Training Assignments match the selected filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Training Matrix</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full min-w-[720px] text-left text-xs"><thead><tr><th className="px-3 py-2">Staff</th>{matrix.courses.slice(0, 6).map((course) => <th key={course.trainingCourseId} className="px-3 py-2">{course.code}</th>)}</tr></thead><tbody>{matrix.rows.map((row) => <tr key={String(row.staffMemberId)} className="border-t"><td className="px-3 py-2 font-medium">{row.staffDisplayName}</td>{row.cells.slice(0, 6).map((cell) => <td key={cell.trainingCourseId} className="px-3 py-2"><Badge variant="outline">{title(cell.status)}</Badge><div className="text-muted-foreground">{cell.expiryDate || cell.dueDate || ""}</div></td>)}</tr>)}</tbody></table>
        </CardContent>
      </Card>

      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} onSave={(input) => { try { care.assignTrainingToStaff(input); toast.success("Training assigned."); setAssignOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Training record could not be saved."); } }} />
      <CompletionDialog open={completionOpen} onOpenChange={setCompletionOpen} onSave={(input) => { try { care.recordTrainingCompletion(input); toast.success("Training completion recorded."); setCompletionOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "The Training record could not be saved."); } }} />
    </div>
  );
}

function AssignDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (input: AssignTrainingCommand) => void }) {
  const care = useCare();
  const [form, setForm] = useState<AssignTrainingCommand>({ staffMemberId: care.staffMembers[0]?.id || "", trainingCourseId: care.trainingCourses.find((course) => course.status === "active")?.id || "", dueDate: new Date().toISOString().slice(0, 10), source: "manual", clientRequestId: `training-assignment-${Date.now()}` });
  const set = (key: keyof AssignTrainingCommand, value: string) => setForm((current) => ({ ...current, [key]: value || undefined }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Assign Training</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Staff Member"><Select value={form.staffMemberId} onValueChange={(value) => set("staffMemberId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.staffMembers.map((staff) => <SelectItem key={staff.id} value={staff.id}>{staff.displayName}</SelectItem>)}</SelectContent></Select></Field><Field label="Course"><Select value={form.trainingCourseId} onValueChange={(value) => set("trainingCourseId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.trainingCourses.filter((course) => course.status === "active").map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></Field><Field label="Due Date"><Input type="date" value={form.dueDate || ""} onChange={(event) => set("dueDate", event.target.value)} /></Field></div><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave({ ...form, clientRequestId: form.clientRequestId || `training-assignment-${Date.now()}` })}>Assign</Button></div></DialogContent></Dialog>;
}

function CompletionDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (input: RecordTrainingCompletionCommand) => void }) {
  const care = useCare();
  const assignments = care.staffTrainingAssignments;
  const first = assignments[0];
  const [form, setForm] = useState<RecordTrainingCompletionCommand>({ staffMemberId: first ? String(first.staffMemberId) : care.staffMembers[0]?.id || "", trainingAssignmentId: first?.id, trainingCourseId: first?.trainingCourseId || care.trainingCourses[0]?.id || "", completionDate: new Date().toISOString().slice(0, 10), result: "completed", deliveryMethod: "classroom", clientRequestId: `training-completion-${Date.now()}` });
  const set = (key: keyof RecordTrainingCompletionCommand, value: string) => setForm((current) => ({ ...current, [key]: ["score", "passMark"].includes(key) ? Number(value) || undefined : value || undefined }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Record Completion</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><Field label="Staff Member"><Select value={form.staffMemberId} onValueChange={(value) => set("staffMemberId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.staffMembers.map((staff) => <SelectItem key={staff.id} value={staff.id}>{staff.displayName}</SelectItem>)}</SelectContent></Select></Field><Field label="Course"><Select value={form.trainingCourseId} onValueChange={(value) => set("trainingCourseId", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{care.trainingCourses.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></Field><Field label="Completion Date"><Input type="date" value={form.completionDate} onChange={(event) => set("completionDate", event.target.value)} /></Field><Field label="Expiry Date"><Input type="date" value={form.expiryDate || ""} onChange={(event) => set("expiryDate", event.target.value)} /></Field><Field label="Provider"><Input value={form.providerName || ""} onChange={(event) => set("providerName", event.target.value)} /></Field><Field label="Certificate File ID"><Input value={form.certificateFileId || ""} onChange={(event) => set("certificateFileId", event.target.value)} /></Field></div><div className="flex justify-end gap-2 pt-4"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave({ ...form, clientRequestId: form.clientRequestId || `training-completion-${Date.now()}` })}>Record</Button></div></DialogContent></Dialog>;
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
