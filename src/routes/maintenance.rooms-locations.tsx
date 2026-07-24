import { createFileRoute } from "@tanstack/react-router";
import { RoomsLocationsManagement } from "@/components/maintenance/RoomsLocationsManagement";

export const Route = createFileRoute("/maintenance/rooms-locations")({
  head: () => ({ meta: [{ title: "Rooms & Locations - NuCare" }] }),
  component: RoomsLocationsManagement,
});
