import type { Assessment, AssessmentType, Resident } from "@/lib/care/types";

export type AssessmentRequirementComplianceStatus =
  | "current"
  | "due_soon"
  | "overdue"
  | "missing"
  | "reassessment_required"
  | "pending_completion"
  | "pending_approval"
  | "unable_to_determine"
  | "not_applicable";

export interface AssessmentRequirementRecord {
  id: string;
  assessmentType?: AssessmentType;
  assessmentTypeId?: AssessmentType | string;
  type?: AssessmentType;
  mandatory?: boolean;
  active?: boolean;
  status?: "active" | "inactive" | "retired" | "entered_in_error" | string;
  category?: "risk" | "clinical" | "functional" | "screening" | "other" | string;
  includeInDonRiskAssessmentMetric?: boolean;
  nursingHomeId?: string;
  facilityId?: string;
  wardId?: string;
  residentStatuses?: string[];
  effectiveFrom?: string;
  effectiveTo?: string;
  reviewFrequencyDays?: number;
  dueSoonWarningDays?: number;
  requirementVersion?: number;
  priority?: "low" | "normal" | "high" | "critical" | string;
  criticalMissing?: boolean;
  displayName?: string;
  name?: string;
}

export interface ResidentAssessmentRequirementInstance {
  residentId: string;
  assessmentRequirementId: string;
  assessmentTypeId: AssessmentType | string;
  mandatory: boolean;
  applicableFrom: string;
  applicableTo?: string;
  dueAt?: string;
  reviewDueAt?: string;
  triggerSourceType?: string;
  triggerSourceId?: string;
  requirementVersion: number;
  requirement: AssessmentRequirementRecord;
}

export interface AssessmentRequirementComplianceResult {
  instance: ResidentAssessmentRequirementInstance;
  status: AssessmentRequirementComplianceStatus;
  currentAssessment?: Assessment;
  lastCompletedAt?: string;
  reviewDueAt?: string;
  triggerExplanation?: string;
  resident?: Resident;
}

export interface DonRiskAssessmentMetric {
  value?: number;
  numerator: number;
  denominator: number;
  currentCount: number;
  dueSoonCount: number;
  overdueCount: number;
  missingCount: number;
  reassessmentRequiredCount: number;
  pendingCompletionCount: number;
  pendingApprovalCount: number;
  unableToDetermineCount: number;
  affectedResidentCount: number;
  status:
    | "up_to_date"
    | "attention"
    | "poor"
    | "critical"
    | "not_configured"
    | "partially_available"
    | "not_applicable"
    | "error";
  displayLabel: string;
  explanation: string;
  policyVersion?: number;
  route: string;
  generatedAt: string;
  results: AssessmentRequirementComplianceResult[];
}

const POLICY = {
  version: 1,
  dueSoonCountsAsCompliant: true,
  defaultDueSoonWarningDays: 7,
  thresholds: {
    upToDate: 95,
    attention: 85,
    poor: 70,
  },
};

export function getDonRiskAssessmentMetric(input: {
  residents: Resident[];
  assessments: Assessment[];
  assessmentRequirements?: AssessmentRequirementRecord[];
  nursingHomeId?: string;
  reportingDate: string;
  generatedAt?: string;
  route?: string;
  reassessmentTriggers?: Array<{ residentId: string; assessmentType?: string; type?: string; createdAt?: string; at?: string; resolvedAt?: string; trigger?: string; note?: string }>;
}): DonRiskAssessmentMetric {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const route = input.route || `/assessments?metric=don-risk-assessments&date=${input.reportingDate}`;
  const requirements = (input.assessmentRequirements || []).filter((requirement) =>
    isRiskRequirement(requirement) && isRequirementEffective(requirement, input.reportingDate, input.nursingHomeId),
  );

  if (!requirements.length) {
    return emptyMetric({
      status: "not_configured",
      displayLabel: "Set up mandatory Assessment Requirements",
      explanation: "No mandatory Risk Assessment Requirements have been configured.",
      route,
      generatedAt,
    });
  }

  const residents = input.residents.filter((resident) => isResidentInScope(resident, input.reportingDate, input.nursingHomeId));
  if (!residents.length) {
    return emptyMetric({
      status: "not_applicable",
      displayLabel: "Not Applicable",
      explanation: "No mandatory Risk Assessments apply to the selected scope.",
      route,
      generatedAt,
    });
  }

  const instances = residents.flatMap((resident) =>
    resolveApplicableAssessmentRequirements({
      resident,
      nursingHomeId: input.nursingHomeId || String(resident.facilityId || ""),
      reportingDate: input.reportingDate,
      requirements,
    }),
  );
  const results = instances.map((instance) =>
    resolveCurrentAssessmentForRequirement({
      instance,
      resident: residents.find((resident) => resident.id === instance.residentId),
      assessments: input.assessments,
      reportingDate: input.reportingDate,
      reassessmentTriggers: input.reassessmentTriggers || [],
    }),
  );

  const currentCount = countStatus(results, "current");
  const dueSoonCount = countStatus(results, "due_soon");
  const overdueCount = countStatus(results, "overdue");
  const missingCount = countStatus(results, "missing");
  const reassessmentRequiredCount = countStatus(results, "reassessment_required");
  const pendingCompletionCount = countStatus(results, "pending_completion");
  const pendingApprovalCount = countStatus(results, "pending_approval");
  const unableToDetermineCount = countStatus(results, "unable_to_determine");
  const numerator = currentCount + (POLICY.dueSoonCountsAsCompliant ? dueSoonCount : 0);
  const denominator = results.length;
  const value = denominator ? (numerator / denominator) * 100 : undefined;
  const criticalMissing = results.some((result) =>
    ["missing", "reassessment_required", "overdue"].includes(result.status) &&
    (result.instance.requirement.criticalMissing || result.instance.requirement.priority === "critical"),
  );
  const metricStatus = metricStatusFor(value, criticalMissing, unableToDetermineCount);
  const affectedResidentCount = new Set(results.filter((result) => result.status !== "current" && result.status !== "due_soon").map((result) => result.instance.residentId)).size;

  return {
    value,
    numerator,
    denominator,
    currentCount,
    dueSoonCount,
    overdueCount,
    missingCount,
    reassessmentRequiredCount,
    pendingCompletionCount,
    pendingApprovalCount,
    unableToDetermineCount,
    affectedResidentCount,
    status: metricStatus,
    displayLabel: displayLabelFor(metricStatus),
    explanation: `${numerator} of ${denominator} mandatory resident Risk Assessment requirements are current.`,
    policyVersion: POLICY.version,
    route,
    generatedAt,
    results,
  };
}

export function resolveApplicableAssessmentRequirements(input: {
  resident: Resident;
  nursingHomeId: string;
  reportingDate: string;
  requirements: AssessmentRequirementRecord[];
}): ResidentAssessmentRequirementInstance[] {
  return input.requirements
    .filter((requirement) => requirementAppliesToResident(requirement, input.resident, input.nursingHomeId, input.reportingDate))
    .map((requirement) => ({
      residentId: input.resident.id,
      assessmentRequirementId: requirement.id,
      assessmentTypeId: requirement.assessmentType || requirement.assessmentTypeId || requirement.type || "unknown",
      mandatory: requirement.mandatory !== false,
      applicableFrom: requirement.effectiveFrom || input.resident.admissionDate || input.reportingDate,
      applicableTo: requirement.effectiveTo,
      dueAt: requirement.effectiveFrom || input.resident.admissionDate || input.reportingDate,
      requirementVersion: requirement.requirementVersion || 1,
      requirement,
    }));
}

export function resolveCurrentAssessmentForRequirement(input: {
  instance: ResidentAssessmentRequirementInstance;
  resident?: Resident;
  assessments: Assessment[];
  reportingDate: string;
  reassessmentTriggers: Array<{ residentId: string; assessmentType?: string; type?: string; createdAt?: string; at?: string; resolvedAt?: string; trigger?: string; note?: string }>;
}): AssessmentRequirementComplianceResult {
  const type = String(input.instance.assessmentTypeId);
  const residentAssessments = input.assessments
    .filter((assessment) => assessment.residentId === input.instance.residentId && assessment.type === type)
    .filter((assessment) => !assessment.deletedAt && !assessment.archivedAt && !assessment.supersededById && !["deleted", "archived", "superseded"].includes(String(assessment.status || "")))
    .filter((assessment) => toDate(assessment.date) <= input.reportingDate)
    .sort((a, b) => toDate(b.date).localeCompare(toDate(a.date)));
  const latest = residentAssessments[0];
  const pending = residentAssessments.find((assessment) => ["draft", "in_progress"].includes(String(assessment.status || "")));
  if (pending && !latestCompleted(residentAssessments)) return baseResult(input, "pending_completion", pending);
  if (latest && latest.status === "under_review") return baseResult(input, "pending_approval", latest);

  const current = latestCompleted(residentAssessments);
  if (!current) return baseResult(input, "missing");

  const trigger = input.reassessmentTriggers.find((item) =>
    item.residentId === input.instance.residentId &&
    !item.resolvedAt &&
    (!item.assessmentType || item.assessmentType === type || item.type === type) &&
    toDate(item.createdAt || item.at) > toDate(current.date),
  );
  if (trigger) return { ...baseResult(input, "reassessment_required", current), triggerExplanation: trigger.trigger || trigger.note || "Reassessment trigger recorded." };

  const reviewDueAt = current.reviewDate || current.nextReassessmentDate || addDays(toDate(current.date), input.instance.requirement.reviewFrequencyDays || 90);
  if (reviewDueAt <= input.reportingDate) return { ...baseResult(input, "overdue", current), reviewDueAt };
  const warningDate = addDays(input.reportingDate, input.instance.requirement.dueSoonWarningDays ?? POLICY.defaultDueSoonWarningDays);
  if (reviewDueAt <= warningDate) return { ...baseResult(input, "due_soon", current), reviewDueAt };
  return { ...baseResult(input, "current", current), reviewDueAt };
}

function isRiskRequirement(requirement: AssessmentRequirementRecord) {
  if (requirement.mandatory === false) return false;
  if (requirement.active === false) return false;
  if (["inactive", "retired", "entered_in_error"].includes(String(requirement.status || ""))) return false;
  return requirement.includeInDonRiskAssessmentMetric === true || requirement.category === "risk";
}

function isRequirementEffective(requirement: AssessmentRequirementRecord, reportingDate: string, nursingHomeId?: string) {
  const home = requirement.nursingHomeId || requirement.facilityId;
  if (nursingHomeId && home && home !== nursingHomeId) return false;
  if (requirement.effectiveFrom && requirement.effectiveFrom > reportingDate) return false;
  if (requirement.effectiveTo && requirement.effectiveTo < reportingDate) return false;
  return true;
}

function requirementAppliesToResident(requirement: AssessmentRequirementRecord, resident: Resident, nursingHomeId: string, reportingDate: string) {
  if (!isRequirementEffective(requirement, reportingDate, nursingHomeId)) return false;
  if (requirement.wardId && resident.wingId !== requirement.wardId) return false;
  if (requirement.residentStatuses?.length && !requirement.residentStatuses.includes(resident.status)) return false;
  return true;
}

function isResidentInScope(resident: Resident, reportingDate: string, nursingHomeId?: string) {
  if (resident.deletedAt || resident.status === "deleted" || resident.status === "discharged" || resident.status === "deceased") return false;
  if (nursingHomeId && resident.facilityId && resident.facilityId !== nursingHomeId) return false;
  if (resident.admissionDate && resident.admissionDate > reportingDate) return false;
  if (resident.dischargeDate && resident.dischargeDate <= reportingDate) return false;
  return resident.status === "active" || resident.lifecycleStatus === "active" || resident.residentType === "active_respite";
}

function latestCompleted(assessments: Assessment[]) {
  return assessments.find((assessment) => (assessment.status || "completed") === "completed");
}

function baseResult(input: { instance: ResidentAssessmentRequirementInstance; resident?: Resident }, status: AssessmentRequirementComplianceStatus, assessment?: Assessment): AssessmentRequirementComplianceResult {
  return {
    instance: input.instance,
    resident: input.resident,
    status,
    currentAssessment: assessment,
    lastCompletedAt: assessment?.date,
  };
}

function countStatus(results: AssessmentRequirementComplianceResult[], status: AssessmentRequirementComplianceStatus) {
  return results.filter((result) => result.status === status).length;
}

function metricStatusFor(value: number | undefined, criticalMissing: boolean, unresolved: number): DonRiskAssessmentMetric["status"] {
  if (value === undefined) return "not_applicable";
  if (unresolved > 0) return "partially_available";
  if (criticalMissing) return "attention";
  if (value >= POLICY.thresholds.upToDate) return "up_to_date";
  if (value >= POLICY.thresholds.attention) return "attention";
  if (value >= POLICY.thresholds.poor) return "poor";
  return "critical";
}

function displayLabelFor(status: DonRiskAssessmentMetric["status"]) {
  if (status === "up_to_date") return "Up to Date";
  if (status === "attention") return "Attention";
  if (status === "poor") return "Improvement Required";
  if (status === "critical") return "Critical Attention";
  if (status === "not_configured") return "Set up mandatory Assessment Requirements";
  if (status === "partially_available") return "Partially Available";
  if (status === "not_applicable") return "Not Applicable";
  return "Error";
}

function emptyMetric(input: Pick<DonRiskAssessmentMetric, "status" | "displayLabel" | "explanation" | "route" | "generatedAt">): DonRiskAssessmentMetric {
  return {
    ...input,
    numerator: 0,
    denominator: 0,
    currentCount: 0,
    dueSoonCount: 0,
    overdueCount: 0,
    missingCount: 0,
    reassessmentRequiredCount: 0,
    pendingCompletionCount: 0,
    pendingApprovalCount: 0,
    unableToDetermineCount: 0,
    affectedResidentCount: 0,
    policyVersion: POLICY.version,
    results: [],
  };
}

function toDate(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
