import { AlertTriangle, Clock } from "lucide-react";
import type { DeteriorationQueueItem as DeteriorationQueueItemModel } from "@/domain/deterioration/deteriorationQueueTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DeteriorationQueueItem({ item, onOpen }: { item: DeteriorationQueueItemModel; onOpen?: (issueId: string) => void }) {
  return (
    <Card>
      <CardContent className="p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={item.severity === "critical" ? "destructive" : item.urgent ? "secondary" : "outline"}>{item.severity}</Badge>
            <span className="font-medium">{item.title}</span>
            {item.unacknowledged && <Badge variant="outline">Unacknowledged</Badge>}
            {item.overdueFollowUp && <Badge variant="destructive" className="gap-1"><Clock className="h-3 w-3" /> Overdue</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{item.conciseSummary}</p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{item.issueType.replaceAll("_", " ")}</span>
            {item.nextRequiredAction && <span>Next: {item.nextRequiredAction}</span>}
            {item.escalationOpen && <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Escalation open</span>}
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => onOpen?.(item.issueId)}>Open</Button>
      </CardContent>
    </Card>
  );
}
