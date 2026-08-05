import type {
  MaintenanceContractor,
  MaintenanceContractorHomeAssociation,
  SafetyInspection,
  SafetyInspectionResponse,
} from "../../lib/care/types.ts";

export type SeparationOfDutiesSettings = {
  independentSafetyVerification: boolean;
  independentHighRiskVerification: boolean;
  differentReinspector: boolean;
  managementStatutoryVerification: boolean;
  sameUserLowRiskMaintenanceVerification: boolean;
  independentReturnToService: boolean;
};

export const DEFAULT_SEPARATION_OF_DUTIES: SeparationOfDutiesSettings = {
  independentSafetyVerification: true,
  independentHighRiskVerification: true,
  differentReinspector: true,
  managementStatutoryVerification: true,
  sameUserLowRiskMaintenanceVerification: true,
  independentReturnToService: true,
};

export function validateIndependentActor(params: {
  actor: string;
  originalActor?: string;
  required: boolean;
  actionLabel: string;
}) {
  if (params.required && params.originalActor && params.actor === params.originalActor)
    return { valid: false, reason: `${params.actionLabel} must be completed by a different authorised user.` };
  return { valid: true };
}

export function failedResponsesForReinspection(responses: SafetyInspectionResponse[]) {
  return responses.filter((item) => item.result === "FAIL");
}

export function buildReinspectionResponses(params: {
  inspectionId: string;
  failedResponses: SafetyInspectionResponse[];
}) {
  return params.failedResponses.map((item, index) => ({
    ...item,
    id: `${params.inspectionId}-response-${index + 1}`,
    inspectionId: params.inspectionId,
    responseValue: undefined,
    result: "UNANSWERED" as const,
    observation: undefined,
    notApplicableReason: undefined,
    readingOutOfRange: undefined,
    answeredBy: undefined,
    answeredAt: undefined,
  }));
}

export function reinspectionCanBeCreated(inspection: SafetyInspection) {
  return inspection.overallResult === "FAIL" || inspection.status === "FAILED" || inspection.verificationStatus === "REJECTED";
}

export function validateContractorAssignment(params: {
  contractor: MaintenanceContractor | undefined;
  association: MaintenanceContractorHomeAssociation | undefined;
  tenantId: string;
  homeId: string;
  requiredTrade?: string;
  recordedTrades?: string[];
  insuranceExpiryDates?: string[];
  requiredCertificationValid?: boolean;
  today?: string;
}) {
  const blockers: string[] = [];
  const { contractor, association } = params;
  const today = params.today || new Date().toISOString().slice(0, 10);
  if (!contractor || contractor.tenantId !== params.tenantId) blockers.push("Contractor was not found in this tenant.");
  if (contractor && (!contractor.active || contractor.status !== "ACTIVE")) blockers.push("Contractor is not active.");
  if (contractor?.approvalStatus !== "APPROVED") blockers.push("Contractor is not approved.");
  if (contractor && contractor.restrictionStatus !== "NONE") blockers.push(`Contractor is ${contractor.restrictionStatus.toLowerCase().replaceAll("_", " ")}.`);
  if (!association || association.homeId !== params.homeId || !association.active) blockers.push("Contractor is not approved for this Nursing Home.");
  if (association && ["RESTRICTED", "SUSPENDED", "INACTIVE", "ARCHIVED"].includes(association.associationStatus)) blockers.push(`Contractor association is ${association.associationStatus.toLowerCase()}.`);
  if (association?.accessLevel === "NO_ACCESS" || association?.accessLevel === "RESTRICTED") blockers.push("Contractor does not have valid access to this Nursing Home.");
  if (params.requiredTrade && !params.recordedTrades?.some((item) => item.toLowerCase() === params.requiredTrade!.toLowerCase())) blockers.push(`Required ${params.requiredTrade} trade or service is not recorded.`);
  if (params.insuranceExpiryDates?.length && params.insuranceExpiryDates.some((date) => date < today)) blockers.push("Required contractor insurance has expired.");
  if (params.requiredCertificationValid === false) blockers.push("Required contractor certification is not valid.");
  return { valid: blockers.length === 0, blockers };
}

export function maintenanceMarkAllEligibility(params: {
  category: string;
  evidenceRequirements: string[];
  checklist: Array<{ id: string; mandatory: boolean }>;
  failedItemIds?: string[];
  highRisk?: boolean;
  individualConfirmationRequired?: boolean;
}) {
  const prohibited = ["FIRE_SAFETY", "WATER_SAFETY", "ELECTRICAL", "LIFTING_EQUIPMENT", "MEDICAL_GAS"];
  const templateBlocked = Boolean(params.highRisk || params.individualConfirmationRequired || prohibited.includes(params.category));
  const evidenceBlocked = params.evidenceRequirements.some((item) => ["Reading", "Photo", "Document", "Certificate", "Signature", "Video"].includes(item));
  const failed = new Set(params.failedItemIds || []);
  const eligibleIds = templateBlocked || evidenceBlocked ? [] : params.checklist.filter((item) => !failed.has(item.id)).map((item) => item.id);
  return {
    allowed: !templateBlocked && eligibleIds.length > 0,
    eligibleIds,
    excludedCount: params.checklist.length - eligibleIds.length,
    reason: templateBlocked ? "This high-risk or statutory template requires individual confirmation." : undefined,
  };
}
