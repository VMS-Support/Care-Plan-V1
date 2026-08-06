import assert from "node:assert/strict";
import { resolveMaintenanceSetting, resetMaintenanceHomeOverride, setMaintenanceHomeOverride, validateMaintenanceThreshold, type ScopedMaintenanceSetting } from "./maintenanceSettings.ts";

const base:ScopedMaintenanceSetting<number>={key:"certificate-due-soon-days",globalValue:30,homeOverrides:{},updatedAt:"2026-08-06",updatedBy:"admin"};
assert.deepEqual(resolveMaintenanceSetting(base,"home-1"),{value:30,scope:"GLOBAL"});
const overridden=setMaintenanceHomeOverride(base,"home-1",45,"don","2026-08-06T10:00:00Z");
assert.deepEqual(resolveMaintenanceSetting(overridden,"home-1"),{value:45,scope:"HOME_OVERRIDE"});
assert.deepEqual(resolveMaintenanceSetting(resetMaintenanceHomeOverride(overridden,"home-1","don"),"home-1"),{value:30,scope:"GLOBAL"});
assert.deepEqual(validateMaintenanceThreshold(0),[]);
assert.equal(validateMaintenanceThreshold(-1).length,1);

console.log("Maintenance settings tests passed");
