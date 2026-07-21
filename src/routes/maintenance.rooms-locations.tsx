import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePlaceholderPage } from "@/components/maintenance/MaintenancePlaceholderPage";

export const Route = createFileRoute("/maintenance/rooms-locations")({
  head: () => ({ meta: [{ title: "Rooms & Locations - NuCare" }] }),
  component: () => (
    <MaintenancePlaceholderPage
      title="Rooms & Locations"
      description="Rooms, shared spaces and location records used by Maintenance."
    />
  ),
});
