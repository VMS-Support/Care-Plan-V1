import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

const files = {
  types: "src/domain/rules/ruleTypes.ts",
  catalog: "src/domain/rules/ruleCatalog.ts",
  registry: "src/domain/rules/ruleRegistry.ts",
  providers: "src/domain/rules/ruleDataProviders.ts",
  engine: "src/domain/rules/ruleEngine.ts",
  store: "src/lib/care/store.tsx",
};

const failures = [];
const warnings = [];
const checks = [];
const requireText = (name, file, text) => {
  const ok = read(file).includes(text);
  checks.push([name, ok]);
  if (!ok) failures.push(`${name}: missing "${text}" in ${file}`);
};

for (const [label, file] of Object.entries(files)) {
  if (!exists(file)) failures.push(`Missing ${label} file: ${file}`);
}

if (!failures.length) {
  requireText("Rule statuses include pending clinical approval", files.types, "pending_clinical_approval");
  requireText("Stable care-plan rule ID", files.catalog, "RULE-CAREPLAN-COVERAGE-001");
  requireText("Stable weight rule ID", files.catalog, "RULE-WEIGHT-001");
  requireText("Stable missed-care rule ID", files.catalog, "RULE-CAREACTION-MISSED-001");
  requireText("Stable dedupe test rule ID", files.catalog, "RULE-TEST-DEDUPE-001");
  requireText("Clinical approval gate", files.registry, "clinicalApproval");
  requireText("Active approval guard", files.registry, "canRuleBecomeActive");
  requireText("Event-driven registry", files.registry, "getApplicableRules");
  requireText("Declared data providers", files.providers, "getRuleSourceRecords");
  requireText("Insufficient data result", files.engine, "insufficient_data");
  requireText("Deterministic decision ID", files.engine, "rule-decision-");
  requireText("Deduplication key", files.engine, "deduplicationKey");
  requireText("Idempotent duplicate receipt", files.engine, "skipped_duplicate");
  requireText("Store persists rule definitions", files.store, "ruleDefinitions");
  requireText("Store processes rules on event emission", files.store, "processRulesForEvent");

  const catalog = read(files.catalog);
  const duplicateRuleIds = [...catalog.matchAll(/id:\s*"([^"]+)"/g)].map((match) => match[1]);
  const duplicates = duplicateRuleIds.filter((id, index) => duplicateRuleIds.indexOf(id) !== index);
  if (duplicates.length) failures.push(`Duplicate rule IDs detected: ${[...new Set(duplicates)].join(", ")}`);

  const activeClinical = /status:\s*"active"[\s\S]{0,700}clinicalJudgementRequired:\s*true/.test(catalog);
  if (activeClinical) failures.push("Active clinical-judgement rule found. Clinical rules must remain inactive until approved.");
  if (!/RULE-WEIGHT-001[\s\S]*status:\s*"pending_clinical_approval"/.test(catalog)) {
    failures.push("RULE-WEIGHT-001 must remain pending clinical approval.");
  }
  if (!/RULE-CAREACTION-MISSED-001[\s\S]*status:\s*"pending_clinical_approval"/.test(catalog)) {
    failures.push("RULE-CAREACTION-MISSED-001 must remain pending clinical approval.");
  }
  if (!/RULE-CAREPLAN-COVERAGE-001[\s\S]*status:\s*"pending_clinical_approval"/.test(catalog)) {
    failures.push("RULE-CAREPLAN-COVERAGE-001 must remain pending clinical approval.");
  }

  const docs = [
    "current-rule-logic-inventory.md",
    "rules-engine-architecture.md",
    "rule-catalogue.md",
    "rule-definition-model.md",
    "rule-versioning.md",
    "rule-configuration.md",
    "rule-clinical-approval.md",
    "rule-data-providers.md",
    "rule-evaluation.md",
    "rule-explanations.md",
    "rule-output-types.md",
    "rule-deduplication.md",
    "rule-idempotency.md",
    "rule-overrides-and-suppression.md",
    "rule-replay.md",
    "rule-security.md",
    "rule-migration.md",
    "reference-rules.md",
  ];
  for (const doc of docs) {
    if (!exists(`docs/rules/${doc}`)) failures.push(`Missing rules documentation: docs/rules/${doc}`);
  }

  const reqRegister = read("docs/architecture/requirements-register.md");
  for (const req of ["REQ-RULE-001", "REQ-EXPLAIN-001", "REQ-DEDUPE-001", "REQ-RULE-AUDIT-001", "REQ-RULE-SCOPE-001"]) {
    if (!reqRegister.includes(req)) failures.push(`Missing requirement row: ${req}`);
  }

  const sourceScan = read("src/lib/care/scoring.ts") + read("src/lib/care/vitals.ts") + read("src/components/care/AlertsWorkQueue.tsx");
  if (/temperature\s*[<>]|score\s*[<>]=?|overdueDays\s*>=/.test(sourceScan)) {
    warnings.push("Legacy hard-coded thresholds still exist in current UI/domain modules and are documented for migration; none were removed in this phase.");
  }
}

console.log("Rules engine validation");
for (const [name, ok] of checks) console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
for (const warning of warnings) console.log(`WARN ${warning}`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log("PASS critical clinical-safety and duplicate-output checks");
