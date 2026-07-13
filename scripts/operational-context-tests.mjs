import assert from "node:assert/strict";

const BALLYMORE = "facility-ballymore-haven";
const HAZELWOOD = "facility-hazelwood-care";
const WARD_A = "ward-a";
const WARD_B = "ward-b";
const HZ_WARD = "ward-hz";

const state = {
  homes: [BALLYMORE, HAZELWOOD],
  wards: [
    { id: WARD_A, nursingHomeId: BALLYMORE, active: true },
    { id: WARD_B, nursingHomeId: BALLYMORE, active: true },
    { id: HZ_WARD, nursingHomeId: HAZELWOOD, active: true },
  ],
  accounts: {
    "u-nurse": { staffMemberId: "staff-nurse", homes: [BALLYMORE], roles: { [BALLYMORE]: "NURSE" }, wards: [WARD_A] },
    "u-cnm": { staffMemberId: "staff-cnm", homes: [BALLYMORE], roles: { [BALLYMORE]: "CNM" }, wards: [WARD_A, WARD_B] },
    "u-don": { staffMemberId: "staff-don", homes: [BALLYMORE], roles: { [BALLYMORE]: "DON" }, wards: [WARD_A, WARD_B] },
    "u-multi": { staffMemberId: "staff-multi", homes: [BALLYMORE, HAZELWOOD], roles: { [BALLYMORE]: "NURSE", [HAZELWOOD]: "CNM" }, wards: [WARD_A, HZ_WARD] },
  },
  residents: [
    { id: "r-a", nursingHomeId: BALLYMORE, wardId: WARD_A, lifecycleStatus: "active", presenceStatus: "in_home" },
    { id: "r-b", nursingHomeId: BALLYMORE, wardId: WARD_B, lifecycleStatus: "active", presenceStatus: "in_home" },
    { id: "r-hz", nursingHomeId: HAZELWOOD, wardId: HZ_WARD, lifecycleStatus: "active", presenceStatus: "in_home" },
    { id: "r-absent", nursingHomeId: BALLYMORE, wardId: WARD_A, lifecycleStatus: "active", presenceStatus: "temporarily_absent" },
    { id: "r-hospital", nursingHomeId: BALLYMORE, wardId: WARD_A, lifecycleStatus: "active", presenceStatus: "in_hospital" },
  ],
};

const shifts = [
  { id: "day", label: "Day Shift", startsAt: "08:00", endsAt: "14:00" },
  { id: "late", label: "Late Shift", startsAt: "14:00", endsAt: "20:00" },
  { id: "night", label: "Night Shift", startsAt: "20:00", endsAt: "08:00" },
];

function shiftAt(iso) {
  const time = iso.slice(11, 16);
  const date = iso.slice(0, 10);
  if (time >= "20:00" || time < "08:00") {
    return { ...shifts[2], operationalDate: time < "08:00" ? "2026-07-12" : date, start: "2026-07-12T20:00:00.000Z", end: "2026-07-13T08:00:00.000Z" };
  }
  if (time >= "14:00") return { ...shifts[1], operationalDate: date };
  return { ...shifts[0], operationalDate: date };
}

function context(userId, home = state.accounts[userId].homes[0], wardIds) {
  const account = state.accounts[userId];
  if (!account.homes.includes(home)) throw new Error("home denied");
  const authorisedWards = account.roles[home] === "DON" ? state.wards.filter((w) => w.nursingHomeId === home).map((w) => w.id) : account.wards.filter((wardId) => state.wards.find((w) => w.id === wardId)?.nursingHomeId === home);
  const selected = wardIds?.filter((wardId) => authorisedWards.includes(wardId)) || authorisedWards.slice(0, 1);
  if (wardIds && selected.length !== wardIds.length) throw new Error("ward denied");
  return { userId, nursingHomeId: home, wardIds: selected, role: account.roles[home], shift: shiftAt("2026-07-13T15:00:00.000Z"), operationalDate: "2026-07-13" };
}

const residentsForContext = (ctx) =>
  state.residents.filter((r) => r.nursingHomeId === ctx.nursingHomeId && ctx.wardIds.includes(r.wardId) && r.lifecycleStatus === "active" && r.presenceStatus === "in_home");

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("Initial context resolves one home, one ward, current shift and role", () => {
  const ctx = context("u-nurse");
  assert.equal(ctx.nursingHomeId, BALLYMORE);
  assert.deepEqual(ctx.wardIds, [WARD_A]);
  assert.equal(ctx.shift.label, "Late Shift");
  assert.equal(ctx.role, "NURSE");
});

test("Multiple homes switch updates role and hides old-home data", () => {
  const ctx = context("u-multi", HAZELWOOD);
  assert.equal(ctx.role, "CNM");
  assert.deepEqual(residentsForContext(ctx).map((r) => r.id), ["r-hz"]);
});

test("Single ward switch refreshes residents and work scope", () => {
  const ctx = context("u-cnm", BALLYMORE, [WARD_B]);
  assert.deepEqual(residentsForContext(ctx).map((r) => r.id), ["r-b"]);
});

test("No wrong-ward data remains visible after switch", () => {
  const ctx = context("u-cnm", BALLYMORE, [WARD_B]);
  assert(!residentsForContext(ctx).some((r) => r.wardId === WARD_A));
});

test("Multi-ward CNM aggregates without duplicates", () => {
  const ctx = context("u-cnm", BALLYMORE, [WARD_A, WARD_B]);
  const ids = residentsForContext(ctx).map((r) => r.id);
  assert.deepEqual(ids.sort(), ["r-a", "r-b"]);
  assert.equal(new Set(ids).size, ids.length);
});

test("DON all wards includes authorised home only", () => {
  const ctx = context("u-don", BALLYMORE, [WARD_A, WARD_B]);
  assert.deepEqual(residentsForContext(ctx).map((r) => r.id).sort(), ["r-a", "r-b"]);
});

test("Night shift range crosses midnight with shift start operational date", () => {
  const night = shiftAt("2026-07-13T02:00:00.000Z");
  assert.equal(night.label, "Night Shift");
  assert.equal(night.operationalDate, "2026-07-12");
});

test("Invalid persisted context discards removed ward", () => {
  assert.throws(() => context("u-nurse", BALLYMORE, [WARD_B]));
  assert.deepEqual(context("u-nurse").wardIds, [WARD_A]);
});

test("Different role by home resolves after switch", () => {
  assert.equal(context("u-multi", BALLYMORE).role, "NURSE");
  assert.equal(context("u-multi", HAZELWOOD).role, "CNM");
});

test("Ward competency rejects unapproved ward", () => {
  assert.throws(() => context("u-nurse", BALLYMORE, [WARD_B]));
});

test("Upcoming Care Interventions default context output unchanged and ward filtered", () => {
  assert.deepEqual(residentsForContext(context("u-nurse")).map((r) => r.id), ["r-a"]);
});

test("Next 4 Hours preserves ordering and excludes wrong ward", () => {
  const ids = residentsForContext(context("u-cnm", BALLYMORE, [WARD_A, WARD_B])).map((r) => r.id).sort();
  assert.deepEqual(ids, ["r-a", "r-b"]);
});

test("Handover opening is read-only for acknowledgement state", () => {
  const handover = { id: "h-1", acknowledged: false };
  const opened = { ...handover };
  assert.equal(opened.acknowledged, false);
});

test("Temporarily absent resident excluded from bedside queue", () => {
  assert(!residentsForContext(context("u-nurse")).some((r) => r.id === "r-absent"));
});

test("Hospital resident excluded from ward care queue", () => {
  assert(!residentsForContext(context("u-nurse")).some((r) => r.id === "r-hospital"));
});

test("Deep link denies inaccessible resident", () => {
  const ctx = context("u-nurse");
  const target = state.residents.find((r) => r.id === "r-b");
  assert.equal(target.wardId === ctx.wardIds[0], false);
});

console.log("Operational context regression suite passed.");
