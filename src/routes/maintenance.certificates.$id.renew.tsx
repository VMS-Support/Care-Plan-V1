import { createFileRoute } from "@tanstack/react-router";
import { CertificateManagement } from "@/components/maintenance/CertificateManagement";

export const Route = createFileRoute("/maintenance/certificates/$id/renew")({
  head: () => ({ meta: [{ title: "Renew Certificate - NuCare" }] }),
  component: CertificateRenewRoute,
});

function CertificateRenewRoute() {
  const { id } = Route.useParams();
  return <CertificateManagement mode="renew" certificateId={id} />;
}
