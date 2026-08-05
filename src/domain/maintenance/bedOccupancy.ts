import type {
  Bed,
  BedAssignment,
  MaintenanceWorkOrder,
  Resident,
  Room,
  SafetyInspection,
  Wing,
} from "@/lib/care/types";

export type BedInventoryInput = {
  beds: Bed[];
  assignments: BedAssignment[];
  rooms: Room[];
  residents: Resident[];
  wings: Wing[];
  workOrders?: MaintenanceWorkOrder[];
  safetyInspections?: SafetyInspection[];
  registeredCapacity: number;
};
export const bedLabel = (value?: string) =>
  value ? value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Not recorded";
export const activeAssignments = (rows: BedAssignment[]) =>
  rows.filter((row) => row.status === "active" && !row.endDate && !row.endDateTime);
export function bedBlockers(
  bed: Bed,
  room: Room | undefined,
  workOrders: MaintenanceWorkOrder[] = [],
  safetyInspections: SafetyInspection[] = [],
) {
  const blockers: string[] = [];
  if (bed.condition === "unserviceable") blockers.push("Unserviceable condition");
  if (bed.operationalStatus !== "operational") blockers.push(bedLabel(bed.operationalStatus));
  if (bed.readinessStatus !== "ready") blockers.push(bedLabel(bed.readinessStatus));
  if (room?.operationalStatus && !["ready", "occupied"].includes(room.operationalStatus))
    blockers.push(`Room ${bedLabel(room?.operationalStatus)}`);
  if (
    workOrders.some(
      (order) =>
        String(order.assetId) === String(bed.assetId || bed.id) &&
        order.priority === "CRITICAL" &&
        !["COMPLETED", "CANCELLED", "CLOSED"].includes(order.status),
    )
  )
    blockers.push("Open Critical Work Order");
  if (
    safetyInspections.some(
      (inspection) =>
        (String(inspection.assetId) === String(bed.assetId || bed.id) ||
          String(inspection.locationId) === String(room?.id)) &&
        inspection.overallResult === "FAIL" &&
        inspection.correctiveActionRequired &&
        inspection.verificationStatus !== "VERIFIED",
    )
  )
    blockers.push("Failed Safety Inspection");
  return [...new Set(blockers)];
}
export function canAssignBed(
  bed: Bed,
  room: Room | undefined,
  assignments: BedAssignment[],
  workOrders: MaintenanceWorkOrder[] = [],
  safetyInspections: SafetyInspection[] = [],
) {
  return (
    bed.active &&
    (bed.occupancyStatus || bed.status) === "available" &&
    !activeAssignments(assignments).some((a) => String(a.bedId) === String(bed.id)) &&
    bedBlockers(bed, room, workOrders, safetyInspections).length === 0
  );
}
export function calculateBedOccupancy(input: BedInventoryInput) {
  const roomIds = new Set(input.rooms.map((r) => String(r.id)));
  const beds = input.beds.filter(
    (b) => b.active && roomIds.has(String(b.roomId)) && b.operationalStatus !== "disposed",
  );
  const assignments = activeAssignments(input.assignments).filter((a) =>
    beds.some((b) => String(b.id) === String(a.bedId)),
  );
  const uniqueResidents = new Set<string>();
  const occupiedBedIds = new Set<string>();
  for (const a of assignments)
    if (!uniqueResidents.has(a.residentId) && !occupiedBedIds.has(String(a.bedId))) {
      uniqueResidents.add(a.residentId);
      occupiedBedIds.add(String(a.bedId));
    }
  const operationalBeds = beds.filter((b) => b.operationalStatus === "operational");
  const count = (predicate: (b: Bed) => boolean) => beds.filter(predicate).length;
  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);
  const occupied = occupiedBedIds.size;
  const breakdown = (key: "wing" | "bedType" | "mattressType" | "roomType") => {
    const groups = new Map<string, Bed[]>();
    beds.forEach((bed) => {
      const room = input.rooms.find((r) => String(r.id) === String(bed.roomId));
      const value =
        key === "wing"
          ? input.wings.find((w) => w.id === room?.wingId)?.name
          : key === "roomType"
            ? room?.roomType
            : bed[key];
      const label = bedLabel(String(value || "Not recorded"));
      groups.set(label, [...(groups.get(label) || []), bed]);
    });
    return [...groups]
      .map(([label, rows]) => ({
        label,
        total: rows.length,
        occupied: rows.filter((b) => occupiedBedIds.has(String(b.id))).length,
      }))
      .map((r) => ({ ...r, percentage: pct(r.occupied, r.total) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };
  return {
    registeredCapacity: input.registeredCapacity,
    operationalCapacity: operationalBeds.length,
    occupied,
    available: operationalBeds.filter((b) =>
      canAssignBed(
        b,
        input.rooms.find((r) => String(r.id) === String(b.roomId)),
        input.assignments,
        input.workOrders,
        input.safetyInspections,
      ),
    ).length,
    reserved: count((b) => (b.occupancyStatus || b.status) === "reserved"),
    temporarilyUnavailable: count(
      (b) => (b.occupancyStatus || b.status) === "temporarily_unavailable",
    ),
    underMaintenance: count((b) => b.operationalStatus === "under_maintenance"),
    blocked: count((b) => b.operationalStatus === "blocked"),
    outOfService: count((b) => b.operationalStatus === "out_of_service"),
    registeredPercentage: pct(occupied, input.registeredCapacity),
    operationalPercentage: pct(occupied, operationalBeds.length),
    byWing: breakdown("wing"),
    byBedType: breakdown("bedType"),
    byMattressType: breakdown("mattressType"),
    byRoomType: breakdown("roomType"),
  };
}
