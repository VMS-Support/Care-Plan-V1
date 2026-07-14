import type {
  EmploymentRecord,
  Facility,
  HomeAssignment,
  PermissionGrant,
  ProfessionalRegistration,
  Role,
  RoleAssignment,
  RoleTemplate,
  RosterAssignment,
  StaffMember,
  UserAccount,
  UserProfile,
  Ward,
  WardCompetency,
} from "./types";
import type { Permission } from "./permissions";
import {
  asEmploymentRecordId,
  asHomeAssignmentId,
  asNursingHomeId,
  asPermissionGrantId,
  asProfessionalRegistrationId,
  asRoleAssignmentId,
  asRoleTemplateId,
  asRosterAssignmentId,
  asStaffMemberId,
  asUserAccountId,
  asWardCompetencyId,
  type NursingHomeId,
  type StaffMemberId,
  type UserAccountId,
  type WardId,
} from "@/types/entityIds";

const MIGRATION_TIMESTAMP = "2026-07-13T00:00:00.000Z";
const DEFAULT_HOME_ID = "facility-ballymore-haven";

export type CurrentRoleKey = "DON" | "CNM" | "NURSE" | "HCA" | "DOCTOR";

export interface StaffAccessState {
  users: UserProfile[];
  facilities: Facility[];
  wards: Ward[];
  userAccounts: UserAccount[];
  staffMembers: StaffMember[];
  employmentRecords: EmploymentRecord[];
  roleAssignments: RoleAssignment[];
  professionalRegistrations: ProfessionalRegistration[];
  homeAssignments: HomeAssignment[];
  wardCompetencies: WardCompetency[];
  rosterAssignments: RosterAssignment[];
  permissionGrants: PermissionGrant[];
  roleTemplates: RoleTemplate[];
}

export interface AuthorizationContext {
  userAccountId: UserAccountId | string;
  staffMemberId?: StaffMemberId | string;
  activeNursingHomeId?: NursingHomeId | string;
  activeWardId?: WardId | string;
}

export interface ResourceContext {
  nursingHomeId?: NursingHomeId | string;
  wardId?: WardId | string;
  residentId?: string;
  sensitive?: boolean;
}

export interface AuthorizationDecision {
  allowed: boolean;
  capability: string;
  resourceScope: ResourceContext;
  matchedGrants: PermissionGrant[];
  matchedRoleTemplates: RoleTemplate[];
  deniedReason?: string;
  finalDecision: "allow" | "deny";
}

export const roleToRoleKey = (role: Role): CurrentRoleKey => {
  if (role === "don") return "DON";
  if (role === "cnm") return "CNM";
  if (role === "nurse") return "NURSE";
  if (role === "doctor") return "DOCTOR";
  return "HCA";
};

export const roleKeyToRole = (roleKey: string): Role => {
  if (roleKey === "DON") return "don";
  if (roleKey === "CNM") return "cnm";
  if (roleKey === "NURSE") return "nurse";
  if (roleKey === "DOCTOR") return "doctor";
  return "carer";
};

export const currentRoleTemplateCapabilities: Record<CurrentRoleKey, Permission[]> = {
  HCA: [
    "resident.view", "note.create", "intervention.create", "handover.create",
    "visitor.create", "outing.create", "task.create", "assessment.view", "careplan.view",
    "vital.view", "vital.record", "observation.view", "observation.record",
    "rlt_dependency.view",
    "ops.edit_own", "ops.duplicate",
  ],
  NURSE: [
    "resident.view", "resident.edit", "note.create", "intervention.create", "handover.create",
    "visitor.create", "outing.create", "task.create", "assessment.view", "assessment.create",
    "assessment.edit", "assessment.review", "assessment.create_revision", "assessment.comment",
    "assessment.archive", "careplan.view", "careplan.create", "careplan.edit",
    "careplan.review", "careplan.evaluate", "evaluation.create", "incident.view", "incident.create",
    "assessment_care_guidance.view", "assessment_care_guidance.acknowledge", "assessment_care_guidance.action",
    "rlt_dependency.view", "rlt_dependency.record", "rlt_dependency.review", "rlt_dependency.view_history",
    "vital.view", "vital.record", "vital.edit", "vital.comment", "vital.plan.edit", "vital.escalate",
    "observation.view", "observation.record", "observation.edit", "observation.plan.edit",
    "observation.escalate", "ops.edit", "ops.archive", "ops.restore", "ops.duplicate",
  ],
  DOCTOR: [
    "resident.view", "clinical.view", "mdt.create", "medical_review.create", "recommendation.create",
    "treatment_note.create", "assessment.view", "assessment.comment", "careplan.view",
    "vital.view", "vital.comment", "vital.escalate", "observation.view", "observation.escalate",
    "assessment_care_guidance.view", "rlt_dependency.view", "rlt_dependency.view_history",
    "ops.edit_own",
  ],
  CNM: [
    "resident.view", "resident.create", "resident.edit", "note.create", "intervention.create",
    "handover.create", "visitor.create", "outing.create", "task.create", "assessment.view",
    "assessment.create", "assessment.edit", "assessment.review", "assessment.approve",
    "assessment.archive", "assessment.assign", "assessment.create_revision", "assessment.comment",
    "assessment.delete", "assessment.restore", "assessment.audit_access", "assessment.reports",
    "careplan.view", "careplan.create", "careplan.edit", "careplan.review", "careplan.approve",
    "careplan.evaluate", "careplan.revise", "evaluation.create", "incident.view", "incident.create",
    "incident.manage", "report.view", "user.manage", "clinical.view", "mdt.create", "compliance.view",
    "assessment_care_guidance.view", "assessment_care_guidance.acknowledge", "assessment_care_guidance.action", "assessment_care_guidance.dismiss", "assessment_care_guidance.view_history",
    "rlt_dependency.view", "rlt_dependency.record", "rlt_dependency.review", "rlt_dependency.correct", "rlt_dependency.view_history",
    "vital.view", "vital.record", "vital.edit", "vital.delete", "vital.comment", "vital.plan.edit",
    "vital.escalate", "vital.report", "vital.audit", "observation.view", "observation.record",
    "observation.edit", "observation.delete", "observation.plan.edit", "observation.escalate",
    "observation.audit", "ops.edit", "ops.archive", "ops.restore", "ops.delete", "ops.duplicate",
  ],
  DON: [
    "resident.view", "resident.create", "resident.edit", "resident.discharge", "note.create",
    "intervention.create", "handover.create", "visitor.create", "outing.create", "task.create",
    "assessment.view", "assessment.create", "assessment.edit", "assessment.review", "assessment.approve",
    "assessment.delete", "assessment.archive", "assessment.assign", "assessment.create_revision",
    "assessment.comment", "assessment.restore", "assessment.audit_access", "assessment.reports",
    "careplan.view", "careplan.create", "careplan.edit", "careplan.review", "careplan.approve",
    "careplan.delete", "careplan.evaluate", "careplan.revise", "evaluation.create", "incident.view",
    "incident.create", "incident.manage", "clinical.view", "mdt.create", "medical_review.create",
    "recommendation.create", "treatment_note.create", "report.view", "report.manage", "user.manage",
    "permission.manage", "settings.manage", "audit.view", "record.delete_with_audit", "compliance.view",
    "assessment_care_guidance.view", "assessment_care_guidance.acknowledge", "assessment_care_guidance.action", "assessment_care_guidance.dismiss", "assessment_care_guidance.view_history",
    "rlt_dependency.view", "rlt_dependency.record", "rlt_dependency.review", "rlt_dependency.correct", "rlt_dependency.view_history",
    "vital.view", "vital.record", "vital.edit", "vital.delete", "vital.comment", "vital.plan.edit",
    "vital.escalate", "vital.report", "vital.audit", "observation.view", "observation.record",
    "observation.edit", "observation.delete", "observation.plan.edit", "observation.escalate",
    "observation.audit", "ops.edit", "ops.archive", "ops.restore", "ops.delete", "ops.duplicate",
  ],
};

export const FUTURE_ROLE_KEYS = [
  "ALLIED_HEALTH",
  "MAINTENANCE",
  "HOUSEKEEPING",
  "HR",
  "TRAINING_MANAGER",
  "ADMIN",
  "FINANCE",
  "OWNER",
  "GROUP_EXECUTIVE",
  "FAMILY",
  "PHARMACY",
];

const userAccountId = (userId: string) => asUserAccountId(userId);
const staffMemberId = (userId: string) => asStaffMemberId(`staff-${userId}`);
const employmentRecordId = (userId: string, homeId: string) => asEmploymentRecordId(`employment-${userId}-${homeId}`);
const roleAssignmentId = (userId: string, homeId: string) => asRoleAssignmentId(`role-assignment-${userId}-${homeId}`);
const homeAssignmentId = (userId: string, homeId: string) => asHomeAssignmentId(`home-assignment-${userId}-${homeId}`);
const wardCompetencyId = (userId: string, homeId: string, wardId: string) => asWardCompetencyId(`ward-competency-${userId}-${homeId}-${wardId}`);

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) || "" };
};

export function createCurrentRoleTemplates(): RoleTemplate[] {
  const names: Record<CurrentRoleKey, string> = {
    DON: "Director of Nursing",
    CNM: "Clinical Nurse Manager",
    NURSE: "Nurse",
    HCA: "Carer / HCA",
    DOCTOR: "Doctor",
  };
  return (Object.keys(currentRoleTemplateCapabilities) as CurrentRoleKey[]).map((key) => ({
    id: asRoleTemplateId(`role-template-${key.toLowerCase()}`),
    key,
    name: names[key],
    description: `Current ${names[key]} capability template migrated from legacy role permissions.`,
    capabilities: currentRoleTemplateCapabilities[key],
    active: true,
    version: 1,
    createdAt: MIGRATION_TIMESTAMP,
    updatedAt: MIGRATION_TIMESTAMP,
  }));
}

const userFacilityIds = (user: UserProfile) =>
  user.facilityIds?.length ? user.facilityIds : [user.facilityId || DEFAULT_HOME_ID];

export function migrateStaffAccess<T extends StaffAccessState>(source: T): T {
  const currentTemplates = createCurrentRoleTemplates();
  const roleTemplates = source.roleTemplates?.length
    ? source.roleTemplates.map((template) => {
        const current = currentTemplates.find((candidate) => candidate.key === template.key);
        return current
          ? {
              ...template,
              capabilities: [...new Set([...template.capabilities, ...current.capabilities])],
              updatedAt: MIGRATION_TIMESTAMP,
            }
          : template;
      })
    : currentTemplates;
  const staffMembersById = new Map((source.staffMembers || []).map((item) => [item.id, item]));
  const userAccountsById = new Map((source.userAccounts || []).map((item) => [item.id, item]));
  const employmentRecords = [...(source.employmentRecords || [])];
  const roleAssignments = [...(source.roleAssignments || [])];
  const homeAssignments = [...(source.homeAssignments || [])];
  const wardCompetencies = [...(source.wardCompetencies || [])];
  const professionalRegistrations = [...(source.professionalRegistrations || [])];

  for (const user of source.users) {
    const staffId = staffMemberId(user.id);
    const accountId = userAccountId(user.id);
    const { firstName, lastName } = splitName(user.name);

    if (!staffMembersById.has(staffId)) {
      staffMembersById.set(staffId, {
        id: staffId,
        firstName,
        lastName,
        displayName: user.name,
        phone: user.phone,
        email: user.email,
        active: user.status === "active",
        staffNumber: user.employeeNumber,
        createdAt: user.startDate ? `${user.startDate}T00:00:00.000Z` : MIGRATION_TIMESTAMP,
        updatedAt: MIGRATION_TIMESTAMP,
      });
    }

    if (!userAccountsById.has(accountId)) {
      userAccountsById.set(accountId, {
        id: accountId,
        email: user.email,
        username: user.email,
        authenticationProvider: "local-demo",
        staffMemberId: staffId,
        accountStatus:
          user.status === "active"
            ? "active"
            : user.status === "suspended"
              ? "suspended"
              : "disabled",
        lastLoginAt: user.lastLogin,
        defaultNursingHomeId: asNursingHomeId(user.facilityId || userFacilityIds(user)[0] || DEFAULT_HOME_ID),
        createdAt: user.startDate ? `${user.startDate}T00:00:00.000Z` : MIGRATION_TIMESTAMP,
        updatedAt: MIGRATION_TIMESTAMP,
      });
    }

    for (const homeId of userFacilityIds(user)) {
      const nursingHomeId = asNursingHomeId(homeId);
      if (!employmentRecords.some((record) => record.id === employmentRecordId(user.id, homeId))) {
        employmentRecords.push({
          id: employmentRecordId(user.id, homeId),
          staffMemberId: staffId,
          nursingHomeId,
          enterpriseId: source.facilities.find((facility) => facility.id === homeId)?.enterpriseId,
          employmentType: user.email.includes("agency") ? "agency" : "permanent",
          employmentStatus: user.status === "active" ? "active" : user.status === "suspended" ? "suspended" : "ended",
          jobTitle: user.department ? `${user.department} ${roleToRoleKey(user.role)}` : roleToRoleKey(user.role),
          department: user.department,
          startDate: user.startDate,
          createdAt: user.startDate ? `${user.startDate}T00:00:00.000Z` : MIGRATION_TIMESTAMP,
          updatedAt: MIGRATION_TIMESTAMP,
        });
      }
      if (!homeAssignments.some((assignment) => assignment.id === homeAssignmentId(user.id, homeId))) {
        homeAssignments.push({
          id: homeAssignmentId(user.id, homeId),
          staffMemberId: staffId,
          nursingHomeId,
          status: user.status === "active" ? "active" : "inactive",
          validFrom: user.startDate,
          assignmentType: user.facilityId === homeId || !user.facilityId ? "primary" : "secondary",
          createdAt: MIGRATION_TIMESTAMP,
          updatedAt: MIGRATION_TIMESTAMP,
        });
      }
      if (!roleAssignments.some((assignment) => assignment.id === roleAssignmentId(user.id, homeId))) {
        roleAssignments.push({
          id: roleAssignmentId(user.id, homeId),
          staffMemberId: staffId,
          userAccountId: accountId,
          roleKey: roleToRoleKey(user.role),
          nursingHomeId,
          effectiveFrom: user.startDate,
          status: user.status === "active" ? "active" : "inactive",
          isPrimary: user.facilityId === homeId || !user.facilityId,
          createdAt: MIGRATION_TIMESTAMP,
          updatedAt: MIGRATION_TIMESTAMP,
        });
      }
      const wardsForHome = source.wards.filter((ward) => ward.nursingHomeId === homeId);
      const approvedWardIds =
        user.assignedWings.length === 0
          ? wardsForHome.map((ward) => ward.id)
          : wardsForHome
              .filter((ward) => !ward.legacyWingId || user.assignedWings.includes(ward.legacyWingId))
              .map((ward) => ward.id);
      for (const wardId of approvedWardIds) {
        if (!wardCompetencies.some((competency) => competency.id === wardCompetencyId(user.id, homeId, wardId))) {
          wardCompetencies.push({
            id: wardCompetencyId(user.id, homeId, wardId),
            staffMemberId: staffId,
            nursingHomeId,
            wardId,
            status: "approved",
            effectiveFrom: user.startDate,
            competencyAreas: [roleToRoleKey(user.role).toLowerCase()],
            createdAt: MIGRATION_TIMESTAMP,
            updatedAt: MIGRATION_TIMESTAMP,
          });
        }
      }
    }

    if ((user.role === "nurse" || user.role === "doctor") && !professionalRegistrations.some((registration) => registration.staffMemberId === staffId)) {
      professionalRegistrations.push({
        id: asProfessionalRegistrationId(`professional-registration-${user.id}`),
        staffMemberId: staffId,
        profession: user.role === "doctor" ? "doctor" : "nurse",
        registrationBody: user.role === "doctor" ? "Medical Council" : "Nursing and Midwifery Board",
        registrationStatus: "unknown",
        notes: "Registration number not present in legacy demo data.",
        createdAt: MIGRATION_TIMESTAMP,
        updatedAt: MIGRATION_TIMESTAMP,
      });
    }
  }

  return {
    ...source,
    userAccounts: Array.from(userAccountsById.values()),
    staffMembers: Array.from(staffMembersById.values()),
    employmentRecords,
    roleAssignments,
    professionalRegistrations,
    homeAssignments,
    wardCompetencies,
    rosterAssignments: source.rosterAssignments || [],
    permissionGrants: source.permissionGrants || [],
    roleTemplates,
  };
}

const isEffective = (from: string, to?: string, at = new Date()) => {
  const now = at.getTime();
  return Date.parse(from) <= now && (!to || Date.parse(to) >= now);
};

export function getStaffMemberById(state: StaffAccessState, id: StaffMemberId | string) {
  return state.staffMembers.find((staff) => staff.id === id);
}

export function getUserAccountById(state: StaffAccessState, id: UserAccountId | string) {
  return state.userAccounts.find((account) => account.id === id);
}

export function getCurrentStaffMember(state: StaffAccessState, user: UserProfile) {
  return getStaffMemberById(state, staffMemberId(user.id));
}

export function getStaffEmploymentRecords(state: StaffAccessState, staffMemberId: StaffMemberId | string) {
  return state.employmentRecords.filter((record) => record.staffMemberId === staffMemberId);
}

export function getCurrentEmployment(state: StaffAccessState, staffMemberId: StaffMemberId | string, nursingHomeId?: string) {
  return getStaffEmploymentRecords(state, staffMemberId).find(
    (record) =>
      record.employmentStatus === "active" &&
      (!nursingHomeId || record.nursingHomeId === nursingHomeId) &&
      isEffective(record.startDate, record.endDate),
  );
}

export function getStaffRoleAssignments(state: StaffAccessState, staffMemberId: StaffMemberId | string) {
  return state.roleAssignments.filter((assignment) => assignment.staffMemberId === staffMemberId);
}

export function getStaffHomeAssignments(state: StaffAccessState, staffMemberId: StaffMemberId | string) {
  return state.homeAssignments.filter((assignment) => assignment.staffMemberId === staffMemberId);
}

export function getStaffWardCompetencies(state: StaffAccessState, staffMemberId: StaffMemberId | string) {
  return state.wardCompetencies.filter((competency) => competency.staffMemberId === staffMemberId);
}

export function getStaffProfessionalRegistrations(state: StaffAccessState, staffMemberId: StaffMemberId | string) {
  return state.professionalRegistrations.filter((registration) => registration.staffMemberId === staffMemberId);
}

export function getStaffRosterAssignments(state: StaffAccessState, staffMemberId: StaffMemberId | string) {
  return state.rosterAssignments.filter((assignment) => assignment.staffMemberId === staffMemberId);
}

export function getStaffAccessibleHomes(state: StaffAccessState, staffMemberId: StaffMemberId | string) {
  return state.homeAssignments
    .filter((assignment) => assignment.staffMemberId === staffMemberId && assignment.status === "active" && isEffective(assignment.validFrom, assignment.validTo))
    .map((assignment) => assignment.nursingHomeId);
}

export function getStaffAccessibleWards(state: StaffAccessState, staffMemberId: StaffMemberId | string, nursingHomeId?: string) {
  return state.wardCompetencies
    .filter(
      (competency) =>
        competency.staffMemberId === staffMemberId &&
        competency.status === "approved" &&
        (!nursingHomeId || competency.nursingHomeId === nursingHomeId) &&
        isEffective(competency.effectiveFrom, competency.effectiveTo),
    )
    .map((competency) => competency.wardId);
}

export function getStaffOnDuty(state: StaffAccessState, nursingHomeId: string, wardId?: string) {
  const activeRoster = state.rosterAssignments.filter(
    (assignment) =>
      assignment.nursingHomeId === nursingHomeId &&
      (!wardId || assignment.wardId === wardId) &&
      ["confirmed", "in_progress"].includes(assignment.status),
  );
  return { available: state.rosterAssignments.length > 0, rosterAssignments: activeRoster };
}

export function getStaffForWard(state: StaffAccessState, nursingHomeId: string, wardId: string) {
  const staffIds = new Set(
    state.wardCompetencies
      .filter((competency) => competency.nursingHomeId === nursingHomeId && competency.wardId === wardId && competency.status === "approved")
      .map((competency) => competency.staffMemberId),
  );
  return state.staffMembers.filter((staff) => staffIds.has(staff.id));
}

export function getRegistrationStatus(registration: ProfessionalRegistration, warningDays = 30): ProfessionalRegistration["registrationStatus"] {
  if (registration.registrationStatus === "not_required" || registration.registrationStatus === "suspended") return registration.registrationStatus;
  if (!registration.expiryDate) return registration.registrationStatus === "active" ? "active" : "unknown";
  const days = Math.ceil((Date.parse(registration.expiryDate) - Date.now()) / 86400000);
  if (days < 0) return "expired";
  if (days <= warningDays) return "expiring";
  return "active";
}

export function getRegistrationsExpiringWithin(state: StaffAccessState, days: number) {
  return state.professionalRegistrations.filter((registration) => getRegistrationStatus(registration, days) === "expiring");
}

export function getExpiredRegistrations(state: StaffAccessState) {
  return state.professionalRegistrations.filter((registration) => getRegistrationStatus(registration) === "expired");
}

export function getStaffWithoutRequiredRegistration(state: StaffAccessState) {
  const requiredStaffIds = new Set(
    state.roleAssignments
      .filter((assignment) => assignment.status === "active" && ["NURSE", "DOCTOR"].includes(assignment.roleKey))
      .map((assignment) => assignment.staffMemberId),
  );
  return state.staffMembers.filter(
    (staff) =>
      requiredStaffIds.has(staff.id) &&
      !state.professionalRegistrations.some((registration) => registration.staffMemberId === staff.id),
  );
}

const grantMatchesScope = (grant: PermissionGrant, resource: ResourceContext) => {
  if (grant.scopeType === "global_system") return true;
  if (grant.scopeType === "enterprise") return !resource.nursingHomeId || !grant.nursingHomeId;
  if (grant.scopeType === "nursing_home" || grant.scopeType === "multiple_homes") {
    return !resource.nursingHomeId || grant.nursingHomeId === resource.nursingHomeId;
  }
  if (grant.scopeType === "ward") {
    return (!resource.nursingHomeId || grant.nursingHomeId === resource.nursingHomeId) && (!resource.wardId || grant.wardId === resource.wardId);
  }
  return true;
};

export function explainAuthorizationDecision(
  state: StaffAccessState,
  context: AuthorizationContext,
  capability: Permission | string,
  resource: ResourceContext = {},
): AuthorizationDecision {
  const account = getUserAccountById(state, context.userAccountId);
  const staffId = context.staffMemberId || account?.staffMemberId;
  const resourceHome = resource.nursingHomeId || context.activeNursingHomeId;
  const resourceWard = resource.wardId || context.activeWardId;
  const scopedResource = { ...resource, nursingHomeId: resourceHome, wardId: resourceWard };
  if (!account || account.accountStatus !== "active") {
    return { allowed: false, capability, resourceScope: scopedResource, matchedGrants: [], matchedRoleTemplates: [], deniedReason: "Account is not active.", finalDecision: "deny" };
  }
  if (!staffId) {
    return { allowed: false, capability, resourceScope: scopedResource, matchedGrants: [], matchedRoleTemplates: [], deniedReason: "Account is not linked to a staff member.", finalDecision: "deny" };
  }

  const matchingGrants = state.permissionGrants.filter(
    (grant) =>
      grant.capability === capability &&
      isEffective(grant.effectiveFrom, grant.effectiveTo) &&
      grantMatchesScope(grant, scopedResource) &&
      (grant.userAccountId === account.id || grant.staffMemberId === staffId),
  );
  const deny = matchingGrants.find((grant) => grant.effect === "deny");
  if (deny) {
    return { allowed: false, capability, resourceScope: scopedResource, matchedGrants: [deny], matchedRoleTemplates: [], deniedReason: "Explicit deny matched.", finalDecision: "deny" };
  }
  const allow = matchingGrants.filter((grant) => grant.effect === "allow");

  const homeAllowed = !resourceHome || getStaffAccessibleHomes(state, staffId).includes(resourceHome as NursingHomeId);
  if (!homeAllowed) {
    return { allowed: false, capability, resourceScope: scopedResource, matchedGrants: allow, matchedRoleTemplates: [], deniedReason: "No active home assignment for requested nursing home.", finalDecision: "deny" };
  }

  const activeRoles = state.roleAssignments.filter(
    (assignment) =>
      assignment.staffMemberId === staffId &&
      assignment.status === "active" &&
      isEffective(assignment.effectiveFrom, assignment.effectiveTo) &&
      (!resourceHome || !assignment.nursingHomeId || assignment.nursingHomeId === resourceHome),
  );
  const matchedRoleTemplates = state.roleTemplates.filter(
    (template) =>
      template.active &&
      template.capabilities.includes(capability) &&
      activeRoles.some((assignment) => assignment.roleKey === template.key),
  );
  if (allow.length === 0 && matchedRoleTemplates.length === 0) {
    return { allowed: false, capability, resourceScope: scopedResource, matchedGrants: [], matchedRoleTemplates: [], deniedReason: "No grant or role template capability matched.", finalDecision: "deny" };
  }

  if (resourceWard) {
    const management = activeRoles.some((assignment) => ["DON", "CNM"].includes(assignment.roleKey));
    const wardAllowed = management || getStaffAccessibleWards(state, staffId, resourceHome as string | undefined).includes(resourceWard as WardId);
    if (!wardAllowed) {
      return { allowed: false, capability, resourceScope: scopedResource, matchedGrants: allow, matchedRoleTemplates, deniedReason: "No active ward competency for requested ward.", finalDecision: "deny" };
    }
  }

  if (capability.startsWith("finance.") && allow.length === 0) {
    return { allowed: false, capability, resourceScope: scopedResource, matchedGrants: [], matchedRoleTemplates, deniedReason: "Finance capability requires explicit grant.", finalDecision: "deny" };
  }

  return { allowed: true, capability, resourceScope: scopedResource, matchedGrants: allow, matchedRoleTemplates, finalDecision: "allow" };
}

export function canAccess(
  state: StaffAccessState,
  context: AuthorizationContext,
  capability: Permission | string,
  resource: ResourceContext = {},
) {
  return explainAuthorizationDecision(state, context, capability, resource).allowed;
}

export function getEffectivePermissions(state: StaffAccessState, context: AuthorizationContext, resource: ResourceContext = {}) {
  const capabilities = new Set<string>();
  for (const template of state.roleTemplates) {
    for (const capability of template.capabilities) {
      if (canAccess(state, context, capability, resource)) capabilities.add(capability);
    }
  }
  for (const grant of state.permissionGrants.filter((item) => item.effect === "allow")) {
    if (canAccess(state, context, grant.capability, resource)) capabilities.add(grant.capability);
  }
  return Array.from(capabilities).sort();
}

export function validateStaffAccessModel(state: StaffAccessState) {
  const userAccountIds = new Set(state.userAccounts.map((account) => account.id));
  const staffIds = new Set(state.staffMembers.map((staff) => staff.id));
  const homeIds = new Set(state.facilities.map((facility) => facility.id));
  const wardById = new Map(state.wards.map((ward) => [ward.id, ward]));
  const unlinkedUserAccounts = state.userAccounts.filter((account) => !account.staffMemberId).map((account) => account.id);
  const activeAccountsWithoutStaffMember = state.userAccounts
    .filter((account) => account.accountStatus === "active" && (!account.staffMemberId || !staffIds.has(account.staffMemberId)))
    .map((account) => account.id);
  const staffWithoutEmployment = state.staffMembers
    .filter((staff) => !state.employmentRecords.some((record) => record.staffMemberId === staff.id))
    .map((staff) => staff.id);
  const expiredRoleAssignmentsStillGrantingAccess = state.roleAssignments
    .filter((assignment) => assignment.status !== "active" && state.roleTemplates.some((template) => template.key === assignment.roleKey && template.active))
    .map((assignment) => assignment.id);
  const usersWithInaccessibleHomes = state.roleAssignments
    .filter((assignment) => assignment.nursingHomeId && !state.homeAssignments.some((home) => home.staffMemberId === assignment.staffMemberId && home.nursingHomeId === assignment.nursingHomeId && home.status === "active"))
    .map((assignment) => assignment.id);
  const wardCompetenciesWithMismatchedHome = state.wardCompetencies
    .filter((competency) => wardById.get(competency.wardId)?.nursingHomeId !== competency.nursingHomeId)
    .map((competency) => competency.id);
  const rosterAssignmentsOutsideCompetency = state.rosterAssignments
    .filter((assignment) => assignment.wardId && !state.wardCompetencies.some((competency) => competency.staffMemberId === assignment.staffMemberId && competency.wardId === assignment.wardId && competency.status === "approved"))
    .map((assignment) => assignment.id);
  const professionalRegistrationsExpired = getExpiredRegistrations(state).map((registration) => registration.id);
  const crossHomePermissionGrants = state.permissionGrants
    .filter((grant) => grant.nursingHomeId && !homeIds.has(grant.nursingHomeId))
    .map((grant) => grant.id);
  const currentUserIdsUnchanged = state.users.every((user) => userAccountIds.has(user.id as UserAccountId));
  const duplicateStaffIdentities = Object.entries(
    state.staffMembers.reduce<Record<string, number>>((acc, staff) => {
      const key = `${staff.displayName.toLowerCase()}:${staff.email || ""}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  ).filter(([, count]) => count > 1).map(([key]) => key);
  const activeRoleAssignments = state.roleAssignments.filter((assignment) => assignment.status === "active").length;
  const ambiguousMigrationsRequiringReview = state.professionalRegistrations
    .filter((registration) => registration.registrationStatus === "unknown")
    .map((registration) => registration.id);
  const criticalErrors = [
    ...activeAccountsWithoutStaffMember.map((id) => `Active account without staff member: ${id}`),
    ...usersWithInaccessibleHomes.map((id) => `Role assignment without home assignment: ${id}`),
    ...wardCompetenciesWithMismatchedHome.map((id) => `Ward competency home mismatch: ${id}`),
    ...rosterAssignmentsOutsideCompetency.map((id) => `Roster outside competency: ${id}`),
    ...crossHomePermissionGrants.map((id) => `Cross-home permission grant: ${id}`),
    ...(currentUserIdsUnchanged ? [] : ["Current user IDs changed"]),
  ];

  return {
    userAccountCount: state.userAccounts.length,
    staffMemberCount: state.staffMembers.length,
    unlinkedUserAccounts,
    duplicateStaffIdentities,
    activeAccountsWithoutStaffMember,
    staffWithoutEmployment,
    activeRoleAssignments,
    expiredRoleAssignmentsStillGrantingAccess,
    usersWithInaccessibleHomes,
    wardCompetenciesWithMismatchedHome,
    rosterAssignmentsOutsideCompetency,
    professionalRegistrationsExpired,
    crossHomePermissionGrants,
    currentUserIdsUnchanged,
    clinicalAuthorReferencesUnresolved: [] as string[],
    ambiguousMigrationsRequiringReview,
    criticalErrors,
  };
}

export function createStaffAccessContext(user: UserProfile, activeNursingHomeId?: string, activeWardId?: string): AuthorizationContext {
  return {
    userAccountId: userAccountId(user.id),
    staffMemberId: staffMemberId(user.id),
    activeNursingHomeId: activeNursingHomeId || user.facilityId || user.facilityIds?.[0] || DEFAULT_HOME_ID,
    activeWardId,
  };
}

export function createDenyGrant(id: string, staffId: string, capability: string, nursingHomeId: string): PermissionGrant {
  return {
    id: asPermissionGrantId(id),
    staffMemberId: asStaffMemberId(staffId),
    capability,
    scopeType: "nursing_home",
    nursingHomeId: asNursingHomeId(nursingHomeId),
    effect: "deny",
    effectiveFrom: "2026-01-01",
    reason: "Test deny",
    createdAt: MIGRATION_TIMESTAMP,
    updatedAt: MIGRATION_TIMESTAMP,
  };
}
