import type {
  AbsenceEpisode,
  Admission,
  AdmissionType,
  BedAssignment,
  Resident,
  ResidentLifecycleStatus,
  ResidentPresenceStatus,
} from "./types";
import {
  asAbsenceEpisodeId,
  asAdmissionId,
  asBedAssignmentId,
  asNursingHomeId,
  asRoomId,
  type AbsenceEpisodeId,
  type AdmissionId,
  type BedId,
  type NursingHomeId,
  type RoomId,
  type WardId,
} from "@/types/entityIds";
import {
  getBedById,
  getResidentCurrentPlacement,
  getRoomById,
  getWardById,
  type EntityHierarchyState,
} from "./entityHierarchy";

const MIGRATION_TIMESTAMP = "2026-07-13T00:00:00.000Z";

export interface ResidentLifecycleState extends EntityHierarchyState {
  admissions: Admission[];
  absenceEpisodes: AbsenceEpisode[];
}

export interface LifecycleTransitionResult<T extends ResidentLifecycleState> {
  ok: boolean;
  store: T;
  error?: string;
}

export const admissionTypeFromLegacy = (resident: Resident): AdmissionType => {
  if (resident.admissionType) return resident.admissionType;
  if (resident.residentType === "active_respite" || resident.residentType === "inactive_respite") return "respite";
  return "long_term";
};

export const lifecycleStatusFromLegacy = (resident: Resident): ResidentLifecycleStatus => {
  if (resident.lifecycleStatus) return resident.lifecycleStatus;
  if (resident.status === "deceased") return "deceased";
  if (resident.status === "discharged") return "discharged";
  if (resident.status === "deleted") return "inactive";
  if (resident.status === "active") {
    if (resident.residentType === "inactive" || resident.residentType === "inactive_respite") return "inactive";
    return "active";
  }
  return "inactive";
};

export const presenceStatusFromLegacy = (resident: Resident): ResidentPresenceStatus => {
  if (resident.presenceStatus) return resident.presenceStatus;
  return lifecycleStatusFromLegacy(resident) === "active" ? "in_home" : "unknown";
};

export function getResidentLifecycleStatus(resident: Resident): ResidentLifecycleStatus {
  return lifecycleStatusFromLegacy(resident);
}

export function getResidentAdmissionType(resident: Resident): AdmissionType {
  return admissionTypeFromLegacy(resident);
}

export function getResidentPresenceStatus(resident: Resident): ResidentPresenceStatus {
  return presenceStatusFromLegacy(resident);
}

export function getResidentDisplayStatus(resident: Resident) {
  const lifecycle = getResidentLifecycleStatus(resident);
  const admissionType = getResidentAdmissionType(resident);
  const presence = getResidentPresenceStatus(resident);
  if (lifecycle === "pre_admission") return "Pre-Admission";
  if (lifecycle === "admission_scheduled") return "Admission Scheduled";
  if (lifecycle === "discharged") return "Discharged";
  if (lifecycle === "deceased") return "Deceased";
  if (lifecycle === "inactive") return "Inactive";
  if (presence === "temporarily_absent") return "Temporarily Absent";
  if (presence === "in_hospital") return "Hospital Transfer";
  if (admissionType === "respite") return "Active Respite";
  return "Active Long-Term";
}

export function isResidentActive(resident: Resident) {
  return getResidentLifecycleStatus(resident) === "active";
}

export function isResidentInHome(resident: Resident) {
  return isResidentActive(resident) && getResidentPresenceStatus(resident) === "in_home";
}

export function isResidentRespite(resident: Resident) {
  return getResidentAdmissionType(resident) === "respite";
}

export function isResidentEligibleForInHomeWork(resident: Resident) {
  return isResidentInHome(resident);
}

export function isResidentOccupyingBed(state: ResidentLifecycleState, residentId: string) {
  const resident = state.residents.find((item) => item.id === residentId);
  if (!resident || !isResidentInHome(resident)) return false;
  return !!getResidentCurrentBedAssignment(state, residentId);
}

const defaultAdmissionId = (residentId: string) => asAdmissionId(`admission-${residentId}-initial`);
const defaultAbsenceId = (residentId: string, type: string, at: string) =>
  asAbsenceEpisodeId(`absence-${residentId}-${type}-${at.slice(0, 10)}`);

export function migrateResidentLifecycle<T extends ResidentLifecycleState>(source: T): T {
  const existingAdmissionIds = new Set((source.admissions || []).map((admission) => admission.id));
  const admissions = [...(source.admissions || [])];
  const residents = source.residents.map((resident) => {
    const lifecycleStatus = lifecycleStatusFromLegacy(resident);
    const admissionType = admissionTypeFromLegacy(resident);
    const presenceStatus = presenceStatusFromLegacy(resident);
    let currentAdmissionId = resident.currentAdmissionId;

    if (lifecycleStatus === "active") {
      const admissionId = currentAdmissionId || defaultAdmissionId(resident.id);
      if (!existingAdmissionIds.has(admissionId)) {
        admissions.push({
          id: admissionId,
          residentId: resident.id,
          nursingHomeId: asNursingHomeId(resident.facilityId || source.facilities[0]?.id || ""),
          admissionType,
          status: "active",
          admissionDate: resident.admissionDate,
          admittedFrom:
            resident.admissionSource === "another_care_home"
              ? "another_care_home"
              : resident.admissionSource || undefined,
          expectedEndDate: resident.expectedDischargeDate,
          createdAt: resident.admissionDate
            ? `${resident.admissionDate}T00:00:00.000Z`
            : MIGRATION_TIMESTAMP,
          updatedAt: MIGRATION_TIMESTAMP,
          createdBy: "System (migration)",
        });
        existingAdmissionIds.add(admissionId);
      }
      currentAdmissionId = admissionId;
    }

    return {
      ...resident,
      lifecycleStatus,
      admissionType,
      presenceStatus,
      currentAdmissionId,
      lifecycleUpdatedAt: resident.lifecycleUpdatedAt || MIGRATION_TIMESTAMP,
    };
  });

  const admissionByResident = new Map(admissions.map((admission) => [admission.residentId, admission]));
  const bedAssignments = (source.bedAssignments || []).map((assignment) => {
    const placement = getResidentCurrentPlacement({ ...source, residents, admissions, absenceEpisodes: source.absenceEpisodes || [] }, assignment.residentId);
    return {
      ...assignment,
      admissionId: assignment.admissionId || admissionByResident.get(assignment.residentId)?.id,
      wardId: assignment.wardId || placement?.ward?.id,
      roomId: assignment.roomId || placement?.room?.id,
      startDateTime: assignment.startDateTime || `${assignment.startDate || MIGRATION_TIMESTAMP.slice(0, 10)}T00:00:00.000Z`,
      reason: assignment.reason || "admission",
    };
  });

  return {
    ...source,
    residents,
    admissions,
    bedAssignments,
    absenceEpisodes: source.absenceEpisodes || [],
  };
}

export function getActiveAdmission(state: ResidentLifecycleState, residentId: string) {
  return state.admissions.find((admission) => admission.residentId === residentId && admission.status === "active");
}

export function getResidentCurrentBedAssignment(state: ResidentLifecycleState, residentId: string) {
  const activeAdmission = getActiveAdmission(state, residentId);
  return state.bedAssignments.find(
    (assignment) =>
      assignment.residentId === residentId &&
      assignment.status === "active" &&
      !assignment.endDateTime &&
      (!activeAdmission || !assignment.admissionId || assignment.admissionId === activeAdmission.id) &&
      (!activeAdmission || assignment.nursingHomeId === activeAdmission.nursingHomeId),
  );
}

export function getResidentBedAssignmentHistory(state: ResidentLifecycleState, residentId: string) {
  return state.bedAssignments
    .filter((assignment) => assignment.residentId === residentId)
    .map((assignment) => {
      const bed = getBedById(state, assignment.bedId);
      const room = assignment.roomId ? getRoomById(state, assignment.roomId) : bed ? getRoomById(state, bed.roomId) : undefined;
      const ward = assignment.wardId ? getWardById(state, assignment.wardId) : room?.wardId ? getWardById(state, room.wardId) : undefined;
      const start = assignment.startDateTime || `${assignment.startDate}T00:00:00.000Z`;
      const end = assignment.endDateTime || assignment.endDate;
      return {
        assignment,
        nursingHomeId: assignment.nursingHomeId,
        ward,
        room,
        bed,
        start,
        end,
        durationDays: end ? Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 86400000)) : undefined,
        moveReason: assignment.reason || assignment.assignmentReason,
        recordedBy: assignment.createdBy,
      };
    })
    .sort((a, b) => b.start.localeCompare(a.start));
}

export function getActiveAbsence(state: ResidentLifecycleState, residentId: string) {
  return state.absenceEpisodes.find((absence) => absence.residentId === residentId && absence.status === "active");
}

export function getCurrentResidents(state: ResidentLifecycleState) {
  return state.residents.filter(isResidentInHome);
}

export function getActiveLongTermResidents(state: ResidentLifecycleState) {
  return state.residents.filter((resident) => isResidentInHome(resident) && getResidentAdmissionType(resident) === "long_term");
}

export function getActiveRespiteResidents(state: ResidentLifecycleState) {
  return state.residents.filter((resident) => isResidentInHome(resident) && getResidentAdmissionType(resident) === "respite");
}

export function getTemporarilyAbsentResidents(state: ResidentLifecycleState) {
  return state.residents.filter((resident) => getResidentLifecycleStatus(resident) === "active" && getResidentPresenceStatus(resident) === "temporarily_absent");
}

export function getHospitalTransferResidents(state: ResidentLifecycleState) {
  return state.residents.filter((resident) => getResidentLifecycleStatus(resident) === "active" && getResidentPresenceStatus(resident) === "in_hospital");
}

export function getInactiveResidents(state: ResidentLifecycleState) {
  return state.residents.filter((resident) => ["inactive", "discharged", "deceased"].includes(getResidentLifecycleStatus(resident)));
}

export function getPreAdmissionRecords(state: ResidentLifecycleState) {
  return state.residents.filter((resident) => getResidentLifecycleStatus(resident) === "pre_admission");
}

export function getScheduledAdmissions(state: ResidentLifecycleState) {
  return state.admissions.filter((admission) => admission.status === "scheduled");
}

export function getOccupancyByNursingHome(state: ResidentLifecycleState, nursingHomeId: NursingHomeId | string) {
  const beds = state.beds.filter((bed) => {
    const room = getRoomById(state, bed.roomId);
    return (room?.nursingHomeId || room?.facilityId) === nursingHomeId && bed.active;
  });
  const occupiedBedIds = new Set(
    state.residents
      .filter((resident) => isResidentOccupyingBed(state, resident.id))
      .map((resident) => getResidentCurrentBedAssignment(state, resident.id)?.bedId)
      .filter(Boolean),
  );
  return {
    nursingHomeId,
    totalBeds: beds.length,
    occupiedBeds: beds.filter((bed) => occupiedBedIds.has(bed.id)).length,
    availableBeds: beds.filter((bed) => !occupiedBedIds.has(bed.id)).length,
  };
}

export function getOccupancyByWard(state: ResidentLifecycleState, wardId: WardId | string) {
  const roomIds = new Set(state.rooms.filter((room) => room.wardId === wardId).map((room) => room.id));
  const beds = state.beds.filter((bed) => roomIds.has(bed.roomId) && bed.active);
  const occupiedBedIds = new Set(
    state.residents
      .filter((resident) => isResidentOccupyingBed(state, resident.id))
      .map((resident) => getResidentCurrentBedAssignment(state, resident.id)?.bedId)
      .filter(Boolean),
  );
  return {
    wardId,
    totalBeds: beds.length,
    occupiedBeds: beds.filter((bed) => occupiedBedIds.has(bed.id)).length,
    availableBeds: beds.filter((bed) => !occupiedBedIds.has(bed.id)).length,
  };
}

function endActiveBedAssignment<T extends ResidentLifecycleState>(
  store: T,
  residentId: string,
  at: string,
  endedReason: NonNullable<BedAssignment["endedReason"]>,
) {
  return {
    ...store,
    bedAssignments: store.bedAssignments.map((assignment) =>
      assignment.residentId === residentId && assignment.status === "active"
        ? { ...assignment, status: "ended" as const, endDateTime: at, endDate: at.slice(0, 10), endedReason, updatedAt: at }
        : assignment,
    ),
  };
}

export function startTemporaryAbsence<T extends ResidentLifecycleState>(
  store: T,
  residentId: string,
  input: { startDateTime: string; expectedReturnDateTime?: string; destination?: string; reason?: string; bedHeld: boolean; userId?: string },
): LifecycleTransitionResult<T> {
  const resident = store.residents.find((item) => item.id === residentId);
  const admission = getActiveAdmission(store, residentId);
  if (!resident || getResidentLifecycleStatus(resident) !== "active" || !admission) {
    return { ok: false, store, error: "Resident must have an active admission before absence can start." };
  }
  if (getActiveAbsence(store, residentId)) return { ok: false, store, error: "Resident already has an active absence." };
  const heldAssignment = getResidentCurrentBedAssignment(store, residentId);
  let next = {
    ...store,
    residents: store.residents.map((item) =>
      item.id === residentId
        ? { ...item, presenceStatus: "temporarily_absent" as const, lifecycleUpdatedAt: input.startDateTime }
        : item,
    ),
    absenceEpisodes: [
      {
        id: defaultAbsenceId(residentId, "temporary_leave", input.startDateTime),
        residentId,
        admissionId: admission.id,
        nursingHomeId: admission.nursingHomeId,
        type: "temporary_leave" as const,
        status: "active" as const,
        startDateTime: input.startDateTime,
        expectedReturnDateTime: input.expectedReturnDateTime,
        destination: input.destination,
        reason: input.reason,
        bedHeld: input.bedHeld,
        heldBedAssignmentId: heldAssignment?.id,
        createdAt: input.startDateTime,
        updatedAt: input.startDateTime,
        createdBy: input.userId,
      },
      ...store.absenceEpisodes,
    ],
  } as T;
  if (!input.bedHeld) next = endActiveBedAssignment(next, residentId, input.startDateTime, "temporary_absence") as T;
  return { ok: true, store: next };
}

export function startHospitalTransfer<T extends ResidentLifecycleState>(
  store: T,
  residentId: string,
  input: { startDateTime: string; destination?: string; reason?: string; bedHeld: boolean; userId?: string },
): LifecycleTransitionResult<T> {
  const result = startTemporaryAbsence(store, residentId, { ...input, expectedReturnDateTime: undefined });
  if (!result.ok) return result;
  return {
    ok: true,
    store: {
      ...result.store,
      residents: result.store.residents.map((item) =>
        item.id === residentId ? { ...item, presenceStatus: "in_hospital" as const } : item,
      ),
      absenceEpisodes: result.store.absenceEpisodes.map((absence, index) =>
        index === 0 && absence.residentId === residentId
          ? { ...absence, type: "hospital_transfer" as const }
          : absence,
      ),
    },
  };
}

export function returnResidentFromAbsence<T extends ResidentLifecycleState>(
  store: T,
  absenceEpisodeId: AbsenceEpisodeId | string,
  input: { actualReturnDateTime: string; bedId?: BedId; roomId?: RoomId; wardId?: WardId; userId?: string },
): LifecycleTransitionResult<T> {
  const absence = store.absenceEpisodes.find((item) => item.id === absenceEpisodeId);
  if (!absence || absence.status !== "active") return { ok: false, store, error: "Active absence not found." };
  const resident = store.residents.find((item) => item.id === absence.residentId);
  if (!resident || getResidentLifecycleStatus(resident) !== "active") return { ok: false, store, error: "Resident is not active." };

  let bedAssignments = store.bedAssignments;
  const activeAssignment = getResidentCurrentBedAssignment(store, absence.residentId);
  if (!activeAssignment && absence.heldBedAssignmentId) {
    const held = store.bedAssignments.find((assignment) => assignment.id === absence.heldBedAssignmentId);
    if (held) {
      bedAssignments = bedAssignments.map((assignment) =>
        assignment.id === held.id
          ? { ...assignment, status: "active" as const, endDate: undefined, endDateTime: undefined, reason: "return_from_absence" as const, updatedAt: input.actualReturnDateTime }
          : assignment,
      );
    }
  } else if (!activeAssignment && input.bedId) {
    const bed = getBedById(store, input.bedId);
    const room = input.roomId ? getRoomById(store, input.roomId) : bed ? getRoomById(store, bed.roomId) : undefined;
    const ward = input.wardId ? getWardById(store, input.wardId) : room?.wardId ? getWardById(store, room.wardId) : undefined;
    bedAssignments = [
      {
        id: asBedAssignmentId(`bed-assignment-${absence.residentId}-${Date.parse(input.actualReturnDateTime)}`),
        residentId: absence.residentId,
        admissionId: absence.admissionId,
        nursingHomeId: absence.nursingHomeId,
        wardId: ward?.id,
        roomId: room?.id,
        bedId: input.bedId,
        startDate: input.actualReturnDateTime.slice(0, 10),
        startDateTime: input.actualReturnDateTime,
        status: "active",
        reason: "return_from_absence",
        createdAt: input.actualReturnDateTime,
        updatedAt: input.actualReturnDateTime,
        createdBy: input.userId,
      },
      ...bedAssignments,
    ];
  }

  return {
    ok: true,
    store: {
      ...store,
      residents: store.residents.map((item) =>
        item.id === absence.residentId
          ? { ...item, presenceStatus: "in_home" as const, lifecycleUpdatedAt: input.actualReturnDateTime }
          : item,
      ),
      absenceEpisodes: store.absenceEpisodes.map((item) =>
        item.id === absenceEpisodeId
          ? { ...item, status: "returned" as const, actualReturnDateTime: input.actualReturnDateTime, updatedAt: input.actualReturnDateTime, updatedBy: input.userId }
          : item,
      ),
      bedAssignments,
    },
  };
}

export function dischargeResident<T extends ResidentLifecycleState>(
  store: T,
  residentId: string,
  input: { actualEndDate: string; reason?: string; destination?: string; userId?: string },
): LifecycleTransitionResult<T> {
  const admission = getActiveAdmission(store, residentId);
  if (!admission) return { ok: false, store, error: "Active admission required for discharge." };
  const at = `${input.actualEndDate}T00:00:00.000Z`;
  const next = endActiveBedAssignment(store, residentId, at, "discharge");
  return {
    ok: true,
    store: {
      ...next,
      residents: next.residents.map((resident) =>
        resident.id === residentId
          ? {
              ...resident,
              lifecycleStatus: "discharged" as const,
              presenceStatus: "unknown" as const,
              status: "discharged" as const,
              residentType: resident.admissionType === "respite" ? "inactive_respite" : "inactive",
              dischargeDate: input.actualEndDate,
              dischargeReason: input.reason,
              dischargeDestination: input.destination,
              lifecycleUpdatedAt: at,
            }
          : resident,
      ),
      admissions: next.admissions.map((item) =>
        item.id === admission.id
          ? { ...item, status: "completed" as const, actualEndDate: input.actualEndDate, dischargeReason: input.reason, dischargeDestination: input.destination, updatedAt: at, updatedBy: input.userId }
          : item,
      ),
      absenceEpisodes: next.absenceEpisodes.map((absence) =>
        absence.residentId === residentId && absence.status === "active"
          ? { ...absence, status: "converted_to_discharge" as const, updatedAt: at, updatedBy: input.userId }
          : absence,
      ),
    },
  };
}

export function markResidentDeceased<T extends ResidentLifecycleState>(
  store: T,
  residentId: string,
  input: { deceasedDate: string; placeOfDeath?: string; userId?: string },
): LifecycleTransitionResult<T> {
  const admission = getActiveAdmission(store, residentId);
  const at = `${input.deceasedDate}T00:00:00.000Z`;
  const next = endActiveBedAssignment(store, residentId, at, "deceased");
  return {
    ok: true,
    store: {
      ...next,
      residents: next.residents.map((resident) =>
        resident.id === residentId
          ? { ...resident, lifecycleStatus: "deceased" as const, presenceStatus: "unknown" as const, status: "deceased" as const, deceasedDate: input.deceasedDate, placeOfDeath: input.placeOfDeath, lifecycleUpdatedAt: at }
          : resident,
      ),
      admissions: next.admissions.map((item) =>
        admission && item.id === admission.id
          ? { ...item, status: "completed" as const, actualEndDate: input.deceasedDate, dischargeReason: "deceased", updatedAt: at, updatedBy: input.userId }
          : item,
      ),
      absenceEpisodes: next.absenceEpisodes.map((absence) =>
        absence.residentId === residentId && absence.status === "active"
          ? { ...absence, status: "cancelled" as const, updatedAt: at, updatedBy: input.userId }
          : absence,
      ),
    },
  };
}

export function moveResidentBed<T extends ResidentLifecycleState>(
  store: T,
  residentId: string,
  input: { bedId: BedId; startDateTime: string; reason?: BedAssignment["reason"]; userId?: string },
): LifecycleTransitionResult<T> {
  const resident = store.residents.find((item) => item.id === residentId);
  const admission = getActiveAdmission(store, residentId);
  const bed = getBedById(store, input.bedId);
  const room = bed ? getRoomById(store, bed.roomId) : undefined;
  const ward = room?.wardId ? getWardById(store, room.wardId) : undefined;
  if (!resident || !admission || !bed || !room) return { ok: false, store, error: "Resident, active admission, bed, and room are required." };
  if ((room.nursingHomeId || room.facilityId) !== admission.nursingHomeId) return { ok: false, store, error: "Cannot assign resident to bed in another nursing home." };
  const occupied = store.bedAssignments.some((assignment) => assignment.bedId === input.bedId && assignment.status === "active" && assignment.residentId !== residentId);
  if (occupied) return { ok: false, store, error: "Bed already has an active resident assignment." };
  const ended = endActiveBedAssignment(store, residentId, input.startDateTime, input.reason === "room_move" ? "room_move" : "other");
  return {
    ok: true,
    store: {
      ...ended,
      residents: ended.residents.map((item) =>
        item.id === residentId
          ? { ...item, roomId: room.id, roomNumber: room.roomNumber || room.number, wingId: room.wingId, unitId: room.unitId }
          : item,
      ),
      bedAssignments: [
        {
          id: asBedAssignmentId(`bed-assignment-${residentId}-${Date.parse(input.startDateTime)}`),
          residentId,
          admissionId: admission.id,
          nursingHomeId: admission.nursingHomeId,
          wardId: ward?.id,
          roomId: asRoomId(String(room.id)),
          bedId: input.bedId,
          startDate: input.startDateTime.slice(0, 10),
          startDateTime: input.startDateTime,
          status: "active",
          reason: input.reason || "bed_move",
          createdAt: input.startDateTime,
          updatedAt: input.startDateTime,
          createdBy: input.userId,
        },
        ...ended.bedAssignments,
      ],
    },
  };
}

export interface ResidentLifecycleValidationReport {
  totalResidents: number;
  countByLifecycleStatus: Record<string, number>;
  countByAdmissionType: Record<string, number>;
  countByPresenceStatus: Record<string, number>;
  activeResidentsWithoutActiveAdmission: string[];
  activeInHomeResidentsWithoutPlacement: string[];
  dischargedResidentsWithActiveBeds: string[];
  deceasedResidentsWithActiveAdmission: string[];
  residentsWithMultipleActiveAdmissions: string[];
  residentsWithMultipleActiveBeds: string[];
  residentsWithMultipleActiveAbsences: string[];
  activeInHospitalResidentsWithoutTransferEpisode: string[];
  crossHomeAssignmentMismatches: string[];
  ambiguousLegacyRecordsRequiringReview: string[];
  unchangedClinicalRecordCounts?: Record<string, string>;
  criticalErrors: string[];
}

const countBy = (values: string[]) =>
  values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

export function validateResidentLifecycle(
  state: ResidentLifecycleState,
  unchangedClinicalRecordCounts?: Record<string, string>,
): ResidentLifecycleValidationReport {
  const activeAdmissionsByResident = new Map<string, number>();
  const activeBedsByResident = new Map<string, number>();
  const activeAbsencesByResident = new Map<string, number>();
  for (const admission of state.admissions.filter((item) => item.status === "active")) {
    activeAdmissionsByResident.set(admission.residentId, (activeAdmissionsByResident.get(admission.residentId) || 0) + 1);
  }
  for (const assignment of state.bedAssignments.filter((item) => item.status === "active" && !item.endDateTime)) {
    activeBedsByResident.set(assignment.residentId, (activeBedsByResident.get(assignment.residentId) || 0) + 1);
  }
  for (const absence of state.absenceEpisodes.filter((item) => item.status === "active")) {
    activeAbsencesByResident.set(absence.residentId, (activeAbsencesByResident.get(absence.residentId) || 0) + 1);
  }

  const activeResidentsWithoutActiveAdmission = state.residents
    .filter((resident) => getResidentLifecycleStatus(resident) === "active" && !getActiveAdmission(state, resident.id))
    .map((resident) => resident.id);
  const activeInHomeResidentsWithoutPlacement = state.residents
    .filter((resident) => isResidentInHome(resident) && !getResidentCurrentBedAssignment(state, resident.id))
    .map((resident) => resident.id);
  const dischargedResidentsWithActiveBeds = state.residents
    .filter((resident) => getResidentLifecycleStatus(resident) === "discharged" && !!getResidentCurrentBedAssignment(state, resident.id))
    .map((resident) => resident.id);
  const deceasedResidentsWithActiveAdmission = state.residents
    .filter((resident) => getResidentLifecycleStatus(resident) === "deceased" && !!getActiveAdmission(state, resident.id))
    .map((resident) => resident.id);
  const activeInHospitalResidentsWithoutTransferEpisode = state.residents
    .filter((resident) => {
      const absence = getActiveAbsence(state, resident.id);
      return getResidentLifecycleStatus(resident) === "active" && getResidentPresenceStatus(resident) === "in_hospital" && absence?.type !== "hospital_transfer";
    })
    .map((resident) => resident.id);
  const crossHomeAssignmentMismatches = state.bedAssignments
    .filter((assignment) => {
      const resident = state.residents.find((item) => item.id === assignment.residentId);
      return resident?.facilityId && resident.facilityId !== assignment.nursingHomeId;
    })
    .map((assignment) => String(assignment.id));
  const ambiguousLegacyRecordsRequiringReview = state.residents
    .filter((resident) => resident.residentType === "inactive_respite" && !resident.dischargeDate)
    .map((resident) => resident.id);

  const report: ResidentLifecycleValidationReport = {
    totalResidents: state.residents.length,
    countByLifecycleStatus: countBy(state.residents.map(getResidentLifecycleStatus)),
    countByAdmissionType: countBy(state.residents.map(getResidentAdmissionType)),
    countByPresenceStatus: countBy(state.residents.map(getResidentPresenceStatus)),
    activeResidentsWithoutActiveAdmission,
    activeInHomeResidentsWithoutPlacement,
    dischargedResidentsWithActiveBeds,
    deceasedResidentsWithActiveAdmission,
    residentsWithMultipleActiveAdmissions: Array.from(activeAdmissionsByResident.entries()).filter(([, count]) => count > 1).map(([id]) => id),
    residentsWithMultipleActiveBeds: Array.from(activeBedsByResident.entries()).filter(([, count]) => count > 1).map(([id]) => id),
    residentsWithMultipleActiveAbsences: Array.from(activeAbsencesByResident.entries()).filter(([, count]) => count > 1).map(([id]) => id),
    activeInHospitalResidentsWithoutTransferEpisode,
    crossHomeAssignmentMismatches,
    ambiguousLegacyRecordsRequiringReview,
    unchangedClinicalRecordCounts,
    criticalErrors: [],
  };

  report.criticalErrors = [
    ...report.activeResidentsWithoutActiveAdmission.map((id) => `Active resident without active admission: ${id}`),
    ...report.activeInHomeResidentsWithoutPlacement.map((id) => `Active in-home resident without placement: ${id}`),
    ...report.dischargedResidentsWithActiveBeds.map((id) => `Discharged resident with active bed: ${id}`),
    ...report.deceasedResidentsWithActiveAdmission.map((id) => `Deceased resident with active admission: ${id}`),
    ...report.residentsWithMultipleActiveAdmissions.map((id) => `Multiple active admissions: ${id}`),
    ...report.residentsWithMultipleActiveBeds.map((id) => `Multiple active beds: ${id}`),
    ...report.residentsWithMultipleActiveAbsences.map((id) => `Multiple active absences: ${id}`),
    ...report.activeInHospitalResidentsWithoutTransferEpisode.map((id) => `In-hospital resident without transfer episode: ${id}`),
    ...report.crossHomeAssignmentMismatches.map((id) => `Cross-home assignment mismatch: ${id}`),
  ];

  return report;
}
