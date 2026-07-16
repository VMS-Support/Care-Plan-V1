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
  CarePlan,
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
  CarePlanEvaluation,
  CarePlanReview,
  InterventionLog,
  ReadReceipt,
  CarePlanTemplate,
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
} from "./types";
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
  generateTrainingAssignmentsForCurrentStaff,
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
import { BUILT_IN_TEMPLATES } from "./templates";
import { migrateLegacy, suggestionsForAssessment, newId } from "./problems";
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

let _uidSeq = 0;
const uid = () => `id-${(++_uidSeq).toString(36).padStart(6, "0")}`;
const STORE_STORAGE_KEY = "carepath-pro-data";
const LEGACY_STORE_STORAGE_KEY = "carepath-pro-store";
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

const PHYSIOLOGICAL_ALERT_TYPES = new Set<ClinicalAlert["type"]>([
  "weight_loss", "weight_gain", "high_news2", "abnormal_bp", "abnormal_temp",
  "low_spo2", "high_pain", "hypoglycaemia", "hyperglycaemia", "fluid_imbalance",
]);

function reconcileClinicalAlerts(
  existing: ClinicalAlert[],
  residentId: string,
  seeds: AlertSeed[],
  now: string,
) {
  const next = [...existing];
  const activeForResident = next.filter(
    (alert) => alert.residentId === residentId && PHYSIOLOGICAL_ALERT_TYPES.has(alert.type) && !alert.dismissedAt && !alert.resolvedAt,
  );
  const generatedTypes = new Set(seeds.map((seed) => seed.type));

  for (const alert of activeForResident) {
    if (!generatedTypes.has(alert.type)) {
      const index = next.findIndex((candidate) => candidate.id === alert.id);
      next[index] = { ...alert, resolvedAt: now, resolvedBy: "System", updatedAt: now };
    }
  }

  for (const seed of seeds) {
    const active = activeForResident.find((alert) => alert.type === seed.type);
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
  const carePlans: CarePlan[] = [];
  const interventions: Intervention[] = [];
  const notes: DailyNote[] = [];
  const evaluations: Evaluation[] = [];
  const carePlanEvaluations: CarePlanEvaluation[] = [];
  const carePlanReviews: CarePlanReview[] = [];
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

    // === MARGARET THOMPSON (i === 0): SINGLE UNIFIED CARE PLAN ===
    if (i === 0) {
      // ONE comprehensive care plan with MULTIPLE PROBLEMS and 2 INTERVENTIONS
      const margaretCarePlan: CarePlan = {
        id: uid(),
        residentId: r.id,
        title: "Comprehensive Multidomain Care Plan",
        category: "Complex Care",
        problem:
          "Multiple concurrent care needs: Waterlow 32 (very high pressure risk), Falls risk (17), MNA nutrition risk, MMSE cognitive impairment (11/30), moderate pain",
        goal: "Holistic management across all domains: maintain skin integrity, prevent falls, optimize nutrition, support cognition, manage pain",
        identifiedNeeds: [
          "Pressure Area Care",
          "Falls Prevention",
          "Nutrition Support",
          "Cognition Support",
          "Pain Management",
          "ADL Assistance",
          "Safety",
          "Holistic Care Coordination",
        ],
        interventions: [
          "2-hourly repositioning & pressure area care bundle",
          "Multidomain safety & support plan (falls + cognition + nutrition support + ADL assistance)",
        ],
        assignedStaff: "Nursing team (primary: J. Roberts RN)",
        frequency:
          "Continuous monitoring; repositioning 2-hourly; meals & hydration 3x daily; cognition support each interaction",
        reviewDate: daysAhead(5).slice(0, 10),
        evaluationDate: daysAhead(14).slice(0, 10),
        status: "active",
        priority: "critical",
        createdAt: daysAgo(20),
        createdBy: "J. Roberts (RN)",
        version: 1,
      };
      carePlans.push(margaretCarePlan);

      // Single review for the unified care plan
      carePlanReviews.push({
        id: uid(),
        carePlanId: margaretCarePlan.id,
        date: daysAgo(3).slice(0, 10),
        reviewer: "J. Roberts (RN)",
        role: "nurse",
        notes:
          "Comprehensive plan reviewed across all domains. Repositioning compliance good. Skin integrity maintained. Fall prevention protocol adhered to. Nutrition supplementation accepted. Cognition support strategies effective. Continue current unified approach.",
        outcome: "continue",
      });

      // Single evaluation for the unified care plan
      carePlanEvaluations.push({
        id: uid(),
        carePlanId: margaretCarePlan.id,
        date: daysAgo(1).slice(0, 10),
        evaluatedBy: "L. Mensah (RN)",
        role: "nurse",
        summary:
          "All care plan goals progressing. Skin intact, no pressure damage. Falls prevented with 2-person assist protocol. Nutrition stable with supplement acceptance. Cognition support reducing distress episodes. Pain levels acceptable. Overall good progress across all domains.",
        goalsMet: "yes",
        outcomeRating: "good",
        recommendations:
          "Maintain current unified approach. Re-assess all domains at 4-week review. Continue 2-person assists and 2-hourly repositioning.",
        reviseRequired: false,
        nextEvaluationDate: daysAhead(28).slice(0, 10),
      });
    } else {
      // === GENERIC SCENARIO-BASED APPROACH FOR OTHER RESIDENTS (i > 0) ===
      const scenario = scenarioBlueprints[i % scenarioBlueprints.length];
      const primaryCarePlan: CarePlan = {
        id: uid(),
        residentId: r.id,
        title: scenario.title,
        category: scenario.category,
        problem: scenario.problem,
        goal: scenario.goal,
        identifiedNeeds: [scenario.category, "Safety", "Person-centred care"],
        interventions: scenario.interventions,
        assignedStaff: i % 2 === 0 ? "Nursing team" : "Care team",
        frequency: scenario.frequency,
        reviewDate: daysAhead(6 + (i % 5)).slice(0, 10),
        evaluationDate: daysAhead(12 + (i % 6)).slice(0, 10),
        status: i % 5 === 0 ? "review_due" : "active",
        priority: scenario.priority,
        createdAt: daysAgo(20 + (i % 8)),
        createdBy: i % 2 === 0 ? "J. Roberts (RN)" : "L. Mensah (RN)",
        version: 1,
      };
      carePlans.push(primaryCarePlan);

      if (i % 3 !== 2) {
        carePlanReviews.push({
          id: uid(),
          carePlanId: primaryCarePlan.id,
          date: daysAgo(4 + (i % 4)).slice(0, 10),
          reviewer: i % 2 === 0 ? "J. Roberts (RN)" : "M. O'Brien (CNM)",
          role: i % 2 === 0 ? "nurse" : "cnm",
          notes: "Plan reviewed with frontline staff; interventions remain clinically appropriate.",
          outcome: i % 4 === 0 ? "modify" : "continue",
        });
      }
      if (i % 4 === 0) {
        carePlanEvaluations.push({
          id: uid(),
          carePlanId: primaryCarePlan.id,
          date: daysAgo(2).slice(0, 10),
          evaluatedBy: "J. Roberts (RN)",
          role: "nurse",
          summary:
            "Resident response improving; continue current interventions with close monitoring.",
          goalsMet: "partially",
          outcomeRating: "good",
          recommendations: "Re-evaluate at next MDT and maintain daily monitoring.",
          reviseRequired: false,
          nextEvaluationDate: daysAhead(14).slice(0, 10),
        });
      }
    } // END Margaret vs other residents

    if (i > 0 && (w.riskLevel === "high" || w.riskLevel === "very_high")) {
      const pressurePlan: CarePlan = {
        id: uid(),
        residentId: r.id,
        title: "Pressure Area Care",
        category: "Pressure Care",
        problem: `Waterlow ${w.totalScore} indicates ${w.interpretation.toLowerCase()}.`,
        goal: "Maintain intact skin with no avoidable pressure damage.",
        identifiedNeeds: ["Skin Integrity", "Repositioning", "Nutrition"],
        interventions: [
          "Reposition at prescribed interval",
          "Document skin inspection every shift",
          "Use pressure-relieving surface",
          "Escalate category >=1 skin damage immediately",
        ],
        assignedStaff: "Care and nursing team",
        frequency: w.riskLevel === "very_high" ? "2-hourly" : "3-hourly",
        reviewDate: daysAhead(5).slice(0, 10),
        evaluationDate: daysAhead(10).slice(0, 10),
        status: "active",
        priority: w.riskLevel === "very_high" ? "critical" : "high",
        createdAt: daysAgo(12),
        createdBy: "J. Roberts (RN)",
        version: 1,
      };
      carePlans.push(pressurePlan);
    }
    if (i > 0 && a.totalScore >= 8) {
      carePlans.push({
        id: uid(),
        residentId: r.id,
        title: "Acute Pain Control",
        category: "Pain Management",
        problem: `Abbey Pain score ${a.totalScore}: ${a.interpretation}.`,
        goal: "Pain reduced to acceptable level within 72 hours.",
        identifiedNeeds: ["Pain Monitoring", "Comfort Measures"],
        interventions: [
          "Administer prescribed analgesia",
          "Re-assess pain within 60 minutes",
          "Document non-pharmacological strategies",
        ],
        assignedStaff: "Nurse in charge",
        frequency: "4-hourly",
        reviewDate: daysAhead(3).slice(0, 10),
        evaluationDate: daysAhead(7).slice(0, 10),
        status: "active",
        priority: a.totalScore >= 14 ? "critical" : "high",
        createdAt: daysAgo(6),
        createdBy: "L. Mensah (RN)",
        version: 1,
      });
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
        createdAt: new Date().toISOString(),
        acknowledged: false,
        escalations: [],
      });
    });
  });

  // ---- Migrate legacy care plans into unified resident-care-plan / problems model ----
  const migrated = migrateLegacy(
    carePlans,
    carePlanEvaluations,
    carePlanReviews,
    [] as InterventionLog[],
  );

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
    carePlans,
    interventions,
    notes,
    evaluations,
    carePlanEvaluations,
    carePlanReviews,
    alerts,
    alertWorkflow: {} as Record<string, ActionAlertWorkflow>,
    tasks,
    auditLogs: [] as AuditLog[],
    incidents,
    mdtNotes,
    visitors,
    outings,
    handovers,
    interventionLogs: [] as InterventionLog[],
    readReceipts: [] as ReadReceipt[],
    carePlanTemplates: BUILT_IN_TEMPLATES.map((t) => ({
      ...t,
      editable: true,
    })) as CarePlanTemplate[],
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
    legacyCarePlanIdToProblemId: migrated.legacyCarePlanIdToProblemId,
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
  "carePlans",
  "interventions",
  "notes",
  "evaluations",
  "carePlanEvaluations",
  "carePlanReviews",
  "alerts",
  "tasks",
  "auditLogs",
  "incidents",
  "mdtNotes",
  "visitors",
  "outings",
  "handovers",
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
  const carePlanIds = new Set(
    store.carePlans
      .filter((plan) => hasFacility(plan, activeFacilityId) && residentIds.has(plan.residentId))
      .map((plan) => plan.id),
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
      if (record.carePlanId && !carePlanIds.has(record.carePlanId)) return false;
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
    name: string;
    role: Role;
    email: string;
    temporaryPassword?: string;
    status: UserProfile["status"];
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
  assignTrainingToStaff: (input: AssignTrainingCommand) => StaffTrainingAssignment;
  recordTrainingCompletion: (input: RecordTrainingCompletionCommand) => StaffTrainingCompletion;
  verifyTrainingCompletion: (id: string) => void;
  generateTrainingAssignments: () => number;
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
  // care plans
  addCarePlan: (c: Omit<CarePlan, "id" | "createdAt">) => CarePlan;
  updateCarePlan: (id: string, patch: Partial<CarePlan>) => void;
  reviseCarePlan: (id: string, reason: string) => CarePlan | undefined;
  addCarePlanEvaluation: (e: Omit<CarePlanEvaluation, "id">) => CarePlanEvaluation;
  addCarePlanReview: (r: Omit<CarePlanReview, "id">) => CarePlanReview;
  addCarePlanFromTemplate: (
    templateId: string,
    residentId: string,
    assessment?: Assessment,
  ) => CarePlan | undefined;
  saveCarePlanTemplate: (t: CarePlanTemplate) => void;
  deleteCarePlanTemplate: (id: string) => void;
  // intervention logs
  addInterventionLog: (l: Omit<InterventionLog, "id">) => InterventionLog;
  // read receipts
  recordReadReceipt: (entityType: ReadReceipt["entityType"], entityId: string) => void;
  // misc
  addIntervention: (i: Omit<Intervention, "id">) => Intervention;
  addNote: (n: Omit<DailyNote, "id">) => DailyNote;
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
      if (user) setCurrentUserId(user.id);
    },
    [activeFacilityId, store.users],
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
        const existingDon = store.users.some(
          (user) =>
            user.role === "don" &&
            userFacilityIds(user).includes(activeFacilityId),
        );
        if (input.role === "don" && existingDon) {
          throw new Error("This nursing home already has a DON.");
        }
        const now = new Date().toISOString();
        const staffUser: UserProfile = {
          id: `u-${activeFacilityId.replace("facility-", "")}-${uid()}`,
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
        setStore((s) => ({ ...s, users: [staffUser, ...s.users] }));
        logAudit({
          facilityId: activeFacilityId,
          user: currentUserName,
          role: currentRole,
          action: "Created staff account",
          entity: staffUser.id,
          after: JSON.stringify({ role: staffUser.role, user: staffUser.name }),
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
      assignTrainingToStaff: (input) => {
        const assignment = assignTrainingToStaff(store, input);
        const now = new Date().toISOString();
        const event: TrainingEvent = { id: `training-event-${uid()}`, type: "TrainingAssignmentCreated", staffMemberId: assignment.staffMemberId, employmentRecordId: assignment.employmentRecordId, trainingCourseId: assignment.trainingCourseId, trainingRequirementId: assignment.trainingRequirementId, trainingAssignmentId: assignment.id, safeStatus: assignment.status, dueDate: assignment.dueDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: input.clientRequestId };
        setStore((s) => ({ ...s, staffTrainingAssignments: [assignment, ...s.staffTrainingAssignments], trainingEvents: [event, ...(s.trainingEvents || [])], auditLogs: [{ id: uid(), facilityId: activeFacilityId, user: currentUserName, role: currentRole, action: "Training Assignment created", entity: String(assignment.id), entityType: "training_assignment", timestamp: now, after: JSON.stringify({ trainingCourseId: assignment.trainingCourseId, dueDate: assignment.dueDate }) }, ...s.auditLogs].slice(0, 500) }));
        return assignment;
      },
      recordTrainingCompletion: (input) => {
        const completion = recordTrainingCompletion(store, input, currentUser.id);
        const now = new Date().toISOString();
        const event: TrainingEvent = { id: `training-event-${uid()}`, type: "TrainingCompletionRecorded", staffMemberId: completion.staffMemberId, employmentRecordId: completion.employmentRecordId, trainingCourseId: completion.trainingCourseId, trainingAssignmentId: completion.trainingAssignmentId, trainingCompletionId: completion.id, safeStatus: completion.status, expiryDate: completion.expiryDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: input.clientRequestId };
        setStore((s) => ({
          ...s,
          staffTrainingCompletions: [completion, ...s.staffTrainingCompletions],
          staffTrainingAssignments: completion.trainingAssignmentId ? s.staffTrainingAssignments.map((assignment) => assignment.id === completion.trainingAssignmentId ? { ...assignment, latestCompletionId: completion.id, status: completion.status === "verified" ? "completed" : "in_progress", updatedAt: now } : assignment) : s.staffTrainingAssignments,
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
      generateTrainingAssignments: () => {
        const assignments = generateTrainingAssignmentsForCurrentStaff(store, currentUser.id);
        if (!assignments.length) return 0;
        const now = new Date().toISOString();
        const events = assignments.map((assignment): TrainingEvent => ({ id: `training-event-${uid()}`, type: "TrainingAssignmentCreated", staffMemberId: assignment.staffMemberId, employmentRecordId: assignment.employmentRecordId, trainingCourseId: assignment.trainingCourseId, trainingRequirementId: assignment.trainingRequirementId, trainingAssignmentId: assignment.id, safeStatus: assignment.status, dueDate: assignment.dueDate, actorUserAccountId: currentUser.id, occurredAt: now, correlationId: `training-generation-${now}` }));
        setStore((s) => ({ ...s, staffTrainingAssignments: [...assignments, ...s.staffTrainingAssignments], trainingEvents: [...events, ...(s.trainingEvents || [])] }));
        return assignments.length;
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
        const carePlanIdsForCount = new Set(
          store.carePlans.filter((carePlan) => carePlan.residentId === id).map((carePlan) => carePlan.id),
        );
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
          store.carePlans.filter((item) => item.residentId === id).length,
          store.carePlanEvaluations.filter((item) => carePlanIdsForCount.has(item.carePlanId)).length,
          store.carePlanReviews.filter((item) => carePlanIdsForCount.has(item.carePlanId)).length,
          store.interventions.filter((item) => item.residentId === id).length,
          store.interventionLogs.filter((item) => item.residentId === id || carePlanIdsForCount.has(item.carePlanId)).length,
          store.notes.filter((item) => item.residentId === id).length,
          store.evaluations.filter((item) => carePlanIdsForCount.has(item.carePlanId)).length,
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
        const markArchived = <T extends { id?: string }>(item: T) => {
          return {
            ...item,
            archivedAt: (item as any).archivedAt || now,
            archivedBy: (item as any).archivedBy || currentUserName,
            archivedReason: (item as any).archivedReason || deleteReason,
          };
        };

        setStore((s) => {
          const carePlanIds = new Set(
            s.carePlans.filter((carePlan) => carePlan.residentId === id).map((carePlan) => carePlan.id),
          );
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
            carePlans: s.carePlans.map((item) =>
              item.residentId === id
                ? {
                    ...markArchived(item),
                    status: "archived" as const,
                    updatedAt: now,
                    updatedBy: currentUserName,
                  }
                : item,
            ),
            carePlanEvaluations: s.carePlanEvaluations.map((item) =>
              carePlanIds.has(item.carePlanId) ? markDeleted(item) : item,
            ),
            carePlanReviews: s.carePlanReviews.map((item) =>
              carePlanIds.has(item.carePlanId) ? markDeleted(item) : item,
            ),
            interventions: s.interventions.map((item) =>
              item.residentId === id ? markDeleted(item) : item,
            ),
            interventionLogs: s.interventionLogs.map((item) =>
              item.residentId === id || carePlanIds.has(item.carePlanId) ? markDeleted(item) : item,
            ),
            notes: s.notes.map((item) => (item.residentId === id ? markDeleted(item) : item)),
            evaluations: s.evaluations.map((item) =>
              carePlanIds.has(item.carePlanId) ? markDeleted(item) : item,
            ),
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
      addCarePlan: (c) => {
        const item: CarePlan = {
          ...c,
          id: uid(),
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
          version: c.version || 1,
          status: c.status || "active",
        };
        setStore((s) => ({ ...s, carePlans: [item, ...s.carePlans] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Created care plan",
          entity: item.id,
        });
        return item;
      },
      updateCarePlan: (id, patch) => {
        setStore((s) => ({
          ...s,
          carePlans: s.carePlans.map((c) =>
            c.id === id
              ? { ...c, ...patch, updatedAt: new Date().toISOString(), updatedBy: currentUserName }
              : c,
          ),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Updated care plan",
          entity: id,
        });
      },
      reviseCarePlan: (id, reason) => {
        const prior = store.carePlans.find((c) => c.id === id);
        if (!prior) return undefined;
        const newPlan: CarePlan = {
          ...prior,
          id: uid(),
          version: (prior.version || 1) + 1,
          supersedesId: prior.id,
          revisionReason: reason,
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
          status: "active",
        };
        setStore((s) => ({
          ...s,
          carePlans: [
            newPlan,
            ...s.carePlans.map((c) => (c.id === id ? { ...c, status: "superseded" as const } : c)),
          ],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Revised care plan",
          entity: id,
          reason,
        });
        return newPlan;
      },
      addCarePlanEvaluation: (e) => {
        const item: CarePlanEvaluation = { ...e, id: uid() };
        setStore((s) => ({ ...s, carePlanEvaluations: [item, ...s.carePlanEvaluations] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Care plan evaluation",
          entity: e.carePlanId,
        });
        return item;
      },
      addCarePlanReview: (r) => {
        const item: CarePlanReview = { ...r, id: uid() };
        setStore((s) => ({ ...s, carePlanReviews: [item, ...s.carePlanReviews] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Care plan review",
          entity: r.carePlanId,
        });
        return item;
      },
      addCarePlanFromTemplate: (templateId, residentId, assessment) => {
        const t = store.carePlanTemplates.find((x) => x.id === templateId);
        if (!t) return undefined;
        const now = new Date();
        const dayStr = (d: number) =>
          new Date(now.getTime() + d * 86400000).toISOString().slice(0, 10);
        const goals = t.smartGoals.map((g, i) => ({
          id: `g-${uid()}-${i}`,
          title: g.title,
          description: g.description,
          priority: g.priority,
          status: "not_started" as const,
          targetDate: dayStr(g.targetDays),
          expectedOutcome: g.description,
        }));
        const interventionsSpec = t.interventions.map((it, i) => ({
          id: `i-${uid()}-${i}`,
          name: it.name,
          description: it.description,
          frequency: it.frequency,
          assignedRole: it.assignedRole,
          startDate: dayStr(0),
          reviewDate: dayStr(t.reviewFrequencyDays),
          priority: it.priority,
          status: "pending" as const,
        }));
        const outcomeMeasures = t.outcomeMeasures.map((o, i) => ({
          id: `o-${uid()}-${i}`,
          name: o.name,
          target: o.target,
          dateMeasured: dayStr(0),
          trend: "stable" as const,
        }));
        const newPlan: CarePlan = {
          id: uid(),
          residentId,
          title: t.title,
          category: t.category,
          problem: t.problemStatement,
          problemStatement: t.problemStatement,
          goal: t.smartGoals[0]?.description || "Address identified needs.",
          identifiedNeeds: t.identifiedNeeds,
          interventions: t.interventions.map((i) => `${i.name} (${i.frequency})`),
          goals,
          interventionsSpec,
          outcomeMeasures,
          assignedStaff: "Care team",
          frequency: t.interventions[0]?.frequency || "Per care plan",
          reviewDate: dayStr(t.reviewFrequencyDays),
          evaluationDate: dayStr(t.evaluationFrequencyDays),
          status: "active",
          priority:
            assessment?.riskLevel === "very_high"
              ? "critical"
              : assessment?.riskLevel === "high"
                ? "high"
                : "medium",
          createdAt: now.toISOString(),
          createdBy: currentUserName,
          version: 1,
          templateId,
          linkedAssessmentId: assessment?.id,
          assessmentScoreSnapshot: assessment
            ? {
                type: assessment.type,
                totalScore: assessment.totalScore,
                riskLevel: assessment.riskLevel,
                date: assessment.date,
                interpretation: assessment.interpretation,
              }
            : undefined,
        };
        setStore((s) => ({ ...s, carePlans: [newPlan, ...s.carePlans] }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Created care plan from template '${t.title}'`,
          entity: newPlan.id,
        });
        return newPlan;
      },
      saveCarePlanTemplate: (t) => {
        setStore((s) => ({
          ...s,
          carePlanTemplates: s.carePlanTemplates.some((x) => x.id === t.id)
            ? s.carePlanTemplates.map((x) => (x.id === t.id ? t : x))
            : [...s.carePlanTemplates, t],
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: `Saved template '${t.title}'`,
          entity: t.id,
        });
      },
      deleteCarePlanTemplate: (id) => {
        setStore((s) => ({
          ...s,
          carePlanTemplates: s.carePlanTemplates.filter((t) => t.id !== id || t.builtIn),
        }));
        logAudit({
          user: currentUserName,
          role: currentRole,
          action: "Deleted template",
          entity: id,
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
        const item = { ...n, id: uid() };
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
        return item;
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
          const seeds = derivedAlertsForResident(alertVitalsForResident(vitals, s.clinicalObservations, input.residentId), resident);
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
          return { ...s, vitals, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, changed.residentId, derivedAlertsForResident(alertVitalsForResident(vitals, s.clinicalObservations, changed.residentId), resident), now) };
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
          return { ...s, vitals, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, changed.residentId, derivedAlertsForResident(alertVitalsForResident(vitals, s.clinicalObservations, changed.residentId), resident), now) };
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
          const seeds = derivedAlertsForResident(alertVitalsForResident(s.vitals, clinicalObservations, changed.residentId), resident);
          return { ...s, clinicalObservations, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, changed.residentId, seeds, now) };
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
          const seeds = derivedAlertsForResident(alertVitalsForResident(s.vitals, clinicalObservations, changed.residentId), resident);
          return { ...s, clinicalObservations, clinicalAlerts: reconcileClinicalAlerts(s.clinicalAlerts, changed.residentId, seeds, now) };
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
