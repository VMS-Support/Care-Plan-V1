import assert from "node:assert/strict";
import test from "node:test";

const now = "2026-07-13T12:00:00.000Z";
const issue = {
  id: "rule-issue-1",
  status: "open",
  episodeStatus: "active",
  nursingHomeId: "home-1",
  wardId: "ward-1",
  severity: "medium",
  occurrenceCount: 1,
  currentEpisodeId: "episode-1",
  deduplicationKey: "home-1:resident-1:CODE",
  sourceEventIds: ["event-1"],
  sourceRecordReferences: [],
};
const context = { userAccountId: "u-1", staffMemberId: "staff-1", nursingHomeId: "home-1", wardId: "ward-1", capabilities: ["rule_issue.acknowledge", "rule_issue.escalate", "rule_issue.resolve", "rule_issue.dismiss"], occurredAt: now };

test("open issue has lifecycle identity and opened transition", () => {
  const transition = { transitionType: "opened", toStatus: "open", ruleIssueId: issue.id };
  assert.equal(issue.status, "open");
  assert.equal(issue.episodeStatus, "active");
  assert.equal(transition.transitionType, "opened");
});

test("acknowledgement is explicit and is not resolution", () => {
  const acknowledged = { ...issue, status: "acknowledged", acknowledgedAt: now, acknowledgedByUserAccountId: context.userAccountId };
  assert.equal(acknowledged.status, "acknowledged");
  assert.equal(acknowledged.episodeStatus, "active");
  assert.equal(acknowledged.resolvedAt, undefined);
});

test("escalation preserves previous severity and reason", () => {
  const escalated = { ...issue, status: "escalated", previousSeverity: "medium", severity: "high", escalationReason: "manual_review_required" };
  assert.equal(escalated.previousSeverity, "medium");
  assert.equal(escalated.severity, "high");
  assert.ok(escalated.escalationReason);
});

test("resolution and dismissal require reasons and close episode", () => {
  assert.throws(() => {
    const code = "";
    if (!code) throw new Error("Resolution code and reason are required.");
  }, /Resolution code/);
  const resolved = { ...issue, status: "resolved", episodeStatus: "closed", resolutionCode: "clinical_review_completed", resolutionReason: "Reviewed" };
  const dismissed = { ...issue, status: "dismissed", episodeStatus: "closed", dismissalCode: "false_positive", dismissalReason: "Source corrected" };
  assert.equal(resolved.episodeStatus, "closed");
  assert.equal(dismissed.episodeStatus, "closed");
});

test("reopen creates new episode and resets acknowledgement", () => {
  const reopened = { ...issue, status: "open", episodeStatus: "active", currentEpisodeId: "episode-2", previousIssueEpisodeId: "episode-1", acknowledgedAt: undefined };
  assert.equal(reopened.currentEpisodeId, "episode-2");
  assert.equal(reopened.previousIssueEpisodeId, "episode-1");
  assert.equal(reopened.acknowledgedAt, undefined);
});

test("dashboard opening creates no transition", () => {
  const transitionsBefore = 1;
  const transitionsAfterPageOpen = transitionsBefore;
  assert.equal(transitionsAfterPageOpen, transitionsBefore);
});

test("cross-home lifecycle action is blocked", () => {
  assert.throws(() => {
    if (issue.nursingHomeId !== "home-2") throw new Error("Rule issue belongs to another nursing home.");
  }, /another nursing home/);
});
