import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ClipboardCheck, FileWarning, Layers3, UserRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/care-plans")({
  head: () => ({ meta: [{ title: "Care Plans — CarePath" }] }),
  component: CarePlansPage,
});

type WorkflowTab = "active" | "reviews" | "evaluations" | "completed" | "archived" | "governance";
type QuickFilter =
  | "all"
  | "mine"
  | "high_risk"
  | "review_due"
  | "evaluation_due"
  | "overdue"
  | "completed";

const DUE_SOON_DAYS = 7;

function startOfToday() {
  return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`);
}

function daysUntil(date?: string) {
  if (!date) return null;
  const due = new Date(`${date}T00:00:00`);
  const diffMs = due.getTime() - startOfToday().getTime();
  return Math.floor(diffMs / 86400000);
}

function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusMeta(plan: { status: string; reviewDate: string; evaluationDate?: string }) {
  const reviewDays = daysUntil(plan.reviewDate);
  const evaluationDays = daysUntil(plan.evaluationDate);

  if (plan.status === "completed") {
    return {
      label: "Completed",
      tone: "bg-muted text-muted-foreground border-border",
      dot: "bg-muted-foreground",
    };
  }
  if (plan.status === "archived" || plan.status === "superseded") {
    return {
      label: plan.status === "superseded" ? "Superseded" : "Archived",
      tone: "bg-muted text-muted-foreground border-border",
      dot: "bg-muted-foreground",
    };
  }
  if (evaluationDays !== null && evaluationDays < 0) {
    return {
      label: "Evaluation Overdue",
      tone: "bg-destructive/10 text-destructive border-destructive/30",
      dot: "bg-destructive",
    };
  }
  if (reviewDays !== null && reviewDays < 0) {
    return {
      label: "Review Overdue",
      tone: "bg-destructive/10 text-destructive border-destructive/30",
      dot: "bg-destructive",
    };
  }
  if (
    (evaluationDays !== null && evaluationDays <= DUE_SOON_DAYS) ||
    (reviewDays !== null && reviewDays <= DUE_SOON_DAYS)
  ) {
    return {
      label: "Review Due Soon",
      tone: "bg-amber-500/10 text-amber-700 border-amber-300",
      dot: "bg-amber-500",
    };
  }
  return {
    label: "On Track",
    tone: "bg-emerald-500/10 text-emerald-700 border-emerald-300",
    dot: "bg-emerald-500",
  };
}

function EvaluateDialog({ carePlanId }: { carePlanId: string }) {
  const { addEvaluation, updateCarePlan } = useCare();
  const [open, setOpen] = useState(false);
  const [achieve, setAchieve] = useState<"achieved" | "partial" | "not_achieved">("partial");
  const [outcome, setOutcome] = useState<"continue" | "modify" | "close">("continue");
  const [notes, setNotes] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Evaluate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Evaluate Care Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Goal achievement</Label>
            <Select value={achieve} onValueChange={(value) => setAchieve(value as typeof achieve)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="achieved">Achieved</SelectItem>
                <SelectItem value="partial">Partially achieved</SelectItem>
                <SelectItem value="not_achieved">Not achieved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Outcome</Label>
            <Select value={outcome} onValueChange={(value) => setOutcome(value as typeof outcome)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="continue">Continue care plan</SelectItem>
                <SelectItem value="modify">Modify care plan</SelectItem>
                <SelectItem value="close">Close care plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Evaluation notes</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              addEvaluation({
                carePlanId,
                date: new Date().toISOString(),
                reviewer: "J. Roberts (RN)",
                goalAchievement: achieve,
                notes,
                outcome,
                nextReviewDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
              });
              if (outcome === "close") {
                updateCarePlan(carePlanId, { status: "completed" });
              }
              toast.success("Evaluation recorded");
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewPlanDialog() {
  const { residents, addCarePlan } = useCare();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    residentId: "",
    title: "",
    problem: "",
    goal: "",
    interventions: "",
    frequency: "Daily",
    assignedStaff: "Care team",
    reviewDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Care Plan</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Care Plan</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Resident</Label>
            <Select
              value={form.residentId}
              onValueChange={(value) => setForm({ ...form, residentId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose resident" />
              </SelectTrigger>
              <SelectContent>
                {residents.map((resident) => (
                  <SelectItem key={resident.id} value={resident.id}>
                    {resident.firstName} {resident.lastName} ({resident.roomNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label>Problem</Label>
            <Textarea
              value={form.problem}
              onChange={(event) => setForm({ ...form, problem: event.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label>Goal</Label>
            <Textarea
              value={form.goal}
              onChange={(event) => setForm({ ...form, goal: event.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label>Interventions (one per line)</Label>
            <Textarea
              rows={4}
              value={form.interventions}
              onChange={(event) => setForm({ ...form, interventions: event.target.value })}
            />
          </div>
          <div>
            <Label>Frequency</Label>
            <Input
              value={form.frequency}
              onChange={(event) => setForm({ ...form, frequency: event.target.value })}
            />
          </div>
          <div>
            <Label>Assigned staff</Label>
            <Input
              value={form.assignedStaff}
              onChange={(event) => setForm({ ...form, assignedStaff: event.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label>Review date</Label>
            <Input
              type="date"
              value={form.reviewDate}
              onChange={(event) => setForm({ ...form, reviewDate: event.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!form.residentId || !form.title) {
                toast.error("Resident and title required");
                return;
              }
              addCarePlan({
                ...form,
                interventions: form.interventions.split("\n").filter(Boolean),
                status: "active",
              });
              toast.success("Care plan created");
              setOpen(false);
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CarePlansPage() {
  const {
    carePlans,
    residents,
    carePlanEvaluations,
    carePlanReviews,
    currentRole,
    currentUser,
    currentUserName,
    auditLogs,
  } = useCare();
  const [tab, setTab] = useState<WorkflowTab>("active");
  const [filter, setFilter] = useState<QuickFilter>("all");

  const governanceView = currentRole === "cnm" || currentRole === "don";
  const visibleTabs = governanceView
    ? (["active", "reviews", "evaluations", "completed", "archived", "governance"] as const)
    : (["active", "reviews", "evaluations"] as const);

  const rows = useMemo(() => {
    return carePlans
      .map((plan) => {
        const resident = residents.find((item) => item.id === plan.residentId);
        if (!resident) return null;

        const lastReview = carePlanReviews
          .filter((review) => review.carePlanId === plan.id)
          .sort((left, right) => right.date.localeCompare(left.date))[0];
        const lastEvaluation = carePlanEvaluations
          .filter((evaluation) => evaluation.carePlanId === plan.id)
          .sort((left, right) => right.date.localeCompare(left.date))[0];
        const lastUpdated = [plan.updatedAt, lastEvaluation?.date, lastReview?.date, plan.createdAt]
          .filter(Boolean)
          .sort()
          .at(-1) as string;
        const reviewDays = daysUntil(plan.reviewDate);
        const evaluationDays = daysUntil(plan.evaluationDate);
        const residentIsMine =
          resident.keyWorkers?.namedNurse === currentUserName ||
          resident.keyWorkers?.keyWorker === currentUserName ||
          plan.assignedStaff.includes(currentUserName) ||
          (currentUser.assignedWings.length > 0 &&
            !!resident.wingId &&
            currentUser.assignedWings.includes(resident.wingId));
        const isHighRisk = plan.priority === "high" || plan.priority === "critical";
        const hasOverdue =
          (reviewDays !== null && reviewDays < 0) ||
          (evaluationDays !== null && evaluationDays < 0);
        const isReviewDue = reviewDays !== null && reviewDays <= DUE_SOON_DAYS;
        const isEvaluationDue = evaluationDays !== null && evaluationDays <= DUE_SOON_DAYS;

        return {
          plan,
          resident,
          lastUpdated,
          residentIsMine,
          isHighRisk,
          hasOverdue,
          isReviewDue,
          isEvaluationDue,
          reviewDays,
          evaluationDays,
          status: statusMeta(plan),
        };
      })
      .filter((item): item is NonNullable<typeof item> => !!item)
      .sort((left, right) => right.lastUpdated.localeCompare(left.lastUpdated));
  }, [
    carePlanEvaluations,
    carePlanReviews,
    carePlans,
    currentUser.assignedWings,
    currentUserName,
    residents,
  ]);

  const residentsWithoutActivePlan = useMemo(() => {
    const activeResidentIds = new Set(
      carePlans
        .filter(
          (plan) =>
            plan.status !== "completed" &&
            plan.status !== "archived" &&
            plan.status !== "superseded",
        )
        .map((plan) => plan.residentId),
    );
    return residents.filter((resident) => !activeResidentIds.has(resident.id));
  }, [carePlans, residents]);

  const filteredRows = useMemo(() => {
    const tabFiltered = rows.filter((row) => {
      switch (tab) {
        case "active":
          return !["completed", "archived", "superseded"].includes(row.plan.status);
        case "reviews":
          return (
            !["completed", "archived", "superseded"].includes(row.plan.status) && row.isReviewDue
          );
        case "evaluations":
          return (
            !["completed", "archived", "superseded"].includes(row.plan.status) &&
            row.isEvaluationDue
          );
        case "completed":
          return row.plan.status === "completed";
        case "archived":
          return row.plan.status === "archived" || row.plan.status === "superseded";
        case "governance":
          return true;
      }
    });

    return tabFiltered.filter((row) => {
      switch (filter) {
        case "all":
          return true;
        case "mine":
          return row.residentIsMine;
        case "high_risk":
          return row.isHighRisk;
        case "review_due":
          return row.isReviewDue;
        case "evaluation_due":
          return row.isEvaluationDue;
        case "overdue":
          return row.hasOverdue;
        case "completed":
          return row.plan.status === "completed";
      }
    });
  }, [filter, rows, tab]);

  const governance = useMemo(() => {
    const overdueReviews = rows.filter(
      (row) =>
        row.reviewDays !== null &&
        row.reviewDays < 0 &&
        row.plan.status !== "completed" &&
        row.plan.status !== "archived" &&
        row.plan.status !== "superseded",
    );
    const overdueEvaluations = rows.filter(
      (row) =>
        row.evaluationDays !== null &&
        row.evaluationDays < 0 &&
        row.plan.status !== "completed" &&
        row.plan.status !== "archived" &&
        row.plan.status !== "superseded",
    );
    const activeRows = rows.filter(
      (row) =>
        row.plan.status !== "completed" &&
        row.plan.status !== "archived" &&
        row.plan.status !== "superseded",
    );
    const compliant = activeRows.filter((row) => !row.hasOverdue).length;
    const compliance =
      activeRows.length === 0 ? 100 : Math.round((compliant / activeRows.length) * 100);

    const byWing = Object.values(
      rows.reduce<Record<string, { name: string; count: number }>>((acc, row) => {
        const name = row.resident.wingId || "Unassigned";
        acc[name] = acc[name] || { name, count: 0 };
        acc[name].count += 1;
        return acc;
      }, {}),
    ).sort((left, right) => right.count - left.count);

    const byNurse = Object.values(
      rows.reduce<Record<string, { name: string; count: number }>>((acc, row) => {
        const name = row.resident.keyWorkers?.namedNurse || row.plan.assignedStaff || "Unassigned";
        acc[name] = acc[name] || { name, count: 0 };
        acc[name].count += 1;
        return acc;
      }, {}),
    ).sort((left, right) => right.count - left.count);

    const carePlanAudit = auditLogs.filter((entry) => entry.entityType === "care_plan");

    return {
      overdueReviews,
      overdueEvaluations,
      missingCarePlans: residentsWithoutActivePlan,
      compliance,
      byWing,
      byNurse,
      auditStats: {
        total: carePlanAudit.length,
        archived: carePlanAudit.filter((entry) => entry.action.toLowerCase().includes("archiv"))
          .length,
        revised: carePlanAudit.filter((entry) => entry.action.toLowerCase().includes("revis"))
          .length,
        evaluations: carePlanEvaluations.length,
        reviews: carePlanReviews.length,
      },
    };
  }, [
    auditLogs,
    carePlanEvaluations.length,
    carePlanReviews.length,
    residentsWithoutActivePlan,
    rows,
  ]);

  return (
    <div className="p-4 md:p-8 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Care Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Faster access for frontline updates, with governance oversight preserved for CNMs and
            DONs.
          </p>
        </div>
        {can(currentRole, "careplan.create") && <NewPlanDialog />}
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3 text-sm">
          <StatusLegend toneClass="bg-emerald-500" label="On Track" />
          <StatusLegend toneClass="bg-amber-500" label="Review Due Soon" />
          <StatusLegend toneClass="bg-destructive" label="Review Overdue" />
          <StatusLegend toneClass="bg-destructive" label="Evaluation Overdue" />
        </CardContent>
      </Card>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as WorkflowTab)}
        className="space-y-4"
      >
        <TabsList className="flex-wrap h-auto">
          {visibleTabs.map((value) => (
            <TabsTrigger key={value} value={value}>
              {value === "active" &&
                `Active Care Plans (${rows.filter((row) => !["completed", "archived", "superseded"].includes(row.plan.status)).length})`}
              {value === "reviews" &&
                `Reviews Due (${rows.filter((row) => !["completed", "archived", "superseded"].includes(row.plan.status) && row.isReviewDue).length})`}
              {value === "evaluations" &&
                `Evaluations Due (${rows.filter((row) => !["completed", "archived", "superseded"].includes(row.plan.status) && row.isEvaluationDue).length})`}
              {value === "completed" &&
                `Completed Care Plans (${rows.filter((row) => row.plan.status === "completed").length})`}
              {value === "archived" &&
                `Archived Care Plans (${rows.filter((row) => row.plan.status === "archived" || row.plan.status === "superseded").length})`}
              {value === "governance" && "Governance"}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="space-y-4">
          {tab !== "governance" && (
            <>
              <div className="flex flex-wrap gap-2">
                <QuickFilterButton active={filter === "all"} onClick={() => setFilter("all")}>
                  All Plans
                </QuickFilterButton>
                <QuickFilterButton active={filter === "mine"} onClick={() => setFilter("mine")}>
                  My Residents
                </QuickFilterButton>
                <QuickFilterButton
                  active={filter === "high_risk"}
                  onClick={() => setFilter("high_risk")}
                >
                  High Risk
                </QuickFilterButton>
                <QuickFilterButton
                  active={filter === "review_due"}
                  onClick={() => setFilter("review_due")}
                >
                  Review Due
                </QuickFilterButton>
                <QuickFilterButton
                  active={filter === "evaluation_due"}
                  onClick={() => setFilter("evaluation_due")}
                >
                  Evaluation Due
                </QuickFilterButton>
                <QuickFilterButton
                  active={filter === "overdue"}
                  onClick={() => setFilter("overdue")}
                >
                  Overdue
                </QuickFilterButton>
                {governanceView && (
                  <QuickFilterButton
                    active={filter === "completed"}
                    onClick={() => setFilter("completed")}
                  >
                    Completed
                  </QuickFilterButton>
                )}
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resident</TableHead>
                        <TableHead>Care Plan Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Next Review Date</TableHead>
                        <TableHead>Next Evaluation Date</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRows.map((row) => (
                        <TableRow key={row.plan.id}>
                          <TableCell>
                            <div className="min-w-[180px]">
                              <div className="font-medium">
                                {row.resident.firstName} {row.resident.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Room {row.resident.roomNumber}
                                {row.resident.keyWorkers?.namedNurse
                                  ? ` · Named nurse ${row.resident.keyWorkers.namedNurse}`
                                  : ""}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="min-w-[220px]">
                              <Link
                                to="/care-plans/$id"
                                params={{ id: row.plan.id }}
                                className="font-medium hover:text-primary hover:underline"
                              >
                                {row.plan.title}
                              </Link>
                              <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {row.plan.problem}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-2 ${row.status.tone}`}>
                              <span className={`h-2 w-2 rounded-full ${row.status.dot}`} />
                              {row.status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(row.plan.reviewDate)}</TableCell>
                          <TableCell>{formatDate(row.plan.evaluationDate)}</TableCell>
                          <TableCell>{formatDateTime(row.lastUpdated)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Link to="/care-plans/$id" params={{ id: row.plan.id }}>
                                <Button size="sm">Open Care Plan</Button>
                              </Link>
                              <Link to="/residents/$id" params={{ id: row.resident.id }}>
                                <Button size="sm" variant="outline">
                                  Open Resident
                                </Button>
                              </Link>
                              {can(currentRole, "careplan.evaluate") &&
                                row.plan.status !== "completed" &&
                                row.plan.status !== "archived" &&
                                row.plan.status !== "superseded" && (
                                  <EvaluateDialog carePlanId={row.plan.id} />
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredRows.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="py-10 text-center text-muted-foreground"
                          >
                            No care plans match the current workflow view.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {tab === "governance" && governanceView && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  title="Overdue Reviews"
                  value={governance.overdueReviews.length}
                  icon={FileWarning}
                  tone="destructive"
                />
                <MetricCard
                  title="Overdue Evaluations"
                  value={governance.overdueEvaluations.length}
                  icon={AlertTriangle}
                  tone="destructive"
                />
                <MetricCard
                  title="Missing Care Plans"
                  value={governance.missingCarePlans.length}
                  icon={UserRound}
                  tone="warning"
                />
                <MetricCard
                  title="Compliance %"
                  value={`${governance.compliance}%`}
                  icon={ClipboardCheck}
                  tone="success"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Action Required</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <GovernanceList
                      title="Overdue Reviews"
                      items={governance.overdueReviews.map((row) => ({
                        id: row.plan.id,
                        primary: row.plan.title,
                        secondary: `${row.resident.firstName} ${row.resident.lastName} · due ${formatDate(row.plan.reviewDate)}`,
                      }))}
                    />
                    <GovernanceList
                      title="Overdue Evaluations"
                      items={governance.overdueEvaluations.map((row) => ({
                        id: row.plan.id,
                        primary: row.plan.title,
                        secondary: `${row.resident.firstName} ${row.resident.lastName} · due ${formatDate(row.plan.evaluationDate)}`,
                      }))}
                    />
                    <GovernanceResidentList
                      title="Missing Care Plans"
                      residents={governance.missingCarePlans}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Audit Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm">
                    <AuditStat
                      label="Care plan audit entries"
                      value={governance.auditStats.total}
                    />
                    <AuditStat label="Archived plans" value={governance.auditStats.archived} />
                    <AuditStat label="Revisions" value={governance.auditStats.revised} />
                    <AuditStat
                      label="Evaluations logged"
                      value={governance.auditStats.evaluations}
                    />
                    <AuditStat label="Reviews logged" value={governance.auditStats.reviews} />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <DistributionCard title="Care Plans by Wing" rows={governance.byWing} />
                <DistributionCard title="Care Plans by Nurse" rows={governance.byNurse} />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuickFilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button size="sm" variant={active ? "default" : "outline"} onClick={onClick}>
      {children}
    </Button>
  );
}

function StatusLegend({ toneClass, label }: { toneClass: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${toneClass}`} />
      <span>{label}</span>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number | string;
  icon: typeof Layers3;
  tone: "success" | "warning" | "destructive";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700 bg-emerald-500/10"
      : tone === "warning"
        ? "text-amber-700 bg-amber-500/10"
        : "text-destructive bg-destructive/10";

  return (
    <Card>
      <CardContent className="p-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
          <div className="text-3xl font-semibold mt-2">{value}</div>
        </div>
        <div className={`rounded-full p-2 ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function GovernanceList({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; primary: string; secondary: string }>;
}) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">
        {title} ({items.length})
      </div>
      <div className="space-y-2">
        {items.slice(0, 6).map((item) => (
          <Link
            key={item.id}
            to="/care-plans/$id"
            params={{ id: item.id }}
            className="block rounded-md border p-3 hover:bg-muted/50"
          >
            <div className="font-medium text-sm">{item.primary}</div>
            <div className="text-xs text-muted-foreground mt-1">{item.secondary}</div>
          </Link>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">None.</p>}
      </div>
    </div>
  );
}

function GovernanceResidentList({
  title,
  residents,
}: {
  title: string;
  residents: Array<{
    id: string;
    firstName: string;
    lastName: string;
    roomNumber: string;
    primaryDiagnosis: string;
  }>;
}) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">
        {title} ({residents.length})
      </div>
      <div className="space-y-2">
        {residents.slice(0, 6).map((resident) => (
          <Link
            key={resident.id}
            to="/residents/$id"
            params={{ id: resident.id }}
            className="block rounded-md border p-3 hover:bg-muted/50"
          >
            <div className="font-medium text-sm">
              {resident.firstName} {resident.lastName}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Room {resident.roomNumber} · {resident.primaryDiagnosis}
            </div>
          </Link>
        ))}
        {residents.length === 0 && (
          <p className="text-sm text-muted-foreground">All residents have an active care plan.</p>
        )}
      </div>
    </div>
  );
}

function AuditStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function DistributionCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ name: string; count: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.name}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span>{row.name}</span>
            <Badge variant="outline">{row.count}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
