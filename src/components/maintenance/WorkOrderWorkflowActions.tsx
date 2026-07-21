import { useMemo, useState } from "react";
import type React from "react";
import { toast } from "sonner";
import { CheckCircle2, ClipboardCheck, Pause, Play, RotateCcw, UserCheck, UserPlus, type LucideIcon } from "lucide-react";
import type { MaintenanceWorkOrder } from "@/lib/care/types";
import { useCare } from "@/lib/care/store";
import {
  MAINTENANCE_TEAMS,
  availableWorkOrderActions,
  type WorkOrderAccessIssue,
  type WorkOrderHoldReason,
  type WorkOrderWorkflowAction,
  type WorkOrderWorkflowInput,
} from "@/domain/maintenance/workOrderWorkflow";
import { workOrderAssigneeLabel, workOrderPriorityLabel, workOrderStatusLabel } from "@/domain/maintenance/workOrders";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type DialogAction = Exclude<WorkOrderWorkflowAction, "SELF_ASSIGN" | "ACCEPT">;

export function WorkOrderWorkflowActions({ record }: { record: MaintenanceWorkOrder }) {
  const care = useCare();
  const [dialogAction, setDialogAction] = useState<DialogAction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const actions = useMemo(
    () => availableWorkOrderActions(record, { currentUser: care.currentUser, users: care.users, canAccess: care.canAccess }),
    [record, care.currentUser, care.users, care.canAccess],
  );

  const run = (input: Omit<WorkOrderWorkflowInput, "expectedVersion" | "idempotencyKey">, close = true) => {
    setSubmitting(true);
    try {
      care.workflowMaintenanceWorkOrder(record.id, {
        ...input,
        expectedVersion: record.version,
        idempotencyKey: `${record.id}:${record.version}:${input.action}:${Date.now()}`,
      });
      toast.success(successMessage(input.action));
      if (close) setDialogAction(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to complete Work Order action");
    } finally {
      setSubmitting(false);
    }
  };

  if (actions.length === 0) return null;

  return (
    <>
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Workflow Actions</h2>
            <p className="text-sm text-muted-foreground">
              {workOrderStatusLabel(record.status)} - {workOrderAssigneeLabel(record, care.users)} - Version {record.version}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {actions.includes("ASSIGN") && <WorkflowButton icon={UserPlus} label="Assign" onClick={() => setDialogAction("ASSIGN")} />}
            {actions.includes("SELF_ASSIGN") && (
              <WorkflowButton icon={UserCheck} label="Self Assign" disabled={submitting} onClick={() => run({ action: "SELF_ASSIGN" })} />
            )}
            {actions.includes("REASSIGN") && <WorkflowButton icon={UserPlus} label="Reassign" onClick={() => setDialogAction("REASSIGN")} />}
            {actions.includes("UNASSIGN") && <WorkflowButton icon={RotateCcw} label="Unassign" onClick={() => setDialogAction("UNASSIGN")} />}
            {actions.includes("ACCEPT") && (
              <WorkflowButton icon={ClipboardCheck} label="Accept" disabled={submitting} onClick={() => run({ action: "ACCEPT" })} />
            )}
            {actions.includes("START") && <WorkflowButton icon={Play} label="Start Work" onClick={() => setDialogAction("START")} />}
            {actions.includes("PAUSE") && <WorkflowButton icon={Pause} label="Pause" onClick={() => setDialogAction("PAUSE")} />}
            {actions.includes("AWAIT_PARTS") && <WorkflowButton label="Await Parts" onClick={() => setDialogAction("AWAIT_PARTS")} />}
            {actions.includes("AWAIT_CONTRACTOR") && <WorkflowButton label="Await Contractor" onClick={() => setDialogAction("AWAIT_CONTRACTOR")} />}
            {actions.includes("AWAIT_ACCESS") && <WorkflowButton label="Await Access" onClick={() => setDialogAction("AWAIT_ACCESS")} />}
            {actions.includes("RESUME") && <WorkflowButton icon={CheckCircle2} label="Resume" onClick={() => setDialogAction("RESUME")} />}
          </div>
        </div>
      </div>
      <WorkflowDialog
        action={dialogAction}
        record={record}
        users={care.users}
        submitting={submitting}
        onClose={() => setDialogAction(null)}
        onSubmit={(input) => run(input)}
      />
    </>
  );
}

function WorkflowButton({ label, icon: Icon, disabled, onClick }: { label: string; icon?: LucideIcon; disabled?: boolean; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" onClick={onClick} disabled={disabled}>
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
}

function WorkflowDialog({
  action,
  record,
  users,
  submitting,
  onClose,
  onSubmit,
}: {
  action: DialogAction | null;
  record: MaintenanceWorkOrder;
  users: ReturnType<typeof useCare>["users"];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<WorkOrderWorkflowInput, "expectedVersion" | "idempotencyKey">) => void;
}) {
  const [assignedUserId, setAssignedUserId] = useState(record.assignedUserId || "");
  const [assignedTeamId, setAssignedTeamId] = useState(record.assignedTeamId || "");
  const [supervisorUserId, setSupervisorUserId] = useState(record.supervisorUserId || "");
  const [reason, setReason] = useState("");
  const [holdReason, setHoldReason] = useState<WorkOrderHoldReason>("other");
  const [partsSummary, setPartsSummary] = useState("");
  const [contractorDetails, setContractorDetails] = useState("");
  const [accessIssue, setAccessIssue] = useState<WorkOrderAccessIssue>("other");
  const [expectedDate, setExpectedDate] = useState("");

  if (!action) return null;

  const homeUsers = users.filter((user) => user.status === "active" && (user.facilityIds?.includes(record.homeId) || user.facilityId === record.homeId));
  const submit = () => {
    const base = { action, reason: reason.trim() || undefined };
    if (action === "ASSIGN" || action === "REASSIGN") {
      onSubmit({ ...base, assignedUserId: assignedUserId || undefined, assignedTeamId: assignedTeamId || undefined, supervisorUserId: supervisorUserId || undefined });
      return;
    }
    if (action === "UNASSIGN") return onSubmit(base);
    if (action === "START") return onSubmit(base);
    if (action === "PAUSE") return onSubmit({ ...base, holdReason });
    if (action === "AWAIT_PARTS") return onSubmit({ ...base, partsSummary, expectedAvailabilityAt: toIso(expectedDate) });
    if (action === "AWAIT_CONTRACTOR") return onSubmit({ ...base, contractorDetails, expectedAttendanceAt: toIso(expectedDate) });
    if (action === "AWAIT_ACCESS") return onSubmit({ ...base, accessIssue, nextAccessAttemptAt: toIso(expectedDate) });
    if (action === "RESUME") return onSubmit({ ...base, note: reason.trim() });
  };

  return (
    <Dialog open={Boolean(action)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle(action)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {(action === "ASSIGN" || action === "REASSIGN") && (
            <>
              <Alert>
                <AlertTitle>Current Assignment</AlertTitle>
                <AlertDescription>{workOrderAssigneeLabel(record, users)}</AlertDescription>
              </Alert>
              <Field label="Maintenance Team">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={assignedTeamId} onChange={(event) => setAssignedTeamId(event.target.value)}>
                  <option value="">No team</option>
                  {MAINTENANCE_TEAMS.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </Field>
              <Field label="Assigned Person">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={assignedUserId} onChange={(event) => setAssignedUserId(event.target.value)}>
                  <option value="">No individual assignee</option>
                  {homeUsers.map((user) => <option key={user.id} value={user.id}>{user.name} - {user.department}</option>)}
                </select>
              </Field>
              <Field label="Supervisor">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={supervisorUserId} onChange={(event) => setSupervisorUserId(event.target.value)}>
                  <option value="">No supervisor</option>
                  {homeUsers.map((user) => <option key={user.id} value={user.id}>{user.name} - {user.department}</option>)}
                </select>
              </Field>
            </>
          )}

          {action === "START" && (record.priority === "CRITICAL" || record.priority === "HIGH") && (
            <Alert>
              <AlertTitle>{workOrderPriorityLabel(record.priority)} priority Work Order</AlertTitle>
              <AlertDescription>
                Confirm the current risk controls are understood before starting work.
              </AlertDescription>
            </Alert>
          )}

          {action === "PAUSE" && (
            <Field label="Hold Reason">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={holdReason} onChange={(event) => setHoldReason(event.target.value as WorkOrderHoldReason)}>
                <option value="safety">Safety concern</option>
                <option value="access">Access issue</option>
                <option value="resident_need">Resident need</option>
                <option value="staffing">Staffing</option>
                <option value="other">Other</option>
              </select>
            </Field>
          )}

          {action === "AWAIT_PARTS" && (
            <>
              <Field label="Parts Required">
                <Input value={partsSummary} onChange={(event) => setPartsSummary(event.target.value)} placeholder="e.g. Replacement handset required" />
              </Field>
              <Field label="Expected Availability">
                <Input type="datetime-local" value={expectedDate} onChange={(event) => setExpectedDate(event.target.value)} />
              </Field>
            </>
          )}

          {action === "AWAIT_CONTRACTOR" && (
            <>
              <Field label="Contractor Requirement">
                <Input value={contractorDetails} onChange={(event) => setContractorDetails(event.target.value)} placeholder="e.g. Electrical contractor required" />
              </Field>
              <Field label="Expected Attendance">
                <Input type="datetime-local" value={expectedDate} onChange={(event) => setExpectedDate(event.target.value)} />
              </Field>
            </>
          )}

          {action === "AWAIT_ACCESS" && (
            <>
              <Field label="Access Issue">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={accessIssue} onChange={(event) => setAccessIssue(event.target.value as WorkOrderAccessIssue)}>
                  <option value="resident_unavailable">Resident unavailable</option>
                  <option value="room_in_use">Room in use</option>
                  <option value="infection_control">Infection control restriction</option>
                  <option value="restricted_area">Restricted area</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Next Access Attempt">
                <Input type="datetime-local" value={expectedDate} onChange={(event) => setExpectedDate(event.target.value)} />
              </Field>
            </>
          )}

          {action !== "ASSIGN" && (
            <Field label={action === "RESUME" ? "Resolution Note" : "Reason"}>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Record the reason for this workflow action" />
            </Field>
          )}
          {action === "ASSIGN" && (
            <Field label="Assignment Note">
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Optional assignment note" />
            </Field>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={submit} disabled={submitting}>
              {submitting ? "Saving..." : dialogSubmitLabel(action)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function dialogTitle(action: DialogAction) {
  const titles: Record<DialogAction, string> = {
    ASSIGN: "Assign Work Order",
    REASSIGN: "Reassign Work Order",
    UNASSIGN: "Unassign Work Order",
    START: "Start Work",
    PAUSE: "Place Work Order On Hold",
    AWAIT_PARTS: "Await Parts",
    AWAIT_CONTRACTOR: "Await Contractor",
    AWAIT_ACCESS: "Await Access",
    RESUME: "Resume Work",
  };
  return titles[action];
}

function dialogSubmitLabel(action: DialogAction) {
  if (action === "START") return "Start Work";
  if (action === "RESUME") return "Resume Work";
  return dialogTitle(action).replace("Work Order", "").trim() || "Save";
}

function successMessage(action: WorkOrderWorkflowAction) {
  const messages: Record<WorkOrderWorkflowAction, string> = {
    ASSIGN: "Work Order assigned.",
    REASSIGN: "Work Order reassigned.",
    UNASSIGN: "Work Order unassigned.",
    SELF_ASSIGN: "Work Order assigned.",
    ACCEPT: "Work Order accepted.",
    START: "Work started.",
    PAUSE: "Work Order placed on hold.",
    AWAIT_PARTS: "Work Order moved to Awaiting Parts.",
    AWAIT_CONTRACTOR: "Work Order moved to Awaiting Contractor.",
    AWAIT_ACCESS: "Work Order moved to Awaiting Access.",
    RESUME: "Work resumed.",
  };
  return messages[action];
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}
