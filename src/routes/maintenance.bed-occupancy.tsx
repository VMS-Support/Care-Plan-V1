import { createFileRoute, Link } from "@tanstack/react-router";
import { useCare } from "@/lib/care/store";
import { calculateBedOccupancy } from "@/domain/maintenance/bedOccupancy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/maintenance/bed-occupancy")({
  component: BedOccupancyDetails,
});
const q = (key: string, value: string) =>
  `/maintenance/assets-rooms-beds?tab=beds&${key}=${encodeURIComponent(value)}`;
function BedOccupancyDetails() {
  const care = useCare();
  const rooms = care.rooms.filter(
    (r) =>
      String(r.facilityId || r.nursingHomeId || care.activeFacilityId) === care.activeFacilityId,
  );
  const facility = care.facilities.find((f) => f.id === care.activeFacilityId);
  const m = calculateBedOccupancy({
    beds: care.beds,
    assignments: care.bedAssignments,
    rooms,
    residents: care.residents,
    wings: care.wings,
    workOrders: care.maintenanceWorkOrders,
    safetyInspections: care.safetyInspections,
    registeredCapacity: facility?.bedCapacity || 0,
  });
  const cards: [[string, number, string?]] | any = [
    ["Registered Capacity", m.registeredCapacity],
    ["Operational Capacity", m.operationalCapacity],
    ["Occupied", m.occupied, "occupancy=occupied"],
    ["Available", m.available, "occupancy=available"],
    ["Reserved", m.reserved, "occupancy=reserved"],
    ["Temporarily Unavailable", m.temporarilyUnavailable, "occupancy=temporarily_unavailable"],
    ["Under Maintenance", m.underMaintenance, "operational=under_maintenance"],
    ["Blocked", m.blocked, "operational=blocked"],
    ["Out of Service", m.outOfService, "operational=out_of_service"],
  ];
  return (
    <main className="space-y-6 p-4 md:p-8">
      <div>
        <p className="text-base text-muted-foreground">{facility?.name}</p>
        <h1 className="text-3xl font-semibold">Bed Occupancy</h1>
        <p className="text-base text-muted-foreground">
          {m.occupied} of {m.registeredCapacity} registered beds occupied ({m.registeredPercentage}
          %). {m.occupied} of {m.operationalCapacity} operational beds occupied (
          {m.operationalPercentage}%).
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value, filter]: any) => (
          <Link
            key={label}
            to={
              (filter
                ? q(filter.split("=")[0], filter.split("=")[1])
                : "/maintenance/assets-rooms-beds") as any
            }
            className="rounded-xl border bg-white p-5 text-left text-base shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="text-muted-foreground">{label}</div>
            <div className="mt-2 text-3xl font-semibold">{value}</div>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          ["By Wing", m.byWing, "wing"],
          ["By Bed Type", m.byBedType, "bedType"],
          ["By Mattress Type", m.byMattressType, "mattressType"],
          ["By Room Type", m.byRoomType, "roomType"],
        ].map(([title, rows, key]: any) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {rows.map((row: any) => (
                <Link
                  key={row.label}
                  to={q(key, row.label) as any}
                  className="flex min-h-16 items-center justify-between py-3 focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div>
                    <div className="font-medium">{row.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {row.occupied} occupied out of {row.total}
                    </div>
                  </div>
                  <div className="text-xl font-semibold">{row.percentage}%</div>
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <Button asChild variant="outline">
        <Link to="/maintenance/assets-rooms-beds">Open Bed Management</Link>
      </Button>
    </main>
  );
}
