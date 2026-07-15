import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Check, Clock, Coffee, Droplet, Heart, Moon, Shirt, Smile, UserCheck, Utensils } from "lucide-react";
import { toast } from "sonner";
import {
  DAILY_CARE_LABELS,
  DAILY_CARE_OUTCOME_LABELS,
  DAILY_CARE_TYPES,
  type DailyCareOutcome,
  type DailyCareOutcomeReasonCode,
  type DailyCareParticipationLevel,
  type DailyCareStatus,
  type DailyCareType,
  type RecordDailyCareCommand,
} from "@/domain/dailyCare";
import type { DailyCareAlternativeOffered, DailyCareDetails } from "@/domain/dailyCare/dailyCareDetails";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const careTypeIcons: Partial<Record<DailyCareType, React.ComponentType<{ className?: string }>>> = {
  personal_care: UserCheck,
  dressing: Shirt,
  oral_care: Smile,
  repositioning: Activity,
  food: Utensils,
  fluids: Droplet,
  mobility: Activity,
  comfort: Heart,
  sleep: Moon,
  mood: Smile,
  refusal: AlertTriangle,
  skin_observation: UserCheck,
};

const outcomes: DailyCareOutcome[] = ["completed", "partially_completed", "refused", "unable", "not_required", "escalated"];
const quickCareTypes: DailyCareType[] = ["personal_care", "oral_care", "repositioning", "food", "fluids", "mobility", "comfort", "sleep", "mood", "activity", "skin_observation", "refusal"];
const otherReasonOptions: Array<{ value: DailyCareOutcomeReasonCode; label: string }> = [
  { value: "resident_requested_stop", label: "Resident asked to stop" },
  { value: "resident_tired", label: "Resident tired" },
  { value: "resident_in_pain", label: "Pain" },
  { value: "resident_distressed", label: "Distress" },
  { value: "clinical_condition_changed", label: "Clinical condition changed" },
  { value: "equipment_issue", label: "Equipment issue" },
  { value: "staffing_or_safety_issue", label: "Staffing or safety issue" },
  { value: "already_completed", label: "Already completed" },
  { value: "care_not_needed_at_this_time", label: "Not needed at this time" },
  { value: "resident_unavailable", label: "Resident unavailable" },
  { value: "unsafe_to_proceed", label: "Unsafe to proceed" },
  { value: "clinical_concern", label: "Clinical concern" },
  { value: "other", label: "Other" },
];

export function RecordDailyCareDialog({
  open,
  onOpenChange,
  residentId,
  nursingHomeId,
  wardId,
  roomId,
  bedId,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  roomId?: string;
  bedId?: string;
  onSave: (command: RecordDailyCareCommand) => void;
}) {
  const now = new Date();
  const [mode, setMode] = useState<"quick" | "detailed">("quick");
  const [careType, setCareType] = useState<DailyCareType>("personal_care");
  const [occurredAt, setOccurredAt] = useState(now.toISOString().slice(0, 16));
  const [deliveredByStaffMemberId, setDeliveredByStaffMemberId] = useState("");
  const [outcome, setOutcome] = useState<DailyCareOutcome>("completed");
  const [outcomeReasonCode, setOutcomeReasonCode] = useState<DailyCareOutcomeReasonCode | "">("");
  const [statusReason, setStatusReason] = useState("");
  const [participationLevel, setParticipationLevel] = useState<DailyCareParticipationLevel>("with_assistance");
  const [supportProvided, setSupportProvided] = useState("");
  const [residentResponse, setResidentResponse] = useState("");
  const [outcomeSummary, setOutcomeSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpReason, setFollowUpReason] = useState("");
  const [fields, setFields] = useState<Record<string, string | boolean>>({});
  const effectiveCareType = outcome === "refused" ? "refusal" : careType;
  const details = useMemo(() => makeDetails(effectiveCareType, fields, occurredAt, careType, followUpRequired, followUpReason), [effectiveCareType, fields, occurredAt, careType, followUpRequired, followUpReason]);
  const requiresReason = ["partially_completed", "unable", "not_required", "escalated"].includes(outcome) || outcomeReasonCode === "other";

  const set = (key: string, value: string | boolean) => setFields((current) => ({ ...current, [key]: value }));
  const selectCareType = (type: DailyCareType) => {
    setCareType(type);
    setOutcome(type === "refusal" ? "refused" : outcome === "refused" ? "completed" : outcome);
    setFields({});
  };
  const applyShortcut = (shortcut: Shortcut) => {
    setCareType(shortcut.careType);
    setOutcome(shortcut.outcome);
    setParticipationLevel(shortcut.participationLevel ?? participationLevel);
    setFields(shortcut.fields);
    setOutcomeSummary(shortcut.summary);
    if (shortcut.followUpRequired) {
      setFollowUpRequired(true);
      setFollowUpReason(shortcut.summary);
    }
  };
  const reset = () => {
    setMode("quick");
    setCareType("personal_care");
    setOutcome("completed");
    setOutcomeReasonCode("");
    setStatusReason("");
    setParticipationLevel("with_assistance");
    setSupportProvided("");
    setResidentResponse("");
    setOutcomeSummary("");
    setNotes("");
    setFollowUpRequired(false);
    setFollowUpReason("");
    setFields({});
    setOccurredAt(new Date().toISOString().slice(0, 16));
  };
  const submit = () => {
    if (requiresReason && !statusReason.trim()) return toast.error("A concise reason is required for this outcome.");
    if (followUpRequired && !followUpReason.trim()) return toast.error("Follow-up requires a reason.");
    try {
      onSave({
        residentId,
        nursingHomeId,
        wardId,
        roomId,
        bedId,
        careType: effectiveCareType,
        occurredAt: new Date(occurredAt).toISOString(),
        deliveredByStaffMemberId: deliveredByStaffMemberId.trim() || undefined,
        status: outcome as DailyCareStatus,
        outcomeReasonCode: outcomeReasonCode || undefined,
        statusReason: statusReason.trim() || undefined,
        participationLevel: outcome === "refused" ? "not_applicable" : participationLevel,
        supportProvided: split(supportProvided),
        residentResponse: residentResponse.trim() || undefined,
        outcomeSummary: outcomeSummary.trim() || DAILY_CARE_OUTCOME_LABELS[outcome],
        notes: mode === "detailed" ? notes.trim() || undefined : undefined,
        details,
        source: { sourceType: "manual", route: "resident_bedside_daily_care" },
        followUpRequired,
        followUpReason: followUpReason.trim() || undefined,
        clientRequestId: `daily-care-${residentId}-${Date.now()}`,
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Daily Care could not be saved.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Record Daily Care</DialogTitle>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-md bg-muted px-2 py-1">Resident locked</span>
            {roomId && <span className="rounded-md bg-muted px-2 py-1">Room {roomId}</span>}
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1"><Clock className="h-3.5 w-3.5" /> Current shift</span>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Field label="Date and Time Care Provided">
              <Input type="datetime-local" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} />
            </Field>
            <div className="flex items-end rounded-md border p-1">
              <Button type="button" variant={mode === "quick" ? "default" : "ghost"} onClick={() => setMode("quick")}>Quick Record</Button>
              <Button type="button" variant={mode === "detailed" ? "default" : "ghost"} onClick={() => setMode("detailed")}>Detailed Record</Button>
            </div>
          </div>

          <section className="space-y-3">
            <Label>Care Type</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {(mode === "quick" ? quickCareTypes : DAILY_CARE_TYPES).map((type) => <CareTypeButton key={type} type={type} selected={careType === type || (type === "refusal" && outcome === "refused")} onClick={() => selectCareType(type)} />)}
            </div>
          </section>

          <section className="space-y-3">
            <Label>Outcome</Label>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
              {outcomes.map((item) => (
                <Button key={item} type="button" variant={outcome === item ? "default" : "outline"} className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => { setOutcome(item); if (item === "refused") setFields({ refusedCareType: careType }); }}>
                  {item === "completed" && <Check className="mr-2 h-4 w-4" />}
                  {DAILY_CARE_OUTCOME_LABELS[item]}
                </Button>
              ))}
            </div>
          </section>

          {mode === "quick" && (
            <section className="space-y-3">
              <Label>Frequent Care Shortcuts</Label>
              <div className="flex flex-wrap gap-2">
                {shortcuts.map((shortcut) => <Button key={shortcut.label} type="button" variant="secondary" className="h-11" onClick={() => applyShortcut(shortcut)}>{shortcut.label}</Button>)}
              </div>
            </section>
          )}

          <DailyCareQuickFields type={effectiveCareType} values={fields} set={set} mode={mode} />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Resident Participation">
              <Select value={participationLevel} onValueChange={(value) => setParticipationLevel(value as DailyCareParticipationLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="independent">Independent</SelectItem>
                  <SelectItem value="with_prompting">Prompting</SelectItem>
                  <SelectItem value="with_supervision">Supervision</SelectItem>
                  <SelectItem value="with_assistance">Assisted</SelectItem>
                  <SelectItem value="fully_supported">Fully Supported</SelectItem>
                  <SelectItem value="not_applicable">Not Applicable</SelectItem>
                  <SelectItem value="not_recorded">Not Recorded</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reason Code">
              <Select value={outcomeReasonCode} onValueChange={(value) => setOutcomeReasonCode(value as DailyCareOutcomeReasonCode)}>
                <SelectTrigger><SelectValue placeholder="Only if needed" /></SelectTrigger>
                <SelectContent>{otherReasonOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>

          {requiresReason && <Field label="Concise Reason"><Input value={statusReason} onChange={(event) => setStatusReason(event.target.value)} placeholder="Brief reason" /></Field>}

          {mode === "detailed" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Care Provided By"><Input value={deliveredByStaffMemberId} onChange={(event) => setDeliveredByStaffMemberId(event.target.value)} placeholder="Optional staff ID" /></Field>
              <Field label="Support Provided"><Input value={supportProvided} onChange={(event) => setSupportProvided(event.target.value)} placeholder="Comma separated" /></Field>
              <Field label="Resident Response"><Input value={residentResponse} onChange={(event) => setResidentResponse(event.target.value)} /></Field>
              <Field label="Outcome Summary"><Input value={outcomeSummary} onChange={(event) => setOutcomeSummary(event.target.value)} /></Field>
              <div className="sm:col-span-2"><Field label="Notes"><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></Field></div>
            </div>
          )}

          <label className="flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm">
            <input type="checkbox" checked={followUpRequired} onChange={(event) => setFollowUpRequired(event.target.checked)} /> Follow-Up Required
          </label>
          {followUpRequired && <Field label="Follow-Up Reason"><Input value={followUpReason} onChange={(event) => setFollowUpReason(event.target.value)} /></Field>}
        </div>

        <DialogFooter className="border-t px-5 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Save Daily Care</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CareTypeButton({ type, selected, onClick }: { type: DailyCareType; selected: boolean; onClick: () => void }) {
  const Icon = careTypeIcons[type] || Coffee;
  return (
    <Button type="button" variant={selected ? "default" : "outline"} className="h-auto min-h-16 justify-start gap-2 whitespace-normal py-3 text-left" onClick={onClick}>
      <Icon className="h-4 w-4 shrink-0" />
      <span>{DAILY_CARE_LABELS[type]}</span>
    </Button>
  );
}

function DailyCareQuickFields({ type, values, set, mode }: { type: DailyCareType; values: Record<string, string | boolean>; set: (key: string, value: string | boolean) => void; mode: "quick" | "detailed" }) {
  const text = (key: string, label: string, placeholder?: string) => <Field label={label}><Input value={String(values[key] ?? "")} onChange={(event) => set(key, event.target.value)} placeholder={placeholder} /></Field>;
  const check = (key: string, label: string) => <label className="flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm"><input type="checkbox" checked={Boolean(values[key])} onChange={(event) => set(key, event.target.checked)} /> {label}</label>;
  const chipSelect = (key: string, label: string, options: string[]) => <div className="space-y-2"><Label>{label}</Label><div className="flex flex-wrap gap-2">{options.map((option) => <Button key={option} type="button" variant={values[key] === option ? "default" : "outline"} onClick={() => set(key, option)}>{option.replaceAll("_", " ")}</Button>)}</div></div>;
  if (type === "refusal") return <RefusalWorkflow values={values} set={set} />;
  if (type === "personal_care") return <div className="grid gap-3 sm:grid-cols-2">{chipSelect("careProvided", "Care Provided", ["full_body_wash", "partial_wash", "shower", "bed_bath"])}{chipSelect("assistance", "Assistance", ["independent", "assisted", "fully_supported"])}{check("privacyMaintained", "Privacy maintained")}{check("skinConcernsObserved", "Skin concern")}</div>;
  if (type === "oral_care") return <div className="grid gap-3 sm:grid-cols-2">{chipSelect("oralCareProvided", "Oral Care", ["teeth_brushed", "dentures_cleaned", "mouth_care"])}{chipSelect("dentures", "Dentures", ["not_applicable", "cleaned", "in_place", "not_worn"])}{check("swallowingConcernObserved", "Concern observed")}</div>;
  if (type === "food") return <div className="grid gap-3 sm:grid-cols-2">{chipSelect("mealType", "Meal", ["breakfast", "lunch", "evening_meal", "supper"])}{chipSelect("intake", "Intake", ["none", "quarter", "half", "three_quarters", "all"])}{chipSelect("assistance", "Assistance", ["independent", "prompting", "partial_assistance", "full_assistance"])}{check("swallowingConcernObserved", "Swallowing concern")}</div>;
  if (type === "fluids") return <div className="grid gap-3 sm:grid-cols-2">{text("drinkType", "Drink Type")}{chipSelect("amountTakenMl", "Amount Taken", ["100", "150", "200", "250"])}{text("amountOfferedMl", "Amount Offered ml")}{chipSelect("assistance", "Assistance", ["independent", "prompting", "partial_assistance", "full_assistance"])}</div>;
  if (type === "mobility") return <div className="grid gap-3 sm:grid-cols-2">{chipSelect("mobilityActivity", "Mobility", ["walked", "transferred", "stood", "wheelchair_mobility"])}{chipSelect("assistance", "Assistance", ["independent", "supervision", "one_person_assistance", "two_person_assistance"])}{mode === "detailed" && text("distanceOrDuration", "Distance / Duration")}{check("nearFallOrSafetyConcern", "Safety concern")}</div>;
  if (type === "repositioning") return <div className="grid gap-3 sm:grid-cols-2">{chipSelect("toPosition", "Position", ["left_side", "right_side", "supine", "sitting"])}{check("residentComfortAfter", "Comfortable after")}{check("skinConcernObserved", "Skin concern")}</div>;
  if (type === "comfort") return <div className="grid gap-3 sm:grid-cols-2">{chipSelect("comfortState", "Comfort", ["comfortable", "mild_discomfort", "moderate_discomfort", "severe_discomfort"])}{chipSelect("comfortMeasures", "Measure", ["repositioned", "reassurance", "quiet_environment", "blanket_or_temperature_adjustment"])}{check("painAssessmentSuggested", "Pain review suggested")}</div>;
  if (type === "sleep") return <div className="grid gap-3 sm:grid-cols-2">{chipSelect("state", "Sleep", ["settled", "asleep", "awake", "restless", "distressed"])}{mode === "detailed" && text("estimatedSleepDurationMinutes", "Estimated Sleep Minutes")}</div>;
  if (type === "mood") return <div className="grid gap-3 sm:grid-cols-2">{chipSelect("observedMood", "Mood", ["content", "calm", "low", "anxious", "tearful", "withdrawn", "variable"])}{check("significantChangeFromUsual", "Changed from usual")}</div>;
  if (type === "activity") return <div className="grid gap-3 sm:grid-cols-2">{text("activityName", "Activity")}{chipSelect("participation", "Participation", ["active", "partial", "observed", "declined"])}</div>;
  if (type === "skin_observation") return <div className="grid gap-3 sm:grid-cols-2">{text("bodyAreasObserved", "Body Area", "heels, sacrum")}{chipSelect("skinState", "Skin", ["intact", "redness", "bruising", "broken_skin", "pressure_concern"])}{chipSelect("blanchingStatus", "Blanching", ["blanching", "non_blanching", "not_assessed"])}</div>;
  return <div className="grid gap-3 sm:grid-cols-2">{text("careProvided", "Care Details")}</div>;
}

function RefusalWorkflow({ values, set }: { values: Record<string, string | boolean>; set: (key: string, value: string | boolean) => void }) {
  return (
    <section className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3">
      <div className="font-medium text-amber-950">Structured Refusal</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {select("refusedCareType", "Care Offered", values, set, DAILY_CARE_TYPES.filter((type) => type !== "refusal"))}
        {select("residentResponse", "Resident Response", values, set, ["declined", "asked_for_later", "accepted_alternative", "unable_to_engage", "became_distressed", "other"])}
        {select("refusalReason", "Reason", values, set, ["resident_choice", "preferred_later_time", "pain", "fatigue", "distress", "fear_or_anxiety", "confusion", "did_not_understand", "did_not_want_current_staff_member", "privacy_preference", "cultural_or_religious_preference", "care_already_received", "not_provided", "other"])}
        <Field label="Reason / Resident Words"><Input value={String(values.refusalReasonText ?? "")} onChange={(event) => set("refusalReasonText", event.target.value)} /></Field>
        {select("alternativeType", "Alternative Offered", values, set, ["later_time", "different_staff_member", "different_method", "different_location", "smaller_or_partial_care", "resident_preferred_option", "comfort_first", "other"])}
        {select("alternativeAccepted", "Alternative Accepted", values, set, ["yes", "no", "not_decided"])}
        <Field label="Alternative Details"><Input value={String(values.alternativeDescription ?? "")} onChange={(event) => set("alternativeDescription", event.target.value)} /></Field>
        <Field label="Retry At"><Input type="datetime-local" value={String(values.retryAt ?? "")} onChange={(event) => set("retryAt", event.target.value)} /></Field>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {check("explanationProvided", "Explanation given", values, set)}
        {check("risksExplained", "Risk explained", values, set)}
        {check("nurseInformed", "Nurse informed", values, set)}
        {check("immediateRiskIdentified", "Immediate risk", values, set)}
      </div>
    </section>
  );
}

type Shortcut = { label: string; careType: DailyCareType; outcome: DailyCareOutcome; participationLevel?: DailyCareParticipationLevel; summary: string; followUpRequired?: boolean; fields: Record<string, string | boolean> };
const shortcuts: Shortcut[] = [
  { label: "Personal Care Completed", careType: "personal_care", outcome: "completed", participationLevel: "with_assistance", summary: "Personal care completed.", fields: { careProvided: "full_body_wash", privacyMaintained: true } },
  { label: "Oral Care Completed", careType: "oral_care", outcome: "completed", summary: "Oral care completed.", fields: { oralCareProvided: "teeth_brushed", dentures: "not_recorded" } },
  { label: "Repositioned", careType: "repositioning", outcome: "completed", summary: "Resident repositioned.", fields: { toPosition: "side", residentComfortAfter: true } },
  { label: "Ate All", careType: "food", outcome: "completed", participationLevel: "independent", summary: "Meal taken well.", fields: { mealType: "lunch", intake: "all", assistance: "independent" } },
  { label: "Ate Half", careType: "food", outcome: "partially_completed", summary: "Half meal taken.", fields: { mealType: "lunch", intake: "half", assistance: "prompting" } },
  { label: "Drank 200 ml", careType: "fluids", outcome: "completed", summary: "Fluid intake recorded.", fields: { drinkType: "drink", amountTakenMl: "200", amountOfferedMl: "200", intakeEstimate: "measured", assistance: "independent" } },
  { label: "Comfortable", careType: "comfort", outcome: "completed", summary: "Resident comfortable.", fields: { comfortState: "comfortable", comfortMeasures: "reassurance" } },
  { label: "Care Declined", careType: "refusal", outcome: "refused", summary: "Resident declined care.", fields: { refusedCareType: "personal_care", residentResponse: "declined", refusalReason: "not_provided", explanationProvided: true, alternativeType: "later_time", alternativeAccepted: "not_decided" } },
  { label: "Skin Intact", careType: "skin_observation", outcome: "completed", summary: "Skin intact.", fields: { bodyAreasObserved: "pressure areas", skinState: "intact", blanchingStatus: "not_assessed" } },
];

function makeDetails(type: DailyCareType, values: Record<string, string | boolean>, occurredAt: string, refusedCareType: DailyCareType, followUpRequired: boolean, followUpReason: string): DailyCareDetails {
  const arr = (key: string) => split(String(values[key] ?? ""));
  const num = (key: string) => Number.isFinite(Number(values[key])) && String(values[key] ?? "").trim() !== "" ? Number(values[key]) : undefined;
  const str = (key: string, fallback = "") => String(values[key] ?? fallback);
  const bool = (key: string) => Boolean(values[key]);
  if (type === "personal_care") return { type, careProvided: nonEmpty(arr("careProvided"), ["other"]) as any, privacyMaintained: bool("privacyMaintained"), skinConcernsObserved: bool("skinConcernsObserved") };
  if (type === "dressing") return { type, dressingState: str("dressingState", "day_clothes") as any, residentChoseClothing: bool("residentChoseClothing"), footwearRecorded: str("footwearRecorded") || undefined };
  if (type === "oral_care") return { type, oralCareProvided: nonEmpty(arr("oralCareProvided"), ["other"]) as any, dentures: str("dentures", "not_recorded") as any, oralCondition: bool("swallowingConcernObserved") ? ["swallowing_concern"] as any : arr("oralCondition") as any, followUpSuggested: bool("followUpSuggested") };
  if (type === "toileting") return { type, toiletingMethod: str("toiletingMethod", "toilet") as any, outcome: str("outcome", "not_recorded") as any, prompted: bool("prompted"), discomfortObserved: bool("discomfortObserved") };
  if (type === "continence") return { type, continenceState: str("continenceState", "not_observed") as any, productUsed: str("productUsed") || undefined, skinCareProvided: bool("skinCareProvided"), leakageObserved: bool("leakageObserved") };
  if (type === "repositioning") return { type, fromPosition: str("fromPosition") || undefined, toPosition: str("toPosition", "position changed"), equipmentUsed: arr("equipmentUsed"), residentComfortAfter: bool("residentComfortAfter"), skinObserved: bool("skinConcernObserved"), skinConcernObserved: bool("skinConcernObserved") };
  if (type === "food") return { type, mealType: str("mealType", "other") as any, intake: str("intake", "not_recorded") as any, assistance: str("assistance", "not_recorded") as any, swallowingConcernObserved: bool("swallowingConcernObserved") };
  if (type === "fluids") return { type, drinkType: str("drinkType") || undefined, amountOfferedMl: num("amountOfferedMl"), amountTakenMl: num("amountTakenMl"), intakeEstimate: num("amountTakenMl") ? "measured" : str("intakeEstimate", "not_recorded") as any, assistance: str("assistance", "not_recorded") as any, swallowingConcernObserved: bool("swallowingConcernObserved") };
  if (type === "mobility") return { type, mobilityActivity: str("mobilityActivity", "other") as any, assistance: str("assistance", "not_recorded") as any, distanceOrDuration: str("distanceOrDuration") || undefined, nearFallOrSafetyConcern: bool("nearFallOrSafetyConcern") };
  if (type === "comfort") return { type, comfortState: str("comfortState", "unable_to_assess") as any, comfortMeasures: nonEmpty(arr("comfortMeasures"), ["other"]) as any, painAssessmentSuggested: bool("painAssessmentSuggested") };
  if (type === "sleep") return { type, state: str("state", "not_observed") as any, estimatedSleepDurationMinutes: num("estimatedSleepDurationMinutes"), nightChecksCompleted: num("nightChecksCompleted") };
  if (type === "mood") return { type, observedMood: str("observedMood", "unable_to_assess") as any, residentReportedMood: str("residentReportedMood") || undefined, significantChangeFromUsual: bool("significantChangeFromUsual") };
  if (type === "behaviour") return { type, behaviourObserved: nonEmpty(arr("behaviourObserved"), ["observed"]), possibleTriggers: arr("possibleTriggers"), riskToSelfOrOthers: bool("riskToSelfOrOthers"), behaviourIncidentRequired: bool("behaviourIncidentRequired") };
  if (type === "activity") return { type, activityType: str("activityType", "other") as any, activityName: str("activityName", "Activity"), participation: str("participation", "observed") as any, enjoyment: str("enjoyment", "not_recorded") as any };
  if (type === "refusal") {
    const alternative: DailyCareAlternativeOffered = { alternativeType: str("alternativeType", "later_time") as any, description: str("alternativeDescription") || undefined, accepted: str("alternativeAccepted", "not_decided") as any };
    const offeredType = str("refusedCareType", refusedCareType) as DailyCareType;
    return { type, careOffered: { careType: offeredType, title: DAILY_CARE_LABELS[offeredType] || "Care offered", offeredAt: new Date(occurredAt).toISOString() }, refusedCareType: offeredType, residentResponse: str("residentResponse", "declined") as any, residentResponseText: str("residentResponseText") || undefined, refusalReason: str("refusalReason", "not_provided") as any, refusalReasonText: str("refusalReasonText") || undefined, explanationProvided: bool("explanationProvided"), risksExplained: bool("risksExplained"), alternativesOffered: [alternative], nurseInformed: bool("nurseInformed"), nurseInformedAt: bool("nurseInformed") ? new Date().toISOString() : undefined, immediateRiskIdentified: bool("immediateRiskIdentified"), escalationRequired: bool("immediateRiskIdentified"), followUpRequired, retryAt: str("retryAt") ? new Date(str("retryAt")).toISOString() : undefined, followUpReason: followUpReason || undefined };
  }
  return { type, bodyAreasObserved: nonEmpty(arr("bodyAreasObserved"), ["not_recorded"]), skinState: nonEmpty(arr("skinState"), ["intact"]) as any, blanchingStatus: str("blanchingStatus", "not_assessed") as any, woundAssessmentRequired: bool("woundAssessmentRequired") };
}

function select(key: string, label: string, values: Record<string, string | boolean>, set: (key: string, value: string | boolean) => void, options: string[]) {
  return <Field label={label}><Select value={String(values[key] ?? "")} onValueChange={(value) => set(key, value)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field>;
}
function check(key: string, label: string, values: Record<string, string | boolean>, set: (key: string, value: string | boolean) => void) {
  return <label className="flex min-h-11 items-center gap-2 rounded-md border bg-white px-3 text-sm"><input type="checkbox" checked={Boolean(values[key])} onChange={(event) => set(key, event.target.checked)} /> {label}</label>;
}
function split(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean); }
function nonEmpty<T>(value: T[], fallback: T[]) { return value.length ? value : fallback; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>; }
