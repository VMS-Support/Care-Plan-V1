import assert from "node:assert/strict";
import { MAINTENANCE_REPORTS, maintenanceDatePreset, searchMaintenanceReports, validateSavedReportAccess, validateSchedule, type SavedMaintenanceReport } from "./maintenanceReports.ts";

assert.ok(MAINTENANCE_REPORTS.length >= 30, "the grouped catalogue should expose the Phase 5C report set");
assert.ok(searchMaintenanceReports("occupancy").some((report) => report.key === "current-occupancy"));
assert.deepEqual(maintenanceDatePreset("LAST_30_DAYS", new Date("2026-08-06T12:00:00Z")), { from: "2026-07-08", to: "2026-08-06" });

const saved: SavedMaintenanceReport = { id:"saved-1", reportKey:"open-work-orders", name:"My report", filters:{homeId:"home-1"}, columns:[], outputFormat:"PDF", ownerUserId:"user-1", sharedUserIds:[], sharedRoleIds:[], sharedTeamIds:[], sharedHomeIds:[], createdAt:"2026-08-06", updatedAt:"2026-08-06" };
assert.equal(validateSavedReportAccess(saved,"user-1","don",["home-1"]),true);
assert.equal(validateSavedReportAccess(saved,"user-1","don",["home-2"]),false);
assert.ok(validateSchedule({}).length >= 4);
assert.deepEqual(validateSchedule({savedReportId:"saved-1",name:"Weekly",homeId:"home-1",time:"09:00",recipientRoleIds:["don"]}),[]);

console.log("Maintenance reports tests passed");
