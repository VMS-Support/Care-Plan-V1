import type {
  MaintenanceAsset,
  MaintenanceTemplate,
  MaintenanceTemplateChecklist,
  MaintenanceTemplateEvidence,
  MaintenanceTemplateEvidenceType,
  MaintenanceWorkOrderCategory,
  MaintenanceWorkOrderPriority,
  PlannedMaintenanceFrequencyType,
  PlannedMaintenanceOccurrence,
  PlannedMaintenanceOccurrenceStatus,
  PlannedMaintenanceSchedule,
  Room,
  UserProfile,
} from "@/lib/care/types";
import { canReceivePlannedMaintenance } from "./assets.ts";
import { WORK_ORDER_CATEGORIES, type CreateWorkOrderInput } from "./workOrders.ts";

export const PLANNED_MAINTENANCE_FREQUENCIES: Array<{ value: PlannedMaintenanceFrequencyType; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "six_monthly", label: "Six Monthly" },
  { value: "annual", label: "Annual" },
  { value: "custom_days", label: "Custom Days" },
  { value: "custom_weeks", label: "Custom Weeks" },
  { value: "custom_months", label: "Custom Months" },
  { value: "custom_years", label: "Custom Years" },
];

export const PLANNED_MAINTENANCE_EVIDENCE_TYPES: MaintenanceTemplateEvidenceType[] = [
  "Photo",
  "Document",
  "Reading",
  "Certificate",
  "Signature",
  "Video",
];

export const PLANNED_MAINTENANCE_TEAMS = [
  { id: "maintenance-team", name: "Maintenance Team" },
  { id: "engineer", name: "Engineer" },
  { id: "electrician", name: "Electrician" },
  { id: "contractor", name: "Contractor" },
  { id: "supervisor", name: "Supervisor" },
];

export const STARTER_MAINTENANCE_TEMPLATES: Array<
  Omit<MaintenanceTemplate, "id" | "tenantId" | "createdBy" | "createdAt"> & {
    checklist: Array<Omit<MaintenanceTemplateChecklist, "id" | "templateId">>;
    evidence: MaintenanceTemplateEvidenceType[];
  }
> = [
  starter("Weekly Fire Alarm Test", "Weekly fire alarm call point and panel test.", "FIRE_SAFETY", "weekly", 1, 30, true, "#ef4444", ["Test designated call point", "Check alarm panel", "Record zone and result"], ["Reading", "Signature"]),
  starter("Monthly Water Temperature", "Monthly hot and cold outlet temperature checks.", "WATER_SAFETY", "monthly", 1, 45, true, "#0ea5e9", ["Flush outlet", "Record hot temperature", "Record cold temperature"], ["Reading"]),
  starter("Quarterly PAT Testing", "Portable appliance electrical testing schedule.", "ELECTRICAL", "quarterly", 1, 90, true, "#f59e0b", ["Inspect appliance", "Complete electrical test", "Apply test label"], ["Certificate"]),
  starter("Boiler Service", "Planned boiler service and safety checks.", "HEATING_VENTILATION", "annual", 1, 180, true, "#7c3aed", ["Inspect boiler", "Check pressure", "Confirm safe operation"], ["Certificate", "Document"]),
  starter("Generator Test", "Standby generator test run.", "GENERAL_EQUIPMENT", "monthly", 1, 60, true, "#2563eb", ["Check fuel", "Run generator", "Record test result"], ["Reading", "Signature"]),
  starter("Kitchen Equipment Service", "Routine kitchen equipment service.", "KITCHEN_EQUIPMENT", "quarterly", 1, 120, false, "#ea580c", ["Inspect equipment", "Clean serviceable parts", "Record faults"], ["Photo"]),
  starter("Emergency Lighting Test", "Emergency lighting function test.", "FIRE_SAFETY", "monthly", 1, 60, true, "#eab308", ["Activate test", "Inspect escape routes", "Record failures"], ["Document"]),
  starter("Legionella Flush", "Legionella outlet flushing for low-use outlets.", "WATER_SAFETY", "weekly", 1, 30, true, "#14b8a6", ["Flush outlet", "Record duration", "Report concerns"], ["Reading"]),
  starter("Fire Extinguisher Inspection", "Fire extinguisher visual inspection.", "FIRE_SAFETY", "monthly", 1, 45, true, "#dc2626", ["Check location", "Check pin and gauge", "Record defects"], ["Photo"]),
  starter("Nurse Call Test", "Nurse call point functionality test.", "NURSE_CALL", "monthly", 1, 60, true, "#4f46e5", ["Activate call point", "Confirm display", "Confirm response tone"], ["Signature"]),
];

function starter(
  name: string,
  description: string,
  category: MaintenanceWorkOrderCategory,
  frequencyType: PlannedMaintenanceFrequencyType,
  frequencyValue: number,
  estimatedDurationMinutes: number,
  verificationRequired: boolean,
  colour: string,
  checklistItems: string[],
  evidence: MaintenanceTemplateEvidenceType[],
) {
  return {
    name,
    description,
    category,
    active: true,
    estimatedDurationMinutes,
    verificationRequired,
    safetyPrecautions: "Follow local safety procedures and isolate equipment where required.",
    skillsRequired: "Competent maintenance staff or approved contractor.",
    frequencyType,
    frequencyValue,
    colour,
    checklist: checklistItems.map((item, index) => ({ displayOrder: index + 1, item, mandatory: true })),
    evidence,
  };
}

export interface PlannedMaintenanceAssetOption {
  id: string;
  name: string;
  homeId: string;
  locationLabel: string;
  wardId?: string;
  roomId?: string;
  category: "Room" | "Facility";
  active: boolean;
}

export function buildPlannedMaintenanceAssets(source: { activeFacilityId?: string; facilities: Array<{ id: string; name: string }>; rooms: Room[]; wards?: Array<{ id: string; name: string }>; maintenanceAssets?: MaintenanceAsset[] }) {
  const registered = (source.maintenanceAssets || [])
    .filter((asset) => (!source.activeFacilityId || asset.homeId === source.activeFacilityId) && canReceivePlannedMaintenance(asset))
    .map((asset) => ({
      id: asset.id,
      name: asset.assetName,
      homeId: asset.homeId,
      locationLabel: asset.locationLabel || "Location not recorded",
      category: "Facility" as const,
      active: true,
    }));
  if (registered.length > 0) return registered;
  const homes = source.facilities
    .filter((home) => !source.activeFacilityId || home.id === source.activeFacilityId)
    .map((home) => ({
      id: `facility:${home.id}`,
      name: `${home.name} common areas`,
      homeId: home.id,
      locationLabel: home.name,
      category: "Facility" as const,
      active: true,
    }));
  const rooms = source.rooms.map((room) => {
    const homeId = String(room.facilityId || room.nursingHomeId || source.activeFacilityId || "");
    const ward = source.wards?.find((item) => String(item.id) === String(room.wardId));
    const number = room.roomNumber || room.number || room.name || room.id;
    return {
      id: `room:${room.id}`,
      name: `Room ${number}`,
      homeId,
      wardId: room.wardId ? String(room.wardId) : undefined,
      roomId: String(room.id),
      locationLabel: [ward?.name, `Room ${number}`].filter(Boolean).join(" - "),
      category: "Room" as const,
      active: true,
    };
  });
  return [...homes, ...rooms].filter((asset) => asset.homeId);
}

export function frequencyLabel(type?: PlannedMaintenanceFrequencyType, value = 1) {
  const base = PLANNED_MAINTENANCE_FREQUENCIES.find((item) => item.value === type)?.label || "Custom";
  if (!type?.startsWith("custom")) return value > 1 ? `Every ${value} ${base.toLowerCase()}s` : base;
  const unit = type.replace("custom_", "");
  return `Every ${Math.max(1, value)} ${unit.replace(/s$/, "")}${value === 1 ? "" : "s"}`;
}

export function addFrequency(dateInput: string | Date, type: PlannedMaintenanceFrequencyType, value = 1) {
  const date = new Date(dateInput);
  const amount = Math.max(1, value || 1);
  const next = new Date(date);
  switch (type) {
    case "daily":
    case "custom_days":
      next.setDate(next.getDate() + amount);
      break;
    case "weekly":
    case "custom_weeks":
      next.setDate(next.getDate() + amount * 7);
      break;
    case "monthly":
    case "custom_months":
      next.setMonth(next.getMonth() + amount);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + amount * 3);
      break;
    case "six_monthly":
      next.setMonth(next.getMonth() + amount * 6);
      break;
    case "annual":
    case "custom_years":
      next.setFullYear(next.getFullYear() + amount);
      break;
  }
  return dateOnly(next);
}

export function dateOnly(input: string | Date) {
  return new Date(input).toISOString().slice(0, 10);
}

export function daysBetween(a: string | Date, b: string | Date) {
  const start = new Date(dateOnly(a)).getTime();
  const end = new Date(dateOnly(b)).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function occurrenceStatus(occurrence: PlannedMaintenanceOccurrence, today = new Date()) {
  if (occurrence.status !== "Scheduled") return occurrence.status;
  const diff = daysBetween(today, occurrence.dueDate);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Due Today";
  if (diff <= 7) return "Due Soon";
  return "Scheduled";
}

export function plannedPriorityForOccurrence(occurrence: PlannedMaintenanceOccurrence, template?: MaintenanceTemplate, today = new Date()): MaintenanceWorkOrderPriority {
  const status = occurrenceStatus(occurrence, today);
  if (status === "Overdue") return "HIGH";
  if (status === "Due Today") return "MEDIUM";
  if (template?.verificationRequired) return "MEDIUM";
  return "ROUTINE";
}

export function generateOccurrencesForSchedule(params: {
  schedule: PlannedMaintenanceSchedule;
  existing: PlannedMaintenanceOccurrence[];
  until: string;
}) {
  if (!params.schedule.active || params.schedule.pausedAt) return [];
  const existingDueDates = new Set(params.existing.filter((item) => item.scheduleId === params.schedule.id).map((item) => item.dueDate));
  const end = params.schedule.endDate && params.schedule.endDate < params.until ? params.schedule.endDate : params.until;
  const result: Array<Omit<PlannedMaintenanceOccurrence, "id">> = [];
  let due = params.schedule.nextDueDate || params.schedule.startDate;
  while (due <= end) {
    if (!existingDueDates.has(due)) {
      result.push({ scheduleId: params.schedule.id, homeId: params.schedule.homeId, facilityId: params.schedule.homeId, nursingHomeId: params.schedule.homeId, dueDate: due, status: "Scheduled" });
    }
    due = addFrequency(due, params.schedule.frequencyType, params.schedule.frequencyValue);
  }
  return result;
}

export function calculateNextDueDate(schedule: PlannedMaintenanceSchedule, occurrences: PlannedMaintenanceOccurrence[], from = new Date()) {
  const active = occurrences
    .filter((item) => item.scheduleId === schedule.id && !["Completed", "Skipped", "Cancelled"].includes(item.status) && item.dueDate >= dateOnly(from))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  return active?.dueDate || schedule.nextDueDate || schedule.startDate;
}

export function validateTemplateInput(input: Partial<MaintenanceTemplate> & { checklist?: Partial<MaintenanceTemplateChecklist>[]; evidence?: MaintenanceTemplateEvidenceType[] }) {
  const fieldErrors: Record<string, string> = {};
  if (!input.name?.trim()) fieldErrors.name = "Enter a template name.";
  if (!input.description?.trim()) fieldErrors.description = "Enter a template description.";
  if (!WORK_ORDER_CATEGORIES.some((item) => item.value === input.category)) fieldErrors.category = "Select a category.";
  if (!input.estimatedDurationMinutes || input.estimatedDurationMinutes < 1) fieldErrors.estimatedDurationMinutes = "Enter an estimated duration.";
  if (!input.frequencyType) fieldErrors.frequencyType = "Select a frequency.";
  if (!input.frequencyValue || input.frequencyValue < 1) fieldErrors.frequencyValue = "Enter a frequency value.";
  if (!input.colour?.trim()) fieldErrors.colour = "Select a calendar colour.";
  if ((input.checklist || []).some((item) => !item.item?.trim())) fieldErrors.checklist = "Checklist items cannot be blank.";
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export function validateScheduleInput(input: Partial<PlannedMaintenanceSchedule>, assets: PlannedMaintenanceAssetOption[], templates: MaintenanceTemplate[]) {
  const fieldErrors: Record<string, string> = {};
  const asset = input.assetId ? assets.find((item) => item.id === input.assetId) : undefined;
  const template = input.templateId ? templates.find((item) => item.id === input.templateId) : undefined;
  if (!asset) fieldErrors.assetId = "Select an active asset or location.";
  if (asset && !asset.active) fieldErrors.assetId = "Inactive assets cannot receive schedules.";
  if (!template) fieldErrors.templateId = "Select a maintenance template.";
  if (template && (!template.active || template.archivedAt)) fieldErrors.templateId = "Inactive templates cannot be selected.";
  if (!input.responsibleTeamId) fieldErrors.responsibleTeamId = "Select a responsible team.";
  if (!input.frequencyType) fieldErrors.frequencyType = "Select a frequency.";
  if (!input.frequencyValue || input.frequencyValue < 1) fieldErrors.frequencyValue = "Enter a frequency value.";
  if (!input.startDate) fieldErrors.startDate = "Select a start date.";
  if (input.startDate && input.endDate && input.endDate < input.startDate) fieldErrors.endDate = "End date must be after the start date.";
  if (input.generateDaysBeforeDue === undefined || input.generateDaysBeforeDue < 0) fieldErrors.generateDaysBeforeDue = "Enter a valid generation window.";
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export function buildGeneratedWorkOrderInput(params: {
  schedule: PlannedMaintenanceSchedule;
  template: MaintenanceTemplate;
  occurrence: PlannedMaintenanceOccurrence;
  asset?: PlannedMaintenanceAssetOption;
  checklist: MaintenanceTemplateChecklist[];
  evidence: MaintenanceTemplateEvidence[];
}): CreateWorkOrderInput & {
  plannedMaintenanceScheduleId: string;
  plannedMaintenanceTemplateId: string;
  plannedMaintenanceOccurrenceId: string;
} {
  const checklistText = params.checklist
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((item) => `- ${item.item}${item.mandatory ? " (mandatory)" : ""}`)
    .join("\n");
  const evidenceText = params.evidence.map((item) => item.evidenceType).join(", ") || "None";
  const description = [
    params.template.description,
    params.template.safetyPrecautions ? `Safety precautions: ${params.template.safetyPrecautions}` : "",
    params.template.skillsRequired ? `Skills required: ${params.template.skillsRequired}` : "",
    checklistText ? `Checklist:\n${checklistText}` : "",
    `Evidence required: ${evidenceText}`,
  ].filter(Boolean).join("\n\n");
  return {
    title: `${params.template.name} - ${params.asset?.name || params.schedule.assetName || "Planned maintenance"}`,
    description,
    type: "PREVENTIVE",
    source: "PLANNED_MAINTENANCE",
    category: params.template.category,
    priority: plannedPriorityForOccurrence(params.occurrence, params.template),
    homeId: params.schedule.homeId,
    wardId: params.asset?.wardId,
    roomId: params.asset?.roomId,
    exactLocation: params.asset?.locationLabel || params.schedule.locationLabel,
    assetId: params.schedule.assetId,
    affectedAssetDescription: params.asset?.name || params.schedule.assetName,
    assignedTeamId: params.schedule.responsibleTeamId,
    dueAt: `${params.occurrence.dueDate}T17:00:00.000Z`,
    complianceImpact: params.template.verificationRequired,
    verificationRequired: params.template.verificationRequired,
    immediateRisk: false,
    residentSafetyImpact: false,
    serviceDisruption: false,
    plannedMaintenanceScheduleId: params.schedule.id,
    plannedMaintenanceTemplateId: params.template.id,
    plannedMaintenanceOccurrenceId: params.occurrence.id,
  };
}

export function plannedMaintenanceAuditLog(params: {
  id: string;
  user: UserProfile;
  action: string;
  entity: string;
  entityType: string;
  facilityId?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  timestamp: string;
}) {
  return {
    id: params.id,
    facilityId: params.facilityId,
    user: params.user.name,
    role: params.user.role,
    action: params.action,
    entity: params.entity,
    entityType: params.entityType,
    timestamp: params.timestamp,
    before: params.before ? JSON.stringify(params.before) : undefined,
    after: params.after ? JSON.stringify(params.after) : undefined,
    reason: params.reason,
  };
}

export function teamLabel(teamId?: string) {
  return PLANNED_MAINTENANCE_TEAMS.find((team) => team.id === teamId)?.name || teamId || "Unassigned";
}
