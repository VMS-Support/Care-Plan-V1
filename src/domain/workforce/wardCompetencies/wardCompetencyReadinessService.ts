import type { CompetencyDefinition, StaffCompetencyValidation, Ward, WardCompetencyRequirement } from "@/lib/care/types";
import { getCompetencyStatus } from "../competency/competencyService";

export function evaluateStaffWardCompetencyReadiness(input: { staffMemberId: string; wardId: string; requirements: WardCompetencyRequirement[]; validations: StaffCompetencyValidation[] }) {
  const requirements = input.requirements.filter((requirement) => String(requirement.wardId) === input.wardId && requirement.active);
  const results = requirements.map((requirement) => {
    const validation = input.validations.find((item) => String(item.staffMemberId) === input.staffMemberId && item.competencyDefinitionId === requirement.competencyDefinitionId && (!item.wardId || String(item.wardId) === input.wardId));
    const status = getCompetencyStatus(validation);
    return { requirement, validation, status, ready: status === "competent" || (requirement.supervisionAccepted && status === "competent_with_supervision") };
  });
  return { ready: results.every((item) => item.ready || item.requirement.requirementLevel === "recommended"), results };
}

export function getWardCompetencyMatrix(input: { wards: Ward[]; definitions: CompetencyDefinition[]; requirements: WardCompetencyRequirement[] }) {
  return input.wards.map((ward) => ({
    wardId: String(ward.id),
    wardName: ward.name,
    requirements: input.requirements.filter((requirement) => requirement.wardId === ward.id).map((requirement) => ({
      requirementId: requirement.id,
      competencyDefinitionId: requirement.competencyDefinitionId,
      competencyTitle: input.definitions.find((definition) => definition.id === requirement.competencyDefinitionId)?.title || "Competency",
      level: requirement.requirementLevel,
      applicableRoleKeys: requirement.applicableRoleKeys || [],
      minimumCompetentStaffPerShift: requirement.minimumCompetentStaffPerShift,
    })),
  }));
}

export function getWardRosterCompetencyCandidates(input: { wardId: string; staffMemberIds: string[]; requirements: WardCompetencyRequirement[]; validations: StaffCompetencyValidation[] }) {
  return input.staffMemberIds.filter((staffMemberId) => evaluateStaffWardCompetencyReadiness({ staffMemberId, wardId: input.wardId, requirements: input.requirements, validations: input.validations }).ready);
}
