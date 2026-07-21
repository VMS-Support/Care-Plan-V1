import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePlaceholderPage } from "@/components/maintenance/MaintenancePlaceholderPage";

export const Route = createFileRoute("/maintenance/housekeeping")({
  head: () => ({ meta: [{ title: "Housekeeping - NuCare" }] }),
  component: () => (
    <MaintenancePlaceholderPage
      title="Housekeeping"
      description="Housekeeping quality, cleaning schedules and environmental standards."
    />
  ),
});
