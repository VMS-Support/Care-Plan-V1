import { useState } from "react";
import type { ClinicalTransferDecision } from "@/domain/escalation/clinicalEscalationTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ClinicalEscalationForm({ onSubmit }: { onSubmit: (input: { reasonForContact: string; adviceReceived?: string; decisionMade?: string; transferDecision: ClinicalTransferDecision; followUpRequired: boolean; followUpDueAt?: string; responsibleRoleOrTeam?: string }) => void }) {
  const [reasonForContact, setReasonForContact] = useState("");
  const [adviceReceived, setAdviceReceived] = useState("");
  const [decisionMade, setDecisionMade] = useState("");
  const [transferDecision, setTransferDecision] = useState<ClinicalTransferDecision>("not_considered");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDueAt, setFollowUpDueAt] = useState("");
  const [responsibleRoleOrTeam, setResponsibleRoleOrTeam] = useState("");
  return (
    <div className="space-y-3">
      <Field label="Reason for Contact"><Textarea value={reasonForContact} onChange={(event) => setReasonForContact(event.target.value)} /></Field>
      <Field label="Advice Received"><Textarea value={adviceReceived} onChange={(event) => setAdviceReceived(event.target.value)} /></Field>
      <Field label="Decision Made"><Textarea value={decisionMade} onChange={(event) => setDecisionMade(event.target.value)} /></Field>
      <Field label="Transfer Decision">
        <Select value={transferDecision} onValueChange={(value) => setTransferDecision(value as ClinicalTransferDecision)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="not_considered">Not considered</SelectItem>
            <SelectItem value="considered_not_required">Considered, not required</SelectItem>
            <SelectItem value="recommended">Recommended</SelectItem>
            <SelectItem value="arranged">Arranged</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="emergency_transfer">Emergency transfer</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={followUpRequired} onChange={(event) => setFollowUpRequired(event.target.checked)} /> Follow-up required</label>
      {followUpRequired && <div className="grid gap-3 sm:grid-cols-2"><Field label="Follow-up Due"><Input type="datetime-local" value={followUpDueAt} onChange={(event) => setFollowUpDueAt(event.target.value)} /></Field><Field label="Responsible Role / Team"><Input value={responsibleRoleOrTeam} onChange={(event) => setResponsibleRoleOrTeam(event.target.value)} /></Field></div>}
      <Button disabled={!reasonForContact.trim()} onClick={() => onSubmit({ reasonForContact: reasonForContact.trim(), adviceReceived: adviceReceived.trim() || undefined, decisionMade: decisionMade.trim() || undefined, transferDecision, followUpRequired, followUpDueAt: followUpDueAt || undefined, responsibleRoleOrTeam: responsibleRoleOrTeam.trim() || undefined })}>Save Escalation</Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
