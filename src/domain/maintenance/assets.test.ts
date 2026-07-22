import assert from "node:assert/strict";
import type { MaintenanceAsset, MaintenanceAssetCategory, MaintenanceWorkOrder } from "@/lib/care/types";
import {
  assetDashboardMetrics,
  assetIsReadOnly,
  canReceivePlannedMaintenance,
  canReceiveWorkOrder,
  currentWorkOrdersForAsset,
  nextAssetNumber,
  timelineForAsset,
  validateAssetInput,
  warrantyStatus,
} from "./assets.ts";

const category: MaintenanceAssetCategory = {
  id: "cat-fire",
  tenantId: "tenant-1",
  name: "Fire Safety",
  description: "Fire systems",
  colour: "#ef4444",
  icon: "shield",
  active: true,
  displayOrder: 1,
  createdBy: "Test",
  createdAt: "2026-07-01T08:00:00.000Z",
  updatedBy: "Test",
  updatedAt: "2026-07-01T08:00:00.000Z",
};

function asset(overrides: Partial<MaintenanceAsset> = {}): MaintenanceAsset {
  return {
    id: "asset-1",
    tenantId: "tenant-1",
    homeId: "home-1",
    facilityId: "home-1",
    assetNumber: "AST-00001",
    assetName: "Main Fire Panel",
    categoryId: category.id,
    locationId: "plant-room",
    locationLabel: "Plant Room",
    condition: "Good",
    operationalStatus: "Operational",
    assetStatus: "Active",
    criticality: "High",
    active: true,
    createdBy: "Test",
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedBy: "Test",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function workOrder(overrides: Partial<MaintenanceWorkOrder> = {}): MaintenanceWorkOrder {
  return {
    id: "wo-1",
    homeId: "home-1",
    facilityId: "home-1",
    workOrderNumber: "WO-2026-0001",
    title: "Test work order",
    description: "Test",
    type: "REACTIVE",
    source: "STAFF_REPORTED",
    category: "FIRE_SAFETY",
    priority: "HIGH",
    status: "OPEN",
    reporterUserId: "user-1",
    reporterNameSnapshot: "Test User",
    reportedAt: "2026-07-02T08:00:00.000Z",
    dueAt: "2026-07-03T08:00:00.000Z",
    verificationRequired: false,
    createdBy: "Test",
    createdAt: "2026-07-02T08:00:00.000Z",
    updatedBy: "Test",
    updatedAt: "2026-07-02T08:00:00.000Z",
    ...overrides,
  };
}

const activeAsset = asset();

assert.equal(nextAssetNumber([activeAsset, asset({ id: "asset-2", assetNumber: "AST-00009" })], "home-1"), "AST-00010");

assert.equal(validateAssetInput(activeAsset, { assets: [activeAsset], categories: [category] }).valid, true);
assert.equal(
  validateAssetInput(asset({ id: "asset-2", assetNumber: "AST-00001" }), { assets: [activeAsset], categories: [category] }).fieldErrors.assetNumber,
  "Asset number must be unique within this Care Home.",
);
assert.equal(
  validateAssetInput(asset({ purchaseDate: "2026-07-10", warrantyStartDate: "2026-07-09" }), { assets: [], categories: [category] }).fieldErrors.warrantyStartDate,
  "Warranty start cannot be before purchase date.",
);
assert.equal(
  validateAssetInput(asset({ installationDate: "2026-07-10", replacementDate: "2026-07-09" }), { assets: [], categories: [category] }).fieldErrors.replacementDate,
  "Replacement date cannot be before installation date.",
);

assert.deepEqual(warrantyStatus(asset({ warrantyEndDate: "2026-09-01" }), new Date("2026-07-22")).label, "Expires Soon");
assert.deepEqual(warrantyStatus(asset({ warrantyEndDate: "2026-07-01" }), new Date("2026-07-22")).label, "Expired");
assert.deepEqual(warrantyStatus(asset({ warrantyEndDate: "2027-07-01" }), new Date("2026-07-22")).label, "Active");

assert.equal(canReceiveWorkOrder(activeAsset), true);
assert.equal(canReceiveWorkOrder(asset({ assetStatus: "Retired" })), false);
assert.equal(canReceiveWorkOrder(asset({ assetStatus: "Disposed" })), false);
assert.equal(canReceivePlannedMaintenance(asset({ assetStatus: "Inactive", active: false })), false);
assert.equal(assetIsReadOnly(asset({ assetStatus: "Disposed" })), true);

const linkedOpenWorkOrder = workOrder({ assetId: activeAsset.id, status: "IN_PROGRESS" });
const linkedCompletedWorkOrder = workOrder({ id: "wo-2", assetId: activeAsset.id, status: "COMPLETED", completedAt: "2026-07-10T08:00:00.000Z" });
assert.equal(currentWorkOrdersForAsset(activeAsset.id, [linkedOpenWorkOrder, linkedCompletedWorkOrder]).length, 1);

const metrics = assetDashboardMetrics({
  assets: [activeAsset, asset({ id: "asset-2", assetStatus: "Archived", active: false, archivedAt: "2026-07-01T08:00:00.000Z" })],
  categories: [category],
  workOrders: [linkedOpenWorkOrder],
  schedules: [],
  occurrences: [],
  today: new Date("2026-07-22"),
});
assert.equal(metrics.totalAssets, 1);
assert.equal(metrics.operationalAssets, 1);
assert.equal(metrics.currentWorkOrders, 1);

const timeline = timelineForAsset({
  asset: activeAsset,
  documents: [],
  photos: [],
  locations: [{ id: "move-1", assetId: activeAsset.id, homeId: "home-1", previousLocationId: "old", newLocationId: "new", movedBy: "Test", movedDate: "2026-07-03T08:00:00.000Z", reason: "Moved", previousLocationLabel: "Old", newLocationLabel: "New" }],
  relationships: [],
  workOrders: [linkedOpenWorkOrder],
});
assert.equal(timeline.some((event) => event.summary === "Asset moved"), true);

console.log("Maintenance asset tests passed");
