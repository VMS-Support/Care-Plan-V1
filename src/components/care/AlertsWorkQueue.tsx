import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import type { AlertPriority, ClinicalAlert, Role } from "@/lib/care/types";
import { isActionableClinicalAlert, isActionRequiredAlert } from "@/lib/care/alerts";

type AlertCategory =
  | "all"
  | "clinical"
  | "safety"
  | "assessments"
  | "care_plans"
  | "incidents"
  | "medication";
type AlertState = "open" | "acknowledged" | "resolved" | "all";

type ActionAlert = {
  id: string;
  source: "alert" | "clinical" | "assessment" | "care_plan" | "incident";
  residentId: string;
  residentName: string;
  room: string;
  category: Exclude<AlertCategory, "all">;
  title: string;
  what: string;
  why: string;
  action: string;
  priority: AlertPriority;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  primary?: { label: string; to: string; params?: Record<string, string> };
};

const priorityRank: Record<AlertPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const categoryLabels: Record<AlertCategory, string> = {
  all: "All",
  clinical: "Clinical",
  safety: "Safety",
  assessments: "Assessments",
  care_plans: "Care Plans",
  incidents: "Incidents",
  medication: "Medication",
};

function priorityClass(priority: AlertPriority) {
  if (priority === "critical") return "border-destructive/40 bg-destructive/5";
  if (priority === "high") return "border-warning/40 bg-warning/5";
  if (priority === "medium") return "border-info/30 bg-info/5";
  return "border-border";
}

function clinicalPriority(alert: ClinicalAlert): AlertPriority {
  if (alert.severity === "critical") return "critical";
  if (alert.severity === "high") return "high";
  if (alert.type === "weight_loss" || alert.type === "high_news2") return "high";
  return alert.severity === "warning" ? "medium" : "low";
}

function roleScopeLabel(role: Role) {
  if (role === "don") return "Facility Alerts";
  if (role === "cnm") return "Wing Alerts";
  return "My Alerts";
}

function daysOverdue(date: string, today: string) {
  const due = new Date(`${date.slice(0, 10)}T00:00:00`).getTime();
  const current = new Date(`${today}T00:00:00`).getTime();
  return Math.max(0, Math.floor((current - due) / 86400000));
}

export function AlertsWorkQueue() {
  const {
    alerts,
    clinicalAlerts,
    assessments,
    incidents,
    residents,
    currentRole,
    currentUser,
    alertWorkflow,
    acknowledgeAlert,
    resolveAlert,
    acknowledgeActionAlert,
    acknowledgeClinicalAlert,
    dismissClinicalAlert,
  } = useCare();
  const [category, setCategory] = useState<AlertCategory>("all");
  const [state, setState] = useState<AlertState>("open");
  const [summaryFilter, setSummaryFilter] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const residentMap = useMemo(
    () => new Map(residents.map((resident) => [resident.id, resident])),
    [residents],
  );
  const scopedResidentIds = useMemo(() => {
    if (currentRole === "don" || currentUser.assignedWings.length === 0) {
      return new Set(residents.map((resident) => resident.id));
    }
    return new Set(
      residents
        .filter((resident) => currentUser.assignedWings.includes(resident.wingId || ""))
        .map((resident) => resident.id),
    );
  }, [currentRole, currentUser.assignedWings, residents]);

  const queue = useMemo<ActionAlert[]>(() => {
    const items: ActionAlert[] = [];
    const residentInfo = (residentId: string) => {
      const resident = residentMap.get(residentId);
      return {
        residentName: resident ? `${resident.firstName} ${resident.lastName}` : "Resident",
        room: resident?.roomNumber || "N/A",
      };
    };

    for (const alert of alerts) {
      if (!isActionRequiredAlert(alert)) continue;
      const medication = alert.title.toLowerCase().includes("medication");
      items.push({
        id: `alert-${alert.id}`,
        source: "alert",
        residentId: alert.residentId,
        ...residentInfo(alert.residentId),
        category: medication ? "medication" : "clinical",
        title: alert.title,
        what: alert.description,
        why: "This item has been raised for nursing follow-up.",
        action: "Review the resident record and document the action taken.",
        priority: alert.priority,
        createdAt: alert.createdAt,
        acknowledged: alert.acknowledged,
        acknowledgedBy: alert.acknowledgedBy,
        acknowledgedAt: alert.acknowledgedAt,
        resolved: !!alert.resolvedAt,
        primary: {
          label: "Open Resident",
          to: "/residents/$id",
          params: { id: alert.residentId },
        },
      });
    }

    for (const alert of clinicalAlerts) {
      if (!isActionableClinicalAlert(alert)) continue;
      items.push({
        id: `clinical-${alert.id}`,
        source: "clinical",
        residentId: alert.residentId,
        ...residentInfo(alert.residentId),
        category: alert.type === "missed_observation" ? "assessments" : "clinical",
        title: alert.title,
        what: alert.message,
        why: "Recent observations indicate a clinical change requiring review.",
        action: alert.recommendation,
        priority: clinicalPriority(alert),
        createdAt: alert.createdAt,
        acknowledged: alert.acknowledged,
        acknowledgedBy: alert.acknowledgedBy,
        acknowledgedAt: alert.acknowledgedAt,
        resolved: !!alert.dismissedAt,
        primary: {
          label: "Open Resident",
          to: "/residents/$id",
          params: { id: alert.residentId },
        },
      });
    }

    const latestAssessments = new Map<string, (typeof assessments)[number]>();
    for (const assessment of assessments) {
      if (assessment.status === "deleted" || assessment.status === "archived") continue;
      const key = `${assessment.residentId}:${assessment.type}`;
      const current = latestAssessments.get(key);
      if (!current || assessment.date > current.date) latestAssessments.set(key, assessment);
    }

    for (const assessment of latestAssessments.values()) {
      const due = assessment.nextReassessmentDate || assessment.dueDate;
      if (!due || due.slice(0, 10) >= today) continue;
      const overdueDays = daysOverdue(due, today);
      items.push({
        id: `assessment-${assessment.id}`,
        source: "assessment",
        residentId: assessment.residentId,
        ...residentInfo(assessment.residentId),
        category: "assessments",
        title: overdueDays >= 14 ? "Assessment Critically Overdue" : "Assessment Overdue",
        what: `${assessment.type.replace(/_/g, " ")} reassessment overdue by ${overdueDays} days.`,
        why: "Assessment decisions may no longer reflect the resident's current condition.",
        action: "Complete reassessment.",
        priority: overdueDays >= 14 ? "critical" : "high",
        createdAt: due,
        acknowledged: !!alertWorkflow[`assessment-${assessment.id}`],
        acknowledgedBy: alertWorkflow[`assessment-${assessment.id}`]?.acknowledgedBy,
        acknowledgedAt: alertWorkflow[`assessment-${assessment.id}`]?.acknowledgedAt,
        resolved: false,
        primary: {
          label: "Start Assessment",
          to: "/assessments/new/$residentId",
          params: { residentId: assessment.residentId },
        },
      });
    }

    for (const incident of incidents) {
      if ((incident.recordStatus || "active") !== "active" || incident.status === "closed") {
        continue;
      }
      const isFall = incident.type === "fall";
      items.push({
        id: `incident-${incident.id}`,
        source: "incident",
        residentId: incident.residentId,
        ...residentInfo(incident.residentId),
        category: isFall ? "safety" : "incidents",
        title: isFall ? "Resident Fall" : "Open Incident",
        what: `${incident.type.replace(/_/g, " ")} recorded on ${incident.date.slice(0, 16).replace("T", " ")}.`,
        why: "An incident remains open and requires follow-up.",
        action: isFall ? "Complete post-fall review." : "Complete incident follow-up.",
        priority:
          incident.severity === "critical"
            ? "critical"
            : incident.severity === "high"
              ? "high"
              : "medium",
        createdAt: incident.date,
        acknowledged: !!alertWorkflow[`incident-${incident.id}`],
        acknowledgedBy: alertWorkflow[`incident-${incident.id}`]?.acknowledgedBy,
        acknowledgedAt: alertWorkflow[`incident-${incident.id}`]?.acknowledgedAt,
        resolved: false,
        primary: { label: "Open Incident", to: "/incidents" },
      });
    }

    const activeIds = new Set(items.map((item) => item.id));
    for (const workflow of Object.values(alertWorkflow)) {
      if (activeIds.has(workflow.id) || !scopedResidentIds.has(workflow.residentId)) continue;
      items.push({
        id: workflow.id,
        source: workflow.id.startsWith("assessment-")
          ? "assessment"
          : workflow.id.startsWith("care-plan-")
            ? "care_plan"
            : "incident",
        residentId: workflow.residentId,
        ...residentInfo(workflow.residentId),
        category: workflow.category as Exclude<AlertCategory, "all">,
        title: workflow.title,
        what: workflow.what,
        why: workflow.why,
        action: workflow.action,
        priority: workflow.priority,
        createdAt: workflow.createdAt,
        acknowledged: true,
        acknowledgedBy: workflow.acknowledgedBy,
        acknowledgedAt: workflow.acknowledgedAt,
        resolved: true,
      });
    }

    return items
      .filter((item) => scopedResidentIds.has(item.residentId))
      .sort(
        (a, b) =>
          priorityRank[a.priority] - priorityRank[b.priority] ||
          b.createdAt.localeCompare(a.createdAt),
      );
  }, [
    alerts,
    alertWorkflow,
    assessments,
    clinicalAlerts,
    incidents,
    residentMap,
    scopedResidentIds,
    today,
  ]);

  const counts = {
    open: queue.filter((item) => !item.acknowledged && !item.resolved).length,
    critical: queue.filter((item) => item.priority === "critical" && !item.resolved).length,
    overdueAssessments: queue.filter(
      (item) => item.category === "assessments" && !item.resolved,
    ).length,
    openIncidents: queue.filter((item) => item.source === "incident" && !item.resolved).length,
    carePlanReviews: queue.filter(
      (item) => item.category === "care_plans" && !item.resolved,
    ).length,
  };

  const filtered = queue.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (state === "open" && (item.acknowledged || item.resolved)) return false;
    if (state === "acknowledged" && (!item.acknowledged || item.resolved)) return false;
    if (state === "resolved" && !item.resolved) return false;
    if (summaryFilter === "critical" && item.priority !== "critical") return false;
    if (summaryFilter === "assessments" && item.category !== "assessments") return false;
    if (summaryFilter === "incidents" && item.source !== "incident") return false;
    if (summaryFilter === "care_plans" && item.category !== "care_plans") return false;
    return true;
  });

  const acknowledge = (item: ActionAlert) => {
    if (item.source === "alert") acknowledgeAlert(item.id.replace("alert-", ""));
    else if (item.source === "clinical") acknowledgeClinicalAlert(item.id.replace("clinical-", ""));
    else {
      acknowledgeActionAlert({
        id: item.id,
        residentId: item.residentId,
        title: item.title,
        category: item.category,
        what: item.what,
        why: item.why,
        action: item.action,
        priority: item.priority,
        createdAt: item.createdAt,
      });
    }
  };

  const resolve = (item: ActionAlert) => {
    if (item.source === "alert") resolveAlert(item.id.replace("alert-", ""));
    if (item.source === "clinical") dismissClinicalAlert(item.id.replace("clinical-", ""));
  };

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {roleScopeLabel(currentRole)} - action-required items for your current scope.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/risks">View Risks</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <SummaryCard
          label="Open Alerts"
          value={counts.open}
          icon={AlertTriangle}
          onClick={() => {
            setState("open");
            setSummaryFilter(null);
          }}
        />
        <SummaryCard
          label="Critical Alerts"
          value={counts.critical}
          icon={ShieldAlert}
          onClick={() => {
            setState("all");
            setSummaryFilter("critical");
          }}
        />
        <SummaryCard
          label="Overdue Assessments"
          value={counts.overdueAssessments}
          icon={Stethoscope}
          onClick={() => {
            setState("all");
            setSummaryFilter("assessments");
          }}
        />
        <SummaryCard
          label="Open Incidents"
          value={counts.openIncidents}
          icon={FileWarning}
          onClick={() => {
            setState("all");
            setSummaryFilter("incidents");
          }}
        />
        <SummaryCard
          label="Care Plan Reviews Due"
          value={counts.carePlanReviews}
          icon={ClipboardCheck}
          onClick={() => {
            setState("all");
            setSummaryFilter("care_plans");
          }}
        />
      </div>

      <div className="space-y-3">
        <Tabs
          value={category}
          onValueChange={(value) => {
            setCategory(value as AlertCategory);
            setSummaryFilter(null);
          }}
        >
          <TabsList className="h-auto flex flex-wrap">
            {(Object.keys(categoryLabels) as AlertCategory[]).map((key) => (
              <TabsTrigger key={key} value={key}>
                {categoryLabels[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tabs value={state} onValueChange={(value) => setState(value as AlertState)}>
          <TabsList className="h-auto flex flex-wrap">
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-3">
        {filtered.map((item) => (
          <Card key={item.id} className={priorityClass(item.priority)}>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{categoryLabels[item.category]}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {item.priority}
                    </Badge>
                    {item.resolved && <Badge variant="secondary">Resolved</Badge>}
                    {!item.resolved && item.acknowledged && (
                      <Badge variant="secondary">Acknowledged</Badge>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{item.title}</h2>
                    <div className="text-sm text-muted-foreground">
                      Resident: {item.residentName} - Room {item.room}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <InfoBlock label="What happened?" value={item.what} />
                    <InfoBlock label="Why it matters" value={item.why} />
                    <InfoBlock label="Required Action" value={item.action} strong />
                  </div>
                  {(item.acknowledgedBy || item.acknowledgedAt) && (
                    <div className="text-xs text-muted-foreground">
                      Acknowledged by: {item.acknowledgedBy || "Staff"} - Acknowledged:{" "}
                      {item.acknowledgedAt
                        ? new Date(item.acknowledgedAt).toLocaleString()
                        : "Time not recorded"}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap lg:flex-col gap-2 lg:w-44">
                  {item.primary && (
                    <Button asChild size="sm">
                      <Link to={item.primary.to as any} params={item.primary.params as any}>
                        {item.primary.label}
                      </Link>
                    </Button>
                  )}
                  <Button asChild size="sm" variant="outline">
                    <Link to="/residents/$id" params={{ id: item.residentId }}>
                      Open Resident
                    </Link>
                  </Button>
                  {!item.acknowledged && !item.resolved && (
                    <Button size="sm" variant="outline" onClick={() => acknowledge(item)}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Acknowledge
                    </Button>
                  )}
                  {(item.source === "alert" || item.source === "clinical") &&
                    item.acknowledged &&
                    !item.resolved && (
                      <Button size="sm" variant="outline" onClick={() => resolve(item)}>
                        Resolve
                      </Button>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto text-success mb-3" />
              <p className="font-medium">No active alerts requiring action.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Risk awareness remains available on the Risks page and resident profiles.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  onClick,
}: {
  label: string;
  value: number;
  icon: typeof AlertTriangle;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card className="hover:bg-accent/40 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
              <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
            </div>
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function InfoBlock({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-md border bg-background/70 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={strong ? "font-medium mt-1" : "mt-1"}>{value}</div>
    </div>
  );
}
