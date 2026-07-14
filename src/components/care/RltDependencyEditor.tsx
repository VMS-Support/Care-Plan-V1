import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  RLT_DEPENDENCY_DEFINITIONS,
  RLT_DEPENDENCY_LABELS,
  RLT_DEPENDENCY_LEVELS,
  type RltDependencyLevel,
  type RltDependencyReasonCode,
} from "@/lib/care/rltDependency";
import type { RltDomain } from "@/lib/care/rlt";

const reasonOptions: Array<{ value: RltDependencyReasonCode; label: string }> = [
  { value: "initial_assessment", label: "Initial assessment" },
  { value: "routine_review", label: "Routine review" },
  { value: "condition_improved", label: "Condition improved" },
  { value: "condition_deteriorated", label: "Condition deteriorated" },
  { value: "post_hospital_return", label: "Post hospital return" },
  { value: "post_incident_review", label: "Post incident review" },
  { value: "assessment_result", label: "Assessment result" },
  { value: "care_plan_review", label: "Care Plan review" },
  { value: "resident_choice_or_preference", label: "Resident choice or preference" },
  { value: "correction", label: "Correction" },
  { value: "other", label: "Other" },
];

export interface RltDependencyEditorValue {
  level: RltDependencyLevel;
  rationale: string;
  reasonCode: RltDependencyReasonCode;
  reasonText?: string;
}

export function RltDependencyEditor({
  domain,
  currentLevel,
  lastReviewedAt,
  nextReviewDate,
  canEdit,
  onSave,
}: {
  domain: RltDomain;
  currentLevel: RltDependencyLevel | null;
  lastReviewedAt?: string;
  nextReviewDate?: string;
  canEdit: boolean;
  onSave: (value: RltDependencyEditorValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<RltDependencyLevel | "">(currentLevel || "");
  const [rationale, setRationale] = useState("");
  const [reasonCode, setReasonCode] = useState<RltDependencyReasonCode>(currentLevel ? "routine_review" : "initial_assessment");
  const [reasonText, setReasonText] = useState("");
  useEffect(() => {
    if (open) {
      setLevel(currentLevel || "");
      setRationale("");
      setReasonCode(currentLevel ? "routine_review" : "initial_assessment");
      setReasonText("");
    }
  }, [currentLevel, open]);
  const valid = Boolean(level && rationale.trim() && (reasonCode !== "other" || reasonText.trim()));
  return (
    <div className="rounded-md border bg-muted/20 p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">Dependency: {currentLevel ? RLT_DEPENDENCY_LABELS[currentLevel] : "Not yet recorded"}</div>
          <div className="text-xs text-muted-foreground">
            {lastReviewedAt ? `Last reviewed ${lastReviewedAt.slice(0, 10)}` : "Clinical assessment is required before a level is recorded."}
            {nextReviewDate ? ` · Next review ${nextReviewDate.slice(0, 10)}` : ""}
          </div>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline">{currentLevel ? "Review" : "Record"}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{domain.title} dependency</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1"><Label>Dependency level *</Label><Select value={level} onValueChange={(value) => setLevel(value as RltDependencyLevel)}><SelectTrigger><SelectValue placeholder="Select dependency level" /></SelectTrigger><SelectContent>{RLT_DEPENDENCY_LEVELS.map((option) => <SelectItem key={option} value={option}>{RLT_DEPENDENCY_LABELS[option]}</SelectItem>)}</SelectContent></Select>{level && <p className="text-xs text-muted-foreground">{RLT_DEPENDENCY_DEFINITIONS[level]}</p>}</div>
                <div className="space-y-1"><Label>Reason *</Label><Select value={reasonCode} onValueChange={(value) => setReasonCode(value as RltDependencyReasonCode)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{reasonOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
                {reasonCode === "other" && <div className="space-y-1"><Label>Other reason *</Label><Textarea value={reasonText} onChange={(event) => setReasonText(event.target.value)} /></div>}
                <div className="space-y-1"><Label>Clinical rationale *</Label><Textarea value={rationale} onChange={(event) => setRationale(event.target.value)} placeholder="Record the resident-specific support required, abilities, preferences and evidence considered." /></div>
                <p className="text-xs text-muted-foreground">Dependency is specific to this Activity of Living. It does not determine risk, capacity, staffing hours or whether a Care Plan is required.</p>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!valid} onClick={() => { if (!level) return; onSave({ level, rationale: rationale.trim(), reasonCode, reasonText: reasonText.trim() || undefined }); setOpen(false); }}>Save dependency</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
