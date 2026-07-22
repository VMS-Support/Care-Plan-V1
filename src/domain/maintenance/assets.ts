import type {
  MaintenanceAsset,
  MaintenanceAssetCategory,
  MaintenanceAssetCondition,
  MaintenanceAssetDocument,
  MaintenanceAssetDocumentType,
  MaintenanceAssetLocationHistory,
  MaintenanceAssetOperationalStatus,
  MaintenanceAssetPhoto,
  MaintenanceAssetRelationship,
  MaintenanceAssetRelationshipType,
  MaintenanceAssetStatus,
  MaintenanceWorkOrder,
  PlannedMaintenanceOccurrence,
  PlannedMaintenanceSchedule,
  UserProfile,
} from "@/lib/care/types";
import { ACTIVE_WORK_ORDER_STATUSES, isWorkOrderOverdue } from "./workOrders.ts";

export const ASSET_CONDITIONS: MaintenanceAssetCondition[] = ["Excellent", "Good", "Fair", "Poor", "Critical", "Out of Service"];
export const ASSET_STATUSES: MaintenanceAssetStatus[] = ["Active", "Inactive", "Retired", "Disposed", "Lost", "Archived"];
export const ASSET_OPERATIONAL_STATUSES: MaintenanceAssetOperationalStatus[] = ["Operational", "Under Maintenance", "Awaiting Repair", "Awaiting Parts", "Faulty", "Out of Service", "Decommissioned"];
export const ASSET_DOCUMENT_TYPES: MaintenanceAssetDocumentType[] = ["Manual", "Warranty", "Certificate", "Installation", "Maintenance", "Inspection", "Photo", "Invoice", "Other"];
export const ASSET_RELATIONSHIP_TYPES: MaintenanceAssetRelationshipType[] = ["Contains", "Powered By", "Feeds", "Connected To", "Backup For", "Replacement For"];

export const DEFAULT_ASSET_CATEGORIES = [
  ["Fire Safety", "Fire panels, alarms, extinguishers and emergency systems.", "#ef4444", "shield"],
  ["Electrical", "Electrical appliances, panels and testable equipment.", "#f59e0b", "zap"],
  ["Heating", "Boilers, radiators and ventilation equipment.", "#ea580c", "flame"],
  ["Water", "Water outlets, tanks and legionella control assets.", "#0ea5e9", "droplet"],
  ["Kitchen Equipment", "Kitchen equipment and food preparation assets.", "#fb923c", "utensils"],
  ["Laundry Equipment", "Laundry washers, dryers and support assets.", "#06b6d4", "shirt"],
  ["Medical Equipment", "Clinical and resident-care equipment excluding hoists/slings.", "#8b5cf6", "heart-pulse"],
  ["Furniture", "Beds, chairs, tables and furnishings.", "#64748b", "sofa"],
  ["Building Services", "Fabric, doors, plumbing and building services.", "#475569", "building"],
  ["Emergency Equipment", "Emergency lighting, generators and emergency response assets.", "#dc2626", "siren"],
  ["Security", "CCTV, door access and security equipment.", "#1d4ed8", "lock"],
  ["IT Equipment", "Computers, network and digital equipment.", "#2563eb", "monitor"],
  ["Grounds Equipment", "Grounds and outdoor maintenance assets.", "#16a34a", "trees"],
  ["Cleaning Equipment", "Cleaning machines and housekeeping equipment.", "#14b8a6", "sparkles"],
  ["Vehicles", "Facility vehicles.", "#334155", "car"],
  ["Other", "Assets not covered by another category.", "#71717a", "package"],
] as const;

export interface AssetValidationSource {
  assets: MaintenanceAsset[];
  categories: MaintenanceAssetCategory[];
}

export function validateAssetInput(input: Partial<MaintenanceAsset>, source: AssetValidationSource) {
  const fieldErrors: Record<string, string> = {};
  if (!input.assetNumber?.trim()) fieldErrors.assetNumber = "Enter an asset number.";
  if (!input.assetName?.trim()) fieldErrors.assetName = "Enter an asset name.";
  if (!input.homeId) fieldErrors.homeId = "Select a Care Home.";
  if (!input.categoryId || !source.categories.some((category) => category.id === input.categoryId && category.active && !category.archivedAt)) fieldErrors.categoryId = "Select an active category.";
  if (input.assetNumber && input.homeId && source.assets.some((asset) => asset.id !== input.id && asset.homeId === input.homeId && asset.assetNumber.toLowerCase() === input.assetNumber!.trim().toLowerCase())) {
    fieldErrors.assetNumber = "Asset number must be unique within this Care Home.";
  }
  if (input.warrantyStartDate && input.purchaseDate && input.warrantyStartDate < input.purchaseDate) fieldErrors.warrantyStartDate = "Warranty start cannot be before purchase date.";
  if (input.warrantyEndDate && input.purchaseDate && input.warrantyEndDate < input.purchaseDate) fieldErrors.warrantyEndDate = "Warranty end cannot be before purchase date.";
  if (input.warrantyStartDate && input.warrantyEndDate && input.warrantyEndDate < input.warrantyStartDate) fieldErrors.warrantyEndDate = "Warranty end must be after warranty start.";
  if (input.replacementDate && input.installationDate && input.replacementDate < input.installationDate) fieldErrors.replacementDate = "Replacement date cannot be before installation date.";
  if (input.replacementCost !== undefined && Number(input.replacementCost) < 0) fieldErrors.replacementCost = "Replacement cost cannot be negative.";
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export function validateAssetCategoryInput(input: Partial<MaintenanceAssetCategory>, categories: MaintenanceAssetCategory[]) {
  const fieldErrors: Record<string, string> = {};
  if (!input.name?.trim()) fieldErrors.name = "Enter a category name.";
  if (input.name && categories.some((category) => category.id !== input.id && category.name.toLowerCase() === input.name!.trim().toLowerCase())) fieldErrors.name = "Category name already exists.";
  if (!input.colour?.trim()) fieldErrors.colour = "Select a colour.";
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export function warrantyStatus(asset: MaintenanceAsset, today = new Date()) {
  if (!asset.warrantyEndDate) return { label: "Not recorded", tone: "slate" as const, days: undefined };
  const days = daysBetween(dateOnly(today), asset.warrantyEndDate);
  if (days < 0) return { label: "Expired", tone: "red" as const, days };
  if (days <= 90) return { label: "Expires Soon", tone: "amber" as const, days };
  return { label: "Active", tone: "green" as const, days };
}

export function assetIsReadOnly(asset: MaintenanceAsset) {
  return asset.assetStatus === "Disposed";
}

export function canReceiveWorkOrder(asset?: MaintenanceAsset) {
  return Boolean(asset && asset.active && !asset.archivedAt && !["Retired", "Disposed", "Lost", "Archived"].includes(asset.assetStatus));
}

export function canReceivePlannedMaintenance(asset?: MaintenanceAsset) {
  return Boolean(asset && asset.active && !asset.archivedAt && !["Inactive", "Retired", "Disposed", "Lost", "Archived"].includes(asset.assetStatus));
}

export function assetDashboardMetrics(params: {
  assets: MaintenanceAsset[];
  workOrders: MaintenanceWorkOrder[];
  schedules: PlannedMaintenanceSchedule[];
  occurrences: PlannedMaintenanceOccurrence[];
  categories: MaintenanceAssetCategory[];
  today?: Date;
}) {
  const today = params.today || new Date();
  const activeAssets = params.assets.filter((asset) => asset.active && !asset.archivedAt);
  const activeWorkOrders = params.workOrders.filter((wo) => wo.assetId && ACTIVE_WORK_ORDER_STATUSES.includes(wo.status) && !wo.archivedAt);
  const upcomingMaintenance = params.occurrences.filter((occurrence) => {
    const schedule = params.schedules.find((item) => item.id === occurrence.scheduleId);
    if (!schedule || occurrence.status !== "Scheduled") return false;
    const days = daysBetween(dateOnly(today), occurrence.dueDate);
    return days >= 0 && days <= 30;
  });
  return {
    totalAssets: params.assets.filter((asset) => !asset.archivedAt).length,
    operationalAssets: activeAssets.filter((asset) => asset.operationalStatus === "Operational").length,
    underMaintenance: activeAssets.filter((asset) => asset.operationalStatus === "Under Maintenance").length,
    outOfService: activeAssets.filter((asset) => ["Out of Service", "Decommissioned", "Faulty"].includes(asset.operationalStatus)).length,
    warrantyExpiring: activeAssets.filter((asset) => warrantyStatus(asset, today).label === "Expires Soon").length,
    replacementDue: activeAssets.filter((asset) => asset.replacementDate && daysBetween(dateOnly(today), asset.replacementDate) <= 90).length,
    currentWorkOrders: activeWorkOrders.length,
    upcomingPlannedMaintenance: upcomingMaintenance.length,
    byCategory: params.categories.map((category) => ({ label: category.name, value: activeAssets.filter((asset) => asset.categoryId === category.id).length, colour: category.colour })).filter((item) => item.value > 0),
    byCondition: ASSET_CONDITIONS.map((condition) => ({ label: condition, value: activeAssets.filter((asset) => asset.condition === condition).length })),
    byOperationalStatus: ASSET_OPERATIONAL_STATUSES.map((status) => ({ label: status, value: activeAssets.filter((asset) => asset.operationalStatus === status).length })).filter((item) => item.value > 0),
  };
}

export function currentWorkOrdersForAsset(assetId: string, workOrders: MaintenanceWorkOrder[]) {
  return workOrders.filter((workOrder) => workOrder.assetId === assetId && ACTIVE_WORK_ORDER_STATUSES.includes(workOrder.status) && !workOrder.archivedAt);
}

export function maintenanceHistoryForAsset(assetId: string, workOrders: MaintenanceWorkOrder[]) {
  return workOrders
    .filter((workOrder) => workOrder.assetId === assetId && !workOrder.archivedAt)
    .sort((a, b) => (b.completedAt || b.updatedAt || b.createdAt).localeCompare(a.completedAt || a.updatedAt || a.createdAt));
}

export function serviceHistoryForAsset(assetId: string, workOrders: MaintenanceWorkOrder[]) {
  return maintenanceHistoryForAsset(assetId, workOrders).filter((workOrder) => workOrder.type === "PREVENTIVE" || workOrder.source === "PLANNED_MAINTENANCE");
}

export function inspectionHistoryForAsset(assetId: string, workOrders: MaintenanceWorkOrder[]) {
  return maintenanceHistoryForAsset(assetId, workOrders).filter((workOrder) => workOrder.type === "INSPECTION_FOLLOW_UP" || workOrder.source.includes("INSPECTION"));
}

export function timelineForAsset(params: {
  asset: MaintenanceAsset;
  documents: MaintenanceAssetDocument[];
  photos: MaintenanceAssetPhoto[];
  locations: MaintenanceAssetLocationHistory[];
  relationships: MaintenanceAssetRelationship[];
  workOrders: MaintenanceWorkOrder[];
  userName?: string;
}) {
  const events = [
    { at: params.asset.createdAt, user: params.asset.createdBy, summary: "Asset created", reference: params.asset.assetNumber },
    params.asset.installationDate ? { at: `${params.asset.installationDate}T09:00:00.000Z`, user: params.asset.createdBy, summary: "Asset installed", reference: params.asset.locationLabel } : undefined,
    ...params.documents.filter((item) => item.assetId === params.asset.id && !item.deletedAt).map((item) => ({ at: item.uploadedAt, user: item.uploadedBy, summary: `${item.documentType} uploaded`, reference: item.fileName })),
    ...params.photos.filter((item) => item.assetId === params.asset.id && !item.deletedAt).map((item) => ({ at: item.uploadedAt, user: item.uploadedBy, summary: "Photo added", reference: item.caption || item.fileReference })),
    ...params.locations.filter((item) => item.assetId === params.asset.id).map((item) => ({ at: item.movedDate, user: item.movedBy, summary: "Asset moved", reference: `${item.previousLocationLabel || "Previous"} to ${item.newLocationLabel || "New"}` })),
    ...params.relationships.filter((item) => item.parentAssetId === params.asset.id || item.childAssetId === params.asset.id).map((item) => ({ at: item.createdAt, user: item.createdBy, summary: `Relationship added: ${item.relationshipType}`, reference: item.parentAssetId === params.asset.id ? item.childAssetId : item.parentAssetId })),
    ...params.workOrders.filter((item) => item.assetId === params.asset.id).map((item) => ({ at: item.createdAt, user: item.reporterNameSnapshot || item.reportedByUserId, summary: `Work Order ${item.status.toLowerCase().replaceAll("_", " ")}`, reference: item.workOrderNumber })),
  ].filter(Boolean) as Array<{ at: string; user: string; summary: string; reference?: string }>;
  return events.sort((a, b) => b.at.localeCompare(a.at));
}

export function assetAuditLog(params: {
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

export function nextAssetNumber(assets: MaintenanceAsset[], homeId: string) {
  const prefix = "AST-";
  const highest = assets
    .filter((asset) => asset.homeId === homeId && asset.assetNumber.startsWith(prefix))
    .reduce((max, asset) => {
      const value = Number(asset.assetNumber.slice(prefix.length));
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
  return `${prefix}${String(highest + 1).padStart(5, "0")}`;
}

export function dateOnly(input: string | Date) {
  return new Date(input).toISOString().slice(0, 10);
}

export function daysBetween(a: string | Date, b: string | Date) {
  const start = new Date(dateOnly(a)).getTime();
  const end = new Date(dateOnly(b)).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function assetNeedsAttention(asset: MaintenanceAsset, workOrders: MaintenanceWorkOrder[], today = new Date()) {
  return (
    ["Poor", "Critical", "Out of Service"].includes(asset.condition) ||
    ["Awaiting Repair", "Awaiting Parts", "Faulty", "Out of Service"].includes(asset.operationalStatus) ||
    currentWorkOrdersForAsset(asset.id, workOrders).some((workOrder) => isWorkOrderOverdue(workOrder, today))
  );
}
