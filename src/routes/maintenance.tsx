import { createFileRoute } from "@tanstack/react-router";
import { MaintenanceHousekeepingDashboard } from "@/components/maintenance/MaintenanceHousekeepingDashboard";

export const Route = createFileRoute("/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance Overview - NuCare" }] }),
  component: MaintenanceHousekeepingDashboard,
});
