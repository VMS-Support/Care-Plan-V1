import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCare } from "@/lib/care/store";
import type { CareActionType, ProblemIntervention, FrequencyType, Role } from "@/lib/care/types";
import { CARE_ACTION_TYPE_DESCRIPTIONS, CARE_ACTION_TYPE_LABELS, validateCareActionConfiguration } from "@/lib/care/flexibleCareActions";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  residentId: string;
  initialProblemId?: string;
  lockProblemSelection?: boolean;
}

const FREQUENCY_OPTIONS: { label: string; value: FrequencyType }[] = [
  { label: "Once", value: "once" },
  { label: "Per Shift", value: "per_shift" },
  { label: "Every 2 Hours", value: "every_2_hours" },
  { label: "Every 4 Hours", value: "every_4_hours" },
  { label: "Every 6 Hours", value: "every_6_hours" },
  { label: "Hourly", value: "hourly" },
  { label: "Daily", value: "daily" },
  { label: "Twice Daily", value: "twice_daily" },
  { label: "Three Times Daily", value: "three_times_daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "PRN (As Needed)", value: "prn" },
  { label: "Custom", value: "custom" },
];

const ASSIGNED_ROLES: Array<{ value: Role; label: string }> = [{ value: "carer", label: "Carer" }, { value: "nurse", label: "Nurse" }, { value: "doctor", label: "Doctor" }, { value: "cnm", label: "Clinical Nurse Manager" }];
const DEFAULT_PRN: NonNullable<ProblemIntervention["prnConfiguration"]> = { indication: "", requiresOutcomeRecording: true, requiresResidentResponse: true, requiresReasonForUse: true };
const DEFAULT_TRIGGERED: NonNullable<ProblemIntervention["triggerConfiguration"]> = { triggerMode: "event", triggerConditionSummary: "", createWorkItemOnTrigger: true, assignmentPolicy: "ward", deduplicationMode: "per_event", requiresHumanConfirmation: true };
const DEFAULT_ONE_OFF: NonNullable<ProblemIntervention["oneOffConfiguration"]> = { canBeCompletedWithoutDueDate: true, requiresOutcomeRecording: true, requiresResidentResponse: true, autoCloseAfterCompletion: true };

const empty = (residentId: string): Omit<ProblemIntervention, "id"> => ({
  residentId,
  problemId: "",
  name: "",
  description: "",
  frequencyType: "daily",
  careActionType: "scheduled",
  frequencyValue: undefined,
  frequencyInstructions: "",
  assignedRole: "nurse",
  assignedStaffId: undefined,
  assignedStaffName: "",
  startDate: new Date().toISOString().slice(0, 10),
  startTime: "08:00",
  reviewDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  status: "active",
  notes: "",
  createdAt: new Date().toISOString(),
  createdBy: "",
  createdByRole: "nurse",
});

export function AddInterventionModal({
  open,
  onOpenChange,
  residentId,
  initialProblemId,
  lockProblemSelection,
}: Props) {
  const { carePlanProblems, residents, users, currentUserName, currentRole, addProblemIntervention } =
    useCare();
  const [form, setForm] = useState<Omit<ProblemIntervention, "id">>(empty(residentId));
  const [frequency, setFrequency] = useState<FrequencyType>("daily");
  const [actionType, setActionType] = useState<CareActionType>("scheduled");

  useEffect(() => {
    if (open) {
      const newForm = empty(residentId);
      if (initialProblemId) {
        newForm.problemId = initialProblemId;
      }
      setForm(newForm);
      setFrequency("daily");
      setActionType("scheduled");
    }
  }, [open, residentId, initialProblemId]);

  const resident = residents.find((r) => r.id === residentId);
  const problems = carePlanProblems.filter(
    (p) => p.residentId === residentId && p.status === "active",
  );
  const assignedRoleUsers = users
    .filter((user) => user.role === (form.assignedRole || "nurse") && user.status !== "inactive")
    .sort((left, right) => left.name.localeCompare(right.name));

  function validateForm() {
    if (!form.problemId.trim()) {
      toast.error("Please select a care plan problem");
      return false;
    }
    if (!form.name.trim()) {
      toast.error("Intervention name is required");
      return false;
    }
    if (actionType === "scheduled" && !form.startDate) {
      toast.error("Start date is required");
      return false;
    }
    if (actionType === "scheduled" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.startTime || "")) {
      toast.error("Start time is required");
      return false;
    }
    if (actionType === "scheduled" && !form.endDate) {
      toast.error("End date is required");
      return false;
    }
    if (actionType === "scheduled" && new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error("End date must be after start date");
      return false;
    }
    const configuration = validateCareActionConfiguration({ ...form, careActionType: actionType } as ProblemIntervention);
    if (!configuration.valid) {
      toast.error(configuration.issues.join(" "));
      return false;
    }
    return true;
  }

  function save() {
    if (!validateForm()) return;

    try {
      addProblemIntervention({
        ...form,
        careActionType: actionType,
        frequencyType: actionType === "scheduled" ? frequency : actionType === "prn" ? "prn" : actionType === "one_off" ? "once" : "custom",
        status: form.status === "review_due" ? "review_due" : "active",
        createdBy: currentUserName,
        createdByRole: currentRole,
      });

      toast.success(`${CARE_ACTION_TYPE_LABELS[actionType]} care action created`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule care action");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Care Action</DialogTitle>
          <DialogDescription>
            {resident &&
              `For ${resident.firstName} ${resident.lastName} â€” Define and schedule the care action`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 space-y-3">
          {/* Care Plan Problem Selection */}
          <div className="col-span-2 space-y-1.5">
            <Label>Related Nursing Care Plan *</Label>
            <Select
              value={form.problemId}
              onValueChange={(v) => setForm({ ...form, problemId: v })}
              disabled={lockProblemSelection}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a nursing care plan..." />
              </SelectTrigger>
              <SelectContent>
                {problems.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {`${p.problemStatement} â€¢ ${p.category.replace(/_/g, " ")} â€¢ ${p.riskLevel.replace(/_/g, " ")} â€¢ ${p.status}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {problems.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No active nursing care plans. Create one first.
              </p>
            )}
          </div>

          {/* Care Action Name */}
          <div className="col-span-2 space-y-1.5">
            <Label>Care Action Type *</Label>
            <Select value={actionType} onValueChange={(value) => {
              const next = value as CareActionType;
              setActionType(next);
              setForm({ ...form, careActionType: next, prnConfiguration: next === "prn" ? DEFAULT_PRN : undefined, triggerConfiguration: next === "triggered" ? DEFAULT_TRIGGERED : undefined, oneOffConfiguration: next === "one_off" ? DEFAULT_ONE_OFF : undefined });
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CARE_ACTION_TYPE_LABELS) as CareActionType[]).map((type) => (
                  <SelectItem key={type} value={type}>{CARE_ACTION_TYPE_LABELS[type]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{CARE_ACTION_TYPE_DESCRIPTIONS[actionType]}</p>
          </div>

          {/* Care Action Name */}
          <div className="col-span-2 space-y-1.5">
            <Label>Care Action Name *</Label>
            <Input
              placeholder="e.g., Daily skin inspection, reposition every 2 hours"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="col-span-2 space-y-1.5">
            <Label>Description</Label>
            <Textarea
              rows={2}
              placeholder="Detailed description of the care action..."
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {actionType === "scheduled" && <div className="space-y-1.5">
            <Label>Frequency *</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as FrequencyType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>}

          {actionType === "prn" && <>
            <div className="col-span-2 space-y-1.5"><Label>Indication *</Label><Input placeholder="When this action may be used" value={form.prnConfiguration?.indication || ""} onChange={(e) => setForm({ ...form, prnConfiguration: { ...(form.prnConfiguration || DEFAULT_PRN), indication: e.target.value } })} /></div>
            <div className="space-y-1.5"><Label>Minimum interval (minutes)</Label><Input type="number" min="0" value={form.prnConfiguration?.minimumIntervalMinutes ?? ""} onChange={(e) => setForm({ ...form, prnConfiguration: { ...(form.prnConfiguration || DEFAULT_PRN), minimumIntervalMinutes: e.target.value ? Number(e.target.value) : undefined } })} /></div>
            <div className="space-y-1.5"><Label>Maximum uses per 24 hours</Label><Input type="number" min="1" value={form.prnConfiguration?.maximumOccurrencesPerPeriod?.count ?? ""} onChange={(e) => setForm({ ...form, prnConfiguration: { ...(form.prnConfiguration || DEFAULT_PRN), maximumOccurrencesPerPeriod: e.target.value ? { count: Number(e.target.value), periodMinutes: 1440 } : undefined } })} /></div>
          </>}

          {actionType === "triggered" && <>
            <div className="space-y-1.5"><Label>Trigger mode *</Label><Select value={form.triggerConfiguration?.triggerMode || "event"} onValueChange={(value) => setForm({ ...form, triggerConfiguration: { ...(form.triggerConfiguration || DEFAULT_TRIGGERED), triggerMode: value as "event" | "rule" | "manual_clinical_activation" } })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="event">Clinical event</SelectItem><SelectItem value="rule">Rule result</SelectItem><SelectItem value="manual_clinical_activation">Manual activation</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Due offset (minutes)</Label><Input type="number" min="0" value={form.triggerConfiguration?.dueOffsetMinutes ?? ""} onChange={(e) => setForm({ ...form, triggerConfiguration: { ...(form.triggerConfiguration || DEFAULT_TRIGGERED), dueOffsetMinutes: e.target.value ? Number(e.target.value) : undefined } })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Trigger summary *</Label><Input placeholder="Describe the exact activating condition" value={form.triggerConfiguration?.triggerConditionSummary || ""} onChange={(e) => setForm({ ...form, triggerConfiguration: { ...(form.triggerConfiguration || DEFAULT_TRIGGERED), triggerConditionSummary: e.target.value } })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Event or rule identifiers</Label><Input placeholder="e.g. symptom.pain_escalated, rule-42" value={(form.triggerConfiguration?.triggerEventTypes || form.triggerConfiguration?.triggerRuleIds || []).join(", ")} onChange={(e) => { const values = e.target.value.split(",").map((v) => v.trim()).filter(Boolean); const mode = form.triggerConfiguration?.triggerMode || "event"; setForm({ ...form, triggerConfiguration: { ...(form.triggerConfiguration || DEFAULT_TRIGGERED), triggerEventTypes: mode === "event" ? values : undefined, triggerRuleIds: mode === "rule" ? values : undefined } }); }} /></div>
          </>}

          {actionType === "one_off" && <>
            <div className="space-y-1.5"><Label>Due date and time</Label><Input type="datetime-local" value={form.oneOffConfiguration?.dueAt?.slice(0, 16) || ""} onChange={(e) => setForm({ ...form, oneOffConfiguration: { ...(form.oneOffConfiguration || DEFAULT_ONE_OFF), dueAt: e.target.value ? new Date(e.target.value).toISOString() : undefined } })} /></div>
            <div className="space-y-1.5"><Label>Completion evidence type</Label><Select value={form.oneOffConfiguration?.completionEvidenceType || "manual_confirmation"} onValueChange={(value) => setForm({ ...form, oneOffConfiguration: { ...(form.oneOffConfiguration || DEFAULT_ONE_OFF), completionEvidenceType: value as NonNullable<ProblemIntervention["oneOffConfiguration"]>["completionEvidenceType"] } })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual_confirmation">Manual confirmation</SelectItem><SelectItem value="clinical_note">Clinical note</SelectItem><SelectItem value="review">Review</SelectItem><SelectItem value="referral">Referral</SelectItem><SelectItem value="communication_record">Communication record</SelectItem><SelectItem value="document">Document</SelectItem></SelectContent></Select></div>
          </>}

          {/* Role */}
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={form.assignedRole || "nurse"}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  assignedRole: v as Role,
                  assignedStaffId: undefined,
                  assignedStaffName: "",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNED_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned Staff */}
          <div className="space-y-1.5">
            <Label>Assigned To</Label>
            <Select
              value={form.assignedStaffId || "__unassigned"}
              onValueChange={(value) => {
                if (value === "__unassigned") {
                  setForm({ ...form, assignedStaffId: undefined, assignedStaffName: "" });
                  return;
                }
                const user = users.find((item) => item.id === value);
                setForm({
                  ...form,
                  assignedStaffId: user?.id,
                  assignedStaffName: user?.name || "",
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned">Unassigned</SelectItem>
                {assignedRoleUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assignedRoleUsers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No active users found for this role.
              </p>
            )}
          </div>

          {actionType === "scheduled" && <>
          {/* Start Date */}
          <div className="space-y-1.5">
            <Label>Start Date *</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Start Time *</Label>
            <Input
              type="time"
              value={form.startTime || ""}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </div>
          </>}

          {/* Review Date */}
          <div className="space-y-1.5">
            <Label>Review Date *</Label>
            <Input
              type="date"
              value={form.reviewDate}
              onChange={(e) => setForm({ ...form, reviewDate: e.target.value })}
              title="Intervention status will be set to 'Review Due' on this date"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <Label>End Date *</Label>
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              title="Intervention will complete or require review on this date"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="review_due">Review Due</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="col-span-2 space-y-1.5">
            <Label>Additional Notes</Label>
            <Textarea
              rows={2}
              placeholder="Clinical notes, special instructions, precautions..."
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Create Care Action</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

