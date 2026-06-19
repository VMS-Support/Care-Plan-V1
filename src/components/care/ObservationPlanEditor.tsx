import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, ClipboardList, Save } from "lucide-react";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { FREQUENCY_LABEL, OBS_TYPE_LABEL } from "@/lib/care/vitals";
import type { ObservationPlanItem, ObservationFrequency, VitalObservationType } from "@/lib/care/types";
import { toast } from "sonner";

const ALL_TYPES: VitalObservationType[] = ["temperature", "pulse", "respiratoryRate", "bloodPressure", "spo2", "bloodGlucose", "weight", "painScore", "news2", "fluidBalance"];
const FREQS: ObservationFrequency[] = ["4_hourly", "8_hourly", "12_hourly", "daily", "weekly", "monthly", "prn"];

export function ObservationPlanEditor({ residentId }: { residentId: string }) {
  const { observationPlans, setObservationPlan, currentRole } = useCare();
  const editable = can(currentRole, "vital.plan.edit");
  const plan = observationPlans.find(p => p.residentId === residentId);
  const [items, setItems] = useState<ObservationPlanItem[]>(plan?.items ?? []);

  useEffect(() => { setItems(plan?.items ?? []); }, [plan]);

  const update = (id: string, patch: Partial<ObservationPlanItem>) =>
    setItems(items.map(i => i.id === id ? { ...i, ...patch } : i));
  const remove = (id: string) => setItems(items.filter(i => i.id !== id));
  const add = () => setItems([...items, { id: `tmp-${Date.now()}`, type: "temperature", frequency: "daily", required: false }]);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Observation Risk Profile / Plan</CardTitle>
        {editable && (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={add}><Plus className="h-3 w-3 mr-1" /> Add</Button>
            <Button size="sm" onClick={() => { setObservationPlan(residentId, items); toast.success("Plan updated"); }}><Save className="h-3 w-3 mr-1" /> Save</Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0
          ? <p className="text-xs text-muted-foreground">No observations configured.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left p-2">Observation</th>
                    <th className="text-left p-2">Frequency</th>
                    <th className="text-left p-2">Required</th>
                    {editable && <th className="text-right p-2"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map(it => (
                    <tr key={it.id}>
                      <td className="p-2">
                        {editable
                          ? (
                            <Select value={it.type} onValueChange={(v: any) => update(it.id, { type: v })}>
                              <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ALL_TYPES.map(t => <SelectItem key={t} value={t}>{OBS_TYPE_LABEL[t]}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )
                          : OBS_TYPE_LABEL[it.type]}
                      </td>
                      <td className="p-2">
                        {editable
                          ? (
                            <Select value={it.frequency} onValueChange={(v: any) => update(it.id, { frequency: v })}>
                              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>{FREQS.map(f => <SelectItem key={f} value={f}>{FREQUENCY_LABEL[f]}</SelectItem>)}</SelectContent>
                            </Select>
                          )
                          : FREQUENCY_LABEL[it.frequency]}
                      </td>
                      <td className="p-2">
                        {editable
                          ? <Checkbox checked={it.required} onCheckedChange={v => update(it.id, { required: !!v })} />
                          : (it.required ? <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Required</Badge> : <span className="text-xs text-muted-foreground">Optional</span>)}
                      </td>
                      {editable && (
                        <td className="p-2 text-right">
                          <Button size="sm" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        {plan && <p className="text-[10px] text-muted-foreground mt-2">Updated {new Date(plan.updatedAt).toLocaleDateString()} by {plan.updatedByName}</p>}
      </CardContent>
    </Card>
  );
}
