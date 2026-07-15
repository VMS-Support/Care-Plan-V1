import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DAILY_CARE_LABELS, DAILY_CARE_TYPES, type DailyCareParticipationLevel, type DailyCareStatus, type DailyCareType, type RecordDailyCareCommand } from "@/domain/dailyCare";
import type { DailyCareDetails } from "@/domain/dailyCare/dailyCareDetails";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function RecordDailyCareDialog({ open, onOpenChange, residentId, nursingHomeId, wardId, roomId, bedId, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; residentId: string; nursingHomeId: string; wardId?: string; roomId?: string; bedId?: string; onSave: (command: RecordDailyCareCommand) => void }) {
  const now = new Date();
  const [careType, setCareType] = useState<DailyCareType>("personal_care");
  const [occurredAt, setOccurredAt] = useState(now.toISOString().slice(0, 16));
  const [deliveredByStaffMemberId, setDeliveredByStaffMemberId] = useState("");
  const [status, setStatus] = useState<DailyCareStatus>("completed");
  const [statusReason, setStatusReason] = useState("");
  const [participationLevel, setParticipationLevel] = useState<DailyCareParticipationLevel>("with_assistance");
  const [supportProvided, setSupportProvided] = useState("");
  const [residentResponse, setResidentResponse] = useState("");
  const [outcomeSummary, setOutcomeSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpReason, setFollowUpReason] = useState("");
  const [fields, setFields] = useState<Record<string, string | boolean>>({});
  const needsReason = ["partially_completed", "declined", "unable_to_complete"].includes(status);
  const details = useMemo(() => makeDetails(careType, fields), [careType, fields]);

  const set = (key: string, value: string | boolean) => setFields((current) => ({ ...current, [key]: value }));
  const reset = () => {
    setCareType("personal_care"); setStatus("completed"); setStatusReason(""); setParticipationLevel("with_assistance"); setSupportProvided(""); setResidentResponse(""); setOutcomeSummary(""); setNotes(""); setFollowUpRequired(false); setFollowUpReason(""); setFields({});
  };
  const submit = () => {
    if (needsReason && !statusReason.trim()) return toast.error("A reason is required for this status.");
    if (followUpRequired && !followUpReason.trim()) return toast.error("Follow-Up Required needs a reason.");
    onSave({
      residentId,
      nursingHomeId,
      wardId,
      roomId,
      bedId,
      careType,
      occurredAt: new Date(occurredAt).toISOString(),
      deliveredByStaffMemberId: deliveredByStaffMemberId.trim() || undefined,
      status,
      statusReason: statusReason.trim() || undefined,
      participationLevel,
      supportProvided: split(supportProvided),
      residentResponse: residentResponse.trim() || undefined,
      outcomeSummary: outcomeSummary.trim() || undefined,
      notes: notes.trim() || undefined,
      details,
      source: { sourceType: "manual" },
      followUpRequired,
      followUpReason: followUpReason.trim() || undefined,
      clientRequestId: `daily-care-${residentId}-${Date.now()}`,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Record Daily Care</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Care Type"><Select value={careType} onValueChange={(value) => { setCareType(value as DailyCareType); setFields({}); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DAILY_CARE_TYPES.map((type) => <SelectItem key={type} value={type}>{DAILY_CARE_LABELS[type]}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Date and Time Care Provided"><Input type="datetime-local" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} /></Field>
            <Field label="Care Provided By"><Input value={deliveredByStaffMemberId} onChange={(event) => setDeliveredByStaffMemberId(event.target.value)} placeholder="Optional staff ID" /></Field>
            <Field label="Status"><Select value={status} onValueChange={(value) => setStatus(value as DailyCareStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="completed">Completed</SelectItem><SelectItem value="partially_completed">Partially completed</SelectItem><SelectItem value="declined">Declined</SelectItem><SelectItem value="not_required">Not required</SelectItem><SelectItem value="unable_to_complete">Unable to complete</SelectItem></SelectContent></Select></Field>
            <Field label="Resident Participation"><Select value={participationLevel} onValueChange={(value) => setParticipationLevel(value as DailyCareParticipationLevel)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="independent">Independent</SelectItem><SelectItem value="with_prompting">With Prompting</SelectItem><SelectItem value="with_supervision">With Supervision</SelectItem><SelectItem value="with_assistance">With Assistance</SelectItem><SelectItem value="fully_supported">Fully Supported</SelectItem><SelectItem value="not_applicable">Not Applicable</SelectItem><SelectItem value="not_recorded">Not Recorded</SelectItem></SelectContent></Select></Field>
            {needsReason && <Field label="Status Reason"><Input value={statusReason} onChange={(event) => setStatusReason(event.target.value)} /></Field>}
          </div>
          <DailyCareTypeFields type={careType} values={fields} set={set} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Support Provided"><Input value={supportProvided} onChange={(event) => setSupportProvided(event.target.value)} placeholder="Comma separated" /></Field>
            <Field label="Resident Response"><Input value={residentResponse} onChange={(event) => setResidentResponse(event.target.value)} /></Field>
          </div>
          <Field label="Outcome"><Textarea value={outcomeSummary} onChange={(event) => setOutcomeSummary(event.target.value)} /></Field>
          <Field label="Notes"><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={followUpRequired} onChange={(event) => setFollowUpRequired(event.target.checked)} /> Follow-Up Required</label>
          {followUpRequired && <Field label="Follow-Up Reason"><Input value={followUpReason} onChange={(event) => setFollowUpReason(event.target.value)} /></Field>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DailyCareTypeFields({ type, values, set }: { type: DailyCareType; values: Record<string, string | boolean>; set: (key: string, value: string | boolean) => void }) {
  const text = (key: string, label: string, placeholder?: string) => <Field label={label}><Input value={String(values[key] ?? "")} onChange={(event) => set(key, event.target.value)} placeholder={placeholder} /></Field>;
  const check = (key: string, label: string) => <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(values[key])} onChange={(event) => set(key, event.target.checked)} /> {label}</label>;
  if (type === "personal_care") return <div className="grid gap-3 sm:grid-cols-2">{text("careProvided", "Care Provided", "shower, hair care")}{check("privacyMaintained", "Privacy maintained")}{check("skinConcernsObserved", "Skin concerns observed")}</div>;
  if (type === "dressing") return <div className="grid gap-3 sm:grid-cols-2">{select("dressingState", "Dressing State", values, set, ["day_clothes", "night_clothes", "changed_clothing", "undressed", "other"])}{check("residentChoseClothing", "Resident chose clothing")}{text("footwearRecorded", "Footwear")}</div>;
  if (type === "oral_care") return <div className="grid gap-3 sm:grid-cols-2">{text("oralCareProvided", "Oral Care Provided", "teeth brushed, dentures cleaned")}{select("dentures", "Dentures", values, set, ["not_applicable", "in_place", "removed", "cleaned", "not_worn", "missing_or_damaged", "not_recorded"])}{text("oralCondition", "Oral Condition", "healthy, dry mouth")}{check("followUpSuggested", "Follow-up suggested")}</div>;
  if (type === "toileting") return <div className="grid gap-3 sm:grid-cols-2">{select("toiletingMethod", "Toileting Method", values, set, ["toilet", "commode", "bedpan", "urinal", "assisted_transfer", "other"])}{select("outcome", "Outcome", values, set, ["urine", "bowel_motion", "both", "no_output", "attempt_only", "not_recorded"])}{check("prompted", "Prompted")}{check("discomfortObserved", "Discomfort observed")}</div>;
  if (type === "continence") return <div className="grid gap-3 sm:grid-cols-2">{select("continenceState", "Continence State", values, set, ["continent", "urinary_incontinence", "faecal_incontinence", "double_incontinence", "not_observed"])}{text("productUsed", "Product Used")}{check("skinCareProvided", "Skin care provided")}{check("leakageObserved", "Leakage observed")}</div>;
  if (type === "repositioning") return <div className="grid gap-3 sm:grid-cols-2">{text("fromPosition", "From Position")}{text("toPosition", "To Position")}{text("equipmentUsed", "Equipment Used", "Comma separated")}{check("skinConcernObserved", "Skin concern observed")}</div>;
  if (type === "food") return <div className="grid gap-3 sm:grid-cols-2">{select("mealType", "Meal Type", values, set, ["breakfast", "morning_snack", "lunch", "afternoon_snack", "evening_meal", "supper", "other"])}{select("intake", "Intake", values, set, ["none", "quarter", "half", "three_quarters", "all", "not_recorded"])}{select("assistance", "Assistance", values, set, ["independent", "prompting", "supervision", "partial_assistance", "full_assistance", "not_recorded"])}{check("swallowingConcernObserved", "Swallowing concern observed")}</div>;
  if (type === "fluids") return <div className="grid gap-3 sm:grid-cols-2">{text("drinkType", "Drink Type")}{text("amountOfferedMl", "Amount Offered ml")}{text("amountTakenMl", "Amount Taken ml")}{select("intakeEstimate", "Intake Estimate", values, set, ["none", "small_amount", "half", "most", "all", "measured", "not_recorded"])}{select("assistance", "Assistance", values, set, ["independent", "prompting", "supervision", "partial_assistance", "full_assistance", "not_recorded"])}{check("swallowingConcernObserved", "Swallowing concern observed")}</div>;
  if (type === "mobility") return <div className="grid gap-3 sm:grid-cols-2">{select("mobilityActivity", "Mobility Activity", values, set, ["walked", "transferred", "stood", "wheelchair_mobility", "bed_mobility", "exercise", "other"])}{select("assistance", "Assistance", values, set, ["independent", "prompting", "supervision", "one_person_assistance", "two_person_assistance", "full_support", "not_recorded"])}{text("distanceOrDuration", "Distance / Duration")}{check("nearFallOrSafetyConcern", "Near fall or safety concern")}</div>;
  if (type === "comfort") return <div className="grid gap-3 sm:grid-cols-2">{select("comfortState", "Comfort State", values, set, ["comfortable", "mild_discomfort", "moderate_discomfort", "severe_discomfort", "unable_to_assess"])}{text("comfortMeasures", "Comfort Measures", "repositioned, reassurance")}{check("painAssessmentSuggested", "Pain assessment suggested")}</div>;
  if (type === "sleep") return <div className="grid gap-3 sm:grid-cols-2">{select("state", "Sleep State", values, set, ["settled", "asleep", "awake", "restless", "frequently_waking", "distressed", "not_observed"])}{text("estimatedSleepDurationMinutes", "Estimated Sleep Minutes")}{text("nightChecksCompleted", "Night Checks Completed")}</div>;
  if (type === "mood") return <div className="grid gap-3 sm:grid-cols-2">{select("observedMood", "Observed Mood", values, set, ["content", "calm", "happy", "low", "anxious", "tearful", "angry", "withdrawn", "variable", "unable_to_assess", "other"])}{text("residentReportedMood", "Resident Reported Mood")}{check("significantChangeFromUsual", "Significant change from usual")}</div>;
  if (type === "behaviour") return <div className="grid gap-3 sm:grid-cols-2">{text("behaviourObserved", "Behaviour Observed", "Comma separated")}{text("possibleTriggers", "Possible Triggers")}{check("riskToSelfOrOthers", "Risk to self or others")}{check("behaviourIncidentRequired", "Incident required")}</div>;
  if (type === "activity") return <div className="grid gap-3 sm:grid-cols-2">{select("activityType", "Activity Type", values, set, ["individual", "group", "social", "recreational", "religious_or_spiritual", "exercise", "outdoor", "sensory", "family_contact", "other"])}{text("activityName", "Activity Name")}{select("participation", "Participation", values, set, ["active", "partial", "observed", "declined", "unable_to_participate"])}{select("enjoyment", "Enjoyment", values, set, ["enjoyed", "neutral", "did_not_enjoy", "unable_to_assess", "not_recorded"])}</div>;
  if (type === "refusal") return <div className="grid gap-3 sm:grid-cols-2">{select("refusedCareType", "Refused Care Type", values, set, [...DAILY_CARE_TYPES, "observation", "assessment", "care_action", "medication", "other"])}{select("refusalReason", "Refusal Reason", values, set, ["resident_choice", "distress", "pain", "fatigue", "confusion", "did_not_want_staff_member", "preferred_later_time", "did_not_understand", "other", "not_provided"])}{text("refusalReasonText", "Reason Text")}{check("nurseInformed", "Nurse informed")}</div>;
  return <div className="grid gap-3 sm:grid-cols-2">{text("bodyAreasObserved", "Body Areas Observed", "heels, sacrum")}{text("skinState", "Skin State", "intact, redness")}{select("blanchingStatus", "Blanching Status", values, set, ["blanching", "non_blanching", "not_assessed", "not_applicable"])}{check("woundAssessmentRequired", "Wound assessment required")}</div>;
}

function makeDetails(type: DailyCareType, values: Record<string, string | boolean>): DailyCareDetails {
  const arr = (key: string) => split(String(values[key] ?? ""));
  const num = (key: string) => Number.isFinite(Number(values[key])) && String(values[key] ?? "").trim() !== "" ? Number(values[key]) : undefined;
  const str = (key: string, fallback = "") => String(values[key] ?? fallback);
  const bool = (key: string) => Boolean(values[key]);
  if (type === "personal_care") return { type, careProvided: arr("careProvided") as any || ["other"], privacyMaintained: bool("privacyMaintained"), skinConcernsObserved: bool("skinConcernsObserved") };
  if (type === "dressing") return { type, dressingState: str("dressingState", "day_clothes") as any, residentChoseClothing: bool("residentChoseClothing"), footwearRecorded: str("footwearRecorded") || undefined };
  if (type === "oral_care") return { type, oralCareProvided: arr("oralCareProvided") as any || ["other"], dentures: str("dentures", "not_recorded") as any, oralCondition: arr("oralCondition") as any, followUpSuggested: bool("followUpSuggested") };
  if (type === "toileting") return { type, toiletingMethod: str("toiletingMethod", "toilet") as any, outcome: str("outcome", "not_recorded") as any, prompted: bool("prompted"), discomfortObserved: bool("discomfortObserved") };
  if (type === "continence") return { type, continenceState: str("continenceState", "not_observed") as any, productUsed: str("productUsed") || undefined, skinCareProvided: bool("skinCareProvided"), leakageObserved: bool("leakageObserved") };
  if (type === "repositioning") return { type, fromPosition: str("fromPosition") || undefined, toPosition: str("toPosition", "position changed"), equipmentUsed: arr("equipmentUsed"), skinConcernObserved: bool("skinConcernObserved") };
  if (type === "food") return { type, mealType: str("mealType", "other") as any, intake: str("intake", "not_recorded") as any, assistance: str("assistance", "not_recorded") as any, swallowingConcernObserved: bool("swallowingConcernObserved") };
  if (type === "fluids") return { type, drinkType: str("drinkType") || undefined, amountOfferedMl: num("amountOfferedMl"), amountTakenMl: num("amountTakenMl"), intakeEstimate: str("intakeEstimate", "not_recorded") as any, assistance: str("assistance", "not_recorded") as any, swallowingConcernObserved: bool("swallowingConcernObserved") };
  if (type === "mobility") return { type, mobilityActivity: str("mobilityActivity", "other") as any, assistance: str("assistance", "not_recorded") as any, distanceOrDuration: str("distanceOrDuration") || undefined, nearFallOrSafetyConcern: bool("nearFallOrSafetyConcern") };
  if (type === "comfort") return { type, comfortState: str("comfortState", "unable_to_assess") as any, comfortMeasures: arr("comfortMeasures") as any || ["other"], painAssessmentSuggested: bool("painAssessmentSuggested") };
  if (type === "sleep") return { type, state: str("state", "not_observed") as any, estimatedSleepDurationMinutes: num("estimatedSleepDurationMinutes"), nightChecksCompleted: num("nightChecksCompleted") };
  if (type === "mood") return { type, observedMood: str("observedMood", "unable_to_assess") as any, residentReportedMood: str("residentReportedMood") || undefined, significantChangeFromUsual: bool("significantChangeFromUsual") };
  if (type === "behaviour") return { type, behaviourObserved: arr("behaviourObserved"), possibleTriggers: arr("possibleTriggers"), riskToSelfOrOthers: bool("riskToSelfOrOthers"), behaviourIncidentRequired: bool("behaviourIncidentRequired") };
  if (type === "activity") return { type, activityType: str("activityType", "other") as any, activityName: str("activityName", "Activity"), participation: str("participation", "observed") as any, enjoyment: str("enjoyment", "not_recorded") as any };
  if (type === "refusal") return { type, refusedCareType: str("refusedCareType", "other") as any, refusalReason: str("refusalReason", "not_provided") as any, refusalReasonText: str("refusalReasonText") || undefined, nurseInformed: bool("nurseInformed"), followUpRequired: false };
  return { type, bodyAreasObserved: arr("bodyAreasObserved"), skinState: arr("skinState") as any || ["intact"], blanchingStatus: str("blanchingStatus", "not_assessed") as any, woundAssessmentRequired: bool("woundAssessmentRequired") };
}

function select(key: string, label: string, values: Record<string, string | boolean>, set: (key: string, value: string | boolean) => void, options: string[]) {
  return <Field label={label}><Select value={String(values[key] ?? "")} onValueChange={(value) => set(key, value)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></Field>;
}
function split(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean); }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>; }
