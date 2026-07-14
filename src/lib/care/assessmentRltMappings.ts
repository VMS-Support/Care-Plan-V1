import { recordAuditEvent } from "./auditFramework";
import type { Assessment, AssessmentStatus, AssessmentType, AuditRecord } from "./types";
import { RLT_DOMAIN_BY_ID, RLT_DOMAIN_BY_KEY, type RltDomainId, type RltDomainKey } from "./rlt";

export type MappingReviewStatus =
  | "draft"
  | "pending_nurse_review"
  | "pending_don_approval"
  | "approved"
  | "rejected"
  | "retired";
export type AssessmentRltMappingType = "primary" | "secondary" | "conditional";
export type SuggestedCarePlanningAction =
  | "review_existing_plan"
  | "consider_new_plan"
  | "no_automatic_action"
  | "clinical_review_required";

export interface AssessmentRltMappingCondition {
  conditionType:
    | "risk_level"
    | "score_range"
    | "answer_value"
    | "answer_present"
    | "clinical_flag"
    | "always";
  fieldKey?: string;
  operator?:
    | "equals"
    | "not_equals"
    | "greater_than"
    | "greater_than_or_equal"
    | "less_than"
    | "less_than_or_equal"
    | "between"
    | "contains";
  value?: string | number | boolean;
  minimum?: number;
  maximum?: number;
}

export interface AssessmentRltMapping {
  id: string;
  assessmentTypeId: string;
  assessmentTypeKey: AssessmentType;
  nursingHomeId?: string;
  rltDomainId: RltDomainId;
  rltDomainKey: RltDomainKey;
  mappingType: AssessmentRltMappingType;
  condition?: AssessmentRltMappingCondition;
  rationale: string;
  suggestedCarePlanningAction: SuggestedCarePlanningAction;
  status: MappingReviewStatus;
  version: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  reviewedByNurseStaffMemberIds: string[];
  nurseReviewedAt?: string;
  approvedByDonStaffMemberId?: string;
  donApprovedAt?: string;
  rejectionReason?: string;
  validationTestIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NurseMappingReview {
  id: string;
  mappingId: string;
  mappingVersion: number;
  decision: "agree" | "agree_with_changes" | "disagree" | "needs_discussion";
  comments: string;
  suggestedRltDomainIds?: RltDomainId[];
  suggestedConditionChanges?: AssessmentRltMappingCondition[];
  reviewerStaffMemberId: string;
  reviewedAt: string;
}

export interface AssessmentRltMappingState {
  mappings: AssessmentRltMapping[];
  nurseReviews: NurseMappingReview[];
  auditRecords: AuditRecord[];
}

const CREATED_AT = "2026-07-14T00:00:00.000Z";
type ProposedMapping = {
  assessmentType: AssessmentType;
  domainId: RltDomainId;
  mappingType: AssessmentRltMappingType;
  rationale: string;
  action?: SuggestedCarePlanningAction;
  condition?: AssessmentRltMappingCondition;
};

const proposedMappings: ProposedMapping[] = [
  {
    assessmentType: "barthel",
    domainId: "mobilisation",
    mappingType: "primary",
    rationale: "Functional independence may affect mobility support.",
  },
  {
    assessmentType: "waterlow",
    domainId: "personal_cleansing_dressing",
    mappingType: "primary",
    rationale: "Pressure-risk findings may affect skin and personal-care planning.",
  },
  {
    assessmentType: "waterlow",
    domainId: "mobilisation",
    mappingType: "conditional",
    rationale: "High pressure risk may warrant review of mobility-related care.",
    condition: { conditionType: "risk_level", operator: "contains", value: "high" },
  },
  {
    assessmentType: "abbey_pain",
    domainId: "personal_cleansing_dressing",
    mappingType: "primary",
    rationale: "Pain findings require clinical review in the context of personal care.",
    action: "clinical_review_required",
  },
  {
    assessmentType: "mna",
    domainId: "eating_drinking",
    mappingType: "primary",
    rationale: "Nutritional screening may affect Eating and Drinking care planning.",
  },
  {
    assessmentType: "norton",
    domainId: "personal_cleansing_dressing",
    mappingType: "primary",
    rationale: "Pressure-risk findings may affect skin and personal-care planning.",
  },
  {
    assessmentType: "nutrition",
    domainId: "eating_drinking",
    mappingType: "primary",
    rationale: "Nutrition assessment findings may affect Eating and Drinking care planning.",
  },
  {
    assessmentType: "pinch_me",
    domainId: "body_temperature",
    mappingType: "primary",
    rationale: "Clinical deterioration findings may affect temperature and infection monitoring.",
  },
  {
    assessmentType: "mmse",
    domainId: "communication",
    mappingType: "primary",
    rationale: "Cognitive findings may affect communication support.",
  },
  {
    assessmentType: "four_at",
    domainId: "communication",
    mappingType: "primary",
    rationale: "Delirium screening may affect communication support.",
  },
  {
    assessmentType: "four_at",
    domainId: "safe_environment",
    mappingType: "secondary",
    rationale: "Delirium risk may also affect environmental safety.",
  },
  {
    assessmentType: "gds15",
    domainId: "meaningful_activity",
    mappingType: "primary",
    rationale: "Mood findings may affect meaningful activity and engagement.",
  },
  {
    assessmentType: "cornell",
    domainId: "meaningful_activity",
    mappingType: "primary",
    rationale: "Mood findings may affect meaningful activity and engagement.",
  },
  {
    assessmentType: "must",
    domainId: "eating_drinking",
    mappingType: "primary",
    rationale: "Malnutrition risk may affect Eating and Drinking care planning.",
  },
  {
    assessmentType: "continence",
    domainId: "elimination",
    mappingType: "primary",
    rationale: "Continence findings may affect elimination support.",
  },
  {
    assessmentType: "pain_chart",
    domainId: "personal_cleansing_dressing",
    mappingType: "primary",
    rationale: "Pain findings require review against the affected activity of living.",
    action: "clinical_review_required",
  },
  {
    assessmentType: "falls",
    domainId: "safe_environment",
    mappingType: "primary",
    rationale: "Falls risk may affect environmental safety planning.",
  },
  {
    assessmentType: "falls",
    domainId: "mobilisation",
    mappingType: "secondary",
    rationale: "Falls risk may affect mobility and transfer support.",
  },
  {
    assessmentType: "abc",
    domainId: "safe_environment",
    mappingType: "primary",
    rationale: "Behavioural antecedents and consequences may affect safety planning.",
  },
  {
    assessmentType: "abs",
    domainId: "safe_environment",
    mappingType: "primary",
    rationale: "Behaviour severity findings may affect safety planning.",
  },
];

export const ASSESSMENT_RLT_MAPPING_REGISTRY: AssessmentRltMapping[] = proposedMappings.map(
  (mapping, index) => {
    const domain = RLT_DOMAIN_BY_ID[mapping.domainId];
    return {
      id: `assessment-rlt:${mapping.assessmentType}:${domain.key}:${mapping.mappingType}:v1`,
      assessmentTypeId: mapping.assessmentType,
      assessmentTypeKey: mapping.assessmentType,
      rltDomainId: domain.id,
      rltDomainKey: domain.key,
      mappingType: mapping.mappingType,
      condition:
        mapping.condition ||
        (mapping.mappingType === "conditional" ? undefined : { conditionType: "always" }),
      rationale: mapping.rationale,
      suggestedCarePlanningAction: mapping.action || "review_existing_plan",
      status: "pending_nurse_review",
      version: 1,
      reviewedByNurseStaffMemberIds: [],
      validationTestIds: [`assessment-rlt-regression:${index + 1}`],
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    };
  },
);

export interface AssessmentMappingEvaluationInput {
  assessmentId?: string;
  status?: AssessmentStatus | "voided";
  riskLevel?: string;
  totalScore?: number;
  scores?: Record<string, number>;
  answers?: Record<string, string | number | boolean | string[]>;
  clinicalFlags?: string[];
}

const comparable = (
  input: AssessmentMappingEvaluationInput,
  condition: AssessmentRltMappingCondition,
) => {
  if (condition.conditionType === "risk_level") return input.riskLevel;
  if (condition.conditionType === "score_range")
    return condition.fieldKey ? input.scores?.[condition.fieldKey] : input.totalScore;
  if (condition.conditionType === "answer_value" || condition.conditionType === "answer_present")
    return condition.fieldKey ? input.answers?.[condition.fieldKey] : undefined;
  if (condition.conditionType === "clinical_flag") return input.clinicalFlags || [];
  return true;
};

export function evaluateAssessmentRltCondition(
  condition: AssessmentRltMappingCondition | undefined,
  input: AssessmentMappingEvaluationInput,
) {
  if (!condition || condition.conditionType === "always") return true;
  const actual = comparable(input, condition);
  if (condition.conditionType === "answer_present") return actual !== undefined && actual !== "";
  if (actual === undefined) return false;
  if (condition.operator === "between")
    return (
      typeof actual === "number" &&
      condition.minimum !== undefined &&
      condition.maximum !== undefined &&
      actual >= condition.minimum &&
      actual <= condition.maximum
    );
  if (condition.operator === "contains")
    return Array.isArray(actual)
      ? actual.map(String).includes(String(condition.value))
      : String(actual).toLowerCase().includes(String(condition.value).toLowerCase());
  if (condition.operator === "not_equals") return actual !== condition.value;
  if (condition.operator === "greater_than") return Number(actual) > Number(condition.value);
  if (condition.operator === "greater_than_or_equal")
    return Number(actual) >= Number(condition.value);
  if (condition.operator === "less_than") return Number(actual) < Number(condition.value);
  if (condition.operator === "less_than_or_equal") return Number(actual) <= Number(condition.value);
  return actual === condition.value;
}

export interface AssessmentRltMappingResult {
  assessmentId?: string;
  assessmentTypeId: string;
  mappingVersionIds: string[];
  matches: Array<{
    rltDomainId: RltDomainId;
    rltDomainKey: RltDomainKey;
    mappingType: AssessmentRltMappingType;
    rationale: string;
    suggestedCarePlanningAction: SuggestedCarePlanningAction;
    mappingVersion: number;
  }>;
  requiresClinicalReview: boolean;
}

export function getApprovedRltMappingsForAssessment(
  assessmentTypeId: string,
  assessmentResult: AssessmentMappingEvaluationInput,
  effectiveAt: string,
  mappings: AssessmentRltMapping[] = ASSESSMENT_RLT_MAPPING_REGISTRY,
): AssessmentRltMappingResult {
  if (
    assessmentResult.status &&
    !["completed", "under_review", "review_due"].includes(assessmentResult.status)
  )
    return {
      assessmentId: assessmentResult.assessmentId,
      assessmentTypeId,
      mappingVersionIds: [],
      matches: [],
      requiresClinicalReview: false,
    };
  const at = Date.parse(effectiveAt);
  const eligible = mappings.filter(
    (mapping) =>
      mapping.assessmentTypeId === assessmentTypeId &&
      mapping.status === "approved" &&
      Boolean(mapping.approvedByDonStaffMemberId && mapping.donApprovedAt) &&
      mapping.reviewedByNurseStaffMemberIds.length > 0 &&
      (!mapping.effectiveFrom || Date.parse(mapping.effectiveFrom) <= at) &&
      (!mapping.effectiveTo || Date.parse(mapping.effectiveTo) > at),
  );
  const latest = new Map<string, AssessmentRltMapping>();
  for (const mapping of eligible) {
    const key = `${mapping.assessmentTypeId}:${mapping.rltDomainId}:${mapping.mappingType}`;
    if (!latest.has(key) || latest.get(key)!.version < mapping.version) latest.set(key, mapping);
  }
  const matches = [...latest.values()]
    .filter((mapping) => evaluateAssessmentRltCondition(mapping.condition, assessmentResult))
    .sort(
      (a, b) =>
        ({ primary: 0, secondary: 1, conditional: 2 })[a.mappingType] -
        { primary: 0, secondary: 1, conditional: 2 }[b.mappingType],
    );
  return {
    assessmentId: assessmentResult.assessmentId,
    assessmentTypeId,
    mappingVersionIds: matches.map((mapping) => mapping.id),
    matches: matches.map((mapping) => ({
      rltDomainId: mapping.rltDomainId,
      rltDomainKey: mapping.rltDomainKey,
      mappingType: mapping.mappingType,
      rationale: mapping.rationale,
      suggestedCarePlanningAction: mapping.suggestedCarePlanningAction,
      mappingVersion: mapping.version,
    })),
    requiresClinicalReview: matches.some(
      (mapping) => mapping.suggestedCarePlanningAction === "clinical_review_required",
    ),
  };
}

export function getApprovedRltDomainsForAssessmentRecord(
  assessment: Assessment,
  mappings: AssessmentRltMapping[] = ASSESSMENT_RLT_MAPPING_REGISTRY,
) {
  const result = getApprovedRltMappingsForAssessment(
    assessment.type,
    {
      assessmentId: assessment.id,
      status: assessment.status || "completed",
      riskLevel: assessment.riskLevel,
      totalScore: assessment.totalScore,
      scores: assessment.scores,
    },
    assessment.date,
    mappings,
  );
  return result.matches.map((match) => RLT_DOMAIN_BY_ID[match.rltDomainId]);
}

export interface MappingGovernanceContext {
  userAccountId: string;
  staffMemberId: string;
  nursingHomeId?: string;
  capabilities: string[];
  occurredAt: string;
  isActiveAccount: boolean;
  isRegisteredNurse?: (staffMemberId: string) => boolean;
  hasGovernanceScope?: (nursingHomeId?: string) => boolean;
  validationTestsPassed?: (mapping: AssessmentRltMapping) => boolean;
  minimumNurseReviews?: number;
}

export class AssessmentRltMappingError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

const requireCapability = (context: MappingGovernanceContext, capability: string) => {
  if (!context.isActiveAccount)
    throw new AssessmentRltMappingError("Account is disabled.", "account_disabled");
  if (!context.capabilities.includes(capability))
    throw new AssessmentRltMappingError(`Missing capability: ${capability}`, "forbidden");
  if (context.hasGovernanceScope && !context.hasGovernanceScope(context.nursingHomeId))
    throw new AssessmentRltMappingError("Outside governance scope.", "cross_home");
};

const updateMapping = (
  state: AssessmentRltMappingState,
  mappingId: string,
  update: (mapping: AssessmentRltMapping) => AssessmentRltMapping,
  context: MappingGovernanceContext,
  summary: string,
) => {
  const before = state.mappings.find((mapping) => mapping.id === mappingId);
  if (!before) throw new AssessmentRltMappingError("Mapping not found.", "not_found");
  if (before.nursingHomeId && before.nursingHomeId !== context.nursingHomeId)
    throw new AssessmentRltMappingError("Mapping belongs to another home.", "cross_home");
  const after = update(before);
  const auditChanges = [
    { field: "status", previousValue: before.status, newValue: after.status },
    { field: "version", previousValue: before.version, newValue: after.version },
    {
      field: "reviewedByNurseStaffMemberIds",
      previousValue: before.reviewedByNurseStaffMemberIds,
      newValue: after.reviewedByNurseStaffMemberIds,
    },
    {
      field: "approvedByDonStaffMemberId",
      previousValue: before.approvedByDonStaffMemberId,
      newValue: after.approvedByDonStaffMemberId,
    },
    { field: "effectiveFrom", previousValue: before.effectiveFrom, newValue: after.effectiveFrom },
    {
      field: "rejectionReason",
      previousValue: before.rejectionReason,
      newValue: after.rejectionReason,
    },
  ]
    .filter((change) => JSON.stringify(change.previousValue) !== JSON.stringify(change.newValue))
    .map((change) => ({ ...change, dataClassification: "standard" as const }));
  const audit = recordAuditEvent({
    id: `audit:${mappingId}:${state.auditRecords.length + 1}`,
    occurredAt: context.occurredAt,
    recordedAt: context.occurredAt,
    actor: { userAccountId: context.userAccountId, staffMemberId: context.staffMemberId },
    action: "update",
    entityType: "assessment_rlt_mapping",
    entityId: mappingId,
    summary,
    changes: auditChanges,
    scope: { nursingHomeId: before.nursingHomeId },
    metadata: { assessmentTypeId: before.assessmentTypeId, rltDomainId: before.rltDomainId },
  });
  return {
    ...state,
    mappings: state.mappings.map((mapping) => (mapping.id === mappingId ? after : mapping)),
    auditRecords: [...state.auditRecords, audit],
  };
};

export const submitAssessmentRltMappingForNurseReview = (
  state: AssessmentRltMappingState,
  mappingId: string,
  context: MappingGovernanceContext,
) => {
  requireCapability(context, "assessment_rlt_mapping.submit_review");
  return updateMapping(
    state,
    mappingId,
    (mapping) => {
      if (mapping.status !== "draft")
        throw new AssessmentRltMappingError(
          "Only draft mappings can be submitted.",
          "invalid_status",
        );
      return { ...mapping, status: "pending_nurse_review", updatedAt: context.occurredAt };
    },
    context,
    "Assessment-to-RLT mapping submitted for nurse review.",
  );
};

export function recordNurseMappingReview(
  state: AssessmentRltMappingState,
  mappingId: string,
  input: Omit<NurseMappingReview, "id" | "mappingId" | "mappingVersion" | "reviewedAt">,
  context: MappingGovernanceContext,
) {
  requireCapability(context, "assessment_rlt_mapping.review_nurse");
  if (!context.isRegisteredNurse?.(input.reviewerStaffMemberId))
    throw new AssessmentRltMappingError(
      "A registered nurse reviewer is required.",
      "not_registered_nurse",
    );
  if (input.reviewerStaffMemberId !== context.staffMemberId)
    throw new AssessmentRltMappingError("Reviewer identity mismatch.", "reviewer_mismatch");
  if (!input.comments.trim())
    throw new AssessmentRltMappingError("Review comments are required.", "comments_required");
  const mapping = state.mappings.find((candidate) => candidate.id === mappingId);
  if (!mapping) throw new AssessmentRltMappingError("Mapping not found.", "not_found");
  if (mapping.status !== "pending_nurse_review")
    throw new AssessmentRltMappingError("Mapping is not awaiting nurse review.", "invalid_status");
  const review: NurseMappingReview = {
    ...input,
    id: `mapping-review:${mappingId}:${state.nurseReviews.length + 1}`,
    mappingId,
    mappingVersion: mapping.version,
    reviewedAt: context.occurredAt,
  };
  const next = updateMapping(
    state,
    mappingId,
    (current) => ({
      ...current,
      reviewedByNurseStaffMemberIds: [
        ...new Set([...current.reviewedByNurseStaffMemberIds, input.reviewerStaffMemberId]),
      ],
      nurseReviewedAt: context.occurredAt,
      updatedAt: context.occurredAt,
    }),
    context,
    "Clinical nurse review recorded for assessment-to-RLT mapping.",
  );
  return { ...next, nurseReviews: [...state.nurseReviews, review] };
}

export const submitAssessmentRltMappingForDonApproval = (
  state: AssessmentRltMappingState,
  mappingId: string,
  context: MappingGovernanceContext,
) => {
  requireCapability(context, "assessment_rlt_mapping.submit_review");
  const reviews = state.nurseReviews.filter((review) => review.mappingId === mappingId);
  const minimum = context.minimumNurseReviews || 1;
  if (reviews.filter((review) => review.decision === "agree").length < minimum)
    throw new AssessmentRltMappingError(
      "Completed agreeing nurse review is required.",
      "nurse_review_required",
    );
  if (reviews.some((review) => review.decision !== "agree"))
    throw new AssessmentRltMappingError(
      "Requested changes remain unresolved.",
      "unresolved_review",
    );
  return updateMapping(
    state,
    mappingId,
    (mapping) => ({ ...mapping, status: "pending_don_approval", updatedAt: context.occurredAt }),
    context,
    "Assessment-to-RLT mapping submitted for DON approval.",
  );
};

export function approveAssessmentRltMapping(
  state: AssessmentRltMappingState,
  mappingId: string,
  input: { approved: true; comments: string; effectiveFrom?: string },
  context: MappingGovernanceContext,
) {
  requireCapability(context, "assessment_rlt_mapping.approve_don");
  if (!input.comments.trim())
    throw new AssessmentRltMappingError("Approval comments are required.", "comments_required");
  return updateMapping(
    state,
    mappingId,
    (mapping) => {
      if (mapping.status !== "pending_don_approval")
        throw new AssessmentRltMappingError(
          "Mapping is not awaiting DON approval.",
          "invalid_status",
        );
      if (!mapping.rationale.trim())
        throw new AssessmentRltMappingError("Rationale is required.", "rationale_required");
      if (!mapping.reviewedByNurseStaffMemberIds.length)
        throw new AssessmentRltMappingError("Nurse review is required.", "nurse_review_required");
      if (!mapping.validationTestIds.length || !context.validationTestsPassed?.(mapping))
        throw new AssessmentRltMappingError(
          "Mapping validation tests must pass.",
          "tests_required",
        );
      const effectiveFrom = input.effectiveFrom || context.occurredAt;
      if (!Number.isFinite(Date.parse(effectiveFrom)))
        throw new AssessmentRltMappingError("Effective date is invalid.", "invalid_effective_date");
      return {
        ...mapping,
        status: "approved",
        effectiveFrom,
        approvedByDonStaffMemberId: context.staffMemberId,
        donApprovedAt: context.occurredAt,
        updatedAt: context.occurredAt,
      };
    },
    context,
    "Assessment-to-RLT mapping approved by DON.",
  );
}

export function rejectAssessmentRltMapping(
  state: AssessmentRltMappingState,
  mappingId: string,
  reason: string,
  context: MappingGovernanceContext,
) {
  requireCapability(context, "assessment_rlt_mapping.reject");
  if (!reason.trim())
    throw new AssessmentRltMappingError("Rejection reason is required.", "reason_required");
  return updateMapping(
    state,
    mappingId,
    (mapping) => ({
      ...mapping,
      status: "rejected",
      rejectionReason: reason.trim(),
      updatedAt: context.occurredAt,
    }),
    context,
    "Assessment-to-RLT mapping rejected.",
  );
}

export function createNewAssessmentRltMappingVersion(
  state: AssessmentRltMappingState,
  mappingId: string,
  changes: Partial<
    Pick<
      AssessmentRltMapping,
      "rltDomainId" | "mappingType" | "condition" | "rationale" | "suggestedCarePlanningAction"
    >
  >,
  context: MappingGovernanceContext,
) {
  requireCapability(context, "assessment_rlt_mapping.edit_draft");
  const previous = state.mappings.find((mapping) => mapping.id === mappingId);
  if (!previous) throw new AssessmentRltMappingError("Mapping not found.", "not_found");
  if (previous.nursingHomeId && previous.nursingHomeId !== context.nursingHomeId)
    throw new AssessmentRltMappingError("Mapping belongs to another home.", "cross_home");
  const domain = changes.rltDomainId
    ? RLT_DOMAIN_BY_ID[changes.rltDomainId]
    : RLT_DOMAIN_BY_KEY[previous.rltDomainKey];
  if (!domain?.active)
    throw new AssessmentRltMappingError("RLT domain is invalid or inactive.", "invalid_domain");
  const version = previous.version + 1;
  const next: AssessmentRltMapping = {
    ...previous,
    ...changes,
    id: `${previous.id.replace(/:v\d+$/, "")}:v${version}`,
    rltDomainId: domain.id,
    rltDomainKey: domain.key,
    status: "draft",
    version,
    effectiveFrom: undefined,
    effectiveTo: undefined,
    reviewedByNurseStaffMemberIds: [],
    nurseReviewedAt: undefined,
    approvedByDonStaffMemberId: undefined,
    donApprovedAt: undefined,
    rejectionReason: undefined,
    createdAt: context.occurredAt,
    updatedAt: context.occurredAt,
  };
  const audit = recordAuditEvent({
    id: `audit:${next.id}:${state.auditRecords.length + 1}`,
    occurredAt: context.occurredAt,
    recordedAt: context.occurredAt,
    actor: { userAccountId: context.userAccountId, staffMemberId: context.staffMemberId },
    action: "create",
    entityType: "assessment_rlt_mapping",
    entityId: next.id,
    parentEntityType: "assessment_rlt_mapping",
    parentEntityId: previous.id,
    summary: "New assessment-to-RLT mapping version created for clinical review.",
    scope: { nursingHomeId: next.nursingHomeId },
    metadata: {
      previousVersion: previous.version,
      newVersion: next.version,
      assessmentTypeId: next.assessmentTypeId,
      rltDomainId: next.rltDomainId,
    },
  });
  return {
    ...state,
    mappings: [...state.mappings, next],
    auditRecords: [...state.auditRecords, audit],
  };
}

export function retireAssessmentRltMapping(
  state: AssessmentRltMappingState,
  mappingId: string,
  reason: string,
  context: MappingGovernanceContext,
) {
  requireCapability(context, "assessment_rlt_mapping.retire");
  if (!reason.trim())
    throw new AssessmentRltMappingError("Retirement reason is required.", "reason_required");
  return updateMapping(
    state,
    mappingId,
    (mapping) => ({
      ...mapping,
      status: "retired",
      effectiveTo: context.occurredAt,
      rejectionReason: reason.trim(),
      updatedAt: context.occurredAt,
    }),
    context,
    "Assessment-to-RLT mapping retired.",
  );
}

export function getAssessmentRltMappingReviewMatrix(state: AssessmentRltMappingState) {
  return state.mappings.map((mapping) => ({
    assessmentName: mapping.assessmentTypeKey.replace(/_/g, " "),
    assessmentTypeKey: mapping.assessmentTypeKey,
    version: mapping.version,
    primaryDomain:
      mapping.mappingType === "primary" ? RLT_DOMAIN_BY_ID[mapping.rltDomainId].label : undefined,
    relatedDomain:
      mapping.mappingType !== "primary" ? RLT_DOMAIN_BY_ID[mapping.rltDomainId].label : undefined,
    condition: mapping.condition,
    rationale: mapping.rationale,
    suggestedCarePlanningAction: mapping.suggestedCarePlanningAction,
    nurseReviewStatus: mapping.reviewedByNurseStaffMemberIds.length ? "reviewed" : "pending",
    donApprovalStatus: mapping.status === "approved" ? "approved" : mapping.status,
    effectiveFrom: mapping.effectiveFrom,
    validationTestStatus: mapping.validationTestIds.length ? "covered" : "missing",
    active: mapping.status === "approved",
  }));
}

export function validateAssessmentRltMappings(
  mappings: AssessmentRltMapping[],
  activeAssessmentTypes: AssessmentType[],
) {
  const issues: { code: string; mappingId?: string; assessmentType?: string }[] = [];
  const handled = new Set(mappings.map((mapping) => mapping.assessmentTypeKey));
  for (const type of activeAssessmentTypes)
    if (!handled.has(type))
      issues.push({ code: "unhandled_active_assessment", assessmentType: type });
  for (const mapping of mappings) {
    if (!RLT_DOMAIN_BY_ID[mapping.rltDomainId])
      issues.push({ code: "invalid_domain", mappingId: mapping.id });
    if (mapping.status === "approved" && !mapping.reviewedByNurseStaffMemberIds.length)
      issues.push({ code: "approved_without_nurse_review", mappingId: mapping.id });
    if (mapping.status === "approved" && !mapping.approvedByDonStaffMemberId)
      issues.push({ code: "approved_without_don", mappingId: mapping.id });
    if (mapping.status === "approved" && !mapping.rationale.trim())
      issues.push({ code: "approved_without_rationale", mappingId: mapping.id });
    if (mapping.mappingType === "conditional" && !mapping.validationTestIds.length)
      issues.push({ code: "conditional_without_tests", mappingId: mapping.id });
  }
  const approvedKeys = new Set<string>();
  for (const mapping of mappings.filter((candidate) => candidate.status === "approved")) {
    const key = `${mapping.assessmentTypeId}:${mapping.rltDomainId}:${mapping.mappingType}:${mapping.version}:${mapping.effectiveFrom || ""}`;
    if (approvedKeys.has(key))
      issues.push({ code: "duplicate_active_mapping", mappingId: mapping.id });
    approvedKeys.add(key);
  }
  return { issues, result: issues.length ? "FAIL" : "PASS" };
}
