export type ClinicalEscalationStatus = "draft" | "in_progress" | "completed" | "cancelled";
export type ClinicalEscalationContactMethod = "phone" | "secure_message" | "in_person" | "video_call" | "email" | "other";
export type ClinicalEscalationContactTarget = "gp" | "doctor" | "cnm" | "don" | "family_representative" | "emergency_services" | "external_clinician" | "other";
export type ClinicalTransferDecision = "not_considered" | "considered_not_required" | "recommended" | "arranged" | "declined" | "emergency_transfer";

export interface ClinicalEscalationRecord {
  id: string;
  deteriorationIssueId: string;
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  status: ClinicalEscalationStatus;
  reasonForContact: string;
  initiatedAt: string;
  initiatedByUserAccountId: string;
  initiatedByStaffMemberId?: string;
  adviceReceived?: string;
  decisionMade?: string;
  transferDecision: ClinicalTransferDecision;
  followUpRequired: boolean;
  followUpDueAt?: string;
  responsibleRoleOrTeam?: string;
  responsiblePersonId?: string;
  outcomeSummary?: string;
  completedAt?: string;
  completedByUserAccountId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalEscalationContactAttempt {
  id: string;
  escalationRecordId: string;
  attemptedAt: string;
  targetType: ClinicalEscalationContactTarget;
  targetDisplayName?: string;
  method: ClinicalEscalationContactMethod;
  outcome: "answered" | "message_left" | "no_answer" | "awaiting_response" | "declined" | "not_required";
  recordedByUserAccountId: string;
  recordedByStaffMemberId?: string;
  safeSummary?: string;
}

export interface ClinicalEscalationEvent {
  id: string;
  type:
    | "ClinicalEscalationStarted"
    | "ClinicalEscalationContactAttempted"
    | "ClinicalEscalationAdviceRecorded"
    | "ClinicalEscalationDecisionRecorded"
    | "ClinicalTransferDecisionRecorded"
    | "ClinicalEscalationCompleted";
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  issueId: string;
  escalationRecordId: string;
  occurredAt: string;
  actorUserAccountId?: string;
  correlationId: string;
  payload: Record<string, unknown>;
}

export interface ClinicalEscalationRepository {
  escalationRecords: ClinicalEscalationRecord[];
  escalationContactAttempts: ClinicalEscalationContactAttempt[];
  escalationEvents: ClinicalEscalationEvent[];
}

export interface ClinicalEscalationActionContext {
  userAccountId: string;
  staffMemberId?: string;
  capabilities: string[];
  occurredAt: string;
  correlationId: string;
}
