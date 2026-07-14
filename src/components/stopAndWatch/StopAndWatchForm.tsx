import { useState } from "react";
import type { StopAndWatchConcernCode } from "@/domain/stopAndWatch/stopAndWatchTypes";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const OPTIONS: Array<{ code: StopAndWatchConcernCode; label: string }> = [
  { code: "seems_different", label: "Seems different than usual" },
  { code: "talks_or_communicates_less", label: "Talking or communicating less" },
  { code: "overall_needs_more_help", label: "Needs more help than usual" },
  { code: "pain_or_discomfort", label: "Pain or discomfort" },
  { code: "ate_or_drank_less", label: "Ate or drank less" },
  { code: "toilet_pattern_changed", label: "Toilet pattern changed" },
  { code: "breathing_changed", label: "Breathing changed" },
  { code: "skin_or_colour_changed", label: "Skin or colour changed" },
  { code: "sleep_or_drowsiness_changed", label: "Sleep or drowsiness changed" },
  { code: "walking_transfer_changed", label: "Walking or transfer changed" },
  { code: "confused_or_agitated", label: "Confused, agitated, or unsettled" },
  { code: "other", label: "Other concern" },
];

export function StopAndWatchForm({ onSubmit }: { onSubmit: (input: { concernCodes: StopAndWatchConcernCode[]; immediateSafetyConcern: boolean; conciseFreeText?: string }) => void }) {
  const [concernCodes, setConcernCodes] = useState<StopAndWatchConcernCode[]>([]);
  const [immediateSafetyConcern, setImmediateSafetyConcern] = useState(false);
  const [conciseFreeText, setConciseFreeText] = useState("");
  const toggle = (code: StopAndWatchConcernCode) => setConcernCodes((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <button key={option.code} type="button" onClick={() => toggle(option.code)} className={`rounded-md border p-3 text-left text-sm ${concernCodes.includes(option.code) ? "border-primary bg-primary/10" : "bg-background"}`}>
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="immediateSafetyConcern" checked={immediateSafetyConcern} onCheckedChange={(value) => setImmediateSafetyConcern(Boolean(value))} />
        <Label htmlFor="immediateSafetyConcern">Immediate safety concern</Label>
      </div>
      <Textarea value={conciseFreeText} onChange={(event) => setConciseFreeText(event.target.value)} placeholder="Concise note for the nurse" />
      <Button disabled={!concernCodes.length} onClick={() => onSubmit({ concernCodes, immediateSafetyConcern, conciseFreeText: conciseFreeText.trim() || undefined })}>Submit to Nurse</Button>
    </div>
  );
}
