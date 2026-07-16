import type {
  Facility,
  StaffMember,
  StaffTrainingAssignment,
  StaffTrainingCompletion,
  TrainingCourse,
  TrainingDeliveryMethod,
  TrainingRequirement,
} from "@/lib/care/types";
import { getTrainingComplianceMetric, latestTrainingCompletion } from "./trainingMetricsService";
import { getTrainingComplianceStatus } from "./trainingService";

export type TrainingDashboardAvailability = "available" | "partially_available" | "not_configured" | "not_applicable";

export interface TrainingDashboardMetric {
  value: string;
  numerator?: number;
  denominator?: number;
  percentage?: number;
  availability: TrainingDashboardAvailability;
  explanation: string;
  route: string;
  records: unknown[];
}

export interface TrainingDashboardViewModel {
  reportingDate: string;
  reportingPeriod: { from: string; to: string };
  homeCount: number;
  homeLabel: string;
  metrics: {
    overallCompliance: TrainingDashboardMetric;
    mandatoryCompliance: TrainingDashboardMetric;
    overdueTraining: TrainingDashboardMetric;
    trainingInProgress: TrainingDashboardMetric;
    coursesCompleted: TrainingDashboardMetric;
    totalTrainingHours: TrainingDashboardMetric;
  };
  mandatoryComplianceByCategory: Array<{ category: string; compliancePercentage?: number; targetPercentage?: number; compliant: number; denominator: number; overdue: number; route: string }>;
  trainingStatusOverview: {
    countingUnit: "assignments";
    total: number;
    compliant: number;
    inProgress: number;
    overdue: number;
    notStarted: number;
    dueSoon: number;
    pendingVerification: number;
    explanation: string;
  };
  overdueByAge: Array<{ label: string; staffCount: number; assignmentCount: number; oldestDueDate?: string; route: string }>;
  completionTrend: Array<{ label: string; verified: number; pendingVerification: number; failed: number }>;
  categoriesNeedingAttention: Array<{ category: string; compliancePercentage?: number; overdue: number; reason: string; route: string }>;
  upcomingSessions: Array<{ title: string; date: string; route: string }>;
  deliveryMethodBreakdown: Array<{ deliveryMethod: TrainingDeliveryMethod | "not_recorded"; count: number; percentage?: number; route: string }>;
  popularElearningCourses: Array<{ courseTitle: string; completions: number; route: string }>;
  homeCompliance: Array<{ homeId: string; homeName: string; totalAssignments: number; compliant: number; inProgress: number; overdue: number; compliancePercentage?: number; route: string }>;
  certificationAndCompetencySummary: {
    activeCertificates: TrainingDashboardMetric;
    expiringSoon: TrainingDashboardMetric;
    expired: TrainingDashboardMetric;
    competenciesMet: TrainingDashboardMetric;
  };
  alerts: Array<{ label: string; count: number; route: string }>;
  generatedAt: string;
}

export function getTrainingDashboard(input: {
  reportingDate: string;
  reportingPeriod: { from: string; to: string };
  facilities: Facility[];
  staffMembers: StaffMember[];
  trainingCourses: TrainingCourse[];
  trainingRequirements: TrainingRequirement[];
  staffTrainingAssignments: StaffTrainingAssignment[];
  staffTrainingCompletions: StaffTrainingCompletion[];
  nursingHomeId?: string;
}): TrainingDashboardViewModel {
  const homes = input.nursingHomeId ? input.facilities.filter((home) => home.id === input.nursingHomeId) : input.facilities;
  const homeIds = new Set(homes.map((home) => String(home.id)));
  const courses = input.trainingCourses.filter((course) => course.status !== "retired");
  const assignments = input.staffTrainingAssignments.filter((assignment) =>
    assignment.status !== "entered_in_error" &&
    (!assignment.nursingHomeId || homeIds.size === 0 || homeIds.has(String(assignment.nursingHomeId)))
  );
  const completions = input.staffTrainingCompletions.filter((completion) =>
    completion.status !== "entered_in_error" &&
    input.reportingPeriod.from <= completion.completionDate &&
    completion.completionDate <= input.reportingPeriod.to
  );
  const allCompletions = input.staffTrainingCompletions.filter((completion) => completion.status !== "entered_in_error");
  const activeRequirements = input.trainingRequirements.filter((requirement) =>
    requirement.active &&
    (!requirement.nursingHomeId || homeIds.has(String(requirement.nursingHomeId)))
  );
  const compliance = getTrainingComplianceMetric({ assignments, completions: allCompletions, courses, effectiveAt: input.reportingDate });
  const mandatoryAssignmentIds = new Set(activeRequirements.filter((requirement) => requirement.mandatory).map((requirement) => requirement.id));
  const mandatoryAssignments = assignments.filter((assignment) => !assignment.trainingRequirementId || mandatoryAssignmentIds.has(assignment.trainingRequirementId));
  const mandatory = getTrainingComplianceMetric({ assignments: mandatoryAssignments, completions: allCompletions, courses, effectiveAt: input.reportingDate });
  const inProgressRecords = [
    ...compliance.inProgressAssignments,
    ...compliance.pendingVerificationAssignments,
  ];
  const verifiedCompletions = completions.filter((completion) => completion.status === "verified" && completion.verificationStatus === "verified");
  const pendingCompletions = completions.filter((completion) => completion.status === "pending_verification" || completion.verificationStatus === "pending");
  const failedCompletions = completions.filter((completion) => completion.status === "verification_failed" || completion.verificationStatus === "failed");
  const totalTrainingMinutes = verifiedCompletions.reduce((sum, completion) => {
    const course = courses.find((item) => item.id === completion.trainingCourseId);
    return sum + estimateCourseMinutes(course);
  }, 0);

  return {
    reportingDate: input.reportingDate,
    reportingPeriod: input.reportingPeriod,
    homeCount: homes.length,
    homeLabel: homes.length === 1 ? homes[0]?.name || "1 Care Home" : `${homes.length} Care Homes`,
    metrics: {
      overallCompliance: percentMetric(compliance.numerator, compliance.denominator, "No Training Assignments apply to the selected scope.", "/workforce/training?view=assignments", assignments),
      mandatoryCompliance: percentMetric(mandatory.numerator, mandatory.denominator, activeRequirements.length ? "No mandatory Training Assignments apply to the selected scope." : "No Training Requirements have been configured.", "/workforce/training?mandatory=true", mandatoryAssignments),
      overdueTraining: countMetric(compliance.overdueAssignments.length + compliance.expiredAssignments.length, "Overdue or expired active training assignments.", "/workforce/training?status=overdue", [...compliance.overdueAssignments, ...compliance.expiredAssignments]),
      trainingInProgress: countMetric(inProgressRecords.length, "Assignments in progress or pending verification.", "/workforce/training?status=in_progress", inProgressRecords),
      coursesCompleted: countMetric(verifiedCompletions.length, `${pendingCompletions.length} pending verification, ${failedCompletions.length} failed in the selected period.`, "/workforce/training?view=completions", verifiedCompletions),
      totalTrainingHours: totalTrainingMinutes ? countMetric(round1(totalTrainingMinutes / 60), "Calculated from verified completions and configured course duration where available.", "/workforce/training?view=hours", verifiedCompletions) : { value: "Not Configured", availability: "not_configured", explanation: "No verified completion records with trusted duration exist for the selected period.", route: "/workforce/training?view=hours", records: [] },
    },
    mandatoryComplianceByCategory: byCategory(mandatoryAssignments, allCompletions, courses, input.reportingDate),
    trainingStatusOverview: {
      countingUnit: "assignments",
      total: mandatory.denominator,
      compliant: mandatory.compliantAssignments.length,
      inProgress: mandatory.inProgressAssignments.length,
      overdue: mandatory.overdueAssignments.length + mandatory.expiredAssignments.length,
      notStarted: mandatory.notStartedAssignments.length,
      dueSoon: mandatory.dueSoonAssignments.length,
      pendingVerification: mandatory.pendingVerificationAssignments.length,
      explanation: "Counts active mandatory assignments, not total staff.",
    },
    overdueByAge: overdueAge([...compliance.overdueAssignments, ...compliance.expiredAssignments], input.reportingDate),
    completionTrend: completionTrend(allCompletions, input.reportingDate),
    categoriesNeedingAttention: byCategory(mandatoryAssignments, allCompletions, courses, input.reportingDate)
      .filter((item) => item.denominator > 0 && ((item.compliancePercentage ?? 0) < (item.targetPercentage ?? 85) || item.overdue > 0))
      .map((item) => ({ category: item.category, compliancePercentage: item.compliancePercentage, overdue: item.overdue, reason: item.overdue ? `${item.overdue} overdue assignment(s)` : "Compliance below target", route: item.route })),
    upcomingSessions: [],
    deliveryMethodBreakdown: deliveryMethods(verifiedCompletions),
    popularElearningCourses: popularElearning(verifiedCompletions, courses),
    homeCompliance: homeCompliance(homes, assignments, allCompletions, courses, input.reportingDate),
    certificationAndCompetencySummary: {
      activeCertificates: countMetric(allCompletions.filter((completion) => Boolean(completion.certificateDocumentId || completion.certificateFileId) && (!completion.expiryDate || completion.expiryDate >= input.reportingDate)).length, "Verified completions with active certificate evidence.", "/workforce/training?view=certificates", allCompletions),
      expiringSoon: countMetric(allCompletions.filter((completion) => completion.expiryDate && completion.expiryDate >= input.reportingDate && completion.expiryDate <= addDays(input.reportingDate, 30)).length, "Certificates or completions expiring in the next 30 days.", "/workforce/training?view=certificates&expiry=soon", allCompletions),
      expired: countMetric(compliance.expiredAssignments.length, "Assignments whose latest verified completion has expired.", "/workforce/training?status=expired", compliance.expiredAssignments),
      competenciesMet: { value: "Not Configured", availability: "not_configured", explanation: "Competency requirements are managed in the Competencies workspace.", route: "/workforce/competencies", records: [] },
    },
    alerts: [
      { label: "Overdue Training", count: compliance.overdueAssignments.length, route: "/workforce/training?status=overdue" },
      { label: "Expired Training", count: compliance.expiredAssignments.length, route: "/workforce/training?status=expired" },
      { label: "Pending Verification", count: compliance.pendingVerificationAssignments.length, route: "/workforce/training?status=pending_verification" },
    ],
    generatedAt: new Date().toISOString(),
  };
}

function percentMetric(numerator: number, denominator: number, empty: string, route: string, records: unknown[]): TrainingDashboardMetric {
  if (!denominator) return { value: "Not Applicable", availability: "not_applicable", explanation: empty, route, records: [] };
  const percentage = Math.round((numerator / denominator) * 100);
  return { value: `${percentage}%`, numerator, denominator, percentage, availability: "available", explanation: `${numerator} of ${denominator} assignments are compliant or due soon.`, route, records };
}

function countMetric(value: number, explanation: string, route: string, records: unknown[]): TrainingDashboardMetric {
  return { value: String(value), numerator: value, availability: "available", explanation, route, records };
}

function byCategory(assignments: StaffTrainingAssignment[], completions: StaffTrainingCompletion[], courses: TrainingCourse[], reportingDate: string) {
  return [...new Set(courses.map((course) => course.category))].map((category) => {
    const categoryCourses = courses.filter((course) => course.category === category);
    const ids = new Set(categoryCourses.map((course) => course.id));
    const rows = assignments.filter((assignment) => ids.has(assignment.trainingCourseId));
    const compliant = rows.filter((assignment) => {
      const completion = latestTrainingCompletion(completions, assignment);
      const course = courses.find((item) => item.id === assignment.trainingCourseId);
      return ["compliant", "due_soon"].includes(getTrainingComplianceStatus({ assignment, completion, course, effectiveAt: reportingDate }));
    }).length;
    const overdue = rows.filter((assignment) => {
      const completion = latestTrainingCompletion(completions, assignment);
      const course = courses.find((item) => item.id === assignment.trainingCourseId);
      return ["overdue", "expired"].includes(getTrainingComplianceStatus({ assignment, completion, course, effectiveAt: reportingDate }));
    }).length;
    return { category, compliant, denominator: rows.length, overdue, compliancePercentage: rows.length ? Math.round((compliant / rows.length) * 100) : undefined, targetPercentage: 85, route: `/workforce/training?category=${category}` };
  }).filter((item) => item.denominator > 0);
}

function overdueAge(assignments: StaffTrainingAssignment[], reportingDate: string) {
  const bands = [
    { label: "1-7 days", min: 1, max: 7 },
    { label: "8-15 days", min: 8, max: 15 },
    { label: "16-30 days", min: 16, max: 30 },
    { label: "31-60 days", min: 31, max: 60 },
    { label: "61-90 days", min: 61, max: 90 },
    { label: "91+ days", min: 91, max: Infinity },
  ];
  return bands.map((band) => {
    const rows = assignments.filter((assignment) => {
      if (!assignment.dueDate) return false;
      const days = Math.floor((Date.parse(reportingDate) - Date.parse(assignment.dueDate)) / 86400000);
      return days >= band.min && days <= band.max;
    });
    return { label: band.label, staffCount: new Set(rows.map((row) => String(row.staffMemberId))).size, assignmentCount: rows.length, oldestDueDate: rows.map((row) => row.dueDate).filter(Boolean).sort()[0], route: `/workforce/training?overdueAge=${encodeURIComponent(band.label)}` };
  }).filter((band) => band.assignmentCount > 0);
}

function completionTrend(completions: StaffTrainingCompletion[], reportingDate: string) {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(`${reportingDate}T00:00:00.000Z`);
    date.setUTCMonth(date.getUTCMonth() - (5 - index));
    const key = date.toISOString().slice(0, 7);
    const rows = completions.filter((completion) => completion.completionDate.startsWith(key));
    return { label: key, verified: rows.filter((row) => row.status === "verified").length, pendingVerification: rows.filter((row) => row.status === "pending_verification").length, failed: rows.filter((row) => row.status === "verification_failed").length };
  });
}

function deliveryMethods(completions: StaffTrainingCompletion[]) {
  const total = completions.length;
  const keys = [...new Set(completions.map((completion) => completion.deliveryMethod || "not_recorded"))];
  return keys.map((deliveryMethod) => {
    const count = completions.filter((completion) => (completion.deliveryMethod || "not_recorded") === deliveryMethod).length;
    return { deliveryMethod, count, percentage: total ? Math.round((count / total) * 100) : undefined, route: `/workforce/training?deliveryMethod=${deliveryMethod}` };
  });
}

function popularElearning(completions: StaffTrainingCompletion[], courses: TrainingCourse[]) {
  const online = completions.filter((completion) => completion.deliveryMethod === "online");
  return [...new Set(online.map((completion) => completion.trainingCourseId))].map((courseId) => ({ courseTitle: courses.find((course) => course.id === courseId)?.title || "Training Course", completions: online.filter((completion) => completion.trainingCourseId === courseId).length, route: `/workforce/training?course=${courseId}` })).sort((a, b) => b.completions - a.completions).slice(0, 3);
}

function homeCompliance(homes: Facility[], assignments: StaffTrainingAssignment[], completions: StaffTrainingCompletion[], courses: TrainingCourse[], reportingDate: string) {
  return homes.map((home) => {
    const rows = assignments.filter((assignment) => String(assignment.nursingHomeId || "") === String(home.id));
    const statuses = rows.map((assignment) => getTrainingComplianceStatus({ assignment, completion: latestTrainingCompletion(completions, assignment), course: courses.find((course) => course.id === assignment.trainingCourseId), effectiveAt: reportingDate }));
    const compliant = statuses.filter((status) => status === "compliant" || status === "due_soon").length;
    return { homeId: home.id, homeName: home.name, totalAssignments: rows.length, compliant, inProgress: statuses.filter((status) => status === "in_progress" || status === "pending_verification").length, overdue: statuses.filter((status) => status === "overdue" || status === "expired").length, compliancePercentage: rows.length ? Math.round((compliant / rows.length) * 100) : undefined, route: `/workforce/training?home=${home.id}` };
  }).filter((home) => home.totalAssignments > 0);
}

function estimateCourseMinutes(course?: TrainingCourse) {
  if (!course) return 0;
  return course.deliveryMethods.includes("classroom") || course.deliveryMethods.includes("practical") ? 180 : 60;
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}
