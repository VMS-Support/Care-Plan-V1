import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePlaceholderPage } from "@/components/maintenance/MaintenancePlaceholderPage";

export const Route = createFileRoute("/maintenance/planned-maintenance")({
  head: () => ({ meta: [{ title: "Planned Maintenance - NuCare" }] }),
  component: () => (
    <MaintenancePlaceholderPage
      title="Planned Maintenance"
      description="Scheduled inspections, preventive maintenance and planned maintenance calendars."
    />
  ),
});
