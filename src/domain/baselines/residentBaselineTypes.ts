import type { ConsciousnessLevel, ObservationUnit, OxygenDeliveryMethod } from "@/domain/observations/observationTypes";

export type ResidentBaselineType = "temperature" | "pulse" | "respirations" | "systolic_blood_pressure" | "diastolic_blood_pressure" | "spo2" | "oxygen_delivery" | "consciousness" | "news2" | "pain" | "weight" | "bmi" | "blood_glucose" | "neurological";
export type ResidentBaselineStatus = "draft" | "pending_approval" | "active" | "superseded" | "expired" | "revoked" | "entered_in_error" | "rejected";
export type ResidentBaselineSource = "gp_instruction" | "doctor_instruction" | "consultant_instruction" | "palliative_care_plan" | "respiratory_plan" | "diabetes_plan" | "nursing_assessment" | "hospital_discharge" | "approved_clinical_review" | "other";

export interface NumericBaselineValue { valueType: "numeric"; expectedValue?: number; expectedMinimum?: number; expectedMaximum?: number; unit: ObservationUnit; warningMinimum?: number; warningMaximum?: number }
export interface CodedBaselineValue { valueType: "coded"; expectedCode: string; acceptableCodes?: string[] }
export interface OxygenBaselineValue { valueType: "oxygen"; normallyOnSupplementalOxygen: boolean; usualDeliveryMethod?: OxygenDeliveryMethod; usualFlowRateLitresPerMinute?: number; prescribedTargetScale?: "news2_scale_1" | "news2_scale_2" | "custom_prescribed_target"; prescribedTargetMinimumSpo2?: number; prescribedTargetMaximumSpo2?: number; prescriptionReferenceId?: string }
export interface NeurologicalBaselineValue { valueType: "neurological"; usualConsciousness?: ConsciousnessLevel; usualGcsTotal?: number; knownPupilDifferences?: string; knownLimbWeakness?: string; knownSpeechDifference?: string; conciseBaselineSummary?: string }
export type ResidentBaselineValue = NumericBaselineValue | CodedBaselineValue | OxygenBaselineValue | NeurologicalBaselineValue;

export interface ResidentClinicalBaseline {
  id: string; residentId: string; nursingHomeId: string; baselineType: ResidentBaselineType;
  baselineValue: ResidentBaselineValue; status: ResidentBaselineStatus; clinicalRationale: string;
  source: ResidentBaselineSource; sourceEntityType?: string; sourceEntityId?: string; sourceDocumentId?: string;
  approvedByUserAccountId?: string; approvedByStaffMemberId?: string; approvedByRole?: string; approvedAt?: string;
  effectiveFrom: string; effectiveTo?: string; reviewDate: string; lastReviewedAt?: string;
  supersedesBaselineId?: string; versionNumber: number; versionChainId: string;
  createdAt: string; updatedAt: string; createdByUserAccountId: string; createdByStaffMemberId?: string;
  rejectionReason?: string; statusReason?: string;
}

export interface ResidentBaselineAuthorization { nursingHomeId: string; residentIds: string[]; capabilities: string[]; canViewSource?: boolean }
export interface ResidentBaselineSummary { residentId: string; baselines: Array<{ baselineId: string; baselineType: ResidentBaselineType; displayValue: string; sourceLabel: string; effectiveFrom: string; reviewDate: string; reviewState: "current" | "due_soon" | "due_today" | "overdue"; route?: string }> }

export type ResidentBaselineEventName = "ResidentBaselineCreated" | "ResidentBaselineSubmittedForApproval" | "ResidentBaselineApproved" | "ResidentBaselineRejected" | "ResidentBaselineReviewed" | "ResidentBaselineChanged" | "ResidentBaselineSuperseded" | "ResidentBaselineExpired" | "ResidentBaselineRevoked" | "ResidentBaselineEnteredInError";
export interface ResidentBaselineEvent { eventId: string; eventName: ResidentBaselineEventName; baselineId: string; residentId: string; nursingHomeId: string; baselineType: ResidentBaselineType; safeSummary: string; effectiveFrom: string; reviewDate: string; sourceReference?: string; actorId: string; correlationId: string; occurredAt: string }
