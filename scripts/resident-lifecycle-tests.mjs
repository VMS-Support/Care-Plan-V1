import assert from "node:assert/strict";
import {
  BALLYMORE_FACILITY_ID,
  HAZELWOOD_FACILITY_ID,
  activeAbsence,
  activeAdmission,
  activeBedAssignment,
  admissionTypeOf,
  createFixture,
  dischargeResident,
  displayStatus,
  eligibleForInHomeWork,
  lifecycleOf,
  makeResidents,
  makeRooms,
  markDeceased,
  migrateLifecycle,
  moveBed,
  presenceOf,
  returnFromAbsence,
  startHospitalTransfer,
  startTemporaryAbsence,
  validateLifecycle,
} from "./resident-lifecycle-fixture.mjs";

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

const baseState = () => migrateLifecycle(createFixture());

test("Active long-term resident displays and counts correctly", () => {
  const state = baseState();
  const resident = state.residents[0];
  assert.equal(displayStatus(resident), "Active Long-Term");
  assert.equal(lifecycleOf(resident), "active");
  assert.equal(admissionTypeOf(resident), "long_term");
  assert.equal(presenceOf(resident), "in_home");
  assert(activeAdmission(state, resident.id));
  assert(activeBedAssignment(state, resident.id));
  assert.equal(eligibleForInHomeWork(resident), true);
});

test("Active respite resident is admission type, not lifecycle status", () => {
  const rooms = makeRooms(BALLYMORE_FACILITY_ID, 1);
  const residents = makeResidents(rooms, 1, BALLYMORE_FACILITY_ID).map((resident) => ({
    ...resident,
    residentType: "active_respite",
  }));
  const state = migrateLifecycle(createFixture({ rooms, residents }));
  const resident = state.residents.find((item) => item.residentType === "active_respite");
  assert(resident);
  assert.equal(displayStatus(resident), "Active Respite");
  assert.equal(lifecycleOf(resident), "active");
  assert.equal(admissionTypeOf(resident), "respite");
  assert.notEqual(admissionTypeOf(resident), "long_term");
});

test("Temporary absence with bed held preserves active admission and excludes bedside work", () => {
  const state = baseState();
  const resident = state.residents[0];
  const result = startTemporaryAbsence(state, resident.id, { at: "2026-07-13T09:00:00.000Z", bedHeld: true });
  assert.equal(result.ok, true);
  const updated = result.state.residents.find((item) => item.id === resident.id);
  assert.equal(lifecycleOf(updated), "active");
  assert.equal(presenceOf(updated), "temporarily_absent");
  assert(activeAdmission(result.state, resident.id));
  assert(activeBedAssignment(result.state, resident.id));
  assert(activeAbsence(result.state, resident.id));
  assert.equal(eligibleForInHomeWork(updated), false);
});

test("Temporary absence without bed held releases active bed", () => {
  const state = baseState();
  const resident = state.residents[0];
  const result = startTemporaryAbsence(state, resident.id, { at: "2026-07-13T09:00:00.000Z", bedHeld: false });
  assert.equal(result.ok, true);
  assert(activeAdmission(result.state, resident.id));
  assert.equal(activeBedAssignment(result.state, resident.id), undefined);
  assert.equal(activeAbsence(result.state, resident.id).bedHeld, false);
});

test("Hospital transfer is active absence, not discharge", () => {
  const state = baseState();
  const resident = state.residents[0];
  const result = startHospitalTransfer(state, resident.id, { at: "2026-07-13T10:00:00.000Z", bedHeld: true });
  const updated = result.state.residents.find((item) => item.id === resident.id);
  assert.equal(result.ok, true);
  assert.equal(lifecycleOf(updated), "active");
  assert.equal(presenceOf(updated), "in_hospital");
  assert.equal(activeAbsence(result.state, resident.id).type, "hospital_transfer");
  assert(activeAdmission(result.state, resident.id));
  assert.notEqual(lifecycleOf(updated), "discharged");
  assert.equal(eligibleForInHomeWork(updated), false);
});

test("Return from hospital restores in-home presence without duplicate absence", () => {
  const state = baseState();
  const resident = state.residents[0];
  const transferred = startHospitalTransfer(state, resident.id, { at: "2026-07-13T10:00:00.000Z", bedHeld: true }).state;
  const absence = activeAbsence(transferred, resident.id);
  const returned = returnFromAbsence(transferred, absence.id, "2026-07-14T12:00:00.000Z");
  const updated = returned.state.residents.find((item) => item.id === resident.id);
  assert.equal(returned.ok, true);
  assert.equal(presenceOf(updated), "in_home");
  assert(activeAdmission(returned.state, resident.id));
  assert(activeBedAssignment(returned.state, resident.id));
  assert.equal(activeAbsence(returned.state, resident.id), undefined);
});

test("Discharge completes admission, ends bed, and retains clinical history", () => {
  const state = baseState();
  const resident = state.residents[0];
  const beforeCarePlans = state.carePlans.length;
  const result = dischargeResident(state, resident.id, "2026-07-15");
  const updated = result.state.residents.find((item) => item.id === resident.id);
  assert.equal(result.ok, true);
  assert.equal(lifecycleOf(updated), "discharged");
  assert.equal(activeAdmission(result.state, resident.id), undefined);
  assert.equal(activeBedAssignment(result.state, resident.id), undefined);
  assert.equal(result.state.carePlans.length, beforeCarePlans);
});

test("Deceased is distinct from discharge and stops active admission/bed", () => {
  const state = baseState();
  const resident = state.residents[0];
  const result = markDeceased(state, resident.id, "2026-07-15");
  const updated = result.state.residents.find((item) => item.id === resident.id);
  assert.equal(lifecycleOf(updated), "deceased");
  assert.notEqual(lifecycleOf(updated), "discharged");
  assert.equal(activeAdmission(result.state, resident.id), undefined);
  assert.equal(activeBedAssignment(result.state, resident.id), undefined);
});

test("Inactive administrative record is excluded from active scheduling", () => {
  const state = baseState();
  const resident = { ...state.residents[0], lifecycleStatus: "inactive", presenceStatus: "unknown", inactiveReason: "duplicate retained for audit" };
  assert.equal(eligibleForInHomeWork(resident), false);
  assert.equal(lifecycleOf(resident), "inactive");
  assert(resident.inactiveReason);
});

test("Room move preserves previous assignment and creates one active bed", () => {
  const state = baseState();
  const resident = state.residents[0];
  const targetBed = state.beds.find((bed) => !state.bedAssignments.some((assignment) => assignment.bedId === bed.id && assignment.status === "active"));
  const result = moveBed(state, resident.id, targetBed.id, "2026-07-13T11:00:00.000Z");
  assert.equal(result.ok, true);
  assert.equal(result.state.bedAssignments.filter((assignment) => assignment.residentId === resident.id).length, 2);
  assert.equal(result.state.bedAssignments.filter((assignment) => assignment.residentId === resident.id && assignment.status === "active").length, 1);
});

test("Two residents cannot occupy same bed", () => {
  const state = baseState();
  const occupied = activeBedAssignment(state, state.residents[1].id);
  const result = moveBed(state, state.residents[0].id, occupied.bedId, "2026-07-13T12:00:00.000Z");
  assert.equal(result.ok, false);
  assert.match(result.error, /occupied/);
});

test("Resident cannot have two active beds after move", () => {
  const state = baseState();
  const resident = state.residents[0];
  const targetBed = state.beds.find((bed) => !state.bedAssignments.some((assignment) => assignment.bedId === bed.id && assignment.status === "active"));
  const result = moveBed(state, resident.id, targetBed.id, "2026-07-13T13:00:00.000Z");
  assert.equal(result.state.bedAssignments.filter((assignment) => assignment.residentId === resident.id && assignment.status === "active").length, 1);
});

test("Cross-home bed assignment is rejected", () => {
  const bRooms = makeRooms(BALLYMORE_FACILITY_ID, 1);
  const hRooms = makeRooms(HAZELWOOD_FACILITY_ID, 1);
  const residents = makeResidents(bRooms, 1, BALLYMORE_FACILITY_ID);
  const state = migrateLifecycle(createFixture({ rooms: [...bRooms, ...hRooms], residents }));
  const hazelwoodBed = state.beds.find((bed) => bed.roomId === hRooms[0].id);
  const result = moveBed(state, residents[0].id, hazelwoodBed.id, "2026-07-13T14:00:00.000Z");
  assert.equal(result.ok, false);
  assert.match(result.error, /cross-home/);
});

test("Existing RLT and scheduling counts are unchanged for in-home residents", () => {
  const before = createFixture({
    carePlanProblems: [{ id: "prob-abc", residentId: "R-0001", rltDomainId: "safe_environment", status: "active" }],
    problemInterventions: [{ id: "int-abc", problemId: "prob-abc", residentId: "R-0001", frequencyType: "every_4_hours", status: "active" }],
    problemReviews: [{ id: "rev-abc", problemId: "prob-abc" }],
    carePlans: [{ id: "care-plan-legacy", residentId: "R-0001" }],
    assessments: [{ id: "assessment-legacy", residentId: "R-0001" }],
  });
  const after = migrateLifecycle(before);
  assert.deepEqual(after.carePlans.map((item) => item.id), before.carePlans.map((item) => item.id));
  assert.deepEqual(after.assessments.map((item) => item.id), before.assessments.map((item) => item.id));
  assert.equal(after.carePlanProblems[0].rltDomainId, "safe_environment");
  assert.equal(after.problemInterventions.length, before.problemInterventions.length);
  assert.equal(after.problemReviews.length, before.problemReviews.length);
  assert.equal(eligibleForInHomeWork(after.residents[0]), true);
});

test("Migration counts and validation are clean", () => {
  const before = createFixture();
  const after = migrateLifecycle(before);
  const report = validateLifecycle(after);
  assert.equal(after.residents.length, before.residents.length);
  assert.equal(after.carePlans.length, before.carePlans.length);
  assert.equal(after.assessments.length, before.assessments.length);
  assert.equal(after.problemInterventions.length, before.problemInterventions.length);
  assert.equal(after.problemReviews.length, before.problemReviews.length);
  assert.equal(report.residentsWithMultipleActiveAdmissions.length, 0);
  assert.equal(report.residentsWithMultipleActiveBeds.length, 0);
  assert.equal(report.criticalErrors.length, 0);
});

console.log("Resident lifecycle regression suite passed.");
