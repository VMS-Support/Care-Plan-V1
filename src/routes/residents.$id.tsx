import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCare, age } from "@/lib/care/store";
import { isActionRequiredAlert } from "@/lib/care/alerts";
import { can } from "@/lib/care/permissions";
import { assessmentMeta } from "@/lib/care/scoring";
import {
  getCarePlansGroupedByRltDomain,
  getRltDomainForCarePlanProblem,
  RLT_DOMAINS,
  RLT_DOMAIN_TO_DEFAULT_CATEGORY,
  type RltDomainId,
} from "@/lib/care/rlt";
import { getApprovedRltDomainsForAssessmentRecord } from "@/lib/care/assessmentRltMappings";
import {
  carePlanQualityClass,
  getCarePlanQualityStatus,
  getResidentRltCoverageChecks,
} from "@/lib/care/quality";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Calendar,
  MoreVertical,
  Phone,
  User2,
  Pill,
  AlertTriangle,
  Plus,
  Bed,
  UserCog,
  Activity,
  ClipboardList,
  Trash2,
  Archive,
  Ban,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClinicalSnapshot } from "@/components/care/ClinicalSnapshot";
import { LatestVitalsCard } from "@/components/care/LatestVitalsCard";
import { RecordObservationFlow } from "@/components/care/RecordObservationFlow";
import { CreateCarePlanDialog } from "@/components/care/CreateCarePlanDialog";
import { RltDependencyEditor } from "@/components/care/RltDependencyEditor";
import { AddDailyNoteModal } from "@/components/resident/modals/AddDailyNoteModal";
import { AddInterventionModal } from "@/components/resident/modals/AddInterventionModal";
import { AddInterventionCompletionModal } from "@/components/resident/modals/AddInterventionCompletionModal";
import { InterventionReviewModal } from "@/components/resident/modals/InterventionReviewModal";
import { AddTaskModal } from "@/components/resident/modals/AddTaskModal";
import { AddMDTNoteModal } from "@/components/resident/modals/AddMDTNoteModal";
import { AddAssessmentModal } from "@/components/resident/modals/AddAssessmentModal";
import { IncidentDialog } from "@/components/care/IncidentDialog";
import { VisitorDialog } from "@/components/care/VisitorDialog";
import { OutingDialog } from "@/components/care/OutingDialog";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  scheduledInterventions,
  scheduledInterventionLabel,
  type ScheduledInterventionStatus,
} from "@/lib/care/intervention-schedule";
import type { VitalSign } from "@/lib/care/types";
import type { Resident } from "@/lib/care/types";
import { calcNEWS2 } from "@/lib/care/vitals";
import {
  formatVitalValues,
  inferVitalRecordType,
  VITAL_TYPE_LABELS,
} from "@/lib/care/vital-records";

export const Route = createFileRoute("/residents/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    carePlanId: typeof search.carePlanId === "string" ? search.carePlanId : undefined,
    carePlanProblemId:
      typeof search.carePlanProblemId === "string" ? search.carePlanProblemId : undefined,
  }),
  head: ({ params }) => ({ meta: [{ title: `Resident ${params.id} â€” CarePath` }] }),
  component: ResidentDetail,
});

function riskColor(level: string) {
  if (level === "very_high") return "bg-destructive/10 text-destructive border-destructive/30";
  if (level === "high") return "bg-warning/15 text-warning-foreground border-warning/40";
  if (level === "moderate") return "bg-info/10 text-info border-info/20";
  return "bg-success/10 text-success border-success/20";
}

type UpcomingTaskStatus = ScheduledInterventionStatus;

function statusBadgeClass(status: UpcomingTaskStatus) {
  if (status === "overdue") return "bg-destructive/10 text-destructive border-destructive/30";
  if (status === "due_now") return "bg-warning/15 text-warning-foreground border-warning/40";
  if (status === "due_today") return "bg-warning/10 text-warning-foreground border-warning/30";
  if (status === "upcoming") return "bg-info/10 text-info border-info/30";
  if (status === "completed") return "bg-success/10 text-success border-success/20";
  return "bg-muted text-muted-foreground";
}

function statusLabel(status: UpcomingTaskStatus) {
  return scheduledInterventionLabel(status);
}

function daysFromToday(date?: string) {
  if (!date) return null;
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`);
  const due = new Date(`${date}T00:00:00`);
  return Math.floor((due.getTime() - today.getTime()) / 86400000);
}

function riskLabel(level?: string) {
  if (!level) return "None";
  if (level === "very_high") return "Very High";
  return level.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function activeVitalRows(vitals: VitalSign[]) {
  return vitals
    .filter((vital) => !vital.deletedAt)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

function trendStatus(values: number[], mode: "stable" | "lowerBetter" = "stable") {
  if (values.length < 2) return null;
  const [latest, previous] = values;
  const delta = latest - previous;
  if (Math.abs(delta) < 0.5) return "Stable";
  if (mode === "lowerBetter") return delta < 0 ? "Improving" : "Requires Review";
  return "Requires Review";
}

function trendTone(status: string | null) {
  if (status === "Improving") return "border-success/30 text-success";
  if (status === "Requires Review") return "border-warning/40 text-warning-foreground";
  return "border-muted-foreground/20 text-muted-foreground";
}

function TrendCard({
  title,
  status,
  detail,
}: {
  title: string;
  status: string | null;
  detail: string;
}) {
  if (!status) return null;
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
        <Badge variant="outline" className={trendTone(status)}>
          {status}
        </Badge>
        <div className="text-xs text-muted-foreground">{detail}</div>
      </CardContent>
    </Card>
  );
}

function DeleteAssessmentDialog({
  id,
  onConfirm,
}: {
  id: string;
  onConfirm: (reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete assessment (audited)</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Assessments are soft-deleted and retained for audit. Provide a reason.
        </p>
        <Textarea
          placeholder="Reason for deletionâ€¦"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim()}
            onClick={() => {
              onConfirm(reason);
              setOpen(false);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResidentDetail() {
  const { id } = Route.useParams();
  const { carePlanProblemId } = Route.useSearch();
  const navigate = useNavigate();
  const {
    residents,
    assessments,
    carePlans,
    carePlanProblems,
    problemInterventions,
    problemInterventionLogs,
    problemGoals,
    problemEvaluations,
    problemReviews,
    problemHistory,
    timelineEvents,
    auditLogs,
    notes,
    alerts,
    tasks,
    incidents,
    mdtNotes,
    visitors,
    outings,
    vitals,
    handovers,
    currentRole,
    currentUserName,
    canAccess,
    rltDependencyState,
    saveRltDependency,
    softDeleteAssessment,
    addNextOfKin,
    addGoal,
    updateGoal,
    removeGoal,
    addProblemEvaluation,
    addProblemReview,
    addProblemIntervention,
    discontinueProblemIntervention,
    archiveProblem,
    updateProblem,
    updateProblemIntervention,
    updateResident,
    softDeleteResident,
  } = useCare();
  const r = residents.find((x) => x.id === id);

  // Modal state
  const [nokOpen, setNokOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [modalState, setModalState] = useState<{
    note: boolean;
    intervention: boolean;
    interventionCompletion: boolean;
    interventionReview: boolean;
    assessment: boolean;
    task: boolean;
    incident: boolean;
    mdt: boolean;
    visitor: boolean;
    outing: boolean;
  }>({
    note: false,
    intervention: false,
    interventionCompletion: false,
    interventionReview: false,
    assessment: false,
    task: false,
    incident: false,
    mdt: false,
    visitor: false,
    outing: false,
  });

  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);
  const [selectedReviewAction, setSelectedReviewAction] = useState<
    "extend" | "complete" | "cancel" | null
  >(null);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [newlyCreatedProblemId, setNewlyCreatedProblemId] = useState<string | null>(null);
  const [problemDetailOpen, setProblemDetailOpen] = useState(false);
  const [inactiveProblemOpen, setInactiveProblemOpen] = useState(false);
  const [inactiveProblemReason, setInactiveProblemReason] = useState("");
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [latestVitalsDialogOpen, setLatestVitalsDialogOpen] = useState(false);
  const [selectedRltDomainId, setSelectedRltDomainId] = useState<RltDomainId | null>(null);
  const [selectedCarePlanGroupDomainId, setSelectedCarePlanGroupDomainId] = useState<RltDomainId | null>(null);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "activities"
    | "vitals"
    | "assessments"
    | "notes"
    | "incidents"
    | "mdt"
    | "tasks"
    | "interventions"
    | "visitors"
    | "outings"
    | "handovers"
    | "nok"
    | "alerts"
  >("overview");
  const [timelineFilter, setTimelineFilter] = useState<
    | "all"
    | "assessments"
    | "careplans"
    | "interventions"
    | "evaluations"
    | "incidents"
    | "mdt"
    | "tasks"
    | "vitals"
    | "visitors"
    | "outings"
  >("all");
  const [presetInterventionProblemId, setPresetInterventionProblemId] = useState<
    string | undefined
  >(undefined);
  const [goalDraft, setGoalDraft] = useState({ statement: "", targetDate: "" });
  const [evaluationDraft, setEvaluationDraft] = useState({
    date: new Date().toISOString().slice(0, 10),
    summary: "",
    goalsMet: "partial",
    progress: "stable",
    recommendations: "",
    nextEvaluationDate: "",
    revisionRequired: "no",
    revisionReason: "",
    revisionAddIntervention: "",
    revisionDiscontinueInterventionId: "",
    revisionChangeInterventionId: "",
    revisionFrequencyType: "daily",
    revisionUpdateGoalId: "",
    revisionGoalText: "",
    revisionReviewDate: "",
  });

  const handleOpenModal = (kind: keyof typeof modalState) => {
    setModalState((prev) => ({ ...prev, [kind]: true }));
  };

  const handleCloseModal = (kind: keyof typeof modalState) => {
    setModalState((prev) => ({ ...prev, [kind]: false }));
  };

  const handleRecordCompletion = (intervention: any) => {
    setSelectedIntervention(intervention);
    setModalState((prev) => ({ ...prev, interventionCompletion: true }));
  };

  const handleReviewIntervention = (
    intervention: any,
    action: "extend" | "complete" | "cancel",
  ) => {
    setSelectedIntervention(intervention);
    setSelectedReviewAction(action);
    setModalState((prev) => ({ ...prev, interventionReview: true }));
  };

  const [newNok, setNewNok] = useState({
    name: "",
    relationship: "",
    phone: "",
    mobile: "",
    email: "",
    address: "",
    notes: "",
    primaryContact: false,
    emergencyContact: false,
    powerOfAttorney: false,
    legalRepresentative: false,
  });

  if (!r)
    return (
      <div className="p-8">
        Resident not found.{" "}
        <Link to="/residents" className="text-primary underline">
          Back
        </Link>
      </div>
    );

  const residentFullName = `${r.firstName} ${r.lastName}`;
  const canDeleteResident = currentRole === "don" || currentRole === "cnm";
  const deleteNameMatches = deleteConfirmName.trim() === residentFullName;

  const rA = assessments
    .filter((a) => a.residentId === id && a.status !== "deleted")
    .sort((a, b) => b.date.localeCompare(a.date));
  const rADeleted = assessments.filter((a) => a.residentId === id && a.status === "deleted");
  const rP = carePlans.filter((c) => c.residentId === id);
  const rN = notes.filter((n) => n.residentId === id);
  const rAlerts = alerts.filter(
    (a) => a.residentId === id && isActionRequiredAlert(a) && !a.resolvedAt,
  );
  const rTasks = tasks.filter((t) => t.residentId === id && t.status !== "deleted");
  const rIncidents = incidents.filter((x) => x.residentId === id);
  const rMDT = mdtNotes.filter((x) => x.residentId === id);
  const rVisitors = visitors.filter((x) => x.residentId === id);
  const rOutings = outings.filter((x) => x.residentId === id);
  const rVitals = vitals.filter((v) => v.residentId === id);
  const rHandovers = handovers.filter((x) => x.residentId === id);
  const rProblems = carePlanProblems.filter((p) => p.residentId === id);
  const activeProblems = rProblems.filter((p) => p.status === "active");
  const groupedActiveCarePlans = useMemo(
    () => getCarePlansGroupedByRltDomain(id, activeProblems),
    [activeProblems, id],
  );
  const rProblemInterventions = problemInterventions.filter((i) => i.residentId === id);
  const rProblemLogs = problemInterventionLogs.filter((l) => l.residentId === id);
  const rProblemEvaluations = problemEvaluations.filter((e) =>
    rProblems.some((p) => p.id === e.problemId),
  );
  const rProblemReviews = problemReviews.filter((rev) =>
    rProblems.some((p) => p.id === rev.problemId),
  );

  const today = new Date();
  const overdueAssessments = rA.filter(
    (a) =>
      !!a.nextReassessmentDate &&
      a.status !== "archived" &&
      a.status !== "superseded" &&
      new Date(a.nextReassessmentDate) <= today,
  );
  const overdueProblemReviews = activeProblems.filter((p) => new Date(p.reviewDate) <= today);
  const highRiskFlags = activeProblems.filter(
    (p) => p.riskLevel === "high" || p.riskLevel === "very_high",
  );
  const openIncidents = rIncidents.filter((i) => i.status !== "closed");
  const openTasks = rTasks.filter((t) => t.status !== "completed");
  const openAlertCount = rAlerts.filter((a) => !a.acknowledged).length;
  const overviewHasMissingInfo = [
    r.primaryDiagnosis,
    r.medicalHistory,
    r.allergies,
    r.currentMedication,
    r.gp,
    r.consultant,
    r.emergencyContact,
    r.communicationNeeds,
    r.religion,
    r.preferredLanguage,
    r.bed,
    r.keyWorkers?.namedNurse,
    r.keyWorkers?.namedCarer,
    r.keyWorkers?.keyWorker,
  ].some((value) => !value);
  const todayKey = today.toISOString().slice(0, 10);
  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowKey = tomorrowDate.toISOString().slice(0, 10);

  const selectedProblem = selectedProblemId
    ? rProblems.find((p) => p.id === selectedProblemId) || null
    : null;

  useEffect(() => {
    if (!carePlanProblemId) return;
    const problemBelongsToResident = rProblems.some((problem) => problem.id === carePlanProblemId);
    if (!problemBelongsToResident) return;
    setNewlyCreatedProblemId(null);
    setSelectedProblemId(carePlanProblemId);
    setProblemDetailOpen(true);
  }, [carePlanProblemId]);

  const selectedProblemGoals = selectedProblem
    ? problemGoals.filter((g) => g.problemId === selectedProblem.id)
    : [];
  const selectedProblemInterventions = selectedProblem
    ? rProblemInterventions.filter((i) => i.problemId === selectedProblem.id)
    : [];
  const selectedProblemLogs = selectedProblem
    ? rProblemLogs.filter((l) => l.problemId === selectedProblem.id)
    : [];
  const selectedProblemEvaluations = selectedProblem
    ? rProblemEvaluations.filter((e) => e.problemId === selectedProblem.id)
    : [];
  const selectedProblemReviews = selectedProblem
    ? rProblemReviews.filter((rev) => rev.problemId === selectedProblem.id)
    : [];

  const linkedDailyNotes = selectedProblem
    ? rN.filter((n) => n.linkedProblemId === selectedProblem.id)
    : [];
  const linkedMdtNotes = selectedProblem
    ? rMDT.filter((m) => m.linkedCarePlanId === selectedProblem.residentCarePlanId)
    : [];
  const linkedIncidents = selectedProblem
    ? rIncidents.filter((i) => i.linkedCarePlanId === selectedProblem.residentCarePlanId)
    : [];
  const linkedTasks = selectedProblem
    ? rTasks.filter((t) => t.linkedCarePlanId === selectedProblem.residentCarePlanId)
    : [];
  const linkedAssessments = selectedProblem
    ? rA.filter(
        (a) =>
          a.id === selectedProblem.sourceAssessmentId ||
          (a.linkedProblemIds || []).includes(selectedProblem.id),
      )
    : [];

  const selectedProblemHistory = selectedProblem
    ? problemHistory
        .filter((h) => h.problemId === selectedProblem.id)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    : [];
  const carePlanQualityByProblemId = useMemo(() => {
    const quality = new Map<string, ReturnType<typeof getCarePlanQualityStatus>>();
    for (const problem of rProblems) {
      quality.set(
        problem.id,
        getCarePlanQualityStatus({
          problem,
          goals: problemGoals.filter((goal) => goal.problemId === problem.id),
          interventions: rProblemInterventions.filter((intervention) => intervention.problemId === problem.id),
          evaluations: rProblemEvaluations.filter((evaluation) => evaluation.problemId === problem.id),
        }),
      );
    }
    return quality;
  }, [problemGoals, rProblemEvaluations, rProblemInterventions, rProblems]);
  const coverageGaps = useMemo(
    () => getResidentRltCoverageChecks(id, { assessments: rA, carePlanProblems: activeProblems }),
    [activeProblems, id, rA],
  );
  const coverageGapsByDomain = useMemo(() => {
    return coverageGaps.reduce((map, gap) => {
      const existing = map.get(gap.primaryDomainId) || [];
      existing.push(gap);
      map.set(gap.primaryDomainId, existing);
      return map;
    }, new Map<RltDomainId, typeof coverageGaps>());
  }, [coverageGaps]);
  const allActiveCarePlansComplete =
    activeProblems.length > 0 &&
    activeProblems.every((problem) => carePlanQualityByProblemId.get(problem.id)?.status === "complete");

  const now = new Date();

  const upcomingInterventionTasks = useMemo(() => {
    return scheduledInterventions(rProblemInterventions, rProblemLogs, rProblems, now);
  }, [now, rProblemInterventions, rProblemLogs, rProblems]);

  const activityWorkspaces = useMemo(() => {
    const latestWeight = activeVitalRows(rVitals).find((vital) => typeof vital.weight === "number");
    const recentThreshold = new Date();
    recentThreshold.setDate(recentThreshold.getDate() - 7);

    return RLT_DOMAINS.map((domain) => {
      const carePlans = activeProblems
        .filter((problem) => getRltDomainForCarePlanProblem(problem)?.id === domain.id)
        .sort((left, right) => left.reviewDate.localeCompare(right.reviewDate));
      const assessmentsForDomain = rA
        .filter((assessment) =>
          getApprovedRltDomainsForAssessmentRecord(assessment).some((mapped) => mapped.id === domain.id),
        )
        .sort((left, right) => right.date.localeCompare(left.date));
      const latestAssessmentByType = Array.from(
        assessmentsForDomain
          .reduce((map, assessment) => {
            if (!map.has(assessment.type)) map.set(assessment.type, assessment);
            return map;
          }, new Map<string, (typeof assessmentsForDomain)[number]>())
          .values(),
      );
      const dueActions = upcomingInterventionTasks.filter((task) => {
        const problem = task.problem || rProblems.find((item) => item.id === task.intervention.problemId);
        return problem && getRltDomainForCarePlanProblem(problem)?.id === domain.id && task.status !== "completed";
      });
      const nextReview = carePlans[0]?.reviewDate;
      const nextOutcomeReview = carePlans
        .map((problem) => problem.evaluationDate)
        .filter(Boolean)
        .sort()[0];
      const reviewDays = daysFromToday(nextReview);
      const overdueAssessmentsForDomain = assessmentsForDomain.filter((assessment) => {
        const dueDate = assessment.nextReassessmentDate || assessment.dueDate;
        const days = daysFromToday(dueDate);
        return days !== null && days <= 0 && assessment.status !== "archived" && assessment.status !== "superseded";
      });
      const highRiskAssessments = assessmentsForDomain.filter(
        (assessment) => assessment.riskLevel === "high" || assessment.riskLevel === "very_high",
      );
      const highRiskPlans = carePlans.filter(
        (problem) => problem.riskLevel === "high" || problem.riskLevel === "very_high",
      );
      const recentChanges = [
        ...assessmentsForDomain.filter((assessment) => new Date(assessment.date) >= recentThreshold),
        ...carePlans.filter((problem) => new Date(problem.createdAt) >= recentThreshold),
      ];
      const indicators = [
        ...latestAssessmentByType.map((assessment) => ({
          label: assessmentMeta[assessment.type]?.name || assessment.type,
          value: `${riskLabel(assessment.riskLevel)}: ${assessment.interpretation}`,
          tone: assessment.riskLevel,
          assessmentId: assessment.id,
        })),
      ];
      if (domain.id === "eating_drinking" && latestWeight?.weight) {
        indicators.push({
          label: "Weight",
          value: `${latestWeight.weight}kg`,
          tone: "low",
          assessmentId: "",
        });
      }
      const relevant =
        carePlans.length > 0 ||
        highRiskAssessments.length > 0 ||
        overdueAssessmentsForDomain.length > 0 ||
        dueActions.length > 0 ||
        recentChanges.length > 0;

      return {
        domain,
        carePlans,
        assessments: latestAssessmentByType,
        indicators,
        knownRisks: [
          ...highRiskAssessments.map((assessment) => `${assessmentMeta[assessment.type]?.name || assessment.type}: ${riskLabel(assessment.riskLevel)}`),
          ...highRiskPlans.map((problem) => `${riskLabel(problem.riskLevel)} care need`),
        ],
        dueActions,
        nextReview,
        nextOutcomeReview,
        reviewDays,
        overdueAssessments: overdueAssessmentsForDomain,
        relevant,
      };
    });
  }, [activeProblems, rA, rProblems, rVitals, upcomingInterventionTasks]);

  const visibleActivityWorkspaces = activityWorkspaces;
  const selectedActivityWorkspace =
    activityWorkspaces.find((workspace) => workspace.domain.id === selectedRltDomainId) || null;
  const selectedCarePlanGroup =
    groupedActiveCarePlans.find((group) => group.domain.id === selectedCarePlanGroupDomainId) || null;

  const taskOps = useMemo(() => {
    const completedToday = rTasks.filter(
      (t) => t.status === "completed" && t.dueDate === now.toISOString().slice(0, 10),
    );
    const overdue = rTasks.filter((t) => t.status !== "completed" && new Date(t.dueDate) < now);
    const upcoming = rTasks.filter(
      (t) =>
        t.status !== "completed" && new Date(t.dueDate) >= new Date(now.toISOString().slice(0, 10)),
    );
    return { completedToday, overdue, upcoming };
  }, [rTasks]);

  const residentVitals = useMemo(() => activeVitalRows(rVitals), [rVitals]);
  const latestVital = residentVitals[0];
  const weightValues = residentVitals
    .filter((vital) => vital.weight !== undefined)
    .map((vital) => vital.weight as number);
  const temperatureValues = residentVitals
    .filter((vital) => vital.temperature !== undefined)
    .map((vital) => vital.temperature as number);
  const painValues = residentVitals
    .filter((vital) => vital.painScore !== undefined)
    .map((vital) => vital.painScore as number);
  const glucoseValues = residentVitals
    .filter((vital) => vital.bloodGlucose !== undefined)
    .map((vital) => vital.bloodGlucose as number);
  const weightStatus = trendStatus(weightValues);
  const temperatureStatus = trendStatus(temperatureValues);
  const painStatus = trendStatus(painValues, "lowerBetter");
  const glucoseStatus = trendStatus(glucoseValues);

  const residentTimelineEntries = useMemo(() => {
    const items = [
      ...rA.map((a) => ({
        id: `assess-${a.id}`,
        module: "assessments" as const,
        at: a.date,
        title: `${assessmentMeta[a.type]?.name || a.type} assessment`,
        summary: `Score ${a.totalScore} (${a.interpretation})`,
        by: a.assessor,
      })),
      ...rProblems.map((p) => ({
        id: `cp-${p.id}`,
        module: "careplans" as const,
        at: p.createdAt,
        title: "Care plan problem updated",
        summary: p.problemStatement,
        by: p.createdBy,
      })),
      ...rProblemInterventions.map((i) => ({
        id: `int-${i.id}`,
        module: "interventions" as const,
        at: i.updatedAt || i.createdAt,
        title: i.name,
        summary: `${i.frequencyType.replace(/_/g, " ")} Â· ${i.status.replace(/_/g, " ")}`,
        by: i.updatedBy || i.createdBy,
      })),
      ...rProblemEvaluations.map((e) => ({
        id: `eval-${e.id}`,
        module: "evaluations" as const,
        at: e.date,
        title: "Care plan review",
        summary: `${e.progress.replace(/_/g, " ")} Â· plan met: ${e.goalsMet}`,
        by: e.evaluatorName,
      })),
      ...rProblemReviews.map((rev) => ({
        id: `rev-${rev.id}`,
        module: "careplans" as const,
        at: rev.reviewDate,
        title: "Care plan review",
        summary: `${rev.outcome} Â· ${rev.comments || ""}`,
        by: rev.reviewedByName,
      })),
      ...rTasks.map((t) => ({
        id: `task-${t.id}`,
        module: "tasks" as const,
        at: t.dueDate,
        title: t.title,
        summary: t.status,
        by: t.assignedTo,
      })),
      ...rIncidents.map((i) => ({
        id: `inc-${i.id}`,
        module: "incidents" as const,
        at: i.date,
        title: `${i.type.replace(/_/g, " ")} incident`,
        summary: i.description,
        by: i.reportedBy,
      })),
      ...rMDT.map((m) => ({
        id: `mdt-${m.id}`,
        module: "mdt" as const,
        at: m.date,
        title: `${m.meetingType || "MDT"} meeting`,
        summary: m.clinicalDecisions || m.recommendations || m.discussion,
        by: m.authoredBy,
      })),
      ...rVisitors.map((v) => ({
        id: `vis-${v.id}`,
        module: "visitors" as const,
        at: v.date,
        title: "Visitor recorded",
        summary: `${v.visitorName} (${v.relationship})`,
        by: v.signedInBy,
      })),
      ...rOutings.map((o) => ({
        id: `out-${o.id}`,
        module: "outings" as const,
        at: o.date,
        title: `Outing: ${o.destination}`,
        summary: `${o.departureTime}-${o.returnTime}`,
        by: o.accompaniedBy,
      })),
      ...rVitals.map((v) => ({
        id: `vital-${v.id}`,
        module: "vitals" as const,
        at: v.recordedAt || `${v.date}T${v.time}`,
        title: "Vitals recorded",
        summary: `${v.date} ${v.time}`,
        by: v.recordedByName || "Unknown",
      })),
      ...rAlerts.map((a) => ({
        id: `alert-${a.id}`,
        module: "careplans" as const,
        at: a.createdAt,
        title: `Alert: ${a.title}`,
        summary: a.description,
        by: "System",
      })),
      ...timelineEvents
        .filter((e) => e.residentId === id)
        .map((e) => ({
          id: `tle-${e.id}`,
          module: e.type.startsWith("assessment")
            ? ("assessments" as const)
            : e.type.startsWith("intervention")
              ? ("interventions" as const)
              : e.type.startsWith("careplan")
                ? ("careplans" as const)
                : e.type.startsWith("task")
                  ? ("tasks" as const)
                  : e.type.startsWith("incident")
                    ? ("incidents" as const)
                    : ("careplans" as const),
          at: e.createdAt,
          title: e.title,
          summary: e.description || e.type,
          by: e.createdBy,
        })),
    ];

    return items.sort((a, b) => `${b.at}`.localeCompare(`${a.at}`));
  }, [
    rA,
    rProblems,
    rProblemInterventions,
    rProblemEvaluations,
    rProblemReviews,
    rTasks,
    rIncidents,
    rMDT,
    rVisitors,
    rOutings,
    rVitals,
    rAlerts,
    timelineEvents,
    id,
  ]);

  const filteredTimelineEntries =
    timelineFilter === "all"
      ? residentTimelineEntries
      : residentTimelineEntries.filter((x) => x.module === timelineFilter);

  const residentAuditRows = useMemo(() => {
    const entityModuleMap = new Map<string, string>();
    rA.forEach((a) => entityModuleMap.set(a.id, "Assessments"));
    rProblems.forEach((p) => entityModuleMap.set(p.id, "Nursing Care Plans"));
    rProblemInterventions.forEach((i) => entityModuleMap.set(i.id, "Care Actions"));
    rProblemEvaluations.forEach((e) => entityModuleMap.set(e.id, "Reviews"));
    rTasks.forEach((t) => entityModuleMap.set(t.id, "Actions"));
    rIncidents.forEach((i) => entityModuleMap.set(i.id, "Incidents"));
    rMDT.forEach((m) => entityModuleMap.set(m.id, "MDT"));
    rVisitors.forEach((v) => entityModuleMap.set(v.id, "Visitors"));
    rOutings.forEach((o) => entityModuleMap.set(o.id, "Outings"));
    rVitals.forEach((v) => entityModuleMap.set(v.id, "Vitals"));

    return auditLogs
      .filter((a) => entityModuleMap.has(a.entity))
      .map((a) => ({
        ...a,
        module: entityModuleMap.get(a.entity) || "Other",
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [
    auditLogs,
    rA,
    rProblems,
    rProblemInterventions,
    rProblemEvaluations,
    rTasks,
    rIncidents,
    rMDT,
    rVisitors,
    rOutings,
    rVitals,
  ]);

  const residentVersionRows = useMemo(() => {
    const assessmentRows = rA.map((a) => ({
      key: `assess-${a.id}`,
      module: "Assessment Versions",
      name: assessmentMeta[a.type]?.name || a.type,
      version: a.version || 1,
      createdBy: a.assessor,
      date: a.date,
      reason: a.revisionReason || "Initial",
      supersededBy: a.supersededById || "â€”",
    }));

    const carePlanRows = rProblems.map((p) => {
      const versions = problemHistory
        .filter((h) => h.problemId === p.id)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      return versions.map((h, idx) => ({
        key: `cp-${h.id}`,
        module: "Care Plan Versions",
        name: p.problemStatement,
        version: idx + 1,
        createdBy: h.userName,
        date: h.timestamp,
        reason: h.reason || h.action.replace(/_/g, " "),
        supersededBy: idx < versions.length - 1 ? `v${idx + 2}` : "Current",
      }));
    });

    const evaluationRows = rProblemEvaluations
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e, idx) => ({
        key: `eval-${e.id}`,
        module: "Review Versions",
        name: rProblems.find((p) => p.id === e.problemId)?.problemStatement || "Problem evaluation",
        version: idx + 1,
        createdBy: e.evaluatorName,
        date: e.date,
        reason: e.summary || e.progress,
        supersededBy: idx < rProblemEvaluations.length - 1 ? `v${idx + 2}` : "Current",
      }));

    const interventionRows = rProblemInterventions
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((i, idx) => ({
        key: `int-${i.id}`,
        module: "Intervention Versions",
        name: i.name,
        version: idx + 1,
        createdBy: i.createdBy,
        date: i.createdAt,
        reason: i.notes || "Intervention created",
        supersededBy: i.status === "superseded" ? "Superseded" : "Current",
      }));

    return [...assessmentRows, ...carePlanRows.flat(), ...evaluationRows, ...interventionRows].sort(
      (a, b) => `${b.date}`.localeCompare(`${a.date}`),
    );
  }, [rA, rProblems, problemHistory, rProblemEvaluations, rProblemInterventions]);

  const rolePermissions = {
    canComplete: ["carer", "nurse", "cnm", "don"].includes(currentRole),
    canEdit: ["nurse", "cnm", "don"].includes(currentRole),
    canDisable: ["cnm", "don"].includes(currentRole),
    canArchiveDelete: ["don"].includes(currentRole),
    canSetCarePlanInactive: ["nurse", "cnm", "don"].includes(currentRole),
  };

  const applyInterventionStatus = (intv: any, status: any, reason: string) => {
    updateProblemIntervention(
      intv.id,
      {
        status,
        updatedAt: new Date().toISOString(),
        updatedBy: "System",
      },
      reason,
    );
    toast.success(`Intervention ${status}`);
  };

  const openProblemDetail = (problemId: string) => {
    setNewlyCreatedProblemId(null);
    setSelectedProblemId(problemId);
    setProblemDetailOpen(true);
  };

  const openCarePlanGroup = (domainId: RltDomainId, carePlans: typeof activeProblems) => {
    if (carePlans.length === 1) {
      openProblemDetail(carePlans[0].id);
      return;
    }
    setSelectedCarePlanGroupDomainId(domainId);
  };

  const openNewlyCreatedProblemDetail = (problemId: string) => {
    setNewlyCreatedProblemId(problemId);
    setSelectedProblemId(problemId);
    setProblemDetailOpen(true);
  };

  const openAddInterventionForProblem = (problemId: string) => {
    setSelectedProblemId(problemId);
    setPresetInterventionProblemId(problemId);
    setModalState((prev) => ({ ...prev, intervention: true }));
  };

  const openAddEvaluationForProblem = (problemId: string) => {
    setSelectedProblemId(problemId);
    setEvaluationDraft((prev) => ({
      ...prev,
      date: new Date().toISOString().slice(0, 10),
      nextEvaluationDate: "",
      summary: "",
      recommendations: "",
      revisionRequired: "no",
      revisionReason: "",
      revisionAddIntervention: "",
      revisionDiscontinueInterventionId: "",
      revisionChangeInterventionId: "",
      revisionFrequencyType: "daily",
      revisionUpdateGoalId: "",
      revisionGoalText: "",
      revisionReviewDate: "",
    }));
    setEvaluationOpen(true);
  };

  const submitSetProblemInactive = () => {
    if (!selectedProblem || !inactiveProblemReason.trim()) {
      toast.error("Reason for inactivation required");
      return;
    }
    archiveProblem(selectedProblem.id, inactiveProblemReason.trim());
    toast.success("Care plan problem set inactive");
    setInactiveProblemOpen(false);
    setProblemDetailOpen(false);
    setInactiveProblemReason("");
    setNewlyCreatedProblemId(null);
    setSelectedProblemId(null);
  };

  const submitAddGoal = () => {
    if (!selectedProblem || !goalDraft.statement.trim()) {
      toast.error("Plan statement is required");
      return;
    }
    addGoal(selectedProblem.id, goalDraft.statement.trim(), goalDraft.targetDate || undefined);
    setGoalDraft({ statement: "", targetDate: "" });
    toast.success("Plan added");
  };

  const submitEvaluation = () => {
    if (!selectedProblem) {
      toast.error("No nursing care plan selected");
      return;
    }

    if (!evaluationDraft.summary.trim()) {
      toast.error("Review notes are required");
      return;
    }

    addProblemEvaluation({
      problemId: selectedProblem.id,
      date: evaluationDraft.date,
      summary: evaluationDraft.summary,
      goalsMet: evaluationDraft.goalsMet as any,
      progress: evaluationDraft.progress as any,
      recommendations: evaluationDraft.recommendations || undefined,
      nextEvaluationDate: evaluationDraft.nextEvaluationDate || undefined,
    });

    if (evaluationDraft.revisionRequired === "yes") {
      if (evaluationDraft.revisionAddIntervention.trim()) {
        addProblemIntervention({
          problemId: selectedProblem.id,
          name: evaluationDraft.revisionAddIntervention.trim(),
          frequencyType: "daily",
          assignedRole: currentRole,
          assignedStaffName: currentUserName,
          startDate: evaluationDraft.date,
          reviewDate:
            evaluationDraft.revisionReviewDate ||
            selectedProblem.reviewDate ||
            new Date().toISOString().slice(0, 10),
          endDate:
            evaluationDraft.nextEvaluationDate ||
            new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          notes: `Revision workflow intervention. ${evaluationDraft.revisionReason || ""}`.trim(),
        });
      }

      if (evaluationDraft.revisionDiscontinueInterventionId) {
        discontinueProblemIntervention(
          evaluationDraft.revisionDiscontinueInterventionId,
          evaluationDraft.revisionReason || "Amendment required",
        );
      }

      if (evaluationDraft.revisionChangeInterventionId) {
        updateProblemIntervention(
          evaluationDraft.revisionChangeInterventionId,
          { frequencyType: evaluationDraft.revisionFrequencyType as any },
          evaluationDraft.revisionReason || "Revision frequency update",
        );
      }

      if (evaluationDraft.revisionUpdateGoalId && evaluationDraft.revisionGoalText.trim()) {
        updateGoal(evaluationDraft.revisionUpdateGoalId, {
          statement: evaluationDraft.revisionGoalText.trim(),
        });
      }

      if (evaluationDraft.revisionReviewDate) {
        updateProblem(
          selectedProblem.id,
          { reviewDate: evaluationDraft.revisionReviewDate },
          evaluationDraft.revisionReason || "Revision updated review date",
        );
      }

      addProblemReview({
        problemId: selectedProblem.id,
        reviewDate: evaluationDraft.date,
        outcome: "modify",
        comments: evaluationDraft.revisionReason || "Amendment required from review",
        nextReviewDate: evaluationDraft.revisionReviewDate || selectedProblem.reviewDate,
      });
    }

    setEvaluationOpen(false);
    toast.success("Review saved");
  };

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl">
      <Link
        to="/residents"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" /> All residents
      </Link>

      <Card>
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-5">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-xl bg-accent text-accent-foreground">
              {r.firstName[0]}
              {r.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {r.firstName} {r.lastName}
              </h1>
              <div className="ml-auto flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Quick Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenModal("note")}>
                      Daily Note
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenModal("intervention")}>
                      Intervention
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenModal("assessment")}>
                      Assessment
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenModal("task")}>
                      Task
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenModal("incident")}>
                      Incident
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenModal("mdt")}>
                      MDT Meeting
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenModal("visitor")}>
                      Visitor Record
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenModal("outing")}>
                      Resident Outing
                    </DropdownMenuItem>
                    <RecordObservationFlow
                      residentId={r.id}
                      onRecorded={() => setActiveTab("vitals")}
                      trigger={
                        <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                          Record Vitals
                        </DropdownMenuItem>
                      }
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Resident actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setLatestVitalsDialogOpen(true)}>
                      Latest Vitals
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimelineDialogOpen(true)}>
                      Resident Timeline
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAuditDialogOpen(true)}>
                      Audit History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVersionDialogOpen(true)}>
                      Version History
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (typeof window !== "undefined") window.print();
                      }}
                    >
                      Print Summary
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        toast.info("Export PDF is queued for next release");
                      }}
                    >
                      Export PDF
                    </DropdownMenuItem>
                    {canDeleteResident && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setDeleteConfirmName("");
                            setDeleteReason("");
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Resident
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Badge variant="outline" className="capitalize">
                {(r.residentType || r.status).replace("_", " ")}
              </Badge>
              {r.endOfLife && (
                <Badge variant="outline" className="border-destructive/40 text-destructive">
                  End of Life
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Resident ID</div>
                {r.id}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Age</div>
                {age(r.dob)} ({r.dob})
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Room</div>
                {r.roomNumber}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Bed</div>
                <span className="capitalize">{r.bed?.bedType?.replace("_", " ") || "â€”"}</span>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Admitted</div>
                {r.admissionDate}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {activeProblems
                .filter((p) => p.riskLevel === "high" || p.riskLevel === "very_high")
                .map((p) => (
                  <Badge
                    key={p.id}
                    className="bg-destructive/10 text-destructive border border-destructive/30"
                  >
                    HIGH {p.category.replace(/_/g, " ")} RISK
                  </Badge>
                ))}
              {activeProblems
                .filter((p) => p.category === "pain")
                .map((p) => (
                  <Badge
                    key={p.id}
                    className="bg-warning/15 text-warning-foreground border border-warning/40"
                  >
                    PAIN MONITORING
                  </Badge>
                ))}
              {activeProblems
                .filter((p) => p.category === "nutrition" && new Date(p.reviewDate) <= now)
                .map((p) => (
                  <Badge key={p.id} className="bg-info/10 text-info border border-info/30">
                    NUTRITION REVIEW DUE
                  </Badge>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resident</DialogTitle>
            <DialogDescription>
              This will remove the resident from active views and archive all related records,
              including actions, care actions, care plans, assessments, notes, incidents, handovers,
              visitors, outings, alerts, risks and vitals.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone from normal screens.
            </p>
            <div>
              <Label>Type resident name to confirm: {residentFullName}</Label>
              <Input
                value={deleteConfirmName}
                onChange={(event) => setDeleteConfirmName(event.target.value)}
                placeholder={residentFullName}
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder={`Resident deleted: ${residentFullName}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!deleteNameMatches}
              onClick={() => {
                const archivedCount = softDeleteResident(r.id, deleteReason);
                toast.success(`Resident deleted. ${archivedCount} related records archived.`);
                setDeleteOpen(false);
                navigate({ to: "/residents" });
              }}
            >
              Delete Resident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClinicalSnapshot residentId={r.id} showLatestVitals={false} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Nursing Care Plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {groupedActiveCarePlans.map(({ domain, carePlans }) => {
            const sortedCarePlans = [...carePlans].sort((left, right) =>
              left.reviewDate.localeCompare(right.reviewDate),
            );
            const nextReview = sortedCarePlans[0]?.reviewDate;

            return (
              <div key={domain.id} className="rounded-md border p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="font-medium">{domain.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {carePlans.length} active nursing care plan{carePlans.length === 1 ? "" : "s"}
                      {nextReview ? ` · Review due ${nextReview}` : ""}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openCarePlanGroup(domain.id, sortedCarePlans)}
                  >
                    Open Care Plan
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  {sortedCarePlans.slice(0, 3).map((problem) => (
                    <div
                      key={problem.id}
                      className="flex flex-col gap-2 rounded-md bg-muted/25 px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="line-clamp-1">{problem.problemStatement}</div>
                        <div className="text-xs text-muted-foreground">
                          Review of Outcome {problem.evaluationDate}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={`text-[10px] ${riskColor(problem.riskLevel)}`}>
                          {problem.riskLevel.replace(/_/g, " ")}
                        </Badge>
                        {carePlanQualityByProblemId.get(problem.id) && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${carePlanQualityClass(carePlanQualityByProblemId.get(problem.id)!.status)}`}
                            title={carePlanQualityByProblemId.get(problem.id)!.issues.join(", ")}
                          >
                            {carePlanQualityByProblemId.get(problem.id)!.label}
                          </Badge>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openProblemDetail(problem.id)}>
                          Open
                        </Button>
                      </div>
                    </div>
                  ))}
                  {sortedCarePlans.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{sortedCarePlans.length - 3} more nursing care plan{sortedCarePlans.length - 3 === 1 ? "" : "s"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {allActiveCarePlansComplete && (
            <div className="rounded-md border border-success/25 bg-success/5 px-3 py-2 text-sm text-success">
              All active nursing care plans are complete and up to date.
            </div>
          )}
          {activeProblems.length === 0 && (
            <div className="rounded-md border p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">No active care plans.</p>
              <CreateCarePlanDialog
                residentId={r.id}
                onCreated={(problem) => openNewlyCreatedProblemDetail(problem.id)}
                trigger={
                  <Button size="sm">
                  <ClipboardList className="h-3 w-3 mr-1" /> Create Nursing Care Plan
                  </Button>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedCarePlanGroup}
        onOpenChange={(open) => {
          if (!open) setSelectedCarePlanGroupDomainId(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCarePlanGroup?.domain.title} Nursing Care Plans</DialogTitle>
            <DialogDescription>
              Select one nursing care plan to open. Only care plans in this Activity of Living are shown.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {selectedCarePlanGroup?.carePlans
              .slice()
              .sort((left, right) => left.reviewDate.localeCompare(right.reviewDate))
              .map((problem) => (
                <div
                  key={problem.id}
                  className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="line-clamp-1 font-medium">{problem.problemStatement}</div>
                    <div className="text-xs text-muted-foreground">
                      Review {problem.reviewDate} · Outcome review {problem.evaluationDate}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedCarePlanGroupDomainId(null);
                      openProblemDetail(problem.id);
                    }}
                  >
                    Open
                  </Button>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Care Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingInterventionTasks.map((task) => (
            <div key={task.intervention.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{task.intervention.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {task.problem?.problemStatement || "Unlinked care plan problem"}
                  </div>
                </div>
                <Badge variant="outline" className={statusBadgeClass(task.status)}>
                  {statusLabel(task.status)}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Due: {task.dueAt ? task.dueAt.toLocaleString("en-GB") : "Not scheduled"}</div>
                <div>Role: {task.intervention.assignedRole || "Unassigned"}</div>
                <div>Assigned To: {task.intervention.assignedStaffName || "Unassigned"}</div>
                <div>Progress: {statusLabel(task.status)}</div>
              </div>

              {(task.status === "completed" || task.completion) && (
                <p className="text-xs text-muted-foreground">
                  Completed by{" "}
                  {task.completion?.staffName || task.intervention.completedBy || "Unknown"}
                  {task.completion?.role ? ` ${task.completion.role.toUpperCase()}` : ""}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {task.status === "completed" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRecordCompletion(task.intervention)}
                  >
                    View Completion
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleRecordCompletion(task.intervention)}
                      disabled={!rolePermissions.canComplete}
                    >
                      Mark Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openProblemDetail(task.intervention.problemId)}
                    >
                      Open Care Action
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {upcomingInterventionTasks.length === 0 && (
            <div className="rounded-md border p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">No upcoming care actions.</p>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("activities")}>
                Open Activities of Living
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as any)}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 flex-wrap">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activities">
                Activities of Living ({activityWorkspaces.filter((workspace) => workspace.relevant).length})
              </TabsTrigger>
              <TabsTrigger value="vitals">Vitals ({activeVitalRows(rVitals).length})</TabsTrigger>
            <TabsTrigger value="assessments">Assessments ({rA.length})</TabsTrigger>
            <TabsTrigger value="notes">Daily Notes ({rN.length})</TabsTrigger>
            <TabsTrigger value="incidents">Incidents ({rIncidents.length})</TabsTrigger>
            <TabsTrigger value="mdt">MDT ({rMDT.length})</TabsTrigger>
            <TabsTrigger value="alerts">Alerts ({openAlertCount})</TabsTrigger>
            <TabsTrigger value="tasks">Actions ({rTasks.length})</TabsTrigger>
          </TabsList>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setActiveTab("interventions")}>
                Care Actions ({rProblemInterventions.length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("visitors")}>
                Visitors ({rVisitors.length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("outings")}>
                Outings ({rOutings.length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("handovers")}>
                Handovers ({rHandovers.length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("nok")}>
                Next of Kin ({r.nextOfKinList?.length || 0})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent value="activities" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Activities of Living</h2>
              <p className="text-sm text-muted-foreground">
                All 12 Roper Logan Tierney activities, with care plans and clinical indicators.
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {visibleActivityWorkspaces.map((workspace) => {
              const hasOverdueReview = workspace.reviewDays !== null && workspace.reviewDays < 0;
              const hasDueReview = workspace.reviewDays !== null && workspace.reviewDays <= 7;
              const domainCoverageGaps = coverageGapsByDomain.get(workspace.domain.id) || [];
              const dependencyRecord = rltDependencyState.records.find(
                (record) =>
                  record.residentId === r.id &&
                  record.rltDomainId === workspace.domain.id &&
                  record.status === "current",
              );
              return (
                <Card key={workspace.domain.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium">{workspace.domain.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {workspace.carePlans.length} Nursing Care Plan
                          {workspace.carePlans.length === 1 ? "" : "s"}
                          {workspace.dueActions.length > 0
                            ? ` · ${workspace.dueActions.length} care action${workspace.dueActions.length === 1 ? "" : "s"} due`
                            : ""}
                        </div>
                      </div>
                      {workspace.carePlans.length > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRltDomainId(workspace.domain.id)}
                        >
                          Open
                        </Button>
                      ) : (
                        <CreateCarePlanDialog
                          residentId={r.id}
                          initialRltDomainId={workspace.domain.id}
                          currentDependencyLevel={dependencyRecord?.dependencyLevel || null}
                          onCreated={(problem) => openNewlyCreatedProblemDetail(problem.id)}
                          trigger={
                            <Button size="sm" variant="outline">
                              Create Nursing Care Plan
                            </Button>
                          }
                        />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {workspace.indicators.slice(0, 3).map((indicator) => (
                        <Badge
                          key={`${workspace.domain.id}-${indicator.label}`}
                          variant="outline"
                          className={`text-[10px] ${riskColor(indicator.tone)}`}
                        >
                          {indicator.label}: {indicator.value}
                        </Badge>
                      ))}
                      {workspace.overdueAssessments.length > 0 && (
                        <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">
                          Assessment overdue
                        </Badge>
                      )}
                      {hasOverdueReview && (
                        <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">
                          Review overdue
                        </Badge>
                      )}
                      {!hasOverdueReview && hasDueReview && (
                        <Badge variant="outline" className="text-[10px] border-warning/40 text-warning-foreground">
                          Review due {workspace.nextReview}
                        </Badge>
                      )}
                    </div>

                    <RltDependencyEditor
                      domain={workspace.domain}
                      currentLevel={dependencyRecord?.dependencyLevel || null}
                      lastReviewedAt={dependencyRecord?.reviewedAt}
                      nextReviewDate={dependencyRecord?.nextReviewDate}
                      canEdit={canAccess("rlt_dependency.record", {
                        nursingHomeId: r.facilityId,
                        residentId: r.id,
                      })}
                      onSave={(value) => {
                        const now = new Date().toISOString();
                        saveRltDependency({
                          residentId: r.id,
                          rltDomainId: workspace.domain.id,
                          dependencyLevel: value.level,
                          effectiveFrom: now,
                          rationale: value.rationale,
                          reasonCode: value.reasonCode,
                          reasonText: value.reasonText,
                          source: dependencyRecord ? "dependency_review" : "manual_clinical_entry",
                        });
                        toast.success(`${workspace.domain.title} dependency saved`);
                      }}
                    />

                    {domainCoverageGaps.length > 0 && (
                      <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm">
                        <div className="space-y-1 text-warning-foreground">
                          {domainCoverageGaps.slice(0, 2).map((gap) => (
                            <p key={gap.id}>{gap.message}</p>
                          ))}
                        </div>
                        {workspace.carePlans.length === 0 && (
                          <div className="mt-2">
                            <CreateCarePlanDialog
                              residentId={r.id}
                              initialRltDomainId={workspace.domain.id}
                              currentDependencyLevel={dependencyRecord?.dependencyLevel || null}
                              onCreated={(problem) => openNewlyCreatedProblemDetail(problem.id)}
                              trigger={
                                <Button size="sm" variant="outline">
                                  Create Nursing Care Plan
                                </Button>
                              }
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {workspace.carePlans[0] && (
                      <div className="rounded-md bg-muted/25 px-3 py-2 text-sm">
                        <div className="line-clamp-1">{workspace.carePlans[0].problemStatement}</div>
                        <div className="text-xs text-muted-foreground">
                          Review {workspace.nextReview || "not set"}
                          {workspace.nextOutcomeReview ? ` · Outcome review ${workspace.nextOutcomeReview}` : ""}
                        </div>
                      </div>
                    )}
                    {workspace.carePlans.length === 0 && (
                      <div className="rounded-md bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                        0 Nursing Care Plans
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Dialog
            open={!!selectedActivityWorkspace}
            onOpenChange={(open) => {
              if (!open) setSelectedRltDomainId(null);
            }}
          >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Activity of Living: {selectedActivityWorkspace?.domain.title}
                </DialogTitle>
                <DialogDescription>
                  Assessment context, known risks and active nursing care plans for this activity.
                </DialogDescription>
              </DialogHeader>

              {selectedActivityWorkspace && (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Related Assessments</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {selectedActivityWorkspace.assessments.map((assessment) => (
                          <div key={assessment.id} className="flex items-center justify-between gap-2">
                            <div>
                              <div className="font-medium">
                                {assessmentMeta[assessment.type]?.name || assessment.type}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {assessment.interpretation} · {assessment.date.slice(0, 10)}
                              </div>
                            </div>
                            <Button asChild size="sm" variant="ghost">
                              <Link to="/assessments/$assessmentId" params={{ assessmentId: assessment.id }}>
                                Open
                              </Link>
                            </Button>
                          </div>
                        ))}
                        {selectedActivityWorkspace.assessments.length === 0 && (
                          <p className="text-sm text-muted-foreground">No related assessments recorded.</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Known Risks</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {selectedActivityWorkspace.knownRisks.map((risk, index) => (
                          <div key={`${risk}-${index}`} className="rounded-md border px-3 py-2">
                            {risk}
                          </div>
                        ))}
                        {selectedActivityWorkspace.dueActions.length > 0 && (
                          <div className="rounded-md border px-3 py-2">
                            {selectedActivityWorkspace.dueActions.length} care action
                            {selectedActivityWorkspace.dueActions.length === 1 ? "" : "s"} due
                          </div>
                        )}
                        {selectedActivityWorkspace.knownRisks.length === 0 &&
                          selectedActivityWorkspace.dueActions.length === 0 && (
                            <p className="text-sm text-muted-foreground">No high-risk indicators currently recorded.</p>
                          )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Nursing Care Plans</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedActivityWorkspace.carePlans.map((problem) => {
                        const planGoals = problemGoals.filter((goal) => goal.problemId === problem.id);
                        const actions = rProblemInterventions.filter((action) => action.problemId === problem.id);
                        const reviews = rProblemEvaluations.filter((review) => review.problemId === problem.id);
                        return (
                          <div key={problem.id} className="rounded-md border p-3 space-y-2">
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0">
                                <div className="font-medium line-clamp-1">{problem.problemStatement}</div>
                                <div className="text-xs text-muted-foreground">
                                  Plan: {planGoals[0]?.statement || "No plan recorded"}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedRltDomainId(null);
                                  openProblemDetail(problem.id);
                                }}
                              >
                                Open Care Plan
                              </Button>
                            </div>
                            <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                              <div>Care Actions: {actions.length}</div>
                              <div>Reviews: {reviews.length}</div>
                              <div>Next Review: {problem.reviewDate}</div>
                            </div>
                          </div>
                        );
                      })}
                      {selectedActivityWorkspace.carePlans.length === 0 && (
                        <p className="text-sm text-muted-foreground">No active nursing care plan for this activity.</p>
                      )}
                      {selectedActivityWorkspace.domain.id !== "safe_environment" &&
                        activeProblems.some(
                          (problem) =>
                            getRltDomainForCarePlanProblem(problem)?.id === "safe_environment",
                        ) && (
                          <div className="rounded-md border border-warning/30 bg-warning/5 p-3 space-y-2">
                            <div className="text-sm font-medium">Correct misplaced care plan</div>
                            <p className="text-xs text-muted-foreground">
                              Use this only for a care plan that was created for this Activity of Living but was
                              saved under Maintaining a Safe Environment.
                            </p>
                            <div className="space-y-2">
                              {activeProblems
                                .filter(
                                  (problem) =>
                                    getRltDomainForCarePlanProblem(problem)?.id === "safe_environment",
                                )
                                .map((problem) => (
                                  <div
                                    key={problem.id}
                                    className="flex flex-col gap-2 rounded-md bg-background px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
                                  >
                                    <div className="line-clamp-1">{problem.problemStatement}</div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        updateProblem(
                                          problem.id,
                                          {
                                            rltDomainId: selectedActivityWorkspace.domain.id,
                                            category:
                                              RLT_DOMAIN_TO_DEFAULT_CATEGORY[
                                                selectedActivityWorkspace.domain.id
                                              ],
                                          },
                                          `Corrected Activity of Living to ${selectedActivityWorkspace.domain.title}`,
                                        );
                                        toast.success("Care plan Activity of Living corrected");
                                      }}
                                    >
                                      Move Here
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>

                  <div className="flex flex-wrap gap-2">
                    <CreateCarePlanDialog
                      residentId={r.id}
                      initialRltDomainId={selectedActivityWorkspace.domain.id}
                      onCreated={(problem) => {
                        setSelectedRltDomainId(null);
                        openNewlyCreatedProblemDetail(problem.id);
                      }}
                      trigger={<Button size="sm">Create Nursing Care Plan</Button>}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!selectedActivityWorkspace.carePlans[0]}
                      onClick={() => {
                        const problem = selectedActivityWorkspace.carePlans[0];
                        if (!problem) return;
                        setSelectedRltDomainId(null);
                        openEvaluationDialog(problem.id);
                      }}
                    >
                      Record Review
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!selectedActivityWorkspace.carePlans[0]}
                      onClick={() => {
                        const problem = selectedActivityWorkspace.carePlans[0];
                        if (!problem) return;
                        setSelectedRltDomainId(null);
                        openAddInterventionForProblem(problem.id);
                      }}
                    >
                      Add Care Action
                    </Button>
                    {selectedActivityWorkspace.assessments[0] && (
                      <Button asChild size="sm" variant="outline">
                        <Link
                          to="/assessments/$assessmentId"
                          params={{ assessmentId: selectedActivityWorkspace.assessments[0].id }}
                        >
                          Open Assessment
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRltDomainId(null);
                        setTimelineDialogOpen(true);
                      }}
                    >
                      Open Resident Timeline
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {overviewHasMissingInfo ? (
              <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                Some resident information has not yet been completed.
              </div>
            ) : (
              <div />
            )}
            <Button size="sm" variant="outline" onClick={() => setOverviewOpen(true)}>
              Edit Overview Details
            </Button>
          </div>
          <EditOverviewDialog
            resident={r}
            open={overviewOpen}
            onOpenChange={setOverviewOpen}
            onSave={(patch) => {
              updateResident(r.id, patch);
              toast.success("Overview details updated");
            }}
          />
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User2 className="h-4 w-4" /> Clinical
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Primary diagnosis" value={r.primaryDiagnosis} />
                <Row label="Medical history" value={r.medicalHistory} />
                <Row label="Allergies" value={r.allergies} />
                <Row label="Mental capacity" value={r.mentalCapacity.replace("_", " ")} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Pill className="h-4 w-4" /> Medication
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>{r.currentMedication}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bed className="h-4 w-4" /> Bed Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Bed type" value={r.bed?.bedType?.replace("_", " ") || "â€”"} />
                <Row label="Mattress" value={r.bed?.mattressType?.replace("_", " ") || "â€”"} />
                <Row label="Installed" value={r.bed?.installationDate || "â€”"} />
                <Row label="Review date" value={r.bed?.reviewDate || "â€”"} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCog className="h-4 w-4" /> Key Workers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Named Nurse" value={r.keyWorkers?.namedNurse || "â€”"} />
                <Row label="Named Carer" value={r.keyWorkers?.namedCarer || "â€”"} />
                <Row label="Key Worker" value={r.keyWorkers?.keyWorker || "â€”"} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" /> GP / Consultant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="GP" value={r.gp} />
                <Row label="Consultant" value={r.consultant} />
                <Row label="Emergency contact" value={r.emergencyContact} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Communication" value={r.communicationNeeds} />
                <Row label="Religion" value={r.religion} />
                <Row label="Preferred language" value={r.preferredLanguage} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Latest Recorded</h2>
              {latestVital && (
                <p className="text-xs text-muted-foreground">
                  Recorded {latestVital.date} {latestVital.time} by{" "}
                  {latestVital.recordedByName || "Unknown"}
                </p>
              )}
            </div>
            <RecordObservationFlow
              residentId={r.id}
              onRecorded={() => setActiveTab("vitals")}
              trigger={<Button size="sm">Record New</Button>}
            />
          </div>
          <LatestVitalsCard vitals={residentVitals} resident={r} />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <RecordObservationFlow
                residentId={r.id}
                onRecorded={() => setActiveTab("vitals")}
                trigger={<Button variant="outline">Record New Observation</Button>}
              />
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Vitals Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {residentVitals.slice(0, 12).map((vital) => {
                  const news = calcNEWS2(vital);
                  const type = inferVitalRecordType(vital);
                  return (
                    <div
                      key={vital.id}
                      className="flex items-start gap-3 rounded-md border p-3 text-sm"
                    >
                      <div className="w-20 shrink-0 text-xs text-muted-foreground tabular-nums">
                        <div>{new Date(`${vital.date}T00:00:00`).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}</div>
                        <div>{vital.time}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{VITAL_TYPE_LABELS[type]}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatVitalValues(vital, residentVitals, r)}
                          {news.complete ? ` Â· NEWS2 ${news.total}` : ""}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        Open
                      </Badge>
                    </div>
                  );
                })}
                {residentVitals.length === 0 && (
                  <div className="rounded-md border p-8 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">No vital signs recorded.</p>
                    <RecordObservationFlow
                      residentId={r.id}
                      onRecorded={() => setActiveTab("vitals")}
                      trigger={<Button size="sm">Record First Vital Signs</Button>}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Trends</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <TrendCard
                    title="Weight Trend"
                    status={weightStatus}
                    detail={
                      weightValues.length >= 2
                        ? `${weightValues[0]}kg from ${weightValues[1]}kg`
                        : "More weight records needed"
                    }
                  />
                  <TrendCard
                    title="Temperature Trend"
                    status={temperatureStatus}
                    detail={
                      temperatureValues.length >= 2
                        ? `${temperatureValues[0]}Â°C from ${temperatureValues[1]}Â°C`
                        : "More temperature records needed"
                    }
                  />
                  <TrendCard
                    title="Pain Trend"
                    status={painStatus}
                    detail={
                      painValues.length >= 2
                        ? `${painValues[0]}/10 from ${painValues[1]}/10`
                        : "More pain records needed"
                    }
                  />
                  <TrendCard
                    title="Blood Glucose Trend"
                    status={glucoseStatus}
                    detail={
                      glucoseValues.length >= 2
                        ? `${glucoseValues[0]} mmol/L from ${glucoseValues[1]} mmol/L`
                        : "More glucose records needed"
                    }
                  />
                  {!weightStatus && !temperatureStatus && !painStatus && !glucoseStatus && (
                    <div className="rounded-md border p-4 text-sm text-muted-foreground">
                      Trends appear when two or more readings exist for the same observation type.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Link to="/residents/$id/assessments" params={{ id: r.id }}>
              <Button size="sm">
                <Activity className="h-3 w-3 mr-1" /> Assessment Work Queue
              </Button>
            </Link>
            <Link to="/residents/$id/quality-of-life" params={{ id: r.id }}>
              <Button size="sm" variant="outline">
                Quality of Life
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6 mx-1" />
            {(
              [
                "barthel",
                "waterlow",
                "abbey_pain",
                "mna",
                "norton",
                "nutrition",
                "pinch_me",
              ] as const
            ).map((t) => (
              <Link
                key={t}
                to="/assessments/new/$residentId"
                params={{ residentId: r.id }}
                search={{ type: t } as any}
              >
                <Button size="sm" variant="outline">
                  <Plus className="h-3 w-3 mr-1" /> {assessmentMeta[t].name}
                </Button>
              </Link>
            ))}
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Assessment</th>
                      <th className="text-left p-3">Score</th>
                      <th className="text-left p-3">Risk</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Completed By</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Next</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rA.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/30">
                        <td className="p-3">
                          <Link
                            to="/assessments/$assessmentId"
                            params={{ assessmentId: a.id }}
                            className="font-medium hover:text-primary"
                          >
                            {assessmentMeta[a.type].name}
                          </Link>
                        </td>
                        <td className="p-3 tabular-nums font-semibold">{a.totalScore}</td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${riskColor(a.riskLevel)}`}
                          >
                            {a.interpretation}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {a.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs">
                          {a.assessor}
                          <br />
                          <span className="text-muted-foreground capitalize">{a.assessorRole}</span>
                        </td>
                        <td className="p-3 text-xs">{a.date.slice(0, 10)}</td>
                        <td className="p-3 text-xs">{a.nextReassessmentDate || "â€”"}</td>
                        <td className="p-3 text-right">
                          <div className="inline-flex gap-1 items-center">
                            <Link to="/assessments/$assessmentId" params={{ assessmentId: a.id }}>
                              <Button size="sm" variant="ghost" className="h-7 text-[11px]">
                                View
                              </Button>
                            </Link>
                            {a.status === "completed" &&
                              !a.supersededById &&
                              can(currentRole, "assessment.create") && (
                                <Link
                                  to="/assessments/new/$residentId"
                                  params={{ residentId: r.id }}
                                  search={{ type: a.type } as any}
                                >
                                  <Button size="sm" variant="outline" className="h-7 text-[11px]">
                                    <Plus className="h-3 w-3 mr-1" /> Start Assessment
                                  </Button>
                                </Link>
                              )}
                            {can(currentRole, "assessment.delete") && (
                              <DeleteAssessmentDialog
                                id={a.id}
                                onConfirm={(reason) => {
                                  softDeleteAssessment(a.id, reason);
                                  toast.success("Assessment soft-deleted (audited)");
                                }}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rA.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                          No assessments yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {rADeleted.length > 0 && (
            <details className="border rounded-md p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                Deleted assessments ({rADeleted.length}) â€” audit trail
              </summary>
              <div className="mt-2 space-y-2">
                {rADeleted.map((a) => (
                  <div
                    key={a.id}
                    className="text-xs text-muted-foreground border-l-2 border-destructive/40 pl-3"
                  >
                    <strong>{assessmentMeta[a.type].name}</strong> Â· {a.date.slice(0, 10)}
                    <br />
                    Deleted by {a.deletedBy} on {a.deletedAt?.slice(0, 10)} â€” {a.deletedReason}
                  </div>
                ))}
              </div>
            </details>
          )}
        </TabsContent>

        <TabsContent value="careplans" className="hidden">
          <Link to="/residents/$id/care-plan" params={{ id: r.id }}>
            <Button size="sm">
              <ClipboardList className="h-3 w-3 mr-1" /> Open Unified Care Plan
            </Button>
          </Link>
          {rP.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Link
                    to="/care-plans/$id"
                    params={{ id: c.id }}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {c.title}
                  </Link>
                  <Badge variant="outline" className="capitalize">
                    {c.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>Problem:</strong> {c.problem}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Plan:</strong> {c.goal}
                </p>
                <ul className="text-sm mt-2 list-disc pl-5 space-y-0.5">
                  {c.interventions.map((i, k) => (
                    <li key={k}>{i}</li>
                  ))}
                </ul>
                <Separator className="my-3" />
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground items-center">
                  <span>
                    <Calendar className="h-3 w-3 inline mr-1" /> Review {c.reviewDate}
                  </span>
                  <span>Frequency: {c.frequency}</span>
                  <span>Assigned: {c.assignedStaff}</span>
                  <div className="flex-1" />
                  <Link
                    to="/care-plans/$id"
                    params={{ id: c.id }}
                    className="text-primary hover:underline"
                  >
                    Open plan â†’
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {rP.length === 0 && (
            <div className="rounded-md border p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">No active care plans.</p>
              <CreateCarePlanDialog
                residentId={r.id}
                onCreated={(problem) => openNewlyCreatedProblemDetail(problem.id)}
                trigger={
                  <Button size="sm">
                  <ClipboardList className="h-3 w-3 mr-1" /> Create Nursing Care Plan
                  </Button>
                }
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-2">
          {rN.map((n) => (
            <Card key={n.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{n.date.slice(0, 10)}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {n.shift}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{n.staff}</span>
                </div>
                <p className="text-sm mt-1">{n.observation}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground mt-2">
                  <span>Mood: {n.mood}</span>
                  <span>Food: {n.foodIntake}</span>
                  <span>Fluids: {n.fluidIntake}</span>
                  <span>Sleep: {n.sleep}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="interventions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Care Action Operations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Intervention</th>
                      <th className="text-left p-3">Problem</th>
                      <th className="text-left p-3">Frequency</th>
                      <th className="text-left p-3">Assigned To</th>
                      <th className="text-left p-3">Start</th>
                      <th className="text-left p-3">Review</th>
                      <th className="text-left p-3">End</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rProblemInterventions.map((intv) => {
                      const problem = rProblems.find((p) => p.id === intv.problemId);
                      return (
                        <tr key={intv.id} className="hover:bg-muted/30">
                          <td className="p-3 font-medium">{intv.name}</td>
                          <td className="p-3 text-xs">{problem?.problemStatement || "â€”"}</td>
                          <td className="p-3 text-xs">{intv.frequencyType.replace(/_/g, " ")}</td>
                          <td className="p-3 text-xs">
                            {intv.assignedStaffName || intv.assignedRole || "â€”"}
                          </td>
                          <td className="p-3 text-xs">{intv.startDate}</td>
                          <td className="p-3 text-xs">{intv.reviewDate}</td>
                          <td className="p-3 text-xs">{intv.endDate}</td>
                          <td className="p-3 text-xs capitalize">
                            {intv.status.replace(/_/g, " ")}
                          </td>
                          <td className="p-3 text-right">
                            <div className="inline-flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[11px]"
                                onClick={() => handleRecordCompletion(intv)}
                                disabled={!rolePermissions.canComplete}
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[11px]"
                                onClick={() => handleReviewIntervention(intv, "extend")}
                                disabled={!rolePermissions.canEdit}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px]"
                                onClick={() =>
                                  applyInterventionStatus(
                                    intv,
                                    "discontinued",
                                    "Disabled by role action",
                                  )
                                }
                                disabled={!rolePermissions.canDisable}
                              >
                                <Ban className="h-3 w-3 mr-1" />
                                Disable
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px]"
                                onClick={() =>
                                  applyInterventionStatus(intv, "superseded", "Archived")
                                }
                                disabled={!rolePermissions.canArchiveDelete}
                              >
                                <Archive className="h-3 w-3 mr-1" />
                                Archive
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] text-destructive"
                                onClick={() =>
                                  applyInterventionStatus(intv, "cancelled", "Soft deleted")
                                }
                                disabled={!rolePermissions.canArchiveDelete}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {rProblemInterventions.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-sm text-muted-foreground">
                          No care actions defined for this resident.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-2">
          {rIncidents.map((i) => (
            <Card key={i.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-medium capitalize">
                    {i.type.replace("_", " ")} â€” {i.date}
                  </div>
                  <div className="flex gap-1.5">
                    <Badge variant="outline" className="capitalize">
                      {i.severity}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {i.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm mt-1">{i.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Action: {i.immediateAction} Â· Reported by {i.reportedBy}
                </p>
              </CardContent>
            </Card>
          ))}
          {rIncidents.length === 0 && (
            <p className="text-sm text-muted-foreground">No incidents recorded.</p>
          )}
        </TabsContent>

        <TabsContent value="mdt" className="space-y-2">
          {rMDT.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4">
                <div className="text-sm font-medium">
                  {m.date} Â· {m.meetingType || "MDT"} Â· {m.authoredBy}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Attendees: {m.attendees}</p>
                <p className="text-sm mt-2">
                  <strong>Discussion:</strong> {m.discussion}
                </p>
                <p className="text-sm">
                  <strong>Recommendations:</strong> {m.recommendations}
                </p>
                {m.followUpDate && (
                  <p className="text-xs text-muted-foreground mt-1">Follow-up: {m.followUpDate}</p>
                )}
              </CardContent>
            </Card>
          ))}
          {rMDT.length === 0 && (
            <p className="text-sm text-muted-foreground">No MDT meetings recorded.</p>
          )}
        </TabsContent>

        <TabsContent value="visitors" className="space-y-2">
          {rVisitors.map((v) => (
            <Card key={v.id}>
              <CardContent className="p-4">
                <div className="text-sm font-medium">
                  {v.visitorName}{" "}
                  <span className="text-xs text-muted-foreground">({v.relationship})</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {v.date} Â· {v.arrivalTime}â€“{v.departureTime} Â· Signed in by {v.signedInBy}
                </p>
                {v.notes && <p className="text-sm mt-1">{v.notes}</p>}
              </CardContent>
            </Card>
          ))}
          {rVisitors.length === 0 && (
            <p className="text-sm text-muted-foreground">No visitor records.</p>
          )}
        </TabsContent>

        <TabsContent value="outings" className="space-y-2">
          {rOutings.map((o) => (
            <Card key={o.id}>
              <CardContent className="p-4">
                <div className="text-sm font-medium">
                  {o.destination} â€” {o.date}
                </div>
                <p className="text-xs text-muted-foreground">
                  {o.departureTime}â€“{o.returnTime} Â· {o.transportMethod} Â· With {o.accompaniedBy}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Risk assessment: {o.riskAssessmentCompleted ? "Completed" : "Not completed"}
                </p>
                {o.notes && <p className="text-sm mt-1">{o.notes}</p>}
              </CardContent>
            </Card>
          ))}
          {rOutings.length === 0 && (
            <p className="text-sm text-muted-foreground">No outings recorded.</p>
          )}
        </TabsContent>

        <TabsContent value="handovers" className="space-y-2">
          {rHandovers.map((h) => (
            <Card key={h.id}>
              <CardContent className="p-4">
                <div className="text-sm font-medium capitalize">
                  {h.shift} shift â€” {h.date}
                </div>
                <p className="text-xs text-muted-foreground">{h.staff}</p>
                <p className="text-sm mt-1">{h.summary}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Outstanding:</strong> {h.outstandingActions}
                </p>
              </CardContent>
            </Card>
          ))}
          {rHandovers.length === 0 && (
            <p className="text-sm text-muted-foreground">No handover notes.</p>
          )}
        </TabsContent>

        <TabsContent value="nok" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={nokOpen} onOpenChange={setNokOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Next of Kin
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Next of Kin</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Name</Label>
                    <Input
                      value={newNok.name}
                      onChange={(e) => setNewNok({ ...newNok, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <Input
                      value={newNok.relationship}
                      onChange={(e) => setNewNok({ ...newNok, relationship: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={newNok.phone}
                      onChange={(e) => setNewNok({ ...newNok, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Mobile</Label>
                    <Input
                      value={newNok.mobile}
                      onChange={(e) => setNewNok({ ...newNok, mobile: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={newNok.email}
                      onChange={(e) => setNewNok({ ...newNok, email: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Input
                      value={newNok.address}
                      onChange={(e) => setNewNok({ ...newNok, address: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-2 text-sm">
                    <label className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={newNok.primaryContact}
                        onChange={(e) => setNewNok({ ...newNok, primaryContact: e.target.checked })}
                      />{" "}
                      Primary contact
                    </label>
                    <label className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={newNok.emergencyContact}
                        onChange={(e) =>
                          setNewNok({ ...newNok, emergencyContact: e.target.checked })
                        }
                      />{" "}
                      Emergency contact
                    </label>
                    <label className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={newNok.powerOfAttorney}
                        onChange={(e) =>
                          setNewNok({ ...newNok, powerOfAttorney: e.target.checked })
                        }
                      />{" "}
                      Power of attorney
                    </label>
                    <label className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={newNok.legalRepresentative}
                        onChange={(e) =>
                          setNewNok({ ...newNok, legalRepresentative: e.target.checked })
                        }
                      />{" "}
                      Legal representative
                    </label>
                  </div>
                  <div className="col-span-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={newNok.notes}
                      onChange={(e) => setNewNok({ ...newNok, notes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNokOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (!newNok.name) {
                        toast.error("Name required");
                        return;
                      }
                      addNextOfKin(r.id, newNok);
                      setNewNok({
                        name: "",
                        relationship: "",
                        phone: "",
                        mobile: "",
                        email: "",
                        address: "",
                        notes: "",
                        primaryContact: false,
                        emergencyContact: false,
                        powerOfAttorney: false,
                        legalRepresentative: false,
                      });
                      setNokOpen(false);
                      toast.success("Next of kin added");
                    }}
                  >
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {(r.nextOfKinList || []).map((n) => (
            <Card key={n.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-medium">
                      {n.name}{" "}
                      <span className="text-xs text-muted-foreground">({n.relationship})</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {n.phone || n.mobile} Â· {n.email}
                    </div>
                    {n.address && <div className="text-xs text-muted-foreground">{n.address}</div>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {n.primaryContact && (
                      <Badge variant="default" className="text-[10px]">
                        Primary
                      </Badge>
                    )}
                    {n.emergencyContact && (
                      <Badge variant="outline" className="text-[10px]">
                        Emergency
                      </Badge>
                    )}
                    {n.powerOfAttorney && (
                      <Badge variant="outline" className="text-[10px]">
                        PoA
                      </Badge>
                    )}
                    {n.legalRepresentative && (
                      <Badge variant="outline" className="text-[10px]">
                        Legal Rep
                      </Badge>
                    )}
                  </div>
                </div>
                {n.notes && <p className="text-sm mt-2 text-muted-foreground">{n.notes}</p>}
              </CardContent>
            </Card>
          ))}
          {(!r.nextOfKinList || r.nextOfKinList.length === 0) && (
            <p className="text-sm text-muted-foreground">No next of kin recorded.</p>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alerts & Risks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between border rounded-md p-2">
                <span>High Risk Resident Flags</span>
                <Badge variant="outline">{highRiskFlags.length}</Badge>
              </div>
              <div className="flex items-center justify-between border rounded-md p-2">
                <span>Overdue Assessments</span>
                <Badge variant="outline">{overdueAssessments.length}</Badge>
              </div>
              <div className="flex items-center justify-between border rounded-md p-2">
                <span>Overdue Reviews</span>
                <Badge variant="outline">{overdueProblemReviews.length}</Badge>
              </div>
              <div className="flex items-center justify-between border rounded-md p-2">
                <span>Open Incidents</span>
                <Badge variant="outline">{openIncidents.length}</Badge>
              </div>
              <div className="flex items-center justify-between border rounded-md p-2">
                <span>Clinical Alerts</span>
                <Badge variant="outline">{openAlertCount}</Badge>
              </div>
              <div className="border rounded-md p-2 space-y-2">
                <div className="font-medium text-sm">Outstanding Actions</div>
                {openTasks.length > 0 ? (
                  <div className="space-y-1">
                    {openTasks.slice(0, 3).map((task) => {
                      const taskDate = task.dueDate.slice(0, 10);
                      let dueLabel = `Due ${taskDate}`;
                      if (taskDate < todayKey) dueLabel = "Overdue";
                      else if (taskDate === todayKey) dueLabel = "Due Today";
                      else if (taskDate === tomorrowKey) dueLabel = "Due Tomorrow";

                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="truncate">{task.title}</span>
                          <span className="text-muted-foreground whitespace-nowrap">
                            {dueLabel}
                          </span>
                        </div>
                      );
                    })}
                    {openTasks.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{openTasks.length - 3} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">No Outstanding Actions</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clinical Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rAlerts.length > 0 ? (
                rAlerts.map((a) => (
                  <div key={a.id} className="border rounded-md p-3 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning-foreground" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{a.title}</div>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {a.priority}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No clinical alerts recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-2">
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div className="border rounded-md p-2 text-center">
              <div className="text-xs text-muted-foreground">Upcoming Actions</div>
              <div className="font-semibold tabular-nums">{taskOps.upcoming.length}</div>
            </div>
            <div className="border rounded-md p-2 text-center">
              <div className="text-xs text-muted-foreground">Overdue Actions</div>
              <div className="font-semibold tabular-nums text-destructive">
                {taskOps.overdue.length}
              </div>
            </div>
            <div className="border rounded-md p-2 text-center">
              <div className="text-xs text-muted-foreground">Completed Today</div>
              <div className="font-semibold tabular-nums">{taskOps.completedToday.length}</div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overdue Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {taskOps.overdue.map((t) => (
                <div
                  key={t.id}
                  className="border rounded-md p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-medium text-sm">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Assigned to {t.assignedTo} Â· Due {t.dueDate}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-destructive/10 text-destructive border-destructive/30"
                  >
                    Overdue
                  </Badge>
                </div>
              ))}
              {taskOps.overdue.length === 0 && (
                <p className="text-sm text-muted-foreground">No overdue actions.</p>
              )}
            </CardContent>
          </Card>

          {rTasks.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Due {t.dueDate} Â· {t.assignedTo}
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {t.status}
                </Badge>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Action History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rTasks
                .slice()
                .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
                .map((t) => (
                  <div key={t.id} className="text-xs border rounded-md p-2">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-muted-foreground">
                      Progress: {t.status} Â· Due: {t.dueDate} Â· Assigned To: {t.assignedTo}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={latestVitalsDialogOpen} onOpenChange={setLatestVitalsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Latest Vitals</DialogTitle>
            <DialogDescription>
              Most recent recorded vital signs for this resident.
            </DialogDescription>
          </DialogHeader>
          <LatestVitalsCard vitals={rVitals} resident={r} />
        </DialogContent>
      </Dialog>

      <Dialog open={timelineDialogOpen} onOpenChange={setTimelineDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resident Timeline</DialogTitle>
            <DialogDescription>Newest first, filter by clinical module.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              ["all", "All"],
              ["assessments", "Assessments"],
              ["careplans", "Nursing Care Plans"],
              ["interventions", "Care Actions"],
              ["evaluations", "Reviews"],
              ["incidents", "Incidents"],
              ["mdt", "MDT"],
              ["tasks", "Actions"],
              ["vitals", "Vitals"],
              ["visitors", "Visitors"],
              ["outings", "Outings"],
            ].map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={timelineFilter === key ? "default" : "outline"}
                onClick={() => setTimelineFilter(key as any)}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            {filteredTimelineEntries.map((e) => (
              <div key={e.id} className="border rounded-md p-3">
                <div className="text-xs text-muted-foreground">
                  {`${e.at}`.slice(0, 16).replace("T", " ")}
                </div>
                <div className="text-sm font-medium">{e.title}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {e.module} Â· {e.summary || "â€”"} Â· {e.by || "System"}
                </div>
              </div>
            ))}
            {filteredTimelineEntries.length === 0 && (
              <p className="text-sm text-muted-foreground">No timeline records for this filter.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resident Audit History</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Module</th>
                  <th className="text-left p-2">Action</th>
                  <th className="text-left p-2">Old Value</th>
                  <th className="text-left p-2">New Value</th>
                  <th className="text-left p-2">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {residentAuditRows.map((row) => (
                  <tr key={row.id}>
                    <td className="p-2 text-xs">{row.timestamp.slice(0, 10)}</td>
                    <td className="p-2 text-xs">{row.timestamp.slice(11, 16)}</td>
                    <td className="p-2 text-xs">{row.user}</td>
                    <td className="p-2 text-xs capitalize">{row.role || "â€”"}</td>
                    <td className="p-2 text-xs">{row.module}</td>
                    <td className="p-2 text-xs">{row.action}</td>
                    <td className="p-2 text-xs truncate max-w-40">{row.before || "â€”"}</td>
                    <td className="p-2 text-xs truncate max-w-40">{row.after || "â€”"}</td>
                    <td className="p-2 text-xs">{row.reason || "â€”"}</td>
                  </tr>
                ))}
                {residentAuditRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-sm text-muted-foreground">
                      No resident audit entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left p-2">Module</th>
                  <th className="text-left p-2">Record</th>
                  <th className="text-left p-2">Version</th>
                  <th className="text-left p-2">Created By</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Reason</th>
                  <th className="text-left p-2">Superseded By</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {residentVersionRows.map((row) => (
                  <tr key={row.key}>
                    <td className="p-2 text-xs">{row.module}</td>
                    <td className="p-2 text-xs">{row.name}</td>
                    <td className="p-2 text-xs">v{row.version}</td>
                    <td className="p-2 text-xs">{row.createdBy}</td>
                    <td className="p-2 text-xs">{`${row.date}`.slice(0, 16).replace("T", " ")}</td>
                    <td className="p-2 text-xs">{row.reason || "â€”"}</td>
                    <td className="p-2 text-xs">{row.supersededBy || "â€”"}</td>
                  </tr>
                ))}
                {residentVersionRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                      No version history entries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Components */}
      <AddDailyNoteModal
        open={modalState.note}
        onOpenChange={(open) => handleCloseModal("note")}
        residentId={r.id}
      />

      <AddInterventionModal
        open={modalState.intervention}
        onOpenChange={(open) => {
          handleCloseModal("intervention");
          if (!open) setPresetInterventionProblemId(undefined);
        }}
        residentId={r.id}
        initialProblemId={presetInterventionProblemId}
        lockProblemSelection={!!presetInterventionProblemId}
      />

      <AddInterventionCompletionModal
        open={modalState.interventionCompletion}
        onOpenChange={(open) => handleCloseModal("interventionCompletion")}
        intervention={selectedIntervention}
        residentId={r.id}
      />

      <InterventionReviewModal
        open={modalState.interventionReview}
        onOpenChange={(open) => handleCloseModal("interventionReview")}
        intervention={selectedIntervention}
        action={selectedReviewAction}
        onSuccess={() => {
          handleCloseModal("interventionReview");
          setSelectedIntervention(null);
          setSelectedReviewAction(null);
        }}
      />

      <AddAssessmentModal
        open={modalState.assessment}
        onOpenChange={(open) => handleCloseModal("assessment")}
        residentId={r.id}
      />

      <AddTaskModal
        open={modalState.task}
        onOpenChange={(open) => handleCloseModal("task")}
        residentId={r.id}
      />

      <IncidentDialog
        open={modalState.incident}
        onOpenChange={(open) => handleCloseModal("incident")}
        mode="create"
        defaultResidentId={r.id}
      />

      <AddMDTNoteModal
        open={modalState.mdt}
        onOpenChange={(open) => handleCloseModal("mdt")}
        residentId={r.id}
      />

      <VisitorDialog
        open={modalState.visitor}
        onOpenChange={(open) => handleCloseModal("visitor")}
        mode="create"
        defaultResidentId={r.id}
      />

      <OutingDialog
        open={modalState.outing}
        onOpenChange={(open) => handleCloseModal("outing")}
        mode="create"
        defaultResidentId={r.id}
      />

      <Dialog
        open={problemDetailOpen}
        onOpenChange={(open) => {
          setProblemDetailOpen(open);
          if (!open && carePlanProblemId) {
            navigate({ to: "/residents/$id", params: { id }, search: {} });
          }
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nursing Care Plan</DialogTitle>
            <DialogDescription>
              {selectedProblem
                ? `${selectedProblem.problemStatement}`
                : "Select a nursing care plan from Active Nursing Care Plans."}
            </DialogDescription>
          </DialogHeader>

          {selectedProblem && (
            <div className="space-y-4">
              {selectedProblem.status === "active" && rolePermissions.canSetCarePlanInactive && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setInactiveProblemReason("");
                      setInactiveProblemOpen(true);
                    }}
                  >
                    <Archive className="h-3 w-3 mr-1" /> Set Inactive
                  </Button>
                </div>
              )}
              {newlyCreatedProblemId === selectedProblem.id &&
                selectedProblemInterventions.length === 0 && (
                  <div className="rounded-md border bg-muted/20 p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">Next Recommended Steps</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Continue from this problem detail when you are ready.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => openAddInterventionForProblem(selectedProblem.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Care Action
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAddEvaluationForProblem(selectedProblem.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Review Later
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nursing Care Plan</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-2 text-sm">
                  <Row label="Care need" value={selectedProblem.problemStatement} />
                  <Row label="Category" value={selectedProblem.category.replace(/_/g, " ")} />
                  <Row label="Risk level" value={selectedProblem.riskLevel.replace(/_/g, " ")} />
                  <Row
                    label="Activity of Living"
                    value={getRltDomainForCarePlanProblem(selectedProblem)?.title || "Mapped from care area"}
                  />
                  <Row label="Created date" value={selectedProblem.createdAt.slice(0, 10)} />
                  <Row label="Created by" value={selectedProblem.createdBy} />
                  <Row label="Progress" value={selectedProblem.status} />
                  <Row label="Care Plan Review Date" value={selectedProblem.reviewDate} />
                  <Row label="Next Review of Outcome" value={selectedProblem.evaluationDate} />
                  <Row
                    label="Source assessment"
                    value={
                      selectedProblem.sourceAssessmentType ||
                      selectedProblem.sourceAssessmentId ||
                      "â€”"
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid md:grid-cols-3 gap-2">
                    <Input
                      placeholder="Add plan"
                      value={goalDraft.statement}
                      onChange={(e) => setGoalDraft((s) => ({ ...s, statement: e.target.value }))}
                    />
                    <Input
                      type="date"
                      value={goalDraft.targetDate}
                      onChange={(e) => setGoalDraft((s) => ({ ...s, targetDate: e.target.value }))}
                    />
                    <Button onClick={submitAddGoal}>Add Plan</Button>
                  </div>
                  {selectedProblemGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="border rounded-md p-2 grid md:grid-cols-5 gap-2 items-center text-sm"
                    >
                      <div className="md:col-span-2">{goal.statement}</div>
                      <div className="text-xs">{goal.targetDate || "â€”"}</div>
                      <div className="text-xs capitalize">{goal.status.replace(/_/g, " ")}</div>
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateGoal(goal.id, { status: "achieved" })}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateGoal(goal.id, { status: "discontinued" })}
                        >
                          Archive
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => removeGoal(goal.id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Care Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => openAddInterventionForProblem(selectedProblem.id)}
                    >
                      Add Care Action
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="text-left p-2">Intervention</th>
                          <th className="text-left p-2">Frequency</th>
                          <th className="text-left p-2">Assigned</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Start</th>
                          <th className="text-left p-2">Review</th>
                          <th className="text-right p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedProblemInterventions.map((intv) => {
                          return (
                            <tr key={intv.id}>
                              <td className="p-2">{intv.name}</td>
                              <td className="p-2 text-xs">
                                {intv.frequencyType.replace(/_/g, " ")}
                              </td>
                              <td className="p-2 text-xs">
                                {intv.assignedStaffName || intv.assignedRole || "â€”"}
                              </td>
                              <td className="p-2 text-xs">{intv.status.replace(/_/g, " ")}</td>
                              <td className="p-2 text-xs">{intv.startDate}</td>
                              <td className="p-2 text-xs">{intv.reviewDate}</td>
                              <td className="p-2 text-right">
                                <div className="inline-flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRecordCompletion(intv)}
                                  >
                                    Open
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReviewIntervention(intv, "extend")}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      discontinueProblemIntervention(
                                        intv.id,
                                        "Discontinued from problem detail",
                                      )
                                    }
                                  >
                                    Discontinue
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => openAddEvaluationForProblem(selectedProblem.id)}
                    >
                      Add Review
                    </Button>
                  </div>
                  {selectedProblemEvaluations.map((evl) => (
                    <div key={evl.id} className="border rounded-md p-2 text-sm">
                      <div className="font-medium">
                        {evl.date.slice(0, 10)} Â· {evl.evaluatorName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Progress: {evl.progress.replace(/_/g, " ")} Â· Plan Met: {evl.goalsMet}
                      </div>
                      <div className="text-xs">Outcome: {evl.recommendations || "â€”"}</div>
                      <div className="text-xs text-muted-foreground">
                        Next Review of Outcome: {evl.nextEvaluationDate || "â€”"}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={inactiveProblemOpen} onOpenChange={setInactiveProblemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Nursing Care Plan Inactive</DialogTitle>
            <DialogDescription>
              This will set this nursing care plan as inactive and also set all linked
              care actions as inactive. The record will remain available for audit/history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason for inactivation *</Label>
            <Textarea
              value={inactiveProblemReason}
              onChange={(event) => setInactiveProblemReason(event.target.value)}
              placeholder="Enter the clinical reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInactiveProblemOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitSetProblemInactive}
              disabled={!inactiveProblemReason.trim()}
            >
              Set Inactive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={evaluationOpen} onOpenChange={setEvaluationOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Review</DialogTitle>
            <DialogDescription>
              {selectedProblem
                ? `Resident and nursing care plan are pre-linked: ${selectedProblem.problemStatement}`
                : "Select a nursing care plan first."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Review Date</Label>
              <Input
                type="date"
                value={evaluationDraft.date}
                onChange={(e) => setEvaluationDraft((s) => ({ ...s, date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Reviewed By</Label>
              <Input value={currentUserName} disabled />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={evaluationDraft.summary}
                onChange={(e) => setEvaluationDraft((s) => ({ ...s, summary: e.target.value }))}
              />
            </div>
            <div>
              <Label>Plan Met?</Label>
              <Select
                value={evaluationDraft.goalsMet}
                onValueChange={(v) => setEvaluationDraft((s) => ({ ...s, goalsMet: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Progress</Label>
              <Select
                value={evaluationDraft.progress}
                onValueChange={(v) => setEvaluationDraft((s) => ({ ...s, progress: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="improved">Improved</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="deteriorated">Deteriorated</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="requires_revision">Requires Revision</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Outcome</Label>
              <Textarea
                value={evaluationDraft.recommendations}
                onChange={(e) =>
                  setEvaluationDraft((s) => ({ ...s, recommendations: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Next Review Date</Label>
              <Input
                type="date"
                value={evaluationDraft.nextEvaluationDate}
                onChange={(e) =>
                  setEvaluationDraft((s) => ({ ...s, nextEvaluationDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Continue / Amend Plan</Label>
              <Select
                value={evaluationDraft.revisionRequired}
                onValueChange={(v) => setEvaluationDraft((s) => ({ ...s, revisionRequired: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Continue Plan</SelectItem>
                  <SelectItem value="yes">Amend Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {evaluationDraft.revisionRequired === "yes" && (
              <>
                <div className="md:col-span-2">
                  <Label>Amendment Notes</Label>
                  <Textarea
                    value={evaluationDraft.revisionReason}
                    onChange={(e) =>
                      setEvaluationDraft((s) => ({ ...s, revisionReason: e.target.value }))
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Add Care Action (optional)</Label>
                  <Input
                    value={evaluationDraft.revisionAddIntervention}
                    onChange={(e) =>
                      setEvaluationDraft((s) => ({
                        ...s,
                        revisionAddIntervention: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Remove Care Action</Label>
                  <Select
                    value={evaluationDraft.revisionDiscontinueInterventionId}
                    onValueChange={(v) =>
                      setEvaluationDraft((s) => ({ ...s, revisionDiscontinueInterventionId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select care action" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProblemInterventions.map((intv) => (
                        <SelectItem key={intv.id} value={intv.id}>
                          {intv.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Change Frequency For</Label>
                  <Select
                    value={evaluationDraft.revisionChangeInterventionId}
                    onValueChange={(v) =>
                      setEvaluationDraft((s) => ({ ...s, revisionChangeInterventionId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select care action" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProblemInterventions.map((intv) => (
                        <SelectItem key={intv.id} value={intv.id}>
                          {intv.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>New Frequency</Label>
                  <Select
                    value={evaluationDraft.revisionFrequencyType}
                    onValueChange={(v) =>
                      setEvaluationDraft((s) => ({ ...s, revisionFrequencyType: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="every_2_hours">Every 2 Hours</SelectItem>
                      <SelectItem value="every_4_hours">Every 4 Hours</SelectItem>
                      <SelectItem value="every_6_hours">Every 6 Hours</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="twice_daily">Twice Daily</SelectItem>
                      <SelectItem value="three_times_daily">Three Times Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Update Plan</Label>
                  <Select
                    value={evaluationDraft.revisionUpdateGoalId}
                    onValueChange={(v) =>
                      setEvaluationDraft((s) => ({ ...s, revisionUpdateGoalId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProblemGoals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.statement}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Updated Plan Text</Label>
                  <Input
                    value={evaluationDraft.revisionGoalText}
                    onChange={(e) =>
                      setEvaluationDraft((s) => ({ ...s, revisionGoalText: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Care Plan Review Date</Label>
                  <Input
                    type="date"
                    value={evaluationDraft.revisionReviewDate}
                    onChange={(e) =>
                      setEvaluationDraft((s) => ({ ...s, revisionReviewDate: e.target.value }))
                    }
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEvaluationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitEvaluation}>Save Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type OverviewDraft = {
  primaryDiagnosis: string;
  medicalHistory: string;
  allergies: string;
  mentalCapacity: Resident["mentalCapacity"];
  currentMedication: string;
  bedType: NonNullable<Resident["bed"]>["bedType"] | "";
  mattressType: NonNullable<Resident["bed"]>["mattressType"] | "";
  installationDate: string;
  reviewDate: string;
  namedNurse: string;
  namedCarer: string;
  keyWorker: string;
  gp: string;
  consultant: string;
  emergencyContact: string;
  communicationNeeds: string;
  religion: string;
  preferredLanguage: string;
};

function overviewDraft(resident: Resident): OverviewDraft {
  return {
    primaryDiagnosis: resident.primaryDiagnosis || "",
    medicalHistory: resident.medicalHistory || "",
    allergies: resident.allergies || "",
    mentalCapacity: resident.mentalCapacity || "not_assessed",
    currentMedication: resident.currentMedication || "",
    bedType: resident.bed?.bedType || "",
    mattressType: resident.bed?.mattressType || "",
    installationDate: resident.bed?.installationDate || "",
    reviewDate: resident.bed?.reviewDate || "",
    namedNurse: resident.keyWorkers?.namedNurse || "",
    namedCarer: resident.keyWorkers?.namedCarer || "",
    keyWorker: resident.keyWorkers?.keyWorker || "",
    gp: resident.gp || "",
    consultant: resident.consultant || "",
    emergencyContact: resident.emergencyContact || "",
    communicationNeeds: resident.communicationNeeds || "",
    religion: resident.religion || "",
    preferredLanguage: resident.preferredLanguage || "",
  };
}

function EditOverviewDialog({
  resident,
  open,
  onOpenChange,
  onSave,
}: {
  resident: Resident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: Partial<Resident>) => void;
}) {
  const [draft, setDraft] = useState(() => overviewDraft(resident));
  const update = (patch: Partial<OverviewDraft>) => setDraft((current) => ({ ...current, ...patch }));

  const save = () => {
    onSave({
      primaryDiagnosis: draft.primaryDiagnosis.trim(),
      medicalHistory: draft.medicalHistory.trim(),
      allergies: draft.allergies.trim(),
      mentalCapacity: draft.mentalCapacity,
      currentMedication: draft.currentMedication.trim(),
      gp: draft.gp.trim(),
      consultant: draft.consultant.trim(),
      emergencyContact: draft.emergencyContact.trim(),
      communicationNeeds: draft.communicationNeeds.trim(),
      religion: draft.religion.trim(),
      preferredLanguage: draft.preferredLanguage.trim(),
      bed: draft.bedType || draft.mattressType || draft.installationDate || draft.reviewDate
        ? {
            bedType: (draft.bedType || "standard") as NonNullable<Resident["bed"]>["bedType"],
            mattressType: (draft.mattressType || "foam") as NonNullable<Resident["bed"]>["mattressType"],
            installationDate: draft.installationDate,
            reviewDate: draft.reviewDate,
          }
        : undefined,
      keyWorkers: draft.namedNurse || draft.namedCarer || draft.keyWorker
        ? {
            namedNurse: draft.namedNurse.trim(),
            namedCarer: draft.namedCarer.trim(),
            keyWorker: draft.keyWorker.trim(),
          }
        : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setDraft(overviewDraft(resident));
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Overview Details</DialogTitle>
          <DialogDescription>All fields are optional and can be completed over time.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <OverviewSection title="Clinical">
            <Field label="Primary diagnosis" value={draft.primaryDiagnosis} onChange={(v) => update({ primaryDiagnosis: v })} />
            <Field label="Known allergies" value={draft.allergies} onChange={(v) => update({ allergies: v })} />
            <div className="md:col-span-2">
              <Label>Medical history</Label>
              <Textarea value={draft.medicalHistory} onChange={(e) => update({ medicalHistory: e.target.value })} />
            </div>
            <div>
              <Label>Mental capacity</Label>
              <Select value={draft.mentalCapacity} onValueChange={(value) => update({ mentalCapacity: value as Resident["mentalCapacity"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="has_capacity">Has capacity</SelectItem>
                  <SelectItem value="lacks_capacity">Lacks capacity</SelectItem>
                  <SelectItem value="fluctuating">Fluctuating capacity</SelectItem>
                  <SelectItem value="not_assessed">Not assessed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Medication</Label>
              <Textarea value={draft.currentMedication} onChange={(e) => update({ currentMedication: e.target.value })} />
            </div>
          </OverviewSection>
          <OverviewSection title="Bed Management">
            <OverviewSelect label="Bed type" value={draft.bedType} onChange={(v) => update({ bedType: v as any })} options={[["standard","Standard"],["low","Low"],["profiling","Profiling"],["bariatric","Bariatric"]]} />
            <OverviewSelect label="Mattress" value={draft.mattressType} onChange={(v) => update({ mattressType: v as any })} options={[["foam","Foam"],["dynamic","Dynamic"],["air_mattress","Air Mattress"],["pressure_relieving","Pressure-relieving mattress"]]} />
            <Field label="Installed date" type="date" value={draft.installationDate} onChange={(v) => update({ installationDate: v })} />
            <Field label="Review date" type="date" value={draft.reviewDate} onChange={(v) => update({ reviewDate: v })} />
          </OverviewSection>
          <OverviewSection title="Key Workers">
            <Field label="Named Nurse" value={draft.namedNurse} onChange={(v) => update({ namedNurse: v })} />
            <Field label="Named Carer" value={draft.namedCarer} onChange={(v) => update({ namedCarer: v })} />
            <Field label="Key Worker" value={draft.keyWorker} onChange={(v) => update({ keyWorker: v })} />
          </OverviewSection>
          <OverviewSection title="GP / Consultant">
            <Field label="GP" value={draft.gp} onChange={(v) => update({ gp: v })} />
            <Field label="Consultant" value={draft.consultant} onChange={(v) => update({ consultant: v })} />
            <Field label="Emergency contact" value={draft.emergencyContact} onChange={(v) => update({ emergencyContact: v })} />
          </OverviewSection>
          <OverviewSection title="Preferences">
            <Field label="Communication" value={draft.communicationNeeds} onChange={(v) => update({ communicationNeeds: v })} />
            <Field label="Religion" value={draft.religion} onChange={(v) => update({ religion: v })} />
            <Field label="Preferred language" value={draft.preferredLanguage} onChange={(v) => update({ preferredLanguage: v })} />
          </OverviewSection>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save details</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OverviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="grid md:grid-cols-2 gap-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function OverviewSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Not recorded" /></SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, label]) => <SelectItem key={optionValue} value={optionValue}>{label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function LinkedList({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; date: string; summary: string; by: string }>;
}) {
  return (
    <div className="border rounded-md p-2 space-y-1">
      <div className="font-medium text-sm">{title}</div>
      {items.slice(0, 5).map((item) => (
        <div key={item.id} className="text-xs border rounded p-1">
          <div>{item.date}</div>
          <div className="text-muted-foreground">{item.summary}</div>
          <div className="text-muted-foreground">{item.by}</div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-xs text-muted-foreground">No linked records.</div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-xs text-muted-foreground capitalize">{label}</div>
      <div className="col-span-2 capitalize">{value || "â€”"}</div>
    </div>
  );
}

