import { createFileRoute } from "@tanstack/react-router";
import { CertificateManagement } from "@/components/maintenance/CertificateManagement";

export const Route = createFileRoute("/maintenance/certificates/expired")({
  head: () => ({ meta: [{ title: "Expired Certificates - NuCare" }] }),
  component: () => <CertificateManagement initialTab="expired" />,
});
