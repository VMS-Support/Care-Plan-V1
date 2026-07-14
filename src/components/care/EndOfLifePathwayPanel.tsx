import { useMemo, useState } from "react";
import { AlertTriangle, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCare } from "@/lib/care/store";
import { getEndOfLifeSummary } from "@/lib/care/endOfLifePathway";

const label = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function EndOfLifePathwayPanel({ residentId }: { residentId: string }) {
  const care = useCare();
  const [basis, setBasis] = useState("");
  const resident = care.residents.find((item) => item.id === residentId);
  const capabilities = care.getEffectivePermissions({ nursingHomeId: resident?.facilityId || care.activeFacilityId });
  const canCreate = capabilities.includes("end_of_life.create");
  const canActivate = capabilities.includes("end_of_life.activate");
  const canRecordDeath = capabilities.includes("end_of_life.record_death");
  const summary = useMemo(() => {
    try { return getEndOfLifeSummary(care.endOfLifeState, residentId, resident?.facilityId || care.activeFacilityId, capabilities); }
    catch { return undefined; }
  }, [care.endOfLifeState, residentId, resident?.facilityId, care.activeFacilityId, capabilities.join("|")]);
  if (!capabilities.includes("end_of_life.view")) return null;
  const pathway = summary?.pathway;

  const run = (action: () => void, success: string) => {
    try { action(); setBasis(""); toast.success(success); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update the pathway"); }
  };

  return (
    <Card className="border-rose-200 bg-rose-50/30">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><HeartHandshake className="h-4 w-4 text-rose-700" />Dying / End-of-Life Pathway {pathway && <Badge variant="outline">{label(pathway.status)}</Badge>}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {!pathway ? <>
          <p className="text-sm text-muted-foreground">No End-of-Life pathway is active. Creating one starts advance-care planning only; it does not infer prognosis, activate end-of-life care, record a DNAR decision, or mark the resident as deceased.</p>
          {canCreate && <div className="space-y-2"><Label>Reason for starting planning</Label><Input value={basis} onChange={(event) => setBasis(event.target.value)} placeholder="Document the resident-led or clinical planning reason" /><Button disabled={!basis.trim()} onClick={() => run(() => care.createResidentEndOfLifePathway(residentId, basis), "End-of-Life planning pathway created")}>Start planning pathway</Button></div>}
        </> : <>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div><p className="font-medium">Wishes and preferences</p><p className="text-muted-foreground">{summary?.currentWishes ? `Current version ${summary.currentWishes.versionNumber} recorded` : "No current wishes record available"}</p></div>
            <div><p className="font-medium">Advance-care decisions</p><p className="text-muted-foreground">{summary?.advanceDecisionIndicators.length ? summary.advanceDecisionIndicators.join("; ") : "No decision indicators available at your access level"}</p></div>
            <div><p className="font-medium">Comfort priorities</p><p className="text-muted-foreground">{summary?.comfortPriorities.length ? summary.comfortPriorities.map(label).join(", ") : "No comfort plan recorded"}</p></div>
            <div><p className="font-medium">Current symptoms</p><p className="text-muted-foreground">{summary?.activeSymptoms.length ? summary.activeSymptoms.map((item) => `${label(item.symptomType)}: ${item.severity}`).join("; ") : "No active symptoms recorded"}</p></div>
            <div><p className="font-medium">Family support</p><p className="text-muted-foreground">{summary?.familyCommunicationStatus}</p></div>
            <div><p className="font-medium">Spiritual and clinical support</p><p className="text-muted-foreground">{summary?.spiritualSupportSummary} {summary?.gpPalliativeSummary}</p></div>
          </div>
          {canActivate && !["resident_died", "after_death_care_complete"].includes(pathway.status) && <div className="space-y-2 border-t pt-3"><Label>Clinical basis for status change</Label><Input value={basis} onChange={(event) => setBasis(event.target.value)} placeholder="Required clinical basis; this action is audited" /><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!basis.trim()} onClick={() => run(() => care.activateResidentEndOfLifeCare(pathway.id, basis), "End-of-Life care activated")}>Activate End-of-Life care</Button><Button variant="outline" disabled={!basis.trim()} onClick={() => run(() => care.markResidentLastDaysOfLife(pathway.id, basis), "Last days of life recorded")}>Record last days of life</Button></div></div>}
          {canRecordDeath && !["resident_died", "after_death_care_complete"].includes(pathway.status) && <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3"><AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" /><div className="space-y-2"><p className="text-sm">Recording death changes the pathway status and cancels future scheduled bedside work as not applicable. It does not constitute authorised medical confirmation of death.</p><Button variant="destructive" size="sm" onClick={() => { if (window.confirm("Record that this resident's death was observed? This will cancel future scheduled bedside work.")) run(() => care.recordResidentDeathInPathway(pathway.id, care.currentUserName), "Resident death observation recorded"); }}>Record death observed</Button></div></div>}
        </>}
      </CardContent>
    </Card>
  );
}
