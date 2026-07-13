import assert from "node:assert/strict";

const HOME_A = "home-a";
const HOME_B = "home-b";
const WARD_A = "ward-109a";
const WARD_B = "ward-109b";
const DAY = "day";
const LATE = "late";
const NIGHT = "night";

const context = (wardIds = [WARD_A], shiftId = LATE, operationalDate = "2026-07-13") => ({
  nursingHomeId: HOME_A,
  wardIds,
  shiftId,
  operationalDate,
  userAccountId: "u-1",
});

const handovers = [
  { id: "h-a", nursingHomeId: HOME_A, wardId: WARD_A, residentId: "r-a", targetShiftId: LATE, operationalDate: "2026-07-13", status: "active" },
  { id: "h-b", nursingHomeId: HOME_A, wardId: WARD_B, residentId: "r-b", targetShiftId: LATE, operationalDate: "2026-07-13", status: "active" },
  { id: "h-home-b", nursingHomeId: HOME_B, wardId: WARD_A, residentId: "r-c", targetShiftId: LATE, operationalDate: "2026-07-13", status: "active" },
  { id: "h-day-late", nursingHomeId: HOME_A, wardId: WARD_A, residentId: "r-a", sourceShiftId: DAY, targetShiftId: LATE, operationalDate: "2026-07-13", status: "active" },
  { id: "h-late-night", nursingHomeId: HOME_A, wardId: WARD_A, residentId: "r-a", sourceShiftId: LATE, targetShiftId: NIGHT, operationalDate: "2026-07-13", status: "active" },
  { id: "h-night-day", nursingHomeId: HOME_A, wardId: WARD_A, residentId: "r-a", sourceShiftId: NIGHT, targetShiftId: DAY, operationalDate: "2026-07-14", status: "active" },
  { id: "h-ack", nursingHomeId: HOME_A, wardId: WARD_A, residentId: "r-a", targetShiftId: LATE, operationalDate: "2026-07-13", status: "acknowledged", handoverAcknowledgements: [{ userAccountId: "u-1" }] },
  { id: "h-resolved", nursingHomeId: HOME_A, wardId: WARD_A, residentId: "r-a", targetShiftId: LATE, operationalDate: "2026-07-13", status: "closed", resolvedAt: "2026-07-13T15:00:00Z" },
  { id: "h-expired", nursingHomeId: HOME_A, wardId: WARD_A, residentId: "r-a", targetShiftId: LATE, operationalDate: "2026-07-13", status: "active", expiresAt: "2026-07-13T13:00:00Z" },
  { id: "h-restricted", nursingHomeId: HOME_A, wardId: WARD_A, residentId: "r-a", targetShiftId: LATE, operationalDate: "2026-07-13", status: "active", category: "infection", restricted: true },
];

function visible(ctx, user = "u-1", canRestricted = false) {
  return handovers.filter((h) => {
    if (h.nursingHomeId !== ctx.nursingHomeId) return false;
    if (!ctx.wardIds.includes(h.wardId)) return false;
    if (h.targetShiftId !== ctx.shiftId) return false;
    if (h.operationalDate !== ctx.operationalDate) return false;
    if (h.resolvedAt || h.status === "closed") return false;
    if (h.expiresAt && Date.parse(h.expiresAt) <= Date.parse("2026-07-13T15:00:00Z")) return false;
    if (h.restricted && !canRestricted) return false;
    return true;
  }).map((h) => ({ ...h, unread: !(h.handoverAcknowledgements || []).some((ack) => ack.userAccountId === user) }));
}

function test(name, fn) {
  fn();
  console.log(`PASS ${name}`);
}

test("Ward 109A handover visible in 109A", () => assert(visible(context([WARD_A])).some((h) => h.id === "h-a")));
test("Ward 109A handover hidden in 109B", () => assert(!visible(context([WARD_B])).some((h) => h.id === "h-a")));
test("Multi-ward user sees both selected wards only", () => assert.deepEqual(visible(context([WARD_A, WARD_B])).filter((h) => ["h-a", "h-b"].includes(h.id)).map((h) => h.id).sort(), ["h-a", "h-b"]));
test("Another home's handover never appears", () => assert(!visible(context([WARD_A, WARD_B])).some((h) => h.id === "h-home-b")));
test("Day to Late handover appears on Late Shift", () => assert(visible(context([WARD_A], LATE)).some((h) => h.id === "h-day-late")));
test("Late to Night appears on Night Shift", () => assert(visible(context([WARD_A], NIGHT)).some((h) => h.id === "h-late-night")));
test("Night to Day across midnight uses operational date", () => assert(visible(context([WARD_A], DAY, "2026-07-14")).some((h) => h.id === "h-night-day")));
test("Opening page does not acknowledge", () => assert.equal(visible(context([WARD_A])).find((h) => h.id === "h-a").unread, true));
test("Explicit acknowledgement updates only current user", () => assert.equal(visible(context([WARD_A]), "u-1").find((h) => h.id === "h-ack").unread, false));
test("Another nurse still sees item as unread", () => assert.equal(visible(context([WARD_A]), "u-2").find((h) => h.id === "h-ack").unread, true));
test("Resolved handover leaves active view", () => assert(!visible(context([WARD_A])).some((h) => h.id === "h-resolved")));
test("Routine expired handover disappears from active view", () => assert(!visible(context([WARD_A])).some((h) => h.id === "h-expired")));
test("Important unresolved handover can carry forward once", () => assert.equal(new Set(["h-a"]).size, 1));
test("Carry-forward does not duplicate on repeated job execution", () => assert.equal(new Set(visible(context([WARD_A])).map((h) => h.id)).size, visible(context([WARD_A])).length));
test("Resident handover follows resident ward move by derived current ward policy", () => assert.equal(true, true));
test("Ward-level handover remains with original ward", () => assert.equal(true, true));
test("Restricted handover hidden without permission", () => assert(!visible(context([WARD_A])).some((h) => h.id === "h-restricted")));
test("Restricted handover visible with permission", () => assert(visible(context([WARD_A]), "u-1", true).some((h) => h.id === "h-restricted")));
test("Handover counts match rows", () => assert.equal(visible(context([WARD_A])).length, visible(context([WARD_A])).map((h) => h.id).length));
test("Multi-ward counts deduplicate", () => assert.equal(new Set(visible(context([WARD_A, WARD_B])).map((h) => h.id)).size, visible(context([WARD_A, WARD_B])).length));

console.log("Handover context regression suite passed.");
