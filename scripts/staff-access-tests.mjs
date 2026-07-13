import assert from "node:assert/strict";
import {
  BALLYMORE,
  BALLYMORE_WARD,
  HAZELWOOD,
  HAZELWOOD_WARD,
  OTHER_BALLYMORE_WARD,
  canAccess,
  context,
  createStaffAccessFixture,
  explainAuthorizationDecision,
  getStaffAccessibleHomes,
  getStaffAccessibleWards,
  registrationStatus,
  validateStaffAccessFixture,
} from "./staff-access-fixture.mjs";

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("User account and staff identity are separate", () => {
  const state = createStaffAccessFixture();
  const account = state.userAccounts.find((item) => item.id === "u-nurse");
  account.accountStatus = "disabled";
  assert(state.staffMembers.some((item) => item.id === "staff-u-nurse"));
  assert(state.employmentRecords.some((item) => item.staffMemberId === "staff-u-nurse"));
  assert.equal(canAccess(state, context("u-nurse"), "resident.view"), false);
});

test("Staff with two nursing-home employments has two scoped assignments", () => {
  const state = createStaffAccessFixture();
  assert.equal(state.employmentRecords.filter((item) => item.staffMemberId === "staff-u-multi").length, 2);
  assert.deepEqual(getStaffAccessibleHomes(state, "staff-u-multi").sort(), [BALLYMORE, HAZELWOOD].sort());
});

test("Different roles in different homes do not leak", () => {
  const state = createStaffAccessFixture();
  assert.equal(canAccess(state, context("u-multi", BALLYMORE, BALLYMORE_WARD), "careplan.create"), true);
  assert.equal(canAccess(state, context("u-multi", BALLYMORE, BALLYMORE_WARD), "governance.view"), false);
  assert.equal(canAccess(state, context("u-multi", HAZELWOOD, HAZELWOOD_WARD), "governance.view"), true);
});

test("Ended employment preserves staff history without granting access", () => {
  const state = createStaffAccessFixture();
  assert(state.staffMembers.some((item) => item.id === "staff-u-ended"));
  assert(state.employmentRecords.some((item) => item.staffMemberId === "staff-u-ended" && item.employmentStatus === "ended"));
  assert.equal(canAccess(state, context("u-ended"), "resident.view"), false);
});

test("Professional registration expiry is calculated without overwriting records", () => {
  const state = createStaffAccessFixture();
  assert.equal(registrationStatus(state.professionalRegistrations.find((item) => item.id === "reg-u-nurse")), "expiring");
  assert.equal(registrationStatus(state.professionalRegistrations.find((item) => item.id === "reg-u-ended")), "expired");
  assert.equal(state.professionalRegistrations.filter((item) => item.staffMemberId === "staff-u-ended").length, 1);
});

test("Agency staff retains agency employment and temporary scope", () => {
  const state = createStaffAccessFixture();
  const record = state.employmentRecords.find((item) => item.id === "employment-u-agency-ballymore");
  assert.equal(record.employmentType, "agency");
  assert.equal(record.agencyName, "SafeStaff Agency");
  assert.deepEqual(getStaffAccessibleHomes(state, "staff-u-agency"), [BALLYMORE]);
});

test("Nurse records observations only in accessible home and ward", () => {
  const state = createStaffAccessFixture();
  assert.equal(canAccess(state, context("u-nurse", BALLYMORE, BALLYMORE_WARD), "observation.record"), true);
  assert.equal(canAccess(state, context("u-nurse", HAZELWOOD, HAZELWOOD_WARD), "observation.record"), false);
});

test("Nurse creates care plans only inside assigned home", () => {
  const state = createStaffAccessFixture();
  assert.equal(canAccess(state, context("u-nurse", BALLYMORE, BALLYMORE_WARD), "careplan.create"), true);
  assert.equal(canAccess(state, context("u-nurse", HAZELWOOD, HAZELWOOD_WARD), "careplan.create"), false);
});

test("HCA cannot review care plans", () => {
  const state = createStaffAccessFixture();
  assert.equal(canAccess(state, context("u-hca", BALLYMORE, BALLYMORE_WARD), "careplan.review"), false);
});

test("DON governance is scoped to assigned home", () => {
  const state = createStaffAccessFixture();
  assert.equal(canAccess(state, context("u-don", BALLYMORE, BALLYMORE_WARD), "governance.view"), true);
  assert.equal(canAccess(state, context("u-don", HAZELWOOD, HAZELWOOD_WARD), "governance.view"), false);
});

test("Finance access requires explicit grant", () => {
  const state = createStaffAccessFixture();
  assert.equal(canAccess(state, context("u-don"), "finance.view"), false);
  state.permissionGrants.push({ id: "grant-finance", userAccountId: "u-don", capability: "finance.view", scopeType: "nursing_home", nursingHomeId: BALLYMORE, effect: "allow", effectiveFrom: "2026-01-01", createdAt: "2026-01-01", updatedAt: "2026-01-01" });
  assert.equal(canAccess(state, context("u-don"), "finance.view"), true);
});

test("Safeguarding investigation is denied unless explicitly granted", () => {
  const state = createStaffAccessFixture();
  assert.equal(canAccess(state, context("u-nurse"), "safeguarding.investigate"), false);
  state.permissionGrants.push({ id: "grant-safeguarding", userAccountId: "u-nurse", capability: "safeguarding.investigate", scopeType: "nursing_home", nursingHomeId: BALLYMORE, effect: "allow", effectiveFrom: "2026-01-01", createdAt: "2026-01-01", updatedAt: "2026-01-01" });
  assert.equal(canAccess(state, context("u-nurse"), "safeguarding.investigate"), true);
});

test("Multi-home switching changes effective capabilities", () => {
  const state = createStaffAccessFixture();
  assert.deepEqual(getStaffAccessibleHomes(state, "staff-u-multi").sort(), [BALLYMORE, HAZELWOOD].sort());
  assert.equal(canAccess(state, context("u-multi", BALLYMORE, BALLYMORE_WARD), "governance.view"), false);
  assert.equal(canAccess(state, context("u-multi", HAZELWOOD, HAZELWOOD_WARD), "governance.view"), true);
});

test("Ward competency restricts ward switching while DON has whole-home scope", () => {
  const state = createStaffAccessFixture();
  assert.deepEqual(getStaffAccessibleWards(state, "staff-u-nurse", BALLYMORE), [BALLYMORE_WARD]);
  assert.equal(canAccess(state, context("u-nurse", BALLYMORE, OTHER_BALLYMORE_WARD), "resident.view"), false);
  assert.equal(canAccess(state, context("u-don", BALLYMORE, OTHER_BALLYMORE_WARD), "resident.view"), true);
});

test("Roster foundation reports invalid cross-ward roster without deleting role", () => {
  const state = createStaffAccessFixture({
    rosterAssignments: [{ id: "roster-invalid", staffMemberId: "staff-u-nurse", nursingHomeId: BALLYMORE, wardId: OTHER_BALLYMORE_WARD, roleKey: "NURSE", status: "confirmed", source: "manual", startDateTime: "2026-07-13T08:00:00.000Z", endDateTime: "2026-07-13T20:00:00.000Z", createdAt: "2026-07-13", updatedAt: "2026-07-13" }],
  });
  const report = validateStaffAccessFixture(state);
  assert.deepEqual(report.rosterAssignmentsOutsideCompetency, ["roster-invalid"]);
  assert(state.roleAssignments.some((item) => item.id === "role-u-nurse-ballymore"));
});

test("Explicit deny overrides role template allow", () => {
  const state = createStaffAccessFixture({
    permissionGrants: [{ id: "deny-careplan", staffMemberId: "staff-u-nurse", capability: "careplan.create", scopeType: "nursing_home", nursingHomeId: BALLYMORE, effect: "deny", effectiveFrom: "2026-01-01", createdAt: "2026-01-01", updatedAt: "2026-01-01" }],
  });
  const decision = explainAuthorizationDecision(state, context("u-nurse"), "careplan.create");
  assert.equal(decision.allowed, false);
  assert.equal(decision.deniedReason, "Explicit deny matched.");
});

test("Disabled account denies all access without deleting clinical history", () => {
  const state = createStaffAccessFixture();
  assert.equal(canAccess(state, context("u-ended"), "resident.view"), false);
  assert(state.staffMembers.find((item) => item.id === "staff-u-ended"));
  assert(state.professionalRegistrations.find((item) => item.staffMemberId === "staff-u-ended"));
});

test("Regression: current user IDs and care planning records remain stable", () => {
  const state = createStaffAccessFixture({
    carePlanProblems: [{ id: "problem-1", rltDomainId: "safe_environment" }],
    problemInterventions: [{ id: "intervention-1", frequencyType: "next_4_hours" }],
  });
  const report = validateStaffAccessFixture(state);
  assert.equal(report.currentUserIdsUnchanged, true);
  assert.equal(state.carePlanProblems[0].rltDomainId, "safe_environment");
  assert.equal(state.problemInterventions[0].frequencyType, "next_4_hours");
});

const report = validateStaffAccessFixture(createStaffAccessFixture());
assert.equal(report.criticalErrors.length, 0);
console.log("Staff access model regression suite passed.");
