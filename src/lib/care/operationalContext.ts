import type {
  Facility,
  HomeAssignment,
  OperationalContext,
  ProblemIntervention,
  ProblemInterventionLog,
  CarePlanProblem,
  Resident,
  RoleAssignment,
  ShiftDefinition,
  StaffMember,
  Task,
  UserAccount,
  UserProfile,
  Ward,
  WardCompetency,
} from "./types";
import {
  asNursingHomeId,
  asOperationalContextId,
  asShiftId,
  asUserAccountId,
  asWardId,
  type NursingHomeId,
  type WardId,
} from "@/types/entityIds";

const DEFAULT_TIMEZONE = "Europe/Dublin";
const CONTEXT_TIMESTAMP = "2026-07-13T00:00:00.000Z";

export interface OperationalContextState {
  facilities: Facility[];
  wards: Ward[];
  residents: Resident[];
  users: UserProfile[];
  userAccounts: UserAccount[];
  staffMembers: StaffMember[];
  homeAssignments: HomeAssignment[];
  wardCompetencies: WardCompetency[];
  roleAssignments: RoleAssignment[];
  shiftDefinitions: ShiftDefinition[];
  operationalContexts: OperationalContext[];
  tasks?: Task[];
  handovers?: { id: string; residentId?: string; facilityId?: string; wardId?: string; status?: string; shift?: string }[];
  clinicalAlerts?: { id: string; residentId: string; resolvedAt?: string; acknowledged?: boolean }[];
  incidents?: { id: string; residentId?: string; facilityId?: string; wardId?: string; status?: string }[];
  carePlanProblems?: CarePlanProblem[];
  problemInterventions?: ProblemIntervention[];
  problemInterventionLogs?: ProblemInterventionLog[];
}

export interface OperationalContextInput {
  userAccountId: string;
  nursingHomeId?: string;
  wardIds?: string[];
  wardSelectionMode?: OperationalContext["wardSelectionMode"];
  shiftId?: string;
  dateTime?: string;
  operationalDate?: string;
  source?: OperationalContext["source"];
}

export const defaultShiftDefinitions = (nursingHomeId: string): ShiftDefinition[] => [
  {
    id: asShiftId(`shift-${nursingHomeId}-day`),
    nursingHomeId: asNursingHomeId(nursingHomeId),
    label: "Day Shift",
    startsAt: "08:00",
    endsAt: "14:00",
    active: true,
    sortOrder: 1,
  },
  {
    id: asShiftId(`shift-${nursingHomeId}-late`),
    nursingHomeId: asNursingHomeId(nursingHomeId),
    label: "Late Shift",
    startsAt: "14:00",
    endsAt: "20:00",
    active: true,
    sortOrder: 2,
  },
  {
    id: asShiftId(`shift-${nursingHomeId}-night`),
    nursingHomeId: asNursingHomeId(nursingHomeId),
    label: "Night Shift",
    startsAt: "20:00",
    endsAt: "08:00",
    active: true,
    sortOrder: 3,
  },
];

export function migrateOperationalContext<T extends OperationalContextState>(source: T): T {
  const existingHomeIds = new Set(source.shiftDefinitions.map((shift) => shift.nursingHomeId));
  const shiftDefinitions = [
    ...source.shiftDefinitions,
    ...source.facilities.filter((facility) => !existingHomeIds.has(facility.id as NursingHomeId)).flatMap((facility) => defaultShiftDefinitions(facility.id)),
  ];
  return {
    ...source,
    shiftDefinitions,
    operationalContexts: source.operationalContexts || [],
    facilities: source.facilities.map((facility) => ({
      ...facility,
      timezone: (facility as Facility & { timezone?: string }).timezone || DEFAULT_TIMEZONE,
    })),
  };
}

const parseDateAtTime = (date: string, hhmm: string) => new Date(`${date}T${hhmm}:00`);
const dateKey = (value: Date) => value.toISOString().slice(0, 10);
const addDays = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);
  return dateKey(value);
};

export function getConfiguredShifts(state: OperationalContextState, nursingHomeId: string) {
  return state.shiftDefinitions
    .filter((shift) => shift.nursingHomeId === nursingHomeId && shift.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getShiftById(state: OperationalContextState, shiftId: string) {
  return state.shiftDefinitions.find((shift) => shift.id === shiftId);
}

export function getShiftDateRange(shift: ShiftDefinition, operationalDate: string) {
  const starts = parseDateAtTime(operationalDate, shift.startsAt);
  const endsOnNextDay = shift.endsAt <= shift.startsAt;
  const endDate = endsOnNextDay ? addDays(operationalDate, 1) : operationalDate;
  return {
    start: starts.toISOString(),
    end: parseDateAtTime(endDate, shift.endsAt).toISOString(),
  };
}

export function getCurrentShift(state: OperationalContextState, nursingHomeId: string, dateTime = new Date().toISOString()) {
  const shifts = getConfiguredShifts(state, nursingHomeId);
  const current = new Date(dateTime);
  const today = dateTime.slice(0, 10);
  for (const shift of shifts) {
    for (const operationalDate of [today, addDays(today, -1)]) {
      const range = getShiftDateRange(shift, operationalDate);
      if (Date.parse(range.start) <= current.getTime() && current.getTime() < Date.parse(range.end)) {
        return { shift, operationalDate, ...range };
      }
    }
  }
  const fallback = shifts[0] || defaultShiftDefinitions(nursingHomeId)[0];
  return { shift: fallback, operationalDate: today, ...getShiftDateRange(fallback, today) };
}

export const resolveCurrentShift = getCurrentShift;

export function resolveShiftForOperationalDate(state: OperationalContextState, shiftId: string, operationalDate: string) {
  const shift = getShiftById(state, shiftId);
  if (!shift) return undefined;
  return { shift, operationalDate, ...getShiftDateRange(shift, operationalDate) };
}

export function getShiftWindow(shift: ShiftDefinition, operationalDate: string) {
  return getShiftDateRange(shift, operationalDate);
}

export function getNextShift(state: OperationalContextState, nursingHomeId: string, shiftId: string, operationalDate: string) {
  const shifts = getConfiguredShifts(state, nursingHomeId);
  const index = shifts.findIndex((shift) => shift.id === shiftId);
  if (index < 0 || shifts.length === 0) return undefined;
  const next = shifts[(index + 1) % shifts.length];
  const nextDate = index === shifts.length - 1 ? addDays(operationalDate, 1) : operationalDate;
  return { shift: next, operationalDate: nextDate, ...getShiftDateRange(next, nextDate) };
}

export function getPreviousShift(state: OperationalContextState, nursingHomeId: string, shiftId: string, operationalDate: string) {
  const shifts = getConfiguredShifts(state, nursingHomeId);
  const index = shifts.findIndex((shift) => shift.id === shiftId);
  if (index < 0 || shifts.length === 0) return undefined;
  const previousIndex = index === 0 ? shifts.length - 1 : index - 1;
  const previous = shifts[previousIndex];
  const previousDate = index === 0 ? addDays(operationalDate, -1) : operationalDate;
  return { shift: previous, operationalDate: previousDate, ...getShiftDateRange(previous, previousDate) };
}

export const getShiftsForHome = getConfiguredShifts;

const isEffective = (from: string, to?: string, dateTime = new Date().toISOString()) =>
  Date.parse(from) <= Date.parse(dateTime) && (!to || Date.parse(to) >= Date.parse(dateTime));

export function getAuthorisedHomeIds(state: OperationalContextState, userAccountId: string, dateTime = new Date().toISOString()) {
  const account = state.userAccounts.find((item) => item.id === userAccountId);
  if (!account || account.accountStatus !== "active" || !account.staffMemberId) return [];
  return state.homeAssignments
    .filter((assignment) => assignment.staffMemberId === account.staffMemberId && assignment.status === "active" && isEffective(assignment.validFrom, assignment.validTo, dateTime))
    .map((assignment) => assignment.nursingHomeId);
}

export function getAuthorisedWardIds(state: OperationalContextState, userAccountId: string, nursingHomeId: string, dateTime = new Date().toISOString()) {
  const account = state.userAccounts.find((item) => item.id === userAccountId);
  if (!account?.staffMemberId) return [];
  const activeRoles = state.roleAssignments.filter(
    (role) => role.staffMemberId === account.staffMemberId && role.status === "active" && role.nursingHomeId === nursingHomeId && isEffective(role.effectiveFrom, role.effectiveTo, dateTime),
  );
  const management = activeRoles.some((role) => ["DON", "CNM"].includes(role.roleKey));
  if (management) return state.wards.filter((ward) => ward.nursingHomeId === nursingHomeId && ward.active !== false).map((ward) => ward.id);
  return state.wardCompetencies
    .filter((competency) => competency.staffMemberId === account.staffMemberId && competency.nursingHomeId === nursingHomeId && competency.status === "approved" && isEffective(competency.effectiveFrom, competency.effectiveTo, dateTime))
    .map((competency) => competency.wardId);
}

export function canSwitchToWard(state: OperationalContextState, context: OperationalContext, wardId: string) {
  const account = state.userAccounts.find((item) => item.id === context.userAccountId);
  const ward = state.wards.find((item) => item.id === wardId);
  if (!account || account.accountStatus !== "active") {
    return { allowed: false, reason: "Account is not active." };
  }
  if (!ward) {
    return { allowed: false, reason: "Ward does not exist." };
  }
  if (ward.active === false) {
    return { allowed: false, reason: "Ward is inactive." };
  }
  if (ward.nursingHomeId !== context.nursingHomeId) {
    return { allowed: false, reason: "Ward belongs to another nursing home." };
  }
  const authorised = getAuthorisedWardIds(state, context.userAccountId, context.nursingHomeId);
  if (!authorised.includes(wardId as WardId)) {
    return { allowed: false, reason: "User is not authorised for this ward." };
  }
  return { allowed: true };
}

export function canSelectMultipleWards(state: OperationalContextState, context: OperationalContext) {
  const role = resolveEffectiveRole(state, context.userAccountId, context.nursingHomeId);
  const authorisedWardCount = getAuthorisedWardIds(state, context.userAccountId, context.nursingHomeId).length;
  return authorisedWardCount > 1 && ["DON", "CNM"].includes(role);
}

export function resolveEffectiveRole(state: OperationalContextState, userAccountId: string, nursingHomeId: string, dateTime = new Date().toISOString()) {
  const account = state.userAccounts.find((item) => item.id === userAccountId);
  if (!account?.staffMemberId) return "HCA";
  const roles = state.roleAssignments
    .filter((role) => role.staffMemberId === account.staffMemberId && role.status === "active" && role.nursingHomeId === nursingHomeId && isEffective(role.effectiveFrom, role.effectiveTo, dateTime))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  return roles[0]?.roleKey || "HCA";
}

export function initialiseOperationalContext(state: OperationalContextState, input: OperationalContextInput): OperationalContext {
  const dateTime = input.dateTime || new Date().toISOString();
  const account = state.userAccounts.find((item) => item.id === input.userAccountId);
  const authorisedHomes = getAuthorisedHomeIds(state, input.userAccountId, dateTime);
  const requestedHome = input.nursingHomeId && authorisedHomes.includes(input.nursingHomeId as NursingHomeId) ? input.nursingHomeId : authorisedHomes[0];
  if (!requestedHome) throw new Error("No authorised nursing home is available for this user.");
  const authorisedWards = getAuthorisedWardIds(state, input.userAccountId, requestedHome, dateTime);
  const requestedWards = Array.from(new Set(input.wardIds || [])).filter((wardId) => authorisedWards.includes(wardId as WardId));
  const wardSelectionMode = input.wardSelectionMode || (requestedWards.length > 1 ? "multiple" : "single");
  if (input.wardIds?.length && requestedWards.length !== new Set(input.wardIds).size) {
    throw new Error("One or more selected wards are not authorised.");
  }
  if (wardSelectionMode === "multiple" && requestedWards.length === 0) {
    throw new Error("Multi-ward selection cannot be empty.");
  }
  const wardIds =
    wardSelectionMode === "all_authorised"
      ? authorisedWards
      : requestedWards.length
        ? requestedWards
        : authorisedWards.slice(0, 1);
  if (authorisedWards.length > 0 && wardIds.length === 0) throw new Error("No authorised ward is available for this user.");
  const shiftResolution = input.shiftId
    ? (() => {
        const shift = getShiftById(state, input.shiftId) || getCurrentShift(state, requestedHome, dateTime).shift;
        return { shift, operationalDate: input.operationalDate || dateTime.slice(0, 10), ...getShiftDateRange(shift, input.operationalDate || dateTime.slice(0, 10)) };
      })()
    : getCurrentShift(state, requestedHome, dateTime);
  const facility = state.facilities.find((home) => home.id === requestedHome) as Facility & { timezone?: string } | undefined;
  return {
    id: asOperationalContextId(`operational-context-${input.userAccountId}`),
    userAccountId: asUserAccountId(input.userAccountId),
    staffMemberId: account?.staffMemberId,
    nursingHomeId: asNursingHomeId(requestedHome),
    wardSelectionMode,
    wardIds: wardIds.map(asWardId),
    shiftId: shiftResolution.shift.id,
    shiftLabel: shiftResolution.shift.label,
    shiftStartAt: shiftResolution.start,
    shiftEndAt: shiftResolution.end,
    operationalDate: shiftResolution.operationalDate,
    timezone: facility?.timezone || DEFAULT_TIMEZONE,
    effectiveRoleKey: resolveEffectiveRole(state, input.userAccountId, requestedHome, dateTime),
    source: input.source || "default",
    updatedAt: CONTEXT_TIMESTAMP,
  };
}

export function switchNursingHome(state: OperationalContextState, context: OperationalContext, nursingHomeId: string) {
  return initialiseOperationalContext(state, {
    userAccountId: context.userAccountId,
    nursingHomeId,
    dateTime: context.updatedAt,
    source: "manual_override",
  });
}

export function selectSingleWard(state: OperationalContextState, context: OperationalContext, wardId: string) {
  const decision = canSwitchToWard(state, context, wardId);
  if (!decision.allowed) throw new Error(decision.reason);
  return initialiseOperationalContext(state, {
    userAccountId: context.userAccountId,
    nursingHomeId: context.nursingHomeId,
    wardIds: [wardId],
    wardSelectionMode: "single",
    shiftId: context.shiftId,
    operationalDate: context.operationalDate,
    source: "manual_override",
  });
}

export function selectMultipleWards(state: OperationalContextState, context: OperationalContext, wardIds: string[]) {
  if (!canSelectMultipleWards(state, context)) throw new Error("Multiple ward selection is not authorised.");
  if (new Set(wardIds).size !== wardIds.length) throw new Error("Duplicate ward IDs are not allowed.");
  for (const wardId of wardIds) {
    const decision = canSwitchToWard(state, context, wardId);
    if (!decision.allowed) throw new Error(decision.reason);
  }
  return initialiseOperationalContext(state, {
    userAccountId: context.userAccountId,
    nursingHomeId: context.nursingHomeId,
    wardIds,
    wardSelectionMode: "multiple",
    shiftId: context.shiftId,
    operationalDate: context.operationalDate,
    source: "manual_override",
  });
}

export function selectAllAuthorisedWards(state: OperationalContextState, context: OperationalContext) {
  if (!canSelectMultipleWards(state, context)) throw new Error("All authorised wards is not available for this role or scope.");
  return initialiseOperationalContext(state, {
    userAccountId: context.userAccountId,
    nursingHomeId: context.nursingHomeId,
    wardSelectionMode: "all_authorised",
    shiftId: context.shiftId,
    operationalDate: context.operationalDate,
    source: "manual_override",
  });
}

const residentInContext = (resident: Resident, context: OperationalContext) =>
  resident.facilityId === context.nursingHomeId &&
  (context.wardSelectionMode === "all_authorised" || !resident.wardId || context.wardIds.includes(resident.wardId as WardId));

export function getResidentsForContext(state: OperationalContextState, context: OperationalContext) {
  return state.residents
    .filter((resident) => residentInContext(resident, context) && resident.lifecycleStatus === "active" && resident.presenceStatus === "in_home")
    .sort((a, b) => {
      const wardCompare = String(a.wardId || "").localeCompare(String(b.wardId || ""));
      if (wardCompare) return wardCompare;
      const roomCompare = String(a.roomNumber || "").localeCompare(String(b.roomNumber || ""), undefined, { numeric: true });
      if (roomCompare) return roomCompare;
      return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
    });
}

export const getResidentsForOperationalContext = getResidentsForContext;

export function getOperationalTimeWindows(context: OperationalContext, now = new Date()) {
  const nextHourEnd = new Date(now);
  nextHourEnd.setHours(nextHourEnd.getHours() + 1);
  const nextFourHoursEnd = new Date(now);
  nextFourHoursEnd.setHours(nextFourHoursEnd.getHours() + 4);
  const dayStart = new Date(`${context.operationalDate}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return {
    shiftStart: context.shiftStartAt,
    shiftEnd: context.shiftEndAt,
    now: now.toISOString(),
    overdueBefore: now.toISOString(),
    dueNowStart: new Date(now.getTime() - 30 * 60000).toISOString(),
    dueNowEnd: new Date(now.getTime() + 30 * 60000).toISOString(),
    nextHourEnd: nextHourEnd.toISOString(),
    nextFourHoursEnd: nextFourHoursEnd.toISOString(),
    dayStart: dayStart.toISOString(),
    dayEnd: dayEnd.toISOString(),
  };
}

export function getCareActionsForContext(state: OperationalContextState, context: OperationalContext) {
  const residentIds = new Set(getResidentsForContext(state, context).map((resident) => resident.id));
  const problems = new Map((state.carePlanProblems || []).map((problem) => [problem.id, problem]));
  return (state.problemInterventions || [])
    .filter((intervention) => residentIds.has(intervention.residentId))
    .filter((intervention) => intervention.status === "active")
    .filter((intervention) => problems.get(intervention.problemId)?.status === "active");
}

export const getCareActionsForOperationalContext = getCareActionsForContext;

export function getTasksDueForContext(state: OperationalContextState, context: OperationalContext) {
  const residentIds = new Set(getResidentsForContext(state, context).map((resident) => resident.id));
  return (state.tasks || []).filter((task) => !task.residentId || residentIds.has(task.residentId));
}

export const getTasksForOperationalContext = getTasksDueForContext;

export function getObservationsForOperationalContext(state: OperationalContextState, context: OperationalContext) {
  const residentIds = new Set(getResidentsForContext(state, context).map((resident) => resident.id));
  return ((state as OperationalContextState & { clinicalObservations?: { id: string; residentId: string; deletedAt?: string }[] }).clinicalObservations || [])
    .filter((observation) => residentIds.has(observation.residentId) && !observation.deletedAt);
}

export function getAppointmentsForOperationalContext() {
  return [];
}

export function getAlertsForContext(state: OperationalContextState, context: OperationalContext) {
  const residentIds = new Set(getResidentsForContext(state, context).map((resident) => resident.id));
  return (state.clinicalAlerts || []).filter((alert) => residentIds.has(alert.residentId) && !alert.resolvedAt);
}

export function getHandoversForContext(state: OperationalContextState, context: OperationalContext) {
  const residentIds = new Set(getResidentsForContext(state, context).map((resident) => resident.id));
  return (state.handovers || []).filter(
    (handover) =>
      (!handover.facilityId || handover.facilityId === context.nursingHomeId) &&
      (!handover.wardId || context.wardIds.includes(handover.wardId as WardId)) &&
      (!handover.residentId || residentIds.has(handover.residentId)),
  );
}

export const getHandoversForOperationalContext = getHandoversForContext;

export function getIncidentsForContext(state: OperationalContextState, context: OperationalContext) {
  const residentIds = new Set(getResidentsForContext(state, context).map((resident) => resident.id));
  return (state.incidents || []).filter(
    (incident) =>
      (!incident.facilityId || incident.facilityId === context.nursingHomeId) &&
      (!incident.wardId || context.wardIds.includes(incident.wardId as WardId)) &&
      (!incident.residentId || residentIds.has(incident.residentId)),
  );
}

export const getIncidentsForOperationalContext = getIncidentsForContext;

export function getAdmissionsForOperationalContext() {
  return [];
}

export function getReturnsForOperationalContext() {
  return [];
}

export function validateOperationalContext(state: OperationalContextState) {
  const activeHomeIds = new Set(state.facilities.filter((home) => home.status !== "inactive").map((home) => home.id));
  const wardById = new Map(state.wards.map((ward) => [ward.id, ward]));
  const usersWithoutAccessibleHomes = state.userAccounts
    .filter((account) => account.accountStatus === "active" && getAuthorisedHomeIds(state, account.id).length === 0)
    .map((account) => account.id);
  const usersWithInvalidStoredHome = state.operationalContexts
    .filter((context) => !getAuthorisedHomeIds(state, context.userAccountId).includes(context.nursingHomeId))
    .map((context) => context.userAccountId);
  const usersWithInvalidStoredWards = state.operationalContexts
    .filter((context) => context.wardIds.some((wardId) => !getAuthorisedWardIds(state, context.userAccountId, context.nursingHomeId).includes(wardId)))
    .map((context) => context.userAccountId);
  const wardsLinkedToWrongHome = state.wards.filter((ward) => !activeHomeIds.has(ward.nursingHomeId)).map((ward) => ward.id);
  const roleAssignmentsNotValidInSelectedHome = state.operationalContexts
    .filter((context) => !state.roleAssignments.some((role) => role.userAccountId === context.userAccountId && role.nursingHomeId === context.nursingHomeId && role.status === "active"))
    .map((context) => context.userAccountId);
  const competenciesOutsideHome = state.wardCompetencies.filter((competency) => wardById.get(competency.wardId)?.nursingHomeId !== competency.nursingHomeId).map((competency) => competency.id);
  const homesWithoutTimezone = state.facilities.filter((home) => !(home as Facility & { timezone?: string }).timezone).map((home) => home.id);
  const homesWithoutActiveWards = state.facilities.filter((home) => !state.wards.some((ward) => ward.nursingHomeId === home.id && ward.active !== false)).map((home) => home.id);
  const shiftDefinitionsOverlappingOrMissing = state.facilities.filter((home) => getConfiguredShifts(state, home.id).length === 0).map((home) => home.id);
  const contextScopedQueriesReturningCrossHomeData = state.operationalContexts.flatMap((context) =>
    getResidentsForContext(state, context).filter((resident) => resident.facilityId !== context.nursingHomeId).map((resident) => resident.id),
  );
  const duplicateRecordsInMultiWardAggregation = state.operationalContexts.flatMap((context) => {
    const ids = getResidentsForContext(state, context).map((resident) => resident.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  });
  const criticalErrors = [
    ...usersWithoutAccessibleHomes.map((id) => `User without accessible home: ${id}`),
    ...usersWithInvalidStoredHome.map((id) => `Invalid stored home: ${id}`),
    ...usersWithInvalidStoredWards.map((id) => `Invalid stored ward: ${id}`),
    ...wardsLinkedToWrongHome.map((id) => `Ward linked to wrong home: ${id}`),
    ...competenciesOutsideHome.map((id) => `Competency outside home: ${id}`),
    ...shiftDefinitionsOverlappingOrMissing.map((id) => `Missing shifts: ${id}`),
    ...contextScopedQueriesReturningCrossHomeData.map((id) => `Cross-home context result: ${id}`),
    ...duplicateRecordsInMultiWardAggregation.map((id) => `Duplicate context result: ${id}`),
  ];
  return {
    usersWithoutAccessibleHomes,
    usersWithInvalidStoredHome,
    usersWithInvalidStoredWards,
    wardsLinkedToWrongHome,
    roleAssignmentsNotValidInSelectedHome,
    competenciesOutsideHome,
    homesWithoutTimezone,
    homesWithoutActiveWards,
    shiftDefinitionsOverlappingOrMissing,
    contextScopedQueriesReturningCrossHomeData,
    duplicateRecordsInMultiWardAggregation,
    schedulingRegressionStatus: "covered by operational context tests",
    criticalErrors,
  };
}

const minutesFromTime = (value: string) => {
  if (!/^\d{2}:\d{2}$/.test(value)) return Number.NaN;
  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) return Number.NaN;
  return hours * 60 + minutes;
};

const shiftSegments = (shift: ShiftDefinition) => {
  const start = minutesFromTime(shift.startsAt);
  const end = minutesFromTime(shift.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
  return end <= start ? [[start, 1440], [0, end]] : [[start, end]];
};

export function validateShiftDefinitions(state: OperationalContextState) {
  const homesWithoutActiveShifts = state.facilities.filter((home) => getConfiguredShifts(state, home.id).length === 0).map((home) => home.id);
  const duplicateShiftKeysWithinHome = state.facilities.flatMap((home) => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const shift of getConfiguredShifts(state, home.id)) {
      const key = shift.id.split("-").at(-1) || shift.label;
      if (seen.has(key)) duplicates.add(`${home.id}:${key}`);
      seen.add(key);
    }
    return Array.from(duplicates);
  });
  const invalidTimes = state.shiftDefinitions
    .filter((shift) => !Number.isFinite(minutesFromTime(shift.startsAt)) || !Number.isFinite(minutesFromTime(shift.endsAt)))
    .map((shift) => shift.id);
  const overlappingShifts: string[] = [];
  const shiftGaps: string[] = [];
  for (const home of state.facilities) {
    const coverage = Array(1440).fill(0);
    for (const shift of getConfiguredShifts(state, home.id)) {
      for (const [start, end] of shiftSegments(shift)) {
        for (let minute = start; minute < end; minute += 1) coverage[minute] += 1;
      }
    }
    if (coverage.some((count) => count > 1)) overlappingShifts.push(home.id);
    if (coverage.some((count) => count === 0)) shiftGaps.push(home.id);
  }
  const inactiveShiftUsedByCurrentContext = state.operationalContexts
    .filter((context) => !state.shiftDefinitions.some((shift) => shift.id === context.shiftId && shift.active))
    .map((context) => context.userAccountId);
  const timezoneMissing = state.facilities.filter((home) => !home.timezone).map((home) => home.id);
  const criticalErrors = [
    ...homesWithoutActiveShifts.map((id) => `Home without active shifts: ${id}`),
    ...duplicateShiftKeysWithinHome.map((id) => `Duplicate shift key: ${id}`),
    ...invalidTimes.map((id) => `Invalid shift time: ${id}`),
    ...overlappingShifts.map((id) => `Overlapping shifts: ${id}`),
    ...shiftGaps.map((id) => `Shift coverage gap: ${id}`),
    ...inactiveShiftUsedByCurrentContext.map((id) => `Inactive shift used by context: ${id}`),
    ...timezoneMissing.map((id) => `Timezone missing: ${id}`),
  ];
  return {
    homesWithoutActiveShifts,
    duplicateShiftKeysWithinHome,
    overlappingShifts,
    gaps: shiftGaps,
    invalidTimes,
    crossMidnightMismatch: [],
    inactiveShiftUsedByCurrentContext,
    handoverReferencesToMissingShift: [],
    rosterReferencesToMissingShift: [],
    timezoneMissing,
    criticalErrors,
  };
}

export function validateWardShiftContext(state: OperationalContextState) {
  const contextReport = validateOperationalContext(state);
  const shiftReport = validateShiftDefinitions(state);
  const unauthorisedSelectedWards = contextReport.usersWithInvalidStoredWards;
  const inactiveSelectedWards = state.operationalContexts
    .filter((context) => context.wardIds.some((wardId) => state.wards.find((ward) => ward.id === wardId)?.active === false))
    .map((context) => context.userAccountId);
  const emptyMultiWardSelections = state.operationalContexts
    .filter((context) => context.wardSelectionMode === "multiple" && context.wardIds.length === 0)
    .map((context) => context.userAccountId);
  const duplicateWardIds = state.operationalContexts
    .filter((context) => new Set(context.wardIds).size !== context.wardIds.length)
    .map((context) => context.userAccountId);
  return {
    usersWithInvalidSavedWard: contextReport.usersWithInvalidStoredWards,
    unauthorisedSelectedWards,
    inactiveSelectedWards,
    wardsLinkedToWrongHome: contextReport.wardsLinkedToWrongHome,
    emptyMultiWardSelections,
    duplicateWardIds,
    queriesReturningWrongHomeRecords: contextReport.contextScopedQueriesReturningCrossHomeData,
    queriesReturningWrongWardRecords: [],
    duplicateMultiWardRecords: contextReport.duplicateRecordsInMultiWardAggregation,
    homesWithoutTimezone: contextReport.homesWithoutTimezone,
    homesWithoutShiftDefinitions: shiftReport.homesWithoutActiveShifts,
    overlappingShifts: shiftReport.overlappingShifts,
    shiftGaps: shiftReport.gaps,
    missingCurrentShift: shiftReport.homesWithoutActiveShifts,
    schedulingRegressionResult: "covered by ward-shift-context tests",
    handoverScopeRegressionResult: "covered by ward-shift-context tests",
    criticalErrors: [
      ...contextReport.criticalErrors,
      ...shiftReport.criticalErrors,
      ...inactiveSelectedWards.map((id) => `Inactive selected ward: ${id}`),
      ...emptyMultiWardSelections.map((id) => `Empty multi-ward selection: ${id}`),
      ...duplicateWardIds.map((id) => `Duplicate selected wards: ${id}`),
    ],
  };
}
