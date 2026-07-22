import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import type {
  Resident,
  Assessment,
  Intervention,
  DailyNote,
  Evaluation,
  Alert,
  ActionAlertWorkflow,
  Task,
  AuditLog,
  Role,
  Incident,
  MDTNote,
  Visitor,
  Outing,
  HandoverNote,
  NextOfKin,
  Wing,
  Unit,
  Room,
  UserProfile,
  InterventionLog,
  ReadReceipt,
  Observation,
  WeightRecord,
  FluidRecord,
  FoodRecord,
  PainRecord,
  SleepRecord,
  BowelRecord,
  BehaviourRecord,
  IncidentAction,
  ShiftSummary,
  TimelineEvent,
  TimelineEventType,
  ResidentCarePlan,
  CarePlanProblem,
  ProblemGoal,
  ProblemIntervention,
  ProblemInterventionLog,
  ProblemEvaluation,
  ProblemReview,
  ProblemHistoryEntry,
  ProblemHistoryAction,
  AssessmentSuggestion,
  ProblemCategory,
  ProblemRiskLevel,
  FrequencyType,
  AssessmentAuditEntry,
  AssessmentComment,
  AssessmentReviewTriggerEvent,
  ReviewTriggerType,
  AssessmentType,
  VitalSign,
  VitalAuditEntry,
  ObservationPlan,
  ObservationPlanItem,
  ClinicalAlert,
  ClinicalEscalationNote,
  ClinicalObservation,
  ObservationKind,
  ObservationSchedule,
  ObservationScheduleItem,
  ObservationAuditEntry,
  Facility,
  Enterprise,
  Ward,
  Bed,
  BedAssignment,
  Admission,
  AbsenceEpisode,
  UserAccount,
  StaffMember,
  StaffDirectoryEvent,
  StaffEmergencyContact,
  StaffMemberStatus,
  EmploymentRecord,
  EmploymentHomeAssignment,
  EmploymentRoleAssignment,
  WorkforceEmploymentEvent,
  RoleAssignment,
  ProfessionalRegistration,
  ProfessionalRegistrationBody,
  ProfessionalRegistrationEvent,
  ProfessionalRegistrationRequirement,
  StaffDocument,
  StaffDocumentEvent,
  StaffDocumentRequirement,
  StaffDocumentType,
  StaffDocumentVerificationRecord,
  StaffEmploymentPermitRecord,
  StaffEmploymentPermitType,
  StaffImmigrationEvent,
  StaffImmigrationRequirementProfile,
  StaffResidencePermissionRecord,
  StaffVisaRecord,
  StaffVisaType,
  TrainingCategory,
  TrainingCourse,
  TrainingRequirement,
  StaffTrainingAssignment,
  StaffTrainingCompletion,
  TrainingEvent,
  CompetencyDefinition,
  CompetencyRequirement,
  StaffCompetencyValidation,
  CompetencyEvent,
  WardCompetencyRequirement,
  WardCompetencyRequirementEvent,
  StaffingEstablishmentVersion,
  StaffingEstablishmentLine,
  StaffingEstablishmentEvent,
  RecruitmentAdvertisingSource,
  RecruitmentVacancy,
  RecruitmentCandidate,
  RecruitmentOffer,
  RecruitmentEvent,
  RosterPeriod,
  RosterShiftRequirement,
  PlannedShift,
  RosterEvent,
  StaffLeaveRecord,
  StaffLeaveEvent,
  AgencyCompany,
  AgencyWorker,
  AgencyRateAgreement,
  AgencyShiftAssignment,
  AgencyTimesheet,
  AgencySpendAlertPolicy,
  AgencyEvent,
  StaffProbation,
  StaffProbationReview,
  StaffProbationExtension,
  ProbationReviewSchedulePolicy,
  ProbationEvent,
  StaffingEstablishmentWtePolicy,
  HomeAssignment,
  WardCompetency,
  RosterAssignment,
  PermissionGrant,
  RoleTemplate,
  AuditRecord,
  ShiftDefinition,
  OperationalContext,
  MaintenanceWorkOrder,
  MaintenanceAsset,
  MaintenanceAssetCategory,
  MaintenanceAssetDocument,
  MaintenanceAssetPhoto,
  MaintenanceAssetLocationHistory,
  MaintenanceAssetRelationship,
  MaintenanceAssetDocumentType,
  MaintenanceAssetRelationshipType,
  MaintenanceTemplate,
  MaintenanceTemplateChecklist,
  MaintenanceTemplateEvidence,
  PlannedMaintenanceSchedule,
  PlannedMaintenanceOccurrence,
  PlannedMaintenanceFrequencyType,
  MaintenanceTemplateEvidenceType,
  WorkOrderNote,
  WorkOrderAttachment,
  WorkOrderLabourEntry,
  WorkOrderMaterialEntry,
  WorkOrderCompletionRecord,
  WorkOrderVerificationRecord,
  SafetyCategory,
  SafetyInspectionTemplate,
  SafetyInspectionTemplateItem,
  SafetyInspectionTemplateEvidenceRequirement,
  SafetyInspectionSchedule,
  SafetyInspectionOccurrence,
  SafetyInspection,
  SafetyInspectionResponse,
  SafetyInspectionObservation,
  SafetyInspectionEvidence,
  SafetyCertificate,
  SafetyInspectionVerification,
  SafetyCategoryCode,
  SafetyEvidenceType,
  SafetyChecklistResponseType,
  SafetySeverity,
  SafetyVerificationRejectionReason,
  MaintenanceCertificate,
  MaintenanceCertificateVersion,
  MaintenanceCertificateType,
  MaintenanceCertificateAttachment,
  MaintenanceCertificateAssetLink,
  MaintenanceCertificateWorkOrderLink,
  MaintenanceCertificateSafetyInspectionLink,
  MaintenanceCertificateContractorLink,
  MaintenanceCertificateRequirement,
  MaintenanceCertificateTimelineEvent,
  MaintenanceCertificateSubjectType,
  MaintenanceCertificateTypeCategory,
  MaintenanceCertificateAttachmentType,
  MaintenanceCertificateLinkRelationship,
  MaintenanceContractor,
  MaintenanceContractorHomeAssociation,
  MaintenanceContractorNote,
  MaintenanceContractorContact,
  MaintenanceContractorServiceArea,
  MaintenanceContractorTimelineEvent,
  MaintenanceContractorBusinessType,
  MaintenanceContractorStatus,
  MaintenanceContractorHomeAssociationStatus,
  MaintenanceContractorHomeAccessLevel,
  MaintenanceContractorHomeRelationshipType,
  MaintenanceContractorNoteType,
  MaintenanceContractorContactRole,
  MaintenanceContractorServiceAreaType,
  HousekeepingTemplate,
  HousekeepingTemplateSection,
  HousekeepingTemplateItem,
  HousekeepingSchedule,
  HousekeepingTask,
  HousekeepingTaskResponse,
  HousekeepingEvidence,
  HousekeepingException,
  CleaningAudit,
  CleaningAuditResponse,
  QualityInspection,
  QualityInspectionResponse,
  HousekeepingReinspection,
  RoomReadinessRecord,
  RoomStatusHistory,
  HousekeepingCleaningType,
  HousekeepingEvidenceType,
  HousekeepingExceptionType,
  HousekeepingSeverity,
} from "./types";
import {
  archiveWorkOrderRecord,
  createWorkOrderRecord,
  PRIORITY_RANK,
  updateWorkOrderRecord,
  validateWorkOrderInput,
  workOrderAuditLog,
  type CreateWorkOrderInput,
  type UpdateWorkOrderInput,
} from "@/domain/maintenance/workOrders";
import {
  applyWorkOrderWorkflow,
  type WorkOrderWorkflowInput,
} from "@/domain/maintenance/workOrderWorkflow";
import {
  buildWorkOrderTimeline,
  classifyAttachmentEvidence,
  createWorkOrderAttachmentRecord,
  createWorkOrderLabourRecord,
  createWorkOrderMaterialRecord,
  createWorkOrderNoteRecord,
  editWorkOrderNoteRecord,
  softDeleteExecutionRecord,
  workOrderExecutionAuditLog,
  type WorkOrderAttachmentUploadInput,
  type WorkOrderLabourInput,
  type WorkOrderMaterialInput,
} from "@/domain/maintenance/workOrderExecution";
import {
  createWorkOrderCompletionRecord,
  evaluateWorkOrderCompletionEligibility,
  workOrderCompletionAuditLog,
  type WorkOrderCompletionInput,
} from "@/domain/maintenance/workOrderCompletion";
import {
  applyVerificationResultToCompletion,
  assignWorkOrderVerification,
  claimWorkOrderVerification,
  createWorkOrderVerificationRecord,
  createWorkOrderVerificationRejectionRecord,
  evaluateVerificationEligibility,
  releaseWorkOrderVerification,
  workOrderVerificationAuditLog,
  type VerificationAssignmentInput,
  type WorkOrderRejectVerificationInput,
  type WorkOrderVerifyInput,
} from "@/domain/maintenance/workOrderVerification";
import {
  DEFAULT_ASSET_CATEGORIES,
  assetAuditLog,
  assetIsReadOnly,
  canReceiveWorkOrder,
  nextAssetNumber,
  validateAssetCategoryInput,
  validateAssetInput,
} from "@/domain/maintenance/assets";
import {
  STARTER_MAINTENANCE_TEMPLATES,
  buildGeneratedWorkOrderInput,
  buildPlannedMaintenanceAssets,
  generateOccurrencesForSchedule,
  plannedMaintenanceAuditLog,
  validateScheduleInput,
  validateTemplateInput,
} from "@/domain/maintenance/plannedMaintenance";
import {
  DEFAULT_SAFETY_CATEGORIES,
  createSafetyResponsesFromTemplate,
  evaluateSafetyInspection,
  nextSafetyDueDate,
  responseResultFromValue,
  safetyPresentationStatus,
  validateSafetyCategory,
  validateSafetySchedule,
  validateSafetyTemplate,
} from "@/domain/maintenance/safetyCompliance";
import {
  createHousekeepingResponsesFromTemplate,
  evaluateHousekeepingTask,
  nextHousekeepingDueDate,
  responseResultFromHousekeepingValue,
  validateHousekeepingSchedule,
  validateHousekeepingTemplate,
} from "@/domain/maintenance/housekeeping";
import {
  certificateComplianceStatus,
  validateCertificateInput,
  validateCertificateType,
  validateRequirement,
} from "@/domain/maintenance/certificates";
import {
  canTransitionContractorStatus,
  contractorTimelineSummary,
  nextContractorReference,
  potentialContractorDuplicates,
  validateContractorInput,
} from "@/domain/maintenance/contractors";
import {
  createStaffDirectoryEvent,
  createStaffMemberRecord,
  createEmploymentRecord,
  createProfessionalRegistration,
  getAuthorisedWorkforceScope,
  appendRegistrationVerification,
  createEmploymentPermitRecord,
  updateEmploymentRecord as updateEmploymentRecordService,
  updateProfessionalRegistration as updateProfessionalRegistrationService,
  createResidencePermissionRecord,
  createStaffDocument,
  createStaffVisaRecord,
  DEFAULT_STAFF_DOCUMENT_TYPES,
  DEFAULT_STAFF_EMPLOYMENT_PERMIT_TYPES,
  DEFAULT_STAFF_VISA_TYPES,
  updateStaffDocument,
  verifyImmigrationRecord,
  verifyStaffDocument,
  assignTrainingToStaff,
  DEFAULT_COMPETENCY_DEFINITIONS,
  DEFAULT_TRAINING_COURSES,
  recordCompetencyValidation,
  recordTrainingCompletion,
  verifyTrainingCompletion,
  addStaffingEstablishmentLine,
  approveStaffingEstablishment,
  addRecruitmentCandidate,
  addRosterShiftRequirement,
  assignAgencyWorkerToShift,
  approveStaffLeaveRecord,
  assignPlannedShift,
  completeProbationReview,
  completeStaffProbation,
  createAgencyCompany,
  createAgencyWorker,
  createRecruitmentOffer,
  createRecruitmentVacancy,
  createRosterPeriod,
  createStaffHomeAssignment,
  createStaffLeaveRecord,
  createStaffProbation,
  createStaffingEstablishmentDraft,
  DEFAULT_RECRUITMENT_ADVERTISING_SOURCES,
  endStaffHomeAssignment,
  extendStaffProbation,
  recordAgencyTimesheet,
  scheduleProbationReviews,
  transitionAgencyTimesheet,
  transitionRecruitmentOffer,
  transitionRecruitmentVacancy,
  updateStaffMemberRecord,
  type CreateEmploymentRecordCommand,
  type CreateEmploymentPermitRecordCommand,
  type CreateProfessionalRegistrationCommand,
  type CreateResidencePermissionRecordCommand,
  type CreateStaffDocumentCommand,
  type CreateStaffVisaRecordCommand,
  type AssignTrainingCommand,
  type RecordCompetencyValidationCommand,
  type RecordTrainingCompletionCommand,
  type AddStaffingEstablishmentLineCommand,
  type AddRecruitmentCandidateCommand,
  type AddRosterShiftRequirementCommand,
  type AssignPlannedShiftCommand,
  type AssignAgencyWorkerToShiftCommand,
  type CreateRecruitmentOfferCommand,
  type CreateRecruitmentVacancyCommand,
  type CreateRosterPeriodCommand,
  type CreateAgencyCompanyCommand,
  type CreateAgencyWorkerCommand,
  type CreateStaffProbationCommand,
  type RecordAgencyTimesheetCommand,
  type CreateStaffHomeAssignmentCommand,
  type CreateStaffLeaveRecordCommand,
  type CreateStaffingEstablishmentDraftCommand,
  type SaveStaffMemberInput,
} from "@/domain/workforce";
import {
  getBedById,
  getBedsForRoom,
  getEnterpriseById,
  getNursingHomeById,
  getResidentCurrentBed,
  getResidentCurrentNursingHome,
  getResidentCurrentPlacement,
  getResidentCurrentRoom,
  getResidentCurrentWard,
  getResidentsForNursingHome,
  getResidentsForRoom,
  getResidentsForWard,
  getRoomById,
  getRoomsForWard,
  getWardById,
  getWardsForNursingHome,
  migrateEntityHierarchy,
  DEFAULT_ENTERPRISE_ID,
} from "./entityHierarchy";
import {
  getActiveLongTermResidents,
  getActiveRespiteResidents,
  getCurrentResidents,
  getHospitalTransferResidents,
  getInactiveResidents,
  getPreAdmissionRecords,
  getResidentAdmissionType,
  getResidentBedAssignmentHistory,
  getResidentCurrentBedAssignment,
  getResidentDisplayStatus,
  getResidentLifecycleStatus,
  getResidentPresenceStatus,
  getScheduledAdmissions,
  getTemporarilyAbsentResidents,
  getOccupancyByNursingHome,
  getOccupancyByWard,
  isResidentActive,
  isResidentEligibleForInHomeWork,
  isResidentInHome,
  isResidentOccupyingBed,
  isResidentRespite,
  migrateResidentLifecycle,
} from "./residentLifecycle";
import {
  canAccess,
  createStaffAccessContext,
  explainAuthorizationDecision,
  getCurrentEmployment,
  getCurrentStaffMember,
  getEffectivePermissions,
  getExpiredRegistrations,
  getRegistrationStatus,
  getRegistrationsExpiringWithin,
  getStaffAccessibleHomes,
  getStaffAccessibleWards,
  getStaffEmploymentRecords,
  getStaffForWard,
  getStaffHomeAssignments,
  getStaffMemberById,
  getStaffOnDuty,
  getStaffProfessionalRegistrations,
  getStaffRoleAssignments,
  getStaffRosterAssignments,
  getStaffWardCompetencies,
  getStaffWithoutRequiredRegistration,
  getUserAccountById,
  migrateStaffAccess,
} from "./staffAccess";
import {
  getAuditForEntity,
  getAuditForNursingHome,
  getAuditForResident,
  getAuditForUser,
  getAuditForWard,
  migrateLegacyAuditRecords,
  recordAuditEvent,
  searchAudit,
  validateAuditFramework,
  type AuditSearchFilters,
} from "./auditFramework";
import {
  getAlertsForContext,
  getCareActionsForContext,
  getConfiguredShifts,
  getCurrentShift,
  getHandoversForContext,
  getIncidentsForContext,
  getNextShift,
  getObservationsForOperationalContext,
  getOperationalTimeWindows,
  getPreviousShift,
  getResidentsForContext,
  getShiftById,
  getShiftDateRange,
  getTasksDueForContext,
  validateShiftDefinitions,
  validateWardShiftContext,
  canSwitchToWard,
  canSelectMultipleWards,
  initialiseOperationalContext,
  migrateOperationalContext,
  selectAllAuthorisedWards,
  selectMultipleWards,
  selectSingleWard,
  switchNursingHome,
  validateOperationalContext,
} from "./operationalContext";
import {
  getHandoversForOperationalContext as getContextualHandovers,
  resolveHandoverContextFields,
  type HandoverContextFilters,
  type ContextualHandover,
} from "./handoverContext";
import { calcNEWS2, derivedAlertsForResident, type AlertSeed } from "./vitals";
import { canonicalObservationFromVital } from "@/domain/observations/observationService";
import { scoreAssessment } from "./scoring";
import { suggestionsForAssessment, newId } from "./problems";
import { CATEGORY_TO_RLT_DOMAIN } from "./rlt";
import {
  changeRltDependency,
  recordRltDependency,
  reviewRltDependency,
  type RecordRltDependencyInput,
  type RltDependencyState,
} from "./rltDependency";
import {
  createResidentPreference,
  createResidentStrength,
  type CreatePreferenceInput,
  type CreateStrengthInput,
  type StrengthPreferenceContext,
  type StrengthPreferenceState,
} from "./residentStrengthPreferences";
import type { RltTimelineTagState } from "./rltTimeline";
import { EMPTY_RESIDENT_PROFILE_STATE, updateResidentProfile, type ResidentProfileState, type UpdateResidentProfileInput } from "./residentProfile";
import {
  EMPTY_FLEXIBLE_CARE_ACTION_STATE,
  activateOneOffCareAction,
  validateCareActionConfiguration,
  type FlexibleCareActionState,
} from "./flexibleCareActions";
import {
  EMPTY_END_OF_LIFE_STATE,
  activateEndOfLifeCare,
  createEndOfLifePathway,
  markLastDaysOfLife,
  reconcileCareWorkAfterResidentDeath,
  recordResidentDeath,
  type EndOfLifeContext,
  type EndOfLifeState,
} from "./endOfLifePathway";
import { EMPTY_RESIDENT_DOCUMENT_STATE, uploadResidentDocument as uploadResidentDocumentService, uploadNewResidentDocumentVersion as uploadNewResidentDocumentVersionService, changeResidentDocumentStatus as changeResidentDocumentStatusService, type ResidentDocumentState, type UploadDocumentMetadata, type ResidentDocumentStatus, type ResidentDocumentVersion } from "./residentDocuments";
import { storeResidentFile } from "./residentFileStorage";
import { categoryFor, computeNextReviewDate, TRIGGER_TO_TYPES } from "./assessments";
import {
  appendEventRecord,
  createCorrelationId,
  createDomainEvent,
  getDeadLetterEvents,
  getEventById,
  getEventsByCorrelationId,
  getEventsForEntity,
  getEventsForResident,
  getFailedEvents,
  getProcessingReceipts,
  publishPendingEvents,
  validateDomainEvent,
  type EventArchitectureState,
  type EventHandlerRegistration,
  type EventProcessingReceipt,
  type EventStoreRecord,
} from "@/domain/events/eventBus";
import type { AnyDomainEvent } from "@/domain/events/eventTypes";
import type {
  ResidentBaselineEvent,
  ResidentClinicalBaseline,
} from "@/domain/baselines/residentBaselineTypes";
import type { DailyCareDomainEvent, DailyCareRecord, DailyCareTrendEvaluationResult, DailyCareTrendPolicy, RecordDailyCareCommand } from "@/domain/dailyCare";
import { handleDailyCareRecordedForTrends, recordDailyCare as recordDailyCareService } from "@/domain/dailyCare";
import type { DeteriorationIssue, DeteriorationIssueEvent } from "@/domain/deterioration";
import type { HcaEscalationEvent, HcaNurseEscalation, SubmitHcaNurseEscalationCommand } from "@/domain/escalation";
import { submitHcaNurseEscalation as submitHcaNurseEscalationService } from "@/domain/escalation";
import { can } from "./permissions";
import { DEFAULT_RULE_DEFINITIONS } from "@/domain/rules/ruleCatalog";
import { evaluateEventAgainstRules, processRulesForEvent, replayRuleForEvent } from "@/domain/rules/ruleEngine";
import {
  acknowledgeRuleIssue,
  dismissRuleIssue,
  escalateRuleIssue,
  resolveRuleIssue,
} from "@/domain/rules/ruleIssueLifecycle";
import { getApplicableRules } from "@/domain/rules/ruleRegistry";
import type {
  RuleDefinition,
  RuleEngineState,
  RuleEvaluationResult,
  RuleGeneratedOutput,
  RuleIssue,
  RuleIssueActionContext,
  RuleIssueEpisode,
  RuleIssueTransition,
  RuleOverride,
  RuleProcessingReceipt,
  RuleRecalculationItem,
  RuleRecalculationRequest,
  RuleSuppression,
} from "@/domain/rules/ruleTypes";
import type { AssessmentRequirementRecord } from "@/domain/assessments/riskAssessmentComplianceService";

let _uidSeq = 0;
const uid = () => `id-${(++_uidSeq).toString(36).padStart(6, "0")}`;
const STORE_STORAGE_KEY = "carepath-pro-data";
const LEGACY_STORE_STORAGE_KEY = "carepath-pro-store";
const TRAINING_COURSE_CLEANUP_VERSION = "2026-07-17-clear-training-courses";
export const BALLYMORE_FACILITY_ID = "facility-ballymore-haven";
export const HAZELWOOD_FACILITY_ID = "facility-hazelwood-care";
const ACTIVE_FACILITY_STORAGE_KEY = "carepath-pro-active-facility";
const CURRENT_USER_STORAGE_KEY = "carepath-pro-current-user";
const ENTERPRISES_SEED: Enterprise[] = [
  {
    id: DEFAULT_ENTERPRISE_ID,
    name: "NuCare Organisation",
    active: true,
    createdAt: "2026-07-13T00:00:00.000Z",
    updatedAt: "2026-07-13T00:00:00.000Z",
  },
];
const FACILITIES_SEED: Facility[] = [
  {
    id: BALLYMORE_FACILITY_ID,
    enterpriseId: DEFAULT_ENTERPRISE_ID,
    name: "Ballymore Haven",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-07-13T00:00:00.000Z",
    createdBy: "System",
  },
  {
    id: HAZELWOOD_FACILITY_ID,
    enterpriseId: DEFAULT_ENTERPRISE_ID,
    name: "Hazelwood Care",
    status: "active",
    createdAt: "2026-07-06T00:00:00.000Z",
    updatedAt: "2026-07-13T00:00:00.000Z",
    createdBy: "System",
  },
];
const DEFAULT_RISK_ASSESSMENT_REQUIREMENTS: AssessmentRequirementRecord[] = [
  {
    id: "assessment-requirement-waterlow-active-residents",
    assessmentType: "waterlow",
    mandatory: true,
    active: true,
    status: "active",
    category: "risk",
    includeInDonRiskAssessmentMetric: true,
    residentStatuses: ["active"],
    effectiveFrom: "2026-01-01",
    reviewFrequencyDays: 90,
    dueSoonWarningDays: 14,
    requirementVersion: 1,
    priority: "critical",
    criticalMissing: true,
    displayName: "Waterlow Pressure Risk Assessment",
  },
  {
    id: "assessment-requirement-falls-active-residents",
    assessmentType: "falls",
    mandatory: true,
    active: true,
    status: "active",
    category: "risk",
    includeInDonRiskAssessmentMetric: true,
    residentStatuses: ["active"],
    effectiveFrom: "2026-01-01",
    reviewFrequencyDays: 90,
    dueSoonWarningDays: 14,
    requirementVersion: 1,
    priority: "critical",
    criticalMissing: true,
    displayName: "Falls Risk Assessment",
  },
  {
    id: "assessment-requirement-mna-active-residents",
    assessmentType: "mna",
    mandatory: true,
    active: true,
    status: "active",
    category: "risk",
    includeInDonRiskAssessmentMetric: true,
    residentStatuses: ["active"],
    effectiveFrom: "2026-01-01",
    reviewFrequencyDays: 90,
    dueSoonWarningDays: 14,
    requirementVersion: 1,
    priority: "high",
    displayName: "MNA Nutrition Risk Assessment",
  },
  {
    id: "assessment-requirement-abbey-pain-active-residents",
    assessmentType: "abbey_pain",
    mandatory: true,
    active: true,
    status: "active",
    category: "risk",
    includeInDonRiskAssessmentMetric: true,
    residentStatuses: ["active"],
    effectiveFrom: "2026-01-01",
    reviewFrequencyDays: 90,
    dueSoonWarningDays: 14,
    requirementVersion: 1,
    priority: "high",
    displayName: "Abbey Pain Assessment",
  },
  {
    id: "assessment-requirement-mmse-active-residents",
    assessmentType: "mmse",
    mandatory: true,
    active: true,
    status: "active",
    category: "risk",
    includeInDonRiskAssessmentMetric: true,
    residentStatuses: ["active"],
    effectiveFrom: "2026-01-01",
    reviewFrequencyDays: 180,
    dueSoonWarningDays: 30,
    requirementVersion: 1,
    priority: "normal",
    displayName: "MMSE Cognitive Assessment",
  },
];
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
const daysAhead = (d: number) => new Date(Date.now() + d * 86400000).toISOString();
const phoneFor = (seed: number) =>
  `07${String(100000000 + ((seed * 2654435761) % 900000000)).padStart(9, "0")}`;

const REMOVED_DEMO_TASK_TITLES = new Set([
  "Reposition at scheduled times (10am, 12pm, 2pm, 4pm, 6pm, 8pm, 10pm, 12am)",
  "Daily skin inspection (pressure areas, buttocks, heels, sacrum)",
  "Record fluid and food intake daily",
  "Assist with all transfers using 2-person protocol",
  "Complete daily safety checks",
  "Family communication update",
]);

function removeRemovedDemoTasks(tasks: Task[] = []) {
  return tasks.filter((task) => !REMOVED_DEMO_TASK_TITLES.has(task.title));
}

function clearPersistedTrainingCoursesOnce(parsed: Partial<Store>) {
  const record = parsed as Partial<Store> & { trainingCourseCleanupVersion?: string };
  if (record.trainingCourseCleanupVersion === TRAINING_COURSE_CLEANUP_VERSION) return parsed;

  record.trainingCourses = [];
  record.trainingRequirements = [];
  record.staffTrainingAssignments = [];
  record.staffTrainingCompletions = [];
  record.trainingEvents = (record.trainingEvents || []).filter(
    (event) =>
      !event.trainingCourseId &&
      !event.trainingRequirementId &&
      !event.trainingAssignmentId &&
      !event.trainingCompletionId,
  );
  record.trainingCourseCleanupVersion = TRAINING_COURSE_CLEANUP_VERSION;
  return record;
}

const MAX_PERSISTED_RESIDENT_PHOTO_LENGTH = 180_000;

function sanitizePersistedResidentProfilePhotos(parsed: Partial<Store>) {
  parsed.residents = (parsed.residents || []).map((resident) => {
    if (!resident.photoUrl || resident.photoUrl.length <= MAX_PERSISTED_RESIDENT_PHOTO_LENGTH) return resident;
    return { ...resident, photoUrl: undefined };
  });

  if (parsed.residentProfileState?.audit) {
    parsed.residentProfileState = {
      ...parsed.residentProfileState,
      audit: parsed.residentProfileState.audit.map((entry) =>
        entry.fieldKey === "photoUrl"
          ? {
              ...entry,
              previousValue: entry.previousValue ? "[profile photo recorded]" : undefined,
              newValue: entry.newValue ? "[profile photo recorded]" : undefined,
            }
          : entry,
      ),
    };
  }

  return parsed;
}

function mergeDefaultRiskAssessmentRequirements(requirements?: AssessmentRequirementRecord[]) {
  const existing = requirements || [];
  const existingIds = new Set(existing.map((requirement) => requirement.id));
  return [
    ...existing,
    ...DEFAULT_RISK_ASSESSMENT_REQUIREMENTS.filter((requirement) => !existingIds.has(requirement.id)),
  ];
}

const PHYSIOLOGICAL_ALERT_TYPES = new Set<ClinicalAlert["type"]>([
  "weight_loss", "weight_gain", "high_news2", "abnormal_bp", "abnormal_temp",
  "low_spo2", "high_pain", "hypoglycaemia", "hyperglycaemia", "fluid_imbalance",
]);

function reconcileClinicalAlerts(
  existing: ClinicalAlert[],
  residentId: string,
  seeds: AlertSeed[],
  now: string,
  changedSourceVitalId?: string,
) {
  const next = [...existing];
  const activeForResident = next.filter(
    (alert) => alert.residentId === residentId && PHYSIOLOGICAL_ALERT_TYPES.has(alert.type) && !alert.dismissedAt && !alert.resolvedAt,
  );
  const alertRuleKey = (item: Pick<ClinicalAlert, "type" | "sourceVitalId">) => `${item.type}:${item.sourceVitalId || "latest"}`;
  const generatedKeys = new Set(seeds.map(alertRuleKey));

  for (const alert of activeForResident) {
    if (changedSourceVitalId && alert.sourceVitalId === changedSourceVitalId && !generatedKeys.has(alertRuleKey(alert))) {
      const index = next.findIndex((candidate) => candidate.id === alert.id);
      next[index] = { ...alert, resolvedAt: now, resolvedBy: "System", dismissedReason: "Entered In Error", updatedAt: now };
    }
  }

  for (const seed of seeds) {
    const active = activeForResident.find((alert) => alertRuleKey(alert) === alertRuleKey(seed));
    if (active) {
      const index = next.findIndex((candidate) => candidate.id === active.id);
      next[index] = { ...active, ...seed, updatedAt: now };
    } else {
      next.unshift({
        id: uid(), residentId, ...seed, createdAt: now, acknowledged: false, escalations: [],
      });
    }
  }
  return next;
}

function observationAsVital(observation: ClinicalObservation): VitalSign | undefined {
  if (!(["weight", "news2", "glucose", "pain", "fluid"] as ObservationKind[]).includes(observation.kind)) return undefined;
  const numberValue = (value: unknown) => value === undefined || value === "" ? undefined : Number(value);
  const data = observation.data;
  const intake = observation.kind === "fluid"
    ? [data.oralMl, data.pegMl, data.otherInMl].reduce<number>((sum, value) => sum + (numberValue(value) ?? 0), 0)
    : undefined;
  const output = observation.kind === "fluid"
    ? [data.urineMl, data.vomitMl, data.drainageMl, data.otherOutMl].reduce<number>((sum, value) => sum + (numberValue(value) ?? 0), 0)
    : undefined;
  return {
    id: observation.id,
    residentId: observation.residentId,
    date: observation.date,
    time: observation.time,
    recordedAt: observation.recordedAt,
    temperature: observation.kind === "news2" ? numberValue(data.temperature) : undefined,
    pulse: observation.kind === "news2" ? numberValue(data.pulse) : undefined,
    respiratoryRate: observation.kind === "news2" ? numberValue(data.respiratoryRate) : undefined,
    systolicBP: observation.kind === "news2" ? numberValue(data.systolicBP) : undefined,
    diastolicBP: observation.kind === "news2" ? numberValue(data.diastolicBP) : undefined,
    spo2: observation.kind === "news2" ? numberValue(data.spo2) : undefined,
    onOxygen: observation.kind === "news2" ? !!data.onOxygen : undefined,
    oxygenLpm: observation.kind === "news2" ? numberValue(data.oxygenLpm) : undefined,
    consciousness: observation.kind === "news2" ? data.consciousness : undefined,
    bloodGlucose: observation.kind === "glucose" ? numberValue(data.value) : undefined,
    weight: observation.kind === "weight" ? numberValue(data.weight) : undefined,
    height: observation.kind === "weight" ? numberValue(data.height) : undefined,
    painScore: observation.kind === "pain" ? numberValue(data.score) : undefined,
    fluidIntakeMl: intake,
    fluidOutputMl: output,
    recordedByUserId: observation.recordedByUserId,
    recordedByName: observation.recordedByName,
    recordedByRole: observation.recordedByRole,
    createdAt: observation.createdAt,
    deletedAt: observation.deletedAt,
    auditTrail: [],
  };
}

function alertVitalsForResident(
  vitals: VitalSign[],
  observations: ClinicalObservation[],
  residentId: string,
) {
  return [
    ...vitals.filter((vital) => vital.residentId === residentId),
    ...observations
      .filter((observation) => observation.residentId === residentId)
      .map(observationAsVital)
      .filter((vital): vital is VitalSign => !!vital),
  ];
}

function observationDataWithNEWS2(kind: ObservationKind, source: Record<string, any>) {
  const { news2Score: _score, news2Risk: _risk, news2Breakdown: _breakdown, ...data } = source;
  if (kind !== "news2") return data;
  const news2 = calcNEWS2(data);
  return news2.complete
    ? { ...data, news2Score: news2.total, news2Risk: news2.risk, news2Breakdown: news2.breakdown }
    : data;
}

function vitalWithCalculatedNEWS2(source: VitalSign): VitalSign {
  const { news2Score: _score, news2Risk: _risk, news2Breakdown: _breakdown, ...vital } = source;
  const news2 = calcNEWS2(vital);
  return news2.complete
    ? { ...vital, news2Score: news2.total, news2Risk: news2.risk, news2Breakdown: news2.breakdown }
    : vital;
}

function syncUidSequence(snapshot: unknown) {
  const text = JSON.stringify(snapshot);
  const matches = text.matchAll(/"id":"id-([0-9a-z]+)"/g);
  let maxSeq = 0;
  for (const match of matches) {
    const seq = parseInt(match[1], 36);
    if (!Number.isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }
  _uidSeq = Math.max(_uidSeq, maxSeq);
}

// ============ Wings / Units / Rooms ============
const WINGS_SEED: Wing[] = [
  { id: "w-oak", name: "Oak Wing", floor: "Ground", kind: "wing" },
  { id: "w-maple", name: "Maple Wing", floor: "Ground", kind: "wing" },
  { id: "w-ash", name: "Ash Wing", floor: "First", kind: "wing" },
  { id: "w-willow", name: "Willow Wing", floor: "First", kind: "wing" },
  { id: "w-memory", name: "Memory Care Unit", floor: "Ground", kind: "unit" },
  { id: "w-respite", name: "Respite Unit", floor: "First", kind: "unit" },
];
const UNITS_SEED: Unit[] = WINGS_SEED.map((w) => ({ id: `u-${w.id}`, wingId: w.id, name: w.name }));

function seedRooms(): Room[] {
  const rooms: Room[] = [];
  WINGS_SEED.forEach((w, wi) => {
    const start = wi * 10 + 1;
    for (let i = 0; i < 12; i++) {
      const num = String(start + i);
      rooms.push({ id: `r-${w.id}-${num}`, wingId: w.id, unitId: `u-${w.id}`, number: num });
    }
  });
  return rooms;
}

function seedMaintenanceWorkOrders(): MaintenanceWorkOrder[] {
  const now = "2026-07-21T08:30:00.000Z";
  return [
    {
      id: "maintenance-work-order-seed-1",
      workOrderNumber: "WO-2026-000001",
      title: "Nurse call bell intermittent in Room 3",
      description: "Call bell is working intermittently. Staff report delayed activation from the resident handset.",
      type: "REACTIVE",
      source: "STAFF_REPORT",
      category: "NURSE_CALL",
      priority: "CRITICAL",
      status: "OPEN",
      homeId: BALLYMORE_FACILITY_ID,
      nursingHomeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      wardId: "w-oak" as any,
      roomId: "r-w-oak-3" as any,
      reportedByUserId: "u-3",
      reportedAt: "2026-07-21T08:05:00.000Z",
      reporterNameSnapshot: "J. Roberts",
      dueAt: "2026-07-21T12:00:00.000Z",
      residentSafetyImpact: true,
      serviceDisruption: true,
      complianceImpact: false,
      immediateRisk: true,
      immediateControlSummary: "Hourly checks in place until maintenance review is completed.",
      verificationRequired: true,
      createdAt: "2026-07-21T08:05:00.000Z",
      createdByUserId: "u-3",
      updatedAt: now,
      updatedByUserId: "u-3",
      version: 1,
    },
    {
      id: "maintenance-work-order-seed-2",
      workOrderNumber: "WO-2026-000002",
      title: "Leak under sluice sink",
      description: "Small leak noted beneath the sluice sink. Area remains usable but requires prompt repair.",
      type: "CORRECTIVE",
      source: "MAINTENANCE_TEAM",
      category: "PLUMBING",
      priority: "HIGH",
      status: "IN_PROGRESS",
      homeId: BALLYMORE_FACILITY_ID,
      nursingHomeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      wardId: "w-maple" as any,
      exactLocation: "Maple Wing sluice room",
      reportedByUserId: "u-7",
      reportedAt: "2026-07-20T14:20:00.000Z",
      reporterNameSnapshot: "L. Mensah",
      assignedUserId: "u-7",
      assignedAt: "2026-07-20T15:00:00.000Z",
      assignedByUserId: "u-7",
      dueAt: "2026-07-21T16:00:00.000Z",
      residentSafetyImpact: false,
      serviceDisruption: true,
      complianceImpact: false,
      immediateRisk: false,
      verificationRequired: false,
      createdAt: "2026-07-20T14:20:00.000Z",
      createdByUserId: "u-7",
      updatedAt: now,
      updatedByUserId: "u-7",
      version: 1,
    },
    {
      id: "maintenance-work-order-seed-3",
      workOrderNumber: "WO-2026-000003",
      title: "Medication room light flickering",
      description: "Ceiling light flickers above the medication preparation counter.",
      type: "REACTIVE",
      source: "STAFF_REPORT",
      category: "INTERNAL_LIGHTING",
      priority: "MEDIUM",
      status: "ON_HOLD",
      homeId: BALLYMORE_FACILITY_ID,
      nursingHomeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      exactLocation: "Medication room",
      reportedByUserId: "u-3",
      reportedAt: "2026-07-19T09:15:00.000Z",
      reporterNameSnapshot: "J. Roberts",
      dueAt: "2026-07-20T17:00:00.000Z",
      residentSafetyImpact: false,
      serviceDisruption: false,
      complianceImpact: true,
      immediateRisk: false,
      verificationRequired: false,
      createdAt: "2026-07-19T09:15:00.000Z",
      createdByUserId: "u-3",
      updatedAt: now,
      updatedByUserId: "u-7",
      version: 1,
    },
    {
      id: "maintenance-work-order-seed-4",
      workOrderNumber: "WO-2026-000004",
      title: "Housekeeping support for spill in dining room",
      description: "Dining room floor requires cleaning support after fluid spill.",
      type: "HOUSEKEEPING_REQUEST",
      source: "HOUSEKEEPING",
      category: "CLEANING_HOUSEKEEPING_SUPPORT",
      priority: "LOW",
      status: "COMPLETED",
      homeId: BALLYMORE_FACILITY_ID,
      nursingHomeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      exactLocation: "Main dining room",
      reportedByUserId: "u-1",
      reportedAt: "2026-07-20T12:10:00.000Z",
      reporterNameSnapshot: "C. Adeyemi",
      completedAt: "2026-07-20T12:45:00.000Z",
      completedByUserId: "u-1",
      residentSafetyImpact: false,
      serviceDisruption: false,
      complianceImpact: false,
      immediateRisk: false,
      verificationRequired: false,
      createdAt: "2026-07-20T12:10:00.000Z",
      createdByUserId: "u-1",
      updatedAt: "2026-07-20T12:45:00.000Z",
      updatedByUserId: "u-1",
      version: 1,
    },
  ];
}

function seedMaintenanceAssetCategories(): MaintenanceAssetCategory[] {
  return DEFAULT_ASSET_CATEGORIES.map(([name, description, colour, icon], index) => ({
    id: `maintenance-asset-category-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    tenantId: "tenant-oritas-demo",
    name,
    description,
    colour,
    icon,
    active: true,
    displayOrder: index + 1,
    createdBy: "System",
    createdAt: "2026-07-21T08:30:00.000Z",
  }));
}

function seedMaintenanceAssets(): MaintenanceAsset[] {
  const now = "2026-07-21T08:30:00.000Z";
  return [
    {
      id: `facility:${BALLYMORE_FACILITY_ID}`,
      tenantId: "tenant-oritas-demo",
      homeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      nursingHomeId: BALLYMORE_FACILITY_ID,
      assetNumber: "AST-00001",
      assetName: "Main Fire Alarm Panel",
      description: "Addressable fire alarm panel covering Ballymore Haven common areas.",
      categoryId: "maintenance-asset-category-fire-safety",
      manufacturer: "Advanced",
      model: "MxPro 5",
      serialNumber: "FA-2021-001",
      barcode: "BH-FA-001",
      locationId: `facility:${BALLYMORE_FACILITY_ID}`,
      locationLabel: "Ballymore Haven - Reception",
      purchaseDate: "2021-04-12",
      installationDate: "2021-05-03",
      supplier: "SafeFire Ireland",
      warrantyStartDate: "2021-05-03",
      warrantyEndDate: "2026-09-30",
      condition: "Good",
      operationalStatus: "Operational",
      assetStatus: "Active",
      criticality: "Critical",
      replacementDate: "2031-05-03",
      replacementCost: 12500,
      notes: "Linked to weekly alarm testing schedule.",
      active: true,
      createdBy: "System",
      createdAt: now,
      updatedBy: "System",
      updatedAt: now,
    },
    {
      id: "room:r-w-oak-3",
      tenantId: "tenant-oritas-demo",
      homeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      nursingHomeId: BALLYMORE_FACILITY_ID,
      assetNumber: "AST-00002",
      assetName: "Room 3 Nurse Call Point",
      description: "Wall mounted resident nurse call point.",
      categoryId: "maintenance-asset-category-emergency-equipment",
      manufacturer: "Courtney Thorne",
      model: "CT Touch",
      serialNumber: "NC-03-2024",
      barcode: "BH-NC-003",
      locationId: "r-w-oak-3",
      locationLabel: "Oak Wing - Room 3",
      purchaseDate: "2024-01-10",
      installationDate: "2024-01-18",
      supplier: "Clinical Comms Ltd",
      warrantyStartDate: "2024-01-18",
      warrantyEndDate: "2027-01-18",
      condition: "Fair",
      operationalStatus: "Under Maintenance",
      assetStatus: "Active",
      criticality: "Critical",
      replacementDate: "2029-01-18",
      replacementCost: 950,
      notes: "Intermittent fault currently under Work Order review.",
      active: true,
      createdBy: "System",
      createdAt: now,
      updatedBy: "System",
      updatedAt: now,
    },
    {
      id: "asset-water-outlets-ballymore",
      tenantId: "tenant-oritas-demo",
      homeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      nursingHomeId: BALLYMORE_FACILITY_ID,
      assetNumber: "AST-00003",
      assetName: "Ballymore Water Outlet Set",
      description: "Grouped domestic hot and cold water outlets for planned temperature monitoring.",
      categoryId: "maintenance-asset-category-water",
      manufacturer: "Mixed",
      model: "Domestic outlets",
      locationId: `facility:${BALLYMORE_FACILITY_ID}`,
      locationLabel: "Ballymore Haven",
      purchaseDate: "2019-06-01",
      installationDate: "2019-06-15",
      warrantyEndDate: "2024-06-15",
      condition: "Good",
      operationalStatus: "Operational",
      assetStatus: "Active",
      criticality: "High",
      replacementDate: "2029-06-15",
      replacementCost: 8000,
      active: true,
      createdBy: "System",
      createdAt: now,
      updatedBy: "System",
      updatedAt: now,
    },
    {
      id: "asset-kitchen-dishwasher-1",
      tenantId: "tenant-oritas-demo",
      homeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      nursingHomeId: BALLYMORE_FACILITY_ID,
      assetNumber: "AST-00004",
      assetName: "Main Kitchen Dishwasher",
      description: "Commercial dishwasher in main kitchen.",
      categoryId: "maintenance-asset-category-kitchen-equipment",
      manufacturer: "Winterhalter",
      model: "PT-M",
      serialNumber: "DW-99201",
      barcode: "BH-KIT-DW1",
      locationId: "kitchen-main",
      locationLabel: "Ground Floor - Main Kitchen",
      purchaseDate: "2022-03-01",
      installationDate: "2022-03-08",
      supplier: "Catering Equipment Ireland",
      warrantyStartDate: "2022-03-08",
      warrantyEndDate: "2027-03-08",
      condition: "Excellent",
      operationalStatus: "Operational",
      assetStatus: "Active",
      criticality: "High",
      replacementDate: "2030-03-08",
      replacementCost: 6200,
      active: true,
      createdBy: "System",
      createdAt: now,
      updatedBy: "System",
      updatedAt: now,
    },
  ];
}

function seedSafetyComplianceData() {
  const now = "2026-07-21T08:30:00.000Z";
  const categories: SafetyCategory[] = DEFAULT_SAFETY_CATEGORIES.map((category) => ({
    ...category,
    createdBy: "System",
    createdAt: now,
    updatedBy: "System",
    updatedAt: now,
  }));
  const categoryId = (code: SafetyCategoryCode) => categories.find((category) => category.code === code)!.id;
  const templates: SafetyInspectionTemplate[] = [
    safetyTemplate("safety-template-fire-alarm-weekly", categoryId("FIRE_SAFETY"), "Weekly Fire Alarm Test", "Weekly fire alarm panel and call point test.", "FS-WEEKLY-ALARM", "weekly", 1, "HIGH", true, true, true, "Test one rotating manual call point, confirm panel response and record evidence."),
    safetyTemplate("safety-template-water-temp-monthly", categoryId("WATER_SAFETY"), "Monthly Water Temperature Check", "Water outlet temperature and flushing record.", "WS-MONTHLY-TEMP", "monthly", 1, "HIGH", true, true, true, "Record configured hot and cold outlet readings and identify out-of-range results."),
    safetyTemplate("safety-template-pat-annual", categoryId("ELECTRICAL"), "PAT Testing", "Portable appliance visual and test record.", "EL-PAT", "annual", 1, "MEDIUM", true, true, true, "Check label, casing, cable and certificate evidence."),
    safetyTemplate("safety-template-nurse-call-weekly", categoryId("NURSE_CALL"), "Nurse Call Point Test", "Functional nurse call point safety check.", "NC-WEEKLY", "weekly", 1, "HIGH", false, false, true, "Test call activation, indicator and cancellation."),
  ];
  const items: SafetyInspectionTemplateItem[] = [
    safetyItem(templates[0].id, "General Condition", "PANEL_ACCESSIBLE", "Alarm panel accessible", "PASS_FAIL", 1, true, true, true, "HIGH"),
    safetyItem(templates[0].id, "Function Test", "CALL_POINT_TESTED", "Manual call point activated correctly", "PASS_FAIL", 2, true, true, true, "CRITICAL"),
    safetyItem(templates[0].id, "Function Test", "SOUNDERS_AUDIBLE", "Sounders audible in required areas", "PASS_FAIL", 3, true, true, true, "CRITICAL"),
    safetyItem(templates[0].id, "Evidence", "INSPECTOR_SIGNATURE", "Inspector declaration signed", "SIGNATURE_CONFIRMATION", 4, true, false, false, "LOW"),
    safetyItem(templates[1].id, "Readings", "HOT_WATER_READING", "Hot water temperature recorded", "TEMPERATURE", 1, true, true, false, "HIGH", 45, 65, "C"),
    safetyItem(templates[1].id, "Readings", "COLD_WATER_READING", "Cold water temperature recorded", "TEMPERATURE", 2, true, true, false, "HIGH", 0, 20, "C"),
    safetyItem(templates[1].id, "Safety Controls", "OUTLET_FLUSHED", "Outlet flushed where required", "YES_NO_NA", 3, true, true, false, "MEDIUM"),
    safetyItem(templates[2].id, "Electrical Condition", "CABLE_INTACT", "Cable and plug intact", "PASS_FAIL", 1, true, true, true, "HIGH"),
    safetyItem(templates[2].id, "Evidence", "PAT_CERT_ATTACHED", "PAT certificate attached", "CERTIFICATE_CONFIRMATION", 2, true, false, false, "MEDIUM"),
    safetyItem(templates[3].id, "Function Test", "CALL_ACTIVATES", "Call activates at nurses station", "PASS_FAIL", 1, true, true, true, "HIGH"),
    safetyItem(templates[3].id, "Function Test", "CALL_CANCELS", "Call cancels correctly", "PASS_FAIL", 2, true, true, false, "MEDIUM"),
  ];
  const evidenceRequirements: SafetyInspectionTemplateEvidenceRequirement[] = [
    safetyEvidenceRequirement(templates[0].id, "PHOTO", "Panel/test point photo", true, 1, true, true, 1),
    safetyEvidenceRequirement(templates[0].id, "SIGNATURE", "Inspector signature", true, 1, true, true, 2),
    safetyEvidenceRequirement(templates[1].id, "READING", "Temperature readings", true, 2, true, true, 1),
    safetyEvidenceRequirement(templates[1].id, "CERTIFICATE", "Water safety certificate", false, 1, true, true, 2),
    safetyEvidenceRequirement(templates[2].id, "CERTIFICATE", "PAT certificate", true, 1, true, true, 1),
    safetyEvidenceRequirement(templates[3].id, "PHOTO", "Call point evidence", false, 1, true, true, 1),
  ];
  const schedules: SafetyInspectionSchedule[] = [
    safetySchedule("safety-schedule-fire-panel", categoryId("FIRE_SAFETY"), templates[0].id, "Main Fire Alarm Panel - Weekly Test", "facility:ballymore", undefined, "Ballymore Haven - Reception", "2026-07-15", "2026-07-22", "HIGH", true),
    safetySchedule("safety-schedule-water", categoryId("WATER_SAFETY"), templates[1].id, "Monthly Water Temperature Checks", "asset-water-outlets-ballymore", undefined, "Ballymore Haven", "2026-07-01", "2026-07-21", "HIGH", true),
    safetySchedule("safety-schedule-nurse-call-room3", categoryId("NURSE_CALL"), templates[3].id, "Room 3 Nurse Call Weekly Test", "room:r-w-oak-3", "r-w-oak-3", "Oak Wing - Room 3", "2026-07-15", "2026-07-24", "HIGH", false),
  ];
  const occurrences: SafetyInspectionOccurrence[] = [
    safetyOccurrence("safety-occurrence-fire-panel", schedules[0], templates[0], "2026-07-22", "DUE_TODAY"),
    safetyOccurrence("safety-occurrence-water-overdue", schedules[1], templates[1], "2026-07-21", "OVERDUE"),
    safetyOccurrence("safety-occurrence-nurse-call", schedules[2], templates[3], "2026-07-24", "DUE_SOON"),
  ];
  const inspections: SafetyInspection[] = [
    safetyInspection("safety-inspection-fire-completed", categoryId("FIRE_SAFETY"), templates[0].id, undefined, "facility:ballymore", "SC-2026-0001", "COMPLETED", "PASS", "VERIFIED", "2026-07-15", "u-7", false, true),
    safetyInspection("safety-inspection-water-failed", categoryId("WATER_SAFETY"), templates[1].id, occurrences[1].id, "asset-water-outlets-ballymore", "SC-2026-0002", "FAILED", "FAIL", "PENDING", "2026-07-21", "u-7", true, true),
  ];
  occurrences[1].inspectionId = inspections[1].id;
  occurrences[1].completedAt = inspections[1].completedAt;
  const responses: SafetyInspectionResponse[] = [
    safetyResponse(inspections[0].id, items[0], "PASS", "Pass", "u-7", "2026-07-15T09:12:00.000Z"),
    safetyResponse(inspections[0].id, items[1], "PASS", "Pass", "u-7", "2026-07-15T09:14:00.000Z"),
    safetyResponse(inspections[0].id, items[2], "PASS", "Pass", "u-7", "2026-07-15T09:16:00.000Z"),
    safetyResponse(inspections[0].id, items[3], "PASS", "Confirmed", "u-7", "2026-07-15T09:18:00.000Z"),
    safetyResponse(inspections[1].id, items[4], "PASS", "52", "u-7", "2026-07-21T10:05:00.000Z"),
    safetyResponse(inspections[1].id, items[5], "FAIL", "24", "u-7", "2026-07-21T10:08:00.000Z", "Cold water reading above configured range."),
    safetyResponse(inspections[1].id, items[6], "PASS", "Yes", "u-7", "2026-07-21T10:10:00.000Z"),
  ];
  const observations: SafetyInspectionObservation[] = [
    {
      id: "safety-observation-water-1",
      inspectionId: inspections[1].id,
      responseId: responses[5].id,
      observationType: "READING_OUT_OF_RANGE",
      description: "Cold water sentinel outlet reading recorded at 24C. Outlet flushed and maintenance review required.",
      severity: "HIGH",
      assetId: "asset-water-outlets-ballymore",
      immediateActionRequired: true,
      immediateActionTaken: "Outlet flushed and marked for maintenance review.",
      correctiveActionRequired: true,
      correctiveWorkOrderId: "maintenance-work-order-seed-3",
      createdBy: "L. Hartley",
      createdAt: "2026-07-21T10:12:00.000Z",
    },
  ];
  const inspectionEvidence: SafetyInspectionEvidence[] = [
    { id: "safety-evidence-fire-photo", inspectionId: inspections[0].id, evidenceType: "PHOTO", fileReference: "safety/fire-panel-test.jpg", fileName: "fire-panel-test.jpg", caption: "Panel normal after weekly test", uploadedBy: "L. Hartley", uploadedAt: "2026-07-15T09:20:00.000Z", active: true },
    { id: "safety-evidence-water-reading", inspectionId: inspections[1].id, responseId: responses[5].id, evidenceType: "READING", fileReference: "safety/water-reading-2026-07-21", fileName: "water-reading-2026-07-21.txt", caption: "Cold water reading 24C", uploadedBy: "L. Hartley", uploadedAt: "2026-07-21T10:12:00.000Z", active: true },
  ];
  const certificates: SafetyCertificate[] = [
    {
      id: "safety-certificate-fire-2026",
      tenantId: "tenant-oritas-demo",
      homeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      categoryId: categoryId("FIRE_SAFETY"),
      inspectionId: inspections[0].id,
      assetId: "facility:ballymore",
      certificateType: "Fire Alarm Test Certificate",
      certificateNumber: "FIRE-2026-0715",
      issuedBy: "SafeFire Ireland",
      issuedDate: "2026-07-15",
      validFrom: "2026-07-15",
      expiryDate: "2026-10-15",
      status: "VALID",
      fileReference: "safety/certificates/fire-2026-0715.pdf",
      createdBy: "L. Hartley",
      createdAt: "2026-07-15T09:25:00.000Z",
    },
  ];
  const verifications: SafetyInspectionVerification[] = [
    { id: "safety-verification-fire-1", inspectionId: inspections[0].id, verificationStatus: "VERIFIED", verificationOutcome: "VERIFIED", verifiedBy: "A. Murphy", verifiedAt: "2026-07-15T11:00:00.000Z", verificationNotes: "Evidence and checklist reviewed.", createdAt: "2026-07-15T10:45:00.000Z", updatedAt: "2026-07-15T11:00:00.000Z", version: 1 },
    { id: "safety-verification-water-1", inspectionId: inspections[1].id, verificationStatus: "PENDING", assignedVerificationTeamId: "maintenance", verificationNotes: "Review corrective work order and reinspection plan.", createdAt: "2026-07-21T10:20:00.000Z", updatedAt: "2026-07-21T10:20:00.000Z", version: 1 },
  ];
  return { categories, templates, items, evidenceRequirements, schedules, occurrences, inspections, responses, observations, inspectionEvidence, certificates, verifications };
}

function safetyTemplate(id: string, categoryId: string, name: string, description: string, code: string, frequencyType: PlannedMaintenanceFrequencyType, frequencyInterval: number, priority: MaintenanceWorkOrder["priority"], verificationRequired: boolean, certificateRequired: boolean, evidenceRequired: boolean, instructions: string): SafetyInspectionTemplate {
  return { id, tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, categoryId, name, description, templateCode: code, version: 1, status: "ACTIVE", active: true, defaultFrequencyType: frequencyType, defaultFrequencyInterval: frequencyInterval, estimatedDurationMinutes: 30, defaultPriority: priority, verificationRequired, certificateRequired, evidenceRequired, instructions, safetyPrecautions: "Use local safety procedures and isolate equipment where required.", effectiveFrom: "2026-07-01", createdBy: "System", createdAt: "2026-07-21T08:30:00.000Z", updatedBy: "System", updatedAt: "2026-07-21T08:30:00.000Z" };
}

function safetyItem(templateId: string, sectionName: string, itemCode: string, label: string, responseType: SafetyChecklistResponseType, displayOrder: number, mandatory: boolean, corrective: boolean, evidence: boolean, severity: SafetySeverity, minValue?: number, maxValue?: number, unit?: string): SafetyInspectionTemplateItem {
  return { id: `safety-item-${templateId}-${itemCode.toLowerCase()}`, templateId, sectionName, itemCode, label, responseType, mandatory, allowNotApplicable: responseType.includes("_NA"), failureTriggersCorrectiveAction: corrective, failureRequiresObservation: corrective, failureRequiresPhoto: evidence && responseType !== "CERTIFICATE_CONFIRMATION", failureRequiresEvidence: evidence, failureSeverity: severity, minValue, maxValue, unit, displayOrder, active: true, createdAt: "2026-07-21T08:30:00.000Z", updatedAt: "2026-07-21T08:30:00.000Z" };
}

function safetyEvidenceRequirement(templateId: string, evidenceType: SafetyEvidenceType, label: string, mandatory: boolean, minimumCount: number, appliesOnPass: boolean, appliesOnFail: boolean, displayOrder: number): SafetyInspectionTemplateEvidenceRequirement {
  return { id: `safety-evidence-req-${templateId}-${displayOrder}`, templateId, evidenceType, label, mandatory, minimumCount, appliesOnPass, appliesOnFail, displayOrder };
}

function safetySchedule(id: string, categoryId: string, templateId: string, scheduleName: string, assetId: string | undefined, locationId: string | undefined, locationLabel: string, startDate: string, nextDueDate: string, priority: MaintenanceWorkOrder["priority"], verification: boolean): SafetyInspectionSchedule {
  return { id, tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, categoryId, templateId, assetId, locationId, locationLabel, scheduleName, frequencyType: "weekly", frequencyInterval: 1, startDate, nextDueDate, generateDaysBeforeDue: 7, dueSoonDays: 7, responsibleTeamId: "maintenance", verificationTeamId: verification ? "maintenance-leads" : undefined, active: true, paused: false, priority, autoCreateInspection: true, autoCreateCorrectiveWorkOrder: true, createdBy: "System", createdAt: "2026-07-21T08:30:00.000Z" };
}

function safetyOccurrence(id: string, schedule: SafetyInspectionSchedule, template: SafetyInspectionTemplate, dueDate: string, status: SafetyInspectionOccurrence["status"]): SafetyInspectionOccurrence {
  return { id, tenantId: "tenant-oritas-demo", homeId: schedule.homeId, facilityId: schedule.homeId, scheduleId: schedule.id, categoryId: schedule.categoryId, templateId: template.id, templateVersion: template.version, assetId: schedule.assetId, locationId: schedule.locationId, plannedDate: dueDate, dueDate, status, priority: schedule.priority, assignedTeamId: schedule.responsibleTeamId, assignedUserId: schedule.responsibleUserId, generatedAt: "2026-07-21T08:30:00.000Z", createdAt: "2026-07-21T08:30:00.000Z", updatedAt: "2026-07-21T08:30:00.000Z" };
}

function safetyInspection(id: string, categoryId: string, templateId: string, occurrenceId: string | undefined, assetId: string | undefined, number: string, status: SafetyInspection["status"], result: SafetyInspection["overallResult"], verificationStatus: SafetyInspection["verificationStatus"], date: string, user: string, corrective: boolean, certificateRequired: boolean): SafetyInspection {
  return { id, tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, occurrenceId, scheduleId: occurrenceId ? "safety-schedule-water" : undefined, templateId, templateVersion: 1, categoryId, assetId, inspectionNumber: number, inspectionType: occurrenceId ? "SCHEDULED" : "AD_HOC", status, overallResult: result, priority: "HIGH", startedBy: user, startedAt: `${date}T10:00:00.000Z`, completedBy: user, completedAt: `${date}T10:20:00.000Z`, inspectionDate: date, observations: corrective ? "Corrective action required." : "Inspection completed.", summary: result === "FAIL" ? "One or more safety items failed." : "No defects identified.", riskIdentified: result === "FAIL", riskLevel: result === "FAIL" ? "HIGH" : undefined, correctiveActionRequired: corrective, correctiveWorkOrderId: corrective ? "maintenance-work-order-seed-3" : undefined, certificateRequired, verificationRequired: verificationStatus !== "NOT_REQUIRED", verificationStatus, verifiedBy: verificationStatus === "VERIFIED" ? "A. Murphy" : undefined, verifiedAt: verificationStatus === "VERIFIED" ? `${date}T11:00:00.000Z` : undefined, declarationAccepted: true, declarationBy: user, declarationAt: `${date}T10:20:00.000Z`, createdAt: `${date}T10:00:00.000Z`, updatedAt: `${date}T10:20:00.000Z`, version: 1 };
}

function safetyResponse(inspectionId: string, item: SafetyInspectionTemplateItem, result: SafetyInspectionResponse["result"], value: string, user: string, at: string, observation?: string): SafetyInspectionResponse {
  return { id: `safety-response-${inspectionId}-${item.itemCode}`, inspectionId, templateItemId: item.id, templateItemCode: item.itemCode, sectionName: item.sectionName, questionLabelSnapshot: item.label, responseType: item.responseType, responseValue: value, result, observation, mandatory: item.mandatory, failureSeverity: item.failureSeverity, correctiveActionRequired: item.failureTriggersCorrectiveAction, evidenceRequired: item.failureRequiresEvidence || item.failureRequiresPhoto, answeredBy: user, answeredAt: at, displayOrder: item.displayOrder };
}

function seedMaintenanceCertificateData() {
  const now = "2026-07-21T08:30:00.000Z";
  const types: MaintenanceCertificateType[] = [
    certificateType("maintenance-cert-type-fire-alarm", "FIRE_ALARM", "Fire Alarm Test Certificate", "SAFETY", 3, true, true, true, true, 30, 7, ["HOME", "LOCATION", "SAFETY_INSPECTION"]),
    certificateType("maintenance-cert-type-pat", "PAT_TESTING", "PAT Testing Certificate", "ASSET_COMPLIANCE", 12, true, true, true, true, 60, 14, ["ASSET", "SAFETY_INSPECTION"]),
    certificateType("maintenance-cert-type-gas", "GAS_SAFETY", "Gas Safety Certificate", "LEGAL", 12, true, true, true, true, 90, 30, ["ASSET", "HOME", "SAFETY_INSPECTION"]),
    certificateType("maintenance-cert-type-boiler", "BOILER_SERVICE", "Boiler Service Certificate", "SERVICE", 12, true, true, true, true, 90, 30, ["ASSET", "WORK_ORDER"]),
    certificateType("maintenance-cert-type-calibration", "CALIBRATION", "Calibration Certificate", "CALIBRATION", 12, true, true, true, true, 90, 30, ["ASSET"]),
    certificateType("maintenance-cert-type-warranty", "WARRANTY", "Warranty Certificate", "WARRANTY", undefined, false, false, false, false, 90, 30, ["ASSET"]),
    certificateType("maintenance-cert-type-contractor-insurance", "CONTRACTOR_INSURANCE", "Contractor Insurance Certificate", "INSURANCE", 12, true, true, true, true, 60, 14, ["CONTRACTOR"]),
  ];
  const certificates: MaintenanceCertificate[] = [
    certificateRecord("maintenance-cert-fire-2026", types[0], "FIRE-2026-0715", "Fire Alarm Test Certificate - Ballymore Haven", "SafeFire Ireland", "HOME", BALLYMORE_FACILITY_ID, "maintenance-cert-version-fire-1", "VALID"),
    certificateRecord("maintenance-cert-pat-2026", types[1], "PAT-2026-0042", "PAT Testing Certificate - Portable Equipment", "ElectroSafe Ltd", "ASSET", "maintenance-asset-001", "maintenance-cert-version-pat-1", "EXPIRING_SOON"),
    certificateRecord("maintenance-cert-gas-2025", types[2], "GAS-2025-0118", "Gas Safety Certificate - Main Boiler", "HeatCare Services", "ASSET", "maintenance-asset-002", "maintenance-cert-version-gas-1", "EXPIRED"),
    certificateRecord("maintenance-cert-boiler-2026", types[3], "BOILER-2026-0007", "Boiler Service Certificate - Main Plant", "HeatCare Services", "ASSET", "maintenance-asset-002", "maintenance-cert-version-boiler-1", "VALID"),
  ];
  const versions: MaintenanceCertificateVersion[] = [
    certificateVersion("maintenance-cert-version-fire-1", certificates[0], 1, "2026-07-15", "2026-07-15", "2026-10-15", "ACTIVE", true),
    certificateVersion("maintenance-cert-version-pat-1", certificates[1], 1, "2026-01-31", "2026-01-31", "2026-08-15", "EXPIRING_SOON", true),
    certificateVersion("maintenance-cert-version-gas-1", certificates[2], 1, "2025-06-15", "2025-06-15", "2026-06-15", "EXPIRED", true),
    certificateVersion("maintenance-cert-version-boiler-0", certificates[3], 1, "2025-07-10", "2025-07-10", "2026-07-10", "SUPERSEDED", false),
    certificateVersion("maintenance-cert-version-boiler-1", certificates[3], 2, "2026-07-18", "2026-07-18", "2027-07-18", "ACTIVE", true, "maintenance-cert-version-boiler-0", "Annual renewal after planned service."),
  ];
  versions[3].supersededByVersionId = versions[4].id;
  const attachments: MaintenanceCertificateAttachment[] = [
    certificateAttachment("maintenance-cert-attachment-fire-1", certificates[0], versions[0], "fire-alarm-test-2026.pdf", "CERTIFICATE_FILE", true),
    certificateAttachment("maintenance-cert-attachment-pat-1", certificates[1], versions[1], "pat-testing-2026.pdf", "CERTIFICATE_FILE", true),
    certificateAttachment("maintenance-cert-attachment-gas-1", certificates[2], versions[2], "gas-safety-2025.pdf", "CERTIFICATE_FILE", true),
    certificateAttachment("maintenance-cert-attachment-boiler-1", certificates[3], versions[4], "boiler-service-2026.pdf", "CERTIFICATE_FILE", true),
  ];
  const assetLinks: MaintenanceCertificateAssetLink[] = [
    certificateAssetLink("maintenance-cert-asset-link-pat", certificates[1], versions[1], "maintenance-asset-001", "CERTIFIES", true),
    certificateAssetLink("maintenance-cert-asset-link-gas", certificates[2], versions[2], "maintenance-asset-002", "CERTIFIES", true),
    certificateAssetLink("maintenance-cert-asset-link-boiler", certificates[3], versions[4], "maintenance-asset-002", "SERVICES", true),
  ];
  const workOrderLinks: MaintenanceCertificateWorkOrderLink[] = [
    { id: "maintenance-cert-work-order-link-boiler", tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, certificateId: certificates[3].id, certificateVersionId: versions[4].id, workOrderId: "maintenance-work-order-seed-1", relationshipType: "ISSUED_FROM", linkedBy: "L. Hartley", linkedAt: "2026-07-18T13:20:00.000Z" },
  ];
  const safetyInspectionLinks: MaintenanceCertificateSafetyInspectionLink[] = [
    { id: "maintenance-cert-safety-link-fire", tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, certificateId: certificates[0].id, certificateVersionId: versions[0].id, safetyInspectionId: "safety-inspection-fire-completed", relationshipType: "ISSUED_FROM", linkedBy: "L. Hartley", linkedAt: "2026-07-15T09:25:00.000Z" },
  ];
  const contractorLinks: MaintenanceCertificateContractorLink[] = [];
  const requirements: MaintenanceCertificateRequirement[] = [
    certificateRequirement("maintenance-cert-req-fire", types[0], "Current fire alarm certificate required", "HOME", BALLYMORE_FACILITY_ID, undefined, 30),
    certificateRequirement("maintenance-cert-req-pat", types[1], "PAT certificate required for portable electrical assets", "ASSET", undefined, "maintenance-asset-category-electrical", 60),
    certificateRequirement("maintenance-cert-req-gas", types[2], "Gas safety certificate required for gas plant", "ASSET", "maintenance-asset-002", undefined, 90),
    certificateRequirement("maintenance-cert-req-calibration", types[4], "Calibration certificate required for clinical test equipment", "ASSET", undefined, "maintenance-asset-category-medical-equipment", 90),
  ];
  const timelineEvents: MaintenanceCertificateTimelineEvent[] = [
    timelineEvent("maintenance-cert-event-boiler-renewed", certificates[3], versions[4], "CERTIFICATE_RENEWED", "Boiler certificate renewed", "Previous version superseded and new version activated.", "2026-07-18T13:20:00.000Z"),
    timelineEvent("maintenance-cert-event-pat-warning", certificates[1], versions[1], "CERTIFICATE_EXPIRING_SOON", "PAT certificate is due soon", "Expiry falls within the warning window.", now),
  ];
  return { types, certificates, versions, attachments, assetLinks, workOrderLinks, safetyInspectionLinks, contractorLinks, requirements, timelineEvents };
}

function certificateType(id: string, code: string, name: string, category: MaintenanceCertificateTypeCategory, defaultValidityMonths: number | undefined, expiryRequired: boolean, numberRequired: boolean, issuerRequired: boolean, attachmentRequired: boolean, warningDays: number, criticalWarningDays: number, subjects: MaintenanceCertificateSubjectType[]): MaintenanceCertificateType {
  return { id, tenantId: "tenant-oritas-demo", code, name, description: `${name} used by Maintenance compliance workflows.`, category, defaultValidityMonths, expiryRequired, certificateNumberRequired: numberRequired, issuingOrganisationRequired: issuerRequired, attachmentRequired, renewalAllowed: true, warningDays, criticalWarningDays, applicableSubjectTypes: subjects, complianceCritical: ["SAFETY", "LEGAL", "ASSET_COMPLIANCE", "CALIBRATION"].includes(category), active: true, systemType: true, displayOrder: 1, createdBy: "System", createdAt: "2026-07-21T08:30:00.000Z", updatedBy: "System", updatedAt: "2026-07-21T08:30:00.000Z" };
}

function certificateRecord(id: string, type: MaintenanceCertificateType, number: string, title: string, issuer: string, subjectType: MaintenanceCertificateSubjectType, subjectId: string, currentVersionId: string, complianceStatus: MaintenanceCertificate["complianceStatus"]): MaintenanceCertificate {
  return { id, tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, certificateTypeId: type.id, certificateNumber: number, title, description: type.description, issuingOrganisation: issuer, subjectType, primarySubjectId: subjectId, currentVersionId, lifecycleStatus: "ACTIVE", complianceStatus, active: true, archived: false, createdBy: "L. Hartley", createdAt: "2026-07-21T08:30:00.000Z", updatedBy: "L. Hartley", updatedAt: "2026-07-21T08:30:00.000Z", version: 1 };
}

function certificateVersion(id: string, certificate: MaintenanceCertificate, versionNumber: number, issuedDate: string, validFromDate: string, expiryDate: string | undefined, status: MaintenanceCertificateVersion["status"], isCurrent: boolean, supersedesVersionId?: string, renewalReason?: string): MaintenanceCertificateVersion {
  return { id, tenantId: certificate.tenantId, homeId: certificate.homeId, facilityId: certificate.facilityId, certificateId: certificate.id, versionNumber, certificateNumberSnapshot: certificate.certificateNumber, issuedDate, validFromDate, expiryDate, issuingOrganisation: certificate.issuingOrganisation, issuingOrganisationContact: certificate.issuingOrganisationContact, status, supersedesVersionId, renewalReason, notes: renewalReason, isCurrent, recordedBy: "L. Hartley", recordedAt: `${issuedDate}T12:00:00.000Z`, updatedBy: "L. Hartley", updatedAt: `${issuedDate}T12:00:00.000Z`, version: 1 };
}

function certificateAttachment(id: string, certificate: MaintenanceCertificate, version: MaintenanceCertificateVersion, fileName: string, documentType: MaintenanceCertificateAttachmentType, primary: boolean): MaintenanceCertificateAttachment {
  return { id, tenantId: certificate.tenantId, homeId: certificate.homeId, facilityId: certificate.facilityId, certificateId: certificate.id, certificateVersionId: version.id, fileReference: `maintenance/certificates/${certificate.id}/${version.id}/${fileName}`, fileName, originalFileName: fileName, mimeType: "application/pdf", fileSize: 248000, documentType, title: fileName.replace(".pdf", ""), primaryAttachment: primary, uploadedBy: "L. Hartley", uploadedAt: version.recordedAt, active: true };
}

function certificateAssetLink(id: string, certificate: MaintenanceCertificate, version: MaintenanceCertificateVersion, assetId: string, relationshipType: MaintenanceCertificateLinkRelationship, primary: boolean): MaintenanceCertificateAssetLink {
  return { id, tenantId: certificate.tenantId, homeId: certificate.homeId || BALLYMORE_FACILITY_ID, facilityId: certificate.facilityId, certificateId: certificate.id, certificateVersionId: version.id, assetId, relationshipType, primary, linkedBy: "L. Hartley", linkedAt: version.recordedAt };
}

function certificateRequirement(id: string, type: MaintenanceCertificateType, name: string, subjectType: MaintenanceCertificateSubjectType, subjectId: string | undefined, assetCategoryId: string | undefined, warningDays: number): MaintenanceCertificateRequirement {
  return { id, tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, certificateTypeId: type.id, requirementName: name, subjectType, subjectId, assetCategoryId, mandatory: true, recurrenceType: "annual", defaultValidityMonths: type.defaultValidityMonths, warningDays, graceDays: 0, active: true, effectiveFrom: "2026-07-01", createdBy: "System", createdAt: "2026-07-21T08:30:00.000Z", updatedBy: "System", updatedAt: "2026-07-21T08:30:00.000Z" };
}

function timelineEvent(id: string, certificate: MaintenanceCertificate, version: MaintenanceCertificateVersion | undefined, eventType: string, summary: string, details: string, eventDate: string): MaintenanceCertificateTimelineEvent {
  return { id, tenantId: certificate.tenantId, homeId: certificate.homeId, facilityId: certificate.facilityId, certificateId: certificate.id, certificateVersionId: version?.id, eventType, eventDate, userId: "L. Hartley", summary, details, createdAt: eventDate };
}

function maintenanceCertificateAttachmentRecord(certificate: MaintenanceCertificate, version: MaintenanceCertificateVersion, fileName: string, documentType: MaintenanceCertificateAttachmentType, primary: boolean, user: string, now: string, description?: string): MaintenanceCertificateAttachment {
  return { id: `maintenance-cert-attachment-${uid()}`, tenantId: certificate.tenantId, homeId: certificate.homeId, facilityId: certificate.facilityId, certificateId: certificate.id, certificateVersionId: version.id, fileReference: `maintenance/certificates/${certificate.id}/${version.id}/${fileName.trim()}`, fileName: fileName.trim(), originalFileName: fileName.trim(), mimeType: fileName.toLowerCase().endsWith(".png") ? "image/png" : fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg") ? "image/jpeg" : "application/pdf", fileSize: 256000, documentType, title: fileName.trim().replace(/\.[^.]+$/, ""), description, primaryAttachment: primary, uploadedBy: user, uploadedAt: now, active: true };
}

function maintenanceCertificateTimelineEvent(certificate: MaintenanceCertificate, version: MaintenanceCertificateVersion | undefined, eventType: string, summary: string, details: string | undefined, user: string, now: string): MaintenanceCertificateTimelineEvent {
  return { id: `maintenance-cert-event-${uid()}`, tenantId: certificate.tenantId, homeId: certificate.homeId, facilityId: certificate.facilityId, certificateId: certificate.id, certificateVersionId: version?.id, eventType, eventDate: now, userId: user, summary, details, createdAt: now };
}

function maintenanceContractorTimelineEvent(contractor: MaintenanceContractor, eventType: string, summary: string, details: string | undefined, user: string, now: string, homeId?: string): MaintenanceContractorTimelineEvent {
  return { id: `maintenance-contractor-event-${uid()}`, tenantId: contractor.tenantId, contractorId: contractor.id, homeId, facilityId: homeId, eventType, eventDate: now, actorUserId: user, summary, details, createdAt: now };
}

function maintenanceContractorStatusRecord(current: MaintenanceContractor, status: MaintenanceContractorStatus, user: string, now: string, reason?: string): MaintenanceContractor {
  if (!canTransitionContractorStatus(current.status, status)) throw new Error(`Cannot move contractor from ${current.status.toLowerCase()} to ${status.toLowerCase()}.`);
  if (["INACTIVE", "SUSPENDED", "ARCHIVED"].includes(status) && !reason?.trim()) throw new Error("Enter a reason for this status change.");
  if (status === "ACTIVE") {
    const validation = validateContractorInput({ ...current, status });
    if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0]);
  }
  return {
    ...current,
    status,
    active: status === "ACTIVE",
    archived: status === "ARCHIVED",
    archivedAt: status === "ARCHIVED" ? now : current.archivedAt,
    archivedBy: status === "ARCHIVED" ? user : current.archivedBy,
    archiveReason: status === "ARCHIVED" ? reason : current.archiveReason,
    restrictionStatus: status === "SUSPENDED" ? "SUSPENDED" : status === "ACTIVE" ? "NONE" : current.restrictionStatus,
    updatedBy: user,
    updatedAt: now,
    version: current.version + 1,
  };
}

function contractorContactDisplayName(input: Partial<MaintenanceContractorContact>) {
  return input.displayName?.trim() || [input.firstName?.trim(), input.lastName?.trim()].filter(Boolean).join(" ").trim();
}

function validateMaintenanceContractorContactInput(input: Partial<MaintenanceContractorContact>) {
  if (!contractorContactDisplayName(input)) throw new Error("Enter a contact name.");
  if (!["GENERAL", "MANAGER", "OPERATIONS", "SERVICE_COORDINATOR", "ENGINEER", "EMERGENCY", "COMPLIANCE", "ACCOUNTS", "ADMINISTRATION", "OTHER"].includes(String(input.contactRole || "GENERAL"))) throw new Error("Select a valid contact role.");
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) throw new Error("Enter a valid contact email.");
  for (const value of [input.phone, input.mobile, input.emergencyPhone]) {
    if (value && !/^[+()0-9\s-]{6,30}$/.test(value.trim())) throw new Error("Enter a valid contact phone number.");
  }
  if (input.active !== false && !(input.email || input.phone || input.mobile || input.emergencyPhone)) throw new Error("Active contacts require at least one contact method.");
  if (input.isPrimary && input.active === false) throw new Error("Only active contacts can be marked as Primary.");
  if (input.notes && input.notes.trim().length > 2000) throw new Error("Contact notes are too long.");
}

function validateMaintenanceContractorServiceAreaInput(input: Partial<MaintenanceContractorServiceArea>) {
  if (!input.name?.trim()) throw new Error("Enter a service area name.");
  if (!["REGION", "COUNTY", "CITY", "POSTAL_AREA", "HOME", "NATIONWIDE", "REMOTE", "OTHER"].includes(String(input.serviceAreaType || ""))) throw new Error("Select a valid service area type.");
  if (input.effectiveFrom && input.effectiveTo && input.effectiveFrom > input.effectiveTo) throw new Error("Effective from must not be after effective to.");
  if (input.name.trim().length > 160) throw new Error("Service area name is too long.");
  for (const value of [input.countyRegion, input.townCity, input.postalCodePattern]) {
    if (value && value.trim().length > 120) throw new Error("Service area location text is too long.");
  }
  if (input.standardHours && !/^([A-Za-z]{3,9}(-[A-Za-z]{3,9})?\s+)?\d{2}:\d{2}-\d{2}:\d{2}$/.test(input.standardHours.trim())) {
    throw new Error("Use valid standard hours, for example Mon-Fri 09:00-17:00.");
  }
  const timeRange = input.standardHours?.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
  if (timeRange && timeRange[1] >= timeRange[2]) throw new Error("Service area end time must be after start time.");
}

function validateMaintenanceContractorHomeAssociationInput(input: Partial<MaintenanceContractorHomeAssociation>) {
  if (!["PLANNED", "ACTIVE", "INACTIVE", "RESTRICTED", "SUSPENDED", "ARCHIVED"].includes(String(input.associationStatus || "ACTIVE"))) throw new Error("Select a valid Home association status.");
  if (!["NO_ACCESS", "BY_APPOINTMENT", "ESCORTED", "STANDARD", "EMERGENCY_ONLY", "RESTRICTED"].includes(String(input.accessLevel || "BY_APPOINTMENT"))) throw new Error("Select a valid Home access level.");
  if (!["TENANT_WIDE", "HOME_PROVIDER", "EMERGENCY_PROVIDER", "PREFERRED", "OCCASIONAL", "HISTORICAL", "OTHER"].includes(String(input.relationshipType || "HOME_PROVIDER"))) throw new Error("Select a valid Home relationship type.");
  if (input.effectiveFrom && input.effectiveTo && input.effectiveFrom > input.effectiveTo) throw new Error("Effective from must not be after effective to.");
  if ((input.associationStatus === "RESTRICTED" || input.accessLevel === "RESTRICTED") && !(input.accessRestrictions || input.accessNotes)) throw new Error("Restricted Home access requires restriction notes.");
  if (input.associationStatus === "SUSPENDED" && !(input.accessRestrictions || input.accessNotes || input.notes || input.serviceNotes)) throw new Error("Suspended Home access requires a reason.");
  if (input.siteInductionCompleted && !input.siteInductionRequired) throw new Error("Site induction cannot be completed unless induction is required.");
}

function addMonths(date: string, months: number) {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCMonth(d.getUTCMonth() + Math.max(1, Number(months || 1)));
  return d.toISOString().slice(0, 10);
}

function seedHousekeepingData() {
  const now = "2026-07-21T08:30:00.000Z";
  const templates: HousekeepingTemplate[] = [
    housekeepingTemplate("hk-template-routine-bedroom", "Routine Bedroom Cleaning", "HK-ROUTINE-BEDROOM", "ROUTINE", "Daily bedroom and bathroom cleaning.", "daily", 1, 30, false, false, false),
    housekeepingTemplate("hk-template-deep-bedroom", "Bedroom Deep Clean", "HK-DEEP-BEDROOM", "DEEP", "Full bedroom deep clean with photo evidence.", "monthly", 1, 90, true, true, false),
    housekeepingTemplate("hk-template-enhanced-touchpoints", "Enhanced High-Touch Cleaning", "HK-ENHANCED-TOUCH", "ENHANCED", "Additional high-touch cleaning for elevated environmental risk.", "daily", 1, 45, true, true, false),
    housekeepingTemplate("hk-template-terminal-room", "Terminal Room Cleaning", "HK-TERMINAL-ROOM", "TERMINAL", "Terminal cleaning before a room is returned to service.", "custom_days", 1, 150, true, true, true),
  ];
  const sections: HousekeepingTemplateSection[] = [];
  const items: HousekeepingTemplateItem[] = [];
  const addSection = (templateId: string, name: string, order: number) => {
    const section: HousekeepingTemplateSection = { id: `hk-section-${templateId}-${order}`, templateId, name, displayOrder: order, active: true };
    sections.push(section);
    return section.id;
  };
  const addItem = (templateId: string, sectionId: string, code: string, label: string, order: number, failurePhoto = false, failureException = false) => {
    items.push({
      id: `hk-item-${templateId}-${code.toLowerCase()}`,
      templateId,
      sectionId,
      code,
      label,
      responseType: "PASS_FAIL_NA",
      mandatory: true,
      allowNotApplicable: true,
      notApplicableReasonRequired: true,
      failureRequiresObservation: true,
      failureRequiresPhoto: failurePhoto,
      failureRequiresException: failureException,
      failureSeverity: failureException ? "HIGH" : "MEDIUM",
      displayOrder: order,
      active: true,
    });
  };
  templates.forEach((template) => {
    const preparation = addSection(template.id, "Preparation", 1);
    const cleaning = addSection(template.id, "Cleaning", 2);
    const finalCheck = addSection(template.id, "Final Check", 3);
    addItem(template.id, preparation, "ACCESS_SAFE", "Area is accessible and safe to clean", 1, false, true);
    addItem(template.id, cleaning, "WASTE_REMOVED", "Waste removed and disposed of correctly", 2);
    addItem(template.id, cleaning, "SURFACES_CLEANED", "Surfaces and high-touch points cleaned", 3, template.photoEvidenceRequired);
    addItem(template.id, cleaning, "FLOOR_CLEANED", "Floor cleaned and left dry", 4);
    addItem(template.id, finalCheck, "ROOM_READY", "Room or area left ready for use", 5, template.photoEvidenceRequired, template.roomReadinessRequired);
  });
  const schedules: HousekeepingSchedule[] = [
    housekeepingSchedule("hk-schedule-room-1-daily", templates[0], "Room 1 Daily Cleaning", "room:r-w-oak-1", "r-w-oak-1", "Oak Wing - Room 1", "2026-07-22", "09:00", "housekeeping"),
    housekeepingSchedule("hk-schedule-room-3-terminal", templates[3], "Room 3 Terminal Cleaning", "room:r-w-oak-3", "r-w-oak-3", "Oak Wing - Room 3", "2026-07-22", "11:00", "housekeeping-supervisor"),
    housekeepingSchedule("hk-schedule-dining-enhanced", templates[2], "Dining Room Enhanced Cleaning", "location:dining-main", undefined, "Ground Floor - Dining Room", "2026-07-22", "14:00", "housekeeping"),
  ];
  const tasks: HousekeepingTask[] = [
    housekeepingTask("hk-task-0001", templates[0], schedules[0], "HK-2026-0001", "Room 1 Routine Cleaning", "2026-07-22", "09:00", "ASSIGNED", "u-8"),
    housekeepingTask("hk-task-0002", templates[3], schedules[1], "HK-2026-0002", "Room 3 Terminal Cleaning", "2026-07-22", "11:00", "IN_PROGRESS", "u-8"),
    housekeepingTask("hk-task-0003", templates[2], schedules[2], "HK-2026-0003", "Dining Room Enhanced Cleaning", "2026-07-21", "14:00", "FAILED", "u-8"),
    housekeepingTask("hk-task-0004", templates[1], undefined, "HK-2026-0004", "Room 7 Deep Clean", "2026-07-20", "10:00", "COMPLETED", "u-8"),
  ];
  tasks[1].startedBy = "A. Khan"; tasks[1].startedAt = "2026-07-22T11:05:00.000Z"; tasks[1].roomStatusBefore = "CLEANING_REQUIRED"; tasks[1].roomStatusAfter = "CLEANING_IN_PROGRESS";
  tasks[2].startedBy = "A. Khan"; tasks[2].startedAt = "2026-07-21T14:05:00.000Z"; tasks[2].failedBy = "A. Khan"; tasks[2].failedAt = "2026-07-21T14:35:00.000Z"; tasks[2].overallResult = "FAIL"; tasks[2].completionNotes = "Waste bin damaged and spill could not be fully cleared.";
  tasks[3].startedBy = "A. Khan"; tasks[3].startedAt = "2026-07-20T10:00:00.000Z"; tasks[3].completedBy = "A. Khan"; tasks[3].completedAt = "2026-07-20T11:20:00.000Z"; tasks[3].overallResult = "PASS_WITH_OBSERVATIONS"; tasks[3].completionNotes = "Deep clean completed; minor scuffing noted on skirting.";
  const responses = tasks.flatMap((task) => {
    const taskSections = sections.filter((section) => section.templateId === task.templateId);
    const taskItems = items.filter((item) => item.templateId === task.templateId);
    const next = createHousekeepingResponsesFromTemplate(task.id, taskSections, taskItems, "System", now);
    return next.map((response, index) => {
      if (task.status === "COMPLETED") return { ...response, result: "PASS" as const, responseValue: "Pass", answeredBy: "A. Khan", answeredAt: task.completedAt };
      if (task.status === "FAILED" && index === 1) return { ...response, result: "FAIL" as const, responseValue: "Fail", observation: "Waste bin damaged and spill remained after initial clean.", answeredBy: "A. Khan", answeredAt: task.failedAt };
      if (task.status === "FAILED" || task.status === "IN_PROGRESS") return { ...response, result: index < 2 ? "PASS" as const : "UNANSWERED" as const, responseValue: index < 2 ? "Pass" : undefined, answeredBy: "A. Khan", answeredAt: task.startedAt };
      return response;
    });
  });
  const evidence: HousekeepingEvidence[] = [
    { id: "hk-evidence-0001", taskId: tasks[3].id, evidenceType: "PHOTO", fileReference: "housekeeping/room-7-after.jpg", fileName: "room-7-after.jpg", caption: "Room 7 after deep clean", uploadedBy: "A. Khan", uploadedAt: "2026-07-20T11:10:00.000Z", active: true },
    { id: "hk-evidence-0002", taskId: tasks[2].id, responseId: responses.find((item) => item.taskId === tasks[2].id && item.result === "FAIL")?.id, evidenceType: "PHOTO", fileReference: "housekeeping/dining-spill.jpg", fileName: "dining-spill.jpg", caption: "Dining room spill and damaged bin", uploadedBy: "A. Khan", uploadedAt: "2026-07-21T14:30:00.000Z", active: true },
  ];
  const exceptions: HousekeepingException[] = [
    {
      id: "hk-exception-0001",
      tenantId: "tenant-oritas-demo",
      homeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      taskId: tasks[2].id,
      locationId: "location:dining-main",
      locationLabel: "Ground Floor - Dining Room",
      exceptionType: "WASTE",
      category: "Damaged waste bin",
      description: "Waste bin split during cleaning and requires replacement before area can be signed off.",
      severity: "HIGH",
      status: "ACTION_REQUIRED",
      immediateActionTaken: "Area cordoned and supervisor informed.",
      requiresSupervisorReview: true,
      requiresMaintenanceWorkOrder: true,
      maintenanceWorkOrderId: "maintenance-work-order-seed-2",
      requiresReinspection: true,
      reportedBy: "A. Khan",
      reportedAt: "2026-07-21T14:34:00.000Z",
      createdAt: "2026-07-21T14:34:00.000Z",
      updatedAt: "2026-07-21T14:34:00.000Z",
    },
  ];
  const qualityInspections: QualityInspection[] = [
    { id: "hk-quality-0001", tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, taskId: tasks[2].id, locationId: "location:dining-main", locationLabel: "Ground Floor - Dining Room", inspectorId: "u-7", status: "FAILED", result: "FAIL", score: 58, inspectionNotes: "Failed due to unresolved waste exception.", failedItemCount: 1, photoEvidenceRequired: true, reinspectionRequired: true, inspectedAt: "2026-07-21T15:00:00.000Z", createdAt: "2026-07-21T14:50:00.000Z", updatedAt: "2026-07-21T15:00:00.000Z", version: 1 },
    { id: "hk-quality-0002", tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, taskId: tasks[3].id, roomId: "r-w-oak-7", locationLabel: "Oak Wing - Room 7", inspectorId: "u-7", status: "PASSED", result: "PASS_WITH_OBSERVATIONS", score: 92, inspectionNotes: "Passed. Skirting scuffing noted for routine follow-up.", failedItemCount: 0, photoEvidenceRequired: true, reinspectionRequired: false, inspectedAt: "2026-07-20T11:40:00.000Z", createdAt: "2026-07-20T11:25:00.000Z", updatedAt: "2026-07-20T11:40:00.000Z", version: 1 },
  ];
  const qualityInspectionResponses: QualityInspectionResponse[] = [
    { id: "hk-quality-response-0001", inspectionId: "hk-quality-0001", checklistItemCode: "WASTE_REMOVED", questionSnapshot: "Waste removed and disposed of correctly", result: "FAIL", observation: "Damaged bin remains.", severity: "HIGH", evidenceRequired: true, displayOrder: 1 },
    { id: "hk-quality-response-0002", inspectionId: "hk-quality-0002", checklistItemCode: "ROOM_READY", questionSnapshot: "Room or area left ready for use", result: "PASS", evidenceRequired: false, displayOrder: 1 },
  ];
  const audits: CleaningAudit[] = [
    { id: "hk-audit-0001", tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, auditNumber: "HKA-2026-0001", auditType: "SUPERVISOR_AUDIT", locationId: "location:dining-main", locationLabel: "Ground Floor - Dining Room", taskId: tasks[2].id, auditDate: "2026-07-21", auditorId: "u-7", status: "FAILED", result: "FAIL", score: 58, observations: "Waste exception and reinspection required.", correctiveActionRequired: true, reinspectionRequired: true, completedAt: "2026-07-21T15:05:00.000Z", createdAt: "2026-07-21T15:00:00.000Z", updatedAt: "2026-07-21T15:05:00.000Z" },
  ];
  const auditResponses: CleaningAuditResponse[] = [
    { id: "hk-audit-response-0001", auditId: "hk-audit-0001", checklistItemId: "WASTE_REMOVED", questionSnapshot: "Waste removed and disposed of correctly", response: "Fail", result: "FAIL", observation: "Damaged waste bin blocks completion.", evidenceRequired: true, displayOrder: 1 },
  ];
  const reinspections: HousekeepingReinspection[] = [
    { id: "hk-reinspection-0001", tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, originalTaskId: tasks[2].id, originalInspectionId: "hk-quality-0001", failedTaskId: tasks[2].id, assignedUserId: "u-7", assignedTeamId: "housekeeping-supervisor", reason: "Failed enhanced cleaning due to unresolved waste exception.", status: "ASSIGNED", scheduledDate: "2026-07-22", dueDate: "2026-07-22", createdBy: "L. Hartley", createdAt: "2026-07-21T15:10:00.000Z", updatedAt: "2026-07-21T15:10:00.000Z" },
  ];
  const roomReadiness: RoomReadinessRecord[] = [
    housekeepingReadiness("hk-readiness-room-1", "r-w-oak-1", "OCCUPIED", "routine_cleaning", false, true, false, true, true, true, "Room occupied; routine cleaning scheduled."),
    housekeepingReadiness("hk-readiness-room-3", "r-w-oak-3", "CLEANING_IN_PROGRESS", "terminal_cleaning", true, false, true, false, false, false, "Terminal clean in progress before room can be released."),
    housekeepingReadiness("hk-readiness-room-7", "r-w-oak-7", "READY", "deep_clean", false, true, true, true, true, true, "Deep clean and inspection completed."),
  ];
  const roomStatusHistory: RoomStatusHistory[] = [
    { id: "hk-room-history-0001", tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, roomId: "r-w-oak-3", previousStatus: "CLEANING_REQUIRED", newStatus: "CLEANING_IN_PROGRESS", reason: "Terminal cleaning started.", sourceType: "HOUSEKEEPING_TASK", sourceId: tasks[1].id, changedBy: "A. Khan", changedAt: "2026-07-22T11:05:00.000Z" },
    { id: "hk-room-history-0002", tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, roomId: "r-w-oak-7", previousStatus: "AWAITING_INSPECTION", newStatus: "READY", reason: "Quality inspection passed.", sourceType: "QUALITY_INSPECTION", sourceId: "hk-quality-0002", changedBy: "L. Hartley", changedAt: "2026-07-20T11:45:00.000Z" },
  ];
  return { templates, sections, items, schedules, tasks, responses, evidence, exceptions, qualityInspections, qualityInspectionResponses, audits, auditResponses, reinspections, roomReadiness, roomStatusHistory };
}

function housekeepingTemplate(id: string, name: string, code: string, cleaningType: HousekeepingCleaningType, description: string, frequencyType: PlannedMaintenanceFrequencyType, interval: number, duration: number, photo: boolean, inspection: boolean, roomReadiness: boolean): HousekeepingTemplate {
  return { id, tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, name, code, description, cleaningType, applicableLocationTypes: ["Bedroom", "Bathroom", "Communal", "Dining"], applicableRoomTypes: ["Single", "Shared", "Respite"], estimatedDurationMinutes: duration, defaultFrequencyType: frequencyType, defaultFrequencyInterval: interval, preferredTime: cleaningType === "ROUTINE" ? "09:00" : "11:00", defaultPriority: cleaningType === "TERMINAL" ? "HIGH" : "MEDIUM", photoEvidenceRequired: photo, minimumPhotoCount: photo ? 1 : 0, qualityInspectionRequired: inspection, roomReadinessRequired: roomReadiness, verificationRequired: inspection, supervisorSignOffRequired: inspection, instructions: "Follow ORITAS housekeeping procedure and record exceptions immediately.", safetyPrecautions: "Use correct PPE and signage. Do not store clinical details in housekeeping records.", active: true, status: "ACTIVE", version: 1, effectiveFrom: "2026-07-01", createdBy: "System", createdAt: "2026-07-21T08:30:00.000Z", updatedBy: "System", updatedAt: "2026-07-21T08:30:00.000Z" };
}

function housekeepingSchedule(id: string, template: HousekeepingTemplate, name: string, locationId: string, roomId: string | undefined, locationLabel: string, nextDueDate: string, preferredTime: string, team: string): HousekeepingSchedule {
  return { id, tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, templateId: template.id, locationId, locationLabel, roomId, scheduleName: name, cleaningType: template.cleaningType, frequencyType: template.defaultFrequencyType, frequencyInterval: template.defaultFrequencyInterval, startDate: "2026-07-20", nextDueDate, preferredTime, assignedTeamId: team, defaultAssignedUserId: "u-8", priority: template.defaultPriority, generateDaysBeforeDue: 1, dueSoonHours: 4, active: true, paused: false, createdBy: "System", createdAt: "2026-07-21T08:30:00.000Z", updatedBy: "System", updatedAt: "2026-07-21T08:30:00.000Z" };
}

function housekeepingTask(id: string, template: HousekeepingTemplate, schedule: HousekeepingSchedule | undefined, number: string, title: string, dueDate: string, dueTime: string, status: HousekeepingTask["status"], assignedUserId?: string): HousekeepingTask {
  return { id, tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, scheduleId: schedule?.id, templateId: template.id, templateVersion: template.version, locationId: schedule?.locationId || "ad-hoc", locationLabel: schedule?.locationLabel || title, roomId: schedule?.roomId, taskNumber: number, cleaningType: template.cleaningType, title, description: template.description, plannedDate: dueDate, dueDate, dueTime, priority: template.defaultPriority, status, assignedTeamId: schedule?.assignedTeamId || "housekeeping", assignedUserId, qualityInspectionRequired: template.qualityInspectionRequired, roomReadinessRequired: template.roomReadinessRequired, photoEvidenceRequired: template.photoEvidenceRequired, minimumPhotoCount: template.minimumPhotoCount, verificationRequired: template.verificationRequired, overallResult: "NOT_COMPLETED", cleanerDeclarationAccepted: ["COMPLETED", "FAILED"].includes(status), version: 1, createdBy: "System", createdAt: "2026-07-21T08:30:00.000Z", updatedBy: "System", updatedAt: "2026-07-21T08:30:00.000Z" };
}

function housekeepingReadiness(id: string, roomId: string, status: RoomReadinessRecord["readinessStatus"], triggerType: string, cleaningRequired: boolean, cleaningCompleted: boolean, inspectionRequired: boolean, inspectionPassed: boolean, linenReady: boolean, wasteCleared: boolean, notes: string): RoomReadinessRecord {
  return { id, tenantId: "tenant-oritas-demo", homeId: BALLYMORE_FACILITY_ID, facilityId: BALLYMORE_FACILITY_ID, roomId, locationId: `room:${roomId}`, readinessStatus: status, triggerType, currentOccupancyStatus: status === "OCCUPIED" ? "Occupied" : "Vacant", cleaningRequired, cleaningCompleted, qualityInspectionRequired: inspectionRequired, qualityInspectionPassed: inspectionPassed, maintenanceIssueOpen: false, linenReady, wasteCleared, suppliesReady: linenReady && wasteCleared, readinessNotes: notes, lastUpdatedBy: "System", lastUpdatedAt: "2026-07-21T08:30:00.000Z" };
}

function seedMaintenanceTemplates() {
  const now = "2026-07-21T08:30:00.000Z";
  const templates: MaintenanceTemplate[] = [];
  const checklist: MaintenanceTemplateChecklist[] = [];
  const evidence: MaintenanceTemplateEvidence[] = [];
  STARTER_MAINTENANCE_TEMPLATES.forEach((template, index) => {
    const id = `maintenance-template-seed-${index + 1}`;
    templates.push({
      id,
      tenantId: "tenant-oritas-demo",
      homeId: index < 7 ? BALLYMORE_FACILITY_ID : undefined,
      facilityId: index < 7 ? BALLYMORE_FACILITY_ID : undefined,
      nursingHomeId: index < 7 ? BALLYMORE_FACILITY_ID : undefined,
      name: template.name,
      description: template.description,
      category: template.category,
      active: template.active,
      estimatedDurationMinutes: template.estimatedDurationMinutes,
      verificationRequired: template.verificationRequired,
      safetyPrecautions: template.safetyPrecautions,
      skillsRequired: template.skillsRequired,
      frequencyType: template.frequencyType,
      frequencyValue: template.frequencyValue,
      colour: template.colour,
      createdBy: "System",
      createdAt: now,
      updatedBy: "System",
      updatedAt: now,
    });
    template.checklist.forEach((item, itemIndex) => {
      checklist.push({
        id: `maintenance-template-checklist-seed-${index + 1}-${itemIndex + 1}`,
        templateId: id,
        displayOrder: item.displayOrder,
        item: item.item,
        mandatory: item.mandatory,
      });
    });
    template.evidence.forEach((evidenceType, evidenceIndex) => {
      evidence.push({
        id: `maintenance-template-evidence-seed-${index + 1}-${evidenceIndex + 1}`,
        templateId: id,
        evidenceType,
      });
    });
  });
  return { templates, checklist, evidence };
}

function seedPlannedMaintenanceSchedules(): PlannedMaintenanceSchedule[] {
  return [
    {
      id: "planned-maintenance-schedule-seed-1",
      tenantId: "tenant-oritas-demo",
      homeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      nursingHomeId: BALLYMORE_FACILITY_ID,
      assetId: `facility:${BALLYMORE_FACILITY_ID}`,
      assetName: "Ballymore Haven common areas",
      locationLabel: "Ballymore Haven",
      templateId: "maintenance-template-seed-1",
      responsibleTeamId: "maintenance-team",
      startDate: "2026-07-20",
      nextDueDate: "2026-07-27",
      active: true,
      frequencyType: "weekly",
      frequencyValue: 1,
      generateDaysBeforeDue: 7,
      createdBy: "System",
      createdAt: "2026-07-21T08:30:00.000Z",
      updatedBy: "System",
      updatedAt: "2026-07-21T08:30:00.000Z",
    },
    {
      id: "planned-maintenance-schedule-seed-2",
      tenantId: "tenant-oritas-demo",
      homeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      nursingHomeId: BALLYMORE_FACILITY_ID,
      assetId: "room:r-w-oak-3",
      assetName: "Room 3",
      locationLabel: "Oak Wing - Room 3",
      templateId: "maintenance-template-seed-10",
      responsibleTeamId: "engineer",
      startDate: "2026-07-01",
      nextDueDate: "2026-07-22",
      active: true,
      frequencyType: "monthly",
      frequencyValue: 1,
      generateDaysBeforeDue: 5,
      createdBy: "System",
      createdAt: "2026-07-21T08:30:00.000Z",
      updatedBy: "System",
      updatedAt: "2026-07-21T08:30:00.000Z",
    },
    {
      id: "planned-maintenance-schedule-seed-3",
      tenantId: "tenant-oritas-demo",
      homeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      nursingHomeId: BALLYMORE_FACILITY_ID,
      assetId: `facility:${BALLYMORE_FACILITY_ID}`,
      assetName: "Ballymore Haven water outlets",
      locationLabel: "Ballymore Haven",
      templateId: "maintenance-template-seed-2",
      responsibleTeamId: "supervisor",
      startDate: "2026-06-01",
      nextDueDate: "2026-07-15",
      active: true,
      frequencyType: "monthly",
      frequencyValue: 1,
      generateDaysBeforeDue: 7,
      createdBy: "System",
      createdAt: "2026-07-21T08:30:00.000Z",
      updatedBy: "System",
      updatedAt: "2026-07-21T08:30:00.000Z",
    },
  ];
}

function seedPlannedMaintenanceOccurrences(): PlannedMaintenanceOccurrence[] {
  return [
    {
      id: "planned-maintenance-occurrence-seed-1",
      scheduleId: "planned-maintenance-schedule-seed-1",
      homeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      nursingHomeId: BALLYMORE_FACILITY_ID,
      dueDate: "2026-07-27",
      status: "Scheduled",
    },
    {
      id: "planned-maintenance-occurrence-seed-2",
      scheduleId: "planned-maintenance-schedule-seed-2",
      homeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      nursingHomeId: BALLYMORE_FACILITY_ID,
      dueDate: "2026-07-22",
      status: "Scheduled",
    },
    {
      id: "planned-maintenance-occurrence-seed-3",
      scheduleId: "planned-maintenance-schedule-seed-3",
      homeId: BALLYMORE_FACILITY_ID,
      facilityId: BALLYMORE_FACILITY_ID,
      nursingHomeId: BALLYMORE_FACILITY_ID,
      dueDate: "2026-07-15",
      status: "Scheduled",
    },
  ];
}

// ============ Users ============
function seedUsers(): UserProfile[] {
  return [
    {
      id: "u-1",
      name: "C. Adeyemi",
      role: "carer",
      email: "c.adeyemi@carepath.org",
      phone: "07700 900101",
      department: "Care",
      assignedWings: ["w-oak"],
      employeeNumber: "EMP-1001",
      startDate: "2021-03-14",
      lastLogin: daysAgo(0),
      status: "active",
      avatarSeed: "CarerAde",
      notificationPrefs: { email: true, sms: false, inApp: true, criticalAlertsOnly: false },
    },
    {
      id: "u-group-owner",
      facilityId: BALLYMORE_FACILITY_ID,
      facilityIds: DEMO_MULTI_FACILITY_IDS,
      name: "Brian O'Donnell",
      role: "group_owner",
      email: "brian.odonnell@oritas.example",
      phone: "07700 900401",
      department: "Group Executive",
      assignedWings: [],
      employeeNumber: "GRP-0001",
      startDate: "2012-05-20",
      lastLogin: daysAgo(0),
      status: "active",
      avatarSeed: "BrianODonnell",
      notificationPrefs: { email: true, sms: true, inApp: true, criticalAlertsOnly: false },
    },
    {
      id: "u-2",
      name: "T. Brooks",
      role: "carer",
      email: "t.brooks@carepath.org",
      phone: "07700 900102",
      department: "Care",
      assignedWings: ["w-maple"],
      employeeNumber: "EMP-1002",
      startDate: "2022-08-02",
      lastLogin: daysAgo(1),
      status: "active",
      avatarSeed: "CarerBro",
      notificationPrefs: { email: true, sms: false, inApp: true, criticalAlertsOnly: false },
    },
    {
      id: "u-3",
      facilityId: BALLYMORE_FACILITY_ID,
      facilityIds: DEMO_MULTI_FACILITY_IDS,
      name: "J. Roberts",
      role: "nurse",
      email: "j.roberts@carepath.org",
      phone: "07700 900103",
      department: "Nursing",
      assignedWings: ["w-oak", "w-maple"],
      employeeNumber: "EMP-2001",
      startDate: "2019-01-10",
      lastLogin: daysAgo(0),
      status: "active",
      avatarSeed: "NurseRob",
      notificationPrefs: { email: true, sms: true, inApp: true, criticalAlertsOnly: false },
    },
    {
      id: "u-4",
      name: "L. Mensah",
      role: "nurse",
      email: "l.mensah@carepath.org",
      phone: "07700 900104",
      department: "Nursing",
      assignedWings: ["w-ash", "w-willow"],
      employeeNumber: "EMP-2002",
      startDate: "2020-06-22",
      lastLogin: daysAgo(0),
      status: "active",
      avatarSeed: "NurseMen",
      notificationPrefs: { email: true, sms: true, inApp: true, criticalAlertsOnly: false },
    },
    {
      id: "u-5",
      name: "Dr. S. Patel",
      role: "doctor",
      email: "s.patel@nhs.uk",
      phone: "0207 555 0100",
      department: "Medical",
      assignedWings: [],
      employeeNumber: "MED-3001",
      startDate: "2015-09-01",
      lastLogin: daysAgo(2),
      status: "active",
      avatarSeed: "DocPatel",
      notificationPrefs: { email: true, sms: false, inApp: true, criticalAlertsOnly: true },
    },
    {
      id: "u-6",
      name: "M. O'Brien",
      role: "cnm",
      email: "m.obrien@carepath.org",
      phone: "07700 900201",
      department: "Management",
      assignedWings: [],
      employeeNumber: "EMP-3001",
      startDate: "2018-04-19",
      lastLogin: daysAgo(0),
      status: "active",
      avatarSeed: "CnmObrien",
      notificationPrefs: { email: true, sms: true, inApp: true, criticalAlertsOnly: false },
    },
    {
      id: "u-7",
      facilityId: BALLYMORE_FACILITY_ID,
      facilityIds: DEMO_MULTI_FACILITY_IDS,
      name: "L. Hartley",
      role: "don",
      email: "l.hartley@carepath.org",
      phone: "07700 900301",
      department: "Executive",
      assignedWings: [],
      employeeNumber: "EMP-4001",
      startDate: "2014-11-30",
      lastLogin: daysAgo(0),
      status: "active",
      avatarSeed: "DonHart",
      notificationPrefs: { email: true, sms: true, inApp: true, criticalAlertsOnly: false },
    },
    {
      id: "u-hazelwood-don",
      facilityId: HAZELWOOD_FACILITY_ID,
      facilityIds: [HAZELWOOD_FACILITY_ID],
      name: "Hazelwood DON",
      role: "don",
      email: "don@hazelwoodcare.example",
      phone: "07700 901001",
      department: "Executive",
      assignedWings: [],
      employeeNumber: "HZ-4001",
      startDate: "2026-07-06",
      lastLogin: daysAgo(0),
      status: "active",
      avatarSeed: "HazelwoodDon",
      notificationPrefs: { email: true, sms: true, inApp: true, criticalAlertsOnly: false },
    },
  ];
}

const firstNames = [
  "Margaret",
  "Patrick",
  "Eileen",
  "Noel",
  "Brigid",
  "Seamus",
  "Irene",
  "Thomas",
  "Maureen",
  "Declan",
  "Nora",
  "Joseph",
];
const lastNames = [
  "Byrne",
  "Walsh",
  "Kavanagh",
  "Doyle",
  "Murphy",
  "Lynch",
  "Keane",
  "Nolan",
  "Farrell",
  "Donovan",
  "McCarthy",
  "Roche",
];
const diagnoses = [
  "Mixed dementia with frailty syndrome and recurrent delirium",
  "Type 2 diabetes mellitus with peripheral neuropathy and CKD stage 3",
  "Post-stroke left sided weakness with dysphagia risk",
  "COPD with chronic hypoxia and exertional breathlessness",
  "Advanced Parkinson's disease with postural instability",
  "Severe osteoarthritis and chronic pain with reduced mobility",
  "Heart failure (HFpEF) with lower limb oedema",
  "Alzheimer's disease with wandering risk and nighttime agitation",
  "Multiple sclerosis with progressive mobility decline",
  "Recurrent falls with orthostatic hypotension",
  "Lewy body dementia with fluctuating cognition",
  "Frailty, malnutrition risk and recurrent urinary infection",
];
const medications = [
  "Donepezil 10mg ON, Amlodipine 5mg OD, Paracetamol 1g QDS PRN",
  "Metformin 500mg BD, Gliclazide 80mg OD, Atorvastatin 20mg ON",
  "Apixaban 5mg BD, Bisoprolol 2.5mg OD, Omeprazole 20mg OD",
  "Tiotropium inhaler OD, Salbutamol PRN, Prednisolone rescue pack PRN",
  "Co-careldopa 25/100mg QDS, Mirtazapine 15mg ON",
  "Paracetamol 1g QDS, Codeine 30mg PRN, Senna 7.5mg ON",
  "Furosemide 40mg OD, Ramipril 5mg OD, Spironolactone 25mg OD",
  "Memantine 20mg OD, Sertraline 50mg OD, Melatonin 2mg ON",
  "Baclofen 10mg TDS, Pregabalin 75mg BD, Vitamin D 800iu OD",
  "Midodrine 2.5mg TDS, Fludrocortisone 100mcg OD",
  "Rivastigmine patch 9.5mg/24h, Levothyroxine 75mcg OD",
  "Fortisip BD, Nitrofurantoin prophylaxis, Folic acid 5mg OD",
];
const residentTypes: any[] = [
  "active",
  "active",
  "active",
  "active_respite",
  "active",
  "active",
  "inactive_respite",
  "active",
  "active_respite",
  "active",
  "active",
  "active",
];
const bedTypesSeed: any[] = [
  "standard",
  "profiling",
  "pressure_relief",
  "low",
  "standard",
  "air_mattress",
  "specialist",
  "standard",
  "profiling",
  "pressure_relief",
  "profiling",
  "standard",
];
const mattressSeed: any[] = [
  "foam",
  "alternating_air",
  "low_air_loss",
  "foam",
  "standard",
  "alternating_air",
  "gel",
  "foam",
  "alternating_air",
  "low_air_loss",
  "alternating_air",
  "foam",
];

function seedNok(lastName: string, idx: number): NextOfKin[] {
  return [
    {
      id: `nok-${idx}-1`,
      name: `${["Sarah", "James", "Emily", "Robert"][idx % 4]} ${lastName}`,
      relationship: "Daughter",
      phone: "0207 555 0100",
      mobile: phoneFor(idx * 7 + 1),
      email: `${lastName.toLowerCase()}.family@example.com`,
      address: "12 Oak Lane, London",
      primaryContact: true,
      emergencyContact: true,
      powerOfAttorney: idx % 2 === 0,
      legalRepresentative: false,
      notes: "Primary point of contact for care decisions.",
    },
  ];
}

function seedResidents(rooms: Room[]): Resident[] {
  return firstNames.map((fn, i) => {
    const room = rooms[i % rooms.length];
    return {
      id: `R-${String(i + 1).padStart(4, "0")}`,
      firstName: fn,
      lastName: lastNames[i],
      dob: new Date(1935 + i, (i * 3) % 12, ((i * 7) % 27) + 1).toISOString().slice(0, 10),
      gender: i % 3 === 0 ? "male" : "female",
      roomNumber: room.number,
      wingId: room.wingId,
      unitId: room.unitId,
      roomId: room.id,
      admissionDate: daysAgo(60 + i * 30).slice(0, 10),
      primaryDiagnosis: diagnoses[i],
      medicalHistory: "Hypertension, previous hip replacement (2019), cataract surgery.",
      allergies: i % 4 === 0 ? "Penicillin" : "No known drug allergies",
      gp: ["Dr. S. Patel", "Dr. M. Khan", "Dr. R. Evans", "Dr. C. Hughes"][i % 4],
      consultant: [
        "Dr. J. Mitchell (Geriatrics)",
        "Dr. A. Sharma (Cardiology)",
        "Dr. P. O'Neill (Neurology)",
      ][i % 3],
      nextOfKin: `${["Sarah", "James", "Emily", "Robert"][i % 4]} ${lastNames[i]} (daughter)`,
      nextOfKinList: seedNok(lastNames[i], i),
      emergencyContact: phoneFor(i * 13 + 3),
      communicationNeeds:
        i % 3 === 0 ? "Hearing aid (right ear), speak clearly" : "No additional needs",
      religion: ["Church of England", "Catholic", "None", "Methodist"][i % 4],
      preferredLanguage: "English",
      mentalCapacity: i % 3 === 0 ? "lacks_capacity" : i % 3 === 1 ? "fluctuating" : "has_capacity",
      endOfLife: i === 9,
      currentMedication: medications[i],
      status: "active",
      residentType: residentTypes[i],
      bed: {
        bedType: bedTypesSeed[i],
        mattressType: mattressSeed[i],
        installationDate: daysAgo(180 - i * 10).slice(0, 10),
        reviewDate: daysAhead(90 + i * 5).slice(0, 10),
      },
      keyWorkers: {
        namedNurse: ["J. Roberts (RN)", "L. Mensah (RN)"][i % 2],
        namedCarer: ["C. Adeyemi", "T. Brooks"][i % 2],
        keyWorker: ["A. Garcia", "S. Williams", "D. Foster"][i % 3],
      },
      lastGpReview: daysAgo(20 + i * 3).slice(0, 10),
      lastMdtReview: daysAgo(40 + i * 4).slice(0, 10),
      photoSeed: `${fn}${lastNames[i]}`,
      aKeyToMe:
        i % 2 === 0
          ? {
              lifeHistory: `Born and raised in ${["Manchester", "Liverpool", "Cardiff"][i % 3]}. Worked as a ${["teacher", "nurse", "engineer", "shopkeeper"][i % 4]} for 35 years.`,
              occupation: [
                "Retired teacher",
                "Retired nurse",
                "Retired engineer",
                "Retired shopkeeper",
              ][i % 4],
              family: "Two children, four grandchildren. Family visit weekly.",
              hobbies: "Reading, gardening, jigsaw puzzles, classical music.",
              likes: "Tea with two sugars, classical music, sunny days, family photos.",
              dislikes: "Loud noises, being rushed, cold rooms.",
              foodPreferences: "Light meals, prefers fish, dislikes strong cheese.",
              dailyRoutine: "Likes a quiet morning, reads paper, afternoon nap after lunch.",
              comfortItems: "Photograph album, knitted blanket from her mother.",
              triggers: "Being told what to do without explanation.",
              whatMakesMeHappy: "Family visits, classical music on the radio.",
              whatUpsetsMe: "Loud arguments, missing my afternoon tea.",
              bestWayToSupport:
                "Speak slowly, give choices, allow time to respond. Use her name often.",
            }
          : undefined,
    } as Resident;
  });
}

function seedData() {
  const wings = WINGS_SEED;
  const units = UNITS_SEED;
  const rooms = seedRooms();
  const users = seedUsers();
  const residents = seedResidents(rooms);
  const assessments: Assessment[] = [];
  const interventions: Intervention[] = [];
  const notes: DailyNote[] = [];
  const evaluations: Evaluation[] = [];
  const alerts: Alert[] = [];
  const tasks: Task[] = [];
  const incidents: Incident[] = [];
  const mdtNotes: MDTNote[] = [];
  const visitors: Visitor[] = [];
  const outings: Outing[] = [];
  const handovers: HandoverNote[] = [];
  const scenarioBlueprints = [
    {
      title: "Cognitive Support and Delirium Prevention",
      category: "Cognition",
      problem: "Fluctuating cognition and evening confusion increase distress and care refusal.",
      goal: "Resident remains oriented to person/place with fewer episodes of evening agitation.",
      interventions: [
        "Use orientation board each shift",
        "Maintain calm low-stimulus evening routine",
        "Offer reassurance before personal care",
        "Escalate acute change in behaviour to nurse",
      ],
      frequency: "Each shift",
      priority: "high" as const,
    },
    {
      title: "Diabetes and Foot Care",
      category: "Medication",
      problem: "Variable blood glucose and peripheral neuropathy increase risk of foot injury.",
      goal: "Maintain blood glucose in target range and prevent skin breakdown.",
      interventions: [
        "Pre-meal blood glucose monitoring",
        "Daily foot and skin check",
        "Escalate readings outside agreed range",
      ],
      frequency: "Before meals and at bedtime",
      priority: "high" as const,
    },
    {
      title: "Post-Stroke Mobility and Swallow Safety",
      category: "Mobility",
      problem: "Reduced left-sided strength and fatigue increase transfer risk.",
      goal: "Safe assisted transfers and no aspiration signs.",
      interventions: [
        "Two-person assist for transfers",
        "Position upright for meals and medications",
        "Prompt swallow strategies at mealtimes",
      ],
      frequency: "At each transfer and meal",
      priority: "high" as const,
    },
    {
      title: "Respiratory Optimisation",
      category: "Respiratory",
      problem: "COPD exacerbation risk with intermittent low oxygen saturation.",
      goal: "Maintain oxygenation and reduce breathlessness episodes.",
      interventions: [
        "Monitor SpO2 as per plan",
        "Support inhaler technique",
        "Position for maximal chest expansion",
      ],
      frequency: "Twice daily and PRN",
      priority: "high" as const,
    },
    {
      title: "Falls and Postural Stability",
      category: "Falls Prevention",
      problem: "Postural instability and freezing episodes increase fall risk.",
      goal: "No unwitnessed falls over next review period.",
      interventions: [
        "Supervised mobilising with frame",
        "Call bell and essentials within reach",
        "Toileting schedule during daytime",
      ],
      frequency: "Each shift",
      priority: "critical" as const,
    },
    {
      title: "Chronic Pain and Function",
      category: "Pain Management",
      problem: "Persistent musculoskeletal pain limits movement and activity.",
      goal: "Keep pain score <= 3 and maintain participation in ADLs.",
      interventions: [
        "Scheduled analgesia and PRN review",
        "Heat therapy and guided movement",
        "Pain score reassessment after intervention",
      ],
      frequency: "4-hourly review",
      priority: "high" as const,
    },
    {
      title: "Fluid Management and Oedema",
      category: "Cardiac",
      problem: "Heart failure with fluctuating oedema and fluid overload risk.",
      goal: "Stable weight and reduced lower-limb swelling.",
      interventions: [
        "Daily weight monitoring",
        "Fluid balance chart completion",
        "Escalate rapid weight gain >2kg in 3 days",
      ],
      frequency: "Daily",
      priority: "high" as const,
    },
    {
      title: "Wandering and Night Safety",
      category: "Behaviour",
      problem: "Night wandering episodes increase fall and exit-seeking risk.",
      goal: "Reduce unsafe night wandering and preserve sleep.",
      interventions: [
        "Hourly night checks",
        "Personalised calming bedtime routine",
        "Sensor alert checks and environmental safety",
      ],
      frequency: "Night shift",
      priority: "high" as const,
    },
    {
      title: "Progressive Mobility Decline",
      category: "Mobility",
      problem: "Progressive weakness causing reduced transfer tolerance.",
      goal: "Safe transfer routine and skin integrity preserved.",
      interventions: [
        "Hoist transfer protocol",
        "Passive range-of-motion exercises",
        "Repositioning schedule adherence",
      ],
      frequency: "Each shift",
      priority: "high" as const,
    },
    {
      title: "Falls Risk and Orthostatic Monitoring",
      category: "Falls Prevention",
      problem: "Orthostatic hypotension with recurrent near-falls.",
      goal: "Reduce dizziness episodes and prevent falls.",
      interventions: [
        "Lying and standing blood pressure checks",
        "Slow position changes with supervision",
        "Hydration encouragement plan",
      ],
      frequency: "Twice daily",
      priority: "critical" as const,
    },
    {
      title: "Cognition and Distress Response",
      category: "Mental Health",
      problem: "Fluctuating cognition with distress during unfamiliar care.",
      goal: "Improve engagement and reduce distress behaviours.",
      interventions: [
        "Consistent staff introductions",
        "Stepwise explanations before interventions",
        "Document effective de-escalation methods",
      ],
      frequency: "Each contact",
      priority: "high" as const,
    },
    {
      title: "Nutrition and Infection Prevention",
      category: "Nutrition",
      problem: "Low oral intake and recurrent urinary infection history.",
      goal: "Improve intake and reduce infection indicators.",
      interventions: [
        "Food and fluid fortification",
        "Monitor urine characteristics and symptoms",
        "Weekly MUST and weight trend review",
      ],
      frequency: "Daily",
      priority: "high" as const,
    },
  ];

  residents.forEach((r, i) => {
    const baseAssessment = (
      extra: Partial<Assessment> & { type?: AssessmentType },
    ): Partial<Assessment> => {
      const type = extra.type as AssessmentType | undefined;
      const cat = type ? categoryFor(type) : undefined;
      // Stagger review dates so some are due/overdue
      const offset = ((i + (type?.length ?? 3)) % 50) - 20; // -20..+29
      return {
        assessor: "J. Roberts (RN)",
        assessorRole: "nurse",
        status: "completed",
        version: 1,
        locked: true,
        category: cat,
        reviewFrequency: "monthly" as const,
        reviewTriggers: ["routine" as const],
        reviewDate: daysAhead(7 + offset).slice(0, 10),
        nextReassessmentDate: daysAhead(offset).slice(0, 10),
        lockedBy: "J. Roberts (RN)",
        lockedAt: daysAgo(5).toString(),
        auditTrail: [
          {
            id: `aud-${i}-c-${type ?? "x"}`,
            action: "created",
            byUserId: "u-3",
            byUserName: "J. Roberts (RN)",
            byRole: "nurse",
            at: daysAgo(10).toString(),
          },
          {
            id: `aud-${i}-d-${type ?? "x"}`,
            action: "completed",
            byUserId: "u-3",
            byUserName: "J. Roberts (RN)",
            byRole: "nurse",
            at: daysAgo(10).toString(),
          },
          {
            id: `aud-${i}-l-${type ?? "x"}`,
            action: "locked",
            byUserId: "u-3",
            byUserName: "J. Roberts (RN)",
            byRole: "nurse",
            at: daysAgo(10).toString(),
          },
        ],
        clinicalComments: [],
        linkedProblemIds: [],
        ...extra,
      };
    };

    const bScores = {
      feeding: [10, 5, 0, 10, 5, 0, 5, 10, 5, 0, 5, 10][i],
      bathing: [5, 0, 0, 5, 0, 0, 5, 0, 5, 0, 5, 5][i],
      grooming: [5, 0, 5, 5, 0, 5, 0, 5, 0, 0, 5, 5][i],
      dressing: [10, 5, 0, 10, 0, 5, 5, 0, 5, 0, 5, 10][i],
      bowels: [10, 5, 0, 10, 5, 5, 5, 0, 5, 0, 5, 10][i],
      bladder: [10, 5, 0, 5, 0, 5, 5, 0, 5, 0, 5, 10][i],
      toilet: [10, 5, 0, 5, 0, 5, 5, 0, 5, 0, 5, 10][i],
      transfers: [15, 5, 0, 10, 5, 10, 5, 0, 5, 0, 10, 15][i],
      mobility: [15, 5, 0, 10, 0, 10, 5, 0, 5, 0, 10, 15][i],
      stairs: [10, 0, 0, 5, 0, 5, 0, 0, 0, 0, 5, 10][i],
    };
    const b = scoreAssessment("barthel", bScores);
    assessments.push({
      id: uid(),
      residentId: r.id,
      type: "barthel",
      date: daysAgo(20 - (i % 10)).slice(0, 10),
      scores: bScores,
      ...b,
      ...baseAssessment({ type: "barthel" }),
    } as Assessment);

    const wScores = {
      build: i % 3,
      skin: i % 4,
      age: i < 5 ? 3 : 5,
      sex: 2,
      continence: i % 4,
      mobility: i % 5,
      nutrition: i % 3,
      neuro: i % 2 === 0 ? 4 : 0,
      specialRisk: i === 9 ? 8 : 0,
      medication: i % 3 === 0 ? 4 : 0,
    };
    const w = scoreAssessment("waterlow", wScores);
    assessments.push({
      id: uid(),
      residentId: r.id,
      type: "waterlow",
      date: daysAgo(15 - (i % 5)).slice(0, 10),
      scores: wScores,
      ...w,
      ...baseAssessment({ type: "waterlow" }),
    } as Assessment);

    const aScores = {
      vocalisation: [0, 1, 2, 0, 3, 1, 0, 2, 1, 3, 1, 0][i],
      facial: [1, 1, 2, 0, 3, 2, 0, 2, 1, 3, 1, 0][i],
      bodyLanguage: [0, 2, 1, 0, 2, 1, 1, 2, 0, 3, 1, 0][i],
      behavioural: [0, 1, 2, 0, 2, 1, 0, 1, 1, 2, 0, 0][i],
      physiological: [0, 1, 1, 0, 2, 0, 0, 1, 1, 2, 0, 0][i],
      physical: [0, 0, 1, 0, 2, 1, 0, 1, 0, 2, 0, 0][i],
    };
    const a = scoreAssessment("abbey_pain", aScores);
    assessments.push({
      id: uid(),
      residentId: r.id,
      type: "abbey_pain",
      date: daysAgo(10 - (i % 5)).slice(0, 10),
      scores: aScores,
      ...a,
      ...baseAssessment({ type: "abbey_pain", assessor: "L. Mensah (RN)" }),
    } as Assessment);

    if (i % 2 === 0) {
      const mScores = {
        foodIntake: i % 3,
        weightLoss: (i + 1) % 4,
        mobility: i % 3,
        stress: i % 2 === 0 ? 0 : 2,
        neuro: i % 3,
        bmi: i % 4,
      };
      const m = scoreAssessment("mna", mScores);
      assessments.push({
        id: uid(),
        residentId: r.id,
        type: "mna",
        date: daysAgo(12).slice(0, 10),
        scores: mScores,
        ...m,
        ...baseAssessment({ type: "mna" }),
      } as Assessment);
    }
    if (i % 3 === 0) {
      const mmseScores = {
        orientationTime: 3,
        orientationPlace: 4,
        registration: 2,
        attention: 2,
        recall: 1,
        naming: 2,
        repetition: 1,
        command: 2,
        reading: 1,
        writing: 0,
        copying: 0,
      };
      const mmseR = scoreAssessment("mmse", mmseScores);
      assessments.push({
        id: uid(),
        residentId: r.id,
        type: "mmse",
        date: daysAgo(18).slice(0, 10),
        scores: mmseScores,
        ...mmseR,
        ...baseAssessment({ type: "mmse" }),
      } as Assessment);
    }
    if (i % 4 === 0) {
      const fallsScores = {
        history: 3,
        medication: 2,
        vision: 0,
        mobility: 3,
        cognition: 2,
        continence: 0,
        footwear: 0,
        environment: 0,
      };
      const fR = scoreAssessment("falls", fallsScores);
      assessments.push({
        id: uid(),
        residentId: r.id,
        type: "falls",
        date: daysAgo(9).slice(0, 10),
        scores: fallsScores,
        ...fR,
        ...baseAssessment({ type: "falls" }),
      } as Assessment);
    }

    // === INTERVENTION GENERATION ===
    if (i === 0) {
      // MARGARET: Exactly 2 interventions aligned with unified care plan
      const margaretInterventions = [
        {
          name: "2-hourly repositioning & pressure area care bundle",
          outcome: "Completed",
          residentResponse: "Settled appropriately",
          date: daysAgo(0),
        },
        {
          name: "Multidomain safety & support plan (falls + cognition + nutrition support + ADL assistance)",
          outcome: "Completed",
          residentResponse: "Accepted all interventions with reassurance",
          date: daysAgo(1),
        },
      ];
      margaretInterventions.forEach((interv, k) => {
        interventions.push({
          id: uid(),
          residentId: r.id,
          date: interv.date.slice(0, 10),
          staff: k === 0 ? "J. Roberts (RN)" : "C. Adeyemi",
          intervention: interv.name,
          outcome: interv.outcome,
          residentResponse: interv.residentResponse,
          followUpRequired: false,
        });
      });
    } else {
      // Generic residents: 3 scenario-based interventions
      const scenario = scenarioBlueprints[i % scenarioBlueprints.length];
      const interventionTemplates = [
        {
          name: scenario.interventions[0],
          outcome: "Completed as planned",
          residentResponse: "Accepted intervention with reassurance",
        },
        {
          name: scenario.interventions[1] || "Clinical monitoring completed",
          outcome:
            i % 4 === 0
              ? "Partially completed due to resident fatigue"
              : "Completed and documented",
          residentResponse: i % 4 === 0 ? "Tired but cooperative" : "Tolerated well",
        },
        {
          name: scenario.interventions[2] || "Hydration and comfort round",
          outcome: "Completed",
          residentResponse: "Comfort maintained",
        },
      ];
      interventionTemplates.forEach((template, k) => {
        interventions.push({
          id: uid(),
          residentId: r.id,
          date: daysAgo(k).slice(0, 10),
          staff: ["C. Adeyemi", "T. Brooks", "J. Roberts (RN)"][k % 3],
          intervention: template.name,
          outcome: template.outcome,
          residentResponse: template.residentResponse,
          followUpRequired: k === 1 && i % 3 === 0,
        });
      });
    }

    for (let k = 0; k < 3; k++) {
      notes.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(k).slice(0, 10),
        staff: ["C. Adeyemi", "T. Brooks", "J. Roberts (RN)"][k % 3],
        shift: (["morning", "afternoon", "night"] as const)[k % 3],
        observation:
          k === 0
            ? "Baseline observations completed and care plan actions delivered."
            : k === 1
              ? "Resident engaged with support; no acute deterioration observed."
              : "Night settled with routine checks and repositioning as required.",
        mood: (["calm", "happy", "anxious", "withdrawn", "agitated"] as const)[(i + k) % 5],
        foodIntake: (["full", "most", "half", "little"] as const)[(i + k) % 4],
        fluidIntake: (["good", "moderate", "poor"] as const)[(i + k) % 3],
        sleep: (["good", "broken", "poor"] as const)[(i + k + 1) % 3],
        behaviour:
          i % 3 === 1 && k === 2
            ? "Required reassurance during personal care."
            : "No safeguarding concerns noted.",
      });
    }

    if (i === 0) {
      // MARGARET: Fall incident (documented 7 days ago)
      incidents.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(7).slice(0, 10),
        type: "near_miss",
        severity: "moderate",
        description:
          "During assisted transfer to commode, resident's knee buckled. Staff prevented fall by firm hold and lowering gently to chair.",
        immediateAction:
          "Post-incident observations completed. Neurological check normal. Falls protocol reviewed. Switched to 2-person assists for all transfers.",
        reportedBy: "C. Adeyemi",
        witnessedBy: "T. Brooks",
        followUpRequired: true,
        status: "closed",
        closedAt: daysAgo(6),
        closedBy: "J. Roberts (RN)",
      });

      // MARGARET: MDT note
      mdtNotes.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(14).slice(0, 10),
        attendees: "Dr. S. Patel (GP), J. Roberts (RN), M. O'Brien (CNM), Sarah (daughter/POA)",
        discussion:
          "Reviewed comprehensive assessment results. Margaret remains suitable for nursing home care with current support. Discussed pressure risk, falls risk, and nutrition. Family expressed satisfaction with unified care plan.",
        recommendations:
          "Continue current unified care plan approach. Repeat Waterlow in 4 weeks. Trial OT assessment for ROM exercises. Review pain medication if needed.",
        followUpDate: daysAhead(28).slice(0, 10),
        authoredBy: "Dr. S. Patel",
        role: "doctor",
      });

      // MARGARET: Handover
      handovers.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(0).slice(0, 10),
        shift: "morning",
        staff: "J. Roberts (RN)",
        summary:
          "Margaret settled. Morning skin check completed—no concerns. Ate breakfast. 10am repositioning completed. Monitor for any discomfort.",
        outstandingActions:
          "Daily skin inspection due today. Fluid chart must be updated. Ensure 2-person assist protocol for all transfers.",
        priority: "high",
      });
    } else {
      if (i % 3 === 0) {
        incidents.push({
          id: uid(),
          residentId: r.id,
          date: daysAgo(3 + i).slice(0, 10),
          type: i % 2 === 0 ? "fall" : "near_miss",
          severity: i % 4 === 0 ? "high" : "moderate",
          description:
            i % 2 === 0
              ? "Resident found seated on floor beside bed; no apparent injury."
              : "Resident became unsteady during transfer; staff prevented full fall.",
          immediateAction:
            "Post-incident observations completed, family informed, falls protocol followed.",
          reportedBy: "J. Roberts (RN)",
          witnessedBy: "C. Adeyemi",
          followUpRequired: true,
          status: i % 4 === 0 ? "under_investigation" : "open",
        });
      }
      if (i % 2 === 0) {
        mdtNotes.push({
          id: uid(),
          residentId: r.id,
          date: daysAgo(10 + i).slice(0, 10),
          attendees: "Dr. S. Patel, J. Roberts (RN), M. O'Brien (CNM), Family representative",
          discussion: "Reviewed risk trends, medication tolerance and current care plan outcomes.",
          recommendations:
            "Continue current interventions and escalate if NEWS2 threshold breached.",
          followUpDate: daysAhead(21).slice(0, 10),
          authoredBy: "Dr. S. Patel",
          role: "doctor",
        });
      }
      if (i % 2 === 1) {
        visitors.push({
          id: uid(),
          residentId: r.id,
          date: daysAgo(1).slice(0, 10),
          visitorName: `${["Aoife", "Liam", "Siobhan"][i % 3]} ${r.lastName}`,
          relationship: i % 3 === 0 ? "Son" : "Daughter",
          arrivalTime: "14:00",
          departureTime: "15:20",
          notes: "Discussed current mobility support and encouraged social engagement.",
          signedInBy: "Reception",
          status: "completed",
        });
      }
      if (i % 4 === 0) {
        outings.push({
          id: uid(),
          residentId: r.id,
          date: daysAgo(6).slice(0, 10),
          destination: "Community sensory garden",
          accompaniedBy: "Activities coordinator and family",
          departureTime: "10:30",
          returnTime: "12:00",
          transportMethod: "Wheelchair accessible vehicle",
          notes: "Short supervised outing completed with positive mood impact.",
          riskAssessmentCompleted: true,
          status: "returned",
        });
      }
      handovers.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(0).slice(0, 10),
        shift: "morning",
        staff: "J. Roberts (RN)",
        summary: "Priority care actions completed; monitor trend data and escalation triggers.",
        outstandingActions:
          i % 3 === 0
            ? "Complete post-incident review documentation before end of day."
            : "Confirm family update after afternoon medication round.",
        priority: i % 3 === 0 ? "high" : "medium",
        status: i % 5 === 0 ? "acknowledged" : "open",
      });
    } // END Margaret (i === 0) vs Generic (i > 0)
  });

  // ---- Phase 5 seed: charts & observations ----
  const observations: Observation[] = [];
  const weights: WeightRecord[] = [];
  const fluids: FluidRecord[] = [];
  const foods: FoodRecord[] = [];
  const pains: PainRecord[] = [];
  const sleeps: SleepRecord[] = [];
  const bowels: BowelRecord[] = [];
  const behaviours: BehaviourRecord[] = [];
  const incidentActions: IncidentAction[] = [];
  const shiftSummaries: ShiftSummary[] = [];
  const timelineEvents: TimelineEvent[] = [];

  residents.forEach((r, i) => {
    // 6 weight records over time (trend)
    for (let w = 5; w >= 0; w--) {
      const base = 62 + (i % 5) * 3;
      weights.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(w * 14).slice(0, 10),
        weightKg: +(base - w * 0.4 + (i % 3) * 0.2).toFixed(1),
        staff: "J. Roberts (RN)",
      });
    }
    // fluids today (3 entries)
    for (let k = 0; k < 3; k++) {
      fluids.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(0).slice(0, 10),
        time: ["08:00", "12:30", "17:00"][k],
        amountMl: [200, 250, 180][k],
        type: ["Water", "Tea", "Juice"][k],
        route: "oral",
        staff: ["C. Adeyemi", "T. Brooks", "C. Adeyemi"][k],
      });
    }
    // food today (3 meals)
    (["breakfast", "lunch", "dinner"] as const).forEach((meal, mi) => {
      foods.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(0).slice(0, 10),
        meal,
        intake: (["full", "most", "half", "little"] as const)[(i + mi) % 4],
        staff: "C. Adeyemi",
      });
    });
    // pain — last 5 days
    for (let p = 4; p >= 0; p--) {
      pains.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(p).slice(0, 10),
        time: "10:00",
        score: (i + p) % 6,
        staff: "J. Roberts (RN)",
      });
    }
    // sleep — last 5 nights
    for (let s = 4; s >= 0; s--) {
      sleeps.push({
        id: uid(),
        residentId: r.id,
        date: daysAgo(s).slice(0, 10),
        hoursSlept: 5 + ((i + s) % 4),
        quality: (["good", "broken", "poor"] as const)[(i + s) % 3],
        staff: "Night Team",
      });
    }
    // observation today
    observations.push({
      id: uid(),
      residentId: r.id,
      date: daysAgo(0).slice(0, 10),
      time: "09:30",
      staff: "C. Adeyemi",
      role: "carer",
      mood: (["happy", "calm", "anxious"] as const)[i % 3],
      mobility: (["independent", "assistance", "hoist"] as const)[i % 3],
      pain: i % 4,
      sleep: "good",
      appetite: "most",
      hydration: "good",
      behaviour: "Settled.",
    });
  });

  // ---- Phase 6 seed: Vital Signs ----
  const vitals: VitalSign[] = [];
  const observationPlans: ObservationPlan[] = [];
  const clinicalAlerts: ClinicalAlert[] = [];

  residents.forEach((r, i) => {
    // assign a default height to each resident
    (r as any).heightCm = 158 + (i % 7) * 4;
    // Observation plan
    observationPlans.push({
      residentId: r.id,
      updatedAt: daysAgo(30),
      updatedByName: "M. O'Brien (CNM)",
      items: [
        { id: `op-${r.id}-1`, type: "temperature", frequency: "daily", required: true },
        { id: `op-${r.id}-2`, type: "bloodPressure", frequency: "weekly", required: true },
        { id: `op-${r.id}-3`, type: "weight", frequency: "weekly", required: true },
        { id: `op-${r.id}-4`, type: "pulse", frequency: "daily", required: true },
        { id: `op-${r.id}-5`, type: "spo2", frequency: "daily", required: false },
        { id: `op-${r.id}-6`, type: "news2", frequency: "prn", required: true },
        ...(i % 3 === 0
          ? [
              {
                id: `op-${r.id}-7`,
                type: "bloodGlucose" as const,
                frequency: "daily" as const,
                required: true,
              },
            ]
          : []),
        ...(i % 4 === 0
          ? [
              {
                id: `op-${r.id}-8`,
                type: "fluidBalance" as const,
                frequency: "daily" as const,
                required: true,
              },
            ]
          : []),
        { id: `op-${r.id}-9`, type: "painScore", frequency: "daily", required: false },
      ],
    });
  });

  const demoVital = (
    id: string,
    residentId: string,
    observationType: VitalSign["observationType"],
    time: string,
    values: Partial<VitalSign>,
  ): VitalSign => {
    const recordedAt = `2026-06-23T${time}:00.000Z`;
    const item: VitalSign = {
      id,
      residentId,
      observationType,
      date: "2026-06-23",
      time,
      recordedAt,
      ...values,
      recordedByUserId: "u-3",
      recordedByName: "J. Roberts (RN)",
      recordedByRole: "nurse",
      createdAt: recordedAt,
      auditTrail: [{
        id: `audit-${id}`,
        action: "created",
        byUserId: "u-3",
        byUserName: "J. Roberts (RN)",
        byRole: "nurse",
        at: recordedAt,
      }],
    };
    const news2 = calcNEWS2(item);
    return news2.complete
      ? { ...item, news2Score: news2.total, news2Risk: news2.risk, news2Breakdown: news2.breakdown }
      : item;
  };

  vitals.push(
    demoVital("demo-vital-news2", "R-0001", "full_news2", "08:30", {
      temperature: 36.7,
      pulse: 78,
      respiratoryRate: 18,
      spo2: 96,
      systolicBP: 124,
      diastolicBP: 76,
      onOxygen: false,
      consciousness: "A",
    }),
    demoVital("demo-vital-temperature", "R-0002", "temperature", "09:15", {
      temperature: 38.6,
      observationNotes: "Mild pyrexia noted. Fluids encouraged and nurse informed.",
    }),
    demoVital("demo-vital-weight", "R-0001", "weight_bmi", "10:00", {
      weight: 61.2,
      observationNotes: "Weekly weight recorded.",
    }),
    demoVital("demo-vital-spo2", "R-0003", "oxygen_saturation", "11:00", {
      spo2: 90,
      onOxygen: false,
      respiratoryRate: 24,
      observationNotes: "Low oxygen saturation recorded. Resident comfortable but for nursing review.",
    }),
  );

  // Derive seed clinical alerts from seeded vitals (persisted so ack/dismiss survives)
  residents.forEach((r) => {
    const rv = vitals.filter((v) => v.residentId === r.id);
    const seeds = derivedAlertsForResident(rv, r);
    seeds.forEach((s, idx) => {
      const sourceVital = s.sourceVitalId ? rv.find((vital) => vital.id === s.sourceVitalId) : undefined;
      clinicalAlerts.push({
        id: `ca-${r.id}-${idx}`,
        residentId: r.id,
        type: s.type,
        severity: s.severity,
        title: s.title,
        message: s.message,
        recommendation: s.recommendation,
        currentValue: s.currentValue,
        previousValue: s.previousValue,
        sourceVitalId: s.sourceVitalId,
        createdAt: sourceVital?.recordedAt || new Date().toISOString(),
        acknowledged: false,
        escalations: [],
      });
    });
  });

  const migrated = {
    residentCarePlans: [] as ResidentCarePlan[],
    carePlanProblems: [] as CarePlanProblem[],
    problemGoals: [] as ProblemGoal[],
    problemInterventions: [] as ProblemIntervention[],
    problemEvaluations: [] as ProblemEvaluation[],
    problemReviews: [] as ProblemReview[],
    problemInterventionLogs: [] as ProblemInterventionLog[],
    problemHistory: [] as ProblemHistoryEntry[],
  };

  // Seed AssessmentSuggestions for completed assessments that have not already triggered a problem
  const assessmentSuggestions: AssessmentSuggestion[] = [];
  for (const a of assessments) {
    if (a.status === "deleted" || a.status === "archived") continue;
    const sugs = suggestionsForAssessment(a);
    for (const s of sugs) {
      // skip if a problem already exists for this resident with that category sourced from this assessment
      if (
        migrated.carePlanProblems.some(
          (p) =>
            p.residentId === a.residentId &&
            p.category === s.category &&
            p.sourceAssessmentId === a.id,
        )
      )
        continue;
      assessmentSuggestions.push({
        ...s,
        id: newId("sug"),
        createdAt: new Date().toISOString(),
        status: "pending",
      });
    }
  }
  const maintenanceTemplateSeed = seedMaintenanceTemplates();
  const safetyComplianceSeed = seedSafetyComplianceData();
  const housekeepingSeed = seedHousekeepingData();
  const certificateSeed = seedMaintenanceCertificateData();

  return {
    enterprises: ENTERPRISES_SEED,
    facilities: FACILITIES_SEED,
    wings,
    units,
    rooms,
    wards: [] as Ward[],
    beds: [] as Bed[],
    bedAssignments: [] as BedAssignment[],
    admissions: [] as Admission[],
    absenceEpisodes: [] as AbsenceEpisode[],
    userAccounts: [] as UserAccount[],
    staffMembers: [] as StaffMember[],
    staffEmergencyContacts: [] as StaffEmergencyContact[],
    staffDirectoryEvents: [] as StaffDirectoryEvent[],
    employmentRecords: [] as EmploymentRecord[],
    employmentHomeAssignments: [] as EmploymentHomeAssignment[],
    employmentRoleAssignments: [] as EmploymentRoleAssignment[],
    workforceEmploymentEvents: [] as WorkforceEmploymentEvent[],
    roleAssignments: [] as RoleAssignment[],
    professionalRegistrations: [] as ProfessionalRegistration[],
    professionalRegistrationBodies: [
      { id: "nmbi", name: "Nursing and Midwifery Board of Ireland", countryCode: "IE", active: true },
      { id: "medical-council-ie", name: "Medical Council of Ireland", countryCode: "IE", active: true },
    ] as ProfessionalRegistrationBody[],
    professionalRegistrationRequirements: [
      { id: "req-nurse-nmbi", roleKey: "NURSE", professionKey: "nurse", registrationBodyId: "nmbi", active: true },
      { id: "req-doctor-medical-council", roleKey: "DOCTOR", professionKey: "doctor", registrationBodyId: "medical-council-ie", active: true },
    ] as ProfessionalRegistrationRequirement[],
    professionalRegistrationEvents: [] as ProfessionalRegistrationEvent[],
    staffVisaTypes: DEFAULT_STAFF_VISA_TYPES,
    staffEmploymentPermitTypes: DEFAULT_STAFF_EMPLOYMENT_PERMIT_TYPES,
    staffVisaRecords: [] as StaffVisaRecord[],
    staffResidencePermissionRecords: [] as StaffResidencePermissionRecord[],
    staffEmploymentPermitRecords: [] as StaffEmploymentPermitRecord[],
    staffImmigrationRequirementProfiles: [] as StaffImmigrationRequirementProfile[],
    staffImmigrationEvents: [] as StaffImmigrationEvent[],
    staffDocumentTypes: DEFAULT_STAFF_DOCUMENT_TYPES,
    staffDocuments: [] as StaffDocument[],
    staffDocumentRequirements: [] as StaffDocumentRequirement[],
    staffDocumentVerificationRecords: [] as StaffDocumentVerificationRecord[],
    staffDocumentEvents: [] as StaffDocumentEvent[],
    trainingCategories: [
      { id: "training-category-safety", code: "safety", name: "Safety", active: true, createdAt: "2026-07-15T00:00:00.000Z", updatedAt: "2026-07-15T00:00:00.000Z" },
      { id: "training-category-mandatory", code: "mandatory", name: "Mandatory", active: true, createdAt: "2026-07-15T00:00:00.000Z", updatedAt: "2026-07-15T00:00:00.000Z" },
      { id: "training-category-governance", code: "governance", name: "Governance", active: true, createdAt: "2026-07-15T00:00:00.000Z", updatedAt: "2026-07-15T00:00:00.000Z" },
      { id: "training-category-clinical", code: "clinical", name: "Clinical", active: true, createdAt: "2026-07-15T00:00:00.000Z", updatedAt: "2026-07-15T00:00:00.000Z" },
      { id: "training-category-other", code: "other", name: "Other", active: true, createdAt: "2026-07-15T00:00:00.000Z", updatedAt: "2026-07-15T00:00:00.000Z" },
    ] as TrainingCategory[],
    trainingCourses: DEFAULT_TRAINING_COURSES,
    trainingRequirements: DEFAULT_TRAINING_COURSES.map((course) => ({
      id: `training-requirement-${course.code.toLowerCase().replaceAll("_", "-")}-all-staff`,
      trainingCourseId: course.id,
      targetType: "all_staff" as const,
      mandatory: course.mandatoryByDefault,
      renewalRule: course.defaultRenewalFrequency ? { frequency: course.defaultRenewalFrequency, renewalDueFrom: "completion_date" as const, warningDays: 30, urgentWarningDays: 7 } : undefined,
      initialDueRule: { dueFrom: "employment_start" as const, offsetDays: 30 },
      effectiveFrom: "2026-07-15",
      active: true,
      createdAt: "2026-07-15T00:00:00.000Z",
      updatedAt: "2026-07-15T00:00:00.000Z",
      createdByUserAccountId: "user-account-system" as any,
      updatedByUserAccountId: "user-account-system" as any,
    })) as TrainingRequirement[],
    staffTrainingAssignments: [] as StaffTrainingAssignment[],
    staffTrainingCompletions: [] as StaffTrainingCompletion[],
    trainingEvents: [] as TrainingEvent[],
    competencyDefinitions: DEFAULT_COMPETENCY_DEFINITIONS,
    competencyRequirements: [] as CompetencyRequirement[],
    staffCompetencyValidations: [] as StaffCompetencyValidation[],
    competencyEvents: [] as CompetencyEvent[],
    wardCompetencyRequirements: [] as WardCompetencyRequirement[],
    wardCompetencyRequirementEvents: [] as WardCompetencyRequirementEvent[],
    staffingEstablishmentVersions: [] as StaffingEstablishmentVersion[],
    staffingEstablishmentLines: [] as StaffingEstablishmentLine[],
    staffingEstablishmentEvents: [] as StaffingEstablishmentEvent[],
    recruitmentAdvertisingSources: DEFAULT_RECRUITMENT_ADVERTISING_SOURCES,
    recruitmentVacancies: [] as RecruitmentVacancy[],
    recruitmentCandidates: [] as RecruitmentCandidate[],
    recruitmentOffers: [] as RecruitmentOffer[],
    recruitmentEvents: [] as RecruitmentEvent[],
    rosterPeriods: [] as RosterPeriod[],
    rosterShiftRequirements: [] as RosterShiftRequirement[],
    plannedShifts: [] as PlannedShift[],
    rosterEvents: [] as RosterEvent[],
    staffLeaveRecords: [] as StaffLeaveRecord[],
    staffLeaveEvents: [] as StaffLeaveEvent[],
    agencyCompanies: [] as AgencyCompany[],
    agencyWorkers: [] as AgencyWorker[],
    agencyRateAgreements: [] as AgencyRateAgreement[],
    agencyShiftAssignments: [] as AgencyShiftAssignment[],
    agencyTimesheets: [] as AgencyTimesheet[],
    agencySpendAlertPolicies: [] as AgencySpendAlertPolicy[],
    agencyEvents: [] as AgencyEvent[],
    staffProbations: [] as StaffProbation[],
    staffProbationReviews: [] as StaffProbationReview[],
    staffProbationExtensions: [] as StaffProbationExtension[],
    probationReviewSchedulePolicies: [] as ProbationReviewSchedulePolicy[],
    probationEvents: [] as ProbationEvent[],
    staffingEstablishmentWtePolicies: [] as StaffingEstablishmentWtePolicy[],
    homeAssignments: [] as HomeAssignment[],
    wardCompetencies: [] as WardCompetency[],
    rosterAssignments: [] as RosterAssignment[],
    permissionGrants: [] as PermissionGrant[],
    roleTemplates: [] as RoleTemplate[],
    auditRecords: [] as AuditRecord[],
    assessmentRequirements: DEFAULT_RISK_ASSESSMENT_REQUIREMENTS,
    eventStore: [] as EventStoreRecord[],
    eventOutbox: [] as EventStoreRecord[],
    eventProcessingReceipts: [] as EventProcessingReceipt[],
    ruleDefinitions: DEFAULT_RULE_DEFINITIONS as RuleDefinition[],
    ruleDecisions: [] as RuleEvaluationResult[],
    ruleProcessingReceipts: [] as RuleProcessingReceipt[],
    ruleGeneratedOutputs: [] as RuleGeneratedOutput[],
    ruleIssues: [] as RuleIssue[],
    ruleIssueEpisodes: [] as RuleIssueEpisode[],
    ruleIssueTransitions: [] as RuleIssueTransition[],
    ruleRecalculationRequests: [] as RuleRecalculationRequest[],
    ruleRecalculationItems: [] as RuleRecalculationItem[],
    ruleOverrides: [] as RuleOverride[],
    ruleSuppressions: [] as RuleSuppression[],
    rltDependencyState: {
      records: [],
      reviews: [],
      audit: [],
      events: [],
    } as RltDependencyState,
    strengthPreferenceState: {
      strengths: [],
      preferences: [],
      reviews: [],
      safetyReviews: [],
      conflicts: [],
      audit: [],
      events: [],
    } as StrengthPreferenceState,
    rltTimelineTagState: { tags: [], audit: [] } as RltTimelineTagState,
    flexibleCareActionState: structuredClone(EMPTY_FLEXIBLE_CARE_ACTION_STATE) as FlexibleCareActionState,
    endOfLifeState: structuredClone(EMPTY_END_OF_LIFE_STATE) as EndOfLifeState,
    residentProfileState: structuredClone(EMPTY_RESIDENT_PROFILE_STATE) as ResidentProfileState,
    residentDocumentState: structuredClone(EMPTY_RESIDENT_DOCUMENT_STATE) as ResidentDocumentState,
    shiftDefinitions: [] as ShiftDefinition[],
    operationalContexts: [] as OperationalContext[],
    users,
    residents,
    assessments,
    interventions,
    notes,
    evaluations,
    alerts,
    alertWorkflow: {} as Record<string, ActionAlertWorkflow>,
    tasks,
    auditLogs: [] as AuditLog[],
    incidents,
    mdtNotes,
    visitors,
    outings,
    handovers,
    maintenanceAssetCategories: seedMaintenanceAssetCategories(),
    maintenanceAssets: seedMaintenanceAssets(),
    maintenanceAssetDocuments: [] as MaintenanceAssetDocument[],
    maintenanceAssetPhotos: [] as MaintenanceAssetPhoto[],
    maintenanceAssetLocationHistory: [] as MaintenanceAssetLocationHistory[],
    maintenanceAssetRelationships: [] as MaintenanceAssetRelationship[],
    maintenanceWorkOrders: seedMaintenanceWorkOrders(),
    maintenanceTemplates: maintenanceTemplateSeed.templates,
    maintenanceTemplateChecklists: maintenanceTemplateSeed.checklist,
    maintenanceTemplateEvidence: maintenanceTemplateSeed.evidence,
    plannedMaintenanceSchedules: seedPlannedMaintenanceSchedules(),
    plannedMaintenanceOccurrences: seedPlannedMaintenanceOccurrences(),
    safetyCategories: safetyComplianceSeed.categories,
    safetyInspectionTemplates: safetyComplianceSeed.templates,
    safetyInspectionTemplateItems: safetyComplianceSeed.items,
    safetyInspectionTemplateEvidenceRequirements: safetyComplianceSeed.evidenceRequirements,
    safetyInspectionSchedules: safetyComplianceSeed.schedules,
    safetyInspectionOccurrences: safetyComplianceSeed.occurrences,
    safetyInspections: safetyComplianceSeed.inspections,
    safetyInspectionResponses: safetyComplianceSeed.responses,
    safetyInspectionObservations: safetyComplianceSeed.observations,
    safetyInspectionEvidence: safetyComplianceSeed.inspectionEvidence,
    safetyCertificates: safetyComplianceSeed.certificates,
    safetyInspectionVerifications: safetyComplianceSeed.verifications,
    maintenanceCertificateTypes: certificateSeed.types,
    maintenanceCertificates: certificateSeed.certificates,
    maintenanceCertificateVersions: certificateSeed.versions,
    maintenanceCertificateAttachments: certificateSeed.attachments,
    maintenanceCertificateAssetLinks: certificateSeed.assetLinks,
    maintenanceCertificateWorkOrderLinks: certificateSeed.workOrderLinks,
    maintenanceCertificateSafetyInspectionLinks: certificateSeed.safetyInspectionLinks,
    maintenanceCertificateContractorLinks: certificateSeed.contractorLinks,
    maintenanceCertificateRequirements: certificateSeed.requirements,
    maintenanceCertificateTimelineEvents: certificateSeed.timelineEvents,
    maintenanceContractors: [] as MaintenanceContractor[],
    maintenanceContractorHomeAssociations: [] as MaintenanceContractorHomeAssociation[],
    maintenanceContractorNotes: [] as MaintenanceContractorNote[],
    maintenanceContractorContacts: [] as MaintenanceContractorContact[],
    maintenanceContractorServiceAreas: [] as MaintenanceContractorServiceArea[],
    maintenanceContractorTimelineEvents: [] as MaintenanceContractorTimelineEvent[],
    housekeepingTemplates: housekeepingSeed.templates,
    housekeepingTemplateSections: housekeepingSeed.sections,
    housekeepingTemplateItems: housekeepingSeed.items,
    housekeepingSchedules: housekeepingSeed.schedules,
    housekeepingTasks: housekeepingSeed.tasks,
    housekeepingTaskResponses: housekeepingSeed.responses,
    housekeepingEvidence: housekeepingSeed.evidence,
    housekeepingExceptions: housekeepingSeed.exceptions,
    housekeepingCleaningAudits: housekeepingSeed.audits,
    housekeepingCleaningAuditResponses: housekeepingSeed.auditResponses,
    housekeepingQualityInspections: housekeepingSeed.qualityInspections,
    housekeepingQualityInspectionResponses: housekeepingSeed.qualityInspectionResponses,
    housekeepingReinspections: housekeepingSeed.reinspections,
    housekeepingRoomReadiness: housekeepingSeed.roomReadiness,
    housekeepingRoomStatusHistory: housekeepingSeed.roomStatusHistory,
    workOrderNotes: [] as WorkOrderNote[],
    workOrderAttachments: [] as WorkOrderAttachment[],
    workOrderLabourEntries: [] as WorkOrderLabourEntry[],
    workOrderMaterialEntries: [] as WorkOrderMaterialEntry[],
    workOrderCompletions: [] as WorkOrderCompletionRecord[],
    workOrderVerifications: [] as WorkOrderVerificationRecord[],
    interventionLogs: [] as InterventionLog[],
    readReceipts: [] as ReadReceipt[],
    observations,
    weights,
    fluids,
    foods,
    pains,
    sleeps,
    bowels,
    behaviours,
    incidentActions,
    shiftSummaries,
    timelineEvents,
    // unified model
    residentCarePlans: migrated.residentCarePlans,
    carePlanProblems: migrated.carePlanProblems,
    problemGoals: migrated.problemGoals,
    problemInterventions: migrated.problemInterventions,
    problemInterventionLogs: migrated.problemInterventionLogs,
    problemEvaluations: migrated.problemEvaluations,
    problemReviews: migrated.problemReviews,
    problemHistory: migrated.problemHistory,
    assessmentSuggestions,
    assessmentTriggerEvents: [] as AssessmentReviewTriggerEvent[],
    vitals,
    observationPlans,
    clinicalAlerts,
    clinicalObservations: [] as ClinicalObservation[],
    observationSchedules: [] as ObservationSchedule[],
    residentBaselines: [] as ResidentClinicalBaseline[],
    residentBaselineEvents: [] as ResidentBaselineEvent[],
    dailyCareRecords: [] as DailyCareRecord[],
    dailyCareEvents: [] as DailyCareDomainEvent[],
    dailyCareAuditRecords: [] as AuditRecord[],
    dailyCareTrendPolicies: [] as DailyCareTrendPolicy[],
    dailyCareTrendEvaluations: [] as DailyCareTrendEvaluationResult[],
    deteriorationIssues: [] as DeteriorationIssue[],
    deteriorationIssueEvents: [] as DeteriorationIssueEvent[],
    hcaNurseEscalations: [] as HcaNurseEscalation[],
    hcaEscalationEvents: [] as HcaEscalationEvent[],
    hcaEscalationAuditRecords: [] as AuditRecord[],
  };
}

type Store = ReturnType<typeof seedData>;

type ScopedItem = { id?: string; facilityId?: string; nursingHomeId?: string; residentId?: string; carePlanId?: string; problemId?: string };
type ScopedArrayKey = {
  [K in keyof Store]: Store[K] extends ScopedItem[] ? K : never;
}[keyof Store];

const FACILITY_SCOPED_ARRAY_KEYS: ScopedArrayKey[] = [
  "residents",
  "assessments",
  "interventions",
  "notes",
  "evaluations",
  "alerts",
  "tasks",
  "auditLogs",
  "incidents",
  "mdtNotes",
  "visitors",
  "outings",
  "handovers",
  "maintenanceAssetCategories",
  "maintenanceAssets",
  "maintenanceAssetDocuments",
  "maintenanceAssetPhotos",
  "maintenanceAssetLocationHistory",
  "maintenanceAssetRelationships",
  "maintenanceWorkOrders",
  "maintenanceTemplates",
  "plannedMaintenanceSchedules",
  "plannedMaintenanceOccurrences",
  "safetyInspectionTemplates",
  "safetyInspectionSchedules",
  "safetyInspectionOccurrences",
  "safetyInspections",
  "safetyInspectionEvidence",
  "safetyCertificates",
  "maintenanceCertificates",
  "maintenanceCertificateVersions",
  "maintenanceCertificateAttachments",
  "maintenanceCertificateAssetLinks",
  "maintenanceCertificateWorkOrderLinks",
  "maintenanceCertificateSafetyInspectionLinks",
  "maintenanceCertificateContractorLinks",
  "maintenanceCertificateRequirements",
  "maintenanceCertificateTimelineEvents",
  "maintenanceContractorHomeAssociations",
  "maintenanceContractorNotes",
  "maintenanceContractorContacts",
  "maintenanceContractorServiceAreas",
  "maintenanceContractorTimelineEvents",
  "housekeepingTemplates",
  "housekeepingSchedules",
  "housekeepingTasks",
  "housekeepingEvidence",
  "housekeepingExceptions",
  "housekeepingCleaningAudits",
  "housekeepingQualityInspections",
  "housekeepingReinspections",
  "housekeepingRoomReadiness",
  "housekeepingRoomStatusHistory",
  "workOrderNotes",
  "workOrderAttachments",
  "workOrderLabourEntries",
  "workOrderMaterialEntries",
  "workOrderCompletions",
  "workOrderVerifications",
  "interventionLogs",
  "readReceipts",
  "observations",
  "weights",
  "fluids",
  "foods",
  "pains",
  "sleeps",
  "bowels",
  "behaviours",
  "incidentActions",
  "shiftSummaries",
  "timelineEvents",
  "residentCarePlans",
  "carePlanProblems",
  "problemGoals",
  "problemInterventions",
  "problemInterventionLogs",
  "problemEvaluations",
  "problemReviews",
  "problemHistory",
  "assessmentSuggestions",
  "assessmentTriggerEvents",
  "vitals",
  "observationPlans",
  "clinicalAlerts",
  "clinicalObservations",
  "observationSchedules",
  "residentBaselines",
  "residentBaselineEvents",
  "dailyCareRecords",
  "dailyCareEvents",
  "dailyCareAuditRecords",
  "dailyCareTrendPolicies",
  "dailyCareTrendEvaluations",
  "deteriorationIssues",
  "deteriorationIssueEvents",
  "hcaNurseEscalations",
  "hcaEscalationEvents",
  "hcaEscalationAuditRecords",
];

const hasFacility = (item: { facilityId?: string; nursingHomeId?: string }, facilityId: string) =>
  (item.nursingHomeId || item.facilityId || BALLYMORE_FACILITY_ID) === facilityId;

const DEMO_MULTI_FACILITY_USER_IDS = new Set(["u-3", "u-7", "u-group-owner"]);
const DEMO_MULTI_FACILITY_IDS = [BALLYMORE_FACILITY_ID, HAZELWOOD_FACILITY_ID];

const userFacilityIds = (user: UserProfile) =>
  user.facilityIds?.length ? user.facilityIds : [user.facilityId || BALLYMORE_FACILITY_ID];

function normalizeFacilities(store: Store, defaultFacilityId = BALLYMORE_FACILITY_ID): Store {
  const users = store.users.map((user) => {
    if (user.id === "u-group-owner") {
      return {
        ...user,
        facilityId: BALLYMORE_FACILITY_ID,
        facilityIds: DEMO_MULTI_FACILITY_IDS,
        role: "group_owner" as Role,
      };
    }
    if (user.id === "u-hazelwood-don") {
      return {
        ...user,
        facilityId: HAZELWOOD_FACILITY_ID,
        facilityIds: [HAZELWOOD_FACILITY_ID],
      };
    }
    if (DEMO_MULTI_FACILITY_USER_IDS.has(user.id)) {
      return {
        ...user,
        facilityId: BALLYMORE_FACILITY_ID,
        facilityIds: DEMO_MULTI_FACILITY_IDS,
      };
    }
    const ids = user.facilityIds?.length ? user.facilityIds : [user.facilityId || defaultFacilityId];
    return { ...user, facilityId: ids[0], facilityIds: ids };
  });
  const hasHazelwoodDon = users.some((user) => user.id === "u-hazelwood-don");
  const hasGroupOwner = users.some((user) => user.id === "u-group-owner");
  const normalizedUsers = hasGroupOwner
    ? users
    : [
        {
          id: "u-group-owner",
          facilityId: BALLYMORE_FACILITY_ID,
          facilityIds: DEMO_MULTI_FACILITY_IDS,
          name: "Brian O'Donnell",
          role: "group_owner" as Role,
          email: "brian.odonnell@oritas.example",
          phone: "07700 900401",
          department: "Group Executive",
          assignedWings: [],
          employeeNumber: "GRP-0001",
          startDate: "2012-05-20",
          lastLogin: new Date().toISOString(),
          status: "active" as const,
          avatarSeed: "BrianODonnell",
          notificationPrefs: { email: true, sms: true, inApp: true, criticalAlertsOnly: false },
        },
        ...users,
      ];
  let normalized: Store = {
    ...store,
    enterprises: store.enterprises?.length ? store.enterprises : ENTERPRISES_SEED,
    facilities: FACILITIES_SEED,
    assessmentRequirements: mergeDefaultRiskAssessmentRequirements((store as Store & { assessmentRequirements?: AssessmentRequirementRecord[] }).assessmentRequirements),
    users: hasHazelwoodDon
      ? normalizedUsers
      : [
          ...normalizedUsers,
          {
            ...seedUsers().find((user) => user.id === "u-hazelwood-don")!,
            facilityId: HAZELWOOD_FACILITY_ID,
            facilityIds: [HAZELWOOD_FACILITY_ID],
          },
    ],
  };

  for (const key of FACILITY_SCOPED_ARRAY_KEYS) {
    const records = normalized[key] as ScopedItem[];
    (normalized as any)[key] = records.map((record) => ({
      ...record,
      facilityId: record.facilityId || defaultFacilityId,
    }));
  }

  normalized.alertWorkflow = Object.fromEntries(
    Object.entries(normalized.alertWorkflow || {}).map(([id, alert]) => [
      id,
      { ...alert, facilityId: alert.facilityId || defaultFacilityId },
    ]),
  );

  normalized = migrateEntityHierarchy(normalized, defaultFacilityId).store;
  normalized = migrateResidentLifecycle(normalized);
  normalized = migrateStaffAccess(normalized);
  normalized = migrateOperationalContext(normalized);
  normalized.auditRecords = migrateLegacyAuditRecords(normalized);

  return normalized;
}

function scopeNewRecords(previous: Store, next: Store, activeFacilityId: string): Store {
  let scoped = { ...next };
  scoped.assessmentRequirements = mergeDefaultRiskAssessmentRequirements((scoped as Store & { assessmentRequirements?: AssessmentRequirementRecord[] }).assessmentRequirements);
  for (const key of FACILITY_SCOPED_ARRAY_KEYS) {
    const previousIds = new Set((previous[key] as ScopedItem[]).map((record) => record.id));
    const records = scoped[key] as ScopedItem[];
    (scoped as any)[key] = records.map((record) => ({
      ...record,
      facilityId: record.facilityId || (record.id && previousIds.has(record.id) ? BALLYMORE_FACILITY_ID : activeFacilityId),
    }));
  }
  scoped.alertWorkflow = Object.fromEntries(
    Object.entries(scoped.alertWorkflow || {}).map(([id, alert]) => {
      const existing = previous.alertWorkflow?.[id];
      return [
        id,
        {
          ...alert,
          facilityId: alert.facilityId || existing?.facilityId || activeFacilityId,
        },
      ];
    }),
  );
  scoped = migrateEntityHierarchy(scoped, activeFacilityId).store;
  scoped = migrateResidentLifecycle(scoped);
  scoped = migrateStaffAccess(scoped);
  scoped = migrateOperationalContext(scoped);
  scoped.auditRecords = migrateLegacyAuditRecords(scoped);
  return scoped;
}

function filterByFacility(store: Store, activeFacilityId: string): Store {
  const residentIds = new Set(
    store.residents
      .filter((resident) => hasFacility(resident, activeFacilityId) && resident.status !== "deleted")
      .map((resident) => resident.id),
  );
  const problemIds = new Set(
    store.carePlanProblems
      .filter((problem) => hasFacility(problem, activeFacilityId) && residentIds.has(problem.residentId))
      .map((problem) => problem.id),
  );
  const scoped: Store = {
    ...store,
    wards: store.wards.filter((ward) => ward.nursingHomeId === activeFacilityId),
    rooms: store.rooms.filter((room) => (room.facilityId || room.nursingHomeId || BALLYMORE_FACILITY_ID) === activeFacilityId),
    beds: store.beds.filter((bed) => {
      const room = store.rooms.find((candidate) => candidate.id === bed.roomId);
      return (room?.facilityId || room?.nursingHomeId || BALLYMORE_FACILITY_ID) === activeFacilityId;
    }),
    bedAssignments: store.bedAssignments.filter((assignment) => assignment.nursingHomeId === activeFacilityId),
    admissions: store.admissions.filter((admission) => admission.nursingHomeId === activeFacilityId),
    absenceEpisodes: store.absenceEpisodes.filter((absence) => absence.nursingHomeId === activeFacilityId),
    users: store.users.filter((user) => userFacilityIds(user).includes(activeFacilityId)),
    residents: store.residents.filter((record) => hasFacility(record, activeFacilityId) && record.status !== "deleted"),
    rltDependencyState: {
      records: store.rltDependencyState.records.filter(
        (record) =>
          record.nursingHomeId === activeFacilityId && residentIds.has(record.residentId),
      ),
      reviews: store.rltDependencyState.reviews.filter(
        (review) =>
          review.nursingHomeId === activeFacilityId && residentIds.has(review.residentId),
      ),
      audit: store.rltDependencyState.audit.filter(
        (entry) =>
          entry.nursingHomeId === activeFacilityId && residentIds.has(entry.residentId),
      ),
      events: store.rltDependencyState.events.filter(
        (event) =>
          event.nursingHomeId === activeFacilityId && residentIds.has(event.residentId),
      ),
    },
    strengthPreferenceState: {
      strengths: store.strengthPreferenceState.strengths.filter(
        (record) => record.nursingHomeId === activeFacilityId && residentIds.has(record.residentId),
      ),
      preferences: store.strengthPreferenceState.preferences.filter(
        (record) => record.nursingHomeId === activeFacilityId && residentIds.has(record.residentId),
      ),
      reviews: store.strengthPreferenceState.reviews.filter((review) => {
        const record = review.recordType === "strength"
          ? store.strengthPreferenceState.strengths.find((item) => item.id === review.recordId)
          : store.strengthPreferenceState.preferences.find((item) => item.id === review.recordId);
        return Boolean(record && record.nursingHomeId === activeFacilityId && residentIds.has(record.residentId));
      }),
      safetyReviews: store.strengthPreferenceState.safetyReviews.filter(
        (review) => review.nursingHomeId === activeFacilityId && residentIds.has(review.residentId),
      ),
      conflicts: store.strengthPreferenceState.conflicts.filter(
        (conflict) => conflict.nursingHomeId === activeFacilityId && residentIds.has(conflict.residentId),
      ),
      audit: store.strengthPreferenceState.audit.filter(
        (entry) => entry.nursingHomeId === activeFacilityId && residentIds.has(entry.residentId),
      ),
      events: store.strengthPreferenceState.events.filter(
        (event) => event.nursingHomeId === activeFacilityId && residentIds.has(event.residentId),
      ),
    },
    rltTimelineTagState: {
      tags: store.rltTimelineTagState.tags.filter(
        (tag) => tag.nursingHomeId === activeFacilityId && residentIds.has(tag.residentId),
      ),
      audit: store.rltTimelineTagState.audit.filter(
        (entry) => entry.nursingHomeId === activeFacilityId && residentIds.has(entry.residentId),
      ),
    },
    flexibleCareActionState: {
      occurrences: store.flexibleCareActionState.occurrences.filter((item) => item.nursingHomeId === activeFacilityId && residentIds.has(item.residentId)),
      workItems: store.flexibleCareActionState.workItems.filter((item) => item.nursingHomeId === activeFacilityId && (!item.residentId || residentIds.has(item.residentId))),
      audit: store.flexibleCareActionState.audit.filter((item) => item.nursingHomeId === activeFacilityId && residentIds.has(item.residentId)),
      events: store.flexibleCareActionState.events.filter((item) => item.nursingHomeId === activeFacilityId && residentIds.has(item.residentId)),
    },
    endOfLifeState: (() => {
      const pathways = store.endOfLifeState.pathways.filter((item) => item.nursingHomeId === activeFacilityId && residentIds.has(item.residentId));
      const pathwayIds = new Set(pathways.map((item) => item.id));
      return {
        pathways,
        transitions: store.endOfLifeState.transitions.filter((item) => pathwayIds.has(item.pathwayId)),
        wishes: store.endOfLifeState.wishes.filter((item) => pathwayIds.has(item.pathwayId)),
        advanceDecisions: store.endOfLifeState.advanceDecisions.filter((item) => residentIds.has(item.residentId)),
        comfortPlans: store.endOfLifeState.comfortPlans.filter((item) => pathwayIds.has(item.pathwayId)),
        symptomObservations: store.endOfLifeState.symptomObservations.filter((item) => pathwayIds.has(item.pathwayId)),
        familySupportPlans: store.endOfLifeState.familySupportPlans.filter((item) => pathwayIds.has(item.pathwayId)),
        spiritualSupportPlans: store.endOfLifeState.spiritualSupportPlans.filter((item) => pathwayIds.has(item.pathwayId)),
        clinicalSupports: store.endOfLifeState.clinicalSupports.filter((item) => pathwayIds.has(item.pathwayId)),
        afterDeathWishes: store.endOfLifeState.afterDeathWishes.filter((item) => residentIds.has(item.residentId)),
        deathConfirmations: store.endOfLifeState.deathConfirmations.filter((item) => pathwayIds.has(item.pathwayId)),
        audit: store.endOfLifeState.audit.filter((item) => item.nursingHomeId === activeFacilityId && residentIds.has(item.residentId)),
        events: store.endOfLifeState.events.filter((item) => item.nursingHomeId === activeFacilityId && residentIds.has(item.residentId)),
      };
    })(),
    residentProfileState: {
      relationships: store.residentProfileState.relationships.filter((item) => item.nursingHomeId === activeFacilityId && residentIds.has(item.residentId)),
      audit: store.residentProfileState.audit.filter((item) => item.nursingHomeId === activeFacilityId && residentIds.has(item.residentId)),
      events: store.residentProfileState.events.filter((item) => item.nursingHomeId === activeFacilityId && residentIds.has(item.residentId)),
    },
    residentDocumentState: {
      documents: store.residentDocumentState.documents.filter((item) => item.nursingHomeId === activeFacilityId && residentIds.has(item.residentId)),
      versions: store.residentDocumentState.versions.filter((item) => store.residentDocumentState.documents.some((document) => document.id === item.documentId && document.nursingHomeId === activeFacilityId && residentIds.has(document.residentId))),
      audit: store.residentDocumentState.audit.filter((item) => item.nursingHomeId === activeFacilityId && residentIds.has(item.residentId)),
      events: store.residentDocumentState.events.filter((item) => item.nursingHomeId === activeFacilityId && residentIds.has(item.residentId)),
    },
    alertWorkflow: Object.fromEntries(
      Object.entries(store.alertWorkflow || {}).filter(
        ([, alert]) => hasFacility(alert, activeFacilityId) && residentIds.has(alert.residentId),
      ),
    ),
  };

  for (const key of FACILITY_SCOPED_ARRAY_KEYS) {
    if (key === "residents") continue;
    const records = scoped[key] as ScopedItem[];
    (scoped as any)[key] = records.filter((record) => {
      if (!hasFacility(record, activeFacilityId)) return false;
      if (record.residentId && !residentIds.has(record.residentId)) return false;
      if (record.problemId && !problemIds.has(record.problemId)) return false;
      return true;
    });
  }

  return scoped;
}

function loadInitialStore(): Store {
  const base = seedData();
  if (typeof window === "undefined") {
    const normalizedBase = normalizeFacilities(base);
    syncUidSequence(normalizedBase);
    return normalizedBase;
  }

  try {
    const raw =
      window.localStorage.getItem(STORE_STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_STORE_STORAGE_KEY);
    if (!raw) {
      const normalizedBase = normalizeFacilities(base);
      syncUidSequence(normalizedBase);
      return normalizedBase;
    }

    const parsed = JSON.parse(raw) as Partial<Store>;
    delete (parsed as any).carePlans;
    delete (parsed as any).carePlanEvaluations;
    delete (parsed as any).carePlanReviews;
    delete (parsed as any).carePlanTemplates;
    delete (parsed as any).legacyCarePlanIdToProblemId;
    parsed.notes = parsed.notes?.map((note) => {
      const { linkedCarePlanId: _removed, ...rest } = note as DailyNote & { linkedCarePlanId?: string };
      return rest;
    });
    clearPersistedTrainingCoursesOnce(parsed);
    sanitizePersistedResidentProfilePhotos(parsed);
    const hasLegacyGeneratedVitals = parsed.vitals?.some((vital) => /^v-R-\d{4}-\d+$/.test(vital.id));
    if (hasLegacyGeneratedVitals) {
      const retainedVitals = (parsed.vitals || []).filter(
        (vital) => !/^v-R-\d{4}-\d+$/.test(vital.id) && !vital.id.startsWith("demo-vital-"),
      );
      const retainedAlerts = (parsed.clinicalAlerts || []).filter(
        (alert) => !/^ca-R-\d{4}-\d+$/.test(alert.id),
      );
      parsed.vitals = [...base.vitals, ...retainedVitals];
      parsed.clinicalAlerts = [...base.clinicalAlerts, ...retainedAlerts];
    }
    const merged = normalizeFacilities({ ...base, ...parsed } as Store);
    merged.tasks = removeRemovedDemoTasks(merged.tasks);
    merged.vitals = merged.vitals.map(vitalWithCalculatedNEWS2);
    merged.clinicalObservations = merged.clinicalObservations.map((observation) => ({
      ...observation,
      data: observationDataWithNEWS2(observation.kind, observation.data),
    }));
    syncUidSequence(merged);
    return merged;
  } catch (error) {
    console.warn("Failed to load persisted care store, using seeded data.", error);
    const normalizedBase = normalizeFacilities(base);
    syncUidSequence(normalizedBase);
    return normalizedBase;
  }
}

// ============ Global Filter ============
export interface CareFilter {
  wingId?: string;
  unitId?: string;
  roomId?: string;
  residentId?: string;
  status?: string;
}

interface CareCtx extends Store {
  activeFacilityId: string;
  activeFacility: Facility;
  setActiveFacilityId: (id: string) => void;
  currentRole: Role;
  setCurrentRole: (r: Role) => void;
  resetToDemoData: () => void;
  currentUserName: string;
  currentUser: UserProfile;
  setCurrentUserId: (id: string) => void;
  saveRltDependency: (input: RecordRltDependencyInput) => void;
  saveResidentStrength: (input: CreateStrengthInput) => void;
  saveResidentPreference: (input: CreatePreferenceInput) => void;
  createResidentEndOfLifePathway: (residentId: string, reasonText: string) => void;
  activateResidentEndOfLifeCare: (pathwayId: string, clinicalBasis: string) => void;
  markResidentLastDaysOfLife: (pathwayId: string, clinicalBasis: string) => void;
  recordResidentDeathInPathway: (pathwayId: string, observedBy: string) => void;
  updateUser: (id: string, patch: Partial<UserProfile>) => void;
  createStaffUser: (input: {
    staffMemberId?: string;
    name: string;
    role: Role;
    email: string;
    temporaryPassword?: string;
    status: UserProfile["status"];
    accountStatus?: UserAccount["accountStatus"];
  }) => UserProfile;
  createStaffMember: (input: SaveStaffMemberInput) => StaffMember;
  updateStaffMember: (id: string, input: Partial<SaveStaffMemberInput>) => void;
  changeStaffMemberStatus: (id: string, status: StaffMemberStatus, reason?: string) => void;
  updateStaffPhoto: (id: string, photoUrl?: string) => void;
  linkStaffUserAccount: (staffMemberId: string, userAccountId: string) => void;
  unlinkStaffUserAccount: (staffMemberId: string) => void;
  addStaffEmergencyContact: (staffMemberId: string, input: Omit<StaffEmergencyContact, "id" | "staffMemberId" | "createdAt" | "updatedAt">) => StaffEmergencyContact;
  updateStaffEmergencyContact: (staffMemberId: string, contactId: string, patch: Partial<StaffEmergencyContact>) => void;
  setPrimaryStaffEmergencyContact: (staffMemberId: string, contactId: string) => void;
  inactivateStaffEmergencyContact: (staffMemberId: string, contactId: string) => void;
  createEmploymentRecord: (input: CreateEmploymentRecordCommand) => EmploymentRecord;
  updateEmploymentRecord: (id: string, input: Partial<CreateEmploymentRecordCommand>) => void;
  createProfessionalRegistration: (input: CreateProfessionalRegistrationCommand) => ProfessionalRegistration;
  updateProfessionalRegistration: (id: string, input: Partial<CreateProfessionalRegistrationCommand>) => void;
  submitProfessionalRegistrationVerification: (id: string) => void;
  verifyProfessionalRegistration: (id: string, notes?: string) => void;
  failProfessionalRegistrationVerification: (id: string, notes?: string) => void;
  createStaffDocument: (input: CreateStaffDocumentCommand) => StaffDocument;
  updateStaffDocument: (id: string, input: Partial<CreateStaffDocumentCommand>) => void;
  verifyStaffDocument: (id: string, notes?: string) => void;
  failStaffDocumentVerification: (id: string, notes?: string) => void;
  createStaffVisaRecord: (input: CreateStaffVisaRecordCommand) => StaffVisaRecord;
  createResidencePermissionRecord: (input: CreateResidencePermissionRecordCommand) => StaffResidencePermissionRecord;
  createEmploymentPermitRecord: (input: CreateEmploymentPermitRecordCommand) => StaffEmploymentPermitRecord;
  verifyStaffVisaRecord: (id: string, notes?: string) => void;
  verifyResidencePermissionRecord: (id: string, notes?: string) => void;
  verifyEmploymentPermitRecord: (id: string, notes?: string) => void;
  createTrainingCategory: (input: { name: string; description?: string }) => TrainingCategory;
  updateTrainingCategory: (id: string, input: Partial<Pick<TrainingCategory, "name" | "description" | "active">>) => void;
  createTrainingCourse: (input: Partial<TrainingCourse> & { title: string; category: TrainingCourse["category"]; mandatoryByDefault?: boolean }) => TrainingCourse;
  updateTrainingCourse: (id: string, input: Partial<TrainingCourse>) => void;
  duplicateTrainingCourse: (id: string) => TrainingCourse;
  deleteTrainingCourse: (id: string) => void;
  updateTrainingAssignment: (id: string, input: Partial<StaffTrainingAssignment>, reason?: string) => void;
  startTrainingAssignment: (id: string) => void;
  cancelTrainingAssignment: (id: string, reason: string) => void;
  enterTrainingAssignmentInError: (id: string, reason: string) => void;
  assignTrainingToStaff: (input: AssignTrainingCommand) => StaffTrainingAssignment;
  assignTrainingToMany: (input: AssignTrainingCommand & { staffMemberIds: string[]; mandatory?: boolean }) => StaffTrainingAssignment[];
  recordTrainingCompletion: (input: RecordTrainingCompletionCommand) => StaffTrainingCompletion;
  verifyTrainingCompletion: (id: string) => void;
  recordCompetencyValidation: (input: RecordCompetencyValidationCommand) => StaffCompetencyValidation;
  createStaffHomeAssignment: (input: CreateStaffHomeAssignmentCommand) => EmploymentHomeAssignment;
  endStaffHomeAssignment: (id: string, endDate?: string) => void;
  createStaffingEstablishmentDraft: (input: CreateStaffingEstablishmentDraftCommand) => StaffingEstablishmentVersion;
  addStaffingEstablishmentLine: (input: AddStaffingEstablishmentLineCommand) => StaffingEstablishmentLine;
  approveStaffingEstablishment: (id: string) => void;
  createRecruitmentVacancy: (input: CreateRecruitmentVacancyCommand) => RecruitmentVacancy;
  updateRecruitmentVacancyStatus: (id: string, status: RecruitmentVacancy["status"]) => void;
  addRecruitmentCandidate: (input: AddRecruitmentCandidateCommand) => RecruitmentCandidate;
  createRecruitmentOffer: (input: CreateRecruitmentOfferCommand) => RecruitmentOffer;
  updateRecruitmentOfferStatus: (id: string, status: RecruitmentOffer["status"]) => void;
  createRosterPeriod: (input: CreateRosterPeriodCommand) => RosterPeriod;
  addRosterShiftRequirement: (input: AddRosterShiftRequirementCommand) => RosterShiftRequirement;
  assignPlannedShift: (input: AssignPlannedShiftCommand) => PlannedShift;
  createStaffLeaveRecord: (input: CreateStaffLeaveRecordCommand) => StaffLeaveRecord;
  approveStaffLeaveRecord: (id: string) => void;
  createAgencyCompany: (input: CreateAgencyCompanyCommand) => AgencyCompany;
  createAgencyWorker: (input: CreateAgencyWorkerCommand) => AgencyWorker;
  assignAgencyWorkerToShift: (input: AssignAgencyWorkerToShiftCommand) => AgencyShiftAssignment;
  recordAgencyTimesheet: (input: RecordAgencyTimesheetCommand) => AgencyTimesheet;
  approveAgencyTimesheet: (id: string) => void;
  createStaffProbation: (input: CreateStaffProbationCommand) => StaffProbation;
  completeProbationReview: (id: string, outcome: StaffProbationReview["outcome"]) => void;
  extendStaffProbation: (id: string, newExpectedEndDate: string, reason: string) => void;
  completeStaffProbation: (id: string, status: Extract<StaffProbation["status"], "completed" | "failed" | "cancelled">) => void;
  // filter
  filter: CareFilter;
  setFilter: (f: CareFilter) => void;
  filteredResidentIds: string[];
  // residents
  addResident: (r: Omit<Resident, "id" | "photoSeed">) => Resident;
  updateResident: (id: string, patch: Partial<Resident>) => void;
  updateResidentProfile: (id: string, input: UpdateResidentProfileInput) => void;
  softDeleteResident: (id: string, reason?: string) => number;
  addNextOfKin: (residentId: string, nok: Omit<NextOfKin, "id">) => void;
  updateNextOfKin: (residentId: string, id: string, patch: Partial<NextOfKin>) => void;
  removeNextOfKin: (residentId: string, id: string) => void;
  uploadResidentDocument: (residentId: string, metadata: UploadDocumentMetadata, file: File) => Promise<void>;
  uploadResidentDocumentVersion: (documentId: string, file: File, reason: ResidentDocumentVersion["changeReasonCode"], reasonText?: string) => Promise<void>;
  changeResidentDocumentStatus: (documentId: string, status: ResidentDocumentStatus) => void;
  // assessments
  addAssessment: (a: Omit<Assessment, "id">) => Assessment;
  updateAssessment: (id: string, patch: Partial<Assessment>) => void;
  completeAssessment: (id: string) => void;
  createAssessmentRevision: (id: string, reason: string) => Assessment | undefined;
  assignAssessment: (
    id: string,
    input: { userId: string; userName: string; role: Role; dueDate: string },
  ) => void;
  archiveAssessment: (id: string, reason: string) => void;
  restoreAssessment: (id: string) => void;
  softDeleteAssessment: (id: string, reason: string) => void;
  addAssessmentComment: (id: string, body: string) => void;
  fireReviewTrigger: (input: {
    residentId: string;
    trigger: ReviewTriggerType;
    sourceModule: AssessmentReviewTriggerEvent["sourceModule"];
    sourceRecordId?: string;
    note?: string;
  }) => void;
  // intervention logs
  addInterventionLog: (l: Omit<InterventionLog, "id">) => InterventionLog;
  // read receipts
  recordReadReceipt: (entityType: ReadReceipt["entityType"], entityId: string) => void;
  // misc
  addIntervention: (i: Omit<Intervention, "id">) => Intervention;
  addNote: (n: Omit<DailyNote, "id">) => DailyNote;
  updateNote: (id: string, patch: Partial<Omit<DailyNote, "id">>) => void;
  addEvaluation: (e: Omit<Evaluation, "id">) => Evaluation;
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  acknowledgeActionAlert: (
    input: Omit<ActionAlertWorkflow, "acknowledgedBy" | "acknowledgedAt">,
  ) => void;
  addAlert: (a: Omit<Alert, "id" | "createdAt" | "acknowledged">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  softDeleteTask: (id: string, reason?: string) => void;
  addTask: (t: Omit<Task, "id">) => Task;
  addIncident: (i: Omit<Incident, "id">) => Incident;
  updateIncident: (id: string, patch: Partial<Incident>) => void;
  archiveIncident: (id: string) => void;
  restoreIncident: (id: string) => void;
  softDeleteIncident: (id: string, reason: string) => void;
  duplicateIncident: (id: string) => Incident | undefined;
  closeIncident: (id: string) => void;
  reopenIncident: (id: string) => void;
  submitIncident: (id: string) => void;

  addMDTNote: (m: Omit<MDTNote, "id">) => MDTNote;
  updateMDTNote: (id: string, patch: Partial<MDTNote>) => void;

  addVisitor: (v: Omit<Visitor, "id">) => Visitor;
  updateVisitor: (id: string, patch: Partial<Visitor>) => void;
  archiveVisitor: (id: string) => void;
  restoreVisitor: (id: string) => void;
  softDeleteVisitor: (id: string, reason: string) => void;
  cancelVisitor: (id: string, reason: string) => void;
  completeVisitor: (id: string) => void;

  addOuting: (o: Omit<Outing, "id">) => Outing;
  updateOuting: (id: string, patch: Partial<Outing>) => void;
  archiveOuting: (id: string) => void;
  restoreOuting: (id: string) => void;
  softDeleteOuting: (id: string, reason: string) => void;
  recordOutingDeparture: (id: string, time: string) => void;
  recordOutingReturn: (id: string, time: string, outcome?: string) => void;
  cancelOuting: (id: string, reason: string) => void;
  closeOuting: (id: string) => void;

  addHandover: (h: Omit<HandoverNote, "id">) => HandoverNote;
  updateHandover: (id: string, patch: Partial<HandoverNote>) => void;
  archiveHandover: (id: string) => void;
  restoreHandover: (id: string) => void;
  softDeleteHandover: (id: string, reason: string) => void;
  markHandoverRead: (id: string) => void;
  acknowledgeHandover: (id: string) => void;
  completeHandover: (id: string) => void;
  closeHandover: (id: string) => void;
  duplicateHandover: (id: string) => HandoverNote | undefined;
  createMaintenanceAssetCategory: (input: Partial<MaintenanceAssetCategory> & { name: string }) => MaintenanceAssetCategory;
  updateMaintenanceAssetCategory: (id: string, input: Partial<MaintenanceAssetCategory>) => void;
  archiveMaintenanceAssetCategory: (id: string, reason: string) => void;
  restoreMaintenanceAssetCategory: (id: string) => void;
  createMaintenanceAsset: (input: Partial<MaintenanceAsset> & { assetName: string; categoryId: string }) => MaintenanceAsset;
  updateMaintenanceAsset: (id: string, input: Partial<MaintenanceAsset>, reason?: string) => void;
  archiveMaintenanceAsset: (id: string, reason: string) => void;
  restoreMaintenanceAsset: (id: string) => void;
  activateMaintenanceAsset: (id: string) => void;
  deactivateMaintenanceAsset: (id: string, reason?: string) => void;
  duplicateMaintenanceAsset: (id: string) => MaintenanceAsset | undefined;
  addMaintenanceAssetDocument: (assetId: string, input: { documentType: MaintenanceAssetDocumentType; fileName: string; storageReference?: string }) => MaintenanceAssetDocument;
  replaceMaintenanceAssetDocument: (documentId: string, input: { fileName: string; storageReference?: string }) => MaintenanceAssetDocument;
  deleteMaintenanceAssetDocument: (documentId: string, reason: string) => void;
  addMaintenanceAssetPhoto: (assetId: string, input: { fileReference: string; caption?: string; primary?: boolean }) => MaintenanceAssetPhoto;
  updateMaintenanceAssetPhoto: (photoId: string, input: Partial<MaintenanceAssetPhoto>) => void;
  deleteMaintenanceAssetPhoto: (photoId: string, reason: string) => void;
  reorderMaintenanceAssetPhotos: (assetId: string, photoIds: string[]) => void;
  createMaintenanceAssetRelationship: (input: { parentAssetId: string; childAssetId: string; relationshipType: MaintenanceAssetRelationshipType; notes?: string }) => MaintenanceAssetRelationship;
  updateMaintenanceAssetRelationship: (id: string, input: Partial<MaintenanceAssetRelationship>) => void;
  deleteMaintenanceAssetRelationship: (id: string) => void;
  createMaintenanceTemplate: (input: Partial<MaintenanceTemplate> & { checklist?: Partial<MaintenanceTemplateChecklist>[]; evidence?: MaintenanceTemplateEvidenceType[] }) => MaintenanceTemplate;
  updateMaintenanceTemplate: (id: string, input: Partial<MaintenanceTemplate> & { checklist?: Partial<MaintenanceTemplateChecklist>[]; evidence?: MaintenanceTemplateEvidenceType[] }) => void;
  archiveMaintenanceTemplate: (id: string, reason: string) => void;
  deleteMaintenanceTemplate: (id: string) => void;
  duplicateMaintenanceTemplate: (id: string) => MaintenanceTemplate | undefined;
  createPlannedMaintenanceSchedule: (input: Partial<PlannedMaintenanceSchedule>) => PlannedMaintenanceSchedule;
  updatePlannedMaintenanceSchedule: (id: string, input: Partial<PlannedMaintenanceSchedule>) => void;
  pausePlannedMaintenanceSchedule: (id: string, reason: string) => void;
  resumePlannedMaintenanceSchedule: (id: string) => void;
  deletePlannedMaintenanceSchedule: (id: string) => void;
  generatePlannedMaintenanceOccurrences: (scheduleId?: string, until?: string) => PlannedMaintenanceOccurrence[];
  completePlannedMaintenanceOccurrence: (id: string) => void;
  skipPlannedMaintenanceOccurrence: (id: string, reason: string) => void;
  cancelPlannedMaintenanceOccurrence: (id: string, reason: string) => void;
  generatePlannedMaintenanceWorkOrder: (occurrenceId: string) => MaintenanceWorkOrder;
  createSafetyCategory: (input: Partial<SafetyCategory> & { code: SafetyCategoryCode; name: string }) => SafetyCategory;
  updateSafetyCategory: (id: string, input: Partial<SafetyCategory>) => void;
  activateSafetyCategory: (id: string) => void;
  deactivateSafetyCategory: (id: string) => void;
  createSafetyTemplate: (input: Partial<SafetyInspectionTemplate> & { name: string; categoryId: string; checklist?: Partial<SafetyInspectionTemplateItem>[]; evidence?: Partial<SafetyInspectionTemplateEvidenceRequirement>[] }) => SafetyInspectionTemplate;
  updateSafetyTemplate: (id: string, input: Partial<SafetyInspectionTemplate> & { checklist?: Partial<SafetyInspectionTemplateItem>[]; evidence?: Partial<SafetyInspectionTemplateEvidenceRequirement>[] }) => void;
  duplicateSafetyTemplate: (id: string) => SafetyInspectionTemplate | undefined;
  activateSafetyTemplate: (id: string) => void;
  deactivateSafetyTemplate: (id: string) => void;
  archiveSafetyTemplate: (id: string, reason: string) => void;
  createSafetySchedule: (input: Partial<SafetyInspectionSchedule>) => SafetyInspectionSchedule;
  updateSafetySchedule: (id: string, input: Partial<SafetyInspectionSchedule>) => void;
  pauseSafetySchedule: (id: string, reason: string) => void;
  resumeSafetySchedule: (id: string) => void;
  activateSafetySchedule: (id: string) => void;
  deactivateSafetySchedule: (id: string) => void;
  generateSafetyOccurrence: (scheduleId: string) => SafetyInspectionOccurrence;
  startSafetyInspection: (occurrenceId: string) => SafetyInspection;
  createAdHocSafetyInspection: (input: { templateId: string; assetId?: string; locationId?: string; locationLabel?: string }) => SafetyInspection;
  updateSafetyInspectionResponse: (responseId: string, input: { responseValue?: string; result?: SafetyInspectionResponse["result"]; observation?: string; notApplicableReason?: string }) => void;
  addSafetyObservation: (inspectionId: string, input: Partial<SafetyInspectionObservation> & { description: string; severity: SafetySeverity }) => SafetyInspectionObservation;
  updateSafetyObservation: (id: string, input: Partial<SafetyInspectionObservation>) => void;
  deleteSafetyObservation: (id: string) => void;
  addSafetyEvidence: (inspectionId: string, input: { evidenceType: SafetyEvidenceType; fileName: string; fileReference?: string; responseId?: string; observationId?: string; caption?: string; description?: string }) => SafetyInspectionEvidence;
  deleteSafetyEvidence: (id: string, reason: string) => void;
  completeSafetyInspection: (id: string, input: { summary?: string; immediateActionsTaken?: string; declarationAccepted: boolean }) => SafetyInspection;
  verifySafetyInspection: (id: string, notes?: string) => SafetyInspectionVerification;
  rejectSafetyInspection: (id: string, input: { reasonCode: SafetyVerificationRejectionReason; details: string }) => SafetyInspectionVerification;
  createSafetyCorrectiveWorkOrder: (inspectionId: string, observationId?: string) => MaintenanceWorkOrder;
  createSafetyCertificate: (input: Partial<SafetyCertificate> & { categoryId: string; certificateType: string; certificateNumber: string; issuedBy: string; issuedDate: string; validFrom: string; expiryDate: string }) => SafetyCertificate;
  updateSafetyCertificate: (id: string, input: Partial<SafetyCertificate>) => void;
  revokeSafetyCertificate: (id: string, reason: string) => void;
  supersedeSafetyCertificate: (id: string, replacementId?: string) => void;
  createMaintenanceCertificateType: (input: Partial<MaintenanceCertificateType> & { code: string; name: string; category: MaintenanceCertificateTypeCategory }) => MaintenanceCertificateType;
  updateMaintenanceCertificateType: (id: string, input: Partial<MaintenanceCertificateType>) => void;
  activateMaintenanceCertificateType: (id: string) => void;
  deactivateMaintenanceCertificateType: (id: string) => void;
  archiveMaintenanceCertificateType: (id: string, reason: string) => void;
  createMaintenanceCertificate: (input: Partial<MaintenanceCertificate> & Partial<MaintenanceCertificateVersion> & { certificateTypeId: string; title: string; certificateNumber?: string; issuingOrganisation?: string; issuedDate: string; validFromDate: string; attachmentFileName?: string }) => MaintenanceCertificate;
  updateMaintenanceCertificate: (id: string, input: Partial<MaintenanceCertificate> & Partial<MaintenanceCertificateVersion>, reason?: string) => void;
  archiveMaintenanceCertificate: (id: string, reason: string) => void;
  restoreMaintenanceCertificate: (id: string) => void;
  renewMaintenanceCertificate: (id: string, input: Partial<MaintenanceCertificateVersion> & { issuedDate: string; validFromDate: string; expiryDate?: string; renewalReason: string; attachmentFileName?: string; activate?: boolean }) => MaintenanceCertificateVersion;
  revokeMaintenanceCertificateVersion: (certificateId: string, versionId: string, reason: string) => void;
  addMaintenanceCertificateAttachment: (certificateId: string, versionId: string, input: { fileName: string; documentType?: MaintenanceCertificateAttachmentType; primaryAttachment?: boolean; description?: string }) => MaintenanceCertificateAttachment;
  removeMaintenanceCertificateAttachment: (attachmentId: string, reason: string) => void;
  setPrimaryMaintenanceCertificateAttachment: (attachmentId: string) => void;
  linkMaintenanceCertificateAsset: (certificateId: string, assetId: string, relationshipType?: MaintenanceCertificateLinkRelationship) => MaintenanceCertificateAssetLink;
  unlinkMaintenanceCertificateAsset: (linkId: string) => void;
  linkMaintenanceCertificateWorkOrder: (certificateId: string, workOrderId: string, relationshipType?: MaintenanceCertificateLinkRelationship) => MaintenanceCertificateWorkOrderLink;
  unlinkMaintenanceCertificateWorkOrder: (linkId: string) => void;
  linkMaintenanceCertificateSafetyInspection: (certificateId: string, safetyInspectionId: string, relationshipType?: MaintenanceCertificateLinkRelationship) => MaintenanceCertificateSafetyInspectionLink;
  unlinkMaintenanceCertificateSafetyInspection: (linkId: string) => void;
  linkMaintenanceCertificateContractor: (certificateId: string, contractorId: string, relationshipType?: MaintenanceCertificateLinkRelationship) => MaintenanceCertificateContractorLink;
  unlinkMaintenanceCertificateContractor: (linkId: string) => void;
  createMaintenanceCertificateRequirement: (input: Partial<MaintenanceCertificateRequirement> & { certificateTypeId: string; requirementName: string; subjectType: MaintenanceCertificateSubjectType }) => MaintenanceCertificateRequirement;
  updateMaintenanceCertificateRequirement: (id: string, input: Partial<MaintenanceCertificateRequirement>) => void;
  archiveMaintenanceCertificateRequirement: (id: string, reason: string) => void;
  createMaintenanceContractor: (input: Partial<MaintenanceContractor> & { legalName: string; businessType: MaintenanceContractorBusinessType }) => MaintenanceContractor;
  updateMaintenanceContractor: (id: string, input: Partial<MaintenanceContractor>, expectedVersion?: number) => void;
  activateMaintenanceContractor: (id: string) => void;
  deactivateMaintenanceContractor: (id: string, reason: string) => void;
  suspendMaintenanceContractor: (id: string, reason: string) => void;
  reactivateMaintenanceContractor: (id: string, reason: string) => void;
  archiveMaintenanceContractor: (id: string, reason: string) => void;
  restoreMaintenanceContractor: (id: string, reason: string) => void;
  associateMaintenanceContractorHome: (contractorId: string, input: Partial<MaintenanceContractorHomeAssociation> & { homeId?: string; relationshipType?: MaintenanceContractorHomeRelationshipType; notes?: string }) => MaintenanceContractorHomeAssociation;
  updateMaintenanceContractorHomeAssociation: (associationId: string, input: Partial<MaintenanceContractorHomeAssociation>, expectedVersion?: number) => void;
  setMaintenanceContractorHomeAssociationStatus: (associationId: string, status: MaintenanceContractorHomeAssociationStatus, reason?: string) => void;
  removeMaintenanceContractorHomeAssociation: (associationId: string, reason?: string) => void;
  createMaintenanceContractorContact: (contractorId: string, input: Partial<MaintenanceContractorContact> & { displayName?: string }) => MaintenanceContractorContact;
  updateMaintenanceContractorContact: (contactId: string, input: Partial<MaintenanceContractorContact>, expectedVersion?: number) => void;
  setMaintenanceContractorContactPrimary: (contactId: string) => void;
  setMaintenanceContractorContactEmergency: (contactId: string, isEmergency?: boolean) => void;
  archiveMaintenanceContractorContact: (contactId: string, reason: string) => void;
  restoreMaintenanceContractorContact: (contactId: string) => void;
  createMaintenanceContractorServiceArea: (contractorId: string, input: Partial<MaintenanceContractorServiceArea> & { name: string; serviceAreaType: MaintenanceContractorServiceAreaType }) => MaintenanceContractorServiceArea;
  updateMaintenanceContractorServiceArea: (serviceAreaId: string, input: Partial<MaintenanceContractorServiceArea>, expectedVersion?: number) => void;
  setMaintenanceContractorServiceAreaActive: (serviceAreaId: string, active: boolean, reason?: string) => void;
  archiveMaintenanceContractorServiceArea: (serviceAreaId: string, reason: string) => void;
  restoreMaintenanceContractorServiceArea: (serviceAreaId: string) => void;
  addMaintenanceContractorNote: (contractorId: string, input: { noteType?: MaintenanceContractorNoteType; title: string; body: string; homeId?: string; pinned?: boolean }) => MaintenanceContractorNote;
  updateMaintenanceContractorNote: (noteId: string, input: Partial<MaintenanceContractorNote>, expectedVersion?: number) => void;
  pinMaintenanceContractorNote: (noteId: string, pinned: boolean) => void;
  removeMaintenanceContractorNote: (noteId: string, reason: string) => void;
  restoreMaintenanceContractorNote: (noteId: string) => void;
  createHousekeepingTemplate: (input: Partial<HousekeepingTemplate> & { name: string; code: string; cleaningType: HousekeepingCleaningType; sections?: Partial<HousekeepingTemplateSection>[]; items?: Partial<HousekeepingTemplateItem>[] }) => HousekeepingTemplate;
  updateHousekeepingTemplate: (id: string, input: Partial<HousekeepingTemplate> & { sections?: Partial<HousekeepingTemplateSection>[]; items?: Partial<HousekeepingTemplateItem>[] }) => void;
  duplicateHousekeepingTemplate: (id: string) => HousekeepingTemplate | undefined;
  activateHousekeepingTemplate: (id: string) => void;
  deactivateHousekeepingTemplate: (id: string) => void;
  archiveHousekeepingTemplate: (id: string, reason: string) => void;
  createHousekeepingSchedule: (input: Partial<HousekeepingSchedule>) => HousekeepingSchedule;
  updateHousekeepingSchedule: (id: string, input: Partial<HousekeepingSchedule>) => void;
  pauseHousekeepingSchedule: (id: string, reason: string) => void;
  resumeHousekeepingSchedule: (id: string) => void;
  archiveHousekeepingSchedule: (id: string, reason: string) => void;
  generateHousekeepingTask: (scheduleId: string) => HousekeepingTask;
  createAdHocHousekeepingTask: (input: Partial<HousekeepingTask> & { templateId: string; title: string; dueDate: string }) => HousekeepingTask;
  assignHousekeepingTask: (id: string, input: { assignedUserId?: string; assignedTeamId?: string }) => void;
  startHousekeepingTask: (id: string) => void;
  pauseHousekeepingTask: (id: string, reason?: string) => void;
  resumeHousekeepingTask: (id: string) => void;
  updateHousekeepingTaskResponse: (responseId: string, input: { responseValue?: string; result?: HousekeepingTaskResponse["result"]; observation?: string; notApplicableReason?: string }) => void;
  addHousekeepingEvidence: (input: { taskId?: string; responseId?: string; inspectionId?: string; exceptionId?: string; evidenceType: HousekeepingEvidenceType; fileName: string; fileReference?: string; caption?: string }) => HousekeepingEvidence;
  deleteHousekeepingEvidence: (id: string, reason: string) => void;
  completeHousekeepingTask: (id: string, input: { completionNotes?: string; cleanerDeclarationAccepted: boolean }) => HousekeepingTask;
  failHousekeepingTask: (id: string, reason: string) => HousekeepingTask;
  cancelHousekeepingTask: (id: string, reason: string) => void;
  skipHousekeepingTask: (id: string, reason: string) => void;
  createHousekeepingException: (input: Partial<HousekeepingException> & { taskId: string; exceptionType: HousekeepingExceptionType; category: string; description: string; severity: HousekeepingSeverity }) => HousekeepingException;
  updateHousekeepingException: (id: string, input: Partial<HousekeepingException>) => void;
  resolveHousekeepingException: (id: string, notes: string) => void;
  closeHousekeepingException: (id: string, notes?: string) => void;
  createHousekeepingExceptionWorkOrder: (id: string) => MaintenanceWorkOrder;
  createHousekeepingQualityInspection: (taskId: string, input?: Partial<QualityInspection>) => QualityInspection;
  startHousekeepingQualityInspection: (id: string) => void;
  completeHousekeepingQualityInspection: (id: string, input: { result: Extract<HousekeepingResult, "PASS" | "PASS_WITH_OBSERVATIONS" | "FAIL">; score?: number; notes?: string }) => QualityInspection;
  createHousekeepingAudit: (input: Partial<CleaningAudit> & { auditType: CleaningAudit["auditType"]; auditDate: string }) => CleaningAudit;
  completeHousekeepingAudit: (id: string, input: { result: Extract<HousekeepingResult, "PASS" | "PASS_WITH_OBSERVATIONS" | "FAIL">; score?: number; observations?: string }) => void;
  createHousekeepingReinspection: (input: Partial<HousekeepingReinspection> & { originalTaskId: string; reason: string; dueDate: string }) => HousekeepingReinspection;
  completeHousekeepingReinspection: (id: string, result: Extract<HousekeepingResult, "PASS" | "FAIL">, notes?: string) => void;
  markRoomReady: (roomId: string, reason: string) => void;
  markRoomUnavailable: (roomId: string, reason: string) => void;
  addMaintenanceWorkOrder: (input: CreateWorkOrderInput) => MaintenanceWorkOrder;
  updateMaintenanceWorkOrder: (id: string, input: UpdateWorkOrderInput) => void;
  workflowMaintenanceWorkOrder: (id: string, input: WorkOrderWorkflowInput) => MaintenanceWorkOrder | undefined;
  archiveMaintenanceWorkOrder: (id: string, reason: string) => void;
  addWorkOrderNote: (workOrderId: string, input: { noteType: WorkOrderNote["noteType"]; content: string; clientRequestId?: string }) => WorkOrderNote;
  editWorkOrderNote: (noteId: string, input: { content: string; expectedVersion: number; reason?: string }) => void;
  removeWorkOrderNote: (noteId: string, reason: string) => void;
  addWorkOrderAttachment: (workOrderId: string, input: WorkOrderAttachmentUploadInput) => WorkOrderAttachment;
  classifyWorkOrderAttachmentEvidence: (attachmentId: string, input: { isEvidence: boolean; evidenceType?: WorkOrderAttachment["evidenceType"]; evidenceDescription?: string; expectedVersion: number }) => void;
  removeWorkOrderAttachment: (attachmentId: string, reason: string) => void;
  addWorkOrderLabour: (workOrderId: string, input: WorkOrderLabourInput) => WorkOrderLabourEntry;
  removeWorkOrderLabour: (entryId: string, reason: string) => void;
  addWorkOrderMaterial: (workOrderId: string, input: WorkOrderMaterialInput) => WorkOrderMaterialEntry;
  removeWorkOrderMaterial: (entryId: string, reason: string) => void;
  getWorkOrderTimeline: (workOrderId: string, limit?: number) => ReturnType<typeof buildWorkOrderTimeline>;
  evaluateWorkOrderCompletion: (workOrderId: string, input?: Partial<WorkOrderCompletionInput>) => ReturnType<typeof evaluateWorkOrderCompletionEligibility>;
  completeMaintenanceWorkOrder: (workOrderId: string, input: WorkOrderCompletionInput) => WorkOrderCompletionRecord;
  getPendingWorkOrderCompletion: (workOrderId: string) => WorkOrderCompletionRecord | undefined;
  evaluateWorkOrderVerification: (workOrderId: string, input?: Partial<WorkOrderVerifyInput | WorkOrderRejectVerificationInput | VerificationAssignmentInput>) => ReturnType<typeof evaluateVerificationEligibility>;
  assignWorkOrderVerification: (workOrderId: string, input: VerificationAssignmentInput) => WorkOrderCompletionRecord;
  claimWorkOrderVerification: (workOrderId: string, input: VerificationAssignmentInput) => WorkOrderCompletionRecord;
  releaseWorkOrderVerification: (workOrderId: string, input: VerificationAssignmentInput) => WorkOrderCompletionRecord;
  verifyMaintenanceWorkOrder: (workOrderId: string, input: WorkOrderVerifyInput) => WorkOrderVerificationRecord;
  rejectMaintenanceWorkOrderVerification: (workOrderId: string, input: WorkOrderRejectVerificationInput) => WorkOrderVerificationRecord;
  logAudit: (a: Omit<AuditLog, "id" | "timestamp">) => void;
  recordAuditEvent: typeof recordAuditEvent;
  getAuditForEntity: typeof getAuditForEntity;
  getAuditForResident: typeof getAuditForResident;
  getAuditForUser: typeof getAuditForUser;
  getAuditForNursingHome: typeof getAuditForNursingHome;
  getAuditForWard: typeof getAuditForWard;
  searchAudit: (filters?: AuditSearchFilters) => ReturnType<typeof searchAudit>;
  validateAuditFramework: () => ReturnType<typeof validateAuditFramework>;
  eventStore: EventStoreRecord[];
  eventOutbox: EventStoreRecord[];
  eventProcessingReceipts: EventProcessingReceipt[];
  ruleDefinitions: RuleDefinition[];
  ruleDecisions: RuleEvaluationResult[];
  ruleProcessingReceipts: RuleProcessingReceipt[];
  ruleGeneratedOutputs: RuleGeneratedOutput[];
  ruleIssues: RuleIssue[];
  ruleIssueEpisodes: RuleIssueEpisode[];
  ruleIssueTransitions: RuleIssueTransition[];
  ruleRecalculationRequests: RuleRecalculationRequest[];
  ruleRecalculationItems: RuleRecalculationItem[];
  ruleOverrides: RuleOverride[];
  ruleSuppressions: RuleSuppression[];
  emitDomainEvent: (event: AnyDomainEvent) => void;
  publishPendingDomainEvents: (handlers?: EventHandlerRegistration[]) => void;
  evaluateRulesForEvent: (event: AnyDomainEvent) => RuleEvaluationResult[];
  replayRuleForEvent: (ruleId: string, version: number, eventId: string) => RuleEvaluationResult | undefined;
  getApplicableRulesForEvent: (event: AnyDomainEvent) => RuleDefinition[];
  acknowledgeRuleIssue: (issueId: string, note?: string) => void;
  escalateRuleIssue: (issueId: string, details: { level: number; reasonCode: string; reasonText?: string; toSeverity: RuleDefinition["severity"] }) => void;
  resolveRuleIssue: (issueId: string, details: { resolutionCode: string; resolutionReason: string; evidenceRecordIds?: string[] }) => void;
  dismissRuleIssue: (issueId: string, details: { dismissalCode: string; dismissalReason: string; dismissalExpiresAt?: string; dismissalScope?: RuleIssue["dismissalScope"] }) => void;
  getEventById: (eventId: string) => ReturnType<typeof getEventById>;
  getEventsByCorrelationId: (correlationId: string) => ReturnType<typeof getEventsByCorrelationId>;
  getEventsForResident: (residentId: string) => ReturnType<typeof getEventsForResident>;
  getEventsForEntity: (entityType: string, entityId: string) => ReturnType<typeof getEventsForEntity>;
  getFailedEvents: () => ReturnType<typeof getFailedEvents>;
  getDeadLetterEvents: () => ReturnType<typeof getDeadLetterEvents>;
  getProcessingReceipts: (eventId: string) => ReturnType<typeof getProcessingReceipts>;
  validateDomainEvent: (event: AnyDomainEvent) => ReturnType<typeof validateDomainEvent>;
  operationalContext: OperationalContext;
  getConfiguredShifts: (nursingHomeId?: string) => ShiftDefinition[];
  getCurrentShift: (nursingHomeId?: string, dateTime?: string) => ReturnType<typeof getCurrentShift>;
  getShiftById: typeof getShiftById;
  getShiftDateRange: typeof getShiftDateRange;
  switchNursingHome: (nursingHomeId: string) => void;
  selectSingleWard: (wardId: string) => void;
  selectMultipleWards: (wardIds: string[]) => void;
  selectAllAuthorisedWards: () => void;
  setOperationalShift: (shiftId: string) => void;
  setOperationalDate: (date: string) => void;
  getResidentsForContext: () => Resident[];
  getTasksDueForContext: () => Task[];
  getAlertsForContext: () => ClinicalAlert[];
  getCareActionsForContext: () => ProblemIntervention[];
  getObservationsForOperationalContext: () => ClinicalObservation[];
  getHandoversForContext: () => HandoverNote[];
  getHandoversForOperationalContext: (filters?: HandoverContextFilters) => ContextualHandover[];
  getIncidentsForContext: () => Incident[];
  getOperationalTimeWindows: typeof getOperationalTimeWindows;
  getNextShift: (shiftId?: string, operationalDate?: string) => ReturnType<typeof getNextShift>;
  getPreviousShift: (shiftId?: string, operationalDate?: string) => ReturnType<typeof getPreviousShift>;
  canSwitchToWard: (wardId: string) => ReturnType<typeof canSwitchToWard>;
  canSelectMultipleWards: () => boolean;
  validateOperationalContext: () => ReturnType<typeof validateOperationalContext>;
  validateShiftDefinitions: () => ReturnType<typeof validateShiftDefinitions>;
  validateWardShiftContext: () => ReturnType<typeof validateWardShiftContext>;
  // Phase 5 charts
  addObservation: (o: Omit<Observation, "id">) => Observation;
  addWeight: (w: Omit<WeightRecord, "id">) => WeightRecord;
  addFluid: (f: Omit<FluidRecord, "id">) => FluidRecord;
  addFood: (f: Omit<FoodRecord, "id">) => FoodRecord;
  addPain: (p: Omit<PainRecord, "id">) => PainRecord;
  addSleep: (s: Omit<SleepRecord, "id">) => SleepRecord;
  addBowel: (b: Omit<BowelRecord, "id">) => BowelRecord;
  addBehaviour: (b: Omit<BehaviourRecord, "id">) => BehaviourRecord;
  recordDailyCare: (command: RecordDailyCareCommand) => DailyCareRecord;
  submitHcaNurseEscalation: (command: SubmitHcaNurseEscalationCommand) => HcaNurseEscalation;
  addIncidentAction: (a: Omit<IncidentAction, "id">) => IncidentAction;
  generateShiftSummary: (date: string, shift: ShiftSummary["shift"]) => ShiftSummary;
  // ---------- Unified Care Plan / Problems ----------
  ensureResidentCarePlan: (residentId: string) => ResidentCarePlan;
  addProblem: (input: {
    residentId: string;
    category: ProblemCategory;
    rltDomainId?: CarePlanProblem["rltDomainId"];
    customCategoryLabel?: string;
    problemStatement: string;
    riskLevel: ProblemRiskLevel;
    evaluationDate?: string;
    reviewDate?: string;
    notes?: string;
    sourceAssessmentId?: string;
    sourceAssessmentType?: any;
    contextReferences?: CarePlanProblem["contextReferences"];
  }) => CarePlanProblem;
  updateProblem: (id: string, patch: Partial<CarePlanProblem>, reason?: string) => void;
  resolveProblem: (id: string, reason: string) => void;
  reopenProblem: (id: string, reason: string) => void;
  archiveProblem: (id: string, reason: string) => void;
  addGoal: (problemId: string, statement: string, targetDate?: string) => ProblemGoal;
  updateGoal: (id: string, patch: Partial<ProblemGoal>) => void;
  removeGoal: (id: string) => void;
  addProblemIntervention: (input: {
    problemId: string;
    name: string;
    description?: string;
    frequencyType: FrequencyType;
    frequencyValue?: number;
    frequencyInstructions?: string;
    careActionType?: ProblemIntervention["careActionType"];
    priority?: ProblemIntervention["priority"];
    prnConfiguration?: ProblemIntervention["prnConfiguration"];
    triggerConfiguration?: ProblemIntervention["triggerConfiguration"];
    oneOffConfiguration?: ProblemIntervention["oneOffConfiguration"];
    completionRequirements?: ProblemIntervention["completionRequirements"];
    visibilityPolicy?: ProblemIntervention["visibilityPolicy"];
    assignedRole?: Role;
    assignedStaffId?: string;
    assignedStaffName?: string;
    startDate: string;
    startTime?: string;
    reviewDate: string;
    endDate: string;
    status?: "active" | "review_due";
    notes?: string;
    createdBy?: string;
    createdByRole?: Role;
  }) => ProblemIntervention;
  updateProblemIntervention: (
    id: string,
    patch: Partial<ProblemIntervention>,
    reason?: string,
  ) => void;
  discontinueProblemIntervention: (id: string, reason: string) => void;
  logProblemIntervention: (input: {
    interventionId: string;
    outcome: ProblemInterventionLog["outcome"];
    residentResponse?: string;
    comments?: string;
  }) => ProblemInterventionLog;
  addProblemInterventionLog: (
    input: Omit<ProblemInterventionLog, "id" | "createdAt">,
  ) => ProblemInterventionLog;
  addProblemEvaluation: (
    input: Omit<ProblemEvaluation, "id" | "evaluatorId" | "evaluatorName" | "role" | "date"> & {
      date?: string;
    },
  ) => ProblemEvaluation;
  addProblemReview: (
    input: Omit<ProblemReview, "id" | "reviewedById" | "reviewedByName" | "role">,
  ) => ProblemReview;
  acceptSuggestion: (
    id: string,
    edits?: { problemStatement?: string; riskLevel?: ProblemRiskLevel; category?: ProblemCategory },
  ) => CarePlanProblem | undefined;
  rejectSuggestion: (id: string, reason: string) => void;
  // Vital Signs (legacy combined form)
  recordVital: (
    input: Omit<
      VitalSign,
      "id" | "recordedByUserId" | "recordedByName" | "recordedByRole" | "createdAt" | "auditTrail"
    > & { recordedAt?: string },
  ) => VitalSign;
  updateVital: (id: string, patch: Partial<VitalSign>, reason: string) => void;
  softDeleteVital: (id: string, reason: string) => void;
  // Observation Plan (legacy)
  setObservationPlan: (residentId: string, items: ObservationPlanItem[]) => void;
  // Clinical Alerts
  acknowledgeClinicalAlert: (id: string) => void;
  dismissClinicalAlert: (id: string, reason?: ClinicalAlert["dismissedReason"]) => void;
  addClinicalEscalationNote: (alertId: string, actionTaken: string) => void;
  regenerateClinicalAlertsForResident: (residentId: string) => void;
  // Phase 7: Modular Clinical Observations
  recordObservation: (input: {
    residentId: string;
    kind: ObservationKind;
    date?: string;
    time?: string;
    data: Record<string, any>;
    notes?: string;
  }) => ClinicalObservation;
  updateObservation: (
    id: string,
    patch: { data?: Record<string, any>; notes?: string },
    reason: string,
  ) => void;
  softDeleteObservation: (id: string, reason: string) => void;
  setObservationSchedule: (residentId: string, items: ObservationScheduleItem[]) => void;
  // Canonical entity hierarchy selectors
  getEnterpriseById: (id: string) => ReturnType<typeof getEnterpriseById>;
  getNursingHomeById: (id: string) => ReturnType<typeof getNursingHomeById>;
  getWardsForNursingHome: (nursingHomeId: string, includeInactive?: boolean) => ReturnType<typeof getWardsForNursingHome>;
  getWardById: (id: string) => ReturnType<typeof getWardById>;
  getRoomsForWard: (wardId: string, includeInactive?: boolean) => ReturnType<typeof getRoomsForWard>;
  getRoomById: (id: string) => ReturnType<typeof getRoomById>;
  getBedsForRoom: (roomId: string, includeInactive?: boolean) => ReturnType<typeof getBedsForRoom>;
  getBedById: (id: string) => ReturnType<typeof getBedById>;
  getResidentCurrentPlacement: (residentId: string) => ReturnType<typeof getResidentCurrentPlacement>;
  getResidentCurrentBed: (residentId: string) => ReturnType<typeof getResidentCurrentBed>;
  getResidentCurrentRoom: (residentId: string) => ReturnType<typeof getResidentCurrentRoom>;
  getResidentCurrentWard: (residentId: string) => ReturnType<typeof getResidentCurrentWard>;
  getResidentCurrentNursingHome: (residentId: string) => ReturnType<typeof getResidentCurrentNursingHome>;
  getResidentsForWard: (wardId: string) => ReturnType<typeof getResidentsForWard>;
  getResidentsForRoom: (roomId: string) => ReturnType<typeof getResidentsForRoom>;
  getResidentsForNursingHome: (nursingHomeId: string) => ReturnType<typeof getResidentsForNursingHome>;
  getResidentLifecycleStatus: typeof getResidentLifecycleStatus;
  getResidentAdmissionType: typeof getResidentAdmissionType;
  getResidentPresenceStatus: typeof getResidentPresenceStatus;
  getResidentDisplayStatus: typeof getResidentDisplayStatus;
  getResidentCurrentBedAssignment: (residentId: string) => ReturnType<typeof getResidentCurrentBedAssignment>;
  getResidentBedAssignmentHistory: (residentId: string) => ReturnType<typeof getResidentBedAssignmentHistory>;
  isResidentActive: typeof isResidentActive;
  isResidentInHome: typeof isResidentInHome;
  isResidentRespite: typeof isResidentRespite;
  isResidentEligibleForInHomeWork: typeof isResidentEligibleForInHomeWork;
  isResidentOccupyingBed: (residentId: string) => boolean;
  getCurrentResidents: () => ReturnType<typeof getCurrentResidents>;
  getActiveLongTermResidents: () => ReturnType<typeof getActiveLongTermResidents>;
  getActiveRespiteResidents: () => ReturnType<typeof getActiveRespiteResidents>;
  getTemporarilyAbsentResidents: () => ReturnType<typeof getTemporarilyAbsentResidents>;
  getHospitalTransferResidents: () => ReturnType<typeof getHospitalTransferResidents>;
  getInactiveResidents: () => ReturnType<typeof getInactiveResidents>;
  getPreAdmissionRecords: () => ReturnType<typeof getPreAdmissionRecords>;
  getScheduledAdmissions: () => ReturnType<typeof getScheduledAdmissions>;
  getOccupancyByNursingHome: (nursingHomeId: string) => ReturnType<typeof getOccupancyByNursingHome>;
  getOccupancyByWard: (wardId: string) => ReturnType<typeof getOccupancyByWard>;
  getStaffMemberById: typeof getStaffMemberById;
  getUserAccountById: typeof getUserAccountById;
  getCurrentStaffMember: () => ReturnType<typeof getCurrentStaffMember>;
  getStaffEmploymentRecords: typeof getStaffEmploymentRecords;
  getCurrentEmployment: (staffMemberId: string, nursingHomeId?: string) => ReturnType<typeof getCurrentEmployment>;
  getStaffRoleAssignments: typeof getStaffRoleAssignments;
  getStaffHomeAssignments: typeof getStaffHomeAssignments;
  getStaffWardCompetencies: typeof getStaffWardCompetencies;
  getStaffProfessionalRegistrations: typeof getStaffProfessionalRegistrations;
  getStaffRosterAssignments: typeof getStaffRosterAssignments;
  getEffectivePermissions: (capabilityScope?: { nursingHomeId?: string; wardId?: string }) => ReturnType<typeof getEffectivePermissions>;
  getStaffAccessibleHomes: typeof getStaffAccessibleHomes;
  getStaffAccessibleWards: typeof getStaffAccessibleWards;
  getStaffOnDuty: typeof getStaffOnDuty;
  getStaffForWard: typeof getStaffForWard;
  getRegistrationStatus: typeof getRegistrationStatus;
  getRegistrationsExpiringWithin: typeof getRegistrationsExpiringWithin;
  getExpiredRegistrations: typeof getExpiredRegistrations;
  getStaffWithoutRequiredRegistration: typeof getStaffWithoutRequiredRegistration;
  canAccess: (capability: string, resource?: { nursingHomeId?: string; wardId?: string; residentId?: string; sensitive?: boolean }) => boolean;
  explainAuthorizationDecision: (capability: string, resource?: { nursingHomeId?: string; wardId?: string; residentId?: string; sensitive?: boolean }) => ReturnType<typeof explainAuthorizationDecision>;
}

const Ctx = createContext<CareCtx | null>(null);

export function CareProvider({ children }: { children: ReactNode }) {
  const [store, rawSetStore] = useState<Store>(() => loadInitialStore());
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    if (typeof window === "undefined") return "u-3";
    return window.localStorage.getItem(CURRENT_USER_STORAGE_KEY) || "u-3";
  }); // J. Roberts (Nurse)
  const [activeFacilityId, setActiveFacilityIdState] = useState<string>(() => {
    if (typeof window === "undefined") return BALLYMORE_FACILITY_ID;
    return window.localStorage.getItem(ACTIVE_FACILITY_STORAGE_KEY) || BALLYMORE_FACILITY_ID;
  });
  const [filter, setFilter] = useState<CareFilter>({});

  const setStore = useCallback(
    (value: Store | ((previous: Store) => Store)) => {
      rawSetStore((previous) => {
        const next = typeof value === "function" ? (value as (previous: Store) => Store)(previous) : value;
        return normalizeFacilities(scopeNewRecords(previous, next, activeFacilityId));
      });
    },
    [activeFacilityId],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      console.error("Failed to persist care store.", error);
    }
  }, [store]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACTIVE_FACILITY_STORAGE_KEY, activeFacilityId);
  }, [activeFacilityId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, currentUserId);
  }, [currentUserId]);

  const currentUser = useMemo(
    () => store.users.find((u) => u.id === currentUserId) || store.users[0],
    [store.users, currentUserId],
  );
  const currentRole = currentUser.role;
  const currentUserName = currentUser.name;
  const activeFacility = useMemo(
    () => store.facilities.find((facility) => facility.id === activeFacilityId) || store.facilities[0],
    [store.facilities, activeFacilityId],
  );
  const scopedStore = useMemo(() => filterByFacility(store, activeFacilityId), [store, activeFacilityId]);
  const operationalContext = useMemo(() => {
    try {
      const stored = store.operationalContexts.find((context) => context.userAccountId === currentUser.id);
      return initialiseOperationalContext(store, {
        userAccountId: currentUser.id,
        nursingHomeId: activeFacilityId,
        wardIds: stored?.nursingHomeId === activeFacilityId ? stored.wardIds : undefined,
        wardSelectionMode: stored?.nursingHomeId === activeFacilityId ? stored.wardSelectionMode : undefined,
        shiftId: stored?.shiftId,
        operationalDate: stored?.operationalDate,
        source: stored ? "stored" : "default",
      });
    } catch {
      return initialiseOperationalContext(store, {
        userAccountId: currentUser.id,
        nursingHomeId: userFacilityIds(currentUser)[0] || BALLYMORE_FACILITY_ID,
        source: "system_repair",
      });
    }
  }, [activeFacilityId, currentUser, store]);

  useEffect(() => {
    const currentStaff = getCurrentStaffMember(store, currentUser);
    const ids = (currentStaff ? getStaffAccessibleHomes(store, currentStaff.id) : userFacilityIds(currentUser)) as string[];
    if (ids.includes(activeFacilityId)) return;
    setActiveFacilityIdState(ids[0] || BALLYMORE_FACILITY_ID);
    setFilter({});
  }, [activeFacilityId, currentUser, store]);

  const setActiveFacilityId = useCallback(
    (id: string) => {
      const nextFacility = store.facilities.find((facility) => facility.id === id);
      if (!nextFacility) return;
      const currentStaff = getCurrentStaffMember(store, currentUser);
      const accessibleHomeIds = (currentStaff ? getStaffAccessibleHomes(store, currentStaff.id) : userFacilityIds(currentUser)) as string[];
      if (!accessibleHomeIds.includes(id)) return;
      setActiveFacilityIdState(id);
      setFilter({});
    },
    [currentUser, store],
  );

  const setCurrentRole = useCallback(
    (r: Role) => {
      const user = store.users.find((u) => u.role === r && userFacilityIds(u).includes(activeFacilityId));
      if (!user || user.id === currentUser.id) return;
      const now = new Date().toISOString();
      setStore((s) => ({
        ...s,
        auditLogs: [{
          id: uid(),
          facilityId: activeFacilityId,
          user: currentUserName,
          role: currentRole,
          action: "Active role changed",
          entity: currentUser.id,
          entityType: "user_context",
          timestamp: now,
          before: JSON.stringify({ role: currentRole }),
          after: JSON.stringify({ role: r }),
        }, ...s.auditLogs].slice(0, 500),
      }));
      setCurrentUserId(user.id);
    },
    [activeFacilityId, currentRole, currentUser.id, currentUserName, store.users],
  );

  const resetToDemoData = useCallback(() => {
    const nextStore = seedData();
    syncUidSequence(nextStore);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORE_STORAGE_KEY);
        window.localStorage.removeItem(LEGACY_STORE_STORAGE_KEY);
        window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        window.localStorage.removeItem(ACTIVE_FACILITY_STORAGE_KEY);
      } catch (error) {
        console.warn("Failed to clear persisted store during demo reset.", error);
      }
    }
    setStore(nextStore);
    setCurrentUserId("u-3");
    setActiveFacilityIdState(BALLYMORE_FACILITY_ID);
  }, []);

  const logAudit = useCallback((a: Omit<AuditLog, "id" | "timestamp">) => {
    setStore((s) => ({
      ...s,
      auditLogs: [{ ...a, id: uid(), timestamp: new Date().toISOString() }, ...s.auditLogs].slice(0, 500),
      auditRecords: [
        recordAuditEvent({
          actor: { user: currentUser },
          action: a.action.toLowerCase().includes("delete")
            ? "delete"
            : a.action.toLowerCase().includes("create") || a.action.toLowerCase().includes("add")
              ? "create"
              : "update",
          entityType: a.entityType || "legacy_record",
          entityId: a.entity,
          summary: a.action,
          reasonText: a.reason,
          scope: { nursingHomeId: a.facilityId || activeFacilityId },
          changes: a.before || a.after
            ? [{ field: "legacyValue", previousValue: a.before, newValue: a.after }]
            : [{ field: "legacyAction", previousValue: undefined, newValue: a.action }],
        }),
        ...s.auditRecords,
      ],
    }));
  }, [activeFacilityId, currentUser]);

  const filteredResidentIds = useMemo(() => {
    return scopedStore.residents
      .filter((r) => {
        if (filter.residentId && r.id !== filter.residentId) return false;
        if (filter.roomId && r.roomId !== filter.roomId) return false;
        if (filter.unitId && r.unitId !== filter.unitId) return false;
        if (filter.wingId && r.wingId !== filter.wingId) return false;
        if (filter.status && (r.residentType || r.status) !== filter.status) return false;
        return true;
      })
      .map((r) => r.id);
  }, [scopedStore.residents, filter]);

  const workOrderExecutionContext = useCallback((record: MaintenanceWorkOrder | undefined, now?: string) => ({
    currentUser,
    users: store.users,
    now,
    canAccess: (capability: string, resource?: { nursingHomeId?: string; wardId?: string }) =>
      canAccess(
        scopedStore,
        createStaffAccessContext(currentUser, activeFacilityId, resource?.wardId || (record?.wardId ? String(record.wardId) : undefined)),
        capability,
        resource || (record ? { nursingHomeId: record.homeId, wardId: record.wardId ? String(record.wardId) : undefined } : { nursingHomeId: activeFacilityId }),
      ),
  }), [activeFacilityId, currentUser, scopedStore, store.users]);

  const requireContractorCapability = useCallback((capability: string, nursingHomeId = activeFacilityId) => {
    if (!canAccess(store, createStaffAccessContext(currentUser, nursingHomeId), capability, { nursingHomeId })) {
      throw new Error("You do not have permission to manage Contractor Register records.");
    }
  }, [activeFacilityId, currentUser, store]);

  const ensureContractorHomeScope = useCallback((homeId?: string) => {
    const targetHomeId = homeId || activeFacilityId;
    if (!store.facilities.some((facility) => facility.id === targetHomeId)) throw new Error("Nursing Home not found.");
    if (currentRole !== "group_owner" && !userFacilityIds(currentUser).includes(targetHomeId)) {
      throw new Error("You do not have access to manage contractors for this Nursing Home.");
    }
    return targetHomeId;
  }, [activeFacilityId, currentRole, currentUser, store.facilities]);

  const ensureContractorEntityScope = useCallback((contractor: MaintenanceContractor) => {
    const relatedHomeIds = store.maintenanceContractorHomeAssociations
      .filter((association) => association.contractorId === contractor.id)
      .map((association) => association.homeId);
    if (currentRole === "group_owner" || relatedHomeIds.length === 0) return;
    if (!relatedHomeIds.some((homeId) => userFacilityIds(currentUser).includes(homeId))) throw new Error("Contractor not found.");
  }, [currentRole, currentUser, store.maintenanceContractorHomeAssociations]);

  const api = useMemo<CareCtx>(
    () => ({
      ...scopedStore,
      facilities: store.facilities,
      activeFacilityId,
      activeFacility,
      setActiveFacilityId,
      currentRole,
      setCurrentRole,
      resetToDemoData,
      currentUserName,
      currentUser,
      setCurrentUserId,
      uploadResidentDocument: async (residentId, metadata, file) => {
        const resident = store.residents.find((item) => item.id === residentId); if (!resident) throw new Error("Resident not found.");
        const nursingHomeId = resident.facilityId || activeFacilityId; const now = new Date().toISOString();
        const capabilities = ["resident_documents.upload","resident_documents.view_sensitive","resident_documents.view_highly_sensitive","resident_documents.view_legal","resident_documents.view_safeguarding","resident_documents.view_medication"].filter((capability) => canAccess(store, createStaffAccessContext(currentUser, nursingHomeId), capability, { nursingHomeId, residentId }));
        const next = structuredClone(store.residentDocumentState);
        await uploadResidentDocumentService(next, residentId, metadata, file, { nursingHomeId, userAccountId: currentUser.id, staffMemberId: String(operationalContext.staffMemberId || currentUser.id), capabilities, occurredAt: now, residentExists: (id) => store.residents.some((item) => item.id === id), residentBelongsToHome: (id, home) => store.residents.some((item) => item.id === id && (item.facilityId || activeFacilityId) === home), storeFile: storeResidentFile });
        setStore((state) => ({ ...state, residentDocumentState: next }));
      },
      uploadResidentDocumentVersion: async (documentId, file, reason, reasonText) => {
        const document = store.residentDocumentState.documents.find((item) => item.id === documentId); if (!document) throw new Error("Document not found."); const now = new Date().toISOString();
        const capabilities = ["resident_documents.upload_version"].filter((capability) => canAccess(store, createStaffAccessContext(currentUser, document.nursingHomeId), capability, { nursingHomeId: document.nursingHomeId, residentId: document.residentId }));
        const next = structuredClone(store.residentDocumentState); await uploadNewResidentDocumentVersionService(next, documentId, file, reason, reasonText, { nursingHomeId: document.nursingHomeId, userAccountId: currentUser.id, capabilities, occurredAt: now, residentExists: () => true, residentBelongsToHome: () => true, storeFile: storeResidentFile }); setStore((state) => ({ ...state, residentDocumentState: next }));
      },
      changeResidentDocumentStatus: (documentId, status) => {
        const document = store.residentDocumentState.documents.find((item) => item.id === documentId); if (!document) throw new Error("Document not found."); const now = new Date().toISOString(); const capabilities = canAccess(store, createStaffAccessContext(currentUser, document.nursingHomeId), "resident_documents.change_status", { nursingHomeId: document.nursingHomeId, residentId: document.residentId }) ? ["resident_documents.change_status"] : []; const next = structuredClone(store.residentDocumentState); changeResidentDocumentStatusService(next, documentId, status, { nursingHomeId: document.nursingHomeId, userAccountId: currentUser.id, capabilities, occurredAt: now, residentExists: () => true, residentBelongsToHome: () => true, storeFile: storeResidentFile }); setStore((state) => ({ ...state, residentDocumentState: next }));
      },
      filter,
      setFilter,
      filteredResidentIds,
      getEnterpriseById: (id) => getEnterpriseById(scopedStore, id),
      getNursingHomeById: (id) => getNursingHomeById(scopedStore, id),
      getWardsForNursingHome: (nursingHomeId, includeInactive) =>
        getWardsForNursingHome(scopedStore, nursingHomeId, includeInactive),
      getWardById: (id) => getWardById(scopedStore, id),
      getRoomsForWard: (wardId, includeInactive) => getRoomsForWard(scopedStore, wardId, includeInactive),
      getRoomById: (id) => getRoomById(scopedStore, id),
      getBedsForRoom: (roomId, includeInactive) => getBedsForRoom(scopedStore, roomId, includeInactive),
      getBedById: (id) => getBedById(scopedStore, id),
      getResidentCurrentPlacement: (residentId) => getResidentCurrentPlacement(scopedStore, residentId),
      getResidentCurrentBed: (residentId) => getResidentCurrentBed(scopedStore, residentId),
      getResidentCurrentRoom: (residentId) => getResidentCurrentRoom(scopedStore, residentId),
      getResidentCurrentWard: (residentId) => getResidentCurrentWard(scopedStore, residentId),
      getResidentCurrentNursingHome: (residentId) => getResidentCurrentNursingHome(scopedStore, residentId),
      getResidentsForWard: (wardId) => getResidentsForWard(scopedStore, wardId),
      getResidentsForRoom: (roomId) => getResidentsForRoom(scopedStore, roomId),
      getResidentsForNursingHome: (nursingHomeId) => getResidentsForNursingHome(scopedStore, nursingHomeId),
      getResidentLifecycleStatus,
      getResidentAdmissionType,
      getResidentPresenceStatus,
      getResidentDisplayStatus,
      getResidentCurrentBedAssignment: (residentId) => getResidentCurrentBedAssignment(scopedStore, residentId),
      getResidentBedAssignmentHistory: (residentId) => getResidentBedAssignmentHistory(scopedStore, residentId),
      isResidentActive,
      isResidentInHome,
      isResidentRespite,
      isResidentEligibleForInHomeWork,
      isResidentOccupyingBed: (residentId) => isResidentOccupyingBed(scopedStore, residentId),
      getCurrentResidents: () => getCurrentResidents(scopedStore),
      getActiveLongTermResidents: () => getActiveLongTermResidents(scopedStore),
      getActiveRespiteResidents: () => getActiveRespiteResidents(scopedStore),
      getTemporarilyAbsentResidents: () => getTemporarilyAbsentResidents(scopedStore),
      getHospitalTransferResidents: () => getHospitalTransferResidents(scopedStore),
      getInactiveResidents: () => getInactiveResidents(scopedStore),
      getPreAdmissionRecords: () => getPreAdmissionRecords(scopedStore),
      getScheduledAdmissions: () => getScheduledAdmissions(scopedStore),
      getOccupancyByNursingHome: (nursingHomeId) => getOccupancyByNursingHome(scopedStore, nursingHomeId),
      getOccupancyByWard: (wardId) => getOccupancyByWard(scopedStore, wardId),
      getStaffMemberById: (id) => getStaffMemberById(scopedStore, id),
      getUserAccountById: (id) => getUserAccountById(scopedStore, id),
      getCurrentStaffMember: () => getCurrentStaffMember(scopedStore, currentUser),
      getStaffEmploymentRecords: (staffMemberId) => getStaffEmploymentRecords(scopedStore, staffMemberId),
      getCurrentEmployment: (staffMemberId, nursingHomeId) =>
        getCurrentEmployment(scopedStore, staffMemberId, nursingHomeId),
      getStaffRoleAssignments: (staffMemberId) => getStaffRoleAssignments(scopedStore, staffMemberId),
      getStaffHomeAssignments: (staffMemberId) => getStaffHomeAssignments(scopedStore, staffMemberId),
      getStaffWardCompetencies: (staffMemberId) => getStaffWardCompetencies(scopedStore, staffMemberId),
      getStaffProfessionalRegistrations: (staffMemberId) =>
        getStaffProfessionalRegistrations(scopedStore, staffMemberId),
      getStaffRosterAssignments: (staffMemberId) => getStaffRosterAssignments(scopedStore, staffMemberId),
      getEffectivePermissions: (capabilityScope) =>
        getEffectivePermissions(
          scopedStore,
          createStaffAccessContext(currentUser, activeFacilityId),
          capabilityScope || { nursingHomeId: activeFacilityId },
        ),
      getStaffAccessibleHomes: (staffMemberId) => getStaffAccessibleHomes(scopedStore, staffMemberId),
      getStaffAccessibleWards: (staffMemberId, nursingHomeId) =>
        getStaffAccessibleWards(scopedStore, staffMemberId, nursingHomeId),
      getStaffOnDuty: (nursingHomeId, wardId) => getStaffOnDuty(scopedStore, nursingHomeId, wardId),
      getStaffForWard: (nursingHomeId, wardId) => getStaffForWard(scopedStore, nursingHomeId, wardId),
      getRegistrationStatus,
      getRegistrationsExpiringWithin: (days) => getRegistrationsExpiringWithin(scopedStore, days),
      getExpiredRegistrations: () => getExpiredRegistrations(scopedStore),
      getStaffWithoutRequiredRegistration: () => getStaffWithoutRequiredRegistration(scopedStore),
      canAccess: (capability, resource) =>
        canAccess(
          scopedStore,
          createStaffAccessContext(currentUser, activeFacilityId, resource?.wardId),
          capability,
          resource || { nursingHomeId: activeFacilityId },
        ),
      explainAuthorizationDecision: (capability, resource) =>
        explainAuthorizationDecision(
          scopedStore,
          createStaffAccessContext(currentUser, activeFacilityId, resource?.wardId),
          capability,
          resource || { nursingHomeId: activeFacilityId },
        ),
      saveRltDependency: (input) => {
        const now = new Date().toISOString();
        setStore((state) => {
          const nextDependencyState: RltDependencyState = {
            records: state.rltDependencyState.records.map((record) => ({
              ...record,
              evidenceReferences: [...record.evidenceReferences],
            })),
            reviews: [...state.rltDependencyState.reviews],
            audit: [...state.rltDependencyState.audit],
            events: [...state.rltDependencyState.events],
          };
          const resident = state.residents.find((candidate) => candidate.id === input.residentId);
          const nursingHomeId = resident?.facilityId || activeFacilityId;
          const accessContext = createStaffAccessContext(currentUser, nursingHomeId);
          const context = {
            userAccountId: currentUser.id,
            staffMemberId: accessContext.staffMemberId,
            nursingHomeId,
            capabilities: getEffectivePermissions(state, accessContext, {
              nursingHomeId,
            }),
            occurredAt: now,
            correlationId: `dependency-store:${input.residentId}:${input.rltDomainId}:${now}`,
            residentExists: (residentId: string) =>
              state.residents.some((candidate) => candidate.id === residentId),
            residentBelongsToHome: (residentId: string, homeId: string) =>
              state.residents.some(
                (candidate) =>
                  candidate.id === residentId &&
                  (candidate.facilityId || activeFacilityId) === homeId,
              ),
          };
          const current = nextDependencyState.records.find(
            (record) =>
              record.residentId === input.residentId &&
              record.rltDomainId === input.rltDomainId &&
              record.status === "current",
          );
          if (!current) recordRltDependency(nextDependencyState, input, context);
          else if (current.dependencyLevel === input.dependencyLevel)
            reviewRltDependency(
              nextDependencyState,
              {
                residentId: input.residentId,
                rltDomainId: input.rltDomainId,
                rationale: input.rationale,
                evidenceReferences: input.evidenceReferences,
                nextReviewDate: input.nextReviewDate,
              },
              context,
            );
          else changeRltDependency(nextDependencyState, input, context);
          return { ...state, rltDependencyState: nextDependencyState };
        });
      },
      saveResidentStrength: (input) => {
        const now = new Date().toISOString();
        setStore((state) => {
          const resident = state.residents.find((candidate) => candidate.id === input.residentId);
          const nursingHomeId = resident?.facilityId || activeFacilityId;
          const accessContext = createStaffAccessContext(currentUser, nursingHomeId);
          const context: StrengthPreferenceContext = {
            userAccountId: currentUser.id,
            staffMemberId: accessContext.staffMemberId,
            nursingHomeId,
            capabilities: getEffectivePermissions(state, accessContext, { nursingHomeId }),
            occurredAt: now,
            correlationId: `strength-store:${input.residentId}:${input.rltDomainId}:${now}`,
            residentExists: (residentId) => state.residents.some((candidate) => candidate.id === residentId),
            residentBelongsToHome: (residentId, homeId) => state.residents.some((candidate) => candidate.id === residentId && (candidate.facilityId || activeFacilityId) === homeId),
          };
          const next: StrengthPreferenceState = structuredClone(state.strengthPreferenceState);
          createResidentStrength(next, input, context);
          return { ...state, strengthPreferenceState: next };
        });
      },
      saveResidentPreference: (input) => {
        const now = new Date().toISOString();
        setStore((state) => {
          const resident = state.residents.find((candidate) => candidate.id === input.residentId);
          const nursingHomeId = resident?.facilityId || activeFacilityId;
          const accessContext = createStaffAccessContext(currentUser, nursingHomeId);
          const context: StrengthPreferenceContext = {
            userAccountId: currentUser.id,
            staffMemberId: accessContext.staffMemberId,
            nursingHomeId,
            capabilities: getEffectivePermissions(state, accessContext, { nursingHomeId }),
            occurredAt: now,
            correlationId: `preference-store:${input.residentId}:${input.rltDomainId}:${now}`,
            residentExists: (residentId) => state.residents.some((candidate) => candidate.id === residentId),
            residentBelongsToHome: (residentId, homeId) => state.residents.some((candidate) => candidate.id === residentId && (candidate.facilityId || activeFacilityId) === homeId),
          };
          const next: StrengthPreferenceState = structuredClone(state.strengthPreferenceState);
          createResidentPreference(next, input, context);
          return { ...state, strengthPreferenceState: next };
        });
      },
      createResidentEndOfLifePathway: (residentId, reasonText) => {
        const now = new Date().toISOString();
        setStore((state) => {
          const resident = state.residents.find((item) => item.id === residentId);
          const nursingHomeId = resident?.facilityId || activeFacilityId;
          const access = createStaffAccessContext(currentUser, nursingHomeId);
          const context: EndOfLifeContext = { userAccountId: currentUser.id, staffMemberId: access.staffMemberId, nursingHomeId, capabilities: getEffectivePermissions(state, access, { nursingHomeId }), occurredAt: now, correlationId: `eol-create:${residentId}:${now}`, residentExists: (id) => state.residents.some((item) => item.id === id), residentBelongsToHome: (id, homeId) => state.residents.some((item) => item.id === id && (item.facilityId || activeFacilityId) === homeId) };
          const next = structuredClone(state.endOfLifeState);
          createEndOfLifePathway(next, { residentId, effectiveAt: now, reasonCode: "clinical_planning", reasonText }, context);
          return { ...state, endOfLifeState: next };
        });
      },
      activateResidentEndOfLifeCare: (pathwayId, clinicalBasis) => {
        const now = new Date().toISOString();
        setStore((state) => {
          const pathway = state.endOfLifeState.pathways.find((item) => item.id === pathwayId);
          if (!pathway) throw new Error("End-of-Life pathway not found.");
          const access = createStaffAccessContext(currentUser, pathway.nursingHomeId, pathway.wardId);
          const context: EndOfLifeContext = { userAccountId: currentUser.id, staffMemberId: access.staffMemberId, nursingHomeId: pathway.nursingHomeId, wardId: pathway.wardId, capabilities: getEffectivePermissions(state, access, { nursingHomeId: pathway.nursingHomeId, wardId: pathway.wardId }), occurredAt: now, correlationId: `eol-activate:${pathwayId}:${now}`, residentExists: (id) => state.residents.some((item) => item.id === id), residentBelongsToHome: (id, homeId) => state.residents.some((item) => item.id === id && (item.facilityId || activeFacilityId) === homeId) };
          const next = structuredClone(state.endOfLifeState);
          activateEndOfLifeCare(next, pathwayId, { effectiveAt: now, clinicalBasis, reasonCode: "authorised_clinical_activation" }, context);
          return { ...state, endOfLifeState: next };
        });
      },
      markResidentLastDaysOfLife: (pathwayId, clinicalBasis) => {
        const now = new Date().toISOString();
        setStore((state) => {
          const pathway = state.endOfLifeState.pathways.find((item) => item.id === pathwayId);
          if (!pathway) throw new Error("End-of-Life pathway not found.");
          const access = createStaffAccessContext(currentUser, pathway.nursingHomeId, pathway.wardId);
          const context: EndOfLifeContext = { userAccountId: currentUser.id, staffMemberId: access.staffMemberId, nursingHomeId: pathway.nursingHomeId, wardId: pathway.wardId, capabilities: getEffectivePermissions(state, access, { nursingHomeId: pathway.nursingHomeId, wardId: pathway.wardId }), occurredAt: now, correlationId: `eol-last-days:${pathwayId}:${now}`, residentExists: (id) => state.residents.some((item) => item.id === id), residentBelongsToHome: (id, homeId) => state.residents.some((item) => item.id === id && (item.facilityId || activeFacilityId) === homeId) };
          const next = structuredClone(state.endOfLifeState);
          markLastDaysOfLife(next, pathwayId, { effectiveAt: now, clinicalBasis, reasonCode: "authorised_clinical_review" }, context);
          return { ...state, endOfLifeState: next };
        });
      },
      recordResidentDeathInPathway: (pathwayId, observedBy) => {
        const now = new Date().toISOString();
        setStore((state) => {
          const pathway = state.endOfLifeState.pathways.find((item) => item.id === pathwayId);
          if (!pathway) throw new Error("End-of-Life pathway not found.");
          const access = createStaffAccessContext(currentUser, pathway.nursingHomeId, pathway.wardId);
          const context: EndOfLifeContext = { userAccountId: currentUser.id, staffMemberId: access.staffMemberId, nursingHomeId: pathway.nursingHomeId, wardId: pathway.wardId, capabilities: getEffectivePermissions(state, access, { nursingHomeId: pathway.nursingHomeId, wardId: pathway.wardId }), occurredAt: now, correlationId: `eol-death:${pathwayId}:${now}`, residentExists: (id) => state.residents.some((item) => item.id === id), residentBelongsToHome: (id, homeId) => state.residents.some((item) => item.id === id && (item.facilityId || activeFacilityId) === homeId) };
          const next = structuredClone(state.endOfLifeState);
          recordResidentDeath(next, pathwayId, { deathObservedAt: now, observedBy, reasonCode: "death_observed" }, context);
          const reconciled = reconcileCareWorkAfterResidentDeath(state.problemInterventions, state.flexibleCareActionState.workItems, pathway.residentId, now);
          return { ...state, endOfLifeState: next, problemInterventions: reconciled.actions, flexibleCareActionState: { ...state.flexibleCareActionState, workItems: reconciled.workItems } };
        });
      },
      recordAuditEvent,
      getAuditForEntity: (entityType, entityId) => getAuditForEntity(scopedStore, entityType, entityId),
      getAuditForResident: (residentId) => getAuditForResident(scopedStore, residentId),
      getAuditForUser: (userAccountId) => getAuditForUser(scopedStore, userAccountId),
      getAuditForNursingHome: (nursingHomeId) => getAuditForNursingHome(scopedStore, nursingHomeId),
      getAuditForWard: (wardId) => getAuditForWard(scopedStore, wardId),
      searchAudit: (filters) => searchAudit(scopedStore, filters),
      validateAuditFramework: () => validateAuditFramework(store),
      eventStore: (store as typeof store & EventArchitectureState).eventStore || [],
      eventOutbox: (store as typeof store & EventArchitectureState).eventOutbox || [],
      eventProcessingReceipts: (store as typeof store & EventArchitectureState).eventProcessingReceipts || [],
      ruleDefinitions: (store as typeof store & RuleEngineState).ruleDefinitions || DEFAULT_RULE_DEFINITIONS,
      ruleDecisions: (store as typeof store & RuleEngineState).ruleDecisions || [],
      ruleProcessingReceipts: (store as typeof store & RuleEngineState).ruleProcessingReceipts || [],
      ruleGeneratedOutputs: (store as typeof store & RuleEngineState).ruleGeneratedOutputs || [],
      ruleIssues: (store as typeof store & RuleEngineState).ruleIssues || [],
      ruleIssueEpisodes: (store as typeof store & RuleEngineState).ruleIssueEpisodes || [],
      ruleIssueTransitions: (store as typeof store & RuleEngineState).ruleIssueTransitions || [],
      ruleRecalculationRequests: (store as typeof store & RuleEngineState).ruleRecalculationRequests || [],
      ruleRecalculationItems: (store as typeof store & RuleEngineState).ruleRecalculationItems || [],
      ruleOverrides: (store as typeof store & RuleEngineState).ruleOverrides || [],
      ruleSuppressions: (store as typeof store & RuleEngineState).ruleSuppressions || [],
      emitDomainEvent: (event) => setStore((s) => processRulesForEvent(appendEventRecord(s, event), event)),
      publishPendingDomainEvents: (handlers) => setStore((s) => publishPendingEvents(s, handlers)),
      evaluateRulesForEvent: (event) => evaluateEventAgainstRules(event, store),
      replayRuleForEvent: (ruleId, version, eventId) => replayRuleForEvent(store, ruleId, version, eventId),
      getApplicableRulesForEvent: (event) => getApplicableRules((store as typeof store & RuleEngineState).ruleDefinitions || DEFAULT_RULE_DEFINITIONS, event),
      acknowledgeRuleIssue: (issueId, note) => {
        const context: RuleIssueActionContext = {
          userAccountId: currentUser.id,
          staffMemberId: operationalContext.staffMemberId,
          nursingHomeId: operationalContext.nursingHomeId,
          wardId: operationalContext.wardIds[0],
          capabilities: ["rule_issue.view", "rule_issue.acknowledge", "rule_issue.escalate", "rule_issue.resolve", "rule_issue.dismiss", "rule_issue.reopen"],
          occurredAt: new Date().toISOString(),
        };
        setStore((s) => {
          const issue = ((s as typeof s & RuleEngineState).ruleIssues || []).find((item) => item.id === issueId);
          if (!issue) return s;
          const result = acknowledgeRuleIssue(issue, context, note);
          return {
            ...s,
            ruleIssues: ((s as typeof s & RuleEngineState).ruleIssues || []).map((item) => item.id === issueId ? result.issue : item),
            ruleIssueTransitions: result.transition ? [result.transition, ...((s as typeof s & RuleEngineState).ruleIssueTransitions || [])] : ((s as typeof s & RuleEngineState).ruleIssueTransitions || []),
          };
        });
      },
      escalateRuleIssue: (issueId, details) => {
        const context: RuleIssueActionContext = { userAccountId: currentUser.id, staffMemberId: operationalContext.staffMemberId, nursingHomeId: operationalContext.nursingHomeId, wardId: operationalContext.wardIds[0], capabilities: ["rule_issue.escalate"], occurredAt: new Date().toISOString() };
        setStore((s) => {
          const issue = ((s as typeof s & RuleEngineState).ruleIssues || []).find((item) => item.id === issueId);
          if (!issue) return s;
          const result = escalateRuleIssue(issue, context, details);
          return { ...s, ruleIssues: ((s as typeof s & RuleEngineState).ruleIssues || []).map((item) => item.id === issueId ? result.issue : item), ruleIssueTransitions: [result.transition, ...((s as typeof s & RuleEngineState).ruleIssueTransitions || [])] };
        });
      },
      resolveRuleIssue: (issueId, details) => {
        const context: RuleIssueActionContext = { userAccountId: currentUser.id, staffMemberId: operationalContext.staffMemberId, nursingHomeId: operationalContext.nursingHomeId, wardId: operationalContext.wardIds[0], capabilities: ["rule_issue.resolve"], occurredAt: new Date().toISOString() };
        setStore((s) => {
          const issue = ((s as typeof s & RuleEngineState).ruleIssues || []).find((item) => item.id === issueId);
          const episode = ((s as typeof s & RuleEngineState).ruleIssueEpisodes || []).find((item) => item.id === issue?.currentEpisodeId);
          if (!issue || !episode) return s;
          const result = resolveRuleIssue(issue, episode, context, details);
          return { ...s, ruleIssues: ((s as typeof s & RuleEngineState).ruleIssues || []).map((item) => item.id === issueId ? result.issue : item), ruleIssueEpisodes: ((s as typeof s & RuleEngineState).ruleIssueEpisodes || []).map((item) => item.id === episode.id ? result.episode : item), ruleIssueTransitions: [result.transition, ...((s as typeof s & RuleEngineState).ruleIssueTransitions || [])] };
        });
      },
      dismissRuleIssue: (issueId, details) => {
        const context: RuleIssueActionContext = { userAccountId: currentUser.id, staffMemberId: operationalContext.staffMemberId, nursingHomeId: operationalContext.nursingHomeId, wardId: operationalContext.wardIds[0], capabilities: ["rule_issue.dismiss"], occurredAt: new Date().toISOString() };
        setStore((s) => {
          const issue = ((s as typeof s & RuleEngineState).ruleIssues || []).find((item) => item.id === issueId);
          const episode = ((s as typeof s & RuleEngineState).ruleIssueEpisodes || []).find((item) => item.id === issue?.currentEpisodeId);
          if (!issue || !episode) return s;
          const result = dismissRuleIssue(issue, episode, context, details);
          return { ...s, ruleIssues: ((s as typeof s & RuleEngineState).ruleIssues || []).map((item) => item.id === issueId ? result.issue : item), ruleIssueEpisodes: ((s as typeof s & RuleEngineState).ruleIssueEpisodes || []).map((item) => item.id === episode.id ? result.episode : item), ruleIssueTransitions: [result.transition, ...((s as typeof s & RuleEngineState).ruleIssueTransitions || [])] };
        });
      },
      getEventById: (eventId) => getEventById(store, eventId),
      getEventsByCorrelationId: (correlationId) => getEventsByCorrelationId(store, correlationId),
      getEventsForResident: (residentId) => getEventsForResident(store, residentId),
      getEventsForEntity: (entityType, entityId) => getEventsForEntity(store, entityType, entityId),
      getFailedEvents: () => getFailedEvents(store),
      getDeadLetterEvents: () => getDeadLetterEvents(store),
      getProcessingReceipts: (eventId) => getProcessingReceipts(store, eventId),
      validateDomainEvent: (event) => validateDomainEvent(event, store),
      operationalContext,
      getConfiguredShifts: (nursingHomeId) => getConfiguredShifts(store, nursingHomeId || activeFacilityId),
      getCurrentShift: (nursingHomeId, dateTime) => getCurrentShift(store, nursingHomeId || activeFacilityId, dateTime),
      getShiftById: (shiftId) => getShiftById(store, shiftId),
      getShiftDateRange,
      getOperationalTimeWindows,
      getNextShift: (shiftId, operationalDate) =>
        getNextShift(store, operationalContext.nursingHomeId, shiftId || operationalContext.shiftId, operationalDate || operationalContext.operationalDate),
      getPreviousShift: (shiftId, operationalDate) =>
        getPreviousShift(store, operationalContext.nursingHomeId, shiftId || operationalContext.shiftId, operationalDate || operationalContext.operationalDate),
      canSwitchToWard: (wardId) => canSwitchToWard(store, operationalContext, wardId),
      canSelectMultipleWards: () => canSelectMultipleWards(store, operationalContext),
      switchNursingHome: (nursingHomeId) => {
        const nextContext = switchNursingHome(store, operationalContext, nursingHomeId);
        setActiveFacilityId(nursingHomeId);
        setStore((s) => ({
          ...s,
          operationalContexts: [
            nextContext,
            ...s.operationalContexts.filter((context) => context.userAccountId !== nextContext.userAccountId),
          ],
        }));
      },
      selectSingleWard: (wardId) => {
        const nextContext = selectSingleWard(store, operationalContext, wardId);
        setStore((s) => ({
          ...s,
          operationalContexts: [
            nextContext,
            ...s.operationalContexts.filter((context) => context.userAccountId !== nextContext.userAccountId),
          ],
        }));
      },
      selectMultipleWards: (wardIds) => {
        const nextContext = selectMultipleWards(store, operationalContext, wardIds);
        setStore((s) => ({
          ...s,
          operationalContexts: [
            nextContext,
            ...s.operationalContexts.filter((context) => context.userAccountId !== nextContext.userAccountId),
          ],
        }));
      },
      selectAllAuthorisedWards: () => {
        const nextContext = selectAllAuthorisedWards(store, operationalContext);
        setStore((s) => ({
          ...s,
          operationalContexts: [
            nextContext,
            ...s.operationalContexts.filter((context) => context.userAccountId !== nextContext.userAccountId),
          ],
        }));
      },
      setOperationalShift: (shiftId) => {
        const nextContext = initialiseOperationalContext(store, {
          userAccountId: operationalContext.userAccountId,
          nursingHomeId: operationalContext.nursingHomeId,
          wardIds: operationalContext.wardIds,
          wardSelectionMode: operationalContext.wardSelectionMode,
          shiftId,
          operationalDate: operationalContext.operationalDate,
          source: "manual_override",
        });
        setStore((s) => ({
          ...s,
          operationalContexts: [
            nextContext,
            ...s.operationalContexts.filter((context) => context.userAccountId !== nextContext.userAccountId),
          ],
        }));
      },
      setOperationalDate: (date) => {
        const nextContext = initialiseOperationalContext(store, {
          userAccountId: operationalContext.userAccountId,
          nursingHomeId: operationalContext.nursingHomeId,
          wardIds: operationalContext.wardIds,
          wardSelectionMode: operationalContext.wardSelectionMode,
          shiftId: operationalContext.shiftId,
          operationalDate: date,
          source: "manual_override",
        });
        setStore((s) => ({
          ...s,
          operationalContexts: [
            nextContext,
            ...s.operationalContexts.filter((context) => context.userAccountId !== nextContext.userAccountId),
          ],
        }));
      },
      getResidentsForContext: () => getResidentsForContext(store, operationalContext),
      getTasksDueForContext: () => getTasksDueForContext(store, operationalContext),
      getAlertsForContext: () => getAlertsForContext(store, operationalContext),
      getCareActionsForContext: () => getCareActionsForContext(store, operationalContext),
      getObservationsForOperationalContext: () => getObservationsForOperationalContext(store, operationalContext) as ClinicalObservation[],
      getHandoversForContext: () => getHandoversForContext(store, operationalContext) as HandoverNote[],
      getHandoversForOperationalContext: (filters) =>
        getContextualHandovers(
          store,
          operationalContext,
          {
            userAccountId: currentUser.id,
            staffMemberId: operationalContext.staffMemberId,
            role: currentRole,
            userName: currentUserName,
          } as any,
          filters,
        ),
      getIncidentsForContext: () => getIncidentsForContext(store, operationalContext) as Incident[],
      validateOperationalContext: () => validateOperationalContext(store),
      validateShiftDefinitions: () => validateShiftDefinitions(store),
      validateWardShiftContext: () => validateWardShiftContext(store),
      updateUser: (id, patch) =>
        setStore((s) => ({
          ...s,
          users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        })),
      createStaffUser: (input) => {
        if (currentRole !== "don" && currentRole !== "group_owner") {
          throw new Error("Only a DON or Group Owner can create staff logins.");
        }
        const linkedStaff = input.staffMemberId ? store.staffMembers.find((staff) => String(staff.id) === input.staffMemberId) : undefined;
        if (input.staffMemberId && !linkedStaff) {
          throw new Error("The Staff Member could not be loaded.");
        }
        if (linkedStaff?.linkedUserAccountId || store.userAccounts.some((account) => input.staffMemberId && String(account.staffMemberId || "") === input.staffMemberId)) {
          throw new Error("This Staff Member already has a User Account.");
        }
        if (store.users.some((user) => (user.email || "").trim().toLowerCase() === input.email.trim().toLowerCase()) || store.userAccounts.some((account) => (account.email || account.username || "").trim().toLowerCase() === input.email.trim().toLowerCase())) {
          throw new Error("This email address is already linked to another User Account.");
        }
        const existingDon = store.users.some(
          (user) =>
            user.role === "don" &&
            userFacilityIds(user).includes(activeFacilityId),
        );
        if (input.role === "don" && existingDon) {
          throw new Error("This nursing home already has a DON.");
        }
        const now = new Date().toISOString();
        const userId = `u-${activeFacilityId.replace("facility-", "")}-${uid()}`;
        const accountId = `user-account-${userId}`;
        const staffUser: UserProfile = {
          id: userId,
          facilityId: activeFacilityId,
          facilityIds: [activeFacilityId],
          name: input.name.trim(),
          role: input.role,
          email: input.email.trim(),
          phone: "",
          department:
            input.role === "doctor"
              ? "Medical"
              : input.role === "don" || input.role === "cnm"
                ? "Management"
                : input.role === "nurse"
                  ? "Nursing"
                  : "Care",
          assignedWings: [],
          employeeNumber: `${activeFacilityId === HAZELWOOD_FACILITY_ID ? "HZ" : "BH"}-${String(store.users.length + 1).padStart(4, "0")}`,
          startDate: now.slice(0, 10),
          lastLogin: now,
          status: input.status,
          avatarSeed: input.name.replace(/\s+/g, ""),
          notificationPrefs: { email: true, sms: false, inApp: true, criticalAlertsOnly: false },
        };
        const userAccount: UserAccount = {
          id: accountId as any,
          email: input.email.trim(),
          username: input.email.trim(),
          authenticationProvider: "local",
          staffMemberId: input.staffMemberId as any,
          accountStatus: input.accountStatus || (input.status === "invited" ? "invited" : input.status === "inactive" ? "disabled" : "active"),
          defaultNursingHomeId: activeFacilityId as any,
          createdAt: now,
          updatedAt: now,
          createdBy: currentUser.id as any,
          updatedBy: currentUser.id as any,
        };
        const linkEvent = input.staffMemberId
          ? createStaffDirectoryEvent({
              type: "StaffMemberUserAccountLinked",
              staffMemberId: input.staffMemberId,
              nursingHomeId: linkedStaff?.primaryNursingHomeId ? String(linkedStaff.primaryNursingHomeId) : activeFacilityId,
              actorUserAccountId: currentUser.id,
              actorRole: currentRole,
              changedFields: ["linkedUserAccountId"],
              occurredAt: now,
            })
          : undefined;
        setStore((s) => ({
          ...s,
          users: [staffUser, ...s.users],
          userAccounts: [userAccount, ...s.userAccounts],
          staffMembers: input.staffMemberId
            ? s.staffMembers.map((staff) => String(staff.id) === input.staffMemberId ? { ...staff, linkedUserAccountId: userAccount.id, updatedAt: now, updatedBy: currentUser.id as any } : staff)
            : s.staffMembers,
          staffDirectoryEvents: linkEvent ? [linkEvent, ...(s.staffDirectoryEvents || [])] : s.staffDirectoryEvents,
        }));
        logAudit({
          facilityId: activeFacilityId,
          user: currentUserName,
          role: currentRole,
          action: "Created staff account",
          entity: staffUser.id,
          entityType: "user_account",
          after: JSON.stringify({ role: staffUser.role, user: staffUser.name, staffMemberId: input.staffMemberId, accountStatus: userAccount.accountStatus }),
        });
        return staffUser;
      },
      createStaffMember: (input) => {
        if (!canAccess(store, createStaffAccessContext(currentUser, input.primaryNursingHomeId || activeFacilityId), "staff_directory.create", { nursingHomeId: input.primaryNursingHomeId || activeFacilityId })) {
          throw new Error("You do not have access to manage staff for this Nursing Home.");
        }
        const staff = createStaffMemberRecord(store, { ...input, primaryNursingHomeId: input.primaryNursingHomeId || activeFacilityId }, currentUser.id);
        const now = new Date().toISOString();
        const event = createStaffDirectoryEvent({
          type: "StaffMemberCreated",
          staffMemberId: String(staff.id),
          enterpriseId: staff.enterpriseId ? String(staff.enterpriseId) : undefined,
          nursingHomeId: staff.primaryNursingHomeId ? String(staff.primaryNursingHomeId) : undefined,
          actorUserAccountId: currentUser.id,
          actorRole: currentRole,
          changedFields: ["staffNumber", "firstName", "surname", "status", "primaryNursingHomeId"],
          occurredAt: now,
        });
        setStore((s) => ({
          ...s,
          staffMembers: [staff, ...s.staffMembers],
          staffDirectoryEvents: [event, ...(s.staffDirectoryEvents || [])],
          auditLogs: [{
            id: uid(),
            facilityId: staff.primaryNursingHomeId ? String(staff.primaryNursingHomeId) : activeFacilityId,
            user: currentUserName,
            role: currentRole,
            action: "Staff Member created",
            entity: String(staff.id),
            entityType: "staff_member",
            timestamp: now,
            after: JSON.stringify({ staffNumber: staff.staffNumber, displayName: staff.displayName, status: staff.status }),
          }, ...s.auditLogs].slice(0, 500),
        }));
        return staff;
      },
      updateStaffMember: (id, input) => {
        const existing = store.staffMembers.find((staff) => String(staff.id) === id);
        if (!existing) throw new Error("The Staff Member could not be saved.");
        if (!canAccess(store, createStaffAccessContext(currentUser, input.primaryNursingHomeId || String(existing.primaryNursingHomeId || activeFacilityId)), "staff_directory.edit", { nursingHomeId: input.primaryNursingHomeId || String(existing.primaryNursingHomeId || activeFacilityId) })) {
          throw new Error("You do not have access to manage staff for this Nursing Home.");
        }
        const next = updateStaffMemberRecord(store, existing, input, currentUser.id);
        const now = new Date().toISOString();
        const changedFields = Object.keys(input).filter((key) => key !== "clientRequestId");
        const event = createStaffDirectoryEvent({
          type: existing.primaryNursingHomeId !== next.primaryNursingHomeId ? "StaffMemberPrimaryHomeChanged" : "StaffMemberUpdated",
          staffMemberId: String(next.id),
          enterpriseId: next.enterpriseId ? String(next.enterpriseId) : undefined,
          nursingHomeId: next.primaryNursingHomeId ? String(next.primaryNursingHomeId) : undefined,
          actorUserAccountId: currentUser.id,
          actorRole: currentRole,
          changedFields,
          occurredAt: now,
        });
        setStore((s) => ({
          ...s,
          staffMembers: s.staffMembers.map((staff) => (String(staff.id) === id ? next : staff)),
          staffDirectoryEvents: [event, ...(s.staffDirectoryEvents || [])],
          auditLogs: [{
            id: uid(),
            facilityId: next.primaryNursingHomeId ? String(next.primaryNursingHomeId) : activeFacilityId,
            user: currentUserName,
            role: currentRole,
            action: "Staff Member updated",
            entity: id,
            entityType: "staff_member",
            timestamp: now,
            before: JSON.stringify({ staffNumber: existing.staffNumber, displayName: existing.displayName, status: existing.status, primaryNursingHomeId: existing.primaryNursingHomeId }),
            after: JSON.stringify({ staffNumber: next.staffNumber, displayName: next.displayName, status: next.status, primaryNursingHomeId: next.primaryNursingHomeId }),
          }, ...s.auditLogs].slice(0, 500),
        }));
      },
      changeStaffMemberStatus: (id, status, reason) => {
        const existing = store.staffMembers.find((staff) => String(staff.id) === id);
        if (!existing) throw new Error("The Staff Member could not be saved.");
        if (!canAccess(store, createStaffAccessContext(currentUser, String(existing.primaryNursingHomeId || activeFacilityId)), "staff_directory.change_status", { nursingHomeId: String(existing.primaryNursingHomeId || activeFacilityId) })) {
          throw new Error("You do not have access to manage staff for this Nursing Home.");
        }
        const next = updateStaffMemberRecord(store, existing, { status }, currentUser.id);
        const now = new Date().toISOString();
        const event = createStaffDirectoryEvent({
          type: "StaffMemberStatusChanged",
          staffMemberId: id,
          enterpriseId: next.enterpriseId ? String(next.enterpriseId) : undefined,
          nursingHomeId: next.primaryNursingHomeId ? String(next.primaryNursingHomeId) : undefined,
          actorUserAccountId: currentUser.id,
          actorRole: currentRole,
          changedFields: ["status", "active"],
          previousStatus: existing.status,
          newStatus: status,
          occurredAt: now,
        });
        setStore((s) => ({
          ...s,
          staffMembers: s.staffMembers.map((staff) => (String(staff.id) === id ? next : staff)),
          staffDirectoryEvents: [event, ...(s.staffDirectoryEvents || [])],
          auditLogs: [{
            id: uid(),
            facilityId: next.primaryNursingHomeId ? String(next.primaryNursingHomeId) : activeFacilityId,
            user: currentUserName,
            role: currentRole,
            action: "Staff Member status changed",
            entity: id,
            entityType: "staff_member",
            timestamp: now,
            before: existing.status,
            after: status,
            reason,
          }, ...s.auditLogs].slice(0, 500),
        }));
      },
      updateStaffPhoto: (id, photoUrl) => {
        const existing = store.staffMembers.find((staff) => String(staff.id) === id);
        if (!existing) throw new Error("The Staff Member could not be saved.");
        if (!canAccess(store, createStaffAccessContext(currentUser, String(existing.primaryNursingHomeId || activeFacilityId)), "staff_directory.upload_photo", { nursingHomeId: String(existing.primaryNursingHomeId || activeFacilityId) })) {
          throw new Error("You do not have access to manage staff for this Nursing Home.");
        }
        const next = { ...existing, photoUrl, updatedAt: new Date().toISOString(), updatedBy: currentUser.id as any };
        const event = createStaffDirectoryEvent({ type: "StaffMemberPhotoChanged", staffMemberId: id, nursingHomeId: next.primaryNursingHomeId ? String(next.primaryNursingHomeId) : undefined, actorUserAccountId: currentUser.id, actorRole: currentRole, changedFields: ["photoUrl"], occurredAt: next.updatedAt });
        setStore((s) => ({ ...s, staffMembers: s.staffMembers.map((staff) => (String(staff.id) === id ? next : staff)), staffDirectoryEvents: [event, ...(s.staffDirectoryEvents || [])] }));
      },
      linkStaffUserAccount: (staffMemberId, userAccountId) => {
        const staff = store.staffMembers.find((item) => String(item.id) === staffMemberId);
        const account = store.userAccounts.find((item) => String(item.id) === userAccountId);
        if (!staff || !account) throw new Error("The Staff Member could not be saved.");
        if (store.staffMembers.some((item) => String(item.id) !== staffMemberId && String(item.linkedUserAccountId || "") === userAccountId)) {
          throw new Error("This User Account is already linked to another Staff Member.");
        }
        const now = new Date().toISOString();
        const event = createStaffDirectoryEvent({ type: "StaffMemberUserAccountLinked", staffMemberId, nursingHomeId: staff.primaryNursingHomeId ? String(staff.primaryNursingHomeId) : undefined, actorUserAccountId: currentUser.id, actorRole: currentRole, changedFields: ["linkedUserAccountId"], occurredAt: now });
        setStore((s) => ({
          ...s,
          staffMembers: s.staffMembers.map((item) => String(item.id) === staffMemberId ? { ...item, linkedUserAccountId: userAccountId as any, updatedAt: now, updatedBy: currentUser.id as any } : item),
          userAccounts: s.userAccounts.map((item) => String(item.id) === userAccountId ? { ...item, staffMemberId: staffMemberId as any, updatedAt: now, updatedBy: currentUser.id as any } : item),
          staffDirectoryEvents: [event, ...(s.staffDirectoryEvents || [])],
        }));
      },
      unlinkStaffUserAccount: (staffMemberId) => {
        const staff = store.staffMembers.find((item) => String(item.id) === staffMemberId);
        if (!staff) throw new Error("The Staff Member could not be saved.");
        const now = new Date().toISOString();
        const event = createStaffDirectoryEvent({ type: "StaffMemberUserAccountUnlinked", staffMemberId, nursingHomeId: staff.primaryNursingHomeId ? String(staff.primaryNursingHomeId) : undefined, actorUserAccountId: currentUser.id, actorRole: currentRole, changedFields: ["linkedUserAccountId"], occurredAt: now });
        setStore((s) => ({
          ...s,
          staffMembers: s.staffMembers.map((item) => String(item.id) === staffMemberId ? { ...item, linkedUserAccountId: undefined, updatedAt: now, updatedBy: currentUser.id as any } : item),
          userAccounts: s.userAccounts.map((item) => String(item.staffMemberId || "") === staffMemberId ? { ...item, staffMemberId: undefined, updatedAt: now, updatedBy: currentUser.id as any } : item),
          staffDirectoryEvents: [event, ...(s.staffDirectoryEvents || [])],
        }));
      },
      addStaffEmergencyContact: (staffMemberId, input) => {
        if (!input.fullName.trim() || !input.phoneNumber.trim()) throw new Error("The Staff Member could not be saved.");
        const staff = store.staffMembers.find((item) => String(item.id) === staffMemberId);
        if (!staff) throw new Error("The Staff Member could not be saved.");
        const now = new Date().toISOString();
        const contact: StaffEmergencyContact = { ...input, id: `sec-${uid()}`, staffMemberId: staffMemberId as any, createdAt: now, updatedAt: now };
        const event = createStaffDirectoryEvent({ type: "StaffEmergencyContactAdded", staffMemberId, nursingHomeId: staff.primaryNursingHomeId ? String(staff.primaryNursingHomeId) : undefined, actorUserAccountId: currentUser.id, actorRole: currentRole, changedFields: ["emergencyContacts"], occurredAt: now });
        setStore((s) => ({
          ...s,
          staffEmergencyContacts: [contact, ...(input.isPrimary ? s.staffEmergencyContacts.map((item) => String(item.staffMemberId) === staffMemberId ? { ...item, isPrimary: false } : item) : s.staffEmergencyContacts)],
          staffDirectoryEvents: [event, ...(s.staffDirectoryEvents || [])],
        }));
        return contact;
      },
      updateStaffEmergencyContact: (staffMemberId, contactId, patch) => {
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          staffEmergencyContacts: s.staffEmergencyContacts.map((item) => String(item.staffMemberId) === staffMemberId && item.id === contactId ? { ...item, ...patch, id: item.id, staffMemberId: item.staffMemberId, updatedAt: now } : patch.isPrimary && String(item.staffMemberId) === staffMemberId ? { ...item, isPrimary: false, updatedAt: now } : item),
          staffDirectoryEvents: [createStaffDirectoryEvent({ type: "StaffEmergencyContactUpdated", staffMemberId, actorUserAccountId: currentUser.id, actorRole: currentRole, changedFields: Object.keys(patch), occurredAt: now }), ...(s.staffDirectoryEvents || [])],
        }));
      },
      setPrimaryStaffEmergencyContact: (staffMemberId, contactId) => {
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          staffEmergencyContacts: s.staffEmergencyContacts.map((item) => String(item.staffMemberId) === staffMemberId ? { ...item, isPrimary: item.id === contactId, updatedAt: now } : item),
          staffDirectoryEvents: [createStaffDirectoryEvent({ type: "StaffEmergencyContactPrimaryChanged", staffMemberId, actorUserAccountId: currentUser.id, actorRole: currentRole, changedFields: ["isPrimary"], occurredAt: now }), ...(s.staffDirectoryEvents || [])],
        }));
      },
      inactivateStaffEmergencyContact: (staffMemberId, contactId) => {
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          staffEmergencyContacts: s.staffEmergencyContacts.map((item) => String(item.staffMemberId) === staffMemberId && item.id === contactId ? { ...item, active: false, isPrimary: false, updatedAt: now } : item),
          staffDirectoryEvents: [createStaffDirectoryEvent({ type: "StaffEmergencyContactInactivated", staffMemberId, actorUserAccountId: currentUser.id, actorRole: currentRole, changedFields: ["active"], occurredAt: now }), ...(s.staffDirectoryEvents || [])],
        }));
      },
      createEmploymentRecord: (input) => {
        const record = createEmploymentRecord(store, input, currentUser.id);
        const now = new Date().toISOString();
        const homeAssignment: EmploymentHomeAssignment | undefined = record.primaryNursingHomeId ? {
          id: `employment-home-assignment-${uid()}`,
          employmentRecordId: record.id,
          staffMemberId: record.staffMemberId,
          nursingHomeId: record.primaryNursingHomeId,
          assignmentType: "primary",
          status: "active",
          effectiveFrom: record.startDate,
          isPrimary: true,
          fteAtHome: record.fteValue,
          contractedHoursPerWeekAtHome: record.contractedHoursPerWeek,
          createdAt: now,
          updatedAt: now,
          createdByUserAccountId: currentUser.id as any,
        } : undefined;
        const roleAssignment: EmploymentRoleAssignment | undefined = record.primaryRoleKey ? {
          id: `employment-role-assignment-${uid()}`,
          employmentRecordId: record.id,
          staffMemberId: record.staffMemberId,
          roleKey: record.primaryRoleKey,
          nursingHomeId: record.primaryNursingHomeId,
          assignmentType: "primary",
          status: "active",
          effectiveFrom: record.startDate,
          isPrimary: true,
          fteForRole: record.fteValue,
          contractedHoursPerWeekForRole: record.contractedHoursPerWeek,
          createdAt: now,
          updatedAt: now,
          createdByUserAccountId: currentUser.id as any,
        } : undefined;
        const event: WorkforceEmploymentEvent = { id: `employment-event-${uid()}`, type: "EmploymentRecordCreated", employmentRecordId: record.id, staffMemberId: record.staffMemberId, actorUserAccountId: currentUser.id, occurredAt: now, changedFields: ["employeeNumber", "contractType", "status", "startDate", "primaryNursingHomeId", "primaryRoleKey"] };
        setStore((s) => ({
          ...s,
          employmentRecords: [record, ...s.employmentRecords],
          employmentHomeAssignments: homeAssignment ? [homeAssignment, ...s.employmentHomeAssignments] : s.employmentHomeAssignments,
          employmentRoleAssignments: roleAssignment ? [roleAssignment, ...s.employmentRoleAssignments] : s.employmentRoleAssignments,
          workforceEmploymentEvents: [event, ...(s.workforceEmploymentEvents || [])],
          auditLogs: [{ id: uid(), facilityId: record.primaryNursingHomeId ? String(record.primaryNursingHomeId) : activeFacilityId, user: currentUserName, role: currentRole, action: "Employment Record created", entity: String(record.id), entityType: "employment_record", timestamp: now, after: JSON.stringify({ employeeNumber: record.employeeNumber, status: record.status }) }, ...s.auditLogs].slice(0, 500),
        }));
        return record;
      },
      updateEmploymentRecord: (id, input) => {
        const current = store.employmentRecords.find((record) => String(record.id) === id);
        if (!current) throw new Error("The Employment Record could not be loaded.");
        const next = updateEmploymentRecordService(store, current, input, currentUser.id);
        const now = new Date().toISOString();
        const event: WorkforceEmploymentEvent = { id: `employment-event-${uid()}`, type: input.status && input.status !== current.status ? "EmploymentRecordStatusChanged" : "EmploymentRecordUpdated", employmentRecordId: next.id, staffMemberId: next.staffMemberId, actorUserAccountId: currentUser.id, occurredAt: now, changedFields: Object.keys(input) };
        setStore((s) => ({ ...s, employmentRecords: s.employmentRecords.map((record) => String(record.id) === id ? next : record), workforceEmploymentEvents: [event, ...(s.workforceEmploymentEvents || [])] }));
      },
      createProfessionalRegistration: (input) => {
        const registration = createProfessionalRegistration(store, input, currentUser.id);
        const now = new Date().toISOString();
        const event: ProfessionalRegistrationEvent = { id: `professional-registration-event-${uid()}`, type: "ProfessionalRegistrationCreated", registrationId: registration.id, staffMemberId: registration.staffMemberId, employmentRecordId: registration.employmentRecordId, actorUserAccountId: currentUser.id, occurredAt: now, changedFields: ["registrationBody", "profession", "registrationNumber", "expiryDate", "verificationStatus"] };
        setStore((s) => ({
          ...s,
          professionalRegistrations: [registration, ...s.professionalRegistrations],
          professionalRegistrationEvents: [event, ...(s.professionalRegistrationEvents || [])],
          auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Professional Registration created", entity: String(registration.id), entityType: "professional_registration", timestamp: now, after: JSON.stringify({ body: registration.registrationBody, profession: registration.profession, expiryDate: registration.expiryDate }) }, ...s.auditLogs].slice(0, 500),
        }));
        return registration;
      },
      updateProfessionalRegistration: (id, input) => {
        const current = store.professionalRegistrations.find((record) => String(record.id) === id);
        if (!current) throw new Error("The Professional Registration could not be loaded.");
        const next = updateProfessionalRegistrationService(store, current, input, currentUser.id);
        const now = new Date().toISOString();
        const event: ProfessionalRegistrationEvent = { id: `professional-registration-event-${uid()}`, type: "ProfessionalRegistrationUpdated", registrationId: next.id, staffMemberId: next.staffMemberId, employmentRecordId: next.employmentRecordId, actorUserAccountId: currentUser.id, occurredAt: now, changedFields: Object.keys(input) };
        setStore((s) => ({ ...s, professionalRegistrations: s.professionalRegistrations.map((record) => String(record.id) === id ? next : record), professionalRegistrationEvents: [event, ...(s.professionalRegistrationEvents || [])] }));
      },
      submitProfessionalRegistrationVerification: (id) => {
        const current = store.professionalRegistrations.find((record) => String(record.id) === id);
        if (!current) throw new Error("The Professional Registration could not be loaded.");
        const next = appendRegistrationVerification(current, "submitted", currentUser.id);
        setStore((s) => ({ ...s, professionalRegistrations: s.professionalRegistrations.map((record) => String(record.id) === id ? next : record) }));
      },
      verifyProfessionalRegistration: (id, notes) => {
        const current = store.professionalRegistrations.find((record) => String(record.id) === id);
        if (!current) throw new Error("The Professional Registration could not be loaded.");
        const next = appendRegistrationVerification({ ...current, status: "current" }, "verified", currentUser.id, notes);
        setStore((s) => ({ ...s, professionalRegistrations: s.professionalRegistrations.map((record) => String(record.id) === id ? next : record) }));
      },
      failProfessionalRegistrationVerification: (id, notes) => {
        const current = store.professionalRegistrations.find((record) => String(record.id) === id);
        if (!current) throw new Error("The Professional Registration could not be loaded.");
        const next = appendRegistrationVerification(current, "failed", currentUser.id, notes);
        setStore((s) => ({ ...s, professionalRegistrations: s.professionalRegistrations.map((record) => String(record.id) === id ? next : record) }));
      },
      createStaffDocument: (input) => {
        const document = createStaffDocument(store, input, currentUser.id);
        const now = new Date().toISOString();
        const event: StaffDocumentEvent = {
          id: `staff-document-event-${uid()}`,
          type: "StaffDocumentCreated",
          staffDocumentId: document.id,
          staffMemberId: document.staffMemberId,
          employmentRecordId: document.employmentRecordId,
          documentTypeId: document.documentTypeId,
          safeStatus: document.status,
          verificationStatus: document.verificationStatus,
          expiryDate: document.expiryDate,
          reviewDate: document.reviewDate,
          actorUserAccountId: currentUser.id,
          occurredAt: now,
          correlationId: input.clientRequestId,
        };
        setStore((s) => ({
          ...s,
          staffDocuments: [document, ...s.staffDocuments],
          staffDocumentEvents: [event, ...(s.staffDocumentEvents || [])],
          auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Staff Document created", entity: String(document.id), entityType: "staff_document", timestamp: now, after: JSON.stringify({ documentTypeId: document.documentTypeId, status: document.status, verificationStatus: document.verificationStatus }) }, ...s.auditLogs].slice(0, 500),
        }));
        return document;
      },
      updateStaffDocument: (id, input) => {
        const current = store.staffDocuments.find((document) => String(document.id) === id);
        if (!current) throw new Error("The Staff Document could not be loaded.");
        const next = updateStaffDocument(store, current, input, currentUser.id);
        const now = new Date().toISOString();
        const event: StaffDocumentEvent = { id: `staff-document-event-${uid()}`, type: "StaffDocumentUpdated", staffDocumentId: next.id, staffMemberId: next.staffMemberId, employmentRecordId: next.employmentRecordId, documentTypeId: next.documentTypeId, safeStatus: next.status, verificationStatus: next.verificationStatus, expiryDate: next.expiryDate, reviewDate: next.reviewDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: input.clientRequestId || `staff-document-update-${id}-${now}` };
        setStore((s) => ({ ...s, staffDocuments: s.staffDocuments.map((document) => String(document.id) === id ? next : document), staffDocumentEvents: [event, ...(s.staffDocumentEvents || [])] }));
      },
      verifyStaffDocument: (id, notes) => {
        const current = store.staffDocuments.find((document) => String(document.id) === id);
        if (!current) throw new Error("The Staff Document could not be loaded.");
        const result = verifyStaffDocument(current, "verified", currentUser.id, notes);
        const now = new Date().toISOString();
        const event: StaffDocumentEvent = { id: `staff-document-event-${uid()}`, type: "StaffDocumentVerified", staffDocumentId: result.document.id, staffMemberId: result.document.staffMemberId, employmentRecordId: result.document.employmentRecordId, documentTypeId: result.document.documentTypeId, safeStatus: result.document.status, verificationStatus: result.document.verificationStatus, expiryDate: result.document.expiryDate, reviewDate: result.document.reviewDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `staff-document-verify-${id}-${now}` };
        setStore((s) => ({ ...s, staffDocuments: s.staffDocuments.map((document) => String(document.id) === id ? result.document : document), staffDocumentVerificationRecords: [result.verification, ...(s.staffDocumentVerificationRecords || [])], staffDocumentEvents: [event, ...(s.staffDocumentEvents || [])] }));
      },
      failStaffDocumentVerification: (id, notes) => {
        const current = store.staffDocuments.find((document) => String(document.id) === id);
        if (!current) throw new Error("The Staff Document could not be loaded.");
        const result = verifyStaffDocument(current, "failed", currentUser.id, notes);
        const now = new Date().toISOString();
        const event: StaffDocumentEvent = { id: `staff-document-event-${uid()}`, type: "StaffDocumentVerificationFailed", staffDocumentId: result.document.id, staffMemberId: result.document.staffMemberId, employmentRecordId: result.document.employmentRecordId, documentTypeId: result.document.documentTypeId, safeStatus: result.document.status, verificationStatus: result.document.verificationStatus, expiryDate: result.document.expiryDate, reviewDate: result.document.reviewDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `staff-document-fail-${id}-${now}` };
        setStore((s) => ({ ...s, staffDocuments: s.staffDocuments.map((document) => String(document.id) === id ? result.document : document), staffDocumentVerificationRecords: [result.verification, ...(s.staffDocumentVerificationRecords || [])], staffDocumentEvents: [event, ...(s.staffDocumentEvents || [])] }));
      },
      createStaffVisaRecord: (input) => {
        const record = createStaffVisaRecord(store, input, currentUser.id);
        const now = new Date().toISOString();
        const event: StaffImmigrationEvent = { id: `staff-immigration-event-${uid()}`, type: "StaffVisaCreated", recordType: "visa", recordId: record.id, staffMemberId: record.staffMemberId, employmentRecordId: record.employmentRecordId, safeStatus: record.status, verificationStatus: record.verificationStatus, expiryDate: record.expiryDate, reviewDate: record.reviewDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: input.clientRequestId };
        setStore((s) => ({ ...s, staffVisaRecords: [record, ...s.staffVisaRecords], staffImmigrationEvents: [event, ...(s.staffImmigrationEvents || [])], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Staff Visa record created", entity: String(record.id), entityType: "staff_immigration", timestamp: now, after: JSON.stringify({ visaTypeId: record.visaTypeId, status: record.status, expiryDate: record.expiryDate }) }, ...s.auditLogs].slice(0, 500) }));
        return record;
      },
      createResidencePermissionRecord: (input) => {
        const record = createResidencePermissionRecord(store, input, currentUser.id);
        const now = new Date().toISOString();
        const event: StaffImmigrationEvent = { id: `staff-immigration-event-${uid()}`, type: "ResidencePermissionCreated", recordType: "irish_residence_permission", recordId: record.id, staffMemberId: record.staffMemberId, employmentRecordId: record.employmentRecordId, safeStatus: record.status, verificationStatus: record.verificationStatus, expiryDate: record.expiryDate, reviewDate: record.reviewDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: input.clientRequestId };
        setStore((s) => ({ ...s, staffResidencePermissionRecords: [record, ...s.staffResidencePermissionRecords], staffImmigrationEvents: [event, ...(s.staffImmigrationEvents || [])], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Residence Permission record created", entity: String(record.id), entityType: "staff_immigration", timestamp: now, after: JSON.stringify({ status: record.status, expiryDate: record.expiryDate }) }, ...s.auditLogs].slice(0, 500) }));
        return record;
      },
      createEmploymentPermitRecord: (input) => {
        const record = createEmploymentPermitRecord(store, input, currentUser.id);
        const now = new Date().toISOString();
        const event: StaffImmigrationEvent = { id: `staff-immigration-event-${uid()}`, type: "EmploymentPermitCreated", recordType: "employment_permit", recordId: record.id, staffMemberId: record.staffMemberId, employmentRecordId: record.employmentRecordId, safeStatus: record.status, verificationStatus: record.verificationStatus, expiryDate: record.expiryDate, reviewDate: record.reviewDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: input.clientRequestId };
        setStore((s) => ({ ...s, staffEmploymentPermitRecords: [record, ...s.staffEmploymentPermitRecords], staffImmigrationEvents: [event, ...(s.staffImmigrationEvents || [])], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Employment Permit record created", entity: String(record.id), entityType: "staff_immigration", timestamp: now, after: JSON.stringify({ permitTypeId: record.permitTypeId, status: record.status, expiryDate: record.expiryDate }) }, ...s.auditLogs].slice(0, 500) }));
        return record;
      },
      verifyStaffVisaRecord: (id) => {
        const current = store.staffVisaRecords.find((record) => String(record.id) === id);
        if (!current) throw new Error("The Immigration record could not be loaded.");
        const next = verifyImmigrationRecord(current, currentUser.id);
        setStore((s) => ({ ...s, staffVisaRecords: s.staffVisaRecords.map((record) => String(record.id) === id ? next : record) }));
      },
      verifyResidencePermissionRecord: (id) => {
        const current = store.staffResidencePermissionRecords.find((record) => String(record.id) === id);
        if (!current) throw new Error("The Immigration record could not be loaded.");
        const next = verifyImmigrationRecord(current, currentUser.id);
        setStore((s) => ({ ...s, staffResidencePermissionRecords: s.staffResidencePermissionRecords.map((record) => String(record.id) === id ? next : record) }));
      },
      verifyEmploymentPermitRecord: (id) => {
        const current = store.staffEmploymentPermitRecords.find((record) => String(record.id) === id);
        if (!current) throw new Error("The Immigration record could not be loaded.");
        const next = verifyImmigrationRecord(current, currentUser.id);
        setStore((s) => ({ ...s, staffEmploymentPermitRecords: s.staffEmploymentPermitRecords.map((record) => String(record.id) === id ? next : record) }));
      },
      createTrainingCategory: (input) => {
        const now = new Date().toISOString();
        const code = input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || `category_${Date.now()}`;
        const category: TrainingCategory = { id: `training-category-${code}-${uid()}`, code, name: input.name.trim(), description: input.description, active: true, createdAt: now, updatedAt: now };
        setStore((s) => ({ ...s, trainingCategories: [category, ...((s as any).trainingCategories || [])], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Training Category created", entity: category.id, entityType: "training_category", timestamp: now, after: JSON.stringify({ name: category.name }) }, ...s.auditLogs].slice(0, 500) } as any));
        return category;
      },
      updateTrainingCategory: (id, input) => {
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, trainingCategories: ((s as any).trainingCategories || []).map((category: TrainingCategory) => category.id === id ? { ...category, ...input, updatedAt: now } : category), auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Training Category updated", entity: id, entityType: "training_category", timestamp: now, after: JSON.stringify(input) }, ...s.auditLogs].slice(0, 500) } as any));
      },
      createTrainingCourse: (input) => {
        const now = new Date().toISOString();
        const code = (input.code || input.title).trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
        if (store.trainingCourses.some((course) => course.title.trim().toLowerCase() === input.title.trim().toLowerCase() && course.status !== "entered_in_error")) throw new Error("This Course Title is already in use.");
        const course: TrainingCourse = {
          id: `training-course-${code.toLowerCase().replaceAll("_", "-")}-${uid()}`,
          code,
          title: input.title.trim(),
          description: input.description,
          category: input.category,
          mandatoryByDefault: input.mandatoryByDefault ?? false,
          deliveryMethods: input.deliveryMethods?.length ? input.deliveryMethods : ["classroom"],
          certificateRequired: input.certificateRequired ?? false,
          verificationRequired: input.verificationRequired ?? false,
          durationMinutes: input.durationMinutes,
          skillsToGain: input.skillsToGain || [],
          learningObjectives: input.learningObjectives || [],
          lessonSummary: input.lessonSummary,
          materialDocumentIds: input.materialDocumentIds || [],
          status: input.status || "draft",
          displayOrder: store.trainingCourses.length + 1,
          createdAt: now,
          updatedAt: now,
          createdByUserAccountId: currentUser.id as any,
          updatedByUserAccountId: currentUser.id as any,
        };
        const event: TrainingEvent = { id: `training-event-${uid()}`, type: "TrainingCourseCreated", trainingCourseId: course.id, safeStatus: course.status, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `training-course-create-${course.id}` };
        setStore((s) => ({ ...s, trainingCourses: [course, ...s.trainingCourses], trainingEvents: [event, ...(s.trainingEvents || [])], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Training Course created", entity: course.id, entityType: "training_course", timestamp: now, after: JSON.stringify({ title: course.title, status: course.status }) }, ...s.auditLogs].slice(0, 500) }));
        return course;
      },
      updateTrainingCourse: (id, input) => {
        const now = new Date().toISOString();
        const current = store.trainingCourses.find((course) => course.id === id);
        if (!current) throw new Error("The Course could not be saved.");
        const next = { ...current, ...input, updatedAt: now, updatedByUserAccountId: currentUser.id as any } as TrainingCourse;
        const eventType = current.status !== next.status && next.status === "active" ? "TrainingCourseActivated" : current.status !== next.status && next.status === "retired" ? "TrainingCourseRetired" : "TrainingCourseUpdated";
        const event: TrainingEvent = { id: `training-event-${uid()}`, type: eventType, trainingCourseId: next.id, safeStatus: next.status, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `training-course-update-${id}-${now}` };
        setStore((s) => ({ ...s, trainingCourses: s.trainingCourses.map((course) => course.id === id ? next : course), trainingEvents: [event, ...(s.trainingEvents || [])], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Training Course updated", entity: id, entityType: "training_course", timestamp: now, before: JSON.stringify({ status: current.status }), after: JSON.stringify({ status: next.status }) }, ...s.auditLogs].slice(0, 500) }));
      },
      duplicateTrainingCourse: (id) => {
        const current = store.trainingCourses.find((course) => course.id === id);
        if (!current) throw new Error("The Course could not be saved.");
        const now = new Date().toISOString();
        const course: TrainingCourse = {
          ...current,
          id: `training-course-${current.code.toLowerCase().replaceAll("_", "-")}-copy-${uid()}`,
          code: `${current.code}_COPY`,
          title: `${current.title} Copy`,
          status: "draft",
          displayOrder: store.trainingCourses.length + 1,
          createdAt: now,
          updatedAt: now,
          createdByUserAccountId: currentUser.id as any,
          updatedByUserAccountId: currentUser.id as any,
        };
        const event: TrainingEvent = { id: `training-event-${uid()}`, type: "TrainingCourseCreated", trainingCourseId: course.id, safeStatus: course.status, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `training-course-duplicate-${id}-${now}` };
        setStore((s) => ({ ...s, trainingCourses: [course, ...s.trainingCourses], trainingEvents: [event, ...(s.trainingEvents || [])] }));
        return course;
      },
      deleteTrainingCourse: (id) => {
        const current = store.trainingCourses.find((course) => course.id === id);
        if (!current) throw new Error("The Course could not be saved.");
        const linked = store.staffTrainingAssignments.some((assignment) => assignment.trainingCourseId === id) || store.staffTrainingCompletions.some((completion) => completion.trainingCourseId === id);
        if (current.status !== "draft" || linked) throw new Error("This Course cannot be deleted because Staff Training records are linked to it. Retire the Course instead.");
        setStore((s) => ({ ...s, trainingCourses: s.trainingCourses.filter((course) => course.id !== id) }));
      },
      assignTrainingToStaff: (input) => {
        const assignment = assignTrainingToStaff(store, input);
        const now = new Date().toISOString();
        const event: TrainingEvent = { id: `training-event-${uid()}`, type: "TrainingAssignmentCreated", staffMemberId: assignment.staffMemberId, employmentRecordId: assignment.employmentRecordId, trainingCourseId: assignment.trainingCourseId, trainingRequirementId: assignment.trainingRequirementId, trainingAssignmentId: assignment.id, safeStatus: assignment.status, dueDate: assignment.dueDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: input.clientRequestId };
        setStore((s) => ({ ...s, staffTrainingAssignments: [assignment, ...s.staffTrainingAssignments], trainingEvents: [event, ...(s.trainingEvents || [])], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Training Assignment created", entity: String(assignment.id), entityType: "training_assignment", timestamp: now, after: JSON.stringify({ trainingCourseId: assignment.trainingCourseId, dueDate: assignment.dueDate }) }, ...s.auditLogs].slice(0, 500) }));
        return assignment;
      },
      assignTrainingToMany: (input) => {
        const created: StaffTrainingAssignment[] = [];
        for (const staffMemberId of input.staffMemberIds) {
          const exists = store.staffTrainingAssignments.some((assignment) => String(assignment.staffMemberId) === String(staffMemberId) && assignment.trainingCourseId === input.trainingCourseId && !["cancelled", "entered_in_error", "completed"].includes(assignment.status));
          if (exists) continue;
          created.push(assignTrainingToStaff(store, { ...input, staffMemberId, clientRequestId: `${input.clientRequestId}-${staffMemberId}` }));
        }
        if (!created.length) return [];
        const now = new Date().toISOString();
        const events = created.map((assignment): TrainingEvent => ({ id: `training-event-${uid()}`, type: "TrainingAssignmentCreated", staffMemberId: assignment.staffMemberId, employmentRecordId: assignment.employmentRecordId, trainingCourseId: assignment.trainingCourseId, trainingAssignmentId: assignment.id, safeStatus: assignment.status, dueDate: assignment.dueDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: input.clientRequestId }));
        setStore((s) => ({ ...s, staffTrainingAssignments: [...created, ...s.staffTrainingAssignments], trainingEvents: [...events, ...(s.trainingEvents || [])], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Training Assignments created", entity: input.trainingCourseId, entityType: "training_assignment", timestamp: now, after: JSON.stringify({ count: created.length, dueDate: input.dueDate }) }, ...s.auditLogs].slice(0, 500) }));
        return created;
      },
      updateTrainingAssignment: (id, input, reason) => {
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, staffTrainingAssignments: s.staffTrainingAssignments.map((assignment) => assignment.id === id ? { ...assignment, ...input, updatedAt: now } : assignment), auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Training Assignment updated", entity: id, entityType: "training_assignment", timestamp: now, after: JSON.stringify(input), reason }, ...s.auditLogs].slice(0, 500) }));
      },
      startTrainingAssignment: (id) => {
        const now = new Date().toISOString();
        const assignment = store.staffTrainingAssignments.find((item) => item.id === id);
        if (!assignment) throw new Error("The Training assignment could not be saved.");
        const event: TrainingEvent = { id: `training-event-${uid()}`, type: "TrainingAssignmentUpdated", staffMemberId: assignment.staffMemberId, trainingCourseId: assignment.trainingCourseId, trainingAssignmentId: assignment.id, safeStatus: "in_progress", dueDate: assignment.dueDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `training-start-${id}-${now}` };
        setStore((s) => ({ ...s, staffTrainingAssignments: s.staffTrainingAssignments.map((item) => item.id === id ? { ...item, startedAt: now, status: "in_progress", updatedAt: now } : item), trainingEvents: [event, ...(s.trainingEvents || [])] }));
      },
      cancelTrainingAssignment: (id, reason) => {
        if (!reason.trim()) throw new Error("A cancellation reason is required.");
        const now = new Date().toISOString();
        const current = store.staffTrainingAssignments.find((item) => item.id === id);
        setStore((s) => ({ ...s, staffTrainingAssignments: s.staffTrainingAssignments.map((item) => item.id === id ? { ...item, status: "cancelled", cancelledAt: now, cancelledByUserAccountId: currentUser.id as any, cancellationCategory: "other", cancellationReason: reason, previousStatusBeforeCancellation: current?.status || item.status, courseRemainsApplicable: false, exemptionReason: reason, updatedAt: now } : item), trainingEvents: [{ id: `training-event-${uid()}`, type: "TrainingAssignmentUpdated", trainingAssignmentId: id, safeStatus: "cancelled", actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `training-cancel-${id}-${now}` } as TrainingEvent, ...(s.trainingEvents || [])], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Training Assignment cancelled", entity: id, entityType: "training_assignment", timestamp: now, before: JSON.stringify({ status: current?.status }), after: JSON.stringify({ status: "cancelled", cancelledAt: now }), reason }, ...s.auditLogs].slice(0, 500) }));
      },
      enterTrainingAssignmentInError: (id, reason) => {
        if (!reason.trim()) throw new Error("A reason is required.");
        const now = new Date().toISOString();
        const current = store.staffTrainingAssignments.find((item) => item.id === id);
        setStore((s) => ({ ...s, staffTrainingAssignments: s.staffTrainingAssignments.map((item) => item.id === id ? { ...item, status: "entered_in_error", enteredInErrorAt: now, enteredInErrorByUserAccountId: currentUser.id as any, enteredInErrorReason: reason, previousStatusBeforeEnteredInError: current?.status || item.status, exemptionReason: reason, updatedAt: now } : item), trainingEvents: [{ id: `training-event-${uid()}`, type: "TrainingAssignmentUpdated", trainingAssignmentId: id, safeStatus: "entered_in_error", actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `training-error-${id}-${now}` } as TrainingEvent, ...(s.trainingEvents || [])], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Training Assignment entered in error", entity: id, entityType: "training_assignment", timestamp: now, before: JSON.stringify({ status: current?.status }), after: JSON.stringify({ status: "entered_in_error", enteredInErrorAt: now }), reason }, ...s.auditLogs].slice(0, 500) }));
      },
      recordTrainingCompletion: (input) => {
        const completion = recordTrainingCompletion(store, input, currentUser.id);
        const now = new Date().toISOString();
        const event: TrainingEvent = { id: `training-event-${uid()}`, type: "TrainingCompletionRecorded", staffMemberId: completion.staffMemberId, employmentRecordId: completion.employmentRecordId, trainingCourseId: completion.trainingCourseId, trainingAssignmentId: completion.trainingAssignmentId, trainingCompletionId: completion.id, safeStatus: completion.status, expiryDate: completion.expiryDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: input.clientRequestId };
        setStore((s) => ({
          ...s,
          staffTrainingCompletions: [completion, ...s.staffTrainingCompletions],
          staffTrainingAssignments: completion.trainingAssignmentId ? s.staffTrainingAssignments.map((assignment) => assignment.id === completion.trainingAssignmentId ? { ...assignment, latestCompletionId: completion.id, status: "completed", completedAt: `${completion.completionDate}T12:00:00.000Z`, completionNotes: completion.notes, certificateDocumentId: completion.certificateDocumentId || assignment.certificateDocumentId, updatedAt: now } : assignment) : s.staffTrainingAssignments,
          trainingEvents: [event, ...(s.trainingEvents || [])],
          auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Training Completion recorded", entity: String(completion.id), entityType: "training_completion", timestamp: now, after: JSON.stringify({ trainingCourseId: completion.trainingCourseId, completionDate: completion.completionDate, status: completion.status }) }, ...s.auditLogs].slice(0, 500),
        }));
        return completion;
      },
      verifyTrainingCompletion: (id) => {
        const current = store.staffTrainingCompletions.find((completion) => String(completion.id) === id);
        if (!current) throw new Error("The Training record could not be loaded.");
        const next = verifyTrainingCompletion(current, "verified", currentUser.id);
        const now = new Date().toISOString();
        const event: TrainingEvent = { id: `training-event-${uid()}`, type: "TrainingCompletionVerified", staffMemberId: next.staffMemberId, employmentRecordId: next.employmentRecordId, trainingCourseId: next.trainingCourseId, trainingAssignmentId: next.trainingAssignmentId, trainingCompletionId: next.id, safeStatus: next.status, expiryDate: next.expiryDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `training-verify-${id}-${now}` };
        setStore((s) => ({ ...s, staffTrainingCompletions: s.staffTrainingCompletions.map((completion) => String(completion.id) === id ? next : completion), staffTrainingAssignments: next.trainingAssignmentId ? s.staffTrainingAssignments.map((assignment) => assignment.id === next.trainingAssignmentId ? { ...assignment, latestCompletionId: next.id, status: "completed", updatedAt: now } : assignment) : s.staffTrainingAssignments, trainingEvents: [event, ...(s.trainingEvents || [])] }));
      },
      recordCompetencyValidation: (input) => {
        const validation = recordCompetencyValidation({ definitions: store.competencyDefinitions, completions: store.staffTrainingCompletions }, input, currentUser.id);
        const now = new Date().toISOString();
        const event: CompetencyEvent = { id: `competency-event-${uid()}`, type: validation.status === "competent_with_supervision" ? "StaffCompetencyValidatedWithSupervision" : "StaffCompetencyValidated", staffMemberId: validation.staffMemberId, employmentRecordId: validation.employmentRecordId, competencyDefinitionId: validation.competencyDefinitionId, competencyValidationId: validation.id, status: validation.status, validationDate: validation.validationDate, expiryDate: validation.expiryDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: input.clientRequestId };
        setStore((s) => ({ ...s, staffCompetencyValidations: [validation, ...s.staffCompetencyValidations], competencyEvents: [event, ...(s.competencyEvents || [])], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Competency Validation recorded", entity: String(validation.id), entityType: "competency_validation", timestamp: now, after: JSON.stringify({ competencyDefinitionId: validation.competencyDefinitionId, status: validation.status }) }, ...s.auditLogs].slice(0, 500) }));
        return validation;
      },
      createStaffHomeAssignment: (input) => {
        const assignment = createStaffHomeAssignment(store, input, currentUser.id);
        const now = new Date().toISOString();
        const event: WorkforceEmploymentEvent = { id: `employment-event-${uid()}`, type: assignment.isPrimary ? "EmploymentHomeAssignmentAdded" : "EmploymentHomeAssignmentAdded", employmentRecordId: assignment.employmentRecordId, staffMemberId: assignment.staffMemberId, actorUserAccountId: currentUser.id, occurredAt: now, changedFields: ["nursingHomeId", "assignmentType", "status", "effectiveFrom", "effectiveTo", "isPrimary", "roleKeys"] };
        setStore((s) => ({
          ...s,
          employmentHomeAssignments: [assignment, ...s.employmentHomeAssignments],
          staffMembers: assignment.isPrimary ? s.staffMembers.map((staff) => String(staff.id) === String(assignment.staffMemberId) ? { ...staff, primaryNursingHomeId: assignment.nursingHomeId, updatedAt: now, updatedBy: currentUser.id as any } : staff) : s.staffMembers,
          workforceEmploymentEvents: [event, ...(s.workforceEmploymentEvents || [])],
          auditLogs: [{ id: uid(), facilityId: String(assignment.nursingHomeId), user: currentUserName, role: currentRole, action: "Staff Home Assignment created", entity: String(assignment.id), entityType: "home_assignment", timestamp: now, after: JSON.stringify({ assignmentType: assignment.assignmentType, status: assignment.status, isPrimary: assignment.isPrimary }) }, ...s.auditLogs].slice(0, 500),
        }));
        return assignment;
      },
      endStaffHomeAssignment: (id, endDate) => {
        const current = store.employmentHomeAssignments.find((assignment) => assignment.id === id);
        if (!current) throw new Error("The Home Assignment could not be saved.");
        const next = endStaffHomeAssignment(current, currentUser.id, endDate);
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          employmentHomeAssignments: s.employmentHomeAssignments.map((assignment) => assignment.id === id ? next : assignment),
          workforceEmploymentEvents: [{ id: `employment-event-${uid()}`, type: "EmploymentHomeAssignmentAdded", employmentRecordId: next.employmentRecordId, staffMemberId: next.staffMemberId, actorUserAccountId: currentUser.id, occurredAt: now, changedFields: ["status", "effectiveTo"] }, ...(s.workforceEmploymentEvents || [])],
        }));
      },
      createStaffingEstablishmentDraft: (input) => {
        const version = createStaffingEstablishmentDraft(input, currentUser.id, store.staffingEstablishmentVersions.filter((item) => item.nursingHomeId === input.nursingHomeId).length + 1);
        const now = new Date().toISOString();
        const event: StaffingEstablishmentEvent = { id: `staffing-establishment-event-${uid()}`, type: "StaffingEstablishmentDraftCreated", establishmentVersionId: version.id, nursingHomeId: version.nursingHomeId, status: version.status, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: input.clientRequestId };
        setStore((s) => ({ ...s, staffingEstablishmentVersions: [version, ...s.staffingEstablishmentVersions], staffingEstablishmentEvents: [event, ...(s.staffingEstablishmentEvents || [])], auditLogs: [{ id: uid(), facilityId: String(version.nursingHomeId), user: currentUserName, role: currentRole, action: "Staffing Establishment draft created", entity: String(version.id), entityType: "staffing_establishment", timestamp: now, after: JSON.stringify({ versionName: version.versionName, effectiveFrom: version.effectiveFrom }) }, ...s.auditLogs].slice(0, 500) }));
        return version;
      },
      addStaffingEstablishmentLine: (input) => {
        const line = addStaffingEstablishmentLine(input);
        const now = new Date().toISOString();
        const event: StaffingEstablishmentEvent = { id: `staffing-establishment-event-${uid()}`, type: "StaffingEstablishmentLineAdded", establishmentVersionId: line.establishmentVersionId, establishmentLineId: line.id, nursingHomeId: line.nursingHomeId, wardId: line.wardId, roleKey: line.roleKey, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: input.clientRequestId };
        setStore((s) => ({ ...s, staffingEstablishmentLines: [line, ...s.staffingEstablishmentLines], staffingEstablishmentEvents: [event, ...(s.staffingEstablishmentEvents || [])] }));
        return line;
      },
      approveStaffingEstablishment: (id) => {
        const current = store.staffingEstablishmentVersions.find((version) => version.id === id);
        if (!current) throw new Error("The Staffing Establishment could not be saved.");
        const next = approveStaffingEstablishment(current, currentUser.id);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, staffingEstablishmentVersions: s.staffingEstablishmentVersions.map((version) => version.id === id ? next : version), staffingEstablishmentEvents: [{ id: `staffing-establishment-event-${uid()}`, type: "StaffingEstablishmentApproved", establishmentVersionId: next.id, nursingHomeId: next.nursingHomeId, status: next.status, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `staffing-establishment-approve-${id}-${now}` }, ...(s.staffingEstablishmentEvents || [])] }));
      },
      createRecruitmentVacancy: (input) => {
        const establishmentLine = input.establishmentLine || (input.establishmentVersion ? store.staffingEstablishmentLines.find((line) => line.establishmentVersionId === input.establishmentVersion?.id && line.roleKey === input.roleKey && line.nursingHomeId === input.nursingHomeId && (!input.wardId || line.wardId === input.wardId)) : undefined);
        const vacancy = createRecruitmentVacancy({ ...input, establishmentLine }, currentUser.id);
        const now = new Date().toISOString();
        const event: RecruitmentEvent = { id: `recruitment-event-${uid()}`, type: "RecruitmentVacancyCreated", recruitmentVacancyId: vacancy.id, nursingHomeId: vacancy.nursingHomeId, wardId: vacancy.wardId, roleKey: vacancy.roleKey, status: vacancy.status, quantities: { positionsRequired: vacancy.positionsRequired, positionsFilled: vacancy.positionsFilled, fteRequired: vacancy.fteRequired, fteFilled: vacancy.fteFilled }, plannedStartDate: vacancy.plannedStartDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: input.clientRequestId || `recruitment-vacancy-create-${now}` };
        setStore((s) => ({ ...s, recruitmentVacancies: [vacancy, ...s.recruitmentVacancies], recruitmentEvents: [event, ...(s.recruitmentEvents || [])], auditLogs: [{ id: uid(), facilityId: String(vacancy.nursingHomeId), user: currentUserName, role: currentRole, action: "Recruitment Vacancy created", entity: String(vacancy.id), entityType: "recruitment_vacancy", timestamp: now, after: JSON.stringify({ jobTitle: vacancy.jobTitle, roleKey: vacancy.roleKey, status: vacancy.status }) }, ...s.auditLogs].slice(0, 500) }));
        return vacancy;
      },
      updateRecruitmentVacancyStatus: (id, status) => {
        const current = store.recruitmentVacancies.find((vacancy) => vacancy.id === id);
        if (!current) throw new Error("The Recruitment Vacancy could not be saved.");
        const next = transitionRecruitmentVacancy(current, status, currentUser.id);
        const now = new Date().toISOString();
        const eventType: RecruitmentEvent["type"] = status === "approved" ? "RecruitmentVacancyApproved" : status === "open" ? "RecruitmentVacancyOpened" : status === "on_hold" ? "RecruitmentVacancyPlacedOnHold" : status === "cancelled" ? "RecruitmentVacancyCancelled" : status === "closed_unfilled" ? "RecruitmentVacancyClosedUnfilled" : status === "entered_in_error" ? "RecruitmentVacancyEnteredInError" : "RecruitmentVacancyUpdated";
        setStore((s) => ({ ...s, recruitmentVacancies: s.recruitmentVacancies.map((vacancy) => vacancy.id === id ? next : vacancy), recruitmentEvents: [{ id: `recruitment-event-${uid()}`, type: eventType, recruitmentVacancyId: next.id, nursingHomeId: next.nursingHomeId, wardId: next.wardId, roleKey: next.roleKey, status: next.status, plannedStartDate: next.plannedStartDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `recruitment-vacancy-status-${id}-${now}` }, ...(s.recruitmentEvents || [])] }));
      },
      addRecruitmentCandidate: (input) => {
        const vacancy = store.recruitmentVacancies.find((item) => item.id === input.recruitmentVacancyId);
        if (!vacancy) throw new Error("The candidate could not be moved to the selected stage.");
        const candidate = addRecruitmentCandidate(input);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, recruitmentCandidates: [candidate, ...s.recruitmentCandidates], recruitmentEvents: [{ id: `recruitment-event-${uid()}`, type: "RecruitmentCandidateAdded", recruitmentVacancyId: candidate.recruitmentVacancyId, recruitmentCandidateId: candidate.id, nursingHomeId: vacancy.nursingHomeId, wardId: vacancy.wardId, roleKey: vacancy.roleKey, status: candidate.status, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `recruitment-candidate-add-${candidate.id}-${now}` }, ...(s.recruitmentEvents || [])] }));
        return candidate;
      },
      createRecruitmentOffer: (input) => {
        const vacancy = store.recruitmentVacancies.find((item) => item.id === input.recruitmentVacancyId);
        if (!vacancy) throw new Error("The Recruitment Vacancy could not be saved.");
        const offer = createRecruitmentOffer(input);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, recruitmentOffers: [offer, ...s.recruitmentOffers], recruitmentEvents: [{ id: `recruitment-event-${uid()}`, type: "RecruitmentOfferCreated", recruitmentVacancyId: offer.recruitmentVacancyId, recruitmentOfferId: offer.id, recruitmentCandidateId: offer.candidateId, nursingHomeId: vacancy.nursingHomeId, wardId: vacancy.wardId, roleKey: vacancy.roleKey, status: offer.status, plannedStartDate: offer.proposedStartDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `recruitment-offer-create-${offer.id}-${now}` }, ...(s.recruitmentEvents || [])] }));
        return offer;
      },
      updateRecruitmentOfferStatus: (id, status) => {
        const current = store.recruitmentOffers.find((offer) => offer.id === id);
        if (!current) throw new Error("The Recruitment Vacancy could not be saved.");
        const vacancy = store.recruitmentVacancies.find((item) => item.id === current.recruitmentVacancyId);
        const next = transitionRecruitmentOffer(current, status);
        const now = new Date().toISOString();
        const eventType: RecruitmentEvent["type"] = status === "sent" ? "RecruitmentOfferSent" : status === "accepted" ? "RecruitmentOfferAccepted" : status === "declined" ? "RecruitmentOfferDeclined" : "RecruitmentOfferCreated";
        setStore((s) => ({ ...s, recruitmentOffers: s.recruitmentOffers.map((offer) => offer.id === id ? next : offer), recruitmentEvents: [{ id: `recruitment-event-${uid()}`, type: eventType, recruitmentVacancyId: next.recruitmentVacancyId, recruitmentOfferId: next.id, recruitmentCandidateId: next.candidateId, nursingHomeId: vacancy?.nursingHomeId || next.proposedNursingHomeId, wardId: vacancy?.wardId || next.proposedWardId, roleKey: next.proposedRoleKey, status: next.status, plannedStartDate: next.proposedStartDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `recruitment-offer-status-${id}-${now}` }, ...(s.recruitmentEvents || [])] }));
      },
      createRosterPeriod: (input) => {
        const period = createRosterPeriod(input, currentUser.id, store.rosterPeriods.filter((item) => item.nursingHomeId === input.nursingHomeId).length + 1);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, rosterPeriods: [period, ...s.rosterPeriods], rosterEvents: [{ id: `roster-event-${uid()}`, type: "RosterPeriodCreated", rosterPeriodId: period.id, nursingHomeId: period.nursingHomeId, status: period.status, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `roster-period-create-${period.id}-${now}` }, ...(s.rosterEvents || [])] }));
        return period;
      },
      addRosterShiftRequirement: (input) => {
        const requirement = addRosterShiftRequirement(input);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, rosterShiftRequirements: [requirement, ...s.rosterShiftRequirements], rosterEvents: [{ id: `roster-event-${uid()}`, type: "RosterRequirementChanged", rosterPeriodId: requirement.rosterPeriodId, rosterShiftRequirementId: requirement.id, nursingHomeId: requirement.nursingHomeId, wardId: requirement.wardId, roleKey: requirement.roleKey, status: requirement.status, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `roster-requirement-add-${requirement.id}-${now}` }, ...(s.rosterEvents || [])] }));
        return requirement;
      },
      assignPlannedShift: (input) => {
        const shift = assignPlannedShift(input, currentUser.id, store.staffLeaveRecords);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, plannedShifts: [shift, ...s.plannedShifts], rosterEvents: [{ id: `roster-event-${uid()}`, type: shift.assignedStaffMemberId ? "RosterStaffAssigned" : "RosterShiftMarkedVacant", rosterPeriodId: shift.rosterPeriodId, plannedShiftId: shift.id, rosterShiftRequirementId: shift.requirementId, nursingHomeId: shift.nursingHomeId, wardId: shift.wardId, staffMemberId: shift.assignedStaffMemberId, roleKey: shift.roleKey, status: shift.status, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `planned-shift-assign-${shift.id}-${now}` }, ...(s.rosterEvents || [])] }));
        return shift;
      },
      createStaffLeaveRecord: (input) => {
        const record = createStaffLeaveRecord(input, currentUser.id, store.staffLeaveRecords);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, staffLeaveRecords: [record, ...s.staffLeaveRecords], staffLeaveEvents: [{ id: `staff-leave-event-${uid()}`, type: "StaffLeaveCreated", staffLeaveRecordId: record.id, staffMemberId: record.staffMemberId, employmentRecordId: record.employmentRecordId, nursingHomeId: record.nursingHomeId, leaveType: record.leaveType, status: record.status, startDate: record.startDate, endDate: record.endDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `staff-leave-create-${record.id}-${now}` }, ...(s.staffLeaveEvents || [])], auditLogs: [{ id: uid(), facilityId: String(record.nursingHomeId), user: currentUserName, role: currentRole, action: "Staff Leave created", entity: String(record.id), entityType: "staff_leave", timestamp: now, after: JSON.stringify({ leaveType: record.leaveType, status: record.status, startDate: record.startDate, endDate: record.endDate }) }, ...s.auditLogs].slice(0, 500) }));
        return record;
      },
      approveStaffLeaveRecord: (id) => {
        const current = store.staffLeaveRecords.find((record) => record.id === id);
        if (!current) throw new Error("This Leave request could not be approved.");
        const next = approveStaffLeaveRecord(current, currentUser.id);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, staffLeaveRecords: s.staffLeaveRecords.map((record) => record.id === id ? next : record), staffLeaveEvents: [{ id: `staff-leave-event-${uid()}`, type: "StaffLeaveApproved", staffLeaveRecordId: next.id, staffMemberId: next.staffMemberId, employmentRecordId: next.employmentRecordId, nursingHomeId: next.nursingHomeId, leaveType: next.leaveType, status: next.status, startDate: next.startDate, endDate: next.endDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `staff-leave-approve-${id}-${now}` }, ...(s.staffLeaveEvents || [])] }));
      },
      createAgencyCompany: (input) => {
        const company = createAgencyCompany(input, currentUser.id);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, agencyCompanies: [company, ...s.agencyCompanies], agencyEvents: [{ id: `agency-event-${uid()}`, type: "AgencyCompanyCreated", agencyCompanyId: company.id, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `agency-company-create-${company.id}-${now}` }, ...(s.agencyEvents || [])], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Agency Company created", entity: String(company.id), entityType: "agency_company", timestamp: now, after: JSON.stringify({ name: company.name, status: company.status, approvedSupplier: company.approvedSupplier }) }, ...s.auditLogs].slice(0, 500) }));
        return company;
      },
      createAgencyWorker: (input) => {
        const worker = createAgencyWorker(input);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, agencyWorkers: [worker, ...s.agencyWorkers], agencyEvents: [{ id: `agency-event-${uid()}`, type: "AgencyWorkerCreated", agencyCompanyId: worker.agencyCompanyId, agencyWorkerId: worker.id, roleKey: worker.primaryRoleKey, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `agency-worker-create-${worker.id}-${now}` }, ...(s.agencyEvents || [])], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Agency Worker created", entity: String(worker.id), entityType: "agency_worker", timestamp: now, after: JSON.stringify({ staffMemberId: worker.staffMemberId, agencyCompanyId: worker.agencyCompanyId, roleKey: worker.primaryRoleKey }) }, ...s.auditLogs].slice(0, 500) }));
        return worker;
      },
      assignAgencyWorkerToShift: (input) => {
        const assignment = assignAgencyWorkerToShift(input, { company: store.agencyCompanies.find((company) => company.id === input.agencyCompanyId), worker: store.agencyWorkers.find((worker) => worker.id === input.agencyWorkerId), existingAssignments: store.agencyShiftAssignments });
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, agencyShiftAssignments: [assignment, ...s.agencyShiftAssignments], agencyEvents: [{ id: `agency-event-${uid()}`, type: "AgencyWorkerAssignedToShift", agencyCompanyId: assignment.agencyCompanyId, agencyWorkerId: assignment.agencyWorkerId, agencyShiftAssignmentId: assignment.id, nursingHomeId: assignment.nursingHomeId, wardId: assignment.wardId, roleKey: assignment.roleKey, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `agency-assignment-create-${assignment.id}-${now}` }, ...(s.agencyEvents || [])] }));
        return assignment;
      },
      recordAgencyTimesheet: (input) => {
        const assignment = store.agencyShiftAssignments.find((item) => item.id === input.agencyShiftAssignmentId);
        if (!assignment) throw new Error("The Agency Timesheet could not be saved.");
        const rate = store.agencyRateAgreements.find((item) => item.id === assignment.rateAgreementId && item.status === "approved");
        const timesheet = recordAgencyTimesheet(input, assignment, rate);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, agencyTimesheets: [timesheet, ...s.agencyTimesheets], agencyEvents: [{ id: `agency-event-${uid()}`, type: "AgencyTimesheetSubmitted", agencyCompanyId: timesheet.agencyCompanyId, agencyWorkerId: timesheet.agencyWorkerId, agencyShiftAssignmentId: timesheet.agencyShiftAssignmentId, agencyTimesheetId: timesheet.id, nursingHomeId: timesheet.nursingHomeId, wardId: timesheet.wardId, roleKey: timesheet.roleKey, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `agency-timesheet-record-${timesheet.id}-${now}` }, ...(s.agencyEvents || [])] }));
        return timesheet;
      },
      approveAgencyTimesheet: (id) => {
        const current = store.agencyTimesheets.find((timesheet) => timesheet.id === id);
        if (!current) throw new Error("The Agency Timesheet could not be approved.");
        const next = transitionAgencyTimesheet(current, "approved", currentUser.id);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, agencyTimesheets: s.agencyTimesheets.map((timesheet) => timesheet.id === id ? next : timesheet), agencyEvents: [{ id: `agency-event-${uid()}`, type: "AgencyTimesheetApproved", agencyCompanyId: next.agencyCompanyId, agencyWorkerId: next.agencyWorkerId, agencyShiftAssignmentId: next.agencyShiftAssignmentId, agencyTimesheetId: next.id, nursingHomeId: next.nursingHomeId, wardId: next.wardId, roleKey: next.roleKey, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `agency-timesheet-approve-${id}-${now}` }, ...(s.agencyEvents || [])] }));
      },
      createStaffProbation: (input) => {
        const probation = createStaffProbation(input, currentUser.id, store.staffProbations);
        const reviews = scheduleProbationReviews(probation, store.probationReviewSchedulePolicies.find((policy) => policy.status === "approved" && (!policy.nursingHomeId || policy.nursingHomeId === probation.nursingHomeId)));
        const now = new Date().toISOString();
        const events: ProbationEvent[] = [
          { id: `probation-event-${uid()}`, type: "StaffProbationCreated", probationId: probation.id, staffMemberId: probation.staffMemberId, employmentRecordId: probation.employmentRecordId, nursingHomeId: probation.nursingHomeId, safeStatus: probation.status, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `probation-create-${probation.id}-${now}` },
          ...reviews.map((review) => ({ id: `probation-event-${uid()}`, type: "ProbationReviewScheduled" as const, probationId: probation.id, probationReviewId: review.id, staffMemberId: review.staffMemberId, employmentRecordId: review.employmentRecordId, nursingHomeId: review.nursingHomeId, safeStatus: review.status, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `probation-review-schedule-${review.id}-${now}` })),
        ];
        setStore((s) => ({ ...s, staffProbations: [probation, ...s.staffProbations], staffProbationReviews: [...reviews, ...s.staffProbationReviews], probationEvents: [...events, ...(s.probationEvents || [])], auditLogs: [{ id: uid(), facilityId: String(probation.nursingHomeId), user: currentUserName, role: currentRole, action: "Staff Probation created", entity: String(probation.id), entityType: "staff_probation", timestamp: now, after: JSON.stringify({ staffMemberId: probation.staffMemberId, status: probation.status, expectedEndDate: probation.currentExpectedEndDate }) }, ...s.auditLogs].slice(0, 500) }));
        return probation;
      },
      completeProbationReview: (id, outcome) => {
        const current = store.staffProbationReviews.find((review) => review.id === id);
        if (!current) throw new Error("The Probation Review could not be saved.");
        const next = completeProbationReview(current, outcome, currentUser.id);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, staffProbationReviews: s.staffProbationReviews.map((review) => review.id === id ? next : review), probationEvents: [{ id: `probation-event-${uid()}`, type: "ProbationReviewCompleted", probationId: next.probationId, probationReviewId: next.id, staffMemberId: next.staffMemberId, employmentRecordId: next.employmentRecordId, nursingHomeId: next.nursingHomeId, safeStatus: next.status, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `probation-review-complete-${id}-${now}` }, ...(s.probationEvents || [])] }));
      },
      extendStaffProbation: (id, newExpectedEndDate, reason) => {
        const current = store.staffProbations.find((probation) => probation.id === id);
        if (!current) throw new Error("The Probation could not be saved.");
        const result = extendStaffProbation(current, newExpectedEndDate, reason, currentUser.id);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, staffProbations: s.staffProbations.map((probation) => probation.id === id ? result.probation : probation), staffProbationExtensions: [result.extension, ...s.staffProbationExtensions], probationEvents: [{ id: `probation-event-${uid()}`, type: "StaffProbationExtended", probationId: result.probation.id, staffMemberId: result.probation.staffMemberId, employmentRecordId: result.probation.employmentRecordId, nursingHomeId: result.probation.nursingHomeId, safeStatus: result.probation.status, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `probation-extend-${id}-${now}` }, ...(s.probationEvents || [])] }));
      },
      completeStaffProbation: (id, status) => {
        const current = store.staffProbations.find((probation) => probation.id === id);
        if (!current) throw new Error("The Probation could not be saved.");
        const next = completeStaffProbation(current, status, currentUser.id);
        const now = new Date().toISOString();
        const eventType: ProbationEvent["type"] = status === "failed" ? "StaffProbationFailed" : "StaffProbationCompleted";
        setStore((s) => ({ ...s, staffProbations: s.staffProbations.map((probation) => probation.id === id ? next : probation), probationEvents: [{ id: `probation-event-${uid()}`, type: eventType, probationId: next.id, staffMemberId: next.staffMemberId, employmentRecordId: next.employmentRecordId, nursingHomeId: next.nursingHomeId, safeStatus: next.status, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `probation-complete-${id}-${now}` }, ...(s.probationEvents || [])] }));
      },
      addResident: (r) => {
        const id = `R-${String(store.residents.length + 1).padStart(4, "0")}`;
        const resident: Resident = { ...r, id, photoSeed: r.firstName + r.lastName };
        setStore((s) => ({ ...s, residents: [...s.residents, resident] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created resident",
          entity: id,
        });
        return resident;
      },
      updateResident: (id, patch) => {
        setStore((s) => ({
          ...s,
          residents: s.residents.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated resident",
          entity: id,
        });
      },
      updateResidentProfile: (id, input) => {
        const now = new Date().toISOString();
        setStore((state) => {
          const resident = state.residents.find((item) => item.id === id);
          if (!resident) throw new Error("Resident not found.");
          const nursingHomeId = resident.facilityId || activeFacilityId;
          const access = createStaffAccessContext(currentUser, nursingHomeId);
          const nextProfileState: ResidentProfileState = structuredClone(state.residentProfileState);
          const nextResident = updateResidentProfile(nextProfileState, resident, state.users, input, { userAccountId: currentUser.id, nursingHomeId, capabilities: getEffectivePermissions(state, access, { nursingHomeId }), occurredAt: now, correlationId: `resident-profile:${id}:${now}`, residentBelongsToHome: (residentId, homeId) => state.residents.some((item) => item.id === residentId && (item.facilityId || activeFacilityId) === homeId) });
          return { ...state, residentProfileState: nextProfileState, residents: state.residents.map((item) => item.id === id ? nextResident : item) };
        });
      },
      softDeleteResident: (id, reason) => {
        if (currentRole !== "don" && currentRole !== "cnm") {
          throw new Error("Only a DON or CNM can delete a resident.");
        }
        const resident = store.residents.find((candidate) => candidate.id === id);
        if (!resident) return 0;
        const residentName = `${resident.firstName} ${resident.lastName}`;
        const now = new Date().toISOString();
        const deleteReason = reason?.trim() || `Resident deleted: ${residentName}`;
        const problemIdsForCount = new Set(
          store.carePlanProblems.filter((problem) => problem.residentId === id).map((problem) => problem.id),
        );
        const interventionIdsForCount = new Set(
          store.problemInterventions
            .filter((intervention) => intervention.residentId === id)
            .map((intervention) => intervention.id),
        );
        const incidentIdsForCount = new Set(
          store.incidents.filter((incident) => incident.residentId === id).map((incident) => incident.id),
        );
        const archivedCount = [
          store.assessments.filter((item) => item.residentId === id).length,
          store.interventions.filter((item) => item.residentId === id).length,
          store.interventionLogs.filter((item) => item.residentId === id).length,
          store.notes.filter((item) => item.residentId === id).length,
          store.alerts.filter((item) => item.residentId === id).length,
          store.tasks.filter((item) => item.residentId === id).length,
          store.incidents.filter((item) => item.residentId === id).length,
          store.mdtNotes.filter((item) => item.residentId === id).length,
          store.visitors.filter((item) => item.residentId === id).length,
          store.outings.filter((item) => item.residentId === id).length,
          store.handovers.filter((item) => item.residentId === id).length,
          store.observations.filter((item) => item.residentId === id).length,
          store.weights.filter((item) => item.residentId === id).length,
          store.fluids.filter((item) => item.residentId === id).length,
          store.foods.filter((item) => item.residentId === id).length,
          store.pains.filter((item) => item.residentId === id).length,
          store.sleeps.filter((item) => item.residentId === id).length,
          store.bowels.filter((item) => item.residentId === id).length,
          store.behaviours.filter((item) => item.residentId === id).length,
          store.incidentActions.filter((item) => incidentIdsForCount.has(item.incidentId)).length,
          store.timelineEvents.filter((item) => item.residentId === id).length,
          store.residentCarePlans.filter((item) => item.residentId === id).length,
          store.carePlanProblems.filter((item) => item.residentId === id).length,
          store.problemGoals.filter((item) => problemIdsForCount.has(item.problemId)).length,
          store.problemInterventions.filter((item) => item.residentId === id).length,
          store.problemInterventionLogs.filter((item) => item.residentId === id || interventionIdsForCount.has(item.interventionId)).length,
          store.problemEvaluations.filter((item) => problemIdsForCount.has(item.problemId)).length,
          store.problemReviews.filter((item) => problemIdsForCount.has(item.problemId)).length,
          store.problemHistory.filter((item) => problemIdsForCount.has(item.problemId)).length,
          store.assessmentSuggestions.filter((item) => item.residentId === id).length,
          store.assessmentTriggerEvents.filter((item) => item.residentId === id).length,
          store.vitals.filter((item) => item.residentId === id).length,
          store.observationPlans.filter((item) => item.residentId === id).length,
          store.clinicalAlerts.filter((item) => item.residentId === id).length,
          store.clinicalObservations.filter((item) => item.residentId === id).length,
          store.observationSchedules.filter((item) => item.residentId === id).length,
          Object.values(store.alertWorkflow || {}).filter((item) => item.residentId === id).length,
        ].reduce((sum, count) => sum + count, 0);
        const markDeleted = <T extends { id?: string }>(item: T) => {
          return {
            ...item,
            deletedAt: (item as any).deletedAt || now,
            deletedBy: (item as any).deletedBy || currentUserName,
            deletedReason: (item as any).deletedReason || deleteReason,
          };
        };
        setStore((s) => {
          const problemIds = new Set(
            s.carePlanProblems
              .filter((problem) => problem.residentId === id)
              .map((problem) => problem.id),
          );
          const interventionIds = new Set(
            s.problemInterventions
              .filter((intervention) => intervention.residentId === id)
              .map((intervention) => intervention.id),
          );
          const incidentIds = new Set(
            s.incidents.filter((incident) => incident.residentId === id).map((incident) => incident.id),
          );

          return {
            ...s,
            residents: s.residents.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: "deleted" as const,
                    residentType: "inactive",
                    deletedAt: now,
                    deletedBy: currentUserName,
                    deletedReason: deleteReason,
                  }
                : item,
            ),
            assessments: s.assessments.map((item) =>
              item.residentId === id
                ? {
                    ...markDeleted(item),
                    status: "deleted" as const,
                  }
                : item,
            ),
            interventions: s.interventions.map((item) =>
              item.residentId === id ? markDeleted(item) : item,
            ),
            interventionLogs: s.interventionLogs.map((item) =>
              item.residentId === id ? markDeleted(item) : item,
            ),
            notes: s.notes.map((item) => (item.residentId === id ? markDeleted(item) : item)),
            alerts: s.alerts.map((item) =>
              item.residentId === id
                ? {
                    ...markDeleted(item),
                    acknowledged: true,
                    resolvedAt: item.resolvedAt || now,
                    resolvedBy: item.resolvedBy || currentUserName,
                  }
                : item,
            ),
            tasks: s.tasks.map((item) =>
              item.residentId === id
                ? {
                    ...markDeleted(item),
                    status: "deleted" as const,
                  }
                : item,
            ),
            incidents: s.incidents.map((item) =>
              item.residentId === id
                ? {
                    ...markDeleted(item),
                    recordStatus: "deleted" as const,
                    status: "closed" as const,
                    closedAt: item.closedAt || now,
                    closedBy: item.closedBy || currentUserName,
                  }
                : item,
            ),
            mdtNotes: s.mdtNotes.map((item) => (item.residentId === id ? markDeleted(item) : item)),
            visitors: s.visitors.map((item) =>
              item.residentId === id
                ? {
                    ...markDeleted(item),
                    recordStatus: "deleted" as const,
                    status: "cancelled" as const,
                    cancelledReason: item.cancelledReason || deleteReason,
                  }
                : item,
            ),
            outings: s.outings.map((item) =>
              item.residentId === id
                ? {
                    ...markDeleted(item),
                    recordStatus: "deleted" as const,
                    status: "cancelled" as const,
                    cancelledReason: item.cancelledReason || deleteReason,
                  }
                : item,
            ),
            handovers: s.handovers.map((item) =>
              item.residentId === id
                ? {
                    ...markDeleted(item),
                    recordStatus: "deleted" as const,
                    status: "closed" as const,
                    closedAt: item.closedAt || now,
                    closedBy: item.closedBy || currentUserName,
                  }
                : item,
            ),
            observations: s.observations.map((item) => (item.residentId === id ? markDeleted(item) : item)),
            weights: s.weights.map((item) => (item.residentId === id ? markDeleted(item) : item)),
            fluids: s.fluids.map((item) => (item.residentId === id ? markDeleted(item) : item)),
            foods: s.foods.map((item) => (item.residentId === id ? markDeleted(item) : item)),
            pains: s.pains.map((item) => (item.residentId === id ? markDeleted(item) : item)),
            sleeps: s.sleeps.map((item) => (item.residentId === id ? markDeleted(item) : item)),
            bowels: s.bowels.map((item) => (item.residentId === id ? markDeleted(item) : item)),
            behaviours: s.behaviours.map((item) => (item.residentId === id ? markDeleted(item) : item)),
            incidentActions: s.incidentActions.map((item) =>
              incidentIds.has(item.incidentId) ? markDeleted(item) : item,
            ),
            timelineEvents: s.timelineEvents.map((item) =>
              item.residentId === id ? markDeleted(item) : item,
            ),
            residentCarePlans: s.residentCarePlans.map((item) =>
              item.residentId === id
                ? {
                    ...markArchived(item),
                    status: "archived" as const,
                  }
                : item,
            ),
            carePlanProblems: s.carePlanProblems.map((item) =>
              item.residentId === id
                ? {
                    ...markArchived(item),
                    status: "archived" as const,
                    resolvedAt: item.resolvedAt || now,
                    resolvedBy: item.resolvedBy || currentUserName,
                    resolvedReason: item.resolvedReason || deleteReason,
                  }
                : item,
            ),
            problemGoals: s.problemGoals.map((item) =>
              problemIds.has(item.problemId)
                ? {
                    ...markDeleted(item),
                    status: "discontinued" as const,
                  }
                : item,
            ),
            problemInterventions: s.problemInterventions.map((item) =>
              item.residentId === id
                ? {
                    ...markArchived(item),
                    status: "discontinued" as const,
                    completedAt: item.completedAt || now,
                    completedBy: item.completedBy || currentUserName,
                    completedByRole: item.completedByRole || currentRole,
                    completionReason: item.completionReason || deleteReason,
                  }
                : item,
            ),
            problemInterventionLogs: s.problemInterventionLogs.map((item) =>
              item.residentId === id || interventionIds.has(item.interventionId)
                ? markDeleted(item)
                : item,
            ),
            problemEvaluations: s.problemEvaluations.map((item) =>
              problemIds.has(item.problemId) ? markDeleted(item) : item,
            ),
            problemReviews: s.problemReviews.map((item) =>
              problemIds.has(item.problemId) ? markDeleted(item) : item,
            ),
            problemHistory: s.problemHistory.map((item) =>
              problemIds.has(item.problemId) ? markDeleted(item) : item,
            ),
            assessmentSuggestions: s.assessmentSuggestions.map((item) =>
              item.residentId === id
                ? {
                    ...markDeleted(item),
                    status: "rejected" as const,
                    rejectedReason: item.rejectedReason || deleteReason,
                  }
                : item,
            ),
            assessmentTriggerEvents: s.assessmentTriggerEvents.map((item) =>
              item.residentId === id ? markDeleted(item) : item,
            ),
            vitals: s.vitals.map((item) => (item.residentId === id ? markDeleted(item) : item)),
            observationPlans: s.observationPlans.map((item) =>
              item.residentId === id ? markArchived(item) : item,
            ),
            clinicalAlerts: s.clinicalAlerts.map((item) =>
              item.residentId === id
                ? {
                    ...markDeleted(item),
                    acknowledged: true,
                    dismissedAt: item.dismissedAt || now,
                    dismissedBy: item.dismissedBy || currentUserName,
                    dismissedReason: item.dismissedReason || "Resolved",
                    resolvedAt: item.resolvedAt || now,
                    resolvedBy: item.resolvedBy || currentUserName,
                  }
                : item,
            ),
            clinicalObservations: s.clinicalObservations.map((item) =>
              item.residentId === id ? markDeleted(item) : item,
            ),
            observationSchedules: s.observationSchedules.map((item) =>
              item.residentId === id ? markArchived(item) : item,
            ),
            alertWorkflow: Object.fromEntries(
              Object.entries(s.alertWorkflow || {}).map(([key, item]) => [
                key,
                item.residentId === id
                  ? {
                      ...markDeleted(item),
                      acknowledgedBy: item.acknowledgedBy || currentUserName,
                      acknowledgedAt: item.acknowledgedAt || now,
                    }
                  : item,
              ]),
            ),
            auditLogs: [
              {
                id: uid(),
                facilityId: resident.facilityId || activeFacilityId,
                user: currentUserName,
                role: currentRole,
                action: "Resident deleted",
                entity: id,
                timestamp: now,
                before: residentName,
                after: JSON.stringify({ residentId: id, residentName, archivedCount }),
                reason: deleteReason,
              },
              ...s.auditLogs,
            ].slice(0, 500),
          };
        });
        return archivedCount;
      },
      addNextOfKin: (residentId, nok) => setStore((s) => {
        const resident = s.residents.find((item) => item.id === residentId); if (!resident) return s;
        const now = new Date().toISOString(); const id = uid(); const contact = { ...nok, id, active: true, effectiveFrom: now };
        const event: TimelineEvent = { id: uid(), facilityId: resident.facilityId || activeFacilityId, residentId, type: "contact.assigned", title: nok.primaryContact ? "First Contact Assigned" : "Next of Kin Added", description: `${nok.name} was assigned as ${nok.primaryContact ? "First Contact" : "Next of Kin"}.`, linkedRecordId: id, linkedRecordKind: "resident_contact_relationship", createdAt: now, createdBy: currentUserName, role: currentRole };
        return { ...s, residents: s.residents.map((r) => r.id === residentId ? { ...r, nextOfKinList: [...(r.nextOfKinList || []).map((item) => nok.primaryContact ? { ...item, primaryContact: false } : item), contact] } : r), timelineEvents: [event, ...s.timelineEvents], auditLogs: [{ id: uid(), facilityId: resident.facilityId || activeFacilityId, user: currentUserName, role: currentRole, action: "Resident contact relationship added", entity: id, timestamp: now, before: "", after: JSON.stringify({ residentId, contactId: id, role: nok.primaryContact ? "first_contact" : "next_of_kin" }) }, ...s.auditLogs].slice(0, 500) };
      }),
      updateNextOfKin: (residentId, id, patch) => setStore((s) => {
        const resident = s.residents.find((item) => item.id === residentId); const before = resident?.nextOfKinList?.find((item) => item.id === id); if (!resident || !before) return s;
        const now = new Date().toISOString(); const event: TimelineEvent = { id: uid(), facilityId: resident.facilityId || activeFacilityId, residentId, type: "contact.changed", title: patch.primaryContact && !before.primaryContact ? "First Contact Changed" : "Contact Relationship Changed", description: patch.primaryContact && !before.primaryContact ? `${before.name} was assigned as First Contact.` : `${before.name}'s resident contact relationship was updated.`, linkedRecordId: id, linkedRecordKind: "resident_contact_relationship", createdAt: now, createdBy: currentUserName, role: currentRole };
        return { ...s, residents: s.residents.map((r) => r.id === residentId ? { ...r, nextOfKinList: (r.nextOfKinList || []).map((item) => item.id === id ? { ...item, ...patch } : patch.primaryContact ? { ...item, primaryContact: false } : item) } : r), timelineEvents: [event, ...s.timelineEvents], auditLogs: [{ id: uid(), facilityId: resident.facilityId || activeFacilityId, user: currentUserName, role: currentRole, action: "Resident contact relationship changed", entity: id, timestamp: now, before: JSON.stringify(before), after: JSON.stringify({ ...before, ...patch }) }, ...s.auditLogs].slice(0, 500) };
      }),
      removeNextOfKin: (residentId, id) => setStore((s) => {
        const resident = s.residents.find((item) => item.id === residentId); const before = resident?.nextOfKinList?.find((item) => item.id === id); if (!resident || !before) return s;
        const now = new Date().toISOString(); const event: TimelineEvent = { id: uid(), facilityId: resident.facilityId || activeFacilityId, residentId, type: "contact.inactivated", title: "Contact Relationship Inactivated", description: `${before.name}'s resident contact relationship was inactivated.`, linkedRecordId: id, linkedRecordKind: "resident_contact_relationship", createdAt: now, createdBy: currentUserName, role: currentRole };
        return { ...s, residents: s.residents.map((r) => r.id === residentId ? { ...r, nextOfKinList: (r.nextOfKinList || []).map((item) => item.id === id ? { ...item, active: false, effectiveTo: now, primaryContact: false } : item) } : r), timelineEvents: [event, ...s.timelineEvents], auditLogs: [{ id: uid(), facilityId: resident.facilityId || activeFacilityId, user: currentUserName, role: currentRole, action: "Resident contact relationship inactivated", entity: id, timestamp: now, before: JSON.stringify(before), after: JSON.stringify({ active: false, effectiveTo: now }) }, ...s.auditLogs].slice(0, 500) };
      }),
      addAssessment: (a) => {
        const now = new Date().toISOString();
        const isCompleted = (a.status || "completed") === "completed";
        const audit: AssessmentAuditEntry[] = [
          ...(a.auditTrail || []),
          {
            id: uid(),
            action: "created",
            byUserId: currentUser.id,
            byUserName: currentUserName,
            byRole: currentRole,
            at: now,
          },
        ];
        if (isCompleted) {
          audit.push({
            id: uid(),
            action: "completed",
            byUserId: currentUser.id,
            byUserName: currentUserName,
            byRole: currentRole,
            at: now,
          });
          audit.push({
            id: uid(),
            action: "locked",
            byUserId: currentUser.id,
            byUserName: currentUserName,
            byRole: currentRole,
            at: now,
          });
        }
        const item: Assessment = {
          ...a,
          id: uid(),
          status: a.status || "completed",
          version: a.version || 1,
          category: a.category || (a.type ? categoryFor(a.type) : undefined),
          reviewFrequency: a.reviewFrequency || "monthly",
          reviewTriggers: a.reviewTriggers || ["routine"],
          locked: isCompleted ? true : !!a.locked,
          lockedAt: isCompleted ? now : a.lockedAt,
          lockedBy: isCompleted ? currentUserName : a.lockedBy,
          nextReassessmentDate:
            a.nextReassessmentDate ||
            (a.reviewFrequency
              ? computeNextReviewDate(a.reviewFrequency, a.customReviewDays)
              : undefined),
          auditTrail: audit,
          clinicalComments: a.clinicalComments || [],
          linkedProblemIds: a.linkedProblemIds || [],
        };
        setStore((s) => ({ ...s, assessments: [item, ...s.assessments] }));
        // Emit timeline event
        const ev: TimelineEvent = {
          id: uid(),
          residentId: a.residentId,
          type: "assessment.created",
          title: `${a.type.replace("_", " ")} assessment ${isCompleted ? "completed" : "started"}`,
          description: isCompleted ? `Score ${a.totalScore} · ${a.interpretation}` : "Draft saved",
          linkedRecordId: item.id,
          linkedRecordKind: "assessment",
          createdAt: now,
          createdBy: currentUserName,
          role: currentRole,
        };
        setStore((s) => ({ ...s, timelineEvents: [ev, ...s.timelineEvents] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Created ${a.type} assessment`,
          entity: a.residentId,
        });
        return item;
      },
      updateAssessment: (id, patch) => {
        const existing = store.assessments.find((x) => x.id === id);
        if (
          existing?.locked &&
          !patch.status &&
          !patch.linkedProblemIds &&
          !patch.clinicalComments &&
          !patch.linkedIncidentIds
        ) {
          // Block content edits on locked assessments — caller should use createAssessmentRevision
          logAudit({
            user: currentUserName,
            role: currentRole,
            action: "Blocked edit on locked assessment",
            entity: id,
            reason: "Assessment is locked; create a revision",
          });
          return;
        }
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          assessments: s.assessments.map((a) => {
            if (a.id !== id) return a;
            const audit = [
              ...(a.auditTrail || []),
              {
                id: uid(),
                action: "edited" as const,
                byUserId: currentUser.id,
                byUserName: currentUserName,
                byRole: currentRole,
                at: now,
              },
            ];
            return { ...a, ...patch, auditTrail: audit };
          }),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated assessment",
          entity: id,
        });
      },
      completeAssessment: (id) => {
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          assessments: s.assessments.map((a) => {
            if (a.id !== id) return a;
            const audit = [
              ...(a.auditTrail || []),
              {
                id: uid(),
                action: "completed" as const,
                byUserId: currentUser.id,
                byUserName: currentUserName,
                byRole: currentRole,
                at: now,
              },
              {
                id: uid(),
                action: "locked" as const,
                byUserId: currentUser.id,
                byUserName: currentUserName,
                byRole: currentRole,
                at: now,
              },
            ];
            return {
              ...a,
              status: "completed",
              locked: true,
              lockedAt: now,
              lockedBy: currentUserName,
              nextReassessmentDate:
                a.nextReassessmentDate ||
                (a.reviewFrequency
                  ? computeNextReviewDate(a.reviewFrequency, a.customReviewDays)
                  : undefined),
              auditTrail: audit,
            };
          }),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Completed & locked assessment",
          entity: id,
        });
      },
      createAssessmentRevision: (id, reason) => {
        const prior = store.assessments.find((a) => a.id === id);
        if (!prior) return undefined;
        const now = new Date().toISOString();
        const newId2 = uid();
        const revision: Assessment = {
          ...prior,
          id: newId2,
          status: "draft",
          locked: false,
          version: (prior.version || 1) + 1,
          previousVersionId: prior.id,
          supersedesId: prior.id,
          revisionReason: reason,
          date: now,
          assessor: currentUserName,
          assessorRole: currentRole,
          lockedAt: undefined,
          lockedBy: undefined,
          auditTrail: [
            {
              id: uid(),
              action: "created",
              byUserId: currentUser.id,
              byUserName: currentUserName,
              byRole: currentRole,
              at: now,
              reason,
              fromVersionId: prior.id,
            },
          ],
          clinicalComments: [],
        };
        setStore((s) => ({
          ...s,
          assessments: [
            revision,
            ...s.assessments.map((a) =>
              a.id === id
                ? {
                    ...a,
                    supersededById: newId2,
                    auditTrail: [
                      ...(a.auditTrail || []),
                      {
                        id: uid(),
                        action: "revised" as const,
                        byUserId: currentUser.id,
                        byUserName: currentUserName,
                        byRole: currentRole,
                        at: now,
                        reason,
                      },
                      {
                        id: uid(),
                        action: "superseded" as const,
                        byUserId: currentUser.id,
                        byUserName: currentUserName,
                        byRole: currentRole,
                        at: now,
                      },
                    ],
                  }
                : a,
            ),
          ],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created assessment revision",
          entity: newId2,
          reason,
        });
        return revision;
      },
      assignAssessment: (id, input) => {
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          assessments: s.assessments.map((a) =>
            a.id === id
              ? {
                  ...a,
                  assignedToUserId: input.userId,
                  assignedToName: input.userName,
                  assignedToRole: input.role,
                  assignedAt: now,
                  assignedBy: currentUserName,
                  dueDate: input.dueDate,
                  auditTrail: [
                    ...(a.auditTrail || []),
                    {
                      id: uid(),
                      action: "assigned" as const,
                      byUserId: currentUser.id,
                      byUserName: currentUserName,
                      byRole: currentRole,
                      at: now,
                      reason: `Assigned to ${input.userName} (${input.role}), due ${input.dueDate}`,
                    },
                  ],
                }
              : a,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Assigned assessment to ${input.userName}`,
          entity: id,
        });
      },
      archiveAssessment: (id, reason) => {
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          assessments: s.assessments.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: "archived",
                  archivedBy: currentUserName,
                  archivedAt: now,
                  archivedReason: reason,
                  auditTrail: [
                    ...(a.auditTrail || []),
                    {
                      id: uid(),
                      action: "archived" as const,
                      byUserId: currentUser.id,
                      byUserName: currentUserName,
                      byRole: currentRole,
                      at: now,
                      reason,
                    },
                  ],
                }
              : a,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Archived assessment",
          entity: id,
          reason,
        });
      },
      restoreAssessment: (id) => {
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          assessments: s.assessments.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: "completed",
                  restoredBy: currentUserName,
                  restoredAt: now,
                  archivedAt: undefined,
                  archivedBy: undefined,
                  deletedAt: undefined,
                  deletedBy: undefined,
                  deletedReason: undefined,
                  auditTrail: [
                    ...(a.auditTrail || []),
                    {
                      id: uid(),
                      action: "restored" as const,
                      byUserId: currentUser.id,
                      byUserName: currentUserName,
                      byRole: currentRole,
                      at: now,
                    },
                  ],
                }
              : a,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Restored assessment",
          entity: id,
        });
      },
      softDeleteAssessment: (id, reason) => {
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          assessments: s.assessments.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: "deleted",
                  deletedBy: currentUserName,
                  deletedAt: now,
                  deletedReason: reason,
                  auditTrail: [
                    ...(a.auditTrail || []),
                    {
                      id: uid(),
                      action: "deleted" as const,
                      byUserId: currentUser.id,
                      byUserName: currentUserName,
                      byRole: currentRole,
                      at: now,
                      reason,
                    },
                  ],
                }
              : a,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted assessment (soft)",
          entity: id,
          reason,
        });
      },
      addAssessmentComment: (id, body) => {
        const now = new Date().toISOString();
        const comment: AssessmentComment = {
          id: uid(),
          authorId: currentUser.id,
          authorName: currentUserName,
          role: currentRole,
          at: now,
          body,
        };
        setStore((s) => ({
          ...s,
          assessments: s.assessments.map((a) =>
            a.id === id
              ? {
                  ...a,
                  clinicalComments: [...(a.clinicalComments || []), comment],
                  auditTrail: [
                    ...(a.auditTrail || []),
                    {
                      id: uid(),
                      action: "commented" as const,
                      byUserId: currentUser.id,
                      byUserName: currentUserName,
                      byRole: currentRole,
                      at: now,
                    },
                  ],
                }
              : a,
          ),
        }));
      },
      fireReviewTrigger: (input) => {
        const affected = TRIGGER_TO_TYPES[input.trigger] || [];
        const ev: AssessmentReviewTriggerEvent = {
          id: uid(),
          residentId: input.residentId,
          trigger: input.trigger,
          sourceModule: input.sourceModule,
          sourceRecordId: input.sourceRecordId,
          at: new Date().toISOString(),
          byUserName: currentUserName,
          affectedAssessmentTypes: affected,
          note: input.note,
        };
        setStore((s) => ({ ...s, assessmentTriggerEvents: [ev, ...s.assessmentTriggerEvents] }));
        // Find latest completed assessments matching trigger types and queue alerts
        const resident = store.residents.find((r) => r.id === input.residentId);
        const residentName = resident ? `${resident.firstName} ${resident.lastName}` : "Resident";
        for (const t of affected) {
          const latest = store.assessments.find(
            (a) => a.residentId === input.residentId && a.type === t && a.status === "completed",
          );
          if (latest) {
            setStore((s) => ({
              ...s,
              alerts: [
                {
                  id: uid(),
                  residentId: input.residentId,
                  title: `${t.replace("_", " ")} reassessment required`,
                  description: `${input.trigger.replace(/_/g, " ")} → reassess ${t.replace("_", " ")} for ${residentName}`,
                  priority: "high" as const,
                  createdAt: new Date().toISOString(),
                  acknowledged: false,
                  linkedAssessmentId: latest.id,
                },
                ...s.alerts,
              ],
            }));
          }
        }
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Triggered reassessment: ${input.trigger}`,
          entity: input.residentId,
          reason: input.note,
        });
      },
      addInterventionLog: (l) => {
        const item: InterventionLog = { ...l, id: uid() };
        setStore((s) => ({ ...s, interventionLogs: [item, ...s.interventionLogs] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Logged intervention: ${l.outcome}`,
          entity: l.carePlanId,
        });
        return item;
      },
      recordReadReceipt: (entityType, entityId) => {
        setStore((s) => {
          // dedupe per user per entity
          const exists = s.readReceipts.find(
            (r) => r.entityId === entityId && r.userId === currentUser.id,
          );
          if (exists) return s;
          const item: ReadReceipt = {
            id: uid(),
            entityType,
            entityId,
            userId: currentUser.id,
            userName: currentUserName,
            role: currentRole,
            timestamp: new Date().toISOString(),
          };
          return { ...s, readReceipts: [item, ...s.readReceipts] };
        });
      },
      addIntervention: (i) => {
        const item = { ...i, id: uid() };
        const ev: TimelineEvent = {
          id: uid(),
          residentId: i.residentId,
          type: "intervention.created",
          title: `Intervention created: ${i.intervention}`,
          description: `${i.outcome}${i.notes ? ` · ${i.notes}` : ""}`,
          createdAt: i.date,
          createdBy: i.staff,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "intervention",
        };
        setStore((s) => ({
          ...s,
          interventions: [item, ...s.interventions],
          timelineEvents: [ev, ...s.timelineEvents],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Created intervention: ${i.intervention}`,
          entity: item.id,
        });
        return item;
      },
      addNote: (n) => {
        const resident = store.residents.find((item) => item.id === n.residentId);
        if (!resident) throw new Error("Resident not found.");
        const residentHomeId = resident.facilityId || activeFacilityId;
        if (!canAccess(store, createStaffAccessContext(currentUser, residentHomeId), "resident.view", { nursingHomeId: residentHomeId, residentId: resident.id })) {
          throw new Error("You do not have access to this resident.");
        }
        if (!can(currentRole, "note.create")) {
          throw new Error("Missing permission: note.create");
        }
        const requestedCarePlanId = n.carePlanId ?? n.linkedProblemId ?? null;
        let linkedCarePlanProblem: CarePlanProblem | undefined;
        if (requestedCarePlanId) {
          linkedCarePlanProblem = store.carePlanProblems.find((carePlan) => carePlan.id === requestedCarePlanId);
          if (!linkedCarePlanProblem) throw new Error("Related Activity of Living care plan not found.");
          const carePlanHomeId = linkedCarePlanProblem.facilityId || activeFacilityId;
          if (carePlanHomeId !== residentHomeId) throw new Error("Daily Note and care plan must belong to the same nursing home.");
          if (linkedCarePlanProblem.residentId !== n.residentId) throw new Error("Daily Note and care plan must belong to the same resident.");
          if (linkedCarePlanProblem.status !== "active") throw new Error("Only active Activity of Living care plans can be linked.");
          if (!canAccess(store, createStaffAccessContext(currentUser, carePlanHomeId), "careplan.view", { nursingHomeId: carePlanHomeId, residentId: linkedCarePlanProblem.residentId })) {
            throw new Error("You do not have access to the selected care plan.");
          }
        }
        const item = {
          ...n,
          facilityId: n.facilityId || residentHomeId,
          carePlanId: linkedCarePlanProblem?.id ?? null,
          linkedProblemId: linkedCarePlanProblem?.id,
          id: uid(),
        };
        const ev: TimelineEvent = {
          id: uid(),
          residentId: n.residentId,
          type: "note.created",
          title: `Daily note (${n.shift})`,
          description: n.observation,
          createdAt: n.date,
          createdBy: n.staff,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "daily_note",
        };
        setStore((s) => ({
          ...s,
          notes: [item, ...s.notes],
          timelineEvents: [ev, ...s.timelineEvents],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created daily note",
          entity: item.id,
        });
        if (linkedCarePlanProblem) {
          logAudit({
            facilityId: residentHomeId,
            user: currentUserName,
            role: currentRole,
            action: "Daily Note linked to Care Plan",
            entity: item.id,
            entityType: "daily_note",
            before: JSON.stringify({ carePlanId: null, residentId: n.residentId }),
            after: JSON.stringify({ carePlanId: linkedCarePlanProblem.id, residentId: n.residentId }),
          });
        }
        return item;
      },
      updateNote: (id, patch) => {
        const existing = store.notes.find((note) => note.id === id);
        if (!existing) throw new Error("Daily Note not found.");
        const nextResidentId = patch.residentId || existing.residentId;
        const resident = store.residents.find((item) => item.id === nextResidentId);
        if (!resident) throw new Error("Resident not found.");
        const residentHomeId = resident.facilityId || activeFacilityId;
        if (!canAccess(store, createStaffAccessContext(currentUser, residentHomeId), "resident.view", { nursingHomeId: residentHomeId, residentId: resident.id })) {
          throw new Error("You do not have access to this resident.");
        }
        if (!can(currentRole, "note.create")) {
          throw new Error("Missing permission: note.create");
        }

        const previousCarePlanId = existing.carePlanId ?? existing.linkedProblemId ?? null;
        const requestedCarePlanId =
          Object.prototype.hasOwnProperty.call(patch, "carePlanId") || Object.prototype.hasOwnProperty.call(patch, "linkedProblemId")
            ? patch.carePlanId ?? patch.linkedProblemId ?? null
            : previousCarePlanId;
        let linkedCarePlanProblem: CarePlanProblem | undefined;
        if (requestedCarePlanId) {
          linkedCarePlanProblem = store.carePlanProblems.find((carePlan) => carePlan.id === requestedCarePlanId);
          if (!linkedCarePlanProblem) {
            const changingCarePlan = Object.prototype.hasOwnProperty.call(patch, "carePlanId") || Object.prototype.hasOwnProperty.call(patch, "linkedProblemId");
            if (changingCarePlan) throw new Error("Related Activity of Living care plan not found.");
          }
        }
        if (linkedCarePlanProblem) {
          const carePlanHomeId = linkedCarePlanProblem.facilityId || activeFacilityId;
          if (carePlanHomeId !== residentHomeId) throw new Error("Daily Note and care plan must belong to the same nursing home.");
          if (linkedCarePlanProblem.residentId !== nextResidentId) throw new Error("Daily Note and care plan must belong to the same resident.");
          if (linkedCarePlanProblem.status !== "active") throw new Error("Only active Activity of Living care plans can be linked.");
          if (!canAccess(store, createStaffAccessContext(currentUser, carePlanHomeId), "careplan.view", { nursingHomeId: carePlanHomeId, residentId: linkedCarePlanProblem.residentId })) {
            throw new Error("You do not have access to the selected care plan.");
          }
        }
        const nextCarePlanId = linkedCarePlanProblem?.id ?? null;
        setStore((s) => ({
          ...s,
          notes: s.notes.map((note) =>
            note.id === id
              ? {
                  ...note,
                  ...patch,
                  residentId: nextResidentId,
                  facilityId: patch.facilityId || note.facilityId || residentHomeId,
                  carePlanId: nextCarePlanId,
                  linkedProblemId: linkedCarePlanProblem?.id || undefined,
                }
              : note,
          ),
        }));
        if (previousCarePlanId !== nextCarePlanId) {
          const action = previousCarePlanId && nextCarePlanId
            ? "Daily Note care plan link changed"
            : nextCarePlanId
              ? "Daily Note linked to Care Plan"
              : "Daily Note unlinked from Care Plan";
          logAudit({
            facilityId: residentHomeId,
            user: currentUserName,
            role: currentRole,
            action,
            entity: id,
            entityType: "daily_note",
            before: JSON.stringify({ carePlanId: previousCarePlanId, residentId: existing.residentId }),
            after: JSON.stringify({ carePlanId: nextCarePlanId, residentId: nextResidentId }),
          });
        }
      },
      addEvaluation: (e) => {
        const item = { ...e, id: uid() };
        const ev: TimelineEvent = {
          id: uid(),
          residentId: e.residentId,
          type: "careplan.evaluated",
          title: `Care plan evaluation: ${e.outcomeRating}`,
          description: e.summary,
          createdAt: e.date,
          createdBy: e.evaluatedBy,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "evaluation",
        };
        setStore((s) => ({
          ...s,
          evaluations: [item, ...s.evaluations],
          timelineEvents: [ev, ...s.timelineEvents],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created evaluation",
          entity: item.id,
        });
        return item;
      },
      acknowledgeAlert: (id) => {
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          alerts: s.alerts.map((a) =>
            a.id === id
              ? { ...a, acknowledged: true, acknowledgedBy: currentUserName, acknowledgedAt: now }
              : a,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Acknowledged alert",
          entity: id,
        });
      },
      resolveAlert: (id) => {
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          alerts: s.alerts.map((a) =>
            a.id === id ? { ...a, resolvedBy: currentUserName, resolvedAt: now } : a,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Resolved alert",
          entity: id,
        });
      },
      acknowledgeActionAlert: (input) => {
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          alertWorkflow: {
            ...s.alertWorkflow,
            [input.id]: {
              ...input,
              acknowledgedBy: currentUserName,
              acknowledgedAt: now,
            },
          },
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Acknowledged action alert",
          entity: input.id,
        });
      },
      addAlert: (a) =>
        setStore((s) => ({
          ...s,
          alerts: [
            { ...a, id: uid(), createdAt: new Date().toISOString(), acknowledged: false },
            ...s.alerts,
          ],
        })),
      updateTask: (id, patch) =>
        setStore((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      softDeleteTask: (id, reason) => {
        const now = new Date().toISOString();
        const task = store.tasks.find((t) => t.id === id);
        setStore((s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: "deleted",
                  deletedBy: currentUserName,
                  deletedAt: now,
                  deleteReason: reason?.trim() || undefined,
                }
              : t,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Deleted task: ${task?.title || id}`,
          entity: id,
          reason: reason?.trim() || undefined,
        });
      },
      addTask: (t) => {
        const item = { ...t, id: uid() };
        const ev: TimelineEvent = {
          id: uid(),
          residentId: t.residentId,
          type: "task.created",
          title: `Task created: ${t.title}`,
          description: t.description,
          createdAt: t.dueDate,
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "task",
        };
        setStore((s) => ({
          ...s,
          tasks: [item, ...s.tasks],
          timelineEvents: [ev, ...s.timelineEvents],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Created task: ${t.title}`,
          entity: item.id,
        });
        return item;
      },
      // -------------------- INCIDENTS --------------------
      addIncident: (i) => {
        const item: Incident = {
          ...i,
          id: uid(),
          recordStatus: i.recordStatus || "active",
          createdAt: i.createdAt || new Date().toISOString(),
          createdBy: i.createdBy || currentUserName,
          createdByRole: i.createdByRole || currentRole,
          status: i.status || "open",
        };
        const ev: TimelineEvent = {
          id: uid(),
          residentId: i.residentId,
          type: "incident.created",
          title: `Incident: ${i.type.replace("_", " ")} (${i.severity})`,
          description: i.description,
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "incident",
          priority:
            i.severity === "critical" ? "critical" : i.severity === "high" ? "high" : "medium",
        };
        setStore((s) => ({
          ...s,
          incidents: [item, ...s.incidents],
          timelineEvents: [ev, ...s.timelineEvents],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Created incident (${item.status})`,
          entity: item.id,
          after: JSON.stringify({ type: i.type, severity: i.severity }),
        });
        return item;
      },
      updateIncident: (id, patch) => {
        setStore((s) => ({
          ...s,
          incidents: s.incidents.map((i) =>
            i.id === id
              ? { ...i, ...patch, updatedAt: new Date().toISOString(), updatedBy: currentUserName }
              : i,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated incident",
          entity: id,
          after: JSON.stringify(patch),
        });
      },
      archiveIncident: (id) => {
        setStore((s) => ({
          ...s,
          incidents: s.incidents.map((i) =>
            i.id === id
              ? {
                  ...i,
                  recordStatus: "archived" as const,
                  archivedAt: new Date().toISOString(),
                  archivedBy: currentUserName,
                }
              : i,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Archived incident",
          entity: id,
        });
      },
      restoreIncident: (id) => {
        setStore((s) => ({
          ...s,
          incidents: s.incidents.map((i) =>
            i.id === id
              ? {
                  ...i,
                  recordStatus: "active" as const,
                  archivedAt: undefined,
                  archivedBy: undefined,
                  deletedAt: undefined,
                  deletedBy: undefined,
                  deletedReason: undefined,
                }
              : i,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Restored incident",
          entity: id,
        });
      },
      softDeleteIncident: (id, reason) => {
        setStore((s) => ({
          ...s,
          incidents: s.incidents.map((i) =>
            i.id === id
              ? {
                  ...i,
                  recordStatus: "deleted" as const,
                  deletedAt: new Date().toISOString(),
                  deletedBy: currentUserName,
                  deletedReason: reason,
                }
              : i,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted incident (soft)",
          entity: id,
          reason,
        });
      },
      duplicateIncident: (id) => {
        const src = store.incidents.find((i) => i.id === id);
        if (!src) return undefined;
        const copy: Incident = {
          ...src,
          id: uid(),
          date: new Date().toISOString().slice(0, 10),
          status: "draft",
          recordStatus: "active",
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
          createdByRole: currentRole,
          updatedAt: undefined,
          updatedBy: undefined,
          archivedAt: undefined,
          archivedBy: undefined,
          deletedAt: undefined,
          deletedBy: undefined,
          deletedReason: undefined,
          closedAt: undefined,
          closedBy: undefined,
          reopenedAt: undefined,
          reopenedBy: undefined,
        };
        setStore((s) => ({ ...s, incidents: [copy, ...s.incidents] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Duplicated incident",
          entity: copy.id,
          reason: `Copied from ${id}`,
        });
        return copy;
      },
      closeIncident: (id) => {
        setStore((s) => ({
          ...s,
          incidents: s.incidents.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: "closed" as const,
                  closedAt: new Date().toISOString(),
                  closedBy: currentUserName,
                }
              : i,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Closed incident",
          entity: id,
        });
      },
      reopenIncident: (id) => {
        setStore((s) => ({
          ...s,
          incidents: s.incidents.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: "open" as const,
                  reopenedAt: new Date().toISOString(),
                  reopenedBy: currentUserName,
                  closedAt: undefined,
                  closedBy: undefined,
                }
              : i,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Reopened incident",
          entity: id,
        });
      },
      submitIncident: (id) => {
        setStore((s) => ({
          ...s,
          incidents: s.incidents.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: "open" as const,
                  updatedAt: new Date().toISOString(),
                  updatedBy: currentUserName,
                }
              : i,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Submitted incident draft",
          entity: id,
        });
      },

      addMDTNote: (m) => {
        const now = new Date().toISOString();
        const item: MDTNote = {
          ...m,
          id: uid(),
          createdAt: m.createdAt || now,
          createdBy: m.createdBy || currentUserName,
          createdByRole: m.createdByRole || currentRole,
          authoredBy: m.authoredBy || currentUserName,
          role: m.role || currentRole,
        };
        const ev: TimelineEvent = {
          id: uid(),
          residentId: m.residentId,
          type: "mdt.created",
          title: `${item.meetingType || "MDT"} meeting recorded`,
          description: item.discussion,
          createdAt: item.date,
          createdBy: item.authoredBy,
          role: item.role,
          linkedRecordId: item.id,
          linkedRecordKind: "mdt_note",
        };
        setStore((s) => ({
          ...s,
          mdtNotes: [item, ...s.mdtNotes],
          timelineEvents: [ev, ...s.timelineEvents],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created MDT meeting",
          entity: item.id,
        });
        return item;
      },
      updateMDTNote: (id, patch) => {
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          mdtNotes: s.mdtNotes.map((note) =>
            note.id === id
              ? {
                  ...note,
                  ...patch,
                  updatedAt: now,
                  updatedBy: currentUserName,
                  lastModifiedAt: now,
                  lastModifiedBy: currentUserName,
                }
              : note,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Edited MDT meeting",
          entity: id,
        });
      },

      // -------------------- VISITORS --------------------
      addVisitor: (v) => {
        const item: Visitor = {
          ...v,
          id: uid(),
          recordStatus: v.recordStatus || "active",
          status: v.status || "checked_in",
          createdAt: v.createdAt || new Date().toISOString(),
          createdBy: v.createdBy || currentUserName,
          createdByRole: v.createdByRole || currentRole,
        };
        const ev: TimelineEvent = {
          id: uid(),
          residentId: v.residentId,
          type: "visitor.logged",
          title: `Visitor: ${v.visitorName} (${v.relationship})`,
          description: v.notes,
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "visitor",
        };
        setStore((s) => ({
          ...s,
          visitors: [item, ...s.visitors],
          timelineEvents: [ev, ...s.timelineEvents],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created visitor",
          entity: item.id,
          after: JSON.stringify({ visitor: v.visitorName }),
        });
        return item;
      },
      updateVisitor: (id, patch) => {
        setStore((s) => ({
          ...s,
          visitors: s.visitors.map((v) =>
            v.id === id
              ? { ...v, ...patch, updatedAt: new Date().toISOString(), updatedBy: currentUserName }
              : v,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated visitor",
          entity: id,
          after: JSON.stringify(patch),
        });
      },
      archiveVisitor: (id) => {
        setStore((s) => ({
          ...s,
          visitors: s.visitors.map((v) =>
            v.id === id
              ? {
                  ...v,
                  recordStatus: "archived" as const,
                  archivedAt: new Date().toISOString(),
                  archivedBy: currentUserName,
                }
              : v,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Archived visitor",
          entity: id,
        });
      },
      restoreVisitor: (id) => {
        setStore((s) => ({
          ...s,
          visitors: s.visitors.map((v) =>
            v.id === id
              ? {
                  ...v,
                  recordStatus: "active" as const,
                  archivedAt: undefined,
                  archivedBy: undefined,
                  deletedAt: undefined,
                  deletedBy: undefined,
                  deletedReason: undefined,
                }
              : v,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Restored visitor",
          entity: id,
        });
      },
      softDeleteVisitor: (id, reason) => {
        setStore((s) => ({
          ...s,
          visitors: s.visitors.map((v) =>
            v.id === id
              ? {
                  ...v,
                  recordStatus: "deleted" as const,
                  deletedAt: new Date().toISOString(),
                  deletedBy: currentUserName,
                  deletedReason: reason,
                }
              : v,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted visitor (soft)",
          entity: id,
          reason,
        });
      },
      cancelVisitor: (id, reason) => {
        setStore((s) => ({
          ...s,
          visitors: s.visitors.map((v) =>
            v.id === id
              ? {
                  ...v,
                  status: "cancelled" as const,
                  cancelledReason: reason,
                  updatedAt: new Date().toISOString(),
                  updatedBy: currentUserName,
                }
              : v,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Cancelled visit",
          entity: id,
          reason,
        });
      },
      completeVisitor: (id) => {
        setStore((s) => ({
          ...s,
          visitors: s.visitors.map((v) =>
            v.id === id
              ? {
                  ...v,
                  status: "completed" as const,
                  updatedAt: new Date().toISOString(),
                  updatedBy: currentUserName,
                }
              : v,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Completed visit",
          entity: id,
        });
      },

      // -------------------- OUTINGS --------------------
      addOuting: (o) => {
        const item: Outing = {
          ...o,
          id: uid(),
          recordStatus: o.recordStatus || "active",
          status: o.status || "planned",
          createdAt: o.createdAt || new Date().toISOString(),
          createdBy: o.createdBy || currentUserName,
          createdByRole: o.createdByRole || currentRole,
        };
        const ev: TimelineEvent = {
          id: uid(),
          residentId: o.residentId,
          type: "outing.started",
          title: `Outing: ${o.destination}`,
          description: o.notes,
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "outing",
        };
        setStore((s) => ({
          ...s,
          outings: [item, ...s.outings],
          timelineEvents: [ev, ...s.timelineEvents],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created outing",
          entity: item.id,
          after: JSON.stringify({ destination: o.destination }),
        });
        return item;
      },
      updateOuting: (id, patch) => {
        setStore((s) => ({
          ...s,
          outings: s.outings.map((o) =>
            o.id === id
              ? { ...o, ...patch, updatedAt: new Date().toISOString(), updatedBy: currentUserName }
              : o,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated outing",
          entity: id,
          after: JSON.stringify(patch),
        });
      },
      archiveOuting: (id) => {
        setStore((s) => ({
          ...s,
          outings: s.outings.map((o) =>
            o.id === id
              ? {
                  ...o,
                  recordStatus: "archived" as const,
                  archivedAt: new Date().toISOString(),
                  archivedBy: currentUserName,
                }
              : o,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Archived outing",
          entity: id,
        });
      },
      restoreOuting: (id) => {
        setStore((s) => ({
          ...s,
          outings: s.outings.map((o) =>
            o.id === id
              ? {
                  ...o,
                  recordStatus: "active" as const,
                  archivedAt: undefined,
                  archivedBy: undefined,
                  deletedAt: undefined,
                  deletedBy: undefined,
                  deletedReason: undefined,
                }
              : o,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Restored outing",
          entity: id,
        });
      },
      softDeleteOuting: (id, reason) => {
        setStore((s) => ({
          ...s,
          outings: s.outings.map((o) =>
            o.id === id
              ? {
                  ...o,
                  recordStatus: "deleted" as const,
                  deletedAt: new Date().toISOString(),
                  deletedBy: currentUserName,
                  deletedReason: reason,
                }
              : o,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted outing (soft)",
          entity: id,
          reason,
        });
      },
      recordOutingDeparture: (id, time) => {
        setStore((s) => ({
          ...s,
          outings: s.outings.map((o) =>
            o.id === id
              ? {
                  ...o,
                  departureTime: time,
                  status: "departed" as const,
                  updatedAt: new Date().toISOString(),
                  updatedBy: currentUserName,
                }
              : o,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Outing departure recorded (${time})`,
          entity: id,
        });
      },
      recordOutingReturn: (id, time, outcome) => {
        setStore((s) => {
          const o = s.outings.find((x) => x.id === id);
          const ev: TimelineEvent | null = o
            ? {
                id: uid(),
                residentId: o.residentId,
                type: "outing.returned",
                title: `Outing return: ${o.destination}`,
                description: outcome,
                createdAt: new Date().toISOString(),
                createdBy: currentUserName,
                role: currentRole,
                linkedRecordId: id,
                linkedRecordKind: "outing",
              }
            : null;
          return {
            ...s,
            outings: s.outings.map((x) =>
              x.id === id
                ? {
                    ...x,
                    returnTime: time,
                    outcomeNotes: outcome ?? x.outcomeNotes,
                    status: "returned" as const,
                    updatedAt: new Date().toISOString(),
                    updatedBy: currentUserName,
                  }
                : x,
            ),
            timelineEvents: ev ? [ev, ...s.timelineEvents] : s.timelineEvents,
          };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Outing return recorded (${time})`,
          entity: id,
        });
      },
      cancelOuting: (id, reason) => {
        setStore((s) => ({
          ...s,
          outings: s.outings.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status: "cancelled" as const,
                  cancelledReason: reason,
                  updatedAt: new Date().toISOString(),
                  updatedBy: currentUserName,
                }
              : o,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Cancelled outing",
          entity: id,
          reason,
        });
      },
      closeOuting: (id) => {
        setStore((s) => ({
          ...s,
          outings: s.outings.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status: "closed" as const,
                  updatedAt: new Date().toISOString(),
                  updatedBy: currentUserName,
                }
              : o,
          ),
        }));
        logAudit({ user: currentUserName, role: currentRole, action: "Closed outing", entity: id });
      },

      // -------------------- HANDOVERS --------------------
      addHandover: (h) => {
        const resident = store.residents.find((item) => item.id === h.residentId);
        const nextShift = getNextShift(store, operationalContext.nursingHomeId, operationalContext.shiftId, operationalContext.operationalDate);
        const item: HandoverNote = {
          ...h,
          id: uid(),
          facilityId: h.facilityId || resident?.facilityId || operationalContext.nursingHomeId,
          nursingHomeId: h.nursingHomeId || (resident?.facilityId as any) || operationalContext.nursingHomeId,
          wardId: h.wardId || (resident?.wardId as any) || operationalContext.wardIds[0],
          originWardId: h.originWardId || (resident?.wardId as any) || operationalContext.wardIds[0],
          scope: h.scope || "resident",
          category: h.category || "clinical",
          handoverPriority: h.handoverPriority || (h.priority === "critical" || h.priority === "high" ? "urgent" : h.priority === "medium" ? "important" : "routine"),
          sourceShiftId: h.sourceShiftId || operationalContext.shiftId,
          targetShiftId: h.targetShiftId || nextShift?.shift.id || operationalContext.shiftId,
          operationalDate: h.operationalDate || operationalContext.operationalDate,
          effectiveFrom: h.effectiveFrom || nextShift?.start || operationalContext.shiftStartAt,
          expiresAt: h.expiresAt || nextShift?.end || operationalContext.shiftEndAt,
          recordStatus: h.recordStatus || "active",
          status: h.status || "active",
          createdAt: h.createdAt || new Date().toISOString(),
          createdBy: h.createdBy || currentUserName,
          createdByRole: h.createdByRole || currentRole,
        };
        const ev: TimelineEvent = {
          id: uid(),
          residentId: h.residentId,
          type: "handover.created",
          title: `Handover (${h.shift})`,
          description: h.summary,
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "handover",
          priority: h.priority,
        };
        const domainEvent = createDomainEvent({
          eventType: "HandoverCreated",
          occurredAt: item.effectiveFrom || item.createdAt || new Date().toISOString(),
          recordedAt: item.createdAt || new Date().toISOString(),
          actor: {
            actorType: "user",
            userAccountId: currentUser.id,
            staffMemberId: operationalContext.staffMemberId,
            displayName: currentUserName,
            effectiveRoleKey: currentRole,
          },
          scope: {
            nursingHomeId: item.nursingHomeId || item.facilityId || operationalContext.nursingHomeId,
            wardId: item.wardId,
            shiftId: item.targetShiftId,
            operationalDate: item.operationalDate,
            timezone: operationalContext.timezone,
          },
          subject: { entityType: "HandoverNote", entityId: item.id, residentId: item.residentId },
          source: { module: "handovers", service: "handover_service", operation: "create" },
          payload: {
            handoverId: item.id,
            residentId: item.residentId,
            wardId: item.wardId || operationalContext.wardIds[0],
            scope: item.scope || "resident",
            category: item.category || "clinical",
            priority: item.handoverPriority || "routine",
            sourceShiftId: item.sourceShiftId || operationalContext.shiftId,
            targetShiftId: item.targetShiftId || operationalContext.shiftId,
            effectiveFrom: item.effectiveFrom || item.createdAt || new Date().toISOString(),
            expiresAt: item.expiresAt,
          },
          correlationId: createCorrelationId("handover"),
        });
        setStore((s) => {
          const next = appendEventRecord({
            ...s,
            handovers: [item, ...s.handovers],
            timelineEvents: [ev, ...s.timelineEvents],
          }, domainEvent);
          return processRulesForEvent(next, domainEvent);
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Created handover (${item.shift})`,
          entity: item.id,
        });
        return item;
      },
      updateHandover: (id, patch) => {
        setStore((s) => ({
          ...s,
          handovers: s.handovers.map((h) =>
            h.id === id
              ? { ...h, ...patch, updatedAt: new Date().toISOString(), updatedBy: currentUserName }
              : h,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated handover",
          entity: id,
          after: JSON.stringify(patch),
        });
      },
      archiveHandover: (id) => {
        setStore((s) => ({
          ...s,
          handovers: s.handovers.map((h) =>
            h.id === id
              ? {
                  ...h,
                  recordStatus: "archived" as const,
                  archivedAt: new Date().toISOString(),
                  archivedBy: currentUserName,
                }
              : h,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Archived handover",
          entity: id,
        });
      },
      restoreHandover: (id) => {
        setStore((s) => ({
          ...s,
          handovers: s.handovers.map((h) =>
            h.id === id
              ? {
                  ...h,
                  recordStatus: "active" as const,
                  archivedAt: undefined,
                  archivedBy: undefined,
                  deletedAt: undefined,
                  deletedBy: undefined,
                  deletedReason: undefined,
                }
              : h,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Restored handover",
          entity: id,
        });
      },
      softDeleteHandover: (id, reason) => {
        setStore((s) => ({
          ...s,
          handovers: s.handovers.map((h) =>
            h.id === id
              ? {
                  ...h,
                  recordStatus: "deleted" as const,
                  deletedAt: new Date().toISOString(),
                  deletedBy: currentUserName,
                  deletedReason: reason,
                }
              : h,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted handover (soft)",
          entity: id,
          reason,
        });
      },
      markHandoverRead: (id) => {
        const now = new Date().toISOString();
        setStore((s) => {
          const h = s.handovers.find((x) => x.id === id);
          const alreadyRead =
            Array.isArray(h?.readBy) && h?.readBy.includes(currentUserName);
          return {
            ...s,
            handovers: s.handovers.map((x) =>
              x.id === id
                ? {
                    ...x,
                    status: x.status === "acknowledged" ? x.status : ("read" as const),
                    readBy: alreadyRead ? x.readBy : [...(x.readBy || []), currentUserName],
                    readAt: now,
                    readReceipts: alreadyRead
                      ? x.readReceipts
                      : [
                          ...(x.readReceipts || []),
                          { user: currentUserName, role: currentRole, at: now },
                        ],
                  }
                : x,
            ),
          };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Read handover",
          entity: id,
        });
      },
      acknowledgeHandover: (id) => {
        const now = new Date().toISOString();
        setStore((s) => {
          const h = s.handovers.find((x) => x.id === id);
          const fields = h ? resolveHandoverContextFields(s, h) : undefined;
          const existingAcknowledgedBy = Array.isArray(h?.acknowledgedBy)
            ? h?.acknowledgedBy || []
            : h?.acknowledgedBy
              ? [h.acknowledgedBy]
              : [];
          const alreadyAcknowledged = existingAcknowledgedBy.includes(currentUserName);
          const alreadyAcknowledgedById = (h?.handoverAcknowledgements || []).some((ack) => ack.userAccountId === currentUser.id);
          const existingReadBy = Array.isArray(h?.readBy)
            ? h?.readBy || []
            : h?.readBy
              ? [String(h.readBy)]
              : [];
          const alreadyRead = existingReadBy.includes(currentUserName);
          const ev: TimelineEvent | null = h
            ? {
                id: uid(),
                residentId: h.residentId,
                type: "handover.acknowledged",
                title: `Handover acknowledged (${h.shift})`,
                createdAt: now,
                createdBy: currentUserName,
                role: currentRole,
                linkedRecordId: id,
                linkedRecordKind: "handover",
              }
            : null;
          return {
            ...s,
            handovers: s.handovers.map((x) =>
              x.id === id
                ? {
                    ...x,
                    readBy: alreadyRead ? existingReadBy : [...existingReadBy, currentUserName],
                    readAt: now,
                    readReceipts: alreadyRead
                      ? x.readReceipts
                      : [
                          ...(x.readReceipts || []),
                          { user: currentUserName, role: currentRole, at: now },
                        ],
                    acknowledgedBy: alreadyAcknowledged
                      ? existingAcknowledgedBy
                      : [...existingAcknowledgedBy, currentUserName],
                    acknowledgedAt: now,
                    acknowledgements: alreadyAcknowledged
                      ? x.acknowledgements
                      : [
                          ...(x.acknowledgements || []),
                          { user: currentUserName, role: currentRole, at: now },
                        ],
                    handoverAcknowledgements: alreadyAcknowledgedById || !fields
                      ? x.handoverAcknowledgements
                      : [
                          ...(x.handoverAcknowledgements || []),
                          {
                            id: uid(),
                            handoverId: x.id,
                            userAccountId: currentUser.id,
                            staffMemberId: operationalContext.staffMemberId,
                            acknowledgedAt: now,
                            shiftId: fields.targetShiftId || operationalContext.shiftId,
                            nursingHomeId: fields.nursingHomeId || operationalContext.nursingHomeId,
                            wardId: fields.wardId || operationalContext.wardIds[0],
                          },
                        ],
                    status: "acknowledged" as const,
                  }
                : x,
            ),
            timelineEvents: ev ? [ev, ...s.timelineEvents] : s.timelineEvents,
          };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Acknowledged handover",
          entity: id,
        });
      },
      completeHandover: (id) => {
        setStore((s) => ({
          ...s,
          handovers: s.handovers.map((h) =>
            h.id === id
              ? {
                  ...h,
                  status: "completed" as const,
                  completedAt: new Date().toISOString(),
                  completedBy: currentUserName,
                  resolvedAt: new Date().toISOString(),
                  resolvedBy: currentUser.id as any,
                }
              : h,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Completed handover",
          entity: id,
        });
      },
      closeHandover: (id) => {
        setStore((s) => ({
          ...s,
          handovers: s.handovers.map((h) =>
            h.id === id
              ? {
                  ...h,
                  status: "closed" as const,
                  closedAt: new Date().toISOString(),
                  closedBy: currentUserName,
                  resolvedAt: new Date().toISOString(),
                  resolvedBy: currentUser.id as any,
                }
              : h,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Closed handover",
          entity: id,
        });
      },
      duplicateHandover: (id) => {
        const src = store.handovers.find((h) => h.id === id);
        if (!src) return undefined;
        const copy: HandoverNote = {
          ...src,
          id: uid(),
          date: new Date().toISOString().slice(0, 10),
          status: "open",
          recordStatus: "active",
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
          createdByRole: currentRole,
          acknowledgedAt: undefined,
          acknowledgedBy: undefined,
          completedAt: undefined,
          completedBy: undefined,
          closedAt: undefined,
          closedBy: undefined,
          archivedAt: undefined,
          archivedBy: undefined,
          deletedAt: undefined,
          deletedBy: undefined,
          deletedReason: undefined,
          updatedAt: undefined,
          updatedBy: undefined,
        };
        setStore((s) => ({ ...s, handovers: [copy, ...s.handovers] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Duplicated handover",
          entity: copy.id,
          reason: `Copied from ${id}`,
        });
        return copy;
      },
      createMaintenanceAssetCategory: (input) => {
        const validation = validateAssetCategoryInput(input, store.maintenanceAssetCategories || []);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the category details.");
        const now = new Date().toISOString();
        const category: MaintenanceAssetCategory = {
          id: `maintenance-asset-category-${uid()}`,
          tenantId: "tenant-oritas-demo",
          name: input.name.trim(),
          description: input.description?.trim() || "",
          colour: input.colour || "#2563eb",
          icon: input.icon || "package",
          active: input.active ?? true,
          displayOrder: input.displayOrder ?? (store.maintenanceAssetCategories.length + 1),
          createdBy: currentUserName,
          createdAt: now,
          updatedBy: currentUserName,
          updatedAt: now,
        };
        setStore((s) => ({
          ...s,
          maintenanceAssetCategories: [category, ...s.maintenanceAssetCategories],
          auditLogs: [assetAuditLog({ id: uid(), user: currentUser, action: "Asset category created", entity: category.id, entityType: "maintenance_asset_category", facilityId: activeFacilityId, after: { name: category.name }, timestamp: now }) as AuditLog, ...s.auditLogs].slice(0, 500),
        }));
        return category;
      },
      updateMaintenanceAssetCategory: (id, input) => {
        const current = store.maintenanceAssetCategories.find((category) => category.id === id);
        if (!current) throw new Error("Asset category not found.");
        const validation = validateAssetCategoryInput({ ...current, ...input }, store.maintenanceAssetCategories || []);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the category details.");
        const now = new Date().toISOString();
        const next = { ...current, ...input, name: (input.name || current.name).trim(), updatedBy: currentUserName, updatedAt: now };
        setStore((s) => ({
          ...s,
          maintenanceAssetCategories: s.maintenanceAssetCategories.map((category) => category.id === id ? next : category),
          auditLogs: [assetAuditLog({ id: uid(), user: currentUser, action: "Asset category updated", entity: id, entityType: "maintenance_asset_category", facilityId: activeFacilityId, before: current, after: next, timestamp: now }) as AuditLog, ...s.auditLogs].slice(0, 500),
        }));
      },
      archiveMaintenanceAssetCategory: (id, reason) => {
        if (!reason.trim()) throw new Error("Enter an archive reason.");
        if (store.maintenanceAssets.some((asset) => asset.categoryId === id && !asset.archivedAt)) throw new Error("This category is used by active assets. Move or archive those assets first.");
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          maintenanceAssetCategories: s.maintenanceAssetCategories.map((category) => category.id === id ? { ...category, active: false, archivedAt: now, archivedBy: currentUserName, updatedBy: currentUserName, updatedAt: now } : category),
          auditLogs: [assetAuditLog({ id: uid(), user: currentUser, action: "Asset category archived", entity: id, entityType: "maintenance_asset_category", facilityId: activeFacilityId, reason, timestamp: now }) as AuditLog, ...s.auditLogs].slice(0, 500),
        }));
      },
      restoreMaintenanceAssetCategory: (id) => {
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, maintenanceAssetCategories: s.maintenanceAssetCategories.map((category) => category.id === id ? { ...category, active: true, archivedAt: undefined, archivedBy: undefined, updatedBy: currentUserName, updatedAt: now } : category) }));
      },
      createMaintenanceAsset: (input) => {
        const homeId = input.homeId || activeFacilityId;
        const assetNumber = input.assetNumber?.trim() || nextAssetNumber(store.maintenanceAssets || [], homeId);
        const candidate = { ...input, homeId, assetNumber, active: input.active ?? true };
        const validation = validateAssetInput(candidate, { assets: store.maintenanceAssets || [], categories: store.maintenanceAssetCategories || [] });
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the asset details.");
        const now = new Date().toISOString();
        const asset: MaintenanceAsset = {
          id: `maintenance-asset-${uid()}`,
          tenantId: "tenant-oritas-demo",
          homeId,
          facilityId: homeId,
          nursingHomeId: homeId,
          assetNumber,
          assetName: input.assetName.trim(),
          description: input.description?.trim() || "",
          categoryId: input.categoryId,
          manufacturer: input.manufacturer?.trim() || undefined,
          model: input.model?.trim() || undefined,
          serialNumber: input.serialNumber?.trim() || undefined,
          barcode: input.barcode?.trim() || undefined,
          locationId: input.locationId || undefined,
          locationLabel: input.locationLabel?.trim() || undefined,
          purchaseDate: input.purchaseDate || undefined,
          installationDate: input.installationDate || undefined,
          supplier: input.supplier?.trim() || undefined,
          warrantyStartDate: input.warrantyStartDate || undefined,
          warrantyEndDate: input.warrantyEndDate || undefined,
          condition: input.condition || "Good",
          operationalStatus: input.operationalStatus || "Operational",
          assetStatus: input.assetStatus || "Active",
          criticality: input.criticality || "Medium",
          replacementDate: input.replacementDate || undefined,
          replacementCost: input.replacementCost === undefined ? undefined : Number(input.replacementCost),
          notes: input.notes?.trim() || undefined,
          photo: input.photo?.trim() || undefined,
          active: input.active ?? true,
          createdBy: currentUserName,
          createdAt: now,
          updatedBy: currentUserName,
          updatedAt: now,
        };
        setStore((s) => ({
          ...s,
          maintenanceAssets: [asset, ...s.maintenanceAssets],
          auditLogs: [assetAuditLog({ id: uid(), user: currentUser, action: "Asset created", entity: asset.id, entityType: "maintenance_asset", facilityId: asset.homeId, after: { assetNumber: asset.assetNumber, assetName: asset.assetName }, timestamp: now }) as AuditLog, ...s.auditLogs].slice(0, 500),
        }));
        return asset;
      },
      updateMaintenanceAsset: (id, input, reason) => {
        const current = store.maintenanceAssets.find((asset) => asset.id === id);
        if (!current) throw new Error("Asset not found.");
        if (assetIsReadOnly(current)) throw new Error("Disposed assets are read-only.");
        const nextCandidate = { ...current, ...input, id };
        const validation = validateAssetInput(nextCandidate, { assets: store.maintenanceAssets || [], categories: store.maintenanceAssetCategories || [] });
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the asset details.");
        const now = new Date().toISOString();
        const locationChanged = (input.locationId !== undefined && input.locationId !== current.locationId) || (input.locationLabel !== undefined && input.locationLabel !== current.locationLabel);
        const next: MaintenanceAsset = {
          ...current,
          ...input,
          assetNumber: (input.assetNumber || current.assetNumber).trim(),
          assetName: (input.assetName || current.assetName).trim(),
          replacementCost: input.replacementCost === undefined ? current.replacementCost : Number(input.replacementCost),
          updatedBy: currentUserName,
          updatedAt: now,
        };
        const locationEvent: MaintenanceAssetLocationHistory | undefined = locationChanged ? {
          id: `maintenance-asset-location-${uid()}`,
          assetId: id,
          homeId: current.homeId,
          facilityId: current.homeId,
          previousLocationId: current.locationId,
          previousLocationLabel: current.locationLabel,
          newLocationId: next.locationId,
          newLocationLabel: next.locationLabel,
          movedBy: currentUserName,
          movedDate: now,
          reason: reason?.trim() || "Location updated",
        } : undefined;
        setStore((s) => ({
          ...s,
          maintenanceAssets: s.maintenanceAssets.map((asset) => asset.id === id ? next : asset),
          maintenanceAssetLocationHistory: locationEvent ? [locationEvent, ...s.maintenanceAssetLocationHistory] : s.maintenanceAssetLocationHistory,
          auditLogs: [assetAuditLog({ id: uid(), user: currentUser, action: "Asset updated", entity: id, entityType: "maintenance_asset", facilityId: current.homeId, before: current, after: next, reason, timestamp: now }) as AuditLog, ...s.auditLogs].slice(0, 500),
        }));
      },
      archiveMaintenanceAsset: (id, reason) => {
        if (!reason.trim()) throw new Error("Enter an archive reason.");
        const current = store.maintenanceAssets.find((asset) => asset.id === id);
        if (!current) throw new Error("Asset not found.");
        const hasHistory = store.maintenanceWorkOrders.some((workOrder) => workOrder.assetId === id) || store.plannedMaintenanceSchedules.some((schedule) => schedule.assetId === id);
        const now = new Date().toISOString();
        const next = { ...current, active: false, assetStatus: "Archived" as const, archivedAt: now, archivedBy: currentUserName, archiveReason: hasHistory ? reason : reason, updatedBy: currentUserName, updatedAt: now };
        setStore((s) => ({
          ...s,
          maintenanceAssets: s.maintenanceAssets.map((asset) => asset.id === id ? next : asset),
          auditLogs: [assetAuditLog({ id: uid(), user: currentUser, action: hasHistory ? "Asset archived with history retained" : "Asset archived", entity: id, entityType: "maintenance_asset", facilityId: current.homeId, reason, timestamp: now }) as AuditLog, ...s.auditLogs].slice(0, 500),
        }));
      },
      restoreMaintenanceAsset: (id) => {
        api.updateMaintenanceAsset(id, { active: true, assetStatus: "Active", archivedAt: undefined, archivedBy: undefined, archiveReason: undefined });
      },
      activateMaintenanceAsset: (id) => {
        api.updateMaintenanceAsset(id, { active: true, assetStatus: "Active" });
      },
      deactivateMaintenanceAsset: (id, reason) => {
        api.updateMaintenanceAsset(id, { active: false, assetStatus: "Inactive" }, reason || "Asset deactivated");
      },
      duplicateMaintenanceAsset: (id) => {
        const source = store.maintenanceAssets.find((asset) => asset.id === id);
        if (!source) return undefined;
        return api.createMaintenanceAsset({ ...source, id: undefined, assetNumber: nextAssetNumber(store.maintenanceAssets || [], source.homeId), assetName: `${source.assetName} Copy`, active: false, assetStatus: "Inactive" });
      },
      addMaintenanceAssetDocument: (assetId, input) => {
        const asset = store.maintenanceAssets.find((item) => item.id === assetId);
        if (!asset) throw new Error("Asset not found.");
        const now = new Date().toISOString();
        const document: MaintenanceAssetDocument = { id: `maintenance-asset-document-${uid()}`, assetId, homeId: asset.homeId, facilityId: asset.homeId, documentType: input.documentType, fileName: input.fileName.trim(), storageReference: input.storageReference || `asset-documents/${assetId}/${input.fileName.trim()}`, version: 1, uploadedBy: currentUserName, uploadedAt: now };
        setStore((s) => ({ ...s, maintenanceAssetDocuments: [document, ...s.maintenanceAssetDocuments], auditLogs: [assetAuditLog({ id: uid(), user: currentUser, action: "Asset document uploaded", entity: assetId, entityType: "maintenance_asset", facilityId: asset.homeId, after: { fileName: document.fileName, documentType: document.documentType }, timestamp: now }) as AuditLog, ...s.auditLogs].slice(0, 500) }));
        return document;
      },
      replaceMaintenanceAssetDocument: (documentId, input) => {
        const current = store.maintenanceAssetDocuments.find((document) => document.id === documentId);
        if (!current) throw new Error("Asset document not found.");
        const now = new Date().toISOString();
        const replacement: MaintenanceAssetDocument = { ...current, id: `maintenance-asset-document-${uid()}`, fileName: input.fileName.trim(), storageReference: input.storageReference || `asset-documents/${current.assetId}/${input.fileName.trim()}`, version: current.version + 1, uploadedBy: currentUserName, uploadedAt: now };
        setStore((s) => ({ ...s, maintenanceAssetDocuments: [replacement, ...s.maintenanceAssetDocuments.map((document) => document.id === documentId ? { ...document, replacedByDocumentId: replacement.id } : document)] }));
        return replacement;
      },
      deleteMaintenanceAssetDocument: (documentId, reason) => {
        if (!reason.trim()) throw new Error("Enter a delete reason.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, maintenanceAssetDocuments: s.maintenanceAssetDocuments.map((document) => document.id === documentId ? { ...document, deletedAt: now, deletedBy: currentUserName } : document) }));
      },
      addMaintenanceAssetPhoto: (assetId, input) => {
        const asset = store.maintenanceAssets.find((item) => item.id === assetId);
        if (!asset) throw new Error("Asset not found.");
        const now = new Date().toISOString();
        const photo: MaintenanceAssetPhoto = { id: `maintenance-asset-photo-${uid()}`, assetId, homeId: asset.homeId, facilityId: asset.homeId, fileReference: input.fileReference.trim(), caption: input.caption?.trim() || undefined, displayOrder: store.maintenanceAssetPhotos.filter((item) => item.assetId === assetId).length + 1, primary: input.primary ?? !store.maintenanceAssetPhotos.some((item) => item.assetId === assetId && item.primary && !item.deletedAt), uploadedBy: currentUserName, uploadedAt: now };
        setStore((s) => ({ ...s, maintenanceAssetPhotos: [photo, ...(photo.primary ? s.maintenanceAssetPhotos.map((item) => item.assetId === assetId ? { ...item, primary: false } : item) : s.maintenanceAssetPhotos)] }));
        return photo;
      },
      updateMaintenanceAssetPhoto: (photoId, input) => {
        const current = store.maintenanceAssetPhotos.find((photo) => photo.id === photoId);
        setStore((s) => ({ ...s, maintenanceAssetPhotos: s.maintenanceAssetPhotos.map((photo) => photo.id === photoId ? { ...photo, ...input } : input.primary && current && photo.assetId === current.assetId ? { ...photo, primary: false } : photo) }));
      },
      deleteMaintenanceAssetPhoto: (photoId, reason) => {
        if (!reason.trim()) throw new Error("Enter a delete reason.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, maintenanceAssetPhotos: s.maintenanceAssetPhotos.map((photo) => photo.id === photoId ? { ...photo, deletedAt: now, deletedBy: currentUserName } : photo) }));
      },
      reorderMaintenanceAssetPhotos: (assetId, photoIds) => {
        setStore((s) => ({ ...s, maintenanceAssetPhotos: s.maintenanceAssetPhotos.map((photo) => photo.assetId === assetId ? { ...photo, displayOrder: Math.max(1, photoIds.indexOf(photo.id) + 1) } : photo) }));
      },
      createMaintenanceAssetRelationship: (input) => {
        if (input.parentAssetId === input.childAssetId) throw new Error("Select two different assets.");
        const parent = store.maintenanceAssets.find((asset) => asset.id === input.parentAssetId);
        const child = store.maintenanceAssets.find((asset) => asset.id === input.childAssetId);
        if (!parent || !child) throw new Error("Select valid assets.");
        const now = new Date().toISOString();
        const relationship: MaintenanceAssetRelationship = { id: `maintenance-asset-relationship-${uid()}`, homeId: parent.homeId, facilityId: parent.homeId, parentAssetId: parent.id, childAssetId: child.id, relationshipType: input.relationshipType, notes: input.notes?.trim() || undefined, createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now };
        setStore((s) => ({ ...s, maintenanceAssetRelationships: [relationship, ...s.maintenanceAssetRelationships] }));
        return relationship;
      },
      updateMaintenanceAssetRelationship: (id, input) => {
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, maintenanceAssetRelationships: s.maintenanceAssetRelationships.map((relationship) => relationship.id === id ? { ...relationship, ...input, updatedBy: currentUserName, updatedAt: now } : relationship) }));
      },
      deleteMaintenanceAssetRelationship: (id) => {
        setStore((s) => ({ ...s, maintenanceAssetRelationships: s.maintenanceAssetRelationships.filter((relationship) => relationship.id !== id) }));
      },
      createMaintenanceTemplate: (input) => {
        const validation = validateTemplateInput(input);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the template details.");
        const now = new Date().toISOString();
        const template: MaintenanceTemplate = {
          id: `maintenance-template-${uid()}`,
          tenantId: "tenant-oritas-demo",
          homeId: input.homeId || activeFacilityId,
          facilityId: input.homeId || activeFacilityId,
          nursingHomeId: input.homeId || activeFacilityId,
          name: input.name!.trim(),
          description: input.description!.trim(),
          category: input.category!,
          active: input.active ?? true,
          estimatedDurationMinutes: Number(input.estimatedDurationMinutes),
          verificationRequired: Boolean(input.verificationRequired),
          safetyPrecautions: input.safetyPrecautions?.trim() || "",
          skillsRequired: input.skillsRequired?.trim() || "",
          frequencyType: input.frequencyType!,
          frequencyValue: Number(input.frequencyValue || 1),
          colour: input.colour || "#2563eb",
          createdBy: currentUserName,
          createdAt: now,
          updatedBy: currentUserName,
          updatedAt: now,
        };
        const checklist = (input.checklist || []).map((item, index) => ({
          id: `maintenance-template-checklist-${uid()}`,
          templateId: template.id,
          displayOrder: index + 1,
          item: item.item!.trim(),
          mandatory: item.mandatory ?? true,
        } satisfies MaintenanceTemplateChecklist));
        const evidence = (input.evidence || []).map((evidenceType) => ({
          id: `maintenance-template-evidence-${uid()}`,
          templateId: template.id,
          evidenceType,
        } satisfies MaintenanceTemplateEvidence));
        setStore((s) => ({
          ...s,
          maintenanceTemplates: [template, ...(s.maintenanceTemplates || [])],
          maintenanceTemplateChecklists: [...checklist, ...(s.maintenanceTemplateChecklists || [])],
          maintenanceTemplateEvidence: [...evidence, ...(s.maintenanceTemplateEvidence || [])],
          auditLogs: [
            plannedMaintenanceAuditLog({ id: uid(), user: currentUser, action: "Maintenance template created", entity: template.id, entityType: "maintenance_template", facilityId: template.homeId, after: { name: template.name }, timestamp: now }) as AuditLog,
            ...s.auditLogs,
          ].slice(0, 500),
        }));
        return template;
      },
      updateMaintenanceTemplate: (id, input) => {
        const current = store.maintenanceTemplates.find((template) => template.id === id);
        if (!current) throw new Error("Maintenance template not found.");
        const validation = validateTemplateInput({ ...current, ...input });
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the template details.");
        const now = new Date().toISOString();
        const next: MaintenanceTemplate = {
          ...current,
          ...input,
          name: (input.name ?? current.name).trim(),
          description: (input.description ?? current.description).trim(),
          estimatedDurationMinutes: Number(input.estimatedDurationMinutes ?? current.estimatedDurationMinutes),
          frequencyValue: Number(input.frequencyValue ?? current.frequencyValue),
          updatedBy: currentUserName,
          updatedAt: now,
        };
        const hasChecklist = Array.isArray(input.checklist);
        const hasEvidence = Array.isArray(input.evidence);
        const checklist = hasChecklist ? input.checklist!.map((item, index) => ({
          id: item.id || `maintenance-template-checklist-${uid()}`,
          templateId: id,
          displayOrder: index + 1,
          item: item.item!.trim(),
          mandatory: item.mandatory ?? true,
        } satisfies MaintenanceTemplateChecklist)) : [];
        const evidence = hasEvidence ? input.evidence!.map((evidenceType) => ({
          id: `maintenance-template-evidence-${uid()}`,
          templateId: id,
          evidenceType,
        } satisfies MaintenanceTemplateEvidence)) : [];
        setStore((s) => ({
          ...s,
          maintenanceTemplates: (s.maintenanceTemplates || []).map((template) => (template.id === id ? next : template)),
          maintenanceTemplateChecklists: hasChecklist ? [...(s.maintenanceTemplateChecklists || []).filter((item) => item.templateId !== id), ...checklist] : s.maintenanceTemplateChecklists,
          maintenanceTemplateEvidence: hasEvidence ? [...(s.maintenanceTemplateEvidence || []).filter((item) => item.templateId !== id), ...evidence] : s.maintenanceTemplateEvidence,
          auditLogs: [
            plannedMaintenanceAuditLog({ id: uid(), user: currentUser, action: "Maintenance template updated", entity: id, entityType: "maintenance_template", facilityId: next.homeId, before: { name: current.name }, after: { name: next.name }, timestamp: now }) as AuditLog,
            ...s.auditLogs,
          ].slice(0, 500),
        }));
      },
      archiveMaintenanceTemplate: (id, reason) => {
        const current = store.maintenanceTemplates.find((template) => template.id === id);
        if (!current) throw new Error("Maintenance template not found.");
        if (!reason.trim()) throw new Error("Enter an archive reason.");
        const now = new Date().toISOString();
        const next = { ...current, active: false, archivedAt: now, archivedBy: currentUserName, updatedAt: now, updatedBy: currentUserName };
        setStore((s) => ({
          ...s,
          maintenanceTemplates: s.maintenanceTemplates.map((template) => (template.id === id ? next : template)),
          auditLogs: [
            plannedMaintenanceAuditLog({ id: uid(), user: currentUser, action: "Maintenance template archived", entity: id, entityType: "maintenance_template", facilityId: current.homeId, reason, timestamp: now }) as AuditLog,
            ...s.auditLogs,
          ].slice(0, 500),
        }));
      },
      deleteMaintenanceTemplate: (id) => {
        if (store.plannedMaintenanceSchedules.some((schedule) => schedule.templateId === id)) {
          throw new Error("This template is used by schedules. Archive it instead.");
        }
        setStore((s) => ({
          ...s,
          maintenanceTemplates: s.maintenanceTemplates.filter((template) => template.id !== id),
          maintenanceTemplateChecklists: s.maintenanceTemplateChecklists.filter((item) => item.templateId !== id),
          maintenanceTemplateEvidence: s.maintenanceTemplateEvidence.filter((item) => item.templateId !== id),
        }));
      },
      duplicateMaintenanceTemplate: (id) => {
        const source = store.maintenanceTemplates.find((template) => template.id === id);
        if (!source) return undefined;
        return api.createMaintenanceTemplate({
          ...source,
          name: `${source.name} Copy`,
          active: false,
          checklist: store.maintenanceTemplateChecklists.filter((item) => item.templateId === id),
          evidence: store.maintenanceTemplateEvidence.filter((item) => item.templateId === id).map((item) => item.evidenceType),
        });
      },
      createPlannedMaintenanceSchedule: (input) => {
        const assets = buildPlannedMaintenanceAssets({ ...store, activeFacilityId });
        const validation = validateScheduleInput(input, assets, store.maintenanceTemplates);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the schedule details.");
        const asset = assets.find((item) => item.id === input.assetId)!;
        const template = store.maintenanceTemplates.find((item) => item.id === input.templateId)!;
        const now = new Date().toISOString();
        const schedule: PlannedMaintenanceSchedule = {
          id: `planned-maintenance-schedule-${uid()}`,
          tenantId: "tenant-oritas-demo",
          homeId: asset.homeId,
          facilityId: asset.homeId,
          nursingHomeId: asset.homeId,
          assetId: asset.id,
          assetName: asset.name,
          locationLabel: asset.locationLabel,
          templateId: template.id,
          responsibleTeamId: input.responsibleTeamId!,
          startDate: input.startDate!,
          endDate: input.endDate || undefined,
          nextDueDate: input.nextDueDate || input.startDate!,
          active: input.active ?? true,
          frequencyType: input.frequencyType || template.frequencyType,
          frequencyValue: Number(input.frequencyValue || template.frequencyValue || 1),
          generateDaysBeforeDue: Number(input.generateDaysBeforeDue ?? 7),
          createdBy: currentUserName,
          createdAt: now,
          updatedBy: currentUserName,
          updatedAt: now,
        };
        const generated = generateOccurrencesForSchedule({ schedule, existing: [], until: input.endDate || "2026-12-31" }).slice(0, 24).map((occurrence) => ({
          ...occurrence,
          id: `planned-maintenance-occurrence-${uid()}`,
        }));
        setStore((s) => ({
          ...s,
          plannedMaintenanceSchedules: [schedule, ...s.plannedMaintenanceSchedules],
          plannedMaintenanceOccurrences: [...generated, ...s.plannedMaintenanceOccurrences],
          auditLogs: [
            plannedMaintenanceAuditLog({ id: uid(), user: currentUser, action: "Planned maintenance schedule created", entity: schedule.id, entityType: "planned_maintenance_schedule", facilityId: schedule.homeId, after: { asset: schedule.assetName, template: template.name }, timestamp: now }) as AuditLog,
            ...s.auditLogs,
          ].slice(0, 500),
        }));
        return schedule;
      },
      updatePlannedMaintenanceSchedule: (id, input) => {
        const current = store.plannedMaintenanceSchedules.find((schedule) => schedule.id === id);
        if (!current) throw new Error("Planned maintenance schedule not found.");
        const assets = buildPlannedMaintenanceAssets({ ...store, activeFacilityId });
        const validation = validateScheduleInput({ ...current, ...input }, assets, store.maintenanceTemplates);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the schedule details.");
        const asset = assets.find((item) => item.id === (input.assetId || current.assetId));
        const now = new Date().toISOString();
        const next: PlannedMaintenanceSchedule = { ...current, ...input, assetName: asset?.name || current.assetName, locationLabel: asset?.locationLabel || current.locationLabel, homeId: asset?.homeId || current.homeId, facilityId: asset?.homeId || current.homeId, nursingHomeId: asset?.homeId || current.homeId, updatedBy: currentUserName, updatedAt: now };
        setStore((s) => ({
          ...s,
          plannedMaintenanceSchedules: s.plannedMaintenanceSchedules.map((schedule) => (schedule.id === id ? next : schedule)),
          auditLogs: [
            plannedMaintenanceAuditLog({ id: uid(), user: currentUser, action: "Planned maintenance schedule updated", entity: id, entityType: "planned_maintenance_schedule", facilityId: next.homeId, before: current, after: next, timestamp: now }) as AuditLog,
            ...s.auditLogs,
          ].slice(0, 500),
        }));
      },
      pausePlannedMaintenanceSchedule: (id, reason) => {
        if (!reason.trim()) throw new Error("Enter a pause reason.");
        api.updatePlannedMaintenanceSchedule(id, { active: false, pausedAt: new Date().toISOString(), pausedBy: currentUserName, pauseReason: reason });
      },
      resumePlannedMaintenanceSchedule: (id) => {
        api.updatePlannedMaintenanceSchedule(id, { active: true, pausedAt: undefined, pausedBy: undefined, pauseReason: undefined });
      },
      deletePlannedMaintenanceSchedule: (id) => {
        if (store.plannedMaintenanceOccurrences.some((item) => item.scheduleId === id && item.workOrderId)) throw new Error("This schedule has generated Work Orders. Pause it instead.");
        setStore((s) => ({ ...s, plannedMaintenanceSchedules: s.plannedMaintenanceSchedules.filter((schedule) => schedule.id !== id), plannedMaintenanceOccurrences: s.plannedMaintenanceOccurrences.filter((item) => item.scheduleId !== id) }));
      },
      generatePlannedMaintenanceOccurrences: (scheduleId, until = "2026-12-31") => {
        const schedules = scheduleId ? store.plannedMaintenanceSchedules.filter((schedule) => schedule.id === scheduleId) : store.plannedMaintenanceSchedules;
        const generated = schedules.flatMap((schedule) => generateOccurrencesForSchedule({ schedule, existing: store.plannedMaintenanceOccurrences, until }).map((occurrence) => ({ ...occurrence, id: `planned-maintenance-occurrence-${uid()}` })));
        if (generated.length) setStore((s) => ({ ...s, plannedMaintenanceOccurrences: [...generated, ...s.plannedMaintenanceOccurrences] }));
        return generated;
      },
      completePlannedMaintenanceOccurrence: (id) => {
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, plannedMaintenanceOccurrences: s.plannedMaintenanceOccurrences.map((item) => item.id === id ? { ...item, status: "Completed", completedAt: now, completedBy: currentUserName } : item) }));
      },
      skipPlannedMaintenanceOccurrence: (id, reason) => {
        if (!reason.trim()) throw new Error("Enter a skip reason.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, plannedMaintenanceOccurrences: s.plannedMaintenanceOccurrences.map((item) => item.id === id ? { ...item, status: "Skipped", skippedAt: now, skippedBy: currentUserName, skippedReason: reason } : item) }));
      },
      cancelPlannedMaintenanceOccurrence: (id, reason) => {
        if (!reason.trim()) throw new Error("Enter a cancellation reason.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, plannedMaintenanceOccurrences: s.plannedMaintenanceOccurrences.map((item) => item.id === id ? { ...item, status: "Cancelled", cancelledAt: now, cancelledBy: currentUserName, cancelledReason: reason } : item) }));
      },
      generatePlannedMaintenanceWorkOrder: (occurrenceId) => {
        const occurrence = store.plannedMaintenanceOccurrences.find((item) => item.id === occurrenceId);
        if (!occurrence) throw new Error("Planned maintenance occurrence not found.");
        if (occurrence.workOrderId) {
          const existing = store.maintenanceWorkOrders.find((item) => item.id === occurrence.workOrderId);
          if (existing) return existing;
        }
        const schedule = store.plannedMaintenanceSchedules.find((item) => item.id === occurrence.scheduleId);
        if (!schedule) throw new Error("Planned maintenance schedule not found.");
        const template = store.maintenanceTemplates.find((item) => item.id === schedule.templateId);
        if (!template) throw new Error("Maintenance template not found.");
        const assets = buildPlannedMaintenanceAssets({ ...store, activeFacilityId: schedule.homeId });
        const generatedInput = buildGeneratedWorkOrderInput({
          schedule,
          template,
          occurrence,
          asset: assets.find((item) => item.id === schedule.assetId),
          checklist: store.maintenanceTemplateChecklists.filter((item) => item.templateId === template.id),
          evidence: store.maintenanceTemplateEvidence.filter((item) => item.templateId === template.id),
        });
        const now = new Date().toISOString();
        const homeUsers = store.users.filter((user) => user.facilityIds?.includes(generatedInput.homeId) || user.facilityId === generatedInput.homeId);
        const validation = validateWorkOrderInput(generatedInput, { ...store, users: homeUsers });
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Unable to generate Work Order.");
        const workOrder = {
          ...createWorkOrderRecord({ input: generatedInput, records: store.maintenanceWorkOrders || [], currentUser, now }),
          plannedMaintenanceScheduleId: schedule.id,
          plannedMaintenanceTemplateId: template.id,
          plannedMaintenanceOccurrenceId: occurrence.id,
        } satisfies MaintenanceWorkOrder;
        setStore((s) => ({
          ...s,
          maintenanceWorkOrders: [workOrder, ...s.maintenanceWorkOrders],
          plannedMaintenanceOccurrences: s.plannedMaintenanceOccurrences.map((item) => item.id === occurrenceId ? { ...item, status: "Generated", workOrderId: workOrder.id, generatedAt: now, generatedBy: currentUserName } : item),
          plannedMaintenanceSchedules: s.plannedMaintenanceSchedules.map((item) => item.id === schedule.id ? { ...item, lastGeneratedDate: now, updatedAt: now, updatedBy: currentUserName } : item),
          auditLogs: [
            workOrderAuditLog({ id: uid(), action: "Work Order created from planned maintenance", record: workOrder, user: currentUser, after: { occurrenceId, scheduleId: schedule.id, templateId: template.id }, timestamp: now }),
            plannedMaintenanceAuditLog({ id: uid(), user: currentUser, action: "Planned maintenance Work Order generated", entity: occurrence.id, entityType: "planned_maintenance_occurrence", facilityId: schedule.homeId, after: { workOrderNumber: workOrder.workOrderNumber }, timestamp: now }) as AuditLog,
            ...s.auditLogs,
          ].slice(0, 500),
        }));
        return workOrder;
      },
      createSafetyCategory: (input) => {
        const validation = validateSafetyCategory(input, store.safetyCategories);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the category details.");
        const now = new Date().toISOString();
        const category: SafetyCategory = { ...input, id: `safety-category-${uid()}`, tenantId: "tenant-oritas-demo", description: input.description || "", colour: input.colour || "#2563eb", icon: input.icon || "shield", active: input.active ?? true, displayOrder: input.displayOrder ?? store.safetyCategories.length + 1, defaultFrequencyType: input.defaultFrequencyType || "monthly", defaultFrequencyInterval: Number(input.defaultFrequencyInterval || 1), defaultPriority: input.defaultPriority || "MEDIUM", defaultVerificationRequired: Boolean(input.defaultVerificationRequired), defaultCertificateRequired: Boolean(input.defaultCertificateRequired), createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now } as SafetyCategory;
        setStore((s) => ({ ...s, safetyCategories: [...s.safetyCategories, category] }));
        logAudit({ user: currentUserName, role: currentRole, action: "SAFETY_CATEGORY_CREATED", entity: category.id, facilityId: activeFacilityId });
        return category;
      },
      updateSafetyCategory: (id, input) => {
        const current = store.safetyCategories.find((item) => item.id === id);
        if (!current) throw new Error("Safety category not found.");
        const validation = validateSafetyCategory({ ...current, ...input }, store.safetyCategories);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the category details.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, safetyCategories: s.safetyCategories.map((item) => item.id === id ? { ...item, ...input, updatedBy: currentUserName, updatedAt: now } : item) }));
        logAudit({ user: currentUserName, role: currentRole, action: "SAFETY_CATEGORY_UPDATED", entity: id, facilityId: activeFacilityId });
      },
      activateSafetyCategory: (id) => api.updateSafetyCategory(id, { active: true }),
      deactivateSafetyCategory: (id) => {
        if (store.safetyInspections.some((inspection) => inspection.categoryId === id)) api.updateSafetyCategory(id, { active: false });
        else api.updateSafetyCategory(id, { active: false });
      },
      createSafetyTemplate: (input) => {
        const validation = validateSafetyTemplate(input, store.safetyCategories);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the template details.");
        const now = new Date().toISOString();
        const template: SafetyInspectionTemplate = { id: `safety-template-${uid()}`, tenantId: "tenant-oritas-demo", homeId: input.homeId || activeFacilityId, facilityId: input.homeId || activeFacilityId, categoryId: input.categoryId, name: input.name.trim(), description: input.description?.trim() || "", templateCode: input.templateCode?.trim() || `SC-${Date.now()}`, version: 1, status: input.status || "DRAFT", active: input.active ?? input.status === "ACTIVE", defaultFrequencyType: input.defaultFrequencyType || "monthly", defaultFrequencyInterval: Number(input.defaultFrequencyInterval || 1), estimatedDurationMinutes: Number(input.estimatedDurationMinutes || 30), defaultPriority: input.defaultPriority || "MEDIUM", verificationRequired: Boolean(input.verificationRequired), certificateRequired: Boolean(input.certificateRequired), evidenceRequired: Boolean(input.evidenceRequired), instructions: input.instructions?.trim() || "", safetyPrecautions: input.safetyPrecautions?.trim() || "", applicableAssetCategoryIds: input.applicableAssetCategoryIds || [], applicableLocationTypes: input.applicableLocationTypes || [], effectiveFrom: input.effectiveFrom || new Date().toISOString().slice(0, 10), effectiveTo: input.effectiveTo, createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now };
        const checklist = (input.checklist?.length ? input.checklist : [{ sectionName: "General Condition", label: "Inspection item checked", responseType: "PASS_FAIL", mandatory: true }]).map((item, index) => ({ id: `safety-item-${uid()}`, templateId: template.id, sectionName: item.sectionName || "General", itemCode: item.itemCode || `ITEM_${index + 1}`, label: item.label || "Inspection item", description: item.description, responseType: item.responseType || "PASS_FAIL", mandatory: item.mandatory ?? true, allowNotApplicable: item.allowNotApplicable ?? false, failureTriggersCorrectiveAction: item.failureTriggersCorrectiveAction ?? true, failureRequiresObservation: item.failureRequiresObservation ?? true, failureRequiresPhoto: item.failureRequiresPhoto ?? false, failureRequiresEvidence: item.failureRequiresEvidence ?? false, failureSeverity: item.failureSeverity || "MEDIUM", minValue: item.minValue, maxValue: item.maxValue, unit: item.unit, displayOrder: index + 1, helpText: item.helpText, active: item.active ?? true, createdAt: now, updatedAt: now } satisfies SafetyInspectionTemplateItem));
        const evidence = (input.evidence || []).map((item, index) => ({ id: `safety-evidence-req-${uid()}`, templateId: template.id, evidenceType: item.evidenceType || "PHOTO", label: item.label || "Evidence", description: item.description, mandatory: item.mandatory ?? false, minimumCount: Number(item.minimumCount || 1), appliesOnPass: item.appliesOnPass ?? true, appliesOnFail: item.appliesOnFail ?? true, displayOrder: index + 1 } satisfies SafetyInspectionTemplateEvidenceRequirement));
        setStore((s) => ({ ...s, safetyInspectionTemplates: [template, ...s.safetyInspectionTemplates], safetyInspectionTemplateItems: [...checklist, ...s.safetyInspectionTemplateItems], safetyInspectionTemplateEvidenceRequirements: [...evidence, ...s.safetyInspectionTemplateEvidenceRequirements] }));
        logAudit({ user: currentUserName, role: currentRole, action: "SAFETY_TEMPLATE_CREATED", entity: template.id, facilityId: template.homeId });
        return template;
      },
      updateSafetyTemplate: (id, input) => {
        const current = store.safetyInspectionTemplates.find((item) => item.id === id);
        if (!current) throw new Error("Safety template not found.");
        if (current.status === "ARCHIVED") throw new Error("Archived templates cannot be edited.");
        const validation = validateSafetyTemplate({ ...current, ...input }, store.safetyCategories);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the template details.");
        const now = new Date().toISOString();
        const hasHistory = store.safetyInspections.some((inspection) => inspection.templateId === id);
        const next = { ...current, ...input, version: hasHistory ? current.version + 1 : current.version, updatedBy: currentUserName, updatedAt: now } as SafetyInspectionTemplate;
        const checklist = input.checklist?.map((item, index) => ({ id: item.id || `safety-item-${uid()}`, templateId: id, sectionName: item.sectionName || "General", itemCode: item.itemCode || `ITEM_${index + 1}`, label: item.label || "Inspection item", description: item.description, responseType: item.responseType || "PASS_FAIL", mandatory: item.mandatory ?? true, allowNotApplicable: item.allowNotApplicable ?? false, failureTriggersCorrectiveAction: item.failureTriggersCorrectiveAction ?? true, failureRequiresObservation: item.failureRequiresObservation ?? true, failureRequiresPhoto: item.failureRequiresPhoto ?? false, failureRequiresEvidence: item.failureRequiresEvidence ?? false, failureSeverity: item.failureSeverity || "MEDIUM", minValue: item.minValue, maxValue: item.maxValue, unit: item.unit, displayOrder: index + 1, helpText: item.helpText, active: item.active ?? true, createdAt: now, updatedAt: now } satisfies SafetyInspectionTemplateItem));
        const evidence = input.evidence?.map((item, index) => ({ id: item.id || `safety-evidence-req-${uid()}`, templateId: id, evidenceType: item.evidenceType || "PHOTO", label: item.label || "Evidence", description: item.description, mandatory: item.mandatory ?? false, minimumCount: Number(item.minimumCount || 1), appliesOnPass: item.appliesOnPass ?? true, appliesOnFail: item.appliesOnFail ?? true, displayOrder: index + 1 } satisfies SafetyInspectionTemplateEvidenceRequirement));
        setStore((s) => ({ ...s, safetyInspectionTemplates: s.safetyInspectionTemplates.map((item) => item.id === id ? next : item), safetyInspectionTemplateItems: checklist ? [...s.safetyInspectionTemplateItems.filter((item) => item.templateId !== id), ...checklist] : s.safetyInspectionTemplateItems, safetyInspectionTemplateEvidenceRequirements: evidence ? [...s.safetyInspectionTemplateEvidenceRequirements.filter((item) => item.templateId !== id), ...evidence] : s.safetyInspectionTemplateEvidenceRequirements }));
        logAudit({ user: currentUserName, role: currentRole, action: "SAFETY_TEMPLATE_UPDATED", entity: id, facilityId: next.homeId });
      },
      duplicateSafetyTemplate: (id) => {
        const source = store.safetyInspectionTemplates.find((item) => item.id === id);
        if (!source) return undefined;
        return api.createSafetyTemplate({ ...source, id: undefined, name: `${source.name} Copy`, templateCode: `${source.templateCode}-COPY`, status: "DRAFT", active: false, checklist: store.safetyInspectionTemplateItems.filter((item) => item.templateId === id), evidence: store.safetyInspectionTemplateEvidenceRequirements.filter((item) => item.templateId === id) });
      },
      activateSafetyTemplate: (id) => api.updateSafetyTemplate(id, { active: true, status: "ACTIVE" }),
      deactivateSafetyTemplate: (id) => api.updateSafetyTemplate(id, { active: false, status: "INACTIVE" }),
      archiveSafetyTemplate: (id, reason) => {
        if (!reason.trim()) throw new Error("Enter an archive reason.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, safetyInspectionTemplates: s.safetyInspectionTemplates.map((item) => item.id === id ? { ...item, active: false, status: "ARCHIVED", archivedAt: now, archivedBy: currentUserName, updatedBy: currentUserName, updatedAt: now } : item) }));
        logAudit({ user: currentUserName, role: currentRole, action: "SAFETY_TEMPLATE_ARCHIVED", entity: id, reason, facilityId: activeFacilityId });
      },
      createSafetySchedule: (input) => {
        const validation = validateSafetySchedule(input, { categories: store.safetyCategories, templates: store.safetyInspectionTemplates, assets: store.maintenanceAssets });
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the schedule details.");
        const template = store.safetyInspectionTemplates.find((item) => item.id === input.templateId)!;
        const now = new Date().toISOString();
        const schedule: SafetyInspectionSchedule = { id: `safety-schedule-${uid()}`, tenantId: "tenant-oritas-demo", homeId: input.homeId || activeFacilityId, facilityId: input.homeId || activeFacilityId, categoryId: input.categoryId!, templateId: input.templateId!, assetId: input.assetId, locationId: input.locationId, locationLabel: input.locationLabel, scheduleName: input.scheduleName || template.name, frequencyType: input.frequencyType || template.defaultFrequencyType, frequencyInterval: Number(input.frequencyInterval || template.defaultFrequencyInterval || 1), startDate: input.startDate || new Date().toISOString().slice(0, 10), endDate: input.endDate, nextDueDate: input.nextDueDate || input.startDate || new Date().toISOString().slice(0, 10), generateDaysBeforeDue: Number(input.generateDaysBeforeDue ?? 7), dueSoonDays: Number(input.dueSoonDays ?? 7), responsibleTeamId: input.responsibleTeamId || "maintenance", responsibleUserId: input.responsibleUserId, verificationTeamId: input.verificationTeamId, active: input.active ?? true, paused: false, priority: input.priority || template.defaultPriority, autoCreateInspection: input.autoCreateInspection ?? true, autoCreateCorrectiveWorkOrder: input.autoCreateCorrectiveWorkOrder ?? true, createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now };
        setStore((s) => ({ ...s, safetyInspectionSchedules: [schedule, ...s.safetyInspectionSchedules] }));
        logAudit({ user: currentUserName, role: currentRole, action: "SAFETY_SCHEDULE_CREATED", entity: schedule.id, facilityId: schedule.homeId });
        return schedule;
      },
      updateSafetySchedule: (id, input) => {
        const current = store.safetyInspectionSchedules.find((item) => item.id === id);
        if (!current) throw new Error("Safety schedule not found.");
        const validation = validateSafetySchedule({ ...current, ...input }, { categories: store.safetyCategories, templates: store.safetyInspectionTemplates, assets: store.maintenanceAssets });
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the schedule details.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, safetyInspectionSchedules: s.safetyInspectionSchedules.map((item) => item.id === id ? { ...item, ...input, updatedBy: currentUserName, updatedAt: now } : item) }));
      },
      pauseSafetySchedule: (id, reason) => {
        if (!reason.trim()) throw new Error("Enter a pause reason.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, safetyInspectionSchedules: s.safetyInspectionSchedules.map((item) => item.id === id ? { ...item, paused: true, pausedAt: now, pausedBy: currentUserName, pauseReason: reason, updatedAt: now, updatedBy: currentUserName } : item) }));
      },
      resumeSafetySchedule: (id) => setStore((s) => ({ ...s, safetyInspectionSchedules: s.safetyInspectionSchedules.map((item) => item.id === id ? { ...item, paused: false, pausedAt: undefined, pausedBy: undefined, pauseReason: undefined, updatedAt: new Date().toISOString(), updatedBy: currentUserName } : item) })),
      activateSafetySchedule: (id) => api.updateSafetySchedule(id, { active: true }),
      deactivateSafetySchedule: (id) => api.updateSafetySchedule(id, { active: false }),
      generateSafetyOccurrence: (scheduleId) => {
        const schedule = store.safetyInspectionSchedules.find((item) => item.id === scheduleId);
        if (!schedule) throw new Error("Safety schedule not found.");
        if (!schedule.active || schedule.paused) throw new Error("Paused or inactive schedules cannot generate occurrences.");
        if (store.safetyInspectionOccurrences.some((item) => item.scheduleId === schedule.id && item.dueDate === schedule.nextDueDate)) throw new Error("This occurrence has already been generated.");
        const template = store.safetyInspectionTemplates.find((item) => item.id === schedule.templateId);
        if (!template) throw new Error("Safety template not found.");
        const now = new Date().toISOString();
        const occurrence: SafetyInspectionOccurrence = { id: `safety-occurrence-${uid()}`, tenantId: "tenant-oritas-demo", homeId: schedule.homeId, facilityId: schedule.homeId, scheduleId: schedule.id, categoryId: schedule.categoryId, templateId: template.id, templateVersion: template.version, assetId: schedule.assetId, locationId: schedule.locationId, plannedDate: schedule.nextDueDate, dueDate: schedule.nextDueDate, status: safetyPresentationStatus({ dueDate: schedule.nextDueDate, status: "SCHEDULED" } as SafetyInspectionOccurrence), priority: schedule.priority, assignedTeamId: schedule.responsibleTeamId, assignedUserId: schedule.responsibleUserId, generatedAt: now, createdAt: now, updatedAt: now };
        const nextDueDate = nextSafetyDueDate(schedule.nextDueDate, schedule.frequencyType, schedule.frequencyInterval);
        setStore((s) => ({ ...s, safetyInspectionOccurrences: [occurrence, ...s.safetyInspectionOccurrences], safetyInspectionSchedules: s.safetyInspectionSchedules.map((item) => item.id === schedule.id ? { ...item, lastDueDate: schedule.nextDueDate, nextDueDate, updatedAt: now, updatedBy: currentUserName } : item) }));
        return occurrence;
      },
      startSafetyInspection: (occurrenceId) => {
        const occurrence = store.safetyInspectionOccurrences.find((item) => item.id === occurrenceId);
        if (!occurrence) throw new Error("Safety occurrence not found.");
        if (occurrence.inspectionId) {
          const existing = store.safetyInspections.find((item) => item.id === occurrence.inspectionId);
          if (existing) return existing;
        }
        const template = store.safetyInspectionTemplates.find((item) => item.id === occurrence.templateId);
        if (!template) throw new Error("Safety template not found.");
        const now = new Date().toISOString();
        const inspection: SafetyInspection = { id: `safety-inspection-${uid()}`, tenantId: "tenant-oritas-demo", homeId: occurrence.homeId, facilityId: occurrence.homeId, occurrenceId: occurrence.id, scheduleId: occurrence.scheduleId, templateId: template.id, templateVersion: occurrence.templateVersion, categoryId: occurrence.categoryId, assetId: occurrence.assetId, locationId: occurrence.locationId, inspectionNumber: `SC-${new Date().getFullYear()}-${String(store.safetyInspections.length + 1).padStart(4, "0")}`, inspectionType: "SCHEDULED", status: "IN_PROGRESS", overallResult: "NOT_COMPLETED", priority: occurrence.priority, startedBy: currentUserName, startedAt: now, inspectionDate: now.slice(0, 10), riskIdentified: false, correctiveActionRequired: false, certificateRequired: template.certificateRequired, verificationRequired: template.verificationRequired, verificationStatus: template.verificationRequired ? "PENDING" : "NOT_REQUIRED", declarationAccepted: false, createdAt: now, updatedAt: now, version: 1 };
        const responses = createSafetyResponsesFromTemplate(inspection.id, store.safetyInspectionTemplateItems.filter((item) => item.templateId === template.id), currentUserName, now);
        setStore((s) => ({ ...s, safetyInspections: [inspection, ...s.safetyInspections], safetyInspectionResponses: [...responses, ...s.safetyInspectionResponses], safetyInspectionOccurrences: s.safetyInspectionOccurrences.map((item) => item.id === occurrence.id ? { ...item, status: "IN_PROGRESS", inspectionId: inspection.id, updatedAt: now } : item) }));
        return inspection;
      },
      createAdHocSafetyInspection: (input) => {
        const template = store.safetyInspectionTemplates.find((item) => item.id === input.templateId && item.active);
        if (!template) throw new Error("Select an active safety template.");
        const now = new Date().toISOString();
        const occurrence: SafetyInspectionOccurrence = { id: `safety-occurrence-ad-hoc-${uid()}`, tenantId: "tenant-oritas-demo", homeId: template.homeId || activeFacilityId, facilityId: template.homeId || activeFacilityId, scheduleId: "", categoryId: template.categoryId, templateId: template.id, templateVersion: template.version, assetId: input.assetId, locationId: input.locationId, plannedDate: now.slice(0, 10), dueDate: now.slice(0, 10), status: "IN_PROGRESS", priority: template.defaultPriority, generatedAt: now, createdAt: now, updatedAt: now };
        const inspection: SafetyInspection = { id: `safety-inspection-${uid()}`, tenantId: "tenant-oritas-demo", homeId: occurrence.homeId, facilityId: occurrence.homeId, occurrenceId: occurrence.id, templateId: template.id, templateVersion: template.version, categoryId: template.categoryId, assetId: input.assetId, locationId: input.locationId, inspectionNumber: `SC-${new Date().getFullYear()}-${String(store.safetyInspections.length + 1).padStart(4, "0")}`, inspectionType: "AD_HOC", status: "IN_PROGRESS", overallResult: "NOT_COMPLETED", priority: template.defaultPriority, startedBy: currentUserName, startedAt: now, inspectionDate: now.slice(0, 10), riskIdentified: false, correctiveActionRequired: false, certificateRequired: template.certificateRequired, verificationRequired: template.verificationRequired, verificationStatus: template.verificationRequired ? "PENDING" : "NOT_REQUIRED", declarationAccepted: false, createdAt: now, updatedAt: now, version: 1 };
        const responses = createSafetyResponsesFromTemplate(inspection.id, store.safetyInspectionTemplateItems.filter((item) => item.templateId === template.id), currentUserName, now);
        occurrence.inspectionId = inspection.id;
        setStore((s) => ({ ...s, safetyInspectionOccurrences: [occurrence, ...s.safetyInspectionOccurrences], safetyInspections: [inspection, ...s.safetyInspections], safetyInspectionResponses: [...responses, ...s.safetyInspectionResponses] }));
        return inspection;
      },
      updateSafetyInspectionResponse: (responseId, input) => {
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, safetyInspectionResponses: s.safetyInspectionResponses.map((item) => item.id === responseId ? { ...item, ...input, result: input.result || (input.responseValue === undefined ? item.result : responseResultFromValue(input.responseValue)), answeredBy: currentUserName, answeredAt: now } : item) }));
      },
      addSafetyObservation: (inspectionId, input) => {
        const inspection = store.safetyInspections.find((item) => item.id === inspectionId);
        if (!inspection || ["COMPLETED", "FAILED"].includes(inspection.status)) throw new Error("Inspection is not editable.");
        const now = new Date().toISOString();
        const observation: SafetyInspectionObservation = { id: `safety-observation-${uid()}`, inspectionId, responseId: input.responseId, observationType: input.observationType || "GENERAL", description: input.description.trim(), severity: input.severity, locationId: input.locationId || inspection.locationId, assetId: input.assetId || inspection.assetId, immediateActionRequired: Boolean(input.immediateActionRequired), immediateActionTaken: input.immediateActionTaken, correctiveActionRequired: Boolean(input.correctiveActionRequired), correctiveWorkOrderId: input.correctiveWorkOrderId, createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now };
        setStore((s) => ({ ...s, safetyInspectionObservations: [observation, ...s.safetyInspectionObservations] }));
        return observation;
      },
      updateSafetyObservation: (id, input) => setStore((s) => ({ ...s, safetyInspectionObservations: s.safetyInspectionObservations.map((item) => item.id === id ? { ...item, ...input, updatedBy: currentUserName, updatedAt: new Date().toISOString() } : item) })),
      deleteSafetyObservation: (id) => setStore((s) => ({ ...s, safetyInspectionObservations: s.safetyInspectionObservations.filter((item) => item.id !== id) })),
      addSafetyEvidence: (inspectionId, input) => {
        const inspection = store.safetyInspections.find((item) => item.id === inspectionId);
        if (!inspection) throw new Error("Inspection not found.");
        const now = new Date().toISOString();
        const evidence: SafetyInspectionEvidence = { id: `safety-evidence-${uid()}`, inspectionId, responseId: input.responseId, observationId: input.observationId, evidenceType: input.evidenceType, fileReference: input.fileReference || `safety/${inspectionId}/${input.fileName}`, fileName: input.fileName.trim(), caption: input.caption, description: input.description, uploadedBy: currentUserName, uploadedAt: now, active: true };
        setStore((s) => ({ ...s, safetyInspectionEvidence: [evidence, ...s.safetyInspectionEvidence] }));
        return evidence;
      },
      deleteSafetyEvidence: (id, reason) => {
        if (!reason.trim()) throw new Error("Enter a delete reason.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, safetyInspectionEvidence: s.safetyInspectionEvidence.map((item) => item.id === id ? { ...item, active: false, deletedAt: now, deletedBy: currentUserName } : item) }));
      },
      completeSafetyInspection: (id, input) => {
        const inspection = store.safetyInspections.find((item) => item.id === id);
        if (!inspection) throw new Error("Inspection not found.");
        if (["COMPLETED", "FAILED"].includes(inspection.status)) throw new Error("Inspection has already been completed.");
        const evaluation = evaluateSafetyInspection({ inspection: { ...inspection, declarationAccepted: input.declarationAccepted }, responses: store.safetyInspectionResponses.filter((item) => item.inspectionId === id), observations: store.safetyInspectionObservations.filter((item) => item.inspectionId === id), evidence: store.safetyInspectionEvidence.filter((item) => item.inspectionId === id), requirements: store.safetyInspectionTemplateEvidenceRequirements.filter((item) => item.templateId === inspection.templateId), certificate: store.safetyCertificates.find((item) => item.inspectionId === id) });
        if (!evaluation.canComplete) throw new Error(evaluation.blockers[0] || "Inspection cannot be completed.");
        const now = new Date().toISOString();
        const next: SafetyInspection = { ...inspection, status: evaluation.nextStatus, overallResult: evaluation.overallResult, summary: input.summary, immediateActionsTaken: input.immediateActionsTaken, riskIdentified: evaluation.overallResult === "FAIL", correctiveActionRequired: evaluation.failedResponses.some((item) => item.correctiveActionRequired), completedBy: currentUserName, completedAt: now, declarationAccepted: true, declarationBy: currentUserName, declarationAt: now, verificationStatus: evaluation.nextStatus === "AWAITING_VERIFICATION" || evaluation.nextStatus === "FAILED" && inspection.verificationRequired ? "PENDING" : inspection.verificationStatus, updatedAt: now, version: inspection.version + 1 };
        setStore((s) => ({ ...s, safetyInspections: s.safetyInspections.map((item) => item.id === id ? next : item), safetyInspectionOccurrences: s.safetyInspectionOccurrences.map((item) => item.inspectionId === id || item.id === inspection.occurrenceId ? { ...item, status: next.status === "FAILED" ? "FAILED" : next.status === "AWAITING_VERIFICATION" ? "AWAITING_VERIFICATION" : "COMPLETED", completedAt: now, updatedAt: now } : item) }));
        return next;
      },
      verifySafetyInspection: (id, notes) => {
        const inspection = store.safetyInspections.find((item) => item.id === id);
        if (!inspection) throw new Error("Inspection not found.");
        if (inspection.startedBy === currentUserName) throw new Error("Inspectors cannot verify their own inspection.");
        const now = new Date().toISOString();
        const verification: SafetyInspectionVerification = { id: `safety-verification-${uid()}`, inspectionId: id, verificationStatus: "VERIFIED", verificationOutcome: "VERIFIED", verificationNotes: notes, verifiedBy: currentUserName, verifiedAt: now, createdAt: now, updatedAt: now, version: 1 };
        setStore((s) => ({ ...s, safetyInspectionVerifications: [verification, ...s.safetyInspectionVerifications], safetyInspections: s.safetyInspections.map((item) => item.id === id ? { ...item, verificationStatus: "VERIFIED", verifiedBy: currentUserName, verifiedAt: now, updatedAt: now, version: item.version + 1 } : item) }));
        return verification;
      },
      rejectSafetyInspection: (id, input) => {
        if (!input.details.trim()) throw new Error("Rejection details are required.");
        const now = new Date().toISOString();
        const verification: SafetyInspectionVerification = { id: `safety-verification-${uid()}`, inspectionId: id, verificationStatus: "REJECTED", verificationOutcome: "REJECTED", rejectionReasonCode: input.reasonCode, rejectionDetails: input.details, rejectedBy: currentUserName, rejectedAt: now, createdAt: now, updatedAt: now, version: 1 };
        setStore((s) => ({ ...s, safetyInspectionVerifications: [verification, ...s.safetyInspectionVerifications], safetyInspections: s.safetyInspections.map((item) => item.id === id ? { ...item, status: "REJECTED", verificationStatus: "REJECTED", rejectionReason: input.details, updatedAt: now, version: item.version + 1 } : item) }));
        return verification;
      },
      createSafetyCorrectiveWorkOrder: (inspectionId, observationId) => {
        const inspection = store.safetyInspections.find((item) => item.id === inspectionId);
        if (!inspection) throw new Error("Inspection not found.");
        const observation = observationId ? store.safetyInspectionObservations.find((item) => item.id === observationId) : store.safetyInspectionObservations.find((item) => item.inspectionId === inspectionId && item.correctiveActionRequired);
        if (observation?.correctiveWorkOrderId) {
          const existing = store.maintenanceWorkOrders.find((item) => item.id === observation.correctiveWorkOrderId);
          if (existing) return existing;
        }
        const category = store.safetyCategories.find((item) => item.id === inspection.categoryId);
        const workOrder = api.addMaintenanceWorkOrder({ homeId: inspection.homeId, title: `${category?.name || "Safety"} corrective action - ${inspection.inspectionNumber}`, description: observation?.description || inspection.summary || "Corrective action required from Safety & Compliance inspection.", type: "INSPECTION_FOLLOW_UP", source: "INSPECTION", category: category?.code === "FIRE_SAFETY" ? "FIRE_SAFETY" : category?.code === "ELECTRICAL" ? "ELECTRICAL" : "OTHER", priority: inspection.priority, assetId: inspection.assetId, exactLocation: observation?.locationId || inspection.locationId, residentSafetyImpact: category?.code === "NURSE_CALL" || category?.code === "RESIDENT_EQUIPMENT", serviceDisruption: false, complianceImpact: true, immediateRisk: observation?.severity === "CRITICAL", immediateControlSummary: observation?.immediateActionTaken, verificationRequired: true });
        setStore((s) => ({ ...s, safetyInspectionObservations: s.safetyInspectionObservations.map((item) => item.id === observation?.id ? { ...item, correctiveWorkOrderId: workOrder.id } : item), safetyInspections: s.safetyInspections.map((item) => item.id === inspectionId ? { ...item, correctiveWorkOrderId: workOrder.id, correctiveActionRequired: true } : item) }));
        return workOrder;
      },
      createSafetyCertificate: (input) => {
        const now = new Date().toISOString();
        const certificate: SafetyCertificate = { id: `safety-certificate-${uid()}`, tenantId: "tenant-oritas-demo", homeId: input.homeId || activeFacilityId, facilityId: input.homeId || activeFacilityId, categoryId: input.categoryId, inspectionId: input.inspectionId, assetId: input.assetId, locationId: input.locationId, certificateType: input.certificateType.trim(), certificateNumber: input.certificateNumber.trim(), issuedBy: input.issuedBy.trim(), issuedDate: input.issuedDate, validFrom: input.validFrom, expiryDate: input.expiryDate, status: input.status || "VALID", fileReference: input.fileReference, notes: input.notes, createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now };
        setStore((s) => ({ ...s, safetyCertificates: [certificate, ...s.safetyCertificates] }));
        return certificate;
      },
      updateSafetyCertificate: (id, input) => setStore((s) => ({ ...s, safetyCertificates: s.safetyCertificates.map((item) => item.id === id ? { ...item, ...input, updatedBy: currentUserName, updatedAt: new Date().toISOString() } : item) })),
      revokeSafetyCertificate: (id, reason) => {
        if (!reason.trim()) throw new Error("Enter a revoke reason.");
        api.updateSafetyCertificate(id, { status: "REVOKED", notes: reason });
      },
      supersedeSafetyCertificate: (id, replacementId) => api.updateSafetyCertificate(id, { status: "SUPERSEDED", notes: replacementId ? `Superseded by ${replacementId}` : "Superseded" }),
      createMaintenanceCertificateType: (input) => {
        const now = new Date().toISOString();
        const record: MaintenanceCertificateType = { id: `maintenance-cert-type-${uid()}`, tenantId: "tenant-oritas-demo", code: input.code.trim(), name: input.name.trim(), description: input.description, category: input.category, defaultValidityMonths: input.defaultValidityMonths, expiryRequired: input.expiryRequired ?? true, certificateNumberRequired: input.certificateNumberRequired ?? true, issuingOrganisationRequired: input.issuingOrganisationRequired ?? true, attachmentRequired: input.attachmentRequired ?? true, renewalAllowed: input.renewalAllowed ?? true, warningDays: Number(input.warningDays ?? 90), criticalWarningDays: Number(input.criticalWarningDays ?? 30), applicableSubjectTypes: input.applicableSubjectTypes?.length ? input.applicableSubjectTypes : ["ASSET", "HOME"], applicableAssetCategoryIds: input.applicableAssetCategoryIds || [], applicableSafetyCategories: input.applicableSafetyCategories || [], complianceCritical: input.complianceCritical ?? true, active: input.active ?? true, systemType: false, displayOrder: input.displayOrder ?? store.maintenanceCertificateTypes.length + 1, createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now };
        const validation = validateCertificateType(record, store.maintenanceCertificateTypes);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0]);
        setStore((s) => ({ ...s, maintenanceCertificateTypes: [record, ...s.maintenanceCertificateTypes] }));
        return record;
      },
      updateMaintenanceCertificateType: (id, input) => {
        const current = store.maintenanceCertificateTypes.find((item) => item.id === id);
        if (!current) throw new Error("Certificate type not found.");
        const next = { ...current, ...input, updatedBy: currentUserName, updatedAt: new Date().toISOString() };
        const validation = validateCertificateType(next, store.maintenanceCertificateTypes);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0]);
        setStore((s) => ({ ...s, maintenanceCertificateTypes: s.maintenanceCertificateTypes.map((item) => item.id === id ? next : item) }));
      },
      activateMaintenanceCertificateType: (id) => setStore((s) => ({ ...s, maintenanceCertificateTypes: s.maintenanceCertificateTypes.map((item) => item.id === id ? { ...item, active: true, updatedBy: currentUserName, updatedAt: new Date().toISOString() } : item) })),
      deactivateMaintenanceCertificateType: (id) => setStore((s) => ({ ...s, maintenanceCertificateTypes: s.maintenanceCertificateTypes.map((item) => item.id === id ? { ...item, active: false, updatedBy: currentUserName, updatedAt: new Date().toISOString() } : item) })),
      archiveMaintenanceCertificateType: (id, reason) => {
        if (!reason.trim()) throw new Error("Enter an archive reason.");
        setStore((s) => ({ ...s, maintenanceCertificateTypes: s.maintenanceCertificateTypes.map((item) => item.id === id ? { ...item, active: false, archivedBy: currentUserName, archivedAt: new Date().toISOString(), updatedBy: currentUserName, updatedAt: new Date().toISOString() } : item) }));
      },
      createMaintenanceCertificate: (input) => {
        const now = new Date().toISOString();
        const type = store.maintenanceCertificateTypes.find((item) => item.id === input.certificateTypeId && item.active);
        if (!type) throw new Error("Select an active certificate type.");
        const certificateId = `maintenance-cert-${uid()}`;
        const versionId = `maintenance-cert-version-${uid()}`;
        const certificate: MaintenanceCertificate = { id: certificateId, tenantId: "tenant-oritas-demo", homeId: input.homeId || activeFacilityId, facilityId: input.homeId || activeFacilityId, certificateTypeId: type.id, certificateNumber: input.certificateNumber?.trim() || `CERT-${new Date().getFullYear()}-${String(store.maintenanceCertificates.length + 1).padStart(4, "0")}`, title: input.title.trim(), description: input.description?.trim(), issuingOrganisation: input.issuingOrganisation?.trim() || "", issuingOrganisationContact: input.issuingOrganisationContact?.trim(), subjectType: input.subjectType || "HOME", primarySubjectId: input.primarySubjectId, currentVersionId: versionId, lifecycleStatus: "ACTIVE", complianceStatus: "VALID", active: true, archived: false, createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now, version: 1 };
        const version: MaintenanceCertificateVersion = { id: versionId, tenantId: certificate.tenantId, homeId: certificate.homeId, facilityId: certificate.facilityId, certificateId: certificate.id, versionNumber: 1, certificateNumberSnapshot: certificate.certificateNumber, issuedDate: input.issuedDate, validFromDate: input.validFromDate, expiryDate: input.expiryDate || (type.defaultValidityMonths ? addMonths(input.validFromDate, type.defaultValidityMonths) : undefined), issuingOrganisation: certificate.issuingOrganisation, issuingOrganisationContact: certificate.issuingOrganisationContact, status: "ACTIVE", isCurrent: true, recordedBy: currentUserName, recordedAt: now, updatedBy: currentUserName, updatedAt: now, version: 1 };
        const attachment = input.attachmentFileName ? maintenanceCertificateAttachmentRecord(certificate, version, input.attachmentFileName, "CERTIFICATE_FILE", true, currentUserName, now) : undefined;
        const validation = validateCertificateInput({ ...certificate, ...version }, { types: store.maintenanceCertificateTypes, attachments: attachment ? [attachment] : [] });
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0]);
        const finalCertificate = { ...certificate, complianceStatus: certificateComplianceStatus({ certificate, version, type, attachments: attachment ? [attachment] : [], today: new Date() }) };
        const event = maintenanceCertificateTimelineEvent(finalCertificate, version, "CERTIFICATE_CREATED", "Certificate created", finalCertificate.title, currentUserName, now);
        setStore((s) => ({ ...s, maintenanceCertificates: [finalCertificate, ...s.maintenanceCertificates], maintenanceCertificateVersions: [version, ...s.maintenanceCertificateVersions], maintenanceCertificateAttachments: attachment ? [attachment, ...s.maintenanceCertificateAttachments] : s.maintenanceCertificateAttachments, maintenanceCertificateTimelineEvents: [event, ...s.maintenanceCertificateTimelineEvents] }));
        return finalCertificate;
      },
      updateMaintenanceCertificate: (id, input, reason) => {
        const certificate = store.maintenanceCertificates.find((item) => item.id === id);
        if (!certificate) throw new Error("Certificate not found.");
        const currentVersion = store.maintenanceCertificateVersions.find((item) => item.id === certificate.currentVersionId);
        if (!currentVersion) throw new Error("Current certificate version not found.");
        const now = new Date().toISOString();
        const nextCertificate: MaintenanceCertificate = { ...certificate, title: input.title?.trim() ?? certificate.title, description: input.description?.trim() ?? certificate.description, certificateNumber: input.certificateNumber?.trim() ?? certificate.certificateNumber, issuingOrganisation: input.issuingOrganisation?.trim() ?? certificate.issuingOrganisation, issuingOrganisationContact: input.issuingOrganisationContact?.trim() ?? certificate.issuingOrganisationContact, subjectType: input.subjectType ?? certificate.subjectType, primarySubjectId: input.primarySubjectId ?? certificate.primarySubjectId, updatedBy: currentUserName, updatedAt: now, version: certificate.version + 1 };
        const nextVersion: MaintenanceCertificateVersion = { ...currentVersion, certificateNumberSnapshot: nextCertificate.certificateNumber, issuedDate: input.issuedDate ?? currentVersion.issuedDate, validFromDate: input.validFromDate ?? currentVersion.validFromDate, expiryDate: input.expiryDate ?? currentVersion.expiryDate, issuingOrganisation: nextCertificate.issuingOrganisation, issuingOrganisationContact: nextCertificate.issuingOrganisationContact, updatedBy: currentUserName, updatedAt: now, version: currentVersion.version + 1 };
        const type = store.maintenanceCertificateTypes.find((item) => item.id === nextCertificate.certificateTypeId);
        const attachments = store.maintenanceCertificateAttachments.filter((item) => item.certificateId === id && item.certificateVersionId === nextVersion.id);
        const validation = validateCertificateInput({ ...nextCertificate, ...nextVersion }, { types: store.maintenanceCertificateTypes, attachments });
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0]);
        nextCertificate.complianceStatus = certificateComplianceStatus({ certificate: nextCertificate, version: nextVersion, type, attachments, today: new Date() });
        const event = maintenanceCertificateTimelineEvent(nextCertificate, nextVersion, "CERTIFICATE_UPDATED", "Certificate updated", reason || "Metadata updated", currentUserName, now);
        setStore((s) => ({ ...s, maintenanceCertificates: s.maintenanceCertificates.map((item) => item.id === id ? nextCertificate : item), maintenanceCertificateVersions: s.maintenanceCertificateVersions.map((item) => item.id === nextVersion.id ? nextVersion : item), maintenanceCertificateTimelineEvents: [event, ...s.maintenanceCertificateTimelineEvents] }));
      },
      archiveMaintenanceCertificate: (id, reason) => {
        if (!reason.trim()) throw new Error("Enter an archive reason.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, maintenanceCertificates: s.maintenanceCertificates.map((item) => item.id === id ? { ...item, lifecycleStatus: "ARCHIVED", complianceStatus: "NOT_APPLICABLE", active: false, archived: true, archivedAt: now, archivedBy: currentUserName, archiveReason: reason, updatedBy: currentUserName, updatedAt: now, version: item.version + 1 } : item) }));
      },
      restoreMaintenanceCertificate: (id) => setStore((s) => ({ ...s, maintenanceCertificates: s.maintenanceCertificates.map((item) => item.id === id ? { ...item, lifecycleStatus: "ACTIVE", active: true, archived: false, archivedAt: undefined, archivedBy: undefined, archiveReason: undefined, updatedBy: currentUserName, updatedAt: new Date().toISOString(), version: item.version + 1 } : item) })),
      renewMaintenanceCertificate: (id, input) => {
        const certificate = store.maintenanceCertificates.find((item) => item.id === id && !item.archived);
        if (!certificate) throw new Error("Certificate not found.");
        const type = store.maintenanceCertificateTypes.find((item) => item.id === certificate.certificateTypeId);
        if (!type?.renewalAllowed) throw new Error("Renewal is not allowed for this certificate type.");
        if (!input.renewalReason.trim()) throw new Error("Enter a renewal reason.");
        const now = new Date().toISOString();
        const previousCurrent = store.maintenanceCertificateVersions.find((item) => item.id === certificate.currentVersionId);
        const nextNumber = Math.max(0, ...store.maintenanceCertificateVersions.filter((item) => item.certificateId === id).map((item) => item.versionNumber)) + 1;
        const version: MaintenanceCertificateVersion = { id: `maintenance-cert-version-${uid()}`, tenantId: certificate.tenantId, homeId: certificate.homeId, facilityId: certificate.facilityId, certificateId: certificate.id, versionNumber: nextNumber, certificateNumberSnapshot: certificate.certificateNumber, issuedDate: input.issuedDate, validFromDate: input.validFromDate, expiryDate: input.expiryDate || (type.defaultValidityMonths ? addMonths(input.validFromDate, type.defaultValidityMonths) : undefined), issuingOrganisation: input.issuingOrganisation || certificate.issuingOrganisation, issuingOrganisationContact: input.issuingOrganisationContact || certificate.issuingOrganisationContact, status: input.activate === false ? "DRAFT" : "ACTIVE", supersedesVersionId: input.activate === false ? undefined : previousCurrent?.id, renewalReason: input.renewalReason, notes: input.notes, isCurrent: input.activate !== false, recordedBy: currentUserName, recordedAt: now, updatedBy: currentUserName, updatedAt: now, version: 1 };
        const attachment = input.attachmentFileName ? maintenanceCertificateAttachmentRecord(certificate, version, input.attachmentFileName, "RENEWAL_DOCUMENT", true, currentUserName, now) : undefined;
        const validation = validateCertificateInput({ ...certificate, ...version }, { types: store.maintenanceCertificateTypes, attachments: attachment ? [attachment] : [] });
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0]);
        const nextCertificate = input.activate === false ? certificate : { ...certificate, currentVersionId: version.id, complianceStatus: certificateComplianceStatus({ certificate, version, type, attachments: attachment ? [attachment] : [], today: new Date() }), updatedBy: currentUserName, updatedAt: now, version: certificate.version + 1 };
        const event = maintenanceCertificateTimelineEvent(certificate, version, input.activate === false ? "CERTIFICATE_RENEWAL_STARTED" : "CERTIFICATE_RENEWED", input.activate === false ? "Renewal draft started" : "Certificate renewed", input.renewalReason, currentUserName, now);
        setStore((s) => ({ ...s, maintenanceCertificates: s.maintenanceCertificates.map((item) => item.id === id ? nextCertificate : item), maintenanceCertificateVersions: [version, ...s.maintenanceCertificateVersions.map((item) => previousCurrent && input.activate !== false && item.id === previousCurrent.id ? { ...item, status: "SUPERSEDED", isCurrent: false, supersededByVersionId: version.id, updatedBy: currentUserName, updatedAt: now, version: item.version + 1 } : item)], maintenanceCertificateAttachments: attachment ? [attachment, ...s.maintenanceCertificateAttachments] : s.maintenanceCertificateAttachments, maintenanceCertificateTimelineEvents: [event, ...s.maintenanceCertificateTimelineEvents] }));
        return version;
      },
      revokeMaintenanceCertificateVersion: (certificateId, versionId, reason) => {
        if (!reason.trim()) throw new Error("Enter a revocation reason.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, maintenanceCertificateVersions: s.maintenanceCertificateVersions.map((item) => item.id === versionId && item.certificateId === certificateId ? { ...item, status: "REVOKED", revocationReason: reason, updatedBy: currentUserName, updatedAt: now, version: item.version + 1 } : item), maintenanceCertificates: s.maintenanceCertificates.map((item) => item.id === certificateId && item.currentVersionId === versionId ? { ...item, complianceStatus: "REVOKED", updatedBy: currentUserName, updatedAt: now, version: item.version + 1 } : item) }));
      },
      addMaintenanceCertificateAttachment: (certificateId, versionId, input) => {
        const certificate = store.maintenanceCertificates.find((item) => item.id === certificateId);
        const version = store.maintenanceCertificateVersions.find((item) => item.id === versionId && item.certificateId === certificateId);
        if (!certificate || !version) throw new Error("Certificate version not found.");
        const now = new Date().toISOString();
        const attachment = maintenanceCertificateAttachmentRecord(certificate, version, input.fileName, input.documentType || "CERTIFICATE_FILE", Boolean(input.primaryAttachment), currentUserName, now, input.description);
        const event = maintenanceCertificateTimelineEvent(certificate, version, "ATTACHMENT_ADDED", "Attachment added", attachment.fileName, currentUserName, now);
        setStore((s) => ({ ...s, maintenanceCertificateAttachments: [attachment, ...s.maintenanceCertificateAttachments.map((item) => input.primaryAttachment && item.certificateVersionId === versionId ? { ...item, primaryAttachment: false } : item)], maintenanceCertificateTimelineEvents: [event, ...s.maintenanceCertificateTimelineEvents] }));
        return attachment;
      },
      removeMaintenanceCertificateAttachment: (attachmentId, reason) => {
        if (!reason.trim()) throw new Error("Enter a removal reason.");
        setStore((s) => ({ ...s, maintenanceCertificateAttachments: s.maintenanceCertificateAttachments.map((item) => item.id === attachmentId ? { ...item, active: false, removedBy: currentUserName, removedAt: new Date().toISOString(), removalReason: reason } : item) }));
      },
      setPrimaryMaintenanceCertificateAttachment: (attachmentId) => setStore((s) => {
        const target = s.maintenanceCertificateAttachments.find((item) => item.id === attachmentId);
        if (!target) return s;
        return { ...s, maintenanceCertificateAttachments: s.maintenanceCertificateAttachments.map((item) => item.certificateVersionId === target.certificateVersionId ? { ...item, primaryAttachment: item.id === attachmentId } : item) };
      }),
      linkMaintenanceCertificateAsset: (certificateId, assetId, relationshipType = "APPLIES_TO") => {
        const certificate = store.maintenanceCertificates.find((item) => item.id === certificateId);
        const asset = store.maintenanceAssets.find((item) => item.id === assetId);
        if (!certificate || !asset || asset.homeId !== certificate.homeId) throw new Error("Select an asset in the same Home.");
        const link: MaintenanceCertificateAssetLink = { id: `maintenance-cert-asset-link-${uid()}`, tenantId: certificate.tenantId, homeId: certificate.homeId || asset.homeId, facilityId: certificate.facilityId, certificateId, certificateVersionId: certificate.currentVersionId, assetId, relationshipType, primary: false, linkedBy: currentUserName, linkedAt: new Date().toISOString() };
        setStore((s) => ({ ...s, maintenanceCertificateAssetLinks: [link, ...s.maintenanceCertificateAssetLinks] }));
        return link;
      },
      unlinkMaintenanceCertificateAsset: (linkId) => setStore((s) => ({ ...s, maintenanceCertificateAssetLinks: s.maintenanceCertificateAssetLinks.map((item) => item.id === linkId ? { ...item, unlinkedBy: currentUserName, unlinkedAt: new Date().toISOString() } : item) })),
      linkMaintenanceCertificateWorkOrder: (certificateId, workOrderId, relationshipType = "RELATED_TO") => {
        const certificate = store.maintenanceCertificates.find((item) => item.id === certificateId);
        const workOrder = store.maintenanceWorkOrders.find((item) => item.id === workOrderId);
        if (!certificate || !workOrder || workOrder.homeId !== certificate.homeId) throw new Error("Select a Work Order in the same Home.");
        const link: MaintenanceCertificateWorkOrderLink = { id: `maintenance-cert-work-order-link-${uid()}`, tenantId: certificate.tenantId, homeId: certificate.homeId || workOrder.homeId, facilityId: certificate.facilityId, certificateId, certificateVersionId: certificate.currentVersionId, workOrderId, relationshipType, linkedBy: currentUserName, linkedAt: new Date().toISOString() };
        setStore((s) => ({ ...s, maintenanceCertificateWorkOrderLinks: [link, ...s.maintenanceCertificateWorkOrderLinks] }));
        return link;
      },
      unlinkMaintenanceCertificateWorkOrder: (linkId) => setStore((s) => ({ ...s, maintenanceCertificateWorkOrderLinks: s.maintenanceCertificateWorkOrderLinks.map((item) => item.id === linkId ? { ...item, unlinkedBy: currentUserName, unlinkedAt: new Date().toISOString() } : item) })),
      linkMaintenanceCertificateSafetyInspection: (certificateId, safetyInspectionId, relationshipType = "SUPPORTS_COMPLIANCE") => {
        const certificate = store.maintenanceCertificates.find((item) => item.id === certificateId);
        const inspection = store.safetyInspections.find((item) => item.id === safetyInspectionId);
        if (!certificate || !inspection || inspection.homeId !== certificate.homeId) throw new Error("Select a Safety inspection in the same Home.");
        const link: MaintenanceCertificateSafetyInspectionLink = { id: `maintenance-cert-safety-link-${uid()}`, tenantId: certificate.tenantId, homeId: certificate.homeId || inspection.homeId, facilityId: certificate.facilityId, certificateId, certificateVersionId: certificate.currentVersionId, safetyInspectionId, relationshipType, linkedBy: currentUserName, linkedAt: new Date().toISOString() };
        setStore((s) => ({ ...s, maintenanceCertificateSafetyInspectionLinks: [link, ...s.maintenanceCertificateSafetyInspectionLinks] }));
        return link;
      },
      unlinkMaintenanceCertificateSafetyInspection: (linkId) => setStore((s) => ({ ...s, maintenanceCertificateSafetyInspectionLinks: s.maintenanceCertificateSafetyInspectionLinks.map((item) => item.id === linkId ? { ...item, unlinkedBy: currentUserName, unlinkedAt: new Date().toISOString() } : item) })),
      linkMaintenanceCertificateContractor: (certificateId, contractorId, relationshipType = "HELD_BY") => {
        const certificate = store.maintenanceCertificates.find((item) => item.id === certificateId);
        const contractor = store.maintenanceContractors.find((item) => item.id === contractorId && !item.archived);
        if (!certificate || !contractor) throw new Error("Select an active contractor.");
        const link: MaintenanceCertificateContractorLink = { id: `maintenance-cert-contractor-link-${uid()}`, tenantId: certificate.tenantId, homeId: certificate.homeId, facilityId: certificate.facilityId, certificateId, certificateVersionId: certificate.currentVersionId, contractorId, relationshipType, linkedBy: currentUserName, linkedAt: new Date().toISOString() };
        setStore((s) => ({ ...s, maintenanceCertificateContractorLinks: [link, ...s.maintenanceCertificateContractorLinks] }));
        return link;
      },
      unlinkMaintenanceCertificateContractor: (linkId) => setStore((s) => ({ ...s, maintenanceCertificateContractorLinks: s.maintenanceCertificateContractorLinks.map((item) => item.id === linkId ? { ...item, unlinkedBy: currentUserName, unlinkedAt: new Date().toISOString() } : item) })),
      createMaintenanceCertificateRequirement: (input) => {
        const now = new Date().toISOString();
        const requirement: MaintenanceCertificateRequirement = { id: `maintenance-cert-req-${uid()}`, tenantId: "tenant-oritas-demo", homeId: input.homeId || activeFacilityId, facilityId: input.homeId || activeFacilityId, certificateTypeId: input.certificateTypeId, requirementName: input.requirementName.trim(), subjectType: input.subjectType, subjectId: input.subjectId, assetCategoryId: input.assetCategoryId, safetyCategoryId: input.safetyCategoryId, workOrderTypeId: input.workOrderTypeId, contractorTradeId: input.contractorTradeId, mandatory: input.mandatory ?? true, recurrenceType: input.recurrenceType || "annual", defaultValidityMonths: input.defaultValidityMonths, warningDays: Number(input.warningDays ?? 90), graceDays: Number(input.graceDays ?? 0), active: input.active ?? true, effectiveFrom: input.effectiveFrom || now.slice(0, 10), effectiveTo: input.effectiveTo, createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now };
        const validation = validateRequirement(requirement, store.maintenanceCertificateTypes);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0]);
        setStore((s) => ({ ...s, maintenanceCertificateRequirements: [requirement, ...s.maintenanceCertificateRequirements] }));
        return requirement;
      },
      updateMaintenanceCertificateRequirement: (id, input) => {
        const current = store.maintenanceCertificateRequirements.find((item) => item.id === id);
        if (!current) throw new Error("Certificate requirement not found.");
        const next = { ...current, ...input, updatedBy: currentUserName, updatedAt: new Date().toISOString() };
        const validation = validateRequirement(next, store.maintenanceCertificateTypes);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0]);
        setStore((s) => ({ ...s, maintenanceCertificateRequirements: s.maintenanceCertificateRequirements.map((item) => item.id === id ? next : item) }));
      },
      archiveMaintenanceCertificateRequirement: (id, reason) => {
        if (!reason.trim()) throw new Error("Enter an archive reason.");
        setStore((s) => ({ ...s, maintenanceCertificateRequirements: s.maintenanceCertificateRequirements.map((item) => item.id === id ? { ...item, active: false, archivedBy: currentUserName, archivedAt: new Date().toISOString(), updatedBy: currentUserName, updatedAt: new Date().toISOString() } : item) }));
      },
      createMaintenanceContractor: (input) => {
        requireContractorCapability("maintenance.contractors.create");
        const now = new Date().toISOString();
        const contractor: MaintenanceContractor = {
          id: `maintenance-contractor-${uid()}`,
          tenantId: "tenant-oritas-demo",
          contractorReference: nextContractorReference(store.maintenanceContractors),
          legalName: input.legalName.trim(),
          tradingName: input.tradingName?.trim(),
          companyRegistrationNumber: input.companyRegistrationNumber?.trim(),
          taxRegistrationNumber: input.taxRegistrationNumber?.trim(),
          businessType: input.businessType,
          description: input.description?.trim(),
          website: input.website?.trim(),
          generalEmail: input.generalEmail?.trim(),
          mainPhone: input.mainPhone?.trim(),
          alternativePhone: input.alternativePhone?.trim(),
          emergencyPhone: input.emergencyPhone?.trim(),
          primaryContactName: input.primaryContactName?.trim(),
          primaryContactJobTitle: input.primaryContactJobTitle?.trim(),
          primaryContactEmail: input.primaryContactEmail?.trim(),
          primaryContactPhone: input.primaryContactPhone?.trim(),
          addressLine1: input.addressLine1?.trim(),
          addressLine2: input.addressLine2?.trim(),
          addressLine3: input.addressLine3?.trim(),
          townCity: input.townCity?.trim(),
          countyRegion: input.countyRegion?.trim(),
          postalCode: input.postalCode?.trim(),
          countryCode: (input.countryCode || "IE").trim().toUpperCase(),
          status: "DRAFT",
          approvalStatus: "NOT_REVIEWED",
          restrictionStatus: "NONE",
          active: false,
          archived: false,
          createdBy: currentUserName,
          createdAt: now,
          updatedBy: currentUserName,
          updatedAt: now,
          version: 1,
        };
        const validation = validateContractorInput(contractor);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0]);
        const duplicates = potentialContractorDuplicates(contractor, store.maintenanceContractors);
        const event = maintenanceContractorTimelineEvent(contractor, "CONTRACTOR_CREATED", contractorTimelineSummary("CONTRACTOR_CREATED", contractor), duplicates.length ? `Potential duplicate records: ${duplicates.map((item) => item.contractorReference).join(", ")}` : undefined, currentUserName, now);
        setStore((s) => ({ ...s, maintenanceContractors: [contractor, ...s.maintenanceContractors], maintenanceContractorTimelineEvents: [event, ...s.maintenanceContractorTimelineEvents], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor created", entity: contractor.id, entityType: "maintenance_contractor", timestamp: now, after: JSON.stringify({ contractorReference: contractor.contractorReference, legalName: contractor.legalName, status: contractor.status, potentialDuplicates: duplicates.length }) }, ...s.auditLogs].slice(0, 500) }));
        return contractor;
      },
      updateMaintenanceContractor: (id, input, expectedVersion) => {
        requireContractorCapability("maintenance.contractors.edit");
        const current = store.maintenanceContractors.find((item) => item.id === id);
        if (!current) throw new Error("Contractor not found.");
        ensureContractorEntityScope(current);
        if (current.archived) throw new Error("Archived contractors are read-only. Restore before editing.");
        if (expectedVersion !== undefined && current.version !== expectedVersion) throw new Error("This Contractor record was updated by another user. Refresh the record and review the latest changes before saving.");
        const now = new Date().toISOString();
        const next: MaintenanceContractor = { ...current, ...input, contractorReference: current.contractorReference, tenantId: current.tenantId, status: current.status, archived: current.archived, active: current.active, approvalStatus: current.approvalStatus, restrictionStatus: current.restrictionStatus, legalName: input.legalName?.trim() ?? current.legalName, tradingName: input.tradingName?.trim() ?? current.tradingName, countryCode: (input.countryCode || current.countryCode || "IE").trim().toUpperCase(), updatedBy: currentUserName, updatedAt: now, version: current.version + 1 };
        const validation = validateContractorInput(next);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0]);
        const event = maintenanceContractorTimelineEvent(next, "CONTRACTOR_UPDATED", contractorTimelineSummary("CONTRACTOR_UPDATED", next), undefined, currentUserName, now);
        setStore((s) => ({ ...s, maintenanceContractors: s.maintenanceContractors.map((item) => item.id === id ? next : item), maintenanceContractorTimelineEvents: [event, ...s.maintenanceContractorTimelineEvents], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor updated", entity: id, entityType: "maintenance_contractor", timestamp: now, before: JSON.stringify({ version: current.version }), after: JSON.stringify({ version: next.version, legalName: next.legalName }) }, ...s.auditLogs].slice(0, 500) }));
      },
      activateMaintenanceContractor: (id) => {
        requireContractorCapability("maintenance.contractors.activate");
        const current = store.maintenanceContractors.find((item) => item.id === id);
        if (!current) throw new Error("Contractor not found.");
        ensureContractorEntityScope(current);
        if (current.status === "ACTIVE" && current.active && !current.archived) return;
        const now = new Date().toISOString();
        const next = maintenanceContractorStatusRecord(current, "ACTIVE", currentUserName, now);
        const event = maintenanceContractorTimelineEvent(next, "CONTRACTOR_ACTIVATED", "Contractor activated for internal use.", "Active is not compliance approval.", currentUserName, now);
        setStore((s) => ({ ...s, maintenanceContractors: s.maintenanceContractors.map((item) => item.id === id ? next : item), maintenanceContractorTimelineEvents: [event, ...s.maintenanceContractorTimelineEvents], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor activated", entity: id, entityType: "maintenance_contractor", timestamp: now, before: JSON.stringify({ status: current.status }), after: JSON.stringify({ status: next.status }) }, ...s.auditLogs].slice(0, 500) }));
      },
      deactivateMaintenanceContractor: (id, reason) => {
        requireContractorCapability("maintenance.contractors.deactivate");
        const current = store.maintenanceContractors.find((item) => item.id === id);
        if (!current) throw new Error("Contractor not found.");
        ensureContractorEntityScope(current);
        if (current.status === "INACTIVE" && !current.active) return;
        const now = new Date().toISOString();
        const next = maintenanceContractorStatusRecord(current, "INACTIVE", currentUserName, now, reason);
        const event = maintenanceContractorTimelineEvent(next, "CONTRACTOR_DEACTIVATED", "Contractor deactivated.", reason, currentUserName, now);
        setStore((s) => ({ ...s, maintenanceContractors: s.maintenanceContractors.map((item) => item.id === id ? next : item), maintenanceContractorTimelineEvents: [event, ...s.maintenanceContractorTimelineEvents], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor deactivated", entity: id, entityType: "maintenance_contractor", timestamp: now, before: JSON.stringify({ status: current.status }), after: JSON.stringify({ status: next.status }), reason }, ...s.auditLogs].slice(0, 500) }));
      },
      suspendMaintenanceContractor: (id, reason) => {
        requireContractorCapability("maintenance.contractors.suspend");
        const current = store.maintenanceContractors.find((item) => item.id === id);
        if (!current) throw new Error("Contractor not found.");
        ensureContractorEntityScope(current);
        if (current.status === "SUSPENDED") return;
        const now = new Date().toISOString();
        const next = maintenanceContractorStatusRecord(current, "SUSPENDED", currentUserName, now, reason);
        const event = maintenanceContractorTimelineEvent(next, "CONTRACTOR_SUSPENDED", "Contractor suspended.", reason, currentUserName, now);
        setStore((s) => ({ ...s, maintenanceContractors: s.maintenanceContractors.map((item) => item.id === id ? next : item), maintenanceContractorTimelineEvents: [event, ...s.maintenanceContractorTimelineEvents], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor suspended", entity: id, entityType: "maintenance_contractor", timestamp: now, before: JSON.stringify({ status: current.status }), after: JSON.stringify({ status: next.status }), reason }, ...s.auditLogs].slice(0, 500) }));
      },
      reactivateMaintenanceContractor: (id, reason) => {
        requireContractorCapability("maintenance.contractors.reactivate");
        const current = store.maintenanceContractors.find((item) => item.id === id);
        if (!current) throw new Error("Contractor not found.");
        ensureContractorEntityScope(current);
        if (current.status === "ACTIVE" && current.active && !current.archived) return;
        const now = new Date().toISOString();
        const next = maintenanceContractorStatusRecord(current, "ACTIVE", currentUserName, now, reason);
        const event = maintenanceContractorTimelineEvent(next, "CONTRACTOR_REACTIVATED", "Contractor reactivated for internal use.", reason || "Active is not compliance approval.", currentUserName, now);
        setStore((s) => ({ ...s, maintenanceContractors: s.maintenanceContractors.map((item) => item.id === id ? next : item), maintenanceContractorTimelineEvents: [event, ...s.maintenanceContractorTimelineEvents], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor reactivated", entity: id, entityType: "maintenance_contractor", timestamp: now, before: JSON.stringify({ status: current.status }), after: JSON.stringify({ status: next.status }), reason }, ...s.auditLogs].slice(0, 500) }));
      },
      archiveMaintenanceContractor: (id, reason) => {
        requireContractorCapability("maintenance.contractors.archive");
        if (!reason.trim()) throw new Error("Enter an archive reason.");
        const current = store.maintenanceContractors.find((item) => item.id === id);
        if (!current) throw new Error("Contractor not found.");
        ensureContractorEntityScope(current);
        if (current.archived || current.status === "ARCHIVED") return;
        const now = new Date().toISOString();
        const next = maintenanceContractorStatusRecord(current, "ARCHIVED", currentUserName, now, reason);
        const event = maintenanceContractorTimelineEvent(next, "CONTRACTOR_ARCHIVED", contractorTimelineSummary("CONTRACTOR_ARCHIVED", next), reason, currentUserName, now);
        setStore((s) => ({ ...s, maintenanceContractors: s.maintenanceContractors.map((item) => item.id === id ? next : item), maintenanceContractorTimelineEvents: [event, ...s.maintenanceContractorTimelineEvents], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor archived", entity: id, entityType: "maintenance_contractor", timestamp: now, before: JSON.stringify({ status: current.status }), after: JSON.stringify({ status: next.status }), reason }, ...s.auditLogs].slice(0, 500) }));
      },
      restoreMaintenanceContractor: (id, reason) => {
        requireContractorCapability("maintenance.contractors.restore");
        if (!reason.trim()) throw new Error("Enter a restore reason.");
        const current = store.maintenanceContractors.find((item) => item.id === id);
        if (!current) throw new Error("Contractor not found.");
        ensureContractorEntityScope(current);
        if (!current.archived && current.status !== "ARCHIVED") return;
        const now = new Date().toISOString();
        const next: MaintenanceContractor = { ...current, status: "INACTIVE", active: false, archived: false, archivedAt: undefined, archivedBy: undefined, archiveReason: undefined, updatedBy: currentUserName, updatedAt: now, version: current.version + 1 };
        const event = maintenanceContractorTimelineEvent(next, "CONTRACTOR_RESTORED", contractorTimelineSummary("CONTRACTOR_RESTORED", next), reason, currentUserName, now);
        setStore((s) => ({ ...s, maintenanceContractors: s.maintenanceContractors.map((item) => item.id === id ? next : item), maintenanceContractorTimelineEvents: [event, ...s.maintenanceContractorTimelineEvents], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor restored", entity: id, entityType: "maintenance_contractor", timestamp: now, before: JSON.stringify({ status: current.status, archived: current.archived }), after: JSON.stringify({ status: next.status, archived: next.archived }), reason }, ...s.auditLogs].slice(0, 500) }));
      },
      associateMaintenanceContractorHome: (contractorId, input) => {
        requireContractorCapability("maintenance.contractors.homes.create", input.homeId || activeFacilityId);
        const contractor = store.maintenanceContractors.find((item) => item.id === contractorId && !item.archived);
        if (!contractor) throw new Error("Contractor not found.");
        ensureContractorEntityScope(contractor);
        const homeId = ensureContractorHomeScope(input.homeId);
        if (contractor.status === "SUSPENDED" && input.accessLevel === "STANDARD" && input.associationStatus !== "RESTRICTED") throw new Error("Suspended contractors cannot receive unrestricted active access.");
        const candidate = { ...input, homeId, associationStatus: input.associationStatus || "ACTIVE", accessLevel: input.accessLevel || "BY_APPOINTMENT", relationshipType: input.relationshipType || "HOME_PROVIDER" } satisfies Partial<MaintenanceContractorHomeAssociation>;
        validateMaintenanceContractorHomeAssociationInput(candidate);
        if (store.maintenanceContractorHomeAssociations.some((item) => item.contractorId === contractorId && item.homeId === homeId && item.active && item.associationStatus !== "ARCHIVED")) throw new Error("This contractor is already associated with this Home.");
        const now = new Date().toISOString();
        const association: MaintenanceContractorHomeAssociation = { id: `maintenance-contractor-home-${uid()}`, tenantId: contractor.tenantId, contractorId, homeId, facilityId: homeId, associationStatus: input.associationStatus || "ACTIVE", accessLevel: input.accessLevel || "BY_APPOINTMENT", relationshipType: input.relationshipType || "HOME_PROVIDER", accessRestrictions: input.accessRestrictions, accessNotes: input.accessNotes, serviceNotes: input.serviceNotes || input.notes, internalOwnerUserId: input.internalOwnerUserId, internalOwnerTeamId: input.internalOwnerTeamId, emergencyAccessAllowed: Boolean(input.emergencyAccessAllowed), escortRequired: Boolean(input.escortRequired), siteInductionRequired: Boolean(input.siteInductionRequired), siteInductionCompleted: Boolean(input.siteInductionCompleted), notes: input.notes, active: input.associationStatus !== "INACTIVE" && input.associationStatus !== "ARCHIVED", effectiveFrom: input.effectiveFrom || now.slice(0, 10), effectiveTo: input.effectiveTo, createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now, version: 1 };
        setStore((s) => ({ ...s, maintenanceContractorHomeAssociations: [association, ...s.maintenanceContractorHomeAssociations], maintenanceContractorTimelineEvents: [maintenanceContractorTimelineEvent(contractor, "CONTRACTOR_HOME_ASSOCIATED", "Contractor associated with Home.", input.notes, currentUserName, now, homeId), ...s.maintenanceContractorTimelineEvents], auditLogs: [{ id: uid(), facilityId: homeId, user: currentUserName, role: currentRole, action: "Contractor associated with Home", entity: contractorId, entityType: "maintenance_contractor", timestamp: now, after: JSON.stringify({ homeId, relationshipType: association.relationshipType }) }, ...s.auditLogs].slice(0, 500) }));
        return association;
      },
      updateMaintenanceContractorHomeAssociation: (associationId, input, expectedVersion) => {
        const current = store.maintenanceContractorHomeAssociations.find((item) => item.id === associationId);
        if (!current) throw new Error("Contractor Home association not found.");
        if (expectedVersion !== undefined && (current.version || 1) !== expectedVersion) throw new Error("This Contractor Home access record was updated by another user. Refresh before saving.");
        requireContractorCapability("maintenance.contractors.homes.edit", current.homeId);
        ensureContractorHomeScope(current.homeId);
        const contractor = store.maintenanceContractors.find((item) => item.id === current.contractorId);
        if (!contractor || contractor.archived) throw new Error("Archived contractor records cannot receive Home access updates.");
        ensureContractorEntityScope(contractor);
        const next = { ...current, ...input, id: current.id, contractorId: current.contractorId, tenantId: current.tenantId, homeId: current.homeId, facilityId: current.homeId, updatedBy: currentUserName, updatedAt: new Date().toISOString(), version: (current.version || 1) + 1 };
        validateMaintenanceContractorHomeAssociationInput(next);
        setStore((s) => ({ ...s, maintenanceContractorHomeAssociations: s.maintenanceContractorHomeAssociations.map((item) => item.id === associationId ? next : item), maintenanceContractorTimelineEvents: [maintenanceContractorTimelineEvent(contractor, "CONTRACTOR_HOME_ASSOCIATION_UPDATED", "Contractor Home access updated.", `${next.associationStatus} - ${next.accessLevel || "No access level"}`, currentUserName, next.updatedAt!, next.homeId), ...s.maintenanceContractorTimelineEvents], auditLogs: [{ id: uid(), facilityId: current.homeId, user: currentUserName, role: currentRole, action: "Contractor Home association updated", entity: current.contractorId, entityType: "maintenance_contractor", timestamp: next.updatedAt!, before: JSON.stringify({ status: current.associationStatus, accessLevel: current.accessLevel }), after: JSON.stringify({ status: next.associationStatus, accessLevel: next.accessLevel }) }, ...s.auditLogs].slice(0, 500) }));
      },
      setMaintenanceContractorHomeAssociationStatus: (associationId, status, reason) => {
        const current = store.maintenanceContractorHomeAssociations.find((item) => item.id === associationId);
        if (!current) throw new Error("Contractor Home association not found.");
        const capability = status === "RESTRICTED" ? "maintenance.contractors.homes.restrict" : status === "SUSPENDED" ? "maintenance.contractors.homes.suspend" : status === "ARCHIVED" ? "maintenance.contractors.homes.archive" : status === "ACTIVE" ? "maintenance.contractors.homes.activate" : "maintenance.contractors.homes.deactivate";
        requireContractorCapability(capability, current.homeId);
        ensureContractorHomeScope(current.homeId);
        if (current.associationStatus === status) return;
        if (["RESTRICTED", "SUSPENDED", "ARCHIVED"].includes(status) && !reason?.trim()) throw new Error("Enter a reason for this Home access change.");
        const now = new Date().toISOString();
        const contractor = store.maintenanceContractors.find((item) => item.id === current.contractorId);
        const next = { ...current, associationStatus: status, active: status === "ACTIVE" || status === "RESTRICTED" || status === "PLANNED", accessRestrictions: status === "RESTRICTED" ? reason || current.accessRestrictions : current.accessRestrictions, archivedBy: status === "ARCHIVED" ? currentUserName : current.archivedBy, archivedAt: status === "ARCHIVED" ? now : current.archivedAt, updatedBy: currentUserName, updatedAt: now, version: (current.version || 1) + 1 };
        setStore((s) => ({ ...s, maintenanceContractorHomeAssociations: s.maintenanceContractorHomeAssociations.map((item) => item.id === associationId ? next : item), maintenanceContractorTimelineEvents: contractor ? [maintenanceContractorTimelineEvent(contractor, status === "RESTRICTED" ? "CONTRACTOR_HOME_ACCESS_RESTRICTED" : status === "SUSPENDED" ? "CONTRACTOR_HOME_ACCESS_SUSPENDED" : "CONTRACTOR_HOME_ASSOCIATION_UPDATED", `Home access changed to ${status.toLowerCase()}.`, reason, currentUserName, now, current.homeId), ...s.maintenanceContractorTimelineEvents] : s.maintenanceContractorTimelineEvents, auditLogs: [{ id: uid(), facilityId: current.homeId, user: currentUserName, role: currentRole, action: "Contractor Home access status changed", entity: current.contractorId, entityType: "maintenance_contractor", timestamp: now, before: JSON.stringify({ status: current.associationStatus }), after: JSON.stringify({ status }), reason }, ...s.auditLogs].slice(0, 500) }));
      },
      removeMaintenanceContractorHomeAssociation: (associationId, reason) => {
        const existing = store.maintenanceContractorHomeAssociations.find((item) => item.id === associationId);
        if (existing) {
          requireContractorCapability("maintenance.contractors.homes.deactivate", existing.homeId);
          ensureContractorHomeScope(existing.homeId);
        }
        const now = new Date().toISOString();
        setStore((s) => {
          const association = s.maintenanceContractorHomeAssociations.find((item) => item.id === associationId);
          const contractor = association ? s.maintenanceContractors.find((item) => item.id === association.contractorId) : undefined;
          return { ...s, maintenanceContractorHomeAssociations: s.maintenanceContractorHomeAssociations.map((item) => item.id === associationId ? { ...item, active: false, associationStatus: "INACTIVE", effectiveTo: now.slice(0, 10), notes: reason || item.notes, updatedBy: currentUserName, updatedAt: now } : item), maintenanceContractorTimelineEvents: contractor ? [maintenanceContractorTimelineEvent(contractor, "CONTRACTOR_HOME_ASSOCIATION_REMOVED", "Contractor Home association removed.", reason, currentUserName, now, association?.homeId), ...s.maintenanceContractorTimelineEvents] : s.maintenanceContractorTimelineEvents, auditLogs: association ? [{ id: uid(), facilityId: association.homeId, user: currentUserName, role: currentRole, action: "Contractor Home association removed", entity: association.contractorId, entityType: "maintenance_contractor", timestamp: now, reason }, ...s.auditLogs].slice(0, 500) : s.auditLogs };
        });
      },
      createMaintenanceContractorContact: (contractorId, input) => {
        requireContractorCapability("maintenance.contractors.contacts.create", input.homeId || activeFacilityId);
        const contractor = store.maintenanceContractors.find((item) => item.id === contractorId && !item.archived);
        if (!contractor) throw new Error("Contractor not found.");
        ensureContractorEntityScope(contractor);
        if (input.homeId) ensureContractorHomeScope(input.homeId);
        if (input.homeId && !store.maintenanceContractorHomeAssociations.some((item) => item.contractorId === contractorId && item.homeId === input.homeId && item.active)) throw new Error("Home-specific contacts must reference an associated Home.");
        validateMaintenanceContractorContactInput(input);
        const now = new Date().toISOString();
        const contact: MaintenanceContractorContact = { id: `maintenance-contractor-contact-${uid()}`, tenantId: contractor.tenantId, contractorId, homeId: input.homeId, facilityId: input.homeId, firstName: input.firstName?.trim(), lastName: input.lastName?.trim(), displayName: contractorContactDisplayName(input), jobTitle: input.jobTitle?.trim(), contactRole: input.contactRole || "GENERAL", email: input.email?.trim(), phone: input.phone?.trim(), mobile: input.mobile?.trim(), emergencyPhone: input.emergencyPhone?.trim(), isPrimary: Boolean(input.isPrimary), isEmergencyContact: Boolean(input.isEmergencyContact), active: input.active !== false, notes: input.notes?.trim(), createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now, version: 1 };
        setStore((s) => ({ ...s, maintenanceContractorContacts: [contact, ...s.maintenanceContractorContacts.map((item) => item.contractorId === contractorId && contact.isPrimary ? { ...item, isPrimary: false, updatedBy: currentUserName, updatedAt: now, version: item.version + 1 } : item)], maintenanceContractors: contact.isPrimary ? s.maintenanceContractors.map((item) => item.id === contractorId ? { ...item, primaryContactName: contact.displayName, primaryContactJobTitle: contact.jobTitle, primaryContactEmail: contact.email, primaryContactPhone: contact.mobile || contact.phone || contact.emergencyPhone, updatedBy: currentUserName, updatedAt: now, version: item.version + 1 } : item) : s.maintenanceContractors, maintenanceContractorTimelineEvents: [maintenanceContractorTimelineEvent(contractor, contact.isPrimary ? "CONTRACTOR_CONTACT_SET_PRIMARY" : "CONTRACTOR_CONTACT_CREATED", contact.isPrimary ? `Primary contact changed to ${contact.displayName}.` : `Contact ${contact.displayName} added.`, contact.contactRole, currentUserName, now, contact.homeId), ...s.maintenanceContractorTimelineEvents], auditLogs: [{ id: uid(), facilityId: contact.homeId || activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor contact created", entity: contractorId, entityType: "maintenance_contractor", timestamp: now, after: JSON.stringify({ contactId: contact.id, role: contact.contactRole, isPrimary: contact.isPrimary }) }, ...s.auditLogs].slice(0, 500) }));
        return contact;
      },
      updateMaintenanceContractorContact: (contactId, input, expectedVersion) => {
        const current = store.maintenanceContractorContacts.find((item) => item.id === contactId);
        if (!current) throw new Error("Contractor contact not found.");
        requireContractorCapability("maintenance.contractors.contacts.edit", current.homeId || activeFacilityId);
        if (current.homeId) ensureContractorHomeScope(current.homeId);
        const contractor = store.maintenanceContractors.find((item) => item.id === current.contractorId && !item.archived);
        if (!contractor) throw new Error("Contractor not found.");
        ensureContractorEntityScope(contractor);
        if (input.homeId && input.homeId !== current.homeId) ensureContractorHomeScope(input.homeId);
        if (input.homeId && !store.maintenanceContractorHomeAssociations.some((item) => item.contractorId === current.contractorId && item.homeId === input.homeId && item.active)) throw new Error("Home-specific contacts must reference an associated Home.");
        if (current.archivedAt) throw new Error("Archived contacts must be restored before editing.");
        if (expectedVersion !== undefined && current.version !== expectedVersion) throw new Error("This Contractor contact was updated by another user. Refresh before saving.");
        const next = { ...current, ...input, id: current.id, tenantId: current.tenantId, contractorId: current.contractorId, displayName: contractorContactDisplayName({ ...current, ...input }), updatedBy: currentUserName, updatedAt: new Date().toISOString(), version: current.version + 1 };
        validateMaintenanceContractorContactInput(next);
        setStore((s) => ({ ...s, maintenanceContractorContacts: s.maintenanceContractorContacts.map((item) => item.id === contactId ? next : item), maintenanceContractorTimelineEvents: [maintenanceContractorTimelineEvent(contractor, "CONTRACTOR_CONTACT_UPDATED", `Contact ${next.displayName} updated.`, next.contactRole, currentUserName, next.updatedAt!, next.homeId), ...s.maintenanceContractorTimelineEvents], auditLogs: [{ id: uid(), facilityId: next.homeId || activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor contact updated", entity: current.contractorId, entityType: "maintenance_contractor", timestamp: next.updatedAt!, before: JSON.stringify({ version: current.version }), after: JSON.stringify({ version: next.version }) }, ...s.auditLogs].slice(0, 500) }));
      },
      setMaintenanceContractorContactPrimary: (contactId) => {
        requireContractorCapability("maintenance.contractors.contacts.set_primary");
        const contact = store.maintenanceContractorContacts.find((item) => item.id === contactId);
        if (!contact || !contact.active || contact.archivedAt) throw new Error("Select an active contact.");
        const contractor = store.maintenanceContractors.find((item) => item.id === contact.contractorId);
        if (!contractor) throw new Error("Contractor not found.");
        ensureContractorEntityScope(contractor);
        if (contact.homeId) ensureContractorHomeScope(contact.homeId);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, maintenanceContractorContacts: s.maintenanceContractorContacts.map((item) => item.contractorId === contact.contractorId ? { ...item, isPrimary: item.id === contactId, updatedBy: currentUserName, updatedAt: now, version: item.version + 1 } : item), maintenanceContractors: s.maintenanceContractors.map((item) => item.id === contact.contractorId ? { ...item, primaryContactName: contact.displayName, primaryContactJobTitle: contact.jobTitle, primaryContactEmail: contact.email, primaryContactPhone: contact.mobile || contact.phone || contact.emergencyPhone, updatedBy: currentUserName, updatedAt: now, version: item.version + 1 } : item), maintenanceContractorTimelineEvents: [maintenanceContractorTimelineEvent(contractor, "CONTRACTOR_CONTACT_SET_PRIMARY", `Primary contact changed to ${contact.displayName}.`, undefined, currentUserName, now, contact.homeId), ...s.maintenanceContractorTimelineEvents], auditLogs: [{ id: uid(), facilityId: contact.homeId || activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor primary contact changed", entity: contact.contractorId, entityType: "maintenance_contractor", timestamp: now, after: JSON.stringify({ contactId }) }, ...s.auditLogs].slice(0, 500) }));
      },
      setMaintenanceContractorContactEmergency: (contactId, isEmergency = true) => {
        requireContractorCapability("maintenance.contractors.contacts.set_emergency");
        const contact = store.maintenanceContractorContacts.find((item) => item.id === contactId);
        if (!contact || contact.archivedAt) throw new Error("Contractor contact not found.");
        if (contact.homeId) ensureContractorHomeScope(contact.homeId);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, maintenanceContractorContacts: s.maintenanceContractorContacts.map((item) => item.id === contactId ? { ...item, isEmergencyContact: isEmergency, updatedBy: currentUserName, updatedAt: now, version: item.version + 1 } : item), auditLogs: [{ id: uid(), facilityId: contact.homeId || activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor emergency contact changed", entity: contact.contractorId, entityType: "maintenance_contractor", timestamp: now, after: JSON.stringify({ contactId, isEmergency }) }, ...s.auditLogs].slice(0, 500) }));
      },
      archiveMaintenanceContractorContact: (contactId, reason) => {
        requireContractorCapability("maintenance.contractors.contacts.archive");
        if (!reason.trim()) throw new Error("Enter an archive reason.");
        const contact = store.maintenanceContractorContacts.find((item) => item.id === contactId);
        if (!contact) throw new Error("Contractor contact not found.");
        if (contact?.homeId) ensureContractorHomeScope(contact.homeId);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, maintenanceContractorContacts: s.maintenanceContractorContacts.map((item) => item.id === contactId ? { ...item, active: false, isPrimary: false, archivedBy: currentUserName, archivedAt: now, updatedBy: currentUserName, updatedAt: now, version: item.version + 1 } : item), auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor contact archived", entity: contactId, entityType: "maintenance_contractor_contact", timestamp: now, reason }, ...s.auditLogs].slice(0, 500) }));
      },
      restoreMaintenanceContractorContact: (contactId) => {
        requireContractorCapability("maintenance.contractors.contacts.archive");
        const contact = store.maintenanceContractorContacts.find((item) => item.id === contactId);
        if (!contact) throw new Error("Contractor contact not found.");
        if (contact?.homeId) ensureContractorHomeScope(contact.homeId);
        setStore((s) => ({ ...s, maintenanceContractorContacts: s.maintenanceContractorContacts.map((item) => item.id === contactId ? { ...item, active: true, archivedAt: undefined, archivedBy: undefined, updatedBy: currentUserName, updatedAt: new Date().toISOString(), version: item.version + 1 } : item) }));
      },
      createMaintenanceContractorServiceArea: (contractorId, input) => {
        requireContractorCapability("maintenance.contractors.service_areas.create", input.homeId || activeFacilityId);
        const contractor = store.maintenanceContractors.find((item) => item.id === contractorId && !item.archived);
        if (!contractor) throw new Error("Contractor not found.");
        ensureContractorEntityScope(contractor);
        if (contractor.status === "ARCHIVED") throw new Error("Archived contractors cannot receive new service areas.");
        if (input.homeId) ensureContractorHomeScope(input.homeId);
        if (input.serviceAreaType === "HOME" && !input.homeId) throw new Error("Home service areas must reference a Nursing Home.");
        if (input.serviceAreaType === "HOME" && input.homeId && !store.maintenanceContractorHomeAssociations.some((item) => item.contractorId === contractorId && item.homeId === input.homeId && item.active)) throw new Error("Home service areas must reference an associated Home.");
        validateMaintenanceContractorServiceAreaInput(input);
        const now = new Date().toISOString();
        const area: MaintenanceContractorServiceArea = { id: `maintenance-contractor-service-area-${uid()}`, tenantId: contractor.tenantId, contractorId, name: input.name.trim(), serviceAreaType: input.serviceAreaType, countryCode: input.countryCode?.trim().toUpperCase(), countyRegion: input.countyRegion?.trim(), townCity: input.townCity?.trim(), postalCodePattern: input.postalCodePattern?.trim(), homeId: input.homeId, facilityId: input.homeId, coverageDescription: input.coverageDescription?.trim(), standardHours: input.standardHours?.trim(), emergencyCalloutAvailable: Boolean(input.emergencyCalloutAvailable), outOfHoursAvailable: Boolean(input.outOfHoursAvailable), remoteSupportAvailable: Boolean(input.remoteSupportAvailable), responseNotes: input.responseNotes?.trim(), active: input.active !== false, effectiveFrom: input.effectiveFrom || now.slice(0, 10), effectiveTo: input.effectiveTo, createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now, version: 1 };
        setStore((s) => ({ ...s, maintenanceContractorServiceAreas: [area, ...s.maintenanceContractorServiceAreas], maintenanceContractorTimelineEvents: [maintenanceContractorTimelineEvent(contractor, "CONTRACTOR_SERVICE_AREA_CREATED", `Service coverage added for ${area.name}.`, area.coverageDescription, currentUserName, now, area.homeId), ...s.maintenanceContractorTimelineEvents], auditLogs: [{ id: uid(), facilityId: area.homeId || activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor service area created", entity: contractorId, entityType: "maintenance_contractor", timestamp: now, after: JSON.stringify({ serviceAreaId: area.id, type: area.serviceAreaType }) }, ...s.auditLogs].slice(0, 500) }));
        return area;
      },
      updateMaintenanceContractorServiceArea: (serviceAreaId, input, expectedVersion) => {
        const current = store.maintenanceContractorServiceAreas.find((item) => item.id === serviceAreaId);
        if (!current) throw new Error("Contractor service area not found.");
        requireContractorCapability("maintenance.contractors.service_areas.edit", current.homeId || activeFacilityId);
        if (current.homeId) ensureContractorHomeScope(current.homeId);
        if (input.homeId && input.homeId !== current.homeId) ensureContractorHomeScope(input.homeId);
        if (current.archivedAt) throw new Error("Archived service areas must be restored before editing.");
        if (expectedVersion !== undefined && current.version !== expectedVersion) throw new Error("This Contractor service area was updated by another user. Refresh before saving.");
        const next = { ...current, ...input, id: current.id, tenantId: current.tenantId, contractorId: current.contractorId, updatedBy: currentUserName, updatedAt: new Date().toISOString(), version: current.version + 1 };
        validateMaintenanceContractorServiceAreaInput(next);
        setStore((s) => ({ ...s, maintenanceContractorServiceAreas: s.maintenanceContractorServiceAreas.map((item) => item.id === serviceAreaId ? next : item), auditLogs: [{ id: uid(), facilityId: next.homeId || activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor service area updated", entity: current.contractorId, entityType: "maintenance_contractor", timestamp: next.updatedAt!, before: JSON.stringify({ version: current.version }), after: JSON.stringify({ version: next.version }) }, ...s.auditLogs].slice(0, 500) }));
      },
      setMaintenanceContractorServiceAreaActive: (serviceAreaId, active, reason) => {
        const current = store.maintenanceContractorServiceAreas.find((item) => item.id === serviceAreaId);
        if (!current) throw new Error("Contractor service area not found.");
        requireContractorCapability(active ? "maintenance.contractors.service_areas.activate" : "maintenance.contractors.service_areas.deactivate", current?.homeId || activeFacilityId);
        if (current?.homeId) ensureContractorHomeScope(current.homeId);
        if (!active && !reason?.trim()) throw new Error("Enter a deactivation reason.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, maintenanceContractorServiceAreas: s.maintenanceContractorServiceAreas.map((item) => item.id === serviceAreaId ? { ...item, active, updatedBy: currentUserName, updatedAt: now, version: item.version + 1 } : item), auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: active ? "Contractor service area activated" : "Contractor service area deactivated", entity: serviceAreaId, entityType: "maintenance_contractor_service_area", timestamp: now, reason }, ...s.auditLogs].slice(0, 500) }));
      },
      archiveMaintenanceContractorServiceArea: (serviceAreaId, reason) => {
        const current = store.maintenanceContractorServiceAreas.find((item) => item.id === serviceAreaId);
        if (!current) throw new Error("Contractor service area not found.");
        requireContractorCapability("maintenance.contractors.service_areas.archive", current?.homeId || activeFacilityId);
        if (current?.homeId) ensureContractorHomeScope(current.homeId);
        if (!reason.trim()) throw new Error("Enter an archive reason.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, maintenanceContractorServiceAreas: s.maintenanceContractorServiceAreas.map((item) => item.id === serviceAreaId ? { ...item, active: false, archivedBy: currentUserName, archivedAt: now, updatedBy: currentUserName, updatedAt: now, version: item.version + 1 } : item), auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor service area archived", entity: serviceAreaId, entityType: "maintenance_contractor_service_area", timestamp: now, reason }, ...s.auditLogs].slice(0, 500) }));
      },
      restoreMaintenanceContractorServiceArea: (serviceAreaId) => {
        const current = store.maintenanceContractorServiceAreas.find((item) => item.id === serviceAreaId);
        if (!current) throw new Error("Contractor service area not found.");
        requireContractorCapability("maintenance.contractors.service_areas.archive", current?.homeId || activeFacilityId);
        if (current?.homeId) ensureContractorHomeScope(current.homeId);
        setStore((s) => ({ ...s, maintenanceContractorServiceAreas: s.maintenanceContractorServiceAreas.map((item) => item.id === serviceAreaId ? { ...item, active: true, archivedAt: undefined, archivedBy: undefined, updatedBy: currentUserName, updatedAt: new Date().toISOString(), version: item.version + 1 } : item) }));
      },
      addMaintenanceContractorNote: (contractorId, input) => {
        requireContractorCapability("maintenance.contractors.notes.create", input.homeId || activeFacilityId);
        const contractor = store.maintenanceContractors.find((item) => item.id === contractorId);
        if (!contractor) throw new Error("Contractor not found.");
        ensureContractorEntityScope(contractor);
        if (contractor.archived) throw new Error("Archived contractor notes are read-only unless restored.");
        if (input.homeId) ensureContractorHomeScope(input.homeId);
        if (input.homeId && !store.maintenanceContractorHomeAssociations.some((item) => item.contractorId === contractorId && item.homeId === input.homeId && item.active)) throw new Error("Home-specific notes must reference an associated Home.");
        if (!input.title.trim() || !input.body.trim()) throw new Error("Enter a note title and body.");
        if (input.body.toLowerCase().includes("resident:")) throw new Error("Contractor notes must not contain resident-specific care information.");
        const now = new Date().toISOString();
        const note: MaintenanceContractorNote = { id: `maintenance-contractor-note-${uid()}`, tenantId: contractor.tenantId, contractorId, homeId: input.homeId || activeFacilityId, facilityId: input.homeId || activeFacilityId, noteType: input.noteType || "GENERAL", title: input.title.trim(), body: input.body.trim(), visibility: "INTERNAL", pinned: Boolean(input.pinned), active: true, createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now, version: 1 };
        setStore((s) => ({ ...s, maintenanceContractorNotes: [note, ...s.maintenanceContractorNotes], maintenanceContractorTimelineEvents: [maintenanceContractorTimelineEvent(contractor, "CONTRACTOR_NOTE_ADDED", "Contractor note added.", note.title, currentUserName, now, note.homeId), ...s.maintenanceContractorTimelineEvents], auditLogs: [{ id: uid(), facilityId: note.homeId || activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor note added", entity: contractorId, entityType: "maintenance_contractor", timestamp: now, after: JSON.stringify({ noteType: note.noteType, title: note.title }) }, ...s.auditLogs].slice(0, 500) }));
        return note;
      },
      updateMaintenanceContractorNote: (noteId, input, expectedVersion) => {
        const current = store.maintenanceContractorNotes.find((item) => item.id === noteId);
        if (!current) throw new Error("Contractor note not found.");
        if (expectedVersion !== undefined && (current.version || 1) !== expectedVersion) throw new Error("This Contractor note was updated by another user. Refresh before saving.");
        requireContractorCapability("maintenance.contractors.notes.edit", current.homeId || activeFacilityId);
        if (current.homeId) ensureContractorHomeScope(current.homeId);
        if (!current.active || current.removedAt) throw new Error("Removed notes cannot be edited.");
        if (input.visibility === "RESTRICTED_INTERNAL") requireContractorCapability("maintenance.contractors.notes.restricted.view", current.homeId || activeFacilityId);
        if (input.homeId && input.homeId !== current.homeId) ensureContractorHomeScope(input.homeId);
        if (input.body?.toLowerCase().includes("resident:")) throw new Error("Contractor notes must not contain resident-specific care information.");
        if (input.title !== undefined && !input.title.trim()) throw new Error("Enter a note title.");
        if (input.body !== undefined && !input.body.trim()) throw new Error("Enter a note body.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, maintenanceContractorNotes: s.maintenanceContractorNotes.map((item) => item.id === noteId ? { ...item, ...input, title: input.title?.trim() ?? item.title, body: input.body?.trim() ?? item.body, updatedBy: currentUserName, updatedAt: now, version: (item.version || 1) + 1 } : item), auditLogs: [{ id: uid(), facilityId: current.homeId || activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor note updated", entity: current.contractorId, entityType: "maintenance_contractor", timestamp: now, after: JSON.stringify({ noteId }) }, ...s.auditLogs].slice(0, 500) }));
      },
      pinMaintenanceContractorNote: (noteId, pinned) => {
        const current = store.maintenanceContractorNotes.find((item) => item.id === noteId);
        requireContractorCapability("maintenance.contractors.notes.pin", current?.homeId || activeFacilityId);
        if (current?.homeId) ensureContractorHomeScope(current.homeId);
        if (current && (!current.active || current.removedAt)) throw new Error("Removed notes cannot be pinned.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, maintenanceContractorNotes: s.maintenanceContractorNotes.map((item) => item.id === noteId ? { ...item, pinned, updatedBy: currentUserName, updatedAt: now, version: (item.version || 1) + 1 } : item) }));
      },
      removeMaintenanceContractorNote: (noteId, reason) => {
        const current = store.maintenanceContractorNotes.find((item) => item.id === noteId);
        if (!current) throw new Error("Contractor note not found.");
        requireContractorCapability("maintenance.contractors.notes.remove", current?.homeId || activeFacilityId);
        if (current?.homeId) ensureContractorHomeScope(current.homeId);
        if (!reason.trim()) throw new Error("Enter a removal reason.");
        const now = new Date().toISOString();
        setStore((s) => {
          const note = s.maintenanceContractorNotes.find((item) => item.id === noteId);
          const contractor = note ? s.maintenanceContractors.find((item) => item.id === note.contractorId) : undefined;
          return { ...s, maintenanceContractorNotes: s.maintenanceContractorNotes.map((item) => item.id === noteId ? { ...item, active: false, removedBy: currentUserName, removedAt: now, removalReason: reason, updatedBy: currentUserName, updatedAt: now } : item), maintenanceContractorTimelineEvents: contractor ? [maintenanceContractorTimelineEvent(contractor, "CONTRACTOR_NOTE_REMOVED", "Contractor note removed.", reason, currentUserName, now, note?.homeId), ...s.maintenanceContractorTimelineEvents] : s.maintenanceContractorTimelineEvents, auditLogs: note ? [{ id: uid(), facilityId: note.homeId || activeFacilityId, user: currentUserName, role: currentRole, action: "Contractor note removed", entity: note.contractorId, entityType: "maintenance_contractor", timestamp: now, reason }, ...s.auditLogs].slice(0, 500) : s.auditLogs };
        });
      },
      restoreMaintenanceContractorNote: (noteId) => {
        const current = store.maintenanceContractorNotes.find((item) => item.id === noteId);
        if (!current) throw new Error("Contractor note not found.");
        requireContractorCapability("maintenance.contractors.notes.remove", current?.homeId || activeFacilityId);
        if (current?.homeId) ensureContractorHomeScope(current.homeId);
        setStore((s) => ({ ...s, maintenanceContractorNotes: s.maintenanceContractorNotes.map((item) => item.id === noteId ? { ...item, active: true, removedAt: undefined, removedBy: undefined, removalReason: undefined, updatedBy: currentUserName, updatedAt: new Date().toISOString(), version: (item.version || 1) + 1 } : item) }));
      },
      createHousekeepingTemplate: (input) => {
        const validation = validateHousekeepingTemplate(input);
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the housekeeping template.");
        const now = new Date().toISOString();
        const template: HousekeepingTemplate = { id: `hk-template-${uid()}`, tenantId: "tenant-oritas-demo", homeId: input.homeId || activeFacilityId, facilityId: input.homeId || activeFacilityId, name: input.name.trim(), code: input.code.trim(), description: input.description, cleaningType: input.cleaningType, applicableLocationTypes: input.applicableLocationTypes || [], applicableRoomTypes: input.applicableRoomTypes || [], estimatedDurationMinutes: Number(input.estimatedDurationMinutes || 30), defaultFrequencyType: input.defaultFrequencyType || "daily", defaultFrequencyInterval: Number(input.defaultFrequencyInterval || 1), preferredTime: input.preferredTime, defaultPriority: input.defaultPriority || "MEDIUM", photoEvidenceRequired: Boolean(input.photoEvidenceRequired), minimumPhotoCount: Number(input.minimumPhotoCount || (input.photoEvidenceRequired ? 1 : 0)), qualityInspectionRequired: Boolean(input.qualityInspectionRequired), roomReadinessRequired: Boolean(input.roomReadinessRequired), verificationRequired: Boolean(input.verificationRequired), supervisorSignOffRequired: Boolean(input.supervisorSignOffRequired), instructions: input.instructions, safetyPrecautions: input.safetyPrecautions, active: input.active ?? input.status === "ACTIVE", status: input.status || "DRAFT", version: 1, effectiveFrom: input.effectiveFrom || now.slice(0, 10), effectiveTo: input.effectiveTo, createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now };
        const sections = (input.sections?.length ? input.sections : [{ name: "Preparation" }, { name: "Cleaning" }, { name: "Final Check" }]).map((section, index) => ({ id: `hk-section-${uid()}`, templateId: template.id, name: section.name || `Section ${index + 1}`, description: section.description, displayOrder: index + 1, active: section.active ?? true } satisfies HousekeepingTemplateSection));
        const items = (input.items?.length ? input.items : [{ label: "Area accessible and safe" }, { label: "Cleaning completed" }, { label: "Area left ready for use" }]).map((item, index) => ({ id: `hk-item-${uid()}`, templateId: template.id, sectionId: item.sectionId || sections[0].id, code: item.code || `ITEM_${index + 1}`, label: item.label || "Checklist item", description: item.description, responseType: item.responseType || "PASS_FAIL_NA", mandatory: item.mandatory ?? true, allowNotApplicable: item.allowNotApplicable ?? true, notApplicableReasonRequired: item.notApplicableReasonRequired ?? false, failureRequiresObservation: item.failureRequiresObservation ?? true, failureRequiresPhoto: item.failureRequiresPhoto ?? false, failureRequiresException: item.failureRequiresException ?? false, failureSeverity: item.failureSeverity || "MEDIUM", displayOrder: index + 1, helpText: item.helpText, active: item.active ?? true } satisfies HousekeepingTemplateItem));
        setStore((s) => ({ ...s, housekeepingTemplates: [template, ...s.housekeepingTemplates], housekeepingTemplateSections: [...sections, ...s.housekeepingTemplateSections], housekeepingTemplateItems: [...items, ...s.housekeepingTemplateItems] }));
        return template;
      },
      updateHousekeepingTemplate: (id, input) => {
        const current = store.housekeepingTemplates.find((item) => item.id === id);
        if (!current) throw new Error("Housekeeping template not found.");
        if (current.status === "ARCHIVED") throw new Error("Archived templates cannot be edited.");
        const validation = validateHousekeepingTemplate({ ...current, ...input });
        if (!validation.valid) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the housekeeping template.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, housekeepingTemplates: s.housekeepingTemplates.map((item) => item.id === id ? { ...item, ...input, version: s.housekeepingTasks.some((task) => task.templateId === id) ? item.version + 1 : item.version, updatedBy: currentUserName, updatedAt: now } : item) }));
      },
      duplicateHousekeepingTemplate: (id) => {
        const source = store.housekeepingTemplates.find((item) => item.id === id);
        if (!source) return undefined;
        return api.createHousekeepingTemplate({ ...source, name: `${source.name} Copy`, code: `${source.code}-COPY`, active: false, status: "DRAFT", sections: store.housekeepingTemplateSections.filter((item) => item.templateId === id), items: store.housekeepingTemplateItems.filter((item) => item.templateId === id) });
      },
      activateHousekeepingTemplate: (id) => api.updateHousekeepingTemplate(id, { active: true, status: "ACTIVE" }),
      deactivateHousekeepingTemplate: (id) => api.updateHousekeepingTemplate(id, { active: false, status: "INACTIVE" }),
      archiveHousekeepingTemplate: (id, reason) => {
        if (!reason.trim()) throw new Error("Enter an archive reason.");
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, housekeepingTemplates: s.housekeepingTemplates.map((item) => item.id === id ? { ...item, active: false, status: "ARCHIVED", archivedBy: currentUserName, archivedAt: now, updatedBy: currentUserName, updatedAt: now } : item) }));
      },
      createHousekeepingSchedule: (input) => {
        const template = store.housekeepingTemplates.find((item) => item.id === input.templateId);
        const candidate = { ...input, homeId: input.homeId || activeFacilityId, cleaningType: input.cleaningType || template?.cleaningType };
        const validation = validateHousekeepingSchedule(candidate, { templates: store.housekeepingTemplates, assets: store.maintenanceAssets });
        if (!validation.valid || !template) throw new Error(Object.values(validation.fieldErrors)[0] || "Check the cleaning schedule.");
        const now = new Date().toISOString();
        const schedule: HousekeepingSchedule = { id: `hk-schedule-${uid()}`, tenantId: "tenant-oritas-demo", homeId: candidate.homeId!, facilityId: candidate.homeId!, templateId: template.id, locationId: input.locationId, locationLabel: input.locationLabel, roomId: input.roomId, scheduleName: input.scheduleName || template.name, cleaningType: template.cleaningType, frequencyType: input.frequencyType || template.defaultFrequencyType, frequencyInterval: Number(input.frequencyInterval || template.defaultFrequencyInterval || 1), startDate: input.startDate || now.slice(0, 10), endDate: input.endDate, nextDueDate: input.nextDueDate || input.startDate || now.slice(0, 10), preferredTime: input.preferredTime || template.preferredTime, assignedTeamId: input.assignedTeamId || "housekeeping", defaultAssignedUserId: input.defaultAssignedUserId, priority: input.priority || template.defaultPriority, generateDaysBeforeDue: Number(input.generateDaysBeforeDue || 1), dueSoonHours: Number(input.dueSoonHours || 4), active: input.active ?? true, paused: false, createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now };
        setStore((s) => ({ ...s, housekeepingSchedules: [schedule, ...s.housekeepingSchedules] }));
        return schedule;
      },
      updateHousekeepingSchedule: (id, input) => setStore((s) => ({ ...s, housekeepingSchedules: s.housekeepingSchedules.map((item) => item.id === id ? { ...item, ...input, updatedBy: currentUserName, updatedAt: new Date().toISOString() } : item) })),
      pauseHousekeepingSchedule: (id, reason) => { if (!reason.trim()) throw new Error("Enter a pause reason."); setStore((s) => ({ ...s, housekeepingSchedules: s.housekeepingSchedules.map((item) => item.id === id ? { ...item, paused: true, pausedBy: currentUserName, pausedAt: new Date().toISOString(), pauseReason: reason } : item) })); },
      resumeHousekeepingSchedule: (id) => setStore((s) => ({ ...s, housekeepingSchedules: s.housekeepingSchedules.map((item) => item.id === id ? { ...item, paused: false, pausedBy: undefined, pausedAt: undefined, pauseReason: undefined } : item) })),
      archiveHousekeepingSchedule: (id, reason) => { if (!reason.trim()) throw new Error("Enter an archive reason."); setStore((s) => ({ ...s, housekeepingSchedules: s.housekeepingSchedules.map((item) => item.id === id ? { ...item, active: false, archivedBy: currentUserName, archivedAt: new Date().toISOString() } : item) })); },
      generateHousekeepingTask: (scheduleId) => {
        const schedule = store.housekeepingSchedules.find((item) => item.id === scheduleId);
        if (!schedule) throw new Error("Cleaning schedule not found.");
        if (!schedule.active || schedule.paused || schedule.archivedAt) throw new Error("Paused, archived or inactive schedules cannot generate tasks.");
        if (store.housekeepingTasks.some((item) => item.scheduleId === schedule.id && item.plannedDate === schedule.nextDueDate)) throw new Error("This cleaning task has already been generated.");
        return api.createAdHocHousekeepingTask({ homeId: schedule.homeId, scheduleId: schedule.id, templateId: schedule.templateId, title: schedule.scheduleName, dueDate: schedule.nextDueDate, dueTime: schedule.preferredTime, locationId: schedule.locationId, locationLabel: schedule.locationLabel, roomId: schedule.roomId, assignedTeamId: schedule.assignedTeamId, assignedUserId: schedule.defaultAssignedUserId });
      },
      createAdHocHousekeepingTask: (input) => {
        const template = store.housekeepingTemplates.find((item) => item.id === input.templateId && item.active && item.status === "ACTIVE");
        if (!template) throw new Error("Select an active cleaning template.");
        const now = new Date().toISOString();
        const task: HousekeepingTask = { id: `hk-task-${uid()}`, tenantId: "tenant-oritas-demo", homeId: input.homeId || activeFacilityId, facilityId: input.homeId || activeFacilityId, scheduleId: input.scheduleId, templateId: template.id, templateVersion: template.version, locationId: input.locationId, locationLabel: input.locationLabel, roomId: input.roomId, taskNumber: `HK-${new Date().getFullYear()}-${String(store.housekeepingTasks.length + 1).padStart(4, "0")}`, cleaningType: input.cleaningType || template.cleaningType, title: input.title.trim(), description: input.description || template.description, plannedDate: input.plannedDate || input.dueDate, dueDate: input.dueDate, dueTime: input.dueTime, priority: input.priority || template.defaultPriority, status: input.assignedUserId ? "ASSIGNED" : "UNASSIGNED", assignedTeamId: input.assignedTeamId || "housekeeping", assignedUserId: input.assignedUserId, qualityInspectionRequired: template.qualityInspectionRequired, roomReadinessRequired: template.roomReadinessRequired, photoEvidenceRequired: template.photoEvidenceRequired, minimumPhotoCount: template.minimumPhotoCount, verificationRequired: template.verificationRequired, overallResult: "NOT_COMPLETED", cleanerDeclarationAccepted: false, version: 1, createdBy: currentUserName, createdAt: now, updatedBy: currentUserName, updatedAt: now };
        const responses = createHousekeepingResponsesFromTemplate(task.id, store.housekeepingTemplateSections.filter((item) => item.templateId === template.id), store.housekeepingTemplateItems.filter((item) => item.templateId === template.id), currentUserName, now);
        setStore((s) => ({ ...s, housekeepingTasks: [task, ...s.housekeepingTasks], housekeepingTaskResponses: [...responses, ...s.housekeepingTaskResponses], housekeepingSchedules: input.scheduleId ? s.housekeepingSchedules.map((item) => item.id === input.scheduleId ? { ...item, nextDueDate: nextHousekeepingDueDate(item.nextDueDate, item.frequencyType, item.frequencyInterval) } : item) : s.housekeepingSchedules }));
        return task;
      },
      assignHousekeepingTask: (id, input) => setStore((s) => ({ ...s, housekeepingTasks: s.housekeepingTasks.map((item) => item.id === id ? { ...item, assignedUserId: input.assignedUserId, assignedTeamId: input.assignedTeamId || item.assignedTeamId, status: input.assignedUserId ? "ASSIGNED" : "UNASSIGNED", updatedBy: currentUserName, updatedAt: new Date().toISOString(), version: item.version + 1 } : item) })),
      startHousekeepingTask: (id) => setStore((s) => ({ ...s, housekeepingTasks: s.housekeepingTasks.map((item) => item.id === id ? { ...item, status: "IN_PROGRESS", startedBy: item.startedBy || currentUserName, startedAt: item.startedAt || new Date().toISOString(), updatedBy: currentUserName, updatedAt: new Date().toISOString(), version: item.version + 1 } : item) })),
      pauseHousekeepingTask: (id) => setStore((s) => ({ ...s, housekeepingTasks: s.housekeepingTasks.map((item) => item.id === id && item.status === "IN_PROGRESS" ? { ...item, status: "PAUSED", pausedBy: currentUserName, pausedAt: new Date().toISOString(), updatedBy: currentUserName, version: item.version + 1 } : item) })),
      resumeHousekeepingTask: (id) => api.startHousekeepingTask(id),
      updateHousekeepingTaskResponse: (responseId, input) => setStore((s) => ({ ...s, housekeepingTaskResponses: s.housekeepingTaskResponses.map((item) => item.id === responseId ? { ...item, ...input, result: input.result || (input.responseValue === undefined ? item.result : responseResultFromHousekeepingValue(input.responseValue)), answeredBy: currentUserName, answeredAt: new Date().toISOString() } : item) })),
      addHousekeepingEvidence: (input) => { const evidence: HousekeepingEvidence = { id: `hk-evidence-${uid()}`, taskId: input.taskId, responseId: input.responseId, inspectionId: input.inspectionId, exceptionId: input.exceptionId, evidenceType: input.evidenceType, fileReference: input.fileReference || `housekeeping/${input.fileName}`, fileName: input.fileName, caption: input.caption, uploadedBy: currentUserName, uploadedAt: new Date().toISOString(), active: true }; setStore((s) => ({ ...s, housekeepingEvidence: [evidence, ...s.housekeepingEvidence] })); return evidence; },
      deleteHousekeepingEvidence: (id, reason) => { if (!reason.trim()) throw new Error("Enter a delete reason."); setStore((s) => ({ ...s, housekeepingEvidence: s.housekeepingEvidence.map((item) => item.id === id ? { ...item, active: false, deletedAt: new Date().toISOString(), deletedBy: currentUserName } : item) })); },
      completeHousekeepingTask: (id, input) => {
        const task = store.housekeepingTasks.find((item) => item.id === id); if (!task) throw new Error("Housekeeping task not found.");
        const evaluation = evaluateHousekeepingTask({ task: { ...task, ...input }, responses: store.housekeepingTaskResponses.filter((item) => item.taskId === id), evidence: store.housekeepingEvidence.filter((item) => item.taskId === id), exceptions: store.housekeepingExceptions.filter((item) => item.taskId === id) });
        if (!evaluation.canComplete) throw new Error(evaluation.blockers[0] || "Task cannot be completed.");
        const now = new Date().toISOString();
        const next = { ...task, status: evaluation.nextStatus, overallResult: evaluation.overallResult, completionNotes: input.completionNotes, cleanerDeclarationAccepted: true, completedBy: evaluation.nextStatus === "COMPLETED" ? currentUserName : undefined, completedAt: evaluation.nextStatus === "COMPLETED" ? now : undefined, failedBy: evaluation.nextStatus === "FAILED" ? currentUserName : undefined, failedAt: evaluation.nextStatus === "FAILED" ? now : undefined, updatedBy: currentUserName, updatedAt: now, version: task.version + 1 };
        setStore((s) => ({ ...s, housekeepingTasks: s.housekeepingTasks.map((item) => item.id === id ? next : item) }));
        return next;
      },
      failHousekeepingTask: (id, reason) => { if (!reason.trim()) throw new Error("Enter a failure reason."); const now = new Date().toISOString(); const task = store.housekeepingTasks.find((item) => item.id === id); if (!task) throw new Error("Task not found."); const next = { ...task, status: "FAILED" as const, overallResult: "FAIL" as const, failedBy: currentUserName, failedAt: now, completionNotes: reason, updatedBy: currentUserName, updatedAt: now, version: task.version + 1 }; setStore((s) => ({ ...s, housekeepingTasks: s.housekeepingTasks.map((item) => item.id === id ? next : item) })); return next; },
      cancelHousekeepingTask: (id, reason) => { if (!reason.trim()) throw new Error("Enter a cancellation reason."); setStore((s) => ({ ...s, housekeepingTasks: s.housekeepingTasks.map((item) => item.id === id ? { ...item, status: "CANCELLED", completionNotes: reason, updatedBy: currentUserName, updatedAt: new Date().toISOString(), version: item.version + 1 } : item) })); },
      skipHousekeepingTask: (id, reason) => { if (!reason.trim()) throw new Error("Enter a skip reason."); setStore((s) => ({ ...s, housekeepingTasks: s.housekeepingTasks.map((item) => item.id === id ? { ...item, status: "SKIPPED", completionNotes: reason, updatedBy: currentUserName, updatedAt: new Date().toISOString(), version: item.version + 1 } : item) })); },
      createHousekeepingException: (input) => { const task = store.housekeepingTasks.find((item) => item.id === input.taskId); if (!task) throw new Error("Housekeeping task not found."); const now = new Date().toISOString(); const exception: HousekeepingException = { id: `hk-exception-${uid()}`, tenantId: "tenant-oritas-demo", homeId: task.homeId, facilityId: task.homeId, taskId: task.id, locationId: input.locationId || task.locationId, locationLabel: input.locationLabel || task.locationLabel, roomId: input.roomId || task.roomId, exceptionType: input.exceptionType, category: input.category, description: input.description, severity: input.severity, status: input.status || "OPEN", immediateActionTaken: input.immediateActionTaken, requiresSupervisorReview: input.requiresSupervisorReview ?? ["HIGH", "CRITICAL"].includes(input.severity), requiresMaintenanceWorkOrder: Boolean(input.requiresMaintenanceWorkOrder), maintenanceWorkOrderId: input.maintenanceWorkOrderId, requiresReinspection: Boolean(input.requiresReinspection), reportedBy: currentUserName, reportedAt: now, createdAt: now, updatedAt: now }; setStore((s) => ({ ...s, housekeepingExceptions: [exception, ...s.housekeepingExceptions] })); return exception; },
      updateHousekeepingException: (id, input) => setStore((s) => ({ ...s, housekeepingExceptions: s.housekeepingExceptions.map((item) => item.id === id ? { ...item, ...input, updatedAt: new Date().toISOString() } : item) })),
      resolveHousekeepingException: (id, notes) => setStore((s) => ({ ...s, housekeepingExceptions: s.housekeepingExceptions.map((item) => item.id === id ? { ...item, status: "RESOLVED", resolvedBy: currentUserName, resolvedAt: new Date().toISOString(), resolutionNotes: notes, updatedAt: new Date().toISOString() } : item) })),
      closeHousekeepingException: (id, notes) => setStore((s) => ({ ...s, housekeepingExceptions: s.housekeepingExceptions.map((item) => item.id === id ? { ...item, status: "CLOSED", resolutionNotes: notes || item.resolutionNotes, updatedAt: new Date().toISOString() } : item) })),
      createHousekeepingExceptionWorkOrder: (id) => { const exception = store.housekeepingExceptions.find((item) => item.id === id); if (!exception) throw new Error("Housekeeping exception not found."); if (exception.maintenanceWorkOrderId) { const existing = store.maintenanceWorkOrders.find((item) => item.id === exception.maintenanceWorkOrderId); if (existing) return existing; } const workOrder = api.addMaintenanceWorkOrder({ homeId: exception.homeId, title: `Housekeeping exception - ${exception.category}`, description: exception.description, type: "REACTIVE", source: "HOUSEKEEPING_REQUEST", category: exception.exceptionType === "MAINTENANCE" ? "GENERAL_MAINTENANCE" : "CLEANING_HOUSEKEEPING_SUPPORT", priority: exception.severity === "CRITICAL" ? "CRITICAL" : exception.severity === "HIGH" ? "HIGH" : "MEDIUM", exactLocation: exception.locationLabel, roomId: exception.roomId, complianceImpact: exception.severity === "CRITICAL", immediateRisk: exception.severity === "CRITICAL", immediateControlSummary: exception.immediateActionTaken, verificationRequired: true }); api.updateHousekeepingException(id, { maintenanceWorkOrderId: workOrder.id, requiresMaintenanceWorkOrder: true }); return workOrder; },
      createHousekeepingQualityInspection: (taskId, input = {}) => { const task = store.housekeepingTasks.find((item) => item.id === taskId); if (!task) throw new Error("Housekeeping task not found."); const now = new Date().toISOString(); const inspection: QualityInspection = { id: `hk-quality-${uid()}`, tenantId: "tenant-oritas-demo", homeId: task.homeId, facilityId: task.homeId, taskId, locationId: task.locationId, locationLabel: task.locationLabel, roomId: task.roomId, status: "PENDING", failedItemCount: 0, photoEvidenceRequired: task.photoEvidenceRequired, reinspectionRequired: false, createdAt: now, updatedAt: now, version: 1, ...input }; setStore((s) => ({ ...s, housekeepingQualityInspections: [inspection, ...s.housekeepingQualityInspections] })); return inspection; },
      startHousekeepingQualityInspection: (id) => setStore((s) => ({ ...s, housekeepingQualityInspections: s.housekeepingQualityInspections.map((item) => item.id === id ? { ...item, status: "IN_PROGRESS", inspectorId: currentUser.id, updatedAt: new Date().toISOString(), version: item.version + 1 } : item) })),
      completeHousekeepingQualityInspection: (id, input) => { const inspection = store.housekeepingQualityInspections.find((item) => item.id === id); if (!inspection) throw new Error("Quality inspection not found."); const now = new Date().toISOString(); const next: QualityInspection = { ...inspection, result: input.result, score: input.score, inspectionNotes: input.notes, status: input.result === "FAIL" ? "FAILED" : "PASSED", failedItemCount: input.result === "FAIL" ? Math.max(1, inspection.failedItemCount) : 0, reinspectionRequired: input.result === "FAIL", inspectedAt: now, inspectorId: inspection.inspectorId || currentUser.id, updatedAt: now, version: inspection.version + 1 }; setStore((s) => ({ ...s, housekeepingQualityInspections: s.housekeepingQualityInspections.map((item) => item.id === id ? next : item) })); return next; },
      createHousekeepingAudit: (input) => { const now = new Date().toISOString(); const audit: CleaningAudit = { id: `hk-audit-${uid()}`, tenantId: "tenant-oritas-demo", homeId: input.homeId || activeFacilityId, facilityId: input.homeId || activeFacilityId, auditNumber: `HKA-${new Date().getFullYear()}-${String(store.housekeepingCleaningAudits.length + 1).padStart(4, "0")}`, auditType: input.auditType, locationId: input.locationId, locationLabel: input.locationLabel, roomId: input.roomId, taskId: input.taskId, templateId: input.templateId, auditDate: input.auditDate, auditorId: input.auditorId || currentUser.id, status: input.status || "DRAFT", correctiveActionRequired: Boolean(input.correctiveActionRequired), reinspectionRequired: Boolean(input.reinspectionRequired), createdAt: now, updatedAt: now }; setStore((s) => ({ ...s, housekeepingCleaningAudits: [audit, ...s.housekeepingCleaningAudits] })); return audit; },
      completeHousekeepingAudit: (id, input) => setStore((s) => ({ ...s, housekeepingCleaningAudits: s.housekeepingCleaningAudits.map((item) => item.id === id ? { ...item, status: input.result === "FAIL" ? "FAILED" : "COMPLETED", result: input.result, score: input.score, observations: input.observations, correctiveActionRequired: input.result === "FAIL", reinspectionRequired: input.result === "FAIL", completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : item) })),
      createHousekeepingReinspection: (input) => { const task = store.housekeepingTasks.find((item) => item.id === input.originalTaskId); if (!task) throw new Error("Original housekeeping task not found."); const now = new Date().toISOString(); const reinspection: HousekeepingReinspection = { id: `hk-reinspection-${uid()}`, tenantId: "tenant-oritas-demo", homeId: task.homeId, facilityId: task.homeId, originalTaskId: task.id, originalInspectionId: input.originalInspectionId, failedTaskId: input.failedTaskId || task.id, assignedUserId: input.assignedUserId, assignedTeamId: input.assignedTeamId || "housekeeping-supervisor", reason: input.reason, status: input.status || "PENDING", scheduledDate: input.scheduledDate || input.dueDate, dueDate: input.dueDate, notes: input.notes, createdBy: currentUserName, createdAt: now, updatedAt: now }; setStore((s) => ({ ...s, housekeepingReinspections: [reinspection, ...s.housekeepingReinspections] })); return reinspection; },
      completeHousekeepingReinspection: (id, result, notes) => setStore((s) => ({ ...s, housekeepingReinspections: s.housekeepingReinspections.map((item) => item.id === id ? { ...item, status: result === "PASS" ? "PASSED" : "FAILED", result, notes, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : item) })),
      markRoomReady: (roomId, reason) => { if (!reason.trim()) throw new Error("Enter a reason."); if (store.housekeepingExceptions.some((item) => item.roomId === roomId && ["OPEN", "IN_REVIEW", "ACTION_REQUIRED"].includes(item.status))) throw new Error("Room has open blockers and cannot be marked ready."); const now = new Date().toISOString(); const current = store.housekeepingRoomReadiness.find((item) => item.roomId === roomId); setStore((s) => ({ ...s, housekeepingRoomReadiness: s.housekeepingRoomReadiness.map((item) => item.roomId === roomId ? { ...item, readinessStatus: "READY", cleaningRequired: false, cleaningCompleted: true, qualityInspectionPassed: true, linenReady: true, wasteCleared: true, suppliesReady: true, markedReadyBy: currentUserName, markedReadyAt: now, readinessNotes: reason, lastUpdatedBy: currentUserName, lastUpdatedAt: now } : item), housekeepingRoomStatusHistory: [{ id: `hk-room-history-${uid()}`, tenantId: "tenant-oritas-demo", homeId: activeFacilityId, facilityId: activeFacilityId, roomId, previousStatus: current?.readinessStatus, newStatus: "READY", reason, sourceType: "MANUAL", changedBy: currentUserName, changedAt: now }, ...s.housekeepingRoomStatusHistory] })); },
      markRoomUnavailable: (roomId, reason) => { if (!reason.trim()) throw new Error("Enter a reason."); const now = new Date().toISOString(); const current = store.housekeepingRoomReadiness.find((item) => item.roomId === roomId); setStore((s) => ({ ...s, housekeepingRoomReadiness: s.housekeepingRoomReadiness.map((item) => item.roomId === roomId ? { ...item, readinessStatus: "UNAVAILABLE", readinessNotes: reason, lastUpdatedBy: currentUserName, lastUpdatedAt: now } : item), housekeepingRoomStatusHistory: [{ id: `hk-room-history-${uid()}`, tenantId: "tenant-oritas-demo", homeId: activeFacilityId, facilityId: activeFacilityId, roomId, previousStatus: current?.readinessStatus, newStatus: "UNAVAILABLE", reason, sourceType: "MANUAL", changedBy: currentUserName, changedAt: now }, ...s.housekeepingRoomStatusHistory] })); },
      addMaintenanceWorkOrder: (input) => {
        if (!canAccess(scopedStore, createStaffAccessContext(currentUser, activeFacilityId), "maintenance.work_orders.create", { nursingHomeId: input.homeId })) {
          throw new Error("You do not have permission to create Work Orders for this Care Home.");
        }
        if (!userFacilityIds(currentUser).includes(input.homeId) && currentRole !== "group_owner") {
          throw new Error("You do not have access to the selected Care Home.");
        }
        if ((input.assignedUserId || input.assignedTeamId) && !canAccess(scopedStore, createStaffAccessContext(currentUser, activeFacilityId), "maintenance.work_orders.assign", { nursingHomeId: input.homeId })) {
          throw new Error("You do not have permission to assign Work Orders during creation.");
        }
        if (input.assetId) {
          const asset = store.maintenanceAssets.find((item) => item.id === input.assetId);
          if (asset && !canReceiveWorkOrder(asset)) throw new Error("Retired, disposed, lost or archived assets cannot receive new Work Orders.");
        }
        const homeUsers = store.users.filter((user) => user.facilityIds?.includes(input.homeId) || user.facilityId === input.homeId);
        const validation = validateWorkOrderInput(input, { ...store, users: homeUsers });
        if (!validation.valid) {
          throw new Error(Object.values(validation.fieldErrors)[0] || "Check the Work Order details.");
        }
        const now = new Date().toISOString();
        const item = createWorkOrderRecord({
          input,
          records: store.maintenanceWorkOrders || [],
          currentUser,
          now,
        });
        setStore((s) => ({
          ...s,
          maintenanceWorkOrders: [item, ...(s.maintenanceWorkOrders || [])],
          auditLogs: [
            workOrderAuditLog({
              id: uid(),
              action: "Work Order created",
              record: item,
              user: currentUser,
              after: { workOrderNumber: item.workOrderNumber, title: item.title, priority: item.priority },
              timestamp: now,
            }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
        return item;
      },
      updateMaintenanceWorkOrder: (id, input) => {
        if (!canAccess(scopedStore, createStaffAccessContext(currentUser, activeFacilityId), "maintenance.work_orders.edit", { nursingHomeId: activeFacilityId })) {
          throw new Error("You do not have permission to edit Work Orders.");
        }
        const current = store.maintenanceWorkOrders.find((record) => record.id === id);
        if (!current) throw new Error("Work Order not found.");
        if (!canAccess(scopedStore, createStaffAccessContext(currentUser, activeFacilityId), "maintenance.work_orders.edit", { nursingHomeId: current.homeId })) {
          throw new Error("You do not have permission to edit Work Orders for this Care Home.");
        }
        const homeUsers = store.users.filter((user) => user.facilityIds?.includes(current.homeId) || user.facilityId === current.homeId);
        const validation = validateWorkOrderInput({ ...input, homeId: current.homeId }, { ...store, users: homeUsers });
        if (!validation.valid) {
          throw new Error(Object.values(validation.fieldErrors)[0] || "Check the Work Order details.");
        }
        if (input.priority && current.priority && PRIORITY_RANK[input.priority] > PRIORITY_RANK[current.priority] && !input.changeReason?.trim()) {
          throw new Error("Enter a reason when reducing Work Order priority.");
        }
        const now = new Date().toISOString();
        const next = updateWorkOrderRecord(current, input, currentUser, now);
        setStore((s) => ({
          ...s,
          maintenanceWorkOrders: (s.maintenanceWorkOrders || []).map((record) => (record.id === id ? next : record)),
          auditLogs: [
            workOrderAuditLog({
              id: uid(),
              action: "Work Order updated",
              record: next,
              user: currentUser,
              before: input,
              after: { version: next.version, updatedAt: next.updatedAt },
              reason: input.changeReason,
              timestamp: now,
            }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
      },
      workflowMaintenanceWorkOrder: (id, input) => {
        const current = store.maintenanceWorkOrders.find((record) => record.id === id);
        if (!current) throw new Error("Work Order not found.");
        const now = new Date().toISOString();
        const result = applyWorkOrderWorkflow(current, input, {
          currentUser,
          users: store.users,
          canAccess: (capability, resource) =>
            canAccess(
              scopedStore,
              createStaffAccessContext(currentUser, activeFacilityId, resource?.wardId),
              capability,
              resource || { nursingHomeId: current.homeId },
            ),
          now,
        });
        if (!result) return current;
        setStore((s) => ({
          ...s,
          maintenanceWorkOrders: (s.maintenanceWorkOrders || []).map((record) => (record.id === id ? result.record : record)),
          auditLogs: [
            workOrderAuditLog({
              id: uid(),
              action: result.auditAction,
              record: result.record,
              user: currentUser,
              before: result.before,
              after: result.after,
              reason: result.reason,
              timestamp: now,
            }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
        return result.record;
      },
      archiveMaintenanceWorkOrder: (id, reason) => {
        if (!canAccess(scopedStore, createStaffAccessContext(currentUser, activeFacilityId), "maintenance.work_orders.edit", { nursingHomeId: activeFacilityId })) {
          throw new Error("You do not have permission to archive Work Orders.");
        }
        const current = store.maintenanceWorkOrders.find((record) => record.id === id);
        if (!current) throw new Error("Work Order not found.");
        const now = new Date().toISOString();
        const next = archiveWorkOrderRecord(current, currentUser, reason, now);
        setStore((s) => ({
          ...s,
          maintenanceWorkOrders: (s.maintenanceWorkOrders || []).map((record) => (record.id === id ? next : record)),
          auditLogs: [
            workOrderAuditLog({
              id: uid(),
              action: "Work Order archived",
              record: next,
              user: currentUser,
              before: { archivedAt: current.archivedAt },
              after: { archivedAt: next.archivedAt },
              reason,
              timestamp: now,
            }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
      },
      addWorkOrderNote: (workOrderId, input) => {
        const current = store.maintenanceWorkOrders.find((record) => record.id === workOrderId);
        const now = new Date().toISOString();
        if (input.clientRequestId && store.workOrderNotes.some((note) => note.lastRequestId === input.clientRequestId)) {
          return store.workOrderNotes.find((note) => note.lastRequestId === input.clientRequestId)!;
        }
        const note = createWorkOrderNoteRecord({
          record: current!,
          input,
          context: workOrderExecutionContext(current, now),
          id: `work-order-note-${uid()}`,
        });
        setStore((s) => ({
          ...s,
          workOrderNotes: [note, ...s.workOrderNotes],
          auditLogs: [
            workOrderExecutionAuditLog({ id: uid(), action: "Work note added", record: current!, user: currentUser, entityId: note.id, entityType: "work_order_note", after: { noteType: note.noteType }, timestamp: now }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
        return note;
      },
      editWorkOrderNote: (noteId, input) => {
        const note = store.workOrderNotes.find((item) => item.id === noteId);
        if (!note) throw new Error("Work note not found.");
        const current = store.maintenanceWorkOrders.find((record) => record.id === note.workOrderId);
        const now = new Date().toISOString();
        const next = editWorkOrderNoteRecord(note, input, current!, workOrderExecutionContext(current, now));
        setStore((s) => ({
          ...s,
          workOrderNotes: s.workOrderNotes.map((item) => (item.id === noteId ? next : item)),
          auditLogs: [
            workOrderExecutionAuditLog({ id: uid(), action: "Work note edited", record: current!, user: currentUser, entityId: note.id, entityType: "work_order_note", before: { version: note.version }, after: { version: next.version }, reason: input.reason, timestamp: now }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
      },
      removeWorkOrderNote: (noteId, reason) => {
        const note = store.workOrderNotes.find((item) => item.id === noteId);
        if (!note) throw new Error("Work note not found.");
        const current = store.maintenanceWorkOrders.find((record) => record.id === note.workOrderId);
        const now = new Date().toISOString();
        const context = workOrderExecutionContext(current, now);
        const capability = note.createdByUserId === currentUser.id ? "maintenance.work_orders.execution.add_note" : "maintenance.work_orders.execution.remove_note";
        if (!context.canAccess(capability, { nursingHomeId: current!.homeId })) throw new Error("You do not have permission to remove this note.");
        const next = softDeleteExecutionRecord(note, reason, context);
        setStore((s) => ({
          ...s,
          workOrderNotes: s.workOrderNotes.map((item) => (item.id === noteId ? next : item)),
          auditLogs: [
            workOrderExecutionAuditLog({ id: uid(), action: "Work note removed", record: current!, user: currentUser, entityId: note.id, entityType: "work_order_note", before: { version: note.version }, after: { deletedAt: next.deletedAt }, reason, timestamp: now }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
      },
      addWorkOrderAttachment: (workOrderId, input) => {
        const current = store.maintenanceWorkOrders.find((record) => record.id === workOrderId);
        const now = new Date().toISOString();
        if (input.clientRequestId && store.workOrderAttachments.some((item) => item.lastRequestId === input.clientRequestId)) {
          return store.workOrderAttachments.find((item) => item.lastRequestId === input.clientRequestId)!;
        }
        const attachment = createWorkOrderAttachmentRecord({ record: current!, input, context: workOrderExecutionContext(current, now), id: `work-order-file-${uid()}` });
        setStore((s) => ({
          ...s,
          workOrderAttachments: [attachment, ...s.workOrderAttachments],
          auditLogs: [
            workOrderExecutionAuditLog({ id: uid(), action: attachment.isPhoto ? "Work photo uploaded" : "Work attachment uploaded", record: current!, user: currentUser, entityId: attachment.id, entityType: "work_order_attachment", after: { fileName: attachment.originalFileName, category: attachment.category, isEvidence: attachment.isEvidence, scanStatus: attachment.scanStatus }, timestamp: now }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
        return attachment;
      },
      classifyWorkOrderAttachmentEvidence: (attachmentId, input) => {
        const attachment = store.workOrderAttachments.find((item) => item.id === attachmentId);
        if (!attachment) throw new Error("Attachment not found.");
        const current = store.maintenanceWorkOrders.find((record) => record.id === attachment.workOrderId);
        const now = new Date().toISOString();
        const next = classifyAttachmentEvidence(attachment, input, current!, workOrderExecutionContext(current, now));
        setStore((s) => ({
          ...s,
          workOrderAttachments: s.workOrderAttachments.map((item) => (item.id === attachmentId ? next : item)),
          auditLogs: [
            workOrderExecutionAuditLog({ id: uid(), action: input.isEvidence ? "Attachment marked as evidence" : "Evidence classification removed", record: current!, user: currentUser, entityId: attachment.id, entityType: "work_order_attachment", before: { isEvidence: attachment.isEvidence, evidenceType: attachment.evidenceType }, after: { isEvidence: next.isEvidence, evidenceType: next.evidenceType }, timestamp: now }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
      },
      removeWorkOrderAttachment: (attachmentId, reason) => {
        const attachment = store.workOrderAttachments.find((item) => item.id === attachmentId);
        if (!attachment) throw new Error("Attachment not found.");
        const current = store.maintenanceWorkOrders.find((record) => record.id === attachment.workOrderId);
        const now = new Date().toISOString();
        const context = workOrderExecutionContext(current, now);
        const capability = attachment.isEvidence ? "maintenance.work_orders.execution.classify_evidence" : "maintenance.work_orders.execution.remove_file";
        if (!context.canAccess(capability, { nursingHomeId: current!.homeId })) throw new Error("You do not have permission to remove this attachment.");
        const next = softDeleteExecutionRecord(attachment, reason, context);
        setStore((s) => ({
          ...s,
          workOrderAttachments: s.workOrderAttachments.map((item) => (item.id === attachmentId ? next : item)),
          auditLogs: [
            workOrderExecutionAuditLog({ id: uid(), action: "Work attachment removed", record: current!, user: currentUser, entityId: attachment.id, entityType: "work_order_attachment", before: { fileName: attachment.originalFileName, isEvidence: attachment.isEvidence }, after: { deletedAt: next.deletedAt }, reason, timestamp: now }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
      },
      addWorkOrderLabour: (workOrderId, input) => {
        const current = store.maintenanceWorkOrders.find((record) => record.id === workOrderId);
        const now = new Date().toISOString();
        if (input.clientRequestId && store.workOrderLabourEntries.some((item) => item.lastRequestId === input.clientRequestId)) {
          return store.workOrderLabourEntries.find((item) => item.lastRequestId === input.clientRequestId)!;
        }
        const labour = createWorkOrderLabourRecord({ record: current!, input, context: workOrderExecutionContext(current, now), id: `work-order-labour-${uid()}` });
        setStore((s) => ({
          ...s,
          workOrderLabourEntries: [labour, ...s.workOrderLabourEntries],
          auditLogs: [
            workOrderExecutionAuditLog({ id: uid(), action: "Work Order labour added", record: current!, user: currentUser, entityId: labour.id, entityType: "work_order_labour", after: { worker: labour.workerDisplayName, durationMinutes: labour.durationMinutes }, timestamp: now }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
        return labour;
      },
      removeWorkOrderLabour: (entryId, reason) => {
        const entry = store.workOrderLabourEntries.find((item) => item.id === entryId);
        if (!entry) throw new Error("Labour entry not found.");
        const current = store.maintenanceWorkOrders.find((record) => record.id === entry.workOrderId);
        const now = new Date().toISOString();
        const context = workOrderExecutionContext(current, now);
        if (!context.canAccess("maintenance.work_orders.execution.remove_labour", { nursingHomeId: current!.homeId })) throw new Error("You do not have permission to remove this labour entry.");
        const next = softDeleteExecutionRecord(entry, reason, context);
        setStore((s) => ({
          ...s,
          workOrderLabourEntries: s.workOrderLabourEntries.map((item) => (item.id === entryId ? next : item)),
          auditLogs: [
            workOrderExecutionAuditLog({ id: uid(), action: "Work Order labour removed", record: current!, user: currentUser, entityId: entry.id, entityType: "work_order_labour", before: { durationMinutes: entry.durationMinutes }, after: { deletedAt: next.deletedAt }, reason, timestamp: now }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
      },
      addWorkOrderMaterial: (workOrderId, input) => {
        const current = store.maintenanceWorkOrders.find((record) => record.id === workOrderId);
        const now = new Date().toISOString();
        if (input.clientRequestId && store.workOrderMaterialEntries.some((item) => item.lastRequestId === input.clientRequestId)) {
          return store.workOrderMaterialEntries.find((item) => item.lastRequestId === input.clientRequestId)!;
        }
        const material = createWorkOrderMaterialRecord({ record: current!, input, context: workOrderExecutionContext(current, now), id: `work-order-material-${uid()}` });
        setStore((s) => ({
          ...s,
          workOrderMaterialEntries: [material, ...s.workOrderMaterialEntries],
          auditLogs: [
            workOrderExecutionAuditLog({ id: uid(), action: "Work Order material recorded", record: current!, user: currentUser, entityId: material.id, entityType: "work_order_material", after: { materialName: material.materialName, quantity: material.quantity, unit: material.unit }, timestamp: now }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
        return material;
      },
      removeWorkOrderMaterial: (entryId, reason) => {
        const entry = store.workOrderMaterialEntries.find((item) => item.id === entryId);
        if (!entry) throw new Error("Material entry not found.");
        const current = store.maintenanceWorkOrders.find((record) => record.id === entry.workOrderId);
        const now = new Date().toISOString();
        const context = workOrderExecutionContext(current, now);
        if (!context.canAccess("maintenance.work_orders.execution.remove_material", { nursingHomeId: current!.homeId })) throw new Error("You do not have permission to remove this material entry.");
        const next = softDeleteExecutionRecord(entry, reason, context);
        setStore((s) => ({
          ...s,
          workOrderMaterialEntries: s.workOrderMaterialEntries.map((item) => (item.id === entryId ? next : item)),
          auditLogs: [
            workOrderExecutionAuditLog({ id: uid(), action: "Work Order material removed", record: current!, user: currentUser, entityId: entry.id, entityType: "work_order_material", before: { materialName: entry.materialName, quantity: entry.quantity }, after: { deletedAt: next.deletedAt }, reason, timestamp: now }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
      },
      getWorkOrderTimeline: (workOrderId, limit = 50) => {
        const record = store.maintenanceWorkOrders.find((item) => item.id === workOrderId);
        if (!record) return [];
        return buildWorkOrderTimeline({
          record,
          auditLogs: store.auditLogs,
          notes: store.workOrderNotes.filter((item) => item.workOrderId === workOrderId),
          attachments: store.workOrderAttachments.filter((item) => item.workOrderId === workOrderId),
          labour: store.workOrderLabourEntries.filter((item) => item.workOrderId === workOrderId),
          materials: store.workOrderMaterialEntries.filter((item) => item.workOrderId === workOrderId),
          completions: store.workOrderCompletions.filter((item) => item.workOrderId === workOrderId),
          verifications: store.workOrderVerifications.filter((item) => item.workOrderId === workOrderId),
          users: store.users,
          limit,
        });
      },
      evaluateWorkOrderCompletion: (workOrderId, input) => {
        const record = store.maintenanceWorkOrders.find((item) => item.id === workOrderId);
        return evaluateWorkOrderCompletionEligibility({
          workOrder: record,
          context: workOrderExecutionContext(record),
          related: {
            notes: store.workOrderNotes.filter((item) => item.workOrderId === workOrderId),
            attachments: store.workOrderAttachments.filter((item) => item.workOrderId === workOrderId),
            labour: store.workOrderLabourEntries.filter((item) => item.workOrderId === workOrderId),
            materials: store.workOrderMaterialEntries.filter((item) => item.workOrderId === workOrderId),
          },
          completionRequest: input,
        });
      },
      completeMaintenanceWorkOrder: (workOrderId, input) => {
        const current = store.maintenanceWorkOrders.find((record) => record.id === workOrderId);
        if (!current) throw new Error("Work Order not found.");
        if (input.idempotencyKey) {
          const existing = store.workOrderCompletions.find((item) => item.lastRequestId === input.idempotencyKey);
          if (existing) return existing;
        }
        const now = new Date().toISOString();
        const related = {
          notes: store.workOrderNotes.filter((item) => item.workOrderId === workOrderId),
          attachments: store.workOrderAttachments.filter((item) => item.workOrderId === workOrderId),
          labour: store.workOrderLabourEntries.filter((item) => item.workOrderId === workOrderId),
          materials: store.workOrderMaterialEntries.filter((item) => item.workOrderId === workOrderId),
        };
        const completion = createWorkOrderCompletionRecord({
          workOrder: current,
          input,
          context: workOrderExecutionContext(current, now),
          related,
          id: `work-order-completion-${uid()}`,
        });
        const workflow = applyWorkOrderWorkflow(current, {
          action: "COMPLETE",
          expectedVersion: input.expectedVersion,
          idempotencyKey: input.idempotencyKey,
          reason: completion.workCompleted,
          completionId: completion.id,
          completionOutcome: completion.outcome,
          completionVerificationRequired: completion.verificationRequired,
        }, {
          currentUser,
          users: store.users,
          canAccess: (capability, resource) =>
            canAccess(
              scopedStore,
              createStaffAccessContext(currentUser, activeFacilityId, resource?.wardId),
              capability,
              resource || { nursingHomeId: current.homeId },
            ),
          now,
        });
        if (!workflow) {
          const existing = store.workOrderCompletions.find((item) => item.lastRequestId === input.idempotencyKey);
          if (existing) return existing;
          throw new Error("Duplicate completion request could not be matched.");
        }
        const savedCompletion: WorkOrderCompletionRecord = {
          ...completion,
          resultingStatus: workflow.record.status,
          workOrderVersionAfter: workflow.record.version,
        };
        setStore((s) => ({
          ...s,
          maintenanceWorkOrders: (s.maintenanceWorkOrders || []).map((record) => (record.id === workOrderId ? workflow.record : record)),
          workOrderCompletions: [savedCompletion, ...s.workOrderCompletions],
          auditLogs: [
            workOrderCompletionAuditLog({ id: uid(), record: workflow.record, completion: savedCompletion, user: currentUser, timestamp: now }),
            workOrderAuditLog({
              id: uid(),
              action: savedCompletion.verificationRequired ? "WORK_ORDER_SUBMITTED_FOR_VERIFICATION" : workflow.auditAction,
              record: workflow.record,
              user: currentUser,
              before: workflow.before,
              after: workflow.after,
              reason: workflow.reason,
              timestamp: now,
            }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
        return savedCompletion;
      },
      getPendingWorkOrderCompletion: (workOrderId) =>
        store.workOrderCompletions
          .filter((item) => item.workOrderId === workOrderId && item.verificationRequired && item.verificationStatus === "PENDING")
          .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0],
      evaluateWorkOrderVerification: (workOrderId, input) => {
        const record = store.maintenanceWorkOrders.find((item) => item.id === workOrderId);
        const completion = store.workOrderCompletions
          .filter((item) => item.workOrderId === workOrderId && item.verificationRequired && item.verificationStatus === "PENDING")
          .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
        return evaluateVerificationEligibility({
          workOrder: record,
          completion,
          context: workOrderExecutionContext(record),
          relatedData: { attachments: store.workOrderAttachments.filter((item) => item.workOrderId === workOrderId) },
          verificationRequest: input,
        });
      },
      assignWorkOrderVerification: (workOrderId, input) => {
        const current = store.maintenanceWorkOrders.find((record) => record.id === workOrderId);
        const completion = store.workOrderCompletions.find((item) => item.workOrderId === workOrderId && item.verificationRequired && item.verificationStatus === "PENDING");
        if (!current || !completion) throw new Error("Pending verification not found.");
        if (input.idempotencyKey) {
          const existing = store.workOrderCompletions.find((item) => item.lastRequestId === input.idempotencyKey);
          if (existing) return existing;
        }
        const now = new Date().toISOString();
        const next = assignWorkOrderVerification({ workOrder: current, completion, input, context: workOrderExecutionContext(current, now), id: `verification-assignment-${uid()}` });
        setStore((s) => ({
          ...s,
          workOrderCompletions: s.workOrderCompletions.map((item) => (item.id === completion.id ? next : item)),
          auditLogs: [
            workOrderVerificationAuditLog({ id: uid(), action: "WORK_ORDER_VERIFICATION_ASSIGNED", record: current, completion: next, user: currentUser, previousVerifierUserId: completion.verifierUserId, nextVerifierUserId: next.verifierUserId, timestamp: now, reason: input.reason }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
        return next;
      },
      claimWorkOrderVerification: (workOrderId, input) => {
        const current = store.maintenanceWorkOrders.find((record) => record.id === workOrderId);
        const completion = store.workOrderCompletions.find((item) => item.workOrderId === workOrderId && item.verificationRequired && item.verificationStatus === "PENDING");
        if (!current || !completion) throw new Error("Pending verification not found.");
        if (input.idempotencyKey) {
          const existing = store.workOrderCompletions.find((item) => item.lastRequestId === input.idempotencyKey);
          if (existing) return existing;
        }
        const now = new Date().toISOString();
        const next = claimWorkOrderVerification({ workOrder: current, completion, input, context: workOrderExecutionContext(current, now) });
        setStore((s) => ({
          ...s,
          workOrderCompletions: s.workOrderCompletions.map((item) => (item.id === completion.id ? next : item)),
          auditLogs: [
            workOrderVerificationAuditLog({ id: uid(), action: "WORK_ORDER_VERIFICATION_CLAIMED", record: current, completion: next, user: currentUser, previousVerifierUserId: completion.verifierUserId, nextVerifierUserId: next.verifierUserId, timestamp: now, reason: "Verification claimed" }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
        return next;
      },
      releaseWorkOrderVerification: (workOrderId, input) => {
        const current = store.maintenanceWorkOrders.find((record) => record.id === workOrderId);
        const completion = store.workOrderCompletions.find((item) => item.workOrderId === workOrderId && item.verificationRequired && item.verificationStatus === "PENDING");
        if (!current || !completion) throw new Error("Pending verification not found.");
        if (input.idempotencyKey) {
          const existing = store.workOrderCompletions.find((item) => item.lastRequestId === input.idempotencyKey);
          if (existing) return existing;
        }
        const now = new Date().toISOString();
        const next = releaseWorkOrderVerification({ workOrder: current, completion, input, context: workOrderExecutionContext(current, now) });
        setStore((s) => ({
          ...s,
          workOrderCompletions: s.workOrderCompletions.map((item) => (item.id === completion.id ? next : item)),
          auditLogs: [
            workOrderVerificationAuditLog({ id: uid(), action: "WORK_ORDER_VERIFICATION_RELEASED", record: current, completion: next, user: currentUser, previousVerifierUserId: completion.verifierUserId, timestamp: now, reason: input.reason }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
        return next;
      },
      verifyMaintenanceWorkOrder: (workOrderId, input) => {
        const current = store.maintenanceWorkOrders.find((record) => record.id === workOrderId);
        const completion = store.workOrderCompletions.find((item) => item.workOrderId === workOrderId && item.verificationRequired && item.verificationStatus === "PENDING");
        if (!current || !completion) throw new Error("Pending verification not found.");
        if (input.idempotencyKey) {
          const existing = store.workOrderVerifications.find((item) => item.lastRequestId === input.idempotencyKey);
          if (existing) return existing;
        }
        const now = new Date().toISOString();
        const verification = createWorkOrderVerificationRecord({
          workOrder: current,
          completion,
          input,
          context: workOrderExecutionContext(current, now),
          relatedData: { attachments: store.workOrderAttachments.filter((item) => item.workOrderId === workOrderId) },
          id: `work-order-verification-${uid()}`,
        });
        const workflow = applyWorkOrderWorkflow(current, { action: "VERIFY", expectedVersion: input.expectedWorkOrderVersion, idempotencyKey: input.idempotencyKey, reason: verification.verificationNotes, verificationId: verification.id, verificationResult: verification.result }, workOrderExecutionContext(current, now));
        if (!workflow) {
          const existing = store.workOrderVerifications.find((item) => item.lastRequestId === input.idempotencyKey);
          if (existing) return existing;
          throw new Error("Duplicate verification request could not be matched.");
        }
        const savedVerification = { ...verification, resultingWorkOrderStatus: workflow.record.status, workOrderVersionAfter: workflow.record.version };
        const nextCompletion = applyVerificationResultToCompletion(completion, savedVerification);
        setStore((s) => ({
          ...s,
          maintenanceWorkOrders: s.maintenanceWorkOrders.map((record) => (record.id === workOrderId ? workflow.record : record)),
          workOrderCompletions: s.workOrderCompletions.map((item) => (item.id === completion.id ? nextCompletion : item)),
          workOrderVerifications: [savedVerification, ...s.workOrderVerifications],
          auditLogs: [
            workOrderVerificationAuditLog({ id: uid(), action: "WORK_ORDER_VERIFIED", record: workflow.record, completion: nextCompletion, verification: savedVerification, user: currentUser, timestamp: now, reason: verification.verificationNotes }),
            workOrderAuditLog({ id: uid(), action: workflow.auditAction, record: workflow.record, user: currentUser, before: workflow.before, after: workflow.after, reason: workflow.reason, timestamp: now }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
        return savedVerification;
      },
      rejectMaintenanceWorkOrderVerification: (workOrderId, input) => {
        const current = store.maintenanceWorkOrders.find((record) => record.id === workOrderId);
        const completion = store.workOrderCompletions.find((item) => item.workOrderId === workOrderId && item.verificationRequired && item.verificationStatus === "PENDING");
        if (!current || !completion) throw new Error("Pending verification not found.");
        if (input.idempotencyKey) {
          const existing = store.workOrderVerifications.find((item) => item.lastRequestId === input.idempotencyKey);
          if (existing) return existing;
        }
        const now = new Date().toISOString();
        const verification = createWorkOrderVerificationRejectionRecord({
          workOrder: current,
          completion,
          input,
          context: workOrderExecutionContext(current, now),
          relatedData: { attachments: store.workOrderAttachments.filter((item) => item.workOrderId === workOrderId) },
          id: `work-order-verification-${uid()}`,
        });
        const workflow = applyWorkOrderWorkflow(current, { action: "REJECT_VERIFICATION", expectedVersion: input.expectedWorkOrderVersion, idempotencyKey: input.idempotencyKey, reason: verification.correctiveActionRequired, verificationId: verification.id, verificationResult: verification.result }, workOrderExecutionContext(current, now));
        if (!workflow) {
          const existing = store.workOrderVerifications.find((item) => item.lastRequestId === input.idempotencyKey);
          if (existing) return existing;
          throw new Error("Duplicate rejection request could not be matched.");
        }
        const savedVerification = { ...verification, resultingWorkOrderStatus: workflow.record.status, workOrderVersionAfter: workflow.record.version };
        const nextCompletion = applyVerificationResultToCompletion(completion, savedVerification);
        setStore((s) => ({
          ...s,
          maintenanceWorkOrders: s.maintenanceWorkOrders.map((record) => (record.id === workOrderId ? workflow.record : record)),
          workOrderCompletions: s.workOrderCompletions.map((item) => (item.id === completion.id ? nextCompletion : item)),
          workOrderVerifications: [savedVerification, ...s.workOrderVerifications],
          auditLogs: [
            workOrderVerificationAuditLog({ id: uid(), action: "WORK_ORDER_VERIFICATION_REJECTED", record: workflow.record, completion: nextCompletion, verification: savedVerification, user: currentUser, timestamp: now, reason: verification.rejectionNotes }),
            workOrderAuditLog({ id: uid(), action: workflow.auditAction, record: workflow.record, user: currentUser, before: workflow.before, after: workflow.after, reason: workflow.reason, timestamp: now }),
            ...s.auditLogs,
          ].slice(0, 500),
        }));
        return savedVerification;
      },
      addObservation: (o) => {
        const item: Observation = { ...o, id: uid() };
        const ev: TimelineEvent = {
          id: uid(),
          residentId: o.residentId,
          type: "chart.observation",
          title: "Observation recorded",
          description: o.comments || o.behaviour,
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "observation",
        };
        setStore((s) => ({
          ...s,
          observations: [item, ...s.observations],
          timelineEvents: [ev, ...s.timelineEvents],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Recorded observation",
          entity: o.residentId,
        });
        return item;
      },
      addWeight: (w) => {
        const item: WeightRecord = { ...w, id: uid() };
        const ev: TimelineEvent = {
          id: uid(),
          residentId: w.residentId,
          type: "chart.weight",
          title: `Weight ${w.weightKg} kg`,
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "weight",
        };
        // Auto alert: >5% loss vs earliest in last 90 days
        const prior = store.weights.filter((x) => x.residentId === w.residentId);
        const baseline = prior.length ? prior[prior.length - 1].weightKg : w.weightKg;
        const pct = baseline ? ((baseline - w.weightKg) / baseline) * 100 : 0;
        let newAlerts: Alert[] = [];
        if (pct >= 5)
          newAlerts.push({
            id: uid(),
            residentId: w.residentId,
            title: `Weight loss ${pct.toFixed(1)}%`,
            description: `From ${baseline}kg → ${w.weightKg}kg`,
            priority: pct >= 10 ? "critical" : "high",
            createdAt: new Date().toISOString(),
            acknowledged: false,
          });
        setStore((s) => ({
          ...s,
          weights: [item, ...s.weights],
          timelineEvents: [ev, ...s.timelineEvents],
          alerts: [...newAlerts, ...s.alerts],
        }));
        return item;
      },
      addFluid: (f) => {
        const item: FluidRecord = { ...f, id: uid() };
        setStore((s) => {
          const totalToday = [item, ...s.fluids]
            .filter((x) => x.residentId === f.residentId && x.date === f.date)
            .reduce((sum, x) => sum + x.amountMl, 0);
          let newAlerts: Alert[] = [];
          const dayDone = new Date(f.date).getTime() < new Date().setHours(0, 0, 0, 0);
          if (
            dayDone &&
            totalToday < 1200 &&
            !s.alerts.some(
              (a) =>
                a.residentId === f.residentId && a.title.includes("Hydration") && !a.acknowledged,
            )
          ) {
            newAlerts.push({
              id: uid(),
              residentId: f.residentId,
              title: "Hydration below target",
              description: `${totalToday}ml on ${f.date}`,
              priority: "high",
              createdAt: new Date().toISOString(),
              acknowledged: false,
            });
          }
          const ev: TimelineEvent = {
            id: uid(),
            residentId: f.residentId,
            type: "chart.fluid",
            title: `Fluid ${f.amountMl}ml ${f.type}`,
            createdAt: new Date().toISOString(),
            createdBy: currentUserName,
            role: currentRole,
            linkedRecordId: item.id,
            linkedRecordKind: "fluid",
          };
          return {
            ...s,
            fluids: [item, ...s.fluids],
            timelineEvents: [ev, ...s.timelineEvents],
            alerts: [...newAlerts, ...s.alerts],
          };
        });
        return item;
      },
      addFood: (f) => {
        const item: FoodRecord = { ...f, id: uid() };
        setStore((s) => {
          const recent = [item, ...s.foods]
            .filter((x) => x.residentId === f.residentId)
            .slice(0, 3);
          const allPoor =
            recent.length >= 3 && recent.every((x) => x.intake === "little" || x.intake === "none");
          let newAlerts: Alert[] = [];
          if (
            allPoor &&
            !s.alerts.some(
              (a) =>
                a.residentId === f.residentId && a.title.includes("Nutrition") && !a.acknowledged,
            )
          ) {
            newAlerts.push({
              id: uid(),
              residentId: f.residentId,
              title: "Nutrition concern",
              description: "3 consecutive poor intakes",
              priority: "high",
              createdAt: new Date().toISOString(),
              acknowledged: false,
            });
          }
          const ev: TimelineEvent = {
            id: uid(),
            residentId: f.residentId,
            type: "chart.food",
            title: `${f.meal}: ${f.intake}`,
            createdAt: new Date().toISOString(),
            createdBy: currentUserName,
            role: currentRole,
            linkedRecordId: item.id,
            linkedRecordKind: "food",
          };
          return {
            ...s,
            foods: [item, ...s.foods],
            timelineEvents: [ev, ...s.timelineEvents],
            alerts: [...newAlerts, ...s.alerts],
          };
        });
        return item;
      },
      addPain: (p) => {
        const item: PainRecord = { ...p, id: uid() };
        setStore((s) => {
          const last = s.pains.filter((x) => x.residentId === p.residentId).slice(0, 2);
          let newAlerts: Alert[] = [];
          if (p.score >= 7 || (last[0] && p.score > last[0].score + 2)) {
            newAlerts.push({
              id: uid(),
              residentId: p.residentId,
              title: `Pain ${p.score}/10`,
              description: p.location ? `Location: ${p.location}` : "Pain escalation",
              priority: p.score >= 8 ? "critical" : "high",
              createdAt: new Date().toISOString(),
              acknowledged: false,
            });
          }
          const ev: TimelineEvent = {
            id: uid(),
            residentId: p.residentId,
            type: "chart.pain",
            title: `Pain ${p.score}/10`,
            createdAt: new Date().toISOString(),
            createdBy: currentUserName,
            role: currentRole,
            linkedRecordId: item.id,
            linkedRecordKind: "pain",
          };
          return {
            ...s,
            pains: [item, ...s.pains],
            timelineEvents: [ev, ...s.timelineEvents],
            alerts: [...newAlerts, ...s.alerts],
          };
        });
        return item;
      },
      addSleep: (sl) => {
        const item: SleepRecord = { ...sl, id: uid() };
        const ev: TimelineEvent = {
          id: uid(),
          residentId: sl.residentId,
          type: "chart.sleep",
          title: `Sleep ${sl.hoursSlept}h (${sl.quality})`,
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "sleep",
        };
        setStore((s) => ({
          ...s,
          sleeps: [item, ...s.sleeps],
          timelineEvents: [ev, ...s.timelineEvents],
        }));
        return item;
      },
      addBowel: (b) => {
        const item: BowelRecord = { ...b, id: uid() };
        const ev: TimelineEvent = {
          id: uid(),
          residentId: b.residentId,
          type: "chart.bowel",
          title: `Bowel (Bristol ${b.bristolType})`,
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "bowel",
        };
        setStore((s) => ({
          ...s,
          bowels: [item, ...s.bowels],
          timelineEvents: [ev, ...s.timelineEvents],
        }));
        return item;
      },
      addBehaviour: (b) => {
        const item: BehaviourRecord = { ...b, id: uid() };
        const ev: TimelineEvent = {
          id: uid(),
          residentId: b.residentId,
          type: "chart.behaviour",
          title: b.behaviour,
          description: b.intervention,
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "behaviour",
        };
        setStore((s) => ({
          ...s,
          behaviours: [item, ...s.behaviours],
          timelineEvents: [ev, ...s.timelineEvents],
        }));
        return item;
      },
      recordDailyCare: (command) => {
        let saved: DailyCareRecord | undefined;
        setStore((s) => {
          const context = s.operationalContext;
          const capabilities = [
            "daily_care.view",
            "daily_care.record",
            "daily_care.bedside_view",
            "daily_care.bedside_record",
            "daily_care.view_ward_residents",
            "daily_care.record_quick",
            "daily_care.record_detailed",
            "daily_care.record_personal_care",
            "daily_care.record_dressing",
            "daily_care.record_oral_care",
            "daily_care.record_toileting",
            "daily_care.record_continence",
            "daily_care.record_repositioning",
            "daily_care.record_food",
            "daily_care.record_fluids",
            "daily_care.record_mobility",
            "daily_care.record_comfort",
            "daily_care.record_sleep",
            "daily_care.record_mood",
            "daily_care.record_behaviour",
            "daily_care.record_activity",
            "daily_care.record_refusal",
            "daily_care.record_skin_observation",
            "daily_care.record_escalated_outcome",
            "daily_care.notify_nurse",
            "daily_care.create_follow_up",
            "daily_care.create_refusal_follow_up",
            "daily_care.escalate_refusal",
            "daily_care.view_refusal",
            "daily_care.view_rlt_mapping",
            "daily_care.correct",
            "daily_care.enter_in_error",
            "daily_care.record_for_another_staff_member",
            "daily_care_trends.evaluate",
            "daily_care_trends.view",
            "deterioration_queue.view",
            "work_item.complete",
            "work_item.mark_missed",
            "work_item.mark_not_applicable",
          ].filter((capability) => capability.startsWith("daily_care") || capability.startsWith("deterioration_queue.") ? can(currentRole, capability as never) : true);
          const repository = {
            dailyCareRecords: [...s.dailyCareRecords],
            dailyCareEvents: [...s.dailyCareEvents],
            dailyCareAuditRecords: [...s.dailyCareAuditRecords],
            dailyCareTrendPolicies: [...s.dailyCareTrendPolicies],
            dailyCareTrendEvaluations: [...s.dailyCareTrendEvaluations],
            issues: [...s.deteriorationIssues],
            events: [...s.deteriorationIssueEvents],
            workItems: [...s.flexibleCareActionState.workItems],
            transitions: [],
            assignmentHistory: [],
            exceptions: [],
            auditRecords: [],
          };
          const existingDailyCareAuditIds = new Set(repository.dailyCareAuditRecords.map((record) => record.id));
          const result = recordDailyCareService(
            {
              ...command,
              nursingHomeId: command.nursingHomeId || context.nursingHomeId,
              wardId: command.wardId || context.wardIds[0],
            },
            {
              nursingHomeId: context.nursingHomeId,
              wardId: context.wardIds[0],
              shiftId: context.shiftId,
              timezone: context.timezone,
              recordedAt: new Date().toISOString(),
              correlationId: `daily-care-${command.clientRequestId}`,
            },
            {
              userAccountId: currentUserId,
              staffMemberId: `staff-${currentUserId}`,
              residentIds: s.residents.map((resident) => resident.id),
              authorisedNursingHomeIds: [context.nursingHomeId],
              authorisedWardIds: context.wardIds,
              capabilities,
              sourceCapabilities: capabilities,
            },
            repository,
            uid,
          );
          saved = result.record;
          handleDailyCareRecordedForTrends(
            result.record,
            repository,
            {
              nursingHomeId: context.nursingHomeId,
              wardId: context.wardIds[0],
              timezone: context.timezone,
              occurredAt: new Date().toISOString(),
              correlationId: `daily-care-trends-${command.clientRequestId}`,
            },
            {
              userAccountId: currentUserId,
              staffMemberId: `staff-${currentUserId}`,
              capabilities,
            },
            uid,
          );
          const newDailyCareAuditRecords = repository.dailyCareAuditRecords.filter(
            (record) => !existingDailyCareAuditIds.has(record.id),
          );
          return {
            ...s,
            dailyCareRecords: repository.dailyCareRecords,
            dailyCareEvents: repository.dailyCareEvents,
            dailyCareAuditRecords: repository.dailyCareAuditRecords,
            dailyCareTrendEvaluations: repository.dailyCareTrendEvaluations,
            deteriorationIssues: repository.issues,
            deteriorationIssueEvents: repository.events,
            flexibleCareActionState: { ...s.flexibleCareActionState, workItems: repository.workItems },
            auditRecords: [...newDailyCareAuditRecords, ...s.auditRecords],
          };
        });
        return saved!;
      },
      submitHcaNurseEscalation: (command) => {
        let saved: HcaNurseEscalation | undefined;
        setStore((s) => {
          const context = s.operationalContext;
          const capabilities = [
            "hca_escalation.submit",
            "hca_escalation.view_own",
            "deterioration_queue.view",
          ].filter((capability) => can(currentRole, capability as never));
          const repository = {
            hcaNurseEscalations: [...s.hcaNurseEscalations],
            hcaEscalationEvents: [...s.hcaEscalationEvents],
            hcaEscalationAuditRecords: [...s.hcaEscalationAuditRecords],
            dailyCareRecords: [...s.dailyCareRecords],
            issues: [...s.deteriorationIssues],
            events: [...s.deteriorationIssueEvents],
            workItems: [...s.flexibleCareActionState.workItems],
            transitions: [],
            assignmentHistory: [],
            exceptions: [],
            auditRecords: [],
          };
          const existingAuditIds = new Set(repository.hcaEscalationAuditRecords.map((record) => record.id));
          const result = submitHcaNurseEscalationService(
            { ...command, nursingHomeId: command.nursingHomeId || context.nursingHomeId, wardId: command.wardId || context.wardIds[0] },
            { nursingHomeId: context.nursingHomeId, wardId: context.wardIds[0], timezone: context.timezone, occurredAt: new Date().toISOString(), correlationId: `hca-escalation-${command.clientRequestId}` },
            { userAccountId: currentUserId, staffMemberId: `staff-${currentUserId}`, residentIds: s.residents.map((resident) => resident.id), authorisedNursingHomeIds: [context.nursingHomeId], authorisedWardIds: context.wardIds, capabilities },
            repository,
            uid,
          );
          saved = result.escalation;
          const newAuditRecords = repository.hcaEscalationAuditRecords.filter((record) => !existingAuditIds.has(record.id));
          return {
            ...s,
            hcaNurseEscalations: repository.hcaNurseEscalations,
            hcaEscalationEvents: repository.hcaEscalationEvents,
            hcaEscalationAuditRecords: repository.hcaEscalationAuditRecords,
            deteriorationIssues: repository.issues,
            deteriorationIssueEvents: repository.events,
            flexibleCareActionState: { ...s.flexibleCareActionState, workItems: repository.workItems },
            auditRecords: [...newAuditRecords, ...s.auditRecords],
          };
        });
        return saved!;
      },
      addIncidentAction: (a) => {
        const item: IncidentAction = { ...a, id: uid() };
        setStore((s) => ({ ...s, incidentActions: [item, ...s.incidentActions] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Incident follow-up action",
          entity: a.incidentId,
        });
        return item;
      },
      generateShiftSummary: (date, shift) => {
        const dayNotes = store.notes.filter(
          (n) => n.date.slice(0, 10) === date && n.shift === shift,
        );
        const dayInter = store.interventionLogs.filter(
          (l) => l.date === date && l.outcome === "completed",
        );
        const dayTasks = store.tasks.filter(
          (t) => t.dueDate.slice(0, 10) === date && t.status === "completed",
        );
        const dayInc = store.incidents.filter((i) => i.date.slice(0, 10) === date);
        const dayAlerts = store.alerts.filter((a) => a.createdAt.slice(0, 10) === date);
        const outstandingTasks = store.tasks.filter(
          (t) => t.status !== "completed" && t.status !== "deleted",
        ).length;
        const outstandingHandovers = store.handovers.filter(
          (h) => h.status !== "acknowledged" && h.status !== "closed",
        ).length;
        const residentsSeen = new Set(dayNotes.map((n) => n.residentId)).size;
        const item: ShiftSummary = {
          id: uid(),
          date,
          shift,
          generatedAt: new Date().toISOString(),
          generatedBy: currentUserName,
          residentsSeen,
          notesAdded: dayNotes.length,
          interventionsCompleted: dayInter.length,
          tasksCompleted: dayTasks.length,
          incidents: dayInc.length,
          alerts: dayAlerts.length,
          outstandingTasks,
          outstandingHandovers,
        };
        setStore((s) => ({ ...s, shiftSummaries: [item, ...s.shiftSummaries] }));
        return item;
      },
      logAudit,

      // ============ Unified Care Plan / Problems ============
      ensureResidentCarePlan: (residentId) => {
        const existing = store.residentCarePlans.find(
          (p) => p.residentId === residentId && p.status === "active",
        );
        if (existing) return existing;
        const item: ResidentCarePlan = {
          id: newId("rcp"),
          residentId,
          status: "active",
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
        };
        setStore((s) => ({ ...s, residentCarePlans: [item, ...s.residentCarePlans] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created resident care plan",
          entity: item.id,
        });
        return item;
      },

      addProblem: (input) => {
        // ensure resident care plan exists
        let rcp = store.residentCarePlans.find(
          (p) => p.residentId === input.residentId && p.status === "active",
        );
        let rcpId = rcp?.id;
        const newRcp: ResidentCarePlan | null = !rcp
          ? {
              id: newId("rcp"),
              residentId: input.residentId,
              status: "active",
              createdAt: new Date().toISOString(),
              createdBy: currentUserName,
            }
          : null;
        if (newRcp) rcpId = newRcp.id;

        const item: CarePlanProblem = {
          id: newId("prob"),
          residentCarePlanId: rcpId!,
          residentId: input.residentId,
          category: input.category,
          rltDomainId:
            input.rltDomainId ||
            (input.category !== "custom" ? CATEGORY_TO_RLT_DOMAIN[input.category] : undefined),
          customCategoryLabel: input.customCategoryLabel,
          problemStatement: input.problemStatement,
          riskLevel: input.riskLevel,
          sourceAssessmentId: input.sourceAssessmentId,
          sourceAssessmentType: input.sourceAssessmentType,
          contextReferences: input.contextReferences,
          createdBy: currentUserName,
          createdAt: new Date().toISOString(),
          evaluationDate:
            input.evaluationDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          reviewDate:
            input.reviewDate || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
          notes: input.notes,
          status: "active",
        };
        const hist: ProblemHistoryEntry = {
          id: newId("hist"),
          problemId: item.id,
          timestamp: item.createdAt,
          userId: currentUser.id,
          userName: currentUserName,
          role: currentRole,
          action: "created",
        };
        const ev: TimelineEvent = {
          id: newId("tle"),
          residentId: input.residentId,
          type: "careplan.created",
          title: `Care plan problem added: ${input.problemStatement.slice(0, 60)}`,
          createdAt: item.createdAt,
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: item.id,
          linkedRecordKind: "care_plan_problem",
        };
        setStore((s) => ({
          ...s,
          residentCarePlans: newRcp ? [newRcp, ...s.residentCarePlans] : s.residentCarePlans,
          carePlanProblems: [item, ...s.carePlanProblems],
          problemHistory: [hist, ...s.problemHistory],
          timelineEvents: [ev, ...s.timelineEvents],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Added care plan problem",
          entity: item.id,
        });
        return item;
      },

      updateProblem: (id, patch, reason) => {
        const before = store.carePlanProblems.find((p) => p.id === id);
        setStore((s) => ({
          ...s,
          carePlanProblems: s.carePlanProblems.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          problemHistory: [
            {
              id: newId("hist"),
              problemId: id,
              timestamp: new Date().toISOString(),
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "updated",
              reason,
              oldValue: before
                ? JSON.stringify({
                    riskLevel: before.riskLevel,
                    evaluationDate: before.evaluationDate,
                    reviewDate: before.reviewDate,
                  })
                : undefined,
              newValue: JSON.stringify(patch),
            },
            ...s.problemHistory,
          ],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated care plan problem",
          entity: id,
          reason,
        });
      },

      resolveProblem: (id, reason) => {
        const now = new Date().toISOString();
        const prob = store.carePlanProblems.find((p) => p.id === id);
        setStore((s) => ({
          ...s,
          carePlanProblems: s.carePlanProblems.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "resolved" as const,
                  resolvedAt: now,
                  resolvedBy: currentUserName,
                  resolvedReason: reason,
                  riskLevel: "resolved" as const,
                }
              : p,
          ),
          problemHistory: [
            {
              id: newId("hist"),
              problemId: id,
              timestamp: now,
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "resolved",
              reason,
            },
            ...s.problemHistory,
          ],
          timelineEvents: prob
            ? [
                {
                  id: newId("tle"),
                  residentId: prob.residentId,
                  type: "careplan.reviewed",
                  title: `Problem resolved: ${prob.problemStatement.slice(0, 60)}`,
                  createdAt: now,
                  createdBy: currentUserName,
                  role: currentRole,
                  linkedRecordId: id,
                  linkedRecordKind: "care_plan_problem",
                },
                ...s.timelineEvents,
              ]
            : s.timelineEvents,
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Resolved problem",
          entity: id,
          reason,
        });
      },

      reopenProblem: (id, reason) => {
        setStore((s) => ({
          ...s,
          carePlanProblems: s.carePlanProblems.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "active" as const,
                  resolvedAt: undefined,
                  resolvedBy: undefined,
                  resolvedReason: undefined,
                }
              : p,
          ),
          problemHistory: [
            {
              id: newId("hist"),
              problemId: id,
              timestamp: new Date().toISOString(),
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "reopened",
              reason,
            },
            ...s.problemHistory,
          ],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Reopened problem",
          entity: id,
          reason,
        });
      },

      archiveProblem: (id, reason) => {
        const now = new Date().toISOString();
        const problem = store.carePlanProblems.find((p) => p.id === id);
        const linkedInterventions = store.problemInterventions.filter(
          (intervention) => intervention.problemId === id && intervention.status !== "discontinued",
        );
        const cascadeReason = `Care plan problem set inactive: ${reason}`;
        setStore((s) => ({
          ...s,
          carePlanProblems: s.carePlanProblems.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "archived" as const,
                  archivedAt: now,
                  archivedBy: currentUserName,
                  archivedReason: reason,
                }
              : p,
          ),
          problemInterventions: s.problemInterventions.map((intervention) =>
            intervention.problemId === id &&
            !["discontinued", "completed", "cancelled"].includes(intervention.status)
              ? {
                  ...intervention,
                  status: "discontinued" as const,
                  discontinuedAt: now,
                  discontinuedBy: currentUserName,
                  discontinuedByRole: currentRole,
                  discontinuedReason: cascadeReason,
                  updatedAt: now,
                  updatedBy: currentUserName,
                  updatedByRole: currentRole,
                }
              : intervention,
          ),
          problemHistory: [
            {
              id: newId("hist"),
              problemId: id,
              timestamp: now,
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "archived",
              reason,
            },
            ...linkedInterventions.map((intervention) => ({
              id: newId("hist"),
              problemId: id,
              timestamp: now,
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "intervention_discontinued",
              reason: cascadeReason,
              oldValue: intervention.name,
            })),
            ...s.problemHistory,
          ],
          timelineEvents: problem
            ? [
                {
                  id: newId("tle"),
                  residentId: problem.residentId,
                  type: "careplan.updated",
                  title: `Care plan problem set inactive: ${problem.problemStatement.slice(0, 60)}`,
                  description: `${linkedInterventions.length} linked intervention${linkedInterventions.length === 1 ? "" : "s"} discontinued. ${reason}`,
                  createdAt: now,
                  createdBy: currentUserName,
                  role: currentRole,
                  linkedRecordId: id,
                  linkedRecordKind: "care_plan_problem",
                },
                ...linkedInterventions.map((intervention) => ({
                  id: newId("tle"),
                  residentId: intervention.residentId,
                  type: "intervention.updated" as const,
                  title: `Intervention discontinued: ${intervention.name}`,
                  description: cascadeReason,
                  createdAt: now,
                  createdBy: currentUserName,
                  role: currentRole,
                  linkedRecordId: intervention.id,
                  linkedRecordKind: "problem_intervention" as const,
                })),
                ...s.timelineEvents,
              ]
            : s.timelineEvents,
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Archived problem and discontinued linked interventions",
          entity: id,
          reason,
          after: JSON.stringify({
            problemId: id,
            interventionCount: linkedInterventions.length,
          }),
        });
      },

      addGoal: (problemId, statement, targetDate) => {
        const item: ProblemGoal = {
          id: newId("goal"),
          problemId,
          statement,
          targetDate,
          status: "active",
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
        };
        setStore((s) => ({
          ...s,
          problemGoals: [item, ...s.problemGoals],
          timelineEvents: [
            {
              id: newId("tle"),
              residentId: store.carePlanProblems.find((p) => p.id === problemId)?.residentId || "",
              type: "careplan.updated",
              title: `Goal added: ${statement.slice(0, 60)}`,
              createdAt: item.createdAt,
              createdBy: currentUserName,
              role: currentRole,
              linkedRecordId: item.id,
              linkedRecordKind: "problem_goal",
            },
            ...s.timelineEvents,
          ],
          problemHistory: [
            {
              id: newId("hist"),
              problemId,
              timestamp: item.createdAt,
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "goal_added",
              newValue: statement,
            },
            ...s.problemHistory,
          ],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Added goal",
          entity: item.id,
        });
        return item;
      },

      updateGoal: (id, patch) => {
        setStore((s) => ({
          ...s,
          problemGoals: s.problemGoals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        }));
        const g = store.problemGoals.find((x) => x.id === id);
        if (g) {
          setStore((s) => ({
            ...s,
            problemHistory: [
              {
                id: newId("hist"),
                problemId: g.problemId,
                timestamp: new Date().toISOString(),
                userId: currentUser.id,
                userName: currentUserName,
                role: currentRole,
                action: "goal_edited",
                newValue: JSON.stringify(patch),
              },
              ...s.problemHistory,
            ],
          }));
        }
      },

      removeGoal: (id) => {
        const g = store.problemGoals.find((x) => x.id === id);
        setStore((s) => ({
          ...s,
          problemGoals: s.problemGoals.filter((x) => x.id !== id),
          problemHistory: g
            ? [
                {
                  id: newId("hist"),
                  problemId: g.problemId,
                  timestamp: new Date().toISOString(),
                  userId: currentUser.id,
                  userName: currentUserName,
                  role: currentRole,
                  action: "goal_removed",
                  oldValue: g.statement,
                },
                ...s.problemHistory,
              ]
            : s.problemHistory,
        }));
      },

      addProblemIntervention: (input) => {
        const prob = store.carePlanProblems.find((p) => p.id === input.problemId);
        if (!prob || prob.status !== "active") {
          throw new Error("Active care plan problem not found for intervention");
        }
        const item: ProblemIntervention = {
          id: newId("int"),
          problemId: input.problemId,
          residentId: prob.residentId,
          name: input.name,
          description: input.description,
          frequencyType: input.frequencyType,
          frequencyValue: input.frequencyValue,
          frequencyInstructions: input.frequencyInstructions,
          careActionType: input.careActionType,
          priority: input.priority,
          prnConfiguration: input.prnConfiguration,
          triggerConfiguration: input.triggerConfiguration,
          oneOffConfiguration: input.oneOffConfiguration,
          completionRequirements: input.completionRequirements,
          visibilityPolicy: input.visibilityPolicy,
          assignedRole: input.assignedRole,
          assignedStaffId: input.assignedStaffId,
          assignedStaffName: input.assignedStaffName,
          startDate: input.startDate,
          startTime: input.startTime,
          reviewDate: input.reviewDate,
          endDate: input.endDate,
          status: input.status || "active",
          notes: input.notes,
          createdAt: new Date().toISOString(),
          createdBy: input.createdBy || currentUserName,
          createdByRole: input.createdByRole || currentRole,
        };
        const configuration = validateCareActionConfiguration(item);
        if (!configuration.valid) throw new Error(configuration.issues.join(" "));

        const ev: TimelineEvent = {
          id: newId("tle"),
          residentId: prob.residentId,
          type: "intervention.created",
          title: `Intervention Created: ${input.name}`,
          description: `${prob.problemStatement} · ${input.frequencyType} starting ${input.startDate}, review ${input.reviewDate}`,
          createdAt: item.createdAt,
          createdBy: item.createdBy,
          role: item.createdByRole,
          linkedRecordId: item.id,
          linkedRecordKind: "problem_intervention",
        };

        setStore((s) => {
          const nextFlexibleState: FlexibleCareActionState = structuredClone(s.flexibleCareActionState);
          if (configuration.careActionType === "one_off") {
            const nursingHomeId = prob.facilityId || activeFacilityId;
            const access = createStaffAccessContext(currentUser, nursingHomeId);
            activateOneOffCareAction(nextFlexibleState, item, s.carePlanProblems, { userAccountId: currentUser.id, staffMemberId: access.staffMemberId, nursingHomeId, capabilities: getEffectivePermissions(s, access, { nursingHomeId }), occurredAt: item.createdAt, correlationId: `one-off-create:${item.id}`, residentExists: (residentId) => s.residents.some((candidate) => candidate.id === residentId), residentBelongsToHome: (residentId, homeId) => s.residents.some((candidate) => candidate.id === residentId && (candidate.facilityId || activeFacilityId) === homeId) });
          }
          return {
          ...s,
          flexibleCareActionState: nextFlexibleState,
          problemInterventions: [item, ...s.problemInterventions],
          timelineEvents: [ev, ...s.timelineEvents],
          problemHistory: [
            {
              id: newId("hist"),
              problemId: input.problemId,
              timestamp: item.createdAt,
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "intervention_added",
              newValue: input.name,
            },
            ...s.problemHistory,
          ],
        };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Added intervention: ${input.name}`,
          entity: item.id,
          after: JSON.stringify({
            residentId: item.residentId,
            problemId: item.problemId,
            assignedRole: item.assignedRole,
            assignedStaffName: item.assignedStaffName,
            startDate: item.startDate,
            reviewDate: item.reviewDate,
            endDate: item.endDate,
            status: item.status,
            notes: item.notes,
          }),
        });
        return item;
      },

      updateProblemIntervention: (id, patch, reason) => {
        const before = store.problemInterventions.find((i) => i.id === id);
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          problemInterventions: s.problemInterventions.map((i) =>
            i.id === id ? { ...i, ...patch } : i,
          ),
          timelineEvents: before
            ? [
                {
                  id: newId("tle"),
                  residentId: before.residentId,
                  type: "intervention.updated",
                  title: `Intervention updated: ${before.name}`,
                  description: reason || JSON.stringify(patch),
                  createdAt: now,
                  createdBy: currentUserName,
                  role: currentRole,
                  linkedRecordId: id,
                  linkedRecordKind: "problem_intervention",
                },
                ...s.timelineEvents,
              ]
            : s.timelineEvents,
          problemHistory: before
            ? [
                {
                  id: newId("hist"),
                  problemId: before.problemId,
                  timestamp: now,
                  userId: currentUser.id,
                  userName: currentUserName,
                  role: currentRole,
                  action:
                    patch.frequencyType || patch.frequencyValue || patch.frequencyInstructions
                      ? "frequency_changed"
                      : "updated",
                  reason,
                  newValue: JSON.stringify(patch),
                },
                ...s.problemHistory,
              ]
            : s.problemHistory,
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Updated intervention${before ? `: ${before.name}` : ""}`,
          entity: id,
          reason,
          after: JSON.stringify(patch),
        });
      },

      discontinueProblemIntervention: (id, reason) => {
        const before = store.problemInterventions.find((i) => i.id === id);
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          problemInterventions: s.problemInterventions.map((i) =>
            i.id === id ? { ...i, status: "discontinued" as const } : i,
          ),
          timelineEvents: before
            ? [
                {
                  id: newId("tle"),
                  residentId: before.residentId,
                  type: "intervention.updated",
                  title: `Intervention discontinued: ${before.name}`,
                  description: reason,
                  createdAt: now,
                  createdBy: currentUserName,
                  role: currentRole,
                  linkedRecordId: id,
                  linkedRecordKind: "problem_intervention",
                },
                ...s.timelineEvents,
              ]
            : s.timelineEvents,
          problemHistory: before
            ? [
                {
                  id: newId("hist"),
                  problemId: before.problemId,
                  timestamp: now,
                  userId: currentUser.id,
                  userName: currentUserName,
                  role: currentRole,
                  action: "intervention_removed",
                  reason,
                  oldValue: before.name,
                },
                ...s.problemHistory,
              ]
            : s.problemHistory,
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Discontinued intervention",
          entity: id,
          reason,
        });
      },

      // CHANGE 7 — fan-out to timeline + daily notes + audit
      logProblemIntervention: (input) => {
        const intv = store.problemInterventions.find((i) => i.id === input.interventionId);
        if (!intv) throw new Error("Intervention not found");
        const now = new Date();
        const date = now.toISOString().slice(0, 10);
        const time = now.toTimeString().slice(0, 5);
        const hour = now.getHours();
        const shift: DailyNote["shift"] = hour < 14 ? "morning" : hour < 22 ? "afternoon" : "night";

        const noteId = newId("note");
        const logId = newId("plog");

        const note: DailyNote = {
          id: noteId,
          residentId: intv.residentId,
          date,
          staff: currentUserName,
          shift,
          observation: `${intv.name}: ${input.outcome.replace("_", " ")}${input.comments ? " — " + input.comments : ""}`,
          mood: "calm",
          foodIntake: "most",
          fluidIntake: "good",
          sleep: "good",
          behaviour: input.residentResponse || "",
          linkedCarePlanId: intv.problemId,
          linkedProblemId: intv.problemId,
          linkedInterventionId: intv.id,
          linkedInterventionLogId: logId,
        };

        const log: ProblemInterventionLog = {
          id: logId,
          interventionId: intv.id,
          problemId: intv.problemId,
          residentId: intv.residentId,
          date,
          time,
          staffId: currentUser.id,
          staffName: currentUserName,
          role: currentRole,
          outcome: input.outcome,
          residentResponse: input.residentResponse,
          comments: input.comments,
          linkedDailyNoteId: noteId,
        };

        const ev: TimelineEvent = {
          id: newId("tle"),
          residentId: intv.residentId,
          type: "intervention.logged",
          title: `${intv.name} — ${input.outcome.replace("_", " ")}`,
          description: input.comments,
          createdAt: now.toISOString(),
          createdBy: currentUserName,
          role: currentRole,
          linkedRecordId: log.id,
          linkedRecordKind: "problem_intervention_log",
        };

        const hist: ProblemHistoryEntry = {
          id: newId("hist"),
          problemId: intv.problemId,
          timestamp: now.toISOString(),
          userId: currentUser.id,
          userName: currentUserName,
          role: currentRole,
          action: "intervention_logged",
          newValue: `${intv.name}: ${input.outcome}`,
        };
        const resident = store.residents.find((item) => item.id === intv.residentId);
        const effectiveAt = `${date}T${time}:00.000`;
        const careActionEvent =
          input.outcome === "missed"
            ? createDomainEvent({
                eventType: "CareActionMissed",
                occurredAt: effectiveAt,
                recordedAt: now.toISOString(),
                actor: {
                  actorType: "user",
                  userAccountId: currentUser.id,
                  staffMemberId: operationalContext.staffMemberId,
                  displayName: currentUserName,
                  effectiveRoleKey: currentRole,
                },
                scope: {
                  nursingHomeId: intv.facilityId || resident?.facilityId || operationalContext.nursingHomeId,
                  wardId: resident?.wardId as any,
                  shiftId: operationalContext.shiftId,
                  operationalDate: operationalContext.operationalDate,
                  timezone: operationalContext.timezone,
                },
                subject: { entityType: "ProblemInterventionLog", entityId: log.id, residentId: intv.residentId },
                source: { module: "care_actions", service: "care_action_service", operation: "miss" },
                payload: {
                  careActionId: intv.id,
                  occurrenceId: log.id,
                  residentId: intv.residentId,
                  dueAt: effectiveAt,
                  missedAt: effectiveAt,
                  missedReason: input.comments || input.residentResponse || "not_completed",
                },
                correlationId: createCorrelationId("care-action"),
              })
            : ["completed", "partially_completed"].includes(input.outcome)
              ? createDomainEvent({
                  eventType: "CareActionCompleted",
                  occurredAt: effectiveAt,
                  recordedAt: now.toISOString(),
                  actor: {
                    actorType: "user",
                    userAccountId: currentUser.id,
                    staffMemberId: operationalContext.staffMemberId,
                    displayName: currentUserName,
                    effectiveRoleKey: currentRole,
                  },
                  scope: {
                    nursingHomeId: intv.facilityId || resident?.facilityId || operationalContext.nursingHomeId,
                    wardId: resident?.wardId as any,
                    shiftId: operationalContext.shiftId,
                    operationalDate: operationalContext.operationalDate,
                    timezone: operationalContext.timezone,
                  },
                  subject: { entityType: "ProblemInterventionLog", entityId: log.id, residentId: intv.residentId },
                  source: { module: "care_actions", service: "care_action_service", operation: "complete" },
                  payload: {
                    careActionId: intv.id,
                    carePlanItemId: intv.problemId,
                    residentId: intv.residentId,
                    scheduledOccurrenceId: log.id,
                    effectiveCompletedAt: effectiveAt,
                    recordedAt: now.toISOString(),
                    outcome: input.outcome,
                    response: input.residentResponse,
                  },
                  correlationId: createCorrelationId("care-action"),
                })
              : undefined;

        setStore((s) => {
          const next = {
            ...s,
            problemInterventionLogs: [log, ...s.problemInterventionLogs],
            notes: [note, ...s.notes],
            timelineEvents: [ev, ...s.timelineEvents],
            problemHistory: [hist, ...s.problemHistory],
          };
          return careActionEvent ? processRulesForEvent(appendEventRecord(next, careActionEvent), careActionEvent) : next;
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Logged intervention: ${input.outcome}`,
          entity: log.id,
        });
        return log;
      },

      addProblemInterventionLog: (input) => {
        const log: ProblemInterventionLog = {
          id: newId("plog"),
          ...input,
          createdAt: new Date().toISOString(),
        };

        const intv = store.problemInterventions.find((i) => i.id === input.interventionId);
        const ev: TimelineEvent | null = intv
          ? {
              id: newId("tle"),
              residentId: input.residentId,
              type: "intervention.logged",
              title: `${intv.name} — ${input.outcome.replace("_", " ")}`,
              description: input.comments,
              createdAt: log.createdAt,
              createdBy: input.staffName,
              role: input.role,
              linkedRecordId: log.id,
              linkedRecordKind: "problem_intervention_log",
            }
          : null;

        setStore((s) => ({
          ...s,
          problemInterventionLogs: [log, ...s.problemInterventionLogs],
          timelineEvents: ev ? [ev, ...s.timelineEvents] : s.timelineEvents,
        }));
        logAudit({
          user: input.staffName,
          role: input.role,
          action: `Logged intervention: ${input.outcome}`,
          entity: log.id,
        });
        return log;
      },

      addProblemEvaluation: (input) => {
        const item: ProblemEvaluation = {
          ...input,
          id: newId("eval"),
          date: input.date || new Date().toISOString(),
          evaluatorId: currentUser.id,
          evaluatorName: currentUserName,
          role: currentRole,
        };
        const prob = store.carePlanProblems.find((p) => p.id === input.problemId);
        const ev: TimelineEvent | null = prob
          ? {
              id: newId("tle"),
              residentId: prob.residentId,
              type: "careplan.evaluated",
              title: `Evaluation: ${input.progress}`,
              description: input.summary,
              createdAt: item.date,
              createdBy: currentUserName,
              role: currentRole,
              linkedRecordId: item.id,
              linkedRecordKind: "problem_evaluation",
            }
          : null;
        setStore((s) => ({
          ...s,
          problemEvaluations: [item, ...s.problemEvaluations],
          timelineEvents: ev ? [ev, ...s.timelineEvents] : s.timelineEvents,
          problemHistory: [
            {
              id: newId("hist"),
              problemId: input.problemId,
              timestamp: item.date,
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "evaluation_added",
              newValue: input.progress,
            },
            ...s.problemHistory,
          ],
          // bump evaluation date
          carePlanProblems: input.nextEvaluationDate
            ? s.carePlanProblems.map((p) =>
                p.id === input.problemId ? { ...p, evaluationDate: input.nextEvaluationDate! } : p,
              )
            : s.carePlanProblems,
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Added evaluation",
          entity: input.problemId,
        });
        return item;
      },

      addProblemReview: (input) => {
        const item: ProblemReview = {
          ...input,
          id: newId("rev"),
          reviewedById: currentUser.id,
          reviewedByName: currentUserName,
          role: currentRole,
        };
        const prob = store.carePlanProblems.find((p) => p.id === input.problemId);
        const ev: TimelineEvent | null = prob
          ? {
              id: newId("tle"),
              residentId: prob.residentId,
              type: "careplan.reviewed",
              title: `Review: ${input.outcome}`,
              description: input.comments,
              createdAt: new Date().toISOString(),
              createdBy: currentUserName,
              role: currentRole,
              linkedRecordId: item.id,
              linkedRecordKind: "problem_review",
            }
          : null;
        setStore((s) => ({
          ...s,
          problemReviews: [item, ...s.problemReviews],
          timelineEvents: ev ? [ev, ...s.timelineEvents] : s.timelineEvents,
          problemHistory: [
            {
              id: newId("hist"),
              problemId: input.problemId,
              timestamp: new Date().toISOString(),
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "review_added",
              newValue: input.outcome,
            },
            ...s.problemHistory,
          ],
          carePlanProblems: input.nextReviewDate
            ? s.carePlanProblems.map((p) =>
                p.id === input.problemId ? { ...p, reviewDate: input.nextReviewDate! } : p,
              )
            : s.carePlanProblems,
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Added formal review",
          entity: input.problemId,
        });
        return item;
      },

      acceptSuggestion: (id, edits) => {
        const sug = store.assessmentSuggestions.find((s) => s.id === id);
        if (!sug) return undefined;
        // create problem via same logic as addProblem
        const rcp = store.residentCarePlans.find(
          (p) => p.residentId === sug.residentId && p.status === "active",
        );
        let rcpId = rcp?.id;
        const newRcp: ResidentCarePlan | null = !rcp
          ? {
              id: newId("rcp"),
              residentId: sug.residentId,
              status: "active",
              createdAt: new Date().toISOString(),
              createdBy: currentUserName,
            }
          : null;
        if (newRcp) rcpId = newRcp.id;
        const problem: CarePlanProblem = {
          id: newId("prob"),
          residentCarePlanId: rcpId!,
          residentId: sug.residentId,
          category: edits?.category || sug.category,
          rltDomainId:
            (edits?.category || sug.category) !== "custom"
              ? CATEGORY_TO_RLT_DOMAIN[edits?.category || sug.category]
              : undefined,
          problemStatement: edits?.problemStatement || sug.problemStatement,
          riskLevel: edits?.riskLevel || sug.riskLevel,
          sourceAssessmentId: sug.assessmentId,
          sourceAssessmentType: sug.assessmentType,
          createdBy: currentUserName,
          createdAt: new Date().toISOString(),
          evaluationDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          reviewDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
          status: "active",
        };
        setStore((s) => ({
          ...s,
          residentCarePlans: newRcp ? [newRcp, ...s.residentCarePlans] : s.residentCarePlans,
          carePlanProblems: [problem, ...s.carePlanProblems],
          assessmentSuggestions: s.assessmentSuggestions.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status: edits ? ("edited" as const) : ("accepted" as const),
                  acceptedAsProblemId: problem.id,
                }
              : x,
          ),
          problemHistory: [
            {
              id: newId("hist"),
              problemId: problem.id,
              timestamp: problem.createdAt,
              userId: currentUser.id,
              userName: currentUserName,
              role: currentRole,
              action: "created",
              reason: `Accepted from ${sug.assessmentType} assessment suggestion`,
            },
            ...s.problemHistory,
          ],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Accepted assessment suggestion",
          entity: problem.id,
        });
        return problem;
      },

      rejectSuggestion: (id, reason) => {
        setStore((s) => ({
          ...s,
          assessmentSuggestions: s.assessmentSuggestions.map((x) =>
            x.id === id ? { ...x, status: "rejected" as const, rejectedReason: reason } : x,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Rejected assessment suggestion",
          entity: id,
          reason,
        });
      },

      // ---------------- Vital Signs ----------------
      recordVital: (input) => {
        const now = new Date().toISOString();
        const recordedAt = input.recordedAt || now;
        const {
          news2Score: _ignoredScore,
          news2Risk: _ignoredRisk,
          news2Breakdown: _ignoredBreakdown,
          ...enteredValues
        } = input;
        const calculatedNews2 = calcNEWS2(enteredValues);
        const item: VitalSign = {
          ...enteredValues,
          ...(calculatedNews2.complete
            ? {
                news2Score: calculatedNews2.total,
                news2Risk: calculatedNews2.risk,
                news2Breakdown: calculatedNews2.breakdown,
              }
            : {}),
          id: uid(),
          recordedByUserId: currentUser.id,
          recordedByName: currentUserName,
          recordedByRole: currentRole,
          createdAt: now,
          recordedAt,
          auditTrail: [
            {
              id: uid(),
              action: "created",
              byUserId: currentUser.id,
              byUserName: currentUserName,
              byRole: currentRole,
              at: now,
            },
          ],
        };
        item.canonicalObservation = canonicalObservationFromVital(item, item.facilityId ?? operationalContext.nursingHomeId);
        // Reconcile one active physiological alert per resident and alert type.
        // Timeline event
        const ev: TimelineEvent = {
          id: uid(),
          residentId: input.residentId,
          type: "intervention.logged",
          title: `Vital signs recorded`,
          description: `By ${currentUserName}`,
          linkedRecordId: item.id,
          linkedRecordKind: "observation" as any,
          createdAt: now,
          createdBy: currentUserName,
          role: currentRole,
        };
        setStore((s) => {
          const vitals = [item, ...s.vitals];
          const resident = s.residents.find((candidate) => candidate.id === input.residentId);
          const seeds = derivedAlertsForResident(alertVitalsForResident(vitals, s.clinicalObservations, input.residentId), resident, { sourceVitalId: item.id });
          return { ...s, vitals, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, input.residentId, seeds, now), timelineEvents: [ev, ...s.timelineEvents] };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Recorded vital signs",
          entity: item.id,
        });
        return item;
      },

      updateVital: (id, patch, reason) => {
        const now = new Date().toISOString();
        setStore((s) => {
          const vitals = s.vitals.map((v) =>
            v.id === id
              ? (() => {
                  const {
                    news2Score: _ignoredScore,
                    news2Risk: _ignoredRisk,
                    news2Breakdown: _ignoredBreakdown,
                    ...safePatch
                  } = patch;
                  const {
                    news2Score: _oldScore,
                    news2Risk: _oldRisk,
                    news2Breakdown: _oldBreakdown,
                    ...merged
                  } = { ...v, ...safePatch };
                  const news2 = calcNEWS2(merged);
                  const updated = {
                  ...merged,
                  ...(news2.complete
                    ? { news2Score: news2.total, news2Risk: news2.risk, news2Breakdown: news2.breakdown }
                    : {}),
                  modifiedAt: now,
                  modifiedByUserId: currentUser.id,
                  modifiedByName: currentUserName,
                  modifiedReason: reason,
                  auditTrail: [
                    ...v.auditTrail,
                    {
                      id: uid(),
                      action: "edited" as const,
                      byUserId: currentUser.id,
                      byUserName: currentUserName,
                      byRole: currentRole,
                      at: now,
                      reason,
                      patchSummary: Object.keys(patch).join(", "),
                    },
                  ],
                };
                  updated.canonicalObservation = canonicalObservationFromVital({ ...updated, canonicalObservation: undefined }, updated.facilityId ?? operationalContext.nursingHomeId);
                  return updated;
                })()
              : v,
          );
          const changed = vitals.find((v) => v.id === id);
          if (!changed) return s;
          const resident = s.residents.find((r) => r.id === changed.residentId);
          return { ...s, vitals, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, changed.residentId, derivedAlertsForResident(alertVitalsForResident(vitals, s.clinicalObservations, changed.residentId), resident, { sourceVitalId: changed.id }), now, changed.id) };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Edited vital signs",
          entity: id,
          reason,
        });
      },

      softDeleteVital: (id, reason) => {
        const now = new Date().toISOString();
        setStore((s) => {
          const vitals = s.vitals.map((v) =>
            v.id === id
              ? {
                  ...v,
                  deletedAt: now,
                  deletedByUserId: currentUser.id,
                  deletedByName: currentUserName,
                  deletedReason: reason,
                  auditTrail: [
                    ...v.auditTrail,
                    {
                      id: uid(),
                      action: "deleted" as const,
                      byUserId: currentUser.id,
                      byUserName: currentUserName,
                      byRole: currentRole,
                      at: now,
                      reason,
                    },
                  ],
                }
              : v,
          );
          const changed = vitals.find((v) => v.id === id);
          if (!changed) return s;
          const resident = s.residents.find((r) => r.id === changed.residentId);
          return { ...s, vitals, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, changed.residentId, derivedAlertsForResident(alertVitalsForResident(vitals, s.clinicalObservations, changed.residentId), resident, { sourceVitalId: changed.id }), now, changed.id) };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted vital signs",
          entity: id,
          reason,
        });
      },

      setObservationPlan: (residentId, items) => {
        const now = new Date().toISOString();
        setStore((s) => {
          const exists = s.observationPlans.some((p) => p.residentId === residentId);
          const plan: ObservationPlan = {
            residentId,
            items,
            updatedAt: now,
            updatedByName: currentUserName,
          };
          return {
            ...s,
            observationPlans: exists
              ? s.observationPlans.map((p) => (p.residentId === residentId ? plan : p))
              : [...s.observationPlans, plan],
          };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated observation plan",
          entity: residentId,
        });
      },

      acknowledgeClinicalAlert: (id) => {
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          clinicalAlerts: s.clinicalAlerts.map((a) =>
            a.id === id
              ? { ...a, acknowledged: true, acknowledgedBy: currentUserName, acknowledgedAt: now }
              : a,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Acknowledged clinical alert",
          entity: id,
        });
      },

      dismissClinicalAlert: (id, reason = "Reviewed") => {
        const now = new Date().toISOString();
        setStore((s) => ({
          ...s,
          clinicalAlerts: s.clinicalAlerts.map((a) =>
            a.id === id
              ? {
                  ...a,
                  dismissedAt: now,
                  dismissedBy: currentUserName,
                  dismissedReason: reason,
                  ...(reason === "Resolved" ? { resolvedAt: now, resolvedBy: currentUserName } : {}),
                }
              : a,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Dismissed clinical alert",
          entity: id,
          reason,
        });
      },

      addClinicalEscalationNote: (alertId, actionTaken) => {
        const now = new Date().toISOString();
        const note: ClinicalEscalationNote = {
          id: uid(),
          alertId,
          actionTaken,
          enteredByUserId: currentUser.id,
          enteredByName: currentUserName,
          enteredByRole: currentRole,
          at: now,
        };
        setStore((s) => ({
          ...s,
          clinicalAlerts: s.clinicalAlerts.map((a) =>
            a.id === alertId ? { ...a, escalations: [...a.escalations, note] } : a,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Added escalation note",
          entity: alertId,
        });
      },

      regenerateClinicalAlertsForResident: (residentId) => {
        const resident = store.residents.find((r) => r.id === residentId);
        const seeds = derivedAlertsForResident(alertVitalsForResident(store.vitals, store.clinicalObservations, residentId), resident);
        const now = new Date().toISOString();
        setStore((s) => ({ ...s, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, residentId, seeds, now) }));
      },

      // ---- Phase 7: Modular Clinical Observations ----
      recordObservation: (input) => {
        const now = new Date();
        const date = input.date ?? now.toISOString().slice(0, 10);
        const time = input.time ?? now.toTimeString().slice(0, 5);
        const recordedAt = new Date(`${date}T${time}:00`).toISOString();
        const item: ClinicalObservation = {
          id: uid(),
          residentId: input.residentId,
          kind: input.kind,
          date,
          time,
          recordedAt,
          data: observationDataWithNEWS2(input.kind, input.data),
          notes: input.notes,
          recordedByUserId: currentUser.id,
          recordedByName: currentUserName,
          recordedByRole: currentRole,
          createdAt: now.toISOString(),
          auditTrail: [
            {
              id: uid(),
              action: "created",
              byUserId: currentUser.id,
              byUserName: currentUserName,
              byRole: currentRole,
              at: now.toISOString(),
            },
          ],
        };
        setStore((s) => {
          const clinicalObservations = [item, ...s.clinicalObservations];
          const resident = s.residents.find((candidate) => candidate.id === input.residentId);
          const seeds = derivedAlertsForResident(
            alertVitalsForResident(s.vitals, clinicalObservations, input.residentId),
            resident,
            { sourceVitalId: item.id },
          );
          return {
            ...s,
            clinicalObservations,
            clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, input.residentId, seeds, now.toISOString()),
          };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Recorded ${input.kind} observation`,
          entity: input.residentId,
        });
        return item;
      },
      updateObservation: (id, patch, reason) => {
        const now = new Date().toISOString();
        setStore((s) => {
          const clinicalObservations = s.clinicalObservations.map((o) =>
            o.id === id
              ? {
                  ...o,
                  data: observationDataWithNEWS2(o.kind, patch.data ?? o.data),
                  notes: patch.notes ?? o.notes,
                  modificationReason: reason,
                  modifiedAt: now,
                  modifiedByName: currentUserName,
                  auditTrail: [
                    ...o.auditTrail,
                    {
                      id: uid(),
                      action: "edited",
                      byUserId: currentUser.id,
                      byUserName: currentUserName,
                      byRole: currentRole,
                      at: now,
                      reason,
                    },
                  ],
                }
              : o,
          );
          const changed = clinicalObservations.find((observation) => observation.id === id);
          if (!changed) return s;
          const resident = s.residents.find((candidate) => candidate.id === changed.residentId);
          const seeds = derivedAlertsForResident(alertVitalsForResident(s.vitals, clinicalObservations, changed.residentId), resident, { sourceVitalId: changed.id });
          return { ...s, clinicalObservations, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, changed.residentId, seeds, now, changed.id) };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Edited observation",
          entity: id,
          reason,
        });
      },
      softDeleteObservation: (id, reason) => {
        const now = new Date().toISOString();
        setStore((s) => {
          const clinicalObservations = s.clinicalObservations.map((o) =>
            o.id === id
              ? {
                  ...o,
                  deletedAt: now,
                  deletedByName: currentUserName,
                  deletedReason: reason,
                  auditTrail: [
                    ...o.auditTrail,
                    {
                      id: uid(),
                      action: "deleted",
                      byUserId: currentUser.id,
                      byUserName: currentUserName,
                      byRole: currentRole,
                      at: now,
                      reason,
                    },
                  ],
                }
              : o,
          );
          const changed = clinicalObservations.find((observation) => observation.id === id);
          if (!changed) return s;
          const resident = s.residents.find((candidate) => candidate.id === changed.residentId);
          const seeds = derivedAlertsForResident(alertVitalsForResident(s.vitals, clinicalObservations, changed.residentId), resident, { sourceVitalId: changed.id });
          return { ...s, clinicalObservations, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, changed.residentId, seeds, now, changed.id) };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted observation",
          entity: id,
          reason,
        });
      },
      setObservationSchedule: (residentId, items) => {
        const now = new Date().toISOString();
        setStore((s) => {
          const exists = s.observationSchedules.some((p) => p.residentId === residentId);
          const sched: ObservationSchedule = {
            residentId,
            items,
            updatedAt: now,
            updatedByName: currentUserName,
          };
          return {
            ...s,
            observationSchedules: exists
              ? s.observationSchedules.map((p) => (p.residentId === residentId ? sched : p))
              : [...s.observationSchedules, sched],
          };
        });
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated observation schedule",
          entity: residentId,
        });
      },
    }),
    [
      store,
      scopedStore,
      activeFacilityId,
      activeFacility,
      setActiveFacilityId,
      logAudit,
      currentRole,
      currentUserName,
      currentUser,
      filter,
      filteredResidentIds,
      workOrderExecutionContext,
      requireContractorCapability,
      ensureContractorHomeScope,
      ensureContractorEntityScope,
      setStore,
      setCurrentRole,
      resetToDemoData,
    ],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCare() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCare must be used within CareProvider");
  return ctx;
}

export function age(dob: string) {
  const d = new Date(dob);
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 86400000));
}

export function initials(first: string, last: string) {
  return (first[0] || "") + (last[0] || "");
}

// Helper: filter any array by residentId using current filter
export function useFilteredByResident<T extends { residentId?: string }>(items: T[]): T[] {
  const { filteredResidentIds, filter } = useCare();
  if (!filter.wingId && !filter.unitId && !filter.roomId && !filter.residentId && !filter.status)
    return items;
  const set = new Set(filteredResidentIds);
  return items.filter((i) => i.residentId === undefined || set.has(i.residentId));
}
