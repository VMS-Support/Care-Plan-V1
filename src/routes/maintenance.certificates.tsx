import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePlaceholderPage } from "@/components/maintenance/MaintenancePlaceholderPage";

export const Route = createFileRoute("/maintenance/certificates")({
  head: () => ({ meta: [{ title: "Maintenance Certificates - NuCare" }] }),
  component: () => (
    <MaintenancePlaceholderPage
      title="Certificates"
      description="Maintenance certificates, statutory records and renewal tracking."
    />
  ),
});
