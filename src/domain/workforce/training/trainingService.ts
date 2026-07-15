import type {
  EmploymentRecord,
  StaffDocumentVerificationStatus,
  StaffTrainingAssignment,
  StaffTrainingCompletion,
  StaffTrainingComplianceStatus,
  TrainingCourse,
  TrainingRequirement,
  TrainingRenewalRule,
} from "@/lib/care/types";
import type { EmploymentRecordId, StaffMemberId, UserAccountId } from "@/types/entityIds";
import { isCurrentEmployment } from "../employment/employmentStatus";

export interface CreateTrainingRequirementCommand {
  trainingCourseId: string;
  targetType: TrainingRequirement["targetType"];
  roleKeys?: string[];
  nursingHomeId?: string;
  wardId?: string;
  staffMemberId?: string;
  mandatory?: boolean;
  renewalRule?: TrainingRenewalRule;
  active?: boolean;
  effectiveFrom?: string;
  clientRequestId: string;
}

export interface AssignTrainingCommand {
  staffMemberId: string;
  employmentRecordId?: string;
  trainingCourseId: string;
  trainingRequirementId?: string;
  nursingHomeId?: string;
  wardId?: string;
  dueDate?: string;
  source?: StaffTrainingAssignment["source"];
  clientRequestId: string;
}

export interface RecordTrainingCompletionCommand {
  staffMemberId: string;
  employmentRecordId?: string;
  trainingCourseId: string;
  trainingAssignmentId?: string;
  completionDate: string;
  expiryDate?: string;
  score?: number;
  passMark?: number;
  result?: StaffTrainingCompletion["result"];
  deliveryMethod?: StaffTrainingCompletion["deliveryMethod"];
  providerName?: string;
  trainerName?: string;
  certificateDocumentId?: string;
  certificateFileId?: string;
  notes?: string;
  clientRequestId: string;
}

export interface TrainingState {
  staffMembers: { id: StaffMemberId | string }[];
  employmentRecords: EmploymentRecord[];
  trainingCourses: TrainingCourse[];
  trainingRequirements: TrainingRequirement[];
  staffTrainingAssignments: StaffTrainingAssignment[];
  staffTrainingCompletions: StaffTrainingCompletion[];
}

const addMonths = (date: string, months: number) => {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString().slice(0, 10);
};

export function calculateTrainingExpiry(course: TrainingCourse, completionDate: string, explicitExpiry?: string) {
  if (explicitExpiry) return explicitExpiry;
  if (!course.defaultValidityMonths || course.defaultRenewalFrequency === "no_expiry") return undefined;
  return addMonths(completionDate, course.defaultValidityMonths);
}

export function getTrainingComplianceStatus(input: {
  assignment?: StaffTrainingAssignment;
  completion?: StaffTrainingCompletion;
  course?: TrainingCourse;
  effectiveAt?: string;
  warningDays?: number;
}): StaffTrainingComplianceStatus {
  const effectiveAt = input.effectiveAt || new Date().toISOString().slice(0, 10);
  if (!input.assignment) return "not_required";
  if (input.assignment.status === "exempt") return "exempt";
  if (input.assignment.status === "cancelled" || input.assignment.status === "entered_in_error") return "not_required";
  if (!input.completion) {
    if (input.assignment.dueDate && input.assignment.dueDate < effectiveAt) return "overdue";
    return input.assignment.status === "in_progress" ? "in_progress" : "not_started";
  }
  if (input.completion.status === "verification_failed" || input.completion.verificationStatus === "failed") return "verification_failed";
  if (input.completion.status === "pending_verification" || input.completion.verificationStatus === "pending") return "pending_verification";
  if (input.completion.status !== "verified" || input.completion.verificationStatus !== "verified") return "pending_verification";
  if (input.completion.expiryDate) {
    const days = Math.ceil((Date.parse(input.completion.expiryDate) - Date.parse(effectiveAt)) / 86400000);
    if (days < 0) return "expired";
    if (days <= (input.warningDays ?? 30)) return "due_soon";
  }
  return "compliant";
}

export function createTrainingRequirement(command: CreateTrainingRequirementCommand, actorUserAccountId: string): TrainingRequirement {
  const now = new Date().toISOString();
  return {
    id: `training-requirement-${command.clientRequestId || Date.now()}`,
    trainingCourseId: command.trainingCourseId,
    targetType: command.targetType,
    roleKeys: command.roleKeys,
    nursingHomeId: command.nursingHomeId as any,
    wardId: command.wardId as any,
    staffMemberId: command.staffMemberId as any,
    mandatory: command.mandatory ?? true,
    renewalRule: command.renewalRule,
    initialDueRule: { dueFrom: "assignment_created", offsetDays: 30 },
    effectiveFrom: command.effectiveFrom || now.slice(0, 10),
    active: command.active ?? true,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as UserAccountId,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  };
}

export function assignTrainingToStaff(state: TrainingState, command: AssignTrainingCommand) {
  if (!state.staffMembers.some((staff) => String(staff.id) === command.staffMemberId)) throw new Error("The Training record could not be saved.");
  if (!state.trainingCourses.some((course) => course.id === command.trainingCourseId && course.status === "active")) throw new Error("The Training record could not be saved.");
  if (state.staffTrainingAssignments.some((assignment) =>
    String(assignment.staffMemberId) === command.staffMemberId &&
    assignment.trainingCourseId === command.trainingCourseId &&
    assignment.trainingRequirementId === command.trainingRequirementId &&
    !["cancelled", "entered_in_error"].includes(assignment.status),
  )) throw new Error("This Staff Member already has an active assignment for this requirement.");
  const now = new Date().toISOString();
  return {
    id: `staff-training-assignment-${command.clientRequestId || Date.now()}`,
    staffMemberId: command.staffMemberId as StaffMemberId,
    employmentRecordId: command.employmentRecordId as EmploymentRecordId | undefined,
    trainingCourseId: command.trainingCourseId,
    trainingRequirementId: command.trainingRequirementId,
    nursingHomeId: command.nursingHomeId as any,
    wardId: command.wardId as any,
    assignedAt: now,
    dueDate: command.dueDate,
    status: "assigned",
    source: command.source || "manual",
    createdAt: now,
    updatedAt: now,
  } satisfies StaffTrainingAssignment;
}

export function recordTrainingCompletion(state: TrainingState, command: RecordTrainingCompletionCommand, actorUserAccountId: string) {
  const course = state.trainingCourses.find((item) => item.id === command.trainingCourseId);
  if (!course || !command.completionDate) throw new Error("This completion date is invalid.");
  const now = new Date().toISOString();
  return {
    id: `staff-training-completion-${command.clientRequestId || Date.now()}`,
    staffMemberId: command.staffMemberId as StaffMemberId,
    employmentRecordId: command.employmentRecordId as EmploymentRecordId | undefined,
    trainingCourseId: command.trainingCourseId,
    trainingAssignmentId: command.trainingAssignmentId as any,
    completionDate: command.completionDate,
    expiryDate: calculateTrainingExpiry(course, command.completionDate, command.expiryDate),
    score: command.score,
    passMark: command.passMark,
    result: command.result || "completed",
    deliveryMethod: command.deliveryMethod,
    providerName: command.providerName,
    trainerName: command.trainerName,
    certificateDocumentId: command.certificateDocumentId,
    certificateFileId: command.certificateFileId,
    status: course.verificationRequired ? "pending_verification" : "verified",
    verificationStatus: course.verificationRequired ? "pending" : "verified",
    notes: command.notes,
    versionNumber: 1,
    versionChainId: `staff-training-completion-chain-${command.clientRequestId || Date.now()}`,
    createdAt: now,
    updatedAt: now,
    createdByUserAccountId: actorUserAccountId as UserAccountId,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  } satisfies StaffTrainingCompletion;
}

export function verifyTrainingCompletion(completion: StaffTrainingCompletion, status: StaffDocumentVerificationStatus, actorUserAccountId: string) {
  const now = new Date().toISOString();
  return {
    ...completion,
    status: status === "verified" ? "verified" : "verification_failed",
    verificationStatus: status,
    verifiedAt: status === "verified" ? now : completion.verifiedAt,
    verifiedByUserAccountId: status === "verified" ? actorUserAccountId as UserAccountId : completion.verifiedByUserAccountId,
    updatedAt: now,
    updatedByUserAccountId: actorUserAccountId as UserAccountId,
  } satisfies StaffTrainingCompletion;
}

export function generateTrainingAssignmentsForCurrentStaff(state: TrainingState, actorUserAccountId: string, clientRequestId = "training-generation") {
  const assignments: StaffTrainingAssignment[] = [];
  const activeEmployment = state.employmentRecords.filter((record) => isCurrentEmployment(record));
  for (const employment of activeEmployment) {
    for (const requirement of state.trainingRequirements.filter((item) => item.active && item.mandatory)) {
      if (requirement.roleKeys?.length && !requirement.roleKeys.includes(employment.primaryRoleKey || "")) continue;
      if (requirement.nursingHomeId && requirement.nursingHomeId !== employment.primaryNursingHomeId && requirement.nursingHomeId !== employment.nursingHomeId) continue;
      const exists = state.staffTrainingAssignments.some((assignment) =>
        String(assignment.staffMemberId) === String(employment.staffMemberId) &&
        assignment.trainingCourseId === requirement.trainingCourseId &&
        assignment.trainingRequirementId === requirement.id &&
        !["cancelled", "entered_in_error"].includes(assignment.status),
      );
      if (!exists) {
        assignments.push(assignTrainingToStaff(state, {
          staffMemberId: String(employment.staffMemberId),
          employmentRecordId: String(employment.id),
          trainingCourseId: requirement.trainingCourseId,
          trainingRequirementId: requirement.id,
          nursingHomeId: String(employment.primaryNursingHomeId || employment.nursingHomeId),
          dueDate: addMonths(employment.startDate, 1),
          source: "requirement",
          clientRequestId: `${clientRequestId}-${employment.id}-${requirement.id}`,
        }));
      }
    }
  }
  return assignments.map((assignment) => ({ ...assignment, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
}
