import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { MaintenanceHousekeepingDashboard } from "@/components/maintenance/MaintenanceHousekeepingDashboard";

export const Route = createFileRoute("/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance Overview - NuCare" }] }),
  component: MaintenanceRoute,
});

function MaintenanceRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname.replace(/\/+$/, "") });
  if (pathname === "/maintenance") return <MaintenanceHousekeepingDashboard />;
  return <Outlet />;
}
