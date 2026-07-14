import type { DeteriorationReviewQueue as DeteriorationReviewQueueModel } from "@/domain/deterioration/deteriorationQueueTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeteriorationQueueItem } from "./DeteriorationQueueItem";

export function DeteriorationReviewQueue({ queue, onOpenIssue }: { queue: DeteriorationReviewQueueModel; onOpenIssue?: (issueId: string) => void }) {
  if (!queue.items.length) {
    return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No unresolved deterioration concerns are currently assigned to the selected ward or wards.</CardContent></Card>;
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Summary label="Unresolved" value={queue.counts.total} />
        <Summary label="Critical" value={queue.counts.critical} />
        <Summary label="Unacknowledged" value={queue.counts.unacknowledged} />
        <Summary label="Overdue" value={queue.counts.overdueFollowUp} />
        <Summary label="Escalation" value={queue.counts.unresolvedEscalation} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Deterioration Review Queue</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {queue.items.map((item) => <DeteriorationQueueItem key={item.issueId} item={item} onOpen={onOpenIssue} />)}
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return <Card><CardContent className="p-3"><div className="text-2xl font-semibold tabular-nums">{value}</div><div className="text-xs text-muted-foreground">{label}</div></CardContent></Card>;
}
