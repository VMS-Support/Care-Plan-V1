import assert from "node:assert/strict";
import {
  BALLYMORE_FACILITY_ID,
  HAZELWOOD_FACILITY_ID,
  createFixture,
  makeResidents,
  makeRooms,
  migrateFixture,
  validateFixture,
} from "./entity-hierarchy-fixture.mjs";

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("Enterprise migration links two nursing homes without changing residents", () => {
  const before = createFixture();
  const after = migrateFixture(before);
  assert.equal(after.enterprises.length, 1);
  assert.equal(after.facilities.length, 2);
  assert.deepEqual(after.facilities.map((item) => item.enterpriseId), ["enterprise-default", "enterprise-default"]);
  assert.deepEqual(after.residents.map((item) => item.id), before.residents.map((item) => item.id));
});

test("Default ward migration links all existing rooms and preserves room IDs", () => {
  const before = createFixture();
  const after = migrateFixture(before);
  assert.equal(after.wards.filter((ward) => ward.nursingHomeId === BALLYMORE_FACILITY_ID).length, 1);
  assert.equal(after.rooms.filter((room) => room.wardId).length, before.rooms.length);
  assert.deepEqual(after.rooms.map((room) => room.id), before.rooms.map((room) => room.id));
  assert.equal(after.residents[0].roomNumber, before.residents[0].roomNumber);
});

test("Default bed migration creates Bed 1 and preserves placement", () => {
  const rooms = makeRooms(BALLYMORE_FACILITY_ID, 1);
  const residents = makeResidents(rooms, 1);
  const after = migrateFixture(createFixture({ rooms, residents }));
  assert.equal(after.beds.length, 1);
  assert.equal(after.beds[0].label, "Bed 1");
  assert.equal(after.bedAssignments[0].residentId, residents[0].id);
});

test("Multi-occupancy room migration creates distinct active beds", () => {
  const rooms = makeRooms(BALLYMORE_FACILITY_ID, 1);
  const residents = makeResidents(rooms, 2).map((resident) => ({ ...resident, roomId: rooms[0].id, roomNumber: rooms[0].number }));
  const after = migrateFixture(createFixture({ rooms, residents }));
  assert.equal(after.beds.length, 2);
  assert.equal(new Set(after.bedAssignments.map((item) => item.bedId)).size, 2);
  assert.equal(validateFixture(after).criticalErrors.length, 0);
});

test("Nursing-home isolation keeps hierarchy scoped", () => {
  const ballymoreRooms = makeRooms(BALLYMORE_FACILITY_ID, 2);
  const hazelwoodRooms = makeRooms(HAZELWOOD_FACILITY_ID, 2);
  const rooms = [...ballymoreRooms, ...hazelwoodRooms];
  const residents = [
    ...makeResidents(ballymoreRooms, 1, BALLYMORE_FACILITY_ID),
    ...makeResidents(hazelwoodRooms, 1, HAZELWOOD_FACILITY_ID).map((resident) => ({ ...resident, id: "HZ-0001" })),
  ];
  const after = migrateFixture(createFixture({ rooms, residents }));
  assert(after.wards.every((ward) => [BALLYMORE_FACILITY_ID, HAZELWOOD_FACILITY_ID].includes(ward.nursingHomeId)));
  assert(after.rooms.filter((room) => room.facilityId === HAZELWOOD_FACILITY_ID).every((room) => room.wardId.includes(HAZELWOOD_FACILITY_ID)));
  assert.equal(validateFixture(after).criticalErrors.length, 0);
});

test("Existing RLT, scheduling, and stable IDs are unchanged", () => {
  const before = createFixture({
    carePlanProblems: [{ id: "prob-abc", residentId: "R-0001", rltDomainId: "safe_environment" }],
    problemInterventions: [{ id: "int-abc", problemId: "prob-abc", residentId: "R-0001", frequencyType: "every_4_hours" }],
    problemReviews: [{ id: "rev-abc", problemId: "prob-abc" }],
    carePlans: [{ id: "care-plan-legacy", residentId: "R-0001" }],
    assessments: [{ id: "assessment-legacy", residentId: "R-0001" }],
  });
  const after = migrateFixture(before);
  assert.deepEqual(after.residents.map((item) => item.id), before.residents.map((item) => item.id));
  assert.deepEqual(after.carePlans.map((item) => item.id), before.carePlans.map((item) => item.id));
  assert.deepEqual(after.assessments.map((item) => item.id), before.assessments.map((item) => item.id));
  assert.equal(after.carePlanProblems[0].rltDomainId, "safe_environment");
  assert.equal(after.problemInterventions[0].frequencyType, "every_4_hours");
  assert.equal(after.problemReviews.length, before.problemReviews.length);
});

test("Placement selectors can fall back from bed assignment to legacy room", () => {
  const rooms = makeRooms(BALLYMORE_FACILITY_ID, 1);
  const residents = makeResidents(rooms, 1);
  const after = migrateFixture(createFixture({ rooms, residents }));
  const active = after.bedAssignments.find((item) => item.residentId === residents[0].id);
  assert(active);
  const legacyOnly = { ...after, bedAssignments: [] };
  assert.equal(legacyOnly.rooms.find((room) => room.id === residents[0].roomId)?.number, residents[0].roomNumber);
});

test("Inactive entities remain but are not required for new active placement", () => {
  const rooms = makeRooms(BALLYMORE_FACILITY_ID, 1);
  const after = migrateFixture(createFixture({ rooms }));
  after.wards[0].active = false;
  after.rooms[0].active = false;
  after.beds[0].active = false;
  assert.equal(after.wards.length, 2);
  assert.equal(after.rooms.length, 1);
  assert.equal(after.beds.length, 12);
});

const validation = validateFixture(migrateFixture(createFixture()));
assert.equal(validation.criticalErrors.length, 0);
console.log("Entity hierarchy regression suite passed.");
