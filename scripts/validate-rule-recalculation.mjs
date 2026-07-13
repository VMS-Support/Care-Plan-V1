import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];
const checks = [];
const check = (name, ok) => {
  checks.push([name, ok]);
  if (!ok) failures.push(name);
};

check("Rule recalculation module exists", exists("src/domain/rules/ruleRecalculation.ts"));
check("Request model exists", read("src/domain/rules/ruleTypes.ts").includes("interface RuleRecalculationRequest"));
check("Item model exists", read("src/domain/rules/ruleTypes.ts").includes("interface RuleRecalculationItem"));
check("Summary model exists", read("src/domain/rules/ruleTypes.ts").includes("interface RuleRecalculationSummary"));
check("Dry run function exists", read("src/domain/rules/ruleRecalculation.ts").includes("runRecalculationDryRun"));
check("Apply freshness check exists", read("src/domain/rules/ruleRecalculation.ts").includes("assertApplyRequestIsFresh"));
check("Rule hash exists", read("src/domain/rules/ruleRecalculation.ts").includes("stableRuleHash"));
check("Source hash exists", read("src/domain/rules/ruleRecalculation.ts").includes("stableSourceHash"));
check("Store persists recalculation arrays", read("src/lib/care/store.tsx").includes("ruleRecalculationRequests"));
check("Background recalculation docs exist", exists("docs/rules/background-recalculation.md"));

for (const req of ["REQ-RECALC-001", "REQ-RECALC-012"]) {
  check(`${req} in requirements register`, read("docs/architecture/requirements-register.md").includes(req));
}

console.log("Rule recalculation validation");
for (const [name, ok] of checks) console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
if (failures.length) process.exit(1);
console.log("PASS recalculation integrity checks");
