import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePlaceholderPage } from "@/components/maintenance/MaintenancePlaceholderPage";

export const Route = createFileRoute("/maintenance/corrective-actions")({
  head: () => ({ meta: [{ title: "Corrective Actions - NuCare" }] }),
  component: () => (
    <MaintenancePlaceholderPage
      title="Corrective Actions"
      description="Corrective action tracking for maintenance, safety and compliance findings."
    />
  ),
});
