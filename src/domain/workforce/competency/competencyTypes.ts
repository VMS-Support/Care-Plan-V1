import type { CompetencyDefinition } from "@/lib/care/types";

const now = "2026-07-15T00:00:00.000Z";
const systemUser = "user-account-system" as any;

export const COMPETENCY_STATUS_LABELS = {
  competent: "Competent",
  competent_with_supervision: "Competent with Supervision",
  due_soon: "Due Soon",
  expired: "Expired",
  missing_required: "Missing Required",
  not_yet_competent: "Not Yet Competent",
  pending_validation: "Pending Validation",
  not_required: "Not Required",
  unable_to_determine: "Unable to Determine",
} as const;

export const DEFAULT_COMPETENCY_DEFINITIONS: CompetencyDefinition[] = [
  ["PEG", "PEG Care", "clinical"],
  ["TRACHEOSTOMY", "Tracheostomy Care", "clinical"],
  ["VENEPUNCTURE", "Venepuncture", "clinical"],
  ["INSULIN", "Insulin Administration", "medication"],
  ["SYRINGE_DRIVER", "Syringe Driver", "medication"],
  ["CATHETERISATION", "Catheterisation", "clinical"],
].map(([code, title, category], index) => ({
  id: `competency-${String(code).toLowerCase().replaceAll("_", "-")}`,
  code,
  title,
  category,
  status: "active",
  defaultValidityMonths: 12,
  supervisionAllowed: true,
  displayOrder: index + 1,
  createdAt: now,
  updatedAt: now,
  createdByUserAccountId: systemUser,
  updatedByUserAccountId: systemUser,
}) as CompetencyDefinition);
