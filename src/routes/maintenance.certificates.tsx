import { createFileRoute } from "@tanstack/react-router";
import { CertificateManagement } from "@/components/maintenance/CertificateManagement";

export const Route = createFileRoute("/maintenance/certificates")({
  head: () => ({ meta: [{ title: "Certificates - NuCare" }] }),
  component: () => <CertificateManagement initialTab="overview" />,
});
