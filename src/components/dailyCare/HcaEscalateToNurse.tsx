import { useMemo, useState } from "react";
import { AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { HcaEscalationReasonCode, SubmitHcaNurseEscalationCommand } from "@/domain/escalation";
import { HCA_ESCALATION_REASON_LABELS } from "@/domain/escalation";

const quickReasons: HcaEscalationReasonCode[] = [
  "resident_seems_different",
  "reduced_food_intake",
  "reduced_fluid_intake",
  "no_bowel_movement",
  "repeated_refusal",
  "increased_assistance",
  "sleep_change",
  "behaviour_change",
  "pain_or_discomfort",
  "skin_concern",
  "mobility_or_safety_concern",
  "breathing_concern",
  "immediate_safety_concern",
  "other",
];

export function HcaEscalateToNurseDialog({
  open,
  onOpenChange,
  resident,
  nursingHomeId,
  wardId,
  roomId,
  sourceDailyCareRecordIds = [],
  sourceTrendType,
  contextSummary,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resident: { id: string; name?: string; preferredName?: string; firstName?: string; lastName?: string };
  nursingHomeId: string;
  wardId?: string;
  roomId?: string;
  sourceDailyCareRecordIds?: string[];
  sourceTrendType?: SubmitHcaNurseEscalationCommand["sourceTrendType"];
  contextSummary?: string;
  onSubmit: (command: SubmitHcaNurseEscalationCommand) => void;
}) {
  const [reasonCode, setReasonCode] = useState<HcaEscalationReasonCode>(sourceTrendType ? trendToReason(sourceTrendType) : "resident_seems_different");
  const [immediateSafetyConcern, setImmediateSafetyConcern] = useState(false);
  const [shortNote, setShortNote] = useState("");
  const [conciseConcern, setConciseConcern] = useState(contextSummary || "");
  const displayName = resident.preferredName || resident.name || `${resident.firstName || ""} ${resident.lastName || ""}`.trim() || "Resident";
  const summary = useMemo(() => conciseConcern.trim() || HCA_ESCALATION_REASON_LABELS[reasonCode], [conciseConcern, reasonCode]);
  const submit = () => {
    onSubmit({
      residentId: resident.id,
      nursingHomeId,
      wardId,
      roomId,
      reasonCode,
      conciseConcern: summary,
      shortNote: shortNote.trim() || undefined,
      observedAt: new Date().toISOString(),
      immediateSafetyConcern: immediateSafetyConcern || reasonCode === "immediate_safety_concern",
      sourceDailyCareRecordIds,
      sourceTrendType,
      targetAssignment: "ward_nurse_queue",
      clientRequestId: `hca-escalation-${resident.id}-${Date.now()}`,
    });
    onOpenChange(false);
    setShortNote("");
    setConciseConcern("");
    setImmediateSafetyConcern(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Escalate to Nurse</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div><span className="text-muted-foreground">Resident:</span> <span className="font-medium">{displayName}</span></div>
            <div><span className="text-muted-foreground">Ward/Room:</span> {wardId || "Current ward"}{roomId ? ` / ${roomId}` : ""}</div>
          </div>
          <div className="space-y-2">
            <Label>Concern</Label>
            <Select value={reasonCode} onValueChange={(value) => setReasonCode(value as HcaEscalationReasonCode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{quickReasons.map((reason) => <SelectItem key={reason} value={reason}>{HCA_ESCALATION_REASON_LABELS[reason]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Context</Label>
            <Input value={conciseConcern} onChange={(event) => setConciseConcern(event.target.value)} placeholder={HCA_ESCALATION_REASON_LABELS[reasonCode]} maxLength={140} />
          </div>
          <label className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
            <input type="checkbox" checked={immediateSafetyConcern} onChange={(event) => setImmediateSafetyConcern(event.target.checked)} />
            <span className="inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Immediate Safety Concern</span>
          </label>
          {immediateSafetyConcern && <p className="text-xs text-muted-foreground">Submit this alert and contact the Nurse immediately according to local procedure.</p>}
          <div className="space-y-2">
            <Label>Add Short Note</Label>
            <Textarea value={shortNote} onChange={(event) => setShortNote(event.target.value.slice(0, 240))} placeholder="Optional brief context" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}><Send className="mr-2 h-4 w-4" /> Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function trendToReason(trend: NonNullable<SubmitHcaNurseEscalationCommand["sourceTrendType"]>): HcaEscalationReasonCode {
  if (trend === "altered_sleep") return "sleep_change";
  if (trend === "behavioural_change") return "behaviour_change";
  return trend;
}
