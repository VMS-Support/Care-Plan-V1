import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const vite = await createServer({
  configFile: false,
  plugins: [tsconfigPaths()],
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});
const mapping = await vite.ssrLoadModule("/src/lib/care/assessmentRltMappings.ts");
const assessments = await vite.ssrLoadModule("/src/lib/care/assessments.ts");
after(async () => vite.close());

const NOW = "2026-07-14T10:00:00.000Z";
const activeTypes = [
  ...new Set(assessments.ASSESSMENT_CATEGORIES.flatMap((category) => category.types)),
];
const baseState = () => ({
  mappings: mapping.ASSESSMENT_RLT_MAPPING_REGISTRY.map((item) => ({ ...item })),
  nurseReviews: [],
  auditRecords: [],
});
const context = (patch = {}) => ({
  userAccountId: "user-nurse-1",
  staffMemberId: "staff-nurse-1",
  nursingHomeId: "home-1",
  capabilities: ["assessment_rlt_mapping.submit_review", "assessment_rlt_mapping.review_nurse"],
  occurredAt: NOW,
  isActiveAccount: true,
  isRegisteredNurse: () => true,
  hasGovernanceScope: () => true,
  validationTestsPassed: () => true,
  ...patch,
});
const approved = (item, patch = {}) => ({
  ...item,
  status: "approved",
  effectiveFrom: "2026-01-01T00:00:00.000Z",
  reviewedByNurseStaffMemberIds: ["staff-nurse-1"],
  nurseReviewedAt: "2025-12-20T00:00:00.000Z",
  approvedByDonStaffMemberId: "staff-don-1",
  donApprovedAt: "2025-12-21T00:00:00.000Z",
  ...patch,
});

test("every implemented assessment type has an explicit pending clinical mapping decision", () => {
  const registered = new Set(
    mapping.ASSESSMENT_RLT_MAPPING_REGISTRY.map((item) => item.assessmentTypeKey),
  );
  assert.deepEqual([...activeTypes].sort(), [...registered].sort());
  assert.ok(
    mapping.ASSESSMENT_RLT_MAPPING_REGISTRY.every((item) => item.status === "pending_nurse_review"),
  );
  assert.ok(
    mapping.ASSESSMENT_RLT_MAPPING_REGISTRY.every((item) => !item.approvedByDonStaffMemberId),
  );
});

test("pending, rejected and retired mappings are excluded from clinical evaluation", () => {
  for (const status of [
    "pending_nurse_review",
    "pending_don_approval",
    "rejected",
    "retired",
    "draft",
  ])
    assert.equal(
      mapping.getApprovedRltMappingsForAssessment(
        "must",
        { assessmentId: "assessment-1", status: "completed" },
        NOW,
        [
          {
            ...mapping.ASSESSMENT_RLT_MAPPING_REGISTRY.find(
              (item) => item.assessmentTypeKey === "must",
            ),
            status,
          },
        ],
      ).matches.length,
      0,
    );
});

test("approved MUST mapping returns Eating and Drinking without creating a Care Plan", () => {
  const must = approved(
    mapping.ASSESSMENT_RLT_MAPPING_REGISTRY.find((item) => item.assessmentTypeKey === "must"),
  );
  const result = mapping.getApprovedRltMappingsForAssessment(
    "must",
    { assessmentId: "must-1", status: "completed" },
    NOW,
    [must],
  );
  assert.deepEqual(
    result.matches.map((match) => match.rltDomainId),
    ["eating_drinking"],
  );
  assert.equal(result.matches[0].suggestedCarePlanningAction, "review_existing_plan");
});

test("draft and voided assessment results never produce active mappings", () => {
  const must = approved(
    mapping.ASSESSMENT_RLT_MAPPING_REGISTRY.find((item) => item.assessmentTypeKey === "must"),
  );
  for (const status of ["draft", "in_progress", "voided", "archived", "deleted"])
    assert.equal(
      mapping.getApprovedRltMappingsForAssessment("must", { status }, NOW, [must]).matches.length,
      0,
    );
});

test("condition evaluator handles exact inclusive score boundaries", () => {
  const condition = { conditionType: "score_range", operator: "between", minimum: 10, maximum: 20 };
  assert.equal(mapping.evaluateAssessmentRltCondition(condition, { totalScore: 10 }), true);
  assert.equal(mapping.evaluateAssessmentRltCondition(condition, { totalScore: 20 }), true);
  assert.equal(mapping.evaluateAssessmentRltCondition(condition, { totalScore: 9 }), false);
  assert.equal(mapping.evaluateAssessmentRltCondition(condition, { totalScore: 21 }), false);
});

test("condition evaluator handles missing answers and explicit answer values", () => {
  const present = { conditionType: "answer_present", fieldKey: "swallowing" };
  const equals = {
    conditionType: "answer_value",
    fieldKey: "swallowing",
    operator: "equals",
    value: "difficulty",
  };
  assert.equal(mapping.evaluateAssessmentRltCondition(present, {}), false);
  assert.equal(
    mapping.evaluateAssessmentRltCondition(present, { answers: { swallowing: "difficulty" } }),
    true,
  );
  assert.equal(
    mapping.evaluateAssessmentRltCondition(equals, { answers: { swallowing: "difficulty" } }),
    true,
  );
  assert.equal(
    mapping.evaluateAssessmentRltCondition(equals, { answers: { swallowing: "none" } }),
    false,
  );
});

test("conditional Waterlow mapping matches high and very-high risk only", () => {
  const conditional = approved(
    mapping.ASSESSMENT_RLT_MAPPING_REGISTRY.find(
      (item) => item.assessmentTypeKey === "waterlow" && item.mappingType === "conditional",
    ),
  );
  assert.equal(
    mapping.getApprovedRltMappingsForAssessment(
      "waterlow",
      { status: "completed", riskLevel: "high" },
      NOW,
      [conditional],
    ).matches.length,
    1,
  );
  assert.equal(
    mapping.getApprovedRltMappingsForAssessment(
      "waterlow",
      { status: "completed", riskLevel: "very_high" },
      NOW,
      [conditional],
    ).matches.length,
    1,
  );
  assert.equal(
    mapping.getApprovedRltMappingsForAssessment(
      "waterlow",
      { status: "completed", riskLevel: "moderate" },
      NOW,
      [conditional],
    ).matches.length,
    0,
  );
});

test("multi-domain Falls mappings return primary before secondary", () => {
  const falls = mapping.ASSESSMENT_RLT_MAPPING_REGISTRY.filter(
    (item) => item.assessmentTypeKey === "falls",
  ).map((item) => approved(item));
  const result = mapping.getApprovedRltMappingsForAssessment(
    "falls",
    { status: "completed" },
    NOW,
    falls,
  );
  assert.deepEqual(
    result.matches.map((match) => match.mappingType),
    ["primary", "secondary"],
  );
  assert.deepEqual(
    result.matches.map((match) => match.rltDomainId),
    ["safe_environment", "mobilisation"],
  );
});

test("effective-date version selection preserves old decisions and activates the new version later", () => {
  const base = mapping.ASSESSMENT_RLT_MAPPING_REGISTRY.find(
    (item) => item.assessmentTypeKey === "must",
  );
  const v1 = approved(base, {
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveTo: "2026-08-01T00:00:00.000Z",
  });
  const v2 = approved(
    { ...base, id: base.id.replace(":v1", ":v2"), version: 2 },
    { effectiveFrom: "2026-08-01T00:00:00.000Z", rationale: "Updated approved rationale." },
  );
  assert.equal(
    mapping.getApprovedRltMappingsForAssessment(
      "must",
      { status: "completed" },
      "2026-07-01T00:00:00.000Z",
      [v1, v2],
    ).matches[0].mappingVersion,
    1,
  );
  assert.equal(
    mapping.getApprovedRltMappingsForAssessment(
      "must",
      { status: "completed" },
      "2026-09-01T00:00:00.000Z",
      [v1, v2],
    ).matches[0].mappingVersion,
    2,
  );
});

test("nurse review requires active registered nurse identity and capability", () => {
  const state = baseState();
  const id = state.mappings[0].id;
  const input = {
    decision: "agree",
    comments: "Clinically relevant.",
    reviewerStaffMemberId: "staff-nurse-1",
  };
  assert.throws(
    () =>
      mapping.recordNurseMappingReview(
        state,
        id,
        input,
        context({ isRegisteredNurse: () => false }),
      ),
    (error) => error.code === "not_registered_nurse",
  );
  assert.throws(
    () => mapping.recordNurseMappingReview(state, id, input, context({ capabilities: [] })),
    (error) => error.code === "forbidden",
  );
  assert.throws(
    () => mapping.recordNurseMappingReview(state, id, input, context({ isActiveAccount: false })),
    (error) => error.code === "account_disabled",
  );
});

test("nurse review is append-only, versioned and audited", () => {
  const state = baseState();
  const id = state.mappings[0].id;
  const next = mapping.recordNurseMappingReview(
    state,
    id,
    { decision: "agree", comments: "Clinically relevant.", reviewerStaffMemberId: "staff-nurse-1" },
    context(),
  );
  assert.equal(next.nurseReviews.length, 1);
  assert.equal(next.nurseReviews[0].mappingVersion, 1);
  assert.equal(next.auditRecords.length, 1);
  assert.deepEqual(next.mappings.find((item) => item.id === id).reviewedByNurseStaffMemberIds, [
    "staff-nurse-1",
  ]);
});

test("DON approval is impossible until agreeing nurse review and tests are complete", () => {
  const state = baseState();
  const id = state.mappings[0].id;
  const don = context({
    staffMemberId: "staff-don-1",
    userAccountId: "user-don-1",
    capabilities: ["assessment_rlt_mapping.approve_don"],
  });
  assert.throws(
    () =>
      mapping.approveAssessmentRltMapping(
        state,
        id,
        { approved: true, comments: "Approved." },
        don,
      ),
    (error) => error.code === "invalid_status",
  );
});

test("complete nurse-to-DON workflow approves only the reviewed mapping version", () => {
  let state = baseState();
  const id = state.mappings.find((item) => item.assessmentTypeKey === "must").id;
  state = mapping.recordNurseMappingReview(
    state,
    id,
    { decision: "agree", comments: "Safe and relevant.", reviewerStaffMemberId: "staff-nurse-1" },
    context(),
  );
  state = mapping.submitAssessmentRltMappingForDonApproval(state, id, context());
  state = mapping.approveAssessmentRltMapping(
    state,
    id,
    { approved: true, comments: "Approved following clinical review.", effectiveFrom: NOW },
    context({
      staffMemberId: "staff-don-1",
      userAccountId: "user-don-1",
      capabilities: ["assessment_rlt_mapping.approve_don"],
    }),
  );
  const approvedMapping = state.mappings.find((item) => item.id === id);
  assert.equal(approvedMapping.status, "approved");
  assert.equal(approvedMapping.approvedByDonStaffMemberId, "staff-don-1");
  assert.equal(state.auditRecords.length, 3);
  assert.equal(
    mapping.getApprovedRltMappingsForAssessment(
      "must",
      { status: "completed" },
      NOW,
      state.mappings,
    ).matches.length,
    1,
  );
});

test("HCA, generic admin and another home cannot clinically approve mappings", () => {
  const pending = approved(mapping.ASSESSMENT_RLT_MAPPING_REGISTRY[0], {
    status: "pending_don_approval",
    approvedByDonStaffMemberId: undefined,
    donApprovedAt: undefined,
  });
  const state = { mappings: [pending], nurseReviews: [], auditRecords: [] };
  assert.throws(
    () =>
      mapping.approveAssessmentRltMapping(
        state,
        pending.id,
        { approved: true, comments: "Approve" },
        context({ capabilities: [] }),
      ),
    (error) => error.code === "forbidden",
  );
  assert.throws(
    () =>
      mapping.approveAssessmentRltMapping(
        state,
        pending.id,
        { approved: true, comments: "Approve" },
        context({
          staffMemberId: "staff-don-1",
          capabilities: ["assessment_rlt_mapping.approve_don"],
          hasGovernanceScope: () => false,
        }),
      ),
    (error) => error.code === "cross_home",
  );
});

test("mapping validation reports no missing assessment types and no fabricated approvals", () => {
  const report = mapping.validateAssessmentRltMappings(
    mapping.ASSESSMENT_RLT_MAPPING_REGISTRY,
    activeTypes,
  );
  assert.equal(report.result, "PASS");
  assert.deepEqual(report.issues, []);
});

test("new versions never overwrite an approved historical mapping", () => {
  const original = approved(mapping.ASSESSMENT_RLT_MAPPING_REGISTRY[0]);
  const state = { mappings: [original], nurseReviews: [], auditRecords: [] };
  const next = mapping.createNewAssessmentRltMappingVersion(
    state,
    original.id,
    { rationale: "Proposed revised rationale." },
    context({ capabilities: ["assessment_rlt_mapping.edit_draft"] }),
  );
  assert.equal(next.mappings.length, 2);
  assert.equal(next.mappings[0].status, "approved");
  assert.equal(next.mappings[1].status, "draft");
  assert.equal(next.mappings[1].version, 2);
});
