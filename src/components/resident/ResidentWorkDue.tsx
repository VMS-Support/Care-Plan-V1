import { useRef } from "react";
import { AlertTriangle, ArrowRight, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResidentWorkDueItem, ResidentWorkDueSection as WorkSection, ResidentWorkDueViewModel } from "@/lib/care/residentWorkDue";

const emptyText: Record<WorkSection["key"], string> = { overdue: "No overdue work.", due_now: "Nothing is due now.", next_four_hours: "No work is due in the next four hours.", today: "No additional work is due today." };
const workTypeLabel: Record<string, string> = { care_action: "Care Action", observation: "Observation", assessment: "Assessment", care_plan_review: "Care Plan Review", appointment: "Appointment", documentation: "Documentation", handover: "Handover" };
const actionLabel: Record<string, string> = { care_action: "Complete Care Action", observation: "Record Observation", assessment: "Start Assessment", care_plan_review: "Review Nursing Care Plan", appointment: "Open Appointment", documentation: "Complete Documentation", handover: "Acknowledge Handover" };

function WorkItemCard({ item, onOpen }: { item: ResidentWorkDueItem; onOpen: (route: string) => void }) {
  return <div className="rounded-lg border bg-card p-3 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{item.title}</span>{item.priority !== "routine" && <Badge variant={item.priority === "critical" ? "destructive" : "outline"}>{item.priority}</Badge>}</div>
        <div className="text-sm text-muted-foreground">{item.dueDescription} · {workTypeLabel[item.workType] || item.workType.replace(/_/g, " ")}</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">{item.rltDomain && <span>{item.rltDomain.displayName}</span>}<span>{item.assignment.displayLabel}</span></div>
      </div>
      {item.allowedActions.open && <Button size="sm" onClick={() => onOpen(item.source.route)}>{actionLabel[item.workType] || "Open Details"}<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>}
    </div>
  </div>;
}

export function ResidentWorkDue({ model, onOpen }: { model: ResidentWorkDueViewModel; onOpen: (route: string) => void }) {
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const sections = [model.sections.overdue, model.sections.dueNow, model.sections.nextFourHours, model.sections.today];
  const visibleCount = sections.reduce((total, section) => total + section.count, 0);
  const focus = (key: string) => { const target = refs.current[key]; target?.scrollIntoView({ behavior: "smooth", block: "start" }); target?.focus({ preventScroll: true }); };
  return <Card aria-label="Resident Work Due">
    <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4" />Resident Work Due</CardTitle></CardHeader>
    <CardContent className="space-y-5">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{sections.map((section) => <button key={section.key} onClick={() => focus(section.key)} className={`rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${section.key === "overdue" && section.count ? "border-destructive/40 bg-destructive/5" : ""}`}><span className="block text-xs text-muted-foreground">{section.label}</span><span className={`text-2xl font-semibold ${section.key === "overdue" && section.count ? "text-destructive" : ""}`}>{section.count}</span></button>)}</div>
      {!visibleCount ? <p className="text-sm text-muted-foreground">No current work is due for this resident.</p> : sections.map((section) => <section key={section.key} ref={(node) => { refs.current[section.key] = node; }} tabIndex={-1} className="scroll-mt-4 space-y-2 outline-none">
        <h3 className="flex items-center gap-2 text-sm font-semibold">{section.key === "overdue" && section.count > 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}{section.label}<Badge variant="secondary">{section.count}</Badge></h3>
        {section.items.length ? <div className="space-y-2">{section.items.map((item) => <WorkItemCard key={item.workItemId} item={item} onOpen={onOpen} />)}</div> : <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">{emptyText[section.key]}</p>}
      </section>)}
    </CardContent>
  </Card>;
}
