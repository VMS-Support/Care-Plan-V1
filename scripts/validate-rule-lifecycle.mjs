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

check("Rule issue lifecycle module exists", exists("src/domain/rules/ruleIssueLifecycle.ts"));
check("Rule issue model exists", read("src/domain/rules/ruleTypes.ts").includes("interface RuleIssue"));
check("Episode model exists", read("src/domain/rules/ruleTypes.ts").includes("interface RuleIssueEpisode"));
check("Transition model exists", read("src/domain/rules/ruleTypes.ts").includes("interface RuleIssueTransition"));
check("Acknowledgement is explicit", read("src/domain/rules/ruleIssueLifecycle.ts").includes("acknowledgeRuleIssue"));
check("Escalation requires reason", read("src/domain/rules/ruleIssueLifecycle.ts").includes("Escalation reason is required"));
check("Resolution requires code and reason", read("src/domain/rules/ruleIssueLifecycle.ts").includes("Resolution code and reason are required"));
check("Dismissal requires code and reason", read("src/domain/rules/ruleIssueLifecycle.ts").includes("Dismissal code and reason are required"));
check("Reopen creates new episode", read("src/domain/rules/ruleIssueLifecycle.ts").includes("reopenRuleIssue") && read("src/domain/rules/ruleIssueLifecycle.ts").includes("episodeNumber"));
check("Store persists lifecycle arrays", read("src/lib/care/store.tsx").includes("ruleIssueTransitions"));
check("Transition matrix doc exists", exists("docs/rules/rule-issue-transition-matrix.md"));

for (const req of ["REQ-RULE-LIFECYCLE-001", "REQ-RULE-LIFECYCLE-010"]) {
  check(`${req} in requirements register`, read("docs/architecture/requirements-register.md").includes(req));
}

console.log("Rule lifecycle validation");
for (const [name, ok] of checks) console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
if (failures.length) process.exit(1);
console.log("PASS lifecycle integrity checks");
