import type { WorkExceptionType, WorkItem, WorkType } from "./workTypes";

export const WORK_EXCEPTION_REASON_LABELS = {
  resident_refused: "Resident refused",
  resident_declined: "Resident declined",
  resident_asleep: "Resident asleep",
  resident_unwell: "Resident unwell",
  resident_absent: "Resident unavailable",
  resident_in_hospital: "Resident in hospital",
  resident_at_appointment: "Resident at appointment",
  resident_requested_later: "Resident requested later",
  resident_choice: "Resident choice",
  resident_distressed: "Resident distressed",
  clinically_not_appropriate: "Clinically not appropriate",
  clinical_condition_changed: "Clinical condition changed",
  replaced_by_alternative_action: "Replaced by an alternative action",
  no_longer_required: "No longer required",
  reviewed_not_required: "Reviewed and not required",
  end_of_life_context: "End-of-life context",
  contraindicated: "Contraindicated",
  awaiting_clinical_review: "Awaiting clinical review",
  staff_unavailable: "Staff unavailable",
  emergency_priority: "Emergency work took priority",
  equipment_unavailable: "Equipment unavailable",
  medication_unavailable: "Medication unavailable",
  transport_unavailable: "Transport unavailable",
  service_unavailable: "Service unavailable",
  incorrect_assignment: "Incorrect assignment",
  duplicate_work_item: "Duplicate work item",
  source_cancelled: "Source requirement cancelled",
  schedule_changed: "Schedule changed",
  entered_in_error: "Entered in error",
  appointment_cancelled: "Appointment cancelled",
  referral_declined: "Referral declined",
  resident_discharged: "Resident discharged",
  resident_deceased: "Resident deceased",
  resident_transferred: "Resident transferred",
  document_not_required: "Document not required",
  other: "Other",
} as const;

export type WorkExceptionReasonCode = keyof typeof WORK_EXCEPTION_REASON_LABELS;

const allowed = (...codes: WorkExceptionReasonCode[]) => new Set(codes);
export const WORK_EXCEPTION_REASON_CATALOGUE: Record<
  WorkExceptionType,
  ReadonlySet<WorkExceptionReasonCode>
> = {
  deferred: allowed(
    "resident_asleep",
    "resident_unwell",
    "resident_at_appointment",
    "resident_requested_later",
    "resident_distressed",
    "awaiting_clinical_review",
    "staff_unavailable",
    "emergency_priority",
    "equipment_unavailable",
    "medication_unavailable",
    "transport_unavailable",
    "service_unavailable",
    "schedule_changed",
    "other",
  ),
  missed: allowed(
    "resident_refused",
    "resident_declined",
    "resident_asleep",
    "resident_unwell",
    "resident_absent",
    "resident_in_hospital",
    "resident_at_appointment",
    "resident_choice",
    "resident_distressed",
    "clinically_not_appropriate",
    "staff_unavailable",
    "emergency_priority",
    "equipment_unavailable",
    "medication_unavailable",
    "transport_unavailable",
    "service_unavailable",
    "other",
  ),
  declined: allowed(
    "resident_refused",
    "resident_declined",
    "resident_choice",
    "referral_declined",
    "service_unavailable",
    "other",
  ),
  not_applicable: allowed(
    "clinically_not_appropriate",
    "clinical_condition_changed",
    "replaced_by_alternative_action",
    "no_longer_required",
    "reviewed_not_required",
    "end_of_life_context",
    "contraindicated",
    "resident_in_hospital",
    "duplicate_work_item",
    "source_cancelled",
    "resident_discharged",
    "resident_deceased",
    "resident_transferred",
    "document_not_required",
    "other",
  ),
  cancelled: allowed(
    "no_longer_required",
    "duplicate_work_item",
    "source_cancelled",
    "schedule_changed",
    "entered_in_error",
    "appointment_cancelled",
    "referral_declined",
    "resident_discharged",
    "resident_deceased",
    "resident_transferred",
    "document_not_required",
    "other",
  ),
};

const disallowedByWorkType: Partial<Record<WorkType, ReadonlySet<WorkExceptionReasonCode>>> = {
  care_action: allowed("appointment_cancelled", "referral_declined", "document_not_required"),
  assessment: allowed("appointment_cancelled", "referral_declined", "medication_unavailable"),
  appointment: allowed("document_not_required", "medication_unavailable"),
  referral: allowed("appointment_cancelled", "document_not_required"),
  documentation: allowed("appointment_cancelled", "referral_declined", "medication_unavailable"),
};

export function validateWorkExceptionReason(
  item: WorkItem,
  exceptionType: WorkExceptionType,
  reasonCode: string,
  reasonText?: string,
) {
  const trimmedCode = reasonCode.trim() as WorkExceptionReasonCode;
  if (!trimmedCode) return "reason_required";
  if (!(trimmedCode in WORK_EXCEPTION_REASON_LABELS)) return "invalid_reason_code";
  if (!WORK_EXCEPTION_REASON_CATALOGUE[exceptionType].has(trimmedCode))
    return "reason_not_allowed_for_exception";
  if (disallowedByWorkType[item.workType]?.has(trimmedCode))
    return "reason_not_allowed_for_work_type";
  if (trimmedCode === "other" && !reasonText?.trim()) return "other_reason_text_required";
  return undefined;
}

export const getWorkExceptionReasonLabel = (reasonCode: string) =>
  WORK_EXCEPTION_REASON_LABELS[reasonCode as WorkExceptionReasonCode] || "Recorded reason";
