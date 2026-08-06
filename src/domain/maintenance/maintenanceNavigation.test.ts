import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
const source = readFileSync(
  new URL("../../components/layout/AppShell.tsx", import.meta.url),
  "utf8",
);
test("final Maintenance navigation labels are ordered and temporary Work Orders item is removed", () => {
  const labels = [
    "Today",
    "Work",
    "Planned & Compliance",
    "Housekeeping",
    "Assets, Rooms & Beds",
    "Contractors & Certificates",
    "Corrective Actions",
    "Reports",
    "Settings",
  ];
  let last = -1;
  for (const label of labels) {
    const at = source.indexOf(`label: \"${label}\"`, last + 1);
    assert.ok(at > last, `${label} should appear in final order`);
    last = at;
  }
  const block = source.slice(
    source.indexOf("const maintenanceNav"),
    source.indexOf("function SidebarInner"),
  );
  assert.ok(!block.includes('label: "Work Orders"'));
  assert.ok(block.includes('activePrefixes: ["/maintenance/work", "/maintenance/work-orders"'));
});
