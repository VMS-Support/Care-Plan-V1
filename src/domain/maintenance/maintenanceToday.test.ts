import assert from "node:assert/strict";
import test from "node:test";
import { maintenanceTodayProjection } from "./maintenanceToday.ts";

const empty = {
  facilities: [{ id: "home-1", name: "Ballymore", bedCapacity: 0 }],
  currentUser: { id: "u-1" },
  maintenanceWorkOrders: [],
  plannedMaintenanceOccurrences: [],
  safetyInspections: [],
  housekeepingTemplates: [],
  housekeepingSchedules: [],
  housekeepingTasks: [],
  housekeepingExceptions: [],
  housekeepingQualityInspections: [],
  housekeepingCleaningAudits: [],
  housekeepingRoomReadiness: [],
  rooms: [],
  beds: [],
  bedAssignments: [],
  residents: [],
  wings: [],
  maintenanceCertificates: [],
  maintenanceCertificateVersions: [],
  maintenanceCertificateTypes: [],
  maintenanceCertificateAttachments: [],
  maintenanceCertificateRequirements: [],
  maintenanceAssets: [],
  correctiveActions: [],
  maintenanceContractors: [],
};
test("Today uses Unified Work counts and Nursing Home scope", () => {
  const care: any = {
    ...empty,
    maintenanceWorkOrders: [
      {
        id: "wo-1",
        homeId: "home-1",
        workOrderNumber: "WO-1",
        title: "Urgent repair",
        status: "OPEN",
        priority: "CRITICAL",
        dueAt: "2026-08-05T09:00:00Z",
        createdAt: "2026-08-01T09:00:00Z",
      },
      {
        id: "wo-2",
        homeId: "home-2",
        workOrderNumber: "WO-2",
        title: "Hidden",
        status: "OPEN",
        priority: "CRITICAL",
        createdAt: "2026-08-01T09:00:00Z",
      },
    ],
  };
  const result = maintenanceTodayProjection(care, ["home-1"], new Date("2026-08-06T10:00:00Z"));
  assert.equal(result.workCounts.critical, 1);
  assert.equal(result.workCounts.overdue, 1);
  assert.equal(result.work.length, 1);
});
test("Today returns zero-capacity occupancy as zero percent", () => {
  const result = maintenanceTodayProjection(empty, ["home-1"], new Date("2026-08-06T10:00:00Z"));
  assert.equal(result.occupancy.registeredPercentage, 0);
  assert.equal(result.occupancy.operationalPercentage, 0);
});
