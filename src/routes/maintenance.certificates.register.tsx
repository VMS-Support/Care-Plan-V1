import { createFileRoute } from "@tanstack/react-router";
import { CertificateManagement } from "@/components/maintenance/CertificateManagement";

export const Route = createFileRoute("/maintenance/certificates/register")({
  head: () => ({ meta: [{ title: "Certificate Register - NuCare" }] }),
  component: () => <CertificateManagement initialTab="register" />,
});
