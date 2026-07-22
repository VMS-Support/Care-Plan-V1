import { createFileRoute } from "@tanstack/react-router";
import { CertificateManagement } from "@/components/maintenance/CertificateManagement";

export const Route = createFileRoute("/maintenance/certificates/requirements")({
  head: () => ({ meta: [{ title: "Certificate Requirements - NuCare" }] }),
  component: () => <CertificateManagement initialTab="requirements" />,
});
