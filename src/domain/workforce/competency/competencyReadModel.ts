import type { CompetencyDefinition, CompetencyRequirement, StaffCompetencyValidation, StaffMember } from "@/lib/care/types";
import { getCompetencyStatus } from "./competencyService";

export function latestCompetencyValidation(validations: StaffCompetencyValidation[], staffMemberId: string, competencyDefinitionId: string) {
  return validations
    .filter((validation) => String(validation.staffMemberId) === staffMemberId && validation.competencyDefinitionId === competencyDefinitionId && !["entered_in_error", "superseded", "revoked"].includes(validation.status))
    .sort((a, b) => String(b.validationDate || b.createdAt).localeCompare(String(a.validationDate || a.createdAt)))[0];
}

export function getStaffCompetencyProfile(input: { staffMemberId: string; definitions: CompetencyDefinition[]; requirements: CompetencyRequirement[]; validations: StaffCompetencyValidation[] }) {
  return input.definitions.filter((definition) => definition.status === "active").map((definition) => {
    const validation = latestCompetencyValidation(input.validations, input.staffMemberId, definition.id);
    return {
      competencyDefinitionId: definition.id,
      title: definition.title,
      category: definition.category,
      status: validation ? getCompetencyStatus(validation) : "not_required",
      validationDate: validation?.validationDate,
      expiryDate: validation?.expiryDate,
      scope: validation?.wardId ? "Ward" : validation?.nursingHomeId ? "Home" : validation ? "Individual" : undefined,
      supervisionRequired: Boolean(validation?.supervisionRequired),
      restrictionsPresent: Boolean(validation?.restrictionsPresent),
      validationId: validation?.id,
    };
  });
}

export function getCompetencyMatrixViewModel(input: { staffMembers: StaffMember[]; definitions: CompetencyDefinition[]; validations: StaffCompetencyValidation[] }) {
  return {
    competencies: input.definitions.filter((definition) => definition.status === "active").map((definition) => ({ competencyDefinitionId: definition.id, code: definition.code, title: definition.title })),
    rows: input.staffMembers.map((staff) => ({
      staffMemberId: staff.id,
      staffDisplayName: staff.displayName,
      cells: input.definitions.filter((definition) => definition.status === "active").map((definition) => {
        const validation = latestCompetencyValidation(input.validations, String(staff.id), definition.id);
        return {
          competencyDefinitionId: definition.id,
          status: getCompetencyStatus(validation),
          validationDate: validation?.validationDate,
          expiryDate: validation?.expiryDate,
          supervisionRequired: Boolean(validation?.supervisionRequired),
          validationId: validation?.id,
          route: `/workforce/staff/${staff.id}`,
        };
      }),
    })),
    generatedAt: new Date().toISOString(),
  };
}

export function getCompetencyMetrics(input: { definitions: CompetencyDefinition[]; validations: StaffCompetencyValidation[] }) {
  const current = input.validations.filter((validation) => !["entered_in_error", "superseded", "revoked"].includes(validation.status));
  const dueSoon = current.filter((validation) => getCompetencyStatus(validation) === "due_soon");
  const expired = current.filter((validation) => getCompetencyStatus(validation) === "expired");
  const supervision = current.filter((validation) => getCompetencyStatus(validation) === "competent_with_supervision");
  return { dueSoon, expired, supervision, generatedAt: new Date().toISOString() };
}
