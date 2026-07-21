import type {
  AuditLog,
  Facility,
  MaintenanceWorkOrder,
  MaintenanceWorkOrderCategory,
  MaintenanceWorkOrderPriority,
  MaintenanceRiskConsequence,
  MaintenanceRiskLevel,
  MaintenanceRiskLikelihood,
  MaintenanceWorkOrderSource,
  MaintenanceWorkOrderStatus,
  MaintenanceWorkOrderType,
  Room,
  UserProfile,
  Ward,
} from "@/lib/care/types";

export const WORK_ORDER_TYPES: Array<{ value: MaintenanceWorkOrderType; label: string }> = [
  { value: "REACTIVE", label: "Reactive Maintenance" },
  { value: "PREVENTIVE", label: "Preventive Maintenance" },
  { value: "CORRECTIVE", label: "Corrective Maintenance" },
  { value: "EMERGENCY", label: "Emergency Repair" },
  { value: "INSPECTION_FOLLOW_UP", label: "Inspection Follow-Up" },
  { value: "COMPLIANCE_ACTION", label: "Compliance Action" },
  { value: "CONTRACTOR_WORK", label: "Contractor Work" },
  { value: "HOUSEKEEPING_REQUEST", label: "Housekeeping Request" },
  { value: "OTHER", label: "Other" },
];

export const WORK_ORDER_SOURCES: Array<{ value: MaintenanceWorkOrderSource; label: string }> = [
  { value: "STAFF_REPORT", label: "Staff Report" },
  { value: "MAINTENANCE_TEAM", label: "Maintenance Team" },
  { value: "PLANNED_MAINTENANCE", label: "Planned Maintenance" },
  { value: "SAFETY_INSPECTION", label: "Safety Inspection" },
  { value: "COMPLIANCE_INSPECTION", label: "Compliance Inspection" },
  { value: "AUDIT", label: "Audit" },
  { value: "INCIDENT", label: "Incident" },
  { value: "COMPLAINT", label: "Complaint" },
  { value: "HOUSEKEEPING", label: "Housekeeping" },
  { value: "CONTRACTOR", label: "Contractor" },
  { value: "SYSTEM_GENERATED", label: "System Generated" },
  { value: "OTHER", label: "Other" },
];

export const WORK_ORDER_CATEGORIES: Array<{ value: MaintenanceWorkOrderCategory; label: string }> = [
  { value: "FIRE_SAFETY", label: "Fire Safety" },
  { value: "WATER_SAFETY", label: "Water Safety" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "HEATING_VENTILATION", label: "Heating & Ventilation" },
  { value: "NURSE_CALL", label: "Nurse Call" },
  { value: "RESIDENT_EQUIPMENT", label: "Resident Equipment" },
  { value: "KITCHEN_EQUIPMENT", label: "Kitchen Equipment" },
  { value: "LAUNDRY_EQUIPMENT", label: "Laundry Equipment" },
  { value: "SLUICE_EQUIPMENT", label: "Sluice Equipment" },
  { value: "INTERNAL_LIGHTING", label: "Internal Lighting" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "GENERAL_EQUIPMENT", label: "General Equipment" },
  { value: "CLEANING_HOUSEKEEPING_SUPPORT", label: "Cleaning or Housekeeping Support" },
  { value: "OTHER", label: "Other" },
];

export const WORK_ORDER_PRIORITIES: Array<{ value: MaintenanceWorkOrderPriority; label: string; description: string }> = [
  { value: "CRITICAL", label: "Critical", description: "Immediate threat to life, safety, essential service or compliance." },
  { value: "HIGH", label: "High", description: "Significant safety or operational issue requiring urgent response." },
  { value: "MEDIUM", label: "Medium", description: "Material issue requiring prompt but not emergency action." },
  { value: "LOW", label: "Low", description: "Non-urgent repair with limited operational impact." },
  { value: "ROUTINE", label: "Routine", description: "Planned, cosmetic or low-risk work." },
];

export const WORK_ORDER_STATUSES: Array<{ value: MaintenanceWorkOrderStatus; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "AWAITING_ACCESS", label: "Awaiting Access" },
  { value: "AWAITING_PARTS", label: "Awaiting Parts" },
  { value: "AWAITING_CONTRACTOR", label: "Awaiting Contractor" },
  { value: "COMPLETED", label: "Completed" },
  { value: "VERIFICATION_REQUIRED", label: "Verification Required" },
  { value: "VERIFIED", label: "Verified" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ENTERED_IN_ERROR", label: "Entered in Error" },
];

export const ACTIVE_WORK_ORDER_STATUSES: MaintenanceWorkOrderStatus[] = [
  "DRAFT",
  "OPEN",
  "ASSIGNED",
  "ACCEPTED",
  "IN_PROGRESS",
  "ON_HOLD",
  "AWAITING_ACCESS",
  "AWAITING_PARTS",
  "AWAITING_CONTRACTOR",
  "VERIFICATION_REQUIRED",
];

export const WAITING_WORK_ORDER_STATUSES: MaintenanceWorkOrderStatus[] = [
  "ON_HOLD",
  "AWAITING_ACCESS",
  "AWAITING_PARTS",
  "AWAITING_CONTRACTOR",
];

export const HISTORICAL_WORK_ORDER_STATUSES: MaintenanceWorkOrderStatus[] = [
  "COMPLETED",
  "VERIFIED",
  "CLOSED",
  "CANCELLED",
  "ENTERED_IN_ERROR",
];

export const PRIORITY_RANK: Record<MaintenanceWorkOrderPriority, number> = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
  ROUTINE: 5,
};

export type WorkOrderPreset =
  | "active"
  | "unassigned"
  | "critical"
  | "high"
  | "due_today"
  | "overdue"
  | "in_progress"
  | "waiting"
  | "verification"
  | "completed"
  | "cancelled"
  | "all";

export type WorkOrderView = "list" | "board";
export type WorkOrderSortBy = "workOrderNumber" | "priority" | "status" | "createdAt" | "dueAt" | "home" | "assignee" | "updatedAt";
export type WorkOrderSortDirection = "asc" | "desc";

export interface WorkOrderQuery {
  view: WorkOrderView;
  search?: string;
  preset?: WorkOrderPreset;
  homeId?: string;
  wardId?: string;
  roomId?: string;
  status?: MaintenanceWorkOrderStatus[];
  priority?: MaintenanceWorkOrderPriority[];
  type?: MaintenanceWorkOrderType[];
  source?: MaintenanceWorkOrderSource[];
  category?: MaintenanceWorkOrderCategory[];
  assignedUserId?: string;
  reportedByUserId?: string;
  createdFrom?: string;
  createdTo?: string;
  dueFrom?: string;
  dueTo?: string;
  unassignedOnly?: boolean;
  overdueOnly?: boolean;
  residentSafetyImpact?: boolean;
  serviceDisruption?: boolean;
  complianceImpact?: boolean;
  archived?: boolean;
  active?: boolean;
  sortBy: WorkOrderSortBy;
  sortDirection: WorkOrderSortDirection;
  page: number;
  pageSize: number;
}

export interface CreateWorkOrderInput {
  title: string;
  description: string;
  type: MaintenanceWorkOrderType;
  source: MaintenanceWorkOrderSource;
  category: MaintenanceWorkOrderCategory;
  subcategory?: string;
  priority: MaintenanceWorkOrderPriority;
  homeId: string;
  wardId?: string;
  roomId?: string;
  exactLocation?: string;
  assetId?: string;
  affectedAssetDescription?: string;
  reporterContactDetails?: string;
  assignedUserId?: string;
  assignedTeamId?: string;
  supervisorUserId?: string;
  requiredResponseAt?: string;
  dueAt?: string;
  residentSafetyImpact?: boolean;
  serviceDisruption?: boolean;
  complianceImpact?: boolean;
  immediateRisk?: boolean;
  immediateControlSummary?: string;
  verificationRequired?: boolean;
  expectedVersion?: number;
  changeReason?: string;
  riskAssessment?: {
    likelihood: MaintenanceRiskLikelihood;
    consequence: MaintenanceRiskConsequence;
    manualOverrideLevel?: MaintenanceRiskLevel;
    manualOverrideReason?: string;
    requiresImmediateAction?: boolean;
    vulnerablePersonAffected?: boolean;
    essentialServiceAffected?: boolean;
    areaRestricted?: boolean;
    areaRestrictionDetails?: string;
    controlMeasures?: string;
  };
}

export type UpdateWorkOrderInput = Partial<
  Pick<
    MaintenanceWorkOrder,
    | "title"
    | "description"
    | "type"
    | "source"
    | "category"
    | "subcategory"
    | "priority"
    | "status"
    | "wardId"
    | "roomId"
    | "exactLocation"
    | "assetId"
    | "affectedAssetDescription"
    | "reporterContactDetails"
    | "assignedUserId"
    | "assignedTeamId"
    | "supervisorUserId"
    | "requiredResponseAt"
    | "dueAt"
    | "residentSafetyImpact"
    | "serviceDisruption"
    | "complianceImpact"
    | "immediateRisk"
    | "immediateControlSummary"
    | "verificationRequired"
  >
> & Pick<CreateWorkOrderInput, "expectedVersion" | "changeReason" | "riskAssessment">;

export interface WorkOrderDataSource {
  workOrders: MaintenanceWorkOrder[];
  facilities: Facility[];
  wards: Ward[];
  rooms: Room[];
  users: UserProfile[];
}

export interface WorkOrderListResult {
  records: MaintenanceWorkOrder[];
  allFiltered: MaintenanceWorkOrder[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  counts: Record<MaintenanceWorkOrderStatus, number>;
}

export interface WorkOrderValidationResult {
  valid: boolean;
  fieldErrors: Record<string, string>;
}

const valueSet = <T extends string>(items: Array<{ value: T }>) => new Set(items.map((item) => item.value));
const typeValues = valueSet(WORK_ORDER_TYPES);
const sourceValues = valueSet(WORK_ORDER_SOURCES);
const categoryValues = valueSet(WORK_ORDER_CATEGORIES);
const priorityValues = valueSet(WORK_ORDER_PRIORITIES);
const statusValues = valueSet(WORK_ORDER_STATUSES);

export const RISK_LEVEL_PRIORITY_MINIMUM: Record<MaintenanceRiskLevel, MaintenanceWorkOrderPriority> = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

export function calculateMaintenanceRisk(input?: CreateWorkOrderInput["riskAssessment"]) {
  if (!input) return undefined;
  const likelihood = Number(input.likelihood) as MaintenanceRiskLikelihood;
  const consequence = Number(input.consequence) as MaintenanceRiskConsequence;
  if (![1, 2, 3, 4, 5].includes(likelihood) || ![1, 2, 3, 4, 5].includes(consequence)) return undefined;
  const score = likelihood * consequence;
  const calculatedLevel: MaintenanceRiskLevel =
    score >= 20 ? "CRITICAL" : score >= 12 ? "HIGH" : score >= 5 ? "MEDIUM" : "LOW";
  return {
    likelihood,
    consequence,
    score,
    calculatedLevel,
    manualOverrideLevel: input.manualOverrideLevel,
    manualOverrideReason: input.manualOverrideReason?.trim() || undefined,
    requiresImmediateAction: Boolean(input.requiresImmediateAction),
    vulnerablePersonAffected: Boolean(input.vulnerablePersonAffected),
    essentialServiceAffected: Boolean(input.essentialServiceAffected),
    areaRestricted: Boolean(input.areaRestricted),
    areaRestrictionDetails: input.areaRestrictionDetails?.trim() || undefined,
    controlMeasures: input.controlMeasures?.trim() || undefined,
  };
}

export function effectiveRiskLevel(input?: CreateWorkOrderInput["riskAssessment"]) {
  const risk = calculateMaintenanceRisk(input);
  return risk?.manualOverrideLevel || risk?.calculatedLevel;
}

export function minimumPriorityForRisk(input?: CreateWorkOrderInput["riskAssessment"], immediateRisk?: boolean) {
  const level = effectiveRiskLevel(input);
  if (immediateRisk) return "HIGH";
  return level ? RISK_LEVEL_PRIORITY_MINIMUM[level] : undefined;
}

export function priorityMeetsMinimum(priority: MaintenanceWorkOrderPriority, minimum?: MaintenanceWorkOrderPriority) {
  if (!minimum) return true;
  return PRIORITY_RANK[priority] <= PRIORITY_RANK[minimum];
}

export function suggestedDueAt(priority: MaintenanceWorkOrderPriority, now = new Date()) {
  const hours: Record<MaintenanceWorkOrderPriority, number> = {
    CRITICAL: 4,
    HIGH: 24,
    MEDIUM: 72,
    LOW: 24 * 7,
    ROUTINE: 24 * 14,
  };
  return new Date(now.getTime() + hours[priority] * 60 * 60 * 1000).toISOString();
}

export function suggestedResponseAt(priority: MaintenanceWorkOrderPriority, now = new Date()) {
  const hours: Record<MaintenanceWorkOrderPriority, number> = {
    CRITICAL: 1,
    HIGH: 4,
    MEDIUM: 24,
    LOW: 72,
    ROUTINE: 24 * 7,
  };
  return new Date(now.getTime() + hours[priority] * 60 * 60 * 1000).toISOString();
}

export const workOrderLabel = <T extends string>(items: Array<{ value: T; label: string }>, value?: T) =>
  items.find((item) => item.value === value)?.label || value || "Not recorded";

export const workOrderTypeLabel = (value?: MaintenanceWorkOrderType) => workOrderLabel(WORK_ORDER_TYPES, value);
export const workOrderSourceLabel = (value?: MaintenanceWorkOrderSource) => workOrderLabel(WORK_ORDER_SOURCES, value);
export const workOrderCategoryLabel = (value?: MaintenanceWorkOrderCategory) => workOrderLabel(WORK_ORDER_CATEGORIES, value);
export const workOrderPriorityLabel = (value?: MaintenanceWorkOrderPriority) => workOrderLabel(WORK_ORDER_PRIORITIES, value);
export const workOrderStatusLabel = (value?: MaintenanceWorkOrderStatus) => workOrderLabel(WORK_ORDER_STATUSES, value);

export function isWorkOrderActive(record: MaintenanceWorkOrder) {
  return !record.archivedAt && ACTIVE_WORK_ORDER_STATUSES.includes(record.status);
}

export function isWorkOrderOverdue(record: MaintenanceWorkOrder, now = new Date()) {
  return Boolean(
    !record.archivedAt &&
      record.dueAt &&
      new Date(record.dueAt).getTime() < now.getTime() &&
      !["COMPLETED", "VERIFIED", "CLOSED", "CANCELLED", "ENTERED_IN_ERROR"].includes(record.status),
  );
}

export function workOrderLocationLabel(record: MaintenanceWorkOrder, source: Pick<WorkOrderDataSource, "facilities" | "wards" | "rooms">) {
  const home = source.facilities.find((item) => item.id === record.homeId)?.name || "Care Home";
  const ward = source.wards.find((item) => String(item.id) === String(record.wardId))?.name;
  const room = source.rooms.find((item) => String(item.id) === String(record.roomId));
  const roomLabel = room ? `Room ${room.roomNumber || room.number || room.name}` : undefined;
  return [home, ward, roomLabel, record.exactLocation || record.areaName].filter(Boolean).join(" - ");
}

export function workOrderAssigneeLabel(record: MaintenanceWorkOrder, users: UserProfile[]) {
  const user = record.assignedUserId ? users.find((item) => item.id === record.assignedUserId) : undefined;
  if (user && record.assignedTeamId) return `${user.name} / ${teamLabel(record.assignedTeamId)}`;
  if (user) return user.name;
  if (record.assignedTeamId) return teamLabel(record.assignedTeamId);
  return "Unassigned";
}

function teamLabel(teamId: string) {
  return teamId
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function defaultWorkOrderQuery(input: Partial<WorkOrderQuery> = {}): WorkOrderQuery {
  return {
    view: input.view || "list",
    preset: input.preset || "active",
    search: input.search || "",
    sortBy: input.sortBy || "dueAt",
    sortDirection: input.sortDirection || "asc",
    page: Math.max(1, input.page || 1),
    pageSize: [25, 50, 100].includes(input.pageSize || 25) ? input.pageSize || 25 : 25,
    ...input,
  };
}

export function validateWorkOrderInput(
  input: CreateWorkOrderInput | (UpdateWorkOrderInput & { homeId?: string }),
  source: Pick<WorkOrderDataSource, "facilities" | "wards" | "rooms" | "users">,
) {
  const fieldErrors: Record<string, string> = {};
  if ("title" in input && (!input.title || !input.title.trim())) fieldErrors.title = "Enter a short title for the issue.";
  if ("title" in input && input.title && input.title.length > 120) fieldErrors.title = "Keep the title under 120 characters.";
  if ("description" in input && (!input.description || !input.description.trim())) fieldErrors.description = "Describe the issue.";
  if ("description" in input && input.description && input.description.length > 2000) fieldErrors.description = "Keep the description under 2,000 characters.";
  if ("homeId" in input && (!input.homeId || !source.facilities.some((home) => home.id === input.homeId))) {
    fieldErrors.homeId = "Select a Care Home.";
  }
  if ("type" in input && input.type && !typeValues.has(input.type)) fieldErrors.type = "Select a valid Work Order type.";
  if ("source" in input && input.source && !sourceValues.has(input.source)) fieldErrors.source = "Select a valid source.";
  if ("category" in input && input.category && !categoryValues.has(input.category)) fieldErrors.category = "Select a valid category.";
  if ("priority" in input && input.priority && !priorityValues.has(input.priority)) fieldErrors.priority = "Select a valid priority.";
  if ("status" in input && input.status && !statusValues.has(input.status)) fieldErrors.status = "Select a valid status.";
  const homeId = "homeId" in input ? input.homeId : undefined;
  const ward = input.wardId ? source.wards.find((item) => String(item.id) === String(input.wardId)) : undefined;
  const room = input.roomId ? source.rooms.find((item) => String(item.id) === String(input.roomId)) : undefined;
  if (input.wardId && (!ward || (homeId && String(ward.nursingHomeId) !== homeId))) {
    fieldErrors.wardId = "The selected ward does not belong to this Care Home.";
  }
  if (input.roomId && (!room || (homeId && (String(room.facilityId || room.nursingHomeId) !== homeId)))) {
    fieldErrors.roomId = "The selected room does not belong to this Care Home.";
  }
  if (room && input.wardId && room.wardId && String(room.wardId) !== String(input.wardId)) {
    fieldErrors.roomId = "The selected room does not belong to the selected ward.";
  }
  if (input.assignedUserId && !source.users.some((user) => user.id === input.assignedUserId)) {
    fieldErrors.assignedUserId = "Select a valid staff member.";
  }
  if (input.requiredResponseAt && Number.isNaN(new Date(input.requiredResponseAt).getTime())) fieldErrors.requiredResponseAt = "Enter a valid response target.";
  if (input.requiredResponseAt && new Date(input.requiredResponseAt).getTime() < Date.now() - 60_000) fieldErrors.requiredResponseAt = "Response target cannot be in the past.";
  if (input.dueAt && Number.isNaN(new Date(input.dueAt).getTime())) fieldErrors.dueAt = "Enter a valid Due Date.";
  if (input.dueAt && new Date(input.dueAt).getTime() < Date.now() - 60_000) fieldErrors.dueAt = "Due Date cannot be in the past.";
  if (input.requiredResponseAt && input.dueAt && new Date(input.requiredResponseAt).getTime() > new Date(input.dueAt).getTime()) {
    fieldErrors.requiredResponseAt = "Response target must be before the Due Date.";
  }
  if (input.immediateRisk && !input.immediateControlSummary?.trim()) {
    fieldErrors.immediateControlSummary = "Describe the immediate safety control before creating this Work Order.";
  }
  if (input.riskAssessment) {
    const risk = calculateMaintenanceRisk(input.riskAssessment);
    if (!risk) fieldErrors.riskAssessment = "Complete the risk assessment.";
    if (risk?.areaRestricted && !risk.areaRestrictionDetails) fieldErrors.areaRestrictionDetails = "Describe the area restriction.";
    if (input.riskAssessment.manualOverrideLevel && !input.riskAssessment.manualOverrideReason?.trim()) {
      fieldErrors.manualOverrideReason = "Enter a reason for the manual risk override.";
    }
    const minimum = minimumPriorityForRisk(input.riskAssessment, input.immediateRisk);
    if (input.priority && !priorityMeetsMinimum(input.priority, minimum)) {
      fieldErrors.priority = `Priority must be at least ${workOrderPriorityLabel(minimum)} for this risk level.`;
    }
    if (risk?.requiresImmediateAction && !input.immediateControlSummary?.trim() && !risk.controlMeasures) {
      fieldErrors.immediateControlSummary = "Record immediate controls before creating this Work Order.";
    }
  }
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export function nextWorkOrderNumber(records: MaintenanceWorkOrder[], date = new Date()) {
  const year = date.getFullYear();
  const prefix = `WO-${year}-`;
  const max = records.reduce((highest, record) => {
    if (!record.workOrderNumber.startsWith(prefix)) return highest;
    const number = Number(record.workOrderNumber.slice(prefix.length));
    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 0);
  return `${prefix}${String(max + 1).padStart(6, "0")}`;
}

export function createWorkOrderRecord(params: {
  input: CreateWorkOrderInput;
  records: MaintenanceWorkOrder[];
  currentUser: UserProfile;
  now?: string;
}) {
  const now = params.now || new Date().toISOString();
  const id = `maintenance-work-order-${cryptoSafeId()}`;
  const riskAssessment = calculateMaintenanceRisk(params.input.riskAssessment);
  return {
    id,
    workOrderNumber: nextWorkOrderNumber(params.records, new Date(now)),
    title: params.input.title.trim(),
    description: params.input.description.trim(),
    type: params.input.type,
    source: params.input.source,
    category: params.input.category,
    subcategory: params.input.subcategory?.trim() || undefined,
    priority: params.input.priority,
    status: params.input.assignedUserId || params.input.assignedTeamId ? "ASSIGNED" : "OPEN",
    homeId: params.input.homeId,
    nursingHomeId: params.input.homeId,
    facilityId: params.input.homeId,
    wardId: params.input.wardId,
    roomId: params.input.roomId,
    exactLocation: params.input.exactLocation?.trim() || undefined,
    assetId: params.input.assetId?.trim() || undefined,
    affectedAssetDescription: params.input.affectedAssetDescription?.trim() || undefined,
    reportedByUserId: params.currentUser.id,
    reportedAt: now,
    reporterNameSnapshot: params.currentUser.name,
    reporterContactDetails: params.input.reporterContactDetails?.trim() || params.currentUser.phone || params.currentUser.email || undefined,
    assignedUserId: params.input.assignedUserId || undefined,
    assignedTeamId: params.input.assignedTeamId || undefined,
    supervisorUserId: params.input.supervisorUserId || undefined,
    assignedAt: params.input.assignedUserId || params.input.assignedTeamId ? now : undefined,
    assignedByUserId: params.input.assignedUserId || params.input.assignedTeamId ? params.currentUser.id : undefined,
    requiredResponseAt: params.input.requiredResponseAt || suggestedResponseAt(params.input.priority, new Date(now)),
    dueAt: params.input.dueAt || suggestedDueAt(params.input.priority, new Date(now)),
    residentSafetyImpact: Boolean(params.input.residentSafetyImpact),
    serviceDisruption: Boolean(params.input.serviceDisruption),
    complianceImpact: Boolean(params.input.complianceImpact),
    immediateRisk: Boolean(params.input.immediateRisk),
    immediateControlSummary: params.input.immediateControlSummary?.trim() || undefined,
    verificationRequired: Boolean(params.input.verificationRequired || params.input.immediateRisk || riskAssessment?.calculatedLevel === "CRITICAL" || riskAssessment?.calculatedLevel === "HIGH"),
    riskLevel: riskAssessment?.manualOverrideLevel || riskAssessment?.calculatedLevel,
    riskAssessment: riskAssessment ? { ...riskAssessment, assessedByUserId: params.currentUser.id, assessedAt: now } : undefined,
    createdAt: now,
    createdByUserId: params.currentUser.id,
    updatedAt: now,
    updatedByUserId: params.currentUser.id,
    version: 1,
  } satisfies MaintenanceWorkOrder;
}

export function updateWorkOrderRecord(
  record: MaintenanceWorkOrder,
  input: UpdateWorkOrderInput,
  currentUser: UserProfile,
  now = new Date().toISOString(),
) {
  if (record.archivedAt) throw new Error("Archived Work Orders cannot be updated through ordinary editing.");
  if (HISTORICAL_WORK_ORDER_STATUSES.includes(record.status)) {
    throw new Error("Completed, closed or cancelled Work Orders cannot be updated through ordinary editing.");
  }
  if (input.status && HISTORICAL_WORK_ORDER_STATUSES.includes(input.status)) {
    throw new Error("Use the correct workflow action to complete, close or cancel a Work Order.");
  }
  if (input.status && input.status !== record.status) {
    throw new Error("Use the Work Order workflow actions to change status.");
  }
  if ("assignedUserId" in input && input.assignedUserId !== record.assignedUserId) {
    throw new Error("Use the Work Order workflow actions to change assignment.");
  }
  if ("assignedTeamId" in input && input.assignedTeamId !== record.assignedTeamId) {
    throw new Error("Use the Work Order workflow actions to change assignment.");
  }
  if ("supervisorUserId" in input && input.supervisorUserId !== record.supervisorUserId) {
    throw new Error("Use the Work Order workflow actions to change assignment.");
  }
  if (input.expectedVersion !== undefined && input.expectedVersion !== record.version) {
    throw new Error("This Work Order has changed since you opened it. Refresh the record before saving.");
  }
  const riskAssessment = input.riskAssessment ? calculateMaintenanceRisk(input.riskAssessment) : record.riskAssessment;
  const next: MaintenanceWorkOrder = {
    ...record,
    ...input,
    workOrderNumber: record.workOrderNumber,
    id: record.id,
    homeId: record.homeId,
    nursingHomeId: record.nursingHomeId,
    facilityId: record.facilityId,
    createdAt: record.createdAt,
    createdByUserId: record.createdByUserId,
    reportedByUserId: record.reportedByUserId,
    reportedAt: record.reportedAt,
    requiredResponseAt: input.requiredResponseAt || (input.priority && input.priority !== record.priority ? suggestedResponseAt(input.priority, new Date(now)) : record.requiredResponseAt),
    dueAt: input.dueAt || (input.priority && input.priority !== record.priority ? suggestedDueAt(input.priority, new Date(now)) : record.dueAt),
    verificationRequired: Boolean(
      (input.verificationRequired ?? record.verificationRequired) ||
        input.immediateRisk ||
        riskAssessment?.calculatedLevel === "CRITICAL" ||
        riskAssessment?.calculatedLevel === "HIGH",
    ),
    riskLevel: riskAssessment?.manualOverrideLevel || riskAssessment?.calculatedLevel || record.riskLevel,
    riskAssessment: riskAssessment ? { ...riskAssessment, assessedByUserId: currentUser.id, assessedAt: now } : undefined,
    updatedAt: now,
    updatedByUserId: currentUser.id,
    assignedAt: input.assignedUserId && input.assignedUserId !== record.assignedUserId ? now : record.assignedAt,
    assignedByUserId: input.assignedUserId && input.assignedUserId !== record.assignedUserId ? currentUser.id : record.assignedByUserId,
    version: record.version + 1,
  };
  return next;
}

export function archiveWorkOrderRecord(record: MaintenanceWorkOrder, currentUser: UserProfile, reason: string, now = new Date().toISOString()) {
  if (!reason.trim()) throw new Error("Enter a reason before archiving this Work Order.");
  return {
    ...record,
    archivedAt: now,
    archivedByUserId: currentUser.id,
    archiveReason: reason.trim(),
    updatedAt: now,
    updatedByUserId: currentUser.id,
    version: record.version + 1,
  } satisfies MaintenanceWorkOrder;
}

export function queryWorkOrders(source: WorkOrderDataSource, queryInput: Partial<WorkOrderQuery>) {
  const query = defaultWorkOrderQuery(queryInput);
  let records = [...source.workOrders];
  const now = new Date();
  if (!query.archived) records = records.filter((record) => !record.archivedAt);
  if (query.active !== false && query.preset === "active") records = records.filter(isWorkOrderActive);
  if (query.homeId) records = records.filter((record) => record.homeId === query.homeId || record.facilityId === query.homeId);
  if (query.wardId) records = records.filter((record) => String(record.wardId) === query.wardId);
  if (query.roomId) records = records.filter((record) => String(record.roomId) === query.roomId);
  if (query.status?.length) records = records.filter((record) => query.status!.includes(record.status));
  if (query.priority?.length) records = records.filter((record) => query.priority!.includes(record.priority));
  if (query.type?.length) records = records.filter((record) => query.type!.includes(record.type));
  if (query.source?.length) records = records.filter((record) => query.source!.includes(record.source));
  if (query.category?.length) records = records.filter((record) => query.category!.includes(record.category));
  if (query.assignedUserId) records = records.filter((record) => record.assignedUserId === query.assignedUserId);
  if (query.reportedByUserId) records = records.filter((record) => record.reportedByUserId === query.reportedByUserId);
  if (query.unassignedOnly) records = records.filter((record) => !record.assignedUserId);
  if (query.overdueOnly) records = records.filter((record) => isWorkOrderOverdue(record, now));
  if (query.residentSafetyImpact) records = records.filter((record) => record.residentSafetyImpact);
  if (query.serviceDisruption) records = records.filter((record) => record.serviceDisruption);
  if (query.complianceImpact) records = records.filter((record) => record.complianceImpact);
  if (query.createdFrom) records = records.filter((record) => record.createdAt >= `${query.createdFrom}T00:00:00.000Z`);
  if (query.createdTo) records = records.filter((record) => record.createdAt <= `${query.createdTo}T23:59:59.999Z`);
  if (query.dueFrom) records = records.filter((record) => record.dueAt && record.dueAt >= `${query.dueFrom}T00:00:00.000Z`);
  if (query.dueTo) records = records.filter((record) => record.dueAt && record.dueAt <= `${query.dueTo}T23:59:59.999Z`);
  records = applyPreset(records, query.preset, now);
  if (query.search?.trim()) {
    const term = query.search.trim().toLowerCase();
    records = records.filter((record) => {
      const home = source.facilities.find((item) => item.id === record.homeId)?.name || "";
      const room = source.rooms.find((item) => String(item.id) === String(record.roomId));
      const assignee = workOrderAssigneeLabel(record, source.users);
      return [
        record.workOrderNumber,
        record.title,
        record.description,
        home,
        room?.number,
        room?.roomNumber,
        room?.name,
        assignee,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(term));
    });
  }
  const allFiltered = sortWorkOrders(records, query, source, now);
  const total = allFiltered.length;
  const pageSize = query.pageSize;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, query.page), pageCount);
  const offset = (page - 1) * pageSize;
  const counts = WORK_ORDER_STATUSES.reduce((acc, status) => {
    acc[status.value] = allFiltered.filter((record) => record.status === status.value).length;
    return acc;
  }, {} as Record<MaintenanceWorkOrderStatus, number>);
  return { records: allFiltered.slice(offset, offset + pageSize), allFiltered, total, page, pageSize, pageCount, counts } satisfies WorkOrderListResult;
}

function applyPreset(records: MaintenanceWorkOrder[], preset: WorkOrderPreset | undefined, now: Date) {
  switch (preset) {
    case "unassigned":
      return records.filter((record) => isWorkOrderActive(record) && !record.assignedUserId);
    case "critical":
      return records.filter((record) => isWorkOrderActive(record) && record.priority === "CRITICAL");
    case "high":
      return records.filter((record) => isWorkOrderActive(record) && record.priority === "HIGH");
    case "due_today":
      return records.filter((record) => record.dueAt?.slice(0, 10) === now.toISOString().slice(0, 10));
    case "overdue":
      return records.filter((record) => isWorkOrderOverdue(record, now));
    case "in_progress":
      return records.filter((record) => record.status === "IN_PROGRESS");
    case "waiting":
      return records.filter((record) => WAITING_WORK_ORDER_STATUSES.includes(record.status));
    case "verification":
      return records.filter((record) => record.status === "VERIFICATION_REQUIRED");
    case "completed":
      return records.filter((record) => record.status === "COMPLETED" || record.status === "VERIFIED" || record.status === "CLOSED");
    case "cancelled":
      return records.filter((record) => record.status === "CANCELLED" || record.status === "ENTERED_IN_ERROR");
    case "all":
      return records;
    case "active":
    default:
      return records;
  }
}

function sortWorkOrders(records: MaintenanceWorkOrder[], query: WorkOrderQuery, source: WorkOrderDataSource, now: Date) {
  const direction = query.sortDirection === "desc" ? -1 : 1;
  const valueFor = (record: MaintenanceWorkOrder) => {
    switch (query.sortBy) {
      case "priority":
        return PRIORITY_RANK[record.priority];
      case "status":
        return workOrderStatusLabel(record.status);
      case "createdAt":
        return record.createdAt;
      case "dueAt":
        return record.dueAt || "9999-12-31";
      case "home":
        return source.facilities.find((home) => home.id === record.homeId)?.name || "";
      case "assignee":
        return workOrderAssigneeLabel(record, source.users);
      case "updatedAt":
        return record.updatedAt;
      case "workOrderNumber":
      default:
        return record.workOrderNumber;
    }
  };
  return records.sort((a, b) => {
    if (query.preset === "active" && query.sortBy === "dueAt") {
      const defaultA = defaultActiveRank(a, now);
      const defaultB = defaultActiveRank(b, now);
      if (defaultA !== defaultB) return defaultA - defaultB;
    }
    const av = valueFor(a);
    const bv = valueFor(b);
    if (av === bv) return b.createdAt.localeCompare(a.createdAt);
    return av > bv ? direction : -direction;
  });
}

function defaultActiveRank(record: MaintenanceWorkOrder, now: Date) {
  const overdue = isWorkOrderOverdue(record, now);
  if (record.priority === "CRITICAL" && overdue) return 1;
  if (record.priority === "CRITICAL") return 2;
  if (record.priority === "HIGH" && overdue) return 3;
  if (overdue) return 4;
  if (record.dueAt) return 5;
  return 6;
}

export function workOrderDashboardMetrics(records: MaintenanceWorkOrder[], now = new Date()) {
  const active = records.filter(isWorkOrderActive);
  return {
    open: records.filter((record) => record.status === "OPEN" && !record.archivedAt).length,
    inProgress: records.filter((record) => record.status === "IN_PROGRESS" && !record.archivedAt).length,
    onHold: records.filter((record) => record.status === "ON_HOLD" && !record.archivedAt).length,
    completed: records.filter((record) => record.status === "COMPLETED" && !record.archivedAt).length,
    cancelled: records.filter((record) => record.status === "CANCELLED" && !record.archivedAt).length,
    critical: active.filter((record) => record.priority === "CRITICAL").length,
    high: active.filter((record) => record.priority === "HIGH").length,
    medium: active.filter((record) => record.priority === "MEDIUM").length,
    low: active.filter((record) => record.priority === "LOW").length,
    routine: active.filter((record) => record.priority === "ROUTINE").length,
    overdue: active.filter((record) => isWorkOrderOverdue(record, now)).length,
    total: records.filter((record) => !record.archivedAt).length,
  };
}

export function workOrderAuditLog(params: {
  action: string;
  record: MaintenanceWorkOrder;
  user: UserProfile;
  before?: unknown;
  after?: unknown;
  reason?: string;
  id: string;
  timestamp: string;
}) {
  return {
    id: params.id,
    facilityId: params.record.homeId,
    user: params.user.name,
    role: params.user.role,
    action: params.action,
    entity: params.record.id,
    entityType: "maintenance_work_order",
    timestamp: params.timestamp,
    before: params.before ? JSON.stringify(params.before) : undefined,
    after: params.after ? JSON.stringify(params.after) : undefined,
    reason: params.reason,
  } satisfies AuditLog;
}

function cryptoSafeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
