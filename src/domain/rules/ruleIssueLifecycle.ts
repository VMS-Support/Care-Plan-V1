import type {
  ProposedRuleOutput,
  RuleEngineState,
  RuleEvaluationResult,
  RuleGeneratedOutput,
  RuleIssue,
  RuleIssueActionContext,
  RuleIssueEpisode,
  RuleIssueStatus,
  RuleIssueTransition,
  RuleSeverity,
} from "./ruleTypes";

export const RULE_ISSUE_CAPABILITIES = {
  view: "rule_issue.view",
  acknowledge: "rule_issue.acknowledge",
  escalate: "rule_issue.escalate",
  resolve: "rule_issue.resolve",
  dismiss: "rule_issue.dismiss",
  reopen: "rule_issue.reopen",
  viewHistory: "rule_issue.view_history",
  overrideAutomaticResolution: "rule_issue.override_automatic_resolution",
} as const;

const severityRank: Record<RuleSeverity, number> = { information: 0, low: 1, medium: 2, high: 3, critical: 4 };
const issueId = (key: string) => `rule-issue-${key.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`;
const episodeId = (issue: string, number: number) => `${issue}-episode-${number}`;
const transitionId = (issue: string, type: string, at: string) => `${issue}-${type}-${at.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`;

export const ALLOWED_RULE_ISSUE_TRANSITIONS: Record<RuleIssueStatus, RuleIssueStatus[]> = {
  open: ["acknowledged", "escalated", "resolved", "dismissed"],
  acknowledged: ["escalated", "resolved", "dismissed"],
  escalated: ["acknowledged", "resolved", "dismissed"],
  resolved: ["open"],
  dismissed: ["open"],
};

function assertCapability(context: RuleIssueActionContext, capability: string) {
  if (!context.capabilities.includes(capability)) throw new Error(`Missing capability: ${capability}`);
}

function assertScope(issue: RuleIssue, context: RuleIssueActionContext) {
  if (issue.nursingHomeId !== context.nursingHomeId) throw new Error("Rule issue belongs to another nursing home.");
  if (context.wardId && issue.wardId && issue.wardId !== context.wardId) throw new Error("Rule issue belongs to another ward.");
}

function transition(issue: RuleIssue, toStatus: RuleIssueStatus, type: RuleIssueTransition["transitionType"], at: string, actorType: RuleIssueTransition["actorType"], reasonCode?: string, reasonText?: string, context?: Partial<RuleIssueActionContext>, decision?: RuleEvaluationResult): RuleIssueTransition {
  if (!ALLOWED_RULE_ISSUE_TRANSITIONS[issue.status]?.includes(toStatus)) throw new Error(`Invalid rule issue transition: ${issue.status} to ${toStatus}`);
  return {
    id: transitionId(issue.id, type, at),
    ruleIssueId: issue.id,
    episodeId: issue.currentEpisodeId,
    fromStatus: issue.status,
    toStatus,
    transitionType: type,
    occurredAt: at,
    actorType,
    userAccountId: context?.userAccountId,
    staffMemberId: context?.staffMemberId,
    ruleDecisionId: decision?.decisionId,
    sourceEventId: decision?.sourceEventId,
    reasonCode,
    reasonText,
  };
}

function openIssueFromOutput(decision: RuleEvaluationResult, output: ProposedRuleOutput, now: string): { issue: RuleIssue; episode: RuleIssueEpisode; transition: RuleIssueTransition } {
  const id = issueId(output.deduplicationKey);
  const epId = episodeId(id, 1);
  const issue: RuleIssue = {
    id,
    issueCode: output.outputCode,
    outputType: output.outputType,
    residentId: decision.residentId,
    nursingHomeId: decision.nursingHomeId,
    wardId: decision.wardId,
    ruleId: decision.ruleId,
    currentRuleVersion: decision.ruleVersion,
    deduplicationKey: output.deduplicationKey,
    status: "open",
    episodeStatus: "active",
    severity: output.severity,
    title: output.title,
    summary: output.summary,
    firstOpenedAt: now,
    lastMatchedAt: now,
    lastEvaluatedAt: now,
    occurrenceCount: 1,
    currentEpisodeId: epId,
    currentExplanation: decision.explanation,
    sourceEventIds: [decision.sourceEventId],
    sourceRecordReferences: decision.sourceRecordReferences,
    latestRuleDecisionId: decision.decisionId,
    createdAt: now,
    updatedAt: now,
  };
  const episode: RuleIssueEpisode = {
    id: epId,
    ruleIssueId: id,
    episodeNumber: 1,
    episodeStatus: "active",
    openedAt: now,
    openingDecisionId: decision.decisionId,
  };
  return {
    issue,
    episode,
    transition: {
      id: transitionId(id, "opened", now),
      ruleIssueId: id,
      episodeId: epId,
      toStatus: "open",
      transitionType: "opened",
      occurredAt: now,
      actorType: "rule",
      ruleDecisionId: decision.decisionId,
      sourceEventId: decision.sourceEventId,
    },
  };
}

function updateOpenIssue(issue: RuleIssue, decision: RuleEvaluationResult, output: ProposedRuleOutput, now: string): RuleIssue {
  const severityIncreased = severityRank[output.severity] > severityRank[issue.severity];
  return {
    ...issue,
    status: severityIncreased && issue.status !== "escalated" ? "escalated" : issue.status,
    previousSeverity: severityIncreased ? issue.severity : issue.previousSeverity,
    severity: severityIncreased ? output.severity : issue.severity,
    escalationLevel: severityIncreased ? (issue.escalationLevel || 0) + 1 : issue.escalationLevel,
    escalationReason: severityIncreased ? "severity_increased_by_rule" : issue.escalationReason,
    lastMatchedAt: now,
    lastEvaluatedAt: now,
    occurrenceCount: issue.occurrenceCount + 1,
    currentRuleVersion: decision.ruleVersion,
    title: output.title,
    summary: output.summary,
    currentExplanation: decision.explanation,
    sourceEventIds: issue.sourceEventIds.includes(decision.sourceEventId) ? issue.sourceEventIds : [decision.sourceEventId, ...issue.sourceEventIds],
    sourceRecordReferences: [
      ...issue.sourceRecordReferences,
      ...decision.sourceRecordReferences.filter((ref) => !issue.sourceRecordReferences.some((existing) => existing.recordId === ref.recordId)),
    ],
    latestRuleDecisionId: decision.decisionId,
    updatedAt: now,
  };
}

export function reconcileRuleIssues(decision: RuleEvaluationResult, state: Pick<RuleEngineState, "ruleIssues" | "ruleIssueEpisodes" | "ruleIssueTransitions">, now = decision.evaluatedAt) {
  let issues = [...(state.ruleIssues || [])];
  let episodes = [...(state.ruleIssueEpisodes || [])];
  let transitions = [...(state.ruleIssueTransitions || [])];
  for (const output of decision.proposedOutputs) {
    const activeIssue = issues.find((issue) => issue.deduplicationKey === output.deduplicationKey && issue.episodeStatus === "active");
    if (!activeIssue) {
      const opened = openIssueFromOutput(decision, output, now);
      issues = [opened.issue, ...issues];
      episodes = [opened.episode, ...episodes];
      transitions = [opened.transition, ...transitions];
      continue;
    }
    const before = activeIssue;
    const updated = updateOpenIssue(activeIssue, decision, output, now);
    issues = issues.map((issue) => issue.id === updated.id ? updated : issue);
    if (before.status !== updated.status && updated.status === "escalated") {
      transitions = [
        transition(before, "escalated", "escalated", now, "rule", "severity_increased", "Rule output severity increased.", undefined, decision),
        ...transitions,
      ];
    }
  }
  return { issues, episodes, transitions };
}

export function acknowledgeRuleIssue(issue: RuleIssue, context: RuleIssueActionContext, note?: string) {
  assertCapability(context, RULE_ISSUE_CAPABILITIES.acknowledge);
  assertScope(issue, context);
  if (issue.episodeStatus !== "active") throw new Error("Only active issues can be acknowledged.");
  if (issue.status === "acknowledged" && issue.acknowledgedByUserAccountId === context.userAccountId) {
    return { issue, transition: undefined };
  }
  const next = {
    ...issue,
    status: "acknowledged" as const,
    acknowledgedAt: context.occurredAt,
    acknowledgedByUserAccountId: context.userAccountId,
    acknowledgedByStaffMemberId: context.staffMemberId,
    acknowledgementNote: note,
    updatedAt: context.occurredAt,
  };
  return { issue: next, transition: transition(issue, "acknowledged", "acknowledged", context.occurredAt, "user", "acknowledged", note, context) };
}

export function escalateRuleIssue(issue: RuleIssue, context: RuleIssueActionContext, details: { level: number; reasonCode: string; reasonText?: string; toSeverity: RuleSeverity }) {
  assertCapability(context, RULE_ISSUE_CAPABILITIES.escalate);
  assertScope(issue, context);
  if (!details.reasonCode) throw new Error("Escalation reason is required.");
  const next = {
    ...issue,
    status: "escalated" as const,
    previousSeverity: issue.severity,
    severity: details.toSeverity,
    escalatedAt: context.occurredAt,
    escalatedByUserAccountId: context.userAccountId,
    escalationLevel: details.level,
    escalationReason: details.reasonText || details.reasonCode,
    updatedAt: context.occurredAt,
  };
  return { issue: next, transition: transition(issue, "escalated", "escalated", context.occurredAt, "user", details.reasonCode, details.reasonText, context) };
}

export function resolveRuleIssue(issue: RuleIssue, episode: RuleIssueEpisode, context: RuleIssueActionContext, details: { resolutionCode: string; resolutionReason: string; evidenceRecordIds?: string[] }) {
  assertCapability(context, RULE_ISSUE_CAPABILITIES.resolve);
  assertScope(issue, context);
  if (!details.resolutionCode || !details.resolutionReason) throw new Error("Resolution code and reason are required.");
  const nextIssue = {
    ...issue,
    status: "resolved" as const,
    episodeStatus: "closed" as const,
    resolvedAt: context.occurredAt,
    resolvedByUserAccountId: context.userAccountId,
    resolvedByStaffMemberId: context.staffMemberId,
    resolutionCode: details.resolutionCode,
    resolutionReason: details.resolutionReason,
    updatedAt: context.occurredAt,
  };
  const nextEpisode = { ...episode, episodeStatus: "closed" as const, closedAt: context.occurredAt, closingStatus: "resolved" as const };
  return { issue: nextIssue, episode: nextEpisode, transition: transition(issue, "resolved", "resolved", context.occurredAt, "user", details.resolutionCode, details.resolutionReason, context) };
}

export function dismissRuleIssue(issue: RuleIssue, episode: RuleIssueEpisode, context: RuleIssueActionContext, details: { dismissalCode: string; dismissalReason: string; dismissalExpiresAt?: string; dismissalScope?: RuleIssue["dismissalScope"] }) {
  assertCapability(context, RULE_ISSUE_CAPABILITIES.dismiss);
  assertScope(issue, context);
  if (!details.dismissalCode || !details.dismissalReason) throw new Error("Dismissal code and reason are required.");
  const nextIssue = {
    ...issue,
    status: "dismissed" as const,
    episodeStatus: "closed" as const,
    dismissedAt: context.occurredAt,
    dismissedByUserAccountId: context.userAccountId,
    dismissedByStaffMemberId: context.staffMemberId,
    dismissalCode: details.dismissalCode,
    dismissalReason: details.dismissalReason,
    dismissalExpiresAt: details.dismissalExpiresAt,
    dismissalScope: details.dismissalScope || "current_episode",
    updatedAt: context.occurredAt,
  };
  const nextEpisode = { ...episode, episodeStatus: "closed" as const, closedAt: context.occurredAt, closingStatus: "dismissed" as const };
  return { issue: nextIssue, episode: nextEpisode, transition: transition(issue, "dismissed", "dismissed", context.occurredAt, "user", details.dismissalCode, details.dismissalReason, context) };
}

export function reopenRuleIssue(issue: RuleIssue, episodes: RuleIssueEpisode[], decision: RuleEvaluationResult, output: ProposedRuleOutput, reason: string, now = decision.evaluatedAt) {
  if (issue.episodeStatus === "active") return { issue, episode: undefined, transition: undefined };
  const previousEpisode = episodes.filter((episode) => episode.ruleIssueId === issue.id).sort((a, b) => b.episodeNumber - a.episodeNumber)[0];
  const number = (previousEpisode?.episodeNumber || 0) + 1;
  const epId = episodeId(issue.id, number);
  const nextIssue: RuleIssue = {
    ...issue,
    status: "open",
    episodeStatus: "active",
    severity: output.severity,
    currentRuleVersion: decision.ruleVersion,
    title: output.title,
    summary: output.summary,
    lastMatchedAt: now,
    lastEvaluatedAt: now,
    occurrenceCount: issue.occurrenceCount + 1,
    acknowledgedAt: undefined,
    acknowledgedByUserAccountId: undefined,
    acknowledgedByStaffMemberId: undefined,
    currentEpisodeId: epId,
    previousIssueEpisodeId: previousEpisode?.id,
    reopenedAt: now,
    reopenedReason: reason,
    currentExplanation: decision.explanation,
    sourceEventIds: [decision.sourceEventId, ...issue.sourceEventIds],
    sourceRecordReferences: decision.sourceRecordReferences,
    latestRuleDecisionId: decision.decisionId,
    updatedAt: now,
  };
  const nextEpisode: RuleIssueEpisode = {
    id: epId,
    ruleIssueId: issue.id,
    episodeNumber: number,
    episodeStatus: "active",
    openedAt: now,
    openingDecisionId: decision.decisionId,
    previousEpisodeId: previousEpisode?.id,
  };
  return { issue: nextIssue, episode: nextEpisode, transition: transition(issue, "open", "reopened", now, "rule", "condition_matched_again", reason, undefined, decision) };
}

export function outputsFromIssues(issues: RuleIssue[]): RuleGeneratedOutput[] {
  return issues.map((issue) => ({
    id: issue.id.replace("rule-issue-", "rule-output-"),
    ruleId: issue.ruleId,
    ruleVersion: issue.currentRuleVersion,
    decisionId: issue.latestRuleDecisionId,
    sourceEventId: issue.sourceEventIds[0],
    outputType: issue.outputType === "risk" ? "risk_create_or_update" : issue.outputType,
    outputCode: issue.issueCode,
    title: issue.title,
    summary: issue.summary,
    severity: issue.severity,
    nursingHomeId: issue.nursingHomeId,
    residentId: issue.residentId,
    wardId: issue.wardId,
    deduplicationKey: issue.deduplicationKey,
    status: issue.episodeStatus === "active" ? "active" : issue.status === "dismissed" ? "dismissed" : "resolved",
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    resolvedAt: issue.resolvedAt,
    sourceRecordReferences: issue.sourceRecordReferences,
    explanation: issue.currentExplanation,
    occurrenceCount: issue.occurrenceCount,
  }));
}
