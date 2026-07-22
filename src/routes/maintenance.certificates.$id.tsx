import { createFileRoute } from "@tanstack/react-router";
import { CertificateManagement } from "@/components/maintenance/CertificateManagement";

export const Route = createFileRoute("/maintenance/certificates/$id")({
  head: () => ({ meta: [{ title: "Certificate Details - NuCare" }] }),
  component: CertificateDetailRoute,
});

function CertificateDetailRoute() {
  const { id } = Route.useParams();
  return <CertificateManagement mode="detail" certificateId={id} />;
}
