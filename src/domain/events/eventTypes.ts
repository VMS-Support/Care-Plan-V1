import type {
  AdmissionId,
  BedId,
  CareActionId,
  CarePlanId,
  CarePlanItemId,
  DomainEventId,
  EnterpriseId,
  HandoverId,
  IncidentId,
  NursingHomeId,
  ResidentId,
  ReviewId,
  RoleAssignmentId,
  RoomId,
  ShiftId,
  StaffMemberId,
  UserAccountId,
  WardId,
} from "@/types/entityIds";

export type DomainEventType =
  | "ResidentAdmitted"
  | "ResidentReturnedFromHospital"
  | "ObservationRecorded"
  | "WeightRecorded"
  | "AssessmentCompleted"
  | "AssessmentRiskChanged"
  | "AssessmentCorrected"
  | "AssessmentVoided"
  | "AssessmentGuidanceRecalculationRequested"
  | "CarePlanCreated"
  | "CarePlanReviewed"
  | "RltDependencyRecorded"
  | "RltDependencyChanged"
  | "RltDependencyReviewed"
  | "RltDependencyCorrected"
  | "CareActionCompleted"
  | "CareActionMissed"
  | "MedicationRefused"
  | "IncidentRecorded"
  | "HandoverCreated"
  | "DailyCareRecorded";

export type EventActorType = "user" | "system" | "integration" | "migration";

export interface EventActor {
  actorType: EventActorType;
  userAccountId?: UserAccountId | string;
  staffMemberId?: StaffMemberId | string;
  displayName?: string;
  roleAssignmentId?: RoleAssignmentId | string;
  effectiveRoleKey?: string;
}

export interface EventScope {
  enterpriseId?: EnterpriseId | string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  roomId?: RoomId | string;
  bedId?: BedId | string;
  shiftId?: ShiftId | string;
  operationalDate?: string;
  timezone: string;
}

export interface EventSubject {
  entityType: string;
  entityId: string;
  residentId?: ResidentId | string;
}

export interface EventSource {
  module: string;
  service: string;
  operation: string;
  auditRecordId?: string;
}

export interface DomainEvent<TType extends DomainEventType | string, TPayload> {
  eventId: DomainEventId;
  eventType: TType;
  eventVersion: number;
  occurredAt: string;
  recordedAt: string;
  actor: EventActor;
  scope: EventScope;
  subject: EventSubject;
  source: EventSource;
  payload: TPayload;
  previousValues?: Record<string, unknown>;
  currentValues?: Record<string, unknown>;
  correlationId: string;
  causationId?: DomainEventId;
  requestId?: string;
  ruleContext?: {
    originatingRuleId?: string;
    originatingRuleVersion?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface ResidentAdmittedPayloadV1 {
  residentId: ResidentId | string;
  admissionId: AdmissionId | string;
  admissionType: "long_term" | "respite" | "short_stay" | "other";
  admittedAt: string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  roomId?: RoomId | string;
  bedId?: BedId | string;
}

export interface ResidentReturnedFromHospitalPayloadV1 {
  residentId: ResidentId | string;
  admissionId: AdmissionId | string;
  absenceEpisodeId: string;
  returnedAt: string;
  nursingHomeId: NursingHomeId | string;
  destinationWardId?: WardId | string;
  destinationRoomId?: RoomId | string;
  destinationBedId?: BedId | string;
  hospitalName?: string;
}

export interface ObservationRecordedPayloadV1 {
  observationId: string;
  residentId: ResidentId | string;
  observationType: string;
  observedAt: string;
  values: Record<string, unknown>;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
}

export interface WeightRecordedPayloadV1 {
  observationId?: string;
  weightRecordId?: string;
  residentId: ResidentId | string;
  weightValue: number;
  unit: "kg" | "lb" | string;
  observedAt: string;
  previousWeightRecordId?: string;
}

export interface AssessmentCompletedPayloadV1 {
  assessmentId: string;
  residentId: ResidentId | string;
  assessmentType: string;
  completedAt: string;
  score?: number;
  riskLevel?: string;
  nextReassessmentDate?: string;
}

export interface AssessmentRiskChangedPayloadV1 {
  assessmentId: string;
  residentId: ResidentId | string;
  assessmentType: string;
  previousRiskLevel?: string;
  currentRiskLevel: string;
  previousScore?: number;
  currentScore?: number;
}

export interface AssessmentCorrectedPayloadV1 {
  assessmentId: string;
  residentId: ResidentId | string;
  assessmentType: string;
  correctedAt: string;
  previousScore?: number;
  currentScore?: number;
  previousRiskLevel?: string;
  currentRiskLevel?: string;
  correctionReason: string;
}

export interface AssessmentVoidedPayloadV1 {
  assessmentId: string;
  residentId: ResidentId | string;
  assessmentType: string;
  voidedAt: string;
  voidReason: string;
}

export interface AssessmentGuidanceRecalculationRequestedPayloadV1 {
  assessmentId: string;
  residentId: ResidentId | string;
  requestedAt: string;
  reasonCode: string;
}

export interface RltDependencyEventPayloadV1 {
  dependencyRecordId: string;
  residentId: ResidentId | string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  rltDomainId: string;
  previousLevel?: string;
  currentLevel: string;
  effectiveAt: string;
  recordedAt: string;
  actorUserAccountId: UserAccountId | string;
  actorStaffMemberId?: StaffMemberId | string;
  reasonCode: string;
  sourceEvidenceReferences: Array<{ entityType: string; entityId: string }>;
}
export type RltDependencyRecordedPayloadV1 = RltDependencyEventPayloadV1;
export type RltDependencyChangedPayloadV1 = RltDependencyEventPayloadV1;
export type RltDependencyReviewedPayloadV1 = RltDependencyEventPayloadV1;
export type RltDependencyCorrectedPayloadV1 = RltDependencyEventPayloadV1;

export interface CarePlanCreatedPayloadV1 {
  carePlanId: CarePlanId | string;
  carePlanItemId: CarePlanItemId | string;
  residentId: ResidentId | string;
  rltDomainId?: string;
  riskLevel?: string;
  reviewDate?: string;
}

export interface CarePlanReviewedPayloadV1 {
  reviewId: ReviewId | string;
  carePlanId: CarePlanId | string;
  carePlanItemId: CarePlanItemId | string;
  residentId: ResidentId | string;
  outcome: string;
  nextReviewDate?: string;
}

export interface CareActionCompletedPayloadV1 {
  careActionId: CareActionId | string;
  carePlanItemId?: CarePlanItemId | string;
  residentId: ResidentId | string;
  scheduledOccurrenceId?: string;
  dueAt?: string;
  effectiveCompletedAt: string;
  recordedAt: string;
  outcome: string;
  response?: string;
}

export interface CareActionMissedPayloadV1 {
  careActionId: CareActionId | string;
  occurrenceId: string;
  residentId: ResidentId | string;
  dueAt: string;
  missedAt: string;
  missedReason: string;
  followUpRequired?: boolean;
}

export interface MedicationRefusedPayloadV1 {
  residentId: ResidentId | string;
  medicationReferenceId: string;
  scheduledDoseOccurrenceId: string;
  refusedAt: string;
  medicationNameOrCode: string;
  reason?: string;
  actionTaken?: string;
}

export interface IncidentRecordedPayloadV1 {
  incidentId: IncidentId | string;
  residentId?: ResidentId | string;
  incidentType: string;
  occurredAt: string;
  nursingHomeId: NursingHomeId | string;
  wardId?: WardId | string;
  severity?: string;
}

export interface HandoverCreatedPayloadV1 {
  handoverId: HandoverId | string;
  residentId?: ResidentId | string;
  wardId: WardId | string;
  scope: "resident" | "ward";
  category: string;
  priority: string;
  sourceShiftId: ShiftId | string;
  targetShiftId: ShiftId | string;
  effectiveFrom: string;
  expiresAt?: string;
}

export interface DailyCareRecordedPayloadV1 {
  dailyCareRecordId: string;
  residentId: ResidentId | string;
  careType:
    | "personal_care"
    | "oral_care"
    | "toileting"
    | "continence"
    | "food"
    | "fluid"
    | "repositioning"
    | "mobility"
    | "comfort"
    | "sleep"
    | "mood"
    | "behaviour"
    | "activity"
    | "refusal"
    | "skin_observation"
    | "other";
  effectiveAt: string;
  outcomeCode: string;
  quantity?: number;
  unit?: string;
  escalationRequested?: boolean;
  relatedRltDomainIds?: string[];
}

export type DomainEventPayloadMapV1 = {
  ResidentAdmitted: ResidentAdmittedPayloadV1;
  ResidentReturnedFromHospital: ResidentReturnedFromHospitalPayloadV1;
  ObservationRecorded: ObservationRecordedPayloadV1;
  WeightRecorded: WeightRecordedPayloadV1;
  AssessmentCompleted: AssessmentCompletedPayloadV1;
  AssessmentRiskChanged: AssessmentRiskChangedPayloadV1;
  AssessmentCorrected: AssessmentCorrectedPayloadV1;
  AssessmentVoided: AssessmentVoidedPayloadV1;
  AssessmentGuidanceRecalculationRequested: AssessmentGuidanceRecalculationRequestedPayloadV1;
  CarePlanCreated: CarePlanCreatedPayloadV1;
  CarePlanReviewed: CarePlanReviewedPayloadV1;
  RltDependencyRecorded: RltDependencyRecordedPayloadV1;
  RltDependencyChanged: RltDependencyChangedPayloadV1;
  RltDependencyReviewed: RltDependencyReviewedPayloadV1;
  RltDependencyCorrected: RltDependencyCorrectedPayloadV1;
  CareActionCompleted: CareActionCompletedPayloadV1;
  CareActionMissed: CareActionMissedPayloadV1;
  MedicationRefused: MedicationRefusedPayloadV1;
  IncidentRecorded: IncidentRecordedPayloadV1;
  HandoverCreated: HandoverCreatedPayloadV1;
  DailyCareRecorded: DailyCareRecordedPayloadV1;
};

export type AnyDomainEvent = {
  [TType in keyof DomainEventPayloadMapV1]: DomainEvent<TType, DomainEventPayloadMapV1[TType]>;
}[keyof DomainEventPayloadMapV1];
