import {
  BALLYMORE_FACILITY_ID,
  HAZELWOOD_FACILITY_ID,
  createFixture,
  makeResidents,
  makeRooms,
  migrateFixture,
} from "./entity-hierarchy-fixture.mjs";

export { BALLYMORE_FACILITY_ID, HAZELWOOD_FACILITY_ID, createFixture, makeResidents, makeRooms };

export const lifecycleOf = (resident) => {
  if (resident.lifecycleStatus) return resident.lifecycleStatus;
  if (resident.status === "deceased") return "deceased";
  if (resident.status === "discharged") return "discharged";
  if (resident.status === "active" && !["inactive", "inactive_respite"].includes(resident.residentType || "")) return "active";
  return "inactive";
};

export const admissionTypeOf = (resident) =>
  resident.admissionType || (["active_respite", "inactive_respite"].includes(resident.residentType || "") ? "respite" : "long_term");

export const presenceOf = (resident) =>
  resident.presenceStatus || (lifecycleOf(resident) === "active" ? "in_home" : "unknown");

export const displayStatus = (resident) => {
  const lifecycle = lifecycleOf(resident);
  const presence = presenceOf(resident);
  if (lifecycle === "pre_admission") return "Pre-Admission";
  if (lifecycle === "admission_scheduled") return "Admission Scheduled";
  if (lifecycle === "discharged") return "Discharged";
  if (lifecycle === "deceased") return "Deceased";
  if (lifecycle === "inactive") return "Inactive";
  if (presence === "temporarily_absent") return "Temporarily Absent";
  if (presence === "in_hospital") return "Hospital Transfer";
  return admissionTypeOf(resident) === "respite" ? "Active Respite" : "Active Long-Term";
};

export const eligibleForInHomeWork = (resident) => lifecycleOf(resident) === "active" && presenceOf(resident) === "in_home";

export function migrateLifecycle(source) {
  const state = migrateFixture(source);
  const admissions = [...(state.admissions || [])];
  const admissionIds = new Set(admissions.map((item) => item.id));
  const residents = state.residents.map((resident) => {
    const lifecycleStatus = lifecycleOf(resident);
    const admissionType = admissionTypeOf(resident);
    const presenceStatus = presenceOf(resident);
    const currentAdmissionId = lifecycleStatus === "active" ? resident.currentAdmissionId || `admission-${resident.id}-initial` : resident.currentAdmissionId;
    if (lifecycleStatus === "active" && currentAdmissionId && !admissionIds.has(currentAdmissionId)) {
      admissions.push({
        id: currentAdmissionId,
        residentId: resident.id,
        nursingHomeId: resident.facilityId || BALLYMORE_FACILITY_ID,
        admissionType,
        status: "active",
        admissionDate: resident.admissionDate,
        admittedFrom: resident.admissionSource || undefined,
      });
      admissionIds.add(currentAdmissionId);
    }
    return { ...resident, lifecycleStatus, admissionType, presenceStatus, currentAdmissionId };
  });
  const bedAssignments = state.bedAssignments.map((assignment) => ({
    ...assignment,
    admissionId: admissions.find((admission) => admission.residentId === assignment.residentId)?.id,
    roomId: assignment.roomId || state.beds.find((bed) => bed.id === assignment.bedId)?.roomId,
    startDateTime: assignment.startDateTime || `${assignment.startDate}T00:00:00.000Z`,
    reason: assignment.reason || "admission",
  }));
  return { ...state, residents, admissions, bedAssignments, absenceEpisodes: state.absenceEpisodes || [] };
}

export const activeAdmission = (state, residentId) =>
  state.admissions.find((admission) => admission.residentId === residentId && admission.status === "active");

export const activeBedAssignment = (state, residentId) =>
  state.bedAssignments.find((assignment) => assignment.residentId === residentId && assignment.status === "active" && !assignment.endDateTime);

export const activeAbsence = (state, residentId) =>
  state.absenceEpisodes.find((absence) => absence.residentId === residentId && absence.status === "active");

const endBed = (state, residentId, at, endedReason) => ({
  ...state,
  bedAssignments: state.bedAssignments.map((assignment) =>
    assignment.residentId === residentId && assignment.status === "active"
      ? { ...assignment, status: "ended", endDateTime: at, endedReason }
      : assignment,
  ),
});

export function startTemporaryAbsence(state, residentId, { at, bedHeld }) {
  const admission = activeAdmission(state, residentId);
  if (!admission || activeAbsence(state, residentId)) return { ok: false, state, error: "invalid absence" };
  const currentBed = activeBedAssignment(state, residentId);
  let next = {
    ...state,
    residents: state.residents.map((resident) =>
      resident.id === residentId ? { ...resident, presenceStatus: "temporarily_absent" } : resident,
    ),
    absenceEpisodes: [{
      id: `absence-${residentId}-temporary_leave-${at.slice(0, 10)}`,
      residentId,
      admissionId: admission.id,
      nursingHomeId: admission.nursingHomeId,
      type: "temporary_leave",
      status: "active",
      startDateTime: at,
      bedHeld,
      heldBedAssignmentId: currentBed?.id,
    }, ...state.absenceEpisodes],
  };
  if (!bedHeld) next = endBed(next, residentId, at, "temporary_absence");
  return { ok: true, state: next };
}

export function startHospitalTransfer(state, residentId, { at, bedHeld }) {
  const result = startTemporaryAbsence(state, residentId, { at, bedHeld });
  if (!result.ok) return result;
  return {
    ok: true,
    state: {
      ...result.state,
      residents: result.state.residents.map((resident) =>
        resident.id === residentId ? { ...resident, presenceStatus: "in_hospital" } : resident,
      ),
      absenceEpisodes: result.state.absenceEpisodes.map((absence, index) =>
        index === 0 ? { ...absence, type: "hospital_transfer" } : absence,
      ),
    },
  };
}

export function returnFromAbsence(state, absenceId, at) {
  const absence = state.absenceEpisodes.find((item) => item.id === absenceId && item.status === "active");
  if (!absence) return { ok: false, state, error: "absence not found" };
  return {
    ok: true,
    state: {
      ...state,
      residents: state.residents.map((resident) =>
        resident.id === absence.residentId ? { ...resident, presenceStatus: "in_home" } : resident,
      ),
      absenceEpisodes: state.absenceEpisodes.map((item) =>
        item.id === absenceId ? { ...item, status: "returned", actualReturnDateTime: at } : item,
      ),
    },
  };
}

export function dischargeResident(state, residentId, date) {
  const admission = activeAdmission(state, residentId);
  if (!admission) return { ok: false, state, error: "active admission required" };
  const ended = endBed(state, residentId, `${date}T00:00:00.000Z`, "discharge");
  return {
    ok: true,
    state: {
      ...ended,
      residents: ended.residents.map((resident) =>
        resident.id === residentId ? { ...resident, lifecycleStatus: "discharged", presenceStatus: "unknown", status: "discharged", dischargeDate: date } : resident,
      ),
      admissions: ended.admissions.map((item) =>
        item.id === admission.id ? { ...item, status: "completed", actualEndDate: date } : item,
      ),
      absenceEpisodes: ended.absenceEpisodes.map((absence) =>
        absence.residentId === residentId && absence.status === "active" ? { ...absence, status: "converted_to_discharge" } : absence,
      ),
    },
  };
}

export function markDeceased(state, residentId, date) {
  const admission = activeAdmission(state, residentId);
  const ended = endBed(state, residentId, `${date}T00:00:00.000Z`, "deceased");
  return {
    ok: true,
    state: {
      ...ended,
      residents: ended.residents.map((resident) =>
        resident.id === residentId ? { ...resident, lifecycleStatus: "deceased", presenceStatus: "unknown", status: "deceased", deceasedDate: date } : resident,
      ),
      admissions: admission ? ended.admissions.map((item) => item.id === admission.id ? { ...item, status: "completed", actualEndDate: date } : item) : ended.admissions,
    },
  };
}

export function moveBed(state, residentId, bedId, at) {
  const admission = activeAdmission(state, residentId);
  const bed = state.beds.find((item) => item.id === bedId);
  const room = state.rooms.find((item) => item.id === bed?.roomId);
  if (!admission || !bed || !room) return { ok: false, state, error: "missing records" };
  if ((room.facilityId || room.nursingHomeId) !== admission.nursingHomeId) return { ok: false, state, error: "cross-home assignment rejected" };
  if (state.bedAssignments.some((assignment) => assignment.bedId === bedId && assignment.status === "active" && assignment.residentId !== residentId)) {
    return { ok: false, state, error: "bed already occupied" };
  }
  const ended = endBed(state, residentId, at, "bed_move");
  return {
    ok: true,
    state: {
      ...ended,
      bedAssignments: [{
        id: `bed-assignment-${residentId}-${Date.parse(at)}`,
        residentId,
        admissionId: admission.id,
        nursingHomeId: admission.nursingHomeId,
        roomId: room.id,
        bedId,
        startDate: at.slice(0, 10),
        startDateTime: at,
        status: "active",
        reason: "bed_move",
      }, ...ended.bedAssignments],
    },
  };
}

const countBy = (items) => items.reduce((acc, item) => ({ ...acc, [item]: (acc[item] || 0) + 1 }), {});

export function validateLifecycle(state, unchangedClinicalRecordCounts = {}) {
  const activeAdmissionsByResident = new Map();
  const activeBedsByResident = new Map();
  const activeAbsencesByResident = new Map();
  for (const admission of state.admissions.filter((item) => item.status === "active")) activeAdmissionsByResident.set(admission.residentId, (activeAdmissionsByResident.get(admission.residentId) || 0) + 1);
  for (const assignment of state.bedAssignments.filter((item) => item.status === "active" && !item.endDateTime)) activeBedsByResident.set(assignment.residentId, (activeBedsByResident.get(assignment.residentId) || 0) + 1);
  for (const absence of state.absenceEpisodes.filter((item) => item.status === "active")) activeAbsencesByResident.set(absence.residentId, (activeAbsencesByResident.get(absence.residentId) || 0) + 1);

  const activeResidentsWithoutActiveAdmission = state.residents.filter((resident) => lifecycleOf(resident) === "active" && !activeAdmission(state, resident.id)).map((resident) => resident.id);
  const activeInHomeResidentsWithoutPlacement = state.residents.filter((resident) => eligibleForInHomeWork(resident) && !activeBedAssignment(state, resident.id)).map((resident) => resident.id);
  const dischargedResidentsWithActiveBeds = state.residents.filter((resident) => lifecycleOf(resident) === "discharged" && activeBedAssignment(state, resident.id)).map((resident) => resident.id);
  const deceasedResidentsWithActiveAdmission = state.residents.filter((resident) => lifecycleOf(resident) === "deceased" && activeAdmission(state, resident.id)).map((resident) => resident.id);
  const activeInHospitalResidentsWithoutTransferEpisode = state.residents.filter((resident) => lifecycleOf(resident) === "active" && presenceOf(resident) === "in_hospital" && activeAbsence(state, resident.id)?.type !== "hospital_transfer").map((resident) => resident.id);
  const crossHomeAssignmentMismatches = state.bedAssignments.filter((assignment) => {
    const resident = state.residents.find((item) => item.id === assignment.residentId);
    return resident?.facilityId && resident.facilityId !== assignment.nursingHomeId;
  }).map((assignment) => assignment.id);
  const ambiguousLegacyRecordsRequiringReview = state.residents.filter((resident) => resident.residentType === "inactive_respite" && !resident.dischargeDate).map((resident) => resident.id);
  const residentsWithMultipleActiveAdmissions = Array.from(activeAdmissionsByResident.entries()).filter(([, count]) => count > 1).map(([id]) => id);
  const residentsWithMultipleActiveBeds = Array.from(activeBedsByResident.entries()).filter(([, count]) => count > 1).map(([id]) => id);
  const residentsWithMultipleActiveAbsences = Array.from(activeAbsencesByResident.entries()).filter(([, count]) => count > 1).map(([id]) => id);

  const criticalErrors = [
    ...activeResidentsWithoutActiveAdmission,
    ...activeInHomeResidentsWithoutPlacement,
    ...dischargedResidentsWithActiveBeds,
    ...deceasedResidentsWithActiveAdmission,
    ...residentsWithMultipleActiveAdmissions,
    ...residentsWithMultipleActiveBeds,
    ...residentsWithMultipleActiveAbsences,
    ...activeInHospitalResidentsWithoutTransferEpisode,
    ...crossHomeAssignmentMismatches,
  ];

  return {
    totalResidents: state.residents.length,
    countByLifecycleStatus: countBy(state.residents.map(lifecycleOf)),
    countByAdmissionType: countBy(state.residents.map(admissionTypeOf)),
    countByPresenceStatus: countBy(state.residents.map(presenceOf)),
    activeResidentsWithoutActiveAdmission,
    activeInHomeResidentsWithoutPlacement,
    dischargedResidentsWithActiveBeds,
    deceasedResidentsWithActiveAdmission,
    residentsWithMultipleActiveAdmissions,
    residentsWithMultipleActiveBeds,
    residentsWithMultipleActiveAbsences,
    activeInHospitalResidentsWithoutTransferEpisode,
    crossHomeAssignmentMismatches,
    ambiguousLegacyRecordsRequiringReview,
    unchangedClinicalRecordCounts,
    criticalErrors,
  };
}
