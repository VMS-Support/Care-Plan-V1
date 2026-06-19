import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, Library, Plus, Trash2 } from "lucide-react";
import type { CarePlanTemplate } from "@/lib/care/types";
import { toast } from "sonner";

export const Route = createFileRoute("/care-plan-templates")({
  head: () => ({ meta: [{ title: "Care Plan Templates — CarePath" }] }),
  component: TemplatesLibrary,
});

function TemplatesLibrary() {
  const { carePlanTemplates, saveCarePlanTemplate, deleteCarePlanTemplate, currentRole } = useCare();
  const canEdit = can(currentRole, "settings.manage") || can(currentRole, "careplan.approve");
  const [search, setSearch] = useState("");

  const filtered = carePlanTemplates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Library className="h-6 w-6" /> Care Plan Template Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Built-in templates pre-loaded with problem statement, SMART goals, interventions, and outcome measures. {canEdit && "CNM and DON can create or revise templates."}</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search templates…" value={search} onChange={e => setSearch(e.target.value)} className="w-56" />
          {canEdit && <TemplateEditor onSave={saveCarePlanTemplate} />}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(t => (
          <Card key={t.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{t.title}</CardTitle>
                  <Badge variant="secondary" className="mt-1 text-[10px]">{t.category}</Badge>
                </div>
                {t.builtIn && <Badge variant="outline" className="text-[10px]">Built-in</Badge>}
              </div>
            </CardHeader>
            <CardContent className="flex-1 text-sm space-y-2">
              <p className="text-muted-foreground line-clamp-3">{t.problemStatement}</p>
              <div className="flex flex-wrap gap-1">
                {t.identifiedNeeds.slice(0, 4).map(n => <Badge key={n} variant="outline" className="text-[10px]">{n}</Badge>)}
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                <div>{t.smartGoals.length} goals</div>
                <div>{t.interventions.length} intervs</div>
                <div>{t.outcomeMeasures.length} outcomes</div>
              </div>
              <div className="text-xs text-muted-foreground">Review every {t.reviewFrequencyDays}d · Eval every {t.evaluationFrequencyDays}d</div>
              {canEdit && (
                <div className="flex gap-2 pt-2">
                  <TemplateEditor template={t} onSave={saveCarePlanTemplate} />
                  {!t.builtIn && (
                    <Button size="sm" variant="ghost" onClick={() => { deleteCarePlanTemplate(t.id); toast.success("Template removed"); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Templates are applied from the <Link to="/assessments" className="text-primary underline">Assessment Centre</Link> via "Suggest Care Plan", or from the <Link to="/care-plans" className="text-primary underline">Care Plans</Link> page when creating a new plan.
      </p>
    </div>
  );
}

function TemplateEditor({ template, onSave }: { template?: CarePlanTemplate; onSave: (t: CarePlanTemplate) => void }) {
  const [open, setOpen] = useState(false);
  const blank: CarePlanTemplate = {
    id: "tpl-custom-" + Date.now().toString(36),
    category: "Custom", title: "New Custom Template",
    problemStatement: "", identifiedNeeds: [],
    smartGoals: [], interventions: [], outcomeMeasures: [],
    reviewFrequencyDays: 14, evaluationFrequencyDays: 28, builtIn: false, editable: true,
  };
  const [t, setT] = useState<CarePlanTemplate>(template || blank);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setT(template || blank); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant={template ? "outline" : "default"}>
          {template ? <><Edit className="h-3.5 w-3.5 mr-1.5" /> Edit</> : <><Plus className="h-3.5 w-3.5 mr-1.5" /> New Template</>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{template ? "Edit Template" : "Create Template"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Title</Label><Input value={t.title} onChange={e => setT({ ...t, title: e.target.value })} /></div>
            <div><Label>Category</Label><Input value={t.category} onChange={e => setT({ ...t, category: e.target.value })} /></div>
          </div>
          <div><Label>Problem Statement</Label><Textarea value={t.problemStatement} onChange={e => setT({ ...t, problemStatement: e.target.value })} /></div>
          <div><Label>Identified Needs (comma-separated)</Label>
            <Input value={t.identifiedNeeds.join(", ")} onChange={e => setT({ ...t, identifiedNeeds: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Review frequency (days)</Label>
              <Input type="number" value={t.reviewFrequencyDays} onChange={e => setT({ ...t, reviewFrequencyDays: Number(e.target.value) })} />
            </div>
            <div><Label>Evaluation frequency (days)</Label>
              <Input type="number" value={t.evaluationFrequencyDays} onChange={e => setT({ ...t, evaluationFrequencyDays: Number(e.target.value) })} />
            </div>
          </div>
          <div className="rounded-md border p-3 text-xs text-muted-foreground">
            <strong>{t.smartGoals.length}</strong> SMART goals · <strong>{t.interventions.length}</strong> interventions · <strong>{t.outcomeMeasures.length}</strong> outcome measures.
            <br />Detailed SMART goal/intervention editing inherits from the existing template content. Use the care plan editor on each created plan to fine-tune.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => { onSave(t); toast.success("Template saved"); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
