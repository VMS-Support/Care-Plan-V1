import { getTrainingComplianceMetric } from "@/domain/workforce";
import { getDonRiskAssessmentMetric } from "@/domain/assessments/riskAssessmentComplianceService";

type Availability = "available" | "partially_available" | "not_configured" | "source_unavailable" | "not_applicable";
type Tone = "blue" | "green" | "orange" | "red";

export interface DonDashboardMetric {
  label: string;
  value: string;
  helper: string;
  percentage?: number;
  tone: Tone;
  route: string;
  availability: Availability;
}

export interface DonDashboardListRow {
  label: string;
  value: string;
  tone?: "orange" | "red";
  route: string;
  availability: Availability;
}

export interface DonDashboardViewModel {
  topMetrics: {
    residents: DonDashboardMetric;
    clinicalRisk: DonDashboardMetric;
    outstandingAlerts: DonDashboardMetric;
    staffOnDuty: DonDashboardMetric;
    readiness: DonDashboardMetric;
    infectionStatus: DonDashboardMetric;
  };
  complianceCards: DonDashboardMetric[];
  priorities: DonDashboardListRow[];
  incidentsToday: DonDashboardListRow[];
  residentsRequiringAttention: DonDashboardListRow[];
  communication: DonDashboardListRow[];
  briefing: {
    status: string;
    attentionCount: number;
    sourceNote: string;
  };
  generatedAt: string;
}

type StoreLike = Record<string, any>;

export function getDonDashboard(input: {
  care: StoreLike;
  reportingDate: string;
  generatedAt?: string;
}): DonDashboardViewModel {
  const care = input.care;
  const reportingDate = input.reportingDate;
  const generatedAt = input.generatedAt || new Date().toISOString();
  const residents = activeRows(care.residents).filter((resident) => resident.status !== "deleted");
  const activeResidents = residents.filter((resident) => resident.status === "active");
  const residentIds = new Set(activeResidents.map((resident) => resident.id));
  const activeBeds = activeRows(care.beds).filter((bed) => bed.active !== false && bed.status !== "out_of_service");
  const occupiedBeds = activeRows(care.bedAssignments).filter((assignment) => assignment.status === "active");
  const bedTotal = activeBeds.length || occupiedBeds.length;

  const alerts = openAlerts(care, residentIds);
  const assessments = activeRows(care.assessments).filter((assessment) => residentIds.has(assessment.residentId));
  const dueAssessments = assessments.filter((assessment) => isAssessmentDue(assessment, reportingDate));
  const carePlanCompletionScope = getCarePlanCompletionScope(care, residentIds, reportingDate);
  const activeProblems = carePlanCompletionScope.activeProblems;
  const dueCarePlans = carePlanCompletionScope.dueCarePlans;
  const incidents = activeRows(care.incidents).filter((incident) => residentIds.has(incident.residentId) && incident.recordStatus !== "deleted");
  const todayIncidents = incidents.filter((incident) => incident.date === reportingDate);
  const openIncidents = incidents.filter((incident) => incident.status !== "closed" || incident.followUpRequired);
  const incidentActions = activeRows(care.incidentActions);
  const vitals = activeRows(care.vitals).filter((vital) => residentIds.has(vital.residentId) && !vital.deletedAt);
  const staffOnDuty = typeof care.getStaffOnDuty === "function" ? activeRows(care.getStaffOnDuty(care.activeFacilityId)) : [];
  const training = trainingCompliance(care, reportingDate);

  const highRiskResidentIds = new Set(
    assessments
      .filter((assessment) => ["high", "very_high"].includes(assessment.riskLevel))
      .map((assessment) => assessment.residentId),
  );
  const deteriorationResidentIds = new Set(
    alerts
      .filter((alert) => /news|deteriorat|oxygen|spo2|temperature|temp|glucose|pain|weight/i.test(`${alert.title || ""} ${alert.message || ""}`))
      .map((alert) => alert.residentId),
  );
  const highPainResidentIds = new Set(vitals.filter((vital) => Number(vital.painScore || 0) >= 7).map((vital) => vital.residentId));
  const weightConcernResidentIds = new Set(
    alerts
      .filter((alert) => /weight|nutrition|hydration/i.test(`${alert.title || ""} ${alert.message || ""}`))
      .map((alert) => alert.residentId),
  );

  const carePlanCompletion = percentageMetric({
    label: "Care Plan Completion",
    numerator: carePlanCompletionScope.upToDateCount,
    denominator: carePlanCompletionScope.totalCount,
    empty: "No active care plans configured.",
    helper: dueCarePlans.length ? "Requires Review" : "Up to Date",
    route: "/care-plans",
  });
  const riskAssessmentCompletion = donRiskAssessmentCard(care, reportingDate);
  const incidentManagement = percentageMetric({
    label: "Incident Management",
    numerator: openIncidents.filter((incident) => incident.status === "closed" || incidentActions.some((action) => action.incidentId === incident.id)).length,
    denominator: openIncidents.length,
    empty: "No open incident follow-up records.",
    helper: "Actions Completed",
    route: "/incidents",
    warningBelow: 80,
  });

  const attentionCount = alerts.length + dueAssessments.length + dueCarePlans.length + openIncidents.length + (training.overdueCount || 0);

  return {
    topMetrics: {
      residents: bedTotal
        ? {
            label: "Residents",
            value: `${activeResidents.length} / ${bedTotal}`,
            helper: `${Math.round((activeResidents.length / bedTotal) * 100)}% Occupancy`,
            percentage: Math.round((activeResidents.length / bedTotal) * 100),
            tone: "blue",
            route: "/residents",
            availability: "available",
          }
        : {
            label: "Residents",
            value: String(activeResidents.length),
            helper: "Bed capacity not configured",
            tone: "orange",
            route: "/residents",
            availability: "not_configured",
          },
      clinicalRisk: clinicalRiskMetric(alerts, dueAssessments, dueCarePlans, openIncidents),
      outstandingAlerts: {
        label: "Outstanding Alerts",
        value: String(alerts.length),
        helper: alerts.length ? "Requires Attention" : "No open clinical alerts",
        tone: alerts.some((alert) => alert.priority === "critical" || alert.severity === "critical") ? "red" : alerts.length ? "orange" : "green",
        route: "/alerts",
        availability: "available",
      },
      staffOnDuty: staffOnDuty.length
        ? {
            label: "Staff On Duty",
            value: String(staffOnDuty.length),
            helper: "Live roster / attendance",
            tone: "blue",
            route: "/staff-management",
            availability: "available",
          }
        : {
            label: "Staff On Duty",
            value: "Not Available",
            helper: "Attendance source unavailable",
            tone: "orange",
            route: "/staff-management",
            availability: "source_unavailable",
          },
      readiness: unavailableMetric("CQC / HIQA Readiness", "Source Module Unavailable", "/quality-governance"),
      infectionStatus: unavailableMetric("Infection Status", "Source Module Unavailable", "/quality-governance"),
    },
    complianceCards: [
      unavailableMetric("Medication Compliance", "Medication module unavailable", "/daily-notes"),
      carePlanCompletion,
      riskAssessmentCompletion,
      unavailableMetric("Staffing Level", "Roster establishment not configured", "/staff-management"),
      training.metric,
      incidentManagement,
      unavailableMetric("Maintenance Compliance", "Maintenance module unavailable", "/maintenance"),
      unavailableMetric("Infection Control", "Infection-control module unavailable", "/quality-governance"),
      documentationMetric(care, residentIds, reportingDate),
      unavailableMetric("Financial Performance", "Finance module unavailable", "/accounts"),
    ],
    priorities: [
      row("Care Plans Due", dueCarePlans.length, "/care-plans"),
      row("Assessments Overdue", dueAssessments.length, "/assessments", dueAssessments.some((assessment) => dateDue(assessment.dueDate || assessment.reviewDate || assessment.nextReassessmentDate, reportingDate, true))),
      row("Medication Reviews Due", "Source Unavailable", "/daily-notes", false, "source_unavailable"),
      row("Staff Training Due", training.overdueCount, "/workforce/training", training.overdueCount > 0),
      row("Maintenance High Priority", "Source Unavailable", "/maintenance", false, "source_unavailable"),
    ],
    incidentsToday: [
      row("Falls", todayIncidents.filter((incident) => incident.type === "fall").length, "/incidents"),
      row("Medication Errors", todayIncidents.filter((incident) => incident.type === "medication_error").length, "/incidents"),
      row("Behaviour", todayIncidents.filter((incident) => incident.type === "behaviour").length, "/incidents"),
      row("Injuries", todayIncidents.filter((incident) => incident.type === "injury").length, "/incidents"),
      row("Safeguarding", "Not Configured", "/incidents", false, "not_configured"),
    ],
    residentsRequiringAttention: [
      row("High Risk", highRiskResidentIds.size, "/risks", highRiskResidentIds.size > 0),
      row("Deterioration", deteriorationResidentIds.size, "/alerts", deteriorationResidentIds.size > 0),
      row("Poor Appetite", "Not Configured", "/daily-care", false, "not_configured"),
      row("Weight Loss", weightConcernResidentIds.size, "/alerts", weightConcernResidentIds.size > 0),
      row("Pain Management", highPainResidentIds.size, "/vitals", highPainResidentIds.size > 0),
    ],
    communication: [
      row("Family Updates Due", "Source Unavailable", "/reports", false, "source_unavailable"),
      row("New Complaints", "Source Unavailable", "/quality-governance", false, "source_unavailable"),
      row("Meetings Today", "Source Unavailable", "/reports", false, "source_unavailable"),
      row("Consent Outstanding", "Source Unavailable", "/reports", false, "source_unavailable"),
    ],
    briefing: {
      status: attentionCount ? "Operational attention required." : "No immediate operational concerns in configured sources.",
      attentionCount,
      sourceNote: "Generated from configured resident, assessment, care plan, alert, incident and training records.",
    },
    generatedAt,
  };
}

function activeRows(rows: any): any[] {
  return Array.isArray(rows) ? rows.filter((row) => row && !row.deletedAt && row.recordStatus !== "deleted" && row.status !== "deleted") : [];
}

function openAlerts(care: StoreLike, residentIds: Set<string>) {
  const standardAlerts = activeRows(care.alerts).filter((alert) =>
    residentIds.has(alert.residentId) && !alert.acknowledged && !alert.resolvedAt,
  );
  const clinicalAlerts = activeRows(care.clinicalAlerts).filter((alert) =>
    residentIds.has(alert.residentId) && !alert.dismissedAt && !alert.resolvedAt,
  );
  return [...standardAlerts, ...clinicalAlerts];
}

function isAssessmentDue(assessment: any, reportingDate: string) {
  if (["draft", "in_progress", "review_due"].includes(assessment.status)) return true;
  return dateDue(assessment.dueDate || assessment.reviewDate || assessment.nextReassessmentDate, reportingDate);
}

function dateDue(date: string | undefined, reportingDate: string, overdueOnly = false) {
  if (!date) return false;
  return overdueOnly ? date < reportingDate : date <= reportingDate;
}

const INACTIVE_CARE_PLAN_STATUSES = new Set([
  "archived",
  "completed",
  "discontinued",
  "entered_in_error",
  "inactive",
  "resolved",
  "superseded",
]);

function getCarePlanCompletionScope(care: StoreLike, residentIds: Set<string>, reportingDate: string) {
  const currentProblems = activeRows(care.carePlanProblems).filter(
    (problem) =>
      residentIds.has(problem.residentId) &&
      !INACTIVE_CARE_PLAN_STATUSES.has(String(problem.status || "").toLowerCase()),
  );
  const dueProblems = currentProblems.filter((problem) => isCarePlanItemDue(problem, reportingDate));
  const totalCount = currentProblems.length;
  const dueCount = dueProblems.length;

  return {
    activeProblems: currentProblems,
    dueCarePlans: dueProblems,
    totalCount,
    dueCount,
    upToDateCount: Math.max(0, totalCount - dueCount),
  };
}

function isCarePlanItemDue(item: any, reportingDate: string) {
  const status = String(item.status || "").toLowerCase();
  if (status.includes("overdue") || status === "review_due" || status === "evaluation_due" || status === "under_review") {
    return true;
  }
  if (!item.reviewDate && !item.evaluationDate) return true;
  return dateDue(item.reviewDate, reportingDate) || dateDue(item.evaluationDate, reportingDate);
}

function percentageMetric(input: {
  label: string;
  numerator: number;
  denominator: number;
  empty: string;
  helper: string;
  route: string;
  warningBelow?: number;
}): DonDashboardMetric {
  if (!input.denominator) {
    return {
      label: input.label,
      value: "Not Applicable",
      helper: input.empty,
      tone: "orange",
      route: input.route,
      availability: "not_applicable",
    };
  }
  const percentage = Math.round((input.numerator / input.denominator) * 100);
  return {
    label: input.label,
    value: `${percentage}%`,
    helper: input.helper,
    percentage,
    tone: percentage < (input.warningBelow ?? 90) ? "orange" : "green",
    route: input.route,
    availability: "available",
  };
}

function unavailableMetric(label: string, helper: string, route: string): DonDashboardMetric {
  return {
    label,
    value: "Not Configured",
    helper,
    tone: "orange",
    route,
    availability: "source_unavailable",
  };
}

function donRiskAssessmentCard(care: StoreLike, reportingDate: string): DonDashboardMetric {
  const metric = getDonRiskAssessmentMetric({
    residents: activeRows(care.residents),
    assessments: activeRows(care.assessments),
    assessmentRequirements: activeRows(care.assessmentRequirements || care.assessmentRequirementState?.requirements),
    nursingHomeId: care.activeFacilityId,
    reportingDate,
    route: `/assessments?metric=don-risk-assessments&date=${reportingDate}`,
    reassessmentTriggers: activeRows(care.assessmentReviewTriggerEvents),
  });
  if (metric.status === "not_configured") {
    return {
      label: "Risk Assessments",
      value: "Not Configured",
      helper: metric.displayLabel,
      tone: "orange",
      route: metric.route,
      availability: "not_configured",
    };
  }
  if (metric.status === "not_applicable") {
    return {
      label: "Risk Assessments",
      value: "Not Applicable",
      helper: metric.displayLabel,
      tone: "orange",
      route: metric.route,
      availability: "not_applicable",
    };
  }
  const percentage = metric.value === undefined ? undefined : Math.round(metric.value);
  return {
    label: "Risk Assessments",
    value: percentage === undefined ? "Partially Available" : `${percentage}%`,
    helper: metric.displayLabel,
    percentage,
    tone: metric.status === "critical" ? "red" : metric.status === "poor" || metric.status === "attention" || metric.status === "partially_available" ? "orange" : "green",
    route: metric.route,
    availability: metric.status === "partially_available" ? "partially_available" : "available",
  };
}

function clinicalRiskMetric(alerts: any[], dueAssessments: any[], dueCarePlans: any[], openIncidents: any[]): DonDashboardMetric {
  const critical = alerts.some((alert) => alert.priority === "critical" || alert.severity === "critical") || openIncidents.some((incident) => incident.severity === "critical");
  const high = alerts.some((alert) => alert.priority === "high" || alert.severity === "high") || openIncidents.some((incident) => incident.severity === "high");
  const pressure = alerts.length + dueAssessments.length + dueCarePlans.length + openIncidents.length;
  const value = critical ? "Critical" : high || pressure >= 10 ? "High" : pressure >= 4 ? "Moderate" : "Low";
  return {
    label: "Clinical Risk",
    value,
    helper: "Overall Risk Status",
    tone: value === "Critical" || value === "High" ? "red" : value === "Moderate" ? "orange" : "green",
    route: "/alerts",
    availability: "available",
  };
}

function trainingCompliance(care: StoreLike, reportingDate: string) {
  const assignments = activeRows(care.staffTrainingAssignments).filter((assignment) => assignment.status !== "entered_in_error");
  const completions = activeRows(care.staffTrainingCompletions).filter((completion) => completion.status !== "entered_in_error");
  const courses = activeRows(care.trainingCourses).filter((course) => course.status !== "retired");
  if (!assignments.length || !courses.length) {
    return {
      overdueCount: 0,
      metric: {
        label: "Training Compliance",
        value: "Not Configured",
        helper: "No training assignments configured",
        tone: "orange",
        route: "/training-dashboard",
        availability: "not_configured" as Availability,
      },
    };
  }
  const compliance = getTrainingComplianceMetric({ assignments, completions, courses, effectiveAt: reportingDate });
  const percentage = compliance.denominator ? Math.round((compliance.numerator / compliance.denominator) * 100) : undefined;
  return {
    overdueCount: compliance.overdueAssignments.length + compliance.expiredAssignments.length,
    metric: {
      label: "Training Compliance",
      value: percentage === undefined ? "Not Applicable" : `${percentage}%`,
      helper: "Up to Date",
      percentage,
      tone: percentage !== undefined && percentage >= 90 ? "green" : "orange",
      route: "/training-dashboard",
      availability: percentage === undefined ? "not_applicable" : "available",
    } satisfies DonDashboardMetric,
  };
}

function documentationMetric(care: StoreLike, residentIds: Set<string>, reportingDate: string): DonDashboardMetric {
  const notes = activeRows(care.notes).filter((note) => residentIds.has(note.residentId) && note.date === reportingDate);
  const interventionLogs = activeRows(care.problemInterventionLogs).filter((log) => residentIds.has(log.residentId) && log.date === reportingDate);
  const tasks = activeRows(care.tasks).filter((task) => (!task.residentId || residentIds.has(task.residentId)) && task.dueDate === reportingDate);
  const completedTasks = tasks.filter((task) => task.status === "completed");
  const denominator = residentIds.size + tasks.length;
  const numerator = new Set(notes.map((note) => note.residentId)).size + new Set(interventionLogs.map((log) => log.residentId)).size + completedTasks.length;
  if (!denominator) return unavailableMetric("Documentation", "No resident documentation scope", "/reports");
  const percentage = Math.min(100, Math.round((numerator / denominator) * 100));
  return {
    label: "Documentation",
    value: `${percentage}%`,
    helper: "Completed",
    percentage,
    tone: percentage >= 90 ? "green" : "orange",
    route: "/reports",
    availability: "available",
  };
}

function row(label: string, value: string | number, route: string, alert = false, availability: Availability = "available"): DonDashboardListRow {
  const text = typeof value === "number" ? String(value) : value;
  return {
    label,
    value: text,
    tone: availability === "available" && alert ? "red" : typeof value === "number" && value > 0 ? "orange" : undefined,
    route,
    availability,
  };
}
