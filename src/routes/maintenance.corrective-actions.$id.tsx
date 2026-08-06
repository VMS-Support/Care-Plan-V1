import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { CorrectiveActionManagement } from "@/components/maintenance/CorrectiveActionManagement";
export const Route = createFileRoute("/maintenance/corrective-actions/$id")({ component: CorrectiveActionRoute });

function CorrectiveActionRoute() {
  const { id } = Route.useParams();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname.endsWith("/edit")
    ? <Outlet />
    : <CorrectiveActionManagement mode="detail" actionId={id} />;
}
