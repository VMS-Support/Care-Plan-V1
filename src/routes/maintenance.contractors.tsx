import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ContractorManagement } from "@/components/maintenance/ContractorManagement";

export const Route = createFileRoute("/maintenance/contractors")({
  head: () => ({ meta: [{ title: "Maintenance Contractors - NuCare" }] }),
  component: ContractorsRoute,
});

function ContractorsRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname === "/maintenance/contractors" ? <ContractorManagement /> : <Outlet />;
}
