import assert from "node:assert/strict";

const policy = {
  dueNowEarlyMinutes: 30,
  dueNowLateMinutes: 0,
  completedLateToleranceMinutes: 0,
  nextHourMinutes: 60,
  nextFourHoursMinutes: 240,
};

const context = {
  shiftId: "late",
  shiftStartAt: "2026-07-13T14:00:00.000Z",
  shiftEndAt: "2026-07-13T20:00:00.000Z",
  operationalDate: "2026-07-13",
  timezone: "Europe/Dublin",
};

function classify(item, now = "2026-07-13T15:00:00.000Z") {
  const dueMs = Date.parse(item.deferredUntil && Date.parse(item.deferredUntil) > Date.parse(now) ? item.deferredUntil : item.dueAt);
  const nowMs = Date.parse(now);
  const completedMs = item.effectiveCompletedAt ? Date.parse(item.effectiveCompletedAt) : item.completedAt ? Date.parse(item.completedAt) : NaN;
  const active = !["completed", "cancelled", "not_applicable", "discontinued"].includes(item.persistedStatus);
  const isDueNow = active && dueMs >= nowMs && dueMs <= nowMs + policy.dueNowEarlyMinutes * 60000;
  const isInNextHour = active && dueMs > nowMs && dueMs <= nowMs + policy.nextHourMinutes * 60000;
  const isInNextFourHours = active && dueMs > nowMs && dueMs <= nowMs + policy.nextFourHoursMinutes * 60000;
  const isDueThisShift = active && dueMs >= Date.parse(context.shiftStartAt) && dueMs < Date.parse(context.shiftEndAt);
  const isDueToday = active && item.dueAt.startsWith(context.operationalDate);
  const isMissed = item.persistedStatus === "missed";
  const isCompletedLate = item.persistedStatus === "completed" && completedMs > dueMs;
  const isOverdue = active && !isMissed && !isDueNow && dueMs < nowMs;
  let primaryStatus = "upcoming";
  if (item.persistedStatus === "completed") primaryStatus = isCompletedLate ? "completed_late" : "completed_on_time";
  else if (item.persistedStatus === "missed") primaryStatus = "missed";
  else if (item.persistedStatus === "cancelled") primaryStatus = "cancelled";
  else if (item.persistedStatus === "discontinued") primaryStatus = "discontinued";
  else if (item.persistedStatus === "deferred") primaryStatus = "deferred";
  else if (isOverdue) primaryStatus = "overdue";
  else if (isDueNow) primaryStatus = "due_now";
  else if (isInNextHour) primaryStatus = "next_hour";
  else if (isInNextFourHours) primaryStatus = "next_four_hours";
  else if (isDueThisShift) primaryStatus = "due_this_shift";
  else if (isDueToday) primaryStatus = "due_today";
  return { primaryStatus, isOverdue, isDueNow, isInNextHour, isInNextFourHours, isDueThisShift, isDueToday, isMissed, isCompletedLate };
}

function test(name, fn) {
  fn();
  console.log(`PASS ${name}`);
}

test("Overdue is active due before now and not missed", () => {
  const result = classify({ dueAt: "2026-07-13T14:00:00.000Z", persistedStatus: "scheduled" });
  assert.equal(result.primaryStatus, "overdue");
  assert.equal(result.isMissed, false);
});

test("Due now preserves current thirty minute early window", () => {
  assert.equal(classify({ dueAt: "2026-07-13T15:30:00.000Z", persistedStatus: "scheduled" }).primaryStatus, "due_now");
});

test("Next hour is inclusive at sixty minutes", () => {
  assert.equal(classify({ dueAt: "2026-07-13T16:00:00.000Z", persistedStatus: "scheduled" }).primaryStatus, "next_hour");
});

test("Next four hours includes midnight-crossing future work", () => {
  assert.equal(classify({ dueAt: "2026-07-13T23:00:00.000Z", persistedStatus: "scheduled" }, "2026-07-13T19:00:00.000Z").isInNextFourHours, true);
});

test("Due this shift uses shift boundaries", () => {
  assert.equal(classify({ dueAt: "2026-07-13T18:00:00.000Z", persistedStatus: "scheduled" }, "2026-07-13T16:30:00.000Z").isDueThisShift, true);
});

test("Missed is a persisted workflow outcome", () => {
  const result = classify({ dueAt: "2026-07-13T10:00:00.000Z", persistedStatus: "missed" });
  assert.equal(result.primaryStatus, "missed");
  assert.equal(result.isOverdue, false);
});

test("Completed late uses effective completion time", () => {
  assert.equal(classify({ dueAt: "2026-07-13T10:00:00.000Z", persistedStatus: "completed", effectiveCompletedAt: "2026-07-13T10:05:00.000Z", completedAt: "2026-07-13T10:30:00.000Z" }).primaryStatus, "completed_late");
});

test("Completed on time is not currently overdue", () => {
  const result = classify({ dueAt: "2026-07-13T10:00:00.000Z", persistedStatus: "completed", effectiveCompletedAt: "2026-07-13T09:55:00.000Z" });
  assert.equal(result.primaryStatus, "completed_on_time");
  assert.equal(result.isOverdue, false);
});

test("Cancelled and discontinued are inactive", () => {
  assert.equal(classify({ dueAt: "2026-07-13T10:00:00.000Z", persistedStatus: "cancelled" }).primaryStatus, "cancelled");
  assert.equal(classify({ dueAt: "2026-07-13T10:00:00.000Z", persistedStatus: "discontinued" }).primaryStatus, "discontinued");
});

test("Deferred work uses deferred status rather than overdue", () => {
  assert.equal(classify({ dueAt: "2026-07-13T10:00:00.000Z", deferredUntil: "2026-07-13T17:00:00.000Z", persistedStatus: "deferred" }).primaryStatus, "deferred");
});

console.log("Due-time classifier regression suite passed.");
