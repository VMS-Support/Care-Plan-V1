import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCare } from "@/lib/care/store";
import { can } from "@/lib/care/permissions";
import { CreateCarePlanDialog } from "@/components/care/CreateCarePlanDialog";
import { CATEGORY_LABELS, RISK_COLORS } from "@/lib/care/problems";
import {
  getCarePlansGroupedByRltDomain,
  getRltDomainForCarePlanProblem,
  RLT_DOMAINS,
} from "@/lib/care/rlt";
import {
  CARE_PLAN_QUALITY_LABELS,
  CARE_PLAN_QUALITY_RANK,
  carePlanQualityClass,
  getCarePlanQualityStatus,
  type CarePlanQualityStatus,
} from "@/lib/care/quality";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { AlertTriangle, ClipboardCheck, FileWarning, Layers3, MoreHorizontal, Search, UserRound } from "lucide-react";
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
const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const RISK_RANK: Record<string, number> = {
  critical: 4,
  very_high: 4,
  high: 3,
  medium: 2,
  moderate: 2,
  low: 1,
};
const INACTIVE_STATUSES = ["completed", "archived", "superseded"];

type RegisterStatusFilter = "all" | "active" | "completed" | "archived";
type RegisterRiskFilter = "all" | "critical" | "high" | "medium" | "low";
type RegisterDueFilter = "all" | "review_due" | "evaluation_due" | "overdue";
type RegisterQualityFilter = "all" | CarePlanQualityStatus;

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

function riskLabel(risk?: string) {
  if (!risk) return "None";
  if (risk === "very_high" || risk === "critical") return "Critical";
  return risk.charAt(0).toUpperCase() + risk.slice(1).replace("_", " ");
}

function riskClass(risk?: string) {
  const key = risk === "critical" ? "very_high" : risk;
  return RISK_COLORS[key as keyof typeof RISK_COLORS] || "";
}

function earliestDate(dates: Array<string | undefined>) {
  return dates.filter(Boolean).sort()[0];
}

function latestDate(dates: Array<string | undefined>) {
  return dates.filter(Boolean).sort().at(-1);
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
      label: "Review of Outcome Overdue",
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
          Review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Care Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Plan outcome</Label>
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
            <Label>Review notes</Label>
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
              toast.success("Review recorded");
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

function ProblemEvaluateDialog({ problemId }: { problemId: string }) {
  const { addProblemEvaluation } = useCare();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [goalsMet, setGoalsMet] = useState<"yes" | "partial" | "no">("partial");
  const [progress, setProgress] = useState<
    "improved" | "stable" | "deteriorated" | "resolved" | "requires_revision"
  >("stable");
  const [nextEvaluationDate, setNextEvaluationDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Nursing Care Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Review summary</Label>
            <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plan met</Label>
              <Select value={goalsMet} onValueChange={(value) => setGoalsMet(value as typeof goalsMet)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Progress</Label>
              <Select value={progress} onValueChange={(value) => setProgress(value as typeof progress)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="improved">Improved</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="deteriorated">Deteriorated</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="requires_revision">Requires revision</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Next Review of Outcome</Label>
            <Textarea
              value={nextEvaluationDate}
              onChange={(event) => setNextEvaluationDate(event.target.value)}
              rows={1}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!summary.trim()}
            onClick={() => {
              addProblemEvaluation({
                problemId,
                summary,
                goalsMet,
                progress,
                recommendations: "",
                nextEvaluationDate,
              });
              toast.success("Review recorded");
              setSummary("");
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

function ProblemEvaluationDialog({
  problemId,
  open,
  onOpenChange,
}: {
  problemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addProblemEvaluation } = useCare();
  const [summary, setSummary] = useState("");
  const [goalsMet, setGoalsMet] = useState<"yes" | "partial" | "no">("partial");
  const [progress, setProgress] = useState<
    "improved" | "stable" | "deteriorated" | "resolved" | "requires_revision"
  >("stable");
  const [nextEvaluationDate, setNextEvaluationDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Care Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Review summary</Label>
            <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plan met</Label>
              <Select value={goalsMet} onValueChange={(value) => setGoalsMet(value as typeof goalsMet)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Progress</Label>
              <Select value={progress} onValueChange={(value) => setProgress(value as typeof progress)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="improved">Improved</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="deteriorated">Deteriorated</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="requires_revision">Requires revision</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Next Review of Outcome</Label>
            <Input
              type="date"
              value={nextEvaluationDate}
              onChange={(event) => setNextEvaluationDate(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!problemId || !summary.trim()}
            onClick={() => {
              if (!problemId) return;
              addProblemEvaluation({
                problemId,
                summary,
                goalsMet,
                progress,
                recommendations: "",
                nextEvaluationDate,
              });
              toast.success("Review recorded");
              setSummary("");
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CarePlansPage() {
  const {
    carePlans,
    residentCarePlans,
    carePlanProblems,
    problemInterventions,
    problemGoals,
    problemEvaluations,
    residents,
    carePlanEvaluations,
    carePlanReviews,
    currentRole,
    currentUser,
    currentUserName,
    auditLogs,
    archiveProblem,
  } = useCare();
  const navigate = useNavigate();
  const [tab, setTab] = useState<WorkflowTab>("active");
  const [filter, setFilter] = useState<QuickFilter>("all");
  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [wingFilter, setWingFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [nurseFilter, setNurseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<RegisterStatusFilter>("all");
  const [riskFilter, setRiskFilter] = useState<RegisterRiskFilter>("all");
  const [dueFilter, setDueFilter] = useState<RegisterDueFilter>("all");
  const [qualityFilter, setQualityFilter] = useState<RegisterQualityFilter>("all");
  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState(1);
  const [evaluatingProblemId, setEvaluatingProblemId] = useState<string | null>(null);
  const [selectorResidentId, setSelectorResidentId] = useState<string | null>(null);

  const governanceView = currentRole === "cnm" || currentRole === "don";
  const visibleTabs = governanceView
    ? (["active", "reviews", "evaluations", "completed", "archived", "governance"] as const)
    : (["active", "reviews", "evaluations"] as const);

  const rows = useMemo(() => {
    const legacyRows = carePlans
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
          isUnified: false,
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
      .filter((item): item is NonNullable<typeof item> => !!item);

    const unifiedRows = carePlanProblems
      .map((problem) => {
        const resident = residents.find((item) => item.id === problem.residentId);
        if (!resident) return null;

        const assignedStaff = problemInterventions
          .filter((intervention) => intervention.problemId === problem.id)
          .map((intervention) => intervention.assignedStaffName || intervention.assignedRole || "Care team")
          .filter(Boolean)
          .join(", ");
        const plan = {
          id: problem.id,
          residentId: problem.residentId,
          title: `${CATEGORY_LABELS[problem.category]} care plan`,
          problem: problem.problemStatement,
          status:
            problem.status === "resolved"
              ? "completed"
              : problem.status === "archived"
                ? "archived"
                : "active",
          reviewDate: problem.reviewDate,
          evaluationDate: problem.evaluationDate,
          updatedAt: undefined,
          createdAt: problem.createdAt,
          assignedStaff: assignedStaff || "Care team",
          priority: problem.riskLevel === "very_high" ? "critical" : problem.riskLevel,
        };
        const reviewDays = daysUntil(plan.reviewDate);
        const evaluationDays = daysUntil(plan.evaluationDate);
        const residentIsMine =
          resident.keyWorkers?.namedNurse === currentUserName ||
          resident.keyWorkers?.keyWorker === currentUserName ||
          plan.assignedStaff.includes(currentUserName) ||
          (currentUser.assignedWings.length > 0 &&
            !!resident.wingId &&
            currentUser.assignedWings.includes(resident.wingId));
        const isHighRisk = problem.riskLevel === "high" || problem.riskLevel === "very_high";
        const hasOverdue =
          (reviewDays !== null && reviewDays < 0) ||
          (evaluationDays !== null && evaluationDays < 0);
        const isReviewDue = reviewDays !== null && reviewDays <= DUE_SOON_DAYS;
        const isEvaluationDue = evaluationDays !== null && evaluationDays <= DUE_SOON_DAYS;

        return {
          plan,
          resident,
          isUnified: true,
          lastUpdated: problem.createdAt,
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
      .filter((item): item is NonNullable<typeof item> => !!item);

    return [...legacyRows, ...unifiedRows].sort((left, right) =>
      right.lastUpdated.localeCompare(left.lastUpdated),
    );
  }, [
    carePlanEvaluations,
    carePlanReviews,
    carePlanProblems,
    carePlans,
    currentUser.assignedWings,
    currentUserName,
    problemInterventions,
    residents,
  ]);

  const residentsWithoutActivePlan = useMemo(() => {
    const activeResidentIds = new Set(
      [
        ...carePlans
          .filter(
            (plan) =>
              plan.status !== "completed" &&
              plan.status !== "archived" &&
              plan.status !== "superseded",
          )
          .map((plan) => plan.residentId),
        ...residentCarePlans.filter((plan) => plan.status === "active").map((plan) => plan.residentId),
      ],
    );
    return residents.filter((resident) => !activeResidentIds.has(resident.id));
  }, [carePlans, residentCarePlans, residents]);

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

  const registerRows = useMemo(() => {
    const activeResidents = residents.filter((resident) => resident.status !== "deleted");
    return activeResidents
      .map((resident) => {
        const residentPlan = residentCarePlans
          .filter((plan) => plan.residentId === resident.id)
          .sort((left, right) =>
            (right.updatedAt || right.createdAt).localeCompare(left.updatedAt || left.createdAt),
          )[0];
        const problems = carePlanProblems.filter((problem) => problem.residentId === resident.id);
        if (!residentPlan && problems.length === 0) return null;

        const activeProblems = problems.filter((problem) => problem.status === "active");
        const visibleProblems = activeProblems.length > 0 ? activeProblems : problems;
        const highestRisk = visibleProblems
          .map((problem) => problem.riskLevel)
          .sort((left, right) => (RISK_RANK[right] || 0) - (RISK_RANK[left] || 0))[0];
        const nextReviewDate = earliestDate(activeProblems.map((problem) => problem.reviewDate));
        const nextEvaluationDate = earliestDate(activeProblems.map((problem) => problem.evaluationDate));
        const reviewDays = daysUntil(nextReviewDate);
        const evaluationDays = daysUntil(nextEvaluationDate);
        const hasOverdue =
          (reviewDays !== null && reviewDays < 0) ||
          (evaluationDays !== null && evaluationDays < 0);
        const isReviewDue = reviewDays !== null && reviewDays <= DUE_SOON_DAYS;
        const isEvaluationDue = evaluationDays !== null && evaluationDays <= DUE_SOON_DAYS;
        const status =
          residentPlan?.status === "archived" || problems.every((problem) => problem.status === "archived")
            ? "archived"
            : activeProblems.length > 0 || residentPlan?.status === "active"
              ? "active"
              : problems.length > 0 && problems.every((problem) => problem.status === "resolved")
                ? "completed"
                : "active";
        const residentIsMine =
          resident.keyWorkers?.namedNurse === currentUserName ||
          resident.keyWorkers?.keyWorker === currentUserName ||
          (currentUser.assignedWings.length > 0 &&
            !!resident.wingId &&
            currentUser.assignedWings.includes(resident.wingId));
        const primaryProblem =
          [...activeProblems].sort((left, right) => {
            const leftReview = daysUntil(left.reviewDate) ?? 9999;
            const rightReview = daysUntil(right.reviewDate) ?? 9999;
            return leftReview - rightReview || (RISK_RANK[right.riskLevel] || 0) - (RISK_RANK[left.riskLevel] || 0);
          })[0] || visibleProblems[0];
        const groupedActivities = getCarePlansGroupedByRltDomain(resident.id, activeProblems);
        const activeProblemQuality = activeProblems.map((problem) => ({
          problemId: problem.id,
          quality: getCarePlanQualityStatus({
            problem,
            goals: problemGoals.filter((goal) => goal.problemId === problem.id),
            interventions: problemInterventions.filter((intervention) => intervention.problemId === problem.id),
            evaluations: problemEvaluations.filter((evaluation) => evaluation.problemId === problem.id),
          }),
        }));
        const worstQuality =
          [...activeProblemQuality].sort(
            (left, right) =>
              CARE_PLAN_QUALITY_RANK[left.quality.status] - CARE_PLAN_QUALITY_RANK[right.quality.status],
          )[0]?.quality || null;
        const activeProblemItems = activeProblems
          .map((problem) => {
            const quality = activeProblemQuality.find((item) => item.problemId === problem.id)?.quality;
            return {
              id: problem.id,
              statement: problem.problemStatement,
              domain: getRltDomainForCarePlanProblem(problem),
              riskLevel: problem.riskLevel,
              reviewDate: problem.reviewDate,
              quality,
            };
          })
          .sort((left, right) => {
            const leftReview = daysUntil(left.reviewDate) ?? 9999;
            const rightReview = daysUntil(right.reviewDate) ?? 9999;
            return leftReview - rightReview || (RISK_RANK[right.riskLevel] || 0) - (RISK_RANK[left.riskLevel] || 0);
          });

        return {
          resident,
          status,
          rltDomain: getRltDomainForCarePlanProblem(primaryProblem),
          activeDomains: groupedActivities.map((group) => group.domain),
          highestRisk,
          nextReviewDate,
          nextEvaluationDate,
          lastUpdated: latestDate([
            residentPlan?.updatedAt,
            residentPlan?.createdAt,
            ...problems.map((problem) => problem.archivedAt || problem.resolvedAt || problem.createdAt),
          ]),
          reviewDays,
          evaluationDays,
          hasOverdue,
          isReviewDue,
          isEvaluationDue,
          isHighRisk: highestRisk === "high" || highestRisk === "very_high",
          qualityStatus: worstQuality?.status || "complete",
          qualityLabel: worstQuality?.label || CARE_PLAN_QUALITY_LABELS.complete,
          qualityIssues: worstQuality?.issues || [],
          residentIsMine,
          primaryProblemId: primaryProblem?.id,
          primaryCarePlanId: primaryProblem?.residentCarePlanId || residentPlan?.id,
          activeProblemIds: activeProblems.map((problem) => problem.id),
          activeProblemItems,
        };
      })
      .filter((item): item is NonNullable<typeof item> => !!item);
  }, [
    carePlanProblems,
    currentUser.assignedWings,
    currentUserName,
    problemEvaluations,
    problemGoals,
    residentCarePlans,
    residents,
  ]);

  const wingOptions = useMemo(
    () =>
      Array.from(new Set(registerRows.map((row) => row.resident.wingId).filter(Boolean))).sort(),
    [registerRows],
  );
  const nurseOptions = useMemo(
    () =>
      Array.from(
        new Set(
          registerRows
            .map((row) => row.resident.keyWorkers?.namedNurse)
            .filter((name): name is string => !!name),
        ),
      ).sort(),
    [registerRows],
  );

  const filteredRegisterRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return registerRows
      .filter((row) => {
        if (tab === "reviews") return row.status === "active" && row.isReviewDue;
        if (tab === "evaluations") return row.status === "active" && row.isEvaluationDue;
        if (tab === "completed") return row.status === "completed";
        if (tab === "archived") return row.status === "archived";
        return row.status === "active";
      })
      .filter((row) => {
        if (filter === "mine" && !row.residentIsMine) return false;
        if (filter === "high_risk" && !row.isHighRisk) return false;
        if (filter === "review_due" && !row.isReviewDue) return false;
        if (filter === "evaluation_due" && !row.isEvaluationDue) return false;
        if (filter === "overdue" && !row.hasOverdue) return false;
        if (filter === "completed" && row.status !== "completed") return false;
        if (query) {
          const haystack = `${row.resident.firstName} ${row.resident.lastName} ${row.resident.roomNumber}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        if (roomFilter.trim()) {
          const roomQuery = roomFilter.trim().toLowerCase();
          if (!String(row.resident.roomNumber || "").toLowerCase().includes(roomQuery)) return false;
        }
        if (wingFilter !== "all" && row.resident.wingId !== wingFilter) return false;
        if (
          activityFilter !== "all" &&
          !row.activeDomains.some((domain) => domain.id === activityFilter)
        ) {
          return false;
        }
        if (nurseFilter !== "all" && row.resident.keyWorkers?.namedNurse !== nurseFilter) return false;
        if (statusFilter !== "all" && row.status !== statusFilter) return false;
        if (riskFilter !== "all") {
          const normalizedRisk = row.highestRisk === "very_high" ? "critical" : row.highestRisk;
          if (normalizedRisk !== riskFilter) return false;
        }
        if (dueFilter === "review_due" && !row.isReviewDue) return false;
        if (dueFilter === "evaluation_due" && !row.isEvaluationDue) return false;
        if (dueFilter === "overdue" && !row.hasOverdue) return false;
        if (qualityFilter !== "all" && row.qualityStatus !== qualityFilter) return false;
        return true;
      })
      .sort((left, right) => {
        const qualityDelta =
          CARE_PLAN_QUALITY_RANK[left.qualityStatus] - CARE_PLAN_QUALITY_RANK[right.qualityStatus];
        if (qualityDelta !== 0) return qualityDelta;
        if (left.reviewDays !== right.reviewDays) {
          const leftOverdue = left.reviewDays !== null && left.reviewDays < 0;
          const rightOverdue = right.reviewDays !== null && right.reviewDays < 0;
          if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
        }
        if (left.evaluationDays !== right.evaluationDays) {
          const leftOverdue = left.evaluationDays !== null && left.evaluationDays < 0;
          const rightOverdue = right.evaluationDays !== null && right.evaluationDays < 0;
          if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
        }
        const riskDelta = (RISK_RANK[right.highestRisk || ""] || 0) - (RISK_RANK[left.highestRisk || ""] || 0);
        if (riskDelta !== 0) return riskDelta;
        if (left.isReviewDue !== right.isReviewDue) return left.isReviewDue ? -1 : 1;
        return (right.lastUpdated || "").localeCompare(left.lastUpdated || "");
      });
  }, [
    dueFilter,
    filter,
    activityFilter,
    nurseFilter,
    qualityFilter,
    registerRows,
    riskFilter,
    roomFilter,
    search,
    statusFilter,
    tab,
    wingFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRegisterRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRegisterRows = filteredRegisterRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selectorRow =
    filteredRegisterRows.find((row) => row.resident.id === selectorResidentId) ||
    registerRows.find((row) => row.resident.id === selectorResidentId) ||
    null;

  const openCarePlanForRow = (row: (typeof registerRows)[number]) => {
    if (row.activeProblemItems.length <= 1) {
      navigate({
        to: "/residents/$id",
        params: { id: row.resident.id },
        search: {
          carePlanId: row.primaryCarePlanId,
          carePlanProblemId: row.primaryProblemId,
        },
      });
      return;
    }
    setSelectorResidentId(row.resident.id);
  };

  const workQueueSummary = useMemo(() => {
    const active = registerRows.filter((row) => row.status === "active");
    return {
      active: active.length,
      reviewOverdue: active.filter((row) => row.qualityStatus === "review_overdue").length,
      incomplete: active.filter((row) => row.qualityStatus === "incomplete").length,
      needsAttention: active.filter((row) => row.qualityStatus === "needs_attention").length,
      complete: active.filter((row) => row.qualityStatus === "complete").length,
    };
  }, [registerRows]);

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
        {can(currentRole, "careplan.create") && (
          <CreateCarePlanDialog
            buttonLabel="New Nursing Care Plan"
            onCreated={(problem) =>
              navigate({
                to: "/residents/$id",
                params: { id: problem.residentId },
                search: { carePlanProblemId: problem.id },
              })
            }
          />
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <CarePlanSummaryCard
          label="Active Nursing Care Plans"
          value={workQueueSummary.active}
          onClick={() => {
            setTab("active");
            setFilter("all");
            setStatusFilter("all");
            setRiskFilter("all");
            setDueFilter("all");
            setQualityFilter("all");
            setRoomFilter("");
            setActivityFilter("all");
            setPage(1);
          }}
        />
        <CarePlanSummaryCard
          label="Review Overdue"
          value={workQueueSummary.reviewOverdue}
          tone="danger"
          onClick={() => {
            setTab("active");
            setFilter("all");
            setStatusFilter("all");
            setRiskFilter("all");
            setDueFilter("all");
            setQualityFilter("review_overdue");
            setRoomFilter("");
            setActivityFilter("all");
            setPage(1);
          }}
        />
        <CarePlanSummaryCard
          label="Incomplete"
          value={workQueueSummary.incomplete}
          tone="warn"
          onClick={() => {
            setTab("active");
            setFilter("all");
            setStatusFilter("all");
            setRiskFilter("all");
            setDueFilter("all");
            setQualityFilter("incomplete");
            setRoomFilter("");
            setActivityFilter("all");
            setPage(1);
          }}
        />
        <CarePlanSummaryCard
          label="Needs Attention"
          value={workQueueSummary.needsAttention}
          tone="warn"
          onClick={() => {
            setTab("active");
            setFilter("all");
            setStatusFilter("all");
            setRiskFilter("all");
            setDueFilter("all");
            setQualityFilter("needs_attention");
            setRoomFilter("");
            setActivityFilter("all");
            setPage(1);
          }}
        />
        <CarePlanSummaryCard
          label="Complete"
          value={workQueueSummary.complete}
          onClick={() => {
            setTab("active");
            setFilter("all");
            setStatusFilter("all");
            setRiskFilter("all");
            setDueFilter("all");
            setQualityFilter("complete");
            setRoomFilter("");
            setActivityFilter("all");
            setPage(1);
          }}
        />
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3 text-sm">
          <StatusLegend toneClass="bg-emerald-500" label="On Track" />
          <StatusLegend toneClass="bg-amber-500" label="Review Due Soon" />
          <StatusLegend toneClass="bg-destructive" label="Review Overdue" />
          <StatusLegend toneClass="bg-destructive" label="Review of Outcome Overdue" />
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
              {value === "active" && "Active Nursing Care Plans"}
              {value === "reviews" && "Reviews Due"}
              {value === "evaluations" && "Reviews of Outcome Due"}
              {value === "completed" && "Completed Nursing Care Plans"}
              {value === "archived" && "Archived Nursing Care Plans"}
              {value === "governance" && "Governance"}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="space-y-4">
          {tab !== "governance" && (
            <>
              <div className="flex flex-wrap gap-2">
                <QuickFilterButton
                  active={filter === "all"}
                  onClick={() => {
                    setFilter("all");
                    setQualityFilter("all");
                    setPage(1);
                  }}
                >
                  All Plans
                </QuickFilterButton>
                <QuickFilterButton
                  active={filter === "mine"}
                  onClick={() => {
                    setFilter("mine");
                    setQualityFilter("all");
                    setPage(1);
                  }}
                >
                  My Residents
                </QuickFilterButton>
                <QuickFilterButton
                  active={filter === "high_risk"}
                  onClick={() => {
                    setFilter("high_risk");
                    setQualityFilter("all");
                    setPage(1);
                  }}
                >
                  High Risk
                </QuickFilterButton>
                <QuickFilterButton
                  active={filter === "review_due"}
                  onClick={() => {
                    setFilter("review_due");
                    setQualityFilter("all");
                    setPage(1);
                  }}
                >
                  Review Due
                </QuickFilterButton>
                <QuickFilterButton
                  active={filter === "evaluation_due"}
                  onClick={() => {
                    setFilter("evaluation_due");
                    setQualityFilter("all");
                    setPage(1);
                  }}
                >
                  Review of Outcome Due
                </QuickFilterButton>
                <QuickFilterButton
                  active={filter === "overdue"}
                  onClick={() => {
                    setFilter("overdue");
                    setQualityFilter("all");
                    setPage(1);
                  }}
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
                <CardContent className="p-4 space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-10">
                    <div className="relative md:col-span-2">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(event) => {
                          setSearch(event.target.value);
                          setPage(1);
                        }}
                        placeholder="Search resident name or room"
                        className="pl-9"
                      />
                    </div>
                    <Input
                      value={roomFilter}
                      onChange={(event) => {
                        setRoomFilter(event.target.value);
                        setPage(1);
                      }}
                      placeholder="Room"
                    />
                    <Select value={wingFilter} onValueChange={(value) => { setWingFilter(value); setPage(1); }}>
                      <SelectTrigger><SelectValue placeholder="Wing" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All wings</SelectItem>
                        {wingOptions.map((wing) => (
                          <SelectItem key={wing} value={wing}>{wing}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={activityFilter} onValueChange={(value) => { setActivityFilter(value); setPage(1); }}>
                      <SelectTrigger><SelectValue placeholder="Activity" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All activities</SelectItem>
                        {RLT_DOMAINS.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id}>{domain.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={nurseFilter} onValueChange={(value) => { setNurseFilter(value); setPage(1); }}>
                      <SelectTrigger><SelectValue placeholder="Named nurse" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All nurses</SelectItem>
                        {nurseOptions.map((nurse) => (
                          <SelectItem key={nurse} value={nurse}>{nurse}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as RegisterStatusFilter); setPage(1); }}>
                      <SelectTrigger><SelectValue placeholder="Progress" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All progress</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={riskFilter} onValueChange={(value) => { setRiskFilter(value as RegisterRiskFilter); setPage(1); }}>
                      <SelectTrigger><SelectValue placeholder="Risk" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All risks</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={dueFilter} onValueChange={(value) => { setDueFilter(value as RegisterDueFilter); setPage(1); }}>
                      <SelectTrigger><SelectValue placeholder="Due" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All due dates</SelectItem>
                        <SelectItem value="review_due">Review due</SelectItem>
                        <SelectItem value="evaluation_due">Review of outcome due</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={qualityFilter} onValueChange={(value) => { setQualityFilter(value as RegisterQualityFilter); setPage(1); }}>
                      <SelectTrigger><SelectValue placeholder="Quality" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All quality</SelectItem>
                        <SelectItem value="review_overdue">Review overdue</SelectItem>
                        <SelectItem value="incomplete">Incomplete</SelectItem>
                        <SelectItem value="needs_attention">Needs attention</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setRoomFilter("");
                        setWingFilter("all");
                        setActivityFilter("all");
                        setNurseFilter("all");
                        setStatusFilter("all");
                        setRiskFilter("all");
                        setDueFilter("all");
                        setQualityFilter("all");
                        setFilter("all");
                        setPage(1);
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resident</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Activities of Living</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead>Quality</TableHead>
                        <TableHead>Review</TableHead>
                        <TableHead>Review of Outcome</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedRegisterRows.map((row) => (
                        <TableRow key={row.resident.id}>
                          <TableCell>
                            <div className="font-medium">
                              {row.resident.firstName} {row.resident.lastName}
                            </div>
                            {row.resident.keyWorkers?.namedNurse && (
                              <div className="text-xs text-muted-foreground">
                                {row.resident.keyWorkers.namedNurse}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>Room {row.resident.roomNumber}</TableCell>
                          <TableCell className="max-w-[260px]">
                            <div className="flex flex-wrap gap-1">
                              {row.activeDomains.slice(0, 3).map((domain) => (
                                <Badge key={domain.id} variant="secondary" className="text-[10px]">
                                  {domain.shortLabel}
                                </Badge>
                              ))}
                              {row.activeDomains.length > 3 && (
                                <Badge variant="outline" className="text-[10px]">
                                  +{row.activeDomains.length - 3}
                                </Badge>
                              )}
                              {row.activeDomains.length === 0 && (
                                <span className="text-xs text-muted-foreground">Mapped from legacy care plan</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={riskClass(row.highestRisk)}>
                              {riskLabel(row.highestRisk)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={carePlanQualityClass(row.qualityStatus)}
                              title={row.qualityIssues.join(", ")}
                            >
                              {row.qualityLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(row.nextReviewDate)}</TableCell>
                          <TableCell>{formatDate(row.nextEvaluationDate)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" onClick={() => openCarePlanForRow(row)}>
                                Open Care Plan
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost" aria-label="More actions">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link to="/residents/$id" params={{ id: row.resident.id }}>Open Resident</Link>
                                  </DropdownMenuItem>
                                  {can(currentRole, "careplan.evaluate") && row.primaryProblemId && (
                                    <DropdownMenuItem onClick={() => setEvaluatingProblemId(row.primaryProblemId)}>
                                      Review
                                    </DropdownMenuItem>
                                  )}
                                  {can(currentRole, "careplan.delete") && row.activeProblemIds.length > 0 && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        row.activeProblemIds.forEach((problemId) =>
                                          archiveProblem(problemId, "Set inactive from care plan register"),
                                        );
                                        toast.success("Care plan set inactive");
                                      }}
                                    >
                                      Set Inactive
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {pagedRegisterRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="py-10 text-center">
                            <div className="space-y-3">
                              <p className="text-sm text-muted-foreground">No care plans found.</p>
                              {can(currentRole, "careplan.create") && (
                                <CreateCarePlanDialog
                                  buttonLabel="Create Nursing Care Plan"
                                  onCreated={(problem) =>
                                    navigate({
                                      to: "/residents/$id",
                                      params: { id: problem.residentId },
                                      search: { carePlanProblemId: problem.id },
                                    })
                                  }
                                />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="space-y-2 md:hidden">
                {pagedRegisterRows.map((row) => (
                  <Card key={row.resident.id}>
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">
                            {row.resident.firstName} {row.resident.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">Room {row.resident.roomNumber}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {row.activeDomains.slice(0, 3).map((domain) => (
                              <Badge key={domain.id} variant="secondary" className="text-[10px]">
                                {domain.shortLabel}
                              </Badge>
                            ))}
                            {row.activeDomains.length > 3 && (
                              <Badge variant="outline" className="text-[10px]">
                                +{row.activeDomains.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className={riskClass(row.highestRisk)}>
                            {riskLabel(row.highestRisk)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={carePlanQualityClass(row.qualityStatus)}
                            title={row.qualityIssues.join(", ")}
                          >
                            {row.qualityLabel}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>Review {formatDate(row.nextReviewDate)}</div>
                        <div>Outcome review {formatDate(row.nextEvaluationDate)}</div>
                        <div className="capitalize">Progress {row.status}</div>
                        <div>Updated {formatDateTime(row.lastUpdated)}</div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Button size="sm" onClick={() => openCarePlanForRow(row)}>
                          Open Care Plan
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" aria-label="More actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to="/residents/$id" params={{ id: row.resident.id }}>Open Resident</Link>
                            </DropdownMenuItem>
                            {can(currentRole, "careplan.evaluate") && row.primaryProblemId && (
                              <DropdownMenuItem onClick={() => setEvaluatingProblemId(row.primaryProblemId)}>
                                Review
                              </DropdownMenuItem>
                            )}
                            {can(currentRole, "careplan.delete") && row.activeProblemIds.length > 0 && (
                              <DropdownMenuItem
                                onClick={() => {
                                  row.activeProblemIds.forEach((problemId) =>
                                    archiveProblem(problemId, "Set inactive from care plan register"),
                                  );
                                  toast.success("Care plan set inactive");
                                }}
                              >
                                Set Inactive
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pagedRegisterRows.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center space-y-3">
                      <p className="text-sm text-muted-foreground">No care plans found.</p>
                      {can(currentRole, "careplan.create") && (
                        <CreateCarePlanDialog
                          buttonLabel="Create Nursing Care Plan"
                          onCreated={(problem) =>
                            navigate({
                              to: "/residents/$id",
                              params: { id: problem.residentId },
                              search: { carePlanProblemId: problem.id },
                            })
                          }
                        />
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredRegisterRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1}-
                  {Math.min(safePage * pageSize, filteredRegisterRows.length)} of {filteredRegisterRows.length}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={String(size)}>{size} rows</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                    Previous
                  </Button>
                  <div className="text-sm tabular-nums">
                    {safePage} / {totalPages}
                  </div>
                  <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
                    Next
                  </Button>
                </div>
              </div>

              <ProblemEvaluationDialog
                problemId={evaluatingProblemId}
                open={!!evaluatingProblemId}
                onOpenChange={(open) => {
                  if (!open) setEvaluatingProblemId(null);
                }}
              />

              <Dialog
                open={!!selectorRow}
                onOpenChange={(open) => {
                  if (!open) setSelectorResidentId(null);
                }}
              >
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {selectorRow?.resident.firstName} {selectorRow?.resident.lastName} — Nursing Care Plans
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    {selectorRow?.activeProblemItems.map((problem) => (
                      <div
                        key={problem.id}
                        className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="font-medium">
                            {problem.domain?.title || "Nursing Care Plan"}
                          </div>
                          <div className="line-clamp-1 text-sm text-muted-foreground">
                            {problem.statement}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Review {formatDate(problem.reviewDate)}
                          </div>
                          {problem.quality && (
                            <Badge
                              variant="outline"
                              className={`mt-2 ${carePlanQualityClass(problem.quality.status)}`}
                              title={problem.quality.issues.join(", ")}
                            >
                              {problem.quality.label}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!selectorRow) return;
                            setSelectorResidentId(null);
                            navigate({
                              to: "/residents/$id",
                              params: { id: selectorRow.resident.id },
                              search: { carePlanProblemId: problem.id },
                            });
                          }}
                        >
                          Open
                        </Button>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

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
                  title="Overdue Reviews of Outcome"
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
                      title="Overdue Reviews of Outcome"
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
                      label="Reviews logged"
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

function CarePlanSummaryCard({
  label,
  value,
  tone = "default",
  onClick,
}: {
  label: string;
  value: number;
  tone?: "default" | "warn" | "danger";
  onClick?: () => void;
}) {
  const toneClass =
    tone === "danger"
      ? "text-destructive"
      : tone === "warn"
        ? "text-warning-foreground"
        : "";
  const content = (
    <CardContent className="p-4 text-left">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums mt-1 ${toneClass}`}>{value}</div>
    </CardContent>
  );
  return (
    <Card className={onClick ? "transition-colors hover:border-primary/50" : ""}>
      {onClick ? (
        <button type="button" className="block w-full" onClick={onClick}>
          {content}
        </button>
      ) : (
        content
      )}
    </Card>
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
