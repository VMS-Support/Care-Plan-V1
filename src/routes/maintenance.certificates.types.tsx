import { createFileRoute } from "@tanstack/react-router";
import { CertificateManagement } from "@/components/maintenance/CertificateManagement";

export const Route = createFileRoute("/maintenance/certificates/types")({
  head: () => ({ meta: [{ title: "Certificate Types - NuCare" }] }),
  component: () => <CertificateManagement initialTab="types" />,
});
