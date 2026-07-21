import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePlaceholderPage } from "@/components/maintenance/MaintenancePlaceholderPage";

export const Route = createFileRoute("/maintenance/assets")({
  head: () => ({ meta: [{ title: "Maintenance Assets - NuCare" }] }),
  component: () => (
    <MaintenancePlaceholderPage
      title="Assets"
      description="Asset registers, equipment records and asset condition oversight."
    />
  ),
});
