import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, CalendarClock, ClipboardList, ShieldAlert } from "lucide-react";
import type { ResidentRltClinicalOverview, RltClinicalOverviewDomain } from "@/lib/care/rltClinicalOverview";
import type { RltTimelineItem } from "@/lib/care/rltTimeline";
import type { RltDomainId } from "@/lib/care/rlt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const label = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());

const reviewLabel = (domain: RltClinicalOverviewDomain) =>
  domain.reviewStatus.state === "overdue"
    ? `Overdue ${domain.reviewStatus.daysOverdue}d`
    : domain.reviewStatus.state === "due_today"
      ? "Due Today"
      : domain.reviewStatus.state === "due_soon"
        ? `Due in ${domain.reviewStatus.daysUntilReview}d`
        : domain.reviewStatus.state === "review_recommended"
          ? "Clinical Review Recommended"
          : domain.reviewStatus.state === "current"
            ? "Review Current"
            : domain.reviewStatus.state === "no_review_date"
              ? "No Review Date"
              : "No Active Review Required";

const groupFor = (occurredAt: string) => {
  const now = new Date();
  const date = new Date(occurredAt);
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  if (date.toISOString().slice(0, 10) === today) return "Today";
  if (date.toISOString().slice(0, 10) === yesterday) return "Yesterday";
  if (now.getTime() - date.getTime() <= 7 * 86400000) return "Earlier This Week";
  return "Older";
};

export function RltClinicalWorkspace({
  overview,
  timelineItems,
  initialTimelineDomain,
  onOpenCarePlan,
  createCarePlanAction,
  domainSupplement,
}: {
  overview: ResidentRltClinicalOverview;
  timelineItems: RltTimelineItem[];
  initialTimelineDomain?: RltDomainId;
  onOpenCarePlan: (carePlanItemId: string) => void;
  createCarePlanAction?: (domain: RltClinicalOverviewDomain) => ReactNode;
  domainSupplement?: (domain: RltClinicalOverviewDomain) => ReactNode;
}) {
  const [domainFilter, setDomainFilter] = useState<RltDomainId | "all">(initialTimelineDomain || "all");
  const [importantOnly, setImportantOnly] = useState(true);
  const filteredTimeline = useMemo(
    () =>
      timelineItems.filter(
        (item) =>
          (domainFilter === "all" || item.rltDomains.some((tag) => tag.rltDomainId === domainFilter)) &&
          (!importantOnly || item.importance !== "routine"),
      ),
    [domainFilter, importantOnly, timelineItems],
  );
  const grouped = useMemo(
    () =>
      ["Today", "Yesterday", "Earlier This Week", "Older"]
        .map((group) => ({
          group,
          items: filteredTimeline.filter((item) => groupFor(item.occurredAt) === group),
        }))
        .filter((entry) => entry.items.length),
    [filteredTimeline],
  );
  const summary = overview.overallSummary;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">RLT Clinical Overview</h2>
        <p className="text-sm text-muted-foreground">
          A current view of the resident's needs, abilities, risks, Nursing Care Plans and reviews across all Activities of Living.
        </p>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Clinical Overview</TabsTrigger>
          <TabsTrigger value="timeline">RLT Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Current Needs" value={summary.domainsWithActiveNeeds} icon={<ClipboardList className="h-4 w-4" />} />
            <SummaryCard label="High/Critical Risks" value={summary.domainsWithHighRisk} icon={<ShieldAlert className="h-4 w-4" />} />
            <SummaryCard label="Reviews Due" value={summary.domainsWithReviewsDue} icon={<CalendarClock className="h-4 w-4" />} />
            <SummaryCard
              label="Reviews Overdue"
              value={summary.domainsWithOverdueReview}
              icon={<AlertTriangle className="h-4 w-4" />}
              tone={summary.domainsWithOverdueReview ? "danger" : undefined}
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">{summary.activeCarePlanCount} Active Nursing Care Plans</Badge>
            <Badge variant="outline">{summary.domainsWithoutActivePlan} Activities Without Active Plans</Badge>
            <Badge variant="outline">{summary.domainsRequiringClinicalReview} Clinical Reviews Required</Badge>
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            {overview.domains.map((domain) => (
              <DomainCard
                key={domain.rltDomainId}
                domain={domain}
                onOpenCarePlan={onOpenCarePlan}
                createCarePlanAction={createCarePlanAction}
                domainSupplement={domainSupplement}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="timeline" className="space-y-4">
          <div>
            <h3 className="font-medium">RLT Timeline</h3>
            <p className="text-sm text-muted-foreground">
              Important clinical events tagged to the affected Activities of Living. This does not replace source records or audit history.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={domainFilter} onValueChange={(value) => setDomainFilter(value as RltDomainId | "all")}>
              <SelectTrigger className="sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities of Living</SelectItem>
                {overview.domains.map((domain) => (
                  <SelectItem key={domain.rltDomainId} value={domain.rltDomainId}>
                    {domain.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={importantOnly}
                onChange={(event) => setImportantOnly(event.target.checked)}
              />
              Important events only
            </label>
          </div>
          {grouped.map((entry) => (
            <div key={entry.group} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{entry.group}</h4>
              {entry.items.map((item) => (
                <TimelineRow key={item.id} item={item} />
              ))}
            </div>
          ))}
          {!filteredTimeline.length && (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No important events have been recorded for the selected Activities of Living and date range.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

function SummaryCard({
  label: text,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "danger";
}) {
  return (
    <Card className={tone === "danger" ? "border-destructive/40" : undefined}>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{text}</div>
        </div>
        <div className={tone === "danger" ? "text-destructive" : "text-muted-foreground"}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function DomainCard({
  domain,
  onOpenCarePlan,
  createCarePlanAction,
  domainSupplement,
}: {
  domain: RltClinicalOverviewDomain;
  onOpenCarePlan: (id: string) => void;
  createCarePlanAction?: (domain: RltClinicalOverviewDomain) => ReactNode;
  domainSupplement?: (domain: RltClinicalOverviewDomain) => ReactNode;
}) {
  const topAlert = domain.alerts[0];
  const primaryPlan = domain.carePlanStatus.activePlans[0];
  const activePlans = domain.carePlanStatus.activePlans;

  return (
    <Card id={`rlt-domain-${domain.rltDomainId}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{domain.displayName}</CardTitle>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge variant="outline">Dependency: {domain.dependency.displayLabel}</Badge>
              <Badge variant="outline">{reviewLabel(domain)}</Badge>
            </div>
          </div>
          {topAlert && (
            <Badge variant={topAlert.severity === "critical" || topAlert.severity === "high" ? "destructive" : "secondary"}>
              {topAlert.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <div className="text-xs font-medium text-muted-foreground">Nursing Care Plan</div>
          {activePlans.length ? (
            <div className="mt-1 space-y-1">
              {activePlans.map((plan) => (
                <button
                  key={plan.carePlanItemId}
                  type="button"
                  onClick={() => onOpenCarePlan(plan.carePlanItemId)}
                  className="block text-left font-medium text-primary hover:underline"
                >
                  {plan.title}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-1 text-muted-foreground">No active nursing care plan</div>
          )}
        </div>
        {domain.recentChange && <Badge variant="secondary">{domain.recentChange.label}</Badge>}
        <div className="flex flex-wrap gap-2">
          {primaryPlan && (
            <Button size="sm" onClick={() => onOpenCarePlan(primaryPlan.carePlanItemId)}>
              {domain.reviewStatus.state === "overdue"
                ? "Prioritise Review"
                : ["due_today", "due_soon"].includes(domain.reviewStatus.state)
                  ? "Review Nursing Care Plan"
                  : domain.carePlanStatus.activeCount > 1
                    ? "View Active Nursing Care Plans"
                    : "Open Nursing Care Plan"}
            </Button>
          )}
          {createCarePlanAction?.(domain)}
        </div>
        {domainSupplement?.(domain)}
      </CardContent>
    </Card>
  );
}

function TimelineRow({ item }: { item: RltTimelineItem }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{new Date(item.occurredAt).toLocaleString()}</div>
          <div className="font-medium">{item.title}</div>
        </div>
        <div className="flex flex-wrap gap-1">
          {item.clinicalDirection && item.clinicalDirection !== "not_applicable" && (
            <Badge variant={item.clinicalDirection === "deteriorated" || item.clinicalDirection === "new_issue" ? "destructive" : "secondary"}>
              {label(item.clinicalDirection)}
            </Badge>
          )}
          {item.severity && <Badge variant="outline">{label(item.severity)}</Badge>}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {item.rltDomains.map((domain) => (
          <Badge key={domain.rltDomainId} variant="secondary">
            {domain.displayName}
          </Badge>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{item.actor?.displayName ? `Recorded by ${item.actor.displayName}` : label(item.source.sourceModule)}</span>
        {item.source.route && (
          <Button asChild size="sm" variant="ghost">
            <a href={item.source.route}>Open Record</a>
          </Button>
        )}
      </div>
    </div>
  );
}
