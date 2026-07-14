import { createServer } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
const vite = await createServer({ configFile: false, plugins: [tsconfigPaths()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: "custom" });
const model = await vite.ssrLoadModule("/src/lib/care/residentStrengthPreferences.ts");
const report = model.validateStrengthPreferenceState(model.EMPTY_STRENGTH_PREFERENCE_STATE, {});
if (!report.valid) throw new Error(report.issues.join("\n"));
const legacyExamples = ["Likes porridge for breakfast", "Prefers to be called Peggy", "Washes face independently", "Requires pureed diet", "Unclear lifestyle note"].map((text, index) => model.mapLegacyStrengthPreference({ id: `legacy-${index + 1}`, residentId: "resident-1", nursingHomeId: "home-1", text }));
console.log(JSON.stringify({ valid: report.valid, supportedRltDomains: 12, strengthCategories: model.STRENGTH_CATEGORIES.length, preferenceCategories: Object.keys(model.PREFERENCE_CATEGORY_DOMAINS).length, unresolvedLegacyRecords: legacyExamples.filter((item) => item.status === "manual_review").length, clinicalRequirementsNotMigrated: legacyExamples.filter((item) => item.status === "clinical_requirement").length }, null, 2));
await vite.close();
