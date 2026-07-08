import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useCare } from "@/lib/care/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  ClipboardList,
  NotebookPen,
  HeartPulse,
  CheckSquare,
  ShieldAlert,
  UserCheck,
  FileCheck2,
  GitBranch,
  Plane,
  UsersRound,
  Target,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/residents/$id/timeline")({
  head: () => ({ meta: [{ title: "Resident Timeline â€” CarePath" }] }),
  component: ResidentTimeline,
});

type EventItem = {
  ts: string;
  icon: any;
  type: string;
  summary: string;
  user?: string;
  role?: string;
  tone?: "default" | "success" | "warn" | "critical";
};

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asTimestamp(value: unknown) {
  return typeof value === "string" && value.trim() ? value : new Date(0).toISOString();
}

function tone(t: EventItem["tone"]) {
  switch (t) {
    case "success":
      return "bg-success/10 text-success border-success/30";
    case "warn":
      return "bg-warning/15 text-warning-foreground border-warning/40";
    case "critical":
      return "bg-destructive/10 text-destructive border-destructive/30";
    default:
      return "bg-muted/50 text-foreground border-border";
  }
}

function ResidentTimeline() {
  const { id } = Route.useParams();
  const {
    residents,
    assessments,
    carePlans,
    carePlanEvaluations,
    carePlanReviews,
    interventions,
    interventionLogs,
    notes,
    tasks,
    mdtNotes,
    incidents,
    visitors,
    outings,
    timelineEvents,
  } = useCare();
  const r = residents.find((x) => x.id === id);

  const events = useMemo<EventItem[]>(() => {
    if (!r) return [];
    const list: EventItem[] = [];
    assessments
      .filter((a) => a.residentId === r.id)
      .forEach((a) => {
        list.push({
          ts: a.date,
          icon: Stethoscope,
          type: `${a.type.toUpperCase()} Assessment ${a.status === "completed" ? "Completed" : "Created"}`,
          summary: `${a.totalScore} â€” ${a.interpretation}`,
          user: a.assessor,
          role: a.assessorRole,
          tone:
            a.riskLevel === "very_high" ? "critical" : a.riskLevel === "high" ? "warn" : "default",
        });
      });
    carePlans
      .filter((c) => c.residentId === r.id)
      .forEach((c) => {
        list.push({
          ts: c.createdAt,
          icon: c.supersedesId ? GitBranch : ClipboardList,
          type: c.supersedesId ? `Care Plan Revised (v${c.version})` : "Care Plan Created",
          summary: `${c.title}${c.revisionReason ? " â€” " + c.revisionReason : ""}`,
          user: c.createdBy,
          tone: c.priority === "critical" ? "critical" : "default",
        });
        (c.goals || []).forEach((g) => {
          list.push({
            ts: c.createdAt,
            icon: Target,
            type: "Plan Added",
            summary: g.title,
            tone: "default",
          });
        });
      });
    carePlanEvaluations.forEach((e) => {
      const cp = carePlans.find((c) => c.id === e.carePlanId);
      if (cp?.residentId !== r.id) return;
      list.push({
        ts: e.date,
        icon: FileCheck2,
        type: "Evaluation Completed",
        summary: `${cp.title}: goals ${e.goalsMet} Â· ${e.outcomeRating}`,
        user: e.evaluatedBy,
        role: e.role,
        tone:
          e.outcomeRating === "deterioration"
            ? "critical"
            : e.outcomeRating === "excellent"
              ? "success"
              : "default",
      });
    });
    carePlanReviews.forEach((rv) => {
      const cp = carePlans.find((c) => c.id === rv.carePlanId);
      if (cp?.residentId !== r.id) return;
      list.push({
        ts: rv.date,
        icon: ClipboardList,
        type: "Review Completed",
        summary: `${cp.title}: ${rv.outcome.replace(/_/g, " ")}`,
        user: rv.reviewer,
        role: rv.role,
      });
    });
    interventions
      .filter((i) => i.residentId === r.id)
      .forEach((i) => {
        list.push({
          ts: i.date,
          icon: HeartPulse,
          type: "Intervention Recorded",
          summary: `${i.intervention} â€” ${i.outcome}`,
          user: i.staff,
        });
      });
    interventionLogs
      .filter((l) => l.residentId === r.id)
      .forEach((l) => {
        list.push({
          ts: l.date + "T" + l.time,
          icon: HeartPulse,
          type: `Intervention ${l.outcome.replace(/_/g, " ")}`,
          summary: l.comments || l.residentResponse || "Care action logged",
          user: l.staff,
          role: l.role,
          tone: l.outcome === "missed" || l.outcome === "escalated" ? "warn" : "success",
        });
      });
    notes
      .filter((n) => n.residentId === r.id)
      .forEach((n) => {
        list.push({
          ts: n.date,
          icon: NotebookPen,
          type: `Daily Note (${n.shift})`,
          summary: n.observation,
          user: n.staff,
        });
      });
    tasks
      .filter((t) => t.residentId === r.id && t.status === "completed")
      .forEach((t) => {
        list.push({
          ts: t.completedAt || t.dueDate,
          icon: CheckSquare,
          type: "Task Completed",
          summary: t.outcome ? `${t.title}: ${t.outcome}` : t.title,
          user: t.completedBy || t.assignedTo,
          tone: "success",
        });
      });
    mdtNotes
      .filter((m) => m.residentId === r.id)
      .forEach((m) => {
        list.push({
          ts: m.date,
          icon: UserCheck,
          type: `${m.meetingType || "MDT"} Meeting`,
          summary: (m.clinicalDecisions || m.recommendations || m.discussion).slice(0, 120),
          user: m.authoredBy,
          role: m.role,
        });
      });
    incidents
      .filter((i) => i.residentId === r.id)
      .forEach((i) => {
        list.push({
          ts: i.date,
          icon: ShieldAlert,
          type: `Incident (${i.type})`,
          summary: i.description,
          user: i.reportedBy,
          tone: i.severity === "critical" ? "critical" : i.severity === "high" ? "warn" : "default",
        });
      });
    visitors
      .filter((v) => v.residentId === r.id)
      .forEach((v) => {
        list.push({
          ts: v.date,
          icon: UsersRound,
          type: "Visitor",
          summary: `${v.visitorName} (${v.relationship})`,
          user: v.signedInBy,
        });
      });
    outings
      .filter((o) => o.residentId === r.id)
      .forEach((o) => {
        list.push({
          ts: o.date,
          icon: Plane,
          type: "Outing",
          summary: `${o.destination} Â· ${o.accompaniedBy}`,
          user: o.accompaniedBy,
        });
      });
    timelineEvents
      .filter((e) => e.residentId === r.id)
      .forEach((e) => {
        const eventType = asText(e.type);
        const icon = eventType.startsWith("intervention.")
          ? HeartPulse
          : eventType.startsWith("careplan.")
            ? ClipboardList
            : eventType.startsWith("assessment.")
              ? Stethoscope
              : eventType.startsWith("task.")
                ? CheckSquare
                : eventType.startsWith("mdt.")
                  ? UserCheck
                  : eventType.startsWith("incident.")
                    ? ShieldAlert
                    : eventType.startsWith("visitor.")
                      ? UsersRound
                      : eventType.startsWith("outing.")
                        ? Plane
                        : NotebookPen;

        list.push({
          ts: asTimestamp(e.createdAt),
          icon,
          type: asText(e.title, "Timeline Event"),
          summary: asText(e.description, eventType || "Timeline event"),
          user: asText(e.createdBy),
          role: e.role,
          tone:
            eventType === "intervention.created" || eventType === "intervention.logged"
              ? "success"
              : eventType === "incident.created"
                ? "warn"
                : "default",
        });
      });
    return list.sort((a, b) => asTimestamp(b.ts).localeCompare(asTimestamp(a.ts)));
  }, [
    r,
    assessments,
    carePlans,
    carePlanEvaluations,
    carePlanReviews,
    interventions,
    interventionLogs,
    notes,
    tasks,
    mdtNotes,
    incidents,
    visitors,
    outings,
    timelineEvents,
  ]);

  if (!r) return <div className="p-8">Resident not found.</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl space-y-5">
      <Link
        to="/residents/$id"
        params={{ id: r.id }}
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" /> Back to resident
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Resident Timeline</h1>
        <p className="text-sm text-muted-foreground">
          {r.firstName} {r.lastName} Â· Room {r.roomNumber} Â· {events.length} events
        </p>
      </div>

      <div className="relative space-y-2 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border">
        {events.map((e, i) => {
          const Icon = e.icon;
          return (
            <div key={i} className="flex gap-3 relative">
              <div
                className={`relative z-10 h-8 w-8 rounded-full border-2 flex items-center justify-center bg-background shrink-0 ${tone(e.tone)}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <Card className="flex-1">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{e.type}</div>
                      <p className="text-sm text-muted-foreground">
                        {asText(e.summary, "No summary available")}
                      </p>
                      {e.user && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {e.user}
                          {e.role ? ` Â· ${e.role}` : ""}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] tabular-nums">
                      {asTimestamp(e.ts).slice(0, 16).replace("T", " ")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
        {events.length === 0 && (
          <p className="text-sm text-muted-foreground">No clinical events recorded.</p>
        )}
      </div>
    </div>
  );
}

