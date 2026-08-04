import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCare, age } from "@/lib/care/store";
import { isActionRequiredAlert } from "@/lib/care/alerts";
import { can } from "@/lib/care/permissions";
import { assessmentMeta } from "@/lib/care/scoring";
import { latestAssessmentsByType } from "@/lib/care/assessmentVersions";
import {
  getCarePlansGroupedByRltDomain,
  getRltDomainForCarePlanProblem,
  type RltDomainId,
} from "@/lib/care/rlt";
import { carePlanQualityClass, getCarePlanQualityStatus } from "@/lib/care/quality";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { generatedHandoverRepository } from "@/lib/care/generatedHandovers";
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
  ClipboardList,
  Trash2,
  Archive,
  Ban,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { LatestVitalsCard } from "@/components/care/LatestVitalsCard";
import { RecordObservationFlow } from "@/components/care/RecordObservationFlow";
import { ObservationHistory } from "@/components/observations/ObservationHistory";
import { CreateCarePlanDialog } from "@/components/care/CreateCarePlanDialog";
import { EndOfLifePathwayPanel } from "@/components/care/EndOfLifePathwayPanel";
import { ResidentHeader } from "@/components/resident/ResidentHeader";
import {
  EditResidentProfileDialog,
  type ResidentProfileEditSection,
} from "@/components/resident/EditResidentProfileDialog";
import { ResidentDocuments } from "@/components/resident/ResidentDocuments";
import { ResidentAdministrativeDetails } from "@/components/resident/ResidentAdministrativeDetails";
import { RltClinicalWorkspace } from "@/components/care/RltClinicalWorkspace";
import {
  CARE_ACTION_TYPE_LABELS,
  getCanonicalCareActionType,
} from "@/lib/care/flexibleCareActions";
import { getResidentHeader } from "@/lib/care/residentHeader";
import { getResidentRltClinicalOverview } from "@/lib/care/rltClinicalOverview";
import { getResidentContacts } from "@/lib/care/residentContacts";
import { getResidentDocuments } from "@/lib/care/residentDocuments";
import { getResidentAdministrativeDetails } from "@/lib/care/residentAdministrativeDetails";
import { projectResidentRltTimeline } from "@/lib/care/rltTimeline";
import { projectClinicalActivityFeed } from "@/lib/care/clinicalActivityFeed";
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
import { RecordDailyCareDialog } from "@/components/dailyCare/RecordDailyCareDialog";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  scheduledInterventions,
  scheduledInterventionLabel,
  type ScheduledInterventionStatus,
} from "@/lib/care/intervention-schedule";
import type { VitalSign } from "@/lib/care/types";
import { DAILY_NOTE_CATEGORY_OPTIONS } from "@/lib/care/types";
import type {
  DailyNote,
  ProblemCategory,
  ProblemRiskLevel,
  ProblemStatus,
  Resident,
  NextOfKin,
  TimelineEvent,
} from "@/lib/care/types";
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
  head: ({ params }) => ({ meta: [{ title: `Resident ${params.id} — CarePath` }] }),
  component: ResidentDetail,
});

type ResidentTimelineModule =
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
  | "alerts"
  | "other";
const timelineModuleForEvent = (event: TimelineEvent): ResidentTimelineModule => {
  if (event.type.startsWith("assessment.")) return "assessments";
  if (event.type.startsWith("careplan."))
    return event.type === "careplan.evaluated" ? "evaluations" : "careplans";
  if (event.type.startsWith("intervention.")) return "interventions";
  if (event.type.startsWith("mdt.")) return "mdt";
  if (event.type.startsWith("task.")) return "tasks";
  if (event.type.startsWith("incident.")) return "incidents";
  if (event.type.startsWith("chart.")) return "vitals";
  if (event.type.startsWith("visitor.")) return "visitors";
  if (event.type.startsWith("outing.")) return "outings";
  if (event.type.startsWith("alert.")) return "alerts";
  return "other";
};

function riskColor(level: string) {
  if (level === "very_high") return "bg-destructive/10 text-destructive border-destructive/30";
  if (level === "high") return "bg-warning/15 text-warning-foreground border-warning/40";
  if (level === "moderate") return "bg-info/10 text-info border-info/20";
  return "bg-success/10 text-success border-success/20";
}

const DAILY_NOTE_CATEGORY_LABELS = new Map(
  DAILY_NOTE_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
);

function dailyNoteCategoryLabel(note: DailyNote) {
  if (note.category) return DAILY_NOTE_CATEGORY_LABELS.get(note.category) || "General";
  if (note.linkedInterventionId || note.linkedInterventionLogId) return "From intervention";
  return "General";
}

function dailyNoteValue(value?: string) {
  return !value || value === "not_recorded" ? "Not recorded" : value.replace("_", " ");
}

function dailyNoteHasStructuredValues(note: DailyNote) {
  return Boolean(note.mood || note.foodIntake || note.fluidIntake || note.sleep);
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
          placeholder="Reason for deletion…"
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

const carePlanCategoryOptions: Array<{ value: ProblemCategory; label: string }> = [
  { value: "pressure", label: "Pressure" },
  { value: "falls", label: "Falls" },
  { value: "nutrition", label: "Nutrition" },
  { value: "pain", label: "Pain" },
  { value: "behaviour", label: "Behaviour" },
  { value: "continence", label: "Continence" },
  { value: "mobility", label: "Mobility" },
  { value: "cognition", label: "Cognition" },
  { value: "communication", label: "Communication" },
  { value: "personal_care", label: "Personal Care" },
  { value: "mental_health", label: "Mental Health" },
  { value: "social", label: "Social" },
  { value: "sleep", label: "Sleep" },
  { value: "medication", label: "Medication" },
  { value: "end_of_life", label: "End of Life" },
  { value: "skin", label: "Skin" },
  { value: "safeguarding", label: "Safeguarding" },
  { value: "custom", label: "Custom" },
];

const carePlanRiskOptions: Array<{ value: ProblemRiskLevel; label: string }> = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "very_high", label: "Very High" },
  { value: "resolved", label: "Resolved" },
];

const carePlanStatusOptions: Array<{ value: ProblemStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
  { value: "discontinued", label: "Discontinued" },
  { value: "superseded", label: "Superseded" },
  { value: "archived", label: "Archived / Inactive" },
  { value: "entered_in_error", label: "Entered in Error / Delete" },
];

function ResidentDetail() {
  const { id } = Route.useParams();
  const { carePlanProblemId } = Route.useSearch();
  const navigate = useNavigate();
  const {
    residents,
    users,
    wards,
    rooms,
    beds,
    bedAssignments,
    assessments,
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
    dailyCareRecords,
    alerts,
    clinicalAlerts,
    tasks,
    incidents,
    mdtNotes,
    visitors,
    outings,
    vitals,
    weights,
    handovers,
    currentRole,
    currentUser,
    currentUserName,
    activeFacilityId,
    canAccess,
    rltDependencyState,
    saveRltDependency,
    strengthPreferenceState,
    endOfLifeState,
    flexibleCareActionState,
    residentDocumentState,
    operationalContext,
    uploadResidentDocument,
    uploadResidentDocumentVersion,
    changeResidentDocumentStatus,
    saveResidentStrength,
    saveResidentPreference,
    rltTimelineTagState,
    softDeleteAssessment,
    addNextOfKin,
    updateNextOfKin,
    acknowledgeAlert,
    resolveAlert,
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
    updateResidentProfile,
    softDeleteResident,
    recordDailyCare,
  } = useCare();
  const r = residents.find((x) => x.id === id);

  // Modal state
  const [nokOpen, setNokOpen] = useState(false);
  const [editingNok, setEditingNok] = useState<NextOfKin | null>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [overviewEditSection, setOverviewEditSection] = useState<
    ResidentProfileEditSection | undefined
  >();
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
    dailyCare: boolean;
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
    dailyCare: false,
    mdt: false,
    visitor: false,
    outing: false,
  });

  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);
  const [residentAssessmentsOpen, setResidentAssessmentsOpen] = useState(false);
  const [selectedCareActionTask, setSelectedCareActionTask] = useState<any>(null);
  const [selectedCareActionId, setSelectedCareActionId] = useState<string | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<any>(null);
  const [scheduleDeleteReason, setScheduleDeleteReason] = useState("");
  const [selectedReviewAction, setSelectedReviewAction] = useState<
    "extend" | "complete" | "cancel" | null
  >(null);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [newlyCreatedProblemId, setNewlyCreatedProblemId] = useState<string | null>(null);
  const [problemDetailOpen, setProblemDetailOpen] = useState(false);
  const [editProblemOpen, setEditProblemOpen] = useState(false);
  const [editProblemDraft, setEditProblemDraft] = useState<{
    problemStatement: string;
    category: ProblemCategory;
    riskLevel: ProblemRiskLevel;
    reviewDate: string;
    evaluationDate: string;
    notes: string;
    status: ProblemStatus;
    reason: string;
  }>({
    problemStatement: "",
    category: "custom",
    riskLevel: "low",
    reviewDate: "",
    evaluationDate: "",
    notes: "",
    status: "active",
    reason: "",
  });
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [latestVitalsDialogOpen, setLatestVitalsDialogOpen] = useState(false);
  const [selectedCarePlanGroupDomainId, setSelectedCarePlanGroupDomainId] =
    useState<RltDomainId | null>(null);
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

  const handleEditIntervention = (intervention: any) => {
    setSelectedIntervention(intervention);
    setModalState((prev) => ({ ...prev, intervention: true }));
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
  const rltReadCapabilities = [
    "rlt_overview.view",
    "rlt_overview.view_risks",
    "rlt_overview.view_care_plans",
    "rlt_overview.view_preferences",
    "rlt_overview.view_sensitive_preferences",
    "rlt_timeline.view",
    "rlt_timeline.view_sensitive",
    "rlt_timeline.view_highly_sensitive",
    "assessment.view",
    "careplan.view",
    "incident.view",
    "resident_preference.view",
    "resident_preference.view_sensitive",
    "resident_preference.view_highly_sensitive",
  ].filter((capability) =>
    canAccess(capability as Parameters<typeof canAccess>[0], {
      nursingHomeId: r.facilityId || activeFacilityId,
      residentId: r.id,
    }),
  );
  const rltClinicalOverview = getResidentRltClinicalOverview(
    {
      residents,
      dependencyState: rltDependencyState,
      strengthPreferenceState,
      carePlanProblems,
      interventions: problemInterventions,
      evaluations: problemEvaluations,
      reviews: problemReviews,
      assessments,
      alerts,
      clinicalAlerts,
      tasks,
    },
    r.id,
    { nursingHomeId: r.facilityId || activeFacilityId, capabilities: rltReadCapabilities },
  );
  const rltTimelineItems = projectResidentRltTimeline(
    {
      residents,
      assessments,
      carePlanProblems,
      interventions: problemInterventions,
      interventionLogs: problemInterventionLogs,
      evaluations: problemEvaluations,
      reviews: problemReviews,
      problemHistory,
      dependencyState: rltDependencyState,
      strengthPreferenceState,
      endOfLifeState,
      incidents,
      alerts,
      clinicalAlerts,
      handovers,
      timelineEvents,
      manualTagState: rltTimelineTagState,
    },
    r.id,
    { nursingHomeId: r.facilityId || activeFacilityId, capabilities: rltReadCapabilities },
  );
  const residentContactCapabilities = [
    "resident_contacts.view",
    "resident_contacts.create",
    "resident_contacts.edit_relationship",
    "resident_contacts.set_primary",
    "resident_contacts.manage_authority",
    "resident_contacts.view_history",
    "resident_contacts.edit_contact",
  ].filter((capability) =>
    canAccess(capability, { nursingHomeId: r.facilityId || activeFacilityId, residentId: r.id }),
  );
  if (
    !residentContactCapabilities.includes("resident_contacts.view") &&
    canAccess("resident_profile.view", {
      nursingHomeId: r.facilityId || activeFacilityId,
      residentId: r.id,
    })
  )
    residentContactCapabilities.push("resident_contacts.view");
  const residentContacts = getResidentContacts(
    r,
    r.facilityId || activeFacilityId,
    users,
    residentContactCapabilities,
  );
  const residentDocumentCapabilities = [
    "resident_documents.view",
    "resident_documents.upload",
    "resident_documents.edit_metadata",
    "resident_documents.upload_version",
    "resident_documents.download",
    "resident_documents.view_history",
    "resident_documents.change_status",
    "resident_documents.delete_draft",
    "resident_documents.view_sensitive",
    "resident_documents.view_highly_sensitive",
    "resident_documents.manage_access",
    "resident_documents.view_legal",
    "resident_documents.view_safeguarding",
    "resident_documents.view_medication",
  ].filter((capability) =>
    canAccess(capability, { nursingHomeId: r.facilityId || activeFacilityId, residentId: r.id }),
  );
  if (
    !residentDocumentCapabilities.includes("resident_documents.view") &&
    canAccess("resident_profile.view", {
      nursingHomeId: r.facilityId || activeFacilityId,
      residentId: r.id,
    })
  )
    residentDocumentCapabilities.push("resident_documents.view");
  const administrativeDocumentRows = getResidentDocuments(
    residentDocumentState,
    r.id,
    r.facilityId || activeFacilityId,
    residentDocumentCapabilities,
    { category: "all" },
    { offset: 0, limit: 100 },
  ).items.filter((item) =>
    [
      "administrative",
      "identity",
      "insurance_and_funding",
      "legal_and_consent",
      "contacts_and_representatives",
    ].includes(item.document.category),
  );
  const residentAdministrationCapabilities = [
    "resident_administration.view",
    "resident_administration.edit",
    "resident_administration.view_identifiers",
    "resident_administration.edit_identifiers",
    "resident_administration.view_funding",
    "resident_administration.edit_funding_metadata",
    "resident_administration.view_contract",
    "resident_administration.edit_contract_metadata",
    "resident_administration.view_insurance",
    "resident_administration.edit_insurance",
    "resident_administration.view_property_summary",
    "resident_administration.view_internal_references",
  ].filter((capability) =>
    canAccess(capability, { nursingHomeId: r.facilityId || activeFacilityId, residentId: r.id }),
  );
  if (
    !residentAdministrationCapabilities.includes("resident_administration.view") &&
    canAccess("resident_profile.view", {
      nursingHomeId: r.facilityId || activeFacilityId,
      residentId: r.id,
    })
  )
    residentAdministrationCapabilities.push("resident_administration.view");
  const residentAdministrativeDetails = getResidentAdministrativeDetails({
    resident: r,
    nursingHomeId: r.facilityId || activeFacilityId,
    contacts: residentContacts,
    documents: administrativeDocumentRows,
    capabilities: residentAdministrationCapabilities,
  });
  const residentViewCapabilities = [
    "resident_profile.view",
    "resident_profile.edit",
    "resident_profile.edit_identity",
    "resident_profile.edit_demographics",
    "resident_profile.edit_photo",
    "resident_profile.manage_contacts",
    "resident_profile.assign_named_nurse",
    "resident_profile.assign_key_worker",
    "resident_profile.assign_gp",
    "resident_clinical_overview.view",
    "resident_clinical_overview.view_assessments",
    "resident_clinical_overview.view_risks",
    "resident_clinical_overview.view_incidents",
    "resident_clinical_overview.view_medication",
    "resident_clinical_overview.view_sensitive",
    "resident_clinical_overview.view_end_of_life",
    "end_of_life.view",
    "end_of_life.view_sensitive",
    "end_of_life.view_highly_sensitive",
  ].filter((capability) =>
    canAccess(capability as Parameters<typeof canAccess>[0], {
      nursingHomeId: r.facilityId || activeFacilityId,
      residentId: r.id,
    }),
  );
  const latestHeaderWeight = [
    ...weights
      .filter((weight) => weight.residentId === r.id)
      .map((weight) => ({
        weightKg: weight.weightKg,
        recordedAt: `${weight.date}T00:00:00`,
        recordedBy: weight.staff,
      })),
    ...vitals
      .filter(
        (vital) =>
          vital.residentId === r.id && !vital.deletedAt && typeof vital.weight === "number",
      )
      .map((vital) => ({
        weightKg: vital.weight as number,
        recordedAt: vital.recordedAt || `${vital.date}T${vital.time || "00:00"}:00`,
        recordedBy: vital.recordedByName,
      })),
  ].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
  const residentHeader = getResidentHeader(
    {
      residents,
      users,
      wards,
      rooms,
      beds,
      bedAssignments,
      dependencyState: rltDependencyState,
      endOfLifeState,
      contacts: residentContacts,
    },
    r.id,
    { nursingHomeId: r.facilityId || activeFacilityId, capabilities: residentViewCapabilities },
  );
  const canDeleteResident = currentRole === "don" || currentRole === "cnm";
  const deleteNameMatches = deleteConfirmName.trim() === residentFullName;

  const rA = assessments
    .filter((a) => a.residentId === id && a.status !== "deleted")
    .sort((a, b) => b.date.localeCompare(a.date));
  const clinicalSnapshotAssessments = latestAssessmentsByType(rA);
  const rADeleted = assessments.filter((a) => a.residentId === id && a.status === "deleted");
  const rN = notes.filter((n) => n.residentId === id);
  const rDailyCare = dailyCareRecords
    .filter((record) => record.residentId === id && record.status !== "entered_in_error")
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
  const rClinicalActivity = projectClinicalActivityFeed({
    notes,
    dailyCareRecords,
    timelineEvents,
    carePlanProblems,
    problemEvaluations,
    problemReviews,
    residentId: id,
    facilityId: r.facilityId || activeFacilityId,
  });
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
  const generatedResidentHandovers = generatedHandoverRepository
    .listByResident(id)
    .filter((item) => !item.archived && item.status !== "superseded");
  const rProblems = carePlanProblems.filter((p) => p.residentId === id);
  const activeProblems = rProblems.filter((p) => p.status === "active");
  const groupedActiveCarePlans = useMemo(
    () => getCarePlansGroupedByRltDomain(id, activeProblems),
    [activeProblems, id],
  );
  const unmappedActiveCarePlans = useMemo(
    () => activeProblems.filter((problem) => !getRltDomainForCarePlanProblem(problem)),
    [activeProblems],
  );
  const rProblemInterventions = problemInterventions.filter((i) => i.residentId === id);
  const orderedProblemInterventions = [
    ...rProblemInterventions
      .filter((intervention) => !intervention.parentInterventionId)
      .flatMap((heading) => [
        heading,
        ...rProblemInterventions.filter((task) => task.parentInterventionId === heading.id),
      ]),
    ...rProblemInterventions.filter(
      (intervention) =>
        intervention.parentInterventionId &&
        !rProblemInterventions.some((heading) => heading.id === intervention.parentInterventionId),
    ),
  ];
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
    ? problemGoals.filter(
        (g) =>
          g.problemId === selectedProblem.id &&
          (!g.carePlanId || g.carePlanId === selectedProblem.id),
      )
    : [];
  const selectedProblemInterventions = selectedProblem
    ? rProblemInterventions.filter(
        (i) =>
          i.problemId === selectedProblem.id &&
          (!i.carePlanId || i.carePlanId === selectedProblem.id),
      )
    : [];
  const selectedCareActionHeadings = selectedProblemInterventions.filter(
    (intervention) => !intervention.parentInterventionId,
  );
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
    ? rN.filter(
        (n) => n.linkedProblemId === selectedProblem.id || n.carePlanId === selectedProblem.id,
      )
    : [];
  const linkedMdtNotes = selectedProblem
    ? rMDT.filter((m) => m.linkedCarePlanId === selectedProblem.id)
    : [];
  const linkedIncidents = selectedProblem
    ? rIncidents.filter((i) => i.linkedCarePlanId === selectedProblem.id)
    : [];
  const linkedTasks = selectedProblem
    ? rTasks.filter((t) => t.linkedCarePlanId === selectedProblem.id)
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
          goals: problemGoals.filter(
            (goal) =>
              goal.problemId === problem.id && (!goal.carePlanId || goal.carePlanId === problem.id),
          ),
          interventions: rProblemInterventions.filter(
            (intervention) =>
              intervention.problemId === problem.id &&
              (!intervention.carePlanId || intervention.carePlanId === problem.id),
          ),
          evaluations: rProblemEvaluations.filter(
            (evaluation) => evaluation.problemId === problem.id,
          ),
        }),
      );
    }
    return quality;
  }, [problemGoals, rProblemEvaluations, rProblemInterventions, rProblems]);
  const allActiveCarePlansComplete =
    activeProblems.length > 0 &&
    activeProblems.every(
      (problem) => carePlanQualityByProblemId.get(problem.id)?.status === "complete",
    );

  const now = new Date();

  const upcomingInterventionTasks = useMemo(() => {
    return scheduledInterventions(rProblemInterventions, rProblemLogs, rProblems, now);
  }, [now, rProblemInterventions, rProblemLogs, rProblems]);
  const dueResidentReviews = useMemo(() => {
    const reviews = [
      ...clinicalSnapshotAssessments
        .filter(
          (assessment) =>
            !!assessment.nextReassessmentDate &&
            assessment.status !== "archived" &&
            assessment.status !== "superseded" &&
            assessment.nextReassessmentDate <= todayKey,
        )
        .map((assessment) => ({
          id: `assessment-${assessment.id}`,
          kind: "Assessment review",
          title: assessmentMeta[assessment.type]?.name || assessment.type,
          dueDate: assessment.nextReassessmentDate as string,
          status: assessment.nextReassessmentDate === todayKey ? "Due today" : "Overdue",
          assessmentId: assessment.id,
        })),
      ...activeProblems
        .filter((carePlan) => !!carePlan.reviewDate && carePlan.reviewDate <= todayKey)
        .map((carePlan) => ({
          id: `care-plan-${carePlan.id}`,
          kind: "Care plan review",
          title: carePlan.problemStatement,
          dueDate: carePlan.reviewDate,
          status: carePlan.reviewDate === todayKey ? "Due today" : "Overdue",
          carePlanId: carePlan.id,
        })),
    ];

    return reviews.sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  }, [activeProblems, clinicalSnapshotAssessments, todayKey]);

  const selectedCarePlanGroup =
    groupedActiveCarePlans.find((group) => group.domain.id === selectedCarePlanGroupDomainId) ||
    null;

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
    const residentEventRecordIds = new Set(
      timelineEvents
        .filter((event) => event.residentId === id && event.linkedRecordId)
        .map((event) => event.linkedRecordId),
    );
    const items = [
      ...rA.map((a) => ({
        id: `assess-${a.id}`,
        module: "assessments" as const,
        at: a.date,
        title: `${assessmentMeta[a.type]?.name || a.type} assessment`,
        summary: `Score ${a.totalScore} (${a.interpretation})`,
        by: a.assessor,
      })),
      ...rProblems
        .filter((p) => !residentEventRecordIds.has(p.id))
        .map((p) => ({
          id: `cp-${p.id}`,
          module: "careplans" as const,
          at: p.createdAt,
          title: "Care plan problem updated",
          summary: p.problemStatement,
          by: p.createdBy,
        })),
      ...rProblemInterventions
        .filter((i) => !residentEventRecordIds.has(i.id))
        .map((i) => ({
          id: `int-${i.id}`,
          module: "interventions" as const,
          at: i.updatedAt || i.createdAt,
          title: i.name,
          summary: `${i.frequencyType.replace(/_/g, " ")} · ${i.status.replace(/_/g, " ")}`,
          by: i.updatedBy || i.createdBy,
        })),
      ...rProblemEvaluations
        .filter((e) => !residentEventRecordIds.has(e.id))
        .map((e) => ({
          id: `eval-${e.id}`,
          module: "evaluations" as const,
          at: e.date,
          title: "Care plan review",
          summary: `${e.progress.replace(/_/g, " ")} · plan met: ${e.goalsMet}`,
          by: e.evaluatorName,
        })),
      ...rProblemReviews
        .filter((rev) => !residentEventRecordIds.has(rev.id))
        .map((rev) => ({
          id: `rev-${rev.id}`,
          module: "careplans" as const,
          at: rev.reviewDate,
          title: "Care plan review",
          summary: `${rev.outcome} · ${rev.comments || ""}`,
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
        module: "alerts" as const,
        at: a.createdAt,
        title: `Alert: ${a.title}`,
        summary: a.description,
        by: "System",
      })),
      ...timelineEvents
        .filter((e) => e.residentId === id)
        .map((e) => ({
          id: `tle-${e.id}`,
          module: timelineModuleForEvent(e),
          at: e.createdAt,
          title: e.title,
          summary: e.description || e.type,
          by: e.createdBy,
        })),
    ];

    return Array.from(new Map(items.map((item) => [item.id, item])).values()).sort(
      (a, b) => `${b.at}`.localeCompare(`${a.at}`) || a.id.localeCompare(b.id),
    );
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
      supersededBy: a.supersededById || "—",
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

  const openEditProblemDialog = () => {
    if (!selectedProblem) return;
    setEditProblemDraft({
      problemStatement: selectedProblem.problemStatement,
      category: selectedProblem.category,
      riskLevel: selectedProblem.riskLevel,
      reviewDate: selectedProblem.reviewDate,
      evaluationDate: selectedProblem.evaluationDate,
      notes: selectedProblem.notes || "",
      status: selectedProblem.status,
      reason: "",
    });
    setEditProblemOpen(true);
  };

  const submitEditProblem = () => {
    if (!selectedProblem) {
      toast.error("No nursing care plan selected");
      return;
    }

    const problemStatement = editProblemDraft.problemStatement.trim();
    const notes = editProblemDraft.notes.trim();
    const reason = editProblemDraft.reason.trim();
    const statusChanged = editProblemDraft.status !== selectedProblem.status;
    const statusRequiresReason = statusChanged && editProblemDraft.status !== "active";

    if (!problemStatement) {
      toast.error("Care plan name is required");
      return;
    }

    if (!editProblemDraft.reviewDate) {
      toast.error("Next review date is required");
      return;
    }

    if (statusRequiresReason && !reason) {
      toast.error("Reason is required for inactive, deleted or closed care plans");
      return;
    }

    const editablePatch = {
      problemStatement,
      category: editProblemDraft.category,
      riskLevel: editProblemDraft.riskLevel,
      reviewDate: editProblemDraft.reviewDate,
      evaluationDate: editProblemDraft.evaluationDate || editProblemDraft.reviewDate,
      notes: notes || undefined,
    };

    const changeReason = reason || "Care plan details updated";

    if (editProblemDraft.status === "archived") {
      updateProblem(selectedProblem.id, editablePatch, changeReason);
      archiveProblem(selectedProblem.id, reason || "Care plan archived");
    } else {
      updateProblem(
        selectedProblem.id,
        {
          ...editablePatch,
          status: editProblemDraft.status,
          ...(editProblemDraft.status !== "active"
            ? {
                resolvedAt: new Date().toISOString(),
                resolvedBy: currentUserName,
                resolvedReason: reason,
              }
            : {
                resolvedAt: undefined,
                resolvedBy: undefined,
                resolvedReason: undefined,
                archivedAt: undefined,
                archivedBy: undefined,
                archivedReason: undefined,
              }),
        },
        changeReason,
      );
    }

    toast.success("Care plan updated");
    setEditProblemOpen(false);

    if (editProblemDraft.status !== "active") {
      setProblemDetailOpen(false);
      setNewlyCreatedProblemId(null);
      setSelectedProblemId(null);
    }
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
      suppressTimelineEvent: true,
    });

    const reviewStatusAction = [
      "discontinued",
      "entered_in_error",
      "superseded",
      "archived",
    ].includes(evaluationDraft.revisionRequired)
      ? evaluationDraft.revisionRequired
      : "";

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
    }

    if (reviewStatusAction === "archived") {
      archiveProblem(
        selectedProblem.id,
        evaluationDraft.revisionReason ||
          evaluationDraft.recommendations ||
          evaluationDraft.summary ||
          "Archived from care plan review",
      );
    } else if (reviewStatusAction) {
      updateProblem(
        selectedProblem.id,
        {
          status: reviewStatusAction as any,
          resolvedAt: new Date().toISOString(),
          resolvedReason:
            evaluationDraft.revisionReason ||
            evaluationDraft.recommendations ||
            evaluationDraft.summary,
          ...(reviewStatusAction === "discontinued" || reviewStatusAction === "superseded"
            ? { riskLevel: "resolved" as const }
            : {}),
        },
        `Status changed to ${reviewStatusAction.replace(/_/g, " ")} from care plan review`,
      );
    }

    addProblemReview({
      problemId: selectedProblem.id,
      reviewDate: evaluationDraft.date,
      outcome:
        evaluationDraft.revisionRequired === "yes"
          ? "modify"
          : reviewStatusAction
            ? "resolve"
            : "continue",
      comments:
        evaluationDraft.revisionReason ||
        evaluationDraft.recommendations ||
        evaluationDraft.summary ||
        "Review completed",
      nextReviewDate:
        evaluationDraft.revisionReviewDate ||
        evaluationDraft.nextEvaluationDate ||
        selectedProblem.reviewDate,
    });

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

      <ResidentHeader
        header={residentHeader}
        latestWeight={latestHeaderWeight}
        canEdit={residentViewCapabilities.includes("resident_profile.edit")}
        onEdit={() => setProfileEditOpen(true)}
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">Quick Actions</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleOpenModal("note")}>
                  Daily Note
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenModal("dailyCare")}>
                  Record Daily Care
                </DropdownMenuItem>
                <RecordObservationFlow
                  residentId={r.id}
                  onRecorded={() => setActiveTab("vitals")}
                  trigger={
                    <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                      Record Observation
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuItem onClick={() => handleOpenModal("intervention")}>
                  Care Action
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenModal("assessment")}>
                  Assessment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenModal("task")}>Task</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenModal("incident")}>
                  Incident
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" onClick={() => setTimelineDialogOpen(true)}>
              Timeline
            </Button>
          </>
        }
      />
      <EditResidentProfileDialog
        resident={r}
        users={users}
        canEditSensitiveIdentifiers={residentViewCapabilities.includes(
          "resident_profile.edit_sensitive_identifiers",
        )}
        section={overviewEditSection}
        open={profileEditOpen}
        onOpenChange={(open) => {
          setProfileEditOpen(open);
          if (!open) setOverviewEditSection(undefined);
        }}
        onSave={(input) => updateResidentProfile(r.id, input)}
      />
      {r.preAdmission?.convertedAt && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pre-Admission</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-5">
            <div>
              <span className="text-muted-foreground">Resident Type</span>
              <p className="font-medium">{r.preAdmission.residentType}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Referred From</span>
              <p className="font-medium">{r.preAdmission.referredFrom}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Referral Source</span>
              <p className="font-medium">{r.preAdmission.referralSource || "Not recorded"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Proposed Admission</span>
              <p className="font-medium">
                {r.preAdmission.proposedAdmissionDate || "Not recorded"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Converted to Active</span>
              <p className="font-medium">
                {new Date(r.preAdmission.convertedAt).toLocaleDateString()}
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-fit" asChild>
              <Link to="/residents/pre-admissions">View Pre-Admission Record</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="hidden">
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
                    <DropdownMenuItem onClick={() => handleOpenModal("dailyCare")}>
                      Record Daily Care
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
                <span className="capitalize">{r.bed?.bedType?.replace("_", " ") || "—"}</span>
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

      <Collapsible open={residentAssessmentsOpen} onOpenChange={setResidentAssessmentsOpen}>
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <div className="flex min-w-0 items-center gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-teal-600" aria-hidden="true"></span> Resident Assessments
              </CardTitle>
              <CollapsibleTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0"
                  aria-label={
                    residentAssessmentsOpen
                      ? "Collapse resident assessments"
                      : "Expand resident assessments"
                  }
                >
                  {residentAssessmentsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <Button size="sm" className="shrink-0" onClick={() => handleOpenModal("assessment")}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Assessment
            </Button>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {clinicalSnapshotAssessments.map((assessment) => {
                  const meta = assessmentMeta[assessment.type];
                  const isOverdue = Boolean(
                    assessment?.nextReassessmentDate &&
                    assessment.nextReassessmentDate < today.toISOString().slice(0, 10),
                  );
                  return (
                    <Link
                      key={assessment.id}
                      to="/assessments/$assessmentId"
                      params={{ assessmentId: assessment.id }}
                      className="min-h-32 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-primary/50 hover:bg-primary/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-950"
                    >
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {meta.name}
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-semibold text-slate-950 dark:text-white">
                          {assessment.totalScore}
                        </span>
                        {meta.max && (
                          <span className="text-xs text-muted-foreground">/{meta.max}</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${riskColor(assessment.riskLevel)}`}
                        >
                          {assessment.interpretation}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${isOverdue ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-success/30 bg-success/10 text-success"}`}
                        >
                          {isOverdue ? "Overdue" : "Completed"}
                        </Badge>
                      </div>
                      <div className="mt-2 text-right text-[11px] text-muted-foreground">
                        Review{" "}
                        {assessment.nextReassessmentDate ||
                          assessment.reviewDate ||
                          assessment.date}
                      </div>
                    </Link>
                  );
                })}
                {clinicalSnapshotAssessments.length === 0 && (
                  <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground sm:col-span-2 xl:col-span-4">
                    No assessments have been completed for this resident yet.
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Active Nursing Care Plans</CardTitle>
          <CreateCarePlanDialog
            residentId={r.id}
            onCreated={(problem) => openNewlyCreatedProblemDetail(problem.id)}
            trigger={
              <Button size="sm">
                <ClipboardList className="mr-1 h-3 w-3" /> Add from Template
              </Button>
            }
          />
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
                      className="flex flex-col gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm dark:bg-muted/30 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="line-clamp-1 text-base font-semibold text-foreground">
                          {problem.problemStatement}
                        </div>
                        <div className="mt-1 text-sm text-foreground/80">
                          Review of Outcome {problem.evaluationDate}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${riskColor(problem.riskLevel)}`}
                        >
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openProblemDetail(problem.id)}
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  ))}
                  {sortedCarePlans.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{sortedCarePlans.length - 3} more nursing care plan
                      {sortedCarePlans.length - 3 === 1 ? "" : "s"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {unmappedActiveCarePlans.length > 0 &&
            unmappedActiveCarePlans
              .slice()
              .sort((left, right) => left.reviewDate.localeCompare(right.reviewDate))
              .map((problem) => (
                <div
                  key={problem.id}
                  className="flex flex-col gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm dark:bg-muted/30 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-base font-semibold text-foreground">
                      {problem.carePlanName || problem.problemStatement}
                    </div>
                    <div className="mt-1 text-sm text-foreground/80">
                      Review due {problem.reviewDate}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${riskColor(problem.riskLevel)}`}
                    >
                      {problem.riskLevel.replace(/_/g, " ")}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => openProblemDetail(problem.id)}>
                      Open
                    </Button>
                  </div>
                </div>
              ))}
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
                    <ClipboardList className="h-3 w-3 mr-1" /> Add from Template
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
              Select one nursing care plan to open. Only care plans in this Activity of Living are
              shown.
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
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Upcoming Scheduled Care Actions</CardTitle>
          <Button size="sm" onClick={() => handleOpenModal("intervention")}>
            <Plus className="mr-1.5 h-4 w-4" /> Create Scheduled Care Action
          </Button>
        </CardHeader>
        <CardContent className="grid gap-5 xl:grid-cols-2">
          <section className="space-y-3">
            <div>
              <h3 className="font-medium">Reviews requiring attention</h3>
              <p className="text-xs text-muted-foreground">
                Due assessment and care-plan reviews for this resident.
              </p>
            </div>
            {dueResidentReviews.map((review) => (
              <div key={review.id} className="rounded-md border border-warning/30 bg-warning/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{review.kind}</div>
                    <div className="font-medium">{review.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Review due: {review.dueDate}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-warning/40 bg-warning/10 text-warning-foreground"
                  >
                    {review.status}
                  </Badge>
                </div>
                <div className="mt-3">
                  {"assessmentId" in review ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        to="/assessments/$assessmentId"
                        params={{ assessmentId: review.assessmentId }}
                      >
                        Open Assessment
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openProblemDetail(review.carePlanId)}
                    >
                      Open Care Plan
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {dueResidentReviews.length === 0 && (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No assessment or care-plan reviews are due.
              </div>
            )}
          </section>
          <section className="space-y-3">
            <div>
              <h3 className="font-medium">Scheduled Care Action Tasks</h3>
              <p className="text-xs text-muted-foreground">
                Upcoming and overdue scheduled tasks for this resident.
              </p>
            </div>
            {upcomingInterventionTasks.map((task) => {
              const heading = task.intervention.parentInterventionId
                ? rProblemInterventions.find(
                    (item) => item.id === task.intervention.parentInterventionId,
                  )
                : null;
              const linkedScheduledTask = rTasks.find(
                (scheduledTask) =>
                  scheduledTask.linkedInterventionId === task.intervention.id &&
                  scheduledTask.status !== "deleted",
              );
              // Early scheduled tasks stored their user-entered task name in description.
              // Prefer it only when it is not the system-generated heading context.
              const taskName =
                linkedScheduledTask?.title ||
                (task.intervention.parentInterventionId &&
                task.intervention.description &&
                !task.intervention.description.startsWith("Scheduled task under:")
                  ? task.intervention.description
                  : task.intervention.name);
              return (
                <div key={task.intervention.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{taskName}</div>
                      <div className="text-xs text-muted-foreground">
                        {heading
                          ? `Care action: ${heading.name}`
                          : linkedScheduledTask
                            ? `Care action: ${task.intervention.name}`
                            : task.problem?.problemStatement || "Unlinked care plan problem"}
                      </div>
                    </div>
                    <Badge variant="outline" className={statusBadgeClass(task.status)}>
                      {statusLabel(task.status)}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      Due: {task.dueAt ? task.dueAt.toLocaleString("en-GB") : "Not scheduled"}
                    </div>
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
              );
            })}

            {upcomingInterventionTasks.length === 0 && (
              <div className="rounded-md border p-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">No upcoming scheduled care actions.</p>
              </div>
            )}
          </section>
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
            <TabsTrigger value="assessments">Assessments ({rA.length})</TabsTrigger>
            <TabsTrigger value="activities">Care Plans</TabsTrigger>
            <TabsTrigger value="notes">Daily Notes</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="incidents">Incidents ({openIncidents.length})</TabsTrigger>
            <TabsTrigger value="alerts">Alerts ({openAlertCount})</TabsTrigger>
            <TabsTrigger value="nok">Next of Kin ({r.nextOfKinList?.length || 0})</TabsTrigger>
            <TabsTrigger value="handovers">
              Handovers ({rHandovers.length + generatedResidentHandovers.length})
            </TabsTrigger>
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
              <DropdownMenuItem onClick={() => setActiveTab("mdt")}>
                MDT ({rMDT.length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("tasks")}>
                Actions ({rTasks.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Current care plans</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Active care plans for {r.firstName} {r.lastName}.
                </p>
              </div>
              <CreateCarePlanDialog
                residentId={r.id}
                onCreated={(problem) => openNewlyCreatedProblemDetail(problem.id)}
                trigger={
                  <Button className="min-h-11">
                    <Plus className="mr-2 h-4 w-4" />
                    Add from Template
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {activeProblems
                .slice()
                .sort((left, right) => left.reviewDate.localeCompare(right.reviewDate))
                .map((problem) => (
                  <div
                    key={problem.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-base">
                        {problem.carePlanName || problem.problemStatement}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Review due {problem.reviewDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`capitalize ${riskColor(problem.riskLevel)}`}
                      >
                        {problem.riskLevel.replace(/_/g, " ")} risk
                      </Badge>
                      <Button
                        variant="outline"
                        className="min-h-11"
                        onClick={() => openProblemDetail(problem.id)}
                      >
                        Open care plan
                      </Button>
                    </div>
                  </div>
                ))}
              {!activeProblems.length && (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="font-medium">No active care plans.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use Add from Template to create one for this resident.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
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
            <Button size="sm" onClick={() => setProfileEditOpen(true)}>
              Edit Overview Details
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <OverviewCard
              title="Resident Information"
              icon={<User2 className="h-5 w-5" />}
              onEdit={() => {
                setOverviewEditSection("resident");
                setProfileEditOpen(true);
              }}
            >
              <OverviewField label="Preferred Name" value={r.preferredName} />
              <OverviewField label="Date of Birth" value={r.dob} />
              <OverviewField label="Age" value={r.dob ? `${age(r.dob)} years` : undefined} />
              <OverviewField label="Gender" value={r.gender} />
              <OverviewField label="Marital Status" value={r.maritalStatus} />
              <OverviewField label="Ethnicity" value={r.ethnicity} />
              <OverviewField label="Religion" value={r.religion} />
              <OverviewField
                label="Resident Identifier"
                value={
                  residentViewCapabilities.includes("resident_profile.view_sensitive_identifiers")
                    ? r.residentNumber || r.externalResidentId
                    : undefined
                }
              />
              <OverviewField
                label="Registration Number"
                value={
                  residentViewCapabilities.includes("resident_profile.view_sensitive_identifiers")
                    ? r.registrationNumber
                    : undefined
                }
              />
              <OverviewField label="Resident Phone" value={r.phone} />
              <OverviewField label="Email" value={r.email} />
              <OverviewField label="Address" value={r.address} wide />
              <OverviewField label="Admission Date" value={r.admissionDate} />
              <OverviewField label="Admission Type" value={r.admissionType?.replace(/_/g, " ")} />
              <OverviewField
                label="Admission Source"
                value={r.admissionSource?.replace(/_/g, " ")}
              />
              <OverviewField
                label="Current Accommodation Status"
                value={r.currentAccommodationStatus?.replace(/_/g, " ")}
              />
              <OverviewField
                label="Re-admitted Within 28 Days"
                value={
                  r.readmittedWithin28Days === undefined
                    ? undefined
                    : r.readmittedWithin28Days
                      ? "Yes"
                      : "No"
                }
              />
              <OverviewField
                label="Nursing Home / Facility"
                value={r.facilityId || activeFacilityId}
              />
              <OverviewField label="Room" value={r.roomNumber} />
              <OverviewField label="Bed" value={r.bed?.bedType?.replace(/_/g, " ")} />
              <OverviewField
                label="Dependency Level"
                value={r.dependencyLevel ? `${r.dependencyLevel} dependency` : undefined}
              />
              <OverviewField label="Support Level" value={r.supportLevel?.replace(/_/g, " ")} />
            </OverviewCard>

            <OverviewCard
              title="Clinical Summary"
              icon={<ClipboardList className="h-5 w-5" />}
              onEdit={() => {
                setOverviewEditSection("clinical");
                setProfileEditOpen(true);
              }}
            >
              <OverviewField label="Primary Diagnosis" value={r.primaryDiagnosis} wide />
              <OverviewField label="Relevant Medical History" value={r.medicalHistory} wide />
              <OverviewField
                label="Known Allergies"
                value={r.allergies}
                wide
                emphasis={Boolean(r.allergies)}
              />
              <OverviewField label="Mental Capacity" value={r.mentalCapacity?.replace(/_/g, " ")} />
              <OverviewField
                label="Resuscitation Status"
                value={
                  r.dnarStatus === "yes"
                    ? "DNAR recorded"
                    : r.dnarStatus === "no"
                      ? "No DNAR recorded"
                      : undefined
                }
              />
              <OverviewField
                label="Dependency Level"
                value={r.dependencyLevel ? `${r.dependencyLevel} dependency` : undefined}
              />
              <OverviewField label="Communication Needs" value={r.communicationNeeds} wide />
            </OverviewCard>

            <OverviewCard title="Medication Summary" icon={<Pill className="h-5 w-5" />}>
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-base leading-6">
                <p className="font-medium">Medication information is temporarily unavailable.</p>
                <p className="mt-1 text-muted-foreground">
                  NuLife medication integration is not currently connected for this resident.
                </p>
                <Button
                  className="mt-4 min-h-11"
                  variant="outline"
                  onClick={() =>
                    toast.info("Medication information will refresh when NuLife is available.")
                  }
                >
                  Retry
                </Button>
              </div>
            </OverviewCard>

            <OverviewCard
              title="Bed & Accommodation"
              icon={<Bed className="h-5 w-5" />}
              onEdit={() => {
                setOverviewEditSection("bed");
                setProfileEditOpen(true);
              }}
            >
              <OverviewField label="Facility" value={r.facilityId || activeFacilityId} />
              <OverviewField label="Wing" value={r.wingId} />
              <OverviewField label="Room" value={r.roomNumber} />
              <OverviewField label="Bed Type" value={r.bed?.bedType?.replace(/_/g, " ")} />
              <OverviewField
                label="Mattress Type"
                value={r.bed?.mattressType?.replace(/_/g, " ")}
              />
              <OverviewField label="Mattress Installed Date" value={r.bed?.installationDate} />
              <OverviewField label="Mattress Review Date" value={r.bed?.reviewDate} />
              <OverviewField
                label="Current Accommodation Status"
                value={r.currentAccommodationStatus?.replace(/_/g, " ")}
              />
            </OverviewCard>

            <OverviewCard
              title="Healthcare Team"
              icon={<UserCog className="h-5 w-5" />}
              onEdit={() => {
                setOverviewEditSection("team");
                setProfileEditOpen(true);
              }}
            >
              <OverviewField label="GP" value={r.gp} />
              <OverviewField label="Consultant" value={r.consultant} />
              <OverviewField label="Consultant Specialty" value={r.consultantSpecialty} />
              <OverviewField label="Named Nurse" value={r.keyWorkers?.namedNurse} />
              <OverviewField label="Named Carer" value={r.keyWorkers?.namedCarer} />
              <OverviewField label="Key Worker" value={r.keyWorkers?.keyWorker} />
            </OverviewCard>

            <OverviewCard
              title="Resident Preferences"
              icon={<Phone className="h-5 w-5" />}
              onEdit={() => {
                setOverviewEditSection("preferences");
                setProfileEditOpen(true);
              }}
            >
              <OverviewField label="Preferred Name" value={r.preferredName} />
              <OverviewField label="Preferred Language" value={r.preferredLanguage} />
              <OverviewField label="Communication Needs" value={r.communicationNeeds} wide />
              <OverviewField label="Religion" value={r.religion} />
              <OverviewField label="Likes" value={r.aKeyToMe?.likes} wide />
              <OverviewField label="Dislikes" value={r.aKeyToMe?.dislikes} wide />
              <OverviewField label="Preferred Routine" value={r.aKeyToMe?.dailyRoutine} wide />
              <OverviewField label="Personal Care Preferences" value={r.otherPreferences} wide />
            </OverviewCard>
          </div>

          <ResidentDocuments
            residentId={r.id}
            nursingHomeId={r.facilityId || activeFacilityId}
            state={residentDocumentState}
            capabilities={residentDocumentCapabilities}
            onUpload={(metadata, file) => uploadResidentDocument(r.id, metadata, file)}
            onUploadVersion={(documentId, file) =>
              uploadResidentDocumentVersion(documentId, file, "replacement")
            }
            onStatus={changeResidentDocumentStatus}
            onOpenSource={(route) => {
              if (typeof window !== "undefined") window.location.assign(route);
            }}
          />
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
          <ObservationHistory residentId={r.id} />
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
                        <div>
                          {new Date(`${vital.date}T00:00:00`).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </div>
                        <div>{vital.time}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{VITAL_TYPE_LABELS[type]}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatVitalValues(vital, residentVitals, r)}
                          {news.complete ? ` · NEWS2 ${news.total}` : ""}
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
                        ? `${temperatureValues[0]}°C from ${temperatureValues[1]}°C`
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
            <Button size="sm" onClick={() => handleOpenModal("assessment")}>
              <Plus className="h-4 w-4 mr-1.5" /> Add assessment
            </Button>
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
                        <td className="p-3 text-xs">{a.nextReassessmentDate || "—"}</td>
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
                Deleted assessments ({rADeleted.length}) — audit trail
              </summary>
              <div className="mt-2 space-y-2">
                {rADeleted.map((a) => (
                  <div
                    key={a.id}
                    className="text-xs text-muted-foreground border-l-2 border-destructive/40 pl-3"
                  >
                    <strong>{assessmentMeta[a.type].name}</strong> · {a.date.slice(0, 10)}
                    <br />
                    Deleted by {a.deletedBy} on {a.deletedAt?.slice(0, 10)} — {a.deletedReason}
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
        </TabsContent>

        <TabsContent value="notes" className="space-y-2">
          {rClinicalActivity.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                {(() => {
                  const relatedProblem = carePlanProblems.find(
                    (plan) => plan.id === entry.carePlanId,
                  );
                  const relatedLabel = relatedProblem
                    ? `${getRltDomainForCarePlanProblem(relatedProblem)?.title || relatedProblem.category.replace(/_/g, " ")} · ${relatedProblem.problemStatement}`
                    : undefined;
                  return relatedLabel ? (
                    <div className="mb-2 text-xs">
                      <span className="text-muted-foreground">Related Care Plan: </span>
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline"
                        onClick={() => relatedProblem && openProblemDetail(relatedProblem.id)}
                      >
                        {relatedLabel}
                      </button>
                    </div>
                  ) : null;
                })()}
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{entry.occurredAt.slice(0, 10)}</span>
                  {entry.shift && (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {entry.shift}
                    </Badge>
                  )}
                  <Badge
                    variant={entry.readOnly ? undefined : "outline"}
                    className={
                      entry.readOnly
                        ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10"
                        : ""
                    }
                  >
                    {entry.kind === "daily_note" ? "Manual Note" : entry.kind.replaceAll("_", " ")}
                  </Badge>
                  {entry.readOnly && (
                    <Badge variant="outline" className="text-[10px]">
                      Automatic
                    </Badge>
                  )}
                  {entry.recordedBy && (
                    <span className="text-xs text-muted-foreground">{entry.recordedBy}</span>
                  )}
                </div>
                <p className="text-sm mt-2 font-medium">{entry.title}</p>
                <p className="text-sm mt-1">{entry.summary}</p>
                {entry.sourceRoute && (
                  <a
                    href={entry.sourceRoute}
                    className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                  >
                    View original record
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
          {rClinicalActivity.length === 0 && (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No daily notes or clinical activity have been recorded yet.
            </div>
          )}
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
                    {orderedProblemInterventions.map((intv) => {
                      const problem = rProblems.find((p) => p.id === intv.problemId);
                      const parentHeading = intv.parentInterventionId
                        ? rProblemInterventions.find(
                            (heading) => heading.id === intv.parentInterventionId,
                          )
                        : undefined;
                      return (
                        <tr key={intv.id} className="hover:bg-muted/30">
                          <td className="p-3 font-medium">
                            <div
                              className={`flex flex-wrap items-center gap-2 ${parentHeading ? "pl-5" : ""}`}
                            >
                              <span>
                                {parentHeading && " "}
                                {intv.name}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {CARE_ACTION_TYPE_LABELS[getCanonicalCareActionType(intv)]}
                              </Badge>
                            </div>
                            {parentHeading && (
                              <div className="pl-5 pt-0.5 text-[10px] font-normal text-muted-foreground">
                                Under: {parentHeading.name}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-xs">{problem?.problemStatement || "—"}</td>
                          <td className="p-3 text-xs">
                            {getCanonicalCareActionType(intv) === "scheduled"
                              ? intv.frequencyType.replace(/_/g, " ")
                              : getCanonicalCareActionType(intv) === "prn"
                                ? intv.prnConfiguration?.indication || "As needed"
                                : getCanonicalCareActionType(intv) === "triggered"
                                  ? intv.triggerConfiguration?.triggerConditionSummary ||
                                    "On defined trigger"
                                  : intv.oneOffConfiguration?.dueAt
                                    ? new Date(intv.oneOffConfiguration.dueAt).toLocaleString()
                                    : "Once, no fixed due time"}
                          </td>
                          <td className="p-3 text-xs">
                            {intv.assignedStaffName || intv.assignedRole || "—"}
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
                                onClick={() => handleEditIntervention(intv)}
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
                    {i.type.replace("_", " ")} — {i.date}
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
                  Action: {i.immediateAction} · Reported by {i.reportedBy}
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
                  {m.date} · {m.meetingType || "MDT"} · {m.authoredBy}
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
                  {v.date} · {v.arrivalTime}–{v.departureTime} · Signed in by {v.signedInBy}
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
                  {o.destination} — {o.date}
                </div>
                <p className="text-xs text-muted-foreground">
                  {o.departureTime}–{o.returnTime} · {o.transportMethod} · With {o.accompaniedBy}
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
          {generatedResidentHandovers.map((h) => (
            <Card key={h.id}>
              <CardContent className="p-4 flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <Badge variant="outline" className="mb-2">
                    Generated Shift Handover
                  </Badge>
                  <div className="text-sm font-medium capitalize">
                    {h.shiftType} Handover · Current Version v{h.versionNumber}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.periodFrom).toLocaleDateString("en-IE", { dateStyle: "medium" })} ·{" "}
                    {new Date(h.periodFrom).toLocaleTimeString("en-IE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    –
                    {new Date(h.periodTo).toLocaleTimeString("en-IE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs mt-1">
                    Generated by {h.generatedByName} · Reference: {h.referenceNumber} · Status:{" "}
                    <span className="capitalize">{h.status}</span> · {h.residentCount} resident
                    {h.residentCount === 1 ? "" : "s"} included · PDF available
                  </p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link
                    to="/handovers/generated/$handoverId"
                    params={{ handoverId: h.id }}
                    search={{ residentId: id } as never}
                  >
                    View Handover
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          {rHandovers.map((h) => (
            <Card key={h.id}>
              <CardContent className="p-4">
                <Badge variant="outline" className="mb-2">
                  Manual Handover Note
                </Badge>
                <div className="text-sm font-medium capitalize">
                  {h.shift} shift — {h.date}
                </div>
                <p className="text-xs text-muted-foreground">{h.staff}</p>
                <p className="text-sm mt-1">{h.summary}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Outstanding:</strong> {h.outstandingActions}
                </p>
              </CardContent>
            </Card>
          ))}
          {rHandovers.length === 0 && generatedResidentHandovers.length === 0 && (
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
                    <Label htmlFor="nok-name">Name</Label>
                    <Input
                      id="nok-name"
                      autoComplete="name"
                      placeholder="Full name"
                      value={newNok.name}
                      onChange={(e) => setNewNok({ ...newNok, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <Select
                      value={newNok.relationship}
                      onValueChange={(relationship) => setNewNok({ ...newNok, relationship })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Spouse / Partner">Spouse / Partner</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Son">Son</SelectItem>
                        <SelectItem value="Daughter">Daughter</SelectItem>
                        <SelectItem value="Sibling">Sibling</SelectItem>
                        <SelectItem value="Grandchild">Grandchild</SelectItem>
                        <SelectItem value="Niece / Nephew">Niece / Nephew</SelectItem>
                        <SelectItem value="Friend">Friend</SelectItem>
                        <SelectItem value="Legal representative">Legal representative</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nok-phone">Phone</Label>
                    <Input
                      id="nok-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="Landline number"
                      value={newNok.phone}
                      onChange={(e) => setNewNok({ ...newNok, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nok-mobile">Mobile</Label>
                    <Input
                      id="nok-mobile"
                      type="tel"
                      autoComplete="tel-national"
                      placeholder="Mobile number"
                      value={newNok.mobile}
                      onChange={(e) => setNewNok({ ...newNok, mobile: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nok-email">Email</Label>
                    <Input
                      id="nok-email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
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
                      if (!newNok.name.trim() || !newNok.relationship) {
                        toast.error("Name and relationship are required");
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
          <Dialog open={Boolean(editingNok)} onOpenChange={(open) => !open && setEditingNok(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Next of Kin</DialogTitle>
              </DialogHeader>
              {editingNok && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="edit-nok-name">Name</Label>
                    <Input
                      id="edit-nok-name"
                      value={editingNok.name}
                      onChange={(event) =>
                        setEditingNok({ ...editingNok, name: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <Select
                      value={editingNok.relationship}
                      onValueChange={(relationship) =>
                        setEditingNok({ ...editingNok, relationship })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Spouse / Partner">Spouse / Partner</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Son">Son</SelectItem>
                        <SelectItem value="Daughter">Daughter</SelectItem>
                        <SelectItem value="Sibling">Sibling</SelectItem>
                        <SelectItem value="Grandchild">Grandchild</SelectItem>
                        <SelectItem value="Niece / Nephew">Niece / Nephew</SelectItem>
                        <SelectItem value="Friend">Friend</SelectItem>
                        <SelectItem value="Legal representative">Legal representative</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-nok-phone">Phone</Label>
                    <Input
                      id="edit-nok-phone"
                      type="tel"
                      value={editingNok.phone}
                      onChange={(event) =>
                        setEditingNok({ ...editingNok, phone: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-nok-mobile">Mobile</Label>
                    <Input
                      id="edit-nok-mobile"
                      type="tel"
                      value={editingNok.mobile}
                      onChange={(event) =>
                        setEditingNok({ ...editingNok, mobile: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-nok-email">Email</Label>
                    <Input
                      id="edit-nok-email"
                      type="email"
                      value={editingNok.email}
                      onChange={(event) =>
                        setEditingNok({ ...editingNok, email: event.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-nok-address">Address</Label>
                    <Input
                      id="edit-nok-address"
                      value={editingNok.address}
                      onChange={(event) =>
                        setEditingNok({ ...editingNok, address: event.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-2 text-sm">
                    {(
                      [
                        ["primaryContact", "Primary contact"],
                        ["emergencyContact", "Emergency contact"],
                        ["powerOfAttorney", "Power of attorney"],
                        ["legalRepresentative", "Legal representative"],
                      ] as const
                    ).map(([field, label]) => (
                      <label key={field} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingNok[field]}
                          onChange={(event) =>
                            setEditingNok({ ...editingNok, [field]: event.target.checked })
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-nok-notes">Notes</Label>
                    <Textarea
                      id="edit-nok-notes"
                      value={editingNok.notes}
                      onChange={(event) =>
                        setEditingNok({ ...editingNok, notes: event.target.value })
                      }
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingNok(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!editingNok?.name.trim() || !editingNok.relationship) {
                      toast.error("Name and relationship are required");
                      return;
                    }
                    updateNextOfKin(r.id, editingNok.id, editingNok);
                    setEditingNok(null);
                    toast.success("Next of kin updated");
                  }}
                >
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                      {n.phone || n.mobile} · {n.email}
                    </div>
                    {n.address && <div className="text-xs text-muted-foreground">{n.address}</div>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" onClick={() => setEditingNok({ ...n })}>
                      Edit
                    </Button>
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
          <div>
            <h2 className="text-xl font-semibold">Resident alerts</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Clinical alerts recorded for {r.firstName} {r.lastName} only.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <span className="text-3xl font-semibold tabular-nums">{openAlertCount}</span>
            <span className="ml-3 text-sm text-muted-foreground">
              open clinical alert{openAlertCount === 1 ? "" : "s"}
            </span>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clinical alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rAlerts.length ? (
                rAlerts
                  .slice()
                  .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
                  .map((alert) => (
                    <div key={alert.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <AlertTriangle
                          className={`mt-0.5 h-5 w-5 shrink-0 ${alert.priority === "critical" || alert.priority === "high" ? "text-destructive" : "text-warning-foreground"}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{alert.title}</p>
                            <Badge
                              variant="outline"
                              className={`capitalize ${alert.priority === "critical" || alert.priority === "high" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-warning/40 bg-warning/10 text-warning-foreground"}`}
                            >
                              {alert.priority} priority
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{alert.description}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Raised {new Date(alert.createdAt).toLocaleString()}
                            {alert.acknowledged
                              ? ` · Acknowledged by ${alert.acknowledgedBy || "staff"}`
                              : " · Needs acknowledgement"}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {!alert.acknowledged && (
                            <Button
                              variant="outline"
                              className="min-h-11"
                              onClick={() => {
                                acknowledgeAlert(alert.id);
                                toast.success("Alert acknowledged");
                              }}
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            className="min-h-11"
                            onClick={() => {
                              resolveAlert(alert.id);
                              toast.success("Alert resolved");
                            }}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="font-medium">No open clinical alerts.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    New alerts will appear here when action is needed.
                  </p>
                </div>
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
                      Assigned to {t.assignedTo} · Due {t.dueDate}
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
                    Due {t.dueDate} · {t.assignedTo}
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
                      Progress: {t.status} · Due: {t.dueDate} · Assigned To: {t.assignedTo}
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
                  {e.module} · {e.summary || "—"} · {e.by || "System"}
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
                    <td className="p-2 text-xs capitalize">{row.role || "—"}</td>
                    <td className="p-2 text-xs">{row.module}</td>
                    <td className="p-2 text-xs">{row.action}</td>
                    <td className="p-2 text-xs truncate max-w-40">{row.before || "—"}</td>
                    <td className="p-2 text-xs truncate max-w-40">{row.after || "—"}</td>
                    <td className="p-2 text-xs">{row.reason || "—"}</td>
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
                    <td className="p-2 text-xs">{row.reason || "—"}</td>
                    <td className="p-2 text-xs">{row.supersededBy || "—"}</td>
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
      <RecordDailyCareDialog
        open={modalState.dailyCare}
        onOpenChange={(open) =>
          open ? handleOpenModal("dailyCare") : handleCloseModal("dailyCare")
        }
        residentId={r.id}
        nursingHomeId={r.facilityId || operationalContext.nursingHomeId}
        wardId={operationalContext.wardIds[0]}
        roomId={r.roomId}
        onSave={(command) => {
          recordDailyCare(command);
          toast.success("Daily Care recorded");
        }}
      />

      <AddDailyNoteModal
        open={modalState.note}
        onOpenChange={(open) => handleCloseModal("note")}
        residentId={r.id}
      />

      <Dialog
        open={Boolean(scheduleToDelete)}
        onOpenChange={(open) => {
          if (!open) setScheduleToDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Scheduled Task</DialogTitle>
            <DialogDescription>
              Delete the schedule for {scheduleToDelete?.name || "this Care Action"}? The Care
              Action itself will remain available.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason for deletion *</Label>
            <Textarea
              value={scheduleDeleteReason}
              onChange={(event) => setScheduleDeleteReason(event.target.value)}
              placeholder="Enter the reason for deleting this scheduled task"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!scheduleDeleteReason.trim()}
              onClick={() => {
                if (!scheduleToDelete) return;
                updateProblemIntervention(
                  scheduleToDelete.id,
                  { isScheduled: false },
                  scheduleDeleteReason.trim(),
                );
                toast.success("Scheduled task deleted");
                setScheduleToDelete(null);
              }}
            >
              Delete Scheduled Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddInterventionModal
        open={modalState.intervention}
        onOpenChange={(open) => {
          handleCloseModal("intervention");
          if (!open) {
            setPresetInterventionProblemId(undefined);
            setSelectedIntervention(null);
            setSelectedCareActionId(null);
          }
        }}
        residentId={r.id}
        initialProblemId={presetInterventionProblemId}
        lockProblemSelection={!!presetInterventionProblemId}
        intervention={selectedIntervention}
        scheduleOnly={Boolean(selectedCareActionId)}
        parentInterventionId={selectedIntervention ? undefined : selectedCareActionId || undefined}
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
        onOpenChange={(open) => {
          handleCloseModal("task");
          if (!open) {
            setSelectedCareActionTask(null);
            setSelectedCareActionId(null);
          }
        }}
        residentId={r.id}
        task={selectedCareActionTask}
        linkedCarePlanId={selectedCareActionId ? selectedProblem?.id : undefined}
        linkedInterventionId={selectedCareActionId || undefined}
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
              {rolePermissions.canEdit && (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={openEditProblemDialog}>
                    Edit Care Plan
                  </Button>
                </div>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nursing Care Plan</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-2 text-sm">
                  <Row
                    label="Care Plan Name"
                    value={selectedProblem.carePlanName || selectedProblem.problemStatement}
                  />
                  <Row label="Risk level" value={selectedProblem.riskLevel.replace(/_/g, " ")} />
                  <Row label="Created by" value={selectedProblem.createdBy} />
                  <Row label="Created on" value={selectedProblem.createdAt.slice(0, 10)} />
                  <Row label="Next review date" value={selectedProblem.reviewDate} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Care Plan Aim / Goal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="whitespace-pre-wrap text-sm">
                    {selectedProblemGoals.find((goal) => goal.status === "active")?.statement ||
                      selectedProblem.notes ||
                      "No care plan aim or goal recorded."}
                  </p>
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
                  {selectedProblemInterventions.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No care actions have been added.
                    </p>
                  )}
                  {selectedCareActionHeadings.map((intv) => {
                    const childScheduledTasks = selectedProblemInterventions.filter(
                      (task) => task.parentInterventionId === intv.id,
                    );
                    const legacyScheduledTaskCount = rTasks.filter(
                      (task) => task.linkedInterventionId === intv.id && task.status !== "deleted",
                    ).length;
                    const ownScheduledTaskCount = Math.max(
                      intv.isScheduled ? 1 : 0,
                      legacyScheduledTaskCount,
                    );
                    const scheduledTaskCount = childScheduledTasks.length + ownScheduledTaskCount;
                    return (
                      <details key={intv.id} className="rounded-md border">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3">
                          <div className="min-w-0">
                            <div className="font-medium">{intv.name}</div>
                            {(intv.description || intv.notes) && (
                              <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                {intv.description || intv.notes}
                              </div>
                            )}
                            {scheduledTaskCount > 0 && (
                              <div className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                ({scheduledTaskCount} scheduled task
                                {scheduledTaskCount === 1 ? "" : "s"})
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {intv.status.replace(/_/g, " ")}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(event) => {
                                event.preventDefault();
                                handleEditIntervention(intv);
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </summary>
                        <div className="space-y-3 border-t p-3 text-sm">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground">
                              Care action details
                            </div>
                            <p className="mt-1 whitespace-pre-wrap">
                              {intv.description ||
                                intv.notes ||
                                "No additional instructions recorded."}
                            </p>
                          </div>
                          <div className="grid gap-2 text-xs sm:grid-cols-3">
                            <span>
                              Assigned:{" "}
                              {intv.assignedStaffName || intv.assignedRole || "Unassigned"}
                            </span>
                            {intv.isScheduled && (
                              <span>
                                Start: {intv.startDate}
                                {intv.startTime ? ` at ${intv.startTime}` : ""}
                              </span>
                            )}
                            <span>Review: {intv.reviewDate || "Not set"}</span>
                          </div>
                          <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3 dark:border-sky-900 dark:bg-sky-950/20">
                            <div className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
                              <Calendar className="h-5 w-5 text-sky-700 dark:text-sky-300" />
                              Scheduled Tasks
                            </div>
                            <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                              Tasks listed here belong to this care action heading.
                            </p>
                            {childScheduledTasks.map((task) => (
                              <div
                                key={task.id}
                                className="mt-3 flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                              >
                                <div>
                                  <div className="text-base font-semibold text-slate-800 dark:text-slate-100">
                                    {task.name}
                                  </div>
                                  <div className="mt-1 text-slate-600 dark:text-slate-300">
                                    {task.frequencyType.replace(/_/g, " ")} · {task.startDate}
                                    {task.startTime ? ` at ${task.startTime}` : ""}
                                  </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="min-h-10 px-3 font-semibold"
                                    onClick={() => handleEditIntervention(task)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-10 w-10 text-destructive"
                                    title="Delete scheduled task"
                                    onClick={() => {
                                      setScheduleToDelete(task);
                                      setScheduleDeleteReason("");
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {ownScheduledTaskCount > 0 && (
                              <div className="mt-2 flex items-center justify-between gap-2 rounded border bg-background px-2 py-1 text-xs">
                                <span>{intv.frequencyType.replace(/_/g, " ")} schedule</span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedIntervention(intv);
                                      setSelectedCareActionId(intv.id);
                                      setModalState((prev) => ({ ...prev, intervention: true }));
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Delete scheduled task"
                                    onClick={() => {
                                      setScheduleToDelete(intv);
                                      setScheduleDeleteReason("");
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedIntervention(null);
                                  setPresetInterventionProblemId(selectedProblem.id);
                                  setSelectedCareActionId(intv.id);
                                  setModalState((prev) => ({ ...prev, intervention: true }));
                                }}
                              >
                                Add Schedule Task
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedIntervention(intv);
                                  setSelectedCareActionId(intv.id);
                                  setModalState((prev) => ({ ...prev, intervention: true }));
                                }}
                              >
                                Edit Schedule
                              </Button>
                            </div>
                          </div>
                        </div>
                      </details>
                    );
                  })}
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
                        {evl.date.slice(0, 10)} · {evl.evaluatorName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Progress: {evl.progress.replace(/_/g, " ")} · Plan Met: {evl.goalsMet}
                      </div>
                      <div className="text-xs">Outcome: {evl.recommendations || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        Next Review of Outcome: {evl.nextEvaluationDate || "—"}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Related Daily Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {linkedDailyNotes.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No Daily Notes have been linked to this care plan.
                    </p>
                  )}
                  {linkedDailyNotes
                    .slice()
                    .sort((left, right) => right.date.localeCompare(left.date))
                    .map((note) => (
                      <details key={note.id} className="rounded-md border p-2 text-sm">
                        <summary className="cursor-pointer list-none">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">
                              {new Date(note.date).toLocaleString("en-GB")}
                            </span>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {note.shift}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{note.staff}</span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm">
                            {[note.observation, note.behaviour, note.additionalNotes]
                              .filter(Boolean)
                              .join(" ")}
                          </p>
                        </summary>
                        <p className="mt-3 whitespace-pre-wrap border-t pt-3 text-sm">
                          {[note.observation, note.behaviour, note.additionalNotes]
                            .filter(Boolean)
                            .join(" ")}
                        </p>
                      </details>
                    ))}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editProblemOpen} onOpenChange={setEditProblemOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Care Plan</DialogTitle>
            <DialogDescription>
              Update the permitted care plan details. Status changes are retained for audit.
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label>Care Plan Name</Label>
              <Textarea
                value={editProblemDraft.problemStatement}
                onChange={(event) =>
                  setEditProblemDraft((draft) => ({
                    ...draft,
                    problemStatement: event.target.value,
                  }))
                }
                placeholder="Describe the care need"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={editProblemDraft.category}
                onValueChange={(value) =>
                  setEditProblemDraft((draft) => ({
                    ...draft,
                    category: value as ProblemCategory,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {carePlanCategoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Risk Level</Label>
              <Select
                value={editProblemDraft.riskLevel}
                onValueChange={(value) =>
                  setEditProblemDraft((draft) => ({
                    ...draft,
                    riskLevel: value as ProblemRiskLevel,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {carePlanRiskOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Next Review Date</Label>
              <Input
                type="date"
                value={editProblemDraft.reviewDate}
                onChange={(event) =>
                  setEditProblemDraft((draft) => ({
                    ...draft,
                    reviewDate: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Next Review of Outcome</Label>
              <Input
                type="date"
                value={editProblemDraft.evaluationDate}
                onChange={(event) =>
                  setEditProblemDraft((draft) => ({
                    ...draft,
                    evaluationDate: event.target.value,
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <Label>Progress / Status</Label>
              <Select
                value={editProblemDraft.status}
                onValueChange={(value) =>
                  setEditProblemDraft((draft) => ({
                    ...draft,
                    status: value as ProblemStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {carePlanStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Use Archived / Inactive to remove a plan from active care. Use Entered in Error /
                Delete only when the record should be hidden from active use but retained for audit.
              </p>
            </div>
            <div className="md:col-span-2">
              <Label>Details</Label>
              <Textarea
                value={editProblemDraft.notes}
                onChange={(event) =>
                  setEditProblemDraft((draft) => ({
                    ...draft,
                    notes: event.target.value,
                  }))
                }
                placeholder="Add permitted care plan details"
              />
            </div>
            <div className="md:col-span-2">
              <Label>
                Reason for Change
                {selectedProblem &&
                editProblemDraft.status !== selectedProblem.status &&
                editProblemDraft.status !== "active"
                  ? " *"
                  : ""}
              </Label>
              <Textarea
                value={editProblemDraft.reason}
                onChange={(event) =>
                  setEditProblemDraft((draft) => ({
                    ...draft,
                    reason: event.target.value,
                  }))
                }
                placeholder="Required when setting inactive, discontinued, superseded, archived or entered in error"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProblemOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitEditProblem}
              disabled={
                !editProblemDraft.problemStatement.trim() ||
                !editProblemDraft.reviewDate ||
                (!!selectedProblem &&
                  editProblemDraft.status !== selectedProblem.status &&
                  editProblemDraft.status !== "active" &&
                  !editProblemDraft.reason.trim())
              }
            >
              Save Changes
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
              <Label>Status</Label>
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
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                  <SelectItem value="entered_in_error">Entered in Error</SelectItem>
                  <SelectItem value="superseded">Superseded</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
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
  const update = (patch: Partial<OverviewDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

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
      bed:
        draft.bedType || draft.mattressType || draft.installationDate || draft.reviewDate
          ? {
              bedType: (draft.bedType || "standard") as NonNullable<Resident["bed"]>["bedType"],
              mattressType: (draft.mattressType || "foam") as NonNullable<
                Resident["bed"]
              >["mattressType"],
              installationDate: draft.installationDate,
              reviewDate: draft.reviewDate,
            }
          : undefined,
      keyWorkers:
        draft.namedNurse || draft.namedCarer || draft.keyWorker
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
          <DialogDescription>
            All fields are optional and can be completed over time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <OverviewSection title="Clinical">
            <Field
              label="Primary diagnosis"
              value={draft.primaryDiagnosis}
              onChange={(v) => update({ primaryDiagnosis: v })}
            />
            <Field
              label="Known allergies"
              value={draft.allergies}
              onChange={(v) => update({ allergies: v })}
            />
            <div className="md:col-span-2">
              <Label>Medical history</Label>
              <Textarea
                value={draft.medicalHistory}
                onChange={(e) => update({ medicalHistory: e.target.value })}
              />
            </div>
            <div>
              <Label>Mental capacity</Label>
              <Select
                value={draft.mentalCapacity}
                onValueChange={(value) =>
                  update({ mentalCapacity: value as Resident["mentalCapacity"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Textarea
                value={draft.currentMedication}
                onChange={(e) => update({ currentMedication: e.target.value })}
              />
            </div>
          </OverviewSection>
          <OverviewSection title="Bed Management">
            <OverviewSelect
              label="Bed type"
              value={draft.bedType}
              onChange={(v) => update({ bedType: v as any })}
              options={[
                ["standard", "Standard"],
                ["low", "Low"],
                ["profiling", "Profiling"],
                ["bariatric", "Bariatric"],
              ]}
            />
            <OverviewSelect
              label="Mattress"
              value={draft.mattressType}
              onChange={(v) => update({ mattressType: v as any })}
              options={[
                ["foam", "Foam"],
                ["dynamic", "Dynamic"],
                ["air_mattress", "Air Mattress"],
                ["pressure_relieving", "Pressure-relieving mattress"],
              ]}
            />
            <Field
              label="Installed date"
              type="date"
              value={draft.installationDate}
              onChange={(v) => update({ installationDate: v })}
            />
            <Field
              label="Review date"
              type="date"
              value={draft.reviewDate}
              onChange={(v) => update({ reviewDate: v })}
            />
          </OverviewSection>
          <OverviewSection title="Key Workers">
            <Field
              label="Named Nurse"
              value={draft.namedNurse}
              onChange={(v) => update({ namedNurse: v })}
            />
            <Field
              label="Named Carer"
              value={draft.namedCarer}
              onChange={(v) => update({ namedCarer: v })}
            />
            <Field
              label="Key Worker"
              value={draft.keyWorker}
              onChange={(v) => update({ keyWorker: v })}
            />
          </OverviewSection>
          <OverviewSection title="GP / Consultant">
            <Field label="GP" value={draft.gp} onChange={(v) => update({ gp: v })} />
            <Field
              label="Consultant"
              value={draft.consultant}
              onChange={(v) => update({ consultant: v })}
            />
            <Field
              label="Emergency contact"
              value={draft.emergencyContact}
              onChange={(v) => update({ emergencyContact: v })}
            />
          </OverviewSection>
          <OverviewSection title="Preferences">
            <Field
              label="Communication"
              value={draft.communicationNeeds}
              onChange={(v) => update({ communicationNeeds: v })}
            />
            <Field
              label="Religion"
              value={draft.religion}
              onChange={(v) => update({ religion: v })}
            />
            <Field
              label="Preferred language"
              value={draft.preferredLanguage}
              onChange={(v) => update({ preferredLanguage: v })}
            />
          </OverviewSection>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save details</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OverviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
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
        <SelectTrigger>
          <SelectValue placeholder="Not recorded" />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, label]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {label}
            </SelectItem>
          ))}
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
      <div className="col-span-2 capitalize">{value || "—"}</div>
    </div>
  );
}

function OverviewCard({
  title,
  icon,
  onEdit,
  children,
}: {
  title: string;
  icon: ReactNode;
  onEdit?: () => void;
  children: ReactNode;
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex min-h-16 flex-row items-center justify-between gap-3 border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          {icon}
          {title}
        </CardTitle>
        {onEdit && (
          <Button size="sm" variant="outline" className="min-h-11" onClick={onEdit}>
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-x-6 gap-y-4 pt-5 text-base sm:grid-cols-2">
        {children}
      </CardContent>
    </Card>
  );
}

function OverviewField({
  label,
  value,
  wide = false,
  emphasis = false,
}: {
  label: string;
  value?: string;
  wide?: boolean;
  emphasis?: boolean;
}) {
  if (!value?.trim()) return null;
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <p className="text-sm font-medium text-foreground/80">{label}</p>
      <p className={`mt-1 break-words leading-6 ${emphasis ? "font-medium" : ""}`}>{value}</p>
    </div>
  );
}
