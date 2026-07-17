import type { StaffMember, StaffTrainingAssignment, StaffTrainingCompletion, TrainingCourse } from "@/lib/care/types";
import { latestTrainingCompletion, resolveTrainingAssignmentStatus, type OperationalTrainingStatus } from "./trainingMetricsService";

export type TrainingAssignmentStatusFilter = "active_and_completed" | "all" | OperationalTrainingStatus;
export type TrainingMandatoryFilter = "all" | "mandatory" | "optional";
export type TrainingCertificateFilter = "all" | "uploaded" | "missing" | "expired" | "expiring";
export type TrainingAssignmentSortKey = "staff" | "course" | "category" | "assignedAt" | "dueDate" | "status" | "completedAt" | "mandatory";
export type SortDirection = "asc" | "desc";

export interface TrainingAssignmentFilters {
  search?: string;
  nursingHomeId?: string;
  wardId?: string;
  staffMemberId?: string;
  role?: string;
  courseId?: string;
  category?: string;
  mandatory?: TrainingMandatoryFilter;
  status?: TrainingAssignmentStatusFilter;
  assignedFrom?: string;
  assignedTo?: string;
  dueFrom?: string;
  dueTo?: string;
  completedFrom?: string;
  completedTo?: string;
  certificate?: TrainingCertificateFilter;
  year?: string;
}

export interface TrainingAssignmentRow {
  assignment: StaffTrainingAssignment;
  course?: TrainingCourse;
  staff?: StaffMember;
  completion?: StaffTrainingCompletion;
  status: OperationalTrainingStatus;
  homeName: string;
  roleName: string;
}

export interface TrainingAssignmentQuery {
  filters: TrainingAssignmentFilters;
  sort?: { key: TrainingAssignmentSortKey; direction: SortDirection };
  page?: number;
  pageSize?: number;
  effectiveAt?: string;
}

export function buildTrainingAssignmentRows(input: {
  assignments: StaffTrainingAssignment[];
  completions: StaffTrainingCompletion[];
  courses: TrainingCourse[];
  staffMembers: StaffMember[];
  facilities?: { id: string; name: string }[];
  employmentRecords?: Array<{ staffMemberId: string; primaryRoleKey?: string; jobTitle?: string; primaryNursingHomeId?: string; nursingHomeId?: string }>;
  effectiveAt?: string;
}) {
  return input.assignments.map((assignment): TrainingAssignmentRow => {
    const course = input.courses.find((item) => item.id === assignment.trainingCourseId);
    const staff = input.staffMembers.find((item) => String(item.id) === String(assignment.staffMemberId));
    const completion = latestTrainingCompletion(input.completions, assignment);
    const status = resolveTrainingAssignmentStatus({ assignment, completions: input.completions, effectiveAt: input.effectiveAt });
    const employment = input.employmentRecords?.find((record) => String(record.staffMemberId) === String(assignment.staffMemberId));
    const homeId = String(assignment.nursingHomeId || staff?.primaryNursingHomeId || employment?.primaryNursingHomeId || employment?.nursingHomeId || "");
    return {
      assignment,
      course,
      staff,
      completion,
      status,
      homeName: input.facilities?.find((home) => home.id === homeId)?.name || "Not assigned",
      roleName: employment?.primaryRoleKey || employment?.jobTitle || "Not recorded",
    };
  });
}

export function queryTrainingAssignments(rows: TrainingAssignmentRow[], query: TrainingAssignmentQuery) {
  const filters = { status: "active_and_completed", mandatory: "all", certificate: "all", ...query.filters };
  const filtered = rows.filter((row) => matchesTrainingFilters(row, filters));
  const sorted = [...filtered].sort((a, b) => compareTrainingRows(a, b, query.sort));
  const pageSize = query.pageSize || 25;
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, query.page || 1), pageCount);
  const start = (page - 1) * pageSize;
  return { rows: sorted.slice(start, start + pageSize), total, page, pageSize, pageCount, allRows: sorted };
}

function matchesTrainingFilters(row: TrainingAssignmentRow, filters: TrainingAssignmentFilters) {
  const q = filters.search?.trim().toLowerCase();
  if (q && ![row.staff?.displayName, row.staff?.staffNumber, row.course?.title, row.course?.code].some((value) => String(value || "").toLowerCase().includes(q))) return false;
  if (filters.status && filters.status !== "all") {
    if (filters.status === "active_and_completed") {
      if (row.status === "cancelled" || row.status === "entered_in_error") return false;
    } else if (row.status !== filters.status) return false;
  }
  if (filters.nursingHomeId && filters.nursingHomeId !== "all" && String(row.assignment.nursingHomeId || row.staff?.primaryNursingHomeId || "") !== filters.nursingHomeId) return false;
  if (filters.wardId && filters.wardId !== "all" && String(row.assignment.wardId || "") !== filters.wardId) return false;
  if (filters.staffMemberId && filters.staffMemberId !== "all" && String(row.assignment.staffMemberId) !== filters.staffMemberId) return false;
  if (filters.role && filters.role !== "all" && row.roleName !== filters.role) return false;
  if (filters.courseId && filters.courseId !== "all" && row.assignment.trainingCourseId !== filters.courseId) return false;
  if (filters.category && filters.category !== "all" && row.course?.category !== filters.category) return false;
  if (filters.mandatory === "mandatory" && !(row.assignment.mandatory ?? row.course?.mandatoryByDefault)) return false;
  if (filters.mandatory === "optional" && (row.assignment.mandatory ?? row.course?.mandatoryByDefault)) return false;
  if (!inRange(row.assignment.assignedAt?.slice(0, 10), filters.assignedFrom, filters.assignedTo)) return false;
  if (!inRange(row.assignment.dueDate, filters.dueFrom, filters.dueTo)) return false;
  const completedDate = row.completion?.completionDate || row.assignment.completedAt?.slice(0, 10);
  if (!inRange(completedDate, filters.completedFrom, filters.completedTo)) return false;
  if (filters.year && filters.year !== "all" && completedDate?.slice(0, 4) !== filters.year) return false;
  const hasCertificate = Boolean(row.assignment.certificateDocumentId || row.completion?.certificateDocumentId || row.completion?.certificateFileId);
  if (filters.certificate === "uploaded" && !hasCertificate) return false;
  if (filters.certificate === "missing" && hasCertificate) return false;
  return true;
}

function compareTrainingRows(a: TrainingAssignmentRow, b: TrainingAssignmentRow, sort?: TrainingAssignmentQuery["sort"]) {
  if (!sort) {
    const priority: Record<OperationalTrainingStatus, number> = { overdue: 0, in_progress: 1, not_started: 2, completed: 3, cancelled: 4, entered_in_error: 5 };
    return priority[a.status] - priority[b.status] || compare(a.assignment.dueDate || "9999-99-99", b.assignment.dueDate || "9999-99-99") || compare(surname(a.staff?.displayName), surname(b.staff?.displayName));
  }
  const dir = sort.direction === "desc" ? -1 : 1;
  const value = (row: TrainingAssignmentRow) => {
    if (sort.key === "staff") return row.staff?.displayName || "";
    if (sort.key === "course") return row.course?.title || "";
    if (sort.key === "category") return row.course?.category || "";
    if (sort.key === "assignedAt") return row.assignment.assignedAt || "";
    if (sort.key === "dueDate") return row.assignment.dueDate || "";
    if (sort.key === "status") return row.status;
    if (sort.key === "completedAt") return row.completion?.completionDate || row.assignment.completedAt || "";
    if (sort.key === "mandatory") return row.assignment.mandatory ?? row.course?.mandatoryByDefault ? "1" : "0";
    return "";
  };
  return compare(value(a), value(b)) * dir || compare(surname(a.staff?.displayName), surname(b.staff?.displayName));
}

function inRange(value?: string, from?: string, to?: string) {
  if (!from && !to) return true;
  if (!value) return false;
  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
}

function compare(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function surname(value?: string) {
  const parts = String(value || "").trim().split(/\s+/);
  return parts.at(-1) || "";
}
