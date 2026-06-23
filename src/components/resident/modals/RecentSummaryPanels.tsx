import { useCare } from "@/lib/care/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";

interface Props {
  residentId: string;
  onOpenModal: (
    kind: "note" | "intervention" | "task" | "incident" | "mdt" | "visitor" | "outing",
  ) => void;
}

const SUMMARY_CONFIGS = [
  {
    title: "Recent Daily Notes",
    kind: "note" as const,
    key: "notes",
    renderItem: (item: any) =>
      `${item.date} (${item.shift}) — ${item.observation.substring(0, 50)}...`,
  },
  {
    title: "Recent Interventions",
    kind: "intervention" as const,
    key: "interventions",
    renderItem: (item: any) => `${item.date} — ${item.intervention}`,
  },
  {
    title: "Recent Tasks",
    kind: "task" as const,
    key: "tasks",
    renderItem: (item: any) => `${item.title} — Due ${item.dueDate}`,
  },
  {
    title: "Recent Incidents",
    kind: "incident" as const,
    key: "incidents",
    renderItem: (item: any) => `${item.date} — ${item.type.replace("_", " ")} (${item.severity})`,
  },
  {
    title: "Recent MDT Notes",
    kind: "mdt" as const,
    key: "mdtNotes",
    renderItem: (item: any) => `${item.date} — ${item.authoredBy}`,
  },
  {
    title: "Recent Visitors",
    kind: "visitor" as const,
    key: "visitors",
    renderItem: (item: any) => `${item.visitorName} (${item.relationship}) — ${item.date}`,
  },
  {
    title: "Recent Outings",
    kind: "outing" as const,
    key: "outings",
    renderItem: (item: any) => `${item.destination} — ${item.date}`,
  },
];

export function RecentSummaryPanels({ residentId, onOpenModal }: Props) {
  const store = useCare();
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());

  const togglePanel = (title: string) => {
    const newExpanded = new Set(expandedPanels);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    setExpandedPanels(newExpanded);
  };

  return (
    <div className="space-y-2">
      {SUMMARY_CONFIGS.map((config) => {
        const allRecords = (store as any)[config.key] || [];
        const residentsRecords = allRecords.filter((item: any) => item.residentId === residentId);
        const recentRecords = residentsRecords
          .sort((a: any, b: any) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
          })
          .slice(0, 5);

        const isExpanded = expandedPanels.has(config.title);

        return (
          <Card key={config.title} className="overflow-hidden">
            <button
              onClick={() => togglePanel(config.title)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isExpanded ? "rotate-0" : "-rotate-90"
                  }`}
                />
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{config.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {residentsRecords.length}
                  </Badge>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenModal(config.kind);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </button>

            {isExpanded && (
              <CardContent className="p-0 border-t">
                <div className="divide-y">
                  {recentRecords.length > 0 ? (
                    recentRecords.map((item: any, idx: number) => (
                      <div key={item.id || idx} className="p-3 text-sm hover:bg-muted/30">
                        {config.renderItem(item)}
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground">No records yet.</div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
