import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import type { MaintenanceRiskConsequence, MaintenanceRiskLikelihood, MaintenanceWorkOrder } from "@/lib/care/types";
import { useCare } from "@/lib/care/store";
import {
  WORK_ORDER_CATEGORIES,
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_SOURCES,
  WORK_ORDER_STATUSES,
  WORK_ORDER_TYPES,
  calculateMaintenanceRisk,
  minimumPriorityForRisk,
  priorityMeetsMinimum,
  suggestedDueAt,
  suggestedResponseAt,
  validateWorkOrderInput,
  workOrderLocationLabel,
  workOrderPriorityLabel,
  type CreateWorkOrderInput,
  type UpdateWorkOrderInput,
} from "@/domain/maintenance/workOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "create" | "edit";

interface WorkOrderFormProps {
  mode: Mode;
  workOrder?: MaintenanceWorkOrder;
  onSubmit: (input: CreateWorkOrderInput | UpdateWorkOrderInput) => void;
  onCancel: () => void;
}

const steps = [
  { id: "location", label: "Location" },
  { id: "issue", label: "Issue Details" },
  { id: "risk", label: "Priority and Risk" },
  { id: "review", label: "Responsibility and Review" },
] as const;

const draftKey = "maintenance-work-order-create-draft-v1";
const editableStatusOptions = WORK_ORDER_STATUSES.filter((item) => ["DRAFT", "OPEN", "ASSIGNED"].includes(item.value));

type FormState = CreateWorkOrderInput & { status?: MaintenanceWorkOrder["status"] };

export function WorkOrderForm({ mode, workOrder, onSubmit, onCancel }: WorkOrderFormProps) {
  const care = useCare();
  const canAssign = care.canAccess("maintenance.work_orders.edit", { nursingHomeId: workOrder?.homeId || care.activeFacilityId });
  const initial = useMemo(() => initialState(mode, care, workOrder, canAssign), [mode, care.activeFacilityId, care.currentRole, workOrder?.id, canAssign]);
  const [form, setForm] = useState<FormState>(() => initial);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  useEffect(() => {
    if (mode !== "create") return;
    const raw = window.localStorage.getItem(draftKey);
    if (raw) setShowDraftPrompt(true);
  }, [mode]);

  useEffect(() => {
    if (mode !== "create" || !dirty) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(draftKey, JSON.stringify(form));
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [mode, form, dirty]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const homeRooms = useMemo(
    () => care.rooms.filter((room) => String(room.facilityId || room.nursingHomeId || care.activeFacilityId) === form.homeId),
    [care.rooms, care.activeFacilityId, form.homeId],
  );
  const homeWards = useMemo(
    () => care.wards.filter((ward) => String(ward.nursingHomeId || ward.facilityId || care.activeFacilityId) === form.homeId),
    [care.wards, care.activeFacilityId, form.homeId],
  );
  const homeUsers = useMemo(
    () => care.users.filter((user) => user.facilityIds?.includes(form.homeId) || user.facilityId === form.homeId),
    [care.users, form.homeId],
  );
  const source = { ...care, users: homeUsers };
  const payload = toPayload(form, mode);
  const validation = validateWorkOrderInput(payload, source);
  const risk = calculateMaintenanceRisk(form.riskAssessment);
  const minimumPriority = minimumPriorityForRisk(form.riskAssessment, form.immediateRisk);
  const possibleMatches = useMemo(() => {
    if (mode !== "create" || !form.title.trim() || !form.category) return [];
    return care.maintenanceWorkOrders
      .filter((record) => !record.archivedAt && record.homeId === form.homeId && record.category === form.category)
      .filter((record) => (form.roomId ? String(record.roomId) === form.roomId : true))
      .filter((record) => record.title.toLowerCase().includes(form.title.trim().toLowerCase().slice(0, 12)))
      .slice(0, 3);
  }, [care.maintenanceWorkOrders, form.category, form.homeId, form.roomId, form.title, mode]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = {
        ...current,
        [key]: value,
        ...(key === "homeId" && value !== current.homeId ? { roomId: "", wardId: "", assignedUserId: "", supervisorUserId: "" } : {}),
        ...(key === "wardId" && value !== current.wardId ? { roomId: "" } : {}),
        ...(key === "category" && value !== current.category ? { subcategory: "" } : {}),
      };
      if (key === "priority") {
        const previousDue = toDateTimeLocal(suggestedDueAt(current.priority));
        const previousResponse = toDateTimeLocal(suggestedResponseAt(current.priority));
        if (!current.dueAt || current.dueAt === previousDue) next.dueAt = toDateTimeLocal(suggestedDueAt(value as any));
        if (!current.requiredResponseAt || current.requiredResponseAt === previousResponse) next.requiredResponseAt = toDateTimeLocal(suggestedResponseAt(value as any));
      }
      if (key === "immediateRisk" && value) next.verificationRequired = true;
      return next;
    });
  }

  function updateRisk<K extends keyof NonNullable<FormState["riskAssessment"]>>(key: K, value: NonNullable<FormState["riskAssessment"]>[K]) {
    setForm((current) => ({
      ...current,
      verificationRequired: key === "requiresImmediateAction" && value ? true : current.verificationRequired,
      riskAssessment: {
        likelihood: 2,
        consequence: 2,
        ...current.riskAssessment,
        [key]: value,
      },
    }));
  }

  const stepErrors = errorsForStep(validation.fieldErrors, step);
  const showErrors = submitted || stepErrors.length > 0;

  function nextStep() {
    setSubmitted(true);
    if (stepErrors.length) {
      errorRef.current?.focus();
      return;
    }
    setSubmitted(false);
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!validation.valid) {
      errorRef.current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      onSubmit(payload);
      if (mode === "create") window.localStorage.removeItem(draftKey);
    } catch {
      return;
    } finally {
      setSubmitting(false);
    }
  }

  function cancel() {
    if (dirty && !window.confirm("Discard unsaved Work Order changes?")) return;
    if (mode === "create") window.localStorage.removeItem(draftKey);
    onCancel();
  }

  function restoreDraft() {
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return;
    try {
      setForm(JSON.parse(raw));
      setShowDraftPrompt(false);
    } catch {
      window.localStorage.removeItem(draftKey);
      setShowDraftPrompt(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {showDraftPrompt && (
        <Alert>
          <Save className="h-4 w-4" />
          <AlertTitle>Saved draft found</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            Resume your local draft or discard it and start again.
            <span className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => { window.localStorage.removeItem(draftKey); setShowDraftPrompt(false); }}>Discard</Button>
              <Button type="button" size="sm" onClick={restoreDraft}>Resume Draft</Button>
            </span>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="mb-5 grid gap-2 md:grid-cols-4" aria-label="Work Order steps">
            {steps.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={cn("rounded-lg border p-3 text-left text-sm", index === step && "border-primary bg-primary/5", index < step && "bg-muted")}
                onClick={() => index <= step && setStep(index)}
                aria-current={index === step ? "step" : undefined}
              >
                <div className="text-xs text-muted-foreground">Step {index + 1} of {steps.length}</div>
                <div className="font-semibold">{item.label}</div>
              </button>
            ))}
          </div>

          {showErrors && Object.keys(validation.fieldErrors).length > 0 && (
            <div ref={errorRef} tabIndex={-1} className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <div className="font-semibold text-destructive">Check the highlighted fields</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {Object.entries(validation.fieldErrors).map(([key, message]) => <li key={key}>{message}</li>)}
              </ul>
            </div>
          )}

          {step === 0 && <LocationStep form={form} update={update} rooms={homeRooms} wards={homeWards} />}
          {step === 1 && <IssueStep form={form} update={update} possibleMatches={possibleMatches} />}
          {step === 2 && <RiskStep form={form} update={update} updateRisk={updateRisk} risk={risk} minimumPriority={minimumPriority} />}
          {step === 3 && <ReviewStep form={form} update={update} canAssign={canAssign} users={homeUsers} risk={risk} workOrder={workOrder} />}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-t-0 md:bg-transparent md:px-0">
        <div className="text-xs text-muted-foreground" aria-live="polite">
          {mode === "create" && savedAt ? `Draft saved ${savedAt}` : dirty ? "Unsaved changes" : "No unsaved changes"}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={cancel}>Cancel</Button>
          {step > 0 && <Button type="button" variant="outline" onClick={() => setStep((current) => current - 1)}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>}
          {step < steps.length - 1 ? (
            <Button type="button" onClick={nextStep}>Next<ChevronRight className="ml-2 h-4 w-4" /></Button>
          ) : (
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Work Order"}</Button>
          )}
        </div>
      </div>
    </form>
  );
}

function LocationStep({ form, update, rooms, wards }: { form: FormState; update: Updater; rooms: ReturnType<typeof useCare>["rooms"]; wards: ReturnType<typeof useCare>["wards"] }) {
  const care = useCare();
  const selected = { homeId: form.homeId, wardId: form.wardId, roomId: form.roomId, exactLocation: form.exactLocation } as MaintenanceWorkOrder;
  const filteredRooms = rooms.filter((room) => !form.wardId || String(room.wardId) === String(form.wardId));
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Care Home" required>
          <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={form.homeId} onChange={(event) => update("homeId", event.target.value)}>
            {care.facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}
          </select>
        </Field>
        <Field label="Ward / Unit">
          <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={form.wardId || ""} onChange={(event) => update("wardId", event.target.value)}>
            <option value="">Whole home / shared area</option>
            {wards.map((ward) => <option key={String(ward.id)} value={String(ward.id)}>{ward.name}</option>)}
          </select>
        </Field>
        <Field label="Room / Area">
          <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={form.roomId || ""} onChange={(event) => update("roomId", event.target.value)}>
            <option value="">No room / shared area</option>
            {filteredRooms.map((room) => <option key={String(room.id)} value={String(room.id)}>Room {room.roomNumber || room.number || room.name}</option>)}
          </select>
        </Field>
        <div>
          <Field label="Exact Location">
            <Input value={form.exactLocation || ""} onChange={(event) => update("exactLocation", event.target.value)} placeholder="e.g., Main corridor outside dining room" />
          </Field>
        </div>
      </div>
      <Summary title="Location Summary">
        <p>{workOrderLocationLabel(selected, care) || "Select a Care Home and location."}</p>
      </Summary>
    </section>
  );
}

function IssueStep({ form, update, possibleMatches }: { form: FormState; update: Updater; possibleMatches: MaintenanceWorkOrder[] }) {
  return (
    <section className="space-y-4">
      {possibleMatches.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Possible duplicate</AlertTitle>
          <AlertDescription>{possibleMatches.length} active Work Order may describe the same issue. You can continue if this is a different problem.</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Work Order Type" required>
          <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={form.type} onChange={(event) => update("type", event.target.value as any)}>
            {WORK_ORDER_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="Source" required>
          <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={form.source} onChange={(event) => update("source", event.target.value as any)}>
            {WORK_ORDER_SOURCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="Category" required>
          <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={form.category} onChange={(event) => update("category", event.target.value as any)}>
            {WORK_ORDER_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="Subcategory">
          <Input value={form.subcategory || ""} onChange={(event) => update("subcategory", event.target.value)} placeholder="e.g., Sensor, door closer, lighting" />
        </Field>
        <Field label="Asset ID / Register Reference">
          <Input value={form.assetId || ""} onChange={(event) => update("assetId", event.target.value)} placeholder="Optional asset reference if known" />
        </Field>
        <Field label="Affected Item Description">
          <Input value={form.affectedAssetDescription || ""} onChange={(event) => update("affectedAssetDescription", event.target.value)} placeholder="e.g., Wall-mounted call bell controller" />
        </Field>
        <Field label="Reporter Contact">
          <Input value={form.reporterContactDetails || ""} onChange={(event) => update("reporterContactDetails", event.target.value)} placeholder="Phone, email or best contact route" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Short Title" required helper="Describe the problem briefly. You do not need to know the technical cause.">
            <Input value={form.title} onChange={(event) => update("title", event.target.value)} maxLength={160} placeholder="Call bell not responding in Room 12" />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Description" required helper="Explain what happened, what staff observed and whether the issue is still occurring.">
            <Textarea value={form.description} onChange={(event) => update("description", event.target.value)} rows={6} />
          </Field>
        </div>
      </div>
    </section>
  );
}

function RiskStep({ form, update, updateRisk, risk, minimumPriority }: { form: FormState; update: Updater; updateRisk: RiskUpdater; risk: ReturnType<typeof calculateMaintenanceRisk>; minimumPriority?: string }) {
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">Priority</legend>
          <div className="grid gap-3 md:grid-cols-5">
            {WORK_ORDER_PRIORITIES.map((priority) => (
              <button
                type="button"
                key={priority.value}
                className={cn("rounded-lg border p-3 text-left text-sm", form.priority === priority.value && "border-primary bg-primary/5")}
                onClick={() => update("priority", priority.value)}
                aria-pressed={form.priority === priority.value}
              >
                <div className="font-semibold">{priority.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{priority.description}</div>
              </button>
            ))}
          </div>
          {minimumPriority && !priorityMeetsMinimum(form.priority, minimumPriority as any) && (
            <p className="mt-2 text-sm font-medium text-destructive">Priority must be at least {workOrderPriorityLabel(minimumPriority as any)} for this risk level.</p>
          )}
        </fieldset>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="How likely is it?">
            <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={form.riskAssessment?.likelihood || 2} onChange={(event) => updateRisk("likelihood", Number(event.target.value) as MaintenanceRiskLikelihood)}>
              {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} - {riskLikelihoodLabel(value)}</option>)}
            </select>
          </Field>
          <Field label="How serious could it be?">
            <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={form.riskAssessment?.consequence || 2} onChange={(event) => updateRisk("consequence", Number(event.target.value) as MaintenanceRiskConsequence)}>
              {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} - {riskConsequenceLabel(value)}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Check label="Immediate risk" checked={Boolean(form.immediateRisk)} onChange={(checked) => update("immediateRisk", checked)} />
          <Check label="Requires immediate action" checked={Boolean(form.riskAssessment?.requiresImmediateAction)} onChange={(checked) => updateRisk("requiresImmediateAction", checked)} />
          <Check label="Vulnerable person may be affected" checked={Boolean(form.riskAssessment?.vulnerablePersonAffected)} onChange={(checked) => updateRisk("vulnerablePersonAffected", checked)} />
          <Check label="Essential service affected" checked={Boolean(form.riskAssessment?.essentialServiceAffected)} onChange={(checked) => updateRisk("essentialServiceAffected", checked)} />
          <Check label="Area restricted" checked={Boolean(form.riskAssessment?.areaRestricted)} onChange={(checked) => updateRisk("areaRestricted", checked)} />
        </div>
        {form.riskAssessment?.areaRestricted && (
          <Field label="Area Restriction Details">
            <Textarea value={form.riskAssessment?.areaRestrictionDetails || ""} onChange={(event) => updateRisk("areaRestrictionDetails", event.target.value)} rows={3} />
          </Field>
        )}
        {(form.immediateRisk || form.riskAssessment?.requiresImmediateAction) && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Immediate safety control required</AlertTitle>
            <AlertDescription>Record the immediate safety control before submitting this Work Order. If there is an immediate emergency, follow the Home's emergency procedure.</AlertDescription>
          </Alert>
        )}
        <Field label="Immediate Controls / Control Measures">
          <Textarea value={form.immediateControlSummary || form.riskAssessment?.controlMeasures || ""} onChange={(event) => { update("immediateControlSummary", event.target.value); updateRisk("controlMeasures", event.target.value); }} rows={4} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Manual Risk Override">
            <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={form.riskAssessment?.manualOverrideLevel || ""} onChange={(event) => updateRisk("manualOverrideLevel", (event.target.value || undefined) as any)}>
              <option value="">No manual override</option>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </Field>
          {form.riskAssessment?.manualOverrideLevel && (
            <Field label="Override Reason" required>
              <Input value={form.riskAssessment?.manualOverrideReason || ""} onChange={(event) => updateRisk("manualOverrideReason", event.target.value)} />
            </Field>
          )}
        </div>
      </div>
      <Summary title="Risk Preview">
        <div className="space-y-2">
          <div className="text-3xl font-semibold">{risk?.score || 4}</div>
          <Badge variant={risk?.calculatedLevel === "CRITICAL" ? "destructive" : "secondary"}>{risk?.calculatedLevel || "LOW"} Risk</Badge>
          <p className="text-muted-foreground">The server recalculates this score when saved.</p>
          <p>Suggested response target: {new Date(suggestedResponseAt(form.priority)).toLocaleString()}</p>
          <p>Suggested due date: {new Date(suggestedDueAt(form.priority)).toLocaleString()}</p>
        </div>
      </Summary>
    </section>
  );
}

function ReviewStep({ form, update, canAssign, users, risk, workOrder }: { form: FormState; update: Updater; canAssign: boolean; users: ReturnType<typeof useCare>["users"]; risk: ReturnType<typeof calculateMaintenanceRisk>; workOrder?: MaintenanceWorkOrder }) {
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Response Target">
          <Input type="datetime-local" value={form.requiredResponseAt || ""} onChange={(event) => update("requiredResponseAt", event.target.value)} />
        </Field>
        <Field label="Due Date">
          <Input type="datetime-local" value={form.dueAt || ""} onChange={(event) => update("dueAt", event.target.value)} />
        </Field>
        {workOrder && ["DRAFT", "OPEN", "ASSIGNED"].includes(workOrder.status) && (
          <Field label="Status">
            <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={form.status} onChange={(event) => update("status", event.target.value as any)}>
              {editableStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </Field>
        )}
        {canAssign ? (
          <Field label="Assigned To">
            <select className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={form.assignedUserId || ""} onChange={(event) => update("assignedUserId", event.target.value)}>
              <option value="">Unassigned</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.name} - {user.department}</option>)}
            </select>
          </Field>
        ) : (
          <Alert className="md:col-span-2">
            <AlertTitle>Assignment is managed by maintenance or management users</AlertTitle>
            <AlertDescription>This Work Order will be created as open and unassigned.</AlertDescription>
          </Alert>
        )}
        <Check label="Verification Required" checked={Boolean(form.verificationRequired)} onChange={(checked) => update("verificationRequired", checked)} />
        {workOrder && form.priority !== workOrder.priority && (
          <Field label="Change Reason" required helper="Required when reducing priority. Stored in the Work Order audit history.">
            <Textarea value={form.changeReason || ""} onChange={(event) => update("changeReason", event.target.value)} rows={3} />
          </Field>
        )}
      </div>
      <Summary title="Review">
        <div className="space-y-2">
          <p className="font-semibold">{form.title || "Untitled Work Order"}</p>
          <p>{form.description || "No description entered yet."}</p>
          <p>Priority: {workOrderPriorityLabel(form.priority)}</p>
          <p>Risk: {risk?.calculatedLevel || "LOW"} ({risk?.score || 4})</p>
          <p>Response target: {form.requiredResponseAt ? new Date(form.requiredResponseAt).toLocaleString() : "Not set"}</p>
          <p>Due date: {form.dueAt ? new Date(form.dueAt).toLocaleString() : "Not set"}</p>
          <p>Status after save: {form.assignedUserId ? "Assigned" : form.status || "Open"}</p>
        </div>
      </Summary>
    </section>
  );
}

type Updater = <K extends keyof FormState>(key: K, value: FormState[K]) => void;
type RiskUpdater = <K extends keyof NonNullable<FormState["riskAssessment"]>>(key: K, value: NonNullable<FormState["riskAssessment"]>[K]) => void;

function Field({ label, required, helper, children }: { label: string; required?: boolean; helper?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} />
      {label}
    </label>
  );
}

function Summary({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <aside className="rounded-lg border bg-muted/30 p-4 text-sm">
      <div className="mb-2 font-semibold">{title}</div>
      {children}
    </aside>
  );
}

function initialState(mode: Mode, care: ReturnType<typeof useCare>, workOrder: MaintenanceWorkOrder | undefined, canAssign: boolean): FormState {
  return {
    title: workOrder?.title || "",
    description: workOrder?.description || "",
    type: workOrder?.type || "REACTIVE",
    source: workOrder?.source || (care.currentRole === "don" || care.currentRole === "group_owner" ? "MAINTENANCE_TEAM" : "STAFF_REPORT"),
    category: workOrder?.category || "GENERAL_EQUIPMENT",
    subcategory: workOrder?.subcategory || "",
    priority: workOrder?.priority || "MEDIUM",
    status: workOrder?.status || "OPEN",
    homeId: workOrder?.homeId || care.activeFacilityId,
    wardId: workOrder?.wardId ? String(workOrder.wardId) : "",
    roomId: workOrder?.roomId ? String(workOrder.roomId) : "",
    exactLocation: workOrder?.exactLocation || "",
    assetId: workOrder?.assetId || "",
    affectedAssetDescription: workOrder?.affectedAssetDescription || "",
    reporterContactDetails: workOrder?.reporterContactDetails || care.currentUser.phone || care.currentUser.email || "",
    assignedUserId: canAssign ? workOrder?.assignedUserId || "" : "",
    supervisorUserId: workOrder?.supervisorUserId || "",
    requiredResponseAt: workOrder?.requiredResponseAt ? toDateTimeLocal(workOrder.requiredResponseAt) : toDateTimeLocal(suggestedResponseAt(workOrder?.priority || "MEDIUM")),
    dueAt: workOrder?.dueAt ? toDateTimeLocal(workOrder.dueAt) : toDateTimeLocal(suggestedDueAt(workOrder?.priority || "MEDIUM")),
    residentSafetyImpact: Boolean(workOrder?.residentSafetyImpact),
    serviceDisruption: Boolean(workOrder?.serviceDisruption),
    complianceImpact: Boolean(workOrder?.complianceImpact),
    immediateRisk: Boolean(workOrder?.immediateRisk),
    immediateControlSummary: workOrder?.immediateControlSummary || "",
    verificationRequired: Boolean(workOrder?.verificationRequired),
    expectedVersion: mode === "edit" ? workOrder?.version : undefined,
    riskAssessment: workOrder?.riskAssessment
      ? {
          likelihood: workOrder.riskAssessment.likelihood,
          consequence: workOrder.riskAssessment.consequence,
          requiresImmediateAction: workOrder.riskAssessment.requiresImmediateAction,
          vulnerablePersonAffected: workOrder.riskAssessment.vulnerablePersonAffected,
          essentialServiceAffected: workOrder.riskAssessment.essentialServiceAffected,
          areaRestricted: workOrder.riskAssessment.areaRestricted,
          areaRestrictionDetails: workOrder.riskAssessment.areaRestrictionDetails,
          controlMeasures: workOrder.riskAssessment.controlMeasures,
          manualOverrideLevel: workOrder.riskAssessment.manualOverrideLevel,
          manualOverrideReason: workOrder.riskAssessment.manualOverrideReason,
        }
      : { likelihood: 2, consequence: 2, requiresImmediateAction: false, vulnerablePersonAffected: false, essentialServiceAffected: false, areaRestricted: false },
  };
}

function toPayload(form: FormState, mode: Mode): CreateWorkOrderInput | UpdateWorkOrderInput {
  const payload = {
    ...form,
    title: cleanText(form.title),
    description: cleanText(form.description),
    dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
    assignedUserId: form.assignedUserId || undefined,
    supervisorUserId: form.supervisorUserId || undefined,
    roomId: form.roomId || undefined,
    wardId: form.wardId || undefined,
    exactLocation: cleanText(form.exactLocation),
    assetId: cleanText(form.assetId),
    subcategory: cleanText(form.subcategory),
    affectedAssetDescription: cleanText(form.affectedAssetDescription),
    reporterContactDetails: cleanText(form.reporterContactDetails),
    immediateControlSummary: cleanText(form.immediateControlSummary),
    requiredResponseAt: form.requiredResponseAt ? new Date(form.requiredResponseAt).toISOString() : undefined,
  };
  if (mode === "edit") {
    const { homeId: _homeId, ...editable } = payload;
    return editable;
  }
  return payload;
}

function cleanText(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || undefined;
}

function errorsForStep(errors: Record<string, string>, step: number) {
  const groups = [
    ["homeId", "roomId", "wardId"],
    ["type", "source", "category", "title", "description"],
    ["priority", "riskAssessment", "immediateControlSummary", "areaRestrictionDetails", "manualOverrideReason"],
    ["dueAt", "requiredResponseAt", "assignedUserId"],
  ];
  return Object.keys(errors).filter((key) => groups[step].includes(key));
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function riskLikelihoodLabel(value: number) {
  return ["Rare", "Unlikely", "Possible", "Likely", "Almost certain"][value - 1];
}

function riskConsequenceLabel(value: number) {
  return ["Minor", "Moderate", "Significant", "Major", "Severe"][value - 1];
}
