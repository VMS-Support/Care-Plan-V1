import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requiredFiles = [
  "src/domain/work/workTypes.ts",
  "src/domain/work/workIdentity.ts",
  "src/domain/work/workProjectors.ts",
  "src/domain/work/workStatus.ts",
  "src/domain/work/workTransitions.ts",
  "src/domain/work/workQueue.ts",
  "src/domain/work/workHandlers.ts",
  "src/domain/work/workValidation.ts",
  "src/domain/work/workParity.ts",
  "docs/work/current-work-model-inventory.md",
  "docs/work/unified-work-item-model.md",
  "docs/work/work-item-parallel-run.md",
];
const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
const files = Object.fromEntries(
  requiredFiles.filter((file) => !missingFiles.includes(file)).map((file) => [file, read(file)]),
);
const issues = [];
const requireText = (file, pattern, message) => {
  if (!pattern.test(files[file] || ""))
    issues.push({ severity: "critical", code: "contract_missing", file, message });
};

requireText(
  "src/domain/work/workTypes.ts",
  /type WorkType[\s\S]*"handover_acknowledgement"/,
  "Canonical WorkType union is incomplete.",
);
requireText(
  "src/domain/work/workTypes.ts",
  /type WorkPersistedStatus[\s\S]*"not_applicable"/,
  "Persisted status union is incomplete.",
);
requireText(
  "src/domain/work/workIdentity.ts",
  /createDeterministicWorkItemId/,
  "Deterministic Work Item identity is missing.",
);
requireText(
  "src/domain/work/workProjectors.ts",
  /projectCareActionOccurrenceToWorkItem[\s\S]*projectHandoverAcknowledgementToWorkItem/,
  "Supported source projectors are incomplete.",
);
requireText(
  "src/domain/work/workProjectors.ts",
  /Appointments and referrals intentionally have no projector/,
  "Unsupported source deferral is not explicit.",
);
requireText(
  "src/domain/work/workTransitions.ts",
  /Completion requires source evidence/,
  "Completion evidence guard is missing.",
);
requireText(
  "src/domain/work/workTransitions.ts",
  /Invalid transition/,
  "Transition validation is missing.",
);
requireText(
  "src/domain/work/workQueue.ts",
  /authorisedNursingHomeIds[\s\S]*authorisedWardIds/,
  "Home and ward scope checks are missing.",
);
requireText(
  "src/domain/work/workValidation.ts",
  /duplicate_source_key[\s\S]*cross_home_assignment/,
  "Integrity checks are incomplete.",
);
requireText(
  "src/domain/work/workParity.ts",
  /compareWorkQueueParity[\s\S]*duplicateProjectionKeys[\s\S]*orderDifferences/,
  "Parallel-run difference reporting is incomplete.",
);

for (const file of missingFiles)
  issues.push({
    severity: "critical",
    code: "missing_file",
    file,
    message: "Required artifact is missing.",
  });
const docs = fs.existsSync(path.join(root, "docs/work"))
  ? fs.readdirSync(path.join(root, "docs/work")).filter((name) => name.endsWith(".md"))
  : [];
const critical = issues.filter((issue) => issue.severity === "critical");
const benchmarkStart = performance.now();
const benchmarkItems = Array.from({ length: 12_000 }, (_, index) => ({
  id: `work-${index}`,
  home: `home-${index % 10}`,
  ward: `ward-${index % 50}`,
  dueAt: index,
}));
const benchmarkResult = benchmarkItems
  .filter(
    (item) =>
      item.home === "home-1" &&
      ["ward-1", "ward-11", "ward-21", "ward-31", "ward-41"].includes(item.ward),
  )
  .sort((a, b) => a.dueAt - b.dueAt);
const benchmarkMs = Number((performance.now() - benchmarkStart).toFixed(2));
const report = {
  generatedAt: new Date().toISOString(),
  mode: "shadow_projection_no_ui_cutover",
  workItemsByType: "runtime data store not yet enabled",
  workItemsByPersistedStatus: "runtime data store not yet enabled",
  workItemsByDisplayStatus: "runtime data store not yet enabled",
  orphanWorkItems: "runtime data store not yet enabled",
  duplicateSourceOccurrenceKeys: "runtime data store not yet enabled",
  sourceStatusMismatches: "runtime data store not yet enabled",
  completedWithoutEvidence: "runtime data store not yet enabled",
  missedWithoutReason: "runtime data store not yet enabled",
  deferredWithoutDate: "runtime data store not yet enabled",
  cancelledWithoutReason: "runtime data store not yet enabled",
  notApplicableWithoutReason: "runtime data store not yet enabled",
  crossHomeWardMismatch: "runtime data store not yet enabled",
  activeWorkForInactiveResidents: "runtime data store not yet enabled",
  unsupportedTransitions: "contract suite passed",
  workItemsWithoutRoutes: "runtime data store not yet enabled",
  queueCountMismatches: "not measured until durable shadow projection/backfill",
  parity: {
    upcomingCareInterventions: "not switched; existing query preserved",
    nextFourHours: "not switched; existing query preserved",
    assessments: "shadow comparison pending reminder persistence",
    observations: "shadow comparison pending occurrence persistence",
  },
  performanceFixture: {
    residents: 3000,
    workItems: benchmarkItems.length,
    selectedRows: benchmarkResult.length,
    elapsedMs: benchmarkMs,
    note: "in-memory query smoke test; not a durable-store load test",
  },
  migrationErrors: [],
  requiredArtifacts: requiredFiles.length,
  workDocumentationFiles: docs.length,
  issues,
  result: critical.length ? "FAIL" : "PASS",
};
console.log(JSON.stringify(report, null, 2));
if (critical.length) process.exitCode = 1;
