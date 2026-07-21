import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Archive, ArrowRight, Edit, Wrench } from "lucide-react";
import { useCare } from "@/lib/care/store";
import type { MaintenanceWorkOrder } from "@/lib/care/types";
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
import { WorkOrderForm } from "@/components/maintenance/WorkOrderForm";
import { WorkOrderWorkflowActions } from "@/components/maintenance/WorkOrderWorkflowActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/maintenance/work-orders/$workOrderId")({
  head: () => ({ meta: [{ title: "Work Order Details - NuCare" }] }),
  component: WorkOrderDetailRoute,
});

function WorkOrderDetailRoute() {
  const { workOrderId } = Route.useParams();
  const care = useCare();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const record = useMemo(
    () => care.maintenanceWorkOrders.find((item) => item.id === workOrderId),
    [care.maintenanceWorkOrders, workOrderId],
  );

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

function canViewWorkOrderRecord(care: ReturnType<typeof useCare>, record: MaintenanceWorkOrder) {
  if (care.canAccess("maintenance.work_orders.view_all_for_home", { nursingHomeId: record.homeId })) return true;
  if (record.assignedUserId === care.currentUser.id && care.canAccess("maintenance.work_orders.view_assigned", { nursingHomeId: record.homeId })) return true;
  if (record.reportedByUserId === care.currentUser.id && care.canAccess("maintenance.work_orders.view_reported_own", { nursingHomeId: record.homeId })) return true;
  return false;
}
