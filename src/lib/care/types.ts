export type Role = "carer" | "nurse" | "doctor" | "cnm" | "don" | "group_owner";
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

export type FileId = string;
export type MoneyAmount = { amountMinor: number; currencyCode: string };
export type StaffVisaTypeId = string;
export type StaffEmploymentPermitTypeId = string;
export type StaffVisaRecordId = string;
export type StaffResidencePermissionRecordId = string;
export type StaffEmploymentPermitRecordId = string;
export type StaffDocumentTypeId = string;
export type StaffDocumentId = string;
export type StaffDocumentRequirementId = string;
export type StaffDocumentVerificationRecordId = string;
export type StaffImmigrationRequirementProfileId = string;
export type TrainingCourseId = string;
export type TrainingRequirementId = string;
export type StaffTrainingAssignmentId = string;
export type StaffTrainingCompletionId = string;
export type CompetencyDefinitionId = string;
export type CompetencyRequirementId = string;
export type StaffCompetencyValidationId = string;

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
export type EmploymentRecordStatus =
  | "draft"
  | "pre_employment"
  | "active"
  | "on_leave"
  | "suspended"
  | "notice_period"
  | "ended"
  | "cancelled"
  | "entered_in_error";
export type EmploymentContractType =
  | "permanent_full_time"
  | "permanent_part_time"
  | "fixed_term_full_time"
  | "fixed_term_part_time"
  | "casual"
  | "zero_hours"
  | "temporary"
  | "relief"
  | "agency"
  | "secondment"
  | "locum"
  | "volunteer"
  | "other";
export type EmploymentHomeAssignmentType = "primary" | "secondary" | "temporary_cover" | "secondment" | "floating" | "other";
export type StaffHomeAssignmentType = "primary" | "secondary" | "temporary" | "agency_cover" | "floating" | "secondment" | "other";
export type EmploymentAssignmentStatus = "planned" | "active" | "suspended" | "ended" | "cancelled" | "entered_in_error";
export type EffectiveHomeAssignmentState = "future" | "current" | "temporarily_suspended" | "ended" | "invalid";
export type EmploymentRoleAssignmentType = "primary" | "secondary" | "acting" | "temporary_cover" | "development" | "other";
export type RegistrationStatus =
  | "active"
  | "expiring"
  | "expired"
  | "suspended"
  | "not_required"
  | "unknown";
export type ProfessionalRegistrationStatus = "draft" | "current" | "expired" | "suspended" | "revoked" | "entered_in_error";
export type ProfessionalRegistrationVerificationStatus = "not_submitted" | "submitted" | "verified" | "failed" | "unable_to_verify" | "stale";
export type StaffImmigrationRecordType = "visa" | "irish_residence_permission" | "employment_permit";
export type StaffImmigrationRecordStatus =
  | "draft"
  | "pending_verification"
  | "valid"
  | "expiring_soon"
  | "expired"
  | "verification_failed"
  | "suspended"
  | "revoked"
  | "not_required"
  | "entered_in_error";
export type StaffDocumentTypeKey =
  | "passport"
  | "visa"
  | "employment_permit"
  | "irish_residence_permission"
  | "garda_vetting"
  | "manual_handling"
  | "cpr"
  | "fire_training"
  | "professional_registration"
  | "reference"
  | "qualification_certificate"
  | "induction_completion"
  | "occupational_health"
  | "vaccination_record"
  | "other";
export type StaffDocumentCategory =
  | "identity"
  | "immigration"
  | "vetting"
  | "training"
  | "professional"
  | "employment"
  | "occupational_health"
  | "vaccination"
  | "other";
export type StaffDocumentStatus =
  | "draft"
  | "pending_verification"
  | "valid"
  | "expiring_soon"
  | "expired"
  | "verification_failed"
  | "superseded"
  | "revoked"
  | "not_required"
  | "entered_in_error";
export type StaffDocumentVerificationStatus =
  | "not_verified"
  | "pending"
  | "verified"
  | "failed"
  | "unable_to_verify"
  | "verification_expired";
export type StaffImmigrationComplianceStatus = "compliant" | "attention_required" | "missing_required" | "not_assessed" | "not_required";
export type TrainingCourseStatus = "draft" | "active" | "inactive" | "retired";
export type TrainingDeliveryMethod = "classroom" | "online" | "blended" | "practical" | "external_provider" | "self_directed" | "other";
export type TrainingRenewalFrequency = "one_off" | "annual" | "every_two_years" | "every_three_years" | "custom_months" | "no_expiry";
export type TrainingRequirementTarget = "all_staff" | "role" | "employment_category" | "contract_type" | "nursing_home" | "ward" | "individual_staff_member";
export type StaffTrainingAssignmentStatus = "not_started" | "assigned" | "in_progress" | "completed" | "overdue" | "expired" | "exempt" | "cancelled" | "entered_in_error";
export type TrainingCompletionStatus = "draft" | "pending_verification" | "verified" | "verification_failed" | "superseded" | "entered_in_error";
export type StaffTrainingComplianceStatus = "compliant" | "due_soon" | "overdue" | "expired" | "not_started" | "in_progress" | "pending_verification" | "verification_failed" | "exempt" | "not_required" | "unable_to_determine";
export type CompetencyDefinitionStatus = "draft" | "active" | "inactive" | "retired";
export type CompetencyCategory = "clinical" | "medication" | "equipment" | "care" | "safety" | "operational" | "management" | "other";
export type CompetencyRequirementTarget = "all_staff" | "role" | "employment_category" | "nursing_home" | "ward" | "individual_staff_member";
export type CompetencyValidationStatus = "draft" | "pending_validation" | "competent" | "competent_with_supervision" | "not_yet_competent" | "expired" | "suspended" | "revoked" | "superseded" | "entered_in_error";
export type StaffCompetencyComplianceStatus = "competent" | "competent_with_supervision" | "due_soon" | "expired" | "missing_required" | "not_yet_competent" | "pending_validation" | "not_required" | "unable_to_determine";
export type WardCompetencyRequirementLevel = "mandatory_for_assignment" | "mandatory_for_independent_work" | "recommended" | "minimum_shift_coverage";
export type StaffingEstablishmentStatus = "draft" | "submitted_for_approval" | "approved" | "superseded" | "retired" | "entered_in_error";
export type StaffingEstablishmentVersionId = string;
export type StaffingEstablishmentLineId = string;
export type WardCompetencyRequirementId = string;
export type RecruitmentVacancyId = string;
export type RecruitmentAdvertisingSourceId = string;
export type RecruitmentCandidateId = string;
export type RecruitmentOfferId = string;
export type RecruitmentInterviewStageKey =
  | "not_started"
  | "applications_received"
  | "initial_screening"
  | "shortlisted"
  | "interview_scheduled"
  | "first_interview"
  | "second_interview"
  | "reference_check"
  | "preferred_candidate"
  | "offer_preparation"
  | "completed";
export type RecruitmentVacancyStatus =
  | "draft"
  | "approval_required"
  | "approved"
  | "open"
  | "advertising"
  | "applications_open"
  | "shortlisting"
  | "interviewing"
  | "offer_pending"
  | "offer_sent"
  | "offer_accepted"
  | "pre_employment_checks"
  | "start_scheduled"
  | "filled"
  | "on_hold"
  | "cancelled"
  | "closed_unfilled"
  | "entered_in_error";
export type VacancyEmploymentBasis = "headcount" | "fte" | "hours";
export type RecruitmentCandidateStatus = "applied" | "screening" | "shortlisted" | "interviewing" | "preferred" | "offer_sent" | "offer_accepted" | "rejected" | "withdrawn" | "hired";
export type RecruitmentOfferStatus = "draft" | "approval_required" | "approved" | "sent" | "accepted" | "declined" | "withdrawn" | "expired";
export type RosterPeriodId = string;
export type RosterShiftRequirementId = string;
export type PlannedShiftId = string;
export type RosterPeriodStatus = "draft" | "open_for_planning" | "pending_approval" | "approved" | "published" | "locked" | "closed" | "entered_in_error";
export type RosterShiftRequirementStatus = "draft" | "required" | "partially_filled" | "filled" | "vacant" | "cancelled" | "entered_in_error";
export type PlannedShiftStatus = "draft" | "planned" | "assigned" | "to_be_confirmed" | "confirmed" | "published" | "vacant" | "cancelled" | "replaced" | "entered_in_error";
export type StaffLeaveRecordId = string;
export type StaffLeaveType = "annual_leave" | "sick_leave" | "maternity_leave" | "paternity_leave" | "compassionate_leave" | "study_leave" | "unpaid_leave" | "career_break" | "other";
export type StaffLeaveStatus = "draft" | "requested" | "approved" | "rejected" | "cancelled" | "returned" | "extended" | "entered_in_error";
export type AgencyCompanyId = string;
export type AgencyWorkerId = string;
export type AgencyRateAgreementId = string;
export type AgencyShiftAssignmentId = string;
export type AgencyTimesheetId = string;
export type AgencySpendAlertPolicyId = string;
export type AgencyCompanyStatus = "active" | "suspended" | "inactive" | "entered_in_error";
export type AgencyWorkerStatus = "active" | "temporarily_unavailable" | "blocked" | "inactive" | "entered_in_error";
export type AgencyRateType = "standard" | "night" | "weekend" | "bank_holiday" | "overtime" | "specialist" | "other";
export type AgencyShiftAssignmentStatus = "requested" | "proposed" | "confirmed" | "worked" | "cancelled" | "no_show" | "entered_in_error";
export type AgencyTimesheetStatus = "draft" | "submitted" | "pending_approval" | "approved" | "rejected" | "disputed" | "cancelled" | "entered_in_error";
export type AgencySpendThresholdBasis = "absolute_amount" | "percentage_of_staffing_budget" | "percentage_of_total_workforce_cost" | "percentage_change_from_previous_period" | "agency_wte_percentage" | "combined";
export type StaffProbationId = string;
export type StaffProbationReviewId = string;
export type StaffProbationExtensionId = string;
export type ProbationReviewSchedulePolicyId = string;
export type StaffProbationStatus = "draft" | "active" | "extended" | "completed" | "failed" | "cancelled" | "entered_in_error";
export type StaffProbationReviewStatus = "scheduled" | "due" | "overdue" | "completed" | "cancelled" | "entered_in_error";
export type StaffProbationOutcome = "continue" | "extend" | "complete_passed" | "complete_failed" | "cancel";
export type DashboardMetricAvailability = "available" | "partially_available" | "not_configured" | "source_module_unavailable" | "permission_restricted" | "error" | "unable_to_determine";
export type SafeStaffingReadinessStatus = "safe" | "attention" | "gap" | "unable_to_determine";
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
  enterpriseId?: EnterpriseId;
  primaryNursingHomeId?: NursingHomeId;
  firstName: string;
  lastName: string;
  surname?: string;
  preferredName?: string;
  displayName: string;
  title?: string;
  photoFileId?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  gender?: "female" | "male" | "non_binary" | "other" | "prefer_not_to_say" | "not_recorded";
  nationalityCode?: string;
  nationalityDisplayName?: string;
  phone?: string;
  email?: string;
  contactDetails?: StaffContactDetails;
  address?: PostalAddress;
  active: boolean;
  staffNumber?: string;
  status?: StaffMemberStatus;
  linkedUserAccountId?: UserAccountId;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserAccountId;
  updatedBy?: UserAccountId;
}

export type StaffMemberStatus =
  | "pre_employment"
  | "active"
  | "on_leave"
  | "suspended"
  | "inactive"
  | "left_employment"
  | "deceased";

export interface StaffContactDetails {
  personalEmail?: string;
  workEmail?: string;
  personalPhone?: string;
  workPhone?: string;
  preferredContactMethod?:
    | "personal_email"
    | "work_email"
    | "personal_phone"
    | "work_phone"
    | "other";
  preferredContactNotes?: string;
}

export interface PostalAddress {
  line1?: string;
  line2?: string;
  townCity?: string;
  countyRegion?: string;
  postcode?: string;
  country?: string;
}

export interface StaffEmergencyContact {
  id: string;
  staffMemberId: StaffMemberId;
  fullName: string;
  relationship?: string;
  phoneNumber: string;
  alternativePhoneNumber?: string;
  email?: string;
  priority: number;
  isPrimary: boolean;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffDirectoryEvent {
  id: string;
  type:
    | "StaffMemberCreated"
    | "StaffMemberUpdated"
    | "StaffMemberStatusChanged"
    | "StaffMemberPrimaryHomeChanged"
    | "StaffMemberPhotoChanged"
    | "StaffMemberUserAccountLinked"
    | "StaffMemberUserAccountUnlinked"
    | "StaffEmergencyContactAdded"
    | "StaffEmergencyContactUpdated"
    | "StaffEmergencyContactInactivated"
    | "StaffEmergencyContactPrimaryChanged";
  staffMemberId: StaffMemberId | string;
  enterpriseId?: EnterpriseId | string;
  nursingHomeId?: NursingHomeId | string;
  actorUserAccountId: UserAccountId | string;
  actorRole?: Role;
  occurredAt: string;
  correlationId: string;
  changedFields?: string[];
  previousStatus?: StaffMemberStatus;
  newStatus?: StaffMemberStatus;
}

export interface EmploymentRecord {
  id: EmploymentRecordId;
  staffMemberId: StaffMemberId;
  nursingHomeId: NursingHomeId;
  enterpriseId?: EnterpriseId;
  employeeNumber?: string;
  contractType?: EmploymentContractType;
  status?: EmploymentRecordStatus;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  jobTitle: string;
  department?: string;
  startDate: string;
  endDate?: string;
  probationEndDate?: string;
  fteValue?: number;
  contractedHoursPerWeek?: number;
  contractedHoursPerPeriod?: number;
  contractedHoursPeriod?: "week" | "fortnight" | "month";
  salaryGradeId?: string;
  salaryGradeLabel?: string;
  payrollId?: string;
  primaryNursingHomeId?: NursingHomeId;
  primaryRoleKey?: string;
  employmentCategory?: "clinical" | "care" | "management" | "administration" | "housekeeping" | "maintenance" | "catering" | "allied_health" | "medical" | "other";
  sourceReference?: string;
  notes?: string;
  isPrimaryEmployment?: boolean;
  managerStaffMemberId?: StaffMemberId;
  agencyName?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserAccountId;
  updatedBy?: UserAccountId;
  createdByUserAccountId?: UserAccountId;
  updatedByUserAccountId?: UserAccountId;
}

export interface EmploymentHomeAssignment {
  id: string;
  employmentRecordId: EmploymentRecordId;
  staffMemberId: StaffMemberId;
  enterpriseId?: EnterpriseId;
  nursingHomeId: NursingHomeId;
  assignmentType: EmploymentHomeAssignmentType | StaffHomeAssignmentType;
  status: EmploymentAssignmentStatus;
  effectiveFrom: string;
  effectiveTo?: string;
  isPrimary: boolean;
  roleKeys?: string[];
  employmentCategory?: string;
  contractedHoursPerWeekAtHome?: number;
  fteAtHome?: number;
  agencyProviderId?: string;
  sourceReference?: string;
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId?: UserAccountId;
}

export interface EmploymentRoleAssignment {
  id: string;
  employmentRecordId: EmploymentRecordId;
  staffMemberId: StaffMemberId;
  roleKey: string;
  nursingHomeId?: NursingHomeId;
  wardId?: WardId;
  assignmentType: EmploymentRoleAssignmentType;
  status: EmploymentAssignmentStatus;
  effectiveFrom: string;
  effectiveTo?: string;
  isPrimary: boolean;
  fteForRole?: number;
  contractedHoursPerWeekForRole?: number;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
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
  employmentRecordId?: EmploymentRecordId;
  registrationBodyId?: string;
  profession: "nurse" | "doctor" | "allied_health" | "other";
  professionKey?: string;
  registrationType?: string;
  registrationBody: string;
  registrationNumber?: string;
  normalisedRegistrationNumber?: string;
  registrationStatus: RegistrationStatus;
  status?: ProfessionalRegistrationStatus;
  verificationStatus?: ProfessionalRegistrationVerificationStatus;
  issueDate?: string;
  expiryDate?: string;
  reviewDate?: string;
  verifiedAt?: string;
  verifiedBy?: UserAccountId;
  verificationHistory?: ProfessionalRegistrationVerification[];
  documentIds?: string[];
  restrictionsOrConditionsPresent?: boolean;
  restrictedSummary?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId?: UserAccountId;
  updatedByUserAccountId?: UserAccountId;
}

export interface ProfessionalRegistrationBody {
  id: string;
  name: string;
  countryCode?: string;
  active: boolean;
}

export interface ProfessionalRegistrationRequirement {
  id: string;
  roleKey: string;
  professionKey: string;
  registrationBodyId?: string;
  active: boolean;
}

export interface ProfessionalRegistrationVerification {
  id: string;
  registrationId: ProfessionalRegistrationId;
  status: ProfessionalRegistrationVerificationStatus;
  verifiedByUserAccountId?: UserAccountId;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface WorkforceEmploymentEvent {
  id: string;
  type:
    | "EmploymentRecordCreated"
    | "EmploymentRecordUpdated"
    | "EmploymentRecordStatusChanged"
    | "EmploymentHomeAssignmentAdded"
    | "EmploymentRoleAssignmentAdded";
  employmentRecordId: EmploymentRecordId | string;
  staffMemberId: StaffMemberId | string;
  actorUserAccountId: UserAccountId | string;
  occurredAt: string;
  changedFields?: string[];
}

export interface ProfessionalRegistrationEvent {
  id: string;
  type:
    | "ProfessionalRegistrationCreated"
    | "ProfessionalRegistrationUpdated"
    | "ProfessionalRegistrationSubmittedForVerification"
    | "ProfessionalRegistrationVerified"
    | "ProfessionalRegistrationVerificationFailed"
    | "ProfessionalRegistrationRenewed"
    | "ProfessionalRegistrationSuspended"
    | "ProfessionalRegistrationRevoked"
    | "ProfessionalRegistrationEnteredInError";
  registrationId: ProfessionalRegistrationId | string;
  staffMemberId: StaffMemberId | string;
  employmentRecordId?: EmploymentRecordId | string;
  actorUserAccountId: UserAccountId | string;
  occurredAt: string;
  changedFields?: string[];
}

export interface StaffVisaType {
  id: StaffVisaTypeId;
  code: string;
  name: string;
  countryCode?: string;
  permitsEmployment: "yes" | "no" | "conditional" | "unknown";
  requiresEmploymentPermit: boolean;
  active: boolean;
  notes?: string;
}

export interface StaffEmploymentPermitType {
  id: StaffEmploymentPermitTypeId;
  code: string;
  name: string;
  active: boolean;
  notes?: string;
}

export interface StaffVisaRecord {
  id: StaffVisaRecordId;
  staffMemberId: StaffMemberId;
  employmentRecordId?: EmploymentRecordId;
  visaTypeId: StaffVisaTypeId;
  visaReferenceNumber?: string;
  issuingCountryCode?: string;
  issuingAuthority?: string;
  issueDate?: string;
  validFrom?: string;
  expiryDate?: string;
  reviewDate?: string;
  status: StaffImmigrationRecordStatus;
  verificationStatus: StaffDocumentVerificationStatus;
  evidenceFileId?: FileId;
  linkedStaffDocumentId?: StaffDocumentId;
  lastVerifiedAt?: string;
  verifiedByUserAccountId?: UserAccountId;
  verifiedByStaffMemberId?: StaffMemberId;
  verificationReference?: string;
  restrictionsOrConditionsPresent: boolean;
  restrictionsSummary?: string;
  notes?: string;
  versionNumber: number;
  versionChainId: string;
  supersedesVisaRecordId?: StaffVisaRecordId;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface StaffResidencePermissionRecord {
  id: StaffResidencePermissionRecordId;
  staffMemberId: StaffMemberId;
  employmentRecordId?: EmploymentRecordId;
  registrationNumber: string;
  normalisedRegistrationNumber?: string;
  permissionTypeOrStamp?: string;
  issueDate?: string;
  expiryDate?: string;
  reviewDate?: string;
  status: StaffImmigrationRecordStatus;
  verificationStatus: StaffDocumentVerificationStatus;
  evidenceFileId?: FileId;
  linkedStaffDocumentId?: StaffDocumentId;
  lastVerifiedAt?: string;
  verifiedByUserAccountId?: UserAccountId;
  verifiedByStaffMemberId?: StaffMemberId;
  verificationReference?: string;
  notes?: string;
  versionNumber: number;
  versionChainId: string;
  supersedesResidencePermissionRecordId?: StaffResidencePermissionRecordId;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface StaffEmploymentPermitRecord {
  id: StaffEmploymentPermitRecordId;
  staffMemberId: StaffMemberId;
  employmentRecordId?: EmploymentRecordId;
  permitTypeId: StaffEmploymentPermitTypeId;
  permitNumber?: string;
  employerName?: string;
  employerReferenceId?: EnterpriseId | NursingHomeId;
  roleKey?: string;
  issueDate?: string;
  validFrom?: string;
  expiryDate?: string;
  reviewDate?: string;
  status: StaffImmigrationRecordStatus;
  verificationStatus: StaffDocumentVerificationStatus;
  evidenceFileId?: FileId;
  linkedStaffDocumentId?: StaffDocumentId;
  lastVerifiedAt?: string;
  verifiedByUserAccountId?: UserAccountId;
  verifiedByStaffMemberId?: StaffMemberId;
  verificationReference?: string;
  restrictionsOrConditionsPresent: boolean;
  restrictionsSummary?: string;
  notes?: string;
  versionNumber: number;
  versionChainId: string;
  supersedesPermitRecordId?: StaffEmploymentPermitRecordId;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface StaffImmigrationRequirementProfile {
  id: StaffImmigrationRequirementProfileId;
  staffMemberId: StaffMemberId;
  employmentRecordId?: EmploymentRecordId;
  visaRequired: boolean;
  residencePermissionRequired: boolean;
  employmentPermitRequired: boolean;
  reason?: string;
  active: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
}

export interface StaffDocumentType {
  id: StaffDocumentTypeId;
  key: StaffDocumentTypeKey;
  name: string;
  category: StaffDocumentCategory;
  supportsIssueDate: boolean;
  supportsExpiryDate: boolean;
  supportsReviewDate: boolean;
  requiresVerification: boolean;
  sensitive: boolean;
  active: boolean;
  displayOrder: number;
}

export interface StaffDocument {
  id: StaffDocumentId;
  staffMemberId: StaffMemberId;
  employmentRecordId?: EmploymentRecordId;
  documentTypeId: StaffDocumentTypeId;
  title?: string;
  referenceNumber?: string;
  issuingAuthority?: string;
  issuingCountryCode?: string;
  issueDate?: string;
  expiryDate?: string;
  reviewDate?: string;
  status: StaffDocumentStatus;
  verificationStatus: StaffDocumentVerificationStatus;
  fileId: FileId;
  lastVerifiedAt?: string;
  verifiedByUserAccountId?: UserAccountId;
  verifiedByStaffMemberId?: StaffMemberId;
  verificationMethod?: "original_seen" | "certified_copy" | "issuing_body_check" | "official_portal" | "employer_confirmation" | "manual_review" | "other";
  verificationReference?: string;
  linkedProfessionalRegistrationId?: ProfessionalRegistrationId;
  linkedVisaRecordId?: StaffVisaRecordId;
  linkedResidencePermissionRecordId?: StaffResidencePermissionRecordId;
  linkedEmploymentPermitRecordId?: StaffEmploymentPermitRecordId;
  trainingCompletionId?: string;
  notes?: string;
  versionNumber: number;
  versionChainId: string;
  supersedesDocumentId?: StaffDocumentId;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface StaffDocumentVerificationRecord {
  id: StaffDocumentVerificationRecordId;
  staffDocumentId: StaffDocumentId;
  status: StaffDocumentVerificationStatus;
  method?: StaffDocument["verificationMethod"];
  reference?: string;
  notes?: string;
  actorUserAccountId: UserAccountId;
  actorStaffMemberId?: StaffMemberId;
  occurredAt: string;
}

export interface StaffDocumentRequirement {
  id: StaffDocumentRequirementId;
  documentTypeId: StaffDocumentTypeId;
  targetType: "role" | "employment_contract" | "nursing_home" | "staff_member" | "all_staff";
  roleKey?: string;
  contractType?: EmploymentContractType;
  nursingHomeId?: NursingHomeId;
  staffMemberId?: StaffMemberId;
  active: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  reviewPolicyDays?: number;
}

export interface StaffDocumentEvent {
  id: string;
  type:
    | "StaffDocumentCreated"
    | "StaffDocumentUploaded"
    | "StaffDocumentUpdated"
    | "StaffDocumentSubmittedForVerification"
    | "StaffDocumentVerified"
    | "StaffDocumentVerificationFailed"
    | "StaffDocumentUnableToVerify"
    | "StaffDocumentRenewed"
    | "StaffDocumentReplaced"
    | "StaffDocumentExpired"
    | "StaffDocumentReviewDue"
    | "StaffDocumentEnteredInError"
    | "StaffDocumentComplianceChanged";
  staffDocumentId: StaffDocumentId | string;
  staffMemberId: StaffMemberId | string;
  employmentRecordId?: EmploymentRecordId | string;
  documentTypeId: StaffDocumentTypeId | string;
  safeStatus: StaffDocumentStatus;
  verificationStatus: StaffDocumentVerificationStatus;
  expiryDate?: string;
  reviewDate?: string;
  actorUserAccountId: UserAccountId | string;
  occurredAt: string;
  correlationId: string;
}

export interface StaffImmigrationEvent {
  id: string;
  type:
    | "StaffVisaCreated"
    | "StaffVisaVerified"
    | "StaffVisaRenewed"
    | "StaffVisaExpired"
    | "ResidencePermissionCreated"
    | "ResidencePermissionVerified"
    | "ResidencePermissionRenewed"
    | "ResidencePermissionExpired"
    | "EmploymentPermitCreated"
    | "EmploymentPermitVerified"
    | "EmploymentPermitRenewed"
    | "EmploymentPermitExpired"
    | "ImmigrationRequirementProfileChanged"
    | "ImmigrationComplianceChanged";
  recordType: StaffImmigrationRecordType;
  recordId: string;
  staffMemberId: StaffMemberId | string;
  employmentRecordId?: EmploymentRecordId | string;
  safeStatus: StaffImmigrationRecordStatus;
  verificationStatus?: StaffDocumentVerificationStatus;
  expiryDate?: string;
  reviewDate?: string;
  actorUserAccountId: UserAccountId | string;
  occurredAt: string;
  correlationId: string;
}

export interface TrainingRenewalRule {
  frequency: TrainingRenewalFrequency;
  customMonths?: number;
  renewalDueFrom: "completion_date" | "certificate_expiry_date" | "verification_date";
  warningDays?: number;
  urgentWarningDays?: number;
}

export interface TrainingInitialDueRule {
  dueFrom: "employment_start" | "role_assignment_start" | "home_assignment_start" | "ward_assignment_start" | "assignment_created" | "explicit_date";
  offsetDays?: number;
  explicitDate?: string;
}

export interface TrainingCourse {
  id: TrainingCourseId;
  code: string;
  title: string;
  description?: string;
  category: "mandatory" | "clinical" | "safety" | "governance" | "management" | "induction" | "professional_development" | "other";
  mandatoryByDefault: boolean;
  deliveryMethods: TrainingDeliveryMethod[];
  defaultRenewalFrequency?: TrainingRenewalFrequency;
  defaultValidityMonths?: number;
  certificateRequired: boolean;
  verificationRequired: boolean;
  providerName?: string;
  externalCourseReference?: string;
  status: TrainingCourseStatus;
  enterpriseId?: EnterpriseId;
  nursingHomeId?: NursingHomeId;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface TrainingRequirement {
  id: TrainingRequirementId;
  trainingCourseId: TrainingCourseId;
  targetType: TrainingRequirementTarget;
  roleKeys?: string[];
  employmentCategories?: string[];
  contractTypes?: EmploymentContractType[];
  enterpriseId?: EnterpriseId;
  nursingHomeId?: NursingHomeId;
  wardId?: WardId;
  staffMemberId?: StaffMemberId;
  mandatory: boolean;
  renewalRule?: TrainingRenewalRule;
  initialDueRule?: TrainingInitialDueRule;
  gracePeriodDays?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  active: boolean;
  sourcePolicyDocumentId?: StaffDocumentId;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface StaffTrainingAssignment {
  id: StaffTrainingAssignmentId;
  staffMemberId: StaffMemberId;
  employmentRecordId?: EmploymentRecordId;
  trainingCourseId: TrainingCourseId;
  trainingRequirementId?: TrainingRequirementId;
  enterpriseId?: EnterpriseId;
  nursingHomeId?: NursingHomeId;
  wardId?: WardId;
  assignedAt: string;
  dueDate?: string;
  status: StaffTrainingAssignmentStatus;
  exemptionReason?: string;
  exemptionApprovedByUserAccountId?: UserAccountId;
  exemptionApprovedAt?: string;
  latestCompletionId?: StaffTrainingCompletionId;
  source: "requirement" | "manual" | "induction" | "role_change" | "home_assignment" | "ward_assignment" | "other";
  createdAt: string;
  updatedAt: string;
}

export interface StaffTrainingCompletion {
  id: StaffTrainingCompletionId;
  staffMemberId: StaffMemberId;
  employmentRecordId?: EmploymentRecordId;
  trainingCourseId: TrainingCourseId;
  trainingAssignmentId?: StaffTrainingAssignmentId;
  completionDate: string;
  expiryDate?: string;
  score?: number;
  passMark?: number;
  result?: "passed" | "failed" | "attendance_only" | "completed" | "other";
  deliveryMethod?: TrainingDeliveryMethod;
  providerName?: string;
  trainerName?: string;
  certificateDocumentId?: StaffDocumentId;
  certificateFileId?: FileId;
  status: TrainingCompletionStatus;
  verificationStatus: StaffDocumentVerificationStatus;
  verifiedAt?: string;
  verifiedByUserAccountId?: UserAccountId;
  verifiedByStaffMemberId?: StaffMemberId;
  verificationReference?: string;
  notes?: string;
  versionNumber: number;
  versionChainId: string;
  supersedesCompletionId?: StaffTrainingCompletionId;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface TrainingEvent {
  id: string;
  type:
    | "TrainingCourseCreated"
    | "TrainingCourseUpdated"
    | "TrainingCourseActivated"
    | "TrainingCourseRetired"
    | "TrainingRequirementCreated"
    | "TrainingRequirementUpdated"
    | "TrainingAssignmentCreated"
    | "TrainingAssignmentUpdated"
    | "TrainingCompletionRecorded"
    | "TrainingCompletionSubmittedForVerification"
    | "TrainingCompletionVerified"
    | "TrainingCompletionVerificationFailed"
    | "TrainingRefresherRecorded"
    | "TrainingAssignmentExempted"
    | "TrainingCompletionEnteredInError"
    | "TrainingComplianceChanged";
  staffMemberId?: StaffMemberId | string;
  employmentRecordId?: EmploymentRecordId | string;
  trainingCourseId?: TrainingCourseId | string;
  trainingRequirementId?: TrainingRequirementId | string;
  trainingAssignmentId?: StaffTrainingAssignmentId | string;
  trainingCompletionId?: StaffTrainingCompletionId | string;
  safeStatus?: string;
  dueDate?: string;
  expiryDate?: string;
  actorUserAccountId: UserAccountId | string;
  occurredAt: string;
  correlationId: string;
}

export interface CompetencyDefinition {
  id: CompetencyDefinitionId;
  code: string;
  title: string;
  description?: string;
  category: CompetencyCategory;
  status: CompetencyDefinitionStatus;
  requiresTrainingCourseIds?: TrainingCourseId[];
  requiresProfessionalRegistration?: boolean;
  defaultValidityMonths?: number;
  supervisionAllowed: boolean;
  enterpriseId?: EnterpriseId;
  nursingHomeId?: NursingHomeId;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface CompetencyRequirement {
  id: CompetencyRequirementId;
  competencyDefinitionId: CompetencyDefinitionId;
  targetType: CompetencyRequirementTarget;
  roleKeys?: string[];
  employmentCategories?: string[];
  enterpriseId?: EnterpriseId;
  nursingHomeId?: NursingHomeId;
  wardId?: WardId;
  staffMemberId?: StaffMemberId;
  mandatory: boolean;
  active: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface StaffCompetencyValidation {
  id: StaffCompetencyValidationId;
  staffMemberId: StaffMemberId;
  employmentRecordId?: EmploymentRecordId;
  competencyDefinitionId: CompetencyDefinitionId;
  competencyRequirementId?: CompetencyRequirementId;
  scopeType: "enterprise" | "nursing_home" | "ward" | "role" | "individual";
  enterpriseId?: EnterpriseId;
  nursingHomeId?: NursingHomeId;
  wardId?: WardId;
  roleKey?: string;
  status: CompetencyValidationStatus;
  validationDate?: string;
  expiryDate?: string;
  reviewDate?: string;
  validatedByStaffMemberId?: StaffMemberId;
  validatedByUserAccountId?: UserAccountId;
  evidenceDocumentId?: StaffDocumentId;
  evidenceFileId?: FileId;
  supervisionRequired: boolean;
  restrictionsPresent: boolean;
  restrictionsSummary?: string;
  assessmentSummary?: string;
  notes?: string;
  versionNumber: number;
  versionChainId: string;
  supersedesValidationId?: StaffCompetencyValidationId;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface CompetencyEvent {
  id: string;
  type:
    | "CompetencyDefinitionCreated"
    | "CompetencyDefinitionUpdated"
    | "CompetencyDefinitionActivated"
    | "CompetencyRequirementCreated"
    | "CompetencyRequirementUpdated"
    | "StaffCompetencyDraftCreated"
    | "StaffCompetencySubmittedForValidation"
    | "StaffCompetencyValidated"
    | "StaffCompetencyValidatedWithSupervision"
    | "StaffCompetencyNotYetAchieved"
    | "StaffCompetencyRenewed"
    | "StaffCompetencyExpired"
    | "StaffCompetencySuspended"
    | "StaffCompetencyRevoked"
    | "StaffCompetencyEnteredInError"
    | "StaffCompetencyComplianceChanged";
  staffMemberId?: StaffMemberId | string;
  employmentRecordId?: EmploymentRecordId | string;
  competencyDefinitionId?: CompetencyDefinitionId | string;
  competencyValidationId?: StaffCompetencyValidationId | string;
  status?: string;
  validationDate?: string;
  expiryDate?: string;
  actorUserAccountId: UserAccountId | string;
  occurredAt: string;
  correlationId: string;
}

export interface WardCompetencyRequirement {
  id: WardCompetencyRequirementId;
  enterpriseId?: EnterpriseId;
  nursingHomeId: NursingHomeId;
  wardId: WardId;
  competencyDefinitionId: CompetencyDefinitionId;
  requirementLevel: WardCompetencyRequirementLevel;
  applicableRoleKeys?: string[];
  minimumCompetentStaffPerShift?: number;
  minimumFullyCompetentStaffPerShift?: number;
  supervisionAccepted: boolean;
  active: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface WardCompetencyRequirementEvent {
  id: string;
  type: "WardCompetencyRequirementCreated" | "WardCompetencyRequirementUpdated" | "WardCompetencyCoverageChanged";
  wardCompetencyRequirementId: WardCompetencyRequirementId | string;
  nursingHomeId: NursingHomeId | string;
  wardId: WardId | string;
  competencyDefinitionId: CompetencyDefinitionId | string;
  actorUserAccountId: UserAccountId | string;
  occurredAt: string;
  correlationId: string;
  changedFields?: string[];
}

export interface StaffingEstablishmentVersion {
  id: StaffingEstablishmentVersionId;
  enterpriseId?: EnterpriseId;
  nursingHomeId: NursingHomeId;
  versionNumber: number;
  versionName: string;
  status: StaffingEstablishmentStatus;
  effectiveFrom: string;
  effectiveTo?: string;
  sourceBudgetReference?: string;
  sourceDocumentId?: StaffDocumentId;
  notes?: string;
  submittedAt?: string;
  submittedByUserAccountId?: UserAccountId;
  approvedAt?: string;
  approvedByUserAccountId?: UserAccountId;
  supersedesVersionId?: StaffingEstablishmentVersionId;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface StaffingEstablishmentLine {
  id: StaffingEstablishmentLineId;
  establishmentVersionId: StaffingEstablishmentVersionId;
  nursingHomeId: NursingHomeId;
  wardId?: WardId;
  roleKey: string;
  employmentCategory?: EmploymentRecord["employmentCategory"];
  contractType?: EmploymentContractType;
  budgetedHeadcount?: number;
  budgetedFte?: number;
  budgetedHoursPerWeek?: number;
  minimumHeadcount?: number;
  minimumRegisteredStaff?: number;
  agencyAllowed: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffingEstablishmentEvent {
  id: string;
  type:
    | "StaffingEstablishmentDraftCreated"
    | "StaffingEstablishmentUpdated"
    | "StaffingEstablishmentSubmittedForApproval"
    | "StaffingEstablishmentApproved"
    | "StaffingEstablishmentSuperseded"
    | "StaffingEstablishmentRetired"
    | "StaffingEstablishmentEnteredInError"
    | "StaffingEstablishmentLineAdded"
    | "StaffingEstablishmentLineUpdated"
    | "StaffingEstablishmentComparisonChanged"
    | "StaffingVacancyChanged";
  establishmentVersionId: StaffingEstablishmentVersionId | string;
  establishmentLineId?: StaffingEstablishmentLineId | string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  roleKey?: string;
  status?: StaffingEstablishmentStatus;
  safeActualSummary?: unknown;
  actorUserAccountId: UserAccountId | string;
  occurredAt: string;
  correlationId: string;
}

export interface RecruitmentEstablishmentSource {
  establishmentVersionId: StaffingEstablishmentVersionId;
  establishmentLineId: StaffingEstablishmentLineId;
  authorisedVacantHeadcount?: number;
  authorisedVacantFte?: number;
  vacancySnapshotAt: string;
}

export interface RecruitmentAdvertisingSource {
  id: RecruitmentAdvertisingSourceId;
  code: string;
  name: string;
  category: "company_website" | "job_board" | "social_media" | "agency" | "referral" | "internal" | "local_advertising" | "other";
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecruitmentVacancy {
  id: RecruitmentVacancyId;
  enterpriseId?: EnterpriseId;
  nursingHomeId: NursingHomeId;
  wardId?: WardId;
  establishmentLineId?: StaffingEstablishmentLineId;
  establishmentSource?: RecruitmentEstablishmentSource;
  jobTitle: string;
  roleKey: string;
  employmentCategory?: string;
  contractType?: EmploymentContractType;
  employmentBasis: VacancyEmploymentBasis;
  positionsRequired?: number;
  fteRequired?: number;
  hoursPerWeekRequired?: number;
  positionsFilled: number;
  fteFilled?: number;
  status: RecruitmentVacancyStatus;
  priority: "low" | "medium" | "high" | "critical";
  urgencyReason?: string;
  requestedAt: string;
  approvedAt?: string;
  targetStartDate?: string;
  plannedStartDate?: string;
  advertisingSourceIds: RecruitmentAdvertisingSourceId[];
  currentInterviewStage?: RecruitmentInterviewStageKey;
  offerSentAt?: string;
  offerAcceptedAt?: string;
  hiredCandidateId?: RecruitmentCandidateId;
  resultingStaffMemberId?: StaffMemberId;
  resultingEmploymentRecordId?: EmploymentRecordId;
  hiringManagerStaffMemberId?: StaffMemberId;
  sourceReason: "establishment_vacancy" | "replacement" | "new_service" | "temporary_cover" | "leave_cover" | "growth" | "other";
  sourceReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface RecruitmentCandidate {
  id: RecruitmentCandidateId;
  recruitmentVacancyId: RecruitmentVacancyId;
  firstName: string;
  surname: string;
  email?: string;
  phone?: string;
  status: RecruitmentCandidateStatus;
  currentStage: RecruitmentInterviewStageKey;
  applicationDate: string;
  plannedStartDate?: string;
  resultingStaffMemberId?: StaffMemberId;
  createdAt: string;
  updatedAt: string;
}

export interface RecruitmentOffer {
  id: RecruitmentOfferId;
  recruitmentVacancyId: RecruitmentVacancyId;
  candidateId: RecruitmentCandidateId;
  status: RecruitmentOfferStatus;
  proposedRoleKey: string;
  proposedNursingHomeId: NursingHomeId;
  proposedWardId?: WardId;
  proposedContractType?: EmploymentContractType;
  proposedFte?: number;
  proposedHoursPerWeek?: number;
  proposedStartDate?: string;
  sentAt?: string;
  respondedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecruitmentEvent {
  id: string;
  type:
    | "RecruitmentVacancyCreated"
    | "RecruitmentVacancyApproved"
    | "RecruitmentVacancyOpened"
    | "RecruitmentVacancyUpdated"
    | "RecruitmentVacancyPlacedOnHold"
    | "RecruitmentVacancyCancelled"
    | "RecruitmentVacancyClosedUnfilled"
    | "RecruitmentCandidateAdded"
    | "RecruitmentCandidateStageChanged"
    | "RecruitmentOfferCreated"
    | "RecruitmentOfferSent"
    | "RecruitmentOfferAccepted"
    | "RecruitmentOfferDeclined"
    | "RecruitmentHireCompleted"
    | "RecruitmentVacancyFilled"
    | "RecruitmentVacancyEnteredInError";
  recruitmentVacancyId: RecruitmentVacancyId | string;
  recruitmentCandidateId?: RecruitmentCandidateId | string;
  recruitmentOfferId?: RecruitmentOfferId | string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  roleKey?: string;
  status?: RecruitmentVacancyStatus | RecruitmentCandidateStatus | RecruitmentOfferStatus;
  quantities?: { positionsRequired?: number; positionsFilled?: number; fteRequired?: number; fteFilled?: number };
  plannedStartDate?: string;
  actorUserAccountId: UserAccountId | string;
  occurredAt: string;
  correlationId: string;
}

export interface RosterPeriod {
  id: RosterPeriodId;
  enterpriseId?: EnterpriseId;
  nursingHomeId: NursingHomeId;
  name: string;
  dateFrom: string;
  dateTo: string;
  status: RosterPeriodStatus;
  versionNumber: number;
  publishedAt?: string;
  publishedByUserAccountId?: UserAccountId;
  lockedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface RosterShiftRequirement {
  id: RosterShiftRequirementId;
  rosterPeriodId: RosterPeriodId;
  nursingHomeId: NursingHomeId;
  wardId?: WardId;
  shiftDefinitionId?: ShiftId;
  shiftDate: string;
  startAt: string;
  endAt: string;
  roleKey: string;
  requiredCount: number;
  status: RosterShiftRequirementStatus;
  competencyRequirementIds?: WardCompetencyRequirementId[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlannedShift {
  id: PlannedShiftId;
  rosterPeriodId: RosterPeriodId;
  requirementId?: RosterShiftRequirementId;
  nursingHomeId: NursingHomeId;
  wardId?: WardId;
  assignedStaffMemberId?: StaffMemberId;
  employmentRecordId?: EmploymentRecordId;
  roleKey: string;
  startAt: string;
  endAt: string;
  status: PlannedShiftStatus;
  confirmationRequired: boolean;
  confirmedAt?: string;
  confirmedByStaffMemberId?: StaffMemberId;
  replacementForShiftId?: PlannedShiftId;
  cancelledAt?: string;
  cancellationReason?: string;
  readiness?: { homeAssignment: "ok" | "warning"; professionalRegistration: "ok" | "warning" | "not_required"; competency: "ok" | "warning" | "unknown"; leaveConflict: boolean };
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface RosterEvent {
  id: string;
  type: "RosterPeriodCreated" | "RosterRequirementChanged" | "RosterShiftAdded" | "RosterStaffAssigned" | "RosterShiftConfirmed" | "RosterShiftMarkedVacant" | "RosterAssignmentReplaced" | "RosterShiftCancelled" | "RosterPublished" | "RosterLocked";
  rosterPeriodId: RosterPeriodId | string;
  rosterShiftRequirementId?: RosterShiftRequirementId | string;
  plannedShiftId?: PlannedShiftId | string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  staffMemberId?: StaffMemberId | string;
  roleKey?: string;
  status?: RosterPeriodStatus | RosterShiftRequirementStatus | PlannedShiftStatus;
  actorUserAccountId: UserAccountId | string;
  occurredAt: string;
  correlationId: string;
}

export interface StaffLeaveRecord {
  id: StaffLeaveRecordId;
  staffMemberId: StaffMemberId;
  employmentRecordId?: EmploymentRecordId;
  nursingHomeId: NursingHomeId;
  wardId?: WardId;
  leaveType: StaffLeaveType;
  status: StaffLeaveStatus;
  startAt: string;
  endAt: string;
  startDate: string;
  endDate: string;
  partialDay?: "none" | "morning" | "afternoon" | "custom";
  expectedReturnDate?: string;
  actualReturnDate?: string;
  rosterImpact?: { createsVacantShift: boolean; impactedPlannedShiftIds?: PlannedShiftId[]; notes?: string };
  confidentialReason?: string;
  notes?: string;
  requestedAt?: string;
  approvedAt?: string;
  approvedByUserAccountId?: UserAccountId;
  rejectedAt?: string;
  rejectedByUserAccountId?: UserAccountId;
  cancelledAt?: string;
  cancelledByUserAccountId?: UserAccountId;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface StaffLeaveEvent {
  id: string;
  type: "StaffLeaveCreated" | "StaffLeaveSubmitted" | "StaffLeaveApproved" | "StaffLeaveRejected" | "StaffLeaveCancelled" | "StaffLeaveExtended" | "StaffLeaveReturnRecorded" | "StaffLeaveEnteredInError";
  staffLeaveRecordId: StaffLeaveRecordId | string;
  staffMemberId: StaffMemberId | string;
  employmentRecordId?: EmploymentRecordId | string;
  nursingHomeId: NursingHomeId | string;
  leaveType: StaffLeaveType;
  status: StaffLeaveStatus;
  startDate: string;
  endDate: string;
  actorUserAccountId: UserAccountId | string;
  occurredAt: string;
  correlationId: string;
}

export interface AgencyCompany {
  id: AgencyCompanyId;
  enterpriseId?: EnterpriseId;
  name: string;
  tradingName?: string;
  supplierReference?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: PostalAddress;
  status: AgencyCompanyStatus;
  approvedSupplier: boolean;
  contractStartDate?: string;
  contractEndDate?: string;
  defaultCurrencyCode: string;
  insuranceExpiryDate?: string;
  complianceReviewDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface AgencyWorker {
  id: AgencyWorkerId;
  staffMemberId: StaffMemberId;
  agencyCompanyId: AgencyCompanyId;
  agencyWorkerReference?: string;
  status: AgencyWorkerStatus;
  primaryRoleKey: string;
  additionalRoleKeys: string[];
  effectiveFrom?: string;
  effectiveTo?: string;
  approvedNursingHomeIds: NursingHomeId[];
  complianceApproved: boolean;
  complianceApprovedAt?: string;
  complianceApprovedByUserAccountId?: UserAccountId;
  restrictionsPresent: boolean;
  restrictionsSummary?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgencyRateAgreement {
  id: AgencyRateAgreementId;
  agencyCompanyId: AgencyCompanyId;
  enterpriseId?: EnterpriseId;
  nursingHomeId?: NursingHomeId;
  roleKey: string;
  rateType: AgencyRateType;
  hourlyRate: MoneyAmount;
  additionalFlatFee?: MoneyAmount;
  effectiveFrom: string;
  effectiveTo?: string;
  status: "draft" | "approved" | "expired" | "cancelled" | "entered_in_error";
  approvedByUserAccountId?: UserAccountId;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgencyShiftAssignment {
  id: AgencyShiftAssignmentId;
  plannedShiftId?: PlannedShiftId;
  rosterShiftRequirementId?: RosterShiftRequirementId;
  agencyCompanyId: AgencyCompanyId;
  agencyWorkerId: AgencyWorkerId;
  staffMemberId: StaffMemberId;
  nursingHomeId: NursingHomeId;
  wardId?: WardId;
  roleKey: string;
  startAt: string;
  endAt: string;
  status: AgencyShiftAssignmentStatus;
  rateAgreementId?: AgencyRateAgreementId;
  plannedHours?: number;
  confirmationReference?: string;
  replacementForStaffMemberId?: StaffMemberId;
  replacementReason?: string;
  competencyReadinessStatus?: "ready" | "warning" | "blocked" | "unknown";
  trainingReadinessStatus?: string;
  registrationReadinessStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgencyTimesheet {
  id: AgencyTimesheetId;
  agencyShiftAssignmentId: AgencyShiftAssignmentId;
  agencyCompanyId: AgencyCompanyId;
  agencyWorkerId: AgencyWorkerId;
  staffMemberId: StaffMemberId;
  nursingHomeId: NursingHomeId;
  wardId?: WardId;
  roleKey: string;
  shiftStartAt: string;
  shiftEndAt: string;
  actualStartAt?: string;
  actualEndAt?: string;
  unpaidBreakMinutes?: number;
  hoursWorked: number;
  rateAgreementId?: AgencyRateAgreementId;
  hourlyRateSnapshot?: MoneyAmount;
  flatFeeSnapshot?: MoneyAmount;
  calculatedCost: MoneyAmount;
  approvedCost?: MoneyAmount;
  status: AgencyTimesheetStatus;
  submittedAt?: string;
  approvedAt?: string;
  approvedByUserAccountId?: UserAccountId;
  approvedByStaffMemberId?: StaffMemberId;
  rejectionReason?: string;
  disputeReason?: string;
  sourceAttendanceRecordId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgencySpendAlertPolicy {
  id: AgencySpendAlertPolicyId;
  enterpriseId?: EnterpriseId;
  nursingHomeId?: NursingHomeId;
  basis: AgencySpendThresholdBasis;
  warningThreshold?: number;
  highThreshold?: number;
  criticalThreshold?: number;
  comparisonPeriod?: "previous_week" | "previous_month" | "same_period_last_year";
  currencyCode?: string;
  version: number;
  status: "draft" | "approved" | "retired";
  effectiveFrom: string;
  effectiveTo?: string;
  sourcePolicyDocumentId?: StaffDocumentId;
}

export interface AgencyEvent {
  id: string;
  type: "AgencyCompanyCreated" | "AgencyWorkerCreated" | "AgencyWorkerAssignedToShift" | "AgencyTimesheetSubmitted" | "AgencyTimesheetApproved" | "AgencySpendChanged" | "AgencyWteChanged" | "AgencySpendThresholdExceeded" | "AgencyWorkerNoShow" | "AgencyRecordEnteredInError";
  agencyCompanyId?: AgencyCompanyId | string;
  agencyWorkerId?: AgencyWorkerId | string;
  agencyShiftAssignmentId?: AgencyShiftAssignmentId | string;
  agencyTimesheetId?: AgencyTimesheetId | string;
  nursingHomeId?: NursingHomeId | string;
  wardId?: WardId | string;
  roleKey?: string;
  reportingPeriod?: { from: string; to: string };
  safeSummary?: unknown;
  actorUserAccountId?: UserAccountId | string;
  occurredAt: string;
  correlationId: string;
}

export interface ProbationReviewSchedulePolicy {
  id: ProbationReviewSchedulePolicyId;
  enterpriseId?: EnterpriseId;
  nursingHomeId?: NursingHomeId;
  reviewOffsetsDays: number[];
  finalReviewOffsetDays?: number;
  status: "draft" | "approved" | "retired";
  version: number;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffProbation {
  id: StaffProbationId;
  staffMemberId: StaffMemberId;
  employmentRecordId: EmploymentRecordId;
  nursingHomeId: NursingHomeId;
  wardId?: WardId;
  probationStartDate: string;
  originalExpectedEndDate: string;
  currentExpectedEndDate: string;
  status: StaffProbationStatus;
  outcome?: StaffProbationOutcome;
  completedAt?: string;
  completedByUserAccountId?: UserAccountId;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserAccountId: UserAccountId;
  updatedByUserAccountId: UserAccountId;
}

export interface StaffProbationReview {
  id: StaffProbationReviewId;
  probationId: StaffProbationId;
  staffMemberId: StaffMemberId;
  employmentRecordId: EmploymentRecordId;
  nursingHomeId: NursingHomeId;
  scheduledDate: string;
  reviewNumber: number;
  status: StaffProbationReviewStatus;
  completedAt?: string;
  reviewedByStaffMemberId?: StaffMemberId;
  reviewedByUserAccountId?: UserAccountId;
  outcome?: StaffProbationOutcome;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffProbationExtension {
  id: StaffProbationExtensionId;
  probationId: StaffProbationId;
  previousExpectedEndDate: string;
  newExpectedEndDate: string;
  reason: string;
  approvedAt?: string;
  approvedByUserAccountId?: UserAccountId;
  createdAt: string;
  updatedAt: string;
}

export interface ProbationEvent {
  id: string;
  type: "StaffProbationCreated" | "ProbationReviewScheduled" | "ProbationReviewCompleted" | "StaffProbationExtended" | "StaffProbationCompleted" | "StaffProbationFailed" | "ProbationReviewOverdue" | "ProbationRecordEnteredInError";
  probationId: StaffProbationId | string;
  probationReviewId?: StaffProbationReviewId | string;
  staffMemberId: StaffMemberId | string;
  employmentRecordId?: EmploymentRecordId | string;
  nursingHomeId: NursingHomeId | string;
  safeStatus?: StaffProbationStatus | StaffProbationReviewStatus;
  actorUserAccountId?: UserAccountId | string;
  occurredAt: string;
  correlationId: string;
}

export interface StaffingEstablishmentWtePolicy {
  id: string;
  enterpriseId?: EnterpriseId;
  nursingHomeId?: NursingHomeId;
  standardWeeklyHours: number;
  status: "draft" | "approved" | "retired";
  version: number;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffingEstablishmentComparisonLine {
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  roleKey: string;
  budgetedWte?: number;
  requiredWte?: number;
  actualPermanentWte?: number;
  agencyWte?: number;
  totalCoveredWte?: number;
  budgetVacancyWte?: number;
  requiredCoverageGapWte?: number;
  vacancyPercent?: number;
  agencyPercent?: number;
  availability: DashboardMetricAvailability;
  explanation: string;
}

export interface StaffingEstablishmentSummary {
  nursingHomeId: NursingHomeId;
  establishmentVersionId?: StaffingEstablishmentVersionId;
  budgetedWte?: number;
  requiredWte?: number;
  actualPermanentWte?: number;
  agencyWte?: number;
  totalCoveredWte?: number;
  budgetVacancyWte?: number;
  requiredCoverageGapWte?: number;
  vacancyPercent?: number;
  agencyPercent?: number;
  safeStaffingCoveragePercent?: number;
  safeStaffingStatus?: SafeStaffingReadinessStatus;
  missingEmploymentWteCount: number;
  missingHomeAllocationCount: number;
  missingAgencyTimesheetCount: number;
  lines: StaffingEstablishmentComparisonLine[];
  availability: DashboardMetricAvailability;
  explanation: string;
  generatedAt: string;
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
  active?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  preferredContactMethod?: "phone" | "mobile" | "email" | "post";
  communicationPermission?: "general_updates" | "clinical_updates" | "emergency_only" | "none";
  authorityReference?: string;
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
  middleName?: string;
  previousSurname?: string;
  pronouns?: string;
  residentNumber?: string;
  nationality?: string;
  phone?: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  profileUpdatedAt?: string;
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
  hospitalNumber?: string;
  healthInsuranceProvider?: string;
  healthInsurancePolicyNumber?: string;
  healthInsuranceExpiry?: string;
  medicalCardNumber?: string;
  medicalCardExpiry?: string;
  gpVisitCardNumber?: string;
  gpVisitCardExpiry?: string;
  contractStatus?: string;
  contractSignedDate?: string;
  contractReviewDate?: string;
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
  | "handover.acknowledged"
  | "contact.assigned"
  | "contact.changed"
  | "contact.inactivated";

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

export type CareActionType = "scheduled" | "prn" | "triggered" | "one_off";
export type CareActionPriority = "routine" | "important" | "urgent" | "critical";
export type EndOfLifeSymptomType =
  | "pain" | "breathlessness" | "respiratory_secretions" | "agitation" | "restlessness"
  | "anxiety" | "nausea" | "vomiting" | "oral_dryness" | "swallowing_difficulty"
  | "reduced_intake" | "skin_mottling" | "cold_extremities" | "jerking_or_twitching"
  | "reduced_consciousness" | "urinary_retention" | "constipation" | "other";
export interface PrnCareActionConfiguration {
  indication: string;
  indications?: string[];
  minimumIntervalMinutes?: number;
  maximumOccurrencesPerPeriod?: { count: number; periodMinutes: number };
  requiresOutcomeRecording: boolean;
  requiresResidentResponse: boolean;
  requiresReasonForUse: boolean;
  escalationAfterOccurrences?: number;
  escalationWindowMinutes?: number;
  linkedMedicationReferenceId?: string;
  linkedSymptomType?: EndOfLifeSymptomType;
}
export interface TriggeredCareActionConfiguration {
  triggerMode: "event" | "rule" | "manual_clinical_activation";
  triggerEventTypes?: string[];
  triggerRuleIds?: string[];
  triggerConditionSummary: string;
  createWorkItemOnTrigger: boolean;
  resultingWorkType?: "care_action" | "general_task" | "observation" | "assessment" | "care_plan_review" | "referral" | "documentation";
  dueOffsetMinutes?: number;
  assignmentPolicy: "ward" | "role" | "team" | "unassigned";
  assignedRoleKey?: string;
  assignedTeamId?: string;
  deduplicationMode: "per_event" | "single_active" | "single_active_per_trigger" | "time_window";
  deduplicationWindowMinutes?: number;
  requiresHumanConfirmation: boolean;
}
export interface OneOffCareActionConfiguration {
  dueAt?: string;
  canBeCompletedWithoutDueDate: boolean;
  requiresOutcomeRecording: boolean;
  requiresResidentResponse: boolean;
  autoCloseAfterCompletion: boolean;
  completionEvidenceType?: "clinical_note" | "review" | "referral" | "communication_record" | "document" | "manual_confirmation";
}
export interface CareActionCompletionRequirements { outcomeRequired: boolean; residentResponseRequired: boolean; evidenceRequired?: boolean; }
export interface CareActionVisibilityPolicy { showInCarePlan: boolean; showAtPointOfCare: boolean; sensitive?: boolean; }

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
  careActionType?: CareActionType;
  priority?: CareActionPriority;
  prnConfiguration?: PrnCareActionConfiguration;
  triggerConfiguration?: TriggeredCareActionConfiguration;
  oneOffConfiguration?: OneOffCareActionConfiguration;
  completionRequirements?: CareActionCompletionRequirements;
  visibilityPolicy?: CareActionVisibilityPolicy;
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
  observationDetails?: Record<string, string | number | boolean | string[] | undefined>;
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
  /** Additive Phase 55 representation. Legacy scalar fields remain for compatibility. */
  canonicalObservation?: import("../../domain/observations/observationTypes").ResidentObservationRecord;
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
  | "respiratory"
  | "neurological_observations";

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
