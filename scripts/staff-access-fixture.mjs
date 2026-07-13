export const BALLYMORE = "facility-ballymore-haven";
export const HAZELWOOD = "facility-hazelwood-care";
export const BALLYMORE_WARD = "ward-ballymore-haven-general";
export const HAZELWOOD_WARD = "ward-hazelwood-care-general";
export const OTHER_BALLYMORE_WARD = "ward-ballymore-haven-memory";
export const NOW = new Date("2026-07-13T12:00:00.000Z");

export const roleCapabilities = {
  HCA: ["resident.view", "careplan.view", "observation.view", "observation.record", "note.create"],
  NURSE: [
    "resident.view",
    "resident.edit",
    "assessment.view",
    "assessment.create",
    "careplan.view",
    "careplan.create",
    "careplan.edit",
    "careplan.review",
    "observation.view",
    "observation.record",
    "incident.view",
    "incident.create",
    "home.switch",
    "ward.switch",
  ],
  DOCTOR: ["resident.view", "clinical.view", "careplan.view", "observation.view", "mdt.create"],
  CNM: [
    "resident.view",
    "assessment.view",
    "assessment.create",
    "careplan.view",
    "careplan.create",
    "careplan.review",
    "governance.view",
    "incident.view",
    "incident.manage",
    "safeguarding.view",
    "home.switch",
    "ward.switch",
  ],
  DON: [
    "resident.view",
    "assessment.view",
    "assessment.create",
    "careplan.view",
    "careplan.create",
    "careplan.review",
    "governance.view",
    "incident.view",
    "incident.manage",
    "audit.view",
    "report.view",
    "safeguarding.view",
    "home.switch",
    "ward.switch",
  ],
};

const effective = (from, to, at = NOW) => Date.parse(from) <= at.getTime() && (!to || Date.parse(to) >= at.getTime());
const roleTemplate = (key) => ({
  id: `role-template-${key.toLowerCase()}`,
  key,
  name: key,
  capabilities: roleCapabilities[key],
  active: true,
  version: 1,
  createdAt: "2026-07-13T00:00:00.000Z",
  updatedAt: "2026-07-13T00:00:00.000Z",
});

export function createStaffAccessFixture(overrides = {}) {
  const facilities = [
    { id: BALLYMORE, name: "Ballymore Haven", enterpriseId: "enterprise-default" },
    { id: HAZELWOOD, name: "Hazelwood Care", enterpriseId: "enterprise-default" },
  ];
  const wards = [
    { id: BALLYMORE_WARD, nursingHomeId: BALLYMORE, name: "General" },
    { id: OTHER_BALLYMORE_WARD, nursingHomeId: BALLYMORE, name: "Memory" },
    { id: HAZELWOOD_WARD, nursingHomeId: HAZELWOOD, name: "General" },
  ];
  const staffMembers = [
    { id: "staff-u-nurse", displayName: "Nora Nurse", firstName: "Nora", lastName: "Nurse", active: true, createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "staff-u-hca", displayName: "Cara Carer", firstName: "Cara", lastName: "Carer", active: true, createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "staff-u-don", displayName: "Dana Don", firstName: "Dana", lastName: "Don", active: true, createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "staff-u-multi", displayName: "Mina Multi", firstName: "Mina", lastName: "Multi", active: true, createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "staff-u-agency", displayName: "Ari Agency", firstName: "Ari", lastName: "Agency", active: true, createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "staff-u-ended", displayName: "Eli Ended", firstName: "Eli", lastName: "Ended", active: true, createdAt: "2024-01-01", updatedAt: "2026-07-13" },
  ];
  const userAccounts = [
    { id: "u-nurse", staffMemberId: "staff-u-nurse", accountStatus: "active", email: "nora@example.test", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "u-hca", staffMemberId: "staff-u-hca", accountStatus: "active", email: "cara@example.test", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "u-don", staffMemberId: "staff-u-don", accountStatus: "active", email: "dana@example.test", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "u-multi", staffMemberId: "staff-u-multi", accountStatus: "active", email: "mina@example.test", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "u-agency", staffMemberId: "staff-u-agency", accountStatus: "active", email: "ari.agency@example.test", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "u-ended", staffMemberId: "staff-u-ended", accountStatus: "disabled", email: "eli@example.test", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
  ];
  const employmentRecords = [
    { id: "employment-u-nurse-ballymore", staffMemberId: "staff-u-nurse", nursingHomeId: BALLYMORE, employmentType: "permanent", employmentStatus: "active", jobTitle: "Nurse", startDate: "2024-01-01", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "employment-u-hca-ballymore", staffMemberId: "staff-u-hca", nursingHomeId: BALLYMORE, employmentType: "permanent", employmentStatus: "active", jobTitle: "HCA", startDate: "2024-01-01", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "employment-u-don-ballymore", staffMemberId: "staff-u-don", nursingHomeId: BALLYMORE, employmentType: "permanent", employmentStatus: "active", jobTitle: "DON", startDate: "2024-01-01", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "employment-u-multi-ballymore", staffMemberId: "staff-u-multi", nursingHomeId: BALLYMORE, employmentType: "permanent", employmentStatus: "active", jobTitle: "Nurse", startDate: "2024-01-01", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "employment-u-multi-hazelwood", staffMemberId: "staff-u-multi", nursingHomeId: HAZELWOOD, employmentType: "permanent", employmentStatus: "active", jobTitle: "CNM", startDate: "2024-01-01", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "employment-u-agency-ballymore", staffMemberId: "staff-u-agency", nursingHomeId: BALLYMORE, employmentType: "agency", agencyName: "SafeStaff Agency", employmentStatus: "active", jobTitle: "Nurse", startDate: "2026-07-01", endDate: "2026-07-31", createdAt: "2026-07-01", updatedAt: "2026-07-13" },
    { id: "employment-u-ended-ballymore", staffMemberId: "staff-u-ended", nursingHomeId: BALLYMORE, employmentType: "permanent", employmentStatus: "ended", jobTitle: "Nurse", startDate: "2024-01-01", endDate: "2025-12-31", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
  ];
  const homeAssignments = [
    { id: "home-u-nurse-ballymore", staffMemberId: "staff-u-nurse", nursingHomeId: BALLYMORE, status: "active", validFrom: "2024-01-01", assignmentType: "primary", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "home-u-hca-ballymore", staffMemberId: "staff-u-hca", nursingHomeId: BALLYMORE, status: "active", validFrom: "2024-01-01", assignmentType: "primary", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "home-u-don-ballymore", staffMemberId: "staff-u-don", nursingHomeId: BALLYMORE, status: "active", validFrom: "2024-01-01", assignmentType: "primary", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "home-u-multi-ballymore", staffMemberId: "staff-u-multi", nursingHomeId: BALLYMORE, status: "active", validFrom: "2024-01-01", assignmentType: "primary", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "home-u-multi-hazelwood", staffMemberId: "staff-u-multi", nursingHomeId: HAZELWOOD, status: "active", validFrom: "2024-01-01", assignmentType: "secondary", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "home-u-agency-ballymore", staffMemberId: "staff-u-agency", nursingHomeId: BALLYMORE, status: "active", validFrom: "2026-07-01", validTo: "2026-07-31", assignmentType: "agency", createdAt: "2026-07-01", updatedAt: "2026-07-13" },
  ];
  const roleAssignments = [
    { id: "role-u-nurse-ballymore", staffMemberId: "staff-u-nurse", userAccountId: "u-nurse", roleKey: "NURSE", nursingHomeId: BALLYMORE, effectiveFrom: "2024-01-01", status: "active", isPrimary: true, createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "role-u-hca-ballymore", staffMemberId: "staff-u-hca", userAccountId: "u-hca", roleKey: "HCA", nursingHomeId: BALLYMORE, effectiveFrom: "2024-01-01", status: "active", isPrimary: true, createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "role-u-don-ballymore", staffMemberId: "staff-u-don", userAccountId: "u-don", roleKey: "DON", nursingHomeId: BALLYMORE, effectiveFrom: "2024-01-01", status: "active", isPrimary: true, createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "role-u-multi-ballymore", staffMemberId: "staff-u-multi", userAccountId: "u-multi", roleKey: "NURSE", nursingHomeId: BALLYMORE, effectiveFrom: "2024-01-01", status: "active", isPrimary: true, createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "role-u-multi-hazelwood", staffMemberId: "staff-u-multi", userAccountId: "u-multi", roleKey: "CNM", nursingHomeId: HAZELWOOD, effectiveFrom: "2024-01-01", status: "active", isPrimary: false, createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "role-u-agency-ballymore", staffMemberId: "staff-u-agency", userAccountId: "u-agency", roleKey: "NURSE", nursingHomeId: BALLYMORE, effectiveFrom: "2026-07-01", effectiveTo: "2026-07-31", status: "active", isPrimary: true, createdAt: "2026-07-01", updatedAt: "2026-07-13" },
  ];
  const wardCompetencies = [
    { id: "wc-u-nurse-ballymore", staffMemberId: "staff-u-nurse", nursingHomeId: BALLYMORE, wardId: BALLYMORE_WARD, status: "approved", effectiveFrom: "2024-01-01", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "wc-u-hca-ballymore", staffMemberId: "staff-u-hca", nursingHomeId: BALLYMORE, wardId: BALLYMORE_WARD, status: "approved", effectiveFrom: "2024-01-01", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "wc-u-multi-ballymore", staffMemberId: "staff-u-multi", nursingHomeId: BALLYMORE, wardId: BALLYMORE_WARD, status: "approved", effectiveFrom: "2024-01-01", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "wc-u-multi-hazelwood", staffMemberId: "staff-u-multi", nursingHomeId: HAZELWOOD, wardId: HAZELWOOD_WARD, status: "approved", effectiveFrom: "2024-01-01", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "wc-u-agency-ballymore", staffMemberId: "staff-u-agency", nursingHomeId: BALLYMORE, wardId: BALLYMORE_WARD, status: "approved", effectiveFrom: "2026-07-01", effectiveTo: "2026-07-31", createdAt: "2026-07-01", updatedAt: "2026-07-13" },
  ];
  const professionalRegistrations = [
    { id: "reg-u-nurse", staffMemberId: "staff-u-nurse", profession: "nurse", registrationBody: "NMBI", registrationNumber: "N0001", registrationStatus: "active", expiryDate: "2026-08-01", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
    { id: "reg-u-agency", staffMemberId: "staff-u-agency", profession: "nurse", registrationBody: "NMBI", registrationNumber: "A0001", registrationStatus: "active", expiryDate: "2026-07-20", createdAt: "2026-07-01", updatedAt: "2026-07-13" },
    { id: "reg-u-ended", staffMemberId: "staff-u-ended", profession: "nurse", registrationBody: "NMBI", registrationNumber: "E0001", registrationStatus: "active", expiryDate: "2025-12-31", createdAt: "2024-01-01", updatedAt: "2026-07-13" },
  ];

  return {
    users: [
      { id: "u-nurse", role: "nurse", facilityIds: [BALLYMORE] },
      { id: "u-multi", role: "nurse", facilityIds: [BALLYMORE, HAZELWOOD] },
    ],
    facilities,
    wards,
    userAccounts,
    staffMembers,
    employmentRecords,
    roleAssignments,
    professionalRegistrations,
    homeAssignments,
    wardCompetencies,
    rosterAssignments: [],
    permissionGrants: [],
    roleTemplates: ["HCA", "NURSE", "DOCTOR", "CNM", "DON"].map(roleTemplate),
    ...overrides,
  };
}

export function context(userAccountId, activeNursingHomeId = BALLYMORE, activeWardId = BALLYMORE_WARD) {
  return { userAccountId, activeNursingHomeId, activeWardId };
}

export function getStaffAccessibleHomes(state, staffMemberId) {
  return state.homeAssignments
    .filter((assignment) => assignment.staffMemberId === staffMemberId && assignment.status === "active" && effective(assignment.validFrom, assignment.validTo))
    .map((assignment) => assignment.nursingHomeId);
}

export function getStaffAccessibleWards(state, staffMemberId, nursingHomeId) {
  return state.wardCompetencies
    .filter((competency) => competency.staffMemberId === staffMemberId && competency.status === "approved" && competency.nursingHomeId === nursingHomeId && effective(competency.effectiveFrom, competency.effectiveTo))
    .map((competency) => competency.wardId);
}

export function registrationStatus(registration, warningDays = 30) {
  if (!registration.expiryDate) return registration.registrationStatus;
  const days = Math.ceil((Date.parse(registration.expiryDate) - NOW.getTime()) / 86400000);
  if (days < 0) return "expired";
  if (days <= warningDays) return "expiring";
  return "active";
}

export function explainAuthorizationDecision(state, ctx, capability, resource = {}) {
  const account = state.userAccounts.find((item) => item.id === ctx.userAccountId);
  const staffId = ctx.staffMemberId || account?.staffMemberId;
  const nursingHomeId = resource.nursingHomeId || ctx.activeNursingHomeId;
  const wardId = resource.wardId || ctx.activeWardId;
  const scoped = { ...resource, nursingHomeId, wardId };
  if (!account || account.accountStatus !== "active") {
    return { allowed: false, capability, resourceScope: scoped, matchedGrants: [], matchedRoleTemplates: [], deniedReason: "Account is not active.", finalDecision: "deny" };
  }
  if (!staffId) {
    return { allowed: false, capability, resourceScope: scoped, matchedGrants: [], matchedRoleTemplates: [], deniedReason: "Account is not linked to a staff member.", finalDecision: "deny" };
  }
  const grants = state.permissionGrants.filter((grant) => {
    const sameSubject = grant.userAccountId === account.id || grant.staffMemberId === staffId;
    const sameCapability = grant.capability === capability;
    const homeOk = !grant.nursingHomeId || grant.nursingHomeId === nursingHomeId;
    const wardOk = !grant.wardId || grant.wardId === wardId;
    return sameSubject && sameCapability && homeOk && wardOk && effective(grant.effectiveFrom, grant.effectiveTo);
  });
  const deny = grants.find((grant) => grant.effect === "deny");
  if (deny) return { allowed: false, capability, resourceScope: scoped, matchedGrants: [deny], matchedRoleTemplates: [], deniedReason: "Explicit deny matched.", finalDecision: "deny" };
  if (nursingHomeId && !getStaffAccessibleHomes(state, staffId).includes(nursingHomeId)) {
    return { allowed: false, capability, resourceScope: scoped, matchedGrants: grants, matchedRoleTemplates: [], deniedReason: "No active home assignment for requested nursing home.", finalDecision: "deny" };
  }
  const roles = state.roleAssignments.filter((role) => role.staffMemberId === staffId && role.status === "active" && effective(role.effectiveFrom, role.effectiveTo) && (!nursingHomeId || role.nursingHomeId === nursingHomeId));
  const templates = state.roleTemplates.filter((template) => template.active && template.capabilities.includes(capability) && roles.some((role) => role.roleKey === template.key));
  const allows = grants.filter((grant) => grant.effect === "allow");
  if (!templates.length && !allows.length) {
    return { allowed: false, capability, resourceScope: scoped, matchedGrants: grants, matchedRoleTemplates: [], deniedReason: "No grant or role template capability matched.", finalDecision: "deny" };
  }
  if (wardId && !roles.some((role) => ["DON", "CNM"].includes(role.roleKey)) && !getStaffAccessibleWards(state, staffId, nursingHomeId).includes(wardId)) {
    return { allowed: false, capability, resourceScope: scoped, matchedGrants: grants, matchedRoleTemplates: templates, deniedReason: "No active ward competency for requested ward.", finalDecision: "deny" };
  }
  if (capability.startsWith("finance.") && !allows.length) {
    return { allowed: false, capability, resourceScope: scoped, matchedGrants: grants, matchedRoleTemplates: templates, deniedReason: "Finance capability requires explicit grant.", finalDecision: "deny" };
  }
  return { allowed: true, capability, resourceScope: scoped, matchedGrants: allows, matchedRoleTemplates: templates, finalDecision: "allow" };
}

export const canAccess = (state, ctx, capability, resource = {}) => explainAuthorizationDecision(state, ctx, capability, resource).allowed;

export function validateStaffAccessFixture(state) {
  const staffIds = new Set(state.staffMembers.map((item) => item.id));
  const accountIds = new Set(state.userAccounts.map((item) => item.id));
  const homeIds = new Set(state.facilities.map((item) => item.id));
  const wardById = new Map(state.wards.map((item) => [item.id, item]));
  const activeAccountsWithoutStaffMember = state.userAccounts.filter((account) => account.accountStatus === "active" && !staffIds.has(account.staffMemberId)).map((item) => item.id);
  const staffWithoutEmployment = state.staffMembers.filter((staff) => !state.employmentRecords.some((record) => record.staffMemberId === staff.id)).map((item) => item.id);
  const usersWithInaccessibleHomes = state.roleAssignments.filter((role) => role.status === "active" && role.nursingHomeId && !state.homeAssignments.some((home) => home.staffMemberId === role.staffMemberId && home.nursingHomeId === role.nursingHomeId && home.status === "active")).map((item) => item.id);
  const wardCompetenciesWithMismatchedHome = state.wardCompetencies.filter((competency) => wardById.get(competency.wardId)?.nursingHomeId !== competency.nursingHomeId).map((item) => item.id);
  const rosterAssignmentsOutsideCompetency = state.rosterAssignments.filter((assignment) => assignment.wardId && !state.wardCompetencies.some((competency) => competency.staffMemberId === assignment.staffMemberId && competency.wardId === assignment.wardId && competency.status === "approved")).map((item) => item.id);
  const crossHomePermissionGrants = state.permissionGrants.filter((grant) => grant.nursingHomeId && !homeIds.has(grant.nursingHomeId)).map((item) => item.id);
  const professionalRegistrationsExpired = state.professionalRegistrations.filter((registration) => registrationStatus(registration) === "expired").map((item) => item.id);
  const currentUserIdsUnchanged = state.users.every((user) => accountIds.has(user.id));
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
    unlinkedUserAccounts: state.userAccounts.filter((account) => !account.staffMemberId).map((item) => item.id),
    duplicateStaffIdentities: [],
    activeAccountsWithoutStaffMember,
    staffWithoutEmployment,
    activeRoleAssignments: state.roleAssignments.filter((role) => role.status === "active").length,
    expiredRoleAssignmentsStillGrantingAccess: state.roleAssignments.filter((role) => role.status !== "active").map((item) => item.id),
    usersWithInaccessibleHomes,
    wardCompetenciesWithMismatchedHome,
    rosterAssignmentsOutsideCompetency,
    professionalRegistrationsExpired,
    crossHomePermissionGrants,
    currentUserIdsUnchanged,
    clinicalAuthorReferencesUnresolved: [],
    ambiguousMigrationsRequiringReview: [],
    criticalErrors,
  };
}
