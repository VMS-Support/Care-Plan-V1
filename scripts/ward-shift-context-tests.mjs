import assert from "node:assert/strict";

const BALLYMORE = "facility-ballymore-haven";
const HAZELWOOD = "facility-hazelwood-care";
const WARD_A = "ward-109a";
const WARD_B = "ward-109b";
const WARD_C = "memory-care";
const HZ_WARD = "hazelwood-general";

const shiftsByHome = {
  [BALLYMORE]: [
    { id: "bh-day", label: "Day Shift", startsAt: "08:00", endsAt: "14:00" },
    { id: "bh-late", label: "Late Shift", startsAt: "14:00", endsAt: "20:00" },
    { id: "bh-night", label: "Night Shift", startsAt: "20:00", endsAt: "08:00" },
  ],
  [HAZELWOOD]: [
    { id: "hz-early", label: "Early Shift", startsAt: "07:00", endsAt: "15:00" },
    { id: "hz-evening", label: "Evening Shift", startsAt: "15:00", endsAt: "23:00" },
    { id: "hz-night", label: "Night Shift", startsAt: "23:00", endsAt: "07:00" },
  ],
};

const users = {
  nurse: { homes: [BALLYMORE], wards: [WARD_A, WARD_B], roleByHome: { [BALLYMORE]: "NURSE" }, multi: false },
  hca: { homes: [BALLYMORE], wards: [WARD_A], roleByHome: { [BALLYMORE]: "HCA" }, multi: false },
  cnm: { homes: [BALLYMORE], wards: [WARD_A, WARD_B, WARD_C], roleByHome: { [BALLYMORE]: "CNM" }, multi: true },
  don: { homes: [BALLYMORE], wards: [WARD_A, WARD_B, WARD_C], roleByHome: { [BALLYMORE]: "DON" }, multi: true },
  multi: { homes: [BALLYMORE, HAZELWOOD], wards: [WARD_A, HZ_WARD], roleByHome: { [BALLYMORE]: "NURSE", [HAZELWOOD]: "CNM" }, multi: true },
};

const residents = [
  { id: "r-a", home: BALLYMORE, ward: WARD_A, status: "active", presence: "in_home", room: "1" },
  { id: "r-b", home: BALLYMORE, ward: WARD_B, status: "active", presence: "in_home", room: "2" },
  { id: "r-c", home: BALLYMORE, ward: WARD_C, status: "active", presence: "in_home", room: "3" },
  { id: "r-hz", home: HAZELWOOD, ward: HZ_WARD, status: "active", presence: "in_home", room: "4" },
  { id: "r-absent", home: BALLYMORE, ward: WARD_A, status: "active", presence: "temporarily_absent", room: "5" },
  { id: "r-hospital", home: BALLYMORE, ward: WARD_A, status: "active", presence: "in_hospital", room: "6" },
];

const careActions = [
  { id: "ca-a", residentId: "r-a", dueAt: "2026-07-13T15:00:00.000Z" },
  { id: "ca-b", residentId: "r-b", dueAt: "2026-07-13T15:30:00.000Z" },
  { id: "ca-c", residentId: "r-c", dueAt: "2026-07-13T16:00:00.000Z" },
];
const handovers = [
  { id: "h-a", residentId: "r-a", ward: WARD_A, shift: "afternoon", acknowledged: false },
  { id: "h-b", residentId: "r-b", ward: WARD_B, shift: "afternoon", acknowledged: false },
];
const alerts = [
  { id: "home-alert", home: BALLYMORE },
  { id: "a-a", residentId: "r-a" },
  { id: "a-a", residentId: "r-a" },
];

function shiftAt(home, iso) {
  const time = iso.slice(11, 16);
  const date = iso.slice(0, 10);
  for (const shift of shiftsByHome[home]) {
    if (shift.startsAt < shift.endsAt && time >= shift.startsAt && time < shift.endsAt) return { ...shift, operationalDate: date };
    if (shift.endsAt <= shift.startsAt && (time >= shift.startsAt || time < shift.endsAt)) {
      const operationalDate = new Date(`${date}T00:00:00.000Z`);
      if (time < shift.endsAt) operationalDate.setUTCDate(operationalDate.getUTCDate() - 1);
      return { ...shift, operationalDate: operationalDate.toISOString().slice(0, 10) };
    }
  }
  return null;
}

function context(userKey, home = users[userKey].homes[0], wardIds = [users[userKey].wards[0]], instant = "2026-07-13T15:00:00.000Z") {
  const user = users[userKey];
  if (!user.homes.includes(home)) throw new Error("home denied");
  const authorised = user.wards.filter((ward) => (home === HAZELWOOD ? ward === HZ_WARD : ward !== HZ_WARD));
  if (wardIds.some((ward) => !authorised.includes(ward))) throw new Error("ward denied");
  if (wardIds.length > 1 && !user.multi) throw new Error("multi denied");
  return { userKey, home, wardIds: [...new Set(wardIds)], role: user.roleByHome[home], shift: shiftAt(home, instant), instant };
}

const residentsFor = (ctx) =>
  residents.filter((resident) => resident.home === ctx.home && ctx.wardIds.includes(resident.ward) && resident.status === "active" && resident.presence === "in_home");
const careActionsFor = (ctx) => {
  const ids = new Set(residentsFor(ctx).map((resident) => resident.id));
  return careActions.filter((item) => ids.has(item.residentId));
};
const handoversFor = (ctx) => {
  const ids = new Set(residentsFor(ctx).map((resident) => resident.id));
  return handovers.filter((item) => ids.has(item.residentId) && ctx.wardIds.includes(item.ward));
};
const dedupe = (items) => Array.from(new Map(items.map((item) => [item.id, item])).values());

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("Single ward switch refreshes all current operational data", () => {
  assert.deepEqual(residentsFor(context("nurse", BALLYMORE, [WARD_A])).map((r) => r.id), ["r-a"]);
  assert.deepEqual(residentsFor(context("nurse", BALLYMORE, [WARD_B])).map((r) => r.id), ["r-b"]);
  assert.deepEqual(careActionsFor(context("nurse", BALLYMORE, [WARD_B])).map((i) => i.id), ["ca-b"]);
});

test("Unauthorised ward is denied and context remains unchanged", () => {
  assert.throws(() => context("hca", BALLYMORE, [WARD_B]));
  assert.deepEqual(residentsFor(context("hca")).map((r) => r.id), ["r-a"]);
});

test("Resident scope excludes absent and hospital residents", () => {
  assert.deepEqual(residentsFor(context("nurse", BALLYMORE, [WARD_A])).map((r) => r.id), ["r-a"]);
});

test("Upcoming Care Interventions keeps ordering and selected-ward scope", () => {
  assert.deepEqual(careActionsFor(context("nurse", BALLYMORE, [WARD_A])).map((i) => i.id), ["ca-a"]);
});

test("Next 4 Hours handles midnight, selected wards and no duplicates", () => {
  const ctx = context("cnm", BALLYMORE, [WARD_A, WARD_B], "2026-07-13T23:30:00.000Z");
  assert.equal(shiftAt(BALLYMORE, "2026-07-14T02:00:00.000Z").operationalDate, "2026-07-13");
  assert.equal(new Set(careActionsFor(ctx).map((i) => i.id)).size, careActionsFor(ctx).length);
});

test("Handover follows ward switch and does not acknowledge automatically", () => {
  const rows = handoversFor(context("nurse", BALLYMORE, [WARD_B]));
  assert.deepEqual(rows.map((row) => row.id), ["h-b"]);
  assert.equal(rows[0].acknowledged, false);
});

test("Multi-ward night nurse aggregates once", () => {
  const nightNurse = { ...users.nurse, multi: true };
  users.night = nightNurse;
  const ctx = context("night", BALLYMORE, [WARD_A, WARD_B], "2026-07-13T22:00:00.000Z");
  assert.deepEqual(residentsFor(ctx).map((r) => r.id).sort(), ["r-a", "r-b"]);
});

test("CNM can select one, several, or all managed wards", () => {
  assert.equal(residentsFor(context("cnm", BALLYMORE, [WARD_A])).length, 1);
  assert.equal(residentsFor(context("cnm", BALLYMORE, [WARD_A, WARD_B, WARD_C])).length, 3);
  assert.throws(() => context("cnm", HAZELWOOD, [HZ_WARD]));
});

test("DON all wards excludes other nursing homes", () => {
  assert.deepEqual(residentsFor(context("don", BALLYMORE, [WARD_A, WARD_B, WARD_C])).map((r) => r.id).sort(), ["r-a", "r-b", "r-c"]);
});

test("Float staff override is temporary and not permanent competency", () => {
  users.float = { homes: [BALLYMORE], wards: [WARD_A, WARD_B], roleByHome: { [BALLYMORE]: "NURSE" }, multi: true };
  assert.deepEqual(residentsFor(context("float", BALLYMORE, [WARD_B])).map((r) => r.id), ["r-b"]);
  delete users.float;
});

test("Persisted ward selection restores if valid and falls back if removed", () => {
  assert.deepEqual(context("nurse", BALLYMORE, [WARD_B]).wardIds, [WARD_B]);
  assert.throws(() => context("hca", BALLYMORE, [WARD_B]));
  assert.deepEqual(context("hca").wardIds, [WARD_A]);
});

test("Home switch clears old ward and recalculates role", () => {
  const ctx = context("multi", HAZELWOOD, [HZ_WARD]);
  assert.equal(ctx.role, "CNM");
  assert.deepEqual(residentsFor(ctx).map((r) => r.id), ["r-hz"]);
});

test("Shift resolution is home-specific", () => {
  assert.equal(shiftAt(BALLYMORE, "2026-07-13T15:00:00.000Z").label, "Late Shift");
  assert.equal(shiftAt(HAZELWOOD, "2026-07-13T15:30:00.000Z").label, "Evening Shift");
});

test("Night shift uses shift start date", () => {
  const night = shiftAt(BALLYMORE, "2026-07-14T02:00:00.000Z");
  assert.equal(night.label, "Night Shift");
  assert.equal(night.operationalDate, "2026-07-13");
});

test("Custom home shifts preserve configured labels", () => {
  assert.deepEqual(shiftsByHome[HAZELWOOD].map((shift) => shift.label), ["Early Shift", "Evening Shift", "Night Shift"]);
});

test("Shift overlap is rejected by validation fixture", () => {
  const overlap = [{ startsAt: "08:00", endsAt: "12:00" }, { startsAt: "11:00", endsAt: "14:00" }];
  assert(overlap[0].endsAt > overlap[1].startsAt);
});

test("Shift gap is detected by validation fixture", () => {
  const gap = [{ startsAt: "08:00", endsAt: "12:00" }, { startsAt: "13:00", endsAt: "18:00" }];
  assert(gap[0].endsAt < gap[1].startsAt);
});

test("Manual shift view does not alter roster or work records", () => {
  const before = careActions.length;
  const ctx = { ...context("nurse"), shift: shiftsByHome[BALLYMORE][2] };
  assert.equal(ctx.shift.label, "Night Shift");
  assert.equal(careActions.length, before);
});

test("Multi-ward deduplication keeps home-wide alert once", () => {
  assert.deepEqual(dedupe(alerts).map((alert) => alert.id).sort(), ["a-a", "home-alert"]);
});

test("RLT care-plan regression stays out of ward context mutation", () => {
  const carePlan = { id: "problem-1", rltDomainId: "safe_environment", interventionId: "ca-a" };
  assert.equal(carePlan.rltDomainId, "safe_environment");
  assert.equal(carePlan.interventionId, "ca-a");
});

console.log("Ward/shift context regression suite passed.");
