import type { WorkItem } from "@/domain/work/workTypes";
import { RLT_DOMAINS, RLT_DOMAIN_BY_ID, type RltDomainId, type RltDomainKey } from "./rlt";
import { getCarePlanItemsByRltDomain, type CarePlanSelectorData } from "./rltSelectors";

export type RltDependencyLevel =
  | "independent"
  | "prompting_required"
  | "supervision_required"
  | "assistance_required"
  | "fully_dependent";
export type RltDependencyValue = RltDependencyLevel | null;
export type RltDependencyReasonCode =
  | "initial_assessment"
  | "routine_review"
  | "condition_improved"
  | "condition_deteriorated"
  | "post_hospital_return"
  | "post_incident_review"
  | "assessment_result"
  | "care_plan_review"
  | "resident_choice_or_preference"
  | "correction"
  | "other";
export type RltDependencySource =
  | "nurse_assessment"
  | "comprehensive_assessment"
  | "care_plan_review"
  | "dependency_review"
  | "legacy_migration"
  | "manual_clinical_entry";

export const RLT_DEPENDENCY_LEVELS: readonly RltDependencyLevel[] = [
  "independent",
  "prompting_required",
  "supervision_required",
  "assistance_required",
  "fully_dependent",
] as const;
export const RLT_DEPENDENCY_LABELS: Record<RltDependencyLevel, string> = {
  independent: "Independent",
  prompting_required: "Prompting Required",
  supervision_required: "Supervision Required",
  assistance_required: "Assistance Required",
  fully_dependent: "Fully Dependent",
};
export const RLT_DEPENDENCY_DEFINITIONS: Record<RltDependencyLevel, string> = {
  independent: "Completes the activity safely without prompting, supervision or physical assistance; independently used equipment is compatible with this level.",
  prompting_required: "Completes the activity with verbal reminders, cueing, encouragement or orientation.",
  supervision_required: "Performs the activity with staff presence, observation or standby support for safety or immediate guidance.",
  assistance_required: "Requires partial physical help, active staff support or staff completion of part of the activity.",
  fully_dependent: "Requires staff to perform or provide almost all aspects of the activity.",
};

export interface DependencyEvidenceReference {
  entityType:
    | "assessment"
    | "care_plan_item"
    | "care_plan_review"
    | "observation"
    | "daily_care"
    | "clinical_note"
    | "manual_review"
    | "other";
  entityId: string;
  displayLabel?: string;
  occurredAt?: string;
}

export interface ResidentRltDependency {
  id: string;
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  rltDomainId: RltDomainId;
  rltDomainKey: RltDomainKey;
  dependencyLevel: RltDependencyLevel;
  effectiveFrom: string;
  effectiveTo?: string;
  status: "current" | "superseded" | "inactive";
  rationale?: string;
  reasonCode: RltDependencyReasonCode;
  reasonText?: string;
  evidenceReferences: DependencyEvidenceReference[];
  source: RltDependencySource;
  recordedAt: string;
  recordedByUserAccountId: string;
  recordedByStaffMemberId?: string;
  reviewedAt?: string;
  reviewedByStaffMemberId?: string;
  nextReviewDate?: string;
  createdAt: string;
  updatedAt: string;
  supersedesDependencyId?: string;
  correctionOfDependencyId?: string;
  migrationMetadata?: { legacyValue: string; mappingStatus: "mapped" | "ambiguous" | "unmapped" };
}

export interface RltDependencyReview {
  id: string;
  dependencyId: string;
  residentId: string;
  nursingHomeId: string;
  rltDomainId: RltDomainId;
  levelConfirmed: RltDependencyLevel;
  rationale?: string;
  reviewedAt: string;
  reviewedByUserAccountId: string;
  reviewedByStaffMemberId?: string;
  nextReviewDate?: string;
  evidenceReferences: DependencyEvidenceReference[];
}

export interface RltDependencyAuditEntry {
  id: string;
  action: "recorded" | "changed" | "reviewed" | "corrected" | "inactivated";
  dependencyRecordId: string;
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  rltDomainId: RltDomainId;
  previousLevel?: RltDependencyLevel;
  newLevel?: RltDependencyLevel;
  effectiveAt: string;
  reasonCode: RltDependencyReasonCode;
  reasonText?: string;
  actorUserAccountId: string;
  actorStaffMemberId?: string;
  evidenceReferences: DependencyEvidenceReference[];
  occurredAt: string;
}

export interface RltDependencyEvent {
  id: string;
  eventType: "RltDependencyRecorded" | "RltDependencyChanged" | "RltDependencyReviewed" | "RltDependencyCorrected";
  dependencyRecordId: string;
  residentId: string;
  nursingHomeId: string;
  wardId?: string;
  rltDomainId: RltDomainId;
  previousLevel?: RltDependencyLevel;
  currentLevel: RltDependencyLevel;
  effectiveAt: string;
  recordedAt: string;
  actorUserAccountId: string;
  actorStaffMemberId?: string;
  reasonCode: RltDependencyReasonCode;
  sourceEvidenceReferences: DependencyEvidenceReference[];
  correlationId: string;
}

export interface RltDependencyState {
  records: ResidentRltDependency[];
  reviews: RltDependencyReview[];
  audit: RltDependencyAuditEntry[];
  events: RltDependencyEvent[];
}

export interface RltDependencyContext {
  userAccountId: string;
  staffMemberId?: string;
  nursingHomeId: string;
  wardId?: string;
  capabilities: string[];
  occurredAt: string;
  correlationId: string;
  residentExists: (residentId: string) => boolean;
  residentBelongsToHome: (residentId: string, nursingHomeId: string) => boolean;
  evidenceBelongsToResident?: (reference: DependencyEvidenceReference, residentId: string, nursingHomeId: string) => boolean;
}

export interface RecordRltDependencyInput {
  residentId: string;
  rltDomainId: RltDomainId;
  dependencyLevel: RltDependencyLevel;
  effectiveFrom: string;
  rationale?: string;
  reasonCode: RltDependencyReasonCode;
  reasonText?: string;
  evidenceReferences?: DependencyEvidenceReference[];
  source: RltDependencySource;
  nextReviewDate?: string;
}

const isDate = (value: string) => Number.isFinite(Date.parse(value));
const stablePart = (value: string) => value.replace(/[^a-zA-Z0-9_-]+/g, "-").toLowerCase();
const currentRecord = (state: RltDependencyState, residentId: string, domainId: RltDomainId) =>
  state.records.find((record) => record.residentId === residentId && record.rltDomainId === domainId && record.status === "current");

function requireCapability(context: RltDependencyContext, capability: string) {
  if (!context.capabilities.includes(capability)) throw new Error(`Missing capability: ${capability}`);
}

function validateInput(input: RecordRltDependencyInput, context: RltDependencyContext) {
  if (!context.residentExists(input.residentId)) throw new Error("Resident does not exist.");
  if (!context.residentBelongsToHome(input.residentId, context.nursingHomeId)) throw new Error("Cross-home dependency record is prohibited.");
  const domain = RLT_DOMAIN_BY_ID[input.rltDomainId];
  if (!domain?.active) throw new Error("RLT domain is invalid or inactive.");
  if (!RLT_DEPENDENCY_LEVELS.includes(input.dependencyLevel)) throw new Error("Dependency level is invalid.");
  if (!isDate(input.effectiveFrom)) throw new Error("Effective date is invalid.");
  if (input.nextReviewDate && (!isDate(input.nextReviewDate) || Date.parse(input.nextReviewDate) < Date.parse(input.effectiveFrom))) throw new Error("Next review date cannot precede the effective date.");
  if (!input.reasonCode) throw new Error("A dependency reason is required.");
  if (input.reasonCode === "other" && !input.reasonText?.trim()) throw new Error("Reason text is required for other.");
  for (const reference of input.evidenceReferences || []) {
    if (!reference.entityId) throw new Error("Evidence entity ID is required.");
    if (context.evidenceBelongsToResident && !context.evidenceBelongsToResident(reference, input.residentId, context.nursingHomeId)) throw new Error("Evidence does not belong to the resident and home.");
  }
}

function appendAuditAndEvent(state: RltDependencyState, record: ResidentRltDependency, previousLevel: RltDependencyLevel | undefined, action: RltDependencyAuditEntry["action"], eventType: RltDependencyEvent["eventType"], context: RltDependencyContext) {
  state.audit.push({
    id: `dependency-audit:${record.id}:${state.audit.length + 1}`,
    action,
    dependencyRecordId: record.id,
    residentId: record.residentId,
    nursingHomeId: record.nursingHomeId,
    wardId: record.wardId,
    rltDomainId: record.rltDomainId,
    previousLevel,
    newLevel: record.dependencyLevel,
    effectiveAt: record.effectiveFrom,
    reasonCode: record.reasonCode,
    reasonText: record.reasonText,
    actorUserAccountId: context.userAccountId,
    actorStaffMemberId: context.staffMemberId,
    evidenceReferences: record.evidenceReferences,
    occurredAt: context.occurredAt,
  });
  state.events.push({
    id: `dependency-event:${record.id}:${state.events.length + 1}`,
    eventType,
    dependencyRecordId: record.id,
    residentId: record.residentId,
    nursingHomeId: record.nursingHomeId,
    wardId: record.wardId,
    rltDomainId: record.rltDomainId,
    previousLevel,
    currentLevel: record.dependencyLevel,
    effectiveAt: record.effectiveFrom,
    recordedAt: context.occurredAt,
    actorUserAccountId: context.userAccountId,
    actorStaffMemberId: context.staffMemberId,
    reasonCode: record.reasonCode,
    sourceEvidenceReferences: record.evidenceReferences,
    correlationId: context.correlationId,
  });
}

function createRecord(input: RecordRltDependencyInput, context: RltDependencyContext, previous?: ResidentRltDependency): ResidentRltDependency {
  const domain = RLT_DOMAIN_BY_ID[input.rltDomainId];
  return {
    id: `dependency:${stablePart(input.residentId)}:${domain.key}:${Date.parse(context.occurredAt)}`,
    residentId: input.residentId,
    nursingHomeId: context.nursingHomeId,
    wardId: context.wardId,
    rltDomainId: domain.id,
    rltDomainKey: domain.key,
    dependencyLevel: input.dependencyLevel,
    effectiveFrom: input.effectiveFrom,
    status: "current",
    rationale: input.rationale,
    reasonCode: input.reasonCode,
    reasonText: input.reasonText,
    evidenceReferences: input.evidenceReferences || [],
    source: input.source,
    recordedAt: context.occurredAt,
    recordedByUserAccountId: context.userAccountId,
    recordedByStaffMemberId: context.staffMemberId,
    nextReviewDate: input.nextReviewDate,
    createdAt: context.occurredAt,
    updatedAt: context.occurredAt,
    supersedesDependencyId: previous?.id,
  };
}

export function recordRltDependency(state: RltDependencyState, input: RecordRltDependencyInput, context: RltDependencyContext) {
  requireCapability(context, "rlt_dependency.record");
  validateInput(input, context);
  if (currentRecord(state, input.residentId, input.rltDomainId)) throw new Error("A current dependency record already exists for this resident and domain.");
  const record = createRecord(input, context);
  state.records.push(record);
  appendAuditAndEvent(state, record, undefined, "recorded", "RltDependencyRecorded", context);
  return record;
}

export function changeRltDependency(state: RltDependencyState, input: RecordRltDependencyInput, context: RltDependencyContext) {
  requireCapability(context, "rlt_dependency.record");
  validateInput(input, context);
  const previous = currentRecord(state, input.residentId, input.rltDomainId);
  if (!previous) throw new Error("No current dependency record exists to change.");
  if (previous.dependencyLevel === input.dependencyLevel) throw new Error("Use formal review when the dependency level is unchanged.");
  previous.status = "superseded";
  previous.effectiveTo = input.effectiveFrom;
  previous.updatedAt = context.occurredAt;
  const record = createRecord(input, context, previous);
  state.records.push(record);
  appendAuditAndEvent(state, record, previous.dependencyLevel, "changed", "RltDependencyChanged", context);
  return record;
}

export function reviewRltDependency(state: RltDependencyState, input: { residentId: string; rltDomainId: RltDomainId; rationale?: string; evidenceReferences?: DependencyEvidenceReference[]; nextReviewDate?: string }, context: RltDependencyContext) {
  requireCapability(context, "rlt_dependency.review");
  const record = currentRecord(state, input.residentId, input.rltDomainId);
  if (!record || record.nursingHomeId !== context.nursingHomeId) throw new Error("Current dependency record not found in scope.");
  if (input.nextReviewDate && Date.parse(input.nextReviewDate) < Date.parse(record.effectiveFrom)) throw new Error("Next review date cannot precede the effective date.");
  const references = input.evidenceReferences || [];
  for (const reference of references) if (context.evidenceBelongsToResident && !context.evidenceBelongsToResident(reference, input.residentId, context.nursingHomeId)) throw new Error("Evidence does not belong to the resident and home.");
  const review: RltDependencyReview = {
    id: `dependency-review:${record.id}:${state.reviews.length + 1}`,
    dependencyId: record.id,
    residentId: record.residentId,
    nursingHomeId: record.nursingHomeId,
    rltDomainId: record.rltDomainId,
    levelConfirmed: record.dependencyLevel,
    rationale: input.rationale,
    reviewedAt: context.occurredAt,
    reviewedByUserAccountId: context.userAccountId,
    reviewedByStaffMemberId: context.staffMemberId,
    nextReviewDate: input.nextReviewDate,
    evidenceReferences: references,
  };
  state.reviews.push(review);
  record.reviewedAt = context.occurredAt;
  record.reviewedByStaffMemberId = context.staffMemberId;
  record.nextReviewDate = input.nextReviewDate || record.nextReviewDate;
  record.updatedAt = context.occurredAt;
  const reviewRecord = { ...record, reasonCode: "routine_review" as const, reasonText: input.rationale, evidenceReferences: references.length ? references : record.evidenceReferences };
  appendAuditAndEvent(state, reviewRecord, record.dependencyLevel, "reviewed", "RltDependencyReviewed", context);
  return review;
}

export function correctRltDependency(state: RltDependencyState, input: RecordRltDependencyInput & { correctionReason: string }, context: RltDependencyContext) {
  requireCapability(context, "rlt_dependency.correct");
  if (!input.correctionReason.trim()) throw new Error("Correction reason is required.");
  validateInput({ ...input, reasonCode: "correction", reasonText: input.correctionReason }, context);
  const previous = currentRecord(state, input.residentId, input.rltDomainId);
  if (!previous) throw new Error("No current dependency record exists to correct.");
  previous.status = "superseded";
  previous.effectiveTo = context.occurredAt;
  previous.updatedAt = context.occurredAt;
  const record = createRecord({ ...input, reasonCode: "correction", reasonText: input.correctionReason }, context, previous);
  record.correctionOfDependencyId = previous.id;
  state.records.push(record);
  appendAuditAndEvent(state, record, previous.dependencyLevel, "corrected", "RltDependencyCorrected", context);
  return record;
}

export interface ResidentRltDependencySummary {
  residentId: string;
  domains: Array<{
    rltDomainId: RltDomainId;
    rltDomainKey: RltDomainKey;
    displayName: string;
    displayOrder: number;
    dependencyLevel: RltDependencyValue;
    lastReviewedAt?: string;
    nextReviewDate?: string;
    activeCarePlanCount: number;
    hasAssessmentGuidance: boolean;
  }>;
  completedDomainCount: number;
  unassessedDomainCount: number;
}

export function getResidentRltDependencySummary(state: RltDependencyState, residentId: string, nursingHomeId: string, input: { carePlans: CarePlanSelectorData; activeGuidanceDomainIds?: RltDomainId[] }): ResidentRltDependencySummary {
  const domains = RLT_DOMAINS.map((domain) => {
    const record = state.records.find((candidate) => candidate.residentId === residentId && candidate.nursingHomeId === nursingHomeId && candidate.rltDomainId === domain.id && candidate.status === "current");
    return {
      rltDomainId: domain.id,
      rltDomainKey: domain.key,
      displayName: domain.title,
      displayOrder: domain.displayOrder,
      dependencyLevel: record?.dependencyLevel || null,
      lastReviewedAt: record?.reviewedAt || record?.recordedAt,
      nextReviewDate: record?.nextReviewDate,
      activeCarePlanCount: getCarePlanItemsByRltDomain(input.carePlans, residentId, domain.id).filter((item) => item.facilityId === nursingHomeId).length,
      hasAssessmentGuidance: Boolean(input.activeGuidanceDomainIds?.includes(domain.id)),
    };
  });
  const completedDomainCount = domains.filter((domain) => domain.dependencyLevel !== null).length;
  return { residentId, domains, completedDomainCount, unassessedDomainCount: domains.length - completedDomainCount };
}

const LEGACY_DEPENDENCY_MAP: Record<string, RltDependencyLevel> = {
  independent: "independent",
  prompting: "prompting_required",
  prompts: "prompting_required",
  supervision: "supervision_required",
  "partial assistance": "assistance_required",
  "needs assistance": "assistance_required",
  "total care": "fully_dependent",
  "fully dependent": "fully_dependent",
};

export function mapLegacyRltDependencyValue(value: string) {
  const normalised = value.trim().toLowerCase();
  const dependencyLevel = LEGACY_DEPENDENCY_MAP[normalised];
  if (dependencyLevel) return { dependencyLevel, status: "mapped" as const, legacyValue: value, requiresClinicalReview: false };
  if (["dependent", "partial", "high dependency", "low dependency"].includes(normalised)) return { dependencyLevel: null, status: "ambiguous" as const, legacyValue: value, requiresClinicalReview: true };
  return { dependencyLevel: null, status: "unmapped" as const, legacyValue: value, requiresClinicalReview: true };
}

export function projectRltDependencyReviewToWorkItem(record: ResidentRltDependency, now: string, timeZone: string, policyEnabled: boolean): WorkItem | undefined {
  if (!policyEnabled || record.status !== "current" || !record.nextReviewDate) return undefined;
  const dueAt = `${record.nextReviewDate.slice(0, 10)}T09:00:00.000Z`;
  return {
    id: `work:dependency-review:${record.id}:${record.nextReviewDate.slice(0, 10)}`,
    workType: "care_plan_review",
    title: `Review ${RLT_DOMAIN_BY_ID[record.rltDomainId].title} dependency`,
    source: {
      sourceType: "clinical_rule",
      sourceModule: "rules",
      sourceEntityType: "rlt_dependency_review_requirement",
      sourceEntityId: `${record.id}:${record.nextReviewDate.slice(0, 10)}`,
      parentEntityType: "rlt_dependency",
      parentEntityId: record.id,
      route: `/residents/${record.residentId}?rltDomainId=${record.rltDomainId}`,
      completionOwner: "rlt_dependency_service",
      recreationPolicy: "deterministic",
      createdAt: now,
    },
    nursingHomeId: record.nursingHomeId,
    wardId: record.wardId,
    residentId: record.residentId,
    schedule: { scheduleType: "triggered", dueAt, effectiveDueAt: dueAt, originalDueAt: dueAt, timeZone },
    persistedStatus: "scheduled",
    assignment: { assignmentType: "role", assignedRoleKey: "nurse", assignedWardId: record.wardId, assignmentStatus: "active", assignedAt: now },
    priority: "important",
    careContext: { rltDomainId: record.rltDomainId },
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

export function validateRltDependencies(state: RltDependencyState, input: { residentHomeById: Record<string, string>; evidenceIsValid?: (reference: DependencyEvidenceReference, record: ResidentRltDependency) => boolean }) {
  const issues: { code: string; recordId?: string }[] = [];
  const currentKeys = new Set<string>();
  for (const record of state.records) {
    if (!RLT_DEPENDENCY_LEVELS.includes(record.dependencyLevel)) issues.push({ code: "invalid_dependency_level", recordId: record.id });
    if (!RLT_DOMAIN_BY_ID[record.rltDomainId]?.active) issues.push({ code: "invalid_or_inactive_domain", recordId: record.id });
    if (input.residentHomeById[record.residentId] !== record.nursingHomeId) issues.push({ code: "cross_home_dependency", recordId: record.id });
    if (!record.recordedByUserAccountId) issues.push({ code: "missing_actor", recordId: record.id });
    if (!isDate(record.effectiveFrom)) issues.push({ code: "missing_or_invalid_effective_date", recordId: record.id });
    if (!record.reasonCode || record.reasonCode === "other" && !record.reasonText) issues.push({ code: "missing_change_reason", recordId: record.id });
    if (record.nextReviewDate && Date.parse(record.nextReviewDate) < Date.parse(record.effectiveFrom)) issues.push({ code: "next_review_before_effective", recordId: record.id });
    if (record.status === "current") {
      const key = `${record.residentId}:${record.rltDomainId}`;
      if (currentKeys.has(key)) issues.push({ code: "duplicate_current_dependency", recordId: record.id });
      currentKeys.add(key);
    }
    for (const reference of record.evidenceReferences) if (input.evidenceIsValid && !input.evidenceIsValid(reference, record)) issues.push({ code: "invalid_evidence_reference", recordId: record.id });
  }
  return {
    issues,
    duplicateCurrentRecords: issues.filter((issue) => issue.code === "duplicate_current_dependency").length,
    invalidValues: issues.filter((issue) => issue.code === "invalid_dependency_level").length,
    invalidDomains: issues.filter((issue) => issue.code === "invalid_or_inactive_domain").length,
    crossHomeRecords: issues.filter((issue) => issue.code === "cross_home_dependency").length,
    allTwelveDomainRegistryMatch: RLT_DOMAINS.length === 12,
  };
}
