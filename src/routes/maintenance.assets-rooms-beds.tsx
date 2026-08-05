import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BedManagement } from "@/components/maintenance/BedManagement";
import { RoomsLocationsManagement } from "@/components/maintenance/RoomsLocationsManagement";
import { Button } from "@/components/ui/button";
import { AssetsRoute } from "@/routes/maintenance.assets";

export const Route = createFileRoute("/maintenance/assets-rooms-beds")({
  component: AssetsRoomsBeds,
});
function AssetsRoomsBeds() {
  const [tab, setTab] = useState<"assets" | "locations" | "beds">("beds");
  return (
    <main className="space-y-5 p-4 md:p-6">
      <header>
        <div className="text-base text-muted-foreground">Maintenance</div>
        <h1 className="text-3xl font-semibold">Assets, Rooms & Beds</h1>
        <p className="mt-1 text-base text-muted-foreground">
          One operational area for equipment, managed locations, bed capacity and occupancy.
        </p>
      </header>
      <nav className="flex flex-wrap gap-2" aria-label="Assets, rooms and beds">
        <Button
          size="lg"
          variant={tab === "assets" ? "default" : "outline"}
          onClick={() => setTab("assets")}
        >
          Assets
        </Button>
        <Button
          size="lg"
          variant={tab === "locations" ? "default" : "outline"}
          onClick={() => setTab("locations")}
        >
          Rooms & Locations
        </Button>
        <Button
          size="lg"
          variant={tab === "beds" ? "default" : "outline"}
          onClick={() => setTab("beds")}
        >
          Bed Management
        </Button>
      </nav>
      {tab === "assets" && (
        <AssetsRoute embedded />
      )}
      {tab === "locations" && <RoomsLocationsManagement />}
      {tab === "beds" && <BedManagement />}
    </main>
  );
}
