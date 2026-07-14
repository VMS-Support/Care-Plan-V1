import type {
  StopAndWatchActionContext,
  StopAndWatchConcernCode,
  StopAndWatchEvent,
  StopAndWatchRepository,
  StopAndWatchSubmission,
} from "./stopAndWatchTypes";

const RLT_BY_CODE: Partial<Record<StopAndWatchConcernCode, string[]>> = {
  ate_or_drank_less: ["eating_and_drinking"],
  toilet_pattern_changed: ["elimination"],
  breathing_changed: ["breathing"],
  pain_or_discomfort: ["comfort"],
  walking_transfer_changed: ["mobilising"],
  sleep_or_drowsiness_changed: ["sleeping"],
  confused_or_agitated: ["communication", "maintaining_safe_environment"],
  skin_or_colour_changed: ["personal_cleansing_and_dressing"],
};

export function submitStopAndWatchConcern(input: Omit<StopAndWatchSubmission, "id" | "submittedAt" | "submittedByUserAccountId" | "submittedByStaffMemberId" | "status" | "rltDomainIds" | "createdAt" | "updatedAt">, repository: StopAndWatchRepository, context: StopAndWatchActionContext, createId: () => string) {
  requireCapability(context, "stop_and_watch.submit");
  const existing = repository.stopAndWatchSubmissions.find((item) => item.clientRequestId === input.clientRequestId && item.nursingHomeId === input.nursingHomeId);
  if (existing) return existing;
  if (!input.concernCodes.length) throw new Error("At least one STOP and WATCH concern is required.");
  const submission: StopAndWatchSubmission = {
    ...input,
    id: createId(),
    submittedAt: context.occurredAt,
    submittedByUserAccountId: context.userAccountId,
    submittedByStaffMemberId: context.staffMemberId,
    status: "submitted",
    rltDomainIds: mapStopAndWatchToRlt(input.concernCodes),
    createdAt: context.occurredAt,
    updatedAt: context.occurredAt,
  };
  repository.stopAndWatchSubmissions = [submission, ...repository.stopAndWatchSubmissions];
  repository.stopAndWatchEvents.push(event(createId(), "StopAndWatchSubmitted", submission, context, { concernCodes: input.concernCodes, immediateSafetyConcern: input.immediateSafetyConcern }));
  return submission;
}

export function acknowledgeStopAndWatchConcern(submissionId: string, repository: StopAndWatchRepository, context: StopAndWatchActionContext, createId: () => string) {
  requireCapability(context, "stop_and_watch.acknowledge");
  const submission = update(repository, submissionId, { status: "acknowledged", acknowledgedAt: context.occurredAt, acknowledgedByUserAccountId: context.userAccountId, updatedAt: context.occurredAt });
  repository.stopAndWatchEvents.push(event(createId(), "StopAndWatchAcknowledged", submission, context, {}));
  return submission;
}

export function reviewStopAndWatchConcern(submissionId: string, reviewOutcome: string, repository: StopAndWatchRepository, context: StopAndWatchActionContext, createId: () => string, deteriorationIssueId?: string) {
  requireCapability(context, "stop_and_watch.review");
  const status = deteriorationIssueId ? "escalated" : "reviewed";
  const submission = update(repository, submissionId, { status, reviewedAt: context.occurredAt, reviewedByUserAccountId: context.userAccountId, reviewOutcome, deteriorationIssueId, updatedAt: context.occurredAt });
  repository.stopAndWatchEvents.push(event(createId(), deteriorationIssueId ? "StopAndWatchEscalated" : "StopAndWatchReviewed", submission, context, { issueId: deteriorationIssueId }));
  return submission;
}

export function resolveStopAndWatchConcern(submissionId: string, repository: StopAndWatchRepository, context: StopAndWatchActionContext, createId: () => string) {
  requireCapability(context, "stop_and_watch.resolve");
  const submission = update(repository, submissionId, { status: "resolved", updatedAt: context.occurredAt });
  repository.stopAndWatchEvents.push(event(createId(), "StopAndWatchResolved", submission, context, {}));
  return submission;
}

export function mapStopAndWatchToRlt(codes: StopAndWatchConcernCode[]) {
  return [...new Set(codes.flatMap((code) => RLT_BY_CODE[code] ?? []))];
}

function update(repository: StopAndWatchRepository, id: string, patch: Partial<StopAndWatchSubmission>) {
  const current = repository.stopAndWatchSubmissions.find((item) => item.id === id);
  if (!current) throw new Error("STOP and WATCH concern was not found.");
  const next = { ...current, ...patch } as StopAndWatchSubmission;
  repository.stopAndWatchSubmissions = repository.stopAndWatchSubmissions.map((item) => item.id === id ? next : item);
  return next;
}

function requireCapability(context: StopAndWatchActionContext, capability: string) {
  if (!context.capabilities.includes(capability)) throw new Error(`Missing capability: ${capability}`);
}

function event(id: string, type: StopAndWatchEvent["type"], submission: StopAndWatchSubmission, context: StopAndWatchActionContext, payload: Record<string, unknown>): StopAndWatchEvent {
  return { id, type, residentId: submission.residentId, nursingHomeId: submission.nursingHomeId, wardId: submission.wardId, submissionId: submission.id, issueId: submission.deteriorationIssueId, occurredAt: context.occurredAt, actorUserAccountId: context.userAccountId, correlationId: context.correlationId, payload };
}
