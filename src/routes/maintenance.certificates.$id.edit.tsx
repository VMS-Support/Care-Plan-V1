import { createFileRoute } from "@tanstack/react-router";
import { CertificateManagement } from "@/components/maintenance/CertificateManagement";

export const Route = createFileRoute("/maintenance/certificates/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Certificate - NuCare" }] }),
  component: CertificateEditRoute,
});

function CertificateEditRoute() {
  const { id } = Route.useParams();
  return <CertificateManagement mode="edit" certificateId={id} />;
}
