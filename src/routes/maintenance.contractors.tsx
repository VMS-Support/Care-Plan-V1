import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePlaceholderPage } from "@/components/maintenance/MaintenancePlaceholderPage";

export const Route = createFileRoute("/maintenance/contractors")({
  head: () => ({ meta: [{ title: "Maintenance Contractors - NuCare" }] }),
  component: () => (
    <MaintenancePlaceholderPage
      title="Contractors"
      description="Approved contractors, contractor visits and external maintenance providers."
    />
  ),
});
