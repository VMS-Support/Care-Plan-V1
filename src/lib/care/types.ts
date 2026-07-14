export type Role = "carer" | "nurse" | "doctor" | "cnm" | "don";
export type ResidentType = "active" | "inactive" | "active_respite" | "inactive_respite";
export type ResidentStatus = "active" | "discharged" | "deceased" | "deleted";

import type {
  AbsenceEpisodeId,
  AdmissionId,
  AuditRecordId,
  BedAssignmentId,
  BedId,
  EmploymentRecordId,
  EnterpriseId,
  HomeAssignmentId,
  PermissionGrantId,
  ProfessionalRegistrationId,
  ResidentId,
  RoleAssignmentId,
  RoleTemplateId,
  RosterAssignmentId,
  NursingHomeId,
  OperationalContextId,
  RoomId,
  StaffMemberId,
  ShiftId,
  UserAccountId,
  WardId,
  WardCompetencyId,
} from "@/types/entityIds";

export type ResidentLifecycleStatus =
  | "pre_admission"
  | "admission_scheduled"
  | "active"
  | "discharged"
  | "deceased"
  | "inactive";
export type AdmissionType = "long_term" | "respite" | "short_stay" | "other";
export type ResidentPresenceStatus = "in_home" | "temporarily_absent" | "in_hospital" | "unknown";
export type AbsenceType = "temporary_leave" | "hospital_transfer";
export type EmploymentType =
  | "permanent"
  | "fixed_term"
  | "temporary"
  | "agency"
  | "bank"
  | "contractor"
  | "volunteer"
  | "other";
export type EmploymentStatus = "planned" | "active" | "on_leave" | "suspended" | "ended";
export type RegistrationStatus =
  | "active"
  | "expiring"
  | "expired"
  | "suspended"
  | "not_required"
  | "unknown";
export type WardCompetencyStatus = "approved" | "supervised_only" | "not_approved" | "expired";
export type PermissionScopeType =
  | "self"
  | "ward"
  | "nursing_home"
  | "multiple_homes"
  | "enterprise"
  | "global_system";

export interface UserAccount {
  id: UserAccountId;
  email?: string;
  username?: string;
  authenticationProvider?: string;
  externalAuthId?: string;
  staffMemberId?: StaffMemberId;
  accountStatus: "invited" | "active" | "suspended" | "locked" | "disabled";
  lastLoginAt?: string;
  passwordChangedAt?: string;
  defaultNursingHomeId?: NursingHomeId;
  defaultWardId?: WardId;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserAccountId;
  updatedBy?: UserAccountId;
}

export interface StaffMember {
  id: StaffMemberId;
  firstName: string;
  lastName: string;
  preferredName?: string;
  displayName: string;
  title?: string;
  phone?: string;
  email?: string;
  active: boolean;
  staffNumber?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserAccountId;
  updatedBy?: UserAccountId;
}

export interface EmploymentRecord {
  id: EmploymentRecordId;
  staffMemberId: StaffMemberId;
  nursingHomeId: NursingHomeId;
  enterpriseId?: EnterpriseId;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  jobTitle: string;
  department?: string;
  startDate: string;
  endDate?: string;
  contractedHoursPerWeek?: number;
  managerStaffMemberId?: StaffMemberId;
  agencyName?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserAccountId;
  updatedBy?: UserAccountId;
}

export interface RoleAssignment {
  id: RoleAssignmentId;
  staffMemberId: StaffMemberId;
  userAccountId?: UserAccountId;
  roleKey: "DON" | "CNM" | "NURSE" | "HCA" | "DOCTOR" | string;
  enterpriseId?: EnterpriseId;
  nursingHomeId?: NursingHomeId;
  wardId?: WardId;
  effectiveFrom: string;
  effectiveTo?: string;
  status: "active" | "inactive" | "expired";
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserAccountId;
  updatedBy?: UserAccountId;
}

export interface ProfessionalRegistration {
  id: ProfessionalRegistrationId;
  staffMemberId: StaffMemberId;
  profession: "nurse" | "doctor" | "allied_health" | "other";
  registrationBody: string;
  registrationNumber?: string;
  registrationStatus: RegistrationStatus;
  issueDate?: string;
  expiryDate?: string;
  verifiedAt?: string;
  verifiedBy?: UserAccountId;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomeAssignment {
  id: HomeAssignmentId;
  staffMemberId: StaffMemberId;
  nursingHomeId: NursingHomeId;
  status: "active" | "inactive";
  validFrom: string;
  validTo?: string;
  assignmentType: "primary" | "secondary" | "temporary" | "agency" | "enterprise_oversight";
  createdAt: string;
  updatedAt: string;
  createdBy?: UserAccountId;
}

export interface WardCompetency {
  id: WardCompetencyId;
  staffMemberId: StaffMemberId;
  nursingHomeId: NursingHomeId;
  wardId: WardId;
  status: WardCompetencyStatus;
  effectiveFrom: string;
  effectiveTo?: string;
  competencyAreas?: string[];
  approvedBy?: StaffMemberId;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RosterAssignment {
  id: RosterAssignmentId;
  staffMemberId: StaffMemberId;
  nursingHomeId: NursingHomeId;
  wardId?: WardId;
  shiftId?: string;
  startDateTime: string;
  endDateTime: string;
  roleKey: string;
  status: "planned" | "confirmed" | "in_progress" | "completed" | "cancelled" | "absent";
  source: "manual" | "roster" | "agency" | "temporary_cover";
  createdAt: string;
  updatedAt: string;
}

export interface PermissionGrant {
  id: PermissionGrantId;
  userAccountId?: UserAccountId;
  staffMemberId?: StaffMemberId;
  roleAssignmentId?: RoleAssignmentId;
  capability: string;
  scopeType: PermissionScopeType;
  enterpriseId?: EnterpriseId;
  nursingHomeId?: NursingHomeId;
  wardId?: WardId;
  effect: "allow" | "deny";
  effectiveFrom: string;
  effectiveTo?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserAccountId;
}

export interface RoleTemplate {
  id: RoleTemplateId;
  key: "DON" | "CNM" | "NURSE" | "HCA" | "DOCTOR" | string;
  name: string;
  description?: string;
  capabilities: string[];
  active: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type AuditActorType = "user" | "system" | "integration" | "migration" | "anonymous";
export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "inactivate"
  | "reactivate"
  | "archive"
  | "restore"
  | "complete"
  | "cancel"
  | "defer"
  | "void"
  | "correct"
  | "acknowledge"
  | "resolve"
  | "dismiss"
  | "assign"
  | "unassign"
  | "move"
  | "admit"
  | "transfer"
  | "return"
  | "discharge"
  | "mark_deceased"
  | "grant_permission"
  | "deny_permission"
  | "login"
  | "logout"
  | "access_denied"
  | "export"
  | "import"
  | "migrate";
export type AuditSource =
  | "user_interface"
  | "api"
  | "integration"
  | "migration"
  | "background_job"
  | "rule_engine"
  | "system";
export type AuditDataClassification = "standard" | "sensitive" | "highly_sensitive";

export interface AuditFieldChange {
  field: string;
  displayName?: string;
  previousValue?: unknown;
  newValue?: unknown;
  dataClassification?: AuditDataClassification;
}

export interface AuditRecord {
  id: AuditRecordId;
  occurredAt: string;
  recordedAt: string;
  effectiveAt?: string;
  actorType: AuditActorType;
  actorUserAccountId?: UserAccountId;
  actorStaffMemberId?: StaffMemberId;
  actorDisplayName?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  parentEntityType?: string;
  parentEntityId?: string;
  enterpriseId?: EnterpriseId;
  nursingHomeId?: NursingHomeId;
  wardId?: WardId;
  roomId?: RoomId;
  bedId?: BedId;
  residentId?: ResidentId;
  summary: string;
  changes?: AuditFieldChange[];
  reasonCode?: string;
  reasonText?: string;
  source: AuditSource;
  requestId?: string;
  correlationId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  schemaVersion: number;
}

export interface ShiftDefinition {
  id: ShiftId;
  nursingHomeId: NursingHomeId;
  label: "Day Shift" | "Late Shift" | "Night Shift" | string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  sortOrder: number;
}

export type WardSelectionMode = "single" | "multiple" | "all_authorised";
export type ContextSource = "default" | "stored" | "manual_override" | "system_repair";

export interface OperationalContext {
  id: OperationalContextId;
  userAccountId: UserAccountId;
  staffMemberId?: StaffMemberId;
  nursingHomeId: NursingHomeId;
  wardSelectionMode: WardSelectionMode;
  wardIds: WardId[];
  shiftId: ShiftId;
  shiftLabel: string;
  shiftStartAt: string;
  shiftEndAt: string;
  operationalDate: string;
  timezone: string;
  effectiveRoleKey: string;
  source: ContextSource;
  updatedAt: string;
}

export interface Enterprise {
  id: EnterpriseId;
  name: string;
  legalName?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Facility {
  id: string;
  enterpriseId?: EnterpriseId;
  name: string;
  status: "active" | "inactive";
  timezone?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
}
export type AssessmentType =
  | "barthel"
  | "waterlow"
  | "abbey_pain"
  | "mna"
  | "norton"
  | "nutrition"
  | "pinch_me"
  | "mmse"
  | "four_at"
  | "gds15"
  | "cornell"
  | "must"
  | "continence"
  | "pain_chart"
  | "falls"
  | "abc"
  | "abs";
export type RltDomainId =
  | "safe_environment"
  | "communication"
  | "breathing"
  | "eating_drinking"
  | "elimination"
  | "personal_cleansing_dressing"
  | "body_temperature"
  | "mobilisation"
  | "meaningful_activity"
  | "expressing_sexuality"
  | "sleeping"
  | "dying";
export type AssessmentStatus =
  | "draft"
  | "in_progress"
  | "completed"
  | "under_review"
  | "review_due"
  | "superseded"
  | "archived"
  | "deleted";
export type ReviewTriggerType =
  | "routine"
  | "condition_change"
  | "post_fall"
  | "post_hospital_return"
  | "post_incident"
  | "gp_request"
  | "mdt_request"
  | "family_concern"
  | "medication_change"
  | "manual";
export type ReviewFrequency =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "six_monthly"
  | "annually"
  | "custom";
export type AssessmentCategory =
  | "mobility"
  | "pressure_care"
  | "pain"
  | "nutrition"
  | "cognition"
  | "continence"
  | "behaviour"
  | "safety"
  | "person_centred";

export interface AssessmentAuditEntry {
  id: string;
  action:
    | "created"
    | "edited"
    | "completed"
    | "locked"
    | "revised"
    | "assigned"
    | "reassigned"
    | "archived"
    | "deleted"
    | "restored"
    | "superseded"
    | "commented"
    | "triggered";
  byUserId: string;
  byUserName: string;
  byRole: Role;
  at: string;
  reason?: string;
  fromVersionId?: string;
}

export interface AssessmentComment {
  id: string;
  authorId: string;
  authorName: string;
  role: Role;
  at: string;
  body: string;
}

export interface AssessmentReviewTriggerEvent {
  id: string;
  facilityId?: string;
  residentId: string;
  trigger: ReviewTriggerType;
  sourceModule: "incident" | "mdt" | "medication" | "visitor" | "manual";
  sourceRecordId?: string;
  at: string;
  byUserName?: string;
  affectedAssessmentTypes: AssessmentType[];
  note?: string;
}
export type AlertPriority = "low" | "medium" | "high" | "critical";
export type CarePlanStatus =
  | "draft"
  | "active"
  | "review_due"
  | "evaluation_due"
  | "overdue_review"
  | "overdue_evaluation"
  | "completed"
  | "superseded"
  | "archived"
  | "inactive";
export type CarePlanPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue" | "deleted";
export type BedType =
  | "standard"
  | "low"
  | "profiling"
  | "bariatric"
  | "pressure_relief"
  | "air_mattress"
  | "specialist";
export type MattressType =
  | "standard"
  | "foam"
  | "dynamic"
  | "air_mattress"
  | "pressure_relieving"
  | "alternating_air"
  | "low_air_loss"
  | "gel";

export interface Wing {
  id: string;
  facilityId?: string;
  name: string;
  floor?: string;
  kind: "wing" | "unit";
}
export interface Unit {
  id: string;
  facilityId?: string;
  wingId: string;
  name: string;
}
export interface Room {
  id: string | RoomId;
  nursingHomeId?: NursingHomeId;
  facilityId?: string;
  wardId?: WardId;
  wingId: string;
  unitId?: string;
  number: string;
  name?: string;
  roomNumber?: string;
  active?: boolean;
  roomType?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ward {
  id: WardId;
  nursingHomeId: NursingHomeId;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  displayOrder?: number;
  legacyWingId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bed {
  id: BedId;
  roomId: RoomId;
  label: string;
  active: boolean;
  status?: "available" | "occupied" | "reserved" | "out_of_service";
  bedType?: BedType | string;
  mattressType?: MattressType | string;
  installedDate?: string;
  reviewDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BedAssignment {
  id: BedAssignmentId;
  bedId: BedId;
  residentId: string;
  admissionId?: AdmissionId;
  nursingHomeId: NursingHomeId;
  wardId?: WardId;
  roomId?: RoomId;
  startDate: string;
  startDateTime?: string;
  endDate?: string;
  endDateTime?: string;
  status: "active" | "ended";
  reason?: "admission" | "room_move" | "bed_move" | "return_from_absence" | "temporary_assignment" | "other";
  endedReason?:
    | "room_move"
    | "temporary_absence"
    | "hospital_transfer"
    | "discharge"
    | "deceased"
    | "bed_out_of_service"
    | "other";
  assignmentReason?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface Admission {
  id: AdmissionId;
  residentId: string;
  nursingHomeId: NursingHomeId;
  admissionType: AdmissionType;
  status: "scheduled" | "active" | "completed" | "cancelled";
  plannedAdmissionDate?: string;
  admissionDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  admittedFrom?: "home" | "hospital" | "another_care_home" | "community_service" | "other";
  dischargeReason?: string;
  dischargeDestination?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AbsenceEpisode {
  id: AbsenceEpisodeId;
  residentId: string;
  admissionId: AdmissionId;
  nursingHomeId: NursingHomeId;
  type: AbsenceType;
  status: "planned" | "active" | "returned" | "cancelled" | "converted_to_discharge";
  startDateTime?: string;
  expectedReturnDateTime?: string;
  actualReturnDateTime?: string;
  destination?: string;
  reason?: string;
  bedHeld: boolean;
  heldBedAssignmentId?: BedAssignmentId;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ClinicalContext {
  enterpriseId: EnterpriseId;
  nursingHomeId: NursingHomeId;
  wardIds?: WardId[];
  shiftId?: string;
}

export interface UserProfile {
  id: string;
  facilityId?: string;
  facilityIds?: string[];
  name: string;
  role: Role;
  email: string;
  phone: string;
  department: string;
  assignedWings: string[]; // [] = all
  employeeNumber: string;
  startDate: string;
  lastLogin: string;
  status: "active" | "inactive" | "suspended";
  avatarSeed: string;
  notificationPrefs: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    criticalAlertsOnly: boolean;
  };
  preferences?: {
    theme?: "light" | "dark";
    density?: "comfortable" | "compact";
    defaultLandingPage?: string;
  };
}

export interface NextOfKin {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  primaryContact: boolean;
  emergencyContact: boolean;
  powerOfAttorney: boolean;
  legalRepresentative: boolean;
  notes: string;
}

export interface BedInfo {
  bedType: BedType;
  mattressType: MattressType;
  installationDate: string;
  reviewDate: string;
}

export interface KeyWorkers {
  namedNurse: string;
  namedCarer: string;
  keyWorker: string;
}

export interface AKeyToMe {
  lifeHistory?: string;
  occupation?: string;
  family?: string;
  hobbies?: string;
  likes?: string;
  dislikes?: string;
  foodPreferences?: string;
  dailyRoutine?: string;
  comfortItems?: string;
  triggers?: string;
  whatMakesMeHappy?: string;
  whatUpsetsMe?: string;
  bestWayToSupport?: string;
}

export interface Resident {
  id: string;
  facilityId?: string;
  lifecycleStatus?: ResidentLifecycleStatus;
  admissionType?: AdmissionType;
  presenceStatus?: ResidentPresenceStatus;
  currentAdmissionId?: AdmissionId;
  lifecycleStatusReason?: string;
  lifecycleUpdatedAt?: string;
  inactiveReason?: string;
  dischargeDate?: string;
  dischargeReason?: string;
  dischargeDestination?: string;
  deceasedDate?: string;
  placeOfDeath?: string;
  expectedAdmissionDate?: string;
  expectedDischargeDate?: string;
  deletedAt?: string;
  deletedBy?: string;
  deletedReason?: string;
  externalResidentId?: string;
  preferredName?: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: "male" | "female" | "other";
  roomNumber: string;
  wingId?: string;
  unitId?: string;
  roomId?: string;
  admissionDate: string;
  primaryDiagnosis: string;
  medicalHistory: string;
  allergies: string;
  gp: string;
  consultant: string;
  nextOfKin: string;
  nextOfKinList?: NextOfKin[];
  emergencyContact: string;
  communicationNeeds: string;
  religion: string;
  preferredLanguage: string;
  mentalCapacity: "has_capacity" | "lacks_capacity" | "fluctuating" | "not_assessed";
  dnarStatus?: "not_recorded" | "yes" | "no";
  endOfLife: boolean;
  currentMedication: string;
  status: ResidentStatus;
  residentType?: ResidentType;
  bed?: BedInfo;
  keyWorkers?: KeyWorkers;
  lastGpReview?: string;
  lastMdtReview?: string;
  photoSeed: string;
  aKeyToMe?: AKeyToMe;
  heightCm?: number;
  gpPractice?: string;
  consultantSpecialty?: string;
  otherPreferences?: string;
  admissionSource?: "home" | "hospital" | "another_care_home" | "other" | "";
}

export interface Assessment {
  id: string;
  facilityId?: string;
  residentId: string;
  type: AssessmentType;
  date: string;
  assessor: string;
  assessorRole?: Role;
  scores: Record<string, number>;
  totalScore: number;
  interpretation: string;
  riskLevel: "low" | "moderate" | "high" | "very_high" | "none";
  recommendations?: string;
  notes?: string;
  status?: AssessmentStatus;
  reviewDate?: string;
  nextReassessmentDate?: string;
  version?: number;
  supersedesId?: string;
  previousVersionId?: string;
  supersededById?: string;
  revisionReason?: string;
  deletedBy?: string;
  deletedAt?: string;
  deletedReason?: string;
  archivedBy?: string;
  archivedAt?: string;
  archivedReason?: string;
  restoredBy?: string;
  restoredAt?: string;
  locked?: boolean;
  lockedBy?: string;
  lockedAt?: string;
  category?: AssessmentCategory;
  reviewFrequency?: ReviewFrequency;
  customReviewDays?: number;
  reviewTriggers?: ReviewTriggerType[];
  assignedToUserId?: string;
  assignedToName?: string;
  assignedToRole?: Role;
  assignedAt?: string;
  assignedBy?: string;
  dueDate?: string;
  auditTrail?: AssessmentAuditEntry[];
  clinicalComments?: AssessmentComment[];
  // future-proof link arrays
  linkedProblemIds?: string[];
  linkedGoalIds?: string[];
  linkedInterventionIds?: string[];
  linkedEvaluationIds?: string[];
  linkedReviewIds?: string[];
  linkedIncidentIds?: string[];
  linkedMdtNoteIds?: string[];
  linkedDailyNoteIds?: string[];
  linkedTaskIds?: string[];
  // free-form payloads for assessments that need more than numeric scores
  payload?: Record<string, any>;
}

export interface CarePlanGoal {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority: CarePlanPriority;
  targetDate?: string;
  expectedOutcome?: string;
  progress?: string;
  status:
    | "not_started"
    | "in_progress"
    | "achieved"
    | "partially_achieved"
    | "not_achieved"
    | "discontinued";
}

export interface CarePlanInterventionSpec {
  id: string;
  name: string;
  description?: string;
  frequency: string;
  assignedRole?: Role;
  assignedUser?: string;
  startDate?: string;
  reviewDate?: string;
  priority: CarePlanPriority;
  status:
    | "pending"
    | "completed"
    | "partially_completed"
    | "missed"
    | "refused"
    | "escalated"
    | "cancelled";
}

export interface OutcomeMeasure {
  id: string;
  name: string;
  baseline?: string;
  current?: string;
  target?: string;
  dateMeasured?: string;
  trend?: "improving" | "stable" | "declining" | "critical";
}

export interface CarePlanEvaluation {
  id: string;
  facilityId?: string;
  carePlanId: string;
  date: string;
  evaluatedBy: string;
  role?: Role;
  summary: string;
  goalsMet: "yes" | "partially" | "no";
  outcomeRating: "excellent" | "good" | "some" | "no" | "deterioration";
  residentFeedback?: string;
  familyFeedback?: string;
  recommendations?: string;
  reviseRequired?: boolean;
  nextEvaluationDate?: string;
  signature?: string; // electronic sign-off (typed name)
  locked?: boolean;
}

export interface CarePlanReview {
  id: string;
  facilityId?: string;
  carePlanId: string;
  date: string;
  reviewer: string;
  role?: Role;
  notes: string;
  outcome:
    | "continue"
    | "modify"
    | "close"
    | "escalate_gp"
    | "escalate_mdt"
    | "escalate_specialist"
    | "refer_dietitian"
    | "refer_physio"
    | "refer_ot"
    | "refer_psychiatry";
  riskLevelChange?: string;
}

export interface CarePlan {
  id: string;
  facilityId?: string;
  residentId: string;
  title: string;
  category?: string;
  problem: string;
  goal: string;
  problemStatement?: string;
  identifiedNeeds?: string[];
  interventions: string[]; // legacy summary list
  goals?: CarePlanGoal[];
  interventionsSpec?: CarePlanInterventionSpec[];
  outcomeMeasures?: OutcomeMeasure[];
  assignedStaff: string;
  frequency: string;
  reviewDate: string;
  evaluationDate?: string;
  status: CarePlanStatus;
  priority?: CarePlanPriority;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  linkedAssessmentId?: string;
  assessmentScoreSnapshot?: {
    type: string;
    totalScore: number;
    riskLevel: string;
    date: string;
    interpretation?: string;
  };
  version?: number;
  supersedesId?: string;
  revisionReason?: string;
  templateId?: string;
}

export interface InterventionLog {
  id: string;
  facilityId?: string;
  interventionSpecId?: string;
  carePlanId: string;
  residentId: string;
  date: string;
  time: string;
  staff: string;
  role?: Role;
  outcome: "completed" | "partially_completed" | "missed" | "refused" | "escalated" | "cancelled";
  residentResponse?: string;
  comments?: string;
  followUpRequired?: boolean;
  photoUrl?: string;
  signature?: string;
  late?: boolean;
}

export interface ReadReceipt {
  id: string;
  facilityId?: string;
  entityType: "care_plan" | "alert" | "incident" | "safeguarding";
  entityId: string;
  userId: string;
  userName: string;
  role: Role;
  timestamp: string;
}

export interface CarePlanTemplate {
  id: string;
  category: string;
  title: string;
  problemStatement: string;
  identifiedNeeds: string[];
  smartGoals: {
    title: string;
    description: string;
    targetDays: number;
    priority: CarePlanPriority;
  }[];
  interventions: {
    name: string;
    description?: string;
    frequency: string;
    assignedRole: Role;
    priority: CarePlanPriority;
  }[];
  outcomeMeasures: { name: string; target?: string }[];
  reviewFrequencyDays: number;
  evaluationFrequencyDays: number;
  editable?: boolean;
  builtIn?: boolean;
}

export interface Intervention {
  id: string;
  facilityId?: string;
  residentId: string;
  carePlanId?: string;
  date: string;
  staff: string;
  intervention: string;
  outcome: string;
  residentResponse: string;
  followUpRequired: boolean;
  linkedAssessmentId?: string;
  linkedCarePlanId?: string;
}

export interface DailyNote {
  id: string;
  facilityId?: string;
  residentId: string;
  date: string;
  staff: string;
  shift: "morning" | "afternoon" | "night";
  observation: string;
  mood: "happy" | "calm" | "anxious" | "withdrawn" | "agitated";
  foodIntake: "full" | "most" | "half" | "little" | "none";
  fluidIntake: "good" | "moderate" | "poor";
  sleep: "good" | "broken" | "poor";
  behaviour: string;
  additionalNotes?: string;
  linkedCarePlanId?: string;
  linkedProblemId?: string;
  linkedInterventionId?: string;
  linkedInterventionLogId?: string;
}

// ---------------- Phase 5: Charts & Observations ----------------

export type ChartKind =
  | "weight"
  | "fluid"
  | "food"
  | "pain"
  | "sleep"
  | "bowel"
  | "behaviour"
  | "observation";

export interface Observation {
  id: string;
  facilityId?: string;
  residentId: string;
  date: string;
  time: string;
  staff: string;
  role?: Role;
  mood?: "happy" | "calm" | "anxious" | "withdrawn" | "agitated";
  behaviour?: string;
  mobility?: "independent" | "assistance" | "hoist" | "bedbound";
  pain?: number; // 0-10
  sleep?: "good" | "broken" | "poor";
  appetite?: "full" | "most" | "half" | "little" | "none";
  hydration?: "good" | "moderate" | "poor";
  comments?: string;
}

export interface WeightRecord {
  id: string;
  facilityId?: string;
  residentId: string;
  date: string;
  weightKg: number;
  bmi?: number;
  staff: string;
  notes?: string;
}

export interface FluidRecord {
  id: string;
  facilityId?: string;
  residentId: string;
  date: string;
  time: string;
  amountMl: number;
  type: string; // water, tea, juice…
  route: "oral" | "iv" | "ng" | "peg";
  staff: string;
}

export interface FoodRecord {
  id: string;
  facilityId?: string;
  residentId: string;
  date: string;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  intake: "full" | "most" | "half" | "little" | "none";
  description?: string;
  staff: string;
}

export interface PainRecord {
  id: string;
  facilityId?: string;
  residentId: string;
  date: string;
  time: string;
  score: number; // 0-10
  location?: string;
  intervention?: string;
  staff: string;
}

export interface SleepRecord {
  id: string;
  facilityId?: string;
  residentId: string;
  date: string;
  hoursSlept: number;
  quality: "good" | "broken" | "poor";
  disturbances?: string;
  staff: string;
}

export interface BowelRecord {
  id: string;
  facilityId?: string;
  residentId: string;
  date: string;
  time: string;
  bristolType: number; // 1-7
  continent: boolean;
  staff: string;
  notes?: string;
}

export interface BehaviourRecord {
  id: string;
  facilityId?: string;
  residentId: string;
  date: string;
  time: string;
  behaviour: string;
  trigger?: string;
  intervention?: string;
  outcome?: string;
  staff: string;
}

export interface IncidentAction {
  id: string;
  facilityId?: string;
  incidentId: string;
  date: string;
  action: string;
  by: string;
  outcome?: string;
}

export interface ShiftSummary {
  id: string;
  facilityId?: string;
  date: string; // YYYY-MM-DD
  shift: "morning" | "afternoon" | "night";
  generatedAt: string;
  generatedBy: string;
  residentsSeen: number;
  notesAdded: number;
  interventionsCompleted: number;
  tasksCompleted: number;
  incidents: number;
  alerts: number;
  outstandingTasks: number;
  outstandingHandovers: number;
}

export type TimelineEventType =
  | "assessment.created"
  | "assessment.updated"
  | "careplan.created"
  | "careplan.revised"
  | "careplan.evaluated"
  | "careplan.reviewed"
  | "intervention.logged"
  | "note.created"
  | "task.completed"
  | "task.created"
  | "incident.created"
  | "visitor.logged"
  | "outing.started"
  | "outing.returned"
  | "mdt.created"
  | "alert.raised"
  | "alert.acknowledged"
  | "chart.weight"
  | "chart.fluid"
  | "chart.food"
  | "chart.pain"
  | "chart.sleep"
  | "chart.bowel"
  | "chart.behaviour"
  | "chart.observation"
  | "handover.created"
  | "handover.acknowledged";

export interface TimelineEvent {
  id: string;
  facilityId?: string;
  residentId: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  linkedRecordId?: string;
  linkedRecordKind?: string;
  createdAt: string;
  createdBy: string;
  role?: Role;
  priority?: AlertPriority;
}

export interface Evaluation {
  id: string;
  facilityId?: string;
  carePlanId: string;
  date: string;
  reviewer: string;
  goalAchievement: "achieved" | "partial" | "not_achieved";
  notes: string;
  outcome: "continue" | "modify" | "close";
  nextReviewDate: string;
}

export interface Alert {
  id: string;
  facilityId?: string;
  residentId: string;
  title: string;
  description: string;
  priority: AlertPriority;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  linkedAssessmentId?: string;
  linkedCarePlanId?: string;
}

export interface ActionAlertWorkflow {
  id: string;
  facilityId?: string;
  residentId: string;
  title: string;
  category: string;
  what: string;
  why: string;
  action: string;
  priority: AlertPriority;
  createdAt: string;
  acknowledgedBy: string;
  acknowledgedAt: string;
}

export interface Task {
  id: string;
  facilityId?: string;
  residentId?: string;
  title: string;
  description?: string;
  assignedTo: string;
  dueDate: string;
  status: TaskStatus;
  category?: "clinical" | "operational" | "administrative" | "resident" | "general";
  taskType?: string;
  priority?: "critical" | "high" | "normal" | "low";
  reminderAt?: string;
  recurrence?: "none" | "daily" | "weekly" | "monthly" | "custom";
  recurrenceNotes?: string;
  assignedToType?: "staff" | "role" | "unit" | "wing" | "unassigned";
  assignedRole?: Role;
  assignedUnitId?: string;
  assignedWingId?: string;
  appointmentType?: string;
  appointmentLocation?: string;
  appointmentTime?: string;
  transportRequired?: boolean;
  escortRequired?: boolean;
  escortStaff?: string;
  appointmentNotes?: string;
  outcome?: string;
  followUpRequired?: boolean;
  completedAt?: string;
  completedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt?: string;
  createdBy?: string;
  deletedBy?: string;
  deletedAt?: string;
  deleteReason?: string;
  linkedAssessmentId?: string;
  linkedCarePlanId?: string;
  linkedMDTNoteId?: string;
}

export interface AuditLog {
  id: string;
  facilityId?: string;
  user: string;
  role?: Role;
  action: string;
  entity: string;
  entityType?: string;
  timestamp: string;
  before?: string;
  after?: string;
  reason?: string;
}

export type RecordStatus = "active" | "archived" | "deleted";

export interface LifecycleFields {
  recordStatus?: RecordStatus;
  createdAt?: string;
  createdBy?: string;
  createdByRole?: Role;
  updatedAt?: string;
  updatedBy?: string;
  archivedAt?: string;
  archivedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  deletedReason?: string;
}

export interface Incident extends LifecycleFields {
  id: string;
  facilityId?: string;
  residentId: string;
  date: string;
  type: "fall" | "medication_error" | "injury" | "behaviour" | "near_miss" | "other";
  severity: "low" | "moderate" | "high" | "critical";
  description: string;
  immediateAction: string;
  reportedBy: string;
  witnessedBy?: string;
  followUpRequired: boolean;
  status: "draft" | "open" | "under_investigation" | "closed";
  closedAt?: string;
  closedBy?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  linkedAssessmentId?: string;
  linkedCarePlanId?: string;
}

export interface MDTNote extends LifecycleFields {
  id: string;
  facilityId?: string;
  residentId: string;
  date: string;
  meetingTime?: string;
  meetingType?: string;
  chairperson?: string;
  attendees: string;
  attendeeList?: string[];
  discussion: string;
  recommendations: string;
  clinicalDecisions?: string;
  actionsAgreed?: string;
  followUpDate?: string;
  authoredBy: string;
  role?: Role;
  linkedTaskIds?: string[];
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  linkedAssessmentId?: string;
  linkedCarePlanId?: string;
}

export interface Visitor extends LifecycleFields {
  id: string;
  facilityId?: string;
  residentId: string;
  date: string;
  visitorName: string;
  relationship: string;
  arrivalTime: string;
  departureTime: string;
  notes?: string;
  signedInBy: string;
  status?: "scheduled" | "checked_in" | "completed" | "cancelled";
  cancelledReason?: string;
}

export interface Outing extends LifecycleFields {
  id: string;
  facilityId?: string;
  residentId: string;
  date: string;
  destination: string;
  accompaniedBy: string;
  departureTime: string;
  returnTime: string;
  transportMethod: string;
  notes?: string;
  riskAssessmentCompleted: boolean;
  status?: "planned" | "departed" | "returned" | "cancelled" | "closed";
  outcomeNotes?: string;
  cancelledReason?: string;
}

export interface HandoverNote extends LifecycleFields {
  id: string;
  facilityId?: string;
  nursingHomeId?: NursingHomeId;
  wardId?: WardId;
  originWardId?: WardId;
  currentVisibilityWardId?: WardId;
  scope?: "resident" | "ward";
  residentId: string;
  category?: string;
  handoverPriority?: "routine" | "important" | "urgent";
  date: string;
  shift: "morning" | "afternoon" | "night";
  sourceShiftId?: ShiftId;
  targetShiftId?: ShiftId;
  operationalDate?: string;
  effectiveFrom?: string;
  expiresAt?: string;
  staff: string;
  summary: string;
  outstandingActions: string;
  priority?: AlertPriority;
  readBy?: string[];
  readAt?: string;
  readReceipts?: { user: string; role: Role; at: string }[];
  acknowledgedBy?: string[];
  acknowledgedAt?: string;
  acknowledgements?: { user: string; role: Role; at: string }[];
  completedBy?: string;
  completedAt?: string;
  closedBy?: string;
  closedAt?: string;
  resolvedAt?: string;
  resolvedBy?: UserAccountId;
  carriedForwardFromHandoverId?: HandoverId;
  carryForwardCount?: number;
  handoverAcknowledgements?: {
    id: string;
    handoverId: HandoverId | string;
    userAccountId: UserAccountId | string;
    staffMemberId?: StaffMemberId | string;
    acknowledgedAt: string;
    shiftId: ShiftId | string;
    nursingHomeId: NursingHomeId | string;
    wardId: WardId | string;
  }[];
  status?: "active" | "read" | "acknowledged" | "archived" | "open" | "completed" | "closed";
}

// ============================================================
// Unified Resident Care Plan model (Problems are the centre)
// ============================================================

export type ProblemCategory =
  | "pressure"
  | "falls"
  | "nutrition"
  | "pain"
  | "behaviour"
  | "continence"
  | "mobility"
  | "cognition"
  | "communication"
  | "personal_care"
  | "mental_health"
  | "social"
  | "sleep"
  | "medication"
  | "end_of_life"
  | "skin"
  | "safeguarding"
  | "custom";

export type ProblemRiskLevel = "none" | "low" | "moderate" | "high" | "very_high" | "resolved";
export type ProblemStatus = "active" | "resolved" | "archived";
export type FrequencyType =
  | "once"
  | "per_shift"
  | "daily"
  | "twice_daily"
  | "three_times_daily"
  | "weekly"
  | "monthly"
  | "prn"
  | "every_2_hours"
  | "every_4_hours"
  | "every_6_hours"
  | "hourly"
  | "custom";
export type InterventionStatus =
  | "active"
  | "review_due"
  | "completed"
  | "cancelled"
  | "superseded"
  | "discontinued";
export type InterventionOutcome =
  | "completed"
  | "partially_completed"
  | "missed"
  | "refused"
  | "escalated";

export interface ResidentCarePlan {
  id: string;
  facilityId?: string;
  residentId: string;
  status: "active" | "archived";
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CarePlanProblem {
  id: string;
  facilityId?: string;
  residentCarePlanId: string;
  residentId: string;
  category: ProblemCategory;
  rltDomainId?: RltDomainId;
  customCategoryLabel?: string;
  problemStatement: string;
  riskLevel: ProblemRiskLevel;
  sourceAssessmentId?: string;
  sourceAssessmentType?: AssessmentType;
  contextReferences?: Array<{
    type: "resident_strength" | "resident_preference";
    sourceId: string;
    sourceVersion?: number;
    insertedAt: string;
    insertedBy: string;
  }>;
  createdBy: string;
  createdAt: string;
  evaluationDate: string; // YYYY-MM-DD
  reviewDate: string; // YYYY-MM-DD
  notes?: string;
  status: ProblemStatus;
  resolvedAt?: string;
  resolvedBy?: string;
  resolvedReason?: string;
  archivedAt?: string;
  archivedBy?: string;
  archivedReason?: string;
}

export interface ProblemGoal {
  id: string;
  facilityId?: string;
  problemId: string;
  statement: string;
  targetDate?: string;
  status: "active" | "achieved" | "partially_achieved" | "not_achieved" | "discontinued";
  createdAt: string;
  createdBy: string;
}

export interface ProblemIntervention {
  id: string;
  facilityId?: string;
  problemId: string;
  residentId: string;
  name: string;
  description?: string;
  frequencyType: FrequencyType;
  frequencyValue?: number;
  frequencyInstructions?: string;
  assignedRole?: Role;
  assignedStaffId?: string;
  assignedStaffName?: string;
  startDate: string;
  reviewDate: string;
  endDate: string;
  status: InterventionStatus;
  notes?: string;
  createdAt: string;
  createdBy: string;
  createdByRole: Role;
  updatedAt?: string;
  updatedBy?: string;
  updatedByRole?: Role;
  completedAt?: string;
  completedBy?: string;
  completedByRole?: Role;
  completionReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelledByRole?: Role;
  cancellationReason?: string;
  discontinuedAt?: string;
  discontinuedBy?: string;
  discontinuedByRole?: Role;
  discontinuedReason?: string;
}

export interface ProblemInterventionLog {
  id: string;
  facilityId?: string;
  interventionId: string;
  problemId: string;
  residentId: string;
  date: string;
  time: string;
  staffId: string;
  staffName: string;
  role: Role;
  outcome: InterventionOutcome;
  residentResponse?: string;
  followUpRequired: boolean;
  followUpDetails?: string;
  comments?: string;
  linkedDailyNoteId?: string;
  createdAt: string;
}

export interface ProblemEvaluation {
  id: string;
  facilityId?: string;
  problemId: string;
  date: string;
  evaluatorId: string;
  evaluatorName: string;
  role: Role;
  summary: string;
  goalsMet: "yes" | "partial" | "no";
  progress: "improved" | "stable" | "deteriorated" | "resolved" | "requires_revision";
  recommendations?: string;
  nextEvaluationDate?: string;
}

export interface ProblemReview {
  id: string;
  facilityId?: string;
  problemId: string;
  reviewDate: string;
  reviewedById: string;
  reviewedByName: string;
  role: Role;
  outcome: "continue" | "modify" | "escalate" | "resolve" | "refer";
  comments?: string;
  nextReviewDate?: string;
}

export type ProblemHistoryAction =
  | "created"
  | "updated"
  | "goal_added"
  | "goal_edited"
  | "goal_removed"
  | "intervention_added"
  | "intervention_removed"
  | "intervention_logged"
  | "frequency_changed"
  | "evaluation_added"
  | "review_added"
  | "resolved"
  | "reopened"
  | "archived"
  | "note_added";

export interface ProblemHistoryEntry {
  id: string;
  facilityId?: string;
  problemId: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: Role;
  action: ProblemHistoryAction;
  reason?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

export interface AssessmentSuggestion {
  id: string;
  facilityId?: string;
  assessmentId: string;
  residentId: string;
  assessmentType: AssessmentType;
  category: ProblemCategory;
  problemStatement: string;
  riskLevel: ProblemRiskLevel;
  createdAt: string;
  status: "pending" | "accepted" | "rejected" | "edited";
  acceptedAsProblemId?: string;
  rejectedReason?: string;
}

// ---------------- Phase 6: Vital Signs & Clinical Observations ----------------

export type ObservationFrequency =
  | "4_hourly"
  | "8_hourly"
  | "12_hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "prn";

export type VitalObservationType =
  | "temperature"
  | "pulse"
  | "respiratoryRate"
  | "bloodPressure"
  | "spo2"
  | "bloodGlucose"
  | "weight"
  | "painScore"
  | "news2"
  | "fluidBalance";

export type ConsciousnessLevel = "A" | "C" | "V" | "P" | "U"; // ACVPU

export interface VitalAuditEntry {
  id: string;
  action: "created" | "edited" | "deleted" | "restored";
  byUserId: string;
  byUserName: string;
  byRole: Role;
  at: string;
  reason?: string;
  patchSummary?: string;
}

export interface VitalSign {
  id: string;
  facilityId?: string;
  residentId: string;
  observationType?: VitalRecordType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  recordedAt: string; // ISO datetime
  // Core
  temperature?: number;
  pulse?: number;
  respiratoryRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  spo2?: number;
  onOxygen?: boolean;
  oxygenLpm?: number;
  bloodGlucose?: number;
  glucoseContext?: "before_meal" | "after_meal" | "random" | "fasting";
  insulinGiven?: string;
  // Nutrition (BMI NOT stored — derived)
  weight?: number;
  height?: number;
  // Clinical
  painScore?: number;
  painLocation?: string;
  painIntervention?: string;
  painOutcome?: string;
  consciousness?: ConsciousnessLevel;
  // Hydration
  fluidIntakeMl?: number;
  fluidOutputMl?: number;
  fluidRoute?: string;
  news2Score?: number;
  news2Risk?: "low" | "low-medium" | "medium" | "high";
  news2Breakdown?: {
    RR: number;
    SpO2: number;
    Temp: number;
    BP: number;
    Pulse: number;
    Consciousness: number;
    Oxygen: number;
  };
  // Notes
  clinicalComments?: string;
  observationNotes?: string;
  // Staff & device
  recordedByUserId: string;
  recordedByName: string;
  recordedByRole: Role;
  deviceUsed?: string;
  signature?: string;
  // Audit
  createdAt: string;
  modifiedAt?: string;
  modifiedByUserId?: string;
  modifiedByName?: string;
  modifiedReason?: string;
  deletedAt?: string;
  deletedByUserId?: string;
  deletedByName?: string;
  deletedReason?: string;
  auditTrail: VitalAuditEntry[];
}

export type VitalRecordType =
  | "full_news2"
  | "temperature"
  | "blood_pressure"
  | "oxygen_saturation"
  | "blood_glucose"
  | "weight_bmi"
  | "pain_score"
  | "fluid_balance"
  | "respiratory";

export interface ObservationPlanItem {
  id: string;
  type: VitalObservationType;
  frequency: ObservationFrequency;
  required: boolean;
  notes?: string;
}

export interface ObservationPlan {
  facilityId?: string;
  residentId: string;
  items: ObservationPlanItem[];
  updatedAt: string;
  updatedByName: string;
}

export type ClinicalAlertType =
  | "weight_loss"
  | "weight_gain"
  | "high_news2"
  | "abnormal_bp"
  | "abnormal_temp"
  | "low_spo2"
  | "high_pain"
  | "hypoglycaemia"
  | "hyperglycaemia"
  | "fluid_imbalance"
  | "bmi_low"
  | "bmi_high"
  | "missed_observation";

export type ClinicalAlertSeverity = "info" | "warning" | "critical";

export interface ClinicalEscalationNote {
  id: string;
  alertId: string;
  actionTaken: string;
  enteredByUserId: string;
  enteredByName: string;
  enteredByRole: Role;
  at: string;
}

export interface ClinicalAlert {
  id: string;
  facilityId?: string;
  residentId: string;
  type: ClinicalAlertType;
  severity: ClinicalAlertSeverity;
  title: string;
  message: string;
  recommendation: string;
  currentValue?: string;
  previousValue?: string;
  sourceVitalId?: string;
  createdAt: string;
  updatedAt?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  dismissedAt?: string;
  dismissedBy?: string;
  dismissedReason?: "Resolved" | "Reviewed" | "Expected Change" | "Entered In Error" | "Other";
  resolvedAt?: string;
  resolvedBy?: string;
  escalations: ClinicalEscalationNote[];
}

// ---------------- Phase 7: Dedicated Observation Modules ----------------

export type ObservationKind =
  | "weight"
  | "news2"
  | "glucose"
  | "pain"
  | "fluid"
  | "bowel"
  | "urinary"
  | "wound";

export interface ObservationAuditEntry {
  id: string;
  action: "created" | "edited" | "deleted" | "restored";
  byUserId: string;
  byUserName: string;
  byRole: Role;
  at: string;
  reason?: string;
}

export interface ClinicalObservation {
  id: string;
  facilityId?: string;
  residentId: string;
  kind: ObservationKind;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  recordedAt: string; // ISO
  data: Record<string, any>;
  notes?: string;
  modificationReason?: string;
  recordedByUserId: string;
  recordedByName: string;
  recordedByRole: Role;
  createdAt: string;
  modifiedAt?: string;
  modifiedByName?: string;
  deletedAt?: string;
  deletedByName?: string;
  deletedReason?: string;
  auditTrail: ObservationAuditEntry[];
}

export interface ObservationScheduleItem {
  id: string;
  kind: ObservationKind;
  frequency: ObservationFrequency;
  required: boolean;
  notes?: string;
}

export interface ObservationSchedule {
  facilityId?: string;
  residentId: string;
  items: ObservationScheduleItem[];
  updatedAt: string;
  updatedByName: string;
}
