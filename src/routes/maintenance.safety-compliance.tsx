import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePlaceholderPage } from "@/components/maintenance/MaintenancePlaceholderPage";

export const Route = createFileRoute("/maintenance/safety-compliance")({
  head: () => ({ meta: [{ title: "Safety & Compliance - NuCare" }] }),
  component: () => (
    <MaintenancePlaceholderPage
      title="Safety & Compliance"
      description="Safety checks, compliance tracking and inspection readiness."
    />
  ),
});
