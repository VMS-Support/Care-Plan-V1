import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  NotebookPen,
  HeartPulse,
  Stethoscope,
  CheckSquare,
  AlertTriangle,
  UserCheck,
  UsersRound,
  Plane,
} from "lucide-react";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";

type Action = {
  kind: "note" | "intervention" | "assessment" | "task" | "incident" | "mdt" | "visitor" | "outing";
  label: string;
  icon: any;
  perm: Parameters<typeof can>[1];
};

const ACTIONS: Action[] = [
  { kind: "note", label: "Daily Note", icon: NotebookPen, perm: "note.create" },
  { kind: "intervention", label: "Intervention", icon: HeartPulse, perm: "intervention.create" },
  { kind: "assessment", label: "Assessment", icon: Stethoscope, perm: "assessment.view" },
  { kind: "task", label: "Task", icon: CheckSquare, perm: "task.create" },
  { kind: "incident", label: "Incident", icon: AlertTriangle, perm: "incident.create" },
  { kind: "mdt", label: "MDT Meeting", icon: UserCheck, perm: "mdt.create" },
  { kind: "visitor", label: "Visitor Record", icon: UsersRound, perm: "visitor.create" },
  { kind: "outing", label: "Resident Outing", icon: Plane, perm: "outing.create" },
];

interface Props {
  residentId: string;
  onOpenModal: (kind: Action["kind"]) => void;
}

export function QuickActions({ residentId, onOpenModal }: Props) {
  const { currentRole } = useCare();
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
        <p className="text-xs text-muted-foreground">
          Resident auto-linked — no need to re-select.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ACTIONS.map((a) => {
            const allowed = can(currentRole, a.perm);
            return (
              <Button
                key={a.kind}
                variant="outline"
                disabled={!allowed}
                onClick={() => onOpenModal(a.kind)}
                className="h-auto flex flex-col items-center gap-1.5 rounded-lg p-3"
              >
                <a.icon className="h-5 w-5 text-primary" />
                <span className="text-center text-xs">{a.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
