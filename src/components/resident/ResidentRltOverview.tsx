import { useState } from "react";
import { AlertCircle, ArrowRight, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResidentRltOverviewDomain, ResidentRltOverviewViewModel } from "@/lib/care/residentRltOverview";

const reviewLabel: Record<string, string> = { not_required: "Not Required", no_review_date: "No Review Date", current: "Current", due_soon: "Due Soon", due_today: "Due Today", overdue: "Overdue", review_recommended: "Review Recommended" };
const carePlanLabel = (d: ResidentRltOverviewDomain) => d.review.status === "overdue" ? "Review Overdue" : d.review.status === "due_today" ? "Review Due Today" : d.carePlan.activeCount === 0 ? "No Active Nursing Care Plan" : `${d.carePlan.activeCount} Active Nursing Care Plan${d.carePlan.activeCount === 1 ? "" : "s"}`;
const tone: Record<string, string> = { critical: "border-destructive/40 bg-destructive/5 text-destructive", high: "border-orange-400/40 bg-orange-50 text-orange-800", medium: "border-amber-400/40 bg-amber-50 text-amber-800", low: "border-blue-300 bg-blue-50 text-blue-800", information: "border-muted bg-muted/30 text-muted-foreground" };

export function ResidentRltOverview({ model, onOpen }: { model: ResidentRltOverviewViewModel; onOpen: (route: string) => void }) {
  const [attentionFirst, setAttentionFirst] = useState(false);
  const rank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, information: 4 };
  const domains = attentionFirst ? [...model.domains].sort((a, b) => rank[a.attention.severity] - rank[b.attention.severity] || a.displayOrder - b.displayOrder) : model.domains;
  const summaries = [["Current Needs", model.summary.domainsWithCurrentNeed], ["Active Nursing Care Plans", model.summary.domainsWithActivePlan], ["High Risks", model.summary.domainsWithHighRisk], ["Reviews Due", model.summary.domainsWithReviewDue], ["Reviews Overdue", model.summary.domainsWithReviewOverdue], ["Needs Attention", model.summary.domainsRequiringAttention]] as const;
  return <Card aria-label="Resident RLT Overview">
    <CardHeader className="gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="flex items-center gap-2 text-base"><ListChecks className="h-4 w-4" />Resident RLT Overview</CardTitle><Button size="sm" variant={attentionFirst ? "secondary" : "outline"} onClick={() => setAttentionFirst((value) => !value)}>Needs Attention First</Button></CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">{summaries.map(([label, value]) => <div key={label} className="rounded-lg border p-2"><div className="text-[11px] leading-tight text-muted-foreground">{label}</div><div className="mt-1 text-xl font-semibold">{value}</div></div>)}</div>
      <div className="hidden grid-cols-[1.2fr_.9fr_1.2fr_1fr_1fr_.8fr_.8fr_auto] gap-3 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground lg:grid"><span>Activity of Living</span><span>Dependency</span><span>Current Need</span><span>Risk</span><span>Care Plan</span><span>Review</span><span>Attention</span><span>Open</span></div>
      <div className="space-y-2">{domains.map((domain) => <div key={domain.rltDomainId} className="rounded-lg border p-3">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_.9fr_1.2fr_1fr_1fr_.8fr_.8fr_auto] lg:items-center">
          <div className="font-medium">{domain.displayName}</div><div className="text-sm"><span className="lg:hidden text-muted-foreground">Dependency: </span>{domain.dependency.label}</div>
          <div className="text-sm"><span className="lg:hidden text-muted-foreground">Current need: </span>{domain.currentNeed.title || "No current need recorded"}{domain.currentNeed.additionalNeedCount ? ` +${domain.currentNeed.additionalNeedCount} additional needs` : ""}</div>
          <div className="text-sm"><span className="lg:hidden text-muted-foreground">Risk: </span>{domain.highestRelatedRisk ? `${domain.highestRelatedRisk.label}${domain.highestRelatedRisk.additionalRiskCount ? ` +${domain.highestRelatedRisk.additionalRiskCount} related risks` : ""}` : "No Active Related Risk"}</div>
          <div className="text-sm"><span className="lg:hidden text-muted-foreground">Care plan: </span>{carePlanLabel(domain)}</div><div className="text-sm"><span className="lg:hidden text-muted-foreground">Review: </span>{reviewLabel[domain.review.status]}</div>
          <div>{domain.attention.required ? <Badge variant="outline" className={tone[domain.attention.severity]}><AlertCircle className="mr-1 h-3 w-3" />{domain.attention.label || "Attention"}</Badge> : <span className="text-xs text-muted-foreground">No action flagged</span>}</div>
          <Button size="sm" variant="outline" onClick={() => onOpen(domain.primaryAction.route)}>{domain.primaryAction.label}<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-xs text-muted-foreground"><span>{domain.currentCareFocus?.headline || "No current care focus recorded."}</span>{domain.strengthsCount > 0 && <button className="underline-offset-2 hover:underline" onClick={() => onOpen(domain.route)}>{domain.strengthsCount} Strength{domain.strengthsCount === 1 ? "" : "s"}</button>}{domain.preferencesCount > 0 && <button className="underline-offset-2 hover:underline" onClick={() => onOpen(domain.route)}>{domain.preferencesCount} Preference{domain.preferencesCount === 1 ? "" : "s"}</button>}{domain.linkedWork.due > 0 && <span>{domain.linkedWork.overdue ? `${domain.linkedWork.overdue} overdue` : `${domain.linkedWork.due} items due`}</span>}</div>
      </div>)}</div>
    </CardContent>
  </Card>;
}
