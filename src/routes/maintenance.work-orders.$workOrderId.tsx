import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type React from "react";
import { toast } from "sonner";
import { ArrowLeft, Archive, ArrowRight, Edit, FileText, ImageIcon, Package, Timer, Wrench } from "lucide-react";
import { useCare } from "@/lib/care/store";
import type { MaintenanceWorkOrder, WorkOrderAttachment, WorkOrderLabourEntry, WorkOrderMaterialEntry, WorkOrderNote } from "@/lib/care/types";
import {
  isWorkOrderOverdue,
  workOrderAssigneeLabel,
  workOrderCategoryLabel,
  workOrderLocationLabel,
  workOrderPriorityLabel,
  workOrderSourceLabel,
  workOrderStatusLabel,
  workOrderTypeLabel,
  type UpdateWorkOrderInput,
} from "@/domain/maintenance/workOrders";
import {
  WORK_ORDER_ATTACHMENT_CATEGORIES,
  WORK_ORDER_EVIDENCE_TYPES,
  WORK_ORDER_NOTE_TYPES,
  noteTypeLabel,
  type WorkOrderTimelineItem,
} from "@/domain/maintenance/workOrderExecution";
import { WorkOrderForm } from "@/components/maintenance/WorkOrderForm";
import { WorkOrderWorkflowActions } from "@/components/maintenance/WorkOrderWorkflowActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/maintenance/work-orders/$workOrderId")({
  head: () => ({ meta: [{ title: "Work Order Details - NuCare" }] }),
  component: WorkOrderDetailRoute,
});

function WorkOrderDetailRoute() {
  const { workOrderId } = Route.useParams();
  const pathname = useRouterState({ select: (state) => state.location.pathname.replace(/\/+$/, "") });
  if (pathname !== `/maintenance/work-orders/${workOrderId}`) return <Outlet />;

  const care = useCare();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [executionTab, setExecutionTab] = useState<"notes" | "timeline" | "files" | "labour" | "materials">("notes");
  const record = useMemo(
    () => care.maintenanceWorkOrders.find((item) => item.id === workOrderId),
    [care.maintenanceWorkOrders, workOrderId],
  );
  const notes = useMemo(() => care.workOrderNotes.filter((item) => item.workOrderId === workOrderId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [care.workOrderNotes, workOrderId]);
  const attachments = useMemo(() => care.workOrderAttachments.filter((item) => item.workOrderId === workOrderId).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)), [care.workOrderAttachments, workOrderId]);
  const labour = useMemo(() => care.workOrderLabourEntries.filter((item) => item.workOrderId === workOrderId && !item.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [care.workOrderLabourEntries, workOrderId]);
  const materials = useMemo(() => care.workOrderMaterialEntries.filter((item) => item.workOrderId === workOrderId && !item.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [care.workOrderMaterialEntries, workOrderId]);
  const timeline = useMemo(() => care.getWorkOrderTimeline(workOrderId, 40), [care, workOrderId, notes, attachments, labour, materials, record?.updatedAt]);

  if (!care.canAccess("maintenance.work_orders.view") || (record && !canViewWorkOrderRecord(care, record))) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You do not have permission to view Work Orders for this area.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!record) return <NotFoundState />;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/maintenance" className="hover:text-foreground">Maintenance</Link>
            <ArrowRight className="h-3.5 w-3.5" />
            <Link to="/maintenance/work-orders" className="hover:text-foreground">Work Orders</Link>
            <ArrowRight className="h-3.5 w-3.5" />
            <span>{record.workOrderNumber}</span>
          </div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link to="/maintenance/work-orders"><ArrowLeft className="mr-2 h-4 w-4" />Back to Work Orders</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{record.title}</h1>
            <Badge variant="outline">{record.workOrderNumber}</Badge>
            {isWorkOrderOverdue(record) && <Badge variant="destructive">Overdue</Badge>}
            {record.archivedAt && <Badge variant="secondary">Archived</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{workOrderLocationLabel(record, care)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {care.canAccess("maintenance.work_orders.edit") && !record.archivedAt && (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}><Edit className="mr-2 h-4 w-4" />Edit Work Order</Button>
              <Button variant="outline" onClick={() => setArchiveOpen(true)}><Archive className="mr-2 h-4 w-4" />Archive</Button>
            </>
          )}
        </div>
      </div>

      <WorkOrderWorkflowActions record={record} />

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader><CardTitle>Issue Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap text-sm">{record.description}</p>
            {record.immediateRisk && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
                <div className="font-semibold text-red-900">Immediate Risk Control</div>
                <p className="mt-1 text-red-800">{record.immediateControlSummary}</p>
              </div>
            )}
            {record.affectedAssetDescription && (
              <DetailRow label="Affected Asset Description" value={record.affectedAssetDescription} />
            )}
            {record.assetId && (
              <DetailRow label="Asset ID / Register Reference" value={record.assetId} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Work Order Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Type" value={workOrderTypeLabel(record.type)} />
            <DetailRow label="Source" value={workOrderSourceLabel(record.source)} />
            <DetailRow label="Category" value={workOrderCategoryLabel(record.category)} />
            <DetailRow label="Subcategory" value={record.subcategory || "Not recorded"} />
            <DetailRow label="Priority" value={workOrderPriorityLabel(record.priority)} />
            <DetailRow label="Risk Level" value={record.riskLevel || "Not assessed"} />
            <DetailRow label="Status" value={workOrderStatusLabel(record.status)} />
            <DetailRow label="Assigned To" value={workOrderAssigneeLabel(record, care.users)} />
            <DetailRow label="Assigned At" value={record.assignedAt ? formatDate(record.assignedAt) : "Not assigned"} />
            <DetailRow label="Accepted" value={record.acceptedAt ? formatDate(record.acceptedAt) : "Not accepted"} />
            <DetailRow label="Reported By" value={record.reporterNameSnapshot || "Staff member"} />
            <DetailRow label="Reporter Contact" value={record.reporterContactDetails || "Not recorded"} />
            <DetailRow label="Reported At" value={formatDate(record.reportedAt)} />
            <DetailRow label="Response Target" value={record.requiredResponseAt ? formatDate(record.requiredResponseAt) : "No response target"} />
            <DetailRow label="Due Date" value={record.dueAt ? formatDate(record.dueAt) : "No due date"} />
            <DetailRow label="Last Updated" value={formatDate(record.updatedAt)} />
          </CardContent>
        </Card>
      </section>

      {record.riskAssessment && (
        <Card>
          <CardHeader><CardTitle>Risk Assessment</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-3">
            <DetailRow label="Likelihood" value={String(record.riskAssessment.likelihood)} />
            <DetailRow label="Consequence" value={String(record.riskAssessment.consequence)} />
            <DetailRow label="Score" value={String(record.riskAssessment.score)} />
            <DetailRow label="Calculated Level" value={record.riskAssessment.calculatedLevel} />
            <DetailRow label="Manual Override" value={record.riskAssessment.manualOverrideLevel || "None"} />
            <DetailRow label="Override Reason" value={record.riskAssessment.manualOverrideReason || "Not recorded"} />
            <DetailRow label="Immediate Action" value={record.riskAssessment.requiresImmediateAction ? "Yes" : "No"} />
            <DetailRow label="Vulnerable Person Affected" value={record.riskAssessment.vulnerablePersonAffected ? "Yes" : "No"} />
            <DetailRow label="Essential Service Affected" value={record.riskAssessment.essentialServiceAffected ? "Yes" : "No"} />
            <DetailRow label="Area Restricted" value={record.riskAssessment.areaRestricted ? "Yes" : "No"} />
            <DetailRow label="Area Restriction Details" value={record.riskAssessment.areaRestrictionDetails || "Not recorded"} />
            <DetailRow label="Control Measures" value={record.riskAssessment.controlMeasures || record.immediateControlSummary || "Not recorded"} />
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <ImpactCard label="Resident Safety Impact" active={record.residentSafetyImpact} />
        <ImpactCard label="Service Disruption" active={record.serviceDisruption} />
        <ImpactCard label="Compliance Impact" active={record.complianceImpact} />
      </section>

      <Card>
        <CardHeader><CardTitle>Workflow Timeline</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          <DetailRow label="Created" value={formatDate(record.createdAt)} />
          <DetailRow label="Response Achieved" value={record.responseAchievedAt ? formatDate(record.responseAchievedAt) : "Not recorded"} />
          <DetailRow label="Started" value={record.startedAt ? formatDate(record.startedAt) : "Not started"} />
          <DetailRow label="Waiting Since" value={record.waitingSince ? formatDate(record.waitingSince) : "Not waiting"} />
          <DetailRow label="Waiting Reason" value={record.waitingReasonText || record.waitingReasonCategory || "Not recorded"} />
          <DetailRow label="Resume Note" value={record.waitingResolutionNote || "Not recorded"} />
          <DetailRow label="Expected Parts" value={record.expectedAvailabilityAt ? formatDate(record.expectedAvailabilityAt) : record.partsSummary || "Not recorded"} />
          <DetailRow label="Expected Contractor" value={record.expectedAttendanceAt ? formatDate(record.expectedAttendanceAt) : record.contractorDetails || "Not recorded"} />
          <DetailRow label="Next Access Attempt" value={record.nextAccessAttemptAt ? formatDate(record.nextAccessAttemptAt) : record.accessIssue || "Not recorded"} />
          <DetailRow label="Active Work Time" value={formatDuration(record.totalActiveWorkMs)} />
          <DetailRow label="Waiting Time" value={formatDuration(record.totalWaitingMs)} />
          <DetailRow label="Completed" value={record.completedAt ? formatDate(record.completedAt) : "Not completed"} />
          <DetailRow label="Verification Required" value={record.verificationRequired ? "Yes" : "No"} />
          <DetailRow label="Verified" value={record.verifiedAt ? formatDate(record.verifiedAt) : "Not verified"} />
          <DetailRow label="Version" value={String(record.version)} />
        </CardContent>
      </Card>

      <WorkExecutionSection
        record={record}
        notes={notes}
        attachments={attachments}
        labour={labour}
        materials={materials}
        timeline={timeline}
        activeTab={executionTab}
        onTabChange={setExecutionTab}
      />

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/maintenance" className="hover:text-foreground">Maintenance</Link>
              <ArrowRight className="h-3.5 w-3.5" />
              <Link to="/maintenance/work-orders" className="hover:text-foreground">Work Orders</Link>
              <ArrowRight className="h-3.5 w-3.5" />
              <span>{record.workOrderNumber}</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Edit</span>
            </div>
            <DialogTitle>Edit Work Order</DialogTitle>
          </DialogHeader>
          <WorkOrderForm
            mode="edit"
            workOrder={record}
            onCancel={() => setEditing(false)}
            onSubmit={(input) => {
              try {
                care.updateMaintenanceWorkOrder(record.id, input as UpdateWorkOrderInput);
                toast.success("Work Order updated");
                setEditing(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to update Work Order");
                throw error;
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Archive Work Order</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Archive removes this Work Order from active operational views but keeps it available for audit and history.</p>
            <Textarea value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} placeholder="Reason for archiving" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setArchiveOpen(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  try {
                    care.archiveMaintenanceWorkOrder(record.id, archiveReason);
                    toast.success("Work Order archived");
                    setArchiveOpen(false);
                    navigate({ to: "/maintenance/work-orders" });
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Unable to archive Work Order");
                  }
                }}
              >
                Archive Work Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function WorkExecutionSection({
  record,
  notes,
  attachments,
  labour,
  materials,
  timeline,
  activeTab,
  onTabChange,
}: {
  record: MaintenanceWorkOrder;
  notes: WorkOrderNote[];
  attachments: WorkOrderAttachment[];
  labour: WorkOrderLabourEntry[];
  materials: WorkOrderMaterialEntry[];
  timeline: WorkOrderTimelineItem[];
  activeTab: "notes" | "timeline" | "files" | "labour" | "materials";
  onTabChange: (tab: "notes" | "timeline" | "files" | "labour" | "materials") => void;
}) {
  const care = useCare();
  const activeAttachments = attachments.filter((item) => !item.deletedAt);
  const totalLabour = labour.reduce((sum, item) => sum + item.durationMinutes, 0);
  if (!care.canAccess("maintenance.work_orders.execution.view", { nursingHomeId: record.homeId })) return null;
  const tabs = [
    { id: "notes" as const, label: `Notes (${notes.filter((item) => !item.deletedAt).length})`, icon: FileText },
    { id: "timeline" as const, label: "Timeline", icon: Timer },
    { id: "files" as const, label: `Files & Photos (${activeAttachments.length})`, icon: ImageIcon },
    { id: "labour" as const, label: `Labour (${formatMinutes(totalLabour)})`, icon: Timer },
    { id: "materials" as const, label: `Materials (${materials.length})`, icon: Package },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Execution</CardTitle>
        <p className="text-sm text-muted-foreground">Record work activity, evidence, labour and materials while preserving the Work Order lifecycle.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Work execution sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Button key={id} type="button" variant={activeTab === id ? "default" : "outline"} className="shrink-0" onClick={() => onTabChange(id)} role="tab" aria-selected={activeTab === id}>
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
        {activeTab === "notes" && <NotesPanel record={record} notes={notes} />}
        {activeTab === "timeline" && <TimelinePanel items={timeline} />}
        {activeTab === "files" && <FilesPanel record={record} attachments={attachments} />}
        {activeTab === "labour" && <LabourPanel record={record} entries={labour} users={care.users} />}
        {activeTab === "materials" && <MaterialsPanel record={record} entries={materials} />}
      </CardContent>
    </Card>
  );
}

function NotesPanel({ record, notes }: { record: MaintenanceWorkOrder; notes: WorkOrderNote[] }) {
  const care = useCare();
  const [noteType, setNoteType] = useState<WorkOrderNote["noteType"]>("PROGRESS_UPDATE");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canAdd = care.canAccess("maintenance.work_orders.execution.add_note", { nursingHomeId: record.homeId });
  return (
    <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
      {canAdd && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Add Note</h3>
          <p className="mt-1 text-xs text-muted-foreground">Do not include unnecessary resident or confidential information.</p>
          <div className="mt-4 space-y-3">
            <Field label="Note Type">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={noteType} onChange={(event) => setNoteType(event.target.value as WorkOrderNote["noteType"])}>
                {WORK_ORDER_NOTE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </Field>
            <Field label="Note Content">
              <Textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} />
            </Field>
            <Button
              disabled={submitting}
              onClick={() => {
                setSubmitting(true);
                try {
                  care.addWorkOrderNote(record.id, { noteType, content, clientRequestId: `note-${record.id}-${Date.now()}` });
                  toast.success("Work note added.");
                  setContent("");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to add note.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? "Saving..." : "Add Note"}
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {notes.length === 0 && <EmptyExecutionState text="No work notes recorded yet." />}
        {notes.map((note) => (
          <div key={note.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant={note.deletedAt ? "secondary" : "outline"}>{note.deletedAt ? "Note removed" : noteTypeLabel(note.noteType)}</Badge>
              <span className="text-xs text-muted-foreground">{formatDate(note.createdAt)} · {userName(care.users, note.createdByUserId)}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{note.deletedAt ? "This note was removed and retained for audit." : note.content}</p>
            {note.isEdited && !note.deletedAt && <p className="mt-2 text-xs text-muted-foreground">Edited {note.updatedAt ? formatDate(note.updatedAt) : ""}</p>}
            {!note.deletedAt && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(note.createdByUserId === care.currentUser.id || care.canAccess("maintenance.work_orders.execution.edit_note", { nursingHomeId: record.homeId })) && (
                  <Button size="sm" variant="outline" onClick={() => {
                    const next = window.prompt("Edit work note", note.content);
                    if (next === null) return;
                    try {
                      care.editWorkOrderNote(note.id, { content: next, expectedVersion: note.version, reason: note.createdByUserId === care.currentUser.id ? undefined : "Supervisor correction" });
                      toast.success("Work note updated.");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Unable to edit note.");
                    }
                  }}>Edit</Button>
                )}
                {(note.createdByUserId === care.currentUser.id || care.canAccess("maintenance.work_orders.execution.remove_note", { nursingHomeId: record.homeId })) && (
                  <Button size="sm" variant="outline" onClick={() => {
                    const reason = window.prompt("Reason for removing this note");
                    if (!reason) return;
                    try {
                      care.removeWorkOrderNote(note.id, reason);
                      toast.success("Work note removed.");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Unable to remove note.");
                    }
                  }}>Remove</Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelinePanel({ items }: { items: WorkOrderTimelineItem[] }) {
  if (items.length === 0) return <EmptyExecutionState text="No activity has been recorded yet." />;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-medium">{item.title}</div>
            <span className="text-xs text-muted-foreground">{formatDate(item.occurredAt)}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">By {item.actor.displayName}</div>
          {item.description && <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>}
        </div>
      ))}
    </div>
  );
}

function FilesPanel({ record, attachments }: { record: MaintenanceWorkOrder; attachments: WorkOrderAttachment[] }) {
  const care = useCare();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<WorkOrderAttachment["category"]>("GENERAL");
  const [description, setDescription] = useState("");
  const [isEvidence, setIsEvidence] = useState(false);
  const [evidenceType, setEvidenceType] = useState<NonNullable<WorkOrderAttachment["evidenceType"]>>("OTHER");
  const canUpload = care.canAccess("maintenance.work_orders.execution.upload_file", { nursingHomeId: record.homeId });
  const canEvidence = care.canAccess("maintenance.work_orders.execution.classify_evidence", { nursingHomeId: record.homeId });
  const canRemove = care.canAccess("maintenance.work_orders.execution.remove_file", { nursingHomeId: record.homeId });
  return (
    <div className="space-y-4">
      {canUpload && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Upload File or Photo</h3>
          <p className="mt-1 text-xs text-muted-foreground">Photos must not intentionally capture residents unless required, authorised and compliant with policy. Malware scanning is not configured in this demo environment.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="File">
              <Input type="file" accept=".pdf,.txt,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,application/pdf,text/plain" capture="environment" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </Field>
            <Field label="Category">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value as WorkOrderAttachment["category"])}>
                {WORK_ORDER_ATTACHMENT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </Field>
            <Field label="Description">
              <Input value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <Field label="Evidence">
              <div className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
                <input id="wo-evidence" type="checkbox" checked={isEvidence} onChange={(event) => setIsEvidence(event.target.checked)} />
                <label htmlFor="wo-evidence">Mark as evidence</label>
              </div>
            </Field>
            {isEvidence && (
              <Field label="Evidence Type">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={evidenceType} onChange={(event) => setEvidenceType(event.target.value as NonNullable<WorkOrderAttachment["evidenceType"]>)}>
                  {WORK_ORDER_EVIDENCE_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </Field>
            )}
          </div>
          <Button
            className="mt-4"
            onClick={() => {
              if (!file) return toast.error("Select a file before uploading.");
              try {
                care.addWorkOrderAttachment(record.id, { originalFileName: file.name, mimeType: file.type || "application/octet-stream", size: file.size, category, description, isEvidence, evidenceType, clientRequestId: `file-${record.id}-${file.name}-${file.size}-${Date.now()}` });
                toast.success("File uploaded.");
                setFile(null);
                setDescription("");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to upload file.");
              }
            }}
          >
            Upload
          </Button>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {attachments.filter((item) => !item.deletedAt).length === 0 && <EmptyExecutionState text="No files or photos uploaded yet." />}
        {attachments.filter((item) => !item.deletedAt).map((attachment) => (
          <div key={attachment.id} className="rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted">
                {attachment.isPhoto ? <ImageIcon className="h-7 w-7 text-muted-foreground" /> : <FileText className="h-7 w-7 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{attachment.originalFileName}</div>
                <div className="text-xs text-muted-foreground">{formatBytes(attachment.size)} - {attachment.category} - {attachment.scanStatus}</div>
                <div className="mt-1 text-xs text-muted-foreground">{formatDate(attachment.uploadedAt)} - {userName(care.users, attachment.uploadedByUserId)}</div>
                {attachment.isEvidence && <Badge className="mt-2" variant="secondary">Evidence - {attachment.evidenceType}</Badge>}
                {attachment.description && <p className="mt-2 text-sm text-muted-foreground">{attachment.description}</p>}
                {canEvidence && !attachment.isEvidence && (
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => {
                    try {
                      care.classifyWorkOrderAttachmentEvidence(attachment.id, { isEvidence: true, evidenceType: "OTHER", evidenceDescription: attachment.description, expectedVersion: attachment.version });
                      toast.success("Marked as evidence.");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Unable to classify evidence.");
                    }
                  }}>Mark as Evidence</Button>
                )}
                {(canRemove || (canEvidence && attachment.isEvidence)) && (
                  <Button size="sm" variant="outline" className="mt-3 ml-2" onClick={() => {
                    const reason = window.prompt("Reason for removing this attachment");
                    if (!reason) return;
                    try {
                      care.removeWorkOrderAttachment(attachment.id, reason);
                      toast.success("Attachment removed.");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Unable to remove attachment.");
                    }
                  }}>Remove</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LabourPanel({ record, entries, users }: { record: MaintenanceWorkOrder; entries: WorkOrderLabourEntry[]; users: ReturnType<typeof useCare>["users"] }) {
  const care = useCare();
  const [form, setForm] = useState({ userId: care.currentUser.id, labourType: "INTERNAL", workDate: new Date().toISOString().slice(0, 10), startTime: "", endTime: "", durationMinutes: "", description: "" });
  const canAdd = care.canAccess("maintenance.work_orders.execution.add_labour", { nursingHomeId: record.homeId });
  const canRemove = care.canAccess("maintenance.work_orders.execution.remove_labour", { nursingHomeId: record.homeId });
  const total = entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted p-3 text-sm font-medium">Total labour recorded: {formatMinutes(total)}</div>
      {canAdd && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Add Labour</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Person"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })}>{users.filter((user) => user.status === "active").map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></Field>
            <Field label="Labour Type"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.labourType} onChange={(event) => setForm({ ...form, labourType: event.target.value })}><option value="INTERNAL">Internal</option><option value="CONTRACTOR">Contractor</option></select></Field>
            <Field label="Date"><Input type="date" value={form.workDate} onChange={(event) => setForm({ ...form, workDate: event.target.value })} /></Field>
            <Field label="Duration Minutes"><Input type="number" min="1" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} /></Field>
            <Field label="Start Time"><Input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></Field>
            <Field label="End Time"><Input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></Field>
            <div className="md:col-span-2"><Field label="Work Description"><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field></div>
          </div>
          <Button className="mt-4" onClick={() => {
            try {
              care.addWorkOrderLabour(record.id, { ...form, labourType: form.labourType as WorkOrderLabourEntry["labourType"], durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined, clientRequestId: `labour-${record.id}-${Date.now()}` });
              toast.success("Labour recorded.");
              setForm({ ...form, startTime: "", endTime: "", durationMinutes: "", description: "" });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to record labour.");
            }
          }}>Add Labour</Button>
        </div>
      )}
      {entries.length === 0 ? <EmptyExecutionState text="No labour has been recorded." /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border p-4">
              <div className="font-medium">{entry.workerDisplayName}</div>
              <div className="mt-1 text-sm text-muted-foreground">{entry.labourType} - {entry.workDate} - {formatMinutes(entry.durationMinutes)}</div>
              <div className="mt-2 text-sm">{entry.description}</div>
              {canRemove && <Button size="sm" variant="outline" className="mt-3" onClick={() => {
                const reason = window.prompt("Reason for removing this labour entry");
                if (!reason) return;
                try {
                  care.removeWorkOrderLabour(entry.id, reason);
                  toast.success("Labour entry removed.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to remove labour entry.");
                }
              }}>Remove</Button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MaterialsPanel({ record, entries }: { record: MaintenanceWorkOrder; entries: WorkOrderMaterialEntry[] }) {
  const care = useCare();
  const [form, setForm] = useState({ materialName: "", quantity: "", unit: "each", reference: "", usedDate: new Date().toISOString().slice(0, 10), description: "" });
  const canAdd = care.canAccess("maintenance.work_orders.execution.add_material", { nursingHomeId: record.homeId });
  const canRemove = care.canAccess("maintenance.work_orders.execution.remove_material", { nursingHomeId: record.homeId });
  return (
    <div className="space-y-4">
      {canAdd && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Add Material Used</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Material Name"><Input value={form.materialName} onChange={(event) => setForm({ ...form, materialName: event.target.value })} /></Field>
            <Field label="Quantity"><Input type="number" min="0.01" step="0.01" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></Field>
            <Field label="Unit"><Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} /></Field>
            <Field label="Date Used"><Input type="date" value={form.usedDate} onChange={(event) => setForm({ ...form, usedDate: event.target.value })} /></Field>
            <Field label="Reference"><Input value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} /></Field>
            <Field label="Description"><Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
          </div>
          <Button className="mt-4" onClick={() => {
            try {
              care.addWorkOrderMaterial(record.id, { ...form, quantity: Number(form.quantity), clientRequestId: `material-${record.id}-${Date.now()}` });
              toast.success("Material recorded.");
              setForm({ materialName: "", quantity: "", unit: "each", reference: "", usedDate: form.usedDate, description: "" });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to record material.");
            }
          }}>Add Material</Button>
        </div>
      )}
      {entries.length === 0 ? <EmptyExecutionState text="No materials have been recorded." /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border p-4">
              <div className="font-medium">{entry.materialName}</div>
              <div className="mt-1 text-sm text-muted-foreground">{entry.quantity} {entry.unit} - {entry.usedDate}</div>
              {(entry.reference || entry.description) && <div className="mt-2 text-sm">{entry.reference || entry.description}</div>}
              {canRemove && <Button size="sm" variant="outline" className="mt-3" onClick={() => {
                const reason = window.prompt("Reason for removing this material entry");
                if (!reason) return;
                try {
                  care.removeWorkOrderMaterial(entry.id, reason);
                  toast.success("Material entry removed.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to remove material entry.");
                }
              }}>Remove</Button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResponsiveRows({ rows, empty }: { rows: Array<{ id: string; title: string; detail: string; meta?: string }>; empty: string }) {
  if (!rows.length) return <EmptyExecutionState text={empty} />;
  return <div className="grid gap-3 md:grid-cols-2">{rows.map((row) => <div key={row.id} className="rounded-lg border p-4"><div className="font-medium">{row.title}</div><div className="mt-1 text-sm text-muted-foreground">{row.detail}</div>{row.meta && <div className="mt-2 text-sm">{row.meta}</div>}</div>)}</div>;
}

function EmptyExecutionState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function ImpactCard({ label, active }: { label: string; active: boolean }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-5">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant={active ? "destructive" : "secondary"}>{active ? "Yes" : "No"}</Badge>
      </CardContent>
    </Card>
  );
}

function NotFoundState() {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="py-12 text-center">
          <Wrench className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Work Order Not Found</h1>
          <p className="mt-1 text-sm text-muted-foreground">The Work Order may have been removed from the active view, or the link may be incorrect.</p>
          <Button asChild className="mt-4"><Link to="/maintenance/work-orders">Back to Work Orders</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatDuration(value?: number) {
  if (!value) return "Not recorded";
  const minutes = Math.round(value / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

function formatMinutes(value: number) {
  if (!value) return "0 min";
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function userName(users: ReturnType<typeof useCare>["users"], userId?: string) {
  return users.find((user) => user.id === userId)?.name || "Staff member";
}

function canViewWorkOrderRecord(care: ReturnType<typeof useCare>, record: MaintenanceWorkOrder) {
  if (care.canAccess("maintenance.work_orders.view_all_for_home", { nursingHomeId: record.homeId })) return true;
  if (record.assignedUserId === care.currentUser.id && care.canAccess("maintenance.work_orders.view_assigned", { nursingHomeId: record.homeId })) return true;
  if (record.reportedByUserId === care.currentUser.id && care.canAccess("maintenance.work_orders.view_reported_own", { nursingHomeId: record.homeId })) return true;
  return false;
}
