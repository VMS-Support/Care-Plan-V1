import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { CertificateManagement } from "@/components/maintenance/CertificateManagement";

export const Route = createFileRoute("/maintenance/certificates")({
  head: () => ({ meta: [{ title: "Certificates - NuCare" }] }),
  component: CertificatesRoute,
});

function CertificatesRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname === "/maintenance/certificates" ? <CertificateManagement initialTab="overview" /> : <Outlet />;
}
