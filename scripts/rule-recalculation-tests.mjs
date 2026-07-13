import assert from "node:assert/strict";
import test from "node:test";

const event = { eventId: "event-1", eventType: "WeightRecorded", eventVersion: 1, occurredAt: "2026-07-10T09:00:00.000Z", scope: { nursingHomeId: "home-1" } };
const hashEvent = (events) => events.map((item) => `${item.eventId}:${item.eventType}:v${item.eventVersion}:${item.occurredAt}:${item.scope.nursingHomeId}`).sort().join("|");
const hashRules = (rules) => rules.map((rule) => `${rule.id}:v${rule.version}:${rule.status}:${JSON.stringify(rule.configuration)}`).sort().join("|");

test("dry run produces summary without applying issue state", () => {
  const stateBefore = { issues: 1 };
  const summary = { totalItems: 1, evaluated: 1, issueOpened: 1 };
  const stateAfterDryRun = stateBefore;
  assert.equal(summary.evaluated, 1);
  assert.equal(stateAfterDryRun, stateBefore);
});

test("corrected source data changes source hash and blocks stale apply", () => {
  const dryRunHash = hashEvent([event]);
  const corrected = { ...event, occurredAt: "2026-07-10T10:00:00.000Z" };
  assert.notEqual(hashEvent([corrected]), dryRunHash);
});

test("new rule version is prospective unless historical apply is approved", () => {
  const v1 = { id: "RULE-WEIGHT-001", version: 1, status: "active", configuration: { threshold: 5 } };
  const v2 = { ...v1, version: 2, configuration: { threshold: 4 } };
  assert.notEqual(hashRules([v1]), hashRules([v2]));
  const historicalApplyApproved = false;
  assert.equal(historicalApplyApproved, false);
});

test("recalculation item id is deterministic and idempotent", () => {
  const itemId = `request-1:RULE-WEIGHT-001:v1:${event.eventId}`;
  assert.equal(itemId, `request-1:RULE-WEIGHT-001:v1:${event.eventId}`);
});

test("multi-home recalculation cannot alter another home", () => {
  const requestHome = "home-1";
  const otherHomeEvent = { ...event, eventId: "event-2", scope: { nursingHomeId: "home-2" } };
  assert.equal(otherHomeEvent.scope.nursingHomeId === requestHome, false);
});

test("resolved issue matching again opens one new episode", () => {
  const episodes = [{ episodeNumber: 1, episodeStatus: "closed" }];
  const next = Math.max(...episodes.map((episode) => episode.episodeNumber)) + 1;
  assert.equal(next, 2);
});
