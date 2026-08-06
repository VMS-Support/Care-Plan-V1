import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { CorrectiveActionManagement } from "@/components/maintenance/CorrectiveActionManagement";

export const Route = createFileRoute("/maintenance/corrective-actions")({
  head: () => ({ meta: [{ title: "Corrective Actions - ORITAS" }] }),
  component: CorrectiveActionsRoute,
});

function CorrectiveActionsRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname === "/maintenance/corrective-actions"
    ? <CorrectiveActionManagement mode="register" />
    : <Outlet />;
}
