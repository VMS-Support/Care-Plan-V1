import type {
  CompetencyDefinition,
  CompetencyRequirement,
  StaffCompetencyComplianceStatus,
  StaffCompetencyValidation,
  StaffTrainingCompletion,
} from "@/lib/care/types";
import type { StaffMemberId, UserAccountId } from "@/types/entityIds";

export interface CreateCompetencyRequirementCommand {
  competencyDefinitionId: string;
  targetType: CompetencyRequirement["targetType"];
  roleKeys?: string[];
  nursingHomeId?: string;
  wardId?: string;
  staffMemberId?: string;
  mandatory?: boolean;
  clientRequestId: string;
}

export interface RecordCompetencyValidationCommand {
  staffMemberId: string;
  employmentRecordId?: string;
  competencyDefinitionId: string;
  competencyRequirementId?: string;
  nursingHomeId?: string;
  wardId?: string;
  roleKey?: string;
  validationDate?: string;
  expiryDate?: string;
  reviewDate?: string;
  validatedByStaffMemberId?: string;
  evidenceDocumentId?: string;
  evidenceFileId?: string;
  supervisionRequired?: boolean;
  restrictionsPresent?: boolean;
  restrictionsSummary?: string;
  assessmentSummary?: string;
  notes?: string;
  clientRequestId: string;
}

export function getCompetencyStatus(validation?: StaffCompetencyValidation, effectiveAt = new Date().toISOString().slice(0, 10)): StaffCompetencyComplianceStatus {
  if (!validation) return "missing_required";
  if (validation.status === "pending_validation" || validation.status === "draft") return "pending_validation";
  if (validation.status === "not_yet_competent") return "not_yet_competent";
  if (validation.status === "competent_with_supervision") return "competent_with_supervision";
  if (validation.status === "competent") {
    if (validation.expiryDate) {
      const days = Math.ceil((Date.parse(validation.expiryDate) - Date.parse(effectiveAt)) / 86400000);
      if (days < 0) return "expired";
      if (days <= 30) return "due_soon";
    }
    return "competent";
  }
  return "unable_to_determine";
}

export function createCompetencyRequirement(command: CreateCompetencyRequirementCommand, actorUserAccountId: string): CompetencyRequirement {
  const now = new Date().toISOString();
  return {
    id: `competency-requirement-${command.clientRequestId || Date.now()}`,
    competencyDefinitionId: command.competencyDefinitionId,
    targetType: command.targetType,
    roleKeys: command.roleKeys,
    nursingHomeId: command.nursingHomeId as any,
    wardId: command.wardId as any,
    staffMemberId: command.staffMemberId as any,
    mandatory: command.mandatory ?? true,
    active: true,
    effectiveFrom: now.slice(0, 10),
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as UserAccountId,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  };
}

export function prerequisiteTrainingIsCurrent(definition: CompetencyDefinition, completions: StaffTrainingCompletion[], staffMemberId: string) {
  if (!definition.requiresTrainingCourseIds?.length) return true;
  return definition.requiresTrainingCourseIds.every((courseId) => completions.some((completion) =>
    String(completion.staffMemberId) === staffMemberId &&
    completion.trainingCourseId === courseId &&
    completion.status === "verified" &&
    completion.verificationStatus === "verified" &&
    (!completion.expiryDate || completion.expiryDate >= new Date().toISOString().slice(0, 10)),
  ));
}

export function recordCompetencyValidation(input: { definitions: CompetencyDefinition[]; completions: StaffTrainingCompletion[] }, command: RecordCompetencyValidationCommand, actorUserAccountId: string) {
  const definition = input.definitions.find((item) => item.id === command.competencyDefinitionId);
  if (!definition) throw new Error("The Competency Validation could not be saved.");
  if (!prerequisiteTrainingIsCurrent(definition, input.completions, command.staffMemberId)) throw new Error("The required Training prerequisite is not current.");
  const now = new Date().toISOString();
  return {
    id: `staff-competency-validation-${command.clientRequestId || Date.now()}`,
    staffMemberId: command.staffMemberId as StaffMemberId,
    employmentRecordId: command.employmentRecordId as any,
    competencyDefinitionId: command.competencyDefinitionId,
    competencyRequirementId: command.competencyRequirementId,
    scopeType: command.wardId ? "ward" : command.nursingHomeId ? "nursing_home" : "individual",
    nursingHomeId: command.nursingHomeId as any,
    wardId: command.wardId as any,
    roleKey: command.roleKey,
    status: command.supervisionRequired ? "competent_with_supervision" : "competent",
    validationDate: command.validationDate || now.slice(0, 10),
    expiryDate: command.expiryDate,
    reviewDate: command.reviewDate,
    validatedByStaffMemberId: command.validatedByStaffMemberId as any,
    evidenceDocumentId: command.evidenceDocumentId,
    evidenceFileId: command.evidenceFileId,
    supervisionRequired: Boolean(command.supervisionRequired),
    restrictionsPresent: Boolean(command.restrictionsPresent),
    restrictionsSummary: command.restrictionsSummary,
    assessmentSummary: command.assessmentSummary,
    notes: command.notes,
    versionNumber: 1,
    versionChainId: `staff-competency-validation-chain-${command.clientRequestId || Date.now()}`,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as UserAccountId,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  } satisfies StaffCompetencyValidation;
}
