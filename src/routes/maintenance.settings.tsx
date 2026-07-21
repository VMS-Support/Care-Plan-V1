import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePlaceholderPage } from "@/components/maintenance/MaintenancePlaceholderPage";

export const Route = createFileRoute("/maintenance/settings")({
  head: () => ({ meta: [{ title: "Maintenance Settings - NuCare" }] }),
  component: () => (
    <MaintenancePlaceholderPage
      title="Settings"
      description="Maintenance configuration, defaults and module administration."
    />
  ),
});
