import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePlaceholderPage } from "@/components/maintenance/MaintenancePlaceholderPage";

export const Route = createFileRoute("/maintenance/reports")({
  head: () => ({ meta: [{ title: "Maintenance Reports - NuCare" }] }),
  component: () => (
    <MaintenancePlaceholderPage
      title="Reports"
      description="Maintenance reporting, audit extracts and operational summaries."
    />
  ),
});
