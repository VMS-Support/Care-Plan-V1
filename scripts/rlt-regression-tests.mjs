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
const rlt = await vite.ssrLoadModule("/src/lib/care/rlt.ts");
const selectors = await vite.ssrLoadModule("/src/lib/care/rltSelectors.ts");
const fixtures = await vite.ssrLoadModule("/tests/rlt/rltFixtures.ts");
const work = await vite.ssrLoadModule("/src/domain/work/careActionQueueAdapter.ts");
const schedule = await vite.ssrLoadModule("/src/lib/care/intervention-schedule.ts");
after(async () => vite.close());

const HOME = "home-rlt-1";
const RESIDENT = "resident-rlt-1";
const PLAN = "care-plan-rlt-1";
const onePerDomain = rlt.RLT_DOMAINS.map((domain) =>
  fixtures.createTestCarePlanItem({
    residentId: RESIDENT,
    carePlanId: PLAN,
    carePlanItemId: `care-plan-item-${domain.id}`,
    domainId: domain.id,
    nursingHomeId: HOME,
    status: "active",
    title: `Plan for ${domain.label}`,
  }),
);
const data = (carePlanItems = onePerDomain, reviews = [], careActions = []) => ({
  carePlanItems,
  reviews,
  careActions,
  carePlans: [
    fixtures.createTestCarePlan({
      id: PLAN,
      residentId: RESIDENT,
      nursingHomeId: HOME,
      status: "active",
    }),
  ],
});

test("canonical registry contains exactly twelve stable, active and ordered domains", () => {
  assert.equal(rlt.RLT_DOMAINS.length, 12);
  assert.equal(new Set(rlt.RLT_DOMAINS.map((domain) => domain.id)).size, 12);
  assert.equal(new Set(rlt.RLT_DOMAINS.map((domain) => domain.key)).size, 12);
  assert.deepEqual(
    rlt.RLT_DOMAINS.map((domain) => domain.displayOrder),
    Array.from({ length: 12 }, (_, index) => index + 1),
  );
  assert.ok(rlt.RLT_DOMAINS.every((domain) => domain.active && domain.label));
});

for (const domain of rlt.RLT_DOMAINS) {
  test(`${domain.label} groups its Care Plan Item once and nowhere else`, () => {
    const item = onePerDomain.find((candidate) => candidate.rltDomainId === domain.id);
    const scoped = data([item]);
    assert.deepEqual(
      selectors.getCarePlanItemsByRltDomain(scoped, RESIDENT, domain.id).map((value) => value.id),
      [item.id],
    );
    for (const other of rlt.RLT_DOMAINS.filter((candidate) => candidate.id !== domain.id))
      assert.equal(selectors.getCarePlanItemsByRltDomain(scoped, RESIDENT, other.id).length, 0);
    assert.equal(rlt.RLT_DOMAIN_BY_ID[domain.id].label, domain.label);
    assert.equal(
      selectors.getCarePlanItemById(scoped, item.id, { residentId: RESIDENT, nursingHomeId: HOME })
        .id,
      item.id,
    );
  });
}

test("all twelve domains remain present with one active plan each", () => {
  const summaries = selectors.getAllRltDomainSummaries(data(), RESIDENT);
  assert.equal(summaries.length, 12);
  assert.ok(summaries.every((summary) => summary.activeCount === 1));
  assert.equal(
    summaries.reduce((total, summary) => total + summary.activeCount, 0),
    12,
  );
});

test("resident with no plans still receives all twelve zero-count domain summaries", () => {
  const summaries = selectors.getAllRltDomainSummaries(data([]), "resident-empty");
  assert.equal(summaries.length, 12);
  assert.ok(summaries.every((summary) => summary.activeCount === 0));
});

test("multiple plans in one domain remain independent", () => {
  const items = ["walking-aid", "call-bell", "transfer-supervision"].map((id) =>
    fixtures.createTestCarePlanItem({
      residentId: RESIDENT,
      carePlanId: PLAN,
      carePlanItemId: id,
      domainId: "safe_environment",
      nursingHomeId: HOME,
      status: "active",
    }),
  );
  const selected = selectors.getCarePlanItemsByRltDomain(data(items), RESIDENT, "safe_environment");
  assert.deepEqual(
    selected.map((item) => item.id),
    items.map((item) => item.id),
  );
  assert.equal(new Set(selected.map((item) => item.id)).size, 3);
});

test("detail selection rejects another resident and another home", () => {
  const scoped = data();
  const id = onePerDomain[0].id;
  assert.equal(
    selectors.getCarePlanItemById(scoped, id, { residentId: "resident-other" }),
    undefined,
  );
  assert.equal(
    selectors.getCarePlanItemById(scoped, id, { nursingHomeId: "home-other" }),
    undefined,
  );
  assert.equal(selectors.getCarePlanItemById(scoped, "missing"), undefined);
});

test("reviews remain linked only to their Care Plan Item", () => {
  const [a, b] = onePerDomain;
  const reviews = [
    fixtures.createTestCarePlanReview({
      id: "review-a1",
      carePlanItemId: a.id,
      reviewDate: "2026-07-01",
      nursingHomeId: HOME,
    }),
    fixtures.createTestCarePlanReview({
      id: "review-a2",
      carePlanItemId: a.id,
      reviewDate: "2026-07-02",
      nursingHomeId: HOME,
    }),
    fixtures.createTestCarePlanReview({
      id: "review-b1",
      carePlanItemId: b.id,
      reviewDate: "2026-07-02",
      nursingHomeId: HOME,
    }),
  ];
  const scoped = data([a, b], reviews);
  assert.deepEqual(
    selectors.getReviewsForCarePlanItem(scoped, a.id).map((review) => review.id),
    ["review-a1", "review-a2"],
  );
  assert.deepEqual(
    selectors.getReviewsForCarePlanItem(scoped, b.id).map((review) => review.id),
    ["review-b1"],
  );
});

test("Care Actions remain linked only to their Care Plan Item", () => {
  const [a, b] = onePerDomain;
  const actions = [
    fixtures.createTestCareAction({
      id: "action-a1",
      residentId: RESIDENT,
      carePlanItemId: a.id,
      nursingHomeId: HOME,
      status: "active",
      frequencyType: "prn",
    }),
    fixtures.createTestCareAction({
      id: "action-a2",
      residentId: RESIDENT,
      carePlanItemId: a.id,
      nursingHomeId: HOME,
      status: "active",
      frequencyType: "per_shift",
    }),
    fixtures.createTestCareAction({
      id: "action-b1",
      residentId: RESIDENT,
      carePlanItemId: b.id,
      nursingHomeId: HOME,
      status: "active",
      frequencyType: "once",
    }),
  ];
  const scoped = data([a, b], [], actions);
  assert.deepEqual(
    selectors.getCareActionsForCarePlanItem(scoped, a.id).map((action) => action.id),
    ["action-a1", "action-a2"],
  );
  assert.deepEqual(
    selectors.getCareActionsForCarePlanItem(scoped, b.id).map((action) => action.id),
    ["action-b1"],
  );
});

test("inactive Care Plan Items are excluded from active counts and retained in history", () => {
  const active = onePerDomain[0];
  const inactive = { ...onePerDomain[1], status: "archived" };
  const scoped = data([active, inactive]);
  assert.deepEqual(
    selectors.getActiveCarePlanItems(scoped, RESIDENT).map((item) => item.id),
    [active.id],
  );
  assert.deepEqual(
    selectors.getInactiveCarePlanItems(scoped, RESIDENT).map((item) => item.id),
    [inactive.id],
  );
  assert.equal(
    selectors.getCarePlanItemsByRltDomain(scoped, RESIDENT, inactive.rltDomainId).length,
    0,
  );
  assert.equal(
    selectors.getCarePlanItemsByRltDomain(scoped, RESIDENT, inactive.rltDomainId, "history").length,
    1,
  );
});

test("nearest active review date and counts use the same domain predicate", () => {
  const items = [
    { ...onePerDomain[0], reviewDate: "2026-09-01" },
    { ...onePerDomain[0], id: "safe-second", reviewDate: "2026-08-01" },
    { ...onePerDomain[0], id: "safe-old", status: "archived", reviewDate: "2026-07-01" },
  ];
  const scoped = data(items);
  assert.equal(selectors.getActiveCarePlanCountByDomain(scoped, RESIDENT).safe_environment, 2);
  assert.equal(
    selectors.getNextReviewDateForDomain(scoped, RESIDENT, "safe_environment"),
    "2026-08-01",
  );
});

test("legacy deterministic category mapping is safe and custom title inference requires review", () => {
  const nutrition = fixtures.createLegacyCarePlanFixture({
    id: "legacy-nutrition",
    residentId: RESIDENT,
    carePlanId: PLAN,
    nursingHomeId: HOME,
    category: "nutrition",
    title: "Diet support",
  });
  const ambiguous = fixtures.createLegacyCarePlanFixture({
    id: "legacy-custom",
    residentId: RESIDENT,
    carePlanId: PLAN,
    nursingHomeId: HOME,
    category: "custom",
    title: "Falls and nutrition support",
  });
  assert.deepEqual(rlt.resolveCarePlanRltDomain(nutrition), {
    domainId: "eating_drinking",
    domainKey: "eating_and_drinking",
    source: "legacy_care_plan_type",
    confidence: "high",
    requiresManualReview: false,
  });
  assert.equal(rlt.resolveCarePlanRltDomain(ambiguous).requiresManualReview, true);
  assert.equal(rlt.getRltDomainForCarePlanProblem(ambiguous), undefined);
});

test("legacy child relations use explicit IDs or a unique deterministic parent only", () => {
  const one = data([onePerDomain[0]]);
  assert.equal(
    selectors.resolveLegacyCarePlanItemRelation({ problemId: onePerDomain[0].id }, one).source,
    "explicit_item_id",
  );
  assert.equal(
    selectors.resolveLegacyCarePlanItemRelation({ carePlanId: PLAN, residentId: RESIDENT }, one)
      .carePlanItemId,
    onePerDomain[0].id,
  );
  assert.equal(
    selectors.resolveLegacyCarePlanItemRelation(
      { carePlanId: PLAN },
      data(onePerDomain.slice(0, 2)),
    ).source,
    "ambiguous",
  );
  assert.equal(
    selectors.resolveLegacyCarePlanItemRelation({ carePlanId: "orphan" }, one).source,
    "orphan",
  );
});

test("integrity validation detects duplicates, orphans and cross-resident relations", () => {
  const parent = onePerDomain[0];
  const action = fixtures.createTestCareAction({
    id: "cross-resident-action",
    residentId: "resident-other",
    carePlanItemId: parent.id,
    nursingHomeId: HOME,
    status: "active",
  });
  const review = fixtures.createTestCarePlanReview({
    id: "orphan-review",
    carePlanItemId: "missing",
    reviewDate: "2026-07-01",
    nursingHomeId: HOME,
  });
  const report = selectors.validateRltCarePlanIntegrity(
    data([parent, { ...parent }], [review], [action]),
    RESIDENT,
  );
  assert.ok(report.issues.some((issue) => issue.code === "duplicate_care_plan_item_id"));
  assert.ok(report.issues.some((issue) => issue.code === "orphan_review"));
  assert.ok(report.issues.some((issue) => issue.code === "cross_resident_care_action"));
});

test("similarly named Care Plans remain isolated by resident identity", () => {
  const residentB = {
    ...onePerDomain[0],
    id: "resident-b-plan",
    residentId: "resident-rlt-2",
    problemStatement: onePerDomain[0].problemStatement,
  };
  const scoped = data([onePerDomain[0], residentB]);
  assert.deepEqual(
    selectors.getResidentCarePlanItems(scoped, RESIDENT).map((item) => item.id),
    [onePerDomain[0].id],
  );
});

test("Care Action Work Item retains exact Care Plan Item and RLT linkage", () => {
  const problem = onePerDomain.find((item) => item.rltDomainId === "eating_drinking");
  const action = fixtures.createTestCareAction({
    id: "work-linked-action",
    residentId: RESIDENT,
    carePlanItemId: problem.id,
    nursingHomeId: HOME,
    status: "active",
    frequencyType: "every_2_hours",
  });
  const resident = {
    id: RESIDENT,
    facilityId: HOME,
    firstName: "R",
    lastName: "One",
    dateOfBirth: "1940-01-01",
    gender: "female",
    admissionDate: "2020-01-01",
    status: "active",
    lifecycleStatus: "active",
    presenceStatus: "in_home",
    photoSeed: "r",
  };
  const projected = work.projectScheduledCareActionToWorkItem(
    {
      intervention: action,
      problem,
      dueAt: new Date("2026-07-14T12:00:00.000Z"),
      status: "scheduled",
    },
    { resident, nursingHomeId: HOME, wardId: "ward-rlt-1" },
    {
      nursingHomeId: HOME,
      wardSelectionMode: "single",
      wardIds: ["ward-rlt-1"],
      shiftId: "day",
      shiftStartAt: "2026-07-14T08:00:00.000Z",
      shiftEndAt: "2026-07-14T20:00:00.000Z",
      operationalDate: "2026-07-14",
      timezone: "Europe/Dublin",
      effectiveRoleKey: "NURSE",
      updatedAt: fixtures.RLT_TEST_NOW,
    },
    { occurrenceId: "occurrence-fixed-1" },
  );
  assert.equal(projected.source.parentEntityId, action.id);
  assert.equal(projected.source.sourceOccurrenceId, "occurrence-fixed-1");
  assert.equal(projected.residentId, RESIDENT);
  assert.equal(projected.careContext.carePlanId, PLAN);
  assert.equal(projected.careContext.carePlanItemId, problem.id);
  assert.equal(projected.careContext.rltDomainId, "eating_drinking");
});

test("Upcoming Care Interventions keeps the correct parent Care Plan Item", () => {
  const problem = onePerDomain[0];
  const action = fixtures.createTestCareAction({
    id: "scheduled-action",
    residentId: RESIDENT,
    carePlanItemId: problem.id,
    nursingHomeId: HOME,
    status: "active",
    frequencyType: "every_2_hours",
  });
  const upcoming = schedule.getUpcomingScheduledInterventions(
    [action],
    [],
    [problem],
    new Date("2026-07-14T10:00:00.000Z"),
    { residentIds: new Set([RESIDENT]), until: new Date("2026-07-14T14:00:00.000Z") },
  );
  assert.ok(upcoming.length > 0);
  assert.ok(upcoming.every((entry) => entry.problem?.id === problem.id));
  assert.ok(upcoming.every((entry) => entry.intervention.problemId === problem.id));
});
